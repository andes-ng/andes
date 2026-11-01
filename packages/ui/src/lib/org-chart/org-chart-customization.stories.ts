import {
  type Decorator,
  moduleMetadata,
  type Meta,
  type StoryObj,
} from '@storybook/angular';

import {
  SAMPLE_DEPARTMENT_COLORS,
  SAMPLE_ORG,
  type SamplePerson,
} from '../../testing/org-chart-sample';
import { AndesButton } from '../button/button';
import { AndesOrgChart } from './org-chart';
import type { AndesOrgChartConnectorInfo } from './org-chart';
import {
  AndesOrgChartBadgeTemplate,
  AndesOrgChartConnectorTemplate,
  AndesOrgChartEmptyTemplate,
  AndesOrgChartNodeTemplate,
  AndesOrgChartToolbarTemplate,
} from './org-chart-templates';

/** The sample company with every card colored by department. */
function byDepartment(node: SamplePerson): SamplePerson {
  return {
    ...node,
    color: SAMPLE_DEPARTMENT_COLORS[node.department ?? ''] ?? undefined,
    children: node.children?.map(byDepartment),
  };
}

/**
 * Adds page-level CSS for a story. Classes from `nodeClass` and `connectorClass` land inside the
 * chart's own view, so they are styled from a global stylesheet, the way an application would.
 */
function globalStyles(id: string, css: string): Decorator {
  return (story) => {
    if (!document.getElementById(id)) {
      const style = document.createElement('style');
      style.id = id;
      style.textContent = css;
      document.head.append(style);
    }
    return story();
  };
}

const meta: Meta<AndesOrgChart> = {
  title: 'Data Display/Org Chart/Customization',
  component: AndesOrgChart,
  parameters: { layout: 'padded' },
  decorators: [
    moduleMetadata({
      imports: [
        AndesButton,
        AndesOrgChartBadgeTemplate,
        AndesOrgChartConnectorTemplate,
        AndesOrgChartEmptyTemplate,
        AndesOrgChartNodeTemplate,
        AndesOrgChartToolbarTemplate,
      ],
    }),
  ],
};

export default meta;

type Story = StoryObj<AndesOrgChart>;

/**
 * Templates: `andesOrgChartNode` replaces the card content (here a vertical card with the
 * department), `andesOrgChartBadge` the badge content (here the whole team size), and
 * `andesOrgChartToolbar` adds controls in the top corner; its context is the chart. `nodeSize`
 * sizes the cards to the template, per person when it is a function.
 */
export const Templates: Story = {
  render: () => ({
    props: {
      data: byDepartment(SAMPLE_ORG),
      cardSize: (person: SamplePerson) =>
        person.id === 'ceo'
          ? { width: 200, height: 132 }
          : { width: 168, height: 116 },
    },
    template: `
      <andes-org-chart
        aria-label="Company organization"
        style="--andes-org-chart-height: 36rem"
        [data]="data"
        [nodeSize]="cardSize"
        [defaultExpandDepth]="2"
        leafLayout="compact"
      >
        <ng-template andesOrgChartNode let-person let-initials="initials">
          <div style="display: grid; justify-items: center; gap: 0.25rem; width: 100%; text-align: center;">
            <span
              style="display: grid; place-items: center; width: 2.75rem; height: 2.75rem; border-radius: 50%;
                color: white; font-weight: 600; font-size: 0.875rem;"
              [style.background]="person.color"
            >{{ initials }}</span>
            <strong style="font-size: 0.8125rem; line-height: 1.2;">{{ person.name }}</strong>
            <span style="font-size: 0.6875rem; color: var(--andes-color-muted-foreground)">{{ person.title }}</span>
            <span style="font-size: 0.625rem; text-transform: uppercase; letter-spacing: 0.06em;" [style.color]="person.color">
              {{ person.department }}
            </span>
          </div>
        </ng-template>
        <ng-template andesOrgChartBadge let-team="descendantCount">
          {{ team }} in team
        </ng-template>
        <ng-template andesOrgChartToolbar let-chart>
          <andes-button size="sm" variant="outline" (click)="chart.expandAllNodes(); chart.fitView()">Expand all</andes-button>
          <andes-button size="sm" variant="outline" (click)="chart.collapseAll(); chart.resetView()">Collapse all</andes-button>
        </ng-template>
      </andes-org-chart>
    `,
  }),
};

/**
 * Connectors: `connectorClass` adds classes per link (here dotted lines to assistants and a
 * thicker stem out of the CEO), and `andesOrgChartConnector` replaces the drawing entirely (the
 * second chart draws each link twice for a soft glow). Its content is SVG, so elements carry the
 * `svg:` prefix.
 */
export const Connectors: Story = {
  decorators: [
    globalStyles(
      'org-chart-story-connectors',
      '.story-dotted path { stroke-dasharray: 2 4; } .story-bold path { stroke-width: 2.5px; }',
    ),
  ],
  render: () => ({
    props: {
      data: SAMPLE_ORG,
      connectorClass: (link: AndesOrgChartConnectorInfo<SamplePerson>) =>
        link.kind === 'assistant'
          ? 'story-dotted'
          : link.from === 'ceo'
            ? 'story-bold'
            : null,
    },
    template: `
      <div style="display: grid; gap: 1rem;">
        <andes-org-chart
          aria-label="Company organization, link classes"
          style="--andes-org-chart-height: 22rem"
          [data]="data"
          [connectorClass]="connectorClass"
          [defaultExpandDepth]="1"
        />
        <andes-org-chart
          aria-label="Company organization, custom connectors"
          style="--andes-org-chart-height: 22rem"
          connector="curved"
          [data]="data"
          [defaultExpandDepth]="1"
        >
          <ng-template andesOrgChartConnector let-d>
            <svg:path [attr.d]="d" fill="none" stroke="var(--andes-color-primary)" stroke-opacity="0.15" stroke-width="8" />
            <svg:path [attr.d]="d" fill="none" stroke="var(--andes-color-primary)" stroke-width="1.5" />
          </ng-template>
        </andes-org-chart>
      </div>
    `,
  }),
};

/**
 * Color: a person's own `color` field paints the accent stripe, the avatar and the selection;
 * `levelColors` colors by depth instead (cycling), and `nodeClass` adds classes per person
 * (here a highlight for the executive team).
 */
export const Colors: Story = {
  decorators: [
    globalStyles(
      'org-chart-story-colors',
      '.story-exec { --andes-org-chart-node-background: color-mix(in srgb, var(--andes-color-primary) 7%, var(--andes-color-card)); }',
    ),
  ],
  render: () => ({
    props: {
      byDepartment: byDepartment(SAMPLE_ORG),
      plain: SAMPLE_ORG,
      levels: ['#7c3aed', '#0284c7', '#059669', '#d97706'],
      nodeClass: (person: SamplePerson) =>
        person.id.startsWith('c') ? 'story-exec' : null,
    },
    template: `
      <div style="display: grid; gap: 1rem;">
        <andes-org-chart
          aria-label="Organization colored by department"
          style="--andes-org-chart-height: 24rem"
          [data]="byDepartment"
          [defaultExpandDepth]="1"
        />
        <andes-org-chart
          aria-label="Organization colored by level"
          style="--andes-org-chart-height: 24rem"
          [data]="plain"
          [levelColors]="levels"
          [nodeClass]="nodeClass"
          [defaultExpandDepth]="2"
        />
      </div>
    `,
  }),
};

/**
 * Theming with CSS custom properties only: a branded canvas without the dot grid, square cards,
 * stronger connectors and a different selection color. Every hook is listed in the stylesheet.
 */
export const Theming: Story = {
  render: () => ({
    props: { data: SAMPLE_ORG, selected: ['cto'] },
    template: `
      <andes-org-chart
        aria-label="Company organization"
        style="
          --andes-org-chart-height: 32rem;
          --andes-org-chart-background: #f5f3ff;
          --andes-org-chart-dot-color: transparent;
          --andes-org-chart-border-color: #ddd6fe;
          --andes-org-chart-node-radius: 2px;
          --andes-org-chart-node-border-color: #c4b5fd;
          --andes-org-chart-node-shadow: none;
          --andes-org-chart-node-accent: #7c3aed;
          --andes-org-chart-connector-color: #a78bfa;
          --andes-org-chart-connector-width: 2px;
          --andes-org-chart-badge-background: #7c3aed;
          --andes-org-chart-badge-foreground: #ffffff;
          --andes-org-chart-badge-border-color: #7c3aed;
          --andes-org-chart-duration: 450ms;
        "
        [data]="data"
        [selected]="selected"
        [defaultExpandDepth]="2"
        connector="straight"
      />
    `,
  }),
};

/**
 * Dark theme: the chart only uses theme tokens, so `data-andes-theme="dark"` on any ancestor (or
 * the toolbar's Theme switch) restyles it. The story forces it on a wrapper.
 */
export const Dark: Story = {
  render: () => ({
    props: {
      data: byDepartment(SAMPLE_ORG),
      relations: [{ from: 'des', to: 'brand' }],
    },
    template: `
      <div data-andes-theme="dark" style="padding: 1rem; background: var(--andes-color-background); border-radius: 0.75rem;">
        <andes-org-chart
          aria-label="Company organization"
          style="--andes-org-chart-height: 32rem"
          search="Lead"
          [data]="data"
          [secondaryLinks]="relations"
          [defaultExpandDepth]="2"
        />
      </div>
    `,
  }),
};

/**
 * Right to left: under `dir="rtl"` the first report is drawn on the right, a horizontal chart
 * grows to the left, card text and the controls mirror, and Left/Right arrow keys swap.
 */
export const RightToLeft: Story = {
  render: () => ({
    props: { data: SAMPLE_ORG },
    template: `
      <div dir="rtl" style="display: grid; gap: 1rem;">
        <andes-org-chart
          aria-label="Company organization, vertical"
          style="--andes-org-chart-height: 26rem"
          [data]="data"
          [defaultExpandDepth]="2"
        />
        <andes-org-chart
          aria-label="Company organization, horizontal"
          style="--andes-org-chart-height: 30rem"
          orientation="horizontal"
          [data]="data"
          [defaultExpandDepth]="2"
          leafLayout="hanging"
        />
      </div>
    `,
  }),
};

/** No data: the `andesOrgChartEmpty` template, or the default text from `labels.empty`. */
export const Empty: Story = {
  render: () => ({
    template: `
      <div style="display: grid; gap: 1rem;">
        <andes-org-chart aria-label="Empty organization" style="--andes-org-chart-height: 10rem" [data]="[]" />
        <andes-org-chart aria-label="Empty organization" style="--andes-org-chart-height: 10rem" [data]="[]">
          <ng-template andesOrgChartEmpty>
            <div style="display: grid; gap: 0.5rem; justify-items: center;">
              <span>Nobody here yet.</span>
              <andes-button size="sm">Import people</andes-button>
            </div>
          </ng-template>
        </andes-org-chart>
      </div>
    `,
  }),
};
