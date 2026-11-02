import { NgTemplateOutlet } from '@angular/common';
import { Component, ViewEncapsulation } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideChevronDown,
  lucideEllipsis,
  lucideSettings,
  lucideSmile,
  lucideUser,
} from '@ng-icons/lucide';
import type { Meta, StoryObj } from '@storybook/angular';

import { AndesButton } from '../button/button';
import { AndesDropdownButton } from './dropdown-button';
import { AndesDropdownMenu } from './dropdown-menu';
import { AndesDropdownMenuTrigger } from './dropdown-menu-trigger';

/**
 * One story per example of Ant Design's Dropdown page (https://ant.design/components/dropdown),
 * named like Ant's and in Ant's order, each rebuilt from the library's own parts. Ant opens on
 * hover by default, so these stories do too (`trigger="hover"`); the library default is `click`.
 */
const meta: Meta<AndesDropdownMenu> = {
  title: 'Navigation/Dropdown Menu/Examples',
  component: AndesDropdownMenu,
};

export default meta;

type Story = StoryObj<AndesDropdownMenu>;

const ICONS = provideIcons({
  lucideChevronDown,
  lucideEllipsis,
  lucideSettings,
  lucideSmile,
  lucideUser,
});

const MODULE = {
  imports: [
    NgIcon,
    NgTemplateOutlet,
    AndesButton,
    AndesDropdownButton,
    AndesDropdownMenu,
    AndesDropdownMenuTrigger,
  ],
  providers: [ICONS],
};

const NOTE =
  'font: 0.875rem var(--andes-font-family), sans-serif; color: var(--andes-color-muted-foreground); margin: 0 0 1rem;';

/** Ant's text trigger: the label, then a chevron, as a link button. */
const textTrigger = (label: string) => `
  <andes-button andesDropdownMenuTrigger variant="link">
    ${label}
    <ng-icon slot="icon-end" name="lucideChevronDown" />
  </andes-button>`;

/** The three plain items of Ant's placement, arrow and context menu examples. */
const THREE_ITEMS = `[
  { key: '1', label: '1st menu item' },
  { key: '2', label: '2nd menu item' },
  { key: '3', label: '3rd menu item' },
]`;

/** A grid of outline buttons, each opening the same three-item menu at its own placement. */
const placementGrid = (
  placements: readonly string[],
  arrow: string,
  columns = 3,
) => `
  <div style="display: grid; grid-template-columns: repeat(${columns}, max-content); gap: 0.5rem; padding: 7rem 9rem;">
    @for (placement of [${placements.map((p) => `'${p}'`).join(', ')}]; track placement) {
      <andes-dropdown-menu trigger="hover" [placement]="placement" ${arrow} [items]="${THREE_ITEMS}">
        <andes-button andesDropdownMenuTrigger variant="outline">{{ placement }}</andes-button>
      </andes-dropdown-menu>
    }
  </div>`;

const SIX_PLACEMENTS = [
  'bottomLeft',
  'bottom',
  'bottomRight',
  'topLeft',
  'top',
  'topRight',
];

/** The most basic dropdown menu. */
export const Basic: Story = {
  name: 'Basic',
  render: () => ({
    moduleMetadata: MODULE,
    template: `
      <ng-template #smile><ng-icon name="lucideSmile" /></ng-template>
      <div style="padding: 1rem 1rem 12rem;">
        <andes-dropdown-menu
          trigger="hover"
          [items]="[
            { key: '1', label: '1st menu item' },
            { key: '2', label: '2nd menu item (disabled)', icon: smile, disabled: true },
            { key: '3', label: '3rd menu item (disabled)', disabled: true },
            { key: '4', label: 'a danger item', danger: true },
          ]"
        >
          ${textTrigger('Hover me')}
        </andes-dropdown-menu>
      </div>
    `,
  }),
};

/** The dropdown menu with shortcut. */
export const ExtraNode: Story = {
  name: 'Extra node',
  render: () => ({
    moduleMetadata: MODULE,
    template: `
      <ng-template #settings><ng-icon name="lucideSettings" /></ng-template>
      <div style="padding: 1rem 1rem 12rem;">
        <andes-dropdown-menu
          trigger="hover"
          [items]="[
            { key: '1', label: 'My Account', disabled: true },
            { type: 'divider' },
            { key: '2', label: 'Profile', extra: '⌘P' },
            { key: '3', label: 'Billing', extra: '⌘B' },
            { key: '4', label: 'Settings', icon: settings, extra: '⌘S' },
          ]"
        >
          ${textTrigger('Hover me')}
        </andes-dropdown-menu>
      </div>
    `,
  }),
};

/** Support 12 placements. */
export const Placement: Story = {
  name: 'Placement',
  render: () => ({
    moduleMetadata: MODULE,
    template: placementGrid(
      [
        'bottomLeft',
        'bottom',
        'bottomRight',
        'topLeft',
        'top',
        'topRight',
        'leftTop',
        'left',
        'leftBottom',
        'rightTop',
        'right',
        'rightBottom',
      ],
      '',
    ),
  }),
};

/** You could display an arrow. */
export const Arrow: Story = {
  name: 'Arrow',
  render: () => ({
    moduleMetadata: MODULE,
    template: placementGrid(SIX_PLACEMENTS, 'arrow'),
  }),
};

/** Divider and disabled menu item. */
export const OtherElements: Story = {
  name: 'Other elements',
  render: () => ({
    moduleMetadata: MODULE,
    template: `
      <div style="padding: 1rem 1rem 12rem;">
        <andes-dropdown-menu
          trigger="hover"
          [items]="[
            { key: '1', label: '1st menu item' },
            { key: '2', label: '2nd menu item' },
            { type: 'divider' },
            { key: '3', label: '3rd menu item（disabled）', disabled: true },
          ]"
        >
          ${textTrigger('Hover me')}
        </andes-dropdown-menu>
      </div>
    `,
  }),
};

/** By specifying `arrow` with `{ pointAtCenter: true }`, the arrow will point to the center of the target element. */
export const ArrowPointingAtTheCenter: Story = {
  name: 'Arrow pointing at the center',
  render: () => ({
    moduleMetadata: MODULE,
    template: placementGrid(
      SIX_PLACEMENTS,
      '[arrow]="{ pointAtCenter: true }"',
    ),
  }),
};

/** The default trigger mode is hover, you can change it to click. */
export const TriggerMode: Story = {
  name: 'Trigger mode',
  render: () => ({
    moduleMetadata: MODULE,
    template: `
      <div style="padding: 1rem 1rem 12rem;">
        <andes-dropdown-menu trigger="click" [items]="${THREE_ITEMS}">
          ${textTrigger('Click me')}
        </andes-dropdown-menu>
      </div>
    `,
  }),
};

/** An event will be triggered when you click menu items, in which you can make different operations according to the item's `key`. */
export const ClickEvent: Story = {
  name: 'Click event',
  render: () => ({
    moduleMetadata: MODULE,
    props: { clicked: '' },
    template: `
      <div style="padding: 1rem 1rem 12rem;">
        <p style="${NOTE}">{{ clicked ? 'Click on item ' + clicked : 'Click a menu item.' }}</p>
        <andes-dropdown-menu
          trigger="hover"
          (itemClick)="clicked = $event.key"
          [items]="${THREE_ITEMS}"
        >
          ${textTrigger('Hover me, Click menu item')}
        </andes-dropdown-menu>
      </div>
    `,
  }),
};

/** A button is on the left, and a related functional menu is on the right. You can set the `icon` input to modify the icon of the right. */
export const ButtonWithDropdownMenu: Story = {
  name: 'Button with dropdown menu',
  render: () => ({
    moduleMetadata: MODULE,
    props: {
      menu: [
        { key: '1', label: '1st menu item' },
        { key: '2', label: '2nd menu item' },
        { key: '3', label: '3rd menu item' },
      ],
    },
    template: `
      <ng-template #ellipsis><ng-icon name="lucideEllipsis" /></ng-template>
      <ng-template #user><ng-icon name="lucideUser" /></ng-template>
      <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem; padding: 1rem 1rem 12rem;">
        <andes-dropdown-button trigger="hover" [icon]="ellipsis" [items]="menu">Dropdown</andes-dropdown-button>
        <andes-dropdown-button trigger="hover" [icon]="user" [items]="menu">Dropdown</andes-dropdown-button>
        <andes-dropdown-button trigger="hover" [icon]="ellipsis" disabled [items]="menu">Dropdown</andes-dropdown-button>
        <andes-dropdown-button trigger="hover" [icon]="ellipsis" menuLoading [items]="menu">Loading menu</andes-dropdown-button>
        <andes-dropdown-menu trigger="hover" placement="bottomLeft" [items]="menu">
          <andes-button andesDropdownMenuTrigger variant="outline">
            Button
            <ng-icon slot="icon-end" name="lucideChevronDown" />
          </andes-button>
        </andes-dropdown-menu>
        <andes-dropdown-button trigger="hover" danger [icon]="ellipsis" [items]="menu">Danger</andes-dropdown-button>
      </div>
    `,
  }),
};

/** Customize the dropdown menu via `popupTemplate`. If you don't need the menu content, use the popover directly. */
export const CustomDropdown: Story = {
  name: 'Custom dropdown',
  render: () => ({
    moduleMetadata: MODULE,
    template: `
      <div style="padding: 1rem 1rem 14rem;">
        <andes-dropdown-menu trigger="hover" [popupTemplate]="popup" [items]="${THREE_ITEMS}">
          ${textTrigger('Hover me')}
        </andes-dropdown-menu>
        <ng-template #popup let-menu>
          <ng-container *ngTemplateOutlet="menu" />
          <div style="height: 1px; background: var(--andes-color-border);"></div>
          <div style="padding: 0.5rem;">
            <andes-button variant="primary">Click me!</andes-button>
          </div>
        </ng-template>
      </div>
    `,
  }),
};

/** The menu has multiple levels. */
export const CascadingMenu: Story = {
  name: 'Cascading menu',
  render: () => ({
    moduleMetadata: MODULE,
    template: `
      <div style="padding: 1rem 1rem 14rem;">
        <andes-dropdown-menu
          trigger="hover"
          [items]="[
            {
              type: 'group',
              label: 'Group title',
              children: [
                { key: '1-1', label: '1st menu item' },
                { key: '1-2', label: '2nd menu item' },
              ],
            },
            {
              key: '2',
              label: 'sub menu',
              children: [
                { key: '2-1', label: '3rd menu item' },
                { key: '2-2', label: '4th menu item' },
              ],
            },
            {
              key: '3',
              label: 'disabled sub menu',
              disabled: true,
              children: [
                { key: '3-1', label: '5th menu item' },
                { key: '3-2', label: '6th menu item' },
              ],
            },
          ]"
        >
          ${textTrigger('Cascading menu')}
        </andes-dropdown-menu>
      </div>
    `,
  }),
};

/** The default is to close the menu when you click on menu items, this feature can be turned off. */
export const TheWayOfHidingMenu: Story = {
  name: 'The way of hiding menu',
  render: () => ({
    moduleMetadata: MODULE,
    props: { shown: false },
    template: `
      <div style="padding: 1rem 1rem 12rem;">
        <andes-dropdown-menu
          trigger="hover"
          [closeOnSelect]="false"
          [(open)]="shown"
          [items]="[
            { key: '1', label: 'Clicking me will not close the menu.' },
            { key: '2', label: 'Clicking me will not close the menu also.' },
            { key: '3', label: 'Clicking me will close the menu.', closeOnSelect: true },
          ]"
        >
          ${textTrigger('Hover me')}
        </andes-dropdown-menu>
      </div>
    `,
  }),
};

/** The default trigger mode is hover, you can change it to `contextMenu`. The pop-up menu position will follow the right-click position. */
export const ContextMenu: Story = {
  name: 'Context Menu',
  render: () => ({
    moduleMetadata: MODULE,
    template: `
      <div style="padding: 1rem 1rem 14rem;">
        <andes-dropdown-menu trigger="contextMenu" [items]="${THREE_ITEMS}">
          <div
            andesDropdownMenuTrigger
            tabindex="0"
            aria-label="Right click on here, or press Shift+F10, to open the menu"
            style="max-width: 20rem; height: 200px; line-height: 200px; text-align: center; background: var(--andes-color-muted); color: var(--andes-color-muted-foreground); font: 0.875rem/200px var(--andes-font-family), sans-serif;"
          >
            Right Click on here
          </div>
        </andes-dropdown-menu>
      </div>
    `,
  }),
};

/** A loading indicator can be added to a button by setting the `loading` input. */
export const Loading: Story = {
  name: 'Loading',
  render: () => ({
    moduleMetadata: MODULE,
    props: {
      menu: [
        { key: '1', label: '1st menu item' },
        { key: '2', label: '2nd menu item' },
        { key: '3', label: '3rd menu item' },
      ],
    },
    template: `
      <ng-template #ellipsis><ng-icon name="lucideEllipsis" /></ng-template>
      <ng-template #chevron><ng-icon name="lucideChevronDown" /></ng-template>
      <div style="display: grid; justify-items: start; gap: 0.5rem; padding: 1rem 1rem 12rem;">
        <andes-dropdown-button trigger="hover" variant="primary" loading [icon]="ellipsis" [items]="menu">Submit</andes-dropdown-button>
        <andes-dropdown-button trigger="hover" variant="primary" size="sm" loading [icon]="ellipsis" [items]="menu">Submit</andes-dropdown-button>
        <andes-dropdown-button trigger="hover" variant="primary" [icon]="ellipsis" [items]="menu">Submit</andes-dropdown-button>
        <andes-dropdown-button trigger="hover" [icon]="chevron" [items]="menu">Submit</andes-dropdown-button>
      </div>
    `,
  }),
};

/** Configure the `selectable` input to enable the selectable ability. */
export const SelectableMenu: Story = {
  name: 'Selectable Menu',
  render: () => ({
    moduleMetadata: MODULE,
    template: `
      <div style="padding: 1rem 1rem 12rem;">
        <andes-dropdown-menu
          trigger="hover"
          selectable
          [selectedKeys]="['3']"
          [items]="[
            { key: '1', label: 'Item 1' },
            { key: '2', label: 'Item 2' },
            { key: '3', label: 'Item 3' },
          ]"
        >
          ${textTrigger('Selectable')}
        </andes-dropdown-menu>
      </div>
    `,
  }),
};

/** Use the dropdown with the browser Selection API to show custom actions after selecting text. */
export const SelectionActions: Story = {
  name: 'Selection actions',
  render: () => ({
    moduleMetadata: MODULE,
    props: {
      picked: '',
      selectionItems: [
        { key: 'mask', label: 'Mask selection' },
        { key: 'mark', label: 'Mark as entity' },
        { key: 'search', label: 'Search the selection' },
      ],
      onSelection: (menu: AndesDropdownMenu) => {
        const selection = window.getSelection();
        if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
          return;
        }
        const rects = selection.getRangeAt(0).getClientRects();
        const last = rects[rects.length - 1];
        if (last) {
          menu.showAt(last.right, last.bottom);
        }
      },
    },
    template: `
      <div style="padding: 1rem 1rem 12rem;">
        <p style="${NOTE}">{{ picked ? 'Action: ' + picked : 'Select some text below.' }}</p>
        <andes-dropdown-menu #menu [items]="selectionItems" (itemClick)="picked = $event.key" />
        <div
          style="max-width: 36rem; font: 0.875rem/1.5714 var(--andes-font-family), sans-serif;"
          (mouseup)="onSelection(menu)"
        >
          Select any text in this paragraph to open a Dropdown menu near the selection. This is
          useful for actions such as masking sensitive words, marking entities, or searching the
          selected keyword. Example data: Alice, phone 13800138000, ID 110101199001011234.
        </div>
      </div>
    `,
  }),
};

@Component({
  selector: 'andes-dropdown-menu-examples-style-demo',
  imports: [NgIcon, AndesButton, AndesDropdownMenu, AndesDropdownMenuTrigger],
  encapsulation: ViewEncapsulation.None,
  // Not scoped: the panel renders in the overlay container under <body>, outside this host.
  styles: `
    .examples-style-object .andes-dropdown-menu__content {
      padding: var(--andes-space-2);
      background-color: var(--andes-color-muted);
      border-radius: var(--andes-radius-xl);
    }
    .examples-style-object .examples-style-item {
      font-weight: var(--andes-font-weight-medium);
    }
    .examples-style-function .andes-dropdown-menu__content {
      background-color: var(--andes-color-primary);
      color: var(--andes-color-primary-foreground);
      border-color: var(--andes-color-primary);
    }
    .examples-style-function .examples-style-item {
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }
    .examples-style-function
      .andes-dropdown-menu__item:hover:not([data-disabled]) {
      background-color: color-mix(in srgb, white 20%, transparent);
      color: inherit;
    }
  `,
  template: `
    <div
      style="display: flex; flex-wrap: wrap; gap: 0.5rem; padding: 1rem 1rem 12rem;"
    >
      <andes-dropdown-menu
        trigger="hover"
        panelClass="examples-style-object"
        [items]="[
          { key: '1', label: '1st menu item', class: 'examples-style-item' },
          { key: '2', label: '2nd menu item', class: 'examples-style-item' },
          { key: '3', label: '3rd menu item' },
        ]"
      >
        <andes-button andesDropdownMenuTrigger variant="outline">
          Object Style
          <ng-icon slot="icon-end" name="lucideChevronDown" />
        </andes-button>
      </andes-dropdown-menu>
      <andes-dropdown-menu
        trigger="hover"
        panelClass="examples-style-function"
        [items]="[
          { key: '1', label: '1st menu item', class: 'examples-style-item' },
          { key: '2', label: '2nd menu item', class: 'examples-style-item' },
          { key: '3', label: '3rd menu item', class: 'examples-style-item' },
        ]"
      >
        <andes-button andesDropdownMenuTrigger variant="primary">
          Function Style
          <ng-icon slot="icon-end" name="lucideChevronDown" />
        </andes-button>
      </andes-dropdown-menu>
    </div>
  `,
})
class ExamplesStyleDemo {}

/**
 * You can customize the semantic dom style of the Dropdown through the hooks the library has:
 * `panelClass` on the overlay pane that holds the panel, and the `class` option of an `items`
 * entry on its own row.
 */
export const CustomSemanticDomStyling: Story = {
  name: 'Custom semantic dom styling',
  render: () => ({
    moduleMetadata: { imports: [ExamplesStyleDemo], providers: [ICONS] },
    template: `<andes-dropdown-menu-examples-style-demo />`,
  }),
};
