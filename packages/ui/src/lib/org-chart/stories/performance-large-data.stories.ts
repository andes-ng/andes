import { signal } from '@angular/core';
import { type Meta, type StoryObj } from '@storybook/angular';

import {
  generateOrg,
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
  title: 'Data Display/Org Chart/Performance/Large data',
  component: AndesOrgChart,
  parameters: ORG_CHART_PARAMETERS,
  decorators: [ORG_CHART_DECORATOR],
};

export default meta;

type Story = StoryObj<AndesOrgChart>;

/**
 * Tens of thousands of people. Only the cards and connectors near the viewport are in the page
 * (`virtualizeAbove`), so the cost follows what is on screen rather than the size of the
 * organization: panning is one style write per frame, and expanding, collapsing or searching
 * touches a few dozen elements. Every card keeps its `aria-posinset` and `aria-setsize`, and
 * keyboard focus, search and `scrollToNode` reach the cards that are not rendered. The readouts
 * show how many cards are in the page and the time from a change to the next painted frame.
 */
export const ThousandsOfPeople: Story = {
  render: () => {
    const people = signal(5000);
    const everything = signal(true);
    const query = signal('');
    const elapsed = signal('');
    const inPage = signal('');
    const datasets = new Map<number, SamplePerson>();
    const dataFor = (count: number) => {
      if (!datasets.has(count)) {
        datasets.set(count, generateOrg(count, 7));
      }
      return datasets.get(count) as SamplePerson;
    };
    const measure = () => {
      const start = performance.now();
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          elapsed.set(`${Math.round(performance.now() - start)} ms to render`);
          const cards = document.querySelectorAll(
            'andes-org-chart [data-slot="org-chart-node"]',
          ).length;
          inPage.set(`${cards.toLocaleString('en-US')} cards in the page`);
        }),
      );
    };
    return {
      props: {
        people,
        everything,
        query,
        elapsed,
        inPage,
        dataFor,
        sizes: [
          { label: '500', value: 500 },
          { label: '5,000', value: 5000 },
          { label: '20,000', value: 20000 },
        ],
        setSize(value: number) {
          people.set(value);
          measure();
        },
        setEverything(chart: AndesOrgChart, value: boolean) {
          everything.set(value);
          if (value) {
            chart.expandAllNodes();
          } else {
            chart.collapseAll();
          }
          chart.fitView({ animate: false });
          measure();
        },
        setQuery(value: string) {
          query.set(value);
          measure();
        },
      },
      template: `
        <div style="${STACK}">
          <div style="${ROW} gap: 1.5rem;">
            <andes-segmented aria-label="People" [options]="sizes" [value]="people()" (valueChange)="setSize($event)" />
            <andes-switch [checked]="everything()" (checkedChange)="setEverything(chart, $event)">Expand everything</andes-switch>
            <andes-input
              style="width: 14rem"
              aria-label="Search people"
              placeholder="Search by name or role"
              clearable
              [value]="query()"
              (valueChange)="setQuery($event)"
            />
            <span style="${READOUT}">{{ elapsed() }}</span>
            <span style="${READOUT}">{{ inPage() }}</span>
          </div>
          <andes-org-chart
            #chart="andesOrgChart"
            aria-label="Generated organization"
            style="--andes-org-chart-height: 38rem"
            leafLayout="compact"
            [data]="dataFor(people())"
            [search]="query()"
            [defaultExpandDepth]="2"
            [expandAll]="everything()"
          />
        </div>
      `,
    };
  },
};

/**
 * The tools work on a windowed chart: the overview shows all of it, the level menu opens it down
 * to a depth, and the search field steps through matches that are not in the page.
 */
export const ToolsOnALargeChart: Story = {
  render: () => {
    const data = generateOrg(3000, 7);
    return {
      props: { data },
      template: `
        <andes-org-chart
          aria-label="Generated organization"
          style="--andes-org-chart-height: 38rem"
          leafLayout="compact"
          [data]="data"
          [minimap]="true"
          [controlItems]="['minimap', 'search', 'expandLevel', 'divider', 'zoom', 'fit', 'divider', 'capture', 'export']"
          [defaultExpandDepth]="2"
        />
      `,
    };
  },
};

/** Collapsed, the same chart shows only the leadership and costs a handful of cards. */
export const CollapsedLargeChart: Story = {
  render: () => ({
    props: { data: generateOrg(20000, 7) },
    template: `
      <andes-org-chart
        aria-label="Generated organization"
        style="--andes-org-chart-height: 30rem"
        [data]="data"
        [defaultExpandDepth]="1"
      />
    `,
  }),
};
