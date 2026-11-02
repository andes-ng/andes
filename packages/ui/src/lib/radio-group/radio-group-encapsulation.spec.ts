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
        expect(selector).toContain('[data-motion=');
      }
      expect(motion).toContain("[data-motion='check']");
      expect(motion).toContain("[data-motion='press']");
      expect(motion).toContain("[data-motion='press-alt']");
    });

    it('fades a soft ring out of the selected disc and lets it linger', () => {
      const css = radioCss();
      const motion = atRuleBody(css, MOTION_QUERY);
      const keyframes = atRuleBody(css, '@keyframes andes-radio-ripple');

      expect(keyframes).toContain('box-shadow: 0 0 0 0');
      expect(keyframes).toContain('var(--_andes-radio-ring)');
      expect(keyframes).toContain('var(--_andes-radio-tone) 20%');
      expect(keyframes).toContain('var(--_andes-radio-tone) 0%');
      expect(motion).toContain('andes-radio-ripple 1s linear');
    });

    it('plays the same ring under a second name so a repeated click restarts it', () => {
      const css = radioCss();
      const first = atRuleBody(css, '@keyframes andes-radio-ripple');
      const second = atRuleBody(css, '@keyframes andes-radio-ripple-alt');
      const motion = atRuleBody(css, MOTION_QUERY);

      expect(second).toBe(first);
      expect(motion).toContain('animation: andes-radio-ripple-alt 1s linear;');
    });

    it('rings the circle, the segment face of a button and an item without a circle', () => {
      const motion = atRuleBody(radioCss(), MOTION_QUERY);

      expect(motion).toContain(
        ".andes-radio__label[data-motion='check'] .andes-radio__control",
      );
      expect(motion).toContain(
        ":host(.andes-radio--button) .andes-radio__label[data-motion='press'] .andes-radio__text",
      );
      expect(motion).toContain(
        ":host(.andes-radio--no-indicator) .andes-radio__label[data-motion='check']",
      );
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

  describe('button option type motion', () => {
    function segmentRule(): string {
      const css = withoutComments(radioCss());
      const start = css.indexOf(
        ':host(.andes-radio--button) .andes-radio__text {',
      );
      return css.slice(start, css.indexOf('\n}', start));
    }

    it('fades fill, border, text and focus hairline over the 0.2s slow duration', () => {
      const rule = segmentRule();

      expect(rule).toContain('transition:');
      for (const property of [
        'background-color',
        'border-color',
        'color',
        'box-shadow',
      ]) {
        expect(rule).toContain(
          `${property} var(--andes-motion-duration-slow, 0.2s)`,
        );
      }
    });

    it('drops the segment transitions under prefers-reduced-motion', () => {
      const reduced = atRuleBody(
        radioCss(),
        '@media (prefers-reduced-motion: reduce)',
      );

      expect(reduced).toContain(
        ':host(.andes-radio--button) .andes-radio__text',
      );
      expect(reduced).toContain('transition: none');
    });

    it('keeps the checked segment raised, so the shared edge is its own border', () => {
      const css = radioCss();

      expect(css).toContain(
        ':host(.andes-radio--button.andes-radio--checked) {',
      );
      expect(css).toContain('z-index: 1;');
    });
  });

  describe('hover lift', () => {
    it('defines one private lift: the selected tone mixed 82% toward white', () => {
      const css = radioCss().split(/\s+/).join(' ');

      expect(css).toContain(
        '--_andes-radio-lift: color-mix(in srgb, var(--_andes-radio-tone) 82%, white);',
      );
      expect(css).toContain('--_andes-radio-tone: var(--andes-color-primary);');
    });

    it('lightens the selected disc on hover, never the darker token', () => {
      const css = radioCss();
      const forcedNone = atRuleBody(css, '@media (forced-colors: none)');

      expect(css).not.toContain('primary-hover');
      expect(forcedNone).toContain(
        ':host(.andes-radio--checked:not(.andes-radio--disabled):not(.andes-radio--readonly)) .andes-radio__label:hover .andes-radio__control',
      );
      expect(forcedNone).toContain(
        'background-color: var(--_andes-radio-lift);',
      );
    });

    it('lightens a checked solid segment, but never a disabled or read-only one', () => {
      const css = radioCss();

      expect(css).toContain(
        ':host(.andes-radio--button.andes-radio--solid.andes-radio--checked:not(.andes-radio--disabled):not(.andes-radio--readonly)) .andes-radio__label:hover .andes-radio__text',
      );
    });

    it('lets a status carry its own color into the lift', () => {
      const css = radioCss();

      expect(css).toContain(
        ':host(.andes-radio--invalid:not(.andes-radio--button)) .andes-radio__label {',
      );
      expect(css).toContain(
        ':host(.andes-radio--warning:not(.andes-radio--button)) .andes-radio__label {',
      );
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
