import type { Meta, StoryObj } from '@storybook/angular';

import {
  about,
  basicTabs,
  focusTab,
  numbered,
  shared,
  tabsOf,
  withDescription,
  withTabsKit,
} from '../../testing/tabs-story-kit';
import { AndesTabs } from './tabs';

/*
 * Keyboard use, naming and states, right-to-left pages, the dark theme, reduced motion and
 * narrow screens.
 */

const meta: Meta<AndesTabs> = {
  title: 'Navigation/Tabs/Accessibility',
  component: AndesTabs,
  decorators: [withDescription, withTabsKit],
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<AndesTabs>;

const TYPES = ['line', 'card', 'pill', 'segmented'];

/** Arrow keys that also select. */
export const Keyboard: Story = {
  name: 'Keyboard',
  parameters: about(
    'Tab moves into the active tab only, the left and right arrows move between the tabs and select them, Home and End jump to the ends, and Tab again leaves for the panel.',
  ),
  render: () => ({
    props: shared,
    template: `<div [style]="column">${tabsOf('', basicTabs())}</div>`,
  }),
};

/** Arrow keys that only move focus. */
export const ManualActivation: Story = {
  name: 'Manual activation',
  parameters: about(
    'With activationMode manual the arrow keys only move focus and Enter or Space selects, for panels that are slow to show.',
  ),
  render: () => ({
    props: shared,
    template: `<div [style]="column">${tabsOf('activationMode="manual"')}</div>`,
  }),
};

/** A side bar and the up and down keys. */
export const VerticalKeyboard: Story = {
  name: 'Vertical keyboard',
  parameters: about(
    'A side bar reports aria-orientation vertical and answers to the up and down arrows instead of the left and right ones.',
  ),
  render: () => ({
    props: shared,
    template: `<div [style]="column">${tabsOf('tabPosition="left" [collapseBelow]="null"')}</div>`,
  }),
};

/** Naming the tab list. */
export const NamedList: Story = {
  name: 'Named tab list',
  parameters: about(
    'An aria-label on the tab list names the group for a screen reader, which matters when a page holds more than one set of tabs.',
  ),
  render: () => ({
    props: shared,
    template: `
      <div [style]="column">
        <andes-tabs>
          <andes-tabs-list aria-label="Account settings">
            <andes-tabs-trigger value="account">Account</andes-tabs-trigger>
            <andes-tabs-trigger value="password">Password</andes-tabs-trigger>
          </andes-tabs-list>
          <andes-tabs-content value="account"><p [style]="para">Account settings.</p></andes-tabs-content>
          <andes-tabs-content value="password"><p [style]="para">Password settings.</p></andes-tabs-content>
        </andes-tabs>
      </div>`,
  }),
};

/** Tabs with only an icon. */
export const IconOnly: Story = {
  name: 'Icon-only tabs',
  parameters: about(
    'A tab with no text takes its accessible name from ariaLabel, so the icon is announced as Home, Activity or Settings.',
  ),
  render: () => ({
    props: shared,
    template: `
      <ng-template #home><ng-icon name="lucideHouse" /></ng-template>
      <ng-template #activity><ng-icon name="lucideActivity" /></ng-template>
      <ng-template #settings><ng-icon name="lucideSettings" /></ng-template>
      <div [style]="column">
        <andes-tabs type="pill">
          <andes-tabs-list>
            <andes-tabs-trigger value="home" [icon]="home" ariaLabel="Home" />
            <andes-tabs-trigger value="activity" [icon]="activity" ariaLabel="Activity" />
            <andes-tabs-trigger value="settings" [icon]="settings" ariaLabel="Settings" />
          </andes-tabs-list>
          <andes-tabs-content value="home"><p [style]="para">Home.</p></andes-tabs-content>
          <andes-tabs-content value="activity"><p [style]="para">Activity.</p></andes-tabs-content>
          <andes-tabs-content value="settings"><p [style]="para">Settings.</p></andes-tabs-content>
        </andes-tabs>
      </div>`,
  }),
};

/** The focus ring. */
export const FocusRing: Story = {
  name: 'Focus ring',
  parameters: about(
    'The focused tab shows a two-pixel ring inset in the tab, in every type, and the button moves keyboard focus onto the second tab of the first set.',
  ),
  render: () => ({
    props: { ...shared, types: TYPES, focusTab },
    template: `
      <div #demo [style]="column">
        <andes-button size="sm" variant="outline" style="align-self: flex-start;" (click)="focusTab(demo, 1)">Focus the second tab</andes-button>
        @for (type of types; track type) {
          <div><span [style]="caption">{{ type }}</span><andes-tabs [type]="type">${basicTabs()}</andes-tabs></div>
        }
      </div>`,
  }),
};

/** Rest, selected and disabled. */
export const States: Story = {
  name: 'States',
  parameters: about(
    'The resting, selected and disabled tab of every type side by side, with the disabled tab dimmed and still readable.',
  ),
  render: () => ({
    props: { ...shared, types: TYPES },
    template: `
      <div [style]="columns">
        @for (type of types; track type) {
          <div>
            <span [style]="caption">{{ type }}</span>
            <andes-tabs [type]="type" value="selected">
              <andes-tabs-list>
                <andes-tabs-trigger value="rest">Rest</andes-tabs-trigger>
                <andes-tabs-trigger value="selected">Selected</andes-tabs-trigger>
                <andes-tabs-trigger value="off" disabled>Disabled</andes-tabs-trigger>
              </andes-tabs-list>
            </andes-tabs>
          </div>
        }
      </div>`,
  }),
};

/** A right-to-left page. */
export const Rtl: Story = {
  name: 'Right to left',
  parameters: {
    dir: 'rtl',
    ...about(
      'In a right-to-left page the tabs run from the right, the line and the arrow keys follow, and the start and end bars swap sides.',
    ),
  },
  render: () => ({
    props: { ...shared, types: TYPES },
    template: `
      <div [style]="column">
        @for (type of types; track type) {
          <andes-tabs [type]="type">${basicTabs()}</andes-tabs>
        }
        <andes-tabs tabPosition="left" [collapseBelow]="null">${basicTabs()}</andes-tabs>
      </div>`,
  }),
};

/** Overflow in a right-to-left page. */
export const RtlOverflow: Story = {
  name: 'Right to left with overflow',
  parameters: {
    dir: 'rtl',
    ...about(
      'The scroll arrows, the edge fades and the overflow menu all mirror, and the arrows still scroll toward the side their chevron points to.',
    ),
  },
  render: () => ({
    props: { ...shared, names: numbered(30, 'Tab') },
    template: `
      <andes-tabs moreSearch style="width: min(32rem, calc(100vw - 2rem));">
        <andes-tabs-list>
          @for (name of names; track name) { <andes-tabs-trigger [value]="name">{{ name }}</andes-tabs-trigger> }
        </andes-tabs-list>
        @for (name of names; track name) {
          <andes-tabs-content [value]="name"><p [style]="para">{{ name }}</p></andes-tabs-content>
        }
      </andes-tabs>`,
  }),
};

/** The dark theme. */
export const Dark: Story = {
  name: 'Dark theme',
  globals: { theme: 'dark' },
  parameters: about(
    'Every type in the dark theme, where the labels and the active tab keep at least 4.5:1 contrast against their backgrounds.',
  ),
  render: () => ({
    props: { ...shared, types: TYPES },
    template: `
      <div [style]="column">
        @for (type of types; track type) {
          <andes-tabs [type]="type">${basicTabs(true)}</andes-tabs>
        }
      </div>`,
  }),
};

/** No motion. */
export const NoMotion: Story = {
  name: 'No motion',
  parameters: about(
    'animated false turns the line slide off, and a user who asks for reduced motion gets the same jump from every animation the tabs have.',
  ),
  render: () => ({
    props: shared,
    template: `<div [style]="column">${tabsOf('[animated]="false"')}</div>`,
  }),
};

/** A phone-sized screen. */
export const PhoneWidth: Story = {
  name: 'Phone width',
  parameters: about(
    'In a 20rem column the bar scrolls with its arrows, the side bar has moved to the top, and the pill tabs share the width.',
  ),
  render: () => ({
    props: { ...shared, names: numbered(12, 'Section') },
    template: `
      <div style="width: 20rem; max-width: 100%; display: flex; flex-direction: column; gap: 1.5rem;">
        <andes-tabs>
          <andes-tabs-list>
            @for (name of names; track name) { <andes-tabs-trigger [value]="name">{{ name }}</andes-tabs-trigger> }
          </andes-tabs-list>
          @for (name of names; track name) {
            <andes-tabs-content [value]="name"><p [style]="para">{{ name }}</p></andes-tabs-content>
          }
        </andes-tabs>
        <andes-tabs tabPosition="left">${basicTabs()}</andes-tabs>
        <andes-tabs type="pill" stretch>${basicTabs()}</andes-tabs>
      </div>`,
  }),
};
