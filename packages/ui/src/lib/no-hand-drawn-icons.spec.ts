import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

/**
 * The library draws no icons of its own: every glyph is a lucide icon rendered through
 * `<ng-icon>`. This guard reads the sources (templates and TypeScript, not the specs or
 * stories) of every component folder and fails when one draws an SVG, so a hand-drawn icon
 * cannot creep back. Plain string search, no patterns.
 */
const LIB = 'packages/ui/src/lib';

/** Drawn graphics that are pictures, not icons: lucide has no equivalent for them. */
const ILLUSTRATIONS: readonly string[] = [
  // The two Empty illustrations (the default box scene and the simple tray).
  'empty/empty.html',
  // The 403 / 404 / 500 scenes of Result: full-page illustrations with no lucide equivalent.
  'result/result.html',
];

/** What drawing an SVG by hand looks like, in a template or through `Renderer2`. */
const MARKERS: readonly string[] = ['<svg', 'http://www.w3.org/2000/svg'];

function sources(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) {
      return sources(path);
    }
    const isSource = entry.endsWith('.ts') || entry.endsWith('.html');
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
      return MARKERS.some((marker) => source.includes(marker));
    });

    expect(offenders).toEqual([]);
  });

  it('keeps the allow-list honest: every illustration still draws an svg', () => {
    for (const file of ILLUSTRATIONS) {
      expect(readFileSync(join(LIB, file), 'utf8')).toContain('<svg');
    }
  });
});
