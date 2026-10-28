import type { Meta, StoryObj } from '@storybook/angular';

import { AndesSkeleton } from './skeleton';

const meta: Meta<AndesSkeleton> = {
  title: 'Feedback/Skeleton/Block',
  component: AndesSkeleton,
};

export default meta;

type Story = StoryObj<AndesSkeleton>;

/**
 * Block mode: setting `shape` renders the original single bar. `text` lines take a `width`;
 * `circular` and `rectangular` follow `width` / `height` (an 80px circle here); `animated`
 * switches the shimmer off, as in the static row.
 */
export const Shapes: Story = {
  render: () => ({
    template: `
      <div style="display: flex; flex-direction: column; gap: 1.5rem; width: 300px;">
        <div style="display: flex; flex-direction: column; gap: 0.5rem; width: 250px;">
          <andes-skeleton shape="text" />
          <andes-skeleton shape="text" width="80%" />
          <andes-skeleton shape="text" width="60%" />
        </div>
        <div style="display: flex; align-items: center; gap: 1.5rem;">
          <andes-skeleton shape="text" [width]="120" />
          <andes-skeleton shape="circular" />
          <andes-skeleton shape="rectangular" [width]="120" [height]="80" />
          <andes-skeleton shape="circular" [width]="80" [height]="80" />
        </div>
        <andes-skeleton shape="rectangular" />
        <div style="width: 250px;">
          <andes-skeleton shape="text" [animated]="false" />
        </div>
      </div>
    `,
  }),
};

export const CardPlaceholder: Story = {
  args: { animated: true },
  render: (args) => ({
    props: args,
    template: `
      <div style="display: flex; align-items: center; gap: 1rem; width: 300px;">
        <andes-skeleton shape="circular" [width]="48" [height]="48" [animated]="animated" />
        <div style="flex: 1; display: flex; flex-direction: column; gap: 0.5rem;">
          <andes-skeleton shape="text" width="60%" [animated]="animated" />
          <andes-skeleton shape="text" width="90%" [animated]="animated" />
        </div>
      </div>
    `,
  }),
};
