import type { Meta, StoryObj } from '@storybook/angular';

import { AndesSelect } from './select';
import { AndesSelectContent } from './select-content';
import { AndesSelectItem } from './select-item';
import { AndesSelectTrigger } from './select-trigger';
import { AndesSelectValue } from './select-value';

const SELECT_IMPORTS = [
  AndesSelect,
  AndesSelectContent,
  AndesSelectItem,
  AndesSelectTrigger,
  AndesSelectValue,
];

const meta: Meta<AndesSelect> = {
  title: 'Data Entry/Select/Positioning',
  component: AndesSelect,
};

export default meta;

type Story = StoryObj<AndesSelect>;

const FRUITS = [
  { value: 'apple', label: 'Apple' },
  { value: 'apricot', label: 'Apricot' },
  { value: 'banana', label: 'Banana' },
];

const COUNTRIES = [
  'Argentina',
  'Bolivia',
  'Brazil',
  'Canada',
  'Chile',
  'Colombia',
  'Costa Rica',
  'Cuba',
  'Ecuador',
  'El Salvador',
  'Guatemala',
  'Honduras',
  'Mexico',
  'Nicaragua',
  'Panama',
  'Paraguay',
  'Peru',
  'Puerto Rico',
  'Uruguay',
  'Venezuela',
].map((name) => ({ value: name.toLowerCase(), label: name }));

const note = (text: string) =>
  `<p style="margin: 0.25rem 0 0; font: 0.75rem/1.25rem var(--andes-font-family), sans-serif; color: var(--andes-color-muted-foreground);">${text}</p>`;

const field = (label: string, attributes = '') => `
  <div style="display: flex; flex-direction: column; gap: 0.25rem; width: 280px;">
    <span style="font: 0.875rem/1.375rem var(--andes-font-family), sans-serif;">${label}</span>
    <andes-select aria-label="${label}" placeholder="Pick a country" [options]="countries" ${attributes} />
  </div>
`;

/**
 * Where the panel opens: `side="top"` on the content makes it open above, and the
 * `placement` shorthand (`bottomLeft`, ...) does the same in one input; `side`/`align`
 * on the content still win when set. The second select is held open at `topRight`.
 */
export const Placement: Story = {
  render: () => ({
    moduleMetadata: { imports: SELECT_IMPORTS },
    props: { fruits: FRUITS },
    template: `
      <div style="padding-top: 12rem; display: flex; justify-content: space-between; gap: 1rem; width: 420px;">
        <div style="width: 160px;">
          <andes-select aria-label="Fruit, opens above" placeholder="side=top">
            <andes-select-trigger>
              <andes-select-value />
            </andes-select-trigger>
            <andes-select-content side="top">
              <andes-select-item value="apple">Apple</andes-select-item>
              <andes-select-item value="banana">Banana</andes-select-item>
            </andes-select-content>
          </andes-select>
        </div>
        <div style="width: 160px;">
          <andes-select aria-label="Fruit, placement" placement="topRight" placeholder="topRight" [open]="true"
            [options]="fruits">
            <andes-select-content [matchTriggerWidth]="false" />
          </andes-select>
        </div>
      </div>
    `,
  }),
};

/**
 * A form taller than the screen. The panel opens below its field when the 20 options
 * fit there and flips above when they do not (the fields near the end of the form);
 * where neither side has room for all of them, it takes the larger side and is shortened
 * to fit, its options scrolling inside - it never covers its own field. With a panel
 * open, scroll the page: the panel follows its field, flipping as the room changes, and
 * closes once the field has scrolled out of sight.
 */
export const LongForm: Story = {
  name: 'Long form / near the viewport edges',
  parameters: { layout: 'fullscreen' },
  render: () => ({
    moduleMetadata: { imports: SELECT_IMPORTS },
    props: { countries: COUNTRIES },
    template: `
      <form style="display: flex; flex-direction: column; gap: 1.5rem; padding: 1rem;" (submit)="$event.preventDefault()">
        ${field('Country of birth (top of the page)')}
        ${note('Opens below: there is room for the whole list.')}
        <div style="height: 40vh;"></div>
        ${field('Country of residence (middle)')}
        <div style="height: 70vh;"></div>
        ${field('Billing country (scroll so it sits near the bottom)')}
        ${note('Near the bottom of the screen the list opens above the field instead.')}
        <div style="height: 70vh;"></div>
        ${field('Shipping country (end of the form)', 'placement="topLeft"')}
        ${note('<code>placement="topLeft"</code>: prefers above, flips below when scrolled to the top of the screen.')}
        <div style="height: 2rem;"></div>
      </form>
    `,
  }),
};

/**
 * Fields inside a scrolling container - a fixed-height card with `overflow: auto`, as in
 * a dialog body or a side panel. Open a select, then scroll the card: the panel stays
 * attached to its field (it is rendered outside the card, so the card never clips it)
 * and closes once the field is scrolled out of the card's view.
 */
export const ScrollingContainer: Story = {
  render: () => ({
    moduleMetadata: { imports: SELECT_IMPORTS },
    props: { countries: COUNTRIES },
    template: `
      <div
        role="region"
        aria-label="Scrolling card"
        tabindex="0"
        style="width: 340px; height: 260px; overflow: auto; border: 1px solid var(--andes-color-border); border-radius: 0.5rem; padding: 1rem; box-sizing: border-box;"
      >
        <div style="display: flex; flex-direction: column; gap: 1.5rem; padding-bottom: 400px;">
          ${field('Origin')}
          ${field('Destination')}
          ${field('Stopover')}
        </div>
      </div>
    `,
  }),
};

/**
 * A field laid out right to left (`dir="rtl"` on a container): the panel takes the same
 * direction and aligns with the field's own start edge, here its right edge.
 */
export const RightToLeft: Story = {
  render: () => ({
    moduleMetadata: { imports: SELECT_IMPORTS },
    props: {
      cities: [
        { value: 'cairo', label: 'القاهرة' },
        { value: 'dubai', label: 'دبي' },
        { value: 'riyadh', label: 'الرياض' },
        { value: 'amman', label: 'عمّان' },
      ],
      picked: ['dubai', 'riyadh'],
    },
    template: `
      <div dir="rtl" style="display: flex; flex-direction: column; gap: 1rem; width: 280px;">
        <andes-select aria-label="City" placeholder="اختر مدينة" [options]="cities" [matchTriggerWidth]="false" />
        <andes-select aria-label="Cities" mode="multiple" allowClear [options]="cities" [(value)]="picked" />
      </div>
    `,
  }),
};
