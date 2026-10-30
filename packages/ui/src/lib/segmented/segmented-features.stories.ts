import { BidiModule } from '@angular/cdk/bidi';
import type { Meta, StoryObj } from '@storybook/angular';

import { AndesSegmented } from './segmented';

const meta: Meta<AndesSegmented> = {
  title: 'Data Entry/Segmented/Basics/Features',
  component: AndesSegmented,
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<AndesSegmented>;

const caption =
  'font-family: var(--andes-font-family), sans-serif; font-size: 0.75rem; line-height: 1rem; color: var(--andes-color-muted-foreground); margin: 0 0 0.375rem;';
const column =
  'display: flex; flex-direction: column; gap: 1.25rem; align-items: flex-start;';
const log =
  'font-family: var(--andes-font-family), sans-serif; font-size: 0.875rem; line-height: 1.375rem;';

/**
 * `variant` picks the look: `default` (muted track, raised thumb), `outlined` (bordered track),
 * `filled` (the selected segment in the primary color) and `borderless` (no track). `status`
 * paints the track and the focus ring: `error` (danger, and `aria-invalid`) or `warning`. Switch
 * the toolbar theme to check dark mode.
 */
export const StatusAndVariants: Story = {
  parameters: { layout: 'padded' },
  render: () => ({
    props: {
      variants: ['default', 'outlined', 'filled', 'borderless'],
      tiers: [
        { name: 'No status', status: undefined },
        { name: 'Warning', status: 'warning' },
        { name: 'Error', status: 'error' },
      ],
      periods: ['Daily', 'Weekly', 'Monthly'],
    },
    template: `
      <div style="display: grid; grid-template-columns: auto repeat(3, max-content); gap: 0.75rem 1.5rem; align-items: center; justify-items: start;">
        <span></span>
        @for (tier of tiers; track tier.name) {
          <span style="${caption} margin: 0;">{{ tier.name }}</span>
        }
        @for (variant of variants; track variant) {
          <span style="${caption} margin: 0;">{{ variant }}</span>
          @for (tier of tiers; track tier.name) {
            <andes-segmented [aria-label]="variant + ' ' + tier.name" [variant]="variant" [status]="tier.status" [options]="periods" value="Weekly" />
          }
        }
      </div>
    `,
  }),
};

/**
 * `readOnly` keeps the control focusable and announced (`aria-readonly`) but changes nothing:
 * clicks and Space do nothing, the arrow keys still move focus, and there is no hover feedback.
 * `disabled` dims it and leaves the tab order. Try both with the keyboard.
 */
export const ReadOnly: Story = {
  render: () => ({
    props: {
      roValue: 'Weekly',
      roChanges: 0,
      periods: ['Daily', 'Weekly', 'Monthly'],
    },
    template: `
      <div style="${column}">
        <div>
          <p style="${caption}">Read-only (focusable, no hover, selection locked)</p>
          <andes-segmented aria-label="Read-only period" readOnly [options]="periods" [(value)]="roValue" (selectionChange)="roChanges = roChanges + 1" />
        </div>
        <div>
          <p style="${caption}">Read-only, filled</p>
          <andes-segmented aria-label="Read-only filled" readOnly variant="filled" [options]="periods" value="Monthly" />
        </div>
        <div>
          <p style="${caption}">Disabled (dimmed, skipped by Tab)</p>
          <andes-segmented aria-label="Disabled period" disabled [options]="periods" value="Weekly" />
        </div>
        <span style="${log}">Value {{ roValue }} - user changes: {{ roChanges }}</span>
      </div>
    `,
  }),
};

/**
 * `motion` sets the sliding thumb's `{ duration, easing }` (the same as the
 * `--andes-segmented-duration` / `--andes-segmented-easing` custom properties). Reduced-motion
 * users always get an instant move.
 */
export const Motion: Story = {
  render: () => ({
    props: {
      slow: { duration: 600, easing: 'ease-in-out' },
      instant: { duration: 0 },
      periods: ['Daily', 'Weekly', 'Monthly', 'Yearly'],
    },
    template: `
      <div style="${column}">
        <div><p style="${caption}">Default (180ms)</p><andes-segmented aria-label="Default motion" [options]="periods" value="Daily" /></div>
        <div><p style="${caption}">600ms ease-in-out</p><andes-segmented aria-label="Slow motion" [motion]="slow" [options]="periods" value="Daily" /></div>
        <div><p style="${caption}">Instant (0)</p><andes-segmented aria-label="Instant motion" [motion]="instant" [options]="periods" value="Daily" /></div>
      </div>
    `,
  }),
};

/**
 * `scrollable` keeps many options on one line: the track scrolls (touch, trackpad, arrow keys)
 * with a soft fade on every edge that has more behind it, and the selected option is revealed.
 * The vertical one needs a height, here `max-height` on the host.
 */
export const Scrollable: Story = {
  render: () => ({
    props: {
      months: [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
      ],
      monthValue: 'August',
      stepValue: 'Step 5',
      steps: Array.from({ length: 10 }, (_, i) => `Step ${i + 1}`),
    },
    template: `
      <div style="${column}">
        <div style="width: 20rem; max-width: 100%;">
          <p style="${caption}">Horizontal in a 20rem container (selected: {{ monthValue }})</p>
          <andes-segmented aria-label="Month" scrollable block [options]="months" [(value)]="monthValue" />
        </div>
        <div style="width: 18rem; max-width: 100%;">
          <p style="${caption}">Outlined, round, small</p>
          <andes-segmented aria-label="Month outlined" scrollable block variant="outlined" shape="round" size="sm" [options]="months" value="March" />
        </div>
        <div>
          <p style="${caption}">Vertical, max-height 9rem</p>
          <andes-segmented aria-label="Step" scrollable vertical style="max-height: 9rem;" [options]="steps" [(value)]="stepValue" />
        </div>
      </div>
    `,
  }),
};

/**
 * `columns` lays the options out as an equal-width grid that wraps (usually with `block`), and
 * an option `description` adds a second line, linked with `aria-describedby`; every segment
 * grows to the tallest one.
 */
export const ColumnsAndDescriptions: Story = {
  parameters: { layout: 'padded' },
  render: () => ({
    props: {
      sizesList: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
      plans: [
        { label: 'Free', value: 'free', description: '1 project' },
        { label: 'Team', value: 'team', description: 'Up to 10 seats' },
        {
          label: 'Business',
          value: 'business',
          description: 'SSO and audit log',
        },
        {
          label: 'Enterprise',
          value: 'enterprise',
          description: 'Custom contract',
          disabled: true,
        },
      ],
      mixed: [
        { label: 'Monthly', value: 'monthly' },
        { label: 'Annual', value: 'annual', description: '2 months free' },
      ],
    },
    template: `
      <div style="${column} max-width: 32rem;">
        <div style="align-self: stretch;">
          <p style="${caption}">columns=3 with block (6 options wrap onto two rows)</p>
          <andes-segmented aria-label="T-shirt size" block [columns]="3" [options]="sizesList" value="M" />
        </div>
        <div>
          <p style="${caption}">columns=2, outlined</p>
          <andes-segmented aria-label="Size, two columns" variant="outlined" [columns]="2" [options]="sizesList" value="XL" />
        </div>
        <div style="align-self: stretch;">
          <p style="${caption}">Descriptions in a block row</p>
          <andes-segmented aria-label="Plan" block [options]="plans" value="team" />
        </div>
        <div style="align-self: stretch;">
          <p style="${caption}">Descriptions in columns=2, filled</p>
          <andes-segmented aria-label="Plan grid" block variant="filled" [columns]="2" [options]="plans" value="business" />
        </div>
        <div>
          <p style="${caption}">Only one option has a description: the others grow with it</p>
          <andes-segmented aria-label="Billing" [options]="mixed" value="annual" />
        </div>
      </div>
    `,
  }),
};

/**
 * Keyboard: the arrows move and select and wrap around (`loop`, default); with `loop` off they
 * stop at the ends. Home and End jump to the first and last enabled option, in right-to-left
 * layouts too (where the horizontal arrows mirror). `focus()` / `blur()` and the
 * `(focused)` / `(blurred)` outputs treat the group as one control.
 */
export const KeyboardLoopHomeEndFocus: Story = {
  name: 'Keyboard (loop, Home/End, focus)',
  parameters: { layout: 'padded' },
  render: () => ({
    moduleMetadata: { imports: [BidiModule] },
    props: {
      letters: [
        'One',
        'Two',
        'Three',
        { label: 'Four', value: 'Four', disabled: true },
        'Five',
      ],
      loopValue: 'Five',
      noLoopValue: 'Five',
      rtlValue: 'ثلاثة',
      rtlOptions: ['واحد', 'اثنان', 'ثلاثة', 'أربعة'],
      focusLog: 'not focused',
    },
    template: `
      <div style="${column}">
        <div>
          <p style="${caption}">loop (default): ArrowRight on "Five" wraps to "One"</p>
          <andes-segmented aria-label="Looping" [options]="letters" [(value)]="loopValue" />
        </div>
        <div>
          <p style="${caption}">loop=false: stops at the ends; Home / End still jump</p>
          <andes-segmented aria-label="Not looping" [loop]="false" [options]="letters" [(value)]="noLoopValue" />
        </div>
        <div dir="rtl">
          <p style="${caption}">Right-to-left: arrows mirror, Home is the first option</p>
          <andes-segmented aria-label="Right to left" [loop]="false" [options]="rtlOptions" [(value)]="rtlValue" />
        </div>
        <div>
          <p style="${caption}">Focus API</p>
          <div style="display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap;">
            <andes-segmented #api aria-label="Focus API" [options]="letters" value="Two" (focused)="focusLog = 'focused'" (blurred)="focusLog = 'blurred'" />
            <button type="button" (click)="api.focus()" style="font: inherit; font-size: 0.875rem;">focus()</button>
            <button type="button" (click)="api.blur()" style="font: inherit; font-size: 0.875rem;">blur()</button>
            <span style="${log}">Group: {{ focusLog }}</span>
          </div>
        </div>
      </div>
    `,
  }),
};
