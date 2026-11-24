import { type Meta, type StoryObj } from '@storybook/angular';

import { SAMPLE_ORG } from '../../../testing/org-chart-sample';
import {
  ORG_CHART_DECORATOR,
  ORG_CHART_PARAMETERS,
} from '../../../testing/org-chart-story-kit';
import { AndesOrgChart } from '../org-chart';

const meta: Meta<AndesOrgChart> = {
  title: 'Data Display/Org Chart/Interaction/Collapse',
  component: AndesOrgChart,
  parameters: ORG_CHART_PARAMETERS,
  decorators: [ORG_CHART_DECORATOR],
};

export default meta;

type Story = StoryObj<AndesOrgChart>;

/**
 * Collapsible: every person with reports has the toggle on the bottom edge of the card. Here the
 * chart starts with only the leadership open; open a team with its toggle (or Right arrow /
 * Alt+Down on the focused card).
 */
export const Collapsible: Story = {
  render: () => ({
    props: { data: SAMPLE_ORG },
    template: `
      <andes-org-chart
        aria-label="Company organization"
        style="--andes-org-chart-height: 30rem"
        [data]="data"
        [defaultExpandDepth]="1"
        [fitOnInit]="false"
      />
    `,
  }),
};

/**
 * `collapsible` set to `false`: no toggle, and every team stays open. Use it for small, static
 * charts that should always show everyone.
 */
export const NotCollapsible: Story = {
  render: () => ({
    props: {
      data: {
        ...SAMPLE_ORG,
        children: SAMPLE_ORG.children?.filter((child) =>
          ['cos', 'design', 'product'].includes(child.id),
        ),
      },
    },
    template: `
      <andes-org-chart
        aria-label="Leadership and their teams"
        style="--andes-org-chart-height: 26rem"
        [data]="data"
        [collapsible]="false"
      />
    `,
  }),
};

/** `expandOnClick`: a click on the card opens or closes its team, as the toggle does. */
export const ExpandOnClick: Story = {
  render: () => ({
    props: { data: SAMPLE_ORG },
    template: `
      <andes-org-chart
        aria-label="Company organization"
        style="--andes-org-chart-height: 30rem"
        expandOnClick
        [data]="data"
        [defaultExpandDepth]="1"
      />
    `,
  }),
};

/** `toggleCount="direct"` shows the number of direct reports next to the toggle icon. */
export const DirectReportsCount: Story = {
  render: () => ({
    props: { data: SAMPLE_ORG },
    template: `
      <andes-org-chart
        aria-label="Company organization"
        style="--andes-org-chart-height: 30rem"
        toggleCount="direct"
        [data]="data"
        [defaultExpandDepth]="1"
      />
    `,
  }),
};

/** `toggleCount="total"` counts everyone below the person, however deep. */
export const TotalTeamCount: Story = {
  render: () => ({
    props: { data: SAMPLE_ORG },
    template: `
      <andes-org-chart
        aria-label="Company organization"
        style="--andes-org-chart-height: 30rem"
        toggleCount="total"
        [data]="data"
        [defaultExpandDepth]="1"
      />
    `,
  }),
};

/** `defaultExpandDepth` sets how many levels start open: here only the founder is. */
export const StartCollapsed: Story = {
  render: () => ({
    props: { data: SAMPLE_ORG },
    template: `
      <andes-org-chart
        aria-label="Company organization"
        style="--andes-org-chart-height: 18rem"
        [data]="data"
        [defaultExpandDepth]="0"
      />
    `,
  }),
};
