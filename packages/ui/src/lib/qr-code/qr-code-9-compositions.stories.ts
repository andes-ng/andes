import { computed, signal } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular';

import {
  about,
  bar,
  brandLogo,
  caption,
  card,
  column,
  eventPayload,
  geoPayload,
  mailtoPayload,
  muted,
  PAY_URL,
  row,
  smsPayload,
  telPayload,
  title,
  totpPayload,
  vcardPayload,
  wifiPayload,
  withDescription,
  withQrCodeKit,
} from '../../testing/qr-code-story-kit';
import type { AndesQrCode, AndesQrCodeStatus } from './index';

/*
 * Codes as an application uses them: in a tooltip, a dialog and a menu; on a share card, a
 * boarding pass, a Wi-Fi sheet, a contact, an app download page, a two-factor setup and a
 * payment request; and the payloads a phone understands.
 */

const meta: Meta<AndesQrCode> = {
  title: 'Data Display/QR Code/Compositions',
  decorators: [withDescription, withQrCodeKit],
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<AndesQrCode>;

/** A copy that never throws where the clipboard is missing. */
function clipboard() {
  const note = signal('');
  return {
    note,
    async copyText(value: string) {
      try {
        await navigator.clipboard.writeText(value);
        note.set('Copied');
      } catch {
        note.set('Copy is not available here');
      }
    },
    async save(qr: AndesQrCode, name: string) {
      try {
        await qr.download(name);
        note.set(`Saved ${name}.png`);
      } catch (error) {
        note.set(error instanceof Error ? error.message : String(error));
      }
    },
  };
}

/** In a tooltip. */
export const InATooltip: Story = {
  name: 'In a tooltip',
  parameters: about(
    'A button opens the code in a light tooltip on hover, focus or click; the tooltip is the nearest overlay to a popover in this library.',
  ),
  render: () => ({
    template: `
      <div style="padding: 2rem 1rem 14rem;">
        <andes-tooltip variant="light" side="bottom" [trigger]="['hover', 'focus', 'click']" [openDelay]="0">
          <andes-button andesTooltipTrigger variant="outline">
            <ng-icon slot="icon-start" name="lucideSmartphone" />
            Open on your phone
          </andes-button>
          <ng-template andesTooltipContent>
            <div style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem; padding: 0.25rem;">
              <andes-qr-code value="${PAY_URL}" [size]="136" [bordered]="false" aria-label="Open this page on your phone" />
              <span style="${caption}">Scan to continue on your phone</span>
            </div>
          </ng-template>
        </andes-tooltip>
      </div>`,
  }),
};

/** In a dialog. */
export const InADialog: Story = {
  name: 'In a dialog',
  parameters: about(
    'A dialog shows a large code to scan from across a table, with a download in its footer.',
  ),
  render: () => {
    const { note, save } = clipboard();
    return {
      props: { note, save },
      template: `
        <andes-dialog>
          <andes-button andesDialogTrigger variant="outline">
            <ng-icon slot="icon-start" name="lucideCreditCard" />
            Pay with your phone
          </andes-button>
          <andes-dialog-content *andesDialogContent>
            <div andesDialogHeader>
              <h2 andesDialogTitle>Scan to pay</h2>
              <p andesDialogDescription>Open your banking app and scan the code to pay S/ 42.00.</p>
            </div>
            <div style="display: flex; justify-content: center;">
              <andes-qr-code #qr value="${PAY_URL}" [size]="224" shape="rounded" finderShape="rounded" aria-label="Payment QR code" />
            </div>
            <div andesDialogFooter>
              <span style="${caption} margin-inline-end: auto;" role="status">{{ note() }}</span>
              <andes-button variant="secondary" (click)="save(qr, 'andes-pay')">Download</andes-button>
              <andes-button andesDialogClose>Done</andes-button>
            </div>
          </andes-dialog-content>
        </andes-dialog>`,
    };
  },
};

/** In a dropdown. */
export const InADropdownMenu: Story = {
  name: 'In a dropdown menu',
  parameters: about(
    'A menu keeps its items and adds the code underneath through `popupTemplate`, for a share menu that also shows a QR code.',
  ),
  render: () => ({
    props: {
      items: [
        { key: 'copy', label: 'Copy link' },
        { key: 'mail', label: 'Send by email' },
      ],
    },
    template: `
      <div style="padding: 1rem 1rem 22rem;">
        <andes-dropdown-menu [items]="items" [popupTemplate]="popup">
          <andes-button andesDropdownMenuTrigger variant="outline">
            <ng-icon slot="icon-start" name="lucideShare2" />
            Share
          </andes-button>
        </andes-dropdown-menu>
        <ng-template #popup let-menu>
          <ng-container *ngTemplateOutlet="menu" />
          <div style="height: 1px; background: var(--andes-color-border);"></div>
          <div style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem; padding: 0.75rem;">
            <andes-qr-code value="${PAY_URL}" [size]="120" [bordered]="false" aria-label="Share QR code" />
            <span style="${caption}">Or scan with your phone</span>
          </div>
        </ng-template>
      </div>`,
  }),
};

/** Share card. */
export const ShareCard: Story = {
  name: 'Share card',
  parameters: about(
    'A card with the code, the link it holds, and copy and download actions: the usual way to share a page or a profile.',
  ),
  render: () => {
    const { note, copyText, save } = clipboard();
    return {
      props: { note, copyText, save, link: 'https://andes.example/u/ada' },
      template: `
        <div style="${card} width: 20rem; max-width: 100%;">
          <h3 style="${title}">Share your profile</h3>
          <span style="${muted}">Anyone who scans this code lands on your page.</span>
          <div style="display: flex; justify-content: center;">
            <andes-qr-code #qr [value]="link" [size]="192" shape="rounded" finderShape="rounded" aria-label="Profile QR code" />
          </div>
          <andes-input aria-label="Profile link" [value]="link" readOnly />
          <div style="${bar}">
            <andes-button variant="outline" size="sm" (click)="copyText(link)">
              <ng-icon slot="icon-start" name="lucideCopy" />
              Copy link
            </andes-button>
            <andes-button variant="outline" size="sm" (click)="save(qr, 'andes-profile')">
              <ng-icon slot="icon-start" name="lucideDownload" />
              Download
            </andes-button>
            <span style="${caption}" role="status">{{ note() }}</span>
          </div>
        </div>`,
    };
  },
};

/** Boarding pass. */
export const BoardingPass: Story = {
  name: 'Boarding pass',
  parameters: about(
    'A ticket with a tear line, the trip on one side and a compact, borderless code on the other, as a boarding pass or an event ticket is laid out.',
  ),
  render: () => ({
    props: { logo: brandLogo('#0f172a') },
    template: `
      <div style="${card} flex-direction: row; flex-wrap: wrap; gap: 0; padding: 0; max-width: 40rem; overflow: hidden;">
        <div style="flex: 1 1 16rem; display: flex; flex-direction: column; gap: 0.75rem; padding: 1.25rem;">
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <ng-icon name="lucidePlane" />
            <span style="${caption}">Andes Air AN 412</span>
          </div>
          <div style="display: flex; align-items: baseline; gap: 0.75rem;">
            <strong style="font-size: 1.75rem;">LIM</strong>
            <span style="${muted}">to</span>
            <strong style="font-size: 1.75rem;">CUZ</strong>
          </div>
          <div style="display: flex; gap: 1.5rem;">
            <div><div style="${caption}">Passenger</div>Ada Lovelace</div>
            <div><div style="${caption}">Gate</div>B12</div>
            <div><div style="${caption}">Seat</div>14A</div>
          </div>
          <span style="${caption}">Boarding 08:40, departs 09:15</span>
        </div>
        <div style="flex: 0 0 auto; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.5rem; padding: 1.25rem; border-inline-start: 2px dashed var(--andes-color-border);">
          <andes-qr-code value="M1LOVELACE/ADA EABC123 LIMCUZAN 0412 312Y014A0001" [size]="132" [bordered]="false" [icon]="logo" [iconSize]="24" aria-label="Boarding pass code for seat 14A" />
          <span style="${caption}">Scan at the gate</span>
        </div>
      </div>`,
  }),
};

/** Wi-Fi. */
export const WifiNetwork: Story = {
  name: 'Wi-Fi network',
  parameters: about(
    'Type a network name and password and the code updates; a phone camera offers to join the network without typing the password.',
  ),
  render: () => {
    const ssid = signal('Andes Guest');
    const password = signal('correct horse battery');
    const security = signal<'WPA' | 'WEP' | 'nopass'>('WPA');
    return {
      props: {
        ssid,
        password,
        security,
        modes: [
          { value: 'WPA', label: 'WPA / WPA2' },
          { value: 'WEP', label: 'WEP' },
          { value: 'nopass', label: 'No password' },
        ],
        payload: computed(() =>
          wifiPayload({
            ssid: ssid(),
            password: password(),
            security: security(),
          }),
        ),
      },
      template: `
        <div style="${card} flex-direction: row; flex-wrap: wrap; align-items: flex-start; max-width: 40rem;">
          <div style="display: flex; flex-direction: column; gap: 0.75rem; flex: 1 1 14rem;">
            <h3 style="${title}"><ng-icon name="lucideWifi" /> Join our Wi-Fi</h3>
            <andes-form-field label="Network name">
              <andes-input [(value)]="ssid" />
            </andes-form-field>
            <andes-form-field label="Password">
              <andes-input [(value)]="password" [disabled]="security() === 'nopass'" />
            </andes-form-field>
            <andes-form-field label="Security">
              <andes-select [options]="modes" [(value)]="security" aria-label="Security" />
            </andes-form-field>
          </div>
          <div style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem;">
            <andes-qr-code [value]="payload()" [size]="176" aria-label="Wi-Fi QR code" />
            <span style="${caption}; overflow-wrap: anywhere; max-width: 12rem;">{{ payload() }}</span>
          </div>
        </div>`,
    };
  },
};

/** Contact. */
export const ContactCard: Story = {
  name: 'Contact card',
  parameters: about(
    'A business card with a vCard code: a phone offers to save the contact with the name, number, email and site already filled in.',
  ),
  render: () => ({
    props: {
      payload: vcardPayload({
        name: 'Ada',
        family: 'Lovelace',
        organisation: 'Andes Labs',
        title: 'Engineer',
        phone: '+51987654321',
        email: 'ada@andes.example',
        url: 'https://andes.example',
      }),
    },
    template: `
      <div style="${card} flex-direction: row; flex-wrap: wrap; align-items: center; max-width: 34rem;">
        <ng-icon name="lucideContact" style="font-size: 2rem;" />
        <div style="display: flex; flex-direction: column; gap: 0.25rem; flex: 1 1 10rem;">
          <h3 style="${title}">Ada Lovelace</h3>
          <span style="${muted}">Engineer, Andes Labs</span>
          <span style="${caption}">+51 987 654 321</span>
          <span style="${caption}">ada@andes.example</span>
        </div>
        <andes-qr-code [value]="payload" [size]="148" errorLevel="M" aria-label="Contact card for Ada Lovelace" />
      </div>`,
  }),
};

/** App download. */
export const AppDownloadPage: Story = {
  name: 'App download page',
  parameters: about(
    'A landing section with a code per store, so a visitor on a laptop can install the app by pointing a phone at the screen.',
  ),
  render: () => ({
    props: { logo: brandLogo() },
    template: `
      <div style="${card} max-width: 38rem;">
        <h3 style="${title}">Get the Andes app</h3>
        <span style="${muted}">Point your camera at the code for your phone.</span>
        <div style="${row}">
          <div style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem;">
            <andes-qr-code value="https://apps.example/andes/ios" [icon]="logo" [size]="160" shape="rounded" aria-label="Download for iPhone" />
            <span style="${caption}">iPhone</span>
          </div>
          <div style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem;">
            <andes-qr-code value="https://apps.example/andes/android" [icon]="logo" [size]="160" shape="rounded" aria-label="Download for Android" />
            <span style="${caption}">Android</span>
          </div>
        </div>
      </div>`,
  }),
};

/** 2FA. */
export const TwoFactorSetup: Story = {
  name: 'Two-factor setup',
  parameters: about(
    'The setup step of two-factor sign-in: scan the code with an authenticator app, or type the key by hand, then enter the first code to confirm.',
  ),
  render: () => {
    const payload = totpPayload({
      issuer: 'Andes',
      account: 'ada@andes.example',
      secret: 'JBSWY3DPEHPK3PXP',
    });
    const verified = signal(false);
    return {
      props: {
        payload,
        verified,
        verify: () => verified.set(true),
      },
      template: `
        <div style="${card} max-width: 36rem;">
          <h3 style="${title}"><ng-icon name="lucideShieldCheck" /> Set up two-factor sign-in</h3>
          <span style="${muted}">1. Scan this code with your authenticator app.</span>
          <div style="${row}">
            <andes-qr-code [value]="payload" [size]="168" errorLevel="M" aria-label="Authenticator setup code for ada@andes.example" />
            <div style="display: flex; flex-direction: column; gap: 0.5rem; flex: 1 1 12rem;">
              <span style="${caption}">Or type this key</span>
              <andes-input aria-label="Setup key" value="JBSW Y3DP EHPK 3PXP" readOnly />
            </div>
          </div>
          <span style="${muted}">2. Enter the 6-digit code it shows.</span>
          <div style="${bar}">
            <div style="width: 10rem;"><andes-input aria-label="Verification code" placeholder="123456" [maxLength]="6" /></div>
            <andes-button (click)="verify()">Verify</andes-button>
            @if (verified()) {
              <andes-tag color="success">Verified</andes-tag>
            }
          </div>
        </div>`,
    };
  },
};

/** Payment. */
export const PaymentRequest: Story = {
  name: 'Payment request',
  parameters: about(
    'A payment screen where the code carries the amount, the overlay shows when a phone has scanned it, and Refresh issues a new request when it expires.',
  ),
  render: () => {
    const status = signal<AndesQrCodeStatus>('active');
    const serial = signal(1);
    return {
      props: {
        status,
        serial,
        value: computed(() => `${PAY_URL}?amount=42.00&ref=${serial()}`),
        scan: () => status.set('scanned'),
        expire: () => status.set('expired'),
        refresh() {
          status.set('loading');
          setTimeout(() => {
            serial.update((value) => value + 1);
            status.set('active');
          }, 600);
        },
      },
      template: `
        <div style="${card} width: 20rem; max-width: 100%; align-items: center; text-align: center;">
          <ng-icon name="lucideCreditCard" style="font-size: 1.5rem;" />
          <div>
            <div style="${muted}">Total to pay</div>
            <strong style="font-size: 1.75rem;">S/ 42.00</strong>
          </div>
          <andes-qr-code [value]="value()" [status]="status()" [size]="192" aria-label="Payment QR code for S/ 42.00" (refresh)="refresh()" />
          <span style="${caption}" role="status">{{ status() === 'scanned' ? 'Confirm the payment in your app' : 'Scan with your banking app' }}</span>
          <div style="${bar}">
            <andes-button variant="outline" size="sm" (click)="scan()">Phone scans</andes-button>
            <andes-button variant="outline" size="sm" (click)="expire()">Expire</andes-button>
          </div>
        </div>`,
    };
  },
};

/** Payload gallery. */
export const PayloadGallery: Story = {
  name: 'Payload gallery',
  parameters: about(
    'A QR code carries any text, so a link, an email, a call, a text message, a place, a calendar event or a contact is only a string built in the right format.',
  ),
  render: () => {
    const payloads: Record<string, string> = {
      Link: PAY_URL,
      Email: mailtoPayload(
        'hello@andes.example',
        'Hello',
        'I found you through a QR code.',
      ),
      Phone: telPayload('+51987654321'),
      SMS: smsPayload('+51987654321', 'Hello from Andes'),
      Location: geoPayload(-13.5319, -71.9675),
      Event: eventPayload({
        title: 'Andes meetup',
        start: new Date('2026-11-20T19:00:00Z'),
        end: new Date('2026-11-20T21:00:00Z'),
        location: 'Cusco',
      }),
      Contact: vcardPayload({
        name: 'Ada',
        family: 'Lovelace',
        phone: '+51987654321',
        email: 'ada@andes.example',
      }),
    };
    const kind = signal('Link');
    return {
      props: {
        kind,
        kinds: Object.keys(payloads),
        payload: computed(() => payloads[kind()]),
      },
      template: `
        <div style="${column}">
          <andes-segmented aria-label="Payload" [options]="kinds" [(value)]="kind" />
          <div style="${row}">
            <andes-qr-code [value]="payload()" [size]="200" aria-label="Payload QR code" />
            <pre style="${caption} margin: 0; max-width: 22rem; white-space: pre-wrap; overflow-wrap: anywhere;">{{ payload() }}</pre>
          </div>
        </div>`,
    };
  },
};
