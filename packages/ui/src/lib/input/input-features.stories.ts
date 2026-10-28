import { signal } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AndesButton } from '../button/button';
import { AndesInput } from './input';
import type { Meta, StoryObj } from '@storybook/angular';

const meta: Meta<AndesInput> = {
  title: 'Input/Basics/Features',
  component: AndesInput,
};

export default meta;

type Story = StoryObj<AndesInput>;

const caption =
  'font-size: 0.875rem; color: var(--andes-color-foreground); font-family: var(--andes-font-family), sans-serif;';

// Grapheme-aware helpers for the count story: an emoji or a flag counts as one character.
function graphemes(value: string): string[] {
  return Array.from(
    new Intl.Segmenter().segment(value),
    (part) => part.segment,
  );
}

export const PrefixAndSuffix: Story = {
  render: () => ({
    template: `
      <div style="display: flex; flex-direction: column; gap: 1rem; width: 20rem;">
        <andes-input placeholder="0.00">
          <span slot="prefix">$</span>
          <span slot="suffix">USD</span>
        </andes-input>
        <andes-input type="url" placeholder="andes-ng.dev">
          <span slot="prefix">https://</span>
        </andes-input>
      </div>
    `,
  }),
};

export const Addons: Story = {
  render: () => ({
    template: `
      <div style="display: flex; flex-direction: column; gap: 1rem; width: 24rem;">
        <andes-input aria-label="Website" addonBefore="https://" addonAfter=".com" placeholder="mysite" />
        <andes-input aria-label="Phone number" type="tel" placeholder="987 654 321">
          <span slot="addon-before">+51</span>
        </andes-input>
        <andes-input aria-label="Weight" placeholder="0" clearable>
          <span slot="prefix">≈</span>
          <span slot="addon-after">kg</span>
        </andes-input>
        <andes-input aria-label="Coupon" placeholder="Coupon code">
          <button slot="addon-after" type="button" style="border: 0; background: none; padding: 0 0.25rem; color: inherit; font: inherit; cursor: pointer;">Apply</button>
        </andes-input>
        <andes-input aria-label="Coupon, in error" status="error" placeholder="Coupon code">
          <button slot="addon-after" type="button" style="border: 0; background: none; padding: 0 0.25rem; color: inherit; font: inherit; cursor: pointer;">Apply</button>
        </andes-input>
        <andes-input aria-label="Website, filled" variant="filled" addonBefore="https://" placeholder="filled variant" />
        <andes-input aria-label="Website, disabled" addonBefore="https://" addonAfter=".com" disabled placeholder="disabled" />
      </div>
    `,
  }),
};

/**
 * The clear button is the same at every size and on every field: a small muted disc that
 * appears while the field is hovered or focused (always on touch screens). It is a Tab stop of
 * its own, named by `clearLabel`. `(cleared)` fires after the value is empty; `clearIcon` swaps
 * the glyph.
 */
export const ClearButton: Story = {
  render: () => ({
    moduleMetadata: { imports: [ReactiveFormsModule] },
    props: {
      smallText: signal('Small'),
      mediumText: signal('Medium'),
      largeText: signal('Large'),
      localizedText: signal('Texto'),
      customClearText: signal('Custom icon'),
      clearControl: new FormControl('Watch the event'),
      log: signal<string[]>([]),
      caption,
    },
    template: `
      <div style="display: flex; flex-direction: column; gap: 1rem; width: 20rem;">
        <andes-input aria-label="Small" size="sm" clearable [(value)]="smallText" />
        <andes-input aria-label="Medium" clearable [(value)]="mediumText" />
        <andes-input aria-label="Large" size="lg" clearable [(value)]="largeText" />
        <andes-input aria-label="Localized" clearable clearLabel="Borrar" [(value)]="localizedText" />
        <andes-input aria-label="Custom clear icon" clearable [clearIcon]="clearIconTpl" [(value)]="customClearText" />
        <andes-input aria-label="Clear event" clearable [formControl]="clearControl"
          (cleared)="log.set(log().concat('cleared - control value: &quot;' + clearControl.value + '&quot;'))" />
        @for (entry of log(); track $index) {
          <span [style]="caption">{{ entry }}</span>
        }
      </div>
      <ng-template #clearIconTpl>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10"></circle><path d="m15 9-6 6"></path><path d="m9 9 6 6"></path>
        </svg>
      </ng-template>
    `,
  }),
};

/**
 * `showCount` shows the length. `maxLength` blocks typing at the limit; `countMax` only flags the
 * field (red counter, error border, `aria-invalid`) so a longer paste is not lost.
 * `countStrategy` and `countExceedFormatter` make the count grapheme-aware, and `countFormatter`
 * changes the text.
 */
export const CharacterCount: Story = {
  render: () => ({
    props: {
      remaining: ({
        count,
        maxLength,
      }: {
        count: number;
        maxLength?: number;
      }) => `${(maxLength ?? 0) - count} characters left`,
      countGraphemes: (value: string) => graphemes(value).length,
      cutGraphemes: (value: string, { max }: { max: number }) =>
        graphemes(value).slice(0, max).join(''),
      softText: signal('A note that runs long'),
      emojiText: signal('🇵🇪👍🏽'),
      caption,
    },
    template: `
      <div style="display: flex; flex-direction: column; gap: 1rem; width: 22rem;">
        <andes-input aria-label="Nickname" showCount [maxLength]="20" placeholder="Max 20 characters" />
        <andes-input aria-label="Bio" showCount placeholder="No limit" />
        <andes-input aria-label="Tweet" showCount [maxLength]="40" [countFormatter]="remaining" placeholder="Custom formatter" />
        <andes-input aria-label="Soft limit" showCount [countMax]="12" [(value)]="softText"
          placeholder="countMax = 12, not enforced" />
        <span [style]="caption">countMax flags the field instead of blocking input.</span>
        <andes-input aria-label="Emoji-aware limit" showCount [countMax]="6"
          [countStrategy]="countGraphemes" [countExceedFormatter]="cutGraphemes" [(value)]="emojiText"
          placeholder="6 characters, emoji count as one" />
        <span [style]="caption">countStrategy counts emoji as one; countExceedFormatter trims past 6.</span>
      </div>
    `,
  }),
};

export const PressEnter: Story = {
  render: () => ({
    props: { entered: signal<string[]>([]), enterText: signal('') },
    template: `
      <div style="display: flex; flex-direction: column; gap: 0.5rem; width: 20rem;">
        <andes-input aria-label="Press Enter" placeholder="Type and press Enter" [(value)]="enterText"
          (pressEnter)="entered.set(entered().concat(enterText()))" />
        @for (entry of entered(); track $index) {
          <span style="font-size: 0.875rem; color: var(--andes-color-foreground); font-family: var(--andes-font-family), sans-serif;">Enter: "{{ entry }}"</span>
        }
      </div>
    `,
  }),
};

/**
 * Focus from code with `focus({ cursor })`, and listen to `(focused)` / `(blurred)`, which
 * re-emit the inner input's native FocusEvent.
 */
export const FocusControl: Story = {
  render: () => ({
    moduleMetadata: { imports: [AndesButton] },
    props: { focusLog: signal<string[]>([]) },
    template: `
      <div style="display: flex; flex-direction: column; gap: 0.75rem; width: 24rem;">
        <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
          <andes-button size="sm" variant="outline" (click)="focusTarget.focus({ cursor: 'start' })">Focus at start</andes-button>
          <andes-button size="sm" variant="outline" (click)="focusTarget.focus({ cursor: 'end' })">Focus at end</andes-button>
          <andes-button size="sm" variant="outline" (click)="focusTarget.focus({ cursor: 'all' })">Select all</andes-button>
          <andes-button size="sm" variant="outline" (click)="focusTarget.blur()">Blur</andes-button>
        </div>
        <andes-input #focusTarget aria-label="Focus target" value="Focus moves the caret here"
          (focused)="focusLog.set(focusLog().concat('focused'))"
          (blurred)="focusLog.set(focusLog().concat('blurred'))" />
        <span style="font-size: 0.75rem; line-height: 1.25rem; color: var(--andes-color-muted-foreground);">
          {{ focusLog().join(' → ') || 'No events yet' }}
        </span>
      </div>
    `,
  }),
};

/** Three ways to bind the value: `ngModel`, a reactive `FormControl`, or the `value` model with no Angular Forms. */
export const Binding: Story = {
  render: () => ({
    moduleMetadata: { imports: [FormsModule, ReactiveFormsModule] },
    // Bound under names distinct from AndesInput's own `value` input - Storybook forwards
    // matching story props onto it.
    props: {
      modelText: 'Bound via ngModel',
      control: new FormControl('Bound via FormControl'),
      boundText: signal('Edit me'),
      caption,
    },
    template: `
      <div style="display: flex; flex-direction: column; gap: 1rem; width: 20rem;">
        <andes-input aria-label="ngModel" [(ngModel)]="modelText" />
        <andes-input aria-label="Reactive form" [formControl]="control" />
        <andes-input aria-label="Two-way bound" [(value)]="boundText" />
        <span [style]="caption">Value: {{ boundText() }}</span>
      </div>
    `,
  }),
};
