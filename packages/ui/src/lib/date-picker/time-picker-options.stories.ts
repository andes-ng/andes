import { JsonPipe } from '@angular/common';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
  type AbstractControl,
  type ValidationErrors,
} from '@angular/forms';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';

import { AndesButton } from '../button/button';
import { AndesDatePicker, type AndesDisabledTime } from './date-picker';

/**
 * More time picker stories (`picker="time"`): ranges, disabled times, variants, status,
 * prefix and suffix, custom cells, placement, locales, the field's own options, forms,
 * masks and the dark theme. The first group of time picker stories covers the basics.
 */
// No `component` on the meta: Storybook assigns every story prop that is not an input to the
// first picker in the template, which would overwrite its own members (`range`, `time`,
// `placeholders`...). The picker is imported through a decorator instead.
const meta: Meta<AndesDatePicker> = {
  title: 'Data Entry/Time Picker',
  decorators: [moduleMetadata({ imports: [AndesDatePicker] })],
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<AndesDatePicker>;

const NINE_THIRTY = new Date(2024, 1, 15, 9, 30, 0);
const AFTERNOON = new Date(2024, 1, 15, 14, 30, 0);
const MONO = 'margin: 0; font: 0.75rem/1.5 ui-monospace, monospace;';
const CAPTION =
  'margin: 0 0 0.375rem; font: 0.75rem/1.25rem var(--andes-font-family), sans-serif; color: var(--andes-color-muted-foreground);';
const RANGE = [
  new Date(2024, 1, 15, 9, 0, 0),
  new Date(2024, 1, 15, 17, 30, 0),
];

/**
 * A time range: two inputs and one panel, which follows the input being edited (the first OK
 * confirms the start and moves to the end). A range with the start before the end (first), a
 * night shift that crosses midnight with `[order]="false"` so 22:00 to 06:00 keeps its order
 * (second), `allowEmpty` for an open end or an open start (third and fourth), and a range
 * with custom placeholders.
 */
export const TimeRange: Story = {
  render: () => ({
    moduleMetadata: { imports: [FormsModule, JsonPipe] },
    props: {
      range: RANGE as Date[] | null,
      shift: [new Date(2024, 1, 15, 22, 0, 0), new Date(2024, 1, 15, 6, 0, 0)],
      from: [new Date(2024, 1, 15, 9, 0, 0), null],
      until: [null, new Date(2024, 1, 15, 17, 0, 0)],
      openEnd: [false, true] as const,
      openStart: [true, false] as const,
      placeholders: ['Opens', 'Closes'] as const,
      mono: MONO,
      caption: CAPTION,
    },
    template: `<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(20rem, 1fr)); gap: 1rem 1.5rem; align-items: start; align-content: start; min-height: 24rem;">
      <div>
        <p [style]="caption">Start before end</p>
        <andes-date-picker style="width: 100%;" picker="time" mode="range" locale="en-GB" [(ngModel)]="range" aria-label="Opening hours" />
        <pre [style]="mono">{{ range | json }}</pre>
      </div>
      <div>
        <p [style]="caption">[order]="false", night shift</p>
        <andes-date-picker style="width: 100%;" picker="time" mode="range" locale="en-GB" [order]="false" [ngModel]="shift" aria-label="Night shift" />
      </div>
      <div>
        <p [style]="caption">allowEmpty, open end</p>
        <andes-date-picker style="width: 100%;" picker="time" mode="range" locale="en-GB" [allowEmpty]="openEnd" [ngModel]="from" aria-label="From nine" />
      </div>
      <div>
        <p [style]="caption">allowEmpty, open start</p>
        <andes-date-picker style="width: 100%;" picker="time" mode="range" locale="en-GB" [allowEmpty]="openStart" [ngModel]="until" aria-label="Until five" />
      </div>
      <div>
        <p [style]="caption">Placeholders</p>
        <andes-date-picker style="width: 100%;" picker="time" mode="range" locale="en-GB" [placeholder]="placeholders" startInputLabel="Opens" endInputLabel="Closes" aria-label="Opening hours, empty" />
      </div>
      <div>
        <p [style]="caption">12 hours</p>
        <andes-date-picker style="width: 100%;" picker="time" mode="range" locale="en-US" [showTime]="{ use12Hours: true }" [ngModel]="range" aria-label="Opening hours, 12 hours" />
      </div>
    </div>`,
  }),
};

/**
 * Disabled time: `timeDisabled` rules out hours, minutes and seconds, and the field, the
 * columns and typing all honour it. Left: working hours 09:00 to 17:45 with the unavailable
 * options listed greyed out. Middle: the same with `hideDisabledOptions`, which leaves them
 * out. Right: a range whose end cannot be earlier than its start (`info.from` while the end is
 * edited, `info.side`), shown open.
 */
export const DisabledTime: Story = {
  render: () => ({
    props: {
      workHours: (): AndesDisabledTime => ({
        disabledHours: () => [
          0, 1, 2, 3, 4, 5, 6, 7, 8, 18, 19, 20, 21, 22, 23,
        ],
        disabledMinutes: (hour: number) => (hour === 17 ? [45, 50, 55] : []),
        disabledSeconds: (hour: number, minute: number) =>
          hour === 12 && minute === 0 ? [30] : [],
      }),
      hidden: { hideDisabledOptions: true },
      afterStart: (
        _date: Date | null,
        info: { side: 'start' | 'end'; from?: Date },
      ): AndesDisabledTime | null => {
        if (info.side !== 'end' || !info.from) {
          return null;
        }
        const hour = info.from.getHours();
        const minute = info.from.getMinutes();
        return {
          disabledHours: () => Array.from({ length: hour }, (_, i) => i),
          disabledMinutes: (picked: number) =>
            picked === hour ? Array.from({ length: minute }, (_, i) => i) : [],
        };
      },
      side: 1,
      time: new Date(2024, 1, 15, 10, 15, 0),
      range: [new Date(2024, 1, 15, 9, 0, 0), new Date(2024, 1, 15, 17, 30, 0)],
      caption: CAPTION,
    },
    template: `<div style="display: flex; flex-wrap: wrap; gap: 1rem 1.5rem; align-items: flex-start;">
      <div style="width: 15rem; min-height: 22rem;">
        <p [style]="caption">Listed as disabled</p>
        <andes-date-picker picker="time" locale="en-GB" [timeDisabled]="workHours" [value]="time" [open]="true" aria-label="Working hours" />
      </div>
      <div style="width: 15rem; min-height: 22rem;">
        <p [style]="caption">hideDisabledOptions</p>
        <andes-date-picker picker="time" locale="en-GB" [showTime]="hidden" [timeDisabled]="workHours" [value]="time" [open]="true" aria-label="Working hours, hidden options" />
      </div>
      <div style="width: 22rem; min-height: 22rem;">
        <p [style]="caption">Range: the end follows the start</p>
        <andes-date-picker picker="time" mode="range" locale="en-GB" [timeDisabled]="afterStart" [value]="range" [(activePickerIndex)]="side" [open]="true" aria-label="Meeting" />
      </div>
    </div>`,
  }),
};

/** The four variants for a time, a time with seconds, a 12-hour time and a range. */
export const Variants: Story = {
  render: () => ({
    moduleMetadata: { imports: [FormsModule] },
    props: {
      variants: ['outlined', 'filled', 'borderless', 'underlined'],
      seconds: { showSecond: true },
      twelve: { use12Hours: true },
      time: NINE_THIRTY,
      range: RANGE,
      caption: CAPTION,
    },
    template: `<div style="display: flex; flex-direction: column; gap: 1.25rem;">
      @for (variant of variants; track variant) {
        <div>
          <p [style]="caption">variant="{{ variant }}"</p>
          <div style="display: flex; flex-wrap: wrap; gap: 0.75rem; align-items: flex-start;">
            <andes-date-picker style="width: 9rem;" picker="time" locale="en-GB" [variant]="variant" [ngModel]="time" [aria-label]="variant + ' time'" />
            <andes-date-picker style="width: 10rem;" picker="time" locale="en-GB" [variant]="variant" [showTime]="seconds" [ngModel]="time" [aria-label]="variant + ' time with seconds'" />
            <andes-date-picker style="width: 10rem;" picker="time" locale="en-US" [variant]="variant" [showTime]="twelve" [ngModel]="time" [aria-label]="variant + ' 12-hour time'" />
            <andes-date-picker style="width: 16rem;" picker="time" mode="range" locale="en-GB" [variant]="variant" [ngModel]="range" [aria-label]="variant + ' time range'" />
          </div>
        </div>
      }
    </div>`,
  }),
};

/**
 * Status: `error` and `warning` colour the field and its ring for a time, a time with
 * seconds, a 12-hour time and a range; `error` also sets `aria-invalid`.
 */
export const Status: Story = {
  render: () => ({
    moduleMetadata: { imports: [FormsModule] },
    props: {
      statuses: ['error', 'warning'],
      seconds: { showSecond: true },
      twelve: { use12Hours: true },
      time: NINE_THIRTY,
      range: RANGE,
      caption: CAPTION,
    },
    template: `<div style="display: flex; flex-direction: column; gap: 1.25rem;">
      @for (status of statuses; track status) {
        <div>
          <p [style]="caption">status="{{ status }}"</p>
          <div style="display: flex; flex-wrap: wrap; gap: 0.75rem; align-items: flex-start;">
            <andes-date-picker style="width: 9rem;" picker="time" locale="en-GB" [status]="status" [ngModel]="time" [aria-label]="status + ' time'" />
            <andes-date-picker style="width: 10rem;" picker="time" locale="en-GB" [status]="status" [showTime]="seconds" [ngModel]="time" [aria-label]="status + ' time with seconds'" />
            <andes-date-picker style="width: 10rem;" picker="time" locale="en-US" [status]="status" [showTime]="twelve" [ngModel]="time" [aria-label]="status + ' 12-hour time'" />
            <andes-date-picker style="width: 16rem;" picker="time" mode="range" locale="en-GB" [status]="status" [ngModel]="range" [aria-label]="status + ' time range'" />
          </div>
        </div>
      }
    </div>`,
  }),
};

/**
 * `prefix` and `suffixIcon` on time pickers: a label or an icon before the input, and an
 * icon in place of the clock, in a single field, a range and a 12-hour field. The suffix still
 * turns into the clear button on hover when there is a value.
 */
export const PrefixAndSuffix: Story = {
  render: () => ({
    moduleMetadata: { imports: [FormsModule] },
    props: {
      twelve: { use12Hours: true },
      time: NINE_THIRTY,
      range: RANGE,
      caption: CAPTION,
    },
    template: `
      <ng-template #label><span style="font-size: 0.875rem;">Opens</span></ng-template>
      <ng-template #bell>
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.9 1.9 0 0 0 3.4 0" /></svg>
      </ng-template>
      <ng-template #hourglass>
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M5 22h14M5 2h14M17 22v-4.2a2 2 0 0 0-.6-1.4L12 12l-4.4 4.4a2 2 0 0 0-.6 1.4V22M7 2v4.2a2 2 0 0 0 .6 1.4L12 12l4.4-4.4a2 2 0 0 0 .6-1.4V2" /></svg>
      </ng-template>
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(18rem, 1fr)); gap: 1rem 1.5rem; align-items: start; align-content: start; min-height: 22rem;">
        <div>
          <p [style]="caption">Label prefix</p>
          <andes-date-picker style="width: 100%;" picker="time" locale="en-GB" [prefix]="label" [ngModel]="time" aria-label="Opens at" />
        </div>
        <div>
          <p [style]="caption">Icon prefix and suffix</p>
          <andes-date-picker style="width: 100%;" picker="time" locale="en-GB" [prefix]="bell" [suffixIcon]="hourglass" [ngModel]="time" aria-label="Alarm" />
        </div>
        <div>
          <p [style]="caption">12 hours, suffix</p>
          <andes-date-picker style="width: 100%;" picker="time" locale="en-US" [showTime]="twelve" [suffixIcon]="hourglass" [ngModel]="time" aria-label="12-hour time with suffix" />
        </div>
        <div>
          <p [style]="caption">Range</p>
          <andes-date-picker style="width: 100%;" picker="time" mode="range" locale="en-GB" [prefix]="bell" [suffixIcon]="hourglass" [ngModel]="range" aria-label="Range with prefix and suffix" />
        </div>
      </div>
    `,
  }),
};

/**
 * Custom cells: `timeCellTemplate` draws each option of the columns. The context holds the
 * number, the `unit` (`hour`, `minute`, `second`, `meridiem`), the cell's own text and its
 * `selected` and `disabled` state. Here working hours are bold with a dot, minutes that are
 * multiples of fifteen are bold, and the AM/PM column spells out the day period.
 */
export const CustomCells: Story = {
  render: () => ({
    props: {
      twelve: { use12Hours: true, minuteStep: 5 },
      time: NINE_THIRTY,
      caption: CAPTION,
    },
    template: `
      <ng-template #cell let-shown let-unit="unit" let-text="text">
        @if (unit === 'hour') {
          <span [style.font-weight]="shown >= 9 && shown <= 17 ? 700 : 400">
            {{ text }}
            @if (shown >= 9 && shown <= 17) {
              <span style="display: inline-block; width: 4px; height: 4px; margin-left: 2px; border-radius: 50%; background: var(--andes-color-success);"></span>
            }
          </span>
        } @else if (unit === 'minute') {
          <span [style.font-weight]="shown % 15 === 0 ? 700 : 400">{{ text }}</span>
        } @else {
          <span>{{ text }}</span>
        }
      </ng-template>
      <ng-template #twelveCell let-shown let-unit="unit" let-text="text">
        @if (unit === 'meridiem') {
          <span style="font-size: 0.75rem;">{{ shown === 0 ? 'Morning' : 'Afternoon' }}</span>
        } @else {
          <span>{{ text }}</span>
        }
      </ng-template>
      <div style="display: flex; flex-wrap: wrap; gap: 1rem 1.5rem; align-items: flex-start;">
        <div style="width: 15rem; min-height: 22rem;">
          <p [style]="caption">Working hours</p>
          <andes-date-picker picker="time" locale="en-GB" [timeCellTemplate]="cell" [value]="time" [open]="true" aria-label="Time with working hours" />
        </div>
        <div style="width: 17rem; min-height: 22rem;">
          <p [style]="caption">12 hours, spelled-out day period</p>
          <andes-date-picker picker="time" locale="en-US" [showTime]="twelve" [timeCellTemplate]="twelveCell" [value]="time" [open]="true" aria-label="12-hour time with day period" />
        </div>
      </div>
    `,
  }),
};

/**
 * `placement` for time pickers: a single field and a range each open from the four corners.
 * Open any field: the panel grows out of the edge facing the field, and flips to the other side
 * when there is no room.
 */
export const Placement: Story = {
  render: () => ({
    props: {
      placements: ['topLeft', 'topRight', 'bottomLeft', 'bottomRight'],
      caption: CAPTION,
    },
    template: `<div style="min-height: 42rem; display: flex; flex-direction: column; gap: 2rem; align-items: center; justify-content: center;">
      <div>
        <p [style]="caption">Single</p>
        <div style="display: grid; grid-template-columns: repeat(2, 14rem); gap: 1rem;">
          @for (placement of placements; track placement) {
            <andes-date-picker picker="time" locale="en-GB" [placement]="placement" [placeholder]="placement" [aria-label]="placement" />
          }
        </div>
      </div>
      <div>
        <p [style]="caption">Range</p>
        <div style="display: grid; grid-template-columns: repeat(2, 18rem); gap: 1rem;">
          @for (placement of placements; track placement) {
            <andes-date-picker picker="time" mode="range" locale="en-GB" [placement]="placement" [aria-label]="placement + ' range'" />
          }
        </div>
      </div>
    </div>`,
  }),
};

/**
 * Locales. The field and the columns share one clock: 24 hours by default, whatever the
 * locale's habit, and the locale's own 12-hour form with `use12Hours` (AM/PM in English,
 * the day-period names of Japanese, Chinese, Korean, Spanish and Arabic). The panels are
 * closed; open any field to see the AM/PM column in that language.
 */
export const Locales: Story = {
  render: () => ({
    moduleMetadata: { imports: [FormsModule] },
    props: {
      locales: [
        'en-US',
        'es-ES',
        'fr-FR',
        'de-DE',
        'ja-JP',
        'zh-CN',
        'ko-KR',
        'ar',
      ],
      twelve: { use12Hours: true },
      time: AFTERNOON,
      caption: CAPTION,
    },
    template: `<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(14rem, 1fr)); gap: 1rem 1.5rem; align-items: start; align-content: start; min-height: 24rem;">
      @for (locale of locales; track locale) {
        <div [attr.dir]="locale === 'ar' ? 'rtl' : null">
          <p [style]="caption">{{ locale }}, 24 hours</p>
          <andes-date-picker style="width: 100%;" picker="time" [locale]="locale" [ngModel]="time" [aria-label]="locale + ' 24 hours'" />
        </div>
        <div [attr.dir]="locale === 'ar' ? 'rtl' : null">
          <p [style]="caption">{{ locale }}, use12Hours</p>
          <andes-date-picker style="width: 100%;" picker="time" [locale]="locale" [showTime]="twelve" [ngModel]="time" [aria-label]="locale + ' 12 hours'" />
        </div>
      }
    </div>`,
  }),
};

/**
 * The field's own options on a time picker: `allowClear` off (first), a custom `clearIcon`
 * (second), `inputReadOnly` so the keyboard stays closed and picking is left to the panel
 * (third), `defaultOpen`, which opens the panel once on load (fourth), and `autoFocus`
 * (fifth).
 */
export const ClearableAndReadOnly: Story = {
  render: () => ({
    moduleMetadata: { imports: [FormsModule] },
    props: { time: NINE_THIRTY, caption: CAPTION },
    template: `
      <ng-template #clear>
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" /></svg>
      </ng-template>
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(14rem, 1fr)); gap: 1rem 1.5rem; align-items: start; align-content: start; min-height: 26rem;">
        <div>
          <p [style]="caption">allowClear off</p>
          <andes-date-picker style="width: 100%;" picker="time" locale="en-GB" [allowClear]="false" [ngModel]="time" aria-label="Without clear" />
        </div>
        <div>
          <p [style]="caption">Custom clearIcon</p>
          <andes-date-picker style="width: 100%;" picker="time" locale="en-GB" [clearIcon]="clear" [ngModel]="time" aria-label="Custom clear icon" />
        </div>
        <div>
          <p [style]="caption">inputReadOnly</p>
          <andes-date-picker style="width: 100%;" picker="time" locale="en-GB" inputReadOnly [ngModel]="time" aria-label="Read-only input" />
        </div>
        <div>
          <p [style]="caption">autoFocus</p>
          <andes-date-picker style="width: 100%;" picker="time" locale="en-GB" autoFocus aria-label="Focused on load" />
        </div>
        <div>
          <p [style]="caption">defaultOpen</p>
          <andes-date-picker style="width: 100%;" picker="time" locale="en-GB" defaultOpen aria-label="Open on load" />
        </div>
      </div>
    `,
  }),
};

function withinOpeningHours(control: AbstractControl): ValidationErrors | null {
  const time = control.value as Date | null;
  if (!time) {
    return null;
  }
  const minutes = time.getHours() * 60 + time.getMinutes();
  return minutes < 9 * 60 || minutes > 18 * 60 ? { hours: true } : null;
}

function endsAfterStart(control: AbstractControl): ValidationErrors | null {
  const range = control.value as readonly [Date | null, Date | null] | null;
  return range && range[0] && range[1] && range[1] <= range[0]
    ? { order: true }
    : null;
}

/**
 * A reactive form: a required pickup time that must fall within opening hours (09:00 to
 * 18:00), and a required slot whose end follows its start. Each field shows its message and the
 * `error` status once touched and invalid; the state reads touched, dirty and valid from the
 * controls. Reset clears the form, Fill sets a valid value and Mark touched shows every
 * message.
 */
export const Form: Story = {
  render: () => {
    const form = new FormGroup({
      pickup: new FormControl<Date | null>(null, [
        Validators.required,
        withinOpeningHours,
      ]),
      slot: new FormControl<readonly [Date, Date] | null>(null, [
        Validators.required,
        endsAfterStart,
      ]),
    });
    return {
      moduleMetadata: { imports: [ReactiveFormsModule, JsonPipe, AndesButton] },
      props: {
        form,
        fill: () =>
          form.setValue({
            pickup: new Date(2024, 1, 15, 10, 0, 0),
            slot: [
              new Date(2024, 1, 15, 9, 0, 0),
              new Date(2024, 1, 15, 11, 0, 0),
            ],
          }),
        message:
          'margin: 0.25rem 0 0; font: 0.75rem/1.25rem var(--andes-font-family), sans-serif; color: var(--andes-color-danger, #dc2626);',
        mono: MONO,
        caption: CAPTION,
      },
      template: `<div [formGroup]="form" style="display: flex; flex-direction: column; gap: 1rem; width: 22rem; min-height: 28rem;">
        <div>
          <p [style]="caption">Pickup time (required, 09:00 to 18:00)</p>
          <andes-date-picker style="width: 100%;" picker="time" locale="en-GB" formControlName="pickup" [status]="form.controls.pickup.touched && form.controls.pickup.invalid ? 'error' : null" aria-label="Pickup time" />
          @if (form.controls.pickup.touched && form.controls.pickup.errors; as errors) {
            <p [style]="message" role="alert">{{ errors['required'] ? 'Choose a pickup time.' : 'We are open from 09:00 to 18:00.' }}</p>
          }
        </div>
        <div>
          <p [style]="caption">Slot (required, the end follows the start)</p>
          <andes-date-picker style="width: 100%;" picker="time" mode="range" locale="en-GB" formControlName="slot" [status]="form.controls.slot.touched && form.controls.slot.invalid ? 'error' : null" aria-label="Slot" />
          @if (form.controls.slot.touched && form.controls.slot.errors; as errors) {
            <p [style]="message" role="alert">{{ errors['required'] ? 'Choose a start and an end.' : 'The slot must end after it starts.' }}</p>
          }
        </div>
        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
          <andes-button size="sm" variant="outline" (click)="form.reset()">Reset</andes-button>
          <andes-button size="sm" variant="outline" (click)="fill()">Fill</andes-button>
          <andes-button size="sm" variant="outline" (click)="form.markAllAsTouched()">Mark touched</andes-button>
        </div>
        <pre [style]="mono">valid: {{ form.valid }}  touched: {{ form.touched }}  dirty: {{ form.dirty }}
value: {{ form.value | json }}</pre>
      </div>`,
    };
  },
};

/**
 * `format` as a mask on time pickers: the input keeps the pattern's shape (`HH:mm`,
 * `HH:mm:ss`), digits fill the number under the caret and move on, Left and Right switch
 * numbers, Up and Down step one, and Backspace empties one. The columns follow the mask, and
 * a range masks both inputs.
 */
export const TimeMask: Story = {
  render: () => ({
    moduleMetadata: { imports: [FormsModule, JsonPipe] },
    props: {
      minutes: { format: 'HH:mm', type: 'mask' },
      seconds: { format: 'HH:mm:ss', type: 'mask' },
      time: NINE_THIRTY as Date | null,
      range: RANGE,
      mono: MONO,
      caption: CAPTION,
    },
    template: `<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(18rem, 1fr)); gap: 1rem 1.5rem; align-items: start; align-content: start; min-height: 22rem;">
      <div>
        <p [style]="caption">HH:mm</p>
        <andes-date-picker style="width: 100%;" picker="time" locale="en-GB" [format]="minutes" [(ngModel)]="time" aria-label="Masked time" />
        <pre [style]="mono">{{ time | json }}</pre>
      </div>
      <div>
        <p [style]="caption">HH:mm:ss</p>
        <andes-date-picker style="width: 100%;" picker="time" locale="en-GB" [format]="seconds" aria-label="Masked time with seconds" />
      </div>
      <div>
        <p [style]="caption">Range, HH:mm</p>
        <andes-date-picker style="width: 100%;" picker="time" mode="range" locale="en-GB" [format]="minutes" [ngModel]="range" aria-label="Masked time range" />
      </div>
    </div>`,
  }),
};

/**
 * The dark theme (the story sets the toolbar's theme to dark) for the time picker: fields in
 * four states and the panels open as a single time, a 12-hour time and a range.
 */
export const DarkTheme: Story = {
  globals: { theme: 'dark' },
  render: () => ({
    moduleMetadata: { imports: [FormsModule] },
    props: {
      twelve: { use12Hours: true },
      time: NINE_THIRTY,
      range: RANGE,
      caption: CAPTION,
    },
    template: `<div style="display: flex; flex-direction: column; gap: 1rem;">
      <div style="display: flex; flex-wrap: wrap; gap: 0.75rem; align-items: flex-start;">
        <andes-date-picker style="width: 9rem;" picker="time" locale="en-GB" [ngModel]="time" aria-label="Outlined" />
        <andes-date-picker style="width: 9rem;" picker="time" variant="filled" locale="en-GB" [ngModel]="time" aria-label="Filled" />
        <andes-date-picker style="width: 9rem;" picker="time" status="error" locale="en-GB" [ngModel]="time" aria-label="Error" />
        <andes-date-picker style="width: 9rem;" picker="time" disabled locale="en-GB" [ngModel]="time" aria-label="Disabled" />
      </div>
      <div style="display: flex; flex-wrap: wrap; gap: 1rem 1.5rem; align-items: flex-start;">
        <div style="width: 15rem; min-height: 22rem;">
          <p [style]="caption">Time</p>
          <andes-date-picker picker="time" locale="en-GB" [value]="time" [open]="true" aria-label="Time panel" />
        </div>
        <div style="width: 15rem; min-height: 22rem;">
          <p [style]="caption">12 hours</p>
          <andes-date-picker picker="time" locale="en-US" [showTime]="twelve" [value]="time" [open]="true" aria-label="12-hour time panel" />
        </div>
        <div style="width: 22rem; min-height: 22rem;">
          <p [style]="caption">Range</p>
          <andes-date-picker picker="time" mode="range" locale="en-GB" [value]="range" [open]="true" aria-label="Time range panel" />
        </div>
      </div>
    </div>`,
  }),
};
