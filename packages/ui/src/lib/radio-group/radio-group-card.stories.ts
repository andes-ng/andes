import type { Meta, StoryObj } from '@storybook/angular';

import { AndesRadio } from './radio';
import { AndesRadioGroup } from './radio-group';

const meta: Meta<AndesRadioGroup> = {
  title: 'Data Entry/RadioGroup/Specialized/Card',
  component: AndesRadioGroup,
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<AndesRadioGroup>;

const caption =
  'margin: 0 0 0.5rem; font-family: var(--andes-font-family), sans-serif; font-size: 0.875rem; line-height: 1.375rem; color: var(--andes-color-foreground);';

const plans = [
  {
    label: 'Starter',
    value: 'starter',
    description: 'For side projects. Up to 3 members.',
  },
  {
    label: 'Pro',
    value: 'pro',
    description: 'For teams that ship every week. Up to 20 members.',
  },
  {
    label: 'Enterprise',
    value: 'enterprise',
    description: 'Unlimited members, SSO and a dedicated contact.',
  },
];

/**
 * `variant="card"` turns every option into a bordered card: the whole card is the clickable
 * label, it lights up when checked (primary tint and border) and the focus ring surrounds
 * the card. Each card has a title and a description. Vertical, then `columns`, then with the
 * circle hidden (`[showIndicator]="false"`), where the tint and border carry the selection.
 */
export const Plans: Story = {
  render: () => ({
    moduleMetadata: { imports: [AndesRadio] },
    props: {
      catalog: plans,
      vertical: 'pro',
      grid: 'starter',
      bare: 'enterprise',
    },
    template: `
      <div style="display: flex; flex-direction: column; gap: 2rem; width: min(46rem, 100%);">
        <div>
          <p style="${caption}">Vertical</p>
          <andes-radio-group aria-label="Plan (vertical)" variant="card" [options]="catalog" [(value)]="vertical" />
        </div>
        <div>
          <p style="${caption}">columns = 3</p>
          <andes-radio-group aria-label="Plan (columns)" variant="card" [columns]="3" [options]="catalog" [(value)]="grid" />
        </div>
        <div>
          <p style="${caption}">columns = 3, no circle</p>
          <andes-radio-group aria-label="Plan (no circle)" variant="card" [columns]="3" [showIndicator]="false" [options]="catalog" [(value)]="bare" />
        </div>
      </div>
    `,
  }),
};

/**
 * Card states: a disabled option, a `status` of `error` or `warning` on the group, a
 * `readOnly` group (no hover feedback, still focusable) and the circle on the other side
 * with `labelPlacement="start"`. `optionType="button"` keeps its own look and wins over
 * `variant="card"`, so a group uses one or the other.
 */
export const States: Story = {
  render: () => ({
    moduleMetadata: { imports: [AndesRadio] },
    props: {
      catalog: plans,
      withDisabled: [
        plans[0],
        plans[1],
        {
          ...plans[2],
          disabled: true,
          description: 'Contact sales to enable.',
        },
      ],
    },
    template: `
      <div style="display: flex; flex-direction: column; gap: 2rem; width: min(46rem, 100%);">
        <div>
          <p style="${caption}">Disabled option</p>
          <andes-radio-group aria-label="Plan (disabled option)" variant="card" [columns]="3" [options]="withDisabled" value="pro" />
        </div>
        <div>
          <p style="${caption}">status = error (nothing chosen) and status = warning (chosen)</p>
          <andes-radio-group aria-label="Plan (error)" variant="card" status="error" [columns]="3" [options]="catalog" />
          <div style="height: 0.75rem;"></div>
          <andes-radio-group aria-label="Plan (warning)" variant="card" status="warning" [columns]="3" [options]="catalog" value="starter" />
        </div>
        <div>
          <p style="${caption}">readOnly, labelPlacement = start</p>
          <andes-radio-group aria-label="Plan (read-only)" variant="card" readOnly labelPlacement="start" [columns]="3" [options]="catalog" value="pro" />
        </div>
        <div>
          <p style="${caption}">variant = card with optionType = button (button wins)</p>
          <andes-radio-group aria-label="Plan (button wins)" variant="card" optionType="button" [options]="catalog" value="pro" />
        </div>
      </div>
    `,
  }),
};

/**
 * A single option can be a card inside a plain list (`variant` on the option), and an
 * `<andes-radio variant="card">` also works on its own, outside a group, with `[(checked)]`.
 */
export const Standalone: Story = {
  render: () => ({
    moduleMetadata: { imports: [AndesRadio] },
    props: {
      mixed: [
        { label: 'Pay monthly', value: 'monthly' },
        {
          label: 'Pay yearly',
          value: 'yearly',
          variant: 'card',
          description: 'Two months free, billed once a year.',
        },
      ],
      billing: 'yearly',
      agreed: true,
    },
    template: `
      <div style="display: flex; flex-direction: column; gap: 1.5rem; width: min(24rem, 100%);">
        <andes-radio-group aria-label="Billing" [options]="mixed" [(value)]="billing" />
        <andes-radio variant="card" [(checked)]="agreed">
          Use this address as default
          <span slot="description">Orders ship here unless you pick another one.</span>
        </andes-radio>
        <andes-radio variant="card" status="error">
          Standalone card with an error
          <span slot="description">Pick an address to continue.</span>
        </andes-radio>
      </div>
    `,
  }),
};

/** Cards in right-to-left, and in a narrow container: the grid collapses with the text
 *  wrapping inside each card instead of overflowing. */
export const RightToLeft: Story = {
  name: 'Right to left',
  render: () => ({
    moduleMetadata: { imports: [AndesRadio] },
    template: `
      <div dir="rtl" style="width: min(30rem, 100%);">
        <andes-radio-group aria-label="RTL cards" variant="card" [columns]="2" value="a">
          <andes-radio value="a">الخطة الأساسية<span slot="description">مناسبة للمشاريع الصغيرة والتجارب.</span></andes-radio>
          <andes-radio value="b">الخطة المتقدمة<span slot="description">للفرق التي تنشر كل أسبوع.</span></andes-radio>
        </andes-radio-group>
      </div>
    `,
  }),
};
