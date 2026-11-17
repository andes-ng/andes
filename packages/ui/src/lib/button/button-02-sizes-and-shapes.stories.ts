import type { Meta, StoryObj } from '@storybook/angular';

import {
  about,
  bar,
  column,
  withButtonKit,
  withDescription,
} from '../../testing/button-story-kit';
import { AndesButton } from './button';

/* The sizes, the corner shapes and the width of a button. */

const meta: Meta<AndesButton> = {
  title: 'General/Button/Sizes and shapes',
  component: AndesButton,
  decorators: [withDescription, withButtonKit],
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<AndesButton>;

export const Sizes: Story = {
  name: 'Sizes',
  parameters: about(
    'The text sizes next to the square icon-only sizes, which each need an aria-label.',
  ),
  render: () => ({
    template: `
      <div style="${bar} gap: 1rem;">
        <andes-button size="xs">Extra small</andes-button>
        <andes-button size="sm">Small</andes-button>
        <andes-button size="md">Medium</andes-button>
        <andes-button size="lg">Large</andes-button>
        <andes-button size="icon-xs" aria-label="Search (extra small)"><ng-icon name="lucideSearch" /></andes-button>
        <andes-button size="icon-sm" aria-label="Search (small)"><ng-icon name="lucideSearch" /></andes-button>
        <andes-button size="icon" aria-label="Search"><ng-icon name="lucideSearch" /></andes-button>
        <andes-button size="icon-lg" aria-label="Search (large)"><ng-icon name="lucideSearch" /></andes-button>
      </div>
    `,
  }),
};

export const Shapes: Story = {
  name: 'Shapes',
  parameters: about(
    'The corner shapes: default, full (pill), round and the circular icon buttons.',
  ),
  render: () => ({
    template: `
      <div style="${bar}">
        <andes-button shape="default">Default</andes-button>
        <andes-button shape="full">Pill</andes-button>
        <andes-button shape="round">Round</andes-button>
        <andes-button shape="circle" size="icon" aria-label="Search"><ng-icon name="lucideSearch" /></andes-button>
        <andes-button shape="circle" variant="outline" size="icon" aria-label="Search"><ng-icon name="lucideSearch" /></andes-button>
        <andes-button shape="circle" variant="outline">A</andes-button>
        <andes-button shape="circle" size="lg" variant="dashed" aria-label="Add"><ng-icon name="lucidePlus" /></andes-button>
      </div>
    `,
  }),
};

export const FullWidth: Story = {
  name: 'Full width',
  parameters: about(
    'fullWidth stretches the button to fill its container, whatever the variant.',
  ),
  render: () => ({
    template: `
      <div style="${column} width: 20rem;">
        <andes-button fullWidth>Save</andes-button>
        <andes-button fullWidth variant="outline">Cancel</andes-button>
      </div>
    `,
  }),
};
