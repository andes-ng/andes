import { JsonPipe } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import type { Meta, StoryObj } from '@storybook/angular';

import { AndesCheckbox } from './checkbox';
import { AndesCheckboxGroup } from './checkbox-group';
import { AndesCheckboxSelectAll } from './checkbox-select-all';
import { AndesCheckboxOptionLabel } from './checkbox-option-label';

const meta: Meta<AndesCheckboxGroup> = {
  title: 'Data Entry/CheckboxGroup',
  component: AndesCheckboxGroup,
  tags: ['autodocs'],
  argTypes: {
    disabled: { control: 'boolean' },
    orientation: { control: 'select', options: ['vertical', 'horizontal'] },
  },
  args: {
    disabled: false,
    orientation: 'vertical',
  },
  render: (args) => ({
    moduleMetadata: { imports: [AndesCheckbox, AndesCheckboxSelectAll] },
    props: args,
    template: `
      <andes-checkbox-group aria-label="Fruits" [disabled]="disabled" [orientation]="orientation">
        <andes-checkbox value="apple">Apple</andes-checkbox>
        <andes-checkbox value="banana">Banana</andes-checkbox>
        <andes-checkbox value="cherry">Cherry</andes-checkbox>
      </andes-checkbox-group>
    `,
  }),
};

export default meta;

type Story = StoryObj<AndesCheckboxGroup>;

export const Default: Story = {};

/**
 * Layout: horizontal orientation, and a fully custom one - items can sit at any depth inside
 * the group, so the group's own flex layout can be replaced by any wrapper (here a three-column
 * grid).
 */
export const Layouts: Story = {
  render: () => ({
    moduleMetadata: { imports: [AndesCheckbox] },
    props: { letters: ['a', 'c'] as readonly string[] },
    template: `
      <div style="display: flex; flex-direction: column; gap: 2rem;">
        <andes-checkbox-group aria-label="Fruits (horizontal)" orientation="horizontal">
          <andes-checkbox value="apple">Apple</andes-checkbox>
          <andes-checkbox value="banana">Banana</andes-checkbox>
          <andes-checkbox value="cherry">Cherry</andes-checkbox>
        </andes-checkbox-group>
        <andes-checkbox-group aria-label="Letters (grid)" [(value)]="letters">
          <div style="display: grid; grid-template-columns: repeat(3, minmax(0, 8rem)); gap: var(--andes-space-3);">
            <andes-checkbox value="a">A</andes-checkbox>
            <andes-checkbox value="b">B</andes-checkbox>
            <andes-checkbox value="c">C</andes-checkbox>
            <andes-checkbox value="d">D</andes-checkbox>
            <andes-checkbox value="e">E</andes-checkbox>
          </div>
        </andes-checkbox-group>
      </div>
    `,
  }),
};

/** A disabled group, and one disabled item inside an enabled group (select all skips it). */
export const States: Story = {
  render: () => ({
    moduleMetadata: { imports: [AndesCheckbox, AndesCheckboxSelectAll] },
    props: { picked: [] as readonly string[] },
    template: `
      <div style="display: flex; flex-direction: column; gap: 2rem;">
        <andes-checkbox-group aria-label="Fruits (disabled)" disabled>
          <andes-checkbox value="apple">Apple</andes-checkbox>
          <andes-checkbox value="banana">Banana</andes-checkbox>
          <andes-checkbox value="cherry">Cherry</andes-checkbox>
        </andes-checkbox-group>
        <andes-checkbox-group aria-label="Fruits (one disabled)" [(value)]="picked">
          <andes-checkbox andesSelectAll>Select all</andes-checkbox>
          <andes-checkbox value="apple">Apple</andes-checkbox>
          <andes-checkbox value="banana" disabled>Banana (unavailable)</andes-checkbox>
          <andes-checkbox value="cherry">Cherry</andes-checkbox>
        </andes-checkbox-group>
      </div>
    `,
  }),
};

/** A preselected `[(value)]` model, and a `FormControl` with the selection echoed. */
export const Binding: Story = {
  render: () => ({
    moduleMetadata: {
      imports: [AndesCheckbox, AndesCheckboxSelectAll, ReactiveFormsModule],
    },
    props: {
      picked: ['banana'] as readonly string[],
      control: new FormControl<readonly string[]>(['apple'], {
        nonNullable: true,
      }),
    },
    template: `
      <div style="display: flex; flex-direction: column; gap: 2rem;">
        <andes-checkbox-group aria-label="Fruits (value)" [(value)]="picked">
          <andes-checkbox value="apple">Apple</andes-checkbox>
          <andes-checkbox value="banana">Banana</andes-checkbox>
          <andes-checkbox value="cherry">Cherry</andes-checkbox>
        </andes-checkbox-group>
        <div>
          <andes-checkbox-group aria-label="Fruits (reactive)" [formControl]="control">
            <andes-checkbox andesSelectAll>Select all</andes-checkbox>
            <andes-checkbox value="apple">Apple</andes-checkbox>
            <andes-checkbox value="banana">Banana</andes-checkbox>
            <andes-checkbox value="cherry">Cherry</andes-checkbox>
          </andes-checkbox-group>
          <p style="font-family: var(--andes-font-family), sans-serif; font-size: 0.875rem; line-height: 1.375rem; margin-top: 1rem;">
            Control value: {{ control.value.join(', ') || 'none' }}
          </p>
        </div>
      </div>
    `,
  }),
};

/**
 * `andesSelectAll` on a checkbox makes it check every enabled item: nothing selected, some
 * selected (it turns indeterminate), and combined with generated `options`, where the projected
 * content renders before the options so select-all sits on top.
 */
export const SelectAll: Story = {
  render: () => ({
    moduleMetadata: { imports: [AndesCheckbox, AndesCheckboxSelectAll] },
    props: {
      none: [] as readonly string[],
      some: ['apple'] as readonly string[],
      generated: ['apple'] as readonly string[],
      fruitOptions: [
        { label: 'Apple', value: 'apple' },
        { label: 'Banana', value: 'banana', disabled: true },
        { label: 'Cherry', value: 'cherry' },
      ],
    },
    template: `
      <div style="display: flex; gap: 3rem; flex-wrap: wrap; align-items: flex-start;">
        <div>
          <andes-checkbox-group aria-label="Fruits (none selected)" [(value)]="none">
            <andes-checkbox andesSelectAll>Select all</andes-checkbox>
            <andes-checkbox value="apple">Apple</andes-checkbox>
            <andes-checkbox value="banana">Banana</andes-checkbox>
            <andes-checkbox value="cherry">Cherry</andes-checkbox>
          </andes-checkbox-group>
          <p style="font-family: var(--andes-font-family), sans-serif; font-size: 0.875rem; line-height: 1.375rem; margin-top: 1rem;">
            Selected: {{ none.length ? none.join(', ') : 'none' }}
          </p>
        </div>
        <andes-checkbox-group aria-label="Fruits (partially selected)" [(value)]="some">
          <andes-checkbox andesSelectAll>Select all (indeterminate)</andes-checkbox>
          <andes-checkbox value="apple">Apple</andes-checkbox>
          <andes-checkbox value="banana">Banana</andes-checkbox>
          <andes-checkbox value="cherry">Cherry</andes-checkbox>
        </andes-checkbox-group>
        <div>
          <andes-checkbox-group aria-label="Fruits (options)" [options]="fruitOptions" [(value)]="generated">
            <andes-checkbox andesSelectAll>Select all</andes-checkbox>
          </andes-checkbox-group>
          <p style="font-family: var(--andes-font-family), sans-serif; font-size: 0.875rem; line-height: 1.375rem; margin-top: 1rem;">
            Selected: {{ generated.length ? generated.join(', ') : 'none' }}
          </p>
        </div>
      </div>
    `,
  }),
};

/**
 * Generate the items from data: bare strings, `{ label, value, disabled, title }` objects,
 * numbers (which stay numbers: the selection reads `[2, 4]`, not `['2', '4']`) and per-option
 * `className` and `style`.
 */
export const Options: Story = {
  render: () => ({
    moduleMetadata: { imports: [JsonPipe] },
    props: {
      fruits: ['Apple', 'Banana', 'Cherry'],
      fruitValue: ['Banana'] as readonly string[],
      objects: [
        { label: 'Apple', value: 'apple' },
        { label: 'Banana', value: 'banana', disabled: true, title: 'Sold out' },
        { label: 'Cherry', value: 'cherry' },
      ],
      objectValue: [] as readonly string[],
      floors: [1, 2, 3, 4],
      floorValue: [2, 4] as readonly number[],
      extras: [
        { label: 'Standard', value: 'standard' },
        {
          label: 'Express (+$5)',
          value: 'express',
          style: { 'font-weight': 600 },
        },
        {
          label: 'Gift wrap',
          value: 'gift',
          className: 'gift-option',
          style: {
            padding: '0.25rem 0.5rem',
            'border-radius': 'var(--andes-radius-sm)',
            background: 'var(--andes-color-muted)',
          },
        },
      ],
      extraValue: [] as readonly string[],
    },
    template: `
      <div style="display: flex; flex-direction: column; gap: 1.5rem;">
        <andes-checkbox-group aria-label="Fruits (strings)" [options]="fruits" [(value)]="fruitValue" />
        <andes-checkbox-group aria-label="Fruits (objects)" orientation="horizontal" [options]="objects" [(value)]="objectValue" />
        <andes-checkbox-group aria-label="Floors (numbers)" orientation="horizontal" [options]="floors" [(value)]="floorValue" />
        <andes-checkbox-group aria-label="Delivery extras" [options]="extras" [(value)]="extraValue" />
        <p style="font-family: var(--andes-font-family), sans-serif; font-size: 0.875rem; line-height: 1.375rem; color: var(--andes-color-foreground); margin: 0;">
          Strings: {{ fruitValue.join(', ') || 'none' }} - objects: {{ objectValue.join(', ') || 'none' }} - floors: {{ floorValue | json }} - extras: {{ extraValue.join(', ') || 'none' }}
        </p>
      </div>
    `,
  }),
};

const selectedText = `
  <p style="font-family: var(--andes-font-family), sans-serif; font-size: 0.875rem; line-height: 1.375rem; color: var(--andes-color-foreground); margin-top: 1rem;">
    Selected: {{ value.length ? value.join(', ') : 'none' }}
  </p>
`;

export const OptionLabelTemplate: Story = {
  name: 'Options with a label template',
  render: () => ({
    moduleMetadata: { imports: [AndesCheckboxOptionLabel] },
    props: {
      options: [
        { label: 'Starter', value: 'starter' },
        { label: 'Pro', value: 'pro' },
        { label: 'Enterprise', value: 'enterprise' },
      ],
      value: [] as readonly string[],
    },
    template: `
      <andes-checkbox-group aria-label="Plans" [options]="options" [(value)]="value">
        <ng-template andesCheckboxOptionLabel let-option let-i="index">
          <strong>{{ option.label }}</strong>
          <span style="color: var(--andes-color-muted-foreground);"> - tier {{ i + 1 }}</span>
        </ng-template>
      </andes-checkbox-group>
      ${selectedText}
    `,
  }),
};

export const ChangeEvent: Story = {
  name: 'Change event + name',
  render: () => ({
    props: {
      options: ['Apple', 'Banana', 'Cherry'],
      value: [] as readonly string[],
      last: 'none yet',
    },
    // `(changed)` fires only for user changes, with the selected values array. `name` lands on
    // every rendered input, so a native form post sends `fruit=Apple&fruit=Cherry`.
    template: `
      <andes-checkbox-group
        aria-label="Fruits"
        name="fruit"
        [options]="options"
        [(value)]="value"
        (changed)="last = '[' + $event.join(', ') + ']'"
      />
      <p style="font-family: var(--andes-font-family), sans-serif; font-size: 0.875rem; line-height: 1.375rem; color: var(--andes-color-foreground); margin-top: 1rem;">
        Last change: {{ last }}
      </p>
    `,
  }),
};

export const SkipGroup: Story = {
  name: 'skipGroup',
  render: () => ({
    moduleMetadata: { imports: [AndesCheckbox, AndesCheckboxSelectAll] },
    props: { value: [] as readonly string[], notify: false },
    template: `
      <andes-checkbox-group aria-label="Fruits" [(value)]="value">
        <andes-checkbox andesSelectAll>Select all</andes-checkbox>
        <andes-checkbox value="apple">Apple</andes-checkbox>
        <andes-checkbox value="banana">Banana</andes-checkbox>
        <andes-checkbox value="notify" skipGroup [(checked)]="notify">Notify me about new fruit (not part of the group)</andes-checkbox>
      </andes-checkbox-group>
      <p style="font-family: var(--andes-font-family), sans-serif; font-size: 0.875rem; line-height: 1.375rem; color: var(--andes-color-foreground); margin-top: 1rem;">
        Selected: {{ value.length ? value.join(', ') : 'none' }} - notify: {{ notify }}
      </p>
    `,
  }),
};
