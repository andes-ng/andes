import { signal } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular';

import {
  about,
  basicTabs,
  numbered,
  shared,
  tabsOf,
  withDescription,
  withTabsKit,
} from '../../testing/tabs-story-kit';
import { AndesTabs } from './tabs';

/*
 * Where the bar sits (top, bottom, start, end), how it reacts to a narrow container, and how
 * tall it is in each size and type.
 */

const meta: Meta<AndesTabs> = {
  title: 'Navigation/Tabs/Placement and size',
  component: AndesTabs,
  decorators: [withDescription, withTabsKit],
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<AndesTabs>;

const LONG_PANEL = `<p [style]="para">Update your account details here. A taller panel shows how the bar and the panel share the space on each side.</p>`;

function sided(position: string): string {
  return `<andes-tabs tabPosition="${position}" [collapseBelow]="null" style="min-height: 9rem;">
    <andes-tabs-list>
      <andes-tabs-trigger value="account">Account</andes-tabs-trigger>
      <andes-tabs-trigger value="password">Password</andes-tabs-trigger>
      <andes-tabs-trigger value="team">Team</andes-tabs-trigger>
    </andes-tabs-list>
    <andes-tabs-content value="account">${LONG_PANEL}</andes-tabs-content>
    <andes-tabs-content value="password"><p [style]="para">Change your password here.</p></andes-tabs-content>
    <andes-tabs-content value="team"><p [style]="para">Manage your team here.</p></andes-tabs-content>
  </andes-tabs>`;
}

/** The three sizes. */
export const Sizes: Story = {
  name: 'Sizes',
  parameters: about(
    'Small, medium and large bars are 28px, 36px and 44px tall, with a 14px label that grows to 16px on the large size.',
  ),
  render: () => ({
    props: { ...shared, sizes: ['sm', 'md', 'lg'] },
    template: `
      <div [style]="column">
        @for (size of sizes; track size) {
          <div>
            <span [style]="caption">{{ size }}</span>
            <andes-tabs [size]="size">${basicTabs()}</andes-tabs>
          </div>
        }
      </div>`,
  }),
};

/** Every type in every size. */
export const SizeMatrix: Story = {
  name: 'Sizes by type',
  parameters: about(
    'The four types in the three sizes on one grid: they all keep the same 28px, 36px and 44px heights so they can swap places without moving the page.',
  ),
  render: () => ({
    props: {
      ...shared,
      types: ['line', 'card', 'pill', 'segmented'],
      sizes: ['sm', 'md', 'lg'],
    },
    template: `
      <div [style]="columns">
        @for (type of types; track type) {
          <div style="display: flex; flex-direction: column; gap: 1rem;">
            @for (size of sizes; track size) {
              <div>
                <span [style]="caption">{{ type }} / {{ size }}</span>
                <andes-tabs [type]="type" [size]="size">
                  <andes-tabs-list>
                    <andes-tabs-trigger value="a">Overview</andes-tabs-trigger>
                    <andes-tabs-trigger value="b">Activity</andes-tabs-trigger>
                    <andes-tabs-trigger value="c">Settings</andes-tabs-trigger>
                  </andes-tabs-list>
                </andes-tabs>
              </div>
            }
          </div>
        }
      </div>`,
  }),
};

/** The bar above the panel. */
export const Top: Story = {
  name: 'Top',
  parameters: about(
    'The default: the bar sits above its panel, and the left and right arrow keys move between the tabs.',
  ),
  render: () => ({
    props: shared,
    template: `<div [style]="column">${sided('top')}</div>`,
  }),
};

/** The bar under the panel. */
export const Bottom: Story = {
  name: 'Bottom',
  parameters: about(
    'The bar sits under the panel and its line and indicator move to the top edge, next to the panel, while the tablist stays first in the tab order.',
  ),
  render: () => ({
    props: shared,
    template: `<div [style]="column">${sided('bottom')}</div>`,
  }),
};

/** The bar at the start. */
export const Start: Story = {
  name: 'Start',
  parameters: about(
    'The bar runs down the start side of the panel, the up and down arrow keys move between the tabs, and a right-to-left page puts it on the right.',
  ),
  render: () => ({
    props: shared,
    template: `<div [style]="column">${sided('left')}</div>`,
  }),
};

/** The bar at the end. */
export const End: Story = {
  name: 'End',
  parameters: about(
    'The bar runs down the end side of the panel, with its line and indicator on the edge that faces the panel.',
  ),
  render: () => ({
    props: shared,
    template: `<div [style]="column">${sided('right')}</div>`,
  }),
};

/** A tall vertical bar. */
export const VerticalMany: Story = {
  name: 'Vertical with many tabs',
  parameters: about(
    'A side bar with more tabs than fit in the height scrolls up and down, fades at the edges that hide tabs and lists the hidden ones in the overflow menu.',
  ),
  render: () => ({
    props: { ...shared, names: numbered(24, 'Section') },
    template: `
      <andes-tabs tabPosition="left" [collapseBelow]="null" style="height: 18rem; width: min(36rem, calc(100vw - 2rem));">
        <andes-tabs-list>
          @for (name of names; track name) {
            <andes-tabs-trigger [value]="name">{{ name }}</andes-tabs-trigger>
          }
        </andes-tabs-list>
        @for (name of names; track name) {
          <andes-tabs-content [value]="name"><p [style]="para">Content of {{ name }}</p></andes-tabs-content>
        }
      </andes-tabs>`,
  }),
};

/** A side bar that moves to the top. */
export const Responsive: Story = {
  name: 'Side bar on a narrow container',
  parameters: about(
    'A start or end bar moves to the top once the tabs are narrower than collapseBelow (480px by default), so a phone or a small dialog never squeezes its panel; switch the container width to see it.',
  ),
  render: () => {
    const narrow = signal(false);
    return {
      props: { ...shared, narrow },
      template: `
        <div style="display: flex; flex-direction: column; gap: 1rem;">
          <span [style]="control">
            <andes-switch [checked]="narrow()" (checkedChange)="narrow.set($event)">Narrow container (360px)</andes-switch>
          </span>
          <div [style.width.px]="narrow() ? 360 : 640" style="max-width: 100%;">
            ${sided('left').replace('[collapseBelow]="null"', '[collapseBelow]="480"')}
          </div>
        </div>`,
    };
  },
};

/** Tabs that share the bar. */
export const Stretch: Story = {
  name: 'Full-width tabs',
  parameters: about(
    'stretch gives each tab an equal share of the whole bar, so three tabs fill the width of the panel under them.',
  ),
  render: () => ({
    props: shared,
    template: `<div [style]="column">${tabsOf('stretch')}${tabsOf('stretch type="card"')}</div>`,
  }),
};

/** Equal-width segments. */
export const StretchSegments: Story = {
  name: 'Equal-width pills and segments',
  parameters: about(
    'The pill track and the segmented group spread over the full width too, which suits a switch between two or three views at the top of a narrow column.',
  ),
  render: () => ({
    props: shared,
    template: `<div [style]="column">${tabsOf('stretch type="pill"')}${tabsOf('stretch type="segmented"')}</div>`,
  }),
};

/** Tabs in a dialog. */
export const SizeInDialog: Story = {
  name: 'Size in a dialog',
  parameters: about(
    'A dialog is the place for the small size: the tabs sit under the title at 28px so the body keeps its room.',
  ),
  render: () => ({
    props: shared,
    template: `
      <andes-dialog>
        <andes-button andesDialogTrigger>Open preferences</andes-button>
        <andes-dialog-content *andesDialogContent>
          <div andesDialogHeader>
            <h2 andesDialogTitle>Preferences</h2>
            <p andesDialogDescription>Choose what to change.</p>
          </div>
          <andes-tabs size="sm" type="pill">${basicTabs()}</andes-tabs>
          <div andesDialogFooter>
            <andes-button variant="secondary" andesDialogClose>Cancel</andes-button>
            <andes-button andesDialogClose>Save</andes-button>
          </div>
        </andes-dialog-content>
      </andes-dialog>`,
  }),
};

/** Tabs in a page header. */
export const SizeInPageHeader: Story = {
  name: 'Size in a page header',
  parameters: about(
    'A page header uses the large size under its title, with the actions at the end of the same bar.',
  ),
  render: () => ({
    props: shared,
    template: `
      <div [style]="card" style="width: min(44rem, calc(100vw - 2rem)); padding: 1.25rem 1.5rem 1.5rem;">
        <h2 [style]="heading" style="font-size: 1.25rem; line-height: 1.75rem;">Project settings</h2>
        <p [style]="muted" style="margin: 0.25rem 0 1rem;">Manage the project and who can see it.</p>
        <andes-tabs size="lg">
          <andes-button andesTabsExtraRight size="sm">Save changes</andes-button>
          ${basicTabs()}
        </andes-tabs>
      </div>`,
  }),
};
