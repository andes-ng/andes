import { NgTemplateOutlet } from '@angular/common';
import {
  afterNextRender,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  forwardRef,
  inject,
  input,
  model,
  output,
  signal,
  TemplateRef,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import clsx from 'clsx';

import { AndesRadio } from './radio';
import {
  AndesRadioButtonStyle,
  AndesRadioCompareWith,
  AndesRadioGroupOrientation,
  AndesRadioGroupState,
  AndesRadioLabelPlacement,
  AndesRadioOptionType,
  AndesRadioSize,
  AndesRadioStatus,
  AndesRadioVariant,
  columnsAttribute,
  optionalBooleanAttribute,
} from './radio-group-state';

export type {
  AndesRadioButtonStyle,
  AndesRadioCompareWith,
  AndesRadioGroupOrientation,
  AndesRadioLabelPlacement,
  AndesRadioOptionType,
  AndesRadioSize,
  AndesRadioStatus,
  AndesRadioVariant,
} from './radio-group-state';

/** One entry of `AndesRadioGroup`'s `options` input. */
export interface AndesRadioOption<T = unknown> {
  label: string;
  value: T;
  /** Secondary text under the label (muted, and linked to the input with
   *  `aria-describedby`), e.g. what a plan includes on a card. */
  description?: string;
  disabled?: boolean;
  /** This option's own variant, over the group's (one highlighted card in a plain list). */
  variant?: AndesRadioVariant;
  /** Native tooltip on the rendered item. */
  title?: string;
  /** `id` of the rendered native `<input type="radio">`. */
  id?: string;
  /** Extra CSS class(es) on the rendered `<andes-radio>` item, e.g. to restyle one option. */
  class?: string;
  /** Inline styles on the rendered `<andes-radio>` item - a style string or an object of
   *  CSS properties, as accepted by Angular's `[style]` binding. */
  style?: string | Record<string, string | number>;
}

/** A bare string/number is shorthand for `{ label: String(value), value }`. */
export type AndesRadioOptionInput<T = unknown> =
  AndesRadioOption<T> | (T & string) | (T & number);

/** Context of the `optionLabel` template - `let-option` is the normalized option. */
export interface AndesRadioOptionLabelContext<T = unknown> {
  $implicit: AndesRadioOption<T>;
  checked: boolean;
  index: number;
}

/** Payload of the group's `(selectionChange)` output - emitted only for user selections, never for
 *  programmatic writes (`[value]`, `writeValue()`). */
export interface AndesRadioChange<T = unknown> {
  value: T;
  /** The native `change` event of the `<input type="radio">` the user selected. */
  event: Event;
}

let nextGroupId = 0;

function noop(): void {
  /* no-op default until registerOnChange/registerOnTouched is called by Angular forms */
}

@Component({
  selector: 'andes-radio-group',
  imports: [AndesRadio, NgTemplateOutlet],
  templateUrl: './radio-group.html',
  styleUrl: './radio-group.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    AndesRadioGroupState,
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AndesRadioGroup),
      multi: true,
    },
  ],
  host: {
    role: 'radiogroup',
    '[class]': 'classes()',
    '[attr.aria-label]': 'ariaLabel()',
    '[attr.aria-labelledby]': 'ariaLabelledby()',
    '[attr.aria-disabled]': 'isDisabled() || null',
    '[attr.aria-required]': 'required() || null',
    // Kept on the group host rather than forwarded to the native inputs: WAI-ARIA supports
    // aria-invalid on the radiogroup role but not on the individual radio role.
    '[attr.aria-invalid]': 'isInvalid() || null',
    // `aria-readonly` is supported on the radiogroup role (not on the individual radios).
    '[attr.aria-readonly]': 'readOnly() || null',
    '[attr.data-readonly]': 'readOnly() ? "" : null',
    '[style.--andes-radio-group-columns]': 'columns() ?? null',
    '[attr.data-disabled]': 'isDisabled() ? "" : null',
    '[attr.data-orientation]': 'resolvedOrientation()',
    '[attr.data-option-type]': 'optionType()',
    '(focusin)': 'onFocusIn($event)',
    '(focusout)': 'onFocusOut($event)',
    '(keydown)': 'onKeydown($event)',
  },
})
export class AndesRadioGroup<T = unknown> implements ControlValueAccessor {
  private readonly state = inject(AndesRadioGroupState);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly generatedName = `andes-radio-group-${++nextGroupId}`;

  /** Selected value. Two-way bindable (`[(value)]`); also driven by `[formControl]`/
   *  `[(ngModel)]` through the ControlValueAccessor. A one-way `[value]` that never changes
   *  only seeds the initial selection - use `[(value)]` to keep the parent in sync. */
  readonly value = model<T | null>(null);
  readonly name = input<string | undefined>(undefined);
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly required = input(false, { transform: booleanAttribute });
  /** Marks the group as failing validation - sets `aria-invalid` on the radiogroup and tints
   *  every item with the danger color. Same result as `status="error"`. */
  readonly ariaInvalid = input(false, {
    alias: 'aria-invalid',
    transform: booleanAttribute,
  });
  /** Validation tier for every item (an item's own `status` wins): `error` paints each item in
   *  the danger color and sets `aria-invalid` on the radiogroup, `warning` only paints it.
   *  Like AndesInput's and AndesCheckbox's `status`. */
  readonly status = input<AndesRadioStatus | undefined>(undefined);
  /** Nothing can be changed, but the items stay focusable, keep their normal look (no hover or
   *  pressed feedback) and the group is announced as read-only (`aria-readonly`). Unlike
   *  `disabled`, the items are not dimmed and stay in the tab order. */
  readonly readOnly = input(false, { transform: booleanAttribute });
  /** Lays the items out in a grid of this many equal columns (a whole number of at least 1),
   *  for long lists and card pickers; `orientation` stays the simpler choice for a single
   *  row or column. A button group in columns is drawn as separate buttons, not one segmented
   *  bar. */
  readonly columns = input<number | undefined, unknown>(undefined, {
    transform: columnsAttribute,
  });
  /** `card` turns every item into a bordered, fully clickable card (an option's own `variant`
   *  wins). Precedence: `optionType="button"` keeps its own look and wins over `card` - use
   *  one or the other on a group. */
  readonly variant = input<AndesRadioVariant>('default');
  /** Whether every item draws its circle (an item's own `showIndicator` wins). Defaults to
   *  shown; hide it on cards that are highlighted enough by their border and tint. A button
   *  segment never draws one. */
  readonly showIndicator = input<boolean | undefined, unknown>(undefined, {
    transform: optionalBooleanAttribute,
  });
  /** Replaces the dot of the checked radio in every item (an item's own `indicator` wins). A
   *  context-free template, typically an `<svg>` in `currentColor`, sized from the circle. */
  readonly indicator = input<TemplateRef<unknown> | undefined>(undefined);
  /** Equality for matching `value` against the items' values - needed for object values,
   *  where the selected object is rarely the same reference as the option (a value loaded
   *  from the server, say). Defaults to `===`. Selections still emit the option's own
   *  value. */
  readonly compareWith = input<AndesRadioCompareWith<T> | undefined>(undefined);
  /** Whether the arrow keys wrap around: ArrowRight/Down on the last radio moves to the first
   *  and ArrowLeft/Up on the first to the last (the native behavior, so the default). Set
   *  `false` to stop at the ends. */
  readonly loop = input(true, { transform: booleanAttribute });
  /** Defaults to `horizontal` for `optionType="button"` (a segmented control) and to
   *  `vertical` for the classic style. */
  readonly orientation = input<AndesRadioGroupOrientation | undefined>(
    undefined,
  );
  /** Generate the items from data instead of (or in addition to, rendered before)
   *  projected `<andes-radio>` children. */
  readonly options = input<readonly AndesRadioOptionInput<T>[]>([]);
  /** Custom label for every generated option; receives the option as `let-option`. */
  readonly optionLabel = input<
    TemplateRef<AndesRadioOptionLabelContext<T>> | undefined
  >(undefined);
  readonly optionType = input<AndesRadioOptionType>('default');
  readonly buttonStyle = input<AndesRadioButtonStyle>('outline');
  readonly size = input<AndesRadioSize>('md');
  /** Stretch the group to its container's width, sharing it equally between the items. */
  readonly block = input(false, { transform: booleanAttribute });
  readonly labelPlacement = input<AndesRadioLabelPlacement>('end');
  /** Focus the checked item (or the first enabled one) once the group first renders. */
  readonly autoFocus = input(false, { transform: booleanAttribute });
  readonly ariaLabel = input<string | undefined>(undefined, {
    alias: 'aria-label',
  });
  readonly ariaLabelledby = input<string | undefined>(undefined, {
    alias: 'aria-labelledby',
  });

  /** Fires only when the user selects an item (click, Space or arrow keys) - not for
   *  programmatic writes. Named `selectionChange` rather than `change` because a `change`
   *  output would collide with the native `change` event bubbling up from the inner
   *  `<input type="radio">` (Angular binds `(change)` to both). */
  readonly selectionChange = output<AndesRadioChange<T>>();

  /** Focus entered the group from outside (it does not fire when moving between its radios).
   *  Needed as an output because `focus` does not bubble to the host. */
  readonly focused = output<FocusEvent>();

  /** Focus left the group as a whole (not when moving between its radios). */
  readonly blurred = output<FocusEvent>();

  /** Set via `setDisabledState()` when bound through `[formControl]`/`[(ngModel)]` and the
   *  control itself is disabled - distinct from the `disabled` input, which is the group's own
   *  template-authored disabled state. Either one disables the whole group. */
  private readonly cvaDisabled = signal(false);

  private onChange: (value: T | null) => void = noop;
  protected onTouched: () => void = noop;

  protected readonly isDisabled = computed(
    () => this.disabled() || this.cvaDisabled(),
  );

  protected readonly resolvedName = computed(
    () => this.name() || this.generatedName,
  );

  protected readonly resolvedOrientation = computed<AndesRadioGroupOrientation>(
    () =>
      this.orientation() ??
      (this.optionType() === 'button' ? 'horizontal' : 'vertical'),
  );

  /** `aria-invalid` and `status="error"` are one state: same look, same announcement. */
  protected readonly isInvalid = computed(
    () => this.ariaInvalid() || this.status() === 'error',
  );

  protected readonly normalizedOptions = computed<AndesRadioOption<T>[]>(() =>
    this.options().map((option) =>
      typeof option === 'object' && option !== null
        ? (option as AndesRadioOption<T>)
        : { label: String(option), value: option as T },
    ),
  );

  protected readonly classes = computed(() =>
    clsx(
      'andes-radio-group',
      `andes-radio-group--${this.resolvedOrientation()}`,
      this.optionType() === 'button' && 'andes-radio-group--button',
      this.block() && 'andes-radio-group--block',
      this.isDisabled() && 'andes-radio-group--disabled',
      this.isInvalid() && 'andes-radio-group--invalid',
      this.status() === 'warning' && 'andes-radio-group--warning',
      this.readOnly() && 'andes-radio-group--readonly',
      this.columns() !== undefined && 'andes-radio-group--columns',
      this.variant() === 'card' &&
        this.optionType() !== 'button' &&
        'andes-radio-group--card',
    ),
  );

  constructor() {
    this.state.connect({
      name: this.resolvedName,
      value: this.value,
      disabled: this.isDisabled,
      required: this.required,
      invalid: this.ariaInvalid,
      readOnly: this.readOnly,
      status: this.status,
      variant: this.variant,
      columns: this.columns,
      showIndicator: this.showIndicator,
      indicator: this.indicator,
      isSelected: (value) => this.isSelected(value),
      optionType: this.optionType,
      buttonStyle: this.buttonStyle,
      size: this.size,
      orientation: this.resolvedOrientation,
      block: this.block,
      labelPlacement: this.labelPlacement,
      select: (value, event) => this.select(value as T, event),
    });

    afterNextRender(() => {
      if (this.autoFocus()) {
        this.focus();
      }
    });
  }

  /** Focus the checked item, or the first enabled one when nothing is checked yet - the
   *  same item a Tab key press would land on. */
  focus(options?: FocusOptions): void {
    const host = this.host.nativeElement;
    const target =
      host.querySelector<HTMLInputElement>(
        'input[type=radio]:checked:not(:disabled)',
      ) ??
      host.querySelector<HTMLInputElement>('input[type=radio]:not(:disabled)');
    target?.focus(options);
  }

  /** Remove focus from whichever item of this group currently has it (no-op otherwise). */
  blur(): void {
    const active = this.host.nativeElement.ownerDocument.activeElement;
    if (
      active instanceof HTMLElement &&
      this.host.nativeElement.contains(active)
    ) {
      active.blur();
    }
  }

  /** Whether `candidate` is the current selection, through `compareWith` when given. Nothing
   *  selected (`null`) matches nothing under a custom comparison, so it never has to cope
   *  with a missing value. */
  protected isSelected(candidate: unknown): boolean {
    const selected = this.value();
    const compare = this.compareWith();
    if (!compare) {
      return selected === candidate;
    }
    return selected == null || candidate == null
      ? selected === candidate
      : compare(selected, candidate as T);
  }

  protected onFocusIn(event: FocusEvent): void {
    if (!this.contains(event.relatedTarget)) {
      this.focused.emit(event);
    }
  }

  protected onFocusOut(event: FocusEvent): void {
    this.onTouched();
    if (!this.contains(event.relatedTarget)) {
      this.blurred.emit(event);
    }
  }

  /** With `loop` off, swallows the arrow key that would wrap past either end. Radios keep
   *  the browser's native keyboard model otherwise (arrows move focus and selection). */
  protected onKeydown(event: KeyboardEvent): void {
    if (
      this.loop() ||
      event.defaultPrevented ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey ||
      !(event.target instanceof HTMLInputElement) ||
      event.target.type !== 'radio'
    ) {
      return;
    }
    const { key } = event;
    if (
      key !== 'ArrowRight' &&
      key !== 'ArrowLeft' &&
      key !== 'ArrowDown' &&
      key !== 'ArrowUp'
    ) {
      return;
    }
    // Left/Right follow the writing direction, as the browser's own radio navigation does.
    const forward =
      key === 'ArrowDown' ||
      (key !== 'ArrowUp' && (key === 'ArrowRight') !== this.isRtl());
    const radios = this.enabledRadios();
    const index = radios.indexOf(event.target);
    if (index < 0) {
      return;
    }
    if ((forward && index === radios.length - 1) || (!forward && index === 0)) {
      event.preventDefault();
    }
  }

  private enabledRadios(): HTMLInputElement[] {
    const name = this.resolvedName();
    return Array.from(
      this.host.nativeElement.querySelectorAll<HTMLInputElement>(
        'input[type=radio]:not(:disabled)',
      ),
    ).filter((radio) => radio.name === name);
  }

  private isRtl(): boolean {
    const host = this.host.nativeElement;
    const view = host.ownerDocument.defaultView;
    return (
      (view?.getComputedStyle(host).direction ?? 'ltr') === 'rtl' ||
      host.closest('[dir]')?.getAttribute('dir') === 'rtl'
    );
  }

  private contains(target: EventTarget | null): boolean {
    return target instanceof Node && this.host.nativeElement.contains(target);
  }

  writeValue(value: T | null): void {
    this.value.set(value);
  }

  registerOnChange(fn: (value: T | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.cvaDisabled.set(isDisabled);
  }

  private select(value: T, event: Event): void {
    if (this.isDisabled() || this.readOnly()) {
      return;
    }
    this.value.set(value);
    this.onChange(value);
    this.onTouched();
    this.selectionChange.emit({ value, event });
  }
}
