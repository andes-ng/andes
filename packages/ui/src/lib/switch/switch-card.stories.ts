import type { Meta, StoryObj } from '@storybook/angular';

import { AndesSwitch } from './switch';

const meta: Meta<AndesSwitch> = {
  title: 'Data Entry/Switch/Specialized/Card',
  component: AndesSwitch,
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<AndesSwitch>;

const caption =
  'margin: 0 0 0.5rem; font-family: var(--andes-font-family), sans-serif; font-size: 0.875rem; line-height: 1.375rem; color: var(--andes-color-foreground);';

/**
 * `variant="card"` as a settings list: each row is a bordered card that is the clickable label,
 * with the title and description on one side and the switch on the other.
 * `labelPosition="start"` (below) reads title first and puts the switch at the far end; the
 * default puts the switch first. Hover tints the border, keyboard focus rings the card, and an
 * on row lights up with the primary tint.
 */
export const SettingsRows: Story = {
  render: () => ({
    props: { push: true, mail: false, sms: true, dark: false },
    template: `
      <div style="display: flex; flex-direction: column; gap: 2rem; width: min(34rem, 100%);">
        <div>
          <p style="${caption}">labelPosition="start": the switch at the far end</p>
          <div style="display: flex; flex-direction: column; gap: 0.5rem;">
            <andes-switch variant="card" labelPosition="start" [(checked)]="push">
              Push notifications
              <span slot="description">Alerts on this device when someone mentions you.</span>
            </andes-switch>
            <andes-switch variant="card" labelPosition="start" [(checked)]="mail">
              Email digest
              <span slot="description">A weekly summary of what you missed, every Monday morning.</span>
            </andes-switch>
            <andes-switch variant="card" labelPosition="start" [(checked)]="sms">
              Text messages
              <span slot="description">Only for sign-in codes and urgent security notices.</span>
            </andes-switch>
          </div>
        </div>
        <div>
          <p style="${caption}">Default: the switch first</p>
          <andes-switch variant="card" [(checked)]="dark">
            Dark appearance
            <span slot="description">Follows the system setting unless you turn this on.</span>
          </andes-switch>
        </div>
      </div>
    `,
  }),
};

/**
 * Card states and sizes: disabled, read-only (no hover feedback, still focusable), `loading`,
 * the `error` and `warning` statuses (the border and the focus ring follow the status color),
 * the three sizes, a card without a description, a long text wrapping inside its column, and
 * right-to-left. Press and hold anywhere on a card: the inner thumb stretches just like a bare
 * switch (mirrored in right-to-left), except on the disabled, read-only and loading ones.
 */
export const StatesAndSizes: Story = {
  render: () => ({
    template: `
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(18rem, 1fr)); gap: 0.75rem; max-width: 60rem;">
        <andes-switch variant="card" labelPosition="start" disabled [checked]="true">
          Disabled
          <span slot="description">Locked by your administrator.</span>
        </andes-switch>
        <andes-switch variant="card" labelPosition="start" readonly [checked]="true">
          Read-only
          <span slot="description">Visible but not changeable.</span>
        </andes-switch>
        <andes-switch variant="card" labelPosition="start" loading>
          Loading
          <span slot="description">Saving your choice.</span>
        </andes-switch>
        <andes-switch variant="card" labelPosition="start" status="error">
          Accept the terms
          <span slot="description">Required to continue.</span>
        </andes-switch>
        <andes-switch variant="card" labelPosition="start" status="warning" [checked]="true">
          Share usage data
          <span slot="description">Recommended, but optional.</span>
        </andes-switch>
        <andes-switch variant="card" labelPosition="start" size="sm">
          Small
          <span slot="description">Tighter padding, smaller track.</span>
        </andes-switch>
        <andes-switch variant="card" labelPosition="start" size="lg" [checked]="true">
          Large
          <span slot="description">Roomier padding, taller track.</span>
        </andes-switch>
        <andes-switch variant="card" labelPosition="start">Title only, no description</andes-switch>
        <andes-switch variant="card" labelPosition="start">
          A much longer title that has to wrap inside its own column without pushing the switch away
          <span slot="description">The description wraps with it and stays aligned with the title.</span>
        </andes-switch>
        <div dir="rtl">
          <andes-switch variant="card" labelPosition="start" [checked]="true">
            الإشعارات
            <span slot="description">وصف قصير تحت التسمية</span>
          </andes-switch>
        </div>
        <div dir="rtl">
          <andes-switch variant="card">
            الوضع الداكن
            <span slot="description">وصف قصير تحت التسمية</span>
          </andes-switch>
        </div>
      </div>
    `,
  }),
};
