import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import type { Meta, StoryObj } from '@storybook/angular';

import { AndesToggle } from './toggle';

const bold = `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4.5 2.5h4a2.5 2.5 0 0 1 0 5h-4zM4.5 7.5h4.5a2.5 2.5 0 0 1 0 5H4.5z"/></svg>`;

const italic = `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 2.5H6.5M9.5 13.5H6M9.8 2.5 6.2 13.5"/></svg>`;

const underline = `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4.5 2.5v5a3.5 3.5 0 0 0 7 0v-5M3 14h10"/></svg>`;

const meta: Meta<AndesToggle> = {
  title: 'Data Entry/Toggle/Basics/Toggle',
  component: AndesToggle,
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'inline-radio', options: ['default', 'outline'] },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    disabled: { control: 'boolean' },
    pressed: { control: 'boolean' },
    tooltip: { control: 'text' },
  },
  args: { variant: 'default', size: 'md', disabled: false, pressed: false },
  render: (args) => ({
    props: args,
    template: `<andes-toggle aria-label="Bold" tooltip="Bold" [(pressed)]="pressed" [variant]="variant" [size]="size" [disabled]="disabled">${bold}</andes-toggle>`,
  }),
};

export default meta;

type Story = StoryObj<AndesToggle>;

/** Playground: every input is a control. */
export const Default: Story = {};

/** The default and outline variants, each unpressed, pressed and disabled. */
export const States: Story = {
  render: () => ({
    template: `
      <div style="display: flex; flex-direction: column; gap: 0.75rem; align-items: flex-start;">
        <div style="display: flex; gap: 0.75rem; align-items: center;">
          <andes-toggle aria-label="Bold">${bold}</andes-toggle>
          <andes-toggle aria-label="Bold, pressed" [pressed]="true">${bold}</andes-toggle>
          <andes-toggle aria-label="Bold, disabled" disabled>${bold}</andes-toggle>
        </div>
        <div style="display: flex; gap: 0.75rem; align-items: center;">
          <andes-toggle variant="outline" aria-label="Bold, outline">${bold}</andes-toggle>
          <andes-toggle variant="outline" aria-label="Bold, outline pressed" [pressed]="true">${bold}</andes-toggle>
          <andes-toggle variant="outline" aria-label="Bold, outline disabled" disabled>${bold}</andes-toggle>
        </div>
      </div>
    `,
  }),
};

/** Icon-only and text toggles at every size, plus an icon with text. */
export const Sizes: Story = {
  render: () => ({
    template: `
      <div style="display: flex; flex-direction: column; gap: 0.75rem; align-items: flex-start;">
        <div style="display: flex; gap: 0.75rem; align-items: center;">
          <andes-toggle size="sm" variant="outline" aria-label="Bold">${bold}</andes-toggle>
          <andes-toggle size="md" variant="outline" aria-label="Bold">${bold}</andes-toggle>
          <andes-toggle size="lg" variant="outline" aria-label="Bold">${bold}</andes-toggle>
          <andes-toggle size="sm" variant="outline">Small</andes-toggle>
          <andes-toggle size="md" variant="outline">Medium</andes-toggle>
          <andes-toggle size="lg" variant="outline">Large</andes-toggle>
        </div>
        <andes-toggle variant="outline">${italic} Italic</andes-toggle>
      </div>
    `,
  }),
};

/** A `FormControl` with `[formControl]` and `[(ngModel)]`. */
export const Binding: Story = {
  render: () => ({
    moduleMetadata: { imports: [FormsModule, ReactiveFormsModule] },
    props: { control: new FormControl(true), on: false },
    template: `
      <div style="display: flex; flex-direction: column; gap: 0.75rem; align-items: flex-start;">
        <div style="display: flex; gap: 1rem; align-items: center;">
          <andes-toggle variant="outline" aria-label="Underline" [formControl]="control">${underline}</andes-toggle>
          <span style="font-size: 0.875rem; line-height: 1.375rem;">Control value: {{ control.value }}</span>
        </div>
        <div style="display: flex; gap: 1rem; align-items: center;">
          <andes-toggle variant="outline" [(ngModel)]="on">Notifications</andes-toggle>
          <span style="font-size: 0.875rem; line-height: 1.375rem;">{{ on ? 'on' : 'off' }}</span>
        </div>
      </div>
    `,
  }),
};
