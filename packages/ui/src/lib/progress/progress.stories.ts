import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';

import { AndesButton } from '../button/button';
import { AndesProgress } from './progress';

const meta: Meta<AndesProgress> = {
  title: 'Feedback/Progress/Basics',
  component: AndesProgress,
  tags: ['autodocs'],
  argTypes: {
    value: { control: 'number' },
    min: { control: 'number' },
    max: { control: 'number' },
    variant: {
      control: 'select',
      options: ['primary', 'success', 'warning', 'danger'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'small', 'medium', 'default'],
    },
    type: { control: 'select', options: ['line', 'circle', 'dashboard'] },
    status: {
      control: 'select',
      options: [undefined, 'normal', 'success', 'exception', 'active'],
    },
    showInfo: { control: 'boolean' },
  },
  args: {
    value: 42,
    min: 0,
    max: 100,
    variant: 'primary',
    size: 'md',
    type: 'line',
  },
  render: (args) => ({
    props: args,
    template: `<div style="width: 320px;"><andes-progress [value]="value" [min]="min" [max]="max" [variant]="variant" [size]="size" [type]="type" [status]="status" [showInfo]="showInfo" aria-label="Progress" /></div>`,
  }),
};

export default meta;

type Story = StoryObj<AndesProgress>;

/** The playground: use the controls to try every input on one bar. */
export const Default: Story = {
  args: { value: 42 },
};

/**
 * What the bar reads for a given `value`: partway, empty (0), complete (100), indeterminate
 * (`value` null, a looping animation), and a custom range with `min` / `max`. `aria-valuetext`
 * replaces the announced text with something friendlier than a percentage.
 */
export const Values: Story = {
  render: () => ({
    template: `
      <div style="display: flex; flex-direction: column; gap: 1rem; width: 320px;">
        <andes-progress [value]="42" [showInfo]="true" aria-label="Determinate" />
        <andes-progress [value]="0" aria-label="Empty" />
        <andes-progress [value]="100" aria-label="Complete" />
        <andes-progress [value]="null" aria-label="Indeterminate" />
        <andes-progress [value]="140" [min]="50" [max]="200" aria-label="Custom range 50 to 200" />
        <andes-progress [value]="56" aria-label="Upload progress" aria-valuetext="56 of 100 files uploaded" />
      </div>
    `,
  }),
};

/**
 * `variant` is `primary` (the default), `success`, `warning` or `danger`, so the colour can
 * follow the value it reports.
 */
export const Variants: Story = {
  render: () => ({
    template: `
      <div style="display: flex; flex-direction: column; gap: 1rem; width: 320px;">
        <andes-progress variant="primary" [value]="42" aria-label="Primary progress" />
        <andes-progress variant="success" [value]="100" aria-label="Success progress" />
        <andes-progress variant="warning" [value]="65" aria-label="Warning progress" />
        <andes-progress variant="danger" [value]="20" aria-label="Danger progress" />
      </div>
    `,
  }),
};

/**
 * Bar thickness: the `sm`, `md` and `lg` presets, then the flexible `size` forms - the `small` /
 * `default` aliases, a `[width, height]` tuple and a `{ width, height }` object (any CSS length).
 */
export const Sizes: Story = {
  render: () => ({
    template: `
      <div style="display: flex; flex-direction: column; gap: 1rem; width: 360px;">
        <andes-progress size="sm" [value]="42" aria-label="Small progress" />
        <andes-progress size="md" [value]="42" aria-label="Medium progress" />
        <andes-progress size="lg" [value]="42" aria-label="Large progress" />
        <andes-progress [percent]="50" size="small" [showInfo]="true" aria-label="Small alias" />
        <andes-progress [percent]="50" size="default" [showInfo]="true" aria-label="Default alias" />
        <andes-progress [percent]="50" [size]="[240, 20]" [showInfo]="true" aria-label="240 by 20" />
        <andes-progress [percent]="50" [size]="{ width: '60%', height: 4 }" [showInfo]="true" aria-label="60 percent wide" />
      </div>
    `,
  }),
};

/**
 * `status` sets the outcome: normal, `active` (an animated sheen), `exception` and `success`.
 * With `showInfo` the status picks the trailing text or icon; `aria-valuetext` can carry the
 * outcome for assistive technology.
 */
export const Statuses: Story = {
  render: () => ({
    template: `
      <div style="display: flex; flex-direction: column; gap: 1rem; width: 320px;">
        <andes-progress [percent]="30" [showInfo]="true" aria-label="Normal" />
        <andes-progress [percent]="50" status="active" [showInfo]="true" aria-label="Active" />
        <andes-progress [percent]="70" status="exception" [showInfo]="true" aria-label="Exception" aria-valuetext="70%, failed" />
        <andes-progress [percent]="100" status="success" [showInfo]="true" aria-label="Success" aria-valuetext="100%, complete" />
      </div>
    `,
  }),
};

/** The fill animates between values - step the percentage up and down. */
export const Dynamic: Story = {
  decorators: [moduleMetadata({ imports: [AndesButton] })],
  render: () => ({
    props: { percent: 30 },
    template: `
      <div style="display: flex; flex-direction: column; gap: 1rem; width: 320px; font-family: var(--andes-font-family), sans-serif;">
        <andes-progress [percent]="percent" [showInfo]="true" aria-label="Dynamic bar" />
        <andes-progress type="circle" [percent]="percent" aria-label="Dynamic ring" />
        <div style="display: flex; gap: 0.5rem;">
          <andes-button variant="secondary" size="sm" aria-label="Decrease" (click)="percent = percent > 10 ? percent - 10 : 0">-10</andes-button>
          <andes-button variant="secondary" size="sm" aria-label="Increase" (click)="percent = percent < 90 ? percent + 10 : 100">+10</andes-button>
        </div>
      </div>
    `,
  }),
};
