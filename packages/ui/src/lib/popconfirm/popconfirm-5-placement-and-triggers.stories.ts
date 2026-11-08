import { NgIcon } from '@ng-icons/core';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';

import {
  about,
  bar,
  grid,
  PLACEMENT_RING,
  stage,
  withDescription,
  withPopoverKit,
  wideStage,
} from '../../testing/popover-story-kit';
import { AndesButton } from '../button/button';
import { AndesTag } from '../tag/tag';
import { AndesPopconfirmTrigger } from '../popover/popover-trigger';
import { AndesPopconfirm } from './popconfirm';

const meta: Meta<AndesPopconfirm> = {
  title: 'Feedback/Popconfirm/Placement and triggers',
  component: AndesPopconfirm,
  decorators: [
    withDescription,
    withPopoverKit,
    moduleMetadata({
      imports: [AndesButton, AndesTag, NgIcon, AndesPopconfirmTrigger],
    }),
  ],
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<AndesPopconfirm>;

/** Twelve placements. */
export const TwelvePlacements: Story = {
  name: 'Twelve placements',
  parameters: about(
    'The same twelve placements as the popover, as a ring around the middle; a popconfirm opens above its trigger when none is given.',
  ),
  render: () => ({
    props: { placements: PLACEMENT_RING },
    template: `
      <div style="${grid}">
        @for (placement of placements; track placement) {
          <andes-popconfirm [placement]="placement" [title]="placement" [showCancel]="false" okText="OK">
            <andes-button size="sm" variant="outline" andesPopconfirmTrigger style="width: 100%;">{{ placement }}</andes-button>
          </andes-popconfirm>
        }
      </div>
    `,
  }),
};

/** Arrow off. */
export const NoArrow: Story = {
  name: 'Without an arrow',
  parameters: about(
    'showArrow off drops the pointer, for a panel that sits close to its trigger or in a toolbar.',
  ),
  render: () => ({
    template: `
      <div style="${wideStage}">
        <andes-popconfirm title="Delete the task?" [showArrow]="false">
          <andes-button variant="outline" andesPopconfirmTrigger>No arrow</andes-button>
        </andes-popconfirm>
        <andes-popconfirm title="Delete the task?" [showArrow]="false" [sideOffset]="4">
          <andes-button variant="outline" andesPopconfirmTrigger>No arrow, 4px gap</andes-button>
        </andes-popconfirm>
      </div>
    `,
  }),
};

/** Arrow at centre. */
export const ArrowAtCenter: Story = {
  name: 'Arrow at the trigger centre',
  parameters: about(
    'An edge-aligned panel keeps its arrow near the edge unless arrowPointAtCenter slides it so the arrow points at the middle of the trigger.',
  ),
  render: () => ({
    template: `
      <div style="${wideStage}">
        <andes-popconfirm placement="bottomLeft" title="Delete the task?">
          <andes-button variant="outline" andesPopconfirmTrigger>bottomLeft</andes-button>
        </andes-popconfirm>
        <andes-popconfirm placement="bottomLeft" [arrowPointAtCenter]="true" title="Delete the task?">
          <andes-button variant="outline" andesPopconfirmTrigger>bottomLeft, point at centre</andes-button>
        </andes-popconfirm>
      </div>
    `,
  }),
};

/** Flip. */
export const FlipsAtTheEdge: Story = {
  name: 'Flips at the edge',
  parameters: about(
    'Near the top of the window a panel meant for above opens below the trigger instead, with the arrow facing it.',
  ),
  render: () => ({
    template: `
      <div style="${bar} justify-content: center; padding: 0.25rem 1rem 12rem;">
        <andes-popconfirm placement="top" title="Delete the task?" description="There is no room above this button.">
          <andes-button variant="outline" andesPopconfirmTrigger>Near the top</andes-button>
        </andes-popconfirm>
      </div>
    `,
  }),
};

/** Context menu. */
export const ContextMenuTrigger: Story = {
  name: 'Context menu trigger',
  parameters: about(
    'A right click on a row opens the question in place, for an action that lives in a context menu rather than on a button.',
  ),
  render: () => ({
    template: `
      <div style="${stage}">
        <andes-popconfirm trigger="contextMenu" title="Delete this file?" okType="danger" okText="Delete">
          <andes-tag andesPopconfirmTrigger tabindex="0">report-2024.pdf (right click)</andes-tag>
        </andes-popconfirm>
      </div>
    `,
  }),
};

/** Hover. */
export const HoverTrigger: Story = {
  name: 'Hover trigger',
  parameters: about(
    'Hover opens the question when the pointer rests on the trigger and keeps it while the pointer is over the panel, so the buttons can be reached.',
  ),
  render: () => ({
    template: `
      <div style="${stage}">
        <andes-popconfirm trigger="hover" title="Mute this channel?">
          <andes-button variant="outline" andesPopconfirmTrigger>Hover me</andes-button>
        </andes-popconfirm>
      </div>
    `,
  }),
};

/** Offsets. */
export const Offsets: Story = {
  name: 'Offsets',
  parameters: about(
    'sideOffset and alignOffset move the panel away from the trigger and along it, in pixels.',
  ),
  render: () => ({
    template: `
      <div style="${wideStage}">
        <andes-popconfirm [sideOffset]="20" title="Delete the task?">
          <andes-button variant="outline" andesPopconfirmTrigger>sideOffset 20</andes-button>
        </andes-popconfirm>
        <andes-popconfirm placement="bottomLeft" [alignOffset]="24" title="Delete the task?">
          <andes-button variant="outline" andesPopconfirmTrigger>alignOffset 24</andes-button>
        </andes-popconfirm>
      </div>
    `,
  }),
};
