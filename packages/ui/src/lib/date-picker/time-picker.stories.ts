import { JsonPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';

import { AndesButton } from '../button/button';
import { AndesDatePicker } from './date-picker';

/**
 * The time picker is the date picker with `picker="time"`: time columns without a calendar,
 * in a single field or a range. These stories cover its basics, sizes, confirmation,
 * disabled fields, columns, steps, the 12-hour clock and the footer; the second group of
 * time picker stories covers ranges, disabled times, variants and the rest.
 */
// No `component` on the meta: Storybook assigns every story prop that is not an input to the
// first picker in the template, which would overwrite its own members (`range`, `time`,
// `placeholders`...). The picker is imported through a decorator instead.
const meta: Meta<AndesDatePicker> = {
  title: 'Data Entry/Time Picker',
  decorators: [moduleMetadata({ imports: [AndesDatePicker] })],
  parameters: { layout: 'padded' },
  argTypes: {
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    variant: {
      control: 'select',
      options: ['outlined', 'filled', 'borderless', 'underlined'],
    },
    status: { control: 'select', options: [null, 'error', 'warning'] },
    placement: {
      control: 'select',
      options: ['bottomLeft', 'bottomRight', 'topLeft', 'topRight'],
    },
    disabled: { control: 'boolean' },
    allowClear: { control: 'boolean' },
    inputReadOnly: { control: 'boolean' },
    needConfirm: { control: 'boolean' },
    showNow: { control: 'boolean' },
  },
  args: {
    size: 'md',
    variant: 'outlined',
    status: null,
    placement: 'bottomLeft',
    disabled: false,
    allowClear: true,
    inputReadOnly: false,
    needConfirm: true,
    showNow: true,
  },
};

export default meta;

type Story = StoryObj<AndesDatePicker>;

const NINE_THIRTY = new Date(2024, 1, 15, 9, 30, 0);
const MONO = 'margin: 0; font: 0.75rem/1.5 ui-monospace, monospace;';
const CAPTION =
  'margin: 0 0 0.375rem; font: 0.75rem/1.25rem var(--andes-font-family), sans-serif; color: var(--andes-color-muted-foreground);';
const RANGE = [
  new Date(2024, 1, 15, 9, 0, 0),
  new Date(2024, 1, 15, 17, 30, 0),
];

/**
 * A time picker: click the field and pick an hour and a minute, then OK (Now sets the
 * current time). Typing works too (`14:30`, then Enter). The controls change the field.
 */
export const Basic: Story = {
  render: (args) => ({
    props: { ...args },
    template: `<div style="min-height: 22rem;">
      <andes-date-picker picker="time" locale="en-GB" aria-label="Time"
        [size]="size" [variant]="variant" [status]="status" [placement]="placement"
        [disabled]="disabled" [allowClear]="allowClear" [inputReadOnly]="inputReadOnly"
        [needConfirm]="needConfirm" [showNow]="showNow" />
    </div>`,
  }),
};

/**
 * The panels open, without a click: the default hour and minute columns, a time with
 * seconds, and a 12-hour clock with the AM/PM column. The selected option of each column
 * is brought to the top.
 */
export const BasicOpen: Story = {
  render: () => ({
    props: {
      time: NINE_THIRTY,
      seconds: { showSecond: true },
      twelve: { use12Hours: true },
      caption: CAPTION,
    },
    template: `<div style="display: flex; flex-wrap: wrap; gap: 1rem 1.5rem; align-items: flex-start;">
      <div style="width: 15rem; min-height: 22rem;">
        <p [style]="caption">Hours and minutes</p>
        <andes-date-picker picker="time" locale="en-GB" [value]="time" [open]="true" aria-label="Time" />
      </div>
      <div style="width: 15rem; min-height: 22rem;">
        <p [style]="caption">With seconds</p>
        <andes-date-picker picker="time" locale="en-GB" [showTime]="seconds" [value]="time" [open]="true" aria-label="Time with seconds" />
      </div>
      <div style="width: 15rem; min-height: 22rem;">
        <p [style]="caption">12-hour clock</p>
        <andes-date-picker picker="time" locale="en-US" [showTime]="twelve" [value]="time" [open]="true" aria-label="12-hour time" />
      </div>
    </div>`,
  }),
};

/**
 * Under control: the value lives in your own field, `[(value)]` keeps the two in sync and
 * the buttons set it from outside; `[(open)]` does the same for the panel, and the log shows
 * what `valueChange` and `valueTextChange` report.
 */
export const UnderControl: Story = {
  render: () => ({
    moduleMetadata: { imports: [JsonPipe, AndesButton] },
    props: {
      time: NINE_THIRTY as Date | null,
      isOpen: false,
      text: null as unknown,
      morning: new Date(2024, 1, 15, 9, 0, 0),
      evening: new Date(2024, 1, 15, 18, 45, 0),
      mono: MONO,
    },
    template: `<div style="display: flex; flex-direction: column; gap: 0.75rem; align-items: flex-start; min-height: 24rem;">
      <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
        <andes-button size="sm" variant="outline" (click)="time = morning">09:00</andes-button>
        <andes-button size="sm" variant="outline" (click)="time = evening">18:45</andes-button>
        <andes-button size="sm" variant="outline" (click)="time = null">Clear</andes-button>
        <andes-button size="sm" variant="outline" (click)="isOpen = !isOpen">{{ isOpen ? 'Close' : 'Open' }} the panel</andes-button>
      </div>
      <andes-date-picker picker="time" locale="en-GB" [(value)]="time" [(open)]="isOpen" (valueTextChange)="text = $event" aria-label="Controlled time" />
      <pre [style]="mono">value: {{ time | json }}
text: {{ text | json }}
open: {{ isOpen }}</pre>
    </div>`,
  }),
};

/**
 * The three sizes (24, 32 and 40px) for a time, a time with seconds, a 12-hour time and a
 * range.
 */
export const ThreeSizes: Story = {
  render: () => ({
    moduleMetadata: { imports: [FormsModule] },
    props: {
      sizes: ['sm', 'md', 'lg'],
      seconds: { showSecond: true },
      twelve: { use12Hours: true },
      time: NINE_THIRTY,
      range: RANGE,
      caption: CAPTION,
    },
    template: `<div style="display: flex; flex-direction: column; gap: 1.25rem;">
      @for (size of sizes; track size) {
        <div>
          <p [style]="caption">size="{{ size }}"</p>
          <div style="display: flex; flex-wrap: wrap; gap: 0.75rem; align-items: flex-start;">
            <andes-date-picker style="width: 9rem;" picker="time" locale="en-GB" [size]="size" [ngModel]="time" [aria-label]="size + ' time'" />
            <andes-date-picker style="width: 10rem;" picker="time" locale="en-GB" [size]="size" [showTime]="seconds" [ngModel]="time" [aria-label]="size + ' time with seconds'" />
            <andes-date-picker style="width: 10rem;" picker="time" locale="en-US" [size]="size" [showTime]="twelve" [ngModel]="time" [aria-label]="size + ' 12-hour time'" />
            <andes-date-picker style="width: 16rem;" picker="time" mode="range" locale="en-GB" [size]="size" [ngModel]="range" [aria-label]="size + ' time range'" />
          </div>
        </div>
      }
    </div>`,
  }),
};

/**
 * `needConfirm`: on by default for time columns, so a pick stays pending until OK (or
 * Enter) and closing the panel drops it. With `[needConfirm]="false"` every pick commits as
 * it is made. The first row is a single time, the second a range, each with the two
 * settings and the committed value shown beneath.
 */
export const NeedConfirm: Story = {
  render: () => ({
    moduleMetadata: { imports: [FormsModule, JsonPipe] },
    props: {
      confirmed: NINE_THIRTY as Date | null,
      immediate: NINE_THIRTY as Date | null,
      confirmedRange: RANGE as Date[] | null,
      immediateRange: RANGE as Date[] | null,
      mono: MONO,
      caption: CAPTION,
    },
    template: `<div style="display: grid; grid-template-columns: repeat(2, minmax(0, 22rem)); gap: 0.75rem 1.5rem; align-items: start; align-content: start; min-height: 26rem;">
      <div>
        <p [style]="caption">needConfirm (default)</p>
        <andes-date-picker style="width: 100%;" picker="time" locale="en-GB" [(ngModel)]="confirmed" aria-label="Time with confirmation" />
        <pre [style]="mono">{{ confirmed | json }}</pre>
      </div>
      <div>
        <p [style]="caption">[needConfirm]="false"</p>
        <andes-date-picker style="width: 100%;" picker="time" locale="en-GB" [needConfirm]="false" [(ngModel)]="immediate" aria-label="Time without confirmation" />
        <pre [style]="mono">{{ immediate | json }}</pre>
      </div>
      <div>
        <p [style]="caption">Range, needConfirm (default)</p>
        <andes-date-picker style="width: 100%;" picker="time" mode="range" locale="en-GB" [(ngModel)]="confirmedRange" aria-label="Time range with confirmation" />
        <pre [style]="mono">{{ confirmedRange | json }}</pre>
      </div>
      <div>
        <p [style]="caption">Range, [needConfirm]="false"</p>
        <andes-date-picker style="width: 100%;" picker="time" mode="range" locale="en-GB" [needConfirm]="false" [(ngModel)]="immediateRange" aria-label="Time range without confirmation" />
        <pre [style]="mono">{{ immediateRange | json }}</pre>
      </div>
    </div>`,
  }),
};

/**
 * Disabled time pickers: the whole field, a field with a value, and a range locked as a whole
 * or per side (`[true, false]` keeps the start fixed and the end editable, `[false, true]`
 * the reverse). A locked side cannot be focused or typed in.
 */
export const Disabled: Story = {
  render: () => ({
    moduleMetadata: { imports: [FormsModule] },
    props: {
      time: NINE_THIRTY,
      range: RANGE,
      startLocked: [true, false] as const,
      endLocked: [false, true] as const,
      caption: CAPTION,
    },
    template: `<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(18rem, 1fr)); gap: 1rem 1.5rem; align-items: start; align-content: start; min-height: 22rem;">
      <div>
        <p [style]="caption">Disabled</p>
        <andes-date-picker style="width: 100%;" picker="time" locale="en-GB" disabled aria-label="Disabled time" />
      </div>
      <div>
        <p [style]="caption">Disabled, with a value</p>
        <andes-date-picker style="width: 100%;" picker="time" locale="en-GB" disabled [ngModel]="time" aria-label="Disabled time with a value" />
      </div>
      <div>
        <p [style]="caption">Range, disabled</p>
        <andes-date-picker style="width: 100%;" picker="time" mode="range" locale="en-GB" disabled [ngModel]="range" aria-label="Disabled time range" />
      </div>
      <div>
        <p [style]="caption">Range, start locked</p>
        <andes-date-picker style="width: 100%;" picker="time" mode="range" locale="en-GB" [disabled]="startLocked" [ngModel]="range" aria-label="Time range, start locked" />
      </div>
      <div>
        <p [style]="caption">Range, end locked</p>
        <andes-date-picker style="width: 100%;" picker="time" mode="range" locale="en-GB" [disabled]="endLocked" [ngModel]="range" aria-label="Time range, end locked" />
      </div>
      <div>
        <p [style]="caption">12 hours, disabled</p>
        <andes-date-picker style="width: 100%;" picker="time" locale="en-US" disabled [showTime]="{ use12Hours: true }" [ngModel]="time" aria-label="Disabled 12-hour time" />
      </div>
    </div>`,
  }),
};

/**
 * Hour and minute: the format decides the columns. `HH:mm` shows hours and minutes
 * (two columns), `HH` the hours alone, `mm:ss` minutes and seconds, and `HH:mm:ss` all
 * three. Each is shown open as a single picker, with the range version of `HH:mm` closed
 * on top.
 */
export const HourAndMinute: Story = {
  render: () => ({
    moduleMetadata: { imports: [FormsModule] },
    props: {
      formats: ['HH:mm', 'HH', 'mm:ss', 'HH:mm:ss'],
      time: new Date(2024, 1, 15, 14, 30, 15),
      range: RANGE,
      caption: CAPTION,
    },
    template: `<div style="display: flex; flex-direction: column; gap: 1rem;">
      <andes-date-picker style="width: 16rem;" picker="time" mode="range" locale="en-GB" format="HH:mm" [value]="range" aria-label="Hour and minute range" />
      <div style="display: flex; flex-wrap: wrap; gap: 1rem 1.5rem; align-items: flex-start;">
        @for (format of formats; track format) {
          <div style="width: 15rem; min-height: 22rem;">
            <p [style]="caption">format="{{ format }}"</p>
            <andes-date-picker picker="time" locale="en-GB" [format]="format" [value]="time" [open]="true" [aria-label]="format" />
          </div>
        }
      </div>
    </div>`,
  }),
};

/**
 * Interval options: `hourStep`, `minuteStep` and `secondStep` thin each column. Here every
 * second hour, every fifteen minutes with seconds every ten, and a range with
 * quarter-hour minutes. A value that falls between steps (09:07) is shown as typed and
 * rounds to the step when picked again.
 */
export const IntervalOptions: Story = {
  render: () => ({
    props: {
      hours: { hourStep: 2 },
      quarters: { minuteStep: 15, showSecond: true, secondStep: 10 },
      rangeSteps: { minuteStep: 15 },
      time: new Date(2024, 1, 15, 8, 30, 0),
      range: RANGE,
      caption: CAPTION,
    },
    template: `<div style="display: flex; flex-wrap: wrap; gap: 1rem 1.5rem; align-items: flex-start;">
      <div style="width: 15rem; min-height: 22rem;">
        <p [style]="caption">hourStep 2</p>
        <andes-date-picker picker="time" locale="en-GB" [showTime]="hours" [value]="time" [open]="true" aria-label="Every second hour" />
      </div>
      <div style="width: 15rem; min-height: 22rem;">
        <p [style]="caption">minuteStep 15, secondStep 10</p>
        <andes-date-picker picker="time" locale="en-GB" [showTime]="quarters" [value]="time" [open]="true" aria-label="Quarter hours and ten seconds" />
      </div>
      <div style="width: 22rem; min-height: 22rem;">
        <p [style]="caption">Range, minuteStep 15</p>
        <andes-date-picker picker="time" mode="range" locale="en-GB" [showTime]="rangeSteps" [value]="range" [open]="true" aria-label="Range in quarter hours" />
      </div>
    </div>`,
  }),
};

/**
 * Addon: `extraFooter` puts a template at the bottom of the panel, in a single and a range
 * picker. Here a note, and a button of the library that sets the value from inside the
 * footer. The footer's context says the grid on show is `time`.
 */
export const Addon: Story = {
  render: () => ({
    moduleMetadata: { imports: [FormsModule, AndesButton] },
    props: {
      time: NINE_THIRTY as Date | null,
      range: RANGE as Date[] | null,
      noon: new Date(2024, 1, 15, 12, 0, 0),
      caption: CAPTION,
    },
    template: `
      <ng-template #note let-view>
        <span style="font-size: 0.75rem;">Opening hours are 09:00 to 18:00 ({{ view }} panel)</span>
      </ng-template>
      <ng-template #noonButton>
        <andes-button size="xs" variant="link" (click)="time = noon">Noon</andes-button>
      </ng-template>
      <div style="display: flex; flex-wrap: wrap; gap: 1rem 1.5rem; align-items: flex-start;">
        <div style="width: 19rem; min-height: 24rem;">
          <p [style]="caption">Single, with a note</p>
          <andes-date-picker picker="time" locale="en-GB" [extraFooter]="note" [value]="time" [open]="true" aria-label="Time with a note" />
        </div>
        <div style="width: 19rem; min-height: 24rem;">
          <p [style]="caption">Single, with a button</p>
          <andes-date-picker picker="time" locale="en-GB" [extraFooter]="noonButton" [(value)]="time" [open]="true" aria-label="Time with a button" />
        </div>
        <div style="width: 22rem; min-height: 24rem;">
          <p [style]="caption">Range, with a note</p>
          <andes-date-picker picker="time" mode="range" locale="en-GB" [extraFooter]="note" [value]="range" [open]="true" aria-label="Time range with a note" />
        </div>
      </div>
    `,
  }),
};

/**
 * 12 hours: `use12Hours` runs hours 12, 1 to 11 with an AM/PM column, and the field uses the
 * 12-hour form (`h:mm:ss a` with seconds). Without seconds, with seconds, and as a range;
 * the panels are open.
 */
export const TwelveHours: Story = {
  render: () => ({
    props: {
      twelve: { use12Hours: true },
      twelveSeconds: { use12Hours: true, showSecond: true },
      time: new Date(2024, 1, 15, 14, 30, 15),
      range: [new Date(2024, 1, 15, 9, 0, 0), new Date(2024, 1, 15, 17, 30, 0)],
      caption: CAPTION,
    },
    template: `<div style="display: flex; flex-wrap: wrap; gap: 1rem 1.5rem; align-items: flex-start;">
      <div style="width: 15rem; min-height: 22rem;">
        <p [style]="caption">use12Hours</p>
        <andes-date-picker picker="time" locale="en-US" [showTime]="twelve" [value]="time" [open]="true" aria-label="12-hour time" />
      </div>
      <div style="width: 19rem; min-height: 22rem;">
        <p [style]="caption">use12Hours, with seconds</p>
        <andes-date-picker picker="time" locale="en-US" [showTime]="twelveSeconds" [value]="time" [open]="true" aria-label="12-hour time with seconds" />
      </div>
      <div style="width: 22rem; min-height: 22rem;">
        <p [style]="caption">Range</p>
        <andes-date-picker picker="time" mode="range" locale="en-US" [showTime]="twelve" [value]="range" [open]="true" aria-label="12-hour time range" />
      </div>
    </div>`,
  }),
};

/**
 * Now: the "Now" shortcut is on by default in a single time picker (first). `showNow` set
 * to false hides it (second), and the shortcut commits at once when `needConfirm` is off
 * (third). A range has no Now button: its two sides are picked one after the other.
 */
export const NowButton: Story = {
  render: () => ({
    props: { caption: CAPTION },
    template: `<div style="display: flex; flex-wrap: wrap; gap: 1rem 1.5rem; align-items: flex-start;">
      <div style="width: 15rem; min-height: 24rem;">
        <p [style]="caption">Default</p>
        <andes-date-picker picker="time" locale="en-GB" [open]="true" aria-label="Time with Now" />
      </div>
      <div style="width: 15rem; min-height: 24rem;">
        <p [style]="caption">showNow false</p>
        <andes-date-picker picker="time" locale="en-GB" [showNow]="false" [open]="true" aria-label="Time without Now" />
      </div>
      <div style="width: 15rem; min-height: 24rem;">
        <p [style]="caption">needConfirm false</p>
        <andes-date-picker picker="time" locale="en-GB" [needConfirm]="false" [open]="true" aria-label="Time, Now without OK" />
      </div>
      <div style="width: 22rem; min-height: 24rem;">
        <p [style]="caption">Range</p>
        <andes-date-picker picker="time" mode="range" locale="en-GB" [open]="true" aria-label="Time range without Now" />
      </div>
    </div>`,
  }),
};

/**
 * Change on scroll: `showTime.changeOnScroll` picks the option a column comes to rest on,
 * and the field follows while scrolling. With the OK button (on by default) nothing is
 * committed until OK, and the committed value is shown beneath. Single, 12-hour and range.
 */
export const ChangeOnScroll: Story = {
  render: () => ({
    moduleMetadata: { imports: [JsonPipe] },
    props: {
      options: { changeOnScroll: true, showSecond: true },
      twelve: { changeOnScroll: true, use12Hours: true },
      rangeOptions: { changeOnScroll: true },
      time: NINE_THIRTY as Date | null,
      twelveTime: NINE_THIRTY as Date | null,
      range: RANGE as Date[] | null,
      mono: MONO,
      caption: CAPTION,
    },
    template: `<div style="display: flex; flex-wrap: wrap; gap: 1rem 1.5rem; align-items: flex-start;">
      <div style="width: 19rem; min-height: 26rem;">
        <p [style]="caption">With seconds</p>
        <andes-date-picker picker="time" locale="en-GB" [showTime]="options" [(value)]="time" [open]="true" aria-label="Change on scroll" />
        <pre [style]="mono">{{ time | json }}</pre>
      </div>
      <div style="width: 19rem; min-height: 26rem;">
        <p [style]="caption">12 hours</p>
        <andes-date-picker picker="time" locale="en-US" [showTime]="twelve" [(value)]="twelveTime" [open]="true" aria-label="Change on scroll, 12 hours" />
        <pre [style]="mono">{{ twelveTime | json }}</pre>
      </div>
      <div style="width: 22rem; min-height: 26rem;">
        <p [style]="caption">Range</p>
        <andes-date-picker picker="time" mode="range" locale="en-GB" [showTime]="rangeOptions" [(value)]="range" [open]="true" aria-label="Change on scroll, range" />
        <pre [style]="mono">{{ range | json }}</pre>
      </div>
    </div>`,
  }),
};
