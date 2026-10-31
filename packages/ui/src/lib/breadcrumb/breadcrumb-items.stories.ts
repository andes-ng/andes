import { provideRouter, RouterLink, withHashLocation } from '@angular/router';
import {
  applicationConfig,
  type Meta,
  type StoryObj,
} from '@storybook/angular';
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
  AndesBreadcrumbItemClickEvent,
  AndesBreadcrumbItemType,
} from './breadcrumb-items';

const imports = [
  AndesBreadcrumb,
  AndesBreadcrumbList,
  AndesBreadcrumbItem,
  AndesBreadcrumbLink,
  AndesBreadcrumbPage,
  AndesBreadcrumbSeparator,
  AndesBreadcrumbEllipsis,
];

const meta: Meta<AndesBreadcrumb> = {
  title: 'Navigation/Breadcrumb/Basics/Items',
  component: AndesBreadcrumb,
};

export default meta;

type Story = StoryObj<AndesBreadcrumb>;

/** Inline 24x24 stroke icons shared by the icon stories (any `<svg>` or icon component works). */
const ICON_TEMPLATES = `
  <ng-template #homeIcon>
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" />
    </svg>
  </ng-template>
  <ng-template #userIcon>
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" />
    </svg>
  </ng-template>
  <ng-template #chartIcon>
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M3 3v18h18" /><path d="m7 14 4-4 3 3 5-6" />
    </svg>
  </ng-template>
  <ng-template #trashIcon>
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="M6 6l1 15h10l1-15" />
    </svg>
  </ng-template>
`;

/**
 * `[items]` is the data-driven API: the root renders the list, joins each `path` onto the
 * previous ones (`/users`, `/users/42`), interpolates `:param`s from `[params]` into paths and
 * titles, and renders the last crumb as the current page (`aria-current="page"`).
 */
export const Items: Story = {
  render: () => ({
    moduleMetadata: { imports },
    props: {
      items: [
        { title: 'Home', href: '/' },
        { title: 'Users', path: 'users' },
        { title: 'User :id', path: ':id' },
        { title: 'Settings', path: 'settings' },
      ] satisfies AndesBreadcrumbItemType[],
      params: { id: 42 },
    },
    template: `<andes-breadcrumb [items]="items" [params]="params" />`,
  }),
};

/**
 * `separator` takes a string or a template, in `[items]` mode and for every empty
 * `andesBreadcrumbSeparator` in projected mode. A `{ type: 'separator' }` entry (or
 * `[andesBreadcrumbSeparator]="..."` on one projected separator) overrides a single position.
 */
export const Separators: Story = {
  render: () => ({
    moduleMetadata: { imports },
    props: {
      items: [
        { title: 'Home', href: '/' },
        { title: 'Application Center', href: '/apps' },
        { title: 'Application List', href: '/apps/list' },
        { title: 'An Application' },
      ] satisfies AndesBreadcrumbItemType[],
      overridden: [
        { title: 'Location' },
        { type: 'separator', separator: ':' },
        { title: 'Application Center', href: '/apps' },
        { title: 'Application List', href: '/apps/list' },
        { title: 'An Application' },
      ] satisfies AndesBreadcrumbItemType[],
    },
    template: `
      <ng-template #dot><span style="font-size: 1.25em; line-height: 1">&middot;</span></ng-template>
      <div style="display: grid; gap: 1rem;">
        <andes-breadcrumb [items]="items" />
        <andes-breadcrumb [items]="items" separator="/" />
        <andes-breadcrumb [items]="items" separator=">" />
        <andes-breadcrumb [items]="items" [separator]="dot" />
        <andes-breadcrumb [items]="overridden" separator="/" />
        <andes-breadcrumb separator="/">
          <ol andesBreadcrumbList>
            <li andesBreadcrumbItem><a andesBreadcrumbLink href="/">Projected</a></li>
            <li andesBreadcrumbSeparator></li>
            <li andesBreadcrumbItem><a andesBreadcrumbLink href="/docs">inherits "/"</a></li>
            <li [andesBreadcrumbSeparator]="dot"></li>
            <li andesBreadcrumbItem><span andesBreadcrumbPage>one position overridden</span></li>
          </ol>
        </andes-breadcrumb>
      </div>
    `,
  }),
};

/**
 * An item's `icon` (a template) renders before its title inside the crumb's link, page or text.
 * An icon-only crumb needs an `ariaLabel`, which is rendered as visually hidden text (and used as
 * its label if it ends up collapsed into the ellipsis dropdown).
 */
export const ItemsWithIcons: Story = {
  render: () => ({
    moduleMetadata: { imports },
    template: `
      ${ICON_TEMPLATES}
      <div style="display: grid; gap: 1rem;">
        <andes-breadcrumb
          [items]="[
            { icon: homeIcon, ariaLabel: 'Home', href: '/' },
            { icon: userIcon, title: 'Application List', href: '/apps' },
            { icon: chartIcon, title: 'Dashboard', href: '/apps/dashboard' },
            { title: 'Application' },
          ]"
        />
        <andes-breadcrumb
          separator="/"
          [maxItems]="3"
          [items]="[
            { icon: homeIcon, ariaLabel: 'Home', href: '/' },
            { icon: userIcon, title: 'Users', href: '/users' },
            { icon: chartIcon, title: 'Reports', href: '/users/reports' },
            { title: 'Q3' },
            { icon: chartIcon, title: 'Revenue' },
          ]"
        />
      </div>
    `,
  }),
};

/**
 * `maxItems` collapses the middle of a long trail into the ellipsis dropdown, keeping
 * `itemsBeforeCollapse` crumbs before it and `itemsAfterCollapse` after it.
 */
export const CollapsedItems: Story = {
  render: () => ({
    moduleMetadata: { imports },
    props: {
      items: [
        { title: 'Home', href: '/' },
        { title: 'Documentation', path: 'docs' },
        { title: 'Building Your Application', path: 'building' },
        { title: 'Data Fetching', path: 'data-fetching' },
        { title: 'Caching', path: 'caching' },
        { title: 'Revalidating' },
      ] satisfies AndesBreadcrumbItemType[],
      onItemClick: (event: AndesBreadcrumbItemClickEvent) => {
        event.event.preventDefault();
        action('itemClick')({ title: event.item.title, index: event.index });
      },
    },
    template: `
      <div style="display: grid; gap: 1rem;">
        <andes-breadcrumb [items]="items" [maxItems]="3" (itemClick)="onItemClick($event)" />
        <andes-breadcrumb
          aria-label="Ruta de navegación"
          ellipsisLabel="Más"
          [items]="items"
          [maxItems]="4"
          [itemsBeforeCollapse]="2"
          [itemsAfterCollapse]="2"
          (itemClick)="onItemClick($event)"
        />
      </div>
    `,
  }),
};

/**
 * `(itemClick)` and each item's `onClick` receive the crumb and the `MouseEvent` -
 * `preventDefault()` it to route in-app. A crumb with `onClick` and no `href` renders as a
 * keyboard-reachable `<button>` styled like a link; one with neither is plain text.
 */
export const ClickHandling: Story = {
  render: () => ({
    moduleMetadata: { imports },
    props: {
      items: [
        { title: 'Home', href: '/' },
        {
          title: 'Reports (onClick)',
          onClick: () => action('onClick')('Reports'),
        },
        { title: 'Plain text' },
        { title: 'Q3' },
      ] satisfies AndesBreadcrumbItemType[],
      onItemClick: (event: AndesBreadcrumbItemClickEvent) => {
        event.event.preventDefault();
        action('itemClick')({ title: event.item.title, index: event.index });
      },
    },
    template: `<andes-breadcrumb [items]="items" (itemClick)="onItemClick($event)" />`,
  }),
};

/**
 * `[itemRender]` hands each crumb (with its interpolated `title`, `params`, accumulated `paths`
 * and `last`) to a template - here to render Angular Router `routerLink`s (hash location, so
 * clicking only changes this iframe's hash).
 */
export const ItemRenderWithRouterLink: Story = {
  decorators: [
    applicationConfig({
      providers: [
        provideRouter([{ path: '**', children: [] }], withHashLocation()),
      ],
    }),
  ],
  render: () => ({
    moduleMetadata: { imports: [...imports, RouterLink] },
    props: {
      items: [
        { title: 'Home', path: '' },
        { title: 'Projects', path: 'projects' },
        { title: 'Project :projectId', path: ':projectId' },
        { title: 'Board', path: 'board' },
      ] satisfies AndesBreadcrumbItemType[],
      params: { projectId: 'andes' },
    },
    template: `
      <ng-template #crumb let-title="title" let-paths="paths" let-last="last">
        @if (last) {
          <span andesBreadcrumbPage>{{ title }}</span>
        } @else {
          <a andesBreadcrumbLink [routerLink]="['/'].concat(paths)">{{ title }}</a>
        }
      </ng-template>
      <andes-breadcrumb [items]="items" [params]="params" [itemRender]="crumb" separator="/" />
    `,
  }),
};
