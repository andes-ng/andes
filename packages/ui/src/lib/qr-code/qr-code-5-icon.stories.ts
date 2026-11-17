import { signal } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular';

import {
  about,
  bar,
  brandLogo,
  caption,
  cell,
  column,
  PAY_URL,
  row,
  withDescription,
  withQrCodeKit,
} from '../../testing/qr-code-story-kit';
import type { AndesQrCode } from './qr-code';

/*
 * A logo in the centre: an image or a template, its size and margin, whether the modules
 * under it are cleared, and the error correction level the logo asks for.
 */

const meta: Meta<AndesQrCode> = {
  title: 'Data Display/QR Code/Icon',
  decorators: [withDescription, withQrCodeKit],
};

export default meta;

type Story = StoryObj<AndesQrCode>;

/** Image. */
export const ImageLogo: Story = {
  name: 'Image logo',
  parameters: about(
    '`icon` takes the URL or data URI of an image, drawn contained in the centre at a fifth of the code unless `iconSize` says otherwise.',
  ),
  render: () => ({
    props: { logo: brandLogo() },
    template: `<andes-qr-code value="${PAY_URL}" [icon]="logo" [size]="192" aria-label="QR code with a logo" />`,
  }),
};

/** Lucide icon. */
export const LucideIconInTheCentre: Story = {
  name: 'Lucide icon in the centre',
  parameters: about(
    '`iconTemplate` takes any template, so a lucide icon through `ng-icon` can sit in the centre; it takes the code colour and fills the logo box.',
  ),
  render: () => ({
    template: `
      <div style="${row}">
        <ng-template #zap><ng-icon name="lucideZap" /></ng-template>
        <ng-template #heart><ng-icon name="lucideHeart" /></ng-template>
        <ng-template #store><ng-icon name="lucideStore" /></ng-template>
        ${cell('Zap', `<andes-qr-code value="${PAY_URL}" [iconTemplate]="zap" [size]="176" aria-label="With a bolt" />`)}
        ${cell('Heart', `<andes-qr-code value="${PAY_URL}" [iconTemplate]="heart" color="#9f1239" [size]="176" aria-label="With a heart" />`)}
        ${cell('Store', `<andes-qr-code value="${PAY_URL}" [iconTemplate]="store" color="#14532d" [size]="176" aria-label="With a shop" />`)}
      </div>`,
  }),
};

/** Tile. */
export const IconOnATile: Story = {
  name: 'Icon on a tile',
  parameters: about(
    'The template can be any markup, such as a coloured tile with a white lucide icon on it, sized in `em` so it follows the logo box.',
  ),
  render: () => ({
    template: `
      <ng-template #tile>
        <span style="display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; border-radius: 0.3em; background: #2563eb; color: #fff; font-size: 0.6em;">
          <ng-icon name="lucideShieldCheck" />
        </span>
      </ng-template>
      <andes-qr-code value="${PAY_URL}" [iconTemplate]="tile" [iconSize]="40" [size]="192" aria-label="With a tile" />`,
  }),
};

/** Sizes. */
export const LogoSizes: Story = {
  name: 'Logo sizes',
  parameters: about(
    '`iconSize` is the logo in pixels; a bigger logo hides more modules, so the level rises with it, as the captions show.',
  ),
  render: () => ({
    props: { logo: brandLogo(), sizes: [24, 32, 40, 48] },
    template: `
      <div style="${row}">
        @for (size of sizes; track size) {
          <div style="display: flex; flex-direction: column; gap: 0.5rem;">
            <andes-qr-code #qr value="${PAY_URL}" [icon]="logo" [iconSize]="size" [size]="176" [aria-label]="'Logo of ' + size + ' pixels'" />
            <span style="${caption}">{{ size }}px: level {{ qr.effectiveErrorLevel() }}</span>
          </div>
        }
      </div>`,
  }),
};

/** Wide. */
export const WideLogo: Story = {
  name: 'Wide logo',
  parameters: about(
    '`iconSize` also takes `{ width, height }` for a logo that is not square, such as a wordmark.',
  ),
  render: () => ({
    template: `
      <ng-template #wordmark>
        <span style="font-size: 0.5em; font-weight: 700; letter-spacing: 0.02em;">Andes</span>
      </ng-template>
      <andes-qr-code value="${PAY_URL}" [iconTemplate]="wordmark" [iconSize]="{ width: 64, height: 24 }" [size]="200" aria-label="With a wordmark" />`,
  }),
};

/** Excavate. */
export const Excavate: Story = {
  name: 'Excavate',
  parameters: about(
    '`excavate` (the default) clears the modules under the logo; turn it off to draw the logo over them, which asks more of the error correction and suits small logos.',
  ),
  render: () => ({
    props: { logo: brandLogo() },
    template: `
      <div style="${row}">
        ${cell('excavate (default)', '<andes-qr-code value="' + PAY_URL + '" [icon]="logo" [size]="192" aria-label="Cleared under the logo" />')}
        ${cell('excavate off', '<andes-qr-code value="' + PAY_URL + '" [icon]="logo" [iconSize]="28" [excavate]="false" [size]="192" aria-label="Logo over the modules" />')}
      </div>`,
  }),
};

/** Logo margin. */
export const LogoMargin: Story = {
  name: 'Logo margin',
  parameters: about(
    '`iconBordered` (the default) leaves one clear module around the logo so it does not touch the modules; turn it off to use that room for data.',
  ),
  render: () => ({
    props: { logo: brandLogo() },
    template: `
      <div style="${row}">
        ${cell('with a margin (default)', '<andes-qr-code #a value="' + PAY_URL + '" [icon]="logo" [size]="192" aria-label="Logo with a margin" />')}
        ${cell('no margin', '<andes-qr-code value="' + PAY_URL + '" [icon]="logo" [iconBordered]="false" [size]="192" aria-label="Logo without a margin" />')}
      </div>`,
  }),
};

/** Level boost. */
export const AutomaticLevelBoost: Story = {
  name: 'Automatic level boost',
  parameters: about(
    'Whatever level you ask for, a logo raises it as far as its size needs, so a code asked for L with a logo reports Q or H.',
  ),
  render: () => ({
    props: { logo: brandLogo() },
    template: `
      <div style="${row}">
        <div style="display: flex; flex-direction: column; gap: 0.5rem;">
          <andes-qr-code #plain value="${PAY_URL}" errorLevel="L" [boostLevel]="false" [size]="176" aria-label="No logo" />
          <span style="${caption}">No logo: asked L, used {{ plain.effectiveErrorLevel() }}</span>
        </div>
        <div style="display: flex; flex-direction: column; gap: 0.5rem;">
          <andes-qr-code #logoed value="${PAY_URL}" errorLevel="L" [boostLevel]="false" [icon]="logo" [size]="176" aria-label="With a logo" />
          <span style="${caption}">With a logo: asked L, used {{ logoed.effectiveErrorLevel() }}</span>
        </div>
      </div>`,
  }),
};

/** Oversized. */
export const OversizedLogo: Story = {
  name: 'Oversized logo',
  parameters: about(
    'A logo that covers more than level H can recover is flagged by `iconOversized` so you can shrink it before the code stops scanning.',
  ),
  render: () => ({
    props: { logo: brandLogo(), size: signal(40) },
    template: `
      <div style="${column}">
        <div style="width: 20rem; max-width: 100%;">
          <andes-slider aria-label="Logo size" [min]="16" [max]="100" [step]="2" [value]="size()" (valueChange)="size.set($any($event))" />
        </div>
        <andes-qr-code #qr value="${PAY_URL}" [icon]="logo" [iconSize]="size()" [size]="192" aria-label="Logo of a chosen size" />
        <span style="${caption}">{{ size() }}px, level {{ qr.effectiveErrorLevel() }}</span>
        @if (qr.iconOversized()) {
          <andes-tag color="warning">Too large to scan reliably</andes-tag>
        }
      </div>`,
  }),
};

/** Canvas. */
export const LogoOnCanvas: Story = {
  name: 'Logo on canvas',
  parameters: about(
    'On a canvas the modules are painted first and the logo follows once it has loaded, so the code is never blank while the image arrives.',
  ),
  render: () => ({
    props: { logo: brandLogo() },
    template: `<andes-qr-code value="${PAY_URL}" type="canvas" [icon]="logo" [size]="192" aria-label="Canvas QR code with a logo" />`,
  }),
};

/** Export logo. */
export const TemplateLogoInTheDownload: Story = {
  name: 'Template logo in the download',
  parameters: about(
    'A template logo is drawn by the page only, so give `download()` the `icon` option to put an image of the same mark into the saved file.',
  ),
  render: () => {
    const note = signal('');
    return {
      props: {
        note,
        logo: brandLogo(),
        async save(qr: AndesQrCode, logo: string) {
          try {
            await qr.download('andes-with-bolt', { icon: logo });
            note.set('Saved andes-with-bolt.png');
          } catch (error) {
            note.set(error instanceof Error ? error.message : String(error));
          }
        },
      },
      template: `
        <ng-template #zap><ng-icon name="lucideZap" /></ng-template>
        <div style="${column}">
          <andes-qr-code #qr value="${PAY_URL}" [iconTemplate]="zap" [size]="176" aria-label="With a bolt" />
          <div style="${bar}">
            <andes-button variant="outline" (click)="save(qr, logo)">
              <ng-icon slot="icon-start" name="lucideDownload" />
              Download with the logo
            </andes-button>
            <span style="${caption}" role="status">{{ note() }}</span>
          </div>
        </div>`,
    };
  },
};
