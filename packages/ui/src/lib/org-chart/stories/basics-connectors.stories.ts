import { type Meta, type StoryObj } from '@storybook/angular';

import { SAMPLE_ORG } from '../../../testing/org-chart-sample';
import {
  ORG_CHART_DECORATOR,
  ORG_CHART_PARAMETERS,
  STACK,
} from '../../../testing/org-chart-story-kit';
import { AndesOrgChart } from '../org-chart';

const meta: Meta<AndesOrgChart> = {
  title: 'Data Display/Org Chart/Basics/Connectors',
  component: AndesOrgChart,
  parameters: ORG_CHART_PARAMETERS,
  decorators: [ORG_CHART_DECORATOR],
};

export default meta;

type Story = StoryObj<AndesOrgChart>;

/** `connector="elbow"` (the default): right angles with rounded corners. */
export const Elbow: Story = {
  render: () => ({
    props: { data: SAMPLE_ORG },
    template: `
      <andes-org-chart
        aria-label="Company organization"
        style="--andes-org-chart-height: 26rem"
        connector="elbow"
        [data]="data"
      />
    `,
  }),
};

/** `connector="straight"`: a single straight line from the manager to each report. */
export const Straight: Story = {
  render: () => ({
    props: { data: SAMPLE_ORG },
    template: `
      <andes-org-chart
        aria-label="Company organization"
        style="--andes-org-chart-height: 26rem"
        connector="straight"
        [data]="data"
      />
    `,
  }),
};

/** `connector="curved"`: smooth curves. */
export const Curved: Story = {
  render: () => ({
    props: { data: SAMPLE_ORG },
    template: `
      <andes-org-chart
        aria-label="Company organization"
        style="--andes-org-chart-height: 26rem"
        connector="curved"
        [data]="data"
      />
    `,
  }),
};

/** `connectorRadius` rounds the corners of the elbow: square on the left, generous on the right. */
export const CornerRadius: Story = {
  render: () => ({
    props: { data: SAMPLE_ORG },
    template: `
      <div style="${STACK}">
        <andes-org-chart
          aria-label="Company organization, square corners"
          style="--andes-org-chart-height: 20rem"
          [connectorRadius]="0"
          [data]="data"
          [defaultExpandDepth]="1"
        />
        <andes-org-chart
          aria-label="Company organization, round corners"
          style="--andes-org-chart-height: 20rem"
          [connectorRadius]="18"
          [data]="data"
          [defaultExpandDepth]="1"
        />
      </div>
    `,
  }),
};

/** Switching the connector style at runtime redraws every line. */
export const Switchable: Story = {
  render: () => ({
    props: {
      data: SAMPLE_ORG,
      lineStyle: 'elbow',
      connectors: [
        { label: 'Elbow', value: 'elbow' },
        { label: 'Straight', value: 'straight' },
        { label: 'Curved', value: 'curved' },
      ],
    },
    template: `
      <div style="${STACK}">
        <div style="display: flex;">
          <andes-segmented aria-label="Connector style" [options]="connectors" [(value)]="lineStyle" />
        </div>
        <andes-org-chart
          aria-label="Company organization"
          style="--andes-org-chart-height: 30rem"
          [data]="data"
          [connector]="lineStyle"
        />
      </div>
    `,
  }),
};
