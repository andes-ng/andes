import {
  Component,
  DestroyRef,
  inject,
  signal,
  TemplateRef,
  viewChild,
} from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import type { Meta, StoryObj } from '@storybook/angular';

import {
  about,
  ToastDemo,
  withDescription,
  withToastKit,
} from '../../testing/toast-story-kit';
import { AndesAvatar } from '../avatar/avatar';
import { AndesAvatarFallback } from '../avatar/avatar-fallback';
import { AndesButton } from '../button/button';
import { AndesInput } from '../input/input';
import { AndesSwitch } from '../switch/switch';
import { AndesTag } from '../tag/tag';
import type { AndesToastTemplateContext } from './toast.types';
import { AndesToastViewport } from './toast-viewport';

type Template = TemplateRef<AndesToastTemplateContext>;

const wait = (ms: number) => new Promise<void>((done) => setTimeout(done, ms));

@Component({
  selector: 'andes-toast-form-saved',
  imports: [AndesButton, AndesInput, AndesToastViewport],
  template: `
    <div [style]="panel">
      <div [style]="field">
        <span [style]="caption">Display name</span>
        <andes-input
          aria-label="Display name"
          style="width: 18rem;"
          [(value)]="name"
        />
      </div>
      <andes-button (click)="save()">Save changes</andes-button>
    </div>
    <andes-toast-viewport />
  `,
})
class FormSavedHost extends ToastDemo {
  protected readonly name = signal('Maria Lopez');
  private saved = 'Maria Lopez';

  protected save(): void {
    const previous = this.saved;
    this.saved = this.name();
    this.toasts.success(`Your name is now ${this.saved}.`, {
      key: 'profile',
      title: 'Profile saved',
      duration: 8000,
      action: {
        label: 'Undo',
        onClick: () => {
          this.saved = previous;
          this.name.set(previous);
          this.messages.info('Change undone');
        },
      },
    });
  }
}

@Component({
  selector: 'andes-toast-upload',
  imports: [AndesButton, NgIcon, AndesToastViewport],
  template: `
    <div [style]="panel">
      <div [style]="bar">
        <ng-icon name="lucideFileText" size="20" />
        <span [style]="text">quarterly-report.pdf, 2.4 MB</span>
      </div>
      <andes-button (click)="upload()">
        <ng-icon name="lucideUpload" size="16" />
        Upload
      </andes-button>
      <p [style]="muted">{{ status() }}</p>
    </div>
    <andes-toast-viewport />
  `,
})
class UploadHost extends ToastDemo {
  protected async upload(): Promise<void> {
    this.status.set('');
    const ref = this.toasts.loading('quarterly-report.pdf is being uploaded.', {
      key: 'upload',
      title: 'Uploading',
      duration: false,
      dismissible: false,
    });
    await wait(2000);
    ref.update({
      severity: 'success',
      title: 'Upload finished',
      message: 'quarterly-report.pdf is ready.',
      dismissible: true,
      duration: 10_000,
      action: {
        label: 'View',
        onClick: () => this.status.set('Opened the file.'),
      },
    });
  }
}

@Component({
  selector: 'andes-toast-copy',
  imports: [AndesButton, NgIcon, AndesToastViewport],
  template: `
    <div [style]="panel">
      <div [style]="bar">
        <code [style]="mono">INV-2024-000118</code>
        <andes-button
          variant="outline"
          size="icon-sm"
          aria-label="Copy the invoice number"
          (click)="copy()"
        >
          <ng-icon name="lucideCopy" size="16" />
        </andes-button>
      </div>
    </div>
    <andes-toast-viewport />
  `,
})
class CopyHost extends ToastDemo {
  protected readonly mono =
    'font-family: ui-monospace, monospace; font-size: 0.9375rem;';

  protected copy(): void {
    void navigator.clipboard
      ?.writeText('INV-2024-000118')
      .catch(() => undefined);
    this.messages.success('Copied to clipboard', { key: 'copy' });
  }
}

@Component({
  selector: 'andes-toast-long-task',
  imports: [AndesButton, AndesToastViewport],
  template: `
    <div [style]="bar">
      <andes-button (click)="run(false)">Run the export</andes-button>
      <andes-button variant="outline" (click)="run(true)"
        >Run it and fail</andes-button
      >
      <andes-button variant="outline" (click)="tell(false)"
        >Message, succeeds</andes-button
      >
      <andes-button variant="outline" (click)="tell(true)"
        >Message, fails</andes-button
      >
    </div>
    <andes-toast-viewport />
  `,
})
class LongTaskHost extends ToastDemo {
  private task(fail: boolean): Promise<{ rows: number }> {
    return new Promise((resolve, reject) =>
      setTimeout(
        () => (fail ? reject(new Error('Timed out')) : resolve({ rows: 1284 })),
        2000,
      ),
    );
  }

  protected run(fail: boolean): void {
    this.toasts.promise(this.task(fail), {
      loading: 'Exporting the ledger...',
      success: (result) => `${result.rows} rows exported.`,
      error: (error) => `Export failed: ${(error as Error).message}.`,
    });
  }

  protected tell(fail: boolean): void {
    this.messages.promise(this.task(fail), {
      loading: 'Exporting...',
      success: 'Exported',
      error: 'Export failed',
    });
  }
}

@Component({
  selector: 'andes-toast-new-message',
  imports: [
    AndesAvatar,
    AndesAvatarFallback,
    AndesButton,
    AndesTag,
    AndesToastViewport,
  ],
  template: `
    <div [style]="bar">
      <andes-button (click)="show()">Receive a message</andes-button>
    </div>
    <p [style]="muted">{{ status() }}</p>
    <ng-template #avatar>
      <andes-avatar size="sm"
        ><andes-avatar-fallback>ML</andes-avatar-fallback></andes-avatar
      >
    </ng-template>
    <ng-template #title let-toast>
      {{ toast.title }} <andes-tag color="primary">2 new</andes-tag>
    </ng-template>
    <andes-toast-viewport />
  `,
})
class NewMessageHost extends ToastDemo {
  private readonly avatar = viewChild.required<Template>('avatar');
  private readonly title = viewChild.required<Template>('title');

  protected show(): void {
    this.toasts.show({
      title: 'Maria Lopez',
      titleTemplate: this.title(),
      message: 'Are we still on for the demo at 3 pm? I can share my screen.',
      icon: this.avatar(),
      duration: 12_000,
      actions: [
        {
          label: 'Reply',
          onClick: () => this.status.set('Opened the reply box.'),
        },
        {
          label: 'Mark as read',
          onClick: () => this.status.set('Marked as read.'),
        },
      ],
    });
  }
}

@Component({
  selector: 'andes-toast-deploy',
  imports: [AndesButton, AndesToastViewport],
  template: `
    <div [style]="bar">
      <andes-button (click)="show()">Finish a deploy</andes-button>
    </div>
    <p [style]="muted">{{ status() }}</p>
    <andes-toast-viewport />
  `,
})
class DeployHost extends ToastDemo {
  protected show(): void {
    this.toasts.success(
      'Version 2.4.1 is live in production, 3 of 3 regions healthy.',
      {
        title: 'Deploy finished',
        duration: false,
        actions: [
          {
            label: 'View logs',
            onClick: () => this.status.set('Opened the logs.'),
          },
          {
            label: 'Roll back',
            variant: 'danger',
            onClick: () => this.status.set('Rolling back to 2.4.0.'),
          },
        ],
      },
    );
  }
}

@Component({
  selector: 'andes-toast-session',
  imports: [AndesButton, AndesToastViewport],
  template: `
    <div [style]="bar">
      <andes-button (click)="start()">Start the countdown</andes-button>
      <andes-button variant="outline" (click)="clear()"
        >Dismiss all</andes-button
      >
    </div>
    <ng-template #countdown>
      <span
        >Your session ends in <strong>{{ left() }}</strong> seconds.</span
      >
    </ng-template>
    <andes-toast-viewport />
  `,
})
class SessionHost extends ToastDemo {
  private readonly countdown = viewChild.required<Template>('countdown');
  protected readonly left = signal(30);
  private timer: ReturnType<typeof setInterval> | undefined;

  constructor() {
    super();
    inject(DestroyRef).onDestroy(() => this.stop());
  }

  /**
   * The text a screen reader announces stays fixed, and the countdown is a template reading a
   * signal, so the toast is not re-announced every second.
   */
  protected start(): void {
    this.stop();
    this.left.set(30);
    const ref = this.toasts.warning('Your session is about to expire.', {
      key: 'session',
      title: 'Still there?',
      messageTemplate: this.countdown(),
      duration: false,
      action: {
        label: 'Stay signed in',
        onClick: () => {
          this.stop();
          this.messages.success('Session extended');
        },
      },
      onClose: () => this.stop(),
    });
    this.timer = setInterval(() => {
      this.left.update((value) => value - 1);
      if (this.left() <= 0) {
        this.stop();
        ref.update({
          severity: 'error',
          title: 'Session expired',
          message: 'Sign in again to continue.',
          messageTemplate: undefined,
          action: undefined,
          duration: 6000,
        });
      }
    }, 1000);
  }

  private stop(): void {
    clearInterval(this.timer);
    this.timer = undefined;
  }
}

@Component({
  selector: 'andes-toast-settings',
  imports: [AndesSwitch, AndesToastViewport],
  template: `
    <div [style]="panel">
      <andes-switch
        [checked]="emails()"
        (checkedChange)="change(emails, $event, 'Email updates')"
      >
        Email updates
      </andes-switch>
      <andes-switch
        [checked]="digest()"
        (checkedChange)="change(digest, $event, 'Weekly digest')"
      >
        Weekly digest
      </andes-switch>
      <andes-switch
        [checked]="sounds()"
        (checkedChange)="change(sounds, $event, 'Sounds')"
      >
        Sounds
      </andes-switch>
    </div>
    <andes-toast-viewport />
  `,
})
class SettingsHost extends ToastDemo {
  protected readonly emails = signal(true);
  protected readonly digest = signal(false);
  protected readonly sounds = signal(true);

  /** One key, so flipping several switches in a row rewrites a single message. */
  protected change(
    setting: { set(value: boolean): void },
    on: boolean,
    label: string,
  ): void {
    setting.set(on);
    this.messages.success(`${label} ${on ? 'on' : 'off'}. Settings saved`, {
      key: 'settings',
    });
  }
}

@Component({
  selector: 'andes-toast-retry',
  imports: [AndesButton, AndesToastViewport],
  template: `
    <div [style]="bar">
      <andes-button (click)="publish()">Publish the page</andes-button>
    </div>
    <p [style]="muted">Attempts: {{ attempts() }} (the second one works)</p>
    <andes-toast-viewport />
  `,
})
class RetryHost extends ToastDemo {
  protected readonly attempts = signal(0);

  protected async publish(): Promise<void> {
    this.attempts.update((n) => n + 1);
    const ref = this.toasts.loading('Publishing the page...', {
      key: 'publish',
      duration: false,
      dismissible: false,
    });
    await wait(1200);
    if (this.attempts() < 2) {
      ref.update({
        severity: 'error',
        message: 'The server did not answer. Your changes are safe.',
        title: 'Could not publish',
        dismissible: true,
        duration: false,
        action: { label: 'Retry', onClick: () => void this.publish() },
      });
      return;
    }
    this.attempts.set(0);
    ref.update({
      severity: 'success',
      title: 'Published',
      message: 'The page is live.',
      dismissible: true,
      duration: 5000,
      action: undefined,
    });
  }
}

@Component({
  selector: 'andes-toast-network',
  imports: [AndesSwitch, NgIcon, AndesToastViewport],
  template: `
    <div [style]="panel">
      <andes-switch [checked]="online()" (checkedChange)="set($event)"
        >Network connection</andes-switch
      >
    </div>
    <ng-template #offline>
      <ng-icon
        name="lucideWifiOff"
        size="16"
        style="color: var(--andes-color-warning-text);"
      />
    </ng-template>
    <andes-toast-viewport />
  `,
})
class NetworkHost extends ToastDemo {
  protected readonly online = signal(true);
  private readonly offline = viewChild.required<Template>('offline');

  protected set(on: boolean): void {
    this.online.set(on);
    if (on) {
      this.messages.success('You are back online', {
        key: 'network',
        duration: 3000,
      });
    } else {
      this.messages.warning(
        'You are offline. Changes are saved on this device',
        {
          key: 'network',
          icon: this.offline(),
          duration: false,
        },
      );
    }
  }
}

@Component({
  selector: 'andes-toast-bulk',
  imports: [AndesButton, AndesTag, AndesToastViewport],
  template: `
    <div [style]="panel">
      <span [style]="text">12 invoices selected</span>
      <andes-button variant="danger" (click)="run()"
        >Delete selected</andes-button
      >
    </div>
    <ng-template #counts>
      <span [style]="bar + ' gap: 0.5rem;'">
        <andes-tag color="success">10 deleted</andes-tag>
        <andes-tag color="danger">2 failed</andes-tag>
      </span>
    </ng-template>
    <andes-toast-viewport />
  `,
})
class BulkHost extends ToastDemo {
  private readonly counts = viewChild.required<Template>('counts');

  protected async run(): Promise<void> {
    const ref = this.toasts.loading('Deleting 12 invoices...', {
      key: 'bulk',
      duration: false,
      dismissible: false,
    });
    await wait(1800);
    ref.update({
      severity: 'warning',
      title: 'Bulk delete finished',
      message: '10 of 12 invoices were deleted, 2 could not be.',
      messageTemplate: this.counts(),
      dismissible: true,
      duration: false,
      actions: [
        {
          label: 'Retry the 2 failed',
          onClick: () => this.messages.info('Retrying 2 invoices'),
        },
        { label: 'Dismiss', variant: 'ghost', onClick: () => undefined },
      ],
    });
  }
}

const meta: Meta<AndesToastViewport> = {
  title: 'Feedback/Toast/Compositions',
  component: AndesToastViewport,
  tags: ['autodocs'],
  decorators: [withDescription, withToastKit],
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<AndesToastViewport>;

/** A form saved with Undo. */
export const FormSavedWithUndo: Story = {
  name: 'Form saved with Undo',
  parameters: about(
    'Saving a form shows a notification with an Undo action that puts the previous value back.',
  ),
  render: () => ({
    moduleMetadata: { imports: [FormSavedHost] },
    template: `<andes-toast-form-saved />`,
  }),
};

/** An upload that finishes. */
export const UploadFinished: Story = {
  name: 'Upload finished',
  parameters: about(
    'An upload shows a loading notification that turns into a success one with a View action when the file is ready.',
  ),
  render: () => ({
    moduleMetadata: { imports: [UploadHost] },
    template: `<andes-toast-upload />`,
  }),
};

/** Copy to the clipboard. */
export const CopyToClipboard: Story = {
  name: 'Copy to clipboard',
  parameters: about(
    'A short message confirms a copy, and the same key keeps repeated clicks from piling up messages.',
  ),
  render: () => ({
    moduleMetadata: { imports: [CopyHost] },
    template: `<andes-toast-copy />`,
  }),
};

/** A long task with promise(). */
export const LongRunningTask: Story = {
  name: 'Long-running task',
  parameters: about(
    'The promise method shows a loading toast and turns it into a success or an error toast when the promise settles.',
  ),
  render: () => ({
    moduleMetadata: { imports: [LongTaskHost] },
    template: `<andes-toast-long-task />`,
  }),
};

/** A message from a person. */
export const NewMessage: Story = {
  name: 'New message',
  parameters: about(
    'A chat notification with the avatar of the sender, a count in the title and two actions.',
  ),
  render: () => ({
    moduleMetadata: { imports: [NewMessageHost] },
    template: `<andes-toast-new-message />`,
  }),
};

/** A deploy with two actions. */
export const DeployFinished: Story = {
  name: 'Deploy finished',
  parameters: about(
    'A deploy that finished stays open with two actions, View logs as the main one and a danger Roll back.',
  ),
  render: () => ({
    moduleMetadata: { imports: [DeployHost] },
    template: `<andes-toast-deploy />`,
  }),
};

/** A session about to expire. */
export const SessionAboutToExpire: Story = {
  name: 'Session about to expire',
  parameters: about(
    'A warning counts the seconds down in a template, so the screen reader is not interrupted every second, and Stay signed in stops it.',
  ),
  render: () => ({
    moduleMetadata: { imports: [SessionHost] },
    template: `<andes-toast-session />`,
  }),
};

/** Settings saved. */
export const SettingsSaved: Story = {
  name: 'Settings saved',
  parameters: about(
    'Each switch saves on its own and confirms with one message, which a shared key rewrites instead of stacking up.',
  ),
  render: () => ({
    moduleMetadata: { imports: [SettingsHost] },
    template: `<andes-toast-settings />`,
  }),
};

/** An error with Retry. */
export const ErrorWithRetry: Story = {
  name: 'Error with Retry',
  parameters: about(
    'A failed request turns its loading toast into an error with a Retry action that runs it again.',
  ),
  render: () => ({
    moduleMetadata: { imports: [RetryHost] },
    template: `<andes-toast-retry />`,
  }),
};

/** Offline and online. */
export const OfflineAndOnline: Story = {
  name: 'Offline and online',
  parameters: about(
    'Losing the connection pins a warning message that stays until it comes back, then the same key swaps it for a short success message.',
  ),
  render: () => ({
    moduleMetadata: { imports: [NetworkHost] },
    template: `<andes-toast-network />`,
  }),
};

/** Bulk action results. */
export const BulkActionResults: Story = {
  name: 'Bulk action results',
  parameters: about(
    'A bulk action reports how many items worked and how many did not, with tags for the counts and an action to retry the failures.',
  ),
  render: () => ({
    moduleMetadata: { imports: [BulkHost] },
    template: `<andes-toast-bulk />`,
  }),
};
