import type { Meta, StoryObj } from '@storybook/angular';

import {
  about,
  bar,
  darkBox,
  withButtonKit,
  withDescription,
} from '../../testing/button-story-kit';
import { AndesButton } from './button';

/* Colour: the semantic colours, the danger shorthand and the ghost mode for dark surfaces. */

const meta: Meta<AndesButton> = {
  title: 'General/Button/Colors',
  component: AndesButton,
  decorators: [withDescription, withButtonKit],
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<AndesButton>;

export const ColorsAndVariants: Story = {
  name: 'Colors and variants',
  parameters: about(
    'color tints every variant except secondary and danger, which keep their own palette.',
  ),
  render: () => ({
    props: {
      colors: [undefined, 'primary', 'danger', 'success', 'warning', 'info'],
      variants: ['primary', 'outline', 'dashed', 'filled', 'ghost', 'link'],
    },
    template: `
      <div style="display: grid; grid-template-columns: repeat(6, max-content); gap: 0.75rem;">
        @for (color of colors; track $index) {
          @for (variant of variants; track variant) {
            <andes-button [variant]="variant" [color]="color">{{ color ?? 'default' }}</andes-button>
          }
        }
      </div>
    `,
  }),
};

export const Danger: Story = {
  name: 'Danger',
  parameters: about(
    'danger marks a destructive action without leaving the variant the layout calls for.',
  ),
  render: () => ({
    template: `
      <div style="${bar}">
        <andes-button danger>Delete</andes-button>
        <andes-button variant="outline" danger>Delete</andes-button>
        <andes-button variant="dashed" danger>Delete</andes-button>
        <andes-button variant="filled" danger>Delete</andes-button>
        <andes-button variant="ghost" danger>Delete</andes-button>
        <andes-button variant="link" danger>Delete</andes-button>
      </div>
    `,
  }),
};

export const GhostMode: Story = {
  name: 'Ghost mode',
  parameters: about(
    'ghost is the mode for dark or coloured surfaces: a transparent button with the outline and label in the colour.',
  ),
  render: () => ({
    template: `
      <div style="${darkBox}">
        <andes-button variant="primary" ghost>Primary</andes-button>
        <andes-button variant="secondary" ghost>Secondary</andes-button>
        <andes-button variant="danger" ghost>Danger</andes-button>
        <andes-button ghost danger>Delete</andes-button>
        <andes-button ghost color="success">Approve</andes-button>
      </div>
    `,
  }),
};
