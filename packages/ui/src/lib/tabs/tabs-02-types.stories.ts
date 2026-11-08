import { signal } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular';

import {
  about,
  basicTabs,
  caption,
  shared,
  tabsOf,
  withDescription,
  withTabsKit,
} from '../../testing/tabs-story-kit';
import { AndesTabs } from './tabs';
import type { AndesTabsEditEvent } from './tabs-types';

/*
 * The five looks of the bar: the line, the card, the pill track, the joined segments, and the
 * editable card that adds and closes tabs.
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

/** A muted track with a raised tab. */
export const Pill: Story = {
  name: 'Pill',
  parameters: about(
    'The tabs sit in a muted rounded track and the active one is raised out of it, a quiet look for secondary navigation.',
  ),
  render: () => ({
    props: shared,
    template: `<div [style]="column">${tabsOf('type="pill"')}</div>`,
  }),
};

/** Joined outlined buttons. */
export const Segmented: Story = {
  name: 'Segmented',
  parameters: about(
    'The tabs are joined, outlined buttons like a radio-button group, and the active one is filled with the primary colour.',
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
    'The same three tabs in every type, one under the other, to compare their height, spacing and the way the active tab is marked.',
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
