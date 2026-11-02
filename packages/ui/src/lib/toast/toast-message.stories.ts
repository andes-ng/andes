import { Component, effect, inject, signal } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular';

import { AndesButton } from '../button/button';
import { AndesCheckbox } from '../checkbox/checkbox';
import { AndesInputNumber } from '../input-number/input-number';
import { AndesMessageService } from './message.service';
import type { AndesMessageConfig } from './toast.types';
import { AndesToastViewport } from './toast-viewport';

const BAR_STYLE =
  'display: flex; gap: 0.75rem; flex-wrap: wrap; align-items: center; padding: 2rem; font-family: var(--andes-font-family), sans-serif; font-size: 0.875rem;';

@Component({
  selector: 'andes-message-hooks-usage',
  imports: [AndesButton, AndesToastViewport],
  template: `
    <div [style]="barStyle">
      <andes-button (click)="info()">Display normal message</andes-button>
    </div>
    <andes-toast-viewport />
  `,
})
class HooksUsageHost {
  private readonly messages = inject(AndesMessageService);
  protected readonly barStyle = BAR_STYLE;

  protected info(): void {
    this.messages.info('Hello, Andes NG!');
  }
}

@Component({
  selector: 'andes-message-other-types',
  imports: [AndesButton, AndesToastViewport],
  template: `
    <div [style]="barStyle">
      <andes-button variant="outline" (click)="success()">Success</andes-button>
      <andes-button variant="outline" (click)="error()">Error</andes-button>
      <andes-button variant="outline" (click)="warning()">Warning</andes-button>
    </div>
    <andes-toast-viewport />
  `,
})
class OtherTypesHost {
  private readonly messages = inject(AndesMessageService);
  protected readonly barStyle = BAR_STYLE;

  protected success(): void {
    this.messages.open({
      type: 'success',
      content: 'This is a success message',
    });
  }

  protected error(): void {
    this.messages.open({ type: 'error', content: 'This is an error message' });
  }

  protected warning(): void {
    this.messages.open({
      type: 'warning',
      content: 'This is a warning message',
    });
  }
}

@Component({
  selector: 'andes-message-duration',
  imports: [AndesButton, AndesToastViewport],
  template: `
    <div [style]="barStyle">
      <andes-button variant="outline" (click)="success()">
        Customized display duration
      </andes-button>
    </div>
    <andes-toast-viewport />
  `,
})
class DurationHost {
  private readonly messages = inject(AndesMessageService);
  protected readonly barStyle = BAR_STYLE;

  protected success(): void {
    this.messages.open({
      type: 'success',
      content:
        'This is a prompt message for success, and it will disappear in 10 seconds',
      duration: 10_000,
    });
  }
}

@Component({
  selector: 'andes-message-stack',
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
      <andes-button (click)="open()">Open the message box</andes-button>
      <andes-button variant="outline" (click)="messages.destroy()">
        Destroy all
      </andes-button>
    </div>
    <andes-toast-viewport />
  `,
})
class StackHost {
  protected readonly messages = inject(AndesMessageService);
  protected readonly barStyle = BAR_STYLE;
  protected readonly labelStyle =
    'display: flex; align-items: center; gap: 0.5rem;';
  protected readonly enabled = signal(true);
  protected readonly threshold = signal<number | string | null>(3);
  private count = 0;

  constructor() {
    effect(() => {
      const threshold = Number(this.threshold()) || 1;
      this.messages.config({
        stack: this.enabled() ? { threshold } : false,
      });
    });
  }

  protected open(): void {
    this.count++;
    this.messages.open({
      type: 'info',
      content:
        this.count % 2
          ? `Message ${this.count}: This is a stacked message.`
          : `Message ${this.count}: This is a slightly longer stacked message.`,
      duration: false,
    });
  }
}

@Component({
  selector: 'andes-message-loading',
  imports: [AndesButton, AndesToastViewport],
  template: `
    <div [style]="barStyle">
      <andes-button variant="outline" (click)="show()">
        Display a loading indicator
      </andes-button>
    </div>
    <andes-toast-viewport />
  `,
})
class LoadingHost {
  private readonly messages = inject(AndesMessageService);
  protected readonly barStyle = BAR_STYLE;

  protected show(): void {
    this.messages.open({
      type: 'loading',
      content: 'Action in progress..',
      duration: false,
    });
    // Dismiss manually and asynchronously.
    setTimeout(() => this.messages.destroy(), 2500);
  }
}

@Component({
  selector: 'andes-message-promise',
  imports: [AndesButton, AndesToastViewport],
  template: `
    <div [style]="barStyle">
      <andes-button variant="outline" (click)="show()">
        Display sequential messages
      </andes-button>
    </div>
    <andes-toast-viewport />
  `,
})
class PromiseHost {
  private readonly messages = inject(AndesMessageService);
  protected readonly barStyle = BAR_STYLE;

  protected show(): void {
    void this.messages
      .open({
        type: 'loading',
        content: 'Action in progress..',
        duration: 2500,
      })
      .afterClosed.then(
        () =>
          this.messages.success('Loading finished', { duration: 2500 })
            .afterClosed,
      )
      .then(() => this.messages.info('Loading finished', { duration: 2500 }));
  }
}

const SEMANTIC_STYLES: NonNullable<AndesMessageConfig['styles']> = {
  root: {
    backgroundColor: '#f6ffed',
    border: '2px solid #95de64',
    borderRadius: '16px',
    boxShadow: '4px 4px 0 #d9f7be',
  },
  icon: { color: '#237804' },
  title: { color: '#237804', fontWeight: '600' },
};

const ERROR_STYLES: NonNullable<AndesMessageConfig['styles']> = {
  root: {
    ...SEMANTIC_STYLES.root,
    backgroundColor: '#fff2f0',
    borderColor: '#ffccc7',
    boxShadow: '4px 4px 0 #ffccc7',
  },
  icon: { color: '#cf1322' },
  title: { color: '#cf1322', fontWeight: '600' },
};

@Component({
  selector: 'andes-message-semantic',
  imports: [AndesButton, AndesToastViewport],
  template: `
    <div [style]="barStyle">
      <andes-button variant="outline" (click)="showObjectStyle()">
        Object style
      </andes-button>
      <andes-button (click)="showTypeStyle()">Style by type</andes-button>
    </div>
    <andes-toast-viewport />
  `,
})
class SemanticHost {
  private readonly messages = inject(AndesMessageService);
  protected readonly barStyle = BAR_STYLE;

  protected showObjectStyle(): void {
    this.messages.open({
      type: 'success',
      content: 'This is a message with object styles',
      styles: SEMANTIC_STYLES,
    });
  }

  /** The styles can depend on the type: pick them where the message is opened. */
  protected showTypeStyle(): void {
    const type = 'error';
    this.messages.open({
      type,
      content: 'This is a message styled by its type',
      styles: type === 'error' ? ERROR_STYLES : SEMANTIC_STYLES,
      classNames: { root: 'semantic-message' },
    });
  }
}

@Component({
  selector: 'andes-message-update',
  imports: [AndesButton, AndesToastViewport],
  template: `
    <div [style]="barStyle">
      <andes-button (click)="open()">Open the message box</andes-button>
    </div>
    <andes-toast-viewport />
  `,
})
class UpdateHost {
  private readonly messages = inject(AndesMessageService);
  protected readonly barStyle = BAR_STYLE;

  protected open(): void {
    const key = 'updatable';
    this.messages.open({ key, type: 'loading', content: 'Loading...' });
    setTimeout(() => {
      this.messages.open({
        key,
        type: 'success',
        content: 'Loaded!',
        duration: 2000,
      });
    }, 1000);
  }
}

const meta: Meta = {
  title: 'Feedback/Toast/Examples/Message',
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
};

export default meta;

type Story = StoryObj;

/**
 * Inject `AndesMessageService` anywhere and call `info()`; the single `andes-toast-viewport`
 * mounted in the app renders it.
 */
export const HooksUsage: Story = {
  name: 'Hooks usage (recommended)',
  render: () => ({
    moduleMetadata: { imports: [HooksUsageHost] },
    template: `<andes-message-hooks-usage />`,
  }),
};

/** Messages of success, error and warning types. */
export const OtherTypesOfMessage: Story = {
  name: 'Other types of message',
  render: () => ({
    moduleMetadata: { imports: [OtherTypesHost] },
    template: `<andes-message-other-types />`,
  }),
};

/** Customize the message display duration from the default 3s to 10s. */
export const CustomizeDuration: Story = {
  name: 'Customize duration',
  render: () => ({
    moduleMetadata: { imports: [DurationHost] },
    template: `<andes-message-duration />`,
  }),
};

/**
 * Messages stack once there are more than `threshold` of them, and only the latest shows in
 * the collapsed stack; hover it to expand.
 */
export const Stack: Story = {
  render: () => ({
    moduleMetadata: { imports: [StackHost] },
    template: `<andes-message-stack />`,
  }),
};

/** Display a global loading indicator, which is dismissed by itself asynchronously. */
export const MessageWithLoadingIndicator: Story = {
  name: 'Message with loading indicator',
  render: () => ({
    moduleMetadata: { imports: [LoadingHost] },
    template: `<andes-message-loading />`,
  }),
};

/**
 * Every message returns a handle whose `afterClosed` promise resolves when it closes, so the
 * next message can open as the previous one goes away.
 */
export const PromiseInterface: Story = {
  name: 'Promise interface',
  render: () => ({
    moduleMetadata: { imports: [PromiseHost] },
    template: `<andes-message-promise />`,
  }),
};

/** Style each part of a message with `classNames` and `styles`. */
export const CustomSemanticStyles: Story = {
  name: 'Custom semantic styles',
  render: () => ({
    moduleMetadata: { imports: [SemanticHost] },
    template: `<andes-message-semantic />`,
  }),
};

/** Update the message content with a unique `key`. */
export const UpdateMessageContent: Story = {
  name: 'Update Message Content',
  render: () => ({
    moduleMetadata: { imports: [UpdateHost] },
    template: `<andes-message-update />`,
  }),
};
