import { InjectionToken, Signal, TemplateRef } from '@angular/core';

export type AndesSegmentedSize = 'sm' | 'md' | 'lg';
export type AndesSegmentedShape = 'default' | 'round';

/** Validation tier, like AndesInput's `status`: `error` also sets `aria-invalid`. */
export type AndesSegmentedStatus = 'error' | 'warning';

/**
 * Look of the control, named after the Input variants that make sense for a segmented control.
 *
 * - `default`: a muted track with a raised white thumb (the original look).
 * - `outlined`: a bordered, transparent track; the thumb is a soft tint.
 * - `filled`: the same track as `default`, but the selected segment is filled with the primary
 *   color, for the strongest selection cue.
 * - `borderless`: no track at all; only the selected segment is tinted.
 *
 * Input's `underlined` is left out on purpose: a sliding thumb needs a box to slide.
 */
export type AndesSegmentedVariant =
  'default' | 'outlined' | 'filled' | 'borderless';

/**
 * Timing of the sliding thumb. Both parts are optional and fall back to 300ms and the
 * an ease-in-out curve. `prefers-reduced-motion: reduce` still wins and removes the slide.
 */
export interface AndesSegmentedMotion {
  /** Milliseconds (a number) or any CSS time such as `'0.3s'`. `0` snaps without sliding. */
  duration?: number | string;
  /** Any CSS easing function, e.g. `'ease-in-out'` or `'cubic-bezier(0.2, 0, 0, 1)'`. */
  easing?: string;
}

/** One entry of `AndesSegmented`'s `options` input. */
export interface AndesSegmentedOptionConfig<T = unknown> {
  /** Text of the option; omit for an icon-only option (and then give `ariaLabel`). */
  label?: string;
  value: T;
  /** Rendered before the label. */
  icon?: TemplateRef<unknown>;
  disabled?: boolean;
  /** Optional second line under the label, linked with `aria-describedby`. When any option has
   *  one, every segment grows to fit it. */
  description?: string;
  /** Native tooltip (`title`) of the option. */
  tooltip?: string;
  /** Accessible name; needed when the option has no text label. */
  ariaLabel?: string;
  /** Extra CSS class(es) on the rendered option. */
  class?: string;
}

/** A bare string/number is shorthand for `{ label: String(value), value }`. */
export type AndesSegmentedOptionInput<T = unknown> =
  AndesSegmentedOptionConfig<T> | (T & string) | (T & number);

/** Context of the `optionLabel` template: `let-option` is the normalized option. */
export interface AndesSegmentedOptionContext<T = unknown> {
  $implicit: AndesSegmentedOptionConfig<T>;
  checked: boolean;
  index: number;
}

/** Payload of `(selectionChange)`: only user selections, never programmatic writes. */
export interface AndesSegmentedChange<T = unknown> {
  value: T;
  /** The click or key event that selected the option. */
  event: Event;
}

/** What an option reads from and reports to its group. */
export interface AndesSegmentedApi {
  /** The size in effect (the group's own, else its form's). */
  readonly resolvedSize: Signal<AndesSegmentedSize>;
  readonly isDisabled: Signal<boolean>;
  /** Nothing can be changed, but the options stay focusable and look normal. */
  readonly readOnly: Signal<boolean>;
  /** Whether any option carries a `description` (every segment then grows to fit it). */
  readonly hasDescription: Signal<boolean>;
  readonly isChecked: (value: unknown) => boolean;
  /** The one option instance that is in the tab order (roving tabindex). */
  readonly tabbable: Signal<unknown>;
  readonly select: (value: unknown, event: Event) => void;
}

export const ANDES_SEGMENTED = new InjectionToken<AndesSegmentedApi>(
  'ANDES_SEGMENTED',
);
