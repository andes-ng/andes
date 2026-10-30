import { JsonPipe } from '@angular/common';
import { signal } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular';

import { AndesSelect } from './select';
import { AndesSelectContent } from './select-content';
import { AndesSelectGroup } from './select-group';
import { AndesSelectItem } from './select-item';
import { AndesSelectLabel } from './select-label';
import { AndesSelectSeparator } from './select-separator';
import { AndesSelectTrigger } from './select-trigger';
import { AndesSelectValue } from './select-value';

const SELECT_IMPORTS = [
  JsonPipe,
  AndesSelect,
  AndesSelectContent,
  AndesSelectGroup,
  AndesSelectItem,
  AndesSelectLabel,
  AndesSelectSeparator,
  AndesSelectTrigger,
  AndesSelectValue,
];

const meta: Meta<AndesSelect> = {
  title: 'Data Entry/Select/Patterns',
  component: AndesSelect,
};

export default meta;

type Story = StoryObj<AndesSelect>;

const FRUITS = [
  { value: 'apple', label: 'Apple' },
  { value: 'apricot', label: 'Apricot' },
  { value: 'banana', label: 'Banana' },
  { value: 'blueberry', label: 'Blueberry' },
  { value: 'cherry', label: 'Cherry' },
  { value: 'durian', label: 'Durian', disabled: true },
  { value: 'grape', label: 'Grape' },
  { value: 'kiwi', label: 'Kiwi' },
];

const note = (text: string) =>
  `<p style="margin: 0.5rem 0 0; font: 0.75rem/1.25rem var(--andes-font-family), sans-serif; color: var(--andes-color-muted-foreground);">${text}</p>`;

/** `[(open)]` controls the panel from outside; `openChange` reports every transition. */
export const ControlledOpen: Story = {
  render: () => ({
    moduleMetadata: { imports: SELECT_IMPORTS },
    props: { fruits: FRUITS.slice(0, 4), panelOpen: false },
    template: `
      <div style="width: 260px; display: flex; flex-direction: column; gap: 0.5rem;">
        <button type="button" (click)="panelOpen = !panelOpen"
          style="align-self: flex-start; font: 0.875rem var(--andes-font-family), sans-serif;">
          {{ panelOpen ? 'Close' : 'Open' }} from outside
        </button>
        <andes-select aria-label="Fruit" placeholder="Controlled" [options]="fruits" [(open)]="panelOpen" />
        ${note('open: {{ panelOpen }}')}
      </div>
    `,
  }),
};

/**
 * `focused`/`blurred` fire as focus enters and leaves the select as a whole (moving into
 * the panel does not count), and `activeOptionChange` follows the keyboard cursor.
 */
export const FocusAndActiveEvents: Story = {
  render: () => {
    const log = signal<string[]>([]);
    const push = (entry: string) =>
      log.update((entries) => [entry, ...entries].slice(0, 6));
    return {
      moduleMetadata: { imports: SELECT_IMPORTS },
      props: { fruits: FRUITS, log, push },
      template: `
        <div style="width: 260px;">
          <andes-select aria-label="Fruit" [options]="fruits" (focused)="push('focused')" (blurred)="push('blurred')"
            (activeOptionChange)="push('active: ' + $event)" />
          ${note('{{ log().join(" · ") || "Focus the select and use the arrow keys" }}')}
        </div>
      `,
    };
  },
};

/** `loading` with an open, empty panel: the spinner stands in for the options. */
export const Loading: Story = {
  render: () => ({
    moduleMetadata: { imports: SELECT_IMPORTS },
    template: `
      <div style="width: 260px;">
        <andes-select aria-label="Fruit" placeholder="Loading options" loading [options]="[]" [open]="true" />
      </div>
    `,
  }),
};

/** `panelScroll` loads the next page as the list nears its end; `loading` shows meanwhile. */
export const InfiniteScroll: Story = {
  render: () => {
    const page = (start: number) =>
      Array.from({ length: 20 }, (_, index) => ({
        value: start + index,
        label: `Invoice #${String(start + index + 1).padStart(4, '0')}`,
      }));
    const invoices = signal(page(0));
    const fetching = signal(false);
    return {
      moduleMetadata: { imports: SELECT_IMPORTS },
      props: {
        invoices,
        fetching,
        onScroll(event: Event) {
          const list = event.target as HTMLElement;
          const nearEnd =
            list.scrollTop + list.clientHeight >= list.scrollHeight - 24;
          if (!nearEnd || fetching() || invoices().length >= 100) {
            return;
          }
          fetching.set(true);
          setTimeout(() => {
            invoices.update((current) => [...current, ...page(current.length)]);
            fetching.set(false);
          }, 600);
        },
      },
      template: `
        <div style="width: 260px;">
          <andes-select aria-label="Invoice" placeholder="Scroll to load more" [options]="invoices()" [loading]="fetching()"
            (panelScroll)="onScroll($event)" />
          ${note('{{ invoices().length }} of 100 loaded')}
        </div>
      `,
    };
  },
};

/**
 * The keyboard, on a 40-option list. On the field: `ArrowDown`, `Enter` or `Space` open
 * on the selected option (else the first), `ArrowUp` on the selected option (else the
 * last), `Home`/`End` on the first/last, and typing a letter opens on the first match.
 * In the list: the arrows move one option, `PageDown`/`PageUp` one panel height,
 * `Home`/`End` to the ends, letters jump by typeahead, `Enter`/`Space` pick, `Tab` and
 * `Escape` close. Opened with the pointer, no option is highlighted until the pointer
 * moves over one or a key is pressed - the first arrow key then highlights the option
 * already active instead of skipping past it.
 */
export const Keyboard: Story = {
  render: () => ({
    moduleMetadata: { imports: SELECT_IMPORTS },
    props: {
      rooms: Array.from({ length: 40 }, (_, index) => ({
        value: 101 + index,
        label: `Room ${101 + index}`,
        disabled: index % 9 === 4,
      })),
    },
    template: `
      <div style="width: 260px;">
        <andes-select aria-label="Room" placeholder="Pick a room" [options]="rooms" />
        ${note('Every ninth room, from 105, is disabled and skipped.')}
      </div>
    `,
  }),
};

/**
 * Outside Angular forms: with `name`, the select posts its value with a native `<form>`
 * (one hidden input per value), and `autoFocus` focuses it once rendered. Submit to see
 * what the form would send.
 */
export const NativeForm: Story = {
  render: () => {
    const sent = signal('');
    return {
      moduleMetadata: { imports: SELECT_IMPORTS },
      props: {
        fruits: FRUITS,
        sent,
        submit(event: SubmitEvent) {
          event.preventDefault();
          const data = new FormData(event.target as HTMLFormElement);
          sent.set(
            [...data.entries()]
              .map(([key, value]) => `${key}=${String(value)}`)
              .join('&'),
          );
        },
      },
      template: `
        <form style="width: 260px; display: flex; flex-direction: column; gap: 0.75rem;" (submit)="submit($event)">
          <andes-select aria-label="Favourite fruit" name="favourite" autoFocus value="banana" [options]="fruits" />
          <andes-select aria-label="Basket" name="basket" mode="multiple" [value]="['apple', 'kiwi']" [options]="fruits" />
          <button type="submit" style="align-self: flex-start; font: 0.875rem var(--andes-font-family), sans-serif;">
            Submit
          </button>
          ${note('{{ sent() || "Nothing sent yet" }}')}
        </form>
      `,
    };
  },
};
