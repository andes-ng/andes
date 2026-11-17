import { JsonPipe } from '@angular/common';
import { signal } from '@angular/core';
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
  title: 'Data Entry/Select/Search',
  component: AndesSelect,
};

export default meta;

type Story = StoryObj<AndesSelect>;

const note = (text: string) =>
  `<p style="margin: 0.5rem 0 0; font: 0.75rem/1.25rem var(--andes-font-family), sans-serif; color: var(--andes-color-muted-foreground);">${text}</p>`;

/**
 * `showSearch` turns the trigger into a text input that filters the options, with focus
 * kept in the input and the active option announced through `aria-activedescendant`.
 * Groups with no match hide themselves.
 */
export const Searchable: Story = {
  render: () => ({
    moduleMetadata: { imports: SELECT_IMPORTS },
    props: { search: '' },
    template: `
      <div style="width: 260px;">
        <andes-select aria-label="Produce" placeholder="Search produce" showSearch allowClear
          [(searchValue)]="search">
          <andes-select-content>
            <andes-select-group>
              <andes-select-label>Fruit</andes-select-label>
              <andes-select-item value="apple">Apple</andes-select-item>
              <andes-select-item value="apricot">Apricot</andes-select-item>
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
        ${note('searchValue: "{{ search }}"')}
      </div>
    `,
  }),
};

/**
 * Tuning the filter: `optionFilterProp` matches on other fields (the first select also
 * finds a country by its capital, and shows a `notFoundContent` template for a search
 * with no match), and `filterSort` ranks the matches - options starting with the search
 * text come first (type "ap" in the second).
 */
export const FilterAndSort: Story = {
  render: () => ({
    moduleMetadata: { imports: SELECT_IMPORTS },
    props: {
      countries: [
        { value: 'pe', label: 'Peru', capital: 'Lima' },
        { value: 'cl', label: 'Chile', capital: 'Santiago' },
        { value: 'ar', label: 'Argentina', capital: 'Buenos Aires' },
      ],
      filterProps: ['label', 'capital'],
      fruitsToRank: [
        { value: 'pineapple', label: 'Pineapple' },
        { value: 'apple', label: 'Apple' },
        { value: 'grape', label: 'Grape' },
        { value: 'apricot', label: 'Apricot' },
        { value: 'custard-apple', label: 'Custard apple' },
      ],
      sort: (
        a: { label: string },
        b: { label: string },
        info: { searchValue: string },
      ) => {
        const search = info.searchValue.toLowerCase();
        const rank = (label: string) =>
          search && label.toLowerCase().startsWith(search) ? 0 : 1;
        return rank(a.label) - rank(b.label) || a.label.localeCompare(b.label);
      },
    },
    template: `
      <div style="width: 260px; display: flex; flex-direction: column; gap: 1rem;">
        <andes-select aria-label="Country" placeholder="Country or capital" showSearch [open]="true"
          searchValue="xyz" [options]="countries" [optionFilterProp]="filterProps" [notFoundContent]="empty" />
        <ng-template #empty>
          <span>Nothing matches - try a capital, like <em>Lima</em>.</span>
        </ng-template>
        <div style="margin-top: 5rem;">
          <andes-select aria-label="Fruit" placeholder="Type 'ap'" showSearch
            [options]="fruitsToRank" [filterSort]="sort" />
        </div>
      </div>
    `,
  }),
};

/**
 * Options fetched from a server as the user types: `searchInput` starts the request,
 * `filterOption` is off because the server already filtered, and `loading` covers the wait.
 */
export const RemoteSearch: Story = {
  render: () => {
    const people = [
      'Ada Lovelace',
      'Grace Hopper',
      'Alan Turing',
      'Katherine Johnson',
      'Edsger Dijkstra',
    ];
    const results = signal<{ value: number; label: string }[]>([]);
    const fetching = signal(false);
    let timer: ReturnType<typeof setTimeout> | undefined;
    return {
      moduleMetadata: { imports: SELECT_IMPORTS },
      props: {
        results,
        fetching,
        onSearch(text: string) {
          clearTimeout(timer);
          if (!text.trim()) {
            results.set([]);
            fetching.set(false);
            return;
          }
          fetching.set(true);
          timer = setTimeout(() => {
            const needle = text.toLowerCase();
            results.set(
              people
                .map((name, index) => ({ value: index + 1, label: name }))
                .filter((person) =>
                  person.label.toLowerCase().includes(needle),
                ),
            );
            fetching.set(false);
          }, 400);
        },
      },
      template: `
        <div style="width: 280px;">
          <andes-select aria-label="People" mode="multiple" placeholder="Search people" notFoundContent="Type to search"
            [filterOption]="false" [options]="results()" [loading]="fetching()" (searchInput)="onSearch($event)" />
        </div>
      `,
    };
  },
};
