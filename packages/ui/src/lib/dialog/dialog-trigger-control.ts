import { AndesOverlayPrimitive } from '@andes-ng/primitives';
import {
  afterNextRender,
  afterRenderEffect,
  ElementRef,
  inject,
  signal,
} from '@angular/core';

/** Matches the elements a browser will actually move focus to. */
const FOCUSABLE_SELECTOR =
  'button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

const DISABLED_SELECTOR = ':disabled, [aria-disabled="true"]';

const TRIGGER_ARIA = ['aria-haspopup', 'aria-expanded', 'aria-controls'];

/**
 * Lets a dialog trigger directive sit on a wrapper component such as `<andes-button>`
 * as well as on a native `<button>`.
 *
 * The overlay primitive puts its ARIA state (`aria-haspopup`, `aria-expanded`,
 * `aria-controls`) and the focus-return anchor on the element the directive is on. On a
 * custom element that is a roleless wrapper: assistive technology never sees it, axe
 * rejects `aria-expanded` on it, and `focus()` on it does nothing, so closing the dialog
 * would strand focus on `<body>`. For a custom-element host this moves all three to the
 * real control inside it once it has rendered, and keeps them in sync.
 *
 * Call it from a trigger directive's constructor. A native host is left untouched.
 * `isDisabled()` tells the click handler to ignore a trigger whose control is disabled.
 */
export function useDialogTriggerControl(): { isDisabled: () => boolean } {
  const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  const overlay = inject(AndesOverlayPrimitive);
  const control = signal<HTMLElement | null>(null);
  const isWrapper = host.localName.includes('-');

  if (isWrapper) {
    afterNextRender(() => {
      const focusable = host.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
      if (focusable) {
        overlay.registerAnchor(focusable);
        control.set(focusable);
      }
    });

    afterRenderEffect(() => {
      const target = control();
      if (!target) {
        return;
      }
      const role = overlay.config().role;
      const open = overlay.isOpen();
      const aria: Record<string, string | null> = {
        'aria-haspopup':
          role === 'dialog' || role === 'alertdialog' ? 'dialog' : null,
        'aria-expanded': String(open),
        'aria-controls': open ? overlay.contentId : null,
      };
      for (const name of TRIGGER_ARIA) {
        // The host bindings of the primitive wrote these on the wrapper; clearing them
        // here, after render, keeps the roleless host free of attributes it may not carry.
        host.removeAttribute(name);
        const value = aria[name];
        if (value === null) {
          target.removeAttribute(name);
        } else {
          target.setAttribute(name, value);
        }
      }
    });
  }

  return {
    isDisabled: () => {
      if (host.matches(DISABLED_SELECTOR)) {
        return true;
      }
      const inner = control();
      return !!inner && inner.matches(DISABLED_SELECTOR);
    },
  };
}
