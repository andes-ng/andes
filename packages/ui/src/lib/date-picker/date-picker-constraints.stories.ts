import { FormsModule } from '@angular/forms';
import type { Meta, StoryObj } from '@storybook/angular';

import { AndesDatePicker } from './date-picker';

const meta: Meta<AndesDatePicker> = {
  title: 'Data Entry/Date Picker/Constraints',
  component: AndesDatePicker,
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<AndesDatePicker>;

const FEB_15 = new Date(2024, 1, 15);

/**
 * Which days can be picked: `min`/`max` bounds (first field, February 8 to 22) and a
 * `dateDisabled` predicate (second field, weekends).
 */
export const DisabledDates: Story = {
  render: () => ({
    props: {
      min: new Date(2024, 1, 8),
      max: new Date(2024, 1, 22),
      febMonth: new Date(2024, 1, 1),
      weekends: (date: Date) => date.getDay() === 0 || date.getDay() === 6,
    },
    template: `<div style="min-height: 26rem; display: flex; gap: 1rem; flex-wrap: wrap; align-items: flex-start;">
      <andes-date-picker locale="en-US" [min]="min" [max]="max" [defaultMonth]="febMonth" aria-label="Bounded" />
      <andes-date-picker locale="en-US" [dateDisabled]="weekends" aria-label="No weekends" />
    </div>`,
  }),
};

/** `dateDisabled` also receives the picker type: here, no past months. */
export const DisabledMonths: Story = {
  render: () => ({
    props: {
      dateDisabled: (date: Date, info: { type: string }) =>
        info.type === 'month' && date < new Date(2024, 3, 1),
      picked: new Date(2024, 5, 1),
    },
    moduleMetadata: { imports: [FormsModule] },
    template: `<div style="min-height: 20rem;">
      <andes-date-picker picker="month" locale="en-US" [dateDisabled]="dateDisabled" [ngModel]="picked" [open]="true" />
    </div>`,
  }),
};

/**
 * `dateDisabled` receives `info.from`, the start already picked, while a
 * range's end is chosen: here a range can span at most seven days.
 */
export const LimitedRangeLength: Story = {
  render: () => ({
    props: {
      withinAWeek: (date: Date, info: { from?: Date }) =>
        !!info.from &&
        Math.abs(date.getTime() - info.from.getTime()) > 7 * 86_400_000,
      febMonth: new Date(2024, 1, 1),
    },
    template: `<div style="min-height: 26rem;">
      <andes-date-picker mode="range" locale="en-US" [dateDisabled]="withinAWeek" [defaultMonth]="febMonth" aria-label="Up to a week" />
    </div>`,
  }),
};

/**
 * `timeDisabled` rules out times per date: here office hours (09:00-17:45),
 * and no 17:45. On the right, `hideDisabledOptions` leaves them out and
 * `defaultTime` starts a picked day at 09:00.
 */
export const DisabledTime: Story = {
  render: () => ({
    props: {
      officeHours: () => ({
        disabledHours: () => [
          0, 1, 2, 3, 4, 5, 6, 7, 8, 18, 19, 20, 21, 22, 23,
        ],
        disabledMinutes: (hour: number) => (hour === 17 ? [45] : []),
      }),
      hidden: {
        minuteStep: 15,
        hideDisabledOptions: true,
        defaultTime: new Date(2024, 0, 1, 9, 0),
      },
      febMonth: FEB_15,
    },
    template: `<div style="min-height: 28rem; display: flex; gap: 1rem; flex-wrap: wrap; align-items: flex-start;">
      <andes-date-picker locale="en-GB" showTime [timeDisabled]="officeHours" [defaultMonth]="febMonth" [open]="true" aria-label="Appointment" />
      <andes-date-picker locale="en-GB" [showTime]="hidden" [timeDisabled]="officeHours" [defaultMonth]="febMonth" aria-label="Appointment, hidden options" />
    </div>`,
  }),
};
