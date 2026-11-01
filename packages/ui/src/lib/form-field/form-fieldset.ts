import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  ViewEncapsulation,
} from '@angular/core';
import type { AbstractControl } from '@angular/forms';

import { injectAndesControlErrors } from './form-error';
import type { AndesFormErrorMessages } from './form-field-tokens';

let nextFieldsetId = 0;

/**
 * Groups related fields - an address, a set of preferences, the checkboxes of one question -
 * under a native `<fieldset>` and `<legend>`, so assistive technology announces the legend
 * before each field inside. Place it in an `andesForm`; the fields inside keep the form's
 * layout.
 *
 * ```html
 * <andes-form-fieldset legend="Shipping address" description="Where the order goes."
 *   [control]="form.controls.address">
 *   <andes-form-field label="Street">...</andes-form-field>
 *   <andes-form-field label="City">...</andes-form-field>
 * </andes-form-fieldset>
 * ```
 *
 * - `legend` - the group's title; richer content goes in an element with `slot="legend"`.
 * - `description` - muted text under the legend, wired into the fieldset's
 *   `aria-describedby`.
 * - `[control]` - the `FormGroup` or `FormArray` behind the group. Its own errors (a group
 *   validator, an array length rule) show at the bottom of the fieldset once any field in it
 *   was touched or changed, or the form was submitted, also described by the fieldset.
 * - `disabled` - disables every native control inside, as a native fieldset does. Controls
 *   bound to Angular forms are better disabled through the model (`group.disable()`).
 */
@Component({
  selector: 'andes-form-fieldset',
  template: `<fieldset
    class="andes-form-fieldset"
    [disabled]="disabled()"
    [attr.aria-describedby]="describedBy()"
    [attr.data-status]="errors.visible() ? 'error' : null"
  >
    <legend class="andes-form-fieldset__legend">
      {{ legend() }}<ng-content select="[slot=legend]" />
    </legend>
    @if (description()) {
      <p class="andes-form-description" [id]="descriptionId">
        {{ description() }}
      </p>
    }
    <div class="andes-form-fieldset__content"><ng-content /></div>
    @if (errors.visible()) {
      <p
        class="andes-form-error andes-form-fieldset__error"
        [id]="errorId"
        role="alert"
        animate.leave="andes-form-field__message--leave"
      >
        @for (message of errors.messages(); track message) {
          <span class="andes-form-error__item">{{ message }}</span>
        }
      </p>
    }
  </fieldset>`,
  styleUrl: './form-field.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // See the header comment in form-field.css for why the shared sheet is unscoped.
  encapsulation: ViewEncapsulation.None,
})
export class AndesFormFieldset {
  private readonly id = `andes-form-fieldset-${nextFieldsetId++}`;
  protected readonly descriptionId = `${this.id}-description`;
  protected readonly errorId = `${this.id}-error`;

  /** The group's title, rendered in the `<legend>`. */
  readonly legend = input<string | undefined>(undefined);

  /** Muted text under the legend, describing the whole group. */
  readonly description = input<string | undefined>(undefined);

  /** The group or array control behind the fieldset, whose own errors it shows. */
  readonly control = input<AbstractControl | null | undefined>(undefined);

  /** Messages for the errors of `control`, merged over the form's and the provided ones. */
  readonly errorMessages = input<AndesFormErrorMessages | undefined>(undefined);

  /** Disables the native `<fieldset>`, and with it every native control inside. */
  readonly disabled = input(false, { transform: booleanAttribute });

  protected readonly errors = injectAndesControlErrors(
    () => this.control(),
    () => this.errorMessages(),
  );

  protected readonly describedBy = computed(() => {
    const ids = [
      this.description() ? this.descriptionId : null,
      this.errors.visible() ? this.errorId : null,
    ].filter((id): id is string => id !== null);
    return ids.length > 0 ? ids.join(' ') : null;
  });
}
