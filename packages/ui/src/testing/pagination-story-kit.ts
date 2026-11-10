import { NgTemplateOutlet } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideArrowLeft,
  lucideArrowRight,
  lucideBookOpen,
  lucideCalendar,
  lucideCamera,
  lucideCheck,
  lucideChevronFirst,
  lucideChevronLast,
  lucideChevronLeft,
  lucideChevronRight,
  lucideChevronsLeft,
  lucideChevronsRight,
  lucideCornerDownLeft,
  lucideDownload,
  lucideEllipsis,
  lucideFileText,
  lucideGauge,
  lucideGlobe,
  lucideHash,
  lucideHeart,
  lucideImage,
  lucideKeyboard,
  lucideLayoutGrid,
  lucideList,
  lucideLoaderCircle,
  lucideMail,
  lucideMessageSquare,
  lucideMinus,
  lucideMoveLeft,
  lucideMoveRight,
  lucideNewspaper,
  lucidePackage,
  lucidePlus,
  lucideRefreshCw,
  lucideRows3,
  lucideSearch,
  lucideSkipBack,
  lucideSkipForward,
  lucideStar,
  lucideTable,
  lucideTrash2,
  lucideUser,
  lucideUsers,
} from '@ng-icons/lucide';
import { type Decorator, moduleMetadata } from '@storybook/angular';

import { AndesAvatar } from '../lib/avatar/avatar';
import { AndesAvatarFallback } from '../lib/avatar/avatar-fallback';
import { AndesBadge } from '../lib/badge/badge';
import { AndesButton } from '../lib/button/button';
import { AndesEmpty } from '../lib/empty/empty';
import { AndesInput } from '../lib/input/input';
import { AndesPagination } from '../lib/pagination/pagination';
import { AndesSegmented } from '../lib/segmented/segmented';
import { AndesSelect } from '../lib/select/select';
import { AndesSwitch } from '../lib/switch/switch';
import { AndesTag } from '../lib/tag/tag';
import { AndesTooltip } from '../lib/tooltip/tooltip';
import { AndesTooltipTrigger } from '../lib/tooltip/tooltip-trigger';

/*
 * What the Pagination stories share: the layout and text styles, the helpers that write a
 * story's one-sentence description and the markup of a labelled example, the sample data the
 * compositions page through, the decorator that prints the description above the example, and
 * one module decorator with the components and lucide icons the stories compose. Internal to
 * the stories: excluded from the library build in `tsconfig.lib.json`.
 */

export const font = 'font-family: var(--andes-font-family), sans-serif;';

/** Body text. */
export const text = `${font} font-size: 0.875rem; line-height: 1.25rem; color: var(--andes-color-foreground);`;

/** Secondary text. */
export const muted = `${font} font-size: 0.875rem; line-height: 1.25rem; color: var(--andes-color-muted-foreground);`;

/** Emphasised body text. */
export const strong = `${font} font-size: 0.875rem; line-height: 1.25rem; font-weight: 600; color: var(--andes-color-foreground);`;

/** The small label above a variant. */
export const caption = `${font} display: block; margin: 0 0 0.5rem; font-size: 0.75rem; line-height: 1rem; color: var(--andes-color-muted-foreground);`;

/** A small heading. */
export const heading = `${font} margin: 0; font-size: 1rem; line-height: 1.5rem; font-weight: 600; color: var(--andes-color-foreground);`;

/** A paragraph. */
export const para = `${text} margin: 0;`;

/** A column of examples, 1.5rem apart, at a readable width. */
export const column =
  'display: flex; flex-direction: column; gap: 1.5rem; width: min(44rem, calc(100vw - 2rem));';

/** A wider column, for footers and grids. */
export const wide =
  'display: flex; flex-direction: column; gap: 1.5rem; width: min(56rem, calc(100vw - 2rem));';

/** A row of controls. */
export const row =
  'display: flex; flex-wrap: wrap; align-items: center; gap: 0.75rem;';

/** A card surface for the compositions. */
export const card =
  'box-sizing: border-box; border: 1px solid var(--andes-color-border); border-radius: var(--andes-radius-lg); background: var(--andes-color-card); color: var(--andes-color-card-foreground);';

/** One labelled switch or select of a demo's controls. */
export const control = `display: inline-flex; align-items: center; gap: 0.5rem; ${text}`;

/** A line of a list (an avatar, a title and a line of detail). */
export const listRow =
  'display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 1rem; border-block-end: 1px solid var(--andes-color-border);';

/** The styles every story template may read, to spread into its `props`. */
export const shared = {
  text,
  muted,
  strong,
  caption,
  heading,
  para,
  column,
  wide,
  row,
  card,
  control,
  listRow,
};

/** The story's one-sentence description, for `parameters`. */
export function about(story: string) {
  return { docs: { description: { story } } };
}

/** What a story's `render` returns: the template and the props it reads. */
export function scene(template: string, props: Record<string, unknown> = {}) {
  return { props: { ...shared, ...props }, template };
}

/**
 * A pagination with an accessible name and the given attributes. The page-size select is left
 * out unless the attributes ask for it (or draw the table footer), so an example about
 * something else is not crowded by the select that appears on its own above 50 items.
 */
export function pg(attributes = '', label = 'Pagination'): string {
  const asksForSelect =
    attributes.includes('showSizeChanger') ||
    attributes.includes('totalBoundaryShowSizeChanger') ||
    attributes.includes('layout="table"');
  return pgAuto(
    asksForSelect ? attributes : `${attributes} [showSizeChanger]="false"`,
    label,
  );
}

/** A pagination that decides for itself whether to draw the page-size select. */
export function pgAuto(attributes = '', label = 'Pagination'): string {
  return `<andes-pagination aria-label="${label}" ${attributes} />`;
}

/** An example with the small label above it. */
export function labelled(title: string, markup: string): string {
  return `<div><span [style]="caption">${title}</span>${markup}</div>`;
}

/** Examples one under another. */
export function stack(...parts: string[]): string {
  return `<div [style]="column">${parts.join('')}</div>`;
}

/** Examples one under another, wider. */
export function stackWide(...parts: string[]): string {
  return `<div [style]="wide">${parts.join('')}</div>`;
}

/** `1..count`. */
export function range(count: number): number[] {
  return Array.from({ length: count }, (_, i) => i + 1);
}

/** The rows of `page` at `size` rows per page. */
export function slicePage<T>(rows: readonly T[], page: number, size: number) {
  return rows.slice((page - 1) * size, page * size);
}

const FIRST_NAMES = [
  'Ada',
  'Grace',
  'Alan',
  'Katherine',
  'Linus',
  'Margaret',
  'Dennis',
  'Barbara',
  'Edsger',
  'Radia',
  'Donald',
  'Frances',
  'Ken',
  'Sophie',
  'Tim',
  'Hedy',
  'Claude',
  'Annie',
  'Brian',
  'Joan',
];

const LAST_NAMES = [
  'Lovelace',
  'Hopper',
  'Turing',
  'Johnson',
  'Torvalds',
  'Hamilton',
  'Ritchie',
  'Liskov',
  'Dijkstra',
  'Perlman',
];

const ROLES = ['Engineer', 'Designer', 'Researcher', 'Manager', 'Analyst'];

export interface Person {
  id: number;
  name: string;
  initials: string;
  role: string;
  email: string;
}

/** `count` people, with names that do not repeat in a row. */
export function people(count: number): Person[] {
  return range(count).map((id) => {
    const first = FIRST_NAMES[(id - 1) % FIRST_NAMES.length] as string;
    const last = LAST_NAMES[(id * 3) % LAST_NAMES.length] as string;
    return {
      id,
      name: `${first} ${last}`,
      initials: `${first[0]}${last[0]}`,
      role: ROLES[id % ROLES.length] as string,
      email: `${first.toLowerCase()}.${last.toLowerCase()}@example.com`,
    };
  });
}

export interface Order {
  id: string;
  customer: string;
  status: 'Paid' | 'Pending' | 'Refunded';
  amount: string;
}

/** `count` orders for the table footers. */
export function orders(count: number): Order[] {
  const statuses: Order['status'][] = ['Paid', 'Pending', 'Refunded', 'Paid'];
  return people(count).map((person, index) => ({
    id: `ORD-${String(1000 + person.id)}`,
    customer: person.name,
    status: statuses[index % statuses.length] as Order['status'],
    amount: `$${(40 + ((person.id * 37) % 460)).toFixed(2)}`,
  }));
}

export interface Article {
  id: number;
  title: string;
  summary: string;
  minutes: number;
}

const TOPICS = [
  'Designing calm interfaces',
  'Why small controls matter',
  'Keyboard first, mouse second',
  'A field guide to empty states',
  'Writing for the screen reader',
  'Motion that respects the user',
  'Dark themes without the guesswork',
  'Spacing is a feature',
];

/** `count` articles for the blog and search compositions. */
export function articles(count: number): Article[] {
  return range(count).map((id) => ({
    id,
    title: `${TOPICS[(id - 1) % TOPICS.length]} - part ${Math.ceil(id / TOPICS.length)}`,
    summary:
      'A short note on how the details add up to an interface that feels effortless to use.',
    minutes: 3 + (id % 7),
  }));
}

/** The tint of each tile of a gallery. */
export const TILE_TINTS = [
  '#dbeafe',
  '#dcfce7',
  '#fef3c7',
  '#fce7f3',
  '#ede9fe',
  '#cffafe',
];

/**
 * Prints the story's one-sentence description above the example, so it reads in the canvas as
 * well as in the docs page.
 */
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

/** Every component and icon the Pagination stories draw with. */
export const withPaginationKit: Decorator = moduleMetadata({
  imports: [
    AndesAvatar,
    AndesAvatarFallback,
    AndesBadge,
    AndesButton,
    AndesEmpty,
    AndesInput,
    AndesPagination,
    AndesSegmented,
    AndesSelect,
    AndesSwitch,
    AndesTag,
    AndesTooltip,
    AndesTooltipTrigger,
    FormsModule,
    NgIcon,
    NgTemplateOutlet,
  ],
  providers: [
    provideIcons({
      lucideArrowLeft,
      lucideArrowRight,
      lucideBookOpen,
      lucideCalendar,
      lucideCamera,
      lucideCheck,
      lucideChevronFirst,
      lucideChevronLast,
      lucideChevronLeft,
      lucideChevronRight,
      lucideChevronsLeft,
      lucideChevronsRight,
      lucideCornerDownLeft,
      lucideDownload,
      lucideEllipsis,
      lucideFileText,
      lucideGauge,
      lucideGlobe,
      lucideHash,
      lucideHeart,
      lucideImage,
      lucideKeyboard,
      lucideLayoutGrid,
      lucideList,
      lucideLoaderCircle,
      lucideMail,
      lucideMessageSquare,
      lucideMinus,
      lucideMoveLeft,
      lucideMoveRight,
      lucideNewspaper,
      lucidePackage,
      lucidePlus,
      lucideRefreshCw,
      lucideRows3,
      lucideSearch,
      lucideSkipBack,
      lucideSkipForward,
      lucideStar,
      lucideTable,
      lucideTrash2,
      lucideUser,
      lucideUsers,
    }),
  ],
});

/** The control size (`sm`, `md`, `lg`) of a pagination's resolved size, for a control of your own. */
export function controlSize(size: string): 'sm' | 'md' | 'lg' {
  return size === 'small' ? 'sm' : size === 'large' ? 'lg' : 'md';
}

/** Adds (or replaces) a `<style>` in the page, for the classes a `classNames` story hands out. */
export function injectStyle(id: string, css: string): void {
  if (typeof document === 'undefined') {
    return;
  }
  let element = document.getElementById(id);
  if (!element) {
    element = document.createElement('style');
    element.id = id;
    document.head.appendChild(element);
  }
  element.textContent = css;
}
