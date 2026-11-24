import { signal } from '@angular/core';
import { type Meta, type StoryObj } from '@storybook/angular';

import {
  generateOrg,
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
  title: 'Data Display/Org Chart/Toolbar/Export',
  component: AndesOrgChart,
  parameters: ORG_CHART_PARAMETERS,
  decorators: [ORG_CHART_DECORATOR],
};

export default meta;

type Story = StoryObj<AndesOrgChart>;

/**
 * The `export` menu saves the whole chart (not just what is in view) as PNG, JPG, WebP or SVG. The
 * chart shows the people that are open at the time, and `exportFilename` names the files.
 */
export const Menu: Story = {
  render: () => ({
    props: { data: SAMPLE_ORG },
    template: `
      <andes-org-chart
        aria-label="Company organization"
        style="--andes-org-chart-height: 30rem"
        exportFilename="company"
        [data]="data"
        [defaultExpandDepth]="1"
      />
    `,
  }),
};

/**
 * `download(format)` from the page's own buttons: `scale` sets the pixel ratio of an image (2 by
 * default), `background` fills behind the chart (JPEG always gets one), `quality` compresses a JPEG
 * or WebP and `filename` names the file. `exportImage(format)` returns the same file as a `Blob`.
 */
export const Formats: Story = {
  render: () => ({
    props: { data: SAMPLE_ORG },
    template: `
      <div style="${STACK}">
        <div style="${ROW}">
          <andes-button variant="outline" (click)="chart.expandAllNodes()">Expand all</andes-button>
          <andes-button (click)="chart.download('svg', { filename: 'company' })">Download SVG</andes-button>
          <andes-button (click)="chart.download('png', { filename: 'company', scale: 2 })">Download PNG</andes-button>
          <andes-button (click)="chart.download('jpeg', { filename: 'company', quality: 0.92 })">Download JPG</andes-button>
          <andes-button variant="outline" (click)="chart.download('webp', { filename: 'company' })">Download WebP</andes-button>
        </div>
        <andes-org-chart
          #chart="andesOrgChart"
          aria-label="Company organization"
          style="--andes-org-chart-height: 32rem"
          [data]="data"
          [defaultExpandDepth]="1"
        />
      </div>
    `,
  }),
};

/** `scope: 'view'` saves only what the viewport shows, `scope: 'chart'` the whole chart. */
export const Scopes: Story = {
  render: () => ({
    props: { data: SAMPLE_ORG },
    template: `
      <div style="${STACK}">
        <div style="${ROW}">
          <andes-button (click)="chart.download('png', { scope: 'view', filename: 'view' })">Save the view</andes-button>
          <andes-button variant="outline" (click)="chart.download('png', { scope: 'chart', filename: 'chart' })">Save the whole chart</andes-button>
        </div>
        <andes-org-chart
          #chart="andesOrgChart"
          aria-label="Company organization"
          style="--andes-org-chart-height: 28rem"
          [data]="data"
          [defaultExpandDepth]="2"
        />
      </div>
    `,
  }),
};

/**
 * `(exported)` reports every file the bar or `download()` saved, with its format, scope and name,
 * and `(exportError)` a save that failed, so the page can confirm or complain.
 */
export const Events: Story = {
  render: () => {
    const log = signal<string[]>([]);
    return {
      props: {
        data: SAMPLE_ORG,
        log,
        saved(event: { filename: string; scope: string; blob: Blob }) {
          log.update((list) => [
            ...list,
            `${event.filename} (${event.scope}, ${(event.blob.size / 1024).toFixed(1)} KB)`,
          ]);
        },
        failed(event: { error: unknown }) {
          log.update((list) => [...list, `failed: ${String(event.error)}`]);
        },
      },
      template: `
        <div style="${STACK}">
          @for (line of log(); track $index) { <span style="${READOUT}">{{ line }}</span> }
          <andes-org-chart
            aria-label="Company organization"
            style="--andes-org-chart-height: 28rem"
            [controlItems]="['zoom', 'divider', 'capture', 'export']"
            [data]="data"
            [defaultExpandDepth]="1"
            (exported)="saved($event)"
            (exportError)="failed($event)"
          />
        </div>
      `,
    };
  },
};

/**
 * Exporting a large chart. With more cards than `virtualizeAbove` only the ones near the viewport
 * are in the page, yet the export of the whole chart is exact (the real cards, templates and
 * colors) up to `exportExactLimit` visible cards: the cards that are away are put in the page for
 * the instant they are copied. Above the limit the file is the drawn summary (boxes with names),
 * which keeps every card. Try 400 and 3,000 people.
 */
export const OfALargeChart: Story = {
  render: () => {
    const people = signal(400);
    const info = signal('');
    const datasets = new Map<number, SamplePerson>();
    return {
      props: {
        people,
        info,
        sizes: [
          { label: '400', value: 400 },
          { label: '3,000', value: 3000 },
        ],
        dataFor(count: number) {
          if (!datasets.has(count)) {
            datasets.set(count, generateOrg(count, 7));
          }
          return datasets.get(count) as SamplePerson;
        },
        async measure(chart: AndesOrgChart) {
          const inPage = () =>
            document.querySelectorAll(
              'andes-org-chart [data-slot="org-chart-node"]',
            ).length;
          const before = inPage();
          const started = performance.now();
          const blob = await chart.exportImage('svg');
          const text = await blob.text();
          const exact = text.includes('<foreignObject');
          info.set(
            `${before.toLocaleString('en-US')} cards in the page; the file is ${exact ? 'exact' : 'the drawn summary'}, ${(blob.size / 1024).toFixed(0)} KB, in ${Math.round(performance.now() - started)} ms`,
          );
        },
      },
      template: `
        <div style="${STACK}">
          <div style="${ROW} gap: 1.5rem;">
            <andes-segmented aria-label="People" [options]="sizes" [(value)]="people" />
            <andes-button (click)="measure(chart)">Export the whole chart as SVG</andes-button>
            <span style="${READOUT}">{{ info() }}</span>
          </div>
          <andes-org-chart
            #chart="andesOrgChart"
            aria-label="Generated organization"
            style="--andes-org-chart-height: 32rem"
            leafLayout="compact"
            [data]="dataFor(people())"
            [expandAll]="true"
            [exportExactLimit]="2000"
          />
        </div>
      `,
    };
  },
};
