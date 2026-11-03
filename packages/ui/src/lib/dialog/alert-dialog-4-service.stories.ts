import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
  type TemplateRef,
  viewChild,
} from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideCircleX,
  lucideShieldCheck,
  lucideTrash2,
} from '@ng-icons/lucide';
import type { Meta, StoryObj } from '@storybook/angular';

import { about, withDescription } from '../../testing/dialog-story-kit';
import { AndesButton } from '../button/button';
import { AndesTag } from '../tag/tag';
import type { AndesAlertDialog } from './alert-dialog';
import type { AndesDialogFooterContext } from './dialog-base';
import {
  type AndesDialogMethodKind,
  type AndesDialogMethodRef,
  AndesDialogService,
} from './dialog.service';

/*
 * The imperative service: dialogs opened from code with confirm(), info(), success(), warning()
 * and error(). The service needs an injection context, so each story drives it from a small
 * component rather than from a template alone.
 */

const meta: Meta<AndesAlertDialog> = {
  title: 'Feedback/Alert Dialog/Service',
  decorators: [withDescription],
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<AndesAlertDialog>;

/** What a service dialog hands the template it renders as its content. */
type MethodContext = { $implicit: AndesDialogMethodRef };

const DEMO_STYLES = `
  .row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem;
  }

  .result {
    margin: 1rem 0 0;
    font-family: var(--andes-font-family), sans-serif;
    font-size: 0.875rem;
    line-height: 1.375rem;
    color: var(--andes-color-muted-foreground);
  }

  .result strong {
    font-weight: 600;
    color: var(--andes-color-foreground);
  }
`;

/** A promise that settles after `ms`, rejecting when `fail` says so. */
function request(ms: number, fail: () => boolean): Promise<void> {
  return new Promise((resolve, reject) =>
    setTimeout(
      () => (fail() ? reject(new Error('Network error')) : resolve()),
      ms,
    ),
  );
}

@Component({
  selector: 'andes-dialog-service-confirm',
  imports: [AndesButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="row">
      <andes-button variant="secondary" (click)="ask()">Confirm</andes-button>
      <andes-button variant="danger" (click)="remove()">Delete</andes-button>
    </div>
    <p class="result">
      Result: <strong>{{ last() }}</strong>
    </p>
  `,
  styles: DEMO_STYLES,
})
class ConfirmDemo {
  private readonly dialogs = inject(AndesDialogService);
  protected readonly last = signal('Nothing yet.');

  protected ask(): void {
    this.dialogs.confirm({
      title: 'Do you want to move these items?',
      content:
        'They go to the Archive workspace, and you can move them back later.',
      onOk: () => this.last.set('Moved.'),
      onCancel: () => this.last.set('Cancelled.'),
    });
  }

  protected remove(): void {
    this.dialogs.confirm({
      title: 'Are you sure you want to delete this task?',
      content: 'The task and its comments are removed for everyone.',
      okText: 'Yes',
      okType: 'danger',
      cancelText: 'No',
      onOk: () => this.last.set('Deleted.'),
      onCancel: () => this.last.set('Kept.'),
    });
  }
}

/** Ask a question from code. */
export const Confirm: Story = {
  name: 'Confirm',
  parameters: about(
    'AndesDialogService.confirm() opens a confirmation from code, with the title and content as text, your labels for OK and Cancel, okType for a destructive one and onOk and onCancel for the answer, and focus starts on Cancel.',
  ),
  render: () => ({
    moduleMetadata: { imports: [ConfirmDemo] },
    template: '<andes-dialog-service-confirm />',
  }),
};

@Component({
  selector: 'andes-dialog-service-acknowledge',
  imports: [AndesButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="row">
      @for (kind of kinds; track kind) {
        <andes-button variant="outline" (click)="show(kind)">{{
          kind
        }}</andes-button>
      }
    </div>
    <p class="result">
      Result: <strong>{{ last() }}</strong>
    </p>
  `,
  styles: DEMO_STYLES,
})
class AcknowledgeDemo {
  private readonly dialogs = inject(AndesDialogService);
  protected readonly kinds: AndesDialogMethodKind[] = [
    'info',
    'success',
    'warning',
    'error',
  ];
  protected readonly last = signal('Nothing yet.');
  private readonly copy: Record<string, [string, string]> = {
    info: [
      'Your export is on its way',
      'We will email you a link when the file is ready.',
    ],
    success: [
      'Payment received',
      'Invoice 1042 is paid, and a receipt is in your inbox.',
    ],
    warning: [
      'Your storage is almost full',
      'You have used 94% of your plan; older files are archived first.',
    ],
    error: [
      'The upload failed',
      'The file is larger than 2 GB, which is the most this plan accepts.',
    ],
  };

  protected async show(kind: AndesDialogMethodKind): Promise<void> {
    const [title, content] = this.copy[kind];
    await this.dialogs[kind]({ title, content }).result;
    this.last.set(`${kind} acknowledged.`);
  }
}

/** Tell the user something. */
export const Acknowledgements: Story = {
  name: 'Acknowledgements',
  parameters: about(
    'info(), success(), warning() and error() tell the user something and have a single OK, each with the filled disc of its kind, and the promise they return settles when the dialog closes.',
  ),
  render: () => ({
    moduleMetadata: { imports: [AcknowledgeDemo] },
    template: '<andes-dialog-service-acknowledge />',
  }),
};

@Component({
  selector: 'andes-dialog-service-ok-cancel',
  imports: [AndesButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="row">
      <andes-button variant="outline" (click)="extend()"
        >warning with okCancel</andes-button
      >
      <andes-button variant="outline" (click)="retry()"
        >error with okCancel</andes-button
      >
    </div>
    <p class="result">
      Result: <strong>{{ last() }}</strong>
    </p>
  `,
  styles: DEMO_STYLES,
})
class OkCancelDemo {
  private readonly dialogs = inject(AndesDialogService);
  protected readonly last = signal('Nothing yet.');

  protected async extend(): Promise<void> {
    const confirmed = await this.dialogs.warning({
      title: 'Your session expires in 5 minutes',
      content: 'Extend it now to keep your unsaved changes.',
      okText: 'Extend session',
      okCancel: true,
      cancelText: 'Sign out',
    }).result;
    this.last.set(confirmed ? 'Extended the session.' : 'Signed out.');
  }

  protected async retry(): Promise<void> {
    const confirmed = await this.dialogs.error({
      title: 'The sync failed',
      content: 'Your changes are kept on this device until the next attempt.',
      okText: 'Try again',
      okCancel: true,
      cancelText: 'Later',
    }).result;
    this.last.set(confirmed ? 'Trying again.' : 'Left for later.');
  }
}

/** A choice on an acknowledgement. */
export const OkAndCancel: Story = {
  name: 'OK and Cancel',
  parameters: about(
    'okCancel adds Cancel next to the OK of an acknowledgement, with labels of your own, so a warning or an error can offer a way out as well as a way on.',
  ),
  render: () => ({
    moduleMetadata: { imports: [OkCancelDemo] },
    template: '<andes-dialog-service-ok-cancel />',
  }),
};

@Component({
  selector: 'andes-dialog-service-async',
  imports: [AndesButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="row">
      <andes-button variant="danger" (click)="promise()"
        >OK returns a promise</andes-button
      >
      <andes-button variant="secondary" (click)="failing()"
        >The first try rejects</andes-button
      >
      <andes-button variant="secondary" (click)="manual()"
        >OK closes by hand</andes-button
      >
    </div>
    <p class="result">
      Result: <strong>{{ last() }}</strong>
    </p>
  `,
  styles: DEMO_STYLES,
})
class AsyncDemo {
  private readonly dialogs = inject(AndesDialogService);
  protected readonly last = signal('Nothing yet.');

  protected async promise(): Promise<void> {
    const confirmed = await this.dialogs.confirm({
      title: 'Delete this project?',
      content:
        'OK spins for 1.5 seconds while the deletion runs, then the dialog closes.',
      okText: 'Delete',
      okType: 'danger',
      onOk: () => request(1500, () => false),
    }).result;
    this.last.set(confirmed ? 'Deleted.' : 'Kept.');
  }

  protected failing(): void {
    let attempts = 0;
    this.dialogs.confirm({
      title: 'Sync now?',
      content:
        'The first attempt fails and the dialog stays open; press Sync again and it succeeds.',
      okText: 'Sync',
      onOk: async () => {
        attempts += 1;
        this.last.set(`Attempt ${attempts}...`);
        try {
          await request(800, () => attempts === 1);
          this.last.set(`Synced on attempt ${attempts}.`);
        } catch (error) {
          this.last.set(`Attempt ${attempts} failed; the dialog stays open.`);
          throw error;
        }
      },
    });
  }

  protected async manual(): Promise<void> {
    const confirmed = await this.dialogs.confirm({
      title: 'Publish to all stores?',
      content:
        'An onOk that takes close decides when to close: this one waits a second, then calls it.',
      okText: 'Publish',
      onOk: (close) => {
        this.last.set('Publishing...');
        setTimeout(close, 1000);
      },
    }).result;
    this.last.set(confirmed ? 'Published.' : 'Not published.');
  }
}

/** Work that takes a while. */
export const AsyncOk: Story = {
  name: 'Async OK',
  parameters: about(
    'An onOk that returns a promise keeps the dialog open with OK in its loading state until it settles, rejecting keeps it open for another try, and an onOk that takes a close parameter decides for itself when to close.',
  ),
  render: () => ({
    moduleMetadata: { imports: [AsyncDemo] },
    template: '<andes-dialog-service-async />',
  }),
};

@Component({
  selector: 'andes-dialog-service-update',
  imports: [AndesButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="row">
      <andes-button variant="secondary" (click)="countdown()"
        >update() and destroy()</andes-button
      >
      <andes-button variant="secondary" (click)="stack()"
        >destroyAll()</andes-button
      >
    </div>
    <p class="result">
      Result: <strong>{{ last() }}</strong>
    </p>
    <ng-template #destroyAll>
      <andes-button variant="danger" (click)="dialogs.destroyAll()"
        >Destroy all three</andes-button
      >
    </ng-template>
  `,
  styles: DEMO_STYLES,
})
class UpdateDemo {
  protected readonly dialogs = inject(AndesDialogService);
  private readonly destroyAllContent =
    viewChild.required<TemplateRef<MethodContext>>('destroyAll');
  protected readonly last = signal('Nothing yet.');

  protected countdown(): void {
    let seconds = 5;
    const text = () => `This dialog destroys itself in ${seconds} seconds.`;
    const ref = this.dialogs.success({ title: 'Saved', content: text() });
    const timer = setInterval(() => {
      seconds -= 1;
      ref.update({ content: text() });
      if (seconds <= 0) {
        clearInterval(timer);
        ref.destroy();
        this.last.set('Destroyed after 5 seconds.');
      }
    }, 1000);
    void ref.result.then(() => clearInterval(timer));
  }

  protected stack(): void {
    for (let i = 0; i < 3; i += 1) {
      setTimeout(() => {
        this.dialogs.confirm({
          title: `Confirmation ${i + 1} of 3`,
          content: this.destroyAllContent(),
          onCancel: () => this.last.set('Closed one of them.'),
        });
      }, i * 400);
    }
  }
}

/** Change a dialog that is open. */
export const UpdateAndDestroy: Story = {
  name: 'Update and destroy',
  parameters: about(
    'The ref a service call returns can update() the open dialog and destroy() it without running its handlers, and destroyAll() closes every dialog the service has open, say on a route change.',
  ),
  render: () => ({
    moduleMetadata: { imports: [UpdateDemo] },
    template: '<andes-dialog-service-update />',
  }),
};

@Component({
  selector: 'andes-dialog-service-custom',
  imports: [AndesButton, NgIcon, NgTemplateOutlet],
  viewProviders: [
    provideIcons({ lucideCircleX, lucideShieldCheck, lucideTrash2 }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="row">
      <andes-button variant="secondary" (click)="icon()"
        >Custom icon</andes-button
      >
      <andes-button variant="secondary" (click)="buttonProps()"
        >Button props and close icon</andes-button
      >
      <andes-button variant="secondary" (click)="footer()"
        >Footer with the default buttons</andes-button
      >
    </div>
    <p class="result">
      Result: <strong>{{ last() }}</strong>
    </p>

    <ng-template #shield>
      <ng-icon name="lucideShieldCheck" size="1.375rem" aria-hidden="true" />
    </ng-template>
    <ng-template #closeIcon>
      <ng-icon name="lucideCircleX" size="1rem" aria-hidden="true" />
    </ng-template>
    <ng-template
      #extendedFooter
      let-buttons="defaultButtons"
      let-cancel="cancel"
    >
      <andes-button
        variant="ghost"
        style="margin-inline-end: auto"
        (click)="last.set('Remind me later.'); cancel()"
        >Remind me later</andes-button
      >
      <ng-container *ngTemplateOutlet="buttons" />
    </ng-template>
  `,
  styles: DEMO_STYLES,
})
class CustomDemo {
  private readonly dialogs = inject(AndesDialogService);
  private readonly shield = viewChild.required<TemplateRef<unknown>>('shield');
  private readonly closeIcon =
    viewChild.required<TemplateRef<unknown>>('closeIcon');
  private readonly extendedFooter =
    viewChild.required<TemplateRef<AndesDialogFooterContext>>('extendedFooter');
  protected readonly last = signal('Nothing yet.');

  protected async icon(): Promise<void> {
    await this.dialogs.info({
      title: 'Two-step sign-in is on',
      content:
        'The icon is a template of yours; the title and the buttons are the dialog’s.',
      icon: this.shield(),
    }).result;
    this.last.set('Acknowledged.');
  }

  protected async buttonProps(): Promise<void> {
    const confirmed = await this.dialogs.confirm({
      title: 'Discard 12 unsaved rows?',
      content:
        'Small buttons, a Cancel that is only text and a close icon of your own.',
      okText: 'Discard',
      okType: 'danger',
      okButtonProps: { size: 'sm' },
      cancelButtonProps: { size: 'sm', variant: 'ghost' },
      closable: true,
      closeIcon: this.closeIcon(),
    }).result;
    this.last.set(confirmed ? 'Discarded.' : 'Kept.');
  }

  protected async footer(): Promise<void> {
    const confirmed = await this.dialogs.warning({
      title: 'Your session expires in 5 minutes',
      content: 'Extend it now to keep your unsaved changes.',
      okText: 'Extend session',
      okCancel: true,
      cancelText: 'Sign out',
      footer: this.extendedFooter(),
    }).result;
    if (this.last() !== 'Remind me later.') {
      this.last.set(confirmed ? 'Extended the session.' : 'Signed out.');
    }
  }
}

/** Make it your own. */
export const CustomIconsAndButtonProps: Story = {
  name: 'Custom icons and button props',
  parameters: about(
    'icon replaces the status disc with a template, okButtonProps and cancelButtonProps reach the size and the variant of the buttons, closeIcon swaps the glyph of the close button and a footer template can put an action beside the default buttons.',
  ),
  render: () => ({
    moduleMetadata: { imports: [CustomDemo] },
    template: '<andes-dialog-service-custom />',
  }),
};

@Component({
  selector: 'andes-dialog-service-content',
  imports: [AndesButton, AndesTag],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="row">
      <andes-button variant="secondary" (click)="summary()"
        >Template content</andes-button
      >
      <andes-button variant="secondary" (click)="context()"
        >Content that reads its own ref</andes-button
      >
    </div>
    <p class="result">
      Result: <strong>{{ last() }}</strong>
    </p>

    <ng-template #summaryContent>
      <ul style="margin: 0; padding-inline-start: 1.25rem;">
        <li>3 files changed</li>
        <li>1 reviewer requested</li>
        <li><andes-tag color="success">All checks passed</andes-tag></li>
      </ul>
    </ng-template>
    <ng-template #refContent let-ref>
      <andes-button
        variant="secondary"
        size="sm"
        (click)="ref.destroy(); last.set('Destroyed from its own content.')"
        >Close from inside</andes-button
      >
    </ng-template>
  `,
  styles: DEMO_STYLES,
})
class ContentDemo {
  private readonly dialogs = inject(AndesDialogService);
  private readonly summaryContent =
    viewChild.required<TemplateRef<MethodContext>>('summaryContent');
  private readonly refContent =
    viewChild.required<TemplateRef<MethodContext>>('refContent');
  protected readonly last = signal('Nothing yet.');

  protected summary(): void {
    this.dialogs.info({
      title: 'Pull request summary',
      content: this.summaryContent(),
      closable: true,
      centered: false,
    });
    this.last.set('Opened a summary near the top.');
  }

  protected context(): void {
    this.dialogs.info({
      title: 'A template knows its dialog',
      content: this.refContent(),
    });
  }
}

/** More than a line of text. */
export const TemplateContent: Story = {
  name: 'Template content',
  parameters: about(
    'The title and the content can be templates instead of text, a template is given the ref of its dialog so it can update or destroy it, and closable and centered=false show the close button and park the dialog near the top.',
  ),
  render: () => ({
    moduleMetadata: { imports: [ContentDemo] },
    template: '<andes-dialog-service-content />',
  }),
};

@Component({
  selector: 'andes-dialog-service-dismissal',
  imports: [AndesButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="row">
      <andes-button variant="secondary" (click)="mask()"
        >Mask closes it, blurred</andes-button
      >
      <andes-button variant="secondary" (click)="keyboard()"
        >Escape is refused</andes-button
      >
      <andes-button variant="secondary" (click)="noMask()"
        >No mask</andes-button
      >
    </div>
    <p class="result">
      Result: <strong>{{ last() }}</strong>
    </p>
  `,
  styles: DEMO_STYLES,
})
class DismissalDemo {
  private readonly dialogs = inject(AndesDialogService);
  protected readonly last = signal('Nothing yet.');

  protected async mask(): Promise<void> {
    const confirmed = await this.dialogs.info({
      title: 'Click anywhere outside to dismiss',
      content:
        'maskClosable lets the mask close an acknowledgement, and maskBlur frosts the page behind it.',
      maskClosable: true,
      maskBlur: true,
    }).result;
    this.last.set(`info ${confirmed ? 'confirmed' : 'dismissed'}.`);
  }

  protected async keyboard(): Promise<void> {
    const confirmed = await this.dialogs.confirm({
      title: 'Leave the checkout?',
      content: 'keyboard is off, so only the two buttons can answer.',
      keyboard: false,
    }).result;
    this.last.set(confirmed ? 'Left the checkout.' : 'Stayed.');
  }

  protected async noMask(): Promise<void> {
    await this.dialogs.success({
      title: 'Settings saved',
      content: 'mask is off: no scrim, but focus is still trapped.',
      mask: false,
    }).result;
    this.last.set('Acknowledged.');
  }
}

/** Ways to dismiss. */
export const MaskAndKeyboard: Story = {
  name: 'Mask and keyboard',
  parameters: about(
    'Service dialogs refuse a click on the mask by default so the user has to answer, and maskClosable, maskBlur, mask and keyboard change that for the cases where nothing is lost by dismissing.',
  ),
  render: () => ({
    moduleMetadata: { imports: [DismissalDemo] },
    template: '<andes-dialog-service-dismissal />',
  }),
};

@Component({
  selector: 'andes-dialog-service-outcome',
  imports: [AndesButton, AndesTag],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="row">
      <andes-button variant="danger" (click)="confirm()"
        >confirm()</andes-button
      >
      <andes-button variant="outline" (click)="inform()">info()</andes-button>
      <andes-button variant="ghost" (click)="log.set([])"
        >Clear the log</andes-button
      >
    </div>
    <div class="row" style="margin-top: 1rem;">
      @for (entry of log(); track $index) {
        <andes-tag [color]="entry.confirmed ? 'success' : 'default'">{{
          entry.text
        }}</andes-tag>
      } @empty {
        <span class="result"
          >Open a dialog and answer it in different ways.</span
        >
      }
    </div>
  `,
  styles: DEMO_STYLES,
})
class OutcomeDemo {
  private readonly dialogs = inject(AndesDialogService);
  protected readonly log = signal<{ text: string; confirmed: boolean }[]>([]);

  protected async confirm(): Promise<void> {
    const confirmed = await this.dialogs.confirm({
      title: 'Delete the 4 selected rows?',
      content:
        'OK resolves the promise with true; Cancel, the close button and Escape with false.',
      okText: 'Delete',
      okType: 'danger',
      closable: true,
    }).result;
    this.push('confirm()', confirmed);
  }

  protected async inform(): Promise<void> {
    const confirmed = await this.dialogs.info({
      title: 'Heads up',
      content:
        'An acknowledgement resolves with true on OK and with false when it is destroyed or dismissed.',
      closable: true,
    }).result;
    this.push('info()', confirmed);
  }

  private push(kind: string, confirmed: boolean): void {
    this.log.update((entries) => [
      ...entries.slice(-5),
      { text: `${kind} resolved ${confirmed}`, confirmed },
    ]);
  }
}

/** How a dialog was answered. */
export const PromiseOutcome: Story = {
  name: 'Promise outcome',
  parameters: about(
    'The result of a service call is a promise that settles when the dialog closes, true if it closed through OK and false for any other way out, so the code that asked can simply await the answer, and the log keeps the last six.',
  ),
  render: () => ({
    moduleMetadata: { imports: [OutcomeDemo] },
    template: '<andes-dialog-service-outcome />',
  }),
};
