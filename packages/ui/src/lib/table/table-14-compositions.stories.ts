import { computed, signal } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular';

import {
  about,
  bar,
  FILES,
  iconText,
  type FileNode,
  makeOrders,
  makeProducts,
  makeTasks,
  makeUsers,
  money,
  muted,
  statusColor,
  statusIcon,
  strong,
  withDescription,
  withTableKit,
} from '../../testing/table-story-kit';
import { AndesTable } from './table';
import type { AndesTableRowKey } from './table-context';
import { andesPaginateRows } from './table-data';
import { andesSortRows, type AndesSortState } from './table-sort';
import { andesFlattenTableTree } from './table-tree';

/*
 * Whole screens built from the table and the library's other components: an admin list of users,
 * orders, invoices, a file manager, a leaderboard, project tasks, an inventory with inline editing,
 * a small table in a dialog, team members and an audit log.
 */

const meta: Meta<AndesTable> = {
  title: 'Data Display/Table/Compositions',
  component: AndesTable,
  tags: ['autodocs'],
  decorators: [withDescription, withTableKit],
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<AndesTable>;

const initials = (name: string): string =>
  name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2);

/** Admin list of users. */
export const AdminUsers: Story = {
  name: 'Admin users table',
  parameters: about(
    'An admin list with a search box, a role filter, sortable columns, row selection, a status tag with its icon, row actions and a pager.',
  ),
  render: () => {
    const all = makeUsers(48);
    const query = signal('');
    const role = signal<string>('all');
    const sort = signal<AndesSortState | null>(null);
    const selected = signal<readonly AndesTableRowKey[]>([]);
    const page = signal(1);
    const pageSize = signal(8);
    const filtered = computed(() =>
      andesSortRows(
        all.filter(
          (user) =>
            (role() === 'all' || user.role === role()) &&
            `${user.name} ${user.email}`
              .toLowerCase()
              .includes(query().trim().toLowerCase()),
        ),
        sort(),
        {
          name: (user) => user.name,
          role: (user) => user.role,
          age: (user) => user.age,
          joined: (user) => user.joined,
        },
      ),
    );
    return {
      props: {
        query,
        role,
        sort,
        selected,
        page,
        pageSize,
        total: computed(() => filtered().length),
        rows: computed(() => andesPaginateRows(filtered(), page(), pageSize())),
        color: statusColor,
        icon: statusIcon,
        initials,
        bar,
        muted,
        strong,
        iconText,
        actions: [
          { key: 'edit', label: 'Edit' },
          { key: 'invite', label: 'Resend invite' },
          { type: 'divider' },
          { key: 'delete', label: 'Delete', danger: true },
        ],
      },
      template: `
        <andes-table style="max-width: 62rem;" [(sort)]="sort" [(selectedKeys)]="selected">
          <div andesTableTop class="andes-table__toolbar" style="flex-wrap: wrap;">
            <span [style]="bar">
              <andes-input placeholder="Search users" aria-label="Search users" style="width: 15rem;" [value]="query()" (valueChange)="query.set($event); page.set(1)">
                <ng-icon slot="prefix" name="lucideSearch" />
              </andes-input>
              <andes-select aria-label="Role" [value]="role()" (valueChange)="role.set($any($event)); page.set(1)" style="width: 9rem;">
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
            <span [style]="muted">{{ selected().length ? selected().length + ' selected' : total() + ' users' }}</span>
          </div>
          <thead andesTableHeader>
            <tr andesTableRow>
              <th andesTableHead><andes-table-select-all /></th>
              <th andesTableHead sortKey="name">User</th>
              <th andesTableHead sortKey="role">Role</th>
              <th andesTableHead>Status</th>
              <th andesTableHead sortKey="joined">Joined</th>
              <th andesTableHead align="end"><span class="andes-table__sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody andesTableBody>
            @for (user of rows(); track user.id) {
              <tr andesTableRow [rowKey]="user.id">
                <td andesTableCell><andes-table-selection [label]="'Select ' + user.name" /></td>
                <td andesTableCell>
                  <span [style]="iconText">
                    <andes-avatar size="sm"><andes-avatar-fallback>{{ user.initials }}</andes-avatar-fallback></andes-avatar>
                    <span style="display: flex; flex-direction: column;">
                      <span [style]="strong">{{ user.name }}</span>
                      <span [style]="muted">{{ user.email }}</span>
                    </span>
                  </span>
                </td>
                <td andesTableCell>{{ user.role }}</td>
                <td andesTableCell>
                  <andes-tag [color]="color(user.state)"><ng-icon [name]="icon(user.state)" style="width: 0.875rem; height: 0.875rem;" /> {{ user.state }}</andes-tag>
                </td>
                <td andesTableCell>{{ user.joined }}</td>
                <td andesTableCell align="end">
                  <andes-dropdown-menu [items]="actions">
                    <andes-button andesDropdownMenuTrigger variant="ghost" size="icon-sm" [aria-label]="'Actions for ' + user.name"><ng-icon name="lucideEllipsis" /></andes-button>
                  </andes-dropdown-menu>
                </td>
              </tr>
            } @empty {
              <tr andesTableRow><td andesTableCell colspan="6"><andes-table-empty /></td></tr>
            }
          </tbody>
          <div andesTableBottom class="andes-table__toolbar">
            <andes-pagination style="width: 100%;" layout="table" align="end" [(current)]="page" [(pageSize)]="pageSize" [total]="total()" [pageSizeOptions]="[8, 16, 24]" />
          </div>
        </andes-table>`,
    };
  },
};

/** Orders. */
export const OrdersTable: Story = {
  name: 'Orders table',
  parameters: about(
    'An orders list whose status is a tag with an icon, whose totals line up on their digits and whose rows open to show the items.',
  ),
  render: () => {
    const orders = makeOrders(8);
    const expanded = signal<readonly AndesTableRowKey[]>([orders[1].id]);
    return {
      props: {
        orders,
        expanded,
        money,
        color: statusColor,
        icon: statusIcon,
        muted,
        strong,
        keys: orders.map((o) => o.id),
      },
      template: `
        <andes-table style="max-width: 56rem;" [(expandedKeys)]="expanded">
          <thead andesTableHeader>
            <tr andesTableRow>
              <th andesTableHead><andes-table-expand-all [keys]="keys" /></th>
              <th andesTableHead>Order</th>
              <th andesTableHead>Customer</th>
              <th andesTableHead>Status</th>
              <th andesTableHead>Date</th>
              <th andesTableHead align="end">Total</th>
            </tr>
          </thead>
          <tbody andesTableBody>
            @for (order of orders; track order.id) {
              <tr andesTableRow [rowKey]="order.id">
                <td andesTableCell><andes-table-expand-toggle [label]="'Details of ' + order.id" /></td>
                <td andesTableCell>{{ order.id }}</td>
                <td andesTableCell>{{ order.customer }}</td>
                <td andesTableCell><andes-tag [color]="color(order.status)"><ng-icon [name]="icon(order.status)" style="width: 0.875rem; height: 0.875rem;" /> {{ order.status }}</andes-tag></td>
                <td andesTableCell>{{ order.date }}</td>
                <td andesTableCell align="end">{{ money(order.total) }}</td>
              </tr>
              <tr *andesTableExpandedRow="order.id">
                <td andesTableCell colspan="6">
                  <span [style]="muted">{{ order.items }} items paid with {{ order.method }}</span>
                </td>
              </tr>
            }
          </tbody>
        </andes-table>`,
    };
  },
};

/** Invoices. */
export const InvoicesTable: Story = {
  name: 'Invoices with status tags',
  parameters: about(
    'Invoices with a coloured tag per status, a total in the footer and a button to pay the ones that are still open.',
  ),
  render: () => {
    const invoices = makeOrders(6);
    return {
      props: {
        invoices,
        money,
        color: statusColor,
        icon: statusIcon,
        sum: money(invoices.reduce((total, row) => total + row.total, 0)),
      },
      template: `
        <andes-table style="max-width: 52rem;">
          <caption andesTableCaption>Invoices of the quarter</caption>
          <thead andesTableHeader>
            <tr andesTableRow>
              <th andesTableHead>Invoice</th>
              <th andesTableHead>Customer</th>
              <th andesTableHead>Status</th>
              <th andesTableHead align="end">Amount</th>
              <th andesTableHead align="end"><span class="andes-table__sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody andesTableBody>
            @for (invoice of invoices; track invoice.id) {
              <tr andesTableRow>
                <td andesTableCell>{{ invoice.id }}</td>
                <td andesTableCell>{{ invoice.customer }}</td>
                <td andesTableCell><andes-tag [color]="color(invoice.status)"><ng-icon [name]="icon(invoice.status)" style="width: 0.875rem; height: 0.875rem;" /> {{ invoice.status }}</andes-tag></td>
                <td andesTableCell align="end">{{ money(invoice.total) }}</td>
                <td andesTableCell align="end">
                  @if (invoice.status === 'Pending' || invoice.status === 'Overdue') {
                    <andes-button size="sm" variant="outline">Pay now</andes-button>
                  }
                </td>
              </tr>
            }
          </tbody>
          <tfoot andesTableFooter>
            <tr andesTableRow>
              <td andesTableCell colspan="3">Total</td>
              <td andesTableCell align="end">{{ sum }}</td>
              <td andesTableCell></td>
            </tr>
          </tfoot>
        </andes-table>`,
    };
  },
};

/** File manager. */
export const FileManager: Story = {
  name: 'File manager',
  parameters: about(
    'A folder tree with an icon per kind of file, the size and date in muted columns and a menu of actions on each row.',
  ),
  render: () => {
    const expanded = signal<readonly AndesTableRowKey[]>(['docs']);
    const rows = computed(() =>
      andesFlattenTableTree<FileNode>(FILES, {
        key: (file) => file.key,
        children: (file) => file.children,
        expandedKeys: expanded(),
      }),
    );
    return {
      props: {
        expanded,
        rows,
        muted,
        iconText,
        icon: (file: FileNode, open: boolean) =>
          file.kind === 'folder'
            ? open
              ? 'lucideFolderOpen'
              : 'lucideFolder'
            : file.kind === 'image'
              ? 'lucideImage'
              : 'lucideFileText',
        size: (file: FileNode) =>
          file.kind === 'folder' ? '-' : `${file.size} KB`,
        actions: [
          { key: 'open', label: 'Open' },
          { key: 'rename', label: 'Rename' },
          { type: 'divider' },
          { key: 'delete', label: 'Delete', danger: true },
        ],
      },
      template: `
        <andes-table style="max-width: 48rem;" [(expandedKeys)]="expanded" indentSize="1.5rem">
          <thead andesTableHeader>
            <tr andesTableRow>
              <th andesTableHead>Name</th>
              <th andesTableHead align="end">Size</th>
              <th andesTableHead>Modified</th>
              <th andesTableHead align="end"><span class="andes-table__sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody andesTableBody>
            @for (node of rows(); track node.key) {
              <tr andesTableRow [rowKey]="node.key" [level]="node.level">
                <td andesTableCell indent>
                  <span [style]="iconText">
                    @if (node.hasChildren) {
                      <andes-table-expand-toggle [label]="'Open ' + node.row.name" />
                    } @else {
                      <andes-table-expand-toggle spacer />
                    }
                    <ng-icon [name]="icon(node.row, node.expanded)" />
                    {{ node.row.name }}
                  </span>
                </td>
                <td andesTableCell align="end"><span [style]="muted">{{ size(node.row) }}</span></td>
                <td andesTableCell><span [style]="muted">{{ node.row.modified }}</span></td>
                <td andesTableCell align="end">
                  <andes-dropdown-menu [items]="actions">
                    <andes-button andesDropdownMenuTrigger variant="ghost" size="icon-sm" [aria-label]="'Actions for ' + node.row.name"><ng-icon name="lucideEllipsis" /></andes-button>
                  </andes-dropdown-menu>
                </td>
              </tr>
            }
          </tbody>
        </andes-table>`,
    };
  },
};

/** Leaderboard. */
export const Leaderboard: Story = {
  name: 'Leaderboard',
  parameters: about(
    'A ranking with a medal colour for the top three, an avatar, a score bar and a trend arrow that says whether the score went up or down.',
  ),
  render: () => {
    const rows = makeUsers(8)
      .map((user, i) => ({ ...user, trend: i % 3 === 1 ? -1 : 1 }))
      .sort((a, b) => b.score - a.score);
    return {
      props: { rows, strong, muted, iconText },
      template: `
        <andes-table striped style="max-width: 46rem;">
          <thead andesTableHeader>
            <tr andesTableRow>
              <th andesTableHead style="width: 4rem;">Rank</th>
              <th andesTableHead>Player</th>
              <th andesTableHead style="width: 12rem;">Score</th>
              <th andesTableHead align="end">Trend</th>
            </tr>
          </thead>
          <tbody andesTableBody>
            @for (row of rows; track row.id; let i = $index) {
              <tr andesTableRow>
                <td andesTableCell>
                  <andes-badge standalone [count]="i + 1" size="small" [variant]="i < 3 ? 'danger' : 'secondary'" />
                </td>
                <td andesTableCell>
                  <span [style]="iconText">
                    <andes-avatar size="sm"><andes-avatar-fallback>{{ row.initials }}</andes-avatar-fallback></andes-avatar>
                    <span [style]="strong">{{ row.name }}</span>
                  </span>
                </td>
                <td andesTableCell>
                  <span [style]="iconText" style="width: 100%;">
                    <span style="flex: 1; height: 0.5rem; border-radius: 9999px; background: var(--andes-color-muted); overflow: hidden;">
                      <span style="display: block; height: 100%; background: var(--andes-color-primary);" [style.width.%]="row.score"></span>
                    </span>
                    <span [style]="muted">{{ row.score }}</span>
                  </span>
                </td>
                <td andesTableCell align="end">
                  @if (row.trend > 0) {
                    <ng-icon name="lucideTrendingUp" style="color: var(--andes-color-success-text, #15803d);" aria-label="Up" />
                  } @else {
                    <ng-icon name="lucideTrendingDown" style="color: var(--andes-color-danger-text, #b91c1c);" aria-label="Down" />
                  }
                </td>
              </tr>
            }
          </tbody>
        </andes-table>`,
    };
  },
};

/** Project tasks. */
export const ProjectTasks: Story = {
  name: 'Project tasks',
  parameters: about(
    'A task list where the status is a select in the row, the priority a tag, the progress a bar and the owner an avatar with a name.',
  ),
  render: () => {
    const tasks = signal(makeTasks(7));
    return {
      props: {
        tasks,
        setStatus: (id: number, status: string) =>
          tasks.update((list) =>
            list.map((task) =>
              task.id === id ? { ...task, status: status as never } : task,
            ),
          ),
        priorityColor: (p: string) =>
          p === 'High' ? 'danger' : p === 'Medium' ? 'warning' : 'default',
        initials,
        iconText,
        muted,
        strong,
      },
      template: `
        <andes-table style="max-width: 62rem;">
          <thead andesTableHeader>
            <tr andesTableRow>
              <th andesTableHead>Task</th>
              <th andesTableHead>Owner</th>
              <th andesTableHead style="width: 10rem;">Status</th>
              <th andesTableHead>Priority</th>
              <th andesTableHead style="width: 9rem;">Progress</th>
              <th andesTableHead>Due</th>
            </tr>
          </thead>
          <tbody andesTableBody>
            @for (task of tasks(); track task.id) {
              <tr andesTableRow>
                <td andesTableCell><span [style]="strong">{{ task.title }}</span></td>
                <td andesTableCell>
                  <span [style]="iconText">
                    <andes-avatar size="sm"><andes-avatar-fallback>{{ initials(task.owner) }}</andes-avatar-fallback></andes-avatar>
                    {{ task.owner }}
                  </span>
                </td>
                <td andesTableCell>
                  <andes-select size="sm" [aria-label]="'Status of ' + task.title" [value]="task.status" (valueChange)="setStatus(task.id, $any($event))">
                    <andes-select-trigger><andes-select-value /></andes-select-trigger>
                    <andes-select-content>
                      <andes-select-item value="Todo">Todo</andes-select-item>
                      <andes-select-item value="In progress">In progress</andes-select-item>
                      <andes-select-item value="Done">Done</andes-select-item>
                      <andes-select-item value="Blocked">Blocked</andes-select-item>
                    </andes-select-content>
                  </andes-select>
                </td>
                <td andesTableCell><andes-tag [color]="priorityColor(task.priority)">{{ task.priority }}</andes-tag></td>
                <td andesTableCell>
                  <span [style]="iconText" style="width: 100%;">
                    <span style="flex: 1; height: 0.5rem; border-radius: 9999px; background: var(--andes-color-muted); overflow: hidden;">
                      <span style="display: block; height: 100%; background: var(--andes-color-primary);" [style.width.%]="task.progress"></span>
                    </span>
                    <span [style]="muted">{{ task.progress }}%</span>
                  </span>
                </td>
                <td andesTableCell><span [style]="muted">{{ task.due }}</span></td>
              </tr>
            }
          </tbody>
        </andes-table>`,
    };
  },
};

/** Inventory. */
export const InventoryEditing: Story = {
  name: 'Inventory with inline editing',
  parameters: about(
    'An inventory where the stock and the price are number inputs in the row, a low stock tag appears under the limit and a total updates as you type.',
  ),
  render: () => {
    const items = signal(makeProducts(6));
    const set = (sku: string, field: 'stock' | 'price', value: unknown) =>
      items.update((list) =>
        list.map((item) =>
          item.sku === sku ? { ...item, [field]: Number(value ?? 0) } : item,
        ),
      );
    return {
      props: {
        items,
        set,
        worth: computed(() =>
          money(
            items().reduce((sum, item) => sum + item.stock * item.price, 0),
          ),
        ),
        strong,
        muted,
      },
      template: `
        <andes-table style="max-width: 52rem;">
          <thead andesTableHeader>
            <tr andesTableRow>
              <th andesTableHead>Product</th>
              <th andesTableHead>Category</th>
              <th andesTableHead style="width: 9rem;">Stock</th>
              <th andesTableHead style="width: 9rem;">Price</th>
              <th andesTableHead>State</th>
            </tr>
          </thead>
          <tbody andesTableBody>
            @for (item of items(); track item.sku) {
              <tr andesTableRow>
                <td andesTableCell>
                  <span style="display: flex; flex-direction: column;">
                    <span [style]="strong">{{ item.name }}</span>
                    <span [style]="muted">{{ item.sku }}</span>
                  </span>
                </td>
                <td andesTableCell>{{ item.category }}</td>
                <td andesTableCell><andes-input-number size="sm" [min]="0" [aria-label]="'Stock of ' + item.name" [value]="item.stock" (valueChange)="set(item.sku, 'stock', $event)" /></td>
                <td andesTableCell><andes-input-number size="sm" [min]="0" [precision]="2" [aria-label]="'Price of ' + item.name" [value]="item.price" (valueChange)="set(item.sku, 'price', $event)" /></td>
                <td andesTableCell>
                  @if (item.stock < 20) {
                    <andes-tag color="warning"><ng-icon name="lucideTriangleAlert" style="width: 0.875rem; height: 0.875rem;" /> Low stock</andes-tag>
                  } @else {
                    <andes-tag color="success"><ng-icon name="lucideCircleCheck" style="width: 0.875rem; height: 0.875rem;" /> In stock</andes-tag>
                  }
                </td>
              </tr>
            }
          </tbody>
          <tfoot andesTableFooter>
            <tr andesTableRow>
              <td andesTableCell colspan="4">Stock value</td>
              <td andesTableCell>{{ worth() }}</td>
            </tr>
          </tfoot>
        </andes-table>`,
    };
  },
};

/** A table in a dialog. */
export const InDialog: Story = {
  name: 'A dialog with a small table',
  parameters: about(
    'A compact table in a dialog lists what a bulk action will change, so the choice is confirmed against the rows themselves.',
  ),
  render: () => ({
    props: { users: makeUsers(4), muted },
    template: `
      <andes-dialog>
        <andes-button andesDialogTrigger variant="danger"><ng-icon slot="icon-start" name="lucideTrash2" />Remove people</andes-button>
        <andes-dialog-content *andesDialogContent>
          <div andesDialogHeader>
            <h2 andesDialogTitle>Remove 4 people?</h2>
            <p andesDialogDescription>They lose access to the project right away.</p>
          </div>
          <andes-table density="compact">
            <thead andesTableHeader>
              <tr andesTableRow>
                <th andesTableHead>Name</th>
                <th andesTableHead>Role</th>
              </tr>
            </thead>
            <tbody andesTableBody>
              @for (user of users; track user.id) {
                <tr andesTableRow>
                  <td andesTableCell>{{ user.name }}</td>
                  <td andesTableCell>{{ user.role }}</td>
                </tr>
              }
            </tbody>
          </andes-table>
          <div andesDialogFooter>
            <andes-button variant="secondary" andesDialogClose>Cancel</andes-button>
            <andes-button variant="danger" andesDialogClose>Remove</andes-button>
          </div>
        </andes-dialog-content>
      </andes-dialog>`,
  }),
};

/** Team members. */
export const TeamMembers: Story = {
  name: 'Team members',
  parameters: about(
    'A team list with an avatar and an email, a role select, an active switch and a button that removes the row after a confirmation.',
  ),
  render: () => {
    const members = signal(
      makeUsers(5).map((user) => ({
        ...user,
        active: user.state === 'Active',
      })),
    );
    return {
      props: {
        members,
        setRole: (id: number, role: string) =>
          members.update((list) =>
            list.map((m) => (m.id === id ? { ...m, role: role as never } : m)),
          ),
        setActive: (id: number, active: boolean) =>
          members.update((list) =>
            list.map((m) => (m.id === id ? { ...m, active } : m)),
          ),
        remove: (id: number) =>
          members.update((list) => list.filter((m) => m.id !== id)),
        iconText,
        strong,
        muted,
      },
      template: `
        <andes-table style="max-width: 56rem;">
          <thead andesTableHeader>
            <tr andesTableRow>
              <th andesTableHead>Member</th>
              <th andesTableHead style="width: 10rem;">Role</th>
              <th andesTableHead>Active</th>
              <th andesTableHead align="end"><span class="andes-table__sr-only">Remove</span></th>
            </tr>
          </thead>
          <tbody andesTableBody>
            @for (member of members(); track member.id) {
              <tr andesTableRow>
                <td andesTableCell>
                  <span [style]="iconText">
                    <andes-avatar><andes-avatar-fallback>{{ member.initials }}</andes-avatar-fallback></andes-avatar>
                    <span style="display: flex; flex-direction: column;">
                      <span [style]="strong">{{ member.name }}</span>
                      <span [style]="muted">{{ member.email }}</span>
                    </span>
                  </span>
                </td>
                <td andesTableCell>
                  <andes-select size="sm" [aria-label]="'Role of ' + member.name" [value]="member.role" (valueChange)="setRole(member.id, $any($event))">
                    <andes-select-trigger><andes-select-value /></andes-select-trigger>
                    <andes-select-content>
                      <andes-select-item value="Admin">Admin</andes-select-item>
                      <andes-select-item value="Editor">Editor</andes-select-item>
                      <andes-select-item value="Viewer">Viewer</andes-select-item>
                      <andes-select-item value="Billing">Billing</andes-select-item>
                    </andes-select-content>
                  </andes-select>
                </td>
                <td andesTableCell><andes-switch [aria-label]="'Active: ' + member.name" [checked]="member.active" (checkedChange)="setActive(member.id, $event)" /></td>
                <td andesTableCell align="end">
                  <andes-button variant="ghost" size="icon-sm" [aria-label]="'Remove ' + member.name" (click)="remove(member.id)"><ng-icon name="lucideTrash2" /></andes-button>
                </td>
              </tr>
            } @empty {
              <tr andesTableRow><td andesTableCell colspan="4"><andes-table-empty>Everyone was removed</andes-table-empty></td></tr>
            }
          </tbody>
        </andes-table>`,
    };
  },
};

/** Audit log. */
export const AuditLog: Story = {
  name: 'Audit log',
  parameters: about(
    'An audit log with an icon per kind of event, the actor, the time and a row that opens to show what exactly changed.',
  ),
  render: () => {
    const events = makeUsers(7).map((user, i) => ({
      id: `evt-${i}`,
      who: user.name,
      kind: ['signed in', 'changed a role', 'deleted a file', 'exported data'][
        i % 4
      ],
      icon: ['lucideUser', 'lucideSettings', 'lucideTrash2', 'lucideDownload'][
        i % 4
      ],
      at: `2026-03-${String(10 + i).padStart(2, '0')} 09:${String(10 + i * 5).padStart(2, '0')}`,
    }));
    const expanded = signal<readonly AndesTableRowKey[]>([]);
    return {
      props: { events, expanded, muted, iconText },
      template: `
        <andes-table style="max-width: 52rem;" expandRowByClick [(expandedKeys)]="expanded">
          <thead andesTableHeader>
            <tr andesTableRow>
              <th andesTableHead></th>
              <th andesTableHead>Event</th>
              <th andesTableHead>Actor</th>
              <th andesTableHead>When</th>
            </tr>
          </thead>
          <tbody andesTableBody>
            @for (event of events; track event.id) {
              <tr andesTableRow [rowKey]="event.id">
                <td andesTableCell><andes-table-expand-toggle [label]="'Details of ' + event.kind" /></td>
                <td andesTableCell><span [style]="iconText"><ng-icon [name]="event.icon" />{{ event.kind }}</span></td>
                <td andesTableCell>{{ event.who }}</td>
                <td andesTableCell><span [style]="muted">{{ event.at }}</span></td>
              </tr>
              <tr *andesTableExpandedRow="event.id">
                <td andesTableCell colspan="4"><span [style]="muted">{{ event.who }} {{ event.kind }} at {{ event.at }} from 190.12.4.7.</span></td>
              </tr>
            }
          </tbody>
        </andes-table>`,
    };
  },
};
