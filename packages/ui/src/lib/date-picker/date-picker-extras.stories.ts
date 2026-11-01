import { FormsModule } from '@angular/forms';
import type { Meta, StoryObj } from '@storybook/angular';

import {
  AndesDatePicker,
  type AndesDatePickerPreset,
  type AndesDatePickerType,
} from './date-picker';

/**
 * What surrounds the calendar and the input: presets, the extra footer, the prefix and
 * suffix of the field, the clear button, a read-only or loading field, and the hover
 * preview. Each story runs the feature across the picker types.
 */
const meta: Meta<AndesDatePicker> = {
  title: 'Data Entry/Date Picker/Extras',
  component: AndesDatePicker,
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<AndesDatePicker>;

const FEB_15 = new Date(2024, 1, 15);
const CAPTION =
  'margin: 0 0 0.375rem; font: 0.75rem/1.25rem var(--andes-font-family), sans-serif; color: var(--andes-color-muted-foreground);';
const TYPES = ['date', 'week', 'month', 'quarter', 'year'] as const;

const daysFromNow = (days: number): Date => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() + days);
};
const monthsFromNow = (months: number): Date => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + months, 1);
};
const yearsFromNow = (years: number): Date =>
  new Date(new Date().getFullYear() + years, 0, 1);

const SINGLE_PRESETS: readonly AndesDatePickerPreset[] = [
  { label: 'Yesterday', value: () => daysFromNow(-1) },
  { label: 'Today', value: () => daysFromNow(0) },
  { label: 'Tomorrow', value: () => daysFromNow(1) },
  { label: 'Next week', value: () => daysFromNow(7) },
  { label: 'Launch day', value: new Date(2024, 2, 1) },
];

const MONTH_PRESETS: readonly AndesDatePickerPreset[] = [
  { label: 'Last month', value: () => monthsFromNow(-1) },
  { label: 'This month', value: () => monthsFromNow(0) },
  { label: 'Next month', value: () => monthsFromNow(1) },
  { label: 'Start of 2024', value: new Date(2024, 0, 1) },
];

const YEAR_PRESETS: readonly AndesDatePickerPreset[] = [
  { label: 'Last year', value: () => yearsFromNow(-1) },
  { label: 'This year', value: () => yearsFromNow(0) },
  { label: 'Next year', value: () => yearsFromNow(1) },
  { label: 'Fiscal 2024', value: new Date(2024, 0, 1) },
];

const RANGE_PRESETS: readonly AndesDatePickerPreset[] = [
  { label: 'Today', value: () => [daysFromNow(0), daysFromNow(0)] },
  { label: 'Last 7 days', value: () => [daysFromNow(-6), daysFromNow(0)] },
  { label: 'Next 14 days', value: () => [daysFromNow(0), daysFromNow(13)] },
  {
    label: 'This month',
    value: () => [
      monthsFromNow(0),
      new Date(monthsFromNow(1).getTime() - 86_400_000),
    ],
  },
  {
    label: 'Q1 2024',
    value: [new Date(2024, 0, 1), new Date(2024, 2, 31)],
  },
  {
    label: 'Winter break',
    value: [new Date(2023, 11, 20), new Date(2024, 0, 7)],
  },
];

const RANGE_MONTH_PRESETS: readonly AndesDatePickerPreset[] = [
  {
    label: 'Last 3 months',
    value: () => [monthsFromNow(-2), monthsFromNow(0)],
  },
  { label: 'Next 6 months', value: () => [monthsFromNow(0), monthsFromNow(5)] },
  {
    label: 'First half of 2024',
    value: [new Date(2024, 0, 1), new Date(2024, 5, 1)],
  },
];

const RANGE_YEAR_PRESETS: readonly AndesDatePickerPreset[] = [
  { label: 'Last 3 years', value: () => [yearsFromNow(-2), yearsFromNow(0)] },
  { label: 'Next 5 years', value: () => [yearsFromNow(0), yearsFromNow(4)] },
  {
    label: '2020s',
    value: [new Date(2020, 0, 1), new Date(2029, 0, 1)],
  },
];

const PRESETS_BY_TYPE: Readonly<
  Record<
    AndesDatePickerType,
    {
      single: readonly AndesDatePickerPreset[];
      range: readonly AndesDatePickerPreset[];
    }
  >
> = {
  date: { single: SINGLE_PRESETS, range: RANGE_PRESETS },
  week: {
    single: [
      { label: 'This week', value: () => daysFromNow(0) },
      { label: 'Next week', value: () => daysFromNow(7) },
    ],
    range: [
      {
        label: 'Last 4 weeks',
        value: () => [daysFromNow(-21), daysFromNow(0)],
      },
      { label: 'Next 4 weeks', value: () => [daysFromNow(0), daysFromNow(21)] },
    ],
  },
  month: { single: MONTH_PRESETS, range: RANGE_MONTH_PRESETS },
  quarter: {
    single: [
      { label: 'This quarter', value: () => monthsFromNow(0) },
      { label: 'Next quarter', value: () => monthsFromNow(3) },
    ],
    range: [
      {
        label: 'Last 2 quarters',
        value: () => [monthsFromNow(-3), monthsFromNow(0)],
      },
      {
        label: 'Fiscal 2024',
        value: [new Date(2024, 0, 1), new Date(2024, 9, 1)],
      },
    ],
  },
  year: { single: YEAR_PRESETS, range: RANGE_YEAR_PRESETS },
  time: { single: [], range: [] },
};

/**
 * `presets` on single pickers, open: one-click values listed beside the grid. A function
 * stays current (Yesterday, Today, Tomorrow are computed on click) and a plain value
 * stays fixed (Launch day). The list works on every type, so a month picker offers
 * months and a year picker years.
 */
export const PresetsSingle: Story = {
  render: () => ({
    moduleMetadata: { imports: [FormsModule] },
    props: {
      datePresets: SINGLE_PRESETS,
      monthPresets: MONTH_PRESETS,
      yearPresets: YEAR_PRESETS,
      picked: FEB_15,
      caption: CAPTION,
    },
    template: `<div style="display: flex; flex-wrap: wrap; gap: 1rem 1.5rem; align-items: flex-start;">
      <div style="width: 26rem; min-height: 26rem;">
        <p [style]="caption">Date, relative and fixed presets</p>
        <andes-date-picker locale="en-US" [presets]="datePresets" [ngModel]="picked" [open]="true" aria-label="Date with presets" />
      </div>
      <div style="width: 26rem; min-height: 26rem;">
        <p [style]="caption">Month</p>
        <andes-date-picker picker="month" locale="en-US" [presets]="monthPresets" [ngModel]="picked" [open]="true" aria-label="Month with presets" />
      </div>
      <div style="width: 26rem; min-height: 26rem;">
        <p [style]="caption">Year</p>
        <andes-date-picker picker="year" locale="en-US" [presets]="yearPresets" [ngModel]="picked" [open]="true" aria-label="Year with presets" />
      </div>
    </div>`,
  }),
};

/**
 * `presets` on range pickers, open, each with relative ranges (Last 7 days, Next 14 days,
 * This month, always from today) and fixed ones (Q1 2024, Winter break). A preset fills
 * both inputs and closes the panel; hovering one previews it in the field. The month and
 * year ranges have presets of their own.
 */
export const PresetRanges: Story = {
  render: () => ({
    moduleMetadata: { imports: [FormsModule] },
    props: {
      datePresets: RANGE_PRESETS,
      monthPresets: RANGE_MONTH_PRESETS,
      yearPresets: RANGE_YEAR_PRESETS,
      picked: [new Date(2024, 1, 10), new Date(2024, 2, 5)],
      caption: CAPTION,
    },
    template: `<div style="display: flex; flex-wrap: wrap; gap: 1rem 1.5rem; align-items: flex-start;">
      <div style="width: 52rem; min-height: 27rem;">
        <p [style]="caption">Date range</p>
        <andes-date-picker mode="range" locale="en-US" [presets]="datePresets" [ngModel]="picked" [open]="true" aria-label="Date range with presets" />
      </div>
      <div style="width: 26rem; min-height: 24rem;">
        <p [style]="caption">Month range</p>
        <andes-date-picker mode="range" picker="month" locale="en-US" [presets]="monthPresets" [open]="true" aria-label="Month range with presets" />
      </div>
      <div style="width: 26rem; min-height: 24rem;">
        <p [style]="caption">Year range</p>
        <andes-date-picker mode="range" picker="year" locale="en-US" [presets]="yearPresets" [open]="true" aria-label="Year range with presets" />
      </div>
    </div>`,
  }),
};

/**
 * Presets on every type, single and range, closed: open any field for its list. The
 * presets are plain data (`{ label, value }`), so the same lists can be reused across
 * pickers and kept next to the rest of the app's date logic.
 */
export const PresetsPerType: Story = {
  render: () => ({
    props: { types: TYPES, presets: PRESETS_BY_TYPE, caption: CAPTION },
    template: `<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(21rem, 1fr)); gap: 1rem 1.5rem; align-items: start; align-content: start; min-height: 30rem;">
      @for (type of types; track type) {
        <div>
          <p [style]="caption">picker="{{ type }}"</p>
          <andes-date-picker style="width: 100%" [picker]="type" locale="en-US" [weekStartsOn]="1" [presets]="presets[type].single" [aria-label]="type + ' with presets'" />
        </div>
        <div>
          <p [style]="caption">picker="{{ type }}" mode="range"</p>
          <andes-date-picker style="width: 100%" mode="range" [picker]="type" locale="en-US" [weekStartsOn]="1" [presets]="presets[type].range" [aria-label]="type + ' range with presets'" />
        </div>
      }
    </div>`,
  }),
};

/**
 * `extraFooter` adds a template under the grid. It is shown in single and range pickers
 * alike, in the date panel and in the month and year grids a user drills through, and
 * its context holds the grid on show, so the text can follow the panel. Here a hint and a
 * link-style button.
 */
export const ExtraFooter: Story = {
  render: () => ({
    moduleMetadata: { imports: [FormsModule] },
    props: { picked: FEB_15, caption: CAPTION },
    template: `
      <ng-template #footer let-view>
        <span style="font-size: 0.75rem;">Picking a {{ view === 'date' ? 'day' : view }}. Weekends are not delivered.</span>
      </ng-template>
      <div style="display: flex; flex-wrap: wrap; gap: 1rem 1.5rem; align-items: flex-start;">
        <div style="width: 21rem; min-height: 27rem;">
          <p [style]="caption">Single</p>
          <andes-date-picker locale="en-US" [extraFooter]="footer" [ngModel]="picked" [open]="true" aria-label="Date with footer" />
        </div>
        <div style="width: 38rem; min-height: 27rem;">
          <p [style]="caption">Range</p>
          <andes-date-picker mode="range" locale="en-US" [extraFooter]="footer" [open]="true" aria-label="Range with footer" />
        </div>
        <div style="width: 21rem; min-height: 27rem;">
          <p [style]="caption">Multiple, with needConfirm</p>
          <andes-date-picker mode="multiple" locale="en-US" needConfirm [extraFooter]="footer" [open]="true" aria-label="Multiple with footer" />
        </div>
      </div>
    `,
  }),
};

/**
 * `extraFooter` for the week, month, quarter and year pickers and the time picker, open:
 * the template receives the grid on show (`date`, which the week picker shares, `month`,
 * `quarter`, `year` or `time`) as `$implicit`, so one template serves all of them.
 */
export const ExtraFooterTypes: Story = {
  render: () => ({
    moduleMetadata: { imports: [FormsModule] },
    props: {
      types: ['week', 'month', 'quarter', 'year', 'time'] as const,
      picked: FEB_15,
      caption: CAPTION,
    },
    template: `
      <ng-template #footer let-view>
        <span style="font-size: 0.75rem;">Footer for the {{ view }} panel</span>
      </ng-template>
      <div style="display: flex; flex-wrap: wrap; gap: 1rem 1.5rem; align-items: flex-start;">
        @for (type of types; track type) {
          <div style="width: 19rem; min-height: 25rem;">
            <p [style]="caption">picker="{{ type }}"</p>
            <andes-date-picker [picker]="type" locale="en-US" [weekStartsOn]="1" [extraFooter]="footer" [value]="picked" [open]="true" [aria-label]="type + ' with footer'" />
          </div>
        }
      </div>
    `,
  }),
};

/**
 * `prefix` and `suffixIcon` for every type, single, range and multiple: the prefix sits
 * before the input (here a label or an icon) and the suffix icon replaces the calendar
 * (or clock) icon at the end, which still turns into the clear button on hover.
 */
export const PrefixAndSuffix: Story = {
  render: () => ({
    moduleMetadata: { imports: [FormsModule] },
    props: {
      types: TYPES,
      picked: FEB_15,
      range: [new Date(2024, 1, 5), new Date(2024, 1, 12)],
      multiple: [new Date(2024, 1, 2), new Date(2024, 1, 14)],
      caption: CAPTION,
    },
    template: `
      <ng-template #label><span style="font-size: 0.875rem;">Due</span></ng-template>
      <ng-template #flag>
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 22V4M4 4h13l-2 4 2 4H4" /></svg>
      </ng-template>
      <ng-template #sun>
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
      </ng-template>
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(20rem, 1fr)); gap: 1rem 1.5rem; align-items: start; align-content: start; min-height: 26rem;">
        @for (type of types; track type) {
          <div>
            <p [style]="caption">picker="{{ type }}", prefix and suffix</p>
            <andes-date-picker style="width: 100%" [picker]="type" locale="en-US" [weekStartsOn]="1" [prefix]="label" [suffixIcon]="sun" [ngModel]="picked" [aria-label]="type + ' with prefix and suffix'" />
          </div>
        }
        <div>
          <p [style]="caption">Range, icon prefix</p>
          <andes-date-picker style="width: 100%" mode="range" locale="en-US" [prefix]="flag" [suffixIcon]="sun" [ngModel]="range" aria-label="Range with prefix and suffix" />
        </div>
        <div>
          <p [style]="caption">Multiple</p>
          <andes-date-picker style="width: 100%" mode="multiple" locale="en-US" [prefix]="label" [suffixIcon]="sun" [ngModel]="multiple" aria-label="Multiple with prefix and suffix" />
        </div>
        <div>
          <p [style]="caption">Time</p>
          <andes-date-picker style="width: 100%" picker="time" locale="en-GB" [prefix]="label" [suffixIcon]="sun" aria-label="Time with prefix and suffix" />
        </div>
      </div>
    `,
  }),
};

/**
 * The field's own states. `allowClear` off hides the clear button (first row); a custom
 * `clearIcon` replaces it (second); `inputReadOnly` keeps a phone's keyboard closed and
 * leaves picking to the panel (third); a loading field is a spinner in `suffixIcon` plus
 * `disabled` while the data it depends on arrives (fourth). Each row has a single and a
 * range picker with a value.
 */
export const ClearableReadOnlyLoading: Story = {
  render: () => ({
    moduleMetadata: { imports: [FormsModule] },
    props: {
      picked: FEB_15,
      range: [new Date(2024, 1, 5), new Date(2024, 1, 12)],
      caption: CAPTION,
    },
    styles: [
      '@keyframes story-spin { to { transform: rotate(360deg); } }',
      '.story-spinner { animation: story-spin 1s linear infinite; }',
    ],
    template: `
      <ng-template #clear>
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" /></svg>
      </ng-template>
      <ng-template #spinner>
        <svg class="story-spinner" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 12a9 9 0 1 1-6.2-8.6" /></svg>
      </ng-template>
      <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 22rem)); gap: 0.75rem 1.5rem; align-items: start; align-content: start; min-height: 26rem;">
        <p [style]="caption">allowClear off, single</p>
        <p [style]="caption">allowClear off, range</p>
        <andes-date-picker style="width: 100%" locale="en-US" [allowClear]="false" [ngModel]="picked" aria-label="Without clear button" />
        <andes-date-picker style="width: 100%" mode="range" locale="en-US" [allowClear]="false" [ngModel]="range" aria-label="Range without clear button" />
        <p [style]="caption">Custom clear icon, single</p>
        <p [style]="caption">Custom clear icon, range</p>
        <andes-date-picker style="width: 100%" locale="en-US" [clearIcon]="clear" [ngModel]="picked" aria-label="Custom clear icon" />
        <andes-date-picker style="width: 100%" mode="range" locale="en-US" [clearIcon]="clear" [ngModel]="range" aria-label="Range, custom clear icon" />
        <p [style]="caption">inputReadOnly, single</p>
        <p [style]="caption">inputReadOnly, range</p>
        <andes-date-picker style="width: 100%" locale="en-US" inputReadOnly [ngModel]="picked" aria-label="Read-only input" />
        <andes-date-picker style="width: 100%" mode="range" locale="en-US" inputReadOnly [ngModel]="range" aria-label="Range, read-only input" />
        <p [style]="caption">Loading, single</p>
        <p [style]="caption">Loading, range</p>
        <andes-date-picker style="width: 100%" locale="en-US" disabled [suffixIcon]="spinner" [ngModel]="picked" aria-label="Loading" />
        <andes-date-picker style="width: 100%" mode="range" locale="en-US" disabled [suffixIcon]="spinner" [ngModel]="range" aria-label="Range, loading" />
      </div>
    `,
  }),
};

/**
 * `previewValue`: hovering a day (or a preset) shows it in the input, muted, before it is
 * picked. It is on by default (first column) and `false` turns it off (second). Open the
 * panels and move the pointer over the days, then over a preset.
 */
export const PreviewValue: Story = {
  render: () => ({
    moduleMetadata: { imports: [FormsModule] },
    props: {
      presets: SINGLE_PRESETS,
      rangePresets: RANGE_PRESETS,
      picked: FEB_15,
      caption: CAPTION,
    },
    template: `<div style="display: grid; grid-template-columns: repeat(2, minmax(0, 22rem)); gap: 0.75rem 1.5rem; align-items: start; align-content: start; min-height: 30rem;">
      <p [style]="caption">previewValue="hover" (default)</p>
      <p [style]="caption">[previewValue]="false"</p>
      <andes-date-picker style="width: 100%" locale="en-US" [presets]="presets" [ngModel]="picked" aria-label="With hover preview" />
      <andes-date-picker style="width: 100%" locale="en-US" [previewValue]="false" [presets]="presets" [ngModel]="picked" aria-label="Without hover preview" />
      <p [style]="caption">Range, hover preview</p>
      <p [style]="caption">Range, no preview</p>
      <andes-date-picker style="width: 100%" mode="range" locale="en-US" [presets]="rangePresets" aria-label="Range with hover preview" />
      <andes-date-picker style="width: 100%" mode="range" locale="en-US" [previewValue]="false" [presets]="rangePresets" aria-label="Range without hover preview" />
    </div>`,
  }),
};
