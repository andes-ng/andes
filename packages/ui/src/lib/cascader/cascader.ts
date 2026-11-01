import {
  andesOverlayPreset,
  AndesOverlayContentPrimitive,
  AndesOverlayPrimitive,
  AndesOverlayTriggerPrimitive,
  provideAndesOverlay,
  type AndesOverlayAlign,
  type AndesOverlaySide,
} from '@andes-ng/primitives';
import { NgTemplateOutlet } from '@angular/common';
import {
  afterNextRender,
  afterRenderEffect,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  DOCUMENT,
  effect,
  ElementRef,
  forwardRef,
  inject,
  input,
  model,
  numberAttribute,
  output,
  signal,
  TemplateRef,
  untracked,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';

import { AndesSelectOverflow } from '../select/select-overflow';
import {
  andesMeasureTagFit,
  AndesTagOverflowHost,
} from '../select/tag-overflow';

import {
  buildTree,
  collectTerminals,
  findNode,
  highlightParts,
  nodePath,
  nodeValues,
  pathKey,
  searchPaths,
  type AndesCascaderNode,
  type AndesCascaderSearchResult,
} from './cascader-tree';
import {
  ANDES_CASCADER_DEFAULT_LABELS,
  type AndesCascaderChange,
  type AndesCascaderCheckedStrategy,
  type AndesCascaderDisplayContext,
  type AndesCascaderExpandTrigger,
  type AndesCascaderFieldNames,
  type AndesCascaderLabels,
  type AndesCascaderLoadData,
  type AndesCascaderMaxTagCount,
  type AndesCascaderMaxTagPlaceholder,
  type AndesCascaderNotFound,
  type AndesCascaderOption,
  type AndesCascaderOptionContext,
  type AndesCascaderPanelContext,
  type AndesCascaderPlacement,
  type AndesCascaderSearch,
  type AndesCascaderSize,
  type AndesCascaderStatus,
  type AndesCascaderTag,
  type AndesCascaderTagContext,
  type AndesCascaderValue,
  type AndesCascaderVariant,
} from './cascader-types';

let nextUniqueId = 0;

/** The value as the cascader holds it: one path, or with `multiple` a list of paths. */
export type AndesCascaderModel =
  | readonly AndesCascaderValue[]
  | readonly (readonly AndesCascaderValue[])[]
  | null
  | undefined;

type CheckState = 'checked' | 'indeterminate' | 'unchecked';
/** The one-shot animation a check box plays after a click changed it (check-motion.css). */
type CheckMotion = 'check' | 'uncheck' | 'indeterminate';

/** How long a check box keeps its `data-motion`: the click ring's length. */
const CHECK_MOTION_MS = 1000;
/** How long typed characters keep building one type-ahead search, as in the tree. */
const TYPEAHEAD_RESET_MS = 500;

/** Folds case and accents, so "AREQ" and "arequipa" or "Peru" and "Perú" match. */
function foldText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase();
}

/** How long a just-added tag or column keeps its `data-enter` (its enter animation and more). */
const ENTER_MS = 200;

const NAVIGATION_KEYS: ReadonlySet<string> = new Set([
  'ArrowDown',
  'ArrowUp',
  'ArrowLeft',
  'ArrowRight',
  'Home',
  'End',
  'Enter',
]);

const PLACEMENTS: Readonly<
  Record<
    AndesCascaderPlacement,
    { side: AndesOverlaySide; align: AndesOverlayAlign }
  >
> = {
  bottomLeft: { side: 'bottom', align: 'start' },
  bottomRight: { side: 'bottom', align: 'end' },
  topLeft: { side: 'top', align: 'start' },
  topRight: { side: 'top', align: 'end' },
};

/** `undefined`/`null`/`''` stay unset; anything else goes through `numberAttribute`. */
function optionalNumber(value: unknown): number | undefined {
  return value === undefined || value === null || value === ''
    ? undefined
    : numberAttribute(value);
}

/** `'responsive'` stays as is; anything else goes through {@link optionalNumber}. */
function maxTagCountAttribute(
  value: unknown,
): AndesCascaderMaxTagCount | undefined {
  return value === 'responsive' ? value : optionalNumber(value);
}

/** Room kept on a responsive row for the search input, in px (as in the select). */
const RESPONSIVE_SEARCH_RESERVE = 20;

interface SelectedEntry {
  readonly path: readonly AndesCascaderValue[];
  /** The nodes of the path, or `null` when an option on it is not in `options` (yet). */
  readonly nodes: AndesCascaderNode[] | null;
  readonly labels: string[];
  readonly options: AndesCascaderOption[];
}

interface Column {
  readonly level: number;
  readonly nodes: readonly AndesCascaderNode[];
}

/**
 * A cascading select: a field that opens a panel with one column of options per level, so a
 * value is a path through a tree (province, city, district...). The value is the array of
 * values from the first level down; with `multiple` it is a list of such arrays, shown as
 * tags.
 *
 * ```html
 * <andes-cascader [options]="regions" [(value)]="path" placeholder="Pick a place" />
 * <andes-cascader [options]="regions" multiple showSearch [formControl]="places" />
 * ```
 *
 * ## Keyboard
 *
 * The field is a combobox whose popup is a tree: focus stays on the field and the option
 * under the cursor is announced through `aria-activedescendant`. `ArrowDown`/`ArrowUp` open
 * the panel and move within the column, `ArrowRight` opens the next column and moves into it,
 * `ArrowLeft` goes back to the parent, `Enter` picks the option (or opens the next column on
 * one that cannot be picked), `Home`/`End` jump to the first and last option, `Escape` closes.
 * With `showSearch`, typing filters every path into one list that `ArrowDown`/`ArrowUp` and
 * `Enter` work on. Arrows swap sides in right-to-left pages.
 *
 * ## Pointer
 *
 * An option under the pointer is drawn highlighted (`data-highlighted`) only once the pointer
 * has moved over it, so a panel that opens beneath a pointer at rest shows no highlight. The
 * keyboard cursor (`data-active`) is separate and always visible; the next key press clears
 * the pointer highlight.
 *
 * ## Tags
 *
 * With `multiple` every path is a tag. `maxTagCount` collapses the tags past a number - or,
 * `'responsive'`, past what fits on one row - into a `+ N ...` tag (reworded by
 * `maxTagPlaceholder`), which opens a popover listing and removing the hidden ones;
 * `maxTagPopover="false"` makes it plain text instead. `maxTagTextLength` cuts long tags short.
 *
 * ## Header, footer and scrolling
 *
 * `panelHeader` and `panelFooter` put content above and below the columns, inside the panel.
 * `panelScroll` fires when a column (or the list of search results) scrolls: the "panel
 * scroll" of a cascader is the scrolling of its columns, and `event.target` is the column
 * that moved, so a `loadData` pager can watch the active one.
 *
 * ## Loading options on demand
 *
 * With `loadData`, an option that has no `children` field (and is not `isLeaf`) is
 * expandable: expanding it calls `loadData` with the options from the first level down to it,
 * shows a spinner on it, and waits for the returned promise. `loadData` may add the children
 * to the option it is given, or the options input can be replaced - both are picked up.
 */
@Component({
  selector: 'andes-cascader',
  imports: [
    AndesOverlayContentPrimitive,
    AndesOverlayTriggerPrimitive,
    AndesSelectOverflow,
    NgTemplateOutlet,
  ],
  templateUrl: './cascader.html',
  // The checkbox's shared check motion (pop, drawn tick, click ring) for the option boxes.
  // The "+ N" popover is the select's, on the select's popover surface.
  styleUrls: [
    './cascader.css',
    '../checkbox/check-motion.css',
    '../select/select-overflow.css',
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    provideAndesOverlay(),
    {
      provide: AndesTagOverflowHost,
      useExisting: forwardRef(() => AndesCascader),
    },
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AndesCascader),
      multi: true,
    },
  ],
  host: {
    // Forwarded to the real combobox instead: a screen reader never sees this wrapper, and a
    // static `id` left here would be a duplicate that a `<label for>` resolves to first.
    '[attr.id]': 'null',
    '[attr.name]': 'null',
    '[attr.aria-label]': 'null',
    '[attr.aria-labelledby]': 'null',
    '[attr.aria-describedby]': 'null',
    '[attr.aria-invalid]': 'null',
    '[attr.data-state]': 'isOpen() ? "open" : "closed"',
    '[attr.data-disabled]': 'isDisabled() ? "" : null',
  },
})
export class AndesCascader
  implements ControlValueAccessor, AndesTagOverflowHost<AndesCascaderTag>
{
  private readonly overlay = inject(AndesOverlayPrimitive);
  private readonly destroyRef = inject(DestroyRef);
  private readonly document = inject(DOCUMENT);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  private readonly panelTemplate =
    viewChild.required<TemplateRef<unknown>>('panel');
  private readonly combobox =
    viewChild<ElementRef<HTMLButtonElement | HTMLInputElement>>('combobox');
  private readonly box = viewChild<ElementRef<HTMLElement>>('box');

  /** The options of the first level, each with its own `children`. */
  readonly options = input<readonly AndesCascaderOption[] | undefined>(
    undefined,
  );
  /** Where an option object keeps its value, label, children, disabled and leaf flags. */
  readonly fieldNames = input<AndesCascaderFieldNames | undefined>(undefined);

  /**
   * The selection: the values from the first level down to the chosen option, or with
   * `multiple` a list of such paths. Two-way bindable as `[(value)]`, and written by
   * `ngModel` / `formControl` too.
   */
  readonly value = model<AndesCascaderModel>(undefined);

  /** Lets several paths be picked, with a checkbox on every option and tags in the field. */
  readonly multiple = input(false, { transform: booleanAttribute });
  /** Lets an option that has children be picked too, not just the last level. */
  readonly changeOnSelect = input(false, { transform: booleanAttribute });
  /** What opens the next column: a `click` (default) or the pointer resting on the option. */
  readonly expandTrigger = input<AndesCascaderExpandTrigger>('click');
  /** With `multiple`: list every checked leaf (`child`, default) or the checked branch. */
  readonly showCheckedStrategy = input<AndesCascaderCheckedStrategy>('child');
  /** Loads the children of an option when it is expanded. See the class comment. */
  readonly loadData = input<AndesCascaderLoadData | undefined>(undefined);
  /** Turns the field into a text input that searches every path. */
  readonly showSearch = input<boolean | AndesCascaderSearch>(false);
  /**
   * How many tags `multiple` shows before collapsing the rest into `+ N ...`. `'responsive'`
   * keeps the tags on one row and shows as many as fit.
   */
  readonly maxTagCount = input<AndesCascaderMaxTagCount | undefined, unknown>(
    undefined,
    { transform: maxTagCountAttribute },
  );
  /** Replaces the `+ N ...` text: a string, a function of the hidden tags, or a template. */
  readonly maxTagPlaceholder = input<
    AndesCascaderMaxTagPlaceholder | undefined
  >(undefined);
  /**
   * Whether the `+ N ...` tag is a button opening a popover that lists - and removes - the
   * hidden tags. Off, it is plain text with the hidden paths as a native tooltip.
   */
  readonly maxTagPopover = input(true, { transform: booleanAttribute });
  /**
   * With `multiple`, the most paths the value holds. Once it is reached the options that are
   * not checked can no longer be checked (they still open their columns), and a check whose
   * branch would overshoot it is refused.
   */
  readonly maxCount = input<number | undefined, unknown>(undefined, {
    transform: optionalNumber,
  });
  /** Longest tag text, in characters, before it is cut short with "...". */
  readonly maxTagTextLength = input<number | undefined, unknown>(undefined, {
    transform: optionalNumber,
  });
  /** Joins the labels of a path, in the field and in search results. Default ` / `. */
  readonly separator = input(' / ');
  /** Renders the selection in the field (a path, or each tag). */
  readonly displayRender = input<
    TemplateRef<AndesCascaderDisplayContext> | undefined
  >(undefined);
  /** Renders the content of every option in the panel. */
  readonly optionTemplate = input<
    TemplateRef<AndesCascaderOptionContext> | undefined
  >(undefined);
  /**
   * Replaces the arrow of an option that opens a column. Draw it pointing toward the inline
   * end: it mirrors in right-to-left pages, as the default arrow does. Context as for
   * `optionTemplate`.
   */
  readonly expandIcon = input<
    TemplateRef<AndesCascaderOptionContext> | undefined
  >(undefined);
  readonly placeholder = input<string | undefined>(undefined);
  /** What the panel shows without options or search results. `null` shows nothing. */
  readonly notFoundContent = input<AndesCascaderNotFound>('No data');
  /** Shows a spinner in the field and a loading line in an empty panel. */
  readonly loading = input(false, { transform: booleanAttribute });
  readonly size = input<AndesCascaderSize>('md');
  readonly variant = input<AndesCascaderVariant>('outlined');
  readonly status = input<AndesCascaderStatus | undefined>(undefined);
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Shows a button that empties the selection while the field is hovered or focused. */
  readonly allowClear = input(false, { transform: booleanAttribute });
  readonly placement = input<AndesCascaderPlacement>('bottomLeft');
  /** Extra classes on the overlay pane - the hook for scoping custom properties. */
  readonly panelClass = input<string | readonly string[] | null>(null);
  /**
   * Opens the panel once, right after the first render, as though the field had been
   * clicked. Later opening and closing are up to the user or `[(open)]`.
   */
  readonly defaultOpen = input(false, { transform: booleanAttribute });
  /** Marks the field required; surfaces as `aria-required` on the combobox. */
  readonly required = input(false, { transform: booleanAttribute });
  /**
   * Posts the value with a native `<form>` submission: one hidden input per selected path,
   * carrying this `name` and the value of the path's last option. Not needed with Angular
   * forms, which read the value through the control instead.
   */
  readonly name = input<string | undefined>(undefined);
  /** Focuses the combobox once the cascader has rendered, like a native `autofocus`. */
  readonly autoFocus = input(false, { transform: booleanAttribute });
  /**
   * The text typed into the search. Two-way bindable as `[(searchValue)]`; the cascader empties
   * it when the panel closes. `searchInput` fires only for text the user typed.
   */
  readonly searchValue = model('');
  /** With `multiple`, empties the search text after each pick. Turn it off to keep the results. */
  readonly autoClearSearchValue = input(true, { transform: booleanAttribute });
  /** Renders each tag in `multiple` mode, in place of the built-in one. */
  readonly tagTemplate = input<
    TemplateRef<AndesCascaderTagContext> | undefined
  >(undefined);
  /** Content rendered before the selection, inside the field box. */
  readonly prefix = input<TemplateRef<unknown> | undefined>(undefined);
  /** Replaces the chevron. `null` removes it. */
  readonly suffixIcon = input<TemplateRef<unknown> | null | undefined>(
    undefined,
  );
  /** Replaces the clear button's icon. */
  readonly clearIcon = input<TemplateRef<unknown> | undefined>(undefined);
  /** Replaces each tag's remove icon. */
  readonly removeIcon = input<TemplateRef<unknown> | undefined>(undefined);
  /**
   * Replaces the spinner: the field's while `loading`, and the one on an option while its
   * children load.
   */
  readonly loadingIcon = input<TemplateRef<unknown> | undefined>(undefined);
  /**
   * Content rendered above the columns, inside the panel - a hint, or filters. Context: the
   * search text as `$implicit`, and a `close` callback.
   */
  readonly panelHeader = input<
    TemplateRef<AndesCascaderPanelContext> | undefined
  >(undefined);
  /**
   * Content rendered below the columns, inside the panel - an "Add" form, or a link to manage
   * the options. Context as for {@link panelHeader}. A press on a text field in here keeps the
   * focus it gives it, and keys typed there are not read as option navigation.
   */
  readonly panelFooter = input<
    TemplateRef<AndesCascaderPanelContext> | undefined
  >(undefined);
  /** Overrides any of the cascader's strings, for translation. */
  readonly labels = input<Partial<AndesCascaderLabels>>({});

  /** `id` of the combobox, so a `<label for>` names it and focuses it when clicked. */
  readonly id = input<string | undefined>(undefined);
  readonly ariaLabel = input<string | undefined>(undefined, {
    alias: 'aria-label',
  });
  readonly ariaLabelledby = input<string | undefined>(undefined, {
    alias: 'aria-labelledby',
  });
  readonly ariaDescribedby = input<string | undefined>(undefined, {
    alias: 'aria-describedby',
  });
  readonly ariaInvalid = input(false, {
    alias: 'aria-invalid',
    transform: booleanAttribute,
  });

  /**
   * Whether the panel is open. Two-way bindable as `[(open)]`; `openChange` fires on every
   * transition, whatever caused it. A one-way `[open]` binding acts as a request.
   */
  readonly openState = model(false, { alias: 'open' });

  /** The user changed the selection: the values and the option objects, in the value's shape. */
  readonly selectionChange = output<AndesCascaderChange>();
  /** The user emptied the selection with the clear button. */
  readonly cleared = output<void>();
  /** The text typed into the search input. */
  readonly searchInput = output<string>();
  /** `loadData` failed (threw or rejected) for this option. */
  readonly loadError = output<{
    option: AndesCascaderOption;
    error: unknown;
  }>();
  /** Focus entered the cascader from outside it. */
  readonly focused = output<FocusEvent>();
  /**
   * Focus left the cascader altogether. Moving between the field and the panel's header or
   * footer does not count.
   */
  readonly blurred = output<FocusEvent>();
  /**
   * A column (or the list of search results) scrolled; `event.target` is the one that did. The
   * hook for loading more options at the end of the column the user is in.
   */
  readonly panelScroll = output<Event>();

  private readonly uid = nextUniqueId++;
  protected readonly panelId = this.overlay.contentId;
  protected readonly treeId = `andes-cascader-tree-${this.uid}`;
  protected readonly statusId = `andes-cascader-status-${this.uid}`;

  protected readonly text = computed(() => ({
    ...ANDES_CASCADER_DEFAULT_LABELS,
    ...this.labels(),
  }));

  private readonly disabledByForm = signal(false);
  /** Whether the cascader is disabled, by its input or by its form control. */
  readonly isDisabled = computed(
    () => this.disabled() || this.disabledByForm(),
  );
  readonly isOpen = this.overlay.isOpen;
  protected readonly invalid = computed(
    () => this.ariaInvalid() || this.status() === 'error',
  );

  // ----- Tree ---------------------------------------------------------------------------

  /** Bumped when `loadData` finishes, since it may have changed the options in place. */
  private readonly version = signal(0);
  private readonly loadedKeys = signal<ReadonlySet<string>>(new Set());
  protected readonly loadingKeys = signal<ReadonlySet<string>>(new Set());
  private pendingExpand: string | null = null;

  protected readonly tree = computed(() => {
    this.version();
    return buildTree(this.options(), this.fieldNames());
  });

  /** Whether an option has a next column, or may get one when `loadData` has run. */
  protected isBranch(node: AndesCascaderNode): boolean {
    // The node may predate a load that changed its children, so ask the current tree.
    const current = this.tree().byKey.get(node.key) ?? node;
    if (current.children.length > 0) {
      return true;
    }
    return (
      !!this.loadData() &&
      current.isLeaf !== true &&
      !current.hasChildrenField &&
      !this.loadedKeys().has(current.key)
    );
  }

  /** A node that is picked itself, rather than through its children. */
  private isTerminal(node: AndesCascaderNode): boolean {
    return node.children.length === 0 || !this.isBranch(node);
  }

  protected isPickable(node: AndesCascaderNode): boolean {
    if (node.disabled) {
      return false;
    }
    if (this.multiple()) {
      return true;
    }
    return !this.isBranch(node) || this.changeOnSelect();
  }

  // ----- Selection ----------------------------------------------------------------------

  private readonly paths = computed<AndesCascaderValue[][]>(() => {
    const value = this.value();
    if (!Array.isArray(value) || value.length === 0) {
      return [];
    }
    if (this.multiple()) {
      return (value as readonly unknown[]).filter(
        (entry): entry is AndesCascaderValue[] =>
          Array.isArray(entry) && entry.length > 0,
      );
    }
    return (value as readonly unknown[]).every((entry) => !Array.isArray(entry))
      ? [[...(value as AndesCascaderValue[])]]
      : [];
  });

  private readonly entries = computed<readonly SelectedEntry[]>(() => {
    const tree = this.tree();
    return this.paths().map((path) => {
      const last = findNode(tree, path);
      if (!last) {
        return {
          path,
          nodes: null,
          labels: path.map(String),
          options: [],
        };
      }
      const nodes = nodePath(last);
      return {
        path,
        nodes,
        labels: nodes.map((node) => node.label),
        options: nodes.map((node) => node.option),
      };
    });
  });

  protected readonly hasValue = computed(() => this.entries().length > 0);

  /** The keys of the checked leaves, with `multiple`. */
  private readonly checkedKeys = computed<ReadonlySet<string>>(() => {
    const keys = new Set<string>();
    if (!this.multiple()) {
      return keys;
    }
    for (const entry of this.entries()) {
      const last = entry.nodes?.[entry.nodes.length - 1];
      if (last) {
        for (const terminal of collectTerminals(last, (node) =>
          this.isBranch(node),
        )) {
          keys.add(terminal.key);
        }
      }
    }
    return keys;
  });

  private readonly selectedKey = computed(() => {
    if (this.multiple()) {
      return null;
    }
    const nodes = this.entries()[0]?.nodes;
    return nodes ? nodes[nodes.length - 1].key : null;
  });

  /** The nodes of the selected path, shown semibold; only a single selection has one. */
  private readonly selectedPathKeys = computed<ReadonlySet<string>>(
    () =>
      new Set(
        this.multiple()
          ? []
          : (this.entries()[0]?.nodes?.map((node) => node.key) ?? []),
      ),
  );

  /**
   * The check boxes a click just changed - the clicked one, the options it cascaded to and the
   * parents it turned mixed - and the motion each plays. Emptied once the ring has played, so
   * a box shown checked from the value never animates.
   */
  protected readonly checkMotion = signal<ReadonlyMap<string, CheckMotion>>(
    new Map(),
  );
  private checkMotionTimer: ReturnType<typeof setTimeout> | null = null;

  /** The paths the user just added, whose tags grow in; never those a value arrives with. */
  protected readonly enteringTags = signal<ReadonlySet<string>>(new Set());
  /** What the field's live region last said: the tags the user added or removed. */
  protected readonly tagAnnouncement = signal('');
  /** The level of a column that just opened beside the others, which slides in. */
  protected readonly enteringLevel = signal<number | null>(null);
  private enterTimer: ReturnType<typeof setTimeout> | null = null;
  private columnTimer: ReturnType<typeof setTimeout> | null = null;
  /** How many columns were on show, while open; `null` while closed, so opening never slides. */
  private shownColumns: number | null = null;

  protected checkState(node: AndesCascaderNode): CheckState {
    const checked = this.checkedKeys();
    const terminals = collectTerminals(node, (entry) => this.isBranch(entry));
    const count = terminals.filter((entry) => checked.has(entry.key)).length;
    if (count === 0) {
      return 'unchecked';
    }
    return count === terminals.length ? 'checked' : 'indeterminate';
  }

  /** Whether the value holds `maxCount` paths. */
  private readonly atMax = computed(() => {
    const max = this.maxCount();
    return this.multiple() && max !== undefined && this.entries().length >= max;
  });

  /** Whether `maxCount` keeps this option from being checked (it is not checked yet). */
  protected isBlocked(node: AndesCascaderNode): boolean {
    return this.atMax() && this.checkState(node) !== 'checked';
  }

  protected ariaChecked(node: AndesCascaderNode): string {
    const state = this.checkState(node);
    return state === 'indeterminate' ? 'mixed' : String(state === 'checked');
  }

  protected isSelectedNode(node: AndesCascaderNode): boolean {
    return node.key === this.selectedKey();
  }

  protected isInSelectedPath(node: AndesCascaderNode): boolean {
    return this.selectedPathKeys().has(node.key);
  }

  // ----- Field --------------------------------------------------------------------------

  protected readonly singleLabel = computed(() => {
    const entry = this.entries()[0];
    return entry ? entry.labels.join(this.separator()) : '';
  });

  /** The path shown in a single-selection field. */
  protected readonly singleEntry = computed(() =>
    this.multiple() ? undefined : this.entries()[0],
  );

  /** Whether tags are fitted to one row (`maxTagCount="responsive"`). */
  protected readonly responsive = computed(
    () => this.maxTagCount() === 'responsive' && this.multiple(),
  );
  private readonly responsiveCount = signal<number | null>(null);

  /** Every selected path as a tag, before `maxTagCount` applies. */
  protected readonly allTags = computed<AndesCascaderTag[]>(() =>
    this.entries().map((entry) => ({
      path: [...entry.path],
      labels: entry.labels,
      selectedOptions: entry.options,
      closable: !this.isDisabled(),
    })),
  );

  /** How many tags the field shows, or `undefined` for all of them. */
  private readonly shownCount = computed(() => {
    const limit = this.maxTagCount();
    if (limit === 'responsive') {
      return this.responsive()
        ? (this.responsiveCount() ?? undefined)
        : undefined;
    }
    return limit === undefined ? undefined : Math.max(limit, 0);
  });

  /** The tags the field shows. */
  readonly visibleTags = computed<AndesCascaderTag[]>(() => {
    const count = this.shownCount();
    const all = this.allTags();
    return count === undefined ? all : all.slice(0, count);
  });

  /** The tags hidden behind the `+ N ...` tag. */
  readonly omittedTags = computed<AndesCascaderTag[]>(() => {
    const count = this.shownCount();
    return count === undefined ? [] : this.allTags().slice(count);
  });

  protected readonly maxTagPlaceholderTemplate = computed(() => {
    const placeholder = this.maxTagPlaceholder();
    return placeholder instanceof TemplateRef ? placeholder : null;
  });

  protected readonly showClear = computed(
    () => this.allowClear() && this.hasValue() && !this.isDisabled(),
  );

  /** A tag's full text: its labels joined by the separator. */
  protected tagTitle(tag: { readonly labels: readonly string[] }): string {
    return tag.labels.join(this.separator());
  }

  /** A tag's shown text, cut short past `maxTagTextLength`. */
  protected tagText(tag: { readonly labels: readonly string[] }): string {
    const text = this.tagTitle(tag);
    const max = this.maxTagTextLength();
    return max !== undefined && text.length > max
      ? `${text.slice(0, max)}...`
      : text;
  }

  /** Identifies a tag across renders: the key of its path. */
  protected tagKey(tag: AndesCascaderTag): string {
    return pathKey(tag.path);
  }

  /** The `displayRender` context of a tag. */
  protected tagDisplayContext(
    tag: AndesCascaderTag,
  ): AndesCascaderDisplayContext {
    return {
      $implicit: tag.labels,
      labels: tag.labels,
      selectedOptions: tag.selectedOptions,
    };
  }

  protected displayContext(entry: SelectedEntry): AndesCascaderDisplayContext {
    return {
      $implicit: entry.labels,
      labels: entry.labels,
      selectedOptions: entry.options,
    };
  }

  protected removeLabel(tag: AndesCascaderTag): string {
    return this.text().remove.replace('{label}', this.tagTitle(tag));
  }

  /** The `+ N ...` text for a list of hidden tags, from `maxTagPlaceholder` or the label. */
  protected moreTagsText(omitted: readonly AndesCascaderTag[]): string {
    const placeholder = this.maxTagPlaceholder();
    if (typeof placeholder === 'string') {
      return placeholder;
    }
    if (typeof placeholder === 'function') {
      return placeholder(omitted);
    }
    return this.text().moreTags.replace('{count}', String(omitted.length));
  }

  /** Native tooltip of the `+ N ...` tag with `maxTagPopover` off: the paths it stands for. */
  protected readonly moreTagsTitle = computed(() =>
    this.omittedTags()
      .map((tag) => this.tagTitle(tag))
      .join(', '),
  );

  protected optionContext(node: AndesCascaderNode): AndesCascaderOptionContext {
    return {
      $implicit: node.option,
      label: node.label,
      path: nodePath(node).map((entry) => entry.option),
      searchValue: null,
    };
  }

  /** The `optionTemplate` context of a search result: the last option of the matching path. */
  protected resultContext(
    result: AndesCascaderSearchResult,
  ): AndesCascaderOptionContext {
    const node = result.nodes[result.nodes.length - 1];
    return {
      $implicit: node.option,
      label: node.label,
      path: result.nodes.map((entry) => entry.option),
      searchValue: this.searchValue(),
    };
  }

  /** Context of a `tagTemplate` tag; `remove` is the popover's own removal, when in it. */
  protected tagContext(
    tag: AndesCascaderTag,
    remove?: (tag: AndesCascaderTag) => void,
  ): AndesCascaderTagContext {
    return {
      $implicit: tag,
      onClose: () => {
        if (remove) {
          remove(tag);
        } else if (!this.isDisabled()) {
          this.removeTag(tag);
        }
      },
    };
  }

  // ----- The "+ N" popover (AndesTagOverflowHost) ----------------------------------------

  maxTagPopoverLabelFor(count: number): string {
    return this.text().moreSelected.replace('{count}', String(count));
  }

  registerOverflowPanel(element: HTMLElement | null): void {
    this.overflowPane.set(element);
  }

  canRemoveTag(tag: AndesCascaderTag): boolean {
    return tag.closable;
  }

  /** Removes the path of a tag, as its remove button does. */
  removeTag(tag: AndesCascaderTag): void {
    const key = pathKey(tag.path);
    const entry = this.entries().find((other) => pathKey(other.path) === key);
    if (entry) {
      this.removeEntry(entry);
    }
  }

  /** What a native form posts for each selected path: the value of its last option. */
  protected readonly formValues = computed(() =>
    this.entries().map((entry) => String(entry.path[entry.path.length - 1])),
  );

  protected readonly panelContext = computed<AndesCascaderPanelContext>(() => ({
    $implicit: this.searchValue(),
    close: () => this.close(),
  }));

  // ----- Search -------------------------------------------------------------------------

  protected readonly searchEnabled = computed(
    () => this.showSearch() !== false,
  );
  private readonly searchConfig = computed(() => {
    const search = this.showSearch();
    return typeof search === 'object' ? search : undefined;
  });
  protected readonly searching = computed(
    () => this.searchEnabled() && this.searchValue().trim() !== '',
  );

  protected readonly results = computed<readonly AndesCascaderSearchResult[]>(
    () => {
      if (!this.searching()) {
        return [];
      }
      return searchPaths(this.tree(), this.searchValue(), {
        search: this.searchConfig(),
        isCandidate: (node) =>
          this.multiple()
            ? this.isTerminal(node)
            : this.changeOnSelect() || !this.isBranch(node),
      });
    },
  );

  protected readonly activeResultIndex = signal(-1);

  /** What renders a search result: `showSearch.render`, else `optionTemplate`. */
  protected readonly resultTemplate = computed(
    () => this.searchConfig()?.render ?? this.optionTemplate(),
  );

  protected resultParts(result: AndesCascaderSearchResult) {
    const text = this.searchValue();
    return result.labels.map((label) => highlightParts(label, text));
  }

  protected resultChecked(result: AndesCascaderSearchResult): boolean {
    return this.checkedKeys().has(result.key);
  }

  protected resultBlocked(result: AndesCascaderSearchResult): boolean {
    return this.isBlocked(result.nodes[result.nodes.length - 1]);
  }

  protected resultSelected(result: AndesCascaderSearchResult): boolean {
    return !this.multiple() && result.key === this.selectedKey();
  }

  protected resultId(index: number): string {
    return `andes-cascader-${this.uid}-r${index}`;
  }

  protected readonly resultsAnnouncement = computed(() =>
    this.searching()
      ? this.text().results.replace('{count}', String(this.results().length))
      : '',
  );

  // ----- Columns and the cursor ---------------------------------------------------------

  /** The option the keyboard cursor (and the open columns) are on. */
  protected readonly activeKey = signal<string | null>(null);

  protected readonly activeNode = computed(() => {
    const key = this.activeKey();
    return key ? (this.tree().byKey.get(key) ?? null) : null;
  });

  protected readonly columns = computed<readonly Column[]>(() => {
    const roots = this.tree().roots;
    const columns: Column[] = [{ level: 0, nodes: roots }];
    const active = this.activeNode();
    if (active) {
      for (const node of nodePath(active)) {
        if (node.children.length > 0 && !node.disabled) {
          columns.push({ level: node.level + 1, nodes: node.children });
        }
      }
    }
    return columns;
  });

  private readonly expandedKeys = computed<ReadonlySet<string>>(() => {
    const active = this.activeNode();
    return new Set(active ? nodePath(active).map((node) => node.key) : []);
  });

  protected isExpanded(node: AndesCascaderNode): boolean {
    return this.expandedKeys().has(node.key) && node.children.length > 0;
  }

  protected isActive(node: AndesCascaderNode): boolean {
    return node.key === this.activeKey();
  }

  protected isHighlighted(node: AndesCascaderNode): boolean {
    return node.key === this.highlightedKey();
  }

  protected isLoadingNode(node: AndesCascaderNode): boolean {
    return this.loadingKeys().has(node.key);
  }

  protected itemId(node: AndesCascaderNode): string {
    return `andes-cascader-${this.uid}-n${node.id}`;
  }

  protected columnLabel(column: Column): string {
    return this.text().level.replace('{level}', String(column.level + 1));
  }

  protected readonly activeDescendantId = computed(() => {
    if (!this.isOpen()) {
      return null;
    }
    if (this.searching()) {
      const index = this.activeResultIndex();
      return index >= 0 && index < this.results().length
        ? this.resultId(index)
        : null;
    }
    const node = this.activeNode();
    return node ? this.itemId(node) : null;
  });

  protected readonly showNotFound = computed(() => {
    if (this.loading() && this.tree().roots.length === 0) {
      return false;
    }
    return (
      this.notFoundContent() !== null &&
      (this.searching()
        ? this.results().length === 0
        : this.tree().roots.length === 0)
    );
  });

  protected readonly showLoadingRow = computed(
    () => this.loading() && this.tree().roots.length === 0 && !this.searching(),
  );

  protected readonly notFoundText = computed(() => {
    const content = this.notFoundContent();
    return typeof content === 'string' ? content : null;
  });

  protected readonly notFoundTemplate = computed(() => {
    const content = this.notFoundContent();
    return content instanceof TemplateRef ? content : null;
  });

  /**
   * What the combobox controls: the tree itself, which is what its popup role names. With no
   * tree on show (an empty panel) the panel stands in, so the reference never dangles.
   */
  protected readonly controlsId = computed(() => {
    if (!this.isOpen()) {
      return null;
    }
    const hasTree = this.searching()
      ? this.results().length > 0
      : this.tree().roots.length > 0;
    return hasTree ? this.treeId : this.panelId;
  });

  protected readonly side = computed(() => PLACEMENTS[this.placement()].side);
  /** Width of the field, so the search results list is as wide as it. */
  protected readonly anchorWidth = signal(0);
  /**
   * The text direction the field is laid out in, set on the panel: the panel renders in the
   * overlay container, outside the field's own `dir`, and the columns and chevrons follow it.
   */
  protected readonly panelDirection = signal<'ltr' | 'rtl' | null>(null);

  // ----- Pointer highlight --------------------------------------------------------------

  /** The option the pointer is on (`data-highlighted`), set by a real pointer move only. */
  protected readonly highlightedKey = signal<string | null>(null);
  /** The same for a search result, by index. */
  protected readonly highlightedResult = signal(-1);
  /**
   * Where the pointer last was, in screen coordinates: at the click that opened the panel,
   * then at every move over the options. A `pointermove` at the same spot is not a move -
   * browsers may dispatch one when the panel appears or a column scrolls under a stationary
   * pointer - so it must not highlight the option that happens to be there.
   */
  private lastPointer: { readonly x: number; readonly y: number } | null = null;
  /** The open "+ N" popover's pane: focus moving into it has not left the cascader. */
  private readonly overflowPane = signal<HTMLElement | null>(null);
  private readonly selection = viewChild<ElementRef<HTMLElement>>('selection');
  private readonly measure = viewChild<ElementRef<HTMLElement>>('measure');
  private hasFocus = false;
  private destroyed = false;
  private typeahead = '';
  private typeaheadTimer: ReturnType<typeof setTimeout> | null = null;

  private onChange: (value: AndesCascaderModel) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  constructor() {
    this.overlay.configure({
      // `menu` is the closest preset: anchored to the field, click-opened, dismissed by
      // Escape and outside-click, no backdrop and no scroll lock. Focus stays on the combobox
      // (the active option is announced through `aria-activedescendant`), and the role is
      // `none` because the panel's own elements carry the tree roles.
      ...andesOverlayPreset('menu'),
      role: 'none',
      autoFocus: 'none',
      positioning: {
        kind: 'anchored',
        side: 'bottom',
        align: 'start',
        sideOffset: 4,
        // Above or below the field only: beside it, the panel no longer reads as its own.
        crossSideFallback: false,
      },
    });

    effect(() => {
      const { side, align } = PLACEMENTS[this.placement()];
      this.overlay.configure({
        positioning: {
          kind: 'anchored',
          side,
          align,
          sideOffset: 4,
          crossSideFallback: false,
        },
      });
    });

    effect(() => this.overlay.configure({ panelClass: this.panelClass() }));

    effect(() => {
      if (this.isDisabled() && this.overlay.isOpen()) {
        this.overlay.close('imperative');
      }
    });

    // `[open]` is honoured after render: the panel template and the field (the positioning
    // anchor) only exist once the view has rendered.
    afterRenderEffect(() => {
      const requested = booleanAttribute(this.openState());
      untracked(() => {
        if (requested && !this.overlay.isOpen()) {
          this.open();
        } else if (!requested && this.overlay.isOpen()) {
          this.close();
        }
      });
    });

    // A new search keeps the first result under the cursor, so Enter picks it right away.
    effect(() => {
      const results = this.results();
      untracked(() =>
        this.activeResultIndex.set(
          results.findIndex((result) => !result.disabled),
        ),
      );
    });

    // Brings the option under the cursor into view inside its own scrolling column.
    afterRenderEffect(() => {
      const id = this.activeDescendantId();
      if (id) {
        untracked(() => this.revealItem(id));
      }
    });

    // The panel is as tall as its tallest column; follow the options as they come and go.
    afterRenderEffect(() => {
      this.columns();
      this.results();
      untracked(() => this.overlay.updatePosition());
    });

    this.overlay.opened.pipe(takeUntilDestroyed()).subscribe(() => {
      this.openState.set(true);
    });

    this.overlay.closed.pipe(takeUntilDestroyed()).subscribe(() => {
      this.activeKey.set(null);
      this.pendingExpand = null;
      this.clearPointerHighlight();
      this.lastPointer = null;
      if (this.searchValue() !== '') {
        this.searchValue.set('');
      }
      this.openState.set(false);
      this.onTouched();
    });

    // A resized field re-fits responsive tags.
    afterNextRender(() => {
      const box = this.box()?.nativeElement;
      if (typeof ResizeObserver === 'undefined' || !box) {
        return;
      }
      const observer = new ResizeObserver(() => this.fitTags());
      observer.observe(box);
      this.destroyRef.onDestroy(() => observer.disconnect());
    });

    // Re-fit once the measuring row has rendered a changed set of tags.
    afterRenderEffect(() => {
      this.allTags();
      this.searchEnabled();
      if (!this.responsive()) {
        untracked(() => this.responsiveCount.set(null));
        return;
      }
      this.measure();
      untracked(() => this.fitTags());
    });

    // A column that opens beside the others, while the panel is open, slides in.
    effect(() => {
      const count = this.columns().length;
      const open = this.overlay.isOpen();
      untracked(() => {
        if (open && this.shownColumns !== null && count > this.shownColumns) {
          this.enteringLevel.set(count - 1);
          clearTimeout(this.columnTimer ?? undefined);
          this.columnTimer = setTimeout(() => {
            this.columnTimer = null;
            this.enteringLevel.set(null);
          }, ENTER_MS);
        }
        this.shownColumns = open ? count : null;
      });
    });

    this.destroyRef.onDestroy(() => {
      this.destroyed = true;
      clearTimeout(this.enterTimer ?? undefined);
      clearTimeout(this.columnTimer ?? undefined);
      clearTimeout(this.typeaheadTimer ?? undefined);
      if (this.checkMotionTimer !== null) {
        clearTimeout(this.checkMotionTimer);
      }
    });

    afterNextRender(() => {
      if (this.autoFocus()) {
        this.focus();
      }
      if (this.defaultOpen() && !this.overlay.isOpen()) {
        this.open();
      }
    });
  }

  // ----- Public API ---------------------------------------------------------------------

  /** Opens the panel, with the cursor on the selected option. */
  open(): void {
    if (this.isDisabled() || this.overlay.isOpen()) {
      return;
    }
    this.anchorWidth.set(
      this.box()?.nativeElement.getBoundingClientRect().width ?? 0,
    );
    this.panelDirection.set(this.isRtl() ? 'rtl' : 'ltr');
    this.overlay.open(this.panelTemplate(), {
      // The anchor is the whole field box, which is not focusable; focus belongs on the
      // combobox inside it.
      restoreFocusTo: this.combobox(),
    });
    const selected = this.selectedKey();
    if (selected) {
      this.activeKey.set(selected);
    }
  }

  /** Closes the panel. */
  close(): void {
    this.overlay.close('imperative');
  }

  /** Opens the panel if closed, closes it if open. */
  toggle(): void {
    if (this.overlay.isOpen()) {
      this.close();
    } else {
      this.open();
    }
  }

  /** Moves focus to the combobox. */
  focus(options?: FocusOptions): void {
    this.combobox()?.nativeElement.focus(options);
  }

  /** Removes focus from the combobox. */
  blur(): void {
    this.combobox()?.nativeElement.blur();
  }

  /** Empties the selection, as the clear button does. */
  clearValue(): void {
    if (this.isDisabled() || !this.hasValue()) {
      return;
    }
    this.commit([], []);
    this.cleared.emit();
  }

  // ----- ControlValueAccessor -----------------------------------------------------------

  writeValue(value: AndesCascaderModel): void {
    this.value.set(value);
  }

  registerOnChange(fn: (value: AndesCascaderModel) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabledByForm.set(isDisabled);
  }

  // ----- Pointer ------------------------------------------------------------------------

  protected onBoxMousedown(event: MouseEvent): void {
    if (this.isDisabled()) {
      return;
    }
    const target = event.target as HTMLElement;
    // A press on the box itself (or its text) keeps focus on the combobox rather than
    // dropping it; presses on the buttons and the input behave as they normally do.
    if (!target.closest('button, input')) {
      event.preventDefault();
      this.focus({ preventScroll: true });
    }
  }

  protected onBoxClick(event: MouseEvent): void {
    if (this.isDisabled()) {
      return;
    }
    const target = event.target as HTMLElement;
    if (target.closest('.andes-cascader__clear, .andes-cascader__tag-remove')) {
      return;
    }
    // A click with no pointer behind it (`detail` 0) comes from a keyboard or from assistive
    // technology; otherwise remember where the pointer is, so the panel opening beneath it
    // does not count as a move.
    this.lastPointer =
      event.detail === 0 ? null : { x: event.screenX, y: event.screenY };
    if (this.searchEnabled()) {
      this.open();
      this.focus({ preventScroll: true });
    } else {
      this.toggle();
    }
  }

  /**
   * A press inside the panel never takes focus from the combobox - the options are reached
   * through `aria-activedescendant` - except on a text field of the header or footer, which
   * must be able to take it.
   */
  protected onPanelMousedown(event: MouseEvent): void {
    const target = event.target as Element | null;
    if (
      target?.closest(
        'input, textarea, select, [contenteditable=""], [contenteditable="true"]',
      )
    ) {
      return;
    }
    event.preventDefault();
  }

  protected onPanelKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Tab') {
      return;
    }
    // Tab off the first or last control of the header or footer goes on from the field.
    const tabbables = Array.from(
      this.overlay
        .panelElement()
        ?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ) ?? [],
    );
    const edge = event.shiftKey
      ? tabbables[0]
      : tabbables[tabbables.length - 1];
    if (!edge || event.target === edge) {
      this.focus({ preventScroll: true });
      this.close();
    }
  }

  protected onPanelScroll(event: Event): void {
    this.panelScroll.emit(event);
  }

  protected onClearClick(event: MouseEvent): void {
    event.stopPropagation();
    this.clearValue();
    this.focus({ preventScroll: true });
  }

  protected onTagRemoveClick(tag: AndesCascaderTag, event: MouseEvent): void {
    event.stopPropagation();
    this.removeTag(tag);
  }

  /**
   * Counts how many tags fit on the field's one row, for `maxTagCount="responsive"`, from the
   * invisible measuring row; a search keeps room for its input.
   */
  private fitTags(): void {
    const measure = this.measure()?.nativeElement;
    const selection = this.selection()?.nativeElement;
    if (!this.responsive() || !measure || !selection) {
      return;
    }
    const count = andesMeasureTagFit(
      measure,
      selection,
      this.searchEnabled() ? RESPONSIVE_SEARCH_RESERVE : 0,
    );
    if (count !== null) {
      this.responsiveCount.set(count);
    }
  }

  protected onItemClick(node: AndesCascaderNode): void {
    if (node.disabled) {
      return;
    }
    this.setActive(node);
    if (this.isBranch(node)) {
      if (this.changeOnSelect() && !this.multiple()) {
        this.pick(node);
      }
      return;
    }
    this.pick(node);
  }

  protected onItemCheckboxClick(
    node: AndesCascaderNode,
    event: MouseEvent,
  ): void {
    event.stopPropagation();
    if (node.disabled) {
      return;
    }
    this.toggleChecked(node);
  }

  /** The pointer resting on an option opens its column, with `expandTrigger="hover"`. */
  protected onItemEnter(node: AndesCascaderNode): void {
    if (this.expandTrigger() === 'hover' && !node.disabled) {
      this.setActive(node);
    }
  }

  /** A real pointer move over an option highlights it; it never moves the keyboard cursor. */
  protected onItemPointerMove(
    node: AndesCascaderNode,
    event: PointerEvent,
  ): void {
    if (this.pointerMoved(event)) {
      this.highlightedKey.set(node.disabled ? null : node.key);
    }
  }

  protected onResultClick(index: number): void {
    this.pickResult(index);
  }

  /** The pointer on a result highlights it and carries the cursor there, so Enter picks it. */
  protected onResultPointerMove(index: number, event: PointerEvent): void {
    if (!this.pointerMoved(event)) {
      return;
    }
    if (this.results()[index]?.disabled) {
      this.highlightedResult.set(-1);
      return;
    }
    this.highlightedResult.set(index);
    this.activeResultIndex.set(index);
  }

  protected onPanelPointerLeave(): void {
    this.clearPointerHighlight();
  }

  /** Whether a `pointermove` is a move of a mouse or pen, not touch or a repeat of a spot. */
  private pointerMoved(event: PointerEvent): boolean {
    if (event.pointerType === 'touch') {
      return false;
    }
    const last = this.lastPointer;
    if (last && last.x === event.screenX && last.y === event.screenY) {
      return false;
    }
    this.lastPointer = { x: event.screenX, y: event.screenY };
    return true;
  }

  private clearPointerHighlight(): void {
    this.highlightedKey.set(null);
    this.highlightedResult.set(-1);
  }

  // ----- Focus --------------------------------------------------------------------------

  /** Focus entering the field, its panel or its "+ N" popover. */
  onFocusIn(event: FocusEvent): void {
    if (!this.hasFocus) {
      this.hasFocus = true;
      this.focused.emit(event);
    }
  }

  /**
   * Focus moving between the field and the panel's header or footer is not a blur. When the
   * new target is unknown (focus going nowhere, or an element being removed), the check
   * waits a task for focus to settle.
   */
  onFocusOut(event: FocusEvent): void {
    if (!this.hasFocus || this.ownsElement(event.relatedTarget)) {
      return;
    }
    setTimeout(() => {
      if (
        this.destroyed ||
        !this.hasFocus ||
        this.ownsElement(this.document.activeElement)
      ) {
        return;
      }
      this.hasFocus = false;
      this.blurred.emit(event);
    });
  }

  private ownsElement(target: EventTarget | null): boolean {
    if (!(target instanceof Node)) {
      return false;
    }
    const panel = this.overlay.panelElement();
    const overflow = this.overflowPane();
    return (
      this.host.nativeElement.contains(target) ||
      (panel !== null && panel.contains(target)) ||
      (overflow !== null && overflow.contains(target))
    );
  }

  // ----- Keyboard -----------------------------------------------------------------------

  protected onKeydown(event: KeyboardEvent): void {
    if (this.isDisabled() || event.altKey || event.ctrlKey || event.metaKey) {
      return;
    }
    const open = this.overlay.isOpen();
    const key = event.key;

    // The keyboard cursor takes over from the pointer highlight, so one row is lit at a time.
    if (NAVIGATION_KEYS.has(key)) {
      this.clearPointerHighlight();
    }

    if (key === 'Tab') {
      if (open) {
        this.close();
      }
      return;
    }

    // Backspace in an empty field takes the last tag off.
    if (
      key === 'Backspace' &&
      this.multiple() &&
      this.searchValue() === '' &&
      this.entries().length > 0
    ) {
      event.preventDefault();
      this.removeEntry(this.entries()[this.entries().length - 1]);
      return;
    }

    if (this.searching() && open) {
      this.onSearchKeydown(event);
      return;
    }

    // Without a search input, typing jumps to the next option of the cursor's column whose
    // label starts with the typed text.
    if (!this.searchEnabled() && this.isTypeaheadKey(key)) {
      event.preventDefault();
      this.typeAhead(key);
      return;
    }

    const rtl = this.isRtl();
    const forward = rtl ? 'ArrowLeft' : 'ArrowRight';
    const backward = rtl ? 'ArrowRight' : 'ArrowLeft';
    // In the search input, Space is a character and Home/End move the caret once there is
    // text; with no text there is nothing to move, so they navigate the options.
    const isSearchInput = this.searchEnabled();

    switch (key) {
      case 'ArrowDown':
      case 'ArrowUp':
        event.preventDefault();
        if (!open) {
          this.open();
          if (!this.activeKey()) {
            this.setActive(
              this.edgeNode(this.tree().roots, key === 'ArrowDown'),
            );
          }
        } else {
          this.moveSibling(key === 'ArrowDown' ? 1 : -1);
        }
        return;
      case 'Enter':
        event.preventDefault();
        if (!open) {
          this.open();
        } else {
          this.activateCursor();
        }
        return;
      case ' ':
        if (isSearchInput) {
          return;
        }
        event.preventDefault();
        if (!open) {
          this.open();
        } else {
          this.activateCursor();
        }
        return;
      case 'Home':
      case 'End':
        if (open) {
          event.preventDefault();
          const column = this.cursorColumn();
          this.setActive(this.edgeNode(column, key === 'Home'));
        }
        return;
      default:
        break;
    }

    if (key === forward && open) {
      event.preventDefault();
      this.expandCursor();
    } else if (key === backward && open) {
      event.preventDefault();
      const parent = this.activeNode()?.parent;
      if (parent) {
        this.setActive(parent);
      }
    }
  }

  private onSearchKeydown(event: KeyboardEvent): void {
    const count = this.results().length;
    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowUp': {
        event.preventDefault();
        if (count === 0) {
          return;
        }
        const step = event.key === 'ArrowDown' ? 1 : -1;
        const results = this.results();
        let index = this.activeResultIndex() + step;
        while (index >= 0 && index < count && results[index].disabled) {
          index += step;
        }
        if (index >= 0 && index < count) {
          this.activeResultIndex.set(index);
        }
        return;
      }
      case 'Enter':
        event.preventDefault();
        this.pickResult(this.activeResultIndex());
        return;
      default:
        return;
    }
  }

  protected onSearchInput(text: string): void {
    this.searchValue.set(text);
    this.searchInput.emit(text);
    if (!this.overlay.isOpen()) {
      this.open();
    }
  }

  // ----- Cursor movement ----------------------------------------------------------------

  /** Puts the cursor on a node, expanding it (and loading its children on demand). */
  private setActive(node: AndesCascaderNode | null): void {
    if (!node) {
      return;
    }
    this.activeKey.set(node.key);
    if (!node.disabled && this.isBranch(node)) {
      this.ensureLoaded(node);
    }
  }

  /** A printable character; Space only once a type-ahead search has started. */
  private isTypeaheadKey(key: string): boolean {
    if (key.length !== 1) {
      return false;
    }
    return key !== ' ' || this.typeahead !== '';
  }

  /**
   * Moves the cursor to the next enabled option of its column (the first column when the panel
   * is closed, which this opens) whose label starts with what was typed in the last half second.
   * Typing one letter again and again cycles through the options starting with it.
   */
  private typeAhead(char: string): void {
    clearTimeout(this.typeaheadTimer ?? undefined);
    this.typeaheadTimer = setTimeout(() => {
      this.typeaheadTimer = null;
      this.typeahead = '';
    }, TYPEAHEAD_RESET_MS);
    this.typeahead += foldText(char);

    if (!this.overlay.isOpen()) {
      this.open();
    }
    const column = this.cursorColumn().filter((node) => !node.disabled);
    if (column.length === 0) {
      return;
    }
    const buffer = this.typeahead;
    const repeated = [...buffer].every((letter) => letter === buffer[0]);
    const needle = repeated ? buffer[0] : buffer;
    const active = this.activeNode();
    const at = active ? column.indexOf(active) : -1;
    // A fresh search (or one letter repeated) looks past the cursor; a longer one may stay.
    const from = at === -1 ? 0 : at + (buffer.length === 1 || repeated ? 1 : 0);
    this.clearPointerHighlight();
    for (let step = 0; step < column.length; step++) {
      const node = column[(from + step) % column.length];
      if (foldText(node.label).startsWith(needle)) {
        this.setActive(node);
        return;
      }
    }
  }

  private cursorColumn(): readonly AndesCascaderNode[] {
    const active = this.activeNode();
    return active
      ? (active.parent?.children ?? this.tree().roots)
      : this.tree().roots;
  }

  private edgeNode(
    nodes: readonly AndesCascaderNode[],
    first: boolean,
  ): AndesCascaderNode | null {
    const enabled = nodes.filter((node) => !node.disabled);
    return (first ? enabled[0] : enabled[enabled.length - 1]) ?? null;
  }

  private moveSibling(delta: 1 | -1): void {
    const active = this.activeNode();
    const column = this.cursorColumn();
    if (!active) {
      this.setActive(this.edgeNode(column, delta === 1));
      return;
    }
    let index = column.indexOf(active) + delta;
    while (index >= 0 && index < column.length && column[index].disabled) {
      index += delta;
    }
    if (index >= 0 && index < column.length) {
      this.setActive(column[index]);
    }
  }

  /** Right arrow: into the next column, loading it first if need be. */
  private expandCursor(): void {
    const active = this.activeNode();
    if (!active) {
      this.setActive(this.edgeNode(this.tree().roots, true));
      return;
    }
    if (active.disabled || !this.isBranch(active)) {
      return;
    }
    const first = this.edgeNode(active.children, true);
    if (first) {
      this.setActive(first);
    } else {
      this.pendingExpand = active.key;
      this.ensureLoaded(active);
    }
  }

  /** Enter: picks the option under the cursor, or opens its next column. */
  private activateCursor(): void {
    const active = this.activeNode();
    if (!active) {
      this.setActive(this.edgeNode(this.tree().roots, true));
      return;
    }
    if (this.isPickable(active)) {
      this.pick(active);
    } else {
      this.expandCursor();
    }
  }

  // ----- Loading on demand --------------------------------------------------------------

  private ensureLoaded(node: AndesCascaderNode): void {
    const load = this.loadData();
    if (
      !load ||
      node.children.length > 0 ||
      node.hasChildrenField ||
      node.isLeaf === true ||
      this.loadedKeys().has(node.key) ||
      this.loadingKeys().has(node.key)
    ) {
      return;
    }
    this.loadingKeys.update((keys) => new Set(keys).add(node.key));
    const finish = (error?: unknown, failed = false) => {
      this.loadingKeys.update((keys) => {
        const next = new Set(keys);
        next.delete(node.key);
        return next;
      });
      if (failed) {
        this.pendingExpand = null;
        this.loadError.emit({ option: node.option, error });
        return;
      }
      this.loadedKeys.update((keys) => new Set(keys).add(node.key));
      this.version.update((version) => version + 1);
      if (this.pendingExpand === node.key) {
        this.pendingExpand = null;
        const loaded = this.tree().byKey.get(node.key);
        const first = loaded && this.edgeNode(loaded.children, true);
        if (first && this.overlay.isOpen()) {
          this.setActive(first);
        }
      }
    };
    try {
      const result = load(nodePath(node).map((entry) => entry.option));
      if (result && typeof (result as Promise<void>).then === 'function') {
        (result as Promise<void>).then(
          () => finish(),
          (error: unknown) => finish(error, true),
        );
      } else {
        finish();
      }
    } catch (error) {
      finish(error, true);
    }
  }

  // ----- Picking ------------------------------------------------------------------------

  private pick(node: AndesCascaderNode): void {
    if (this.multiple()) {
      this.toggleChecked(node);
      return;
    }
    const values = nodeValues(node);
    const options = nodePath(node).map((entry) => entry.option);
    const changed = pathKey(values) !== pathKey(this.paths()[0] ?? []);
    if (changed) {
      this.commit(values, options);
    }
    // A branch picked with `changeOnSelect` keeps the panel open on its children.
    if (!this.isBranch(node)) {
      this.close();
    }
  }

  private pickResult(index: number): void {
    const result = this.results()[index];
    if (!result || result.disabled) {
      return;
    }
    const node = result.nodes[result.nodes.length - 1];
    if (this.multiple()) {
      this.toggleChecked(node);
      if (this.autoClearSearchValue()) {
        this.searchValue.set('');
      }
      return;
    }
    const values = result.nodes.map((entry) => entry.value);
    if (pathKey(values) !== pathKey(this.paths()[0] ?? [])) {
      this.commit(
        values,
        result.nodes.map((entry) => entry.option),
      );
    }
    this.close();
  }

  /** Checks or unchecks a leaf, or every leaf below a branch. */
  private toggleChecked(node: AndesCascaderNode): void {
    const terminals = collectTerminals(node, (entry) =>
      this.isBranch(entry),
    ).filter((terminal) =>
      nodePath(terminal).every((entry) => !entry.disabled),
    );
    if (terminals.length === 0) {
      return;
    }
    const checked = this.checkedKeys();
    const allChecked = terminals.every((terminal) => checked.has(terminal.key));
    const remove = new Set(terminals.map((terminal) => terminal.key));
    const keys = allChecked
      ? [...checked].filter((key) => !remove.has(key))
      : [
          ...checked,
          ...terminals.map((t) => t.key).filter((key) => !checked.has(key)),
        ];
    const max = this.maxCount();
    if (
      !allChecked &&
      max !== undefined &&
      this.checkedSelection(keys).paths.length > max
    ) {
      return;
    }
    const before = this.shownCheckStates();
    this.commitChecked(keys);
    this.playCheckMotion(before);
  }

  /** The drawn state of every check box on show: the open columns, or the search results. */
  private shownCheckStates(): Map<string, CheckState> {
    const states = new Map<string, CheckState>();
    const nodes = this.searching()
      ? this.results().map((result) => result.nodes[result.nodes.length - 1])
      : this.columns().flatMap((column) => column.nodes);
    for (const node of nodes) {
      states.set(node.key, this.checkState(node));
    }
    return states;
  }

  /** Animates every box on show whose drawn state the click changed, for one ring's length. */
  private playCheckMotion(before: ReadonlyMap<string, CheckState>): void {
    const motion = new Map<string, CheckMotion>();
    for (const [key, state] of this.shownCheckStates()) {
      if (before.has(key) && before.get(key) !== state) {
        motion.set(
          key,
          state === 'checked'
            ? 'check'
            : state === 'indeterminate'
              ? 'indeterminate'
              : 'uncheck',
        );
      }
    }
    if (this.checkMotionTimer !== null) {
      clearTimeout(this.checkMotionTimer);
    }
    this.checkMotion.set(motion);
    this.checkMotionTimer = setTimeout(() => {
      this.checkMotionTimer = null;
      this.checkMotion.set(new Map());
    }, CHECK_MOTION_MS);
  }

  private removeEntry(entry: SelectedEntry): void {
    const remaining = this.entries().filter((other) => other !== entry);
    const paths = remaining.map((other) => [...other.path]);
    const options = remaining.map((other) => other.options);
    this.commit(paths, options);
  }

  private commitChecked(terminalKeys: readonly string[]): void {
    const { paths, options } = this.checkedSelection(terminalKeys);
    this.commit(paths, options);
  }

  /** The paths (and their options) a set of checked leaves makes, by `showCheckedStrategy`. */
  private checkedSelection(terminalKeys: readonly string[]): {
    paths: AndesCascaderValue[][];
    options: AndesCascaderOption[][];
  } {
    const tree = this.tree();
    const extras = this.entries()
      .filter((entry) => entry.nodes === null)
      .map((entry) => [...entry.path]);
    const keys = new Set(terminalKeys);
    const nodes: AndesCascaderNode[] =
      this.showCheckedStrategy() === 'parent'
        ? this.collapseChecked(tree.roots, keys)
        : terminalKeys
            .map((key) => tree.byKey.get(key))
            .filter((node): node is AndesCascaderNode => !!node);
    const paths = [...extras, ...nodes.map((node) => nodeValues(node))];
    const options = [
      ...extras.map(() => [] as AndesCascaderOption[]),
      ...nodes.map((node) => nodePath(node).map((entry) => entry.option)),
    ];
    return { paths, options };
  }

  /** The outermost nodes whose every pickable leaf is checked. */
  private collapseChecked(
    nodes: readonly AndesCascaderNode[],
    keys: ReadonlySet<string>,
  ): AndesCascaderNode[] {
    const result: AndesCascaderNode[] = [];
    for (const node of nodes) {
      const terminals = collectTerminals(node, (entry) =>
        this.isBranch(entry),
      ).filter((terminal) => !terminal.disabled);
      if (terminals.length > 0 && terminals.every((t) => keys.has(t.key))) {
        result.push(node);
      } else if (node.children.length > 0 && this.isBranch(node)) {
        result.push(...this.collapseChecked(node.children, keys));
      } else if (keys.has(node.key)) {
        result.push(node);
      }
    }
    return result;
  }

  /** Writes a new selection and reports it. */
  private commit(
    value: AndesCascaderValue[] | AndesCascaderValue[][],
    selectedOptions: AndesCascaderOption[] | AndesCascaderOption[][],
  ): void {
    const previous = this.entries();
    const before = new Set(previous.map((entry) => pathKey(entry.path)));
    this.value.set(value);
    this.markEntering(before);
    this.announceTags(previous);
    this.onChange(value);
    this.selectionChange.emit({ value, selectedOptions });
  }

  /**
   * Tells a screen reader which paths came and went in a multiple cascader: a tag removed from
   * the field (or its popover) and the leaves a checked branch brings in are otherwise silent.
   */
  private announceTags(previous: readonly SelectedEntry[]): void {
    if (!this.multiple()) {
      return;
    }
    const keys = (entries: readonly SelectedEntry[]) =>
      new Set(entries.map((entry) => pathKey(entry.path)));
    const before = keys(previous);
    const after = keys(this.entries());
    const titles = (entries: readonly SelectedEntry[], skip: Set<string>) =>
      entries
        .filter((entry) => !skip.has(pathKey(entry.path)))
        .map((entry) => this.tagTitle(entry))
        .join(', ');
    const added = titles(this.entries(), before);
    const removed = titles(previous, after);
    const text = this.text();
    const parts = [
      added ? text.tagsAdded.replace('{labels}', added) : '',
      removed ? text.tagsRemoved.replace('{labels}', removed) : '',
    ].filter(Boolean);
    if (parts.length > 0) {
      this.tagAnnouncement.set(parts.join('. '));
    }
  }

  /** Marks the tags the commit just added, so they grow in. */
  private markEntering(before: ReadonlySet<string>): void {
    if (!this.multiple()) {
      return;
    }
    const added = this.entries()
      .map((entry) => pathKey(entry.path))
      .filter((key) => !before.has(key));
    if (added.length === 0) {
      return;
    }
    this.enteringTags.set(new Set(added));
    clearTimeout(this.enterTimer ?? undefined);
    this.enterTimer = setTimeout(() => {
      this.enterTimer = null;
      this.enteringTags.set(new Set());
    }, ENTER_MS);
  }

  // ----- Internals ----------------------------------------------------------------------

  private isRtl(): boolean {
    const element = this.combobox()?.nativeElement;
    return (
      !!element &&
      this.document.defaultView?.getComputedStyle(element).direction === 'rtl'
    );
  }

  private revealItem(id: string): void {
    const item = this.document.getElementById(id);
    const list = item?.parentElement;
    if (!item || !list) {
      return;
    }
    const top = item.offsetTop;
    const bottom = top + item.offsetHeight;
    if (top < list.scrollTop) {
      list.scrollTop = top;
    } else if (bottom > list.scrollTop + list.clientHeight) {
      list.scrollTop = bottom - list.clientHeight;
    }
  }

  protected markTouched(): void {
    if (!this.overlay.isOpen()) {
      this.onTouched();
    }
  }
}
