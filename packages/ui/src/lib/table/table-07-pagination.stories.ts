import { computed, signal } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular';

import {
  about,
  bar,
  control,
  makeOrders,
  makeUsers,
  mockFetch,
  money,
  muted,
  stack,
  strong,
  type User,
  withDescription,
  withTableKit,
} from '../../testing/table-story-kit';
import { AndesTable } from './table';
import type { AndesTableRowKey } from './table-context';
import { andesPaginateRows } from './table-data';
import { andesSortRows, type AndesSortState } from './table-sort';

/*
 * Paging: the table has no pager of its own, it uses the library's pagination in the table layout
 * (rows per page, the range, first / previous / next / last) in the slot above or below the rows.
 */

const meta: Meta<AndesTable> = {
  title: 'Data Display/Table/Pagination',
  component: AndesTable,
  tags: ['autodocs'],
  decorators: [withDescription, withTableKit],
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<AndesTable>;

/** The three columns most of these stories show. */
const HEAD = `
  <thead andesTableHeader>
    <tr andesTableRow>
      <th andesTableHead>Name</th>
      <th andesTableHead>Role</th>
      <th andesTableHead>City</th>
    </tr>
  </thead>`;

const ROW = `
  <td andesTableCell>{{ user.name }}</td>
  <td andesTableCell>{{ user.role }}</td>
  <td andesTableCell>{{ user.city }}</td>`;

/** A pager state over `count` users. */
function pager(count: number, size = 5) {
  const all = makeUsers(count);
  const page = signal(1);
  const pageSize = signal(size);
  return {
    all,
    page,
    pageSize,
    rows: computed(() => andesPaginateRows(all, page(), pageSize())),
  };
}

/** The basic pager. */
export const Basic: Story = {
  name: 'Basic pagination',
  parameters: about(
    'The pager under the rows uses the table layout: the number of rows per page, the range on show and the first, previous, next and last buttons.',
  ),
  render: () => {
    const state = pager(47);
    return {
      props: state,
      template: `
        <andes-table style="max-width: 44rem;">
          ${HEAD}
          <tbody andesTableBody>
            @for (user of rows(); track user.id) {
              <tr andesTableRow>${ROW}</tr>
            }
          </tbody>
          <div andesTableBottom class="andes-table__toolbar">
            <andes-pagination style="width: 100%;" layout="table" align="end" [(current)]="page" [(pageSize)]="pageSize" [total]="all.length" [pageSizeOptions]="[5, 10, 20]" />
          </div>
        </andes-table>`,
    };
  },
};

/** Where the pager sits. */
export const Positions: Story = {
  name: 'Pager positions',
  parameters: about(
    'Choose where the pager goes: above or below the rows, at the start, the centre or the end, or nowhere at all.',
  ),
  render: () => {
    const state = pager(47);
    return {
      props: {
        ...state,
        vertical: signal<string>('bottom'),
        horizontal: signal<string>('end'),
        control,
        bar,
      },
      template: `
        <div style="${stack} max-width: 44rem;">
          <div [style]="bar">
            <span [style]="control">Vertical
              <andes-segmented size="sm" aria-label="Vertical" [value]="vertical()" (valueChange)="vertical.set($event)" [options]="['top', 'bottom', 'none']" />
            </span>
            <span [style]="control">Horizontal
              <andes-segmented size="sm" aria-label="Horizontal" [value]="horizontal()" (valueChange)="horizontal.set($event)" [options]="['start', 'center', 'end']" />
            </span>
          </div>
          <andes-table>
            @if (vertical() === 'top') {
              <div andesTableTop class="andes-table__toolbar">
                <andes-pagination style="width: 100%;" layout="table" [align]="$any(horizontal())" [(current)]="page" [(pageSize)]="pageSize" [total]="all.length" [pageSizeOptions]="[5, 10, 20]" />
              </div>
            }
            ${HEAD}
            <tbody andesTableBody>
              @for (user of rows(); track user.id) {
                <tr andesTableRow>${ROW}</tr>
              }
            </tbody>
            @if (vertical() === 'bottom') {
              <div andesTableBottom class="andes-table__toolbar">
                <andes-pagination style="width: 100%;" layout="table" [align]="$any(horizontal())" [(current)]="page" [(pageSize)]="pageSize" [total]="all.length" [pageSizeOptions]="[5, 10, 20]" />
              </div>
            }
          </andes-table>
        </div>`,
    };
  },
};

/** Top and bottom. */
export const TopAndBottom: Story = {
  name: 'Pager above and below',
  parameters: about(
    'A long table can carry a pager above and another below, both bound to the same page so they always agree.',
  ),
  render: () => {
    const state = pager(47, 4);
    return {
      props: state,
      template: `
        <andes-table style="max-width: 44rem;">
          <div andesTableTop class="andes-table__toolbar">
            <andes-pagination style="width: 100%;" layout="compact" align="end" size="small" [(current)]="page" [pageSize]="pageSize()" [total]="all.length" />
          </div>
          ${HEAD}
          <tbody andesTableBody>
            @for (user of rows(); track user.id) {
              <tr andesTableRow>${ROW}</tr>
            }
          </tbody>
          <div andesTableBottom class="andes-table__toolbar">
            <andes-pagination style="width: 100%;" layout="table" align="end" [(current)]="page" [(pageSize)]="pageSize" [total]="all.length" [pageSizeOptions]="[4, 8, 12]" />
          </div>
        </andes-table>`,
    };
  },
};

/** The total. */
export const Total: Story = {
  name: 'Total text',
  parameters: about(
    'A function builds the text of the total, here the range on show and the number of rows in all.',
  ),
  render: () => {
    const state = pager(47);
    return {
      props: {
        ...state,
        text: (total: number, range: [number, number]) =>
          `Showing ${range[0]} to ${range[1]} of ${total} people`,
      },
      template: `
        <andes-table style="max-width: 44rem;">
          ${HEAD}
          <tbody andesTableBody>
            @for (user of rows(); track user.id) {
              <tr andesTableRow>${ROW}</tr>
            }
          </tbody>
          <div andesTableBottom class="andes-table__toolbar">
            <andes-pagination style="width: 100%;" [showTotal]="text" [(current)]="page" [(pageSize)]="pageSize" [total]="all.length" [showSizeChanger]="false" align="end" />
          </div>
        </andes-table>`,
    };
  },
};

/** Sizes. */
export const Sizes: Story = {
  name: 'Pager sizes',
  parameters: about(
    'The pager comes in a small, a default and a large size, and a small table pairs well with a small pager.',
  ),
  render: () => {
    const state = pager(47);
    return {
      props: {
        ...state,
        sizes: ['small', 'default', 'large'],
        density: { small: 'compact', default: 'default', large: 'comfortable' },
      },
      template: `
        <div style="${stack} max-width: 44rem;">
          @for (size of sizes; track size) {
            <andes-table [density]="$any(density)[size]">
              ${HEAD}
              <tbody andesTableBody>
                @for (user of rows().slice(0, 3); track user.id) {
                  <tr andesTableRow>${ROW}</tr>
                }
              </tbody>
              <div andesTableBottom class="andes-table__toolbar">
                <andes-pagination style="width: 100%;" layout="table" align="end" [size]="$any(size)" [(current)]="page" [(pageSize)]="pageSize" [total]="all.length" />
              </div>
            </andes-table>
          }
        </div>`,
    };
  },
};

/** Page size choices. */
export const PageSizes: Story = {
  name: 'Rows per page',
  parameters: about(
    'The rows per page are chosen from a list, and changing it keeps the first row of the page on show.',
  ),
  render: () => {
    const state = pager(120, 10);
    return {
      props: state,
      template: `
        <andes-table style="max-width: 44rem;">
          ${HEAD}
          <tbody andesTableBody>
            @for (user of rows(); track user.id) {
              <tr andesTableRow>${ROW}</tr>
            }
          </tbody>
          <div andesTableBottom class="andes-table__toolbar">
            <andes-pagination style="width: 100%;" layout="table" align="end" [(current)]="page" [(pageSize)]="pageSize" [total]="all.length" [pageSizeOptions]="[10, 25, 50, 100]" />
          </div>
        </andes-table>`,
    };
  },
};

/** Simple pager. */
export const Simple: Story = {
  name: 'Simple pagination',
  parameters: about(
    'The simple pager is a previous button, a box for the page number and a next button.',
  ),
  render: () => {
    const state = pager(47);
    return {
      props: state,
      template: `
        <andes-table style="max-width: 44rem;">
          ${HEAD}
          <tbody andesTableBody>
            @for (user of rows(); track user.id) {
              <tr andesTableRow>${ROW}</tr>
            }
          </tbody>
          <div andesTableBottom class="andes-table__toolbar">
            <andes-pagination style="width: 100%;" simple align="end" [(current)]="page" [pageSize]="pageSize()" [total]="all.length" />
          </div>
        </andes-table>`,
    };
  },
};

/** Compact layout. */
export const Compact: Story = {
  name: 'Compact pager',
  parameters: about(
    'The compact layout writes "Page 2 of 10" between the previous and next buttons, which fits the narrowest tables.',
  ),
  render: () => {
    const state = pager(47);
    return {
      props: state,
      template: `
        <andes-table style="max-width: 32rem;">
          ${HEAD}
          <tbody andesTableBody>
            @for (user of rows(); track user.id) {
              <tr andesTableRow>${ROW}</tr>
            }
          </tbody>
          <div andesTableBottom class="andes-table__toolbar">
            <andes-pagination style="width: 100%;" layout="compact" align="center" [(current)]="page" [pageSize]="pageSize()" [total]="all.length" />
          </div>
        </andes-table>`,
    };
  },
};

/** Quick jumper. */
export const QuickJumper: Story = {
  name: 'Quick jumper',
  parameters: about(
    'A box beside the pages jumps straight to any page, useful when the table has hundreds of them.',
  ),
  render: () => {
    const state = pager(480, 10);
    return {
      props: state,
      template: `
        <andes-table style="max-width: 52rem;">
          ${HEAD}
          <tbody andesTableBody>
            @for (user of rows(); track user.id) {
              <tr andesTableRow>${ROW}</tr>
            }
          </tbody>
          <div andesTableBottom class="andes-table__toolbar">
            <andes-pagination style="width: 100%;" align="end" showQuickJumper [(current)]="page" [pageSize]="pageSize()" [total]="all.length" [showSizeChanger]="false" />
          </div>
        </andes-table>`,
    };
  },
};

/** Variants of the pager. */
export const Variants: Story = {
  name: 'Pager variants',
  parameters: about(
    'The numbered pager can be outlined, ghost or filled, with round or square items, to match the table around it.',
  ),
  render: () => {
    const state = pager(47);
    return {
      props: { ...state, variants: ['outline', 'ghost', 'filled'] },
      template: `
        <div style="${stack} max-width: 44rem;">
          @for (variant of variants; track variant) {
            <andes-table>
              ${HEAD}
              <tbody andesTableBody>
                @for (user of rows().slice(0, 2); track user.id) {
                  <tr andesTableRow>${ROW}</tr>
                }
              </tbody>
              <div andesTableBottom class="andes-table__toolbar">
                <andes-pagination style="width: 100%;" align="end" [variant]="$any(variant)" [shape]="variant === 'ghost' ? 'pill' : 'default'" [(current)]="page" [pageSize]="pageSize()" [total]="all.length" [showSizeChanger]="false" />
              </div>
            </andes-table>
          }
        </div>`,
    };
  },
};

/** One page only. */
export const HideOnSinglePage: Story = {
  name: 'Hide the pager on one page',
  parameters: about(
    'With only one page of rows the pager has nothing to offer, so it can hide itself until there are more rows.',
  ),
  render: () => {
    const count = signal(4);
    const page = signal(1);
    return {
      props: {
        count,
        page,
        rows: computed(() => makeUsers(count())),
        control,
        bar,
      },
      template: `
        <div style="${stack} max-width: 44rem;">
          <div [style]="bar">
            <andes-button size="sm" variant="outline" (click)="count.set(count() === 4 ? 14 : 4)">Switch to {{ count() === 4 ? 14 : 4 }} rows</andes-button>
          </div>
          <andes-table>
            ${HEAD}
            <tbody andesTableBody>
              @for (user of rows().slice((page() - 1) * 5, page() * 5); track user.id) {
                <tr andesTableRow>${ROW}</tr>
              }
            </tbody>
            <div andesTableBottom class="andes-table__toolbar">
              <andes-pagination style="width: 100%;" align="end" hideOnSinglePage [(current)]="page" [pageSize]="5" [total]="count()" [showSizeChanger]="false" />
            </div>
          </andes-table>
        </div>`,
    };
  },
};

/** Sorting and paging. */
export const SortedPages: Story = {
  name: 'Sorting across pages',
  parameters: about(
    'Sorting reorders the whole data, not only the rows on show, and the pager goes back to the first page when the order changes.',
  ),
  render: () => {
    const all = makeUsers(47);
    const sort = signal<AndesSortState | null>(null);
    const page = signal(1);
    const pageSize = signal(6);
    const sorted = computed(() =>
      andesSortRows(all, sort(), {
        name: (user) => user.name,
        age: (user) => user.age,
        city: (user) => user.city,
      }),
    );
    return {
      props: {
        sort,
        page,
        pageSize,
        total: all.length,
        rows: computed(() => andesPaginateRows(sorted(), page(), pageSize())),
        first: () => page.set(1),
      },
      template: `
        <andes-table style="max-width: 44rem;" [(sort)]="sort" (tableChange)="first()">
          <thead andesTableHeader>
            <tr andesTableRow>
              <th andesTableHead sortKey="name">Name</th>
              <th andesTableHead sortKey="city">City</th>
              <th andesTableHead sortKey="age" align="end">Age</th>
            </tr>
          </thead>
          <tbody andesTableBody>
            @for (user of rows(); track user.id) {
              <tr andesTableRow>
                <td andesTableCell>{{ user.name }}</td>
                <td andesTableCell>{{ user.city }}</td>
                <td andesTableCell align="end">{{ user.age }}</td>
              </tr>
            }
          </tbody>
          <div andesTableBottom class="andes-table__toolbar">
            <andes-pagination style="width: 100%;" layout="table" align="end" [(current)]="page" [(pageSize)]="pageSize" [total]="total" [pageSizeOptions]="[6, 12, 24]" />
          </div>
        </andes-table>`,
    };
  },
};

/** The selection follows the pages. */
export const SelectionAcrossPages: Story = {
  name: 'Selection across pages',
  parameters: about(
    'Rows chosen on one page stay chosen on the others, and the count in the toolbar covers all of them.',
  ),
  render: () => {
    const state = pager(47, 5);
    const selected = signal<readonly AndesTableRowKey[]>([2, 7]);
    return {
      props: { ...state, selected, muted, strong },
      template: `
        <andes-table style="max-width: 44rem;" [(selectedKeys)]="selected">
          <div andesTableTop class="andes-table__toolbar">
            <span [style]="strong">{{ selected().length }} selected</span>
            <andes-button size="sm" variant="ghost" [disabled]="!selected().length" (click)="selected.set([])">Clear selection</andes-button>
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
            @for (user of rows(); track user.id) {
              <tr andesTableRow [rowKey]="user.id">
                <td andesTableCell><andes-table-selection [label]="'Select ' + user.name" /></td>
                ${ROW}
              </tr>
            }
          </tbody>
          <div andesTableBottom class="andes-table__toolbar">
            <andes-pagination style="width: 100%;" layout="table" align="end" [(current)]="page" [(pageSize)]="pageSize" [total]="all.length" [pageSizeOptions]="[5, 10]" />
          </div>
        </andes-table>`,
    };
  },
};

/** Total from a server. */
export const ServerTotal: Story = {
  name: 'Server-side total',
  parameters: about(
    'A pretend server returns one page and the total of rows: the first load shows skeleton rows, a new page dims the rows under a spinner, and the pager keeps its last total and waits.',
  ),
  render: () => {
    const page = signal(1);
    const pageSize = signal(6);
    const rows = signal<readonly User[]>([]);
    const total = signal(0);
    const loading = signal(true);
    const load = () => {
      loading.set(true);
      mockFetch({ page: page(), pageSize: pageSize() }, 500).then((result) => {
        rows.set(result.rows);
        total.set(result.total);
        loading.set(false);
      });
    };
    load();
    return {
      props: {
        page,
        pageSize,
        rows,
        total,
        loading,
        change: () => load(),
      },
      template: `
        <andes-table style="max-width: 44rem;" [loading]="loading() ? (rows().length ? true : { type: 'skeleton', rows: pageSize() }) : false" loadingLabel="Loading people">
          ${HEAD}
          <tbody andesTableBody>
            @for (user of rows(); track user.id) {
              <tr andesTableRow>${ROW}</tr>
            }
          </tbody>
          <div andesTableBottom class="andes-table__toolbar">
            <andes-pagination style="width: 100%;" layout="table" align="end" [disabled]="loading()" [(current)]="page" [(pageSize)]="pageSize" [total]="total() || 1" [pageSizeOptions]="[6, 12, 24]" (pageChange)="change()" />
          </div>
        </andes-table>`,
    };
  },
};

/** The settings playground. */
export const SettingsPlayground: Story = {
  name: 'Dynamic settings',
  parameters: about(
    'One table with switches for its borders, loading, title, header, footer, expandable rows, selection, fixed header, data, ellipsis, size, scroll, layout and the place of the pager.',
  ),
  render: () => {
    const flags = {
      bordered: signal(false),
      loading: signal(false),
      title: signal(true),
      header: signal(true),
      footer: signal(true),
      expandable: signal(false),
      checkbox: signal(true),
      fixedHeader: signal(false),
      hasData: signal(true),
      ellipsis: signal(false),
      scroll: signal(false),
      fixed: signal(false),
    };
    const density = signal<string>('default');
    const top = signal<string>('none');
    const bottom = signal<string>('end');
    const state = pager(46, 5);
    const selected = signal<readonly AndesTableRowKey[]>([]);
    const expanded = signal<readonly AndesTableRowKey[]>([]);
    const toggles: [string, keyof typeof flags][] = [
      ['Bordered', 'bordered'],
      ['Loading', 'loading'],
      ['Title', 'title'],
      ['Header', 'header'],
      ['Footer', 'footer'],
      ['Expandable', 'expandable'],
      ['Checkbox', 'checkbox'],
      ['Fixed header', 'fixedHeader'],
      ['Has data', 'hasData'],
      ['Ellipsis', 'ellipsis'],
      ['Scroll', 'scroll'],
      ['Fixed layout', 'fixed'],
    ];
    return {
      props: {
        ...state,
        flags,
        toggles,
        density,
        top,
        bottom,
        selected,
        expanded,
        data: computed(() => (flags.hasData() ? state.rows() : [])),
        total: computed(() => (flags.hasData() ? state.all.length : 0)),
        control,
        bar,
        muted,
      },
      template: `
        <div style="${stack} max-width: 60rem;">
          <div [style]="bar">
            @for (toggle of toggles; track toggle[1]) {
              <span [style]="control"><andes-switch size="sm" [checked]="$any(flags)[toggle[1]]()" (checkedChange)="$any(flags)[toggle[1]].set($event)">{{ toggle[0] }}</andes-switch></span>
            }
          </div>
          <div [style]="bar">
            <span [style]="control">Size
              <andes-segmented size="sm" aria-label="Size" [value]="density()" (valueChange)="density.set($event)" [options]="['compact', 'default', 'comfortable']" />
            </span>
            <span [style]="control">Pager above
              <andes-segmented size="sm" aria-label="Pager above" [value]="top()" (valueChange)="top.set($event)" [options]="['none', 'start', 'center', 'end']" />
            </span>
            <span [style]="control">Pager below
              <andes-segmented size="sm" aria-label="Pager below" [value]="bottom()" (valueChange)="bottom.set($event)" [options]="['none', 'start', 'center', 'end']" />
            </span>
          </div>
          <andes-table
            [bordered]="flags.bordered()" [loading]="flags.loading()" [density]="$any(density())"
            [scrollY]="flags.fixedHeader() ? '12rem' : undefined" [scrollX]="flags.scroll() ? '60rem' : undefined"
            [tableLayout]="flags.fixed() || flags.ellipsis() ? 'fixed' : 'auto'"
            [(selectedKeys)]="selected" [(expandedKeys)]="expanded"
          >
            @if (top() !== 'none') {
              <div andesTableTop class="andes-table__toolbar">
                <andes-pagination style="width: 100%;" layout="table" [align]="$any(top())" [(current)]="page" [(pageSize)]="pageSize" [total]="total()" [pageSizeOptions]="[5, 10]" />
              </div>
            }
            @if (flags.title()) {
              <caption andesTableCaption>People of the project</caption>
            }
            @if (flags.header()) {
              <thead andesTableHeader>
                <tr andesTableRow>
                  @if (flags.expandable()) { <th andesTableHead style="width: 3rem;"></th> }
                  @if (flags.checkbox()) { <th andesTableHead style="width: 3rem;"><andes-table-select-all /></th> }
                  <th andesTableHead style="width: 14rem;">Name</th>
                  <th andesTableHead>Role</th>
                  <th andesTableHead [ellipsis]="flags.ellipsis()" style="width: 10rem;">City</th>
                  <th andesTableHead [ellipsis]="flags.ellipsis()">Email</th>
                </tr>
              </thead>
            }
            <tbody andesTableBody>
              @for (user of data(); track user.id) {
                <tr andesTableRow [rowKey]="user.id">
                  @if (flags.expandable()) { <td andesTableCell><andes-table-expand-toggle [label]="'Details of ' + user.name" /></td> }
                  @if (flags.checkbox()) { <td andesTableCell><andes-table-selection [label]="'Select ' + user.name" /></td> }
                  <td andesTableCell>{{ user.name }}</td>
                  <td andesTableCell>{{ user.role }}</td>
                  <td andesTableCell [ellipsis]="flags.ellipsis()">{{ user.city }}</td>
                  <td andesTableCell [ellipsis]="flags.ellipsis()">{{ user.email }}</td>
                </tr>
                @if (flags.expandable()) {
                  <tr *andesTableExpandedRow="user.id">
                    <td andesTableCell colspan="6"><span [style]="muted">{{ user.name }} joined on {{ user.joined }}.</span></td>
                  </tr>
                }
              } @empty {
                <tr andesTableRow><td andesTableCell colspan="6"><andes-table-empty /></td></tr>
              }
            </tbody>
            @if (flags.footer()) {
              <tfoot andesTableFooter>
                <tr andesTableRow>
                  <td andesTableCell colspan="6">{{ total() }} people in all</td>
                </tr>
              </tfoot>
            }
            @if (bottom() !== 'none') {
              <div andesTableBottom class="andes-table__toolbar">
                <andes-pagination style="width: 100%;" layout="table" [align]="$any(bottom())" [(current)]="page" [(pageSize)]="pageSize" [total]="total()" [pageSizeOptions]="[5, 10]" />
              </div>
            }
          </andes-table>
        </div>`,
    };
  },
};

/** Orders by page with a total row. */
export const PageTotals: Story = {
  name: 'Totals of the page',
  parameters: about(
    'A footer row adds up the amounts of the page on show while the toolbar gives the total of all the pages.',
  ),
  render: () => {
    const all = makeOrders(30);
    const page = signal(1);
    const pageSize = signal(5);
    const rows = computed(() => andesPaginateRows(all, page(), pageSize()));
    return {
      props: {
        page,
        pageSize,
        rows,
        total: all.length,
        pageSum: computed(() =>
          money(rows().reduce((sum, row) => sum + row.total, 0)),
        ),
        allSum: money(all.reduce((sum, row) => sum + row.total, 0)),
        money,
        muted,
      },
      template: `
        <andes-table style="max-width: 44rem;">
          <div andesTableTop class="andes-table__toolbar">
            <span [style]="muted">All pages: {{ allSum }}</span>
          </div>
          <thead andesTableHeader>
            <tr andesTableRow>
              <th andesTableHead>Invoice</th>
              <th andesTableHead>Customer</th>
              <th andesTableHead align="end">Total</th>
            </tr>
          </thead>
          <tbody andesTableBody>
            @for (row of rows(); track row.id) {
              <tr andesTableRow>
                <td andesTableCell>{{ row.id }}</td>
                <td andesTableCell>{{ row.customer }}</td>
                <td andesTableCell align="end">{{ money(row.total) }}</td>
              </tr>
            }
          </tbody>
          <tfoot andesTableFooter>
            <tr andesTableRow>
              <td andesTableCell colspan="2">This page</td>
              <td andesTableCell align="end">{{ pageSum() }}</td>
            </tr>
          </tfoot>
          <div andesTableBottom class="andes-table__toolbar">
            <andes-pagination style="width: 100%;" layout="table" align="end" [(current)]="page" [(pageSize)]="pageSize" [total]="total" [pageSizeOptions]="[5, 10]" />
          </div>
        </andes-table>`,
    };
  },
};
