import { type Meta, type StoryObj } from '@storybook/angular';

import { SAMPLE_ORG } from '../../../testing/org-chart-sample';
import {
  ORG_CHART_DECORATOR,
  ORG_CHART_PARAMETERS,
  STACK,
} from '../../../testing/org-chart-story-kit';
import { AndesOrgChart } from '../org-chart';

const meta: Meta<AndesOrgChart> = {
  title: 'Data Display/Org Chart/Basics/Leaf layouts',
  component: AndesOrgChart,
  parameters: ORG_CHART_PARAMETERS,
  decorators: [ORG_CHART_DECORATOR],
};

export default meta;

type Story = StoryObj<AndesOrgChart>;

/** `leafLayout="tree"` (the default): every report in a row under the manager. */
export const Tree: Story = {
  render: () => ({
    props: { data: SAMPLE_ORG },
    template: `
      <andes-org-chart
        aria-label="Company organization"
        style="--andes-org-chart-height: 34rem"
        leafLayout="tree"
        [data]="data"
        [defaultExpandDepth]="4"
      />
    `,
  }),
};

/**
 * `leafLayout="compact"`: a team made only of individual contributors stacks in two columns
 * around a stem, which keeps a wide organization readable.
 */
export const Compact: Story = {
  render: () => ({
    props: { data: SAMPLE_ORG },
    template: `
      <andes-org-chart
        aria-label="Company organization"
        style="--andes-org-chart-height: 34rem"
        leafLayout="compact"
        [data]="data"
        [defaultExpandDepth]="4"
      />
    `,
  }),
};

/** `leafLayout="hanging"`: the same teams hang in one indented column. */
export const Hanging: Story = {
  render: () => ({
    props: { data: SAMPLE_ORG },
    template: `
      <andes-org-chart
        aria-label="Company organization"
        style="--andes-org-chart-height: 34rem"
        leafLayout="hanging"
        [data]="data"
        [defaultExpandDepth]="4"
      />
    `,
  }),
};

/**
 * `leafLayoutMinCount` sets the smallest team that stacks: with 4, the teams of two and three
 * people stay in a row and only the platform team stacks.
 */
export const MinimumTeamSize: Story = {
  render: () => ({
    props: { data: SAMPLE_ORG },
    template: `
      <andes-org-chart
        aria-label="Company organization"
        style="--andes-org-chart-height: 34rem"
        leafLayout="compact"
        [leafLayoutMinCount]="4"
        [data]="data"
        [defaultExpandDepth]="4"
      />
    `,
  }),
};

/** Switching between the three layouts at runtime. */
export const Switchable: Story = {
  render: () => ({
    props: {
      data: SAMPLE_ORG,
      leafMode: 'compact',
      leafModes: [
        { label: 'Tree', value: 'tree' },
        { label: 'Compact', value: 'compact' },
        { label: 'Hanging', value: 'hanging' },
      ],
    },
    template: `
      <div style="${STACK}">
        <div style="display: flex;">
          <andes-segmented aria-label="Leaf layout" [options]="leafModes" [(value)]="leafMode" />
        </div>
        <andes-org-chart
          aria-label="Company organization"
          style="--andes-org-chart-height: 36rem"
          [data]="data"
          [leafLayout]="leafMode"
          [defaultExpandDepth]="4"
        />
      </div>
    `,
  }),
};
