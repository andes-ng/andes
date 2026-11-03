import { AndesColor, type AndesColorInput } from './color';
import {
  clamp,
  hsbToRgb,
  roundTo,
  wrapHue,
  type AndesColorFormat,
} from './color-math';

/** One colour stop of a gradient, as an app writes it. */
export interface AndesGradientStop {
  /** The colour, as text (`'#ff0000'`, `'rgb(0 0 0 / 50%)'`) or an {@link AndesColor}. */
  color: AndesColorInput;
  /** Where the colour sits along the gradient line, in percent: 0 (start) to 100 (end). */
  position: number;
}

/**
 * A linear gradient as plain data: the angle of the gradient line and its colour stops. It
 * is what the colour picker's `value` holds in `mode="gradient"` when it is not CSS text.
 *
 * ```ts
 * const sunrise: AndesGradientValue = {
 *   angle: 90,
 *   stops: [
 *     { color: '#ff7a45', position: 0 },
 *     { color: '#ffd666', position: 100 },
 *   ],
 * };
 * ```
 */
export interface AndesGradientValue {
  /**
   * Direction of the gradient line in degrees, as in CSS `linear-gradient()`: `0` points up,
   * `90` to the right (the default), `180` down.
   */
  angle: number;
  /** The colour stops, at least two. Their order does not matter: they are sorted by position. */
  stops: readonly AndesGradientStop[];
}

/** A colour stop of an {@link AndesGradient}: the colour is always parsed. */
export interface AndesGradientColorStop {
  readonly color: AndesColor;
  readonly position: number;
}

/** Anything the colour picker accepts as a gradient: CSS text or an {@link AndesGradientValue}. */
export type AndesGradientInput = string | AndesGradientValue;

/** Angle of a gradient that does not say: CSS draws `linear-gradient()` top to bottom. */
const CSS_DEFAULT_ANGLE = 180;

/** Angle of a gradient made from a single colour or from scratch: left to right. */
export const ANDES_GRADIENT_DEFAULT_ANGLE = 90;

/**
 * `to <side>` keywords. Corners are taken as the 45 degree diagonals: CSS aims a corner at
 * the box's own corner, which depends on its proportions, so a square box is assumed.
 */
const DIRECTIONS: Readonly<Record<string, number>> = {
  'to top': 0,
  'to top right': 45,
  'to right top': 45,
  'to right': 90,
  'to bottom right': 135,
  'to right bottom': 135,
  'to bottom': 180,
  'to bottom left': 225,
  'to left bottom': 225,
  'to left': 270,
  'to top left': 315,
  'to left top': 315,
};

const ANGLE = /^([+-]?(?:\d+\.?\d*|\.\d+))(deg|grad|rad|turn)$/;
const PERCENT = /^([+-]?(?:\d+\.?\d*|\.\d+))%$/;

/** Splits on a separator outside parentheses: `rgb(0, 0, 0) 10%, red` on `,`. */
function splitTopLevel(text: string, separator: ',' | ' '): string[] {
  const parts: string[] = [];
  let depth = 0;
  let start = 0;
  for (let index = 0; index < text.length; index++) {
    const char = text[index];
    if (char === '(') {
      depth++;
    } else if (char === ')') {
      depth = Math.max(depth - 1, 0);
    } else if (
      depth === 0 &&
      (separator === ',' ? char === ',' : char.trim() === '')
    ) {
      parts.push(text.slice(start, index));
      start = index + 1;
    }
  }
  parts.push(text.slice(start));
  return separator === ' '
    ? parts.filter((part) => part !== '')
    : parts.map((part) => part.trim());
}

function parseAngle(text: string): number | null {
  if (text === '0') {
    return 0;
  }
  const direction = DIRECTIONS[text.split(' ').filter(Boolean).join(' ')];
  if (direction !== undefined) {
    return direction;
  }
  const match = ANGLE.exec(text);
  if (!match) {
    return null;
  }
  const value = Number(match[1]);
  switch (match[2]) {
    case 'grad':
      return value * 0.9;
    case 'rad':
      return (value * 180) / Math.PI;
    case 'turn':
      return value * 360;
    default:
      return value;
  }
}

interface LooseStop {
  color: AndesColor;
  position: number | null;
}

/** Reads `<colour> [<percent> [<percent>]]`; a second position repeats the colour there. */
function parseStop(text: string): LooseStop[] | null {
  const tokens = splitTopLevel(text, ' ');
  const positions: number[] = [];
  while (positions.length < 2 && tokens.length > 1) {
    const match = PERCENT.exec(tokens[tokens.length - 1]);
    if (!match) {
      break;
    }
    positions.unshift(Number(match[1]));
    tokens.pop();
  }
  const color = AndesColor.parse(tokens.join(' '));
  if (!color) {
    return null;
  }
  if (positions.length === 0) {
    return [{ color, position: null }];
  }
  return positions.map((position) => ({ color, position }));
}

/**
 * Fills in missing positions the way CSS does: the first stop defaults to 0%, the last to
 * 100%, a stop placed before an earlier one moves up to it, and runs of stops without a
 * position are spread evenly between their neighbours.
 */
function resolvePositions(
  stops: readonly LooseStop[],
): AndesGradientColorStop[] {
  const positions = stops.map((stop) => stop.position);
  if (positions[0] === null) {
    positions[0] = 0;
  }
  if (positions[positions.length - 1] === null) {
    positions[positions.length - 1] = 100;
  }
  let highest = -Infinity;
  for (let index = 0; index < positions.length; index++) {
    const position = positions[index];
    if (position !== null) {
      highest = Math.max(highest, position);
      positions[index] = highest;
    }
  }
  for (let index = 1; index < positions.length; index++) {
    if (positions[index] !== null) {
      continue;
    }
    let end = index;
    while (positions[end] === null) {
      end++;
    }
    const from = positions[index - 1] as number;
    const to = positions[end] as number;
    const span = end - index + 1;
    for (let gap = index; gap < end; gap++) {
      positions[gap] = from + ((to - from) * (gap - index + 1)) / span;
    }
    index = end;
  }
  return stops.map((stop, index) => ({
    color: stop.color,
    position: positions[index] as number,
  }));
}

/**
 * An immutable linear gradient: an angle and two or more colour stops, sorted by position
 * (stops at the same position keep their order). It is an {@link AndesGradientValue}, so it
 * can be used wherever one is expected, and it reads and writes CSS `linear-gradient()` text.
 *
 * ```ts
 * const g = AndesGradient.parse('linear-gradient(90deg, #ff0000, #0000ff)');
 * g?.colorAt(50).toHex();  // '#800080'
 * g?.toCss('rgb');          // 'linear-gradient(90deg, rgb(255, 0, 0) 0%, rgb(0, 0, 255) 100%)'
 * ```
 */
export class AndesGradient implements AndesGradientValue {
  /** Direction of the gradient line in degrees, `[0, 360)`; `90` is left to right. */
  readonly angle: number;
  /** The stops, sorted by position. */
  readonly stops: readonly AndesGradientColorStop[];

  private constructor(angle: number, stops: readonly AndesGradientColorStop[]) {
    this.angle = wrapHue(angle);
    this.stops = stops
      .map((stop, index) => ({
        color: stop.color,
        position: clamp(stop.position, 0, 100),
        index,
      }))
      .sort((a, b) => a.position - b.position || a.index - b.index)
      .map(({ color, position }) => ({ color, position }));
  }

  /**
   * A gradient from parsed stops. One stop is spread over the whole line (a flat gradient);
   * none gives `null`.
   */
  static create(
    angle: number,
    stops: readonly AndesGradientColorStop[],
  ): AndesGradient | null {
    if (stops.length === 0 || !Number.isFinite(angle)) {
      return null;
    }
    if (stops.length === 1) {
      return new AndesGradient(angle, [
        { color: stops[0].color, position: 0 },
        { color: stops[0].color, position: 100 },
      ]);
    }
    return new AndesGradient(angle, stops);
  }

  /** A flat gradient of one colour, left to right: what a single-colour value becomes. */
  static fromColor(color: AndesColor): AndesGradient {
    return new AndesGradient(ANDES_GRADIENT_DEFAULT_ANGLE, [
      { color, position: 0 },
      { color, position: 100 },
    ]);
  }

  /**
   * Reads CSS `linear-gradient()` text: an optional angle (`deg`, `grad`, `rad`, `turn`) or
   * `to <side>` keyword (default `to bottom`), then two or more stops of any colour
   * {@link AndesColor.parse} reads, each with up to two percentage positions. Lengths (`px`),
   * interpolation hints and the repeating or radial forms are not supported: `null`.
   */
  static parse(input: string): AndesGradient | null {
    const text = input.trim().toLowerCase();
    const prefix = 'linear-gradient(';
    if (!text.startsWith(prefix) || !text.endsWith(')')) {
      return null;
    }
    const parts = splitTopLevel(text.slice(prefix.length, -1), ',');
    if (parts.some((part) => part === '')) {
      return null;
    }
    const angle = parseAngle(parts[0]);
    const stopTexts = angle === null ? parts : parts.slice(1);
    const loose: LooseStop[] = [];
    for (const stopText of stopTexts) {
      const parsed = parseStop(stopText);
      if (!parsed) {
        return null;
      }
      loose.push(...parsed);
    }
    if (loose.length < 2) {
      return null;
    }
    return new AndesGradient(
      angle ?? CSS_DEFAULT_ANGLE,
      resolvePositions(loose),
    );
  }

  /**
   * The gradient itself, parsed CSS text, or an {@link AndesGradientValue} (stops whose
   * colour cannot be read are skipped); `null` for anything else.
   */
  static from(input: unknown): AndesGradient | null {
    if (input instanceof AndesGradient) {
      return input;
    }
    if (typeof input === 'string') {
      return AndesGradient.parse(input);
    }
    if (!isGradientValue(input)) {
      return null;
    }
    const stops = input.stops.flatMap((stop): AndesGradientColorStop[] => {
      const color = stop ? AndesColor.from(stop.color) : null;
      return color && Number.isFinite(stop.position)
        ? [{ color, position: stop.position }]
        : [];
    });
    return AndesGradient.create(
      Number.isFinite(input.angle) ? input.angle : ANDES_GRADIENT_DEFAULT_ANGLE,
      stops,
    );
  }

  /**
   * The colour the gradient shows at `position` (percent), interpolated between its two
   * neighbouring stops in premultiplied-alpha sRGB, as browsers paint gradients by default.
   */
  colorAt(position: number): AndesColor {
    const at = clamp(position, 0, 100);
    const stops = this.stops;
    if (at <= stops[0].position) {
      return stops[0].color;
    }
    const last = stops[stops.length - 1];
    if (at >= last.position) {
      return last.color;
    }
    const after = stops.findIndex((stop) => stop.position > at);
    const from = stops[after - 1];
    const to = stops[after];
    const t = (at - from.position) / (to.position - from.position);
    return interpolate(from.color, to.color, t);
  }

  /** A copy with another angle. */
  withAngle(angle: number): AndesGradient {
    return new AndesGradient(angle, this.stops);
  }

  /** A copy with every stop made opaque. */
  opaque(): AndesGradient {
    return new AndesGradient(
      this.angle,
      this.stops.map((stop) => ({
        color: stop.color.withAlpha(1),
        position: stop.position,
      })),
    );
  }

  /**
   * CSS `linear-gradient()` text with the stop colours in `format`. `hsb` is not CSS, so it
   * writes hex instead: the text always paints as given.
   */
  toCss(format: AndesColorFormat = 'hex', allowAlpha = true): string {
    const stops = this.toValue(format, allowAlpha).stops.map(
      (stop) => `${stop.color as string} ${stop.position}%`,
    );
    return `linear-gradient(${roundTo(this.angle, 2)}deg, ${stops.join(', ')})`;
  }

  /** The gradient as plain data, stop colours as text in `format` (`hsb` writes hex). */
  toValue(
    format: AndesColorFormat = 'hex',
    allowAlpha = true,
  ): AndesGradientValue {
    const cssFormat = format === 'hsb' ? 'hex' : format;
    return {
      angle: roundTo(this.angle, 2),
      stops: this.stops.map((stop) => ({
        color: stop.color.toFormat(cssFormat, allowAlpha),
        position: roundTo(stop.position, 2),
      })),
    };
  }

  /** Whether both gradients read identically: same angle, positions and visible colours. */
  equals(other: AndesGradient | null | undefined): boolean {
    if (!other || other.stops.length !== this.stops.length) {
      return false;
    }
    return (
      roundTo(other.angle, 2) === roundTo(this.angle, 2) &&
      this.stops.every(
        (stop, index) =>
          roundTo(stop.position, 2) ===
            roundTo(other.stops[index].position, 2) &&
          stop.color.equals(other.stops[index].color),
      )
    );
  }

  toString(): string {
    return this.toCss();
  }

  toJSON(): AndesGradientValue {
    return this.toValue();
  }
}

function isGradientValue(input: unknown): input is AndesGradientValue {
  return (
    typeof input === 'object' &&
    input !== null &&
    Array.isArray((input as AndesGradientValue).stops)
  );
}

/** Mixes two colours `t` (0-1) of the way, premultiplied by alpha. */
function interpolate(from: AndesColor, to: AndesColor, t: number): AndesColor {
  const a = hsbToRgb(from.hue, from.saturation, from.brightness);
  const b = hsbToRgb(to.hue, to.saturation, to.brightness);
  const alpha = from.alpha + (to.alpha - from.alpha) * t;
  if (alpha === 0) {
    return AndesColor.fromRgb(0, 0, 0, 0);
  }
  const channel = (x: number, y: number) =>
    (x * from.alpha + (y * to.alpha - x * from.alpha) * t) / alpha;
  return AndesColor.fromRgb(
    channel(a.r, b.r),
    channel(a.g, b.g),
    channel(a.b, b.b),
    alpha,
  );
}
