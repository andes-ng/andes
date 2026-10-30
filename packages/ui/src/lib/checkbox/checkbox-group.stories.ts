import { JsonPipe } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import type { Meta, StoryObj } from '@storybook/angular';

import { AndesCheckbox } from './checkbox';
import { AndesCheckboxGroup } from './checkbox-group';
import { AndesCheckboxSelectAll } from './checkbox-select-all';

const meta: Meta<AndesCheckboxGroup> = {
  title: 'Data Entry/CheckboxGroup/Basics/Field',
  component: AndesCheckboxGroup,
  tags: ['autodocs'],
  argTypes: {
    disabled: { control: 'boolean' },
    readOnly: { control: 'boolean' },
    required: { control: 'boolean' },
    orientation: { control: 'select', options: ['vertical', 'horizontal'] },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    status: { control: 'select', options: [undefined, 'error', 'warning'] },
    variant: {
      control: 'inline-radio',
      options: ['default', 'card', 'button'],
    },
    columns: { control: 'number' },
    minCount: { control: 'number' },
    maxCount: { control: 'number' },
  },
  args: {
    disabled: false,
    readOnly: false,
    required: false,
    orientation: 'vertical',
    size: 'md',
    variant: 'default',
  },
  render: (args) => ({
    moduleMetadata: { imports: [AndesCheckbox, AndesCheckboxSelectAll] },
    props: args,
    template: `
      <andes-checkbox-group
        aria-label="Fruits"
        [disabled]="disabled"
        [readOnly]="readOnly"
        [required]="required"
        [orientation]="orientation"
        [size]="size"
        [status]="status"
        [variant]="variant"
        [columns]="columns"
        [minCount]="minCount"
        [maxCount]="maxCount"
      >
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

/**
 * `columns` lays the items out in a grid of N equal columns - for long lists, where one tall
 * column wastes the width and a wrapping row loses its alignment. Three and two columns, and a
 * two-column card picker. Narrow the canvas: the columns shrink, the count stays.
 */
export const Columns: Story = {
  render: () => ({
    props: {
      countries: [
        'Argentina',
        'Bolivia',
        'Brazil',
        'Chile',
        'Colombia',
        'Ecuador',
        'Paraguay',
        'Peru',
        'Uruguay',
      ],
      regions: [
        {
          label: 'North',
          value: 'north',
          description: 'Tumbes to La Libertad',
        },
        { label: 'Center', value: 'center', description: 'Ancash to Ica' },
        { label: 'South', value: 'south', description: 'Arequipa to Tacna' },
        {
          label: 'Amazon',
          value: 'amazon',
          description: 'Loreto to Madre de Dios',
        },
      ],
      visited: ['Peru'] as readonly string[],
    },
    template: `
      <div style="display: flex; flex-direction: column; gap: 2rem; width: min(40rem, 100%);">
        <andes-checkbox-group aria-label="Countries (3 columns)" [columns]="3" [options]="countries" [(value)]="visited" />
        <andes-checkbox-group aria-label="Countries (2 columns)" [columns]="2" size="sm" [options]="countries" />
        <andes-checkbox-group aria-label="Regions" variant="card" [columns]="2" [options]="regions" />
      </div>
    `,
  }),
};

/**
 * `readOnly` freezes the whole group (items stay focusable, keep their look and are announced
 * as read-only); `required` sets `aria-required` and, in a form, makes an empty selection
 * invalid - shown here with a FormControl whose errors are echoed, and `status="error"` once
 * it has been touched.
 */
export const ReadOnlyAndRequired: Story = {
  name: 'Read-only and required',
  render: () => ({
    moduleMetadata: {
      imports: [
        AndesCheckbox,
        AndesCheckboxSelectAll,
        ReactiveFormsModule,
        JsonPipe,
      ],
    },
    props: {
      frozen: ['apple', 'cherry'] as readonly string[],
      daysControl: new FormControl<readonly string[]>([], {
        nonNullable: true,
      }),
    },
    template: `
      <div style="display: flex; gap: 3rem; flex-wrap: wrap; align-items: flex-start;">
        <andes-checkbox-group aria-label="Fruits (read-only)" readOnly [(value)]="frozen">
          <andes-checkbox andesSelectAll>Select all</andes-checkbox>
          <andes-checkbox value="apple">Apple</andes-checkbox>
          <andes-checkbox value="banana">Banana</andes-checkbox>
          <andes-checkbox value="cherry">Cherry</andes-checkbox>
        </andes-checkbox-group>
        <div>
          <andes-checkbox-group
            aria-label="Delivery days (required)"
            required
            [formControl]="daysControl"
            [status]="daysControl.touched && daysControl.invalid ? 'error' : undefined"
          >
            <andes-checkbox value="mon">Monday</andes-checkbox>
            <andes-checkbox value="wed">Wednesday</andes-checkbox>
            <andes-checkbox value="fri">Friday</andes-checkbox>
          </andes-checkbox-group>
          <p style="font-family: var(--andes-font-family), sans-serif; font-size: 0.875rem; line-height: 1.375rem; color: var(--andes-color-foreground); margin-top: 1rem;">
            valid: {{ daysControl.valid }} - errors: {{ daysControl.errors | json }}
          </p>
        </div>
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
