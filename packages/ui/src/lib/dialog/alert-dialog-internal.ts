import type { DestroyRef } from '@angular/core';

/**
 * The element that actually receives focus and clicks inside an action's host: the host
 * itself for a native `<button>`/`<a>`, the real button within for `<andes-button>`
 * (whose own host is a non-interactive wrapper).
 */
export function interactiveTarget(host: HTMLElement): HTMLElement | null {
  if (host.tagName === 'BUTTON' || host.tagName === 'A') {
    return host;
  }
  return host.querySelector<HTMLElement>('button, a[href]');
}

const OWNED = 'data-andes-unavailable';

/**
 * Marks `host`'s control as unavailable without taking it out of the tab order:
 * `aria-disabled` plus the `data-disabled` hook the button's stylesheet already dims
 * for. A truly `disabled` button cannot be focused, so a screen reader user would never
 * learn why it does nothing; this one stays reachable and says why through
 * `aria-describedby`.
 */
export function markUnavailable(
  host: HTMLElement,
  unavailable: boolean,
  describedBy: string | null,
  busy = false,
): void {
  const target = interactiveTarget(host);
  if (!target) {
    return;
  }
  // Only attributes this function set are taken down again: a button the consumer
  // disabled themselves keeps the `data-disabled` its own primitive wrote.
  const owned = target.hasAttribute(OWNED);
  if (unavailable) {
    setFlag(target, OWNED, '');
    setFlag(target, 'aria-disabled', 'true');
    setFlag(target, 'data-disabled', '');
  } else if (owned) {
    setFlag(target, OWNED, null);
    setFlag(target, 'aria-disabled', null);
    setFlag(target, 'data-disabled', null);
  }
  setFlag(target, 'aria-busy', busy ? 'true' : null);

  if (describedBy !== null) {
    const others = (target.getAttribute('aria-describedby') ?? '')
      .split(/\s+/)
      .filter((token) => token && token !== describedBy);
    setFlag(
      target,
      'aria-describedby',
      unavailable
        ? [...others, describedBy].join(' ')
        : others.join(' ') || null,
    );
  }
}

function setFlag(element: Element, name: string, value: string | null): void {
  if (value === null) {
    element.removeAttribute(name);
  } else if (element.getAttribute(name) !== value) {
    element.setAttribute(name, value);
  }
}

/**
 * Swallows clicks on `host` while `shouldBlock` says so - including the consumer's own
 * `(click)` handler on the same element, which a plain host listener could not stop.
 *
 * It listens in the capture phase: a click on the real button inside an `<andes-button>`
 * crosses the host on the way down, before any bubbling listener, and one aimed at the
 * host itself runs capture listeners first as well.
 */
export function blockClicks(
  host: HTMLElement,
  destroyRef: DestroyRef,
  shouldBlock: (event: MouseEvent) => boolean,
): void {
  const listener = (event: MouseEvent) => {
    if (shouldBlock(event)) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  };
  host.addEventListener('click', listener, true);
  destroyRef.onDestroy(() => host.removeEventListener('click', listener, true));
}

/** Marks the control inside `host` as the focus trap's initial focus target. */
export function markInitialFocus(host: HTMLElement): void {
  interactiveTarget(host)?.setAttribute('cdkFocusInitial', '');
}

/** Whether a rejected value or a thrown error is a promise-like to wait for. */
export function isPromiseLike(value: unknown): value is PromiseLike<unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { then?: unknown }).then === 'function'
  );
}

/** A readable message for whatever a failed confirmation rejected with. */
export function errorText(error: unknown, fallback: string): string {
  if (typeof error === 'string' && error) {
    return error;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}
