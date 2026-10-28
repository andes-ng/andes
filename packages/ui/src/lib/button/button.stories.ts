import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideSearch } from '@ng-icons/lucide';
import type { Meta, StoryObj } from '@storybook/angular';

import { AndesButton } from './button';

const extraIcons = provideIcons({ lucideSearch });

const meta: Meta<AndesButton> = {
  title: 'General/Button/Basics/Button',
  component: AndesButton,
  tags: ['autodocs'],
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
    danger: { control: 'boolean' },
    ripple: { control: 'boolean' },
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
    disabled: { control: 'boolean' },
    loading: { control: 'boolean' },
    loadingDelay: { control: 'number' },
    fullWidth: { control: 'boolean' },
    href: { control: 'text' },
    target: { control: 'text' },
    type: { control: 'select', options: ['button', 'submit', 'reset'] },
    ghost: { control: 'boolean' },
  },
  args: {
    variant: 'primary',
    size: 'md',
    shape: 'default',
    disabled: false,
    loading: false,
    loadingDelay: 0,
    fullWidth: false,
    type: 'button',
    ghost: false,
    danger: false,
    ripple: true,
  },
  render: (args) => ({
    props: args,
    template: `<andes-button [variant]="variant" [size]="size" [shape]="shape" [disabled]="disabled" [loading]="loading" [loadingDelay]="loadingDelay" [fullWidth]="fullWidth" [href]="href" [target]="target" [type]="type" [ghost]="ghost" [color]="color" [danger]="danger" [ripple]="ripple">Save</andes-button>`,
  }),
};

export default meta;

type Story = StoryObj<AndesButton>;

/** The playground: every input of the button is a control. */
export const Default: Story = {};

/** Every variant side by side, from the strongest emphasis to the lightest. */
export const Variants: Story = {
  render: () => ({
    template: `
      <div style="display: flex; align-items: center; gap: 1rem; flex-wrap: wrap;">
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

/**
 * The non-interactive states: `disabled` blocks the click and dims the button, while
 * `aria-invalid` flags a button that stands for an invalid choice. Each row is one variant.
 */
export const States: Story = {
  render: () => ({
    template: `
      <div style="display: flex; flex-direction: column; gap: 0.75rem;">
        @for (variant of ['primary', 'outline', 'link']; track variant) {
          <div style="display: flex; align-items: center; gap: 1rem;">
            <andes-button [variant]="variant">Enabled</andes-button>
            <andes-button [variant]="variant" disabled>Disabled</andes-button>
            <andes-button [variant]="variant" aria-invalid="true">Invalid</andes-button>
          </div>
        }
      </div>
    `,
    props: {},
  }),
};

/** The text sizes next to the square icon-only sizes; icon-only buttons need an `aria-label`. */
export const Sizes: Story = {
  render: () => ({
    moduleMetadata: { imports: [NgIcon], providers: [extraIcons] },
    template: `
      <div style="display: flex; align-items: center; gap: 1rem;">
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

/** The corner shapes: default, `full` (pill), `round` and the circular icon buttons. */
export const Shapes: Story = {
  render: () => ({
    moduleMetadata: { imports: [NgIcon], providers: [extraIcons] },
    template: `
      <div style="display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;">
        <andes-button shape="default">Default</andes-button>
        <andes-button shape="full">Pill</andes-button>
        <andes-button shape="round">Round</andes-button>
        <andes-button shape="circle" size="icon" aria-label="Search"><ng-icon name="lucideSearch" /></andes-button>
        <andes-button shape="circle" variant="outline" size="icon" aria-label="Search"><ng-icon name="lucideSearch" /></andes-button>
        <andes-button shape="circle" variant="outline">A</andes-button>
        <andes-button shape="circle" size="lg" variant="dashed" aria-label="Add"><ng-icon name="lucideSearch" /></andes-button>
      </div>
    `,
  }),
};

/** `color` tints every variant except `secondary` and `danger`, which keep their palette. */
export const ColorsAndVariants: Story = {
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

/**
 * `danger` marks a destructive action without leaving the variant the layout calls for.
 * `ghost` is the mode for dark surfaces: the dark panel shows it with every palette.
 */
export const DangerAndGhost: Story = {
  render: () => ({
    template: `
      <div style="display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;">
        <andes-button danger>Delete</andes-button>
        <andes-button variant="outline" danger>Delete</andes-button>
        <andes-button variant="dashed" danger>Delete</andes-button>
        <andes-button variant="filled" danger>Delete</andes-button>
        <andes-button variant="ghost" danger>Delete</andes-button>
        <andes-button variant="link" danger>Delete</andes-button>
      </div>
      <div style="display: flex; gap: 0.75rem; padding: 1.5rem; margin-top: 1rem; background: #0f172a;">
        <andes-button variant="primary" ghost>Primary</andes-button>
        <andes-button variant="secondary" ghost>Secondary</andes-button>
        <andes-button variant="danger" ghost>Danger</andes-button>
        <andes-button ghost danger>Delete</andes-button>
        <andes-button ghost color="success">Approve</andes-button>
      </div>
    `,
  }),
};
