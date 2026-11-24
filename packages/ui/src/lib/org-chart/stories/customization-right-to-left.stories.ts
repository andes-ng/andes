import { type Meta, type StoryObj } from '@storybook/angular';

import { SAMPLE_ORG } from '../../../testing/org-chart-sample';
import {
  ORG_CHART_DECORATOR,
  ORG_CHART_PARAMETERS,
} from '../../../testing/org-chart-story-kit';
import { AndesOrgChart } from '../org-chart';

const meta: Meta<AndesOrgChart> = {
  title: 'Data Display/Org Chart/Customization/Right to left',
  component: AndesOrgChart,
  parameters: ORG_CHART_PARAMETERS,
  decorators: [ORG_CHART_DECORATOR],
};

export default meta;

type Story = StoryObj<AndesOrgChart>;

/**
 * Right to left: under `dir="rtl"` the first report is drawn on the right, the card content and
 * the controls mirror, and Left/Right arrow keys swap.
 */
export const Vertical: Story = {
  render: () => ({
    props: { data: SAMPLE_ORG },
    template: `
      <div dir="rtl">
        <andes-org-chart
          aria-label="Company organization, vertical"
          style="--andes-org-chart-height: 26rem"
          [data]="data"
          [defaultExpandDepth]="2"
        />
      </div>
    `,
  }),
};

/** A horizontal chart grows to the left in a right-to-left page. */
export const Horizontal: Story = {
  render: () => ({
    props: { data: SAMPLE_ORG },
    template: `
      <div dir="rtl">
        <andes-org-chart
          aria-label="Company organization, horizontal"
          style="--andes-org-chart-height: 30rem"
          orientation="horizontal"
          leafLayout="hanging"
          [data]="data"
          [defaultExpandDepth]="2"
        />
      </div>
    `,
  }),
};

/** `direction="rtl"` forces the direction of one chart in a left-to-right page. */
export const ForcedDirection: Story = {
  render: () => ({
    props: { data: SAMPLE_ORG },
    template: `
      <andes-org-chart
        aria-label="Company organization, right to left"
        style="--andes-org-chart-height: 26rem"
        direction="rtl"
        [data]="data"
        [defaultExpandDepth]="2"
      />
    `,
  }),
};
