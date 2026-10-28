import { JsonPipe } from '@angular/common';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import type { Meta, StoryObj } from '@storybook/angular';

import { AndesDatePicker } from './date-picker';

const meta: Meta<AndesDatePicker> = {
  title: 'Data Entry/Date Picker/Basics/Features',
  component: AndesDatePicker,
  parameters: { layout: 'padded' },
};

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
