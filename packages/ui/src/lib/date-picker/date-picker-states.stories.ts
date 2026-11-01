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
import { AndesSwitch } from '../switch/switch';
import { AndesDatePicker } from './date-picker';

/**
 * Disabled and validated fields, forms, labels and help text, theming (dark, custom styling
 * from page CSS) and placement for the kinds of pickers that are not a plain date.
 */
// No `component` on the meta: Storybook assigns every story prop that is not an input to the
// first picker in the template, which would overwrite its own members (`range`, `time`,
// `placeholders`...). The picker is imported through a decorator instead.
const meta: Meta<AndesDatePicker> = {
  title: 'Data Entry/Date Picker/States and theming',
  decorators: [moduleMetadata({ imports: [AndesDatePicker] })],
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<AndesDatePicker>;

const FEB_15 = new Date(2024, 1, 15);
const MONO = 'margin: 0; font: 0.75rem/1.5 ui-monospace, monospace;';
const CAPTION =
  'margin: 0 0 0.375rem; font: 0.75rem/1.25rem var(--andes-font-family), sans-serif; color: var(--andes-color-muted-foreground);';
const TYPES = ['date', 'week', 'month', 'quarter', 'year'] as const;
const RANGE = [new Date(2024, 1, 5), new Date(2024, 1, 12)];

/**
 * `disabled` for everything: every type, a multiple picker and a time picker, with their
 * values (first group). A range locks as a whole, or per side with a `[start, end]` pair:
 * `[true, false]` keeps the start fixed and lets the end move, `[false, true]` the other
 * way round (second group, for dates, months and years). Next to a form control, `disabledSides`
 * does the same without clashing with the form's own `disabled`, and the control disables
 * the whole field (third group).
 */
export const Disabled: Story = {
  render: () => ({
    moduleMetadata: { imports: [FormsModule, ReactiveFormsModule] },
    props: {
      types: TYPES,
      picked: FEB_15,
      range: RANGE,
      several: [new Date(2024, 1, 2), new Date(2024, 1, 14)],
      months: [new Date(2024, 0, 1), new Date(2024, 3, 1)],
      years: [new Date(2022, 0, 1), new Date(2025, 0, 1)],
      startLocked: [true, false] as const,
      endLocked: [false, true] as const,
      control: new FormControl<readonly Date[] | null>(RANGE),
      disabledControl: new FormControl<readonly Date[] | null>({
        value: RANGE,
        disabled: true,
      }),
      caption: CAPTION,
    },
    template: `<div style="display: flex; flex-direction: column; gap: 1.25rem; min-height: 26rem;">
      <div>
        <p [style]="caption">Disabled, every type</p>
        <div style="display: flex; flex-wrap: wrap; gap: 0.75rem; align-items: flex-start;">
          @for (type of types; track type) {
            <andes-date-picker style="width: 12.5rem;" disabled [picker]="type" locale="en-US" [weekStartsOn]="1" [ngModel]="picked" [aria-label]="'disabled ' + type" />
          }
          <andes-date-picker style="width: 20rem;" disabled mode="range" locale="en-US" [ngModel]="range" aria-label="Disabled range" />
          <andes-date-picker style="width: 18rem;" disabled mode="multiple" locale="en-US" [ngModel]="several" aria-label="Disabled multiple" />
          <andes-date-picker style="width: 12.5rem;" disabled picker="time" locale="en-GB" aria-label="Disabled time" />
        </div>
      </div>
      <div>
        <p [style]="caption">Range with one side locked (the locked input cannot be focused or typed in)</p>
        <div style="display: flex; flex-wrap: wrap; gap: 0.75rem; align-items: flex-start;">
          <andes-date-picker style="width: 20rem;" mode="range" locale="en-US" [disabled]="startLocked" [ngModel]="range" aria-label="Start locked" />
          <andes-date-picker style="width: 20rem;" mode="range" locale="en-US" [disabled]="endLocked" [ngModel]="range" aria-label="End locked" />
          <andes-date-picker style="width: 20rem;" mode="range" picker="month" locale="en-US" [disabled]="startLocked" [ngModel]="months" aria-label="Month range, start locked" />
          <andes-date-picker style="width: 20rem;" mode="range" picker="year" locale="en-US" [disabled]="endLocked" [ngModel]="years" aria-label="Year range, end locked" />
          <andes-date-picker style="width: 22rem;" mode="range" locale="en-GB" showTime [disabled]="startLocked" aria-label="Range with time, start locked" />
          <andes-date-picker style="width: 16rem;" mode="range" picker="time" locale="en-GB" [disabled]="endLocked" aria-label="Time range, end locked" />
        </div>
      </div>
      <div>
        <p [style]="caption">With a form control: disabledSides on an enabled control, and a disabled control</p>
        <div style="display: flex; flex-wrap: wrap; gap: 0.75rem; align-items: flex-start;">
          <andes-date-picker style="width: 20rem;" mode="range" locale="en-US" [disabledSides]="startLocked" [formControl]="control" aria-label="Start locked through disabledSides" />
          <andes-date-picker style="width: 20rem;" mode="range" locale="en-US" [formControl]="disabledControl" aria-label="Disabled by the form control" />
        </div>
      </div>
    </div>`,
  }),
};

function weekday(control: AbstractControl): ValidationErrors | null {
  const date = control.value as Date | null;
  return date && (date.getDay() === 0 || date.getDay() === 6)
    ? { weekend: true }
    : null;
}

function atMostNights(max: number) {
  return (control: AbstractControl): ValidationErrors | null => {
    const range = control.value as readonly [Date | null, Date | null] | null;
    if (!range || !range[0] || !range[1]) {
      return null;
    }
    const nights = Math.round(
      (range[1].getTime() - range[0].getTime()) / 86_400_000,
    );
    return nights > max ? { nights: { max, actual: nights } } : null;
  };
}

function atLeastDates(min: number) {
  return (control: AbstractControl): ValidationErrors | null => {
    const dates = (control.value as readonly Date[] | null) ?? [];
    return dates.length < min ? { dates: { min, actual: dates.length } } : null;
  };
}

/**
 * Reactive forms. A required delivery date that cannot fall on a weekend, a required stay of
 * at most 14 nights, and a list of at least two dates. Each field shows its message and the
 * `error` status once it is touched and invalid; the state below the fields reads touched,
 * dirty and valid straight from the controls. Reset clears the form, Fill sets a valid
 * value, Mark touched shows every message at once, and the switch disables the whole form.
 */
export const FormIntegration: Story = {
  render: () => {
    const form = new FormGroup({
      delivery: new FormControl<Date | null>(null, [
        Validators.required,
        weekday,
      ]),
      stay: new FormControl<readonly [Date, Date] | null>(null, [
        Validators.required,
        atMostNights(14),
      ]),
      days: new FormControl<readonly Date[]>([], [atLeastDates(2)]),
    });
    return {
      moduleMetadata: {
        imports: [ReactiveFormsModule, JsonPipe, AndesButton, AndesSwitch],
      },
      props: {
        form,
        fill: () =>
          form.setValue({
            delivery: new Date(2024, 1, 15),
            stay: [new Date(2024, 1, 5), new Date(2024, 1, 12)],
            days: [new Date(2024, 1, 2), new Date(2024, 1, 14)],
          }),
        mono: MONO,
        caption: CAPTION,
        message:
          'margin: 0.25rem 0 0; font: 0.75rem/1.25rem var(--andes-font-family), sans-serif; color: var(--andes-color-danger, #dc2626);',
      },
      template: `<div [formGroup]="form" style="display: flex; flex-direction: column; gap: 1rem; width: 24rem; min-height: 40rem;">
      <div>
        <p [style]="caption">Delivery date (required, no weekends)</p>
        <andes-date-picker style="width: 100%;" locale="en-US" formControlName="delivery" [status]="form.controls.delivery.touched && form.controls.delivery.invalid ? 'error' : null" aria-label="Delivery date" />
        @if (form.controls.delivery.touched && form.controls.delivery.errors; as errors) {
          <p [style]="message" role="alert">
            {{ errors['required'] ? 'Choose a delivery date.' : 'We do not deliver on weekends.' }}
          </p>
        }
      </div>
      <div>
        <p [style]="caption">Stay (required, at most 14 nights)</p>
        <andes-date-picker style="width: 100%;" mode="range" locale="en-US" formControlName="stay" [status]="form.controls.stay.touched && form.controls.stay.invalid ? 'error' : null" aria-label="Stay" />
        @if (form.controls.stay.touched && form.controls.stay.errors; as errors) {
          <p [style]="message" role="alert">
            {{ errors['required'] ? 'Choose check-in and check-out.' : 'A stay is at most 14 nights.' }}
          </p>
        }
      </div>
      <div>
        <p [style]="caption">Pickup days (at least two)</p>
        <andes-date-picker style="width: 100%;" mode="multiple" locale="en-US" formControlName="days" [status]="form.controls.days.touched && form.controls.days.invalid ? 'error' : null" aria-label="Pickup days" />
        @if (form.controls.days.touched && form.controls.days.errors) {
          <p [style]="message" role="alert">Choose at least two days.</p>
        }
      </div>
      <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; align-items: center;">
        <andes-button size="sm" variant="outline" (click)="form.reset()">Reset</andes-button>
        <andes-button size="sm" variant="outline" (click)="fill()">Fill</andes-button>
        <andes-button size="sm" variant="outline" (click)="form.markAllAsTouched()">Mark touched</andes-button>
        <andes-switch size="sm" [checked]="form.disabled" (checkedChange)="$event ? form.disable() : form.enable()">Disabled</andes-switch>
      </div>
      <pre [style]="mono">valid: {{ form.valid }}  touched: {{ form.touched }}  dirty: {{ form.dirty }}
value: {{ form.value | json }}</pre>
    </div>`,
    };
  },
};

/**
 * Labels and help text. `aria-labelledby` names the picker from a visible label (a
 * `<label for>` cannot, as the id would land on the host), `aria-describedby` points at the
 * help or error text, `required` sets `aria-required`, and `aria-invalid` with the `error`
 * status marks a bad value. A range names each input with `startInputLabel` and
 * `endInputLabel`.
 */
export const FieldLabelsAndHelp: Story = {
  render: () => ({
    moduleMetadata: { imports: [FormsModule] },
    props: {
      picked: FEB_15,
      range: RANGE,
      label:
        'display: block; margin-bottom: 0.25rem; font: 500 0.875rem var(--andes-font-family), system-ui, sans-serif;',
      help: 'margin: 0.25rem 0 0; font: 0.75rem/1.25rem var(--andes-font-family), sans-serif; color: var(--andes-color-muted-foreground);',
      error:
        'margin: 0.25rem 0 0; font: 0.75rem/1.25rem var(--andes-font-family), sans-serif; color: var(--andes-color-danger, #dc2626);',
    },
    template: `<div style="display: flex; flex-wrap: wrap; gap: 1.5rem; align-items: flex-start; min-height: 26rem;">
      <div style="width: 18rem;">
        <span id="labels-birth" [style]="label">Date of birth</span>
        <andes-date-picker style="width: 100%;" locale="en-US" required aria-labelledby="labels-birth" aria-describedby="labels-birth-help" [ngModel]="picked" />
        <p id="labels-birth-help" [style]="help">As on your passport.</p>
      </div>
      <div style="width: 18rem;">
        <span id="labels-due" [style]="label">Due date</span>
        <andes-date-picker style="width: 100%;" locale="en-US" status="error" aria-invalid="true" aria-labelledby="labels-due" aria-describedby="labels-due-error" />
        <p id="labels-due-error" [style]="error" role="alert">Choose a due date.</p>
      </div>
      <div style="width: 24rem;">
        <span id="labels-stay" [style]="label">Stay</span>
        <andes-date-picker style="width: 100%;" mode="range" locale="en-US" required startInputLabel="Check-in" endInputLabel="Check-out" aria-labelledby="labels-stay" aria-describedby="labels-stay-help" [ngModel]="range" />
        <p id="labels-stay-help" [style]="help">Check-in is from 15:00.</p>
      </div>
    </div>`,
  }),
};

/**
 * The dark theme (the story sets the toolbar's theme to dark): outlined, filled, error
 * and disabled fields, and open day, range and date-and-time panels, all drawn from the
 * theme's custom properties. Switch the toolbar back to light to compare.
 */
export const DarkTheme: Story = {
  globals: { theme: 'dark' },
  render: () => ({
    moduleMetadata: { imports: [FormsModule] },
    props: {
      picked: FEB_15,
      range: RANGE,
      meeting: new Date(2024, 1, 15, 9, 30),
      caption: CAPTION,
    },
    template: `<div style="display: flex; flex-direction: column; gap: 1rem;">
      <div style="display: flex; flex-wrap: wrap; gap: 0.75rem; align-items: flex-start;">
        <andes-date-picker style="width: 12.5rem;" locale="en-US" [ngModel]="picked" aria-label="Outlined" />
        <andes-date-picker style="width: 12.5rem;" variant="filled" locale="en-US" [ngModel]="picked" aria-label="Filled" />
        <andes-date-picker style="width: 12.5rem;" status="error" locale="en-US" [ngModel]="picked" aria-label="Error" />
        <andes-date-picker style="width: 12.5rem;" status="warning" locale="en-US" [ngModel]="picked" aria-label="Warning" />
        <andes-date-picker style="width: 12.5rem;" disabled locale="en-US" [ngModel]="picked" aria-label="Disabled" />
        <andes-date-picker style="width: 20rem;" mode="range" locale="en-US" [ngModel]="range" aria-label="Range" />
      </div>
      <div style="display: flex; flex-wrap: wrap; gap: 1rem 1.5rem; align-items: flex-start;">
        <div style="width: 19rem; min-height: 26rem;">
          <p [style]="caption">Day panel</p>
          <andes-date-picker locale="en-US" [ngModel]="picked" [open]="true" aria-label="Day panel" />
        </div>
        <div style="width: 38rem; min-height: 26rem;">
          <p [style]="caption">Range panel</p>
          <andes-date-picker mode="range" locale="en-US" [ngModel]="range" [open]="true" aria-label="Range panel" />
        </div>
        <div style="width: 31rem; min-height: 26rem;">
          <p [style]="caption">Date and time</p>
          <andes-date-picker locale="en-GB" showTime [value]="meeting" [open]="true" aria-label="Date and time panel" />
        </div>
      </div>
    </div>`,
  }),
};

/**
 * Styling a range, a multiple picker and a time picker from page CSS. The range's trigger,
 * separator and active bar, the tags of a multiple picker, and the time columns each carry
 * a `data-slot`; `panelClass` reaches the panel, which renders outside the picker. The
 * colours come from the theme's custom properties, set on the parts, so the dark theme
 * still applies.
 */
export const SemanticStylingRange: Story = {
  render: () => ({
    moduleMetadata: { imports: [FormsModule] },
    props: {
      range: RANGE,
      several: [new Date(2024, 1, 2), new Date(2024, 1, 14)],
      panel: ['story-semantic-panel'],
      caption: CAPTION,
    },
    styles: [
      `.story-semantic ::ng-deep [data-slot='date-picker-trigger'] {
        border-radius: var(--andes-radius-full, 999px);
        --andes-color-primary: var(--andes-color-success);
      }`,
      `.story-semantic ::ng-deep [data-slot='date-picker-separator'] {
        color: var(--andes-color-success);
      }`,
      `.story-semantic ::ng-deep [data-slot='date-picker-tag'] {
        border-radius: 0;
        background-color: var(--andes-color-success);
        color: var(--andes-color-primary-foreground);
      }`,
      `::ng-deep .story-semantic-panel {
        --andes-color-primary: var(--andes-color-success);
        --andes-color-primary-text: var(--andes-color-success);
      }`,
      `::ng-deep .story-semantic-panel [data-slot='calendar-header'] {
        background-color: var(--andes-color-muted);
      }`,
      `::ng-deep .story-semantic-panel [data-slot='date-picker-time'] {
        background-color: var(--andes-color-muted);
      }`,
    ],
    template: `<div class="story-semantic" style="display: flex; flex-direction: column; gap: 1rem; width: 24rem; min-height: 30rem;">
      <div>
        <p [style]="caption">Range</p>
        <andes-date-picker style="width: 100%;" mode="range" locale="en-US" [panelClass]="panel" [ngModel]="range" aria-label="Styled range" />
      </div>
      <div>
        <p [style]="caption">Multiple</p>
        <andes-date-picker style="width: 100%;" mode="multiple" locale="en-US" [panelClass]="panel" [ngModel]="several" aria-label="Styled multiple" />
      </div>
      <div>
        <p [style]="caption">Date and time</p>
        <andes-date-picker style="width: 100%;" locale="en-GB" showTime [panelClass]="panel" aria-label="Styled date and time" />
      </div>
      <div>
        <p [style]="caption">Time</p>
        <andes-date-picker style="width: 100%;" picker="time" locale="en-GB" [panelClass]="panel" aria-label="Styled time" />
      </div>
    </div>`,
  }),
};

/**
 * `placement` for pickers other than a plain date: a range, a date with time and a time
 * picker, each opening from the four corners. Open any field: the panel grows out of the
 * edge facing the field, and flips to the other side when there is no room.
 */
export const PlacementTypes: Story = {
  render: () => ({
    props: {
      placements: ['topLeft', 'topRight', 'bottomLeft', 'bottomRight'],
      caption: CAPTION,
    },
    template: `<div style="min-height: 52rem; display: flex; flex-direction: column; gap: 2rem; align-items: center; justify-content: center;">
      @for (kind of ['range', 'date and time', 'time']; track kind) {
        <div>
          <p [style]="caption">{{ kind }}</p>
          <div style="display: grid; grid-template-columns: repeat(2, 22rem); gap: 1rem;">
            @for (placement of placements; track placement) {
              @switch (kind) {
                @case ('range') {
                  <andes-date-picker mode="range" locale="en-US" [placement]="placement" [aria-label]="kind + ' ' + placement" />
                }
                @case ('date and time') {
                  <andes-date-picker locale="en-GB" showTime [placement]="placement" [placeholder]="placement" [aria-label]="kind + ' ' + placement" />
                }
                @default {
                  <andes-date-picker picker="time" locale="en-GB" [placement]="placement" [placeholder]="placement" [aria-label]="kind + ' ' + placement" />
                }
              }
            }
          </div>
        </div>
      }
    </div>`,
  }),
};
