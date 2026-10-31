import type { Meta, StoryObj } from '@storybook/angular';

import { AndesButton } from '../button/button';
import { AndesTextarea } from '../textarea/textarea';
import { AndesDrawer } from './drawer';
import { AndesDrawerClose } from './drawer-close';
import { AndesDrawerContent } from './drawer-content';
import {
  AndesDrawerDescription,
  AndesDrawerFooter,
  AndesDrawerHeader,
  AndesDrawerTitle,
} from './drawer-parts';
import { AndesDrawerTrigger } from './drawer-trigger';

const imports = [
  AndesButton,
  AndesTextarea,
  AndesDrawer,
  AndesDrawerTrigger,
  AndesDrawerHeader,
  AndesDrawerTitle,
  AndesDrawerDescription,
  AndesDrawerFooter,
  AndesDrawerClose,
  AndesDrawerContent,
];

const goalBody = `
  <div style="display: flex; align-items: center; justify-content: center; gap: 1rem;">
    <span style="font-size: 2rem; font-weight: 600;">350</span>
    <span style="color: var(--andes-color-muted-foreground);">calories/day</span>
  </div>
`;

const meta: Meta<AndesDrawer> = {
  title: 'Feedback/Drawer',
  component: AndesDrawer,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: ['default', 'large'] },
    height: { control: 'text' },
    mask: { control: 'boolean' },
    closable: { control: 'boolean' },
    closeOnEscape: { control: 'boolean' },
    closeOnOutsideClick: { control: 'boolean' },
    loading: { control: 'boolean' },
    closePlacement: { control: 'inline-radio', options: ['start', 'end'] },
    closeDisabled: { control: 'boolean' },
    maskBlur: { control: 'boolean' },
    resizable: { control: 'boolean' },
  },
  args: {
    size: 'default',
    height: null,
    mask: true,
    closable: true,
    closeOnEscape: true,
    closeOnOutsideClick: true,
    loading: false,
    closePlacement: 'end',
    closeDisabled: false,
    maskBlur: false,
    resizable: false,
  },
  render: (args) => ({
    moduleMetadata: { imports },
    props: args,
    template: `
      <andes-drawer
        [size]="size"
        [height]="height"
        [mask]="mask"
        [closable]="closable"
        [closeOnEscape]="closeOnEscape"
        [closeOnOutsideClick]="closeOnOutsideClick"
        [loading]="loading"
        [closePlacement]="closePlacement"
        [closeDisabled]="closeDisabled"
        [maskBlur]="maskBlur"
        [resizable]="resizable"
      >
        <andes-button variant="primary" andesDrawerTrigger>Open drawer</andes-button>

        <andes-drawer-header>
          <andes-drawer-title>Move goal</andes-drawer-title>
          <andes-drawer-description>Set your daily activity goal.</andes-drawer-description>
        </andes-drawer-header>

        ${goalBody}

        <andes-drawer-footer>
          <andes-button variant="primary" fullWidth andesDrawerClose>Submit</andes-button>
          <andes-button variant="outline" fullWidth andesDrawerClose>Cancel</andes-button>
        </andes-drawer-footer>
      </andes-drawer>
    `,
  }),
};

export default meta;

type Story = StoryObj<AndesDrawer>;

/** The playground: use the controls to try every drawer input on one drawer. */
export const Default: Story = {};

/**
 * Builds a labelled trigger plus a drawer carrying `attrs`, so a story can show several
 * configurations of the same drawer side by side.
 */
const drawerDemo = (attrs: string, label: string, text: string): string => `
  <andes-drawer ${attrs}>
    <andes-button variant="outline" andesDrawerTrigger>${label}</andes-button>
    <andes-drawer-header>
      <andes-drawer-title>${label}</andes-drawer-title>
      <andes-drawer-description>${text}</andes-drawer-description>
    </andes-drawer-header>
    ${goalBody}
    <andes-drawer-footer>
      <andes-button variant="primary" fullWidth andesDrawerClose>Submit</andes-button>
      <andes-button variant="outline" fullWidth andesDrawerClose>Cancel</andes-button>
    </andes-drawer-footer>
  </andes-drawer>
`;

const row = (...drawers: string[]): string =>
  `<div style="display: flex; flex-wrap: wrap; gap: 0.75rem;">${drawers.join('')}</div>`;

/**
 * Three ways to size the drawer: the default preset, `size="large"` (the 736px preset, capped at
 * the viewport height) and `height`, which takes a number (px) or any CSS length and wins over
 * `size`.
 */
export const Sizing: Story = {
  render: () => ({
    moduleMetadata: { imports },
    template: row(
      drawerDemo('', 'Default size', 'The default preset.'),
      drawerDemo('size="large"', 'Large size', 'The 736px preset.'),
      drawerDemo(
        'height="60vh"',
        'Custom height',
        'height="60vh" wins over size.',
      ),
    ),
  }),
};

/**
 * The backdrop. `maskBlur` blurs the page behind it; `[mask]="false"` drops it and makes the
 * drawer non-modal, so the page stays usable.
 */
export const Mask: Story = {
  render: () => ({
    moduleMetadata: { imports },
    template: row(
      drawerDemo(
        'maskBlur',
        'Blurred mask',
        'The page behind the backdrop is blurred.',
      ),
      drawerDemo(
        '[mask]="false" [closeOnOutsideClick]="false"',
        'No mask',
        'Non-modal: the page behind stays usable.',
      ),
    ),
  }),
};

/**
 * Closing. `closePlacement="start"` moves the close button to the header's leading corner;
 * `closeOnOutsideClick` and `closeOnEscape` set to false leave only the drawer's own actions;
 * `closeDisabled` keeps the close button visible but inert (Escape and the backdrop still close).
 */
export const Dismissal: Story = {
  render: () => ({
    moduleMetadata: { imports },
    template: row(
      drawerDemo(
        'closePlacement="start"',
        'Close at start',
        'The close button sits in the leading corner.',
      ),
      drawerDemo(
        '[closeOnOutsideClick]="false" [closeOnEscape]="false"',
        'Not dismissible',
        'Neither Escape nor a backdrop click closes this one.',
      ),
      drawerDemo(
        'closeDisabled',
        'Close disabled',
        'The close button is visible but inert.',
      ),
    ),
  }),
};

/** `loading` swaps the body for a skeleton; header, footer and close stay usable. */
export const Loading: Story = {
  args: { loading: true },
};

/**
 * `andesDrawerExtra` puts an action at the header's trailing end, and
 * `<ng-template andesDrawerContent>` renders the body lazily on first open
 * (kept alive between opens unless `destroyOnHidden`).
 */
export const ExtraAndLazyContent: Story = {
  render: () => ({
    moduleMetadata: { imports },
    template: `
      <andes-drawer>
        <andes-button variant="primary" andesDrawerTrigger>Open drawer</andes-button>
        <andes-drawer-header>
          <andes-drawer-title>Share note</andes-drawer-title>
          <andes-button variant="outline" size="sm" andesDrawerExtra>Copy link</andes-button>
        </andes-drawer-header>
        <ng-template andesDrawerContent>
          <label style="display: flex; flex-direction: column; gap: 0.25rem; font-size: 0.875rem;">
            Message (kept between opens)
            <andes-textarea rows="3" />
          </label>
        </ng-template>
        <andes-drawer-footer>
          <andes-button variant="primary" fullWidth andesDrawerClose>Send</andes-button>
        </andes-drawer-footer>
      </andes-drawer>
    `,
  }),
};

/**
 * `push` on the outer drawer lifts it while a nested drawer is open.
 * `(afterOpenChange)` fires once each slide finishes.
 */
export const NestedPush: Story = {
  render: () => ({
    moduleMetadata: { imports },
    props: { log: '' },
    template: `
      <andes-drawer push="120" (afterOpenChange)="log = log + ' · outer ' + ($event ? 'opened' : 'closed')">
        <andes-button variant="primary" andesDrawerTrigger>Open multi-level drawer</andes-button>
        <andes-drawer-header>
          <andes-drawer-title>First level</andes-drawer-title>
          <andes-drawer-description>Opening the second level lifts this one.</andes-drawer-description>
        </andes-drawer-header>

        <andes-drawer height="260" (afterOpenChange)="log = log + ' · inner ' + ($event ? 'opened' : 'closed')">
          <andes-button variant="outline" fullWidth andesDrawerTrigger>Open second level</andes-button>
          <andes-drawer-header>
            <andes-drawer-title>Second level</andes-drawer-title>
          </andes-drawer-header>
          <andes-drawer-footer>
            <andes-button variant="primary" fullWidth andesDrawerClose>Close</andes-button>
          </andes-drawer-footer>
        </andes-drawer>
      </andes-drawer>
      <p data-testid="after-open-log" style="font-family: var(--andes-font-family), sans-serif; font-size: 0.875rem; color: var(--andes-color-muted-foreground);">
        afterOpenChange: {{ log || ' —' }}
      </p>
    `,
  }),
};

/**
 * `resizable` adds a grip on the top edge: drag it, or focus it and use the
 * arrow keys (Shift for larger steps). `maxSize` caps the height in px.
 */
export const Resizable: Story = {
  render: () => ({
    moduleMetadata: { imports },
    props: { last: null },
    template: `
      <andes-drawer resizable [maxSize]="640" (resizeEnd)="last = $event">
        <andes-button variant="primary" andesDrawerTrigger>Open resizable drawer</andes-button>
        <andes-drawer-header>
          <andes-drawer-title>Activity log</andes-drawer-title>
          <andes-drawer-description>Pull the grip up for more rows (up to 640px).</andes-drawer-description>
        </andes-drawer-header>
        <p style="margin: 0; text-align: center;">Last height: {{ last ?? '—' }}{{ last ? 'px' : '' }}</p>
      </andes-drawer>
    `,
  }),
};
