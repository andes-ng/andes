import { signal } from '@angular/core';
import {
  type AbstractControl,
  FormControl,
  FormGroup,
  type ValidationErrors,
  type ValidatorFn,
  Validators,
} from '@angular/forms';
import type { Meta, StoryObj } from '@storybook/angular';

import { AndesCheckboxGroup } from '../checkbox/checkbox-group';
import { AndesColorPicker } from '../color-picker/color-picker';
import { AndesCombobox } from '../combobox/combobox';
import { AndesInputOtp } from '../input/input-otp';
import { AndesInputPassword } from '../input/input-password';
import { AndesRadio } from '../radio-group/radio';
import { AndesRadioGroup } from '../radio-group/radio-group';
import { AndesRate } from '../rate/rate';
import { AndesSegmented } from '../segmented/segmented';
import { AndesSlider } from '../slider/slider';
import { AndesSwitch } from '../switch/switch';
import { AndesToggle } from '../toggle/toggle';
import { AndesToggleGroup } from '../toggle/toggle-group';
import { AndesFormField } from './form-field';
import { fieldModuleMetadata, PLAN_OPTIONS } from './form-field.stories';
import { AndesValidators } from './form-validators';

/** Shared look for the small result panels the stories below print into. */
const LOG_STYLE =
  'margin: 0; padding: 0.5rem 0.75rem; border-radius: var(--andes-radius-md); background: var(--andes-color-muted); color: var(--andes-color-foreground); font-family: var(--andes-font-family), sans-serif; font-size: 0.75rem; line-height: 1.25rem; white-space: pre-wrap;';

// No `component` here: Storybook would assign each story's `props` to the first `AndesFormField`
// it renders, and a prop named like one of its members (`form`, `help`, `status`) would
// overwrite it.
const meta: Meta<AndesFormField> = {
  title: 'Data Entry/Form/Field/Validation',
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

/**
 * `validateFirst`: stop at the first failing rule. Angular runs *every* validator of a control
 * and merges their errors, so `messageMode="first"` only hides the extra messages - the later
 * rules still run. `AndesValidators.first(...)` is the real thing: it returns the first failing
 * validator's errors and never calls the rest, so a costly rule (the digit check here counts
 * its runs) waits for the cheap ones. Type a few characters in each column and compare the
 * counters. `AndesValidators.firstAsync(...)` does the same for async validators, one after
 * the other.
 */
export const ValidateFirst: Story = {
  render: () => {
    const runs = signal({ all: 0, mode: 0, first: 0 });
    const digit =
      (key: 'all' | 'mode' | 'first'): ValidatorFn =>
      (control) => {
        runs.update((r) => ({ ...r, [key]: r[key] + 1 }));
        return /\d/.test(String(control.value)) ? null : { digit: true };
      };
    const rules = (key: 'all' | 'mode' | 'first') => [
      Validators.required,
      Validators.minLength(8),
      digit(key),
    ];
    const columns = [
      {
        title: 'Merged (default)',
        key: 'all' as const,
        mode: 'all',
        control: new FormControl('', rules('all')),
      },
      {
        title: 'messageMode="first"',
        key: 'mode' as const,
        mode: 'first',
        control: new FormControl('', rules('mode')),
      },
      {
        title: 'AndesValidators.first',
        key: 'first' as const,
        mode: 'all',
        control: new FormControl('', AndesValidators.first(...rules('first'))),
      },
    ];
    columns.forEach((column) => column.control.markAsTouched());
    return {
      moduleMetadata: fieldModuleMetadata,
      props: {
        runs,
        columns,
        messages: { digit: 'Add a digit.' },
      },
      template: `
        <div andesForm [errorMessages]="messages" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr)); gap: 1.5rem; width: min(900px, 100vw - 2rem);">
          @for (column of columns; track column.key) {
            <div style="display: flex; flex-direction: column; gap: 0.5rem;">
              <andes-form-field [label]="column.title" [messageMode]="column.mode" extra="Required, 8+ characters, a digit.">
                <andes-input [formControl]="column.control" />
              </andes-form-field>
              <p style="${LOG_STYLE}">Digit rule ran {{ runs()[column.key] }} times</p>
            </div>
          }
        </div>
      `,
    };
  },
};

/**
 * `validateDebounce`: wait for the user to stop typing before an async validator runs. Both
 * usernames are checked against a server (≈0.4 s, "admin" and "root" are taken); the left one
 * asks on every key, the right one has `validateDebounce="500"` and asks once, 500 ms after the
 * last key - it is `validating` (the spinner) meanwhile, and a key inside the window restarts
 * the wait. Set it on `andesForm` to give every field the same delay; a field's own value
 * wins, `0` turns it off.
 */
export const ValidateDebounce: Story = {
  render: () => {
    const requests = signal<string[]>([]);
    const taken =
      (key: string) =>
      (control: AbstractControl): Promise<ValidationErrors | null> =>
        new Promise((resolve) => {
          requests.update((list) => [
            ...list.slice(-7),
            `${key}: ${control.value}`,
          ]);
          setTimeout(
            () =>
              resolve(
                ['admin', 'root'].includes(control.value)
                  ? { taken: 'That username is taken.' }
                  : null,
              ),
            400,
          );
        });
    const make = (key: string) =>
      new FormControl('', {
        validators: [Validators.required, Validators.minLength(3)],
        asyncValidators: taken(key),
      });
    return {
      moduleMetadata: fieldModuleMetadata,
      props: {
        requests,
        instant: make('instant'),
        debounced: make('debounced'),
      },
      template: `
        <div andesForm style="display: flex; flex-direction: column; gap: 1.5rem; width: min(420px, 100vw - 2rem);">
          <andes-form-field label="On every key" hasFeedback>
            <andes-input [formControl]="instant" />
          </andes-form-field>
          <andes-form-field label="validateDebounce = 500" hasFeedback [validateDebounce]="500">
            <andes-input [formControl]="debounced" />
          </andes-form-field>
          <pre style="${LOG_STYLE}">Server requests (latest last):
{{ requests().join('\\n') || '-' }}</pre>
        </div>
      `,
    };
  },
};

/**
 * `validateOnly`: know whether the form *would* be valid without showing a single error, to
 * enable the submit button. `canSubmit()` on `andesForm` (read through `#f="andesForm"`) is
 * true once every control is valid and no async validator is running - it does not touch any
 * control, so the fields stay quiet until the user has interacted with them. `valid()` and
 * `pending()` are the two halves.
 */
export const ValidateOnly: Story = {
  render: () => {
    const taken = (control: AbstractControl) =>
      new Promise<ValidationErrors | null>((resolve) =>
        setTimeout(
          () =>
            resolve(
              control.value === 'admin'
                ? { taken: 'That username is taken.' }
                : null,
            ),
          500,
        ),
      );
    const log = signal('');
    return {
      moduleMetadata: fieldModuleMetadata,
      props: {
        log,
        form: new FormGroup({
          username: new FormControl('', {
            validators: Validators.required,
            asyncValidators: taken,
          }),
          email: new FormControl('', [Validators.required, Validators.email]),
          terms: new FormControl(false, Validators.requiredTrue),
        }),
      },
      template: `
        <form
          andesForm
          #f="andesForm"
          [formGroup]="form"
          (validSubmit)="log.set('validSubmit ' + $any($event).username)"
          style="width: min(420px, 100vw - 2rem);"
        >
          <andes-form-field label="Username" extra="Try “admin”.">
            <andes-input formControlName="username" />
          </andes-form-field>
          <andes-form-field label="Email">
            <andes-input formControlName="email" type="email" />
          </andes-form-field>
          <andes-form-field>
            <andes-checkbox formControlName="terms">I accept the terms</andes-checkbox>
          </andes-form-field>
          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <andes-button type="submit" [disabled]="!f.canSubmit()">Create account</andes-button>
            <span style="font-family: var(--andes-font-family), sans-serif; font-size: 0.75rem; color: var(--andes-color-muted-foreground);">
              canSubmit = {{ f.canSubmit() }} (valid = {{ f.valid() }}, pending = {{ f.pending() }})
            </span>
          </div>
          @if (log()) {
            <pre style="${LOG_STYLE}">{{ log() }}</pre>
          }
        </form>
      `,
    };
  },
};

/**
 * Customised validation: any `ValidatorFn` or `AsyncValidatorFn` is a rule, and its error
 * object feeds the message. The password rule reports what is missing, shown through a message
 * *function*; the username rejects spaces and, asynchronously, a taken name; the range rule
 * sits on the group and the `max` field adopts its error with `groupErrors`. Nothing here is
 * specific to the library.
 */
export const CustomValidation: Story = {
  render: () => {
    const strong: ValidatorFn = (control) => {
      const value = String(control.value ?? '');
      const missing = [
        /[a-z]/.test(value) ? null : 'a lowercase letter',
        /[A-Z]/.test(value) ? null : 'an uppercase letter',
        /\d/.test(value) ? null : 'a digit',
      ].filter(Boolean);
      return value && missing.length > 0 ? { weak: { missing } } : null;
    };
    const noSpaces: ValidatorFn = (control) =>
      /\s/.test(String(control.value ?? '')) ? { spaces: true } : null;
    const available = (control: AbstractControl) =>
      new Promise<ValidationErrors | null>((resolve) =>
        setTimeout(
          () =>
            resolve(
              control.value === 'ada'
                ? { unavailable: { name: control.value } }
                : null,
            ),
          500,
        ),
      );
    const range = (group: AbstractControl): ValidationErrors | null =>
      Number(group.get('min')?.value) > Number(group.get('max')?.value)
        ? { inverted: true }
        : null;
    const form = new FormGroup(
      {
        username: new FormControl('ada', {
          validators: [Validators.required, noSpaces],
          asyncValidators: available,
        }),
        password: new FormControl('abc', [Validators.required, strong]),
        min: new FormControl(10),
        max: new FormControl(5),
      },
      { validators: range },
    );
    form.markAllAsTouched();
    return {
      moduleMetadata: fieldModuleMetadata,
      props: {
        form,
        messages: {
          spaces: 'No spaces, please.',
          unavailable: (error: { name: string }) =>
            `“${error.name}” is already registered.`,
          weak: (error: { missing: string[] }) =>
            `Still missing ${error.missing.join(', ')}.`,
          inverted: 'The maximum must not be below the minimum.',
        },
      },
      template: `
        <form andesForm [formGroup]="form" [errorMessages]="messages" style="width: min(420px, 100vw - 2rem);">
          <andes-form-field label="Username">
            <andes-input formControlName="username" />
          </andes-form-field>
          <andes-form-field label="Password">
            <andes-input formControlName="password" />
          </andes-form-field>
          <andes-form-field label="Minimum">
            <andes-input-number formControlName="min" />
          </andes-form-field>
          <andes-form-field label="Maximum" groupErrors="inverted">
            <andes-input-number formControlName="max" />
          </andes-form-field>
        </form>
      `,
    };
  },
};

/**
 * Dynamic rules: the validators of a control can change while the form lives. Pick how to be
 * contacted and the matching field becomes required (`setValidators()` followed by
 * `updateValueAndValidity()`); its label gets or loses the asterisk, and a field that is no
 * longer asked for forgets its error. The mark follows `Validators.required` on the control,
 * so nothing else needs telling.
 */
export const DynamicRules: Story = {
  render: () => {
    const form = new FormGroup({
      contact: new FormControl('email'),
      email: new FormControl(''),
      phone: new FormControl(''),
    });
    const apply = (contact: string) => {
      const rules: Record<string, ValidatorFn[]> = {
        email:
          contact === 'email'
            ? [Validators.required, Validators.email]
            : [Validators.email],
        phone:
          contact === 'phone'
            ? [Validators.required, Validators.pattern(/^\d{9}$/)]
            : [],
      };
      for (const [name, validators] of Object.entries(rules)) {
        const control = form.get(name) as FormControl;
        control.setValidators(validators);
        control.updateValueAndValidity();
      }
    };
    apply('email');
    form.controls.contact.valueChanges.subscribe((contact) =>
      apply(contact ?? 'email'),
    );
    return {
      moduleMetadata: {
        imports: [...fieldModuleMetadata.imports, AndesSegmented],
      },
      props: { form, messages: { pattern: 'Nine digits, no spaces.' } },
      template: `
        <form
          andesForm
          [formGroup]="form"
          [errorMessages]="messages"
          (ngSubmit)="form.markAllAsTouched()"
          style="width: min(420px, 100vw - 2rem);"
        >
          <andes-form-field label="Contact me by">
            <andes-segmented formControlName="contact" [options]="[{ value: 'email', label: 'Email' }, { value: 'phone', label: 'Phone' }]" />
          </andes-form-field>
          <andes-form-field label="Email">
            <andes-input formControlName="email" type="email" />
          </andes-form-field>
          <andes-form-field label="Phone">
            <andes-input formControlName="phone" type="tel" />
          </andes-form-field>
          <div><andes-button type="submit">Save</andes-button></div>
        </form>
      `,
    };
  },
};

/**
 * Manual status for every control type: `validateStatus` set by hand with `help` and
 * `hasFeedback`, so the colour, the message and the icon come from the field and the control
 * shows it the way its role allows (`aria-invalid` where it has one). Pick the status; the
 * trailing icon sits outside controls that draw their own trailing parts.
 */
export const ManualStatusEveryControl: Story = {
  render: () => ({
    moduleMetadata: {
      imports: [
        ...fieldModuleMetadata.imports,
        AndesCheckboxGroup,
        AndesColorPicker,
        AndesCombobox,
        AndesInputOtp,
        AndesInputPassword,
        AndesRadio,
        AndesRadioGroup,
        AndesRate,
        AndesSegmented,
        AndesSlider,
        AndesSwitch,
        AndesToggle,
        AndesToggleGroup,
      ],
    },
    props: {
      status: new FormControl('error'),
      statuses: ['success', 'warning', 'error', 'validating'],
      plans: PLAN_OPTIONS,
      help: {
        success: 'Looks good.',
        warning: 'Double-check this one.',
        error: 'This is not right.',
        validating: 'Checking…',
      },
    },
    template: `
      <div style="display: flex; flex-direction: column; gap: 1.5rem; width: min(560px, 100vw - 2rem);">
        <andes-segmented [formControl]="status" [options]="statuses" aria-label="Status" />
        <form andesForm layout="horizontal" [labelCol]="7">
          @let s = $any(status.value);
          <andes-form-field label="Input" [validateStatus]="s" [help]="help[s]" hasFeedback>
            <andes-input value="Ada" />
          </andes-form-field>
          <andes-form-field label="Password" [validateStatus]="s" [help]="help[s]" hasFeedback>
            <andes-input-password value="secret" />
          </andes-form-field>
          <andes-form-field label="Code" [validateStatus]="s" [help]="help[s]" hasFeedback>
            <andes-input-otp [length]="4" />
          </andes-form-field>
          <andes-form-field label="Bio" [validateStatus]="s" [help]="help[s]" hasFeedback>
            <andes-textarea [rows]="2" />
          </andes-form-field>
          <andes-form-field label="Seats" [validateStatus]="s" [help]="help[s]" hasFeedback>
            <andes-input-number [value]="3" />
          </andes-form-field>
          <andes-form-field label="Plan" [validateStatus]="s" [help]="help[s]" hasFeedback>
            <andes-select [options]="plans" value="pro" />
          </andes-form-field>
          <andes-form-field label="City" [validateStatus]="s" [help]="help[s]" hasFeedback>
            <andes-combobox [options]="plans" placeholder="Search" />
          </andes-form-field>
          <andes-form-field label="Color" [validateStatus]="s" [help]="help[s]" hasFeedback>
            <andes-color-picker />
          </andes-form-field>
          <andes-form-field label="Terms" [validateStatus]="s" [help]="help[s]" hasFeedback>
            <andes-checkbox>I accept</andes-checkbox>
          </andes-form-field>
          <andes-form-field label="Topics" [validateStatus]="s" [help]="help[s]" hasFeedback>
            <andes-checkbox-group orientation="horizontal">
              <andes-checkbox value="news">News</andes-checkbox>
              <andes-checkbox value="tips">Tips</andes-checkbox>
            </andes-checkbox-group>
          </andes-form-field>
          <andes-form-field label="Billing" [validateStatus]="s" [help]="help[s]" hasFeedback>
            <andes-radio-group orientation="horizontal" value="month">
              <andes-radio value="month">Monthly</andes-radio>
              <andes-radio value="year">Yearly</andes-radio>
            </andes-radio-group>
          </andes-form-field>
          <andes-form-field label="Alerts" [validateStatus]="s" [help]="help[s]" hasFeedback>
            <andes-switch />
          </andes-form-field>
          <andes-form-field label="View" [validateStatus]="s" [help]="help[s]" hasFeedback>
            <andes-segmented [options]="['List', 'Board']" />
          </andes-form-field>
          <andes-form-field label="Pinned" [validateStatus]="s" [help]="help[s]" hasFeedback>
            <andes-toggle>Pin</andes-toggle>
          </andes-form-field>
          <andes-form-field label="Days" [validateStatus]="s" [help]="help[s]" hasFeedback>
            <andes-toggle-group type="multiple">
              <andes-toggle value="mon">Mon</andes-toggle>
              <andes-toggle value="tue">Tue</andes-toggle>
            </andes-toggle-group>
          </andes-form-field>
          <andes-form-field label="Volume" [validateStatus]="s" [help]="help[s]" hasFeedback>
            <andes-slider />
          </andes-form-field>
          <andes-form-field label="Rating" [validateStatus]="s" [help]="help[s]" hasFeedback>
            <andes-rate />
          </andes-form-field>
        </form>
      </div>
    `,
  }),
};
