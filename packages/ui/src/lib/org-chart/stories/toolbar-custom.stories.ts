import { type Meta, type StoryObj } from '@storybook/angular';

import { SAMPLE_ORG } from '../../../testing/org-chart-sample';
import {
  ORG_CHART_DECORATOR,
  ORG_CHART_PARAMETERS,
  READOUT,
} from '../../../testing/org-chart-story-kit';
import { AndesOrgChart } from '../org-chart';

const meta: Meta<AndesOrgChart> = {
  title: 'Data Display/Org Chart/Toolbar/Custom toolbar template',
  component: AndesOrgChart,
  parameters: ORG_CHART_PARAMETERS,
  decorators: [ORG_CHART_DECORATOR],
};

export default meta;

type Story = StoryObj<AndesOrgChart>;

/**
 * `andesOrgChartToolbar` adds controls of your own in the top start corner, next to the built-in
 * bar (which floats in the bottom end corner by default). The context is the chart, so its
 * methods are at hand.
 */
export const NextToTheBuiltInBar: Story = {
  render: () => ({
    props: { data: SAMPLE_ORG },
    template: `
      <andes-org-chart
        aria-label="Company organization"
        style="--andes-org-chart-height: 30rem"
        [data]="data"
        [defaultExpandDepth]="1"
      >
        <ng-template andesOrgChartToolbar let-chart>
          <andes-button variant="outline" (click)="chart.expandAllNodes(); chart.fitView()">Expand all</andes-button>
          <andes-button variant="outline" (click)="chart.collapseAll(); chart.resetView()">Collapse all</andes-button>
        </ng-template>
      </andes-org-chart>
    `,
  }),
};

/**
 * When the built-in bar is in the top start corner too, the custom toolbar steps aside: beside a
 * vertical bar, under a horizontal one. Nothing overlaps.
 */
export const BarInTheSameCorner: Story = {
  render: () => ({
    props: { data: SAMPLE_ORG },
    template: `
      <div style="display: grid; gap: 1rem;">
        <andes-org-chart
          aria-label="Company organization, vertical bar"
          style="--andes-org-chart-height: 24rem"
          controlsPosition="top-start"
          [data]="data"
          [defaultExpandDepth]="1"
        >
          <ng-template andesOrgChartToolbar let-chart>
            <andes-button variant="outline" (click)="chart.expandAllNodes()">Expand all</andes-button>
          </ng-template>
        </andes-org-chart>
        <andes-org-chart
          aria-label="Company organization, horizontal bar"
          style="--andes-org-chart-height: 24rem"
          controlsPosition="top-start"
          controlsOrientation="horizontal"
          [data]="data"
          [defaultExpandDepth]="1"
        >
          <ng-template andesOrgChartToolbar let-chart>
            <andes-button variant="outline" (click)="chart.expandAllNodes()">Expand all</andes-button>
          </ng-template>
        </andes-org-chart>
      </div>
    `,
  }),
};

/** Your own controls can use the new methods: here a pair of buttons for capture and print. */
export const OwnButtonsForSharing: Story = {
  render: () => ({
    props: { data: SAMPLE_ORG },
    template: `
      <andes-org-chart
        aria-label="Company organization"
        style="--andes-org-chart-height: 30rem"
        [controlItems]="['zoom', 'divider', 'fit']"
        [data]="data"
        [defaultExpandDepth]="1"
      >
        <ng-template andesOrgChartToolbar let-chart>
          <andes-button variant="outline" (click)="chart.download('png', { scope: 'view', filename: 'view' })">Save this view</andes-button>
          <andes-button variant="outline" (click)="chart.print()">Print</andes-button>
        </ng-template>
      </andes-org-chart>
    `,
  }),
};

/** `controls="false"` with a toolbar template: only your own controls are drawn. */
export const OnlyCustomControls: Story = {
  render: () => ({
    props: { data: SAMPLE_ORG },
    template: `
      <andes-org-chart
        aria-label="Company organization"
        style="--andes-org-chart-height: 28rem"
        [controls]="false"
        [data]="data"
        [defaultExpandDepth]="1"
      >
        <ng-template andesOrgChartToolbar let-chart>
          <andes-button variant="outline" (click)="chart.zoomIn()">Zoom in</andes-button>
          <andes-button variant="outline" (click)="chart.zoomOut()">Zoom out</andes-button>
          <span style="${READOUT}">{{ (chart.viewport().scale * 100).toFixed(0) }}%</span>
        </ng-template>
      </andes-org-chart>
    `,
  }),
};
