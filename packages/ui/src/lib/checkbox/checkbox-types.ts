import { booleanAttribute, numberAttribute } from '@angular/core';

/**
 * The shared control scale (the same sm / md / lg steps as AndesInput): `sm` is a 14px box,
 * `md` (the default) a 16px box with 14px / 22px text, `lg` a 20px box with 16px / 24px text.
 */
export type AndesCheckboxSize = 'sm' | 'md' | 'lg';

/**
 * Validation tier, mirroring AndesInput's `status`: `error` paints the danger color AND sets
 * `aria-invalid`, `warning` only paints the warning color (a warning is advice, not a failure,
 * so it must not be announced as invalid).
 */
export type AndesCheckboxStatus = 'error' | 'warning';

/**
 * How the checkbox is drawn:
 * - `default`: the plain box beside its label.
 * - `card`: the box and its label (and description) inside a bordered, fully clickable card.
 * - `button`: a toggle button; inside a group the buttons join into one segmented control,
 *   the same family look as AndesRadioGroup's `optionType="button"`.
 */
export type AndesCheckboxVariant = 'default' | 'card' | 'button';

/** Direction a group lays its items out in (`columns` switches to a grid instead). */
export type AndesCheckboxGroupOrientation = 'vertical' | 'horizontal';

/**
 * Equality used by a group to match its `value` entries against the items' values. Needed for
 * object values, where the selected entry and the option are rarely the same reference (a
 * value fetched from the server versus the option list, say).
 */
export type AndesCheckboxCompareWith<T = unknown> = (a: T, b: T) => boolean;

/** Payload of `AndesCheckboxGroup`'s `limitReached` output. */
export interface AndesCheckboxGroupLimit<T = unknown> {
  /**
   * `max`: a user change just brought the selection up to `maxCount` (the unchecked items
   * are now disabled). `min`: the user tried to uncheck below `minCount` and was stopped.
   */
  readonly limit: 'min' | 'max';
  /** The configured bound that was hit. */
  readonly count: number;
  /** The selection at that moment. */
  readonly value: readonly T[];
}

/**
 * `booleanAttribute` that keeps `undefined` as "not set", so an input can tell an explicit
 * `false` apart from "inherit from the group / fall back to the variant's default".
 */
export function optionalBooleanAttribute(value: unknown): boolean | undefined {
  return value === undefined || value === null
    ? undefined
    : booleanAttribute(value);
}

/**
 * `numberAttribute` that maps a missing, empty or non-numeric value to `undefined` (no
 * limit) instead of `NaN`, so a bound like `[maxCount]="limit ?? undefined"` simply turns off.
 */
export function optionalNumberAttribute(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  const parsed = numberAttribute(value, Number.NaN);
  return Number.isNaN(parsed) ? undefined : parsed;
}
