import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  effect,
  forwardRef,
  inject,
  input,
  model,
  output,
  Signal,
  signal,
  TemplateRef,
  untracked,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import {
  AbstractControl,
  ControlValueAccessor,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  ValidationErrors,
  Validator,
} from '@angular/forms';
import clsx from 'clsx';

import { AndesCheckbox } from './checkbox';
import {
  AndesCheckboxGroupState,
  AndesCheckboxValue,
} from './checkbox-group-state';
import {
  AndesCheckboxOption,
  AndesCheckboxOptionInput,
  AndesCheckboxOptionLabel,
} from './checkbox-option-label';
import {
  AndesCheckboxCompareWith,
  AndesCheckboxGroupLimit,
  AndesCheckboxGroupOrientation,
  AndesCheckboxSize,
  AndesCheckboxStatus,
  AndesCheckboxVariant,
  optionalBooleanAttribute,
  optionalNumberAttribute,
} from './checkbox-types';

export type { AndesCheckboxGroupOrientation } from './checkbox-types';

/** `columns` must be a whole number of at least 1; anything else means "no grid". */
function columnsAttribute(value: unknown): number | undefined {
  const parsed = optionalNumberAttribute(value);
  return parsed !== undefined && parsed >= 1 ? Math.floor(parsed) : undefined;
}

/**
 * Coordinates the checked state of the `AndesCheckbox` items projected into it, exposing the
 * selection as one array of item values.
 *
 * ```html
 * <andes-checkbox-group [(value)]="fruits" aria-label="Fruits">
 *   <andes-checkbox andesSelectAll>Select all</andes-checkbox>
 *   <andes-checkbox value="apple">Apple</andes-checkbox>
 *   <andes-checkbox value="banana">Banana</andes-checkbox>
 * </andes-checkbox-group>
 * ```
 *
 * Items are discovered through DI (see `AndesCheckboxGroupState`), not a `contentChildren()`
 * query, so they can sit at any depth inside the group - wrapped in `@for`, a `<fieldset>`, or
 * any other component - and still participate.
 *
 * Alternatively (or additionally), pass `options` and the group renders one checkbox per
 * option itself:
 *
 * ```html
 * <andes-checkbox-group [options]="['Apple', 'Banana']" [(value)]="fruits" />
 * ```
 */
@Component({
  selector: 'andes-checkbox-group',
  imports: [AndesCheckbox, NgTemplateOutlet],
  templateUrl: './checkbox-group.html',
  styleUrl: './checkbox-group.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    AndesCheckboxGroupState,
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AndesCheckboxGroup),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => AndesCheckboxGroup),
      multi: true,
    },
  ],
  host: {
    // `role="group"` rather than the ARIA pattern's `group`-less default: a set of related
    // checkboxes is a group, not a `radiogroup`, and the accessible name below is what makes
    // the relationship announced at all.
    role: 'group',
    '[class]': 'classes()',
    '[attr.aria-label]': 'ariaLabel()',
    '[attr.aria-labelledby]': 'ariaLabelledby()',
    '[attr.aria-disabled]': 'isDisabled() || null',
    '[attr.data-disabled]': 'isDisabled() ? "" : null',
    '[attr.data-orientation]': 'resolvedOrientation()',
    '[attr.data-required]': 'required() ? "" : null',
    // Leaving the group - not moving between its checkboxes - marks it touched.
    '(focusout)': 'onFocusOut($event)',
    '[attr.data-readonly]': 'readOnly() ? "" : null',
    '[style.--andes-checkbox-group-columns]': 'columns() ?? null',
  },
})
export class AndesCheckboxGroup<T extends AndesCheckboxValue = string>
  implements ControlValueAccessor, Validator
{
  private readonly state = inject(AndesCheckboxGroupState);

  /**
   * Two-way selection surface (`model()` auto-generates `valueChange`, enabling
   * `[(value)]`), and simultaneously the value this control reports to Angular forms. It is
   * deliberately the SAME signal for both: `AndesCheckbox` learned the hard way (see the long
   * note on its own `checked` model) that a separate "internal" copy of a controlled value can
   * diverge from the parent's after a click and then never recover, because a parent
   * re-asserting a value the reactive graph never saw change is an unobservable no-op write.
   */
  readonly value = model<readonly T[]>([]);

  readonly disabled = input(false, { transform: booleanAttribute });

  /**
   * Stacks the items (`vertical`) or lines them up and wraps them (`horizontal`). Unset, a
   * `variant="button"` group is horizontal (one segmented row) and every other group is
   * vertical. `columns` replaces either with a grid.
   */
  readonly orientation = input<AndesCheckboxGroupOrientation | undefined>(
    undefined,
  );

  /**
   * Lays the items out in a grid of this many equal columns (a whole number of at least 1),
   * for long lists and card pickers; `orientation` stays the simpler choice for a single row
   * or column. A button group in columns is drawn as separate buttons, not one segmented bar.
   */
  readonly columns = input<number | undefined, unknown>(undefined, {
    transform: columnsAttribute,
  });

  /**
   * Like a checkbox's `readOnly`, for every item: nothing can be changed, but the items stay
   * focusable, keep their normal look and are announced as read-only (`aria-readonly`).
   */
  readonly readOnly = input(false, { transform: booleanAttribute });

  /**
   * At least one item must be checked: sets `data-required` on the group (`aria-required` is not allowed on a `group` role) and, under Angular
   * forms, makes the control invalid (`{ required: true }`) while the selection is empty.
   * Deliberately NOT forwarded to the items' native `required`, which would demand that every
   * single box be checked.
   */
  readonly required = input(false, { transform: booleanAttribute });

  /**
   * The fewest items that may stay checked. Once the selection is at this count the checked
   * items refuse to be unchecked (the click is blocked, and `limitReached` fires with
   * `limit: 'min'`); clearing through select-all keeps the first `minCount` selections. A
   * form control below it (a written value, say) is invalid with `{ minCount }`.
   */
  readonly minCount = input<number | undefined, unknown>(undefined, {
    transform: optionalNumberAttribute,
  });

  /**
   * The most items that may be checked. Once reached, the unchecked items are disabled (and
   * look it) until one is unchecked, `limitReached` fires with `limit: 'max'`, and select-all
   * only ever fills up to the limit. A form control over it is invalid with `{ maxCount }`.
   */
  readonly maxCount = input<number | undefined, unknown>(undefined, {
    transform: optionalNumberAttribute,
  });

  /**
   * Equality for matching `value` entries against the items' values - needed for object
   * values, where the selected objects are rarely the same references as the options (a
   * value loaded from the server, say). Defaults to `===`. The value the group emits keeps the
   * entries the parent wrote in, so a match hands back the parent's own objects.
   */
  readonly compareWith = input<AndesCheckboxCompareWith<T> | undefined>(
    undefined,
  );

  /** Size for every item (an item's own `size` wins). See `AndesCheckbox.size`. */
  readonly size = input<AndesCheckboxSize | undefined>(undefined);

  /**
   * Status for every item (an item's own `status` wins): `error` paints and announces each
   * item as invalid, `warning` only paints it. See `AndesCheckbox.status`.
   */
  readonly status = input<AndesCheckboxStatus | undefined>(undefined);

  /**
   * Variant for every item (an item's or option's own `variant` wins). `button` joins the
   * items into one segmented control; `card` spaces the cards apart.
   */
  readonly variant = input<AndesCheckboxVariant | undefined>(undefined);

  /** Shows or hides every item's box; see `AndesCheckbox.indicator`. */
  readonly indicator = input<boolean | undefined, unknown>(undefined, {
    transform: optionalBooleanAttribute,
  });

  /** Tick template for every item (an item's own wins); see `AndesCheckbox.checkedIcon`. */
  readonly checkedIcon = input<TemplateRef<unknown> | undefined>(undefined);

  /** Dash template for every item (an item's own wins). */
  readonly indeterminateIcon = input<TemplateRef<unknown> | undefined>(
    undefined,
  );

  /**
   * `name` for every item's native input (an item's own `name` still wins), so a plain HTML
   * form submission posts the selection as repeated `name=value` pairs.
   */
  readonly name = input<string | undefined>(undefined);

  /**
   * Checkboxes to render from data rather than projecting them. Rendered AFTER any projected
   * content, so a projected `<andes-checkbox andesSelectAll>` naturally sits above them.
   * Entries are strings, numbers or option objects; a number value stays a number in `value`.
   */
  readonly options = input<readonly AndesCheckboxOptionInput<T>[]>([]);

  /**
   * Fires with the new selection on every USER change (an item or select-all click). Unlike
   * `valueChange`, never for a programmatic `[(value)]` or form write. Named `changed` rather
   * than `change` because items' native `change` events bubble up to this host (see
   * `AndesCheckbox.changed`).
   */
  readonly changed = output<readonly T[]>();

  /**
   * A user change just brought the selection up to `maxCount`, or a user tried to uncheck
   * below `minCount` and was stopped - the moment to explain the limit (a hint, a toast).
   * Never fires for programmatic writes.
   */
  readonly limitReached = output<AndesCheckboxGroupLimit<T>>();

  protected readonly optionLabel = contentChild(AndesCheckboxOptionLabel);

  /**
   * A bare string or number is shorthand for `{ label, value }`; any object entry IS an option
   * object (an object value always travels wrapped in one, as its `value`).
   */
  protected readonly normalizedOptions = computed(() =>
    this.options().map((option): AndesCheckboxOption<T> =>
      typeof option === 'object' && option !== null
        ? (option as AndesCheckboxOption<T>)
        : { label: String(option), value: option as T },
    ),
  );
  readonly ariaLabel = input<string | undefined>(undefined, {
    alias: 'aria-label',
  });
  readonly ariaLabelledby = input<string | undefined>(undefined, {
    alias: 'aria-labelledby',
  });

  /** Set through `setDisabledState()` by `[formControl]`/`[(ngModel)]`; distinct from the
   *  `disabled` input, which is the group's own template-authored state. Either disables the
   *  whole group (and, through the shared state, every item in it). */
  private readonly cvaDisabled = signal(false);

  protected readonly isDisabled = computed(
    () => this.disabled() || this.cvaDisabled(),
  );

  protected readonly resolvedOrientation = computed(
    () =>
      this.orientation() ??
      (this.variant() === 'button' ? 'horizontal' : 'vertical'),
  );

  protected readonly classes = computed(() =>
    clsx(
      'andes-checkbox-group',
      `andes-checkbox-group--${this.resolvedOrientation()}`,
      this.isDisabled() && 'andes-checkbox-group--disabled',
      this.columns() !== undefined && 'andes-checkbox-group--columns',
      this.variant() === 'card' && 'andes-checkbox-group--card',
      this.variant() === 'button' && 'andes-checkbox-group--button',
    ),
  );

  private onChange: (value: readonly T[]) => void = () => undefined;
  private onTouched: () => void = () => undefined;
  private onValidatorChange: () => void = () => undefined;

  constructor() {
    this.state.connect({
      readOnly: this.readOnly,
      size: this.size,
      status: this.status,
      variant: this.variant,
      indicator: this.indicator,
      orientation: this.resolvedOrientation,
      columns: this.columns,
      minCount: this.minCount,
      maxCount: this.maxCount,
      // The state is shared by every item and so compares the wider `AndesCheckboxValue`; it
      // only ever hands this function values that came from this group's own `T`s.
      compareWith: this.compareWith as unknown as Signal<
        AndesCheckboxCompareWith | undefined
      >,
      checkedIcon: this.checkedIcon,
      indeterminateIcon: this.indeterminateIcon,
    });

    effect(() => this.state.setDisabled(this.isDisabled()));
    effect(() => this.state.setName(this.name()));

    // Parent -> state. `setValue` normalizes (dedupes and reorders) the array, so writing the
    // normalized result back into the model below cannot loop: the effect re-runs once, hands
    // `setValue` an already-normalized array, and the resulting `set` is a no-op.
    effect(() => this.state.setValue(this.value()));

    // State -> parent, for USER-driven changes only. One handler feeds both the two-way
    // binding and Angular forms, so `[(value)]` and `[formControl]` can never disagree.
    // The state is shared by every item and so stores the wider `AndesCheckboxValue`; it only
    // ever holds values that came from this group's own `T`-typed items, options or `value`.
    this.state.registerOnUserChange((nextValue) => {
      const next = nextValue as readonly T[];
      this.value.set(next);
      this.onChange(next);
      this.onTouched();
      this.changed.emit(next);
    });

    this.state.registerOnLimit((limit, count) =>
      this.limitReached.emit({ limit, count, value: this.value() }),
    );

    // The rules `validate()` applies changed: ask the form to run it again.
    effect(() => {
      this.required();
      this.minCount();
      this.maxCount();
      untracked(() => this.onValidatorChange());
    });
  }

  /**
   * Angular forms validation (the group is its own `NG_VALIDATORS`): `required` with an
   * empty selection, fewer than `minCount` or more than `maxCount` items.
   */
  validate(control: AbstractControl): ValidationErrors | null {
    const selected = (control.value as readonly T[] | null) ?? [];
    const errors: ValidationErrors = {};
    const min = this.minCount();
    const max = this.maxCount();

    if (this.required() && selected.length === 0) {
      errors['required'] = true;
    }
    if (min !== undefined && selected.length < min) {
      errors['minCount'] = { min, actual: selected.length };
    }
    if (max !== undefined && selected.length > max) {
      errors['maxCount'] = { max, actual: selected.length };
    }

    return Object.keys(errors).length > 0 ? errors : null;
  }

  protected onFocusOut(event: FocusEvent): void {
    const next = event.relatedTarget as Node | null;
    if (!next || !(event.currentTarget as Node).contains(next)) {
      this.onTouched();
    }
  }

  registerOnValidatorChange(fn: () => void): void {
    this.onValidatorChange = fn;
  }

  writeValue(value: readonly T[] | null): void {
    this.value.set(value ?? []);
  }

  registerOnChange(fn: (value: readonly T[]) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.cvaDisabled.set(isDisabled);
  }
}
