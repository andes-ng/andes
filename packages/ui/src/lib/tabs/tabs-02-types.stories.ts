import { signal } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular';

import {
  about,
  basicTabs,
  caption,
  numbered,
  shared,
  tabsOf,
  withDescription,
  withTabsKit,
} from '../../testing/tabs-story-kit';
import { AndesTabs } from './tabs';
import type { AndesTabsEditEvent } from './tabs-types';

/*
 * The five looks of the bar: the line, the card, the pill and segmented types with a gliding
 * thumb, and the editable card that adds and closes tabs, then the motion of the thumb.
 */

const meta: Meta<AndesTabs> = {
  title: 'Navigation/Tabs/Types',
  component: AndesTabs,
  decorators: [withDescription, withTabsKit],
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<AndesTabs>;

interface DemoTab {
  key: string;
  title: string;
  closable?: boolean;
}

/** The state and the `(edit)` handler of an editable demo: the consumer owns the list. */
function editableDemo(first = 3, closableFirst = true) {
  let next = first + 1;
  const tabs = signal<DemoTab[]>(
    Array.from({ length: first }, (_, i) => ({
      key: `tab-${i + 1}`,
      title: `Tab ${i + 1}`,
      closable: i === 0 ? closableFirst : true,
    })),
  );
  const active = signal('tab-1');
  const edit = (event: AndesTabsEditEvent) => {
    if (event.action === 'add') {
      const key = `tab-${next}`;
      tabs.update((list) => [...list, { key, title: `Tab ${next++}` }]);
      active.set(key);
    } else {
      tabs.update((list) => list.filter((tab) => tab.key !== event.key));
    }
  };
  return { tabs, active, edit };
}

/** The editable markup, with `attributes` on the tabs and `extra` projected into the bar. */
function editableTemplate(attributes = '', extra = '') {
  return `
    <andes-tabs type="editable-card" [(value)]="active" (edit)="edit($event)" ${attributes}>
      ${extra}
      <andes-tabs-list>
        @for (tab of tabs(); track tab.key) {
          <andes-tabs-trigger [value]="tab.key" [closable]="tab.closable !== false">{{ tab.title }}</andes-tabs-trigger>
        }
      </andes-tabs-list>
      @for (tab of tabs(); track tab.key) {
        <andes-tabs-content [value]="tab.key"><p [style]="para">Content of {{ tab.title }}</p></andes-tabs-content>
      }
    </andes-tabs>`;
}

/** The default look. */
export const Line: Story = {
  name: 'Line',
  parameters: about(
    'The default: plain labels over a thin rule, with a sliding line under the active tab, 36px tall in the medium size.',
  ),
  render: () => ({
    props: shared,
    template: `<div [style]="column">${tabsOf('type="line"')}</div>`,
  }),
};

/** Enclosed tabs. */
export const Card: Story = {
  name: 'Card',
  parameters: about(
    'Each tab is a small card and the active one merges into the panel under it, which suits a page where the tabs head a bordered area.',
  ),
  render: () => ({
    props: shared,
    template: `<div [style]="column">${tabsOf('type="card"')}</div>`,
  }),
};

/** A tinted thumb behind the active tab. */
export const Pill: Story = {
  name: 'Pill',
  parameters: about(
    'A tinted, rounded thumb sits behind the active tab, whose label takes the primary colour, and glides to the next tab when the selection changes, a quiet look for secondary navigation.',
  ),
  render: () => ({
    props: shared,
    template: `<div [style]="column">${tabsOf('type="pill"')}</div>`,
  }),
};

/** A muted track with a white thumb. */
export const Segmented: Story = {
  name: 'Segmented',
  parameters: about(
    'The tabs sit in a muted rounded track and a white, raised thumb glides behind the active one, the same look as the segmented control.',
  ),
  render: () => ({
    props: shared,
    template: `<div [style]="column">${tabsOf('type="segmented"')}</div>`,
  }),
};

/** All the looks together. */
export const Together: Story = {
  name: 'All types together',
  parameters: about(
    'The same three tabs in every type, one under the other, to compare their height, spacing and the way the active tab is marked, with the thumb sliding in the pill and segmented ones.',
  ),
  render: () => ({
    props: { ...shared, types: ['line', 'card', 'pill', 'segmented'] },
    template: `
      <div [style]="column">
        @for (type of types; track type) {
          <div>
            <span [style]="caption">{{ type }}</span>
            <andes-tabs [type]="type">${basicTabs()}</andes-tabs>
          </div>
        }
      </div>`,
  }),
};

/** Card tabs down the side. */
export const VerticalCard: Story = {
  name: 'Vertical card',
  parameters: about(
    'The card type works down the side as well: the active card opens toward the panel, and the bar mirrors in a right-to-left page.',
  ),
  render: () => ({
    props: { ...shared, caption },
    template: `
      <div [style]="column">
        <andes-tabs type="card" tabPosition="left" [collapseBelow]="null">${basicTabs()}</andes-tabs>
        <andes-tabs type="card" tabPosition="right" [collapseBelow]="null">${basicTabs()}</andes-tabs>
      </div>`,
  }),
};

/** Tabs the user adds and closes. */
export const EditableCard: Story = {
  name: 'Editable card',
  parameters: about(
    'The editable card shows a close button on each tab and an add button at the end of the bar, and both only report the request while the consumer changes its own list.',
  ),
  render: () => ({
    props: { ...shared, ...editableDemo() },
    template: `<div [style]="column">${editableTemplate()}</div>`,
  }),
};

/** A tab that cannot be closed. */
export const EditableNotClosable: Story = {
  name: 'Editable card with a fixed tab',
  parameters: about(
    'Setting closable to false on a trigger keeps its close button away, so a first tab such as Overview stays while the others can go.',
  ),
  render: () => ({
    props: { ...shared, ...editableDemo(3, false) },
    template: `<div [style]="column">${editableTemplate()}</div>`,
  }),
};

/** The add button replaced by the consumer's own. */
export const EditableCustomAdd: Story = {
  name: 'Editable card with its own add button',
  parameters: about(
    'hideAdd removes the plus at the end of the bar, so the consumer can put its own button wherever it likes, here in the extra content next to the tabs.',
  ),
  render: () => ({
    props: { ...shared, ...editableDemo() },
    template: `
      <div [style]="column">
        ${editableTemplate(
          'hideAdd',
          `<andes-button andesTabsExtraRight size="sm" variant="outline" (click)="edit({ action: 'add', event: $any(null) })"><ng-icon name="lucidePlus" /> New tab</andes-button>`,
        )}
      </div>`,
  }),
};

/** Another pair of icons. */
export const EditableCustomIcons: Story = {
  name: 'Editable card with custom icons',
  parameters: about(
    'addIcon and removeIcon take templates, so the plus and the cross can be any icon, for example a trash can for closing and a bell for adding.',
  ),
  render: () => ({
    props: { ...shared, ...editableDemo() },
    template: `
      <ng-template #add><ng-icon name="lucideBell" /></ng-template>
      <ng-template #remove><ng-icon name="lucideTrash2" /></ng-template>
      <div [style]="column">${editableTemplate('[addIcon]="add" [removeIcon]="remove" addLabel="Add a reminder"')}</div>`,
  }),
};

const MOTION_TYPES = ['pill', 'segmented'];

/** The sliding thumb. */
export const SlidingThumb: Story = {
  name: 'Sliding thumb',
  parameters: about(
    'In the pill and segmented types one thumb glides from the previous tab to the new one over 300ms, in both directions, and follows a quick series of clicks without jumping.',
  ),
  render: () => ({
    props: { ...shared, types: MOTION_TYPES },
    template: `
      <div [style]="column">
        @for (type of types; track type) {
          <div><span [style]="caption">{{ type }}</span><andes-tabs [type]="type">${basicTabs()}</andes-tabs></div>
        }
      </div>`,
  }),
};

/** Timing of the thumb. */
export const ThumbTiming: Story = {
  name: 'Thumb timing',
  parameters: about(
    'The motion input sets the duration and the easing of the slide, here a slow 800ms glide next to a quick 120ms one with a springy curve, and the same two custom properties can be set from CSS.',
  ),
  render: () => ({
    props: {
      ...shared,
      slow: { duration: 800, easing: 'cubic-bezier(0.4, 0, 0.2, 1)' },
      quick: { duration: 120, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' },
    },
    template: `
      <div [style]="column">
        <div><span [style]="caption">800ms</span><andes-tabs type="segmented" [motion]="slow">${basicTabs()}</andes-tabs></div>
        <div><span [style]="caption">120ms with an overshoot</span><andes-tabs type="pill" [motion]="quick">${basicTabs()}</andes-tabs></div>
        <div><span [style]="caption">custom properties</span><andes-tabs type="segmented" style="--andes-tabs-duration: 600ms; --andes-tabs-easing: ease-in;">${basicTabs()}</andes-tabs></div>
      </div>`,
  }),
};

/** No slide. */
export const ThumbWithoutMotion: Story = {
  name: 'Thumb without motion',
  parameters: about(
    'animated false, or a motion duration of 0, makes the thumb jump to the new tab, which is also what every user who asks the system for reduced motion gets.',
  ),
  render: () => ({
    props: { ...shared, jump: { duration: 0 } },
    template: `
      <div [style]="column">
        <div><span [style]="caption">animated false</span><andes-tabs type="segmented" [animated]="false">${basicTabs()}</andes-tabs></div>
        <div><span [style]="caption">duration 0</span><andes-tabs type="pill" [motion]="jump">${basicTabs()}</andes-tabs></div>
      </div>`,
  }),
};

/** The thumb on a side bar. */
export const ThumbVertical: Story = {
  name: 'Thumb on a side bar',
  parameters: about(
    'On a start or end bar the thumb glides up and down and changes height with the tab, and it moves to the top of the panel when a narrow container collapses the bar.',
  ),
  render: () => ({
    props: { ...shared, types: MOTION_TYPES },
    template: `
      <div [style]="column">
        @for (type of types; track type) {
          <andes-tabs [type]="type" tabPosition="left" [collapseBelow]="null">${basicTabs()}</andes-tabs>
        }
        <andes-tabs type="segmented" tabPosition="right" [collapseBelow]="null">${basicTabs()}</andes-tabs>
      </div>`,
  }),
};

/** The thumb in a right-to-left page. */
export const ThumbRtl: Story = {
  name: 'Thumb in right-to-left',
  parameters: {
    dir: 'rtl',
    ...about(
      'In a right-to-left page the tabs run from the right and the thumb glides from right to left, because it is placed with the physical offsets of the selected tab.',
    ),
  },
  render: () => ({
    props: { ...shared, types: MOTION_TYPES },
    template: `
      <div [style]="column">
        @for (type of types; track type) {
          <andes-tabs [type]="type">${basicTabs()}</andes-tabs>
        }
      </div>`,
  }),
};

/** The thumb with scrolling tabs. */
export const ThumbManyTabs: Story = {
  name: 'Thumb with many tabs',
  parameters: about(
    'Thirty tabs scroll inside the track and the thumb scrolls with them, so the buttons above can send the selection far away and the bar follows it.',
  ),
  render: () => {
    const active = signal('Tab 1');
    return {
      props: { ...shared, active, names: numbered(30, 'Tab') },
      template: `
        <div style="display: flex; flex-direction: column; gap: 1rem;">
          <div [style]="row">
            <andes-button size="sm" variant="outline" (click)="active.set('Tab 1')">First</andes-button>
            <andes-button size="sm" variant="outline" (click)="active.set('Tab 15')">Middle</andes-button>
            <andes-button size="sm" variant="outline" (click)="active.set('Tab 30')">Last</andes-button>
          </div>
          <andes-tabs type="segmented" [(value)]="active" style="width: min(32rem, calc(100vw - 2rem));">
            <andes-tabs-list>
              @for (name of names; track name) { <andes-tabs-trigger [value]="name">{{ name }}</andes-tabs-trigger> }
            </andes-tabs-list>
          </andes-tabs>
          <andes-tabs type="pill" [(value)]="active" style="width: min(32rem, calc(100vw - 2rem));">
            <andes-tabs-list>
              @for (name of names; track name) { <andes-tabs-trigger [value]="name">{{ name }}</andes-tabs-trigger> }
            </andes-tabs-list>
          </andes-tabs>
        </div>`,
    };
  },
};

/** The thumb around icons and counts. */
export const ThumbIcons: Story = {
  name: 'Thumb with icons and counts',
  parameters: about(
    'The thumb is sized from the whole tab, so an icon in front of the label or a count after it makes the thumb wider, and a tab that is disabled is skipped.',
  ),
  render: () => ({
    props: { ...shared, types: MOTION_TYPES },
    template: `
      <div [style]="column">
        @for (type of types; track type) {
          <andes-tabs [type]="type">
            <andes-tabs-list>
              <andes-tabs-trigger value="inbox"><ng-icon name="lucideInbox" /> Inbox <andes-badge standalone [count]="12" size="small" /></andes-tabs-trigger>
              <andes-tabs-trigger value="sent"><ng-icon name="lucideMail" /> Sent</andes-tabs-trigger>
              <andes-tabs-trigger value="spam" disabled><ng-icon name="lucideTrash2" /> Spam</andes-tabs-trigger>
              <andes-tabs-trigger value="starred"><ng-icon name="lucideStar" /> Starred</andes-tabs-trigger>
            </andes-tabs-list>
          </andes-tabs>
        }
      </div>`,
  }),
};

/** The thumb while the tabs change. */
export const ThumbDynamic: Story = {
  name: 'Thumb with tabs added, removed and moved',
  parameters: about(
    'The thumb is measured again whenever tabs come, go or change places, so adding a tab before the active one, removing the active one or moving the first tab to the end leaves it under the right tab.',
  ),
  render: () => {
    let next = 5;
    const tabs = signal(['Tab 1', 'Tab 2', 'Tab 3', 'Tab 4']);
    const active = signal('Tab 2');
    return {
      props: {
        ...shared,
        tabs,
        active,
        types: MOTION_TYPES,
        addFirst: () => tabs.update((list) => [`Tab ${next++}`, ...list]),
        addLast: () => tabs.update((list) => [...list, `Tab ${next++}`]),
        removeActive: () =>
          tabs.update((list) =>
            list.length > 1 ? list.filter((name) => name !== active()) : list,
          ),
        rotate: () => tabs.update(([first, ...rest]) => [...rest, first]),
      },
      template: `
        <div [style]="column">
          <div [style]="row">
            <andes-button size="sm" variant="outline" (click)="addFirst()">Add before</andes-button>
            <andes-button size="sm" variant="outline" (click)="addLast()">Add after</andes-button>
            <andes-button size="sm" variant="outline" (click)="removeActive()">Remove the active tab</andes-button>
            <andes-button size="sm" variant="outline" (click)="rotate()">Move the first to the end</andes-button>
          </div>
          @for (type of types; track type) {
            <andes-tabs [type]="type" [(value)]="active">
              <andes-tabs-list>
                @for (name of tabs(); track name) { <andes-tabs-trigger [value]="name">{{ name }}</andes-tabs-trigger> }
              </andes-tabs-list>
            </andes-tabs>
          }
        </div>`,
    };
  },
};
