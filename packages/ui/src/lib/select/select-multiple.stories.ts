import { JsonPipe } from '@angular/common';
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
  title: 'Data Entry/Select/Multiple',
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

/**
 * `mode="multiple"`: the value is an array, rendered as removable tags, and the panel
 * stays open between picks. Search is on by default in this mode; `Backspace` in the
 * empty input removes the last tag.
 */
export const Multiple: Story = {
  render: () => ({
    moduleMetadata: { imports: SELECT_IMPORTS },
    props: { fruits: FRUITS, picked: ['apple', 'cherry'] },
    template: `
      <div style="width: 320px;">
        <andes-select aria-label="Fruit" mode="multiple" placeholder="Select fruit" allowClear
          [options]="fruits" [(value)]="picked" />
        ${note('value: {{ picked | json }}')}
      </div>
    `,
  }),
};

/**
 * Consecutive selected options join into one tinted block - rounded only at the run's
 * outer corners - so a range of picks reads as one. A run breaks at a group label or a
 * separator, not at options hidden by the search: type "p" in the third select. Hover a
 * selected option to see its stronger tint; the selected disabled "Durian" keeps its
 * place in the run.
 */
export const SelectedRuns: Story = {
  render: () => ({
    moduleMetadata: { imports: SELECT_IMPORTS },
    props: {
      fruits: FRUITS,
      run: ['apricot', 'banana', 'blueberry', 'grape', 'kiwi'],
      produce: [
        {
          label: 'Fruit',
          options: [
            { value: 'apple', label: 'Apple' },
            { value: 'banana', label: 'Banana' },
            { value: 'durian', label: 'Durian', disabled: true },
          ],
        },
        {
          label: 'Vegetables',
          options: [
            { value: 'leek', label: 'Leek' },
            { value: 'carrot', label: 'Carrot' },
          ],
        },
      ],
      grouped: ['banana', 'durian', 'leek', 'carrot'],
      searched: ['apricot', 'grape'],
    },
    template: `
      <div style="width: 320px; display: flex; flex-direction: column; gap: 1.25rem;">
        <div>
          <andes-select aria-label="Fruit run" mode="multiple" [options]="fruits" [(value)]="run" />
          ${note('Apricot to Blueberry form one block, Grape and Kiwi another.')}
        </div>
        <div>
          <andes-select aria-label="Produce run" mode="multiple" [options]="produce" [(value)]="grouped" />
          ${note('Each group keeps its own block.')}
        </div>
        <div>
          <andes-select aria-label="Searched run" mode="multiple" [options]="fruits" [(value)]="searched" />
          ${note('Type "p": Apricot and Grape, apart in the full list, join once the options between them are filtered out.')}
        </div>
      </div>
    `,
  }),
};

/**
 * Limits on a multiple select: `maxTagCount` collapses the overflow into a `+ N ...` tag
 * (with `maxTagTextLength` truncating long tags), `maxCount` caps the selection, and
 * `maxTagCount="responsive"` keeps the tags on one row and shows as many as fit - drag
 * the last container's bottom-right corner to resize it.
 */
export const TagLimits: Story = {
  render: () => ({
    moduleMetadata: { imports: SELECT_IMPORTS },
    props: {
      fruits: FRUITS,
      collapsed: ['apple', 'apricot', 'banana', 'cherry'],
      capped: ['kiwi'],
      fitted: ['apple', 'apricot', 'banana', 'blueberry', 'cherry', 'grape'],
    },
    template: `
      <div style="width: 320px; display: flex; flex-direction: column; gap: 1.25rem;">
        <div>
          <andes-select aria-label="Fruit" mode="multiple" [maxTagCount]="2" maxTagTextLength="6"
            [options]="fruits" [(value)]="collapsed" />
          ${note('maxTagCount=2, maxTagTextLength=6')}
        </div>
        <div>
          <andes-select aria-label="Fruit" mode="multiple" [maxCount]="2" placeholder="Pick up to two"
            [options]="fruits" [(value)]="capped" />
          ${note('maxCount=2 - the other options disable once two are picked')}
        </div>
        <div style="min-width: 120px; max-width: 100%; resize: horizontal; overflow: hidden; padding-bottom: 0.25rem;">
          <andes-select aria-label="Fruit" mode="multiple" maxTagCount="responsive"
            [options]="fruits" [(value)]="fitted" />
          ${note('maxTagCount="responsive" - resize the container')}
        </div>
      </div>
    `,
  }),
};

/**
 * `mode="tags"`: whatever is typed is offered as a new value, and `tokenSeparators` split
 * typed or pasted text into several (try "lime, mango,"). With `defaultActiveFirstOption`
 * off, Enter adds exactly what was typed instead of the highlighted match (type "app").
 */
export const Tags: Story = {
  render: () => ({
    moduleMetadata: { imports: SELECT_IMPORTS },
    props: {
      fruits: FRUITS,
      picked: ['apple', 'dragonfruit'],
      freeText: [] as string[],
      separators: [','],
    },
    template: `
      <div style="width: 320px; display: flex; flex-direction: column; gap: 1.25rem;">
        <div>
          <andes-select aria-label="Fruit" mode="tags" placeholder="Type and press Enter"
            [options]="fruits" [tokenSeparators]="separators" [(value)]="picked" />
          ${note('Try typing "lime, mango," - value: {{ picked | json }}')}
        </div>
        <div>
          <andes-select aria-label="Labels" mode="tags" placeholder="Type 'app' and press Enter"
            [defaultActiveFirstOption]="false" [options]="fruits" [(value)]="freeText" />
          ${note('defaultActiveFirstOption off - value: {{ freeText | json }}')}
        </div>
      </div>
    `,
  }),
};

/** `tagTemplate` renders each tag; its context carries an `onClose` callback. */
export const CustomTags: Story = {
  render: () => ({
    moduleMetadata: { imports: SELECT_IMPORTS },
    props: { fruits: FRUITS, picked: ['apple', 'cherry', 'kiwi'] },
    template: `
      <div style="width: 320px;">
        <andes-select aria-label="Fruit" mode="multiple" [options]="fruits" [(value)]="picked" [tagTemplate]="tag" />
      </div>
      <ng-template #tag let-tag let-close="onClose">
        <span style="display: inline-flex; align-items: center; gap: 0.25rem; height: 1.25rem; padding: 0 0.5rem; border-radius: 999px;
          background: var(--andes-color-primary); color: var(--andes-color-primary-foreground); font-size: 0.75rem; line-height: 1.25rem;">
          {{ tag.label }}
          <button type="button" tabindex="-1" [attr.aria-label]="'Remove ' + tag.label" (mousedown)="$event.preventDefault()"
            (click)="$event.stopPropagation(); close()"
            style="border: none; background: none; color: inherit; cursor: pointer; padding: 0;">×</button>
        </span>
      </ng-template>
    `,
  }),
};
