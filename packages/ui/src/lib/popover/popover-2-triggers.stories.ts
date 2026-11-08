import { signal } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';

import {
  about,
  bar,
  caption,
  column,
  stage,
  withDescription,
  withPopoverKit,
  wideStage,
} from '../../testing/popover-story-kit';
import { AndesButton } from '../button/button';
import { AndesInput } from '../input/input';
import { AndesSwitch } from '../switch/switch';
import { AndesTag } from '../tag/tag';
import { AndesPopover } from './popover';
import { AndesPopoverContent } from './popover-content';
import { AndesPopoverTrigger } from './popover-trigger';

const meta: Meta<AndesPopover> = {
  title: 'Data Display/Popover/Triggers',
  component: AndesPopover,
  decorators: [
    withDescription,
    withPopoverKit,
    moduleMetadata({
      imports: [
        AndesButton,
        AndesInput,
        AndesSwitch,
        AndesTag,
        NgIcon,
        AndesPopoverTrigger,
        AndesPopoverContent,
      ],
    }),
  ],
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<AndesPopover>;

/** Click. */
export const Click: Story = {
  name: 'Click',
  parameters: about(
    'The default: a click opens the panel, a second click, Escape or a press outside closes it, and focus returns to the trigger.',
  ),
  render: () => ({
    template: `
      <div style="${stage}">
        <andes-popover trigger="click" title="Click" content="Toggles on every click." [showArrow]="true">
          <andes-button variant="outline" andesPopoverTrigger>Click me</andes-button>
        </andes-popover>
      </div>
    `,
  }),
};

/** Hover. */
export const Hover: Story = {
  name: 'Hover',
  parameters: about(
    'The panel opens 100ms after the pointer enters the trigger and stays while the pointer is over the trigger or the panel.',
  ),
  render: () => ({
    template: `
      <div style="${stage}">
        <andes-popover trigger="hover" title="Hover" content="Move onto this panel and it stays open." [showArrow]="true">
          <andes-button variant="outline" andesPopoverTrigger>Hover me</andes-button>
        </andes-popover>
      </div>
    `,
  }),
};

/** Focus. */
export const FocusTrigger: Story = {
  name: 'Focus',
  parameters: about(
    'The panel opens while the trigger has keyboard focus and closes when focus moves elsewhere, without taking focus itself.',
  ),
  render: () => ({
    template: `
      <div style="${stage}">
        <andes-popover trigger="focus" title="Password rules" content="Use at least 12 characters with a number." placement="right" [showArrow]="true">
          <andes-input andesPopoverTrigger aria-label="Password" type="password" placeholder="Focus this field" style="width: 14rem;" />
        </andes-popover>
      </div>
    `,
  }),
};

/** Context menu. */
export const ContextMenu: Story = {
  name: 'Context menu',
  parameters: about(
    'A right click (or the context-menu key) opens the panel and suppresses the browser menu on the trigger.',
  ),
  render: () => ({
    template: `
      <div style="${stage}">
        <andes-popover trigger="contextMenu" title="File actions" content="Rename, move or delete the file." [showArrow]="true">
          <andes-tag andesPopoverTrigger tabindex="0">report-2024.pdf (right click)</andes-tag>
        </andes-popover>
      </div>
    `,
  }),
};

/** Hover or click. */
export const HoverOrClick: Story = {
  name: 'Hover or click',
  parameters: about(
    'With an array of triggers, hover previews the panel and a click pins it open until it is dismissed.',
  ),
  render: () => ({
    template: `
      <div style="${stage}">
        <andes-popover [trigger]="['hover', 'click']" title="Preview or pin" content="Click the trigger to keep this open." [showArrow]="true">
          <andes-button variant="outline" andesPopoverTrigger>Hover or click</andes-button>
        </andes-popover>
      </div>
    `,
  }),
};

/** Focus and hover. */
export const FocusAndHover: Story = {
  name: 'Hover and focus',
  parameters: about(
    'Hover and focus together make the panel reachable by pointer and by keyboard: tabbing onto the trigger shows it just like hovering does.',
  ),
  render: () => ({
    template: `
      <div style="${stage}">
        <andes-popover [trigger]="['hover', 'focus']" title="Keyboard friendly" content="Shown on hover and on focus." [showArrow]="true">
          <andes-button variant="outline" andesPopoverTrigger>
            <ng-icon name="lucideCircleHelp" aria-hidden="true" /> Help
          </andes-button>
        </andes-popover>
      </div>
    `,
  }),
};

/** All four modes at once. */
export const AllModes: Story = {
  name: 'All four modes',
  parameters: about(
    'Click, hover, focus and context menu on one trigger, each opening the same panel the way its input does.',
  ),
  render: () => ({
    template: `
      <div style="${stage}">
        <andes-popover [trigger]="['click', 'hover', 'focus', 'contextMenu']" title="Any way in" content="Opened by click, hover, focus or right click." [showArrow]="true">
          <andes-button variant="outline" andesPopoverTrigger>Try anything</andes-button>
        </andes-popover>
      </div>
    `,
  }),
};

/** Slow open. */
export const OpenDelay: Story = {
  name: 'Open delay',
  parameters: about(
    'openDelay holds the panel back until the pointer has rested on the trigger, here 600ms, so passing over it does nothing.',
  ),
  render: () => ({
    template: `
      <div style="${stage}">
        <andes-popover trigger="hover" [openDelay]="600" title="Slow to open" content="Opens after 600ms of hovering." [showArrow]="true">
          <andes-button variant="outline" andesPopoverTrigger>Open delay 600ms</andes-button>
        </andes-popover>
      </div>
    `,
  }),
};

/** Slow close. */
export const CloseDelay: Story = {
  name: 'Close delay',
  parameters: about(
    'closeDelay keeps the panel up for a moment after the pointer leaves, here 800ms, which makes a small gap easy to cross.',
  ),
  render: () => ({
    template: `
      <div style="${stage}">
        <andes-popover trigger="hover" [closeDelay]="800" [sideOffset]="16" title="Slow to close" content="Stays for 800ms after you leave." [showArrow]="true">
          <andes-button variant="outline" andesPopoverTrigger>Close delay 800ms</andes-button>
        </andes-popover>
      </div>
    `,
  }),
};

/** No delay. */
export const NoDelay: Story = {
  name: 'No delay',
  parameters: about(
    'Both delays at 0 open and close the panel the moment the pointer crosses the trigger.',
  ),
  render: () => ({
    template: `
      <div style="${stage}">
        <andes-popover trigger="hover" [openDelay]="0" [closeDelay]="0" title="Instant" content="No delay in either direction." [showArrow]="true">
          <andes-button variant="outline" andesPopoverTrigger>Instant</andes-button>
        </andes-popover>
      </div>
    `,
  }),
};

/** Manual trigger. */
export const Manual: Story = {
  name: 'Manual',
  parameters: about(
    'An empty trigger list means the trigger never opens the panel by itself, so the page decides, here with a switch bound to open.',
  ),
  render: () => ({
    props: { visible: signal(false) },
    template: `
      <div style="${column} align-items: center; padding: 6rem 1rem;">
        <andes-switch [(checked)]="visible">Show the panel</andes-switch>
        <andes-popover [trigger]="[]" [(open)]="visible" [closeOnOutsideClick]="false" title="Manual" content="Only the switch opens and closes this panel." [showArrow]="true">
          <andes-tag andesPopoverTrigger>Anchor</andes-tag>
        </andes-popover>
      </div>
    `,
  }),
};

/** Disabled popover. */
export const DisabledPopover: Story = {
  name: 'Disabled popover',
  parameters: about(
    'A disabled popover never opens, and closes if it was open when it became disabled.',
  ),
  render: () => ({
    props: { disabled: signal(true) },
    template: `
      <div style="${wideStage}">
        <andes-switch [(checked)]="disabled">Disabled</andes-switch>
        <andes-popover [disabled]="disabled()" title="Maybe" content="Turn the switch off to open me." [showArrow]="true">
          <andes-button variant="outline" andesPopoverTrigger>Open</andes-button>
        </andes-popover>
      </div>
    `,
  }),
};

/** Disabled trigger. */
export const DisabledTrigger: Story = {
  name: 'Disabled trigger',
  parameters: about(
    'A disabled button never opens a panel, so an element around it can carry the hover that explains why it is disabled.',
  ),
  render: () => ({
    template: `
      <div style="${wideStage}">
        <andes-popover>
          <andes-button [disabled]="true" andesPopoverTrigger>Trigger disabled</andes-button>
        </andes-popover>
        <andes-popover trigger="hover" content="Publishing needs an approved review." [showArrow]="true">
          <span andesPopoverTrigger style="display: inline-block; cursor: not-allowed;">
            <andes-button variant="outline" disabled style="pointer-events: none;">Publish</andes-button>
          </span>
        </andes-popover>
      </div>
    `,
  }),
};

/** Trigger on other elements. */
export const OnAnyElement: Story = {
  name: 'On any element',
  parameters: about(
    'The trigger directive goes on whatever should open the panel: a button, a tag, an input or a plain element with a tab stop.',
  ),
  render: () => ({
    template: `
      <div style="${bar} justify-content: center; padding: 6rem 1rem;">
        <andes-popover content="Opened from a tag."><andes-tag andesPopoverTrigger [clickable]="true">Tag</andes-tag></andes-popover>
        <andes-popover content="Opened from an input." trigger="focus"><andes-input andesPopoverTrigger aria-label="Name" placeholder="Input" style="width: 9rem;" /></andes-popover>
        <andes-popover content="Opened from a plain element." trigger="hover"><span andesPopoverTrigger tabindex="0" style="${caption} text-decoration: underline dotted; cursor: help;">plain text</span></andes-popover>
      </div>
    `,
  }),
};
