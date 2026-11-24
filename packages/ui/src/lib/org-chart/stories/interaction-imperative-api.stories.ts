import { type Meta, type StoryObj } from '@storybook/angular';

import { SAMPLE_ORG } from '../../../testing/org-chart-sample';
import {
  ORG_CHART_DECORATOR,
  ORG_CHART_PARAMETERS,
  READOUT,
  ROW,
  STACK,
} from '../../../testing/org-chart-story-kit';
import { AndesOrgChart } from '../org-chart';

const meta: Meta<AndesOrgChart> = {
  title: 'Data Display/Org Chart/Interaction/Imperative API',
  component: AndesOrgChart,
  parameters: ORG_CHART_PARAMETERS,
  decorators: [ORG_CHART_DECORATOR],
};

export default meta;

type Story = StoryObj<AndesOrgChart>;

/**
 * The view methods through the `andesOrgChart` reference: `fitView()`, `zoomTo()`, `resetView()`,
 * `panBy()` and `scrollToNode()`, with the `viewport` signal read back.
 */
export const View: Story = {
  render: () => ({
    props: { data: SAMPLE_ORG },
    template: `
      <div style="${STACK}">
        <div style="${ROW}">
          <andes-button variant="outline" (click)="chart.fitView()">Fit</andes-button>
          <andes-button variant="outline" (click)="chart.zoomTo(1.5)">Zoom to 150%</andes-button>
          <andes-button variant="outline" (click)="chart.resetView()">Reset</andes-button>
          <andes-button variant="outline" (click)="chart.panBy(-120, 0, { animate: true })">Pan left</andes-button>
          <andes-button (click)="chart.scrollToNode('ml', { select: true })">Find Amara Nwosu</andes-button>
          <span style="${READOUT}">
            zoom {{ (chart.viewport().scale * 100).toFixed(0) }}% at {{ chart.viewport().x.toFixed(0) }}, {{ chart.viewport().y.toFixed(0) }}
          </span>
        </div>
        <andes-org-chart
          #chart="andesOrgChart"
          aria-label="Company organization"
          style="--andes-org-chart-height: 32rem"
          [data]="data"
          [defaultExpandDepth]="1"
        />
      </div>
    `,
  }),
};

/** The expansion methods: `expandAllNodes()`, `collapseAll()`, `expandToLevel()`, `expandPath()` and `toggle()`. */
export const Expansion: Story = {
  render: () => ({
    props: { data: SAMPLE_ORG },
    template: `
      <div style="${STACK}">
        <div style="${ROW}">
          <andes-button variant="outline" (click)="chart.expandAllNodes()">Expand all</andes-button>
          <andes-button variant="outline" (click)="chart.collapseAll()">Collapse all</andes-button>
          <andes-button variant="outline" (click)="chart.expandToLevel(3)">Open to level 3</andes-button>
          <andes-button variant="outline" (click)="chart.expandPath('ml')">Reveal Amara Nwosu</andes-button>
          <andes-button variant="outline" (click)="chart.toggle('design')">Toggle design</andes-button>
        </div>
        <andes-org-chart
          #chart="andesOrgChart"
          aria-label="Company organization"
          style="--andes-org-chart-height: 32rem"
          [data]="data"
          [defaultExpandDepth]="1"
        />
      </div>
    `,
  }),
};
