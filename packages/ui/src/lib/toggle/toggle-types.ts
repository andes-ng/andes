import { InjectionToken, numberAttribute, Signal } from '@angular/core';

/** `default` is a plain button that tints when pressed; `outline` adds a 1px border. */
export type AndesToggleVariant = 'default' | 'outline';
export type AndesToggleSize = 'sm' | 'md' | 'lg';
export type AndesToggleGroupType = 'single' | 'multiple';
export type AndesToggleGroupOrientation = 'horizontal' | 'vertical';
/** Validation tier, like AndesInput's `status`. */
export type AndesToggleStatus = 'error' | 'warning';

/** Payload of `AndesToggleGroup`'s `selectionChange` output (user changes only). */
export interface AndesToggleGroupChange<T = unknown> {
  /** The new value: the pressed value or `null` for `single`, the array for `multiple`. */
  readonly value: T | readonly T[] | null;
  /** The value this change pressed, if any. */
  readonly added?: T;
  /** The value this change released, if any (a `single` change can release one and press
   *  another). */
  readonly removed?: T;
}

/** Payload of `AndesToggleGroup`'s `limitReached` output. */
export interface AndesToggleGroupLimit<T = unknown> {
  /**
   * `max`: a user change just brought the pressed count up to `maxCount` (the unpressed toggles
   * are now disabled). `min`: the user tried to release a toggle below `minCount` and was
   * stopped.
   */
  readonly limit: 'min' | 'max';
  /** The configured bound that was hit. */
  readonly count: number;
  /** The pressed values at that moment. */
  readonly value: readonly T[];
}

/** Parses a number input; anything that is not a number means "not set". */
export function optionalNumberAttribute(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  const parsed = numberAttribute(value, Number.NaN);
  return Number.isNaN(parsed) ? undefined : parsed;
}

/** What a toggle inside a group reads from and reports to it. */
export interface AndesToggleGroupApi {
  readonly variant: Signal<AndesToggleVariant>;
  readonly size: Signal<AndesToggleSize | undefined>;
  readonly status: Signal<AndesToggleStatus | undefined>;
  /** The group's size in effect: its own, else its form's (`undefined` for the default). */
  readonly resolvedSize: Signal<AndesToggleSize | undefined>;
  /** The group's status in effect: its own, else its enclosing field's error or warning. */
  readonly resolvedStatus: Signal<AndesToggleStatus | undefined>;
  readonly isDisabled: Signal<boolean>;
  /** Nothing can be changed, but the toggles stay focusable and keep their look. */
  readonly readOnly: Signal<boolean>;
  readonly isPressed: (value: unknown) => boolean;
  /** Whether the group has reached `maxCount` and this (unpressed) value is therefore off. */
  readonly isLimitDisabled: (value: unknown) => boolean;
  /** The one toggle instance in the tab order (roving tabindex). */
  readonly tabbable: Signal<unknown>;
  readonly toggle: (value: unknown) => void;
}

export const ANDES_TOGGLE_GROUP = new InjectionToken<AndesToggleGroupApi>(
  'ANDES_TOGGLE_GROUP',
);
