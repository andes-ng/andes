import { signal } from '@angular/core';

import { AndesInputPassword } from './input-password';
import type { Meta, StoryObj } from '@storybook/angular';

const meta: Meta<AndesInputPassword> = {
  title: 'Data Entry/Input/Specialized/Password',
  component: AndesInputPassword,
};

export default meta;

type Story = StoryObj<AndesInputPassword>;

const caption =
  'font-size: 0.875rem; color: var(--andes-color-foreground); font-family: var(--andes-font-family), sans-serif;';

/** The visibility toggle is on by default, can be controlled with `[(visible)]`, turned off, or given its own content. */
export const Password: Story = {
  render: () => ({
    props: {
      passwordVisible: signal(false),
      toggleLog: signal<boolean[]>([]),
      caption,
    },
    template: `
      <div style="display: flex; flex-direction: column; gap: 1rem; width: 20rem;">
        <andes-input-password aria-label="Password" placeholder="Password" autocomplete="current-password" />
        <andes-input-password aria-label="Password, controlled" placeholder="Controlled visibility" [(visible)]="passwordVisible" />
        <span [style]="caption">Visible: {{ passwordVisible() }}</span>
        <andes-input-password aria-label="Password, no toggle" placeholder="visibilityToggle = false" [visibilityToggle]="false" />
        <andes-input-password aria-label="Password, disabled" placeholder="Disabled" disabled />
        <andes-input-password aria-label="Password, text toggle" placeholder="Custom toggle content"
          [visibilityIcon]="toggleText" (visibleChange)="toggleLog.set(toggleLog().concat($event))" />
        <andes-input-password aria-label="Password, toggle out of Tab order" placeholder="Toggle skipped by Tab"
          [visibilityToggleTabIndex]="-1" />
        <span [style]="caption">visibleChange: {{ toggleLog().join(', ') }}</span>
      </div>
      <ng-template #toggleText let-visible>
        <span style="font-size: 0.75rem; font-weight: 500;">{{ visible ? 'Hide' : 'Show' }}</span>
      </ng-template>
    `,
  }),
};
