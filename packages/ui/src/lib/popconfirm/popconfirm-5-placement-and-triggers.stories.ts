import { NgIcon } from '@ng-icons/core';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';

import {
  about,
  bar,
  grid,
  placementBoard,
  PLACEMENT_RING,
  stage,
  withDescription,
  withPopoverKit,
  wideStage,
} from '../../testing/popover-story-kit';
import { AndesButton } from '../button/button';
import { AndesInput } from '../input/input';
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
      imports: [
        AndesButton,
        AndesInput,
        AndesTag,
        NgIcon,
        AndesPopconfirmTrigger,
      ],
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
            <andes-button size="sm" variant="outline" andesPopconfirmTrigger>{{ placement }}</andes-button>
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

/** Focus on a field. */
export const FocusOnField: Story = {
  name: 'Focus on a field',
  parameters: about(
    'On a field the question sits against the whole outer box of the control with the normal gap, and the arrow points at its edge, never over the field.',
  ),
  render: () => ({
    template: `
      <div style="${stage}">
        <andes-popconfirm trigger="focus" placement="right" title="Use the saved address?" [showCancel]="false" okText="Use it">
          <andes-input andesPopconfirmTrigger aria-label="Address" placeholder="Focus this field" style="width: 16rem;" />
        </andes-popconfirm>
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
            <andes-popconfirm [placement]="placement" [defaultOpen]="true" [closeOnEscape]="false" [closeOnOutsideClick]="false" [title]="placement" [showCancel]="false" okText="OK">
              <andes-button size="sm" variant="outline" andesPopconfirmTrigger>{{ placement }}</andes-button>
            </andes-popconfirm>
          </div>
        }
      </div>
    `,
  }),
};

/** Preview, then confirm. */
export const PreviewThenConfirm: Story = {
  name: 'Hover previews, click asks',
  parameters: about(
    'Hovering previews the question without buttons; a click turns the same panel into the confirmation, with Cancel and OK, and it stays open when the pointer leaves until it is answered.',
  ),
  render: () => ({
    template: `
      <div style="${stage}">
        <andes-popconfirm [trigger]="['hover', 'click']" actionsOn="click" [title]="question" okType="danger" okText="Delete" description="Hover to preview, click to decide.">
          <andes-button variant="danger" andesPopconfirmTrigger>Delete the task</andes-button>
        </andes-popconfirm>
        <ng-template #question let-mode="mode">{{ mode === 'click' ? 'Delete the task for good?' : 'Delete the task?' }}</ng-template>
      </div>
    `,
  }),
};

/** Edges of the window. */
export const EdgesOfTheWindow: Story = {
  name: 'Near the edges of the window',
  parameters: about(
    'Triggers fixed at each corner and edge of the window: a question that does not fit on its side flips to the other one, and one that overflows along the edge slides back in, with the arrow still on its trigger.',
  ),
  render: () => ({
    template: `
      <div>
        <andes-popconfirm placement="top" title="Flipped below" [showCancel]="false" okText="OK"><andes-button size="sm" variant="outline" andesPopconfirmTrigger style="position: fixed; top: 0.5rem; left: 0.5rem;">top left</andes-button></andes-popconfirm>
        <andes-popconfirm placement="top" title="Flipped below and shifted in" [showCancel]="false" okText="OK"><andes-button size="sm" variant="outline" andesPopconfirmTrigger style="position: fixed; top: 0.5rem; right: 0.5rem;">top right</andes-button></andes-popconfirm>
        <andes-popconfirm placement="left" title="Flipped to the right" [showCancel]="false" okText="OK"><andes-button size="sm" variant="outline" andesPopconfirmTrigger style="position: fixed; top: 50%; left: 0.5rem;">left</andes-button></andes-popconfirm>
        <andes-popconfirm placement="right" title="Flipped to the left" [showCancel]="false" okText="OK"><andes-button size="sm" variant="outline" andesPopconfirmTrigger style="position: fixed; top: 50%; right: 0.5rem;">right</andes-button></andes-popconfirm>
        <andes-popconfirm placement="bottom" title="Flipped above" [showCancel]="false" okText="OK"><andes-button size="sm" variant="outline" andesPopconfirmTrigger style="position: fixed; bottom: 0.5rem; left: 0.5rem;">bottom left</andes-button></andes-popconfirm>
        <andes-popconfirm placement="bottom" title="Flipped above and shifted in" [showCancel]="false" okText="OK"><andes-button size="sm" variant="outline" andesPopconfirmTrigger style="position: fixed; bottom: 0.5rem; right: 0.5rem;">bottom right</andes-button></andes-popconfirm>
      </div>
    `,
  }),
};

/** Stretched trigger. */
export const StretchedTrigger: Story = {
  name: 'Trigger stretched by its cell',
  parameters: about(
    'A button whose host is stretched across a grid column or a flex row still gets its question against the visible button, not against the empty stretch around it.',
  ),
  render: () => ({
    template: `
      <div style="${stage}">
        <div style="display: grid; grid-template-columns: 18rem; gap: 2rem;">
          <andes-popconfirm placement="bottom" title="Grid item" [showCancel]="false" okText="OK">
            <andes-button size="sm" variant="outline" andesPopconfirmTrigger style="width: 100%;">Stretched in a grid</andes-button>
          </andes-popconfirm>
          <div style="display: flex; flex-direction: column; align-items: stretch;">
            <andes-popconfirm placement="right" title="Flex item" [showCancel]="false" okText="OK">
              <andes-button size="sm" variant="outline" andesPopconfirmTrigger style="align-self: stretch;">Stretched in a flex column</andes-button>
            </andes-popconfirm>
          </div>
        </div>
      </div>
    `,
  }),
};

/** Ghost and icon triggers. */
export const GhostAndIconTriggers: Story = {
  name: 'Ghost and icon buttons',
  parameters: about(
    'A ghost button and an icon-only button draw little or nothing around themselves, and the question still sits against the control and points at its middle.',
  ),
  render: () => ({
    template: `
      <div style="${wideStage}">
        <andes-popconfirm title="Remove it?" okType="danger" okText="Remove">
          <andes-button variant="ghost" andesPopconfirmTrigger style="width: 9rem;">Ghost</andes-button>
        </andes-popconfirm>
        <andes-popconfirm title="Delete the task?" icon="lucideTrash2" okType="danger" okText="Delete">
          <andes-button size="icon" variant="ghost" andesPopconfirmTrigger aria-label="Delete"><ng-icon name="lucideTrash2" aria-hidden="true" /></andes-button>
        </andes-popconfirm>
        <andes-popconfirm title="Delete the task?" icon="lucideTrash2" okType="danger" okText="Delete">
          <andes-button size="icon" variant="outline" andesPopconfirmTrigger aria-label="Delete"><ng-icon name="lucideTrash2" aria-hidden="true" /></andes-button>
        </andes-popconfirm>
      </div>
    `,
  }),
};

/** In a table cell. */
export const InATableCell: Story = {
  name: 'Trigger inside a table cell',
  parameters: about(
    'A trigger in a table cell opens its question against the button, not against the cell, and the table does not clip it.',
  ),
  render: () => ({
    props: { rows: ['report-2024.pdf', 'budget.xlsx', 'notes.md'] },
    template: `
      <div style="${stage}">
        <table style="border-collapse: collapse; width: min(30rem, 100%); font-size: 0.875rem; font-family: var(--andes-font-family), sans-serif; color: var(--andes-color-foreground);">
          <tbody>
            @for (row of rows; track row) {
              <tr style="border-bottom: 1px solid var(--andes-color-border);">
                <td style="padding: 0.5rem 0.75rem; width: 100%;">{{ row }}</td>
                <td style="padding: 0.5rem 0.75rem;">
                  <andes-popconfirm placement="left" [title]="'Delete ' + row + '?'" okType="danger" okText="Delete">
                    <andes-button size="sm" variant="outline" andesPopconfirmTrigger>Delete</andes-button>
                  </andes-popconfirm>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    `,
  }),
};

/** Scaled ancestor. */
export const InsideScaledAncestor: Story = {
  name: 'Inside a scaled ancestor',
  parameters: about(
    'A trigger inside a transformed or scaled ancestor still gets its question against its visible box, because the panel is measured from the trigger; only the container input needs an ancestor without a transform.',
  ),
  render: () => ({
    template: `
      <div style="${stage}">
        <div style="transform: scale(1.4) rotate(-3deg); transform-origin: center; padding: 1.5rem; border: 1px dashed var(--andes-color-border); border-radius: var(--andes-radius-lg);">
          <andes-popconfirm placement="bottom" title="Delete the task?" okType="danger" okText="Delete">
            <andes-button variant="outline" andesPopconfirmTrigger>Scaled and rotated</andes-button>
          </andes-popconfirm>
        </div>
      </div>
    `,
  }),
};
