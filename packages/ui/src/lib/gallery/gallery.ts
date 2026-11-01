import {
  andesOverlayPreset,
  AndesOverlayContentPrimitive,
  AndesOverlayPrimitive,
  provideAndesOverlay,
  type AndesOverlayCloseReason,
} from '@andes-ng/primitives';
import { Directionality } from '@angular/cdk/bidi';
import { DOCUMENT, NgTemplateOutlet } from '@angular/common';
import {
  afterNextRender,
  afterRenderEffect,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChildren,
  effect,
  ElementRef,
  inject,
  Injector,
  input,
  linkedSignal,
  model,
  output,
  signal,
  type TemplateRef,
  untracked,
  viewChild,
  viewChildren,
  ViewEncapsulation,
} from '@angular/core';

import { AndesImageIcon, type AndesImageIconName } from '../image/image-icon';
import {
  ANDES_IMAGE_IDENTITY_TRANSFORM,
  clamp,
  imageTransformCss,
  isIdentityTransform,
} from '../image/image-transform';
import {
  resolvePreviewConfig,
  type AndesImageTransform,
  type AndesImageTransformEvent,
} from '../image/image-types';
import {
  andesCrossFade,
  andesDownloadImage,
  andesImageFileName,
  andesPrefersReducedMotion,
  ANDES_IMAGE_VIEWER_SCRIM,
  AndesImageViewerController,
} from '../image/image-viewer';
import { AndesGalleryItem } from './gallery-item';
import {
  ANDES_GALLERY_ACTIONS,
  normalizeGalleryImages,
  resolveGalleryLabels,
  type AndesGalleryAction,
  type AndesGalleryActions,
  type AndesGalleryContext,
  type AndesGalleryImage,
  type AndesGalleryImageContext,
  type AndesGalleryLabels,
  type AndesGallerySource,
  type AndesGalleryThumbnailContext,
  type AndesGalleryThumbnailPosition,
} from './gallery-types';

/** Class on the lightbox scrim; `gallery.css` retimes its fade. */
export const ANDES_GALLERY_BACKDROP_CLASS = 'andes-gallery-backdrop';
const PANE_CLASS = 'andes-gallery-pane';

/** Distance the arrow keys pan a zoomed image per press, in px. */
const KEY_PAN_STEP = 48;
/** Shortest slideshow interval, in ms, whatever `autoplayInterval` says. */
const MIN_AUTOPLAY_INTERVAL = 1000;

type LoadState = 'loading' | 'loaded' | 'error';

const ICONS: Readonly<
  Record<Exclude<AndesGalleryAction, 'fullscreen'>, AndesImageIconName>
> = {
  zoomOut: 'zoomOut',
  zoomIn: 'zoomIn',
  rotateLeft: 'rotateLeft',
  rotateRight: 'rotateRight',
  flipX: 'flipX',
  flipY: 'flipY',
  reset: 'reset',
  download: 'download',
};

function isTextEntry(element: EventTarget | null): boolean {
  if (!(element instanceof HTMLElement)) {
    return false;
  }
  return (
    element.isContentEditable ||
    element instanceof HTMLInputElement ||
    element instanceof HTMLTextAreaElement ||
    element instanceof HTMLSelectElement
  );
}

/**
 * An image viewer for a set of pictures: one picture on a dark stage with round previous /
 * next buttons at its sides, a toolbar at the top (zoom, rotate, flip, reset, download, full
 * screen), a counter, a caption, and a strip of thumbnails that keeps the active one in view.
 *
 * Inline it fills its container. With `[(fullscreen)]` it becomes a lightbox: a modal dialog
 * over a dark scrim, closed by Escape, its close button or a click beside the picture; with
 * `[inline]="false"` it shows only as a lightbox, opened from your own grid of thumbnails.
 *
 * ```html
 * <andes-gallery [images]="photos" [(activeIndex)]="index" />
 * ```
 *
 * It drives its stage with the image viewer's engine: wheel, button and keyboard zoom, drag to
 * pan, double click, pinch, and a swipe across a fitted picture to change image. Keyboard: the
 * arrow keys (or `PageUp` / `PageDown`) step, `Home` / `End` jump, `+` / `-` / `0` zoom; the
 * thumbnail strip is one tab stop, moved through with the arrow keys.
 */
@Component({
  selector: 'andes-gallery',
  imports: [AndesImageIcon, AndesOverlayContentPrimitive, NgTemplateOutlet],
  templateUrl: './gallery.html',
  styleUrl: './gallery.css',
  // The lightbox renders in the overlay container, outside this host: the stylesheet is
  // unencapsulated and every class is namespaced `andes-gallery*`.
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [provideAndesOverlay()],
  host: {
    class: 'andes-gallery-host',
    '[attr.data-slot]': '"gallery-host"',
    '[attr.data-inline]': 'inline() ? "" : null',
    '[attr.data-fullscreen]': 'fullscreen() ? "" : null',
  },
})
export class AndesGallery {
  protected readonly overlay = inject(AndesOverlayPrimitive);
  private readonly document = inject(DOCUMENT);
  private readonly directionality = inject(Directionality);
  private readonly host =
    inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly injector = inject(Injector);

  /** The pictures: URLs or {@link AndesGalleryImage}s. Without it, `andes-gallery-item`s. */
  readonly images = input<readonly AndesGallerySource[] | null>(null);
  /** 0-based index of the shown picture (`[(activeIndex)]`). */
  readonly activeIndex = model(0);
  /** Lightbox mode: the gallery over the whole page in a modal dialog (`[(fullscreen)]`). */
  readonly fullscreen = model(false);
  /** Render in place. `false` makes a lightbox-only gallery, shown while `fullscreen`. */
  readonly inline = input(true);
  /** Show the thumbnail strip. Default: on when there is more than one picture. */
  readonly thumbnails = input<boolean | null>(null);
  /** Where the strip sits; `start` / `end` are vertical strips. */
  readonly thumbnailPosition = input<AndesGalleryThumbnailPosition>('bottom');
  /** Toolbar buttons, in order; an empty list hides the toolbar. */
  readonly actions = input<readonly AndesGalleryAction[]>(
    ANDES_GALLERY_ACTIONS,
  );
  /** Wrap from the last picture to the first and back. */
  readonly loop = input(false);
  /**
   * Advance on a timer, wrapping at the end. It waits while the pointer is over an inline
   * gallery or focus is inside it, stops for good once the user steps, zooms or picks a
   * thumbnail, and a play / pause button is added to the toolbar. It starts paused when the
   * system asks for reduced motion.
   */
  readonly autoplay = input(false);
  /** Time each picture stays during autoplay, in ms. */
  readonly autoplayInterval = input(4000);
  /** Show the "3 / 30" counter. */
  readonly counter = input(true);
  /** Each zoom step multiplies the scale by `1 + scaleStep`. */
  readonly scaleStep = input(0.5);
  /** Smallest zoom factor; 1 fits the picture. */
  readonly minScale = input(1);
  /** Largest zoom factor. */
  readonly maxScale = input(50);
  /** Shown for any picture that fails to load and has no `fallback` of its own. */
  readonly fallback = input<string | null>(null);
  /** Replaces the picture on the stage; the zoom, rotation and flip still apply. */
  readonly imageTemplate = input<TemplateRef<AndesGalleryImageContext> | null>(
    null,
  );
  /** Replaces each thumbnail's content. */
  readonly thumbnailTemplate =
    input<TemplateRef<AndesGalleryThumbnailContext> | null>(null);
  /** Replaces the caption (by default the image's `title`). */
  readonly captionTemplate = input<TemplateRef<AndesGalleryContext> | null>(
    null,
  );
  /** Content at the start of the top bar, after the counter. */
  readonly headerTemplate = input<TemplateRef<AndesGalleryContext> | null>(
    null,
  );
  /** Content under the stage and the strip. */
  readonly footerTemplate = input<TemplateRef<AndesGalleryContext> | null>(
    null,
  );
  /** Localised strings; unset fields keep their English default. */
  readonly labels = input<AndesGalleryLabels | null>(null);

  /** The picture's zoom, rotation, flip or pan changed; `action` says why. */
  readonly transformChange = output<AndesImageTransformEvent>();
  /** The lightbox closed; `reason` says how. */
  readonly closed = output<AndesOverlayCloseReason>();

  private readonly items = contentChildren(AndesGalleryItem);

  protected readonly list = computed<readonly AndesGalleryImage[]>(() => {
    const own = normalizeGalleryImages(this.images());
    return own.length ? own : this.items().map((item) => item.image());
  });
  protected readonly total = computed(() => this.list().length);
  protected readonly index = computed(() =>
    clamp(
      Math.trunc(this.activeIndex()) || 0,
      0,
      Math.max(0, this.total() - 1),
    ),
  );
  protected readonly image = computed(() => this.list()[this.index()] ?? null);
  protected readonly text = computed(() => resolveGalleryLabels(this.labels()));
  protected readonly single = computed(() => this.total() < 2);
  protected readonly showStrip = computed(
    () => !this.single() && (this.thumbnails() ?? true),
  );
  protected readonly vertical = computed(() => {
    const position = this.thumbnailPosition();
    return position === 'start' || position === 'end';
  });
  protected readonly rendersInline = computed(
    () => this.inline() && !this.fullscreen(),
  );
  protected readonly limits = computed(() =>
    resolvePreviewConfig({
      scaleStep: this.scaleStep(),
      minScale: this.minScale(),
      maxScale: this.maxScale(),
    }),
  );

  private readonly usingFallback = linkedSignal<
    AndesGalleryImage | null,
    boolean
  >({ source: this.image, computation: () => false });

  protected readonly src = computed(() => {
    const image = this.image();
    if (!image) {
      return null;
    }
    if (this.usingFallback()) {
      return image.fallback || this.fallback() || null;
    }
    return image.src;
  });

  protected readonly loadState = linkedSignal<
    { src: string | null; custom: boolean },
    LoadState
  >({
    source: () => ({ src: this.src(), custom: !!this.imageTemplate() }),
    computation: ({ src, custom }) =>
      custom ? 'loaded' : src ? 'loading' : 'error',
  });

  /** Zoom, rotation, flip and pan of the shown picture; back to fit on every change. */
  protected readonly transform = linkedSignal<
    AndesGalleryImage | null,
    AndesImageTransform
  >({
    source: this.image,
    computation: () => ANDES_IMAGE_IDENTITY_TRANSFORM,
  });
  protected readonly css = computed(() => imageTransformCss(this.transform()));
  protected readonly ratio = computed(
    () => `${Math.round(this.transform().scale * 100)}%`,
  );

  private readonly stage = viewChild<ElementRef<HTMLElement>>('stage');
  private readonly picture = viewChild<ElementRef<HTMLElement>>('picture');
  private readonly strip = viewChild<ElementRef<HTMLElement>>('strip');
  private readonly thumbs =
    viewChildren<ElementRef<HTMLButtonElement>>('thumb');
  private readonly fullscreenButton =
    viewChild<ElementRef<HTMLButtonElement>>('fullscreenButton');
  private readonly lightbox = viewChild<TemplateRef<unknown>>('lightbox');

  private readonly viewer = new AndesImageViewerController(this.transform, {
    limits: () => ({ ...this.limits(), movable: true, wheel: true }),
    stage: () => this.stage()?.nativeElement,
    image: () => this.picture()?.nativeElement,
    isEmptyArea: (event) => this.isEmptyArea(event),
    rtl: () => this.rtl(),
    changed: (event) => this.transformChange.emit(event),
    swipe: (direction) => {
      this.userActed();
      this.step(direction);
    },
  });
  protected readonly zoomed = computed(() => this.viewer.zoomed());
  protected readonly canPan = computed(() => this.viewer.canPan());
  protected readonly dragging = computed(() => this.viewer.dragging());

  protected readonly leaving = andesCrossFade(
    () => ({
      key: this.index(),
      open: this.inline() || this.fullscreen(),
      src: this.src(),
      alt: this.image()?.alt ?? '',
      css: this.css(),
    }),
    () => this.reducedMotion(),
  );

  /** Whether the slideshow runs; user action stops it, the play button resumes it. */
  protected readonly playing = linkedSignal(
    () => this.autoplay() && !this.reducedMotion(),
  );
  private readonly hovered = signal(false);
  private readonly focusWithin = signal(false);
  /** The slideshow is advancing right now (not paused by hover or focus). */
  protected readonly advancing = computed(
    () =>
      this.playing() &&
      this.total() > 1 &&
      (this.fullscreen() || (!this.hovered() && !this.focusWithin())),
  );

  /** `x y` of the element the lightbox grows out of. */
  protected readonly originPoint = signal<string | null>(null);
  private failedThumbs = signal<ReadonlySet<string>>(new Set());
  private readonly preloaded = new Map<string, HTMLImageElement>();
  private openedFromInside = false;

  protected readonly toolbarActions = computed(() =>
    this.actions().filter(
      (action) =>
        action !== 'fullscreen' || (this.inline() && this.total() > 0),
    ),
  );
  /** The zoom ratio sits after zoom out, or before zoom in when there is no zoom out. */
  protected readonly ratioBefore = computed(() => {
    const actions = this.toolbarActions();
    return !actions.includes('zoomOut') && actions.includes('zoomIn');
  });
  protected readonly canPrevious = computed(
    () => this.total() > 1 && (this.loop() || this.index() > 0),
  );
  protected readonly canNext = computed(
    () => this.total() > 1 && (this.loop() || this.index() < this.total() - 1),
  );
  protected readonly position = computed(() =>
    this.text().position(this.index() + 1, this.total()),
  );
  protected readonly announcement = computed(() => {
    const image = this.image();
    if (!image || this.single()) {
      return '';
    }
    const description = image.title || image.alt;
    return description ? `${this.position()}: ${description}` : this.position();
  });

  /** What templates can call. */
  protected readonly actionsApi: AndesGalleryActions = {
    previous: () => this.previous(),
    next: () => this.next(),
    goTo: (index) => this.goTo(index),
    zoomIn: () => this.run('zoomIn'),
    zoomOut: () => this.run('zoomOut'),
    rotateLeft: () => this.run('rotateLeft'),
    rotateRight: () => this.run('rotateRight'),
    flipX: () => this.run('flipX'),
    flipY: () => this.run('flipY'),
    reset: () => this.run('reset'),
    download: () => this.download(),
    toggleFullscreen: () => this.toggleFullscreen(),
    togglePlay: () => this.togglePlay(),
  };

  protected readonly context = computed<AndesGalleryContext | null>(() => {
    const image = this.image();
    return image
      ? {
          $implicit: image,
          image,
          index: this.index(),
          total: this.total(),
          fullscreen: this.fullscreen(),
          actions: this.actionsApi,
        }
      : null;
  });
  protected readonly imageContext = computed<AndesGalleryImageContext | null>(
    () => {
      const image = this.image();
      return image
        ? {
            $implicit: image,
            image,
            index: this.index(),
            total: this.total(),
            transform: this.transform(),
          }
        : null;
    },
  );

  constructor() {
    this.overlay.configure({
      ...andesOverlayPreset('dialog'),
      closeOnOutsideClick: false,
      panelClass: PANE_CLASS,
      backdropClass: ANDES_GALLERY_BACKDROP_CLASS,
      size: { width: '100%', height: '100%' },
    });

    effect(() => {
      const wantsOpen = this.fullscreen();
      const template = this.lightbox();
      const total = this.total();
      untracked(() => this.syncLightbox(wantsOpen, template, total));
    });

    this.overlay.closed.subscribe((reason) => {
      this.fullscreen.set(false);
      this.closed.emit(reason);
      if (this.openedFromInside) {
        this.openedFromInside = false;
        // The inline gallery is drawn again after the lightbox; its fullscreen button (the
        // opener, now a new element) takes the focus back.
        afterNextRender(
          () =>
            (
              this.fullscreenButton()?.nativeElement ??
              this.stage()?.nativeElement
            )?.focus(),
          { injector: this.injector },
        );
      }
    });

    // The slideshow: one timer per picture, restarted by every change.
    effect((onCleanup) => {
      if (!this.advancing()) {
        return;
      }
      this.index();
      const delay = Math.max(
        MIN_AUTOPLAY_INTERVAL,
        Number(this.autoplayInterval()) || 0,
      );
      const timer = setTimeout(() => this.advance(), delay);
      onCleanup(() => clearTimeout(timer));
    });

    // The neighbours load ahead, so stepping shows them at once.
    effect(() => {
      const list = this.list();
      const index = this.index();
      const wrap = this.loop() || this.autoplay();
      untracked(() => this.preloadAround(list, index, wrap));
    });

    // Keeps the active thumbnail inside the strip's visible part.
    afterRenderEffect({
      write: () => {
        const index = this.index();
        const strip = this.strip()?.nativeElement;
        const thumb = this.thumbs()[index]?.nativeElement;
        if (strip && thumb) {
          untracked(() => this.revealThumbnail(strip, thumb));
        }
      },
    });
  }

  /** Shows the next picture; wraps only with `loop`. */
  next(): void {
    this.step(1);
  }

  /** Shows the previous picture; wraps only with `loop`. */
  previous(): void {
    this.step(-1);
  }

  /** Shows the picture at a 0-based index. */
  goTo(index: number): void {
    if (this.total() > 0) {
      this.activeIndex.set(clamp(Math.trunc(index), 0, this.total() - 1));
    }
  }

  /** Opens the lightbox, on `index` when given. */
  open(index?: number): void {
    if (index !== undefined) {
      this.goTo(index);
    }
    this.fullscreen.set(true);
  }

  /** Closes the lightbox. */
  close(reason: AndesOverlayCloseReason = 'close-button'): void {
    this.overlay.close(reason);
  }

  /** Saves the shown picture as it is stored. */
  async download(): Promise<void> {
    const image = this.image();
    const url = this.src();
    if (!image || !url) {
      return;
    }
    this.userActed();
    await andesDownloadImage(
      this.document,
      url,
      andesImageFileName(url, image.name),
    );
    this.transformChange.emit({
      transform: this.transform(),
      action: 'download',
    });
  }

  protected run(action: AndesGalleryAction): void {
    this.userActed();
    switch (action) {
      case 'zoomIn':
        return this.viewer.zoomIn();
      case 'zoomOut':
        return this.viewer.zoomOut();
      case 'rotateLeft':
        return this.viewer.rotate(-1);
      case 'rotateRight':
        return this.viewer.rotate(1);
      case 'flipX':
        return this.viewer.flip('x');
      case 'flipY':
        return this.viewer.flip('y');
      case 'reset':
        return this.viewer.reset();
      case 'download':
        void this.download();
        return;
      case 'fullscreen':
        return this.toggleFullscreen();
    }
  }

  protected icon(action: AndesGalleryAction): AndesImageIconName {
    if (action === 'fullscreen') {
      return this.fullscreen() ? 'fullscreenExit' : 'fullscreen';
    }
    return ICONS[action];
  }

  protected label(action: AndesGalleryAction): string {
    const text = this.text();
    if (action === 'fullscreen') {
      return this.fullscreen() ? text.exitFullscreen : text.fullscreen;
    }
    return text[action];
  }

  protected actionDisabled(action: AndesGalleryAction): boolean {
    const transform = this.transform();
    const limits = this.limits();
    switch (action) {
      case 'zoomIn':
        return transform.scale >= limits.maxScale;
      case 'zoomOut':
        return transform.scale <= limits.minScale;
      case 'reset':
        return isIdentityTransform(transform);
      default:
        return false;
    }
  }

  protected toggleFullscreen(): void {
    if (!this.inline()) {
      this.close();
      return;
    }
    this.fullscreen.update((open) => !open);
  }

  protected togglePlay(): void {
    this.playing.update((playing) => !playing);
  }

  protected onNav(delta: 1 | -1): void {
    this.userActed();
    this.step(delta);
  }

  protected select(index: number, focus = false): void {
    this.userActed();
    this.goTo(index);
    if (focus) {
      afterNextRender(
        () =>
          this.thumbs()[index]?.nativeElement.focus({ preventScroll: true }),
        { injector: this.injector },
      );
    }
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (
      event.defaultPrevented ||
      event.ctrlKey ||
      event.metaKey ||
      event.altKey ||
      isTextEntry(event.target)
    ) {
      return;
    }
    const key = event.key;
    let handled = true;
    switch (key) {
      case '+':
      case '=':
        this.viewer.zoomBy(1, 'keyboard');
        break;
      case '-':
      case '_':
        this.viewer.zoomBy(-1, 'keyboard');
        break;
      case '0':
        this.viewer.reset();
        break;
      case 'Home':
        this.goTo(0);
        break;
      case 'End':
        this.goTo(this.total() - 1);
        break;
      case 'PageUp':
        this.step(-1);
        break;
      case 'PageDown':
        this.step(1);
        break;
      case 'ArrowLeft':
      case 'ArrowRight':
      case 'ArrowUp':
      case 'ArrowDown': {
        const dx =
          key === 'ArrowLeft'
            ? KEY_PAN_STEP
            : key === 'ArrowRight'
              ? -KEY_PAN_STEP
              : 0;
        const dy =
          key === 'ArrowUp'
            ? KEY_PAN_STEP
            : key === 'ArrowDown'
              ? -KEY_PAN_STEP
              : 0;
        if (this.viewer.panBy(dx, dy, 'keyboard')) {
          break;
        }
        if (key === 'ArrowLeft' || key === 'ArrowRight') {
          this.step((key === 'ArrowRight') !== this.rtl() ? 1 : -1);
        } else {
          handled = false;
        }
        break;
      }
      default:
        handled = false;
    }
    if (handled) {
      event.preventDefault();
      this.userActed();
    }
  }

  /** Arrow keys walk the strip (one tab stop); the picture follows the focus. */
  protected onStripKeydown(event: KeyboardEvent): void {
    const vertical = this.vertical();
    const forward = this.rtl() && !vertical ? -1 : 1;
    let target: number | null = null;
    switch (event.key) {
      case 'ArrowRight':
        target = vertical ? null : this.index() + forward;
        break;
      case 'ArrowLeft':
        target = vertical ? null : this.index() - forward;
        break;
      case 'ArrowDown':
        target = vertical ? this.index() + 1 : null;
        break;
      case 'ArrowUp':
        target = vertical ? this.index() - 1 : null;
        break;
      case 'Home':
        target = 0;
        break;
      case 'End':
        target = this.total() - 1;
        break;
    }
    if (target === null) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    if (this.loop()) {
      target = (target + this.total()) % this.total();
    }
    this.select(clamp(target, 0, this.total() - 1), true);
  }

  protected onWheel(event: WheelEvent): void {
    this.userActed();
    this.viewer.onWheel(event);
  }

  protected onPointerDown(event: PointerEvent): void {
    this.viewer.onPointerDown(event);
  }

  protected onPointerMove(event: PointerEvent): void {
    this.viewer.onPointerMove(event);
  }

  protected onPointerEnd(event: PointerEvent): void {
    this.viewer.onPointerEnd(event);
  }

  protected onDoubleClick(event: MouseEvent): void {
    this.userActed();
    this.viewer.onDoubleClick(event);
  }

  /** A click beside the picture closes the lightbox, like a click on a scrim. */
  protected onStageClick(event: MouseEvent): void {
    const press = this.viewer.takeClick();
    if (
      this.fullscreen() &&
      !press.suppressed &&
      press.pressedOnEmptyArea &&
      this.isEmptyArea(event)
    ) {
      this.close('backdrop-click');
    }
  }

  /**
   * Escape on the lightbox stage closes it and stops there, so an overlay underneath (a dialog
   * the lightbox was opened from) does not receive the same key.
   */
  protected onStageEscape(event: Event): void {
    if (this.fullscreen()) {
      event.stopPropagation();
      event.preventDefault();
      this.close('escape-key');
    }
  }

  protected onLoad(): void {
    this.loadState.set('loaded');
    this.viewer.settle();
  }

  protected onError(): void {
    const image = this.image();
    if (!this.usingFallback() && (image?.fallback || this.fallback())) {
      this.usingFallback.set(true);
      return;
    }
    this.loadState.set('error');
  }

  protected onThumbError(src: string): void {
    this.failedThumbs.update((failed) => new Set(failed).add(src));
  }

  protected thumbFailed(src: string): boolean {
    return this.failedThumbs().has(src);
  }

  protected thumbSrc(image: AndesGalleryImage): string {
    return image.thumbnail || image.src;
  }

  protected thumbLabel(image: AndesGalleryImage, index: number): string {
    const position = this.text().position(index + 1, this.total());
    const description = image.title || image.alt;
    return description ? `${position}: ${description}` : position;
  }

  protected onLeft(): void {
    this.leaving.set(null);
  }

  protected setHovered(hovered: boolean): void {
    this.hovered.set(hovered);
  }

  protected onFocusChange(event: FocusEvent, entering: boolean): void {
    if (entering) {
      this.focusWithin.set(true);
      return;
    }
    const next = event.relatedTarget as Node | null;
    const section = event.currentTarget as HTMLElement;
    this.focusWithin.set(!!next && section.contains(next));
  }

  protected step(delta: number): void {
    const total = this.total();
    if (total < 2) {
      return;
    }
    let next = this.index() + delta;
    if (next < 0 || next >= total) {
      if (!this.loop()) {
        return;
      }
      next = (next + total) % total;
    }
    this.activeIndex.set(next);
  }

  /** Autoplay always wraps, whatever `loop` says. */
  private advance(): void {
    const total = this.total();
    if (total > 1) {
      this.activeIndex.set((this.index() + 1) % total);
    }
  }

  /** Any step, zoom or pick by the user ends the slideshow. */
  private userActed(): void {
    if (untracked(this.playing)) {
      this.playing.set(false);
    }
  }

  private syncLightbox(
    wantsOpen: boolean,
    template: TemplateRef<unknown> | undefined,
    total: number,
  ): void {
    if (!wantsOpen) {
      this.overlay.close();
      return;
    }
    if (!template || this.overlay.isOpen()) {
      return;
    }
    if (total === 0) {
      this.fullscreen.set(false);
      return;
    }
    const active = this.document.activeElement;
    this.openedFromInside = !!active && this.host.contains(active);
    this.originPoint.set(this.measureOrigin(active));
    this.overlay.open(template);
    this.overlay
      .backdropElement()
      ?.style.setProperty('background', ANDES_IMAGE_VIEWER_SCRIM);
  }

  /** The lightbox grows out of what opened it: a thumbnail, or the inline gallery. */
  private measureOrigin(active: Element | null): string | null {
    const origin = active && active !== this.document.body ? active : this.host;
    const rect = origin.getBoundingClientRect();
    if (!rect.width || !rect.height) {
      return null;
    }
    return `${Math.round(rect.left + rect.width / 2)}px ${Math.round(
      rect.top + rect.height / 2,
    )}px`;
  }

  private preloadAround(
    list: readonly AndesGalleryImage[],
    index: number,
    wrap: boolean,
  ): void {
    const total = list.length;
    if (total < 2 || typeof this.document.defaultView?.Image !== 'function') {
      return;
    }
    for (const delta of [1, -1]) {
      let neighbour = index + delta;
      if (neighbour < 0 || neighbour >= total) {
        if (!wrap) {
          continue;
        }
        neighbour = (neighbour + total) % total;
      }
      const src = list[neighbour].src;
      if (this.preloaded.has(src)) {
        continue;
      }
      const image = this.document.createElement('img');
      image.decoding = 'async';
      image.src = src;
      this.preloaded.set(src, image);
    }
  }

  private revealThumbnail(strip: HTMLElement, thumb: HTMLElement): void {
    if (typeof strip.scrollBy !== 'function') {
      return;
    }
    const stripRect = strip.getBoundingClientRect();
    const thumbRect = thumb.getBoundingClientRect();
    const behavior = this.reducedMotion() ? 'auto' : 'smooth';
    // Centre the active thumbnail when it is (partly) out of view.
    if (this.vertical()) {
      if (
        thumbRect.top < stripRect.top ||
        thumbRect.bottom > stripRect.bottom
      ) {
        const delta =
          thumbRect.top +
          thumbRect.height / 2 -
          (stripRect.top + stripRect.height / 2);
        strip.scrollBy({ top: delta, behavior });
      }
      return;
    }
    if (thumbRect.left < stripRect.left || thumbRect.right > stripRect.right) {
      const delta =
        thumbRect.left +
        thumbRect.width / 2 -
        (stripRect.left + stripRect.width / 2);
      strip.scrollBy({ left: delta, behavior });
    }
  }

  private isEmptyArea(event: Event): boolean {
    const target = event.target as HTMLElement | null;
    return (
      target === event.currentTarget ||
      !!target?.classList.contains('andes-gallery__canvas')
    );
  }

  private rtl(): boolean {
    return this.directionality.value === 'rtl';
  }

  private reducedMotion(): boolean {
    return andesPrefersReducedMotion(this.document);
  }
}
