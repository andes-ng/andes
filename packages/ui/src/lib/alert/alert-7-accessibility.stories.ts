import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular';

import {
  about,
  bar,
  caption,
  column,
  columns,
  muted,
  SEVERITIES,
  SEVERITY_TEXTS,
  withAlertKit,
  withDescription,
} from '../../testing/alert-story-kit';
import { AndesButton } from '../button/button';
import { AndesTag } from '../tag/tag';
import { AndesAlert } from './alert';

const meta: Meta<AndesAlert> = {
  title: 'Feedback/Alert/Accessibility',
  component: AndesAlert,
  decorators: [withDescription, withAlertKit],
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<AndesAlert>;

/** Roles. */
export const LiveRegionRoles: Story = {
  name: 'Live region roles',
  parameters: about(
    'Danger is announced at once as an alert and every other severity politely as a status, unless the role input says otherwise.',
  ),
  render: () => ({
    moduleMetadata: { imports: [AndesTag] },
    props: { column, bar },
    template: `<div [style]="column">
      <div [style]="bar">
        <andes-tag color="success">success: status</andes-tag>
        <andes-tag color="info">info: status</andes-tag>
        <andes-tag color="warning">warning: status</andes-tag>
        <andes-tag color="danger">danger: alert</andes-tag>
      </div>
      <andes-alert severity="info" description="Polite by default: it waits for the screen reader to finish." />
      <andes-alert severity="danger" description="Assertive by default: it interrupts to say something went wrong." />
      <andes-alert severity="warning" role="alert" description="Warning with the role overridden to alert, because it just appeared in response to an action." />
    </div>`,
  }),
};

@Component({
  selector: 'andes-alert-live-update',
  imports: [AndesAlert, AndesButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div [style]="column">
      <andes-alert
        [severity]="done() ? 'success' : 'info'"
        [description]="
          done()
            ? 'All 12 files were uploaded.'
            : 'Uploading ' + count() + ' of 12 files'
        "
      />
      <div [style]="bar">
        <andes-button
          variant="outline"
          size="sm"
          [disabled]="done()"
          (click)="next()"
          >Upload next file</andes-button
        >
        <andes-button variant="ghost" size="sm" (click)="count.set(0)"
          >Start over</andes-button
        >
      </div>
      <span [style]="note"
        >The text changes inside the same live region, so a screen reader
        announces each update.</span
      >
    </div>
  `,
})
class LiveUpdateExample {
  protected readonly column = column;
  protected readonly bar = bar;
  protected readonly note = muted;
  protected readonly count = signal(0);
  protected readonly done = () => this.count() >= 12;

  protected next(): void {
    this.count.update((n) => Math.min(12, n + 4));
  }
}

/** Updating text. */
export const LiveUpdates: Story = {
  name: 'Live updates',
  parameters: about(
    'Changing the text of an alert that is already on the page keeps the same live region, so assistive technology announces the new message.',
  ),
  render: () => ({
    moduleMetadata: { imports: [LiveUpdateExample] },
    template: '<andes-alert-live-update />',
  }),
};

/** Focus. */
export const FocusAfterClosing: Story = {
  name: 'Focus after closing',
  parameters: about(
    'Closing the alert from the keyboard moves focus to the next control on the page instead of dropping it to the top of the document.',
  ),
  render: () => ({
    props: { column },
    template: `<div [style]="column">
      <andes-button variant="outline" size="sm">Before</andes-button>
      <andes-alert severity="info" closable title="Tab to the close button" description="Press Enter or Space on it and watch where focus goes." />
      <andes-button variant="outline" size="sm">After</andes-button>
    </div>`,
  }),
};

/** Contrast. */
export const ContrastMatrix: Story = {
  name: 'Contrast in both themes',
  parameters: about(
    'Every severity in every variant on one page, to check the text, icon and close button against their washes in the light and the dark theme from the toolbar.',
  ),
  render: () => ({
    props: {
      variants: ['tinted', 'filled', 'outlined', 'solid'],
      severities: SEVERITIES,
      texts: SEVERITY_TEXTS,
      columns,
      column,
      caption,
    },
    template: `<div [style]="columns">
      @for (variant of variants; track variant) {
        <div [style]="column">
          <span [style]="caption">{{ variant }}</span>
          @for (severity of severities; track severity) {
            <andes-alert [variant]="variant" [severity]="severity" [title]="texts[severity].title" [description]="texts[severity].description" closable />
          }
        </div>
      }
    </div>`,
  }),
};

/** Right to left. */
export const RightToLeft: Story = {
  name: 'Right to left',
  parameters: {
    dir: 'rtl',
    ...about(
      'Under a right-to-left document the icon, the text, the action and the close button swap sides, and the loop banner runs the other way.',
    ),
  },
  render: () => ({
    props: { column },
    template: `<div [style]="column">
      <andes-alert severity="success" closable description="تم حفظ التغييرات بنجاح." />
      <andes-alert severity="warning" closable actionPlacement="end" title="ستنتهي الجلسة قريبا" description="احفظ عملك الآن.">
        <andes-button slot="action" size="sm" variant="outline">تمديد</andes-button>
      </andes-alert>
      <andes-alert banner marquee severity="info" description="صيانة مجدولة الليلة من الساعة العاشرة إلى الحادية عشرة مساء." />
    </div>`,
  }),
};
