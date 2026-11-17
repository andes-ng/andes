import {
  Component,
  effect,
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
import { AndesButton } from '../button/button';
import { AndesInputNumber } from '../input-number/input-number';
import { AndesSwitch } from '../switch/switch';
import type { AndesToastTemplateContext } from './toast.types';
import { AndesToastViewport } from './toast-viewport';

type Template = TemplateRef<AndesToastTemplateContext>;

@Component({
  selector: 'andes-message-basic',
  imports: [AndesButton, AndesToastViewport],
  template: `
    <div [style]="bar">
      <andes-button (click)="messages.info('Hello, Andes NG!')"
        >Show</andes-button
      >
    </div>
    <andes-toast-viewport />
  `,
})
class BasicHost extends ToastDemo {}

@Component({
  selector: 'andes-message-severities',
  imports: [AndesButton, AndesToastViewport],
  template: `
    <div [style]="bar">
      <andes-button
        variant="outline"
        (click)="messages.info('This is an info message')"
      >
        Show info
      </andes-button>
      <andes-button
        variant="outline"
        (click)="messages.success('This is a success message')"
      >
        Show success
      </andes-button>
      <andes-button
        variant="outline"
        (click)="messages.warning('This is a warning message')"
      >
        Show warning
      </andes-button>
      <andes-button
        variant="outline"
        (click)="messages.error('This is an error message')"
      >
        Show error
      </andes-button>
      <andes-button
        variant="outline"
        (click)="messages.loading('This is a loading message')"
      >
        Show loading
      </andes-button>
    </div>
    <andes-toast-viewport />
  `,
})
class SeveritiesHost extends ToastDemo {}

@Component({
  selector: 'andes-message-duration',
  imports: [AndesButton, AndesToastViewport],
  template: `
    <div [style]="bar">
      <andes-button variant="outline" (click)="short()"
        >Default (3 seconds)</andes-button
      >
      <andes-button variant="outline" (click)="long()">10 seconds</andes-button>
    </div>
    <andes-toast-viewport />
  `,
})
class DurationHost extends ToastDemo {
  protected short(): void {
    this.messages.success('This message will disappear in 3 seconds');
  }

  protected long(): void {
    this.messages.success('This message will disappear in 10 seconds', {
      duration: 10_000,
    });
  }
}

@Component({
  selector: 'andes-message-loading',
  imports: [AndesButton, AndesToastViewport],
  template: `
    <div [style]="bar">
      <andes-button variant="outline" (click)="show()">Show</andes-button>
    </div>
    <andes-toast-viewport />
  `,
})
class LoadingHost extends ToastDemo {
  protected show(): void {
    const ref = this.messages.loading('Action in progress...', {
      duration: false,
    });
    setTimeout(
      () =>
        ref.update({
          type: 'success',
          content: 'Loading finished',
          duration: 2500,
        }),
      2500,
    );
  }
}

@Component({
  selector: 'andes-message-update',
  imports: [AndesButton, AndesToastViewport],
  template: `
    <div [style]="bar">
      <andes-button (click)="save()">Save</andes-button>
      <andes-button variant="outline" (click)="load()"
        >Loading, then loaded</andes-button
      >
    </div>
    <andes-toast-viewport />
  `,
})
class UpdateHost extends ToastDemo {
  private saves = 0;

  /** The same `key` keeps one message on screen and rewrites its text. */
  protected save(): void {
    this.saves++;
    this.messages.success(
      `Saved ${this.saves} time${this.saves > 1 ? 's' : ''}`,
      {
        key: 'save',
      },
    );
  }

  protected load(): void {
    const key = 'updatable';
    this.messages.open({ key, type: 'loading', content: 'Loading...' });
    setTimeout(
      () =>
        this.messages.open({
          key,
          type: 'success',
          content: 'Loaded!',
          duration: 2000,
        }),
      1000,
    );
  }
}

@Component({
  selector: 'andes-message-sequence',
  imports: [AndesButton, AndesToastViewport],
  template: `
    <div [style]="bar">
      <andes-button variant="outline" (click)="show()"
        >Show sequential messages</andes-button
      >
    </div>
    <andes-toast-viewport />
  `,
})
class SequenceHost extends ToastDemo {
  protected show(): void {
    void this.messages
      .loading('Action in progress...', { duration: 2500 })
      .afterClosed.then(
        () =>
          this.messages.success('Loading finished', { duration: 2500 })
            .afterClosed,
      )
      .then(() => this.messages.info('All done', { duration: 2500 }));
  }
}

@Component({
  selector: 'andes-message-stack',
  imports: [AndesButton, AndesInputNumber, AndesSwitch, AndesToastViewport],
  template: `
    <div [style]="bar">
      <andes-switch [(checked)]="enabled">Enabled</andes-switch>
      <span [style]="text">Threshold</span>
      <andes-input-number
        aria-label="Stack threshold"
        size="sm"
        style="width: 5rem;"
        [min]="1"
        [max]="10"
        [disabled]="!enabled()"
        [(value)]="threshold"
      />
    </div>
    <div [style]="bar + ' margin-top: 1rem;'">
      <andes-button (click)="open()">Show</andes-button>
      <andes-button variant="outline" (click)="clear()"
        >Destroy all</andes-button
      >
    </div>
    <andes-toast-viewport />
  `,
})
class StackHost extends ToastDemo {
  protected readonly enabled = signal(true);
  protected readonly threshold = signal<number | string | null>(3);
  private count = 0;

  constructor() {
    super();
    effect(() => {
      const threshold = Number(this.threshold()) || 1;
      this.messages.config({ stack: this.enabled() ? { threshold } : false });
    });
  }

  protected open(): void {
    this.count++;
    this.messages.info(
      this.count % 2
        ? `Message ${this.count}: This is a stacked message.`
        : `Message ${this.count}: This is a slightly longer stacked message.`,
      { duration: false },
    );
  }
}

@Component({
  selector: 'andes-message-icon',
  imports: [AndesButton, NgIcon, AndesToastViewport],
  template: `
    <div [style]="bar">
      <andes-button variant="outline" (click)="custom()"
        >Custom icon</andes-button
      >
      <andes-button variant="outline" (click)="none()">No icon</andes-button>
    </div>
    <ng-template #smile>
      <ng-icon
        name="lucideSmile"
        size="16"
        style="color: var(--andes-color-primary-text);"
      />
    </ng-template>
    <andes-toast-viewport />
  `,
})
class IconHost extends ToastDemo {
  private readonly smile = viewChild.required<Template>('smile');

  protected custom(): void {
    this.messages.info('Your own icon, from a template', {
      icon: this.smile(),
    });
  }

  protected none(): void {
    this.messages.info('No icon at all', { icon: null });
  }
}

@Component({
  selector: 'andes-message-action',
  imports: [AndesButton, AndesToastViewport],
  template: `
    <div [style]="bar">
      <andes-button variant="outline" (click)="send()">Send</andes-button>
    </div>
    <p [style]="muted">{{ status() }}</p>
    <ng-template #undo let-close="close">
      <span [style]="bar + ' gap: 0.5rem;'">
        Message sent
        <andes-button variant="link" size="xs" (click)="undoSend(close)"
          >Undo</andes-button
        >
      </span>
    </ng-template>
    <andes-toast-viewport />
  `,
})
class ActionHost extends ToastDemo {
  private readonly undo = viewChild.required<Template>('undo');

  protected send(): void {
    this.status.set('');
    this.messages.success('Message sent', {
      contentTemplate: this.undo(),
      duration: 6000,
    });
  }

  protected undoSend(close: () => void): void {
    close();
    this.status.set('Sending was undone.');
  }
}

@Component({
  selector: 'andes-message-long',
  imports: [AndesButton, AndesToastViewport],
  template: `
    <div [style]="bar">
      <andes-button variant="outline" (click)="show()">Show</andes-button>
    </div>
    <andes-toast-viewport />
  `,
})
class LongHost extends ToastDemo {
  protected show(): void {
    this.messages.warning(
      'The report could not be exported because 3 lines reference a cost centre that was closed on 30 September, so the totals would not match the ledger.',
      { duration: 8000 },
    );
  }
}

@Component({
  selector: 'andes-message-dismissible',
  imports: [AndesButton, AndesToastViewport],
  template: `
    <div [style]="bar">
      <andes-button variant="outline" (click)="show()">Show</andes-button>
    </div>
    <p [style]="muted">{{ status() }}</p>
    <andes-toast-viewport />
  `,
})
class DismissibleHost extends ToastDemo {
  protected show(): void {
    this.messages.info('Close me with the button', {
      dismissible: true,
      duration: false,
      onClose: (reason) => this.status.set(`Closed (${reason}).`),
    });
  }
}

@Component({
  selector: 'andes-message-rich',
  imports: [AndesButton, AndesToastViewport],
  template: `
    <div [style]="bar">
      <andes-button variant="outline" (click)="show()">Show</andes-button>
    </div>
    <ng-template #copied>
      <span>Copied <code [style]="mono">INV-2024-000118</code></span>
    </ng-template>
    <andes-toast-viewport />
  `,
})
class RichHost extends ToastDemo {
  protected readonly mono =
    'font-family: ui-monospace, monospace; font-size: 0.8125rem;';
  private readonly copied = viewChild.required<Template>('copied');

  protected show(): void {
    this.messages.open({
      type: 'success',
      content: 'Copied INV-2024-000118',
      contentTemplate: this.copied(),
    });
  }
}

const meta: Meta<AndesToastViewport> = {
  title: 'Feedback/Toast/Messages',
  component: AndesToastViewport,
  tags: ['autodocs'],
  decorators: [withDescription, withToastKit],
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<AndesToastViewport>;

/** A one-line message. */
export const Basic: Story = {
  name: 'Basic',
  parameters: about(
    'Inject AndesMessageService and call info; the single viewport mounted in the app draws the message at the top centre.',
  ),
  render: () => ({
    moduleMetadata: { imports: [BasicHost] },
    template: `<andes-message-basic />`,
  }),
};

/** The five types. */
export const Severities: Story = {
  name: 'Severities',
  parameters: about(
    'Messages come as info, success, warning, error and loading, each with its own icon.',
  ),
  render: () => ({
    moduleMetadata: { imports: [SeveritiesHost] },
    template: `<andes-message-severities />`,
  }),
};

/** Default and custom duration. */
export const CustomDuration: Story = {
  name: 'Custom duration',
  parameters: about(
    'A message closes after 3 seconds, and duration changes that for one message, here to 10 seconds.',
  ),
  render: () => ({
    moduleMetadata: { imports: [DurationHost] },
    template: `<andes-message-duration />`,
  }),
};

/** A loading message that resolves. */
export const LoadingIndicator: Story = {
  name: 'Loading indicator',
  parameters: about(
    'A loading message stays until the work is done, then update turns it into a success message after 2.5 seconds.',
  ),
  render: () => ({
    moduleMetadata: { imports: [LoadingHost] },
    template: `<andes-message-loading />`,
  }),
};

/** Same key, same message. */
export const UpdateContentWithAKey: Story = {
  name: 'Update content with a key',
  parameters: about(
    'Opening a message with the key of one that is still open rewrites it in place instead of adding a second one.',
  ),
  render: () => ({
    moduleMetadata: { imports: [UpdateHost] },
    template: `<andes-message-update />`,
  }),
};

/** Promise-style sequence. */
export const SequentialMessages: Story = {
  name: 'Promise style',
  parameters: about(
    'Every message returns a handle whose afterClosed promise resolves when it closes, so the next message can open as the previous one goes away.',
  ),
  render: () => ({
    moduleMetadata: { imports: [SequenceHost] },
    template: `<andes-message-sequence />`,
  }),
};

/** Stack with an Enabled switch and a Threshold input. */
export const Stack: Story = {
  name: 'Stack',
  parameters: about(
    'Past the threshold the messages collapse into a stack that shows only the newest one, and hovering it expands the list.',
  ),
  render: () => ({
    moduleMetadata: { imports: [StackHost] },
    template: `<andes-message-stack />`,
  }),
};

/** Custom icon. */
export const CustomIcon: Story = {
  name: 'Custom icon',
  parameters: about(
    'The icon option takes a template for your own icon, or null for none.',
  ),
  render: () => ({
    moduleMetadata: { imports: [IconHost] },
    template: `<andes-message-icon />`,
  }),
};

/** A message with an action. */
export const WithAnAction: Story = {
  name: 'With an action',
  parameters: about(
    'A content template can hold a button, here an Undo link that closes the message and reports back.',
  ),
  render: () => ({
    moduleMetadata: { imports: [ActionHost] },
    template: `<andes-message-action />`,
  }),
};

/** Long text. */
export const LongText: Story = {
  name: 'Long text',
  parameters: about(
    'A long message wraps inside the card instead of growing past the edge of the screen.',
  ),
  render: () => ({
    moduleMetadata: { imports: [LongHost] },
    template: `<andes-message-long />`,
  }),
};

/** A message with a close button. */
export const Dismissible: Story = {
  name: 'Dismissible',
  parameters: about(
    'Messages have no close button until dismissible is set, and onClose reports why the message closed.',
  ),
  render: () => ({
    moduleMetadata: { imports: [DismissibleHost] },
    template: `<andes-message-dismissible />`,
  }),
};

/** Template content. */
export const RichContent: Story = {
  name: 'Rich content',
  parameters: about(
    'A content template draws formatted text in place of the plain string, which stays the text a screen reader announces.',
  ),
  render: () => ({
    moduleMetadata: { imports: [RichHost] },
    template: `<andes-message-rich />`,
  }),
};
