import { JsonPipe } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import type { Meta, StoryObj } from '@storybook/angular';

import { AndesColor } from './color';
import { AndesColorPicker } from './color-picker';
import { AndesColorPickerTrigger } from './color-picker-trigger';

const IMPORTS = [
  AndesColorPicker,
  AndesColorPickerTrigger,
  JsonPipe,
  ReactiveFormsModule,
];

const meta: Meta<AndesColorPicker> = {
  title: 'Data Entry/Color Picker/Basics/Field',
  component: AndesColorPicker,
  tags: ['autodocs'],
  // The panel opens below the trigger, so the stories sit at the top of the canvas.
  parameters: { layout: 'padded' },
  argTypes: {
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    status: { control: 'select', options: [undefined, 'error', 'warning'] },
    defaultFormat: {
      control: 'select',
      options: ['hex', 'rgb', 'hsb', 'hsl', 'oklch'],
    },
    trigger: { control: 'select', options: ['click', 'hover'] },
    mode: { control: 'select', options: ['single', 'gradient'] },
    placement: {
      control: 'select',
      options: ['bottomLeft', 'bottomRight', 'topLeft', 'topRight'],
    },
    disabled: { control: 'boolean' },
    allowClear: { control: 'boolean' },
    showText: { control: 'boolean' },
    showAlpha: { control: 'boolean' },
    disabledAlpha: { control: 'boolean' },
    disabledFormat: { control: 'boolean' },
    eyeDropper: { control: 'boolean' },
    arrow: { control: 'boolean' },
    readOnly: { control: 'boolean' },
    showCopy: { control: 'boolean' },
    confirm: { control: 'boolean' },
  },
  args: {
    size: 'md',
    status: undefined,
    defaultFormat: 'hex',
    placement: 'bottomLeft',
    disabled: false,
    allowClear: false,
    showText: false,
    showAlpha: true,
    disabledAlpha: false,
    disabledFormat: false,
    eyeDropper: true,
    trigger: 'click',
    mode: 'single',
    arrow: false,
    readOnly: false,
    showCopy: true,
    confirm: false,
  },
  render: (args) => ({
    moduleMetadata: { imports: IMPORTS },
    props: { ...args, brand: '#1677ff' },
    template: `
      <andes-color-picker
        aria-label="Brand color"
        [(value)]="brand"
        [size]="size"
        [status]="status"
        [defaultFormat]="defaultFormat"
        [placement]="placement"
        [disabled]="disabled"
        [allowClear]="allowClear"
        [showText]="showText"
        [showAlpha]="showAlpha"
        [disabledAlpha]="disabledAlpha"
        [disabledFormat]="disabledFormat"
        [eyeDropper]="eyeDropper"
        [trigger]="trigger"
        [mode]="mode"
        [arrow]="arrow"
        [readOnly]="readOnly"
        [showCopy]="showCopy"
        [confirm]="confirm"
      />
    `,
  }),
};

export default meta;

type Story = StoryObj<AndesColorPicker>;

export const Default: Story = {};

export const Sizes: Story = {
  render: () => ({
    moduleMetadata: { imports: IMPORTS },
    template: `
      <div style="display: flex; gap: 1.5rem; align-items: center;">
        <andes-color-picker aria-label="Small" size="sm" value="#52c41a" />
        <andes-color-picker aria-label="Medium" size="md" value="#1677ff" />
        <andes-color-picker aria-label="Large" size="lg" value="#f5222d" />
      </div>
      <div style="display: flex; gap: 1.5rem; align-items: center; margin-top: 1rem;">
        <andes-color-picker aria-label="Small with text" size="sm" value="#52c41a" showText />
        <andes-color-picker aria-label="Medium with text" size="md" value="#1677ff" showText />
        <andes-color-picker aria-label="Large with text" size="lg" value="#f5222d" showText />
      </div>
    `,
  }),
};

/**
 * The text next to the swatch (`showText`): the placeholder while there is no value, the
 * value in the format the user picked (here `defaultFormat="rgb"`), and a template that
 * receives the color and its text.
 */
export const ShowText: Story = {
  render: () => ({
    moduleMetadata: { imports: IMPORTS },
    props: { picked: 'rgba(22, 119, 255, 0.6)' },
    template: `
      <div style="display: flex; flex-direction: column; gap: 1rem; align-items: flex-start;">
        <andes-color-picker aria-label="Accent color" showText placeholder="Pick a color" />
        <andes-color-picker aria-label="Text color" [(value)]="picked" showText defaultFormat="rgb" />
        <ng-template #named let-color let-text="value">
          <span style="display: inline-flex; gap: 0.5rem;">
            <strong>Brand</strong>
            <span style="opacity: 0.7;">{{ text }}</span>
          </span>
        </ng-template>
        <andes-color-picker aria-label="Branded text" value="#722ed1" [showText]="named" />
      </div>
    `,
  }),
};

/**
 * Three ways to hold the value: `[(value)]` with the `colorChange` / `colorChangeComplete`
 * events logged, an `AndesColor` object as the value (read back as RGB and HSB strings), and
 * a reactive `FormControl` driven from outside - set a value, toggle `disabled` - named by a
 * `<label for>`.
 */
export const Binding: Story = {
  render: () => ({
    moduleMetadata: { imports: IMPORTS },
    props: {
      picked: '#fa8c16',
      events: [] as string[],
      color: AndesColor.parse('#13a8a8'),
      control: new FormControl('#fa541c', { nonNullable: true }),
    },
    template: `
      <div style="display: flex; flex-direction: column; gap: 0.75rem; align-items: flex-start; width: 22rem;">
        <andes-color-picker
          aria-label="Warning color"
          [(value)]="picked"
          showText
          (colorChange)="events = ['change ' + $event.value, ...events].slice(0, 4)"
          (colorChangeComplete)="events = ['complete ' + $event.value, ...events].slice(0, 4)"
        />
        <code style="font-size: 0.75rem;">value: {{ picked }}</code>
        <code style="font-size: 0.75rem; white-space: pre;">{{ events.join('\\n') }}</code>
        <andes-color-picker aria-label="Accent" [(value)]="color" showText />
        <code style="font-size: 0.75rem;">
          {{ color.toRgbString() }} · {{ color.toHsbString() }}
        </code>
        <label for="story-accent" style="font-size: 0.875rem;">Accent color</label>
        <andes-color-picker id="story-accent" [formControl]="control" showText />
        <div style="display: flex; gap: 0.5rem;">
          <button type="button" (click)="control.setValue('#13c2c2')">Set teal</button>
          <button type="button" (click)="control.disabled ? control.enable() : control.disable()">
            Toggle disabled
          </button>
        </div>
        <code style="font-size: 0.75rem;">value: {{ control.value | json }} · {{ control.status }}</code>
      </div>
    `,
  }),
};

export const AllowClear: Story = {
  render: () => ({
    moduleMetadata: { imports: IMPORTS },
    props: { picked: '#eb2f96', cleared: 0 },
    template: `
      <div style="display: flex; flex-direction: column; gap: 0.75rem; align-items: flex-start;">
        <andes-color-picker
          aria-label="Highlight"
          [(value)]="picked"
          allowClear
          showText
          placeholder="No highlight"
          (clear)="cleared = cleared + 1"
        />
        <code style="font-size: 0.75rem;">value: {{ picked ?? 'null' }} · cleared {{ cleared }}×</code>
      </div>
    `,
  }),
};

/**
 * `disabled` blocks the picker; `readOnly` still opens the panel to show (and copy) the
 * value, but nothing in it changes the colour, and the trigger is announced as read-only.
 */
export const States: Story = {
  render: () => ({
    moduleMetadata: { imports: IMPORTS },
    template: `
      <div style="display: flex; flex-direction: column; gap: 1rem; align-items: flex-start;">
        <andes-color-picker aria-label="Disabled" disabled value="#1677ff" showText />
        <andes-color-picker aria-label="Read-only" readOnly value="#13a8a8" showText />
        <andes-color-picker aria-label="Error" status="error" value="#f5222d" showText />
        <andes-color-picker aria-label="Warning" status="warning" value="#fa8c16" showText />
      </div>
    `,
  }),
};

export const CustomTrigger: Story = {
  render: () => ({
    moduleMetadata: { imports: IMPORTS },
    props: { picked: '#722ed1' },
    template: `
      <andes-color-picker aria-label="Heading color" [(value)]="picked">
        <span andesColorPickerTrigger style="display: inline-flex; align-items: center; gap: 0.5rem; text-decoration: underline; text-decoration-color: currentColor;">
          <span style="width: 0.75rem; height: 0.75rem; border-radius: 9999px;" [style.background]="picked"></span>
          Heading color
        </span>
      </andes-color-picker>
    `,
  }),
};

const placements = (attributes: string) => `
  <div style="display: grid; grid-template-columns: repeat(2, auto); justify-content: space-between; row-gap: 19rem; padding: 1rem 1rem 3rem;">
    <andes-color-picker aria-label="Below, start" placement="bottomLeft" value="#1677ff" ${attributes} />
    <andes-color-picker aria-label="Below, end" placement="bottomRight" value="#52c41a" ${attributes} />
    <andes-color-picker aria-label="Above, start" placement="topLeft" value="#fa8c16" ${attributes} />
    <andes-color-picker aria-label="Above, end" placement="topRight" value="#eb2f96" ${attributes} />
  </div>
`;

/**
 * The four placements with the `arrow` pointing at the trigger, and `trigger="hover"`: the
 * panel opens after a short rest on the trigger and closes once the pointer has left both
 * (it may cross the gap); a click, a tap or Enter / Space / ArrowDown pins it open with focus
 * inside. The second block is the same, right to left.
 */
export const TriggerAndArrow: Story = {
  parameters: { layout: 'fullscreen' },
  render: () => ({
    moduleMetadata: { imports: IMPORTS },
    template: `
      ${placements('arrow trigger="hover" showText')}
      <div dir="rtl" style="border-block-start: 1px dashed var(--andes-color-border);">${placements('arrow')}</div>
    `,
  }),
};
