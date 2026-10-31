import { NgTemplateOutlet } from '@angular/common';
import {
  afterNextRender,
  booleanAttribute,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  linkedSignal,
  model,
  numberAttribute,
  output,
  signal,
  TemplateRef,
  untracked,
  viewChildren,
} from '@angular/core';
import clsx from 'clsx';

import { AndesSelect } from '../select/select';

import {
  addDays,
  addMonths,
  addYears,
  baseViewFor,
  buildCalendarWeeks,
  clampDate,
  clampWeekday,
  coerceDate,
  compareDays,
  comparePeriods,
  endOfMonth,
  endOfPeriod,
  formatDayLabel,
  formatMonthCaption,
  isSameDay,
  isSamePeriod,
  isWithinBounds,
  normalizeRange,
  startOfDecade,
  startOfMonth,
  startOfPeriod,
  startOfYear,
  toDateKey,
  toDateList,
  toOpenDateRange,
  today,
  weekdayNames,
  weekOfYear,
  type AndesCalendarDay,
  type AndesCalendarView,
  type AndesDateRange,
  type AndesOpenDateRange,
  type AndesPickerType,
  type AndesWeekday,
} from './date-utils';

export type {
  AndesCalendarView,
  AndesDateRange,
  AndesOpenDateRange,
  AndesPickerType,
  AndesWeekday,
} from './date-utils';

/**
 * Whether the calendar selects one day, a span of days, or any number of separate
 * days (`multiple`, where each pick toggles a day in or out of the selection).
 */
export type AndesCalendarMode = 'single' | 'range' | 'multiple';

/** One boundary of a range. */
export type AndesCalendarRangeSide = 'start' | 'end';

/**
 * What the navigation header shows in place of the plain caption: `label` (the
 * caption button that climbs to the coarser grid), `dropdown` (a month and a year
 * select), or only one of the two as a select (`dropdown-months`,
 * `dropdown-years`), the other staying plain text.
 */
export type AndesCalendarCaptionLayout =
  'label' | 'dropdown' | 'dropdown-months' | 'dropdown-years';

/**
 * What `AndesCalendar`'s `value` accepts. The tuple and `{ start, end }` shapes are
 * both accepted for a range so a consumer's existing form value does not have to be
 * reshaped; the calendar always writes back `{ start, end }` (with `start` empty only
 * for an open-ended range). `multiple` mode reads and writes a `Date[]`.
 */
export type AndesCalendarValue =
  | Date
  | AndesDateRange
  | AndesOpenDateRange
  | readonly [Date | null, Date | null]
  | readonly Date[]
  | null;

/** Extra information handed to a `dateDisabled` predicate. */
export interface AndesDateDisabledInfo {
  /** The granularity the date is being offered at. */
  readonly type: AndesPickerType;
  /**
   * In `range` mode, while the end is being picked: the start already chosen.
   * Lets a predicate cap a range's length ("at most 7 days from the start").
   */
  readonly from?: Date;
}

/**
 * Per-date veto. The second argument is optional to honour, so a plain
 * `(date) => boolean` keeps working.
 */
export type AndesDateDisabledFn = (
  date: Date,
  info: AndesDateDisabledInfo,
) => boolean;

/** A cell with its rendered state resolved. Day cells and month/quarter/year cells share it. */
export interface AndesCalendarCell extends AndesCalendarDay {
  /** Which grid the cell belongs to. */
  readonly view: AndesCalendarView;
  /** The visible text: the day number, a short month name, `Q1`, or a year. */
  readonly text: string;
  /** Part of the current selection (either endpoint in range mode). */
  readonly selected: boolean;
  /** The range's opening boundary. */
  readonly rangeStart: boolean;
  /** The range's closing boundary. */
  readonly rangeEnd: boolean;
  /** Strictly between a complete range's boundaries. */
  readonly inRange: boolean;
  /** Inside the range the pointer (or keyboard focus) would close if picked now. */
  readonly inPreview: boolean;
  /** The first day of that previewed range (a half band runs from it, inwards). */
  readonly previewStart: boolean;
  /** The last day of that previewed range (a half band runs to it, from inside). */
  readonly previewEnd: boolean;
  /** Today — or, in the period views, the current month/quarter/year. */
  readonly isToday: boolean;
  /** Out of `min`/`max` bounds, rejected by `dateDisabled`, or the whole calendar is disabled. */
  readonly disabled: boolean;
  /** The single cell holding `tabindex="0"` (roving tabindex). */
  readonly active: boolean;
  /** Full localized name, used as the cell's accessible name. */
  readonly label: string;
  readonly classes: string;
}

/** Template context for `cellTemplate`. */
export interface AndesCalendarCellContext {
  /** The cell's date: the day, or the first day of its month/quarter/year. */
  readonly $implicit: Date;
  readonly cell: AndesCalendarCell;
  readonly view: AndesCalendarView;
}

/** Template context for `headerTemplate`. */
export interface AndesCalendarHeaderContext {
  /** First day of the (first) visible month. */
  readonly $implicit: Date;
  readonly view: AndesCalendarView;
  /** Jump the calendar to the month containing `date`. */
  readonly goTo: (date: Date) => void;
  /** Switch the visible grid. */
  readonly setView: (view: AndesCalendarView) => void;
}

/** Emitted by `cellSelect` for every cell the user picks, in any grid. */
export interface AndesCalendarSelectInfo {
  /** The cell's date: the selected period's first day, or the period drilled into. */
  readonly date: Date;
  /**
   * The grid the pick happened in. A pick in a coarser grid than `picker` (a year
   * or month on the way down to a day) navigates rather than selects; `source`
   * tells the two apart.
   */
  readonly source: AndesCalendarView;
}

/** Emitted by `panelChange` whenever the visible period or grid changes. */
export interface AndesCalendarPanelChange {
  readonly date: Date;
  readonly view: AndesCalendarView;
}

interface CellRow {
  readonly key: string;
  /** Week number, when week numbers are shown. */
  readonly weekNumber: number | null;
  readonly cells: readonly (AndesCalendarCell | null)[];
}

/** One `<option>` of a caption dropdown. */
/** One option of a caption select, in the shape `AndesSelect`'s `options` reads. */
interface CaptionOption {
  readonly value: number;
  readonly label: string;
  readonly disabled: boolean;
}

interface MonthPanel {
  readonly key: string;
  /** Position among the visible months, `0` for the first. */
  readonly index: number;
  readonly month: Date;
  readonly caption: string;
  readonly gridLabel: string;
  readonly rows: readonly CellRow[];
}

/**
 * `disabled` accepts a boolean or a per-side `[start, end]` pair. Each entry of a
 * pair goes through `booleanAttribute`, so `['true', '']` reads as `[true, true]`.
 */
export function coerceDisabledSides(
  value: unknown,
): boolean | readonly [boolean, boolean] {
  if (Array.isArray(value)) {
    return [booleanAttribute(value[0]), booleanAttribute(value[1])];
  }
  return booleanAttribute(value);
}

/** A whole number from an attribute or binding, or `undefined` when unset or not a number. */
function optionalWholeNumber(value: unknown): number | undefined {
  if (value == null || value === '') {
    return undefined;
  }
  const parsed = numberAttribute(value, Number.NaN);
  return Number.isFinite(parsed) ? Math.floor(parsed) : undefined;
}

/** Years listed either side of the shown one when nothing else bounds the year select. */
const UNBOUNDED_YEAR_SPAN = 100;

/** The 1st of `month` in `year`, for any year (`new Date` reads 0-99 as 1900-1999). */
function yearMonth(year: number, month: number): Date {
  const date = new Date(2000, month, 1);
  date.setFullYear(year);
  return date;
}

/**
 * Whether `element` is laid out right to left: the nearest `dir` attribute decides (the
 * panel of a date picker carries one), and without one the computed direction does.
 */
function isRtl(element: Element): boolean {
  const dir = element.closest('[dir]')?.getAttribute('dir')?.toLowerCase();
  if (dir === 'rtl' || dir === 'ltr') {
    return dir === 'rtl';
  }
  return (
    element.ownerDocument.defaultView?.getComputedStyle(element).direction ===
    'rtl'
  );
}

/** Left becomes Right and Right Left; any other key is returned as it is. */
function mirrorArrow(key: string): string {
  if (key === 'ArrowLeft') {
    return 'ArrowRight';
  }
  return key === 'ArrowRight' ? 'ArrowLeft' : key;
}

/** Columns and paging steps of the three period grids, in months. */
const PERIOD_GRID: Readonly<
  Record<
    Exclude<AndesCalendarView, 'date'>,
    { readonly columns: number; readonly step: number; readonly page: number }
  >
> = {
  month: { columns: 3, step: 1, page: 12 },
  quarter: { columns: 4, step: 3, page: 12 },
  year: { columns: 3, step: 12, page: 120 },
};

/** The grid one level up, reached by clicking the caption. */
/** How coarse each grid is; a `panelView` finer than the picker's own grid is ignored. */
const VIEW_RANK: Readonly<Record<AndesCalendarView, number>> = {
  date: 0,
  month: 1,
  quarter: 1,
  year: 2,
};

/** Whether `view` can be shown for `picker`. */
function isViewReachable(
  view: AndesCalendarView,
  picker: AndesPickerType,
): boolean {
  const base = baseViewFor(picker);
  if (view === 'quarter') {
    return base === 'quarter';
  }
  if (base === 'quarter' && view === 'month') {
    return false;
  }
  return VIEW_RANK[view] >= VIEW_RANK[base];
}

const PARENT_VIEW: Readonly<
  Record<AndesCalendarView, AndesCalendarView | null>
> = {
  date: 'month',
  month: 'year',
  quarter: 'year',
  year: null,
};

/**
 * A calendar: the date-selection surface, with no overlay of its own.
 *
 * `AndesDatePicker` composes this inside a popover, but it is exported on its own
 * because an always-visible calendar (a booking page, a dashboard date filter, a
 * full-page event calendar via `fullscreen` + `cellTemplate`) is a legitimate use
 * that should not have to fight a popover.
 *
 * ## Grids
 *
 * `picker` sets what is selected — a day, a week, a month, a quarter or a year —
 * and which grid opens. The caption is a button that climbs to the coarser grid
 * (days → months → years), and picking a cell in a coarser grid than `picker`
 * drills back down instead of selecting.
 *
 * ## Accessibility
 *
 * Every grid follows the WAI-ARIA date-picker-dialog pattern: `role="grid"` with
 * `role="row"` rows, and each cell is a `<button role="gridcell">`. Putting the role
 * on the button — rather than wrapping a button in a separate `role="gridcell"`
 * element — is deliberate: `aria-selected`, `aria-disabled` and
 * `aria-current="date"` then live on the element that is actually focusable and
 * clickable, instead of on a non-interactive wrapper a screen reader never lands on.
 *
 * Out-of-range cells carry `aria-disabled` rather than the native `disabled`
 * attribute, because a natively disabled button is unfocusable and would punch
 * holes in arrow-key navigation across the grid.
 *
 * ## Dates
 *
 * Every date in and out of this component is a *local* midnight; see `date-utils.ts`
 * for why that invariant matters and how the arithmetic avoids the usual
 * leap-year/month-length/timezone traps.
 */
@Component({
  selector: 'andes-calendar',
  imports: [AndesSelect, NgTemplateOutlet],
  templateUrl: './calendar.html',
  styleUrl: './calendar.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'data-slot': 'calendar',
    '[attr.data-mode]': 'mode()',
    '[attr.data-picker]': 'picker()',
    '[attr.data-view]': 'view()',
    '[attr.data-disabled]': 'isDisabled() || null',
    '[attr.data-fullscreen]': 'fullscreen() || null',
  },
})
export class AndesCalendar {
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly changeDetectorRef = inject(ChangeDetectorRef);

  /**
   * One day, a span of days, or (`multiple`) any number of separate days: in
   * `multiple` mode each pick toggles its day in or out and `value` is a `Date[]`,
   * kept in chronological order.
   */
  readonly mode = input<AndesCalendarMode>('single');

  /**
   * The granularity selected. The value written back is always the first day of
   * the chosen period (the Monday/Sunday of a week, the 1st of a month, January
   * 1st of a year).
   */
  readonly picker = input<AndesPickerType>('date');

  /**
   * The current selection. A `Date` in `single` mode; `{ start, end }` (or a
   * `[start, end]` tuple, which is accepted and normalized) in `range` mode, where
   * `start` may be empty for an open-ended range; a `Date[]` in `multiple` mode.
   */
  readonly value = model<AndesCalendarValue>(null);

  /** Earliest selectable day, inclusive. */
  readonly min = input<Date | null, unknown>(null, { transform: coerceDate });

  /** Latest selectable day, inclusive. */
  readonly max = input<Date | null, unknown>(null, { transform: coerceDate });

  /**
   * BCP 47 tag driving month and weekday names via `Intl`. Left `undefined` to use
   * the runtime's own locale, which is the right default for an app that has not
   * made a locale decision.
   */
  readonly locale = input<string | undefined>(undefined);

  /**
   * First column of the week, `0` = Sunday.
   *
   * `numberAttribute` guards against the bare-attribute case:
   * `<andes-calendar weekStartsOn="1">` (no square brackets) passes Angular
   * the literal string `"1"`, and left uncoerced that string reaches
   * `weekdayNames`'s `+`-based offset arithmetic as a string, silently
   * producing the wrong grid via JS string concatenation instead of
   * addition. `clampWeekday` then falls back to `0` for anything that
   * isn't a whole number in the valid `0`-`6` range.
   */
  readonly weekStartsOn = input<AndesWeekday>(0, {
    transform: (value: unknown) => clampWeekday(numberAttribute(value, 0)),
  });

  /**
   * Render the adjacent months' days in the leading/trailing cells. Ignored when
   * more than one month is shown, where they would duplicate the next panel's days.
   */
  readonly showOutsideDays = input(true, { transform: booleanAttribute });

  /** Always render six rows, so the panel's height does not change between months. */
  readonly fixedWeeks = input(false, { transform: booleanAttribute });

  /** Months shown side by side in the day grid, as a range picker's two panels. */
  readonly numberOfMonths = input(1, {
    transform: (value: unknown) =>
      Math.max(1, Math.floor(numberAttribute(value, 1)) || 1),
  });

  /** Prefix each week with its week number. Always on for the `week` picker. */
  readonly showWeek = input(false, { transform: booleanAttribute });

  /**
   * A roomy, full-width layout for page-level calendars, where each day has space
   * for `cellTemplate` content under its number.
   */
  readonly fullscreen = input(false, { transform: booleanAttribute });

  /**
   * Disables the whole calendar (`true`), or, in `range` mode, one boundary of the
   * range (`[true, false]` locks the start, `[false, true]` the end). A locked
   * boundary never changes: every pick sets the other one, and the days that would
   * put the range out of order (before a locked start, after a locked end) are
   * disabled. Outside `range` mode a pair reads its first entry, the one boundary
   * there is.
   */
  readonly disabled = input<boolean | readonly [boolean, boolean], unknown>(
    false,
    { transform: coerceDisabledSides },
  );

  /**
   * In `range` mode, which boundary the next pick sets. `null` (the default) runs
   * the usual two-step flow: with no range or a complete one a pick starts a new
   * range, and the next pick closes it. `'end'` moves the end and keeps the start;
   * `'start'` moves the start and keeps the end (either swaps the two into order
   * when the pick lands on the far side). `AndesDatePicker` sets it from the input
   * being edited, so a click after focusing the end input changes the end. A
   * locked boundary (see `disabled`) overrides it.
   */
  readonly editingSide = input<AndesCalendarRangeSide | null>(null);

  /**
   * In `multiple` mode, the most days that can be selected. Once reached, the
   * unselected days are disabled (the selected ones can still be toggled off).
   * Unset, there is no cap.
   */
  readonly maxCount = input<number | undefined, unknown>(undefined, {
    transform: optionalWholeNumber,
  });

  /**
   * What the day grid's header shows: `label` (default) is the caption button that
   * climbs to the month grid; `dropdown` swaps it for a month select and a year
   * select, which jump straight to any month; `dropdown-months` and
   * `dropdown-years` keep only one select beside the other part as plain text. In
   * the month and quarter grids, the year select stands in for the caption when the
   * layout has one. Each visible month (`numberOfMonths`) gets its own selects;
   * months and years outside `min`/`max` are disabled.
   *
   * The selects are `AndesSelect`s (small, borderless, not searchable, the list as
   * wide as the trigger) rather than native ones, so they look and behave like every
   * other control of the library; their lists open on the popover layer, above a
   * date picker's panel, and `containsPanelNode` lets that panel treat them as its own.
   */
  readonly captionLayout = input<AndesCalendarCaptionLayout>('label');

  /**
   * First year of the year select. Defaults to `min`'s year, or 100 years before
   * the month the calendar opened on. The year on screen is always listed.
   */
  readonly startYear = input<number | undefined, unknown>(undefined, {
    transform: optionalWholeNumber,
  });

  /**
   * Last year of the year select. Defaults to `max`'s year, or 100 years after
   * the month the calendar opened on.
   */
  readonly endYear = input<number | undefined, unknown>(undefined, {
    transform: optionalWholeNumber,
  });

  /**
   * Per-date veto, applied on top of `min`/`max` (weekends, holidays, booked days).
   * For month/quarter/year pickers it is called with each cell's first day and
   * `info.type` set to the picker.
   */
  readonly dateDisabled = input<AndesDateDisabledFn | null>(null);

  /**
   * Custom cell content. Replaces the cell's text; in `fullscreen` it renders
   * under the day number instead. Rendered inside the cell's button, so it must
   * not contain interactive elements.
   */
  readonly cellTemplate = input<TemplateRef<AndesCalendarCellContext> | null>(
    null,
  );

  /**
   * Replaces the whole content of every cell, the day number included: the
   * template draws the cell from its context alone. Rendered inside the cell's
   * button, so it must not contain interactive elements. Takes precedence over
   * `cellTemplate`.
   */
  readonly fullCellTemplate =
    input<TemplateRef<AndesCalendarCellContext> | null>(null);

  /** Replaces the whole navigation header. */
  readonly headerTemplate =
    input<TemplateRef<AndesCalendarHeaderContext> | null>(null);

  /** Month shown on first render. Defaults to the selection's month, else today's. */
  readonly defaultMonth = input<Date | null, unknown>(null, {
    transform: coerceDate,
  });

  /**
   * The month on show, controlled: the calendar shows the month holding this date (the
   * first of several, with `numberOfMonths`) and goes back to it whenever it changes.
   * Pair it with `monthChange` - `[(month)]` - to follow the user's navigation; left
   * `null`, the calendar navigates on its own from `defaultMonth`.
   */
  readonly month = input<Date | null, unknown>(null, {
    transform: coerceDate,
  });

  /**
   * The grid to show: `date` (days), `month`, `quarter` or `year`. Changing it
   * switches the grid; the user can still climb and drill from there, and
   * `panelChange` reports where they went. A grid finer than `picker`'s own (days
   * for a month picker) is ignored. Unset, the grid follows `picker`.
   */
  readonly panelView = input<AndesCalendarView | null>(null);

  /** Replaces the single-step previous button's chevron. */
  readonly previousIcon = input<TemplateRef<unknown> | null>(null);

  /** Replaces the single-step next button's chevron. */
  readonly nextIcon = input<TemplateRef<unknown> | null>(null);

  /**
   * Replaces the double chevron of the fast previous button: a year back in the
   * day grid, a year or a decade back in the period grids.
   */
  readonly fastPreviousIcon = input<TemplateRef<unknown> | null>(null);

  /** Replaces the double chevron of the fast next button. */
  readonly fastNextIcon = input<TemplateRef<unknown> | null>(null);

  /** Move focus into the grid once rendered. Used by `AndesDatePicker` on open. */
  readonly autoFocus = input(false, { transform: booleanAttribute });

  /** Accessible name for the grid. Falls back to the visible caption. */
  readonly ariaLabel = input<string | undefined>(undefined, {
    alias: 'aria-label',
  });

  /**
   * Accessible label for the previous-month button. An input rather than a constant
   * so a non-English app can localize it; `Intl` only covers the month and weekday
   * names, not the surrounding control labels.
   */
  readonly previousMonthLabel = input('Previous month');

  /** Accessible label for the next-month button. */
  readonly nextMonthLabel = input('Next month');

  /** Accessible label for the previous-year buttons. */
  readonly previousYearLabel = input('Previous year');

  /** Accessible label for the next-year buttons. */
  readonly nextYearLabel = input('Next year');

  /** Accessible label for the previous-decade button. */
  readonly previousDecadeLabel = input('Previous decade');

  /** Accessible label for the next-decade button. */
  readonly nextDecadeLabel = input('Next decade');

  /** Header of the week-number column. */
  readonly weekNumberLabel = input('Week');

  /** Accessible name of the caption's month select (`captionLayout`). */
  readonly monthSelectLabel = input('Month');

  /** Accessible name of the caption's year select (`captionLayout`). */
  readonly yearSelectLabel = input('Year');

  /** Emits the first day of the month whenever the visible month changes. */
  readonly monthChange = output<Date>();

  /** Emits the clicked day, even when it does not change `value`. */
  readonly daySelected = output<Date>();

  /** Emits whenever the visible period or grid changes. */
  readonly panelChange = output<AndesCalendarPanelChange>();

  /**
   * Emits every cell pick with the grid it happened in, including picks in a
   * coarser grid that only navigate (a year on the way to a day).
   */
  readonly cellSelect = output<AndesCalendarSelectInfo>();

  /**
   * Emits the date under the pointer (or keyboard focus) as it moves over
   * selectable cells, and `null` when it leaves the grid. `AndesDatePicker` uses
   * it to preview a date in its input.
   */
  readonly cellHover = output<Date | null>();

  /**
   * Which grid is showing. Follows `picker` until the user climbs to a coarser
   * grid through the caption.
   */
  readonly view = linkedSignal<AndesCalendarView>(() => {
    const requested = this.panelView();
    const picker = this.picker();
    return requested && isViewReachable(requested, picker)
      ? requested
      : baseViewFor(picker);
  });

  /**
   * The month the user has navigated to. Keyed off a stable `YYYY-MM-DD` string so
   * the linked signal resets only when the *anchor month* genuinely changes, not on
   * every re-evaluation that happens to build an equal-but-new `Date`.
   */
  protected readonly visibleMonth = linkedSignal<string, Date>({
    source: () => toDateKey(this.anchorMonth()),
    computation: (key) => coerceDate(key) ?? startOfMonth(today()),
  });

  /**
   * The cell holding `tabindex="0"`, once the user has moved focus. `null` means
   * "derive it", which is what keeps the roving tabindex sensible after the visible
   * period changes underneath it.
   */
  private readonly focusedDate = signal<Date | null>(null);

  /** The cell under the pointer (or keyboard focus), for the range preview. */
  private readonly hoverDate = signal<Date | null>(null);

  private readonly selectedDate = computed(() =>
    this.mode() === 'single' ? coerceDate(this.value()) : null,
  );

  private readonly selectedRange = computed(() =>
    this.mode() === 'range' ? toOpenDateRange(this.value()) : null,
  );

  /** The `multiple` selection, one period start per entry, in order. */
  private readonly selectedDates = computed<readonly Date[]>(() => {
    if (this.mode() !== 'multiple') {
      return [];
    }
    const picker = this.picker();
    const weekStartsOn = this.weekStartsOn();
    return toDateList(
      toDateList(this.value()).map((date) =>
        startOfPeriod(date, picker, weekStartsOn),
      ),
    );
  });

  /** `disabled` is `true`, or a pair locking both boundaries. */
  protected readonly isDisabled = computed(() => {
    const disabled = this.disabled();
    if (typeof disabled === 'boolean') {
      return disabled;
    }
    return this.mode() === 'range' ? disabled[0] && disabled[1] : disabled[0];
  });

  /** Which boundaries `disabled` locks, in `range` mode. */
  private readonly lockedSides = computed<readonly [boolean, boolean]>(() => {
    const disabled = this.disabled();
    return this.mode() === 'range' && typeof disabled !== 'boolean'
      ? disabled
      : [false, false];
  });

  /** The boundary the next pick sets: a locked side forces the other one. */
  private readonly rangeTarget = computed<AndesCalendarRangeSide | null>(() => {
    const [startLocked, endLocked] = this.lockedSides();
    if (startLocked) {
      return 'end';
    }
    if (endLocked) {
      return 'start';
    }
    return this.editingSide();
  });

  /** Whether `maxCount` is reached, so no further day can be added. */
  private readonly atMaxCount = computed(() => {
    const max = this.maxCount();
    return max !== undefined && this.selectedDates().length >= max;
  });

  /** The month a fresh calendar opens on, or the controlled `month`. */
  private readonly anchorMonth = computed(() => {
    const controlled = this.month();
    if (controlled) {
      return startOfMonth(controlled);
    }
    const explicit = this.defaultMonth();
    if (explicit) {
      return startOfMonth(explicit);
    }
    const selection = this.selectionAnchor();
    if (selection) {
      return startOfMonth(selection);
    }
    return startOfMonth(clampDate(today(), this.min(), this.max()));
  });

  /** The first selected date of any mode, the one the calendar opens on. */
  private readonly selectionAnchor = computed<Date | null>(
    () =>
      this.selectedDate() ??
      this.selectedRange()?.start ??
      this.selectedRange()?.end ??
      this.selectedDates()[0] ??
      null,
  );

  protected readonly showWeekNumbers = computed(
    () => this.showWeek() || this.picker() === 'week',
  );

  /** Months shown in the day grid; period grids always show one panel. */
  private readonly monthCount = computed(() =>
    this.view() === 'date' ? this.numberOfMonths() : 1,
  );

  /** First and last day of what is on screen, used to decide when to page. */
  private readonly visibleSpan = computed(() => {
    const anchor = this.visibleMonth();
    switch (this.view()) {
      case 'date':
        return {
          start: startOfMonth(anchor),
          end: endOfMonth(addMonths(anchor, this.monthCount() - 1)),
        };
      case 'month':
      case 'quarter':
        return {
          start: startOfYear(anchor),
          end: new Date(anchor.getFullYear(), 11, 31),
        };
      case 'year': {
        const decade = startOfDecade(anchor);
        return {
          start: decade,
          end: new Date(decade.getFullYear() + 9, 11, 31),
        };
      }
    }
  });

  /** The unit a cell in the current grid stands for. */
  private readonly cellUnit = computed<AndesPickerType>(() =>
    this.view() === 'date'
      ? this.picker() === 'week'
        ? 'week'
        : 'date'
      : this.view(),
  );

  /** The effective roving-tabindex target for the visible period. */
  protected readonly activeDate = computed(() => {
    const view = this.view();
    const unit = view === 'date' ? 'date' : view;
    const { start, end } = this.visibleSpan();
    const inSpan = (date: Date | null | undefined): date is Date =>
      !!date && isWithinBounds(date, start, end);

    const explicit = this.focusedDate();
    if (inSpan(explicit)) {
      return startOfPeriod(explicit, unit);
    }
    const selection =
      this.selectedDate() ??
      this.selectedRange()?.start ??
      this.selectedRange()?.end ??
      this.selectedDates().find((date) => inSpan(date));
    if (inSpan(selection)) {
      return startOfPeriod(selection, unit);
    }
    return this.defaultActiveDate(start, end, unit);
  });

  protected readonly weekdays = computed(() =>
    weekdayNames(this.locale(), this.weekStartsOn()),
  );

  /**
   * The range as the user would see it if they picked the hovered cell now, while
   * that pick would complete (or move a boundary of) a range.
   */
  private readonly previewRange = computed(() => {
    const range = this.selectedRange();
    const hover = this.hoverDate();
    if (!range || !hover) {
      return null;
    }
    const next = this.nextRange(hover);
    const unchanged =
      isSameDay(next.start, range.start) && isSameDay(next.end, range.end);
    return next.start && next.end && !unchanged ? next : null;
  });

  /** Whether the header shows a month select (`captionLayout`). */
  protected readonly monthDropdown = computed(
    () =>
      this.captionLayout() === 'dropdown' ||
      this.captionLayout() === 'dropdown-months',
  );

  /**
   * Whether the day grid's header keeps its year-jump arrows. A year select does the
   * same job, so they give way to it and leave the room to the two selects.
   */
  protected readonly showFastNav = computed(
    () => !(this.view() === 'date' && this.yearDropdown()),
  );

  /** Whether the header shows a year select (`captionLayout`). */
  protected readonly yearDropdown = computed(
    () =>
      this.captionLayout() === 'dropdown' ||
      this.captionLayout() === 'dropdown-years',
  );

  /** First and last year of the year select, before the shown year is added. */
  private readonly yearSpan = computed(() => {
    const around = this.anchorMonth().getFullYear();
    let first =
      this.startYear() ??
      this.min()?.getFullYear() ??
      around - UNBOUNDED_YEAR_SPAN;
    let last =
      this.endYear() ??
      this.max()?.getFullYear() ??
      around + UNBOUNDED_YEAR_SPAN;
    if (last < first) {
      [first, last] = [last, first];
    }
    return { first, last };
  });

  /**
   * The caption selects of each visible month: its month options (those wholly
   * outside `min`/`max` disabled), its year options, and the plain text shown for
   * whichever half has no select. Kept apart from `panels`, which re-renders on
   * every hover, so the option lists are only rebuilt when the view moves.
   */
  protected readonly captionSelects = computed<
    readonly {
      readonly months: readonly CaptionOption[];
      readonly years: readonly CaptionOption[];
      /** The shown month (0-11) and year, the two selects' values. */
      readonly month: number;
      readonly year: number;
      readonly monthText: string;
      readonly yearText: string;
    }[]
  >(() => {
    if (this.captionLayout() === 'label') {
      return [];
    }
    const locale = this.locale();
    const monthFormat = new Intl.DateTimeFormat(locale, { month: 'long' });
    // The select lists short names: its list is as wide as its trigger, and two
    // triggers share the header with the arrows.
    const shortMonth = new Intl.DateTimeFormat(locale, { month: 'short' });
    const yearFormat = new Intl.DateTimeFormat(locale, { year: 'numeric' });
    const min = this.min();
    const max = this.max();
    const { first, last } = this.yearSpan();
    const count = this.view() === 'date' ? this.monthCount() : 1;

    return Array.from({ length: count }, (_, index) => {
      const shown = addMonths(this.visibleMonth(), index);
      const year = shown.getFullYear();
      const months = Array.from({ length: 12 }, (_, month) => {
        const date = yearMonth(year, month);
        return {
          value: month,
          label: shortMonth.format(date),
          disabled:
            (!!min && compareDays(endOfMonth(date), min) < 0) ||
            (!!max && compareDays(date, max) > 0),
        };
      });
      const years: CaptionOption[] = [];
      for (
        let option = Math.min(first, year);
        option <= Math.max(last, year);
        option++
      ) {
        years.push({
          value: option,
          label: yearFormat.format(yearMonth(option, 0)),
          disabled:
            (!!min && option < min.getFullYear()) ||
            (!!max && option > max.getFullYear()),
        });
      }
      return {
        months,
        years,
        month: shown.getMonth(),
        year,
        monthText: monthFormat.format(shown),
        yearText: yearFormat.format(shown),
      };
    });
  });

  /** The day grid, one entry per visible month. */
  protected readonly panels = computed<readonly MonthPanel[]>(() => {
    if (this.view() !== 'date') {
      return [];
    }
    const locale = this.locale();
    const count = this.monthCount();
    const hideOutside = count > 1 || !this.showOutsideDays();
    const weekStartsOn = this.weekStartsOn();

    return Array.from({ length: count }, (_, index) => {
      const month = addMonths(this.visibleMonth(), index);
      const caption = formatMonthCaption(month, locale);
      return {
        key: toDateKey(month),
        index,
        month,
        caption,
        gridLabel: this.ariaLabel() ?? caption,
        rows: buildCalendarWeeks(month, weekStartsOn, this.fixedWeeks()).map(
          (week) => ({
            key: week.key,
            weekNumber: this.showWeekNumbers()
              ? weekOfYear(week.days[0].date, weekStartsOn).week
              : null,
            cells: week.days.map((day) =>
              day.outside && hideOutside
                ? null
                : this.resolveCell(
                    day,
                    'date',
                    String(day.dayOfMonth),
                    formatDayLabel(day.date, locale),
                  ),
            ),
          }),
        ),
      };
    });
  });

  /** The month / quarter / year grid, as rows of cells. */
  protected readonly periodRows = computed<readonly CellRow[]>(() => {
    const view = this.view();
    if (view === 'date') {
      return [];
    }
    const locale = this.locale();
    const anchor = this.visibleMonth();
    const year = anchor.getFullYear();
    const dates: { date: Date; outside: boolean }[] = [];

    if (view === 'month') {
      for (let month = 0; month < 12; month++) {
        dates.push({ date: new Date(year, month, 1), outside: false });
      }
    } else if (view === 'quarter') {
      for (let quarter = 0; quarter < 4; quarter++) {
        dates.push({ date: new Date(year, quarter * 3, 1), outside: false });
      }
    } else {
      // Twelve cells: the decade plus the year either side.
      const first = startOfDecade(anchor).getFullYear() - 1;
      for (let offset = 0; offset < 12; offset++) {
        dates.push({
          date: new Date(first + offset, 0, 1),
          outside: offset === 0 || offset === 11,
        });
      }
    }

    const shortMonth = new Intl.DateTimeFormat(locale, { month: 'short' });
    const longMonth = new Intl.DateTimeFormat(locale, {
      month: 'long',
      year: 'numeric',
    });
    const yearFormat = new Intl.DateTimeFormat(locale, { year: 'numeric' });

    const cells = dates.map(({ date, outside }) => {
      const day: AndesCalendarDay = {
        date,
        key: toDateKey(date),
        dayOfMonth: 1,
        outside,
      };
      switch (view) {
        case 'month':
          return this.resolveCell(
            day,
            view,
            shortMonth.format(date),
            longMonth.format(date),
          );
        case 'quarter': {
          const text = `Q${date.getMonth() / 3 + 1}`;
          return this.resolveCell(
            day,
            view,
            text,
            `${text} ${yearFormat.format(date)}`,
          );
        }
        default: {
          const text = yearFormat.format(date);
          return this.resolveCell(day, view, text, text);
        }
      }
    });

    const { columns } = PERIOD_GRID[view];
    const rows: CellRow[] = [];
    for (let index = 0; index < cells.length; index += columns) {
      const slice = cells.slice(index, index + columns);
      rows.push({ key: slice[0].key, weekNumber: null, cells: slice });
    }
    return rows;
  });

  /** Caption of the period grids: the year, or the decade span. */
  protected readonly periodCaption = computed(() => {
    const format = new Intl.DateTimeFormat(this.locale(), { year: 'numeric' });
    const anchor = this.visibleMonth();
    if (this.view() === 'year') {
      const decade = startOfDecade(anchor);
      return `${format.format(decade)} – ${format.format(
        new Date(decade.getFullYear() + 9, 0, 1),
      )}`;
    }
    return format.format(anchor);
  });

  /**
   * What the calendar's one live region says: the caption(s) on show, joined, so paging a
   * two-month range announces "October 2026 – November 2026" once. Empty where something
   * else announces the change: the caption selects, or a custom header.
   */
  protected readonly announcement = computed(() => {
    if (this.headerTemplate()) {
      return '';
    }
    if (this.view() === 'date') {
      return this.captionLayout() === 'label'
        ? this.panels()
            .map((panel) => panel.caption)
            .join(' – ')
        : '';
    }
    return this.yearDropdown() && this.view() !== 'year'
      ? ''
      : this.periodCaption();
  });

  protected readonly periodGridLabel = computed(
    () => this.ariaLabel() ?? this.periodCaption(),
  );

  /** Whether the caption climbs to a coarser grid. */
  protected readonly canClimb = computed(
    () => !this.isDisabled() && PARENT_VIEW[this.view()] !== null,
  );

  /** The single-step shift of the current grid, in months. */
  private readonly step = computed(() => {
    switch (this.view()) {
      case 'date':
        return 1;
      case 'month':
      case 'quarter':
        return 12;
      case 'year':
        return 120;
    }
  });

  protected readonly canGoPrevious = computed(() =>
    this.canShift(-this.step()),
  );
  protected readonly canGoNext = computed(() => this.canShift(this.step()));
  protected readonly canGoPreviousYear = computed(() => this.canShift(-12));
  protected readonly canGoNextYear = computed(() => this.canShift(12));

  protected readonly previousLabel = computed(() => {
    switch (this.view()) {
      case 'date':
        return this.previousMonthLabel();
      case 'year':
        return this.previousDecadeLabel();
      default:
        return this.previousYearLabel();
    }
  });

  protected readonly nextLabel = computed(() => {
    switch (this.view()) {
      case 'date':
        return this.nextMonthLabel();
      case 'year':
        return this.nextDecadeLabel();
      default:
        return this.nextYearLabel();
    }
  });

  protected readonly headerContext = computed<AndesCalendarHeaderContext>(
    () => ({
      $implicit: startOfMonth(this.visibleMonth()),
      view: this.view(),
      goTo: (date: Date) => this.goTo(date),
      setView: (view: AndesCalendarView) => this.setView(view),
    }),
  );

  protected readonly wrapperClasses = computed(() =>
    clsx(
      'andes-calendar',
      this.fullscreen() && 'andes-calendar--fullscreen',
      this.showWeekNumbers() &&
        this.view() === 'date' &&
        'andes-calendar--with-week',
      this.picker() === 'week' && 'andes-calendar--week-picker',
    ),
  );

  /** The caption selects (`captionLayout`), one or two per visible month. */
  private readonly captionSelectRefs = viewChildren(AndesSelect);

  constructor() {
    afterNextRender(() => {
      if (this.autoFocus()) {
        this.focusActiveDay();
      }
    });

    // The caption selects open on the popover layer rather than the select's usual
    // dropdown layer, so their lists stack above the date picker's own panel (also a
    // popover, opened earlier) instead of disappearing behind it.
    effect(() => {
      const selects = this.captionSelectRefs();
      untracked(() =>
        selects.forEach((select) =>
          select.overlay.configure({ layer: 'popover' }),
        ),
      );
    });
  }

  /**
   * Whether a date can be picked in the current grid: in bounds, not vetoed,
   * calendar not disabled. Cells in a coarser grid than `picker` are only
   * navigation targets, so only the bounds apply to them.
   */
  isSelectable(date: Date, view: AndesCalendarView = this.view()): boolean {
    if (this.isDisabled()) {
      return false;
    }
    const unit = view === 'date' ? 'date' : view;
    const min = this.min();
    const max = this.max();
    if (min && compareDays(endOfPeriod(date, unit), min) < 0) {
      return false;
    }
    if (max && compareDays(startOfPeriod(date, unit), max) > 0) {
      return false;
    }
    if (view !== baseViewFor(this.picker())) {
      return true;
    }
    if (!this.withinCaps(date)) {
      return false;
    }
    const veto = this.dateDisabled();
    if (!veto) {
      return true;
    }
    const range = this.selectedRange();
    const from =
      range?.start && (!range.end || this.rangeTarget() === 'end')
        ? range.start
        : null;
    return !veto(
      date,
      from ? { type: this.picker(), from } : { type: this.picker() },
    );
  }

  /**
   * The mode's own limits on a pick: `maxCount` in `multiple` mode (a selected day
   * can always be toggled off), and in `range` mode the order a locked boundary
   * imposes (nothing before a locked start, nothing after a locked end).
   */
  private withinCaps(date: Date): boolean {
    const picker = this.picker();
    const weekStartsOn = this.weekStartsOn();
    if (this.mode() === 'multiple') {
      return (
        !this.atMaxCount() ||
        this.selectedDates().some((selected) =>
          isSamePeriod(date, selected, picker, weekStartsOn),
        )
      );
    }
    const range = this.selectedRange();
    const [startLocked, endLocked] = this.lockedSides();
    if (
      startLocked &&
      range?.start &&
      comparePeriods(date, range.start, picker, weekStartsOn) < 0
    ) {
      return false;
    }
    return !(
      endLocked &&
      range?.end &&
      comparePeriods(date, range.end, picker, weekStartsOn) > 0
    );
  }

  /** Moves the visible month by `amount`, clamping focus into the new span. */
  shiftMonth(amount: number): void {
    const next = startOfMonth(addMonths(this.visibleMonth(), amount));
    this.visibleMonth.set(next);
    this.focusedDate.set(null);
    this.monthChange.emit(next);
    this.panelChange.emit({ date: next, view: this.view() });
  }

  /** Shows the period containing `date`; a no-op when it is already on screen. */
  goTo(date: Date): void {
    const month = startOfMonth(date);
    const { start, end } = this.visibleSpan();
    if (isWithinBounds(month, start, end)) {
      return;
    }
    this.visibleMonth.set(month);
    this.focusedDate.set(null);
    this.monthChange.emit(month);
    this.panelChange.emit({ date: month, view: this.view() });
  }

  /** Caption month select: show the picked month in the panel it was picked in. */
  protected onMonthSelect(index: number, value: unknown): void {
    const shown = addMonths(this.visibleMonth(), index);
    const picked = yearMonth(shown.getFullYear(), Number(value));
    this.navigateTo(addMonths(picked, -index));
  }

  /**
   * Caption year select: the same month in the picked year, clamped into
   * `min`/`max` when that month falls outside them.
   */
  protected onYearSelect(index: number, value: unknown): void {
    const shown = addMonths(this.visibleMonth(), index);
    let target = yearMonth(Number(value), shown.getMonth());
    const min = this.min();
    const max = this.max();
    if (min && compareDays(endOfMonth(target), min) < 0) {
      target = startOfMonth(min);
    }
    if (max && compareDays(target, max) > 0) {
      target = startOfMonth(max);
    }
    this.navigateTo(addMonths(target, -index));
  }

  /**
   * Whether `node` is inside a panel this calendar opened - a caption select's option
   * list, which renders in the overlay container, outside the calendar. A calendar
   * hosted in an overlay of its own (`AndesDatePicker`) treats focus and clicks there
   * as its own.
   */
  containsPanelNode(node: EventTarget | null): boolean {
    return (
      node instanceof Node &&
      this.captionSelectRefs().some(
        (select) => !!select.overlay.panelElement()?.contains(node),
      )
    );
  }

  /** Shows the month starting `month` first, reporting the move like the arrows do. */
  private navigateTo(month: Date): void {
    const next = startOfMonth(month);
    if (toDateKey(next) === toDateKey(this.visibleMonth())) {
      return;
    }
    this.visibleMonth.set(next);
    this.focusedDate.set(null);
    this.monthChange.emit(next);
    this.panelChange.emit({ date: next, view: this.view() });
  }

  /** Switches the visible grid. */
  setView(view: AndesCalendarView): void {
    if (view === this.view()) {
      return;
    }
    this.view.set(view);
    this.focusedDate.set(null);
    this.panelChange.emit({ date: startOfMonth(this.visibleMonth()), view });
  }

  /** Focuses the grid's active cell. Called on open by `AndesDatePicker`. */
  focusActiveDay(): void {
    this.cellElement(toDateKey(this.activeDate()))?.focus();
  }

  protected goToPrevious(): void {
    if (this.canGoPrevious()) {
      this.shiftMonth(-this.step());
    }
  }

  protected goToNext(): void {
    if (this.canGoNext()) {
      this.shiftMonth(this.step());
    }
  }

  protected goToPreviousYear(): void {
    if (this.canGoPreviousYear()) {
      this.shiftMonth(-12);
    }
  }

  protected goToNextYear(): void {
    if (this.canGoNextYear()) {
      this.shiftMonth(12);
    }
  }

  /** Caption click: climb to the coarser grid and focus its active cell. */
  protected climb(): void {
    const parent = PARENT_VIEW[this.view()];
    if (!parent || this.isDisabled()) {
      return;
    }
    this.setView(parent);
    this.flushAndFocus();
  }

  protected onCellHover(cell: AndesCalendarCell): void {
    if (cell.disabled) {
      return;
    }
    if (this.mode() === 'range') {
      this.hoverDate.set(cell.date);
    }
    if (cell.view === baseViewFor(this.picker())) {
      this.cellHover.emit(cell.date);
    }
  }

  protected clearHover(): void {
    this.hoverDate.set(null);
    this.cellHover.emit(null);
  }

  protected selectCell(cell: AndesCalendarCell): void {
    if (cell.disabled) {
      return;
    }

    const base = baseViewFor(this.picker());
    if (cell.view !== base) {
      this.cellSelect.emit({ date: cell.date, source: cell.view });
      this.drillDown(cell);
      return;
    }

    this.focusedDate.set(cell.date);
    if (
      (cell.view === 'date' &&
        !isWithinBounds(
          cell.date,
          this.visibleSpan().start,
          this.visibleSpan().end,
        )) ||
      (cell.outside && cell.view === 'year')
    ) {
      // Clicking a leading/trailing cell navigates to the month (or decade) it belongs
      // to, rather than selecting a day the user can no longer see in context.
      const month = startOfMonth(cell.date);
      this.visibleMonth.set(month);
      this.monthChange.emit(month);
      this.panelChange.emit({ date: month, view: this.view() });
    }

    const date = startOfPeriod(cell.date, this.picker(), this.weekStartsOn());
    if (this.mode() === 'range') {
      this.value.set(this.nextRange(date));
      this.hoverDate.set(null);
    } else if (this.mode() === 'multiple') {
      this.value.set(this.toggled(date));
    } else {
      this.value.set(date);
    }

    this.daySelected.emit(date);
    this.cellSelect.emit({ date, source: cell.view });
  }

  /**
   * A click in a coarser grid than `picker`: go back to the picker's own grid on it. A
   * year picked on the way to a day opens that year's days straight away, on the month the
   * user was on, rather than stopping at the month grid: the caption climbs again if the
   * month should change too.
   */
  private drillDown(cell: AndesCalendarCell): void {
    const base = baseViewFor(this.picker());
    let month = cell.date;
    if (cell.view === 'year') {
      // Keep the month the user was on; only the year changes.
      month = new Date(
        cell.date.getFullYear(),
        this.visibleMonth().getMonth(),
        1,
      );
    }
    this.visibleMonth.set(startOfMonth(month));
    this.monthChange.emit(startOfMonth(month));
    const next: AndesCalendarView = base;
    this.view.set(next);
    this.focusedDate.set(null);
    this.panelChange.emit({ date: startOfMonth(month), view: next });
    this.flushAndFocus();
  }

  /**
   * Range selection state machine.
   *
   * With no range, or with a *complete* one, a click starts a new range anchored at
   * the clicked day. The alternative — extending or moving the nearest boundary —
   * reads as the calendar second-guessing the user: having picked Mar 10-20, a
   * click on Mar 5 could equally mean "start over at Mar 5" or "widen to Mar 5-20",
   * and guessing wrong silently produces a range nobody asked for. Restarting is
   * always one further click away from any range the user wants.
   *
   * A click on the second day of a half-open range closes it, swapped into order if
   * the user picked backwards. Clicking the same day twice yields a valid one-day
   * range. An open-ended range with only an end takes the click as its start.
   *
   * `editingSide` (or a boundary locked through `disabled`) replaces that flow with
   * a direct edit of one boundary, keeping the other.
   */
  private nextRange(date: Date): AndesOpenDateRange {
    const current = this.selectedRange();
    const start = current?.start ?? null;
    const end = current?.end ?? null;
    const [startLocked, endLocked] = this.lockedSides();

    switch (this.rangeTarget()) {
      case 'end':
        if (!start) {
          return { start: null, end: date };
        }
        if (compareDays(date, start) < 0) {
          return startLocked ? { start, end } : { start: date, end: start };
        }
        return { start, end: date };
      case 'start':
        if (!end) {
          return { start: date, end: null };
        }
        if (compareDays(date, end) > 0) {
          return endLocked ? { start, end } : { start: end, end: date };
        }
        return { start: date, end };
      default:
        if (start && !end) {
          return normalizeRange({ start, end: date });
        }
        if (!start && end) {
          // An open-ended range (`[null, end]`): the pick supplies the start.
          return normalizeRange({ start: date, end });
        }
        return { start: date, end: null };
    }
  }

  /** `multiple` mode: the selection with `date`'s period toggled in or out. */
  private toggled(date: Date): readonly Date[] {
    const picker = this.picker();
    const weekStartsOn = this.weekStartsOn();
    const current = this.selectedDates();
    const kept = current.filter(
      (selected) => !isSamePeriod(selected, date, picker, weekStartsOn),
    );
    if (kept.length !== current.length) {
      return kept;
    }
    return this.atMaxCount() ? current : toDateList([...current, date]);
  }

  /**
   * The grid's whole keyboard contract, bound to each cell button — the elements
   * that actually hold focus. Enter/Space select the focused cell; everything else
   * moves the roving tabindex.
   */
  protected onCellKeydown(event: KeyboardEvent, cell: AndesCalendarCell): void {
    if (this.isDisabled()) {
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      // A `<button role="gridcell">` loses the button role's implicit
      // Enter/Space activation, so activate it explicitly.
      event.preventDefault();
      this.selectCell(cell);
      return;
    }

    // Left and Right follow the screen, so in a right-to-left grid Right goes back in time
    // and Left forward; the other keys are about the calendar, not the screen.
    const key = isRtl(event.currentTarget as Element)
      ? mirrorArrow(event.key)
      : event.key;
    const target =
      cell.view === 'date'
        ? this.dayKeyTarget(key, event.shiftKey)
        : this.periodKeyTarget(key, cell.view);
    if (!target) {
      return;
    }

    event.preventDefault();
    this.moveFocusTo(target);
  }

  private dayKeyTarget(key: string, shift: boolean): Date | null {
    const active = this.activeDate();
    const weekStart = addDays(
      active,
      -((active.getDay() - this.weekStartsOn() + 7) % 7),
    );

    switch (key) {
      case 'ArrowLeft':
        return shift ? addMonths(active, -1) : addDays(active, -1);
      case 'ArrowRight':
        return shift ? addMonths(active, 1) : addDays(active, 1);
      case 'ArrowUp':
        return shift ? addYears(active, -1) : addDays(active, -7);
      case 'ArrowDown':
        return shift ? addYears(active, 1) : addDays(active, 7);
      case 'Home':
        return weekStart;
      case 'End':
        return addDays(weekStart, 6);
      case 'PageUp':
        return shift ? addYears(active, -1) : addMonths(active, -1);
      case 'PageDown':
        return shift ? addYears(active, 1) : addMonths(active, 1);
      default:
        return null;
    }
  }

  private periodKeyTarget(
    key: string,
    view: Exclude<AndesCalendarView, 'date'>,
  ): Date | null {
    const active = this.activeDate();
    const { columns, step, page } = PERIOD_GRID[view];
    const index =
      view === 'year'
        ? active.getFullYear() - (startOfDecade(active).getFullYear() - 1)
        : active.getMonth() / step;
    const column = index % columns;

    switch (key) {
      case 'ArrowLeft':
        return addMonths(active, -step);
      case 'ArrowRight':
        return addMonths(active, step);
      case 'ArrowUp':
        return addMonths(active, view === 'quarter' ? -12 : -step * columns);
      case 'ArrowDown':
        return addMonths(active, view === 'quarter' ? 12 : step * columns);
      case 'Home':
        return addMonths(active, -step * column);
      case 'End':
        return addMonths(active, step * (columns - 1 - column));
      case 'PageUp':
        return addMonths(active, -page);
      case 'PageDown':
        return addMonths(active, page);
      default:
        return null;
    }
  }

  /**
   * Moves the roving tabindex, paging the visible period when the target falls
   * outside it.
   *
   * The target is clamped into `[min, max]` so arrow keys stop at the bounds instead
   * of walking into a region where nothing is selectable. Days vetoed by
   * `dateDisabled` are still reachable — skipping them would make a calendar with
   * many blocked days unnavigable, and they announce as disabled on arrival.
   */
  private moveFocusTo(date: Date): void {
    const view = this.view();
    const unit = view === 'date' ? 'date' : view;
    const min = this.min();
    const target = startOfPeriod(
      clampDate(date, min ? startOfPeriod(min, unit) : null, this.max()),
      unit,
    );
    this.focusedDate.set(target);
    if (this.mode() === 'range') {
      this.hoverDate.set(target);
    }

    const { start, end } = this.visibleSpan();
    if (!isWithinBounds(target, start, end)) {
      let month = startOfMonth(target);
      if (view === 'date' && compareDays(target, end) > 0) {
        // Paging forward in a multi-month grid keeps the target in the last panel.
        month = addMonths(month, -(this.monthCount() - 1));
      }
      this.visibleMonth.set(month);
      this.monthChange.emit(month);
      this.panelChange.emit({ date: month, view });
    }

    this.flushAndFocus(target);
  }

  /**
   * The signals have updated but the DOM has not: in a zoneless app the re-render
   * is still queued. Flush this view synchronously so the target cell exists before
   * focus moves to it, instead of deferring focus to a microtask and making keyboard
   * navigation racy.
   */
  private flushAndFocus(target: Date = this.activeDate()): void {
    this.changeDetectorRef.detectChanges();
    this.cellElement(toDateKey(target))?.focus();
  }

  /** Whether moving the visible anchor by `amount` months still shows something in bounds. */
  private canShift(amount: number): boolean {
    if (this.isDisabled()) {
      return false;
    }
    const min = this.min();
    const max = this.max();
    const shifted = addMonths(this.visibleMonth(), amount);
    const view = this.view();
    let start: Date;
    let end: Date;
    if (view === 'date') {
      start = startOfMonth(shifted);
      end = endOfMonth(addMonths(shifted, this.monthCount() - 1));
    } else if (view === 'year') {
      start = startOfDecade(shifted);
      end = new Date(start.getFullYear() + 9, 11, 31);
    } else {
      start = startOfYear(shifted);
      end = new Date(shifted.getFullYear(), 11, 31);
    }
    if (amount < 0 && min && compareDays(end, min) < 0) {
      return false;
    }
    if (amount > 0 && max && compareDays(start, max) > 0) {
      return false;
    }
    return true;
  }

  /** Resolves every state flag of one cell. */
  private resolveCell(
    day: AndesCalendarDay,
    view: AndesCalendarView,
    text: string,
    label: string,
  ): AndesCalendarCell {
    const unit = view === 'date' ? this.cellUnit() : view;
    const weekStartsOn = this.weekStartsOn();
    const same = (other: Date | null | undefined) =>
      isSamePeriod(day.date, other ?? null, unit, weekStartsOn);
    const compare = (other: Date) =>
      comparePeriods(day.date, other, unit, weekStartsOn);

    const range = this.selectedRange();
    const isRangeStart = same(range?.start);
    const isRangeEnd = same(range?.end);
    let isSelected: boolean;
    switch (this.mode()) {
      case 'range':
        isSelected = isRangeStart || isRangeEnd;
        break;
      case 'multiple':
        isSelected = this.selectedDates().some((date) => same(date));
        break;
      default:
        isSelected = same(this.selectedDate());
    }
    const inRange =
      !!range?.start &&
      !!range.end &&
      compare(range.start) > 0 &&
      compare(range.end) < 0;

    const preview = this.previewRange();
    const inPreview =
      !!preview?.start &&
      !!preview.end &&
      !isSelected &&
      compare(preview.start) >= 0 &&
      compare(preview.end) <= 0;
    // Its two boundaries, selected or not: they carry half a band towards the inside, so the
    // band meets the chips instead of stopping a few pixels short of them.
    const previewSpans =
      !!preview?.start &&
      !!preview.end &&
      !isSamePeriod(preview.start, preview.end, unit, weekStartsOn);
    const isPreviewStart = previewSpans && same(preview?.start);
    const isPreviewEnd = previewSpans && same(preview?.end);

    const isToday = isSamePeriod(
      day.date,
      today(),
      view === 'date' ? 'date' : view,
    );
    const isDisabled = !this.isSelectable(day.date, view);
    const active = day.key === toDateKey(this.activeDate());

    return {
      ...day,
      view,
      text,
      selected: isSelected,
      rangeStart: isRangeStart,
      rangeEnd: isRangeEnd,
      inRange,
      inPreview,
      previewStart: isPreviewStart,
      previewEnd: isPreviewEnd,
      isToday,
      disabled: isDisabled,
      active,
      label,
      classes: clsx(
        view === 'date' ? 'andes-calendar__day' : 'andes-calendar__period',
        day.outside && 'andes-calendar__day--outside',
        isSelected && 'andes-calendar__day--selected',
        isRangeStart && 'andes-calendar__day--range-start',
        isRangeEnd && 'andes-calendar__day--range-end',
        inRange && 'andes-calendar__day--in-range',
        inPreview && 'andes-calendar__day--in-preview',
        isPreviewStart && 'andes-calendar__day--preview-start',
        isPreviewEnd && 'andes-calendar__day--preview-end',
        isToday && 'andes-calendar__day--today',
        isDisabled && 'andes-calendar__day--disabled',
      ),
    };
  }

  /** First selectable cell of the span, preferring today / the current period. */
  private defaultActiveDate(
    start: Date,
    end: Date,
    unit: AndesPickerType,
  ): Date {
    const view = this.view();
    const now = startOfPeriod(today(), unit);
    if (isWithinBounds(now, start, end) && this.isSelectable(now, view)) {
      return now;
    }

    const stepMonths = view === 'date' ? 0 : PERIOD_GRID[view].step;
    for (
      let candidate = start;
      compareDays(candidate, end) <= 0;
      candidate =
        stepMonths === 0
          ? addDays(candidate, 1)
          : addMonths(candidate, stepMonths)
    ) {
      if (this.isSelectable(candidate, view)) {
        return candidate;
      }
    }
    // Nothing in this span is selectable; its first cell still needs to hold the
    // tabindex so the grid stays reachable by Tab.
    return start;
  }

  private cellElement(key: string): HTMLElement | null {
    const root = this.elementRef.nativeElement;
    // Prefer the in-month cell over an adjacent month's outside day of the same date.
    return (
      root.querySelector<HTMLElement>(
        `[data-date="${key}"]:not([data-outside])`,
      ) ?? root.querySelector<HTMLElement>(`[data-date="${key}"]`)
    );
  }
}
