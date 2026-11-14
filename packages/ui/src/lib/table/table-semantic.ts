import type { AndesTableDensity } from './table';

/**
 * The parts of a table that can be styled one by one:
 *
 * - `root`: the host element, around the toolbar slots and the frame;
 * - `container`: the scroll area with the frame;
 * - `caption`: the `<caption>` (the table's title);
 * - `header` / `headerCell`: the `<thead>` and its `<th>` cells;
 * - `body`: the `<tbody>`;
 * - `row` / `cell`: every `<tr>` and every body `<td>`;
 * - `footer` / `summary`: the `<tfoot>` and its `<td>` cells;
 * - `expand`, `selection`, `sorter`, `filter`: the row toggle, the row checkbox or radio,
 *   the sort indicator and the filter trigger;
 * - `empty`: the empty state;
 * - `loading`: the loading overlay.
 */
export type AndesTableSemanticPart =
  | 'root'
  | 'container'
  | 'caption'
  | 'header'
  | 'headerCell'
  | 'body'
  | 'row'
  | 'cell'
  | 'footer'
  | 'summary'
  | 'expand'
  | 'selection'
  | 'sorter'
  | 'filter'
  | 'empty'
  | 'loading';

/** Extra classes per part. */
export type AndesTableClassNames = Partial<
  Record<AndesTableSemanticPart, string | readonly string[]>
>;

/**
 * Inline styles per part. A property is spelled the CSS way (`'border-radius'`,
 * `'--my-var'`) or the camelCase way (`borderRadius`); a number means pixels, except
 * for the unitless properties (`opacity`, `zIndex`, `lineHeight`, ...).
 */
export type AndesTableStyles = Partial<
  Record<
    AndesTableSemanticPart,
    Readonly<Record<string, string | number | null | undefined>>
  >
>;

/** What the function forms of `classNames` and `styles` can base their answer on. */
export interface AndesTableSemanticProps {
  readonly density: AndesTableDensity;
  readonly bordered: boolean;
  readonly striped: boolean;
  readonly loading: boolean;
  /** Number of rows in `selectedKeys`. */
  readonly selectedCount: number;
  /** Number of rows in `expandedKeys`. */
  readonly expandedCount: number;
  /** Number of sorted columns. */
  readonly sortedCount: number;
  /** Whether any column filter is active. */
  readonly filtered: boolean;
}

/** The argument the function forms of `classNames` and `styles` receive. */
export interface AndesTableSemanticInfo {
  readonly props: AndesTableSemanticProps;
}

/** `classNames`: the parts' classes as an object, or computed from the table's state. */
export type AndesTableClassNamesInput =
  | AndesTableClassNames
  | ((info: AndesTableSemanticInfo) => AndesTableClassNames);

/** `styles`: the parts' inline styles as an object, or computed from the table's state. */
export type AndesTableStylesInput =
  AndesTableStyles | ((info: AndesTableSemanticInfo) => AndesTableStyles);

/** CSS properties whose numeric value is a plain number, not a length. */
const UNITLESS = new Set([
  'opacity',
  'z-index',
  'font-weight',
  'line-height',
  'flex',
  'flex-grow',
  'flex-shrink',
  'order',
  'zoom',
  'scale',
  'aspect-ratio',
]);

/** `borderRadius` -> `border-radius`; custom properties and dashed names are kept. */
function dashed(property: string): string {
  return property.startsWith('--')
    ? property
    : property.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
}

/**
 * Normalizes one part's style object for an Angular `[style]` binding: dashed names,
 * numbers turned into pixels (unless the property is unitless) and no empty entries.
 * `null` when there is nothing to apply.
 */
export function andesTableStyleObject(
  style:
    Readonly<Record<string, string | number | null | undefined>> | undefined,
): Record<string, string> | null {
  if (!style) {
    return null;
  }
  const result: Record<string, string> = {};
  for (const [property, value] of Object.entries(style)) {
    if (value == null || value === '') {
      continue;
    }
    const name = dashed(property);
    result[name] =
      typeof value === 'number' && value !== 0 && !UNITLESS.has(name)
        ? `${value}px`
        : String(value);
  }
  return Object.keys(result).length ? result : null;
}
