import type { Meta, StoryObj } from '@storybook/angular';

import {
  about,
  column,
  withAlertKit,
  withDescription,
} from '../../testing/alert-story-kit';
import { AndesAlert } from './alert';

const meta: Meta<AndesAlert> = {
  title: 'Feedback/Alert/Banners',
  component: AndesAlert,
  decorators: [withDescription, withAlertKit],
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<AndesAlert>;

/** A strip. */
export const Banner: Story = {
  name: 'Banner',
  parameters: about(
    'A banner runs edge to edge with no radius and no side borders, and an alert without a severity becomes a warning in banner mode.',
  ),
  render: () => ({
    props: { column },
    template: `<div [style]="column">
      <andes-alert banner description="Scheduled maintenance tonight from 22:00 to 23:00. Saving may be unavailable." />
      <andes-alert banner severity="info" closable description="Very long banner text that keeps going until it has to wrap onto a second line inside the strip." />
      <andes-alert banner severity="danger" variant="outlined" closable description="Outlined banners keep the hairline above and below." />
      <andes-alert banner severity="success" variant="solid" closable description="Solid banners are the loudest strip." />
    </div>`,
  }),
};

/** No icon. */
export const BannerWithoutIcon: Story = {
  name: 'Banner without an icon',
  parameters: about(
    'A banner can drop its icon when the page already says what kind of message it is.',
  ),
  render: () => ({
    props: { column },
    template: `<div [style]="column">
      <andes-alert banner [showIcon]="false" description="Warning text without an icon." />
    </div>`,
  }),
};

/** Banner with title and action. */
export const BannerWithAction: Story = {
  name: 'Banner with an action',
  parameters: about(
    'A banner can carry a title, a description and an action at the end, and keeps the same density as a card.',
  ),
  render: () => ({
    props: { column },
    template: `<div [style]="column">
      <andes-alert banner severity="info" actionPlacement="end" closable title="Read-only mode" description="You are viewing an archived project.">
        <andes-button slot="action" size="sm" variant="outline">Restore</andes-button>
      </andes-alert>
      <andes-alert banner severity="warning" actionPlacement="end" closable>
        Your trial ends in 3 days.
        <andes-button slot="action" size="xs" variant="outline">Choose a plan</andes-button>
      </andes-alert>
    </div>`,
  }),
};

/** Scrolling text. */
export const LoopBanner: Story = {
  name: 'Loop banner',
  parameters: about(
    'Marquee scrolls the text of a banner in a loop that pauses on hover or focus, and under reduced motion the text simply wraps.',
  ),
  render: () => ({
    props: { column },
    template: `<div [style]="column">
      <andes-alert banner marquee closable>
        Scheduled maintenance tonight from 22:00 to 23:00 (UTC-5). Saving, exports and report generation will be unavailable during the window, so please finish pending work before then.
      </andes-alert>
      <andes-alert banner marquee severity="info">
        New: monthly reports can now be exported to PDF from the Reports page.
        <andes-button variant="link" size="xs">See what changed</andes-button>
      </andes-alert>
    </div>`,
  }),
};

/** Marquee pace. */
export const LoopSpeed: Story = {
  name: 'Loop speed',
  parameters: about(
    'MarqueeSpeed sets the pace in pixels per second, so short and long messages travel alike: 20 here is slow, 120 is fast.',
  ),
  render: () => ({
    props: { column },
    template: `<div [style]="column">
      <andes-alert banner marquee [marqueeSpeed]="20" severity="success" description="Slow, at 20 pixels per second: all of this month's invoices were delivered." />
      <andes-alert banner marquee [marqueeSpeed]="120" severity="danger" description="Fast, at 120 pixels per second: the payment provider is down and new charges are paused." />
    </div>`,
  }),
};
