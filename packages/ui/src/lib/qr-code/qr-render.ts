/**
 * Pure rendering helpers for a `QrMatrix`: the SVG path and layout shared by the component's
 * template, a standalone SVG serialiser, and a canvas painter. Nothing here touches the DOM
 * except `drawQrToCanvas`, which only calls the 2D context it is given.
 */
import {
  encodeQr,
  encodeQrSegments,
  QrEncodeOptions,
  QrErrorLevel,
  QrMatrix,
  QrSegment,
  raiseQrErrorLevel,
} from './qr-encoder';

/** How each data module is drawn. */
export type QrModuleShape = 'square' | 'rounded' | 'dots';

/** How the three corner (finder) patterns are drawn. */
export type QrFinderShape = 'square' | 'rounded' | 'circle';

/** A rectangle in module units (one unit = one QR module), origin top-left of the symbol. */
export interface QrRect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/** A logo drawn over the centre of the symbol. */
export interface QrIconSpec {
  readonly src: string;
  /** Drawn size in CSS pixels. */
  readonly width: number;
  readonly height: number;
  /**
   * `true` leaves a clear margin of one module around the logo (a knockout halo); `false`
   * clears only the modules the logo itself sits on.
   */
  readonly bordered: boolean;
  /**
   * `true` (default) clears the modules the logo sits on; `false` draws the logo over them,
   * which asks more of the error correction and is best kept for small logos.
   */
  readonly excavate?: boolean;
}

export interface QrLayoutOptions {
  /** Side of the whole graphic, quiet zone included, in CSS pixels. */
  readonly size: number;
  /** Empty modules around the symbol. */
  readonly quietZone: number;
  readonly icon?: QrIconSpec | null;
  /** Shape of the data modules. Default `square`. */
  readonly shape?: QrModuleShape;
  /** Shape of the corner patterns. Default `square`. */
  readonly finderShape?: QrFinderShape;
  /** Draw the corner patterns as their own path, so they can take their own colour. */
  readonly separateFinders?: boolean;
}

export interface QrLayout {
  /** Modules per side of the whole graphic: symbol plus both quiet zones. */
  readonly modules: number;
  /** CSS pixels per module. */
  readonly moduleSize: number;
  /**
   * SVG path data (module units, quiet zone offset applied) of every dark module - without the
   * corner patterns when those are drawn separately (see `finderPath`).
   */
  readonly path: string;
  /**
   * Path data of the three corner patterns (draw it with `fill-rule: evenodd`), or an empty
   * string when they are part of `path`.
   */
  readonly finderPath: string;
  readonly shape: QrModuleShape;
  readonly finderShape: QrFinderShape;
  /** The module-aligned area the logo takes, or `null` without one. */
  readonly knockout: QrRect | null;
  /** The part of `knockout` whose modules are left out of the drawing (`null` if none). */
  readonly cleared: QrRect | null;
  /** Where the logo is drawn, in module units, or `null` without one. */
  readonly icon: QrRect | null;
  /** Fraction (0-1) of the symbol's area cleared for the logo. */
  readonly coverage: number;
}

export interface QrColors {
  readonly color: string;
  readonly bgColor: string;
  /** Colour of the corner patterns; default `color`. */
  readonly finderColor?: string;
  /** Colour behind the symbol, quiet zone included; default `bgColor`. */
  readonly quietZoneColor?: string;
}

/** Logo-area cap: past this the symbol cannot be recovered even at level H. */
export const QR_MAX_ICON_COVERAGE = 0.15;

/**
 * Centres a module-aligned knockout over the symbol. The count of cleared modules per axis
 * gets the same parity as the symbol so the cleared block is exactly centred on the grid.
 */
function knockoutFor(
  symbolSize: number,
  quietZone: number,
  icon: QrIconSpec,
  moduleSize: number,
): { knockout: QrRect; drawn: QrRect } {
  const halo = icon.bordered ? 1 : 0;
  const span = (pixels: number) => {
    let count = Math.ceil(pixels / moduleSize + halo * 2 - 1e-9);
    if ((count - symbolSize) % 2 !== 0) {
      count++;
    }
    return Math.max(1, Math.min(count, symbolSize));
  };
  const columns = span(icon.width);
  const rows = span(icon.height);
  const centre = quietZone + symbolSize / 2;
  const iconWidth = icon.width / moduleSize;
  const iconHeight = icon.height / moduleSize;
  return {
    knockout: {
      x: quietZone + (symbolSize - columns) / 2,
      y: quietZone + (symbolSize - rows) / 2,
      width: columns,
      height: rows,
    },
    drawn: {
      x: centre - iconWidth / 2,
      y: centre - iconHeight / 2,
      width: iconWidth,
      height: iconHeight,
    },
  };
}

function inside(rect: QrRect | null, x: number, y: number): boolean {
  return (
    rect !== null &&
    x >= rect.x &&
    x < rect.x + rect.width &&
    y >= rect.y &&
    y < rect.y + rect.height
  );
}

/** The 7 x 7 corner patterns, as module rectangles in symbol coordinates (no quiet zone). */
function finderOrigins(size: number): [number, number][] {
  return [
    [0, 0],
    [size - 7, 0],
    [0, size - 7],
  ];
}

function inFinder(size: number, x: number, y: number): boolean {
  return finderOrigins(size).some(
    ([fx, fy]) => x >= fx && x < fx + 7 && y >= fy && y < fy + 7,
  );
}

/** Dark runs per row as `[x, y, length]`, skipping `cleared` and, if asked, the corners. */
function darkRuns(
  matrix: QrMatrix,
  quietZone: number,
  cleared: QrRect | null,
  skipFinders: boolean,
): [number, number, number][] {
  const runs: [number, number, number][] = [];
  for (let y = 0; y < matrix.size; y++) {
    let start = -1;
    for (let x = 0; x <= matrix.size; x++) {
      const dark =
        x < matrix.size &&
        matrix.modules[y][x] &&
        !inside(cleared, x + quietZone, y + quietZone) &&
        !(skipFinders && inFinder(matrix.size, x, y));
      if (dark && start < 0) {
        start = x;
      } else if (!dark && start >= 0) {
        runs.push([start + quietZone, y + quietZone, x - start]);
        start = -1;
      }
    }
  }
  return runs;
}

/** Numbers in path data: at most three decimals, no trailing zeros. */
function num(value: number): string {
  return String(Math.round(value * 1000) / 1000);
}

/** A rounded rectangle as path data (`r` of 0 gives a plain rectangle). */
function roundedRectPath(
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): string {
  if (radius <= 0) {
    return `M${num(x)} ${num(y)}h${num(width)}v${num(height)}h-${num(width)}z`;
  }
  const r = num(radius);
  const w = num(width - radius * 2);
  const h = num(height - radius * 2);
  return (
    `M${num(x + radius)} ${num(y)}h${w}a${r} ${r} 0 0 1 ${r} ${r}` +
    `v${h}a${r} ${r} 0 0 1-${r} ${r}h-${w}a${r} ${r} 0 0 1-${r}-${r}` +
    `v-${h}a${r} ${r} 0 0 1 ${r}-${r}z`
  );
}

function circlePath(cx: number, cy: number, radius: number): string {
  const r = num(radius);
  return `M${num(cx - radius)} ${num(cy)}a${r} ${r} 0 1 0 ${num(radius * 2)} 0a${r} ${r} 0 1 0-${num(radius * 2)} 0z`;
}

/** Corner radius of a `rounded` module, and radius of a `dots` module, in modules. */
const ROUNDED_MODULE_RADIUS = 0.3;
const DOT_RADIUS = 0.45;

function modulePath(shape: QrModuleShape, x: number, y: number): string {
  return shape === 'dots'
    ? circlePath(x + 0.5, y + 0.5, DOT_RADIUS)
    : roundedRectPath(x, y, 1, 1, ROUNDED_MODULE_RADIUS);
}

/** The outer ring and the eye of one corner pattern, `evenodd`-ready. */
function finderPattern(shape: QrFinderShape, x: number, y: number): string {
  switch (shape) {
    case 'circle':
      return (
        circlePath(x + 3.5, y + 3.5, 3.5) +
        circlePath(x + 3.5, y + 3.5, 2.5) +
        circlePath(x + 3.5, y + 3.5, 1.5)
      );
    case 'rounded':
      return (
        roundedRectPath(x, y, 7, 7, 2) +
        roundedRectPath(x + 1, y + 1, 5, 5, 1) +
        roundedRectPath(x + 2, y + 2, 3, 3, 0.9)
      );
    default:
      return (
        roundedRectPath(x, y, 7, 7, 0) +
        roundedRectPath(x + 1, y + 1, 5, 5, 0) +
        roundedRectPath(x + 2, y + 2, 3, 3, 0)
      );
  }
}

/** `true` when the corner patterns have to be drawn apart from the data modules. */
function drawsFindersApart(options: QrLayoutOptions): boolean {
  return (
    options.separateFinders === true ||
    (options.finderShape ?? 'square') !== 'square' ||
    (options.shape ?? 'square') !== 'square'
  );
}

/** Everything needed to paint `matrix` at `options.size`. */
export function buildQrLayout(
  matrix: QrMatrix,
  options: QrLayoutOptions,
): QrLayout {
  const quietZone = Math.max(0, Math.floor(options.quietZone));
  const modules = matrix.size + quietZone * 2;
  const moduleSize = options.size / modules;
  let knockout: QrRect | null = null;
  let icon: QrRect | null = null;
  if (options.icon) {
    const placed = knockoutFor(
      matrix.size,
      quietZone,
      options.icon,
      moduleSize,
    );
    knockout = placed.knockout;
    icon = placed.drawn;
  }
  const cleared = options.icon?.excavate === false ? null : knockout;
  const shape = options.shape ?? 'square';
  const finderShape = options.finderShape ?? 'square';
  const apart = drawsFindersApart(options);
  let path: string;
  if (shape === 'square') {
    path = darkRuns(matrix, quietZone, cleared, apart)
      .map(([x, y, length]) => `M${x} ${y}h${length}v1h-${length}z`)
      .join('');
  } else {
    const parts: string[] = [];
    for (let y = 0; y < matrix.size; y++) {
      for (let x = 0; x < matrix.size; x++) {
        if (
          matrix.modules[y][x] &&
          !inside(cleared, x + quietZone, y + quietZone) &&
          !inFinder(matrix.size, x, y)
        ) {
          parts.push(modulePath(shape, x + quietZone, y + quietZone));
        }
      }
    }
    path = parts.join('');
  }
  const finderPath = apart
    ? finderOrigins(matrix.size)
        .map(([x, y]) =>
          finderPattern(finderShape, x + quietZone, y + quietZone),
        )
        .join('')
    : '';
  const coverage = knockout
    ? (knockout.width * knockout.height) / (matrix.size * matrix.size)
    : 0;
  return {
    modules,
    moduleSize,
    path,
    finderPath,
    shape,
    finderShape,
    knockout,
    cleared,
    icon,
    coverage,
  };
}

export interface QrIconEncodeOptions extends QrEncodeOptions {
  readonly size: number;
  readonly quietZone: number;
  readonly icon?: QrIconSpec | null;
  readonly shape?: QrModuleShape;
  readonly finderShape?: QrFinderShape;
  readonly separateFinders?: boolean;
}

/**
 * Encodes `text`, raising the error correction level as far as the logo needs (see
 * `raiseQrErrorLevel`). The level and the symbol size depend on each other - a higher level
 * can grow the symbol, which shrinks the logo's share - so this settles by re-encoding until
 * the level stops rising (at most the three steps from L to H).
 */
export function encodeQrForLayout(
  text: string | readonly QrSegment[],
  options: QrIconEncodeOptions,
): { matrix: QrMatrix; layout: QrLayout } {
  let level: QrErrorLevel = options.errorLevel ?? 'M';
  const layoutOptions: QrLayoutOptions = {
    size: options.size,
    quietZone: options.quietZone,
    icon: options.icon,
    shape: options.shape,
    finderShape: options.finderShape,
    separateFinders: options.separateFinders,
  };
  // Levels only ever rise, so this runs at most once per level.
  for (;;) {
    const encodeOptions = { ...options, errorLevel: level };
    const matrix =
      typeof text === 'string'
        ? encodeQr(text, encodeOptions)
        : encodeQrSegments(text, encodeOptions);
    const layout = buildQrLayout(matrix, layoutOptions);
    const needed = raiseQrErrorLevel(matrix.errorLevel, layout.coverage);
    if (needed === matrix.errorLevel) {
      return { matrix, layout };
    }
    level = needed;
  }
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** A self-contained SVG document: concrete colours only, no CSS or custom properties. */
export function qrSvgMarkup(
  layout: QrLayout,
  options: QrLayoutOptions & QrColors & { readonly title?: string },
): string {
  const side = layout.modules;
  const parts = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${side} ${side}" width="${options.size}" height="${options.size}"${
      layout.shape === 'square' && !layout.finderPath
        ? ' shape-rendering="crispEdges"'
        : ''
    } role="img"${
      options.title ? ` aria-label="${escapeXml(options.title)}"` : ''
    }>`,
  ];
  if (options.title) {
    parts.push(`<title>${escapeXml(options.title)}</title>`);
  }
  parts.push(
    `<rect width="${side}" height="${side}" fill="${escapeXml(options.quietZoneColor ?? options.bgColor)}"/>`,
    `<path d="${layout.path}" fill="${escapeXml(options.color)}"/>`,
  );
  if (layout.finderPath) {
    parts.push(
      `<path d="${layout.finderPath}" fill="${escapeXml(options.finderColor ?? options.color)}" fill-rule="evenodd"/>`,
    );
  }
  if (layout.icon && options.icon?.src) {
    const { x, y, width, height } = layout.icon;
    parts.push(
      `<image href="${escapeXml(options.icon.src)}" x="${x}" y="${y}" width="${width}" height="${height}" preserveAspectRatio="xMidYMid meet"/>`,
    );
  }
  parts.push('</svg>');
  return parts.join('');
}

/** The subset of the 2D context the painter uses; lets tests pass a recording stub. */
export type QrCanvasContext = Pick<
  CanvasRenderingContext2D,
  'fillStyle' | 'fillRect' | 'drawImage' | 'fill' | 'save' | 'restore' | 'scale'
>;

/**
 * Paints the symbol onto a canvas context whose backing store is `pixels` wide and tall.
 * Square modules have their edges snapped to whole pixels so neighbours never leave hairline
 * gaps; rounded modules, dots and styled corner patterns are filled from the layout's path
 * data (`Path2D`; where that is missing the code is drawn square).
 *
 * @param image A loaded logo, drawn contained inside `layout.icon`.
 */
export function drawQrToCanvas(
  context: QrCanvasContext,
  matrix: QrMatrix,
  layout: QrLayout,
  options: QrColors & {
    readonly pixels: number;
    readonly quietZone: number;
    readonly image?: CanvasImageSource | null;
    readonly imageSize?: { width: number; height: number } | null;
  },
): void {
  const scale = options.pixels / layout.modules;
  const snap = (value: number) => Math.round(value * scale);
  const canPath = typeof Path2D === 'function';
  const shaped =
    canPath && (layout.shape !== 'square' || layout.finderPath !== '');
  context.fillStyle = options.quietZoneColor ?? options.bgColor;
  context.fillRect(0, 0, options.pixels, options.pixels);
  context.fillStyle = options.color;
  if (shaped && layout.shape !== 'square') {
    fillPath(context, layout.path, scale, false);
  } else {
    for (let y = 0; y < matrix.size; y++) {
      let start = -1;
      for (let x = 0; x <= matrix.size; x++) {
        const dark =
          x < matrix.size &&
          matrix.modules[y][x] &&
          !inside(
            layout.cleared,
            x + options.quietZone,
            y + options.quietZone,
          ) &&
          !(shaped && inFinder(matrix.size, x, y));
        if (dark && start < 0) {
          start = x;
        } else if (!dark && start >= 0) {
          const left = snap(start + options.quietZone);
          const top = snap(y + options.quietZone);
          context.fillRect(
            left,
            top,
            snap(x + options.quietZone) - left,
            snap(y + options.quietZone + 1) - top,
          );
          start = -1;
        }
      }
    }
  }
  if (shaped && layout.finderPath) {
    context.fillStyle = options.finderColor ?? options.color;
    fillPath(context, layout.finderPath, scale, true);
  }
  if (options.image && layout.icon) {
    const target = layout.icon;
    const natural = options.imageSize;
    let { x, y, width, height } = target;
    if (natural && natural.width > 0 && natural.height > 0) {
      const ratio = Math.min(width / natural.width, height / natural.height);
      const fitted = {
        width: natural.width * ratio,
        height: natural.height * ratio,
      };
      x += (width - fitted.width) / 2;
      y += (height - fitted.height) / 2;
      width = fitted.width;
      height = fitted.height;
    }
    context.drawImage(
      options.image,
      x * scale,
      y * scale,
      width * scale,
      height * scale,
    );
  }
}

function fillPath(
  context: QrCanvasContext,
  data: string,
  scale: number,
  evenOdd: boolean,
): void {
  context.save();
  context.scale(scale, scale);
  context.fill(new Path2D(data), evenOdd ? 'evenodd' : 'nonzero');
  context.restore();
}
