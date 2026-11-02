import { Directionality } from '@angular/cdk/bidi';
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChildren,
  effect,
  ElementRef,
  forwardRef,
  inject,
  input,
  model,
  output,
  signal,
  untracked,
} from '@angular/core';
import {
  AbstractControl,
  ControlValueAccessor,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  ValidationErrors,
  Validator,
} from '@angular/forms';

import {
  andesIdRefs,
  injectAndesFieldBinding,
} from '../form-field/field-binding';
import { AndesToggle } from './toggle';
import {
  ANDES_TOGGLE_GROUP,
  AndesToggleGroupApi,
  AndesToggleGroupChange,
  AndesToggleGroupLimit,
  AndesToggleGroupOrientation,
  AndesToggleGroupType,
  AndesToggleSize,
  AndesToggleStatus,
  AndesToggleVariant,
  optionalNumberAttribute,
} from './toggle-types';

function noop(): void {
  /* replaced by registerOnChange/registerOnTouched */
}

/**
 * A row (or column) of `<andes-toggle>`s sharing one value.
 *
 * - `type="single"`: at most one toggle is pressed; `value` is that toggle's value (or `null`).
 *   `allowEmpty="false"` (or `required`) stops pressing the active toggle from clearing it.
 * - `type="multiple"`: any number can be pressed; `value` is an array, optionally bounded by
 *   `minCount` / `maxCount`.
 *
 * The group is one tab stop (roving tabindex): Tab lands on the first pressed toggle, the
 * arrow keys along `orientation` (mirrored in right-to-left layouts) move focus and wrap
 * around unless `loop` is off, Home/End jump to the ends, and Space or Enter presses. Toggles
 * are joined into one bar by default; a `spacing` above 0 separates them by that many pixels
 * instead.
 *
 * The group's `role="group"` allows neither `aria-required`, `aria-readonly` nor
 * `aria-invalid`, so `required`, `readOnly` and `status` surface as `data-required`,
 * `data-readonly` and `data-status` instead; give the group an `aria-label` and link any error
 * message through the toggles' `aria-describedby`.
 */
@Component({
  selector: 'andes-toggle-group',
  template: `<ng-content />
    @if (name(); as fieldName) {
      @for (item of selected(); track $index) {
        <input type="hidden" [name]="fieldName" [value]="serialize(item)" />
      }
    }`,
  styleUrl: './toggle-group.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AndesToggleGroup),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => AndesToggleGroup),
      multi: true,
    },
    {
      provide: ANDES_TOGGLE_GROUP,
      useExisting: forwardRef(() => AndesToggleGroup),
    },
  ],
  host: {
    role: 'group',
    'data-slot': 'toggle-group',
    '[attr.id]': 'controlId() ?? null',
    '[attr.aria-label]': 'ariaLabel()',
    '[attr.aria-labelledby]': 'labelledBy() ?? null',
    '[attr.aria-describedby]': 'describedBy() ?? null',
    '[attr.aria-disabled]': 'isDisabled() || null',
    '[attr.data-type]': 'type()',
    '[attr.data-orientation]': 'orientation()',
    '[attr.data-joined]': "spacing() === 0 ? '' : null",
    '[attr.data-disabled]': "isDisabled() ? '' : null",
    '[attr.data-readonly]': "readOnly() ? '' : null",
    '[attr.data-required]': "isRequired() ? '' : null",
    '[attr.data-status]': 'resolvedStatus() ?? null',
    '[style.gap.px]': 'spacing()',
    '(keydown)': 'onKeydown($event)',
    '(focusin)': 'onFocusIn($event)',
    '(focusout)': 'onFocusOut($event)',
  },
})
export class AndesToggleGroup<T = unknown>
  implements ControlValueAccessor, Validator, AndesToggleGroupApi
{
  private readonly directionality = inject(Directionality);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  /** `single` (default) or `multiple`. */
  readonly type = input<AndesToggleGroupType>('single');
  /** Pressed value(s): a single value or `null` for `type="single"`, an array for `multiple`.
   *  Two-way bindable and driven by Angular forms. Its `valueChange` carries the plain value
   *  (also for programmatic writes); `selectionChange` carries what a user change did. */
  readonly value = model<T | readonly T[] | null>(null);
  readonly variant = input<AndesToggleVariant>('default');
  /** `md` unless set, or the enclosing `andesForm`'s `size`. */
  readonly size = input<AndesToggleSize | undefined>(undefined);
  /** Validation tier for every toggle (a toggle's own `status` wins): `error` paints the
   *  border and focus ring in the danger color, `warning` in the amber one. */
  readonly status = input<AndesToggleStatus | undefined>(undefined);
  /** Nothing can be changed, but the toggles stay focusable, keep their normal look (no hover
   *  feedback) and the arrow keys still move focus. Unlike `disabled`, nothing is dimmed. */
  readonly readOnly = input(false, { transform: booleanAttribute });
  readonly orientation = input<AndesToggleGroupOrientation>('horizontal');
  /** Pixels between toggles. `0` (default) joins them into a single bar. */
  readonly spacing = input(0);
  readonly disabled = input(false, { transform: booleanAttribute });
  /** For `type="single"`: whether pressing the pressed toggle clears the value. */
  readonly allowEmpty = input(true, { transform: booleanAttribute });
  /**
   * The value cannot be empty. For `type="single"` it has the same effect as
   * `allowEmpty="false"` (the pressed toggle refuses to be released). It also sets
   * `data-required` and, under Angular forms, makes the control invalid (`{ required: true }`)
   * while nothing is pressed - the group cannot enforce a value it was never given.
   */
  readonly required = input(false, { transform: booleanAttribute });
  /**
   * Whether the arrow keys wrap around: the next key on the last toggle moves to the first and
   * the previous key on the first to the last. Set `false` to stop at the ends; Home and End
   * always jump to the first and last enabled toggle.
   */
  readonly loop = input(true, { transform: booleanAttribute });
  /** Submitted with a native form: one hidden input of this name per pressed value. */
  readonly name = input<string | undefined>(undefined);
  /**
   * For `type="multiple"`: the fewest toggles that may stay pressed. At this count the pressed
   * toggles refuse to be released (and `limitReached` fires with `limit: 'min'`). A form control
   * below it is invalid with `{ minCount }`.
   */
  readonly minCount = input<number | undefined, unknown>(undefined, {
    transform: optionalNumberAttribute,
  });
  /**
   * For `type="multiple"`: the most toggles that may be pressed. Once reached, the unpressed
   * toggles are disabled (and look it) until one is released, and `limitReached` fires with
   * `limit: 'max'`. A form control over it is invalid with `{ maxCount }`.
   */
  readonly maxCount = input<number | undefined, unknown>(undefined, {
    transform: optionalNumberAttribute,
  });
  readonly ariaLabel = input<string | undefined>(undefined, {
    alias: 'aria-label',
  });
  readonly ariaLabelledby = input<string | undefined>(undefined, {
    alias: 'aria-labelledby',
  });
  /** Ids describing the whole group; merged with the enclosing field's hint and messages. */
  readonly ariaDescribedby = input<string | undefined>(undefined, {
    alias: 'aria-describedby',
  });
  /** Id of the group element. Defaults to the enclosing field's control id. */
  readonly id = input<string | undefined>(undefined);

  /** The enclosing form field and form: id, ARIA, status, size and disabled. */
  protected readonly field = injectAndesFieldBinding();

  protected readonly controlId = computed(() => this.id() ?? this.field.id());

  /** `aria-labelledby`, else the field's label - unless an `aria-label` names the group. */
  protected readonly labelledBy = computed(
    () =>
      this.ariaLabelledby() ??
      (this.ariaLabel() ? undefined : this.field.labelledBy()),
  );

  protected readonly describedBy = computed(() =>
    andesIdRefs(this.ariaDescribedby(), this.field.describedBy()),
  );

  protected readonly isRequired = computed(
    () => this.required() || this.field.required(),
  );

  readonly resolvedSize = computed(() => this.size() ?? this.field.size());

  readonly resolvedStatus = computed(
    () => this.status() ?? this.field.status(),
  );

  /**
   * Fires on every USER change (a click or Space/Enter), never for programmatic writes, with
   * the new `value` and what this change pressed (`added`) and released (`removed`). It is a
   * separate output because `valueChange` already belongs to the `value` model and keeps
   * emitting the plain value for `[(value)]`.
   */
  readonly selectionChange = output<AndesToggleGroupChange<T>>();
  /** A user change just brought the pressed count up to `maxCount`, or a user tried to
   *  release below `minCount` and was stopped. Never fires for programmatic writes. */
  readonly limitReached = output<AndesToggleGroupLimit<T>>();
  /** Focus entered the group from outside (it does not fire when moving between toggles). */
  readonly focused = output<FocusEvent>();
  /** Focus left the group as a whole (not when moving between its toggles). */
  readonly blurred = output<FocusEvent>();

  private readonly cvaDisabled = signal(false);
  private onChange: (value: T | readonly T[] | null) => void = noop;
  private onTouched: () => void = noop;
  private onValidatorChange: () => void = noop;

  private readonly toggles = contentChildren(AndesToggle, {
    descendants: true,
  });

  readonly isDisabled = computed(
    () => this.disabled() || this.cvaDisabled() || this.field.disabled(),
  );

  protected readonly selected = computed<readonly T[]>(() => {
    const value = this.value();
    if (value === null || value === undefined) {
      return [];
    }
    return Array.isArray(value) ? (value as readonly T[]) : [value as T];
  });

  readonly isPressed = (value: unknown): boolean =>
    value !== undefined &&
    this.selected().some((item) => Object.is(item, value));

  /** `maxCount` is reached, so a toggle that is not pressed cannot be pressed. */
  readonly isLimitDisabled = (value: unknown): boolean => {
    const max = this.maxCount();
    return (
      this.type() === 'multiple' &&
      max !== undefined &&
      this.selected().length >= max &&
      !this.isPressed(value)
    );
  };

  readonly tabbable = computed<unknown>(() => {
    const enabled = this.toggles().filter((toggle) => !toggle.isDisabled());
    return enabled.find((toggle) => toggle.isPressed()) ?? enabled[0] ?? null;
  });

  constructor() {
    // The rules `validate()` applies changed: ask the form to run it again.
    effect(() => {
      this.required();
      this.type();
      this.minCount();
      this.maxCount();
      untracked(() => this.onValidatorChange());
    });
  }

  /** Focus the pressed toggle, or the first enabled one - where a Tab key press would land. */
  focus(options?: FocusOptions): void {
    (this.tabbable() as AndesToggle<T> | null)?.focus(options);
  }

  /** Remove focus from whichever toggle of this group currently has it (no-op otherwise). */
  blur(): void {
    const element = this.host.nativeElement;
    const active = element.ownerDocument.activeElement;
    if (active instanceof HTMLElement && element.contains(active)) {
      active.blur();
    }
  }

  toggle(value: unknown): void {
    if (this.isDisabled() || this.readOnly() || value === undefined) {
      return;
    }
    const item = value as T;
    const current = this.selected();
    const pressed = this.isPressed(item);
    let next: T | readonly T[] | null;
    let added: T | undefined;
    let removed: T | undefined;
    if (this.type() === 'multiple') {
      const min = this.minCount();
      const max = this.maxCount();
      if (pressed) {
        if (min !== undefined && current.length <= min) {
          this.limitReached.emit({ limit: 'min', count: min, value: current });
          return;
        }
        next = current.filter((entry) => !Object.is(entry, item));
        removed = item;
      } else {
        if (max !== undefined && current.length >= max) {
          return;
        }
        next = [...current, item];
        added = item;
      }
    } else if (pressed) {
      if (!this.allowEmpty() || this.required()) {
        return;
      }
      next = null;
      removed = item;
    } else {
      next = item;
      added = item;
      removed = current[0];
    }
    this.value.set(next);
    this.onChange(next);
    this.selectionChange.emit({ value: next, added, removed });
    const max = this.maxCount();
    if (
      this.type() === 'multiple' &&
      max !== undefined &&
      (next as readonly T[]).length === max
    ) {
      this.limitReached.emit({
        limit: 'max',
        count: max,
        value: next as readonly T[],
      });
    }
  }

  /**
   * Angular forms validation (the group is its own `NG_VALIDATORS`): `required` with nothing
   * pressed, and for `type="multiple"` fewer than `minCount` or more than `maxCount`.
   */
  validate(control: AbstractControl): ValidationErrors | null {
    const value = control.value as T | readonly T[] | null | undefined;
    const selected: readonly unknown[] =
      value === null || value === undefined
        ? []
        : Array.isArray(value)
          ? value
          : [value];
    const errors: ValidationErrors = {};
    if (this.required() && selected.length === 0) {
      errors['required'] = true;
    }
    if (this.type() === 'multiple') {
      const min = this.minCount();
      const max = this.maxCount();
      if (min !== undefined && selected.length < min) {
        errors['minCount'] = { min, actual: selected.length };
      }
      if (max !== undefined && selected.length > max) {
        errors['maxCount'] = { max, actual: selected.length };
      }
    }
    return Object.keys(errors).length > 0 ? errors : null;
  }

  registerOnValidatorChange(fn: () => void): void {
    this.onValidatorChange = fn;
  }

  writeValue(value: T | readonly T[] | null): void {
    this.value.set(value);
  }

  registerOnChange(fn: (value: T | readonly T[] | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.cvaDisabled.set(isDisabled);
  }

  protected serialize(value: T): string {
    return value === null || value === undefined ? '' : String(value);
  }

  protected onFocusIn(event: FocusEvent): void {
    if (!this.contains(event.relatedTarget)) {
      this.focused.emit(event);
    }
  }

  protected onFocusOut(event: FocusEvent): void {
    if (!this.contains(event.relatedTarget)) {
      this.onTouched();
      this.blurred.emit(event);
    }
  }

  /** The CDK direction, or the one the group is laid out in (a `dir` on an ancestor). */
  private isRtl(): boolean {
    const element = this.host.nativeElement;
    return (
      this.directionality.value === 'rtl' ||
      element.ownerDocument.defaultView?.getComputedStyle(element).direction ===
        'rtl'
    );
  }

  private contains(target: EventTarget | null): boolean {
    return target instanceof Node && this.host.nativeElement.contains(target);
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.altKey || event.ctrlKey || event.metaKey) {
      return;
    }
    const enabled = this.toggles().filter((toggle) => !toggle.isDisabled());
    const current = enabled.findIndex(
      (toggle) => toggle.button === event.target,
    );
    if (current === -1) {
      return;
    }
    const vertical = this.orientation() === 'vertical';
    const rtl = !vertical && this.isRtl();
    const forward = vertical ? 'ArrowDown' : rtl ? 'ArrowLeft' : 'ArrowRight';
    const backward = vertical ? 'ArrowUp' : rtl ? 'ArrowRight' : 'ArrowLeft';
    const last = enabled.length - 1;
    let target: number;
    switch (event.key) {
      case forward:
        target = current < last ? current + 1 : this.loop() ? 0 : current;
        break;
      case backward:
        target = current > 0 ? current - 1 : this.loop() ? last : current;
        break;
      case 'Home':
        target = 0;
        break;
      case 'End':
        target = last;
        break;
      default:
        return;
    }
    event.preventDefault();
    if (target !== current) {
      enabled[target].focus();
    }
  }
}
