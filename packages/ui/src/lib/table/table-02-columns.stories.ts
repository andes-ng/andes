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
  PEOPLE,
  stack,
  strong,
  withDescription,
  withTableKit,
} from '../../testing/table-story-kit';
import { AndesTable } from './table';
import type { AndesTableColumnSetting } from './table-column-settings';
import { andesVisibleColumns } from './table-data';
import { andesSortRows, type AndesSortState } from './table-sort';

/*
 * The shape of a table: grouped headers, spans, alignment and widths, truncated text, columns that
 * come from data, hidden and responsive columns, and the small things a header or a cell can carry.
 */

const meta: Meta<AndesTable> = {
  title: 'Data Display/Table/Columns',
  component: AndesTable,
  tags: ['autodocs'],
  decorators: [withDescription, withTableKit],
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<AndesTable>;

/** A column of the data-driven stories. */
interface Column {
  readonly key: string;
  readonly title: string;
  readonly align?: 'start' | 'center' | 'end';
  readonly width?: string;
  readonly ellipsis?: boolean;
  readonly sortable?: boolean;
}

const LONG_ADDRESSES = [
  'Avenida Larco 1301, Miraflores, Lima, Peru, 15074',
  'Calle Garcilaso de la Vega 210, Cusco, Peru, 08002',
  'Jiron Mercaderes 417, Arequipa, Peru, 04001',
  'Avenida Espana 2550, Trujillo, Peru, 13001',
];

const WIDE_ROWS = makeUsers(4).map((user, i) => ({
  ...user,
  address: LONG_ADDRESSES[i % LONG_ADDRESSES.length],
}));

/** Grouped headers: a head can span rows and columns. */
export const GroupedHeaders: Story = {
  name: 'Grouped headers',
  parameters: about(
    'A header cell can span several columns or rows with the native colspan and rowspan, and a scope tells assistive tech which cells it heads.',
  ),
  render: () => ({
    props: {
      rows: [
        {
          key: '1',
          name: 'John Brown',
          age: 32,
          street: 'Lake Park',
          building: 'C',
          door: 2035,
          company: 'Andes Mining',
          gender: 'M',
        },
        {
          key: '2',
          name: 'Jim Green',
          age: 42,
          street: 'Lake Park',
          building: 'B',
          door: 2035,
          company: 'Tamci Peru',
          gender: 'M',
        },
        {
          key: '3',
          name: 'Joe Black',
          age: 32,
          street: 'Lake Park',
          building: 'D',
          door: 2035,
          company: 'Cordillera SA',
          gender: 'F',
        },
      ],
    },
    template: `
      <andes-table bordered style="max-width: 52rem;">
        <thead andesTableHeader>
          <tr andesTableRow>
            <th andesTableHead rowspan="2" scope="col">Name</th>
            <th andesTableHead colspan="2" scope="colgroup" align="center">Other</th>
            <th andesTableHead colspan="2" scope="colgroup" align="center">Company</th>
            <th andesTableHead rowspan="2" scope="col">Gender</th>
          </tr>
          <tr andesTableRow>
            <th andesTableHead align="end">Age</th>
            <th andesTableHead>Street</th>
            <th andesTableHead>Building</th>
            <th andesTableHead align="end">Door No.</th>
          </tr>
        </thead>
        <tbody andesTableBody>
          @for (row of rows; track row.key) {
            <tr andesTableRow>
              <td andesTableCell>{{ row.name }}</td>
              <td andesTableCell align="end">{{ row.age }}</td>
              <td andesTableCell>{{ row.street }}</td>
              <td andesTableCell>{{ row.building }}</td>
              <td andesTableCell align="end">{{ row.door }}</td>
              <td andesTableCell>{{ row.gender }}</td>
            </tr>
          }
        </tbody>
      </andes-table>`,
  }),
};

/** Spans in the body. */
export const CellSpans: Story = {
  name: 'Column and row spans',
  parameters: about(
    'Body cells span too: a cell can cover two columns or two rows, and a cell that covers a column simply leaves its place out of the row.',
  ),
  render: () => ({
    props: {},
    template: `
      <andes-table bordered style="max-width: 44rem;">
        <thead andesTableHeader>
          <tr andesTableRow>
            <th andesTableHead>Name</th>
            <th andesTableHead align="end">Age</th>
            <th andesTableHead colspan="2" align="center">Home phone</th>
            <th andesTableHead>Address</th>
          </tr>
        </thead>
        <tbody andesTableBody>
          <tr andesTableRow>
            <td andesTableCell>John Brown</td>
            <td andesTableCell align="end">32</td>
            <td andesTableCell>0571</td>
            <td andesTableCell>22098346</td>
            <td andesTableCell>New York No. 1 Lake Park</td>
          </tr>
          <tr andesTableRow>
            <td andesTableCell>Jim Green</td>
            <td andesTableCell align="end">42</td>
            <td andesTableCell rowspan="2">0575</td>
            <td andesTableCell>22088888</td>
            <td andesTableCell>London No. 1 Lake Park</td>
          </tr>
          <tr andesTableRow>
            <td andesTableCell>Joe Black</td>
            <td andesTableCell align="end">32</td>
            <td andesTableCell>22088889</td>
            <td andesTableCell>Sydney No. 1 Lake Park</td>
          </tr>
          <tr andesTableRow>
            <td andesTableCell>Jim Red</td>
            <td andesTableCell align="end">18</td>
            <td andesTableCell colspan="2" align="center">No phone on file</td>
            <td andesTableCell>London No. 2 Lake Park</td>
          </tr>
        </tbody>
      </andes-table>`,
  }),
};

/** Alignment. */
export const Alignment: Story = {
  name: 'Alignment',
  parameters: about(
    'Align a column to the start, the center or the end; the end suits numbers, and the alignment follows the writing direction.',
  ),
  render: () => ({
    props: { rows: makeOrders(4), money },
    template: `
      <andes-table style="max-width: 40rem;">
        <thead andesTableHeader>
          <tr andesTableRow>
            <th andesTableHead align="start">Invoice (start)</th>
            <th andesTableHead align="center">Status (center)</th>
            <th andesTableHead align="end">Total (end)</th>
          </tr>
        </thead>
        <tbody andesTableBody>
          @for (row of rows; track row.id) {
            <tr andesTableRow>
              <td andesTableCell>{{ row.id }}</td>
              <td andesTableCell align="center">{{ row.status }}</td>
              <td andesTableCell align="end">{{ money(row.total) }}</td>
            </tr>
          }
        </tbody>
      </andes-table>`,
  }),
};

/** Widths. */
export const ColumnWidths: Story = {
  name: 'Column widths',
  parameters: about(
    'A header takes a width in pixels or as a percentage, and the other columns share what is left.',
  ),
  render: () => ({
    props: { people: PEOPLE },
    template: `
      <andes-table style="max-width: 48rem;">
        <thead andesTableHeader>
          <tr andesTableRow>
            <th andesTableHead width="120">Name (120px)</th>
            <th andesTableHead width="80" align="end">Age</th>
            <th andesTableHead width="45%">Address (45%)</th>
            <th andesTableHead>Tags (the rest)</th>
          </tr>
        </thead>
        <tbody andesTableBody>
          @for (person of people; track person.key) {
            <tr andesTableRow>
              <td andesTableCell>{{ person.name }}</td>
              <td andesTableCell align="end">{{ person.age }}</td>
              <td andesTableCell>{{ person.address }}</td>
              <td andesTableCell>{{ person.tags.join(', ') }}</td>
            </tr>
          }
        </tbody>
      </andes-table>`,
  }),
};

/** Fixed layout. */
export const FixedLayout: Story = {
  name: 'Fixed layout',
  parameters: about(
    'With a fixed layout the widths of the first row decide the columns, so the content never pushes them around.',
  ),
  render: () => ({
    props: { rows: WIDE_ROWS },
    template: `
      <andes-table tableLayout="fixed" style="max-width: 44rem;">
        <thead andesTableHeader>
          <tr andesTableRow>
            <th andesTableHead width="25%">Name</th>
            <th andesTableHead width="15%">Role</th>
            <th andesTableHead>Address</th>
          </tr>
        </thead>
        <tbody andesTableBody>
          @for (row of rows; track row.id) {
            <tr andesTableRow>
              <td andesTableCell>{{ row.name }}</td>
              <td andesTableCell>{{ row.role }}</td>
              <td andesTableCell>{{ row.address }}</td>
            </tr>
          }
        </tbody>
      </andes-table>`,
  }),
};

/** Ellipsis. */
export const Ellipsis: Story = {
  name: 'Ellipsis',
  parameters: about(
    'A cell with ellipsis keeps its text on one line and ends it with an ellipsis when the column is too narrow.',
  ),
  render: () => ({
    props: { rows: WIDE_ROWS },
    template: `
      <andes-table tableLayout="fixed" style="max-width: 40rem;">
        <thead andesTableHeader>
          <tr andesTableRow>
            <th andesTableHead width="30%">Name</th>
            <th andesTableHead ellipsis>Address</th>
            <th andesTableHead width="20%" ellipsis>Email address</th>
          </tr>
        </thead>
        <tbody andesTableBody>
          @for (row of rows; track row.id) {
            <tr andesTableRow>
              <td andesTableCell ellipsis>{{ row.name }}</td>
              <td andesTableCell ellipsis>{{ row.address }}</td>
              <td andesTableCell ellipsis>{{ row.email }}</td>
            </tr>
          }
        </tbody>
      </andes-table>`,
  }),
};

/** Ellipsis with a tooltip. */
export const EllipsisTooltip: Story = {
  name: 'Ellipsis with tooltip',
  parameters: about(
    'A truncated cell shows its whole text in the library tooltip on hover and on focus, and a cell whose text fits shows none.',
  ),
  render: () => ({
    props: { rows: WIDE_ROWS },
    template: `
      <andes-table tableLayout="fixed" style="max-width: 26rem;">
        <thead andesTableHeader>
          <tr andesTableRow>
            <th andesTableHead width="30%">Name</th>
            <th andesTableHead>Address</th>
          </tr>
        </thead>
        <tbody andesTableBody>
          @for (row of rows; track row.id) {
            <tr andesTableRow>
              <td andesTableCell ellipsis>{{ row.name }}</td>
              <td andesTableCell ellipsis>{{ row.address }}</td>
            </tr>
          }
        </tbody>
      </andes-table>`,
  }),
};

/** Shared defaults. */
export const SharedColumnDefaults: Story = {
  name: 'Shared column defaults',
  parameters: about(
    'Write the defaults once and spread them over every column, so only the columns that differ say how.',
  ),
  render: () => {
    const defaults: Column = {
      key: '',
      title: '',
      align: 'start',
      ellipsis: true,
    };
    const own: Partial<Column>[] = [
      { key: 'name', title: 'Name', width: '22%' },
      { key: 'role', title: 'Role', width: '14%' },
      { key: 'email', title: 'Email' },
      { key: 'age', title: 'Age', align: 'end', width: '10%' },
    ];
    const columns: Column[] = own.map((column) => ({ ...defaults, ...column }));
    return {
      props: { columns, rows: makeUsers(5) },
      template: `
        <andes-table tableLayout="fixed" style="max-width: 44rem;">
          <thead andesTableHeader>
            <tr andesTableRow>
              @for (column of columns; track column.key) {
                <th andesTableHead [align]="column.align!" [width]="column.width" [ellipsis]="column.ellipsis!">{{ column.title }}</th>
              }
            </tr>
          </thead>
          <tbody andesTableBody>
            @for (row of rows; track row.id) {
              <tr andesTableRow>
                @for (column of columns; track column.key) {
                  <td andesTableCell [align]="column.align!" [ellipsis]="column.ellipsis!">{{ row[column.key] }}</td>
                }
              </tr>
            }
          </tbody>
        </andes-table>`,
    };
  },
};

/** Columns from a config. */
export const ColumnsFromConfig: Story = {
  name: 'Columns from a config array',
  parameters: about(
    'Columns can come from data: one array describes the heads, the alignment and the sorting, and two loops draw the header and the body.',
  ),
  render: () => {
    const columns: Column[] = [
      { key: 'id', title: 'Id', width: '10%', sortable: true },
      { key: 'name', title: 'Name', sortable: true },
      { key: 'city', title: 'City' },
      { key: 'age', title: 'Age', align: 'end', sortable: true },
      { key: 'score', title: 'Score', align: 'end', sortable: true },
    ];
    const sort = signal<AndesSortState | null>(null);
    const rows = makeUsers(6) as unknown as Record<string, unknown>[];
    const sorted = computed(() =>
      andesSortRows(
        rows,
        sort(),
        Object.fromEntries(
          columns.map((c) => [
            c.key,
            (row: Record<string, unknown>) => row[c.key] as string | number,
          ]),
        ),
      ),
    );
    return {
      props: { columns, sort, sorted },
      template: `
        <andes-table [(sort)]="sort" style="max-width: 44rem;">
          <thead andesTableHeader>
            <tr andesTableRow>
              @for (column of columns; track column.key) {
                <th andesTableHead [sortKey]="column.sortable ? column.key : undefined" [align]="column.align ?? 'start'" [width]="column.width">{{ column.title }}</th>
              }
            </tr>
          </thead>
          <tbody andesTableBody>
            @for (row of sorted(); track row.id) {
              <tr andesTableRow>
                @for (column of columns; track column.key) {
                  <td andesTableCell [align]="column.align ?? 'start'">{{ row[column.key] }}</td>
                }
              </tr>
            }
          </tbody>
        </andes-table>`,
    };
  },
};

/** Hidden columns. */
export const HiddenColumns: Story = {
  name: 'Hidden columns',
  parameters: about(
    'A column is hidden by leaving its head and its cells out, so a list of checkboxes can show and hide each one.',
  ),
  render: () => {
    const all = [
      { key: 'name', title: 'Name' },
      { key: 'role', title: 'Role' },
      { key: 'city', title: 'City' },
      { key: 'email', title: 'Email' },
    ];
    const hidden = signal<readonly string[]>(['email']);
    const shown = computed(() => all.filter((c) => !hidden().includes(c.key)));
    return {
      props: {
        all,
        hidden,
        shown,
        rows: makeUsers(5),
        toggle: (key: string, visible: boolean) =>
          hidden.set(
            visible ? hidden().filter((k) => k !== key) : [...hidden(), key],
          ),
        control,
        strong,
        bar,
      },
      template: `
        <div style="${stack} max-width: 44rem;">
          <div [style]="bar">
            <span [style]="strong">Columns displayed</span>
            @for (column of all; track column.key) {
              <andes-checkbox [checked]="!hidden().includes(column.key)" (checkedChange)="toggle(column.key, $event)">{{ column.title }}</andes-checkbox>
            }
          </div>
          <andes-table>
            <thead andesTableHeader>
              <tr andesTableRow>
                @for (column of shown(); track column.key) {
                  <th andesTableHead>{{ column.title }}</th>
                }
              </tr>
            </thead>
            <tbody andesTableBody>
              @for (row of rows; track row.id) {
                <tr andesTableRow>
                  @for (column of shown(); track column.key) {
                    <td andesTableCell>{{ row[column.key] }}</td>
                  }
                </tr>
              }
            </tbody>
          </andes-table>
        </div>`,
    };
  },
};

/** Column visibility menu. */
export const ColumnVisibilityMenu: Story = {
  name: 'Column visibility menu',
  parameters: about(
    'The columns menu lists every column with a checkbox to hide it and arrows to move it, and it restores the starting layout with Reset.',
  ),
  render: () => {
    const settings: AndesTableColumnSetting[] = [
      { key: 'name', label: 'Name' },
      { key: 'role', label: 'Role' },
      { key: 'city', label: 'City' },
      { key: 'age', label: 'Age' },
      { key: 'email', label: 'Email' },
    ];
    const titles = Object.fromEntries(settings.map((s) => [s.key, s.label]));
    const order = signal<readonly string[]>(settings.map((s) => s.key));
    const hidden = signal<readonly string[]>(['email']);
    const shown = computed(() => andesVisibleColumns(order(), hidden()));
    return {
      props: { settings, titles, order, hidden, shown, rows: makeUsers(5) },
      template: `
        <andes-table style="max-width: 44rem;">
          <div andesTableTop class="andes-table__toolbar">
            <span>Team members</span>
            <andes-table-column-settings [columns]="settings" [(order)]="order" [(hidden)]="hidden" />
          </div>
          <thead andesTableHeader>
            <tr andesTableRow>
              @for (key of shown(); track key) {
                <th andesTableHead>{{ titles[key] }}</th>
              }
            </tr>
          </thead>
          <tbody andesTableBody>
            @for (row of rows; track row.id) {
              <tr andesTableRow>
                @for (key of shown(); track key) {
                  <td andesTableCell>{{ row[key] }}</td>
                }
              </tr>
            }
          </tbody>
        </andes-table>`,
    };
  },
};

/** Responsive columns. */
export const ResponsiveColumns: Story = {
  name: 'Responsive columns',
  parameters: about(
    'Hide a column below a breakpoint with hideBelow: the name shows on every screen, the age from medium up and the address from large up.',
  ),
  render: () => ({
    props: { people: PEOPLE },
    template: `
      <andes-table style="max-width: 48rem;">
        <thead andesTableHeader>
          <tr andesTableRow>
            <th andesTableHead>Name (all screens)</th>
            <th andesTableHead hideBelow="md" align="end">Age (medium and up)</th>
            <th andesTableHead hideBelow="lg">Address (large and up)</th>
          </tr>
        </thead>
        <tbody andesTableBody>
          @for (person of people; track person.key) {
            <tr andesTableRow>
              <td andesTableCell>{{ person.name }}</td>
              <td andesTableCell hideBelow="md" align="end">{{ person.age }}</td>
              <td andesTableCell hideBelow="lg">{{ person.address }}</td>
            </tr>
          }
        </tbody>
      </andes-table>`,
  }),
};

/** Header icons. */
export const HeaderIcons: Story = {
  name: 'Header with icons',
  parameters: about(
    'A header can lead with an icon; keep a clear gap between the icon and the title so the two never touch.',
  ),
  render: () => ({
    props: { rows: makeUsers(4), iconText },
    template: `
      <andes-table style="max-width: 44rem;">
        <thead andesTableHeader>
          <tr andesTableRow>
            <th andesTableHead><span [style]="iconText"><ng-icon name="lucideUser" /> Name</span></th>
            <th andesTableHead><span [style]="iconText"><ng-icon name="lucideMail" /> Email</span></th>
            <th andesTableHead><span [style]="iconText"><ng-icon name="lucideCalendar" /> Joined</span></th>
            <th andesTableHead align="end"><span [style]="iconText"><ng-icon name="lucideStar" /> Score</span></th>
          </tr>
        </thead>
        <tbody andesTableBody>
          @for (row of rows; track row.id) {
            <tr andesTableRow>
              <td andesTableCell>{{ row.name }}</td>
              <td andesTableCell>{{ row.email }}</td>
              <td andesTableCell>{{ row.joined }}</td>
              <td andesTableCell align="end">{{ row.score }}</td>
            </tr>
          }
        </tbody>
      </andes-table>`,
  }),
};

/** Multi-line cells. */
export const MultiLineCells: Story = {
  name: 'Multi-line cells',
  parameters: about(
    'A cell can stack a name over a muted line of detail, next to an avatar, and the row grows to fit it.',
  ),
  render: () => ({
    props: { rows: makeUsers(4), muted, strong },
    template: `
      <andes-table style="max-width: 44rem;">
        <thead andesTableHeader>
          <tr andesTableRow>
            <th andesTableHead>Member</th>
            <th andesTableHead>Role</th>
            <th andesTableHead>City</th>
          </tr>
        </thead>
        <tbody andesTableBody>
          @for (row of rows; track row.id) {
            <tr andesTableRow>
              <td andesTableCell>
                <span style="display: flex; align-items: center; gap: 0.75rem;">
                  <andes-avatar size="sm"><andes-avatar-fallback>{{ row.initials }}</andes-avatar-fallback></andes-avatar>
                  <span style="display: flex; flex-direction: column;">
                    <span [style]="strong">{{ row.name }}</span>
                    <span [style]="muted">{{ row.email }}</span>
                  </span>
                </span>
              </td>
              <td andesTableCell>{{ row.role }}</td>
              <td andesTableCell>{{ row.city }}</td>
            </tr>
          }
        </tbody>
      </andes-table>`,
  }),
};

/** Numeric columns. */
export const NumericColumns: Story = {
  name: 'Numeric columns',
  parameters: about(
    'Numbers sit at the end of their column in figures of equal width, so the places line up, and a trend icon says which way a value went.',
  ),
  render: () => ({
    props: {
      rows: makeOrders(5).map((order, i) => ({
        ...order,
        change: (i % 2 === 0 ? 1 : -1) * (2 + i * 1.5),
      })),
      money,
      iconText,
    },
    template: `
      <andes-table style="max-width: 40rem;">
        <thead andesTableHeader>
          <tr andesTableRow>
            <th andesTableHead>Invoice</th>
            <th andesTableHead align="end">Items</th>
            <th andesTableHead align="end">Total</th>
            <th andesTableHead align="end">Change</th>
          </tr>
        </thead>
        <tbody andesTableBody>
          @for (row of rows; track row.id) {
            <tr andesTableRow>
              <td andesTableCell>{{ row.id }}</td>
              <td andesTableCell align="end">{{ row.items }}</td>
              <td andesTableCell align="end">{{ money(row.total) }}</td>
              <td andesTableCell align="end">
                <span [style]="iconText" [style.color]="row.change > 0 ? 'var(--andes-color-success-text, #15803d)' : 'var(--andes-color-danger-text, #b91c1c)'">
                  @if (row.change > 0) {
                    <ng-icon name="lucideTrendingUp" />
                  } @else {
                    <ng-icon name="lucideTrendingDown" />
                  }
                  {{ row.change > 0 ? '+' : '' }}{{ row.change }}%
                </span>
              </td>
            </tr>
          }
        </tbody>
      </andes-table>`,
  }),
};

/** Row headers. */
export const RowHeaders: Story = {
  name: 'Row headers',
  parameters: about(
    'The first cell of a row can be a row header, so a screen reader announces it for every value in that row.',
  ),
  render: () => ({
    props: {
      rows: [
        { quarter: 'First quarter', north: 120, south: 98, east: 143 },
        { quarter: 'Second quarter', north: 134, south: 105, east: 150 },
        { quarter: 'Third quarter', north: 128, south: 112, east: 161 },
      ],
    },
    template: `
      <andes-table style="max-width: 40rem;">
        <thead andesTableHeader>
          <tr andesTableRow>
            <th andesTableHead>Sales</th>
            <th andesTableHead align="end">North</th>
            <th andesTableHead align="end">South</th>
            <th andesTableHead align="end">East</th>
          </tr>
        </thead>
        <tbody andesTableBody>
          @for (row of rows; track row.quarter) {
            <tr andesTableRow>
              <th andesTableHead scope="row">{{ row.quarter }}</th>
              <td andesTableCell align="end">{{ row.north }}</td>
              <td andesTableCell align="end">{{ row.south }}</td>
              <td andesTableCell align="end">{{ row.east }}</td>
            </tr>
          }
        </tbody>
      </andes-table>`,
  }),
};

/** Cards. */
export const CardsOnPhones: Story = {
  name: 'Cards on phones',
  parameters: about(
    'With cards set to a breakpoint, every row below that viewport width becomes a card of label and value lines (narrow the window to see it).',
  ),
  render: () => ({
    props: { rows: makeUsers(4) },
    template: `
      <andes-table cards="md" style="max-width: 44rem;">
        <thead andesTableHeader>
          <tr andesTableRow>
            <th andesTableHead>Name</th>
            <th andesTableHead>Role</th>
            <th andesTableHead>City</th>
            <th andesTableHead align="end">Score</th>
          </tr>
        </thead>
        <tbody andesTableBody>
          @for (row of rows; track row.id) {
            <tr andesTableRow>
              <td andesTableCell label="Name">{{ row.name }}</td>
              <td andesTableCell label="Role">{{ row.role }}</td>
              <td andesTableCell label="City">{{ row.city }}</td>
              <td andesTableCell label="Score" align="end">{{ row.score }}</td>
            </tr>
          }
        </tbody>
      </andes-table>`,
  }),
};
