import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';

import { AndesSlider } from './slider';
import {
  AndesSliderMarkTemplate,
  AndesSliderTooltipTemplate,
} from './slider-templates';

const meta: Meta<AndesSlider> = {
  title: 'Data Entry/Slider/Basics/Field',
  component: AndesSlider,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [AndesSliderMarkTemplate, AndesSliderTooltipTemplate],
    }),
  ],
  argTypes: {
    value: { control: 'object' },
    min: { control: 'number' },
    max: { control: 'number' },
    step: { control: 'number' },
    largeStep: { control: 'number' },
    orientation: { control: 'select', options: ['horizontal', 'vertical'] },
    range: { control: 'boolean' },
    disabled: { control: 'boolean' },
    keyboard: { control: 'boolean' },
    dots: { control: 'boolean' },
    included: { control: 'boolean' },
    reverse: { control: 'boolean' },
    tooltip: { control: 'select', options: ['hover', 'always', 'never'] },
    tooltipPlacement: {
      control: 'select',
      options: [undefined, 'top', 'bottom', 'left', 'right'],
    },
    marks: { control: 'object' },
  },
  args: {
    min: 0,
    max: 100,
    step: 1,
    largeStep: 10,
    orientation: 'horizontal',
    range: false,
    disabled: false,
    keyboard: true,
    dots: false,
    included: true,
    reverse: false,
    tooltip: 'hover',
    marks: [],
  },
  render: (args) => ({
    props: { ...args, value: args.value ?? 40 },
    template: `
      <div style="width: 320px;">
        <andes-slider
          [value]="value"
          [min]="min"
          [max]="max"
          [step]="step"
          [largeStep]="largeStep"
          [orientation]="orientation"
          [range]="range"
          [disabled]="disabled"
          [keyboard]="keyboard"
          [dots]="dots"
          [included]="included"
          [reverse]="reverse"
          [tooltip]="tooltip"
          [tooltipPlacement]="tooltipPlacement"
          [marks]="marks"
          aria-label="Volume"
          startAriaLabel="Minimum"
          endAriaLabel="Maximum"
        />
      </div>
    `,
  }),
};

export default meta;

type Story = StoryObj<AndesSlider>;

/** Playground: every input is a control. */
export const Default: Story = {};

/**
 * Snapping: a whole-number `step` of 10, a fractional `step` of 0.1 on a 0-1 scale, and `dots`
 * without marks, which draws one dot per step.
 */
export const Steps: Story = {
  render: () => ({
    template: `
      <div style="width: 320px; display: grid; gap: 1.5rem;">
        <andes-slider [step]="10" [value]="30" aria-label="Step of 10" />
        <andes-slider [min]="0" [max]="1" [step]="0.1" [value]="0.4" aria-label="Fractional step" />
        <andes-slider dots [step]="10" [value]="40" aria-label="Dots at every step" />
      </div>
    `,
  }),
};

/**
 * `disabled`, and `included: false` (a point only: the rail is not filled up to the handle).
 */
export const States: Story = {
  render: () => ({
    template: `
      <div style="width: 320px; display: grid; gap: 1.5rem;">
        <andes-slider disabled [value]="35" aria-label="Disabled" />
        <andes-slider [included]="false" [value]="60" aria-label="Point only" />
      </div>
    `,
  }),
};

/**
 * Orientation and direction: vertical (single and range), `reverse` (the maximum at the start)
 * and right-to-left, where the slider mirrors under `dir="rtl"`.
 */
export const Orientation: Story = {
  render: () => ({
    template: `
      <div style="display: grid; gap: 2rem;">
        <div style="height: 220px; display: flex; gap: 2rem;">
          <andes-slider orientation="vertical" [value]="40" aria-label="Volume" />
          <andes-slider
            orientation="vertical"
            range
            [value]="[20, 70]"
            startAriaLabel="Minimum"
            endAriaLabel="Maximum"
          />
        </div>
        <div style="width: 320px;">
          <andes-slider reverse [value]="25" aria-label="Reversed" />
        </div>
        <div dir="rtl" style="width: 320px;">
          <andes-slider [value]="25" tooltip="always" aria-label="مستوى الصوت" />
        </div>
      </div>
    `,
  }),
};

/** Two-way binding with `[(value)]`, echoing the value. */
export const Binding: Story = {
  render: () => ({
    template: `
      <div style="width: 320px; display: grid; gap: 0.75rem;">
        <andes-slider [(value)]="volume" tooltip="always" aria-label="Volume" />
        <output style="font: 0.875rem var(--andes-font-family, system-ui); color: var(--andes-color-foreground);">
          Value: {{ volume }}
        </output>
      </div>
    `,
    props: { volume: 40 },
  }),
};

/**
 * Restyling through the CSS custom property hooks on the host: rail, track, handle, handle
 * hover and active dot colors.
 */
export const CustomColors: Story = {
  render: () => ({
    template: `
      <div
        style="
          width: 320px;
          --andes-slider-rail-color: var(--andes-color-border);
          --andes-slider-track-color: var(--andes-color-success);
          --andes-slider-handle-color: var(--andes-color-success);
          --andes-slider-handle-hover-color: var(--andes-color-success-hover);
          --andes-slider-dot-active-color: var(--andes-color-success);
        "
      >
        <andes-slider [value]="60" [step]="20" dots aria-label="Progress" />
      </div>
    `,
  }),
};
