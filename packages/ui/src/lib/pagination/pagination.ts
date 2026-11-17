import { DOCUMENT, NgTemplateOutlet } from '@angular/common';
import {
  afterNextRender,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  Injector,
  input,
  model,
  numberAttribute,
  output,
  signal,
  TemplateRef,
  untracked,
} from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideArrowRight,
  lucideChevronLeft,
  lucideChevronRight,
  lucideChevronsLeft,
  lucideChevronsRight,
  lucideEllipsis,
  lucideLoaderCircle,
} from '@ng-icons/lucide';

import {
  AndesButton,
  type AndesButtonColor,
  type AndesButtonVariant,
} from '../button/button';
import { AndesInput } from '../input/input';
import { AndesSelect } from '../select/select';
import { getAndesPaginationRange } from './pagination-range';

export type { AndesPaginationItem } from './pagination-range';

export type AndesPaginationAlign = 'start' | 'center' | 'end';
/**
 * Control height: `small` 24px, `default` 32px, `large` 40px. `medium` is the same
 * as `default`, for symmetry with the other two names.
 */
export type AndesPaginationSize = 'small' | 'default' | 'medium' | 'large';

/**
 * How the items are drawn. `default` marks the current page with a primary border,
 * `outline` gives every item a border, `ghost` marks the current page with a soft
 * tinted fill and no borders, and `filled` marks it with a solid primary fill.
 */
export type AndesPaginationVariant = 'default' | 'outline' | 'ghost' | 'filled';

/** The corner shape of the items: `default` is a soft rounded square, `pill` is fully round. */
export type AndesPaginationShape = 'default' | 'pill';

/**
 * What the control draws:
 * - `default`: the numbered pages with their jumpers.
 * - `compact`: previous / "Page 2 of 10" / next, without numbered pages.
 * - `table`: the footer of a data table - "Rows per page [10]", the item range
 *   ("1-10 of 100") and the first / previous / next / last buttons.
 */
export type AndesPaginationLayout = 'default' | 'compact' | 'table';

/** Which control an `itemRender` template is being asked to render. */
export type AndesPaginationItemType =
  'page' | 'prev' | 'next' | 'first' | 'last' | 'jump-prev' | 'jump-next';

/** The parts of the control that `classNames` and `styles` can address. */
export type AndesPaginationPart =
  | 'root'
  | 'list'
  | 'item'
  | 'activeItem'
  | 'prev'
  | 'next'
  | 'first'
  | 'last'
  | 'jump'
  | 'options'
  | 'sizeChanger'
  | 'jumper'
  | 'total';

/** What `classNames` and `styles` functions are given to decide with. */
export interface AndesPaginationState {
  current: number;
  pageSize: number;
  total: number;
  totalPages: number;
  size: 'small' | 'default' | 'large';
  variant: AndesPaginationVariant;
  shape: AndesPaginationShape;
  layout: AndesPaginationLayout;
  disabled: boolean;
  loading: boolean;
  simple: boolean;
}

/** One extra class list per part. */
export type AndesPaginationClassNames = Partial<
  Record<AndesPaginationPart, string>
>;

/** One style object per part (custom properties such as `--andes-pagination-gap` work too). */
export type AndesPaginationStyles = Partial<
  Record<AndesPaginationPart, Record<string, string | number>>
>;

/** Context of the default item content, handed to `itemRender` as `originalElement`. */
export interface AndesPaginationOriginalItemContext {
  $implicit: number;
  type: AndesPaginationItemType;
}

/**
 * Context of an `itemRender` template. The template replaces the *content* of the
 * control, never the control itself - the pagination keeps owning the focusable library
 * button (a link with `linkFor`), its click handling, `aria-current`, `aria-label` and
 * `disabled` state, so a custom template can't accidentally drop the accessible semantics.
 */
export interface AndesPaginationItemRenderContext {
  /** The page the control navigates to. */
  $implicit: number;
  page: number;
  type: AndesPaginationItemType;
  /**
   * The default content. Render it with
   * `*ngTemplateOutlet="originalElement; context: { $implicit: page, type }"`.
   */
  originalElement: TemplateRef<AndesPaginationOriginalItemContext>;
}

/** Context of a `showTotal` template. */
export interface AndesPaginationTotalContext {
  /** Total item count. */
  $implicit: number;
  total: number;
  /** 1-indexed `[from, to]` item range of the current page (`[0, 0]` when empty). */
  range: [number, number];
}

/**
 * Plain-text form of `showTotal`: receives the total item count and the 1-indexed
 * `[from, to]` range of the current page and returns the text to show.
 */
export type AndesPaginationShowTotalFn = (
  total: number,
  range: [number, number],
) => string;

/**
 * Context of a `sizeChangerRender` template, which replaces the built-in page-size
 * select with any control (e.g. a segmented control). Call `change(size)` to apply a
 * new page size: it clamps the current page and emits `showSizeChange` and `pageChange`
 * exactly like the built-in control.
 */
export interface AndesPaginationSizeChangerContext {
  /** The current page size. */
  $implicit: number;
  pageSize: number;
  /** The sorted page-size options, including the current size. */
  options: readonly number[];
  disabled: boolean;
  /** The resolved size of the pagination, so the control can match its height. */
  size: 'small' | 'default' | 'large';
  /** Accessible name for the control (`pageSizeLabel`, or `rowsPerPageLabel` in the table layout). */
  label: string;
  /** Suffix shown after each option (`itemsPerPageLabel`). */
  itemsPerPageLabel: string;
  change: (pageSize: number) => void;
}

/** Emitted by `pageChange` whenever the page or the page size changes. */
export interface AndesPaginationChange {
  page: number;
  pageSize: number;
}

/** Emitted by `showSizeChange` when the page size changes. */
export interface AndesPaginationSizeChange {
  current: number;
  pageSize: number;
}

/** Normalized form of the `simple` input. */
export interface AndesPaginationSimpleConfig {
  enabled: boolean;
  readOnly: boolean;
}

/** One control (or text) of the list, in the order it is drawn. */
interface PaginationEntry {
  key: string;
  kind: AndesPaginationItemType | 'ellipsis' | 'simple' | 'status';
  /** The page the control goes to. */
  page: number;
  label: string;
  disabled: boolean;
  current: boolean;
  /** The text of a `status` entry. */
  text: string;
}

function toSimpleConfig(
  value: boolean | string | { readOnly?: boolean } | null | undefined,
): AndesPaginationSimpleConfig {
  if (value !== null && typeof value === 'object') {
    return { enabled: true, readOnly: !!value.readOnly };
  }
  return { enabled: booleanAttribute(value), readOnly: false };
}

function toOptionalBoolean(value: unknown): boolean | undefined {
  return value === undefined || value === null
    ? undefined
    : booleanAttribute(value);
}

function toOptionalNumber(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
}

/**
 * Parses what the user typed into the quick jumper / simple input. Returns `null`
 * for anything that isn't a number, so the caller can ignore it rather than jump
 * somewhere surprising.
 */
function parsePageInput(text: string): number | null {
  const trimmed = text.trim();
  if (!/^-?\d+$/.test(trimmed)) {
    return null;
  }
  return Number.parseInt(trimmed, 10);
}

/** Fills the `{name}` placeholders of a localised label. */
function fill(template: string, values: Record<string, string | number>) {
  let text = template;
  for (const [name, value] of Object.entries(values)) {
    text = text.split(`{${name}}`).join(String(value));
  }
  return text;
}

let nextId = 0;

/** Phone-sized viewports (`xs`, up to 575px wide). */
const RESPONSIVE_QUERY = '(max-width: 575.98px)';

@Component({
  selector: 'andes-pagination',
  viewProviders: [
    provideIcons({
      lucideArrowRight,
      lucideChevronLeft,
      lucideChevronRight,
      lucideChevronsLeft,
      lucideChevronsRight,
      lucideEllipsis,
      lucideLoaderCircle,
    }),
  ],
  imports: [AndesButton, AndesInput, AndesSelect, NgIcon, NgTemplateOutlet],
  templateUrl: './pagination.html',
  styleUrl: './pagination.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AndesPagination {
  /** 1-indexed current page. Two-way bindable: `[(current)]`. */
  readonly current = model(1);

  /** Items per page. Two-way bindable: `[(pageSize)]`. */
  readonly pageSize = model(10);

  /**
   * The page to start on when `current` is not bound (an uncontrolled control). Applied
   * once, when the control is created.
   */
  readonly defaultCurrent = input<number | undefined, unknown>(undefined, {
    transform: toOptionalNumber,
  });

  /** The page size to start with when `pageSize` is not bound. Applied once. */
  readonly defaultPageSize = input<number | undefined, unknown>(undefined, {
    transform: toOptionalNumber,
  });

  /** Total item count. Drives the page count together with `pageSize`. */
  readonly total = input(0, { transform: numberAttribute });

  /**
   * Explicit page count, for when the item count isn't known. Takes precedence over
   * `total`/`pageSize` when provided.
   */
  readonly totalPages = input<number | undefined>(undefined);

  /**
   * Cursor mode, for a source that does not know its total: set it to whether another
   * page follows the current one. The control then draws previous / "Page n" / next,
   * Next is disabled while this is `false`, and `total` and `totalPages` are ignored.
   */
  readonly hasNextPage = input<boolean | undefined, unknown>(undefined, {
    transform: toOptionalBoolean,
  });

  /** Page buttons kept visible on either side of the current page. */
  readonly siblingCount = input(1, { transform: numberAttribute });

  /** Page buttons kept visible at the very start and end of the range. */
  readonly boundaryCount = input(1, { transform: numberAttribute });

  /** Shows one fewer sibling page on each side, and jumpers move 3 pages instead of 5. */
  readonly showLessItems = input(false, { transform: booleanAttribute });

  /**
   * Renders collapsed ranges as buttons that jump 5 (or 3, with `showLessItems`) pages.
   * When `false` they're a purely decorative ellipsis.
   */
  readonly showPrevNextJumpers = input(true, { transform: booleanAttribute });

  /** Adds a native `title` tooltip to every item. */
  readonly showTitle = input(true, { transform: booleanAttribute });

  /** Hides the whole control when there is at most one page. */
  readonly hideOnSinglePage = input(false, { transform: booleanAttribute });

  readonly disabled = input(false, { transform: booleanAttribute });

  /**
   * Marks the control busy while the next page is being fetched: the current page shows
   * a spinner, `aria-busy` is set and page changes are ignored until it is `false` again.
   */
  readonly loading = input(false, { transform: booleanAttribute });

  readonly size = input<AndesPaginationSize>('default');

  /** How the items are drawn: `default`, `outline`, `ghost` or `filled`. */
  readonly variant = input<AndesPaginationVariant>('default');

  /** The corner shape of the items: `default` or `pill`. */
  readonly shape = input<AndesPaginationShape>('default');

  /**
   * The colour that marks the current page, from the library palette. The `default`,
   * `outline` and `ghost` looks take their coloured text from the library button, which keeps
   * 4.5:1 on the dark theme for `primary` only; the `filled` variant works with every colour.
   */
  readonly color = input<AndesButtonColor>('primary');

  /**
   * What the control draws: the numbered pages (`default`), a `compact` previous /
   * "Page 2 of 10" / next, or the `table` footer: "Rows per page [10]", the item range
   * and the first / previous / next / last buttons. The table layout turns on the size
   * changer and the first / last buttons unless `showSizeChanger` / `showFirstLast` say
   * otherwise, and shows "from-to of total" when `showTotal` is not set.
   */
  readonly layout = input<AndesPaginationLayout>('default');

  /** Horizontal alignment of the whole control. */
  readonly align = input<AndesPaginationAlign>('start');

  /**
   * Compact `‹ [current] / total ›` layout. Pass `{ readOnly: true }` to show the
   * current page as text instead of an editable input.
   */
  readonly simple = input<
    AndesPaginationSimpleConfig,
    boolean | string | { readOnly?: boolean } | null | undefined
  >(toSimpleConfig(false), { transform: toSimpleConfig });

  /** Collapses to the small, simple layout on viewports narrower than 576px. */
  readonly responsive = input(false, { transform: booleanAttribute });

  /** Adds the first-page and last-page buttons. On in the `table` layout unless set. */
  readonly showFirstLast = input<boolean | undefined, unknown>(undefined, {
    transform: toOptionalBoolean,
  });

  /**
   * Shows the page-size changer. Left unset, it appears automatically once `total`
   * exceeds `totalBoundaryShowSizeChanger` (and always in the `table` layout), so short
   * lists aren't cluttered with it.
   */
  readonly showSizeChanger = input<boolean | undefined, unknown>(undefined, {
    transform: toOptionalBoolean,
  });

  readonly totalBoundaryShowSizeChanger = input(50, {
    transform: numberAttribute,
  });

  /** Page sizes offered by the size changer. Numeric strings are accepted too. */
  readonly pageSizeOptions = input<readonly (number | string)[]>([
    10, 20, 50, 100,
  ]);

  /**
   * Template that replaces the built-in size changer, e.g. to plug in a segmented
   * control. Context: `AndesPaginationSizeChangerContext`. Visibility still follows
   * `showSizeChanger` / `totalBoundaryShowSizeChanger`.
   */
  readonly sizeChangerRender =
    input<TemplateRef<AndesPaginationSizeChangerContext> | null>(null);

  /** Shows a "Go to [ ]" page input. */
  readonly showQuickJumper = input(false, { transform: booleanAttribute });

  /**
   * Adds a confirm button to the quick jumper: `true` for the default
   * (`jumpToConfirmLabel`), a string for a custom label, or a template for custom
   * content. Without it, the jumper commits on Enter or blur. In editable simple mode
   * (with `showQuickJumper` on) the button confirms the page input instead.
   */
  readonly goButton = input<boolean | string | TemplateRef<void>>(false);

  /** Draws an arrow icon in the go button that `goButton` adds. */
  readonly jumperIcon = input(false, { transform: booleanAttribute });

  /**
   * The "x-y of z items" text: a template (context: `AndesPaginationTotalContext`)
   * or a function `(total, range) => string` for plain text.
   */
  readonly showTotal = input<
    TemplateRef<AndesPaginationTotalContext> | AndesPaginationShowTotalFn | null
  >(null);

  /** Template that replaces the content of page/prev/next/first/last/jumper items. */
  readonly itemRender =
    input<TemplateRef<AndesPaginationItemRenderContext> | null>(null);

  /**
   * Text drawn on the Previous button next to its chevron (or instead of it, with
   * `showNavIcons` off): "Previous". Empty draws the chevron alone.
   */
  readonly prevText = input('');

  /** Text drawn on the Next button next to its chevron: "Next". */
  readonly nextText = input('');

  /** Keeps the chevrons on Previous and Next when `prevText` / `nextText` are set. */
  readonly showNavIcons = input(true, { transform: booleanAttribute });

  /**
   * A function that returns the address of a page, so the items render as links
   * (`<a href>`) that open in a new tab with the usual modifier keys. A plain click
   * still updates the control and emits `pageChange`, so the app can route to the page.
   * Return `null` to leave a page without a link.
   */
  readonly linkFor = input<((page: number) => string | null) | null>(null);

  /** Extra class names for the parts of the control: an object, or a function of its state. */
  readonly classNames = input<
    | AndesPaginationClassNames
    | ((state: AndesPaginationState) => AndesPaginationClassNames)
    | null
  >(null);

  /** Inline styles for the parts of the control: an object, or a function of its state. */
  readonly styles = input<
    | AndesPaginationStyles
    | ((state: AndesPaginationState) => AndesPaginationStyles)
    | null
  >(null);

  // Labels, one input each so every string can be localized.
  readonly ariaLabel = input('Pagination', { alias: 'aria-label' });
  readonly previousLabel = input('Previous page');
  readonly nextLabel = input('Next page');
  readonly firstLabel = input('First page');
  readonly lastLabel = input('Last page');
  /** Prefix of each page button's accessible name: "Page 3". */
  readonly pageLabel = input('Page');
  /** `{count}` is replaced by the jump distance. */
  readonly jumpPrevLabel = input('Previous {count} pages');
  /** `{count}` is replaced by the jump distance. */
  readonly jumpNextLabel = input('Next {count} pages');
  /** Suffix of each size-changer option: "10 / page". */
  readonly itemsPerPageLabel = input('/ page');
  /** Accessible name of the size changer. */
  readonly pageSizeLabel = input('Items per page');
  /** The text before the size changer in the `table` layout: "Rows per page". */
  readonly rowsPerPageLabel = input('Rows per page');
  readonly jumpToLabel = input('Go to');
  readonly jumpToConfirmLabel = input('Go');
  /**
   * Text after the quick jumper's input, for languages that wrap the number
   * ("Go to [ ] page"). Empty by default.
   */
  readonly jumpToSuffixLabel = input('');
  /** Accessible name of the simple-mode page input. */
  readonly currentPageLabel = input('Current page');
  /** The status text: `{page}` and `{pages}`. Drawn by `compact`, announced on every change. */
  readonly statusLabel = input('Page {page} of {pages}');
  /** The item range: `{from}`, `{to}` and `{total}`. Drawn by `table`, announced on every change. */
  readonly rangeLabel = input('{from}-{to} of {total}');

  /** Emits `{ page, pageSize }` whenever either changes through the UI. */
  readonly pageChange = output<AndesPaginationChange>();

  /** Emits `{ current, pageSize }` when the size changer picks a new size. */
  readonly showSizeChange = output<AndesPaginationSizeChange>();

  private readonly isNarrowViewport = signal(false);
  private readonly document = inject(DOCUMENT);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);
  private defaultsApplied = false;

  /** Whether the quick jumper holds text that is not a page number. */
  protected readonly jumperInvalid = signal(false);

  /** What was typed in the quick jumper and not yet committed. */
  protected readonly jumpText = signal('');

  /** What was typed in the simple-mode field; `null` while it shows the current page. */
  protected readonly simpleDraft = signal<string | null>(null);

  private readonly uid = nextId++;
  /** Names the quick jumper's field: the "Go to" text, then the text after it. */
  protected readonly jumpLabelId = `andes-pagination-jump-${this.uid}`;
  protected readonly jumpSuffixId = `andes-pagination-jump-suffix-${this.uid}`;

  constructor() {
    const view = this.document.defaultView;
    if (view && typeof view.matchMedia === 'function') {
      const query = view.matchMedia(RESPONSIVE_QUERY);
      this.isNarrowViewport.set(query.matches);
      const listener = (event: MediaQueryListEvent) =>
        this.isNarrowViewport.set(event.matches);
      query.addEventListener('change', listener);
      inject(DestroyRef).onDestroy(() =>
        query.removeEventListener('change', listener),
      );
    }

    effect(() => {
      const loading = this.loading();
      const total = Math.max(0, Math.trunc(this.total()) || 0);
      const pages = this.totalPages();
      untracked(() => {
        if (!loading) {
          this.settledTotal.set(total);
          this.settledTotalPages.set(pages);
        }
      });
    });

    // Every control but the current page is disabled while loading: if one of them held
    // focus, hand it to the current page so keyboard users are not dropped on the page body.
    effect(() => {
      if (this.loading()) {
        untracked(() => this.restoreFocusAfterRender());
      }
    });

    effect(() => {
      const startPage = this.defaultCurrent();
      const startSize = this.defaultPageSize();
      untracked(() => {
        if (this.defaultsApplied) {
          return;
        }
        this.defaultsApplied = true;
        if (startSize !== undefined) {
          this.pageSize.set(startSize);
        }
        if (startPage !== undefined) {
          this.current.set(startPage);
        }
      });
    });
  }

  protected readonly resolvedPageSize = computed(() =>
    Math.max(1, Math.trunc(Number(this.pageSize())) || 1),
  );

  protected readonly isCursor = computed(
    () => this.hasNextPage() !== undefined,
  );

  /** The total and the page count as they were when the control last settled. */
  private readonly settledTotal = signal(0);
  private readonly settledTotalPages = signal<number | undefined>(undefined);

  /**
   * The total. While the control loads it keeps the last one it settled on, so a source
   * that empties its total during a fetch does not make the range and the pages vanish.
   */
  protected readonly resolvedTotal = computed(() => {
    if (this.isCursor()) {
      return 0;
    }
    const total = Math.max(0, Math.trunc(this.total()) || 0);
    return this.loading() && total === 0 ? this.settledTotal() : total;
  });

  /** The current page as asked for, before it is held to the page count. */
  private readonly requestedPage = computed(() =>
    Math.max(1, Math.trunc(Number(this.current())) || 1),
  );

  /**
   * `0` when there is nothing to paginate (`total` of 0 and no `totalPages`). In cursor
   * mode, the pages known so far: the current one, plus the next when there is one.
   */
  protected readonly resolvedTotalPages = computed(() => {
    if (this.isCursor()) {
      return this.requestedPage() + (this.hasNextPage() ? 1 : 0);
    }
    const asked = this.totalPages();
    const explicitTotalPages =
      this.loading() && !asked ? this.settledTotalPages() : asked;
    if (explicitTotalPages !== undefined && explicitTotalPages !== null) {
      return Math.max(0, Math.trunc(explicitTotalPages) || 0);
    }
    return Math.ceil(this.resolvedTotal() / this.resolvedPageSize());
  });

  protected readonly isEmpty = computed(() => this.resolvedTotalPages() === 0);

  protected readonly clampedCurrentPage = computed(() =>
    Math.min(this.requestedPage(), Math.max(1, this.resolvedTotalPages())),
  );

  protected readonly isHidden = computed(
    () => this.hideOnSinglePage() && this.resolvedTotalPages() <= 1,
  );

  protected readonly isCollapsed = computed(
    () => this.responsive() && this.isNarrowViewport(),
  );

  protected readonly isSimple = computed(
    () => this.simple().enabled || this.isCollapsed(),
  );

  protected readonly isTable = computed(() => this.layout() === 'table');

  protected readonly isCompact = computed(
    () => this.layout() === 'compact' && !this.isSimple(),
  );

  protected readonly isSmall = computed(
    () => this.size() === 'small' || this.isCollapsed(),
  );

  protected readonly isLarge = computed(
    () => this.size() === 'large' && !this.isCollapsed(),
  );

  protected readonly resolvedSize = computed<'small' | 'default' | 'large'>(
    () => (this.isSmall() ? 'small' : this.isLarge() ? 'large' : 'default'),
  );

  protected readonly controlButtonSize = computed(() => {
    const size = this.resolvedSize();
    return size === 'small' ? 'sm' : size === 'large' ? 'lg' : 'md';
  });

  protected readonly jumpSize = computed(() => (this.showLessItems() ? 3 : 5));

  protected readonly resolvedShowFirstLast = computed(
    () => this.showFirstLast() ?? this.isTable(),
  );

  protected readonly isFirstPage = computed(
    () => this.clampedCurrentPage() <= 1,
  );

  protected readonly isLastPage = computed(
    () => this.clampedCurrentPage() >= this.resolvedTotalPages(),
  );

  protected readonly totalRange = computed<[number, number]>(() => {
    const total = this.resolvedTotal();
    if (total === 0) {
      return [0, 0];
    }
    const from = (this.clampedCurrentPage() - 1) * this.resolvedPageSize() + 1;
    return [
      Math.min(from, total),
      Math.min(from - 1 + this.resolvedPageSize(), total),
    ];
  });

  /** "Page 3 of 10", or "Page 3" in cursor mode. */
  private readonly statusText = computed(() => {
    if (this.isEmpty()) {
      return '';
    }
    return this.isCursor()
      ? `${this.pageLabel()} ${this.clampedCurrentPage()}`
      : fill(this.statusLabel(), {
          page: this.clampedCurrentPage(),
          pages: this.resolvedTotalPages(),
        });
  });

  /** "1-10 of 100". */
  private readonly rangeText = computed(() => {
    const [from, to] = this.totalRange();
    return fill(this.rangeLabel(), {
      from,
      to,
      total: this.resolvedTotal(),
    });
  });

  /** What a screen reader hears after every change: the page, and the item range. */
  protected readonly announcement = computed(() =>
    this.isEmpty() || this.resolvedTotal() === 0
      ? this.statusText()
      : `${this.statusText()}. ${this.rangeText()}`,
  );

  private readonly items = computed(() =>
    this.isEmpty()
      ? []
      : getAndesPaginationRange(
          this.clampedCurrentPage(),
          this.resolvedTotalPages(),
          Math.max(0, this.siblingCount() - (this.showLessItems() ? 1 : 0)),
          this.boundaryCount(),
        ),
  );

  /** Every control and text of the list, in the order they are drawn. */
  protected readonly entries = computed<PaginationEntry[]>(() => {
    const current = this.clampedCurrentPage();
    const last = this.resolvedTotalPages();
    const off = this.disabled();
    const busy = this.loading();
    const entry = (
      key: string,
      kind: PaginationEntry['kind'],
      page: number,
      label: string,
      disabled: boolean,
      isCurrent = false,
      text = '',
    ): PaginationEntry => ({
      key,
      kind,
      page,
      label,
      disabled,
      current: isCurrent,
      text,
    });
    const result: PaginationEntry[] = [];

    if (this.resolvedShowFirstLast()) {
      result.push(
        entry(
          'first',
          'first',
          1,
          this.firstLabel(),
          off || busy || current <= 1,
        ),
      );
    }
    result.push(
      entry(
        'prev',
        'prev',
        current - 1,
        this.previousLabel(),
        off || busy || current <= 1,
      ),
    );

    if (this.isTable()) {
      // The footer says where the page is in its total, so the list is only the buttons.
    } else if (this.isCursor() || this.isCompact()) {
      result.push(
        entry('status', 'status', current, '', false, false, this.statusText()),
      );
    } else if (this.isSimple()) {
      result.push(entry('simple', 'simple', current, '', false));
    } else if (!this.isEmpty()) {
      for (const item of this.items()) {
        if (typeof item === 'number') {
          result.push(
            entry(
              `page-${item}`,
              'page',
              item,
              `${this.pageLabel()} ${item}`,
              // The current page stays focusable while loading: it carries the spinner.
              off || (busy && item !== current),
              item === current,
            ),
          );
        } else if (this.showPrevNextJumpers()) {
          result.push(
            entry(
              item,
              item === 'start-ellipsis' ? 'jump-prev' : 'jump-next',
              this.jumpTarget(item),
              this.jumpLabel(item),
              off || busy,
            ),
          );
        } else {
          result.push(entry(item, 'ellipsis', 0, '', true));
        }
      }
    }

    result.push(
      entry(
        'next',
        'next',
        current + 1,
        this.nextLabel(),
        off || busy || current >= last,
      ),
    );
    // Without a known total there is no last page to go to.
    if (this.resolvedShowFirstLast() && !this.isCursor()) {
      result.push(
        entry(
          'last',
          'last',
          last,
          this.lastLabel(),
          off || busy || current >= last,
        ),
      );
    }
    return result;
  });

  protected readonly totalTemplate = computed(() => {
    const showTotal = this.showTotal();
    return showTotal instanceof TemplateRef ? showTotal : null;
  });

  protected readonly totalText = computed(() => {
    const showTotal = this.showTotal();
    if (typeof showTotal === 'function') {
      return showTotal(this.resolvedTotal(), this.totalRange());
    }
    // The table footer always says where the page sits in the data.
    if (this.isTable() && showTotal === null) {
      return this.isCursor() ? this.statusText() : this.rangeText();
    }
    return null;
  });

  protected readonly totalContext = computed<AndesPaginationTotalContext>(
    () => ({
      $implicit: this.resolvedTotal(),
      total: this.resolvedTotal(),
      range: this.totalRange(),
    }),
  );

  protected readonly isSizeChangerVisible = computed(
    () =>
      this.showSizeChanger() ??
      (this.isTable() ||
        this.resolvedTotal() > this.totalBoundaryShowSizeChanger()),
  );

  /** `pageSizeOptions`, plus the current size if it isn't one of them, sorted. */
  protected readonly sizeOptions = computed(() => {
    const options = new Set(
      this.pageSizeOptions()
        .map((option) => Math.trunc(Number(option)))
        .filter((option) => option > 0),
    );
    options.add(this.resolvedPageSize());
    return [...options].sort((a, b) => a - b);
  });

  /** The select's options: "10 / page", or the bare number beside a visible "Rows per page". */
  protected readonly sizeSelectOptions = computed(() =>
    this.sizeOptions().map((value) => ({
      value,
      label: this.isTable()
        ? String(value)
        : `${value} ${this.itemsPerPageLabel()}`.trim(),
    })),
  );

  /**
   * Wide enough for the longest option, so the box neither jumps as the size changes nor
   * stays wider than its text ("10" alone does not need the room "100 / page" does).
   */
  protected readonly sizeChangerMinWidth = computed(() => {
    const longest = this.sizeSelectOptions().reduce(
      (most, option) => Math.max(most, option.label.length),
      0,
    );
    return `calc(${longest}ch + 3.25rem)`;
  });

  protected readonly sizeChangerLabel = computed(() =>
    this.isTable() ? this.rowsPerPageLabel() : this.pageSizeLabel(),
  );

  protected readonly sizeChangerContext =
    computed<AndesPaginationSizeChangerContext>(() => ({
      $implicit: this.resolvedPageSize(),
      pageSize: this.resolvedPageSize(),
      options: this.sizeOptions(),
      disabled: this.disabled(),
      size: this.resolvedSize(),
      label: this.sizeChangerLabel(),
      itemsPerPageLabel: this.itemsPerPageLabel(),
      change: this.changePageSize,
    }));

  protected readonly isQuickJumperVisible = computed(
    () => this.showQuickJumper() && !this.isSimple() && !this.isCursor(),
  );

  /** What the simple-mode input shows when it isn't being edited. */
  protected readonly simpleInputValue = computed(() =>
    String(this.isEmpty() ? 0 : this.clampedCurrentPage()),
  );

  protected readonly goButtonTemplate = computed(() => {
    const goButton = this.goButton();
    return goButton instanceof TemplateRef ? goButton : null;
  });

  protected readonly goButtonText = computed(() => {
    const goButton = this.goButton();
    if (goButton instanceof TemplateRef || goButton === false) {
      return null;
    }
    return typeof goButton === 'string' && goButton !== ''
      ? goButton
      : this.jumpToConfirmLabel();
  });

  protected readonly hasGoButton = computed(
    () => this.goButtonTemplate() !== null || this.goButtonText() !== null,
  );

  /** Editable simple mode confirms through the go button when the jumper has one. */
  protected readonly hasSimpleGoButton = computed(
    () =>
      this.isSimple() &&
      !this.simple().readOnly &&
      this.showQuickJumper() &&
      this.hasGoButton(),
  );

  /** The state that `classNames` and `styles` functions decide with. */
  private readonly state = computed<AndesPaginationState>(() => ({
    current: this.clampedCurrentPage(),
    pageSize: this.resolvedPageSize(),
    total: this.resolvedTotal(),
    totalPages: this.resolvedTotalPages(),
    size: this.resolvedSize(),
    variant: this.variant(),
    shape: this.shape(),
    layout: this.layout(),
    disabled: this.disabled(),
    loading: this.loading(),
    simple: this.isSimple(),
  }));

  private readonly partClasses = computed<AndesPaginationClassNames>(() => {
    const value = this.classNames();
    return (typeof value === 'function' ? value(this.state()) : value) ?? {};
  });

  private readonly partStyles = computed<AndesPaginationStyles>(() => {
    const value = this.styles();
    return (typeof value === 'function' ? value(this.state()) : value) ?? {};
  });

  /** The extra classes of one or more parts. */
  protected partClass(...parts: AndesPaginationPart[]): string {
    const classes = this.partClasses();
    return parts
      .map((part) => classes[part])
      .filter(Boolean)
      .join(' ');
  }

  /** The extra inline styles of one or more parts (`null` when there are none). */
  protected partStyle(
    ...parts: AndesPaginationPart[]
  ): Record<string, string | number> | null {
    const styles = this.partStyles();
    const merged = Object.assign({}, ...parts.map((part) => styles[part]));
    return Object.keys(merged).length > 0 ? merged : null;
  }

  /** The parts a control belongs to, for its classes and styles. */
  private entryParts(entry: PaginationEntry): AndesPaginationPart[] {
    const parts: AndesPaginationPart[] = ['item'];
    switch (entry.kind) {
      case 'prev':
      case 'next':
      case 'first':
      case 'last':
        parts.push(entry.kind);
        break;
      case 'jump-prev':
      case 'jump-next':
        parts.push('jump');
        break;
      default:
        break;
    }
    if (entry.current) {
      parts.push('activeItem');
    }
    return parts;
  }

  /** The built-in classes of a control, then the ones `classNames` adds. */
  protected controlClass(entry: PaginationEntry): string {
    const names = ['andes-pagination__item'];
    switch (entry.kind) {
      case 'prev':
      case 'next':
      case 'first':
      case 'last':
        names.push(`andes-pagination__item--${entry.kind}`);
        break;
      case 'jump-prev':
      case 'jump-next':
        names.push('andes-pagination__jumper');
        break;
      default:
        names.push('andes-pagination__page');
        break;
    }
    if (entry.current) {
      names.push('andes-pagination__page--active');
    }
    if (entry.disabled) {
      names.push('andes-pagination__item--disabled');
    }
    if (this.hasText(entry)) {
      names.push('andes-pagination__item--text');
    } else if (entry.kind !== 'page') {
      names.push('andes-pagination__item--icon');
    }
    names.push(this.partClass(...this.entryParts(entry)));
    return names.filter(Boolean).join(' ');
  }

  /**
   * The library button variant of a control: the current page is marked by the variant
   * (an outline in the accent, a soft tint, or a solid fill), the rest are plain, and the
   * `outline` look gives every item a border.
   */
  protected buttonVariant(entry: PaginationEntry): AndesButtonVariant {
    const variant = this.variant();
    if (entry.current) {
      return variant === 'filled'
        ? 'primary'
        : variant === 'ghost'
          ? 'filled'
          : 'outline';
    }
    return variant === 'outline' ? 'outline' : 'ghost';
  }

  protected buttonColor(entry: PaginationEntry): AndesButtonColor | undefined {
    return entry.current ? this.color() : undefined;
  }

  protected readonly buttonShape = computed(() =>
    this.shape() === 'pill' ? 'round' : 'default',
  );

  /** The native tooltip of a control: the page number, or the control's name. */
  protected titleFor(entry: PaginationEntry): string | null {
    if (!this.showTitle()) {
      return null;
    }
    return entry.kind === 'page' ? String(entry.page) : entry.label;
  }

  protected entryStyle(
    entry: PaginationEntry,
  ): Record<string, string | number> | null {
    return this.partStyle(...this.entryParts(entry));
  }

  /** The address of a control's page, when the items are links. */
  protected hrefFor(entry: PaginationEntry): string | null {
    const build = this.linkFor();
    if (!build || entry.disabled || entry.kind === 'ellipsis') {
      return null;
    }
    return build(entry.page);
  }

  /** Whether Previous / Next draw a text beside (or instead of) their chevron. */
  protected hasText(entry: PaginationEntry): boolean {
    return (
      (entry.kind === 'prev' && this.prevText() !== '') ||
      (entry.kind === 'next' && this.nextText() !== '')
    );
  }

  protected itemContext(
    page: number,
    type: AndesPaginationItemType,
    originalElement: TemplateRef<AndesPaginationOriginalItemContext>,
  ): AndesPaginationItemRenderContext {
    return { $implicit: page, page, type, originalElement };
  }

  private jumpTarget(item: 'start-ellipsis' | 'end-ellipsis'): number {
    return item === 'start-ellipsis'
      ? Math.max(1, this.clampedCurrentPage() - this.jumpSize())
      : Math.min(
          this.resolvedTotalPages(),
          this.clampedCurrentPage() + this.jumpSize(),
        );
  }

  private jumpLabel(item: 'start-ellipsis' | 'end-ellipsis'): string {
    const template =
      item === 'start-ellipsis' ? this.jumpPrevLabel() : this.jumpNextLabel();
    return template.replace('{count}', String(this.jumpSize()));
  }

  /** A click on a control. A modifier or middle click on a link is left to the browser. */
  protected onControlClick(event: MouseEvent, entry: PaginationEntry): void {
    if (
      entry.disabled ||
      event.button !== 0 ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }
    event.preventDefault();
    // Previous and Next move from where the control is now, not from where it was drawn.
    const current = this.clampedCurrentPage();
    this.goToPage(
      entry.kind === 'prev'
        ? current - 1
        : entry.kind === 'next'
          ? current + 1
          : entry.page,
    );
  }

  /**
   * Arrow keys, Home and End move focus along the items. Every item stays in the Tab
   * order; the keys are a shortcut for a long row, and follow the reading direction.
   */
  protected onListKeydown(event: KeyboardEvent): void {
    const target = event.target;
    if (
      !(target instanceof HTMLElement) ||
      target instanceof HTMLInputElement
    ) {
      return;
    }
    const controls = Array.from(
      this.host.nativeElement.querySelectorAll<HTMLElement>(
        '.andes-pagination__list [data-slot="button"]:not(:disabled)',
      ),
    );
    const index = controls.indexOf(target);
    if (index === -1) {
      return;
    }
    const rtl =
      this.document.defaultView?.getComputedStyle(this.host.nativeElement)
        .direction === 'rtl';
    let next: number;
    switch (event.key) {
      case 'ArrowRight':
        next = index + (rtl ? -1 : 1);
        break;
      case 'ArrowLeft':
        next = index + (rtl ? 1 : -1);
        break;
      case 'Home':
        next = 0;
        break;
      case 'End':
        next = controls.length - 1;
        break;
      default:
        return;
    }
    event.preventDefault();
    controls[Math.min(Math.max(next, 0), controls.length - 1)]?.focus();
  }

  protected goToPage(page: number): void {
    if (this.disabled() || this.loading() || this.isEmpty()) {
      return;
    }
    const target = Math.min(Math.max(1, page), this.resolvedTotalPages());
    if (target === this.clampedCurrentPage()) {
      return;
    }
    this.restoreFocusAfterRender();
    this.current.set(target);
    this.pageChange.emit({ page: target, pageSize: this.resolvedPageSize() });
  }

  /**
   * Activating Next/Previous can disable that very button, and a jumper can
   * vanish from the new range - either way the browser drops focus to `<body>`.
   * When focus was on such a control, hand it to the current page instead (or,
   * in simple mode, the page input). Focus that was elsewhere is left alone.
   */
  private restoreFocusAfterRender(): void {
    const focused = this.document.activeElement;
    if (
      !(focused instanceof HTMLElement) ||
      !this.host.nativeElement.contains(focused)
    ) {
      return;
    }
    afterNextRender(
      () => {
        if (focused.isConnected && !focused.matches(':disabled')) {
          return;
        }
        const active = this.document.activeElement;
        if (active !== focused && active !== this.document.body && active) {
          return;
        }
        const root = this.host.nativeElement;
        const fallback =
          root.querySelector<HTMLElement>('[aria-current="page"]') ??
          root.querySelector<HTMLElement>(
            '.andes-pagination__simple-input input:not(:disabled)',
          ) ??
          root.querySelector<HTMLElement>(
            '.andes-pagination__list [data-slot="button"]:not(:disabled)',
          );
        fallback?.focus();
      },
      { injector: this.injector },
    );
  }

  /** Stable reference handed to `sizeChangerRender` templates. */
  private readonly changePageSize = (pageSize: number): void =>
    this.onSizeSelected(pageSize);

  protected onSizeSelected(value: unknown): void {
    const size = Math.trunc(Number(value));
    if (
      this.disabled() ||
      this.loading() ||
      !(size > 0) ||
      size === this.resolvedPageSize()
    ) {
      return;
    }

    // Keep the current page unless it no longer exists at the new
    // size, in which case land on the new last page.
    const explicitTotalPages = this.totalPages();
    const newTotalPages =
      this.isCursor() ||
      (explicitTotalPages !== undefined && explicitTotalPages !== null)
        ? this.resolvedTotalPages()
        : Math.ceil(this.resolvedTotal() / size);
    const current = this.clampedCurrentPage();
    const nextCurrent =
      newTotalPages > 0 && current > newTotalPages ? newTotalPages : current;

    this.pageSize.set(size);
    if (nextCurrent !== current) {
      this.current.set(nextCurrent);
    }
    this.showSizeChange.emit({ current: nextCurrent, pageSize: size });
    this.pageChange.emit({ page: nextCurrent, pageSize: size });
  }

  // The quick jumper and the simple-mode field are library inputs: what is typed in them
  // lives in a signal each, and committing a page resets that signal.

  protected onJumperKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.isComposing) {
      event.preventDefault();
      this.commitJumper();
    }
  }

  protected onJumperBlur(): void {
    // With a go button, blurring (e.g. tabbing to that button) must not jump yet.
    if (!this.hasGoButton()) {
      this.commitJumper();
    }
  }

  protected onJumperInput(text: string): void {
    this.jumpText.set(text);
    this.jumperInvalid.set(false);
  }

  /**
   * Jumps to the typed page and clears the field. Text that is not a page number is
   * kept, and the field is marked invalid until the next keystroke.
   */
  protected commitJumper(): void {
    const text = this.jumpText();
    const page = parsePageInput(text);
    if (page === null) {
      this.jumperInvalid.set(text.trim() !== '');
      return;
    }
    this.jumperInvalid.set(false);
    this.jumpText.set('');
    this.goToPage(page);
  }

  protected onSimpleKeydown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'Enter':
        if (!event.isComposing) {
          event.preventDefault();
          this.commitSimple();
        }
        return;
      case 'ArrowUp':
        event.preventDefault();
        this.goToPage(this.clampedCurrentPage() + 1);
        break;
      case 'ArrowDown':
        event.preventDefault();
        this.goToPage(this.clampedCurrentPage() - 1);
        break;
      default:
        return;
    }
    this.simpleDraft.set(null);
  }

  protected onSimpleBlur(): void {
    // With a go button, blurring (e.g. tabbing to that button) must not jump yet.
    if (!this.hasSimpleGoButton()) {
      this.commitSimple();
    }
  }

  /** Jumps to the typed page, or puts the current page back when the text is not a page. */
  protected commitSimple(): void {
    const draft = this.simpleDraft();
    if (draft !== null) {
      const page = parsePageInput(draft);
      if (page !== null) {
        this.goToPage(page);
      }
    }
    this.simpleDraft.set(null);
  }
}
