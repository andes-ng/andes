import { signal } from '@angular/core';
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
import type { AndesOrgChartExportScope } from '../org-chart-export';

const meta: Meta<AndesOrgChart> = {
  title: 'Data Display/Org Chart/Toolbar/Capture',
  component: AndesOrgChart,
  parameters: ORG_CHART_PARAMETERS,
  decorators: [ORG_CHART_DECORATOR],
};

export default meta;

type Story = StoryObj<AndesOrgChart>;

/**
 * The `capture` tool: one click saves what is on screen right now as a PNG, at the current pan
 * and zoom, without the bar. The export menu next to it saves the whole chart. Pan or zoom first,
 * then capture.
 */
export const Tool: Story = {
  render: () => ({
    props: {
      data: SAMPLE_ORG,
      items: ['zoom', 'fit', 'divider', 'capture', 'export'],
    },
    template: `
      <andes-org-chart
        aria-label="Company organization"
        style="--andes-org-chart-height: 30rem"
        [data]="data"
        [controlItems]="items"
        [defaultExpandDepth]="2"
      />
    `,
  }),
};

/** `captureFormat` sets what the tool saves: here a JPG. */
export const AnotherFormat: Story = {
  render: () => ({
    props: { data: SAMPLE_ORG, items: ['zoom', 'fit', 'divider', 'capture'] },
    template: `
      <andes-org-chart
        aria-label="Company organization"
        style="--andes-org-chart-height: 28rem"
        captureFormat="jpeg"
        exportFilename="team-view"
        [data]="data"
        [controlItems]="items"
        [defaultExpandDepth]="2"
      />
    `,
  }),
};

/**
 * `exportImage(format, { scope })` returns the file as a `Blob`. `scope: 'view'` is the viewport
 * as it is; `scope: 'chart'` (the default) is the whole chart. The previews below are the two
 * files of the same moment: pan and zoom the chart, then take both.
 */
export const ViewVersusWholeChart: Story = {
  render: () => {
    const view = signal('');
    const whole = signal('');
    const sizes = signal('');
    const take = async (
      chart: AndesOrgChart,
      scope: AndesOrgChartExportScope,
      target: typeof view,
    ) => {
      const blob = await chart.exportImage('png', { scope, scale: 1 });
      const previous = target();
      if (previous) {
        URL.revokeObjectURL(previous);
      }
      target.set(URL.createObjectURL(blob));
      sizes.set(`${scope}: ${(blob.size / 1024).toFixed(0)} KB`);
    };
    return {
      props: {
        data: SAMPLE_ORG,
        view,
        whole,
        sizes,
        both: async (chart: AndesOrgChart) => {
          await take(chart, 'view', view);
          await take(chart, 'chart', whole);
        },
      },
      template: `
        <div style="${STACK}">
          <div style="${ROW}">
            <andes-button (click)="both(chart)">Take both</andes-button>
            <span style="${READOUT}">{{ sizes() }}</span>
          </div>
          <andes-org-chart
            #chart="andesOrgChart"
            aria-label="Company organization"
            style="--andes-org-chart-height: 24rem"
            [data]="data"
            [defaultExpandDepth]="2"
          />
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(18rem, 1fr)); gap: 1rem;">
            <figure style="margin: 0;">
              <figcaption style="${READOUT}">scope: 'view'</figcaption>
              @if (view()) { <img [src]="view()" alt="The viewport as captured" style="max-width: 100%; border: 1px solid var(--andes-color-border);" /> }
            </figure>
            <figure style="margin: 0;">
              <figcaption style="${READOUT}">scope: 'chart'</figcaption>
              @if (whole()) { <img [src]="whole()" alt="The whole chart as captured" style="max-width: 100%; border: 1px solid var(--andes-color-border);" /> }
            </figure>
          </div>
        </div>
      `,
    };
  },
};

/**
 * Capturing a windowed chart: with thousands of people only the cards near the viewport are in the
 * page, which is exactly what a view capture needs, so it stays exact and fast however large the
 * chart is.
 */
export const OfALargeChart: Story = {
  render: () => ({
    props: { data: SAMPLE_ORG },
    template: `
      <andes-org-chart
        aria-label="Company organization"
        style="--andes-org-chart-height: 30rem"
        [virtualizeAbove]="10"
        [controlItems]="['zoom', 'fit', 'divider', 'capture']"
        [data]="data"
        [defaultExpandDepth]="3"
      />
    `,
  }),
};
