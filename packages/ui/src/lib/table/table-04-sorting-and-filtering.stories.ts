import { computed, signal } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular';

import {
  about,
  bar,
  control,
  type FileNode,
  FILES,
  makeOrders,
  makeUsers,
  mockFetch,
  money,
  muted,
  type Order,
  type RemoteResult,
  stack,
  statusColor,
  strong,
  type User,
  withDescription,
  withTableKit,
} from '../../testing/table-story-kit';
import { AndesTable, type AndesTableChange } from './table';
import type { AndesTableRowKey } from './table-context';
import {
  andesDateRangeFilter,
  andesFilterRows,
  andesOptionFilter,
  andesRangeFilter,
  andesTextFilter,
  type AndesFilterValue,
  type AndesTableFilters,
} from './table-data';
import type { AndesTableFilterOption } from './table-filter';
import {
  andesSortRows,
  type AndesSortAccessors,
  type AndesSortState,
} from './table-sort';
import { andesFlattenTableTree } from './table-tree';

/*
 * Ordering and narrowing the rows: sorting by one or several columns, every kind of column
 * filter (a menu, a tree, a text, a range, a date range, a custom panel), filters and sorts that
 * the page controls, and data that a server sorts, filters and pages.
 */

const meta: Meta<AndesTable> = {
  title: 'Data Display/Table/Sorting and filtering',
  component: AndesTable,
  tags: ['autodocs'],
  decorators: [withDescription, withTableKit],
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<AndesTable>;

const ORDERS = makeOrders(12);

const ORDER_ACCESSORS: AndesSortAccessors<Order> = {
  id: (order) => order.id,
  customer: (order) => order.customer,
  status: (order) => order.status,
  items: (order) => order.items,
  total: (order) => order.total,
  date: (order) => order.date,
};

const USER_ACCESSORS: AndesSortAccessors<User> = {
  name: (user) => user.name,
  role: (user) => user.role,
  city: (user) => user.city,
  age: (user) => user.age,
  score: (user) => user.score,
};

const STATUS_OPTIONS: readonly AndesTableFilterOption[] = [
  { text: 'Paid', value: 'Paid' },
  { text: 'Pending', value: 'Pending' },
  { text: 'Overdue', value: 'Overdue' },
  { text: 'Refunded', value: 'Refunded' },
];

const hasStatus = andesOptionFilter<Order>((order) => order.status);
const hasMethod = andesOptionFilter<Order>((order) => order.method);

/** The sortable heads of an order table. */
const ORDER_HEADS = `
  <th andesTableHead sortKey="id">Invoice</th>
  <th andesTableHead sortKey="customer">Customer</th>
  <th andesTableHead sortKey="status">Status</th>
  <th andesTableHead sortKey="total" align="end">Total</th>`;

const ORDER_CELLS = `
  <td andesTableCell>{{ order.id }}</td>
  <td andesTableCell>{{ order.customer }}</td>
  <td andesTableCell><andes-tag [color]="color(order.status)">{{ order.status }}</andes-tag></td>
  <td andesTableCell align="end">{{ money(order.total) }}</td>`;

const EMPTY_ROW = (columns: number, text = 'No invoices match') => `
  @empty {
    <tr andesTableRow>
      <td andesTableCell colspan="${columns}"><andes-table-empty>${text}</andes-table-empty></td>
    </tr>
  }`;

/** A table of orders sorted by the page, with the sort in a signal. */
function sortedOrders(
  sort: ReturnType<typeof signal<AndesSortState | null>>,
  rows: readonly Order[] = ORDERS.slice(0, 8),
) {
  return computed(() => andesSortRows(rows, sort(), ORDER_ACCESSORS));
}

/** Sorting basics. */
export const SortingBasics: Story = {
  name: 'Sorting basics',
  parameters: about(
    'A header with a sort key sorts its column when it is pressed, from the mouse or the keyboard, and the arrow beside the title shows the direction.',
  ),
  render: () => {
    const sort = signal<AndesSortState | null>(null);
    return {
      props: { sort, rows: sortedOrders(sort), money, color: statusColor },
      template: `
        <andes-table [(sort)]="sort" style="max-width: 44rem;">
          <thead andesTableHeader>
            <tr andesTableRow>${ORDER_HEADS}</tr>
          </thead>
          <tbody andesTableBody>
            @for (order of rows(); track order.id) {
              <tr andesTableRow>${ORDER_CELLS}</tr>
            }
          </tbody>
        </andes-table>`,
    };
  },
};

/** Custom compare. */
export const CustomCompare: Story = {
  name: 'Custom compare function',
  parameters: about(
    'When the order of a column is not the order of its values, hand the sort a compare function: here statuses go by how urgent they are.',
  ),
  render: () => {
    const sort = signal<AndesSortState | null>({
      columnId: 'status',
      direction: 'asc',
    });
    const urgency = ['Overdue', 'Pending', 'Paid', 'Refunded'];
    const rows = computed(() =>
      andesSortRows(ORDERS.slice(0, 8), sort(), {
        ...ORDER_ACCESSORS,
        status: {
          compare: (a, b) =>
            urgency.indexOf(a.status) - urgency.indexOf(b.status),
        },
      }),
    );
    return {
      props: { sort, rows, money, color: statusColor },
      template: `
        <andes-table [(sort)]="sort" style="max-width: 44rem;">
          <thead andesTableHeader>
            <tr andesTableRow>${ORDER_HEADS}</tr>
          </thead>
          <tbody andesTableBody>
            @for (order of rows(); track order.id) {
              <tr andesTableRow>${ORDER_CELLS}</tr>
            }
          </tbody>
        </andes-table>`,
    };
  },
};

/** Sort directions. */
export const SortDirections: Story = {
  name: 'Sort directions',
  parameters: about(
    'The directions a header cycles through are yours to choose: ascending and descending only, or a cycle that never goes back to unsorted.',
  ),
  render: () => {
    const first = signal<AndesSortState | null>(null);
    const second = signal<AndesSortState | null>(null);
    return {
      props: {
        first,
        second,
        firstRows: sortedOrders(first),
        secondRows: sortedOrders(second),
        money,
        color: statusColor,
        strong,
      },
      template: `
        <div style="${stack} max-width: 44rem;">
          <p [style]="strong" style="margin: 0;">Ascending then descending, never unsorted again</p>
          <andes-table [(sort)]="first" [sortDirections]="['asc', 'desc', 'asc']">
            <thead andesTableHeader>
              <tr andesTableRow>${ORDER_HEADS}</tr>
            </thead>
            <tbody andesTableBody>
              @for (order of firstRows(); track order.id) {
                <tr andesTableRow>${ORDER_CELLS}</tr>
              }
            </tbody>
          </andes-table>
          <p [style]="strong" style="margin: 0;">Descending only</p>
          <andes-table [(sort)]="second" [sortDirections]="['desc']">
            <thead andesTableHeader>
              <tr andesTableRow>${ORDER_HEADS}</tr>
            </thead>
            <tbody andesTableBody>
              @for (order of secondRows(); track order.id) {
                <tr andesTableRow>${ORDER_CELLS}</tr>
              }
            </tbody>
          </andes-table>
        </div>`,
    };
  },
};

/** Default sort. */
export const DefaultSort: Story = {
  name: 'Default sort order',
  parameters: about(
    'Start the sort model with a column and a direction and the table opens already ordered.',
  ),
  render: () => {
    const sort = signal<AndesSortState | null>({
      columnId: 'total',
      direction: 'desc',
    });
    return {
      props: { sort, rows: sortedOrders(sort), money, color: statusColor },
      template: `
        <andes-table [(sort)]="sort" style="max-width: 44rem;">
          <thead andesTableHeader>
            <tr andesTableRow>${ORDER_HEADS}</tr>
          </thead>
          <tbody andesTableBody>
            @for (order of rows(); track order.id) {
              <tr andesTableRow>${ORDER_CELLS}</tr>
            }
          </tbody>
        </andes-table>`,
    };
  },
};

/** Multiple sort. */
export const MultipleSort: Story = {
  name: 'Multiple sort with priority',
  parameters: about(
    'With multiple sort every pressed column joins the order in the sequence it was pressed, and a number beside its arrow tells its priority.',
  ),
  render: () => {
    const sorts = signal<readonly AndesSortState[]>([
      { columnId: 'role', direction: 'asc' },
      { columnId: 'age', direction: 'desc' },
    ]);
    const users = makeUsers(10);
    return {
      props: {
        sorts,
        rows: computed(() => andesSortRows(users, sorts(), USER_ACCESSORS)),
        muted,
      },
      template: `
        <div style="${stack} max-width: 44rem;">
          <andes-table multiSort [(sorts)]="sorts">
            <thead andesTableHeader>
              <tr andesTableRow>
                <th andesTableHead sortKey="name">Name</th>
                <th andesTableHead sortKey="role">
                  Role
                </th>
                <th andesTableHead sortKey="city">
                  City
                </th>
                <th andesTableHead sortKey="age" align="end">
                  Age
                </th>
              </tr>
            </thead>
            <tbody andesTableBody>
              @for (row of rows(); track row.id) {
                <tr andesTableRow>
                  <td andesTableCell>{{ row.name }}</td>
                  <td andesTableCell>{{ row.role }}</td>
                  <td andesTableCell>{{ row.city }}</td>
                  <td andesTableCell align="end">{{ row.age }}</td>
                </tr>
              }
            </tbody>
          </andes-table>
          <span [style]="muted">Press the headers in turn: each one is added to the order of the columns above it.</span>
        </div>`,
    };
  },
};

/** Sort tooltip. */
export const SortTooltip: Story = {
  name: 'Sort tooltip',
  parameters: about(
    'A sortable header can say what pressing it does next: sort ascending, sort descending or cancel the sort.',
  ),
  render: () => {
    const sort = signal<AndesSortState | null>(null);
    return {
      props: { sort, rows: sortedOrders(sort), money, color: statusColor },
      template: `
        <andes-table [(sort)]="sort" sortTooltip style="max-width: 44rem;">
          <thead andesTableHeader>
            <tr andesTableRow>${ORDER_HEADS}</tr>
          </thead>
          <tbody andesTableBody>
            @for (order of rows(); track order.id) {
              <tr andesTableRow>${ORDER_CELLS}</tr>
            }
          </tbody>
        </andes-table>`,
    };
  },
};

/** Change events. */
export const ChangeEvents: Story = {
  name: 'Change events',
  parameters: about(
    'Every sort or filter the user makes is reported with the whole state, which is all a server needs to refetch.',
  ),
  render: () => {
    const sort = signal<AndesSortState | null>(null);
    const last = signal('nothing yet');
    return {
      props: {
        sort,
        rows: sortedOrders(sort),
        last,
        log: (change: AndesTableChange) =>
          last.set(
            JSON.stringify({
              action: change.action,
              sort: change.sort,
              filters: change.filters,
            }),
          ),
        options: STATUS_OPTIONS,
        hasStatus,
        money,
        color: statusColor,
        muted,
      },
      template: `
        <div style="${stack} max-width: 44rem;">
          <andes-table #table [(sort)]="sort" (tableChange)="log($event)">
            <thead andesTableHeader>
              <tr andesTableRow>
                <th andesTableHead sortKey="id">Invoice</th>
                <th andesTableHead sortKey="customer">Customer</th>
                <th andesTableHead sortKey="status">Status <andes-table-filter column="status" label="Filter status" [options]="options" [predicate]="hasStatus" /></th>
                <th andesTableHead sortKey="total" align="end">Total</th>
              </tr>
            </thead>
            <tbody andesTableBody>
              @for (order of table.filterRows(rows()); track order.id) {
                <tr andesTableRow>${ORDER_CELLS}</tr>
              }
            </tbody>
          </andes-table>
          <span [style]="muted" style="overflow-wrap: anywhere;">Last change: {{ last() }}</span>
        </div>`,
    };
  },
};

/** A header with a status filter, shared by the filter stories. */
const STATUS_HEAD = (attrs: string) => `
  <th andesTableHead sortKey="status">
    Status
    <andes-table-filter column="status" label="Filter status" [options]="options" [predicate]="hasStatus" ${attrs} />
  </th>`;

/** The plain table of invoices that the filter stories narrow. */
function filterTable(
  attrs: string,
  extraProps: Record<string, unknown> = {},
  tableAttrs = '',
  top = '',
) {
  const sort = signal<AndesSortState | null>(null);
  return {
    props: {
      sort,
      rows: sortedOrders(sort, ORDERS),
      options: STATUS_OPTIONS,
      hasStatus,
      money,
      color: statusColor,
      muted,
      ...extraProps,
    },
    template: `
      <div style="${stack} max-width: 44rem;">
        ${top}
        <andes-table #table [(sort)]="sort" ${tableAttrs}>
          <thead andesTableHeader>
            <tr andesTableRow>
              <th andesTableHead sortKey="id">Invoice</th>
              <th andesTableHead sortKey="customer">Customer</th>
              ${STATUS_HEAD(attrs)}
              <th andesTableHead sortKey="total" align="end">Total</th>
            </tr>
          </thead>
          <tbody andesTableBody>
            @for (order of table.filterRows(rows()); track order.id) {
              <tr andesTableRow>${ORDER_CELLS}</tr>
            }
            ${EMPTY_ROW(4)}
          </tbody>
        </andes-table>
      </div>`,
  };
}

/** Column filters. */
export const ColumnFilters: Story = {
  name: 'Column filters menu',
  parameters: about(
    'A filter button in a header opens a menu of checkboxes, and the funnel fills in while the column is filtered.',
  ),
  render: () => filterTable(''),
};

/** Single choice filter. */
export const SingleChoiceFilter: Story = {
  name: 'Single choice filter',
  parameters: about(
    'Turn off multiple and the menu offers radios, so only one value can filter the column.',
  ),
  render: () => filterTable('[multiple]="false"'),
};

/** Filter on close. */
export const FilterOnClose: Story = {
  name: 'Filter on close',
  parameters: about(
    'The menu applies its draft when it is closed by a click outside or the Escape key; switch the option off and only the OK button applies it.',
  ),
  render: () => {
    const onClose = signal(true);
    return filterTable(
      '[applyOnClose]="onClose()"',
      { onClose, control },
      '',
      `
      <span [style]="control"><andes-switch [checked]="onClose()" (checkedChange)="onClose.set($event)">Apply the draft when the menu closes</andes-switch></span>`,
    );
  },
};

/** Default filtered values. */
export const DefaultFilteredValues: Story = {
  name: 'Default filtered values',
  parameters: about(
    'A filter can start with values already chosen, and its Reset goes back to them instead of emptying the list.',
  ),
  render: () =>
    filterTable(
      "[defaultFilteredValue]=\"['Pending', 'Overdue']\" resetToDefault",
    ),
};

/** Searchable filter. */
export const SearchableFilter: Story = {
  name: 'Searchable filter items',
  parameters: about(
    'A search box at the top of the menu narrows a long list of choices as the user types.',
  ),
  render: () => filterTable('searchable searchPlaceholder="Search status"'),
};

/** Tree filter. */
export const TreeModeFilter: Story = {
  name: 'Tree-mode filter',
  parameters: about(
    'Nested choices can be shown as a tree: checking a group checks every choice inside it.',
  ),
  render: () => {
    const sort = signal<AndesSortState | null>(null);
    const options: AndesTableFilterOption[] = [
      {
        text: 'Online',
        value: 'online',
        children: [
          { text: 'Credit card', value: 'Credit card' },
          { text: 'PayPal', value: 'PayPal' },
        ],
      },
      {
        text: 'In person',
        value: 'in-person',
        children: [
          { text: 'Transfer', value: 'Transfer' },
          { text: 'Cash', value: 'Cash' },
        ],
      },
    ];
    return {
      props: {
        sort,
        rows: sortedOrders(sort, ORDERS),
        options,
        hasMethod,
        money,
        color: statusColor,
      },
      template: `
        <andes-table #table [(sort)]="sort" style="max-width: 44rem;">
          <thead andesTableHeader>
            <tr andesTableRow>
              <th andesTableHead sortKey="id">Invoice</th>
              <th andesTableHead sortKey="customer">Customer</th>
              <th andesTableHead>
                Method
                <andes-table-filter column="method" label="Filter method" mode="tree" searchable [options]="options" [predicate]="hasMethod" />
              </th>
              <th andesTableHead sortKey="total" align="end">Total</th>
            </tr>
          </thead>
          <tbody andesTableBody>
            @for (order of table.filterRows(rows()); track order.id) {
              <tr andesTableRow>
                <td andesTableCell>{{ order.id }}</td>
                <td andesTableCell>{{ order.customer }}</td>
                <td andesTableCell>{{ order.method }}</td>
                <td andesTableCell align="end">{{ money(order.total) }}</td>
              </tr>
            }
          </tbody>
        </andes-table>`,
    };
  },
};

/** Custom filter panel. */
export const CustomFilterPanel: Story = {
  name: 'Custom filter panel',
  parameters: about(
    'A panel template can hold any control: a search box with Search and Reset buttons, using the confirm and clear calls the panel receives.',
  ),
  render: () => {
    const filters = signal<AndesTableFilters>({});
    const sort = signal<AndesSortState | null>(null);
    const rows = computed(() =>
      andesSortRows(
        andesFilterRows(ORDERS, filters(), {
          customer: (value, order) =>
            order.customer.toLowerCase().includes(String(value).toLowerCase()),
        }),
        sort(),
        ORDER_ACCESSORS,
      ),
    );
    return {
      props: {
        filters,
        sort,
        rows,
        money,
        color: statusColor,
        textValues: (text: string): AndesFilterValue[] =>
          text.trim() ? [text.trim()] : [],
      },
      template: `
        <andes-table [(filters)]="filters" [(sort)]="sort" style="max-width: 44rem;">
          <thead andesTableHeader>
            <tr andesTableRow>
              <th andesTableHead sortKey="id">Invoice</th>
              <th andesTableHead sortKey="customer">
                Customer
                <andes-table-filter column="customer" label="Search customer" [panel]="searchPanel">
                  <ng-icon name="lucideSearch" />
                </andes-table-filter>
              </th>
              <th andesTableHead sortKey="status">Status</th>
              <th andesTableHead sortKey="total" align="end">Total</th>
            </tr>
          </thead>
          <tbody andesTableBody>
            @for (order of rows(); track order.id) {
              <tr andesTableRow>${ORDER_CELLS}</tr>
            }
            ${EMPTY_ROW(4, 'No customer matches the search')}
          </tbody>
        </andes-table>
        <ng-template #searchPanel let-selected let-setSelected="setSelected" let-confirm="confirm" let-clear="clear">
          <div style="display: grid; gap: 0.5rem; padding: 0.75rem; min-width: 14rem;">
            <andes-input placeholder="Customer name" aria-label="Customer name" [value]="selected[0] ?? ''" (valueChange)="setSelected(textValues($event))" (pressEnter)="confirm()">
              <ng-icon slot="prefix" name="lucideSearch" />
            </andes-input>
            <div style="display: flex; gap: 0.5rem;">
              <andes-button size="sm" (click)="confirm()">Search</andes-button>
              <andes-button size="sm" variant="outline" (click)="clear()">Reset</andes-button>
            </div>
          </div>
        </ng-template>`,
    };
  },
};

/** Custom filter icon. */
export const CustomFilterIcon: Story = {
  name: 'Custom filter icon',
  parameters: about(
    'The icon of the filter button is a template that is told whether the column is filtered, so it can change colour or shape.',
  ),
  render: () => {
    const base = filterTable('[icon]="statusIcon"');
    return {
      props: base.props,
      template: `${base.template}
        <ng-template #statusIcon let-filtered>
          <ng-icon name="lucideSearch" [style.color]="filtered ? 'var(--andes-color-primary-text)' : null" />
        </ng-template>`,
    };
  },
};

/** Text filter. */
export const TextFilter: Story = {
  name: 'Text filter',
  parameters: about(
    'The text panel asks for a word and how to compare it: contains, starts with, equals or does not contain.',
  ),
  render: () => {
    const filters = signal<AndesTableFilters>({});
    const rows = computed(() =>
      andesFilterRows(ORDERS, filters(), {
        customer: andesTextFilter<Order>((order) => order.customer),
      }),
    );
    return {
      props: {
        filters,
        rows,
        money,
        color: statusColor,
        operators: ['contains', 'startsWith', 'equals', 'notContains'],
      },
      template: `
        <andes-table [(filters)]="filters" style="max-width: 44rem;">
          <thead andesTableHeader>
            <tr andesTableRow>
              <th andesTableHead>Invoice</th>
              <th andesTableHead>
                Customer
                <andes-table-filter column="customer" label="Filter customer">
                  <andes-table-text-filter placeholder="Customer name" [operators]="operators" />
                </andes-table-filter>
              </th>
              <th andesTableHead>Status</th>
              <th andesTableHead align="end">Total</th>
            </tr>
          </thead>
          <tbody andesTableBody>
            @for (order of rows(); track order.id) {
              <tr andesTableRow>${ORDER_CELLS}</tr>
            }
            ${EMPTY_ROW(4)}
          </tbody>
        </andes-table>`,
    };
  },
};

/** Range filter. */
export const RangeFilter: Story = {
  name: 'Range filter',
  parameters: about(
    'The range panel keeps the rows between a minimum and a maximum, and its OK button waits while the minimum is above the maximum.',
  ),
  render: () => {
    const filters = signal<AndesTableFilters>({});
    const rows = computed(() =>
      andesFilterRows(ORDERS, filters(), {
        total: andesRangeFilter<Order>((order) => order.total),
      }),
    );
    return {
      props: { filters, rows, money, color: statusColor },
      template: `
        <andes-table [(filters)]="filters" style="max-width: 44rem;">
          <thead andesTableHeader>
            <tr andesTableRow>
              <th andesTableHead>Invoice</th>
              <th andesTableHead>Customer</th>
              <th andesTableHead>Status</th>
              <th andesTableHead align="end">
                Total
                <andes-table-filter column="total" label="Filter total">
                  <andes-table-range-filter minPlaceholder="0" maxPlaceholder="No limit" />
                </andes-table-filter>
              </th>
            </tr>
          </thead>
          <tbody andesTableBody>
            @for (order of rows(); track order.id) {
              <tr andesTableRow>${ORDER_CELLS}</tr>
            }
            ${EMPTY_ROW(4)}
          </tbody>
        </andes-table>`,
    };
  },
};

/** Date range filter. */
export const DateRangeFilter: Story = {
  name: 'Date range filter',
  parameters: about(
    'The date panel keeps the rows between two days, and a day left empty means no limit on that side.',
  ),
  render: () => {
    const filters = signal<AndesTableFilters>({});
    const rows = computed(() =>
      andesFilterRows(ORDERS, filters(), {
        date: andesDateRangeFilter<Order>((order) => order.date),
      }),
    );
    return {
      props: { filters, rows, money, color: statusColor },
      template: `
        <andes-table [(filters)]="filters" style="max-width: 44rem;">
          <thead andesTableHeader>
            <tr andesTableRow>
              <th andesTableHead>Invoice</th>
              <th andesTableHead>
                Date
                <andes-table-filter column="date" label="Filter date">
                  <andes-table-date-range-filter />
                </andes-table-filter>
              </th>
              <th andesTableHead>Status</th>
              <th andesTableHead align="end">Total</th>
            </tr>
          </thead>
          <tbody andesTableBody>
            @for (order of rows(); track order.id) {
              <tr andesTableRow>
                <td andesTableCell>{{ order.id }}</td>
                <td andesTableCell>{{ order.date }}</td>
                <td andesTableCell><andes-tag [color]="color(order.status)">{{ order.status }}</andes-tag></td>
                <td andesTableCell align="end">{{ money(order.total) }}</td>
              </tr>
            }
            ${EMPTY_ROW(4)}
          </tbody>
        </andes-table>`,
    };
  },
};

/** Controlled filters and sorters. */
export const ControlledFiltersAndSorters: Story = {
  name: 'Controlled filters and sorters',
  parameters: about(
    'Filters and sort are models the page can read and write, so buttons outside the table can set them, clear them or reset both at once.',
  ),
  render: () => {
    const sort = signal<AndesSortState | null>(null);
    const filters = signal<AndesTableFilters>({ status: ['Pending'] });
    const rows = computed(() =>
      andesSortRows(
        andesFilterRows(ORDERS, filters(), { status: hasStatus }),
        sort(),
        ORDER_ACCESSORS,
      ),
    );
    return {
      props: {
        sort,
        filters,
        rows,
        options: STATUS_OPTIONS,
        money,
        color: statusColor,
        bar,
        muted,
        sortTotal: () => sort.set({ columnId: 'total', direction: 'desc' }),
        showPaid: () => filters.set({ status: ['Paid'] }),
      },
      template: `
        <div style="${stack} max-width: 44rem;">
          <div [style]="bar">
            <andes-button variant="outline" size="sm" (click)="sortTotal()"><ng-icon slot="icon-start" name="lucideArrowDown" />Sort by total</andes-button>
            <andes-button variant="outline" size="sm" (click)="showPaid()"><ng-icon slot="icon-start" name="lucideFunnel" />Show paid</andes-button>
            <andes-button variant="outline" size="sm" (click)="table.clearFilters()">Clear filters</andes-button>
            <andes-button variant="ghost" size="sm" (click)="table.resetState()"><ng-icon slot="icon-start" name="lucideRefreshCw" />Reset filters and sorters</andes-button>
          </div>
          <andes-table #table [(sort)]="sort" [(filters)]="filters">
            <thead andesTableHeader>
              <tr andesTableRow>
                <th andesTableHead sortKey="id">Invoice</th>
                <th andesTableHead sortKey="customer">Customer</th>
                <th andesTableHead sortKey="status">
                  Status
                  <andes-table-filter column="status" label="Filter status" [options]="options" [filteredValue]="filters()['status'] ?? []" />
                </th>
                <th andesTableHead sortKey="total" align="end">Total</th>
              </tr>
            </thead>
            <tbody andesTableBody>
              @for (order of rows(); track order.id) {
                <tr andesTableRow>${ORDER_CELLS}</tr>
              }
              ${EMPTY_ROW(4)}
            </tbody>
          </andes-table>
          <span [style]="muted">Sorted by {{ sort()?.columnId ?? 'nothing' }}, filtered by {{ (filters()['status'] ?? []).join(', ') || 'nothing' }}</span>
        </div>`,
    };
  },
};

/** Filter in tree data. */
export const FilterInTreeData: Story = {
  name: 'Filter in tree data',
  parameters: about(
    'In tree data a row stays when it matches or when something under it does, so a match is never cut off from its folders.',
  ),
  render: () => {
    const filters = signal<AndesTableFilters>({});
    const expanded = signal<readonly AndesTableRowKey[]>([
      'docs',
      'docs-c',
      'pics',
    ]);
    const kinds: AndesTableFilterOption[] = [
      { text: 'Folder', value: 'folder' },
      { text: 'File', value: 'file' },
      { text: 'Image', value: 'image' },
    ];
    const keep = (
      node: FileNode,
      wanted: readonly AndesFilterValue[],
    ): FileNode | null => {
      const children = (node.children ?? [])
        .map((child) => keep(child, wanted))
        .filter((child): child is FileNode => !!child);
      return wanted.length === 0 ||
        wanted.includes(node.kind) ||
        children.length > 0
        ? { ...node, children: node.children ? children : undefined }
        : null;
    };
    const nodes = computed(() => {
      const wanted = filters()['kind'] ?? [];
      const rows = FILES.map((node) => keep(node, wanted)).filter(
        (node): node is FileNode => !!node,
      );
      return andesFlattenTableTree(rows, {
        key: (row) => row.key,
        children: (row) => row.children,
        expandedKeys: expanded(),
      });
    });
    return {
      props: { filters, expanded, nodes, kinds },
      template: `
        <andes-table [(filters)]="filters" [(expandedKeys)]="expanded" style="max-width: 40rem;">
          <thead andesTableHeader>
            <tr andesTableRow>
              <th andesTableHead>
                Name
                <andes-table-filter column="kind" label="Filter by kind" [options]="kinds" />
              </th>
              <th andesTableHead>Kind</th>
              <th andesTableHead align="end">Size (KB)</th>
            </tr>
          </thead>
          <tbody andesTableBody>
            @for (node of nodes(); track node.key) {
              <tr andesTableRow [rowKey]="node.key" [level]="node.level">
                <td andesTableCell indent>
                  <span style="display: inline-flex; align-items: center; gap: 0.5rem;">
                    <andes-table-expand-toggle [spacer]="!node.hasChildren" [label]="'Open ' + node.row.name" />
                    <ng-icon [name]="node.row.kind === 'folder' ? 'lucideFolder' : node.row.kind === 'image' ? 'lucideImage' : 'lucideFileText'" />
                    {{ node.row.name }}
                  </span>
                </td>
                <td andesTableCell>{{ node.row.kind }}</td>
                <td andesTableCell align="end">{{ node.row.kind === 'folder' ? '' : node.row.size }}</td>
              </tr>
            }
            ${EMPTY_ROW(3, 'No item has this kind')}
          </tbody>
        </andes-table>`,
    };
  },
};

/** Filter empty state. */
export const FilterEmptyState: Story = {
  name: 'Filter empty state',
  parameters: about(
    'When filters leave no row the body says so, and a button in that message clears the filters.',
  ),
  render: () => {
    const base = filterTable('[defaultFilteredValue]="[\'Cancelled\']"', {
      options: [...STATUS_OPTIONS, { text: 'Cancelled', value: 'Cancelled' }],
    });
    return {
      props: base.props,
      template: base.template.replace(
        '<andes-table-empty>No invoices match</andes-table-empty>',
        '<andes-table-empty><span style="display: inline-flex; flex-direction: column; align-items: center; gap: 0.5rem;">No invoices match these filters <andes-button size="sm" variant="outline" (click)="table.clearFilters()">Clear filters</andes-button></span></andes-table-empty>',
      ),
    };
  },
};

/** Global search. */
export const GlobalSearch: Story = {
  name: 'Global search box',
  parameters: about(
    'A search box above the table filters every column at once, and the table keeps the sort and the filters of its headers working beside it.',
  ),
  render: () => {
    const query = signal('');
    const sort = signal<AndesSortState | null>(null);
    const users = makeUsers(14);
    const rows = computed(() => {
      const text = query().trim().toLowerCase();
      const found = text
        ? users.filter((user) =>
            [user.name, user.role, user.city, user.email].some((v) =>
              v.toLowerCase().includes(text),
            ),
          )
        : users;
      return andesSortRows(found, sort(), USER_ACCESSORS);
    });
    return {
      props: { query, sort, rows, bar, muted },
      template: `
        <div style="${stack} max-width: 44rem;">
          <div [style]="bar">
            <andes-input placeholder="Search people" aria-label="Search people" style="width: 16rem;" [value]="query()" (valueChange)="query.set($event)">
              <ng-icon slot="prefix" name="lucideSearch" />
            </andes-input>
            <span [style]="muted">{{ rows().length }} of 14 people</span>
          </div>
          <andes-table [(sort)]="sort">
            <thead andesTableHeader>
              <tr andesTableRow>
                <th andesTableHead sortKey="name">Name</th>
                <th andesTableHead sortKey="role">Role</th>
                <th andesTableHead sortKey="city">City</th>
                <th andesTableHead sortKey="age" align="end">Age</th>
              </tr>
            </thead>
            <tbody andesTableBody>
              @for (row of rows(); track row.id) {
                <tr andesTableRow>
                  <td andesTableCell>{{ row.name }}</td>
                  <td andesTableCell>{{ row.role }}</td>
                  <td andesTableCell>{{ row.city }}</td>
                  <td andesTableCell align="end">{{ row.age }}</td>
                </tr>
              }
              ${EMPTY_ROW(4, 'Nobody matches the search')}
            </tbody>
          </andes-table>
        </div>`,
    };
  },
};

/** The state of a remote table. */
function remoteDemo(withSelection: boolean) {
  const pageSize = 6;
  const page = signal(1);
  const sort = signal<AndesSortState | null>(null);
  const roles = signal<readonly string[]>([]);
  const loading = signal(false);
  const result = signal<RemoteResult>({ rows: [], total: 0 });
  const selected = signal<readonly AndesTableRowKey[]>([]);
  const pages = computed(() =>
    Math.max(1, Math.ceil(result().total / pageSize)),
  );
  const load = () => {
    loading.set(true);
    mockFetch(
      { page: page(), pageSize, sort: sort(), roles: roles() },
      500,
    ).then((next) => {
      result.set(next);
      loading.set(false);
    });
  };
  load();
  return {
    props: {
      page,
      sort,
      loading,
      result,
      selected,
      pages,
      pageSize,
      options: ['Admin', 'Editor', 'Viewer', 'Billing'].map((role) => ({
        text: role,
        value: role,
      })),
      onChange: (change: AndesTableChange) => {
        roles.set((change.filters['role'] ?? []).map(String));
        sort.set(change.sort);
        page.set(1);
        load();
      },
      go: (next: number) => {
        page.set(next);
        load();
      },
      bar,
      muted,
    },
    template: `
      <div style="${stack} max-width: 44rem;">
        <andes-table [loading]="loading()" [(sort)]="sort" [(selectedKeys)]="selected" (tableChange)="onChange($event)">
          <thead andesTableHeader>
            <tr andesTableRow>
              ${withSelection ? '<th andesTableHead><andes-table-select-all /></th>' : ''}
              <th andesTableHead sortKey="name">Name</th>
              <th andesTableHead>
                Role
                <andes-table-filter column="role" label="Filter role" [options]="options" />
              </th>
              <th andesTableHead sortKey="city">City</th>
              <th andesTableHead sortKey="age" align="end">Age</th>
            </tr>
          </thead>
          <tbody andesTableBody>
            @for (row of result().rows; track row.id) {
              <tr andesTableRow [rowKey]="row.id">
                ${withSelection ? `<td andesTableCell><andes-table-selection [label]="'Select ' + row.name" /></td>` : ''}
                <td andesTableCell>{{ row.name }}</td>
                <td andesTableCell>{{ row.role }}</td>
                <td andesTableCell>{{ row.city }}</td>
                <td andesTableCell align="end">{{ row.age }}</td>
              </tr>
            }
            @if (!loading() && result().rows.length === 0) {
              <tr andesTableRow><td andesTableCell colspan="${withSelection ? 5 : 4}"><andes-table-empty /></td></tr>
            }
          </tbody>
        </andes-table>
        <div [style]="bar">
          <andes-button variant="outline" size="sm" [disabled]="loading() || page() === 1" (click)="go(page() - 1)">Previous</andes-button>
          <span [style]="muted">Page {{ page() }} of {{ pages() }} - {{ result().total }} people on the server</span>
          <andes-button variant="outline" size="sm" [disabled]="loading() || page() === pages()" (click)="go(page() + 1)">Next</andes-button>
          ${withSelection ? '<span [style]="muted">{{ selected().length }} selected over every page</span>' : ''}
        </div>
      </div>`,
  };
}

/** Remote data. */
export const RemoteData: Story = {
  name: 'Remote data',
  parameters: about(
    'A pretend server sorts, filters and pages 237 people; the table only reports what the user asked for and shows its loading state while the answer is on the way.',
  ),
  render: () => remoteDemo(false),
};

/** Remote data with selection. */
export const RemoteDataKeepsSelection: Story = {
  name: 'Remote data that keeps the selection',
  parameters: about(
    'Selected keys outlive the page they were chosen on, so a user can choose rows across several answers of the server.',
  ),
  render: () => remoteDemo(true),
};
