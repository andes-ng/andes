import { encapsulateStyle } from '@angular/compiler';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Stylesheet contract tests for the radio family. They read the real `.css` sources as text
 * (plain string searches, no dynamic patterns) because jsdom computes neither media queries
 * nor `@keyframes`, and run the source through Angular's runtime style scoping the way
 * Storybook does, where a selector Angular mis-scopes silently matches nothing.
 */

const SCOPE = 'andes-test-scope';

function read(file: string): string {
  const path = new URL(file, import.meta.url).pathname;
  // The builder reports the module URL relative to the workspace root in some setups and as an
  // absolute path in others.
  return readFileSync(
    existsSync(path) ? path : join(process.cwd(), path),
    'utf8',
  );
}

function radioCss(): string {
  return read('./radio.css');
}

function groupCss(): string {
  return read('./radio-group.css');
}

function runtimeScopedCss(): string {
  return encapsulateStyle(radioCss()).split('%COMP%').join(SCOPE);
}

/** The body of the first at-rule whose prelude is exactly `prelude`, found by brace counting. */
function atRuleBody(css: string, prelude: string): string {
  const start = css.indexOf(`${prelude} {`);
  if (start < 0) {
    return '';
  }
  const open = css.indexOf('{', start);
  let depth = 0;
  for (let index = open; index < css.length; index++) {
    if (css[index] === '{') {
      depth++;
    } else if (css[index] === '}') {
      depth--;
      if (depth === 0) {
        return css.slice(open + 1, index);
      }
    }
  }
  return '';
}

function indicesOf(haystack: string, needle: string): number[] {
  const found: number[] = [];
  let index = haystack.indexOf(needle);
  while (index >= 0) {
    found.push(index);
    index = haystack.indexOf(needle, index + needle.length);
  }
  return found;
}

function withoutComments(css: string): string {
  let out = '';
  let index = 0;
  while (index < css.length) {
    const start = css.indexOf('/*', index);
    if (start < 0) {
      out += css.slice(index);
      break;
    }
    out += css.slice(index, start);
    const end = css.indexOf('*/', start + 2);
    index = end < 0 ? css.length : end + 2;
  }
  return out;
}

const MOTION_QUERY =
  '@media (prefers-reduced-motion: no-preference) and (forced-colors: none)';

describe('radio stylesheet contract', () => {
  describe('dot animation', () => {
    it('only animates inside the motion-allowed, non-forced-colors query', () => {
      const css = radioCss();
      const motion = atRuleBody(css, MOTION_QUERY);

      expect(motion).not.toBe('');
      const everywhere = indicesOf(css, 'animation:').length;
      const inside = indicesOf(motion, 'animation:').length;
      expect(inside).toBeGreaterThan(0);
      expect(inside).toBe(everywhere);
    });

    it('keys the ripple off the one-shot data-motion hook', () => {
      const motion = withoutComments(atRuleBody(radioCss(), MOTION_QUERY));
      const selectors = motion
        .split('}')
        .map((block) => block.split('{')[0].trim())
        .filter((selector) => selector !== '');

      expect(selectors.length).toBeGreaterThan(0);
      for (const selector of selectors) {
        expect(selector).toContain("[data-motion='check']");
        expect(selector).toContain('.andes-radio__control');
      }
    });

    it('fades a soft ring out of the selected disc', () => {
      const css = radioCss();
      const motion = atRuleBody(css, MOTION_QUERY);
      const keyframes = atRuleBody(css, '@keyframes andes-radio-ripple');

      expect(keyframes).toContain('box-shadow: 0 0 0 0');
      expect(keyframes).toContain('box-shadow: 0 0 0 6px');
      expect(motion).toContain('andes-radio-ripple 0.4s');
    });

    it('grows the dot with a transition on transform and opacity, never on the first render', () => {
      const css = withoutComments(radioCss());
      const start = css.indexOf('.andes-radio__dot {');
      const dotRule = css.slice(start, css.indexOf('}', start));

      expect(dotRule).toContain('transform: scale(0)');
      expect(dotRule).toContain(
        'transform 0.3s cubic-bezier(0.78, 0.14, 0.15, 0.86)',
      );
      expect(dotRule).toContain(
        'opacity 0.3s cubic-bezier(0.78, 0.14, 0.15, 0.86)',
      );
      expect(dotRule).not.toContain('animation');
    });

    it('drops every transition under prefers-reduced-motion', () => {
      const reduced = atRuleBody(
        radioCss(),
        '@media (prefers-reduced-motion: reduce)',
      );

      expect(reduced).toContain('.andes-radio__control');
      expect(reduced).toContain('.andes-radio__dot');
      expect(reduced).toContain('.andes-radio__label');
      expect(reduced).toContain('.andes-radio__text');
      expect(reduced).toContain('transition: none');
    });
  });

  describe('forced colors', () => {
    it('maps the circle, dot, checked card and checked button onto system colors', () => {
      const forced = atRuleBody(radioCss(), '@media (forced-colors: active)');

      expect(forced).toContain('border-color: CanvasText;');
      expect(forced).toContain('background-color: Highlight;');
      expect(forced).toContain('color: HighlightText;');
      expect(forced).toContain('GrayText');
      expect(forced).toContain('.andes-radio--card.andes-radio--checked');
      expect(forced).toContain('.andes-radio--button.andes-radio--checked');
    });

    it('uses tokens, never literal colors, outside the forced-colors block', () => {
      const css = withoutComments(radioCss() + groupCss());
      const forced = atRuleBody(css, '@media (forced-colors: active)');
      const rest = css.split(forced).join('');

      expect(indicesOf(rest, '#')).toEqual([]);
      expect(indicesOf(rest, 'rgb(')).toEqual([]);
      expect(indicesOf(rest, 'hsl(')).toEqual([]);
    });
  });

  describe('card variant', () => {
    it('lights the checked card with the primary subtle tint and a primary border', () => {
      const css = radioCss();
      const start = css.indexOf(
        ':host(.andes-radio--card.andes-radio--checked) .andes-radio__label {',
      );
      const rule = css.slice(start, css.indexOf('}', start));

      expect(start).toBeGreaterThan(0);
      expect(rule).toContain('border-color: var(--andes-color-primary)');
      expect(rule).toContain(
        'background-color: var(--andes-color-primary-subtle)',
      );
    });

    it('declares the status borders after the checked one, so status wins', () => {
      const css = radioCss();
      const checked = css.indexOf(
        ':host(.andes-radio--card.andes-radio--checked) .andes-radio__label {',
      );
      const warning = css.indexOf(
        ':host(.andes-radio--card.andes-radio--warning) .andes-radio__label,',
      );
      const invalid = css.indexOf(
        ':host(.andes-radio--card.andes-radio--invalid) .andes-radio__label,',
      );

      expect(checked).toBeGreaterThan(0);
      expect(warning).toBeGreaterThan(checked);
      expect(invalid).toBeGreaterThan(warning);
    });

    it('puts the focus ring on the card through :has(), and off the circle', () => {
      const css = radioCss();

      expect(css).toContain(
        '.andes-radio__label:has(.andes-radio__input:focus-visible) {',
      );
      expect(css).toContain(
        ':host(.andes-radio--card) .andes-radio__input:focus-visible ~ .andes-radio__control {',
      );
    });

    it('gives no hover feedback to a disabled or read-only card or circle', () => {
      const css = radioCss();

      expect(css).toContain(
        ':host(.andes-radio--card:not(.andes-radio--disabled):not(.andes-radio--readonly)) .andes-radio__label:hover',
      );
      expect(css).toContain(
        ':host(:not(.andes-radio--disabled):not(.andes-radio--readonly)) .andes-radio__label:hover .andes-radio__control',
      );
    });
  });

  describe('focus ring', () => {
    it('keeps the segment ring on the button type only, never on a classic label', () => {
      const css = radioCss();

      expect(css).not.toContain(
        '\n.andes-radio__input:focus-visible ~ .andes-radio__text {',
      );
      expect(css).toContain(
        ':host(.andes-radio--button) .andes-radio__input:focus-visible ~ .andes-radio__text {',
      );
    });

    it('colors the segment and circle rings for the warning tier too', () => {
      const css = radioCss();

      expect(css).toContain(
        ':host(.andes-radio--warning) .andes-radio__input:focus-visible ~ .andes-radio__control {',
      );
      expect(css).toContain(
        ':host(.andes-radio--button.andes-radio--warning) .andes-radio__input:focus-visible ~ .andes-radio__text {',
      );
    });
  });

  describe('layout', () => {
    it('lays the group out as a grid of N equal columns from the bound property', () => {
      const css = groupCss();

      expect(css).toContain(':host(.andes-radio-group--columns) {');
      expect(css).toContain('display: grid;');
      expect(css).toContain('var(--andes-radio-group-columns, 1)');
      expect(css).toContain('minmax(0, 1fr)');
    });

    it('declares the grid after the flex layouts it overrides', () => {
      const css = groupCss();

      expect(
        css.indexOf(':host(.andes-radio-group--columns) {'),
      ).toBeGreaterThan(css.indexOf(':host(.andes-radio-group--block) {'));
    });

    it('uses logical properties only (right-to-left safe)', () => {
      const css = withoutComments(radioCss() + groupCss());

      for (const physical of [
        'margin-left',
        'margin-right',
        'padding-left',
        'padding-right',
        'border-left',
        'border-right',
        'left:',
        'right:',
        'text-align: left',
        'text-align: right',
      ]) {
        expect(indicesOf(css, physical)).toEqual([]);
      }
    });

    it('places the description under the label text, swapping columns for label-start', () => {
      const css = radioCss();

      expect(css).toContain('grid-template-columns: auto minmax(0, 1fr);');
      expect(css).toContain('grid-template-columns: minmax(0, 1fr) auto;');
      expect(css).toContain('var(--andes-color-muted-foreground)');
    });
  });

  describe('runtime scoping', () => {
    it('never emits a scoping attribute as a compound of its own', () => {
      const attr = `[_ngcontent-${SCOPE}]`;
      const stepBoundaries = ' \t>~+(,';

      const offenders = runtimeScopedCss()
        .split('\n')
        .filter((line) =>
          indicesOf(line, attr).some(
            (index) => index === 0 || stepBoundaries.includes(line[index - 1]),
          ),
        );

      expect(offenders).toEqual([]);
    });

    it('scopes the card focus ring and description rules to the component', () => {
      const css = runtimeScopedCss();
      const attr = `[_ngcontent-${SCOPE}]`;

      expect(css).toContain(
        `.andes-radio__label${attr}:has(.andes-radio__input:focus-visible)`,
      );
      expect(css).toContain(
        `.andes-radio__label${attr}:has(> .andes-radio__description:not(:empty))`,
      );
    });
  });
});
