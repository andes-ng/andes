import { JsonPipe } from '@angular/common';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import type { Meta, StoryObj } from '@storybook/angular';

import { AndesSelect } from '../select/select';
import { AndesDatePicker, type AndesDatePickerType } from './date-picker';

const meta: Meta<AndesDatePicker> = {
  title: 'Data Entry/Date Picker/Basics/Features',
  component: AndesDatePicker,
  parameters: { layout: 'padded' },
};

const MONO = 'margin: 0; font: 0.75rem/1.5 ui-monospace, monospace;';

export default meta;

type Story = StoryObj<AndesDatePicker>;

const FEB_15 = new Date(2024, 1, 15);

export const Locales: Story = {
  render: () => ({
    template: `<div style="min-height: 26rem; display: flex; gap: 1rem; flex-wrap: wrap;">
      <andes-date-picker locale="en-US" placeholder="en-US" />
      <andes-date-picker locale="es-PE" [weekStartsOn]="1" placeholder="es-PE" />
      <andes-date-picker locale="ja-JP" placeholder="ja-JP" />
      <andes-date-picker locale="es-PE" [weekStartsOn]="1" mode="range" [placeholder]="['Desde', 'Hasta']" startInputLabel="Desde" endInputLabel="Hasta" />
    </div>`,
  }),
};

/**
 * Display and typing. `displayFormat` takes any `Intl.DateTimeFormat` options (first
 * field). `format` (a token pattern) drives both display and typing: with a list, the first
 * pattern displays and every pattern parses - type `15/02/2024`, `15/02/24` or ISO
 * `2024-02-15`, then Enter or Tab (second field). With `preserveInvalidOnBlur`, text that
 * does not parse stays in the input after Tab so it can be corrected, whereas the plain
 * field restores the value - type `Feb 31, 2024` and Tab away (last two fields).
 */
export const Formats: Story = {
  render: () => ({
    moduleMetadata: { imports: [ReactiveFormsModule, FormsModule, JsonPipe] },
    props: {
      displayControl: new FormControl<Date | null>(FEB_15),
      displayFormat: {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      } satisfies Intl.DateTimeFormatOptions,
      typedControl: new FormControl<Date | null>(FEB_15),
      format: ['DD/MM/YYYY', 'DD/MM/YY', 'D MMM YYYY'],
      picked: FEB_15,
    },
    template: `<div style="display: flex; flex-direction: column; gap: 0.75rem; width: 20rem;">
      <andes-date-picker locale="en-US" [displayFormat]="displayFormat" [formControl]="displayControl" aria-label="Long display format" />
      <andes-date-picker locale="en-GB" [weekStartsOn]="1" [format]="format" [formControl]="typedControl" aria-label="Due date" />
      <pre style="font: 0.75rem/1.5 ui-monospace, monospace;">value: {{ typedControl.value | json }}</pre>
      <andes-date-picker locale="en-US" preserveInvalidOnBlur [ngModel]="picked" aria-label="Keeps text" />
      <andes-date-picker locale="en-US" [ngModel]="picked" aria-label="Restores value" />
    </div>`,
  }),
};

/**
 * `picker` selects weeks, months, quarters or years; the value is the first day of
 * the chosen period and the display format follows the picker.
 */
export const Pickers: Story = {
  render: () => ({
    template: `<div style="min-height: 22rem; display: flex; gap: 1rem; flex-wrap: wrap; align-items: flex-start;">
      <andes-date-picker picker="week" locale="en-US" [weekStartsOn]="1" />
      <andes-date-picker picker="month" locale="en-US" />
      <andes-date-picker picker="quarter" locale="en-US" />
      <andes-date-picker picker="year" locale="en-US" />
      <andes-date-picker picker="month" mode="range" locale="en-US" />
    </div>`,
  }),
};

/**
 * Opening and focus on init. `defaultOpen` opens the panel once after the first render
 * (as if the user had opened it), `autoFocus` focuses the input like a native
 * `autofocus` (browser only, never during server rendering), and `panelClass` puts
 * classes on the panel, which renders outside the picker - here a page rule tints its
 * border.
 */
export const OpeningAndFocus: Story = {
  render: () => ({
    props: { febMonth: new Date(2024, 1, 1), extraClasses: ['story-panel'] },
    // The panel renders in the overlay container, outside this story's encapsulation.
    styles: [
      '::ng-deep .story-panel { outline: 2px dashed var(--andes-color-primary); outline-offset: 2px; }',
    ],
    template: `<div style="min-height: 26rem; display: flex; gap: 1rem; flex-wrap: wrap; align-items: flex-start;">
      <andes-date-picker locale="en-US" aria-label="Opens on load" defaultOpen [panelClass]="extraClasses" [defaultMonth]="febMonth" />
      <andes-date-picker style="--andes-date-picker-width: 10rem;" locale="en-US" aria-label="Focused on load" autoFocus placeholder="Focused on load" />
    </div>`,
  }),
};

/**
 * What leaving the field does with typed text. Type a date (`2024-02-20`) or a bad one
 * (`Feb 31, 2024`) and press Tab:
 *
 * - The default commits valid text, unless the picker needs confirmation (`needConfirm`
 *   or `showTime`), where it is dropped; invalid text is dropped either way.
 * - `changeOnBlur` commits valid text - and pending calendar picks - even then.
 * - `preserveInvalidOnBlur` keeps invalid text in the input to correct, value unchanged.
 */
export const BlurCommit: Story = {
  render: () => ({
    moduleMetadata: { imports: [FormsModule, JsonPipe] },
    props: {
      plainValue: FEB_15,
      blurValue: FEB_15,
      bothValue: FEB_15,
      caption:
        'margin: 0 0 0.375rem; font: 0.75rem/1.25rem var(--andes-font-family), sans-serif; color: var(--andes-color-muted-foreground);',
      log: 'margin: 0.25rem 0 0; font: 0.75rem/1.5 ui-monospace, monospace;',
    },
    template: `<div style="display: flex; flex-direction: column; gap: 1rem; width: 20rem; min-height: 26rem;">
      <div>
        <p [style]="caption">needConfirm (default blur)</p>
        <andes-date-picker locale="en-US" aria-label="needConfirm, default blur" needConfirm [(ngModel)]="plainValue" />
        <pre [style]="log">{{ plainValue | json }}</pre>
      </div>
      <div>
        <p [style]="caption">needConfirm + changeOnBlur</p>
        <andes-date-picker locale="en-US" aria-label="needConfirm with changeOnBlur" needConfirm changeOnBlur [(ngModel)]="blurValue" />
        <pre [style]="log">{{ blurValue | json }}</pre>
      </div>
      <div>
        <p [style]="caption">changeOnBlur + preserveInvalidOnBlur</p>
        <andes-date-picker locale="en-US" aria-label="changeOnBlur with preserveInvalidOnBlur" changeOnBlur preserveInvalidOnBlur [(ngModel)]="bothValue" />
        <pre [style]="log">{{ bothValue | json }}</pre>
      </div>
    </div>`,
  }),
};

/**
 * `captionLayout` swaps the calendar's caption for month and year `AndesSelect`s, to
 * jump far without paging: `dropdown` (both), `dropdown-years` (a year select beside the
 * month name). The years come from `min`/`max` (or `startYear`/`endYear`), and months
 * outside the bounds are disabled; a range's two months each get their own selects.
 */
export const CaptionDropdowns: Story = {
  render: () => ({
    props: {
      earliest: new Date(1940, 0, 1),
      latest: new Date(),
      bookingStart: new Date(2024, 1, 10),
      bookingEnd: new Date(2025, 5, 30),
    },
    template: `<div style="min-height: 26rem; display: flex; gap: 1rem; flex-wrap: wrap; align-items: flex-start;">
      <andes-date-picker locale="en-US" aria-label="Date of birth" placeholder="Date of birth" captionLayout="dropdown" [min]="earliest" [max]="latest" />
      <andes-date-picker style="--andes-date-picker-width: 10rem;" locale="en-US" aria-label="Year select only" placeholder="Year select only" captionLayout="dropdown-years" [startYear]="2000" [endYear]="2030" />
      <andes-date-picker mode="range" locale="en-US" aria-label="Booking window" captionLayout="dropdown" [min]="bookingStart" [max]="bookingEnd" />
    </div>`,
  }),
};

/**
 * One select switches the `picker` of three fields at once, a single, a range and a multiple
 * picker (the multiple one is hidden for `time`, which has no multiple mode): `time`, `date`,
 * `week`, `month`, `quarter` and `year`. The components are not rebuilt: each value stays what
 * it was and is shown in the new picker's format (a week, a month...), the calendar opens on
 * its grid, and the next pick is a period of the new kind.
 */
export const SwitchablePicker: Story = {
  render: () => ({
    moduleMetadata: { imports: [AndesSelect, FormsModule, JsonPipe] },
    props: {
      type: 'date' as AndesDatePickerType,
      types: ['time', 'date', 'week', 'month', 'quarter', 'year'].map(
        (value) => ({ value, label: value }),
      ),
      picked: FEB_15,
      span: [new Date(2024, 1, 5), new Date(2024, 1, 12)],
      // Different weeks, months, quarters and years, so every picker shows two distinct tags.
      several: [new Date(2024, 1, 2), new Date(2025, 5, 14)],
      mono: MONO,
    },
    template: `<div style="min-height: 28rem; display: flex; flex-direction: column; gap: 0.75rem;">
      <andes-select [options]="types" [(value)]="type" aria-label="Picker" style="width: 7.5rem;" />
      <div style="display: flex; flex-wrap: wrap; gap: 1rem; align-items: flex-start;">
        <andes-date-picker style="width: 13rem;" [picker]="type" locale="en-US" [(ngModel)]="picked" aria-label="Switchable" />
        <andes-date-picker style="width: 22rem;" mode="range" [picker]="type" locale="en-US" [ngModel]="span" aria-label="Switchable range" />
        @if (type !== 'time') {
          <andes-date-picker style="width: 18rem;" mode="multiple" [picker]="type" locale="en-US" [ngModel]="several" aria-label="Switchable multiple" />
        }
      </div>
      <pre [style]="mono">picker: {{ type }}
value: {{ picked | json }}</pre>
    </div>`,
  }),
};

/**
 * `format` as `{ format, type: 'mask' }`: the input keeps the pattern's shape. Digits
 * fill the number under the caret and move on, Left and Right switch numbers, Up and Down
 * step one, Backspace empties it and `/` moves on; leave a half-typed mask and it goes
 * back to the value. The second field masks a date and time, the third a time picker
 * (whose columns follow the mask: hours and minutes).
 */
export const MaskFormat: Story = {
  render: () => ({
    moduleMetadata: { imports: [FormsModule, JsonPipe] },
    props: {
      dateMask: { format: 'DD/MM/YYYY', type: 'mask' },
      dateTimeMask: { format: 'YYYY-MM-DD HH:mm', type: 'mask' },
      timeMask: { format: 'HH:mm', type: 'mask' },
      picked: FEB_15,
      meeting: new Date(2024, 1, 15, 9, 30),
      mono: MONO,
    },
    template: `<div style="min-height: 26rem; display: flex; flex-direction: column; gap: 0.75rem; width: 18rem;">
      <andes-date-picker locale="en-GB" [format]="dateMask" [(ngModel)]="picked" aria-label="Masked date" />
      <andes-date-picker locale="en-GB" showTime [format]="dateTimeMask" [(ngModel)]="meeting" aria-label="Masked date and time" />
      <andes-date-picker picker="time" locale="en-GB" [format]="timeMask" aria-label="Masked time" />
      <pre [style]="mono">{{ picked | json }}
{{ meeting | json }}</pre>
    </div>`,
  }),
};

/**
 * Alternative calendars through `locale`. `th-TH` (first field) runs on the Buddhist
 * calendar: the field and the calendar's captions show 2567 for 2024, and a year typed in
 * that era is read back. `-u-ca-buddhist` does the same in any locale (second), and the
 * `BBBB` token puts the Buddhist year in a token format (third).
 */
export const BuddhistEra: Story = {
  render: () => ({
    moduleMetadata: { imports: [FormsModule] },
    props: { picked: FEB_15 },
    template: `<div style="min-height: 26rem; display: flex; gap: 1rem; flex-wrap: wrap; align-items: flex-start;">
      <andes-date-picker locale="th-TH" [(ngModel)]="picked" aria-label="Thai" />
      <andes-date-picker style="--andes-date-picker-width: 10rem;" locale="en-US-u-ca-buddhist" [(ngModel)]="picked" aria-label="Buddhist era" />
      <andes-date-picker locale="en-GB" format="DD/MM/BBBB" [(ngModel)]="picked" aria-label="BBBB token" />
    </div>`,
  }),
};

/**
 * `needConfirm` keeps every pick pending until OK (or Enter): closing the panel any other
 * way drops it. It is on by default with a time and off otherwise; here it is forced on a
 * plain date and a range, so the field only changes on OK.
 */
export const NeedConfirm: Story = {
  render: () => ({
    moduleMetadata: { imports: [FormsModule, JsonPipe] },
    props: { picked: FEB_15, range: null, mono: MONO },
    template: `<div style="min-height: 26rem; display: flex; flex-direction: column; gap: 0.75rem; width: 20rem;">
      <andes-date-picker locale="en-US" needConfirm [(ngModel)]="picked" aria-label="Confirmed date" />
      <andes-date-picker mode="range" locale="en-US" needConfirm [(ngModel)]="range" aria-label="Confirmed range" />
      <pre [style]="mono">{{ picked | json }}
{{ range | json }}</pre>
    </div>`,
  }),
};
