import { signal } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular';

import {
  about,
  caption,
  divider,
  formItem,
  withDescription,
  withSkeletonKit,
} from '../../testing/skeleton-story-kit';
import { AndesSkeleton } from './skeleton';

const meta: Meta<AndesSkeleton> = {
  title: 'Feedback/Skeleton/Overview',
  component: AndesSkeleton,
  tags: ['autodocs'],
  decorators: [withDescription, withSkeletonKit],
  parameters: { layout: 'padded' },
  argTypes: {
    loading: { control: 'boolean' },
    active: { control: 'boolean' },
    animation: {
      control: 'inline-radio',
      options: [undefined, 'shimmer', 'pulse', 'none'],
      description:
        'Picks the animation by name; `active` is the shorthand for shimmer.',
    },
    avatar: { control: 'object' },
    title: { control: 'object' },
    paragraph: { control: 'object' },
    round: { control: 'boolean' },
    loadingLabel: { control: 'text' },
    classNames: { control: 'object' },
    styles: { control: 'object' },
    shape: {
      control: 'select',
      options: [undefined, 'text', 'circular', 'rectangular'],
      description: 'Block mode: set to render the original single bar.',
    },
    width: { control: 'text' },
    height: { control: 'text' },
    animated: { control: 'boolean' },
  },
  args: {
    loading: true,
    active: false,
    avatar: false,
    title: true,
    paragraph: true,
    round: false,
  },
  render: (args) => ({
    props: args,
    template: `
      <div style="width: 420px;">
        <andes-skeleton
          [loading]="loading"
          [active]="active"
          [animation]="animation"
          [avatar]="avatar"
          [title]="title"
          [paragraph]="paragraph"
          [round]="round"
          [classNames]="classNames"
          [styles]="styles"
        />
      </div>
    `,
  }),
};

export default meta;

type Story = StoryObj<AndesSkeleton>;

/** The playground: use the controls to try the inputs of the composite placeholder. */
export const Default: Story = {
  name: 'Default',
  parameters: about(
    'The playground: a title and a three-row paragraph, with controls for every input of the composite placeholder.',
  ),
};

/** An avatar beside a title and a paragraph of several rows. */
export const ComplexCombination: Story = {
  name: 'Complex combination',
  parameters: about(
    'An avatar beside a title and a paragraph of four rows, the placeholder of a post or a profile.',
  ),
  render: () => ({
    template: `
      <div style="max-width: 36rem;">
        <andes-skeleton avatar [paragraph]="{ rows: 4 }" />
      </div>
    `,
  }),
};

/** Which parts to draw, from `avatar`, `title` and `paragraph`. */
export const ChoosingTheParts: Story = {
  name: 'Choosing the parts',
  parameters: about(
    'The avatar, the title and the paragraph are each switched on or off by their own input, so the placeholder can match a header, a caption or a body of text.',
  ),
  render: () => ({
    props: { caption },
    template: `
      <div style="display: flex; flex-direction: column; gap: 1.5rem; max-width: 36rem;">
        <div>
          <span [style]="caption">title and paragraph (the default)</span>
          <andes-skeleton />
        </div>
        <div>
          <span [style]="caption">avatar, title and paragraph</span>
          <andes-skeleton avatar />
        </div>
        <div>
          <span [style]="caption">avatar and title only</span>
          <andes-skeleton avatar [paragraph]="false" />
        </div>
        <div>
          <span [style]="caption">paragraph only</span>
          <andes-skeleton [title]="false" />
        </div>
      </div>
    `,
  }),
};

/** The shimmer, switched on and off. */
export const ActiveAnimation: Story = {
  name: 'Active animation',
  parameters: about(
    'A band of light sweeps across the placeholder while active is on, and the Active switch turns it on and off.',
  ),
  render: () => ({
    props: { active: signal(true), formItem },
    template: `
      <div style="display: flex; flex-direction: column; gap: 1.5rem; max-width: 36rem;">
        <andes-skeleton [active]="active()" />
        <span [style]="formItem">
          <andes-switch [checked]="active()" (checkedChange)="active.set($event)">Active</andes-switch>
        </span>
      </div>
    `,
  }),
};

/** The avatar, button and input placeholders in their three sizes. */
export const Sizes: Story = {
  name: 'Sizes',
  parameters: about(
    'The button, avatar and input placeholders in their large, default and small sizes, each row sharing one control scale.',
  ),
  render: () => ({
    props: { caption },
    template: `
      <div style="display: flex; flex-direction: column; gap: 1rem;">
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <span [style]="caption" style="width: 4rem;">Button</span>
          <andes-skeleton-button size="lg" />
          <andes-skeleton-button />
          <andes-skeleton-button size="sm" />
        </div>
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <span [style]="caption" style="width: 4rem;">Avatar</span>
          <andes-skeleton-avatar size="lg" />
          <andes-skeleton-avatar />
          <andes-skeleton-avatar size="sm" />
        </div>
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <span [style]="caption" style="width: 4rem;">Input</span>
          <andes-skeleton-input size="lg" />
          <andes-skeleton-input />
          <andes-skeleton-input size="sm" />
        </div>
      </div>
    `,
  }),
};

/** The shapes of the button and avatar placeholders. */
export const Shapes: Story = {
  name: 'Shapes',
  parameters: about(
    'The button placeholder in its default, square, round and circle shapes, and the avatar placeholder in its circle and square shapes.',
  ),
  render: () => ({
    props: { caption },
    template: `
      <div style="display: flex; flex-direction: column; gap: 1rem;">
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <span [style]="caption" style="width: 4rem;">Button</span>
          <andes-skeleton-button />
          <andes-skeleton-button shape="square" />
          <andes-skeleton-button shape="round" />
          <andes-skeleton-button shape="circle" />
        </div>
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <span [style]="caption" style="width: 4rem;">Avatar</span>
          <andes-skeleton-avatar shape="circle" />
          <andes-skeleton-avatar shape="square" />
        </div>
      </div>
    `,
  }),
};

/** Block mode: setting `shape` on `andes-skeleton` renders one bar. */
export const SingleBar: Story = {
  name: 'Single bar',
  parameters: about(
    'Setting shape on the skeleton draws one bar, as a line of text, a circle or a rectangle, sized by width and height and still or shimmering with the Animated switch.',
  ),
  render: () => ({
    props: { animated: signal(true), caption, formItem, divider },
    template: `
      <div style="display: flex; flex-direction: column; gap: 1.5rem; max-width: 20rem;">
        <div style="display: flex; flex-direction: column; gap: 0.5rem; width: 250px;">
          <andes-skeleton shape="text" [animated]="animated()" />
          <andes-skeleton shape="text" width="80%" [animated]="animated()" />
          <andes-skeleton shape="text" width="60%" [animated]="animated()" />
        </div>
        <div style="display: flex; align-items: center; gap: 1.5rem;">
          <andes-skeleton shape="text" [width]="120" [animated]="animated()" />
          <andes-skeleton shape="circular" [animated]="animated()" />
          <andes-skeleton shape="rectangular" [width]="120" [height]="80" [animated]="animated()" />
          <andes-skeleton shape="circular" [width]="80" [height]="80" [animated]="animated()" />
        </div>
        <andes-skeleton shape="rectangular" [animated]="animated()" />
        <div style="display: flex; align-items: center; gap: 1rem;">
          <andes-skeleton shape="circular" [width]="48" [height]="48" [animated]="animated()" />
          <div style="flex: 1; display: flex; flex-direction: column; gap: 0.5rem;">
            <andes-skeleton shape="text" width="60%" [animated]="animated()" />
            <andes-skeleton shape="text" width="90%" [animated]="animated()" />
          </div>
        </div>
        <hr [style]="divider" />
        <span [style]="formItem">
          <andes-switch [checked]="animated()" (checkedChange)="animated.set($event)">Animated</andes-switch>
        </span>
      </div>
    `,
  }),
};
