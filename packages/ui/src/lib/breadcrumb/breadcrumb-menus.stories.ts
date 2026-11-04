import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideChartLine,
  lucideHouse,
  lucideTrash2,
  lucideUserRound,
} from '@ng-icons/lucide';
import { type Meta, moduleMetadata, type StoryObj } from '@storybook/angular';
import { action } from 'storybook/actions';

import {
  AndesBreadcrumb,
  AndesBreadcrumbEllipsis,
  AndesBreadcrumbItem,
  AndesBreadcrumbLink,
  AndesBreadcrumbList,
  AndesBreadcrumbPage,
  AndesBreadcrumbSeparator,
} from './breadcrumb';
import type {
  AndesBreadcrumbItemType,
  AndesBreadcrumbMenuClickEvent,
  AndesBreadcrumbMenuOpenChangeEvent,
} from './breadcrumb-items';

const imports = [
  NgIcon,
  AndesBreadcrumb,
  AndesBreadcrumbList,
  AndesBreadcrumbItem,
  AndesBreadcrumbLink,
  AndesBreadcrumbPage,
  AndesBreadcrumbSeparator,
  AndesBreadcrumbEllipsis,
];

const meta: Meta<AndesBreadcrumb> = {
  title: 'Navigation/Breadcrumb/Specialized/Menus',
  component: AndesBreadcrumb,
  decorators: [
    moduleMetadata({
      providers: [
        provideIcons({
          lucideChartLine,
          lucideHouse,
          lucideTrash2,
          lucideUserRound,
        }),
      ],
    }),
  ],
};

export default meta;

type Story = StoryObj<AndesBreadcrumb>;

/** Lucide icons shared by the icon stories (any `ng-icon`, icon component or SVG works). */
const ICON_TEMPLATES = `
  <ng-template #homeIcon><ng-icon name="lucideHouse" /></ng-template>
  <ng-template #userIcon><ng-icon name="lucideUserRound" /></ng-template>
  <ng-template #chartIcon><ng-icon name="lucideChartLine" /></ng-template>
  <ng-template #trashIcon><ng-icon name="lucideTrash2" /></ng-template>
`;

/**
 * A crumb with `menu.items` renders its label with a caret that opens a dropdown (the shared
 * `AndesDropdownMenu`). Entries with an `href` stay real links; `(menuClick)` and each entry's
 * `onClick` report activations. `[dropdownIcon]` replaces the caret. The label and the caret hover
 * as one soft pill, which stays filled while the menu is open.
 *
 * A crumb that has BOTH its own link (`href` / `path`) and a `menu` keeps the link and gets a
 * separate caret button next to it; `menuLabel` names that button for assistive technology
 * ("Components: Show menu"). The last crumb, a disabled one and one drawn by `[itemRender]` stay
 * a single trigger.
 */
export const ItemWithMenu: Story = {
  render: () => ({
    moduleMetadata: { imports },
    props: {
      linkWithMenu: [
        { title: 'Home', href: '/' },
        {
          title: 'Components',
          href: '/components',
          menu: {
            items: [
              { label: 'General', href: '/components/general' },
              { label: 'Layout', href: '/components/layout' },
            ],
          },
        },
        { title: 'Button' },
      ] satisfies AndesBreadcrumbItemType[],
      items: [
        { title: 'Home', href: '/' },
        { title: 'Components', href: '/components' },
        {
          title: 'General',
          menu: {
            items: [
              { label: 'General', href: '/components/general' },
              { label: 'Layout', href: '/components/layout' },
              { label: 'Navigation' },
              { label: 'Deprecated', disabled: true },
            ],
          },
        },
        { title: 'Button' },
      ] satisfies AndesBreadcrumbItemType[],
      onMenuClick: (event: AndesBreadcrumbMenuClickEvent) => {
        event.event.preventDefault();
        action('menuClick')({
          item: event.item.title,
          menuItem: event.menuItem.label,
        });
      },
    },
    template: `
      <ng-template #plus><span aria-hidden="true">+</span></ng-template>
      <div style="display: grid; gap: 1rem;">
        <andes-breadcrumb [items]="items" (menuClick)="onMenuClick($event)" />
        <andes-breadcrumb [items]="items" [dropdownIcon]="plus" (menuClick)="onMenuClick($event)" />
        <andes-breadcrumb [items]="linkWithMenu" menuLabel="Show menu" (menuClick)="onMenuClick($event)" />
      </div>
    `,
  }),
};

/**
 * `menu.items` takes more than plain entries: `{ type: 'divider' }` rules, `{ type: 'group' }`
 * runs with a heading, and per entry an `icon`, `danger` styling, `disabled`, and `target` for an
 * `href` entry (`'_blank'` also gets `rel="noopener noreferrer"`). `key` identifies the entry in
 * `(menuClick)`.
 */
export const MenuEntries: Story = {
  render: () => ({
    moduleMetadata: { imports },
    props: {
      onMenuClick: (event: AndesBreadcrumbMenuClickEvent) => {
        if (!event.menuItem.target) {
          event.event.preventDefault();
        }
        action('menuClick')({
          item: event.item.title,
          key: event.menuItem.key,
        });
      },
    },
    template: `
      ${ICON_TEMPLATES}
      <andes-breadcrumb
        (menuClick)="onMenuClick($event)"
        [items]="[
          { title: 'Home', href: '/' },
          { title: 'Users', href: '/users' },
          {
            title: 'Jane Cooper',
            menu: {
              items: [
                { key: 'profile', label: 'Profile', icon: userIcon, href: '/users/jane' },
                { key: 'activity', label: 'Activity', icon: chartIcon },
                { type: 'divider' },
                {
                  type: 'group',
                  label: 'Teams',
                  children: [
                    { key: 'finance', label: 'Finance', href: '/teams/finance' },
                    { key: 'ops', label: 'Operations', href: '/teams/ops', disabled: true },
                  ],
                },
                { type: 'divider' },
                { key: 'help', label: 'Help center', href: 'https://example.com', target: '_blank' },
                { key: 'remove', label: 'Remove user', icon: trashIcon, danger: true },
              ],
            },
          },
          { title: 'Permissions' },
        ]"
      />
    `,
  }),
};

/**
 * `dropdownProps` tunes one crumb's menu: `side` / `align` place the panel, `panelClass` styles
 * it, `disabled` keeps the caret but stops it from opening, and `onOpenChange` (or the root's
 * `(menuOpenChange)`) reports when it opens and closes.
 */
export const DropdownProps: Story = {
  render: () => ({
    moduleMetadata: { imports },
    props: {
      siblings: {
        items: [
          { label: 'General', href: '/components/general' },
          { label: 'Layout', href: '/components/layout' },
          { label: 'Navigation', href: '/components/navigation' },
        ],
      },
      onMenuClick: (event: AndesBreadcrumbMenuClickEvent) => {
        event.event.preventDefault();
        action('menuClick')(event.menuItem.label);
      },
      onOpenChange: (event: AndesBreadcrumbMenuOpenChangeEvent) =>
        action('menuOpenChange')({ item: event.item.title, open: event.open }),
    },
    template: `
      <div style="display: grid; gap: 2rem; padding-block: 8rem 2rem;">
        <andes-breadcrumb
          (menuClick)="onMenuClick($event)"
          (menuOpenChange)="onOpenChange($event)"
          [items]="[
            { title: 'Home', href: '/' },
            { title: 'Opens above, end-aligned', menu: siblings, dropdownProps: { side: 'top', align: 'end' } },
            { title: 'Opens to the right', menu: siblings, dropdownProps: { side: 'right' } },
            { title: 'Button' },
          ]"
        />
        <andes-breadcrumb
          [items]="[
            { title: 'Home', href: '/' },
            { title: 'Disabled menu', menu: siblings, dropdownProps: { disabled: true } },
            { title: 'Button' },
          ]"
        />
      </div>
    `,
  }),
};
