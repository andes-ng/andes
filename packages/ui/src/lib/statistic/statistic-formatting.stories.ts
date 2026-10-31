import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';

import { AndesStatistic } from './statistic';

const meta: Meta<AndesStatistic> = {
  title: 'Data Display/Statistic/Formatting/Numbers',
  component: AndesStatistic,
  decorators: [moduleMetadata({ imports: [AndesStatistic] })],
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<AndesStatistic>;

/**
 * Number formats side by side: fixed `precision`, a currency through `formatOptions` and
 * `locale`, and compact notation (1.5M, 48.2K).
 */
export const NumberFormats: Story = {
  render: () => ({
    props: {
      currency: { style: 'currency', currency: 'PEN' },
      compact: { notation: 'compact', maximumFractionDigits: 1 },
    },
    template: `
      <div style="display:flex; gap: 3rem; flex-wrap: wrap">
        <andes-statistic title="Average order value" [value]="1284.5" [precision]="2" />
        <andes-statistic title="Revenue" [value]="1284500.5" locale="es-PE" [formatOptions]="currency" />
        <andes-statistic title="Page views" [value]="1534000" locale="en-US" [formatOptions]="compact" />
        <andes-statistic title="Units shipped" [value]="48200" locale="en-US" [formatOptions]="compact" />
      </div>`,
  }),
};

/**
 * Locales and separators. The same value in four locales, then custom group and decimal
 * separators and grouping turned off.
 */
export const LocalesAndSeparators: Story = {
  name: 'Locales and separators',
  render: () => ({
    template: `
      <div style="display:flex; flex-direction: column; gap: 2rem">
        <div style="display:flex; gap: 3rem; flex-wrap: wrap">
          <andes-statistic title="en-US" [value]="1234567.891" locale="en-US" [precision]="2" />
          <andes-statistic title="de-DE" [value]="1234567.891" locale="de-DE" [precision]="2" />
          <andes-statistic title="fr-FR" [value]="1234567.891" locale="fr-FR" [precision]="2" />
          <andes-statistic title="es-PE" [value]="1234567.891" locale="es-PE" [precision]="2" />
        </div>
        <div style="display:flex; gap: 3rem; flex-wrap: wrap">
          <andes-statistic title="Custom separators" [value]="1234567.5" groupSeparator=" " decimalSeparator="," [precision]="2" />
          <andes-statistic title="No grouping" [value]="1234567" [grouping]="false" />
        </div>
      </div>`,
  }),
};

/**
 * Beyond plain numbers. A `formatter` function renders the value any way it needs (hours and
 * minutes here); a non-numeric string is shown as is, and a `null` value shows the empty
 * placeholder.
 */
export const CustomAndEmpty: Story = {
  name: 'Custom formatter and empty values',
  render: () => ({
    props: {
      hours: (value: string | number | bigint) => {
        const minutes = Math.round(Number(value) * 60);
        return `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, '0')}m`;
      },
    },
    template: `
      <div style="display:flex; gap: 3rem; flex-wrap: wrap">
        <andes-statistic title="Time on site" [value]="2.75" [formatter]="hours" />
        <andes-statistic title="Status" value="On track" />
        <andes-statistic title="Not computed" [value]="null" />
      </div>`,
  }),
};
