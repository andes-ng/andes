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
import {
  ANDES_ORG_CHART_ALL_CONTROLS,
  ANDES_ORG_CHART_DEFAULT_CONTROLS,
  type AndesOrgChartControl,
} from '../org-chart-toolbar';

const meta: Meta<AndesOrgChart> = {
  title: 'Data Display/Org Chart/Toolbar/Sets',
  component: AndesOrgChart,
  parameters: ORG_CHART_PARAMETERS,
  decorators: [ORG_CHART_DECORATOR],
};

export default meta;

type Story = StoryObj<AndesOrgChart>;

/**
 * The default bar: zoom, fit, reset and the export menu, exactly what the chart has always shown.
 * `controlItems` is not set, so nothing changes for a chart that never heard of it.
 */
export const Default: Story = {
  render: () => ({
    props: { data: SAMPLE_ORG },
    template: `
      <andes-org-chart
        aria-label="Company organization"
        style="--andes-org-chart-height: 28rem"
        [data]="data"
        [defaultExpandDepth]="1"
      />
    `,
  }),
};

/**
 * A minimal set: only zoom and fit. A divider (`'divider'`) separates groups of tools; one that
 * would start or end the bar, or sit next to another, is dropped.
 */
export const Minimal: Story = {
  render: () => ({
    props: { data: SAMPLE_ORG, items: ['zoom', 'divider', 'fit'] },
    template: `
      <andes-org-chart
        aria-label="Company organization"
        style="--andes-org-chart-height: 28rem"
        [data]="data"
        [controlItems]="items"
        [defaultExpandDepth]="1"
      />
    `,
  }),
};

/** A bar for reading a large chart: find people, open and close teams, and see where you are. */
export const Navigation: Story = {
  render: () => ({
    props: {
      data: SAMPLE_ORG,
      items: [
        'search',
        'divider',
        'expandAll',
        'collapseAll',
        'expandLevel',
        'divider',
        'minimap',
        'zoom',
        'fit',
      ],
    },
    template: `
      <andes-org-chart
        aria-label="Company organization"
        style="--andes-org-chart-height: 34rem"
        leafLayout="compact"
        [data]="data"
        [controlItems]="items"
        [defaultExpandDepth]="1"
      />
    `,
  }),
};

/** A bar for sharing a chart: capture the view, export the whole chart, or print it. */
export const Sharing: Story = {
  render: () => ({
    props: {
      data: SAMPLE_ORG,
      items: ['fullscreen', 'divider', 'capture', 'export', 'print'],
    },
    template: `
      <andes-org-chart
        aria-label="Company organization"
        style="--andes-org-chart-height: 28rem"
        [data]="data"
        [controlItems]="items"
        [defaultExpandDepth]="1"
      />
    `,
  }),
};

/** Every tool, grouped with dividers: `ANDES_ORG_CHART_ALL_CONTROLS` is this list. */
export const AllItems: Story = {
  render: () => ({
    props: { data: SAMPLE_ORG, items: ANDES_ORG_CHART_ALL_CONTROLS },
    template: `
      <andes-org-chart
        aria-label="Company organization"
        style="--andes-org-chart-height: 40rem"
        leafLayout="compact"
        [data]="data"
        [controlItems]="items"
        [defaultExpandDepth]="1"
      />
    `,
  }),
};

/**
 * `zoomable` and `exportable` stay as shortcuts: they take `zoom` and `export` off whatever
 * `controlItems` lists, so existing charts keep working. Here the default set loses both.
 */
export const ShortcutsStillWork: Story = {
  render: () => ({
    props: { data: SAMPLE_ORG },
    template: `
      <andes-org-chart
        aria-label="Company organization"
        style="--andes-org-chart-height: 28rem"
        [zoomable]="false"
        [exportable]="false"
        [data]="data"
        [defaultExpandDepth]="1"
      />
    `,
  }),
};

/** `controls="false"` hides the bar altogether; the keyboard and the pointer still pan and zoom. */
export const NoBar: Story = {
  render: () => ({
    props: { data: SAMPLE_ORG },
    template: `
      <andes-org-chart
        aria-label="Company organization"
        style="--andes-org-chart-height: 28rem"
        [controls]="false"
        [data]="data"
        [defaultExpandDepth]="1"
      />
    `,
  }),
};

/** Pick the tools yourself: the bar follows the checkboxes, in the order of the full list. */
export const BuildYourOwn: Story = {
  render: () => {
    const tools: readonly [AndesOrgChartControl, string][] = [
      ['zoom', 'Zoom'],
      ['fit', 'Fit'],
      ['reset', 'Reset'],
      ['fullscreen', 'Full screen'],
      ['minimap', 'Overview'],
      ['search', 'Search'],
      ['expandAll', 'Expand all'],
      ['collapseAll', 'Collapse all'],
      ['expandLevel', 'Levels'],
      ['capture', 'Capture'],
      ['export', 'Export'],
      ['print', 'Print'],
    ];
    const on = signal<readonly AndesOrgChartControl[]>(
      ANDES_ORG_CHART_DEFAULT_CONTROLS.filter((item) => item !== 'divider'),
    );
    return {
      props: {
        data: SAMPLE_ORG,
        tools,
        on,
        items: () =>
          ANDES_ORG_CHART_ALL_CONTROLS.filter(
            (item) => item === 'divider' || on().includes(item),
          ),
        has: (tool: AndesOrgChartControl) => on().includes(tool),
        set(tool: AndesOrgChartControl, checked: boolean) {
          on.update((list) =>
            checked ? [...list, tool] : list.filter((item) => item !== tool),
          );
        },
      },
      template: `
        <div style="${STACK}">
          <div style="${ROW} gap: 1rem;">
            @for (tool of tools; track tool[0]) {
              <andes-checkbox [checked]="has(tool[0])" (checkedChange)="set(tool[0], $event)">{{ tool[1] }}</andes-checkbox>
            }
          </div>
          <span style="${READOUT}">controlItems: {{ items().join(', ') }}</span>
          <andes-org-chart
            aria-label="Company organization"
            style="--andes-org-chart-height: 40rem"
            leafLayout="compact"
            [data]="data"
            [controlItems]="items()"
            [defaultExpandDepth]="1"
          />
        </div>
      `,
    };
  },
};
