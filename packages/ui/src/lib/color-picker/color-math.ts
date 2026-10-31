/**
 * Pure colour math for the colour picker: conversions between RGB, HSB (also called HSV),
 * HSL and OKLCH, a tolerant string parser, the matching formatters and the WCAG contrast
 * ratio. Nothing here touches the DOM or Angular, so it is tested on its own.
 *
 * Conventions used by every function in this module:
 * - `r`, `g`, `b` are 0-255, `a` is 0-1;
 * - `h` is degrees, 0-360 (360 is folded back to 0 by the parsers);
 * - `s`, `b` (HSB) and `s`, `l` (HSL) are percentages, 0-100;
 * - OKLCH lightness `l` is 0-1, chroma `c` is unbounded (sRGB colours stay under 0.33) and
 *   its hue is in degrees.
 *
 * Parsing uses string operations and static regular expressions only.
 */

/** An RGB colour with alpha: channels 0-255, alpha 0-1. */
export interface AndesRgba {
  r: number;
  g: number;
  b: number;
  a: number;
}

/** An HSB (HSV) colour with alpha: hue 0-360, saturation and brightness 0-100, alpha 0-1. */
export interface AndesHsba {
  h: number;
  s: number;
  b: number;
  a: number;
}

/** An HSL colour with alpha: hue 0-360, saturation and lightness 0-100, alpha 0-1. */
export interface AndesHsla {
  h: number;
  s: number;
  l: number;
  a: number;
}

/** An OKLCH colour with alpha: lightness 0-1, chroma 0-0.4 (sRGB), hue in degrees, alpha 0-1. */
export interface AndesOklch {
  l: number;
  c: number;
  h: number;
  a: number;
}

/**
 * The text formats a colour can be shown and edited in. `hsb` is the picker's own notation
 * (not CSS); every other format is valid CSS colour text.
 */
export type AndesColorFormat = 'hex' | 'rgb' | 'hsb' | 'hsl' | 'oklch';

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Rounds to `digits` decimals (`0` by default). */
export function roundTo(value: number, digits = 0): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

/** Folds any angle into `[0, 360)`. */
export function wrapHue(hue: number): number {
  const wrapped = hue % 360;
  return wrapped < 0 ? wrapped + 360 : wrapped;
}

/** Converts RGB (0-255) to HSB: hue in degrees, saturation and brightness in percent. */
export function rgbToHsb(
  r: number,
  g: number,
  b: number,
): { h: number; s: number; b: number } {
  const red = clamp(r, 0, 255) / 255;
  const green = clamp(g, 0, 255) / 255;
  const blue = clamp(b, 0, 255) / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const delta = max - min;

  let h = 0;
  if (delta !== 0) {
    if (max === red) {
      h = ((green - blue) / delta) % 6;
    } else if (max === green) {
      h = (blue - red) / delta + 2;
    } else {
      h = (red - green) / delta + 4;
    }
    h = wrapHue(h * 60);
  }

  return {
    h,
    s: max === 0 ? 0 : (delta / max) * 100,
    b: max * 100,
  };
}

/** Converts HSB to RGB; the channels are returned as floats, round them at the edge. */
export function hsbToRgb(
  h: number,
  s: number,
  b: number,
): { r: number; g: number; b: number } {
  const hue = wrapHue(h) / 60;
  const saturation = clamp(s, 0, 100) / 100;
  const value = clamp(b, 0, 100) / 100;

  const chroma = value * saturation;
  const x = chroma * (1 - Math.abs((hue % 2) - 1));
  const m = value - chroma;

  let red = 0;
  let green = 0;
  let blue = 0;
  if (hue < 1) {
    [red, green, blue] = [chroma, x, 0];
  } else if (hue < 2) {
    [red, green, blue] = [x, chroma, 0];
  } else if (hue < 3) {
    [red, green, blue] = [0, chroma, x];
  } else if (hue < 4) {
    [red, green, blue] = [0, x, chroma];
  } else if (hue < 5) {
    [red, green, blue] = [x, 0, chroma];
  } else {
    [red, green, blue] = [chroma, 0, x];
  }

  return {
    r: (red + m) * 255,
    g: (green + m) * 255,
    b: (blue + m) * 255,
  };
}

/** Converts HSB to HSL (same hue). */
export function hsbToHsl(
  h: number,
  s: number,
  b: number,
): { h: number; s: number; l: number } {
  const saturation = clamp(s, 0, 100) / 100;
  const value = clamp(b, 0, 100) / 100;
  const lightness = value * (1 - saturation / 2);
  const hslSaturation =
    lightness === 0 || lightness === 1
      ? 0
      : (value - lightness) / Math.min(lightness, 1 - lightness);
  return {
    h: wrapHue(h),
    s: hslSaturation * 100,
    l: lightness * 100,
  };
}

/** Converts HSL to HSB (same hue). */
export function hslToHsb(
  h: number,
  s: number,
  l: number,
): { h: number; s: number; b: number } {
  const saturation = clamp(s, 0, 100) / 100;
  const lightness = clamp(l, 0, 100) / 100;
  const value = lightness + saturation * Math.min(lightness, 1 - lightness);
  return {
    h: wrapHue(h),
    s: value === 0 ? 0 : 2 * (1 - lightness / value) * 100,
    b: value * 100,
  };
}

/** Converts RGB (0-255) to HSL. */
export function rgbToHsl(
  r: number,
  g: number,
  b: number,
): { h: number; s: number; l: number } {
  const hsb = rgbToHsb(r, g, b);
  return hsbToHsl(hsb.h, hsb.s, hsb.b);
}

/** Converts HSL to RGB; the channels are returned as floats. */
export function hslToRgb(
  h: number,
  s: number,
  l: number,
): { r: number; g: number; b: number } {
  const hsb = hslToHsb(h, s, l);
  return hsbToRgb(hsb.h, hsb.s, hsb.b);
}

/**
 * A subset of the CSS named colours, enough for hand-written values and presets. Keys are
 * lower case, values are 6-digit hex.
 */
export const ANDES_NAMED_COLORS: Readonly<Record<string, string>> = {
  aqua: '#00ffff',
  beige: '#f5f5dc',
  black: '#000000',
  blue: '#0000ff',
  brown: '#a52a2a',
  chocolate: '#d2691e',
  coral: '#ff7f50',
  crimson: '#dc143c',
  cyan: '#00ffff',
  fuchsia: '#ff00ff',
  gold: '#ffd700',
  gray: '#808080',
  green: '#008000',
  grey: '#808080',
  indigo: '#4b0082',
  ivory: '#fffff0',
  khaki: '#f0e68c',
  lavender: '#e6e6fa',
  lime: '#00ff00',
  magenta: '#ff00ff',
  maroon: '#800000',
  navy: '#000080',
  olive: '#808000',
  orange: '#ffa500',
  orchid: '#da70d6',
  pink: '#ffc0cb',
  plum: '#dda0dd',
  purple: '#800080',
  red: '#ff0000',
  salmon: '#fa8072',
  silver: '#c0c0c0',
  tan: '#d2b48c',
  teal: '#008080',
  tomato: '#ff6347',
  turquoise: '#40e0d0',
  violet: '#ee82ee',
  white: '#ffffff',
  yellow: '#ffff00',
};

/** What {@link parseColor} returns: the RGBA reading, plus the HSB reading when the text was
 *  written in a hue-based model (so a hue survives for greys and black). */
export interface AndesParsedColor extends AndesRgba {
  hsb?: { h: number; s: number; b: number };
}

const COMPONENT = /^([+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?)(%|deg)?$/i;
const HEX_DIGITS = /^[\da-f]+$/i;

interface ParsedComponent {
  value: number;
  unit: '%' | 'deg' | '';
}

function parseComponent(text: string): ParsedComponent | null {
  const match = COMPONENT.exec(text);
  if (!match) {
    return null;
  }
  const value = Number(match[1]);
  if (!Number.isFinite(value)) {
    return null;
  }
  return {
    value,
    unit: (match[2]?.toLowerCase() ?? '') as ParsedComponent['unit'],
  };
}

function parseAlpha(component: ParsedComponent | undefined): number | null {
  if (!component) {
    return 1;
  }
  if (component.unit === 'deg') {
    return null;
  }
  const alpha =
    component.unit === '%' ? component.value / 100 : component.value;
  return clamp(alpha, 0, 1);
}

function parseHex(digits: string): AndesParsedColor | null {
  if (!HEX_DIGITS.test(digits)) {
    return null;
  }
  let expanded = digits;
  if (digits.length === 3 || digits.length === 4) {
    expanded = [...digits].map((digit) => digit + digit).join('');
  }
  if (expanded.length !== 6 && expanded.length !== 8) {
    return null;
  }
  const channel = (index: number) =>
    parseInt(expanded.slice(index * 2, index * 2 + 2), 16);
  return {
    r: channel(0),
    g: channel(1),
    b: channel(2),
    a: expanded.length === 8 ? channel(3) / 255 : 1,
  };
}

function parseFunctional(
  name: string,
  args: readonly string[],
): AndesParsedColor | null {
  if (args.length < 3 || args.length > 4) {
    return null;
  }
  const parts = args.map(parseComponent);
  if (parts.some((part) => part === null)) {
    return null;
  }
  const [first, second, third, fourth] = parts as ParsedComponent[];
  const a = parseAlpha(fourth);
  if (a === null) {
    return null;
  }

  if (name === 'oklch') {
    return parseOklchComponents(first, second, third, a);
  }

  if (name === 'rgb' || name === 'rgba') {
    if ([first, second, third].some((part) => part.unit === 'deg')) {
      return null;
    }
    const channel = (part: ParsedComponent) =>
      clamp(part.unit === '%' ? (part.value / 100) * 255 : part.value, 0, 255);
    return {
      r: Math.round(channel(first)),
      g: Math.round(channel(second)),
      b: Math.round(channel(third)),
      a,
    };
  }

  // Hue-based models: the hue is an angle (a bare number or `deg`), the other two are
  // percentages whose `%` sign is optional.
  if (first.unit === '%' || second.unit === 'deg' || third.unit === 'deg') {
    return null;
  }
  const h = wrapHue(first.value);
  const s = clamp(second.value, 0, 100);
  const third100 = clamp(third.value, 0, 100);
  const hsb =
    name === 'hsl' || name === 'hsla'
      ? hslToHsb(h, s, third100)
      : { h, s, b: third100 };
  const rgb = hsbToRgb(hsb.h, hsb.s, hsb.b);
  return {
    r: Math.round(rgb.r),
    g: Math.round(rgb.g),
    b: Math.round(rgb.b),
    a,
    hsb,
  };
}

export interface AndesParseColorOptions {
  /** Also accept hex digits without the leading `#` (`1677ff`). Default `false`. */
  bareHex?: boolean;
}

/**
 * Reads a colour from text: `#rgb`, `#rgba`, `#rrggbb`, `#rrggbbaa`, `rgb()`/`rgba()`,
 * `hsl()`/`hsla()`, `hsb()`/`hsba()`/`hsv()`/`hsva()` (comma or space separated, alpha after a
 * comma or a slash, percentages allowed), `oklch()` (space separated, alpha after a slash), a
 * subset of the named colours and `transparent`. Returns `null` for anything else.
 */
export function parseColor(
  input: string,
  options: AndesParseColorOptions = {},
): AndesParsedColor | null {
  const text = input.trim().toLowerCase();
  if (!text) {
    return null;
  }

  if (text.startsWith('#')) {
    return parseHex(text.slice(1));
  }

  if (text === 'transparent') {
    return { r: 0, g: 0, b: 0, a: 0 };
  }

  const named = ANDES_NAMED_COLORS[text];
  if (named) {
    return parseHex(named.slice(1));
  }

  const functional = /^(rgba?|hsla?|hsba?|hsva?|oklch)\(\s*([^)]*?)\s*\)$/.exec(
    text,
  );
  if (functional) {
    const name = functional[1].replace(/^hsv/, 'hsb');
    const args = functional[2].split(/[\s,/]+/).filter(Boolean);
    return parseFunctional(name, args);
  }

  if (options.bareHex) {
    return parseHex(text);
  }
  return null;
}

function hexByte(value: number): string {
  return clamp(Math.round(value), 0, 255).toString(16).padStart(2, '0');
}

/** `#rrggbb`, or `#rrggbbaa` when `alpha` is below 1 and `allowAlpha` is not turned off. */
export function formatHex(rgba: AndesRgba, allowAlpha = true): string {
  const base = `#${hexByte(rgba.r)}${hexByte(rgba.g)}${hexByte(rgba.b)}`;
  return allowAlpha && rgba.a < 1 ? base + hexByte(rgba.a * 255) : base;
}

function alphaText(alpha: number): string {
  return String(roundTo(clamp(alpha, 0, 1), 2));
}

/** `rgb(r, g, b)`, or `rgba(r, g, b, a)` when the colour is not opaque. */
export function formatRgb(rgba: AndesRgba): string {
  const channels = [rgba.r, rgba.g, rgba.b]
    .map((channel) => clamp(Math.round(channel), 0, 255))
    .join(', ');
  return rgba.a < 1
    ? `rgba(${channels}, ${alphaText(rgba.a)})`
    : `rgb(${channels})`;
}

/** `hsl(h, s%, l%)`, or `hsla(h, s%, l%, a)` when the colour is not opaque. */
export function formatHsl(hsla: AndesHsla): string {
  const body = `${Math.round(wrapHue(hsla.h))}, ${Math.round(hsla.s)}%, ${Math.round(hsla.l)}%`;
  return hsla.a < 1 ? `hsla(${body}, ${alphaText(hsla.a)})` : `hsl(${body})`;
}

/** `hsb(h, s%, b%)`, or `hsba(h, s%, b%, a)` when the colour is not opaque. */
export function formatHsb(hsba: AndesHsba): string {
  const body = `${Math.round(wrapHue(hsba.h))}, ${Math.round(hsba.s)}%, ${Math.round(hsba.b)}%`;
  return hsba.a < 1 ? `hsba(${body}, ${alphaText(hsba.a)})` : `hsb(${body})`;
}

/** `oklch(L% C H)`, or `oklch(L% C H / a)` when the colour is not opaque. */
export function formatOklch(oklch: AndesOklch): string {
  const lightness = roundTo(clamp(oklch.l, 0, 1) * 100, 2);
  const chroma = roundTo(Math.max(oklch.c, 0), 4);
  // An achromatic colour has no hue; `0` is what CSS serialises for it.
  const hue = chroma === 0 ? 0 : roundTo(wrapHue(oklch.h), 2) % 360;
  const body = `${lightness}% ${chroma} ${hue}`;
  return oklch.a < 1
    ? `oklch(${body} / ${alphaText(oklch.a)})`
    : `oklch(${body})`;
}

// ----- OKLCH ------------------------------------------------------------------------------

/** sRGB transfer function, decoding: a 0-1 channel to linear light. */
export function srgbToLinear(channel: number): number {
  const value = clamp(channel, 0, 1);
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

/** sRGB transfer function, encoding: linear light to a 0-1 channel. */
export function linearToSrgb(channel: number): number {
  const value = clamp(channel, 0, 1);
  return value <= 0.0031308
    ? value * 12.92
    : 1.055 * value ** (1 / 2.4) - 0.055;
}

/**
 * Converts RGB (0-255, floats welcome) to OKLCH through linear sRGB and OKLab, with the
 * published OKLab matrices. Chroma under `1e-6` counts as none, and its hue is then `0`.
 */
export function rgbToOklch(
  r: number,
  g: number,
  b: number,
): { l: number; c: number; h: number } {
  const red = srgbToLinear(r / 255);
  const green = srgbToLinear(g / 255);
  const blue = srgbToLinear(b / 255);

  const l = Math.cbrt(
    0.4122214708 * red + 0.5363325363 * green + 0.0514459929 * blue,
  );
  const m = Math.cbrt(
    0.2119034982 * red + 0.6806995451 * green + 0.1073969566 * blue,
  );
  const s = Math.cbrt(
    0.0883024619 * red + 0.2817188376 * green + 0.6299787005 * blue,
  );

  const lightness = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const bAxis = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;

  const chroma = Math.hypot(a, bAxis);
  return {
    l: lightness,
    c: chroma < 1e-6 ? 0 : chroma,
    h: chroma < 1e-6 ? 0 : wrapHue((Math.atan2(bAxis, a) * 180) / Math.PI),
  };
}

/**
 * Converts OKLCH to RGB (0-255 floats). Colours outside the sRGB gamut are clipped channel by
 * channel, which is what a browser does when it paints them on an sRGB screen; the clip can
 * shift the hue of very saturated colours a little.
 */
export function oklchToRgb(
  l: number,
  c: number,
  h: number,
): { r: number; g: number; b: number } {
  const radians = (wrapHue(h) * Math.PI) / 180;
  const chroma = Math.max(c, 0);
  const a = chroma * Math.cos(radians);
  const bAxis = chroma * Math.sin(radians);
  const lightness = clamp(l, 0, 1);

  const l3 = (lightness + 0.3963377774 * a + 0.2158037573 * bAxis) ** 3;
  const m3 = (lightness - 0.1055613458 * a - 0.0638541728 * bAxis) ** 3;
  const s3 = (lightness - 0.0894841775 * a - 1.291485548 * bAxis) ** 3;

  const red = 4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3;
  const green = -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3;
  const blue = -0.0041960863 * l3 - 0.7034186147 * m3 + 1.707614701 * s3;

  return {
    r: linearToSrgb(red) * 255,
    g: linearToSrgb(green) * 255,
    b: linearToSrgb(blue) * 255,
  };
}

/**
 * The three `oklch()` components: lightness as a 0-1 number or a percentage, chroma as a
 * number or a percentage of 0.4 (the CSS reference range), hue as a number or `deg`.
 */
function parseOklchComponents(
  lightness: ParsedComponent,
  chroma: ParsedComponent,
  hue: ParsedComponent,
  alpha: number,
): AndesParsedColor | null {
  if (lightness.unit === 'deg' || chroma.unit === 'deg' || hue.unit === '%') {
    return null;
  }
  const l = lightness.unit === '%' ? lightness.value / 100 : lightness.value;
  const c = chroma.unit === '%' ? (chroma.value / 100) * 0.4 : chroma.value;
  const rgb = oklchToRgb(clamp(l, 0, 1), Math.max(c, 0), hue.value);
  return {
    r: Math.round(rgb.r),
    g: Math.round(rgb.g),
    b: Math.round(rgb.b),
    a: alpha,
    // The unrounded reading, so the colour keeps the precision the text had.
    hsb: rgbToHsb(rgb.r, rgb.g, rgb.b),
  };
}

// ----- Contrast ---------------------------------------------------------------------------

/**
 * WCAG 2 relative luminance of an opaque sRGB colour (channels 0-255): 0 for black, 1 for
 * white.
 */
export function relativeLuminance(r: number, g: number, b: number): number {
  return (
    0.2126 * srgbToLinear(r / 255) +
    0.7152 * srgbToLinear(g / 255) +
    0.0722 * srgbToLinear(b / 255)
  );
}

/** WCAG 2 contrast ratio of two relative luminances: 1 (none) to 21 (black on white). */
export function contrastRatio(first: number, second: number): number {
  const lighter = Math.max(first, second);
  const darker = Math.min(first, second);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Paints `top` over `bottom` with ordinary alpha compositing (source-over). Over an opaque
 * `bottom` the result is opaque.
 */
export function compositeOver(top: AndesRgba, bottom: AndesRgba): AndesRgba {
  const alpha = top.a + bottom.a * (1 - top.a);
  if (alpha === 0) {
    return { r: 0, g: 0, b: 0, a: 0 };
  }
  const channel = (front: number, back: number) =>
    (front * top.a + back * bottom.a * (1 - top.a)) / alpha;
  return {
    r: channel(top.r, bottom.r),
    g: channel(top.g, bottom.g),
    b: channel(top.b, bottom.b),
    a: alpha,
  };
}
