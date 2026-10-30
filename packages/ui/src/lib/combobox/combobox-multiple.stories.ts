import { JsonPipe } from '@angular/common';
import { signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import type { Meta, StoryObj } from '@storybook/angular';

import { AndesCombobox, type AndesComboboxOption } from './combobox';
import { AndesComboboxContent } from './combobox-content';
import { AndesComboboxInput } from './combobox-input';
import { AndesComboboxItem } from './combobox-item';

const FRUITS = [
  'Apple',
  'Apricot',
  'Banana',
  'Blueberry',
  'Cherry',
  'Cranberry',
  'Grape',
  'Kiwi',
  'Lemon',
  'Mango',
  'Orange',
  'Peach',
  'Pineapple',
  'Strawberry',
];

const FRUIT_OPTIONS: readonly AndesComboboxOption[] = FRUITS.map((fruit) => ({
  value: fruit.toLowerCase(),
  label: fruit,
  disabled: fruit === 'Cherry',
}));

/** Muted helper text under a story's control, readable in either theme. */
const CAPTION =
  'font-family: var(--andes-font-family), sans-serif; font-size: 0.75rem; line-height: 1.25rem; color: var(--andes-color-muted-foreground);';

const meta: Meta<AndesCombobox> = {
  title: 'Data Entry/Combobox/Multiple',
  component: AndesCombobox,
  decorators: [
    (story) => ({
      moduleMetadata: {
        imports: [
          AndesCombobox,
          AndesComboboxInput,
          AndesComboboxContent,
          AndesComboboxItem,
          ReactiveFormsModule,
          JsonPipe,
        ],
      },
      ...story(),
    }),
  ],
};

export default meta;

type Story = StoryObj<AndesCombobox>;

/**
 * `multiple`: each pick becomes a chip and the list stays open for the next one; the typed
 * filter empties after a pick, picking a chosen option again removes it, and Backspace in
 * the empty input removes the last chip. A form control receives the array. The second
 * field shows every size and variant keeps the shared control heights (24/32/40px) with
 * chips inside; "Cherry" is disabled, so its chip (preset in the last field) cannot be
 * removed.
 */
export const Chips: Story = {
  render: () => {
    const control = new FormControl<readonly string[]>(['apple', 'kiwi']);
    return {
      props: { fruitOptions: FRUIT_OPTIONS, control, caption: CAPTION },
      template: `
        <div style="display: flex; flex-direction: column; gap: 1rem; width: 320px;">
          <andes-combobox multiple allowClear [options]="fruitOptions" [formControl]="control" placeholder="Pick fruit..." aria-label="Fruit" />
          <span [style]="caption">Value: {{ control.value | json }}</span>
          <andes-combobox multiple size="sm" [options]="fruitOptions" placeholder="Small" aria-label="Small" />
          <andes-combobox multiple size="lg" variant="filled" [options]="fruitOptions" placeholder="Large, filled" aria-label="Large, filled" />
          <andes-combobox multiple variant="underlined" status="error" [options]="fruitOptions" placeholder="Underlined, error" aria-label="Underlined, error" />
          <andes-combobox multiple disabled [options]="fruitOptions" [values]="['banana', 'cherry']" aria-label="Disabled" />
          <andes-combobox multiple [options]="fruitOptions" [values]="['cherry', 'mango']" aria-label="With a disabled option" />
        </div>
      `,
    };
  },
};

/**
 * Limits: `maxCount` caps how many values can be chosen (the other options show disabled
 * until a chip is removed), and `maxTagCount` shows that many chips and folds the rest
 * into one "+ N" chip whose tooltip lists them.
 */
export const Limits: Story = {
  render: () => ({
    props: {
      fruitOptions: FRUIT_OPTIONS,
      three: signal<readonly string[]>(['apple']),
      many: ['apple', 'banana', 'grape', 'kiwi', 'lemon', 'mango'],
      caption: CAPTION,
    },
    template: `
      <div style="display: flex; flex-direction: column; gap: 0.5rem; width: 320px;">
        <span [style]="caption">maxCount = 3 ({{ three().length }} chosen)</span>
        <andes-combobox multiple [maxCount]="3" [options]="fruitOptions" [values]="three()" (valuesChange)="three.set($event)" placeholder="Up to three..." aria-label="Up to three fruit" />
        <span [style]="caption">maxTagCount = 2</span>
        <andes-combobox multiple [maxTagCount]="2" [options]="fruitOptions" [values]="many" aria-label="Fruit, folded chips" />
      </div>
    `,
  }),
};

/**
 * The compound mode with `multiple`: the chips render ahead of the projected input, and
 * `[(values)]` holds the selection.
 */
export const Compound: Story = {
  render: () => ({
    props: { fruitItems: FRUITS, chosen: ['Peach'], caption: CAPTION },
    template: `
      <div style="display: flex; flex-direction: column; gap: 0.5rem; width: 320px;">
        <andes-combobox #combobox multiple [items]="fruitItems" [(values)]="chosen">
          <input andesComboboxInput placeholder="Pick fruit..." aria-label="Fruit" />
          <div andesComboboxContent>
            @for (item of combobox.filteredItems(); track item) {
              <div andesComboboxItem [value]="item">{{ item }}</div>
            }
          </div>
        </andes-combobox>
        <span [style]="caption">values: {{ chosen.join(', ') || '(none)' }}</span>
      </div>
    `,
  }),
};
