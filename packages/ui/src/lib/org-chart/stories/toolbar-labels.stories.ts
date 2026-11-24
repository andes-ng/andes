import { type Meta, type StoryObj } from '@storybook/angular';

import { SAMPLE_ORG } from '../../../testing/org-chart-sample';
import {
  LABELS_AR,
  LABELS_ES,
  ORG_CHART_DECORATOR,
  ORG_CHART_PARAMETERS,
} from '../../../testing/org-chart-story-kit';
import { AndesOrgChart } from '../org-chart';
import { ANDES_ORG_CHART_ALL_CONTROLS } from '../org-chart-toolbar';

const meta: Meta<AndesOrgChart> = {
  title: 'Data Display/Org Chart/Toolbar/Labels and right to left',
  component: AndesOrgChart,
  parameters: ORG_CHART_PARAMETERS,
  decorators: [ORG_CHART_DECORATOR],
};

export default meta;

type Story = StoryObj<AndesOrgChart>;

/**
 * Every text of the chart goes through `labels`: the name and tooltip of each tool, the export
 * formats, the level entries (`{level}`), the match count (`{current}` of `{total}`) and the empty
 * and loading messages. Here the whole set is Spanish; hover or focus a tool to read it.
 */
export const Spanish: Story = {
  render: () => ({
    props: {
      data: SAMPLE_ORG,
      labels: LABELS_ES,
      items: ANDES_ORG_CHART_ALL_CONTROLS,
    },
    template: `
      <andes-org-chart
        aria-label="Organigrama de la empresa"
        style="--andes-org-chart-height: 40rem"
        search="ingeniero"
        [labels]="labels"
        [data]="data"
        [controlItems]="items"
        [defaultExpandDepth]="1"
      />
    `,
  }),
};

/** Only some texts: any label left out keeps its English default. */
export const PartiallyTranslated: Story = {
  render: () => ({
    props: {
      data: SAMPLE_ORG,
      labels: { zoomIn: 'Ampliar', zoomOut: 'Reducir', fit: 'Encajar' },
    },
    template: `
      <andes-org-chart
        aria-label="Company organization"
        style="--andes-org-chart-height: 28rem"
        [labels]="labels"
        [data]="data"
        [defaultExpandDepth]="1"
      />
    `,
  }),
};

/**
 * Right to left: under `dir="rtl"` the bar's `end` corner is the left one, the menus and the
 * search field open the other way, and the cards and arrow keys mirror. The labels are Arabic.
 */
export const RightToLeft: Story = {
  render: () => ({
    props: {
      data: SAMPLE_ORG,
      labels: LABELS_AR,
      items: ANDES_ORG_CHART_ALL_CONTROLS,
    },
    template: `
      <div dir="rtl">
        <andes-org-chart
          aria-label="الهيكل التنظيمي"
          style="--andes-org-chart-height: 40rem"
          [labels]="labels"
          [data]="data"
          [controlItems]="items"
          [defaultExpandDepth]="1"
        />
      </div>
    `,
  }),
};

/** Right to left with the bar in a row, along the top start corner (the right one here). */
export const RightToLeftHorizontal: Story = {
  render: () => ({
    props: {
      data: SAMPLE_ORG,
      labels: LABELS_AR,
      items: ANDES_ORG_CHART_ALL_CONTROLS,
    },
    template: `
      <div dir="rtl">
        <andes-org-chart
          aria-label="الهيكل التنظيمي"
          style="--andes-org-chart-height: 36rem"
          controlsOrientation="horizontal"
          controlsPosition="top-start"
          [labels]="labels"
          [data]="data"
          [controlItems]="items"
          [defaultExpandDepth]="1"
        />
      </div>
    `,
  }),
};

/** All four corners under right to left: `start` is the right side, `end` the left one. */
export const RightToLeftCorners: Story = {
  render: () => ({
    props: {
      data: SAMPLE_ORG,
      labels: LABELS_AR,
      items: ['zoom', 'divider', 'fit', 'reset'],
      corners: ['top-start', 'top-end', 'bottom-start', 'bottom-end'],
    },
    template: `
      <div dir="rtl" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(22rem, 1fr)); gap: 1rem;">
        @for (position of corners; track position) {
          <andes-org-chart
            aria-label="الهيكل التنظيمي {{ position }}"
            style="--andes-org-chart-height: 18rem"
            [controlsPosition]="position"
            [labels]="labels"
            [controlItems]="items"
            [data]="data"
            [defaultExpandDepth]="1"
          />
        }
      </div>
    `,
  }),
};
