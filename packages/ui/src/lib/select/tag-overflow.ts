import type { Signal } from '@angular/core';

/**
 * What the `+ N ...` tag's popover ({@link AndesSelectOverflow}) needs from the field whose
 * hidden tags it lists. A field provides itself under this token, next to its overlay, and the
 * directive on its `+ N ...` tag injects it - the Select today, and any other field of the
 * family that shows tags (a cascader, a tree select).
 *
 * @internal Shared by the select family, not public API.
 */
export abstract class AndesTagOverflowHost<T = unknown> {
  /** Whether the field's own panel is open: the popover never shows at the same time. */
  abstract readonly isOpen: Signal<boolean>;
  /** A disabled field's popover still informs, but lists its tags without remove buttons. */
  abstract readonly isDisabled: Signal<boolean>;
  /** The tags rendered in the field. */
  abstract readonly visibleTags: Signal<readonly T[]>;
  /** The tags hidden by `maxTagCount`, which the popover lists. */
  abstract readonly omittedTags: Signal<readonly T[]>;
  /** Whether the `+ N ...` tag opens a popover at all. */
  abstract readonly maxTagPopover: Signal<boolean>;
  /** Accessible name of the `+ N ...` tag and its popover, for a number of hidden tags. */
  abstract maxTagPopoverLabelFor(count: number): string;
  /**
   * Registers the open popover's pane (or `null`), so focus moving into it is not taken for
   * focus leaving the field.
   */
  abstract registerOverflowPanel(element: HTMLElement | null): void;
  /** Tracks focus entering the field (the popover counts as part of it). */
  abstract onFocusIn(event: FocusEvent): void;
  /** Tracks focus leaving the field. */
  abstract onFocusOut(event: FocusEvent): void;
  /** Moves focus to the field's combobox. */
  abstract focus(): void;
  /** Whether a hidden tag can be removed from the popover. */
  abstract canRemoveTag(tag: T): boolean;
  /** Removes a hidden tag's value, as the tag's own remove button in the field does. */
  abstract removeTag(tag: T): void;
}

/** Template context of the popover's custom content. */
export interface AndesTagOverflowContext<T = unknown> {
  /** The hidden tags. */
  readonly $implicit: readonly T[];
  /**
   * Removes a hidden value, exactly as a tag's own remove button does. A method signature, so
   * a field's own context type (with its own tag type) is accepted where this one is expected.
   */
  remove(tag: T): void;
}

/**
 * Counts how many tags fit on one row of `selection` next to the `+ N ...` tag, for
 * `maxTagCount="responsive"`, from an invisible measuring row (`measure`) that lays every tag
 * out at its natural width: each tag in a `[data-measure="tag"]` element and the widest
 * `+ N ...` tag in a `[data-measure="rest"]` one.
 *
 * `reserve` is room (in px) kept free at the end of the row, for a search input; the row's
 * column gap is added to it. Every tag fits when they all do; otherwise as many as fit beside
 * the `+ N ...` tag, but never fewer than one (which then shrinks and ellipsises). Returns
 * `null` while the row has not been laid out (zero width), when nothing should change.
 */
export function andesMeasureTagFit(
  measure: HTMLElement,
  selection: HTMLElement,
  reserve = 0,
): number | null {
  if (selection.clientWidth === 0) {
    return null;
  }

  const widths = Array.from(
    measure.querySelectorAll<HTMLElement>('[data-measure="tag"]'),
    (element) => element.offsetWidth,
  );
  const rest =
    measure.querySelector<HTMLElement>('[data-measure="rest"]')?.offsetWidth ??
    0;
  const gap = parseFloat(getComputedStyle(selection).columnGap) || 0;
  const available = selection.clientWidth - (reserve > 0 ? reserve + gap : 0);

  const total = widths.reduce(
    (sum, width, index) => sum + width + (index > 0 ? gap : 0),
    0,
  );
  if (total <= available) {
    return widths.length;
  }

  let used = rest;
  let count = 0;
  for (const width of widths) {
    if (used + gap + width > available) {
      break;
    }
    used += gap + width;
    count++;
  }
  return Math.max(count, Math.min(1, widths.length));
}
