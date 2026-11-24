import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';

import {
  SAMPLE_ARCHITECTURE,
  SAMPLE_ORG,
} from '../../../testing/org-chart-sample';
import {
  ORG_CHART_PARAMETERS,
  STORY_IMPORTS,
} from '../../../testing/org-chart-story-kit';
import { AndesOrgChart } from '../org-chart';
import {
  AndesOrgChartEmptyTemplate,
  AndesOrgChartNodeTemplate,
  AndesOrgChartToggleIconTemplate,
  AndesOrgChartToggleTemplate,
  AndesOrgChartToolbarTemplate,
} from '../org-chart-templates';

const meta: Meta<AndesOrgChart> = {
  title: 'Data Display/Org Chart/Customization/Templates',
  component: AndesOrgChart,
  parameters: ORG_CHART_PARAMETERS,
  decorators: [
    moduleMetadata({
      imports: [
        ...STORY_IMPORTS,
        AndesOrgChartEmptyTemplate,
        AndesOrgChartNodeTemplate,
        AndesOrgChartToggleIconTemplate,
        AndesOrgChartToggleTemplate,
        AndesOrgChartToolbarTemplate,
      ],
    }),
  ],
};

export default meta;

type Story = StoryObj<AndesOrgChart>;

/**
 * Custom content: a cloud architecture drawn with `andesOrgChartNode`, plain text only (a title
 * and a description), and `andesOrgChartToggleIcon` replacing the toggle's chevron with a plus
 * and a minus sign.
 */
export const Content: Story = {
  render: () => ({
    props: {
      data: SAMPLE_ARCHITECTURE,
      cardSize: { width: 248, height: 80 },
    },
    template: `
      <andes-org-chart
        aria-label="Cloud architecture"
        style="--andes-org-chart-height: 34rem"
        selectionMode="none"
        [data]="data"
        [nodeSize]="cardSize"
        [defaultExpandDepth]="2"
        leafLayout="hanging"
      >
        <ng-template andesOrgChartNode let-service>
          <span style="display: grid; gap: 2px; min-width: 0;">
            <span style="font-size: 0.875rem; line-height: 1.25rem; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">{{ service.title }}</span>
            <span style="font-size: 0.75rem; line-height: 1rem; color: var(--andes-color-muted-foreground); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">{{ service.description }}</span>
          </span>
        </ng-template>
        <ng-template andesOrgChartToggleIcon let-expanded>
          <span aria-hidden="true" style="font-size: 0.875rem; line-height: 1;">{{ expanded ? '−' : '+' }}</span>
        </ng-template>
      </andes-org-chart>
    `,
  }),
};

/**
 * A different card shape: `andesOrgChartNode` draws a vertical profile card (a larger photo, the
 * name, the role and the department) and `andesOrgChartToggle` replaces the whole toggle with the
 * team size. `nodeSize` matches the cards.
 */
export const ProfileCards: Story = {
  render: () => ({
    props: { data: SAMPLE_ORG, cardSize: { width: 184, height: 152 } },
    template: `
      <andes-org-chart
        aria-label="Company organization"
        style="--andes-org-chart-height: 36rem"
        [data]="data"
        [nodeSize]="cardSize"
        [defaultExpandDepth]="1"
      >
        <ng-template andesOrgChartNode let-person>
          <div style="display: grid; justify-items: center; gap: 0.25rem; width: 100%; text-align: center;">
            <img [src]="person.avatar" alt="" width="56" height="56" style="border-radius: 50%; margin-bottom: 0.25rem;" />
            <span style="font-size: 0.875rem; line-height: 1.25rem; font-weight: 600;">{{ person.name }}</span>
            <span style="font-size: 0.75rem; line-height: 1rem; color: var(--andes-color-muted-foreground);">{{ person.title }}</span>
            <span style="font-size: 0.75rem; line-height: 1rem; color: var(--andes-color-muted-foreground);">{{ person.department }}</span>
          </div>
        </ng-template>
        <ng-template andesOrgChartToggle let-team="descendantCount">
          <span style="padding-inline: 0.25rem;">{{ team }}</span>
        </ng-template>
      </andes-org-chart>
    `,
  }),
};

/**
 * `andesOrgChartToolbar` adds controls of your own in the top start corner, next to the built-in
 * bar. Its context is the chart.
 */
export const OwnToolbar: Story = {
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

/** No data: the `andesOrgChartEmpty` template, or the default text from `labels.empty`. */
export const EmptyDefault: Story = {
  render: () => ({
    template: `
      <andes-org-chart aria-label="Empty organization" style="--andes-org-chart-height: 10rem" [data]="[]" />
    `,
  }),
};

/** The empty template can hold anything, such as a call to action. */
export const EmptyWithTemplate: Story = {
  render: () => ({
    template: `
      <andes-org-chart aria-label="Empty organization" style="--andes-org-chart-height: 10rem" [data]="[]">
        <ng-template andesOrgChartEmpty>
          <div style="display: grid; gap: 0.5rem; justify-items: center;">
            <span>No one has been added yet.</span>
            <andes-button variant="outline">Import people</andes-button>
          </div>
        </ng-template>
      </andes-org-chart>
    `,
  }),
};
