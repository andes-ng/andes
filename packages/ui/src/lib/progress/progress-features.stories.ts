import type { Meta, StoryObj } from '@storybook/angular';

import { AndesProgress } from './progress';

const meta: Meta<AndesProgress> = {
  title: 'Feedback/Progress/Features',
  component: AndesProgress,
};

export default meta;

type Story = StoryObj<AndesProgress>;

export const PercentPosition: Story = {
  render: () => ({
    template: `
      <div style="display: flex; flex-direction: column; gap: 1rem; width: 360px;">
        <andes-progress [percent]="60" [showInfo]="true" [percentPosition]="{ align: 'start', type: 'outer' }" aria-label="Outer start" />
        <andes-progress [percent]="60" [showInfo]="true" [percentPosition]="{ align: 'center', type: 'outer' }" aria-label="Outer center" />
        <andes-progress [percent]="60" [showInfo]="true" [percentPosition]="{ align: 'start', type: 'inner' }" [size]="[360, 20]" aria-label="Inner start" />
        <andes-progress [percent]="60" [showInfo]="true" [percentPosition]="{ align: 'center', type: 'inner' }" [size]="[360, 20]" variant="success" aria-label="Inner center" />
        <andes-progress [percent]="60" [showInfo]="true" [percentPosition]="{ align: 'end', type: 'inner' }" [size]="[360, 20]" variant="warning" aria-label="Inner end" />
        <andes-progress [percent]="60" [showInfo]="true" [percentPosition]="{ type: 'inner' }" [size]="[360, 20]" variant="danger" aria-label="Inner danger" />
      </div>
    `,
  }),
};

export const Steps: Story = {
  render: () => ({
    props: {
      colors: ['#16a34a', '#16a34a', '#dc2626'],
    },
    template: `
      <div style="display: flex; gap: 1.5rem; align-items: center;">
        <div style="display: flex; flex-direction: column; gap: 1rem;">
          <andes-progress [percent]="50" [steps]="3" [showInfo]="true" aria-label="3 steps" />
          <andes-progress [percent]="30" [steps]="5" [showInfo]="true" aria-label="5 steps" />
          <andes-progress [percent]="100" [steps]="5" size="small" strokeColor="#16a34a" [showInfo]="true" aria-label="Small steps" />
          <andes-progress [percent]="100" [steps]="3" [strokeColor]="colors" [showInfo]="true" aria-label="Colored steps" />
        </div>
        <andes-progress type="circle" [percent]="60" [steps]="{ count: 5, gap: 4 }" aria-label="Circle steps" />
        <andes-progress type="dashboard" [percent]="50" [steps]="8" aria-label="Dashboard steps" />
      </div>
    `,
  }),
};

export const SuccessSegment: Story = {
  render: () => ({
    template: `
      <div style="display: flex; gap: 1.5rem; align-items: center;">
        <div style="width: 320px;">
          <andes-progress [percent]="60" [success]="{ percent: 30 }" [showInfo]="true" aria-label="Line with success segment" />
        </div>
        <andes-progress type="circle" [percent]="60" [success]="{ percent: 30 }" aria-label="Circle with success segment" />
        <andes-progress type="dashboard" [percent]="60" [success]="{ percent: 30 }" aria-label="Dashboard with success segment" />
      </div>
    `,
  }),
};

export const CustomFormat: Story = {
  render: () => ({
    props: {
      days: (percent: number) => `${Math.round(percent / 10)} of 10 days`,
      withSuccess: (percent: number, success: number | undefined) =>
        `${percent}% (${success ?? 0}% verified)`,
    },
    template: `
      <ng-template #doneTpl let-percent>
        <strong>{{ percent === 100 ? 'Done' : percent + '%' }}</strong>
      </ng-template>
      <div style="display: flex; gap: 1.5rem; align-items: center;">
        <andes-progress type="circle" [percent]="75" [format]="days" aria-label="Days elapsed" />
        <andes-progress type="circle" [percent]="100" [format]="doneTpl" aria-label="Task" aria-valuetext="Done" />
        <div style="width: 320px;">
          <andes-progress [percent]="60" [success]="{ percent: 30 }" [showInfo]="true" [format]="withSuccess" aria-label="Verification" />
        </div>
      </div>
    `,
  }),
};

/**
 * Stroke styling: `strokeColor` takes a colour, a `{ from, to }` gradient or a map of stops (on
 * lines, rings and dashboards alike); `railColor` tints the track; `strokeLinecap` and
 * `strokeWidth` reshape the stroke.
 */
export const Colors: Story = {
  render: () => ({
    props: {
      fromTo: { from: '#108ee9', to: '#87d068' },
      stops: { '0%': '#108ee9', '100%': '#87d068' },
    },
    template: `
      <div style="display: flex; gap: 1.5rem; align-items: center; flex-wrap: wrap;">
        <div style="display: flex; flex-direction: column; gap: 1rem; width: 320px;">
          <andes-progress [percent]="99.9" [strokeColor]="fromTo" [showInfo]="true" aria-label="Gradient line" />
          <andes-progress [percent]="50" status="active" [strokeColor]="stops" [showInfo]="true" aria-label="Gradient active line" />
          <andes-progress [percent]="60" strokeColor="#7c3aed" railColor="#ede9fe" [showInfo]="true" aria-label="Custom colors" />
          <andes-progress [percent]="60" strokeLinecap="butt" [strokeWidth]="12" [showInfo]="true" aria-label="Butt linecap" />
        </div>
        <andes-progress type="circle" [percent]="90" [strokeColor]="stops" aria-label="Gradient circle" />
        <andes-progress type="dashboard" [percent]="90" [strokeColor]="stops" aria-label="Gradient dashboard" />
        <andes-progress type="circle" [percent]="75" strokeLinecap="butt" aria-label="Butt ring" />
        <andes-progress type="circle" [percent]="75" [strokeWidth]="12" aria-label="Thick ring" />
      </div>
    `,
  }),
};
