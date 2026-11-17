import type { Meta, StoryObj } from '@storybook/angular';

import {
  about,
  shared,
  withDescription,
  withSkeletonKit,
} from '../../testing/skeleton-story-kit';
import { AndesSkeleton } from './skeleton';

/*
 * Lines of text, from `andes-skeleton-text` on its own and from the paragraph and title of the
 * composite `andes-skeleton`: how many lines, how round their ends are and how wide each one is.
 */

const meta: Meta<AndesSkeleton> = {
  title: 'Feedback/Skeleton/Text',
  component: AndesSkeleton,
  decorators: [withDescription, withSkeletonKit],
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<AndesSkeleton>;

/** Text lines on their own, for places a whole skeleton is too much. */
export const TextLines: Story = {
  name: 'Text lines',
  parameters: about(
    'andes-skeleton-text draws any number of 16px lines on its own, ending a block of three or more on a shorter one, for the places where a whole skeleton is too much.',
  ),
  render: () => ({
    props: { ...shared },
    template: `
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(14rem, 1fr)); gap: 2rem; max-width: 48rem;">
        <div><p [style]="muted" style="margin: 0 0 0.75rem;">One line</p><andes-skeleton-text active /></div>
        <div><p [style]="muted" style="margin: 0 0 0.75rem;">lines = 3</p><andes-skeleton-text active [lines]="3" /></div>
        <div><p [style]="muted" style="margin: 0 0 0.75rem;">lines = 5, pulse</p><andes-skeleton-text animation="pulse" [lines]="5" /></div>
      </div>
    `,
  }),
};

/** Fully rounded ends. */
export const Round: Story = {
  name: 'Round',
  parameters: about(
    'The round input gives the bars fully rounded ends, on text lines and on the composite placeholder, where a large avatar can stay square.',
  ),
  render: () => ({
    props: { ...shared },
    template: `
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(18rem, 1fr)); gap: 2rem; max-width: 48rem;">
        <div><p [style]="muted" style="margin: 0 0 0.75rem;">Text lines</p><andes-skeleton-text active round [lines]="3" /></div>
        <div>
          <p [style]="muted" style="margin: 0 0 0.75rem;">Skeleton with a square large avatar</p>
          <andes-skeleton active round [avatar]="{ shape: 'square', size: 'lg' }" />
        </div>
      </div>
    `,
  }),
};

/** The width of each row. */
export const RowWidths: Story = {
  name: 'Row widths',
  parameters: about(
    'A list sets the width of each row in order, while a single value sets only the last row, on text lines and on the title and paragraph of the composite placeholder.',
  ),
  render: () => ({
    props: { ...shared },
    template: `
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(18rem, 1fr)); gap: 2rem; max-width: 48rem;">
        <div>
          <p [style]="muted" style="margin: 0 0 0.75rem;">Text lines, width = [100%, 80%, 45%]</p>
          <andes-skeleton-text active [lines]="3" [width]="['100%', '80%', '45%']" />
        </div>
        <div>
          <p [style]="muted" style="margin: 0 0 0.75rem;">Text lines, width = 50% (the last row)</p>
          <andes-skeleton-text active [lines]="3" width="50%" />
        </div>
        <div>
          <p [style]="muted" style="margin: 0 0 0.75rem;">Skeleton, title 160px and four paragraph widths</p>
          <andes-skeleton active [title]="{ width: 160 }" [paragraph]="{ rows: 4, width: ['90%', '75%', '85%', 120] }" />
        </div>
      </div>
    `,
  }),
};
