import { signal } from '@angular/core';

import { AndesInputSearch } from './input-search';
import type { Meta, StoryObj } from '@storybook/angular';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideArrowRight, lucideFunnel } from '@ng-icons/lucide';

const meta: Meta<AndesInputSearch> = {
  title: 'Data Entry/Input/Specialized/Search',
  component: AndesInputSearch,
};

export default meta;

type Story = StoryObj<AndesInputSearch>;

const caption =
  'font-size: 0.875rem; color: var(--andes-color-foreground); font-family: var(--andes-font-family), sans-serif;';

/** `(searched)` fires on Enter or on the button, with the value and which of the two it was. */
export const Search: Story = {
  render: () => ({
    moduleMetadata: {
      imports: [NgIcon],
      providers: [provideIcons({ lucideArrowRight, lucideFunnel })],
    },
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
        <ng-icon name="lucideArrowRight" aria-hidden="true" />
        Go
      </ng-template>
      <ng-template #filterIcon>
        <ng-icon name="lucideFunnel" aria-hidden="true" />
      </ng-template>
    `,
  }),
};
