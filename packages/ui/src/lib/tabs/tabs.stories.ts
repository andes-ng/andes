import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
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
import { AndesTabsContent, AndesTabsContentLazy } from './tabs-content';
import { AndesTabsList } from './tabs-list';
import { AndesTabsTrigger } from './tabs-trigger';
import type { AndesTabsItem } from './tabs-types';

/** Shows how long its panel's content has been alive, and keeps a counter as local state. */
@Component({
  selector: 'andes-story-panel-state',
  imports: [AndesButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p>Mounted at {{ mountedAt }}. Clicks kept in this panel: {{ clicks() }}</p>
    <andes-button size="sm" variant="outline" (click)="clicks.set(clicks() + 1)"
      >Click me</andes-button
    >
  `,
})
class StoryPanelState {
  protected readonly mountedAt = new Date().toLocaleTimeString();
  protected readonly clicks = signal(0);
}

const TABS_IMPORTS = [
  AndesTabsList,
  AndesTabsTrigger,
  AndesTabsContent,
  AndesTabsContentLazy,
  AndesButton,
  NgIcon,
  StoryPanelState,
];

const BASIC_TABS = `
  <andes-tabs-list>
    <andes-tabs-trigger value="account">Account</andes-tabs-trigger>
    <andes-tabs-trigger value="password">Password</andes-tabs-trigger>
    <andes-tabs-trigger value="team" disabled>Team (disabled)</andes-tabs-trigger>
  </andes-tabs-list>
  <andes-tabs-content value="account">
    <p>Update your account details here.</p>
  </andes-tabs-content>
  <andes-tabs-content value="password">
    <p>Change your password here.</p>
  </andes-tabs-content>
  <andes-tabs-content value="team">
    <p>Manage your team here.</p>
  </andes-tabs-content>
`;

const meta: Meta<AndesTabs> = {
  title: 'Navigation/Tabs/Basics/Tabs',
  component: AndesTabs,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({ imports: TABS_IMPORTS }),
    applicationConfig({
      providers: [
        provideIcons({ lucideBell, lucideHouse, lucideSettings, lucideUser }),
      ],
    }),
  ],
  argTypes: {
    type: { control: 'select', options: ['line', 'card', 'editable-card'] },
    tabPosition: {
      control: 'select',
      options: [undefined, 'top', 'bottom', 'left', 'right'],
    },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    orientation: { control: 'select', options: ['horizontal', 'vertical'] },
    activationMode: { control: 'select', options: ['automatic', 'manual'] },
    centered: { control: 'boolean' },
    tabBarGutter: { control: 'number' },
    animated: { control: 'boolean' },
    destroyOnHidden: { control: 'boolean' },
  },
  args: {
    type: 'line',
    size: 'md',
    orientation: 'horizontal',
    activationMode: 'automatic',
    centered: false,
    animated: true,
    destroyOnHidden: false,
  },
  render: (args) => ({
    props: args,
    template: `
      <andes-tabs
        [type]="type"
        [tabPosition]="tabPosition"
        [size]="size"
        [orientation]="orientation"
        [activationMode]="activationMode"
        [centered]="centered"
        [tabBarGutter]="tabBarGutter"
        [animated]="animated"
        [destroyOnHidden]="destroyOnHidden"
        style="width: min(32rem, calc(100vw - 2rem));"
      >${BASIC_TABS}</andes-tabs>
    `,
  }),
};

export default meta;

type Story = StoryObj<AndesTabs>;

const CAPTION =
  'margin: 0 0 0.5rem; font: 600 0.875rem var(--andes-font-family), sans-serif; color: var(--andes-color-foreground);';

export const Default: Story = {};

/**
 * Three ways to drive the selection, one tab set each: `activationMode="manual"` (arrow keys
 * move focus, Enter or Space selects), a two-way `[(value)]` bound to the demo state, and the
 * `(tabClick)` and `(valueChange)` events logged below.
 */
export const Interaction: Story = {
  render: () => {
    const log = signal<string[]>([]);
    const push = (entry: string) =>
      log.update((list) => [...list.slice(-5), entry]);
    return {
      props: {
        activeTab: signal('password'),
        log,
        logClick: (key: string) => push(`tabClick: ${key}`),
        logChange: (value: string | undefined) => push(`valueChange: ${value}`),
      },
      template: `
        <div style="display: grid; gap: 2rem; width: min(32rem, calc(100vw - 2rem));">
          <section>
            <p style="${CAPTION}">Manual activation</p>
            <andes-tabs activationMode="manual">${BASIC_TABS}</andes-tabs>
          </section>
          <section>
            <p style="${CAPTION}">[(value)]: active tab <code>{{ activeTab() }}</code></p>
            <andes-tabs [(value)]="activeTab">
              <andes-tabs-list>
                <andes-tabs-trigger value="account">Account</andes-tabs-trigger>
                <andes-tabs-trigger value="password">Password</andes-tabs-trigger>
              </andes-tabs-list>
              <andes-tabs-content value="account">
                <p>Update your account details here.</p>
              </andes-tabs-content>
              <andes-tabs-content value="password">
                <p>Change your password here. Starts active via the initial value binding.</p>
              </andes-tabs-content>
            </andes-tabs>
          </section>
          <section>
            <p style="${CAPTION}">Events</p>
            <andes-tabs (tabClick)="logClick($event.key)" (valueChange)="logChange($event)">${BASIC_TABS}</andes-tabs>
            <ul style="font-family: var(--andes-font-family), sans-serif; color: var(--andes-color-foreground);">
              @for (entry of log(); track $index) { <li>{{ entry }}</li> }
            </ul>
          </section>
        </div>
      `,
    };
  },
};

/**
 * Where the tab bar sits: `tabPosition` top, bottom, left and right, the card type on the left,
 * and `orientation="vertical"`, which on its own is shorthand for `tabPosition="left"`.
 */
export const Positions: Story = {
  render: () => ({
    template: `
      <div style="display: grid; gap: 2rem; width: min(40rem, calc(100vw - 2rem));">
        @for (position of ['top', 'bottom', 'left', 'right']; track position) {
          <section>
            <h3 style="font-family: var(--andes-font-family), sans-serif; color: var(--andes-color-foreground); font-size: 0.875rem;">tabPosition="{{ position }}"</h3>
            <andes-tabs [tabPosition]="$any(position)">${BASIC_TABS}</andes-tabs>
          </section>
        }
        <section>
          <h3 style="font-family: var(--andes-font-family), sans-serif; color: var(--andes-color-foreground); font-size: 0.875rem;">type="card", tabPosition="left"</h3>
          <andes-tabs type="card" tabPosition="left">${BASIC_TABS}</andes-tabs>
        </section>
        <section>
          <h3 style="font-family: var(--andes-font-family), sans-serif; color: var(--andes-color-foreground); font-size: 0.875rem;">orientation="vertical"</h3>
          <andes-tabs orientation="vertical">${BASIC_TABS}</andes-tabs>
        </section>
      </div>
    `,
  }),
};

/**
 * The look of the bar: the three sizes in the line and card types, `centered`, and a wider
 * `tabBarGutter`.
 */
export const Appearance: Story = {
  render: () => ({
    template: `
      <div style="display: grid; gap: 1.5rem; width: min(32rem, calc(100vw - 2rem));">
        @for (size of ['sm', 'md', 'lg']; track size) {
          <andes-tabs [size]="$any(size)">${BASIC_TABS}</andes-tabs>
          <andes-tabs [size]="$any(size)" type="card">${BASIC_TABS}</andes-tabs>
        }
        <section>
          <p style="${CAPTION}">centered</p>
          <andes-tabs [centered]="true">${BASIC_TABS}</andes-tabs>
        </section>
        <section>
          <p style="${CAPTION}">tabBarGutter 16</p>
          <andes-tabs [tabBarGutter]="16">${BASIC_TABS}</andes-tabs>
        </section>
      </div>
    `,
  }),
};

/**
 * Tabs from markup with a leading icon and a disabled one, and the data-driven alternative
 * (`items`) with string and template content and a disabled item.
 */
export const Items: Story = {
  render: () => ({
    props: {
      itemsFor: (
        home: AndesTabsItem['icon'],
        rich: AndesTabsItem['content'],
      ): AndesTabsItem[] => [
        {
          key: 'home',
          label: 'Home',
          icon: home,
          content: 'Plain string content.',
        },
        { key: 'rich', label: 'Template content', content: rich },
        {
          key: 'off',
          label: 'Disabled',
          disabled: true,
          content: 'Never shown.',
        },
      ],
    },
    template: `
      <ng-template #home><ng-icon name="lucideHouse" /></ng-template>
      <ng-template #user><ng-icon name="lucideUser" /></ng-template>
      <ng-template #settings><ng-icon name="lucideSettings" /></ng-template>
      <ng-template #rich><p>Rendered from a <strong>template</strong>, lazily.</p></ng-template>
      <div style="display: grid; gap: 2rem; width: min(32rem, calc(100vw - 2rem));">
        <section>
          <p style="${CAPTION}">Projected triggers with icons</p>
          <andes-tabs>
            <andes-tabs-list>
              <andes-tabs-trigger value="home" [icon]="home">Home</andes-tabs-trigger>
              <andes-tabs-trigger value="profile" [icon]="user">Profile</andes-tabs-trigger>
              <andes-tabs-trigger value="settings" [icon]="settings" disabled>Settings</andes-tabs-trigger>
            </andes-tabs-list>
            <andes-tabs-content value="home"><p>Home</p></andes-tabs-content>
            <andes-tabs-content value="profile"><p>Profile</p></andes-tabs-content>
            <andes-tabs-content value="settings"><p>Settings</p></andes-tabs-content>
          </andes-tabs>
        </section>
        <section>
          <p style="${CAPTION}">The data-driven items</p>
          <andes-tabs [items]="itemsFor(home, rich)" />
        </section>
      </div>
    `,
  }),
};

/**
 * The ink bar and the panel animation: a short centered indicator, one sized from the tab's
 * width, no animation at all, and `animated` with its parts set separately.
 */
export const Indicator: Story = {
  render: () => ({
    props: {
      short: { size: 24, align: 'center' },
      half: { size: (origin: number) => origin / 2, align: 'start' },
      animation: { inkBar: true, tabPane: true },
    },
    template: `
      <div style="display: grid; gap: 1.5rem; width: min(32rem, calc(100vw - 2rem));">
        <andes-tabs [indicator]="short">${BASIC_TABS}</andes-tabs>
        <andes-tabs [indicator]="half">${BASIC_TABS}</andes-tabs>
        <andes-tabs [animated]="false">${BASIC_TABS}</andes-tabs>
        <andes-tabs [animated]="animation">${BASIC_TABS}</andes-tabs>
      </div>
    `,
  }),
};

/**
 * Content inside `<ng-template andesTabsContentLazy>` is created on first activation and then
 * kept (the counter survives switching tabs) - unless `destroyOnHidden` is set, in which case
 * each switch re-creates it. Toggle `destroyOnHidden` in the controls.
 */
export const LazyContent: Story = {
  render: (args) => ({
    props: args,
    template: `
      <andes-tabs [destroyOnHidden]="destroyOnHidden" style="width: min(32rem, calc(100vw - 2rem));">
        <andes-tabs-list>
          <andes-tabs-trigger value="one">One</andes-tabs-trigger>
          <andes-tabs-trigger value="two">Two</andes-tabs-trigger>
          <andes-tabs-trigger value="three">Three (forceRender)</andes-tabs-trigger>
        </andes-tabs-list>
        <andes-tabs-content value="one">
          <ng-template andesTabsContentLazy><andes-story-panel-state /></ng-template>
        </andes-tabs-content>
        <andes-tabs-content value="two">
          <ng-template andesTabsContentLazy><andes-story-panel-state /></ng-template>
        </andes-tabs-content>
        <andes-tabs-content value="three" forceRender>
          <ng-template andesTabsContentLazy><andes-story-panel-state /></ng-template>
        </andes-tabs-content>
      </andes-tabs>
    `,
  }),
};

/**
 * Card tabs on a raised surface: `--andes-tabs-card-selected-background` (the selected card,
 * which opens into the panel) and `--andes-tabs-card-background` (the other cards) match the
 * tabs to the surface they sit on. Compare in the dark theme, where the page background is
 * darker than a card.
 */
export const CardSurfaces: Story = {
  render: () => ({
    template: `
      <div style="display: grid; gap: 1.5rem; width: min(32rem, calc(100vw - 2rem));">
        @for (surface of ['Page default', 'On a card surface']; track surface; let onCard = $index) {
          <div [style]="onCard ? '--andes-tabs-card-selected-background: var(--andes-color-card); --andes-tabs-card-background: color-mix(in srgb, var(--andes-color-card-foreground) 5%, var(--andes-color-card)); padding: 1rem; border: 1px solid var(--andes-color-border); border-radius: var(--andes-radius-lg); background: var(--andes-color-card); color: var(--andes-color-card-foreground);' : ''">
            <p style="margin: 0 0 0.75rem; font: 600 0.875rem/1.375rem var(--andes-font-family), sans-serif;">{{ surface }}</p>
            <andes-tabs type="card" value="b">
              <andes-tabs-list>
                <andes-tabs-trigger value="a">Overview</andes-tabs-trigger>
                <andes-tabs-trigger value="b">Activity</andes-tabs-trigger>
                <andes-tabs-trigger value="c">Settings</andes-tabs-trigger>
              </andes-tabs-list>
              <andes-tabs-content value="a"><p>Overview panel</p></andes-tabs-content>
              <andes-tabs-content value="b"><p>Activity panel</p></andes-tabs-content>
              <andes-tabs-content value="c"><p>Settings panel</p></andes-tabs-content>
            </andes-tabs>
          </div>
        }
      </div>
    `,
  }),
};

/** Project with `andesTabsExtraLeft`/`andesTabsExtraRight`, or pass `[tabBarExtraContent]`. */
export const ExtraContent: Story = {
  render: () => ({
    template: `
      <div style="display: grid; gap: 2rem; width: min(36rem, calc(100vw - 2rem));">
        <andes-tabs>
          <span andesTabsExtraLeft style="font-family: var(--andes-font-family), sans-serif; font-weight: 600; color: var(--andes-color-foreground); padding-inline-end: 0.5rem;">Settings</span>
          <andes-button andesTabsExtraRight size="sm" variant="outline">Save</andes-button>
          ${BASIC_TABS}
        </andes-tabs>
        <ng-template #right><andes-button size="sm">Extra action</andes-button></ng-template>
        <andes-tabs type="card" [tabBarExtraContent]="right">${BASIC_TABS}</andes-tabs>
      </div>
    `,
  }),
};

/** Tabs nest: each `andes-tabs` owns its own selection and keyboard navigation. */
export const Nested: Story = {
  render: () => ({
    template: `
      <andes-tabs tabPosition="left" style="width: min(36rem, calc(100vw - 2rem));">
        <andes-tabs-list>
          <andes-tabs-trigger value="sales">Sales</andes-tabs-trigger>
          <andes-tabs-trigger value="stock">Stock</andes-tabs-trigger>
        </andes-tabs-list>
        <andes-tabs-content value="sales">
          <andes-tabs type="card" size="sm">${BASIC_TABS}</andes-tabs>
        </andes-tabs-content>
        <andes-tabs-content value="stock"><p>Stock levels.</p></andes-tabs-content>
      </andes-tabs>
    `,
  }),
};
