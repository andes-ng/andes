import { signal } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular';

import { AndesCombobox, type AndesComboboxOption } from './combobox';

const LABELS: readonly AndesComboboxOption[] = [
  'Bug',
  'Design',
  'Documentation',
  'Performance',
  'Security',
].map((label) => ({ value: label.toLowerCase(), label }));

/** Muted helper text under a story's control, readable in either theme. */
const CAPTION =
  'font-family: var(--andes-font-family), sans-serif; font-size: 0.75rem; line-height: 1.25rem; color: var(--andes-color-muted-foreground);';

const meta: Meta<AndesCombobox> = {
  title: 'Data Entry/Combobox/Create',
  component: AndesCombobox,
  decorators: [
    (story) => ({
      moduleMetadata: { imports: [AndesCombobox] },
      ...story(),
    }),
  ],
};

export default meta;

type Story = StoryObj<AndesCombobox>;

/**
 * `allowCreate`: when no option is labelled exactly what was typed, the list ends with a
 * "Create ..." option (the only one, and so highlighted, when nothing matches). Choosing it
 * emits `(optionCreate)` with the trimmed text; the handler adds the option and selects it.
 * Type "Accessibility" in either field. The second one is `multiple`, with its own
 * `createLabel`.
 */
export const CreateOption: Story = {
  render: () => {
    const labelOptions = signal<readonly AndesComboboxOption[]>(LABELS);
    const single = signal<string | null>(null);
    const several = signal<readonly string[]>(['bug']);
    const add = (text: string) => {
      const value = text.toLowerCase();
      if (!labelOptions().some((option) => option.value === value)) {
        labelOptions.set([...labelOptions(), { value, label: text }]);
      }
      return value;
    };
    return {
      props: {
        labelOptions,
        single,
        several,
        createOne: (text: string) => single.set(add(text)),
        createMany: (text: string) => several.set([...several(), add(text)]),
        caption: CAPTION,
      },
      template: `
        <div style="display: flex; flex-direction: column; gap: 0.5rem; width: 320px;">
          <andes-combobox allowCreate [options]="labelOptions()" [value]="single()" (valueChange)="single.set($event)" (optionCreate)="createOne($event)" placeholder="Pick or create a label..." aria-label="Label" />
          <span [style]="caption">value: {{ single() ?? '(none)' }}</span>
          <andes-combobox allowCreate multiple createLabel="Add the label &quot;{query}&quot;" [options]="labelOptions()" [values]="several()" (valuesChange)="several.set($event)" (optionCreate)="createMany($event)" placeholder="Labels..." aria-label="Labels" />
          <span [style]="caption">values: {{ several().join(', ') }}</span>
        </div>
      `,
    };
  },
};
