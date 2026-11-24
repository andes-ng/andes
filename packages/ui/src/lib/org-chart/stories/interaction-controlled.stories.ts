import { signal } from '@angular/core';
import { type Meta, type StoryObj } from '@storybook/angular';

import {
  SAMPLE_ORG,
  type SamplePerson,
} from '../../../testing/org-chart-sample';
import {
  ORG_CHART_DECORATOR,
  ORG_CHART_PARAMETERS,
  READOUT,
  ROW,
  STACK,
} from '../../../testing/org-chart-story-kit';
import { AndesOrgChart } from '../org-chart';
import type { AndesOrgChartKey } from '../org-chart-layout';

const meta: Meta<AndesOrgChart> = {
  title: 'Data Display/Org Chart/Interaction/Controlled expansion',
  component: AndesOrgChart,
  parameters: ORG_CHART_PARAMETERS,
  decorators: [ORG_CHART_DECORATOR],
};

export default meta;

type Story = StoryObj<AndesOrgChart>;

/**
 * Controlled expansion: `[(expanded)]` holds the open teams, so the page can expand or collapse
 * everything, and it follows what the user opens and closes.
 */
export const TwoWayBinding: Story = {
  render: () => {
    const managers: string[] = [];
    const walk = (node: SamplePerson) => {
      if (node.children?.length) {
        managers.push(node.id);
        node.children.forEach(walk);
      }
    };
    walk(SAMPLE_ORG);
    const open = signal<readonly AndesOrgChartKey[]>(['ceo']);
    return {
      props: {
        data: SAMPLE_ORG,
        open,
        managers,
        expandEveryone() {
          open.set([...managers]);
        },
        collapseEveryone() {
          open.set([]);
        },
      },
      template: `
        <div style="${STACK}">
          <div style="${ROW}">
            <andes-button variant="outline" (click)="expandEveryone()">Expand all</andes-button>
            <andes-button variant="outline" (click)="collapseEveryone()">Collapse all</andes-button>
            <span style="${READOUT}">{{ open().length }} of {{ managers.length }} teams open</span>
          </div>
          <andes-org-chart
            aria-label="Company organization"
            style="--andes-org-chart-height: 32rem"
            [data]="data"
            [(expanded)]="open"
          />
        </div>
      `,
    };
  },
};

/** `expandToLevel(n)` opens the chart down to a level and closes the rest: the same as the bar's level menu. */
export const OpenToALevel: Story = {
  render: () => ({
    props: { data: SAMPLE_ORG, levels: [1, 2, 3, 4] },
    template: `
      <div style="${STACK}">
        <div style="${ROW}">
          @for (level of levels; track level) {
            <andes-button
              [variant]="chart.shownLevels() === level ? 'secondary' : 'outline'"
              (click)="chart.expandToLevel(level); chart.fitView()"
            >Level {{ level }}</andes-button>
          }
          <span style="${READOUT}">{{ chart.shownLevels() }} levels shown</span>
        </div>
        <andes-org-chart
          #chart="andesOrgChart"
          aria-label="Company organization"
          style="--andes-org-chart-height: 32rem"
          leafLayout="compact"
          [data]="data"
        />
      </div>
    `,
  }),
};
