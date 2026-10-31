import {
  booleanAttribute,
  computed,
  Injectable,
  numberAttribute,
  Signal,
  TemplateRef,
} from '@angular/core';

export type AndesRadioGroupOrientation = 'vertical' | 'horizontal';
/** `default` renders the classic circle + dot; `button` renders a segmented-control face. */
export type AndesRadioOptionType = 'default' | 'button';
/** Only affects `optionType="button"`: `outline` tints the checked segment's border/text,
 *  `solid` fills it with the primary color. */
export type AndesRadioButtonStyle = 'outline' | 'solid';
/** Only affects `optionType="button"` - heights mirror `AndesButton`'s sm/md/lg. */
export type AndesRadioSize = 'sm' | 'md' | 'lg';
export type AndesRadioLabelPlacement = 'end' | 'start';

/**
 * Validation tier, mirroring AndesInput and AndesCheckbox: `error` paints the danger color AND
 * sets `aria-invalid`; `warning` only paints the warning color (a warning is advice, not a
 * failure, so it is not announced as invalid).
 */
export type AndesRadioStatus = 'error' | 'warning';

/**
 * How a radio is drawn: `default` is the circle beside its label; `card` turns the whole item
 * into a bordered, fully clickable card that lights up when checked. `optionType="button"`
 * has its own look and wins over `card` (a button segment cannot also be a card).
 */
export type AndesRadioVariant = 'default' | 'card';

/**
 * Equality used by a group to match its `value` against the items' values. Needed for object
 * values, where the selected object and the option are rarely the same reference (a value
 * fetched from the server versus the option list, say).
 */
export type AndesRadioCompareWith<T = unknown> = (a: T, b: T) => boolean;

/**
 * `booleanAttribute` that keeps `undefined` as "not set", so an input can tell an explicit
 * `false` apart from "inherit from the group / fall back to the default".
 */
export function optionalBooleanAttribute(value: unknown): boolean | undefined {
  return value === undefined || value === null
    ? undefined
    : booleanAttribute(value);
}

/** `columns` must be a whole number of at least 1; anything else means "no grid". */
export function columnsAttribute(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  const parsed = numberAttribute(value, Number.NaN);
  return Number.isNaN(parsed) || parsed < 1 ? undefined : Math.floor(parsed);
}

/**
 * What an `AndesRadioGroup` exposes to its items. The group owns every signal (its inputs
 * and its `value` model are the single source of truth); the items only ever read them and
 * report user selection back through `select()`.
 */
export interface AndesRadioGroupSource {
  readonly name: Signal<string>;
  readonly value: Signal<unknown>;
  readonly disabled: Signal<boolean>;
  readonly required: Signal<boolean>;
  readonly invalid: Signal<boolean>;
  readonly optionType: Signal<AndesRadioOptionType>;
  readonly buttonStyle: Signal<AndesRadioButtonStyle>;
  readonly size: Signal<AndesRadioSize>;
  readonly orientation: Signal<AndesRadioGroupOrientation>;
  readonly block: Signal<boolean>;
  readonly labelPlacement: Signal<AndesRadioLabelPlacement>;
  readonly readOnly: Signal<boolean>;
  readonly status: Signal<AndesRadioStatus | undefined>;
  readonly variant: Signal<AndesRadioVariant>;
  readonly columns: Signal<number | undefined>;
  readonly showIndicator: Signal<boolean | undefined>;
  readonly indicator: Signal<TemplateRef<unknown> | undefined>;
  /** Whether `value` is the group's current selection (honors `compareWith`). */
  isSelected(value: unknown): boolean;
  select(value: unknown, event: Event): void;
}

/**
 * DI-scoped shared state for one `AndesRadioGroup` instance and its `AndesRadio` children.
 *
 * `AndesRadioGroup` provides a fresh instance of this service in its own `providers: [...]`
 * array (see radio-group.ts) and `connect()`s itself to it from its constructor; every
 * `AndesRadio` - whether projected by the consumer or generated from the group's `options`
 * input - injects that same instance via the normal element-injector hierarchy. This is
 * Angular's equivalent of React Context - no `@ContentChildren` query or manual parent/child
 * registration is needed, and each group on the page gets its own isolated instance.
 *
 * The state reads straight through to the group's signals rather than mirroring them via
 * `effect()`s, so a `writeValue()`/`value.set()` is visible to the items synchronously, with
 * no change-detection round-trip in between.
 */
@Injectable()
export class AndesRadioGroupState {
  private source: AndesRadioGroupSource | undefined;

  readonly name = computed(() => this.group.name());
  readonly value = computed(() => this.group.value());
  readonly disabled = computed(() => this.group.disabled());
  readonly required = computed(() => this.group.required());
  readonly invalid = computed(() => this.group.invalid());
  readonly optionType = computed(() => this.group.optionType());
  readonly buttonStyle = computed(() => this.group.buttonStyle());
  readonly size = computed(() => this.group.size());
  readonly orientation = computed(() => this.group.orientation());
  readonly block = computed(() => this.group.block());
  readonly labelPlacement = computed(() => this.group.labelPlacement());
  readonly readOnly = computed(() => this.group.readOnly());
  readonly status = computed(() => this.group.status());
  readonly variant = computed(() => this.group.variant());
  readonly columns = computed(() => this.group.columns());
  readonly showIndicator = computed(() => this.group.showIndicator());
  readonly indicator = computed(() => this.group.indicator());

  /** Reads the group's `value` signal, so calling it inside a `computed()` tracks the
   *  selection (and `compareWith`) like any other signal. */
  isSelected(value: unknown): boolean {
    return this.group.isSelected(value);
  }

  /** Called once by `AndesRadioGroup`'s constructor - always before any item is created,
   *  since the group's host component is instantiated before its content/view children. */
  connect(source: AndesRadioGroupSource): void {
    this.source = source;
  }

  /** Called by an `AndesRadio` item when the user selects it (a real user interaction). */
  select(value: unknown, event: Event): void {
    this.group.select(value, event);
  }

  private get group(): AndesRadioGroupSource {
    if (!this.source) {
      throw new Error(
        'AndesRadioGroupState used before an AndesRadioGroup connected to it - ' +
          '<andes-radio> must be placed inside an <andes-radio-group>.',
      );
    }
    return this.source;
  }
}
