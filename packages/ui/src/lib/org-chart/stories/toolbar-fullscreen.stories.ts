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

const meta: Meta<AndesOrgChart> = {
  title: 'Data Display/Org Chart/Toolbar/Full screen',
  component: AndesOrgChart,
  parameters: ORG_CHART_PARAMETERS,
  decorators: [ORG_CHART_DECORATOR],
};

export default meta;

type Story = StoryObj<AndesOrgChart>;

/**
 * The `fullscreen` tool shows the chart across the screen through the Fullscreen API, swaps its
 * icon for the way out, and frames the chart again for the new size. Escape leaves it. The menus
 * and tooltips of the bar are drawn inside the chart, so they stay visible full screen.
 */
export const Tool: Story = {
  render: () => ({
    props: {
      data: SAMPLE_ORG,
      items: ['fullscreen', 'divider', 'zoom', 'fit', 'divider', 'export'],
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

/**
 * `toggleFullscreen()`, `enterFullscreen()` and `exitFullscreen()` from the page's own buttons,
 * with the `fullscreen` signal and the `(fullscreenChange)` output read back. Each is a no-op
 * where the browser has no Fullscreen API.
 */
export const Api: Story = {
  render: () => {
    const changes = signal<string[]>([]);
    return {
      props: {
        data: SAMPLE_ORG,
        changes,
        log(on: boolean) {
          changes.update((list) => [...list, on ? 'entered' : 'left']);
        },
      },
      template: `
        <div style="${STACK}">
          <div style="${ROW}">
            <andes-button variant="outline" (click)="chart.enterFullscreen()">Enter</andes-button>
            <andes-button variant="outline" (click)="chart.exitFullscreen()">Exit</andes-button>
            <andes-button variant="outline" (click)="chart.toggleFullscreen()">Toggle</andes-button>
            <span style="${READOUT}">{{ chart.fullscreen() ? 'Full screen' : 'In the page' }}; events: {{ changes().join(', ') || 'none' }}</span>
          </div>
          <andes-org-chart
            #chart="andesOrgChart"
            aria-label="Company organization"
            style="--andes-org-chart-height: 30rem"
            [data]="data"
            (fullscreenChange)="log($event)"
          />
        </div>
      `,
    };
  },
};

/**
 * `fullscreenFit` (on by default) frames the chart again whenever it enters or leaves full screen,
 * so it fills the new size. Turn it off to keep the pan and zoom you had; here it is off.
 */
export const KeepTheView: Story = {
  render: () => ({
    props: { data: SAMPLE_ORG, items: ['fullscreen', 'zoom', 'fit'] },
    template: `
      <andes-org-chart
        aria-label="Company organization"
        style="--andes-org-chart-height: 30rem"
        [fullscreenFit]="false"
        [data]="data"
        [controlItems]="items"
        [defaultExpandDepth]="2"
      />
    `,
  }),
};

/** Everything works full screen: the search field, the level menu and the overview. */
export const WithEveryTool: Story = {
  render: () => ({
    props: {
      data: SAMPLE_ORG,
      items: [
        'fullscreen',
        'minimap',
        'divider',
        'search',
        'expandLevel',
        'divider',
        'zoom',
        'fit',
        'divider',
        'capture',
        'export',
      ],
    },
    template: `
      <andes-org-chart
        aria-label="Company organization"
        style="--andes-org-chart-height: 32rem"
        leafLayout="compact"
        [data]="data"
        [controlItems]="items"
        [defaultExpandDepth]="2"
      />
    `,
  }),
};
