import { signal } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular';

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
import type { AndesQrCode, AndesQrCodeError } from './index';

/*
 * What a screen reader hears and a keyboard reaches: the name of the image, the status
 * announcements, the refresh button, the empty and error states, motion, direction and phones.
 */

const meta: Meta<AndesQrCode> = {
  title: 'Data Display/QR Code/Accessibility',
  decorators: [withDescription, withQrCodeKit],
};

export default meta;

type Story = StoryObj<AndesQrCode>;

/** Name from the value. */
export const NameFromTheValue: Story = {
  name: 'Name from the value',
  parameters: about(
    'The symbol is `role="img"` named "QR code: <value>", truncated after 100 characters, so a screen reader says what the code holds.',
  ),
  render: () => ({
    template: `
      <div style="${row}">
        ${cell('Short value', `<andes-qr-code value="${PAY_URL}" />`)}
        ${cell('Long value, named from its first 100 characters', '<andes-qr-code value="https://andes.example/orders/2026/11/08/receipt?token=ab12cd34ef56gh78ij90kl12mn34op56qr78st90&lang=es&utm_source=email" />')}
      </div>`,
  }),
};

/** Custom name. */
export const CustomName: Story = {
  name: 'Custom name',
  parameters: about(
    '`aria-label` replaces the name when the raw value would mean nothing aloud, such as a token or a payload.',
  ),
  render: () => ({
    template: `
      <andes-qr-code value="otpauth://totp/Andes:ada?secret=JBSWY3DPEHPK3PXP" aria-label="Authenticator setup code for ada" />`,
  }),
};

/** Announcements. */
export const StatusAnnouncements: Story = {
  name: 'Status announcements',
  parameters: about(
    'A polite live region announces `loading`, `expired` and `scanned` (nothing for `active`), and the status is added to the image name.',
  ),
  render: () => ({
    props: {
      status: signal('active'),
      options: ['active', 'loading', 'expired', 'scanned'],
    },
    template: `
      <div style="${column}">
        <andes-segmented aria-label="Status" [options]="options" [(value)]="status" />
        <andes-qr-code value="${PAY_URL}" [status]="$any(status())" aria-label="Sign-in QR code" />
        <span style="${caption}">Announced: {{ status() === 'active' ? 'nothing' : status() }}</span>
      </div>`,
  }),
};

/** Keyboard. */
export const KeyboardRefresh: Story = {
  name: 'Keyboard refresh',
  parameters: about(
    'The Refresh button is a real button outside the image role, reachable with Tab and activated with Enter or Space.',
  ),
  render: () => ({
    props: { count: signal(0) },
    template: `
      <div style="${column}">
        <andes-qr-code value="${PAY_URL}" status="expired" aria-label="Sign-in QR code" (refresh)="count.set(count() + 1)" />
        <span style="${caption}" role="status">Press Tab to reach Refresh, then Enter: refreshed {{ count() }} times</span>
      </div>`,
  }),
};

/** Empty. */
export const NoValue: Story = {
  name: 'No value',
  parameters: about(
    'With no value there is nothing to encode, so a quiet placeholder takes the place of the code and nothing is announced.',
  ),
  render: () => ({
    template: `
      <div style="${row}">
        ${cell('value=""', '<andes-qr-code value="" aria-label="Empty QR code" />')}
        ${cell('Fetching, so loading', '<andes-qr-code value="" status="loading" aria-label="QR code on its way" />')}
      </div>`,
  }),
};

/** Too long. */
export const ValueTooLong: Story = {
  name: 'Value too long',
  parameters: about(
    'A value longer than the largest symbol holds does not throw; the code shows a clear error state, announces it and names it on the image.',
  ),
  render: () => ({
    props: { long: 'x'.repeat(4000) },
    template: `<andes-qr-code [value]="long" aria-label="QR code that is too long" />`,
  }),
};

/** Error output. */
export const ErrorOutput: Story = {
  name: 'Error output',
  parameters: about(
    'The `encodeError` output emits a reason and a message whenever a value cannot be encoded, so the page can tell the user to shorten it.',
  ),
  render: () => {
    const text = signal(PAY_URL);
    const problem = signal<AndesQrCodeError | null>(null);
    return {
      props: {
        text,
        problem,
        fill: () => text.set('x'.repeat(4000)),
        reset: () => {
          text.set(PAY_URL);
          problem.set(null);
        },
      },
      template: `
        <div style="${column}">
          <div style="width: 22rem; max-width: 100%;">
            <andes-input aria-label="Value to encode" [(value)]="text" />
          </div>
          <div style="${bar}">
            <andes-button variant="outline" size="sm" (click)="fill()">Use 4000 characters</andes-button>
            <andes-button variant="outline" size="sm" (click)="reset()">Reset</andes-button>
          </div>
          <andes-qr-code [value]="text()" aria-label="Typed QR code" (encodeError)="problem.set($event)" />
          @if (problem(); as issue) {
            <span style="${caption}" role="alert">{{ issue.reason }}: {{ issue.message }}</span>
          }
        </div>`,
    };
  },
};

/** Motion. */
export const ReducedMotion: Story = {
  name: 'Reduced motion',
  parameters: about(
    'With the system setting for reduced motion on, the overlay appears without a fade and the loading icon stops spinning.',
  ),
  render: () => ({
    template: `
      <div style="${row}">
        ${cell('loading', `<andes-qr-code value="${PAY_URL}" status="loading" aria-label="Loading QR code" />`)}
        ${cell('expired', `<andes-qr-code value="${PAY_URL}" status="expired" aria-label="Expired QR code" />`)}
      </div>`,
  }),
};

/** RTL. */
export const RightToLeft: Story = {
  name: 'Right to left',
  parameters: about(
    'In a right-to-left page the frame and the overlay follow the direction, while the drawing is never mirrored because a mirrored code would not scan.',
  ),
  render: () => ({
    props: {
      labels: {
        qrCode: 'رمز الاستجابة السريعة',
        expired: 'انتهت صلاحية الرمز',
        refresh: 'تحديث',
        loading: 'جارٍ التحميل',
        scanned: 'تم المسح',
      },
    },
    template: `
      <div dir="rtl" style="${row}">
        ${cell('active', `<andes-qr-code value="${PAY_URL}" [labels]="labels" />`)}
        ${cell('expired', `<andes-qr-code value="${PAY_URL}" status="expired" [labels]="labels" />`)}
        ${cell('scanned', `<andes-qr-code value="${PAY_URL}" status="scanned" [labels]="labels" />`)}
      </div>`,
  }),
};

/** Phones. */
export const NarrowScreens: Story = {
  name: 'Narrow screens',
  parameters: about(
    'On a 320px phone a `fluid` code fills the width it has and keeps its overlay inside the frame.',
  ),
  render: () => ({
    template: `
      <div style="width: 20rem; max-width: 100%; display: flex; flex-direction: column; gap: 1rem; border: 1px dashed var(--andes-color-border); padding: 0.75rem; box-sizing: border-box;">
        <andes-qr-code value="${PAY_URL}" [fluid]="true" [size]="280" aria-label="Fluid QR code" />
        <andes-qr-code value="${PAY_URL}" [fluid]="true" [size]="280" status="expired" aria-label="Fluid expired QR code" />
      </div>`,
  }),
};

/** Contrast. */
export const ContrastMatters: Story = {
  name: 'Contrast matters',
  parameters: about(
    'A code needs strong contrast between modules and ground to scan; the pair on the left is easy to read, the pair on the right is not.',
  ),
  render: () => ({
    template: `
      <div style="${row}">
        ${cell('Strong contrast', `<andes-qr-code value="${PAY_URL}" color="#0f172a" bgColor="#ffffff" aria-label="Strong contrast" />`)}
        ${cell('Weak contrast: avoid', `<andes-qr-code value="${PAY_URL}" color="#94a3b8" bgColor="#e2e8f0" aria-label="Weak contrast" />`)}
      </div>`,
  }),
};
