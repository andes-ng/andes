import {
  andesOverlayPreset,
  AndesOverlayContentPrimitive,
  AndesOverlayPrimitive,
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
  contentChild,
  DestroyRef,
  effect,
  ElementRef,
  forwardRef,
  inject,
  Injector,
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
import { matchTriggerWidthAttribute } from '../select/select-state';
import {
  andesMeasureTagFit,
  AndesTagOverflowHost,
} from '../select/tag-overflow';
import { AndesTree, type AndesTreeExpandAction } from '../tree/tree';
import { AndesTreeNodeTemplate } from '../tree/tree-node-template';
import type {
  AndesTreeCheckedStrategy,
  AndesTreeCheckEvent,
  AndesTreeFieldNames,
  AndesTreeKey,
  AndesTreeLoadData,
  AndesTreeNode,
  AndesTreeNodeEvent,
  AndesTreeSelectEvent,
} from '../tree/tree-types';
import {
  andesCheckedKeysByStrategy,
  andesConductCheck,
  andesCreateTreeIndex,
  andesGetExpandableKeys,
  andesToggleCheck,
} from '../tree/tree-utils';
import type {
  AndesTreeSelectLabeledValue,
  AndesTreeSelectLabels,
  AndesTreeSelectMaxTagCount,
  AndesTreeSelectMaxTagPlaceholder,
  AndesTreeSelectModel,
  AndesTreeSelectOption,
  AndesTreeSelectPanelContext,
  AndesTreeSelectPlacement,
  AndesTreeSelectSearchPlacement,
  AndesTreeSelectSize,
  AndesTreeSelectStatus,
  AndesTreeSelectTag,
  AndesTreeSelectTagContext,
  AndesTreeSelectValue,
  AndesTreeSelectVariant,
} from './tree-select-types';

const DEFAULT_LABELS: AndesTreeSelectLabels = {
  empty: 'No data',
  loading: 'Loading',
  searchPlaceholder: 'Search',
  searchLabel: 'Search the options',
  clear: 'Clear',
  remove: (title) => `Remove ${title}`,
  more: (count) => `+ ${count} ...`,
  moreSelected: (count) => `${count} more selected`,
  tagsAdded: (titles) => `Added ${titles.join(', ')}`,
  tagsRemoved: (titles) => `Removed ${titles.join(', ')}`,
};

/** Room kept on a responsive row for the in-field search input (its 4rem minimum), in px. */
const RESPONSIVE_SEARCH_RESERVE = 64;

// The panel stays above or below the field: beside it, it would no longer read as its list.
const PLACEMENTS: Readonly<
  Record<
    AndesTreeSelectPlacement,
    { side: AndesOverlaySide; align: AndesOverlayAlign }
  >
> = {
  bottomLeft: { side: 'bottom', align: 'start' },
  bottomRight: { side: 'bottom', align: 'end' },
  topLeft: { side: 'top', align: 'start' },
  topRight: { side: 'top', align: 'end' },
};

let nextId = 0;

function optionalNumber(value: unknown): number | undefined {
  return value === undefined || value === null || value === ''
    ? undefined
    : numberAttribute(value);
}

/** `'responsive'` stays as is; anything else goes through {@link optionalNumber}. */
function maxTagCountAttribute(
  value: unknown,
): AndesTreeSelectMaxTagCount | undefined {
  return value === 'responsive' ? value : optionalNumber(value);
}

function isLabeled(value: unknown): value is AndesTreeSelectLabeledValue {
  return (
    typeof value === 'object' &&
    value !== null &&
    'value' in value &&
    'label' in value
  );
}

/** The keys a model holds, whether bare or wrapped by `labelInValue`. */
function toKeys(
  value: AndesTreeSelectModel | undefined,
  labelInValue: boolean,
): AndesTreeKey[] {
  if (value === null || value === undefined) {
    return [];
  }
  const list: readonly unknown[] = Array.isArray(value) ? value : [value];
  return list.map((entry) =>
    labelInValue && isLabeled(entry) ? entry.value : (entry as AndesTreeKey),
  );
}

/**
 * A select whose options form a tree. The field shows the selection (one value, or removable
 * tags); the panel that opens above or below it holds an {@link AndesTree}, so every tree
 * feature - expanding, filtering, loading children on demand, field renaming, custom node
 * content, virtual scrolling - is available inside the panel.
 *
 * ```html
 * <andes-tree-select
 *   [nodes]="regions"
 *   [(value)]="region"
 *   placeholder="Pick a region"
 *   aria-label="Region"
 * />
 * ```
 *
 * ## Values
 *
 * The value is the key of the selected node, or `null`. With `multiple` it is an array of keys
 * and the field shows a tag per node. With `checkable` the panel shows checkboxes that cascade
 * (use `checkStrictly` to make them independent) and `showCheckedStrategy` decides what the
 * value (and the tags) contain when a parent is checked: `child` (the default) only the leaves,
 * `parent` the topmost checked nodes, `all` every checked node.
 *
 * ## Tags
 *
 * A multiple select shows a tag per node. `maxTagCount` collapses the tags past a number - or,
 * `'responsive'`, past what fits on one row - into a "+ N" tag, which opens a popover listing
 * (and removing) the hidden ones; `maxTagPopover="false"` makes it plain text instead.
 * `maxTagTextLength` cuts long tags short, and `maxCount` caps how many nodes the value holds.
 *
 * ## Search
 *
 * `showSearch` adds a search box that filters the tree, in the panel by default or in the field
 * itself with `searchPlacement="trigger"`.
 *
 * ## Keyboard
 *
 * With the field focused, ArrowDown, ArrowUp, Enter and Space open the panel and move focus
 * into its tree (ArrowDown on the field while the panel is open does the same, when focus came
 * back to it). Escape closes the panel and returns focus to the field, and Tab leaves.
 * Backspace removes the last tag of a multiple select. Inside the tree the usual treeview keys apply. The field
 * is the combobox and names the tree in `aria-controls`.
 *
 * ## Value
 *
 * `labelInValue` swaps the bare keys for `{ value, label }` objects, in `value`, in
 * `selectionChange` and in `optionSelect` / `optionDeselect`: the label travels with the key, so
 * a selected node that is not in `nodes` (yet) still reads right in the field.
 *
 * ## Panel
 *
 * `panelHeader` and `panelFooter` put content above and below the tree, inside the panel;
 * `panelScroll` fires when the panel's list scrolls (the virtual list too). `[(open)]` follows
 * the panel whoever opens or closes it, and `defaultOpen` opens it once on render.
 *
 * ## Forms
 *
 * It is a `ControlValueAccessor`, and forwards `id`, `name` and the `aria-*` inputs to the
 * focusable field, so it works with `andes-form-field`.
 */
@Component({
  selector: 'andes-tree-select',
  imports: [
    NgTemplateOutlet,
    AndesTree,
    AndesOverlayContentPrimitive,
    AndesSelectOverflow,
  ],
  templateUrl: './tree-select.html',
  // The "+ N" popover is the select's, on the select's popover surface.
  styleUrls: ['./tree-select.css', '../select/select-overflow.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    provideAndesOverlay(),
    {
      provide: AndesTagOverflowHost,
      useExisting: forwardRef(() => AndesTreeSelect),
    },
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AndesTreeSelect),
      multi: true,
    },
  ],
  host: {
    // Forwarded to the real combobox instead: a screen reader never sees this host element.
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
export class AndesTreeSelect
  implements ControlValueAccessor, AndesTagOverflowHost<AndesTreeSelectTag>
{
  private readonly injector = inject(Injector);
  private readonly overlay = inject(AndesOverlayPrimitive);
  private readonly destroyRef = inject(DestroyRef);

  /** The options. Update it to deliver children loaded on demand. */
  readonly nodes = input<AndesTreeNode[]>([]);
  readonly fieldNames = input<AndesTreeFieldNames | undefined>(undefined);

  /**
   * A key, `null`, or (multiple and checkable) an array of keys; with `labelInValue`,
   * `{ value, label }` objects in their place.
   */
  readonly value = model<AndesTreeSelectModel>(null);
  /** Open nodes, two-way. */
  readonly expandedKeys = model<AndesTreeKey[]>([]);
  /** The text in the search box. */
  readonly searchValue = model('');

  readonly multiple = input(false, { transform: booleanAttribute });
  /** Checkboxes in the panel; implies a multiple value. */
  readonly checkable = input(false, { transform: booleanAttribute });
  readonly checkStrictly = input(false, { transform: booleanAttribute });
  readonly showCheckedStrategy = input<AndesTreeCheckedStrategy>('child');

  readonly size = input<AndesTreeSelectSize>('md');
  readonly variant = input<AndesTreeSelectVariant>('outlined');
  readonly status = input<AndesTreeSelectStatus | undefined>(undefined);
  readonly placeholder = input<string | undefined>(undefined);
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly required = input(false, { transform: booleanAttribute });
  readonly allowClear = input(false, { transform: booleanAttribute });
  readonly loading = input(false, { transform: booleanAttribute });

  readonly showSearch = input(false, { transform: booleanAttribute });
  readonly searchPlacement = input<AndesTreeSelectSearchPlacement>('panel');
  readonly filterFn = input<
    ((node: AndesTreeNode, query: string) => boolean) | undefined
  >(undefined);
  /**
   * In a multiple or checkable select, empties the search text after each pick, as the select
   * does. Turn it off to keep the filtered tree while picking several matches.
   */
  readonly autoClearSearchValue = input(true, { transform: booleanAttribute });

  /**
   * Opens the panel once, right after the first render, as though the field had been clicked.
   * Later opening and closing are up to the user or `[(open)]`.
   */
  readonly defaultOpen = input(false, { transform: booleanAttribute });
  /** Emit and accept `{ value, label }` objects instead of bare keys. */
  readonly labelInValue = input(false, { transform: booleanAttribute });

  /** Open every branch the first time options arrive. */
  readonly treeDefaultExpandAll = input(false, { transform: booleanAttribute });
  readonly loadData = input<AndesTreeLoadData | undefined>(undefined);
  readonly showLine = input(false, { transform: booleanAttribute });
  readonly showIcon = input(false, { transform: booleanAttribute });
  /** What expands a branch: a click on the row, a double click, or only its switcher (`false`). */
  readonly expandAction = input<AndesTreeExpandAction | undefined>(undefined);
  readonly virtualScroll = input(false, { transform: booleanAttribute });
  /** Tallest the panel's list grows before it scrolls (a number is px). */
  readonly panelHeight = input<number>(320);

  /**
   * How many tags to show before the rest collapse into one "+ N" tag. `'responsive'` keeps the
   * tags on one row and shows as many as fit.
   */
  readonly maxTagCount = input<AndesTreeSelectMaxTagCount | undefined, unknown>(
    undefined,
    { transform: maxTagCountAttribute },
  );
  readonly maxTagPlaceholder = input<
    AndesTreeSelectMaxTagPlaceholder | undefined
  >(undefined);
  /**
   * Whether the "+ N" tag is a button opening a popover that lists - and removes - the hidden
   * tags. Off, it is plain text with the hidden titles as a native tooltip.
   */
  readonly maxTagPopover = input(true, { transform: booleanAttribute });
  /**
   * Most nodes a multiple or checkable select holds. Once the value reaches it, every other
   * node in the panel is disabled until one is taken off; a check that would cascade past it
   * is refused.
   */
  readonly maxCount = input<number | undefined, unknown>(undefined, {
    transform: optionalNumber,
  });
  /** Longest tag text, in characters, before it is cut short with "...". */
  readonly maxTagTextLength = input<number | undefined, unknown>(undefined, {
    transform: optionalNumber,
  });

  readonly placement = input<AndesTreeSelectPlacement>('bottomLeft');
  /**
   * Panel width: `true` (the default) sizes it to the field, `false` to its own content, and a
   * number sets it in px.
   */
  readonly matchTriggerWidth = input<boolean | number | undefined, unknown>(
    undefined,
    { transform: matchTriggerWidthAttribute },
  );
  /** Extra classes on the overlay pane - the hook for scoping custom properties. */
  readonly panelClass = input<string | readonly string[] | null>(null);
  /** Renders each tag in a multiple select, in place of the built-in one. */
  readonly tagTemplate = input<
    TemplateRef<AndesTreeSelectTagContext> | undefined
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
  /** Replaces the spinner shown in the field while `loading`. */
  readonly loadingIcon = input<TemplateRef<unknown> | undefined>(undefined);
  /**
   * Content rendered above the tree, inside the panel - a hint, or filters. Context: the search
   * text as `$implicit`, and a `close` callback.
   */
  readonly panelHeader = input<
    TemplateRef<AndesTreeSelectPanelContext> | undefined
  >(undefined);
  /**
   * Content rendered below the tree, inside the panel - an "Add" form, or a link to manage the
   * options. Context as for {@link panelHeader}.
   */
  readonly panelFooter = input<
    TemplateRef<AndesTreeSelectPanelContext> | undefined
  >(undefined);
  readonly labels = input<Partial<AndesTreeSelectLabels>>({});

  readonly id = input<string | undefined>(undefined);
  readonly name = input<string | undefined>(undefined);
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
   * transition, whatever caused it. A one-way `[open]` binding acts as a request: the user can
   * still close the panel, and the binding only re-applies when its value changes.
   */
  readonly openState = model(false, { alias: 'open' });
  /** The search text changed because the user typed. */
  readonly searched = output<string>();
  /** The clear button emptied the select. */
  readonly cleared = output<void>();
  readonly focused = output<FocusEvent>();
  readonly blurred = output<FocusEvent>();
  /**
   * The user changed the selection - picked, checked, removed a tag or cleared - with the new
   * value, in the shape of `value`. Never fires for a value written by a form or a binding.
   */
  readonly selectionChange = output<AndesTreeSelectModel>();
  /** The user added a node to the selection: its key, or `{ value, label }` with `labelInValue`. */
  readonly optionSelect = output<AndesTreeKey | AndesTreeSelectLabeledValue>();
  /** The user took a node off the selection (a tag removed, a node unchecked): same shape. */
  readonly optionDeselect = output<
    AndesTreeKey | AndesTreeSelectLabeledValue
  >();
  /**
   * The panel's list scrolled (the virtual list too) - the hook for loading more nodes at its
   * end.
   */
  readonly panelScroll = output<Event>();

  /** Custom node content for the panel's tree. */
  protected readonly nodeTemplate = contentChild(AndesTreeNodeTemplate);

  private readonly box = viewChild.required<ElementRef<HTMLElement>>('box');
  private readonly searchInput =
    viewChild<ElementRef<HTMLInputElement>>('searchInput');
  private readonly tree = viewChild(AndesTree);
  private readonly panelTemplate =
    viewChild.required<TemplateRef<unknown>>('panel');

  protected readonly uid = nextId++;
  protected readonly panelId = `andes-tree-select-panel-${this.uid}`;
  protected readonly summaryId = `andes-tree-select-summary-${this.uid}`;

  /** Whether the panel is open. `false` as soon as a close is requested. */
  readonly isOpen = this.overlay.isOpen;

  private readonly disabledByForm = signal(false);
  /** Whether the select is disabled, by its input or by its form control. */
  readonly isDisabled = computed(
    () => this.disabled() || this.disabledByForm(),
  );

  protected readonly text = computed<AndesTreeSelectLabels>(() => ({
    ...DEFAULT_LABELS,
    ...this.labels(),
  }));

  protected readonly multiMode = computed(
    () => this.multiple() || this.checkable(),
  );
  protected readonly searchInTrigger = computed(
    () => this.showSearch() && this.searchPlacement() === 'trigger',
  );
  protected readonly searchInPanel = computed(
    () => this.showSearch() && this.searchPlacement() === 'panel',
  );
  /** The tree's `multiple` is about selection; a checkable tree selects nothing. */
  protected readonly treeSelectable = computed(() => !this.checkable());

  protected readonly index = computed(() =>
    andesCreateTreeIndex(this.nodes(), this.fieldNames()),
  );
  private readonly titleCache = new Map<AndesTreeKey, string>();

  protected readonly valueKeys = computed(() =>
    toKeys(this.value(), this.labelInValue()),
  );
  /** The labels a `labelInValue` value brings along, for keys whose nodes are not in `nodes`. */
  private readonly valueLabels = computed(() => {
    const labels = new Map<AndesTreeKey, string>();
    const raw = this.value();
    if (this.labelInValue() && raw !== null && raw !== undefined) {
      for (const entry of Array.isArray(raw) ? raw : [raw]) {
        if (isLabeled(entry)) {
          labels.set(entry.value, String(entry.label));
        }
      }
    }
    return labels;
  });
  /** The strategy that applies: independent nodes have no parents to fold into. */
  private readonly strategy = computed<AndesTreeCheckedStrategy>(() =>
    this.checkStrictly() ? 'all' : this.showCheckedStrategy(),
  );
  /** Checked keys in full (parents and children), conformed to the cascade. */
  private readonly checkedSet = computed(
    () =>
      andesConductCheck(this.valueKeys(), this.index(), this.checkStrictly())
        .checked,
  );
  /** The keys the field shows: the value, narrowed by the strategy when checkable. */
  private readonly displayKeys = computed<AndesTreeKey[]>(() => {
    const keys = this.valueKeys();
    if (!this.checkable()) {
      return keys;
    }
    const index = this.index();
    return [
      ...andesCheckedKeysByStrategy(this.checkedSet(), index, this.strategy()),
      ...keys.filter((key) => !index.byKey.has(key)),
    ];
  });

  protected readonly selectedOptions = computed<AndesTreeSelectOption[]>(() =>
    this.displayKeys().map((key) => this.optionFor(key)),
  );
  protected readonly hasValue = computed(
    () => this.selectedOptions().length > 0,
  );
  protected readonly summary = computed(() =>
    this.selectedOptions()
      .map((option) => option.title)
      .join(', '),
  );

  /** Whether tags are fitted to one row (`maxTagCount="responsive"`). */
  protected readonly responsive = computed(
    () => this.maxTagCount() === 'responsive' && this.multiMode(),
  );
  private readonly responsiveCount = signal<number | null>(null);
  /** Every tag of the selection, before `maxTagCount` applies. */
  protected readonly allTags = computed<AndesTreeSelectTag[]>(() =>
    this.selectedOptions().map((option) => ({
      ...option,
      closable: !this.isDisabled(),
    })),
  );
  /** How many tags the field shows, or `undefined` for all of them. */
  private readonly shownCount = computed(() => {
    const max = this.maxTagCount();
    if (max === 'responsive') {
      return this.responsive()
        ? (this.responsiveCount() ?? undefined)
        : undefined;
    }
    return max === undefined ? undefined : Math.max(0, max);
  });
  /** The tags the field shows. */
  readonly visibleTags = computed<AndesTreeSelectTag[]>(() => {
    const count = this.shownCount();
    const all = this.allTags();
    return count === undefined ? all : all.slice(0, count);
  });
  /** The tags hidden behind the "+ N" tag. */
  readonly omittedTags = computed<AndesTreeSelectTag[]>(() => {
    const count = this.shownCount();
    return count === undefined ? [] : this.allTags().slice(count);
  });
  protected readonly omittedTemplate = computed(() => {
    const placeholder = this.maxTagPlaceholder();
    return placeholder instanceof TemplateRef ? placeholder : null;
  });

  /** Whether the value holds `maxCount` nodes. */
  private readonly atMax = computed(() => {
    const max = this.maxCount();
    return (
      this.multiMode() && max !== undefined && this.valueKeys().length >= max
    );
  });
  /** Every node outside the selection, locked in the tree while `maxCount` is reached. */
  protected readonly lockedKeys = computed<AndesTreeKey[]>(() => {
    if (!this.atMax()) {
      return [];
    }
    const keep = this.checkable()
      ? this.checkedSet()
      : new Set(this.valueKeys());
    return this.index().order.filter((key) => !keep.has(key));
  });

  protected readonly treeSelectedKeys = computed(() =>
    this.checkable() ? [] : this.valueKeys(),
  );
  protected readonly treeCheckedKeys = computed(() =>
    this.checkable() ? this.valueKeys() : [],
  );
  protected readonly treeLabels = computed(() => ({
    empty: this.text().empty,
    loading: this.text().loading,
  }));

  protected readonly invalid = computed(
    () => this.ariaInvalid() || this.status() === 'error',
  );
  protected readonly describedBy = computed(
    () =>
      [this.ariaDescribedby(), this.summaryId].filter(Boolean).join(' ') ||
      null,
  );
  protected readonly showClear = computed(
    () => this.allowClear() && this.hasValue() && !this.isDisabled(),
  );
  protected readonly side = computed(() => PLACEMENTS[this.placement()].side);
  protected readonly searching = computed(() => this.searchValue() !== '');
  protected readonly panelContext = computed<AndesTreeSelectPanelContext>(
    () => ({ $implicit: this.searchValue(), close: () => this.close() }),
  );

  /**
   * What the field controls: the tree itself, which is what its popup role names. With no
   * rows on show (an empty panel) the panel stands in, so the reference never dangles.
   */
  protected readonly controlsId = computed(() => {
    if (!this.isOpen()) {
      return null;
    }
    const tree = this.tree();
    return tree?.hasRows() ? tree.listId : this.panelId;
  });

  private readonly widthRule = computed(() => this.matchTriggerWidth() ?? true);
  protected readonly matchesTriggerWidth = computed(
    () => this.widthRule() === true,
  );
  protected readonly fixedWidth = computed(() => {
    const rule = this.widthRule();
    return typeof rule === 'number' ? rule : null;
  });

  private readonly selection = viewChild<ElementRef<HTMLElement>>('selection');
  private readonly measure = viewChild<ElementRef<HTMLElement>>('measure');
  /** What the live region last announced: the tags the user added or removed. */
  protected readonly announcement = signal('');
  /** The open "+ N" popover's pane: focus moving into it has not left the select. */
  private readonly overflowPane = signal<HTMLElement | null>(null);

  private expandAllApplied = false;
  private onChange: (value: AndesTreeSelectModel) => void = () => undefined;
  private stopWatchingScroll: (() => void) | null = null;
  private onTouched: () => void = () => undefined;

  constructor() {
    effect(() => {
      const { side, align } = PLACEMENTS[this.placement()];
      this.overlay.configure({
        ...andesOverlayPreset('menu'),
        role: 'none',
        layer: 'dropdown',
        autoFocus: this.searchInTrigger() ? 'none' : 'first-tabbable',
        repositionOnScroll: true,
        positioning: {
          kind: 'anchored',
          side,
          align,
          sideOffset: 4,
          flip: true,
          // Beside the field the panel would no longer read as its list: stay above or below.
          crossSideFallback: false,
          shift: true,
          matchAnchorWidth: this.matchesTriggerWidth(),
        },
      });
    });

    effect(() => this.overlay.configure({ panelClass: this.panelClass() }));

    // `[open]` is honoured after render: the panel template and the field (the positioning
    // anchor) only exist once the view has rendered.
    afterRenderEffect(() => {
      const requested = booleanAttribute(this.openState());
      untracked(() => {
        if (requested && !this.isOpen()) {
          this.open();
        } else if (!requested && this.isOpen()) {
          this.close();
        }
      });
    });

    effect(() => this.overlay.registerAnchor(this.box().nativeElement));

    // Remember every title ever seen, so a selected node that leaves `nodes` keeps its label.
    effect(() => {
      const index = this.index();
      for (const [key, entry] of index.byKey) {
        this.titleCache.set(key, entry.title);
      }
    });

    effect(() => {
      const nodes = this.nodes();
      if (this.expandAllApplied || nodes.length === 0) {
        return;
      }
      this.expandAllApplied = true;
      if (this.treeDefaultExpandAll()) {
        untracked(() =>
          this.expandedKeys.set(andesGetExpandableKeys(this.index())),
        );
      }
    });

    // Tags changing the field's height move the panel's anchor.
    effect(() => {
      this.selectedOptions();
      if (untracked(() => this.isOpen())) {
        afterNextRender(() => this.overlay.updatePosition(), {
          injector: this.injector,
        });
      }
    });

    // A resized field re-fits responsive tags.
    afterNextRender(() => {
      if (typeof ResizeObserver === 'undefined') {
        return;
      }
      const observer = new ResizeObserver(() => this.fitTags());
      observer.observe(this.box().nativeElement);
      this.destroyRef.onDestroy(() => observer.disconnect());
    });

    // Re-fit once the measuring row has rendered a changed set of tags.
    afterRenderEffect(() => {
      this.allTags();
      this.searchInTrigger();
      if (!this.responsive()) {
        untracked(() => this.responsiveCount.set(null));
        return;
      }
      this.measure();
      untracked(() => this.fitTags());
    });

    this.overlay.opened.pipe(takeUntilDestroyed()).subscribe(() => {
      this.openState.set(true);
      this.watchPanelScroll();
    });
    this.overlay.closed.pipe(takeUntilDestroyed()).subscribe(() => {
      if (this.searchValue() !== '') {
        this.searchValue.set('');
      }
      this.unwatchPanelScroll();
      this.onTouched();
      this.openState.set(false);
    });
    this.destroyRef.onDestroy(() => this.unwatchPanelScroll());

    afterNextRender(() => {
      if (this.defaultOpen() && !this.isOpen()) {
        this.open();
      }
    });
  }

  /* ---------------------------------------------------------------------------------------
   * Public API
   * ------------------------------------------------------------------------------------- */

  open(): void {
    if (this.isDisabled() || this.isOpen()) {
      return;
    }
    this.revealSelection();
    this.overlay.open(this.panelTemplate(), {
      restoreFocusTo: this.focusTarget(),
    });
    afterNextRender(() => this.scrollToSelection(), {
      injector: this.injector,
    });
  }

  close(): void {
    this.overlay.close('imperative');
  }

  toggle(): void {
    if (this.isOpen()) {
      this.close();
    } else {
      this.open();
    }
  }

  focus(): void {
    this.focusTarget().focus();
  }

  blur(): void {
    this.focusTarget().blur();
  }

  /* ---------------------------------------------------------------------------------------
   * ControlValueAccessor
   * ------------------------------------------------------------------------------------- */

  writeValue(value: AndesTreeSelectModel | undefined): void {
    this.value.set(value ?? (this.multiMode() ? [] : null));
  }

  registerOnChange(fn: (value: AndesTreeSelectModel) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabledByForm.set(isDisabled);
    if (isDisabled) {
      this.close();
    }
  }

  /* ---------------------------------------------------------------------------------------
   * Template helpers
   * ------------------------------------------------------------------------------------- */

  /* ---------------------------------------------------------------------------------------
   * The "+ N" popover (AndesTagOverflowHost)
   * ------------------------------------------------------------------------------------- */

  maxTagPopoverLabelFor(count: number): string {
    return this.text().moreSelected(count);
  }

  registerOverflowPanel(element: HTMLElement | null): void {
    this.overflowPane.set(element);
  }

  canRemoveTag(tag: AndesTreeSelectTag): boolean {
    return tag.closable;
  }

  removeTag(tag: AndesTreeSelectTag): void {
    this.removeOption(tag);
  }

  /** Focus moved into the popover, which counts as the field. */
  onFocusIn(event: FocusEvent): void {
    this.focused.emit(event);
  }

  /** Focus left the popover: as leaving the field, unless it went back into it. */
  onFocusOut(event: FocusEvent): void {
    this.onBoxFocusOut(event);
  }

  /**
   * Counts how many tags fit on the field's one row, for `maxTagCount="responsive"`, from the
   * invisible measuring row; an in-field search keeps room for its input.
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
      this.searchInTrigger() ? RESPONSIVE_SEARCH_RESERVE : 0,
    );
    if (count !== null) {
      this.responsiveCount.set(count);
    }
  }

  protected omittedText(omitted: AndesTreeSelectOption[]): string {
    const placeholder = this.maxTagPlaceholder();
    return typeof placeholder === 'function'
      ? placeholder(omitted)
      : this.text().more(omitted.length);
  }

  /** Native tooltip of the "+ N" tag with `maxTagPopover` off: the titles it stands for. */
  protected omittedTitle(): string {
    return this.omittedTags()
      .map((tag) => tag.title)
      .join(', ');
  }

  /** A tag's text, cut short past `maxTagTextLength`. */
  protected tagText(tag: AndesTreeSelectOption): string {
    const max = this.maxTagTextLength();
    return max !== undefined && tag.title.length > max
      ? `${tag.title.slice(0, max)}...`
      : tag.title;
  }

  /** Context of a `tagTemplate` tag; `remove` is the popover's own removal, when in it. */
  protected tagContext(
    tag: AndesTreeSelectTag,
    remove?: (tag: AndesTreeSelectTag) => void,
  ): AndesTreeSelectTagContext {
    return {
      $implicit: tag,
      onClose: () => (remove ? remove(tag) : this.removeOption(tag)),
    };
  }

  private optionFor(key: AndesTreeKey): AndesTreeSelectOption {
    const entry = this.index().byKey.get(key);
    return {
      key,
      title:
        entry?.title ??
        this.valueLabels().get(key) ??
        this.titleCache.get(key) ??
        String(key),
      node: entry?.node,
    };
  }

  private focusTarget(): HTMLElement {
    return this.searchInTrigger()
      ? (this.searchInput()?.nativeElement ?? this.box().nativeElement)
      : this.box().nativeElement;
  }

  /* ---------------------------------------------------------------------------------------
   * Field interaction
   * ------------------------------------------------------------------------------------- */

  protected onBoxMouseDown(event: MouseEvent): void {
    if (this.isDisabled()) {
      event.preventDefault();
      return;
    }
    const target = event.target as HTMLElement;
    if (target.closest('button')) {
      // The clear and remove buttons never take focus from the field.
      event.preventDefault();
      return;
    }
    if (
      this.searchInTrigger() &&
      target !== this.searchInput()?.nativeElement
    ) {
      event.preventDefault();
      this.searchInput()?.nativeElement.focus();
    }
  }

  protected onBoxClick(event: MouseEvent): void {
    if (this.isDisabled() || (event.target as HTMLElement).closest('button')) {
      return;
    }
    if (this.searchInTrigger()) {
      this.open();
    } else {
      this.toggle();
    }
  }

  protected onComboboxKeydown(event: KeyboardEvent): void {
    if (this.isDisabled() || event.defaultPrevented) {
      return;
    }
    const inSearch = this.searchInTrigger();
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (this.isOpen()) {
          this.focusTree();
        } else {
          this.open();
        }
        break;
      case 'ArrowUp':
        if (event.altKey && this.isOpen()) {
          event.preventDefault();
          this.close();
        } else if (!this.isOpen()) {
          event.preventDefault();
          this.open();
        }
        break;
      case 'Enter':
      case ' ':
        if (event.key === ' ' && inSearch) {
          break;
        }
        if (event.key === 'Enter' && inSearch && this.isOpen()) {
          break;
        }
        event.preventDefault();
        this.toggle();
        break;
      case 'Backspace':
        if (
          this.multiMode() &&
          this.searchValue() === '' &&
          this.selectedOptions().length > 0
        ) {
          this.removeOption(
            this.selectedOptions().at(-1) as AndesTreeSelectOption,
          );
        }
        break;
      case 'Tab':
        if (this.isOpen()) {
          this.close();
        }
        break;
    }
  }

  protected onSearchInput(event: Event): void {
    const text = (event.target as HTMLInputElement).value;
    this.searchValue.set(text);
    this.searched.emit(text);
    if (!this.isOpen()) {
      this.open();
    }
  }

  protected onBoxFocusIn(event: FocusEvent): void {
    this.focused.emit(event);
  }

  protected onBoxFocusOut(event: FocusEvent): void {
    this.blurred.emit(event);
    const next = event.relatedTarget as Node | null;
    const pane = this.overlay.panelElement();
    const inside =
      !!next &&
      (this.box().nativeElement.contains(next) ||
        !!pane?.contains(next) ||
        !!this.overflowPane()?.contains(next));
    if (!inside && !this.isOpen()) {
      this.onTouched();
    }
  }

  protected clear(event: Event): void {
    event.stopPropagation();
    this.commit(this.multiMode() ? [] : null);
    this.cleared.emit();
    this.focus();
  }

  protected removeOption(option: AndesTreeSelectOption, event?: Event): void {
    event?.stopPropagation();
    if (this.isDisabled()) {
      return;
    }
    if (this.checkable()) {
      const index = this.index();
      const state = andesToggleCheck(
        this.checkedSet(),
        index,
        option.key,
        false,
        this.checkStrictly(),
      );
      this.commit(this.fromCheckState(state.checked));
    } else {
      this.commit(this.valueKeys().filter((key) => key !== option.key));
    }
  }

  /* ---------------------------------------------------------------------------------------
   * Panel interaction
   * ------------------------------------------------------------------------------------- */

  protected onPanelKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Tab' || this.movesWithinExtras(event)) {
      return;
    }
    // Leave for the next control after the field: put focus on the field and let the
    // browser's own Tab move on from there.
    this.focusTarget().focus();
    this.close();
  }

  /**
   * Whether Tab goes from or to a control of the header or footer, which the browser moves
   * between by itself (tree, header and footer are reached in that order). Anywhere else Tab
   * leaves the select.
   */
  private movesWithinExtras(event: KeyboardEvent): boolean {
    const tabbables = Array.from(
      this.overlay
        .panelElement()
        ?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ) ?? [],
    );
    const here = tabbables.findIndex((element) =>
      element.contains(event.target as Node),
    );
    const next = tabbables[here + (event.shiftKey ? -1 : 1)];
    if (here === -1 || !next) {
      return false;
    }
    const inExtras = (element: HTMLElement) =>
      !!element.closest('.andes-tree-select__panel-extra');
    return inExtras(tabbables[here]) || inExtras(next);
  }

  protected onSearchKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.focusTree();
    }
  }

  protected onTreeSelect(event: AndesTreeSelectEvent): void {
    if (this.multiple()) {
      if (this.exceedsMax(event.selectedKeys)) {
        this.tree()?.selectedKeys.set(this.treeSelectedKeys());
        return;
      }
      this.commit(event.selectedKeys);
      this.clearSearchAfterPick();
    } else {
      this.commit(event.selected ? event.key : null);
      this.close();
    }
  }

  protected onTreeClick(event: AndesTreeNodeEvent): void {
    // Picking the node that is already selected changes nothing but still ends the choice.
    if (!this.multiMode() && this.valueKeys()[0] === event.key) {
      const entry = this.index().byKey.get(event.key);
      if (entry?.selectable) {
        this.optionSelect.emit(this.externalKey(event.key));
        this.close();
      }
    }
  }

  protected onTreeCheck(event: AndesTreeCheckEvent): void {
    const next = this.fromCheckState(new Set(event.checkedKeys));
    if (this.exceedsMax(next)) {
      // A branch whose leaves would overshoot maxCount: the tree takes the check back.
      this.tree()?.checkedKeys.set(this.treeCheckedKeys());
      return;
    }
    this.commit(next);
    this.clearSearchAfterPick();
  }

  /** `autoClearSearchValue`: a pick in a multiple select starts the next search afresh. */
  private clearSearchAfterPick(): void {
    if (this.autoClearSearchValue() && this.searchValue() !== '') {
      this.searchValue.set('');
    }
  }

  /** Whether a new selection grows past `maxCount` (shrinking one never does). */
  private exceedsMax(next: readonly AndesTreeKey[]): boolean {
    const max = this.maxCount();
    return (
      max !== undefined &&
      next.length > max &&
      next.length > this.valueKeys().length
    );
  }

  private fromCheckState(checked: ReadonlySet<AndesTreeKey>): AndesTreeKey[] {
    const index = this.index();
    return [
      ...andesCheckedKeysByStrategy(checked, index, this.strategy()),
      // Keys whose nodes have not been loaded yet are not the cascade's to drop.
      ...this.valueKeys().filter((key) => !index.byKey.has(key)),
    ];
  }

  /**
   * Writes a selection the user made: into `value`, to the form, and out through
   * `selectionChange`, with `optionSelect` / `optionDeselect` for the nodes that came and went.
   */
  private commit(value: AndesTreeSelectValue): void {
    const before = this.valueKeys();
    const after = toKeys(value, false);
    const external = this.toExternal(value);
    this.value.set(external);
    this.onChange(external);
    this.selectionChange.emit(external);
    const beforeSet = new Set(before);
    const afterSet = new Set(after);
    const added = after.filter((key) => !beforeSet.has(key));
    const removed = before.filter((key) => !afterSet.has(key));
    for (const key of added) {
      this.optionSelect.emit(this.externalKey(key));
    }
    for (const key of removed) {
      this.optionDeselect.emit(this.externalKey(key));
    }
    this.announceTags(added, removed);
  }

  /**
   * Tells a screen reader which tags came and went: a tag removed from the field, or the leaves
   * a checked branch added, are otherwise silent. A single select's field already reads out its
   * one value.
   */
  private announceTags(
    added: readonly AndesTreeKey[],
    removed: readonly AndesTreeKey[],
  ): void {
    if (!this.multiMode()) {
      return;
    }
    const title = (key: AndesTreeKey) => this.optionFor(key).title;
    const text = this.text();
    const parts = [
      added.length > 0 ? text.tagsAdded(added.map(title)) : '',
      removed.length > 0 ? text.tagsRemoved(removed.map(title)) : '',
    ].filter(Boolean);
    if (parts.length > 0) {
      this.announcement.set(parts.join('. '));
    }
  }

  /** A key in the shape the outside sees it: bare, or `{ value, label }` with `labelInValue`. */
  private externalKey(
    key: AndesTreeKey,
  ): AndesTreeKey | AndesTreeSelectLabeledValue {
    return this.labelInValue()
      ? { value: key, label: this.optionFor(key).title }
      : key;
  }

  private toExternal(value: AndesTreeSelectValue): AndesTreeSelectModel {
    if (!this.labelInValue() || value === null) {
      return value;
    }
    return Array.isArray(value)
      ? value.map((key) => this.externalKey(key) as AndesTreeSelectLabeledValue)
      : (this.externalKey(value) as AndesTreeSelectLabeledValue);
  }

  private watchPanelScroll(): void {
    this.unwatchPanelScroll();
    const pane = this.overlay.panelElement();
    if (!pane) {
      return;
    }
    // Scroll events do not bubble, so they are caught on the way down to whatever scrolled:
    // the panel's own viewport, or the virtual list inside the tree.
    const onScroll = (event: Event) => this.panelScroll.emit(event);
    pane.addEventListener('scroll', onScroll, true);
    this.stopWatchingScroll = () =>
      pane.removeEventListener('scroll', onScroll, true);
  }

  private unwatchPanelScroll(): void {
    this.stopWatchingScroll?.();
    this.stopWatchingScroll = null;
  }

  private focusTree(): void {
    const pane = this.overlay.panelElement();
    pane
      ?.querySelector<HTMLElement>('[role="treeitem"][tabindex="0"]')
      ?.focus();
  }

  /** Opens the ancestors of the selected nodes, so a selection is never hidden in a closed branch. */
  private revealSelection(): void {
    const index = this.index();
    const current = new Set(this.expandedKeys());
    const missing: AndesTreeKey[] = [];
    for (const key of this.valueKeys()) {
      for (
        let parent = index.byKey.get(key)?.parent;
        parent;
        parent = parent.parent
      ) {
        if (!current.has(parent.key)) {
          current.add(parent.key);
          missing.push(parent.key);
        }
      }
    }
    if (missing.length > 0) {
      this.expandedKeys.set([...this.expandedKeys(), ...missing]);
    }
  }

  private scrollToSelection(): void {
    const first = this.valueKeys().find((key) => this.index().byKey.has(key));
    if (first !== undefined) {
      this.tree()?.scrollToKey(first, { expand: false });
    }
  }
}
