import { Component, DestroyRef, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import type { Meta, StoryObj } from '@storybook/angular';

import { AndesMentions, type AndesMentionsSearchEvent } from './mentions';
import type { AndesMentionOption } from './mentions-context';

const PEOPLE: AndesMentionOption[] = [
  { value: 'ana.torres', label: 'Ana Torres', data: 'Finance' },
  { value: 'andres.vega', label: 'Andres Vega', data: 'Procurement' },
  {
    value: 'luis.rojas',
    label: 'Luis Rojas',
    data: 'Warehouse',
    disabled: true,
  },
  { value: 'maria.soto', label: 'Maria Soto', data: 'Finance' },
  { value: 'marco.diaz', label: 'Marco Diaz', data: 'Sales' },
  { value: 'sofia.paz', label: 'Sofia Paz', data: 'Legal' },
];

const TOPICS: AndesMentionOption[] = [
  { value: 'urgent' },
  { value: 'billing' },
  { value: 'approval' },
  { value: 'shipping' },
];

const CAPTION =
  'font-family: var(--andes-font-family), sans-serif; font-size: 0.75rem; line-height: 1.25rem; color: var(--andes-color-muted-foreground);';

/** Server-side filtering: the field asks, the "server" answers a moment later. */
@Component({
  selector: 'andes-story-async-mentions',
  imports: [AndesMentions],
  template: `
    <div style="width: 26rem;">
      <andes-mentions
        [options]="results()"
        [filterOption]="false"
        [loading]="loading()"
        placeholder="Type @ and a name - results come from a pretend server"
        aria-label="Comment"
        (searched)="search($event)"
      />
      <p style="${CAPTION}">Searches sent: {{ requests() }}</p>
    </div>
  `,
})
class StoryAsyncMentions {
  protected readonly results = signal<AndesMentionOption[]>([]);
  protected readonly loading = signal(false);
  protected readonly requests = signal(0);
  private timer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.timer));
  }

  protected search(event: AndesMentionsSearchEvent): void {
    clearTimeout(this.timer);
    this.requests.update((count) => count + 1);
    this.loading.set(true);
    this.timer = setTimeout(() => {
      const query = event.query.toLowerCase();
      this.results.set(
        PEOPLE.filter((person) =>
          (person.label ?? person.value).toLowerCase().includes(query),
        ),
      );
      this.loading.set(false);
    }, 700);
  }
}

@Component({
  selector: 'andes-story-reactive-mentions',
  imports: [AndesMentions, ReactiveFormsModule],
  template: `
    <div style="width: 26rem;">
      <label
        for="story-comment"
        style="display: block; margin-bottom: 0.25rem; font-family: var(--andes-font-family), sans-serif; font-size: 0.875rem; font-weight: 500; line-height: 1.375rem; color: var(--andes-color-foreground);"
        >Comment</label
      >
      <andes-mentions
        id="story-comment"
        [formControl]="comment"
        [options]="people"
        [maxLength]="120"
        [showCount]="true"
        [status]="comment.invalid && comment.touched ? 'error' : undefined"
        placeholder="Required. Mention a colleague with @"
      />
      <p style="${CAPTION}">
        Value: {{ comment.value || '(empty)' }} &middot;
        {{ comment.valid ? 'valid' : 'invalid' }}
      </p>
      <button
        type="button"
        (click)="comment.reset('')"
        style="font: inherit; padding: 0.125rem 0.5rem;"
      >
        Reset
      </button>
    </div>
  `,
})
class StoryReactiveMentions {
  protected readonly people = PEOPLE;
  protected readonly comment = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required],
  });
}

const meta: Meta<AndesMentions> = {
  title: 'Data Entry/Mentions',
  component: AndesMentions,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A text field that suggests values while you type after a trigger character. The list opens at the caret and filters as you type; Arrow keys move through it, Enter or Tab pick, Escape closes it, and focus never leaves the field. The value is the plain text, mentions included.',
      },
    },
  },
  argTypes: {
    type: { control: 'inline-radio', options: ['textarea', 'input'] },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    variant: {
      control: 'select',
      options: ['outlined', 'filled', 'borderless', 'underlined'],
    },
    status: { control: 'select', options: [undefined, 'error', 'warning'] },
    placement: { control: 'inline-radio', options: ['bottom', 'top'] },
    prefix: { control: 'object' },
    split: { control: 'text' },
    disabled: { control: 'boolean' },
    readonly: { control: 'boolean' },
    loading: { control: 'boolean' },
    showCount: { control: 'boolean' },
    maxLength: { control: 'number' },
    rows: { control: 'number' },
    autoSize: { control: 'boolean' },
    placeholder: { control: 'text' },
    notFoundContent: { control: 'text' },
  },
  args: {
    type: 'textarea',
    size: 'md',
    variant: 'outlined',
    status: undefined,
    placement: 'bottom',
    prefix: ['@'],
    split: ' ',
    disabled: false,
    readonly: false,
    loading: false,
    showCount: false,
    maxLength: undefined,
    rows: 3,
    autoSize: false,
    placeholder: 'Type @ to mention someone',
    notFoundContent: 'No matches found',
  },
  render: (args) => ({
    props: { ...args, people: PEOPLE },
    template: `
      <div style="width: 26rem; padding-bottom: 14rem;">
        <andes-mentions
          [options]="people"
          [type]="type"
          [size]="size"
          [variant]="variant"
          [status]="status"
          [placement]="placement"
          [prefix]="prefix"
          [split]="split"
          [disabled]="disabled"
          [readonly]="readonly"
          [loading]="loading"
          [showCount]="showCount"
          [maxLength]="maxLength"
          [rows]="rows"
          [autoSize]="autoSize"
          [placeholder]="placeholder"
          [notFoundContent]="notFoundContent"
          aria-label="Comment"
        />
      </div>
    `,
  }),
};

export default meta;

type Story = StoryObj<AndesMentions>;

/** Type `@` and a few letters of a name. */
export const Default: Story = {};

/**
 * Field types and limits: `type="input"` gives a single line instead of a text area; a
 * counter with `maxLength` (a pick that would pass the limit is refused); and `autoSize`,
 * where the field grows with its text between `minRows` and `maxRows`.
 */
export const Field: Story = {
  render: () => ({
    props: { people: PEOPLE, grow: { minRows: 2, maxRows: 6 } },
    template: `
      <div style="display: flex; flex-direction: column; gap: 1rem; width: 26rem; padding-bottom: 14rem;">
        <andes-mentions type="input" [options]="people" placeholder="Reply to @" aria-label="Reply" />
        <andes-mentions [options]="people" showCount [maxLength]="60" [rows]="2" placeholder="At most 60 characters" aria-label="Short note" />
        <andes-mentions [options]="people" [autoSize]="grow" [rows]="2" placeholder="Grows between 2 and 6 rows" aria-label="Long note" />
      </div>
    `,
  }),
};

/**
 * Triggers and what follows a pick. Several triggers, each with its own list: `@` for
 * people, `#` for topics. `split` is what follows a picked value: a comma and a space in
 * the second field, nothing in the third. `validateSearch` decides when a search ends; in
 * the last field, names with a space are still searched.
 */
export const Triggers: Story = {
  render: () => ({
    props: {
      people: PEOPLE,
      triggers: ['@', '#'],
      triggerOptions: { '@': PEOPLE, '#': TOPICS },
      allowSpaces: (query: string) =>
        query.length < 24 && !query.includes('\n'),
    },
    template: `
      <div style="display: flex; flex-direction: column; gap: 1rem; width: 26rem; padding-bottom: 14rem;">
        <andes-mentions [prefix]="triggers" [options]="triggerOptions" placeholder="Try @ana and #urgent" aria-label="Message" />
        <andes-mentions type="input" split=", " [options]="people" placeholder="split = ', '" aria-label="Recipients" />
        <andes-mentions type="input" split="" [options]="people" placeholder="split = ''" aria-label="Notes" />
        <andes-mentions [options]="people" [validateSearch]="allowSpaces" placeholder="Type @maria s - the search keeps going after a space" aria-label="Comment" />
      </div>
    `,
  }),
};

/** Server-side filtering: turn the local filter off, watch `searched`, show `loading`. */
export const AsyncSearch: Story = {
  render: () => ({
    moduleMetadata: { imports: [StoryAsyncMentions] },
    template: `<div style="padding-bottom: 14rem;"><andes-story-async-mentions /></div>`,
  }),
};

/** A custom row: initials, name and team, with the typed text in the template context. */
export const CustomOption: Story = {
  render: () => ({
    props: { people: PEOPLE },
    template: `
      <div style="width: 26rem; padding-bottom: 14rem;">
        <andes-mentions [options]="people" [optionTemplate]="row" aria-label="Comment" placeholder="Type @" />
        <ng-template #row let-option>
          <span style="display: flex; flex: 1; align-items: center; gap: 0.5rem;">
            <span style="display: inline-flex; width: 1.5rem; height: 1.5rem; align-items: center; justify-content: center; border-radius: 9999px; background: var(--andes-color-muted); font-size: 0.75rem; font-weight: 600;" aria-hidden="true">{{ option.label.charAt(0) }}</span>
            <span style="flex: 1;">{{ option.label }}</span>
            <span style="font-size: 0.75rem; color: var(--andes-color-muted-foreground);">{{ option.data }}</span>
          </span>
        </ng-template>
      </div>
    `,
  }),
};

/** Same sizes as the other fields: 24, 32 and 40px, with 14px text (16px at large). */
export const Sizes: Story = {
  render: () => ({
    props: { people: PEOPLE },
    template: `
      <div style="display: flex; flex-direction: column; gap: 1rem; width: 26rem; padding-bottom: 12rem;">
        <andes-mentions type="input" size="sm" [options]="people" placeholder="Small" aria-label="Small" />
        <andes-mentions type="input" size="md" [options]="people" placeholder="Medium" aria-label="Medium" />
        <andes-mentions type="input" size="lg" [options]="people" placeholder="Large" aria-label="Large" />
      </div>
    `,
  }),
};

export const Variants: Story = {
  render: () => ({
    props: { people: PEOPLE },
    template: `
      <div style="display: flex; flex-direction: column; gap: 1rem; width: 26rem; padding-bottom: 12rem;">
        <andes-mentions variant="outlined" [rows]="1" [options]="people" placeholder="Outlined" aria-label="Outlined" />
        <andes-mentions variant="filled" [rows]="1" [options]="people" placeholder="Filled" aria-label="Filled" />
        <andes-mentions variant="borderless" [rows]="1" [options]="people" placeholder="Borderless" aria-label="Borderless" />
        <andes-mentions variant="underlined" [rows]="1" [options]="people" placeholder="Underlined" aria-label="Underlined" />
      </div>
    `,
  }),
};

/** `status` as an error or a warning, `disabled` and `readonly`. */
export const States: Story = {
  render: () => ({
    props: { people: PEOPLE },
    template: `
      <div style="display: flex; flex-direction: column; gap: 1rem; width: 26rem; padding-bottom: 12rem;">
        <andes-mentions status="error" [rows]="1" [options]="people" value="Something is wrong here" aria-label="Error" />
        <andes-mentions status="warning" [rows]="1" [options]="people" value="Check this before sending" aria-label="Warning" />
        <andes-mentions [disabled]="true" [rows]="1" [options]="people" value="Disabled, @ana.torres" aria-label="Disabled" />
        <andes-mentions [readonly]="true" [rows]="1" [options]="people" value="Read-only, @ana.torres" aria-label="Read-only" />
      </div>
    `,
  }),
};

/** `placement="top"` opens the list above the line; it flips by itself when there is no room. */
export const TopPlacement: Story = {
  render: () => ({
    props: { people: PEOPLE },
    template: `
      <div style="width: 26rem; padding-top: 12rem;">
        <andes-mentions placement="top" [options]="people" placeholder="Type @" aria-label="Comment" />
      </div>
    `,
  }),
};

/** With reactive forms: `formControl`, validation and a counter. */
export const WithForms: Story = {
  render: () => ({
    moduleMetadata: { imports: [StoryReactiveMentions] },
    template: `<div style="padding-bottom: 14rem;"><andes-story-reactive-mentions /></div>`,
  }),
};

/** Right-to-left: the list opens at the start edge of the mention. */
export const RightToLeft: Story = {
  render: () => ({
    props: {
      rtlOptions: [
        { value: 'ahmed', label: 'أحمد' },
        { value: 'sara', label: 'سارة' },
      ],
    },
    template: `
      <div dir="rtl" style="width: 26rem; padding-bottom: 10rem;">
        <andes-mentions [options]="rtlOptions" placeholder="اكتب @" aria-label="تعليق" />
      </div>
    `,
  }),
};
