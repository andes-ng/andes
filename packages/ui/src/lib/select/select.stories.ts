import { JsonPipe } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import type { Meta, StoryObj } from '@storybook/angular';

import { AndesSelect } from './select';
import { AndesSelectContent } from './select-content';
import { AndesSelectGroup } from './select-group';
import { AndesSelectItem } from './select-item';
import { AndesSelectLabel } from './select-label';
import { AndesSelectSeparator } from './select-separator';
import { AndesSelectTrigger } from './select-trigger';
import { AndesSelectValue } from './select-value';

const SELECT_IMPORTS = [
  JsonPipe,
  AndesSelect,
  AndesSelectContent,
  AndesSelectGroup,
  AndesSelectItem,
  AndesSelectLabel,
  AndesSelectSeparator,
  AndesSelectTrigger,
  AndesSelectValue,
];

/**
 * Every story sets `aria-label` or an `id` for a `<label for>`: `role="combobox"` takes no
 * accessible name from its own content, so a select without a label (or an
 * `aria-labelledby` pointing at a visible one) is unnamed for a screen reader.
 */
const meta: Meta<AndesSelect> = {
  title: 'Data Entry/Select/Basics/Field',
  component: AndesSelect,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    mode: { control: 'select', options: ['single', 'multiple', 'tags'] },
    variant: {
      control: 'select',
      options: ['outlined', 'filled', 'borderless', 'underlined'],
    },
    status: { control: 'select', options: [undefined, 'error', 'warning'] },
    placeholder: { control: 'text' },
    disabled: { control: 'boolean' },
    required: { control: 'boolean' },
    allowClear: { control: 'boolean' },
    loading: { control: 'boolean' },
  },
  args: {
    size: 'md',
    mode: 'single',
    variant: 'outlined',
    status: undefined,
    placeholder: 'Select a fruit',
    disabled: false,
    required: false,
    allowClear: false,
    loading: false,
  },
  render: (args) => ({
    moduleMetadata: { imports: SELECT_IMPORTS },
    props: args,
    template: `
      <div style="width: 260px;">
        <andes-select
          aria-label="Fruit"
          [size]="size"
          [mode]="mode"
          [variant]="variant"
          [status]="status"
          [placeholder]="placeholder"
          [disabled]="disabled"
          [required]="required"
          [allowClear]="allowClear"
          [loading]="loading"
        >
          <andes-select-trigger>
            <andes-select-value />
          </andes-select-trigger>
          <andes-select-content>
            <andes-select-item value="apple">Apple</andes-select-item>
            <andes-select-item value="apricot">Apricot</andes-select-item>
            <andes-select-item value="banana">Banana</andes-select-item>
            <andes-select-item value="cherry">Cherry</andes-select-item>
          </andes-select-content>
        </andes-select>
      </div>
    `,
  }),
};

export default meta;

type Story = StoryObj<AndesSelect>;

const FRUITS = [
  { value: 'apple', label: 'Apple' },
  { value: 'apricot', label: 'Apricot' },
  { value: 'banana', label: 'Banana' },
  { value: 'blueberry', label: 'Blueberry' },
  { value: 'cherry', label: 'Cherry' },
  { value: 'durian', label: 'Durian', disabled: true },
  { value: 'grape', label: 'Grape' },
  { value: 'kiwi', label: 'Kiwi' },
];

const note = (text: string) =>
  `<p style="margin: 0.5rem 0 0; font: 0.75rem/1.25rem var(--andes-font-family), sans-serif; color: var(--andes-color-muted-foreground);">${text}</p>`;

export const Default: Story = {};

/** The three sizes, side by side. */
export const Sizes: Story = {
  render: () => ({
    moduleMetadata: { imports: SELECT_IMPORTS },
    props: { fruits: FRUITS },
    template: `
      <div style="display: flex; flex-direction: column; gap: 1rem; width: 260px;">
        <andes-select aria-label="Fruit (small)" size="sm" placeholder="Small" [options]="fruits" />
        <andes-select aria-label="Fruit (medium)" size="md" placeholder="Medium" [options]="fruits" />
        <andes-select aria-label="Fruit (large)" size="lg" placeholder="Large" [options]="fruits" />
      </div>
    `,
  }),
};

/** The four variants, each as a single select (left) and a multiple one (right). */
export const Variants: Story = {
  render: () => ({
    moduleMetadata: { imports: SELECT_IMPORTS },
    props: {
      fruits: FRUITS,
      variants: ['outlined', 'filled', 'borderless', 'underlined'],
    },
    template: `
      <div style="display: grid; grid-template-columns: 260px 260px; gap: 1rem;">
        @for (variant of variants; track variant) {
          <andes-select [aria-label]="variant" [variant]="variant" [placeholder]="variant" [options]="fruits" />
          <andes-select [aria-label]="variant + ' multiple'" mode="multiple" [variant]="variant"
            [value]="['apple', 'kiwi']" [options]="fruits" />
        }
      </div>
    `,
  }),
};

/**
 * The resting states of the field: with a value, `disabled`, `required` and
 * `aria-invalid`. Each one is named by `aria-label` since `role="combobox"` takes no
 * accessible name from its own content.
 */
export const States: Story = {
  render: () => ({
    moduleMetadata: { imports: SELECT_IMPORTS },
    props: { fruits: FRUITS },
    template: `
      <div style="display: flex; flex-direction: column; gap: 1rem; width: 260px;">
        <andes-select aria-label="Fruit (with value)" value="banana" [options]="fruits" />
        <andes-select aria-label="Fruit (disabled)" disabled value="banana" [options]="fruits" />
        <andes-select aria-label="Fruit (required)" required placeholder="Required" [options]="fruits" />
        <andes-select aria-label="Fruit (invalid)" aria-invalid="true" placeholder="Invalid" [options]="fruits" />
      </div>
    `,
  }),
};

/** `status` paints the field as an error or a warning. */
export const Status: Story = {
  render: () => ({
    moduleMetadata: { imports: SELECT_IMPORTS },
    props: { fruits: FRUITS },
    template: `
      <div style="display: flex; flex-direction: column; gap: 1rem; width: 260px;">
        <andes-select aria-label="Fruit (error)" status="error" placeholder="Error" [options]="fruits" />
        <andes-select aria-label="Fruit (warning)" status="warning" placeholder="Warning" [options]="fruits" />
      </div>
    `,
  }),
};

/**
 * `id` lands on the focusable combobox - the button, or the search input with
 * `showSearch` - so the `<label for>` names it and focuses it when clicked.
 */
export const WithLabel: Story = {
  render: () => ({
    moduleMetadata: { imports: SELECT_IMPORTS },
    props: { fruits: FRUITS },
    template: `
      <div style="display: flex; flex-direction: column; gap: 1rem; width: 260px;">
        <div>
          <label for="fruit-select" style="display: block; font-size: 0.875rem; margin-bottom: 0.25rem;">Fruit</label>
          <andes-select id="fruit-select" placeholder="Select a fruit" [options]="fruits" />
        </div>
        <div>
          <label for="fruit-search" style="display: block; font-size: 0.875rem; margin-bottom: 0.25rem;">Fruit (searchable)</label>
          <andes-select id="fruit-search" placeholder="Search a fruit" showSearch [options]="fruits" />
        </div>
      </div>
    `,
  }),
};

/**
 * Three ways to bind a value: a reactive `FormControl` (value and `touched` shown below),
 * object values compared with `compareWith`, and `labelInValue`, which emits
 * `{ value, label }` objects and labels written values whose options are not loaded.
 */
export const Binding: Story = {
  render: () => ({
    moduleMetadata: { imports: [...SELECT_IMPORTS, ReactiveFormsModule] },
    props: {
      fruits: FRUITS,
      fruitControl: new FormControl<string | null>('cherry'),
      labelControl: new FormControl({
        value: 'mango',
        label: 'Mango (from server)',
      }),
      users: [
        { id: 1, name: 'Ada Lovelace' },
        { id: 2, name: 'Grace Hopper' },
        { id: 3, name: 'Alan Turing' },
      ],
      assignee: { id: 2, name: 'Grace Hopper' },
      compareById: (a: unknown, b: unknown) =>
        (a as { id: number } | null)?.id === (b as { id: number } | null)?.id,
    },
    template: `
      <div style="width: 260px; display: flex; flex-direction: column; gap: 1.25rem;">
        <div>
          <andes-select aria-label="Fruit (reactive form)" placeholder="Select a fruit" [options]="fruits"
            [formControl]="fruitControl" />
          ${note('value: <code>{{ fruitControl.value }}</code> · touched: {{ fruitControl.touched }}')}
        </div>
        <div>
          <andes-select aria-label="Assignee (object values)" placeholder="Select an assignee"
            [value]="assignee" [compareWith]="compareById">
            <andes-select-trigger>
              <andes-select-value />
            </andes-select-trigger>
            <andes-select-content>
              @for (user of users; track user.id) {
                <andes-select-item [value]="user">{{ user.name }}</andes-select-item>
              }
            </andes-select-content>
          </andes-select>
          ${note('Option values are objects; <code>compareWith</code> matches them by id.')}
        </div>
        <div>
          <andes-select aria-label="Fruit (labelInValue)" labelInValue [options]="fruits" [formControl]="labelControl" />
          ${note('value: {{ labelControl.value | json }}')}
        </div>
      </div>
    `,
  }),
};

/**
 * `allowClear` swaps the chevron for a clear button on hover or focus; Tab reaches it from
 * the keyboard and Backspace clears too. The button is the same at every size - a small
 * muted disc in the chevron's place, named by `clearLabel`.
 */
export const ClearButton: Story = {
  render: () => ({
    moduleMetadata: { imports: SELECT_IMPORTS },
    props: { fruits: FRUITS },
    template: `
      <div style="display: flex; flex-direction: column; gap: 1rem; width: 260px;">
        <andes-select aria-label="Small" size="sm" allowClear value="banana" [options]="fruits" />
        <andes-select aria-label="Medium" allowClear value="banana" [options]="fruits" />
        <andes-select aria-label="Large" size="lg" allowClear value="banana" [options]="fruits" />
        <andes-select aria-label="Localized" allowClear clearLabel="Borrar" value="banana" [options]="fruits" />
        ${note('Hover or focus a field to reveal the clear button.')}
      </div>
    `,
  }),
};
