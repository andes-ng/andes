import { JsonPipe } from '@angular/common';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import type { Meta, StoryObj } from '@storybook/angular';

import { AndesDatePicker } from './date-picker';

const meta: Meta<AndesDatePicker> = {
  title: 'Data Entry/Date Picker/Time',
  component: AndesDatePicker,
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<AndesDatePicker>;

/**
 * `showTime` adds hour/minute columns; `needConfirm` is then on by default, so
 * picks stay pending until OK. `showNow` adds a "Now" shortcut. The field and the
 * columns share one clock: 24 hours, unless `use12Hours` asks for the AM/PM form. A
 * picked time scrolls to the top of its column, and the Left and Right arrows move
 * between columns while PageUp and PageDown jump five options.
 */
export const WithTime: Story = {
  render: () => ({
    moduleMetadata: { imports: [ReactiveFormsModule, JsonPipe] },
    props: {
      control: new FormControl<Date | null>(new Date(2024, 1, 15, 9, 30)),
    },
    template: `<div style="min-height: 28rem; display: flex; flex-direction: column; gap: 1rem;">
      <andes-date-picker locale="en-US" showTime showNow [open]="true" [formControl]="control" aria-label="Meeting time" />
      <pre style="font: 0.75rem/1.5 ui-monospace, monospace;">value: {{ control.value | json }}</pre>
    </div>`,
  }),
};

/** Time columns with a 15-minute step and seconds, in a range. */
export const RangeWithTime: Story = {
  render: () => ({
    props: {
      timeOptions: { minuteStep: 15, showSecond: true },
      febMonth: new Date(2024, 1, 1),
    },
    template: `<div style="min-height: 28rem;">
      <andes-date-picker mode="range" locale="en-GB" [showTime]="timeOptions" [defaultMonth]="febMonth" />
    </div>`,
  }),
};

/**
 * `picker="time"` drops the calendar and keeps the time columns, with the
 * rest of the picker unchanged: typing (`14:30`), OK, Now, ranges, forms. The
 * value is a `Date` on the day it already held, or today.
 */
export const TimePicker: Story = {
  render: () => ({
    props: {
      twelve: { use12Hours: true, minuteStep: 5 },
      seconds: { showSecond: true },
    },
    template: `<div style="min-height: 22rem; display: flex; gap: 1rem; flex-wrap: wrap; align-items: flex-start;">
      <andes-date-picker picker="time" locale="en-GB" showNow [open]="true" aria-label="Start time" />
      <andes-date-picker picker="time" locale="en-US" [showTime]="twelve" aria-label="12-hour time" />
      <andes-date-picker picker="time" locale="en-GB" [showTime]="seconds" size="sm" aria-label="Time with seconds" />
    </div>`,
  }),
};

/**
 * A time range: the first OK confirms the start and moves to the end. With
 * `[order]="false"` a shift that crosses midnight (22:00 to 06:00) keeps its
 * order instead of being swapped.
 */
export const TimeRange: Story = {
  render: () => ({
    moduleMetadata: { imports: [FormsModule] },
    props: {
      shift: [new Date(2024, 1, 15, 22, 0), new Date(2024, 1, 15, 6, 0)],
      steps: { minuteStep: 15 },
    },
    template: `<div style="min-height: 22rem; display: flex; flex-direction: column; gap: 0.75rem; width: 18rem;">
      <andes-date-picker picker="time" mode="range" locale="en-GB" [showTime]="steps" aria-label="Opening hours" />
      <andes-date-picker picker="time" mode="range" locale="en-GB" [order]="false" [ngModel]="shift" aria-label="Night shift" />
    </div>`,
  }),
};
