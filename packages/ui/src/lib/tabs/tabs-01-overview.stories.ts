import { signal } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular';

import {
  about,
  basicTabs,
  shared,
  tabsOf,
  withDescription,
  withTabsKit,
} from '../../testing/tabs-story-kit';
import { AndesTabs } from './tabs';

/*
 * The first stories: the playground, the plain tab set and the things every tab set needs
 * (a disabled tab, centering, icons, the data-driven form, the value and its events).
 */

const meta: Meta<AndesTabs> = {
  title: 'Navigation/Tabs/Overview',
  component: AndesTabs,
  tags: ['autodocs'],
  decorators: [withDescription, withTabsKit],
  parameters: { layout: 'padded' },
  argTypes: {
    type: {
      control: 'select',
      options: ['line', 'card', 'editable-card', 'pill', 'segmented'],
    },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    tabPosition: {
      control: 'select',
      options: [undefined, 'top', 'bottom', 'left', 'right'],
    },
    activationMode: {
      control: 'inline-radio',
      options: ['automatic', 'manual'],
    },
    centered: { control: 'boolean' },
    stretch: { control: 'boolean' },
    animated: { control: 'boolean' },
    destroyOnHidden: { control: 'boolean' },
    tabBarGutter: { control: 'number' },
    collapseBelow: { control: 'number' },
  },
  args: {
    type: 'line',
    size: 'md',
    activationMode: 'automatic',
    centered: false,
    stretch: false,
    animated: true,
    destroyOnHidden: false,
    collapseBelow: 480,
  },
  render: (args) => ({
    props: { ...args, ...shared },
    template: `
      <andes-tabs style="width: min(32rem, calc(100vw - 2rem));"
        [type]="type" [size]="size" [tabPosition]="tabPosition" [activationMode]="activationMode"
        [centered]="centered" [stretch]="stretch" [animated]="animated"
        [destroyOnHidden]="destroyOnHidden" [tabBarGutter]="tabBarGutter" [collapseBelow]="collapseBelow">
        ${basicTabs()}
      </andes-tabs>`,
  }),
};

export default meta;

type Story = StoryObj<AndesTabs>;

/** The playground. */
export const Playground: Story = {
  name: 'Playground',
  parameters: about(
    'Use the controls to try every input on one tab set: the type, the size, the side of the bar, the activation mode and the motion.',
  ),
};

/** The smallest tab set. */
export const Basic: Story = {
  name: 'Basic',
  parameters: about(
    'The first enabled tab is active until the user picks another one, and the line under the bar slides to it.',
  ),
  render: () => ({
    props: shared,
    template: `<div [style]="column">${tabsOf()}</div>`,
  }),
};

/** A tab that cannot be used. */
export const DisabledTab: Story = {
  name: 'Disabled tab',
  parameters: about(
    'A disabled tab is dimmed, skipped by the arrow keys and never picked as the default, and a click on it does nothing.',
  ),
  render: () => ({
    props: shared,
    template: `<div [style]="column">${tabsOf('', basicTabs(true))}</div>`,
  }),
};

/** Tabs in the middle of the bar. */
export const Centered: Story = {
  name: 'Centered',
  parameters: about(
    'centered puts the tabs in the middle of the bar instead of at its start, which suits a page whose content is centered too.',
  ),
  render: () => ({
    props: shared,
    template: `<div [style]="column">${tabsOf('centered')}${tabsOf('centered type="pill"')}</div>`,
  }),
};

/** A leading icon from a template. */
export const IconTabs: Story = {
  name: 'Icon tabs',
  parameters: about(
    'The icon input takes a template, so each tab can show a lucide icon in front of its label and the icon follows the tab colour.',
  ),
  render: () => ({
    props: shared,
    template: `
      <ng-template #home><ng-icon name="lucideHouse" /></ng-template>
      <ng-template #user><ng-icon name="lucideUser" /></ng-template>
      <ng-template #settings><ng-icon name="lucideSettings" /></ng-template>
      <div [style]="column">
        <andes-tabs>
          <andes-tabs-list>
            <andes-tabs-trigger value="home" [icon]="home">Home</andes-tabs-trigger>
            <andes-tabs-trigger value="profile" [icon]="user">Profile</andes-tabs-trigger>
            <andes-tabs-trigger value="settings" [icon]="settings">Settings</andes-tabs-trigger>
          </andes-tabs-list>
          <andes-tabs-content value="home"><p [style]="para">Home</p></andes-tabs-content>
          <andes-tabs-content value="profile"><p [style]="para">Profile</p></andes-tabs-content>
          <andes-tabs-content value="settings"><p [style]="para">Settings</p></andes-tabs-content>
        </andes-tabs>
      </div>`,
  }),
};

/** An icon the consumer puts in the label. */
export const IconFromSlot: Story = {
  name: 'Icon from a slot',
  parameters: about(
    'Any icon placed inside the trigger is drawn in front of the label, so the consumer can bring its own icon, a badge or a tag next to the text.',
  ),
  render: () => ({
    props: shared,
    template: `
      <div [style]="column">
        <andes-tabs type="card">
          <andes-tabs-list>
            <andes-tabs-trigger value="inbox"><ng-icon name="lucideInbox" /> Inbox</andes-tabs-trigger>
            <andes-tabs-trigger value="sent"><ng-icon name="lucideMail" /> Sent</andes-tabs-trigger>
            <andes-tabs-trigger value="starred"><ng-icon name="lucideStar" /> Starred</andes-tabs-trigger>
          </andes-tabs-list>
          <andes-tabs-content value="inbox"><p [style]="para">Messages waiting for you.</p></andes-tabs-content>
          <andes-tabs-content value="sent"><p [style]="para">Messages you sent.</p></andes-tabs-content>
          <andes-tabs-content value="starred"><p [style]="para">Messages you starred.</p></andes-tabs-content>
        </andes-tabs>
      </div>`,
  }),
};

/** Tabs from data. */
export const DataDriven: Story = {
  name: 'From an array of items',
  parameters: about(
    'The items input renders the triggers and the panels from an array, with a string or a template for each label and each panel.',
  ),
  render: () => ({
    props: {
      ...shared,
      itemsFor: (rich: unknown, home: unknown) => [
        {
          key: 'plain',
          label: 'Plain text',
          icon: home,
          content: 'A panel from a string.',
        },
        { key: 'rich', label: 'Template', content: rich },
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
      <ng-template #rich><p [style]="para">A panel from a <strong>template</strong>, created when it is first shown.</p></ng-template>
      <div [style]="column"><andes-tabs [items]="itemsFor(rich, home)" /></div>`,
  }),
};

/** The tab shown first. */
export const InitialTab: Story = {
  name: 'Initial tab',
  parameters: about(
    'A one-way value picks the tab that starts active, and the user can still move to the others.',
  ),
  render: () => ({
    props: shared,
    template: `<div [style]="column">${tabsOf('value="password"')}</div>`,
  }),
};

/** The value bound both ways. */
export const ControlledValue: Story = {
  name: 'Controlled value',
  parameters: about(
    'A two-way value keeps the active tab in the consumer state, so buttons outside the tabs can change it and the tabs report every change back.',
  ),
  render: () => {
    const active = signal('password');
    return {
      props: { ...shared, active },
      template: `
        <div [style]="column">
          <div [style]="row">
            <andes-button size="sm" variant="outline" (click)="active.set('account')">Show Account</andes-button>
            <andes-button size="sm" variant="outline" (click)="active.set('team')">Show Team</andes-button>
            <span [style]="muted">Active tab: <strong [style]="strong">{{ active() }}</strong></span>
          </div>
          <andes-tabs [(value)]="active">${basicTabs()}</andes-tabs>
        </div>`,
    };
  },
};

/** What the tabs report. */
export const Events: Story = {
  name: 'Events',
  parameters: about(
    'tabClick fires on every click before the tab is selected, even on the active tab, and valueChange fires only when the active tab really changes.',
  ),
  render: () => {
    const log = signal<string[]>([]);
    const push = (entry: string) =>
      log.update((list) => [entry, ...list].slice(0, 5));
    return {
      props: {
        ...shared,
        log,
        clicked: (key: string) => push(`tabClick: ${key}`),
        changed: (value: string | undefined) => push(`valueChange: ${value}`),
      },
      template: `
        <div [style]="column">
          <andes-tabs (tabClick)="clicked($event.key)" (valueChange)="changed($event)">${basicTabs()}</andes-tabs>
          <ol [style]="muted" style="margin: 0; padding-inline-start: 1.25rem; min-height: 6.25rem;">
            @for (entry of log(); track $index) { <li>{{ entry }}</li> }
          </ol>
        </div>`,
    };
  },
};
