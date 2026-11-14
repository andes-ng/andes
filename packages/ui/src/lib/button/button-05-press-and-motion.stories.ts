import type { Meta, StoryObj } from '@storybook/angular';

import {
  about,
  bar,
  caption,
  column,
  field,
  floor,
  withButtonKit,
  withDescription,
} from '../../testing/button-story-kit';
import { AndesButton } from './button';

/* What happens when a button is pressed: the scale, the ripple, and the lift of a floating button. */

const meta: Meta<AndesButton> = {
  title: 'General/Button/Press and motion',
  component: AndesButton,
  decorators: [withDescription, withButtonKit],
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<AndesButton>;

export const PressFeedback: Story = {
  name: 'Press feedback',
  parameters: about(
    'While pressed a button scales down a little and eases back, which is on by default, skipped for disabled and loading buttons and turned off for users who prefer reduced motion.',
  ),
  render: () => ({
    template: `
      <div style="${bar} gap: 1rem;">
        <andes-button>Primary</andes-button>
        <andes-button variant="secondary">Secondary</andes-button>
        <andes-button variant="outline">Outline</andes-button>
        <andes-button variant="ghost">Ghost</andes-button>
        <andes-button variant="danger">Destructive</andes-button>
        <andes-button disabled>Disabled</andes-button>
        <andes-button loading>Loading</andes-button>
      </div>
    `,
  }),
};

export const PressFeedbackOptOut: Story = {
  name: 'Turning the press off',
  parameters: about(
    'pressScale set to false keeps the colour change of the press but drops the scale, for a button with its own press styling.',
  ),
  render: () => ({
    template: `
      <div style="${bar} gap: 1rem;">
        <div style="${field}"><andes-button>With the scale</andes-button><span style="${caption}">Default</span></div>
        <div style="${field}"><andes-button [pressScale]="false">Without the scale</andes-button><span style="${caption}">[pressScale]="false"</span></div>
      </div>
    `,
  }),
};

export const PressScale: Story = {
  name: 'Choosing the scale',
  parameters: about(
    'The --andes-button-press-scale custom property sets how far the press goes: below 1 shrinks the button, above 1 grows it, and --andes-button-press-duration changes the speed.',
  ),
  render: () => ({
    template: `
      <div style="${bar} gap: 1.5rem;">
        <div style="${field}"><andes-button>Subtle</andes-button><span style="${caption}">0.98, the default</span></div>
        <div style="${field}"><andes-button style="--andes-button-press-scale: 0.92;">Deep</andes-button><span style="${caption}">0.92</span></div>
        <div style="${field}"><andes-button style="--andes-button-press-scale: 1.04;">Grows</andes-button><span style="${caption}">1.04</span></div>
        <div style="${field}"><andes-button style="--andes-button-press-scale: 0.94; --andes-button-press-duration: 300ms;">Slow</andes-button><span style="${caption}">0.94 over 300ms</span></div>
      </div>
    `,
  }),
};

export const Ripple: Story = {
  name: 'Ripple',
  parameters: about(
    'The press ripple is on by default and ripple set to false turns it off.',
  ),
  render: () => ({
    template: `
      <div style="${bar} gap: 1rem;">
        <andes-button>With ripple</andes-button>
        <andes-button [ripple]="false">Without ripple</andes-button>
      </div>
    `,
  }),
};

export const Elevation: Story = {
  name: 'Elevation',
  parameters: about(
    'elevation raises a button on a low, medium or high shadow for a floating action, and the floating button still scales when pressed.',
  ),
  render: () => ({
    template: `
      <div style="${floor}">
        <andes-button elevation="low">Low</andes-button>
        <andes-button elevation="medium">Medium</andes-button>
        <andes-button elevation="high">High</andes-button>
        <andes-button elevation="high" variant="secondary" shape="full">
          <ng-icon slot="icon-start" name="lucidePlus" />
          Compose
        </andes-button>
        <andes-button elevation="high" size="icon-lg" shape="circle" aria-label="Add"><ng-icon name="lucidePlus" /></andes-button>
      </div>
    `,
  }),
};

export const PressInAColumn: Story = {
  name: 'Press in a column',
  parameters: about(
    'Full-width buttons in a stack press without moving their neighbours, because the scale never changes the layout.',
  ),
  render: () => ({
    template: `
      <div style="${column} width: 18rem;">
        <andes-button fullWidth>Continue</andes-button>
        <andes-button fullWidth variant="outline">Back</andes-button>
      </div>
    `,
  }),
};
