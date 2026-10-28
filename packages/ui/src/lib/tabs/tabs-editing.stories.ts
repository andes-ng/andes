import { moveItemInArray } from '@angular/cdk/drag-drop';
import { signal } from '@angular/core';
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
import { AndesTabsContent } from './tabs-content';
import { AndesTabsList } from './tabs-list';
import { AndesTabsTrigger } from './tabs-trigger';
import type { AndesTabsEditEvent, AndesTabsReorderEvent } from './tabs-types';

const TABS_IMPORTS = [
  AndesTabsList,
  AndesTabsTrigger,
  AndesTabsContent,
  AndesButton,
  NgIcon,
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
  title: 'Navigation/Tabs/Advanced/Editing',
  component: AndesTabs,
  decorators: [
    moduleMetadata({ imports: TABS_IMPORTS }),
    applicationConfig({
      providers: [
        provideIcons({ lucideBell, lucideHouse, lucideSettings, lucideUser }),
      ],
    }),
  ],
};

export default meta;

type Story = StoryObj<AndesTabs>;

/**
 * `editable-card` only emits `(edit)`; the consumer owns the list of tabs. Remove buttons are
 * pointer-only - from the keyboard, press `Delete` on a focused tab.
 */
export const EditableCard: Story = {
  render: () => {
    let next = 4;
    const tabList = signal([
      { key: '1', label: 'Tab 1' },
      { key: '2', label: 'Tab 2' },
      { key: '3', label: 'Tab 3 (not closable)', closable: false },
    ]);
    const activeTab = signal<string | undefined>('1');
    const handleEdit = (event: AndesTabsEditEvent) => {
      if (event.action === 'add') {
        const key = String(next++);
        tabList.update((list) => [...list, { key, label: `Tab ${key}` }]);
        activeTab.set(key);
      } else {
        tabList.update((list) => list.filter((tab) => tab.key !== event.key));
      }
    };
    return {
      props: { tabList, activeTab, handleEdit },
      template: `
        <andes-tabs type="editable-card" [(value)]="activeTab" (edit)="handleEdit($event)"
          style="width: min(32rem, calc(100vw - 2rem));">
          <andes-tabs-list>
            @for (tab of tabList(); track tab.key) {
              <andes-tabs-trigger [value]="tab.key" [closable]="tab.closable ?? true">{{ tab.label }}</andes-tabs-trigger>
            }
          </andes-tabs-list>
          @for (tab of tabList(); track tab.key) {
            <andes-tabs-content [value]="tab.key"><p>Content of {{ tab.label }}</p></andes-tabs-content>
          }
        </andes-tabs>
      `,
    };
  },
};

/**
 * Add and remove controls other than the default: custom `addIcon` / `removeIcon` and
 * `addLabel`, no add button at all (`hideAdd`), and an add button of your own outside the tabs
 * (the list is the consumer's either way).
 */
export const AddAndRemoveControls: Story = {
  render: () => {
    let next = 3;
    const tabList = signal([
      { key: '1', label: 'Tab 1' },
      { key: '2', label: 'Tab 2' },
    ]);
    const activeTab = signal<string | undefined>('1');
    const add = () => {
      const key = String(next++);
      tabList.update((list) => [...list, { key, label: `Tab ${key}` }]);
      activeTab.set(key);
    };
    const handleEdit = (event: AndesTabsEditEvent) => {
      if (event.action === 'remove') {
        tabList.update((list) => list.filter((tab) => tab.key !== event.key));
      }
    };
    return {
      props: { tabList, activeTab, add, handleEdit },
      template: `
        <div style="display: grid; gap: 2rem; justify-items: start; width: min(32rem, calc(100vw - 2rem));">
          <ng-template #addIcon><ng-icon name="lucideBell" aria-hidden="true" /></ng-template>
          <ng-template #removeIcon><span aria-hidden="true">–</span></ng-template>
          <andes-tabs type="editable-card" [addIcon]="addIcon" [removeIcon]="removeIcon" addLabel="New notification tab"
            style="width: 100%;">
            ${BASIC_TABS}
          </andes-tabs>
          <andes-tabs type="editable-card" hideAdd style="width: 100%;">
            ${BASIC_TABS}
          </andes-tabs>
          <div style="display: grid; gap: 1rem; justify-items: start; width: 100%;">
            <andes-button size="sm" variant="outline" (click)="add()">Add tab</andes-button>
            <andes-tabs type="editable-card" hideAdd [(value)]="activeTab" (edit)="handleEdit($event)" style="width: 100%;">
              <andes-tabs-list>
                @for (tab of tabList(); track tab.key) {
                  <andes-tabs-trigger [value]="tab.key">{{ tab.label }}</andes-tabs-trigger>
                }
              </andes-tabs-list>
              @for (tab of tabList(); track tab.key) {
                <andes-tabs-content [value]="tab.key"><p>Content of {{ tab.label }}</p></andes-tabs-content>
              }
            </andes-tabs>
          </div>
        </div>
      `,
    };
  },
};

/**
 * With `draggable`, tabs can be dragged along the bar - or moved one step with
 * `Alt`+`Shift`+arrow key on a focused tab. `(reorder)` only reports the move; the consumer
 * applies it to its own list (here with `moveItemInArray`).
 */
export const Draggable: Story = {
  render: () => {
    const tabList = signal([
      { key: 'orders', label: 'Orders' },
      { key: 'invoices', label: 'Invoices' },
      { key: 'customers', label: 'Customers' },
      { key: 'products', label: 'Products' },
      { key: 'reports', label: 'Reports' },
    ]);
    const handleReorder = (event: AndesTabsReorderEvent) =>
      tabList.update((list) => {
        const next = [...list];
        moveItemInArray(next, event.previousIndex, event.currentIndex);
        return next;
      });
    return {
      props: { tabList, handleReorder },
      template: `
        <div style="display: grid; gap: 2rem; width: min(36rem, calc(100vw - 2rem));">
          @for (type of ['line', 'card']; track type) {
            <andes-tabs draggable [type]="type" (reorder)="handleReorder($event)">
              <andes-tabs-list>
                @for (tab of tabList(); track tab.key) {
                  <andes-tabs-trigger [value]="tab.key">{{ tab.label }}</andes-tabs-trigger>
                }
              </andes-tabs-list>
              @for (tab of tabList(); track tab.key) {
                <andes-tabs-content [value]="tab.key"><p>{{ tab.label }}</p></andes-tabs-content>
              }
            </andes-tabs>
          }
          <andes-tabs draggable tabPosition="left" (reorder)="handleReorder($event)">
            <andes-tabs-list>
              @for (tab of tabList(); track tab.key) {
                <andes-tabs-trigger [value]="tab.key">{{ tab.label }}</andes-tabs-trigger>
              }
            </andes-tabs-list>
            @for (tab of tabList(); track tab.key) {
              <andes-tabs-content [value]="tab.key"><p>{{ tab.label }}</p></andes-tabs-content>
            }
          </andes-tabs>
        </div>
      `,
    };
  },
};
