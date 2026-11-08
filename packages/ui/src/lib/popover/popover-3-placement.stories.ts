import { signal } from '@angular/core';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';

import {
  about,
  bar,
  grid,
  placementBoard,
  PLACEMENT_OPTIONS,
  PLACEMENT_RING,
  wideStage,
  withDescription,
  withPopoverKit,
} from '../../testing/popover-story-kit';
import { AndesButton } from '../button/button';
import { AndesInputNumber } from '../input-number/input-number';
import { AndesSelect } from '../select/select';
import { AndesSwitch } from '../switch/switch';
import { AndesPopover } from './popover';
import { AndesPopoverContent } from './popover-content';
import { AndesPopoverTrigger } from './popover-trigger';

const meta: Meta<AndesPopover> = {
  title: 'Data Display/Popover/Placement',
  component: AndesPopover,
  decorators: [
    withDescription,
    withPopoverKit,
    moduleMetadata({
      imports: [
        AndesButton,
        AndesInputNumber,
        AndesSelect,
        AndesSwitch,
        AndesPopoverTrigger,
        AndesPopoverContent,
      ],
    }),
  ],
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<AndesPopover>;

/** The twelve placements. */
export const TwelvePlacements: Story = {
  name: 'Twelve placements',
  parameters: about(
    'The twelve placements as a ring around the middle: the word names the side, and Left, Right, Top or Bottom after it names the edge the panel lines up with.',
  ),
  render: () => ({
    props: { placements: PLACEMENT_RING },
    template: `
      <div style="${grid}">
        @for (placement of placements; track placement) {
          <andes-popover [placement]="placement" [showArrow]="true" [content]="placement">
            <andes-button size="sm" variant="outline" andesPopoverTrigger style="width: 100%;">{{ placement }}</andes-button>
          </andes-popover>
        }
      </div>
    `,
  }),
};

/** Side and align. */
export const SideAndAlign: Story = {
  name: 'Side and align',
  parameters: about(
    'side and align are the same twelve placements in two inputs: the side of the trigger, and the start, centre or end of that side.',
  ),
  render: () => ({
    props: {
      sides: ['top', 'right', 'bottom', 'left'],
      aligns: ['start', 'center', 'end'],
    },
    template: `
      <div style="${grid}">
        @for (side of sides; track side) {
          @for (align of aligns; track align) {
            <andes-popover [side]="side" [align]="align" [showArrow]="true" [content]="side + ' / ' + align">
              <andes-button size="sm" variant="outline" andesPopoverTrigger style="width: 100%;">{{ side }} / {{ align }}</andes-button>
            </andes-popover>
          }
        }
      </div>
    `,
  }),
};

/** Choose the placement. */
export const ChoosePlacement: Story = {
  name: 'Choose the placement',
  parameters: about(
    'A select drives placement, so every one of the twelve can be tried on a single trigger.',
  ),
  render: () => ({
    props: {
      placement: signal<unknown>('bottomLeft'),
      options: PLACEMENT_OPTIONS,
    },
    template: `
      <div style="${wideStage} flex-direction: column;">
        <andes-select aria-label="Placement" style="width: 12rem;" [options]="options" [(value)]="placement" />
        <andes-popover [placement]="$any(placement())" [showArrow]="true" content="Placed where the select says.">
          <andes-button variant="outline" andesPopoverTrigger>Open</andes-button>
        </andes-popover>
      </div>
    `,
  }),
};

/** Arrow position. */
export const ArrowPointAtCenter: Story = {
  name: 'Arrow at the trigger centre',
  parameters: about(
    'An edge-aligned panel keeps its arrow near the aligned edge, while arrowPointAtCenter slides the panel so the arrow points at the middle of the trigger.',
  ),
  render: () => ({
    template: `
      <div style="${wideStage}">
        <andes-popover placement="bottomLeft" [showArrow]="true" content="The arrow sits near the left edge.">
          <andes-button variant="outline" andesPopoverTrigger>bottomLeft</andes-button>
        </andes-popover>
        <andes-popover placement="bottomLeft" [showArrow]="true" [arrowPointAtCenter]="true" content="The arrow points at the centre.">
          <andes-button variant="outline" andesPopoverTrigger>bottomLeft, point at centre</andes-button>
        </andes-popover>
      </div>
    `,
  }),
};

/** Offsets. */
export const Offsets: Story = {
  name: 'Offsets',
  parameters: about(
    'sideOffset sets the gap to the trigger and alignOffset slides the panel along it, both in pixels.',
  ),
  render: () => ({
    template: `
      <div style="${wideStage}">
        <andes-popover [sideOffset]="2" content="A 2px gap.">
          <andes-button variant="outline" andesPopoverTrigger>sideOffset 2</andes-button>
        </andes-popover>
        <andes-popover [sideOffset]="24" content="A 24px gap.">
          <andes-button variant="outline" andesPopoverTrigger>sideOffset 24</andes-button>
        </andes-popover>
        <andes-popover placement="bottomLeft" [alignOffset]="32" content="Moved 32px along the edge.">
          <andes-button variant="outline" andesPopoverTrigger>alignOffset 32</andes-button>
        </andes-popover>
      </div>
    `,
  }),
};

/** Flip. */
export const FlipsAtTheEdge: Story = {
  name: 'Flips at the edge',
  parameters: about(
    'Near the top of the window a top panel opens below the trigger instead, and the arrow still faces it; autoAdjustOverflow is on by default.',
  ),
  render: () => ({
    template: `
      <div style="${bar} justify-content: center; padding: 0.25rem 1rem 12rem;">
        <andes-popover placement="top" [showArrow]="true" title="Flipped" content="There was no room above, so this opened below.">
          <andes-button variant="outline" andesPopoverTrigger>placement top, no room above</andes-button>
        </andes-popover>
      </div>
    `,
  }),
};

/** Flip off. */
export const AutoAdjustOff: Story = {
  name: 'Keeping the side',
  parameters: about(
    'With autoAdjustOverflow off the panel stays on its side even when it does not fit, here slipping under the top edge of the window.',
  ),
  render: () => ({
    template: `
      <div style="${bar} justify-content: center; padding: 0.25rem 1rem 12rem;">
        <andes-popover placement="top" [autoAdjustOverflow]="false" [showArrow]="true" content="Stays above, whether it fits or not.">
          <andes-button variant="outline" andesPopoverTrigger>autoAdjustOverflow off</andes-button>
        </andes-popover>
      </div>
    `,
  }),
};

/** Shift. */
export const ShiftsAlongTheEdge: Story = {
  name: 'Shifts along the edge',
  parameters: about(
    'A trigger at the far end of the row keeps its panel inside the window by sliding it along the side, and the arrow keeps pointing at the trigger.',
  ),
  render: () => ({
    template: `
      <div style="display: flex; justify-content: space-between; padding: 6rem 0;">
        <andes-popover placement="bottom" [showArrow]="true" content="Pushed in from the left edge of the window.">
          <andes-button size="sm" variant="outline" andesPopoverTrigger>Far left</andes-button>
        </andes-popover>
        <andes-popover placement="bottom" [showArrow]="true" content="Pushed in from the right edge of the window.">
          <andes-button size="sm" variant="outline" andesPopoverTrigger>Far right</andes-button>
        </andes-popover>
      </div>
    `,
  }),
};

/** Follows the trigger. */
export const FollowsOnScroll: Story = {
  name: 'Follows the trigger on scroll',
  parameters: about(
    'Scrolling the box moves the open panel with its trigger, and it scrolls out of view with it instead of hanging in the middle of the page.',
  ),
  render: () => ({
    template: `
      <div style="height: 14rem; width: min(26rem, 100%); overflow: auto; border: 1px solid var(--andes-color-border); border-radius: var(--andes-radius-lg); padding: 1rem;">
        <div style="height: 6rem;"></div>
        <andes-popover [defaultOpen]="true" [closeOnOutsideClick]="false" [showArrow]="true" content="I move with the trigger.">
          <andes-button variant="outline" andesPopoverTrigger>Scroll the box</andes-button>
        </andes-popover>
        <div style="height: 22rem;"></div>
      </div>
    `,
  }),
};

/** Arrow alignment. */
export const ArrowAlignment: Story = {
  name: 'Arrow alignment',
  parameters: about(
    'All twelve placements open at once with their arrow: the arrow sits on the border of the panel, points at the middle of the trigger, and keeps clear of the rounded corner beside it.',
  ),
  render: () => ({
    props: { placements: PLACEMENT_RING },
    template: `
      <div style="${placementBoard}">
        @for (placement of placements; track placement) {
          <div style="display: flex; align-items: center; justify-content: center; min-height: 9.5rem;">
            <andes-popover [placement]="placement" [showArrow]="true" [defaultOpen]="true" [closeOnEscape]="false" [closeOnOutsideClick]="false" [content]="placement">
              <andes-button size="sm" variant="outline" andesPopoverTrigger>{{ placement }}</andes-button>
            </andes-popover>
          </div>
        }
      </div>
    `,
  }),
};
