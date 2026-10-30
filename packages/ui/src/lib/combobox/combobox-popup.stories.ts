import { NgTemplateOutlet } from '@angular/common';
import { FormsModule } from '@angular/forms';
import type { Meta, StoryObj } from '@storybook/angular';

import { AndesButton } from '../button/button';
import { AndesCombobox, type AndesComboboxOption } from './combobox';
import { AndesComboboxContent } from './combobox-content';
import { AndesComboboxEmpty } from './combobox-empty';
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
}));

interface Country extends AndesComboboxOption {
  readonly capital: string;
  readonly flag: string;
}

const COUNTRIES: readonly Country[] = [
  { value: 'AR', label: 'Argentina', capital: 'Buenos Aires', flag: '🇦🇷' },
  { value: 'BO', label: 'Bolivia', capital: 'Sucre', flag: '🇧🇴' },
  { value: 'BR', label: 'Brazil', capital: 'Brasília', flag: '🇧🇷' },
  { value: 'CL', label: 'Chile', capital: 'Santiago', flag: '🇨🇱' },
  { value: 'CO', label: 'Colombia', capital: 'Bogotá', flag: '🇨🇴' },
  { value: 'EC', label: 'Ecuador', capital: 'Quito', flag: '🇪🇨' },
  { value: 'PE', label: 'Peru', capital: 'Lima', flag: '🇵🇪' },
  { value: 'UY', label: 'Uruguay', capital: 'Montevideo', flag: '🇺🇾' },
];

/** Muted helper text under a story's control, readable in either theme. */
const CAPTION =
  'font-family: var(--andes-font-family), sans-serif; font-size: 0.75rem; line-height: 1.25rem; color: var(--andes-color-muted-foreground);';

const meta: Meta<AndesCombobox> = {
  title: 'Data Entry/Combobox/Popup',
  component: AndesCombobox,
  decorators: [
    (story) => ({
      moduleMetadata: {
        imports: [
          AndesCombobox,
          AndesComboboxInput,
          AndesComboboxContent,
          AndesComboboxItem,
          AndesComboboxEmpty,
          AndesButton,
          FormsModule,
          NgTemplateOutlet,
        ],
      },
      ...story(),
    }),
  ],
};

export default meta;

type Story = StoryObj<AndesCombobox>;

/**
 * `placement` picks the preferred side and alignment; the popup still flips above or below
 * when that side lacks room. The popups here are a fixed 260px, wider than their 200px
 * fields, only so that the `start`/`end` alignment shows.
 */
export const Placement: Story = {
  render: () => ({
    props: { fruitOptions: FRUIT_OPTIONS },
    template: `
      <div style="display: grid; grid-template-columns: repeat(2, 200px); gap: 1rem; padding-block: 18rem;">
        <andes-combobox [options]="fruitOptions" placement="top-start" placeholder="top-start" aria-label="top-start" [popupMatchSelectWidth]="260" />
        <andes-combobox [options]="fruitOptions" placement="top-end" placeholder="top-end" aria-label="top-end" [popupMatchSelectWidth]="260" />
        <andes-combobox [options]="fruitOptions" placement="bottom-start" placeholder="bottom-start" aria-label="bottom-start" [popupMatchSelectWidth]="260" />
        <andes-combobox [options]="fruitOptions" placement="bottom-end" placeholder="bottom-end" aria-label="bottom-end" [popupMatchSelectWidth]="260" />
      </div>
    `,
  }),
};

/**
 * Popup width. By default the popup is exactly as wide as the field, its edges level with
 * the field's (first box). A fixed width suits a narrow field whose options carry more
 * than their label - here a capital next to each country, which a 200px popup would
 * truncate (second box). `false` sizes the popup to its widest option (third box).
 */
export const PopupMatchSelectWidth: Story = {
  render: () => ({
    props: { countries: COUNTRIES, caption: CAPTION },
    template: `
      <div style="display: flex; flex-direction: column; gap: 1rem; width: 200px;">
        <span [style]="caption">As wide as the field (default)</span>
        <andes-combobox [options]="countries" placeholder="Search country..." aria-label="Field width" />
        <span [style]="caption">Fixed 320px, for the capitals</span>
        <andes-combobox [options]="countries" [popupMatchSelectWidth]="320" [optionTemplate]="withCapital" placeholder="Search country..." aria-label="Fixed width" />
        <span [style]="caption">Content width</span>
        <andes-combobox [options]="countries" [popupMatchSelectWidth]="false" placeholder="Search country..." aria-label="Content width" />
      </div>
      <ng-template #withCapital let-option>
        <span style="display: flex; justify-content: space-between; gap: 1rem;">
          <span>{{ option.label }}</span>
          <span [style]="caption">{{ option.capital }}</span>
        </span>
      </ng-template>
    `,
  }),
};

/**
 * Opening and closing: `[(open)]` two-way binds the popup (`(openChange)` reports every
 * change, however it happened), and `defaultOpen` opens it once on render without the
 * field taking focus.
 */
export const ControlledOpen: Story = {
  render: () => ({
    props: { fruitOptions: FRUIT_OPTIONS, popupOpen: false, caption: CAPTION },
    template: `
      <div style="display: flex; flex-direction: column; gap: 0.5rem; width: 260px;">
        <!-- Above the field, so the open popup never covers them. Two buttons rather than
             one toggle: pressing anything outside an open popup already closes it. -->
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <andes-button size="sm" variant="outline" (click)="popupOpen = true">Open</andes-button>
          <andes-button size="sm" variant="outline" (click)="popupOpen = false">Close</andes-button>
          <span [style]="caption">open: {{ popupOpen }}</span>
        </div>
        <andes-combobox [options]="fruitOptions" [(open)]="popupOpen" placeholder="Search fruit..." aria-label="Fruit" />
        <div style="height: 15rem;"></div>
        <span [style]="caption">defaultOpen</span>
        <andes-combobox [options]="fruitOptions" defaultOpen placeholder="Open from the start" aria-label="Fruit, open on render" />
      </div>
    `,
  }),
};

/**
 * `panelClass` adds classes to the popup. Its base look has no specificity of its own, so
 * one class selector in page CSS restyles it - here a taller list with a tinted edge.
 */
export const PanelClass: Story = {
  render: () => ({
    props: { fruitOptions: FRUIT_OPTIONS },
    template: `
      <style>
        .story-tall-popup {
          max-height: 24rem;
          border-color: var(--andes-color-primary);
        }
      </style>
      <andes-combobox [options]="fruitOptions" panelClass="story-tall-popup" placeholder="Search fruit..." aria-label="Fruit" style="width: 260px; display: inline-block;" />
    `,
  }),
};
