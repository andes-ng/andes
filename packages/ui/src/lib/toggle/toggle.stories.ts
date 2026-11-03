import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideBold, lucideItalic, lucideUnderline } from '@ng-icons/lucide';
import { type Meta, moduleMetadata, type StoryObj } from '@storybook/angular';

import { AndesToggle } from './toggle';

const bold = `<ng-icon name="lucideBold" aria-hidden="true" />`;

const italic = `<ng-icon name="lucideItalic" aria-hidden="true" />`;

const underline = `<ng-icon name="lucideUnderline" aria-hidden="true" />`;

const meta: Meta<AndesToggle> = {
  title: 'Data Entry/Toggle/Basics/Toggle',
  component: AndesToggle,
  decorators: [
    moduleMetadata({
      imports: [NgIcon],
      providers: [provideIcons({ lucideBold, lucideItalic, lucideUnderline })],
    }),
  ],
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

/**
 * Playground: every input is a control. Pressing or releasing a toggle sends out a soft ring in
 * its color and holding it down shrinks it slightly; neither plays under reduced motion.
 */
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
