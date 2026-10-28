import type { Meta, StoryObj } from '@storybook/angular';

import { AndesSlider } from './slider';

const meta: Meta<AndesSlider> = {
  title: 'Data Entry/Slider/Range/Handles',
  component: AndesSlider,
};

export default meta;

type Story = StoryObj<AndesSlider>;

/**
 * A two-handle range, and the same range with `draggableTrack`, where dragging the filled
 * segment moves both handles together.
 */
export const Range: Story = {
  render: () => ({
    template: `
      <div style="width: 320px; display: grid; gap: 1.5rem;">
        <andes-slider range [value]="[20, 70]" startAriaLabel="Minimum" endAriaLabel="Maximum" />
        <andes-slider [range]="{ draggableTrack: true }" [value]="[20, 50]" [step]="5" startAriaLabel="Start" endAriaLabel="End" />
      </div>
    `,
  }),
};

/**
 * Click the rail to add a handle, press Delete or drag a handle off to remove it; `minCount`
 * and `maxCount` bound how many there can be, and `thumbAriaLabel` names each handle.
 */
export const EditableRange: Story = {
  name: 'Editable range (click to add, Delete or drag off to remove)',
  render: () => ({
    props: {
      stops: [20, 80],
      rangeConfig: { editable: true, minCount: 1, maxCount: 5 },
      label: (index: number, count: number) => `Stop ${index + 1} of ${count}`,
    },
    template: `
      <div style="width: 320px; display: grid; gap: 0.75rem;">
        <andes-slider [range]="rangeConfig" [(value)]="stops" [thumbAriaLabel]="label" aria-label="Gradient stops" />
        <output style="font: 0.875rem var(--andes-font-family), sans-serif; color: var(--andes-color-foreground);">
          Stops: {{ stops.join(", ") }}
        </output>
      </div>
    `,
  }),
};

export const MultipleHandles: Story = {
  render: () => ({
    props: {
      label: (index: number) => ['Low', 'Mid', 'High'][index] ?? 'Handle',
    },
    template: `
      <div style="width: 320px;">
        <andes-slider range [value]="[10, 40, 70]" [thumbAriaLabel]="label" aria-label="Thresholds" />
      </div>
    `,
  }),
};

/** `disabled` can be an array: here the first handle is locked and the second moves. */
export const PerHandleDisabled: Story = {
  name: 'Per-handle disabled',
  render: () => ({
    template: `
      <div style="width: 320px;">
        <andes-slider range [value]="[20, 60]" [disabled]="[true, false]" startAriaLabel="Floor (locked)" endAriaLabel="Ceiling" />
      </div>
    `,
  }),
};
