import { type Meta, type StoryObj } from '@storybook/angular';

import { SAMPLE_ORG } from '../../../testing/org-chart-sample';
import {
  ORG_CHART_DECORATOR,
  ORG_CHART_PARAMETERS,
  ROW,
  STACK,
} from '../../../testing/org-chart-story-kit';
import { AndesOrgChart } from '../org-chart';
import { ANDES_ORG_CHART_ALL_CONTROLS } from '../org-chart-toolbar';

const meta: Meta<AndesOrgChart> = {
  title: 'Data Display/Org Chart/Toolbar/Position and orientation',
  component: AndesOrgChart,
  parameters: ORG_CHART_PARAMETERS,
  decorators: [ORG_CHART_DECORATOR],
};

export default meta;

type Story = StoryObj<AndesOrgChart>;

function corner(position: string): Story {
  return {
    render: () => ({
      props: { data: SAMPLE_ORG, items: ANDES_ORG_CHART_ALL_CONTROLS },
      template: `
        <andes-org-chart
          aria-label="Company organization"
          style="--andes-org-chart-height: 34rem"
          controlsPosition="${position}"
          [data]="data"
          [controlItems]="items"
          [defaultExpandDepth]="1"
        />
      `,
    }),
  };
}

/** `controlsPosition="bottom-end"` (the default): the bottom corner on the inline end side. */
export const BottomEnd: Story = corner('bottom-end');

/** `controlsPosition="bottom-start"`: the bottom corner on the inline start side. */
export const BottomStart: Story = corner('bottom-start');

/** `controlsPosition="top-end"`: the top corner on the inline end side. Menus open towards the inside. */
export const TopEnd: Story = corner('top-end');

/**
 * `controlsPosition="top-start"`: the top corner on the inline start side, the one the custom
 * toolbar template uses; it steps aside (see the custom toolbar stories).
 */
export const TopStart: Story = corner('top-start');

/**
 * `start` and `end` follow the text direction, so the same value is the left corner in a
 * left-to-right page and the right corner in a right-to-left one.
 */
export const FourCornersSideBySide: Story = {
  render: () => ({
    props: {
      data: SAMPLE_ORG,
      items: ['zoom', 'divider', 'fit', 'reset'],
      corners: ['top-start', 'top-end', 'bottom-start', 'bottom-end'],
    },
    template: `
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(22rem, 1fr)); gap: 1rem;">
        @for (position of corners; track position) {
          <andes-org-chart
            aria-label="Company organization, bar at {{ position }}"
            style="--andes-org-chart-height: 18rem"
            [controlsPosition]="position"
            [controlItems]="items"
            [data]="data"
            [defaultExpandDepth]="1"
          />
        }
      </div>
    `,
  }),
};

/** `controlsOrientation="horizontal"`: the tools in a row, here along the bottom end corner. */
export const HorizontalBar: Story = {
  render: () => ({
    props: { data: SAMPLE_ORG, items: ANDES_ORG_CHART_ALL_CONTROLS },
    template: `
      <andes-org-chart
        aria-label="Company organization"
        style="--andes-org-chart-height: 34rem"
        controlsOrientation="horizontal"
        [data]="data"
        [controlItems]="items"
        [defaultExpandDepth]="1"
      />
    `,
  }),
};

/** A horizontal bar along the top: menus and the search field open downwards. */
export const HorizontalBarOnTop: Story = {
  render: () => ({
    props: { data: SAMPLE_ORG, items: ANDES_ORG_CHART_ALL_CONTROLS },
    template: `
      <andes-org-chart
        aria-label="Company organization"
        style="--andes-org-chart-height: 34rem"
        controlsOrientation="horizontal"
        controlsPosition="top-end"
        [data]="data"
        [controlItems]="items"
        [defaultExpandDepth]="1"
      />
    `,
  }),
};

/** Change the corner and the orientation while the chart is on screen. */
export const Switchable: Story = {
  render: () => ({
    props: {
      data: SAMPLE_ORG,
      items: ANDES_ORG_CHART_ALL_CONTROLS,
      position: 'bottom-end',
      orientation: 'vertical',
      positions: [
        { label: 'Top start', value: 'top-start' },
        { label: 'Top end', value: 'top-end' },
        { label: 'Bottom start', value: 'bottom-start' },
        { label: 'Bottom end', value: 'bottom-end' },
      ],
      orientations: [
        { label: 'Vertical', value: 'vertical' },
        { label: 'Horizontal', value: 'horizontal' },
      ],
    },
    template: `
      <div style="${STACK}">
        <div style="${ROW} gap: 1.5rem;">
          <andes-segmented aria-label="Position" [options]="positions" [(value)]="position" />
          <andes-segmented aria-label="Orientation" [options]="orientations" [(value)]="orientation" />
        </div>
        <andes-org-chart
          aria-label="Company organization"
          style="--andes-org-chart-height: 36rem"
          [controlsPosition]="position"
          [controlsOrientation]="orientation"
          [data]="data"
          [controlItems]="items"
          [defaultExpandDepth]="1"
        />
      </div>
    `,
  }),
};
