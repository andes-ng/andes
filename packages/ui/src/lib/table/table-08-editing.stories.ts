import { signal } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular';

import {
  about,
  iconText,
  makeTasks,
  makeUsers,
  muted,
  stack,
  statusColor,
  statusIcon,
  strong,
  withDescription,
  withTableKit,
  type User,
} from '../../testing/table-story-kit';
import { AndesTable } from './table';

/*
 * Cells and rows that turn into fields, and the cells that draw more than text: tags, status
 * icons, bars, avatars, switches, links, menus of actions and a value that can be copied.
 */

const meta: Meta<AndesTable> = {
  title: 'Data Display/Table/Editing and custom cells',
  component: AndesTable,
  tags: ['autodocs'],
  decorators: [withDescription, withTableKit],
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<AndesTable>;

const WRAP = 'max-width: 46rem;';

/** The tone of an icon: the colour of a status. */
function tone(status: string): string {
  switch (statusColor(status)) {
    case 'success':
      return 'var(--andes-color-success-text)';
    case 'danger':
      return 'var(--andes-color-danger-text)';
    case 'warning':
      return 'var(--andes-color-warning-text)';
    case 'info':
      return 'var(--andes-color-info-text)';
    default:
      return 'var(--andes-color-muted-foreground)';
  }
}

/** Mutable copies of the first users, for the stories that change them. */
const editable = (count: number) =>
  signal<User[]>(makeUsers(count).map((user) => ({ ...user })));

/** Editable cells. */
export const EditableCells: Story = {
  name: 'Editable cells',
  parameters: about(
    'A click on a cell turns it into a field: Enter or leaving the field saves the value and Escape puts the old one back.',
  ),
  render: () => {
    const rows = editable(5);
    const editing = signal<{ id: number; field: 'name' | 'city' } | null>(null);
    const draft = signal('');
    const commit = () => {
      const current = editing();
      if (!current) {
        return;
      }
      const value = draft().trim();
      if (value) {
        rows.update((list) =>
          list.map((row) =>
            row.id === current.id ? { ...row, [current.field]: value } : row,
          ),
        );
      }
      editing.set(null);
    };
    return {
      props: {
        rows,
        editing,
        draft,
        commit,
        isEditing: (id: number, field: string) =>
          editing()?.id === id && editing()?.field === field,
        start: (row: User, field: 'name' | 'city', event: Event) => {
          draft.set(row[field]);
          editing.set({ id: row.id, field });
          const cell = (event.target as HTMLElement).closest('td');
          setTimeout(() => cell?.querySelector('input')?.focus());
        },
        cancel: () => editing.set(null),
        muted,
      },
      template: `
        <div style="${WRAP}">
          <andes-table tableLayout="fixed">
            <thead andesTableHeader>
              <tr andesTableRow>
                <th andesTableHead style="width: 3.5rem" align="end">#</th>
                <th andesTableHead>Name</th>
                <th andesTableHead>City</th>
                <th andesTableHead>Email</th>
              </tr>
            </thead>
            <tbody andesTableBody>
              @for (row of rows(); track row.id) {
                <tr andesTableRow>
                  <td andesTableCell align="end">{{ row.id }}</td>
                  @for (field of ['name', 'city']; track field) {
                    <td andesTableCell>
                      @if (isEditing(row.id, field)) {
                        <andes-input size="sm" [aria-label]="'Edit ' + field" [value]="draft()"
                          (valueChange)="draft.set($event)" (pressEnter)="commit()" (blurred)="commit()" (keydown.escape)="cancel()" />
                      } @else {
                        <andes-button variant="ghost" size="sm" style="margin-inline: -0.4375rem;" [aria-label]="'Edit ' + field + ' of ' + row.name" (click)="start(row, field, $event)">
                          {{ field === 'name' ? row.name : row.city }}
                        </andes-button>
                      }
                    </td>
                  }
                  <td andesTableCell ellipsis><span style="${muted}">{{ row.email }}</span></td>
                </tr>
              }
            </tbody>
          </andes-table>
        </div>`,
    };
  },
};

/** Validation. */
export const EditableWithValidation: Story = {
  name: 'Editable cells with validation',
  parameters: about(
    'A field with a wrong value shows the error state and says why, and the value is not saved until it is fixed.',
  ),
  render: () => {
    const rows = editable(4);
    rows.update((list) =>
      list.map((row) =>
        row.id === 2 ? { ...row, email: 'not-an-email' } : row,
      ),
    );
    const editing = signal<number | null>(null);
    const draft = signal('');
    const valid = (value: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value);
    const commit = () => {
      const id = editing();
      if (id === null || !valid(draft())) {
        return;
      }
      rows.update((list) =>
        list.map((row) => (row.id === id ? { ...row, email: draft() } : row)),
      );
      editing.set(null);
    };
    return {
      props: {
        rows,
        editing,
        draft,
        commit,
        valid,
        start: (row: User, event: Event) => {
          draft.set(row.email);
          editing.set(row.id);
          const cell = (event.target as HTMLElement).closest('td');
          setTimeout(() => cell?.querySelector('input')?.focus());
        },
        cancel: () => editing.set(null),
        stack,
      },
      template: `
        <div style="${WRAP}">
          <andes-table tableLayout="fixed">
            <thead andesTableHeader>
              <tr andesTableRow>
                <th andesTableHead style="width: 11rem">Name</th>
                <th andesTableHead>Email</th>
              </tr>
            </thead>
            <tbody andesTableBody>
              @for (row of rows(); track row.id) {
                <tr andesTableRow>
                  <td andesTableCell>{{ row.name }}</td>
                  <td andesTableCell>
                    @if (editing() === row.id) {
                      <div style="display: flex; flex-direction: column; gap: 0.25rem;">
                        <andes-input size="sm" aria-label="Email" [value]="draft()" [status]="valid(draft()) ? undefined : 'error'"
                          (valueChange)="draft.set($event)" (pressEnter)="commit()" (keydown.escape)="cancel()" />
                        @if (!valid(draft())) {
                          <span style="font-size: 0.8125rem; line-height: 1.25rem; color: var(--andes-color-danger-text);">Enter an email like name&#64;example.com</span>
                        }
                      </div>
                    } @else {
                      <span style="${iconText}">
                        @if (valid(row.email)) {
                          <andes-button variant="ghost" size="sm" [aria-label]="'Edit email of ' + row.name" (click)="start(row, $event)">{{ row.email }}</andes-button>
                        } @else {
                          <ng-icon name="lucideCircleAlert" style="color: var(--andes-color-danger-text);" />
                          <andes-button variant="ghost" size="sm" [aria-label]="'Fix email of ' + row.name" (click)="start(row, $event)">{{ row.email }}</andes-button>
                        }
                      </span>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </andes-table>
        </div>`,
    };
  },
};

/** Editable rows. */
export const EditableRows: Story = {
  name: 'Editable rows',
  parameters: about(
    'An edit button turns the whole row into fields, an input, a select and a number input, and save or cancel puts it back to text.',
  ),
  render: () => {
    const rows = editable(4);
    const editing = signal<number | null>(null);
    const draft = signal<User | null>(null);
    const patch = (change: Partial<User>) =>
      draft.update((value) => (value ? { ...value, ...change } : value));
    return {
      props: {
        rows,
        editing,
        draft,
        patch,
        edit: (row: User) => {
          draft.set({ ...row });
          editing.set(row.id);
        },
        save: () => {
          const value = draft();
          if (value) {
            rows.update((list) =>
              list.map((row) => (row.id === value.id ? value : row)),
            );
          }
          editing.set(null);
        },
        cancel: () => editing.set(null),
        roles: ['Admin', 'Editor', 'Viewer', 'Billing'],
      },
      template: `
        <div style="${WRAP}">
          <andes-table tableLayout="fixed">
            <thead andesTableHeader>
              <tr andesTableRow>
                <th andesTableHead>Name</th>
                <th andesTableHead style="width: 9rem">Role</th>
                <th andesTableHead style="width: 7rem" align="end">Score</th>
                <th andesTableHead style="width: 9rem" align="end"><span class="andes-table__sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody andesTableBody>
              @for (row of rows(); track row.id) {
                <tr andesTableRow>
                  @if (editing() === row.id) {
                    <td andesTableCell>
                      <andes-input size="sm" aria-label="Name" [value]="draft()!.name" (valueChange)="patch({ name: $event })" />
                    </td>
                    <td andesTableCell>
                      <andes-select size="sm" aria-label="Role" [value]="draft()!.role" (valueChange)="patch({ role: $event })">
                        <andes-select-trigger><andes-select-value /></andes-select-trigger>
                        <andes-select-content>
                          @for (role of roles; track role) {
                            <andes-select-item [value]="role">{{ role }}</andes-select-item>
                          }
                        </andes-select-content>
                      </andes-select>
                    </td>
                    <td andesTableCell align="end">
                      <andes-input-number size="sm" aria-label="Score" [controls]="false" [value]="draft()!.score" (valueChange)="patch({ score: +($event ?? 0) })" />
                    </td>
                    <td andesTableCell align="end">
                      <span style="display: inline-flex; gap: 0.25rem;">
                        <andes-button size="icon-sm" variant="primary" aria-label="Save" (click)="save()"><ng-icon name="lucideSave" /></andes-button>
                        <andes-button size="icon-sm" variant="ghost" aria-label="Cancel" (click)="cancel()"><ng-icon name="lucideX" /></andes-button>
                      </span>
                    </td>
                  } @else {
                    <td andesTableCell>{{ row.name }}</td>
                    <td andesTableCell>{{ row.role }}</td>
                    <td andesTableCell align="end">{{ row.score }}</td>
                    <td andesTableCell align="end">
                      <andes-button size="icon-sm" variant="ghost" [aria-label]="'Edit ' + row.name" [disabled]="editing() !== null" (click)="edit(row)"><ng-icon name="lucidePencil" /></andes-button>
                    </td>
                  }
                </tr>
              }
            </tbody>
          </andes-table>
        </div>`,
    };
  },
};

/** Date cell. */
export const EditableDate: Story = {
  name: 'Editable date cell',
  parameters: about(
    'A date picker in the cell edits the date in place, and the row keeps the chosen day.',
  ),
  render: () => {
    const rows = editable(4);
    const iso = (date: Date) =>
      `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    return {
      props: {
        rows,
        toDate: (value: string) => new Date(`${value}T00:00:00`),
        setDate: (id: number, value: unknown) => {
          if (value instanceof Date) {
            rows.update((list) =>
              list.map((row) =>
                row.id === id ? { ...row, joined: iso(value) } : row,
              ),
            );
          }
        },
      },
      template: `
        <div style="max-width: 36rem;">
          <andes-table tableLayout="fixed">
            <thead andesTableHeader>
              <tr andesTableRow>
                <th andesTableHead>Name</th>
                <th andesTableHead style="width: 13rem">Joined</th>
              </tr>
            </thead>
            <tbody andesTableBody>
              @for (row of rows(); track row.id) {
                <tr andesTableRow>
                  <td andesTableCell>{{ row.name }}</td>
                  <td andesTableCell>
                    <andes-date-picker size="sm" [aria-label]="'Joined date of ' + row.name" [value]="toDate(row.joined)" (valueChange)="setDate(row.id, $event)" />
                  </td>
                </tr>
              }
            </tbody>
          </andes-table>
        </div>`,
    };
  },
};

/** Select cell. */
export const EditableSelect: Story = {
  name: 'Editable select cell',
  parameters: about(
    'A select in the cell changes the role of a row directly, and the tag next to it follows the new value.',
  ),
  render: () => {
    const rows = editable(5);
    return {
      props: {
        rows,
        roles: ['Admin', 'Editor', 'Viewer', 'Billing'],
        setRole: (id: number, role: User['role']) =>
          rows.update((list) =>
            list.map((row) => (row.id === id ? { ...row, role } : row)),
          ),
      },
      template: `
        <div style="max-width: 36rem;">
          <andes-table tableLayout="fixed">
            <thead andesTableHeader>
              <tr andesTableRow>
                <th andesTableHead>Name</th>
                <th andesTableHead style="width: 10rem">Role</th>
                <th andesTableHead style="width: 6rem">Access</th>
              </tr>
            </thead>
            <tbody andesTableBody>
              @for (row of rows(); track row.id) {
                <tr andesTableRow>
                  <td andesTableCell>{{ row.name }}</td>
                  <td andesTableCell>
                    <andes-select size="sm" [aria-label]="'Role of ' + row.name" [value]="row.role" (valueChange)="setRole(row.id, $event)">
                      <andes-select-trigger><andes-select-value /></andes-select-trigger>
                      <andes-select-content>
                        @for (role of roles; track role) {
                          <andes-select-item [value]="role">{{ role }}</andes-select-item>
                        }
                      </andes-select-content>
                    </andes-select>
                  </td>
                  <td andesTableCell><andes-tag [color]="row.role === 'Admin' ? 'primary' : 'default'">{{ row.role === 'Admin' ? 'Full' : 'Limited' }}</andes-tag></td>
                </tr>
              }
            </tbody>
          </andes-table>
        </div>`,
    };
  },
};

/** Tags. */
export const RendererTags: Story = {
  name: 'Custom cell renderers: tags',
  parameters: about(
    'A cell can hold a tag for each label of its row, coloured by what the label means.',
  ),
  render: () => ({
    props: { rows: makeUsers(5), statusColor },
    template: `
      <div style="${WRAP}">
        <andes-table>
          <thead andesTableHeader>
            <tr andesTableRow>
              <th andesTableHead>Name</th>
              <th andesTableHead>Role</th>
              <th andesTableHead>State</th>
            </tr>
          </thead>
          <tbody andesTableBody>
            @for (row of rows; track row.id) {
              <tr andesTableRow>
                <td andesTableCell>{{ row.name }}</td>
                <td andesTableCell>
                  <span style="display: inline-flex; flex-wrap: wrap; gap: 0.5rem;">
                    <andes-tag>{{ row.role }}</andes-tag>
                    <andes-tag color="info">{{ row.city }}</andes-tag>
                  </span>
                </td>
                <td andesTableCell><andes-tag [color]="statusColor(row.state)" variant="filled">{{ row.state }}</andes-tag></td>
              </tr>
            }
          </tbody>
        </andes-table>
      </div>`,
  }),
};

/** Status. */
export const RendererStatus: Story = {
  name: 'Custom cell renderers: badges and status icons',
  parameters: about(
    'A status can be a badge dot with its text, or a lucide icon in the colour of the status, each with clear air before the label.',
  ),
  render: () => ({
    props: { rows: makeUsers(5), statusIcon, tone },
    template: `
      <div style="${WRAP}">
        <andes-table>
          <thead andesTableHeader>
            <tr andesTableRow>
              <th andesTableHead>Name</th>
              <th andesTableHead>Badge</th>
              <th andesTableHead>Icon</th>
            </tr>
          </thead>
          <tbody andesTableBody>
            @for (row of rows; track row.id) {
              <tr andesTableRow>
                <td andesTableCell>{{ row.name }}</td>
                <td andesTableCell>
                  <andes-badge [status]="row.state === 'Active' ? 'success' : row.state === 'Invited' ? 'processing' : 'error'" [text]="row.state" />
                </td>
                <td andesTableCell>
                  <span style="${iconText}">
                    <ng-icon [name]="statusIcon(row.state)" [style.color]="tone(row.state)" />
                    {{ row.state }}
                  </span>
                </td>
              </tr>
            }
          </tbody>
        </andes-table>
      </div>`,
  }),
};

/** Bars. */
export const RendererBars: Story = {
  name: 'Custom cell renderers: progress bars and sparklines',
  parameters: about(
    'A bar filled by the value shows progress at a glance, and a row of small bars draws a trend of the last seven days.',
  ),
  render: () => ({
    props: {
      rows: makeTasks(6),
      trend: (id: number) =>
        Array.from({ length: 7 }, (_, i) => 20 + ((id * 17 + i * 29) % 80)),
      muted,
    },
    template: `
      <div style="${WRAP}">
        <andes-table>
          <thead andesTableHeader>
            <tr andesTableRow>
              <th andesTableHead>Task</th>
              <th andesTableHead style="min-width: 10rem">Progress</th>
              <th andesTableHead>Last 7 days</th>
            </tr>
          </thead>
          <tbody andesTableBody>
            @for (row of rows; track row.id) {
              <tr andesTableRow>
                <td andesTableCell>{{ row.title }}</td>
                <td andesTableCell>
                  <span style="display: flex; align-items: center; gap: 0.75rem;">
                    <span style="flex: 1; height: 0.375rem; border-radius: 9999px; background: var(--andes-color-muted); overflow: hidden;"
                      role="progressbar" [attr.aria-valuenow]="row.progress" aria-valuemin="0" aria-valuemax="100" [attr.aria-label]="'Progress of ' + row.title">
                      <span style="display: block; height: 100%; border-radius: 9999px; background: var(--andes-color-primary);" [style.width.%]="row.progress"></span>
                    </span>
                    <span style="${muted} min-width: 2.5rem; text-align: end;">{{ row.progress }}%</span>
                  </span>
                </td>
                <td andesTableCell>
                  <span style="display: inline-flex; align-items: flex-end; gap: 0.1875rem; height: 1.5rem;" aria-hidden="true">
                    @for (value of trend(row.id); track $index) {
                      <span style="width: 0.25rem; border-radius: 1px; background: var(--andes-color-info);" [style.height.%]="value"></span>
                    }
                  </span>
                </td>
              </tr>
            }
          </tbody>
        </andes-table>
      </div>`,
  }),
};

/** Avatars. */
export const RendererAvatars: Story = {
  name: 'Custom cell renderers: avatars with name and email',
  parameters: about(
    'An avatar with the name above the email gives a person cell the weight of a profile, with a gap that keeps the picture apart from the text.',
  ),
  render: () => ({
    props: { rows: makeUsers(5), strong, muted },
    template: `
      <div style="${WRAP}">
        <andes-table>
          <thead andesTableHeader>
            <tr andesTableRow>
              <th andesTableHead>User</th>
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
                      <span style="${strong}">{{ row.name }}</span>
                      <span style="${muted}">{{ row.email }}</span>
                    </span>
                  </span>
                </td>
                <td andesTableCell>{{ row.role }}</td>
                <td andesTableCell>{{ row.city }}</td>
              </tr>
            }
          </tbody>
        </andes-table>
      </div>`,
  }),
};

/** Switches and links. */
export const RendererSwitchesAndLinks: Story = {
  name: 'Custom cell renderers: switches and links',
  parameters: about(
    'A switch in a cell turns a setting of its row on or off, and a link button opens the record with an icon that says it leaves the table.',
  ),
  render: () => {
    const rows = signal(
      makeUsers(5).map((user) => ({
        ...user,
        active: user.state === 'Active',
      })),
    );
    return {
      props: {
        rows,
        toggle: (id: number) =>
          rows.update((list) =>
            list.map((row) =>
              row.id === id ? { ...row, active: !row.active } : row,
            ),
          ),
      },
      template: `
        <div style="${WRAP}">
          <andes-table>
            <thead andesTableHeader>
              <tr andesTableRow>
                <th andesTableHead>Name</th>
                <th andesTableHead>Active</th>
                <th andesTableHead>Profile</th>
              </tr>
            </thead>
            <tbody andesTableBody>
              @for (row of rows(); track row.id) {
                <tr andesTableRow>
                  <td andesTableCell>{{ row.name }}</td>
                  <td andesTableCell><andes-switch [checked]="row.active" (checkedChange)="toggle(row.id)" [aria-label]="'Active: ' + row.name" /></td>
                  <td andesTableCell>
                    <andes-button variant="link" size="sm">Open<ng-icon slot="icon-end" name="lucideExternalLink" /></andes-button>
                  </td>
                </tr>
              }
            </tbody>
          </andes-table>
        </div>`,
    };
  },
};

/** Actions menu. */
export const RendererActions: Story = {
  name: 'Custom cell renderers: dropdown actions',
  parameters: about(
    'A last column offers a direct Delete button and a menu of more actions behind an ellipsis, and the choice is reported under the table.',
  ),
  render: () => {
    const rows = editable(5);
    const last = signal('No action yet');
    return {
      props: {
        rows,
        last,
        menu: [
          { key: 'edit', label: 'Edit' },
          { key: 'duplicate', label: 'Duplicate' },
          { key: 'archive', label: 'Archive' },
        ],
        remove: (id: number) =>
          rows.update((list) => list.filter((row) => row.id !== id)),
        run: (key: string, row: User) => last.set(`${key} ${row.name}`),
        muted,
      },
      template: `
        <div style="${WRAP}">
          <andes-table>
            <thead andesTableHeader>
              <tr andesTableRow>
                <th andesTableHead>Name</th>
                <th andesTableHead>Role</th>
                <th andesTableHead align="end">Action</th>
              </tr>
            </thead>
            <tbody andesTableBody>
              @for (row of rows(); track row.id) {
                <tr andesTableRow>
                  <td andesTableCell>{{ row.name }}</td>
                  <td andesTableCell>{{ row.role }}</td>
                  <td andesTableCell align="end">
                    <span style="display: inline-flex; align-items: center; gap: 0.25rem;">
                      <andes-button variant="link" size="sm" (click)="remove(row.id)">Delete</andes-button>
                      <andes-dropdown-menu [items]="menu" (itemClick)="run($event.key, row)">
                        <andes-button andesDropdownMenuTrigger variant="ghost" size="icon-sm" [aria-label]="'More actions for ' + row.name"><ng-icon name="lucideEllipsis" /></andes-button>
                      </andes-dropdown-menu>
                    </span>
                  </td>
                </tr>
              }
            </tbody>
          </andes-table>
          <p style="${muted} margin: 0.75rem 0 0;">Last action: {{ last() }}</p>
        </div>`,
    };
  },
};

/** Copy on hover. */
export const CopyOnHover: Story = {
  name: 'Copy on hover',
  parameters: about(
    'A long value is cut with an ellipsis, and a copy button appears when the row is hovered or focused and confirms with a check.',
  ),
  render: () => {
    const copied = signal<number | null>(null);
    return {
      props: {
        rows: makeUsers(5),
        copied,
        copy: (id: number, value: string) => {
          try {
            navigator.clipboard?.writeText(value);
          } catch {
            // The clipboard can be blocked; the confirmation still shows.
          }
          copied.set(id);
          setTimeout(() => copied() === id && copied.set(null), 1500);
        },
      },
      template: `
        <style>
          .copy-cell .copy-button { opacity: 0; transition: opacity 120ms ease; }
          .copy-cell:hover .copy-button, .copy-cell:focus-within .copy-button, .copy-cell .copy-button.copied { opacity: 1; }
          @media (hover: none) { .copy-cell .copy-button { opacity: 1; } }
          @media (prefers-reduced-motion: reduce) { .copy-cell .copy-button { transition: none; } }
        </style>
        <div style="${WRAP}">
          <andes-table tableLayout="fixed">
            <thead andesTableHeader>
              <tr andesTableRow>
                <th andesTableHead style="width: 10rem">Name</th>
                <th andesTableHead>Email</th>
              </tr>
            </thead>
            <tbody andesTableBody>
              @for (row of rows; track row.id) {
                <tr andesTableRow>
                  <td andesTableCell>{{ row.name }}</td>
                  <td andesTableCell>
                    <span class="copy-cell andes-table__cell-inline" style="display: flex;">
                      <span class="andes-table__cell-inline-text">{{ row.email }}</span>
                      <andes-button class="copy-button" [class.copied]="copied() === row.id" variant="ghost" size="icon-sm"
                        [aria-label]="copied() === row.id ? 'Copied' : 'Copy ' + row.email" (click)="copy(row.id, row.email)">
                        @if (copied() === row.id) {
                          <ng-icon name="lucideCheck" style="color: var(--andes-color-success-text);" />
                        } @else {
                          <ng-icon name="lucideCopy" />
                        }
                      </andes-button>
                    </span>
                  </td>
                </tr>
              }
            </tbody>
          </andes-table>
        </div>`,
    };
  },
};
