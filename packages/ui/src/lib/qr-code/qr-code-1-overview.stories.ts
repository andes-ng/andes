import type { Meta, StoryObj } from '@storybook/angular';
import { fn } from 'storybook/test';

import {
  about,
  brandLogo,
  cell,
  PAY_URL,
  row,
  withDescription,
  withQrCodeKit,
} from '../../testing/qr-code-story-kit';
import { AndesQrCode } from './qr-code';

const meta: Meta<AndesQrCode> = {
  title: 'Data Display/QR Code/Overview',
  component: AndesQrCode,
  tags: ['autodocs'],
  decorators: [withDescription, withQrCodeKit],
  parameters: {
    docs: {
      description: {
        component:
          'Draws a QR code from `value` with a built-in encoder (numeric, alphanumeric and byte modes, versions 1-40, error correction L/M/Q/H) and no runtime dependency. It renders crisp path-based SVG or a canvas, in dark modules on a light ground on every theme (what scanners read best), with square, rounded or dot modules and styled corner patterns. A centre logo (an image or any template) raises the error correction level as it needs, the `loading`, `expired` and `scanned` overlays cover a login or payment flow, and `download()`, `copy()`, `toSvg()` and `toDataUrl()` export it.',
      },
    },
  },
  argTypes: {
    value: { control: 'text' },
    type: { control: 'inline-radio', options: ['svg', 'canvas'] },
    size: { control: { type: 'range', min: 64, max: 320, step: 8 } },
    fluid: { control: 'boolean' },
    color: { control: 'color' },
    bgColor: { control: 'color' },
    finderColor: { control: 'color' },
    quietZoneColor: { control: 'color' },
    shape: { control: 'inline-radio', options: ['square', 'rounded', 'dots'] },
    finderShape: {
      control: 'inline-radio',
      options: ['square', 'rounded', 'circle'],
    },
    bordered: { control: 'boolean' },
    errorLevel: { control: 'inline-radio', options: ['L', 'M', 'Q', 'H'] },
    boostLevel: { control: 'boolean' },
    quietZone: { control: { type: 'number', min: 0, max: 8 } },
    mask: { control: { type: 'number', min: 0, max: 7 } },
    minVersion: { control: { type: 'number', min: 1, max: 40 } },
    icon: { control: 'text' },
    iconSize: { control: 'number' },
    iconBordered: { control: 'boolean' },
    excavate: { control: 'boolean' },
    status: {
      control: 'inline-radio',
      options: ['active', 'loading', 'expired', 'scanned'],
    },
  },
  args: {
    value: PAY_URL,
    type: 'svg',
    size: 160,
    fluid: false,
    shape: 'square',
    finderShape: 'square',
    bordered: true,
    errorLevel: 'M',
    boostLevel: true,
    quietZone: 2,
    iconBordered: true,
    excavate: true,
    status: 'active',
    refresh: fn(),
    encodeError: fn(),
  },
  render: (args) => ({
    props: args,
    template: `<andes-qr-code
      [value]="value"
      [type]="type"
      [size]="size"
      [fluid]="fluid"
      [color]="color"
      [bgColor]="bgColor"
      [finderColor]="finderColor"
      [quietZoneColor]="quietZoneColor"
      [shape]="shape"
      [finderShape]="finderShape"
      [bordered]="bordered"
      [errorLevel]="errorLevel"
      [boostLevel]="boostLevel"
      [quietZone]="quietZone"
      [mask]="mask"
      [minVersion]="minVersion"
      [icon]="icon"
      [iconSize]="iconSize"
      [iconBordered]="iconBordered"
      [excavate]="excavate"
      [status]="status"
      (refresh)="refresh()"
      (encodeError)="encodeError($event)"
      aria-label="Payment QR code"
    />`,
  }),
};

export default meta;

type Story = StoryObj<AndesQrCode>;

/** The playground. */
export const Playground: Story = {
  name: 'Playground',
  parameters: about(
    'Use the controls to try every input on one code; the default is a 160px symbol in a framed card, dark slate modules on white.',
  ),
};

/** The smallest use. */
export const BasicUsage: Story = {
  name: 'Basic usage',
  parameters: about(
    'Give it a value and it draws the code, named for assistive technology after the text it holds.',
  ),
  render: () => ({
    template: `<andes-qr-code value="${PAY_URL}" />`,
  }),
};

/** Sizes. */
export const Sizes: Story = {
  name: 'Sizes',
  parameters: about(
    'The size is the side of the whole graphic in pixels, quiet zone included, from a 96px badge to a 256px poster.',
  ),
  render: () => ({
    template: `
      <div style="${row} align-items: flex-end;">
        ${[96, 128, 160, 192, 256]
          .map((size) =>
            cell(
              `${size}px`,
              `<andes-qr-code value="${PAY_URL}" [size]="${size}" />`,
            ),
          )
          .join('')}
      </div>`,
  }),
};

/** All statuses. */
export const StatusesAtAGlance: Story = {
  name: 'Statuses at a glance',
  parameters: about(
    'A code in a login or payment flow is active until it expires, while it loads a fresh one, or once a phone has scanned it.',
  ),
  render: () => ({
    template: `
      <div style="${row}">
        ${(['active', 'loading', 'expired', 'scanned'] as const)
          .map((status) =>
            cell(
              status,
              `<andes-qr-code value="${PAY_URL}" status="${status}" />`,
            ),
          )
          .join('')}
      </div>`,
  }),
};

/** A logo. */
export const WithALogo: Story = {
  name: 'With a logo',
  parameters: about(
    'A logo in the centre clears the modules under it and raises the error correction level so the code still scans.',
  ),
  render: () => ({
    props: { logo: brandLogo() },
    template: `<andes-qr-code value="${PAY_URL}" [icon]="logo" [size]="192" />`,
  }),
};
