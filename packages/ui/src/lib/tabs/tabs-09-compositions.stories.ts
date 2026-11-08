import { signal } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular';

import {
  about,
  basicTabs,
  shared,
  withDescription,
  withTabsKit,
} from '../../testing/tabs-story-kit';
import { AndesTabs } from './tabs';

/*
 * Tabs inside the things they usually live in: a card, a dialog, a side panel, nested in
 * another set of tabs, and tied to the address of the page.
 */

const meta: Meta<AndesTabs> = {
  title: 'Navigation/Tabs/Compositions',
  component: AndesTabs,
  decorators: [withDescription, withTabsKit],
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<AndesTabs>;

/** Tabs in a card. */
export const InCard: Story = {
  name: 'In a card',
  parameters: about(
    'A card whose header carries the title and a pill switch, and whose body is the panel, with no rule of its own under the bar.',
  ),
  render: () => ({
    props: shared,
    template: `
      <div [style]="card" style="width: min(34rem, calc(100vw - 2rem)); overflow: hidden;">
        <andes-tabs type="pill" size="sm" style="gap: 0;">
          <div andesTabsExtraLeft style="padding-inline-end: 1rem;"><h3 [style]="heading">Usage</h3></div>
          <andes-tabs-list>
            <andes-tabs-trigger value="day">Day</andes-tabs-trigger>
            <andes-tabs-trigger value="week">Week</andes-tabs-trigger>
            <andes-tabs-trigger value="month">Month</andes-tabs-trigger>
          </andes-tabs-list>
          <andes-tabs-content value="day"><p [style]="para">1,204 requests today.</p></andes-tabs-content>
          <andes-tabs-content value="week"><p [style]="para">8,460 requests this week.</p></andes-tabs-content>
          <andes-tabs-content value="month"><p [style]="para">37,912 requests this month.</p></andes-tabs-content>
        </andes-tabs>
      </div>`,
  }),
};

/** Tabs in a dialog. */
export const InDialog: Story = {
  name: 'In a dialog',
  parameters: about(
    'A dialog body with a form split over two tabs, so a long set of settings does not make the dialog scroll.',
  ),
  render: () => ({
    props: shared,
    template: `
      <andes-dialog>
        <andes-button andesDialogTrigger>Edit profile</andes-button>
        <andes-dialog-content *andesDialogContent>
          <div andesDialogHeader>
            <h2 andesDialogTitle>Edit profile</h2>
            <p andesDialogDescription>Change how you appear to others.</p>
          </div>
          <andes-tabs size="sm">
            <andes-tabs-list>
              <andes-tabs-trigger value="general">General</andes-tabs-trigger>
              <andes-tabs-trigger value="privacy">Privacy</andes-tabs-trigger>
            </andes-tabs-list>
            <andes-tabs-content value="general">
              <andes-form-field label="Name"><andes-input value="Ada Lovelace" /></andes-form-field>
            </andes-tabs-content>
            <andes-tabs-content value="privacy">
              <span [style]="control"><andes-switch [checked]="true">Show my profile to everyone</andes-switch></span>
            </andes-tabs-content>
          </andes-tabs>
          <div andesDialogFooter>
            <andes-button variant="secondary" andesDialogClose>Cancel</andes-button>
            <andes-button andesDialogClose>Save</andes-button>
          </div>
        </andes-dialog-content>
      </andes-dialog>`,
  }),
};

/** Tabs in a side panel. */
export const InSidePanel: Story = {
  name: 'In a side panel',
  parameters: about(
    'A narrow panel that sits at the edge of a page, with stretched pill tabs under its title so the choice fills the width of the panel.',
  ),
  render: () => ({
    props: shared,
    template: `
      <div [style]="card" style="width: 22rem; max-width: 100%; padding: 1.25rem; display: flex; flex-direction: column; gap: 1rem;">
        <h3 [style]="heading">Details</h3>
        <andes-tabs type="pill" size="sm" stretch>
          <andes-tabs-list>
            <andes-tabs-trigger value="info">Info</andes-tabs-trigger>
            <andes-tabs-trigger value="history">History</andes-tabs-trigger>
            <andes-tabs-trigger value="files">Files</andes-tabs-trigger>
          </andes-tabs-list>
          <andes-tabs-content value="info"><p [style]="para">Created by Ada on 12 March.</p></andes-tabs-content>
          <andes-tabs-content value="history"><p [style]="para">Edited 3 times.</p></andes-tabs-content>
          <andes-tabs-content value="files"><p [style]="para">2 files attached.</p></andes-tabs-content>
        </andes-tabs>
      </div>`,
  }),
};

/** Tabs inside tabs. */
export const Nested: Story = {
  name: 'Nested tabs',
  parameters: about(
    'Each set of tabs owns its selection and its keyboard, so a card-type set can sit inside the panel of a side bar.',
  ),
  render: () => ({
    props: shared,
    template: `
      <andes-tabs tabPosition="left" [collapseBelow]="null" style="width: min(40rem, calc(100vw - 2rem));">
        <andes-tabs-list>
          <andes-tabs-trigger value="sales">Sales</andes-tabs-trigger>
          <andes-tabs-trigger value="stock">Stock</andes-tabs-trigger>
        </andes-tabs-list>
        <andes-tabs-content value="sales"><andes-tabs type="card" size="sm">${basicTabs()}</andes-tabs></andes-tabs-content>
        <andes-tabs-content value="stock"><p [style]="para">Stock levels.</p></andes-tabs-content>
      </andes-tabs>`,
  }),
};

/** Tabs that follow the address. */
export const RouterTabs: Story = {
  name: 'Tabs tied to the address',
  parameters: about(
    'The active tab is derived from the path and a change writes the path back, which is how tabs mirror a router: the address bar below stands in for it.',
  ),
  render: () => {
    const path = signal('/projects/issues');
    return {
      props: {
        ...shared,
        path,
        tab: () => path().split('/').pop(),
        go: (value: string | undefined) => path.set(`/projects/${value}`),
      },
      template: `
        <div [style]="column">
          <div [style]="card" style="padding: 0.5rem 0.75rem;"><span [style]="muted">Address</span> <strong [style]="strong">{{ path() }}</strong></div>
          <andes-tabs [value]="tab()" (valueChange)="go($event)">
            <andes-tabs-list aria-label="Project">
              <andes-tabs-trigger value="overview">Overview</andes-tabs-trigger>
              <andes-tabs-trigger value="issues">Issues</andes-tabs-trigger>
              <andes-tabs-trigger value="settings">Settings</andes-tabs-trigger>
            </andes-tabs-list>
            <andes-tabs-content value="overview"><p [style]="para">The project at a glance.</p></andes-tabs-content>
            <andes-tabs-content value="issues"><p [style]="para">Open and closed issues.</p></andes-tabs-content>
            <andes-tabs-content value="settings"><p [style]="para">Project settings.</p></andes-tabs-content>
          </andes-tabs>
          <andes-button size="sm" variant="outline" style="align-self: flex-start;" (click)="path.set('/projects/overview')">Follow a link to /projects/overview</andes-button>
        </div>`,
    };
  },
};
