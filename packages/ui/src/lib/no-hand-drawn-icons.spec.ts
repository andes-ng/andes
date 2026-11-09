import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

/**
 * The library draws no icons of its own: every glyph is a lucide icon rendered through
 * `<ng-icon>`. This guard reads the sources (templates, TypeScript and stylesheets, not the
 * specs or stories) of every component folder and fails when one draws an SVG - inline, through
 * `Renderer2`, or as a `data:image/svg` mask in CSS - so a hand-drawn icon cannot creep back.
 * Plain string search, no patterns.
 */
const LIB = 'packages/ui/src/lib';

/** Drawn graphics that are pictures, not icons: lucide has no equivalent for them. */
const ILLUSTRATIONS: readonly string[] = [
  // The two Empty illustrations (the default box scene and the simple tray).
  'empty/empty.html',
  // The progress ring around the current step's marker: a gauge drawn from a circle's arc.
  'steps/step.html',
  // The QR symbol itself: its modules are drawn as one svg path (a picture of the data).
  'qr-code/qr-code.html',
  // The QR code's svg export, serialised as text for the download.
  'qr-code/qr-render.ts',
];

/** What drawing an SVG by hand looks like: in a template, through `Renderer2`, or as a mask. */
const MARKERS: readonly string[] = [
  '<svg',
  'http://www.w3.org/2000/svg',
  'data:image/svg',
];

function sources(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) {
      return sources(path);
    }
    const isSource =
      entry.endsWith('.ts') ||
      entry.endsWith('.html') ||
      entry.endsWith('.css');
    const isTest = entry.endsWith('.spec.ts') || entry.endsWith('.stories.ts');
    return isSource && !isTest ? [path] : [];
  });
}

describe('no hand-drawn icons', () => {
  const files = sources(LIB).map((path) => path.slice(LIB.length + 1));

  it('finds the component sources', () => {
    expect(files).toContain('select/select-trigger.html');
    expect(files).toContain('breadcrumb/breadcrumb.ts');
    expect(files.length).toBeGreaterThan(100);
  });

  it('draws no svg outside the illustrations', () => {
    const offenders = files.filter((file) => {
      if (ILLUSTRATIONS.includes(file)) {
        return false;
      }
      const source = readFileSync(join(LIB, file), 'utf8');
      // A stylesheet may name `<svg>` in a comment: only the data uri counts there.
      const markers = file.endsWith('.css') ? MARKERS.slice(2) : MARKERS;
      return markers.some((marker) => source.includes(marker));
    });

    expect(offenders).toEqual([]);
  });

  it('keeps the allow-list honest: every illustration still draws an svg', () => {
    for (const file of ILLUSTRATIONS) {
      expect(readFileSync(join(LIB, file), 'utf8')).toContain('<svg');
    }
  });
});
