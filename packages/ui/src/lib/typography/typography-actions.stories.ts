import { signal } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { AndesLink } from './link';
import { AndesParagraph } from './paragraph';
import { AndesText } from './text';
import { AndesTitle } from './title';

const meta: Meta<AndesText> = {
  title: 'General/Typography/Features/Actions',
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

/** The copy button, with the `(copied)` event and a custom text, label and confirmation label. */
export const Copyable: Story = {
  render: () => ({
    props: { copiedValue: signal('') },
    template: `<div style="display: flex; flex-direction: column; gap: 0.75rem;">
      <andes-text copyable (copied)="copiedValue.set($event)">F001-000123</andes-text>
      <andes-text [copyable]="{ text: 'https://example.com/invoices/F001-000123', label: 'Copy link', copiedLabel: 'Link copied' }">Share this invoice</andes-text>
      <andes-text type="secondary" size="sm">Last copied: {{ copiedValue() || 'nothing yet' }}</andes-text>
    </div>`,
  }),
};

/** The pencil opens a field with the current text. Enter or leaving the field saves, Escape cancels. It also works on titles and paragraphs (with `maxLength` and `autoSize`), and with the text trigger the text itself opens the editor (click, or Enter once focused). */
export const Editable: Story = {
  render: () => ({
    props: { name: signal('Q3 collections report'), saved: signal('') },
    template: `<div style="display: flex; flex-direction: column; gap: 1rem; max-width: 32rem;">
      <div>
        <andes-text editable [(text)]="name" (save)="saved.set($event)">Q3 collections report</andes-text>
        <andes-text type="secondary" size="sm">Saved value: {{ saved() || 'nothing yet' }}</andes-text>
      </div>
      <andes-title [level]="2" editable>Weekly cash forecast</andes-title>
      <andes-paragraph [editable]="{ maxLength: 160, autoSize: { minRows: 2, maxRows: 5 } }">Projected inflows assume customers pay on the due date. Update the figures every Monday.</andes-paragraph>
      <andes-text [editable]="{ triggerType: 'text' }">Click this text to rename it</andes-text>
    </div>`,
  }),
};

export const CopyableAndEditable: Story = {
  render: () => ({
    template: `<andes-text copyable editable [ellipsis]="true" style="width: 18rem;">Warehouse transfer WT-2026-004981</andes-text>`,
  }),
};
