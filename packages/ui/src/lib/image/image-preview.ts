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
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  linkedSignal,
  model,
  output,
  signal,
  type TemplateRef,
  untracked,
  ViewEncapsulation,
  viewChild,
} from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideChevronLeft,
  lucideChevronRight,
  lucideDownload,
  lucideFlipHorizontal2,
  lucideFlipVertical2,
  lucideImageOff,
  lucideRotateCcw,
  lucideRotateCw,
  lucideUndo2,
  lucideX,
  lucideZoomIn,
  lucideZoomOut,
} from '@ng-icons/lucide';

import {
  ANDES_IMAGE_IDENTITY_TRANSFORM,
  clamp,
  imageTransformCss,
  isIdentityTransform,
} from './image-transform';
import {
  resolveImageLabels,
  resolvePreviewConfig,
  type AndesImageClassNames,
  type AndesImageCountContext,
  type AndesImageExtraActionsContext,
  type AndesImageLabels,
  type AndesImagePreviewAction,
  type AndesImagePreviewActions,
  type AndesImagePreviewConfig,
  type AndesImagePreviewItem,
  type AndesImageRenderContext,
  type AndesImageStyles,
  type AndesImageToolbarContext,
  type AndesImageTransform,
  type AndesImageTransformEvent,
} from './image-types';
import {
  andesCrossFade,
  andesDownloadImage,
  andesImageFileName,
  andesPrefersReducedMotion,
  ANDES_IMAGE_VIEWER_SCRIM,
  AndesImageViewerController,
} from './image-viewer';

/** Class on the scrim; `image-preview.css` retimes its fade and adds the blur variant. */
export const ANDES_IMAGE_PREVIEW_BACKDROP_CLASS =
  'andes-image-preview-backdrop';
const BACKDROP_BLUR_CLASS = 'andes-image-preview-backdrop--blur';
const PANE_CLASS = 'andes-image-preview-pane';

/** Distance the arrow keys pan a zoomed image per press, in px. */
const KEY_PAN_STEP = 48;

/** The lucide glyph each toolbar action draws. */
const ACTION_ICONS: Readonly<Record<AndesImagePreviewAction, string>> = {
  zoomOut: 'lucideZoomOut',
  zoomIn: 'lucideZoomIn',
  rotateLeft: 'lucideRotateCcw',
  rotateRight: 'lucideRotateCw',
  flipX: 'lucideFlipHorizontal2',
  flipY: 'lucideFlipVertical2',
  reset: 'lucideUndo2',
  download: 'lucideDownload',
};

const SHORTCUTS: Readonly<Record<AndesImagePreviewAction, string>> = {
  zoomIn: '+',
  zoomOut: '-',
  rotateLeft: 'Shift+R [',
  rotateRight: 'R ]',
  flipX: 'H',
  flipY: 'V',
  reset: '0',
  download: '',
};

type LoadState = 'loading' | 'loaded' | 'error';

/**
 * The full-viewport image viewer behind `andes-image` and `andes-image-group`.
 *
 * It renders nothing in place: when `open` turns true it shows a modal overlay (focus is
 * trapped and returned, Escape closes, the page behind is inert) with the image centred, a
 * toolbar (zoom, rotate, flip, reset, download), a close button and, for more than one
 * item, previous/next buttons with a "2 / 5" counter.
 *
 * Use it directly to preview images that have no thumbnail on the page:
 *
 * ```html
 * <andes-image-preview [items]="photos" [(open)]="open" [(current)]="index" />
 * ```
 *
 * Keyboard (when `keyboard` is on): `+` / `-` zoom, `0` reset, `R` / `Shift+R` rotate,
 * `H` / `V` flip, `PageUp` / `PageDown` previous / next, `Home` / `End` first / last, and
 * the arrow keys step through items - or pan, while the image is zoomed.
 */
@Component({
  selector: 'andes-image-preview',
  viewProviders: [
    provideIcons({
      lucideImageOff,
      lucideX,
      lucideChevronLeft,
      lucideChevronRight,
      lucideZoomOut,
      lucideZoomIn,
      lucideRotateCcw,
      lucideRotateCw,
      lucideFlipHorizontal2,
      lucideFlipVertical2,
      lucideUndo2,
      lucideDownload,
    }),
  ],
  imports: [NgIcon, AndesOverlayContentPrimitive, NgTemplateOutlet],
  templateUrl: './image-preview.html',
  styleUrl: './image-preview.css',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [provideAndesOverlay()],
  host: {
    class: 'andes-image-preview-host',
    '[attr.data-slot]': '"image-preview-host"',
    '[attr.data-state]': 'overlay.isOpen() ? "open" : "closed"',
  },
})
export class AndesImagePreview {
  /** The lucide glyph of each toolbar action. */
  protected readonly actionIcons = ACTION_ICONS;

  protected readonly overlay = inject(AndesOverlayPrimitive);
  private readonly document = inject(DOCUMENT);
  private readonly directionality = inject(Directionality);

  /** The images to browse. */
  readonly items = input<readonly AndesImagePreviewItem[]>([]);
  /** Whether the viewer is open (`[(open)]`). */
  readonly open = model(false);
  /** 0-based index of the shown item (`[(current)]`). */
  readonly current = model(0);
  /** Behaviour of the viewer; see {@link AndesImagePreviewConfig}. */
  readonly config = input<AndesImagePreviewConfig | null>(null);
  /** Localised strings; unset fields keep their English default. */
  readonly labels = input<AndesImageLabels | null>(null);
  /** Classes for the viewer's parts (`viewer`, `toolbar`, `viewerImage`, `counter`). */
  readonly classNames = input<AndesImageClassNames | null>(null);
  /** Inline styles for the same parts. */
  readonly styles = input<AndesImageStyles | null>(null);
  /**
   * The element the viewer grows out of when it opens and shrinks back into when it closes,
   * usually the thumbnail. Without one, the viewer zooms from the centre of the screen.
   */
  readonly origin = input<HTMLElement | null>(null);

  /** The transform changed; `action` says why. */
  readonly transformChange = output<AndesImageTransformEvent>();
  /** The viewer finished opening. */
  readonly opened = output<void>();
  /** The viewer closed (after its exit animation); `reason` says how. */
  readonly closed = output<AndesOverlayCloseReason>();

  protected readonly cfg = computed(() => resolvePreviewConfig(this.config()));
  protected readonly text = computed(() => resolveImageLabels(this.labels()));
  protected readonly total = computed(() => this.items().length);
  protected readonly index = computed(() =>
    clamp(Math.trunc(this.current()) || 0, 0, Math.max(0, this.total() - 1)),
  );
  protected readonly item = computed(() => this.items()[this.index()] ?? null);

  /** Pan / zoom / rotate / flip of the shown image; resets whenever the item changes. */
  protected readonly transform = linkedSignal<
    AndesImagePreviewItem | null,
    AndesImageTransform
  >({
    source: this.item,
    computation: () => ANDES_IMAGE_IDENTITY_TRANSFORM,
  });

  private readonly usingFallback = linkedSignal<
    AndesImagePreviewItem | null,
    boolean
  >({ source: this.item, computation: () => false });

  protected readonly src = computed(() => {
    const item = this.item();
    if (!item) {
      return null;
    }
    return this.usingFallback() && item.fallback ? item.fallback : item.src;
  });

  /** A custom `imageTemplate` has no load event to wait for: it counts as loaded. */
  protected readonly loadState = linkedSignal<
    { src: string | null; custom: boolean },
    LoadState
  >({
    source: () => ({ src: this.src(), custom: !!this.cfg().imageTemplate }),
    computation: ({ src, custom }) =>
      custom ? 'loaded' : src ? 'loading' : 'error',
  });

  protected readonly dragging = computed(() => this.viewer.dragging());

  /** `x y` of the origin element's centre on screen, the viewer's transform origin. */
  protected readonly originPoint = signal<string | null>(null);

  /**
   * The previous picture while it fades out under the next one. It keeps the transform it had,
   * so a zoomed image fades where it was rather than jumping back to fit first.
   */
  protected readonly leaving = andesCrossFade(
    () => ({
      key: this.index(),
      open: this.open(),
      src: this.src(),
      alt: this.item()?.alt ?? '',
      css: this.css(),
    }),
    () => andesPrefersReducedMotion(this.document),
  );

  protected readonly parts = computed(() => ({
    classNames: this.classNames() ?? {},
    styles: this.styles() ?? {},
  }));

  protected readonly css = computed(() => imageTransformCss(this.transform()));
  /** "150%": the zoom factor as the toolbar shows it. */
  protected readonly ratio = computed(
    () => `${Math.round(this.transform().scale * 100)}%`,
  );
  /** The ratio sits after zoom out (between the two zoom buttons), or before zoom in. */
  protected readonly ratioAfter = computed(() => {
    const config = this.cfg();
    return config.zoomRatio && this.toolbarActions().includes('zoomOut')
      ? 'zoomOut'
      : null;
  });
  protected readonly ratioBefore = computed(() => {
    const config = this.cfg();
    const actions = this.toolbarActions();
    return config.zoomRatio &&
      !actions.includes('zoomOut') &&
      actions.includes('zoomIn')
      ? 'zoomIn'
      : null;
  });
  protected readonly zoomed = computed(() => this.viewer.zoomed());
  protected readonly canPan = computed(() => this.viewer.canPan());
  protected readonly canPanByKey = computed(() => this.viewer.canPanByKey());
  protected readonly canPrevious = computed(
    () => this.total() > 1 && (this.cfg().loop || this.index() > 0),
  );
  protected readonly canNext = computed(
    () =>
      this.total() > 1 && (this.cfg().loop || this.index() < this.total() - 1),
  );
  protected readonly toolbarActions = computed(() =>
    this.cfg().actions.filter((action) => action in SHORTCUTS),
  );
  protected readonly dialogLabel = computed(() => {
    const alt = this.item()?.alt;
    const dialog = this.text().dialog;
    return alt ? `${dialog}: ${alt}` : dialog;
  });
  protected readonly announcement = computed(() => {
    if (this.total() < 2) {
      return '';
    }
    const alt = this.item()?.alt;
    const position = this.text().position(this.index() + 1, this.total());
    return alt ? `${position}: ${alt}` : position;
  });
  protected readonly countContext = computed<AndesImageCountContext>(() => ({
    $implicit: this.index() + 1,
    current: this.index() + 1,
    total: this.total(),
  }));
  /** What a custom toolbar or the built-in one can call. */
  protected readonly actions: AndesImagePreviewActions = {
    zoomIn: () => this.zoomIn(),
    zoomOut: () => this.zoomOut(),
    rotateLeft: () => this.rotate(-1),
    rotateRight: () => this.rotate(1),
    flipX: () => this.flip('x'),
    flipY: () => this.flip('y'),
    reset: () => this.reset(),
    download: () => this.download(),
    previous: () => this.previous(),
    next: () => this.next(),
    goTo: (index) => this.goTo(index),
    close: () => this.close(),
  };
  protected readonly renderContext = computed<AndesImageRenderContext | null>(
    () => {
      const item = this.item();
      return item
        ? {
            $implicit: item,
            item,
            index: this.index(),
            total: this.total(),
            transform: this.transform(),
          }
        : null;
    },
  );
  protected readonly extraContext =
    computed<AndesImageExtraActionsContext | null>(() => {
      const item = this.item();
      return item
        ? {
            $implicit: item,
            item,
            index: this.index(),
            total: this.total(),
            transform: this.transform(),
            close: () => this.close(),
          }
        : null;
    });

  private readonly surface = viewChild<TemplateRef<unknown>>('surface');
  private readonly defaultToolbar =
    viewChild<TemplateRef<unknown>>('defaultToolbar');
  private readonly stage = viewChild<ElementRef<HTMLElement>>('stage');
  /** The transformed element: the `<img>`, or the box around an `imageTemplate`. */
  private readonly image = viewChild<ElementRef<HTMLElement>>('image');

  protected readonly toolbarContext = computed<AndesImageToolbarContext | null>(
    () => {
      const item = this.item();
      const defaultToolbar = this.defaultToolbar();
      if (!item || !defaultToolbar) {
        return null;
      }
      const image = this.image()?.nativeElement;
      return {
        $implicit: this.actions,
        actions: this.actions,
        item,
        index: this.index(),
        total: this.total(),
        transform: this.transform(),
        image: image instanceof HTMLImageElement ? image : null,
        disabled: (action) => this.actionDisabled(action),
        defaultToolbar,
      };
    },
  );

  /** Zoom, rotate, flip, pan, pinch and swipe: the gestures shared with the gallery. */
  private readonly viewer = new AndesImageViewerController(this.transform, {
    limits: () => this.cfg(),
    stage: () => this.stage()?.nativeElement,
    image: () => this.image()?.nativeElement,
    isEmptyArea: (event) => this.isEmptyArea(event),
    rtl: () => this.directionality.value === 'rtl',
    changed: (event) => this.transformChange.emit(event),
    swipe: (direction) => this.step(direction),
  });

  constructor() {
    this.overlay.configure({
      ...andesOverlayPreset('dialog'),
      closeOnOutsideClick: false,
      panelClass: PANE_CLASS,
      backdropClass: ANDES_IMAGE_PREVIEW_BACKDROP_CLASS,
      size: { width: '100%', height: '100%' },
    });

    effect(() => {
      const config = this.cfg();
      this.overlay.configure({
        hasBackdrop: config.scrim,
        closeOnEscape: config.closeOnEscape,
        backdropClass: config.scrimBlur
          ? [ANDES_IMAGE_PREVIEW_BACKDROP_CLASS, BACKDROP_BLUR_CLASS]
          : ANDES_IMAGE_PREVIEW_BACKDROP_CLASS,
      });
    });

    effect(() => {
      const wantsOpen = this.open();
      const template = this.surface();
      const total = this.total();
      untracked(() => {
        if (!wantsOpen) {
          this.overlay.close();
          return;
        }
        if (!template) {
          return;
        }
        if (total === 0) {
          this.open.set(false);
          return;
        }
        if (!this.overlay.isOpen()) {
          this.transform.set(ANDES_IMAGE_IDENTITY_TRANSFORM);
          this.originPoint.set(this.measureOrigin());
        }
        this.overlay.open(template);
        this.overlay
          .backdropElement()
          ?.style.setProperty('background', ANDES_IMAGE_VIEWER_SCRIM);
      });
    });

    // Paging moves the point the viewer shrinks back into to the thumbnail now shown.
    effect(() => {
      this.index();
      this.origin();
      untracked(() => {
        if (this.overlay.isOpen()) {
          this.originPoint.set(this.measureOrigin());
        }
      });
    });

    // Shortcuts work wherever focus is inside the viewer (stage, toolbar, nav buttons).
    this.overlay.keydownEvents.subscribe((event) => this.onKeydown(event));
    this.overlay.opened.subscribe(() => this.opened.emit());
    this.overlay.closed.subscribe((reason) => {
      this.open.set(false);
      this.closed.emit(reason);
    });
  }

  /** Opens the viewer at `index` (default: the current one). */
  show(index?: number): void {
    if (index !== undefined) {
      this.current.set(index);
    }
    this.open.set(true);
  }

  /** Closes the viewer. */
  close(reason: AndesOverlayCloseReason = 'close-button'): void {
    this.overlay.close(reason);
  }

  /** Shows the next item; wraps only with `loop`. */
  next(): void {
    this.step(1);
  }

  /** Shows the previous item; wraps only with `loop`. */
  previous(): void {
    this.step(-1);
  }

  /** Zooms in one step. */
  zoomIn(): void {
    this.viewer.zoomIn();
  }

  /** Zooms out one step. */
  zoomOut(): void {
    this.viewer.zoomOut();
  }

  /** Rotates a quarter turn: positive is clockwise. */
  rotate(direction: 1 | -1): void {
    this.viewer.rotate(direction);
  }

  /** Mirrors the image on the horizontal (`'x'`) or vertical (`'y'`) screen axis. */
  flip(axis: 'x' | 'y'): void {
    this.viewer.flip(axis);
  }

  /** Back to fit-to-viewport, unrotated, unmirrored. */
  reset(): void {
    this.viewer.reset();
  }

  /** Saves the shown image, through a blob where the browser allows it. */
  async download(): Promise<void> {
    const item = this.item();
    const url = this.src();
    if (!item || !url) {
      return;
    }
    await andesDownloadImage(
      this.document,
      url,
      andesImageFileName(url, item.name),
    );
    this.transformChange.emit({
      transform: this.transform(),
      action: 'download',
    });
  }

  protected run(action: AndesImagePreviewAction): void {
    switch (action) {
      case 'zoomIn':
        return this.zoomIn();
      case 'zoomOut':
        return this.zoomOut();
      case 'rotateLeft':
        return this.rotate(-1);
      case 'rotateRight':
        return this.rotate(1);
      case 'flipX':
        return this.flip('x');
      case 'flipY':
        return this.flip('y');
      case 'reset':
        return this.reset();
      case 'download':
        void this.download();
    }
  }

  protected actionDisabled(action: AndesImagePreviewAction): boolean {
    const transform = this.transform();
    const config = this.cfg();
    switch (action) {
      case 'zoomIn':
        return transform.scale >= config.maxScale;
      case 'zoomOut':
        return transform.scale <= config.minScale;
      case 'reset':
        return isIdentityTransform(transform);
      default:
        return false;
    }
  }

  protected shortcut(action: AndesImagePreviewAction): string | null {
    return SHORTCUTS[action] || null;
  }

  /** The fading-out picture finished: drop it. */
  protected onLeft(): void {
    this.leaving.set(null);
  }

  protected step(delta: number): void {
    const total = this.total();
    if (total < 2) {
      return;
    }
    let next = this.index() + delta;
    if (next < 0 || next >= total) {
      if (!this.cfg().loop) {
        return;
      }
      next = (next + total) % total;
    }
    this.current.set(next);
  }

  protected goTo(index: number): void {
    if (this.total() > 0) {
      this.current.set(clamp(index, 0, this.total() - 1));
    }
  }

  protected onLoad(): void {
    this.loadState.set('loaded');
    this.viewer.settle();
  }

  protected onError(): void {
    const item = this.item();
    if (item?.fallback && !this.usingFallback()) {
      this.usingFallback.set(true);
      return;
    }
    this.loadState.set('error');
  }

  private onKeydown(event: KeyboardEvent): void {
    const config = this.cfg();
    if (
      !config.keyboard ||
      event.defaultPrevented ||
      event.ctrlKey ||
      event.metaKey ||
      event.altKey
    ) {
      return;
    }

    const rtl = this.directionality.value === 'rtl';
    const key = event.key;
    const lower = key.length === 1 ? key.toLowerCase() : key;
    let handled = true;

    switch (lower) {
      case '+':
      case '=':
        this.viewer.zoomBy(1, 'keyboard');
        break;
      case '-':
      case '_':
        this.viewer.zoomBy(-1, 'keyboard');
        break;
      case '0':
        this.reset();
        break;
      case 'r':
        this.rotate(event.shiftKey ? -1 : 1);
        break;
      case '[':
        this.rotate(-1);
        break;
      case ']':
        this.rotate(1);
        break;
      case 'h':
        this.flip('x');
        break;
      case 'v':
        this.flip('y');
        break;
      case 'PageUp':
        this.previous();
        break;
      case 'PageDown':
        this.next();
        break;
      case 'Home':
        this.goTo(0);
        break;
      case 'End':
        this.goTo(this.total() - 1);
        break;
      case 'ArrowLeft':
      case 'ArrowRight':
      case 'ArrowUp':
      case 'ArrowDown': {
        if (this.canPanByKey()) {
          const dx =
            lower === 'ArrowLeft'
              ? KEY_PAN_STEP
              : lower === 'ArrowRight'
                ? -KEY_PAN_STEP
                : 0;
          const dy =
            lower === 'ArrowUp'
              ? KEY_PAN_STEP
              : lower === 'ArrowDown'
                ? -KEY_PAN_STEP
                : 0;
          this.viewer.panBy(dx, dy, 'keyboard');
        } else if (lower === 'ArrowLeft' || lower === 'ArrowRight') {
          const toward = (lower === 'ArrowRight') !== rtl ? 1 : -1;
          this.step(toward);
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
    }
  }

  protected onWheel(event: WheelEvent): void {
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

  protected onStageClick(event: MouseEvent): void {
    const press = this.viewer.takeClick();
    if (
      press.suppressed ||
      !press.pressedOnEmptyArea ||
      !this.isEmptyArea(event) ||
      !this.cfg().closeOnScrimClick
    ) {
      return;
    }
    this.close('backdrop-click');
  }

  /**
   * Escape from the stage: the keyboard counterpart of clicking its empty area. The event
   * stops here: closing has already released this overlay's keyboard subscription, so letting
   * it bubble on would hand the same Escape to the overlay underneath (a dialog the viewer was
   * opened from) and close that too.
   */
  protected onStageEscape(event: Event): void {
    if (this.cfg().closeOnEscape) {
      event.stopPropagation();
      event.preventDefault();
      this.close('escape-key');
    }
  }

  protected onImageDoubleClick(event: MouseEvent): void {
    this.viewer.onDoubleClick(event);
  }

  /** A press on the stage or the box that centres the picture, not on the picture. */
  private isEmptyArea(event: Event): boolean {
    const target = event.target as HTMLElement | null;
    return (
      target === event.currentTarget ||
      !!target?.classList.contains('andes-image-preview__canvas')
    );
  }

  /** Centre of the origin element on screen, or `null` when it has no box to grow from. */
  private measureOrigin(): string | null {
    const origin = this.origin();
    if (!origin?.isConnected) {
      return null;
    }
    const rect = origin.getBoundingClientRect();
    if (!rect.width || !rect.height) {
      return null;
    }
    const x = Math.round(rect.left + rect.width / 2);
    const y = Math.round(rect.top + rect.height / 2);
    return `${x}px ${y}px`;
  }
}
