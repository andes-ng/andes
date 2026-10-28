import { FormControl, ReactiveFormsModule } from '@angular/forms';
import type { Meta, StoryObj } from '@storybook/angular';

import {
  AndesTextarea,
  AndesTextareaCountInfo,
  AndesTextareaExceedFormatter,
  AndesTextareaResizeEvent,
} from './textarea';

// Counts grapheme clusters, so a family emoji or a skin-toned thumbs-up counts as one.
const countGraphemes = (value: string) =>
  [...new Intl.Segmenter().segment(value)].length;

const keepGraphemes: AndesTextareaExceedFormatter = (value, { max }) =>
  [...new Intl.Segmenter().segment(value)]
    .slice(0, max)
    .map(({ segment }) => segment)
    .join('');

const meta: Meta<AndesTextarea> = {
  title: 'Data Entry/Input/Textarea/Basics/Features',
  component: AndesTextarea,
};

export default meta;

type Story = StoryObj<AndesTextarea>;

const note =
  'font-family: var(--andes-font-family), sans-serif; font-size: 0.75rem; line-height: 1.25rem; color: var(--andes-color-muted-foreground); margin: 0.5rem 0 0;';

/**
 * Hard limit with `maxLength`, a custom `countFormatter` (and the over-the-limit state when the
 * value is set programmatically), and the soft `countMax` limit that lets you keep typing past
 * it while flagging the overflow.
 */
export const CharacterCount: Story = {
  render: () => ({
    props: {
      formatter: ({ count, maxLength }: AndesTextareaCountInfo) =>
        `${(maxLength ?? 0) - count} characters left`,
      overLimit: 'This value was set programmatically past the limit.',
      softText:
        'A soft limit lets you keep typing past it, but flags the overflow.',
    },
    template: `<div style="display: flex; flex-direction: column; gap: 1rem; width: 320px;">
      <andes-textarea showCount [maxLength]="120" [rows]="2" aria-label="Hard limit" placeholder="Up to 120 characters" />
      <andes-textarea showCount [maxLength]="80" [rows]="2" [countFormatter]="formatter" aria-label="Formatted count" placeholder="Custom count text" />
      <andes-textarea showCount [maxLength]="20" [rows]="2" [value]="overLimit" aria-label="Over the limit" />
      <andes-textarea showCount [countMax]="50" [rows]="2" [(value)]="softText" aria-label="Soft limit" />
    </div>`,
  }),
};

/**
 * Plug in your own counting: `countStrategy` with `countExceedFormatter` counts each emoji as
 * one and trims input past 10, and `countTemplate` renders the counter from a template.
 */
export const CustomCount: Story = {
  render: () => ({
    props: {
      countGraphemes,
      keepGraphemes,
      emojiText: '👨‍👩‍👧 👍🏽',
      templateText: 'Rendered with a template',
    },
    template: `<div style="display: flex; flex-direction: column; gap: 1rem; width: 320px;">
      <div>
        <andes-textarea
          showCount
          [countMax]="10"
          [countStrategy]="countGraphemes"
          [countExceedFormatter]="keepGraphemes"
          [(value)]="emojiText"
          [rows]="2"
          aria-label="Emoji-aware count"
        />
        <p style="margin: 0.5rem 0 0; font-size: 0.75rem; line-height: 1.25rem;">Each emoji counts as one; input past 10 is trimmed.</p>
      </div>
      <andes-textarea showCount [countMax]="60" [countTemplate]="countTpl" [(value)]="templateText" [rows]="2" aria-label="Templated count" />
      <ng-template #countTpl let-info>
        <strong>{{ info.count }}</strong> of {{ info.maxLength }} used
      </ng-template>
    </div>`,
  }),
};

/**
 * The clear button is the same at every size and on every field: a small muted disc on the
 * first line's inline end, shown while the field is hovered or focused (always on touch
 * screens). It is a Tab stop of its own, named by `clearLabel`; `clearIcon` swaps the glyph and
 * `(cleared)` fires after the value is empty.
 */
export const ClearButton: Story = {
  render: () => ({
    moduleMetadata: { imports: [ReactiveFormsModule] },
    props: {
      small: 'Small',
      medium: 'Medium',
      large: 'Large',
      localized: 'Texto',
      noteStyle: note,
      iconText: 'Cleared with a custom icon',
      control: new FormControl('Clear me with the × button'),
      clearedCount: 0,
    },
    template: `<div style="display: flex; flex-direction: column; gap: 1rem; width: 320px;">
      <andes-textarea size="sm" clearable [rows]="1" [(value)]="small" aria-label="Small" />
      <andes-textarea clearable [rows]="1" [(value)]="medium" aria-label="Medium" />
      <andes-textarea size="lg" clearable [rows]="1" [(value)]="large" aria-label="Large" />
      <andes-textarea clearable clearLabel="Borrar" [(value)]="localized" aria-label="Localized" />
      <andes-textarea clearable [clearIcon]="clearIcon" [(value)]="iconText" [rows]="1" aria-label="Custom icon" />
      <ng-template #clearIcon>
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm3.7 12.3-1.4 1.4L12 13.4l-2.3 2.3-1.4-1.4 2.3-2.3-2.3-2.3 1.4-1.4 2.3 2.3 2.3-2.3 1.4 1.4-2.3 2.3 2.3 2.3Z" />
        </svg>
      </ng-template>
      <div>
        <andes-textarea clearable [formControl]="control" [rows]="2" aria-label="Message" (cleared)="clearedCount = clearedCount + 1" />
        <p [style]="noteStyle">Form value: "{{ control.value }}" - cleared {{ clearedCount }}×</p>
      </div>
    </div>`,
  }),
};

/**
 * Every event the field emits, logged: `(pressEnter)` with the current value, `(focused)` /
 * `(blurred)` re-emitting the native FocusEvent, and `(resized)` with the new size while an
 * auto-sized field changes height.
 */
export const Events: Story = {
  render: () => ({
    props: {
      noteStyle: note,
      enterLog: [] as string[],
      focusLog: [] as string[],
      last: undefined as AndesTextareaResizeEvent | undefined,
    },
    template: `<div style="display: flex; flex-direction: column; gap: 1.5rem; width: 320px;">
      <div>
        <andes-textarea #ta aria-label="Press Enter" placeholder="Press Enter…" [rows]="2" (pressEnter)="enterLog = [ta.value(), ...enterLog].slice(0, 3)" />
        <p [style]="noteStyle">pressEnter fired with: {{ enterLog.length ? enterLog.join(' | ') : '—' }}</p>
      </div>
      <div>
        <andes-textarea aria-label="Focus events" placeholder="Focus me, then tab away" [rows]="2"
          (focused)="focusLog = [...focusLog, 'focused']"
          (blurred)="focusLog = [...focusLog, 'blurred']" />
        <p [style]="noteStyle">{{ focusLog.length ? focusLog.join(' → ') : 'No focus events yet' }}</p>
      </div>
      <div>
        <andes-textarea
          [autoSize]="{ minRows: 2, maxRows: 5 }"
          aria-label="Resize events"
          placeholder="Type a few lines - the height change is reported below"
          (resized)="last = $event"
        />
        <p [style]="noteStyle">resized: {{ last ? last.width + ' × ' + last.height + 'px' : '—' }}</p>
      </div>
    </div>`,
  }),
};

/** `focus({ cursor })` places the caret at the start, the end or selects everything. */
export const FocusMethods: Story = {
  render: () => ({
    template: `<div style="width: 320px;">
      <andes-textarea #ta aria-label="Message" value="Focus me from the buttons below" />
      <div style="display: flex; gap: 0.5rem; margin-top: 0.5rem;">
        <button type="button" (click)="ta.focus({ cursor: 'start' })">Start</button>
        <button type="button" (click)="ta.focus({ cursor: 'end' })">End</button>
        <button type="button" (click)="ta.focus({ cursor: 'all' })">Select all</button>
        <button type="button" (click)="ta.blur()">Blur</button>
      </div>
    </div>`,
  }),
};
