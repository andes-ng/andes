import {
  type AbstractControl,
  FormControl,
  FormGroup,
  type ValidationErrors,
  Validators,
} from '@angular/forms';
import type { Meta, StoryObj } from '@storybook/angular';

import { AndesFormField } from './form-field';
import { fieldModuleMetadata } from './form-field.stories';

const meta: Meta<AndesFormField> = {
  title: 'Data Entry/Form/Field/Validation',
  component: AndesFormField,
};

export default meta;

type Story = StoryObj<AndesFormField>;

/**
 * `validateStatus` set by hand, each with `hasFeedback` and a `help` line - the full status
 * vocabulary (`success`, `warning`, `error`, `validating`). The input takes `error` and
 * `warning` as its own status (border, ring, `aria-invalid` for an error); `success` and
 * `validating` are carried by the icon alone.
 */
export const ManualStatus: Story = {
  render: () => ({
    moduleMetadata: fieldModuleMetadata,
    props: {
      rows: [
        { status: 'success', label: 'Success', help: 'Looks good.' },
        { status: 'warning', label: 'Warning', help: 'This name is unusual.' },
        { status: 'error', label: 'Error', help: 'This name is taken.' },
        { status: 'validating', label: 'Validating', help: 'Checking…' },
      ],
      value: new FormControl('andes'),
    },
    template: `
      <div andesForm style="width: min(360px, 100vw - 2rem);">
        @for (row of rows; track row.status) {
          <andes-form-field
            [label]="row.label"
            [validateStatus]="row.status"
            [help]="row.help"
            hasFeedback
          >
            <andes-input [formControl]="value" />
          </andes-form-field>
        }
      </div>
    `,
  }),
};

/**
 * Status *derived* from the control, with `hasFeedback`. The username runs an async
 * validator (≈0.8 s) - type to see `validating` (the spinner), then
 * `success`, or `error` for "admin". Messages come from the validators themselves; the
 * async one returns its own string (`{ taken: 'That username is taken.' }`), which is used
 * as-is since no message map entry exists for `taken`.
 */
export const DerivedStatus: Story = {
  render: () => {
    const takenValidator = (control: AbstractControl) =>
      new Promise<ValidationErrors | null>((resolve) =>
        setTimeout(
          () =>
            resolve(
              control.value === 'admin'
                ? { taken: 'That username is taken.' }
                : null,
            ),
          800,
        ),
      );
    const username = new FormControl('admin', {
      validators: [Validators.required, Validators.minLength(3)],
      asyncValidators: takenValidator,
    });
    const email = new FormControl('ada@', {
      validators: [Validators.required, Validators.email],
    });
    const city = new FormControl('Lima', Validators.required);
    [username, email, city].forEach((c) => c.markAsTouched());
    return {
      moduleMetadata: fieldModuleMetadata,
      props: {
        username,
        email,
        city,
        cities: [
          { value: 'Lima', label: 'Lima' },
          { value: 'Cusco', label: 'Cusco' },
        ],
      },
      template: `
        <div andesForm style="width: min(360px, 100vw - 2rem);">
          <andes-form-field label="Username" hasFeedback>
            <andes-input [formControl]="username" />
          </andes-form-field>
          <andes-form-field label="Email" hasFeedback>
            <andes-input [formControl]="email" type="email" />
          </andes-form-field>
          <andes-form-field label="City" hasFeedback>
            <andes-select [formControl]="city" [options]="cities" placeholder="Select a city" />
          </andes-form-field>
        </div>
      `,
    };
  },
};

/**
 * No `<andes-form-error>` authored: the field renders a message per failing validator from
 * the control's real `ValidationErrors`. Messages resolve field `errorMessages` → the
 * `andesForm`'s → `provideAndesFormErrorMessages()` → built-in defaults, and may use
 * `{label}` or any key of the validator's error object (`{requiredLength}`), or be a function.
 * Here the form localizes three messages and one field overrides `pattern`; for a whole language
 * provide `provideAndesFormLocale(ANDES_FORM_LOCALE_ES)` instead.
 */
export const GeneratedErrorMessages: Story = {
  render: () => {
    const form = new FormGroup({
      name: new FormControl('', Validators.required),
      code: new FormControl('ab', [
        Validators.minLength(4),
        Validators.pattern(/^[0-9]+$/),
      ]),
      email: new FormControl('ada@', Validators.email),
    });
    form.markAllAsTouched();
    return {
      moduleMetadata: fieldModuleMetadata,
      props: {
        form,
        spanish: {
          required: '{label} es obligatorio.',
          minlength: 'Ingresa al menos {requiredLength} caracteres.',
          email: 'Ingresa un correo válido.',
        },
        codeMessages: { pattern: 'Solo dígitos, por favor.' },
      },
      template: `
        <form andesForm [formGroup]="form" [errorMessages]="spanish" style="width: min(360px, 100vw - 2rem);">
          <andes-form-field label="Nombre">
            <andes-input formControlName="name" />
          </andes-form-field>
          <andes-form-field label="Código" [errorMessages]="codeMessages">
            <andes-input formControlName="code" />
          </andes-form-field>
          <andes-form-field label="Correo">
            <andes-input formControlName="email" />
          </andes-form-field>
        </form>
      `,
    };
  },
};

/**
 * `warningValidators` - ordinary `ValidatorFn`s whose errors never block the form: the field
 * goes `warning` with a message from the same message maps, while the control stays valid.
 * A real error still wins. Try a price under the 12.50 cost, then clear it.
 */
export const WarningValidators: Story = {
  render: () => {
    const belowCost = (control: AbstractControl): ValidationErrors | null =>
      control.value !== null && Number(control.value) < 12.5
        ? { belowCost: { cost: '12.50' } }
        : null;
    const price = new FormControl<number | null>(9.9, Validators.required);
    price.markAsTouched();
    return {
      moduleMetadata: fieldModuleMetadata,
      props: { price, warnings: [belowCost] },
      template: `
        <div andesForm style="width: min(360px, 100vw - 2rem);">
          <andes-form-field
            label="Unit price"
            hasFeedback
            [warningValidators]="warnings"
            [errorMessages]="{ belowCost: 'Below the unit cost of {cost}.' }"
          >
            <andes-input-number [formControl]="price" [precision]="2" [min]="0" />
          </andes-form-field>
          <p style="margin: 0; font-family: var(--andes-font-family), sans-serif; font-size: 0.75rem; line-height: 1.25rem; color: var(--andes-color-muted-foreground);">
            control.valid = {{ price.valid }}
          </p>
        </div>
      `,
    };
  },
};
