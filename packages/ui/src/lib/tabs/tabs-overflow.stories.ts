import { signal } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideBell,
  lucideHouse,
  lucideSettings,
  lucideUser,
} from '@ng-icons/lucide';
import {
  applicationConfig,
  moduleMetadata,
  type Meta,
  type StoryObj,
} from '@storybook/angular';

import { AndesButton } from '../button/button';
import { AndesTabs } from './tabs';
import { AndesTabsContent } from './tabs-content';
import { AndesTabsList } from './tabs-list';
import { AndesTabsTrigger } from './tabs-trigger';
import type { AndesTabsScrollEvent } from './tabs-types';

const TABS_IMPORTS = [
  AndesTabsList,
  AndesTabsTrigger,
  AndesTabsContent,
  AndesButton,
  NgIcon,
];

const meta: Meta<AndesTabs> = {
  title: 'Navigation/Tabs/Advanced/Overflow',
  component: AndesTabs,
  decorators: [
    moduleMetadata({ imports: TABS_IMPORTS }),
    applicationConfig({
      providers: [
        provideIcons({ lucideBell, lucideHouse, lucideSettings, lucideUser }),
      ],
    }),
  ],
};

export default meta;

type Story = StoryObj<AndesTabs>;

/**
 * Tabs that don't fit scroll: the tab bar gets prev/next arrows (pointer-only - arrow-key
 * focus scrolls natively) and a "more" button listing the tabs out of view, and the selected
 * tab is always scrolled into view. Wheel, touch and arrow scrolling all emit `(tabScroll)`.
 */
export const Overflow: Story = {
  render: () => {
    const scrolls = signal<string[]>([]);
    return {
      props: {
        keys: Array.from({ length: 16 }, (_, i) => `tab-${i + 1}`),
        scrolls,
        logScroll: (event: AndesTabsScrollEvent) =>
          scrolls.update((list) => [...list.slice(-4), event.direction]),
      },
      template: `
        <div style="display: grid; gap: 2rem; width: min(24rem, calc(100vw - 2rem));">
          <andes-tabs value="tab-12" (tabScroll)="logScroll($event)">
            <andes-tabs-list>
              @for (key of keys; track key) {
                <andes-tabs-trigger [value]="key">Tab {{ key.slice(4) }}</andes-tabs-trigger>
              }
            </andes-tabs-list>
            @for (key of keys; track key) {
              <andes-tabs-content [value]="key"><p>Content of {{ key }}</p></andes-tabs-content>
            }
          </andes-tabs>
          <p style="font-family: var(--andes-font-family), sans-serif; color: var(--andes-color-foreground);">Last scroll directions: {{ scrolls().join(', ') || '—' }}</p>
          <andes-tabs type="card" value="tab-8" dir="rtl">
            <andes-tabs-list>
              @for (key of keys; track key) {
                <andes-tabs-trigger [value]="key">Tab {{ key.slice(4) }}</andes-tabs-trigger>
              }
            </andes-tabs-list>
            @for (key of keys; track key) {
              <andes-tabs-content [value]="key"><p>Right-to-left: the start edge is on the right.</p></andes-tabs-content>
            }
          </andes-tabs>
          <andes-tabs tabPosition="left" style="height: 12rem;">
            <andes-tabs-list>
              @for (key of keys; track key) {
                <andes-tabs-trigger [value]="key">Tab {{ key.slice(4) }}</andes-tabs-trigger>
              }
            </andes-tabs-list>
            @for (key of keys; track key) {
              <andes-tabs-content [value]="key"><p>Content of {{ key }}</p></andes-tabs-content>
            }
          </andes-tabs>
        </div>
      `,
    };
  },
};

/**
 * The overflow menu in its variants: a search field that filters the hidden tabs
 * (`moreSearch`), opening on hover (`moreTrigger="hover"`), and a custom `moreTemplate` that
 * receives the hidden tabs plus `select`/`close`. `[more]="false"` leaves only the arrows.
 */
export const OverflowMenu: Story = {
  render: () => ({
    props: {
      keys: Array.from({ length: 24 }, (_, i) => `tab-${i + 1}`),
    },
    template: `
      <ng-template #customMore let-hidden let-select="select">
        <p style="margin: 0.25rem 0.5rem; color: var(--andes-color-muted-foreground);">{{ hidden.length }} tabs out of view</p>
        @for (tab of hidden; track tab.key) {
          <andes-button size="sm" variant="ghost" style="width: 100%;" (click)="select(tab.key)">{{ tab.label }}</andes-button>
        }
      </ng-template>
      <div style="display: grid; gap: 2rem; width: min(28rem, calc(100vw - 2rem)); font-family: var(--andes-font-family), sans-serif; color: var(--andes-color-foreground);">
        @for (variant of ['search', 'hover', 'custom', 'off']; track variant) {
          <section style="min-width: 0;">
            <p style="margin: 0 0 0.5rem; font-weight: 600;">{{ variant }}</p>
            <andes-tabs
              [moreSearch]="variant === 'search'"
              [moreTrigger]="variant === 'hover' ? 'hover' : 'click'"
              [moreTemplate]="variant === 'custom' ? customMore : undefined"
              [more]="variant !== 'off'"
            >
              <andes-tabs-list>
                @for (key of keys; track key) {
                  <andes-tabs-trigger [value]="key">Tab {{ key.slice(4) }}</andes-tabs-trigger>
                }
              </andes-tabs-list>
              @for (key of keys; track key) {
                <andes-tabs-content [value]="key"><p>Content of {{ key }}</p></andes-tabs-content>
              }
            </andes-tabs>
          </section>
        }
      </div>
    `,
  }),
};

/**
 * `tabBarStyle` (and `tabBarClass`) style the bar itself - here a sticky bar that stays in
 * view while a long panel scrolls inside its container.
 */
export const StickyBar: Story = {
  render: () => ({
    props: {
      barStyle: {
        position: 'sticky',
        top: '0',
        zIndex: 1,
        background: 'var(--andes-color-background)',
      },
      rows: Array.from({ length: 40 }, (_, i) => i + 1),
    },
    template: `
      <div style="height: 16rem; overflow: auto; width: min(32rem, calc(100vw - 2rem)); border: 1px solid var(--andes-color-border); border-radius: var(--andes-radius-md); padding: 0 0.75rem;">
        <andes-tabs [tabBarStyle]="barStyle">
          <andes-tabs-list>
            <andes-tabs-trigger value="lines">Order lines</andes-tabs-trigger>
            <andes-tabs-trigger value="notes">Notes</andes-tabs-trigger>
          </andes-tabs-list>
          <andes-tabs-content value="lines">
            @for (row of rows; track row) { <p style="margin: 0.5rem 0;">Line {{ row }}</p> }
          </andes-tabs-content>
          <andes-tabs-content value="notes"><p>No notes.</p></andes-tabs-content>
        </andes-tabs>
      </div>
    `,
  }),
};
