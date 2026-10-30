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
  computed,
  DestroyRef,
  Directive,
  DOCUMENT,
  effect,
  ElementRef,
  inject,
  Injector,
  input,
  signal,
  type TemplateRef,
  untracked,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import {
  AndesSelectState,
  type AndesSelectMaxTagPopoverContext,
  type AndesSelectTag,
} from './select-state';
import { andesSelectScrolledOutOfView } from './select-visibility';

/** Delay, in ms, between the pointer arriving on the `+ N` tag and its popover opening. */
export const ANDES_SELECT_OVERFLOW_OPEN_DELAY = 150;

/**
 * Delay, in ms, between the pointer leaving the tag (or the popover) and the popover
 * closing. It is also the time the pointer has to cross the gap between the two.
 */
export const ANDES_SELECT_OVERFLOW_CLOSE_DELAY = 100;

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
 * Turns the `+ N ...` tag of a multiple select into the trigger of a small popover listing
 * the tags `maxTagCount` hides, so they can be read - and removed - without opening the
 * option list.
 *
 * The popover is its own overlay, from the same overlay primitive as the option list, and
 * never shows at the same time as the list: opening the list closes it.
 *
 * - Pointer: opens {@link ANDES_SELECT_OVERFLOW_OPEN_DELAY} ms after the pointer rests on
 *   the tag and closes {@link ANDES_SELECT_OVERFLOW_CLOSE_DELAY} ms after it has left both
 *   the tag and the popover; an invisible bridge spans the gap between them. A click pins
 *   the popover open until a second click, an outside click or `Escape`.
 * - Keyboard: the tag is a Tab stop (a `role="button"`) that opens the popover on focus;
 *   `Enter`, `Space` or `ArrowDown` move focus into it, `Tab` past its last control goes on
 *   to the combobox and `Shift+Tab` past its first returns to the tag. `Escape` closes it,
 *   returning focus to the tag.
 * - Touch: a tap toggles it.
 *
 * It also closes when the hidden set empties and once the tag scrolls out of sight. A
 * disabled select's popover still opens on hover or tap - it is informative - but lists the
 * tags without remove buttons, and its tag is no Tab stop.
 *
 * @internal Part of `AndesSelectTrigger`'s template, not public API.
 */
@Directive({
  selector: '[andesSelectOverflow]',
  exportAs: 'andesSelectOverflow',
  providers: [provideAndesOverlay()],
  host: {
    '[attr.role]': 'enabled() ? "button" : null',
    '[attr.tabindex]': 'focusable() ? 0 : null',
    '[attr.aria-label]': 'enabled() ? label() : null',
    '[attr.aria-haspopup]': 'enabled() ? "dialog" : null',
    '[attr.aria-expanded]': 'enabled() ? overlay.isOpen() : null',
    '[attr.aria-controls]':
      'enabled() && overlay.isOpen() ? overlay.contentId : null',
    '[attr.aria-disabled]': 'enabled() && select.isDisabled() ? "true" : null',
    '[attr.data-state]':
      'enabled() ? (overlay.isOpen() ? "open" : "closed") : null',
    '(pointerenter)': 'onPointerEnter($event)',
    '(pointerleave)': 'onPointerLeave($event)',
    '(pointerdown)': 'onPointerDown($event)',
    '(click)': 'onClick($event)',
    '(focusin)': 'onFocusIn()',
    '(focusout)': 'onFocusOut($event)',
    '(keydown)': 'onKeydown($event)',
  },
})
export class AndesSelectOverflow {
  readonly overlay = inject(AndesOverlayPrimitive);
  protected readonly select = inject(AndesSelectState);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly document = inject(DOCUMENT);
  private readonly injector = inject(Injector);
  private readonly directionality = inject(Directionality, { optional: true });

  /** The popover's template, declared inside the tag so it shares this overlay. */
  readonly panel = input<TemplateRef<unknown> | undefined>(undefined, {
    alias: 'andesSelectOverflow',
  });

  /** Whether the tag opens a popover at all (`maxTagPopover`). */
  protected readonly enabled = computed(() => this.select.maxTagPopover());
  /** A disabled select's tag still opens on hover, but is no Tab stop. */
  protected readonly focusable = computed(
    () => this.enabled() && !this.select.isDisabled(),
  );
  /** Accessible name of the tag and of the popover. */
  readonly label = computed(() =>
    this.select.maxTagPopoverLabelFor(this.select.omittedTags().length),
  );
  /** Text direction of the field, mirrored onto the portalled popover. */
  readonly direction = signal<'ltr' | 'rtl' | null>(null);

  /** Removes a hidden value from the popover, keeping focus in a sensible place. */
  readonly remove = (tag: AndesSelectTag, event?: Event): void =>
    this.removeTag(tag, event);

  /** Context for a custom `maxTagPopoverTemplate`. */
  readonly context = computed<AndesSelectMaxTagPopoverContext>(() => ({
    $implicit: this.select.omittedTags(),
    remove: (tag) => this.removeTag(tag),
  }));

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
      // hand on Escape: restoring it on every close would pull focus onto the tag each time
      // the pointer simply moved away.
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

    // One overlay at a time: the option list wins. And nothing to show, nothing open.
    effect(() => {
      const listOpen = this.select.isOpen();
      const empty = this.select.omittedTags().length === 0;
      const enabled = this.enabled();
      untracked(() => {
        if (listOpen || empty || !enabled) {
          this.closeNow();
        }
      });
    });

    effect(() =>
      this.select.registerOverflowPanel(this.overlay.panelElement()),
    );

    // The hidden set changes (a removal, a responsive re-fit): the popover changes size
    // and the tag may have moved, so the popover follows it.
    afterRenderEffect(() => {
      this.select.omittedTags();
      this.select.visibleTags();
      untracked(() => {
        if (this.overlay.isOpen()) {
          this.overlay.updatePosition();
        }
      });
    });

    inject(DestroyRef).onDestroy(() => {
      this.clearTimers();
      this.unwatchScroll();
      this.select.registerOverflowPanel(null);
      // The last hidden tag went with focus on its remove button, and the tag with it.
      if (this.pendingFocus !== null) {
        this.select.focus();
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
   * trigger box, which would open the option list instead.
   */
  protected onClick(event: MouseEvent): void {
    if (!this.enabled()) {
      return;
    }
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
      !this.enabled() ||
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

  onPanelFocusIn(event: FocusEvent): void {
    this.focusHeld = true;
    this.clearCloseTimer();
    this.select.onFocusIn(event);
  }

  onPanelFocusOut(event: FocusEvent): void {
    this.select.onFocusOut(event);
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
   * `Tab` past either end of the popover does not wander off to wherever the portalled pane
   * sits in the document: forwards it goes on to the combobox (the tag's next Tab stop) and
   * closes the popover, backwards it returns to the tag.
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
      this.select.focus();
    }
  }

  // Opening and closing ---------------------------------------------------------------

  /** Opens at once, if there is something to show and the option list is closed. */
  openNow(): void {
    this.clearTimers();
    const panel = this.panel();
    if (
      !panel ||
      !this.enabled() ||
      this.overlay.isOpen() ||
      this.select.isOpen() ||
      this.select.omittedTags().length === 0
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

  /** Below the tag (above when there is no room), level with its start edge. */
  private positioning(align: 'start' | 'end'): AndesOverlayPositioning {
    return {
      kind: 'anchored',
      side: 'bottom',
      align,
      sideOffset: 4,
      flip: true,
      // Beside the tag it would cover the trigger, so it stays above or below and is
      // shifted along the row into view instead.
      crossSideFallback: false,
      shift: true,
    };
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
    }, ANDES_SELECT_OVERFLOW_OPEN_DELAY);
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
    }, ANDES_SELECT_OVERFLOW_CLOSE_DELAY);
  }

  // Removal ---------------------------------------------------------------------------

  /**
   * Removes a hidden value - the same `removeValue` the trigger's tags use, so the same
   * outputs and form updates follow. With focus inside the popover it moves to the control
   * now at the same place (or the one before it); once nothing is left to show, to the
   * combobox, as the tag itself goes too.
   */
  private removeTag(tag: AndesSelectTag, event?: Event): void {
    event?.stopPropagation();
    if (this.select.isDisabled() || !tag.closable) {
      return;
    }
    const active = this.document.activeElement;
    const focusInside = this.panelContains(active);
    const index = focusInside
      ? this.tabbables().indexOf(active as HTMLElement)
      : -1;
    const last = this.select.omittedTags().length <= 1;

    if (focusInside && last) {
      this.select.focus();
    } else if (focusInside) {
      this.pendingFocus = Math.max(index, 0);
    }
    this.select.removeValue(tag.value);

    if (this.pendingFocus !== null) {
      const target = this.pendingFocus;
      afterNextRender(
        () => {
          this.pendingFocus = null;
          if (!this.overlay.isOpen() || !this.focusInPanel(target)) {
            this.focusTagOrCombobox();
          }
        },
        { injector: this.injector },
      );
    }
  }

  private focusTagOrCombobox(): void {
    const host = this.host.nativeElement;
    if (host.isConnected && this.focusable()) {
      host.focus();
    } else {
      this.select.focus();
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

  private panelContains(node: EventTarget | null): boolean {
    const pane = this.overlay.panelElement();
    return node instanceof Node && !!pane && pane.contains(node);
  }

  /** Closes once the tag has scrolled out of sight, as the option list does. */
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
        !andesSelectScrolledOutOfView(this.host.nativeElement, view)
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
