import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideAppWindow,
  lucideFileText,
  lucideFolder,
} from '@ng-icons/lucide';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';

import { AndesButton } from '../button/button';
import {
  AndesCard,
  AndesCardContent,
  AndesCardHeader,
  AndesCardTitle,
  AndesCardTab,
} from './card';

const TABS: AndesCardTab[] = [
  { key: 'article', label: 'Article' },
  { key: 'app', label: 'App' },
  { key: 'project', label: 'Project' },
  { key: 'archived', label: 'Archived', disabled: true },
];

const TAB_BODIES: Record<string, string> = {
  article: 'Article content',
  app: 'App content',
  project: 'Project content',
};

const TAB_ICONS: Record<string, string> = {
  article: 'lucideFileText',
  app: 'lucideAppWindow',
  project: 'lucideFolder',
  archived: 'lucideFolder',
};

const meta: Meta<AndesCard> = {
  title: 'Data Display/Card/Tabs',
  component: AndesCard,
  decorators: [
    moduleMetadata({
      imports: [
        AndesCardHeader,
        AndesCardTitle,
        AndesCardContent,
        AndesButton,
        NgIcon,
      ],
      providers: [
        provideIcons({ lucideAppWindow, lucideFileText, lucideFolder }),
      ],
    }),
  ],
  argTypes: {
    variant: { control: 'select', options: ['outlined', 'borderless'] },
    size: { control: 'select', options: ['default', 'sm'] },
    type: { control: 'select', options: ['default', 'inner'] },
    hoverable: { control: 'boolean' },
    loading: { control: 'boolean' },
  },
  args: {
    variant: 'outlined',
    size: 'default',
    type: 'default',
    hoverable: false,
    loading: false,
  },
};

export default meta;

type Story = StoryObj<AndesCard>;

/**
 * `[(activeTabKey)]` is two-way; the card only switches the selected tab - rendering the
 * matching body is up to the consumer. Arrow keys, Home and End move between enabled tabs, and a
 * disabled tab is skipped. `tabBarExtraContent` adds a template at the end of the tab bar. The
 * second card has no title: an empty header leaves just the tabs.
 */
export const WithTabs: Story = {
  render: (args) => ({
    props: {
      ...args,
      tabs: TABS,
      bodies: TAB_BODIES,
      active: 'article',
      activeUntitled: 'app',
    },
    template: `
      <div style="display: flex; flex-direction: column; gap: 1.5rem;">
        <div>
          <andes-card
            [variant]="variant"
            [size]="size"
            [type]="type"
            [loading]="loading"
            [tabList]="tabs"
            [(activeTabKey)]="active"
            [tabBarExtraContent]="extra"
            style="width: min(420px, calc(100vw - 3rem));"
          >
            <andes-card-header>
              <andes-card-title>Card with tabs</andes-card-title>
            </andes-card-header>
            <andes-card-content>
              <p style="margin: 0;">{{ bodies[active] }}</p>
            </andes-card-content>
          </andes-card>
          <ng-template #extra><andes-button variant="link" size="sm">More</andes-button></ng-template>
          <p style="margin: 0.75rem 0 0; font-family: var(--andes-font-family), sans-serif; font-size: 0.875rem; color: var(--andes-color-foreground);">activeTabKey: <code>{{ active }}</code></p>
        </div>
        <andes-card [tabList]="tabs" [(activeTabKey)]="activeUntitled" style="width: min(420px, calc(100vw - 3rem));">
          <andes-card-header />
          <andes-card-content>
            <p style="margin: 0;">{{ bodies[activeUntitled] }}</p>
          </andes-card-content>
        </andes-card>
      </div>
    `,
  }),
};

/**
 * When the tabs don't fit, the strip scrolls and fades out toward each edge that still has
 * tabs beyond it - on the end edge at first, on both once scrolled, mirrored in right-to-left
 * text.
 */
export const OverflowingTabs: Story = {
  render: () => ({
    props: {
      tabs: Array.from({ length: 12 }, (_, i) => ({
        key: `month-${i + 1}`,
        label: new Date(2026, i, 1).toLocaleString('en', { month: 'long' }),
      })),
    },
    template: `
      <div style="display: grid; gap: 1.5rem;">
        @for (dir of ['ltr', 'rtl']; track dir) {
          <andes-card [tabList]="tabs" [attr.dir]="dir" style="width: min(360px, calc(100vw - 3rem));">
            <andes-card-header>
              <andes-card-title>Monthly report ({{ dir }})</andes-card-title>
            </andes-card-header>
            <andes-card-content>
              <p style="margin: 0;">Scroll the months sideways.</p>
            </andes-card-content>
          </andes-card>
        }
      </div>
    `,
  }),
};

/**
 * `tabLabelTemplate` swaps each tab's plain label for custom content - here an icon beside the
 * text. The template receives the tab as `$implicit` and a `selected` flag.
 */
export const TabsWithCustomLabels: Story = {
  render: (args) => ({
    props: {
      ...args,
      tabs: TABS,
      bodies: TAB_BODIES,
      icons: TAB_ICONS,
      active: 'article',
    },
    template: `
      <andes-card
        [variant]="variant"
        [size]="size"
        [tabList]="tabs"
        [(activeTabKey)]="active"
        [tabLabelTemplate]="tabLabel"
        style="width: min(420px, calc(100vw - 3rem));"
      >
        <andes-card-header>
          <andes-card-title>Workspace</andes-card-title>
        </andes-card-header>
        <andes-card-content>
          <p style="margin: 0;">{{ bodies[active] }}</p>
        </andes-card-content>
      </andes-card>
      <ng-template #tabLabel let-tab>
        <ng-icon [name]="icons[tab.key]" size="16" aria-hidden="true" />
        <span>{{ tab.label }}</span>
      </ng-template>
    `,
  }),
};
