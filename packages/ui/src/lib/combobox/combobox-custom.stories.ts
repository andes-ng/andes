import { NgTemplateOutlet } from '@angular/common';
import { signal } from '@angular/core';
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

/** A column of labelled examples, e.g. one per size or variant. */
const STACK = 'display: flex; flex-direction: column; gap: 1rem; width: 260px;';

interface ProductGroup {
  readonly label: string;
  readonly total: number;
  readonly options: readonly AndesComboboxOption[];
}

const PRODUCT_GROUPS: readonly ProductGroup[] = [
  {
    label: 'Libraries',
    total: 128,
    options: [
      { value: 'andes-ng', label: 'andes-ng' },
      { value: 'andes-ng-icons', label: 'andes-ng-icons' },
    ],
  },
  {
    label: 'Solutions',
    total: 42,
    options: [
      { value: 'andes-erp', label: 'Andes ERP' },
      { value: 'andes-crm', label: 'Andes CRM' },
    ],
  },
  {
    label: 'Articles',
    total: 9,
    options: [{ value: 'andes-guide', label: 'Building admin screens' }],
  },
];

const DOMAINS = [
  'andes.dev',
  'angular.dev',
  'docs.andes.dev',
  'status.andes.dev',
];

const meta: Meta<AndesCombobox> = {
  title: 'Data Entry/Combobox/Custom content',
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
 * `[optionTemplate]` renders each option (its context carries the option and the query)
 * and `[groupLabelTemplate]` renders each group heading (its context is the group exactly
 * as passed - here with an extra `total` - the matching options and the query). Both
 * popups take the field's width, the standard case: the fields are simply wide enough for
 * the richer rows.
 */
export const OptionTemplates: Story = {
  render: () => ({
    props: {
      countries: COUNTRIES,
      productGroups: PRODUCT_GROUPS,
      caption: CAPTION,
    },
    template: `
      <div style="display: flex; flex-direction: column; gap: 1rem; width: 320px;">
        <andes-combobox [options]="countries" placeholder="Search country..." aria-label="Country" [optionTemplate]="country" />
        <andes-combobox [options]="productGroups" [groupLabelTemplate]="heading" placeholder="Search everything..." aria-label="Search" />
      </div>
      <ng-template #country let-option>
        <span style="display: flex; align-items: center; gap: 0.5rem;">
          <span aria-hidden="true">{{ option.flag }}</span>
          <span style="flex: 1;">{{ option.label }}</span>
          <span [style]="caption">{{ option.capital }}</span>
        </span>
      </ng-template>
      <ng-template #heading let-group let-options="options">
        <span style="display: flex; justify-content: space-between; gap: 0.5rem;">
          <span>{{ group.label }}</span>
          <span>{{ options.length }} of {{ group.total }}</span>
        </span>
      </ng-template>
    `,
  }),
};

/**
 * `[popupTemplate]` adds content around the list - a header, a footer action. Pressing a
 * button in the popup keeps the input focused, so its click lands with the popup open.
 */
export const PopupTemplate: Story = {
  render: () => {
    const created = signal<readonly string[]>([]);
    const create = (text: string) => created.set([...created(), text.trim()]);
    return {
      props: { fruitOptions: FRUIT_OPTIONS, created, create, caption: CAPTION },
      template: `
        <div style="display: flex; flex-direction: column; gap: 0.5rem; width: 260px;">
          <andes-combobox #combobox [options]="fruitOptions" [popupTemplate]="popup" placeholder="Search fruit..." aria-label="Fruit" />
          <span [style]="caption">Created: {{ created().join(', ') || '(none)' }}</span>
        </div>
        <ng-template #popup let-body let-query="query">
          <ng-container *ngTemplateOutlet="body" />
          <div style="border-top: 1px solid var(--andes-color-border); padding-top: 0.25rem;">
            <andes-button size="sm" variant="ghost" shape="full" [disabled]="!query.trim()" (click)="create(query); combobox.close()">
              Create "{{ query.trim() || '...' }}"
            </andes-button>
          </div>
        </ng-template>
      `,
    };
  },
};

/** A `<textarea>` as the field, in the compound mode, for suggestions on a longer text. */
export const TextareaInput: Story = {
  render: () => ({
    props: { fruitItems: FRUITS },
    template: `
      <andes-combobox #combobox [items]="fruitItems" allowClear style="width: 320px; display: inline-block;">
        <textarea andesComboboxInput rows="3" placeholder="Describe the order, starting with a fruit..." aria-label="Order note"></textarea>
        <div andesComboboxContent>
          @for (item of combobox.filteredItems(); track item) {
            <div andesComboboxItem [value]="item">{{ item }}</div>
          } @empty {
            <div andesComboboxEmpty>No results found.</div>
          }
        </div>
      </andes-combobox>
    `,
  }),
};

/**
 * Field content: `prefix` and `suffixIcon` decorate the field itself; in the compound mode
 * an element marked `andesComboboxField` is projected as the field, so the input can sit in
 * an addon group of its own markup. The input keeps every combobox attribute and the
 * popup lines up with the input.
 */
export const FieldContent: Story = {
  render: () => ({
    props: { countries: COUNTRIES, domains: DOMAINS, stack: STACK },
    template: `
      <div [style]="stack">
        <andes-combobox [options]="countries" [prefix]="pin" [suffixIcon]="chevron" placeholder="Search country..." aria-label="Country" />
        <andes-combobox [options]="countries" prefix="+" size="lg" placeholder="Calling code country" aria-label="Calling code country" />
        <andes-combobox #site [items]="domains">
          <div andesComboboxField style="display: flex; align-items: stretch;">
            <span style="display: inline-flex; align-items: center; padding-inline: 0.6875rem; border: 1px solid var(--andes-color-input); border-inline-end: 0; border-start-start-radius: 0.375rem; border-end-start-radius: 0.375rem; background: var(--andes-color-muted); color: var(--andes-color-muted-foreground); font: 0.875rem/1.375rem var(--andes-font-family), sans-serif;">https://</span>
            <input andesComboboxInput placeholder="site.example" aria-label="Website" style="border-start-start-radius: 0; border-end-start-radius: 0;" />
          </div>
          <div andesComboboxContent>
            @for (item of site.filteredItems(); track item) {
              <div andesComboboxItem [value]="item">{{ item }}</div>
            } @empty {
              <div andesComboboxEmpty>No sites found.</div>
            }
          </div>
        </andes-combobox>
      </div>
      <ng-template #pin>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7-5.6-7-11a7 7 0 0 1 14 0c0 5.4-7 11-7 11Z" /><circle cx="12" cy="10" r="2.5" /></svg>
      </ng-template>
      <ng-template #chevron>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6" /></svg>
      </ng-template>
    `,
  }),
};
