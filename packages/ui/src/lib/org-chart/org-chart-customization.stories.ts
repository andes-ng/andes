import {
  type Decorator,
  moduleMetadata,
  type Meta,
  type StoryObj,
} from '@storybook/angular';

import {
  SAMPLE_ARCHITECTURE,
  SAMPLE_DEPARTMENT_COLORS,
  SAMPLE_ORG,
  type SamplePerson,
  type SampleService,
  withoutPhotos,
} from '../../testing/org-chart-sample';
import { AndesButton } from '../button/button';
import { AndesOrgChart } from './org-chart';
import type { AndesOrgChartConnectorInfo } from './org-chart';
import {
  AndesOrgChartConnectorTemplate,
  AndesOrgChartEmptyTemplate,
  AndesOrgChartNodeTemplate,
  AndesOrgChartToggleIconTemplate,
  AndesOrgChartToggleTemplate,
  AndesOrgChartToolbarTemplate,
} from './org-chart-templates';

/** The sample company with every person colored by department. */
function byDepartment(node: SamplePerson): SamplePerson {
  return {
    ...node,
    color: SAMPLE_DEPARTMENT_COLORS[node.department ?? ''] ?? undefined,
    children: node.children?.map(byDepartment),
  };
}

/** 16px stroke icons for the architecture story (the story is about custom content). */
const ICONS: Readonly<Record<SampleService['icon'], string>> = {
  cloud: 'M5 12.5h6.5a3 3 0 0 0 .4-6 4 4 0 0 0-7.7 1A2.5 2.5 0 0 0 5 12.5z',
  compute:
    'M5 5h6v6H5zM7 2.5V5M9 2.5V5M7 11v2.5M9 11v2.5M2.5 7H5M2.5 9H5M11 7h2.5M11 9h2.5',
  storage:
    'M3 4.5c0-1.1 2.2-2 5-2s5 .9 5 2-2.2 2-5 2-5-.9-5-2zM3 4.5v7c0 1.1 2.2 2 5 2s5-.9 5-2v-7M3 8c0 1.1 2.2 2 5 2s5-.9 5-2',
  network:
    'M6.5 1.5h3v3h-3zM2.5 11.5h3v3h-3zM10.5 11.5h3v3h-3zM8 4.5v4M4 11.5v-3h8v3',
  data: 'M2.5 3.5h11v9h-11zM2.5 6.5h11M6.5 6.5v6',
  server: 'M3 3h10v4H3zM3 9h10v4H3zM5.5 5h.01M5.5 11h.01',
  box: 'M2.5 5 8 2.5 13.5 5v6L8 13.5 2.5 11zM2.5 5 8 7.5 13.5 5M8 7.5v6',
  bolt: 'M9 1.5 3.5 9H8l-1 5.5L12.5 7H8z',
  disk: 'M8 2.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11zM8 6.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z',
  archive: 'M2.5 3h11v3h-11zM3.5 6v7h9V6M6.5 8.5h3',
  globe:
    'M8 2.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11zM2.5 8h11M8 2.5c1.7 1.6 2.5 3.4 2.5 5.5S9.7 11.9 8 13.5C6.3 11.9 5.5 10.1 5.5 8S6.3 4.1 8 2.5z',
  route: 'M3 4h7a2 2 0 0 1 0 4H6a2 2 0 0 0 0 4h7M11.5 10.5 13 12l-1.5 1.5',
  table: 'M2.5 3.5h11v9h-11zM2.5 6.5h11M6.5 6.5v6',
  stream: 'M2.5 5h8M2.5 8h11M2.5 11h6M10.5 3.5 12 5l-1.5 1.5',
  cache: 'M4 2.5h8v11H4zM6 5.5h4M6 8h4M6 10.5h2',
};

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
        AndesOrgChartConnectorTemplate,
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
 * Custom content: a cloud architecture drawn with `andesOrgChartNode` (an icon tile tinted by
 * the service category, a title and a description), and `andesOrgChartToggleIcon` replacing the
 * toggle's chevron with plus and minus.
 */
export const Content: Story = {
  render: () => ({
    props: {
      data: SAMPLE_ARCHITECTURE,
      icons: ICONS,
      cardSize: { width: 256, height: 72 },
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
          <span
            style="display: grid; place-items: center; flex: none; width: 2.5rem; height: 2.5rem; border-radius: 0.5rem;"
            [style.background]="'color-mix(in srgb, ' + service.color + ' 14%, transparent)'"
            [style.color]="'color-mix(in srgb, ' + service.color + ' 75%, var(--andes-color-foreground))'"
          >
            <svg viewBox="0 0 16 16" width="18" height="18" aria-hidden="true" focusable="false">
              <path [attr.d]="icons[service.icon]" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </span>
          <span style="display: grid; gap: 2px; min-width: 0;">
            <span style="font-size: 0.875rem; line-height: 1.25rem; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">{{ service.title }}</span>
            <span style="font-size: 0.75rem; line-height: 1rem; color: var(--andes-color-muted-foreground); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">{{ service.description }}</span>
          </span>
        </ng-template>
        <ng-template andesOrgChartToggleIcon let-expanded>
          <svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true" focusable="false">
            <path [attr.d]="expanded ? 'M3 6h6' : 'M3 6h6M6 3v6'" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" />
          </svg>
        </ng-template>
      </andes-org-chart>
    `,
  }),
};

/**
 * Templates for a different card shape: `andesOrgChartNode` draws a vertical profile card (a
 * larger photo, the name, the role and the department), `andesOrgChartToggle` replaces the whole
 * toggle with the team size, and `andesOrgChartToolbar` adds controls in the top corner (its
 * context is the chart). `nodeSize` matches the cards.
 */
export const Templates: Story = {
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
        <ng-template andesOrgChartToolbar let-chart>
          <andes-button size="sm" variant="outline" (click)="chart.expandAllNodes(); chart.fitView()">Expand all</andes-button>
          <andes-button size="sm" variant="outline" (click)="chart.collapseAll(); chart.resetView()">Collapse all</andes-button>
        </ng-template>
      </andes-org-chart>
    `,
  }),
};

/**
 * Connectors: `connectorClass` adds classes per link (here a dashed line to assistants), and
 * `andesOrgChartConnector` replaces the drawing entirely (the second chart draws dotted lines).
 * Its content is SVG, so elements carry the `svg:` prefix.
 */
export const Connectors: Story = {
  decorators: [
    globalStyles(
      'org-chart-story-connectors',
      '.story-assistant-link path { stroke-dasharray: 3 3; }',
    ),
  ],
  render: () => ({
    props: {
      data: SAMPLE_ORG,
      connectorClass: (link: AndesOrgChartConnectorInfo<SamplePerson>) =>
        link.kind === 'assistant' ? 'story-assistant-link' : null,
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
            <svg:path [attr.d]="d" fill="none" stroke="var(--andes-color-muted-foreground)" stroke-width="1.5" stroke-linecap="round" stroke-dasharray="0.1 4" />
          </ng-template>
        </andes-org-chart>
      </div>
    `,
  }),
};

/**
 * Color: a person's `color` field tints the initials (the first chart colors by department), and
 * `levelColors` colors by depth instead (cycling). `nodeClass` adds classes per person; here the
 * leadership cards get a slightly raised background through a custom property.
 */
export const Colors: Story = {
  decorators: [
    globalStyles(
      'org-chart-story-colors',
      '.story-leadership { --andes-org-chart-node-background: color-mix(in srgb, var(--andes-color-foreground) 4%, var(--andes-color-card)); }',
    ),
  ],
  render: () => ({
    props: {
      byDepartment: withoutPhotos(byDepartment(SAMPLE_ORG)),
      plain: withoutPhotos(SAMPLE_ORG),
      levels: ['#64748b', '#2563eb', '#0d9488', '#9333ea'],
      nodeClass: (person: SamplePerson) =>
        person.id === 'ceo' || person.title.startsWith('Chief')
          ? 'story-leadership'
          : null,
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
 * Theming with CSS custom properties only: a warm neutral canvas, larger card corners, a softer
 * hairline and connector, a 48px avatar and a filled toggle. Every hook is listed in the
 * stylesheet.
 */
export const Theming: Story = {
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
 * Dark theme: the chart only uses theme tokens, so `data-andes-theme="dark"` on any ancestor
 * (or the toolbar's Theme switch) restyles it: the canvas takes the page background, the cards
 * sit one step lighter and the hairlines one step lighter again. The story forces it on a
 * wrapper.
 */
export const Dark: Story = {
  render: () => ({
    props: { data: SAMPLE_ORG, picked: ['design'] },
    template: `
      <div data-andes-theme="dark" style="padding: 1rem; background: var(--andes-color-background); border-radius: 0.75rem;">
        <andes-org-chart
          aria-label="Company organization"
          style="--andes-org-chart-height: 32rem"
          [data]="data"
          [selected]="picked"
          [defaultExpandDepth]="2"
        />
      </div>
    `,
  }),
};

/**
 * Right to left: under `dir="rtl"` the first report is drawn on the right, a horizontal chart
 * grows to the left, the card content and the controls mirror, and Left/Right arrow keys swap.
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
              <span>No one has been added yet.</span>
              <andes-button size="sm" variant="outline">Import people</andes-button>
            </div>
          </ng-template>
        </andes-org-chart>
      </div>
    `,
  }),
};
