import { CdkDrag, CdkDragHandle, CdkDropList } from '@angular/cdk/drag-drop';
import { NgTemplateOutlet } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideArrowDown,
  lucideArrowUp,
  lucideArrowUpDown,
  lucideCalendar,
  lucideCheck,
  lucideChevronDown,
  lucideChevronRight,
  lucideChevronsDownUp,
  lucideChevronsUpDown,
  lucideCircleAlert,
  lucideCircleCheck,
  lucideCircleX,
  lucideClock,
  lucideColumns3,
  lucideCopy,
  lucideDownload,
  lucideEllipsis,
  lucideExternalLink,
  lucideEye,
  lucideEyeOff,
  lucideFile,
  lucideFileText,
  lucideFolder,
  lucideFolderOpen,
  lucideFunnel,
  lucideGripVertical,
  lucideImage,
  lucideInbox,
  lucideInfo,
  lucideLink,
  lucideMail,
  lucideMinus,
  lucidePencil,
  lucidePin,
  lucidePinOff,
  lucidePlus,
  lucideRefreshCw,
  lucideRows3,
  lucideSave,
  lucideSearch,
  lucideSettings,
  lucideStar,
  lucideTrash2,
  lucideTrendingDown,
  lucideTrendingUp,
  lucideTriangleAlert,
  lucideUser,
  lucideUsers,
  lucideX,
} from '@ng-icons/lucide';
import { type Decorator, moduleMetadata } from '@storybook/angular';

import { AndesAlert } from '../lib/alert/alert';
import { AndesAvatar } from '../lib/avatar/avatar';
import { AndesAvatarFallback } from '../lib/avatar/avatar-fallback';
import { AndesBadge } from '../lib/badge/badge';
import { AndesButton } from '../lib/button/button';
import { AndesCheckbox } from '../lib/checkbox/checkbox';
import { AndesDatePicker } from '../lib/date-picker/date-picker';
import { ANDES_DIALOG_IMPORTS } from '../lib/dialog/dialog';
import { AndesDropdownMenu } from '../lib/dropdown-menu/dropdown-menu';
import { AndesDropdownMenuTrigger } from '../lib/dropdown-menu/dropdown-menu-trigger';
import { AndesEmpty } from '../lib/empty/empty';
import { AndesEmptyProvider } from '../lib/empty/empty-config';
import { AndesFormField } from '../lib/form-field/form-field';
import { AndesInput } from '../lib/input/input';
import { AndesInputNumber } from '../lib/input-number/input-number';
import { AndesPagination } from '../lib/pagination/pagination';
import { AndesPopover } from '../lib/popover/popover';
import { AndesPopoverContent } from '../lib/popover/popover-content';
import { AndesPopoverTrigger } from '../lib/popover/popover-trigger';
import { AndesRadio } from '../lib/radio-group/radio';
import { AndesRadioGroup } from '../lib/radio-group/radio-group';
import { AndesSegmented } from '../lib/segmented/segmented';
import { AndesSelect } from '../lib/select/select';
import { AndesSelectContent } from '../lib/select/select-content';
import { AndesSelectItem } from '../lib/select/select-item';
import { AndesSelectTrigger } from '../lib/select/select-trigger';
import { AndesSelectValue } from '../lib/select/select-value';
import { AndesSkeleton } from '../lib/skeleton/skeleton';
import { AndesSkeletonAvatar } from '../lib/skeleton/skeleton-avatar';
import { AndesSkeletonButton } from '../lib/skeleton/skeleton-button';
import { AndesSkeletonInput } from '../lib/skeleton/skeleton-input';
import { AndesSkeletonText } from '../lib/skeleton/skeleton-text';
import { AndesSwitch } from '../lib/switch/switch';
import { AndesTable } from '../lib/table/table';
import { AndesTableBody } from '../lib/table/table-body';
import { AndesTableCaption } from '../lib/table/table-caption';
import { AndesTableCell } from '../lib/table/table-cell';
import { AndesTableColumnSettings } from '../lib/table/table-column-settings';
import { AndesTableEmpty } from '../lib/table/table-empty';
import {
  AndesTableExpandAll,
  AndesTableExpandedRow,
  AndesTableExpandToggle,
} from '../lib/table/table-expand';
import { AndesTableFilter } from '../lib/table/table-filter';
import {
  AndesTableDateRangeFilter,
  AndesTableRangeFilter,
  AndesTableTextFilter,
} from '../lib/table/table-filter-panels';
import { AndesTableFooter } from '../lib/table/table-footer';
import { AndesTableHead } from '../lib/table/table-head';
import { AndesTableHeader } from '../lib/table/table-header';
import { AndesTableRow } from '../lib/table/table-row';
import {
  AndesTableSelectAll,
  AndesTableSelection,
} from '../lib/table/table-selection';
import { AndesTableVirtualRows } from '../lib/table/table-virtual';
import { AndesTag } from '../lib/tag/tag';
import { AndesTooltip } from '../lib/tooltip/tooltip';
import { AndesTooltipTrigger } from '../lib/tooltip/tooltip-trigger';

/*
 * What the Table stories share: deterministic data (no randomness, so every story and every
 * spec run sees the same rows), the text and layout styles, the decorator that prints a story's
 * description, one mock "server" for the remote-data stories, and one module decorator with every
 * component the stories compose. Internal to the stories: excluded from the library build in
 * `tsconfig.lib.json`.
 */

// Styles

export const font = 'font-family: var(--andes-font-family), sans-serif;';

/** Body text. */
export const text = `${font} font-size: 0.875rem; line-height: 1.375rem; color: var(--andes-color-foreground);`;

/** Secondary text. */
export const muted = `${font} font-size: 0.8125rem; line-height: 1.25rem; color: var(--andes-color-muted-foreground);`;

/** Emphasised body text. */
export const strong = `${font} font-size: 0.875rem; line-height: 1.375rem; font-weight: 500; color: var(--andes-color-foreground);`;

/** A small heading. */
export const heading = `${font} margin: 0; font-size: 1rem; line-height: 1.5rem; font-weight: 600; color: var(--andes-color-foreground);`;

/** A vertical stack. */
export const stack = 'display: flex; flex-direction: column; gap: 1rem;';

/** A wrapping row of controls. */
export const bar =
  'display: flex; flex-wrap: wrap; align-items: center; gap: 0.75rem;';

/** One labelled control of a bar (a switch or a select with its text). */
export const control = `display: inline-flex; align-items: center; gap: 0.5rem; ${text}`;

/** A cell holding an icon next to a text, with clear air between them. */
export const iconText =
  'display: inline-flex; align-items: center; gap: 0.5rem;';

/** A card surface. */
export const card =
  'padding: 1.25rem; border: 1px solid var(--andes-color-border); border-radius: var(--andes-radius-lg); background: var(--andes-color-card);';

// Data

export interface Person {
  readonly key: string;
  readonly name: string;
  readonly age: number;
  readonly address: string;
  readonly tags: readonly string[];
}

/** The three people of the basic table. */
export const PEOPLE: readonly Person[] = [
  {
    key: '1',
    name: 'John Brown',
    age: 32,
    address: 'New York No. 1 Lake Park',
    tags: ['nice', 'developer'],
  },
  {
    key: '2',
    name: 'Jim Green',
    age: 42,
    address: 'London No. 1 Lake Park',
    tags: ['loser'],
  },
  {
    key: '3',
    name: 'Joe Black',
    age: 32,
    address: 'Sydney No. 1 Lake Park',
    tags: ['cool', 'teacher'],
  },
];

const FIRST = [
  'Ada',
  'Grace',
  'Alan',
  'Linus',
  'Margaret',
  'Dennis',
  'Barbara',
  'Edsger',
  'Radia',
  'Ken',
  'Frances',
  'Donald',
];
const LAST = [
  'Lovelace',
  'Hopper',
  'Turing',
  'Torvalds',
  'Hamilton',
  'Ritchie',
  'Liskov',
  'Dijkstra',
  'Perlman',
  'Thompson',
  'Allen',
  'Knuth',
];
const CITIES = [
  'Lima',
  'Cusco',
  'Arequipa',
  'Trujillo',
  'Piura',
  'Tacna',
  'Iquitos',
  'Huaraz',
];
const ROLES = ['Admin', 'Editor', 'Viewer', 'Billing'] as const;
const STATES = ['Active', 'Invited', 'Suspended'] as const;

export type UserRole = (typeof ROLES)[number];
export type UserState = (typeof STATES)[number];

export interface User {
  readonly id: number;
  readonly name: string;
  readonly email: string;
  readonly initials: string;
  readonly role: UserRole;
  readonly state: UserState;
  readonly city: string;
  readonly age: number;
  readonly score: number;
  /** An ISO date (`2026-03-14`). */
  readonly joined: string;
}

const pad = (value: number): string => String(value).padStart(2, '0');

/** An ISO date `days` days after 2026-01-01 (no `Date` locale, no clock). */
export function isoDay(days: number): string {
  const date = new Date(Date.UTC(2026, 0, 1 + days));
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

/** `count` users, the same every time. */
export function makeUsers(count: number): User[] {
  return Array.from({ length: count }, (_, i) => {
    const first = FIRST[i % FIRST.length];
    const last = LAST[(i * 5 + Math.floor(i / FIRST.length)) % LAST.length];
    return {
      id: i + 1,
      name: `${first} ${last}`,
      email: `${first}.${last}${i + 1}@example.com`.toLowerCase(),
      initials: `${first[0]}${last[0]}`,
      role: ROLES[(i * 3) % ROLES.length],
      state: STATES[(i * 7) % STATES.length],
      city: CITIES[(i * 3 + 1) % CITIES.length],
      age: 22 + ((i * 11) % 38),
      score: 40 + ((i * 37) % 60),
      joined: isoDay((i * 17) % 300),
    };
  });
}

export type OrderStatus = 'Paid' | 'Pending' | 'Overdue' | 'Refunded';

export interface Order {
  readonly id: string;
  readonly customer: string;
  readonly status: OrderStatus;
  readonly method: string;
  readonly items: number;
  readonly total: number;
  readonly date: string;
}

const STATUS: readonly OrderStatus[] = [
  'Paid',
  'Pending',
  'Overdue',
  'Refunded',
  'Paid',
];
const METHODS = ['Credit card', 'Transfer', 'PayPal', 'Cash'];

/** `count` orders (or invoices), the same every time. */
export function makeOrders(count: number): Order[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `INV-${String(i + 1).padStart(3, '0')}`,
    customer: `${FIRST[(i * 7) % FIRST.length]} ${LAST[(i * 3) % LAST.length]}`,
    status: STATUS[(i * 3) % STATUS.length],
    method: METHODS[(i * 5) % METHODS.length],
    items: 1 + ((i * 3) % 9),
    total: 40 + ((i * 137) % 960),
    date: isoDay((i * 13) % 330),
  }));
}

export interface Product {
  readonly sku: string;
  readonly name: string;
  readonly category: string;
  readonly stock: number;
  readonly price: number;
}

const PRODUCTS = [
  'Alpaca scarf',
  'Quinoa 1kg',
  'Cacao nibs',
  'Ceramic mug',
  'Wool socks',
  'Coffee beans',
  'Honey jar',
  'Leather wallet',
];
const CATEGORIES = ['Clothing', 'Food', 'Home', 'Accessories'];

export function makeProducts(count: number): Product[] {
  return Array.from({ length: count }, (_, i) => ({
    sku: `SKU-${String(1000 + i)}`,
    name: `${PRODUCTS[i % PRODUCTS.length]} ${Math.floor(i / PRODUCTS.length) + 1}`,
    category: CATEGORIES[(i * 3) % CATEGORIES.length],
    stock: (i * 29) % 120,
    price: 5 + ((i * 17) % 95),
  }));
}

export interface Task {
  readonly id: number;
  readonly title: string;
  readonly owner: string;
  readonly status: 'Todo' | 'In progress' | 'Done' | 'Blocked';
  readonly priority: 'Low' | 'Medium' | 'High';
  readonly progress: number;
  readonly due: string;
}

const TASK_TITLES = [
  'Write the release notes',
  'Review the pull request',
  'Fix the login redirect',
  'Update the pricing page',
  'Migrate the database',
  'Design the empty states',
  'Audit the permissions',
  'Plan the next sprint',
];

export function makeTasks(count: number): Task[] {
  const status = ['Todo', 'In progress', 'Done', 'Blocked'] as const;
  const priority = ['Low', 'Medium', 'High'] as const;
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    title: TASK_TITLES[i % TASK_TITLES.length],
    owner: `${FIRST[(i * 5) % FIRST.length]} ${LAST[(i * 7) % LAST.length][0]}.`,
    status: status[(i * 3) % status.length],
    priority: priority[(i * 5) % priority.length],
    progress: (i * 23) % 101,
    due: isoDay(20 + ((i * 9) % 120)),
  }));
}

export interface FileNode {
  readonly key: string;
  readonly name: string;
  readonly kind: 'folder' | 'file' | 'image';
  readonly size: number;
  readonly modified: string;
  readonly children?: readonly FileNode[];
}

/** A small folder tree for the tree-data and file-manager stories. */
export const FILES: readonly FileNode[] = [
  {
    key: 'docs',
    name: 'Documents',
    kind: 'folder',
    size: 0,
    modified: isoDay(40),
    children: [
      {
        key: 'docs-a',
        name: 'Plan.docx',
        kind: 'file',
        size: 120,
        modified: isoDay(41),
      },
      {
        key: 'docs-b',
        name: 'Budget.xlsx',
        kind: 'file',
        size: 340,
        modified: isoDay(43),
      },
      {
        key: 'docs-c',
        name: 'Contracts',
        kind: 'folder',
        size: 0,
        modified: isoDay(44),
        children: [
          {
            key: 'docs-c1',
            name: 'Lease.pdf',
            kind: 'file',
            size: 880,
            modified: isoDay(45),
          },
          {
            key: 'docs-c2',
            name: 'NDA.pdf',
            kind: 'file',
            size: 210,
            modified: isoDay(46),
          },
        ],
      },
    ],
  },
  {
    key: 'pics',
    name: 'Pictures',
    kind: 'folder',
    size: 0,
    modified: isoDay(60),
    children: [
      {
        key: 'pics-a',
        name: 'Cusco.jpg',
        kind: 'image',
        size: 2400,
        modified: isoDay(61),
      },
      {
        key: 'pics-b',
        name: 'Lima.png',
        kind: 'image',
        size: 1800,
        modified: isoDay(62),
      },
    ],
  },
  {
    key: 'readme',
    name: 'README.md',
    kind: 'file',
    size: 4,
    modified: isoDay(70),
  },
  {
    key: 'notes',
    name: 'Notes.txt',
    kind: 'file',
    size: 2,
    modified: isoDay(75),
  },
];

/** `1,234.50` style money. */
export function money(value: number): string {
  return `$${value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
}

/** The tag colour of a status text. */
export function statusColor(
  status: string,
): 'success' | 'warning' | 'danger' | 'info' | 'default' {
  switch (status) {
    case 'Paid':
    case 'Active':
    case 'Done':
      return 'success';
    case 'Pending':
    case 'Invited':
    case 'In progress':
      return 'info';
    case 'Overdue':
    case 'Suspended':
    case 'Blocked':
      return 'danger';
    case 'Refunded':
      return 'warning';
    default:
      return 'default';
  }
}

/** The lucide icon of a status text. */
export function statusIcon(status: string): string {
  switch (statusColor(status)) {
    case 'success':
      return 'lucideCircleCheck';
    case 'info':
      return 'lucideClock';
    case 'danger':
      return 'lucideCircleX';
    case 'warning':
      return 'lucideTriangleAlert';
    default:
      return 'lucideCircleAlert';
  }
}

// A mock server

export interface RemoteQuery {
  readonly page: number;
  readonly pageSize: number;
  readonly sort?: { columnId: string; direction: 'asc' | 'desc' } | null;
  readonly roles?: readonly string[];
  readonly search?: string;
}

export interface RemoteResult {
  readonly rows: readonly User[];
  readonly total: number;
}

/**
 * A pretend backend over 237 users: filters, sorts and pages them and answers after `delay`
 * milliseconds, so a story can show its loading state.
 */
export function mockFetch(
  query: RemoteQuery,
  delay = 600,
): Promise<RemoteResult> {
  const all = makeUsers(237);
  let rows = all.filter(
    (user) =>
      (!query.roles?.length || query.roles.includes(user.role)) &&
      (!query.search ||
        user.name.toLowerCase().includes(query.search.toLowerCase())),
  );
  const sort = query.sort;
  if (sort) {
    const key = sort.columnId as keyof User;
    const sign = sort.direction === 'asc' ? 1 : -1;
    rows = [...rows].sort((a, b) =>
      a[key] < b[key] ? -sign : a[key] > b[key] ? sign : 0,
    );
  }
  const start = (query.page - 1) * query.pageSize;
  const result = {
    rows: rows.slice(start, start + query.pageSize),
    total: rows.length,
  };
  return new Promise((resolve) => setTimeout(() => resolve(result), delay));
}

// Story helpers

/** The one-sentence description a story shows above its demo. */
export function about(story: string) {
  return { docs: { description: { story } } };
}

/** Prints the story's description above the demo. */
export const withDescription: Decorator = (story, context) => {
  const rendered = story();
  const description = context.parameters['docs']?.description?.story;
  // A curly brace in the sentence would open an ICU message in the template.
  const escaped = description
    ?.replace(/\{/g, '&#123;')
    .replace(/\}/g, '&#125;');
  return description
    ? {
        ...rendered,
        template: `<p style="max-width: 44rem; margin: 0 0 1.25rem; ${muted}">${escaped}</p>${rendered.template}`,
      }
    : rendered;
};

/** Every table part, in one list, for a story that wants them all. */
export const TABLE_PARTS = [
  AndesTable,
  AndesTableBody,
  AndesTableCaption,
  AndesTableCell,
  AndesTableColumnSettings,
  AndesTableDateRangeFilter,
  AndesTableEmpty,
  AndesTableExpandAll,
  AndesTableExpandedRow,
  AndesTableExpandToggle,
  AndesTableFilter,
  AndesTableFooter,
  AndesTableHead,
  AndesTableHeader,
  AndesTableRangeFilter,
  AndesTableRow,
  AndesTableSelectAll,
  AndesTableSelection,
  AndesTableTextFilter,
  AndesTableVirtualRows,
];

/** Every component and icon the Table stories draw with. */
export const withTableKit: Decorator = moduleMetadata({
  imports: [
    ...TABLE_PARTS,
    ANDES_DIALOG_IMPORTS,
    AndesAlert,
    AndesAvatar,
    AndesAvatarFallback,
    AndesBadge,
    AndesButton,
    AndesCheckbox,
    AndesDatePicker,
    AndesDropdownMenu,
    AndesDropdownMenuTrigger,
    AndesEmpty,
    AndesEmptyProvider,
    AndesFormField,
    AndesInput,
    AndesInputNumber,
    AndesPagination,
    AndesPopover,
    AndesPopoverContent,
    AndesPopoverTrigger,
    AndesRadio,
    AndesRadioGroup,
    AndesSegmented,
    AndesSelect,
    AndesSelectContent,
    AndesSelectItem,
    AndesSelectTrigger,
    AndesSelectValue,
    AndesSkeleton,
    AndesSkeletonAvatar,
    AndesSkeletonButton,
    AndesSkeletonInput,
    AndesSkeletonText,
    AndesSwitch,
    AndesTag,
    AndesTooltip,
    AndesTooltipTrigger,
    CdkDrag,
    CdkDragHandle,
    CdkDropList,
    FormsModule,
    NgIcon,
    NgTemplateOutlet,
  ],
  providers: [
    provideIcons({
      lucideArrowDown,
      lucideArrowUp,
      lucideArrowUpDown,
      lucideCalendar,
      lucideCheck,
      lucideChevronDown,
      lucideChevronRight,
      lucideChevronsDownUp,
      lucideChevronsUpDown,
      lucideCircleAlert,
      lucideCircleCheck,
      lucideCircleX,
      lucideClock,
      lucideColumns3,
      lucideCopy,
      lucideDownload,
      lucideEllipsis,
      lucideExternalLink,
      lucideEye,
      lucideEyeOff,
      lucideFile,
      lucideFileText,
      lucideFolder,
      lucideFolderOpen,
      lucideFunnel,
      lucideGripVertical,
      lucideImage,
      lucideInbox,
      lucideInfo,
      lucideLink,
      lucideMail,
      lucideMinus,
      lucidePencil,
      lucidePin,
      lucidePinOff,
      lucidePlus,
      lucideRefreshCw,
      lucideRows3,
      lucideSave,
      lucideSearch,
      lucideSettings,
      lucideStar,
      lucideTrash2,
      lucideTrendingDown,
      lucideTrendingUp,
      lucideTriangleAlert,
      lucideUser,
      lucideUsers,
      lucideX,
    }),
  ],
});
