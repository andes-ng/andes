import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import type { Meta, StoryObj } from '@storybook/angular';

import { AndesTextarea } from './textarea';

const meta: Meta<AndesTextarea> = {
  title: 'Data Entry/Input/Textarea/Basics/Field',
  component: AndesTextarea,
  tags: ['autodocs'],
  argTypes: {
    value: { control: 'text' },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    variant: {
      control: 'select',
      options: ['outlined', 'filled', 'borderless', 'underlined'],
    },
    status: { control: 'select', options: [undefined, 'error', 'warning'] },
    disabled: { control: 'boolean' },
    readonly: { control: 'boolean' },
    required: { control: 'boolean' },
    clearable: { control: 'boolean' },
    placeholder: { control: 'text' },
    rows: { control: 'number' },
    maxLength: { control: 'number' },
    countMax: { control: 'number' },
    showCount: { control: 'boolean' },
    resize: {
      control: 'select',
      options: ['none', 'vertical', 'horizontal', 'both'],
    },
    autoSize: { control: 'object' },
  },
  args: {
    value: '',
    size: 'md',
    variant: 'outlined',
    disabled: false,
    readonly: false,
    required: false,
    clearable: false,
    placeholder: 'Type your message…',
    rows: 3,
    showCount: false,
    resize: 'vertical',
    autoSize: false,
  },
  render: (args) => ({
    props: args,
    template: `<div style="width: 320px;">
      <andes-textarea
        [(value)]="value"
        [size]="size"
        [variant]="variant"
        [status]="status"
        [disabled]="disabled"
        [readonly]="readonly"
        [required]="required"
        [clearable]="clearable"
        [placeholder]="placeholder"
        [rows]="rows"
        [maxLength]="maxLength"
        [countMax]="countMax"
        [showCount]="showCount"
        [resize]="resize"
        [autoSize]="autoSize"
        aria-label="Message"
      />
    </div>`,
  }),
};

export default meta;

type Story = StoryObj<AndesTextarea>;

export const Overview: Story = {};

/** The three sizes; the typed text follows the size. */
export const Sizes: Story = {
  render: () => ({
    template: `<div style="display: flex; flex-direction: column; gap: 1rem; width: 320px;">
      <andes-textarea size="sm" [rows]="2" aria-label="Small" value="Small - typed text follows the size" />
      <andes-textarea size="md" [rows]="2" aria-label="Medium" value="Medium - typed text follows the size" />
      <andes-textarea size="lg" [rows]="2" aria-label="Large" value="Large - typed text follows the size" />
    </div>`,
  }),
};

export const Variants: Story = {
  render: () => ({
    template: `<div style="display: flex; flex-direction: column; gap: 1rem; width: 320px;">
      <andes-textarea variant="outlined" [rows]="2" aria-label="Outlined" placeholder="Outlined (default)" />
      <andes-textarea variant="filled" [rows]="2" aria-label="Filled" placeholder="Filled" />
      <andes-textarea variant="borderless" [rows]="2" aria-label="Borderless" placeholder="Borderless" />
      <andes-textarea variant="underlined" [rows]="2" aria-label="Underlined" placeholder="Underlined" />
    </div>`,
  }),
};

/**
 * `status` colors the field (and sets `aria-invalid` for `error`) on every variant. The last
 * field shows the manual route: set `aria-invalid` and point `aria-describedby` at your own
 * message.
 */
export const Status: Story = {
  render: () => ({
    template: `<div style="display: flex; flex-direction: column; gap: 1rem; width: 320px;">
      <andes-textarea status="error" [rows]="2" aria-label="Error" value="status=error (also sets aria-invalid)" />
      <andes-textarea status="warning" [rows]="2" aria-label="Warning" value="status=warning" />
      <andes-textarea variant="filled" status="error" [rows]="2" aria-label="Filled error" value="filled + error" />
      <andes-textarea variant="underlined" status="warning" [rows]="2" aria-label="Underlined warning" value="underlined + warning" />
      <div>
        <andes-textarea [rows]="2" aria-label="Message" aria-invalid="true" aria-describedby="textarea-error" />
        <p id="textarea-error" style="font-family: var(--andes-font-family), sans-serif; color: var(--andes-color-danger-text, var(--andes-color-danger)); font-size: 0.75rem; line-height: 1.25rem; margin: 0.25rem 0 0;">This field is required.</p>
      </div>
    </div>`,
  }),
};

/** Disabled, read-only and required, side by side. */
export const States: Story = {
  render: () => ({
    template: `<div style="display: flex; flex-direction: column; gap: 1rem; width: 320px;">
      <andes-textarea disabled [rows]="2" aria-label="Disabled" placeholder="Can’t type here" />
      <andes-textarea readonly [rows]="2" aria-label="Read only" value="This value can't be edited." />
      <div>
        <label for="required-textarea" style="display: block; font-family: var(--andes-font-family), sans-serif; font-size: 0.875rem; color: var(--andes-color-foreground); margin-bottom: 0.25rem;">Message <span aria-hidden="true">*</span></label>
        <andes-textarea id="required-textarea" required [rows]="2" placeholder="Required field" />
      </div>
    </div>`,
  }),
};

/** The three ways to bind the value: `[(ngModel)]`, a `FormControl` and the `[(value)]` model. */
export const Binding: Story = {
  render: () => ({
    moduleMetadata: { imports: [FormsModule, ReactiveFormsModule] },
    props: {
      modelText: 'Bound with [(ngModel)]',
      control: new FormControl('Bound with a FormControl'),
      twoWayText: 'Bound with [(value)]',
    },
    template: `<div style="display: flex; flex-direction: column; gap: 1rem; width: 320px;">
      <div>
        <andes-textarea [(ngModel)]="modelText" [rows]="2" aria-label="ngModel" />
        <p style="font-family: var(--andes-font-family), sans-serif; font-size: 0.75rem; line-height: 1.25rem; color: var(--andes-color-muted-foreground); margin: 0.5rem 0 0;">ngModel: {{ modelText }}</p>
      </div>
      <div>
        <andes-textarea [formControl]="control" [rows]="2" aria-label="Reactive form" />
        <p style="font-family: var(--andes-font-family), sans-serif; font-size: 0.75rem; line-height: 1.25rem; color: var(--andes-color-muted-foreground); margin: 0.5rem 0 0;">Form control: {{ control.value }}</p>
      </div>
      <div>
        <andes-textarea [(value)]="twoWayText" [rows]="2" aria-label="Two-way value" />
        <p style="font-family: var(--andes-font-family), sans-serif; font-size: 0.75rem; line-height: 1.25rem; color: var(--andes-color-muted-foreground); margin: 0.5rem 0 0;">value: {{ twoWayText }}</p>
      </div>
    </div>`,
  }),
};

export const ResizeModes: Story = {
  render: () => ({
    template: `
      <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
        <div style="width: 220px;">
          <p style="font-family: var(--andes-font-family), sans-serif; font-size: 0.875rem; color: var(--andes-color-foreground); margin: 0 0 0.25rem;">none</p>
          <andes-textarea resize="none" aria-label="Resize none" placeholder="none" />
        </div>
        <div style="width: 220px;">
          <p style="font-family: var(--andes-font-family), sans-serif; font-size: 0.875rem; color: var(--andes-color-foreground); margin: 0 0 0.25rem;">vertical (default)</p>
          <andes-textarea resize="vertical" aria-label="Resize vertical" placeholder="vertical" />
        </div>
        <div style="width: 220px;">
          <p style="font-family: var(--andes-font-family), sans-serif; font-size: 0.875rem; color: var(--andes-color-foreground); margin: 0 0 0.25rem;">horizontal</p>
          <andes-textarea resize="horizontal" aria-label="Resize horizontal" placeholder="horizontal" />
        </div>
        <div style="width: 220px;">
          <p style="font-family: var(--andes-font-family), sans-serif; font-size: 0.875rem; color: var(--andes-color-foreground); margin: 0 0 0.25rem;">both</p>
          <andes-textarea resize="both" aria-label="Resize both" placeholder="both" />
        </div>
      </div>
    `,
  }),
};

/**
 * `autoSize` grows the field with its content: without a bound it grows forever, with
 * `{ minRows, maxRows }` it starts at the minimum and scrolls past the maximum.
 */
export const AutoSize: Story = {
  render: () => ({
    template: `<div style="display: flex; flex-direction: column; gap: 1rem; width: 320px;">
      <andes-textarea autoSize [rows]="1" aria-label="Unbounded" placeholder="Grows with every line, without limit…" />
      <andes-textarea [autoSize]="{ minRows: 2, maxRows: 6 }" aria-label="Bounded" placeholder="Starts at 2 rows, scrolls past 6…" />
    </div>`,
  }),
};
