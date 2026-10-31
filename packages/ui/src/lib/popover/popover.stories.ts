import type { Meta, StoryObj } from '@storybook/angular';

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
import {
  ANDES_POPOVER_PLACEMENTS,
  ANDES_POPOVER_PRESET_COLORS,
} from './popover-types';

const PLACEMENTS = Object.keys(ANDES_POPOVER_PLACEMENTS);

const imports = [
  AndesButton,
  AndesInput,
  AndesPopoverTrigger,
  AndesPopoverContent,
  AndesPopoverHeader,
  AndesPopoverTitle,
  AndesPopoverDescription,
  AndesPopoverClose,
];

const meta: Meta<AndesPopover> = {
  title: 'Data Display/Popover/Basics/Popover',
  component: AndesPopover,
  tags: ['autodocs'],
  argTypes: {
    side: { control: 'select', options: ['top', 'right', 'bottom', 'left'] },
    align: { control: 'select', options: ['start', 'center', 'end'] },
    placement: { control: 'select', options: [undefined, ...PLACEMENTS] },
    trigger: {
      control: 'select',
      options: ['click', 'hover', 'focus', 'contextMenu'],
    },
    sideOffset: { control: 'number' },
    alignOffset: { control: 'number' },
    showArrow: { control: 'boolean' },
    arrowPointAtCenter: { control: 'boolean' },
    autoAdjustOverflow: { control: 'boolean' },
    openDelay: { control: 'number' },
    closeDelay: { control: 'number' },
    disabled: { control: 'boolean' },
    destroyOnHidden: { control: 'boolean' },
    zIndex: { control: 'number' },
    color: { control: 'text' },
    maxHeight: { control: 'text' },
  },
  args: {
    side: 'bottom',
    align: 'center',
    placement: undefined,
    trigger: 'click',
    sideOffset: 8,
    alignOffset: 0,
    showArrow: false,
    arrowPointAtCenter: false,
    autoAdjustOverflow: true,
    openDelay: 100,
    closeDelay: 100,
    disabled: false,
    destroyOnHidden: false,
  },
  render: (args) => ({
    moduleMetadata: { imports },
    props: args,
    template: `
      <div style="padding: 8rem;">
        <andes-popover
          [side]="side"
          [align]="align"
          [placement]="placement"
          [trigger]="trigger"
          [sideOffset]="sideOffset"
          [alignOffset]="alignOffset"
          [showArrow]="showArrow"
          [arrowPointAtCenter]="arrowPointAtCenter"
          [autoAdjustOverflow]="autoAdjustOverflow"
          [openDelay]="openDelay"
          [closeDelay]="closeDelay"
          [disabled]="disabled"
          [destroyOnHidden]="destroyOnHidden"
          [zIndex]="zIndex"
        >
          <andes-button andesPopoverTrigger>Open popover</andes-button>
          <andes-popover-content>
            <p style="margin: 0 0 0.5rem; font-size: 1rem; line-height: 1.5rem; font-weight: 600;">Popover title</p>
            <p style="margin: 0; font-size: 0.875rem;">This is the popover body content.</p>
          </andes-popover-content>
        </andes-popover>
      </div>
    `,
  }),
};

export default meta;

type Story = StoryObj<AndesPopover>;

export const Default: Story = {};

/**
 * The four `side` values crossed with the three `align` values. Each popover opens on its side of
 * the trigger and lines up with the start, center or end edge; the arrow follows the alignment.
 */
export const SidesAndAlignments: Story = {
  render: () => ({
    moduleMetadata: { imports },
    template: `
      <div style="display: grid; grid-template-columns: repeat(3, 8rem); gap: 3rem; padding: 6rem;">
        @for (side of ['top', 'right', 'bottom', 'left']; track side) {
          @for (align of ['start', 'center', 'end']; track align) {
            <andes-popover [side]="side" [align]="align" [showArrow]="true">
              <andes-button size="sm" andesPopoverTrigger>{{ side }}/{{ align }}</andes-button>
              <andes-popover-content>{{ side }} · {{ align }}</andes-popover-content>
            </andes-popover>
          }
        }
      </div>
    `,
  }),
};

/** The twelve `placement` values. */
export const Placements: Story = {
  render: () => ({
    moduleMetadata: { imports },
    props: { placements: PLACEMENTS },
    template: `
      <div style="display: grid; grid-template-columns: repeat(3, 8rem); gap: 3rem; padding: 6rem;">
        @for (placement of placements; track placement) {
          <andes-popover [placement]="placement" [showArrow]="true" [content]="placement">
            <andes-button size="sm" variant="outline" andesPopoverTrigger>{{ placement }}</andes-button>
          </andes-popover>
        }
      </div>
    `,
  }),
};

/**
 * Edge-aligned placements keep the arrow near the aligned edge; with
 * `arrowPointAtCenter` the panel shifts so the arrow points at the trigger's
 * center instead.
 */
export const ArrowPointAtCenter: Story = {
  render: () => ({
    moduleMetadata: { imports },
    template: `
      <div style="display: flex; gap: 4rem; padding: 8rem 4rem;">
        <andes-popover placement="bottomLeft" [showArrow]="true" content="Arrow near the left edge">
          <andes-button variant="outline" andesPopoverTrigger>bottomLeft (default arrow)</andes-button>
        </andes-popover>
        <andes-popover placement="bottomLeft" [showArrow]="true" [arrowPointAtCenter]="true" content="Arrow points at the center">
          <andes-button variant="outline" andesPopoverTrigger>bottomLeft + pointAtCenter</andes-button>
        </andes-popover>
      </div>
    `,
  }),
};

/**
 * What goes inside the panel. `title` and `content` accept plain strings (a structured header and
 * body) or templates for rich markup; a template can close the panel from within with
 * `andesPopoverClose`, without wiring `[(open)]`.
 */
export const Content: Story = {
  render: () => ({
    moduleMetadata: { imports },
    template: `
      <div style="display: flex; flex-wrap: wrap; gap: 1rem; padding: 8rem 2rem;">
        <andes-popover title="Title" content="Content of the popover, rendered as its body." [showArrow]="true">
          <andes-button variant="outline" andesPopoverTrigger>Title + content</andes-button>
        </andes-popover>
        <andes-popover [title]="titleTpl" [content]="bodyTpl" [showArrow]="true">
          <andes-button variant="outline" andesPopoverTrigger>Rich content</andes-button>
        </andes-popover>
        <andes-popover title="Column settings" [content]="closeTpl" [showArrow]="true">
          <andes-button variant="outline" andesPopoverTrigger>Close from content</andes-button>
        </andes-popover>
        <ng-template #titleTpl>
          <span style="display: inline-flex; align-items: center; gap: 0.375rem;">
            <span style="display: inline-block; width: 0.5rem; height: 0.5rem; border-radius: 9999px; background: var(--andes-color-success);"></span>
            Deployment healthy
          </span>
        </ng-template>
        <ng-template #bodyTpl>
          <p style="margin: 0 0 0.75rem; font-size: 0.875rem;">Last deploy <strong>12 minutes ago</strong> from <code>main</code>.</p>
          <andes-button size="sm" variant="outline">View logs</andes-button>
        </ng-template>
        <ng-template #closeTpl>
          <p style="margin: 0 0 0.75rem;">Pick the columns to show, then close.</p>
          <div style="display: flex; justify-content: flex-end;">
            <andes-button size="sm" andesPopoverClose>Done</andes-button>
          </div>
        </ng-template>
      </div>
    `,
  }),
};

/**
 * Composed from parts instead of the `title`/`content` inputs. The title and
 * description label and describe the panel (`aria-labelledby` /
 * `aria-describedby`) automatically; `andesPopoverClose` closes it and returns
 * focus to the trigger.
 */
export const ComposedContent: Story = {
  name: 'Composed content',
  render: () => ({
    moduleMetadata: { imports },
    template: `
      <div style="padding: 8rem;">
        <andes-popover side="bottom" align="start">
          <andes-button variant="outline" andesPopoverTrigger>Dimensions</andes-button>
          <andes-popover-content style="--andes-popover-min-width: 16rem;">
            <div andesPopoverHeader>
              <h3 andesPopoverTitle>Dimensions</h3>
              <p andesPopoverDescription>Set the dimensions for the layer.</p>
            </div>
            <div style="display: grid; grid-template-columns: auto 1fr; gap: 0.5rem 0.75rem; align-items: center; font-size: 0.875rem; margin-bottom: 0.75rem;">
              <label for="composed-width">Width</label>
              <andes-input id="composed-width" size="sm" value="100%" />
              <label for="composed-height">Height</label>
              <andes-input id="composed-height" size="sm" value="25px" />
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

/**
 * Every trigger mode, plus a combination. Hover waits `openDelay`/`closeDelay` (100ms by
 * default); the last popover opens slowly and closes quickly to show custom hover timing.
 */
export const Triggers: Story = {
  render: () => ({
    moduleMetadata: { imports },
    template: `
      <div style="display: flex; flex-wrap: wrap; gap: 1rem; padding: 8rem 2rem;">
        <andes-popover trigger="hover" title="Hover" content="Opens after 100ms on hover." [showArrow]="true">
          <andes-button variant="outline" andesPopoverTrigger>Hover me</andes-button>
        </andes-popover>
        <andes-popover trigger="focus" title="Focus" content="Opens while the trigger has focus." [showArrow]="true">
          <andes-button variant="outline" andesPopoverTrigger>Focus me</andes-button>
        </andes-popover>
        <andes-popover trigger="click" title="Click" content="Toggles on click." [showArrow]="true">
          <andes-button variant="outline" andesPopoverTrigger>Click me</andes-button>
        </andes-popover>
        <andes-popover trigger="contextMenu" title="Context menu" content="Opens on right click." [showArrow]="true">
          <andes-button variant="outline" andesPopoverTrigger>Right-click me</andes-button>
        </andes-popover>
        <andes-popover [trigger]="['hover', 'click']" title="Hover + click" content="Hover previews it; a click pins it open." [showArrow]="true">
          <andes-button variant="outline" andesPopoverTrigger>Hover or click</andes-button>
        </andes-popover>
        <andes-popover trigger="hover" [openDelay]="500" [closeDelay]="50" title="Hover delays" content="Slow to open (500ms), quick to close (50ms)." [showArrow]="true">
          <andes-button variant="outline" andesPopoverTrigger>Hover, 500ms delay</andes-button>
        </andes-popover>
      </div>
    `,
  }),
};

/**
 * `disabled` never opens; a disabled trigger (here an `andes-button`) is
 * ignored too. Wrapping a disabled native button in a plain element keeps the
 * wrapper usable as a hover trigger to explain why.
 */
export const Disabled: Story = {
  render: () => ({
    moduleMetadata: { imports },
    template: `
      <div style="display: flex; gap: 1rem; padding: 8rem 2rem;">
        <andes-popover [disabled]="true" content="Never shown">
          <andes-button variant="outline" andesPopoverTrigger>Popover disabled</andes-button>
        </andes-popover>
        <andes-popover content="Never shown">
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

/**
 * `color`: the six semantic presets, then arbitrary CSS colors - the text
 * switches to black or white by the background's lightness, and the border and
 * arrow follow the background.
 */
export const Colors: Story = {
  render: () => ({
    moduleMetadata: { imports },
    props: {
      presets: ANDES_POPOVER_PRESET_COLORS,
      custom: ['#7c3aed', '#fde68a', 'rgb(15 118 110)'],
    },
    template: `
      <div style="display: flex; flex-direction: column; gap: 1.5rem; padding: 2rem 2rem 8rem;">
        <div style="display: flex; flex-wrap: wrap; gap: 0.75rem;">
          @for (color of presets; track color) {
            <andes-popover [color]="color" [title]="color" content="Preset background." trigger="hover" [showArrow]="true">
              <andes-button variant="outline" andesPopoverTrigger>{{ color }}</andes-button>
            </andes-popover>
          }
        </div>
        <div style="display: flex; flex-wrap: wrap; gap: 0.75rem;">
          @for (color of custom; track color) {
            <andes-popover [color]="color" [title]="color" content="Custom background." trigger="hover" [showArrow]="true">
              <andes-button variant="outline" andesPopoverTrigger>{{ color }}</andes-button>
            </andes-popover>
          }
        </div>
      </div>
    `,
  }),
};
