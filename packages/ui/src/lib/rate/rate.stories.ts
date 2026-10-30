import { signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { moduleMetadata } from '@storybook/angular';
import type { Meta, StoryObj } from '@storybook/angular';

import { AndesRate } from './rate';
import { AndesRateCharacter } from './rate-character';

const meta: Meta<AndesRate> = {
  title: 'Data Entry/Rate',
  component: AndesRate,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({ imports: [AndesRateCharacter, ReactiveFormsModule] }),
  ],
  parameters: { layout: 'padded' },
  argTypes: {
    value: { control: { type: 'number', min: 0, max: 10, step: 0.5 } },
    count: { control: 'number' },
    allowHalf: { control: 'boolean' },
    allowClear: { control: 'boolean' },
    readonly: { control: 'boolean' },
    disabled: { control: 'boolean' },
    size: { control: 'text' },
    color: { control: 'color' },
    colors: { control: 'object' },
    emptyColor: { control: 'color' },
    status: {
      control: 'inline-radio',
      options: [undefined, 'error', 'warning'],
    },
    name: { control: 'text' },
    required: { control: 'boolean' },
    autoFocus: { control: 'boolean' },
    tooltips: { control: 'object' },
  },
  args: {
    value: 3,
    count: 5,
    allowHalf: false,
    allowClear: true,
    readonly: false,
    disabled: false,
    size: 'md',
    tooltips: [],
  },
  render: (args) => ({
    props: args,
    template: `<andes-rate [value]="value" [count]="count" [allowHalf]="allowHalf" [allowClear]="allowClear" [readonly]="readonly" [disabled]="disabled" [size]="size" [color]="color" [colors]="colors" [emptyColor]="emptyColor" [status]="status" [name]="name" [required]="required" [tooltips]="tooltips" aria-label="Rating" />`,
  }),
};

export default meta;
type Story = StoryObj<AndesRate>;

const surface =
  'font: 14px/22px var(--andes-font-family, system-ui), sans-serif; color: var(--andes-color-foreground);';
const col = `${surface} display: grid; gap: 1rem; justify-items: start;`;
const caption =
  'font-size: 12px; line-height: 20px; color: var(--andes-color-muted-foreground);';

/** Playground: every input is a control. */
export const Playground: Story = {};

export const Values: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Click, hover to preview, or use the keyboard: arrows move by one, Home and End jump to 0 and the last character, a digit key sets that number. `allowHalf` lets the arrows move by half; `count` changes the number of characters.',
      },
    },
  },
  render: () => ({
    props: { score: signal(3), half: signal(2.5), tenScale: signal(7) },
    template: `
      <div style="${col}">
        <div>
          <andes-rate [(value)]="score" aria-label="Rate this order" />
          <span style="${caption}">Selected: {{ score() }}</span>
        </div>
        <div>
          <andes-rate [(value)]="half" allowHalf aria-label="Rate this order, in halves" />
          <span style="${caption}">Selected: {{ half() }} (arrows move by half)</span>
        </div>
        <div>
          <andes-rate [(value)]="tenScale" [count]="10" aria-label="Likelihood to recommend" />
          <span style="${caption}">{{ tenScale() }} / 10</span>
        </div>
      </div>`,
  }),
};

export const AllowClear: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'By default, clicking the character that already matches the value clears the rating. Turn it off to keep the choice.',
      },
    },
  },
  render: () => ({
    props: { a: signal(3), b: signal(3) },
    template: `
      <div style="${col}">
        <div><andes-rate [(value)]="a" aria-label="Clearable" /> <span style="${caption}">clears on a second click</span></div>
        <div><andes-rate [(value)]="b" [allowClear]="false" aria-label="Not clearable" /> <span style="${caption}">stays selected</span></div>
      </div>`,
  }),
};

export const ReadonlyAndDisabled: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Read-only shows any value with partial fill: 3.7 fills 70% of the fourth character. It stays focusable and reads "3.7 of 5". A disabled rating is not focusable and cannot be changed.',
      },
    },
  },
  render: () => ({
    template: `
      <div style="${col}">
        <div style="display: flex; align-items: center; gap: 0.5rem;"><andes-rate [value]="4.5" readonly aria-label="Average rating" /> <span>4.5</span></div>
        <div style="display: flex; align-items: center; gap: 0.5rem;"><andes-rate [value]="3.7" readonly aria-label="Average rating" /> <span>3.7</span></div>
        <div style="display: flex; align-items: center; gap: 0.5rem;"><andes-rate [value]="1.2" readonly aria-label="Average rating" /> <span>1.2</span></div>
        <andes-rate [value]="3" disabled aria-label="Rating (unavailable)" />
      </div>`,
  }),
};

export const Sizes: Story = {
  render: () => ({
    template: `
      <div style="${col}">
        <andes-rate [value]="3" size="sm" aria-label="Small" />
        <andes-rate [value]="3" size="md" aria-label="Medium" />
        <andes-rate [value]="3" size="lg" aria-label="Large" />
        <andes-rate [value]="3" [size]="40" aria-label="40 pixels" />
      </div>`,
  }),
};

export const Tooltips: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'One text per character: shown in a bubble on hover and focus, and used as the value read by screen readers.',
      },
    },
  },
  render: () => ({
    props: {
      score: signal(3),
      labels: ['Terrible', 'Bad', 'Fair', 'Good', 'Excellent'],
    },
    template: `
      <div style="${col}; padding-top: 2rem;">
        <andes-rate [(value)]="score" [tooltips]="labels" aria-label="Rate the service" />
        <span style="${caption}">{{ score() ? labels[score() - 1] : 'No rating yet' }}</span>
      </div>`,
  }),
};

export const Colors: Story = {
  parameters: {
    docs: {
      description: {
        story:
          '`color` sets one filled colour. `colors` picks it from the highlighted value instead: an array has one colour per character position, a function receives the value; hovering previews the colour of the value under the pointer. `emptyColor` (or `--andes-rate-empty-color`) recolours the unfilled characters, for surfaces where the default grey disappears.',
      },
    },
  },
  render: () => ({
    props: {
      mood: signal(2),
      grade: signal(4),
      scale: ['#dc2626', '#ea580c', '#ca8a04', '#65a30d', '#16a34a'],
      byValue: (value: number) =>
        value <= 2
          ? 'var(--andes-color-danger)'
          : value < 4
            ? 'var(--andes-color-warning)'
            : 'var(--andes-color-success)',
    },
    template: `
      <div style="${col}">
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <andes-rate [value]="4" color="var(--andes-color-danger)" aria-label="Single colour" />
          <span style="${caption}">color</span>
        </div>
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <andes-rate [(value)]="mood" [colors]="scale" aria-label="Mood" />
          <span style="${caption}">colors (one per position): {{ mood() }}</span>
        </div>
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <andes-rate [(value)]="grade" [colors]="byValue" allowHalf aria-label="Grade" />
          <span style="${caption}">colors (function of the value): {{ grade() }}</span>
        </div>
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <andes-rate [value]="4.3" readonly style="--andes-rate-color: var(--andes-color-primary);" aria-label="Primary" />
          <span style="${caption}">--andes-rate-color</span>
        </div>
        <div style="background: #0f172a; color: #e2e8f0; padding: 1rem 1.25rem; border-radius: 8px; display: grid; gap: 0.75rem; justify-items: start;">
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <andes-rate [value]="3" emptyColor="#475569" size="lg" aria-label="Rating on a dark surface" />
            <span style="font-size: 12px;">emptyColor on a dark surface</span>
          </div>
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <andes-rate [value]="3.5" readonly emptyColor="#475569" [colors]="scale" size="lg" aria-label="Average on a dark surface" />
            <span style="font-size: 12px;">3.5, read-only, colours by value</span>
          </div>
        </div>
      </div>`,
  }),
};

export const CustomCharacter: Story = {
  parameters: {
    docs: {
      description: {
        story:
          '`character` takes text, a function of the position, or a template; the `andesRateCharacter` template child does the same declaratively.',
      },
    },
  },
  render: () => ({
    props: {
      letters: (index: number) => 'ABCDE'[index],
    },
    template: `
      <div style="${col}">
        <andes-rate [value]="3" character="♥" size="lg" color="var(--andes-color-danger)" aria-label="Hearts" />
        <andes-rate [value]="3" [character]="letters" size="lg" aria-label="Grades" />
        <andes-rate [value]="2" size="lg" aria-label="Numbers">
          <ng-template andesRateCharacter let-index>{{ index + 1 }}</ng-template>
        </andes-rate>
        <andes-rate [value]="3" size="lg" aria-label="Thumbs">
          <ng-template andesRateCharacter let-filled="filled">
            <svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" [attr.fill]="filled ? 'currentColor' : 'none'" aria-hidden="true">
              <path d="M7 10v11M15 5.9 14 10h5.8a2 2 0 0 1 1.9 2.5l-1.7 7a2 2 0 0 1-1.9 1.5H7V10l4-8a3 3 0 0 1 4 3.9Z" />
            </svg>
          </ng-template>
        </andes-rate>
      </div>`,
  }),
};

/** `(hoverChange)` reports the previewed value while the pointer moves over the characters. */
export const HoverEvents: Story = {
  render: () => ({
    props: { hover: signal<number | undefined>(undefined), score: signal(0) },
    template: `
      <div style="${col}">
        <andes-rate [(value)]="score" allowHalf (hoverChange)="hover.set($event)" aria-label="Rate" />
        <span style="${caption}">Hovering: {{ hover() ?? 'nothing' }} - selected: {{ score() }}</span>
      </div>`,
  }),
};

export const ReactiveForm: Story = {
  render: () => ({
    props: { control: new FormControl(4) },
    template: `
      <div style="${col}">
        <andes-rate [formControl]="control" aria-label="Satisfaction" />
        <span style="${caption}">Control value: {{ control.value }} - touched: {{ control.touched }}</span>
        <button type="button" style="font: inherit; padding: 0 12px; height: 32px; border-radius: var(--andes-radius-md, 8px); border: 1px solid var(--andes-color-input); background: var(--andes-color-background); color: inherit; cursor: pointer;" (click)="control.disabled ? control.enable() : control.disable()">Toggle disabled</button>
      </div>`,
  }),
};

export const Fractional: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'A read-only (or disabled) rate paints any value between 0 and `count` proportionally: 4.3 fills 30% of the fifth character, whatever the character is (the star, text, or a template) and in the reading direction. The slider still reports the real value (`aria-valuenow="4.3"`). An interactive rate keeps whole steps (half with `allowHalf`): it draws the nearest one, so it never shows a value the pointer cannot pick.',
      },
    },
  },
  render: () => ({
    props: {
      averages: [
        { label: 'Hotel Aurora', value: 4.3, reviews: 1284 },
        { label: 'Cafe Norte', value: 3.7, reviews: 312 },
        { label: 'Taller Sur', value: 2.1, reviews: 47 },
      ],
    },
    template: `
      <div style="${col}">
        @for (item of averages; track item.label) {
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <span style="min-inline-size: 7rem; font-weight: 500;">{{ item.label }}</span>
            <andes-rate [value]="item.value" readonly [aria-label]="item.label + ' average rating'" />
            <span>{{ item.value }}</span>
            <span style="${caption}">({{ item.reviews }} reviews)</span>
          </div>
        }
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <andes-rate [value]="2.6" readonly character="♥" size="lg" color="var(--andes-color-danger)" aria-label="Hearts, 2.6" />
          <span style="${caption}">text character, 2.6</span>
        </div>
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <andes-rate [value]="3.4" disabled aria-label="Disabled, 3.4" />
          <span style="${caption}">disabled, 3.4</span>
        </div>
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <andes-rate [value]="3.7" aria-label="Interactive, 3.7" />
          <span style="${caption}">interactive 3.7 draws 4 whole stars</span>
        </div>
        <div dir="rtl" style="display: flex; align-items: center; gap: 0.5rem;">
          <span style="min-inline-size: 7rem; font-weight: 500;">فندق الأمل</span>
          <andes-rate [value]="4.3" readonly aria-label="متوسط التقييم" />
          <span>4.3</span>
          <span style="${caption}">(1284 تقييم)</span>
        </div>
      </div>`,
  }),
};

export const StatusAndForm: Story = {
  name: 'Status and form',
  parameters: {
    docs: {
      description: {
        story:
          '`status` tints the empty characters and rings the row with the danger or warning colour; `error` is also announced with `aria-invalid`. `name` adds a hidden input so the value travels in a native form post; `required` makes a value of 0 an Angular forms error (`{ required: true }`) and shows as `data-required` (the slider role has no `aria-required`).',
      },
    },
  },
  render: () => ({
    props: {
      scoreControl: new FormControl(0, { nonNullable: true }),
      posted: signal<string>('nothing posted yet'),
      send: (event: Event) => {
        event.preventDefault();
        const data = new FormData(event.target as HTMLFormElement);
        return `score=${String(data.get('score') ?? '')}&comment=${String(data.get('comment') ?? '')}`;
      },
    },
    template: `
      <div style="${col}">
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <andes-rate [value]="2" status="error" aria-label="Error" />
          <span style="${caption}">error (aria-invalid)</span>
        </div>
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <andes-rate [value]="2" status="warning" aria-label="Warning" />
          <span style="${caption}">warning</span>
        </div>
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <andes-rate [value]="0" status="error" aria-label="Error, empty" />
          <span style="${caption}">error, nothing rated</span>
        </div>
        <form style="display: grid; gap: 0.75rem; justify-items: start;" (submit)="posted.set(send($event))">
          <label id="story-rate-label" style="font-weight: 500;">Your rating (required)</label>
          <andes-rate
            [formControl]="scoreControl"
            name="score"
            required
            [status]="scoreControl.invalid && scoreControl.touched ? 'error' : undefined"
            aria-labelledby="story-rate-label"
          />
          @if (scoreControl.invalid && scoreControl.touched) {
            <span style="font-size: 12px; line-height: 20px; color: var(--andes-color-danger);">Pick at least one star.</span>
          }
          <input name="comment" placeholder="Comment" style="font: inherit; height: 32px; padding: 0 8px; border-radius: 6px; border: 1px solid var(--andes-color-input); background: var(--andes-color-background); color: inherit;" />
          <button type="submit" style="font: inherit; padding: 0 12px; height: 32px; border-radius: var(--andes-radius-md, 8px); border: 1px solid var(--andes-color-input); background: var(--andes-color-background); color: inherit; cursor: pointer;" (click)="scoreControl.markAsTouched()">Send</button>
          <span style="${caption}">Form post: {{ posted() }} - control: {{ scoreControl.valid ? 'valid' : 'invalid (required)' }}</span>
        </form>
      </div>`,
  }),
};

export const Focus: Story = {
  parameters: {
    docs: {
      description: {
        story:
          '`autoFocus` focuses the rate once, right after it renders in the browser (never on the server); it is read once, like the HTML `autofocus` attribute. `focus()` and `blur()` are public methods for the same job from code. A disabled rate takes no focus.',
      },
    },
  },
  render: () => ({
    props: { mounted: signal(false), focusedNow: signal(false) },
    template: `
      <div style="${col}">
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <andes-rate #target [value]="3" (focused)="focusedNow.set(true)" (blurred)="focusedNow.set(false)" aria-label="Rate programmatically" />
          <button type="button" style="font: inherit; padding: 0 12px; height: 32px; border-radius: var(--andes-radius-md, 8px); border: 1px solid var(--andes-color-input); background: var(--andes-color-background); color: inherit; cursor: pointer;" (click)="target.focus()">focus()</button>
          <button type="button" style="font: inherit; padding: 0 12px; height: 32px; border-radius: var(--andes-radius-md, 8px); border: 1px solid var(--andes-color-input); background: var(--andes-color-background); color: inherit; cursor: pointer;" (click)="target.blur()">blur()</button>
          <span style="${caption}">{{ focusedNow() ? 'focused' : 'not focused' }}</span>
        </div>
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <button type="button" style="font: inherit; padding: 0 12px; height: 32px; border-radius: var(--andes-radius-md, 8px); border: 1px solid var(--andes-color-input); background: var(--andes-color-background); color: inherit; cursor: pointer;" (click)="mounted.set(!mounted())">{{ mounted() ? 'Remove' : 'Mount' }} a rate with autoFocus</button>
          @if (mounted()) {
            <andes-rate [value]="2" autoFocus aria-label="Focused on mount" />
          }
        </div>
      </div>`,
  }),
};

export const RightToLeft: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'In a right-to-left layout the fill starts from the right, a half character is the right half, and Left / Right swap.',
      },
    },
  },
  render: () => ({
    template: `
      <div dir="rtl" style="${col}">
        <andes-rate [value]="2.5" allowHalf aria-label="التقييم" />
        <andes-rate [value]="3.7" readonly aria-label="المتوسط" />
      </div>`,
  }),
};
