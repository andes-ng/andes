import { type Meta, type StoryObj } from '@storybook/angular';

import { SAMPLE_ORG } from '../../../testing/org-chart-sample';
import {
  ORG_CHART_DECORATOR,
  ORG_CHART_PARAMETERS,
  ROW,
  STACK,
} from '../../../testing/org-chart-story-kit';
import { AndesOrgChart } from '../org-chart';

const meta: Meta<AndesOrgChart> = {
  title: 'Data Display/Org Chart/Basics/Orientation',
  component: AndesOrgChart,
  parameters: ORG_CHART_PARAMETERS,
  decorators: [ORG_CHART_DECORATOR],
};

export default meta;

type Story = StoryObj<AndesOrgChart>;

/** `orientation="vertical"` (the default): reports below their manager, the toggle on the bottom edge. */
export const Vertical: Story = {
  render: () => ({
    props: { data: SAMPLE_ORG },
    template: `
      <andes-org-chart
        aria-label="Company organization"
        style="--andes-org-chart-height: 30rem"
        [data]="data"
        [defaultExpandDepth]="1"
      />
    `,
  }),
};

/** `reversed`: a vertical chart grows upwards, the toggle moves to the top edge of the card. */
export const VerticalReversed: Story = {
  render: () => ({
    props: { data: SAMPLE_ORG },
    template: `
      <andes-org-chart
        aria-label="Company organization"
        style="--andes-org-chart-height: 30rem"
        reversed
        [data]="data"
        [defaultExpandDepth]="1"
      />
    `,
  }),
};

/** `orientation="horizontal"`: reports beside their manager, towards the inline end. */
export const Horizontal: Story = {
  render: () => ({
    props: { data: SAMPLE_ORG },
    template: `
      <andes-org-chart
        aria-label="Company organization"
        style="--andes-org-chart-height: 34rem"
        orientation="horizontal"
        leafLayout="hanging"
        [data]="data"
        [defaultExpandDepth]="2"
      />
    `,
  }),
};

/** A horizontal chart with `reversed`: it grows towards the inline start instead. */
export const HorizontalReversed: Story = {
  render: () => ({
    props: { data: SAMPLE_ORG },
    template: `
      <andes-org-chart
        aria-label="Company organization"
        style="--andes-org-chart-height: 34rem"
        orientation="horizontal"
        reversed
        leafLayout="hanging"
        [data]="data"
        [defaultExpandDepth]="2"
      />
    `,
  }),
};

/**
 * `orientation` and `reversed` together: reports below, above, after or before their manager. The
 * toggle follows the side the reports are on, and the chart frames itself again when either changes.
 */
export const Switchable: Story = {
  render: () => ({
    props: {
      data: SAMPLE_ORG,
      axis: 'vertical',
      flipped: false,
      orientations: [
        { label: 'Vertical', value: 'vertical' },
        { label: 'Horizontal', value: 'horizontal' },
      ],
    },
    template: `
      <div style="${STACK}">
        <div style="${ROW} gap: 1.5rem;">
          <andes-segmented aria-label="Orientation" [options]="orientations" [(value)]="axis" />
          <andes-switch [(checked)]="flipped">Reversed</andes-switch>
        </div>
        <andes-org-chart
          aria-label="Company organization"
          style="--andes-org-chart-height: 34rem"
          leafLayout="compact"
          [data]="data"
          [orientation]="axis"
          [reversed]="flipped"
          [defaultExpandDepth]="3"
        />
      </div>
    `,
  }),
};
