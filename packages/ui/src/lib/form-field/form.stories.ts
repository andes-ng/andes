import { Component, computed, input, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import type { Meta, StoryObj } from '@storybook/angular';

import { AndesButton } from '../button/button';
import {
  AndesForm,
  injectAndesFormDisabled,
  injectAndesFormSize,
  injectAndesFormVariant,
} from './form';
import { AndesFormControl } from './form-control';
import { AndesFormField } from './form-field';
import type {
  AndesFormLabelAlign,
  AndesFormLayout,
  AndesFormRequiredMark,
  AndesFormSize,
  AndesFormVariant,
} from './form-field-tokens';
import { AndesFormLabel } from './form-label';
import { withDemoControls } from './form-field.stories';

// Native controls (see form-field.stories.ts) on purpose: the field tints status and feedback only on a direct native child, and andesFormControl wires AndesInput by hand.

/**
 * Stand-in for a control on another branch adopting the size hook: it defaults its own
 * `size` from the enclosing `andesForm` via `injectAndesFormSize()`.
 */
@Component({
  selector: 'andes-demo-size-readout',
  template: `<code
    style="font-size: 0.75rem; color: var(--andes-color-muted-foreground);"
    >injectAndesFormSize() → {{ effective() }}</code
  >`,
})
class DemoSizeReadout {
  readonly size = input<AndesFormSize | undefined>(undefined);
  private readonly formSize = injectAndesFormSize();
  protected readonly effective = computed(
    () => this.size() ?? this.formSize() ?? 'md (default)',
  );
}

/** Stand-in for a non-form control (an action button, an uploader) that follows the form's
 *  `variant` and `disabled` through the DI hooks. */
@Component({
  selector: 'andes-demo-hint-readout',
  template: `<code
    style="font-size: 0.75rem; color: var(--andes-color-muted-foreground);"
    >injectAndesFormVariant() → {{ variant() ?? 'undefined' }} ·
    injectAndesFormDisabled() → {{ disabled() }}</code
  >`,
})
class DemoHintReadout {
  protected readonly variant = injectAndesFormVariant();
  protected readonly disabled = injectAndesFormDisabled();
}

const moduleMetadata = {
  imports: [
    ReactiveFormsModule,
    AndesForm,
    AndesFormField,
    AndesFormLabel,
    AndesFormControl,
    AndesButton,
    DemoSizeReadout,
    DemoHintReadout,
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
}

const meta: Meta<FormArgs> = {
  title: 'Data Entry/Form/Layout',
  tags: ['autodocs'],
  decorators: [withDemoControls],
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
          'verdict, after async validators settle, with every failing control path) and',
          '`scrollToField(path)`.',
          '',
          '`size` does not resize anything by itself: controls opt in with',
          '`injectAndesFormSize()` (none of the unmerged andes-ng controls do yet), and it is',
          'reflected as `data-size` for plain CSS. The native controls in these stories use that',
          'attribute.',
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
  },
  args: {
    layout: 'horizontal',
    labelAlign: 'right',
    labelCol: 8,
    labelWrap: false,
    colon: true,
    requiredMark: true,
    size: undefined,
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
    ${extra}
    (ngSubmit)="form.markAllAsTouched()"
    style="max-width: 560px;"
  >
    <andes-form-field label="Full name" tooltip="As printed on your ID.">
      <input andesFormControl formControlName="name" class="andes-demo-control" />
    </andes-form-field>
    <andes-form-field label="Work email address">
      <input andesFormControl formControlName="email" type="email" class="andes-demo-control" />
    </andes-form-field>
    <andes-form-field label="Company" extra="Leave blank if you are signing up alone.">
      <input andesFormControl formControlName="company" class="andes-demo-control" />
    </andes-form-field>
    <andes-form-field label="Plan">
      <select andesFormControl formControlName="plan" class="andes-demo-control">
        <option value="free">Free</option>
        <option value="pro">Pro</option>
      </select>
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
    props: { ...args, form: signUpForm() },
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
 * the fields flow in a wrapping row, label beside control.
 */
export const Layouts: Story = {
  render: (args) => {
    const horizontal = signUpForm();
    horizontal.controls.name.markAsTouched();
    horizontal.controls.email.setValue('ada@lovelace.dev');
    horizontal.controls.email.markAsTouched();
    const fields = (extra: string) => `
      <andes-form-field label="Full name" tooltip="As printed on your ID.">
        <input andesFormControl formControlName="name" class="andes-demo-control" />
      </andes-form-field>
      <andes-form-field label="Work email address">
        <input andesFormControl formControlName="email" type="email" class="andes-demo-control" />
      </andes-form-field>
      <andes-form-field label="Company" extra="Leave blank if you are signing up alone.">
        <input andesFormControl formControlName="company" class="andes-demo-control" />
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
        <div style="display: flex; flex-direction: column; gap: 2.5rem; max-width: 560px;">
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
              <input andesFormControl formControlName="user" class="andes-demo-control" style="width: 12rem;" />
            </andes-form-field>
            <andes-form-field label="Password">
              <input andesFormControl formControlName="password" type="password" class="andes-demo-control" style="width: 12rem;" />
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
 * What a form hands down through DI. `size` cascades: the readout component calls
 * `injectAndesFormSize()`, and the native controls react to the `data-size` the form
 * reflects. Below, `disabled` disables the whole Angular form (`disable()`) and re-enables it
 * when switched off, while `variant` is a hint, like `size`: controls read both through
 * `injectAndesFormVariant()` / `injectAndesFormDisabled()` - the readout does - and plain CSS
 * can key off the reflected `data-variant` / `data-disabled`.
 */
export const Propagation: Story = {
  args: { layout: 'horizontal' },
  render: (args) => ({
    moduleMetadata,
    props: {
      ...args,
      sizes: ['sm', 'md', 'lg'],
      value: new FormControl('Ada Lovelace'),
      locked: signal(true),
      variant: 'filled' satisfies AndesFormVariant,
      form: signUpForm(),
    },
    template: `
      <div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1.5rem; max-width: 900px;">
        @for (s of sizes; track s) {
          <div andesForm [size]="s">
            <andes-form-field [label]="'size = ' + s">
              <input andesFormControl [formControl]="value" class="andes-demo-control" />
            </andes-form-field>
            <andes-demo-size-readout />
          </div>
        }
      </div>
      <label style="display: inline-flex; gap: 0.5rem; align-items: center; margin-block: 2rem 1rem; font-family: var(--andes-font-family), sans-serif; font-size: 0.875rem; color: var(--andes-color-foreground);">
        <input type="checkbox" [checked]="locked()" (change)="locked.set(!locked())" />
        Disable the form
      </label>
      <form
        andesForm
        [formGroup]="form"
        [layout]="layout"
        [labelCol]="labelCol"
        [disabled]="locked()"
        [variant]="variant"
        style="width: 100%; max-width: 560px;"
      >
        <andes-form-field label="Full name">
          <input andesFormControl formControlName="name" class="andes-demo-control" />
        </andes-form-field>
        <andes-form-field label="Work email">
          <input andesFormControl formControlName="email" class="andes-demo-control" />
        </andes-form-field>
        <andes-form-field label="Plan">
          <select andesFormControl formControlName="plan" class="andes-demo-control">
            <option value="free">Free</option>
            <option value="pro">Pro</option>
          </select>
        </andes-form-field>
        <andes-form-field>
          <andes-demo-hint-readout />
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
      <form andesForm [formGroup]="form" [requiredMark]="tag" style="max-width: 360px;">
        <andes-form-field label="Full name">
          <input andesFormControl formControlName="name" class="andes-demo-control" />
        </andes-form-field>
        <andes-form-field label="Company">
          <input andesFormControl formControlName="company" class="andes-demo-control" />
        </andes-form-field>
      </form>
    `,
  }),
};
