import { signal } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { AndesLink } from './link';
import { AndesParagraph } from './paragraph';
import { AndesText } from './text';
import { AndesTitle } from './title';

const LONG_TEXT =
  'Invoices are issued per series and numbered sequentially. A document that was rejected by the tax authority keeps its number until it is voided or corrected, so the next one in the series carries the following number. Review rejected documents every morning before the daily summary is sent.';

const meta: Meta<AndesText> = {
  title: 'General/Typography/Features/Ellipsis',
  component: AndesText,
  decorators: [
    moduleMetadata({
      imports: [AndesTitle, AndesText, AndesParagraph, AndesLink],
    }),
  ],
  parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj<AndesText>;

/** One line cut with an ellipsis (the popup with the full text shows on hover while it is cut, and `(truncated)` reports it), a fixed number of rows, and a heading that truncates too. */
export const Ellipsis: Story = {
  render: () => ({
    props: { cut: signal(false) },
    template: `<div style="width: 24rem; display: flex; flex-direction: column; gap: 1rem;">
      <div>
        <andes-text [ellipsis]="{ tooltip: true }" (truncated)="cut.set($event)">${LONG_TEXT}</andes-text>
        <andes-text type="secondary" size="sm">{{ cut() ? 'Cut off' : 'Fits' }}</andes-text>
      </div>
      <andes-paragraph [ellipsis]="{ rows: 2, tooltip: true }">${LONG_TEXT}</andes-paragraph>
      <andes-paragraph [ellipsis]="{ rows: 3 }">${LONG_TEXT}</andes-paragraph>
      <andes-title [level]="3" [ellipsis]="{ tooltip: true }">Consolidated statement of receivables for the fiscal year</andes-title>
    </div>`,
  }),
};

/** `expanded` is a two-way value, so the toggle can be driven from outside; the labels can be replaced. */
export const Expandable: Story = {
  render: () => ({
    props: { isExpanded: signal(false) },
    template: `<div style="width: 24rem; display: flex; flex-direction: column; gap: 1rem;">
      <div>
        <andes-paragraph [ellipsis]="{ rows: 2, expandable: true }" [(expanded)]="isExpanded">${LONG_TEXT}</andes-paragraph>
        <andes-text type="secondary" size="sm">{{ isExpanded() ? 'Expanded' : 'Collapsed' }}</andes-text>
      </div>
      <andes-paragraph [ellipsis]="{ rows: 2, expandable: true, expandText: 'Show more', collapseText: 'Show less' }">${LONG_TEXT}</andes-paragraph>
    </div>`,
  }),
};
