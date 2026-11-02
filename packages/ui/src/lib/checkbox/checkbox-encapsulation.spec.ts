import { encapsulateStyle } from '@angular/compiler';
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { AndesCheckbox } from './checkbox';

/**
 * Regression suite for the icon-visibility bug: a checked checkbox rendered as a plain solid
 * blue square, with no checkmark glyph at all, because the rule that reveals the icon never
 * matched anything.
 *
 * WHY THESE TESTS GO THROUGH `encapsulateStyle` RATHER THAN JUST RENDERING THE COMPONENT:
 * the bug only exists on the RUNTIME style-scoping path. The AOT builder (`ng-packagr`, and
 * the unit-test builder these specs run under) hands each component's CSS to esbuild first,
 * which reformats every selector onto a single line before Angular ever scopes it - so the
 * defect is invisible from a plain `TestBed` render. Storybook, by contrast, embeds the CSS
 * file's RAW text in the compiled bundle (verified by grepping dist/storybook) and Angular
 * scopes it in the browser at runtime, newlines and all. `encapsulateStyle` is precisely that
 * runtime entry point, so feeding it the real checkbox.css source is what reproduces what a
 * user actually sees - and it is the only way a test here can fail when the source regresses.
 */

/**
 * The checkbox's styles: its own sheet, then the shared check motion holding the keyframes
 * it animates with (own sheet first, so a lookup of its first at-rule still finds its own).
 */
const CSS_PATHS = [
  join(process.cwd(), new URL('./checkbox.css', import.meta.url).pathname),
  join(process.cwd(), new URL('./check-motion.css', import.meta.url).pathname),
];
/** Stand-in for the `%COMP%` placeholder Angular fills with the component's own id. */
const SCOPE = 'andes-test-scope';

function runtimeScopedCss(): string {
  return CSS_PATHS.map((path) => encapsulateStyle(readFileSync(path, 'utf8')))
    .join('\n')
    .split('%COMP%')
    .join(SCOPE);
}

/** The raw stylesheet source, for the contract tests that read it as text. */
function rawCss(): string {
  return CSS_PATHS.map((path) => readFileSync(path, 'utf8')).join('\n');
}

/**
 * The body of the first at-rule whose prelude is exactly `prelude`, found by brace counting
 * (plain string operations - no dynamic patterns).
 */
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

/** Every index at which `needle` occurs in `haystack`. */
function indicesOf(haystack: string, needle: string): number[] {
  const found: number[] = [];
  let index = haystack.indexOf(needle);
  while (index >= 0) {
    found.push(index);
    index = haystack.indexOf(needle, index + needle.length);
  }
  return found;
}

/** `css` without its comments. */
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

/**
 * Re-stamps a rendered checkbox's scoping attributes with `SCOPE`, so that only the CSS this
 * suite compiles at runtime applies to it - never the already-correct copy the AOT build
 * injected into the document, which would otherwise mask the very bug under test.
 */
function withRuntimeScope(source: HTMLElement): HTMLElement {
  const clone = source.cloneNode(true) as HTMLElement;

  for (const element of [clone, ...Array.from(clone.querySelectorAll('*'))]) {
    for (const { name } of Array.from(element.attributes)) {
      if (name.startsWith('_ngcontent-')) {
        element.removeAttribute(name);
        element.setAttribute(`_ngcontent-${SCOPE}`, '');
      } else if (name.startsWith('_nghost-')) {
        element.removeAttribute(name);
        element.setAttribute(`_nghost-${SCOPE}`, '');
      }
    }
  }

  return clone;
}

@Component({
  imports: [AndesCheckbox],
  template: `<andes-checkbox
    [checked]="checked()"
    [indeterminate]="indeterminate()"
    >Accept terms</andes-checkbox
  >`,
})
class IconHost {
  readonly checked = signal(false);
  readonly indeterminate = signal(false);
}

describe('AndesCheckbox style encapsulation', () => {
  let styleElement: HTMLStyleElement | undefined;
  let mounted: HTMLElement | undefined;

  afterEach(() => {
    styleElement?.remove();
    mounted?.remove();
    styleElement = undefined;
    mounted = undefined;
  });

  /**
   * Renders the real component, then mounts a runtime-scoped clone of its DOM styled only by
   * the runtime-scoped build of the real checkbox.css.
   */
  function renderWithRuntimeCss(options: {
    checked: boolean;
    indeterminate: boolean;
  }) {
    const fixture = TestBed.createComponent(IconHost);
    fixture.componentInstance.checked.set(options.checked);
    fixture.componentInstance.indeterminate.set(options.indeterminate);
    fixture.detectChanges();

    const root = withRuntimeScope(fixture.nativeElement as HTMLElement);
    mounted = root;
    const input = root.querySelector('input') as HTMLInputElement;
    // `cloneNode` copies the `checked` ATTRIBUTE (`defaultChecked`) and skips `indeterminate`
    // entirely - both `:checked` and `:indeterminate` match on the live DOM PROPERTY, so they
    // have to be re-applied by hand here.
    input.checked = options.checked;
    input.indeterminate = options.indeterminate;

    styleElement = document.createElement('style');
    styleElement.textContent = runtimeScopedCss();
    document.head.appendChild(styleElement);
    document.body.appendChild(mounted);

    const opacityOf = (selector: string) =>
      getComputedStyle(root.querySelector(selector) as Element).opacity;

    return { input, opacityOf };
  }

  describe('compiled selectors', () => {
    it('never emits a scoping attribute as a compound of its own', () => {
      // The actual defect, in its most general form: Angular treats a NEWLINE inside a
      // selector as a part boundary, drops the scoping attribute from the compound before it,
      // and emits that attribute as a standalone extra descendant step - matching an element
      // that does not exist. Guarding the whole stylesheet (rather than the three known
      // rules) is what makes this catch the next multi-line selector someone adds.
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

    it('attaches the scoping attribute to every compound of the icon rules', () => {
      const css = runtimeScopedCss();
      const attr = `[_ngcontent-${SCOPE}]`;

      for (const [state, icon] of [
        ['checked', 'check'],
        ['indeterminate', 'indeterminate'],
        ['indeterminate', 'check'],
      ] as const) {
        const selector = css
          .split('\n')
          .find(
            (line) =>
              line.includes(`:${state}`) &&
              line.includes(`.andes-checkbox__icon--${icon}${attr}`),
          );

        expect(selector).toBeDefined();
        // The box is the compound that lost its attribute, taking the whole rule down with it.
        expect(selector).toContain(`.andes-checkbox__box${attr}`);
      }
    });
  });

  describe('rendered icon visibility', () => {
    it('shows the check icon when checked', () => {
      const { input, opacityOf } = renderWithRuntimeCss({
        checked: true,
        indeterminate: false,
      });

      expect(input.checked).toBe(true);
      expect(opacityOf('.andes-checkbox__icon--check')).toBe('1');
    });

    it('hides the check icon when unchecked', () => {
      const { opacityOf } = renderWithRuntimeCss({
        checked: false,
        indeterminate: false,
      });

      expect(opacityOf('.andes-checkbox__icon--check')).toBe('0');
    });

    it('shows the indeterminate icon and hides the check icon when indeterminate', () => {
      const { input, opacityOf } = renderWithRuntimeCss({
        checked: true,
        indeterminate: true,
      });

      expect(input.indeterminate).toBe(true);
      expect(opacityOf('.andes-checkbox__icon--indeterminate')).toBe('1');
      expect(opacityOf('.andes-checkbox__icon--check')).toBe('0');
    });
  });

  describe('stylesheet contract', () => {
    it('only animates inside the motion-allowed, non-forced-colors query', () => {
      // The animations live in the shared check motion, next to the keyframes they play
      // (Angular scopes keyframe names one stylesheet at a time); the checkbox's own sheet
      // has none.
      const [own, shared] = CSS_PATHS.map((path) => readFileSync(path, 'utf8'));
      expect(indicesOf(own, 'animation:')).toEqual([]);

      const blocks = shared.split(`${MOTION_QUERY} {`).slice(1);
      expect(blocks.length).toBeGreaterThan(0);
      const inside = blocks
        .map((block) => atRuleBody(`${MOTION_QUERY} {${block}`, MOTION_QUERY))
        .reduce(
          (count, body) => count + indicesOf(body, 'animation:').length,
          0,
        );
      expect(inside).toBeGreaterThan(0);
      expect(inside).toBe(indicesOf(shared, 'animation:').length);
    });

    it('keys every animation off the one-shot data-motion hook', () => {
      const motion = withoutComments(atRuleBody(rawCss(), MOTION_QUERY));
      const selectors = motion
        .split('}')
        .map((block) => block.split('{')[0].trim())
        .filter((selector) => selector !== '');

      for (const selector of selectors) {
        expect(selector).toContain("[data-motion='");
      }
      expect(motion).toContain("[data-motion='check']");
      expect(motion).toContain("[data-motion='indeterminate']");
      expect(motion).toContain("[data-motion='uncheck']");
    });

    it('draws the tick with stroke-dashoffset and pops the box', () => {
      const css = rawCss();
      const draw = atRuleBody(css, '@keyframes andes-checkbox-draw');
      const pop = atRuleBody(css, '@keyframes andes-checkbox-pop');

      expect(draw).toContain('stroke-dashoffset: 14');
      expect(draw).toContain('stroke-dashoffset: 0');
      expect(pop).toContain('scale(1.1)');
    });

    it('lightens a checked or mixed box on hover, but never a disabled or read-only one', () => {
      const css = rawCss();
      const hover = withoutComments(
        atRuleBody(css, '@media (forced-colors: none)'),
      );

      expect(css.split(/\s+/).join(' ')).toContain(
        '--_andes-checkbox-lift: color-mix( in srgb, var(--andes-color-primary) 82%, white );',
      );
      for (const state of ['checked', 'indeterminate']) {
        const selector = `.andes-checkbox:not(.andes-checkbox--readonly) .andes-checkbox__input:${state}:hover:not(:disabled) ~ .andes-checkbox__box`;
        expect(hover).toContain(selector);
      }
      expect(hover).toContain('background-color: var(--_andes-checkbox-lift);');
      expect(hover).toContain('border-color: var(--_andes-checkbox-lift);');
      // Never the darker hover token the old rules would have used.
      expect(hover).not.toContain('primary-hover');
    });

    it('keeps the lightened hover out of the forced-colors palette', () => {
      const forced = atRuleBody(rawCss(), '@media (forced-colors: active)');

      expect(forced).not.toContain('--_andes-checkbox-lift');
    });

    it('scales the ring with a size-driven spread and keeps it at 20% opacity at most', () => {
      const ring = atRuleBody(rawCss(), '@keyframes andes-checkbox-ripple');

      expect(ring).toContain('var(--andes-color-primary) 20%');
      expect(ring).toContain('var(--_andes-checkbox-ring)');
      expect(ring).toContain('var(--andes-color-primary) 0%');
    });

    it('drops every transition under prefers-reduced-motion', () => {
      const reduced = atRuleBody(
        rawCss(),
        '@media (prefers-reduced-motion: reduce)',
      );

      expect(reduced).toContain('.andes-checkbox__box');
      expect(reduced).toContain('.andes-checkbox__icon');
      expect(reduced).toContain('transition: none');
    });

    it('keeps the pointer target at 24px, and 44px on coarse pointers', () => {
      const css = rawCss();
      const coarse = atRuleBody(css, '@media (pointer: coarse)');

      expect(css).toContain('--_andes-checkbox-hit: 1.5rem;');
      expect(coarse).toContain('--_andes-checkbox-hit: 2.75rem;');
      expect(css).toContain(
        'width: calc(100% + 2 * var(--_andes-checkbox-hit-extra));',
      );
    });

    it('maps the checked box and button onto system colors in forced-colors mode', () => {
      const forced = atRuleBody(rawCss(), '@media (forced-colors: active)');

      expect(forced).toContain('background-color: Highlight;');
      expect(forced).toContain('color: HighlightText;');
      expect(forced).toContain('.andes-checkbox--button:has(');
    });

    it('uses tokens, never literal colors, outside the forced-colors block', () => {
      const css = withoutComments(rawCss());
      const forced = atRuleBody(css, '@media (forced-colors: active)');
      const rest = css.split(forced).join('');

      expect(indicesOf(rest, '#')).toEqual([]);
      expect(indicesOf(rest, 'rgb(')).toEqual([]);
      expect(indicesOf(rest, 'hsl(')).toEqual([]);
    });

    it('scopes the card and button :has() rules to the component', () => {
      const css = runtimeScopedCss();
      const attr = `[_ngcontent-${SCOPE}]`;

      expect(css).toContain(
        `.andes-checkbox--card${attr}:has(.andes-checkbox__input:checked)`,
      );
      expect(css).toContain(
        `.andes-checkbox--button${attr}:has(.andes-checkbox__input:focus-visible)`,
      );
    });
  });
});
