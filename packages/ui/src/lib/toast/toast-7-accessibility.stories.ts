import { Component, signal } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular';

import {
  about,
  SEVERITY_TEXTS,
  SEVERITY_TITLES,
  ToastDemo,
  withDescription,
  withToastKit,
} from '../../testing/toast-story-kit';
import { AndesButton } from '../button/button';
import { AndesInput } from '../input/input';
import { AndesSegmented } from '../segmented/segmented';
import { AndesSwitch } from '../switch/switch';
import { AndesTag } from '../tag/tag';
import type { AndesToastRole, AndesToastSeverity } from './toast.types';
import { AndesToastViewport } from './toast-viewport';

@Component({
  selector: 'andes-toast-live-regions',
  imports: [AndesButton, AndesSegmented, AndesTag, AndesToastViewport],
  template: `
    <div [style]="column">
      <div [style]="bar">
        <andes-tag color="success">success: polite</andes-tag>
        <andes-tag color="info">info: polite</andes-tag>
        <andes-tag color="warning">warning: polite</andes-tag>
        <andes-tag color="danger">error: assertive</andes-tag>
      </div>
      <div [style]="field">
        <span [style]="caption">Announcement</span>
        <andes-segmented
          aria-label="Announcement"
          [options]="roles"
          [(value)]="role"
        />
      </div>
      <div [style]="bar">
        @for (severity of severities; track severity) {
          <andes-button variant="outline" (click)="show(severity)">{{
            severity
          }}</andes-button>
        }
      </div>
    </div>
    <andes-toast-viewport />
  `,
})
class LiveRegionsHost extends ToastDemo {
  protected readonly roles = [
    { value: 'auto', label: 'By severity' },
    { value: 'status', label: 'Polite' },
    { value: 'alert', label: 'Assertive' },
  ];
  protected readonly role = signal<string | null>('auto');

  protected show(severity: AndesToastSeverity): void {
    const role = this.role();
    this.toasts.show({
      title: SEVERITY_TITLES[severity],
      message: SEVERITY_TEXTS[severity] ?? '',
      severity,
      role: role === 'auto' ? undefined : (role as AndesToastRole),
    });
  }
}

@Component({
  selector: 'andes-toast-hotkey',
  imports: [AndesButton, AndesInput, AndesSwitch, AndesToastViewport],
  template: `
    <div [style]="column">
      <div [style]="bar">
        <andes-switch [(checked)]="enabled">Hotkey</andes-switch>
        <andes-input
          aria-label="Hotkey chord"
          style="width: 10rem;"
          [disabled]="!enabled()"
          [(value)]="chord"
        />
      </div>
      <andes-button (click)="fire()">Show three notifications</andes-button>
      <p [style]="muted">
        Press {{ enabled() ? chord() : 'nothing: the hotkey is off' }} to move
        focus to the newest notification. The deck expands and the countdown
        holds until focus leaves.
      </p>
    </div>
    <andes-toast-viewport [hotkey]="enabled() ? chord() : false" />
  `,
})
class HotkeyHost extends ToastDemo {
  protected readonly enabled = signal(true);
  protected readonly chord = signal('Alt+T');

  protected fire(): void {
    for (let i = 1; i <= 3; i++) {
      this.toasts.info(`Build ${i} finished.`, {
        title: `Build ${i}`,
        duration: 30_000,
        showProgress: true,
      });
    }
  }
}

@Component({
  selector: 'andes-toast-escape',
  imports: [AndesButton, AndesToastViewport],
  host: { '(document:focusin)': 'onFocus($event)' },
  template: `
    <div [style]="column">
      <andes-button (click)="fire()">Show a notification</andes-button>
      <p [style]="muted">
        Press Alt+T to focus the notification, then Escape to dismiss it. Focus
        goes back to the button that had it.
      </p>
      <p [style]="text">Focus is on: {{ focused() }}</p>
    </div>
    <andes-toast-viewport />
  `,
})
class EscapeHost extends ToastDemo {
  protected readonly focused = signal('nothing');

  protected fire(): void {
    this.toasts.info('Escape closes me while I have focus.', {
      title: 'Focus me',
      duration: 30_000,
    });
  }

  protected onFocus(event: FocusEvent): void {
    const target = event.target as HTMLElement;
    this.focused.set(
      target.closest('andes-toast-item')
        ? 'the notification'
        : target.textContent?.trim() || target.tagName.toLowerCase(),
    );
  }
}

@Component({
  selector: 'andes-toast-motion',
  imports: [AndesButton, AndesTag, AndesToastViewport],
  template: `
    <div [style]="column">
      <div [style]="bar">
        <span [style]="text">Your system asks for</span>
        <andes-tag [color]="reduced ? 'warning' : 'default'">
          {{ reduced ? 'reduced motion' : 'full motion' }}
        </andes-tag>
      </div>
      <p [style]="muted">
        With reduced motion on, a toast fades in 150ms instead of sliding in and
        the progress line is hidden. Change it in the accessibility settings of
        your system and show a toast again.
      </p>
      <andes-button (click)="show()">Show</andes-button>
    </div>
    <andes-toast-viewport />
  `,
})
class MotionHost extends ToastDemo {
  protected readonly reduced =
    typeof matchMedia === 'function' &&
    matchMedia('(prefers-reduced-motion: reduce)').matches;

  protected show(): void {
    this.toasts.success('It slides in, or it fades in.', {
      title: 'Motion',
      showProgress: true,
    });
  }
}

@Component({
  selector: 'andes-toast-dark',
  imports: [AndesButton, AndesSwitch, AndesToastViewport],
  template: `
    <div [style]="column">
      <andes-switch [checked]="rich()" (checkedChange)="setRich($event)"
        >Rich colors</andes-switch
      >
      <div [style]="bar">
        @for (severity of severities; track severity) {
          <andes-button variant="outline" (click)="show(severity)">{{
            severity
          }}</andes-button>
        }
        <andes-button
          variant="outline"
          (click)="messages.info('Copied to clipboard')"
        >
          message
        </andes-button>
      </div>
    </div>
    <andes-toast-viewport />
  `,
})
class DarkHost extends ToastDemo {
  protected readonly rich = signal(false);

  protected setRich(on: boolean): void {
    this.rich.set(on);
    this.toasts.config({ richColors: on });
    this.messages.config({ richColors: on });
  }

  protected show(severity: AndesToastSeverity): void {
    this.toasts.show({
      title: SEVERITY_TITLES[severity],
      message: SEVERITY_TEXTS[severity] ?? '',
      severity,
      showProgress: true,
      duration: 30_000,
    });
  }
}

@Component({
  selector: 'andes-toast-rtl-page',
  imports: [AndesButton, AndesToastViewport],
  template: `
    <div [style]="bar">
      <andes-button (click)="notify()">Show a notification</andes-button>
      <andes-button variant="outline" (click)="tell()"
        >Show a message</andes-button
      >
    </div>
    <andes-toast-viewport />
  `,
})
class RtlPageHost extends ToastDemo {
  protected notify(): void {
    this.toasts.success('تم حفظ التغييرات بنجاح.', {
      title: 'تم الحفظ',
      duration: 10_000,
      action: { label: 'تراجع', onClick: () => undefined },
    });
  }

  protected tell(): void {
    this.messages.info('تم النسخ إلى الحافظة');
  }
}

const meta: Meta<AndesToastViewport> = {
  title: 'Feedback/Toast/Accessibility and motion',
  component: AndesToastViewport,
  tags: ['autodocs'],
  decorators: [withDescription, withToastKit],
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<AndesToastViewport>;

/** Live regions. */
export const LiveRegions: Story = {
  name: 'Live regions',
  parameters: about(
    'Each toast is announced by screen readers, an error assertively and everything else politely, and the role option overrides that per toast.',
  ),
  render: () => ({
    moduleMetadata: { imports: [LiveRegionsHost] },
    template: `<andes-toast-live-regions />`,
  }),
};

/** The hotkey. */
export const Hotkey: Story = {
  name: 'Hotkey',
  parameters: about(
    'The hotkey of the viewport moves focus to the newest toast, and it can be changed to another chord or turned off.',
  ),
  render: () => ({
    moduleMetadata: { imports: [HotkeyHost] },
    template: `<andes-toast-hotkey />`,
  }),
};

/** Escape. */
export const EscapeToDismiss: Story = {
  name: 'Escape to dismiss',
  parameters: about(
    'Escape dismisses the toast that has focus and hands focus back to where it was before the hotkey.',
  ),
  render: () => ({
    moduleMetadata: { imports: [EscapeHost] },
    template: `<andes-toast-escape />`,
  }),
};

/** Reduced motion. */
export const ReducedMotion: Story = {
  name: 'Reduced motion',
  parameters: about(
    'When the system asks for reduced motion, toasts fade in place of sliding and the progress line is hidden.',
  ),
  render: () => ({
    moduleMetadata: { imports: [MotionHost] },
    template: `<andes-toast-motion />`,
  }),
};

/** Dark mode. */
export const DarkMode: Story = {
  name: 'Dark mode',
  globals: { theme: 'dark' },
  parameters: about(
    'The card, the icons, the progress line and the tinted colours all follow the dark theme.',
  ),
  render: () => ({
    moduleMetadata: { imports: [DarkHost] },
    template: `<andes-toast-dark />`,
  }),
};

/** Right to left. */
export const RightToLeft: Story = {
  name: 'Right to left',
  parameters: {
    ...about(
      'Under a right-to-left document the content of a toast mirrors by itself, with no option to set.',
    ),
    dir: 'rtl',
  },
  render: () => ({
    moduleMetadata: { imports: [RtlPageHost] },
    template: `<andes-toast-rtl-page />`,
  }),
};
