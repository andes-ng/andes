import { signal } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular';

import {
  about,
  caption,
  divider,
  formItem,
  formRow,
  withDescription,
  withSkeletonKit,
} from '../../testing/skeleton-story-kit';
import { AndesSkeleton } from './skeleton';
import type { AndesSkeletonAvatarShape } from './skeleton-avatar';
import type { AndesSkeletonButtonShape } from './skeleton-button';
import type { AndesSkeletonSize } from './skeleton-utils';

/*
 * One story per element placeholder, then a playground that drives them all. The elements stand on
 * their own, wherever a whole skeleton is too much; they are decorative, so the region they sit in
 * carries the loading status (see "Accessibility and motion").
 */

const meta: Meta<AndesSkeleton> = {
  title: 'Feedback/Skeleton/Elements',
  component: AndesSkeleton,
  decorators: [withDescription, withSkeletonKit],
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<AndesSkeleton>;

/** The button placeholder. */
export const ButtonElement: Story = {
  name: 'Button',
  parameters: about(
    'The button placeholder in three sizes and four shapes (the square one keeps its height as its width), stretched to its parent with block, or fitted to a real button with width.',
  ),
  render: () => ({
    props: { caption },
    template: `
      <div style="display: flex; flex-direction: column; gap: 1rem; max-width: 30rem;">
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <span [style]="caption" style="width: 4rem;">Sizes</span>
          <andes-skeleton-button active size="sm" />
          <andes-skeleton-button active />
          <andes-skeleton-button active size="lg" />
        </div>
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <span [style]="caption" style="width: 4rem;">Shapes</span>
          <andes-skeleton-button active />
          <andes-skeleton-button active shape="square" />
          <andes-skeleton-button active shape="round" />
          <andes-skeleton-button active shape="circle" />
        </div>
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <span [style]="caption" style="width: 4rem;">Width</span>
          <andes-skeleton-button active [width]="96" />
          <andes-skeleton-button active size="sm" [width]="120" shape="round" />
        </div>
        <div>
          <span [style]="caption">Block</span>
          <andes-skeleton-button active block />
        </div>
      </div>
    `,
  }),
};

/** The avatar placeholder. */
export const AvatarElement: Story = {
  name: 'Avatar',
  parameters: about(
    'The avatar placeholder in three sizes or a pixel size, as a circle or as a square.',
  ),
  render: () => ({
    props: { caption },
    template: `
      <div style="display: flex; flex-direction: column; gap: 1rem;">
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <span [style]="caption" style="width: 4rem;">Sizes</span>
          <andes-skeleton-avatar active size="sm" />
          <andes-skeleton-avatar active />
          <andes-skeleton-avatar active size="lg" />
          <andes-skeleton-avatar active [size]="56" />
        </div>
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <span [style]="caption" style="width: 4rem;">Shapes</span>
          <andes-skeleton-avatar active shape="circle" size="lg" />
          <andes-skeleton-avatar active shape="square" size="lg" />
        </div>
      </div>
    `,
  }),
};

/** The input placeholder. */
export const InputElement: Story = {
  name: 'Input',
  parameters: about(
    'The input placeholder in three sizes, stretched to its parent with block, or fitted to a real field with width.',
  ),
  render: () => ({
    props: { caption },
    template: `
      <div style="display: flex; flex-direction: column; gap: 1rem; max-width: 30rem;">
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <span [style]="caption" style="width: 4rem;">Sizes</span>
          <andes-skeleton-input active size="sm" />
          <andes-skeleton-input active />
          <andes-skeleton-input active size="lg" />
        </div>
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <span [style]="caption" style="width: 4rem;">Width</span>
          <andes-skeleton-input active [width]="280" />
          <andes-skeleton-input active size="sm" width="10rem" />
        </div>
        <div>
          <span [style]="caption">Block</span>
          <andes-skeleton-input active block />
        </div>
      </div>
    `,
  }),
};

/** The image placeholder. */
export const ImageElement: Story = {
  name: 'Image',
  parameters: about(
    'The image placeholder draws a picture mark in a box that is square by default and takes any width and height.',
  ),
  render: () => ({
    props: { caption },
    template: `
      <div style="display: flex; align-items: flex-end; gap: 1.5rem; flex-wrap: wrap;">
        <div>
          <span [style]="caption">Default</span>
          <div><andes-skeleton-image active /></div>
        </div>
        <div>
          <span [style]="caption">160 x 120</span>
          <div><andes-skeleton-image active [width]="160" [height]="120" /></div>
        </div>
        <div style="flex: 1; min-width: 14rem;">
          <span [style]="caption">Full width, 6rem high</span>
          <andes-skeleton-image active width="100%" height="6rem" />
        </div>
      </div>
    `,
  }),
};

/** The node placeholder. */
export const NodeElement: Story = {
  name: 'Node',
  parameters: about(
    'The node placeholder is a box that draws whatever it wraps, such as an icon or a line of text, in the same quiet fill.',
  ),
  render: () => ({
    props: { caption },
    template: `
      <div style="display: flex; align-items: flex-end; gap: 1.5rem; flex-wrap: wrap;">
        <div>
          <span [style]="caption">Empty</span>
          <div><andes-skeleton-node active [width]="160" /></div>
        </div>
        <div>
          <span [style]="caption">An icon</span>
          <div>
            <andes-skeleton-node active>
              <ng-icon name="lucideChartScatter" size="40" />
            </andes-skeleton-node>
          </div>
        </div>
        <div>
          <span [style]="caption">Text, 160 x 6rem</span>
          <div><andes-skeleton-node active [width]="160" height="6rem">Loading chart…</andes-skeleton-node></div>
        </div>
      </div>
    `,
  }),
};

/** Every element driven by the same switches and radio groups. */
export const Playground: Story = {
  name: 'Playground',
  parameters: about(
    'Every element placeholder driven by the same switches and radio groups: Active, Button and Input Block, Size, Button Shape and Avatar Shape.',
  ),
  render: () => ({
    props: {
      active: signal(false),
      block: signal(false),
      size: signal<AndesSkeletonSize>('md'),
      buttonShape: signal<AndesSkeletonButtonShape>('default'),
      avatarShape: signal<AndesSkeletonAvatarShape>('circle'),
      formItem,
      formRow,
      divider,
    },
    template: `
      <div style="display: flex; flex-direction: column; gap: 1rem;">
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <andes-skeleton-button [active]="active()" [size]="size()" [shape]="buttonShape()" />
          <andes-skeleton-avatar [active]="active()" [size]="size()" [shape]="avatarShape()" />
          <andes-skeleton-input [active]="active()" [size]="size()" />
        </div>
        <andes-skeleton-button [active]="active()" [size]="size()" [shape]="buttonShape()" [block]="block()" />
        <andes-skeleton-input [active]="active()" [size]="size()" [block]="block()" />
        <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem;">
          <andes-skeleton-image [active]="active()" />
          <andes-skeleton-node [active]="active()" [width]="160" />
          <andes-skeleton-node [active]="active()">
            <ng-icon name="lucideChartScatter" size="40" />
          </andes-skeleton-node>
        </div>
        <hr [style]="divider" />
        <div [style]="formRow" style="margin: 1rem 0;">
          <span [style]="formItem">
            <andes-switch [checked]="active()" (checkedChange)="active.set($event)">Active</andes-switch>
          </span>
          <span [style]="formItem">
            <andes-switch [checked]="block()" (checkedChange)="block.set($event)">Button and Input Block</andes-switch>
          </span>
          <span [style]="formItem">Size
            <andes-radio-group aria-label="Size" optionType="button" [value]="size()" (valueChange)="size.set($event ?? 'md')">
              <andes-radio value="lg">Large</andes-radio>
              <andes-radio value="md">Medium</andes-radio>
              <andes-radio value="sm">Small</andes-radio>
            </andes-radio-group>
          </span>
          <span [style]="formItem">Button Shape
            <andes-radio-group aria-label="Button Shape" optionType="button" [value]="buttonShape()" (valueChange)="buttonShape.set($event ?? 'default')">
              <andes-radio value="default">Default</andes-radio>
              <andes-radio value="square">Square</andes-radio>
              <andes-radio value="round">Round</andes-radio>
              <andes-radio value="circle">Circle</andes-radio>
            </andes-radio-group>
          </span>
          <span [style]="formItem">Avatar Shape
            <andes-radio-group aria-label="Avatar Shape" optionType="button" [value]="avatarShape()" (valueChange)="avatarShape.set($event ?? 'circle')">
              <andes-radio value="square">Square</andes-radio>
              <andes-radio value="circle">Circle</andes-radio>
            </andes-radio-group>
          </span>
        </div>
      </div>
    `,
  }),
};
