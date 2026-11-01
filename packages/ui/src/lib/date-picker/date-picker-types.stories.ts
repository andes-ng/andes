import { FormsModule } from '@angular/forms';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';

import { AndesDatePicker, type AndesDatePickerValue } from './date-picker';

/**
 * Every story here shows the picker types side by side: `date`, `week`, `month`,
 * `quarter` and `year`, in single, range and multiple form, closed or with the panel open.
 */
// No `component` on the meta: Storybook assigns every story prop that is not an input to the
// first picker in the template, which would overwrite its own members (`range`, `time`,
// `placeholders`...). The picker is imported through a decorator instead.
const meta: Meta<AndesDatePicker> = {
  title: 'Data Entry/Date Picker/Types',
  decorators: [moduleMetadata({ imports: [AndesDatePicker] })],
  parameters: { layout: 'padded' },
  argTypes: {
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    variant: {
      control: 'select',
      options: ['outlined', 'filled', 'borderless', 'underlined'],
    },
    status: { control: 'select', options: [null, 'error', 'warning'] },
    disabled: { control: 'boolean' },
    allowClear: { control: 'boolean' },
  },
  args: {
    size: 'md',
    variant: 'outlined',
    status: null,
    disabled: false,
    allowClear: true,
  },
};

export default meta;

type Story = StoryObj<AndesDatePicker>;

const FEB_15 = new Date(2024, 1, 15);
const CAPTION =
  'margin: 0 0 0.375rem; font: 0.75rem/1.25rem var(--andes-font-family), sans-serif; color: var(--andes-color-muted-foreground);';
const TYPES = ['date', 'week', 'month', 'quarter', 'year'] as const;

const RANGES: Record<(typeof TYPES)[number], AndesDatePickerValue> = {
  date: [new Date(2024, 1, 5), new Date(2024, 1, 12)],
  week: [new Date(2024, 1, 5), new Date(2024, 1, 19)],
  month: [new Date(2024, 0, 1), new Date(2024, 3, 1)],
  quarter: [new Date(2024, 0, 1), new Date(2024, 6, 1)],
  year: [new Date(2022, 0, 1), new Date(2025, 0, 1)],
};

const MULTIPLES: Record<(typeof TYPES)[number], AndesDatePickerValue> = {
  date: [new Date(2024, 1, 2), new Date(2024, 1, 14), new Date(2024, 1, 20)],
  week: [new Date(2024, 1, 5), new Date(2024, 1, 19)],
  month: [new Date(2024, 0, 1), new Date(2024, 5, 1)],
  quarter: [new Date(2024, 0, 1), new Date(2024, 9, 1)],
  year: [new Date(2023, 0, 1), new Date(2025, 0, 1)],
};

/**
 * One field per `picker`: `date`, `week`, `month`, `quarter` and `year`. The value is
 * the first day of the chosen period and each type has its own display format. The
 * controls change every field at once.
 */
export const Basic: Story = {
  render: (args) => ({
    moduleMetadata: { imports: [FormsModule] },
    props: { ...args, types: TYPES, picked: FEB_15, caption: CAPTION },
    template: `<div style="display: flex; flex-wrap: wrap; gap: 1rem; align-items: flex-start;">
      @for (type of types; track type) {
        <div>
          <p [style]="caption">picker="{{ type }}"</p>
          <andes-date-picker [picker]="type" locale="en-US" [weekStartsOn]="1" [size]="size" [variant]="variant" [status]="status" [disabled]="disabled" [allowClear]="allowClear" [ngModel]="picked" [aria-label]="type" />
        </div>
      }
    </div>`,
  }),
};

/**
 * The same five types with their panels open, so each grid shows without a click: days,
 * weeks (the whole row is the selection, with its week number), months, quarters and
 * years (a decade).
 */
export const BasicOpen: Story = {
  render: () => ({
    moduleMetadata: { imports: [FormsModule] },
    props: { types: TYPES, picked: FEB_15, caption: CAPTION },
    template: `<div style="display: flex; flex-wrap: wrap; gap: 1rem 1.5rem; align-items: flex-start;">
      @for (type of types; track type) {
        <div style="width: 19rem; min-height: 26rem;">
          <p [style]="caption">picker="{{ type }}"</p>
          <andes-date-picker [picker]="type" locale="en-US" [weekStartsOn]="1" [ngModel]="picked" [open]="true" [aria-label]="type" />
        </div>
      }
    </div>`,
  }),
};

/**
 * Every type as a range (`mode="range"`): two inputs, and a panel with two grids side by
 * side. Months, quarters and years pick whole periods, so the range runs from the first
 * period to the last.
 */
export const RangeTypes: Story = {
  render: () => ({
    moduleMetadata: { imports: [FormsModule] },
    props: { types: TYPES, ranges: RANGES, caption: CAPTION },
    template: `<div style="display: flex; flex-wrap: wrap; gap: 1rem 1.5rem; align-items: flex-start;">
      @for (type of types; track type) {
        <div style="width: 22rem;">
          <p [style]="caption">picker="{{ type }}" mode="range"</p>
          <andes-date-picker style="width: 100%" mode="range" [picker]="type" locale="en-US" [weekStartsOn]="1" [ngModel]="ranges[type]" [aria-label]="type + ' range'" />
        </div>
      }
    </div>`,
  }),
};

/**
 * The day and week range panels open, each with a range already picked: the band runs
 * between the boundary chips, and hovering a day while the second boundary is open
 * previews the band it would close. A week range rounds both boundaries to whole weeks.
 */
export const RangeOpen: Story = {
  render: () => ({
    moduleMetadata: { imports: [FormsModule] },
    props: { ranges: RANGES, caption: CAPTION },
    template: `<div style="display: flex; flex-wrap: wrap; gap: 1rem 1.5rem; align-items: flex-start;">
      @for (type of ['date', 'week']; track type) {
        <div style="width: 38rem; min-height: 26rem;">
          <p [style]="caption">picker="{{ type }}" mode="range"</p>
          <andes-date-picker mode="range" [picker]="type" locale="en-US" [weekStartsOn]="1" [ngModel]="ranges[type]" [open]="true" [aria-label]="type + ' range'" />
        </div>
      }
    </div>`,
  }),
};

/**
 * The month, quarter and year range panels open: whole periods, so the band runs from
 * the first chip to the last, and the chevrons step by year (months, quarters) or by
 * decade (years).
 */
export const RangeOpenPeriods: Story = {
  render: () => ({
    moduleMetadata: { imports: [FormsModule] },
    props: { ranges: RANGES, caption: CAPTION },
    template: `<div style="display: flex; flex-wrap: wrap; gap: 1rem 1.5rem; align-items: flex-start;">
      @for (type of ['month', 'quarter', 'year']; track type) {
        <div style="width: 19rem; min-height: 22rem;">
          <p [style]="caption">picker="{{ type }}" mode="range"</p>
          <andes-date-picker mode="range" [picker]="type" locale="en-US" [ngModel]="ranges[type]" [open]="true" [aria-label]="type + ' range'" style="width: 100%" />
        </div>
      }
    </div>`,
  }),
};

/**
 * `mode="multiple"` with every type: each pick toggles a period and the field lists them
 * as tags, in order, in the type's own format.
 */
export const MultipleTypes: Story = {
  render: () => ({
    moduleMetadata: { imports: [FormsModule] },
    props: { types: TYPES, values: MULTIPLES, caption: CAPTION },
    template: `<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(18rem, 1fr)); gap: 1rem; align-items: start;">
      @for (type of types; track type) {
        <div>
          <p [style]="caption">picker="{{ type }}" mode="multiple"</p>
          <andes-date-picker style="width: 100%" mode="multiple" [picker]="type" locale="en-US" [weekStartsOn]="1" [ngModel]="values[type]" [maxTagCount]="2" [aria-label]="type + ' multiple'" />
        </div>
      }
    </div>`,
  }),
};

/**
 * `needConfirm` holds a pick until OK. It is off for a plain date (first column: the
 * field changes on the click) and on once forced (second: an OK button appears and
 * closing any other way drops the pick); the third column does the same for ranges.
 */
export const NeedConfirmTypes: Story = {
  render: () => ({
    moduleMetadata: { imports: [FormsModule] },
    props: { types: TYPES, picked: FEB_15, caption: CAPTION },
    template: `<div style="display: grid; grid-template-columns: repeat(3, minmax(0, 18rem)); gap: 0.75rem 1.5rem; align-items: start; align-content: start; min-height: 32rem;">
      <p [style]="caption">needConfirm off (default)</p>
      <p [style]="caption">needConfirm</p>
      <p [style]="caption">range with needConfirm</p>
      @for (type of types; track type) {
        <andes-date-picker style="width: 100%" [picker]="type" locale="en-US" [weekStartsOn]="1" [needConfirm]="false" [ngModel]="picked" [aria-label]="type + ' without confirm'" />
        <andes-date-picker style="width: 100%" [picker]="type" locale="en-US" [weekStartsOn]="1" needConfirm [ngModel]="picked" [aria-label]="type + ' with confirm'" />
        <andes-date-picker style="width: 100%" mode="range" [picker]="type" locale="en-US" [weekStartsOn]="1" needConfirm [aria-label]="type + ' range with confirm'" />
      }
    </div>`,
  }),
};

/**
 * Quarter and year ranges, open. The quarter panel steps by year and the year panel by
 * decade; `min` and `max` grey out what is out of bounds in both.
 */
export const QuarterAndYearRanges: Story = {
  render: () => ({
    moduleMetadata: { imports: [FormsModule] },
    props: {
      quarters: RANGES['quarter'],
      years: RANGES['year'],
      earliest: new Date(2021, 3, 1),
      latest: new Date(2026, 8, 30),
      caption: CAPTION,
    },
    template: `<div style="display: flex; flex-wrap: wrap; gap: 1rem 1.5rem; align-items: flex-start;">
      <div style="width: 38rem; min-height: 20rem;">
        <p [style]="caption">Quarter range, April 2021 to September 2026</p>
        <andes-date-picker mode="range" picker="quarter" locale="en-US" [min]="earliest" [max]="latest" [ngModel]="quarters" [open]="true" aria-label="Quarter range" />
      </div>
      <div style="width: 38rem; min-height: 24rem;">
        <p [style]="caption">Year range, 2021 to 2026</p>
        <andes-date-picker mode="range" picker="year" locale="en-US" [min]="earliest" [max]="latest" [ngModel]="years" [open]="true" aria-label="Year range" />
      </div>
    </div>`,
  }),
};

/**
 * Year navigation. The year grid shows a decade and its double chevrons step by decade
 * (first picker); `min` and `max` stop the chevrons at the bounds (second: 2015 to
 * 2034, so only the two middle decades can be reached); `captionLayout="dropdown-years"`
 * lets a day picker jump straight to a year (third).
 */
export const DecadeNavigation: Story = {
  render: () => ({
    moduleMetadata: { imports: [FormsModule] },
    props: {
      year: new Date(2024, 0, 1),
      earliest: new Date(2015, 0, 1),
      latest: new Date(2034, 11, 31),
      caption: CAPTION,
    },
    template: `<div style="display: flex; flex-wrap: wrap; gap: 1rem 1.5rem; align-items: flex-start;">
      <div style="width: 19rem; min-height: 22rem;">
        <p [style]="caption">Unbounded</p>
        <andes-date-picker picker="year" locale="en-US" [ngModel]="year" [open]="true" aria-label="Year" />
      </div>
      <div style="width: 19rem; min-height: 22rem;">
        <p [style]="caption">min 2015, max 2034</p>
        <andes-date-picker picker="year" locale="en-US" [min]="earliest" [max]="latest" [ngModel]="year" [open]="true" aria-label="Bounded year" />
      </div>
      <div style="width: 19rem; min-height: 22rem;">
        <p [style]="caption">Year select in a day picker</p>
        <andes-date-picker locale="en-US" captionLayout="dropdown-years" [startYear]="2015" [endYear]="2034" [ngModel]="year" [open]="true" aria-label="Day with year select" />
      </div>
    </div>`,
  }),
};

/**
 * `weekStartsOn` sets the first column (0 Sunday, 1 Monday): the days of a date picker
 * and the rows a week picker selects both follow it. `showWeek` adds the week number to
 * the day grid, counted from the same first day.
 */
export const WeekStartAndNumbers: Story = {
  render: () => ({
    moduleMetadata: { imports: [FormsModule] },
    props: { picked: FEB_15, caption: CAPTION },
    template: `<div style="display: flex; flex-wrap: wrap; gap: 1rem 1.5rem; align-items: flex-start;">
      <div style="width: 19rem; min-height: 27rem;">
        <p [style]="caption">Week picker, starts on Sunday</p>
        <andes-date-picker picker="week" locale="en-US" [weekStartsOn]="0" [ngModel]="picked" [open]="true" aria-label="Week from Sunday" />
      </div>
      <div style="width: 19rem; min-height: 27rem;">
        <p [style]="caption">Week picker, starts on Monday</p>
        <andes-date-picker picker="week" locale="en-US" [weekStartsOn]="1" [ngModel]="picked" [open]="true" aria-label="Week from Monday" />
      </div>
      <div style="width: 21rem; min-height: 27rem;">
        <p [style]="caption">Dates with showWeek, from Monday</p>
        <andes-date-picker locale="en-US" showWeek [weekStartsOn]="1" [ngModel]="picked" [open]="true" aria-label="Date with week numbers" />
      </div>
      <div style="width: 21rem; min-height: 27rem;">
        <p [style]="caption">Dates, from Saturday</p>
        <andes-date-picker locale="en-US" [weekStartsOn]="6" [ngModel]="picked" [open]="true" aria-label="Date from Saturday" />
      </div>
    </div>`,
  }),
};

/**
 * `fixedWeeks` keeps the panel six weeks tall so it does not jump while paging (the
 * default); turned off, February 2026 shrinks to its four weeks. `showOutsideDays` shows
 * or hides the neighbouring months' days that fill the first and last rows.
 */
export const FixedMonthGrid: Story = {
  render: () => ({
    moduleMetadata: { imports: [FormsModule] },
    props: {
      month: new Date(2026, 1, 1),
      picked: new Date(2026, 1, 11),
      caption: CAPTION,
    },
    template: `<div style="display: flex; flex-wrap: wrap; gap: 1rem 1.5rem; align-items: flex-start;">
      <div style="width: 19rem; min-height: 27rem;">
        <p [style]="caption">fixedWeeks (default)</p>
        <andes-date-picker locale="en-US" [defaultMonth]="month" [ngModel]="picked" [open]="true" aria-label="Fixed weeks" />
      </div>
      <div style="width: 19rem; min-height: 27rem;">
        <p [style]="caption">fixedWeeks off</p>
        <andes-date-picker locale="en-US" [fixedWeeks]="false" [defaultMonth]="month" [ngModel]="picked" [open]="true" aria-label="Fluid weeks" />
      </div>
      <div style="width: 19rem; min-height: 27rem;">
        <p [style]="caption">showOutsideDays off</p>
        <andes-date-picker locale="en-US" [showOutsideDays]="false" [fixedWeeks]="false" [defaultMonth]="month" [ngModel]="picked" [open]="true" aria-label="Without outside days" />
      </div>
      <div style="width: 40rem; min-height: 27rem;">
        <p [style]="caption">numberOfMonths 2</p>
        <andes-date-picker locale="en-US" [numberOfMonths]="2" [defaultMonth]="month" [ngModel]="picked" [open]="true" aria-label="Two months" />
      </div>
    </div>`,
  }),
};
