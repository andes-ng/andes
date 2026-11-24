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

const XHTML = 'http://www.w3.org/1999/xhtml';

/** CSS properties that need the viewport or the pan and zoom to mean anything on a still image. */
const SNAPSHOT_HOST_STYLE =
  'display:block;position:relative;overflow:visible;border:0;margin:0;transform:none;';

/**
 * The chart as it looks on screen, as a standalone SVG document that holds the rendered cards
 * (an HTML `foreignObject`), so every card, template, avatar, checkbox and color comes out the
 * way it is drawn, whatever the consumer put in it. The whole canvas is taken at its own size,
 * not just the part in view.
 *
 * The browser does not load anything from a still image, so what the cards need travels with
 * it: the stylesheets of the page, the custom properties (theme colors) of the chart, the web
 * fonts the chart uses and the images, the last two as data URLs.
 */
export async function snapshotSvg(
  host: HTMLElement,
  canvas: HTMLElement,
  width: number,
  height: number,
  background?: string,
): Promise<string> {
  const clone = canvas.cloneNode(true) as HTMLElement;
  clone.style.transform = 'none';
  clone.style.width = `${width}px`;
  clone.style.height = `${height}px`;
  clone.style.transition = 'none';

  await inlineImages(clone);

  const css = await collectCss(host);
  const hostStyle = getComputedStyle(host);
  const properties = customProperties(css, hostStyle);
  const fill = background ?? hostStyle.backgroundColor;

  // The chart element keeps its classes and attributes, so the rules written for it still match.
  const root = document.createElementNS(XHTML, 'div');
  for (const attribute of Array.from(host.attributes)) {
    if (attribute.name !== 'style' && attribute.name !== 'id') {
      root.setAttribute(attribute.name, attribute.value);
    }
  }
  root.setAttribute(
    'style',
    `${SNAPSHOT_HOST_STYLE}width:${width}px;height:${height}px;background:${fill};${properties}` +
      `font-family:${hostStyle.fontFamily};color:${hostStyle.color};`,
  );
  const style = document.createElementNS(XHTML, 'style');
  style.textContent = css;
  root.append(style, clone);

  // The theme classes of the ancestors (a dark class on the page) select colors for the chart.
  let wrapped: Element = root;
  for (let parent = host.parentElement; parent; parent = parent.parentElement) {
    const wrapper = document.createElementNS(XHTML, 'div');
    for (const attribute of Array.from(parent.attributes)) {
      if (attribute.name === 'class' || attribute.name.startsWith('data-')) {
        wrapper.setAttribute(attribute.name, attribute.value);
      }
    }
    wrapper.setAttribute('style', 'display:contents');
    wrapper.append(wrapped);
    wrapped = wrapper;
  }

  const markup = new XMLSerializer().serializeToString(wrapped);
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">` +
    `<foreignObject x="0" y="0" width="${width}" height="${height}">${markup}</foreignObject></svg>`
  );
}

/** Replaces every `<img>` source with a data URL; one that cannot be read is left blank. */
async function inlineImages(root: HTMLElement): Promise<void> {
  const cache = new Map<string, Promise<string | null>>();
  await Promise.all(
    Array.from(root.querySelectorAll('img')).map(async (image) => {
      const source = image.currentSrc || image.src;
      if (!source || source.startsWith('data:')) {
        return;
      }
      let data = cache.get(source);
      if (!data) {
        data = toDataUrl(source);
        cache.set(source, data);
      }
      const url = await data;
      if (url) {
        image.setAttribute('src', url);
        image.removeAttribute('srcset');
      } else {
        image.removeAttribute('src');
        image.removeAttribute('srcset');
      }
    }),
  );
}

async function toDataUrl(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, { mode: 'cors' });
    if (!response.ok) {
      return null;
    }
    const blob = await response.blob();
    return await new Promise<string | null>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

/** The rules of every stylesheet of the page that can be read, with the fonts of the chart inlined. */
async function collectCss(host: HTMLElement): Promise<string> {
  const families = new Set(
    getComputedStyle(host)
      .fontFamily.split(',')
      .map((family) => family.trim().replace(/^["']|["']$/g, '')),
  );
  const rules: string[] = [];
  const fonts: Promise<string>[] = [];
  for (const sheet of Array.from(document.styleSheets)) {
    let list: CSSRuleList;
    try {
      list = sheet.cssRules;
    } catch {
      continue;
    }
    for (const rule of Array.from(list)) {
      if (rule instanceof CSSFontFaceRule) {
        const family = rule.style
          .getPropertyValue('font-family')
          .trim()
          .replace(/^["']|["']$/g, '');
        if (families.has(family)) {
          fonts.push(inlineFont(rule, sheet.href));
        }
      } else {
        rules.push(rule.cssText);
      }
    }
  }
  return [...(await Promise.all(fonts)), ...rules].join('\n');
}

async function inlineFont(
  rule: CSSFontFaceRule,
  base: string | null,
): Promise<string> {
  let text = rule.cssText;
  const urls = Array.from(text.matchAll(/url\(["']?([^"')]+)["']?\)/g));
  for (const match of urls) {
    const url = match[1];
    if (url.startsWith('data:')) {
      continue;
    }
    const data = await toDataUrl(new URL(url, base ?? document.baseURI).href);
    if (data) {
      text = text.replace(match[0], `url("${data}")`);
    }
  }
  return text;
}

/** `--name: value;` for every custom property the stylesheets mention, as the chart resolves it. */
function customProperties(css: string, style: CSSStyleDeclaration): string {
  const names = new Set(css.match(/--[\w-]+/g) ?? []);
  let out = '';
  for (const name of names) {
    const value = style.getPropertyValue(name).trim();
    if (value) {
      out += `${name}:${value};`;
    }
  }
  return out;
}
