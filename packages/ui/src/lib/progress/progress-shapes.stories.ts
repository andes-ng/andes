import type { Meta, StoryObj } from '@storybook/angular';

import { AndesProgress } from './progress';

const meta: Meta<AndesProgress> = {
  title: 'Feedback/Progress/Shapes',
  component: AndesProgress,
};

export default meta;

type Story = StoryObj<AndesProgress>;

/**
 * `type="circle"`: determinate with a percentage, `exception`, `success`, indeterminate (no
 * percent), and the sizes - the `small` / default / `lg` presets, a pixel number and an inline ring.
 */
export const Circle: Story = {
  render: () => ({
    template: `
      <div style="display: flex; flex-direction: column; gap: 1.5rem;">
        <div style="display: flex; gap: 1.5rem; align-items: center;">
          <andes-progress type="circle" [percent]="75" aria-label="Circle 75%" />
          <andes-progress type="circle" [percent]="70" status="exception" aria-label="Circle failed" />
          <andes-progress type="circle" [percent]="100" status="success" aria-label="Circle done" />
          <andes-progress type="circle" aria-label="Circle loading" />
        </div>
        <div style="display: flex; gap: 1.5rem; align-items: center;">
          <andes-progress type="circle" size="small" [percent]="30" aria-label="Small circle" />
          <andes-progress type="circle" [size]="80" [percent]="50" aria-label="80px circle" />
          <andes-progress type="circle" [percent]="70" aria-label="Default circle" />
          <andes-progress type="circle" size="lg" [percent]="90" aria-label="Large circle" />
          <span>Inline <andes-progress type="circle" [size]="14" [percent]="60" aria-label="Tiny circle" /> ring</span>
        </div>
      </div>
    `,
  }),
};

/**
 * `type="dashboard"`: a ring with a gap. `gapDegree` sizes the gap (30 and 180 here) and
 * `gapPlacement` puts it at the `top`, `bottom`, `start` or `end`.
 */
export const Dashboard: Story = {
  render: () => ({
    template: `
      <div style="display: flex; flex-direction: column; gap: 1.5rem;">
        <div style="display: flex; gap: 1.5rem; align-items: center; flex-wrap: wrap;">
          <andes-progress type="dashboard" [percent]="75" aria-label="Dashboard" />
          <andes-progress type="dashboard" [percent]="75" [gapDegree]="30" aria-label="Dashboard 30deg gap" />
          <andes-progress type="dashboard" [percent]="75" [gapDegree]="180" aria-label="Dashboard half" />
          <andes-progress type="dashboard" aria-label="Dashboard loading" />
        </div>
        <div style="display: flex; gap: 1.5rem; align-items: center;">
          <andes-progress type="dashboard" size="small" [percent]="60" gapPlacement="top" aria-label="Gap top" />
          <andes-progress type="dashboard" size="small" [percent]="60" gapPlacement="bottom" aria-label="Gap bottom" />
          <andes-progress type="dashboard" size="small" [percent]="60" gapPlacement="start" aria-label="Gap start" />
          <andes-progress type="dashboard" size="small" [percent]="60" gapPlacement="end" aria-label="Gap end" />
        </div>
      </div>
    `,
  }),
};

/** Rings at or below 20px have no room for text, so their value shows as a hover tooltip. */
export const TinyCircles: Story = {
  render: () => ({
    template: `
      <div style="display: flex; flex-direction: column; gap: 0.75rem; font-family: var(--andes-font-family), sans-serif; font-size: 0.875rem; color: var(--andes-color-foreground);">
        <span style="display: inline-flex; align-items: center; gap: 0.5rem;">
          <andes-progress type="circle" [size]="14" [percent]="60" aria-label="Upload" /> Uploading 60%
        </span>
        <span style="display: inline-flex; align-items: center; gap: 0.5rem;">
          <andes-progress type="circle" [size]="16" [percent]="100" status="success" aria-label="Sync" /> Synced
        </span>
        <span style="display: inline-flex; align-items: center; gap: 0.5rem;">
          <andes-progress type="circle" [size]="20" [percent]="35" status="exception" aria-label="Import" /> Import failed at 35%
        </span>
      </div>
    `,
  }),
};
