import { FormsModule } from '@angular/forms';
import type { Meta, StoryObj } from '@storybook/angular';

import {
  AndesDatePicker,
  type AndesDatePickerValue,
  type AndesDisabledTime,
} from './date-picker';

/**
 * What can and cannot be picked: `min`/`max` bounds (which also stop the panel's
 * navigation), `dateDisabled` predicates (which receive the picker type and, while a
 * range's end is picked, the start already chosen as `from`), `timeDisabled`, and
 * `allowEmpty` for open-ended ranges. Each story runs the rule across the picker types.
 */
const meta: Meta<AndesDatePicker> = {
  title: 'Data Entry/Date Picker/Limits',
  component: AndesDatePicker,
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<AndesDatePicker>;

interface DisabledInfo {
  readonly type: string;
  readonly from?: Date;
}

const FEB_15 = new Date(2024, 1, 15);
const FEB = new Date(2024, 1, 1);
const DAY = 86_400_000;
const CAPTION =
  'margin: 0 0 0.375rem; font: 0.75rem/1.25rem var(--andes-font-family), sans-serif; color: var(--andes-color-muted-foreground);';
const TYPES = ['date', 'week', 'month', 'quarter', 'year'] as const;

const key = (date: Date) =>
  `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
const monthIndex = (date: Date) => date.getFullYear() * 12 + date.getMonth();
const startOfToday = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

/**
 * `min` and `max` for every type, closed. Each field has its own bounds (shown in the
 * caption): days outside them are greyed out in the panel, and typing a value outside
 * them is rejected.
 */
export const LimitDateRange: Story = {
  render: () => ({
    moduleMetadata: { imports: [FormsModule] },
    props: {
      cases: [
        {
          type: 'date',
          label: 'date: Feb 8 to Feb 22, 2024',
          min: new Date(2024, 1, 8),
          max: new Date(2024, 1, 22),
        },
        {
          type: 'week',
          label: 'week: Feb 5 to Mar 3, 2024',
          min: new Date(2024, 1, 5),
          max: new Date(2024, 2, 3),
        },
        {
          type: 'month',
          label: 'month: Mar to Sep 2024',
          min: new Date(2024, 2, 1),
          max: new Date(2024, 8, 30),
        },
        {
          type: 'quarter',
          label: 'quarter: Q2 2024 to Q1 2025',
          min: new Date(2024, 3, 1),
          max: new Date(2025, 2, 31),
        },
        {
          type: 'year',
          label: 'year: 2022 to 2026',
          min: new Date(2022, 0, 1),
          max: new Date(2026, 11, 31),
        },
      ],
      febMonth: FEB,
      caption: CAPTION,
    },
    template: `<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(20rem, 1fr)); gap: 1rem 1.5rem; align-items: start; align-content: start; min-height: 30rem;">
      @for (case of cases; track case.type) {
        <div>
          <p [style]="caption">Single, {{ case.label }}</p>
          <andes-date-picker style="width: 100%" [picker]="case.type" locale="en-US" [weekStartsOn]="1" [min]="case.min" [max]="case.max" [defaultMonth]="febMonth" [aria-label]="case.type + ' within bounds'" />
        </div>
        <div>
          <p [style]="caption">Range, same bounds</p>
          <andes-date-picker style="width: 100%" mode="range" [picker]="case.type" locale="en-US" [weekStartsOn]="1" [min]="case.min" [max]="case.max" [defaultMonth]="febMonth" [aria-label]="case.type + ' range within bounds'" />
        </div>
      }
    </div>`,
  }),
};

/**
 * Bounds also stop the navigation: with `min` and `max` in the same month (first
 * picker) both month chevrons are disabled; with a two-month window (second) only one
 * direction is left; the month grid (third) and the year grid (fourth) disable the
 * chevrons and the cells outside the window, and the double chevrons stop at the bounds.
 */
export const MinMaxNavigation: Story = {
  render: () => ({
    moduleMetadata: { imports: [FormsModule] },
    props: {
      picked: FEB_15,
      caption: CAPTION,
      sameMonth: { min: new Date(2024, 1, 5), max: new Date(2024, 1, 25) },
      twoMonths: { min: new Date(2024, 1, 5), max: new Date(2024, 2, 20) },
      monthWindow: { min: new Date(2024, 0, 1), max: new Date(2024, 4, 31) },
      yearWindow: { min: new Date(2021, 0, 1), max: new Date(2027, 11, 31) },
    },
    template: `<div style="display: flex; flex-wrap: wrap; gap: 1rem 1.5rem; align-items: flex-start;">
      <div style="width: 19rem; min-height: 25rem;">
        <p [style]="caption">Same month</p>
        <andes-date-picker locale="en-US" [min]="sameMonth.min" [max]="sameMonth.max" [ngModel]="picked" [open]="true" aria-label="Same month" />
      </div>
      <div style="width: 19rem; min-height: 25rem;">
        <p [style]="caption">Feb 5 to Mar 20</p>
        <andes-date-picker locale="en-US" [min]="twoMonths.min" [max]="twoMonths.max" [ngModel]="picked" [open]="true" aria-label="Two months" />
      </div>
      <div style="width: 19rem; min-height: 25rem;">
        <p [style]="caption">Months, Jan to May</p>
        <andes-date-picker picker="month" locale="en-US" [min]="monthWindow.min" [max]="monthWindow.max" [ngModel]="picked" [open]="true" aria-label="Month window" />
      </div>
      <div style="width: 19rem; min-height: 25rem;">
        <p [style]="caption">Years, 2021 to 2027</p>
        <andes-date-picker picker="year" locale="en-US" [min]="yearWindow.min" [max]="yearWindow.max" [ngModel]="picked" [open]="true" aria-label="Year window" />
      </div>
    </div>`,
  }),
};

/**
 * `dateDisabled` receives `info.from`, the start already picked, while a range's end is
 * chosen, so the rule can depend on it. Left: at most 7 days. Middle: at most 6 months
 * (pick a start, then page forward: the days beyond six months are disabled). Right: a
 * minimum stay of three nights. A month range can be limited the same way, in months.
 */
export const SelectRangeDates: Story = {
  render: () => ({
    props: {
      sevenDays: (date: Date, info: DisabledInfo) =>
        !!info.from && Math.abs(date.getTime() - info.from.getTime()) > 7 * DAY,
      sixMonths: (date: Date, info: DisabledInfo) => {
        if (!info.from) return false;
        const last = new Date(info.from);
        last.setMonth(last.getMonth() + 6);
        const first = new Date(info.from);
        first.setMonth(first.getMonth() - 6);
        return date > last || date < first;
      },
      threeNights: (date: Date, info: DisabledInfo) =>
        !!info.from &&
        date.getTime() !== info.from.getTime() &&
        Math.abs(date.getTime() - info.from.getTime()) < 3 * DAY,
      monthsWithinHalfYear: (date: Date, info: DisabledInfo) =>
        !!info.from && Math.abs(monthIndex(date) - monthIndex(info.from)) > 5,
      weeksWithinMonth: (date: Date, info: DisabledInfo) =>
        !!info.from &&
        Math.abs(date.getTime() - info.from.getTime()) > 28 * DAY,
      febMonth: FEB,
      caption: CAPTION,
    },
    template: `<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(21rem, 1fr)); gap: 1rem 1.5rem; align-items: start; align-content: start; min-height: 30rem;">
      <div>
        <p [style]="caption">At most 7 days</p>
        <andes-date-picker style="width: 100%" mode="range" locale="en-US" [dateDisabled]="sevenDays" [defaultMonth]="febMonth" aria-label="Up to 7 days" />
      </div>
      <div>
        <p [style]="caption">At most 6 months</p>
        <andes-date-picker style="width: 100%" mode="range" locale="en-US" [dateDisabled]="sixMonths" [defaultMonth]="febMonth" aria-label="Up to 6 months" />
      </div>
      <div>
        <p [style]="caption">At least 3 nights</p>
        <andes-date-picker style="width: 100%" mode="range" locale="en-US" [dateDisabled]="threeNights" [defaultMonth]="febMonth" aria-label="Three nights or more" />
      </div>
      <div>
        <p [style]="caption">Months, at most 6</p>
        <andes-date-picker style="width: 100%" mode="range" picker="month" locale="en-US" [dateDisabled]="monthsWithinHalfYear" aria-label="Up to 6 months, by month" />
      </div>
      <div>
        <p [style]="caption">Weeks, at most 4</p>
        <andes-date-picker style="width: 100%" mode="range" picker="week" locale="en-US" [weekStartsOn]="1" [dateDisabled]="weeksWithinMonth" [defaultMonth]="febMonth" aria-label="Up to 4 weeks" />
      </div>
    </div>`,
  }),
};

/**
 * Weekends, holidays and both, in open panels. The predicate gets every cell's date, so
 * it can read the weekday or look the date up (here February 5 and 19, 2024). The right
 * panel is a range: a disabled day cannot start or end it, but it can sit inside.
 */
export const DisabledWeekendsAndHolidays: Story = {
  render: () => ({
    props: {
      weekends: (date: Date) => date.getDay() === 0 || date.getDay() === 6,
      holidays: (date: Date) => ['2024-2-5', '2024-2-19'].includes(key(date)),
      both: (date: Date) =>
        date.getDay() === 0 ||
        date.getDay() === 6 ||
        ['2024-2-5', '2024-2-19'].includes(key(date)),
      febMonth: FEB,
      caption: CAPTION,
    },
    template: `<div style="display: flex; flex-wrap: wrap; gap: 1rem 1.5rem; align-items: flex-start;">
      <div style="width: 19rem; min-height: 25rem;">
        <p [style]="caption">Weekends</p>
        <andes-date-picker locale="en-US" [weekStartsOn]="1" [dateDisabled]="weekends" [defaultMonth]="febMonth" [open]="true" aria-label="No weekends" />
      </div>
      <div style="width: 19rem; min-height: 25rem;">
        <p [style]="caption">Holidays</p>
        <andes-date-picker locale="en-US" [weekStartsOn]="1" [dateDisabled]="holidays" [defaultMonth]="febMonth" [open]="true" aria-label="No holidays" />
      </div>
      <div style="width: 38rem; min-height: 25rem;">
        <p [style]="caption">Range, weekends and holidays</p>
        <andes-date-picker mode="range" locale="en-US" [weekStartsOn]="1" [dateDisabled]="both" [defaultMonth]="febMonth" [open]="true" aria-label="Working days range" />
      </div>
    </div>`,
  }),
};

/**
 * Past and future only, for every type: `dateDisabled` compares each cell's first day
 * with today, so a month or year is disabled only once it has passed completely.
 * Left column: no past dates. Right column: no future dates.
 */
export const DisabledBeforeToday: Story = {
  render: () => ({
    props: {
      types: TYPES,
      past: (date: Date, info: DisabledInfo) => {
        const today = startOfToday();
        const end = {
          date: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
          week: new Date(date.getTime() + 6 * DAY),
          month: new Date(date.getFullYear(), date.getMonth() + 1, 0),
          quarter: new Date(date.getFullYear(), date.getMonth() + 3, 0),
          year: new Date(date.getFullYear(), 11, 31),
        }[info.type as (typeof TYPES)[number]];
        return end < today;
      },
      future: (date: Date) => date > startOfToday(),
      caption: CAPTION,
    },
    template: `<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr)); gap: 0.75rem 1.5rem; align-items: start; align-content: start; min-height: 30rem;">
      <p [style]="caption">No past dates</p>
      <p [style]="caption">No future dates</p>
      @for (type of types; track type) {
        <andes-date-picker style="width: 100%" [picker]="type" locale="en-US" [weekStartsOn]="1" [dateDisabled]="past" [aria-label]="type + ' not before today'" />
        <andes-date-picker style="width: 100%" [picker]="type" locale="en-US" [weekStartsOn]="1" [dateDisabled]="future" [aria-label]="type + ' not after today'" />
      }
    </div>`,
  }),
};

/**
 * Disabling whole periods in the week, month, quarter and year grids, open. The predicate
 * is called once per cell with the cell's first day and `info.type`: here weeks before
 * February 12, the odd months of the year, the first and third quarters, and the years
 * before 2023 or after 2027.
 */
export const DisabledPeriods: Story = {
  render: () => ({
    moduleMetadata: { imports: [FormsModule] },
    props: {
      picked: FEB_15,
      noEarlyWeeks: (date: Date) => date < new Date(2024, 1, 12),
      evenMonths: (date: Date) => date.getMonth() % 2 === 0,
      evenQuarters: (date: Date) => Math.floor(date.getMonth() / 3) % 2 === 0,
      inWindow: (date: Date) =>
        date.getFullYear() < 2023 || date.getFullYear() > 2027,
      caption: CAPTION,
    },
    template: `<div style="display: flex; flex-wrap: wrap; gap: 1rem 1.5rem; align-items: flex-start;">
      <div style="width: 19rem; min-height: 25rem;">
        <p [style]="caption">Weeks from February 12</p>
        <andes-date-picker picker="week" locale="en-US" [weekStartsOn]="1" [dateDisabled]="noEarlyWeeks" [ngModel]="picked" [open]="true" aria-label="Late weeks" />
      </div>
      <div style="width: 19rem; min-height: 25rem;">
        <p [style]="caption">Even months only</p>
        <andes-date-picker picker="month" locale="en-US" [dateDisabled]="evenMonths" [ngModel]="picked" [open]="true" aria-label="Even months" />
      </div>
      <div style="width: 19rem; min-height: 25rem;">
        <p [style]="caption">Q2 and Q4 only</p>
        <andes-date-picker picker="quarter" locale="en-US" [dateDisabled]="evenQuarters" [ngModel]="picked" [open]="true" aria-label="Quarters 2 and 4" />
      </div>
      <div style="width: 19rem; min-height: 25rem;">
        <p [style]="caption">2023 to 2027</p>
        <andes-date-picker picker="year" locale="en-US" [dateDisabled]="inWindow" [ngModel]="picked" [open]="true" aria-label="Years in window" />
      </div>
    </div>`,
  }),
};

/**
 * Date and time together: `timeDisabled` rules out time options per date and, in a range,
 * per side (`info.side`, and `info.from` while the end is picked). Left: weekends are off
 * and the working day is 09:00 to 17:45 with the unavailable options listed as disabled.
 * Middle: the same with `hideDisabledOptions`, which leaves them out of the columns. Right:
 * a range whose end cannot be earlier than its start on the same day.
 */
export const DisabledDateAndTime: Story = {
  render: () => ({
    moduleMetadata: { imports: [FormsModule] },
    props: {
      weekends: (date: Date) => date.getDay() === 0 || date.getDay() === 6,
      officeHours: (): AndesDisabledTime => ({
        disabledHours: () => [
          0, 1, 2, 3, 4, 5, 6, 7, 8, 18, 19, 20, 21, 22, 23,
        ],
        disabledMinutes: (hour: number) => (hour === 17 ? [45, 50, 55] : []),
      }),
      hidden: { hideDisabledOptions: true, minuteStep: 15 },
      afterStart: (
        date: Date | null,
        info: { side: 'start' | 'end'; from?: Date },
      ): AndesDisabledTime | null => {
        if (info.side !== 'end' || !info.from || !date) return null;
        const sameDay =
          date.getFullYear() === info.from.getFullYear() &&
          date.getMonth() === info.from.getMonth() &&
          date.getDate() === info.from.getDate();
        if (!sameDay) return null;
        const hour = info.from.getHours();
        return {
          disabledHours: () =>
            Array.from({ length: hour }, (_, index) => index),
          disabledMinutes: (picked: number) =>
            picked === hour
              ? Array.from(
                  { length: info.from?.getMinutes() ?? 0 },
                  (_, i) => i,
                )
              : [],
        };
      },
      picked: new Date(2024, 1, 15, 10, 30),
      febMonth: FEB,
      caption: CAPTION,
    },
    template: `<div style="display: flex; flex-wrap: wrap; gap: 1rem 1.5rem; align-items: flex-start;">
      <div style="width: 30rem; min-height: 27rem;">
        <p [style]="caption">Working days and hours</p>
        <andes-date-picker locale="en-GB" showTime [weekStartsOn]="1" [dateDisabled]="weekends" [timeDisabled]="officeHours" [value]="picked" [open]="true" aria-label="Appointment" />
      </div>
      <div style="width: 30rem; min-height: 27rem;">
        <p [style]="caption">hideDisabledOptions, 15 minutes</p>
        <andes-date-picker locale="en-GB" [showTime]="hidden" [weekStartsOn]="1" [dateDisabled]="weekends" [timeDisabled]="officeHours" [value]="picked" [open]="true" aria-label="Appointment, hidden options" />
      </div>
      <div style="width: 100%; min-height: 28rem;">
        <p [style]="caption">Range: the end cannot be before the start on the same day</p>
        <andes-date-picker mode="range" locale="en-GB" showTime [weekStartsOn]="1" [timeDisabled]="afterStart" [defaultMonth]="febMonth" aria-label="Reservation window" />
      </div>
    </div>`,
  }),
};

const HALF_OPEN: Record<(typeof TYPES)[number], AndesDatePickerValue> = {
  date: [new Date(2024, 1, 5), null],
  week: [null, new Date(2024, 1, 19)],
  month: [new Date(2024, 0, 1), null],
  quarter: [null, new Date(2024, 6, 1)],
  year: [new Date(2022, 0, 1), null],
};

/**
 * `allowEmpty` lets one side of a range stay empty: `[true, false]` allows an open end
 * ("from"), `[false, true]` an open start ("until"). A half range is committed as soon as
 * its other side is picked. Each type below starts with one side set; the last row is a
 * date and time range, with an open end.
 */
export const AllowEmptyTypes: Story = {
  render: () => ({
    moduleMetadata: { imports: [FormsModule] },
    props: {
      types: TYPES,
      values: HALF_OPEN,
      endMayBeEmpty: [false, true] as const,
      startMayBeEmpty: [true, false] as const,
      time: [new Date(2024, 1, 5, 9, 0), null],
      caption: CAPTION,
    },
    template: `<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(21rem, 1fr)); gap: 1rem 1.5rem; align-items: start; align-content: start; min-height: 30rem;">
      @for (type of types; track type) {
        <div>
          <p [style]="caption">picker="{{ type }}", {{ values[type][0] ? 'start set, end may stay empty' : 'end set, start may stay empty' }}</p>
          <andes-date-picker style="width: 100%" mode="range" [picker]="type" locale="en-US" [weekStartsOn]="1" [allowEmpty]="values[type][0] ? endMayBeEmpty : startMayBeEmpty" [ngModel]="values[type]" [aria-label]="type + ' open-ended range'" />
        </div>
      }
      <div>
        <p [style]="caption">Date and time, start set, end may stay empty</p>
        <andes-date-picker style="width: 100%" mode="range" locale="en-GB" showTime [allowEmpty]="endMayBeEmpty" [ngModel]="time" aria-label="Open-ended date and time range" />
      </div>
    </div>`,
  }),
};
