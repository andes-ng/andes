import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideBookOpen,
  lucideChevronDown,
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
import { AndesDropdownMenu } from './dropdown-menu';
import { AndesDropdownMenuSub } from './dropdown-menu-sub';
import { AndesDropdownMenuSubContent } from './dropdown-menu-sub-content';
import { AndesDropdownMenuSubTrigger } from './dropdown-menu-sub-trigger';
import { AndesDropdownMenuCheckboxItem } from './dropdown-menu-checkbox-item';
import { AndesDropdownMenuContent } from './dropdown-menu-content';
import { AndesDropdownMenuItem } from './dropdown-menu-item';
import { AndesDropdownMenuLabel } from './dropdown-menu-label';
import { AndesDropdownMenuRadioItem } from './dropdown-menu-radio-item';
import { AndesDropdownMenuSeparator } from './dropdown-menu-separator';
import { AndesDropdownMenuShortcut } from './dropdown-menu-shortcut';
import { AndesDropdownMenuTrigger } from './dropdown-menu-trigger';

const meta: Meta<AndesDropdownMenu> = {
  title: 'Navigation/Dropdown Menu/Basics/Menu',
  component: AndesDropdownMenu,
  tags: ['autodocs'],
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
 * The projected anatomy side by side: a plain menu (disabled row, separator, destructive
 * row), the same with leading icons and trailing shortcuts, and a menu disabled on the root
 * (the trigger is `aria-disabled` and nothing opens it). Keyboard: open with
 * Enter/Space/ArrowDown/ArrowUp, move with the arrow keys, type to jump to an item, Escape
 * closes and returns focus to the trigger.
 */
export const Basic: Story = {
  render: () => ({
    moduleMetadata: {
      imports: [
        NgIcon,
        AndesButton,
        AndesDropdownMenu,
        AndesDropdownMenuTrigger,
        AndesDropdownMenuContent,
        AndesDropdownMenuItem,
        AndesDropdownMenuSeparator,
        AndesDropdownMenuShortcut,
      ],
      providers: [ICONS, provideIcons({ lucideChevronDown })],
    },
    template: `
      <div>
        <p style="${NOTE}">
          Open with Enter/Space/ArrowDown/ArrowUp, navigate with the arrow keys, type to jump
          to an item, Escape to close and return focus to the trigger.
        </p>
        <div style="display: flex; gap: 1rem; align-items: flex-start;">
          <andes-dropdown-menu>
            <andes-button andesDropdownMenuTrigger>Options</andes-button>
            <andes-dropdown-menu-content>
              <andes-dropdown-menu-item>Edit</andes-dropdown-menu-item>
              <andes-dropdown-menu-item>Duplicate</andes-dropdown-menu-item>
              <andes-dropdown-menu-item disabled>Archive (disabled)</andes-dropdown-menu-item>
              <andes-dropdown-menu-separator />
              <andes-dropdown-menu-item variant="destructive">Delete</andes-dropdown-menu-item>
            </andes-dropdown-menu-content>
          </andes-dropdown-menu>
          <andes-dropdown-menu>
            <andes-button andesDropdownMenuTrigger>
              With icons <ng-icon slot="icon-end" name="lucideChevronDown" />
            </andes-button>
            <andes-dropdown-menu-content>
              <andes-dropdown-menu-item>
                <ng-icon slot="icon-start" name="lucidePencil" />
                Edit
                <andes-dropdown-menu-shortcut>⌘E</andes-dropdown-menu-shortcut>
              </andes-dropdown-menu-item>
              <andes-dropdown-menu-item>
                <ng-icon slot="icon-start" name="lucideCopy" />
                Duplicate
                <andes-dropdown-menu-shortcut>⌘D</andes-dropdown-menu-shortcut>
              </andes-dropdown-menu-item>
              <andes-dropdown-menu-separator />
              <andes-dropdown-menu-item variant="destructive">
                <ng-icon slot="icon-start" name="lucideTrash2" />
                Delete
                <andes-dropdown-menu-shortcut>⌘⌫</andes-dropdown-menu-shortcut>
              </andes-dropdown-menu-item>
            </andes-dropdown-menu-content>
          </andes-dropdown-menu>
          <andes-dropdown-menu disabled>
            <andes-button andesDropdownMenuTrigger variant="outline" disabled>Disabled</andes-button>
            <andes-dropdown-menu-content>
              <andes-dropdown-menu-item>Edit</andes-dropdown-menu-item>
            </andes-dropdown-menu-content>
          </andes-dropdown-menu>
        </div>
      </div>
    `,
  }),
};

export const CheckboxAndRadioItems: Story = {
  render: () => ({
    moduleMetadata: {
      imports: [
        AndesButton,
        AndesDropdownMenu,
        AndesDropdownMenuTrigger,
        AndesDropdownMenuContent,
        AndesDropdownMenuItem,
        AndesDropdownMenuCheckboxItem,
        AndesDropdownMenuRadioItem,
        AndesDropdownMenuLabel,
        AndesDropdownMenuSeparator,
      ],
    },
    template: `
      <andes-dropdown-menu>
        <andes-button andesDropdownMenuTrigger variant="outline">View</andes-button>
        <andes-dropdown-menu-content>
          <andes-dropdown-menu-label>Appearance</andes-dropdown-menu-label>
          <andes-dropdown-menu-checkbox-item [checked]="true">
            Show hidden files
          </andes-dropdown-menu-checkbox-item>
          <andes-dropdown-menu-checkbox-item>
            Show bookmarks bar
          </andes-dropdown-menu-checkbox-item>
          <andes-dropdown-menu-separator />
          <andes-dropdown-menu-label>Sort by</andes-dropdown-menu-label>
          <andes-dropdown-menu-radio-item name="sort" value="name" [defaultChecked]="true">
            Name
          </andes-dropdown-menu-radio-item>
          <andes-dropdown-menu-radio-item name="sort" value="date">
            Date modified
          </andes-dropdown-menu-radio-item>
          <andes-dropdown-menu-radio-item name="sort" value="size">
            Size
          </andes-dropdown-menu-radio-item>
        </andes-dropdown-menu-content>
      </andes-dropdown-menu>
    `,
  }),
};

/**
 * Link items: `href` (plus `target`/`rel`) renders the row's content inside a real
 * anchor, so the browser follows it - new-tab via `target="_blank"`, middle-click and
 * Ctrl/Cmd-click included - while the row keeps its menu role and arrow-key focus.
 */
export const LinkItems: Story = {
  render: () => ({
    moduleMetadata: {
      imports: [
        NgIcon,
        AndesButton,
        AndesDropdownMenu,
        AndesDropdownMenuTrigger,
        AndesDropdownMenuContent,
        AndesDropdownMenuItem,
        AndesDropdownMenuSeparator,
      ],
      providers: [ICONS],
    },
    template: `
      <div style="display: flex; gap: 1rem;">
        <ng-template #bookIcon><ng-icon name="lucideBookOpen" /></ng-template>
        <ng-template #externalIcon><ng-icon name="lucideExternalLink" /></ng-template>
        <andes-dropdown-menu
          [items]="[
            { key: 'guide', label: 'Getting started', href: '#getting-started', icon: bookIcon },
            { key: 'angular', label: 'Angular docs', href: 'https://angular.dev', target: '_blank', icon: externalIcon },
            { key: 'old', label: 'Legacy docs (disabled)', href: '#legacy', disabled: true },
          ]"
        >
          <andes-button andesDropdownMenuTrigger variant="outline">Help (items)</andes-button>
        </andes-dropdown-menu>
        <andes-dropdown-menu>
          <andes-button andesDropdownMenuTrigger variant="outline">Help (projected)</andes-button>
          <andes-dropdown-menu-content>
            <andes-dropdown-menu-item href="#shortcuts">Keyboard shortcuts</andes-dropdown-menu-item>
            <andes-dropdown-menu-separator />
            <andes-dropdown-menu-item href="https://angular.dev" target="_blank">
              Angular docs
              <ng-icon slot="icon-end" name="lucideExternalLink" />
            </andes-dropdown-menu-item>
          </andes-dropdown-menu-content>
        </andes-dropdown-menu>
      </div>
    `,
  }),
};

/**
 * Nested submenus. Hover a "…" row (after a 100ms intent delay), click it, or focus it
 * and press ArrowRight/Enter/Space; ArrowLeft or Escape closes just that submenu and
 * returns focus to its row. Pointing at a sibling row closes it after 100ms, so a
 * diagonal move into the submenu is forgiven.
 */
export const Submenus: Story = {
  render: () => ({
    moduleMetadata: {
      imports: [
        NgIcon,
        AndesButton,
        AndesDropdownMenu,
        AndesDropdownMenuTrigger,
        AndesDropdownMenuContent,
        AndesDropdownMenuItem,
        AndesDropdownMenuSeparator,
        AndesDropdownMenuSub,
        AndesDropdownMenuSubTrigger,
        AndesDropdownMenuSubContent,
      ],
      providers: [ICONS],
    },
    props: { last: '' },
    template: `
      <div>
        <p style="${NOTE}">Last clicked: <strong>{{ last || '-' }}</strong></p>
        <andes-dropdown-menu (itemClick)="last = $event.keyPath.join(' < ')">
          <andes-button andesDropdownMenuTrigger variant="outline">File</andes-button>
          <andes-dropdown-menu-content>
            <andes-dropdown-menu-item key="new">New file</andes-dropdown-menu-item>
            <andes-dropdown-menu-item key="open">Open…</andes-dropdown-menu-item>
            <andes-dropdown-menu-sub key="share">
              <andes-dropdown-menu-sub-trigger>
                <ng-icon slot="icon-start" name="lucideShare2" />
                Share
              </andes-dropdown-menu-sub-trigger>
              <andes-dropdown-menu-sub-content>
                <andes-dropdown-menu-item key="email">
                  <ng-icon slot="icon-start" name="lucideMail" />
                  Email link
                </andes-dropdown-menu-item>
                <andes-dropdown-menu-item key="copy-link">
                  <ng-icon slot="icon-start" name="lucideLink" />
                  Copy link
                </andes-dropdown-menu-item>
                <andes-dropdown-menu-sub key="social">
                  <andes-dropdown-menu-sub-trigger>Social</andes-dropdown-menu-sub-trigger>
                  <andes-dropdown-menu-sub-content>
                    <andes-dropdown-menu-item key="mastodon">Mastodon</andes-dropdown-menu-item>
                    <andes-dropdown-menu-item key="bluesky">Bluesky</andes-dropdown-menu-item>
                  </andes-dropdown-menu-sub-content>
                </andes-dropdown-menu-sub>
              </andes-dropdown-menu-sub-content>
            </andes-dropdown-menu-sub>
            <andes-dropdown-menu-sub key="export">
              <andes-dropdown-menu-sub-trigger disabled>Export (disabled)</andes-dropdown-menu-sub-trigger>
              <andes-dropdown-menu-sub-content>
                <andes-dropdown-menu-item key="pdf">PDF</andes-dropdown-menu-item>
              </andes-dropdown-menu-sub-content>
            </andes-dropdown-menu-sub>
            <andes-dropdown-menu-separator />
            <andes-dropdown-menu-item key="delete" variant="destructive">Delete</andes-dropdown-menu-item>
          </andes-dropdown-menu-content>
        </andes-dropdown-menu>
      </div>
    `,
  }),
};

/**
 * The data-driven `items` array instead of projected content: plain items with
 * `icon`/`extra`/`danger`/`disabled`, `type: 'group'`, `type: 'divider'` (optionally
 * `dashed`) and submenus via `children`. Icons and any rich label are `TemplateRef`s.
 */
export const ItemsArray: Story = {
  render: () => ({
    moduleMetadata: {
      imports: [
        NgIcon,
        AndesButton,
        AndesDropdownMenu,
        AndesDropdownMenuTrigger,
      ],
      providers: [ICONS],
    },
    props: { last: '' },
    template: `
      <div>
        <p style="${NOTE}">(itemClick): <strong>{{ last || '-' }}</strong></p>
        <ng-template #editIcon><ng-icon name="lucidePencil" /></ng-template>
        <ng-template #copyIcon><ng-icon name="lucideCopy" /></ng-template>
        <ng-template #shareIcon><ng-icon name="lucideShare2" /></ng-template>
        <ng-template #deleteIcon><ng-icon name="lucideTrash2" /></ng-template>
        <andes-dropdown-menu
          (itemClick)="last = $event.key + ' (' + $event.keyPath.join(' < ') + ')'"
          [items]="[
            { key: 'edit', label: 'Edit', icon: editIcon, extra: '⌘E' },
            { key: 'copy', label: 'Duplicate', icon: copyIcon, extra: '⌘D' },
            { key: 'rename', label: 'Rename', disabled: true },
            { type: 'divider', dashed: true },
            { type: 'group', label: 'Move to', children: [
              { key: 'inbox', label: 'Inbox' },
              { key: 'archive', label: 'Archive' },
            ] },
            { key: 'share', label: 'Share', icon: shareIcon, children: [
              { key: 'email', label: 'Email' },
              { key: 'link', label: 'Copy link' },
            ] },
            { type: 'divider' },
            { key: 'delete', label: 'Delete', icon: deleteIcon, danger: true, extra: '⌘⌫' },
          ]"
        >
          <andes-button andesDropdownMenuTrigger variant="outline">Actions</andes-button>
        </andes-dropdown-menu>
      </div>
    `,
  }),
};
