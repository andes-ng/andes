import { signal } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular';

import {
  about,
  basicTabs,
  mediaQuery,
  shared,
  withDescription,
  withTabsKit,
} from '../../testing/tabs-story-kit';
import { AndesTabs } from './tabs';
import type { AndesTabsEditEvent } from './tabs-types';

/*
 * Tabs as an app uses them: counters and status marks in the labels, avatars, tooltips, panels
 * that load, forms, lists, empty states, a remembered tab, a tab chosen from code, a bar that
 * becomes a select on a phone, and a tab closed after a confirmation.
 */

const meta: Meta<AndesTabs> = {
  title: 'Navigation/Tabs/Real world',
  component: AndesTabs,
  decorators: [withDescription, withTabsKit],
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<AndesTabs>;

const WIDTH = 'width: min(40rem, calc(100vw - 2rem));';

/** Counts in the labels. */
export const Counters: Story = {
  name: 'Counters',
  parameters: about(
    'A small count after each label tells how much waits behind the tab, and it stays beside the text in every size.',
  ),
  render: () => ({
    props: shared,
    template: `
      <andes-tabs style="${WIDTH}">
        <andes-tabs-list>
          <andes-tabs-trigger value="inbox">Inbox <andes-badge standalone [count]="12" size="small" /></andes-tabs-trigger>
          <andes-tabs-trigger value="mentions">Mentions <andes-badge standalone [count]="3" size="small" variant="secondary" /></andes-tabs-trigger>
          <andes-tabs-trigger value="archive">Archive <andes-badge standalone [count]="240" size="small" variant="secondary" /></andes-tabs-trigger>
        </andes-tabs-list>
        <andes-tabs-content value="inbox"><p [style]="para">12 unread messages.</p></andes-tabs-content>
        <andes-tabs-content value="mentions"><p [style]="para">3 people mentioned you.</p></andes-tabs-content>
        <andes-tabs-content value="archive"><p [style]="para">240 archived messages.</p></andes-tabs-content>
      </andes-tabs>`,
  }),
};

/** Status marks in the labels. */
export const StatusDots: Story = {
  name: 'Status dots',
  parameters: about(
    'A status dot before the label shows the state of what the tab holds, such as a build that passed, one that is running and one that failed.',
  ),
  render: () => ({
    props: shared,
    template: `
      <andes-tabs type="card" style="${WIDTH}">
        <andes-tabs-list>
          <andes-tabs-trigger value="web"><andes-badge status="success" /> web</andes-tabs-trigger>
          <andes-tabs-trigger value="api"><andes-badge status="processing" /> api</andes-tabs-trigger>
          <andes-tabs-trigger value="docs"><andes-badge status="error" /> docs</andes-tabs-trigger>
        </andes-tabs-list>
        <andes-tabs-content value="web"><p [style]="para">The build passed.</p></andes-tabs-content>
        <andes-tabs-content value="api"><p [style]="para">The build is running.</p></andes-tabs-content>
        <andes-tabs-content value="docs"><p [style]="para">The build failed.</p></andes-tabs-content>
      </andes-tabs>`,
  }),
};

/** People as tabs. */
export const Avatars: Story = {
  name: 'Avatars',
  parameters: about(
    'An avatar before the name turns the tabs into a switch between people, for instance the members of a team.',
  ),
  render: () => ({
    props: shared,
    template: `
      <andes-tabs type="pill" style="${WIDTH}">
        <andes-tabs-list>
          <andes-tabs-trigger value="ada"><andes-avatar size="sm"><andes-avatar-fallback>AL</andes-avatar-fallback></andes-avatar> Ada</andes-tabs-trigger>
          <andes-tabs-trigger value="grace"><andes-avatar size="sm"><andes-avatar-fallback>GH</andes-avatar-fallback></andes-avatar> Grace</andes-tabs-trigger>
          <andes-tabs-trigger value="alan"><andes-avatar size="sm"><andes-avatar-fallback>AT</andes-avatar-fallback></andes-avatar> Alan</andes-tabs-trigger>
        </andes-tabs-list>
        <andes-tabs-content value="ada"><p [style]="para">Ada Lovelace, analyst.</p></andes-tabs-content>
        <andes-tabs-content value="grace"><p [style]="para">Grace Hopper, compiler author.</p></andes-tabs-content>
        <andes-tabs-content value="alan"><p [style]="para">Alan Turing, mathematician.</p></andes-tabs-content>
      </andes-tabs>`,
  }),
};

/** Icons with a tooltip each. */
export const IconTooltips: Story = {
  name: 'Icon-only tabs with tooltips',
  parameters: about(
    'Tabs that show only an icon name themselves with ariaLabel and a tooltip around the trigger, which opens on hover and on keyboard focus.',
  ),
  render: () => ({
    props: shared,
    template: `
      <ng-template #grid><ng-icon name="lucideLayoutGrid" /></ng-template>
      <ng-template #list><ng-icon name="lucideList" /></ng-template>
      <ng-template #table><ng-icon name="lucideTable" /></ng-template>
      <andes-tabs type="pill" style="${WIDTH}">
        <andes-tabs-list aria-label="View">
          <andes-tooltip content="Grid view" style="display: flex;"><andes-tabs-trigger andesTooltipTrigger value="grid" [icon]="grid" ariaLabel="Grid view" /></andes-tooltip>
          <andes-tooltip content="List view" style="display: flex;"><andes-tabs-trigger andesTooltipTrigger value="list" [icon]="list" ariaLabel="List view" /></andes-tooltip>
          <andes-tooltip content="Table view" style="display: flex;"><andes-tabs-trigger andesTooltipTrigger value="table" [icon]="table" ariaLabel="Table view" /></andes-tooltip>
        </andes-tabs-list>
        <andes-tabs-content value="grid"><p [style]="para">Items as a grid of cards.</p></andes-tabs-content>
        <andes-tabs-content value="list"><p [style]="para">Items as a list.</p></andes-tabs-content>
        <andes-tabs-content value="table"><p [style]="para">Items as a table.</p></andes-tabs-content>
      </andes-tabs>`,
  }),
};

/** A disabled tab that says why. */
export const DisabledTooltip: Story = {
  name: 'Disabled tab with a tooltip',
  parameters: about(
    'A tooltip around a disabled tab still opens on hover, because the dimmed tab lets the pointer through to its wrapper, so it can say why the tab is off.',
  ),
  render: () => ({
    props: shared,
    template: `
      <andes-tabs style="${WIDTH}">
        <andes-tabs-list>
          <andes-tabs-trigger value="account">Account</andes-tabs-trigger>
          <andes-tabs-trigger value="password">Password</andes-tabs-trigger>
          <andes-tooltip content="Ask an owner to turn on team billing" style="display: flex;">
            <andes-tabs-trigger andesTooltipTrigger value="billing" disabled>Billing</andes-tabs-trigger>
          </andes-tooltip>
        </andes-tabs-list>
        <andes-tabs-content value="account"><p [style]="para">Account.</p></andes-tabs-content>
        <andes-tabs-content value="password"><p [style]="para">Password.</p></andes-tabs-content>
        <andes-tabs-content value="billing"><p [style]="para">Billing.</p></andes-tabs-content>
      </andes-tabs>`,
  }),
};

/** A panel that loads. */
export const LoadingPanel: Story = {
  name: 'Panel that loads',
  parameters: about(
    'Each visit to the reports tab shows the skeleton for a moment before the content, with the bar still usable while the panel loads.',
  ),
  render: () => {
    const loading = signal(false);
    let timer: ReturnType<typeof setTimeout> | undefined;
    const load = () => {
      loading.set(true);
      clearTimeout(timer);
      timer = setTimeout(() => loading.set(false), 1200);
    };
    return {
      props: { ...shared, loading, load },
      template: `
        <andes-tabs style="${WIDTH}" (valueChange)="$event === 'reports' ? load() : null">
          <andes-tabs-list>
            <andes-tabs-trigger value="summary">Summary</andes-tabs-trigger>
            <andes-tabs-trigger value="reports">Reports</andes-tabs-trigger>
          </andes-tabs-list>
          <andes-tabs-content value="summary"><p [style]="para">Nothing to wait for here.</p></andes-tabs-content>
          <andes-tabs-content value="reports">
            <andes-skeleton [loading]="loading()">
              <p [style]="para">Quarterly figures are ready: revenue is up 8 percent.</p>
            </andes-skeleton>
          </andes-tabs-content>
        </andes-tabs>`,
    };
  },
};

/** A skeleton on the first visit only. */
export const LazyLoading: Story = {
  name: 'Panel loaded on first visit',
  parameters: about(
    'A lazy panel is built when its tab is first opened and then kept, so the skeleton shows once and a return visit is instant.',
  ),
  render: () => ({
    props: shared,
    template: `
      <andes-tabs style="${WIDTH}">
        <andes-tabs-list>
          <andes-tabs-trigger value="a">Overview</andes-tabs-trigger>
          <andes-tabs-trigger value="b">Activity</andes-tabs-trigger>
        </andes-tabs-list>
        <andes-tabs-content value="a"><p [style]="para">Opened straight away.</p></andes-tabs-content>
        <andes-tabs-content value="b">
          <ng-template andesTabsContentLazy>
            <div style="display: flex; flex-direction: column; gap: 0.75rem;">
              <andes-skeleton-text active [lines]="3" />
              <andes-story-counter />
            </div>
          </ng-template>
        </andes-tabs-content>
      </andes-tabs>`,
  }),
};

/** A form in a panel. */
export const FormPanel: Story = {
  name: 'Form in a panel',
  parameters: about(
    'A panel can hold a whole form, and the values typed in one panel stay in place while the user visits another tab and comes back.',
  ),
  render: () => ({
    props: shared,
    template: `
      <andes-tabs style="${WIDTH}">
        <andes-tabs-list>
          <andes-tabs-trigger value="profile">Profile</andes-tabs-trigger>
          <andes-tabs-trigger value="notifications">Notifications</andes-tabs-trigger>
        </andes-tabs-list>
        <andes-tabs-content value="profile">
          <div style="display: flex; flex-direction: column; gap: 1rem; max-width: 22rem;">
            <andes-form-field label="Name"><andes-input value="Ada Lovelace" /></andes-form-field>
            <andes-form-field label="Email"><andes-input type="email" placeholder="ada@example.com" /></andes-form-field>
            <andes-button style="align-self: flex-start;">Save changes</andes-button>
          </div>
        </andes-tabs-content>
        <andes-tabs-content value="notifications">
          <div style="display: flex; flex-direction: column; gap: 0.75rem;">
            <span [style]="control"><andes-switch [checked]="true">Email me about new comments</andes-switch></span>
            <span [style]="control"><andes-switch>Email me a weekly summary</andes-switch></span>
          </div>
        </andes-tabs-content>
      </andes-tabs>`,
  }),
};

/** A table in a panel. */
export const TablePanel: Story = {
  name: 'Table in a panel',
  parameters: about(
    'A panel with rows of data laid out on a grid, with a header row and a tag for each state.',
  ),
  render: () => ({
    props: {
      ...shared,
      rows: [
        { name: 'Ada Lovelace', role: 'Owner', state: 'Active' },
        { name: 'Grace Hopper', role: 'Editor', state: 'Active' },
        { name: 'Alan Turing', role: 'Viewer', state: 'Invited' },
      ],
      row: 'display: grid; grid-template-columns: 1.5fr 1fr 1fr; gap: 1rem; align-items: center; padding: 0.5rem 0; border-bottom: 1px solid var(--andes-color-border);',
    },
    template: `
      <andes-tabs style="${WIDTH}">
        <andes-tabs-list>
          <andes-tabs-trigger value="members">Members</andes-tabs-trigger>
          <andes-tabs-trigger value="roles">Roles</andes-tabs-trigger>
        </andes-tabs-list>
        <andes-tabs-content value="members">
          <div [style]="row"><span [style]="muted">Name</span><span [style]="muted">Role</span><span [style]="muted">State</span></div>
          @for (item of rows; track item.name) {
            <div [style]="row"><span [style]="strong">{{ item.name }}</span><span [style]="text">{{ item.role }}</span><span><andes-tag>{{ item.state }}</andes-tag></span></div>
          }
        </andes-tabs-content>
        <andes-tabs-content value="roles"><p [style]="para">Owner, Editor and Viewer.</p></andes-tabs-content>
      </andes-tabs>`,
  }),
};

/** A list in a panel. */
export const ListPanel: Story = {
  name: 'List in a panel',
  parameters: about(
    'A panel with a plain list of recent items, one avatar and one line each.',
  ),
  render: () => ({
    props: {
      ...shared,
      people: [
        { initials: 'AL', text: 'Ada commented on the roadmap' },
        { initials: 'GH', text: 'Grace closed 4 issues' },
        { initials: 'AT', text: 'Alan opened a pull request' },
      ],
    },
    template: `
      <andes-tabs type="card" style="${WIDTH}">
        <andes-tabs-list>
          <andes-tabs-trigger value="recent">Recent</andes-tabs-trigger>
          <andes-tabs-trigger value="mine">Mine</andes-tabs-trigger>
        </andes-tabs-list>
        <andes-tabs-content value="recent">
          <div style="display: flex; flex-direction: column; gap: 0.75rem;">
            @for (person of people; track person.initials) {
              <div style="display: flex; align-items: center; gap: 0.75rem;">
                <andes-avatar size="sm"><andes-avatar-fallback>{{ person.initials }}</andes-avatar-fallback></andes-avatar>
                <span [style]="text">{{ person.text }}</span>
              </div>
            }
          </div>
        </andes-tabs-content>
        <andes-tabs-content value="mine"><p [style]="para">Your own activity.</p></andes-tabs-content>
      </andes-tabs>`,
  }),
};

/** An empty panel. */
export const EmptyPanel: Story = {
  name: 'Empty panel',
  parameters: about(
    'A tab with nothing to show uses the empty state with a call to action, instead of a blank panel.',
  ),
  render: () => ({
    props: shared,
    template: `
      <andes-tabs style="${WIDTH}">
        <andes-tabs-list>
          <andes-tabs-trigger value="files">Files</andes-tabs-trigger>
          <andes-tabs-trigger value="links">Links</andes-tabs-trigger>
        </andes-tabs-list>
        <andes-tabs-content value="files"><p [style]="para">3 files.</p></andes-tabs-content>
        <andes-tabs-content value="links">
          <andes-empty heading="No links yet" description="Links you add show up here." />
          <div style="display: flex; justify-content: center; margin-top: 0.75rem;"><andes-button size="sm">Add a link</andes-button></div>
        </andes-tabs-content>
      </andes-tabs>`,
  }),
};

/** A tab that is remembered. */
export const RememberedTab: Story = {
  name: 'Remembered tab',
  parameters: about(
    'The active tab is saved when it changes and read back when the page opens again, here kept in the browser storage when it is available.',
  ),
  render: () => {
    const KEY = 'andes-story-tabs-remembered';
    let saved = 'password';
    try {
      saved = localStorage.getItem(KEY) ?? saved;
    } catch {
      // Storage can be blocked; the tab then simply starts on the default.
    }
    const active = signal(saved);
    return {
      props: {
        ...shared,
        active,
        save: (value: string | undefined) => {
          active.set(value ?? 'account');
          try {
            localStorage.setItem(KEY, active());
          } catch {
            // Nothing to do when storage is blocked.
          }
        },
      },
      template: `
        <div [style]="column">
          <span [style]="muted">Saved tab: <strong [style]="strong">{{ active() }}</strong>. Reload the story to see it come back.</span>
          <andes-tabs [value]="active()" (valueChange)="save($event)">${basicTabs()}</andes-tabs>
        </div>`,
    };
  },
};

/** Next and previous. */
export const Programmatic: Story = {
  name: 'Next and previous',
  parameters: about(
    'Buttons outside the tabs step through them and jump to one, which keeps the bar, the line and the panel in step with the value.',
  ),
  render: () => {
    const order = ['account', 'password', 'team'];
    const active = signal('account');
    return {
      props: {
        ...shared,
        active,
        order,
        step: (by: number) =>
          active.set(
            order[(order.indexOf(active()) + by + order.length) % order.length],
          ),
      },
      template: `
        <div [style]="column">
          <div [style]="row">
            <andes-button size="sm" variant="outline" (click)="step(-1)">Previous</andes-button>
            <andes-button size="sm" variant="outline" (click)="step(1)">Next</andes-button>
            <andes-button size="sm" variant="ghost" (click)="active.set('team')">Jump to Team</andes-button>
          </div>
          <andes-tabs [(value)]="active">${basicTabs()}</andes-tabs>
        </div>`,
    };
  },
};

/** A select on a phone. */
export const SelectOnPhone: Story = {
  name: 'Select on a phone',
  parameters: about(
    'Below 640px, or with the switch on, the tab bar gives way to a select that drives the same value, which keeps long tab names usable on a phone.',
  ),
  render: () => {
    const phone = mediaQuery('(max-width: 640px)');
    const forced = signal(false);
    const active = signal('account');
    return {
      props: { ...shared, phone, forced, active },
      template: `
        <div [style]="column">
          <span [style]="control">
            <andes-switch [checked]="forced()" (checkedChange)="forced.set($event)">Show the phone layout</andes-switch>
          </span>
          @if (phone() || forced()) {
            <andes-select aria-label="Section" [(value)]="active" style="width: 14rem;">
              <andes-select-trigger><andes-select-value /></andes-select-trigger>
              <andes-select-content>
                <andes-select-item value="account">Account</andes-select-item>
                <andes-select-item value="password">Password</andes-select-item>
                <andes-select-item value="team">Team</andes-select-item>
              </andes-select-content>
            </andes-select>
            <p [style]="para">{{ active() }} panel</p>
          } @else {
            <andes-tabs [(value)]="active">${basicTabs()}</andes-tabs>
          }
        </div>`,
    };
  },
};

/** Pill tabs in a toolbar. */
export const ToolbarPills: Story = {
  name: 'Pill tabs in a toolbar',
  parameters: about(
    'A toolbar that switches the view with small pill tabs, a search field and an action sharing one row.',
  ),
  render: () => ({
    props: shared,
    template: `
      <div [style]="card" style="width: min(46rem, calc(100vw - 2rem)); padding: 0.75rem 1rem;">
        <andes-tabs type="pill" size="sm">
          <andes-input andesTabsExtraRight placeholder="Search" aria-label="Search" style="width: 10rem;" />
          <andes-tabs-list>
            <andes-tabs-trigger value="all">All</andes-tabs-trigger>
            <andes-tabs-trigger value="open">Open</andes-tabs-trigger>
            <andes-tabs-trigger value="closed">Closed</andes-tabs-trigger>
          </andes-tabs-list>
          <andes-tabs-content value="all"><p [style]="para">All 18 tasks.</p></andes-tabs-content>
          <andes-tabs-content value="open"><p [style]="para">11 open tasks.</p></andes-tabs-content>
          <andes-tabs-content value="closed"><p [style]="para">7 closed tasks.</p></andes-tabs-content>
        </andes-tabs>
      </div>`,
  }),
};

/** A settings page. */
export const SettingsPage: Story = {
  name: 'Settings page',
  parameters: about(
    'A settings page with a side bar of long section names at the start, an icon in each, and a form in the panel.',
  ),
  render: () => ({
    props: shared,
    template: `
      <ng-template #user><ng-icon name="lucideUser" /></ng-template>
      <ng-template #bell><ng-icon name="lucideBell" /></ng-template>
      <ng-template #lock><ng-icon name="lucideLock" /></ng-template>
      <ng-template #invoice><ng-icon name="lucideCreditCard" /></ng-template>
      <div [style]="card" style="width: min(46rem, calc(100vw - 2rem)); padding: 1.25rem;">
        <andes-tabs tabPosition="left" [collapseBelow]="520" size="md">
          <andes-tabs-list aria-label="Settings sections">
            <andes-tabs-trigger value="profile" [icon]="user">Profile and public details</andes-tabs-trigger>
            <andes-tabs-trigger value="notifications" [icon]="bell">Notification preferences</andes-tabs-trigger>
            <andes-tabs-trigger value="security" [icon]="lock">Password and security</andes-tabs-trigger>
            <andes-tabs-trigger value="billing" [icon]="invoice">Billing and invoices</andes-tabs-trigger>
          </andes-tabs-list>
          <andes-tabs-content value="profile">
            <div style="display: flex; flex-direction: column; gap: 1rem; max-width: 20rem;">
              <h3 [style]="heading">Profile</h3>
              <andes-form-field label="Display name"><andes-input value="Ada Lovelace" /></andes-form-field>
              <andes-button style="align-self: flex-start;">Save</andes-button>
            </div>
          </andes-tabs-content>
          <andes-tabs-content value="notifications"><h3 [style]="heading">Notifications</h3></andes-tabs-content>
          <andes-tabs-content value="security"><h3 [style]="heading">Security</h3></andes-tabs-content>
          <andes-tabs-content value="billing"><h3 [style]="heading">Billing</h3></andes-tabs-content>
        </andes-tabs>
      </div>`,
  }),
};

/** A bar at the end. */
export const SettingsEnd: Story = {
  name: 'Navigation at the end',
  parameters: about(
    'The same kind of section list placed at the end of the panel, as a table of contents beside a long article.',
  ),
  render: () => ({
    props: shared,
    template: `
      <div [style]="card" style="width: min(44rem, calc(100vw - 2rem)); padding: 1.25rem;">
        <andes-tabs tabPosition="right" [collapseBelow]="520">
          <andes-tabs-list aria-label="Sections">
            <andes-tabs-trigger value="intro">Introduction</andes-tabs-trigger>
            <andes-tabs-trigger value="install">Installation and setup</andes-tabs-trigger>
            <andes-tabs-trigger value="usage">Usage in an application</andes-tabs-trigger>
          </andes-tabs-list>
          <andes-tabs-content value="intro"><p [style]="para">What the library is for.</p></andes-tabs-content>
          <andes-tabs-content value="install"><p [style]="para">How to add it to a project.</p></andes-tabs-content>
          <andes-tabs-content value="usage"><p [style]="para">How to use it in a component.</p></andes-tabs-content>
        </andes-tabs>
      </div>`,
  }),
};

/** A profile page. */
export const ProfilePage: Story = {
  name: 'Profile page',
  parameters: about(
    'A profile header with an avatar, a name and a tag, and line tabs under it that switch the sections of the page.',
  ),
  render: () => ({
    props: shared,
    template: `
      <div [style]="card" style="width: min(44rem, calc(100vw - 2rem)); padding: 1.25rem 1.5rem 1.5rem;">
        <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
          <andes-avatar size="lg"><andes-avatar-fallback>AL</andes-avatar-fallback></andes-avatar>
          <div>
            <h2 [style]="heading" style="font-size: 1.25rem; line-height: 1.75rem;">Ada Lovelace</h2>
            <span [style]="muted">Analyst at the Analytical Engine</span>
          </div>
          <andes-tag style="margin-inline-start: auto;">Pro</andes-tag>
        </div>
        <andes-tabs>
          <andes-tabs-list>
            <andes-tabs-trigger value="posts">Posts <andes-badge standalone [count]="24" size="small" variant="secondary" /></andes-tabs-trigger>
            <andes-tabs-trigger value="followers">Followers <andes-badge standalone [count]="1280" size="small" variant="secondary" /></andes-tabs-trigger>
            <andes-tabs-trigger value="about">About</andes-tabs-trigger>
          </andes-tabs-list>
          <andes-tabs-content value="posts"><p [style]="para">24 notes and articles.</p></andes-tabs-content>
          <andes-tabs-content value="followers"><p [style]="para">1,280 people follow Ada.</p></andes-tabs-content>
          <andes-tabs-content value="about"><p [style]="para">Wrote the first program.</p></andes-tabs-content>
        </andes-tabs>
      </div>`,
  }),
};

/** A dashboard. */
export const Dashboard: Story = {
  name: 'Dashboard',
  parameters: about(
    'A dashboard card whose segmented range switch changes the bars underneath, drawn here as plain blocks.',
  ),
  render: () => {
    const ranges: Record<string, number[]> = {
      week: [30, 55, 40, 70, 60, 85, 50],
      month: [45, 60, 35, 80, 65, 90, 75],
      year: [20, 35, 50, 65, 80, 95, 100],
    };
    return {
      props: { ...shared, ranges, keys: Object.keys(ranges) },
      template: `
        <div [style]="card" style="width: min(36rem, calc(100vw - 2rem)); padding: 1.25rem;">
          <andes-tabs type="segmented" size="sm">
            <h3 andesTabsExtraLeft [style]="heading">Revenue</h3>
            <andes-tabs-list>
              @for (key of keys; track key) { <andes-tabs-trigger [value]="key">{{ key }}</andes-tabs-trigger> }
            </andes-tabs-list>
            @for (key of keys; track key) {
              <andes-tabs-content [value]="key">
                <div style="display: flex; align-items: flex-end; gap: 0.5rem; height: 7rem;">
                  @for (height of ranges[key]; track $index) {
                    <div style="flex: 1; border-radius: 0.25rem 0.25rem 0 0; background: var(--andes-color-primary);" [style.height.%]="height"></div>
                  }
                </div>
              </andes-tabs-content>
            }
          </andes-tabs>
        </div>`,
    };
  },
};

/** Closing with a confirmation. */
export const CloseWithConfirmation: Story = {
  name: 'Close with a confirmation',
  parameters: about(
    'The close button only reports the request, so the page asks first in an alert dialog and removes the tab only when the user confirms.',
  ),
  render: () => {
    const tabs = signal(['Report', 'Budget', 'Notes']);
    const active = signal('Report');
    const asking = signal(false);
    const pending = signal<string | null>(null);
    return {
      props: {
        ...shared,
        tabs,
        active,
        asking,
        pending,
        edit: (event: AndesTabsEditEvent) => {
          if (event.action === 'remove') {
            pending.set(event.key);
            asking.set(true);
          } else {
            const name = `Draft ${tabs().length + 1}`;
            tabs.update((list) => [...list, name]);
            active.set(name);
          }
        },
        confirm: () => {
          const name = pending();
          if (name) {
            tabs.update((list) => list.filter((tab) => tab !== name));
          }
          pending.set(null);
        },
      },
      template: `
        <andes-alert-dialog [(open)]="asking" footer="default" okText="Close tab" okType="danger" (ok)="confirm()">
          <andes-alert-dialog-content *andesAlertDialogContent>
            <div andesAlertDialogHeader>
              <h2 andesAlertDialogTitle>Close {{ pending() }}?</h2>
              <p andesAlertDialogDescription>Unsaved changes in this tab are lost.</p>
            </div>
          </andes-alert-dialog-content>
        </andes-alert-dialog>
        <andes-tabs type="editable-card" [(value)]="active" (edit)="edit($event)" style="${WIDTH}">
          <andes-tabs-list>
            @for (name of tabs(); track name) { <andes-tabs-trigger [value]="name">{{ name }}</andes-tabs-trigger> }
          </andes-tabs-list>
          @for (name of tabs(); track name) {
            <andes-tabs-content [value]="name"><p [style]="para">Content of {{ name }}</p></andes-tabs-content>
          }
        </andes-tabs>`,
    };
  },
};
