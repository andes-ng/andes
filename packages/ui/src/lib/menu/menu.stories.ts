import {
  Component,
  computed,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideBell,
  lucideChartColumn,
  lucideFileText,
  lucideHouse,
  lucidePackage,
  lucideSettings,
  lucideShoppingCart,
  lucideUsers,
} from '@ng-icons/lucide';
import type { TemplateRef } from '@angular/core';
import { type Meta, moduleMetadata, type StoryObj } from '@storybook/angular';

import { AndesButton } from '../button/button';
import { AndesMenu } from './menu';
import { AndesMenuDivider } from './menu-divider';
import { AndesMenuGroup } from './menu-group';
import { AndesMenuItem } from './menu-item';
import type { AndesMenuNode } from './menu-types';
import { AndesSubMenu } from './sub-menu';

const ICONS = {
  home: 'lucideHouse',
  cart: 'lucideShoppingCart',
  box: 'lucidePackage',
  chart: 'lucideChartColumn',
  gear: 'lucideSettings',
  users: 'lucideUsers',
  file: 'lucideFileText',
  bell: 'lucideBell',
} as const;

/** A small lucide icon at 16px (a touch lighter than the default stroke) for the demos. */
@Component({
  selector: 'andes-story-icon',
  imports: [NgIcon],
  viewProviders: [
    provideIcons({
      lucideBell,
      lucideChartColumn,
      lucideFileText,
      lucideHouse,
      lucidePackage,
      lucideSettings,
      lucideShoppingCart,
      lucideUsers,
    }),
  ],
  template: `<ng-icon [name]="icon()" size="16" strokeWidth="1.75" />`,
  host: { style: 'display: inline-flex' },
})
class StoryIcon {
  readonly name = input.required<keyof typeof ICONS>();
  protected readonly icon = computed(() => ICONS[this.name()]);
}

/** The ERP navigation tree most demos share. */
@Component({
  selector: 'andes-story-sidebar',
  imports: [
    AndesMenu,
    AndesMenuItem,
    AndesSubMenu,
    AndesMenuGroup,
    AndesMenuDivider,
    StoryIcon,
  ],
  template: `
    <andes-menu
      [mode]="mode()"
      [theme]="theme()"
      [size]="size()"
      [inlineCollapsed]="collapsed()"
      [accordion]="accordion()"
      [navigation]="navigation()"
      [multiple]="multiple()"
      [triggerSubMenuAction]="trigger()"
      [ariaLabel]="'Main navigation'"
      [(selectedKeys)]="selected"
      [(openKeys)]="open"
      [style.width]="collapsed() ? null : width()"
    >
      <andes-menu-item key="dashboard">
        <andes-story-icon slot="icon" name="home" />
        Dashboard
      </andes-menu-item>
      <andes-sub-menu key="sales" label="Sales">
        <andes-story-icon slot="icon" name="cart" />
        <andes-menu-item key="orders">Orders</andes-menu-item>
        <andes-menu-item key="invoices">Invoices</andes-menu-item>
        <andes-sub-menu key="customers" label="Customers">
          <andes-menu-item key="accounts">Accounts</andes-menu-item>
          <andes-menu-item key="segments">Segments</andes-menu-item>
        </andes-sub-menu>
      </andes-sub-menu>
      <andes-sub-menu key="inventory" label="Inventory">
        <andes-story-icon slot="icon" name="box" />
        <andes-menu-item key="stock">Stock levels</andes-menu-item>
        <andes-menu-item key="transfers">Transfers</andes-menu-item>
      </andes-sub-menu>
      <andes-menu-item key="reports">
        <andes-story-icon slot="icon" name="chart" />
        Reports
      </andes-menu-item>
      <andes-menu-divider />
      <andes-menu-group label="Administration">
        <andes-menu-item key="users">
          <andes-story-icon slot="icon" name="users" />
          Users
        </andes-menu-item>
        <andes-menu-item key="settings">
          <andes-story-icon slot="icon" name="gear" />
          Settings
        </andes-menu-item>
        <andes-menu-item key="archive" [disabled]="true">
          <andes-story-icon slot="icon" name="file" />
          Archive
        </andes-menu-item>
      </andes-menu-group>
    </andes-menu>
  `,
})
class StorySidebar {
  readonly mode = input<'vertical' | 'horizontal' | 'inline'>('inline');
  readonly theme = input<'light' | 'dark'>('light');
  readonly size = input<'sm' | 'md' | 'lg'>('md');
  readonly collapsed = input(false);
  readonly accordion = input(false);
  readonly navigation = input(false);
  readonly multiple = input(false);
  readonly trigger = input<'hover' | 'click'>('hover');
  readonly width = input('16rem');
  readonly selected = signal<readonly string[]>(['orders']);
  readonly open = signal<readonly string[]>(['sales']);
}

/** Collapsing the rail from a button, like an application shell would. */
@Component({
  selector: 'andes-story-rail',
  imports: [StorySidebar, AndesButton],
  template: `
    <div style="display: flex; gap: 1rem; align-items: flex-start;">
      <andes-story-sidebar
        [collapsed]="collapsed()"
        [theme]="theme()"
        width="100%"
        style="display: block; padding: 0.5rem; border-radius: 0.5rem; background: var(--andes-color-background);"
        [style.width]="collapsed() ? 'auto' : '16rem'"
      />
      <andes-button
        variant="outline"
        size="sm"
        (click)="collapsed.set(!collapsed())"
      >
        {{ collapsed() ? 'Expand' : 'Collapse' }}
      </andes-button>
    </div>
  `,
})
class StoryRail {
  readonly theme = input<'light' | 'dark'>('light');
  protected readonly collapsed = signal(true);
}

/** A bar inside a container whose width you can change, to watch the overflow. */
@Component({
  selector: 'andes-story-bar',
  imports: [AndesMenu, AndesMenuItem, AndesSubMenu, AndesMenuDivider],
  template: `
    <label style="display: block; font-size: 0.875rem; margin-bottom: 0.75rem;">
      Width: {{ width() }}px
      <input
        type="range"
        min="200"
        max="760"
        step="10"
        [value]="width()"
        (input)="width.set(+$any($event.target).value)"
        style="vertical-align: middle; margin-inline-start: 0.5rem;"
      />
    </label>
    <andes-menu
      mode="horizontal"
      [(selectedKeys)]="selected"
      [style.width.px]="width()"
      ariaLabel="Sections"
    >
      <andes-menu-item key="dashboard">Dashboard</andes-menu-item>
      <andes-menu-item key="orders">Orders</andes-menu-item>
      <andes-sub-menu key="catalog" label="Catalog">
        <andes-menu-item key="products">Products</andes-menu-item>
        <andes-menu-item key="categories">Categories</andes-menu-item>
        <andes-sub-menu key="brands" label="Brands">
          <andes-menu-item key="own">Own brands</andes-menu-item>
          <andes-menu-item key="partners">Partners</andes-menu-item>
        </andes-sub-menu>
      </andes-sub-menu>
      <andes-menu-item key="customers">Customers</andes-menu-item>
      <andes-menu-divider />
      <andes-menu-item key="reports">Reports</andes-menu-item>
      <andes-menu-item key="billing">Billing</andes-menu-item>
      <andes-menu-item key="settings">Settings</andes-menu-item>
    </andes-menu>
  `,
})
class StoryBar {
  protected readonly width = signal(420);
  protected readonly selected = signal<readonly string[]>(['orders']);
}

/** The same tree as `items`, with icons supplied as templates. */
@Component({
  selector: 'andes-story-data',
  imports: [AndesMenu, StoryIcon],
  template: `
    <ng-template #home><andes-story-icon name="home" /></ng-template>
    <ng-template #cart><andes-story-icon name="cart" /></ng-template>
    <ng-template #gear><andes-story-icon name="gear" /></ng-template>
    <ng-template #bell><andes-story-icon name="bell" /></ng-template>
    <andes-menu
      mode="inline"
      [items]="items()"
      [(selectedKeys)]="selected"
      [(openKeys)]="open"
      style="width: 16rem;"
    />
    <p style="font-size: 0.75rem; margin-top: 0.75rem;">
      selected: <code>{{ selected().join(', ') || 'none' }}</code>
    </p>
  `,
})
class StoryData {
  private readonly home = viewChild<TemplateRef<unknown>>('home');
  private readonly cart = viewChild<TemplateRef<unknown>>('cart');
  private readonly gear = viewChild<TemplateRef<unknown>>('gear');
  private readonly bell = viewChild<TemplateRef<unknown>>('bell');
  protected readonly selected = signal<readonly string[]>(['inbox']);
  protected readonly open = signal<readonly string[]>(['team']);
  protected readonly items = computed<AndesMenuNode[]>(() => [
    { key: 'inbox', label: 'Inbox', icon: this.home(), extra: '⌘1' },
    { key: 'alerts', label: 'Alerts', icon: this.bell(), extra: '4' },
    {
      key: 'team',
      label: 'Team',
      icon: this.cart(),
      children: [
        { key: 'members', label: 'Members' },
        { key: 'roles', label: 'Roles', extra: '⌘R' },
        {
          type: 'group',
          label: 'Danger zone',
          children: [{ key: 'remove', label: 'Remove team', danger: true }],
        },
      ],
    },
    { type: 'divider' },
    { key: 'settings', label: 'Settings', icon: this.gear() },
    { key: 'billing', label: 'Billing', disabled: true },
    {
      key: 'docs',
      label: 'Documentation',
      href: 'https://example.com/docs',
      target: '_blank',
    },
  ]);
}

const meta: Meta<AndesMenu> = {
  title: 'Navigation/Menu',
  component: AndesMenu,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [
        AndesMenu,
        AndesMenuItem,
        AndesSubMenu,
        AndesMenuGroup,
        AndesMenuDivider,
        StoryIcon,
        StorySidebar,
        StoryRail,
        StoryBar,
        StoryData,
      ],
    }),
  ],
  parameters: { layout: 'padded' },
  argTypes: {
    mode: { control: 'select', options: ['vertical', 'horizontal', 'inline'] },
    theme: { control: 'inline-radio', options: ['light', 'dark'] },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    inlineCollapsed: { control: 'boolean' },
    inlineIndent: { control: 'number' },
    selectable: { control: 'boolean' },
    multiple: { control: 'boolean' },
    navigation: { control: 'boolean' },
    triggerSubMenuAction: {
      control: 'inline-radio',
      options: ['hover', 'click'],
    },
    subMenuOpenDelay: { control: 'number' },
    subMenuCloseDelay: { control: 'number' },
    disableOverflow: { control: 'boolean' },
    accordion: { control: 'boolean' },
    collapsedTooltips: { control: 'boolean' },
  },
  args: {
    mode: 'inline',
    theme: 'light',
    size: 'md',
    inlineCollapsed: false,
    inlineIndent: 24,
    selectable: true,
    multiple: false,
    navigation: false,
    triggerSubMenuAction: 'hover',
    accordion: false,
  },
  render: (args) => ({
    props: args,
    template: `<andes-story-sidebar
      [mode]="mode"
      [theme]="theme"
      [size]="size"
      [collapsed]="inlineCollapsed"
      [multiple]="multiple"
      [navigation]="navigation"
      [accordion]="accordion"
      [trigger]="triggerSubMenuAction"
    />`,
  }),
};

export default meta;

type Story = StoryObj<AndesMenu>;

/** An expanding sidebar: sections open in place and nested levels are indented. */
export const Inline: Story = {};

/**
 * How the submenus open, side by side: `vertical` mode with the default hover trigger (popups
 * beside their row), `vertical` with `triggerSubMenuAction="click"` (useful on touch and for
 * dense menus), and an `inline` sidebar in `accordion` mode, where opening one section closes
 * its siblings.
 */
export const OpenBehavior: Story = {
  render: () => ({
    template: `
      <div style="display: flex; gap: 2rem; align-items: flex-start; flex-wrap: wrap;">
        <andes-story-sidebar mode="vertical" width="14rem" />
        <andes-story-sidebar mode="vertical" trigger="click" width="14rem" />
        <andes-story-sidebar [accordion]="true" width="14rem" />
      </div>`,
  }),
};

/**
 * A dark sidebar on a light page: the tokens are re-scoped on the menu and its popups. Shown
 * as an inline sidebar, a vertical one with popups and the dark icon rail.
 */
export const DarkSidebar: Story = {
  args: { theme: 'dark' },
  render: (args) => ({
    props: args,
    template: `
      <div style="display: flex; gap: 2rem; align-items: flex-start; flex-wrap: wrap;">
        <andes-story-sidebar [theme]="theme" [mode]="mode" style="display:block; padding: 0.5rem; background: #0f172a;" />
        <andes-story-sidebar theme="dark" mode="vertical" width="14rem" style="display:block; padding: 0.5rem; background: #0f172a;" />
        <div style="background:#0f172a; padding: 1rem; display:inline-block;"><andes-story-rail theme="dark" /></div>
      </div>`,
  }),
};

/** Rows come in three sizes: 24, 32 (default) and 40px. */
export const Sizes: Story = {
  render: () => ({
    template: `
      <div style="display: flex; gap: 2rem; align-items: flex-start; flex-wrap: wrap;">
        <andes-story-sidebar size="sm" width="13rem" />
        <andes-story-sidebar size="md" width="13rem" />
        <andes-story-sidebar size="lg" width="13rem" />
      </div>`,
  }),
};

/**
 * Folded to an icon rail: hover or focus a row for its label, and submenus open as
 * popups beside the rail. Rows without an icon show their first letter.
 */
export const CollapsedRail: Story = {
  render: () => ({
    template: `<andes-story-rail />`,
  }),
};

/**
 * A bar. The first one is static, with a disabled item and a submenu; the second sits in a
 * container whose width you change with the slider: what no longer fits moves into the "…"
 * submenu.
 */
export const Horizontal: Story = {
  render: () => ({
    template: `
      <div style="display: flex; flex-direction: column; gap: 2rem;">
        <andes-menu mode="horizontal" ariaLabel="Sections" style="width: min(46rem, 100%);">
          <andes-menu-item key="dashboard">Dashboard</andes-menu-item>
          <andes-sub-menu key="sales" label="Sales">
            <andes-menu-item key="orders">Orders</andes-menu-item>
            <andes-menu-item key="invoices">Invoices</andes-menu-item>
          </andes-sub-menu>
          <andes-menu-item key="reports">Reports</andes-menu-item>
          <andes-menu-item key="settings" [disabled]="true">Settings</andes-menu-item>
        </andes-menu>
        <andes-story-bar />
      </div>`,
  }),
};

/** Several items can be selected; activating a selected item clears it. */
export const MultipleSelection: Story = {
  render: () => ({
    template: `<andes-story-sidebar [multiple]="true" mode="vertical" width="14rem" />`,
  }),
};

/**
 * Site navigation: a labelled landmark of links, the current page marked with
 * `aria-current="page"`, and every row a normal tab stop.
 */
export const SiteNavigation: Story = {
  render: () => ({
    template: `
      <andes-menu navigation ariaLabel="Documentation" style="width: 14rem;">
        <andes-menu-item key="intro" href="#intro">Introduction</andes-menu-item>
        <andes-menu-item key="install" href="#install">Installation</andes-menu-item>
        <andes-sub-menu key="guides" label="Guides">
          <andes-menu-item key="theming" href="#theming">Theming</andes-menu-item>
          <andes-menu-item key="a11y" href="#a11y">Accessibility</andes-menu-item>
        </andes-sub-menu>
        <andes-menu-item key="api" href="#api">API reference</andes-menu-item>
      </andes-menu>`,
  }),
};

/** Items and submenus built from a data model, with icons, shortcut hints and a link. */
export const DataDriven: Story = {
  render: () => ({
    template: `<andes-story-data />`,
  }),
};

/** Badges and hints go in the `extra` slot; `danger` marks a destructive action. */
export const BadgesAndHints: Story = {
  render: () => ({
    template: `
      <andes-menu mode="vertical" style="width: 15rem;">
        <andes-menu-item key="inbox">
          <andes-story-icon slot="icon" name="bell" />
          Inbox
          <span slot="extra" style="padding: 0 6px; border-radius: 999px; background: var(--andes-color-primary); color: var(--andes-color-primary-foreground); font-size: 12px; line-height: 20px;">12</span>
        </andes-menu-item>
        <andes-menu-item key="search" extra="⌘K">Search</andes-menu-item>
        <andes-menu-divider [dashed]="true" />
        <andes-menu-item key="delete" [danger]="true" extra="⌫">Delete account</andes-menu-item>
        <andes-menu-item key="locked" [disabled]="true">Locked</andes-menu-item>
      </andes-menu>`,
  }),
};

/** Right-to-left: arrows, indentation and popups mirror. */
export const RightToLeft: Story = {
  render: () => ({
    template: `<div dir="rtl"><andes-story-sidebar mode="inline" /></div>`,
  }),
};
