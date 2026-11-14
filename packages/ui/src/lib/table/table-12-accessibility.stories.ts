import { signal } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular';

import {
  about,
  bar,
  card,
  control,
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
import { andesOrderColumns } from './table-data';
import type { AndesSortState } from './table-sort';

/*
 * Using the table without a mouse and with assistive tech: the grid keys, the sort and count
 * attributes, row headers, announcements, motion, right to left, phones, the dark theme and the
 * focus ring.
 */

const meta: Meta<AndesTable> = {
  title: 'Data Display/Table/Accessibility and keyboard',
  component: AndesTable,
  tags: ['autodocs'],
  decorators: [withDescription, withTableKit],
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<AndesTable>;

/** Grid keys. */
export const GridNavigation: Story = {
  name: 'Grid navigation',
  parameters: about(
    'With grid navigation one cell is the tab stop and the arrow keys, Home, End, Page Up and Page Down move between cells, so a long table costs one Tab to cross.',
  ),
  render: () => ({
    props: { users: makeUsers(8), muted },
    template: `
      <div style="${stack} max-width: 44rem;">
        <p [style]="muted" style="margin: 0;">Tab into the table, then use the arrow keys. Home and End go to the ends of a row, Ctrl with them to the ends of the table.</p>
        <andes-table gridNavigation>
          <caption andesTableCaption>Team members</caption>
          <thead andesTableHeader>
            <tr andesTableRow>
              <th andesTableHead>Name</th>
              <th andesTableHead>Role</th>
              <th andesTableHead>City</th>
              <th andesTableHead align="end">Score</th>
            </tr>
          </thead>
          <tbody andesTableBody>
            @for (user of users; track user.id) {
              <tr andesTableRow [rowKey]="user.id">
                <td andesTableCell>{{ user.name }}</td>
                <td andesTableCell>{{ user.role }}</td>
                <td andesTableCell>{{ user.city }}</td>
                <td andesTableCell align="end">{{ user.score }}</td>
              </tr>
            }
          </tbody>
        </andes-table>
      </div>`,
  }),
};

/** Enter to edit. */
export const EnterToEdit: Story = {
  name: 'Enter to edit',
  parameters: about(
    'Press Enter on a cell to move into the field it holds and Escape to come back to the cell, so a grid of inputs stays easy to cross with the arrow keys.',
  ),
  render: () => ({
    props: { users: makeUsers(5), muted },
    template: `
      <div style="${stack} max-width: 44rem;">
        <p [style]="muted" style="margin: 0;">Focus a cell of the Name or City column, press Enter to type, Escape to leave the field.</p>
        <andes-table gridNavigation>
          <thead andesTableHeader>
            <tr andesTableRow>
              <th andesTableHead>Name</th>
              <th andesTableHead>City</th>
              <th andesTableHead>Role</th>
            </tr>
          </thead>
          <tbody andesTableBody>
            @for (user of users; track user.id) {
              <tr andesTableRow [rowKey]="user.id">
                <td andesTableCell><andes-input size="sm" [value]="user.name" [aria-label]="'Name of ' + user.name" /></td>
                <td andesTableCell><andes-input size="sm" [value]="user.city" [aria-label]="'City of ' + user.name" /></td>
                <td andesTableCell>{{ user.role }}</td>
              </tr>
            }
          </tbody>
        </andes-table>
      </div>`,
  }),
};

/** Space to select. */
export const SpaceToSelect: Story = {
  name: 'Space to select a row',
  parameters: about(
    'On a grid, Space on any cell toggles the selection of its row, and every row says whether it is selected through aria-selected.',
  ),
  render: () => ({
    props: {
      users: makeUsers(6),
      selected: signal<readonly (string | number)[]>([]),
      muted,
    },
    template: `
      <div style="${stack} max-width: 44rem;">
        <p [style]="muted" style="margin: 0;">Move to a cell and press Space. {{ selected().length }} selected.</p>
        <andes-table gridNavigation [(selectedKeys)]="selected">
          <thead andesTableHeader>
            <tr andesTableRow>
              <th andesTableHead><andes-table-select-all label="Select all people" /></th>
              <th andesTableHead>Name</th>
              <th andesTableHead>Role</th>
              <th andesTableHead>City</th>
            </tr>
          </thead>
          <tbody andesTableBody>
            @for (user of users; track user.id) {
              <tr andesTableRow [rowKey]="user.id">
                <td andesTableCell><andes-table-selection [label]="'Select ' + user.name" /></td>
                <td andesTableCell>{{ user.name }}</td>
                <td andesTableCell>{{ user.role }}</td>
                <td andesTableCell>{{ user.city }}</td>
              </tr>
            }
          </tbody>
        </andes-table>
      </div>`,
  }),
};

/** Sort and counts. */
export const AriaSortAndCounts: Story = {
  name: 'ARIA sort and counts',
  parameters: about(
    'Sortable headers publish aria-sort, and a table that shows ten rows of two hundred publishes the real count in aria-rowcount, so a screen reader can say where the page is.',
  ),
  render: () => {
    const sort = signal<AndesSortState | null>(null);
    const counts = signal('Press the button to read the attributes.');
    return {
      props: {
        rows: makeOrders(10),
        sort,
        counts,
        bar,
        muted,
        money,
        statusColor,
        read: (root: HTMLElement) => {
          const table = root.querySelector('table');
          const sorted = root.querySelector(
            'th[aria-sort]:not([aria-sort="none"])',
          );
          counts.set(
            `aria-rowcount ${table?.getAttribute('aria-rowcount')}, aria-colcount ${table?.getAttribute('aria-colcount')}, sorted header: ${sorted ? sorted.textContent?.trim() + ' (' + sorted.getAttribute('aria-sort') + ')' : 'none'}`,
          );
        },
      },
      template: `
        <div #root style="${stack} max-width: 44rem;">
          <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 0.75rem 1.5rem;">
            <andes-button variant="outline" (click)="read(root)">Read the attributes</andes-button>
            <span [style]="muted">{{ counts() }}</span>
          </div>
          <andes-table [rowCount]="200" [(sort)]="sort">
            <caption andesTableCaption>Invoices, page 1 of 20</caption>
            <thead andesTableHeader>
              <tr andesTableRow>
                <th andesTableHead sortKey="id">Invoice</th>
                <th andesTableHead sortKey="customer">Customer</th>
                <th andesTableHead>Status</th>
                <th andesTableHead sortKey="total" align="end">Total</th>
              </tr>
            </thead>
            <tbody andesTableBody>
              @for (row of rows; track row.id) {
                <tr andesTableRow>
                  <td andesTableCell>{{ row.id }}</td>
                  <td andesTableCell>{{ row.customer }}</td>
                  <td andesTableCell><andes-tag [color]="statusColor(row.status)">{{ row.status }}</andes-tag></td>
                  <td andesTableCell align="end">{{ money(row.total) }}</td>
                </tr>
              }
            </tbody>
          </andes-table>
        </div>`,
    };
  },
};

/** Captions and row headers. */
export const RowHeaders: Story = {
  name: 'Captions and row headers',
  parameters: about(
    'The caption names the table, and a header cell with row scope names each row, so a cell is read with both its column and its row.',
  ),
  render: () => ({
    props: { regions: ['North', 'South', 'Center', 'East'], money },
    template: `
      <andes-table style="max-width: 40rem;" captionSide="top">
        <caption andesTableCaption>Revenue by region and quarter</caption>
        <thead andesTableHeader>
          <tr andesTableRow>
            <th andesTableHead>Region</th>
            <th andesTableHead align="end">Q1</th>
            <th andesTableHead align="end">Q2</th>
            <th andesTableHead align="end">Q3</th>
          </tr>
        </thead>
        <tbody andesTableBody>
          @for (region of regions; track region; let i = $index) {
            <tr andesTableRow>
              <th andesTableHead scope="row">{{ region }}</th>
              <td andesTableCell align="end">{{ money(1200 + i * 110) }}</td>
              <td andesTableCell align="end">{{ money(1350 + i * 90) }}</td>
              <td andesTableCell align="end">{{ money(1100 + i * 130) }}</td>
            </tr>
          }
        </tbody>
      </andes-table>`,
  }),
};

const COLUMNS = [
  { key: 'name', title: 'Name' },
  { key: 'role', title: 'Role' },
  { key: 'city', title: 'City' },
] as const;

/** Announcements. */
export const LiveAnnouncements: Story = {
  name: 'Live announcements',
  parameters: about(
    'The table announces loading, sorting, filtering and keyboard column moves in its own status region, and the button below reads it out so you can see what assistive tech hears.',
  ),
  render: () => {
    const order = signal<readonly string[]>([]);
    const sort = signal<AndesSortState | null>(null);
    const loading = signal(false);
    const heard = signal('Press the button to read the table status region.');
    return {
      props: {
        users: makeUsers(4),
        order,
        sort,
        loading,
        heard,
        bar,
        control,
        muted,
        columns: () =>
          andesOrderColumns(COLUMNS, order(), (column) => column.key),
        user: (row: Record<string, unknown>, key: string) => String(row[key]),
        read: (root: HTMLElement) =>
          heard.set(
            root
              .querySelector('.andes-table__sr-only[role="status"]')
              ?.textContent?.trim() || 'The status region is empty.',
          ),
      },
      template: `
        <div #root style="${stack} max-width: 44rem;">
          <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 0.75rem 1.5rem;">
            <span [style]="control"><andes-switch [checked]="loading()" (checkedChange)="loading.set($event)">Loading</andes-switch></span>
            <andes-button variant="outline" (click)="read(root)">Read the status region</andes-button>
          </div>
          <p [style]="muted" style="margin: 0;">Table status: {{ heard() }}</p>
          <andes-table reorderable [loading]="loading()" loadingLabel="Loading the team" [(columnOrder)]="order" [(sort)]="sort">
            <thead andesTableHeader>
              <tr andesTableRow>
                @for (column of columns(); track column.key) {
                  <th andesTableHead [columnKey]="column.key" [sortKey]="column.key">{{ column.title }}</th>
                }
              </tr>
            </thead>
            <tbody andesTableBody>
              @for (row of users; track row.id) {
                <tr andesTableRow>
                  @for (column of columns(); track column.key) {
                    <td andesTableCell>{{ user(row, column.key) }}</td>
                  }
                </tr>
              }
            </tbody>
          </andes-table>
        </div>`,
    };
  },
};

/** Reduced motion. */
export const ReducedMotion: Story = {
  name: 'Reduced motion',
  parameters: about(
    'The chevron turn, the row hover and the loading spinner slow down or stop when the system asks for reduced motion, and nothing depends on the motion to be understood.',
  ),
  render: () => ({
    props: { users: makeUsers(4), muted },
    template: `
      <div style="${stack} max-width: 40rem;">
        <p [style]="muted" style="margin: 0;">Turn on reduced motion in the system settings and open a row: the chevron changes without turning.</p>
        <andes-table>
          <thead andesTableHeader>
            <tr andesTableRow>
              <th andesTableHead><span class="andes-table__sr-only">Details</span></th>
              <th andesTableHead>Name</th>
              <th andesTableHead>Role</th>
            </tr>
          </thead>
          <tbody andesTableBody>
            @for (user of users; track user.id) {
              <tr andesTableRow [rowKey]="user.id">
                <td andesTableCell><andes-table-expand-toggle [label]="'Details of ' + user.name" /></td>
                <td andesTableCell>{{ user.name }}</td>
                <td andesTableCell>{{ user.role }}</td>
              </tr>
              <tr *andesTableExpandedRow="user.id">
                <td andesTableCell colspan="3">{{ user.email }} · {{ user.city }}</td>
              </tr>
            }
          </tbody>
        </andes-table>
      </div>`,
  }),
};

/** Right to left. */
export const RightToLeft: Story = {
  name: 'Right to left layout',
  parameters: about(
    'In a right to left page the columns, the sort marks, the pinned column, the expand toggles and the scroll shadows all mirror.',
  ),
  render: () => ({
    props: { users: makeUsers(5) },
    template: `
      <div dir="rtl" style="max-width: 34rem;">
        <andes-table pinIcon scrollX="760">
          <thead andesTableHeader>
            <tr andesTableRow>
              <th andesTableHead fixed="start" [width]="200" sortKey="name">Name</th>
              <th andesTableHead [width]="60"><span class="andes-table__sr-only">Details</span></th>
              <th andesTableHead [width]="130" sortKey="role">Role</th>
              <th andesTableHead [width]="130">City</th>
              <th andesTableHead [width]="260">Email</th>
            </tr>
          </thead>
          <tbody andesTableBody>
            @for (user of users; track user.id) {
              <tr andesTableRow [rowKey]="user.id">
                <td andesTableCell fixed="start">{{ user.name }}</td>
                <td andesTableCell><andes-table-expand-toggle [label]="'Details of ' + user.name" /></td>
                <td andesTableCell>{{ user.role }}</td>
                <td andesTableCell>{{ user.city }}</td>
                <td andesTableCell>{{ user.email }}</td>
              </tr>
              <tr *andesTableExpandedRow="user.id">
                <td andesTableCell colspan="5">{{ user.city }}</td>
              </tr>
            }
          </tbody>
        </andes-table>
      </div>`,
  }),
};

/** Cards on phones. */
export const CardsOnPhones: Story = {
  name: 'Cards on phones with labelled cells',
  parameters: {
    ...about(
      'Below the breakpoint each row becomes a card of label and value lines, the header row leaves the screen for sighted users and stays for assistive tech.',
    ),
    viewport: { defaultViewport: 'mobile1' },
  },
  render: () => ({
    props: { rows: makeOrders(4), money, statusColor, muted },
    template: `
      <div style="${stack} max-width: 44rem;">
        <p [style]="muted" style="margin: 0;">Narrow the window below 768px, or pick a phone in the viewport menu, to see the cards.</p>
        <andes-table cards="md">
          <thead andesTableHeader>
            <tr andesTableRow>
              <th andesTableHead>Invoice</th>
              <th andesTableHead>Customer</th>
              <th andesTableHead>Status</th>
              <th andesTableHead align="end">Total</th>
            </tr>
          </thead>
          <tbody andesTableBody>
            @for (row of rows; track row.id) {
              <tr andesTableRow>
                <td andesTableCell label="Invoice">{{ row.id }}</td>
                <td andesTableCell label="Customer">{{ row.customer }}</td>
                <td andesTableCell label="Status"><andes-tag [color]="statusColor(row.status)">{{ row.status }}</andes-tag></td>
                <td andesTableCell align="end" label="Total">{{ money(row.total) }}</td>
              </tr>
            }
          </tbody>
        </andes-table>
      </div>`,
  }),
};

/** Dark theme. */
export const DarkTheme: Story = {
  name: 'Dark theme with selection and tags',
  parameters: about(
    'On a dark surface the text, the lines, the stripes, the selected tint and the tags keep their contrast, because every colour comes from a token.',
  ),
  render: () => ({
    props: {
      rows: makeOrders(6),
      selected: signal<readonly (string | number)[]>(['INV-002']),
      money,
      statusColor,
    },
    template: `
      <div data-andes-theme="dark" style="${card} max-width: 46rem; background: var(--andes-color-background); padding: 1.5rem;">
        <andes-table striped [(selectedKeys)]="selected">
          <thead andesTableHeader>
            <tr andesTableRow>
              <th andesTableHead><andes-table-select-all label="Select all invoices" /></th>
              <th andesTableHead sortKey="id">Invoice</th>
              <th andesTableHead>Customer</th>
              <th andesTableHead>Status</th>
              <th andesTableHead align="end">Total</th>
            </tr>
          </thead>
          <tbody andesTableBody>
            @for (row of rows; track row.id) {
              <tr andesTableRow [rowKey]="row.id">
                <td andesTableCell><andes-table-selection [label]="'Select ' + row.id" /></td>
                <td andesTableCell>{{ row.id }}</td>
                <td andesTableCell>{{ row.customer }}</td>
                <td andesTableCell><andes-tag [color]="statusColor(row.status)">{{ row.status }}</andes-tag></td>
                <td andesTableCell align="end">{{ money(row.total) }}</td>
              </tr>
            }
          </tbody>
        </andes-table>
      </div>`,
  }),
};

/** Focus rings. */
export const FocusRings: Story = {
  name: 'Focus visible rings',
  parameters: about(
    'Every stop of the keyboard, a sortable header, a cell of the grid, a toggle, a checkbox and a button, shows a clear ring inside its own box.',
  ),
  render: () => ({
    props: { users: makeUsers(4), strong },
    template: `
      <div style="${stack} max-width: 44rem;">
        <p [style]="strong" style="margin: 0;">Press Tab, then the arrow keys</p>
        <andes-table gridNavigation>
          <thead andesTableHeader>
            <tr andesTableRow>
              <th andesTableHead><andes-table-select-all label="Select all people" /></th>
              <th andesTableHead sortKey="name">Name</th>
              <th andesTableHead sortKey="role">Role</th>
              <th andesTableHead>Actions</th>
            </tr>
          </thead>
          <tbody andesTableBody>
            @for (user of users; track user.id) {
              <tr andesTableRow [rowKey]="user.id">
                <td andesTableCell><andes-table-selection [label]="'Select ' + user.name" /></td>
                <td andesTableCell>{{ user.name }}</td>
                <td andesTableCell>{{ user.role }}</td>
                <td andesTableCell>
                  <span style="display: inline-flex; align-items: center; gap: 0.5rem;">
                    <andes-table-expand-toggle [label]="'Details of ' + user.name" />
                    <andes-button variant="ghost" size="icon-xs" [aria-label]="'Edit ' + user.name"><ng-icon name="lucidePencil" /></andes-button>
                  </span>
                </td>
              </tr>
            }
          </tbody>
        </andes-table>
      </div>`,
  }),
};

/** Print styles. */
export const PrintStyles: Story = {
  name: 'Print styles',
  parameters: about(
    'On paper the table shows every row without a scroll box, drops the sort arrows, filters, toggles and resize handles, repeats the header on every page and never splits a row.',
  ),
  render: () => ({
    props: { users: makeUsers(8), muted },
    template: `
      <div style="${stack} max-width: 44rem;">
        <p [style]="muted" style="margin: 0;">Use the browser print preview on this page to see the print layout.</p>
        <andes-table scrollY="8rem">
          <thead andesTableHeader>
            <tr andesTableRow>
              <th andesTableHead sortKey="name">Name</th>
              <th andesTableHead sortKey="role">Role</th>
              <th andesTableHead>City</th>
            </tr>
          </thead>
          <tbody andesTableBody>
            @for (row of users; track row.id) {
              <tr andesTableRow>
                <td andesTableCell>{{ row.name }}</td>
                <td andesTableCell>{{ row.role }}</td>
                <td andesTableCell>{{ row.city }}</td>
              </tr>
            }
          </tbody>
        </andes-table>
      </div>`,
  }),
};
