import { JsonPipe } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import type { Meta, StoryObj } from '@storybook/angular';

import { AndesDatePicker, type AndesDatePickerValue } from './date-picker';

const meta: Meta<AndesDatePicker> = {
  title: 'Data Entry/Date Picker/Range options',
  component: AndesDatePicker,
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<AndesDatePicker>;

const CAPTION =
  'margin: 0 0 0.375rem; font: 0.75rem/1.25rem var(--andes-font-family), sans-serif; color: var(--andes-color-muted-foreground);';
const LOG = 'margin: 0.375rem 0 0; font: 0.75rem/1.5 ui-monospace, monospace;';

/**
 * One side of a range locked, the other editable. `[disabled]="[true, false]"` fixes
 * the check-in date (its input is read-only, skipped by Tab and `aria-disabled`): picks
 * only move the check-out, and days before check-in are disabled. Next to a form
 * directive, use `disabledSides` - Angular's `formControl`/`ngModel` read `[disabled]`
 * as their own boolean. Clearing keeps the locked side (with `allowEmpty` on the other
 * side, the form then holds `[null, end]`).
 */
export const LockedSide: Story = {
  render: () => ({
    moduleMetadata: { imports: [ReactiveFormsModule, JsonPipe] },
    props: {
      lockStart: [true, false] as const,
      lockEnd: [false, true] as const,
      stay: [new Date(2024, 1, 12), new Date(2024, 1, 16)] as const,
      febMonth: new Date(2024, 1, 1),
      booking: new FormControl<AndesDatePickerValue>(
        [new Date(2024, 1, 12), new Date(2024, 1, 16)],
        { nonNullable: false },
      ),
      emptyStart: [true, false] as const,
      caption: CAPTION,
      log: LOG,
    },
    template: `<div style="min-height: 26rem; display: flex; flex-wrap: wrap; gap: 1.5rem; align-items: flex-start;">
      <div style="width: 20rem;">
        <p [style]="caption">Check-in locked ([disabled])</p>
        <andes-date-picker style="width: 100%" mode="range" locale="en-US" aria-label="Stay, check-in locked" [disabled]="lockStart" [value]="stay" [defaultMonth]="febMonth" [startInputLabel]="'Check-in'" [endInputLabel]="'Check-out'" />
      </div>
      <div style="width: 20rem;">
        <p [style]="caption">Check-out locked, in a form (disabledSides)</p>
        <andes-date-picker style="width: 100%" mode="range" locale="en-US" aria-label="Stay, check-out locked" [disabledSides]="lockEnd" [allowEmpty]="emptyStart" [formControl]="booking" [defaultMonth]="febMonth" />
        <pre [style]="log">value: {{ booking.value | json }}</pre>
      </div>
    </div>`,
  }),
};

/**
 * Open-ended ranges with `allowEmpty`: a side allowed to stay empty commits the range
 * as soon as the other side is picked or typed - `[start, null]` ("from") or
 * `[null, end]` ("until"), shown with the empty side's placeholder. Click the end input
 * first for an "until" range. The form value follows every pick; with `needConfirm` the
 * OK button confirms a half range too. Without `allowEmpty` (last field) half a range
 * stays `null`.
 */
export const OpenEnded: Story = {
  render: () => ({
    moduleMetadata: { imports: [ReactiveFormsModule, JsonPipe] },
    props: {
      either: true,
      fromOnly: [false, true] as const,
      eitherControl: new FormControl<AndesDatePickerValue>(null),
      fromControl: new FormControl<AndesDatePickerValue>(null),
      strictControl: new FormControl<AndesDatePickerValue>(null),
      placeholderPair: ['From', 'Until'] as const,
      febMonth: new Date(2024, 1, 1),
      caption: CAPTION,
      log: LOG,
    },
    template: `<div style="min-height: 26rem; display: flex; flex-wrap: wrap; gap: 1.5rem; align-items: flex-start;">
      <div style="width: 20rem;">
        <p [style]="caption">Either side may be empty</p>
        <andes-date-picker style="width: 100%" mode="range" locale="en-US" aria-label="Either side optional" [allowEmpty]="either" [placeholder]="placeholderPair" [formControl]="eitherControl" [defaultMonth]="febMonth" />
        <pre [style]="log">value: {{ eitherControl.value | json }}</pre>
      </div>
      <div style="width: 20rem;">
        <p [style]="caption">End may be empty, with needConfirm</p>
        <andes-date-picker style="width: 100%" mode="range" locale="en-US" aria-label="End optional" [allowEmpty]="fromOnly" needConfirm [formControl]="fromControl" [defaultMonth]="febMonth" />
        <pre [style]="log">value: {{ fromControl.value | json }}</pre>
      </div>
      <div style="width: 20rem;">
        <p [style]="caption">Without allowEmpty</p>
        <andes-date-picker style="width: 100%" mode="range" locale="en-US" aria-label="Both sides required" [formControl]="strictControl" [defaultMonth]="febMonth" />
        <pre [style]="log">value: {{ strictControl.value | json }}</pre>
      </div>
    </div>`,
  }),
};

/**
 * `[(activePickerIndex)]` tells which input is active - `0` start, `1` end - as focus
 * and the calendar move it, and sets it: with the picker focused, the buttons (which do
 * not take focus themselves) send focus to either side, and the next pick edits that
 * side.
 */
export const ActiveInput: Story = {
  render: () => ({
    moduleMetadata: { imports: [JsonPipe] },
    props: {
      side: 0,
      trip: [new Date(2024, 1, 5), new Date(2024, 1, 9)] as const,
      febMonth: new Date(2024, 1, 1),
      log: LOG,
    },
    template: `<div style="min-height: 26rem; display: flex; flex-direction: column; gap: 0.75rem; align-items: flex-start; width: 20rem;">
      <div style="display: flex; gap: 0.5rem;">
        <button type="button" (mousedown)="$event.preventDefault()" (click)="side = 0">Edit departure</button>
        <button type="button" (mousedown)="$event.preventDefault()" (click)="side = 1">Edit return</button>
      </div>
      <andes-date-picker style="width: 100%" mode="range" locale="en-US" aria-label="Trip" [(activePickerIndex)]="side" [(value)]="trip" [defaultMonth]="febMonth" [startInputLabel]="'Departure'" [endInputLabel]="'Return'" />
      <pre [style]="log">activePickerIndex: {{ side }}
value: {{ trip | json }}</pre>
    </div>`,
  }),
};
