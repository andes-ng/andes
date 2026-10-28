import { FormsModule } from '@angular/forms';
import type { Meta, StoryObj } from '@storybook/angular';

import { AndesInput } from './input';

const meta: Meta<AndesInput> = {
  title: 'Input/Field',
  component: AndesInput,
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: 'select',
      options: ['text', 'email', 'password', 'number', 'search', 'tel', 'url'],
    },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    variant: {
      control: 'select',
      options: ['outlined', 'filled', 'borderless', 'underlined'],
    },
    status: { control: 'select', options: [undefined, 'error', 'warning'] },
    disabled: { control: 'boolean' },
    required: { control: 'boolean' },
    readOnly: { control: 'boolean' },
    clearable: { control: 'boolean' },
    showCount: { control: 'boolean' },
    maxLength: { control: 'number' },
    addonBefore: { control: 'text' },
    addonAfter: { control: 'text' },
    placeholder: { control: 'text' },
  },
  args: {
    type: 'text',
    size: 'md',
    variant: 'outlined',
    status: undefined,
    disabled: false,
    required: false,
    readOnly: false,
    clearable: false,
    showCount: false,
    maxLength: undefined,
    addonBefore: undefined,
    addonAfter: undefined,
    placeholder: 'Enter some text…',
  },
  render: (args) => ({
    props: args,
    template: `<andes-input aria-label="Example input" [type]="type" [size]="size" [variant]="variant" [status]="status" [disabled]="disabled" [required]="required" [readOnly]="readOnly" [clearable]="clearable" [showCount]="showCount" [maxLength]="maxLength" [addonBefore]="addonBefore" [addonAfter]="addonAfter" [placeholder]="placeholder" />`,
  }),
};

export default meta;

type Story = StoryObj<AndesInput>;

export const Default: Story = {};

export const Sizes: Story = {
  render: () => ({
    template: `
      <div style="display: flex; flex-direction: column; gap: 1rem; width: 20rem;">
        <andes-input aria-label="Small" size="sm" placeholder="Small" />
        <andes-input aria-label="Medium" size="md" placeholder="Medium" />
        <andes-input aria-label="Large" size="lg" placeholder="Large" />
      </div>
    `,
  }),
};

export const Variants: Story = {
  render: () => ({
    template: `
      <div style="display: flex; flex-direction: column; gap: 1rem; width: 20rem;">
        <andes-input aria-label="Outlined" variant="outlined" placeholder="Outlined" />
        <andes-input aria-label="Filled" variant="filled" placeholder="Filled" />
        <andes-input aria-label="Borderless" variant="borderless" placeholder="Borderless" />
        <andes-input aria-label="Underlined" variant="underlined" placeholder="Underlined" />
      </div>
    `,
  }),
};

/** Types that change the keyboard, the browser's validation and autofill. The field itself looks the same. */
export const Types: Story = {
  render: () => ({
    template: `
      <div style="display: flex; flex-direction: column; gap: 1rem; width: 20rem;">
        <andes-input aria-label="Text" type="text" placeholder="Text" />
        <andes-input type="email" placeholder="Email" />
        <andes-input type="password" placeholder="Password" />
        <andes-input type="number" placeholder="Number" />
        <andes-input type="search" placeholder="Search" clearable />
        <andes-input type="tel" placeholder="Phone" />
        <andes-input type="url" placeholder="URL" />
      </div>
    `,
  }),
};

export const States: Story = {
  render: () => ({
    moduleMetadata: { imports: [FormsModule] },
    // Bound under a name distinct from AndesInput's own `value` model input -
    // Storybook's Angular renderer forwards story props onto any matching
    // property of a `meta.component` instance it finds in the rendered tree.
    props: { readOnlyValue: 'Read-only value' },
    template: `
      <div style="display: flex; flex-direction: column; gap: 1rem; width: 20rem;">
        <andes-input aria-label="Disabled" disabled placeholder="Disabled" />
        <andes-input aria-label="Read-only" readOnly [(ngModel)]="readOnlyValue" placeholder="Read-only" />
      </div>
    `,
  }),
};

/**
 * Colour and message together: `status` paints the border and sets `aria-invalid`, and the
 * message is tied to the field with `aria-describedby`.
 */
export const Status: Story = {
  render: () => ({
    template: `
      <div style="display: flex; flex-direction: column; gap: 1.5rem; width: 20rem;">
        <div style="display: flex; flex-direction: column; gap: 1rem;">
          <andes-input aria-label="Error" status="error" placeholder="Error (also sets aria-invalid)" />
          <andes-input aria-label="Warning" status="warning" placeholder="Warning" />
          <andes-input aria-label="Error, filled" status="error" variant="filled" placeholder="Error, filled" />
          <andes-input aria-label="Warning, underlined" status="warning" variant="underlined" placeholder="Warning, underlined" />
        </div>
        <div style="display: flex; flex-direction: column; gap: 0.375rem;">
          <label for="invalid-email" style="font-size: 0.875rem; font-weight: 500;">Email address</label>
          <andes-input id="invalid-email" type="email" status="error" aria-describedby="email-error" placeholder="you@example.com" />
          <span id="email-error" style="color: var(--andes-color-danger); font-size: 0.75rem; line-height: 1.25rem;">
            Please enter a valid email address.
          </span>
        </div>
      </div>
    `,
  }),
};

/**
 * `required` puts the native `required` attribute on the field, which assistive technology
 * announces and the browser validates. The red asterisk is not drawn by the field: it belongs to
 * the label, so each form decides where it goes. `AndesFormLabel` inside an `AndesFormField`
 * adds it by itself from the control's required state; with a plain `<label>` it is markup like
 * the one below (hidden from assistive technology, which already hears "required").
 */
export const Required: Story = {
  render: () => ({
    template: `
      <div style="display: flex; flex-direction: column; gap: 0.375rem; width: 20rem;">
        <label for="required-name" style="font-size: 0.875rem; font-weight: 500;">
          Full name
          <span aria-hidden="true" style="color: var(--andes-color-danger); margin-inline-start: 0.125rem;">*</span>
        </label>
        <andes-input id="required-name" required placeholder="This field is required" />
        <span style="color: var(--andes-color-muted-foreground); font-size: 0.75rem; line-height: 1.25rem;">
          This field must be filled out.
        </span>
      </div>
    `,
  }),
};

export const TextAlign: Story = {
  render: () => ({
    template: `
      <div style="display: flex; flex-direction: column; gap: 1rem; width: 16rem;">
        <andes-input aria-label="Amount" value="1,250.00" style="--andes-input-text-align: end;">
          <span slot="prefix">S/</span>
        </andes-input>
        <andes-input aria-label="Code" value="A-104" style="--andes-input-text-align: center;" />
      </div>
    `,
  }),
};
