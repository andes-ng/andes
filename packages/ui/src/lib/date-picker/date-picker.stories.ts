import { JsonPipe } from '@angular/common';
import {
  FormControl,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import type { Meta, StoryObj } from '@storybook/angular';

import { AndesDatePicker } from './date-picker';
import { FIELD_ROW } from '../../testing/story-layout';

const meta: Meta<AndesDatePicker> = {
  title: 'Data Entry/Date Picker/Basics/Field',
  component: AndesDatePicker,
  tags: ['autodocs'],
  parameters: {
    // The panel is absolutely positioned under the trigger, so give it somewhere
    // to open into rather than letting it flip against the viewport edge.
    layout: 'padded',
  },
  argTypes: {
    mode: { control: 'select', options: ['single', 'range', 'multiple'] },
    picker: {
      control: 'select',
      options: ['date', 'week', 'month', 'quarter', 'year'],
    },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    status: { control: 'select', options: [null, 'error', 'warning'] },
    variant: {
      control: 'select',
      options: ['outlined', 'filled', 'borderless', 'underlined'],
    },
    placement: {
      control: 'select',
      options: ['bottomLeft', 'bottomRight', 'topLeft', 'topRight'],
    },
    allowClear: { control: 'boolean' },
    locale: {
      control: 'select',
      options: ['en-US', 'es-PE', 'es-ES', 'fr-FR', 'ja-JP'],
    },
    weekStartsOn: { control: 'select', options: [0, 1, 6] },
    disabled: { control: 'boolean' },
    showOutsideDays: { control: 'boolean' },
    fixedWeeks: { control: 'boolean' },
  },
  args: {
    mode: 'single',
    picker: 'date',
    size: 'md',
    status: null,
    variant: 'outlined',
    placement: 'bottomLeft',
    allowClear: true,
    locale: 'en-US',
    weekStartsOn: 0,
    disabled: false,
    showOutsideDays: true,
    fixedWeeks: true,
  },
  render: (args) => ({
    props: args,
    template: `<div style="min-height: 26rem;">
      <andes-date-picker
        [mode]="mode"
        [picker]="picker"
        [size]="size"
        [status]="status"
        [variant]="variant"
        [placement]="placement"
        [allowClear]="allowClear"
        [locale]="locale"
        [weekStartsOn]="weekStartsOn"
        [disabled]="disabled"
        [showOutsideDays]="showOutsideDays"
        [fixedWeeks]="fixedWeeks" />
    </div>`,
  }),
};

export default meta;

type Story = StoryObj<AndesDatePicker>;

const FEB_15 = new Date(2024, 1, 15);
const MONO = 'font: 0.75rem/1.5 ui-monospace, monospace;';

export const Single: Story = {};

/**
 * `mode="range"`: two inputs in one field and two months side by side. The input the
 * next pick fills is marked by a bar that slides to the other input, and the panel's
 * arrow follows it. After the first pick, hovering previews the range the second pick
 * would close, as a dashed band that runs from day to day.
 */
export const Range: Story = {
  args: { mode: 'range' },
};

const MATRIX_PROPS = {
  types: ['date', 'week', 'month', 'quarter', 'year'],
  picked: FEB_15,
  rangeValue: [new Date(2024, 1, 5), new Date(2024, 1, 12)],
  several: [new Date(2024, 1, 2), new Date(2024, 1, 14), new Date(2024, 1, 20)],
  caption:
    'margin: 0 0 0.375rem; font: 0.75rem/1.25rem var(--andes-font-family), sans-serif; color: var(--andes-color-muted-foreground);',
};

/**
 * The three sizes (`sm` 24px, `md` 32px, `lg` 40px) across every type: date, week, month,
 * quarter and year, a range, a multiple picker and a time picker.
 */
export const Sizes: Story = {
  render: () => ({
    moduleMetadata: { imports: [FormsModule] },
    props: { ...MATRIX_PROPS, sizes: ['sm', 'md', 'lg'] },
    template: `<div style="display: flex; flex-direction: column; gap: 1.25rem;">
      @for (size of sizes; track size) {
        <div>
          <p [style]="caption">size="{{ size }}"</p>
          <div style="${FIELD_ROW}">
            @for (type of types; track type) {
              <andes-date-picker [size]="size" [picker]="type" locale="en-US" [weekStartsOn]="1" [ngModel]="picked" [aria-label]="size + ' ' + type" />
            }
            <andes-date-picker [size]="size" mode="range" locale="en-US" [ngModel]="rangeValue" [aria-label]="size + ' range'" />
            <andes-date-picker [size]="size" mode="multiple" locale="en-US" [maxTagCount]="1" [ngModel]="several" [aria-label]="size + ' multiple'" />
            <andes-date-picker [size]="size" picker="time" locale="en-GB" [aria-label]="size + ' time'" />
          </div>
        </div>
      }
    </div>`,
  }),
};

/**
 * The four variants (`outlined`, `filled`, `borderless`, `underlined`) across every type,
 * a range, a multiple picker and a time picker.
 */
export const Variants: Story = {
  render: () => ({
    moduleMetadata: { imports: [FormsModule] },
    props: {
      ...MATRIX_PROPS,
      variants: ['outlined', 'filled', 'borderless', 'underlined'],
    },
    template: `<div style="display: flex; flex-direction: column; gap: 1.25rem;">
      @for (variant of variants; track variant) {
        <div>
          <p [style]="caption">variant="{{ variant }}"</p>
          <div style="${FIELD_ROW}">
            @for (type of types; track type) {
              <andes-date-picker [variant]="variant" [picker]="type" locale="en-US" [weekStartsOn]="1" [ngModel]="picked" [aria-label]="variant + ' ' + type" />
            }
            <andes-date-picker [variant]="variant" mode="range" locale="en-US" [ngModel]="rangeValue" [aria-label]="variant + ' range'" />
            <andes-date-picker [variant]="variant" mode="multiple" locale="en-US" [maxTagCount]="1" [ngModel]="several" [aria-label]="variant + ' multiple'" />
            <andes-date-picker [variant]="variant" picker="time" locale="en-GB" [aria-label]="variant + ' time'" />
          </div>
        </div>
      }
    </div>`,
  }),
};

/**
 * `status` colours the field, with a matching ring while it is active, for every type, a
 * range, a multiple picker and a time picker; `error` also sets `aria-invalid`. The last row
 * is `disabled`.
 */
export const States: Story = {
  render: () => ({
    moduleMetadata: { imports: [FormsModule] },
    props: {
      ...MATRIX_PROPS,
      statuses: ['error', 'warning'],
    },
    template: `<div style="display: flex; flex-direction: column; gap: 1.25rem;">
      @for (status of statuses; track status) {
        <div>
          <p [style]="caption">status="{{ status }}"</p>
          <div style="${FIELD_ROW}">
            @for (type of types; track type) {
              <andes-date-picker [status]="status" [picker]="type" locale="en-US" [weekStartsOn]="1" [ngModel]="picked" [aria-label]="status + ' ' + type" />
            }
            <andes-date-picker [status]="status" mode="range" locale="en-US" [ngModel]="rangeValue" [aria-label]="status + ' range'" />
            <andes-date-picker [status]="status" mode="multiple" locale="en-US" [maxTagCount]="1" [ngModel]="several" [aria-label]="status + ' multiple'" />
            <andes-date-picker [status]="status" picker="time" locale="en-GB" [aria-label]="status + ' time'" />
          </div>
        </div>
      }
      <div>
        <p [style]="caption">disabled</p>
        <div style="${FIELD_ROW}">
          @for (type of types; track type) {
            <andes-date-picker disabled [picker]="type" locale="en-US" [weekStartsOn]="1" [ngModel]="picked" [aria-label]="'disabled ' + type" />
          }
          <andes-date-picker disabled mode="range" locale="en-US" [ngModel]="rangeValue" aria-label="disabled range" />
          <andes-date-picker disabled mode="multiple" locale="en-US" [maxTagCount]="1" [ngModel]="several" aria-label="disabled multiple" />
          <andes-date-picker disabled picker="time" locale="en-GB" aria-label="disabled time" />
        </div>
      </div>
    </div>`,
  }),
};

/**
 * The trigger takes its accessible name from `aria-labelledby` pointing at the
 * visible label. A `<label for>` would not work: the id would land on the host
 * element rather than on the inner input.
 */
export const WithLabel: Story = {
  render: (args) => ({
    props: args,
    template: `<div style="min-height: 26rem; display: flex; flex-direction: column; gap: 0.5rem;">
      <span id="start-date-label" style="font: 500 0.875rem var(--andes-font-family, system-ui);">
        Start date
      </span>
      <andes-date-picker aria-labelledby="start-date-label" [locale]="locale" />
    </div>`,
  }),
};

/**
 * Three ways to hold the value. A reactive form control holding a `Date` (touched and dirty
 * shown), a required range control that stays invalid until both boundaries are chosen,
 * and `[(value)]`, which binds without Angular forms: picks write back through
 * `valueChange`, and setting the field from outside updates the picker.
 */
export const Binding: Story = {
  render: () => ({
    moduleMetadata: { imports: [ReactiveFormsModule, JsonPipe] },
    props: {
      control: new FormControl<Date | null>(FEB_15),
      rangeControl: new FormControl<readonly [Date, Date] | null>(null, [
        Validators.required,
      ]),
      bound: FEB_15,
      reset: new Date(2024, 0, 1),
      mono: MONO,
    },
    template: `<div style="min-height: 40rem; display: flex; flex-direction: column; gap: 0.75rem; align-items: flex-start;">
      <andes-date-picker locale="en-US" [formControl]="control" aria-label="Reactive form" />
      <pre [style]="mono">value: {{ control.value | json }}
touched: {{ control.touched }}  dirty: {{ control.dirty }}</pre>
      <andes-date-picker mode="range" locale="en-US" [formControl]="rangeControl" aria-label="Required range" />
      <pre [style]="mono">valid: {{ rangeControl.valid }}
value: {{ rangeControl.value | json }}</pre>
      <andes-date-picker locale="en-US" [(value)]="bound" aria-label="Bound date" />
      <button type="button" (click)="bound = reset">Set Jan 1, 2024</button>
      <pre [style]="mono">value: {{ bound | json }}</pre>
    </div>`,
  }),
};
