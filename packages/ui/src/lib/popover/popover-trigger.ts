import { AndesOverlayTriggerPrimitive } from '@andes-ng/primitives';
import {
  afterNextRender,
  computed,
  Directive,
  effect,
  ElementRef,
  inject,
  signal,
} from '@angular/core';

import { AndesPopoverBase } from './popover-base';

/** Matches the elements a browser will actually move focus to. */
const FOCUSABLE_SELECTOR =
  'button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

const DISABLED_SELECTOR = ':disabled, [aria-disabled="true"]';

/**
 * Marks an element as the popover's (or popconfirm's) trigger. Composes
 * `AndesOverlayTriggerPrimitive` for anchor registration and ARIA
 * (`aria-haspopup`/`aria-expanded`/`aria-controls`, plus `data-state`), and
 * forwards the pointer/focus/context-menu events the owning component's
 * `trigger` input listens to.
 *
 * Works on any host - a native `<button>`, an `andes-button`, an icon wrapper -
 * so consumers are not forced into a specific trigger element. A disabled
 * trigger (`disabled`, `aria-disabled="true"`, or an `andes-button` whose inner
 * button is disabled) never opens the panel.
 */
@Directive({
  selector: '[andesPopoverTrigger], [andesPopconfirmTrigger]',
  hostDirectives: [
    { directive: AndesOverlayTriggerPrimitive, inputs: ['ariaAttachment'] },
  ],
  host: {
    '(click)': 'popover.handleTriggerClick(isDisabled())',
    '(contextmenu)': 'popover.handleTriggerContextMenu($event, isDisabled())',
    '(pointerdown)': 'popover.handleTriggerPointerDown()',
    '(mouseenter)': 'popover.handleTriggerEnter(isDisabled())',
    '(mouseleave)': 'popover.handleTriggerLeave()',
    '(focusin)': 'popover.handleTriggerFocusIn(isDisabled())',
    '(focusout)': 'popover.handleFocusOut($event)',
  },
})
export class AndesPopoverTrigger {
  protected readonly popover = inject(AndesPopoverBase);
  private readonly triggerPrimitive = inject(AndesOverlayTriggerPrimitive);
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);

  /** The focusable element inside a non-focusable wrapper host, if any. */
  private readonly innerTarget = signal<HTMLElement | null>(null);

  private readonly innerAria = computed(() => {
    if (this.triggerPrimitive.ariaAttachment() !== 'expanded') {
      return null;
    }
    const role = this.popover.role;
    const open = this.popover.open();
    return {
      'aria-haspopup':
        role === 'alertdialog' || role === 'dialog'
          ? 'dialog'
          : role === 'menu' || role === 'listbox'
            ? role
            : null,
      'aria-expanded': String(open),
      'aria-controls': open ? this.popover.panelId : null,
    };
  });

  constructor() {
    const host = this.elementRef.nativeElement;
    this.popover.registerTriggerHost(host);
    this.popover.registerAnchor(host);
    this.popover.registerAnchorResolver(() => this.visibleBox());

    // `AndesOverlayTriggerPrimitive` registers *this* host as the anchor and as the element
    // focus returns to on close. The anchor is right for any host with a box of its own -
    // `<andes-input>`, `<andes-button>`: the panel then sits against the whole visible
    // control, never over its padding or affixes. But `focus()` on a non-focusable custom
    // element silently no-ops, so closing the popover would strand focus on `<body>`:
    // focus is sent to the focusable element inside the wrapper instead, once it has
    // rendered. Only a host with no box at all (`display: contents`) hands the anchor over
    // to that element.
    afterNextRender(() => {
      if (host.tabIndex >= 0 || host.matches(FOCUSABLE_SELECTOR)) {
        return;
      }
      const focusable = host.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
      if (!focusable) {
        return;
      }
      this.popover.registerFocusTarget(focusable);
      this.innerTarget.set(focusable);
    });

    // The ARIA the primitive puts on a wrapper host is invisible to assistive
    // tech - the inner button is what gets focused and announced. Mirror it.
    effect(() => {
      const target = this.innerTarget();
      const aria = this.innerAria();
      if (!target) {
        return;
      }
      for (const name of [
        'aria-haspopup',
        'aria-expanded',
        'aria-controls',
      ] as const) {
        const value = aria?.[name] ?? null;
        if (value === null) {
          target.removeAttribute(name);
        } else {
          target.setAttribute(name, value);
        }
      }
    });
  }

  /**
   * The trigger's visible border box, which is what the panel must sit against. The host is
   * that box for a field (`<andes-input>`: the group with the border *is* the host), but a
   * host can be stretched far wider than what it draws - an `<andes-button>` as a grid or
   * flex item with `width: 100%` or `align-self: stretch` has a visible button only as wide
   * as its label. So: the outermost element, from the focusable control up to the host, that
   * draws something of its own (a border, a background or a shadow); failing that the
   * focusable control when the host is a wrapper around it and has no box of its own; else
   * the host.
   */
  private visibleBox(): HTMLElement {
    const host = this.elementRef.nativeElement;
    const focusable = this.innerTarget();
    if (!focusable) {
      return host;
    }
    let outermost: HTMLElement | null = null;
    for (
      let element: HTMLElement | null = focusable;
      element;
      element = element === host ? null : element.parentElement
    ) {
      if (this.drawsABox(element)) {
        outermost = element;
      }
    }
    if (outermost) {
      // The host itself when it is exactly that box (a field): it is the more stable anchor.
      const a = outermost.getBoundingClientRect();
      const b = host.getBoundingClientRect();
      const same =
        Math.abs(a.left - b.left) < 0.5 &&
        Math.abs(a.right - b.right) < 0.5 &&
        Math.abs(a.top - b.top) < 0.5 &&
        Math.abs(a.bottom - b.bottom) < 0.5;
      return same ? host : outermost;
    }
    if (!this.hasLayout(host) && this.hasLayout(focusable)) {
      return focusable;
    }
    // A bare host stretched wider than its control still anchors to the control.
    const hostBox = host.getBoundingClientRect();
    const controlBox = focusable.getBoundingClientRect();
    return this.hasLayout(focusable) &&
      host.localName.includes('-') &&
      focusable.tagName !== 'INPUT' &&
      focusable.tagName !== 'TEXTAREA' &&
      hostBox.width > controlBox.width + 1
      ? focusable
      : host;
  }

  /** Whether an element paints a border, a background or a shadow of its own. */
  private drawsABox(element: HTMLElement): boolean {
    const style = getComputedStyle(element);
    const border =
      Number.parseFloat(style.borderTopWidth) > 0 &&
      style.borderTopStyle !== 'none' &&
      style.borderTopStyle !== 'hidden';
    const background =
      style.backgroundColor !== 'transparent' &&
      style.backgroundColor !== 'rgba(0, 0, 0, 0)';
    return border || background || style.boxShadow !== 'none';
  }

  /** Whether an element has a box (false under jsdom, where nothing is laid out). */
  private hasLayout(element: HTMLElement): boolean {
    const box = element.getBoundingClientRect();
    return box.width > 0 || box.height > 0;
  }

  /**
   * Checked at event time. The wrapper case only looks at the inner element of
   * a custom-element host (`andes-button`), so wrapping a disabled native
   * button in a plain `<span andesPopoverTrigger>` still works as a way to
   * explain why it is disabled.
   */
  protected isDisabled(): boolean {
    const host = this.elementRef.nativeElement;
    if (host.matches(DISABLED_SELECTOR)) {
      return true;
    }
    const inner = this.innerTarget();
    return (
      !!inner &&
      host.localName.includes('-') &&
      inner.matches(DISABLED_SELECTOR)
    );
  }
}

/**
 * `AndesPopoverTrigger` under the name that reads naturally inside an
 * `<andes-popconfirm>` - the same directive (its selector matches both
 * attributes), exported twice for import ergonomics.
 */
export const AndesPopconfirmTrigger = AndesPopoverTrigger;
