import { JsonPipe } from '@angular/common';
import type { Meta, StoryObj } from '@storybook/angular';

import { AndesColorPicker } from './color-picker';
import type { AndesColorPreset } from './color-picker-types';
import type { AndesGradientValue } from './gradient';

const IMPORTS = [AndesColorPicker, JsonPipe];

const GRADIENT_PRESETS: readonly AndesColorPreset[] = [
  {
    label: 'Gradients',
    gradients: [
      'linear-gradient(90deg, #ff7a45 0%, #ffd666 100%)',
      'linear-gradient(135deg, #1677ff 0%, #a855f7 100%)',
      'linear-gradient(180deg, #13c2c2 0%, #52c41a 50%, #fadb14 100%)',
      'linear-gradient(45deg, #000000 0%, #00000000 100%)',
    ],
  },
  {
    label: 'Stop colors',
    colors: ['#f5222d', '#fa8c16', '#fadb14', '#52c41a', '#1677ff', '#722ed1'],
  },
];

const meta: Meta<AndesColorPicker> = {
  title: 'Data Entry/Color Picker/Gradient',
  component: AndesColorPicker,
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<AndesColorPicker>;

/**
 * `mode="gradient"`: the value is a CSS `linear-gradient()`. Drag a stop along the bar (or
 * focus it and use the arrow keys, Shift for 10%), double-click the bar or press + to add a
 * stop with the colour the gradient has there, Delete / Backspace or the minus button to
 * remove one (two always remain). The selected stop is edited with the area, sliders and
 * fields; the dial and the number field set the angle. Gradient presets replace the whole
 * gradient, colour presets recolour the selected stop.
 */
export const Gradient: Story = {
  render: () => ({
    moduleMetadata: { imports: IMPORTS },
    props: {
      background: 'linear-gradient(90deg, #1677ff 0%, #a855f7 100%)',
      gradientPresets: GRADIENT_PRESETS,
      log: [] as string[],
    },
    template: `
      <div style="display: flex; flex-direction: column; gap: 0.75rem; align-items: flex-start; max-width: 32rem;">
        <div [style.background]="background" style="width: 100%; height: 4rem; border-radius: 0.5rem;"></div>
        <andes-color-picker
          aria-label="Background"
          mode="gradient"
          [(value)]="background"
          [presets]="gradientPresets"
          showText
          (colorChangeComplete)="log = ['stop ' + ($event.gradient?.stop ?? 0) + ': ' + $event.value, ...log].slice(0, 3)"
        />
        <code style="font-size: 0.75rem; word-break: break-all;">{{ background }}</code>
        <code style="font-size: 0.75rem; white-space: pre;">{{ log.join('\\n') }}</code>
      </div>
    `,
  }),
};

/**
 * A gradient held as data (`AndesGradientValue`): it comes back as an `AndesGradient`, here
 * written out as JSON. The trigger text is a template given the gradient; with
 * `[showText]="true"` it would be a short summary.
 */
export const GradientObject: Story = {
  render: () => ({
    moduleMetadata: { imports: IMPORTS },
    props: {
      sunrise: {
        angle: 120,
        stops: [
          { color: '#ff4d4f', position: 0 },
          { color: '#ffa940', position: 45 },
          { color: '#fff1b8', position: 100 },
        ],
      } satisfies AndesGradientValue,
    },
    template: `
      <div style="display: flex; flex-direction: column; gap: 0.75rem; align-items: flex-start;">
        <ng-template #summary let-gradient="gradient">
          <span>{{ gradient.angle }}° · {{ gradient.stops.length }} stops</span>
        </ng-template>
        <andes-color-picker aria-label="Sunrise" mode="gradient" defaultFormat="rgb" [(value)]="sunrise" [showText]="summary" arrow />
        <code style="font-size: 0.75rem; white-space: pre;">{{ sunrise | json }}</code>
      </div>
    `,
  }),
};
