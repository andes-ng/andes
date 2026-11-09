import type { Meta, StoryObj } from '@storybook/angular';

import {
  about,
  caption,
  cell,
  column,
  PAY_URL,
  row,
  text,
  withDescription,
  withQrCodeKit,
} from '../../testing/qr-code-story-kit';
import type { AndesQrCode, AndesQrCodeSegment } from './index';
import { encodeQr, QR_ERROR_LEVELS, qrDataCodewords } from './qr-encoder';

/*
 * How much of the symbol can be lost and still scan (error correction level), and how the
 * encoder picks the version, the mask and the mode of the data.
 */

const meta: Meta<AndesQrCode> = {
  title: 'Data Display/QR Code/Error correction',
  decorators: [withDescription, withQrCodeKit],
};

export default meta;

type Story = StoryObj<AndesQrCode>;

const LEVEL_NOTES = {
  L: 'recovers about 7 %',
  M: 'recovers about 15 %',
  Q: 'recovers about 25 %',
  H: 'recovers about 30 %',
} as const;

const TABLE = `${text} border-collapse: collapse; min-width: 22rem;`;
const CELL =
  'padding: 0.375rem 0.75rem; border-bottom: 1px solid var(--andes-color-border); text-align: start;';

/** The four levels. */
export const FourLevels: Story = {
  name: 'Four levels',
  parameters: about(
    'L, M, Q and H trade capacity for redundancy: a higher level survives more damage and makes the symbol denser; the boost is switched off here to show each level as requested.',
  ),
  render: () => ({
    props: { levels: QR_ERROR_LEVELS, notes: LEVEL_NOTES },
    template: `
      <div style="${row}">
        @for (level of levels; track level) {
          <div style="display: flex; flex-direction: column; gap: 0.5rem;">
            <andes-qr-code #qr value="${PAY_URL}" [errorLevel]="level" [boostLevel]="false" [size]="176" [aria-label]="'Level ' + level" />
            <span style="${caption}">Level {{ level }}: {{ notes[level] }}</span>
            <span style="${caption}">Version {{ qr.version() }}, {{ qr.matrix()?.size }} modules</span>
          </div>
        }
      </div>`,
  }),
};

/** Density. */
export const LevelAndDensity: Story = {
  name: 'Level and density',
  parameters: about(
    'The same text at each level, in numbers: a higher level needs a larger version, so the modules get smaller on a code of the same size.',
  ),
  render: () => {
    const text120 =
      'https://andes.example/orders/2026/11/08/receipt?token=ab12cd34ef56&lang=es';
    return {
      props: {
        rows: QR_ERROR_LEVELS.map((level) => {
          const matrix = encodeQr(text120, {
            errorLevel: level,
            boostErrorLevel: false,
          });
          return { level, version: matrix.version, modules: matrix.size };
        }),
        sample: text120,
      },
      template: `
        <div style="${column}">
          <span style="${caption}; overflow-wrap: anywhere; max-width: 32rem;">{{ sample }}</span>
          <div style="${row}">
            @for (item of rows; track item.level) {
              <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                <andes-qr-code [value]="sample" [errorLevel]="item.level" [boostLevel]="false" [size]="144" [aria-label]="'Level ' + item.level" />
                <span style="${caption}">Level {{ item.level }}: version {{ item.version }}, {{ item.modules }} modules</span>
              </div>
            }
          </div>
        </div>`,
    };
  },
};

/** Capacity. */
export const CapacityByLevel: Story = {
  name: 'Capacity by level',
  parameters: about(
    'The number of data codewords (one byte each, before the header) that versions 1, 5, 10, 20 and 40 hold at each level.',
  ),
  render: () => ({
    props: {
      long: 'andes-ng '.repeat(20),
      levels: QR_ERROR_LEVELS,
      versions: [1, 5, 10, 20, 40].map((version) => ({
        version,
        counts: QR_ERROR_LEVELS.map((level) => qrDataCodewords(version, level)),
      })),
    },
    template: `
      <div style="${column}">
      <table style="${TABLE}">
        <thead>
          <tr>
            <th style="${CELL}">Version</th>
            @for (level of levels; track level) {
              <th style="${CELL}">{{ level }}</th>
            }
          </tr>
        </thead>
        <tbody>
          @for (item of versions; track item.version) {
            <tr>
              <td style="${CELL}">{{ item.version }}</td>
              @for (count of item.counts; track $index) {
                <td style="${CELL}">{{ count }}</td>
              }
            </tr>
          }
        </tbody>
      </table>
      <andes-qr-code #qr [value]="long" errorLevel="Q" [boostLevel]="false" [size]="176" aria-label="A longer code" />
      <span style="${caption}">180 characters at level Q need version {{ qr.version() }}</span>
      </div>`,
  }),
};

/** Auto upgrade. */
export const AutomaticUpgrade: Story = {
  name: 'Automatic upgrade',
  parameters: about(
    'With `boostLevel` (the default) the level rises whenever the data still fits the same version, so a code asked for L can come out as H at no cost in size.',
  ),
  render: () => ({
    template: `
      <div style="${row}">
        <div style="display: flex; flex-direction: column; gap: 0.5rem;">
          <andes-qr-code #on value="${PAY_URL}" errorLevel="L" [boostLevel]="true" [size]="176" aria-label="Boost on" />
          <span style="${caption}">boostLevel on: asked L, used {{ on.effectiveErrorLevel() }}</span>
        </div>
        <div style="display: flex; flex-direction: column; gap: 0.5rem;">
          <andes-qr-code #off value="${PAY_URL}" errorLevel="L" [boostLevel]="false" [size]="176" aria-label="Boost off" />
          <span style="${caption}">boostLevel off: asked L, used {{ off.effectiveErrorLevel() }}</span>
        </div>
      </div>`,
  }),
};

/** Auto version. */
export const AutomaticVersion: Story = {
  name: 'Automatic version',
  parameters: about(
    'The encoder picks the smallest version that fits, from 21 modules for a short word to 177 for the longest value, so longer text makes a finer symbol.',
  ),
  render: () => ({
    props: {
      samples: [10, 60, 200, 600].map((length) => ({
        length,
        value: 'andes-ng '.repeat(Math.ceil(length / 9)).slice(0, length),
      })),
    },
    template: `
      <div style="${row}">
        @for (sample of samples; track sample.length) {
          <div style="display: flex; flex-direction: column; gap: 0.5rem;">
            <andes-qr-code #qr [value]="sample.value" [size]="160" [aria-label]="sample.length + ' characters'" />
            <span style="${caption}">{{ sample.length }} characters: version {{ qr.version() }}</span>
          </div>
        }
      </div>`,
  }),
};

/** Mask. */
export const ForcedMask: Story = {
  name: 'Forced mask',
  parameters: about(
    'The encoder tries the eight masks and keeps the one with the lowest penalty; `mask` forces one, and every choice scans the same.',
  ),
  render: () => ({
    props: { masks: [0, 1, 2, 3, 4, 5, 6, 7] },
    template: `
      <div style="${row}">
        @for (mask of masks; track mask) {
          <div style="display: flex; flex-direction: column; gap: 0.5rem;">
            <andes-qr-code value="${PAY_URL}" [mask]="mask" [size]="112" [bordered]="false" [aria-label]="'Mask ' + mask" />
            <span style="${caption}">mask {{ mask }}</span>
          </div>
        }
        <div style="display: flex; flex-direction: column; gap: 0.5rem;">
          <andes-qr-code #auto value="${PAY_URL}" [size]="112" [bordered]="false" aria-label="Automatic mask" />
          <span style="${caption}">automatic: mask {{ auto.matrix()?.mask }}</span>
        </div>
      </div>`,
  }),
};

/** Min version. */
export const SmallestVersion: Story = {
  name: 'Smallest version',
  parameters: about(
    '`minVersion` starts the search at a larger version, for a finer grid with more room for error correction.',
  ),
  render: () => ({
    template: `
      <div style="${row}">
        ${[1, 5, 10]
          .map((version) =>
            cell(
              `minVersion ${version}`,
              `<andes-qr-code value="HELLO" [minVersion]="${version}" [size]="160" aria-label="Minimum version ${version}" />`,
            ),
          )
          .join('')}
      </div>`,
  }),
};

/** Modes. */
export const ModeSelection: Story = {
  name: 'Mode selection',
  parameters: about(
    'Digits use numeric mode, capitals with a few symbols use alphanumeric mode, and anything else uses bytes, so the same 40 characters need a smaller symbol the simpler they are.',
  ),
  render: () => ({
    props: {
      samples: [
        { label: 'Numeric', value: '1234567890'.repeat(4) },
        {
          label: 'Alphanumeric',
          value: 'HTTPS://ANDES.EXAMPLE/PAY/42-PROMO-2026'.slice(0, 40),
        },
        {
          label: 'Bytes',
          value: 'https://andes.example/pay/42?promo=2026'.slice(0, 40),
        },
      ],
    },
    template: `
      <div style="${row}">
        @for (sample of samples; track sample.label) {
          <div style="display: flex; flex-direction: column; gap: 0.5rem;">
            <andes-qr-code #qr [value]="sample.value" errorLevel="Q" [boostLevel]="false" [size]="160" [aria-label]="sample.label" />
            <span style="${caption}">{{ sample.label }}: version {{ qr.version() }}</span>
          </div>
        }
      </div>`,
  }),
};

/** Segments. */
export const MultiSegmentValue: Story = {
  name: 'Multi-segment value',
  parameters: about(
    'Pass a list as the value and each part is encoded in its most compact mode, or in the mode you name with `{ mode, text }`.',
  ),
  render: () => {
    const segments: AndesQrCodeSegment[] = [
      'https://andes.example/t/',
      { mode: 'numeric', text: '20261108000042' },
      { mode: 'alphanumeric', text: '-VIP' },
    ];
    return {
      props: { segments },
      template: `
        <div style="${column}">
          <andes-qr-code #qr [value]="segments" [size]="176" aria-label="Ticket QR code" />
          <span style="${caption}">Three segments, version {{ qr.version() }}</span>
        </div>`,
    };
  },
};

/** Segments save space. */
export const SegmentsSaveSpace: Story = {
  name: 'Segments save space',
  parameters: about(
    'A long run of digits inside a URL fits in fewer bits as its own numeric segment, so the list form can pick a smaller version than the same text as one string.',
  ),
  render: () => {
    const prefix = 'https://andes.example/t/';
    const digits = '202611080000420000000000000000000000';
    const parts: AndesQrCodeSegment[] = [
      prefix,
      { mode: 'numeric', text: digits },
    ];
    return {
      props: {
        one: prefix + digits,
        parts,
      },
      template: `
        <div style="${row}">
          <div style="display: flex; flex-direction: column; gap: 0.5rem;">
            <andes-qr-code #single [value]="one" errorLevel="Q" [boostLevel]="false" [size]="176" aria-label="One string" />
            <span style="${caption}">One string: version {{ single.version() }}</span>
          </div>
          <div style="display: flex; flex-direction: column; gap: 0.5rem;">
            <andes-qr-code #split [value]="parts" errorLevel="Q" [boostLevel]="false" [size]="176" aria-label="Two segments" />
            <span style="${caption}">Two segments: version {{ split.version() }}</span>
          </div>
        </div>`,
    };
  },
};
