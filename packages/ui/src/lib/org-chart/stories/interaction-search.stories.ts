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

const meta: Meta<AndesOrgChart> = {
  title: 'Data Display/Org Chart/Interaction/Search',
  component: AndesOrgChart,
  parameters: ORG_CHART_PARAMETERS,
  decorators: [ORG_CHART_DECORATOR],
};

export default meta;

type Story = StoryObj<AndesOrgChart>;

/**
 * `search` highlights every match, mutes everyone else, lights the path up to the root and
 * opens the managers of hidden matches. `matchedKeys`, `nextMatch()` and `previousMatch()` step
 * through the results; here the field and the buttons are the page's own.
 */
export const HighlightAndStep: Story = {
  render: () => {
    const query = signal('engineer');
    return {
      props: { data: SAMPLE_ORG, query },
      template: `
        <div style="${STACK}">
          <div style="${ROW}">
            <andes-input
              style="width: 16rem"
              aria-label="Search people"
              placeholder="Search by name or role"
              clearable
              [(value)]="query"
            />
            <andes-button variant="outline" (click)="chart.previousMatch()">Previous</andes-button>
            <andes-button variant="outline" (click)="chart.nextMatch()">Next</andes-button>
            <span aria-live="polite" style="${READOUT}">
              {{ chart.matchedKeys().length }} matches
              @if (chart.currentMatch() !== null) { (at {{ chart.matchIndex() + 1 }}) }
            </span>
          </div>
          <andes-org-chart
            #chart="andesOrgChart"
            aria-label="Company organization"
            style="--andes-org-chart-height: 34rem"
            [data]="data"
            [search]="query()"
            [defaultExpandDepth]="1"
          />
        </div>
      `,
    };
  },
};

/** `searchExpand` set to `false`: matches inside closed teams stay hidden until the team is opened. */
export const WithoutExpanding: Story = {
  render: () => ({
    props: { data: SAMPLE_ORG },
    template: `
      <andes-org-chart
        aria-label="Company organization"
        style="--andes-org-chart-height: 30rem"
        search="engineer"
        [searchExpand]="false"
        [data]="data"
        [defaultExpandDepth]="1"
      />
    `,
  }),
};

/**
 * `searchFn` replaces the match: here a person matches when the query is one of the words of
 * their department, so `design` finds the whole design team.
 */
export const CustomMatch: Story = {
  render: () => ({
    props: {
      data: SAMPLE_ORG,
      byDepartment: (person: SamplePerson, query: string) =>
        (person.department ?? '').toLowerCase().includes(query.toLowerCase()),
    },
    template: `
      <andes-org-chart
        aria-label="Company organization"
        style="--andes-org-chart-height: 30rem"
        search="design"
        [searchFn]="byDepartment"
        [data]="data"
        [defaultExpandDepth]="1"
      />
    `,
  }),
};

/**
 * The search field of the bar writes to `search` too, so `[(search)]` keeps the page in sync with
 * what is typed there. Open it with the magnifier tool, or press `/` on the chart.
 */
export const TwoWayWithTheBar: Story = {
  render: () => {
    const query = signal('');
    return {
      props: { data: SAMPLE_ORG, query },
      template: `
        <div style="${STACK}">
          <span style="${READOUT}">Query: "{{ query() }}"</span>
          <andes-org-chart
            aria-label="Company organization"
            style="--andes-org-chart-height: 30rem"
            [controlItems]="['zoom', 'divider', 'search', 'fit']"
            [data]="data"
            [(search)]="query"
            [defaultExpandDepth]="1"
          />
        </div>
      `,
    };
  },
};
