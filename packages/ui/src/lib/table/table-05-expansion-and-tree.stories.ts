import { computed, signal } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import { lucideLoader } from '@ng-icons/lucide';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';

import {
  about,
  bar,
  FILES,
  makeOrders,
  money,
  muted,
  stack,
  strong,
  withDescription,
  withTableKit,
  type FileNode,
} from '../../testing/table-story-kit';
import { AndesTable } from './table';
import type { AndesTableRowKey } from './table-context';
import { andesFlattenTableTree, andesTreeIndex } from './table-tree';

/*
 * Rows that open: a detail row under a record, a table inside a row, and tree data whose child
 * rows are indented under their parent, with the toggles, the keys and the loading of children.
 */

const meta: Meta<AndesTable> = {
  title: 'Data Display/Table/Expansion and tree',
  component: AndesTable,
  tags: ['autodocs'],
  decorators: [
    withDescription,
    withTableKit,
    moduleMetadata({ providers: [provideIcons({ lucideLoader })] }),
  ],
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<AndesTable>;

const NOTES = [
  'Deliver to the loading dock, ask for Rosa.',
  'Paid in two instalments, the second is due next month.',
  'Customer asked for an invoice with the tax number.',
  'Fragile goods: keep upright and do not stack.',
  'Re-sent after the first delivery was refused.',
  'Corporate account, ten percent discount applied.',
];

/** Orders with a note for the detail row. */
const orders = (count: number) =>
  makeOrders(count).map((order, i) => ({
    ...order,
    note: NOTES[i % NOTES.length],
  }));

const HEAD_ORDERS = `
  <th andesTableHead>Invoice</th>
  <th andesTableHead>Customer</th>
  <th andesTableHead>Status</th>
  <th andesTableHead align="end">Total</th>`;

const CELLS_ORDERS = `
  <td andesTableCell>{{ order.id }}</td>
  <td andesTableCell>{{ order.customer }}</td>
  <td andesTableCell>{{ order.status }}</td>
  <td andesTableCell align="end">{{ money(order.total) }}</td>`;

interface Account {
  readonly key: string;
  readonly name: string;
  readonly balance: number;
  readonly children?: readonly Account[];
}

/** A small chart of accounts: three levels. */
const ACCOUNTS: readonly Account[] = [
  {
    key: 'assets',
    name: 'Assets',
    balance: 128400,
    children: [
      {
        key: 'cash',
        name: 'Cash and banks',
        balance: 54200,
        children: [
          { key: 'cash-a', name: 'Main account', balance: 41200 },
          { key: 'cash-b', name: 'Savings account', balance: 13000 },
        ],
      },
      { key: 'stock', name: 'Inventory', balance: 38600 },
      { key: 'recv', name: 'Receivables', balance: 35600 },
    ],
  },
  {
    key: 'liabilities',
    name: 'Liabilities',
    balance: 61900,
    children: [
      { key: 'loans', name: 'Bank loans', balance: 40000 },
      { key: 'pay', name: 'Payables', balance: 21900 },
    ],
  },
  { key: 'equity', name: 'Equity', balance: 66500 },
];

const ACCOUNT_ACCESSORS = {
  key: (account: Account) => account.key,
  children: (account: Account) => account.children,
};

/** The state every tree story needs: the open keys and the rows they leave visible. */
function treeState(initial: readonly AndesTableRowKey[] = []) {
  const expanded = signal<readonly AndesTableRowKey[]>(initial);
  const nodes = computed(() =>
    andesFlattenTableTree(ACCOUNTS, {
      ...ACCOUNT_ACCESSORS,
      expandedKeys: expanded(),
    }),
  );
  return { expanded, nodes, money };
}

/** The table of the tree stories. */
const accountTable = (attributes = '') => `
  <andes-table [(expandedKeys)]="expanded" ${attributes}>
    <thead andesTableHeader>
      <tr andesTableRow>
        <th andesTableHead>Account</th>
        <th andesTableHead align="end">Balance</th>
      </tr>
    </thead>
    <tbody andesTableBody>
      @for (node of nodes(); track node.key) {
        <tr andesTableRow [rowKey]="node.key" [level]="node.level">
          <td andesTableCell indent>
            <span style="display: inline-flex; align-items: center; gap: 0.5rem;">
              <andes-table-expand-toggle [spacer]="!node.hasChildren" [label]="'Sub-accounts of ' + node.row.name" />
              {{ node.row.name }}
            </span>
          </td>
          <td andesTableCell align="end">{{ money(node.row.balance) }}</td>
        </tr>
      }
    </tbody>
  </andes-table>`;

/** The width every story of the group keeps to. */
const WRAP = 'max-width: 44rem;';

/** Detail rows. */
export const ExpandableRows: Story = {
  name: 'Expandable rows',
  parameters: about(
    'A toggle in the first cell opens a detail row under its record, and the open rows are kept in the two-way expandedKeys.',
  ),
  render: () => ({
    props: {
      rows: orders(5),
      expanded: signal<readonly AndesTableRowKey[]>(['INV-002']),
      money,
    },
    template: `
      <div style="${WRAP}">
        <andes-table [(expandedKeys)]="expanded">
          <thead andesTableHeader>
            <tr andesTableRow>
              <th andesTableHead><span class="andes-table__sr-only">Details</span></th>
              ${HEAD_ORDERS}
            </tr>
          </thead>
          <tbody andesTableBody>
            @for (order of rows; track order.id) {
              <tr andesTableRow [rowKey]="order.id">
                <td andesTableCell><andes-table-expand-toggle [label]="'Notes for ' + order.id" /></td>
                ${CELLS_ORDERS}
              </tr>
              <tr *andesTableExpandedRow="order.id">
                <td andesTableCell></td>
                <td andesTableCell colspan="4"><span style="${muted}">{{ order.note }}</span></td>
              </tr>
            }
          </tbody>
        </andes-table>
        <p style="${muted} margin: 0.75rem 0 0;">Open rows: {{ expanded().join(', ') || 'none' }}</p>
      </div>`,
  }),
};

/** Rows that cannot open. */
export const NotExpandable: Story = {
  name: 'Not expandable rows',
  parameters: about(
    'A row without details gets an empty spacer of the toggle size, so its text lines up with the rows that can open.',
  ),
  render: () => ({
    props: {
      rows: orders(5),
      expanded: signal<readonly AndesTableRowKey[]>([]),
      money,
    },
    template: `
      <div style="${WRAP}">
        <andes-table [(expandedKeys)]="expanded">
          <thead andesTableHeader>
            <tr andesTableRow>
              <th andesTableHead><span class="andes-table__sr-only">Details</span></th>
              ${HEAD_ORDERS}
            </tr>
          </thead>
          <tbody andesTableBody>
            @for (order of rows; track order.id; let i = $index) {
              <tr andesTableRow [rowKey]="order.id">
                <td andesTableCell><andes-table-expand-toggle [spacer]="i % 2 === 1" [label]="'Notes for ' + order.id" /></td>
                ${CELLS_ORDERS}
              </tr>
              @if (i % 2 === 0) {
                <tr *andesTableExpandedRow="order.id">
                  <td andesTableCell></td>
                  <td andesTableCell colspan="4"><span style="${muted}">{{ order.note }}</span></td>
                </tr>
              }
            }
          </tbody>
        </andes-table>
      </div>`,
  }),
};

/** Expand all. */
export const ExpandAll: Story = {
  name: 'Expand all in the header',
  parameters: about(
    'A control in the header cell opens or closes every listed row at once, and its chevrons show which of the two it will do next.',
  ),
  render: () => {
    const rows = orders(5);
    return {
      props: {
        rows,
        keys: rows.map((row) => row.id),
        expanded: signal<readonly AndesTableRowKey[]>([]),
        money,
      },
      template: `
        <div style="${WRAP}">
          <andes-table [(expandedKeys)]="expanded">
            <thead andesTableHeader>
              <tr andesTableRow>
                <th andesTableHead><andes-table-expand-all [keys]="keys" /></th>
                ${HEAD_ORDERS}
              </tr>
            </thead>
            <tbody andesTableBody>
              @for (order of rows; track order.id) {
                <tr andesTableRow [rowKey]="order.id">
                  <td andesTableCell><andes-table-expand-toggle [label]="'Notes for ' + order.id" /></td>
                  ${CELLS_ORDERS}
                </tr>
                <tr *andesTableExpandedRow="order.id">
                  <td andesTableCell></td>
                  <td andesTableCell colspan="4"><span style="${muted}">{{ order.note }}</span></td>
                </tr>
              }
            </tbody>
          </andes-table>
        </div>`,
    };
  },
};

/** Toggle position. */
export const ExpandIconPosition: Story = {
  name: 'Expand icon position',
  parameters: about(
    'The toggle can sit in any cell: after the name, or in a last column of its own.',
  ),
  render: () => ({
    props: {
      rows: orders(4),
      afterName: signal<readonly AndesTableRowKey[]>([]),
      last: signal<readonly AndesTableRowKey[]>([]),
      money,
      stack,
    },
    template: `
      <div style="${stack} ${WRAP}">
        <andes-table [(expandedKeys)]="afterName">
          <thead andesTableHeader>
            <tr andesTableRow>
              <th andesTableHead>Customer</th>
              <th andesTableHead>Status</th>
              <th andesTableHead align="end">Total</th>
            </tr>
          </thead>
          <tbody andesTableBody>
            @for (order of rows; track order.id) {
              <tr andesTableRow [rowKey]="order.id">
                <td andesTableCell>
                  <span style="display: inline-flex; align-items: center; gap: 0.75rem;">
                    {{ order.customer }}
                    <andes-table-expand-toggle [label]="'Notes for ' + order.id" />
                  </span>
                </td>
                <td andesTableCell>{{ order.status }}</td>
                <td andesTableCell align="end">{{ money(order.total) }}</td>
              </tr>
              <tr *andesTableExpandedRow="order.id">
                <td andesTableCell colspan="3"><span style="${muted}">{{ order.note }}</span></td>
              </tr>
            }
          </tbody>
        </andes-table>
        <andes-table [(expandedKeys)]="last">
          <thead andesTableHeader>
            <tr andesTableRow>
              <th andesTableHead>Customer</th>
              <th andesTableHead>Status</th>
              <th andesTableHead align="end">Total</th>
              <th andesTableHead align="end"><span class="andes-table__sr-only">Details</span></th>
            </tr>
          </thead>
          <tbody andesTableBody>
            @for (order of rows; track order.id) {
              <tr andesTableRow [rowKey]="order.id">
                <td andesTableCell>{{ order.customer }}</td>
                <td andesTableCell>{{ order.status }}</td>
                <td andesTableCell align="end">{{ money(order.total) }}</td>
                <td andesTableCell align="end"><andes-table-expand-toggle [label]="'Notes for ' + order.id" /></td>
              </tr>
              <tr *andesTableExpandedRow="order.id">
                <td andesTableCell colspan="4"><span style="${muted}">{{ order.note }}</span></td>
              </tr>
            }
          </tbody>
        </andes-table>
      </div>`,
  }),
};

/** Custom icon. */
export const CustomExpandIcon: Story = {
  name: 'Custom expand icon',
  parameters: about(
    'Content projected into the toggle replaces the chevron, here a plus and a minus chosen from the toggle state.',
  ),
  render: () => ({
    props: {
      rows: orders(4),
      expanded: signal<readonly AndesTableRowKey[]>(['INV-001']),
      money,
    },
    template: `
      <div style="${WRAP}">
        <andes-table [(expandedKeys)]="expanded">
          <thead andesTableHeader>
            <tr andesTableRow>
              <th andesTableHead><span class="andes-table__sr-only">Details</span></th>
              ${HEAD_ORDERS}
            </tr>
          </thead>
          <tbody andesTableBody>
            @for (order of rows; track order.id) {
              <tr andesTableRow [rowKey]="order.id">
                <td andesTableCell>
                  <andes-table-expand-toggle #toggle="andesTableExpandToggle" [label]="'Notes for ' + order.id">
                    @if (toggle.expanded()) {
                      <ng-icon name="lucideMinus" />
                    } @else {
                      <ng-icon name="lucidePlus" />
                    }
                  </andes-table-expand-toggle>
                </td>
                ${CELLS_ORDERS}
              </tr>
              <tr *andesTableExpandedRow="order.id">
                <td andesTableCell></td>
                <td andesTableCell colspan="4"><span style="${muted}">{{ order.note }}</span></td>
              </tr>
            }
          </tbody>
        </andes-table>
      </div>`,
  }),
};

/** Row click. */
export const ExpandOnRowClick: Story = {
  name: 'Expand on row click',
  parameters: about(
    'With expandRowByClick a click anywhere on a row opens it, and a click on a control inside the row still does only its own job.',
  ),
  render: () => ({
    props: {
      rows: orders(5),
      expanded: signal<readonly AndesTableRowKey[]>([]),
      money,
    },
    template: `
      <div style="${WRAP}">
        <andes-table [(expandedKeys)]="expanded" expandRowByClick>
          <caption andesTableCaption>Click a row to read its note</caption>
          <thead andesTableHeader>
            <tr andesTableRow>
              <th andesTableHead><span class="andes-table__sr-only">Details</span></th>
              ${HEAD_ORDERS}
            </tr>
          </thead>
          <tbody andesTableBody>
            @for (order of rows; track order.id) {
              <tr andesTableRow [rowKey]="order.id">
                <td andesTableCell><andes-table-expand-toggle [label]="'Notes for ' + order.id" /></td>
                ${CELLS_ORDERS}
              </tr>
              <tr *andesTableExpandedRow="order.id">
                <td andesTableCell></td>
                <td andesTableCell colspan="4"><span style="${muted}">{{ order.note }}</span></td>
              </tr>
            }
          </tbody>
        </andes-table>
      </div>`,
  }),
};

/** Nested tables. */
export const NestedTables: Story = {
  name: 'Nested tables',
  parameters: about(
    'A detail row can hold a table of its own, which keeps its own sorting, selection and expansion apart from the outer one.',
  ),
  render: () => ({
    props: {
      rows: orders(3),
      expanded: signal<readonly AndesTableRowKey[]>(['INV-001']),
      lines: (id: string) =>
        Array.from({ length: 3 }, (_, i) => ({
          sku: `${id}-${i + 1}`,
          name: ['Alpaca scarf', 'Quinoa 1kg', 'Ceramic mug'][i],
          qty: i + 1,
          price: 12 + i * 7,
        })),
      money,
    },
    template: `
      <div style="${WRAP}">
        <andes-table [(expandedKeys)]="expanded">
          <thead andesTableHeader>
            <tr andesTableRow>
              <th andesTableHead><span class="andes-table__sr-only">Lines</span></th>
              ${HEAD_ORDERS}
            </tr>
          </thead>
          <tbody andesTableBody>
            @for (order of rows; track order.id) {
              <tr andesTableRow [rowKey]="order.id">
                <td andesTableCell><andes-table-expand-toggle [label]="'Lines of ' + order.id" /></td>
                ${CELLS_ORDERS}
              </tr>
              <tr *andesTableExpandedRow="order.id">
                <td andesTableCell></td>
                <td andesTableCell colspan="4">
                  <andes-table density="compact" [rowHover]="false">
                    <thead andesTableHeader>
                      <tr andesTableRow>
                        <th andesTableHead>Item</th>
                        <th andesTableHead align="end">Qty</th>
                        <th andesTableHead align="end">Price</th>
                      </tr>
                    </thead>
                    <tbody andesTableBody>
                      @for (line of lines(order.id); track line.sku) {
                        <tr andesTableRow>
                          <td andesTableCell>{{ line.name }}</td>
                          <td andesTableCell align="end">{{ line.qty }}</td>
                          <td andesTableCell align="end">{{ money(line.price) }}</td>
                        </tr>
                      }
                    </tbody>
                  </andes-table>
                </td>
              </tr>
            }
          </tbody>
        </andes-table>
      </div>`,
  }),
};

/** Tree data. */
export const TreeData: Story = {
  name: 'Tree data',
  parameters: about(
    'Hierarchical records are flattened into rows with a level, and the cell marked indent shifts its content by that level.',
  ),
  render: () => ({
    props: treeState(['assets']),
    template: `<div style="${WRAP}">${accountTable()}</div>`,
  }),
};

/** Indent size. */
export const TreeIndentSize: Story = {
  name: 'Tree indent size',
  parameters: about(
    'The indentSize input sets how far each level moves to the right, here 2rem instead of the default.',
  ),
  render: () => ({
    props: treeState(['assets', 'cash']),
    template: `<div style="${WRAP}">${accountTable('indentSize="2rem"')}</div>`,
  }),
};

/** Open by default. */
export const TreeExpandedByDefault: Story = {
  name: 'Tree expanded by default',
  parameters: about(
    'Starting the expandedKeys with every parent key opens the whole tree on the first render.',
  ),
  render: () => {
    const tree = andesTreeIndex(ACCOUNTS, ACCOUNT_ACCESSORS);
    return {
      props: treeState([...tree.childrenOf.keys()]),
      template: `<div style="${WRAP}">${accountTable()}</div>`,
    };
  },
};

interface Remote {
  readonly key: string;
  readonly name: string;
  readonly size: number;
  readonly lazy: boolean;
}

/** Async children. */
export const AsyncChildren: Story = {
  name: 'Async children loading',
  parameters: about(
    'The children of a folder are fetched the first time it opens, with a spinning loader row until they arrive.',
  ),
  render: () => {
    const roots: readonly Remote[] = [
      { key: 'reports', name: 'Reports', size: 0, lazy: true },
      { key: 'exports', name: 'Exports', size: 0, lazy: true },
      { key: 'readme', name: 'README.md', size: 4, lazy: false },
    ];
    const expanded = signal<readonly AndesTableRowKey[]>([]);
    const loaded = signal<Readonly<Record<string, readonly Remote[]>>>({});
    const loading = signal<readonly string[]>([]);
    const nodes = computed(() =>
      andesFlattenTableTree(roots, {
        key: (row) => row.key,
        children: (row) => loaded()[row.key],
        expandedKeys: expanded(),
      }),
    );
    return {
      props: {
        expanded,
        nodes,
        loading,
        loaded,
        onExpand: (event: { key: AndesTableRowKey; expanded: boolean }) => {
          const key = String(event.key);
          if (!event.expanded || loaded()[key] || loading().includes(key)) {
            return;
          }
          loading.set([...loading(), key]);
          setTimeout(() => {
            loaded.set({
              ...loaded(),
              [key]: Array.from({ length: 3 }, (_, i) => ({
                key: `${key}-${i + 1}`,
                name: `${key}-${i + 1}.csv`,
                size: 120 * (i + 1),
                lazy: false,
              })),
            });
            loading.set(loading().filter((item) => item !== key));
          }, 900);
        },
      },
      template: `
        <style>
          .story-loader { animation: story-spin 1s linear infinite; }
          @keyframes story-spin { to { transform: rotate(360deg); } }
          @media (prefers-reduced-motion: reduce) { .story-loader { animation-duration: 3s; } }
        </style>
        <div style="${WRAP}">
          <andes-table [(expandedKeys)]="expanded" (expandChange)="onExpand($event)">
            <thead andesTableHeader>
              <tr andesTableRow>
                <th andesTableHead>Name</th>
                <th andesTableHead align="end">Size (KB)</th>
              </tr>
            </thead>
            <tbody andesTableBody>
              @for (node of nodes(); track node.key) {
                <tr andesTableRow [rowKey]="node.key" [level]="node.level">
                  <td andesTableCell indent>
                    <span style="display: inline-flex; align-items: center; gap: 0.5rem;">
                      <andes-table-expand-toggle [spacer]="!node.hasChildren && !node.row.lazy" [label]="'Open ' + node.row.name" />
                      {{ node.row.name }}
                    </span>
                  </td>
                  <td andesTableCell align="end">{{ node.row.lazy ? '-' : node.row.size }}</td>
                </tr>
                @if (loading().includes(node.key + '')) {
                  <tr andesTableRow [level]="node.level + 1">
                    <td andesTableCell indent colspan="2">
                      <span style="display: inline-flex; align-items: center; gap: 0.5rem; ${muted}">
                        <ng-icon class="story-loader" name="lucideLoader" />
                        Loading
                      </span>
                    </td>
                  </tr>
                }
              }
            </tbody>
          </andes-table>
        </div>`,
    };
  },
};

interface Department {
  readonly id: string;
  readonly name: string;
  readonly people: number;
  readonly teams?: readonly Department[];
}

/** Children under another name. */
export const CustomChildren: Story = {
  name: 'Custom children column',
  parameters: about(
    'The records name their children as they like: the accessor handed to the flattening function reads them from any field.',
  ),
  render: () => {
    const data: readonly Department[] = [
      {
        id: 'eng',
        name: 'Engineering',
        people: 34,
        teams: [
          { id: 'web', name: 'Web', people: 12 },
          { id: 'api', name: 'Platform', people: 14 },
          { id: 'data', name: 'Data', people: 8 },
        ],
      },
      {
        id: 'ops',
        name: 'Operations',
        people: 18,
        teams: [
          { id: 'support', name: 'Support', people: 11 },
          { id: 'finance', name: 'Finance', people: 7 },
        ],
      },
      { id: 'legal', name: 'Legal', people: 4 },
    ];
    const expanded = signal<readonly AndesTableRowKey[]>(['eng']);
    const nodes = computed(() =>
      andesFlattenTableTree(data, {
        key: (row) => row.id,
        children: (row) => row.teams,
        expandedKeys: expanded(),
      }),
    );
    return {
      props: { expanded, nodes },
      template: `
        <div style="${WRAP}">
          <andes-table [(expandedKeys)]="expanded">
            <thead andesTableHeader>
              <tr andesTableRow>
                <th andesTableHead>Department</th>
                <th andesTableHead align="end">People</th>
              </tr>
            </thead>
            <tbody andesTableBody>
              @for (node of nodes(); track node.key) {
                <tr andesTableRow [rowKey]="node.key" [level]="node.level">
                  <td andesTableCell indent>
                    <span style="display: inline-flex; align-items: center; gap: 0.5rem;">
                      <andes-table-expand-toggle [spacer]="!node.hasChildren" [label]="'Teams of ' + node.row.name" />
                      {{ node.row.name }}
                    </span>
                  </td>
                  <td andesTableCell align="end">{{ node.row.people }}</td>
                </tr>
              }
            </tbody>
          </andes-table>
        </div>`,
    };
  },
};

/** Details panel. */
export const DetailsPanel: Story = {
  name: 'Expanded row with details panel',
  parameters: about(
    'The detail row can be a small panel with the record laid out as labels and values, tags and the actions that belong to it.',
  ),
  render: () => ({
    props: {
      rows: orders(4),
      expanded: signal<readonly AndesTableRowKey[]>(['INV-002']),
      money,
    },
    template: `
      <div style="${WRAP}">
        <andes-table [(expandedKeys)]="expanded">
          <thead andesTableHeader>
            <tr andesTableRow>
              <th andesTableHead><span class="andes-table__sr-only">Details</span></th>
              ${HEAD_ORDERS}
            </tr>
          </thead>
          <tbody andesTableBody>
            @for (order of rows; track order.id) {
              <tr andesTableRow [rowKey]="order.id">
                <td andesTableCell><andes-table-expand-toggle [label]="'Details of ' + order.id" /></td>
                ${CELLS_ORDERS}
              </tr>
              <tr *andesTableExpandedRow="order.id">
                <td andesTableCell></td>
                <td andesTableCell colspan="4">
                  <div style="display: grid; gap: 1rem; padding-block: 0.25rem;">
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr)); gap: 1rem;">
                      <div><div style="${muted}">Payment</div><div style="${strong}">{{ order.method }}</div></div>
                      <div><div style="${muted}">Items</div><div style="${strong}">{{ order.items }}</div></div>
                      <div><div style="${muted}">Date</div><div style="${strong}">{{ order.date }}</div></div>
                    </div>
                    <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
                      <andes-tag>wholesale</andes-tag>
                      <andes-tag color="info">tracked</andes-tag>
                    </div>
                    <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
                      <andes-button size="sm" variant="outline"><ng-icon slot="icon-start" name="lucideDownload" />Download</andes-button>
                      <andes-button size="sm" variant="ghost"><ng-icon slot="icon-start" name="lucideMail" />Send a copy</andes-button>
                    </div>
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </andes-table>
      </div>`,
  }),
};

/** Folders and files. */
export const FolderTree: Story = {
  name: 'Tree with folder and file icons',
  parameters: about(
    'Each tree row leads with a folder that opens and closes, or a file icon, and the chevron turns while its row is open.',
  ),
  render: () => {
    const expanded = signal<readonly AndesTableRowKey[]>(['docs', 'docs-c']);
    const nodes = computed(() =>
      andesFlattenTableTree(FILES, {
        key: (row: FileNode) => row.key,
        children: (row: FileNode) => row.children,
        expandedKeys: expanded(),
      }),
    );
    return {
      props: { expanded, nodes },
      template: `
        <div style="${WRAP}">
          <andes-table [(expandedKeys)]="expanded">
            <thead andesTableHeader>
              <tr andesTableRow>
                <th andesTableHead>Name</th>
                <th andesTableHead>Modified</th>
                <th andesTableHead align="end">Size (KB)</th>
              </tr>
            </thead>
            <tbody andesTableBody>
              @for (node of nodes(); track node.key) {
                <tr andesTableRow [rowKey]="node.key" [level]="node.level">
                  <td andesTableCell indent>
                    <span style="display: inline-flex; align-items: center; gap: 0.5rem;">
                      <andes-table-expand-toggle [spacer]="!node.hasChildren" [label]="'Open ' + node.row.name" />
                      @if (node.row.kind === 'folder') {
                        @if (node.expanded) {
                          <ng-icon name="lucideFolderOpen" />
                        } @else {
                          <ng-icon name="lucideFolder" />
                        }
                      } @else if (node.row.kind === 'image') {
                        <ng-icon name="lucideImage" />
                      } @else {
                        <ng-icon name="lucideFile" />
                      }
                      {{ node.row.name }}
                    </span>
                  </td>
                  <td andesTableCell><span style="${muted}">{{ node.row.modified }}</span></td>
                  <td andesTableCell align="end">{{ node.row.kind === 'folder' ? '-' : node.row.size }}</td>
                </tr>
              }
            </tbody>
          </andes-table>
        </div>`,
    };
  },
};

/** Controlled keys. */
export const ControlledExpansion: Story = {
  name: 'Controlled expanded keys',
  parameters: about(
    'Buttons outside the table write the expandedKeys themselves: open every parent, close them all, or open one level.',
  ),
  render: () => {
    const tree = andesTreeIndex(ACCOUNTS, ACCOUNT_ACCESSORS);
    const state = treeState([]);
    return {
      props: {
        ...state,
        bar,
        openAll: () => state.expanded.set([...tree.childrenOf.keys()]),
        closeAll: () => state.expanded.set([]),
        firstLevel: () =>
          state.expanded.set(
            ACCOUNTS.filter((a) => a.children).map((a) => a.key),
          ),
      },
      template: `
        <div style="${stack} ${WRAP}">
          <div style="${bar}">
            <andes-button size="sm" variant="outline" (click)="openAll()"><ng-icon slot="icon-start" name="lucideChevronsUpDown" />Expand all</andes-button>
            <andes-button size="sm" variant="outline" (click)="closeAll()"><ng-icon slot="icon-start" name="lucideChevronsDownUp" />Collapse all</andes-button>
            <andes-button size="sm" variant="ghost" (click)="firstLevel()">First level</andes-button>
          </div>
          ${accountTable()}
          <p style="${muted} margin: 0;">expandedKeys: {{ expanded().join(', ') || 'none' }}</p>
        </div>`,
    };
  },
};
