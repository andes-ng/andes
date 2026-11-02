import {
  Component,
  effect,
  inject,
  signal,
  TemplateRef,
  viewChild,
} from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular';

import { AndesButton } from '../button/button';
import { AndesCheckbox } from '../checkbox/checkbox';
import { AndesInputNumber } from '../input-number/input-number';
import { AndesToastService } from './toast.service';
import type {
  AndesToastConfig,
  AndesToastPosition,
  AndesToastSeverity,
  AndesToastTemplateContext,
} from './toast.types';
import { AndesToastViewport } from './toast-viewport';

const BAR_STYLE =
  'display: flex; gap: 0.75rem; flex-wrap: wrap; align-items: center; padding: 1rem 2rem; font-family: var(--andes-font-family), sans-serif; font-size: 0.875rem;';
const NOTE_STYLE =
  'padding: 0 2rem; font-family: var(--andes-font-family), sans-serif; color: var(--andes-color-muted-foreground); font-size: 0.875rem;';
const DESCRIPTION =
  'This is the content of the notification. This is the content of the notification. This is the content of the notification.';

@Component({
  selector: 'andes-notification-hooks-usage',
  imports: [AndesButton, AndesToastViewport],
  template: `
    <div [style]="barStyle">
      <andes-button (click)="open('top-left')">top-left</andes-button>
      <andes-button (click)="open('top-right')">top-right</andes-button>
    </div>
    <div [style]="barStyle">
      <andes-button (click)="open('bottom-left')">bottom-left</andes-button>
      <andes-button (click)="open('bottom-right')">bottom-right</andes-button>
    </div>
    <ng-template #greeting>Hello, {{ name() }}!</ng-template>
    <andes-toast-viewport />
  `,
})
class HooksUsageHost {
  private readonly toasts = inject(AndesToastService);
  protected readonly barStyle = BAR_STYLE;
  /** Read by the template below: it renders with this component's own context. */
  protected readonly name = signal('Andes NG');
  private readonly greeting =
    viewChild.required<TemplateRef<AndesToastTemplateContext>>('greeting');

  protected open(placement: AndesToastPosition): void {
    this.toasts.info(`Hello, ${this.name()}!`, {
      title: `Notification ${placement}`,
      messageTemplate: this.greeting(),
      placement,
    });
  }
}

@Component({
  selector: 'andes-notification-duration',
  imports: [AndesButton, AndesToastViewport],
  template: `
    <div [style]="barStyle">
      <andes-button (click)="open()">Open the notification box</andes-button>
    </div>
    <andes-toast-viewport />
  `,
})
class DurationHost {
  private readonly toasts = inject(AndesToastService);
  protected readonly barStyle = BAR_STYLE;

  protected open(): void {
    this.toasts.show({
      title: 'Notification Title',
      message:
        'I will never close automatically. This is a purposely very very long description that has many many characters and words.',
      duration: false,
    });
  }
}

@Component({
  selector: 'andes-notification-icon',
  imports: [AndesButton, AndesToastViewport],
  template: `
    <div [style]="barStyle">
      @for (type of types; track type) {
        <andes-button variant="outline" (click)="open(type)">{{
          type
        }}</andes-button>
      }
    </div>
    <andes-toast-viewport />
  `,
})
class IconHost {
  private readonly toasts = inject(AndesToastService);
  protected readonly barStyle = BAR_STYLE;
  protected readonly types: readonly AndesToastSeverity[] = [
    'success',
    'info',
    'warning',
    'error',
  ];

  protected open(severity: AndesToastSeverity): void {
    this.toasts.show({
      title: 'Notification Title',
      message: DESCRIPTION,
      severity,
    });
  }
}

@Component({
  selector: 'andes-notification-custom-close',
  imports: [AndesButton, AndesToastViewport],
  template: `
    <div [style]="barStyle">
      <andes-button (click)="open()">Open the notification box</andes-button>
    </div>
    <p [style]="noteStyle">{{ status() }}</p>
    <ng-template #buttons let-toast let-close="close">
      <andes-button size="sm" variant="ghost" (click)="toasts.destroy()">
        Destroy All
      </andes-button>
      <andes-button size="sm" (click)="close()">Confirm</andes-button>
    </ng-template>
    <andes-toast-viewport />
  `,
})
class CustomCloseHost {
  protected readonly toasts = inject(AndesToastService);
  protected readonly barStyle = BAR_STYLE;
  protected readonly noteStyle = NOTE_STYLE;
  protected readonly status = signal('');
  private readonly buttons =
    viewChild.required<TemplateRef<AndesToastTemplateContext>>('buttons');

  protected open(): void {
    this.toasts.show({
      title: 'Notification Title',
      message:
        'A function will be be called after the notification is closed (automatically after the "duration" time of manually).',
      actionsTemplate: this.buttons(),
      key: `open${Date.now()}`,
      onClose: (reason) =>
        this.status.set(
          `Notification was closed (${reason}). Either the close button was clicked or the duration elapsed.`,
        ),
    });
  }
}

@Component({
  selector: 'andes-notification-custom-icon',
  imports: [AndesButton, AndesToastViewport],
  template: `
    <div [style]="barStyle">
      <andes-button (click)="open()">Open the notification box</andes-button>
    </div>
    <ng-template #smile>
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#108ee9"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01" />
      </svg>
    </ng-template>
    <andes-toast-viewport />
  `,
})
class CustomIconHost {
  private readonly toasts = inject(AndesToastService);
  protected readonly barStyle = BAR_STYLE;
  private readonly smile =
    viewChild.required<TemplateRef<AndesToastTemplateContext>>('smile');

  protected open(): void {
    this.toasts.show({
      title: 'Notification Title',
      message: DESCRIPTION,
      icon: this.smile(),
    });
  }
}

@Component({
  selector: 'andes-notification-placement',
  imports: [AndesButton, AndesToastViewport],
  template: `
    <div [style]="barStyle">
      <andes-button (click)="open('top-center')">top-center</andes-button>
      <andes-button (click)="open('bottom-center')">bottom-center</andes-button>
    </div>
    <div [style]="barStyle">
      <andes-button (click)="open('top-left')">top-left</andes-button>
      <andes-button (click)="open('top-right')">top-right</andes-button>
    </div>
    <div [style]="barStyle">
      <andes-button (click)="open('bottom-left')">bottom-left</andes-button>
      <andes-button (click)="open('bottom-right')">bottom-right</andes-button>
    </div>
    <andes-toast-viewport />
  `,
})
class PlacementHost {
  private readonly toasts = inject(AndesToastService);
  protected readonly barStyle = BAR_STYLE;

  protected open(placement: AndesToastPosition): void {
    this.toasts.info(DESCRIPTION, {
      title: `Notification ${placement}`,
      placement,
    });
  }
}

@Component({
  selector: 'andes-notification-update',
  imports: [AndesButton, AndesToastViewport],
  template: `
    <div [style]="barStyle">
      <andes-button (click)="open()">Open the notification box</andes-button>
    </div>
    <andes-toast-viewport />
  `,
})
class UpdateHost {
  private readonly toasts = inject(AndesToastService);
  protected readonly barStyle = BAR_STYLE;

  protected open(): void {
    const key = 'updatable';
    this.toasts.show({
      key,
      title: 'Notification Title',
      message: 'description.',
    });
    setTimeout(
      () =>
        this.toasts.show({
          key,
          title: 'New Title',
          message: 'New description.',
        }),
      1000,
    );
  }
}

@Component({
  selector: 'andes-notification-stack',
  imports: [AndesButton, AndesCheckbox, AndesInputNumber, AndesToastViewport],
  template: `
    <div [style]="barStyle">
      <andes-checkbox [(checked)]="enabled">Enabled</andes-checkbox>
      <span [style]="labelStyle">
        Threshold:
        <andes-input-number
          aria-label="Stack threshold"
          size="sm"
          style="width: 5rem;"
          [min]="1"
          [max]="10"
          [disabled]="!enabled()"
          [(value)]="threshold"
        />
      </span>
    </div>
    <div [style]="barStyle">
      <andes-button (click)="open()">Open the notification box</andes-button>
      <andes-button variant="outline" (click)="toasts.destroy()">
        Destroy all
      </andes-button>
    </div>
    <andes-toast-viewport />
  `,
})
class StackHost {
  protected readonly toasts = inject(AndesToastService);
  protected readonly barStyle = BAR_STYLE;
  protected readonly labelStyle =
    'display: flex; align-items: center; gap: 0.5rem;';
  protected readonly enabled = signal(true);
  protected readonly threshold = signal<number | string | null>(3);

  constructor() {
    this.toasts.config({ maxCount: 10 });
    effect(() => {
      const threshold = Number(this.threshold()) || 1;
      this.toasts.config({
        stack: this.enabled() ? { threshold } : false,
      });
    });
  }

  protected open(): void {
    const lines = Math.round(Math.random() * 5) + 1;
    this.toasts.info(
      Array.from(
        { length: lines },
        () => 'This is the content of the notification.',
      ).join(' '),
      { title: 'Notification Title', duration: false },
    );
  }
}

@Component({
  selector: 'andes-notification-progress',
  imports: [AndesButton, AndesToastViewport],
  template: `
    <div [style]="barStyle">
      <andes-button (click)="open(true)">Pause on hover</andes-button>
      <andes-button (click)="open(false)">Don't pause on hover</andes-button>
    </div>
    <andes-toast-viewport />
  `,
})
class ProgressHost {
  private readonly toasts = inject(AndesToastService);
  protected readonly barStyle = BAR_STYLE;

  protected open(pauseOnHover: boolean): void {
    this.toasts.show({
      title: 'Notification Title',
      message: DESCRIPTION,
      showProgress: true,
      pauseOnHover,
    });
  }
}

@Component({
  selector: 'andes-notification-progress-color',
  imports: [AndesButton, AndesToastViewport],
  template: `
    <div [style]="barStyle">
      <andes-button (click)="open()">Show custom progress color</andes-button>
    </div>
    <andes-toast-viewport />
  `,
})
class ProgressColorHost {
  private readonly toasts = inject(AndesToastService);
  protected readonly barStyle = BAR_STYLE;

  protected open(): void {
    this.toasts.show({
      title: 'Customize progress bar color',
      message:
        'Set --andes-toast-progress-bg on the toast, or on any ancestor, to colour the line on the card edge.',
      showProgress: true,
      duration: 20_000,
      style: {
        '--andes-toast-progress-bg': '#6253e1',
      },
    });
  }
}

const SEMANTIC_STYLES: NonNullable<AndesToastConfig['styles']> = {
  root: {
    backgroundColor: '#f6ffed',
    border: '2px solid #95de64',
    borderRadius: '16px',
    boxShadow: '4px 4px 0 #d9f7be',
  },
  icon: { color: '#237804' },
  title: { color: '#237804', fontWeight: '600' },
  description: { color: '#3f6600' },
};

const ERROR_STYLES: NonNullable<AndesToastConfig['styles']> = {
  ...SEMANTIC_STYLES,
  root: {
    ...SEMANTIC_STYLES.root,
    backgroundColor: '#fff2f0',
    borderColor: '#ffccc7',
    boxShadow: '4px 4px 0 #ffccc7',
  },
  icon: { color: '#cf1322' },
  title: { color: '#cf1322', fontWeight: '600' },
  description: { color: '#5c0011' },
};

@Component({
  selector: 'andes-notification-semantic',
  imports: [AndesButton, AndesToastViewport],
  template: `
    <div [style]="barStyle">
      <andes-button (click)="openDefault()">Default Notification</andes-button>
      <andes-button variant="outline" (click)="openError()">
        Error Notification
      </andes-button>
    </div>
    <andes-toast-viewport />
  `,
})
class SemanticHost {
  private readonly toasts = inject(AndesToastService);
  protected readonly barStyle = BAR_STYLE;
  private readonly shared = {
    title: 'Notification Title',
    message: 'This is a notification description.',
    duration: false,
  } as const;

  protected openDefault(): void {
    this.toasts.info(this.shared.message, {
      ...this.shared,
      styles: SEMANTIC_STYLES,
    });
  }

  /** The styles can depend on the severity: pick them where the notification is opened. */
  protected openError(): void {
    this.toasts.error(this.shared.message, {
      ...this.shared,
      styles: ERROR_STYLES,
    });
  }
}

@Component({
  selector: 'andes-notification-closable',
  imports: [AndesButton, AndesToastViewport],
  template: `
    <div [style]="barStyle">
      <andes-button variant="outline" (click)="customGlyph()">
        Custom close icon
      </andes-button>
      <andes-button variant="outline" (click)="notClosable()">
        Not closable
      </andes-button>
    </div>
    <p [style]="noteStyle">{{ status() }}</p>
    <ng-template #closeGlyph>
      <span style="font-size: 0.75rem; font-weight: 600;">ESC</span>
    </ng-template>
    <andes-toast-viewport />
  `,
})
class ClosableHost {
  private readonly toasts = inject(AndesToastService);
  protected readonly barStyle = BAR_STYLE;
  protected readonly noteStyle = NOTE_STYLE;
  protected readonly status = signal('');
  private readonly closeGlyph =
    viewChild.required<TemplateRef<AndesToastTemplateContext>>('closeGlyph');

  protected customGlyph(): void {
    this.toasts.info('The close button shows your own glyph.', {
      title: 'closeIcon',
      closeIcon: this.closeGlyph(),
      onClose: (reason) => this.status.set(`Closed (${reason}).`),
    });
  }

  protected notClosable(): void {
    this.toasts.warning('There is no close button; it closes in 4 seconds.', {
      title: 'dismissible: false',
      dismissible: false,
      duration: 4000,
      onClose: (reason) => this.status.set(`Closed (${reason}).`),
    });
  }
}

const meta: Meta = {
  title: 'Feedback/Toast/Examples/Notification',
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
};

export default meta;

type Story = StoryObj;

/**
 * Inject `AndesToastService` anywhere and call `info()` with a `placement`; the template in
 * `messageTemplate` renders with its own component's context.
 */
export const HooksUsage: Story = {
  name: 'Hooks usage (recommended)',
  render: () => ({
    moduleMetadata: { imports: [HooksUsageHost] },
    template: `<andes-notification-hooks-usage />`,
  }),
};

/** `duration` sets how long a notification stays open, and `false` keeps it open until it is closed. */
export const DurationAfterWhichTheNotificationBoxIsClosed: Story = {
  name: 'Duration after which the notification box is closed',
  render: () => ({
    moduleMetadata: { imports: [DurationHost] },
    template: `<andes-notification-duration />`,
  }),
};

/** A notification box with a status icon at the left side. */
export const NotificationWithIcon: Story = {
  name: 'Notification with icon',
  render: () => ({
    moduleMetadata: { imports: [IconHost] },
    template: `<andes-notification-icon />`,
  }),
};

/** Replace the actions row with your own buttons, using the template's `close()` to dismiss. */
export const CustomCloseButton: Story = {
  name: 'Custom close button',
  render: () => ({
    moduleMetadata: { imports: [CustomCloseHost] },
    template: `<andes-notification-custom-close />`,
  }),
};

/** The icon can be customized to any template. */
export const CustomizedIcon: Story = {
  name: 'Customized Icon',
  render: () => ({
    moduleMetadata: { imports: [CustomIconHost] },
    template: `<andes-notification-custom-icon />`,
  }),
};

/** A notification box can appear from any of the six placements via `placement`. */
export const Placement: Story = {
  render: () => ({
    moduleMetadata: { imports: [PlacementHost] },
    template: `<andes-notification-placement />`,
  }),
};

/** Update content with a unique `key`. */
export const UpdateMessageContent: Story = {
  name: 'Update Message Content',
  render: () => ({
    moduleMetadata: { imports: [UpdateHost] },
    template: `<andes-notification-update />`,
  }),
};

/**
 * Notifications stack once there are more than `threshold` of them; up to three cards show in
 * the collapsed stack, and hovering it expands them.
 */
export const Stack: Story = {
  render: () => ({
    moduleMetadata: { imports: [StackHost] },
    template: `<andes-notification-stack />`,
  }),
};

/** Show a progress bar for an auto-closing notification, with or without pausing on hover. */
export const ShowWithProgress: Story = {
  name: 'Show with progress',
  render: () => ({
    moduleMetadata: { imports: [ProgressHost] },
    template: `<andes-notification-progress />`,
  }),
};

/** Customize the progress bar color through the `--andes-toast-progress-bg` custom property. */
export const CustomizeProgressBarColor: Story = {
  name: 'Customize progress bar color',
  render: () => ({
    moduleMetadata: { imports: [ProgressColorHost] },
    template: `<andes-notification-progress-color />`,
  }),
};

/** Style each part of a notification with `classNames` and `styles`. */
export const CustomSemanticStyles: Story = {
  name: 'Custom semantic styles',
  render: () => ({
    moduleMetadata: { imports: [SemanticHost] },
    template: `<andes-notification-semantic />`,
  }),
};

/** Show a custom close glyph with `closeIcon`, or no close button at all with `dismissible: false`. */
export const ClosableType: Story = {
  name: 'ClosableType',
  render: () => ({
    moduleMetadata: { imports: [ClosableHost] },
    template: `<andes-notification-closable />`,
  }),
};
