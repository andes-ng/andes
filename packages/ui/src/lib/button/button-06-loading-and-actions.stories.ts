import type { Meta, StoryObj } from '@storybook/angular';

import {
  about,
  bar,
  caption,
  column,
  field,
  withButtonKit,
  withDescription,
} from '../../testing/button-story-kit';
import { AndesButton } from './button';

/* Loading, and the buttons that run an action and show their own busy state. */

const meta: Meta<AndesButton> = {
  title: 'General/Button/Loading and actions',
  component: AndesButton,
  decorators: [withDescription, withButtonKit],
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<AndesButton>;

const wait = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

export const Loading: Story = {
  name: 'Loading',
  parameters: about(
    'loading swaps the icon for a spinner and blocks the click, and loadingDelay waits before showing it.',
  ),
  render: () => ({
    template: `
      <div style="${bar} gap: 1rem;">
        <andes-button [loading]="true">Save</andes-button>
        <andes-button variant="outline" [loading]="true">Save</andes-button>
        <andes-button [loading]="true" [loadingDelay]="1500">Delayed spinner (1.5 s)</andes-button>
      </div>
    `,
  }),
};

export const LoadingKeepsSize: Story = {
  name: 'Loading keeps the size',
  parameters: about(
    'The spinner is exactly the size of the icon it replaces, so each pair below is the same button with loading off and then on, and never changes size.',
  ),
  render: () => ({
    props: {
      sizes: ['xs', 'sm', 'md', 'lg'],
      iconSizes: ['icon-xs', 'icon-sm', 'icon', 'icon-lg'],
      states: [false, true],
    },
    template: `
      <div style="${column} gap: 0.75rem;">
        @for (size of sizes; track size) {
          <div style="${bar}">
            @for (on of states; track on) {
              <andes-button [size]="size" [loading]="on"><ng-icon slot="icon-start" name="lucideSearch" />Search</andes-button>
            }
            @for (on of states; track on) {
              <andes-button [size]="size" variant="outline" [loading]="on">Save</andes-button>
            }
          </div>
        }
        @for (size of iconSizes; track size) {
          <div style="${bar}">
            @for (on of states; track on) {
              <andes-button [size]="size" [loading]="on" aria-label="Search"><ng-icon name="lucideSearch" /></andes-button>
            }
            @for (on of states; track on) {
              <andes-button [size]="size" shape="circle" variant="outline" [loading]="on" aria-label="Search"><ng-icon name="lucideSearch" /></andes-button>
            }
          </div>
        }
      </div>
    `,
  }),
};

export const CustomLoadingIcon: Story = {
  name: 'Custom loading icon',
  parameters: about(
    'loadingIcon takes a template that replaces the default spinner.',
  ),
  render: () => ({
    template: `
      <ng-template #spinningLoader>
        <ng-icon name="lucideLoaderCircle" class="spinning-loader" />
      </ng-template>
      <andes-button [loading]="true" [loadingIcon]="spinningLoader">Save</andes-button>
      <style>
        @keyframes andes-story-spin { to { transform: rotate(360deg); } }
        .spinning-loader ::ng-deep svg { animation: andes-story-spin 0.8s linear infinite; }
      </style>
    `,
  }),
};

export const ClickAction: Story = {
  name: 'Click action',
  parameters: about(
    'clickAction runs on the click and, when it returns a promise, keeps the button loading until the promise settles, so an async save needs no loading flag of its own.',
  ),
  render: () => ({
    props: {
      saveInvoice: () => wait(1500),
      sendInvoice: () => wait(2500),
    },
    template: `
      <div style="${bar} gap: 1rem;">
        <andes-button [clickAction]="saveInvoice">
          <ng-icon slot="icon-start" name="lucideSave" />
          Save
        </andes-button>
        <andes-button variant="outline" [clickAction]="sendInvoice">
          <ng-icon slot="icon-start" name="lucideSend" />
          Send
        </andes-button>
        <andes-button size="icon" variant="ghost" aria-label="Download" [clickAction]="saveInvoice"><ng-icon name="lucideDownload" /></andes-button>
      </div>
    `,
  }),
};

export const Interruptible: Story = {
  name: 'Interruptible action',
  parameters: about(
    'interruptible keeps the button clickable while its action runs, so a second click starts a fresh action and only the newest one ends the loading state.',
  ),
  render: () => {
    const stats = { runs: 0 };
    return {
      props: {
        stats,
        search: () => {
          stats.runs += 1;
          return wait(2000);
        },
      },
      template: `
        <div style="${field}">
          <andes-button interruptible variant="outline" [clickAction]="search">
            <ng-icon slot="icon-start" name="lucideSearch" />
            Search again
          </andes-button>
          <span style="${caption}">Started {{ stats.runs }} time(s)</span>
        </div>
      `,
    };
  },
};

export const FocusWhileBusy: Story = {
  name: 'Focus while busy',
  parameters: about(
    'focusableWhenDisabled keeps a loading or disabled button in the tab order with aria-disabled instead of the native attribute, so keyboard focus is not lost mid-action while clicks stay blocked.',
  ),
  render: () => ({
    template: `
      <div style="${bar} gap: 1rem;">
        <andes-button focusableWhenDisabled [clickAction]="slowSave">Tab to me, then press</andes-button>
        <andes-button focusableWhenDisabled loading>Busy but focusable</andes-button>
        <andes-button focusableWhenDisabled disabled variant="outline">Disabled but focusable</andes-button>
      </div>
    `,
    props: { slowSave: () => wait(3000) },
  }),
};
