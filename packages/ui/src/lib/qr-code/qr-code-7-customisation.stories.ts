import { Component, ViewEncapsulation } from '@angular/core';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';

import {
  about,
  caption,
  cell,
  column,
  PAY_URL,
  row,
  withDescription,
  withQrCodeKit,
} from '../../testing/qr-code-story-kit';
import {
  AndesQrCode,
  type AndesQrCodeClassNamesInput,
  type AndesQrCodeStylesInput,
} from './index';

/*
 * Making the code fit a design: classes and styles per part, as objects or as functions of
 * the code's props, and the CSS custom properties that set its colours and frame.
 */

/** Classes the `classNames` stories hand to the code; global, so they reach its parts. */
@Component({
  selector: 'andes-qr-code-story-classes',
  imports: [AndesQrCode],
  encapsulation: ViewEncapsulation.None,
  styles: `
    .story-qr-frame {
      box-shadow: 0 6px 16px rgb(0 0 0 / 12%);
      border-color: var(--andes-color-primary);
    }
    .story-qr-symbol {
      border-radius: 0.25rem;
      outline: 1px dashed var(--andes-color-border);
      outline-offset: 4px;
    }
    .story-qr-mask {
      backdrop-filter: blur(2px);
    }
    .story-qr-status {
      font-weight: 600;
      letter-spacing: 0.02em;
    }
    .story-qr-refresh {
      text-transform: uppercase;
    }
  `,
  template: `
    <div style="${row}">
      <andes-qr-code
        value="${PAY_URL}"
        aria-label="Framed QR code"
        [classNames]="active"
      />
      <andes-qr-code
        value="${PAY_URL}"
        status="expired"
        aria-label="Expired QR code"
        [classNames]="expired"
      />
    </div>
  `,
})
class QrCodeStoryClasses {
  protected readonly active: AndesQrCodeClassNamesInput = {
    root: 'story-qr-frame',
    symbol: 'story-qr-symbol',
  };
  protected readonly expired: AndesQrCodeClassNamesInput = {
    root: 'story-qr-frame',
    mask: 'story-qr-mask',
    status: 'story-qr-status',
    refresh: 'story-qr-refresh',
  };
}

const meta: Meta<AndesQrCode> = {
  title: 'Data Display/QR Code/Customisation',
  decorators: [
    withDescription,
    withQrCodeKit,
    moduleMetadata({ imports: [QrCodeStoryClasses] }),
  ],
};

export default meta;

type Story = StoryObj<AndesQrCode>;

/** Class names. */
export const ClassNamesPerPart: Story = {
  name: 'Class names per part',
  parameters: about(
    '`classNames` adds classes to the `root`, `symbol`, `canvas`, `svg`, `icon`, `mask`, `status` and `refresh` parts, so each can be restyled from your own stylesheet.',
  ),
  render: () => ({
    template: `<andes-qr-code-story-classes />`,
  }),
};

/** Inline styles. */
export const StylesPerPart: Story = {
  name: 'Styles per part',
  parameters: about(
    '`styles` sets inline styles on the same parts; a number means pixels, and custom properties are allowed.',
  ),
  render: () => ({
    props: {
      styles: {
        root: { borderRadius: 24, boxShadow: '0 8px 24px rgb(15 23 42 / 18%)' },
        symbol: { opacity: 0.95 },
        mask: { backdropFilter: 'blur(3px)' },
        status: { fontWeight: 600, color: '#9a3412' },
        refresh: { borderRadius: 999 },
      } satisfies AndesQrCodeStylesInput,
    },
    template: `
      <div style="${row}">
        ${cell('active', '<andes-qr-code value="' + PAY_URL + '" [styles]="styles" aria-label="Styled QR code" />')}
        ${cell('expired', '<andes-qr-code value="' + PAY_URL + '" status="expired" [styles]="styles" aria-label="Styled expired QR code" />')}
      </div>`,
  }),
};

/** Functions. */
export const FunctionsOfTheProps: Story = {
  name: 'Functions of the props',
  parameters: about(
    'Both inputs also take a function of `{ props }`, so a part can change with the status, the size, the shape or the level in use.',
  ),
  render: () => ({
    props: {
      styles: (({ props }) => ({
        root: {
          borderColor:
            props.status === 'expired'
              ? 'var(--andes-color-danger)'
              : props.status === 'scanned'
                ? 'var(--andes-color-success)'
                : undefined,
          borderWidth: props.status === 'active' ? undefined : 2,
        },
      })) satisfies AndesQrCodeStylesInput,
      classNames: (({ props }) => ({
        root: `qr-level-${props.errorLevel}`,
      })) satisfies AndesQrCodeClassNamesInput,
    },
    template: `
      <div style="${row}">
        ${(['active', 'expired', 'scanned'] as const)
          .map((status) =>
            cell(
              status,
              `<andes-qr-code value="${PAY_URL}" status="${status}" [styles]="styles" [classNames]="classNames" aria-label="${status} QR code" />`,
            ),
          )
          .join('')}
      </div>`,
  }),
};

/** Colour hooks. */
export const ColourHooks: Story = {
  name: 'Colour hooks',
  parameters: about(
    'The colours are CSS custom properties, `--andes-qr-code-color`, `-bg`, `-finder` and `-quiet`, so a wrapper can set them for every code inside it.',
  ),
  render: () => ({
    template: `
      <div style="${row}">
        <div style="--andes-qr-code-color: #7c2d12; --andes-qr-code-bg: #fff7ed; --andes-qr-code-finder: #c2410c;">
          ${cell('Warm', '<andes-qr-code value="' + PAY_URL + '" finderShape="rounded" aria-label="Warm QR code" />')}
        </div>
        <div style="--andes-qr-code-color: #14532d; --andes-qr-code-bg: #f0fdf4; --andes-qr-code-quiet: #dcfce7;">
          ${cell('Green', '<andes-qr-code value="' + PAY_URL + '" shape="rounded" aria-label="Green QR code" />')}
        </div>
      </div>`,
  }),
};

/** Frame hooks. */
export const FrameHooks: Story = {
  name: 'Frame hooks',
  parameters: about(
    '`--andes-qr-code-radius` and `--andes-qr-code-padding` change the frame without touching the symbol.',
  ),
  render: () => ({
    template: `
      <div style="${row}">
        <div style="--andes-qr-code-radius: 1.5rem; --andes-qr-code-padding: 1.5rem;">
          ${cell('Round and roomy', '<andes-qr-code value="' + PAY_URL + '" aria-label="Round QR code" />')}
        </div>
        <div style="--andes-qr-code-radius: 0; --andes-qr-code-padding: 0.25rem;">
          ${cell('Square and snug', '<andes-qr-code value="' + PAY_URL + '" aria-label="Square QR code" />')}
        </div>
      </div>`,
  }),
};

/** Mask hook. */
export const OverlayHook: Story = {
  name: 'Overlay hook',
  parameters: about(
    '`--andes-qr-code-mask-bg` sets the colour of the overlay over the code, for a stronger or tinted cover.',
  ),
  render: () => ({
    template: `
      <div style="${row}">
        <div style="--andes-qr-code-mask-bg: rgb(255 255 255 / 70%);">
          ${cell('See-through', '<andes-qr-code value="' + PAY_URL + '" status="expired" aria-label="See-through overlay" />')}
        </div>
        <div style="--andes-qr-code-mask-bg: #fef2f2;">
          ${cell('Tinted', '<andes-qr-code value="' + PAY_URL + '" status="expired" aria-label="Tinted overlay" />')}
        </div>
      </div>`,
  }),
};

/** The parts, for reference. */
export const PartsAtAGlance: Story = {
  name: 'Parts at a glance',
  parameters: about(
    'Each part can be outlined with `styles` to see what `classNames` and `styles` reach: the frame, the symbol, the drawing, the logo, the overlay, its text and the refresh button.',
  ),
  render: () => ({
    props: {
      styles: {
        root: { outline: '2px dashed #2563eb', outlineOffset: 2 },
        symbol: { outline: '2px dashed #16a34a' },
        svg: { outline: '2px dashed #f59e0b' },
        mask: { outline: '2px dashed #dc2626', outlineOffset: -4 },
        status: { outline: '1px dashed #7c3aed' },
        refresh: { outline: '1px dashed #db2777' },
      } satisfies AndesQrCodeStylesInput,
    },
    template: `
      <div style="${column}">
        <andes-qr-code value="${PAY_URL}" status="expired" [size]="192" [styles]="styles" aria-label="Outlined parts" />
        <span style="${caption}">root, symbol, svg, mask, status text and refresh button</span>
      </div>`,
  }),
};
