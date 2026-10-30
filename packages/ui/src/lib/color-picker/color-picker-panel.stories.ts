import { JsonPipe } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import type { Meta, StoryObj } from '@storybook/angular';

import { AndesColorPickerPanel } from './color-picker-panel';
import type { AndesColorPreset } from './color-picker-types';

const IMPORTS = [AndesColorPickerPanel, JsonPipe, ReactiveFormsModule];

const SWATCHES: readonly AndesColorPreset[] = [
  {
    label: 'Brand',
    colors: ['#1677ff', '#13c2c2', '#52c41a', '#fadb14', '#fa541c', '#eb2f96'],
  },
];

const meta: Meta<AndesColorPickerPanel> = {
  title: 'Data Entry/Color Picker/Panel',
  component: AndesColorPickerPanel,
  parameters: { layout: 'padded' },
  argTypes: {
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    mode: { control: 'select', options: ['single', 'gradient'] },
    disabled: { control: 'boolean' },
    readOnly: { control: 'boolean' },
    allowClear: { control: 'boolean' },
    showCopy: { control: 'boolean' },
  },
  args: {
    size: 'md',
    mode: 'single',
    disabled: false,
    readOnly: false,
    allowClear: true,
    showCopy: true,
  },
  render: (args) => ({
    moduleMetadata: { imports: IMPORTS },
    props: { ...args, swatches: SWATCHES, inline: '#1677ff' },
    template: `
      <div style="display: flex; flex-direction: column; gap: 0.75rem; align-items: flex-start;">
        <andes-color-picker-panel
          aria-label="Brand color"
          [(value)]="inline"
          [size]="size"
          [mode]="mode"
          [disabled]="disabled"
          [readOnly]="readOnly"
          [allowClear]="allowClear"
          [showCopy]="showCopy"
          [presets]="swatches"
        />
        <code style="font-size: 0.75rem;">value: {{ inline ?? 'null' }}</code>
      </div>
    `,
  }),
};

export default meta;

type Story = StoryObj<AndesColorPickerPanel>;

/**
 * The panel inline, without a trigger or a popup: the same controls, inputs and events as
 * the picker's popup, in its own bordered card (`role="group"`, named by `aria-label`).
 */
export const Inline: Story = {};

/**
 * The three widths (`sm` 14rem, `md` 16rem, `lg` 20rem), and a panel bound to a reactive
 * `FormControl`: it reports its value, marks the control touched when focus leaves it and
 * follows `disable()`.
 */
export const SizesAndForms: Story = {
  render: () => ({
    moduleMetadata: { imports: IMPORTS },
    props: { control: new FormControl('#fa541c') },
    template: `
      <div style="display: flex; flex-wrap: wrap; gap: 1rem; align-items: flex-start;">
        <andes-color-picker-panel aria-label="Small" size="sm" value="#52c41a" [eyeDropper]="false" />
        <andes-color-picker-panel aria-label="Large" size="lg" mode="gradient" value="linear-gradient(90deg, #13c2c2, #1677ff)" />
        <div style="display: flex; flex-direction: column; gap: 0.5rem;">
          <andes-color-picker-panel aria-label="Accent" [formControl]="control" />
          <div style="display: flex; gap: 0.5rem;">
            <button type="button" (click)="control.setValue('#13c2c2')">Set teal</button>
            <button type="button" (click)="control.disabled ? control.enable() : control.disable()">
              Toggle disabled
            </button>
          </div>
          <code style="font-size: 0.75rem;">
            {{ control.value | json }} · {{ control.touched ? 'touched' : 'untouched' }} · {{ control.status }}
          </code>
        </div>
      </div>
    `,
  }),
};
