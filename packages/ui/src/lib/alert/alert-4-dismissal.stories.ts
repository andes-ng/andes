import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular';

import {
  about,
  bar,
  column,
  muted,
  withAlertKit,
  withDescription,
} from '../../testing/alert-story-kit';
import { AndesButton } from '../button/button';
import { AndesAlert, type AndesAlertCloseEvent } from './alert';

const meta: Meta<AndesAlert> = {
  title: 'Feedback/Alert/Dismissal',
  component: AndesAlert,
  decorators: [withDescription, withAlertKit],
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<AndesAlert>;

/** The close button. */
export const CloseButton: Story = {
  name: 'Close button',
  parameters: about(
    'Closable adds a 20px close button at the end of the first line; its accessible name is closeLabel.',
  ),
  render: () => ({
    props: { column },
    template: `<div [style]="column">
      <andes-alert severity="info" closable closeLabel="Close">Default close button.</andes-alert>
      <andes-alert severity="info" closable closeLabel="Dismiss the notice" title="Heads up" description="The button is named for assistive technology, and hangs from the top edge." />
    </div>`,
  }),
};

/** A word instead of the cross. */
export const CloseText: Story = {
  name: 'Close text',
  parameters: about(
    'CloseText swaps the cross for a word that reads as an acknowledgement, and the word becomes the accessible name.',
  ),
  render: () => ({
    props: { column },
    template: `<div [style]="column">
      <andes-alert severity="info" closable closeText="Got it">Prices now include tax by default.</andes-alert>
      <andes-alert severity="warning" closable closeText="Dismiss" title="Period closing on Friday" description="Entries dated in October cannot be edited after the period is closed." />
    </div>`,
  }),
};

/** Own close glyph. */
export const CloseIcon: Story = {
  name: 'Close icon',
  parameters: about(
    'CloseIcon takes a template for the glyph, and the button keeps closeLabel as its name.',
  ),
  render: () => ({
    props: { column },
    template: `<ng-template #minus>
        <ng-icon name="lucideMinus" aria-hidden="true" />
      </ng-template>
      <div [style]="column">
        <andes-alert severity="info" closable [closeIcon]="minus" closeLabel="Dismiss notice">This alert uses a custom close glyph.</andes-alert>
      </div>`,
  }),
};

/** Inert close button. */
export const CloseDisabled: Story = {
  name: 'Disabled close button',
  parameters: about(
    'CloseDisabled keeps the button in place but inert, for as long as the request the alert reports on is still running.',
  ),
  render: () => ({
    props: { column },
    template: `<div [style]="column">
      <andes-alert severity="info" closable closeDisabled title="Exporting the ledger" description="This notice can be dismissed once the export has finished." />
    </div>`,
  }),
};

@Component({
  selector: 'andes-alert-lifecycle',
  imports: [AndesAlert],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div [style]="column">
      <andes-alert
        severity="warning"
        closable
        title="Cannot be dismissed"
        description="The closing event calls preventDefault, so this one stays."
        (closing)="onClosing('locked', $event, true)"
      />
      <andes-alert
        severity="info"
        closable
        title="First"
        description="Close me and watch the alerts below slide up."
        (closing)="onClosing('first', $event, false)"
        (afterClose)="onAfterClose('first')"
      />
      <andes-alert
        severity="success"
        closable
        title="Second"
        description="Another dismissible alert."
        (closing)="onClosing('second', $event, false)"
        (afterClose)="onAfterClose('second')"
      />
      <ol aria-label="Close event log" [style]="log">
        @for (entry of entries(); track $index) {
          <li>{{ entry }}</li>
        }
      </ol>
    </div>
  `,
})
class LifecycleExample {
  protected readonly column = column;
  protected readonly log = `margin: 0; padding-inline-start: 1.25rem; ${muted}`;
  protected readonly entries = signal<string[]>([]);

  protected onClosing(
    name: string,
    event: AndesAlertCloseEvent,
    veto: boolean,
  ): void {
    if (veto) event.preventDefault();
    this.entries.update((log) => [
      ...log,
      `closing: ${name}${veto ? ' (prevented)' : ''}`,
    ]);
  }

  protected onAfterClose(name: string): void {
    this.entries.update((log) => [...log, `afterClose: ${name}`]);
  }
}

/** Events. */
export const Lifecycle: Story = {
  name: 'Close lifecycle',
  parameters: about(
    'Closing fires first and can be vetoed with preventDefault, then the alert collapses and afterClose fires once it is gone.',
  ),
  render: () => ({
    moduleMetadata: { imports: [LifecycleExample] },
    template: '<andes-alert-lifecycle />',
  }),
};

@Component({
  selector: 'andes-alert-open-state',
  imports: [AndesAlert, AndesButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div [style]="column">
      <andes-alert
        severity="success"
        closable
        title="Report scheduled"
        description="It will be sent every Monday at 8:00."
        [(open)]="open"
      />
      <div [style]="bar">
        <andes-button variant="outline" size="sm" (click)="open.set(!open())">{{
          open() ? 'Hide the alert' : 'Show the alert'
        }}</andes-button>
        <span [style]="note">open = {{ open() }}</span>
      </div>
    </div>
  `,
})
class OpenStateExample {
  protected readonly column = column;
  protected readonly bar = bar;
  protected readonly note = muted;
  protected readonly open = signal(true);
}

/** Two-way open state. */
export const OpenState: Story = {
  name: 'Open state',
  parameters: about(
    'The open model is two-way: setting it hides or brings back the alert with the same collapse as the close button, and the close button writes false back.',
  ),
  render: () => ({
    moduleMetadata: { imports: [OpenStateExample] },
    template: '<andes-alert-open-state />',
  }),
};

@Component({
  selector: 'andes-alert-auto-dismiss',
  imports: [AndesAlert, AndesButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div [style]="column">
      <andes-alert
        severity="success"
        closable
        [duration]="5000"
        [(open)]="open"
        (closing)="reason.set($event.reason)"
      >
        Settings saved. This notice closes by itself after 5 seconds.
      </andes-alert>
      <div [style]="bar">
        <andes-button
          variant="outline"
          size="sm"
          [disabled]="open()"
          (click)="open.set(true)"
          >Show it again</andes-button
        >
        <span [style]="note"
          >Hover it or focus its button to hold the countdown. Last close:
          {{ reason() ?? 'none yet' }}</span
        >
      </div>
    </div>
  `,
})
class AutoDismissExample {
  protected readonly column = column;
  protected readonly bar = bar;
  protected readonly note = muted;
  protected readonly open = signal(true);
  protected readonly reason = signal<string | null>(null);
}

/** Closes by itself. */
export const AutoDismiss: Story = {
  name: 'Auto-dismiss',
  parameters: about(
    'A duration closes the alert by itself through the same closing event, and the countdown holds while the pointer is over the alert or focus is inside it.',
  ),
  render: () => ({
    moduleMetadata: { imports: [AutoDismissExample] },
    template: '<andes-alert-auto-dismiss />',
  }),
};

@Component({
  selector: 'andes-alert-unmount',
  imports: [AndesAlert, AndesButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div [style]="column">
      @if (present()) {
        <andes-alert
          severity="success"
          closable
          description="Alert message text"
          (afterClose)="present.set(false)"
        />
      }
      <span [style]="note">Click the close button to see the collapse.</span>
      <div [style]="bar">
        <andes-button
          variant="outline"
          size="sm"
          [disabled]="present()"
          (click)="present.set(true)"
          >Show the alert again</andes-button
        >
      </div>
    </div>
  `,
})
class UnmountExample {
  protected readonly column = column;
  protected readonly bar = bar;
  protected readonly note = muted;
  protected readonly present = signal(true);
}

/** Unmounting. */
export const SmoothCollapse: Story = {
  name: 'Smooth collapse',
  parameters: about(
    'Closing collapses the alert over 0.3 seconds, its height and opacity together, so what sits below slides up instead of jumping, and reduced motion hides it at once.',
  ),
  render: () => ({
    moduleMetadata: { imports: [UnmountExample] },
    template: '<andes-alert-unmount />',
  }),
};
