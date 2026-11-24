import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  exportBlob,
  exportExtension,
  fittingScale,
  saveBlob,
  snapshotSvg,
} from './org-chart-export';

const SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200" viewBox="0 0 400 200"><g/></svg>';

/*
  jsdom draws no canvas and loads no image, so the browser parts are replaced by recorders:
  what is asserted is what the export asks of them (size, fill, format, quality).
*/
function stubBrowser() {
  const calls = {
    fill: [] as string[],
    fillRect: [] as number[][],
    drawn: [] as number[][],
    encoded: [] as { type: string | undefined; quality: number | undefined }[],
    size: [0, 0],
  };
  const context = {
    set fillStyle(value: string) {
      calls.fill.push(value);
    },
    fillRect: (...args: number[]) => calls.fillRect.push(args),
    drawImage: (_image: unknown, ...args: number[]) => calls.drawn.push(args),
  };
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(
    function (this: HTMLCanvasElement) {
      calls.size = [this.width, this.height];
      return context as unknown as CanvasRenderingContext2D;
    } as never,
  );
  vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(((
    callback: BlobCallback,
    type?: string,
    quality?: number,
  ) => {
    calls.encoded.push({ type, quality });
    callback(new Blob(['x'], { type }));
  }) as never);
  vi.stubGlobal(
    'Image',
    class {
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      set src(_value: string) {
        queueMicrotask(() => this.onload?.());
      }
    },
  );
  return calls;
}

describe('org chart export', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('names the file extension of each format', () => {
    expect(exportExtension('svg')).toBe('svg');
    expect(exportExtension('png')).toBe('png');
    expect(exportExtension('jpeg')).toBe('jpg');
    expect(exportExtension('webp')).toBe('webp');
  });

  it('returns the svg document as it is', async () => {
    const blob = await exportBlob(SVG, 400, 200, 'svg', {});
    expect(blob.type).toBe('image/svg+xml');
    expect(await blob.text()).toBe(SVG);
  });

  it('draws a png at twice the size of the chart, transparent', async () => {
    const calls = stubBrowser();
    const blob = await exportBlob(SVG, 400, 200, 'png', {});
    expect(blob.type).toBe('image/png');
    expect(calls.size).toEqual([800, 400]);
    expect(calls.drawn).toEqual([[0, 0, 800, 400]]);
    expect(calls.fillRect).toEqual([]);
  });

  it('honours the scale and fills behind the chart when a background is given', async () => {
    const calls = stubBrowser();
    await exportBlob(SVG, 400, 200, 'png', { scale: 1, background: '#101010' });
    expect(calls.size).toEqual([400, 200]);
    expect(calls.fill).toEqual(['#101010']);
    expect(calls.fillRect).toEqual([[0, 0, 400, 200]]);
  });

  it('gives a jpeg an opaque background and passes its quality on', async () => {
    const calls = stubBrowser();
    const blob = await exportBlob(SVG, 400, 200, 'jpeg', { quality: 0.8 });
    expect(blob.type).toBe('image/jpeg');
    expect(calls.fill).toEqual(['#ffffff']);
    expect(calls.encoded).toEqual([{ type: 'image/jpeg', quality: 0.8 }]);
  });

  it('lowers the scale of a chart too large for a canvas', () => {
    expect(fittingScale(400, 200, 2)).toBe(2);
    const huge = fittingScale(20000, 10000, 2);
    expect(huge).toBeLessThan(1);
    expect(20000 * huge).toBeLessThanOrEqual(16384);
  });

  it('rejects when the browser cannot encode the format', async () => {
    stubBrowser();
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(((
      callback: BlobCallback,
    ) => callback(null)) as never);
    await expect(exportBlob(SVG, 400, 200, 'webp', {})).rejects.toThrow(
      'cannot encode webp',
    );
  });

  it('saves the blob through a download link and cleans up', () => {
    vi.useFakeTimers();
    const create = vi.fn(() => 'blob:chart');
    const revoke = vi.fn();
    vi.stubGlobal('URL', { createObjectURL: create, revokeObjectURL: revoke });
    const clicked: { href: string; download: string }[] = [];
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      clicked.push({ href: this.href, download: this.download });
    });
    saveBlob(new Blob(['x']), 'company.png');
    expect(clicked).toEqual([{ href: 'blob:chart', download: 'company.png' }]);
    expect(document.querySelector('a[download]')).toBeNull();
    vi.runAllTimers();
    expect(revoke).toHaveBeenCalledWith('blob:chart');
    vi.useRealTimers();
  });

  describe('snapshotSvg', () => {
    function chartDom() {
      const style = document.createElement('style');
      style.textContent = '.card { color: var(--chart-ink); }';
      document.head.append(style);
      const host = document.createElement('div');
      host.className = 'andes-org-chart';
      host.setAttribute('data-orientation', 'vertical');
      host.style.setProperty('--chart-ink', '#123456');
      const canvas = document.createElement('div');
      canvas.style.transform = 'translate(40px, 10px) scale(0.5)';
      canvas.innerHTML = '<div class="card">Ana Torres <img alt=""></div>';
      host.append(canvas);
      document.body.append(host);
      return { host, canvas, style };
    }

    it('carries the rendered cards, the page styles and the theme properties', async () => {
      const { host, canvas, style } = chartDom();
      const svg = await snapshotSvg(host, canvas, 640, 360, '#fafafa');
      host.remove();
      style.remove();

      expect(svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg"')).toBe(
        true,
      );
      expect(svg).toContain('<foreignObject');
      expect(svg).toContain('Ana Torres');
      // The rules the cards are drawn by, and the value of the custom property they read.
      expect(svg).toContain('.card');
      expect(svg).toContain('--chart-ink:#123456');
      expect(svg).toContain('background:#fafafa');
      expect(svg).toContain('data-orientation="vertical"');
    });

    it('takes the whole canvas at its own size, not the panned and zoomed view', async () => {
      const { host, canvas, style } = chartDom();
      const svg = await snapshotSvg(host, canvas, 640, 360);
      host.remove();
      style.remove();

      expect(svg).toContain('viewBox="0 0 640 360"');
      expect(svg).toContain('transform: none');
      expect(svg).not.toContain('scale(0.5)');
      expect(svg).toContain('width: 640px');
    });
  });
});
