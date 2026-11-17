import type { QrErrorLevel, QrMode } from './qr-encoder';
import type { QrFinderShape, QrModuleShape } from './qr-render';

/**
 * The parts of a QR code that can be styled one by one:
 *
 * - `root`: the frame around the symbol (border, padding, background).
 * - `symbol`: the square that holds the drawing and the centre logo.
 * - `canvas` / `svg`: the drawing itself, whichever `type` is in use.
 * - `icon`: the centre logo (the image, or the box that holds the `iconTemplate`).
 * - `mask`: the overlay that covers the code while it is loading, expired or scanned.
 * - `status`: the text of that overlay.
 * - `refresh`: the refresh button of the expired overlay.
 */
export type AndesQrCodePart =
  'root' | 'symbol' | 'canvas' | 'svg' | 'icon' | 'mask' | 'status' | 'refresh';

/** Extra classes per part. */
export type AndesQrCodeClassNames = Partial<
  Record<AndesQrCodePart, string | readonly string[]>
>;

/** Inline styles of one part: camelCase or dashed names, custom properties included. */
export type AndesQrCodePartStyle = Readonly<
  Record<string, string | number | null | undefined>
>;

/** One style object per part. A number means pixels, except for unitless properties. */
export type AndesQrCodeStyles = Partial<
  Record<AndesQrCodePart, AndesQrCodePartStyle>
>;

/** What the function forms of `classNames` and `styles` can base their answer on. */
export interface AndesQrCodeStyleInfo {
  readonly props: {
    readonly type: 'svg' | 'canvas';
    readonly status: 'active' | 'loading' | 'expired' | 'scanned';
    readonly size: number;
    readonly bordered: boolean;
    readonly shape: QrModuleShape;
    readonly finderShape: QrFinderShape;
    /** The level in use, after the logo and `boostLevel` adjustments; `null` without a code. */
    readonly errorLevel: QrErrorLevel | null;
    readonly hasIcon: boolean;
    readonly hasCode: boolean;
  };
}

/** `classNames`: the parts' classes as an object, or computed from the QR code's props. */
export type AndesQrCodeClassNamesInput =
  | AndesQrCodeClassNames
  | ((info: AndesQrCodeStyleInfo) => AndesQrCodeClassNames);

/** `styles`: the parts' inline styles as an object, or computed from the QR code's props. */
export type AndesQrCodeStylesInput =
  AndesQrCodeStyles | ((info: AndesQrCodeStyleInfo) => AndesQrCodeStyles);

/** One part of a multi-segment `value`: a string, or a text in a mode of your choice. */
export type AndesQrCodeSegment =
  string | { readonly mode: QrMode; readonly text: string };

/** Why a value could not be turned into a code. */
export type AndesQrCodeErrorReason = 'overflow' | 'invalid';

/** What the `encodeError` output emits. */
export interface AndesQrCodeError {
  readonly reason: AndesQrCodeErrorReason;
  readonly message: string;
}

const UNITLESS = new Set([
  'opacity',
  'z-index',
  'font-weight',
  'line-height',
  'flex',
  'flex-grow',
  'flex-shrink',
  'order',
  'zoom',
  'scale',
  'aspect-ratio',
]);

function dashed(property: string): string {
  return property.startsWith('--')
    ? property
    : property.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
}

/**
 * Normalises one part's style object for an Angular `[style]` binding: dashed names, numbers
 * turned into pixels (unless the property is unitless) and no empty entries.
 */
export function andesQrCodeStyleObject(
  style: AndesQrCodePartStyle | undefined,
): Record<string, string> | null {
  if (!style) {
    return null;
  }
  const result: Record<string, string> = {};
  for (const [property, value] of Object.entries(style)) {
    if (value == null || value === '') {
      continue;
    }
    const name = dashed(property);
    result[name] =
      typeof value === 'number' && value !== 0 && !UNITLESS.has(name)
        ? `${value}px`
        : String(value);
  }
  return Object.keys(result).length ? result : null;
}

/** Joins the class entries of one part. */
export function andesQrCodeClassString(
  value: string | readonly string[] | undefined,
): string {
  return Array.isArray(value)
    ? value.filter(Boolean).join(' ')
    : ((value as string | undefined) ?? '');
}
