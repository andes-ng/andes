import { NgTemplateOutlet } from '@angular/common';
import { signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { Meta, StoryObj } from '@storybook/angular';

import { AndesButton } from '../button/button';
import {
  AndesCombobox,
  type AndesComboboxOption,
  type AndesComboboxOptionEntry,
} from './combobox';
import { AndesComboboxContent } from './combobox-content';
import { AndesComboboxEmpty } from './combobox-empty';
import { AndesComboboxInput } from './combobox-input';
import { AndesComboboxItem } from './combobox-item';

const FRUITS = [
  'Apple',
  'Apricot',
  'Banana',
  'Blueberry',
  'Cherry',
  'Cranberry',
  'Grape',
  'Kiwi',
  'Lemon',
  'Mango',
  'Orange',
  'Peach',
  'Pineapple',
  'Strawberry',
];

const FRUIT_OPTIONS: readonly AndesComboboxOption[] = FRUITS.map((fruit) => ({
  value: fruit.toLowerCase(),
  label: fruit,
}));

const GROUPED_OPTIONS: readonly AndesComboboxOptionEntry[] = [
  {
    label: 'Fruit',
    options: [
      { value: 'apple', label: 'Apple' },
      { value: 'banana', label: 'Banana' },
      { value: 'cherry', label: 'Cherry' },
    ],
  },
  {
    label: 'Vegetables',
    options: [
      { value: 'carrot', label: 'Carrot' },
      { value: 'lettuce', label: 'Lettuce', disabled: true },
      { value: 'pea', label: 'Pea' },
    ],
  },
  {
    label: 'Grains',
    options: [
      { value: 'oats', label: 'Oats' },
      { value: 'rice', label: 'Rice' },
    ],
  },
];

/** Muted helper text under a story's control, readable in either theme. */
const CAPTION =
  'font-family: var(--andes-font-family), sans-serif; font-size: 0.75rem; line-height: 1.25rem; color: var(--andes-color-muted-foreground);';

/** A column of labelled examples, e.g. one per size or variant. */
const STACK = 'display: flex; flex-direction: column; gap: 1rem; width: 260px;';

const meta: Meta<AndesCombobox> = {
  title: 'Data Entry/Combobox/Basics/Field',
  component: AndesCombobox,
  tags: ['autodocs'],
  decorators: [
    (story) => ({
      moduleMetadata: {
        imports: [
          AndesCombobox,
          AndesComboboxInput,
          AndesComboboxContent,
          AndesComboboxItem,
          AndesComboboxEmpty,
          AndesButton,
          FormsModule,
          NgTemplateOutlet,
        ],
      },
      ...story(),
    }),
  ],
  argTypes: {
    disabled: { control: 'boolean' },
    readOnly: { control: 'boolean' },
    autoHighlight: { control: 'boolean' },
    allowClear: { control: 'boolean' },
    backfill: { control: 'boolean' },
    loading: { control: 'boolean' },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    variant: {
      control: 'select',
      options: ['outlined', 'filled', 'borderless', 'underlined'],
    },
    status: { control: 'select', options: [undefined, 'error', 'warning'] },
    placement: {
      control: 'select',
      options: ['bottom-start', 'bottom-end', 'top-start', 'top-end'],
    },
  },
  args: {
    disabled: false,
    readOnly: false,
    autoHighlight: true,
    allowClear: false,
    backfill: false,
    loading: false,
    size: 'md',
    variant: 'outlined',
    status: undefined,
    placement: 'bottom-start',
  },
  render: (args) => ({
    props: { ...args, items: FRUITS },
    template: `
      <andes-combobox #combobox [items]="items" [disabled]="disabled" [readOnly]="readOnly" [autoHighlight]="autoHighlight" [allowClear]="allowClear" [backfill]="backfill" [loading]="loading" [size]="size" [variant]="variant" [status]="status" [placement]="placement" style="width: 260px; display: inline-block;">
        <input andesComboboxInput placeholder="Search fruit..." style="width: 100%;" />
        <div andesComboboxContent>
          @for (item of combobox.filteredItems(); track item) {
            <div andesComboboxItem [value]="item">{{ item }}</div>
          } @empty {
            <div andesComboboxEmpty>No results found.</div>
          }
        </div>
      </andes-combobox>
    `,
  }),
};

export default meta;

type Story = StoryObj<AndesCombobox>;

export const Default: Story = {};

/**
 * Data-driven mode: pass `[options]` (`{ value, label }` objects) and the component
 * renders the input, the popup and every option itself. The model holds the option's
 * `value`; the input shows its `label`. `{ label, options }` entries render as labelled
 * `role="group"` sections (the second field; "Lettuce" is disabled).
 */
export const Options: Story = {
  render: () => ({
    props: {
      fruitOptions: FRUIT_OPTIONS,
      groupedOptions: GROUPED_OPTIONS,
      picked: null,
      caption: CAPTION,
      stack: STACK,
    },
    template: `
      <div [style]="stack">
        <andes-combobox [options]="fruitOptions" [(ngModel)]="picked" placeholder="Search fruit..." aria-label="Fruit" />
        <span [style]="caption">Value: {{ picked ?? '(none)' }}</span>
        <andes-combobox [options]="groupedOptions" placeholder="Search produce..." aria-label="Produce" />
      </div>
    `,
  }),
};

/**
 * `ngModel` on the compound mode: the first field starts empty, the second one starts
 * with "Banana" and shows the trailing check the selected suggestion carries, as
 * `AndesSelect` does.
 */
export const Binding: Story = {
  render: () => ({
    props: { fruitItems: FRUITS, picked: null, preset: 'Banana' },
    template: `
      <div style="display: flex; flex-direction: column; gap: 0.5rem; width: 260px;">
        <andes-combobox #empty [items]="fruitItems" [(ngModel)]="picked">
          <input andesComboboxInput placeholder="Search fruit..." aria-label="Fruit" style="width: 100%;" />
          <div andesComboboxContent>
            @for (item of empty.filteredItems(); track item) {
              <div andesComboboxItem [value]="item">{{ item }}</div>
            } @empty {
              <div andesComboboxEmpty>No results found.</div>
            }
          </div>
        </andes-combobox>
        <span>Selected: {{ picked ?? '(none)' }}</span>
        <andes-combobox #filled [items]="fruitItems" [(ngModel)]="preset">
          <input andesComboboxInput placeholder="Search fruit..." aria-label="Fruit with a value" style="width: 100%;" />
          <div andesComboboxContent>
            @for (item of filled.filteredItems(); track item) {
              <div andesComboboxItem [value]="item">{{ item }}</div>
            } @empty {
              <div andesComboboxEmpty>No results found.</div>
            }
          </div>
        </andes-combobox>
      </div>
    `,
  }),
};

/**
 * The resting states in the compound mode: `disabled`, `readOnly` and `aria-invalid`.
 * (They are also available as controls on the playground.)
 */
export const States: Story = {
  render: () => ({
    props: { fruitItems: FRUITS, stack: STACK },
    template: `
      <div [style]="stack">
        <andes-combobox #disabled [items]="fruitItems" disabled>
          <input andesComboboxInput placeholder="Disabled" aria-label="Disabled" style="width: 100%;" />
          <div andesComboboxContent>
            @for (item of disabled.filteredItems(); track item) {
              <div andesComboboxItem [value]="item">{{ item }}</div>
            }
          </div>
        </andes-combobox>
        <andes-combobox #readonly [items]="fruitItems" readOnly>
          <input andesComboboxInput placeholder="Read only" aria-label="Read only" style="width: 100%;" />
          <div andesComboboxContent>
            @for (item of readonly.filteredItems(); track item) {
              <div andesComboboxItem [value]="item">{{ item }}</div>
            }
          </div>
        </andes-combobox>
        <andes-combobox #invalid [items]="fruitItems" aria-invalid="true">
          <input andesComboboxInput placeholder="Invalid" aria-label="Invalid" style="width: 100%;" />
          <div andesComboboxContent>
            @for (item of invalid.filteredItems(); track item) {
              <div andesComboboxItem [value]="item">{{ item }}</div>
            } @empty {
              <div andesComboboxEmpty>No results found.</div>
            }
          </div>
        </andes-combobox>
      </div>
    `,
  }),
};

export const Sizes: Story = {
  render: () => ({
    props: { fruitOptions: FRUIT_OPTIONS, stack: STACK },
    template: `
      <div [style]="stack">
        <andes-combobox [options]="fruitOptions" size="sm" placeholder="Small" aria-label="Small" allowClear />
        <andes-combobox [options]="fruitOptions" size="md" placeholder="Medium" aria-label="Medium" allowClear />
        <andes-combobox [options]="fruitOptions" size="lg" placeholder="Large" aria-label="Large" allowClear />
      </div>
    `,
  }),
};

export const Variants: Story = {
  render: () => ({
    props: { fruitOptions: FRUIT_OPTIONS, stack: STACK },
    template: `
      <div [style]="stack">
        <andes-combobox [options]="fruitOptions" variant="outlined" placeholder="Outlined" aria-label="Outlined" />
        <andes-combobox [options]="fruitOptions" variant="filled" placeholder="Filled" aria-label="Filled" />
        <andes-combobox [options]="fruitOptions" variant="borderless" placeholder="Borderless" aria-label="Borderless" />
        <andes-combobox [options]="fruitOptions" variant="underlined" placeholder="Underlined" aria-label="Underlined" />
      </div>
    `,
  }),
};

/** `status="error"` also sets `aria-invalid`; `warning` is visual only. */
export const Status: Story = {
  render: () => ({
    props: { fruitOptions: FRUIT_OPTIONS, stack: STACK },
    template: `
      <div [style]="stack">
        <andes-combobox [options]="fruitOptions" status="error" placeholder="Error" aria-label="Error" />
        <andes-combobox [options]="fruitOptions" status="warning" placeholder="Warning" aria-label="Warning" />
        <andes-combobox [options]="fruitOptions" status="error" variant="filled" placeholder="Error, filled" aria-label="Error, filled" />
        <andes-combobox [options]="fruitOptions" status="warning" variant="underlined" placeholder="Warning, underlined" aria-label="Warning, underlined" />
      </div>
    `,
  }),
};

/**
 * The clear button is the same at every size and on every field: a small muted disc that
 * appears while the field is hovered or focused (always on touch screens). It is a Tab stop
 * of its own, named by `clearLabel`.
 */
export const AllowClear: Story = {
  render: () => ({
    props: { fruitOptions: FRUIT_OPTIONS, picked: 'mango', localized: 'apple' },
    template: `
      <div style="display: flex; flex-direction: column; gap: 1rem; width: 260px;">
        <andes-combobox [options]="fruitOptions" [(ngModel)]="picked" allowClear placeholder="Search fruit..." aria-label="Fruit" />
        <andes-combobox [options]="fruitOptions" [(ngModel)]="localized" allowClear clearLabel="Borrar" placeholder="Buscar fruta..." aria-label="Fruta" />
      </div>
    `,
  }),
};

/** `autoFocus` focuses (and so opens) the field on render; `maxLength` caps the text. */
export const AutoFocusAndMaxLength: Story = {
  render: () => ({
    props: { fruitOptions: FRUIT_OPTIONS },
    template: `
      <andes-combobox [options]="fruitOptions" autoFocus [maxLength]="6" placeholder="At most 6 characters" aria-label="Fruit" style="width: 260px; display: inline-block;" />
    `,
  }),
};

/**
 * `(inputFocus)`, `(inputBlur)` and `(inputKeydown)` relay the input's own events;
 * `(focused)` / `(blurred)` carry the same focus events under the name every other field uses.
 */
export const InputEvents: Story = {
  render: () => {
    const log = signal<string[]>([]);
    const push = (entry: string) => log.set([entry, ...log()].slice(0, 6));
    return {
      props: { fruitOptions: FRUIT_OPTIONS, log, push, caption: CAPTION },
      template: `
        <div style="display: flex; flex-direction: column; gap: 0.5rem; width: 260px;">
          <andes-combobox [options]="fruitOptions" placeholder="Focus, type, leave..." aria-label="Fruit" (inputFocus)="push('inputFocus')" (focused)="push('focused')" (inputBlur)="push('inputBlur')" (blurred)="push('blurred')" (inputKeydown)="push('keydown: ' + $event.key)" />
          @for (entry of log(); track $index) {
            <span [style]="caption">{{ entry }}</span>
          }
        </div>
      `,
    };
  },
};

/**
 * Native forms and labels: `id` lands on the input, so a `<label for>` names it; `required`
 * sets the native constraint and `aria-required`; `name` submits the value through a
 * hidden input (here the submitted entries are listed below the form).
 */
export const NativeForm: Story = {
  render: () => {
    const submitted = signal('');
    const submit = (event: SubmitEvent) => {
      event.preventDefault();
      const data = new FormData(event.target as HTMLFormElement);
      submitted.set(
        [...data.entries()].map(([key, entry]) => `${key}=${entry}`).join('&'),
      );
    };
    return {
      props: {
        fruitOptions: FRUIT_OPTIONS,
        submitted,
        submit,
        caption: CAPTION,
      },
      template: `
        <form style="display: flex; flex-direction: column; gap: 0.5rem; width: 260px; font-family: var(--andes-font-family), sans-serif;" (submit)="submit($event)">
          <label for="story-fruit-field" style="font-size: 0.875rem;">Favourite fruit</label>
          <andes-combobox id="story-fruit-field" name="fruit" required [options]="fruitOptions" placeholder="Search fruit..." />
          <label for="story-fruits-field" style="font-size: 0.875rem;">Also likes</label>
          <andes-combobox id="story-fruits-field" name="also" multiple [options]="fruitOptions" placeholder="Pick fruit..." />
          <andes-button type="submit" size="sm">Submit</andes-button>
          <span [style]="caption">Submitted: {{ submitted() || '(nothing yet)' }}</span>
        </form>
      `,
    };
  },
};
