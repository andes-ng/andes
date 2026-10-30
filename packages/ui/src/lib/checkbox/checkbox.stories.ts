import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import type { Meta, StoryObj } from '@storybook/angular';

import { AndesInput } from '../input/input';
import { AndesCheckbox } from './checkbox';

const meta: Meta<AndesCheckbox> = {
  title: 'Data Entry/Checkbox/Basics/Field',
  component: AndesCheckbox,
  tags: ['autodocs'],
  argTypes: {
    checked: { control: 'boolean' },
    disabled: { control: 'boolean' },
    indeterminate: { control: 'boolean' },
    required: { control: 'boolean' },
    readOnly: { control: 'boolean' },
    labelPosition: { control: 'inline-radio', options: ['end', 'start'] },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    status: { control: 'select', options: [undefined, 'error', 'warning'] },
    variant: {
      control: 'inline-radio',
      options: ['default', 'card', 'button'],
    },
    name: { control: 'text' },
    value: { control: 'text' },
  },
  args: {
    checked: false,
    disabled: false,
    indeterminate: false,
    required: false,
    readOnly: false,
    labelPosition: 'end',
    size: 'md',
    variant: 'default',
  },
  render: (args) => ({
    props: args,
    template: `<andes-checkbox [checked]="checked" [disabled]="disabled" [indeterminate]="indeterminate" [required]="required" [readOnly]="readOnly" [labelPosition]="labelPosition" [size]="size" [status]="status" [variant]="variant" [name]="name" [value]="value">Accept terms and conditions</andes-checkbox>`,
  }),
};

export default meta;

type Story = StoryObj<AndesCheckbox>;

/** Playground: every input is a control. */
export const Default: Story = {};

/**
 * Every state side by side: unchecked, checked, indeterminate, disabled (each of the three),
 * read-only and invalid (`aria-invalid`). `checked` and `indeterminate` are `model()`s, which -
 * unlike `disabled`'s plain `input({ transform: booleanAttribute })` - don't support a transform
 * (a two-way binding's output must emit exactly the type its input accepts), so a bare,
 * bracket-less attribute isn't accepted for them; bind the literal with brackets instead.
 */
export const States: Story = {
  render: () => ({
    template: `
      <div style="display: flex; flex-direction: column; gap: 1rem;">
        <andes-checkbox>Unchecked</andes-checkbox>
        <andes-checkbox [checked]="true">Checked</andes-checkbox>
        <andes-checkbox [indeterminate]="true">Indeterminate</andes-checkbox>
        <andes-checkbox disabled>Disabled unchecked</andes-checkbox>
        <andes-checkbox disabled [checked]="true">Disabled checked</andes-checkbox>
        <andes-checkbox disabled [indeterminate]="true">Disabled indeterminate</andes-checkbox>
        <andes-checkbox readOnly [checked]="true">Read-only checked</andes-checkbox>
        <andes-checkbox aria-invalid="true">Invalid</andes-checkbox>
      </div>
    `,
  }),
};

/**
 * Where the label lives: after the box (default), before it with `labelPosition="start"`,
 * none at all (name it with `aria-label`), and inline within a line of text.
 */
export const Labels: Story = {
  render: () => ({
    template: `
      <div style="display: flex; flex-direction: column; gap: 1rem; align-items: flex-start;">
        <andes-checkbox>Label at the end (default)</andes-checkbox>
        <andes-checkbox labelPosition="start" [checked]="true">Label at the start</andes-checkbox>
        <andes-checkbox aria-label="Select row" />
        <p style="margin: 0; font-family: var(--andes-font-family), sans-serif; font-size: 0.875rem; line-height: 1.375rem; color: var(--andes-color-foreground);">
          Before <andes-checkbox>Inline checkbox</andes-checkbox> after, on the same text line.
        </p>
      </div>
    `,
  }),
};

/**
 * The shared control scale: a 14 / 16 / 20px box with 14px, 14px and 16px text - the same
 * steps as the Input, so a checkbox lines up with the field next to it. Each row shows the
 * unchecked, checked and indeterminate box, a wrapping label, and a Small Input for scale.
 */
export const Sizes: Story = {
  render: () => ({
    moduleMetadata: { imports: [AndesInput] },
    props: {
      rows: [
        ['sm', 'Small'],
        ['md', 'Medium (default)'],
        ['lg', 'Large'],
      ],
    },
    template: `
      <div style="display: flex; flex-direction: column; gap: 1.5rem;">
        @for (row of rows; track row[0]) {
          <div style="display: flex; gap: 1.5rem; align-items: center; flex-wrap: wrap;">
            <andes-checkbox [size]="$any(row[0])">{{ row[1] }}</andes-checkbox>
            <andes-checkbox [size]="$any(row[0])" [checked]="true">Checked</andes-checkbox>
            <andes-checkbox [size]="$any(row[0])" [indeterminate]="true">Mixed</andes-checkbox>
            <andes-input [size]="$any(row[0])" placeholder="Input, same size" aria-label="Input for scale" style="width: 12rem;" />
          </div>
        }
      </div>
    `,
  }),
};

/**
 * `status="error"` (painted AND announced through `aria-invalid`, like `aria-invalid="true"`)
 * and `status="warning"` (painted only), on the plain box, a card and a button.
 */
export const Status: Story = {
  render: () => ({
    template: `
      <div style="display: grid; grid-template-columns: repeat(3, max-content); gap: 1rem 2rem; align-items: start;">
        <andes-checkbox status="error">Error</andes-checkbox>
        <andes-checkbox status="error" [checked]="true">Error, checked</andes-checkbox>
        <andes-checkbox aria-invalid="true">aria-invalid</andes-checkbox>
        <andes-checkbox status="warning">Warning</andes-checkbox>
        <andes-checkbox status="warning" [checked]="true">Warning, checked</andes-checkbox>
        <andes-checkbox status="warning" disabled>Warning, disabled</andes-checkbox>
        <andes-checkbox variant="card" status="error">Error card</andes-checkbox>
        <andes-checkbox variant="card" status="warning" [checked]="true">Warning card</andes-checkbox>
        <andes-checkbox variant="button" status="error">Error button</andes-checkbox>
      </div>
    `,
  }),
};

/** A `FormControl` with `[formControl]` and `[(ngModel)]` in template-driven forms. */
export const Binding: Story = {
  render: () => ({
    moduleMetadata: { imports: [FormsModule, ReactiveFormsModule] },
    props: {
      control: new FormControl(false, { nonNullable: true }),
      subscribed: false,
    },
    template: `
      <div style="display: flex; flex-direction: column; gap: 0.75rem;">
        <andes-checkbox [formControl]="control">Reactive form: {{ control.value }}</andes-checkbox>
        <andes-checkbox [(ngModel)]="subscribed">Template-driven form: {{ subscribed }}</andes-checkbox>
      </div>
    `,
  }),
};
