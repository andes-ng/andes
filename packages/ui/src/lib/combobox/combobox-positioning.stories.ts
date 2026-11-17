import type { Meta, StoryObj } from '@storybook/angular';

import { AndesCombobox, type AndesComboboxOption } from './combobox';

const meta: Meta<AndesCombobox> = {
  title: 'Data Entry/Combobox/Positioning',
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

const COUNTRIES: readonly AndesComboboxOption[] = [
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
    <andes-combobox aria-label="${label}" placeholder="Search country..." [options]="countries" ${attributes} />
  </div>
`;

/**
 * A form taller than the screen. The popup opens below its field when the 20 countries fit
 * there and flips above when they do not (the fields near the end of the form); where
 * neither side has room for all of them, it takes the larger side and is shortened to fit,
 * its options scrolling inside - it never covers its own field. With a popup open, scroll
 * the page: the popup follows its field, flipping as the room changes, and closes once the
 * field has scrolled out of sight.
 */
export const LongForm: Story = {
  name: 'Long form / near the viewport edges',
  parameters: { layout: 'fullscreen' },
  render: () => ({
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
        ${field('Shipping country (end of the form)', 'placement="top-start"')}
        ${note('<code>placement="top-start"</code>: prefers above, flips below when scrolled to the top of the screen.')}
        <div style="height: 2rem;"></div>
      </form>
    `,
  }),
};

/**
 * Fields inside a scrolling container - a fixed-height card with `overflow: auto`, as in a
 * dialog body or a side panel. Open a popup, then scroll the card: the popup stays attached
 * to its field (it is rendered outside the card, so the card never clips it) and closes
 * once the field is scrolled out of the card's view.
 */
export const ScrollingContainer: Story = {
  render: () => ({
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
          ${field('Stopover', 'multiple')}
        </div>
      </div>
    `,
  }),
};

/**
 * A field laid out right to left (`dir="rtl"` on a container): the popup takes the same
 * direction and `start` alignment means the field's own start edge, here its right edge
 * (the second field's popup is a fixed 320px, so the alignment shows).
 */
export const RightToLeft: Story = {
  render: () => ({
    props: {
      cities: [
        { value: 'cairo', label: 'القاهرة' },
        { value: 'dubai', label: 'دبي' },
        { value: 'riyadh', label: 'الرياض' },
        { value: 'amman', label: 'عمّان' },
      ],
      chosen: ['dubai', 'riyadh'],
    },
    template: `
      <div dir="rtl" style="display: flex; flex-direction: column; gap: 1rem; width: 280px;">
        <andes-combobox aria-label="City" placeholder="ابحث عن مدينة" [options]="cities" allowClear />
        <andes-combobox aria-label="City, wide popup" placeholder="ابحث عن مدينة" [options]="cities" [popupMatchSelectWidth]="320" />
        <andes-combobox aria-label="Cities" multiple allowClear [options]="cities" [(values)]="chosen" />
      </div>
    `,
  }),
};
