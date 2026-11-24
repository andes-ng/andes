import { type Meta, type StoryObj } from '@storybook/angular';

import { SAMPLE_ORG } from '../../../testing/org-chart-sample';
import {
  ORG_CHART_DECORATOR,
  ORG_CHART_PARAMETERS,
} from '../../../testing/org-chart-story-kit';
import { AndesOrgChart } from '../org-chart';
import type { AndesOrgChartControl } from '../org-chart-toolbar';

const meta: Meta<AndesOrgChart> = {
  title: 'Data Display/Org Chart/Toolbar/Items',
  component: AndesOrgChart,
  parameters: ORG_CHART_PARAMETERS,
  decorators: [ORG_CHART_DECORATOR],
};

export default meta;

type Story = StoryObj<AndesOrgChart>;

/** One tool on its own bar: `controlItems` lists the tools to show, and nothing else is drawn. */
function alone(
  items: readonly AndesOrgChartControl[],
  options: { height?: string; depth?: number; extra?: string } = {},
): Story {
  return {
    render: () => ({
      props: { data: SAMPLE_ORG, items },
      template: `
        <andes-org-chart
          aria-label="Company organization"
          style="--andes-org-chart-height: ${options.height ?? '26rem'}"
          leafLayout="compact"
          [data]="data"
          [controlItems]="items"
          [defaultExpandDepth]="${options.depth ?? 1}"
          ${options.extra ?? ''}
        />
      `,
    }),
  };
}

/**
 * `zoom`: zoom in, the zoom percentage and zoom out. They stop at the ends of `scaleExtent`, and
 * `+`, `-` and the wheel do the same. `zoomable="false"` takes the tool off every bar.
 */
export const Zoom: Story = alone(['zoom']);

/** `fit`: frames the whole chart in view (never zooming in past 100%). The key `0` does the same. */
export const Fit: Story = alone(['fit']);

/** `reset`: back to 100%, with the first root where the chart starts. */
export const Reset: Story = alone(['reset']);

/**
 * `fullscreen`: shows the chart across the screen and swaps its icon for the way out. Escape
 * leaves it too. Where the browser has no Fullscreen API the tool is simply left out.
 */
export const Fullscreen: Story = alone(['fullscreen']);

/**
 * `capture`: one click saves what is on screen right now (the viewport, at the current pan and
 * zoom) as a PNG. `captureFormat` picks another format.
 */
export const Capture: Story = alone(['capture']);

/** `export`: a menu to save the whole chart, however far it reaches past the viewport, as PNG, JPG, WebP or SVG. */
export const Export: Story = alone(['export']);

/** `print`: prints the whole chart on one page, with the bar and everything else out of the page. */
export const Print: Story = alone(['print']);

/** `expandAll`: opens every team and frames the chart again. */
export const ExpandAll: Story = alone(['expandAll'], { depth: 0 });

/** `collapseAll`: closes every team, leaving the top people, and frames the chart again. */
export const CollapseAll: Story = alone(['collapseAll'], { depth: 3 });

/**
 * `expandLevel`: a menu with one entry per level of the chart; choosing one opens the chart down
 * to that level and closes the rest. The level that is open now is marked.
 */
export const ExpandLevel: Story = alone(['expandLevel']);

/**
 * `search`: a search field with the number of matches and previous / next buttons. It drives the
 * chart's `search` input; Enter and Shift+Enter step through the matches and Escape closes it. Press
 * `/` on the chart to open it from the keyboard.
 */
export const Search: Story = alone(['search'], { height: '30rem' });

/** `minimap`: shows the overview of the whole chart, with a frame on the part in view; drag in it to pan. */
export const Minimap: Story = alone(['minimap'], { height: '30rem', depth: 3 });
