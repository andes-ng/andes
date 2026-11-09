import { Component, signal, TemplateRef, viewChild } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import type { Meta, StoryObj } from '@storybook/angular';

import {
  about,
  SEVERITY_TEXTS,
  SEVERITY_TITLES,
  ToastDemo,
  withDescription,
  withToastKit,
} from '../../testing/toast-story-kit';
import { AndesAvatar } from '../avatar/avatar';
import { AndesAvatarFallback } from '../avatar/avatar-fallback';
import { AndesButton } from '../button/button';
import { AndesSegmented } from '../segmented/segmented';
import { AndesTag } from '../tag/tag';
import type {
  AndesToastConfig,
  AndesToastSeverity,
  AndesToastTemplateContext,
} from './toast.types';
import { AndesToastViewport } from './toast-viewport';

type Template = TemplateRef<AndesToastTemplateContext>;

const DESCRIPTION =
  'This is the content of the notification. It says what happened and, when it helps, what to do next.';

@Component({
  selector: 'andes-notification-basic',
  imports: [AndesButton, AndesToastViewport],
  template: `
    <div [style]="bar">
      <andes-button (click)="show()">Show</andes-button>
    </div>
    <andes-toast-viewport />
  `,
})
class BasicHost extends ToastDemo {
  protected show(): void {
    this.toasts.show({ title: 'Notification Title', message: DESCRIPTION });
  }
}

@Component({
  selector: 'andes-notification-icons',
  imports: [AndesButton, AndesToastViewport],
  template: `
    <div [style]="bar">
      @for (severity of kinds; track severity) {
        <andes-button variant="outline" (click)="show(severity)">{{
          severity
        }}</andes-button>
      }
    </div>
    <andes-toast-viewport />
  `,
})
class IconsHost extends ToastDemo {
  protected readonly kinds: readonly AndesToastSeverity[] = [
    'success',
    'info',
    'warning',
    'error',
    'loading',
    'neutral',
  ];

  protected show(severity: AndesToastSeverity): void {
    this.toasts.show({
      title: SEVERITY_TITLES[severity] ?? 'Notification Title',
      message: SEVERITY_TEXTS[severity] ?? DESCRIPTION,
      severity,
    });
  }
}

@Component({
  selector: 'andes-notification-custom-icon',
  imports: [AndesButton, NgIcon, AndesToastViewport],
  template: `
    <div [style]="bar">
      <andes-button (click)="show()">Show</andes-button>
      <andes-button variant="outline" (click)="hide()">No icon</andes-button>
    </div>
    <ng-template #rocket>
      <ng-icon
        name="lucideRocket"
        size="24"
        style="color: var(--andes-color-primary-text);"
      />
    </ng-template>
    <andes-toast-viewport />
  `,
})
class CustomIconHost extends ToastDemo {
  private readonly rocket = viewChild.required<Template>('rocket');

  protected show(): void {
    this.toasts.show({
      title: 'Deployed',
      message: 'Version 2.4 is live.',
      icon: this.rocket(),
    });
  }

  protected hide(): void {
    this.toasts.show({
      title: 'No icon',
      message: 'icon: null leaves the text the whole width.',
      icon: null,
    });
  }
}

@Component({
  selector: 'andes-notification-actions',
  imports: [AndesButton, AndesToastViewport],
  template: `
    <div [style]="bar">
      <andes-button (click)="show()">Show</andes-button>
    </div>
    <p [style]="muted">{{ status() }}</p>
    <andes-toast-viewport />
  `,
})
class ActionsHost extends ToastDemo {
  protected show(): void {
    this.toasts.info('Restart the app to apply version 2.4.', {
      title: 'Update available',
      duration: false,
      actions: [
        {
          label: 'Restart now',
          onClick: () => this.status.set('Restart clicked.'),
        },
        { label: 'Later', onClick: () => this.status.set('Later clicked.') },
      ],
      onClose: (reason) =>
        this.status.update((s) => `${s} Closed (${reason}).`),
    });
  }
}

@Component({
  selector: 'andes-notification-actions-template',
  imports: [AndesButton, AndesToastViewport],
  template: `
    <div [style]="bar">
      <andes-button (click)="show()">Show</andes-button>
    </div>
    <p [style]="muted">{{ status() }}</p>
    <ng-template #buttons let-close="close">
      <andes-button size="sm" variant="ghost" (click)="clear()"
        >Destroy all</andes-button
      >
      <andes-button size="sm" variant="outline" (click)="pick('Snooze', close)">
        Snooze
      </andes-button>
      <andes-button size="sm" (click)="pick('Confirm', close)"
        >Confirm</andes-button
      >
    </ng-template>
    <andes-toast-viewport />
  `,
})
class ActionsTemplateHost extends ToastDemo {
  private readonly buttons = viewChild.required<Template>('buttons');

  protected show(): void {
    this.toasts.show({
      title: 'Notification Title',
      message:
        'Your own buttons replace the actions row, and close() dismisses the toast.',
      actionsTemplate: this.buttons(),
      duration: false,
    });
  }

  protected pick(label: string, close: () => void): void {
    this.status.set(`${label} clicked.`);
    close();
  }
}

@Component({
  selector: 'andes-notification-confirm',
  imports: [AndesButton, AndesToastViewport],
  template: `
    <div [style]="bar">
      <andes-button (click)="show()">Show</andes-button>
    </div>
    <p [style]="muted">{{ status() }}</p>
    <andes-toast-viewport />
  `,
})
class ConfirmHost extends ToastDemo {
  protected show(): void {
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
}

@Component({
  selector: 'andes-notification-update',
  imports: [AndesButton, AndesToastViewport],
  template: `
    <div [style]="bar">
      <andes-button (click)="show()">Show, then update</andes-button>
      <andes-button variant="outline" (click)="count()">Count</andes-button>
    </div>
    <andes-toast-viewport />
  `,
})
class UpdateHost extends ToastDemo {
  private clicks = 0;

  protected show(): void {
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

  /** Each click rewrites the one notification and restarts its countdown. */
  protected count(): void {
    this.clicks++;
    this.toasts.info(
      `Clicked ${this.clicks} time${this.clicks > 1 ? 's' : ''}.`,
      {
        key: 'counter',
        title: 'One notification',
      },
    );
  }
}

@Component({
  selector: 'andes-notification-duration',
  imports: [AndesButton, AndesToastViewport],
  template: `
    <div [style]="bar">
      <andes-button
        variant="outline"
        (click)="show('Closes after the default 5 seconds.')"
      >
        Default (5 seconds)
      </andes-button>
      <andes-button
        variant="outline"
        (click)="show('Closes after 10 seconds.', 10000)"
      >
        10 seconds
      </andes-button>
      <andes-button
        variant="outline"
        (click)="show('Never closes by itself.', false)"
      >
        Never closes
      </andes-button>
      <andes-button variant="ghost" (click)="clear()">Dismiss all</andes-button>
    </div>
    <andes-toast-viewport />
  `,
})
class DurationHost extends ToastDemo {
  protected show(message: string, duration?: number | false): void {
    this.toasts.show({ title: 'Notification Title', message, duration });
  }
}

@Component({
  selector: 'andes-notification-close',
  imports: [AndesButton, NgIcon, AndesToastViewport],
  template: `
    <div [style]="bar">
      <andes-button variant="outline" (click)="glyph()"
        >Custom close icon</andes-button
      >
      <andes-button variant="outline" (click)="withText()"
        >Close with text</andes-button
      >
      <andes-button variant="outline" (click)="none()"
        >No close button</andes-button
      >
    </div>
    <p [style]="muted">{{ status() }}</p>
    <ng-template #trash>
      <ng-icon name="lucideTrash2" size="14" />
    </ng-template>
    <ng-template #esc>
      <span style="font-size: 0.75rem; font-weight: 600;">ESC</span>
    </ng-template>
    <andes-toast-viewport />
  `,
})
class CloseHost extends ToastDemo {
  private readonly trash = viewChild.required<Template>('trash');
  private readonly esc = viewChild.required<Template>('esc');

  protected glyph(): void {
    this.toasts.info('The close button shows your own icon.', {
      title: 'closeIcon',
      closeIcon: this.trash(),
      duration: false,
      onClose: (reason) => this.status.set(`Closed (${reason}).`),
    });
  }

  protected withText(): void {
    this.toasts.info('Any template works as the close glyph.', {
      title: 'closeIcon as text',
      closeIcon: this.esc(),
      duration: false,
      onClose: (reason) => this.status.set(`Closed (${reason}).`),
    });
  }

  protected none(): void {
    this.toasts.warning('There is no close button; it closes in 4 seconds.', {
      title: 'dismissible: false',
      dismissible: false,
      duration: 4000,
      onClose: (reason) => this.status.set(`Closed (${reason}).`),
    });
  }
}

@Component({
  selector: 'andes-notification-click',
  imports: [AndesButton, AndesToastViewport],
  template: `
    <div [style]="bar">
      <andes-button (click)="show()">Show</andes-button>
    </div>
    <p [style]="muted">{{ status() }}</p>
    <andes-toast-viewport />
  `,
})
class ClickHost extends ToastDemo {
  protected show(): void {
    this.toasts.show({
      title: 'New comment',
      message: 'Click anywhere on this notification to open it.',
      duration: false,
      onClick: (ref) => {
        this.status.set(`Notification ${ref.id} opened.`);
        ref.close();
      },
    });
  }
}

@Component({
  selector: 'andes-notification-rich',
  imports: [
    AndesAvatar,
    AndesAvatarFallback,
    AndesButton,
    AndesTag,
    AndesToastViewport,
  ],
  template: `
    <div [style]="bar">
      <andes-button (click)="show()">Show</andes-button>
    </div>
    <ng-template #avatar>
      <andes-avatar size="sm"
        ><andes-avatar-fallback>AT</andes-avatar-fallback></andes-avatar
      >
    </ng-template>
    <ng-template #title let-toast>
      {{ toast.title }}
      <andes-tag color="primary">mentioned you</andes-tag>
    </ng-template>
    <ng-template #body>
      <span
        >"Can you review the <strong>Q3 budget</strong> before Friday?"</span
      >
    </ng-template>
    <andes-toast-viewport />
  `,
})
class RichHost extends ToastDemo {
  private readonly avatar = viewChild.required<Template>('avatar');
  private readonly title = viewChild.required<Template>('title');
  private readonly body = viewChild.required<Template>('body');

  protected show(): void {
    this.toasts.show({
      title: 'Ana Torres',
      message: 'Can you review the Q3 budget before Friday?',
      icon: this.avatar(),
      titleTemplate: this.title(),
      messageTemplate: this.body(),
      duration: 10_000,
    });
  }
}

@Component({
  selector: 'andes-notification-long',
  imports: [AndesButton, AndesToastViewport],
  template: `
    <div [style]="bar">
      <andes-button (click)="show()">Show</andes-button>
    </div>
    <andes-toast-viewport />
  `,
})
class LongHost extends ToastDemo {
  protected show(): void {
    this.toasts.error(
      'The invoice batch could not be posted because 3 lines reference a cost centre that was closed on 30/09: INV-2024-000118, INV-2024-000124 and INV-2024-000131.',
      {
        title: 'Posting failed for the September invoice batch',
        duration: false,
        action: { label: 'Review', onClick: () => undefined },
      },
    );
  }
}

@Component({
  selector: 'andes-notification-swipe',
  imports: [AndesButton, AndesSegmented, AndesToastViewport],
  template: `
    <div [style]="column">
      <div [style]="field">
        <span [style]="caption">Swiping</span>
        <andes-segmented
          aria-label="Swiping"
          [options]="modes"
          [(value)]="mode"
        />
      </div>
      <andes-button (click)="show()">Show</andes-button>
    </div>
    <p [style]="muted">{{ status() }}</p>
    <andes-toast-viewport />
  `,
})
class SwipeHost extends ToastDemo {
  protected readonly modes = [
    { value: 'default', label: 'Towards its edges' },
    { value: 'left', label: 'Left only' },
    { value: 'off', label: 'Off' },
  ];
  protected readonly mode = signal<string | null>('default');

  protected show(): void {
    const swipe: Partial<AndesToastConfig> =
      this.mode() === 'left'
        ? { swipeDirections: ['left'] }
        : this.mode() === 'off'
          ? { swipeToDismiss: false }
          : {};
    this.toasts.info('Drag the notification to dismiss it.', {
      title: 'Swipe',
      duration: false,
      ...swipe,
      onClose: (reason) => this.status.set(`Closed (${reason}).`),
    });
  }
}

const meta: Meta<AndesToastViewport> = {
  title: 'Feedback/Toast/Notifications',
  component: AndesToastViewport,
  tags: ['autodocs'],
  decorators: [withDescription, withToastKit],
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<AndesToastViewport>;

/** A titled notification. */
export const Basic: Story = {
  name: 'Basic',
  parameters: about(
    'A notification has a title and a body, appears in the bottom-right corner and closes by itself after 5 seconds.',
  ),
  render: () => ({
    moduleMetadata: { imports: [BasicHost] },
    template: `<andes-notification-basic />`,
  }),
};

/** One icon per severity. */
export const IconPerSeverity: Story = {
  name: 'Icon per severity',
  parameters: about(
    'Success, info, warning and error carry a coloured icon, loading shows a spinner and neutral has none.',
  ),
  render: () => ({
    moduleMetadata: { imports: [IconsHost] },
    template: `<andes-notification-icons />`,
  }),
};

/** Custom icon. */
export const CustomIcon: Story = {
  name: 'Custom icon',
  parameters: about(
    'The icon option takes any template in place of the severity icon, or null to drop the icon.',
  ),
  render: () => ({
    moduleMetadata: { imports: [CustomIconHost] },
    template: `<andes-notification-custom-icon />`,
  }),
};

/** A group of actions. */
export const DescriptionAndActions: Story = {
  name: 'Description and actions',
  parameters: about(
    'The actions option draws a group of buttons under the description, the first one filled and the rest outlined.',
  ),
  render: () => ({
    moduleMetadata: { imports: [ActionsHost] },
    template: `<andes-notification-actions />`,
  }),
};

/** An actions template. */
export const CustomActions: Story = {
  name: 'Custom actions',
  parameters: about(
    'An actions template draws your own buttons in that row, and the close function from its context dismisses the notification.',
  ),
  render: () => ({
    moduleMetadata: { imports: [ActionsTemplateHost] },
    template: `<andes-notification-actions-template />`,
  }),
};

/** The compact action and cancel pair. */
export const ActionAndCancel: Story = {
  name: 'Action and cancel',
  parameters: about(
    'The compact action and cancel buttons sit at the end of the row, and both close the notification when clicked.',
  ),
  render: () => ({
    moduleMetadata: { imports: [ConfirmHost] },
    template: `<andes-notification-confirm />`,
  }),
};

/** Same key, same notification. */
export const UpdateContentWithAKey: Story = {
  name: 'Update content with a key',
  parameters: about(
    'Showing a notification with the key of one that is still open rewrites it in place and restarts its countdown.',
  ),
  render: () => ({
    moduleMetadata: { imports: [UpdateHost] },
    template: `<andes-notification-update />`,
  }),
};

/** Default, long and no auto-dismiss. */
export const Duration: Story = {
  name: 'Duration',
  parameters: about(
    'A notification closes after 5 seconds, duration changes that, and false keeps it open until someone closes it.',
  ),
  render: () => ({
    moduleMetadata: { imports: [DurationHost] },
    template: `<andes-notification-duration />`,
  }),
};

/** Custom close button. */
export const CustomCloseButton: Story = {
  name: 'Custom close button',
  parameters: about(
    'The close glyph takes a template, and dismissible false removes the close button altogether.',
  ),
  render: () => ({
    moduleMetadata: { imports: [CloseHost] },
    template: `<andes-notification-close />`,
  }),
};

/** A click handler. */
export const ClickHandler: Story = {
  name: 'Click handler',
  parameters: about(
    'The onClick option runs when the body of the notification is clicked, with a handle that can close it.',
  ),
  render: () => ({
    moduleMetadata: { imports: [ClickHost] },
    template: `<andes-notification-click />`,
  }),
};

/** Avatar and formatted text. */
export const RichContent: Story = {
  name: 'Rich content',
  parameters: about(
    'An avatar in the icon slot and templates for the title and the body make a notification that reads like a message from a person.',
  ),
  render: () => ({
    moduleMetadata: { imports: [RichHost] },
    template: `<andes-notification-rich />`,
  }),
};

/** Long text. */
export const LongText: Story = {
  name: 'Long text',
  parameters: about(
    'A long title and body wrap inside the fixed width card, and the action stays in reach.',
  ),
  render: () => ({
    moduleMetadata: { imports: [LongHost] },
    template: `<andes-notification-long />`,
  }),
};

/** Swipe to dismiss. */
export const SwipeToDismiss: Story = {
  name: 'Swipe to dismiss',
  parameters: about(
    'Dragging a notification towards the edge it is anchored to dismisses it, swipeDirections narrows the directions and swipeToDismiss false turns it off.',
  ),
  render: () => ({
    moduleMetadata: { imports: [SwipeHost] },
    template: `<andes-notification-swipe />`,
  }),
};
