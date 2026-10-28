import { signal } from '@angular/core';

import { AndesInputOtp } from './input-otp';
import type { Meta, StoryObj } from '@storybook/angular';

const meta: Meta<AndesInputOtp> = {
  title: 'Data Entry/Input/Specialized/OTP',
  component: AndesInputOtp,
};

export default meta;

type Story = StoryObj<AndesInputOtp>;

const caption =
  'font-size: 0.875rem; color: var(--andes-color-foreground); font-family: var(--andes-font-family), sans-serif;';

/** One cell per character, with paste support, masking, a formatter and `(complete)` once every cell is filled. Separators take a string, a function of the cell index or a template. */
export const OTP: Story = {
  render: () => ({
    props: {
      otpCode: signal(''),
      completedCode: signal(''),
      digitsOnly: (text: string) => text.replace(/\D/g, ''),
      middleDash: (index: number) => (index === 2 ? '–' : ''),
      otpCells: signal<string[]>([]),
      caption,
    },
    template: `
      <div style="display: flex; flex-direction: column; gap: 1rem;">
        <andes-input-otp aria-label="Verification code" inputMode="numeric" [formatter]="digitsOnly"
          [(value)]="otpCode" (complete)="completedCode.set($event)" />
        <span [style]="caption">Value: "{{ otpCode() }}" · Completed: "{{ completedCode() }}"</span>
        <andes-input-otp aria-label="Masked code" [length]="4" mask />
        <andes-input-otp aria-label="Code with separator" [length]="6" separator="-" variant="filled" size="sm" />
        <andes-input-otp aria-label="Invalid code" [length]="4" status="error" variant="underlined" size="lg" />
        <andes-input-otp aria-label="Disabled code" [length]="4" disabled />
        <andes-input-otp aria-label="Code, grouped in threes" [separator]="middleDash"
          (cellsChange)="otpCells.set($event)" />
        <span [style]="caption">cellsChange: [{{ otpCells().map(c => c || '·').join(' ') }}]</span>
        <andes-input-otp aria-label="Code, dotted" [length]="4" [separator]="dotSeparator" mask="✱" />
      </div>
      <ng-template #dotSeparator>
        <span style="display: block; width: 0.375rem; height: 0.375rem; border-radius: 999px; background: var(--andes-color-muted-foreground);"></span>
      </ng-template>
    `,
  }),
};
