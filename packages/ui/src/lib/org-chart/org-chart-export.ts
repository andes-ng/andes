/** The file formats a chart can be exported to. */
export type AndesOrgChartExportFormat = 'svg' | 'png' | 'jpeg' | 'webp';

export interface AndesOrgChartExportOptions {
  /**
   * Pixel ratio of a raster image: 2 draws the chart twice as large as its canvas, which stays
   * sharp when printed. It is lowered on its own when the image would pass the browser's canvas
   * limits. Ignored for SVG.
   */
  scale?: number;
  /**
   * Fill behind the chart. JPEG has no transparency, so it always gets one (the chart's card
   * color by default); SVG, PNG and WebP stay transparent unless a color is given.
   */
  background?: string;
  /** Compression of a JPEG or WebP image, from 0 to 1. */
  quality?: number;
  /** The file name without extension, for `download()`. */
  filename?: string;
}

const MIME: Readonly<Record<AndesOrgChartExportFormat, string>> = {
  svg: 'image/svg+xml',
  png: 'image/png',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
};

const EXTENSION: Readonly<Record<AndesOrgChartExportFormat, string>> = {
  svg: 'svg',
  png: 'png',
  jpeg: 'jpg',
  webp: 'webp',
};

/** Browsers refuse a canvas wider or taller than this, or with more pixels than the area. */
const MAX_SIDE = 16384;
const MAX_AREA = 268_435_456;

export function exportExtension(format: AndesOrgChartExportFormat): string {
  return EXTENSION[format];
}

/** The scale an image of `width` x `height` can be drawn at without passing the canvas limits. */
export function fittingScale(
  width: number,
  height: number,
  wanted: number,
): number {
  const w = Math.max(width, 1);
  const h = Math.max(height, 1);
  return Math.max(
    Math.min(wanted, MAX_SIDE / w, MAX_SIDE / h, Math.sqrt(MAX_AREA / (w * h))),
    0.01,
  );
}

/**
 * Turns the standalone SVG of a chart into a file of the requested format. An SVG file is the
 * document as it is (`exportSvg` already carries the background); the others are drawn from it.
 */
export async function exportBlob(
  svg: string,
  width: number,
  height: number,
  format: AndesOrgChartExportFormat,
  options: AndesOrgChartExportOptions,
): Promise<Blob> {
  if (format === 'svg') {
    return new Blob([svg], { type: MIME.svg });
  }
  const scale = fittingScale(width, height, options.scale ?? 2);
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(Math.round(width * scale), 1);
  canvas.height = Math.max(Math.round(height * scale), 1);
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('The chart cannot be drawn: no 2d canvas is available.');
  }
  const fill = options.background ?? (format === 'jpeg' ? '#ffffff' : null);
  if (fill) {
    context.fillStyle = fill;
    context.fillRect(0, 0, canvas.width, canvas.height);
  }
  const image = await loadImage(svg);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob
          ? resolve(blob)
          : reject(new Error(`The browser cannot encode ${format} images.`)),
      MIME[format],
      options.quality,
    );
  });
}

/** Saves `blob` as `filename` through a temporary link. */
export function saveBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.append(link);
  link.click();
  link.remove();
  // The download has started by the next task; the url can go.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

function loadImage(svg: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () =>
      reject(new Error('The chart could not be read as an image.'));
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  });
}
