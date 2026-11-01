import { signal } from '@angular/core';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';

import {
  generateOrg,
  SAMPLE_ORG,
  sampleAvatar,
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

/** A small line of muted text under a story's controls. */
const READOUT =
  'font-size: 0.75rem; line-height: 1rem; color: var(--andes-color-muted-foreground);';

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

/** Names of the given keys, for the readouts. */
function namesOf(keys: readonly AndesOrgChartKey[]): string {
  return keys
    .map((key) => find(SAMPLE_ORG, key)?.name ?? String(key))
    .join(', ');
}

/**
 * Collapsible: every person with reports has the toggle on the bottom edge of the card. Here the
 * chart starts with only the leadership open; open a team with its toggle (or Right arrow /
 * Alt+Down on the focused card).
 */
export const Collapsible: Story = {
  render: () => ({
    props: { data: SAMPLE_ORG },
    template: `
      <andes-org-chart
        aria-label="Company organization"
        style="--andes-org-chart-height: 30rem"
        [data]="data"
        [defaultExpandDepth]="1"
        [fitOnInit]="false"
      />
    `,
  }),
};

/**
 * `collapsible` set to `false`: no toggle, and every team stays open. Use it for small, static
 * charts that should always show everyone.
 */
export const NotCollapsible: Story = {
  render: () => ({
    props: {
      data: {
        ...SAMPLE_ORG,
        children: SAMPLE_ORG.children?.filter((child) =>
          ['cos', 'design', 'product'].includes(child.id),
        ),
      },
    },
    template: `
      <andes-org-chart
        aria-label="Leadership and their teams"
        style="--andes-org-chart-height: 26rem"
        [data]="data"
        [collapsible]="false"
      />
    `,
  }),
};

/**
 * Controlled expansion: `[(expanded)]` holds the open teams, so the page can expand or collapse
 * everything, and it follows what the user opens and closes.
 */
export const Controlled: Story = {
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
        <div style="display: grid; gap: 0.75rem;">
          <div style="display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap;">
            <andes-button size="sm" variant="outline" (click)="expandEveryone()">Expand all</andes-button>
            <andes-button size="sm" variant="outline" (click)="collapseEveryone()">Collapse all</andes-button>
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

/**
 * `search` highlights every match, mutes everyone else, lights the path up to the root and
 * opens the managers of hidden matches. `matchedKeys` and `scrollToNode()` step through the
 * results.
 */
export const Search: Story = {
  render: () => {
    const query = signal('engineer');
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
        <div style="display: grid; gap: 0.75rem;">
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
            <span aria-live="polite" style="${READOUT}">{{ chart.matchedKeys().length }} matches</span>
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

/** `selectionMode="single"` (the default): a click or Enter / Space selects one person. */
export const SelectionSingle: Story = {
  render: () => {
    const picked = signal<readonly AndesOrgChartKey[]>(['design']);
    return {
      props: { data: SAMPLE_ORG, picked, namesOf },
      template: `
        <div style="display: grid; gap: 0.75rem;">
          <span style="${READOUT}">Selected: {{ namesOf(picked()) || 'nobody' }}</span>
          <andes-org-chart
            aria-label="Company organization"
            style="--andes-org-chart-height: 30rem"
            selectionMode="single"
            [data]="data"
            [(selected)]="picked"
            [defaultExpandDepth]="1"
          />
        </div>
      `,
    };
  },
};

/**
 * `selectionMode="multiple"`: each click adds or removes a person. Disabled people
 * (`disabled: true`, here the finance team) cannot be selected; read-only people
 * (`readonly: true`, the chief of staff) can be focused but not selected.
 */
export const SelectionMultiple: Story = {
  render: () => {
    const picked = signal<readonly AndesOrgChartKey[]>(['cto', 'product']);
    const data = updateNode(
      updateNode(SAMPLE_ORG, 'cfo', (node) => ({
        ...node,
        disabled: true,
      })) as SamplePerson,
      'cos',
      (node) => ({ ...node, readonly: true }),
    );
    return {
      props: { org: data, picked, namesOf },
      template: `
        <div style="display: grid; gap: 0.75rem;">
          <span style="${READOUT}">Selected ({{ picked().length }}): {{ namesOf(picked()) || 'nobody' }}</span>
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
 * `selectionMode="checkbox"`: checking a manager checks the whole team; a manager whose team is
 * partly checked shows a mixed box (and is announced as `aria-checked="mixed"`), and one whose
 * reports are all checked becomes checked. `partiallySelected` lists the mixed managers.
 */
export const SelectionCheckbox: Story = {
  render: () => {
    const picked = signal<readonly AndesOrgChartKey[]>([
      'platform',
      'designer1',
    ]);
    return {
      props: { data: SAMPLE_ORG, picked },
      template: `
        <div style="display: grid; gap: 0.75rem;">
          <span style="${READOUT}">Checked ({{ picked().length }}): {{ picked().join(', ') || 'none' }}</span>
          <span style="${READOUT}">Partly checked: {{ chart.partiallySelected().join(', ') || 'none' }}</span>
          <andes-org-chart
            #chart="andesOrgChart"
            aria-label="Company organization"
            style="--andes-org-chart-height: 34rem"
            selectionMode="checkbox"
            leafLayout="compact"
            [data]="data"
            [(selected)]="picked"
            [defaultExpandDepth]="3"
          />
        </div>
      `,
    };
  },
};

/**
 * `loadChildren` fetches a team the first time it is opened; the toggle spins meanwhile. People
 * with `isLeaf: true` never load. Every team takes about a second to arrive, and the finance
 * request fails, which closes it again and emits `loadError`.
 */
export const AsyncLoading: Story = {
  render: () => {
    const errors = signal<string[]>([]);
    const teams: Record<string, [string, string][]> = {
      cto: [
        ['Tomás Herrera', 'Engineering Manager, Platform'],
        ['Grace Liu', 'Engineering Manager, Product'],
        ['Hana Kim', 'Data Lead'],
      ],
      design: [
        ['Mateo Álvarez', 'Product Designer'],
        ['Leila Haddad', 'Product Designer'],
      ],
    };
    const loadChildren = (person: SamplePerson): Promise<SamplePerson[]> =>
      new Promise((resolve, reject) => {
        setTimeout(() => {
          if (person.id === 'cfo') {
            reject(new Error('Finance is not available right now.'));
            return;
          }
          const members = teams[person.id] ?? [
            ['Kwame Mensah', 'Technical Recruiter'],
            ['Ana Ferreira', 'People Operations'],
          ];
          resolve(
            members.map(([name, title], index) => ({
              id: `${person.id}-${index}`,
              name,
              title,
              avatar: sampleAvatar(name),
              isLeaf: true,
            })),
          );
        }, 1000);
      });
    return {
      props: {
        data: {
          id: 'ceo',
          name: 'Elena Vargas',
          title: 'Founder & CEO',
          avatar: sampleAvatar('Elena Vargas'),
          children: [
            {
              id: 'cto',
              name: 'Priya Raman',
              title: 'Chief Technology Officer',
              avatar: sampleAvatar('Priya Raman'),
            },
            {
              id: 'design',
              name: 'Sofia Lindqvist',
              title: 'Head of Design',
              avatar: sampleAvatar('Sofia Lindqvist'),
            },
            {
              id: 'people',
              name: 'Camila Restrepo',
              title: 'Head of People',
              avatar: sampleAvatar('Camila Restrepo'),
            },
            {
              id: 'cfo',
              name: 'David Cohen',
              title: 'Chief Financial Officer',
              avatar: sampleAvatar('David Cohen'),
            },
          ],
        },
        loadChildren,
        errors,
        onError(error: unknown) {
          errors.update((list) => [...list, String((error as Error).message)]);
        },
      },
      template: `
        <div style="display: grid; gap: 0.75rem;">
          <andes-org-chart
            aria-label="Company organization"
            style="--andes-org-chart-height: 30rem"
            [data]="data"
            [loadChildren]="loadChildren"
            [fitOnInit]="false"
            (loadError)="onError($event.error)"
          />
          @for (error of errors(); track $index) {
            <span style="${READOUT}">{{ error }}</span>
          }
        </div>
      `,
    };
  },
};

/**
 * Data that changes at runtime: select someone, then add a report (the card grows out of its
 * manager), mark them as acting, or remove them (their team shrinks back into the manager). The
 * chart keeps the view, the expansion and the selection.
 */
export const DynamicData: Story = {
  render: () => {
    const org = signal<SamplePerson>(SAMPLE_ORG);
    const picked = signal<readonly AndesOrgChartKey[]>(['product']);
    const hires = [
      'Clara Novak',
      'Tobias Lund',
      'Yuki Mori',
      'Diego Paredes',
      'Selin Aydın',
    ];
    let counter = 0;
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
          const name = hires[counter % hires.length];
          const id = `hire-${counter++}`;
          org.set(
            updateNode(org(), key, (node) => ({
              ...node,
              children: [
                ...(node.children ?? []),
                {
                  id,
                  name,
                  title: 'Product Manager',
                  avatar: sampleAvatar(name),
                },
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
                title: node.title.endsWith(' (acting)')
                  ? node.title
                  : `${node.title} (acting)`,
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
        <div style="display: grid; gap: 0.75rem;">
          <div style="display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap;">
            <andes-button size="sm" [disabled]="!picked().length" (click)="add()">Add report</andes-button>
            <andes-button size="sm" variant="outline" [disabled]="!picked().length" (click)="rename()">Mark acting</andes-button>
            <andes-button size="sm" variant="outline" danger [disabled]="!picked().length" (click)="remove()">Remove</andes-button>
            <andes-button size="sm" variant="ghost" (click)="reset()">Reset</andes-button>
            <span style="${READOUT}">{{ selectedName() ?? 'Select a person' }}</span>
          </div>
          <andes-org-chart
            aria-label="Company organization"
            style="--andes-org-chart-height: 34rem"
            [data]="org()"
            [(selected)]="picked"
            [defaultExpandDepth]="2"
          />
        </div>
      `,
    };
  },
};

/**
 * The imperative API through the `andesOrgChart` reference: `fitView()`, `zoomTo()`,
 * `resetView()`, `expandAllNodes()`, `collapseAll()`, `scrollToNode()` and `exportSvg()`.
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
            `Exported ${Math.round(chart.exportSvg().length / 1024)} kB of SVG`,
          );
        },
      },
      template: `
        <div style="display: grid; gap: 0.75rem;">
          <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; align-items: center;">
            <andes-button size="sm" variant="outline" (click)="chart.fitView()">Fit</andes-button>
            <andes-button size="sm" variant="outline" (click)="chart.zoomTo(1.5)">Zoom to 150%</andes-button>
            <andes-button size="sm" variant="outline" (click)="chart.resetView()">Reset</andes-button>
            <andes-button size="sm" variant="outline" (click)="chart.expandAllNodes()">Expand all</andes-button>
            <andes-button size="sm" variant="outline" (click)="chart.collapseAll()">Collapse all</andes-button>
            <andes-button size="sm" (click)="chart.scrollToNode('ml', { select: true })">Find Amara Nwosu</andes-button>
            <andes-button size="sm" variant="outline" (click)="exportChart(chart)">Export SVG</andes-button>
            <span style="${READOUT}">{{ exported() }}</span>
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
 * (`leafLayout="compact"`). "Expand everything" renders every card at once; the time shown runs
 * from the change to the next painted frame.
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
        <div style="display: grid; gap: 0.75rem;">
          <div style="display: flex; gap: 1.5rem; align-items: center; flex-wrap: wrap;">
            <andes-segmented aria-label="People" [options]="sizes" [value]="people()" (valueChange)="setSize($event)" />
            <andes-switch [checked]="everything()" (checkedChange)="setEverything(chart, $event)">Expand everything</andes-switch>
            <span style="${READOUT}">{{ elapsed() }}</span>
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
