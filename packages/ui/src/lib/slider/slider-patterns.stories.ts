import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideVolume, lucideVolume2 } from '@ng-icons/lucide';
import {
  applicationConfig,
  moduleMetadata,
  type Meta,
  type StoryObj,
} from '@storybook/angular';

import { AndesInputNumber } from '../input-number/input-number';
import { AndesSlider } from './slider';

const meta: Meta<AndesSlider> = {
  title: 'Data Entry/Slider/Patterns/Composition',
  component: AndesSlider,
};

export default meta;

type Story = StoryObj<AndesSlider>;

export const WithNumberInput: Story = {
  name: 'Paired with a number input',
  render: () => ({
    moduleMetadata: { imports: [AndesInputNumber] },
    props: {
      volume: 25,
      ratio: 0.4,
    },
    template: `
      <div style="display: grid; gap: 1.5rem; width: 360px; font-family: var(--andes-font-family), sans-serif; font-size: 0.875rem; color: var(--andes-color-foreground);">
        <div style="display: flex; align-items: center; gap: 1rem;">
          <andes-slider style="flex: 1;" [min]="1" [max]="50" [value]="volume" (valueChange)="volume = $event" aria-label="Volume" />
          <andes-input-number style="width: 7rem;" aria-label="Volume (number)" [min]="1" [max]="50" [step]="1"
            [value]="volume" (valueChange)="volume = $event ?? volume" />
        </div>
        <div style="display: flex; align-items: center; gap: 1rem;">
          <andes-slider style="flex: 1;" [min]="0" [max]="1" [step]="0.01" [value]="ratio" (valueChange)="ratio = $event" aria-label="Ratio" />
          <andes-input-number style="width: 7rem;" aria-label="Ratio (number)" [min]="0" [max]="1" [step]="0.01"
            [value]="ratio" (valueChange)="ratio = $event ?? ratio" />
        </div>
      </div>
    `,
  }),
};

export const WithIcons: Story = {
  name: 'With icons at both ends',
  decorators: [
    moduleMetadata({ imports: [NgIcon] }),
    applicationConfig({
      providers: [provideIcons({ lucideVolume, lucideVolume2 })],
    }),
  ],
  render: () => ({
    props: { value: 8, min: 0, max: 20 },
    template: `
      <div style="display: flex; align-items: center; gap: 0.75rem; width: 320px; font-size: 1rem;">
        <ng-icon
          name="lucideVolume"
          aria-hidden="true"
          [style.color]="value < (min + max) / 2 ? 'var(--andes-color-foreground)' : 'var(--andes-color-muted-foreground)'"
        />
        <andes-slider
          style="flex: 1;"
          [min]="min"
          [max]="max"
          [value]="value"
          (valueChange)="value = $event"
          aria-label="Volume"
        />
        <ng-icon
          name="lucideVolume2"
          aria-hidden="true"
          [style.color]="value >= (min + max) / 2 ? 'var(--andes-color-foreground)' : 'var(--andes-color-muted-foreground)'"
        />
      </div>
    `,
  }),
};
