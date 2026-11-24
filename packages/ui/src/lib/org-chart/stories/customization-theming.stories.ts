import { type Meta, type StoryObj } from '@storybook/angular';

import { SAMPLE_ORG } from '../../../testing/org-chart-sample';
import { ANDES_ORG_CHART_ALL_CONTROLS } from '../org-chart-toolbar';
import {
  ORG_CHART_DECORATOR,
  ORG_CHART_PARAMETERS,
} from '../../../testing/org-chart-story-kit';
import { AndesOrgChart } from '../org-chart';

const meta: Meta<AndesOrgChart> = {
  title: 'Data Display/Org Chart/Customization/Theming',
  component: AndesOrgChart,
  parameters: ORG_CHART_PARAMETERS,
  decorators: [ORG_CHART_DECORATOR],
};

export default meta;

type Story = StoryObj<AndesOrgChart>;

/**
 * Theming with CSS custom properties only: a warm neutral canvas, larger card corners, a softer
 * hairline and connector, a 48px avatar and a filled toggle. Every hook is listed in the
 * stylesheet.
 */
export const CustomProperties: Story = {
  render: () => ({
    props: {
      data: SAMPLE_ORG,
      picked: ['cto'],
      cardSize: { width: 256, height: 80 },
    },
    template: `
      <andes-org-chart
        aria-label="Company organization"
        style="
          --andes-org-chart-height: 32rem;
          --andes-org-chart-background: #f4f1ec;
          --andes-org-chart-border-color: #e4ddd2;
          --andes-org-chart-node-background: #fffdfa;
          --andes-org-chart-node-foreground: #2b2620;
          --andes-org-chart-node-muted-foreground: #6b6257;
          --andes-org-chart-node-border-color: #e4ddd2;
          --andes-org-chart-node-hover-border-color: #c9bfb0;
          --andes-org-chart-node-radius: 12px;
          --andes-org-chart-node-accent: #8a5a2b;
          --andes-org-chart-avatar-size: 48px;
          --andes-org-chart-connector-color: #cdc3b4;
          --andes-org-chart-toggle-background: #2b2620;
          --andes-org-chart-toggle-foreground: #fffdfa;
          --andes-org-chart-toggle-border-color: #2b2620;
          --andes-org-chart-controls-background: #fffdfa;
        "
        [data]="data"
        [selected]="picked"
        [nodeSize]="cardSize"
        [defaultExpandDepth]="2"
      />
    `,
  }),
};

/**
 * Dark theme: the chart only uses theme tokens, so `data-andes-theme="dark"` on any ancestor (or
 * the toolbar's Theme switch) restyles it, bar, menus and search field included: the canvas takes
 * the page background, the cards sit one step lighter and the hairlines one step lighter again.
 * The story forces it on a wrapper.
 */
export const Dark: Story = {
  render: () => ({
    props: {
      data: SAMPLE_ORG,
      picked: ['design'],
      items: ANDES_ORG_CHART_ALL_CONTROLS,
    },
    template: `
      <div data-andes-theme="dark" style="padding: 1rem; background: var(--andes-color-background); border-radius: 0.75rem;">
        <andes-org-chart
          aria-label="Company organization"
          style="--andes-org-chart-height: 38rem"
          [data]="data"
          [selected]="picked"
          [controlItems]="items"
          [minimap]="true"
          [defaultExpandDepth]="2"
        />
      </div>
    `,
  }),
};

/** The bar's panels (bar, search field, overview and trail) take `--andes-org-chart-controls-background`. */
export const BarColors: Story = {
  render: () => ({
    props: { data: SAMPLE_ORG, items: ANDES_ORG_CHART_ALL_CONTROLS },
    template: `
      <andes-org-chart
        aria-label="Company organization"
        style="--andes-org-chart-height: 38rem; --andes-org-chart-controls-background: color-mix(in srgb, var(--andes-color-primary) 10%, var(--andes-color-popover)); --andes-org-chart-minimap-frame-color: var(--andes-color-primary);"
        [data]="data"
        [controlItems]="items"
        [minimap]="true"
        [defaultExpandDepth]="2"
      />
    `,
  }),
};
