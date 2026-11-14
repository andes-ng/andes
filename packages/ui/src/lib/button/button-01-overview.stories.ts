import type { Meta, StoryObj } from '@storybook/angular';

import {
  about,
  bar,
  column,
  withButtonKit,
  withDescription,
} from '../../testing/button-story-kit';
import { AndesButton } from './button';

/* The first stories: the playground, every variant, and the states a button can be in. */

const meta: Meta<AndesButton> = {
  title: 'General/Button/Overview',
  component: AndesButton,
  tags: ['autodocs'],
  decorators: [withDescription, withButtonKit],
  parameters: { layout: 'padded' },
  argTypes: {
    variant: {
      control: 'select',
      options: [
        'primary',
        'secondary',
        'danger',
        'outline',
        'dashed',
        'filled',
        'ghost',
        'link',
      ],
    },
    color: {
      control: 'select',
      options: [undefined, 'primary', 'danger', 'success', 'warning', 'info'],
    },
    size: {
      control: 'select',
      options: [
        'xs',
        'sm',
        'md',
        'lg',
        'icon-xs',
        'icon-sm',
        'icon',
        'icon-lg',
      ],
    },
    shape: {
      control: 'select',
      options: ['default', 'full', 'round', 'circle'],
    },
    elevation: {
      control: 'select',
      options: ['none', 'low', 'medium', 'high'],
    },
    type: { control: 'select', options: ['button', 'submit', 'reset'] },
    danger: { control: 'boolean' },
    ghost: { control: 'boolean' },
    ripple: { control: 'boolean' },
    pressScale: { control: 'boolean' },
    disabled: { control: 'boolean' },
    loading: { control: 'boolean' },
    loadingDelay: { control: 'number' },
    focusableWhenDisabled: { control: 'boolean' },
    fullWidth: { control: 'boolean' },
    href: { control: 'text' },
    target: { control: 'text' },
  },
  args: {
    variant: 'primary',
    size: 'md',
    shape: 'default',
    elevation: 'none',
    type: 'button',
    danger: false,
    ghost: false,
    ripple: true,
    pressScale: true,
    disabled: false,
    loading: false,
    loadingDelay: 0,
    focusableWhenDisabled: false,
    fullWidth: false,
  },
  render: (args) => ({
    props: args,
    template: `<andes-button [variant]="variant" [size]="size" [shape]="shape" [elevation]="elevation" [color]="color" [danger]="danger" [ghost]="ghost" [ripple]="ripple" [pressScale]="pressScale" [disabled]="disabled" [loading]="loading" [loadingDelay]="loadingDelay" [focusableWhenDisabled]="focusableWhenDisabled" [fullWidth]="fullWidth" [href]="href" [target]="target" [type]="type">Save</andes-button>`,
  }),
};

export default meta;

type Story = StoryObj<AndesButton>;

export const Playground: Story = {
  name: 'Playground',
  parameters: about(
    'Every input of the button is a control: change any of them and press the button to see the press feedback.',
  ),
};

export const Variants: Story = {
  name: 'Variants',
  parameters: about(
    'Every variant side by side, from the strongest emphasis to the lightest.',
  ),
  render: () => ({
    template: `
      <div style="${bar} gap: 1rem;">
        <andes-button variant="primary">Primary</andes-button>
        <andes-button variant="secondary">Secondary</andes-button>
        <andes-button variant="danger">Danger</andes-button>
        <andes-button variant="outline">Outline</andes-button>
        <andes-button variant="dashed">Dashed</andes-button>
        <andes-button variant="filled">Filled</andes-button>
        <andes-button variant="ghost">Ghost</andes-button>
        <andes-button variant="link">Link</andes-button>
      </div>
    `,
  }),
};

export const States: Story = {
  name: 'States',
  parameters: about(
    'Disabled blocks the click and dims the button, loading blocks it too and swaps the icon for a spinner, and aria-invalid flags a button that stands for an invalid choice.',
  ),
  render: () => ({
    props: { variants: ['primary', 'outline', 'link'] },
    template: `
      <div style="${column} gap: 0.75rem;">
        @for (variant of variants; track variant) {
          <div style="${bar} gap: 1rem;">
            <andes-button [variant]="variant">Enabled</andes-button>
            <andes-button [variant]="variant" disabled>Disabled</andes-button>
            <andes-button [variant]="variant" loading>Loading</andes-button>
            <andes-button [variant]="variant" aria-invalid="true">Invalid</andes-button>
          </div>
        }
      </div>
    `,
  }),
};
