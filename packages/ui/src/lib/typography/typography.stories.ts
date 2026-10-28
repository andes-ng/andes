import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { AndesLink } from './link';
import { AndesParagraph } from './paragraph';
import { AndesText } from './text';
import { AndesTitle } from './title';

const LONG_TEXT =
  'Invoices are issued per series and numbered sequentially. A document that was rejected by the tax authority keeps its number until it is voided or corrected, so the next one in the series carries the following number. Review rejected documents every morning before the daily summary is sent.';

const meta: Meta<AndesText> = {
  title: 'General/Typography/Basics/Text',
  component: AndesText,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [AndesTitle, AndesText, AndesParagraph, AndesLink],
    }),
  ],
  parameters: { layout: 'padded' },
  argTypes: {
    type: {
      control: 'select',
      options: [
        undefined,
        'secondary',
        'success',
        'warning',
        'danger',
        'disabled',
      ],
    },
    size: { control: 'inline-radio', options: ['md', 'sm'] },
    as: {
      control: 'select',
      options: [
        undefined,
        'span',
        'p',
        'div',
        'h1',
        'h2',
        'h3',
        'h4',
        'h5',
        'h6',
      ],
    },
    disabled: { control: 'boolean' },
    strong: { control: 'boolean' },
    italic: { control: 'boolean' },
    underline: { control: 'boolean' },
    delete: { control: 'boolean' },
    mark: { control: 'boolean' },
    code: { control: 'boolean' },
    keyboard: { control: 'boolean' },
    ellipsis: { control: 'object' },
    copyable: { control: 'object' },
    editable: { control: 'object' },
    text: { control: 'text' },
    expanded: { control: 'boolean' },
    editing: { control: 'boolean' },
  },
  args: {
    size: 'md',
    disabled: false,
    strong: false,
    italic: false,
    underline: false,
    delete: false,
    mark: false,
    code: false,
    keyboard: false,
  },
  render: (args) => ({
    props: { ...args, elementTag: args.as, struck: args.delete },
    template: `<andes-text [type]="type" [size]="size" [as]="elementTag" [disabled]="disabled" [strong]="strong" [italic]="italic" [underline]="underline" [delete]="struck" [mark]="mark" [code]="code" [keyboard]="keyboard">Net amount due within 30 days</andes-text>`,
  }),
};

export default meta;
type Story = StoryObj<AndesText>;

export const Playground: Story = {};

/** The five title levels (24, 20, 18, 16 and 14px, weight 600), and `as`, which changes the element without changing the look so the document outline stays right. */
export const Titles: Story = {
  render: () => ({
    template: `
      <andes-title [level]="1">Level 1 - Financial overview</andes-title>
      <andes-title [level]="2">Level 2 - Receivables aging</andes-title>
      <andes-title [level]="3">Level 3 - Customers over 60 days</andes-title>
      <andes-title [level]="4">Level 4 - Pending follow-ups</andes-title>
      <andes-title [level]="5">Level 5 - Notes</andes-title>
      <div style="margin-top: 1.5rem;">
        <andes-title [level]="1" as="h2">Looks like level 1, is an h2</andes-title>
        <andes-title [level]="4" as="h1">Looks like level 4, is an h1</andes-title>
        <andes-title [level]="3" as="div">Looks like level 3, is a div</andes-title>
      </div>`,
  }),
};

/** Every `type`, both `size`s and the `disabled` state, which also silences the copy and edit actions and the link. */
export const Appearance: Story = {
  render: () => ({
    template: `<div style="display: flex; flex-direction: column; gap: 0.25rem;">
      <andes-text>Default text</andes-text>
      <andes-text type="secondary">Secondary text</andes-text>
      <andes-text type="success">Success text</andes-text>
      <andes-text type="warning">Warning text</andes-text>
      <andes-text type="danger">Danger text</andes-text>
      <andes-text type="disabled">Disabled text</andes-text>
      <andes-text>Body text, 14px on a 22px line</andes-text>
      <andes-text size="sm" type="secondary">Caption text, 12px on a 20px line</andes-text>
      <andes-text disabled>Disabled text</andes-text>
      <andes-text disabled copyable editable>Disabled with actions</andes-text>
      <andes-link disabled href="#">Disabled link</andes-link>
    </div>`,
  }),
};

/** Each text modifier on its own, combined, and sitting inside running text without breaking the line. */
export const Modifiers: Story = {
  render: () => ({
    template: `<div style="display: flex; flex-direction: column; gap: 0.25rem; max-width: 36rem;">
      <andes-text strong>Strong</andes-text>
      <andes-text italic>Italic</andes-text>
      <andes-text underline>Underline</andes-text>
      <andes-text delete>Delete</andes-text>
      <andes-text mark>Mark</andes-text>
      <andes-text code>Code</andes-text>
      <andes-text keyboard>Ctrl + K</andes-text>
      <andes-text strong italic underline>Strong, italic and underline together</andes-text>
      <andes-paragraph style="margin-top: 1rem;">
        Press <andes-text keyboard>Ctrl + S</andes-text> to save, or run
        <andes-text code>pnpm build</andes-text> from the project root. The total is
        <andes-text strong>S/ 1,250.00</andes-text>, previously
        <andes-text delete type="secondary">S/ 1,400.00</andes-text>, and
        <andes-text mark>needs approval</andes-text> before
        <andes-link href="#">the period closes</andes-link>.
      </andes-paragraph>
    </div>`,
  }),
};

export const Paragraphs: Story = {
  render: () => ({
    template: `<div style="max-width: 36rem;">
      <andes-title [level]="3">Closing the period</andes-title>
      <andes-paragraph>${LONG_TEXT}</andes-paragraph>
      <andes-paragraph type="secondary" size="sm">Last reviewed on 14 October by the accounting team.</andes-paragraph>
    </div>`,
  }),
};

export const Links: Story = {
  render: () => ({
    template: `<div style="display: flex; flex-direction: column; gap: 0.5rem;">
      <andes-link href="#">Open the dashboard</andes-link>
      <andes-link href="https://example.com" external>Documentation</andes-link>
      <andes-link href="#" type="danger">Delete account</andes-link>
      <andes-link disabled href="#">Not available</andes-link>
      <andes-link href="#" copyable>Copy this link text</andes-link>
      <div style="width: 14rem;"><andes-link href="#" [ellipsis]="{ tooltip: true }">A link with a very long label that gets cut</andes-link></div>
    </div>`,
  }),
};

/** A realistic page header combining the pieces. */
export const Composition: Story = {
  render: () => ({
    template: `<div style="max-width: 40rem;">
      <andes-title [level]="2" editable>Customer: Andes Logistics S.A.C.</andes-title>
      <andes-paragraph type="secondary">
        Tax id <andes-text code copyable>20512345678</andes-text> - account manager
        <andes-link href="#">Lucia Paredes</andes-link>
      </andes-paragraph>
      <andes-paragraph [ellipsis]="{ rows: 2, expandable: true }">${LONG_TEXT}</andes-paragraph>
    </div>`,
  }),
};
