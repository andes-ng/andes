import { signal } from '@angular/core';
import { type Meta, type StoryObj } from '@storybook/angular';

import { SAMPLE_ORG } from '../../../testing/org-chart-sample';
import {
  ORG_CHART_DECORATOR,
  ORG_CHART_PARAMETERS,
  READOUT,
  ROW,
  STACK,
  find,
} from '../../../testing/org-chart-story-kit';
import { AndesOrgChart } from '../org-chart';
import type { AndesOrgChartKey } from '../org-chart-layout';

const meta: Meta<AndesOrgChart> = {
  title: 'Data Display/Org Chart/Interaction/Focus on a team',
  component: AndesOrgChart,
  parameters: ORG_CHART_PARAMETERS,
  decorators: [ORG_CHART_DECORATOR],
};

export default meta;

type Story = StoryObj<AndesOrgChart>;

/**
 * `focusNode(key)` isolates one person's team: only they and their reports are drawn, framed in
 * view, with a trail back to the whole chart above it. `clearFocus()` (or the first crumb of the
 * trail, or Escape on the chart) shows everyone again.
 */
export const Isolate: Story = {
  render: () => ({
    props: {
      data: SAMPLE_ORG,
      teams: [
        ['cto', 'Engineering'],
        ['design', 'Design'],
        ['product', 'Product'],
        ['platform', 'Platform'],
      ],
    },
    template: `
      <div style="${STACK}">
        <div style="${ROW}">
          @for (team of teams; track team[0]) {
            <andes-button variant="outline" (click)="chart.focusNode(team[0])">{{ team[1] }}</andes-button>
          }
          <andes-button variant="ghost" (click)="chart.clearFocus()">Whole chart</andes-button>
        </div>
        <andes-org-chart
          #chart="andesOrgChart"
          aria-label="Company organization"
          style="--andes-org-chart-height: 34rem"
          leafLayout="compact"
          [data]="data"
          [defaultExpandDepth]="1"
        />
      </div>
    `,
  }),
};

/**
 * `[(focusedKey)]` binds the isolated person, so the page knows (and can set) what is shown. The
 * chart opens already isolated on the platform team, with the trail showing the way back up.
 */
export const Bound: Story = {
  render: () => {
    const focused = signal<AndesOrgChartKey | null>('platform');
    return {
      props: {
        data: SAMPLE_ORG,
        focused,
        nameOf: (key: AndesOrgChartKey | null) =>
          key ? find(SAMPLE_ORG, key)?.name : null,
      },
      template: `
        <div style="${STACK}">
          <span style="${READOUT}">Focused on: {{ nameOf(focused()) ?? 'nobody (the whole chart)' }}</span>
          <andes-org-chart
            aria-label="Company organization"
            style="--andes-org-chart-height: 30rem"
            leafLayout="compact"
            [data]="data"
            [(focusedKey)]="focused"
          />
        </div>
      `,
    };
  },
};

/** `focusOnDblClick`: a double click on a manager isolates their team. */
export const OnDoubleClick: Story = {
  render: () => ({
    props: { data: SAMPLE_ORG },
    template: `
      <andes-org-chart
        aria-label="Company organization"
        style="--andes-org-chart-height: 32rem"
        focusOnDblClick
        [data]="data"
        [defaultExpandDepth]="1"
      />
    `,
  }),
};

/** `focusTrail` set to `false` hides the trail: the page draws its own way back. */
export const WithoutTrail: Story = {
  render: () => ({
    props: { data: SAMPLE_ORG },
    template: `
      <div style="${STACK}">
        <div style="${ROW}">
          <andes-button variant="outline" (click)="chart.focusNode('design')">Focus on design</andes-button>
          <andes-button variant="ghost" (click)="chart.clearFocus()">Back</andes-button>
        </div>
        <andes-org-chart
          #chart="andesOrgChart"
          aria-label="Company organization"
          style="--andes-org-chart-height: 28rem"
          [focusTrail]="false"
          [data]="data"
          [defaultExpandDepth]="1"
        />
      </div>
    `,
  }),
};
