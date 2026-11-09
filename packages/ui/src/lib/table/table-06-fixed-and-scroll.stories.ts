import { signal } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular';

import {
  about,
  bar,
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
import type { AndesTablePinned } from './table-column-settings';
import type { AndesTableRowKey } from './table-context';

/*
 * Tables bigger than their box: a fixed header, columns pinned to an edge, a header that follows
 * the page, a summary row that stays in view, and lists of thousands of rows that draw only the
 * rows on screen.
 */

const meta: Meta<AndesTable> = {
  title: 'Data Display/Table/Fixed and scroll',
  component: AndesTable,
  tags: ['autodocs'],
  decorators: [withDescription, withTableKit],
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<AndesTable>;

interface Col {
  readonly key: string;
  readonly title: string;
  /** The template of the cell; the row is `row`. */
  readonly cell: string;
  readonly align?: 'end' | 'center';
  readonly width?: string;
}

/** Fourteen columns of a user list, the first few of them the ones worth pinning. */
const COLUMNS: readonly Col[] = [
  { key: 'id', title: '#', cell: '{{ row.id }}', align: 'end', width: '4rem' },
  { key: 'name', title: 'Name', cell: '{{ row.name }}', width: '11rem' },
  { key: 'email', title: 'Email', cell: '{{ row.email }}', width: '16rem' },
  { key: 'role', title: 'Role', cell: '{{ row.role }}', width: '7rem' },
  {
    key: 'state',
    title: 'State',
    cell: `<andes-tag [color]="statusColor(row.state)">{{ row.state }}</andes-tag>`,
    width: '8rem',
  },
  { key: 'city', title: 'City', cell: '{{ row.city }}', width: '8rem' },
  {
    key: 'age',
    title: 'Age',
    cell: '{{ row.age }}',
    align: 'end',
    width: '5rem',
  },
  {
    key: 'score',
    title: 'Score',
    cell: '{{ row.score }}',
    align: 'end',
    width: '6rem',
  },
  { key: 'joined', title: 'Joined', cell: '{{ row.joined }}', width: '8rem' },
  {
    key: 'team',
    title: 'Team',
    cell: 'Team {{ row.id % 7 + 1 }}',
    width: '8rem',
  },
  {
    key: 'plan',
    title: 'Plan',
    cell: "{{ row.id % 3 === 0 ? 'Pro' : 'Free' }}",
    width: '6rem',
  },
  {
    key: 'seats',
    title: 'Seats',
    cell: '{{ row.id % 12 + 1 }}',
    align: 'end',
    width: '6rem',
  },
  {
    key: 'region',
    title: 'Region',
    cell: "{{ row.id % 2 === 0 ? 'South' : 'North' }}",
    width: '8rem',
  },
  {
    key: 'notes',
    title: 'Notes',
    cell: 'Reviewed {{ row.id % 5 + 1 }} times',
    width: '12rem',
  },
];

const ACTIONS = `<andes-button variant="ghost" size="icon-sm" [aria-label]="'More actions for ' + row.name"><ng-icon name="lucideEllipsis" /></andes-button>`;

interface TableOptions {
  readonly attributes?: string;
  /** How many of the columns to draw. */
  readonly count?: number;
  readonly fixed?: Readonly<Record<string, 'start' | 'end'>>;
  /** Draw a last column of actions pinned to the end. */
  readonly actions?: boolean;
  readonly footer?: string;
  /** The `@for` / virtual rows line; the default walks `rows`. */
  readonly rows?: string;
  readonly rowAttributes?: string;
  /** One line per cell, cut with an ellipsis: what a virtual list needs. */
  readonly ellipsis?: boolean;
}

/** A table over `COLUMNS`, with the pins asked for. */
function wideTable(options: TableOptions = {}): string {
  const columns = COLUMNS.slice(0, options.count ?? COLUMNS.length);
  const pin = (key: string) =>
    options.fixed?.[key] ? ` fixed="${options.fixed[key]}"` : '';
  const heads = columns
    .map(
      (col) =>
        `<th andesTableHead${pin(col.key)}${col.align ? ` align="${col.align}"` : ''} style="${options.ellipsis ? 'width' : 'min-width'}: ${col.width}">${col.title}</th>`,
    )
    .join('\n');
  const cells = columns
    .map(
      (col) =>
        `<td andesTableCell${options.ellipsis ? ' ellipsis' : ''}${pin(col.key)}${col.align ? ` align="${col.align}"` : ''}>${col.cell}</td>`,
    )
    .join('\n');
  const rowLine = options.rows ?? `@for (row of rows; track row.id) {`;
  const virtual = options.rows?.startsWith('<tr');
  return `
    <andes-table ${options.attributes ?? ''}>
      <thead andesTableHeader>
        <tr andesTableRow>
          ${heads}
          ${options.actions ? `<th andesTableHead fixed="end" align="center"><span class="andes-table__sr-only">Actions</span></th>` : ''}
        </tr>
      </thead>
      <tbody andesTableBody>
        ${
          virtual
            ? `${rowLine} ${cells}${options.actions ? `<td andesTableCell fixed="end" align="center">${ACTIONS}</td>` : ''}</tr>`
            : `${rowLine}
          <tr andesTableRow [rowKey]="row.id" ${options.rowAttributes ?? ''}>
            ${cells}
            ${options.actions ? `<td andesTableCell fixed="end" align="center">${ACTIONS}</td>` : ''}
          </tr>
        }`
        }
      </tbody>
      ${options.footer ?? ''}
    </andes-table>`;
}

const users = (count: number) => makeUsers(count);

/** Fixed header. */
export const FixedHeader: Story = {
  name: 'Fixed header',
  parameters: about(
    'With scrollY the rows scroll inside the table and the header row stays at the top of its box.',
  ),
  render: () => ({
    props: { rows: users(30), statusColor },
    template: `<div style="max-width: 46rem;">${wideTable({ attributes: 'scrollY="18rem"', count: 6 })}</div>`,
  }),
};

/** Fills the window. */
export const AutoHeight: Story = {
  name: 'Auto height',
  parameters: about(
    'With fill the table takes the height of its container, here a box of 22rem, keeps the header in view and scrolls only the rows.',
  ),
  render: () => ({
    props: { rows: users(60), statusColor },
    template: `<div style="max-width: 46rem; height: 22rem;">${wideTable({ attributes: 'fill', count: 6 })}</div>`,
  }),
};

/** Height from the viewport. */
export const ViewportHeight: Story = {
  name: 'Height from the viewport',
  parameters: about(
    'scrollY takes any CSS length, so a calc of the viewport height makes the table fill the window and scroll its rows inside it.',
  ),
  render: () => ({
    props: { rows: users(60), statusColor },
    template: `<div style="max-width: 46rem;">${wideTable({ attributes: 'scrollY="calc(100vh - 12rem)"', count: 6 })}</div>`,
  }),
};

/** Fixed columns. */
export const FixedColumns: Story = {
  name: 'Fixed columns',
  parameters: about(
    'Cells marked fixed stay at the start or the end edge while the rest of the row scrolls sideways, with a soft shadow where content passes under them.',
  ),
  render: () => ({
    props: { rows: users(8), statusColor },
    template: `<div style="max-width: 40rem;">${wideTable({
      attributes: 'scrollX="1500"',
      count: 10,
      fixed: { name: 'start' },
      actions: true,
    })}</div>`,
  }),
};

/** Several pinned columns. */
export const StackedFixedColumns: Story = {
  name: 'Stacked fixed columns',
  parameters: about(
    'Several fixed columns on the same edge stack one after another, each at the summed width of the pinned columns before it, also in a bordered table.',
  ),
  render: () => ({
    props: { rows: users(8), statusColor },
    template: `<div style="max-width: 40rem;">${wideTable({
      attributes: 'scrollX="2000" bordered',
      fixed: { id: 'start', name: 'start', notes: 'end' },
      actions: true,
    })}</div>`,
  }),
};

/** Header and columns. */
export const FixedHeaderAndColumns: Story = {
  name: 'Fixed header and columns',
  parameters: about(
    'A fixed header and fixed columns together: the header row and the pinned columns stay in place while the body scrolls both ways.',
  ),
  render: () => ({
    props: { rows: users(40), statusColor },
    template: `<div style="max-width: 44rem;">${wideTable({
      attributes: 'scrollX="2000" scrollY="18rem"',
      fixed: { id: 'start', name: 'start' },
      actions: true,
    })}</div>`,
  }),
};

/** Wide. */
export const ManyColumns: Story = {
  name: 'Many columns',
  parameters: about(
    'A table wider than its box scrolls sideways inside its frame, and the page itself does not.',
  ),
  render: () => ({
    props: { rows: users(6), statusColor },
    template: `<div style="max-width: 40rem;">${wideTable({ attributes: 'scrollX="1900"' })}</div>`,
  }),
};

/** Pin toggle. */
export const PinnedColumns: Story = {
  name: 'Pinned columns with a pin icon',
  parameters: about(
    'The column menu pins and unpins each column with a pin button, and a pinned header shows a pin icon beside its title.',
  ),
  render: () => {
    const keys = COLUMNS.slice(0, 10).map((col) => col.key);
    return {
      props: {
        rows: users(8),
        columns: COLUMNS.slice(0, 10),
        settings: COLUMNS.slice(0, 10).map((col) => ({
          key: col.key,
          label: col.title,
          movable: false,
        })),
        order: signal<readonly string[]>(keys),
        hidden: signal<readonly string[]>([]),
        pinned: signal<AndesTablePinned>({ name: 'start' }),
        statusColor,
        stack,
      },
      template: `
        <div style="${stack} max-width: 42rem;">
          <div>
            <andes-table-column-settings pinnable [columns]="settings" [(order)]="order" [(hidden)]="hidden" [(pinned)]="pinned" />
          </div>
          <andes-table scrollX="1400" pinIcon>
            <thead andesTableHeader>
              <tr andesTableRow>
                @for (col of columns; track col.key) {
                  @if (!hidden().includes(col.key)) {
                    <th andesTableHead [fixed]="pinned()[col.key]" [align]="col.align ?? 'start'" style="min-width: 7rem">{{ col.title }}</th>
                  }
                }
              </tr>
            </thead>
            <tbody andesTableBody>
              @for (row of rows; track row.id) {
                <tr andesTableRow [rowKey]="row.id">
                  @if (!hidden().includes('id')) { <td andesTableCell [fixed]="pinned()['id']" align="end">{{ row.id }}</td> }
                  @if (!hidden().includes('name')) { <td andesTableCell [fixed]="pinned()['name']">{{ row.name }}</td> }
                  @if (!hidden().includes('email')) { <td andesTableCell [fixed]="pinned()['email']">{{ row.email }}</td> }
                  @if (!hidden().includes('role')) { <td andesTableCell [fixed]="pinned()['role']">{{ row.role }}</td> }
                  @if (!hidden().includes('state')) { <td andesTableCell [fixed]="pinned()['state']"><andes-tag [color]="statusColor(row.state)">{{ row.state }}</andes-tag></td> }
                  @if (!hidden().includes('city')) { <td andesTableCell [fixed]="pinned()['city']">{{ row.city }}</td> }
                  @if (!hidden().includes('age')) { <td andesTableCell [fixed]="pinned()['age']" align="end">{{ row.age }}</td> }
                  @if (!hidden().includes('score')) { <td andesTableCell [fixed]="pinned()['score']" align="end">{{ row.score }}</td> }
                  @if (!hidden().includes('joined')) { <td andesTableCell [fixed]="pinned()['joined']">{{ row.joined }}</td> }
                  @if (!hidden().includes('team')) { <td andesTableCell [fixed]="pinned()['team']">Team {{ row.id % 7 + 1 }}</td> }
                </tr>
              }
            </tbody>
          </andes-table>
        </div>`,
    };
  },
};

/** Sticky header. */
export const StickyHeader: Story = {
  name: 'Sticky header following the page',
  parameters: about(
    'With sticky the header row follows the page as it scrolls, and stickyOffset keeps it clear of a bar fixed at the top.',
  ),
  render: () => ({
    props: { rows: users(40), statusColor },
    template: `<div style="max-width: 46rem;">${wideTable({ attributes: 'sticky [stickyOffset]="0"', count: 6 })}</div>`,
  }),
};

/** Shadow of the first column. */
export const FirstColumnShadow: Story = {
  name: 'Sticky first column shadow',
  parameters: about(
    'Scroll the table sideways: the pinned first column keeps the names in view and draws a soft edge once the other cells slide under it.',
  ),
  render: () => ({
    props: { rows: users(7), statusColor },
    template: `<div style="max-width: 34rem;">${wideTable({
      attributes: 'scrollX="1300"',
      count: 9,
      fixed: { name: 'start' },
    })}</div>`,
  }),
};

/** Fixed layout. */
export const TableLayout: Story = {
  name: 'Table layout fixed and auto',
  parameters: about(
    'An auto layout widens columns to fit their text, while a fixed layout keeps the widths given and lets long text be cut with an ellipsis.',
  ),
  render: () => ({
    props: {
      rows: users(4).map((user) => ({
        ...user,
        about: `${user.name} keeps the quarterly figures for the ${user.city} office and reviews them every week.`,
      })),
      strong,
      stack,
    },
    template: `
      <div style="${stack} max-width: 40rem;">
        @for (layout of ['auto', 'fixed']; track layout) {
          <div>
            <p style="${strong} margin: 0 0 0.5rem;">{{ layout }}</p>
            <andes-table [tableLayout]="layout">
              <thead andesTableHeader>
                <tr andesTableRow>
                  <th andesTableHead style="width: 9rem">Name</th>
                  <th andesTableHead>About</th>
                </tr>
              </thead>
              <tbody andesTableBody>
                @for (row of rows; track row.id) {
                  <tr andesTableRow>
                    <td andesTableCell>{{ row.name }}</td>
                    <td andesTableCell [ellipsis]="layout === 'fixed'">{{ row.about }}</td>
                  </tr>
                }
              </tbody>
            </andes-table>
          </div>
        }
      </div>`,
  }),
};

const SUMMARY_FOOTER = `
  <tfoot andesTableFooter>
    <tr andesTableRow>
      <td andesTableCell colspan="3">Total of {{ rows.length }} invoices</td>
      <td andesTableCell align="end">{{ money(total) }}</td>
    </tr>
    <tr andesTableRow>
      <td andesTableCell colspan="3">Average</td>
      <td andesTableCell align="end">{{ money(total / rows.length) }}</td>
    </tr>
  </tfoot>`;

const orderRows = (count: number) => {
  const rows = makeOrders(count);
  return {
    rows,
    total: rows.reduce((sum, row) => sum + row.total, 0),
    money,
  };
};

/** Summary. */
export const SummaryRow: Story = {
  name: 'Summary row',
  parameters: about(
    'A footer holds the totals, and a cell that spans several columns with colspan keeps the sums under the column they add up.',
  ),
  render: () => ({
    props: orderRows(6),
    template: `
      <div style="max-width: 40rem;">
        <andes-table>
          <thead andesTableHeader>
            <tr andesTableRow>
              <th andesTableHead>Invoice</th>
              <th andesTableHead>Customer</th>
              <th andesTableHead>Method</th>
              <th andesTableHead align="end">Total</th>
            </tr>
          </thead>
          <tbody andesTableBody>
            @for (row of rows; track row.id) {
              <tr andesTableRow>
                <td andesTableCell>{{ row.id }}</td>
                <td andesTableCell>{{ row.customer }}</td>
                <td andesTableCell>{{ row.method }}</td>
                <td andesTableCell align="end">{{ money(row.total) }}</td>
              </tr>
            }
          </tbody>
          ${SUMMARY_FOOTER}
        </andes-table>
      </div>`,
  }),
};

/** Fixed summary. */
export const FixedSummaryRow: Story = {
  name: 'Fixed summary row',
  parameters: about(
    'A fixed footer stays at the bottom of the scroll area, so the totals are in view while the rows go by.',
  ),
  render: () => ({
    props: orderRows(40),
    template: `
      <div style="max-width: 40rem;">
        <andes-table scrollY="16rem">
          <thead andesTableHeader>
            <tr andesTableRow>
              <th andesTableHead>Invoice</th>
              <th andesTableHead>Customer</th>
              <th andesTableHead>Method</th>
              <th andesTableHead align="end">Total</th>
            </tr>
          </thead>
          <tbody andesTableBody>
            @for (row of rows; track row.id) {
              <tr andesTableRow>
                <td andesTableCell>{{ row.id }}</td>
                <td andesTableCell>{{ row.customer }}</td>
                <td andesTableCell>{{ row.method }}</td>
                <td andesTableCell align="end">{{ money(row.total) }}</td>
              </tr>
            }
          </tbody>
          <tfoot andesTableFooter fixed>
            <tr andesTableRow>
              <td andesTableCell colspan="3">Total of {{ rows.length }} invoices</td>
              <td andesTableCell align="end">{{ money(total) }}</td>
            </tr>
          </tfoot>
        </andes-table>
      </div>`,
  }),
};

const VIRTUAL_ROWS = `<tr *andesTableVirtualRows="let row of rows; rowHeight: 36" andesTableRow [rowKey]="row.id">`;

/** Virtual list. */
export const VirtualList: Story = {
  name: 'Virtual list of 10 000 rows',
  parameters: about(
    'A virtual list draws only the rows in view and two spacers for the rest, so ten thousand rows scroll as smoothly as ten.',
  ),
  render: () => ({
    props: { rows: users(10000), statusColor },
    template: `
      <div style="max-width: 46rem;">
        <p style="${muted} margin: 0 0 0.75rem;">{{ rows.length }} rows, a few dozen in the page.</p>
        ${wideTable({
          attributes: 'scrollY="20rem" density="compact" tableLayout="fixed"',
          count: 6,
          rows: VIRTUAL_ROWS,
          ellipsis: true,
        })}
      </div>`,
  }),
};

/** Virtual list with a checkbox on every row. */
export const VirtualListSelection: Story = {
  name: 'Virtual list with row selection',
  parameters: about(
    'Ten thousand rows each carry a selection checkbox, yet only the rows in view exist in the page, and select all chooses every row of the data.',
  ),
  render: () => {
    const rows = users(10000);
    const selected = signal<readonly AndesTableRowKey[]>([]);
    return {
      props: {
        rows,
        selected,
        allKeys: rows.map((row) => row.id),
        muted,
      },
      template: `
        <div style="max-width: 46rem;">
          <p style="${muted} margin: 0 0 0.75rem;">{{ selected().length }} of {{ rows.length }} selected</p>
          <andes-table scrollY="20rem" density="compact" tableLayout="fixed" [(selectedKeys)]="selected" [selectableKeys]="allKeys" [rowCount]="rows.length">
            <thead andesTableHeader>
              <tr andesTableRow>
                <th andesTableHead style="width: 3rem;"><andes-table-select-all /></th>
                <th andesTableHead>Name</th>
                <th andesTableHead>Role</th>
                <th andesTableHead>City</th>
              </tr>
            </thead>
            <tbody andesTableBody>
              <tr *andesTableVirtualRows="let row of rows; rowHeight: 36" andesTableRow [rowKey]="row.id">
                <td andesTableCell><andes-table-selection [label]="'Select ' + row.name" /></td>
                <td andesTableCell ellipsis>{{ row.name }}</td>
                <td andesTableCell ellipsis>{{ row.role }}</td>
                <td andesTableCell ellipsis>{{ row.city }}</td>
              </tr>
            </tbody>
          </andes-table>
        </div>`,
    };
  },
};

/** Virtual list, both ways. */
export const VirtualListBothWays: Story = {
  name: 'Virtual list with x and y scroll',
  parameters: about(
    'A virtual list can also be wider than its box: it scrolls sideways while the pinned columns and the header stay in place.',
  ),
  render: () => ({
    props: { rows: users(10000), statusColor },
    template: `
      <div style="max-width: 44rem;">
        ${wideTable({
          attributes:
            'scrollX="2000" scrollY="20rem" density="compact" tableLayout="fixed"',
          fixed: { id: 'start', name: 'start' },
          rows: VIRTUAL_ROWS,
          ellipsis: true,
        })}
      </div>`,
  }),
};

/** Scroll to a row. */
export const ScrollToRow: Story = {
  name: 'Scroll to a row',
  parameters: about(
    'The scrollTo method brings a row index, a row key or an offset to the top, and reaches rows of a virtual list that are not drawn yet.',
  ),
  render: () => ({
    props: { rows: users(2000), statusColor, bar },
    template: `
      <div style="${stack} max-width: 46rem;">
        <div style="${bar}">
          <andes-button size="sm" variant="outline" (click)="table.scrollTo({ top: 0 })"><ng-icon slot="icon-start" name="lucideArrowUp" />Top</andes-button>
          <andes-button size="sm" variant="outline" (click)="table.scrollTo({ index: 499 })">Row 500</andes-button>
          <andes-button size="sm" variant="outline" (click)="table.scrollTo({ index: 1999 })"><ng-icon slot="icon-start" name="lucideArrowDown" />Last row</andes-button>
        </div>
        ${wideTable({
          attributes:
            '#table scrollY="18rem" density="compact" tableLayout="fixed"',
          count: 6,
          rows: VIRTUAL_ROWS,
          ellipsis: true,
        })}
      </div>`,
  }),
};

/** Scroll events. */
export const ScrollEvents: Story = {
  name: 'Scroll events',
  parameters: about(
    'The bodyScroll output fires while the table scrolls, which is enough to show the offset or to load more rows near the end.',
  ),
  render: () => ({
    props: (() => {
      const offset = signal(0);
      return {
        rows: users(40),
        statusColor,
        offset,
        onScroll: (event: Event) =>
          offset.set(Math.round((event.target as HTMLElement).scrollTop)),
      };
    })(),
    template: `
      <div style="${stack} max-width: 46rem;">
        <p style="${muted} margin: 0;">Scrolled {{ offset() }}px from the top.</p>
        ${wideTable({
          attributes: 'scrollY="16rem" (bodyScroll)="onScroll($event)"',
          count: 6,
        })}
      </div>`,
  }),
};
