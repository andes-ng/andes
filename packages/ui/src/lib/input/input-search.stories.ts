import { signal } from '@angular/core';

import { AndesInputSearch } from './input-search';
import type { Meta, StoryObj } from '@storybook/angular';

const meta: Meta<AndesInputSearch> = {
  title: 'Input/Specialized/Search',
  component: AndesInputSearch,
};

export default meta;

type Story = StoryObj<AndesInputSearch>;

const caption =
  'font-size: 0.875rem; color: var(--andes-color-foreground); font-family: var(--andes-font-family), sans-serif;';

/** `(searched)` fires on Enter or on the button, with the value and which of the two it was. */
export const Search: Story = {
  render: () => ({
    props: {
      searches: signal<string[]>([]),
      customSearches: signal<string[]>([]),
      caption,
    },
    template: `
      <div style="display: flex; flex-direction: column; gap: 1rem; width: 24rem;">
        <andes-input-search aria-label="Search" placeholder="Default search button" clearable
          (searched)="searches.set(searches().concat($event.source + ': ' + $event.value))" />
        <andes-input-search aria-label="Search, primary" placeholder="enterButton" enterButton
          (searched)="searches.set(searches().concat($event.source + ': ' + $event.value))" />
        <andes-input-search aria-label="Search, labelled" placeholder="enterButton = 'Search'" enterButton="Search" addonBefore="https://"
          (searched)="searches.set(searches().concat($event.source + ': ' + $event.value))" />
        <andes-input-search aria-label="Search, loading" placeholder="loading" enterButton loading />
        <andes-input-search aria-label="Search, loading icon" placeholder="loading, plain icon button" loading />
        <andes-input-search aria-label="Search, small" placeholder="Small" size="sm" enterButton />
        <andes-input-search aria-label="Search, large" placeholder="Large" size="lg" />
        @for (entry of searches(); track $index) {
          <span [style]="caption">{{ entry }}</span>
        }
        <andes-input-search aria-label="Search, custom button" placeholder="enterButton as a template" [enterButton]="goButton"
          (searched)="customSearches.set(customSearches().concat($event.value))" />
        <andes-input-search aria-label="Search, custom icon" placeholder="searchIcon" [searchIcon]="filterIcon" />
        @for (entry of customSearches(); track $index) {
          <span [style]="caption">{{ entry }}</span>
        }
      </div>
      <ng-template #goButton>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path>
        </svg>
        Go
      </ng-template>
      <ng-template #filterIcon>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"></path>
        </svg>
      </ng-template>
    `,
  }),
};
