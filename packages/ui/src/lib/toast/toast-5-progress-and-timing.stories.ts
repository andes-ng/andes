import { Component, effect, signal } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular';

import {
  about,
  ToastDemo,
  withDescription,
  withToastKit,
} from '../../testing/toast-story-kit';
import { AndesButton } from '../button/button';
import { AndesInputNumber } from '../input-number/input-number';
import { AndesRadioGroup } from '../radio-group/radio-group';
import { AndesSwitch } from '../switch/switch';
import { AndesTag } from '../tag/tag';
import { AndesToastViewport } from './toast-viewport';

@Component({
  selector: 'andes-toast-progress',
  imports: [AndesButton, AndesSwitch, AndesToastViewport],
  template: `
    <div [style]="column">
      <andes-switch [(checked)]="pause">Pause on hover</andes-switch>
      <andes-button (click)="show()">Show</andes-button>
    </div>
    <andes-toast-viewport />
  `,
})
class ProgressHost extends ToastDemo {
  protected readonly pause = signal(true);

  protected show(): void {
    this.toasts.show({
      title: 'Notification Title',
      message: 'The line on the bottom edge drains as the countdown runs.',
      showProgress: true,
      pauseOnHover: this.pause(),
    });
  }
}

@Component({
  selector: 'andes-toast-progress-colour',
  imports: [AndesButton, AndesRadioGroup, AndesToastViewport],
  template: `
    <div [style]="column">
      <andes-radio-group
        aria-label="Progress colour"
        orientation="horizontal"
        [options]="colours"
        [(value)]="colour"
      />
      <andes-button (click)="show()">Show</andes-button>
    </div>
    <andes-toast-viewport />
  `,
})
class ProgressColourHost extends ToastDemo {
  protected readonly colours = [
    { value: 'severity', label: 'Severity colour' },
    { value: '#6253e1', label: 'Violet' },
    { value: '#0d9488', label: 'Teal' },
    { value: '#ea580c', label: 'Orange' },
  ];
  protected readonly colour = signal<string | null>('#6253e1');

  protected show(): void {
    const colour = this.colour();
    this.toasts.show({
      title: 'Customize progress bar color',
      message:
        'Set --andes-toast-progress-bg on the toast, or on any ancestor, to colour the line.',
      showProgress: true,
      duration: 20_000,
      style:
        colour && colour !== 'severity'
          ? { '--andes-toast-progress-bg': colour }
          : undefined,
    });
  }
}

@Component({
  selector: 'andes-toast-pauses',
  imports: [AndesButton, AndesTag, AndesToastViewport],
  template: `
    <div [style]="column">
      <div [style]="bar">
        <span [style]="text">Tab</span>
        <andes-tag [color]="toasts.pageHidden() ? 'warning' : 'success'">
          {{ toasts.pageHidden() ? 'hidden: countdowns held' : 'visible' }}
        </andes-tag>
      </div>
      <div [style]="bar">
        <andes-button (click)="show()">Show</andes-button>
        <andes-button variant="outline" (click)="clear()"
          >Dismiss all</andes-button
        >
      </div>
      <p [style]="muted">
        The countdown holds while the pointer is over the card, while keyboard
        focus is inside it (Alt+T moves focus to the newest toast), and while
        this tab is in the background.
      </p>
    </div>
    <andes-toast-viewport />
  `,
})
class PausesHost extends ToastDemo {
  protected show(): void {
    this.toasts.info('Hover it, focus it or switch tabs, and the line stops.', {
      title: 'Countdown held',
      duration: 12_000,
      showProgress: true,
    });
  }
}

@Component({
  selector: 'andes-toast-persistent',
  imports: [AndesButton, AndesToastViewport],
  template: `
    <div [style]="column">
      <div [style]="bar">
        <andes-button (click)="notify()">Show a notification</andes-button>
        <andes-button variant="outline" (click)="tell()"
          >Show a message</andes-button
        >
        <andes-button variant="ghost" (click)="clear()"
          >Dismiss all</andes-button
        >
      </div>
      <p [style]="muted">
        Open now: {{ toasts.toasts().length + messages.toasts().length }}
      </p>
    </div>
    <andes-toast-viewport />
  `,
})
class PersistentHost extends ToastDemo {
  protected notify(): void {
    this.toasts.warning('This one stays until someone closes it.', {
      title: 'duration: false',
      duration: false,
    });
  }

  protected tell(): void {
    this.messages.warning('This message stays too', {
      duration: false,
      dismissible: true,
    });
  }
}

@Component({
  selector: 'andes-toast-restart',
  imports: [AndesButton, AndesToastViewport],
  template: `
    <div [style]="bar">
      <andes-button (click)="show()">Show</andes-button>
      <andes-button variant="outline" (click)="update()"
        >Update by key</andes-button
      >
    </div>
    <p [style]="muted">
      Press Update while the line is draining: the text changes and the
      countdown starts over.
    </p>
    <andes-toast-viewport />
  `,
})
class RestartHost extends ToastDemo {
  private updates = 0;

  protected show(): void {
    this.updates = 0;
    this.send();
  }

  protected update(): void {
    this.updates++;
    this.send();
  }

  private send(): void {
    this.toasts.show({
      key: 'restart',
      title: 'Syncing',
      message: `Updated ${this.updates} time${this.updates === 1 ? '' : 's'}.`,
      showProgress: true,
      duration: 8000,
    });
  }
}

@Component({
  selector: 'andes-toast-default-duration',
  imports: [AndesButton, AndesInputNumber, AndesToastViewport],
  template: `
    <div [style]="column">
      <div [style]="field">
        <span [style]="caption">Default duration in seconds</span>
        <andes-input-number
          aria-label="Default duration in seconds"
          style="width: 7rem;"
          [min]="1"
          [max]="60"
          [(value)]="seconds"
        />
      </div>
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
class DefaultDurationHost extends ToastDemo {
  protected readonly seconds = signal<number | string | null>(8);

  constructor() {
    super();
    effect(() => {
      const duration = (Number(this.seconds()) || 5) * 1000;
      this.toasts.config({ duration, showProgress: true });
      this.messages.config({ duration });
    });
  }

  protected notify(): void {
    this.toasts.info('It uses the default duration.', { title: 'Default' });
  }

  protected tell(): void {
    this.messages.info('It uses the default duration');
  }
}

const meta: Meta<AndesToastViewport> = {
  title: 'Feedback/Toast/Progress and timing',
  component: AndesToastViewport,
  tags: ['autodocs'],
  decorators: [withDescription, withToastKit],
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<AndesToastViewport>;

/** The progress line. */
export const ShowWithProgress: Story = {
  name: 'Show with progress',
  parameters: about(
    'A thin line on the bottom edge of the card drains over the countdown, and the switch decides whether hovering pauses it.',
  ),
  render: () => ({
    moduleMetadata: { imports: [ProgressHost] },
    template: `<andes-toast-progress />`,
  }),
};

/** Its colour. */
export const ProgressColour: Story = {
  name: 'Progress colour',
  parameters: about(
    'The line takes the colour of the severity unless the --andes-toast-progress-bg custom property sets another one.',
  ),
  render: () => ({
    moduleMetadata: { imports: [ProgressColourHost] },
    template: `<andes-toast-progress-colour />`,
  }),
};

/** Hover, focus and a hidden tab. */
export const PauseOnHoverFocusAndHiddenTab: Story = {
  name: 'Pause on hover, focus and hidden tab',
  parameters: about(
    'The countdown holds while the pointer is over the card, while focus is inside it and while the tab is in the background.',
  ),
  render: () => ({
    moduleMetadata: { imports: [PausesHost] },
    template: `<andes-toast-pauses />`,
  }),
};

/** Toasts that stay. */
export const PersistentToasts: Story = {
  name: 'Persistent toasts',
  parameters: about(
    'A duration of false keeps a toast open until the user or the code closes it.',
  ),
  render: () => ({
    moduleMetadata: { imports: [PersistentHost] },
    template: `<andes-toast-persistent />`,
  }),
};

/** A key update restarts the countdown. */
export const RestartOnAKeyUpdate: Story = {
  name: 'Restart on a key update',
  parameters: about(
    'Updating a toast by its key rewrites it and starts the countdown, and the progress line, from the beginning.',
  ),
  render: () => ({
    moduleMetadata: { imports: [RestartHost] },
    template: `<andes-toast-restart />`,
  }),
};

/** The global duration. */
export const DefaultDuration: Story = {
  name: 'Default duration',
  parameters: about(
    'The config method changes the duration every later toast starts with, without touching the calls that set their own.',
  ),
  render: () => ({
    moduleMetadata: { imports: [DefaultDurationHost] },
    template: `<andes-toast-default-duration />`,
  }),
};
