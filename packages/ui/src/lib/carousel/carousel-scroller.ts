import { Directionality } from '@angular/cdk/bidi';
import { DOCUMENT } from '@angular/common';
import {
  afterNextRender,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChildren,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  Injector,
  input,
  isDevMode,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideChevronLeft, lucideChevronRight } from '@ng-icons/lucide';

import { ANDES_CAROUSEL_SCROLLER } from './carousel-scroller-context';
import { AndesCarouselScrollerItem } from './carousel-scroller-item';
import {
  stepOffset,
  type AndesScrollerBox,
  type AndesScrollerStepOptions,
} from './carousel-scroller-math';
import {
  resolveCarouselLabels,
  type AndesCarouselArrowSize,
  type AndesCarouselLabels,
  type AndesCarouselReducedMotion,
  type AndesCarouselScrollerPaging,
} from './carousel-types';

/** Movement along the axis, in px, before a touch press becomes a page drag. */
const DRAG_THRESHOLD = 6;
/** Farthest a drag may travel and still count as a flick, as a share of the view. */
const FLICK_SHARE = 0.15;
/** Speed (px per ms) above which a release counts as a flick whatever the distance. */
const FLICK_SPEED = 0.3;
/** Release speeds are measured over this window of recent pointer samples. */
const VELOCITY_WINDOW_MS = 100;
/** Quiet time after the last wheel event before a new swipe may move the scroller. */
const WHEEL_QUIET_MS = 150;
/** Slack for the "can it scroll further" checks, in px (sub-pixel scroll positions). */
const SLACK = 1;

interface PageDrag {
  readonly id: number;
  readonly startX: number;
  readonly startY: number;
  readonly startOffset: number;
  readonly samples: { t: number; x: number }[];
  captured: boolean;
}

function toCssLength(value: number | string | null | undefined): string | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  return typeof value === 'number' ? `${value}px` : value;
}

function isEditable(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable ||
      ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
  );
}

/**
 * A row of items that scrolls along its own axis when they overflow, using the browser's
 * native scrolling and, optionally, scroll snapping. Where `andes-carousel` shows one stage
 * of slides at a time, this is for a strip of cards, tiles or people that the reader browses
 * at their own pace.
 *
 * ```html
 * <andes-carousel-scroller aria-label="Browse features" [gap]="16" [itemWidth]="240">
 *   <andes-carousel-scroller-item>One</andes-carousel-scroller-item>
 *   <andes-carousel-scroller-item>Two</andes-carousel-scroller-item>
 * </andes-carousel-scroller>
 * ```
 *
 * **Accessible name.** Give the scroller an `aria-label` (or `aria-labelledby`): it is a
 * labelled carousel region, and a development warning tells you when the name is missing.
 *
 * **Keyboard.** The scroll container is a tab stop only while the items overflow; arrow
 * keys then move it (one item at a time with `snap`, otherwise as the browser pans),
 * Home and End go to the first and last item. While everything fits it leaves the tab
 * order. The previous and next buttons exist only while the content can move that way,
 * and focus moves to the scroll container if the button that was pressed goes away.
 *
 * **Paging.** With `paging` set, a drag with a finger or pen, a horizontal swipe on a
 * trackpad and Shift plus the wheel move one item (`item`) or one view of items (`view`)
 * per gesture. A mouse wheel and the scrollbar keep the native behaviour, snapping included.
 *
 * **Motion.** Changes of position are instant under `prefers-reduced-motion` (see
 * `reducedMotion`). There is no automatic rotation.
 *
 * Do not put a carousel inside another one: the nested scroll areas fight over the same
 * gestures and the nested announcements are hard to follow. Lay related groups out as
 * separate rows instead.
 *
 * CSS custom properties (set on the host or an ancestor): `--andes-carousel-gap` (also the
 * `gap` input), `--andes-carousel-item-width` (also `itemWidth`), `--andes-carousel-fade-size`
 * (width of the fading edges, default 2rem).
 */
@Component({
  selector: 'andes-carousel-scroller',
  viewProviders: [provideIcons({ lucideChevronLeft, lucideChevronRight })],
  imports: [NgIcon],
  templateUrl: './carousel-scroller.html',
  styleUrl: './carousel-scroller.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: ANDES_CAROUSEL_SCROLLER, useExisting: AndesCarouselScroller },
  ],
  host: {
    role: 'region',
    'aria-roledescription': 'carousel',
    '[attr.aria-label]': 'regionLabel()',
    '[attr.aria-labelledby]': 'ariaLabelledby()',
    '[attr.data-slot]': '"carousel-scroller"',
    '[attr.data-snap]': 'snap() ? "" : null',
    '[attr.data-paging]': 'paging()',
    '[attr.data-fade]': 'fadeEdges() ? "" : null',
    '[attr.data-overflowing]': 'overflowing() ? "" : null',
    '[attr.data-can-start]': 'canStart() ? "" : null',
    '[attr.data-can-end]': 'canEnd() ? "" : null',
    '[attr.data-dragging]': 'dragging() ? "" : null',
    '[attr.data-arrow-size]': 'arrowSize()',
    '[attr.data-reduced]': 'reducedActive() ? "" : null',
    '[style.--andes-carousel-gap]': 'cssGap()',
    '[style.--andes-carousel-item-width]': 'cssItemWidth()',
    '(focusin)': 'onFocusIn($event)',
  },
})
export class AndesCarouselScroller {
  private readonly host =
    inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly document = inject(DOCUMENT);
  private readonly injector = inject(Injector);
  private readonly directionality = inject(Directionality);

  // --- Inputs --------------------------------------------------------------------------

  /** Line each item up with the start edge when scrolling comes to rest. */
  readonly snap = input(true, { transform: booleanAttribute });
  /**
   * How a touch drag, a trackpad swipe and Shift plus the wheel move: `none` leaves the
   * native scrolling alone, `item` moves one item per gesture, `view` one view of items.
   */
  readonly paging = input<AndesCarouselScrollerPaging>('none');
  /**
   * From the last item the next button goes back to the first, and the other way round, for
   * small sets that would otherwise dead-end. The buttons then stay while there is overflow.
   */
  readonly loop = input(false, { transform: booleanAttribute });
  /** Fade each edge that has more content behind it. */
  readonly fadeEdges = input(true, { transform: booleanAttribute });
  /** Previous and next buttons, shown only while the content can move that way. */
  readonly arrows = input(true, { transform: booleanAttribute });
  readonly arrowSize = input<AndesCarouselArrowSize>('md');
  /** Space between items: px number or any CSS length (default 1rem). */
  readonly gap = input<number | string | null>(null);
  /** Width of every item: px number or any CSS length; without it items use their content. */
  readonly itemWidth = input<number | string | null>(null);
  /** `system` honours `prefers-reduced-motion`; `allow` keeps smooth scrolling regardless. */
  readonly reducedMotion = input<AndesCarouselReducedMotion>('system');

  /** Accessible name of the region. Required: describe what the items are. */
  readonly ariaLabel = input<string | null>(null, { alias: 'aria-label' });
  readonly ariaLabelledby = input<string | null>(null, {
    alias: 'aria-labelledby',
  });
  /** Localised strings; unset fields keep their English default. */
  readonly labels = input<AndesCarouselLabels | null>(null);

  private readonly items = contentChildren(AndesCarouselScrollerItem, {
    descendants: true,
  });
  private readonly viewport = viewChild<ElementRef<HTMLElement>>('viewport');

  // --- State ---------------------------------------------------------------------------

  readonly itemCount = computed(() => this.items().length);
  readonly resolvedLabels = computed(() =>
    resolveCarouselLabels(this.labels()),
  );
  protected readonly regionLabel = computed(
    () =>
      this.ariaLabel() ??
      (this.ariaLabelledby() ? null : this.resolvedLabels().carousel),
  );
  protected readonly cssGap = computed(() => toCssLength(this.gap()));
  protected readonly cssItemWidth = computed(() =>
    toCssLength(this.itemWidth()),
  );

  private readonly reducedSystem = signal(false);
  protected readonly reducedActive = computed(
    () =>
      this.reducedMotion() === 'reduce' ||
      (this.reducedMotion() === 'system' && this.reducedSystem()),
  );

  /** The items are wider than the scroll container. */
  readonly overflowing = signal(false);
  /** There is content before the current position. */
  readonly canStart = signal(false);
  /** There is content after the current position. */
  readonly canEnd = signal(false);
  protected readonly dragging = signal(false);

  /** A step back would move somewhere: there is content behind, or it loops. */
  readonly canScrollPrev = computed(
    () => this.overflowing() && (this.canStart() || this.loop()),
  );
  /** A step forward would move somewhere: there is content ahead, or it loops. */
  readonly canScrollNext = computed(
    () => this.overflowing() && (this.canEnd() || this.loop()),
  );
  protected readonly showPrev = computed(
    () => this.arrows() && this.canScrollPrev(),
  );
  protected readonly showNext = computed(
    () => this.arrows() && this.canScrollNext(),
  );

  private pageDrag: PageDrag | null = null;
  private suppressClick = false;
  private wheelQuietAt = 0;
  private refocus = false;

  constructor() {
    this.setUpEnvironmentListeners();

    // Items added, removed or resized change what fits.
    effect((onCleanup) => {
      const items = this.items();
      const viewport = this.viewport()?.nativeElement;
      if (!viewport || typeof ResizeObserver !== 'function') {
        return;
      }
      const observer = new ResizeObserver(() => this.measure());
      observer.observe(viewport);
      for (const item of items) {
        observer.observe(item.element);
      }
      onCleanup(() => observer.disconnect());
    });

    effect(() => {
      this.items();
      this.gap();
      this.itemWidth();
      afterNextRender(() => this.measure(), { injector: this.injector });
    });

    // A button that was pressed and then went away (the scroller reached an end) must not
    // leave keyboard focus on nothing: it goes to the scroll container.
    effect(() => {
      this.showPrev();
      this.showNext();
      untracked(() => {
        if (!this.refocus) {
          return;
        }
        afterNextRender(
          () => {
            const active = this.document.activeElement;
            if (this.refocus && (!active || active === this.document.body)) {
              this.viewport()?.nativeElement.focus({ preventScroll: true });
            }
            this.refocus = false;
          },
          { injector: this.injector },
        );
      });
    });

    afterNextRender(
      () => {
        this.measure();
        if (isDevMode() && !this.ariaLabel() && !this.ariaLabelledby()) {
          console.warn(
            '[andes-carousel-scroller] A carousel needs an accessible name: set aria-label (or aria-labelledby) to say what the items are.',
          );
        }
      },
      { injector: this.injector },
    );
  }

  indexOf(item: object): number {
    return this.items().indexOf(item as AndesCarouselScrollerItem);
  }

  // --- Public API ----------------------------------------------------------------------

  /** Moves forward by an item or, with `paging="view"`, a view; loops at the end. */
  next(): void {
    this.step(1);
  }

  /** Moves back by an item or a view; loops at the start. */
  prev(): void {
    this.step(-1);
  }

  /** Scrolls the item at `index` to the start edge (or as near as the content allows). */
  scrollToItem(index: number, animate = true): void {
    const box = this.boxes()[Math.trunc(index)];
    const view = this.view();
    if (box && view) {
      this.scrollToOffset(
        Math.min(Math.max(box.start - view.inset, 0), view.max),
        animate,
      );
    }
  }

  // --- Measuring -----------------------------------------------------------------------

  protected onScroll(): void {
    this.measure();
  }

  private measure(): void {
    const view = this.view();
    if (!view) {
      return;
    }
    this.overflowing.set(view.max > SLACK);
    this.canStart.set(view.offset > SLACK);
    this.canEnd.set(view.offset < view.max - SLACK);
  }

  private view():
    | (AndesScrollerStepOptions & { offset: number; element: HTMLElement })
    | null {
    const element = this.viewport()?.nativeElement;
    if (!element) {
      return null;
    }
    const offset = Math.abs(element.scrollLeft);
    return {
      element,
      offset,
      from: offset,
      max: Math.max(0, element.scrollWidth - element.clientWidth),
      client: element.clientWidth,
      inset: this.snapInset(element),
      paging: this.paging(),
    };
  }

  /** Space the snap position keeps from the start edge (the fade's width, or CSS). */
  private snapInset(element: HTMLElement): number {
    const value = Number.parseFloat(
      getComputedStyle(element).scrollPaddingInlineStart,
    );
    return Number.isFinite(value) ? value : 0;
  }

  /** Where each item sits, in px from the start of the scrolled content. */
  private boxes(): AndesScrollerBox[] {
    const element = this.viewport()?.nativeElement;
    if (!element) {
      return [];
    }
    const rtl = this.isRtl();
    const frame = element.getBoundingClientRect();
    const offset = Math.abs(element.scrollLeft);
    return this.items().map((item) => {
      const rect = item.element.getBoundingClientRect();
      return rtl
        ? {
            start: frame.right - rect.right + offset,
            end: frame.right - rect.left + offset,
          }
        : {
            start: rect.left - frame.left + offset,
            end: rect.right - frame.left + offset,
          };
    });
  }

  private scrollToOffset(offset: number, animate = true): void {
    const element = this.viewport()?.nativeElement;
    if (!element) {
      return;
    }
    const left = this.isRtl() ? -offset : offset;
    const behavior = animate && !this.reducedActive() ? 'smooth' : 'auto';
    if (typeof element.scrollTo === 'function') {
      element.scrollTo({ left, behavior });
    } else {
      element.scrollLeft = left;
    }
  }

  // --- Stepping ------------------------------------------------------------------------

  private step(direction: 1 | -1, from?: number): void {
    const view = this.view();
    if (!view || view.max <= SLACK) {
      return;
    }
    const target = stepOffset(this.boxes(), direction, {
      ...view,
      from: from ?? view.offset,
    });
    if (target !== null) {
      this.scrollToOffset(target);
    } else if (this.loop()) {
      this.scrollToOffset(direction > 0 ? 0 : view.max);
    }
  }

  protected onArrow(direction: 1 | -1): void {
    this.refocus = true;
    this.step(direction);
  }

  protected onFocusIn(event: FocusEvent): void {
    // Focus that lands anywhere but on a button we render is not worth restoring.
    const target = event.target;
    if (
      !(target instanceof HTMLElement) ||
      !target.classList.contains('andes-carousel-scroller__arrow')
    ) {
      this.refocus = false;
    }
  }

  // --- Keyboard ------------------------------------------------------------------------

  protected onKeydown(event: KeyboardEvent): void {
    // Only the scroll container itself: arrows inside an item belong to that item. Without
    // snapping the browser pans by itself, which is exactly what is wanted.
    if (
      event.target !== this.viewport()?.nativeElement ||
      !this.snap() ||
      event.defaultPrevented ||
      event.ctrlKey ||
      event.metaKey ||
      event.altKey ||
      event.shiftKey ||
      !this.overflowing()
    ) {
      return;
    }
    const rtl = this.isRtl();
    switch (event.key) {
      case 'ArrowRight':
        event.preventDefault();
        this.step(rtl ? -1 : 1);
        break;
      case 'ArrowLeft':
        event.preventDefault();
        this.step(rtl ? 1 : -1);
        break;
      case 'Home':
        event.preventDefault();
        this.scrollToOffset(0);
        break;
      case 'End':
        event.preventDefault();
        this.scrollToOffset(this.view()?.max ?? 0);
        break;
    }
  }

  // --- Paging: touch and pen drags, trackpad swipes, Shift plus the wheel ---------------

  protected onPointerDown(event: PointerEvent): void {
    if (
      this.paging() === 'none' ||
      this.pageDrag ||
      event.pointerType === 'mouse' ||
      isEditable(event.target) ||
      !this.overflowing()
    ) {
      return;
    }
    const element = this.viewport()?.nativeElement;
    if (!element) {
      return;
    }
    this.pageDrag = {
      id: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startOffset: Math.abs(element.scrollLeft),
      samples: [{ t: event.timeStamp, x: event.clientX }],
      captured: false,
    };
  }

  protected onPointerMove(event: PointerEvent): void {
    const drag = this.pageDrag;
    const element = this.viewport()?.nativeElement;
    if (!drag || drag.id !== event.pointerId || !element) {
      return;
    }
    const along = event.clientX - drag.startX;
    const across = event.clientY - drag.startY;
    if (!drag.captured) {
      if (
        Math.abs(along) < DRAG_THRESHOLD ||
        Math.abs(along) < Math.abs(across)
      ) {
        return;
      }
      drag.captured = true;
      this.dragging.set(true);
      // The drag moves the content by hand, so snapping must not pull it back meanwhile.
      element.style.scrollSnapType = 'none';
      try {
        element.setPointerCapture(event.pointerId);
      } catch {
        // Not every environment can capture; the drag still tracks while over the scroller.
      }
    }
    drag.samples.push({ t: event.timeStamp, x: event.clientX });
    while (
      drag.samples.length > 2 &&
      event.timeStamp - drag.samples[0].t > VELOCITY_WINDOW_MS
    ) {
      drag.samples.shift();
    }
    const offset = drag.startOffset - along * this.axisSign();
    const max = Math.max(0, element.scrollWidth - element.clientWidth);
    this.scrollToOffset(Math.min(Math.max(offset, 0), max), false);
  }

  protected onPointerEnd(event: PointerEvent): void {
    const drag = this.pageDrag;
    const element = this.viewport()?.nativeElement;
    if (!drag || drag.id !== event.pointerId || !element) {
      return;
    }
    this.pageDrag = null;
    if (!drag.captured) {
      return;
    }
    try {
      element.releasePointerCapture(event.pointerId);
    } catch {
      // Nothing was captured.
    }
    this.suppressClick = true;
    setTimeout(() => (this.suppressClick = false), 0);

    const first = drag.samples[0];
    const last = drag.samples[drag.samples.length - 1];
    const speed =
      event.type === 'pointerup'
        ? ((last.x - first.x) * -this.axisSign()) /
          Math.max(1, last.t - first.t)
        : 0;
    const moved = Math.abs(element.scrollLeft) - drag.startOffset;
    const flick =
      Math.abs(speed) > FLICK_SPEED ||
      Math.abs(moved) > element.clientWidth * FLICK_SHARE;
    const direction: 1 | -1 | 0 = !flick
      ? 0
      : (Math.abs(speed) > FLICK_SPEED ? speed : moved) > 0
        ? 1
        : -1;

    element.style.scrollSnapType = '';
    this.dragging.set(false);
    if (direction === 0) {
      this.scrollToOffset(drag.startOffset);
    } else {
      this.step(direction, drag.startOffset);
    }
  }

  /** Capture-phase: a drag must not end in a click on whatever the pointer was released over. */
  private readonly swallowClick = (event: Event): void => {
    if (this.suppressClick) {
      event.preventDefault();
      event.stopPropagation();
      this.suppressClick = false;
    }
  };

  private readonly onWheel = (event: WheelEvent): void => {
    if (this.paging() === 'none' || !this.overflowing()) {
      return;
    }
    // A mouse wheel turns the page and keeps the native snapping; only a horizontal swipe
    // or Shift plus the wheel are taken over.
    let along = 0;
    if (event.shiftKey) {
      along = event.deltaX !== 0 ? event.deltaX : event.deltaY;
    } else if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) {
      along = event.deltaX;
    }
    if (Math.abs(along) < 1) {
      return;
    }
    const direction = along * this.axisSign() > 0 ? 1 : -1;
    if (direction > 0 ? !this.canScrollNext() : !this.canScrollPrev()) {
      return;
    }
    event.preventDefault();
    // One gesture, one move: the events of a swipe (and the inertia that follows it) keep
    // arriving, so the lock holds until they have been quiet for a moment.
    const now = event.timeStamp || Date.now();
    const locked = now < this.wheelQuietAt;
    this.wheelQuietAt = now + WHEEL_QUIET_MS;
    if (!locked) {
      this.step(direction);
    }
  };

  // --- Environment ---------------------------------------------------------------------

  /**
   * Reading direction at the scroller: the nearest `dir` attribute wins (what the CSS
   * follows), then the document direction.
   */
  private isRtl(): boolean {
    const dir = this.host.closest('[dir]')?.getAttribute('dir');
    return (
      dir === 'rtl' || (dir !== 'ltr' && this.directionality.value === 'rtl')
    );
  }

  /** +1 when a drag to the right scrolls back (left to right), -1 when it scrolls ahead. */
  private axisSign(): number {
    return this.isRtl() ? -1 : 1;
  }

  private setUpEnvironmentListeners(): void {
    const destroyRef = inject(DestroyRef);
    const view = this.document.defaultView;

    if (typeof view?.matchMedia === 'function') {
      const query = view.matchMedia('(prefers-reduced-motion: reduce)');
      this.reducedSystem.set(query.matches);
      const onChange = (event: MediaQueryListEvent) =>
        this.reducedSystem.set(event.matches);
      query.addEventListener?.('change', onChange);
      destroyRef.onDestroy(() =>
        query.removeEventListener?.('change', onChange),
      );
    }

    this.host.addEventListener('click', this.swallowClick, true);
    this.host.addEventListener('wheel', this.onWheel, { passive: false });
    destroyRef.onDestroy(() => {
      this.host.removeEventListener('click', this.swallowClick, true);
      this.host.removeEventListener('wheel', this.onWheel);
    });
  }
}
