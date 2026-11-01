import { JsonPipe } from '@angular/common';
import { signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import type { Meta, StoryObj } from '@storybook/angular';

import { AndesButton } from '../button/button';
import { AndesCheckbox } from '../checkbox/checkbox';
import { AndesInput } from '../input/input';
import { AndesInputNumber } from '../input-number/input-number';
import { AndesSelect } from '../select/select';
import { AndesTextarea } from '../textarea/textarea';
import { AndesForm } from './form';
import { AndesFormControl } from './form-control';
import { AndesFormDescription } from './form-description';
import { AndesFormError } from './form-error';
import { AndesFormField } from './form-field';
import { AndesFormLabel } from './form-label';

/** What every form story imports: the form parts and the library controls they hold. */
export const fieldModuleMetadata = {
  imports: [
    JsonPipe,
    ReactiveFormsModule,
    FormsModule,
    AndesForm,
    AndesFormField,
    AndesFormLabel,
    AndesFormControl,
    AndesFormDescription,
    AndesFormError,
    AndesButton,
    AndesCheckbox,
    AndesInput,
    AndesInputNumber,
    AndesSelect,
    AndesTextarea,
  ],
};

/** Options for the plan select of several stories. */
export const PLAN_OPTIONS = [
  { value: 'free', label: 'Free' },
  { value: 'pro', label: 'Pro' },
  { value: 'team', label: 'Team' },
];

const meta: Meta<AndesFormField> = {
  title: 'Data Entry/Form/Field/Basics',
  component: AndesFormField,
  tags: ['autodocs'],
  excludeStories: ['fieldModuleMetadata', 'PLAN_OPTIONS'],
  parameters: {
    docs: {
      description: {
        component: [
          '`<andes-form-field>` lays out a label, one control, a description and the messages,',
          'and wires them together. Put a library control inside with `formControlName`,',
          '`[formControl]`, `[(ngModel)]` or signal forms’ `[formField]` and the control reads',
          'the field by itself (`injectAndesFieldBinding()`):',
          '',
          '- it takes the field’s id, so the `<label for>` points at it and clicking the label',
          '  focuses it (a select or color picker is focused, not opened);',
          '- it is named by the label (`aria-labelledby`) and described by the description, the',
          '  messages and `extra` (`aria-describedby`, merged with its own);',
          '- it shows the field’s error or warning (`aria-invalid` where its role has it) and',
          '  announces a required field;',
          '- it registers with the field, so the required mark, the status and the generated',
          '  messages follow its validators.',
          '',
          'Nothing is bound by hand:',
          '',
          '```html',
          '<andes-form-field label="Full name">',
          '  <andes-input formControlName="name" />',
          '  <andes-form-description>As printed on your ID.</andes-form-description>',
          '</andes-form-field>',
          '```',
          '',
          '`andesFormControl` is still what wires a **native** `<input>`, `<textarea>` or',
          '`<select>`, and a template reference to the field state (`#ctrl="andesFormControl"`)',
          'on any control. A third-party control that does not read the field can be wired from',
          'those signals by hand; they return `undefined` when there is nothing to bind.',
          '',
          'The texts the form writes by itself - the optional mark, the tooltip button’s name',
          'and the generated messages - follow `provideAndesFormLocale()`; `ANDES_FORM_LOCALE_ES`',
          'is built in.',
          '',
          'Field features: `validateStatus` (derived or set by hand), `hasFeedback`, `help`,',
          '`extra`, generated messages (`errorMessages`, `provideAndesFormErrorMessages()`,',
          '`messageMode`), the required mark (`required`, `requiredMark`), `tooltip`, `label`,',
          '`htmlFor`, `hidden`, `noStyle`, `groupErrors` and `dependsOn`. Layout, size, variant',
          'and disabled come from the enclosing `andesForm` - see the **Form** stories.',
        ].join('\n'),
      },
    },
  },
};

export default meta;

type Story = StoryObj<AndesFormField>;

/**
 * The anatomy: a label, an `AndesInput`, a description and a hand-written error. Focus the
 * field and leave it empty: the error shows once it is touched, never on load, although the
 * field starts invalid. The second field has only a description, the third a select with
 * generated messages.
 */
export const Basic: Story = {
  render: () => ({
    moduleMetadata: fieldModuleMetadata,
    props: {
      name: new FormControl('', Validators.required),
      nickname: new FormControl(''),
      plan: new FormControl<string | null>(null, Validators.required),
      plans: PLAN_OPTIONS,
    },
    template: `
      <div style="display: flex; flex-direction: column; gap: 1.5rem; width: min(360px, 100vw - 2rem);">
        <andes-form-field label="Full name">
          <andes-input [formControl]="name" />
          <andes-form-description>As printed on your ID.</andes-form-description>
          <andes-form-error>Your name is required.</andes-form-error>
        </andes-form-field>
        <andes-form-field label="Nickname">
          <andes-input [formControl]="nickname" />
          <andes-form-description>Shown on your profile.</andes-form-description>
        </andes-form-field>
        <andes-form-field label="Plan">
          <andes-select [formControl]="plan" [options]="plans" placeholder="Choose a plan" />
        </andes-form-field>
      </div>
    `,
  }),
};

/**
 * The Angular forms APIs side by side: a reactive `FormGroup` submitted with
 * `markAllAsTouched()`, and a template-driven form with `[(ngModel)]` and the `required`
 * attribute. The field reads whichever `NgControl` is there.
 */
export const Binding: Story = {
  render: () => ({
    moduleMetadata: fieldModuleMetadata,
    props: {
      profile: new FormGroup({
        email: new FormControl('', [Validators.required, Validators.email]),
        plan: new FormControl('pro', Validators.required),
      }),
      plans: PLAN_OPTIONS,
      nickname: signal(''),
    },
    template: `
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr)); gap: 2.5rem; width: min(720px, 100vw - 2rem);">
        <form andesForm [formGroup]="profile" (ngSubmit)="profile.markAllAsTouched()">
          <andes-form-field label="Email">
            <andes-input formControlName="email" type="email" />
          </andes-form-field>
          <andes-form-field label="Plan">
            <andes-select formControlName="plan" [options]="plans" />
          </andes-form-field>
          <andes-form-field>
            <andes-button type="submit">Save (reactive)</andes-button>
          </andes-form-field>
        </form>
        <form andesForm #tdf="ngForm">
          <andes-form-field label="Nickname">
            <andes-input name="nickname" [(ngModel)]="nickname" required minlength="3" />
          </andes-form-field>
          <andes-form-field>
            <andes-button type="submit">Save (template-driven)</andes-button>
          </andes-form-field>
        </form>
      </div>
    `,
  }),
};

/**
 * Text around the control. `help` replaces the generated messages and takes the status
 * colour, `extra` always sits underneath; both describe the control. The required mark follows
 * `Validators.required`; `tooltip` adds an info button next to the label (hover or focus it,
 * Escape closes it).
 */
export const Hints: Story = {
  render: () => ({
    moduleMetadata: fieldModuleMetadata,
    props: {
      form: new FormGroup({
        bio: new FormControl('', [
          Validators.required,
          Validators.maxLength(160),
        ]),
        website: new FormControl(''),
        seats: new FormControl(3, [Validators.min(1), Validators.max(50)]),
      }),
    },
    template: `
      <form andesForm [formGroup]="form" style="width: min(420px, 100vw - 2rem);">
        <andes-form-field label="Bio" tooltip="Shown on your public profile." help="Keep it short: who you are and what you do.">
          <andes-textarea formControlName="bio" [rows]="3" showCount [maxLength]="160" />
        </andes-form-field>
        <andes-form-field label="Website" extra="Optional. Starts with https://.">
          <andes-input formControlName="website" placeholder="https://" />
        </andes-form-field>
        <andes-form-field label="Seats" extra="Between 1 and 50.">
          <andes-input-number formControlName="seats" [min]="1" [max]="50" />
        </andes-form-field>
      </form>
    `,
  }),
};

/**
 * `noStyle` fields render only their control, and several of them can share one labelled
 * parent field, whose status and messages gather theirs - a compound field. The first control
 * takes the label's id; the second is named by its own `aria-label`.
 */
export const Compound: Story = {
  render: () => ({
    moduleMetadata: fieldModuleMetadata,
    props: {
      phone: new FormGroup({
        code: new FormControl('+51', Validators.required),
        number: new FormControl('', [
          Validators.required,
          Validators.pattern(/^\d{9}$/),
        ]),
      }),
      codes: [
        { value: '+51', label: '+51' },
        { value: '+54', label: '+54' },
        { value: '+56', label: '+56' },
      ],
    },
    template: `
      <form andesForm [formGroup]="phone" style="width: min(420px, 100vw - 2rem);">
        <andes-form-field label="Mobile phone" extra="Nine digits.">
          <div style="display: flex; gap: 0.5rem;">
            <andes-form-field noStyle>
              <andes-select formControlName="code" [options]="codes" style="width: 6rem;" />
            </andes-form-field>
            <andes-form-field noStyle>
              <andes-input formControlName="number" aria-label="Number" />
            </andes-form-field>
          </div>
        </andes-form-field>
      </form>
    `,
  }),
};

/**
 * `hidden` hides a field but keeps its control in the form: the record id still travels with
 * the value. `feedbackIcons` swaps the built-in status icons for a template, and `tooltip`
 * takes a template for rich content. A checkbox with text of its own keeps that text as its
 * name; the field label still points at it.
 */
export const HiddenAndTemplates: Story = {
  render: () => {
    const form = new FormGroup({
      id: new FormControl('rec_42'),
      title: new FormControl('', [
        Validators.required,
        Validators.minLength(4),
      ]),
      terms: new FormControl(false, Validators.requiredTrue),
    });
    return {
      moduleMetadata: fieldModuleMetadata,
      props: { form },
      template: `
        <ng-template #icons let-status>
          <span style="font-size: 0.75rem; font-weight: 600;">{{ status === 'success' ? 'OK' : status === 'error' ? '!' : '…' }}</span>
        </ng-template>
        <ng-template #rich>Between <strong>4</strong> and <strong>60</strong> characters.</ng-template>
        <form andesForm [formGroup]="form" [feedbackIcons]="icons" style="width: min(420px, 100vw - 2rem);">
          <andes-form-field label="Record id" hidden>
            <andes-input formControlName="id" />
          </andes-form-field>
          <andes-form-field label="Title" [tooltip]="rich" hasFeedback>
            <andes-input formControlName="title" />
          </andes-form-field>
          <andes-form-field label="Terms">
            <andes-checkbox formControlName="terms">I accept the terms of service</andes-checkbox>
          </andes-form-field>
          <p style="margin: 0; font-family: var(--andes-font-family), sans-serif; font-size: 0.75rem; color: var(--andes-color-muted-foreground);">
            Value: {{ form.value | json }}
          </p>
        </form>
      `,
    };
  },
};
