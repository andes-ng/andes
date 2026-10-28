import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideArrowLeft,
  lucideArrowRight,
  lucideChevronDown,
} from '@ng-icons/lucide';
import type { Meta, StoryObj } from '@storybook/angular';

import { AndesButton } from './button';
import { AndesButtonGroup } from './button-group';

const extraIcons = provideIcons({
  lucideArrowLeft,
  lucideArrowRight,
  lucideChevronDown,
});

const meta: Meta<AndesButtonGroup> = {
  title: 'General/Button/Layout/Group',
  component: AndesButtonGroup,
};

export default meta;

type Story = StoryObj<AndesButtonGroup>;

/** Adjacent buttons joined into one segmented control; the group's size reaches every button. */
export const Group: Story = {
  render: () => ({
    moduleMetadata: { imports: [AndesButton, NgIcon], providers: [extraIcons] },
    template: `
      <div style="display: flex; flex-direction: column; align-items: flex-start; gap: 1rem;">
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

/** A primary action with a joined icon button for the secondary choices. */
export const SplitButton: Story = {
  render: () => ({
    moduleMetadata: { imports: [AndesButton, NgIcon], providers: [extraIcons] },
    template: `
      <div style="display: flex; gap: 1rem;">
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

/** `orientation="vertical"` stacks the group. */
export const VerticalGroup: Story = {
  render: () => ({
    moduleMetadata: { imports: [AndesButton] },
    template: `
      <andes-button-group orientation="vertical" aria-label="Record actions" style="width: 180px;">
        <andes-button variant="outline">Duplicate</andes-button>
        <andes-button variant="outline">Archive</andes-button>
        <andes-button variant="outline" danger>Delete</andes-button>
      </andes-button-group>
    `,
  }),
};
