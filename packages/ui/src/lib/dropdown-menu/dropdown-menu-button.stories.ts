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

import { AndesDropdownButton } from './dropdown-button';
import { AndesDropdownMenu } from './dropdown-menu';
import { AndesDropdownMenuGroup } from './dropdown-menu-group';
import { AndesDropdownMenuContent } from './dropdown-menu-content';
import { AndesDropdownMenuItem } from './dropdown-menu-item';
import { AndesDropdownMenuLabel } from './dropdown-menu-label';

const meta: Meta<AndesDropdownMenu> = {
  title: 'Navigation/Dropdown Menu/Specialized/Dropdown Button',
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

/** `AndesDropdownButton`: a main action plus a caret that opens the menu, aligned `bottomRight` under the caret. */
export const DropdownButton: Story = {
  render: () => ({
    moduleMetadata: {
      imports: [
        NgIcon,
        AndesDropdownButton,
        AndesDropdownMenuContent,
        AndesDropdownMenuItem,
        AndesDropdownMenuGroup,
        AndesDropdownMenuLabel,
      ],
      providers: [ICONS],
    },
    props: { last: '' },
    template: `
      <div>
        <p style="${NOTE}">Last action: <strong>{{ last || '-' }}</strong></p>
        <div style="display: flex; gap: 1rem; align-items: center; flex-wrap: wrap;">
          <andes-dropdown-button (buttonClick)="last = 'save'" (itemClick)="last = $event.key">
            <ng-icon name="lucideSave" /> Save
            <andes-dropdown-menu-content>
              <andes-dropdown-menu-item key="save-as">Save as…</andes-dropdown-menu-item>
              <andes-dropdown-menu-item key="save-copy">Save a copy</andes-dropdown-menu-item>
            </andes-dropdown-menu-content>
          </andes-dropdown-button>
          <andes-dropdown-button
            variant="primary"
            (buttonClick)="last = 'publish'"
            (itemClick)="last = $event.key"
            [items]="[
              { key: 'schedule', label: 'Schedule…' },
              { key: 'draft', label: 'Save as draft' },
            ]"
          >
            Publish
          </andes-dropdown-button>
          <andes-dropdown-button variant="danger" (buttonClick)="last = 'delete'" (itemClick)="last = $event.key"
            [items]="[{ key: 'delete-all', label: 'Delete all versions', danger: true }]">
            Delete
          </andes-dropdown-button>
          <andes-dropdown-button disabled>Disabled</andes-dropdown-button>
        </div>
      </div>
    `,
  }),
};

/** `AndesDropdownButton` sizes, `loading` (with `loadingDelay`/`loadingIcon`), a custom caret `icon` and `trigger="hover"`. */
export const DropdownButtonStates: Story = {
  render: () => ({
    moduleMetadata: {
      imports: [NgIcon, AndesDropdownButton],
      providers: [ICONS],
    },
    // Not `loading`: Storybook writes a prop that is not an input of the meta component
    // (`AndesDropdownMenu`) straight onto the first instance provided under that token -
    // here the first dropdown button, whose `loading` input it would replace.
    props: {
      saving: false,
      items: [
        { key: 'draft', label: 'Save as draft' },
        { key: 'template', label: 'Save as template' },
      ],
    },
    template: `
      <ng-template #moreIcon><ng-icon name="lucidePlus" /></ng-template>
      <ng-template #dots><svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" style="display: block; width: 1em; height: 1em;"><circle cx="5" cy="12" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="19" cy="12" r="1.5" /></svg></ng-template>
      <div style="display: grid; gap: 1rem; justify-items: start;">
        <div style="display: flex; gap: 1rem; align-items: center;">
          <andes-dropdown-button size="sm" [items]="items">Small</andes-dropdown-button>
          <andes-dropdown-button [items]="items">Medium</andes-dropdown-button>
          <andes-dropdown-button size="lg" [items]="items">Large</andes-dropdown-button>
        </div>
        <div style="display: flex; gap: 1rem; align-items: center;">
          <andes-dropdown-button
            variant="primary"
            [loading]="saving"
            [items]="items"
            (buttonClick)="saving = !saving"
          >
            {{ saving ? 'Saving… (click to stop)' : 'Save (click me)' }}
          </andes-dropdown-button>
          <andes-dropdown-button loading [loadingDelay]="1000" [items]="items">Spinner after 1s</andes-dropdown-button>
          <andes-dropdown-button loading [loadingIcon]="dots" [items]="items">Custom loading icon</andes-dropdown-button>
          <andes-dropdown-button [icon]="moreIcon" trigger="hover" [items]="items">Hover, custom caret</andes-dropdown-button>
        </div>
      </div>
    `,
  }),
};
