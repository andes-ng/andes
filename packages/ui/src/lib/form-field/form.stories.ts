import { signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import type { Meta, StoryObj } from '@storybook/angular';

import { AndesButton } from '../button/button';
import { AndesCheckbox } from '../checkbox/checkbox';
import { AndesInput } from '../input/input';
import { AndesInputPassword } from '../input/input-password';
import { AndesRadio } from '../radio-group/radio';
import { AndesRadioGroup } from '../radio-group/radio-group';
import { AndesSelect } from '../select/select';
import { AndesSwitch } from '../switch/switch';
import { AndesForm } from './form';
import { AndesFormField } from './form-field';
import type {
  AndesFormLabelAlign,
  AndesFormLayout,
  AndesFormRequiredMark,
  AndesFormSize,
  AndesFormVariant,
} from './form-field-tokens';
import { AndesFormLabel } from './form-label';
import { PLAN_OPTIONS } from './form-field.stories';

const moduleMetadata = {
  imports: [
    ReactiveFormsModule,
    AndesForm,
    AndesFormField,
    AndesFormLabel,
    AndesButton,
    AndesCheckbox,
    AndesInput,
    AndesInputPassword,
    AndesRadio,
    AndesRadioGroup,
    AndesSelect,
    AndesSwitch,
  ],
};

interface FormArgs {
  layout: AndesFormLayout;
  labelAlign: AndesFormLabelAlign;
  labelCol: number;
  labelWrap: boolean;
  colon: boolean;
  requiredMark: AndesFormRequiredMark;
  size: AndesFormSize | undefined;
  variant: AndesFormVariant | undefined;
  disabled: boolean;
}

const meta: Meta<FormArgs> = {
  title: 'Data Entry/Form/Layout',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          '`andesForm` is an attribute directive for the `<form>` (or any container) that holds',
          'your `AndesFormField`s. It carries the form’s *presentation* settings -',
          '`layout`, `labelCol` / `wrapperCol`, `labelAlign`, `labelWrap`, `colon`,',
          '`requiredMark`, `size`, `variant`, `showErrorsOn`, `feedbackIcons`, `errorMessages`',
          'and `scrollToFirstError` - and hands it to every field through DI. Each field has a',
          'same-named input that overrides it.',
          '',
          'Form **state** is deliberately *not* here: values, validation, reset and submit all',
          'stay with Angular’s `FormGroupDirective` / `NgForm`, which `andesForm` sits alongside',
          'on the same element. The form instance, initial values, value watching, dynamic lists',
          'and cross-form coordination map to `FormGroup`, the `FormControl` constructor,',
          '`valueChanges` / `toSignal`, `FormArray` and plain component composition.',
          '',
          'A few thin conveniences drive or read that same Angular form: `disabled`',
          '(`disable()` / `enable()` on it), `(validSubmit)` / `(invalidSubmit)` (the submit',
          'verdict, after async validators settle, with every failing control path),',
          '`submit()`, `reset()`, `(valuesChange)`, `(formReset)` and `scrollToField(path)`.',
          'With signal forms, `andesForm` sits on a `<form [formRoot]>` the same way.',
          '',
          '`size` and `variant` reach every library control whose own is unset, and `disabled`',
          'disables each of them, buttons included - also a control bound to a signal of its own',
          'rather than to the form. A control maps `variant` to its own vocabulary and ignores a',
          'value it does not have. On a screen 575px wide or less a horizontal form stacks its',
          'labels above the controls.',
        ].join('\n'),
      },
    },
  },
  argTypes: {
    layout: {
      control: 'inline-radio',
      options: ['horizontal', 'vertical', 'inline'],
    },
    labelAlign: { control: 'inline-radio', options: ['left', 'right'] },
    labelCol: { control: { type: 'range', min: 2, max: 16, step: 1 } },
    labelWrap: { control: 'boolean' },
    colon: { control: 'boolean' },
    requiredMark: {
      control: 'inline-radio',
      options: [true, false, 'optional'],
    },
    size: { control: 'inline-radio', options: [undefined, 'sm', 'md', 'lg'] },
    variant: {
      control: 'inline-radio',
      options: [undefined, 'outlined', 'filled', 'borderless', 'underlined'],
    },
    disabled: { control: 'boolean' },
  },
  args: {
    layout: 'horizontal',
    labelAlign: 'right',
    labelCol: 8,
    labelWrap: false,
    colon: true,
    requiredMark: true,
    size: undefined,
    variant: undefined,
    disabled: false,
  },
};

export default meta;

type Story = StoryObj<FormArgs>;

function signUpForm() {
  return new FormGroup({
    name: new FormControl('', Validators.required),
    email: new FormControl('', [Validators.required, Validators.email]),
    company: new FormControl(''),
    plan: new FormControl('pro', Validators.required),
  });
}

const signUpTemplate = (extra = '') => `
  <form
    andesForm
    [formGroup]="form"
    [layout]="layout"
    [labelAlign]="labelAlign"
    [labelCol]="labelCol"
    [labelWrap]="labelWrap"
    [colon]="colon"
    [requiredMark]="requiredMark"
    [size]="size"
    [variant]="variant"
    [disabled]="disabled"
    ${extra}
    (ngSubmit)="form.markAllAsTouched()"
    style="width: min(560px, 100vw - 2rem);"
  >
    <andes-form-field label="Full name" tooltip="As printed on your ID.">
      <andes-input formControlName="name" />
    </andes-form-field>
    <andes-form-field label="Work email address">
      <andes-input formControlName="email" type="email" />
    </andes-form-field>
    <andes-form-field label="Company" extra="Leave blank if you are signing up alone.">
      <andes-input formControlName="company" />
    </andes-form-field>
    <andes-form-field label="Plan">
      <andes-select formControlName="plan" [options]="plans" />
    </andes-form-field>
    <andes-form-field>
      <andes-button type="submit">Create account</andes-button>
    </andes-form-field>
  </form>
`;

/** Every form-level option as a control. Submit with empty fields to reveal the errors. */
export const Playground: Story = {
  render: (args) => ({
    moduleMetadata,
    props: { ...args, form: signUpForm(), plans: PLAN_OPTIONS },
    template: signUpTemplate(),
  }),
};

/**
 * The three `layout`s, each submitted empty to show its errors in place.
 *
 * `horizontal`: label and control side by side, the label column one third wide by default
 * (`labelCol` 8 of 24). Labels are right-aligned and truncated unless `labelWrap`; the colon
 * only appears in this layout. The label-less submit field keeps the empty label column, so
 * the button lines up under the controls. The name field is touched to show a message sitting
 * in the control column. Next, `labelCol` as a CSS length with `labelAlign="left"` and
 * `labelWrap` on.
 *
 * `vertical` is the default - identical to fields with no `andesForm` at all. `inline` makes
 * the fields flow in a wrapping row, label beside control. On a screen 575px wide or less a
 * horizontal form stacks: open the story at a phone width.
 */
export const Layouts: Story = {
  render: (args) => {
    const horizontal = signUpForm();
    horizontal.controls.name.markAsTouched();
    horizontal.controls.email.setValue('ada@lovelace.dev');
    horizontal.controls.email.markAsTouched();
    const fields = (extra: string) => `
      <andes-form-field label="Full name" tooltip="As printed on your ID.">
        <andes-input formControlName="name" />
      </andes-form-field>
      <andes-form-field label="Work email address">
        <andes-input formControlName="email" type="email" />
      </andes-form-field>
      <andes-form-field label="Company" extra="Leave blank if you are signing up alone.">
        <andes-input formControlName="company" />
      </andes-form-field>
      <andes-form-field>
        <andes-button type="submit">${extra}</andes-button>
      </andes-form-field>`;
    return {
      moduleMetadata,
      props: {
        ...args,
        horizontal,
        leftAligned: signUpForm(),
        vertical: signUpForm(),
        inline: new FormGroup({
          user: new FormControl('', Validators.required),
          password: new FormControl('', Validators.required),
        }),
      },
      template: `
        <div style="display: flex; flex-direction: column; gap: 2.5rem; width: min(560px, 100vw - 2rem);">
          <form andesForm [formGroup]="horizontal" layout="horizontal" [requiredMark]="requiredMark" (ngSubmit)="horizontal.markAllAsTouched()">
            ${fields('Horizontal')}
          </form>
          <form andesForm [formGroup]="leftAligned" layout="horizontal" labelAlign="left" labelCol="9rem" [labelWrap]="true" (ngSubmit)="leftAligned.markAllAsTouched()">
            ${fields('Left-aligned, fixed width')}
          </form>
          <form andesForm [formGroup]="vertical" layout="vertical" (ngSubmit)="vertical.markAllAsTouched()">
            ${fields('Vertical')}
          </form>
          <form andesForm [formGroup]="inline" layout="inline" (ngSubmit)="inline.markAllAsTouched()">
            <andes-form-field label="Username">
              <andes-input formControlName="user" style="width: 12rem;" />
            </andes-form-field>
            <andes-form-field label="Password">
              <andes-input-password formControlName="password" style="width: 12rem;" />
            </andes-form-field>
            <andes-form-field>
              <andes-button type="submit">Log in (inline)</andes-button>
            </andes-form-field>
          </form>
        </div>
      `,
    };
  },
};

/**
 * What a form hands down to its controls. Each column is an `andesForm` with its own `size`:
 * every control in it - input, select, number, radios, switch, checkbox, button - takes it.
 * Below, `variant="filled"` reaches the controls that have a filled look, and `disabled`
 * disables the Angular form (`disable()`) and also the button, which is bound to nothing.
 */
export const Propagation: Story = {
  args: { layout: 'horizontal' },
  render: (args) => ({
    moduleMetadata,
    props: {
      ...args,
      sizes: ['sm', 'md', 'lg'],
      columns: (['sm', 'md', 'lg'] as const).map(() => signUpForm()),
      locked: signal(true),
      form: signUpForm(),
      plans: PLAN_OPTIONS,
    },
    template: `
      <div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1.5rem; width: min(960px, 100vw - 2rem);">
        @for (s of sizes; track s; let i = $index) {
          <form andesForm [size]="s" [formGroup]="columns[i]">
            <andes-form-field [label]="'size = ' + s">
              <andes-input formControlName="name" placeholder="Full name" />
            </andes-form-field>
            <andes-form-field label="Plan">
              <andes-select formControlName="plan" [options]="plans" />
            </andes-form-field>
            <andes-form-field label="Billing">
              <andes-radio-group value="month" optionType="button">
                <andes-radio value="month">Monthly</andes-radio>
                <andes-radio value="year">Yearly</andes-radio>
              </andes-radio-group>
            </andes-form-field>
            <andes-form-field>
              <andes-button type="submit">Save</andes-button>
            </andes-form-field>
          </form>
        }
      </div>
      <div style="margin-block: 2rem 1rem;">
        <andes-switch [checked]="locked()" (checkedChange)="locked.set($event)">Disable the form</andes-switch>
      </div>
      <form
        andesForm
        [formGroup]="form"
        [layout]="layout"
        [labelCol]="labelCol"
        [disabled]="locked()"
        variant="filled"
        style="width: min(560px, 100vw - 2rem);"
      >
        <andes-form-field label="Full name">
          <andes-input formControlName="name" />
        </andes-form-field>
        <andes-form-field label="Work email">
          <andes-input formControlName="email" />
        </andes-form-field>
        <andes-form-field label="Plan">
          <andes-select formControlName="plan" [options]="plans" />
        </andes-form-field>
        <andes-form-field label="Newsletter">
          <andes-checkbox>Send me product news</andes-checkbox>
        </andes-form-field>
        <andes-form-field>
          <andes-button type="submit">Create account</andes-button>
        </andes-form-field>
      </form>
    `,
  }),
};

/**
 * `requiredMark` also takes a template, rendered after every label with `$implicit` = whether
 * the field is required - here a "Required" / "Optional" tag.
 */
export const CustomRequiredMark: Story = {
  args: { layout: 'vertical' },
  render: (args) => ({
    moduleMetadata,
    props: { ...args, form: signUpForm() },
    template: `
      <ng-template #tag let-required>
        <span
          [style.color]="required ? 'var(--andes-color-danger-hover)' : 'var(--andes-color-muted-foreground)'"
          style="margin-inline-start: 0.375rem; padding: 0 0.375rem; border: 1px solid currentColor; border-radius: var(--andes-radius-sm); font-size: 0.75rem; font-weight: normal;"
          >{{ required ? 'Required' : 'Optional' }}</span
        >
      </ng-template>
      <form andesForm [formGroup]="form" [requiredMark]="tag" style="width: min(360px, 100vw - 2rem);">
        <andes-form-field label="Full name">
          <andes-input formControlName="name" />
        </andes-form-field>
        <andes-form-field label="Company">
          <andes-input formControlName="company" />
        </andes-form-field>
      </form>
    `,
  }),
};

/**
 * `requiredMark` styles and where the asterisk sits. Each row is a form with its own mark:
 * the default asterisk, `'optional'` (the optional fields say so instead), `false` (nothing),
 * and a template shown after every label. `requiredMarkPosition` moves only the asterisk:
 * `start` (default) before the label text, `end` after it, before the colon and the tooltip -
 * the optional text and the template keep their place after the text. The right-hand column is
 * right-to-left text, where the asterisk flips sides on its own. A field's own
 * `requiredMarkPosition` wins over the form's.
 */
export const RequiredMark: Story = {
  args: { layout: 'horizontal' },
  render: (args) => {
    const rows = [
      { title: 'Default', mark: true },
      { title: 'optional', mark: 'optional' },
      { title: 'false', mark: false },
    ];
    return {
      moduleMetadata,
      props: {
        ...args,
        rows,
        positions: ['start', 'end'],
        forms: Array.from({ length: rows.length * 2 }, () => signUpForm()),
        tpl: signUpForm(),
        rtl: signUpForm(),
        mixed: signUpForm(),
      },
      template: `
        <ng-template #tag let-required>
          <span
            [style.color]="required ? 'var(--andes-color-danger-hover)' : 'var(--andes-color-muted-foreground)'"
            style="margin-inline-start: 0.375rem; font-size: 0.75rem; font-weight: normal;"
            >{{ required ? '(required)' : '(optional)' }}</span
          >
        </ng-template>
        <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1.5rem 2.5rem; width: min(960px, 100vw - 2rem);">
          @for (position of positions; track position) {
            <h4 style="grid-column: span 1; margin: 0; font-family: var(--andes-font-family), sans-serif; font-size: 0.875rem; color: var(--andes-color-foreground);">requiredMarkPosition = {{ position }}</h4>
          }
          @for (row of rows; track row.title; let r = $index) {
            @for (position of positions; track position; let p = $index) {
              <form andesForm [formGroup]="forms[r * 2 + p]" layout="horizontal" [labelCol]="9" [requiredMark]="row.mark" [requiredMarkPosition]="$any(position)">
                <andes-form-field label="Full name (requiredMark = {{ row.title }})" tooltip="As printed on your ID." [labelWrap]="true">
                  <andes-input formControlName="name" />
                </andes-form-field>
                <andes-form-field label="Company">
                  <andes-input formControlName="company" />
                </andes-form-field>
              </form>
            }
          }
          <form andesForm [formGroup]="tpl" layout="horizontal" [labelCol]="9" [requiredMark]="tag" requiredMarkPosition="end">
            <andes-form-field label="Template">
              <andes-input formControlName="name" />
            </andes-form-field>
            <andes-form-field label="Company">
              <andes-input formControlName="company" />
            </andes-form-field>
          </form>
          <form andesForm dir="rtl" [formGroup]="rtl" layout="horizontal" [labelCol]="9" requiredMarkPosition="end">
            <andes-form-field label="الاسم الكامل">
              <andes-input formControlName="name" />
            </andes-form-field>
            <andes-form-field label="Right to left, end">
              <andes-input formControlName="email" />
            </andes-form-field>
          </form>
          <form andesForm [formGroup]="mixed" layout="vertical" requiredMarkPosition="end">
            <andes-form-field label="Form says end">
              <andes-input formControlName="name" />
            </andes-form-field>
            <andes-form-field label="This field says start" requiredMarkPosition="start">
              <andes-input formControlName="email" />
            </andes-form-field>
          </form>
        </div>
      `,
    };
  },
};

/**
 * `labelWrap`: what happens to a label longer than its column in a horizontal form. By default
 * it is cut with an ellipsis (hover for the full text in a real app); with `labelWrap` it wraps
 * onto more lines, the colon and the tooltip following the last word. `labelAlign="left"`
 * and a fixed `labelCol` show the same.
 */
export const LabelWrap: Story = {
  render: () => ({
    moduleMetadata,
    props: { off: signUpForm(), on: signUpForm(), left: signUpForm() },
    template: `
      <div style="display: flex; flex-direction: column; gap: 2.5rem; width: min(560px, 100vw - 2rem);">
        @for (case of [
          { title: 'Truncated (default)', wrap: false, align: 'right', form: off },
          { title: 'labelWrap', wrap: true, align: 'right', form: on },
          { title: 'labelWrap, labelAlign = left', wrap: true, align: 'left', form: left }
        ]; track case.title) {
          <form andesForm [formGroup]="case.form" layout="horizontal" labelCol="9rem" [labelWrap]="case.wrap" [labelAlign]="$any(case.align)">
            <andes-form-field [label]="'Work email address used to sign in to the billing portal'" tooltip="We never share it.">
              <andes-input formControlName="email" [placeholder]="case.title" />
            </andes-form-field>
          </form>
        }
      </div>
    `,
  }),
};

/**
 * Mixed layouts: the form sets a default `layout` and any field overrides it. Here a horizontal
 * form with one vertical field (a long text area wants the room), and a vertical form with an
 * inline row of fields - each keeps its own label placement and the form's `labelCol` only
 * applies where the field is horizontal.
 */
export const MixedLayouts: Story = {
  render: () => ({
    moduleMetadata,
    props: { horizontal: signUpForm(), vertical: signUpForm() },
    template: `
      <div style="display: flex; flex-direction: column; gap: 2.5rem; width: min(560px, 100vw - 2rem);">
        <form andesForm [formGroup]="horizontal" layout="horizontal" [labelCol]="6">
          <andes-form-field label="Full name">
            <andes-input formControlName="name" />
          </andes-form-field>
          <andes-form-field label="About you (vertical)" layout="vertical" extra="This field stacks its label.">
            <andes-input formControlName="company" />
          </andes-form-field>
          <andes-form-field label="Work email">
            <andes-input formControlName="email" />
          </andes-form-field>
        </form>
        <form andesForm [formGroup]="vertical" layout="vertical">
          <andes-form-field label="Full name">
            <andes-input formControlName="name" />
          </andes-form-field>
          <andes-form-field label="Work email (horizontal)" layout="horizontal" [labelCol]="8">
            <andes-input formControlName="email" />
          </andes-form-field>
          <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
            <andes-form-field label="Company" layout="inline">
              <andes-input formControlName="company" style="width: 9rem;" />
            </andes-form-field>
            <andes-form-field label="Plan" layout="inline">
              <andes-select formControlName="plan" [options]="plans" style="width: 8rem;" />
            </andes-form-field>
          </div>
        </form>
      </div>
    `,
  }),
};

/**
 * Custom semantic parts: `classNames` and `styles` reach the parts of a form and its fields -
 * `root` (the form element, or the field box), `label`, `control`, `help` (the help text and
 * the warning lines), `extra` and `error` (the generated messages and `<andes-form-error>`).
 * On `andesForm`, `root` is the `<form>` and the other parts are the default for every field
 * inside it; a field's own classes are added to them and its own styles win. Classes style the
 * parts from a stylesheet (this story's `<style>`, with `::ng-deep` because the parts live in the
 * field's own view); `styles` sets them inline.
 */
export const SemanticParts: Story = {
  render: () => ({
    moduleMetadata,
    props: {
      form: signUpForm(),
      formClassNames: {
        root: 'demo-form',
        label: 'demo-label',
        error: 'demo-error',
      },
      formStyles: { control: { 'padding-inline-start': '0.25rem' } },
      fieldClassNames: { root: 'demo-highlight', extra: 'demo-extra' },
      fieldStyles: {
        label: { 'letter-spacing': '0.04em', 'text-transform': 'uppercase' },
      },
    },
    template: `
      <style>
        ::ng-deep .demo-form { padding: 1rem; border: 1px dashed var(--andes-color-border); border-radius: var(--andes-radius-lg); }
        ::ng-deep .demo-label { font-style: italic; }
        ::ng-deep .demo-error { font-weight: 600; }
        ::ng-deep .demo-highlight { padding: 0.5rem; border-radius: var(--andes-radius-md); background: var(--andes-color-muted); }
        ::ng-deep .demo-extra { font-style: italic; }
      </style>
      <form
        andesForm
        [formGroup]="form"
        [classNames]="formClassNames"
        [styles]="formStyles"
        (ngSubmit)="form.markAllAsTouched()"
        style="width: min(480px, 100vw - 2rem);"
      >
        <andes-form-field label="Full name" [classNames]="fieldClassNames" [styles]="fieldStyles" extra="Classes on root and extra, inline styles on label.">
          <andes-input formControlName="name" />
        </andes-form-field>
        <andes-form-field label="Work email">
          <andes-input formControlName="email" type="email" />
        </andes-form-field>
        <andes-form-field>
          <andes-button type="submit">Submit to see the error part</andes-button>
        </andes-form-field>
      </form>
    `,
  }),
};
