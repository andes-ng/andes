import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
  type WritableSignal,
} from '@angular/core';

import { AndesDatePicker } from '../date-picker/date-picker';
import { AndesInput } from '../input/input';
import { AndesSelect } from '../select/select';
import { AndesSelectContent } from '../select/select-content';
import { AndesSelectItem } from '../select/select-item';
import { AndesSelectTrigger } from '../select/select-trigger';
import { AndesSelectValue } from '../select/select-value';
import {
  andesReadDateRangeFilter,
  andesReadRangeFilter,
  andesReadTextFilter,
  type AndesFilterValue,
  type AndesTextFilterOperator,
} from './table-data';
import {
  ANDES_TABLE_FILTER_PANEL,
  AndesTableFilter,
  type AndesTableFilterPanelHost,
} from './table-filter';

/*
 * Ready-made bodies for `andes-table-filter`. Each one is projected into the
 * filter and edits the filter's draft directly, so Reset / OK / Escape / click
 * outside behave exactly as for the option list. The fields keep their own text
 * while the user types (a half-typed "1." or "-" is not a number yet) and only
 * pick the draft up again when something else changes it - opening the panel,
 * Reset, or a controlled `filters` update.
 */

let nextPanelId = 0;

/** Keeps a panel's field texts and the filter's draft in step. */
function syncWithDraft(
  filter: AndesTableFilter,
  fields: readonly WritableSignal<string>[],
  encode: (texts: readonly string[]) => readonly AndesFilterValue[],
  decode: (values: readonly AndesFilterValue[]) => readonly string[],
): (index: number, text: string) => void {
  effect(() => {
    const draft = filter.draft();
    untracked(() => {
      const texts = fields.map((field) => field());
      if (!sameValues(encode(texts), draft)) {
        decode(draft).forEach((text, index) => fields[index].set(text));
      }
    });
  });

  return (index, text) => {
    fields[index].set(text);
    filter.setDraft(encode(fields.map((field) => field())));
  };
}

function sameValues(
  a: readonly AndesFilterValue[],
  b: readonly AndesFilterValue[],
): boolean {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

/** A `YYYY-MM-DD` text as a local date, or `null` for an empty or malformed one. */
function isoToDate(iso: string): Date | null {
  const [year, month, day] = iso.split('-').map(Number);
  return year && month && day ? new Date(year, month - 1, day) : null;
}

/** A local date as `YYYY-MM-DD`. */
function dateToIso(value: unknown): string {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
    return '';
  }
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
}

/** Labels of the text filter's operators. */
export type AndesTextFilterOperatorLabels = Readonly<
  Record<AndesTextFilterOperator, string>
>;

const DEFAULT_OPERATOR_LABELS: AndesTextFilterOperatorLabels = {
  contains: 'Contains',
  equals: 'Equals',
  startsWith: 'Starts with',
  endsWith: 'Ends with',
  notContains: 'Does not contain',
};

/**
 * Text search filter body: an operator (contains, equals, starts with...) and a
 * query. Writes `[operator, text]` to the column's filter, or nothing while the
 * query is empty. Match rows with `andesTextFilter(row => row.name)`; a server
 * reads the same state with `andesReadTextFilter`. Enter applies.
 *
 * ```html
 * <andes-table-filter column="client" label="Filter client">
 *   <andes-table-text-filter placeholder="Client name" />
 * </andes-table-filter>
 * ```
 */
@Component({
  selector: 'andes-table-text-filter',
  imports: [
    AndesInput,
    AndesSelect,
    AndesSelectContent,
    AndesSelectItem,
    AndesSelectTrigger,
    AndesSelectValue,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: ANDES_TABLE_FILTER_PANEL, useExisting: AndesTableTextFilter },
  ],
  host: { class: 'andes-table-filter-panel' },
  styleUrl: './table-filter-panels.css',
  template: `
    @if (operators().length > 1) {
      <andes-select
        size="sm"
        [aria-label]="operatorLabel()"
        [value]="currentOperator()"
        (valueChange)="write(0, $any($event))"
      >
        <andes-select-trigger><andes-select-value /></andes-select-trigger>
        <andes-select-content>
          @for (operator of operators(); track operator) {
            <andes-select-item [value]="operator">
              {{ operatorLabels()[operator] }}
            </andes-select-item>
          }
        </andes-select-content>
      </andes-select>
    }
    <andes-input
      size="sm"
      autocomplete="off"
      [placeholder]="placeholder()"
      [aria-label]="placeholder()"
      [value]="text()"
      (valueChange)="write(1, $event ?? '')"
      (keydown.enter)="filter.confirm()"
    />
  `,
})
export class AndesTableTextFilter {
  protected readonly filter = inject(AndesTableFilter);

  /** Operators offered, in order; the first is the default. One hides the picker. */
  readonly operators = input<readonly AndesTextFilterOperator[]>([
    'contains',
    'equals',
    'startsWith',
  ]);

  /** Visible names of the operators. */
  readonly operatorLabels = input<AndesTextFilterOperatorLabels>(
    DEFAULT_OPERATOR_LABELS,
  );

  /** Accessible name of the operator picker. */
  readonly operatorLabel = input('Condition');

  /** Placeholder and accessible name of the query field. */
  readonly placeholder = input('Search');

  private readonly operator = signal('');
  protected readonly text = signal('');

  protected readonly currentOperator = computed(
    () => this.operator() || this.operators()[0] || 'contains',
  );

  protected readonly write = syncWithDraft(
    this.filter,
    [this.operator, this.text],
    ([operator, text]) =>
      text.trim()
        ? [operator || this.operators()[0] || 'contains', text.trim()]
        : [],
    (values) => {
      const state = andesReadTextFilter(values);
      return [state?.operator ?? this.operator(), state?.text ?? ''];
    },
  );
}

/**
 * Number range filter body: a minimum and a maximum, either left open. Writes
 * `[min, max]` (`null` for an open end), or nothing when both are empty.
 * Match rows with `andesRangeFilter(row => row.total)`; a server reads the same
 * state with `andesReadRangeFilter`. OK stays disabled while a field is not a
 * number or the minimum exceeds the maximum.
 */
@Component({
  selector: 'andes-table-range-filter',
  imports: [AndesInput],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: ANDES_TABLE_FILTER_PANEL, useExisting: AndesTableRangeFilter },
  ],
  host: {
    class: 'andes-table-filter-panel andes-table-filter-panel--pair',
  },
  styleUrl: './table-filter-panels.css',
  template: `
    <div class="andes-table-filter-panel__label">
      <span class="andes-table-filter-panel__caption" [id]="id + '-min'">{{
        minLabel()
      }}</span>
      <andes-input
        size="sm"
        inputmode="decimal"
        autocomplete="off"
        [aria-labelledby]="id + '-min'"
        [placeholder]="minPlaceholder()"
        [status]="minError() ? 'error' : undefined"
        [value]="min()"
        (valueChange)="write(0, $event ?? '')"
        (keydown.enter)="filter.confirm()"
      />
    </div>
    <div class="andes-table-filter-panel__label">
      <span class="andes-table-filter-panel__caption" [id]="id + '-max'">{{
        maxLabel()
      }}</span>
      <andes-input
        size="sm"
        inputmode="decimal"
        autocomplete="off"
        [aria-labelledby]="id + '-max'"
        [placeholder]="maxPlaceholder()"
        [status]="maxError() ? 'error' : undefined"
        [value]="max()"
        (valueChange)="write(1, $event ?? '')"
        (keydown.enter)="filter.confirm()"
      />
    </div>
  `,
})
export class AndesTableRangeFilter implements AndesTableFilterPanelHost {
  protected readonly filter = inject(AndesTableFilter);
  protected readonly id = `andes-table-range-${nextPanelId++}`;

  readonly minLabel = input('Min');
  readonly maxLabel = input('Max');
  readonly minPlaceholder = input('');
  readonly maxPlaceholder = input('');

  protected readonly min = signal('');
  protected readonly max = signal('');

  protected readonly write = syncWithDraft(
    this.filter,
    [this.min, this.max],
    ([min, max]) => {
      // A field that is not a number yet counts as open; OK stays disabled.
      const low = finiteOrNull(parseNumber(min));
      const high = finiteOrNull(parseNumber(max));
      return low === null && high === null ? [] : [low, high];
    },
    (values) => {
      const range = andesReadRangeFilter(values);
      return [
        range?.min === null || range?.min === undefined
          ? ''
          : String(range.min),
        range?.max === null || range?.max === undefined
          ? ''
          : String(range.max),
      ];
    },
  );

  private readonly bounds = computed(() => ({
    low: parseNumber(this.min()),
    high: parseNumber(this.max()),
  }));

  private readonly reversed = computed(() => {
    const { low, high } = this.bounds();
    return typeof low === 'number' && typeof high === 'number' && low > high;
  });

  protected readonly minError = computed(
    () => Number.isNaN(this.bounds().low) || this.reversed(),
  );
  protected readonly maxError = computed(
    () => Number.isNaN(this.bounds().high) || this.reversed(),
  );

  readonly invalid = computed(() => this.minError() || this.maxError());
}

function finiteOrNull(value: number | undefined): number | null {
  return value === undefined || Number.isNaN(value) ? null : value;
}

/**
 * A number from a field's text: `undefined` when empty, `NaN` when it is not a
 * number. Accepts a comma as the decimal separator.
 */
function parseNumber(text: string): number | undefined {
  const trimmed = text.trim();
  if (!trimmed) {
    return undefined;
  }
  const normalized = /^-?\d+,\d+$/.test(trimmed)
    ? trimmed.replace(',', '.')
    : trimmed;
  const value = Number(normalized);
  return Number.isFinite(value) ? value : NaN;
}

/**
 * Date range filter body: a first and a last day, either left open, picked with
 * the library date picker. Writes `[from, to]` as `YYYY-MM-DD` (`null` for an
 * open end), or nothing when both are empty. Match rows with
 * `andesDateRangeFilter(row => row.issued)`; a server reads the same state with
 * `andesReadDateRangeFilter`. Both days are inclusive.
 */
@Component({
  selector: 'andes-table-date-range-filter',
  imports: [AndesDatePicker],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: ANDES_TABLE_FILTER_PANEL,
      useExisting: AndesTableDateRangeFilter,
    },
  ],
  host: {
    class: 'andes-table-filter-panel andes-table-filter-panel--pair',
  },
  styleUrl: './table-filter-panels.css',
  template: `
    <div class="andes-table-filter-panel__label">
      <span class="andes-table-filter-panel__caption" [id]="id + '-from'">{{
        fromLabel()
      }}</span>
      <andes-date-picker
        size="sm"
        [aria-labelledby]="id + '-from'"
        [status]="invalid() ? 'error' : null"
        [value]="fromDate()"
        (valueChange)="write(0, dateText($event))"
      />
    </div>
    <div class="andes-table-filter-panel__label">
      <span class="andes-table-filter-panel__caption" [id]="id + '-to'">{{
        toLabel()
      }}</span>
      <andes-date-picker
        size="sm"
        [aria-labelledby]="id + '-to'"
        [status]="invalid() ? 'error' : null"
        [value]="toDate()"
        (valueChange)="write(1, dateText($event))"
      />
    </div>
  `,
})
export class AndesTableDateRangeFilter implements AndesTableFilterPanelHost {
  protected readonly filter = inject(AndesTableFilter);
  protected readonly id = `andes-table-date-range-${nextPanelId++}`;

  readonly fromLabel = input('From');
  readonly toLabel = input('To');

  protected readonly from = signal('');
  protected readonly to = signal('');

  protected readonly write = syncWithDraft(
    this.filter,
    [this.from, this.to],
    ([from, to]) => (from || to ? [from || null, to || null] : []),
    (values) => {
      const range = andesReadDateRangeFilter(values);
      return [range?.min ?? '', range?.max ?? ''];
    },
  );

  protected readonly fromDate = computed(() => isoToDate(this.from()));
  protected readonly toDate = computed(() => isoToDate(this.to()));
  protected readonly dateText = dateToIso;

  readonly invalid = computed(() => {
    const from = this.from();
    const to = this.to();
    return !!from && !!to && from > to;
  });
}
