import { computed, signal } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular';

import {
  about,
  bar,
  control,
  iconText,
  makeUsers,
  muted,
  stack,
  statusColor,
  strong,
  type User,
  withDescription,
  withTableKit,
} from '../../testing/table-story-kit';
import { AndesTable } from './table';
import {
  andesOrderColumns,
  andesRowsToCsv,
  andesVisibleColumns,
} from './table-data';

/*
 * The bar around a table: the toolbar slots, a search box, the columns menu, the density switch,
 * a reload button and the export of the rows as CSV (copied or downloaded).
 */

const meta: Meta<AndesTable> = {
  title: 'Data Display/Table/Toolbars and export',
  component: AndesTable,
  tags: ['autodocs'],
  decorators: [withDescription, withTableKit],
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<AndesTable>;

const COLUMNS = [
  { key: 'name', title: 'Name' },
  { key: 'email', title: 'Email' },
  { key: 'role', title: 'Role' },
  { key: 'city', title: 'City' },
  { key: 'age', title: 'Age' },
] as const;

const cell = (user: User, key: string): string =>
  String((user as unknown as Record<string, unknown>)[key]);

/** Title and actions in the slots. */
export const ToolbarSlot: Story = {
  name: 'Toolbar slot',
  parameters: about(
    'Content marked with the top slot sits above the table in a bar with a start side for the title and an end side for the actions.',
  ),
  render: () => ({
    props: { users: makeUsers(5), strong, iconText },
    template: `
      <andes-table style="max-width: 44rem;">
        <div andesTableTop class="andes-table__toolbar">
          <span [style]="strong">Team members</span>
          <span [style]="iconText">
            <andes-button variant="outline" size="sm"><ng-icon slot="icon-start" name="lucideDownload" />Export</andes-button>
            <andes-button size="sm"><ng-icon slot="icon-start" name="lucidePlus" />Add member</andes-button>
          </span>
        </div>
        <thead andesTableHeader>
          <tr andesTableRow>
            <th andesTableHead>Name</th>
            <th andesTableHead>Role</th>
            <th andesTableHead>City</th>
          </tr>
        </thead>
        <tbody andesTableBody>
          @for (user of users; track user.id) {
            <tr andesTableRow>
              <td andesTableCell>{{ user.name }}</td>
              <td andesTableCell>{{ user.role }}</td>
              <td andesTableCell>{{ user.city }}</td>
            </tr>
          }
        </tbody>
      </andes-table>`,
  }),
};

/** A search box over the rows. */
export const SearchToolbar: Story = {
  name: 'Search toolbar',
  parameters: about(
    'A search box in the toolbar narrows the rows as you type, with the count of matches and a clear button.',
  ),
  render: () => {
    const query = signal('');
    const all = makeUsers(14);
    const rows = computed(() =>
      all.filter((user) =>
        `${user.name} ${user.email} ${user.city}`
          .toLowerCase()
          .includes(query().trim().toLowerCase()),
      ),
    );
    return {
      props: { query, rows, total: all.length, muted },
      template: `
        <andes-table style="max-width: 48rem;">
          <div andesTableTop class="andes-table__toolbar">
            <andes-input placeholder="Search people" aria-label="Search people" style="width: 16rem;" [value]="query()" (valueChange)="query.set($event)">
              <ng-icon slot="prefix" name="lucideSearch" />
            </andes-input>
            <span [style]="muted">{{ rows().length }} of {{ total }} people</span>
          </div>
          <thead andesTableHeader>
            <tr andesTableRow>
              <th andesTableHead>Name</th>
              <th andesTableHead>Email</th>
              <th andesTableHead>City</th>
            </tr>
          </thead>
          <tbody andesTableBody>
            @for (user of rows(); track user.id) {
              <tr andesTableRow>
                <td andesTableCell>{{ user.name }}</td>
                <td andesTableCell>{{ user.email }}</td>
                <td andesTableCell>{{ user.city }}</td>
              </tr>
            } @empty {
              <tr andesTableRow>
                <td andesTableCell colspan="3"><andes-table-empty>Nobody matches "{{ query() }}"</andes-table-empty></td>
              </tr>
            }
          </tbody>
        </andes-table>`,
    };
  },
};

/** The columns menu. */
export const ColumnsMenu: Story = {
  name: 'Columns menu',
  parameters: about(
    'The columns menu hides, shows and moves columns, and its reset button brings back the first arrangement.',
  ),
  render: () => {
    const order = signal<readonly string[]>(COLUMNS.map((c) => c.key));
    const hidden = signal<readonly string[]>(['email']);
    const keys = computed(() => andesVisibleColumns(order(), hidden()));
    return {
      props: {
        users: makeUsers(6),
        order,
        hidden,
        settings: COLUMNS.map((c) => ({ key: c.key, label: c.title })),
        visible: computed(() =>
          andesOrderColumns(COLUMNS, keys(), (column) => column.key).filter(
            (c) => keys().includes(c.key),
          ),
        ),
        cell,
      },
      template: `
        <andes-table style="max-width: 48rem;">
          <andes-table-column-settings andesTableTop [columns]="settings" [(order)]="order" [(hidden)]="hidden" />
          <thead andesTableHeader>
            <tr andesTableRow>
              @for (column of visible(); track column.key) {
                <th andesTableHead>{{ column.title }}</th>
              }
            </tr>
          </thead>
          <tbody andesTableBody>
            @for (user of users; track user.id) {
              <tr andesTableRow>
                @for (column of visible(); track column.key) {
                  <td andesTableCell>{{ cell(user, column.key) }}</td>
                }
              </tr>
            }
          </tbody>
        </andes-table>`,
    };
  },
};

/** Density. */
export const DensityToggle: Story = {
  name: 'Density switch in the toolbar',
  parameters: about(
    'A segmented control in the toolbar switches the row height between compact, default and comfortable.',
  ),
  render: () => {
    const density = signal<string>('default');
    return {
      props: { users: makeUsers(5), density, muted },
      template: `
        <andes-table style="max-width: 44rem;" [density]="density()">
          <div andesTableTop class="andes-table__toolbar">
            <span [style]="muted">Row height</span>
            <andes-segmented [value]="density()" (valueChange)="density.set($event)" aria-label="Density" size="sm" [options]="['compact', 'default', 'comfortable']" />
          </div>
          <thead andesTableHeader>
            <tr andesTableRow>
              <th andesTableHead>Name</th>
              <th andesTableHead>Role</th>
              <th andesTableHead>City</th>
            </tr>
          </thead>
          <tbody andesTableBody>
            @for (user of users; track user.id) {
              <tr andesTableRow>
                <td andesTableCell>{{ user.name }}</td>
                <td andesTableCell>{{ user.role }}</td>
                <td andesTableCell>{{ user.city }}</td>
              </tr>
            }
          </tbody>
        </andes-table>`,
    };
  },
};

/** Reload. */
export const RefreshToolbar: Story = {
  name: 'Refresh button',
  parameters: about(
    'The refresh button spins while the table loads and the time of the last update is written beside it.',
  ),
  render: () => {
    const loading = signal(false);
    const stamp = signal('Updated just now');
    const count = signal(0);
    return {
      props: {
        users: makeUsers(5),
        loading,
        stamp,
        muted,
        refresh: () => {
          loading.set(true);
          setTimeout(() => {
            count.update((n) => n + 1);
            stamp.set(`Updated ${count()} time${count() === 1 ? '' : 's'}`);
            loading.set(false);
          }, 900);
        },
      },
      template: `
        <andes-table style="max-width: 44rem;" [loading]="loading()">
          <div andesTableTop class="andes-table__toolbar">
            <span [style]="muted">{{ stamp() }}</span>
            <andes-button variant="outline" size="sm" [loading]="loading()" (click)="refresh()">
              <ng-icon slot="icon-start" name="lucideRefreshCw" />
              Refresh
            </andes-button>
          </div>
          <thead andesTableHeader>
            <tr andesTableRow>
              <th andesTableHead>Name</th>
              <th andesTableHead>Role</th>
              <th andesTableHead>City</th>
            </tr>
          </thead>
          <tbody andesTableBody>
            @for (user of users; track user.id) {
              <tr andesTableRow>
                <td andesTableCell>{{ user.name }}</td>
                <td andesTableCell>{{ user.role }}</td>
                <td andesTableCell>{{ user.city }}</td>
              </tr>
            }
          </tbody>
        </andes-table>`,
    };
  },
};

const CSV_COLUMNS = [
  { header: 'Name', value: (user: User) => user.name },
  { header: 'Email', value: (user: User) => user.email },
  { header: 'Role', value: (user: User) => user.role },
  { header: 'City', value: (user: User) => user.city },
  { header: 'Age', value: (user: User) => user.age },
];

/** Export as CSV text. */
export const CsvCopy: Story = {
  name: 'Copy as CSV',
  parameters: about(
    'The CSV helper turns the rows into text, and the button copies it to the clipboard with a check mark as the answer.',
  ),
  render: () => {
    const users = makeUsers(6);
    const copied = signal(false);
    return {
      props: {
        users,
        copied,
        csv: andesRowsToCsv(users, CSV_COLUMNS),
        copy: () => {
          navigator.clipboard
            ?.writeText(andesRowsToCsv(users, CSV_COLUMNS))
            .catch(() => undefined);
          copied.set(true);
          setTimeout(() => copied.set(false), 1600);
        },
        muted,
      },
      template: `
        <div style="${stack} max-width: 48rem;">
          <andes-table>
            <div andesTableTop class="andes-table__toolbar">
              <span [style]="muted">{{ users.length }} rows</span>
              <andes-button variant="outline" size="sm" (click)="copy()">
                @if (copied()) {
                  <ng-icon slot="icon-start" name="lucideCheck" />
                  Copied
                } @else {
                  <ng-icon slot="icon-start" name="lucideCopy" />
                  Copy as CSV
                }
              </andes-button>
            </div>
            <thead andesTableHeader>
              <tr andesTableRow>
                <th andesTableHead>Name</th>
                <th andesTableHead>Email</th>
                <th andesTableHead>Role</th>
              </tr>
            </thead>
            <tbody andesTableBody>
              @for (user of users; track user.id) {
                <tr andesTableRow>
                  <td andesTableCell>{{ user.name }}</td>
                  <td andesTableCell>{{ user.email }}</td>
                  <td andesTableCell>{{ user.role }}</td>
                </tr>
              }
            </tbody>
          </andes-table>
          <p [style]="muted" style="margin: 0; white-space: pre-wrap;">{{ csv }}</p>
        </div>`,
    };
  },
};

/** Export as a file. */
export const CsvDownload: Story = {
  name: 'Download as CSV',
  parameters: about(
    'The download button builds a file from the same CSV text and saves it, using only the rows the table shows.',
  ),
  render: () => {
    const users = makeUsers(8);
    const done = signal('');
    return {
      props: {
        users,
        done,
        download: () => {
          try {
            const blob = new Blob([andesRowsToCsv(users, CSV_COLUMNS)], {
              type: 'text/csv;charset=utf-8',
            });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'team.csv';
            link.click();
            URL.revokeObjectURL(url);
            done.set(`Saved team.csv with ${users.length} rows`);
          } catch {
            done.set('The browser blocked the download');
          }
        },
        muted,
      },
      template: `
        <andes-table style="max-width: 48rem;">
          <div andesTableTop class="andes-table__toolbar">
            <span [style]="muted">{{ done() || 'Nothing exported yet' }}</span>
            <andes-button size="sm" (click)="download()">
              <ng-icon slot="icon-start" name="lucideDownload" />
              Download CSV
            </andes-button>
          </div>
          <thead andesTableHeader>
            <tr andesTableRow>
              <th andesTableHead>Name</th>
              <th andesTableHead>Role</th>
              <th andesTableHead>City</th>
            </tr>
          </thead>
          <tbody andesTableBody>
            @for (user of users; track user.id) {
              <tr andesTableRow>
                <td andesTableCell>{{ user.name }}</td>
                <td andesTableCell>{{ user.role }}</td>
                <td andesTableCell>{{ user.city }}</td>
              </tr>
            }
          </tbody>
        </andes-table>`,
    };
  },
};

/** Bulk actions. */
export const BulkActions: Story = {
  name: 'Bulk actions bar',
  parameters: about(
    'When rows are selected the toolbar turns into a bar of actions on them, with the count and a way to clear the selection.',
  ),
  render: () => {
    const selected = signal<readonly (string | number)[]>([2, 4]);
    return {
      props: { users: makeUsers(6), selected, strong, muted, iconText },
      template: `
        <andes-table style="max-width: 48rem;" [(selectedKeys)]="selected">
          <div andesTableTop class="andes-table__toolbar">
            @if (selected().length) {
              <span [style]="strong">{{ selected().length }} selected</span>
              <span [style]="iconText">
                <andes-button variant="outline" size="sm"><ng-icon slot="icon-start" name="lucideMail" />Email</andes-button>
                <andes-button variant="outline" size="sm"><ng-icon slot="icon-start" name="lucideDownload" />Export</andes-button>
                <andes-button variant="danger" size="sm"><ng-icon slot="icon-start" name="lucideTrash2" />Delete</andes-button>
                <andes-button variant="ghost" size="sm" (click)="selected.set([])"><ng-icon slot="icon-start" name="lucideX" />Clear</andes-button>
              </span>
            } @else {
              <span [style]="muted">Select people to act on them</span>
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
            @for (user of users; track user.id) {
              <tr andesTableRow [rowKey]="user.id">
                <td andesTableCell><andes-table-selection [label]="'Select ' + user.name" /></td>
                <td andesTableCell>{{ user.name }}</td>
                <td andesTableCell>{{ user.role }}</td>
                <td andesTableCell>{{ user.city }}</td>
              </tr>
            }
          </tbody>
        </andes-table>`,
    };
  },
};

/** The whole data table. */
export const DataTableToolbar: Story = {
  name: 'Full data table toolbar',
  parameters: about(
    'A search box, a role filter, the columns menu, a density switch and an export button share one toolbar over a sortable table.',
  ),
  render: () => {
    const query = signal('');
    const role = signal<string>('all');
    const density = signal<string>('default');
    const order = signal<readonly string[]>(COLUMNS.map((c) => c.key));
    const hidden = signal<readonly string[]>([]);
    const all = makeUsers(16);
    const rows = computed(() =>
      all.filter(
        (user) =>
          (role() === 'all' || user.role === role()) &&
          `${user.name} ${user.email}`
            .toLowerCase()
            .includes(query().toLowerCase()),
      ),
    );
    return {
      props: {
        query,
        role,
        density,
        order,
        hidden,
        rows,
        settings: COLUMNS.map((c) => ({ key: c.key, label: c.title })),
        visible: computed(() =>
          andesOrderColumns(COLUMNS, order(), (column) => column.key).filter(
            (c) => !hidden().includes(c.key),
          ),
        ),
        cell,
        color: statusColor,
        control,
        bar,
        muted,
      },
      template: `
        <andes-table style="max-width: 56rem;" [density]="density()">
          <div andesTableTop class="andes-table__toolbar" style="flex-wrap: wrap;">
            <span [style]="bar">
              <andes-input placeholder="Search" aria-label="Search" style="width: 14rem;" [value]="query()" (valueChange)="query.set($event)">
                <ng-icon slot="prefix" name="lucideSearch" />
              </andes-input>
              <andes-select aria-label="Role" [value]="role()" (valueChange)="role.set($any($event))" style="width: 9rem;">
                <andes-select-trigger><andes-select-value /></andes-select-trigger>
                <andes-select-content>
                  <andes-select-item value="all">All roles</andes-select-item>
                  <andes-select-item value="Admin">Admin</andes-select-item>
                  <andes-select-item value="Editor">Editor</andes-select-item>
                  <andes-select-item value="Viewer">Viewer</andes-select-item>
                  <andes-select-item value="Billing">Billing</andes-select-item>
                </andes-select-content>
              </andes-select>
            </span>
            <span [style]="bar">
              <andes-segmented [value]="density()" (valueChange)="density.set($event)" aria-label="Density" size="sm" [options]="['compact', 'default', 'comfortable']" />
              <andes-table-column-settings [columns]="settings" [(order)]="order" [(hidden)]="hidden" />
              <andes-button variant="outline" size="sm"><ng-icon slot="icon-start" name="lucideDownload" />Export</andes-button>
            </span>
          </div>
          <thead andesTableHeader>
            <tr andesTableRow>
              @for (column of visible(); track column.key) {
                <th andesTableHead>{{ column.title }}</th>
              }
            </tr>
          </thead>
          <tbody andesTableBody>
            @for (user of rows(); track user.id) {
              <tr andesTableRow>
                @for (column of visible(); track column.key) {
                  <td andesTableCell>{{ cell(user, column.key) }}</td>
                }
              </tr>
            } @empty {
              <tr andesTableRow>
                <td andesTableCell [attr.colspan]="visible().length"><andes-table-empty /></td>
              </tr>
            }
          </tbody>
        </andes-table>`,
    };
  },
};
