import { signal } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular';

import {
  about,
  shared,
  withDescription,
  withSkeletonKit,
} from '../../testing/skeleton-story-kit';
import { AndesSkeleton } from './skeleton';
import type {
  AndesSkeletonAnimation,
  AndesSkeletonDirection,
  AndesSkeletonRadius,
} from './skeleton-utils';

/*
 * Which way the loading animation travels and when each bar starts: the direction of the shimmer
 * (horizontal or vertical, forwards or reversed), the stagger that makes a column of bars ripple
 * from the top down, and the corner radius of the bars.
 */

const meta: Meta<AndesSkeleton> = {
  title: 'Feedback/Skeleton/Direction and stagger',
  component: AndesSkeleton,
  decorators: [withDescription, withSkeletonKit],
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<AndesSkeleton>;

/** The shimmer follows the reading direction by default. */
export const Horizontal: Story = {
  name: 'Horizontal',
  parameters: about(
    'By default the shimmer sweeps across each bar in reading direction, from left to right in a left-to-right document, which is what direction="horizontal" stands for.',
  ),
  render: () => ({
    props: { ...shared },
    template: `
      <div style="display: flex; flex-direction: column; gap: 1.5rem; max-width: 26rem;">
        <andes-skeleton active avatar />
        <andes-skeleton-text active [lines]="3" />
      </div>
    `,
  }),
};

/** A band that travels down the bars. */
export const Vertical: Story = {
  name: 'Vertical',
  parameters: about(
    'With direction="vertical" the band of light travels down each bar from top to bottom, on the composite placeholder and on every standalone element, in any reading direction.',
  ),
  render: () => ({
    props: { ...shared },
    template: `
      <div style="display: flex; flex-direction: column; gap: 1.5rem; max-width: 26rem;">
        <andes-skeleton active direction="vertical" avatar />
        <andes-skeleton-text active direction="vertical" [lines]="3" />
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <andes-skeleton-button active direction="vertical" />
          <andes-skeleton-avatar active direction="vertical" />
          <andes-skeleton-input active direction="vertical" />
        </div>
        <andes-skeleton-image active direction="vertical" width="100%" height="6rem" />
      </div>
    `,
  }),
};

/** Against the grain. */
export const Reverse: Story = {
  name: 'Reverse',
  parameters: about(
    'The reverse switch runs the sweep the other way, against the reading direction when horizontal and from bottom to top when vertical.',
  ),
  render: () => ({
    props: { ...shared },
    template: `
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(14rem, 1fr)); gap: 2rem; max-width: 48rem;">
        <div><p [style]="muted" style="margin: 0 0 0.75rem;">horizontal</p><andes-skeleton-text active [lines]="3" /></div>
        <div><p [style]="muted" style="margin: 0 0 0.75rem;">horizontal, reverse</p><andes-skeleton-text active reverse [lines]="3" /></div>
        <div><p [style]="muted" style="margin: 0 0 0.75rem;">vertical</p><andes-skeleton-text active direction="vertical" [lines]="3" /></div>
        <div><p [style]="muted" style="margin: 0 0 0.75rem;">vertical, reverse</p><andes-skeleton-text active direction="vertical" reverse [lines]="3" /></div>
      </div>
    `,
  }),
};

/** Mirrored with the document. */
export const RightToLeft: Story = {
  name: 'Right to left',
  parameters: {
    dir: 'rtl',
    ...about(
      'In a right-to-left document the horizontal shimmer sweeps from right to left and its reverse from left to right, while the vertical sweep keeps travelling top to bottom.',
    ),
  },
  render: () => ({
    props: { ...shared },
    template: `
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(14rem, 1fr)); gap: 2rem; max-width: 48rem;">
        <div><p [style]="muted" style="margin: 0 0 0.75rem;">horizontal</p><andes-skeleton-text active [lines]="3" /></div>
        <div><p [style]="muted" style="margin: 0 0 0.75rem;">horizontal, reverse</p><andes-skeleton-text active reverse [lines]="3" /></div>
        <div><p [style]="muted" style="margin: 0 0 0.75rem;">vertical</p><andes-skeleton-text active direction="vertical" [lines]="3" /></div>
        <div><p [style]="muted" style="margin: 0 0 0.75rem;">vertical, reverse</p><andes-skeleton-text active direction="vertical" reverse [lines]="3" /></div>
      </div>
    `,
  }),
};

/** A card that ripples from the top down. */
export const StaggeredCard: Story = {
  name: 'Staggered card',
  parameters: about(
    'The stagger input starts each bar a step after the one above it, so a card with an avatar, a name and lines of content ripples from the top down instead of moving in lockstep.',
  ),
  render: () => ({
    props: { ...shared },
    template: `
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(18rem, 1fr)); gap: 1.5rem; max-width: 48rem;">
        <div [style]="card">
          <p [style]="muted" style="margin: 0 0 1rem;">Pulse</p>
          <andes-skeleton animation="pulse" stagger avatar [paragraph]="{ rows: 4 }" />
        </div>
        <div [style]="card">
          <p [style]="muted" style="margin: 0 0 1rem;">Vertical shimmer</p>
          <andes-skeleton active direction="vertical" stagger avatar [paragraph]="{ rows: 4 }" />
        </div>
      </div>
    `,
  }),
};

/** Lines of varying widths that ripple. */
export const StaggeredList: Story = {
  name: 'Staggered list',
  parameters: about(
    'A block of text lines of varying widths with the stagger on, each line starting a step after the previous one, as a loading list does while it waits for its rows.',
  ),
  render: () => ({
    props: { ...shared },
    template: `
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(18rem, 1fr)); gap: 2rem; max-width: 48rem;">
        <div>
          <p [style]="muted" style="margin: 0 0 0.75rem;">Pulse, stagger</p>
          <andes-skeleton-text animation="pulse" stagger [lines]="6" [width]="['100%', '85%', '95%', '70%', '90%', '45%']" />
        </div>
        <div>
          <p [style]="muted" style="margin: 0 0 0.75rem;">Vertical shimmer, stagger</p>
          <andes-skeleton-text active direction="vertical" stagger [lines]="6" [width]="['100%', '85%', '95%', '70%', '90%', '45%']" />
        </div>
      </div>
    `,
  }),
};

/** A table whose rows ripple. */
export const StaggeredTableRows: Story = {
  name: 'Staggered table rows',
  parameters: about(
    'The rows of a table, each cell a placeholder whose index is the row it sits in, so the whole body ripples from the top down while the header stays in place.',
  ),
  render: () => ({
    props: { ...shared, rows: [0, 1, 2, 3, 4] },
    template: `
      <andes-table style="max-width: 40rem;">
        <thead andesTableHeader>
          <tr andesTableRow>
            <th andesTableHead>Name</th>
            <th andesTableHead>Role</th>
            <th andesTableHead>Last seen</th>
          </tr>
        </thead>
        <tbody andesTableBody>
          @for (row of rows; track row) {
            <tr andesTableRow>
              <td andesTableCell><andes-skeleton-text animation="pulse" [index]="row" width="75%" /></td>
              <td andesTableCell><andes-skeleton-text animation="pulse" [index]="row" width="50%" /></td>
              <td andesTableCell><andes-skeleton-text animation="pulse" [index]="row" width="60%" /></td>
            </tr>
          }
        </tbody>
      </andes-table>
    `,
  }),
};

/** One element, one step. */
export const ElementIndex: Story = {
  name: 'Element index',
  parameters: about(
    'On the standalone elements and the single bar the index input says how many steps after the first one the animation starts, which is how a row of avatars or buttons gets a wave of its own.',
  ),
  render: () => ({
    props: { ...shared, items: [0, 1, 2, 3, 4, 5] },
    template: `
      <div style="display: flex; flex-direction: column; gap: 1.5rem; max-width: 30rem;">
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          @for (item of items; track item) {
            <andes-skeleton-avatar animation="pulse" [index]="item" />
          }
        </div>
        <div style="display: flex; flex-direction: column; gap: 0.5rem;">
          @for (item of items; track item) {
            <andes-skeleton shape="text" [index]="item" />
          }
        </div>
      </div>
    `,
  }),
};

/** The step and the wait before the first bar. */
export const StepAndDelay: Story = {
  name: 'Step and delay',
  parameters: about(
    'The stagger input sets the milliseconds between two bars, while the --andes-skeleton-stagger and --andes-skeleton-delay custom properties set the step and the wait before the first bar for a whole subtree.',
  ),
  render: () => ({
    props: { ...shared },
    template: `
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr)); gap: 2rem; max-width: 48rem;">
        <div>
          <p [style]="muted" style="margin: 0 0 0.75rem;">stagger = 50</p>
          <andes-skeleton animation="pulse" [stagger]="50" [paragraph]="{ rows: 5 }" />
        </div>
        <div>
          <p [style]="muted" style="margin: 0 0 0.75rem;">stagger = 400</p>
          <andes-skeleton animation="pulse" [stagger]="400" [paragraph]="{ rows: 5 }" />
        </div>
        <div style="--andes-skeleton-stagger: 200ms; --andes-skeleton-delay: 600ms;">
          <p [style]="muted" style="margin: 0 0 0.75rem;">--andes-skeleton-stagger: 200ms, --andes-skeleton-delay: 600ms</p>
          <andes-skeleton-text animation="pulse" stagger [lines]="5" />
        </div>
      </div>
    `,
  }),
};

/** Corner radius. */
export const Radius: Story = {
  name: 'Radius',
  parameters: about(
    'The radius input rounds the corners of the bars to a step of the radius scale, none, sm, md, lg, xl or full, on the composite placeholder, on its single bar and on every standalone element.',
  ),
  render: () => ({
    props: { ...shared, steps: ['none', 'sm', 'md', 'lg', 'xl', 'full'] },
    template: `
      <div style="display: flex; flex-direction: column; gap: 1.25rem; max-width: 30rem;">
        @for (step of steps; track step) {
          <div style="display: flex; align-items: center; gap: 1rem;">
            <span [style]="muted" style="width: 3rem;">{{ step }}</span>
            <andes-skeleton-image active [radius]="step" width="4rem" height="2.5rem" />
            <andes-skeleton-button active [radius]="step" />
            <andes-skeleton-text active [radius]="step" width="8rem" style="flex: 1;" />
          </div>
        }
      </div>
    `,
  }),
};

const DIRECTIONS: AndesSkeletonDirection[] = ['horizontal', 'vertical'];
const ANIMATIONS: AndesSkeletonAnimation[] = ['shimmer', 'pulse', 'none'];
const RADII: AndesSkeletonRadius[] = ['none', 'sm', 'md', 'lg', 'xl', 'full'];

/** Everything on one placeholder. */
export const Playground: Story = {
  name: 'Playground',
  parameters: about(
    'One card driven by the animation, the direction, the Reverse and Stagger switches and the radius, to see how they combine.',
  ),
  render: () => ({
    props: {
      ...shared,
      animation: signal<AndesSkeletonAnimation>('shimmer'),
      direction: signal<AndesSkeletonDirection>('vertical'),
      reverse: signal(false),
      stagger: signal(true),
      radius: signal<AndesSkeletonRadius>('sm'),
      directions: DIRECTIONS,
      animations: ANIMATIONS,
      radii: RADII,
    },
    template: `
      <div style="display: flex; flex-direction: column; gap: 1.5rem; max-width: 34rem;">
        <div [style]="card">
          <andes-skeleton
            [animation]="animation()"
            [direction]="direction()"
            [reverse]="reverse()"
            [stagger]="stagger()"
            [radius]="radius()"
            avatar
            [paragraph]="{ rows: 4 }"
          />
        </div>
        <hr [style]="divider" />
        <div [style]="formRow">
          <span [style]="formItem">Animation
            <andes-radio-group aria-label="Animation" optionType="button" [value]="animation()" (valueChange)="animation.set($any($event ?? 'shimmer'))">
              @for (name of animations; track name) {
                <andes-radio [value]="name">{{ name }}</andes-radio>
              }
            </andes-radio-group>
          </span>
          <span [style]="formItem">Direction
            <andes-radio-group aria-label="Direction" optionType="button" [value]="direction()" (valueChange)="direction.set($any($event ?? 'horizontal'))">
              @for (name of directions; track name) {
                <andes-radio [value]="name">{{ name }}</andes-radio>
              }
            </andes-radio-group>
          </span>
          <span [style]="formItem">
            <andes-switch [checked]="reverse()" (checkedChange)="reverse.set($event)">Reverse</andes-switch>
          </span>
          <span [style]="formItem">
            <andes-switch [checked]="stagger()" (checkedChange)="stagger.set($event)">Stagger</andes-switch>
          </span>
          <span [style]="formItem">Radius
            <andes-radio-group aria-label="Radius" optionType="button" [value]="radius()" (valueChange)="radius.set($any($event ?? 'sm'))">
              @for (name of radii; track name) {
                <andes-radio [value]="name">{{ name }}</andes-radio>
              }
            </andes-radio-group>
          </span>
        </div>
      </div>
    `,
  }),
};
