import {
  andesOverlayPreset,
  AndesOverlayPrimitive,
  provideAndesOverlay,
  type AndesOverlayPositioning,
} from '@andes-ng/primitives';
import { Directionality } from '@angular/cdk/bidi';
import {
  afterNextRender,
  afterRenderEffect,
  booleanAttribute,
  DestroyRef,
  Directive,
  DOCUMENT,
  effect,
  ElementRef,
  inject,
  Injector,
  input,
  numberAttribute,
  output,
  signal,
  type TemplateRef,
  untracked,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

/** Delay, in ms, between the pointer arriving on the `+ N` tag and its popover opening. */
export const ANDES_DATE_PICKER_OVERFLOW_OPEN_DELAY = 150;

/**
 * Delay, in ms, between the pointer leaving the tag (or the popover) and the popover
 * closing. It is also the time the pointer has to cross the gap between the two.
 */
export const ANDES_DATE_PICKER_OVERFLOW_CLOSE_DELAY = 100;

/** How long, in ms, after a touch a click or a focus is still considered touch-caused. */
const TOUCH_WINDOW = 1000;

/** What can take keyboard focus inside the popover. */
const TABBABLE =
  'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), ' +
  'textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Whether focus on an element shows a ring - came from the keyboard, in practice. A mouse
 * press focuses the tag too, but the pointer already decides about the popover then.
 */
function isFocusVisible(element: Element): boolean {
  try {
    return element.matches(':focus-visible');
  } catch {
    return true;
  }
}

/**
 * Whether an element has scrolled completely out of sight: off the viewport, or out of a
 * scrolling container it sits in. An element that is not laid out has nothing to measure
 * and counts as visible.
 */
function scrolledOutOfView(element: HTMLElement, view: Window): boolean {
  const rect = element.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) {
    return false;
  }
  if (rect.bottom <= 0 || rect.top >= view.innerHeight) {
    return true;
  }
  const body = element.ownerDocument.body;
  for (
    let parent = element.parentElement;
    parent && parent !== body;
    parent = parent.parentElement
  ) {
    const overflow = view.getComputedStyle(parent).overflowY;
    if (overflow === 'visible' || overflow === '') {
      continue;
    }
    const clip = parent.getBoundingClientRect();
    if (rect.bottom <= clip.top || rect.top >= clip.bottom) {
      return true;
    }
  }
  return false;
}

/**
 * Turns the `+ N ...` tag of a `multiple` date picker into the trigger of a small popover
 * listing the dates `maxTagCount` hides, so they can be read - and removed - without
 * opening the calendar. The same interaction model as the select's overflow tag:
 *
 * - Pointer: opens {@link ANDES_DATE_PICKER_OVERFLOW_OPEN_DELAY} ms after the pointer rests
 *   on the tag and closes {@link ANDES_DATE_PICKER_OVERFLOW_CLOSE_DELAY} ms after it has
 *   left both the tag and the popover; an invisible bridge spans the gap between them. A
 *   click pins the popover open until a second click, an outside click or `Escape`.
 * - Keyboard: the tag is a Tab stop (a `role="button"`) that opens the popover on focus;
 *   `Enter`, `Space` or `ArrowDown` move focus into it, `Tab` past its last control goes
 *   on to the date input (`exit`) and `Shift+Tab` past its first returns to the tag.
 *   `Escape` closes it, returning focus to the tag.
 * - Touch: a tap toggles it.
 *
 * It never shows while the calendar is open (`overflowBlocked`), closes when the hidden set
 * empties and once the tag scrolls out of sight, and follows the tag when the hidden set
 * changes. A disabled picker's popover still opens - it is informative - but its tag is no
 * Tab stop.
 *
 * @internal Part of `AndesDatePicker`'s template, not public API.
 */
@Directive({
  selector: '[andesDatePickerOverflow]',
  exportAs: 'andesDatePickerOverflow',
  providers: [provideAndesOverlay()],
  host: {
    role: 'button',
    'aria-haspopup': 'dialog',
    '[attr.tabindex]': 'overflowDisabled() ? null : 0',
    '[attr.aria-label]': 'overflowLabel()',
    '[attr.aria-expanded]': 'overlay.isOpen()',
    '[attr.aria-controls]': 'overlay.isOpen() ? overlay.contentId : null',
    '[attr.aria-disabled]': 'overflowDisabled() ? "true" : null',
    '[attr.data-state]': 'overlay.isOpen() ? "open" : "closed"',
    '(pointerenter)': 'onPointerEnter($event)',
    '(pointerleave)': 'onPointerLeave($event)',
    '(pointerdown)': 'onPointerDown($event)',
    '(mousedown)': '$event.preventDefault()',
    '(click)': 'onClick($event)',
    '(focusin)': 'onFocusIn()',
    '(focusout)': 'onFocusOut($event)',
    '(keydown)': 'onKeydown($event)',
  },
})
export class AndesDatePickerOverflow {
  readonly overlay = inject(AndesOverlayPrimitive);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly document = inject(DOCUMENT);
  private readonly injector = inject(Injector);
  private readonly directionality = inject(Directionality, { optional: true });

  /** The popover's template, declared inside the tag so it shares this overlay. */
  readonly panel = input<TemplateRef<unknown> | undefined>(undefined, {
    alias: 'andesDatePickerOverflow',
  });

  /** How many dates the tag stands for; the popover closes once none are left. */
  readonly overflowCount = input(0, { transform: numberAttribute });

  /** The picker is disabled: the popover still opens, but lists no remove buttons. */
  readonly overflowDisabled = input(false, { transform: booleanAttribute });

  /** The calendar is open: one overlay at a time, so the popover stays closed. */
  readonly overflowBlocked = input(false, { transform: booleanAttribute });

  /** Accessible name of the tag and of the popover. */
  readonly overflowLabel = input('');

  /** A hidden date's remove button was pressed in the popover. */
  readonly overflowRemove = output<Date>();

  /** Focus leaves the popover forwards, or its last date went: the picker takes it. */
  readonly overflowExit = output<void>();

  /** Text direction of the field, mirrored onto the portalled popover. */
  readonly direction = signal<'ltr' | 'rtl' | null>(null);

  /** Removes a hidden date, keeping focus in a sensible place. */
  readonly remove = (date: Date, event?: Event): void =>
    this.removeDate(date, event);

  private openTimer: ReturnType<typeof setTimeout> | undefined;
  private closeTimer: ReturnType<typeof setTimeout> | undefined;
  private tagHover = false;
  private panelHover = false;
  private focusHeld = false;
  /** Opened by a click or a tap: only another one, `Escape` or an outside click closes it. */
  private pinned = false;
  /** `Escape` closed it; hover or focus still going on must not reopen it. */
  private dismissed = false;
  private lastTouchAt = -Infinity;
  /** Set while a removal from inside the popover waits for the list to re-render. */
  private pendingFocus: number | null = null;
  private stopWatchingScroll: (() => void) | null = null;

  constructor() {
    this.overlay.configure({
      ...andesOverlayPreset('popover'),
      positioning: this.positioning('start'),
      role: 'dialog',
      ariaModal: false,
      trapFocus: false,
      // Focus only goes into the popover when the keyboard asks for it, and comes back by
      // hand on Escape: restoring it on every close would pull focus onto the tag each
      // time the pointer simply moved away.
      autoFocus: 'none',
      restoreFocus: false,
      closeOnEscape: true,
      closeOnOutsideClick: true,
      repositionOnScroll: true,
    });
    this.overlay.registerAnchor(this.host);

    this.overlay.keydownEvents.pipe(takeUntilDestroyed()).subscribe((event) => {
      if (event.key !== 'Escape') {
        return;
      }
      this.dismissed = true;
      this.clearTimers();
      if (this.panelContains(this.document.activeElement)) {
        this.host.nativeElement.focus();
      }
    });
    this.overlay.opened
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.watchScroll());
    this.overlay.closed.pipe(takeUntilDestroyed()).subscribe(() => {
      this.panelHover = false;
      this.pinned = false;
      this.unwatchScroll();
    });

    // One overlay at a time: the calendar wins. And nothing to show, nothing open.
    effect(() => {
      const blocked = this.overflowBlocked();
      const empty = this.overflowCount() === 0;
      untracked(() => {
        if (blocked || empty) {
          this.closeNow();
        }
      });
    });

    // The hidden set changes (a removal, a responsive re-fit): the popover changes size
    // and the tag may have moved, so the popover follows it.
    afterRenderEffect(() => {
      this.overflowCount();
      untracked(() => {
        if (this.overlay.isOpen()) {
          this.overlay.updatePosition();
        }
      });
    });

    inject(DestroyRef).onDestroy(() => {
      this.clearTimers();
      this.unwatchScroll();
      // The last hidden date went with focus on its remove button, and the tag with it.
      if (this.pendingFocus !== null) {
        this.overflowExit.emit();
      }
    });
  }

  // Tag events ------------------------------------------------------------------------

  protected onPointerEnter(event: PointerEvent): void {
    if (event.pointerType === 'touch') {
      return;
    }
    this.tagHover = true;
    this.requestOpen();
  }

  protected onPointerLeave(event: PointerEvent): void {
    if (event.pointerType === 'touch') {
      return;
    }
    this.tagHover = false;
    this.dismissed = false;
    this.requestClose();
  }

  protected onPointerDown(event: PointerEvent): void {
    if (event.pointerType === 'touch') {
      this.lastTouchAt = Date.now();
    }
  }

  /**
   * A click or tap pins the popover open, or closes a pinned one. It never reaches the
   * field, which would open the calendar instead.
   */
  protected onClick(event: MouseEvent): void {
    event.stopPropagation();
    if (this.overlay.isOpen()) {
      if (this.pinned) {
        this.closeNow();
      } else {
        this.pinned = true;
        this.clearTimers();
      }
      return;
    }
    this.dismissed = false;
    this.pinned = true;
    this.openNow();
  }

  protected onFocusIn(): void {
    const host = this.host.nativeElement;
    if (
      Date.now() - this.lastTouchAt < TOUCH_WINDOW ||
      !isFocusVisible(host) ||
      this.document.activeElement !== host
    ) {
      return;
    }
    this.focusHeld = true;
    if (!this.dismissed) {
      this.openNow();
    }
  }

  protected onFocusOut(event: FocusEvent): void {
    if (this.panelContains(event.relatedTarget)) {
      return;
    }
    this.focusHeld = false;
    this.dismissed = false;
    this.pinned = false;
    this.requestClose();
  }

  /** `Enter`, `Space` and `ArrowDown` open the popover and move focus into it. */
  protected onKeydown(event: KeyboardEvent): void {
    if (
      event.target !== this.host.nativeElement ||
      (event.key !== 'Enter' && event.key !== ' ' && event.key !== 'ArrowDown')
    ) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    this.dismissed = false;
    this.focusHeld = true;
    this.openNow();
    if (!this.focusInPanel(0)) {
      afterNextRender(() => this.focusInPanel(0), { injector: this.injector });
    }
  }

  // Popover events --------------------------------------------------------------------

  onPanelPointerEnter(event: PointerEvent): void {
    if (event.pointerType === 'touch') {
      return;
    }
    this.panelHover = true;
    this.clearCloseTimer();
  }

  onPanelPointerLeave(event: PointerEvent): void {
    if (event.pointerType === 'touch') {
      return;
    }
    this.panelHover = false;
    this.requestClose();
  }

  onPanelFocusIn(): void {
    this.focusHeld = true;
    this.clearCloseTimer();
  }

  onPanelFocusOut(event: FocusEvent): void {
    const next = event.relatedTarget;
    if (
      this.pendingFocus !== null ||
      this.panelContains(next) ||
      (next instanceof Node && this.host.nativeElement.contains(next))
    ) {
      return;
    }
    this.focusHeld = false;
    this.pinned = false;
    this.requestClose();
  }

  /**
   * `Tab` past either end of the popover does not wander off to wherever the portalled
   * pane sits in the document: forwards it goes on to the date input and closes the
   * popover, backwards it returns to the tag.
   */
  onPanelKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Tab' || event.altKey || event.ctrlKey || event.metaKey) {
      return;
    }
    const tabbables = this.tabbables();
    const active = this.document.activeElement;
    if (event.shiftKey) {
      if (tabbables.length === 0 || active === tabbables[0]) {
        event.preventDefault();
        this.host.nativeElement.focus();
      }
      return;
    }
    if (tabbables.length === 0 || active === tabbables[tabbables.length - 1]) {
      event.preventDefault();
      this.closeNow();
      this.overflowExit.emit();
    }
  }

  /** Whether `node` is inside the popover. */
  panelContains(node: EventTarget | null): boolean {
    const pane = this.overlay.panelElement();
    return node instanceof Node && !!pane && pane.contains(node);
  }

  // Opening and closing ---------------------------------------------------------------

  /** Opens at once, if there is something to show and the calendar is closed. */
  openNow(): void {
    this.clearTimers();
    const panel = this.panel();
    if (
      !panel ||
      this.overlay.isOpen() ||
      this.overflowBlocked() ||
      this.overflowCount() === 0
    ) {
      return;
    }
    const view = this.document.defaultView;
    const direction = view?.getComputedStyle(this.host.nativeElement).direction;
    this.direction.set(direction === 'rtl' ? 'rtl' : direction ? 'ltr' : null);
    // `start` is the field's own start edge; the overlay resolves it against the
    // document's direction, so a field laid out the other way round mirrors it.
    const overlayRtl = this.directionality?.value === 'rtl';
    const fieldRtl = direction ? direction === 'rtl' : overlayRtl;
    this.overlay.configure({
      positioning: this.positioning(fieldRtl === overlayRtl ? 'start' : 'end'),
    });
    this.overlay.open(panel);
  }

  /** Closes at once and forgets every hold. */
  closeNow(): void {
    this.clearTimers();
    this.tagHover = false;
    this.panelHover = false;
    this.pinned = false;
    if (this.overlay.isOpen()) {
      this.overlay.close('imperative');
    }
  }

  /** Below the tag (above when there is no room), level with its start edge. */
  private positioning(align: 'start' | 'end'): AndesOverlayPositioning {
    return {
      kind: 'anchored',
      side: 'bottom',
      align,
      sideOffset: 4,
      flip: true,
      // Beside the tag it would cover the field, so it stays above or below and is
      // shifted along the row into view instead.
      crossSideFallback: false,
      shift: true,
    };
  }

  private holding(): boolean {
    return this.tagHover || this.panelHover || this.focusHeld || this.pinned;
  }

  private requestOpen(): void {
    if (this.overlay.isOpen()) {
      this.clearCloseTimer();
      return;
    }
    if (this.dismissed || this.openTimer !== undefined) {
      return;
    }
    this.openTimer = setTimeout(() => {
      this.openTimer = undefined;
      if (this.holding() && !this.dismissed) {
        this.openNow();
      }
    }, ANDES_DATE_PICKER_OVERFLOW_OPEN_DELAY);
  }

  /** Closes after the close delay unless something holds the popover by then. */
  private requestClose(): void {
    if (this.holding()) {
      return;
    }
    this.clearOpenTimer();
    if (!this.overlay.isOpen()) {
      return;
    }
    this.clearCloseTimer();
    this.closeTimer = setTimeout(() => {
      this.closeTimer = undefined;
      if (!this.holding()) {
        this.closeNow();
      }
    }, ANDES_DATE_PICKER_OVERFLOW_CLOSE_DELAY);
  }

  // Removal ---------------------------------------------------------------------------

  /**
   * Removes a hidden date through the picker (`overflowRemove`), so the same outputs and
   * form updates follow as for a tag in the field. With focus inside the popover it
   * moves to the control now at the same place (or the one before it); once nothing is
   * left to show, to the date input, as the tag itself goes too.
   */
  private removeDate(date: Date, event?: Event): void {
    event?.stopPropagation();
    if (this.overflowDisabled()) {
      return;
    }
    const active = this.document.activeElement;
    const focusInside = this.panelContains(active);
    const index = focusInside
      ? this.tabbables().indexOf(active as HTMLElement)
      : -1;
    const last = this.overflowCount() <= 1;

    if (focusInside && last) {
      this.overflowExit.emit();
    } else if (focusInside) {
      this.pendingFocus = Math.max(index, 0);
    }
    this.overflowRemove.emit(date);

    if (this.pendingFocus !== null) {
      const target = this.pendingFocus;
      afterNextRender(
        () => {
          this.pendingFocus = null;
          if (!this.overlay.isOpen() || !this.focusInPanel(target)) {
            this.focusTagOrExit();
          }
        },
        { injector: this.injector },
      );
    }
  }

  private focusTagOrExit(): void {
    const host = this.host.nativeElement;
    if (host.isConnected && !this.overflowDisabled()) {
      host.focus();
    } else {
      this.overflowExit.emit();
    }
  }

  /** Focuses the popover's control at `index` (or its last one). */
  private focusInPanel(index: number): boolean {
    const tabbables = this.tabbables();
    const target = tabbables[Math.min(index, tabbables.length - 1)];
    if (!target) {
      return false;
    }
    target.focus();
    return true;
  }

  private tabbables(): HTMLElement[] {
    const content = this.overlay.contentElement();
    return content
      ? Array.from(content.querySelectorAll<HTMLElement>(TABBABLE))
      : [];
  }

  /** Closes once the tag has scrolled out of sight. */
  private watchScroll(): void {
    this.unwatchScroll();
    const view = this.document.defaultView;
    if (!view) {
      return;
    }
    const onScroll = (event: Event) => {
      if (
        !this.overlay.isOpen() ||
        this.panelContains(event.target) ||
        !scrolledOutOfView(this.host.nativeElement, view)
      ) {
        return;
      }
      if (this.panelContains(this.document.activeElement)) {
        this.host.nativeElement.focus({ preventScroll: true });
      }
      this.closeNow();
    };
    const options: AddEventListenerOptions = { capture: true, passive: true };
    this.document.addEventListener('scroll', onScroll, options);
    this.stopWatchingScroll = () =>
      this.document.removeEventListener('scroll', onScroll, options);
  }

  private unwatchScroll(): void {
    this.stopWatchingScroll?.();
    this.stopWatchingScroll = null;
  }

  private clearOpenTimer(): void {
    clearTimeout(this.openTimer);
    this.openTimer = undefined;
  }

  private clearCloseTimer(): void {
    clearTimeout(this.closeTimer);
    this.closeTimer = undefined;
  }

  private clearTimers(): void {
    this.clearOpenTimer();
    this.clearCloseTimer();
  }
}
