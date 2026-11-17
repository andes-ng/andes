import { JsonPipe } from '@angular/common';
import type { Meta, StoryObj } from '@storybook/angular';

import { AndesCheckbox } from './checkbox';
import { AndesCheckboxGroup } from './checkbox-group';
import { AndesCheckboxSelectAll } from './checkbox-select-all';
import { AndesCheckboxOptionLabel } from './checkbox-option-label';

const meta: Meta<AndesCheckboxGroup> = {
  title: 'Data Entry/CheckboxGroup/Basics/Features',
  component: AndesCheckboxGroup,
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<AndesCheckboxGroup>;

const caption = `font-family: var(--andes-font-family), sans-serif; font-size: 0.875rem; line-height: 1.375rem; color: var(--andes-color-foreground); margin-top: 1rem;`;

/**
 * `maxCount` disables the unchecked items once the limit is reached (until one is unchecked)
 * and fires `(limitReached)`; `minCount` refuses to uncheck below the minimum. Select-all
 * respects both: it fills only up to `maxCount`, and clearing keeps the first `minCount`.
 */
export const Limits: Story = {
  render: () => ({
    moduleMetadata: { imports: [AndesCheckbox, AndesCheckboxSelectAll] },
    props: {
      toppings: ['Ham', 'Olives', 'Peppers', 'Onion', 'Mushrooms'],
      upToTwo: ['Ham'] as readonly string[],
      atLeastOne: ['Peppers'] as readonly string[],
      between: ['Ham', 'Onion'] as readonly string[],
      lastLimit: 'none yet',
    },
    template: `
      <div style="display: flex; gap: 3rem; flex-wrap: wrap; align-items: flex-start;">
        <div>
          <andes-checkbox-group
            aria-label="Toppings (at most 2)"
            [maxCount]="2"
            [options]="toppings"
            [(value)]="upToTwo"
            (limitReached)="lastLimit = $event.limit + ' ' + $event.count"
          />
          <p style="${caption}">At most 2 - {{ upToTwo.join(', ') || 'none' }}</p>
        </div>
        <div>
          <andes-checkbox-group
            aria-label="Toppings (at least 1)"
            [minCount]="1"
            [options]="toppings"
            [(value)]="atLeastOne"
            (limitReached)="lastLimit = $event.limit + ' ' + $event.count"
          />
          <p style="${caption}">At least 1 - {{ atLeastOne.join(', ') || 'none' }}</p>
        </div>
        <div>
          <andes-checkbox-group
            aria-label="Toppings (1 to 3, with select all)"
            [minCount]="1"
            [maxCount]="3"
            [options]="toppings"
            [(value)]="between"
            (limitReached)="lastLimit = $event.limit + ' ' + $event.count"
          >
            <andes-checkbox andesSelectAll>Select all (up to 3)</andes-checkbox>
          </andes-checkbox-group>
          <p style="${caption}">1 to 3 - {{ between.join(', ') || 'none' }}</p>
        </div>
      </div>
      <p style="${caption}">Last limitReached: {{ lastLimit }}</p>
    `,
  }),
};

/**
 * Object values: the selection holds whole objects, and `compareWith` matches them by id - the
 * preselected entries are separate objects (as if loaded from the server), yet their options
 * render checked, and the emitted value hands those same objects back.
 */
export const ObjectValues: Story = {
  name: 'Object values (compareWith)',
  render: () => ({
    moduleMetadata: { imports: [JsonPipe] },
    props: {
      teams: [
        { label: 'Design', value: { id: 1, name: 'Design' } },
        { label: 'Engineering', value: { id: 2, name: 'Engineering' } },
        {
          label: 'Sales',
          value: { id: 3, name: 'Sales' },
          description: 'Field and inside sales',
        },
      ],
      members: [{ id: 2, name: 'Engineering (saved)' }],
      byId: (a: { id: number }, b: { id: number }) => a.id === b.id,
    },
    template: `
      <andes-checkbox-group aria-label="Teams" [options]="teams" [compareWith]="byId" [(value)]="members" />
      <pre style="${caption} font-family: var(--andes-font-family-mono, monospace); font-size: 0.75rem;">{{ members | json }}</pre>
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
    Selected: {{ chosen.length ? chosen.join(', ') : 'none' }}
  </p>
`;

export const OptionLabelTemplate: Story = {
  name: 'Options with a label template',
  render: () => ({
    moduleMetadata: { imports: [AndesCheckboxOptionLabel] },
    props: {
      choices: [
        { label: 'Starter', value: 'starter' },
        { label: 'Pro', value: 'pro' },
        { label: 'Enterprise', value: 'enterprise' },
      ],
      chosen: [] as readonly string[],
    },
    template: `
      <andes-checkbox-group aria-label="Plans" [options]="choices" [(value)]="chosen">
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
      choices: ['Apple', 'Banana', 'Cherry'],
      chosen: [] as readonly string[],
      last: 'none yet',
    },
    // `(changed)` fires only for user changes, with the selected values array. `name` lands on
    // every rendered input, so a native form post sends `fruit=Apple&fruit=Cherry`.
    template: `
      <andes-checkbox-group
        aria-label="Fruits"
        name="fruit"
        [options]="choices"
        [(value)]="chosen"
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
    props: { chosen: [] as readonly string[], notify: false },
    template: `
      <andes-checkbox-group aria-label="Fruits" [(value)]="chosen">
        <andes-checkbox andesSelectAll>Select all</andes-checkbox>
        <andes-checkbox value="apple">Apple</andes-checkbox>
        <andes-checkbox value="banana">Banana</andes-checkbox>
        <andes-checkbox value="notify" skipGroup [(checked)]="notify">Notify me about new fruit (not part of the group)</andes-checkbox>
      </andes-checkbox-group>
      <p style="font-family: var(--andes-font-family), sans-serif; font-size: 0.875rem; line-height: 1.375rem; color: var(--andes-color-foreground); margin-top: 1rem;">
        Selected: {{ chosen.length ? chosen.join(', ') : 'none' }} - notify: {{ notify }}
      </p>
    `,
  }),
};
