import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';

import { AndesSlider } from './slider';
import {
  AndesSliderMarkTemplate,
  AndesSliderTooltipTemplate,
} from './slider-templates';

const meta: Meta<AndesSlider> = {
  title: 'Data Entry/Slider/Basics/Features',
  component: AndesSlider,
  decorators: [
    moduleMetadata({
      imports: [AndesSliderMarkTemplate, AndesSliderTooltipTemplate],
    }),
  ],
};

export default meta;

type Story = StoryObj<AndesSlider>;

const log = (label: string) => (value: unknown) =>
  console.log(label, JSON.stringify(value));

/**
 * Labelled marks, from a list of `{ value, label }` objects or a keyed object whose entries
 * can carry a style (the last one is red). `dots` draws a dot for every mark.
 */
export const Marks: Story = {
  render: () => ({
    props: {
      labelledMarks: [
        { value: 0, label: '0°C' },
        { value: 25, label: '25°C' },
        { value: 50, label: '50°C' },
        { value: 75, label: '75°C' },
        { value: 100, label: '100°C' },
      ],
      keyedMarks: {
        0: '0°C',
        26: '26°C',
        37: '37°C',
        100: {
          label: '100°C',
          style: {
            color: 'var(--andes-color-danger-text, var(--andes-color-danger))',
            fontWeight: 600,
          },
        },
      },
      dotMarks: [0, 20, 40, 60, 80, 100],
    },
    template: `
      <div style="width: 320px; display: grid; gap: 3rem; padding-bottom: 1.5rem;">
        <andes-slider [value]="50" [marks]="labelledMarks" aria-label="Temperature" />
        <andes-slider [value]="37" [marks]="keyedMarks" aria-label="Keyed marks, styled" />
        <andes-slider [value]="40" dots [marks]="dotMarks" aria-label="Dots on marks" />
      </div>
    `,
  }),
};

/**
 * `step: null` limits the handle to the marks. The second slider adds `included: false`, so
 * the rail is not filled up to the handle.
 */
export const MarksOnly: Story = {
  render: () => ({
    props: {
      levels: [
        { value: 0, label: 'Off' },
        { value: 20, label: 'Low' },
        { value: 60, label: 'Mid' },
        { value: 100, label: 'Max' },
      ],
      pointMarks: { 0: '0°C', 26: '26°C', 37: '37°C', 100: '100°C' },
    },
    template: `
      <div style="width: 320px; display: grid; gap: 3rem; padding-bottom: 1.5rem;">
        <andes-slider [value]="40" [step]="null" [marks]="levels" aria-label="Level" />
        <andes-slider [value]="37" [included]="false" [marks]="pointMarks" aria-label="Point only" />
      </div>
    `,
  }),
};

export const CustomMarkTemplate: Story = {
  render: () => ({
    template: `
      <div style="width: 320px; padding-bottom: 1.5rem;">
        <andes-slider [value]="50" [step]="null" [marks]="[0, 25, 50, 75, 100]" aria-label="Opacity">
          <ng-template andesSliderMark let-mark let-active="active">
            <span [style.font-weight]="active ? 600 : 400">{{ mark.value }}%</span>
          </ng-template>
        </andes-slider>
      </div>
    `,
  }),
};

/**
 * Tooltip visibility (`hover`, `always`, `never`) and `tooltipPlacement` on horizontal and
 * vertical sliders.
 */
export const Tooltip: Story = {
  render: () => ({
    template: `
      <div style="width: 320px; display: grid; gap: 3rem; padding: 2.5rem 3rem;">
        <andes-slider [value]="55" tooltip="hover" aria-label="Hover (default)" />
        <andes-slider [value]="55" tooltip="always" aria-label="Always visible" />
        <andes-slider [value]="55" tooltip="never" aria-label="Hidden" />
        <andes-slider [value]="30" tooltip="always" tooltipPlacement="top" aria-label="Top" />
        <andes-slider [value]="50" tooltip="always" tooltipPlacement="bottom" aria-label="Bottom" />
        <div style="height: 160px; display: flex; gap: 5rem; justify-content: center;">
          <andes-slider orientation="vertical" [value]="40" tooltip="always" tooltipPlacement="left" aria-label="Left" />
          <andes-slider orientation="vertical" [value]="60" tooltip="always" aria-label="Default (inline end)" />
        </div>
      </div>
    `,
  }),
};

/**
 * Formatting what is shown and read: `valueFormatter` sets the text for `aria-valuetext`,
 * `tooltipFormatter` the tooltip's (returning `null` hides it - drag the first slider to 0), and
 * an `andesSliderTooltip` template replaces the tooltip content altogether.
 */
export const Formatters: Story = {
  render: () => ({
    props: {
      currency: (value: number) => `$${value}`,
      percent: (value: number) => (value === 0 ? null : `${value}%`),
      spoken: (value: number) => `${value} percent`,
    },
    template: `
      <div style="width: 320px; display: grid; gap: 4rem; padding-top: 2.5rem;">
        <andes-slider
          range
          [value]="[200, 800]"
          [min]="0"
          [max]="1000"
          [step]="50"
          [valueFormatter]="currency"
          tooltip="always"
          startAriaLabel="Minimum price"
          endAriaLabel="Maximum price"
        />
        <!-- Tooltip shows "30%", aria-valuetext reads "30 percent"; drag to 0 and it hides. -->
        <andes-slider
          range
          [value]="[0, 30]"
          tooltip="always"
          [tooltipFormatter]="percent"
          [valueFormatter]="spoken"
          startAriaLabel="Start"
          endAriaLabel="End"
        />
        <andes-slider range [value]="[20, 60]" tooltip="always" startAriaLabel="From" endAriaLabel="To">
          <ng-template andesSliderTooltip let-value let-index="index">
            <strong>{{ index === 0 ? 'From' : 'To' }}</strong> {{ value }}h
          </ng-template>
        </andes-slider>
      </div>
    `,
  }),
};

/** `valueChange` fires on every move; `valueCommit` only when the gesture ends (see the console). */
export const ChangeVsChangeComplete: Story = {
  name: 'valueChange vs valueCommit (onChangeComplete)',
  render: () => ({
    props: {
      onChange: log('valueChange'),
      onComplete: log('valueCommit'),
    },
    template: `
      <div style="width: 320px;">
        <andes-slider
          [value]="30"
          (valueChange)="onChange($event)"
          (valueCommit)="onComplete($event)"
          aria-label="Volume"
        />
      </div>
    `,
  }),
};

export const AutoFocus: Story = {
  // Kept off the docs page: it would steal focus from the other stories there.
  tags: ['!autodocs'],
  render: () => ({
    template: `
      <div style="width: 320px;">
        <andes-slider autoFocus [value]="30" aria-label="Volume" />
      </div>
    `,
  }),
};
