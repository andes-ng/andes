import type { Meta, StoryObj } from '@storybook/angular';

import { AndesAccordion, type AndesAccordionItemConfig } from './accordion';
import { AndesAccordionContent } from './accordion-content';
import { AndesAccordionItem } from './accordion-item';
import { AndesAccordionLazy } from './accordion-lazy';
import { AndesAccordionTrigger } from './accordion-trigger';

const PARTS = [
  AndesAccordionItem,
  AndesAccordionTrigger,
  AndesAccordionContent,
  AndesAccordionLazy,
];

const WIDTH = 'width: 28rem; max-width: 100%;';

const meta: Meta<AndesAccordion> = {
  title: 'Data Display/Accordion/Patterns/Composition',
  component: AndesAccordion,
};

export default meta;

type Story = StoryObj<AndesAccordion>;

/** Panels from data: `items` takes `key`, `label`, `content`, `extra`, `collapsible` and `disabled` per panel. */
const ITEMS: AndesAccordionItemConfig[] = [
  {
    key: 'profile',
    label: 'Profile',
    content: 'Name, avatar and bio.',
    extra: 'Complete',
  },
  {
    key: 'billing',
    label: 'Billing',
    content: 'Invoices and payment methods.',
    collapsible: 'header',
  },
  {
    key: 'danger',
    label: 'Danger zone',
    content: 'Delete the workspace.',
    disabled: true,
  },
];

export const ItemsInput: Story = {
  render: () => ({
    props: { items: ITEMS },
    template: `
      <andes-accordion bordered [items]="items" [activeKey]="['profile']" style="${WIDTH}" />
    `,
  }),
};

/** Accordions inside accordions: each keeps its own open state. */
export const Nested: Story = {
  render: () => ({
    moduleMetadata: { imports: PARTS },
    props: { outer: ['orders'], inner: [] as string[] },
    template: `
      <div style="${WIDTH} display: grid; gap: 0.75rem;">
        <andes-accordion bordered type="multiple" [(activeKey)]="outer">
          <andes-accordion-item value="orders">
            <andes-accordion-trigger>Orders</andes-accordion-trigger>
            <andes-accordion-content>
              <andes-accordion size="sm" [(activeKey)]="inner">
                <andes-accordion-item value="open">
                  <andes-accordion-trigger extra="12">Open orders</andes-accordion-trigger>
                  <andes-accordion-content>Awaiting fulfilment.</andes-accordion-content>
                </andes-accordion-item>
                <andes-accordion-item value="closed">
                  <andes-accordion-trigger extra="48">Closed orders</andes-accordion-trigger>
                  <andes-accordion-content>Shipped and invoiced.</andes-accordion-content>
                </andes-accordion-item>
              </andes-accordion>
            </andes-accordion-content>
          </andes-accordion-item>
          <andes-accordion-item value="customers">
            <andes-accordion-trigger>Customers</andes-accordion-trigger>
            <andes-accordion-content>Each accordion keeps its own open state.</andes-accordion-content>
          </andes-accordion-item>
        </andes-accordion>
        <p style="margin: 0; font-family: var(--andes-font-family), sans-serif; font-size: 0.875rem; color: var(--andes-color-muted-foreground);">
          outer: [{{ outer.join(', ') }}] - inner: [{{ inner.join(', ') }}]
        </p>
      </div>
    `,
  }),
};

/** Per-item `class`/`style` turn the panels into cards, with a custom rotating caret at the start. */
const CARD_STYLE =
  'margin-bottom: 0.75rem; padding-inline: var(--andes-space-4); border: none; border-radius: var(--andes-radius-lg); background-color: var(--andes-color-muted);';

const CARD_ITEMS: AndesAccordionItemConfig[] = [
  {
    key: 'shipping',
    label: 'Shipping address',
    content: 'Warehouse 3, North Industrial Park.',
    style: CARD_STYLE,
  },
  {
    key: 'payment',
    label: 'Payment terms',
    content: 'Net 30, invoiced at the end of each month.',
    style: CARD_STYLE,
  },
  {
    key: 'notes',
    label: 'Internal notes',
    content: 'Prefers deliveries before noon.',
    style: CARD_STYLE,
  },
];

export const CustomPanels: Story = {
  render: () => ({
    props: { items: CARD_ITEMS },
    template: `
      <ng-template #caret let-active>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"
             [style.transform]="active ? 'rotate(90deg)' : null"
             style="transition: transform 0.2s ease;">
          <path d="M8 5l10 7-10 7z" />
        </svg>
      </ng-template>
      <andes-accordion
        ghost
        expandIconPosition="start"
        [expandIcon]="caret"
        [items]="items"
        [activeKey]="['shipping']"
        style="${WIDTH}"
      />
    `,
  }),
};
