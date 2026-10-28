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

const meta: Meta<AndesCombobox> = {
  title: 'Data Entry/Combobox/Search',
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
 * `filterOption` as a function (here: prefix match only) and `optionFilterProp` (here:
 * the second box matches the ISO code in `value`, not the label - try "pe").
 */
export const CustomFilter: Story = {
  render: () => ({
    props: {
      countries: COUNTRIES,
      startsWith: (query: string, option: AndesComboboxOption) =>
        (option.label ?? '').toLowerCase().startsWith(query.toLowerCase()),
      caption: CAPTION,
      stack: STACK,
    },
    template: `
      <div [style]="stack">
        <span [style]="caption">Prefix match on the label</span>
        <andes-combobox [options]="countries" [filterOption]="startsWith" placeholder="Try &quot;b&quot;..." aria-label="Country, prefix match" />
        <span [style]="caption">Matches the ISO code (optionFilterProp="value")</span>
        <andes-combobox [options]="countries" optionFilterProp="value" placeholder="Try &quot;pe&quot;..." aria-label="Country by code" />
      </div>
    `,
  }),
};

/**
 * Server-side search: `filterOption="false"` shows whatever the server returned,
 * `(searchChange)` fires the request and `loading` shows a spinner meanwhile.
 */
export const AsyncSearch: Story = {
  render: () => {
    const results = signal<readonly AndesComboboxOption[]>([]);
    const fetching = signal(false);
    let timer: ReturnType<typeof setTimeout> | undefined;
    const search = (text: string) => {
      clearTimeout(timer);
      if (!text.trim()) {
        fetching.set(false);
        results.set([]);
        return;
      }
      fetching.set(true);
      timer = setTimeout(() => {
        const query = text.trim().toLowerCase();
        results.set(
          COUNTRIES.filter((c) =>
            (c.label ?? '').toLowerCase().includes(query),
          ),
        );
        fetching.set(false);
      }, 800);
    };
    return {
      props: { results, fetching, search },
      template: `
        <andes-combobox [options]="results()" [loading]="fetching()" filterOption="false" (searchChange)="search($event)" notFoundContent="No countries found." placeholder="Type to search countries..." aria-label="Country" style="width: 280px; display: inline-block;" />
      `,
    };
  },
};

/**
 * `freeText` makes the typed text the value, for fields the suggestions only help write:
 * here, typing a name offers the usual e-mail domains, and any address typed by hand is
 * kept as the form value too.
 */
export const FreeText: Story = {
  render: () => {
    const typed = signal<string | null>(null);
    const suggestions = signal<readonly AndesComboboxOption[]>([]);
    const DOMAINS = ['gmail.com', 'outlook.com', 'yahoo.com', 'proton.me'];
    const suggest = (text: string) => {
      const name = text.split('@')[0];
      suggestions.set(
        name ? DOMAINS.map((domain) => ({ value: `${name}@${domain}` })) : [],
      );
    };
    return {
      props: { typed, suggestions, suggest, caption: CAPTION },
      template: `
        <div style="display: flex; flex-direction: column; gap: 0.5rem; width: 280px;">
          <andes-combobox [options]="suggestions()" freeText filterOption="false" [notFoundContent]="null" [ngModel]="typed()" (ngModelChange)="typed.set($event)" (searchChange)="suggest($event)" placeholder="E-mail address" aria-label="E-mail address" />
          <span [style]="caption">Value: {{ typed() ?? '(none)' }}</span>
        </div>
      `,
    };
  },
};

/**
 * What the popup shows when nothing matches: the default message of an empty compound
 * list (`andesComboboxEmpty`), a custom `notFoundContent`, or `null` to hide the popup
 * while empty. Type "xyz" in the data-driven ones.
 */
export const NotFoundContent: Story = {
  render: () => ({
    props: {
      noItems: [] as string[],
      fruitOptions: FRUIT_OPTIONS,
      caption: CAPTION,
      stack: STACK,
    },
    template: `
      <div [style]="stack">
        <span [style]="caption">Empty list (compound mode)</span>
        <andes-combobox #empty [items]="noItems">
          <input andesComboboxInput placeholder="Nothing will match..." aria-label="Empty list" style="width: 100%;" />
          <div andesComboboxContent>
            @for (item of empty.filteredItems(); track item) {
              <div andesComboboxItem [value]="item">{{ item }}</div>
            } @empty {
              <div andesComboboxEmpty>No results found.</div>
            }
          </div>
        </andes-combobox>
        <span [style]="caption">Custom message</span>
        <andes-combobox [options]="fruitOptions" notFoundContent="No fruit by that name." placeholder="Type &quot;xyz&quot;..." aria-label="Custom message" />
        <span [style]="caption">Hidden while empty</span>
        <andes-combobox [options]="fruitOptions" [notFoundContent]="null" placeholder="Type &quot;xyz&quot;..." aria-label="Hidden while empty" />
      </div>
    `,
  }),
};

/**
 * Highlighting: `backfill` previews the highlighted option in the input as the arrow keys
 * move (Enter or leaving keeps it, Escape reverts); `autoHighlight` off leaves nothing
 * highlighted until a key or the pointer picks an option, so Enter commits nothing.
 */
export const Highlighting: Story = {
  render: () => ({
    props: { fruitOptions: FRUIT_OPTIONS, caption: CAPTION, stack: STACK },
    template: `
      <div [style]="stack">
        <span [style]="caption">backfill</span>
        <andes-combobox [options]="fruitOptions" backfill placeholder="Type, then use the arrow keys" aria-label="Fruit, backfill" />
        <span [style]="caption">autoHighlight off</span>
        <andes-combobox [options]="fruitOptions" [autoHighlight]="false" placeholder="Search fruit..." aria-label="Fruit, no auto highlight" />
      </div>
    `,
  }),
};
