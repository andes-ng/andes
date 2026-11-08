import { NgIcon } from '@ng-icons/core';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';

import {
  about,
  PLACEMENTS,
  stage,
  withDescription,
  withPopoverKit,
} from '../../testing/popover-story-kit';
import { AndesButton } from '../button/button';
import { AndesInput } from '../input/input';
import { AndesPopover } from './popover';
import { AndesPopoverContent } from './popover-content';
import {
  AndesPopoverClose,
  AndesPopoverDescription,
  AndesPopoverHeader,
  AndesPopoverTitle,
} from './popover-parts';
import { AndesPopoverTrigger } from './popover-trigger';
import { ANDES_POPOVER_PRESET_COLORS } from './popover-types';

const imports = [
  AndesButton,
  AndesInput,
  NgIcon,
  AndesPopoverTrigger,
  AndesPopoverContent,
  AndesPopoverHeader,
  AndesPopoverTitle,
  AndesPopoverDescription,
  AndesPopoverClose,
];

const meta: Meta<AndesPopover> = {
  title: 'Data Display/Popover/Overview',
  component: AndesPopover,
  tags: ['autodocs'],
  decorators: [withDescription, withPopoverKit, moduleMetadata({ imports })],
  parameters: { layout: 'padded' },
  argTypes: {
    placement: { control: 'select', options: [undefined, ...PLACEMENTS] },
    side: { control: 'select', options: ['top', 'right', 'bottom', 'left'] },
    align: { control: 'select', options: ['start', 'center', 'end'] },
    trigger: {
      control: 'select',
      options: ['click', 'hover', 'focus', 'contextMenu'],
    },
    color: {
      control: 'select',
      options: [undefined, ...ANDES_POPOVER_PRESET_COLORS],
    },
    autoFocus: {
      control: 'select',
      options: ['first-tabbable', 'container', 'none'],
    },
    title: { control: 'text' },
    content: { control: 'text' },
    sideOffset: { control: 'number' },
    alignOffset: { control: 'number' },
    openDelay: { control: 'number' },
    closeDelay: { control: 'number' },
    zIndex: { control: 'number' },
    width: { control: 'text' },
    maxWidth: { control: 'text' },
    maxHeight: { control: 'text' },
    container: { control: false },
    classNames: { control: false },
    styles: { control: false },
    panelClass: { control: false },
    open: { control: false },
  },
  args: {
    title: 'Team settings',
    content: 'Invite people, set roles and choose who can publish.',
    placement: undefined,
    side: 'bottom',
    align: 'center',
    trigger: 'click',
    sideOffset: 8,
    alignOffset: 0,
    showArrow: false,
    arrowPointAtCenter: false,
    autoAdjustOverflow: true,
    openDelay: 100,
    closeDelay: 100,
    closeOnEscape: true,
    closeOnOutsideClick: true,
    autoFocus: 'first-tabbable',
    restoreFocus: true,
    disabled: false,
    destroyOnHidden: false,
  },
  render: (args) => ({
    props: args,
    template: `
      <div style="${stage}">
        <andes-popover
          [title]="title"
          [content]="content"
          [placement]="placement"
          [side]="side"
          [align]="align"
          [trigger]="trigger"
          [color]="color"
          [sideOffset]="sideOffset"
          [alignOffset]="alignOffset"
          [showArrow]="showArrow"
          [arrowPointAtCenter]="arrowPointAtCenter"
          [autoAdjustOverflow]="autoAdjustOverflow"
          [openDelay]="openDelay"
          [closeDelay]="closeDelay"
          [closeOnEscape]="closeOnEscape"
          [closeOnOutsideClick]="closeOnOutsideClick"
          [autoFocus]="autoFocus"
          [restoreFocus]="restoreFocus"
          [disabled]="disabled"
          [destroyOnHidden]="destroyOnHidden"
          [zIndex]="zIndex"
          [width]="width"
          [maxWidth]="maxWidth"
          [maxHeight]="maxHeight"
        >
          <andes-button variant="outline" andesPopoverTrigger>Team settings</andes-button>
        </andes-popover>
      </div>
    `,
  }),
};

export default meta;

type Story = StoryObj<AndesPopover>;

/** Every input of the popover, driven from the controls panel. */
export const Playground: Story = {
  name: 'Playground',
  parameters: about(
    'Change any input in the controls panel and open the popover to see it: placement, trigger, colour, delays, size and focus behaviour.',
  ),
};

/** The shortest useful popover: a trigger, a title and some text. */
export const TitleAndContent: Story = {
  name: 'Title and content',
  parameters: about(
    'Two inputs and a trigger are enough: title and content render as a heading and a 13px text in the panel.',
  ),
  render: () => ({
    template: `
      <div style="${stage}">
        <andes-popover title="Deployment" content="The last build finished 12 minutes ago.">
          <andes-button variant="outline" andesPopoverTrigger>Deployment</andes-button>
        </andes-popover>
      </div>
    `,
  }),
};

/** Without a title the text takes the full ink and the 14px size. */
export const ContentOnly: Story = {
  name: 'Content only',
  parameters: about(
    'With no title, the content is the whole message and keeps the regular 14px text in the full ink.',
  ),
  render: () => ({
    template: `
      <div style="${stage}">
        <andes-popover content="Only people with the link can view this file.">
          <andes-button variant="outline" andesPopoverTrigger>Who can see this?</andes-button>
        </andes-popover>
      </div>
    `,
  }),
};

/** Composed from parts. */
export const ComposedParts: Story = {
  name: 'Composed from parts',
  parameters: about(
    'A header, title and description label and describe the panel on their own, and any control in it stays reachable with Tab.',
  ),
  render: () => ({
    template: `
      <div style="${stage}">
        <andes-popover placement="bottomLeft">
          <andes-button variant="outline" andesPopoverTrigger>Dimensions</andes-button>
          <andes-popover-content style="--andes-popover-min-width: 16rem;">
            <div andesPopoverHeader>
              <h3 andesPopoverTitle>Dimensions</h3>
              <p andesPopoverDescription>Set the dimensions for the layer.</p>
            </div>
            <div style="display: grid; grid-template-columns: auto 1fr; gap: 0.5rem 0.75rem; align-items: center; margin-bottom: 0.75rem;">
              <span>Width</span>
              <andes-input aria-label="Width" size="sm" value="100%" />
              <span>Height</span>
              <andes-input aria-label="Height" size="sm" value="25px" />
            </div>
            <div style="display: flex; justify-content: flex-end;">
              <andes-button size="sm" andesPopoverClose>Done</andes-button>
            </div>
          </andes-popover-content>
        </andes-popover>
      </div>
    `,
  }),
};

/** A template as the content. */
export const RichTemplate: Story = {
  name: 'Rich template',
  parameters: about(
    'A template passed to content can hold any markup and library components, here a line of text with a button under it.',
  ),
  render: () => ({
    template: `
      <div style="${stage}">
        <andes-popover title="Storage" [content]="body">
          <andes-button variant="outline" andesPopoverTrigger>
            <ng-icon name="lucideInfo" aria-hidden="true" /> Storage
          </andes-button>
        </andes-popover>
        <ng-template #body>
          <p style="margin: 0 0 0.5rem;">You have used <strong>7.2 GB</strong> of 10 GB.</p>
          <andes-button size="sm" variant="outline">Upgrade plan</andes-button>
        </ng-template>
      </div>
    `,
  }),
};

/** The pointer on the panel. */
export const WithArrow: Story = {
  name: 'With an arrow',
  parameters: about(
    'showArrow draws a small pointer that always faces the trigger, even after the panel flips to the other side.',
  ),
  render: () => ({
    template: `
      <div style="${stage}">
        <andes-popover title="Notifications" content="You have 3 unread messages." [showArrow]="true">
          <andes-button variant="outline" andesPopoverTrigger>
            <ng-icon name="lucideBell" aria-hidden="true" /> Notifications
          </andes-button>
        </andes-popover>
      </div>
    `,
  }),
};
