import type { TemplateRef } from '@angular/core';

/** A value of one option. Compared strictly, so `1` and `'1'` are different options. */
export type AndesCascaderValue = string | number;

/** The values from the first level down to one option. */
export type AndesCascaderPath = readonly AndesCascaderValue[];

/**
 * One option. With the default {@link AndesCascaderFieldNames} the fields below are read;
 * any other shape works when `fieldNames` says where to find them. Extra fields are kept and
 * handed back untouched in `selectedOptions`.
 */
export interface AndesCascaderOption {
  value?: AndesCascaderValue;
  label?: string;
  /** The next level. Leave it out on an option whose children load on demand. */
  children?: AndesCascaderOption[];
  disabled?: boolean;
  /** `true` marks an option that has no children even though `loadData` is set. */
  isLeaf?: boolean;
  [key: string]: unknown;
}

/** The fields of an option that hold its value, label, children, disabled and leaf flags. */
export interface AndesCascaderFieldNames {
  value?: string;
  label?: string;
  children?: string;
  disabled?: string;
  isLeaf?: string;
}

export type AndesCascaderSize = 'sm' | 'md' | 'lg';
export type AndesCascaderVariant =
  'outlined' | 'filled' | 'borderless' | 'underlined';
/** `error` also sets `aria-invalid`; `warning` is purely visual. */
export type AndesCascaderStatus = 'error' | 'warning';
/** Where the panel opens relative to the field: above or below, aligned to one edge. */
export type AndesCascaderPlacement =
  'bottomLeft' | 'bottomRight' | 'topLeft' | 'topRight';
/** What opens the next column: a click on the option, or the pointer resting on it. */
export type AndesCascaderExpandTrigger = 'click' | 'hover';
/**
 * With `multiple`, which paths the value holds when a whole branch is checked: `child` lists
 * every checked leaf, `parent` lists the branch itself instead of its leaves.
 */
export type AndesCascaderCheckedStrategy = 'child' | 'parent';

/** Settings of `showSearch`. `showSearch` itself can also simply be `true`. */
export interface AndesCascaderSearch {
  /**
   * Decides whether a path matches the text typed. Receives the text and the options from the
   * first level down to the candidate. Default: any label in the path contains the text,
   * ignoring case.
   */
  filter?: (inputValue: string, path: AndesCascaderOption[]) => boolean;
  /** Orders the matching paths, as `Array.prototype.sort` would. Default: tree order. */
  sort?: (
    a: AndesCascaderOption[],
    b: AndesCascaderOption[],
    inputValue: string,
  ) => number;
  /** Most results shown; `false` for all of them. Default `50`. */
  limit?: number | false;
  /**
   * Renders each search result, in place of the highlighted path - and of `optionTemplate`,
   * which otherwise renders the results too. Its context's `searchValue` is the text typed.
   */
  render?: TemplateRef<AndesCascaderOptionContext>;
}

/** What `selectionChange` carries. */
export interface AndesCascaderChange {
  /**
   * One path of values, or with `multiple` a list of them. Empty when the selection was
   * cleared.
   */
  value: AndesCascaderValue[] | AndesCascaderValue[][];
  /** The option objects matching `value`, in the same shape. */
  selectedOptions: AndesCascaderOption[] | AndesCascaderOption[][];
}

/** Context of the `displayRender` template (single path, or one tag with `multiple`). */
export interface AndesCascaderDisplayContext {
  /** The labels from the first level down; same as `labels`. */
  $implicit: string[];
  labels: string[];
  selectedOptions: AndesCascaderOption[];
}

/**
 * Context of the `optionTemplate`. It renders the options in the columns and, in a search,
 * the results: there `$implicit` and `label` are those of the last option of the matching
 * path, `path` holds the whole path and `searchValue` the text typed.
 */
export interface AndesCascaderOptionContext {
  $implicit: AndesCascaderOption;
  label: string;
  /** The options from the first level down to this one. */
  path: AndesCascaderOption[];
  /** The text typed into the search while the option is a search result, otherwise `null`. */
  searchValue: string | null;
}

/** One selected path as the field shows it in `multiple` mode. */
export interface AndesCascaderTag {
  /** The values from the first level down. */
  path: AndesCascaderValue[];
  /** The labels of the path. */
  labels: string[];
  /** The option objects of the path (empty for a value that is not in `options`). */
  selectedOptions: AndesCascaderOption[];
  /** `false` while the cascader is disabled. */
  closable: boolean;
}

/** Context of the `tagTemplate`. */
export interface AndesCascaderTagContext {
  $implicit: AndesCascaderTag;
  /** Removes this path, exactly as the built-in remove button does. */
  onClose: () => void;
}

/** Context of the `panelHeader` and `panelFooter` templates. */
export interface AndesCascaderPanelContext {
  /** The text typed into the search. */
  $implicit: string;
  /** Closes the panel. */
  close: () => void;
}

/**
 * How many tags `multiple` shows before the rest collapse into one "+ N" tag: a number, or
 * `'responsive'` to fit as many as one row of the field holds.
 */
export type AndesCascaderMaxTagCount = number | 'responsive';

/**
 * What stands in for the tags `maxTagCount` hides: a text, a function of the hidden tags, or a
 * template whose `$implicit` is the hidden tags.
 */
export type AndesCascaderMaxTagPlaceholder =
  | string
  | ((omitted: readonly AndesCascaderTag[]) => string)
  | TemplateRef<{ $implicit: readonly AndesCascaderTag[] }>;

/** What `loadData` receives: the options from the first level down to the one expanding. */
export type AndesCascaderLoadData = (
  selectedOptions: AndesCascaderOption[],
) => void | Promise<void>;

/** Every visible or spoken string, so the cascader can be translated. */
export interface AndesCascaderLabels {
  clear: string;
  /** `{label}` is the tag's text. */
  remove: string;
  /** Shown in the panel while `loading` and there is nothing to show yet. */
  loading: string;
  /** `{count}` more tags than `maxTagCount`. */
  moreTags: string;
  /** Accessible name of the "+ N" tag and of the popover listing the hidden tags: `{count}`. */
  moreSelected: string;
  /** Spoken after a search: `{count}` results. */
  results: string;
  /** Name of a column of options, `{level}` from 1. */
  level: string;
  /** Spoken when the user adds paths to a multiple cascader: `{labels}`, their texts. */
  tagsAdded: string;
  /** Spoken when the user takes paths off a multiple cascader: `{labels}`, their texts. */
  tagsRemoved: string;
}

export const ANDES_CASCADER_DEFAULT_LABELS: AndesCascaderLabels = {
  clear: 'Clear',
  remove: 'Remove {label}',
  loading: 'Loading',
  moreTags: '+ {count} ...',
  moreSelected: '{count} more selected',
  results: '{count} results',
  level: 'Level {level}',
  tagsAdded: 'Added {labels}',
  tagsRemoved: 'Removed {labels}',
};

export type AndesCascaderNotFound = string | TemplateRef<unknown> | null;
