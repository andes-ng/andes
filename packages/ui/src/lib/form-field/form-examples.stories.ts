import { Component, signal } from '@angular/core';
import {
  type AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  type ValidationErrors,
  Validators,
} from '@angular/forms';
import {
  email,
  FormField,
  FormRoot,
  form,
  minLength,
  required,
} from '@angular/forms/signals';
import type { Meta, StoryObj } from '@storybook/angular';

import { AndesButton } from '../button/button';
import { AndesCheckbox } from '../checkbox/checkbox';
import { AndesCheckboxGroup } from '../checkbox/checkbox-group';
import { AndesColorPicker } from '../color-picker/color-picker';
import { AndesCombobox } from '../combobox/combobox';
import { AndesInput } from '../input/input';
import { AndesInputOtp } from '../input/input-otp';
import { AndesInputPassword } from '../input/input-password';
import { AndesInputNumber } from '../input-number/input-number';
import { AndesRadio } from '../radio-group/radio';
import { AndesRadioGroup } from '../radio-group/radio-group';
import { AndesRate } from '../rate/rate';
import { AndesSegmented } from '../segmented/segmented';
import { AndesSelect } from '../select/select';
import { AndesSlider } from '../slider/slider';
import { AndesSwitch } from '../switch/switch';
import { AndesTextarea } from '../textarea/textarea';
import { AndesToggle } from '../toggle/toggle';
import { AndesToggleGroup } from '../toggle/toggle-group';
import { AndesForm } from './form';
import { AndesFormDescription } from './form-description';
import { AndesFormError } from './form-error';
import { AndesFormField } from './form-field';
import { AndesFormFieldset } from './form-fieldset';
import type {
  AndesFormSize,
  AndesFormValidateStatus,
  AndesFormVariant,
} from './form-field-tokens';
import { AndesValidators } from './form-validators';
import { PLAN_OPTIONS } from './form-field.stories';

const moduleMetadata = {
  imports: [
    ReactiveFormsModule,
    AndesForm,
    AndesFormField,
    AndesFormFieldset,
    AndesFormDescription,
    AndesFormError,
    AndesButton,
    AndesCheckbox,
    AndesCheckboxGroup,
    AndesColorPicker,
    AndesCombobox,
    AndesInput,
    AndesInputOtp,
    AndesInputPassword,
    AndesInputNumber,
    AndesRadio,
    AndesRadioGroup,
    AndesRate,
    AndesSegmented,
    AndesSelect,
    AndesSlider,
    AndesSwitch,
    AndesTextarea,
    AndesToggle,
    AndesToggleGroup,
  ],
};

/** Shared look for the small result panels the stories print into. */
const LOG_STYLE =
  'margin: 0; padding: 0.5rem 0.75rem; border-radius: var(--andes-radius-md); background: var(--andes-color-muted); color: var(--andes-color-foreground); font-family: var(--andes-font-family), sans-serif; font-size: 0.75rem; line-height: 1.25rem; white-space: pre-wrap;';

interface ExampleArgs {
  size: AndesFormSize | undefined;
  variant: AndesFormVariant | undefined;
  disabled: boolean;
  status: AndesFormValidateStatus | '' | undefined;
}

const meta: Meta<ExampleArgs> = {
  title: 'Data Entry/Form/Examples',
  argTypes: {
    size: { control: 'inline-radio', options: [undefined, 'sm', 'md', 'lg'] },
    variant: {
      control: 'inline-radio',
      options: [undefined, 'outlined', 'filled', 'borderless', 'underlined'],
    },
    disabled: { control: 'boolean' },
    status: {
      control: 'inline-radio',
      options: [undefined, '', 'error', 'warning', 'success', 'validating'],
    },
  },
  args: {
    size: undefined,
    variant: undefined,
    disabled: false,
    status: undefined,
  },
};

export default meta;

type Story = StoryObj<ExampleArgs>;

function everyControl() {
  return new FormGroup({
    name: new FormControl('', Validators.required),
    password: new FormControl('', Validators.required),
    code: new FormControl('', Validators.required),
    bio: new FormControl('', Validators.required),
    seats: new FormControl<number | null>(null, Validators.required),
    plan: new FormControl<string | null>(null, Validators.required),
    city: new FormControl<string | null>(null, Validators.required),
    color: new FormControl<string | null>(null, Validators.required),
    terms: new FormControl(false, Validators.requiredTrue),
    topics: new FormControl<string[]>([], Validators.required),
    billing: new FormControl<string | null>(null, Validators.required),
    alerts: new FormControl(false, Validators.requiredTrue),
    view: new FormControl<string | null>(null, Validators.required),
    pinned: new FormControl(false, Validators.requiredTrue),
    days: new FormControl<string[]>([], Validators.required),
    volume: new FormControl<number | null>(null, Validators.required),
    rating: new FormControl<number | null>(null, Validators.required),
  });
}

/**
 * Every library control in one form, each required and none wired by hand. Submit it empty
 * to see each one show its error; change `size`, `variant` and `disabled` to see them cascade,
 * and `status` to force one manual `validateStatus` on every field.
 */
export const AllControls: Story = {
  render: (args) => ({
    moduleMetadata,
    props: {
      ...args,
      form: everyControl(),
      plans: PLAN_OPTIONS,
      cities: [
        { value: 'lima', label: 'Lima' },
        { value: 'cusco', label: 'Cusco' },
        { value: 'arequipa', label: 'Arequipa' },
      ],
    },
    template: `
      <form
        andesForm
        [formGroup]="form"
        layout="horizontal"
        [labelCol]="7"
        [size]="size"
        [variant]="variant"
        [disabled]="disabled"
        (ngSubmit)="form.markAllAsTouched()"
        style="width: min(640px, 100vw - 2rem);"
      >
        <andes-form-field label="Name" [validateStatus]="status" hasFeedback>
          <andes-input formControlName="name" />
        </andes-form-field>
        <andes-form-field label="Password" [validateStatus]="status">
          <andes-input-password formControlName="password" />
        </andes-form-field>
        <andes-form-field label="Code" [validateStatus]="status">
          <andes-input-otp formControlName="code" [length]="4" />
        </andes-form-field>
        <andes-form-field label="Bio" [validateStatus]="status">
          <andes-textarea formControlName="bio" [rows]="2" />
        </andes-form-field>
        <andes-form-field label="Seats" [validateStatus]="status">
          <andes-input-number formControlName="seats" [min]="1" />
        </andes-form-field>
        <andes-form-field label="Plan" [validateStatus]="status">
          <andes-select formControlName="plan" [options]="plans" placeholder="Choose a plan" />
        </andes-form-field>
        <andes-form-field label="City" [validateStatus]="status">
          <andes-combobox formControlName="city" [options]="cities" placeholder="Search a city" />
        </andes-form-field>
        <andes-form-field label="Brand color" [validateStatus]="status">
          <andes-color-picker formControlName="color" />
        </andes-form-field>
        <andes-form-field label="Terms" [validateStatus]="status">
          <andes-checkbox formControlName="terms">I accept the terms</andes-checkbox>
        </andes-form-field>
        <andes-form-field label="Topics" [validateStatus]="status">
          <andes-checkbox-group formControlName="topics" orientation="horizontal">
            <andes-checkbox value="news">News</andes-checkbox>
            <andes-checkbox value="tips">Tips</andes-checkbox>
          </andes-checkbox-group>
        </andes-form-field>
        <andes-form-field label="Billing" [validateStatus]="status">
          <andes-radio-group formControlName="billing" orientation="horizontal">
            <andes-radio value="month">Monthly</andes-radio>
            <andes-radio value="year">Yearly</andes-radio>
          </andes-radio-group>
        </andes-form-field>
        <andes-form-field label="Alerts" [validateStatus]="status">
          <andes-switch formControlName="alerts" />
        </andes-form-field>
        <andes-form-field label="View" [validateStatus]="status">
          <andes-segmented formControlName="view" [options]="['List', 'Board', 'Calendar']" />
        </andes-form-field>
        <andes-form-field label="Pinned" [validateStatus]="status">
          <andes-toggle formControlName="pinned">Pin</andes-toggle>
        </andes-form-field>
        <andes-form-field label="Days" [validateStatus]="status">
          <andes-toggle-group formControlName="days" type="multiple">
            <andes-toggle value="mon">Mon</andes-toggle>
            <andes-toggle value="tue">Tue</andes-toggle>
            <andes-toggle value="wed">Wed</andes-toggle>
          </andes-toggle-group>
        </andes-form-field>
        <andes-form-field label="Volume" [validateStatus]="status">
          <andes-slider formControlName="volume" />
        </andes-form-field>
        <andes-form-field label="Rating" [validateStatus]="status">
          <andes-rate formControlName="rating" />
        </andes-form-field>
        <andes-form-field>
          <andes-button type="submit">Submit</andes-button>
        </andes-form-field>
      </form>
    `,
  }),
};

/**
 * Registration with a password confirmation, two ways. The confirmation carries
 * `AndesValidators.matchField('password')` and `dependsOn="password"`, so it is checked again
 * when the password changes. The terms take a cross-field rule of the whole group instead,
 * shown on their field with `groupErrors`. `messageMode="first"` shows one message at a time.
 */
export const Registration: Story = {
  render: () => {
    const termsForPaid = (group: AbstractControl): ValidationErrors | null =>
      group.get('plan')?.value !== 'free' && !group.get('terms')?.value
        ? { termsForPaid: true }
        : null;
    const signup = new FormGroup(
      {
        email: new FormControl('', [Validators.required, Validators.email]),
        password: new FormControl('', [
          Validators.required,
          Validators.minLength(8),
          AndesValidators.notBlank,
        ]),
        confirm: new FormControl('', [
          Validators.required,
          AndesValidators.matchField('password'),
        ]),
        plan: new FormControl('pro', Validators.required),
        terms: new FormControl(false),
      },
      { validators: termsForPaid },
    );
    return {
      moduleMetadata,
      props: {
        signup,
        plans: PLAN_OPTIONS,
        messages: {
          mismatch: 'The passwords do not match.',
          termsForPaid: 'Accept the terms to start a paid plan.',
        },
      },
      template: `
        <form
          andesForm
          [formGroup]="signup"
          layout="horizontal"
          [labelCol]="8"
          messageMode="first"
          [errorMessages]="messages"
          (ngSubmit)="signup.markAllAsTouched()"
          style="width: min(520px, 100vw - 2rem);"
        >
          <andes-form-field label="Email">
            <andes-input formControlName="email" type="email" />
          </andes-form-field>
          <andes-form-field label="Password" extra="At least 8 characters.">
            <andes-input-password formControlName="password" />
          </andes-form-field>
          <andes-form-field label="Confirm password" dependsOn="password">
            <andes-input-password formControlName="confirm" />
          </andes-form-field>
          <andes-form-field label="Plan">
            <andes-select formControlName="plan" [options]="plans" />
          </andes-form-field>
          <andes-form-field label="Terms" groupErrors="termsForPaid">
            <andes-checkbox formControlName="terms">I accept the terms of service</andes-checkbox>
          </andes-form-field>
          <andes-form-field>
            <andes-button type="submit">Create account</andes-button>
          </andes-form-field>
        </form>
      `,
    };
  },
};

/**
 * A form submitted from outside itself - a dialog footer, a toolbar. The footer's buttons call
 * `andesForm`'s `submit()` and `reset()` through a template reference; the submit runs the
 * form's own path: `(validSubmit)` or `(invalidSubmit)` and `scrollToFirstError`. A native
 * `<button type="submit" form="new-project">` outside the form does the same with no code.
 */
export const SubmitFromAFooter: Story = {
  render: () => {
    const log = signal('');
    return {
      moduleMetadata,
      props: {
        log,
        project: new FormGroup({
          name: new FormControl('', Validators.required),
          owner: new FormControl('', [Validators.required, Validators.email]),
        }),
        onValid: (value: unknown) =>
          log.set(`validSubmit ${JSON.stringify(value)}`),
        onInvalid: () => log.set('invalidSubmit'),
        onReset: () => log.set('formReset'),
      },
      template: `
        <section
          aria-labelledby="new-project-title"
          style="width: min(420px, 100vw - 2rem); border: 1px solid var(--andes-color-border); border-radius: var(--andes-radius-lg); background: var(--andes-color-background); font-family: var(--andes-font-family), sans-serif;"
        >
          <h3 id="new-project-title" style="margin: 0; padding: 1rem 1.25rem 0; font-size: 1rem; line-height: 1.5rem; color: var(--andes-color-foreground);">New project</h3>
          <form
            id="new-project"
            andesForm
            #projectForm="andesForm"
            [formGroup]="project"
            scrollToFirstError
            (validSubmit)="onValid($event)"
            (invalidSubmit)="onInvalid()"
            (formReset)="onReset()"
            style="padding: 1rem 1.25rem;"
          >
            <andes-form-field label="Name">
              <andes-input formControlName="name" />
            </andes-form-field>
            <andes-form-field label="Owner email">
              <andes-input formControlName="owner" type="email" />
            </andes-form-field>
          </form>
          <footer style="display: flex; justify-content: flex-end; gap: 0.5rem; padding: 0.75rem 1.25rem; border-top: 1px solid var(--andes-color-border);">
            <andes-button variant="ghost" (click)="projectForm.reset()">Reset</andes-button>
            <andes-button (click)="projectForm.submit()">Create</andes-button>
          </footer>
        </section>
        @if (log()) {
          <pre style="${LOG_STYLE} margin-top: 1rem; max-width: 420px;">{{ log() }}</pre>
        }
      `,
    };
  },
};

/**
 * Advanced search: an inline-sized grid of three columns of horizontal fields, collapsed to
 * the first row until "More filters". It stacks to one column on a narrow canvas.
 */
export const AdvancedSearch: Story = {
  render: () => {
    const expanded = signal(false);
    return {
      moduleMetadata,
      props: {
        expanded,
        search: new FormGroup({
          keyword: new FormControl(''),
          plan: new FormControl<string | null>(null),
          owner: new FormControl(''),
          seats: new FormControl<number | null>(null),
          region: new FormControl<string | null>(null),
          active: new FormControl(true),
        }),
        plans: PLAN_OPTIONS,
        regions: [
          { value: 'na', label: 'North America' },
          { value: 'sa', label: 'South America' },
          { value: 'eu', label: 'Europe' },
        ],
      },
      template: `
        <form
          andesForm
          [formGroup]="search"
          layout="horizontal"
          labelCol="5.5rem"
          [colon]="false"
          style="width: min(960px, 100vw - 2rem);"
        >
          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(18rem, 1fr)); gap: 1.5rem 2rem;">
            <andes-form-field label="Keyword">
              <andes-input formControlName="keyword" placeholder="Name or id" clearable />
            </andes-form-field>
            <andes-form-field label="Plan">
              <andes-select formControlName="plan" [options]="plans" placeholder="Any" />
            </andes-form-field>
            <andes-form-field label="Owner">
              <andes-input formControlName="owner" placeholder="Email" />
            </andes-form-field>
            @if (expanded()) {
              <andes-form-field label="Seats">
                <andes-input-number formControlName="seats" [min]="1" placeholder="Any" />
              </andes-form-field>
              <andes-form-field label="Region">
                <andes-select formControlName="region" [options]="regions" placeholder="Any" />
              </andes-form-field>
              <andes-form-field label="Active">
                <andes-switch formControlName="active" />
              </andes-form-field>
            }
          </div>
          <div style="display: flex; justify-content: flex-end; gap: 0.5rem;">
            <andes-button variant="ghost" (click)="expanded.set(!expanded())">{{ expanded() ? 'Fewer filters' : 'More filters' }}</andes-button>
            <andes-button variant="outline" type="reset">Clear</andes-button>
            <andes-button type="submit">Search</andes-button>
          </div>
        </form>
      `,
    };
  },
};

/**
 * `<andes-form-fieldset>` groups related fields under a native fieldset and legend, which a
 * screen reader announces before each field inside. Its `[control]` shows the group's own
 * errors at the bottom - here at least two contact channels - once a field in it was
 * touched or the form submitted.
 */
export const Fieldset: Story = {
  render: () => {
    const twoChannels = (group: AbstractControl): ValidationErrors | null =>
      Object.values(group.value as Record<string, boolean>).filter(Boolean)
        .length >= 2
        ? null
        : { twoChannels: true };
    const profile = new FormGroup({
      address: new FormGroup({
        street: new FormControl('', Validators.required),
        city: new FormControl('', Validators.required),
      }),
      channels: new FormGroup(
        {
          email: new FormControl(true),
          sms: new FormControl(false),
          phone: new FormControl(false),
        },
        { validators: twoChannels },
      ),
    });
    return {
      moduleMetadata,
      props: { profile },
      template: `
        <form
          andesForm
          [formGroup]="profile"
          (ngSubmit)="profile.markAllAsTouched()"
          style="display: flex; flex-direction: column; gap: 2rem; width: min(420px, 100vw - 2rem);"
        >
          <andes-form-fieldset legend="Shipping address" description="Where we send the order." formGroupName="address">
            <andes-form-field label="Street">
              <andes-input formControlName="street" />
            </andes-form-field>
            <andes-form-field label="City">
              <andes-input formControlName="city" />
            </andes-form-field>
          </andes-form-fieldset>
          <andes-form-fieldset
            legend="How can we reach you?"
            formGroupName="channels"
            [control]="profile.controls.channels"
            [errorMessages]="{ twoChannels: 'Pick at least two channels.' }"
          >
            <andes-checkbox formControlName="email">Email</andes-checkbox>
            <andes-checkbox formControlName="sms">Text message</andes-checkbox>
            <andes-checkbox formControlName="phone">Phone call</andes-checkbox>
          </andes-form-fieldset>
          <div>
            <andes-button type="submit">Save</andes-button>
          </div>
        </form>
      `,
    };
  },
};

/** The signal forms example: `form()` needs an injection context, a component field gives it. */
@Component({
  selector: 'andes-story-signal-signup',
  imports: [
    FormField,
    FormRoot,
    AndesForm,
    AndesFormField,
    AndesInput,
    AndesTextarea,
    AndesButton,
  ],
  template: `
    <form
      andesForm
      [formRoot]="signup"
      (validSubmit)="log.set('validSubmit ' + stringify($event))"
      (invalidSubmit)="log.set('invalidSubmit ' + paths($event.errors))"
      style="width: min(420px, 100vw - 2rem);"
    >
      <andes-form-field label="Name">
        <andes-input [formField]="signup.name" />
      </andes-form-field>
      <andes-form-field label="Email">
        <andes-input [formField]="signup.email" type="email" />
      </andes-form-field>
      <andes-form-field label="Bio" extra="At least 10 characters.">
        <andes-textarea [formField]="signup.bio" [rows]="3" />
      </andes-form-field>
      <andes-form-field>
        <andes-button type="submit">Sign up</andes-button>
      </andes-form-field>
      @if (log()) {
        <pre style="${LOG_STYLE}">{{ log() }}</pre>
      }
    </form>
  `,
})
class SignalSignupDemo {
  protected readonly log = signal('');
  protected readonly model = signal({ name: '', email: '', bio: '' });
  protected readonly signup = form(this.model, (path) => {
    required(path.name);
    required(path.email);
    email(path.email);
    minLength(path.bio, 10);
  });
  protected readonly stringify = (value: unknown) => JSON.stringify(value);
  protected readonly paths = (errors: readonly { path: unknown }[]) =>
    JSON.stringify(errors.map((error) => error.path));
}

/**
 * Signal forms: `andesForm` on a `<form [formRoot]>` and each control on a `[formField]`. The
 * schema's `required`, `email` and `minLength` mark the labels and fill the messages; a submit
 * reveals every error and reports the verdict through `(validSubmit)` / `(invalidSubmit)`.
 */
export const SignalForms: Story = {
  render: () => ({
    moduleMetadata: { imports: [SignalSignupDemo] },
    template: `<andes-story-signal-signup />`,
  }),
};
