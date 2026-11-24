import {
  AndesCheckedTree,
  andesElementSize,
  andesPrefersReducedMotion,
  AndesTreeNavigation,
  AndesTreeNavigationNode,
} from '@andes-ng/primitives';
import { NgTemplateOutlet } from '@angular/common';
import {
  afterNextRender,
  AnimationCallbackEvent,
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
  input,
  linkedSignal,
  model,
  numberAttribute,
  output,
  signal,
  TemplateRef,
  untracked,
  viewChild,
} from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideChevronDown,
  lucideDownload,
  lucideLoaderCircle,
  lucideLocateFixed,
  lucideMaximize,
  lucideMinus,
  lucidePlus,
} from '@ng-icons/lucide';

import { AndesButton } from '../button/button';
import { AndesCheckbox } from '../checkbox/checkbox';
import { AndesDropdownMenu } from '../dropdown-menu/dropdown-menu';
import { AndesDropdownMenuTrigger } from '../dropdown-menu/dropdown-menu-trigger';
import type {
  AndesDropdownMenuClickEvent,
  AndesDropdownMenuItemOption,
} from '../dropdown-menu/dropdown-menu-types';
import {
  type AndesOrgChartExportFormat,
  type AndesOrgChartExportOptions,
  exportBlob,
  exportExtension,
  saveBlob,
  snapshotSvg,
} from './org-chart-export';
import {
  andesOrgChartLinkPath,
  AndesOrgChartConnectorStyle,
  andesOrgChartSecondaryPath,
} from './org-chart-connectors';
import {
  andesOrgChartInitials,
  AndesOrgChartDataFormat,
  AndesOrgChartFieldNames,
  buildOrgChartTree,
  OrgChartRecord,
  resolveFieldNames,
} from './org-chart-data';
import {
  andesOrgChartLayout,
  AndesOrgChartBox,
  AndesOrgChartLayout,
  AndesOrgChartKey,
  AndesOrgChartLayoutNode,
  AndesOrgChartLeafLayout,
  AndesOrgChartLinkKind,
  AndesOrgChartOrientation,
} from './org-chart-layout';
import {
  AndesOrgChartNodeItem,
  ORG_CHART_NODE_HOST,
  OrgChartNodeHost,
} from './org-chart-node';
import {
  AndesOrgChartConnectorContext,
  AndesOrgChartConnectorTemplate,
  AndesOrgChartEmptyTemplate,
  AndesOrgChartNodeContext,
  AndesOrgChartNodeTemplate,
  AndesOrgChartToggleIconContext,
  AndesOrgChartToggleIconTemplate,
  AndesOrgChartToggleTemplate,
  AndesOrgChartToolbarTemplate,
} from './org-chart-templates';

/**
 * How cards are selected.
 *
 * - `none`: not at all.
 * - `single`: a click selects one card (Ctrl/Cmd + click deselects it).
 * - `multiple`: a click adds or removes a card.
 * - `checkbox`: every card has a checkbox; checking a card checks everyone below it, a manager
 *   whose reports are all checked is checked, and one with only some checked is mixed.
 */
export type AndesOrgChartSelectionMode =
  'none' | 'single' | 'multiple' | 'checkbox';

/** The small number next to the toggle icon: direct reports, everyone below, or none. */
export type AndesOrgChartToggleCount = 'direct' | 'total' | 'none';

/** What the mouse wheel does. Pinch and Ctrl/Cmd + wheel always zoom. */
export type AndesOrgChartWheel = 'zoom' | 'pan';

/** Text direction; `auto` follows the closest `dir` attribute. */
export type AndesOrgChartDirection = 'auto' | 'ltr' | 'rtl';

/** A card size in pixels, before zoom. */
export interface AndesOrgChartSize {
  readonly width: number;
  readonly height: number;
}

/** One size for every card, or a size per data item. */
export type AndesOrgChartNodeSize<T> =
  AndesOrgChartSize | ((node: T) => AndesOrgChartSize);

/** A dotted-line relation drawn over the tree (it does not affect the layout). */
export interface AndesOrgChartSecondaryLink {
  readonly from: AndesOrgChartKey;
  readonly to: AndesOrgChartKey;
  /** Shown as a tooltip on the line. */
  readonly label?: string;
  /** Extra class(es) on the line. */
  readonly class?: string;
}

/** Extra classes for a card: a fixed string, or computed per item. */
export type AndesOrgChartNodeClass<T> =
  | string
  | ((
      node: T,
      context: AndesOrgChartNodeContext<T>,
    ) => string | readonly string[] | null | undefined);

/** What a connector class function receives. */
export interface AndesOrgChartConnectorInfo<T> {
  readonly from: AndesOrgChartKey;
  readonly to: AndesOrgChartKey;
  readonly kind: AndesOrgChartLinkKind | 'secondary';
  readonly fromData: T;
  readonly toData: T;
}

/** Extra classes for the connectors: a fixed string, or computed per link. */
export type AndesOrgChartConnectorClass<T> =
  string | ((link: AndesOrgChartConnectorInfo<T>) => string | null | undefined);

/** Something with a `subscribe` method, such as an RxJS observable. */
export interface AndesOrgChartSubscribable<V> {
  subscribe(observer: {
    next?: (value: V) => void;
    error?: (error: unknown) => void;
    complete?: () => void;
  }): { unsubscribe(): void };
}

/** Fetches the reports of a node when it is first expanded. */
export type AndesOrgChartLoadChildren<T> = (
  node: T,
) =>
  | PromiseLike<readonly T[]>
  | AndesOrgChartSubscribable<readonly T[]>
  | readonly T[];

/** Payload of the pointer and keyboard events of a card. */
export interface AndesOrgChartNodeEvent<T> {
  readonly node: AndesOrgChartNodeContext<T>;
  readonly event: Event;
}

/** Payload of `nodeHover`: emitted when the pointer enters (`hovered`) and leaves a card. */
export interface AndesOrgChartHoverEvent<T> extends AndesOrgChartNodeEvent<T> {
  readonly hovered: boolean;
}

/** Payload of `nodeExpand`: a user expanded or collapsed a card. */
export interface AndesOrgChartExpandEvent<T> {
  readonly node: AndesOrgChartNodeContext<T>;
  readonly expanded: boolean;
}

/** Payload of `nodeSelect`: a user selected or deselected a card. */
export interface AndesOrgChartSelectEvent<T> {
  readonly node: AndesOrgChartNodeContext<T>;
  /** `true` when the node became selected (checked), `false` when it was deselected. */
  readonly selected: boolean;
  /** Every selected key after the change (in `checkbox` mode, every checked key). */
  readonly selectedKeys: readonly AndesOrgChartKey[];
  /** `checkbox` mode: the managers now in the mixed state. Empty in the other modes. */
  readonly partiallySelected: readonly AndesOrgChartKey[];
}

/** Payload of `loadError`: `loadChildren` failed; the card collapses again. */
export interface AndesOrgChartLoadErrorEvent<T> {
  readonly node: AndesOrgChartNodeContext<T>;
  readonly error: unknown;
}

/** The pan offset (pixels) and zoom of the chart. */
export interface AndesOrgChartViewport {
  readonly x: number;
  readonly y: number;
  readonly scale: number;
}

/** Options of the imperative view methods. */
export interface AndesOrgChartViewOptions {
  /** Animate the move (ignored under reduced motion). Default `true`. */
  readonly animate?: boolean;
}

/** Options of {@link AndesOrgChart.scrollToNode}. */
export interface AndesOrgChartScrollOptions extends AndesOrgChartViewOptions {
  /** Also select the node. Default `false`. */
  readonly select?: boolean;
  /** Also move keyboard focus to the node. Default `false`. */
  readonly focus?: boolean;
}

/** Every text the chart shows or announces itself, for translation. */
export interface AndesOrgChartLabels {
  readonly zoomIn: string;
  readonly zoomOut: string;
  readonly fit: string;
  readonly reset: string;
  readonly export: string;
  readonly controls: string;
  readonly empty: string;
  readonly loading: string;
}

const DEFAULT_LABELS: AndesOrgChartLabels = {
  zoomIn: 'Zoom in',
  zoomOut: 'Zoom out',
  fit: 'Fit to view',
  reset: 'Reset view',
  export: 'Export chart',
  controls: 'Chart view',
  empty: 'No data',
  loading: 'Loading reports',
};

/** The formats of the export menu, in the order they are listed. */
const EXPORT_ITEMS: readonly AndesDropdownMenuItemOption[] = [
  { key: 'png', label: 'PNG image' },
  { key: 'jpeg', label: 'JPG image' },
  { key: 'webp', label: 'WebP image' },
  { key: 'svg', label: 'SVG vector' },
];

const DEFAULT_NODE_SIZE: AndesOrgChartSize = { width: 240, height: 72 };

/** Space around the cards inside the canvas, so toggles and focus rings are never clipped. */
const CANVAS_PADDING = 32;

/**
 * More cards than this appearing (or leaving) in one change skip their grow (or shrink)
 * animation: thousands of simultaneous animations cost more than they show.
 */
const BULK_ANIMATION_LIMIT = 150;

/**
 * Charts with more visible cards than this render only the cards near the viewport (see
 * `virtualizeAbove`).
 */
const DEFAULT_VIRTUALIZE_ABOVE = 150;

/**
 * How far past the viewport cards are kept rendered, as a fraction of the viewport on each
 * side, and the least distance in canvas pixels. A pan only touches the DOM once the viewport
 * leaves that area, so a drag renders nothing on most frames.
 */
const WINDOW_MARGIN = 0.4;
const MIN_WINDOW_MARGIN = 200;

/** The render area is rebuilt when it grows more than this many times past what is needed. */
const MAX_WINDOW_SLACK = 6;

/** What a not yet measured viewport is assumed to be, so a large chart never renders in full. */
const FALLBACK_VIEWPORT = { width: 1600, height: 1000 } as const;

/** Room the toggle button and focus ring take outside a card's box. */
const CARD_OVERHANG = 28;

/** Pointer travel before a press on the chart becomes a pan instead of a click. */
const PAN_THRESHOLD = 4;

/** Elements whose own pointer interaction must win over panning. */
const INTERACTIVE =
  'button, a[href], input, select, textarea, [contenteditable="true"]';

function clamp(value: number, low: number, high: number): number {
  return Math.min(high, Math.max(low, value));
}

function sameKeys(
  a: ReadonlySet<AndesOrgChartKey>,
  b: readonly AndesOrgChartKey[] | ReadonlySet<AndesOrgChartKey>,
): boolean {
  const other =
    b instanceof Set ? b : new Set(b as readonly AndesOrgChartKey[]);
  if (a.size !== other.size) {
    return false;
  }
  for (const key of a) {
    if (!other.has(key)) {
      return false;
    }
  }
  return true;
}

function normalizeText(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLocaleLowerCase();
}

function isSubscribable<V>(
  value: unknown,
): value is AndesOrgChartSubscribable<V> {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { subscribe?: unknown }).subscribe === 'function'
  );
}

function isPromiseLike<V>(value: unknown): value is PromiseLike<V> {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { then?: unknown }).then === 'function'
  );
}

/** A card as the template renders it. */
interface NodeView<T> {
  readonly key: AndesOrgChartKey;
  readonly record: OrgChartRecord<T>;
  readonly parentKey: AndesOrgChartKey | null;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  /** Where the card grows from when it appears: its parent's position. */
  readonly fromX: number;
  readonly fromY: number;
  readonly kind: 'root' | 'branch' | 'leaf';
  /** Shows the expand / collapse toggle and `aria-expanded`. */
  readonly toggleable: boolean;
  /** `checkbox` mode: the card's `aria-checked`. */
  readonly checkState: 'true' | 'false' | 'mixed';
  readonly context: AndesOrgChartNodeContext<T>;
  readonly classes: string | readonly string[] | null;
  readonly level: number;
  readonly posInSet: number;
  readonly setSize: number;
  /** The optional count next to the toggle icon, `''` for none. */
  readonly count: string;
  /**
   * Where the reports' connectors leave the card, relative to the card (a hanging team's stem
   * is near the start edge, not in the middle), so the toggle sits on the line. `null` while
   * the team is closed: the stylesheet centers the toggle on the edge then.
   */
  readonly toggleAt: { readonly x: number; readonly y: number } | null;
  /** Class that plays the grow-from-the-manager animation, `''` when the card does not. */
  readonly enterClass: string;
}

/** A connector as the template renders it. */
interface LinkView<T> {
  readonly id: string;
  readonly d: string;
  readonly kind: AndesOrgChartLinkKind | 'secondary';
  readonly highlighted: boolean;
  readonly classes: string | null;
  readonly label: string | null;
  readonly context: AndesOrgChartConnectorContext<T>;
  /** Class that plays the fade-in animation, `''` when the line does not. */
  readonly enterClass: string;
}

/** The area of the canvas whose cards and connectors are rendered, in canvas pixels. */
interface RenderArea {
  readonly left: number;
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
}

/**
 * Where every card and connector of the current layout is, as flat arrays: finding what is near
 * the viewport is one pass over numbers, with no object per card.
 */
interface Placement<T> {
  readonly records: readonly OrgChartRecord<T>[];
  readonly indexOf: ReadonlyMap<AndesOrgChartKey, number>;
  readonly cardLeft: Float64Array;
  readonly cardTop: Float64Array;
  readonly cardRight: Float64Array;
  readonly cardBottom: Float64Array;
  readonly linkLeft: Float64Array;
  readonly linkTop: Float64Array;
  readonly linkRight: Float64Array;
  readonly linkBottom: Float64Array;
  /** Where each manager's connectors leave its card (canvas-relative to the card's box). */
  readonly exits: ReadonlyMap<
    AndesOrgChartKey,
    { readonly x: number; readonly y: number }
  >;
}

/**
 * An organization chart: people as cards, reports below (or beside) their manager, connected
 * by lines, on a canvas that pans and zooms.
 *
 * - **Data**: nested items with `children`, or flat rows with `parentId`
 *   (`dataFormat="flat"`); every field name is configurable through `fieldNames`.
 * - **Layout**: a tidy tree for cards of any size, vertical or horizontal, reversed, right to
 *   left; compact or hanging teams of leaves; assistants beside the stem.
 * - **Interaction**: expand and collapse with the toggle, selection, search with the
 *   path to the root highlighted, pan by dragging, zoom with the wheel, a pinch or the
 *   floating controls, and lazy loading of reports.
 * - **Keyboard** (the WAI-ARIA tree pattern, following the reading order rather than the
 *   picture): Up/Down previous/next card, Right/Left expand or go to the first report /
 *   collapse or go to the manager (mirrored right to left), Home/End, `*` expands the
 *   siblings, typing jumps by name, Alt+Down/Alt+Up expand/collapse, Enter/Space select,
 *   `+`/`-` zoom and `0` fits the chart. A card that receives focus is panned into view.
 * - **Large charts**: with more than `virtualizeAbove` visible cards only the cards and connectors
 *   near the viewport are in the page, so panning, zooming, searching and expanding cost what is
 *   on screen rather than the size of the organization. Moving focus to a card that is not
 *   rendered renders it and pans it into view.
 *
 * Styling is through CSS custom properties (`--andes-org-chart-*`), see the stylesheet.
 */
@Component({
  selector: 'andes-org-chart',
  exportAs: 'andesOrgChart',
  viewProviders: [
    provideIcons({
      lucideChevronDown,
      lucideDownload,
      lucideLoaderCircle,
      lucideLocateFixed,
      lucideMaximize,
      lucideMinus,
      lucidePlus,
    }),
  ],
  imports: [
    NgIcon,
    NgTemplateOutlet,
    AndesButton,
    AndesCheckbox,
    AndesDropdownMenu,
    AndesDropdownMenuTrigger,
    AndesOrgChartNodeItem,
  ],
  templateUrl: './org-chart.html',
  styleUrl: './org-chart.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    AndesTreeNavigation,
    {
      provide: ORG_CHART_NODE_HOST,
      useExisting: forwardRef(() => AndesOrgChart),
    },
  ],
  host: {
    class: 'andes-org-chart',
    '[attr.data-orientation]': 'orientation()',
    '[attr.data-reversed]': "reversed() ? '' : null",
    '[attr.data-direction]': 'resolvedDirection()',
    '[attr.data-children-side]': 'childrenSide()',
    '[attr.data-motion]': "motion() ? '' : null",
    '[attr.data-ready]': "ready() ? '' : null",
    '[attr.data-windowed]': "windowing() ? '' : null",
    '[attr.data-panning]': "panning() ? '' : null",
    '[attr.data-searching]': "searching() ? '' : null",
    '[attr.data-connector]': 'connector()',
    // The tree inside carries the label: a roleless host is never announced.
    '[attr.aria-label]': 'null',
    '[attr.aria-labelledby]': 'null',
    '[style.--_andes-org-chart-duration]': 'animationDuration() + "ms"',
  },
})
export class AndesOrgChart<T = unknown> implements OrgChartNodeHost {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly navigation = inject(AndesTreeNavigation);
  private readonly reducedMotion = andesPrefersReducedMotion();

  private readonly viewportRef = viewChild<ElementRef<HTMLElement>>('viewport');
  private readonly viewportSize = andesElementSize(this.viewportRef);

  // ------------------------------------------------------------------ data inputs

  /** Nested items (one root or several), or flat rows when `dataFormat` is `flat`. */
  readonly data = input<readonly T[] | T | null | undefined>(undefined);
  /** `nested` (default): items carry their reports in `children`; `flat`: rows name a `parentId`. */
  readonly dataFormat = input<AndesOrgChartDataFormat>('nested');
  /** Where each fact is read from on an item; partial, merged over the defaults. */
  readonly fieldNames = input<AndesOrgChartFieldNames | null | undefined>(
    undefined,
  );
  /** Dotted-line relations between any two nodes, drawn over the tree. */
  readonly secondaryLinks = input<readonly AndesOrgChartSecondaryLink[]>([]);
  /**
   * Fetches a node's reports the first time it is expanded. Nodes without children are then
   * expandable unless their `isLeaf` field is `true`. May return an array, a promise or an
   * observable; the toggle shows a spinner meanwhile.
   */
  readonly loadChildren = input<AndesOrgChartLoadChildren<T> | null>(null);

  // ------------------------------------------------------------------ layout inputs

  /** `vertical` (default): reports below; `horizontal`: reports beside, towards the inline end. */
  readonly orientation = input<AndesOrgChartOrientation>('vertical');
  /** Grow upwards (vertical) or towards the inline start (horizontal). */
  readonly reversed = input(false, { transform: booleanAttribute });
  /** `auto` (default) follows the closest `dir` attribute. */
  readonly direction = input<AndesOrgChartDirection>('auto');
  /** `elbow` (default), `straight` or `curved`. */
  readonly connector = input<AndesOrgChartConnectorStyle>('elbow');
  /** Corner radius of elbow connectors, in pixels. */
  readonly connectorRadius = input(6, { transform: numberAttribute });
  /** Card size, fixed or per item. Default 240 x 72. */
  readonly nodeSize = input<AndesOrgChartNodeSize<T>>(DEFAULT_NODE_SIZE);
  /** Space between sibling cards. */
  readonly nodeGap = input(24, { transform: numberAttribute });
  /** Space between neighbouring subtrees (cousins). */
  readonly subtreeGap = input(40, { transform: numberAttribute });
  /** Space between a manager and the reports. */
  readonly levelGap = input(56, { transform: numberAttribute });
  /** `tree` (default), `compact` (two columns) or `hanging` (one column) for all-leaf teams. */
  readonly leafLayout = input<AndesOrgChartLeafLayout>('tree');
  /** Fewest all-leaf reports before `leafLayout` applies. */
  readonly leafLayoutMinCount = input(2, { transform: numberAttribute });
  /** Accent colors by depth (cycled); a node's own `color` field wins. */
  readonly levelColors = input<readonly string[]>([]);

  // ------------------------------------------------------------------ state

  /**
   * Keys of the expanded nodes; two-way bindable. Leave it unbound to start from
   * `defaultExpandDepth` / `expandAll`.
   */
  readonly expanded = model<readonly AndesOrgChartKey[] | undefined>(undefined);
  /** How many levels start expanded when `expanded` is not given: 2 shows three levels. */
  readonly defaultExpandDepth = input(2, { transform: numberAttribute });
  /** Start with every node expanded (wins over `defaultExpandDepth`). */
  readonly expandAll = input(false, { transform: booleanAttribute });
  /**
   * Whether teams can be expanded and collapsed. `false` hides the toggle and keeps every team
   * open (lazy teams are fetched as soon as they are shown).
   */
  readonly collapsible = input(true, { transform: booleanAttribute });
  /** Clicking a card also expands or collapses it (the toggle always does). */
  readonly expandOnClick = input(false, { transform: booleanAttribute });
  /** `single` (default), `multiple`, `checkbox` or `none`. */
  readonly selectionMode = input<AndesOrgChartSelectionMode>('single');
  /** Keys of the selected nodes; two-way bindable. */
  readonly selected = model<readonly AndesOrgChartKey[]>([]);
  /** Highlights matching cards, dims the rest and lights the path up to the root. */
  readonly search = input('');
  /** Custom match; defaults to name or title containing the query (case and accent blind). */
  readonly searchFn = input<((node: T, query: string) => boolean) | null>(null);
  /** Expand the managers of every match so the matches are visible. */
  readonly searchExpand = input(true, { transform: booleanAttribute });
  /** The optional count next to the toggle icon: `none` (default), `direct` or `total`. */
  readonly toggleCount = input<AndesOrgChartToggleCount>('none');

  // ------------------------------------------------------------------ view inputs

  /** Fit the whole chart in view once it first has data and a size. */
  readonly fitOnInit = input(true, { transform: booleanAttribute });
  /** Smallest and largest zoom. */
  readonly scaleExtent = input<readonly [number, number]>([0.1, 2]);
  /** Zoom factor of one zoom step (buttons, keys). */
  readonly zoomStep = input(1.25, { transform: numberAttribute });
  /** Drag the background or a card to pan. */
  readonly pannable = input(true, { transform: booleanAttribute });
  /** Zoom with the wheel, a pinch, the keys and the controls. */
  readonly zoomable = input(true, { transform: booleanAttribute });
  /** What the plain mouse wheel does: `zoom` (default) or `pan`. */
  readonly wheel = input<AndesOrgChartWheel>('zoom');
  /** Show the floating zoom controls. */
  readonly controls = input(true, { transform: booleanAttribute });
  /** Add an export menu (PNG, JPG, WebP, SVG) to the floating controls. */
  readonly exportable = input(true, { transform: booleanAttribute });
  /** The name, without extension, of the files the export menu saves. */
  readonly exportFilename = input('org-chart');
  protected readonly exportItems = EXPORT_ITEMS;
  /** Animate moves, expansion and zoom (always off under reduced motion). */
  readonly animated = input(true, { transform: booleanAttribute });
  /** Length of the animations, in milliseconds. */
  readonly animationDuration = input(280, { transform: numberAttribute });
  /**
   * With more visible cards than this, only the cards and connectors near the viewport are in
   * the page (every card keeps its `aria-posinset` and `aria-setsize`, and keyboard focus,
   * `scrollToNode` and `fitView` still reach the ones that are not). Pass `Infinity` to always
   * render every card.
   */
  readonly virtualizeAbove = input(DEFAULT_VIRTUALIZE_ABOVE, {
    transform: numberAttribute,
  });

  // ------------------------------------------------------------------ templates and classes

  /** Replaces the content of every card (or use `<ng-template andesOrgChartNode>`). */
  readonly nodeTemplate = input<TemplateRef<
    AndesOrgChartNodeContext<T>
  > | null>(null);
  /** Replaces the whole toggle content (or use `<ng-template andesOrgChartToggle>`). */
  readonly toggleTemplate = input<TemplateRef<
    AndesOrgChartNodeContext<T>
  > | null>(null);
  /**
   * Replaces only the toggle icon (or use `<ng-template andesOrgChartToggleIcon>`); receives
   * `{ $implicit: expanded, node }`.
   */
  readonly toggleIconTemplate = input<TemplateRef<
    AndesOrgChartToggleIconContext<T>
  > | null>(null);
  /** Extra controls in the top start corner (or use `<ng-template andesOrgChartToolbar>`). */
  readonly toolbarTemplate = input<TemplateRef<unknown> | null>(null);
  /** Shown without data (or use `<ng-template andesOrgChartEmpty>`). */
  readonly emptyTemplate = input<TemplateRef<unknown> | null>(null);
  /** Replaces every connector (or use `<ng-template andesOrgChartConnector>`). */
  readonly connectorTemplate = input<TemplateRef<
    AndesOrgChartConnectorContext<T>
  > | null>(null);
  /** Extra classes on every card, or per item. */
  readonly nodeClass = input<AndesOrgChartNodeClass<T> | null>(null);
  /** Extra classes on every connector, or per link. */
  readonly connectorClass = input<AndesOrgChartConnectorClass<T> | null>(null);

  // ------------------------------------------------------------------ accessibility

  /** Accessible name of the tree. */
  readonly ariaLabel = input<string | undefined>(undefined, {
    alias: 'aria-label',
  });
  /** Id(s) of the element(s) naming the tree. */
  readonly ariaLabelledby = input<string | undefined>(undefined, {
    alias: 'aria-labelledby',
  });
  /** Texts of the built-in controls, for translation. */
  readonly labels = input<Partial<AndesOrgChartLabels>>({});

  // ------------------------------------------------------------------ outputs

  readonly nodeClick = output<AndesOrgChartNodeEvent<T>>();
  readonly nodeDblClick = output<AndesOrgChartNodeEvent<T>>();
  readonly nodeContextMenu = output<AndesOrgChartNodeEvent<T>>();
  readonly nodeHover = output<AndesOrgChartHoverEvent<T>>();
  readonly nodeExpand = output<AndesOrgChartExpandEvent<T>>();
  readonly nodeSelect = output<AndesOrgChartSelectEvent<T>>();
  readonly loadError = output<AndesOrgChartLoadErrorEvent<T>>();
  /** Emitted after every pan or zoom. */
  readonly viewportChange = output<AndesOrgChartViewport>();

  // ------------------------------------------------------------------ content templates

  private readonly nodeDef = contentChild(AndesOrgChartNodeTemplate);
  private readonly toggleDef = contentChild(AndesOrgChartToggleTemplate);
  private readonly toggleIconDef = contentChild(
    AndesOrgChartToggleIconTemplate,
  );
  private readonly toolbarDef = contentChild(AndesOrgChartToolbarTemplate);
  private readonly emptyDef = contentChild(AndesOrgChartEmptyTemplate);
  private readonly connectorDef = contentChild(AndesOrgChartConnectorTemplate);

  protected readonly resolvedNodeTemplate = computed(
    () =>
      this.nodeTemplate() ??
      (this.nodeDef()?.template as TemplateRef<AndesOrgChartNodeContext<T>>) ??
      null,
  );
  protected readonly resolvedToggleTemplate = computed(
    () =>
      this.toggleTemplate() ??
      (this.toggleDef()?.template as TemplateRef<
        AndesOrgChartNodeContext<T>
      >) ??
      null,
  );
  protected readonly resolvedToggleIconTemplate = computed(
    () =>
      this.toggleIconTemplate() ??
      (this.toggleIconDef()?.template as TemplateRef<
        AndesOrgChartToggleIconContext<T>
      >) ??
      null,
  );
  protected readonly resolvedToolbarTemplate = computed(
    () => this.toolbarTemplate() ?? this.toolbarDef()?.template ?? null,
  );
  protected readonly resolvedEmptyTemplate = computed(
    () => this.emptyTemplate() ?? this.emptyDef()?.template ?? null,
  );
  protected readonly resolvedConnectorTemplate = computed(
    () =>
      this.connectorTemplate() ??
      (this.connectorDef()?.template as TemplateRef<
        AndesOrgChartConnectorContext<T>
      >) ??
      null,
  );

  protected readonly text = computed<AndesOrgChartLabels>(() => ({
    ...DEFAULT_LABELS,
    ...this.labels(),
  }));

  // ------------------------------------------------------------------ internal state

  private readonly loadedChildren = signal<
    ReadonlyMap<AndesOrgChartKey, readonly T[]>
  >(new Map());
  private readonly loadingKeys = signal<ReadonlySet<AndesOrgChartKey>>(
    new Set(),
  );
  private readonly expandedState = signal<ReadonlySet<AndesOrgChartKey>>(
    new Set(),
  );
  private readonly domDirection = signal<'ltr' | 'rtl'>('ltr');
  /** Cards whose photo failed to load; they fall back to initials. */
  protected readonly brokenAvatars = signal<ReadonlySet<AndesOrgChartKey>>(
    new Set(),
  );

  /** Pan offset and zoom. */
  private readonly view = signal<AndesOrgChartViewport>({
    x: 0,
    y: 0,
    scale: 1,
  });
  /**
   * Whether the view change in flight animates. A plain field: the canvas transform is written
   * straight to the element, so panning and zooming never go through Angular.
   */
  private smoothNow = false;
  private readonly canvasRef = viewChild<ElementRef<HTMLElement>>('canvas');
  /** The area of the canvas that is rendered; `null` renders everything. */
  private readonly renderArea = signal<RenderArea | null>(null);
  protected readonly panning = signal(false);
  protected readonly ready = signal(false);

  /** The layout currently on screen, and a card to keep still while the next one animates in. */
  private shownLayout: AndesOrgChartLayout | null = null;
  private anchor: { key: AndesOrgChartKey; box: AndesOrgChartBox } | null =
    null;
  private readonly seen = new Map<AndesOrgChartKey, number>();
  private fitted = false;
  private lastSearch = '';
  private lastWrittenExpanded: readonly AndesOrgChartKey[] | undefined;

  // ------------------------------------------------------------------ derived

  private readonly names = computed(() => resolveFieldNames(this.fieldNames()));

  private readonly tree = computed(() =>
    buildOrgChartTree<T>(
      this.data(),
      this.dataFormat(),
      this.names(),
      this.loadedChildren(),
    ),
  );

  /**
   * The cascade of `checkbox` mode: checking a manager checks the whole team, and a manager is
   * checked or mixed from the team. Disabled and read-only people are locked.
   */
  private readonly checkedTree = new AndesCheckedTree<
    OrgChartRecord<T>,
    AndesOrgChartKey
  >({
    nodes: () => this.tree().roots,
    childrenOf: (record) => record.children,
    keyOf: (record) => record.key,
    isDisabled: (record) => record.disabled || record.readonly,
  });

  protected readonly resolvedDirection = computed<'ltr' | 'rtl'>(() => {
    const direction = this.direction();
    return direction === 'auto' ? this.domDirection() : direction;
  });

  protected readonly motion = computed(
    () => this.animated() && !this.reducedMotion(),
  );

  /** The card edge facing the reports, where the toggle sits. */
  protected readonly childrenSide = computed(() => {
    const reversed = this.reversed();
    if (this.orientation() === 'vertical') {
      return reversed ? 'top' : 'bottom';
    }
    const towardsRight = (this.resolvedDirection() === 'rtl') === reversed;
    return towardsRight ? 'right' : 'left';
  });

  protected readonly searching = computed(() => this.search().trim() !== '');

  /** `single` or `multiple`: cards announce `aria-selected`. */
  protected readonly selectable = computed(
    () =>
      this.selectionMode() === 'single' || this.selectionMode() === 'multiple',
  );
  /** `checkbox`: cards announce `aria-checked` and show a checkbox. */
  protected readonly checkable = computed(
    () => this.selectionMode() === 'checkbox',
  );

  protected readonly selectedSet = computed(() =>
    this.checkable()
      ? this.checkedTree.checked()
      : new Set<AndesOrgChartKey>(this.selected()),
  );

  /**
   * `checkbox` mode: the managers with some, but not all, reports checked (shown and announced
   * as mixed). Empty in the other modes.
   */
  readonly partiallySelected = computed<readonly AndesOrgChartKey[]>(() =>
    this.checkable() ? [...this.checkedTree.halfChecked()] : [],
  );

  /** Keys of every node that matches the search, in reading order. */
  readonly matchedKeys = computed<readonly AndesOrgChartKey[]>(() => {
    const query = this.search().trim();
    if (!query) {
      return [];
    }
    const custom = this.searchFn();
    const needle = normalizeText(query);
    const keys: AndesOrgChartKey[] = [];
    for (const record of this.inOrder()) {
      const hit = custom
        ? custom(record.data, query)
        : this.searchText(record).includes(needle);
      if (hit) {
        keys.push(record.key);
      }
    }
    return keys;
  });

  /** Name and title as typed into the search box would be compared: normalized once per person. */
  private readonly searchTexts = new WeakMap<OrgChartRecord<T>, string>();

  private searchText(record: OrgChartRecord<T>): string {
    let text = this.searchTexts.get(record);
    if (text === undefined) {
      text = `${normalizeText(record.name)}\u0000${normalizeText(record.title)}`;
      this.searchTexts.set(record, text);
    }
    return text;
  }

  private readonly matchedSet = computed(
    () => new Set<AndesOrgChartKey>(this.matchedKeys()),
  );

  /** Matches and all their managers. */
  private readonly pathSet = computed(() => {
    const byKey = this.tree().byKey;
    const path = new Set<AndesOrgChartKey>();
    for (const key of this.matchedKeys()) {
      for (
        let record = byKey.get(key) ?? null;
        record && !path.has(record.key);
        record = record.parent
      ) {
        path.add(record.key);
      }
    }
    return path;
  });

  /** Every known record, depth first in data order. */
  private readonly inOrder = computed(() => {
    const out: OrgChartRecord<T>[] = [];
    const stack = [...this.tree().roots].reverse();
    while (stack.length) {
      const record = stack.pop() as OrgChartRecord<T>;
      out.push(record);
      for (let index = record.children.length - 1; index >= 0; index--) {
        stack.push(record.children[index]);
      }
    }
    return out;
  });

  /** Each record's index among its siblings, for `aria-posinset`. */
  private readonly siblingIndex = computed(() => {
    const index = new Map<AndesOrgChartKey, number>();
    const list = (records: readonly OrgChartRecord<T>[]) =>
      records.forEach((record, position) => index.set(record.key, position));
    list(this.tree().roots);
    for (const record of this.inOrder()) {
      list(record.children);
    }
    return index;
  });

  private isLazy(record: OrgChartRecord<T>): boolean {
    return (
      !!this.loadChildren() &&
      !record.leaf &&
      record.children.length === 0 &&
      !this.loadedChildren().has(record.key)
    );
  }

  private isExpandable(record: OrgChartRecord<T>): boolean {
    return record.children.length > 0 || this.isLazy(record);
  }

  private readonly sizeOf = computed(() => {
    const size = this.nodeSize();
    return typeof size === 'function' ? (data: T) => size(data) : () => size;
  });

  /** The records currently on screen and the layout input built from them. */
  private readonly visible = computed(() => {
    const expanded = this.expandedState();
    const everything = !this.collapsible();
    const size = this.sizeOf();
    const records: OrgChartRecord<T>[] = [];
    const toNode = (record: OrgChartRecord<T>): AndesOrgChartLayoutNode => {
      records.push(record);
      const box = size(record.data);
      const children: AndesOrgChartLayoutNode[] = [];
      const node: AndesOrgChartLayoutNode = {
        key: record.key,
        width: box.width,
        height: box.height,
        assistant: record.assistant,
        leaf: !this.isExpandable(record),
        children,
      };
      if (everything || expanded.has(record.key)) {
        for (const child of record.children) {
          children.push(toNode(child));
        }
      }
      return node;
    };
    const roots = this.tree().roots.map(toNode);
    return { roots, records };
  });

  protected readonly layout = computed(() =>
    andesOrgChartLayout(this.visible().roots, {
      orientation: this.orientation(),
      reversed: this.reversed(),
      rtl: this.resolvedDirection() === 'rtl',
      nodeGap: this.nodeGap(),
      subtreeGap: this.subtreeGap(),
      levelGap: this.levelGap(),
      leafLayout: this.leafLayout(),
      leafLayoutMinCount: this.leafLayoutMinCount(),
    }),
  );

  /** Size of the canvas the cards are drawn on, padding included. */
  protected readonly canvasWidth = computed(
    () => this.layout().width + CANVAS_PADDING * 2,
  );
  protected readonly canvasHeight = computed(
    () => this.layout().height + CANVAS_PADDING * 2,
  );

  protected readonly isEmpty = computed(() => this.tree().roots.length === 0);

  private contextFor(record: OrgChartRecord<T>): AndesOrgChartNodeContext<T> {
    const colors = this.levelColors();
    const key = record.key;
    return {
      $implicit: record.data,
      data: record.data,
      key,
      level: record.depth + 1,
      name: record.name,
      title: record.title,
      avatar: record.avatar,
      initials: andesOrgChartInitials(record.name),
      color:
        record.color ??
        (colors.length ? colors[record.depth % colors.length] : null),
      childCount: record.children.length,
      descendantCount: record.descendants,
      expanded:
        (!this.collapsible() && record.children.length > 0) ||
        this.expandedState().has(key),
      expandable: this.isExpandable(record),
      loading: this.loadingKeys().has(key),
      selected: this.selectedSet().has(key),
      matched: this.matchedSet().has(key),
      highlighted: this.pathSet().has(key),
      disabled: record.disabled,
      readonly: record.readonly,
      assistant: record.assistant,
      toggle: () => this.toggle(key),
      select: () => this.toggleSelection(key),
    };
  }

  // ------------------------------------------------------------------ windowing

  /** Where each card and connector of the layout is, as flat arrays. */
  private readonly placement = computed<Placement<T>>(() => {
    const layout = this.layout();
    const records = this.visible().records;
    const count = records.length;
    const indexOf = new Map<AndesOrgChartKey, number>();
    const cardLeft = new Float64Array(count);
    const cardTop = new Float64Array(count);
    const cardRight = new Float64Array(count);
    const cardBottom = new Float64Array(count);
    for (let index = 0; index < count; index++) {
      const key = records[index].key;
      const box = layout.boxes.get(key) as AndesOrgChartBox;
      indexOf.set(key, index);
      cardLeft[index] = box.x + CANVAS_PADDING;
      cardTop[index] = box.y + CANVAS_PADDING;
      cardRight[index] = box.x + CANVAS_PADDING + box.width;
      cardBottom[index] = box.y + CANVAS_PADDING + box.height;
    }
    const links = layout.links;
    const linkLeft = new Float64Array(links.length);
    const linkTop = new Float64Array(links.length);
    const linkRight = new Float64Array(links.length);
    const linkBottom = new Float64Array(links.length);
    const exits = new Map<AndesOrgChartKey, { x: number; y: number }>();
    for (let index = 0; index < links.length; index++) {
      const link = links[index];
      let left = Infinity;
      let top = Infinity;
      let right = -Infinity;
      let bottom = -Infinity;
      for (const point of link.points) {
        left = Math.min(left, point.x);
        top = Math.min(top, point.y);
        right = Math.max(right, point.x);
        bottom = Math.max(bottom, point.y);
      }
      linkLeft[index] = left + CANVAS_PADDING;
      linkTop[index] = top + CANVAS_PADDING;
      linkRight[index] = right + CANVAS_PADDING;
      linkBottom[index] = bottom + CANVAS_PADDING;
      if (!exits.has(link.from)) {
        exits.set(link.from, link.points[0]);
      }
    }
    return {
      records,
      indexOf,
      cardLeft,
      cardTop,
      cardRight,
      cardBottom,
      linkLeft,
      linkTop,
      linkRight,
      linkBottom,
      exits,
    };
  });

  /** Whether the chart is large enough to render only what is near the viewport. */
  protected readonly windowing = computed(
    () => this.visible().records.length > this.virtualizeAbove(),
  );

  /**
   * The cards to render: the ones in the render area, and the card that holds the tab stop (it
   * is where keyboard focus lives, so it stays in the page however far the view moves).
   */
  private readonly renderedIndices = computed<readonly number[]>(() => {
    const placement = this.placement();
    const count = placement.records.length;
    const area = this.activeArea();
    if (!area) {
      return Array.from({ length: count }, (_, index) => index);
    }
    const tabbable = this.navigation.tabbableKey();
    const pinned =
      tabbable === null ? -1 : (placement.indexOf.get(tabbable) ?? -1);
    const { cardLeft, cardTop, cardRight, cardBottom } = placement;
    const left = area.left - CARD_OVERHANG;
    const top = area.top - CARD_OVERHANG;
    const right = area.right + CARD_OVERHANG;
    const bottom = area.bottom + CARD_OVERHANG;
    const indices: number[] = [];
    for (let index = 0; index < count; index++) {
      if (
        index === pinned ||
        (cardRight[index] >= left &&
          cardLeft[index] <= right &&
          cardBottom[index] >= top &&
          cardTop[index] <= bottom)
      ) {
        indices.push(index);
      }
    }
    return indices;
  });

  /** The part of the canvas the viewport shows right now, in canvas pixels. */
  private seenArea(): RenderArea {
    const measured = this.viewportSize.measured();
    const size = measured ? this.viewportSize.size() : FALLBACK_VIEWPORT;
    const { x, y, scale } = this.view();
    return {
      left: -x / scale,
      top: -y / scale,
      right: (size.width - x) / scale,
      bottom: (size.height - y) / scale,
    };
  }

  /** The seen area with the margin of cards kept rendered around it. */
  private paddedArea(seen: RenderArea): RenderArea {
    const marginX = Math.max(
      (seen.right - seen.left) * WINDOW_MARGIN,
      MIN_WINDOW_MARGIN,
    );
    const marginY = Math.max(
      (seen.bottom - seen.top) * WINDOW_MARGIN,
      MIN_WINDOW_MARGIN,
    );
    return {
      left: seen.left - marginX,
      top: seen.top - marginY,
      right: seen.right + marginX,
      bottom: seen.bottom + marginY,
    };
  }

  /** The area to render, `null` when the whole chart is. */
  private readonly activeArea = computed<RenderArea | null>(() => {
    if (!this.windowing()) {
      return null;
    }
    // Before the first sync (the effect that keeps it runs with the first change detection)
    // the area around the starting view stands in, so a large chart never renders in full.
    return (
      this.renderArea() ?? untracked(() => this.paddedArea(this.seenArea()))
    );
  });

  /**
   * Keeps the render area around the viewport. The area is only rebuilt when the viewport
   * leaves it (or it has grown far past what is needed, after zooming in), so most pan frames
   * change nothing; `grow` keeps the area the move starts from too, for moves that animate.
   */
  private syncRenderArea(grow = false): void {
    if (!this.windowing()) {
      if (this.renderArea() !== null) {
        this.renderArea.set(null);
      }
      return;
    }
    const seen = this.seenArea();
    const area = this.renderArea();
    if (
      area &&
      area.left <= seen.left &&
      area.top <= seen.top &&
      area.right >= seen.right &&
      area.bottom >= seen.bottom &&
      (area.right - area.left) * (area.bottom - area.top) <=
        (seen.right - seen.left) * (seen.bottom - seen.top) * MAX_WINDOW_SLACK
    ) {
      return;
    }
    let next = this.paddedArea(seen);
    if (grow && area) {
      const hull = {
        left: Math.min(area.left, next.left),
        top: Math.min(area.top, next.top),
        right: Math.max(area.right, next.right),
        bottom: Math.max(area.bottom, next.bottom),
      };
      if (
        (hull.right - hull.left) * (hull.bottom - hull.top) <=
        (next.right - next.left) * (next.bottom - next.top) * 3
      ) {
        next = hull;
      }
    }
    this.renderArea.set(next);
  }

  /**
   * The cards as the template renders them: only the ones near the viewport in a large chart,
   * each with the state it shows. Nothing here runs while the view pans inside the render area.
   */
  protected readonly nodes = computed<readonly NodeView<T>[]>(() => {
    const layout = this.layout();
    const placement = this.placement();
    const nodeClass = this.nodeClass();
    const countMode = this.toggleCount();
    const collapsible = this.collapsible();
    const checkable = this.checkable();
    const half = this.checkedTree.halfChecked();
    const roots = this.tree().roots;
    const position = this.siblingIndex();
    const entering = this.enteringKeys();
    const enterClass = entering ? 'andes-org-chart--entering' : '';
    const views: NodeView<T>[] = [];
    for (const index of this.renderedIndices()) {
      const record = placement.records[index];
      const box = layout.boxes.get(record.key) as AndesOrgChartBox;
      const parent = record.parent
        ? (layout.boxes.get(record.parent.key) ?? box)
        : box;
      const context = this.contextFor(record);
      const siblings = record.parent?.children ?? roots;
      const exit = placement.exits.get(record.key);
      views.push({
        key: record.key,
        record,
        parentKey: record.parent?.key ?? null,
        x: box.x + CANVAS_PADDING,
        y: box.y + CANVAS_PADDING,
        width: box.width,
        height: box.height,
        fromX: parent.x + CANVAS_PADDING + (parent.width - box.width) / 2,
        fromY: parent.y + CANVAS_PADDING + (parent.height - box.height) / 2,
        kind: !record.parent ? 'root' : context.expandable ? 'branch' : 'leaf',
        context,
        classes:
          typeof nodeClass === 'function'
            ? (nodeClass(record.data, context) ?? null)
            : nodeClass,
        level: record.depth + 1,
        posInSet: (position.get(record.key) ?? 0) + 1,
        setSize: siblings.length,
        toggleable: collapsible && context.expandable,
        toggleAt: exit ? { x: exit.x - box.x, y: exit.y - box.y } : null,
        checkState: !checkable
          ? 'false'
          : context.selected
            ? 'true'
            : half.has(record.key)
              ? 'mixed'
              : 'false',
        // A team that has not been loaded yet has no count to show, only the icon.
        count:
          countMode === 'none' || this.isLazy(record)
            ? ''
            : String(
                countMode === 'total'
                  ? record.descendants
                  : record.children.length,
              ),
        enterClass: entering?.has(record.key) ? enterClass : '',
      });
    }
    return views;
  });

  private linkClass(info: AndesOrgChartConnectorInfo<T>): string | null {
    const value = this.connectorClass();
    return typeof value === 'function' ? (value(info) ?? null) : value;
  }

  /** The path of each connector, drawn when it first comes near the viewport. */
  private readonly linkPaths = computed(() => {
    this.layout();
    this.connector();
    this.connectorRadius();
    return new Map<number, string>();
  });

  private linkPathAt(index: number, cache: Map<number, string> | null): string {
    const cached = cache?.get(index);
    if (cached !== undefined) {
      return cached;
    }
    const link = this.layout().links[index];
    const d = andesOrgChartLinkPath(
      link.points.map((point) => ({
        x: point.x + CANVAS_PADDING,
        y: point.y + CANVAS_PADDING,
      })),
      link.kind,
      this.connector(),
      this.connectorRadius(),
    );
    cache?.set(index, d);
    return d;
  }

  protected readonly links = computed<readonly LinkView<T>[]>(() => {
    const layout = this.layout();
    const placement = this.placement();
    const byKey = this.tree().byKey;
    const path = this.pathSet();
    const cache = this.linkPaths();
    const entering = this.enteringKeys();
    const area = this.activeArea();
    const views: LinkView<T>[] = [];
    for (let index = 0; index < layout.links.length; index++) {
      if (
        area &&
        (placement.linkRight[index] < area.left ||
          placement.linkLeft[index] > area.right ||
          placement.linkBottom[index] < area.top ||
          placement.linkTop[index] > area.bottom)
      ) {
        continue;
      }
      const link = layout.links[index];
      const d = this.linkPathAt(index, cache);
      const fromData = byKey.get(link.from)?.data as T;
      const toData = byKey.get(link.to)?.data as T;
      const highlighted = path.has(link.from) && path.has(link.to);
      const info = {
        from: link.from,
        to: link.to,
        kind: link.kind,
        fromData,
        toData,
      };
      views.push({
        id: `${String(link.from)}\u0000${String(link.to)}`,
        d,
        kind: link.kind,
        highlighted,
        classes: this.linkClass(info),
        label: null,
        context: { ...info, $implicit: d, d, highlighted },
        enterClass: entering?.has(link.to) ? 'andes-org-chart--entering' : '',
      });
    }
    return views;
  });

  /** Every dotted-line link whose both cards are placed, with its geometry. */
  private readonly secondaryAll = computed(() => {
    const layout = this.layout();
    const byKey = this.tree().byKey;
    const pad = (box: AndesOrgChartBox): AndesOrgChartBox => ({
      ...box,
      x: box.x + CANVAS_PADDING,
      y: box.y + CANVAS_PADDING,
    });
    const items: {
      readonly link: AndesOrgChartSecondaryLink;
      readonly d: string;
      readonly area: RenderArea;
      readonly info: AndesOrgChartConnectorInfo<T>;
    }[] = [];
    for (const link of this.secondaryLinks()) {
      const from = layout.boxes.get(link.from);
      const to = layout.boxes.get(link.to);
      if (!from || !to || link.from === link.to) {
        continue;
      }
      const a = pad(from);
      const b = pad(to);
      items.push({
        link,
        d: andesOrgChartSecondaryPath(a, b),
        area: {
          left: Math.min(a.x, b.x),
          top: Math.min(a.y, b.y),
          right: Math.max(a.x + a.width, b.x + b.width),
          bottom: Math.max(a.y + a.height, b.y + b.height),
        },
        info: {
          from: link.from,
          to: link.to,
          kind: 'secondary' as const,
          fromData: byKey.get(link.from)?.data as T,
          toData: byKey.get(link.to)?.data as T,
        },
      });
    }
    return items;
  });

  private secondaryView(
    item: ReturnType<typeof this.secondaryAll>[number],
  ): LinkView<T> {
    const { link, d, info } = item;
    const classes = [this.linkClass(info), link.class]
      .filter(Boolean)
      .join(' ');
    return {
      id: `${String(link.from)}\u0001${String(link.to)}`,
      d,
      kind: 'secondary',
      highlighted: false,
      classes: classes || null,
      label: link.label ?? null,
      context: { ...info, $implicit: d, d, highlighted: false },
      enterClass: this.enteringKeys() ? 'andes-org-chart--entering' : '',
    };
  }

  protected readonly secondaryViews = computed<readonly LinkView<T>[]>(() => {
    const area = this.activeArea();
    return this.secondaryAll()
      .filter(
        ({ area: box }) =>
          !area ||
          (box.right >= area.left &&
            box.left <= area.right &&
            box.bottom >= area.top &&
            box.top <= area.bottom),
      )
      .map((item) => this.secondaryView(item));
  });

  /**
   * The transform of the canvas. Read without tracking on purpose: pans and zooms write it to
   * the element themselves (see {@link paintView}), so the template never re-runs for a frame
   * and this only seeds the element the first time it is created.
   */
  protected canvasTransform(): string {
    const { x, y, scale } = untracked(this.view);
    return `translate(${x}px, ${y}px) scale(${scale})`;
  }

  protected smoothAttr(): '' | null {
    return this.smoothNow ? '' : null;
  }

  /** Zoom as a whole percentage, for the controls. */
  protected readonly zoomPercent = computed(
    () => `${Math.round(this.view().scale * 100)}%`,
  );

  protected readonly canZoomIn = computed(
    () => this.view().scale < this.scaleExtent()[1] - 1e-6,
  );
  protected readonly canZoomOut = computed(
    () => this.view().scale > this.scaleExtent()[0] + 1e-6,
  );

  /** The current pan and zoom. */
  readonly viewport = this.view.asReadonly();

  constructor() {
    const navigation = this.navigation;
    navigation.configure({
      orientation: 'vertical',
      scope: 'tree',
      skipDisabled: false,
      expandDisabled: true,
      expandSiblings: true,
    });
    navigation.bindExpanded(this.expandedState);
    navigation.setNodes(() =>
      this.inOrder().map<AndesTreeNavigationNode>((record) => ({
        key: record.key,
        parentKey: record.parent?.key ?? null,
        expandable: this.collapsible() && this.isExpandable(record),
        label: record.name || record.title,
      })),
    );

    effect(() => {
      navigation.configure({ textDirection: this.resolvedDirection() });
    });

    const subscription = navigation.expandedChange.subscribe((change) =>
      this.afterUserToggle(change.key, change.expanded),
    );
    this.destroyRef.onDestroy(() => subscription.unsubscribe());

    // Checkbox mode: the bound keys seed the cascade, and the cascaded keys are written back
    // (also when a lazy team arrives under a checked manager).
    effect(() => {
      if (!this.checkable()) {
        return;
      }
      const keys = this.selected();
      untracked(() => {
        if (!sameKeys(new Set(this.checkedTree.checkedKeys()), keys)) {
          this.checkedTree.setChecked(keys);
        }
      });
    });
    effect(() => {
      if (!this.checkable()) {
        return;
      }
      const keys = this.checkedTree.checkedKeys();
      untracked(() => {
        if (!sameKeys(new Set(keys), this.selected())) {
          this.selected.set(keys);
        }
      });
    });

    // Not collapsible: every team is open, so lazy teams are fetched as soon as they show.
    effect(() => {
      if (this.collapsible()) {
        return;
      }
      const records = this.visible().records;
      untracked(() => {
        for (const record of records) {
          if (this.isLazy(record)) {
            this.load(record);
          }
        }
      });
    });

    // A bound `expanded` value wins over the current state.
    effect(() => {
      const value = this.expanded();
      if (value === undefined || value === this.lastWrittenExpanded) {
        return;
      }
      untracked(() => {
        if (!sameKeys(this.expandedState(), value)) {
          this.expandedState.set(new Set(value));
        }
      });
    });

    // The state is written back so `[(expanded)]` stays in sync.
    effect(() => {
      const state = this.expandedState();
      untracked(() => {
        const current = this.expanded();
        if (current === undefined || !sameKeys(state, current)) {
          const next = [...state];
          this.lastWrittenExpanded = next;
          this.expanded.set(next);
        }
      });
    });

    // New nodes: expanded per `defaultExpandDepth` / `expandAll`; a node that just got its first
    // reports opens so the addition is visible.
    effect(() => {
      const records = this.inOrder();
      untracked(() => this.applyDefaults(records));
    });

    // Search: open the way to every match.
    effect(() => {
      const keys = this.matchedKeys();
      const query = this.search();
      untracked(() => {
        if (query === this.lastSearch) {
          return;
        }
        this.lastSearch = query;
        if (this.searchExpand() && keys.length) {
          this.expandAncestors(keys);
        }
      });
    });

    // Fit (or reset) once there is data and a measured viewport.
    effect(() => {
      const measured = this.viewportSize.measured();
      const empty = this.isEmpty();
      this.layout();
      untracked(() => {
        if (empty) {
          this.fitted = false;
          return;
        }
        if (this.fitted || !measured) {
          return;
        }
        this.fitted = true;
        if (this.fitOnInit()) {
          this.fitView({ animate: false });
        } else {
          this.resetView({ animate: false });
        }
      });
    });

    // After a user expands or collapses a card, the view follows the card so it stays under
    // the pointer: the canvas pans by exactly as much as the card moves, with the same timing.
    effect(() => {
      const layout = this.layout();
      untracked(() => {
        const anchor = this.anchor;
        this.anchor = null;
        this.shownLayout = layout;
        const after = anchor ? layout.boxes.get(anchor.key) : undefined;
        if (!anchor || !after) {
          return;
        }
        const dx = after.x - anchor.box.x;
        const dy = after.y - anchor.box.y;
        if (dx || dy) {
          const view = this.view();
          this.emitView(
            {
              x: view.x - dx * view.scale,
              y: view.y - dy * view.scale,
              scale: view.scale,
            },
            true,
          );
        }
      });
    });

    // A new orientation or direction moves everything: frame the chart again.
    let shape = '';
    effect(() => {
      const next = `${this.orientation()} ${this.reversed()} ${this.resolvedDirection()}`;
      untracked(() => {
        const changed = shape !== '' && shape !== next;
        shape = next;
        if (changed && this.fitted) {
          if (this.fitOnInit()) {
            this.fitView();
          } else {
            this.resetView();
          }
        }
      });
    });

    // The render area follows the viewport size and the chart growing past the threshold.
    effect(() => {
      this.windowing();
      this.viewportSize.size();
      this.viewportSize.measured();
      untracked(() => this.syncRenderArea());
    });

    // Keyboard navigation reached a card that is not rendered: bring its place into view. The
    // card is rendered as soon as it holds the tab stop and takes focus when it appears.
    const reveal = navigation.revealRequested.subscribe(({ key }) =>
      this.revealNode(key),
    );
    this.destroyRef.onDestroy(() => reveal.unsubscribe());

    afterNextRender(() => {
      this.domDirection.set(this.readDirection());
      // Entry animations only after the first paint, so the chart does not bloom on load.
      const later =
        typeof requestAnimationFrame === 'function'
          ? requestAnimationFrame
          : (callback: () => void) => setTimeout(callback, 16);
      later(() => this.ready.set(true));
    });
  }

  private applyDefaults(records: readonly OrgChartRecord<T>[]): void {
    const first = this.seen.size === 0;
    const bound = this.expanded();
    const controlled =
      first && bound !== undefined && bound !== this.lastWrittenExpanded;
    const depth = this.expandAll()
      ? Number.POSITIVE_INFINITY
      : this.defaultExpandDepth();
    const add: AndesOrgChartKey[] = [];
    for (const record of records) {
      const before = this.seen.get(record.key);
      const count = record.children.length;
      if (before === undefined) {
        if (!controlled && record.depth < depth && count > 0) {
          add.push(record.key);
        }
      } else if (before === 0 && count > 0 && !first) {
        add.push(record.key);
      }
      this.seen.set(record.key, count);
    }
    if (add.length) {
      const next = new Set(this.expandedState());
      add.forEach((key) => next.add(key));
      this.expandedState.set(next);
    }
  }

  private readDirection(): 'ltr' | 'rtl' {
    const element = this.host.nativeElement;
    const scoped = element.closest?.('[dir]')?.getAttribute('dir');
    if (scoped === 'rtl' || scoped === 'ltr') {
      return scoped;
    }
    const computedDirection =
      typeof getComputedStyle === 'function'
        ? getComputedStyle(element).direction
        : 'ltr';
    return computedDirection === 'rtl' ? 'rtl' : 'ltr';
  }

  /** Re-reads the text direction from the page, after its `dir` attribute changed. */
  refreshDirection(): void {
    this.domDirection.set(this.readDirection());
  }

  // ------------------------------------------------------------------ expansion

  private recordOf(key: AndesOrgChartKey): OrgChartRecord<T> | undefined {
    return this.tree().byKey.get(key);
  }

  /** Expands a node (fetching its reports with `loadChildren` if needed). */
  expand(key: AndesOrgChartKey): void {
    this.navigation.expand(key);
  }

  /** Collapses a node. */
  collapse(key: AndesOrgChartKey): void {
    this.navigation.collapse(key);
  }

  /** Expands a collapsed node and collapses an expanded one. */
  toggle(key: AndesOrgChartKey): void {
    const record = this.recordOf(key);
    if (!record || record.disabled || !this.collapsible()) {
      return;
    }
    this.navigation.toggle(key);
  }

  /** Expands every manager of a node, so the node becomes visible. */
  expandPath(key: AndesOrgChartKey): void {
    this.expandAncestors([key]);
  }

  /** Expands every node whose reports are known (lazy nodes stay as they are). */
  expandAllNodes(): void {
    const next = new Set(this.expandedState());
    for (const record of this.inOrder()) {
      if (record.children.length) {
        next.add(record.key);
      }
    }
    this.navigation.setExpanded(next);
  }

  /** Collapses every node, leaving only the roots. */
  collapseAll(): void {
    this.navigation.setExpanded([]);
  }

  private expandAncestors(keys: readonly AndesOrgChartKey[]): void {
    const next = new Set(this.expandedState());
    let changed = false;
    for (const key of keys) {
      for (
        let record = this.recordOf(key)?.parent ?? null;
        record;
        record = record.parent
      ) {
        if (!next.has(record.key)) {
          next.add(record.key);
          changed = true;
        }
      }
    }
    if (changed) {
      this.navigation.setExpanded(next);
    }
  }

  /** Keeps a card where it is on screen through the next layout change. */
  private holdInPlace(key: AndesOrgChartKey): void {
    const box = this.shownLayout?.boxes.get(key);
    this.anchor = box ? { key, box } : null;
  }

  private afterUserToggle(key: AndesOrgChartKey, expanded: boolean): void {
    const record = this.recordOf(key);
    if (!record) {
      return;
    }
    this.holdInPlace(key);
    this.nodeExpand.emit({ node: this.contextFor(record), expanded });
    if (expanded && this.isLazy(record)) {
      this.load(record);
    }
  }

  private load(record: OrgChartRecord<T>): void {
    const loader = this.loadChildren();
    const key = record.key;
    if (!loader || this.loadingKeys().has(key)) {
      return;
    }
    this.loadingKeys.update((keys) => new Set(keys).add(key));
    const done = (children: readonly T[]) => {
      this.holdInPlace(key);
      this.loadingKeys.update((keys) => {
        const next = new Set(keys);
        next.delete(key);
        return next;
      });
      this.loadedChildren.update((map) =>
        new Map(map).set(key, [...(children ?? [])]),
      );
    };
    const fail = (error: unknown) => {
      this.loadingKeys.update((keys) => {
        const next = new Set(keys);
        next.delete(key);
        return next;
      });
      const current = this.recordOf(key);
      this.navigation.collapse(key);
      if (current) {
        this.loadError.emit({ node: this.contextFor(current), error });
      }
    };
    let result: ReturnType<AndesOrgChartLoadChildren<T>>;
    try {
      result = loader(record.data);
    } catch (error) {
      fail(error);
      return;
    }
    if (isPromiseLike<readonly T[]>(result)) {
      result.then(done, fail);
    } else if (isSubscribable<readonly T[]>(result)) {
      let settled = false;
      const subscription = result.subscribe({
        next: (value) => {
          if (!settled) {
            settled = true;
            done(value);
          }
        },
        error: (error) => {
          if (!settled) {
            settled = true;
            fail(error);
          }
        },
        complete: () => {
          if (!settled) {
            settled = true;
            done([]);
          }
        },
      });
      this.destroyRef.onDestroy(() => subscription.unsubscribe());
    } else {
      done(result as readonly T[]);
    }
  }

  // ------------------------------------------------------------------ selection

  private canSelect(record: OrgChartRecord<T> | undefined): boolean {
    return (
      !!record &&
      this.selectionMode() !== 'none' &&
      !record.disabled &&
      !record.readonly
    );
  }

  /** Selects a node (replacing the selection in `single` mode). */
  select(key: AndesOrgChartKey): void {
    this.setSelected(key, true);
  }

  /** Deselects a node. */
  deselect(key: AndesOrgChartKey): void {
    this.setSelected(key, false);
  }

  /** Selects an unselected node and deselects a selected one. */
  toggleSelection(key: AndesOrgChartKey): void {
    this.setSelected(key, !this.selectedSet().has(key));
  }

  /** Clears the selection. */
  clearSelection(): void {
    if (this.checkable()) {
      this.checkedTree.clear();
    }
    if (this.selected().length) {
      this.selected.set([]);
    }
  }

  private setSelected(key: AndesOrgChartKey, on: boolean): void {
    const record = this.recordOf(key);
    if (!this.canSelect(record) || this.selectedSet().has(key) === on) {
      return;
    }
    if (this.checkable()) {
      // A mixed manager counts as unchecked here, so toggling it checks the whole team.
      if (on) {
        this.checkedTree.check(key);
      } else {
        this.checkedTree.uncheck(key);
      }
      this.selected.set(this.checkedTree.checkedKeys());
    } else {
      const current = this.selected();
      this.selected.set(
        on
          ? this.selectionMode() === 'single'
            ? [key]
            : [...current, key]
          : current.filter((entry) => entry !== key),
      );
    }
    this.nodeSelect.emit({
      node: this.contextFor(record as OrgChartRecord<T>),
      selected: on,
      selectedKeys: this.selected(),
      partiallySelected: this.partiallySelected(),
    });
  }

  // ------------------------------------------------------------------ view

  /**
   * Moves the view. The canvas is written directly (transform, and whether it eases), so a pan
   * or zoom frame costs one style write; Angular only gets involved when the cards near the
   * viewport change (see {@link syncRenderArea}) or the zoom label does.
   */
  private emitView(next: AndesOrgChartViewport, animate: boolean): void {
    this.smoothNow = animate && this.motion();
    const current = this.view();
    const canvas = this.canvasRef()?.nativeElement;
    if (canvas) {
      this.paintView(canvas, next);
    }
    if (
      current.x === next.x &&
      current.y === next.y &&
      current.scale === next.scale
    ) {
      return;
    }
    this.view.set(next);
    this.syncRenderArea(this.smoothNow);
    this.viewportChange.emit(next);
  }

  private paintView(canvas: HTMLElement, view: AndesOrgChartViewport): void {
    if (this.smoothNow) {
      canvas.setAttribute('data-smooth', '');
    } else {
      canvas.removeAttribute('data-smooth');
    }
    canvas.style.transform = `translate(${view.x}px, ${view.y}px) scale(${view.scale})`;
  }

  /** How many cards the last change added and removed, and which ones are new. */
  private readonly churn = linkedSignal<
    readonly OrgChartRecord<T>[],
    {
      readonly entering: number;
      readonly leaving: number;
      readonly fresh: ReadonlySet<AndesOrgChartKey> | null;
      readonly at: number;
    }
  >({
    source: () => this.visible().records,
    computation: (records, previous) => {
      if (!previous) {
        return { entering: 0, leaving: 0, fresh: null, at: 0 };
      }
      const before = new Set(previous.source.map((record) => record.key));
      const fresh = new Set<AndesOrgChartKey>();
      for (const record of records) {
        if (!before.has(record.key)) {
          fresh.add(record.key);
        }
      }
      return {
        entering: fresh.size,
        leaving: before.size - (records.length - fresh.size),
        fresh,
        at: Date.now(),
      };
    },
  });

  /**
   * The cards and lines that play the grow-from-the-manager animation: the ones a recent change
   * added, unless there are so many that animating them costs more than it shows. A card that
   * only comes into the render area because the view moved never animates.
   */
  private enteringKeys(): ReadonlySet<AndesOrgChartKey> | null {
    const { entering, fresh, at } = this.churn();
    return fresh &&
      this.ready() &&
      this.motion() &&
      entering <= BULK_ANIMATION_LIMIT &&
      Date.now() - at < this.animationDuration() + 200
      ? fresh
      : null;
  }

  private animateLeave(): boolean {
    return (
      this.motion() &&
      this.ready() &&
      this.churn().leaving <= BULK_ANIMATION_LIMIT
    );
  }

  private clampScale(scale: number): number {
    const [low, high] = this.scaleExtent();
    return clamp(scale, Math.min(low, high), Math.max(low, high));
  }

  private viewportBox(): { width: number; height: number } {
    return this.viewportSize.size();
  }

  /** Fits the whole chart in view (never zooming in past 100%). */
  fitView(options: AndesOrgChartViewOptions = {}): void {
    const { width, height } = this.viewportBox();
    const cw = this.canvasWidth();
    const ch = this.canvasHeight();
    if (!width || !height || !cw || !ch) {
      return;
    }
    const scale = this.clampScale(Math.min(width / cw, height / ch, 1));
    this.emitView(
      {
        x: (width - cw * scale) / 2,
        y: (height - ch * scale) / 2,
        scale,
      },
      options.animate ?? true,
    );
  }

  /** Back to 100%, with the first root where the chart starts. */
  resetView(options: AndesOrgChartViewOptions = {}): void {
    const root = this.tree().roots[0];
    const box = root ? this.layout().boxes.get(root.key) : undefined;
    const { width, height } = this.viewportBox();
    if (!box) {
      this.emitView({ x: 0, y: 0, scale: 1 }, options.animate ?? true);
      return;
    }
    const cx = box.x + CANVAS_PADDING + box.width / 2;
    const cy = box.y + CANVAS_PADDING + box.height / 2;
    const side = this.childrenSide();
    const margin = CANVAS_PADDING;
    const half = { w: box.width / 2, h: box.height / 2 };
    const target = {
      x:
        side === 'right'
          ? margin + half.w
          : side === 'left'
            ? width - margin - half.w
            : width / 2,
      y:
        side === 'bottom'
          ? margin + half.h
          : side === 'top'
            ? height - margin - half.h
            : height / 2,
    };
    this.emitView(
      { x: target.x - cx, y: target.y - cy, scale: 1 },
      options.animate ?? true,
    );
  }

  /**
   * Zooms to `scale` (clamped to `scaleExtent`), keeping the given viewport point (default:
   * the viewport center) where it is.
   */
  zoomTo(
    scale: number,
    options: AndesOrgChartViewOptions & {
      readonly origin?: { readonly x: number; readonly y: number };
    } = {},
  ): void {
    const current = this.view();
    const next = this.clampScale(scale);
    const { width, height } = this.viewportBox();
    const origin = options.origin ?? { x: width / 2, y: height / 2 };
    const ratio = next / current.scale;
    this.emitView(
      {
        x: origin.x - (origin.x - current.x) * ratio,
        y: origin.y - (origin.y - current.y) * ratio,
        scale: next,
      },
      options.animate ?? true,
    );
  }

  /** One zoom step in. */
  zoomIn(): void {
    this.zoomTo(this.view().scale * this.zoomStep());
  }

  /** One zoom step out. */
  zoomOut(): void {
    this.zoomTo(this.view().scale / this.zoomStep());
  }

  /** Moves the view by the given number of screen pixels. */
  panBy(dx: number, dy: number, options: AndesOrgChartViewOptions = {}): void {
    const current = this.view();
    this.emitView(
      { ...current, x: current.x + dx, y: current.y + dy },
      options.animate ?? false,
    );
  }

  /**
   * Brings a node into view: expands its managers, then centers it. Optionally selects it and
   * moves keyboard focus to it.
   */
  scrollToNode(
    key: AndesOrgChartKey,
    options: AndesOrgChartScrollOptions = {},
  ): void {
    if (!this.recordOf(key)) {
      return;
    }
    this.expandPath(key);
    const box = this.layout().boxes.get(key);
    if (box) {
      const { width, height } = this.viewportBox();
      const { scale } = this.view();
      this.emitView(
        {
          x: width / 2 - (box.x + CANVAS_PADDING + box.width / 2) * scale,
          y: height / 2 - (box.y + CANVAS_PADDING + box.height / 2) * scale,
          scale,
        },
        options.animate ?? true,
      );
    }
    if (options.select) {
      this.select(key);
    }
    if (options.focus) {
      this.navigation.focusKey(key);
    }
  }

  /** @internal Pans just enough to show a card that received focus. */
  revealNode(key: AndesOrgChartKey): void {
    const box = this.layout().boxes.get(key);
    const { width, height } = this.viewportBox();
    if (!box || !width || !height) {
      return;
    }
    const { x, y, scale } = this.view();
    const margin = 24;
    const left = (box.x + CANVAS_PADDING) * scale + x;
    const top = (box.y + CANVAS_PADDING) * scale + y;
    const right = left + box.width * scale;
    const bottom = top + box.height * scale;
    let dx = 0;
    let dy = 0;
    if (right - left > width - margin * 2 || left < margin) {
      dx = margin - left;
    } else if (right > width - margin) {
      dx = width - margin - right;
    }
    if (bottom - top > height - margin * 2 || top < margin) {
      dy = margin - top;
    } else if (bottom > height - margin) {
      dy = height - margin - bottom;
    }
    if (dx || dy) {
      this.emitView({ x: x + dx, y: y + dy, scale }, true);
    }
  }

  /**
   * The chart as a standalone SVG document: connectors, and each visible card as a rounded
   * box with its name and title. Colors are read from the chart's current styles. A
   * `background` color fills behind the chart; without one the document is transparent.
   */
  exportSvg(background?: string): string {
    const style =
      typeof getComputedStyle === 'function'
        ? getComputedStyle(this.host.nativeElement)
        : null;
    const read = (name: string, fallback: string): string =>
      style?.getPropertyValue(name).trim() || fallback;
    const card = read('--andes-color-card', '#ffffff');
    const border = read('--andes-color-border', '#d4d4d8');
    const text = read('--andes-color-foreground', '#18181b');
    const muted = read('--andes-color-muted-foreground', '#71717a');
    const escape = (value: string): string =>
      value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    const width = this.canvasWidth();
    const height = this.canvasHeight();
    const layout = this.layout();
    const colors = this.levelColors();
    const parts: string[] = [
      `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
      background
        ? `<rect width="${width}" height="${height}" fill="${escape(background)}"/>`
        : '',
      `<g fill="none" stroke="${escape(border)}" stroke-width="1.5">`,
    ];
    // Every card and line of the chart, not only the ones rendered near the viewport.
    for (let index = 0; index < layout.links.length; index++) {
      parts.push(`<path d="${this.linkPathAt(index, null)}"/>`);
    }
    for (const { d } of this.secondaryAll()) {
      parts.push(`<path d="${d}" stroke-dasharray="6 4"/>`);
    }
    parts.push('</g>');
    for (const record of this.visible().records) {
      const box = layout.boxes.get(record.key) as AndesOrgChartBox;
      const accent =
        record.color ??
        (colors.length ? colors[record.depth % colors.length] : null);
      parts.push(
        `<g transform="translate(${box.x + CANVAS_PADDING} ${box.y + CANVAS_PADDING})">`,
        `<rect width="${box.width}" height="${box.height}" rx="8" fill="${escape(card)}" stroke="${escape(border)}"/>`,
        accent
          ? `<rect width="4" height="${box.height}" rx="2" fill="${escape(accent)}"/>`
          : '',
        `<text x="16" y="${box.height / 2 - 4}" font-family="sans-serif" font-size="14" font-weight="600" fill="${escape(text)}">${escape(record.name)}</text>`,
        `<text x="16" y="${box.height / 2 + 14}" font-family="sans-serif" font-size="12" fill="${escape(muted)}">${escape(record.title)}</text>`,
        '</g>',
      );
    }
    parts.push('</svg>');
    return parts.join('');
  }

  /**
   * The chart as a file of the given format: SVG, or a PNG, JPEG or WebP image. It is the chart
   * as it looks on screen (cards, templates, avatars, colors and theme), the whole canvas and
   * not just the part in view. An image is `scale` times the size of the canvas (2 by default).
   * A chart large enough to be windowed (see `virtualizeAbove`) is drawn from its layout instead,
   * as {@link exportSvg} does, so that every card is in the file.
   */
  async exportImage(
    format: AndesOrgChartExportFormat = 'png',
    options: AndesOrgChartExportOptions = {},
  ): Promise<Blob> {
    const host = this.host.nativeElement;
    const canvas = host.querySelector<HTMLElement>(
      '[data-slot="org-chart-canvas"]',
    );
    const width = this.canvasWidth();
    const height = this.canvasHeight();
    const background =
      options.background ??
      (format === 'jpeg'
        ? this.readColor('--andes-color-card', '#ffffff')
        : undefined);
    // The document the user sees; the drawn summary is the fallback of a chart not on screen and
    // of a windowed chart, whose page holds only the cards near the viewport.
    const svg =
      canvas && !this.windowing()
        ? await snapshotSvg(host, canvas, width, height, options.background)
        : this.exportSvg(background);
    return exportBlob(svg, width, height, format, { ...options, background });
  }

  /** Saves the chart as `<filename>.<format>` (`org-chart` by default) through the browser. */
  async download(
    format: AndesOrgChartExportFormat = 'png',
    options: AndesOrgChartExportOptions = {},
  ): Promise<void> {
    const blob = await this.exportImage(format, options);
    saveBlob(
      blob,
      `${options.filename ?? 'org-chart'}.${exportExtension(format)}`,
    );
  }

  private readColor(name: string, fallback: string): string {
    const style =
      typeof getComputedStyle === 'function'
        ? getComputedStyle(this.host.nativeElement)
        : null;
    return style?.getPropertyValue(name).trim() || fallback;
  }

  // ------------------------------------------------------------------ node events

  protected onNodeClick(view: NodeView<T>, event: MouseEvent): void {
    if (this.suppressClick) {
      this.suppressClick = false;
      return;
    }
    const target = event.target as Element | null;
    if (view.record.disabled || target?.closest(INTERACTIVE)) {
      // A control inside a custom card handles its own click.
      return;
    }
    if (this.expandOnClick() && view.context.expandable) {
      this.toggle(view.key);
    }
    this.toggleOrSelect(view.key, event);
    this.nodeClick.emit({ node: view.context, event });
  }

  private toggleOrSelect(key: AndesOrgChartKey, event: Event): void {
    if (this.selectionMode() === 'multiple' || this.checkable()) {
      this.toggleSelection(key);
    } else if (this.selectionMode() === 'single') {
      const multiKey =
        (event as MouseEvent).ctrlKey || (event as MouseEvent).metaKey;
      if (multiKey && this.selectedSet().has(key)) {
        this.deselect(key);
      } else {
        this.select(key);
      }
    }
  }

  protected onNodeDblClick(view: NodeView<T>, event: MouseEvent): void {
    if (!view.record.disabled) {
      this.nodeDblClick.emit({ node: view.context, event });
    }
  }

  protected onNodeContextMenu(view: NodeView<T>, event: MouseEvent): void {
    this.nodeContextMenu.emit({ node: view.context, event });
  }

  protected onNodeHover(
    view: NodeView<T>,
    event: PointerEvent,
    hovered: boolean,
  ): void {
    this.nodeHover.emit({ node: view.context, event, hovered });
  }

  protected onCheckboxClick(view: NodeView<T>, event: MouseEvent): void {
    event.stopPropagation();
    if (this.suppressClick) {
      this.suppressClick = false;
      return;
    }
    if (!view.record.disabled) {
      this.toggleSelection(view.key);
    }
  }

  protected onExport(click: AndesDropdownMenuClickEvent): void {
    void this.download(click.key as AndesOrgChartExportFormat, {
      filename: this.exportFilename(),
    });
  }

  protected onToggleClick(view: NodeView<T>, event: MouseEvent): void {
    event.stopPropagation();
    if (this.suppressClick) {
      this.suppressClick = false;
      return;
    }
    this.toggle(view.key);
  }

  protected onAvatarError(key: AndesOrgChartKey): void {
    this.brokenAvatars.update((keys) => new Set(keys).add(key));
  }

  /** Children shrink back into their manager when they leave. */
  protected onNodeLeave(
    event: AnimationCallbackEvent,
    view: NodeView<T>,
  ): void {
    const element = event.target as HTMLElement;
    if (!this.animateLeave() || this.layout().boxes.has(view.key)) {
      // A card that is still on the chart only left the render area: nothing to animate.
      event.animationComplete();
      return;
    }
    let target: AndesOrgChartBox | undefined;
    for (
      let record = view.record.parent;
      record && !target;
      record = record.parent
    ) {
      target = this.layout().boxes.get(record.key);
    }
    element.style.pointerEvents = 'none';
    if (target) {
      const x = target.x + CANVAS_PADDING + (target.width - view.width) / 2;
      const y = target.y + CANVAS_PADDING + (target.height - view.height) / 2;
      element.style.transform = `translate(${x}px, ${y}px) scale(0.6)`;
    }
    element.style.opacity = '0';
    this.finishAfterTransition(element, () => event.animationComplete());
  }

  /** Connectors fade out when they leave. */
  protected onLinkLeave(
    event: AnimationCallbackEvent,
    to: AndesOrgChartKey,
  ): void {
    const element = event.target as SVGElement;
    if (!this.animateLeave() || this.layout().boxes.has(to)) {
      event.animationComplete();
      return;
    }
    element.style.opacity = '0';
    this.finishAfterTransition(element, () => event.animationComplete());
  }

  private finishAfterTransition(element: Element, finish: () => void): void {
    let done = false;
    const end = () => {
      if (!done) {
        done = true;
        element.removeEventListener('transitionend', end);
        finish();
      }
    };
    element.addEventListener('transitionend', end);
    setTimeout(end, this.animationDuration() + 80);
  }

  // ------------------------------------------------------------------ keyboard

  protected onKeydown(event: KeyboardEvent): void {
    const active = this.navigation.activeKey();
    const target = event.target as HTMLElement | null;
    // Keys typed into a control inside a card belong to that control.
    const card = target?.closest('[data-slot="org-chart-node"]');
    if (card && card !== target) {
      return;
    }
    if (event.altKey && !event.ctrlKey && !event.metaKey && active !== null) {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        this.navigation.expand(active);
        return;
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        this.navigation.collapse(active);
        return;
      }
    }
    if (
      !event.ctrlKey &&
      !event.metaKey &&
      !event.altKey &&
      !this.navigation.isTyping()
    ) {
      if ((event.key === 'Enter' || event.key === ' ') && active !== null) {
        event.preventDefault();
        const record = this.recordOf(active);
        if (record && !record.disabled) {
          if (this.selectionMode() === 'none' && this.isExpandable(record)) {
            this.navigation.toggle(active);
          } else {
            this.toggleOrSelect(active, event);
          }
          this.nodeClick.emit({ node: this.contextFor(record), event });
        }
        return;
      }
      if (this.zoomable() && (event.key === '+' || event.key === '=')) {
        event.preventDefault();
        this.zoomIn();
        return;
      }
      if (this.zoomable() && (event.key === '-' || event.key === '_')) {
        event.preventDefault();
        this.zoomOut();
        return;
      }
      if (event.key === '0') {
        event.preventDefault();
        this.fitView();
        return;
      }
    }
    this.navigation.onKeydown(event);
  }

  // ------------------------------------------------------------------ pointer: pan and zoom

  private readonly pointers = new Map<number, { x: number; y: number }>();
  private pressStart: {
    x: number;
    y: number;
    viewX: number;
    viewY: number;
  } | null = null;
  private pinchStart: { distance: number; scale: number } | null = null;
  private suppressClick = false;

  private localPoint(event: { clientX: number; clientY: number }): {
    x: number;
    y: number;
  } {
    const rect = this.viewportRef()?.nativeElement.getBoundingClientRect();
    return {
      x: event.clientX - (rect?.left ?? 0),
      y: event.clientY - (rect?.top ?? 0),
    };
  }

  protected onPointerDown(event: PointerEvent): void {
    if (event.button !== 0 && event.pointerType === 'mouse') {
      return;
    }
    const target = event.target as Element | null;
    if (
      target?.closest(INTERACTIVE) ||
      target?.closest('[data-slot="org-chart-controls"]') ||
      target?.closest('[data-slot="org-chart-toolbar"]')
    ) {
      return;
    }
    this.suppressClick = false;
    this.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (this.pointers.size === 2 && this.zoomable()) {
      const [a, b] = [...this.pointers.values()];
      this.pinchStart = {
        distance: Math.hypot(b.x - a.x, b.y - a.y) || 1,
        scale: this.view().scale,
      };
      return;
    }
    if (this.pointers.size === 1 && this.pannable()) {
      const { x, y } = this.view();
      this.pressStart = {
        x: event.clientX,
        y: event.clientY,
        viewX: x,
        viewY: y,
      };
    }
  }

  protected onPointerMove(event: PointerEvent): void {
    if (!this.pointers.has(event.pointerId)) {
      return;
    }
    this.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (this.pinchStart && this.pointers.size >= 2) {
      const [a, b] = [...this.pointers.values()];
      const distance = Math.hypot(b.x - a.x, b.y - a.y) || 1;
      this.panning.set(true);
      this.zoomTo(
        (this.pinchStart.scale * distance) / this.pinchStart.distance,
        {
          animate: false,
          origin: this.localPoint({
            clientX: (a.x + b.x) / 2,
            clientY: (a.y + b.y) / 2,
          }),
        },
      );
      return;
    }
    const start = this.pressStart;
    if (!start) {
      return;
    }
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (!this.panning() && Math.hypot(dx, dy) < PAN_THRESHOLD) {
      return;
    }
    if (!this.panning()) {
      this.panning.set(true);
      (event.currentTarget as Element | null)?.setPointerCapture?.(
        event.pointerId,
      );
    }
    this.emitView(
      { x: start.viewX + dx, y: start.viewY + dy, scale: this.view().scale },
      false,
    );
  }

  protected onPointerUp(event: PointerEvent): void {
    this.pointers.delete(event.pointerId);
    if (this.pointers.size < 2) {
      this.pinchStart = null;
    }
    if (this.pointers.size === 0) {
      if (this.panning()) {
        // The click that ends a drag must not select or toggle anything.
        this.suppressClick = true;
        setTimeout(() => (this.suppressClick = false));
      }
      this.panning.set(false);
      this.pressStart = null;
    }
  }

  protected onWheel(event: WheelEvent): void {
    const zoomGesture = event.ctrlKey || event.metaKey;
    if (this.wheel() === 'pan' && !zoomGesture) {
      if (!this.pannable()) {
        return;
      }
      event.preventDefault();
      this.panBy(-event.deltaX, -event.deltaY);
      return;
    }
    if (!this.zoomable()) {
      return;
    }
    event.preventDefault();
    // Line and page deltas (Firefox) are scaled to pixels; pinches send small pixel deltas.
    const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? 400 : 1;
    const delta = clamp(event.deltaY * unit, -120, 120);
    const factor = Math.exp(-delta * (zoomGesture ? 0.01 : 0.0025));
    this.zoomTo(this.view().scale * factor, {
      animate: false,
      origin: this.localPoint(event),
    });
  }
}
