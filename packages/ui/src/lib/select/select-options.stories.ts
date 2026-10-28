import { JsonPipe } from '@angular/common';
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

const meta: Meta<AndesSelect> = {
  title: 'Data Entry/Select/Basics/Options',
  component: AndesSelect,
};

export default meta;

type Story = StoryObj<AndesSelect>;

const note = (text: string) =>
  `<p style="margin: 0.5rem 0 0; font: 0.75rem/1.25rem var(--andes-font-family), sans-serif; color: var(--andes-color-muted-foreground);">${text}</p>`;

/**
 * Projected items, the declarative way: a disabled option, groups with labels and a
 * separator, and a long list (30 years) that scrolls inside the panel.
 */
export const Items: Story = {
  render: () => ({
    moduleMetadata: { imports: SELECT_IMPORTS },
    props: {
      years: Array.from({ length: 30 }, (_, index) => 1996 + index),
    },
    template: `
      <div style="display: flex; flex-direction: column; gap: 1rem; width: 260px;">
        <andes-select aria-label="Fruit (disabled option)" placeholder="Disabled option">
          <andes-select-trigger>
            <andes-select-value />
          </andes-select-trigger>
          <andes-select-content>
            <andes-select-item value="apple">Apple</andes-select-item>
            <andes-select-item value="apricot" disabled>Apricot (out of season)</andes-select-item>
            <andes-select-item value="banana">Banana</andes-select-item>
          </andes-select-content>
        </andes-select>
        <andes-select aria-label="Produce" placeholder="Grouped">
          <andes-select-trigger>
            <andes-select-value />
          </andes-select-trigger>
          <andes-select-content>
            <andes-select-group>
              <andes-select-label>Fruit</andes-select-label>
              <andes-select-item value="apple">Apple</andes-select-item>
              <andes-select-item value="banana">Banana</andes-select-item>
            </andes-select-group>
            <andes-select-separator />
            <andes-select-group>
              <andes-select-label>Vegetables</andes-select-label>
              <andes-select-item value="leek">Leek</andes-select-item>
              <andes-select-item value="carrot">Carrot</andes-select-item>
            </andes-select-group>
          </andes-select-content>
        </andes-select>
        <andes-select aria-label="Year" placeholder="Many options">
          <andes-select-trigger>
            <andes-select-value />
          </andes-select-trigger>
          <andes-select-content>
            @for (year of years; track year) {
              <andes-select-item [value]="year">{{ year }}</andes-select-item>
            }
          </andes-select-content>
        </andes-select>
      </div>
    `,
  }),
};

/**
 * The `options` input as an alternative to projected items, with groups, disabled
 * entries and custom rendering through `optionTemplate` and `labelTemplate`.
 */
export const OptionsArrayWithTemplates: Story = {
  render: () => ({
    moduleMetadata: { imports: SELECT_IMPORTS },
    props: {
      plans: [
        { value: 'free', label: 'Free', price: '$0' },
        {
          label: 'Paid',
          options: [
            { value: 'pro', label: 'Pro', price: '$12' },
            { value: 'team', label: 'Team', price: '$40' },
            {
              value: 'enterprise',
              label: 'Enterprise',
              price: 'Contact us',
              disabled: true,
            },
          ],
        },
      ],
    },
    template: `
      <div style="width: 280px;">
        <andes-select aria-label="Plan" placeholder="Choose a plan" value="pro"
          [options]="plans" [optionTemplate]="option" [labelTemplate]="label" />
      </div>
      <ng-template #option let-option let-selected="selected">
        <span style="display: flex; justify-content: space-between; width: 100%; gap: 1rem;">
          <span>{{ option.label }}</span>
          <span style="color: var(--andes-color-muted-foreground);">{{ option.price }}</span>
        </span>
      </ng-template>
      <ng-template #label let-item>
        <span>Plan: <strong>{{ item.label }}</strong></span>
      </ng-template>
    `,
  }),
};

/**
 * `fieldNames` reads rows as they come from an API - here `{ id, name, email }` - without
 * mapping them first. Hover an option: an entry's `title` field becomes its tooltip.
 */
export const FieldNames: Story = {
  render: () => ({
    moduleMetadata: { imports: SELECT_IMPORTS },
    props: {
      people: [
        { id: 1, name: 'Ada Lovelace', title: 'ada@example.com' },
        { id: 2, name: 'Grace Hopper', title: 'grace@example.com' },
        { id: 3, name: 'Alan Turing', title: 'alan@example.com' },
        { id: 4, name: 'Katherine Johnson', title: 'katherine@example.com' },
        { id: 5, name: 'Edsger Dijkstra', title: 'edsger@example.com' },
      ],
      fieldNames: { value: 'id', label: 'name' },
      picked: 2,
    },
    template: `
      <div style="width: 260px;">
        <andes-select aria-label="Owner" [options]="people" [fieldNames]="fieldNames" [(value)]="picked" />
        ${note('value: {{ picked }}')}
      </div>
    `,
  }),
};
