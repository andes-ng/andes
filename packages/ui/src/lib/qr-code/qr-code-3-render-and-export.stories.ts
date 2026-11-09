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
import type { AndesQrCode, AndesQrCodeExportOptions } from './qr-code';

/*
 * How a code is drawn on screen (SVG or canvas) and how it leaves the page: PNG and SVG
 * downloads, the clipboard, data URLs and print.
 */

const meta: Meta<AndesQrCode> = {
  title: 'Data Display/QR Code/Render and export',
  decorators: [withDescription, withQrCodeKit],
};

export default meta;

type Story = StoryObj<AndesQrCode>;

/** A download or copy that reports what happened instead of failing silently. */
function exporter() {
  const note = signal('');
  return {
    note,
    async save(
      qr: AndesQrCode,
      name: string,
      options: AndesQrCodeExportOptions = {},
    ) {
      try {
        await qr.download(name, options);
        note.set(`Saved ${name}.${options.format === 'svg' ? 'svg' : 'png'}`);
      } catch (error) {
        note.set(error instanceof Error ? error.message : String(error));
      }
    },
    async copy(qr: AndesQrCode) {
      try {
        await qr.copy();
        note.set('Copied the image');
      } catch (error) {
        note.set(error instanceof Error ? error.message : String(error));
      }
    },
  };
}

/** Canvas and SVG. */
export const CanvasAndSvg: Story = {
  name: 'Canvas and SVG',
  parameters: about(
    'Both renderers draw the same symbol: SVG is a single path that scales without blurring, canvas paints a bitmap sized for the screen density.',
  ),
  render: () => ({
    template: `
      <div style="${row}">
        ${cell('type="svg" (default)', '<andes-qr-code value="' + PAY_URL + '" type="svg" aria-label="SVG QR code" />')}
        ${cell('type="canvas"', '<andes-qr-code value="' + PAY_URL + '" type="canvas" aria-label="Canvas QR code" />')}
      </div>`,
  }),
};

/** Crisp. */
export const CrispAtAnySize: Story = {
  name: 'Crisp at any size',
  parameters: about(
    'Resize the code with the slider: the SVG stays sharp at every size and the canvas repaints its bitmap for the new size.',
  ),
  render: () => ({
    props: { size: signal(160) },
    template: `
      <div style="${column}">
        <div style="width: 20rem; max-width: 100%;">
          <andes-slider aria-label="Size" [min]="64" [max]="360" [step]="8" [value]="size()" (valueChange)="size.set($any($event))" />
        </div>
        <span style="${caption}">{{ size() }}px</span>
        <div style="${row}">
          <andes-qr-code value="${PAY_URL}" type="svg" [size]="size()" aria-label="SVG QR code" />
          <andes-qr-code value="${PAY_URL}" type="canvas" [size]="size()" aria-label="Canvas QR code" />
        </div>
      </div>`,
  }),
};

/** High density. */
export const HighDensityCanvas: Story = {
  name: 'High-density canvas',
  parameters: about(
    'The canvas backing store is multiplied by the screen density, so on a 2x display a 160px code is a 320px bitmap.',
  ),
  render: () => ({
    props: { density: window.devicePixelRatio || 1 },
    template: `
      <div style="${column}">
        <andes-qr-code value="${PAY_URL}" type="canvas" aria-label="Canvas QR code" />
        <span style="${caption}">This screen: {{ density }}x, so the bitmap is {{ 160 * density }}px wide</span>
      </div>`,
  }),
};

/** Download PNG. */
export const DownloadPng: Story = {
  name: 'Download PNG',
  parameters: about(
    '`download()` saves the code as a PNG at twice its size through the browser, whichever renderer is on screen.',
  ),
  render: () => {
    const { note, save } = exporter();
    return {
      props: { note, save },
      template: `
        <div style="${column}">
          <andes-qr-code #qr value="${PAY_URL}" aria-label="Payment QR code" />
          <div style="${bar}">
            <andes-button variant="outline" (click)="save(qr, 'andes-pay')">
              <ng-icon slot="icon-start" name="lucideDownload" />
              Download PNG
            </andes-button>
            <span style="${caption}" role="status">{{ note() }}</span>
          </div>
        </div>`,
    };
  },
};

/** Download SVG. */
export const DownloadSvg: Story = {
  name: 'Download SVG',
  parameters: about(
    '`download(name, { format: "svg" })` saves a self-contained vector file with concrete colours, ready for print or design tools.',
  ),
  render: () => {
    const { note, save } = exporter();
    return {
      props: { note, save },
      template: `
        <div style="${column}">
          <andes-qr-code #qr value="${PAY_URL}" shape="rounded" finderShape="rounded" aria-label="Payment QR code" />
          <div style="${bar}">
            <andes-button variant="outline" (click)="save(qr, 'andes-pay', { format: 'svg' })">
              <ng-icon slot="icon-start" name="lucideDownload" />
              Download SVG
            </andes-button>
            <span style="${caption}" role="status">{{ note() }}</span>
          </div>
        </div>`,
    };
  },
};

/** Scale. */
export const DownloadAtALargerScale: Story = {
  name: 'Download at a larger scale',
  parameters: about(
    '`scale` multiplies the pixel size of the PNG, so a 160px code can be saved at 1280px for a poster.',
  ),
  render: () => {
    const { note, save } = exporter();
    const scale = signal(4);
    return {
      props: {
        note,
        save,
        scale,
        scales: [
          { value: 1, label: '1x (160px)' },
          { value: 2, label: '2x (320px)' },
          { value: 4, label: '4x (640px)' },
          { value: 8, label: '8x (1280px)' },
        ],
        options(): AndesQrCodeExportOptions {
          return { scale: scale() };
        },
      },
      template: `
        <div style="${column}">
          <andes-qr-code #qr value="${PAY_URL}" aria-label="Payment QR code" />
          <div style="${bar}">
            <div style="width: 11rem;">
              <andes-select aria-label="Scale" [options]="scales" [(value)]="scale" />
            </div>
            <andes-button variant="outline" (click)="save(qr, 'andes-pay-large', options())">
              <ng-icon slot="icon-start" name="lucideDownload" />
              Download
            </andes-button>
            <span style="${caption}" role="status">{{ note() }}</span>
          </div>
        </div>`,
    };
  },
};

/** Copy. */
export const CopyToTheClipboard: Story = {
  name: 'Copy to the clipboard',
  parameters: about(
    '`copy()` puts the PNG on the clipboard from a click, and `canCopy()` says whether this browser allows it so the button can be hidden or replaced.',
  ),
  render: () => {
    const { note, save, copy } = exporter();
    return {
      props: { note, save, copy },
      template: `
        <div style="${column}">
          <andes-qr-code #qr value="${PAY_URL}" aria-label="Payment QR code" />
          <div style="${bar}">
            <andes-button variant="outline" (click)="copy(qr)">
              <ng-icon slot="icon-start" name="lucideCopy" />
              Copy image
            </andes-button>
            <span style="${caption}" role="status">{{ note() }}</span>
          </div>
          <span style="${caption}">{{ qr.canCopy() ? 'This browser can copy images.' : 'This browser cannot copy images; offer a download instead.' }}</span>
        </div>`,
    };
  },
};

/** Data URLs. */
export const ExportAsDataUrlAndSvg: Story = {
  name: 'Export as data URL and SVG',
  parameters: about(
    '`toDataUrl()`, `toBlob()` and `toSvg()` hand the image to your own code, for an upload, an email or a PDF.',
  ),
  render: () => {
    const png = signal('');
    const svg = signal('');
    return {
      props: {
        png,
        svg,
        async exportBoth(qr: AndesQrCode) {
          svg.set(qr.toSvg());
          try {
            png.set(await qr.toDataUrl());
          } catch (error) {
            png.set(error instanceof Error ? error.message : String(error));
          }
        },
      },
      template: `
        <div style="${column} max-width: 32rem;">
          <andes-qr-code #qr value="${PAY_URL}" aria-label="Payment QR code" />
          <div style="${bar}">
            <andes-button variant="outline" (click)="exportBoth(qr)">Export</andes-button>
          </div>
          @if (svg()) {
            <span style="${caption}">SVG: {{ svg().length }} characters</span>
            <span style="${caption}; overflow-wrap: anywhere;">PNG data URL: {{ png().slice(0, 64) }}…</span>
          }
        </div>`,
    };
  },
};

/** Print colours. */
export const ExportInPrintColours: Story = {
  name: 'Export in print colours',
  parameters: about(
    'The export options `color` and `bgColor` override what is on screen, so a themed or tinted code can still be saved as pure black on white for print.',
  ),
  render: () => {
    const { note, save } = exporter();
    return {
      props: { note, save },
      template: `
        <div style="${column}">
          <andes-qr-code #qr value="${PAY_URL}" color="#1e3a8a" bgColor="#eff6ff" finderColor="#2563eb" aria-label="Payment QR code" />
          <div style="${bar}">
            <andes-button variant="outline" (click)="save(qr, 'andes-pay-print', { scale: 4, color: '#000000', bgColor: '#ffffff' })">
              <ng-icon slot="icon-start" name="lucidePrinter" />
              Download for print
            </andes-button>
            <span style="${caption}" role="status">{{ note() }}</span>
          </div>
        </div>`,
    };
  },
};

/** Print. */
export const PrintTheCode: Story = {
  name: 'Print the code',
  parameters: about(
    'The frame asks the browser to print its colours exactly and not to split across pages, so the code prints dark on light even with background graphics off.',
  ),
  render: () => ({
    props: {
      print() {
        window.print();
      },
    },
    template: `
      <div style="${column}">
        <andes-qr-code value="${PAY_URL}" [size]="200" aria-label="Payment QR code" />
        <div style="${bar}">
          <andes-button variant="outline" (click)="print()">
            <ng-icon slot="icon-start" name="lucidePrinter" />
            Print
          </andes-button>
        </div>
      </div>`,
  }),
};

/** Logo in exports. */
export const LogoInTheDownload: Story = {
  name: 'Logo in the download',
  parameters: about(
    'An `icon` image is part of every export; when the on-screen logo is a template, pass the same image as the `icon` export option.',
  ),
  render: () => {
    const { note, save } = exporter();
    return {
      props: { note, save, logo: brandLogo() },
      template: `
        <div style="${column}">
          <andes-qr-code #qr value="${PAY_URL}" [icon]="logo" [size]="192" aria-label="Payment QR code" />
          <div style="${bar}">
            <andes-button variant="outline" (click)="save(qr, 'andes-logo')">
              <ng-icon slot="icon-start" name="lucideDownload" />
              Download with the logo
            </andes-button>
            <span style="${caption}" role="status">{{ note() }}</span>
          </div>
        </div>`,
    };
  },
};
