import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  signal,
} from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideRefreshCw } from '@ng-icons/lucide';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';

import { AndesButton } from '../button/button';
import {
  about,
  bar,
  caption,
  cell,
  column,
  PAY_URL,
  row,
  withDescription,
  withQrCodeKit,
} from '../../testing/qr-code-story-kit';
import { AndesQrCode, type AndesQrCodeStatus } from './qr-code';

/*
 * The overlay that covers the code while a login or payment flow is waiting: loading,
 * expired with a refresh action, and scanned; custom content; and two flows built from them.
 */

/** A code that expires after a countdown and is refreshed by the user, the way a login code is. */
@Component({
  selector: 'andes-qr-code-story-countdown',
  imports: [AndesQrCode, AndesButton, NgIcon],
  viewProviders: [provideIcons({ lucideRefreshCw })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div style="${column}">
      <andes-qr-code
        [value]="value()"
        [status]="status()"
        [size]="176"
        aria-label="Sign-in QR code"
        (refresh)="refresh()"
      />
      <span style="${caption}" role="timer">
        {{
          status() === 'active'
            ? 'Expires in ' + seconds() + 's'
            : status() === 'loading'
              ? 'Getting a new code'
              : 'The code expired'
        }}
      </span>
      <div style="${bar}">
        <andes-button variant="outline" size="sm" (click)="refresh()">
          <ng-icon slot="icon-start" name="lucideRefreshCw" />
          New code now
        </andes-button>
      </div>
    </div>
  `,
})
class QrCodeStoryCountdown implements OnDestroy {
  protected readonly status = signal<AndesQrCodeStatus>('active');
  protected readonly seconds = signal(8);
  protected readonly value = signal(`${PAY_URL}?t=1`);
  private serial = 1;
  private readonly timer = setInterval(() => this.tick(), 1000);
  private pending: ReturnType<typeof setTimeout> | undefined;

  protected refresh(): void {
    clearTimeout(this.pending);
    this.status.set('loading');
    this.pending = setTimeout(() => {
      this.serial++;
      this.value.set(`${PAY_URL}?t=${this.serial}`);
      this.seconds.set(8);
      this.status.set('active');
    }, 800);
  }

  private tick(): void {
    if (this.status() !== 'active') {
      return;
    }
    if (this.seconds() <= 1) {
      this.status.set('expired');
      return;
    }
    this.seconds.update((value) => value - 1);
  }

  ngOnDestroy(): void {
    clearInterval(this.timer);
    clearTimeout(this.pending);
  }
}

const meta: Meta<AndesQrCode> = {
  title: 'Data Display/QR Code/Status',
  decorators: [
    withDescription,
    withQrCodeKit,
    moduleMetadata({ imports: [QrCodeStoryCountdown] }),
  ],
};

export default meta;

type Story = StoryObj<AndesQrCode>;

const code = (attributes: string) =>
  `<andes-qr-code value="${PAY_URL}" ${attributes} />`;

/** Active. */
export const Active: Story = {
  name: 'Active',
  parameters: about(
    'The default status is `active`: the code is shown plain and ready to scan, with no overlay.',
  ),
  render: () => ({
    template: code('status="active" aria-label="Active QR code"'),
  }),
};

/** Loading. */
export const Loading: Story = {
  name: 'Loading',
  parameters: about(
    '`loading` covers the code with a spinner while a fresh one is fetched, and marks the component as busy for assistive technology.',
  ),
  render: () => ({
    template: code('status="loading" aria-label="Loading QR code"'),
  }),
};

/** Expired. */
export const Expired: Story = {
  name: 'Expired',
  parameters: about(
    '`expired` covers the code with a message and a Refresh button that emits the `refresh` output, which is where you fetch a new value.',
  ),
  render: () => ({
    props: { count: signal(0) },
    template: `
      <div style="${column}">
        <andes-qr-code value="${PAY_URL}" status="expired" aria-label="Expired QR code" (refresh)="count.set(count() + 1)" />
        <span style="${caption}" role="status">Refresh pressed {{ count() }} times</span>
      </div>`,
  }),
};

/** Scanned. */
export const Scanned: Story = {
  name: 'Scanned',
  parameters: about(
    '`scanned` covers the code with a confirmation once a phone has read it, while the other device asks the user to approve.',
  ),
  render: () => ({
    template: code('status="scanned" aria-label="Scanned QR code"'),
  }),
};

/** Switching. */
export const SwitchingStatus: Story = {
  name: 'Switching status',
  parameters: about(
    'The overlay follows the `status` input, so a segmented control can step one code through all four states.',
  ),
  render: () => ({
    props: {
      status: signal<AndesQrCodeStatus>('active'),
      options: ['active', 'loading', 'expired', 'scanned'],
    },
    template: `
      <div style="${column}">
        <andes-segmented aria-label="Status" [options]="options" [(value)]="status" />
        <andes-qr-code value="${PAY_URL}" [status]="status()" aria-label="QR code with a status" />
      </div>`,
  }),
};

/** Custom content. */
export const CustomStatusContent: Story = {
  name: 'Custom status content',
  parameters: about(
    '`statusRender` is a template that receives the status and a `refresh` function, and replaces what each status shows.',
  ),
  render: () => ({
    template: `
      <ng-template #custom let-status let-refresh="refresh">
        <div style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem; text-align: center; font-size: 0.875rem;">
          @switch (status) {
            @case ('expired') {
              <ng-icon name="lucideRefreshCw" />
              <span>Sign-in code timed out</span>
              <andes-button size="sm" (click)="refresh()">Get a new code</andes-button>
            }
            @case ('loading') {
              <span>Preparing your code</span>
            }
            @case ('scanned') {
              <ng-icon name="lucideBadgeCheck" />
              <span>Approve on your phone</span>
            }
          }
        </div>
      </ng-template>
      <div style="${row}">
        ${['expired', 'loading', 'scanned']
          .map((status) =>
            cell(
              status,
              `<andes-qr-code value="${PAY_URL}" status="${status}" [statusRender]="custom" aria-label="Custom ${status} QR code" />`,
            ),
          )
          .join('')}
      </div>`,
  }),
};

/** Countdown. */
export const RefreshWithACountdown: Story = {
  name: 'Refresh with a countdown',
  parameters: about(
    'A login code that expires after eight seconds, shows the expired overlay, and loads a new value when Refresh is pressed.',
  ),
  render: () => ({
    template: `<andes-qr-code-story-countdown />`,
  }),
};

/** Sign-in flow. */
export const SignInWithAnotherDevice: Story = {
  name: 'Sign in with another device',
  parameters: about(
    'The whole flow as the page sees it: a waiting code, a phone that scans it, an approval, and a code that expires or loads again.',
  ),
  render: () => {
    const status = signal<AndesQrCodeStatus>('active');
    return {
      props: {
        status,
        scan: () => status.set('scanned'),
        expire: () => status.set('expired'),
        reset: () => status.set('active'),
        refresh() {
          status.set('loading');
          setTimeout(() => status.set('active'), 600);
        },
      },
      template: `
        <div style="${column}">
          <andes-qr-code value="${PAY_URL}" [status]="status()" aria-label="Sign-in QR code" (refresh)="refresh()" />
          <span style="${caption}">Status: {{ status() }}</span>
          <div style="${bar}">
            <andes-button variant="outline" size="sm" (click)="scan()">Phone scans</andes-button>
            <andes-button variant="outline" size="sm" (click)="expire()">Time runs out</andes-button>
            <andes-button variant="outline" size="sm" (click)="reset()">Reset</andes-button>
          </div>
        </div>`,
    };
  },
};

/** Labels. */
export const TranslatedLabels: Story = {
  name: 'Translated labels',
  parameters: about(
    '`labels` replaces every text the component writes, including the live announcements, for a page in another language.',
  ),
  render: () => ({
    props: {
      labels: {
        qrCode: 'Código QR',
        loading: 'Cargando',
        expired: 'Código vencido',
        refresh: 'Actualizar',
        scanned: 'Escaneado',
      },
    },
    template: `
      <div style="${row}">
        ${['loading', 'expired', 'scanned']
          .map((status) =>
            cell(
              status,
              `<andes-qr-code value="${PAY_URL}" status="${status}" [labels]="labels" />`,
            ),
          )
          .join('')}
      </div>`,
  }),
};

/** Small and canvas. */
export const SmallAndCanvas: Story = {
  name: 'Small and on canvas',
  parameters: about(
    'The overlay adapts to a small code by dropping its icon, and covers a canvas the same way it covers an SVG.',
  ),
  render: () => ({
    template: `
      <div style="${row}">
        ${cell('96px', code('status="expired" [size]="96" aria-label="Small expired QR code"'))}
        ${cell('canvas', code('status="expired" type="canvas" aria-label="Canvas expired QR code"'))}
        ${cell('96px loading', code('status="loading" [size]="96" aria-label="Small loading QR code"'))}
      </div>`,
  }),
};

/** Transparent. */
export const StatusOnATransparentCode: Story = {
  name: 'Status on a transparent code',
  parameters: about(
    'When the background is transparent the overlay follows the page theme instead, so its text stays readable.',
  ),
  render: () => ({
    template: `
      <div style="${row}">
        ${cell('expired', code('status="expired" bgColor="transparent" aria-label="Transparent expired QR code"'))}
        ${cell('scanned', code('status="scanned" bgColor="transparent" aria-label="Transparent scanned QR code"'))}
      </div>`,
  }),
};
