import { Directionality } from '@angular/cdk/bidi';
import {
  CdkFixedSizeVirtualScroll,
  CdkVirtualForOf,
  CdkVirtualScrollViewport,
} from '@angular/cdk/scrolling';
import { NgTemplateOutlet } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  afterNextRender,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  Injector,
  input,
  linkedSignal,
  model,
  output,
  signal,
  TemplateRef,
  untracked,
  viewChild,
} from '@angular/core';
import { filter, isObservable, lastValueFrom, take } from 'rxjs';

import { AndesTreeNodeTemplate } from './tree-node-template';
import type {
  AndesFlatTreeNode,
  AndesTreeAllowDrop,
  AndesTreeCheckEvent,
  AndesTreeCheckState,
  AndesTreeClassNames,
  AndesTreeDragEvent,
  AndesTreeDropEvent,
  AndesTreeDropInfo,
  AndesTreeDropPosition,
  AndesTreeEntry,
  AndesTreeExpandEvent,
  AndesTreeFieldNames,
  AndesTreeIndex,
  AndesTreeKey,
  AndesTreeLabels,
  AndesTreeLoadData,
  AndesTreeLoadErrorEvent,
  AndesTreeLoadEvent,
  AndesTreeNode,
  AndesTreeNodeContext,
  AndesTreeNodeEvent,
  AndesTreeScrollOptions,
  AndesTreeSelectEvent,
  AndesTreeStyles,
  AndesTreeTextSegment,
} from './tree-types';
import {
  andesConductCheck,
  andesCreateTreeIndex,
  andesFilterTree,
  andesFlattenEntries,
  andesGetExpandableKeys,
  andesGetTreeAncestors,
  andesHighlightSegments,
  andesIsTreeDescendantOrSelf,
  andesToggleCheck,
} from './tree-utils';

export type AndesTreeDensity = 'default' | 'compact';
export type AndesTreeExpandAction = 'click' | 'doubleClick' | false;
export type AndesTreeFilterMode = 'filter' | 'highlight';

const DEFAULT_LABELS: AndesTreeLabels = {
  empty: 'No data',
  loading: 'Loading',
  results: (count) => (count === 1 ? '1 result' : `${count} results`),
  grabbed: (title) => `${title} grabbed`,
  moved: (title, position, target) =>
    `${title} moved ${position === 'inside' ? 'into' : position} ${target}`,
};

/** A move the tree emitted and waits to see in `nodes`, to announce it and keep focus on it. */
interface AndesTreePendingMove {
  readonly info: AndesTreeDropInfo;
  readonly focus: boolean;
}

/** How long a dragged node must hover a closed parent before it opens. */
const DRAG_EXPAND_DELAY_MS = 600;
/** How long typed characters keep building one type-ahead search. */
const TYPEAHEAD_RESET_MS = 500;
/** How long a check box keeps its `data-motion`: the click ring's length (check-motion.css). */
const CHECK_MOTION_MS = 1000;

/** The one-shot animation a check box plays after a click changed it. */
type AndesTreeCheckMotion = 'check' | 'uncheck' | 'indeterminate';

function visualCheck(
  state: AndesTreeCheckState,
  key: AndesTreeKey,
): AndesTreeCheckMotion {
  return state.checked.has(key)
    ? 'check'
    : state.halfChecked.has(key)
      ? 'indeterminate'
      : 'uncheck';
}

let nextTreeId = 0;

function leafIconAttribute(
  value: boolean | string | TemplateRef<AndesTreeNodeContext>,
): boolean | TemplateRef<AndesTreeNodeContext> {
  return value instanceof TemplateRef ? value : booleanAttribute(value);
}

function draggableAttribute(
  value: boolean | string | ((node: AndesTreeNode) => boolean),
): boolean | ((node: AndesTreeNode) => boolean) {
  return typeof value === 'function' ? value : booleanAttribute(value);
}

/**
 * A tree view: a hierarchy of nodes that expand and collapse, can be selected, checked,
 * filtered, loaded on demand and reordered by dragging.
 *
 * ```html
 * <andes-tree
 *   [nodes]="nodes"
 *   checkable
 *   [(expandedKeys)]="expanded"
 *   [(checkedKeys)]="checked"
 *   aria-label="Warehouses"
 * />
 * ```
 *
 * ## Data
 *
 * `nodes` is a plain array of {@link AndesTreeNode} objects (`key`, `title`, `children`, and the
 * optional `icon`, `disabled`, `selectable`, `checkable`, `disableCheckbox` and `isLeaf`). Data
 * with other property names is read through `fieldNames`. A custom `andesTreeNode` template draws
 * the node content instead of the title.
 *
 * ## State
 *
 * `expandedKeys`, `selectedKeys`, `checkedKeys` and `loadedKeys` are two-way models. Checking
 * cascades by default: a parent is checked when all its children are and half-checked when some
 * are; `checkStrictly` makes every node independent. `checkedKeys` holds the fully checked nodes
 * (parents included); `halfCheckedKeys()` the partly checked parents.
 *
 * ## Keyboard
 *
 * The tree follows the WAI-ARIA treeview pattern with a roving tabindex: arrow keys move
 * between the visible nodes, Right / Left open, close or step to the child / parent, Home / End
 * jump to the ends, Enter selects (or toggles a node that cannot be selected), Space checks or
 * selects, `*` opens every sibling and typing jumps to the next matching title. With dragging
 * on, Alt + arrow keys move the focused node: Up / Down past a sibling, Right into the sibling
 * above it, Left out to its parent's level.
 *
 * ## Moving nodes
 *
 * A drop (or an Alt + arrow move) emits `nodeDrop`; the tree never changes `nodes` itself. Apply
 * the move to your data - `andesMoveTreeNode()` returns the moved copy - and once the node
 * shows up in its new place the tree announces it and, after a keyboard move, keeps focus on it.
 *
 * ```ts
 * onDrop(event: AndesTreeDropEvent) {
 *   const moved = andesMoveTreeNode(this.nodes(), event.dragKey, event.targetKey, event.position);
 *   if (moved) this.nodes.set(moved);
 * }
 * ```
 *
 * ## Large trees
 *
 * `virtualScroll` renders only the rows in view (the tree then needs a `height`); every row still
 * reports its level, position and set size so assistive technology sees the whole tree.
 */
@Component({
  selector: 'andes-tree',
  imports: [
    NgTemplateOutlet,
    CdkVirtualScrollViewport,
    CdkFixedSizeVirtualScroll,
    CdkVirtualForOf,
  ],
  templateUrl: './tree.html',
  // The checkbox's shared check motion (pop, drawn tick, click ring) for the row check boxes.
  styleUrls: ['./tree.css', '../checkbox/check-motion.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'data-slot': 'tree',
    '[attr.aria-label]': 'null',
    '[attr.aria-labelledby]': 'null',
  },
})
export class AndesTree {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);
  private readonly destroyRef = inject(DestroyRef);
  private readonly directionality = inject(Directionality);

  private readonly treeId = `andes-tree-${nextTreeId++}`;
  /**
   * `id` of the element that carries `role="tree"`, for a field that names the tree in
   * `aria-controls`. The element exists only while {@link hasRows} is `true`.
   */
  readonly listId = `${this.treeId}-list`;

  /** The nodes. The tree only reads them: a drop is reported through `nodeDrop`. */
  readonly nodes = input<AndesTreeNode[]>([]);
  /** Renames the properties read from each node. */
  readonly fieldNames = input<AndesTreeFieldNames | undefined>(undefined);

  readonly expandedKeys = model<AndesTreeKey[]>([]);
  readonly selectedKeys = model<AndesTreeKey[]>([]);
  /** Fully checked nodes. Parents are included when everything below them is checked. */
  readonly checkedKeys = model<AndesTreeKey[]>([]);
  /** Nodes whose children have been loaded (or that `loadData` has been called for). */
  readonly loadedKeys = model<AndesTreeKey[]>([]);
  /**
   * Nodes to treat as disabled on top of their own `disabled` flag: not selectable, checkable
   * or draggable, still expandable. The tree select uses it to lock the rest of the tree once
   * its `maxCount` is reached.
   */
  readonly disabledKeys = input<readonly AndesTreeKey[]>([]);

  /**
   * Opens the ancestors of every key in `expandedKeys`, writing them into the model, so a
   * deep key alone is enough to show its node. While it is on, a parent cannot close over an
   * open descendant; turn it off once the user starts opening and closing branches.
   */
  readonly autoExpandParent = input(false, { transform: booleanAttribute });

  /** Open every node that has children, once, when the first nodes arrive. */
  readonly defaultExpandAll = input(false, { transform: booleanAttribute });

  /**
   * Select several nodes: a click toggles a node, Shift + click adds a range. A directory tree
   * works like a file browser instead: a click selects only that node, Ctrl / Cmd + click adds
   * or removes one, and Shift + click selects the range from the last clicked node. From the
   * keyboard, Space and Enter act as a click and Ctrl / Cmd + Space as a Ctrl / Cmd + click.
   */
  readonly multiple = input(false, { transform: booleanAttribute });
  /** `false` turns selection off (a checkable tree often wants that). */
  readonly selectable = input(true, { transform: booleanAttribute });
  /** Whether clicking the selected node again clears the selection. */
  readonly deselectable = input(true, { transform: booleanAttribute });

  readonly checkable = input(false, { transform: booleanAttribute });
  /** Checking a node affects only that node, not its parents or children. */
  readonly checkStrictly = input(false, { transform: booleanAttribute });

  /** Connector lines between parents and children, and a boxed +/- switcher. */
  readonly showLine = input(false, { transform: booleanAttribute });
  /**
   * With `showLine`, draws an icon in each leaf's switcher, where the line would otherwise run
   * on to the label: `true` for a file glyph, or a template (it gets the node context) of your
   * own. A leaf's tick then stops at the icon, as a parent's stops at its box.
   */
  readonly showLeafIcon = input<
    boolean | TemplateRef<AndesTreeNodeContext>,
    boolean | string | TemplateRef<AndesTreeNodeContext>
  >(false, { transform: leafIconAttribute });
  /** Show node icons, with a folder or file when a node has none of its own. */
  readonly showIcon = input(false, { transform: booleanAttribute });
  /**
   * File-browser look and feel: folder and file icons, rows whose hover and selected fill span
   * the full width (the selected one solid), a click opens a folder, and with `multiple`,
   * Ctrl / Cmd + click to add to the selection.
   */
  readonly directory = input(false, { transform: booleanAttribute });
  /** Rows (and their hover and selected background) span the full width. */
  readonly blockNode = input(false, { transform: booleanAttribute });
  readonly density = input<AndesTreeDensity>('default');
  /** What toggles a parent besides its switcher. Directory trees default to `'click'`. */
  readonly expandAction = input<AndesTreeExpandAction | undefined>(undefined);

  /** Lets nodes be dragged to reorder or re-parent them. A function picks which nodes. */
  readonly draggable = input<
    boolean | ((node: AndesTreeNode) => boolean),
    boolean | string | ((node: AndesTreeNode) => boolean)
  >(false, {
    transform: draggableAttribute,
  });
  /**
   * Draws a grip of six dots at the start of every row while dragging is on, so rows read as
   * movable; the grip and the node's content both start a drag. `false` hides the grips.
   */
  readonly dragHandle = input(true, { transform: booleanAttribute });
  /** Veto a drop; the default allows every drop that is not into the node's own subtree. */
  readonly allowDrop = input<AndesTreeAllowDrop | undefined>(undefined);

  /** Loads the children of a node that has not got any yet, the first time it opens. */
  readonly loadData = input<AndesTreeLoadData | undefined>(undefined);
  /** Shows the loading state in place of the nodes (for the initial fetch). */
  readonly loading = input(false, { transform: booleanAttribute });

  /** Text to filter by, ignoring case and accents. */
  readonly filter = input('');
  /** Replaces the default title match. */
  readonly filterFn = input<
    ((node: AndesTreeNode, query: string) => boolean) | undefined
  >(undefined);
  /** `'filter'` hides non-matching branches; `'highlight'` keeps every node and only marks. */
  readonly filterMode = input<AndesTreeFilterMode>('filter');
  readonly highlightMatches = input(true, { transform: booleanAttribute });
  /** Open the ancestors of the matches when the filter changes. */
  readonly expandOnFilter = input(true, { transform: booleanAttribute });

  /** Render only the visible rows. Needs a `height`. */
  readonly virtualScroll = input(false, { transform: booleanAttribute });
  /** Height of the scrolling area when `virtualScroll` is on (a number is px). */
  readonly height = input<number | string>(320);

  readonly nodeTemplate = input<TemplateRef<AndesTreeNodeContext> | undefined>(
    undefined,
  );
  readonly iconTemplate = input<TemplateRef<AndesTreeNodeContext> | undefined>(
    undefined,
  );
  /**
   * Replaces the expand arrow of every branch, with or without `showLine`. Draw it pointing
   * toward the inline end: it turns a quarter when the node opens and mirrors in right-to-left,
   * as the default chevron does. The context is the node's, `expanded` and `loading` included;
   * a loading node still shows the spinner.
   */
  readonly switcherIcon = input<TemplateRef<AndesTreeNodeContext> | undefined>(
    undefined,
  );
  readonly labels = input<Partial<AndesTreeLabels>>({});
  /**
   * Classes for the tree's parts: `root`, every row (`item`), its `itemIcon` and `itemTitle`.
   * They are added beside the tree's own classes; style them from a global stylesheet.
   */
  readonly classNames = input<AndesTreeClassNames>({});
  /** Inline styles for the same parts, as `{ item: { 'font-weight': 600 } }`. */
  readonly styles = input<AndesTreeStyles>({});

  readonly ariaLabel = input<string | undefined>(undefined, {
    alias: 'aria-label',
  });
  readonly ariaLabelledby = input<string | undefined>(undefined, {
    alias: 'aria-labelledby',
  });

  /** A node was clicked (before selection and expansion react). */
  readonly nodeClick = output<AndesTreeNodeEvent>();
  readonly nodeDoubleClick = output<AndesTreeNodeEvent>();
  readonly nodeContextMenu = output<AndesTreeNodeEvent>();
  /** A node opened or closed. */
  readonly nodeExpand = output<AndesTreeExpandEvent>();
  /** A node was selected or deselected by the user. */
  readonly nodeSelect = output<AndesTreeSelectEvent>();
  /** A node was checked or unchecked by the user. */
  readonly nodeCheck = output<AndesTreeCheckEvent>();
  /** A node's children finished loading. */
  readonly nodeLoaded = output<AndesTreeLoadEvent>();
  readonly nodeLoadError = output<AndesTreeLoadErrorEvent>();
  /** A drag started on a node (`node` is the dragged one). */
  readonly nodeDragStart = output<AndesTreeDragEvent>();
  /** The pointer, dragging a node, entered a node's row. */
  readonly nodeDragEnter = output<AndesTreeDragEvent>();
  /**
   * The drop the pointer would make changed: another node, or another part of one (`position`,
   * `null` where nothing can be dropped). Emitted on change, not on every `dragover`.
   */
  readonly nodeDragOver = output<AndesTreeDragEvent>();
  /** The pointer, dragging a node, left a node's row. */
  readonly nodeDragLeave = output<AndesTreeDragEvent>();
  /** The drag ended, dropped or not (`node` is the dragged one). */
  readonly nodeDragEnd = output<AndesTreeDragEvent>();
  /** A node was dropped, or moved from the keyboard. Apply the move to `nodes`. */
  readonly nodeDrop = output<AndesTreeDropEvent>();

  protected readonly nodeTemplateDirective = contentChild(
    AndesTreeNodeTemplate,
  );
  private readonly viewport = viewChild(CdkVirtualScrollViewport);

  private readonly activeKey = signal<AndesTreeKey | null>(null);
  private readonly loadingKeys = signal<ReadonlySet<AndesTreeKey>>(new Set());
  protected readonly announcement = signal('');
  protected readonly dragKey = signal<AndesTreeKey | null>(null);
  protected readonly dropIndicator = signal<{
    key: AndesTreeKey;
    position: AndesTreeDropPosition;
    level: number;
  } | null>(null);
  /** Branches whose next open or close should animate (the ones just toggled). */
  protected readonly animateKeys = signal<ReadonlySet<AndesTreeKey>>(new Set());
  /**
   * The check boxes a click just changed - the clicked one and those it cascaded to - and the
   * motion each plays (the row's `data-motion`). Keyed by node rather than kept on the
   * element, and emptied once the ring has played, so a virtual row recycled for another node
   * never replays it and a box rendered checked from data never animates.
   */
  protected readonly checkMotion = signal<
    ReadonlyMap<AndesTreeKey, AndesTreeCheckMotion>
  >(new Map());
  private checkMotionTimer: ReturnType<typeof setTimeout> | null = null;

  private selectionAnchor: AndesTreeKey | null = null;
  private typeahead = '';
  private typeaheadTimer: ReturnType<typeof setTimeout> | null = null;
  private dragExpandTimer: ReturnType<typeof setTimeout> | null = null;
  private expandAllApplied = false;
  private pendingMove: AndesTreePendingMove | null = null;
  /** The node and drop position `nodeDragOver` last reported. */
  private lastDragOver: {
    key: AndesTreeKey;
    position: AndesTreeDropPosition | null;
  } | null = null;
  private readonly itemIds = new Map<AndesTreeKey, string>();
  private readonly itemKeys = new Map<string, AndesTreeKey>();

  private readonly disabledKeySet = computed(
    () => new Set<AndesTreeKey>(this.disabledKeys()),
  );
  protected readonly index = computed(() =>
    andesCreateTreeIndex(
      this.nodes(),
      this.fieldNames(),
      this.disabledKeySet(),
    ),
  );
  protected readonly text = computed<AndesTreeLabels>(() => ({
    ...DEFAULT_LABELS,
    ...this.labels(),
  }));
  protected readonly query = computed(() => this.filter().trim());
  private readonly filterResult = computed(() => {
    const query = this.query();
    if (!query) {
      return null;
    }
    const matcher = this.filterFn();
    return andesFilterTree(
      this.index(),
      query,
      matcher ? (entry, text) => matcher(entry.node, text) : undefined,
    );
  });
  private readonly include = computed(() => {
    const result = this.filterResult();
    return result && this.filterMode() === 'filter'
      ? (entry: AndesTreeEntry) => result.visible.has(entry.key)
      : undefined;
  });
  private readonly segments = computed(() => {
    const result = this.filterResult();
    const map = new Map<AndesTreeKey, AndesTreeTextSegment[]>();
    if (result && this.highlightMatches()) {
      const query = this.query();
      for (const key of result.matched) {
        const entry = this.index().byKey.get(key);
        if (entry) {
          map.set(key, andesHighlightSegments(entry.title, query));
        }
      }
    }
    return map;
  });

  /** Every row of the (filtered) tree, depth first, collapsed branches included. */
  protected readonly allRows = computed(() =>
    andesFlattenEntries(this.index().roots, { include: this.include() }),
  );
  private readonly childRowsByParent = computed(() => {
    const map = new Map<AndesTreeKey | null, AndesFlatTreeNode[]>();
    for (const row of this.allRows()) {
      const siblings = map.get(row.parentKey);
      if (siblings) {
        siblings.push(row);
      } else {
        map.set(row.parentKey, [row]);
      }
    }
    return map;
  });
  protected readonly rootRows = computed(
    () => this.childRowsByParent().get(null) ?? [],
  );

  protected readonly expandedSet = computed(
    () => new Set<AndesTreeKey>(this.expandedKeys()),
  );
  protected readonly selectedSet = computed(
    () => new Set<AndesTreeKey>(this.selectedKeys()),
  );
  private readonly loadedSet = computed(
    () => new Set<AndesTreeKey>(this.loadedKeys()),
  );
  private readonly checkState = computed(() =>
    andesConductCheck(this.checkedKeys(), this.index(), this.checkStrictly()),
  );

  /** The partly checked parents (cascading mode). */
  readonly halfCheckedKeys = computed(() => {
    const half = this.checkState().halfChecked;
    return this.index().order.filter((key) => half.has(key));
  });

  /** Branches rendered at least once: they stay in the DOM so closing can animate. */
  protected readonly everExpanded = linkedSignal<
    ReadonlySet<AndesTreeKey>,
    ReadonlySet<AndesTreeKey>
  >({
    source: this.expandedSet,
    computation: (current, previous) => {
      if (!previous) {
        return current;
      }
      let merged: Set<AndesTreeKey> | null = null;
      for (const key of current) {
        if (!previous.value.has(key)) {
          merged ??= new Set(previous.value);
          merged.add(key);
        }
      }
      return merged ?? previous.value;
    },
  });

  /** The rows a user can reach: those whose ancestors are all open. */
  protected readonly visibleRows = computed(() => {
    const expanded = this.expandedSet();
    const shown = new Set<AndesTreeKey>();
    const rows: AndesFlatTreeNode[] = [];
    for (const row of this.allRows()) {
      if (
        row.parentKey === null ||
        (shown.has(row.parentKey) && expanded.has(row.parentKey))
      ) {
        rows.push(row);
        shown.add(row.key);
      }
    }
    return rows;
  });
  private readonly visibleIndex = computed(() => {
    const map = new Map<AndesTreeKey, number>();
    this.visibleRows().forEach((row, i) => map.set(row.key, i));
    return map;
  });
  /** Whether the tree has any row to show; without one there is no `role="tree"` element. */
  readonly hasRows = computed(() => this.allRows().length > 0);

  /** The one row in the tab order: the focused one, else the selected one, else the first. */
  protected readonly tabbableKey = computed<AndesTreeKey | null>(() => {
    const rows = this.visibleRows();
    if (rows.length === 0) {
      return null;
    }
    const active = this.activeKey();
    if (active !== null && this.visibleIndex().has(active)) {
      return active;
    }
    const selected = this.selectedSet();
    return (rows.find((row) => selected.has(row.key)) ?? rows[0]).key;
  });

  protected readonly effectiveExpandAction = computed(
    () => this.expandAction() ?? (this.directory() ? 'click' : false),
  );
  /** Whether a leaf's switcher shows an icon (line mode only). */
  protected readonly leafIconShown = computed(
    () => this.showLine() && !!this.showLeafIcon(),
  );
  protected readonly leafIconTemplate = computed(() => {
    const value = this.showLeafIcon();
    return value instanceof TemplateRef ? value : null;
  });
  /** Whether the rows open with a drag grip column. */
  protected readonly handlesShown = computed(
    () => !!this.draggable() && this.dragHandle(),
  );
  protected readonly iconsShown = computed(
    () => this.showIcon() || this.directory(),
  );
  protected readonly rowHeight = computed(() =>
    this.density() === 'compact' ? 24 : 28,
  );
  protected readonly viewportHeight = computed(() => {
    const height = this.height();
    return typeof height === 'number' ? `${height}px` : height;
  });
  protected readonly customNodeTemplate = computed(
    () => this.nodeTemplate() ?? this.nodeTemplateDirective()?.template,
  );

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.clearTypeahead();
      this.clearDragExpand();
      this.clearCheckMotion();
    });

    effect(() => {
      const nodes = this.nodes();
      if (this.expandAllApplied || nodes.length === 0) {
        return;
      }
      this.expandAllApplied = true;
      if (this.defaultExpandAll()) {
        untracked(() => this.expandAll());
      }
    });

    effect(() => {
      const keys = this.expandedKeys();
      if (!this.autoExpandParent()) {
        return;
      }
      const index = this.index();
      untracked(() => {
        const open = new Set(keys);
        const missing: AndesTreeKey[] = [];
        for (const key of keys) {
          for (
            let parent = index.byKey.get(key)?.parent;
            parent && !open.has(parent.key);
            parent = parent.parent
          ) {
            open.add(parent.key);
            missing.push(parent.key);
          }
        }
        if (missing.length > 0) {
          this.expandedKeys.set([...keys, ...missing]);
        }
      });
    });

    effect(() => {
      const result = this.filterResult();
      if (!result || !this.expandOnFilter()) {
        return;
      }
      untracked(() => {
        const current = this.expandedKeys();
        const missing = [...result.expand].filter(
          (key) => !current.includes(key),
        );
        if (missing.length > 0) {
          this.expandedKeys.set([...current, ...missing]);
        }
      });
    });

    effect(() => {
      const index = this.index();
      untracked(() => this.settleMove(index));
    });

    effect(() => {
      const result = this.filterResult();
      if (result) {
        const count = result.matched.size;
        untracked(() => this.announcement.set(this.text().results(count)));
      }
    });
  }

  /* ---------------------------------------------------------------------------------------
   * Public API
   * ------------------------------------------------------------------------------------- */

  /** Opens every node that has children. */
  expandAll(): void {
    const keys = andesGetExpandableKeys(this.index());
    this.markAnimated(keys);
    this.expandedKeys.set(keys);
  }

  collapseAll(): void {
    this.markAnimated(this.expandedKeys());
    this.expandedKeys.set([]);
  }

  /** Opens the given nodes (and keeps the ones already open). */
  expandKeys(keys: readonly AndesTreeKey[]): void {
    const current = this.expandedKeys();
    const missing = keys.filter((key) => !current.includes(key));
    if (missing.length > 0) {
      this.markAnimated(missing);
      this.expandedKeys.set([...current, ...missing]);
    }
  }

  collapseKeys(keys: readonly AndesTreeKey[]): void {
    this.markAnimated(keys);
    const remove = new Set(keys);
    this.expandedKeys.set(
      this.expandedKeys().filter((key) => !remove.has(key)),
    );
  }

  /** Opens a closed node or closes an open one, loading its children when needed. */
  toggleExpanded(key: AndesTreeKey): void {
    const row = this.allRows().find((candidate) => candidate.key === key);
    if (row) {
      this.toggleExpand(row);
    }
  }

  /** Checks every checkable node (or clears them all). */
  setAllChecked(checked: boolean): void {
    const index = this.index();
    if (!checked) {
      this.checkedKeys.set([]);
      return;
    }
    const keys = index.order.filter((key) => {
      const entry = index.byKey.get(key) as AndesTreeEntry;
      return entry.checkable && !entry.disableCheckbox;
    });
    const state = andesConductCheck(keys, index, this.checkStrictly());
    this.checkedKeys.set(index.order.filter((key) => state.checked.has(key)));
  }

  /** The node object for a key. */
  getNode(key: AndesTreeKey): AndesTreeNode | undefined {
    return this.index().byKey.get(key)?.node;
  }

  /**
   * The keys from the root down to a node, the node included: what `expandedKeys` must hold
   * (but the node itself) for it to show. Empty for an unknown key.
   */
  getNodePath(key: AndesTreeKey): AndesTreeKey[] {
    const entry = this.index().byKey.get(key);
    return entry
      ? [...andesGetTreeAncestors(entry).map((ancestor) => ancestor.key), key]
      : [];
  }

  /** Moves focus to a node, opening its ancestors and scrolling it into view if needed. */
  focusKey(key: AndesTreeKey): void {
    this.scrollToKey(key, { focus: true });
  }

  /**
   * Scrolls a node into view. By default it opens the node's collapsed ancestors first; in a
   * virtual tree it scrolls the viewport to the row's offset.
   */
  scrollToKey(
    key: AndesTreeKey,
    options: AndesTreeScrollOptions = {},
  ): boolean {
    const entry = this.index().byKey.get(key);
    if (!entry) {
      return false;
    }
    const {
      align = 'nearest',
      behavior = 'auto',
      expand = true,
      focus = false,
    } = options;

    const closed: AndesTreeKey[] = [];
    for (let parent = entry.parent; parent; parent = parent.parent) {
      if (!this.expandedSet().has(parent.key)) {
        closed.unshift(parent.key);
      }
    }
    if (closed.length > 0) {
      if (!expand) {
        return false;
      }
      this.expandKeys(closed);
    }

    const reveal = () => {
      const position = this.visibleIndex().get(key);
      if (position === undefined) {
        return;
      }
      const viewport = this.viewport();
      if (this.virtualScroll() && viewport) {
        const size = this.rowHeight();
        const viewportSize = viewport.getViewportSize();
        const current = viewport.measureScrollOffset();
        const start = position * size;
        const end = start - viewportSize + size;
        let target: number | null;
        switch (align) {
          case 'start':
            target = start;
            break;
          case 'end':
            target = end;
            break;
          case 'center':
            target = start - (viewportSize - size) / 2;
            break;
          default:
            target = start < current ? start : end > current ? end : null;
        }
        if (target !== null) {
          viewport.scrollToOffset(Math.max(0, target), behavior);
        }
      } else if (!focus) {
        this.itemElement(key)?.scrollIntoView?.({
          block: align === 'nearest' ? 'nearest' : align,
          behavior,
        });
      }
      if (focus) {
        this.activeKey.set(key);
        const focusIt = () =>
          this.itemElement(key)?.focus({ preventScroll: false });
        if (this.itemElement(key)) {
          focusIt();
        } else if (viewport && this.virtualScroll()) {
          // A virtual row only exists once the scroll has rendered it, which happens after the
          // browser reports the scroll - wait for the row to enter the rendered range.
          viewport.renderedRangeStream
            .pipe(
              filter(
                (range) => position >= range.start && position < range.end,
              ),
              take(1),
              takeUntilDestroyed(this.destroyRef),
            )
            .subscribe(() =>
              afterNextRender(focusIt, { injector: this.injector }),
            );
        } else {
          afterNextRender(focusIt, { injector: this.injector });
        }
      }
    };

    if (closed.length > 0) {
      afterNextRender(reveal, { injector: this.injector });
    } else {
      reveal();
    }
    return true;
  }

  /* ---------------------------------------------------------------------------------------
   * Row state (used by the template)
   * ------------------------------------------------------------------------------------- */

  protected itemId(key: AndesTreeKey): string {
    let id = this.itemIds.get(key);
    if (!id) {
      id = `${this.treeId}-n${this.itemIds.size}`;
      this.itemIds.set(key, id);
      this.itemKeys.set(id, key);
    }
    return id;
  }

  protected titleId(key: AndesTreeKey): string {
    return `${this.itemId(key)}-t`;
  }

  protected childRows(key: AndesTreeKey): readonly AndesFlatTreeNode[] {
    return this.childRowsByParent().get(key) ?? [];
  }

  protected isLeaf(row: AndesFlatTreeNode): boolean {
    const entry = row.entry;
    if (entry.isLeafFlag !== undefined) {
      return entry.isLeafFlag;
    }
    if (row.hasChildren || entry.children.length > 0) {
      return false;
    }
    return !this.needsLoad(entry);
  }

  private needsLoad(entry: AndesTreeEntry): boolean {
    return (
      !!this.loadData() &&
      entry.isLeafFlag !== true &&
      !entry.hasChildrenField &&
      !this.loadedSet().has(entry.key)
    );
  }

  protected isExpanded(key: AndesTreeKey): boolean {
    return this.expandedSet().has(key);
  }

  protected isSelected(key: AndesTreeKey): boolean {
    return this.selectedSet().has(key);
  }

  protected isLoading(key: AndesTreeKey): boolean {
    return this.loadingKeys().has(key);
  }

  protected canSelect(row: AndesFlatTreeNode): boolean {
    return this.selectable() && row.entry.selectable;
  }

  protected showCheckbox(row: AndesFlatTreeNode): boolean {
    return this.checkable() && row.entry.checkable;
  }

  protected isChecked(key: AndesTreeKey): boolean {
    return this.checkState().checked.has(key);
  }

  protected isIndeterminate(key: AndesTreeKey): boolean {
    return this.checkState().halfChecked.has(key);
  }

  protected checkedAria(key: AndesTreeKey): 'true' | 'false' | 'mixed' {
    if (this.isChecked(key)) {
      return 'true';
    }
    return this.isIndeterminate(key) ? 'mixed' : 'false';
  }

  protected isDraggable(row: AndesFlatTreeNode): boolean {
    const draggable = this.draggable();
    if (!draggable || row.entry.disabled) {
      return false;
    }
    return typeof draggable === 'function' ? draggable(row.node) : true;
  }

  protected rowSegments(row: AndesFlatTreeNode): AndesTreeTextSegment[] {
    return this.segments().get(row.key) ?? [{ text: row.title, match: false }];
  }

  protected isMatch(key: AndesTreeKey): boolean {
    return this.segments().has(key);
  }

  protected nodeContext(row: AndesFlatTreeNode): AndesTreeNodeContext {
    const key = row.key;
    return {
      $implicit: row.node,
      node: row.node,
      key,
      title: row.title,
      level: row.level,
      expanded: this.isExpanded(key),
      selected: this.isSelected(key),
      checked: this.isChecked(key),
      indeterminate: this.isIndeterminate(key),
      loading: this.isLoading(key),
      disabled: row.entry.disabled,
      isLeaf: this.isLeaf(row),
      query: this.query(),
      segments: this.rowSegments(row),
    };
  }

  protected iconTemplateFor(
    row: AndesFlatTreeNode,
  ): TemplateRef<AndesTreeNodeContext> | null {
    const own = row.node.icon;
    if (own instanceof TemplateRef) {
      return own;
    }
    return this.iconTemplate() ?? null;
  }

  protected iconGlyph(row: AndesFlatTreeNode): string | null {
    const own = row.node.icon;
    return typeof own === 'string' && own ? own : null;
  }

  protected readonly trackRow = (_: number, row: AndesFlatTreeNode) => row.key;

  /* ---------------------------------------------------------------------------------------
   * Pointer interaction
   * ------------------------------------------------------------------------------------- */

  protected onRowClick(event: MouseEvent, row: AndesFlatTreeNode): void {
    this.activeKey.set(row.key);
    this.nodeClick.emit({ node: row.node, key: row.key, event });
    this.selectRow(row, event);
    if (this.effectiveExpandAction() === 'click' && !this.isLeaf(row)) {
      this.toggleExpand(row);
    }
  }

  protected onRowDoubleClick(event: MouseEvent, row: AndesFlatTreeNode): void {
    this.nodeDoubleClick.emit({ node: row.node, key: row.key, event });
    if (this.effectiveExpandAction() === 'doubleClick' && !this.isLeaf(row)) {
      this.toggleExpand(row);
    }
  }

  protected onRowContextMenu(event: MouseEvent, row: AndesFlatTreeNode): void {
    this.nodeContextMenu.emit({ node: row.node, key: row.key, event });
  }

  protected onSwitcherClick(event: MouseEvent, row: AndesFlatTreeNode): void {
    event.stopPropagation();
    this.activeKey.set(row.key);
    if (!this.isLeaf(row)) {
      this.toggleExpand(row);
    }
  }

  protected onCheckboxClick(event: MouseEvent, row: AndesFlatTreeNode): void {
    event.stopPropagation();
    this.activeKey.set(row.key);
    this.toggleCheck(row);
  }

  /* ---------------------------------------------------------------------------------------
   * State changes
   * ------------------------------------------------------------------------------------- */

  /** Lets the branches just toggled animate; branches the consumer opens by data do not. */
  private markAnimated(keys: readonly AndesTreeKey[]): void {
    if (keys.length > 0) {
      this.animateKeys.update((set) => new Set([...set, ...keys]));
    }
  }

  protected onCollapseAnimationEnd(event: Event, key: AndesTreeKey): void {
    if (event.target !== event.currentTarget) {
      return;
    }
    this.animateKeys.update((set) => {
      const next = new Set(set);
      next.delete(key);
      return next;
    });
  }

  private toggleExpand(row: AndesFlatTreeNode): void {
    const key = row.key;
    const expanding = !this.expandedSet().has(key);
    this.markAnimated([key]);
    if (expanding) {
      this.expandedKeys.set([...this.expandedKeys(), key]);
      if (this.needsLoad(row.entry)) {
        this.load(row);
      }
    } else {
      this.keepFocusOnCollapse(row);
      this.expandedKeys.set(this.expandedKeys().filter((k) => k !== key));
    }
    this.nodeExpand.emit({
      node: row.node,
      key,
      expanded: expanding,
      expandedKeys: this.expandedKeys(),
    });
  }

  /** Closing a branch that holds focus would drop it on the page; park it on the branch. */
  private keepFocusOnCollapse(row: AndesFlatTreeNode): void {
    const host = this.host.nativeElement;
    const active = host.ownerDocument.activeElement;
    const item = this.itemElement(row.key);
    if (item && active && active !== item && item.contains(active)) {
      this.activeKey.set(row.key);
      item.focus();
    }
  }

  private load(row: AndesFlatTreeNode): void {
    const loadData = this.loadData();
    if (!loadData) {
      return;
    }
    const key = row.key;
    this.loadingKeys.update((set) => new Set(set).add(key));
    const settle = () =>
      this.loadingKeys.update((set) => {
        const next = new Set(set);
        next.delete(key);
        return next;
      });

    let pending: Promise<unknown>;
    try {
      const result = loadData(row.node);
      pending = isObservable(result)
        ? lastValueFrom(result, { defaultValue: undefined })
        : Promise.resolve(result);
    } catch (error) {
      pending = Promise.reject(error);
    }

    pending.then(
      () => {
        settle();
        if (!this.loadedKeys().includes(key)) {
          this.loadedKeys.set([...this.loadedKeys(), key]);
        }
        this.nodeLoaded.emit({ node: row.node, key });
      },
      (error: unknown) => {
        settle();
        this.expandedKeys.set(this.expandedKeys().filter((k) => k !== key));
        this.nodeLoadError.emit({ node: row.node, key, error });
      },
    );
  }

  private selectRow(
    row: AndesFlatTreeNode,
    event?: Pick<MouseEvent, 'shiftKey' | 'ctrlKey' | 'metaKey'>,
  ): void {
    if (!this.canSelect(row)) {
      return;
    }
    const key = row.key;
    const current = this.selectedKeys();
    let next: AndesTreeKey[];
    let selected: boolean;

    if (this.multiple()) {
      const anchor = this.selectionAnchor;
      const visible = this.visibleIndex();
      if (event?.shiftKey && anchor !== null && visible.has(anchor)) {
        const from = visible.get(anchor) as number;
        const to = visible.get(key) as number;
        const range = this.visibleRows()
          .slice(Math.min(from, to), Math.max(from, to) + 1)
          .filter((candidate) => this.canSelect(candidate))
          .map((candidate) => candidate.key);
        // A file browser's Shift + click replaces the selection with the range.
        next = this.directory() ? range : [...new Set([...current, ...range])];
        selected = true;
      } else if (this.directory() && !event?.ctrlKey && !event?.metaKey) {
        selected = true;
        next = [key];
        this.selectionAnchor = key;
      } else {
        selected = !this.selectedSet().has(key);
        next = selected ? [...current, key] : current.filter((k) => k !== key);
        this.selectionAnchor = key;
      }
    } else if (this.selectedSet().has(key)) {
      if (!this.deselectable()) {
        return;
      }
      selected = false;
      next = [];
    } else {
      selected = true;
      next = [key];
      this.selectionAnchor = key;
    }

    this.selectedKeys.set(next);
    const index = this.index();
    this.nodeSelect.emit({
      node: row.node,
      key,
      selected,
      selectedKeys: next,
      selectedNodes: next
        .map((k) => index.byKey.get(k)?.node)
        .filter((node): node is AndesTreeNode => !!node),
    });
  }

  private toggleCheck(row: AndesFlatTreeNode): void {
    const entry = row.entry;
    if (!this.checkable() || !entry.checkable || entry.disableCheckbox) {
      return;
    }
    const index = this.index();
    const before = this.checkState();
    const checked = !before.checked.has(row.key);
    const state = andesToggleCheck(
      before.checked,
      index,
      row.key,
      checked,
      this.checkStrictly(),
    );
    const keys = index.order.filter((key) => state.checked.has(key));
    this.playCheckMotion(before, state);
    this.checkedKeys.set(keys);
    this.nodeCheck.emit({
      node: row.node,
      key: row.key,
      checked,
      checkedKeys: keys,
      halfCheckedKeys: index.order.filter((key) => state.halfChecked.has(key)),
      checkedNodes: keys
        .map((key) => index.byKey.get(key)?.node)
        .filter((node): node is AndesTreeNode => !!node),
    });
  }

  /** Animates every check box whose drawn state the click changed, for one ring's length. */
  private playCheckMotion(
    before: AndesTreeCheckState,
    after: AndesTreeCheckState,
  ): void {
    const motion = new Map<AndesTreeKey, AndesTreeCheckMotion>();
    for (const key of this.index().order) {
      const next = visualCheck(after, key);
      if (next !== visualCheck(before, key)) {
        motion.set(key, next);
      }
    }
    this.clearCheckMotion();
    this.checkMotion.set(motion);
    this.checkMotionTimer = setTimeout(() => {
      this.checkMotionTimer = null;
      this.checkMotion.set(new Map());
    }, CHECK_MOTION_MS);
  }

  private clearCheckMotion(): void {
    if (this.checkMotionTimer !== null) {
      clearTimeout(this.checkMotionTimer);
      this.checkMotionTimer = null;
    }
  }

  /* ---------------------------------------------------------------------------------------
   * Keyboard
   * ------------------------------------------------------------------------------------- */

  protected onFocusin(event: FocusEvent): void {
    const item = this.closestItem(event.target);
    const key = item ? this.itemKeys.get(item.id) : undefined;
    if (key !== undefined) {
      this.activeKey.set(key);
    }
  }

  protected onKeydown(event: KeyboardEvent): void {
    const item = this.closestItem(event.target);
    // Keys typed into something inside a node (an input in a custom template) are its own.
    if (!item || item !== event.target || event.defaultPrevented) {
      return;
    }
    const key = this.itemKeys.get(item.id);
    const position =
      key === undefined ? undefined : this.visibleIndex().get(key);
    if (key === undefined || position === undefined) {
      return;
    }
    const rows = this.visibleRows();
    const row = rows[position];
    const rtl = this.directionality.value === 'rtl';

    if (event.altKey && !event.ctrlKey && !event.metaKey) {
      const direction = this.moveDirection(event.key, rtl);
      if (direction && this.draggable()) {
        event.preventDefault();
        this.moveWithKeyboard(row, direction);
      }
      return;
    }
    if (event.ctrlKey || event.metaKey) {
      // Ctrl / Cmd + Space adds or removes the node, as Ctrl / Cmd + click does.
      if (event.key === ' ' && this.multiple() && this.canSelect(row)) {
        event.preventDefault();
        this.selectRow(row, event);
      }
      return;
    }

    const open = rtl ? 'ArrowLeft' : 'ArrowRight';
    const close = rtl ? 'ArrowRight' : 'ArrowLeft';
    const expandable = !this.isLeaf(row);
    const expanded = this.isExpanded(key);

    switch (event.key) {
      case 'ArrowDown':
        this.focusRow(rows[position + 1]);
        break;
      case 'ArrowUp':
        this.focusRow(rows[position - 1]);
        break;
      case open:
        if (expandable && !expanded) {
          this.toggleExpand(row);
        } else if (expandable && rows[position + 1]?.parentKey === key) {
          this.focusRow(rows[position + 1]);
        }
        break;
      case close:
        if (expandable && expanded) {
          this.toggleExpand(row);
        } else if (row.parentKey !== null) {
          const parent = this.visibleIndex().get(row.parentKey);
          if (parent !== undefined) {
            this.focusRow(rows[parent]);
          }
        }
        break;
      case 'Home':
        this.focusRow(rows[0]);
        break;
      case 'End':
        this.focusRow(rows[rows.length - 1]);
        break;
      case 'Enter':
        if (this.canSelect(row)) {
          this.selectRow(row, event);
        } else if (this.showCheckbox(row)) {
          this.toggleCheck(row);
        } else if (expandable) {
          this.toggleExpand(row);
        }
        break;
      case ' ':
        if (this.showCheckbox(row)) {
          this.toggleCheck(row);
        } else {
          this.selectRow(row, event);
        }
        break;
      case '*':
        this.expandSiblings(row);
        break;
      default:
        if (event.key.length === 1 && !event.altKey) {
          this.runTypeahead(event.key, position);
          // A space mid-search belongs to the search, not to the selection.
          break;
        }
        return;
    }
    event.preventDefault();
  }

  private moveDirection(key: string, rtl: boolean) {
    switch (key) {
      case 'ArrowUp':
        return 'up';
      case 'ArrowDown':
        return 'down';
      case 'ArrowRight':
        return rtl ? 'outdent' : 'indent';
      case 'ArrowLeft':
        return rtl ? 'indent' : 'outdent';
      default:
        return null;
    }
  }

  private expandSiblings(row: AndesFlatTreeNode): void {
    const siblings = this.childRowsByParent().get(row.parentKey) ?? [];
    this.expandKeys(
      siblings.filter((sibling) => !this.isLeaf(sibling)).map((s) => s.key),
    );
  }

  private runTypeahead(character: string, from: number): void {
    this.clearTypeahead();
    this.typeahead += character.toLocaleLowerCase();
    this.typeaheadTimer = setTimeout(
      () => (this.typeahead = ''),
      TYPEAHEAD_RESET_MS,
    );
    const rows = this.visibleRows();
    const start = this.typeahead.length === 1 ? from + 1 : from;
    for (let step = 0; step < rows.length; step++) {
      const row = rows[(start + step) % rows.length];
      if (row.title.toLocaleLowerCase().startsWith(this.typeahead)) {
        this.focusRow(row);
        return;
      }
    }
  }

  private clearTypeahead(): void {
    if (this.typeaheadTimer !== null) {
      clearTimeout(this.typeaheadTimer);
      this.typeaheadTimer = null;
    }
  }

  private focusRow(row: AndesFlatTreeNode | undefined): void {
    if (!row) {
      return;
    }
    this.activeKey.set(row.key);
    const element = this.itemElement(row.key);
    if (element) {
      element.focus();
      return;
    }
    // A row outside the rendered window of a virtual tree.
    this.scrollToKey(row.key, { focus: true });
  }

  private closestItem(target: EventTarget | null): HTMLElement | null {
    const item = (target as HTMLElement | null)?.closest?.<HTMLElement>(
      '[role="treeitem"]',
    );
    return item &&
      this.itemKeys.has(item.id) &&
      this.host.nativeElement.contains(item)
      ? item
      : null;
  }

  private itemElement(key: AndesTreeKey): HTMLElement | null {
    const id = this.itemIds.get(key);
    return id
      ? this.host.nativeElement.querySelector<HTMLElement>(`[id="${id}"]`)
      : null;
  }

  /* ---------------------------------------------------------------------------------------
   * Drag and drop
   * ------------------------------------------------------------------------------------- */

  protected onDragStart(event: DragEvent, row: AndesFlatTreeNode): void {
    if (!this.isDraggable(row)) {
      event.preventDefault();
      return;
    }
    this.dragKey.set(row.key);
    this.lastDragOver = null;
    this.pendingMove = null;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      // Some browsers refuse to start a drag without data.
      event.dataTransfer.setData('text/plain', row.title);
      this.setGhost(event);
    }
    this.announcement.set(this.text().grabbed(row.title));
    this.nodeDragStart.emit(this.dragEvent(event, row, row.key, null));
  }

  /**
   * The picture that follows the pointer is the whole row, grip, switcher, icon and title, lifted
   * on a card, whichever part of the row the drag started from. It is a clone of the row without
   * its indentation, kept out of view just long enough for the browser to take its snapshot.
   */
  private setGhost(event: DragEvent): void {
    const dataTransfer = event.dataTransfer;
    const source = event.currentTarget;
    const tree = this.host.nativeElement.querySelector('.andes-tree');
    if (
      !tree ||
      !(source instanceof HTMLElement) ||
      typeof dataTransfer?.setDragImage !== 'function'
    ) {
      return;
    }
    const ghost = tree.ownerDocument.createElement('div');
    ghost.className = 'andes-tree__ghost';
    ghost.setAttribute('aria-hidden', 'true');
    const clone = source.cloneNode(true) as HTMLElement;
    clone
      .querySelectorAll('.andes-tree__indent, .andes-tree__drop-indicator')
      .forEach((element) => element.remove());
    for (const attribute of ['data-dragging', 'data-drop']) {
      clone.removeAttribute(attribute);
    }
    ghost.append(clone);
    tree.append(ghost);
    const box = source.getBoundingClientRect();
    dataTransfer.setDragImage(
      ghost,
      Math.min(Math.max(event.clientX - box.left, 0), 24),
      Math.min(Math.max(event.clientY - box.top, 0), 24),
    );
    setTimeout(() => ghost.remove());
  }

  protected onDragEnter(event: DragEvent, row: AndesFlatTreeNode): void {
    const dragKey = this.dragKey();
    if (dragKey === null || this.movesWithin(event)) {
      return;
    }
    const resolved = this.resolveDrop(
      dragKey,
      row,
      this.positionFromPointer(event),
    );
    this.nodeDragEnter.emit(
      this.dragEvent(event, row, dragKey, resolved?.indicator.position ?? null),
    );
  }

  protected onDragOver(event: DragEvent, row: AndesFlatTreeNode): void {
    const dragKey = this.dragKey();
    if (dragKey === null) {
      return;
    }
    const resolved = this.resolveDrop(
      dragKey,
      row,
      this.positionFromPointer(event),
    );
    const position = resolved ? resolved.indicator.position : null;
    const last = this.lastDragOver;
    if (!last || last.key !== row.key || last.position !== position) {
      this.lastDragOver = { key: row.key, position };
      this.nodeDragOver.emit(
        this.dragEvent(
          event,
          row,
          dragKey,
          resolved?.indicator.position ?? null,
        ),
      );
    }
    if (!resolved) {
      this.clearDropIndicator();
      return;
    }
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
    const current = this.dropIndicator();
    const next = resolved.indicator;
    if (
      !current ||
      current.key !== next.key ||
      current.position !== next.position ||
      current.level !== next.level
    ) {
      this.dropIndicator.set(next);
      this.scheduleDragExpand(row, next.position);
    }
  }

  protected onDragLeave(event: DragEvent, row: AndesFlatTreeNode): void {
    const dragKey = this.dragKey();
    if (dragKey === null || this.movesWithin(event)) {
      return;
    }
    if (this.dropIndicator()?.key === row.key) {
      this.clearDropIndicator();
    }
    if (this.lastDragOver?.key === row.key) {
      this.lastDragOver = null;
    }
    this.nodeDragLeave.emit(this.dragEvent(event, row, dragKey, null));
  }

  /** Whether a drag event only moves between the elements inside one row. */
  private movesWithin(event: DragEvent): boolean {
    const related = event.relatedTarget as Node | null;
    return !!related && (event.currentTarget as HTMLElement).contains(related);
  }

  private dragEvent(
    event: DragEvent,
    row: AndesFlatTreeNode,
    dragKey: AndesTreeKey,
    position: AndesTreeDropPosition | null,
  ): AndesTreeDragEvent {
    return {
      node: row.node,
      key: row.key,
      dragNode: this.index().byKey.get(dragKey)?.node ?? row.node,
      dragKey,
      position,
      event,
    };
  }

  protected onDrop(event: DragEvent, row: AndesFlatTreeNode): void {
    const dragKey = this.dragKey();
    if (dragKey === null) {
      return;
    }
    event.preventDefault();
    const resolved = this.resolveDrop(
      dragKey,
      row,
      this.positionFromPointer(event),
    );
    this.finishDrag();
    if (resolved) {
      this.emitMove(resolved.info, 'pointer');
    }
  }

  protected onDragEnd(event: DragEvent, row: AndesFlatTreeNode): void {
    this.finishDrag();
    this.nodeDragEnd.emit(this.dragEvent(event, row, row.key, null));
  }

  private positionFromPointer(event: DragEvent): AndesTreeDropPosition {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const ratio =
      rect.height > 0 ? (event.clientY - rect.top) / rect.height : 0.5;
    if (ratio < 0.25) {
      return 'before';
    }
    return ratio > 0.75 ? 'after' : 'inside';
  }

  /**
   * Turns "dragged over this row, at this part of it" into the move that would happen. Dropping
   * after an open parent means "as its first child", which is where the node would appear.
   */
  private resolveDrop(
    dragKey: AndesTreeKey,
    row: AndesFlatTreeNode,
    position: AndesTreeDropPosition,
  ): {
    info: AndesTreeDropInfo;
    indicator: {
      key: AndesTreeKey;
      position: AndesTreeDropPosition;
      level: number;
    };
  } | null {
    const index = this.index();
    const drag = index.byKey.get(dragKey);
    if (!drag || andesIsTreeDescendantOrSelf(drag, row.entry)) {
      return null;
    }
    if (position === 'inside' && row.entry.disabled) {
      return null;
    }

    let target = row.entry;
    let resolved = position;
    // A node dropped inside becomes a child: the line is drawn one step in.
    let level = position === 'inside' ? row.level + 1 : row.level;
    if (
      position === 'after' &&
      row.hasChildren &&
      this.isExpanded(row.key) &&
      !this.isLeaf(row)
    ) {
      const first = this.childRows(row.key)[0];
      if (!first || first.key === dragKey) {
        return null;
      }
      target = first.entry;
      resolved = 'before';
      level = row.level + 1;
    }

    const info: AndesTreeDropInfo = {
      dragNode: drag.node,
      dragKey,
      targetNode: target.node,
      targetKey: target.key,
      position: resolved,
    };
    if (this.allowDrop()?.(info) === false) {
      return null;
    }
    return { info, indicator: { key: row.key, position, level } };
  }

  private scheduleDragExpand(
    row: AndesFlatTreeNode,
    position: AndesTreeDropPosition,
  ) {
    this.clearDragExpand();
    if (position !== 'inside' || this.isLeaf(row) || this.isExpanded(row.key)) {
      return;
    }
    this.dragExpandTimer = setTimeout(
      () => this.toggleExpand(row),
      DRAG_EXPAND_DELAY_MS,
    );
  }

  private clearDragExpand(): void {
    if (this.dragExpandTimer !== null) {
      clearTimeout(this.dragExpandTimer);
      this.dragExpandTimer = null;
    }
  }

  private clearDropIndicator(): void {
    this.clearDragExpand();
    this.dropIndicator.set(null);
  }

  private finishDrag(): void {
    this.dragKey.set(null);
    this.lastDragOver = null;
    this.clearDropIndicator();
  }

  protected isDragging(key: AndesTreeKey): boolean {
    return this.dragKey() === key;
  }

  /**
   * Reports a move. The consumer applies it; meanwhile the branch the node lands in is opened,
   * so it is in view as soon as `nodes` carry it.
   */
  private emitMove(
    info: AndesTreeDropInfo,
    via: AndesTreeDropEvent['via'],
  ): void {
    const target = this.index().byKey.get(info.targetKey);
    const parent = info.position === 'inside' ? target : target?.parent;
    if (parent) {
      this.expandKeys(
        [...andesGetTreeAncestors(parent), parent]
          .map((entry) => entry.key)
          .filter((key) => !this.expandedSet().has(key)),
      );
    }
    this.pendingMove = { info, focus: via === 'keyboard' };
    this.nodeDrop.emit({ ...info, via });
  }

  /** Once `nodes` hold an emitted move, announces it and keeps a keyboard user on the node. */
  private settleMove(index: AndesTreeIndex): void {
    const pending = this.pendingMove;
    const moved = pending && index.byKey.get(pending.info.dragKey);
    if (!pending || !moved || !this.landed(index, moved, pending.info)) {
      return;
    }
    this.pendingMove = null;
    const target = index.byKey.get(pending.info.targetKey);
    this.announcement.set(
      this.text().moved(
        moved.title,
        pending.info.position,
        target?.title ?? '',
      ),
    );
    if (pending.focus) {
      this.activeKey.set(moved.key);
      afterNextRender(() => this.itemElement(moved.key)?.focus(), {
        injector: this.injector,
      });
    }
  }

  /** Whether a node sits where a move put it: before, inside (first) or after its target. */
  private landed(
    index: AndesTreeIndex,
    moved: AndesTreeEntry,
    info: AndesTreeDropInfo,
  ): boolean {
    if (info.position === 'inside') {
      return moved.parent?.key === info.targetKey && moved.index === 0;
    }
    const siblings = moved.parent ? moved.parent.children : index.roots;
    const neighbour =
      siblings[moved.index + (info.position === 'before' ? 1 : -1)];
    return neighbour?.key === info.targetKey;
  }

  private moveWithKeyboard(
    row: AndesFlatTreeNode,
    direction: 'up' | 'down' | 'indent' | 'outdent',
  ): void {
    if (!this.isDraggable(row)) {
      return;
    }
    const entry = row.entry;
    const siblings = entry.parent ? entry.parent.children : this.index().roots;
    let target: AndesTreeEntry | undefined;
    let position: AndesTreeDropPosition = 'after';

    switch (direction) {
      case 'up':
        target = siblings[entry.index - 1];
        position = 'before';
        break;
      case 'down':
        target = siblings[entry.index + 1];
        break;
      case 'indent': {
        const previous = siblings[entry.index - 1];
        if (previous && !previous.disabled) {
          const last = previous.children[previous.children.length - 1];
          target = last ?? previous;
          position = last ? 'after' : 'inside';
        }
        break;
      }
      case 'outdent':
        target = entry.parent ?? undefined;
        break;
    }
    if (!target) {
      return;
    }

    const info: AndesTreeDropInfo = {
      dragNode: entry.node,
      dragKey: entry.key,
      targetNode: target.node,
      targetKey: target.key,
      position,
    };
    if (this.allowDrop()?.(info) === false) {
      return;
    }
    this.emitMove(info, 'keyboard');
  }
}
