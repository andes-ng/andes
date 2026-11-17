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

const caption =
  'font: 0.875rem/1.375rem var(--andes-font-family), sans-serif; color: var(--andes-color-muted-foreground); margin: 0 0 0.5rem;';

/**
 * `minDistance` keeps handles apart in every path - drag, keyboard, rail click and, in an
 * editable range, adding a handle (it is moved out of a neighbour's gap, or not added when
 * there is no room). It rounds up to the `step`. `snapToMarks` is a pointer magnet over a fine
 * `step`: the dragged value sticks to a mark within `snapThreshold` (one step by default).
 */
export const MinDistanceAndSnapping: Story = {
  name: 'Min distance and snapping',
  render: () => ({
    props: {
      thresholds: [10, 40, 80],
      distanceMarks: { 0: '0', 25: '25', 50: '50', 75: '75', 100: '100' },
      stops: { editable: true, maxCount: 6 },
    },
    template: `
      <div style="width: 320px; display: grid; gap: 1.5rem; padding-bottom: 1.5rem;">
        <div>
          <p style="${caption}">minDistance 20: push one handle into the other</p>
          <andes-slider style="margin-top: 1.75rem;" range [minDistance]="20" [value]="[20, 60]" tooltip="always" startAriaLabel="Low" endAriaLabel="High" />
        </div>
        <div>
          <p style="${caption}">Three handles, step 5, minDistance 12 (rounds up to 15)</p>
          <andes-slider style="margin-top: 1.75rem;" range [step]="5" [minDistance]="12" [value]="thresholds" tooltip="always" aria-label="Thresholds" />
        </div>
        <div>
          <p style="${caption}">Editable, minDistance 15: click the rail; no room, no handle</p>
          <andes-slider [range]="stops" [minDistance]="15" [value]="[10, 90]" aria-label="Stops" />
        </div>
        <div>
          <p style="${caption}">Draggable track: the gap travels with the range</p>
          <andes-slider [range]="{ draggableTrack: true }" [minDistance]="20" [value]="[20, 50]" startAriaLabel="Start" endAriaLabel="End" />
        </div>
        <div style="display: flex; gap: 3rem; align-items: flex-start;">
          <div style="height: 12rem; display: flex;">
            <andes-slider orientation="vertical" range [minDistance]="20" [value]="[20, 60]" startAriaLabel="Low" endAriaLabel="High" />
          </div>
          <div dir="rtl" style="flex: 1;">
            <p style="${caption}">Right-to-left (and vertical, on the left): the gap is the same</p>
            <andes-slider range [minDistance]="20" [value]="[20, 60]" startAriaLabel="Low" endAriaLabel="High" />
          </div>
        </div>
        <div>
          <p style="${caption}">snapToMarks, step 1, reach 4 (keyboard moves one step)</p>
          <andes-slider style="margin-top: 1.75rem;" snapToMarks [snapThreshold]="4" [marks]="distanceMarks" [value]="30" tooltip="always" aria-label="Magnet" />
        </div>
      </div>
    `,
  }),
};
