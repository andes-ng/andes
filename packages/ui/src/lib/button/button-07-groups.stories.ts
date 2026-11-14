import type { Meta, StoryObj } from '@storybook/angular';

import {
  about,
  bar,
  column,
  floor,
  withButtonKit,
  withDescription,
} from '../../testing/button-story-kit';
import { AndesButtonGroup } from './button-group';

/* Button groups: joined buttons, split buttons, vertical stacks, shared state and keyboard use. */

const meta: Meta<AndesButtonGroup> = {
  title: 'General/Button/Groups',
  component: AndesButtonGroup,
  decorators: [withDescription, withButtonKit],
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<AndesButtonGroup>;

export const Group: Story = {
  name: 'Group',
  parameters: about(
    'Adjacent buttons joined into one segmented control, where the size of the group reaches every button that does not set its own.',
  ),
  render: () => ({
    template: `
      <div style="${column}">
        <andes-button-group aria-label="Pages">
          <andes-button variant="outline"><ng-icon slot="icon-start" name="lucideArrowLeft" />Previous</andes-button>
          <andes-button variant="outline">Today</andes-button>
          <andes-button variant="outline">Next<ng-icon slot="icon-end" name="lucideArrowRight" /></andes-button>
        </andes-button-group>
        <andes-button-group size="sm" aria-label="Alignment">
          <andes-button variant="outline">Left</andes-button>
          <andes-button variant="outline">Center</andes-button>
          <andes-button variant="outline">Right</andes-button>
        </andes-button-group>
        <andes-button-group size="lg" aria-label="Actions">
          <andes-button>Save</andes-button>
          <andes-button>Save and close</andes-button>
        </andes-button-group>
      </div>
    `,
  }),
};

export const SplitButton: Story = {
  name: 'Split button',
  parameters: about(
    'A primary action with a joined icon button for the secondary choices.',
  ),
  render: () => ({
    template: `
      <div style="${bar} gap: 1rem;">
        <andes-button-group aria-label="Post invoice">
          <andes-button>Post invoice</andes-button>
          <andes-button size="icon" aria-label="More posting options"><ng-icon name="lucideChevronDown" /></andes-button>
        </andes-button-group>
        <andes-button-group aria-label="Export">
          <andes-button variant="outline">Export</andes-button>
          <andes-button variant="outline" size="icon" aria-label="More export formats"><ng-icon name="lucideChevronDown" /></andes-button>
        </andes-button-group>
      </div>
    `,
  }),
};

export const VerticalGroup: Story = {
  name: 'Vertical',
  parameters: about(
    'orientation set to vertical stacks the group, and every button spans its width.',
  ),
  render: () => ({
    template: `
      <andes-button-group orientation="vertical" aria-label="Record actions" style="width: 180px;">
        <andes-button variant="outline">Duplicate</andes-button>
        <andes-button variant="outline">Archive</andes-button>
        <andes-button variant="outline" danger>Delete</andes-button>
      </andes-button-group>
    `,
  }),
};

export const DisabledGroup: Story = {
  name: 'Disabled group',
  parameters: about(
    'disabled on the group disables every button in it at once, whatever their own state, and enabling it again restores them.',
  ),
  render: () => ({
    template: `
      <div style="${column}">
        <andes-button-group aria-label="Clipboard" [disabled]="true">
          <andes-button variant="outline">Copy</andes-button>
          <andes-button variant="outline">Cut</andes-button>
          <andes-button variant="outline">Paste</andes-button>
        </andes-button-group>
        <andes-button-group aria-label="Clipboard, enabled">
          <andes-button variant="outline">Copy</andes-button>
          <andes-button variant="outline" disabled>Cut</andes-button>
          <andes-button variant="outline">Paste</andes-button>
        </andes-button-group>
      </div>
    `,
  }),
};

export const ElevatedGroup: Story = {
  name: 'Elevated group',
  parameters: about(
    'elevation on the group lifts the connected buttons as one surface, like a floating action bar.',
  ),
  render: () => ({
    template: `
      <div style="${floor}">
        <andes-button-group aria-label="Zoom" elevation="medium">
          <andes-button variant="secondary" size="icon" aria-label="Zoom out"><ng-icon name="lucideZoomOut" /></andes-button>
          <andes-button variant="secondary">Reset</andes-button>
          <andes-button variant="secondary" size="icon" aria-label="Zoom in"><ng-icon name="lucideZoomIn" /></andes-button>
        </andes-button-group>
        <andes-button-group aria-label="Text style" elevation="high">
          <andes-button variant="outline" size="icon" aria-label="Bold"><ng-icon name="lucideBold" /></andes-button>
          <andes-button variant="outline" size="icon" aria-label="Italic"><ng-icon name="lucideItalic" /></andes-button>
          <andes-button variant="outline" size="icon" aria-label="Underline"><ng-icon name="lucideUnderline" /></andes-button>
        </andes-button-group>
      </div>
    `,
  }),
};

export const RovingGroup: Story = {
  name: 'One tab stop',
  parameters: about(
    'roving makes the group a single tab stop: Tab enters it, the arrow keys along the orientation move between the buttons, Home and End jump to the ends, and Tab leaves it.',
  ),
  render: () => ({
    template: `
      <div style="${column}">
        <andes-button-group aria-label="Edit" roving>
          <andes-button variant="outline">Undo</andes-button>
          <andes-button variant="outline">Redo</andes-button>
          <andes-button variant="outline" disabled>Revert</andes-button>
          <andes-button variant="outline">Clear</andes-button>
        </andes-button-group>
        <andes-button-group aria-label="Arrange" roving orientation="vertical" style="width: 180px;">
          <andes-button variant="outline">Bring forward</andes-button>
          <andes-button variant="outline">Send backward</andes-button>
          <andes-button variant="outline">Group</andes-button>
        </andes-button-group>
      </div>
    `,
  }),
};
