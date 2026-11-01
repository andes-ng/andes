import type { TemplateRef } from '@angular/core';
import type { Observable } from 'rxjs';

/** Identifies a node. Keys are compared with `===`, so `1` and `'1'` are different nodes. */
export type AndesTreeKey = string | number;

/**
 * Where a dragged node lands relative to the node it is dropped on: as its previous sibling,
 * as its first child, or as its next sibling.
 */
export type AndesTreeDropPosition = 'before' | 'inside' | 'after';

/** Template context of a node's custom content and icon templates. */
export interface AndesTreeNodeContext {
  /** The node's data object. */
  $implicit: AndesTreeNode;
  node: AndesTreeNode;
  key: AndesTreeKey;
  /** The node's title text, read through `fieldNames`. */
  title: string;
  /** 1 for a root node. */
  level: number;
  expanded: boolean;
  selected: boolean;
  checked: boolean;
  /** A parent whose descendants are only partly checked. */
  indeterminate: boolean;
  loading: boolean;
  disabled: boolean;
  isLeaf: boolean;
  /** The active filter text (empty when there is none). */
  query: string;
  /** The title split around the filter matches, ready to render with highlighting. */
  segments: AndesTreeTextSegment[];
}

/** A node of the `nodes` input. Extra properties are kept untouched and handed back in events. */
export interface AndesTreeNode {
  /** Identifies the node. Without one the node's position path (`'0-2-1'`) is its key. */
  key?: AndesTreeKey;
  /** Text shown for the node. Rename it with `fieldNames`. */
  title?: string;
  children?: AndesTreeNode[];
  /**
   * A short glyph (an emoji, a single character) or a template drawn before the title. Shown
   * when `showIcon` (or `directory`) is on; without one the default folder / file icons are used.
   */
  icon?: string | TemplateRef<AndesTreeNodeContext>;
  /** Not selectable, checkable or draggable; it can still be expanded. */
  disabled?: boolean;
  /** `false` keeps a node from being selected. */
  selectable?: boolean;
  /** `false` hides the node's checkbox in a checkable tree. */
  checkable?: boolean;
  /** Shows the checkbox but ignores clicks; the node keeps whatever state it has. */
  disableCheckbox?: boolean;
  /**
   * Forces the node to be treated as a leaf (`true`) or as expandable (`false`) regardless of its
   * children; the latter is how a lazily loaded parent is shown before its children arrive.
   */
  isLeaf?: boolean;
  [field: string]: unknown;
}

/** Where {@link andesTreeFromFlat} reads each item's id and its parent's id. */
export interface AndesTreeFromFlatOptions {
  /** The property holding an item's id, which becomes its `key`. Default `'id'`. */
  id?: string;
  /** The property holding the id of the item's parent. Default `'pId'`. */
  pId?: string;
  /**
   * The parent id that marks a root. Items whose parent id is `null`, `undefined`, this value,
   * or the id of no item in the list are roots.
   */
  rootPId?: AndesTreeKey | null;
}

/** Renames the properties the tree reads from each node object. */
export interface AndesTreeFieldNames {
  key?: string;
  title?: string;
  children?: string;
}

/** A piece of text and whether it is part of a filter match. */
export interface AndesTreeTextSegment {
  text: string;
  match: boolean;
}

/** One node of the data, with its position in the tree resolved. */
export interface AndesTreeEntry {
  readonly key: AndesTreeKey;
  readonly node: AndesTreeNode;
  readonly title: string;
  readonly parent: AndesTreeEntry | null;
  /** 1 for a root node. */
  readonly level: number;
  /** Position among its siblings, 0-based. */
  readonly index: number;
  readonly siblingCount: number;
  readonly children: readonly AndesTreeEntry[];
  /** Whether the node object has a children array (even an empty one). */
  readonly hasChildrenField: boolean;
  readonly disabled: boolean;
  readonly selectable: boolean;
  readonly checkable: boolean;
  readonly disableCheckbox: boolean;
  /** The node's own `isLeaf` flag, when it set one. */
  readonly isLeafFlag: boolean | undefined;
}

/** The keyed, resolved view of a tree of nodes. */
export interface AndesTreeIndex {
  readonly roots: readonly AndesTreeEntry[];
  readonly byKey: ReadonlyMap<AndesTreeKey, AndesTreeEntry>;
  /** Every key in depth-first order. */
  readonly order: readonly AndesTreeKey[];
}

/** One row of a flattened tree. */
export interface AndesFlatTreeNode {
  readonly key: AndesTreeKey;
  readonly node: AndesTreeNode;
  readonly entry: AndesTreeEntry;
  readonly title: string;
  readonly parentKey: AndesTreeKey | null;
  /** 1 for a root node. */
  readonly level: number;
  /** 1-based position among the visible siblings. */
  readonly posInSet: number;
  /** Number of visible siblings (the node included). */
  readonly setSize: number;
  readonly isLast: boolean;
  /**
   * Connector-line flags, one per indent cell of the row (`level - 1` of them, none for a root).
   * Cell `k` holds the line joining the children of the ancestor at level `k + 1`: it runs on
   * through this row when the node at that depth has a later sibling. The last cell is the row's
   * own elbow, and its flag says whether the line continues down to the next sibling.
   */
  readonly connectors: readonly boolean[];
  /** Whether the row has any child rows to show. */
  readonly hasChildren: boolean;
}

export interface AndesFlattenOptions {
  readonly fieldNames?: AndesTreeFieldNames;
  /** Only descend into these keys. Omitted: every row is returned. */
  readonly expandedKeys?: ReadonlySet<AndesTreeKey>;
  /** Drops entries (and their subtrees) the predicate rejects. */
  readonly include?: (entry: AndesTreeEntry) => boolean;
}

/** Result of conducting check state through a tree. */
export interface AndesTreeCheckState {
  /** Fully checked keys. */
  readonly checked: ReadonlySet<AndesTreeKey>;
  /** Parents with some, but not all, of their descendants checked. */
  readonly halfChecked: ReadonlySet<AndesTreeKey>;
}

/** What a checkable tree reports as its value (also used by the tree select). */
export type AndesTreeCheckedStrategy = 'all' | 'parent' | 'child';

/** Result of filtering a tree. */
export interface AndesTreeFilterResult {
  /** Keys that match the query. */
  readonly matched: ReadonlySet<AndesTreeKey>;
  /** Keys to show: matches, their ancestors and the subtrees under matches. */
  readonly visible: ReadonlySet<AndesTreeKey>;
  /** Keys that have a match somewhere below them (to expand). */
  readonly expand: ReadonlySet<AndesTreeKey>;
}

/** Loads a node's children. Resolve (or complete) once the new `nodes` carry them. */
export type AndesTreeLoadData = (
  node: AndesTreeNode,
) => Promise<unknown> | Observable<unknown> | void;

/** Lets a consumer veto a drop. Return `false` to refuse it. */
export type AndesTreeAllowDrop = (info: AndesTreeDropInfo) => boolean;

/** What a drag carries: the dragged node, the node it is over and where it would land. */
export interface AndesTreeDropInfo {
  dragNode: AndesTreeNode;
  dragKey: AndesTreeKey;
  targetNode: AndesTreeNode;
  targetKey: AndesTreeKey;
  position: AndesTreeDropPosition;
}

/**
 * Emitted when a node is dropped, or moved with Alt + arrow keys. The tree never changes
 * `nodes` itself: apply the move to your data, for instance with
 * `andesMoveTreeNode(nodes, event.dragKey, event.targetKey, event.position)`.
 */
export interface AndesTreeDropEvent extends AndesTreeDropInfo {
  /** Whether the move came from a pointer drop or from the keyboard. */
  via: 'pointer' | 'keyboard';
}

/** A drag over the tree: the node it concerns, the dragged node and where it would land. */
export interface AndesTreeDragEvent {
  /** The node the event is about: the dragged one, or the one the pointer is over. */
  node: AndesTreeNode;
  key: AndesTreeKey;
  dragNode: AndesTreeNode;
  dragKey: AndesTreeKey;
  /** Where the dragged node would land on `node`; `null` when it cannot be dropped there. */
  position: AndesTreeDropPosition | null;
  event: DragEvent;
}

export interface AndesTreeNodeEvent {
  node: AndesTreeNode;
  key: AndesTreeKey;
  event: MouseEvent;
}

export interface AndesTreeExpandEvent {
  node: AndesTreeNode;
  key: AndesTreeKey;
  expanded: boolean;
  expandedKeys: AndesTreeKey[];
}

export interface AndesTreeSelectEvent {
  node: AndesTreeNode;
  key: AndesTreeKey;
  selected: boolean;
  selectedKeys: AndesTreeKey[];
  selectedNodes: AndesTreeNode[];
}

export interface AndesTreeCheckEvent {
  node: AndesTreeNode;
  key: AndesTreeKey;
  checked: boolean;
  checkedKeys: AndesTreeKey[];
  halfCheckedKeys: AndesTreeKey[];
  checkedNodes: AndesTreeNode[];
}

export interface AndesTreeLoadEvent {
  node: AndesTreeNode;
  key: AndesTreeKey;
}

export interface AndesTreeLoadErrorEvent extends AndesTreeLoadEvent {
  error: unknown;
}

/** Texts the tree speaks or shows; translate them by passing the ones that differ. */
export interface AndesTreeLabels {
  /** Shown when there are no nodes (or the filter matches none). */
  empty: string;
  /** Shown instead of the nodes while `loading` is on, and as the busy spinner's label. */
  loading: string;
  /** Announced when a filter changes. */
  results: (count: number) => string;
  /** Announced when a drag starts. */
  grabbed: (title: string) => string;
  /** Announced once a dropped (or keyboard-moved) node shows up in its new place. */
  moved: (
    title: string,
    position: AndesTreeDropPosition,
    targetTitle: string,
  ) => string;
}

export interface AndesTreeScrollOptions {
  /** Where the node ends up in the viewport. Default `'nearest'`. */
  align?: 'nearest' | 'start' | 'center' | 'end';
  behavior?: ScrollBehavior;
  /** Open the node's collapsed ancestors first. Default `true`. */
  expand?: boolean;
  /** Also move focus to the node. Default `false`. */
  focus?: boolean;
}
