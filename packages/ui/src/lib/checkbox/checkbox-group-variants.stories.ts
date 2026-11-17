import type { Meta, StoryObj } from '@storybook/angular';

import { AndesCheckbox } from './checkbox';
import { AndesCheckboxGroup } from './checkbox-group';

const meta: Meta<AndesCheckboxGroup> = {
  title: 'Data Entry/CheckboxGroup/Specialized/Variants',
  component: AndesCheckboxGroup,
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<AndesCheckboxGroup>;

const caption = `font-family: var(--andes-font-family), sans-serif; font-size: 0.875rem; line-height: 1.375rem; color: var(--andes-color-foreground); margin: 0 0 0.5rem;`;

/**
 * `variant="card"` on the group turns every option into a card with its title and
 * description: vertical, horizontal and in `columns`, with a disabled option, a group
 * `status`, a `maxCount` (the cards that cannot be picked dim), cards without the box, and a
 * right-to-left group.
 */
export const CardGroup: Story = {
  name: 'Card group',
  render: () => ({
    moduleMetadata: { imports: [AndesCheckbox] },
    props: {
      addOns: [
        {
          label: 'Backups',
          value: 'backups',
          description: 'Daily snapshots, kept 30 days.',
        },
        {
          label: 'Monitoring',
          value: 'monitoring',
          description: 'Uptime checks every minute.',
        },
        {
          label: 'Dedicated IP',
          value: 'ip',
          description: 'Only on the Business plan.',
          disabled: true,
        },
      ],
      services: [
        {
          label: 'Backups',
          value: 'backups',
          description: 'Daily snapshots, kept 30 days.',
        },
        {
          label: 'Monitoring',
          value: 'monitoring',
          description: 'Uptime checks every minute.',
        },
        {
          label: 'Support',
          value: 'support',
          description: 'Answers within an hour.',
        },
      ],
      vertical: ['backups'] as readonly string[],
      grid: ['monitoring'] as readonly string[],
      limited: ['backups', 'monitoring'] as readonly string[],
    },
    template: `
      <div style="display: flex; flex-direction: column; gap: 2rem; max-width: 44rem;">
        <div>
          <p style="${caption}">Vertical</p>
          <andes-checkbox-group aria-label="Add-ons (vertical)" variant="card" [options]="addOns" [(value)]="vertical" />
        </div>
        <div>
          <p style="${caption}">Horizontal, small</p>
          <andes-checkbox-group aria-label="Add-ons (horizontal)" variant="card" orientation="horizontal" size="sm" [options]="addOns" />
        </div>
        <div>
          <p style="${caption}">columns = 3, status = error</p>
          <andes-checkbox-group aria-label="Add-ons (grid)" variant="card" [columns]="3" status="error" [options]="addOns" [(value)]="grid" />
        </div>
        <div>
          <p style="${caption}">maxCount = 2, no box</p>
          <andes-checkbox-group aria-label="Add-ons (at most 2)" variant="card" [indicator]="false" [columns]="3" [maxCount]="2" [options]="services" [(value)]="limited" />
        </div>
        <div dir="rtl">
          <p style="${caption}">RTL</p>
          <andes-checkbox-group aria-label="RTL" variant="card" [columns]="2" [value]="['a']">
            <andes-checkbox value="a">الأول<span slot="description">وصف البطاقة</span></andes-checkbox>
            <andes-checkbox value="b">الثاني<span slot="description">وصف البطاقة</span></andes-checkbox>
          </andes-checkbox-group>
        </div>
      </div>
    `,
  }),
};

/**
 * `variant="button"` joins the options into one segmented control of toggle buttons, the same
 * face as the radio group's button style: checked buttons fill with the primary subtle tint.
 * Shown in each size, with the check mark (`indicator`), vertical, with a disabled option,
 * a `maxCount`, both statuses and right-to-left. Tab reaches each button; Space toggles it.
 */
export const ButtonGroup: Story = {
  name: 'Button group',
  render: () => ({
    moduleMetadata: { imports: [AndesCheckbox] },
    props: {
      days: [
        { label: 'Mon', value: 'mon' },
        { label: 'Tue', value: 'tue' },
        { label: 'Wed', value: 'wed' },
        { label: 'Thu', value: 'thu' },
        { label: 'Fri', value: 'fri' },
      ],
      week: ['tue', 'thu'] as readonly string[],
      twoDays: ['mon'] as readonly string[],
      sizes: ['sm', 'md', 'lg'],
      styles: ['bold'] as readonly string[],
    },
    template: `
      <div style="display: flex; flex-direction: column; gap: 1.25rem; align-items: flex-start;">
        @for (step of sizes; track step) {
          <andes-checkbox-group [attr.aria-label]="'Days ' + step" variant="button" [size]="$any(step)" [options]="days" [(value)]="week" />
        }
        <andes-checkbox-group aria-label="Days with check marks" variant="button" indicator [options]="days" [(value)]="week" />
        <andes-checkbox-group aria-label="Text style" variant="button" [(value)]="styles">
          <andes-checkbox value="bold">Bold</andes-checkbox>
          <andes-checkbox value="italic">Italic</andes-checkbox>
          <andes-checkbox value="underline" disabled>Underline</andes-checkbox>
        </andes-checkbox-group>
        <andes-checkbox-group aria-label="At most 2 days" variant="button" [maxCount]="2" [options]="days" [(value)]="twoDays" />
        <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
          <andes-checkbox-group aria-label="Days (error)" variant="button" status="error" [options]="days.slice(0, 3)" />
          <andes-checkbox-group aria-label="Days (warning)" variant="button" status="warning" [options]="days.slice(0, 3)" [value]="['tue']" />
        </div>
        <div style="display: flex; gap: 2rem; align-items: flex-start;">
          <andes-checkbox-group aria-label="Vertical" variant="button" orientation="vertical" [options]="days.slice(0, 3)" [value]="['mon']" />
          <div dir="rtl">
            <andes-checkbox-group aria-label="RTL" variant="button" [options]="days.slice(0, 3)" [value]="['mon']" />
          </div>
        </div>
      </div>
    `,
  }),
};
