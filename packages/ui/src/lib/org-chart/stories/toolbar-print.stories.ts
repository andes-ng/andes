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
  title: 'Data Display/Org Chart/Toolbar/Print',
  component: AndesOrgChart,
  parameters: ORG_CHART_PARAMETERS,
  decorators: [ORG_CHART_DECORATOR],
};

export default meta;

type Story = StoryObj<AndesOrgChart>;

/**
 * The `print` tool prints the whole chart on one page, sized to fit: the page is replaced by the
 * chart for as long as the print dialog is open (the bar, the toolbar and the rest of the page
 * stay out of the print), and the paper turns landscape or portrait to suit the chart's shape.
 */
export const Tool: Story = {
  render: () => ({
    props: { data: SAMPLE_ORG, items: ['zoom', 'fit', 'divider', 'print'] },
    template: `
      <andes-org-chart
        aria-label="Company organization"
        style="--andes-org-chart-height: 30rem"
        [data]="data"
        [controlItems]="items"
        [defaultExpandDepth]="3"
        leafLayout="compact"
      />
    `,
  }),
};

/** `print()` from the page's own button; the open teams are the ones that print. */
export const Api: Story = {
  render: () => ({
    props: { data: SAMPLE_ORG },
    template: `
      <div style="${STACK}">
        <div style="${ROW}">
          <andes-button variant="outline" (click)="chart.expandAllNodes()">Expand all</andes-button>
          <andes-button (click)="chart.print()">Print the chart</andes-button>
        </div>
        <andes-org-chart
          #chart="andesOrgChart"
          aria-label="Company organization"
          style="--andes-org-chart-height: 30rem"
          [controls]="false"
          [data]="data"
          [defaultExpandDepth]="1"
        />
      </div>
    `,
  }),
};

/**
 * Printing the page with the browser's own command (Ctrl/Cmd + P) leaves the bar, the toolbar and
 * the overview out as well, so a chart inside a report prints as a picture of itself.
 */
export const BrowserPrint: Story = {
  render: () => ({
    props: { data: SAMPLE_ORG },
    template: `
      <andes-org-chart
        aria-label="Company organization"
        style="--andes-org-chart-height: 26rem"
        [controlItems]="['zoom', 'fit', 'minimap']"
        [minimap]="true"
        [data]="data"
        [defaultExpandDepth]="2"
      />
    `,
  }),
};
