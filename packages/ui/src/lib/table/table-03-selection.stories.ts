import { computed, signal } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular';

import {
  about,
  bar,
  control,
  iconText,
  makeOrders,
  makeUsers,
  money,
  muted,
  stack,
  statusColor,
  strong,
  withDescription,
  withTableKit,
} from '../../testing/table-story-kit';
import { AndesTable } from './table';
import type { AndesTableRowKey } from './table-context';
import type { AndesTableSelectionItem } from './table-selection';
import {
  andesFlattenTableTree,
  andesTreeIndex,
  type AndesTreeAccessors,
} from './table-tree';

/*
 * Choosing rows: checkboxes and radios, rows that cannot be chosen, the select-all control and
 * its menu, a selection that follows the user across pages, rows that cascade in a tree, and the
 * bars that tell how many rows are chosen.
 */

const meta: Meta<AndesTable> = {
  title: 'Data Display/Table/Selection',
  component: AndesTable,
  tags: ['autodocs'],
  decorators: [withDescription, withTableKit],
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<AndesTable>;

const USERS = makeUsers(23);

/** The header and the body of a selectable table of orders, shared by the simple stories. */
const ORDER_COLUMNS = `
  <th andesTableHead>Invoice</th>
  <th andesTableHead>Customer</th>
  <th andesTableHead>Status</th>
  <th andesTableHead align="end">Total</th>`;

const orderRow = (extra = '') => `
  <td andesTableCell>{{ order.id }}</td>
  <td andesTableCell>{{ order.customer }}</td>
  <td andesTableCell><andes-tag [color]="color(order.status)">{{ order.status }}</andes-tag></td>
  <td andesTableCell align="end">{{ money(order.total) }}</td>${extra}`;

interface Account {
  readonly key: string;
  readonly name: string;
  readonly balance: number;
  readonly children?: readonly Account[];
}

const ACCOUNTS: readonly Account[] = [
  {
    key: 'assets',
    name: 'Assets',
    balance: 52000,
    children: [
      { key: 'cash', name: 'Cash', balance: 12000 },
      { key: 'bank', name: 'Bank accounts', balance: 30000 },
      {
        key: 'stock',
        name: 'Stock',
        balance: 10000,
        children: [
          { key: 'stock-a', name: 'Raw goods', balance: 6000 },
          { key: 'stock-b', name: 'Finished goods', balance: 4000 },
        ],
      },
    ],
  },
  {
    key: 'debts',
    name: 'Debts',
    balance: 18000,
    children: [
      { key: 'loans', name: 'Loans', balance: 15000 },
      { key: 'taxes', name: 'Taxes', balance: 3000 },
    ],
  },
  { key: 'equity', name: 'Equity', balance: 34000 },
];

const ACCOUNT_TREE: AndesTreeAccessors<Account> = {
  key: (account) => account.key,
  children: (account) => account.children,
};

/** A tree table that selects with or without cascading, depending on `cascade`. */
function treeDemo(cascade: boolean) {
  const tree = andesTreeIndex(ACCOUNTS, ACCOUNT_TREE);
  const selected = signal<readonly AndesTableRowKey[]>([]);
  const expanded = signal<readonly AndesTableRowKey[]>([
    'assets',
    'stock',
    'debts',
  ]);
  const nodes = computed(() =>
    andesFlattenTableTree(ACCOUNTS, {
      ...ACCOUNT_TREE,
      expandedKeys: expanded(),
    }),
  );
  return {
    props: {
      selected,
      expanded,
      nodes,
      money,
      muted,
      tree: cascade ? tree : null,
    },
    template: `
      <div style="${stack} max-width: 40rem;">
        <andes-table [selectionTree]="tree" [(selectedKeys)]="selected" [(expandedKeys)]="expanded">
          <thead andesTableHeader>
            <tr andesTableRow>
              <th andesTableHead><andes-table-select-all /></th>
              <th andesTableHead>Account</th>
              <th andesTableHead align="end">Balance</th>
            </tr>
          </thead>
          <tbody andesTableBody>
            @for (node of nodes(); track node.key) {
              <tr andesTableRow [rowKey]="node.key" [level]="node.level">
                <td andesTableCell><andes-table-selection [label]="'Select ' + node.row.name" /></td>
                <td andesTableCell indent>
                  <span [style]="'display: inline-flex; align-items: center; gap: 0.5rem;'">
                    <andes-table-expand-toggle [spacer]="!node.hasChildren" [label]="'Sub-accounts of ' + node.row.name" />
                    {{ node.row.name }}
                  </span>
                </td>
                <td andesTableCell align="end">{{ money(node.row.balance) }}</td>
              </tr>
            }
          </tbody>
        </andes-table>
        <span [style]="muted">Selected: {{ selected().join(', ') || 'none' }}</span>
      </div>`,
  };
}

/** Checkbox. */
export const Checkbox: Story = {
  name: 'Checkbox selection',
  parameters: about(
    'A selection column holds a checkbox in every row and a select-all checkbox in the header; the chosen row keys land in a two-way model.',
  ),
  render: () => ({
    props: {
      orders: makeOrders(5),
      selected: signal<readonly AndesTableRowKey[]>(['INV-002']),
      money,
      color: statusColor,
      muted,
    },
    template: `
      <div style="${stack} max-width: 44rem;">
        <andes-table [(selectedKeys)]="selected">
          <thead andesTableHeader>
            <tr andesTableRow>
              <th andesTableHead><andes-table-select-all /></th>
              ${ORDER_COLUMNS}
            </tr>
          </thead>
          <tbody andesTableBody>
            @for (order of orders; track order.id) {
              <tr andesTableRow [rowKey]="order.id">
                <td andesTableCell><andes-table-selection [label]="'Select ' + order.id" /></td>
                ${orderRow()}
              </tr>
            }
          </tbody>
        </andes-table>
        <span [style]="muted">Selected keys: {{ selected().join(', ') || 'none' }}</span>
      </div>`,
  }),
};

/** Radio. */
export const Radio: Story = {
  name: 'Radio selection',
  parameters: about(
    'With the radio type only one row can be chosen, so the header has no select-all and only keeps a hidden name for the column.',
  ),
  render: () => ({
    props: {
      orders: makeOrders(5),
      selected: signal<readonly AndesTableRowKey[]>(['INV-003']),
      money,
      color: statusColor,
      muted,
    },
    template: `
      <div style="${stack} max-width: 44rem;">
        <andes-table selectionType="radio" [(selectedKeys)]="selected">
          <thead andesTableHeader>
            <tr andesTableRow>
              <th andesTableHead><andes-table-select-all label="Choose one invoice" /></th>
              ${ORDER_COLUMNS}
            </tr>
          </thead>
          <tbody andesTableBody>
            @for (order of orders; track order.id) {
              <tr andesTableRow [rowKey]="order.id">
                <td andesTableCell><andes-table-selection [label]="'Choose ' + order.id" /></td>
                ${orderRow()}
              </tr>
            }
          </tbody>
        </andes-table>
        <span [style]="muted">Chosen: {{ selected()[0] ?? 'none' }}</span>
      </div>`,
  }),
};

/** Disabled rows. */
export const DisabledRows: Story = {
  name: 'Disabled rows',
  parameters: about(
    'A row whose control is disabled cannot be chosen, and select-all skips it, so refunded invoices stay out of any bulk choice.',
  ),
  render: () => ({
    props: {
      orders: makeOrders(6),
      selected: signal<readonly AndesTableRowKey[]>([]),
      money,
      color: statusColor,
      muted,
    },
    template: `
      <div style="${stack} max-width: 44rem;">
        <andes-table [(selectedKeys)]="selected">
          <thead andesTableHeader>
            <tr andesTableRow>
              <th andesTableHead><andes-table-select-all /></th>
              ${ORDER_COLUMNS}
            </tr>
          </thead>
          <tbody andesTableBody>
            @for (order of orders; track order.id) {
              <tr andesTableRow [rowKey]="order.id">
                <td andesTableCell><andes-table-selection [label]="'Select ' + order.id" [disabled]="order.status === 'Refunded'" /></td>
                ${orderRow()}
              </tr>
            }
          </tbody>
        </andes-table>
        <span [style]="muted">Selected: {{ selected().join(', ') || 'none' }}</span>
      </div>`,
  }),
};

/** Select all and clear. */
export const SelectAllAndClear: Story = {
  name: 'Select all and clear',
  parameters: about(
    'The table can select every row, invert the choice or clear it from outside, with the same calls the header control uses.',
  ),
  render: () => ({
    props: {
      orders: makeOrders(5),
      selected: signal<readonly AndesTableRowKey[]>([]),
      money,
      color: statusColor,
      bar,
    },
    template: `
      <div style="${stack} max-width: 44rem;">
        <div [style]="bar">
          <andes-button variant="outline" size="sm" (click)="table.selectAll()">Select all</andes-button>
          <andes-button variant="outline" size="sm" (click)="table.invertSelection()">Invert</andes-button>
          <andes-button variant="ghost" size="sm" (click)="table.clearSelection()">Clear</andes-button>
        </div>
        <andes-table #table [(selectedKeys)]="selected">
          <thead andesTableHeader>
            <tr andesTableRow>
              <th andesTableHead><andes-table-select-all /></th>
              ${ORDER_COLUMNS}
            </tr>
          </thead>
          <tbody andesTableBody>
            @for (order of orders; track order.id) {
              <tr andesTableRow [rowKey]="order.id">
                <td andesTableCell><andes-table-selection [label]="'Select ' + order.id" /></td>
                ${orderRow()}
              </tr>
            }
          </tbody>
        </andes-table>
      </div>`,
  }),
};

/** Selection and operation. */
export const SelectionAndOperation: Story = {
  name: 'Selection and operation',
  parameters: about(
    'A controlled selection drives a toolbar: the reload button is on while rows are chosen and the text counts them.',
  ),
  render: () => {
    const selected = signal<readonly AndesTableRowKey[]>([
      'INV-001',
      'INV-003',
      'INV-004',
    ]);
    const loading = signal(false);
    return {
      props: {
        orders: makeOrders(6),
        selected,
        loading,
        money,
        color: statusColor,
        reload: () => {
          loading.set(true);
          setTimeout(() => {
            selected.set([]);
            loading.set(false);
          }, 800);
        },
        bar,
        muted,
      },
      template: `
        <div style="${stack} max-width: 44rem;">
          <div [style]="bar">
            <andes-button size="sm" [disabled]="selected().length === 0" [loading]="loading()" (click)="reload()">
              <ng-icon slot="icon-start" name="lucideRefreshCw" />
              Reload
            </andes-button>
            <span [style]="muted">{{ selected().length ? 'Selected ' + selected().length + ' items' : '' }}</span>
          </div>
          <andes-table [(selectedKeys)]="selected" [loading]="loading()">
            <thead andesTableHeader>
              <tr andesTableRow>
                <th andesTableHead><andes-table-select-all /></th>
                ${ORDER_COLUMNS}
              </tr>
            </thead>
            <tbody andesTableBody>
              @for (order of orders; track order.id) {
                <tr andesTableRow [rowKey]="order.id">
                  <td andesTableCell><andes-table-selection [label]="'Select ' + order.id" /></td>
                  ${orderRow()}
                </tr>
              }
            </tbody>
          </andes-table>
        </div>`,
    };
  },
};

/** Custom selection menu. */
export const CustomSelectionMenu: Story = {
  name: 'Custom selection menu',
  parameters: about(
    'The select-all control can open a menu of choices: the built-in select, invert and clear, plus your own such as odd rows, even rows or paid invoices.',
  ),
  render: () => {
    const orders = makeOrders(8);
    const selected = signal<readonly AndesTableRowKey[]>([]);
    const selections: (string | AndesTableSelectionItem)[] = [
      'all',
      'invert',
      'none',
      {
        key: 'odd',
        text: 'Select odd rows',
        select: (keys) => selected.set(keys.filter((_, i) => i % 2 === 0)),
      },
      {
        key: 'even',
        text: 'Select even rows',
        select: (keys) => selected.set(keys.filter((_, i) => i % 2 === 1)),
      },
      {
        key: 'paid',
        text: 'Select paid invoices',
        select: (keys) =>
          selected.set(
            keys.filter(
              (key) => orders.find((o) => o.id === key)?.status === 'Paid',
            ),
          ),
      },
    ];
    return {
      props: { orders, selected, selections, money, color: statusColor, muted },
      template: `
        <div style="${stack} max-width: 44rem;">
          <andes-table [(selectedKeys)]="selected">
            <thead andesTableHeader>
              <tr andesTableRow>
                <th andesTableHead><andes-table-select-all [selections]="selections" /></th>
                ${ORDER_COLUMNS}
              </tr>
            </thead>
            <tbody andesTableBody>
              @for (order of orders; track order.id) {
                <tr andesTableRow [rowKey]="order.id">
                  <td andesTableCell><andes-table-selection [label]="'Select ' + order.id" /></td>
                  ${orderRow()}
                </tr>
              }
            </tbody>
          </andes-table>
          <span [style]="muted">{{ selected().length }} selected</span>
        </div>`,
    };
  },
};

/** Across pages. */
export const KeepSelectionAcrossPages: Story = {
  name: 'Keep selection across pages',
  parameters: about(
    'The chosen keys of rows that are not on the page stay chosen, so a selection can grow while the user pages through the data.',
  ),
  render: () => {
    const page = signal(1);
    const selected = signal<readonly AndesTableRowKey[]>([]);
    const pageSize = 5;
    const pages = Math.ceil(USERS.length / pageSize);
    return {
      props: {
        page,
        selected,
        pages,
        pageSize,
        total: USERS.length,
        rows: computed(() =>
          USERS.slice((page() - 1) * pageSize, page() * pageSize),
        ),
        bar,
        muted,
      },
      template: `
        <div style="${stack} max-width: 44rem;">
          <andes-table [(selectedKeys)]="selected">
            <thead andesTableHeader>
              <tr andesTableRow>
                <th andesTableHead><andes-table-select-all /></th>
                <th andesTableHead>Name</th>
                <th andesTableHead>Role</th>
                <th andesTableHead>City</th>
              </tr>
            </thead>
            <tbody andesTableBody>
              @for (row of rows(); track row.id) {
                <tr andesTableRow [rowKey]="row.id">
                  <td andesTableCell><andes-table-selection [label]="'Select ' + row.name" /></td>
                  <td andesTableCell>{{ row.name }}</td>
                  <td andesTableCell>{{ row.role }}</td>
                  <td andesTableCell>{{ row.city }}</td>
                </tr>
              }
            </tbody>
          </andes-table>
          <div [style]="bar">
            <andes-pagination layout="table" size="small" [showSizeChanger]="false" [current]="page()" (currentChange)="page.set($event)" [pageSize]="pageSize" [total]="total" />
            <span [style]="muted">{{ selected().length }} selected over every page</span>
          </div>
        </div>`,
    };
  },
};

/** Select all across the data. */
export const SelectAllAcrossData: Story = {
  name: 'Select all across the data',
  parameters: about(
    'Hand the table the keys of all the data as the selectable keys and select-all chooses every row, not only the ones on the page.',
  ),
  render: () => {
    const page = signal(1);
    const selected = signal<readonly AndesTableRowKey[]>([]);
    const pageSize = 5;
    const pages = Math.ceil(USERS.length / pageSize);
    return {
      props: {
        page,
        selected,
        pages,
        pageSize,
        allKeys: USERS.map((user) => user.id),
        total: USERS.length,
        rows: computed(() =>
          USERS.slice((page() - 1) * pageSize, page() * pageSize),
        ),
        bar,
        muted,
      },
      template: `
        <div style="${stack} max-width: 44rem;">
          <andes-table [(selectedKeys)]="selected" [selectableKeys]="allKeys">
            <thead andesTableHeader>
              <tr andesTableRow>
                <th andesTableHead><andes-table-select-all [selections]="['all', 'none']" [selectionLabels]="{ all: 'Select all data', invert: 'Invert', none: 'Clear selection' }" /></th>
                <th andesTableHead>Name</th>
                <th andesTableHead>Role</th>
                <th andesTableHead>City</th>
              </tr>
            </thead>
            <tbody andesTableBody>
              @for (row of rows(); track row.id) {
                <tr andesTableRow [rowKey]="row.id">
                  <td andesTableCell><andes-table-selection [label]="'Select ' + row.name" /></td>
                  <td andesTableCell>{{ row.name }}</td>
                  <td andesTableCell>{{ row.role }}</td>
                  <td andesTableCell>{{ row.city }}</td>
                </tr>
              }
            </tbody>
          </andes-table>
          <div [style]="bar">
<andes-pagination layout="table" size="small" [showSizeChanger]="false" [current]="page()" (currentChange)="page.set($event)" [pageSize]="pageSize" [total]="total" />
            <span [style]="muted">{{ selected().length }} of {{ total }} selected</span>
          </div>
        </div>`,
    };
  },
};

/** Tree, cascading. */
export const TreeCascade: Story = {
  name: 'Tree selection that cascades',
  parameters: about(
    'Give the table the index of a tree and choosing a parent chooses all its children, while a parent with only some of them shows the indeterminate mark.',
  ),
  render: () => treeDemo(true),
};

/** Tree, strict. */
export const TreeStrict: Story = {
  name: 'Tree selection without cascade',
  parameters: about(
    'Without the tree index every row is chosen on its own, so a parent and its children never affect one another.',
  ),
  render: () => treeDemo(false),
};

/** Row click. */
export const RowClickSelection: Story = {
  name: 'Row click selection',
  parameters: about(
    'A click or the Enter key anywhere on a row chooses it, and a check icon marks the chosen rows for those who cannot see the tint.',
  ),
  render: () => {
    const selected = signal<readonly AndesTableRowKey[]>([]);
    return {
      props: {
        orders: makeOrders(5),
        selected,
        money,
        color: statusColor,
        muted,
        toggle: (key: string) =>
          selected.set(
            selected().includes(key)
              ? selected().filter((k) => k !== key)
              : [...selected(), key],
          ),
      },
      template: `
        <div style="${stack} max-width: 44rem;">
          <andes-table [(selectedKeys)]="selected">
            <thead andesTableHeader>
              <tr andesTableRow>
                <th andesTableHead width="48"><span class="andes-table__sr-only">Chosen</span></th>
                ${ORDER_COLUMNS}
              </tr>
            </thead>
            <tbody andesTableBody>
              @for (order of orders; track order.id) {
                <tr andesTableRow [rowKey]="order.id" tabindex="0" style="cursor: pointer;" [attr.aria-selected]="selected().includes(order.id)" (click)="toggle(order.id)" (keydown.enter)="toggle(order.id)">
                  <td andesTableCell>
                    @if (selected().includes(order.id)) {
                      <ng-icon name="lucideCheck" />
                    }
                  </td>
                  ${orderRow()}
                </tr>
              }
            </tbody>
          </andes-table>
          <span [style]="muted">Click a row, or focus it and press Enter.</span>
        </div>`,
    };
  },
};

/** Column order. */
export const SelectionColumnOrder: Story = {
  name: 'Selection column order',
  parameters: about(
    'The selection column goes wherever its cells are written: first, last, or after the expand toggle.',
  ),
  render: () => ({
    props: {
      orders: makeOrders(3),
      money,
      color: statusColor,
      strong,
      expanded: signal<readonly AndesTableRowKey[]>([]),
      selected: signal<readonly AndesTableRowKey[]>([]),
    },
    template: `
      <div style="${stack} max-width: 44rem;">
        <p [style]="strong" style="margin: 0;">First</p>
        <andes-table [(selectedKeys)]="selected">
          <thead andesTableHeader>
            <tr andesTableRow>
              <th andesTableHead><andes-table-select-all /></th>
              ${ORDER_COLUMNS}
            </tr>
          </thead>
          <tbody andesTableBody>
            @for (order of orders; track order.id) {
              <tr andesTableRow [rowKey]="order.id">
                <td andesTableCell><andes-table-selection [label]="'Select ' + order.id" /></td>
                ${orderRow()}
              </tr>
            }
          </tbody>
        </andes-table>
        <p [style]="strong" style="margin: 0;">Last</p>
        <andes-table [(selectedKeys)]="selected">
          <thead andesTableHeader>
            <tr andesTableRow>
              ${ORDER_COLUMNS}
              <th andesTableHead align="end"><andes-table-select-all /></th>
            </tr>
          </thead>
          <tbody andesTableBody>
            @for (order of orders; track order.id) {
              <tr andesTableRow [rowKey]="order.id">
                ${orderRow(`<td andesTableCell align="end"><andes-table-selection [label]="'Select ' + order.id" /></td>`)}
              </tr>
            }
          </tbody>
        </andes-table>
        <p [style]="strong" style="margin: 0;">After the expand toggle</p>
        <andes-table [(selectedKeys)]="selected" [(expandedKeys)]="expanded">
          <thead andesTableHeader>
            <tr andesTableRow>
              <th andesTableHead><span class="andes-table__sr-only">Details</span></th>
              <th andesTableHead><andes-table-select-all /></th>
              ${ORDER_COLUMNS}
            </tr>
          </thead>
          <tbody andesTableBody>
            @for (order of orders; track order.id) {
              <tr andesTableRow [rowKey]="order.id">
                <td andesTableCell><andes-table-expand-toggle [label]="'Details of ' + order.id" /></td>
                <td andesTableCell><andes-table-selection [label]="'Select ' + order.id" /></td>
                ${orderRow()}
              </tr>
              <tr *andesTableExpandedRow="order.id">
                <td andesTableCell colspan="6">{{ order.items }} items paid by {{ order.method }} on {{ order.date }}.</td>
              </tr>
            }
          </tbody>
        </andes-table>
      </div>`,
  }),
};

/** Shift click. */
export const ShiftClickRange: Story = {
  name: 'Shift click range',
  parameters: about(
    'Click one checkbox, then click another while holding Shift, and every row between the two is chosen.',
  ),
  render: () => ({
    props: {
      rows: USERS.slice(0, 8),
      selected: signal<readonly AndesTableRowKey[]>([]),
      muted,
    },
    template: `
      <div style="${stack} max-width: 44rem;">
        <andes-table [(selectedKeys)]="selected">
          <thead andesTableHeader>
            <tr andesTableRow>
              <th andesTableHead><andes-table-select-all /></th>
              <th andesTableHead>Name</th>
              <th andesTableHead>Role</th>
              <th andesTableHead>City</th>
            </tr>
          </thead>
          <tbody andesTableBody>
            @for (row of rows; track row.id) {
              <tr andesTableRow [rowKey]="row.id">
                <td andesTableCell><andes-table-selection [label]="'Select ' + row.name" /></td>
                <td andesTableCell>{{ row.name }}</td>
                <td andesTableCell>{{ row.role }}</td>
                <td andesTableCell>{{ row.city }}</td>
              </tr>
            }
          </tbody>
        </andes-table>
        <span [style]="muted">{{ selected().length }} selected - hold Shift while clicking to choose a range.</span>
      </div>`,
  }),
};

/** Selected highlight. */
export const SelectedHighlight: Story = {
  name: 'Selected row highlight',
  parameters: about(
    'A chosen row takes a light tint of the primary colour, and it stays readable on the hover and in the dark theme.',
  ),
  render: () => ({
    props: {
      orders: makeOrders(5),
      selected: signal<readonly AndesTableRowKey[]>(['INV-002', 'INV-004']),
      money,
      color: statusColor,
    },
    template: `
      <andes-table [(selectedKeys)]="selected" style="max-width: 44rem;">
        <thead andesTableHeader>
          <tr andesTableRow>
            <th andesTableHead><andes-table-select-all /></th>
            ${ORDER_COLUMNS}
          </tr>
        </thead>
        <tbody andesTableBody>
          @for (order of orders; track order.id) {
            <tr andesTableRow [rowKey]="order.id">
              <td andesTableCell><andes-table-selection [label]="'Select ' + order.id" /></td>
              ${orderRow()}
            </tr>
          }
        </tbody>
      </andes-table>`,
  }),
};

/** Selected count bar. */
export const SelectedCountBar: Story = {
  name: 'Selected count bar',
  parameters: about(
    'A bar above the table counts the chosen rows and offers the actions that apply to them, with a clear button that empties the choice.',
  ),
  render: () => ({
    props: {
      rows: USERS.slice(0, 6),
      selected: signal<readonly AndesTableRowKey[]>([1, 2]),
      muted,
      strong,
      iconText,
    },
    template: `
      <andes-table [(selectedKeys)]="selected" style="max-width: 44rem;">
        <div andesTableTop class="andes-table__toolbar">
          @if (selected().length) {
            <span [style]="strong">{{ selected().length }} of {{ rows.length }} rows selected</span>
            <span [style]="iconText">
              <andes-button variant="outline" size="sm"><ng-icon slot="icon-start" name="lucideMail" />Email</andes-button>
              <andes-button variant="outline" size="sm"><ng-icon slot="icon-start" name="lucideTrash2" />Delete</andes-button>
              <andes-button variant="ghost" size="sm" (click)="selected.set([])"><ng-icon slot="icon-start" name="lucideX" />Clear</andes-button>
            </span>
          } @else {
            <span [style]="muted">Select rows to act on them</span>
          }
        </div>
        <thead andesTableHeader>
          <tr andesTableRow>
            <th andesTableHead><andes-table-select-all /></th>
            <th andesTableHead>Name</th>
            <th andesTableHead>Role</th>
            <th andesTableHead>City</th>
          </tr>
        </thead>
        <tbody andesTableBody>
          @for (row of rows; track row.id) {
            <tr andesTableRow [rowKey]="row.id">
              <td andesTableCell><andes-table-selection [label]="'Select ' + row.name" /></td>
              <td andesTableCell>{{ row.name }}</td>
              <td andesTableCell>{{ row.role }}</td>
              <td andesTableCell>{{ row.city }}</td>
            </tr>
          }
        </tbody>
      </andes-table>`,
  }),
};

/** Indeterminate. */
export const IndeterminateSelectAll: Story = {
  name: 'Indeterminate select-all',
  parameters: about(
    'The select-all checkbox is checked when every row is chosen, shows a minus when only some are, and is empty when none is; the text below follows it.',
  ),
  render: () => ({
    props: {
      rows: USERS.slice(0, 4),
      selected: signal<readonly AndesTableRowKey[]>([1]),
      muted,
      control,
    },
    template: `
      <div style="${stack} max-width: 40rem;">
        <andes-table #table [(selectedKeys)]="selected">
          <thead andesTableHeader>
            <tr andesTableRow>
              <th andesTableHead><andes-table-select-all /></th>
              <th andesTableHead>Name</th>
              <th andesTableHead>Role</th>
            </tr>
          </thead>
          <tbody andesTableBody>
            @for (row of rows; track row.id) {
              <tr andesTableRow [rowKey]="row.id">
                <td andesTableCell><andes-table-selection [label]="'Select ' + row.name" /></td>
                <td andesTableCell>{{ row.name }}</td>
                <td andesTableCell>{{ row.role }}</td>
              </tr>
            }
          </tbody>
        </andes-table>
        <span [style]="muted">State of the header checkbox: {{ table.selectAllState() }}</span>
      </div>`,
  }),
};

/** Selection limit. */
export const SelectionLimit: Story = {
  name: 'Selection limit',
  parameters: about(
    'Once three rows are chosen the others are disabled, so the choice can never grow past the limit.',
  ),
  render: () => ({
    props: {
      rows: USERS.slice(0, 7),
      selected: signal<readonly AndesTableRowKey[]>([]),
      muted,
    },
    template: `
      <div style="${stack} max-width: 40rem;">
        <andes-table [(selectedKeys)]="selected">
          <thead andesTableHeader>
            <tr andesTableRow>
              <th andesTableHead><span class="andes-table__sr-only">Select</span></th>
              <th andesTableHead>Name</th>
              <th andesTableHead>Role</th>
            </tr>
          </thead>
          <tbody andesTableBody>
            @for (row of rows; track row.id) {
              <tr andesTableRow [rowKey]="row.id">
                <td andesTableCell><andes-table-selection [label]="'Select ' + row.name" [disabled]="selected().length >= 3 && !selected().includes(row.id)" /></td>
                <td andesTableCell>{{ row.name }}</td>
                <td andesTableCell>{{ row.role }}</td>
              </tr>
            }
          </tbody>
        </andes-table>
        <span [style]="muted">{{ selected().length }} of 3 chosen</span>
      </div>`,
  }),
};
