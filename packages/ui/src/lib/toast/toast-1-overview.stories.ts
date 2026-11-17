import { Component, signal } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular';

import {
  about,
  PLACEMENT_OPTIONS,
  ToastDemo,
  withDescription,
  withToastKit,
} from '../../testing/toast-story-kit';
import { AndesButton } from '../button/button';
import { AndesInput } from '../input/input';
import { AndesInputNumber } from '../input-number/input-number';
import { AndesRadioGroup } from '../radio-group/radio-group';
import { AndesSegmented } from '../segmented/segmented';
import { AndesSelect } from '../select/select';
import { AndesSwitch } from '../switch/switch';
import type { AndesToastPosition, AndesToastSeverity } from './toast.types';
import { AndesToastViewport } from './toast-viewport';

/** Every option the playground can build a toast from, set in the panel. */
@Component({
  selector: 'andes-toast-playground',
  imports: [
    AndesButton,
    AndesInput,
    AndesInputNumber,
    AndesRadioGroup,
    AndesSegmented,
    AndesSelect,
    AndesSwitch,
    AndesToastViewport,
  ],
  template: `
    <div [style]="panel">
      <div [style]="field">
        <span [style]="caption">Kind</span>
        <andes-segmented
          aria-label="Kind"
          [options]="kinds"
          [(value)]="flavor"
        />
      </div>
      <div [style]="field">
        <span [style]="caption">Severity</span>
        <andes-radio-group
          aria-label="Severity"
          orientation="horizontal"
          [options]="severityOptions"
          [(value)]="severity"
        />
      </div>
      <div [style]="bar">
        <div [style]="field">
          <span [style]="caption">Placement (notifications)</span>
          <andes-select
            aria-label="Placement"
            style="width: 11rem;"
            [options]="placementOptions"
            [disabled]="flavor() === 'message'"
            [(value)]="placement"
          />
        </div>
        <div [style]="field">
          <span [style]="caption">Duration in seconds (0 never closes)</span>
          <andes-input-number
            aria-label="Duration in seconds"
            style="width: 7rem;"
            [min]="0"
            [max]="60"
            [(value)]="seconds"
          />
        </div>
      </div>
      <div
        [style]="
          field +
          ' align-self: stretch; align-items: stretch; max-width: 22rem;'
        "
      >
        <span [style]="caption">Title (notifications)</span>
        <andes-input
          aria-label="Title"
          style="width: 100%;"
          [disabled]="flavor() === 'message'"
          [(value)]="title"
        />
      </div>
      <div
        [style]="
          field +
          ' align-self: stretch; align-items: stretch; max-width: 22rem;'
        "
      >
        <span [style]="caption">Message</span>
        <andes-input
          aria-label="Message"
          style="width: 100%;"
          [(value)]="body"
        />
      </div>
      <div [style]="bar">
        <andes-switch
          [disabled]="flavor() === 'message'"
          [(checked)]="progress"
        >
          Progress line
        </andes-switch>
        <andes-switch [(checked)]="dismissible">Close button</andes-switch>
      </div>
      <div [style]="bar">
        <andes-button (click)="show()">Show</andes-button>
        <andes-button variant="outline" (click)="clear()"
          >Dismiss all</andes-button
        >
      </div>
    </div>
    <andes-toast-viewport />
  `,
})
class PlaygroundHost extends ToastDemo {
  protected readonly kinds = [
    { value: 'notification', label: 'Notification' },
    { value: 'message', label: 'Message' },
  ];
  protected readonly severityOptions = [
    'neutral',
    'info',
    'success',
    'warning',
    'error',
    'loading',
  ].map((value) => ({ value, label: value }));
  protected readonly flavor = signal<string | null>('notification');
  protected readonly severity = signal<string | null>('success');
  protected readonly placement = signal<unknown>('bottom-right');
  protected readonly seconds = signal<number | string | null>(5);
  protected readonly title = signal('Event has been created');
  protected readonly body = signal('Sunday, December 03 at 9:00 AM');
  protected readonly progress = signal(false);
  protected readonly dismissible = signal(true);

  protected show(): void {
    const seconds = Number(this.seconds()) || 0;
    const duration = seconds > 0 ? seconds * 1000 : false;
    const severity = (this.severity() ?? 'info') as AndesToastSeverity;
    if (this.flavor() === 'message') {
      this.messages.open({
        content: this.body(),
        type: severity === 'neutral' ? 'info' : severity,
        duration,
        dismissible: this.dismissible(),
      });
      return;
    }
    this.toasts.show({
      title: this.title() || undefined,
      message: this.body(),
      severity,
      placement: this.placement() as AndesToastPosition,
      duration,
      showProgress: this.progress(),
      dismissible: this.dismissible(),
    });
  }
}

/** Calling the services from a component, the way an app does. */
@Component({
  selector: 'andes-toast-getting-started',
  imports: [AndesButton, AndesToastViewport],
  template: `
    <div [style]="column">
      <span [style]="caption"
        >1. Mount the viewport once, next to the router outlet</span
      >
      <pre [style]="code">{{ mountSnippet }}</pre>
      <span [style]="caption"
        >2. Inject the service where the work happens</span
      >
      <pre [style]="code">{{ injectSnippet }}</pre>
      <div [style]="bar">
        <andes-button (click)="notify()">Show a notification</andes-button>
        <andes-button variant="outline" (click)="tell()"
          >Show a message</andes-button
        >
      </div>
    </div>
    <andes-toast-viewport />
  `,
})
class GettingStartedHost extends ToastDemo {
  protected readonly mountSnippet = '<andes-toast-viewport />';
  protected readonly injectSnippet = [
    'private readonly toasts = inject(AndesToastService);',
    'private readonly messages = inject(AndesMessageService);',
    '',
    "this.toasts.success('Changes saved.');",
    "this.messages.info('Copied to clipboard');",
  ].join('\n');

  protected notify(): void {
    this.toasts.success('Changes saved.');
  }

  protected tell(): void {
    this.messages.info('Copied to clipboard');
  }
}

/** The everyday set side by side. */
@Component({
  selector: 'andes-toast-everyday',
  imports: [AndesButton, AndesSwitch, AndesToastViewport],
  template: `
    <div [style]="column">
      <div [style]="bar">
        <andes-button variant="outline" (click)="showDefault()"
          >Default</andes-button
        >
        <andes-button
          variant="outline"
          (click)="toasts.success('Event has been created')"
        >
          Success
        </andes-button>
        <andes-button
          variant="outline"
          (click)="
            toasts.info('Be at the area 10 minutes before the event time')
          "
        >
          Info
        </andes-button>
        <andes-button
          variant="outline"
          (click)="
            toasts.warning('Event start time cannot be earlier than 8am')
          "
        >
          Warning
        </andes-button>
        <andes-button
          variant="outline"
          (click)="toasts.error('Event has not been created')"
        >
          Error
        </andes-button>
        <andes-button variant="outline" (click)="showLoading()"
          >Loading, then done</andes-button
        >
        <andes-button variant="outline" (click)="showConfirm()"
          >Action and cancel</andes-button
        >
        <andes-button
          variant="outline"
          (click)="messages.success('Copied to clipboard')"
        >
          Message
        </andes-button>
      </div>
      <div [style]="bar">
        <andes-switch
          [checked]="richColors()"
          (checkedChange)="setRichColors($event)"
        >
          Rich colors
        </andes-switch>
        <andes-switch
          [checked]="expanded()"
          (checkedChange)="setExpanded($event)"
        >
          Always expanded
        </andes-switch>
        <andes-button variant="ghost" (click)="clear()"
          >Destroy all</andes-button
        >
      </div>
      <p [style]="muted">{{ status() }}</p>
    </div>
    <andes-toast-viewport />
  `,
})
class EverydayHost extends ToastDemo {
  protected readonly richColors = signal(false);
  protected readonly expanded = signal(false);

  protected showDefault(): void {
    this.toasts.show({
      title: 'Event has been created',
      message: 'Sunday, December 03, 2023 at 9:00 AM',
      action: { label: 'Undo', onClick: () => this.status.set('Undo.') },
    });
  }

  protected showLoading(): void {
    const ref = this.toasts.loading('Loading...', {
      duration: false,
      dismissible: false,
    });
    setTimeout(
      () =>
        ref.update({
          message: 'Event has been created',
          severity: 'success',
          duration: 4000,
          dismissible: true,
        }),
      2000,
    );
  }

  protected showConfirm(): void {
    const ref = this.toasts.show({
      title: 'Delete 3 files?',
      message: 'They will be moved to the trash.',
      duration: false,
      cancel: { label: 'Cancel', onClick: () => this.status.set('Kept.') },
      action: { label: 'Delete', onClick: () => this.status.set('Deleted.') },
    });
    void ref.afterClosed.then((reason) =>
      this.status.update((current) => `${current} (closed: ${reason})`),
    );
  }

  protected setRichColors(on: boolean): void {
    this.richColors.set(on);
    this.toasts.config({ richColors: on });
    this.messages.config({ richColors: on });
  }

  protected setExpanded(on: boolean): void {
    this.expanded.set(on);
    this.toasts.config({ stack: !on });
  }
}

const meta: Meta<AndesToastViewport> = {
  title: 'Feedback/Toast/Overview',
  component: AndesToastViewport,
  tags: ['autodocs'],
  decorators: [withDescription, withToastKit],
  parameters: { layout: 'padded' },
  argTypes: {
    position: {
      control: 'select',
      options: PLACEMENT_OPTIONS.map((o) => o.value),
    },
    hotkey: { control: 'text' },
    container: { control: false },
  },
};

export default meta;

type Story = StoryObj<AndesToastViewport>;

/** Every option of a toast, set in a panel built from library components. */
export const Playground: Story = {
  name: 'Playground',
  parameters: about(
    'Pick a notification or a message, its severity, placement, duration and text in the panel, then press Show.',
  ),
  render: () => ({
    moduleMetadata: { imports: [PlaygroundHost] },
    template: `<andes-toast-playground />`,
  }),
};

/** Mount the viewport once, inject the service, call it. */
export const GettingStarted: Story = {
  name: 'Getting started',
  parameters: about(
    'Mount one viewport in the app, inject AndesToastService or AndesMessageService where the work happens, and call success, error, info or show.',
  ),
  render: () => ({
    moduleMetadata: { imports: [GettingStartedHost] },
    template: `<andes-toast-getting-started />`,
  }),
};

/** The everyday set: severities, a loading toast that resolves, an action pair, a message. */
export const EverydaySet: Story = {
  name: 'Everyday set',
  parameters: about(
    'The calls an app makes every day side by side, with switches for the tinted style and for a list that never collapses into a deck.',
  ),
  render: () => ({
    moduleMetadata: { imports: [EverydayHost] },
    template: `<andes-toast-everyday />`,
  }),
};
