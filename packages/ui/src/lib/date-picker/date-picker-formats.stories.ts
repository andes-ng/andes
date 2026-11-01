import { JsonPipe } from '@angular/common';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';

import {
  AndesDatePicker,
  type AndesDatePickerType,
  type AndesDatePickerValue,
} from './date-picker';

/**
 * How a value reads in the field and how typed text is understood: token `format`
 * strings (one, a list, a function, or a mask), `displayFormat` for `Intl` options, and
 * the time of day a picked date carries with `showTime`. Each story runs the formats
 * across the picker types and, where it makes sense, across single and range.
 */
// No `component` on the meta: Storybook assigns every story prop that is not an input to the
// first picker in the template, which would overwrite its own members (`range`, `time`,
// `placeholders`...). The picker is imported through a decorator instead.
const meta: Meta<AndesDatePicker> = {
  title: 'Data Entry/Date Picker/Formats',
  decorators: [moduleMetadata({ imports: [AndesDatePicker] })],
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<AndesDatePicker>;

const FEB_15 = new Date(2024, 1, 15);
const MONO = 'margin: 0; font: 0.75rem/1.5 ui-monospace, monospace;';
const CAPTION =
  'margin: 0 0 0.375rem; font: 0.75rem/1.25rem var(--andes-font-family), sans-serif; color: var(--andes-color-muted-foreground);';

const RANGES: Readonly<Record<string, AndesDatePickerValue>> = {
  date: [new Date(2024, 1, 5), new Date(2024, 1, 12)],
  week: [new Date(2024, 1, 5), new Date(2024, 1, 19)],
  month: [new Date(2024, 0, 1), new Date(2024, 3, 1)],
  quarter: [new Date(2024, 0, 1), new Date(2024, 6, 1)],
  year: [new Date(2022, 0, 1), new Date(2025, 0, 1)],
};

interface FormatCase {
  readonly picker: AndesDatePickerType;
  readonly label: string;
  readonly format: string | readonly string[];
}

/**
 * `format` as a token string, per type, in a single and a range picker that share it.
 * The same pattern displays the value and reads typed text back. Tokens are `YYYY`, `Q`,
 * `MMMM`/`MMM`/`MM`, `DD`/`D`, `dddd`/`ddd`, `ww`, `HH`/`hh`, `mm`, `ss`, `A` and
 * `[literal text]`.
 */
export const CustomFormats: Story = {
  render: () => ({
    moduleMetadata: { imports: [FormsModule] },
    props: {
      cases: [
        { picker: 'date', label: 'DD/MM/YYYY', format: 'DD/MM/YYYY' },
        {
          picker: 'date',
          label: 'dddd, D MMMM YYYY',
          format: 'dddd, D MMMM YYYY',
        },
        { picker: 'date', label: 'YYYY/MM/DD', format: 'YYYY/MM/DD' },
        { picker: 'week', label: '[Week] ww, YYYY', format: '[Week] ww, YYYY' },
        { picker: 'week', label: 'YYYY-[W]ww (default)', format: 'YYYY-[W]ww' },
        { picker: 'month', label: 'MMMM YYYY', format: 'MMMM YYYY' },
        { picker: 'month', label: 'MM/YYYY', format: 'MM/YYYY' },
        { picker: 'quarter', label: 'YYYY [Q]Q', format: 'YYYY [Q]Q' },
        { picker: 'quarter', label: '[Q]Q / YYYY', format: '[Q]Q / YYYY' },
        { picker: 'year', label: '[Year] YYYY', format: '[Year] YYYY' },
        { picker: 'year', label: 'YY', format: 'YY' },
      ] satisfies FormatCase[],
      ranges: RANGES,
      picked: FEB_15,
      caption: CAPTION,
    },
    template: `<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(26rem, 1fr)); gap: 1rem 1.5rem; align-items: start; align-content: start; min-height: 32rem;">
      @for (case of cases; track case.label) {
        <div>
          <p [style]="caption">picker="{{ case.picker }}", format "{{ case.label }}"</p>
          <andes-date-picker style="width: 100%" [picker]="case.picker" locale="en-US" [weekStartsOn]="1" [format]="case.format" [ngModel]="picked" [aria-label]="case.label" />
        </div>
        <div>
          <p [style]="caption">Range, same format</p>
          <andes-date-picker style="width: 100%" mode="range" [picker]="case.picker" locale="en-US" [weekStartsOn]="1" [format]="case.format" [ngModel]="ranges[case.picker]" [aria-label]="case.label + ' range'" />
        </div>
      }
    </div>`,
  }),
};

/**
 * `format` as a list: the first pattern displays the value and every pattern parses what
 * is typed, so `15/02/2024`, `15/02/24` and `2024-02-15` all land on the same day (type
 * one and press Enter or Tab). Each type has its own list, and a range reads each input
 * with the same list.
 */
export const FormatArrays: Story = {
  render: () => ({
    moduleMetadata: { imports: [ReactiveFormsModule, FormsModule, JsonPipe] },
    props: {
      cases: [
        {
          picker: 'date',
          formats: ['DD/MM/YYYY', 'DD/MM/YY', 'YYYY-MM-DD'],
        },
        { picker: 'week', formats: ['YYYY-[W]ww', 'ww/YYYY'] },
        { picker: 'month', formats: ['MMM YYYY', 'MM/YYYY', 'YYYY-MM'] },
        { picker: 'quarter', formats: ['YYYY-[Q]Q', '[Q]Q/YYYY'] },
        { picker: 'year', formats: ['YYYY', 'YY'] },
      ] satisfies { picker: AndesDatePickerType; formats: string[] }[],
      control: new FormControl<AndesDatePickerValue>(FEB_15),
      picked: FEB_15,
      ranges: RANGES,
      mono: MONO,
      caption: CAPTION,
    },
    template: `<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(21rem, 1fr)); gap: 1rem 1.5rem; align-items: start; align-content: start;">
      @for (case of cases; track case.picker) {
        <div>
          <p [style]="caption">{{ case.picker }}: {{ case.formats.join('  |  ') }}</p>
          <andes-date-picker style="width: 100%" [picker]="case.picker" locale="en-GB" [weekStartsOn]="1" [format]="case.formats" [ngModel]="picked" [aria-label]="case.picker + ' with several formats'" />
        </div>
        <div>
          <p [style]="caption">Range, same list</p>
          <andes-date-picker style="width: 100%" mode="range" [picker]="case.picker" locale="en-GB" [weekStartsOn]="1" [format]="case.formats" [ngModel]="ranges[case.picker]" [aria-label]="case.picker + ' range with several formats'" />
        </div>
      }
      <div>
        <p [style]="caption">The value behind the first field</p>
        <andes-date-picker style="width: 100%" locale="en-GB" [format]="cases[0].formats" [formControl]="control" aria-label="Date with a form control" />
        <pre [style]="mono">{{ control.value | json }}</pre>
      </div>
    </div>`,
  }),
};

/**
 * `format` as a function: it formats the value however it likes (a weekday and a week
 * number, an ISO range label, a padded quarter) but cannot be inverted, so typing falls
 * back to ISO dates (`2024-02-15`). Multiple pickers format every tag with it.
 */
export const FormatFunction: Story = {
  render: () => ({
    moduleMetadata: { imports: [FormsModule] },
    props: {
      weekdayDate: (date: Date) =>
        `${date.toLocaleDateString('en-US', { weekday: 'short' })} ${date.getDate()}/${date.getMonth() + 1}`,
      isoWeek: (date: Date) => `Week of ${date.toISOString().slice(0, 10)}`,
      quarterLabel: (date: Date) =>
        `Q${Math.floor(date.getMonth() / 3) + 1} FY${String(date.getFullYear()).slice(2)}`,
      yearLabel: (date: Date) => `FY ${date.getFullYear()}`,
      monthLabel: (date: Date) =>
        date.toLocaleDateString('en-US', { month: 'long' }).toUpperCase(),
      picked: FEB_15,
      monday: new Date(2024, 1, 12),
      ranges: RANGES,
      multiple: [
        new Date(2024, 1, 2),
        new Date(2024, 1, 14),
        new Date(2024, 1, 20),
      ],
      caption: CAPTION,
    },
    template: `<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(21rem, 1fr)); gap: 1rem 1.5rem; align-items: start; align-content: start; min-height: 30rem;">
      <div>
        <p [style]="caption">date: weekday, day/month</p>
        <andes-date-picker style="width: 100%" locale="en-US" [format]="weekdayDate" [ngModel]="picked" aria-label="Date with a function format" />
      </div>
      <div>
        <p [style]="caption">date range, same function</p>
        <andes-date-picker style="width: 100%" mode="range" locale="en-US" [format]="weekdayDate" [ngModel]="ranges['date']" aria-label="Date range with a function format" />
      </div>
      <div>
        <p [style]="caption">week</p>
        <andes-date-picker style="width: 100%" picker="week" locale="en-US" [weekStartsOn]="1" [format]="isoWeek" [ngModel]="monday" aria-label="Week with a function format" />
      </div>
      <div>
        <p [style]="caption">month</p>
        <andes-date-picker style="width: 100%" picker="month" locale="en-US" [format]="monthLabel" [ngModel]="picked" aria-label="Month with a function format" />
      </div>
      <div>
        <p [style]="caption">quarter</p>
        <andes-date-picker style="width: 100%" picker="quarter" locale="en-US" [format]="quarterLabel" [ngModel]="picked" aria-label="Quarter with a function format" />
      </div>
      <div>
        <p [style]="caption">year range</p>
        <andes-date-picker style="width: 100%" mode="range" picker="year" locale="en-US" [format]="yearLabel" [ngModel]="ranges['year']" aria-label="Year range with a function format" />
      </div>
      <div>
        <p [style]="caption">multiple dates</p>
        <andes-date-picker style="width: 100%" mode="multiple" locale="en-US" [format]="weekdayDate" [ngModel]="multiple" aria-label="Multiple dates with a function format" />
      </div>
    </div>`,
  }),
};

/**
 * `format` as `{ format, type: 'mask' }` for every picker: the input keeps the pattern's
 * shape, digits fill the number under the caret and move on, Left and Right switch
 * numbers, Up and Down step one, and Backspace empties one. Leave a half-typed mask and
 * it goes back to the value. Masks work in single and range pickers, with a time, and
 * with the week, month, quarter and year patterns; time pickers follow the mask for
 * their columns.
 */
export const MaskFormats: Story = {
  render: () => ({
    moduleMetadata: { imports: [FormsModule, JsonPipe] },
    props: {
      masks: [
        { picker: 'date', mask: { format: 'DD/MM/YYYY', type: 'mask' } },
        { picker: 'week', mask: { format: 'YYYY-[W]ww', type: 'mask' } },
        { picker: 'month', mask: { format: 'MM/YYYY', type: 'mask' } },
        { picker: 'quarter', mask: { format: 'YYYY-[Q]Q', type: 'mask' } },
        { picker: 'year', mask: { format: 'YYYY', type: 'mask' } },
      ],
      dateTime: { format: 'YYYY-MM-DD HH:mm', type: 'mask' },
      time: { format: 'HH:mm:ss', type: 'mask' },
      ranges: RANGES,
      picked: FEB_15,
      meeting: new Date(2024, 1, 15, 9, 30),
      mono: MONO,
      caption: CAPTION,
    },
    template: `<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(21rem, 1fr)); gap: 1rem 1.5rem; align-items: start; align-content: start; min-height: 30rem;">
      @for (case of masks; track case.picker) {
        <div>
          <p [style]="caption">picker="{{ case.picker }}", {{ case.mask.format }}</p>
          <andes-date-picker style="width: 100%" [picker]="case.picker" locale="en-GB" [weekStartsOn]="1" [format]="case.mask" [ngModel]="picked" [aria-label]="case.picker + ' mask'" />
        </div>
        <div>
          <p [style]="caption">Range, same mask</p>
          <andes-date-picker style="width: 100%" mode="range" [picker]="case.picker" locale="en-GB" [weekStartsOn]="1" [format]="case.mask" [ngModel]="ranges[case.picker]" [aria-label]="case.picker + ' range mask'" />
        </div>
      }
      <div>
        <p [style]="caption">Date and time, YYYY-MM-DD HH:mm</p>
        <andes-date-picker style="width: 100%" locale="en-GB" showTime [format]="dateTime" [(ngModel)]="meeting" aria-label="Date and time mask" />
        <pre [style]="mono">{{ meeting | json }}</pre>
      </div>
      <div>
        <p [style]="caption">Time, HH:mm:ss</p>
        <andes-date-picker style="width: 100%" picker="time" locale="en-GB" [format]="time" aria-label="Time mask" />
      </div>
      <div>
        <p [style]="caption">Time range, HH:mm:ss</p>
        <andes-date-picker style="width: 100%" picker="time" mode="range" locale="en-GB" [format]="time" aria-label="Time range mask" />
      </div>
    </div>`,
  }),
};

/**
 * `displayFormat` takes `Intl.DateTimeFormat` options, which follow the locale: a long
 * date with the weekday, a short month, a two-digit year. It applies to every type that
 * has an `Intl` shape (date, month, year) and to ranges and multiple pickers alike;
 * `format`, when set, takes precedence.
 */
export const DisplayFormats: Story = {
  render: () => ({
    moduleMetadata: { imports: [FormsModule] },
    props: {
      cases: [
        {
          label: 'date, dateStyle full',
          picker: 'date',
          options: { dateStyle: 'full' },
        },
        {
          label: 'date, numeric day and month',
          picker: 'date',
          options: { day: '2-digit', month: '2-digit', year: 'numeric' },
        },
        {
          label: 'month, long',
          picker: 'month',
          options: { month: 'long', year: 'numeric' },
        },
        {
          label: 'month, numeric',
          picker: 'month',
          options: { month: '2-digit', year: '2-digit' },
        },
        {
          label: 'year, two digits',
          picker: 'year',
          options: { year: '2-digit' },
        },
      ] satisfies {
        label: string;
        picker: AndesDatePickerType;
        options: Intl.DateTimeFormatOptions;
      }[],
      ranges: RANGES,
      picked: FEB_15,
      caption: CAPTION,
    },
    template: `<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(22rem, 1fr)); gap: 1rem 1.5rem; align-items: start; align-content: start; min-height: 24rem;">
      @for (case of cases; track case.label) {
        <div>
          <p [style]="caption">{{ case.label }}</p>
          <andes-date-picker style="width: 100%" [picker]="case.picker" locale="en-GB" [displayFormat]="case.options" [ngModel]="picked" [aria-label]="case.label" />
        </div>
        <div>
          <p [style]="caption">Range, same options</p>
          <andes-date-picker style="width: 100%" mode="range" [picker]="case.picker" locale="en-GB" [displayFormat]="case.options" [ngModel]="ranges[case.picker]" [aria-label]="case.label + ' range'" />
        </div>
      }
    </div>`,
  }),
};

/**
 * `showTime` adds the time columns to a date picker, single and range: the field shows
 * the date and the time, and OK confirms (it is on by default with a time). `defaultTime`
 * is the time a freshly picked day starts at: 09:00 for the single picker, and a
 * `[start, end]` pair (09:00 and 18:00) for the range.
 */
export const ChooseTime: Story = {
  render: () => ({
    moduleMetadata: { imports: [FormsModule, JsonPipe] },
    props: {
      workday: { defaultTime: new Date(2024, 0, 1, 9, 0) },
      workdayRange: {
        defaultTime: [new Date(2024, 0, 1, 9, 0), new Date(2024, 0, 1, 18, 0)],
      },
      seconds: { showSecond: true },
      steps: { minuteStep: 15 },
      picked: new Date(2024, 1, 15, 14, 30),
      meeting: new Date(2024, 1, 15, 9, 0),
      range: [new Date(2024, 1, 5, 9, 0), new Date(2024, 1, 12, 18, 0)],
      mono: MONO,
      caption: CAPTION,
    },
    template: `<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(21rem, 1fr)); gap: 1rem 1.5rem; align-items: start; align-content: start; min-height: 30rem;">
      <div>
        <p [style]="caption">showTime</p>
        <andes-date-picker style="width: 100%" locale="en-GB" showTime [(ngModel)]="picked" aria-label="Date and time" />
        <pre [style]="mono">{{ picked | json }}</pre>
      </div>
      <div>
        <p [style]="caption">showTime, defaultTime 09:00</p>
        <andes-date-picker style="width: 100%" locale="en-GB" [showTime]="workday" aria-label="Date at nine" />
      </div>
      <div>
        <p [style]="caption">With seconds</p>
        <andes-date-picker style="width: 100%" locale="en-GB" [showTime]="seconds" [ngModel]="picked" aria-label="Date, time and seconds" />
      </div>
      <div>
        <p [style]="caption">15-minute step</p>
        <andes-date-picker style="width: 100%" locale="en-GB" [showTime]="steps" [ngModel]="meeting" aria-label="Date and time, 15 minute step" />
      </div>
      <div>
        <p [style]="caption">Range with time</p>
        <andes-date-picker style="width: 100%" mode="range" locale="en-GB" showTime [ngModel]="range" aria-label="Date and time range" />
      </div>
      <div>
        <p [style]="caption">Range, defaultTime 09:00 and 18:00</p>
        <andes-date-picker style="width: 100%" mode="range" locale="en-GB" [showTime]="workdayRange" aria-label="Working hours range" />
      </div>
    </div>`,
  }),
};

/**
 * The `showTime` panels open: a date with the hour, minute and second columns beside the
 * days (first), the same with the 12-hour clock and AM/PM (second), and a range whose
 * time columns follow the input being edited (third). Left and Right move between
 * columns, and Enter or OK confirms.
 */
export const ChooseTimeOpen: Story = {
  render: () => ({
    props: {
      seconds: { showSecond: true },
      twelve: { use12Hours: true, minuteStep: 5 },
      picked: new Date(2024, 1, 15, 14, 30, 15),
      range: [new Date(2024, 1, 5, 9, 0), new Date(2024, 1, 12, 18, 0)],
      caption: CAPTION,
    },
    template: `<div style="display: flex; flex-wrap: wrap; gap: 1rem 1.5rem; align-items: flex-start;">
      <div style="width: 31rem; min-height: 27rem;">
        <p [style]="caption">showTime with seconds</p>
        <andes-date-picker locale="en-GB" [showTime]="seconds" [value]="picked" [open]="true" aria-label="Date and time with seconds" />
      </div>
      <div style="width: 31rem; min-height: 27rem;">
        <p [style]="caption">12-hour clock, 5-minute step</p>
        <andes-date-picker locale="en-US" [showTime]="twelve" [value]="picked" [open]="true" aria-label="Date and 12-hour time" />
      </div>
      <div style="width: 45rem; min-height: 27rem;">
        <p [style]="caption">Range with time</p>
        <andes-date-picker mode="range" locale="en-GB" showTime [value]="range" [open]="true" aria-label="Date and time range, open" />
      </div>
    </div>`,
  }),
};

/**
 * `format` with time tokens decides the time columns, as in the time picker: `HH:mm`
 * shows hours and minutes only, `hh:mm A` a 12-hour clock with AM/PM, and `HH:mm:ss`
 * adds seconds. Without a format, `showTime` takes `showHour`, `showMinute` and
 * `showSecond`. Milliseconds are never shown: a value keeps none.
 */
export const TimeFormats: Story = {
  render: () => ({
    moduleMetadata: { imports: [FormsModule] },
    props: {
      cases: [
        { label: 'YYYY-MM-DD HH:mm', format: 'YYYY-MM-DD HH:mm' },
        { label: 'YYYY-MM-DD HH:mm:ss', format: 'YYYY-MM-DD HH:mm:ss' },
        { label: 'DD/MM/YYYY hh:mm A', format: 'DD/MM/YYYY hh:mm A' },
        { label: 'D MMM, HH[h]', format: 'D MMM, HH[h]' },
      ],
      hourOnly: { showMinute: false },
      picked: new Date(2024, 1, 15, 14, 30, 15),
      range: [new Date(2024, 1, 5, 9, 0, 0), new Date(2024, 1, 12, 18, 30, 0)],
      caption: CAPTION,
    },
    template: `<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(21rem, 1fr)); gap: 1rem 1.5rem; align-items: start; align-content: start; min-height: 30rem;">
      @for (case of cases; track case.label) {
        <div>
          <p [style]="caption">{{ case.label }}</p>
          <andes-date-picker style="width: 100%" locale="en-US" showTime [format]="case.format" [ngModel]="picked" [aria-label]="case.label" />
        </div>
        <div>
          <p [style]="caption">Range, same format</p>
          <andes-date-picker style="width: 100%" mode="range" locale="en-US" showTime [format]="case.format" [ngModel]="range" [aria-label]="case.label + ' range'" />
        </div>
      }
      <div>
        <p [style]="caption">showHour, no minute column</p>
        <andes-date-picker style="width: 100%" locale="en-US" [showTime]="hourOnly" [ngModel]="picked" aria-label="Date and hour" />
      </div>
    </div>`,
  }),
};
