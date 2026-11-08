import { moveItemInArray } from '@angular/cdk/drag-drop';
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
import type { AndesTabsReorderEvent } from './tabs-types';

/*
 * Content around the tabs (at the start, the end or both), the bar's own styling, a sticky bar,
 * labels drawn from templates, and tabs the user reorders.
 */

const meta: Meta<AndesTabs> = {
  title: 'Navigation/Tabs/Extra content and custom bar',
  component: AndesTabs,
  decorators: [withDescription, withTabsKit],
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<AndesTabs>;

/** Extra content at the end of the bar. */
export const ExtraEnd: Story = {
  name: 'Extra content at the end',
  parameters: about(
    'An element marked andesTabsExtraRight sits at the end of the bar, level with the tabs, which suits the main action of the page.',
  ),
  render: () => ({
    props: shared,
    template: `
      <andes-tabs style="width: min(40rem, calc(100vw - 2rem));">
        <andes-button andesTabsExtraRight size="sm" variant="outline"><ng-icon name="lucideDownload" /> Export</andes-button>
        ${basicTabs()}
      </andes-tabs>`,
  }),
};

/** Extra content at the start of the bar. */
export const ExtraStart: Story = {
  name: 'Extra content at the start',
  parameters: about(
    'An element marked andesTabsExtraLeft sits before the first tab, here a title that names what the tabs belong to.',
  ),
  render: () => ({
    props: shared,
    template: `
      <andes-tabs style="width: min(40rem, calc(100vw - 2rem));">
        <span andesTabsExtraLeft [style]="strong" style="padding-inline-end: 1.5rem;">Project</span>
        ${basicTabs()}
      </andes-tabs>`,
  }),
};

/** Extra content on both sides. */
export const ExtraBoth: Story = {
  name: 'Extra content on both sides',
  parameters: about(
    'Both slots can be used at once, with a title before the tabs and a pair of actions after them, and the rule runs under all of it.',
  ),
  render: () => ({
    props: shared,
    template: `
      <andes-tabs style="width: min(44rem, calc(100vw - 2rem));">
        <span andesTabsExtraLeft [style]="strong" style="padding-inline-end: 1.5rem;">Project</span>
        <div andesTabsExtraRight [style]="row">
          <andes-tag>Draft</andes-tag>
          <andes-button size="sm">Publish</andes-button>
        </div>
        ${basicTabs()}
      </andes-tabs>`,
  }),
};

/** Extra content from templates. */
export const ExtraTemplates: Story = {
  name: 'Extra content from templates',
  parameters: about(
    'tabBarExtraContent takes one template for the end of the bar, or an object with a left and a right template, for tabs built from data.',
  ),
  render: () => ({
    props: {
      ...shared,
      items: [
        { key: 'a', label: 'Overview', content: 'Overview content.' },
        { key: 'b', label: 'Activity', content: 'Activity content.' },
      ],
    },
    template: `
      <ng-template #left><span [style]="strong" style="padding-inline-end: 1rem;">Team</span></ng-template>
      <ng-template #right><andes-button size="sm" variant="outline">Invite</andes-button></ng-template>
      <div style="display: flex; flex-direction: column; gap: 1.5rem; width: min(40rem, calc(100vw - 2rem));">
        <div><span [style]="caption">One template (end)</span><andes-tabs [items]="items" [tabBarExtraContent]="right" /></div>
        <div><span [style]="caption">Left and right</span><andes-tabs [items]="items" [tabBarExtraContent]="{ left: left, right: right }" /></div>
      </div>`,
  }),
};

/** Styling the bar. */
export const BarStyle: Story = {
  name: 'Bar style and gutter',
  parameters: about(
    'tabBarGutter sets the space between tabs in px, and tabBarStyle and tabBarClass style the bar itself, here with a tinted strip and wider tabs.',
  ),
  render: () => ({
    props: {
      ...shared,
      barStyle: {
        background: 'var(--andes-color-muted)',
        padding: '0 1rem',
        borderRadius: '0.5rem',
      },
    },
    template: `
      <div style="display: flex; flex-direction: column; gap: 1.5rem; width: min(36rem, calc(100vw - 2rem));">
        <div><span [style]="caption">tabBarGutter 8</span><andes-tabs [tabBarGutter]="8">${basicTabs()}</andes-tabs></div>
        <div><span [style]="caption">tabBarGutter 48</span><andes-tabs [tabBarGutter]="48">${basicTabs()}</andes-tabs></div>
        <div><span [style]="caption">tabBarStyle</span><andes-tabs [tabBarStyle]="barStyle" [tabBarGutter]="20">${basicTabs()}</andes-tabs></div>
      </div>`,
  }),
};

/** A bar that stays in view. */
export const StickyBar: Story = {
  name: 'Sticky bar',
  parameters: about(
    'tabBarStyle with position sticky keeps the bar at the top of a scrolling area while a long panel moves under it.',
  ),
  render: () => ({
    props: {
      ...shared,
      sticky: {
        position: 'sticky',
        top: 0,
        zIndex: 2,
        background: 'var(--andes-color-background)',
      },
      lines: Array.from({ length: 24 }, (_, i) => i + 1),
    },
    template: `
      <div style="height: 14rem; overflow-y: auto; width: min(36rem, calc(100vw - 2rem)); border: 1px solid var(--andes-color-border); border-radius: var(--andes-radius-lg); padding: 0 1rem 1rem;">
        <andes-tabs [tabBarStyle]="sticky">
          <andes-tabs-list>
            <andes-tabs-trigger value="a">Overview</andes-tabs-trigger>
            <andes-tabs-trigger value="b">Activity</andes-tabs-trigger>
          </andes-tabs-list>
          <andes-tabs-content value="a">
            @for (line of lines; track line) { <p [style]="para" style="padding: 0.25rem 0;">Line {{ line }} of a long panel.</p> }
          </andes-tabs-content>
          <andes-tabs-content value="b"><p [style]="para">Activity.</p></andes-tabs-content>
        </andes-tabs>
      </div>`,
  }),
};

/** Labels drawn by the consumer. */
export const TemplateLabels: Story = {
  name: 'Labels from templates',
  parameters: about(
    'An item label can be a template, so each tab can hold an icon, a count and a status tag drawn by the consumer.',
  ),
  render: () => ({
    props: {
      ...shared,
      itemsFor: (inbox: unknown, drafts: unknown, sent: unknown) => [
        { key: 'inbox', label: inbox, content: 'Unread messages.' },
        {
          key: 'drafts',
          label: drafts,
          content: 'Messages you have not sent.',
        },
        { key: 'sent', label: sent, content: 'Messages you sent.' },
      ],
    },
    template: `
      <ng-template #inbox><ng-icon name="lucideInbox" /> Inbox <andes-badge [count]="12" /></ng-template>
      <ng-template #drafts><ng-icon name="lucideFileText" /> Drafts <andes-tag>3</andes-tag></ng-template>
      <ng-template #sent><ng-icon name="lucideMail" /> Sent</ng-template>
      <div [style]="column"><andes-tabs type="card" [items]="itemsFor(inbox, drafts, sent)" /></div>`,
  }),
};

function sortable(initial: string[]) {
  const tabs = signal(initial);
  const log = signal<string[]>([]);
  return {
    tabs,
    log,
    reordered: (event: AndesTabsReorderEvent) => {
      tabs.update((list) => {
        const next = [...list];
        moveItemInArray(next, event.previousIndex, event.currentIndex);
        return next;
      });
      log.update((entries) =>
        [
          `${event.key}: ${event.previousIndex + 1} to ${event.currentIndex + 1}`,
          ...entries,
        ].slice(0, 4),
      );
    },
  };
}

const SORTABLE_TEMPLATE = (attributes: string) => `
  <andes-tabs draggable (reorder)="reordered($event)" ${attributes} style="width: min(36rem, calc(100vw - 2rem));">
    <andes-tabs-list>
      @for (name of tabs(); track name) {
        <andes-tabs-trigger [value]="name">{{ name }}</andes-tabs-trigger>
      }
    </andes-tabs-list>
    @for (name of tabs(); track name) {
      <andes-tabs-content [value]="name"><p [style]="para">Content of {{ name }}</p></andes-tabs-content>
    }
  </andes-tabs>`;

/** Reordering with the pointer. */
export const Draggable: Story = {
  name: 'Draggable tabs',
  parameters: about(
    'draggable lets the user drag a tab to a new place while the others slide aside, and the reorder event reports the move for the consumer to apply.',
  ),
  render: () => ({
    props: {
      ...shared,
      ...sortable(['Overview', 'Activity', 'Members', 'Billing']),
    },
    template: SORTABLE_TEMPLATE(''),
  }),
};

/** Reordering the card type. */
export const DraggableCard: Story = {
  name: 'Draggable card tabs',
  parameters: about(
    'The card and pill types reorder the same way, and the lifted tab keeps its look while it follows the pointer.',
  ),
  render: () => ({
    props: {
      ...shared,
      ...sortable(['Overview', 'Activity', 'Members', 'Billing']),
    },
    template: `
      <div [style]="column">
        ${SORTABLE_TEMPLATE('type="card"')}
        ${SORTABLE_TEMPLATE('type="pill"')}
      </div>`,
  }),
};

/** Reordering with the keyboard. */
export const DraggableKeyboard: Story = {
  name: 'Reordering with the keyboard',
  parameters: about(
    'Alt and Shift with an arrow key moves the focused tab one step along the bar, and the moves are listed below as the reorder event reports them.',
  ),
  render: () => {
    const state = sortable(['Overview', 'Activity', 'Members', 'Billing']);
    return {
      props: { ...shared, ...state },
      template: `
        <div [style]="column">
          ${SORTABLE_TEMPLATE('')}
          <span [style]="muted">Moves: {{ log().join('; ') || 'none yet' }}</span>
        </div>`,
    };
  },
};
