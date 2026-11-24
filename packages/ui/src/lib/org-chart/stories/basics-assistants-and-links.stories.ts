import { type Meta, type StoryObj } from '@storybook/angular';

import { SAMPLE_ORG } from '../../../testing/org-chart-sample';
import {
  ORG_CHART_DECORATOR,
  ORG_CHART_PARAMETERS,
} from '../../../testing/org-chart-story-kit';
import { AndesOrgChart } from '../org-chart';

const meta: Meta<AndesOrgChart> = {
  title: 'Data Display/Org Chart/Basics/Assistants and secondary links',
  component: AndesOrgChart,
  parameters: ORG_CHART_PARAMETERS,
  decorators: [ORG_CHART_DECORATOR],
};

export default meta;

type Story = StoryObj<AndesOrgChart>;

/**
 * Assistants (`assistant: true`: the chief of staff and the CTO's executive assistant) sit beside
 * their manager's stem, above the reports, joined by a short line.
 */
export const Assistants: Story = {
  render: () => ({
    props: { data: SAMPLE_ORG },
    template: `
      <andes-org-chart
        aria-label="Company organization"
        style="--andes-org-chart-height: 30rem"
        leafLayout="compact"
        [data]="data"
        [defaultExpandDepth]="2"
      />
    `,
  }),
};

/**
 * `secondaryLinks` draw dotted-line relations between any two people. They do not change the
 * layout; hover a dotted line to read its label.
 */
export const SecondaryLinks: Story = {
  render: () => ({
    props: {
      data: SAMPLE_ORG,
      relations: [
        {
          from: 'research',
          to: 'pm1',
          label: 'Research partners with Product',
        },
        {
          from: 'data',
          to: 'analyst',
          label: 'Data supports Finance reporting',
        },
      ],
    },
    template: `
      <andes-org-chart
        aria-label="Company organization"
        style="--andes-org-chart-height: 34rem"
        leafLayout="compact"
        [data]="data"
        [secondaryLinks]="relations"
        [defaultExpandDepth]="3"
      />
    `,
  }),
};

/** A dotted line follows its people: when one of them is hidden by a collapsed team the line goes too. */
export const SecondaryLinksInAHorizontalChart: Story = {
  render: () => ({
    props: {
      data: SAMPLE_ORG,
      relations: [
        { from: 'design', to: 'product', label: 'Design and Product pair up' },
        {
          from: 'cfo',
          to: 'people',
          label: 'Finance and People plan headcount',
        },
      ],
    },
    template: `
      <andes-org-chart
        aria-label="Company organization"
        style="--andes-org-chart-height: 34rem"
        orientation="horizontal"
        [data]="data"
        [secondaryLinks]="relations"
        [defaultExpandDepth]="1"
      />
    `,
  }),
};
