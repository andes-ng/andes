import {
  computed,
  InjectionToken,
  Injectable,
  Signal,
  signal,
  TemplateRef,
} from '@angular/core';

import type {
  AndesCheckboxCompareWith,
  AndesCheckboxGroupOrientation,
  AndesCheckboxSize,
  AndesCheckboxStatus,
  AndesCheckboxVariant,
} from './checkbox-types';

/**
 * What a checkbox can contribute to its group's selection. Numbers are kept as numbers (and
 * compared strictly), so a group over numeric ids reports `[1, 3]`, never `['1', '3']`.
 * Objects are accepted too; give the group a `compareWith` when the selected objects are not
 * the very same references as the items' values.
 */
export type AndesCheckboxValue = string | number | object;

/**
 * One `AndesCheckbox` participating in an `AndesCheckboxGroup`.
 *
 * Both members are signals rather than plain values because an item's `value` and `disabled`
 * are themselves `input()`s that can change at any time - the group's aggregate state
 * (`allSelected`/`indeterminate`) has to recompute when they do, which it only does if it
 * reads them reactively.
 */
export interface AndesCheckboxGroupItem {
  /** `undefined` while the checkbox carries no `value` - such a checkbox is rendered inside
   *  the group but has nothing to contribute to an array of selected values, so it is ignored
   *  by the aggregate and by select-all. */
  readonly value: Signal<AndesCheckboxValue | undefined>;
  /** The item's OWN disabled state (its input, its form control, the group's `disabled`) -
   *  never the temporary disabling `maxCount` applies, which must not change the aggregate. */
  readonly disabled: Signal<boolean>;
}

/**
 * The group inputs its items read through to. Handed over as signals (see `connect()`), so an
 * item always sees the group's current input value with no `effect()` round-trip between.
 */
export interface AndesCheckboxGroupConfig {
  readonly readOnly: Signal<boolean>;
  readonly size: Signal<AndesCheckboxSize | undefined>;
  readonly status: Signal<AndesCheckboxStatus | undefined>;
  readonly variant: Signal<AndesCheckboxVariant | undefined>;
  readonly indicator: Signal<boolean | undefined>;
  readonly orientation: Signal<AndesCheckboxGroupOrientation>;
  readonly columns: Signal<number | undefined>;
  readonly minCount: Signal<number | undefined>;
  readonly maxCount: Signal<number | undefined>;
  readonly compareWith: Signal<AndesCheckboxCompareWith | undefined>;
  readonly checkedIcon: Signal<TemplateRef<unknown> | undefined>;
  readonly indeterminateIcon: Signal<TemplateRef<unknown> | undefined>;
}

/**
 * Marker provided by `AndesCheckboxSelectAll` on its own host element.
 *
 * `AndesCheckbox` injects it with `{ optional: true, self: true }` to tell "I am the group's
 * select-all toggle" apart from "I am one of the group's items". Without it, a select-all
 * checkbox that happened to carry a `value` would register itself as an item and end up
 * counting toward the very aggregate it is supposed to summarize. It lives in this file
 * (rather than in checkbox-select-all.ts) purely to keep `AndesCheckbox` from importing the
 * directive that already imports `AndesCheckbox` - the token breaks that cycle.
 */
export const ANDES_CHECKBOX_SELECT_ALL = new InjectionToken<unknown>(
  'ANDES_CHECKBOX_SELECT_ALL',
);

const sameValue: AndesCheckboxCompareWith = (a, b) => a === b;

/**
 * DI-scoped shared state for one `AndesCheckboxGroup` and the `AndesCheckbox` items projected
 * into it.
 *
 * `AndesCheckboxGroup` provides a fresh instance in its own `providers: [...]`; every
 * `AndesCheckbox` inside it injects that same instance through the element-injector hierarchy
 * (optionally - a checkbox used on its own finds no provider and simply keeps its standalone
 * behavior). This is the same convention `AndesRadioGroupState` establishes: no
 * `contentChildren()` query, no manual parent/child wiring, and every group on the page gets
 * its own isolated instance for free.
 */
@Injectable()
export class AndesCheckboxGroupState {
  private readonly _value = signal<readonly AndesCheckboxValue[]>([]);
  private readonly _disabled = signal(false);
  private readonly _name = signal<string | undefined>(undefined);
  private readonly _items = signal<readonly AndesCheckboxGroupItem[]>([]);
  private readonly _config = signal<AndesCheckboxGroupConfig | null>(null);

  readonly value = this._value.asReadonly();
  readonly disabled = this._disabled.asReadonly();
  /** The group's `name`, which every item without a `name` of its own submits under. */
  readonly name = this._name.asReadonly();

  readonly readOnly = computed(() => this._config()?.readOnly() ?? false);
  readonly size = computed(() => this._config()?.size());
  readonly status = computed(() => this._config()?.status());
  readonly variant = computed(() => this._config()?.variant());
  readonly indicator = computed(() => this._config()?.indicator());
  readonly orientation = computed(
    () => this._config()?.orientation() ?? 'vertical',
  );
  readonly columns = computed(() => this._config()?.columns());
  readonly checkedIcon = computed(() => this._config()?.checkedIcon());
  readonly indeterminateIcon = computed(() =>
    this._config()?.indeterminateIcon(),
  );
  private readonly minCount = computed(() => this._config()?.minCount());
  private readonly maxCount = computed(() => this._config()?.maxCount());
  private readonly compare = computed(
    () => this._config()?.compareWith() ?? sameValue,
  );

  /** At (or over) `maxCount`: the unchecked items are disabled until one is unchecked. */
  readonly maxReached = computed(() => {
    const max = this.maxCount();
    return max !== undefined && this._value().length >= max;
  });

  /** At (or under) `minCount`: the checked items cannot be unchecked. */
  private readonly minReached = computed(() => {
    const min = this.minCount();
    return min !== undefined && this._value().length <= min;
  });

  /**
   * Only ENABLED items count toward the aggregate, and only they are toggled by select-all.
   * A disabled item can never be changed by clicking select-all, so counting it would leave
   * select-all permanently stuck at `indeterminate` - visibly broken - whenever a disabled
   * item happened to be unchecked.
   */
  private readonly selectableValues = computed(() =>
    this._items()
      .filter((item) => !item.disabled())
      .map((item) => item.value())
      .filter((value): value is AndesCheckboxValue => value !== undefined),
  );

  private readonly selectedCount = computed(() => {
    const selected = this._value();
    return this.selectableValues().filter((value) =>
      this.contains(selected, value),
    ).length;
  });

  /**
   * Every selectable item is checked - or, with a `maxCount`, as many as the limit allows.
   * The second case keeps select-all honest under a limit: it reads "full" (checked) once the
   * limit is hit, so its next click clears the selection instead of trying, and failing, to
   * add items the limit forbids.
   */
  readonly allSelected = computed(
    () =>
      this.selectableValues().length > 0 &&
      (this.selectedCount() === this.selectableValues().length ||
        (this.maxReached() && this.selectedCount() > 0)),
  );

  readonly someSelected = computed(() => this.selectedCount() > 0);

  /** The "mixed" state a select-all toggle renders: some, but not all, items checked. */
  readonly indeterminate = computed(
    () => this.someSelected() && !this.allSelected(),
  );

  /**
   * Invoked for USER-driven changes only (an item click or a select-all click), never for a
   * programmatic `writeValue()`/`[(value)]` write - matching `ControlValueAccessor` semantics,
   * where echoing a programmatic write back to `onChange` would feed the form its own value.
   * `AndesCheckboxGroup` registers the single handler that updates its `value` model and
   * notifies Angular forms; keeping forms wiring in the component (rather than in this
   * service) is what lets the group expose `value` as a two-way `model()` and a form control
   * at the same time, with one code path feeding both.
   */
  private onUserChange: (value: readonly AndesCheckboxValue[]) => void = () =>
    undefined;

  /** Told when a user change hits `maxCount` or is stopped by `minCount`. */
  private onLimit: (limit: 'min' | 'max', count: number) => void = () =>
    undefined;

  /** Hands the group's inputs to the items (see `AndesCheckboxGroupConfig`). */
  connect(config: AndesCheckboxGroupConfig): void {
    this._config.set(config);
  }

  isSelected(value: AndesCheckboxValue): boolean {
    return this.contains(this._value(), value);
  }

  /** An unchecked item is disabled while the selection sits at `maxCount`. */
  isLimitDisabled(value: AndesCheckboxValue): boolean {
    return this.maxReached() && !this.isSelected(value);
  }

  /** A checked item cannot be unchecked while the selection sits at `minCount`. */
  isLocked(value: AndesCheckboxValue): boolean {
    return this.minReached() && this.isSelected(value);
  }

  /** A user tried to uncheck a locked item (see `isLocked`). */
  notifyMinBlocked(): void {
    this.onLimit('min', this.minCount() ?? 0);
  }

  setDisabled(disabled: boolean): void {
    this._disabled.set(disabled);
  }

  setName(name: string | undefined): void {
    this._name.set(name);
  }

  /** Programmatic write - from the group's `value` model or its `writeValue()`. */
  setValue(value: readonly AndesCheckboxValue[] | null | undefined): void {
    this._value.set(this.order(value ?? []));
  }

  registerItem(item: AndesCheckboxGroupItem): () => void {
    this._items.update((items) => [...items, item]);

    return () => {
      this._items.update((items) =>
        items.filter((candidate) => candidate !== item),
      );
    };
  }

  /**
   * A single item was clicked. The limits are enforced again here (not only by disabling or
   * blocking the click) so that no path - a synthetic `change`, a test harness - can push the
   * selection past them.
   */
  toggleItem(value: AndesCheckboxValue, checked: boolean): void {
    const current = this._value();
    if (checked === this.contains(current, value)) {
      return;
    }
    if (checked ? this.maxReached() : this.minReached()) {
      return;
    }

    this.commit(
      checked
        ? [...current, value]
        : current.filter((it) => !this.compare()(it, value)),
    );
  }

  /**
   * The select-all toggle was clicked. Selections of items that are disabled (or of values
   * with no rendered item at all) are deliberately preserved either way - select-all only ever
   * speaks for the items it can actually reach. Selecting stops at `maxCount` (items are
   * added in template order); clearing keeps the first `minCount` selections.
   */
  setAllSelected(selected: boolean): void {
    const selectable = this.selectableValues();
    const current = this._value();

    if (selected) {
      const max = this.maxCount() ?? Number.POSITIVE_INFINITY;
      const next = [...current];
      for (const value of selectable) {
        if (next.length >= max) {
          break;
        }
        if (!this.contains(next, value)) {
          next.push(value);
        }
      }
      this.commit(next);
      return;
    }

    const untouched = current.filter(
      (value) => !this.contains(selectable, value),
    );
    const keep = Math.max(0, (this.minCount() ?? 0) - untouched.length);
    const kept = selectable
      .filter((value) => this.contains(current, value))
      .slice(0, keep);
    this.commit([...untouched, ...kept]);
  }

  registerOnUserChange(
    fn: (value: readonly AndesCheckboxValue[]) => void,
  ): void {
    this.onUserChange = fn;
  }

  registerOnLimit(fn: (limit: 'min' | 'max', count: number) => void): void {
    this.onLimit = fn;
  }

  private contains(
    list: readonly AndesCheckboxValue[],
    value: AndesCheckboxValue,
  ): boolean {
    const compare = this.compare();
    return list.some((candidate) => compare(candidate, value));
  }

  private commit(next: readonly AndesCheckboxValue[]): void {
    const ordered = this.order(next);
    const previous = this._value();
    // A click that changes nothing (select-all at a limit) is not a user change: emitting it
    // would report a "new" selection identical to the old one.
    if (
      ordered.length === previous.length &&
      ordered.every((value, index) => value === previous[index])
    ) {
      return;
    }

    this._value.set(ordered);
    this.onUserChange(ordered);

    const max = this.maxCount();
    if (max !== undefined && ordered.length >= max && previous.length < max) {
      this.onLimit('max', max);
    }
  }

  /**
   * Emits the selected values in the order their checkboxes appear in the template, rather
   * than in click order, so the value is a stable function of the current selection - two
   * users ticking the same boxes in a different order produce the same array. Values with no
   * registered item (e.g. written in before the items render) keep their relative order at
   * the end. Duplicates (by `compareWith`) collapse to their first occurrence.
   */
  private order(
    values: readonly AndesCheckboxValue[],
  ): readonly AndesCheckboxValue[] {
    const unique: AndesCheckboxValue[] = [];
    for (const value of values) {
      if (!this.contains(unique, value)) {
        unique.push(value);
      }
    }
    const itemOrder = this._items()
      .map((item) => item.value())
      .filter((value): value is AndesCheckboxValue => value !== undefined);

    // The SELECTED entries are emitted (not the items' own values), so a `compareWith` match
    // hands the parent back the very objects it wrote in.
    const ordered: AndesCheckboxValue[] = [];
    for (const itemValue of itemOrder) {
      const match = unique.find((value) => this.compare()(value, itemValue));
      if (match !== undefined && !ordered.includes(match)) {
        ordered.push(match);
      }
    }
    for (const value of unique) {
      if (!ordered.includes(value)) {
        ordered.push(value);
      }
    }
    return ordered;
  }
}
