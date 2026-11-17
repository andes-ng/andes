import { DatePipe, JsonPipe } from '@angular/common';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import type { Meta, StoryObj } from '@storybook/angular';

import { AndesDatePicker, type AndesDatePickerValue } from './date-picker';

const meta: Meta<AndesDatePicker> = {
  title: 'Data Entry/Date Picker/Multiple',
  component: AndesDatePicker,
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<AndesDatePicker>;

const CAPTION =
  'margin: 0 0 0.375rem; font: 0.75rem/1.25rem var(--andes-font-family), sans-serif; color: var(--andes-color-muted-foreground);';
const LOG =
  'margin: 0.375rem 0 0; font: 0.75rem/1.5 ui-monospace, monospace; white-space: pre-wrap;';

/** `n` February 2024 dates from the 2nd, every third day. */
function februaryDates(count: number): Date[] {
  return Array.from(
    { length: count },
    (_, index) => new Date(2024, 1, 2 + index * 3),
  );
}

/**
 * `mode="multiple"`: each pick in the calendar toggles a date, and the panel stays open
 * for the next. The field lists the dates as tags, in order; a tag's x removes it,
 * Backspace in the empty input removes the last one, and typing a date then Enter adds
 * it. The form value is a `Date[]` (`[]` when empty).
 */
export const Basic: Story = {
  render: () => ({
    moduleMetadata: { imports: [ReactiveFormsModule, JsonPipe] },
    props: {
      shifts: new FormControl<AndesDatePickerValue>(februaryDates(3)),
      febMonth: new Date(2024, 1, 1),
      log: LOG,
    },
    template: `<div style="min-height: 26rem; width: 22rem;">
      <andes-date-picker style="width: 100%" mode="multiple" locale="en-US" aria-label="Shift dates" [formControl]="shifts" [defaultMonth]="febMonth" />
      <pre [style]="log">value: {{ shifts.value | json }}</pre>
    </div>`,
  }),
};

/**
 * Many dates in a small field. `maxTagCount` shows that many tags and collapses the rest
 * into a `+ N ...` tag: hover, focus or click it for a popover listing the hidden dates,
 * each removable (Tab moves through them, Escape closes). `responsive` fits as many
 * tags as one row holds. `maxCount` caps the selection: once four dates are picked, the
 * other days are disabled until one is removed.
 */
export const TagOverflow: Story = {
  render: () => ({
    moduleMetadata: { imports: [ReactiveFormsModule] },
    props: {
      fixedControl: new FormControl<AndesDatePickerValue>(februaryDates(7)),
      fitControl: new FormControl<AndesDatePickerValue>(februaryDates(7)),
      cappedControl: new FormControl<AndesDatePickerValue>(februaryDates(2)),
      febMonth: new Date(2024, 1, 1),
      caption: CAPTION,
    },
    template: `<div style="min-height: 26rem; display: flex; flex-direction: column; gap: 1rem; width: min(22rem, 100%);">
      <div>
        <p [style]="caption">maxTagCount = 2</p>
        <andes-date-picker style="width: 100%" mode="multiple" locale="en-US" aria-label="Two tags, then + N" [maxTagCount]="2" [formControl]="fixedControl" [defaultMonth]="febMonth" />
      </div>
      <div>
        <p [style]="caption">maxTagCount = 'responsive'</p>
        <andes-date-picker style="width: 100%" mode="multiple" locale="en-US" aria-label="As many tags as fit" maxTagCount="responsive" [formControl]="fitControl" [defaultMonth]="febMonth" />
      </div>
      <div>
        <p [style]="caption">maxCount = 4</p>
        <andes-date-picker style="width: 100%" mode="multiple" locale="en-US" aria-label="At most four dates" [maxCount]="4" [formControl]="cappedControl" [defaultMonth]="febMonth" />
      </div>
    </div>`,
  }),
};

/**
 * `multiple` with the other pickers - weeks, months, quarters, years - where each tag is
 * a period in the picker's format, a token `format` (`DD/MM`), the small size, and
 * `needConfirm`, which holds the toggles until OK (closing the panel otherwise drops
 * them).
 */
export const PickersAndConfirm: Story = {
  render: () => ({
    moduleMetadata: { imports: [ReactiveFormsModule] },
    props: {
      weeks: new FormControl<AndesDatePickerValue>([new Date(2024, 1, 12)]),
      months: new FormControl<AndesDatePickerValue>([
        new Date(2024, 0, 1),
        new Date(2024, 5, 1),
      ]),
      quarters: new FormControl<AndesDatePickerValue>([new Date(2024, 3, 1)]),
      years: new FormControl<AndesDatePickerValue>([new Date(2025, 0, 1)]),
      confirmed: new FormControl<AndesDatePickerValue>(februaryDates(2)),
      febMonth: new Date(2024, 1, 1),
      caption: CAPTION,
    },
    template: `<div style="min-height: 26rem; display: grid; grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr)); gap: 1rem; align-items: start;">
      <div>
        <p [style]="caption">picker="week"</p>
        <andes-date-picker style="width: 100%" mode="multiple" picker="week" locale="en-US" aria-label="Weeks" [weekStartsOn]="1" [formControl]="weeks" [defaultMonth]="febMonth" />
      </div>
      <div>
        <p [style]="caption">picker="month"</p>
        <andes-date-picker style="width: 100%" mode="multiple" picker="month" locale="en-US" aria-label="Months" [formControl]="months" />
      </div>
      <div>
        <p [style]="caption">picker="quarter"</p>
        <andes-date-picker style="width: 100%" mode="multiple" picker="quarter" locale="en-US" aria-label="Quarters" [formControl]="quarters" />
      </div>
      <div>
        <p [style]="caption">picker="year"</p>
        <andes-date-picker style="width: 100%" mode="multiple" picker="year" locale="en-US" aria-label="Years" [formControl]="years" />
      </div>
      <div>
        <p [style]="caption">needConfirm, format DD/MM, size sm</p>
        <andes-date-picker style="width: 100%" mode="multiple" locale="en-GB" aria-label="Confirmed dates" needConfirm format="DD/MM" size="sm" [formControl]="confirmed" [defaultMonth]="febMonth" />
      </div>
    </div>`,
  }),
};

/**
 * `tagTemplate` draws each tag, in the field and in the `+ N ...` popover: here a weekday
 * chip whose own button calls the context's `remove($event)`.
 */
export const CustomTags: Story = {
  render: () => ({
    moduleMetadata: { imports: [FormsModule, DatePipe] },
    props: {
      dates: [
        new Date(2024, 1, 5),
        new Date(2024, 1, 12),
        new Date(2024, 1, 19),
      ],
    },
    template: `
      <ng-template #tag let-tag let-remove="remove" let-disabled="disabled">
        <span style="display: inline-flex; align-items: center; gap: 0.25rem; padding: 0 0.5rem; border-radius: 999px; background: var(--andes-color-primary); color: var(--andes-color-primary-foreground); font-size: 0.75rem; line-height: 1.25rem;">
          {{ tag.date | date: 'EEE d' }}
          @if (!disabled) {
            <button type="button" tabindex="-1" (mousedown)="$event.preventDefault()" (click)="remove($event)" [attr.aria-label]="'Remove ' + tag.label" style="border: 0; padding: 0; background: none; color: inherit; cursor: pointer;">&#215;</button>
          }
        </span>
      </ng-template>
      <div style="min-height: 26rem; width: 20rem;">
        <andes-date-picker mode="multiple" locale="en-US" [tagTemplate]="tag" [maxTagCount]="2" [(ngModel)]="dates" aria-label="Classes" />
      </div>
    `,
  }),
};
