/**
 * Turns whatever shape the consumer's data has into the chart's own records: nested `children`
 * or flat `id` / `parentId` rows, with every field name configurable. Pure functions, no Angular.
 */
import type { AndesOrgChartKey } from './org-chart-layout';

/**
 * Where the chart reads each fact from on a data item. Every key is optional and falls back to
 * the name in brackets, so data shaped like `{ id, name, title, children }` needs no mapping.
 */
export interface AndesOrgChartFieldNames {
  /** Unique key of the node (`id`). Numbers and strings are different keys. */
  readonly id?: string;
  /** Key of the manager, for flat data (`parentId`). Empty or unknown means a root. */
  readonly parentId?: string;
  /** Nested reports, for nested data (`children`). */
  readonly children?: string;
  /** Person's name, also used for initials, typeahead and search (`name`). */
  readonly name?: string;
  /** Role or job title (`title`). */
  readonly title?: string;
  /** Photo URL; without one the card shows initials (`avatar`). */
  readonly avatar?: string;
  /** Accent color of the card, any CSS color (`color`). */
  readonly color?: string;
  /** The node cannot be selected or toggled and is announced as disabled (`disabled`). */
  readonly disabled?: string;
  /** The node can be expanded and focused but not selected (`readonly`). */
  readonly readonly?: string;
  /** The node is an assistant, placed beside its manager's stem (`assistant`). */
  readonly assistant?: string;
  /** With `loadChildren`: `true` marks a node that never has reports to load (`isLeaf`). */
  readonly isLeaf?: string;
}

/** The field names used when none are given. */
export const ANDES_ORG_CHART_FIELD_NAMES: Required<AndesOrgChartFieldNames> = {
  id: 'id',
  parentId: 'parentId',
  children: 'children',
  name: 'name',
  title: 'title',
  avatar: 'avatar',
  color: 'color',
  disabled: 'disabled',
  readonly: 'readonly',
  assistant: 'assistant',
  isLeaf: 'isLeaf',
};

/** Whether `data` holds nested items with `children`, or flat rows that name their manager. */
export type AndesOrgChartDataFormat = 'nested' | 'flat';

/** One node as the chart keeps it. */
export interface OrgChartRecord<T> {
  readonly key: AndesOrgChartKey;
  readonly data: T;
  readonly parent: OrgChartRecord<T> | null;
  readonly children: OrgChartRecord<T>[];
  /** 0 for a root. */
  readonly depth: number;
  readonly name: string;
  readonly title: string;
  readonly avatar: string | null;
  readonly color: string | null;
  readonly disabled: boolean;
  readonly readonly: boolean;
  readonly assistant: boolean;
  /** `isLeaf` was set: nothing will ever be loaded under this node. */
  readonly leaf: boolean;
  /** Everyone below the node, at any depth (known nodes only). */
  descendants: number;
}

/** The chart's model of the data. */
export interface OrgChartTree<T> {
  readonly roots: OrgChartRecord<T>[];
  readonly byKey: ReadonlyMap<AndesOrgChartKey, OrgChartRecord<T>>;
}

type Item = Readonly<Record<string, unknown>>;

function read(item: unknown, field: string): unknown {
  return item !== null && typeof item === 'object'
    ? (item as Item)[field]
    : undefined;
}

function asKey(value: unknown): AndesOrgChartKey | null {
  return typeof value === 'string' || typeof value === 'number' ? value : null;
}

function asText(value: unknown): string {
  return typeof value === 'string'
    ? value
    : typeof value === 'number'
      ? String(value)
      : '';
}

/** Merges partial field names over the defaults. */
export function resolveFieldNames(
  names: AndesOrgChartFieldNames | null | undefined,
): Required<AndesOrgChartFieldNames> {
  return { ...ANDES_ORG_CHART_FIELD_NAMES, ...(names ?? {}) };
}

/** One or two letters for an avatar without a photo: first and last word of the name. */
export function andesOrgChartInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return '';
  }
  const first = Array.from(words[0])[0] ?? '';
  const last =
    words.length > 1 ? (Array.from(words[words.length - 1])[0] ?? '') : '';
  return (first + last).toLocaleUpperCase();
}

/**
 * Converts flat rows (`{ id, parentId }`) into nested items (`{ id, children }`). Rows keep all
 * their fields; each gets a shallow copy with its reports in the `children` field. A row whose
 * manager is missing becomes a root, and a cycle is broken at its first row.
 */
export function andesOrgChartFromFlat<T extends object>(
  rows: readonly T[],
  fieldNames?: AndesOrgChartFieldNames,
): T[] {
  const names = resolveFieldNames(fieldNames);
  const tree = buildOrgChartTree<T>(rows, 'flat', names, new Map());
  const copy = (record: OrgChartRecord<T>): T =>
    ({
      ...record.data,
      [names.children]: record.children.map(copy),
    }) as T;
  return tree.roots.map(copy);
}

interface Pending<T> {
  readonly data: T;
  readonly key: AndesOrgChartKey;
  readonly parent: OrgChartRecord<T> | null;
  readonly depth: number;
}

/**
 * Builds the records. `loaded` holds children fetched by `loadChildren`, keyed by their parent;
 * they are appended after any children the data already has. Items without a usable key and
 * repeated keys are skipped (the first one wins), so bad data never breaks the chart.
 */
export function buildOrgChartTree<T>(
  data: readonly T[] | T | null | undefined,
  format: AndesOrgChartDataFormat,
  names: Required<AndesOrgChartFieldNames>,
  loaded: ReadonlyMap<AndesOrgChartKey, readonly T[]>,
): OrgChartTree<T> {
  const items: readonly T[] =
    data === null || data === undefined
      ? []
      : Array.isArray(data)
        ? (data as readonly T[])
        : [data as T];
  const byKey = new Map<AndesOrgChartKey, OrgChartRecord<T>>();
  const roots: OrgChartRecord<T>[] = [];

  // Flat rows: group by manager first, then walk from the roots like nested data.
  let childrenOf: (item: T, key: AndesOrgChartKey) => readonly T[];
  let topLevel: readonly T[];
  let flatRows: readonly T[] = [];
  if (format === 'flat') {
    const keys = new Set<AndesOrgChartKey>();
    for (const item of items) {
      const key = asKey(read(item, names.id));
      if (key !== null) {
        keys.add(key);
      }
    }
    const grouped = new Map<AndesOrgChartKey, T[]>();
    const tops: T[] = [];
    for (const item of items) {
      const key = asKey(read(item, names.id));
      const parentKey = asKey(read(item, names.parentId));
      if (key === null) {
        continue;
      }
      if (parentKey === null || parentKey === key || !keys.has(parentKey)) {
        tops.push(item);
      } else {
        const list = grouped.get(parentKey);
        if (list) {
          list.push(item);
        } else {
          grouped.set(parentKey, [item]);
        }
      }
    }
    childrenOf = (_item, key) => grouped.get(key) ?? [];
    topLevel = tops;
    flatRows = items;
  } else {
    childrenOf = (item) => {
      const value = read(item, names.children);
      return Array.isArray(value) ? (value as readonly T[]) : [];
    };
    topLevel = items;
  }

  const visit = (
    start: readonly T[],
    parent: OrgChartRecord<T> | null,
  ): void => {
    const stack: Pending<T>[] = [];
    const push = (
      list: readonly T[],
      owner: OrgChartRecord<T> | null,
      depth: number,
    ): void => {
      for (let index = list.length - 1; index >= 0; index--) {
        const key = asKey(read(list[index], names.id));
        if (key !== null) {
          stack.push({ data: list[index], key, parent: owner, depth });
        }
      }
    };
    push(start, parent, parent ? parent.depth + 1 : 0);
    while (stack.length) {
      const next = stack.pop() as Pending<T>;
      if (byKey.has(next.key)) {
        continue;
      }
      const record: OrgChartRecord<T> = {
        key: next.key,
        data: next.data,
        parent: next.parent,
        children: [],
        depth: next.depth,
        name: asText(read(next.data, names.name)),
        title: asText(read(next.data, names.title)),
        avatar: asText(read(next.data, names.avatar)) || null,
        color: asText(read(next.data, names.color)) || null,
        disabled: read(next.data, names.disabled) === true,
        readonly: read(next.data, names.readonly) === true,
        assistant: read(next.data, names.assistant) === true,
        leaf: read(next.data, names.isLeaf) === true,
        descendants: 0,
      };
      byKey.set(record.key, record);
      if (record.parent) {
        record.parent.children.push(record);
      } else {
        roots.push(record);
      }
      const extra = loaded.get(record.key) ?? [];
      const own = childrenOf(next.data, record.key);
      push(extra.length ? [...own, ...extra] : own, record, record.depth + 1);
    }
  };

  visit(topLevel, null);
  // Rows that sit on a cycle never hang from a root: break the cycle at its first row.
  for (const item of flatRows) {
    const key = asKey(read(item, names.id));
    if (key !== null && !byKey.has(key)) {
      visit([item], null);
    }
  }

  // Descendant counts, children before parents.
  const order: OrgChartRecord<T>[] = [];
  const walk = [...roots];
  while (walk.length) {
    const record = walk.pop() as OrgChartRecord<T>;
    order.push(record);
    walk.push(...record.children);
  }
  for (let index = order.length - 1; index >= 0; index--) {
    const record = order[index];
    record.descendants = record.children.reduce(
      (sum, child) => sum + 1 + child.descendants,
      0,
    );
  }

  return { roots, byKey };
}
