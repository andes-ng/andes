import { type CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { signal } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular';

import {
  about,
  makeTasks,
  makeUsers,
  muted,
  stack,
  strong,
  withDescription,
  withTableKit,
} from '../../testing/table-story-kit';
import { AndesTable, type AndesTableColumnReorder } from './table';
import type { AndesTablePinned } from './table-column-settings';
import { andesOrderColumns } from './table-data';

/*
 * Moving and sizing: rows that drag (with a handle and with buttons), columns that drag,
 * resize, fit their content and pin to an edge.
 */

const meta: Meta<AndesTable> = {
  title: 'Data Display/Table/Drag and resize',
  component: AndesTable,
  tags: ['autodocs'],
  decorators: [withDescription, withTableKit],
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<AndesTable>;

/** The look of a dragged row: the preview floats and the gap it leaves is dimmed. */
function dragStyles(): void {
  if (
    typeof document === 'undefined' ||
    document.getElementById('table-drag')
  ) {
    return;
  }
  const style = document.createElement('style');
  style.id = 'table-drag';
  style.textContent = `
    .story-drag-row.cdk-drag-placeholder { opacity: 0.35; }
    .cdk-drop-list-dragging .story-drag-row:not(.cdk-drag-placeholder) { transition: transform 200ms ease; }
    @media (prefers-reduced-motion: reduce) { .cdk-drop-list-dragging .story-drag-row:not(.cdk-drag-placeholder) { transition: none; } }
  `;
  document.head.appendChild(style);
}

/** Reorders the rows of a signal after a drop. */
function dropper<T>(rows: ReturnType<typeof signal<T[]>>) {
  return (event: CdkDragDrop<unknown>) =>
    rows.update((current) => {
      const next = [...current];
      moveItemInArray(next, event.previousIndex, event.currentIndex);
      return next;
    });
}

/** Rows dragged anywhere. */
export const DragRows: Story = {
  name: 'Drag sorting rows',
  parameters: about(
    'Make the body a drop list and each row a draggable: the rows slide aside while one is dragged and the new order lands in your data.',
  ),
  render: () => {
    dragStyles();
    const rows = signal(makeTasks(5));
    return {
      props: { rows, drop: dropper(rows) },
      template: `
        <andes-table style="max-width: 40rem;">
          <thead andesTableHeader>
            <tr andesTableRow>
              <th andesTableHead width="fit">#</th>
              <th andesTableHead>Task</th>
              <th andesTableHead>Owner</th>
              <th andesTableHead>Priority</th>
            </tr>
          </thead>
          <tbody andesTableBody cdkDropList cdkDropListLockAxis="y" (cdkDropListDropped)="drop($event)">
            @for (row of rows(); track row.id; let i = $index) {
              <tr andesTableRow cdkDrag class="story-drag-row" style="cursor: grab;">
                <td andesTableCell>{{ i + 1 }}</td>
                <td andesTableCell>{{ row.title }}</td>
                <td andesTableCell>{{ row.owner }}</td>
                <td andesTableCell>{{ row.priority }}</td>
              </tr>
            }
          </tbody>
        </andes-table>`,
    };
  },
};

/** Rows dragged by a grip. */
export const DragHandle: Story = {
  name: 'Drag with a handle',
  parameters: about(
    'A grip icon in the first cell is the only place a row can be grabbed, so the text and the controls in the other cells stay selectable and clickable.',
  ),
  render: () => {
    dragStyles();
    const rows = signal(makeTasks(5));
    return {
      props: { rows, drop: dropper(rows) },
      template: `
        <andes-table style="max-width: 40rem;">
          <thead andesTableHeader>
            <tr andesTableRow>
              <th andesTableHead style="width: 3.5rem;"><span class="andes-table__sr-only">Move</span></th>
              <th andesTableHead>Task</th>
              <th andesTableHead>Owner</th>
              <th andesTableHead>Status</th>
            </tr>
          </thead>
          <tbody andesTableBody cdkDropList cdkDropListLockAxis="y" (cdkDropListDropped)="drop($event)">
            @for (row of rows(); track row.id) {
              <tr andesTableRow cdkDrag class="story-drag-row">
                <td andesTableCell>
                  <andes-button variant="ghost" size="icon-xs" cdkDragHandle style="cursor: grab;" [aria-label]="'Drag ' + row.title">
                    <ng-icon name="lucideGripVertical" />
                  </andes-button>
                </td>
                <td andesTableCell>{{ row.title }}</td>
                <td andesTableCell>{{ row.owner }}</td>
                <td andesTableCell><andes-tag>{{ row.status }}</andes-tag></td>
              </tr>
            }
          </tbody>
        </andes-table>`,
    };
  },
};

/** Rows moved with buttons. */
export const KeyboardMove: Story = {
  name: 'Keyboard alternative for row moving',
  parameters: about(
    'Every move that a drag can make is also a button, so the order can be changed from the keyboard and the new position is announced.',
  ),
  render: () => {
    const rows = signal(makeTasks(5));
    const message = signal('');
    return {
      props: {
        rows,
        message,
        muted,
        move: (index: number, delta: number) => {
          const target = index + delta;
          if (target < 0 || target >= rows().length) {
            return;
          }
          const title = rows()[index].title;
          rows.update((current) => {
            const next = [...current];
            moveItemInArray(next, index, target);
            return next;
          });
          message.set(
            `${title} moved to position ${target + 1} of ${rows().length}.`,
          );
        },
      },
      template: `
        <div style="${stack} max-width: 40rem;">
          <andes-table>
            <thead andesTableHeader>
              <tr andesTableRow>
                <th andesTableHead width="fit">#</th>
                <th andesTableHead>Task</th>
                <th andesTableHead>Owner</th>
                <th andesTableHead align="end">Move</th>
              </tr>
            </thead>
            <tbody andesTableBody>
              @for (row of rows(); track row.id; let i = $index; let first = $first; let last = $last) {
                <tr andesTableRow>
                  <td andesTableCell>{{ i + 1 }}</td>
                  <td andesTableCell>{{ row.title }}</td>
                  <td andesTableCell>{{ row.owner }}</td>
                  <td andesTableCell align="end">
                    <span style="display: inline-flex; gap: 0.25rem;">
                      <andes-button variant="ghost" size="icon-xs" [disabled]="first" [aria-label]="'Move ' + row.title + ' up'" (click)="move(i, -1)"><ng-icon name="lucideArrowUp" /></andes-button>
                      <andes-button variant="ghost" size="icon-xs" [disabled]="last" [aria-label]="'Move ' + row.title + ' down'" (click)="move(i, 1)"><ng-icon name="lucideArrowDown" /></andes-button>
                    </span>
                  </td>
                </tr>
              }
            </tbody>
          </andes-table>
          <p role="status" aria-live="polite" [style]="muted" style="margin: 0; min-height: 1.25rem;">{{ message() }}</p>
        </div>`,
    };
  },
};

const CONTACT_COLUMNS = [
  { key: 'name', title: 'Name', width: 150 },
  { key: 'role', title: 'Role', width: 120 },
  { key: 'city', title: 'City', width: 130 },
  { key: 'email', title: 'Email', width: 260 },
] as const;

/** Columns dragged sideways. */
export const DragColumns: Story = {
  name: 'Drag column sorting',
  parameters: about(
    'Drag a header sideways to move its column, or focus it and press Alt with the left or right arrow, and render the cells from the order the table reports.',
  ),
  render: () => {
    const order = signal<readonly string[]>([]);
    const last = signal<AndesTableColumnReorder | null>(null);
    return {
      props: {
        users: makeUsers(5),
        order,
        last,
        muted,
        columns: () =>
          andesOrderColumns(CONTACT_COLUMNS, order(), (column) => column.key),
        user: (row: Record<string, unknown>, key: string) => String(row[key]),
      },
      template: `
        <div style="${stack} max-width: 46rem;">
          <andes-table reorderable [(columnOrder)]="order" (columnReorder)="last.set($event)">
            <thead andesTableHeader>
              <tr andesTableRow>
                @for (column of columns(); track column.key) {
                  <th andesTableHead [columnKey]="column.key">{{ column.title }}</th>
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
          <p [style]="muted" style="margin: 0;">
            @if (last(); as move) {
              <ng-container>{{ move.columnKey }} moved from position {{ move.previousIndex + 1 }} to {{ move.currentIndex + 1 }}.</ng-container>
            } @else {
              <ng-container>Drag a header to move its column.</ng-container>
            }
          </p>
        </div>`,
    };
  },
};

/** Columns resized by their edge. */
export const ColumnResizing: Story = {
  name: 'Column resizing',
  parameters: about(
    'Drag the edge of a header to resize its column, or focus the edge and use the arrow keys, and read the new widths from the two-way model.',
  ),
  render: () => {
    const widths = signal<Readonly<Record<string, number>>>({
      name: 160,
      role: 140,
      email: 260,
    });
    const last = signal('Drag the edge of a header.');
    return {
      props: {
        users: makeUsers(5),
        widths,
        last,
        muted,
        resized: (event: { columnKey: string; width: number }) =>
          last.set(`${event.columnKey} is now ${event.width}px wide.`),
      },
      template: `
        <div style="${stack} max-width: 46rem;">
          <andes-table resizable tableLayout="fixed" [(columnWidths)]="widths" (columnResize)="resized($event)">
            <thead andesTableHeader>
              <tr andesTableRow>
                <th andesTableHead columnKey="name" ellipsis>Name</th>
                <th andesTableHead columnKey="role" ellipsis>Role</th>
                <th andesTableHead columnKey="email" ellipsis>Email</th>
                <th andesTableHead ellipsis>City</th>
              </tr>
            </thead>
            <tbody andesTableBody>
              @for (user of users; track user.id) {
                <tr andesTableRow>
                  <td andesTableCell ellipsis>{{ user.name }}</td>
                  <td andesTableCell ellipsis>{{ user.role }}</td>
                  <td andesTableCell ellipsis>{{ user.email }}</td>
                  <td andesTableCell ellipsis>{{ user.city }}</td>
                </tr>
              }
            </tbody>
          </andes-table>
          <p [style]="muted" style="margin: 0;">{{ last() }}</p>
        </div>`,
    };
  },
};

/** Resize limits. */
export const ResizeLimits: Story = {
  name: 'Resize limits',
  parameters: about(
    'A header can name the narrowest and the widest its column may be, and a drag or a key press stops at those limits.',
  ),
  render: () => ({
    props: {
      users: makeUsers(5),
      widths: signal<Readonly<Record<string, number>>>({}),
      muted,
    },
    template: `
      <div style="${stack} max-width: 46rem;">
        <andes-table resizable tableLayout="fixed" [(columnWidths)]="widths">
          <thead andesTableHeader>
            <tr andesTableRow>
              <th andesTableHead columnKey="name" [width]="160" [minWidth]="120" [maxWidth]="240" ellipsis>Name (120 to 240px)</th>
              <th andesTableHead columnKey="role" [width]="140" [minWidth]="100" [maxWidth]="180" ellipsis>Role (100 to 180px)</th>
              <th andesTableHead columnKey="email" [width]="260" [minWidth]="160" ellipsis>Email (from 160px)</th>
            </tr>
          </thead>
          <tbody andesTableBody>
            @for (user of users; track user.id) {
              <tr andesTableRow>
                <td andesTableCell ellipsis>{{ user.name }}</td>
                <td andesTableCell ellipsis>{{ user.role }}</td>
                <td andesTableCell ellipsis>{{ user.email }}</td>
              </tr>
            }
          </tbody>
        </andes-table>
        <p [style]="muted" style="margin: 0;">Widths: {{ widths()['name'] ?? 160 }} / {{ widths()['role'] ?? 140 }} / {{ widths()['email'] ?? 260 }}px</p>
      </div>`,
  }),
};

/** Reordering and resizing together. */
export const ReorderAndResize: Story = {
  name: 'Reorder and resize together',
  parameters: about(
    'The same headers can be dragged to move and dragged by their edge to resize, and the two models stay in step.',
  ),
  render: () => {
    const order = signal<readonly string[]>([]);
    return {
      props: {
        users: makeUsers(5),
        order,
        widths: signal<Readonly<Record<string, number>>>({}),
        muted,
        columns: () =>
          andesOrderColumns(CONTACT_COLUMNS, order(), (column) => column.key),
        user: (row: Record<string, unknown>, key: string) => String(row[key]),
      },
      template: `
        <div style="${stack} max-width: 46rem;">
          <andes-table reorderable resizable tableLayout="fixed" [(columnOrder)]="order" [(columnWidths)]="widths">
            <thead andesTableHeader>
              <tr andesTableRow>
                @for (column of columns(); track column.key) {
                  <th andesTableHead [columnKey]="column.key" [width]="column.width" ellipsis>{{ column.title }}</th>
                }
              </tr>
            </thead>
            <tbody andesTableBody>
              @for (row of users; track row.id) {
                <tr andesTableRow>
                  @for (column of columns(); track column.key) {
                    <td andesTableCell ellipsis>{{ user(row, column.key) }}</td>
                  }
                </tr>
              }
            </tbody>
          </andes-table>
          <p [style]="muted" style="margin: 0;">Order: {{ order().join(', ') || 'unchanged' }}</p>
        </div>`,
    };
  },
};

const WIDE = [
  { key: 'name', title: 'Name', width: 170 },
  { key: 'role', title: 'Role', width: 130 },
  { key: 'city', title: 'City', width: 130 },
  { key: 'email', title: 'Email', width: 270 },
  { key: 'joined', title: 'Joined', width: 130 },
  { key: 'score', title: 'Score', width: 100 },
] as const;

/** Pinning a column with a toggle. */
export const PinToggle: Story = {
  name: 'Column pinning toggle',
  parameters: about(
    'The columns menu offers a pin button for each column, a pinned column keeps its place while the table scrolls sideways, and its header shows a pin.',
  ),
  render: () => {
    const order = signal(WIDE.map((column) => column.key as string));
    return {
      props: {
        users: makeUsers(6),
        wide: WIDE,
        order,
        pinned: signal<AndesTablePinned>({ name: 'start' }),
        settings: WIDE.map((column) => ({
          key: column.key,
          label: column.title,
        })),
        user: (row: Record<string, unknown>, key: string) => String(row[key]),
      },
      template: `
        <div style="max-width: 36rem;">
          <andes-table pinIcon scrollX="760" tableLayout="fixed" [bordered]="false">
            <div andesTableTop class="andes-table__toolbar">
              <span>Pin a column, then scroll sideways</span>
              <andes-table-column-settings pinnable [columns]="settings" [(order)]="order" [(pinned)]="pinned" />
            </div>
            <thead andesTableHeader>
              <tr andesTableRow>
                @for (column of wide; track column.key) {
                  <th andesTableHead [columnKey]="column.key" [width]="column.width" [fixed]="pinned()[column.key]">{{ column.title }}</th>
                }
              </tr>
            </thead>
            <tbody andesTableBody>
              @for (row of users; track row.id) {
                <tr andesTableRow>
                  @for (column of wide; track column.key) {
                    <td andesTableCell [fixed]="pinned()[column.key]">{{ user(row, column.key) }}</td>
                  }
                </tr>
              }
            </tbody>
          </andes-table>
        </div>`,
    };
  },
};

/** Double click to fit. */
export const FitToContent: Story = {
  name: 'Double click to fit a column',
  parameters: about(
    'Double click the edge of a header, or press Enter on it, to fit the column to its widest content, and a drag then starts from that width.',
  ),
  render: () => ({
    props: {
      rows: [
        {
          id: 1,
          name: 'Quarterly supply contract',
          note: 'Renewed automatically every three months unless cancelled in writing',
        },
        { id: 2, name: 'Warehouse lease', note: 'Signed for five years' },
        {
          id: 3,
          name: 'Insurance',
          note: 'Covers the stock and the vehicles, reviewed each spring',
        },
      ],
      muted,
      widths: signal<Readonly<Record<string, number>>>({
        name: 120,
        note: 120,
      }),
    },
    template: `
      <div style="${stack} max-width: 46rem;">
        <andes-table resizable tableLayout="fixed" [(columnWidths)]="widths">
          <thead andesTableHeader>
            <tr andesTableRow>
              <th andesTableHead columnKey="name" ellipsis>Contract</th>
              <th andesTableHead columnKey="note" ellipsis>Note</th>
              <th andesTableHead>Id</th>
            </tr>
          </thead>
          <tbody andesTableBody>
            @for (row of rows; track row.id) {
              <tr andesTableRow>
                <td andesTableCell ellipsis>{{ row.name }}</td>
                <td andesTableCell ellipsis>{{ row.note }}</td>
                <td andesTableCell>{{ row.id }}</td>
              </tr>
            }
          </tbody>
        </andes-table>
        <p [style]="muted" style="margin: 0;">Widths: {{ widths()['name'] }}px and {{ widths()['note'] }}px. Double click an edge to fit.</p>
      </div>`,
  }),
};

/** Fixed layout and right to left. */
export const FixedLayoutRtl: Story = {
  name: 'Resize in a fixed layout and RTL',
  parameters: about(
    'In a fixed layout the widths are exact, and in a right to left page the handles move to the left edge and the drag direction mirrors.',
  ),
  render: () => ({
    props: { users: makeUsers(4), strong },
    template: `
      <div style="${stack} max-width: 46rem;">
        @for (direction of ['ltr', 'rtl']; track direction) {
          <div [attr.dir]="direction">
            <p [style]="strong" style="margin: 0 0 0.5rem;">{{ direction }}</p>
            <andes-table resizable tableLayout="fixed">
              <thead andesTableHeader>
                <tr andesTableRow>
                  <th andesTableHead columnKey="name" [width]="170" ellipsis>Name</th>
                  <th andesTableHead columnKey="role" [width]="130" ellipsis>Role</th>
                  <th andesTableHead columnKey="city" ellipsis>City</th>
                </tr>
              </thead>
              <tbody andesTableBody>
                @for (user of users; track user.id) {
                  <tr andesTableRow>
                    <td andesTableCell ellipsis>{{ user.name }}</td>
                    <td andesTableCell ellipsis>{{ user.role }}</td>
                    <td andesTableCell ellipsis>{{ user.city }}</td>
                  </tr>
                }
              </tbody>
            </andes-table>
          </div>
        }
      </div>`,
  }),
};
