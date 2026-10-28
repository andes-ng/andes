import { JsonPipe } from '@angular/common';
import {
  FormControl,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import type { Meta, StoryObj } from '@storybook/angular';

import { AndesDatePicker } from './date-picker';

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
    mode: { control: 'select', options: ['single', 'range'] },
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
    fixedWeeks: false,
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
 * `mode="range"`: two inputs in one field and two months side by side. After the
 * first pick, hovering previews the range the second pick would close.
 */
export const Range: Story = {
  args: { mode: 'range' },
};

export const Sizes: Story = {
  render: () => ({
    moduleMetadata: { imports: [FormsModule] },
    props: { picked: FEB_15 },
    template: `<div style="display: flex; flex-direction: column; gap: 0.75rem; width: 16rem;">
      <andes-date-picker size="sm" locale="en-US" [ngModel]="picked" aria-label="Small" />
      <andes-date-picker size="md" locale="en-US" [ngModel]="picked" aria-label="Medium" />
      <andes-date-picker size="lg" locale="en-US" [ngModel]="picked" aria-label="Large" />
    </div>`,
  }),
};

export const Variants: Story = {
  render: () => ({
    moduleMetadata: { imports: [FormsModule] },
    props: { picked: FEB_15 },
    template: `<div style="display: flex; flex-direction: column; gap: 0.75rem; width: 16rem;">
      <andes-date-picker variant="outlined" locale="en-US" [ngModel]="picked" aria-label="Outlined" />
      <andes-date-picker variant="filled" locale="en-US" [ngModel]="picked" aria-label="Filled" />
      <andes-date-picker variant="borderless" locale="en-US" [ngModel]="picked" aria-label="Borderless" />
      <andes-date-picker variant="underlined" locale="en-US" [ngModel]="picked" aria-label="Underlined" />
    </div>`,
  }),
};

/**
 * `disabled` (single and range) and `status`, which colors the field; `error` also sets
 * `aria-invalid`.
 */
export const States: Story = {
  render: () => ({
    moduleMetadata: { imports: [FormsModule] },
    props: { picked: FEB_15 },
    template: `<div style="display: flex; flex-direction: column; gap: 0.75rem; width: 16rem;">
      <andes-date-picker disabled locale="en-US" [ngModel]="picked" aria-label="Disabled" />
      <andes-date-picker disabled mode="range" locale="en-US" aria-label="Range, disabled" />
      <andes-date-picker status="error" locale="en-US" aria-label="Error" />
      <andes-date-picker status="warning" locale="en-US" aria-label="Warning" />
      <andes-date-picker status="error" mode="range" locale="en-US" aria-label="Range error" />
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
