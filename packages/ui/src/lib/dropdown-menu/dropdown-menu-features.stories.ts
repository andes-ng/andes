import { NgTemplateOutlet } from '@angular/common';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideBookOpen,
  lucideExternalLink,
  lucidePlus,
  lucideCopy,
  lucideLink,
  lucideMail,
  lucidePencil,
  lucideSave,
  lucideShare2,
  lucideTrash2,
} from '@ng-icons/lucide';
import type { Meta, StoryObj } from '@storybook/angular';

import { AndesButton } from '../button/button';
import { AndesInput } from '../input/input';
import { AndesDropdownMenu } from './dropdown-menu';
import { AndesDropdownMenuContent } from './dropdown-menu-content';
import { AndesDropdownMenuItem } from './dropdown-menu-item';
import { AndesDropdownMenuLabel } from './dropdown-menu-label';
import { AndesDropdownMenuRadioGroup } from './dropdown-menu-radio-group';
import { AndesDropdownMenuRadioItem } from './dropdown-menu-radio-item';
import { AndesDropdownMenuSeparator } from './dropdown-menu-separator';
import { AndesDropdownMenuTrigger } from './dropdown-menu-trigger';

const meta: Meta<AndesDropdownMenu> = {
  title: 'Navigation/Dropdown Menu/Basics/Features',
  component: AndesDropdownMenu,
};

export default meta;

type Story = StoryObj<AndesDropdownMenu>;

const ICONS = provideIcons({
  lucideBookOpen,
  lucideExternalLink,
  lucidePlus,
  lucideCopy,
  lucideLink,
  lucideMail,
  lucidePencil,
  lucideSave,
  lucideShare2,
  lucideTrash2,
});

const NOTE =
  'font: 0.75rem var(--andes-font-family), sans-serif; color: var(--andes-color-muted-foreground); margin: 0 0 0.75rem; max-width: 34rem;';

/**
 * The other two ways to open the menu, side by side. `trigger="hover"` opens after 150ms of
 * hover and closes 100ms after the pointer leaves trigger and panel. `trigger="contextMenu"`
 * opens the menu at the pointer on right-click anywhere in the area (Shift+F10 from the
 * keyboard).
 */
export const Triggers: Story = {
  render: () => ({
    moduleMetadata: {
      imports: [
        AndesButton,
        AndesDropdownMenu,
        AndesDropdownMenuTrigger,
        AndesDropdownMenuContent,
        AndesDropdownMenuItem,
        AndesDropdownMenuSeparator,
      ],
    },
    template: `
      <div style="display: flex; gap: 2rem; align-items: flex-start;">
        <andes-dropdown-menu trigger="hover">
          <andes-button andesDropdownMenuTrigger variant="ghost">Hover me</andes-button>
          <andes-dropdown-menu-content>
            <andes-dropdown-menu-item>Profile</andes-dropdown-menu-item>
            <andes-dropdown-menu-item>Settings</andes-dropdown-menu-item>
            <andes-dropdown-menu-item>Sign out</andes-dropdown-menu-item>
          </andes-dropdown-menu-content>
        </andes-dropdown-menu>
        <andes-dropdown-menu trigger="contextMenu">
          <div
            andesDropdownMenuTrigger
            tabindex="0"
            aria-label="Canvas - right-click or press Shift+F10 for actions"
            style="display: flex; align-items: center; justify-content: center; width: 22rem; height: 12rem; border: 2px dashed var(--andes-color-border); border-radius: var(--andes-radius-md); color: var(--andes-color-muted-foreground); font: 0.875rem var(--andes-font-family), sans-serif;"
          >
            Right-click anywhere here
          </div>
          <andes-dropdown-menu-content>
            <andes-dropdown-menu-item>Cut</andes-dropdown-menu-item>
            <andes-dropdown-menu-item>Copy</andes-dropdown-menu-item>
            <andes-dropdown-menu-item>Paste</andes-dropdown-menu-item>
            <andes-dropdown-menu-separator />
            <andes-dropdown-menu-item variant="destructive">Delete</andes-dropdown-menu-item>
          </andes-dropdown-menu-content>
        </andes-dropdown-menu>
      </div>
    `,
  }),
};

/** The six primary `placement`s, with `arrow`. `{ pointAtCenter: true }` shifts the panel so the arrow meets the trigger's center. */
export const PlacementAndArrow: Story = {
  args: { arrow: true },
  argTypes: {
    arrow: {
      control: 'select',
      options: ['off', 'on', 'pointAtCenter'],
      mapping: { off: false, on: true, pointAtCenter: { pointAtCenter: true } },
    },
  },
  render: (args) => ({
    moduleMetadata: {
      imports: [
        AndesButton,
        AndesDropdownMenu,
        AndesDropdownMenuTrigger,
        AndesDropdownMenuContent,
        AndesDropdownMenuItem,
      ],
    },
    props: {
      ...args,
      rows: [
        ['topLeft', 'top', 'topRight'],
        ['bottomLeft', 'bottom', 'bottomRight'],
      ],
    },
    template: `
      <div style="display: grid; gap: 7rem 1rem; padding: 7rem 2rem;">
        @for (row of rows; track $index) {
          <div style="display: flex; gap: 1rem;">
            @for (placement of row; track placement) {
              <andes-dropdown-menu [placement]="placement" [arrow]="arrow">
                <andes-button andesDropdownMenuTrigger variant="outline">
                  {{ placement }}
                </andes-button>
                <andes-dropdown-menu-content>
                  <andes-dropdown-menu-item>First action</andes-dropdown-menu-item>
                  <andes-dropdown-menu-item>Second action</andes-dropdown-menu-item>
                  <andes-dropdown-menu-item>Third action</andes-dropdown-menu-item>
                </andes-dropdown-menu-content>
              </andes-dropdown-menu>
            }
          </div>
        }
      </div>
    `,
  }),
};

/**
 * The three ways to drive state, each with its own demo state: `[(open)]` with
 * `(openStateChange)` (reports what caused each change), `selectable` (+ `multiple`) with
 * two-way `[(selectedKeys)]` (keyed items become menuitemradio / menuitemcheckbox), and
 * `AndesDropdownMenuRadioGroup` with two-way `[(value)]` that the buttons outside the menu
 * can also change.
 */
export const Binding: Story = {
  render: () => ({
    moduleMetadata: {
      imports: [
        AndesButton,
        AndesDropdownMenu,
        AndesDropdownMenuTrigger,
        AndesDropdownMenuContent,
        AndesDropdownMenuItem,
        AndesDropdownMenuLabel,
        AndesDropdownMenuRadioGroup,
        AndesDropdownMenuRadioItem,
      ],
    },
    // Demo state lives under names that are not inputs of the meta component (`open`,
    // `items`, `selectedKeys`...), which Storybook would forward onto the first instance.
    props: {
      isOpen: false,
      log: [] as string[],
      single: ['name'],
      many: ['bold'],
      sort: 'date' as string | undefined,
      sortItems: [
        { key: 'name', label: 'Name' },
        { key: 'date', label: 'Date modified' },
        { key: 'size', label: 'Size' },
      ],
      styleItems: [
        { key: 'bold', label: 'Bold' },
        { key: 'italic', label: 'Italic' },
        { key: 'underline', label: 'Underline' },
      ],
    },
    template: `
      <div style="display: grid; gap: 1.5rem; justify-items: start;">
        <div>
          <p style="${NOTE}">[(open)] + (openStateChange): open = <strong>{{ isOpen }}</strong></p>
          <div style="display: flex; gap: 2rem; align-items: flex-start;">
            <div style="display: flex; gap: 0.5rem;">
              <andes-button variant="secondary" (click)="isOpen = !isOpen">
                {{ isOpen ? 'Close' : 'Open' }} from outside
              </andes-button>
              <andes-dropdown-menu
                [(open)]="isOpen"
                (openStateChange)="log = [($event.open ? 'open' : 'close') + ' · ' + $event.source].concat(log).slice(0, 6)"
              >
                <andes-button andesDropdownMenuTrigger variant="outline">Menu</andes-button>
                <andes-dropdown-menu-content>
                  <andes-dropdown-menu-item>Rename</andes-dropdown-menu-item>
                  <andes-dropdown-menu-item>Move</andes-dropdown-menu-item>
                </andes-dropdown-menu-content>
              </andes-dropdown-menu>
            </div>
            <ul style="${NOTE} margin: 0; padding-left: 1rem;">
              @for (line of log; track $index) {
                <li>{{ line }}</li>
              }
            </ul>
          </div>
        </div>
        <div>
          <p style="${NOTE}">selectable (single and multiple) with [(selectedKeys)]</p>
          <div style="display: flex; gap: 1rem; align-items: center;">
            <andes-dropdown-menu selectable [items]="sortItems" [(selectedKeys)]="single">
              <andes-button andesDropdownMenuTrigger variant="outline">Sort: {{ single[0] }}</andes-button>
            </andes-dropdown-menu>
            <andes-dropdown-menu selectable multiple [items]="styleItems" [(selectedKeys)]="many">
              <andes-button andesDropdownMenuTrigger variant="outline">Style: {{ many.join(', ') || 'none' }}</andes-button>
            </andes-dropdown-menu>
          </div>
        </div>
        <div>
          <p style="${NOTE}">Radio group with [(value)]: sort = <strong>{{ sort ?? '-' }}</strong></p>
          <div style="display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap;">
            <andes-dropdown-menu>
              <andes-button andesDropdownMenuTrigger variant="outline">Sort by</andes-button>
              <andes-dropdown-menu-content>
                <andes-dropdown-menu-radio-group [(value)]="sort">
                  <andes-dropdown-menu-label>Sort by</andes-dropdown-menu-label>
                  <andes-dropdown-menu-radio-item value="name">Name</andes-dropdown-menu-radio-item>
                  <andes-dropdown-menu-radio-item value="date">Date modified</andes-dropdown-menu-radio-item>
                  <andes-dropdown-menu-radio-item value="size">Size</andes-dropdown-menu-radio-item>
                </andes-dropdown-menu-radio-group>
              </andes-dropdown-menu-content>
            </andes-dropdown-menu>
            <andes-button variant="ghost" (click)="sort = 'name'">Set "name"</andes-button>
            <andes-button variant="ghost" (click)="sort = 'size'">Set "size"</andes-button>
            <andes-button variant="ghost" (click)="sort = undefined">Clear</andes-button>
          </div>
        </div>
      </div>
    `,
  }),
};

/**
 * `closeOnSelect`: `false` on the root keeps the menu open after any plain item is
 * picked (each item can still override it), for running several actions in a row.
 */
export const StayOpenOnSelect: Story = {
  render: () => ({
    moduleMetadata: {
      imports: [AndesButton, AndesDropdownMenu, AndesDropdownMenuTrigger],
    },
    props: { log: [] as string[] },
    template: `
      <div>
        <p style="${NOTE}">Picked: <strong>{{ log.join(', ') || '-' }}</strong></p>
        <andes-dropdown-menu
          [closeOnSelect]="false"
          (itemClick)="log = log.concat($event.key).slice(-5)"
          [items]="[
            { key: 'zoom-in', label: 'Zoom in', extra: '+' },
            { key: 'zoom-out', label: 'Zoom out', extra: '-' },
            { key: 'reset', label: 'Reset zoom' },
            { type: 'divider' },
            { key: 'done', label: 'Done', closeOnSelect: true },
          ]"
        >
          <andes-button andesDropdownMenuTrigger variant="outline">View</andes-button>
        </andes-dropdown-menu>
      </div>
    `,
  }),
};

/**
 * Submenu options: a custom `expandIcon` (its context is the open state),
 * `triggerSubMenuAction="click"`, a per-submenu `popupOffset` and
 * `(submenuTriggerClick)` for the trigger rows themselves.
 */
export const SubmenuOptions: Story = {
  render: () => ({
    moduleMetadata: {
      imports: [AndesButton, AndesDropdownMenu, AndesDropdownMenuTrigger],
    },
    props: { last: '' },
    template: `
      <div>
        <p style="${NOTE}">Last event: <strong>{{ last || '-' }}</strong></p>
        <ng-template #expand let-open>
          <span style="display: inline-block; width: 1em; text-align: center;">{{ open ? '−' : '+' }}</span>
        </ng-template>
        <andes-dropdown-menu
          triggerSubMenuAction="click"
          [expandIcon]="expand"
          (submenuTriggerClick)="last = 'opened ' + $event.key"
          (itemClick)="last = 'clicked ' + $event.keyPath.join(' < ')"
          [items]="[
            { key: 'new', label: 'New document' },
            { key: 'templates', label: 'From template', children: [
              { key: 'invoice', label: 'Invoice' },
              { key: 'quote', label: 'Quote' },
            ] },
            { key: 'import', label: 'Import (offset 8, 8)', popupOffset: [8, 8], children: [
              { key: 'csv', label: 'CSV' },
              { key: 'xlsx', label: 'Excel' },
            ] },
          ]"
        >
          <andes-button andesDropdownMenuTrigger variant="outline">Create</andes-button>
        </andes-dropdown-menu>
      </div>
    `,
  }),
};

/**
 * `popupTemplate` wraps the menu in content of your own - here a filter field above
 * it and an action below it - inside one popup surface. The template receives the menu
 * as `$implicit` and a `close` function. Tab moves through field, menu and footer.
 */
export const CustomPopup: Story = {
  render: () => ({
    moduleMetadata: {
      imports: [
        AndesInput,
        NgIcon,
        NgTemplateOutlet,
        AndesButton,
        AndesDropdownMenu,
        AndesDropdownMenuTrigger,
      ],
      providers: [ICONS],
    },
    props: {
      query: '',
      last: '',
      projects: [
        { key: 'atlas', label: 'Atlas ERP' },
        { key: 'billing', label: 'Billing' },
        { key: 'crm', label: 'CRM' },
        { key: 'inventory', label: 'Inventory' },
        { key: 'payroll', label: 'Payroll' },
      ],
      filter: (
        items: readonly { key: string; label: string }[],
        query: string,
      ) =>
        items.filter((item) =>
          item.label.toLowerCase().includes(query.trim().toLowerCase()),
        ),
    },
    template: `
      <div>
        <p style="${NOTE}">Last action: <strong>{{ last || '-' }}</strong></p>
        <andes-dropdown-menu
          [items]="filter(projects, query)"
          [popupTemplate]="popup"
          (itemClick)="last = $event.key"
          (openStateChange)="query = ''"
        >
          <andes-button andesDropdownMenuTrigger variant="outline">Switch project</andes-button>
        </andes-dropdown-menu>
        <ng-template #popup let-menu let-close="close">
          <div style="padding: var(--andes-space-2); border-bottom: 1px solid var(--andes-color-border);">
            <andes-input
              aria-label="Filter projects"
              placeholder="Filter projects…"
              size="sm"
              [(value)]="query"
            />
          </div>
          <ng-container *ngTemplateOutlet="menu" />
          <div style="padding: var(--andes-space-1); border-top: 1px solid var(--andes-color-border);">
            <andes-button variant="ghost" size="sm" fullWidth (click)="last = 'new project'; close()">
              <ng-icon slot="icon-start" name="lucidePlus" /> New project
            </andes-button>
          </div>
        </ng-template>
      </div>
    `,
  }),
};

/**
 * A long menu scrolls inside the panel. The cap is the
 * `--andes-dropdown-menu-max-height` custom property (default 24rem, never taller than
 * the viewport) - set it on the content, or from a stylesheet through `panelClass`.
 */
export const ScrollableMenu: Story = {
  render: () => ({
    moduleMetadata: {
      imports: [
        AndesButton,
        AndesDropdownMenu,
        AndesDropdownMenuTrigger,
        AndesDropdownMenuContent,
        AndesDropdownMenuItem,
      ],
    },
    props: {
      branches: Array.from({ length: 40 }, (_, index) => ({
        key: `branch-${index + 1}`,
        label: `Branch office ${index + 1}`,
      })),
    },
    template: `
      <div style="display: flex; gap: 1rem;">
        <andes-dropdown-menu [items]="branches">
          <andes-button andesDropdownMenuTrigger variant="outline">40 branches</andes-button>
        </andes-dropdown-menu>
        <andes-dropdown-menu>
          <andes-button andesDropdownMenuTrigger variant="outline">Capped at 12rem</andes-button>
          <andes-dropdown-menu-content style="--andes-dropdown-menu-max-height: 12rem">
            @for (branch of branches; track branch.key) {
              <andes-dropdown-menu-item [key]="branch.key">{{ branch.label }}</andes-dropdown-menu-item>
            }
          </andes-dropdown-menu-content>
        </andes-dropdown-menu>
      </div>
    `,
  }),
};
