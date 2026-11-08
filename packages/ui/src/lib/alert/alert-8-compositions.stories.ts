import {
  ChangeDetectionStrategy,
  Component,
  ErrorHandler,
  inject,
  Injectable,
  signal,
} from '@angular/core';
import {
  applicationConfig,
  type Meta,
  type StoryObj,
} from '@storybook/angular';

import {
  about,
  bar,
  column,
  muted,
  withAlertKit,
  withDescription,
} from '../../testing/alert-story-kit';
import { AndesButton } from '../button/button';
import { AndesInput } from '../input/input';
import { AndesAlert } from './alert';

const meta: Meta<AndesAlert> = {
  title: 'Feedback/Alert/Compositions',
  component: AndesAlert,
  decorators: [withDescription, withAlertKit],
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<AndesAlert>;

@Component({
  selector: 'andes-alert-form-summary',
  imports: [AndesAlert, AndesButton, AndesInput],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div [style]="form">
      @if (submitted() && problems().length) {
        <andes-alert severity="danger" role="alert" [title]="summary()">
          <ul [style]="list">
            @for (problem of problems(); track problem) {
              <li>{{ problem }}</li>
            }
          </ul>
        </andes-alert>
      }
      <andes-input
        aria-label="Name"
        placeholder="Name"
        [(value)]="name"
        [status]="submitted() && !name() ? 'error' : undefined"
      />
      <andes-input
        aria-label="Email"
        placeholder="Email"
        [(value)]="email"
        [status]="submitted() && !email() ? 'error' : undefined"
      />
      <div [style]="bar">
        <andes-button (click)="submitted.set(true)">Save</andes-button>
        <andes-button variant="ghost" (click)="reset()">Reset</andes-button>
      </div>
    </div>
  `,
})
class FormSummaryExample {
  protected readonly form =
    'display: flex; flex-direction: column; gap: 0.75rem; max-width: 24rem;';
  protected readonly list = 'margin: 0; padding-inline-start: 1.25rem;';
  protected readonly bar = bar;
  protected readonly name = signal('');
  protected readonly email = signal('');
  protected readonly submitted = signal(false);

  protected readonly problems = () => [
    ...(this.name() ? [] : ['Name is required']),
    ...(this.email() ? [] : ['Email is required']),
  ];

  protected summary(): string {
    const count = this.problems().length;
    return `${count} ${count === 1 ? 'field needs' : 'fields need'} your attention`;
  }

  protected reset(): void {
    this.name.set('');
    this.email.set('');
    this.submitted.set(false);
  }
}

/** Validation summary. */
export const FormSummary: Story = {
  name: 'Form validation summary',
  parameters: about(
    'A danger alert above a form summarises what is wrong, in a list inside the description, when the form is submitted with fields missing.',
  ),
  render: () => ({
    moduleMetadata: { imports: [FormSummaryExample] },
    template: '<andes-alert-form-summary />',
  }),
};

@Component({
  selector: 'andes-alert-notice-list',
  imports: [AndesAlert, AndesButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div [style]="column">
      @for (notice of notices(); track notice.id) {
        <andes-alert
          closable
          [severity]="notice.severity"
          [title]="notice.title"
          [description]="notice.text"
          (afterClose)="remove(notice.id)"
        />
      }
      @if (!notices().length) {
        <span [style]="note">All caught up.</span>
      }
      <div [style]="bar">
        <andes-button variant="outline" size="sm" (click)="restore()"
          >Restore the notices</andes-button
        >
      </div>
    </div>
  `,
})
class NoticeListExample {
  protected readonly column = column;
  protected readonly bar = bar;
  protected readonly note = muted;
  protected readonly notices = signal(initialNotices());

  protected remove(id: number): void {
    this.notices.update((list) => list.filter((n) => n.id !== id));
  }

  protected restore(): void {
    this.notices.set(initialNotices());
  }
}

function initialNotices() {
  return [
    {
      id: 1,
      severity: 'warning' as const,
      title: 'Card expires soon',
      text: 'The card ending in 4242 expires next month.',
    },
    {
      id: 2,
      severity: 'info' as const,
      title: 'New comment',
      text: 'Maria replied to your question on the Q3 budget.',
    },
    {
      id: 3,
      severity: 'success' as const,
      title: 'Backup finished',
      text: "Last night's backup completed without errors.",
    },
  ];
}

/** A list. */
export const NoticeList: Story = {
  name: 'Dismissible notice list',
  parameters: about(
    'A list of notices where each alert collapses on close and the rest slide up, and the list drops it from its data once afterClose fires.',
  ),
  render: () => ({
    moduleMetadata: { imports: [NoticeListExample] },
    template: '<andes-alert-notice-list />',
  }),
};

/** Banner above a page. */
export const PageBanner: Story = {
  name: 'Banner above a page',
  parameters: about(
    'A banner as the first thing in a page or panel, with the small size for a note inside the content below it.',
  ),
  render: () => ({
    props: {
      page: 'border: 1px solid var(--andes-color-border); border-radius: var(--andes-radius-lg); overflow: hidden; max-width: 40rem; background: var(--andes-color-card);',
      body: 'display: flex; flex-direction: column; gap: 0.75rem; padding: 1rem;',
    },
    template: `<div [style]="page">
      <andes-alert banner severity="warning" actionPlacement="end" closable>
        Scheduled maintenance tonight from 22:00 to 23:00.
        <andes-button slot="action" size="xs" variant="outline">Details</andes-button>
      </andes-alert>
      <div [style]="body">
        <strong>Billing</strong>
        <andes-alert size="sm" severity="info" description="Invoices are issued on the first day of each month." />
      </div>
    </div>`,
  }),
};

/** Compact inline notes. */
export const CompactNotes: Story = {
  name: 'Compact notes',
  parameters: about(
    'The small size fits notes beside form fields and in table headers, one 30px line each, with an end action.',
  ),
  render: () => ({
    props: { column },
    template: `<div [style]="column">
      <andes-alert size="sm" severity="warning" actionPlacement="end" closable>
        12 rows have missing values.
        <andes-button slot="action" size="xs" variant="ghost">Review</andes-button>
      </andes-alert>
      <andes-alert size="sm" variant="outlined" severity="success" description="Imported 240 rows." />
      <andes-alert size="sm" variant="solid" severity="danger" description="Import failed: the file is not a CSV." closable />
    </div>`,
  }),
};

/*
 * Angular has no render-time error boundary like React's, and its errors do not stop at a
 * component: whatever a listener, an effect or change detection throws goes to the app's
 * `ErrorHandler`. The idiomatic boundary is therefore a handler that keeps the error in a
 * signal, with an alert that renders it. This one is provided for the story only; a real app
 * provides it once and reads the signal wherever it wants to show the failure.
 */
@Injectable()
class ErrorBoundaryHandler extends ErrorHandler {
  readonly error = signal<Error | null>(null);

  override handleError(error: unknown): void {
    this.error.set(error instanceof Error ? error : new Error(String(error)));
  }
}

@Component({
  selector: 'andes-alert-error-boundary',
  imports: [AndesAlert, AndesButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div [style]="wrap">
      @if (boundary.error(); as error) {
        <andes-alert
          severity="danger"
          role="alert"
          [title]="error.message"
          [description]="error.stack ?? ''"
          [style]="stack"
        />
      } @else {
        <andes-button variant="outline" danger (click)="throwError()"
          >Click to throw an error</andes-button
        >
      }
    </div>
  `,
})
class ErrorBoundaryExample {
  protected readonly wrap = 'max-width: 40rem;';
  protected readonly stack = 'white-space: pre-wrap; overflow-wrap: anywhere;';
  protected readonly boundary = inject(ErrorHandler) as ErrorBoundaryHandler;

  protected throwError(): never {
    throw new Error('An uncaught error');
  }
}

/** Errors in an alert. */
export const ErrorBoundary: Story = {
  name: 'Error boundary',
  parameters: about(
    'An uncaught error reaches the ErrorHandler, which hands it to an alert that shows the message as its title and the stack as its description.',
  ),
  decorators: [
    applicationConfig({
      providers: [{ provide: ErrorHandler, useClass: ErrorBoundaryHandler }],
    }),
  ],
  render: () => ({
    moduleMetadata: { imports: [ErrorBoundaryExample] },
    template: '<andes-alert-error-boundary />',
  }),
};
