import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';

import { AndesSkeleton } from './skeleton';
import {
  AndesSkeletonAvatar,
  type AndesSkeletonAvatarShape,
} from './skeleton-avatar';
import {
  AndesSkeletonButton,
  type AndesSkeletonButtonShape,
} from './skeleton-button';
import { AndesSkeletonImage } from './skeleton-image';
import { AndesSkeletonInput } from './skeleton-input';
import { AndesSkeletonNode } from './skeleton-node';
import type { AndesSkeletonSize } from './skeleton-utils';

const meta: Meta<AndesSkeleton> = {
  title: 'Feedback/Skeleton/Elements',
  component: AndesSkeleton,
  decorators: [
    moduleMetadata({
      imports: [
        AndesSkeletonAvatar,
        AndesSkeletonButton,
        AndesSkeletonImage,
        AndesSkeletonInput,
        AndesSkeletonNode,
      ],
    }),
  ],
};

export default meta;

type Story = StoryObj<AndesSkeleton>;

/**
 * Every element placeholder: avatars (sizes, `square`, a pixel size), buttons (sizes, `round`,
 * `circle`, `square`, `block`), inputs (sizes, `block`), an image and nodes that wrap their own
 * icon or text. `width` sizes a button or input placeholder to the control it stands in for.
 */
export const Elements: Story = {
  args: { active: true },
  render: (args) => ({
    props: args,
    template: `
      <div style="display: flex; flex-direction: column; gap: 1rem; width: 480px;">
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <andes-skeleton-avatar [active]="active" size="sm" />
          <andes-skeleton-avatar [active]="active" />
          <andes-skeleton-avatar [active]="active" size="lg" />
          <andes-skeleton-avatar [active]="active" shape="square" size="lg" />
          <andes-skeleton-avatar [active]="active" [size]="56" />
        </div>
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <andes-skeleton-button [active]="active" size="sm" />
          <andes-skeleton-button [active]="active" />
          <andes-skeleton-button [active]="active" size="lg" />
          <andes-skeleton-button [active]="active" shape="round" />
          <andes-skeleton-button [active]="active" shape="circle" />
          <andes-skeleton-button [active]="active" shape="square" />
        </div>
        <andes-skeleton-button [active]="active" block />
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <andes-skeleton-input [active]="active" size="sm" />
          <andes-skeleton-input [active]="active" size="lg" />
        </div>
        <andes-skeleton-input [active]="active" block />
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <andes-skeleton-input [active]="active" [width]="280" />
          <andes-skeleton-button [active]="active" [width]="96" />
        </div>
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <andes-skeleton-input [active]="active" size="sm" width="10rem" />
          <andes-skeleton-button [active]="active" size="sm" [width]="120" shape="round" />
        </div>
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <andes-skeleton-image [active]="active" />
          <andes-skeleton-node [active]="active">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 3v18h18" /><path d="M18 17V9" /><path d="M13 17V5" /><path d="M8 17v-3" />
            </svg>
          </andes-skeleton-node>
          <andes-skeleton-node [active]="active" [width]="160" height="6rem">Loading chart…</andes-skeleton-node>
        </div>
      </div>
    `,
  }),
};

/**
 * Standalone elements are decorative - give the region its own single status text. Not aria-busy:
 * screen readers may hold back the status announcement from inside a busy region.
 */
export const ElementsWithStatus: Story = {
  args: { active: true },
  render: (args) => ({
    props: args,
    template: `
      <div style="display: flex; align-items: center; gap: 0.75rem;">
        <span role="status" style="position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0, 0, 0, 0);">Loading form…</span>
        <andes-skeleton-input [active]="active" />
        <andes-skeleton-button [active]="active" />
      </div>
    `,
  }),
};

interface ElementPlaygroundArgs {
  active: boolean;
  block: boolean;
  size: AndesSkeletonSize;
  buttonShape: AndesSkeletonButtonShape;
  avatarShape: AndesSkeletonAvatarShape;
}

/**
 * Every element placeholder driven by the same controls: `active`, `size`, the button and avatar
 * shapes, and `block` for the full-width button and input.
 */
export const ElementsPlayground: StoryObj<ElementPlaygroundArgs> = {
  argTypes: {
    active: { control: 'boolean' },
    block: { control: 'boolean' },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    buttonShape: {
      control: 'inline-radio',
      options: ['default', 'square', 'round', 'circle'],
    },
    avatarShape: { control: 'inline-radio', options: ['circle', 'square'] },
  },
  args: {
    active: true,
    block: false,
    size: 'md',
    buttonShape: 'default',
    avatarShape: 'circle',
  },
  render: (args) => ({
    props: args,
    template: `
      <div style="display: flex; flex-direction: column; gap: 1rem; width: 480px;">
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <andes-skeleton-button [active]="active" [size]="size" [shape]="buttonShape" />
          <andes-skeleton-avatar [active]="active" [size]="size" [shape]="avatarShape" />
          <andes-skeleton-input [active]="active" [size]="size" />
        </div>
        <andes-skeleton-button [active]="active" [size]="size" [shape]="buttonShape" [block]="block" />
        <andes-skeleton-input [active]="active" [size]="size" [block]="block" />
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <andes-skeleton-image [active]="active" />
          <andes-skeleton-node [active]="active" [width]="160" />
        </div>
      </div>
    `,
  }),
};
