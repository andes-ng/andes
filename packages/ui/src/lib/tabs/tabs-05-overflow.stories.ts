import { signal } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular';

import {
  about,
  numbered,
  shared,
  withDescription,
  withTabsKit,
} from '../../testing/tabs-story-kit';
import { AndesTabs } from './tabs';
import type { AndesTabsScrollEvent } from './tabs-types';

/*
 * What happens when there are more tabs than the bar can show: scrolling, the edge fades and
 * arrows, the overflow menu and the ways to change it, and bringing a tab into view.
 */

const meta: Meta<AndesTabs> = {
  title: 'Navigation/Tabs/Overflow',
  component: AndesTabs,
  decorators: [withDescription, withTabsKit],
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<AndesTabs>;

const NAMES = numbered(30, 'Tab');

/** Thirty tabs, on whichever bar `attributes` describe. */
function many(
  attributes = '',
  extra = '',
  width = '36rem',
  style = '',
): string {
  return `
    <andes-tabs ${attributes} style="width: min(${width}, calc(100vw - 2rem)); ${style}">
      ${extra}
      <andes-tabs-list>
        @for (name of names; track name) {
          <andes-tabs-trigger [value]="name">{{ name }}</andes-tabs-trigger>
        }
      </andes-tabs-list>
      @for (name of names; track name) {
        <andes-tabs-content [value]="name"><p [style]="para">Content of {{ name }}</p></andes-tabs-content>
      }
    </andes-tabs>`;
}

const withNames = { ...shared, names: NAMES };

/** Scrolling sideways. */
export const Scrolling: Story = {
  name: 'Scrolling',
  parameters: about(
    'Thirty tabs scroll sideways with the wheel, a swipe or the arrow buttons, and the bar fades at each edge that still has tabs behind it.',
  ),
  render: () => ({
    props: withNames,
    template: many(),
  }),
};

/** Scrolling downward. */
export const ScrollingVertical: Story = {
  name: 'Scrolling vertically',
  parameters: about(
    'A side bar scrolls up and down instead, with the arrows above and below it and the fades at the top and bottom.',
  ),
  render: () => ({
    props: withNames,
    template: many(
      'tabPosition="left" [collapseBelow]="null"',
      '',
      '30rem',
      'height: 16rem;',
    ),
  }),
};

/** The overflow menu. */
export const MoreMenu: Story = {
  name: 'Overflow menu',
  parameters: about(
    'Once the tabs overflow, a more button lists the ones scrolled out of view, and picking one selects it and scrolls it into place.',
  ),
  render: () => ({
    props: withNames,
    template: many('', '', '32rem'),
  }),
};

/** The menu with a search field. */
export const MoreSearch: Story = {
  name: 'Overflow menu with search',
  parameters: about(
    'moreSearch adds a search field that filters the hidden tabs, with the arrow keys moving through the matches and Enter picking one.',
  ),
  render: () => ({
    props: withNames,
    template: many(
      'moreSearch moreSearchPlaceholder="Find a tab"',
      '',
      '32rem',
    ),
  }),
};

/** The menu as the consumer draws it. */
export const MoreCustom: Story = {
  name: 'Custom overflow popup',
  parameters: about(
    'moreTemplate replaces the menu body with the consumer markup, which receives the hidden tabs plus select and close functions, here a search field over a list of buttons.',
  ),
  render: () => {
    const query = signal('');
    return {
      props: {
        ...withNames,
        query,
        matches: (tabs: readonly { label: string }[], q: string) =>
          tabs.filter((tab) =>
            tab.label.toLowerCase().includes(q.trim().toLowerCase()),
          ),
      },
      template: `
        <ng-template #menu let-hidden let-select="select" let-close="close">
          <div style="display: flex; flex-direction: column; gap: 0.5rem; width: 14rem;">
            <andes-input aria-label="Search tabs" placeholder="Search {{ hidden.length }} hidden tabs" [(value)]="query" />
            <div style="display: flex; flex-direction: column; max-height: 12rem; overflow-y: auto;">
              @for (tab of matches(hidden, query()); track tab.key) {
                <andes-button variant="ghost" size="sm" style="justify-content: flex-start;" (click)="select(tab.key)">{{ tab.label }}</andes-button>
              } @empty {
                <span [style]="muted" style="padding: 0.25rem 0.5rem;">No tab matches.</span>
              }
            </div>
            <andes-button variant="outline" size="sm" (click)="close()">Close</andes-button>
          </div>
        </ng-template>
        ${many('[moreTemplate]="menu"', '', '32rem')}`,
    };
  },
};

/** The menu opened by the pointer. */
export const MoreHover: Story = {
  name: 'Overflow menu on hover',
  parameters: about(
    'moreTrigger set to hover opens the menu when the pointer rests on the button, while a click still opens it and hands it the keyboard.',
  ),
  render: () => ({
    props: withNames,
    template: many('moreTrigger="hover"', '', '32rem'),
  }),
};

/** Another button for the menu. */
export const MoreIcon: Story = {
  name: 'Custom overflow button',
  parameters: about(
    'moreIcon swaps the ellipsis for any icon and moreLabel renames the button for assistive technology.',
  ),
  render: () => ({
    props: withNames,
    template: `
      <ng-template #icon><ng-icon name="lucideList" /></ng-template>
      ${many('[moreIcon]="icon" moreLabel="All sections"', '', '32rem')}`,
  }),
};

/** Arrows without a menu. */
export const NoMore: Story = {
  name: 'Arrows only',
  parameters: about(
    'more set to false hides the overflow button and leaves the arrows and the edge fades as the only way to reach a hidden tab with the pointer.',
  ),
  render: () => ({
    props: withNames,
    template: many('[more]="false"', '', '32rem'),
  }),
};

/** Bringing a tab into view. */
export const ScrollToActive: Story = {
  name: 'Scroll to the active tab',
  parameters: about(
    'Selecting a tab from code, here with the buttons above, scrolls the bar until that tab is fully in view and moves the line to it.',
  ),
  render: () => {
    const active = signal('Tab 1');
    return {
      props: { ...withNames, active },
      template: `
        <div style="display: flex; flex-direction: column; gap: 1rem;">
          <div [style]="row">
            <andes-button size="sm" variant="outline" (click)="active.set('Tab 1')">First</andes-button>
            <andes-button size="sm" variant="outline" (click)="active.set('Tab 15')">Middle</andes-button>
            <andes-button size="sm" variant="outline" (click)="active.set('Tab 30')">Last</andes-button>
          </div>
          ${many('[(value)]="active"', '', '32rem')}
        </div>`,
    };
  },
};

/** The scroll event. */
export const ScrollEvents: Story = {
  name: 'Scroll events',
  parameters: about(
    'tabScroll reports the direction of every scroll of the bar, from the arrows, the wheel, a swipe or focus.',
  ),
  render: () => {
    const log = signal<string[]>([]);
    return {
      props: {
        ...withNames,
        log,
        scrolled: (event: AndesTabsScrollEvent) =>
          log.update((list) => [event.direction, ...list].slice(0, 5)),
      },
      template: `
        <div style="display: flex; flex-direction: column; gap: 1rem;">
          <span [style]="muted">Last scrolls: {{ log().join(', ') || 'none yet' }}</span>
          ${many('(tabScroll)="scrolled($event)"', '', '32rem')}
        </div>`,
    };
  },
};

/** Many tabs that can be closed. */
export const ManyEditable: Story = {
  name: 'Many closable tabs',
  parameters: about(
    'An editable card bar with thirty tabs scrolls like any other, and the overflow menu keeps a close button on each hidden tab.',
  ),
  render: () => {
    const tabs = signal(NAMES);
    return {
      props: {
        ...shared,
        tabs,
        edit: (event: { action: string; key?: string }) => {
          if (event.action === 'remove') {
            tabs.update((list) => list.filter((name) => name !== event.key));
          } else {
            tabs.update((list) => [...list, `Tab ${list.length + 1}`]);
          }
        },
      },
      template: `
        <andes-tabs type="editable-card" (edit)="edit($any($event))" style="width: min(36rem, calc(100vw - 2rem));">
          <andes-tabs-list>
            @for (name of tabs(); track name) {
              <andes-tabs-trigger [value]="name">{{ name }}</andes-tabs-trigger>
            }
          </andes-tabs-list>
          @for (name of tabs(); track name) {
            <andes-tabs-content [value]="name"><p [style]="para">Content of {{ name }}</p></andes-tabs-content>
          }
        </andes-tabs>`,
    };
  },
};
