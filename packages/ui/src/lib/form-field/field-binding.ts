import {
  afterEveryRender,
  computed,
  effect,
  inject,
  type Provider,
  type Signal,
  untracked,
} from '@angular/core';

import { AndesFormControlState } from './form-control';
import {
  ANDES_FORM,
  ANDES_FORM_CONTROL,
  ANDES_FORM_FIELD,
  type AndesFormControlApi,
  type AndesFormSize,
  type AndesFormVariant,
} from './form-field-tokens';

/**
 * What a control reads from the `AndesFormField` and `AndesForm` around it, through
 * {@link injectAndesFieldBinding}. Every signal reads "nothing" (`undefined`, `false`) outside
 * a field or form, so a control behaves exactly as before when used on its own.
 */
export interface AndesFieldBinding {
  /** The field's control id, for the control's labelable (or focusable) element. The
   *  control's own `id` input wins. */
  readonly id: Signal<string | undefined>;
  /** The field's description, messages and extra text ids, to merge into the control's own
   *  `aria-describedby` with {@link andesIdRefs}. */
  readonly describedBy: Signal<string | undefined>;
  /** The field label's id. Needed where the focusable element is not labelable (a
   *  `role="slider"` thumb, a `role="radiogroup"`); harmless where it is. A control with its
   *  own `aria-label` or `aria-labelledby` keeps it. */
  readonly labelledBy: Signal<string | undefined>;
  /** The field is in the error status (derived or a manual `validateStatus="error"`): the
   *  control sets `aria-invalid` and paints its error state. */
  readonly invalid: Signal<boolean>;
  /** `'error'` or `'warning'` while the field shows one, for a control's `status` styling. One
   *  rule for every control: a control with a box of its own (an input, a select, a color
   *  picker, a segmented control) paints the box's border and ring in the status colour; a
   *  control without one (a rating, a slider, a switch, a checkbox, a radio) never gets a box
   *  drawn around it - it tints its own accent instead (the outline of the empty stars, the
   *  thumb ring, the control's border) - and the focus ring stays for keyboard focus only. The
   *  field's message carries the rest. */
  readonly status: Signal<'error' | 'warning' | undefined>;
  /** The field counts as required (a required validator or the field's `required` input):
   *  the control sets `required` or `aria-required`. */
  readonly required: Signal<boolean>;
  /** The form's `size`, for a control whose own `size` is unset. */
  readonly size: Signal<AndesFormSize | undefined>;
  /** The form's `variant`, for a control whose own `variant` is unset. Each control maps it
   *  to its own vocabulary and ignores a value it does not have. */
  readonly variant: Signal<AndesFormVariant | undefined>;
  /** The form is `disabled`: the control disables itself even when it is not bound to the
   *  form model (a button, a control on its own signal). */
  readonly disabled: Signal<boolean>;
}

/**
 * Joins several space-separated id lists (`aria-describedby`, `aria-labelledby`) into one,
 * dropping empty entries and repeats, or `undefined` when nothing is left - so a control can
 * merge the field's ids with the ones its consumer bound, without listing an id twice when the
 * consumer bound the field's own ids by hand.
 */
export function andesIdRefs(
  ...lists: readonly (string | null | undefined)[]
): string | undefined {
  const ids = new Set(
    lists.flatMap((list) => (list ? list.split(/\s+/) : [])).filter(Boolean),
  );
  return ids.size > 0 ? [...ids].join(' ') : undefined;
}

/**
 * The control-field contract: called in a control component's injection context (a field
 * initializer), it returns the {@link AndesFieldBinding} the control applies to its own inner
 * element, so a library control placed in an `<andes-form-field>` is labelled, described,
 * marked invalid and required, sized and disabled with no binding written by hand:
 *
 * ```ts
 * private readonly field = injectAndesFieldBinding();
 * protected readonly controlId = computed(() => this.id() ?? this.field.id());
 * protected readonly describedBy = computed(() =>
 *   andesIdRefs(this.ariaDescribedby(), this.field.describedBy()),
 * );
 * protected readonly isInvalid = computed(() => this.ariaInvalid() || this.field.invalid());
 * protected readonly resolvedSize = computed(() => this.size() ?? this.field.size() ?? 'md');
 * ```
 *
 * Inside a field it also registers the control with it, so the field reads the bound forms
 * control's state - with or without `andesFormControl` on the element. When that directive is
 * there, the binding uses it; when it is not, the control registers a state of its own.
 *
 * Only the field's first registered control (its primary control) takes the field's id and
 * ARIA: a second control in the same field never duplicates the id. A composite control whose
 * template renders other library controls hides the field from them with
 * {@link provideAndesFieldBoundary}. An item of a group control (a checkbox in a checkbox
 * group) passes `{ field: false }`: the group binds to the field, the item only follows the
 * form's size, variant and disabled.
 */
export function injectAndesFieldBinding(
  options: { readonly field?: boolean } = {},
): AndesFieldBinding {
  const field =
    options.field === false
      ? null
      : inject(ANDES_FORM_FIELD, { optional: true });
  const form = inject(ANDES_FORM, { optional: true });
  let control: AndesFormControlApi | null = null;
  if (field) {
    control = inject(ANDES_FORM_CONTROL, { self: true, optional: true });
    if (!control) {
      const own = new AndesFormControlState();
      control = own;
      // Bound once the forms directive on the element has created its control, and followed
      // after every render, when a re-bound `[formControl]` shows up.
      effect(() => untracked(() => own.sync()));
      afterEveryRender(() => own.sync());
    }
  }
  const primary = computed(
    () => !!field && !!control && field.primaryControl() === control,
  );
  const fromField = <T>(read: () => T, fallback: T): Signal<T> =>
    computed(() => (primary() ? read() : fallback));
  return {
    id: fromField(() => field?.controlId(), undefined),
    describedBy: fromField(() => field?.describedBy(), undefined),
    labelledBy: fromField(() => field?.labelledBy(), undefined),
    invalid: fromField(() => field?.showError() ?? false, false),
    status: fromField(() => {
      const status = field?.status();
      return status === 'error' || status === 'warning' ? status : undefined;
    }, undefined),
    required: fromField(() => field?.isRequired() ?? false, false),
    size: computed(() => form?.size()),
    variant: computed(() => form?.variant()),
    disabled: computed(() => form?.disabled() ?? false),
  };
}

/**
 * Hides the enclosing field from the library controls a composite control renders inside its
 * own template (a color picker's hex input and format select): they would otherwise take the
 * field's id and ARIA and register as its controls. Add to the composite's `viewProviders`;
 * the composite itself still binds to the field. The form's size, variant and disabled still
 * reach them.
 */
export function provideAndesFieldBoundary(): Provider[] {
  return [{ provide: ANDES_FORM_FIELD, useValue: null }];
}
