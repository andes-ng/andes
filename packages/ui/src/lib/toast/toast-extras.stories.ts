import { Component, inject, TemplateRef, viewChild } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular';

import { AndesButton } from '../button/button';
import { AndesToastService } from './toast.service';
import type { AndesToastTemplateContext } from './toast.types';
import { AndesToastViewport } from './toast-viewport';

const BAR_STYLE =
  'display: flex; gap: 0.75rem; flex-wrap: wrap; align-items: center; padding: 1rem 2rem; font-family: var(--andes-font-family), sans-serif; font-size: 0.875rem;';
const NOTE_STYLE =
  'padding: 0 2rem; font-family: var(--andes-font-family), sans-serif; color: var(--andes-color-muted-foreground); font-size: 0.875rem;';

@Component({
  selector: 'andes-toast-headless',
  imports: [AndesButton, AndesToastViewport],
  template: `
    <div [style]="barStyle">
      <andes-button variant="outline" (click)="open()"
        >Open a headless toast</andes-button
      >
    </div>
    <ng-template #custom let-toast let-close="close">
      <div style="display: flex; align-items: center; gap: 1rem; width: 100%;">
        <strong style="font-size: 1.5rem;" aria-hidden="true">12</strong>
        <span style="flex: 1;">{{ toast.message }}</span>
        <andes-button size="sm" (click)="close()">Got it</andes-button>
      </div>
    </ng-template>
    <andes-toast-viewport />
  `,
})
class HeadlessHost {
  private readonly toasts = inject(AndesToastService);
  protected readonly barStyle = BAR_STYLE;
  private readonly custom =
    viewChild.required<TemplateRef<AndesToastTemplateContext>>('custom');

  protected open(): void {
    this.toasts.show({
      message: '12 unread messages.',
      headless: this.custom(),
      duration: false,
    });
  }
}

@Component({
  selector: 'andes-toast-keyboard',
  imports: [AndesButton, AndesToastViewport],
  template: `
    <div [style]="barStyle">
      <andes-button (click)="fire()">Open three notifications</andes-button>
    </div>
    <p [style]="noteStyle">
      Press Alt+T to move focus to the newest notification: the deck expands and
      the countdown holds. Escape dismisses the focused one and gives focus
      back.
    </p>
    <andes-toast-viewport />
  `,
})
class KeyboardHost {
  private readonly toasts = inject(AndesToastService);
  protected readonly barStyle = BAR_STYLE;
  protected readonly noteStyle = NOTE_STYLE;

  protected fire(): void {
    for (let i = 1; i <= 3; i++) {
      this.toasts.info(`Build ${i} finished.`, {
        title: `Build ${i}`,
        duration: 30_000,
        showProgress: true,
      });
    }
  }
}

const meta: Meta = {
  title: 'Feedback/Toast/Examples/Extras',
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
};

export default meta;

type Story = StoryObj;

/** Headless: your template replaces the toast's whole content and keeps the card, motion and swipe. */
export const Headless: Story = {
  render: () => ({
    moduleMetadata: { imports: [HeadlessHost] },
    template: `<andes-toast-headless />`,
  }),
};

/** The viewport's hotkey focuses the newest toast, and Escape dismisses it. */
export const KeyboardHotkey: Story = {
  name: 'Keyboard hotkey',
  render: () => ({
    moduleMetadata: { imports: [KeyboardHost] },
    template: `<andes-toast-keyboard />`,
  }),
};
