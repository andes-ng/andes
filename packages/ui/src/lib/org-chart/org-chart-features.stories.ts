import { signal } from '@angular/core';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';

import {
  generateOrg,
  SAMPLE_ORG,
  type SamplePerson,
} from '../../testing/org-chart-sample';
import { AndesButton } from '../button/button';
import { AndesInput } from '../input/input';
import { AndesSegmented } from '../segmented/segmented';
import { AndesSwitch } from '../switch/switch';
import { AndesOrgChart } from './org-chart';
import type { AndesOrgChartKey } from './org-chart-layout';

const meta: Meta<AndesOrgChart> = {
  title: 'Data Display/Org Chart/Basics/Features',
  component: AndesOrgChart,
  parameters: { layout: 'padded' },
  decorators: [
    moduleMetadata({
      imports: [AndesButton, AndesInput, AndesSegmented, AndesSwitch],
    }),
  ],
};

export default meta;

type Story = StoryObj<AndesOrgChart>;

function find(node: SamplePerson, key: AndesOrgChartKey): SamplePerson | null {
  if (node.id === key) {
    return node;
  }
  for (const child of node.children ?? []) {
    const hit = find(child, key);
    if (hit) {
      return hit;
    }
  }
  return null;
}

/** Returns a copy of the tree with `update` applied to the node with the given key. */
function updateNode(
  node: SamplePerson,
  key: AndesOrgChartKey,
  update: (node: SamplePerson) => SamplePerson | null,
): SamplePerson | null {
  if (node.id === key) {
    return update(node);
  }
  if (!node.children) {
    return node;
  }
  return {
    ...node,
    children: node.children
      .map((child) => updateNode(child, key, update))
      .filter((child): child is SamplePerson => child !== null),
  };
}

/**
 * `search` highlights every match, dims everyone else, lights the path up to the root and
 * expands the managers of hidden matches. `matchedKeys` and `scrollToNode()` step through the
 * results.
 */
export const Search: Story = {
  render: () => {
    const query = signal('an');
    const index = signal(0);
    return {
      props: {
        data: SAMPLE_ORG,
        query,
        index,
        step(chart: AndesOrgChart, delta: number) {
          const keys = chart.matchedKeys();
          if (!keys.length) {
            return;
          }
          const next = (index() + delta + keys.length) % keys.length;
          index.set(next);
          chart.scrollToNode(keys[next], { focus: true });
        },
      },
      template: `
        <div style="display: grid; gap: 1rem;">
          <div style="display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap;">
            <andes-input
              style="width: 16rem"
              aria-label="Search people"
              placeholder="Search by name or role"
              clearable
              [(value)]="query"
            />
            <andes-button variant="outline" size="sm" (click)="step(chart, -1)">Previous</andes-button>
            <andes-button variant="outline" size="sm" (click)="step(chart, 1)">Next</andes-button>
            <span aria-live="polite" style="font-size: 0.875rem">
              {{ chart.matchedKeys().length }} matches
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

/**
 * `selectionMode="multiple"` with `[(selected)]`: click cards (or press Enter / Space) to toggle
 * them. Disabled people (`disabled: true`) cannot be selected; read-only people
 * (`readonly: true`) can be focused and expanded but not selected.
 */
export const Selection: Story = {
  render: () => {
    const picked = signal<readonly AndesOrgChartKey[]>(['cto', 'cfo']);
    const data = updateNode(
      updateNode(SAMPLE_ORG, 'coo', (node) => ({
        ...node,
        disabled: true,
      })) as SamplePerson,
      'cmo',
      (node) => ({ ...node, readonly: true }),
    );
    return {
      props: { org: data, picked },
      template: `
        <div style="display: grid; gap: 1rem;">
          <span style="font-size: 0.875rem">Selected: {{ picked().join(', ') || 'nobody' }}</span>
          <andes-org-chart
            aria-label="Company organization"
            style="--andes-org-chart-height: 30rem"
            selectionMode="multiple"
            [data]="org"
            [(selected)]="picked"
            [defaultExpandDepth]="1"
          />
        </div>
      `,
    };
  },
};

/**
 * `loadChildren` fetches a team the first time it is expanded; the badge spins meanwhile.
 * People with `isLeaf: true` never load. Here every team takes about a second to arrive and
 * the "Finance" request fails, which collapses it again and emits `loadError`.
 */
export const AsyncLoading: Story = {
  render: () => {
    const errors = signal<string[]>([]);
    let next = 1;
    const loadChildren = (person: SamplePerson): Promise<SamplePerson[]> =>
      new Promise((resolve, reject) => {
        setTimeout(() => {
          if (person.id === 'finance') {
            reject(new Error('Finance is unavailable'));
            return;
          }
          const count = 2 + (next % 3);
          resolve(
            Array.from({ length: count }, (_, index) => {
              const id = `${person.id}-${next++}`;
              return {
                id,
                name: `Person ${id}`,
                title: index === 0 ? 'Team Lead' : 'Specialist',
                isLeaf: index !== 0,
              };
            }),
          );
        }, 1000);
      });
    return {
      props: {
        data: {
          id: 'root',
          name: 'Valeria Quispe',
          title: 'Chief Executive Officer',
          children: [
            { id: 'tech', name: 'Martín Salazar', title: 'Technology' },
            { id: 'finance', name: 'Ricardo Chávez', title: 'Finance' },
            { id: 'ops', name: 'Daniela Herrera', title: 'Operations' },
          ],
        },
        loadChildren,
        errors,
        onError(error: unknown) {
          errors.update((list) => [...list, String((error as Error).message)]);
        },
      },
      template: `
        <div style="display: grid; gap: 1rem;">
          <andes-org-chart
            aria-label="Company organization"
            style="--andes-org-chart-height: 30rem"
            [data]="data"
            [loadChildren]="loadChildren"
            [fitOnInit]="false"
            (loadError)="onError($event.error)"
          />
          @for (error of errors(); track $index) {
            <span style="font-size: 0.875rem">{{ error }}</span>
          }
        </div>
      `,
    };
  },
};

/**
 * Data that changes at runtime: select someone, then add a report (the card grows out of its
 * manager), rename them, or remove them (their team shrinks back into the manager). The chart
 * keeps the view, the expansion and the selection.
 */
export const DynamicData: Story = {
  render: () => {
    const org = signal<SamplePerson>(SAMPLE_ORG);
    const picked = signal<readonly AndesOrgChartKey[]>(['eng2']);
    let counter = 1;
    const current = () => picked()[0];
    return {
      props: {
        org,
        picked,
        add() {
          const key = current();
          if (!key) {
            return;
          }
          const id = `new-${counter++}`;
          org.set(
            updateNode(org(), key, (node) => ({
              ...node,
              children: [
                ...(node.children ?? []),
                { id, name: `New Hire ${counter - 1}`, title: 'Associate' },
              ],
            })) as SamplePerson,
          );
        },
        rename() {
          const key = current();
          if (key) {
            org.set(
              updateNode(org(), key, (node) => ({
                ...node,
                title: `${node.title.replace(/ \(acting\)$/, '')} (acting)`,
              })) as SamplePerson,
            );
          }
        },
        remove() {
          const key = current();
          if (!key || key === org().id) {
            return;
          }
          org.set(updateNode(org(), key, () => null) as SamplePerson);
          picked.set([]);
        },
        reset() {
          org.set(SAMPLE_ORG);
        },
        selectedName: () => (current() ? find(org(), current())?.name : null),
      },
      template: `
        <div style="display: grid; gap: 1rem;">
          <div style="display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap;">
            <andes-button size="sm" [disabled]="!picked().length" (click)="add()">Add report</andes-button>
            <andes-button size="sm" variant="outline" [disabled]="!picked().length" (click)="rename()">Mark acting</andes-button>
            <andes-button size="sm" variant="outline" danger [disabled]="!picked().length" (click)="remove()">Remove</andes-button>
            <andes-button size="sm" variant="ghost" (click)="reset()">Reset</andes-button>
            <span style="font-size: 0.875rem">{{ selectedName() ?? 'Select a person' }}</span>
          </div>
          <andes-org-chart
            aria-label="Company organization"
            style="--andes-org-chart-height: 34rem"
            [data]="org()"
            [(selected)]="picked"
            [defaultExpandDepth]="3"
            leafLayout="compact"
          />
        </div>
      `,
    };
  },
};

/**
 * The imperative API through the `andesOrgChart` reference: `fitView()`, `zoomTo()`,
 * `resetView()`, `expandAllNodes()`, `collapseAll()`, `scrollToNode()`, `expandPath()` and
 * `exportSvg()`.
 */
export const ImperativeApi: Story = {
  render: () => {
    const exported = signal('');
    return {
      props: {
        data: SAMPLE_ORG,
        exported,
        exportChart(chart: AndesOrgChart) {
          exported.set(
            `${Math.round(chart.exportSvg().length / 1024)} kB of SVG`,
          );
        },
      },
      template: `
        <div style="display: grid; gap: 1rem;">
          <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; align-items: center;">
            <andes-button size="sm" variant="outline" (click)="chart.fitView()">Fit</andes-button>
            <andes-button size="sm" variant="outline" (click)="chart.zoomTo(1.5)">Zoom 150%</andes-button>
            <andes-button size="sm" variant="outline" (click)="chart.resetView()">Reset</andes-button>
            <andes-button size="sm" variant="outline" (click)="chart.expandAllNodes()">Expand all</andes-button>
            <andes-button size="sm" variant="outline" (click)="chart.collapseAll()">Collapse all</andes-button>
            <andes-button size="sm" (click)="chart.scrollToNode('acc1', { select: true })">Find Gabriel</andes-button>
            <andes-button size="sm" variant="outline" (click)="exportChart(chart)">Export SVG</andes-button>
            <span style="font-size: 0.875rem">{{ exported() }}</span>
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
    };
  },
};

/**
 * Thousands of people. The layout itself takes a few milliseconds; what costs is the number of
 * cards in the page, so large charts start collapsed (`defaultExpandDepth`) and stack leaf teams
 * (`leafLayout="compact"`). Turn on "Expand everything" to render every card at once; the time
 * shown is from the data change to the next painted frame.
 */
export const LargeData: Story = {
  render: () => {
    const people = signal(2000);
    const everything = signal(false);
    const elapsed = signal('');
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
        requestAnimationFrame(() =>
          elapsed.set(`${Math.round(performance.now() - start)} ms to render`),
        ),
      );
    };
    return {
      props: {
        people,
        everything,
        elapsed,
        dataFor,
        sizes: [
          { label: '500', value: 500 },
          { label: '2,000', value: 2000 },
          { label: '5,000', value: 5000 },
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
      },
      template: `
        <div style="display: grid; gap: 1rem;">
          <div style="display: flex; gap: 1.5rem; align-items: center; flex-wrap: wrap;">
            <andes-segmented aria-label="People" [options]="sizes" [value]="people()" (valueChange)="setSize($event)" />
            <andes-switch [checked]="everything()" (checkedChange)="setEverything(chart, $event)">Expand everything</andes-switch>
            <span style="font-size: 0.875rem">{{ elapsed() }}</span>
          </div>
          <andes-org-chart
            #chart="andesOrgChart"
            aria-label="Generated organization"
            style="--andes-org-chart-height: 38rem"
            leafLayout="compact"
            [data]="dataFor(people())"
            [defaultExpandDepth]="2"
          />
        </div>
      `,
    };
  },
};
