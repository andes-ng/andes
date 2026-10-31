import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { atRule, collapsed } from '../../testing/at-rule';
import { declaredValue } from '../../testing/computed-style';

const here = dirname(fileURLToPath(import.meta.url));

/** The stylesheet as authored, for `declaredValue` lookups. */
const source = readFileSync(join(here, 'date-picker.css'), 'utf-8');

/** The stylesheet with comments dropped and whitespace collapsed, for contract checks. */
const css = collapsed(source);

const NO_PREFERENCE = '@media (prefers-reduced-motion: no-preference)';
const motion = atRule(source, NO_PREFERENCE);

describe('AndesDatePicker styles', () => {
  describe('clear button', () => {
    const rule = css.match(/\.andes-date-picker__clear \{[^}]*\}/)?.[0] ?? '';

    it('is centred over the 1em icon with a 24px hit area outside the layout', () => {
      expect(css).toMatch(
        /\.andes-date-picker__suffix \{[^}]*width: 1em; height: 1em;/,
      );
      expect(rule).toContain('position: absolute;');
      expect(rule).toContain('padding: calc((1.5rem - 1em) / 2);');
      expect(rule).toContain('transform: translate(-50%, -50%);');
    });

    it('swaps with the calendar icon on hover or focus-within, and always shows without hover', () => {
      const clear = '.andes-date-picker__clear';
      const shown =
        '.andes-date-picker__field:focus-within .andes-date-picker__clear';
      const icon = '.andes-date-picker__icon--hidden-on-hover';
      const iconHidden =
        '.andes-date-picker__field:focus-within .andes-date-picker__icon--hidden-on-hover';

      expect(declaredValue(source, clear, 'visibility')).toBe('hidden');
      expect(declaredValue(source, clear, 'opacity')).toBe('0');
      expect(declaredValue(source, shown, 'visibility')).toBe('visible');
      expect(declaredValue(source, shown, 'opacity')).toBe('1');
      expect(declaredValue(source, iconHidden, 'visibility')).toBe('hidden');
      expect(declaredValue(source, iconHidden, 'opacity')).toBe('0');

      const touch = atRule(source, '@media (hover: none)');
      expect(declaredValue(touch, clear, 'visibility')).toBe('visible');
      expect(declaredValue(touch, clear, 'opacity')).toBe('1');
      expect(declaredValue(touch, icon, 'visibility')).toBe('hidden');
      expect(declaredValue(touch, icon, 'opacity')).toBe('0');
    });

    it('cross-fades with the calendar icon over 0.2s, moving visibility at the far end of the fade', () => {
      const fade =
        'opacity var(--andes-motion-duration-slow, 200ms) var(--andes-motion-ease-out, cubic-bezier(0.2, 0, 0, 1))';
      const slow = 'var(--andes-motion-duration-slow, 200ms)';
      const mid = 'color var(--andes-motion-duration-mid, 150ms) ease';
      const shown =
        '.andes-date-picker__field:focus-within .andes-date-picker__clear';
      const iconHidden =
        '.andes-date-picker__field:focus-within .andes-date-picker__icon--hidden-on-hover';

      // Going away waits for the fade; appearing does not.
      expect(
        declaredValue(motion, '.andes-date-picker__clear', 'transition'),
      ).toBe(`${fade}, visibility 0s linear ${slow}, ${mid}`);
      expect(declaredValue(motion, shown, 'transition')).toBe(
        `${fade}, visibility 0s linear 0s, ${mid}`,
      );
      expect(
        declaredValue(
          motion,
          '.andes-date-picker__icon--hidden-on-hover',
          'transition',
        ),
      ).toBe(`${fade}, visibility 0s linear 0s`);
      expect(declaredValue(motion, iconHidden, 'transition')).toBe(
        `${fade}, visibility 0s linear ${slow}`,
      );
    });

    it('does not animate the swap under reduced motion', () => {
      expect(
        declaredValue(source, '.andes-date-picker__clear', 'transition'),
      ).toBeUndefined();
      expect(
        declaredValue(
          source,
          '.andes-date-picker__icon--hidden-on-hover',
          'transition',
        ),
      ).toBeUndefined();
    });

    it('draws a muted disc with the "x" knocked out, with a focus ring', () => {
      expect(css).toContain(
        '.andes-date-picker__clear-glyph circle { fill: currentColor; }',
      );
      expect(css).toContain(
        '.andes-date-picker__clear-glyph path { fill: none; stroke: var(--andes-color-background);',
      );
      expect(css).toContain(
        '.andes-date-picker__clear:focus-visible { outline: 2px solid var(--andes-color-focus-ring);',
      );
    });
  });

  describe('panel motion', () => {
    it('animates out, mirroring the entrance, while the overlay marks it closing', () => {
      expect(css).toContain(
        '@keyframes andes-date-picker-panel-exit { from { opacity: 1; transform: none; } to { opacity: 0; transform: scale(0.97); } }',
      );
      expect(
        declaredValue(
          motion,
          '.andes-date-picker__panel[data-andes-closing]',
          'animation',
        ),
      ).toBe(
        'andes-date-picker-panel-exit var(--andes-motion-duration-fast, 120ms) var(--andes-motion-ease-in, cubic-bezier(0.4, 0, 1, 1)) forwards',
      );
    });

    it('only animates when motion is allowed', () => {
      expect(css.indexOf('[data-andes-closing]')).toBeGreaterThan(
        css.indexOf(NO_PREFERENCE),
      );
      expect(
        declaredValue(
          source,
          ".andes-date-picker__panel[data-state='open']",
          'animation',
        ),
      ).toBeUndefined();
    });

    it('enters with the shared motion tokens, their current values as fallbacks', () => {
      expect(
        declaredValue(
          motion,
          ".andes-date-picker__panel[data-state='open']",
          'animation',
        ),
      ).toBe(
        'andes-date-picker-panel-enter var(--andes-motion-duration-mid, 150ms) var(--andes-motion-ease-out, cubic-bezier(0.2, 0, 0, 1))',
      );
    });
  });

  describe('panel origin', () => {
    const panel = '.andes-date-picker__panel';
    const origin = (selector: string) =>
      declaredValue(source, selector, '--_date-picker-origin-x');

    it('grows from the field-facing edge: top by default, bottom on a top panel', () => {
      expect(declaredValue(source, panel, '--_date-picker-origin-y')).toBe(
        'top',
      );
      expect(
        declaredValue(
          source,
          `${panel}[data-side='top']`,
          '--_date-picker-origin-y',
        ),
      ).toBe('bottom');
    });

    it('takes the left or right edge from the alignment, swapped under dir="rtl"', () => {
      expect(origin(panel)).toBe('left');
      expect(origin(`${panel}[data-align='end']`)).toBe('right');
      expect(origin(`${panel}[dir='rtl']`)).toBe('right');
      expect(origin(`${panel}[dir='rtl'][data-align='end']`)).toBe('left');
    });

    it('uses those variables for both the entrance and the exit, and no fixed corner', () => {
      for (const state of ["[data-state='open']", '[data-andes-closing]']) {
        expect(
          declaredValue(motion, `${panel}${state}`, 'transform-origin'),
        ).toBe('var(--_date-picker-origin-y) var(--_date-picker-origin-x)');
      }
      expect(css.includes('transform-origin: top left')).toBe(false);
    });
  });

  describe('range active bar and arrow', () => {
    const bar = '.andes-date-picker__active-bar';
    const arrow = '.andes-date-picker__arrow';
    const ease = 'var(--andes-motion-ease-out, cubic-bezier(0.2, 0, 0, 1))';
    const slide = `calc(var(--andes-motion-duration-slow, 200ms) * 1.5) ${ease}`;

    it('is one 2px bar over the field bottom edge, in the accent colour, hidden until shown', () => {
      expect(declaredValue(source, bar, 'position')).toBe('absolute');
      expect(declaredValue(source, bar, 'bottom')).toBe('-1px');
      expect(declaredValue(source, bar, 'height')).toBe('2px');
      expect(declaredValue(source, bar, 'background-color')).toBe(
        'var(--_date-picker-accent)',
      );
      expect(declaredValue(source, bar, 'opacity')).toBe('0');
      expect(declaredValue(source, `${bar}[data-visible]`, 'opacity')).toBe(
        '1',
      );
    });

    it('no longer marks the active input with a per-input shadow', () => {
      expect(
        declaredValue(
          source,
          '.andes-date-picker__input[data-active]',
          'box-shadow',
        ),
      ).toBeUndefined();
      expect(
        declaredValue(source, '.andes-date-picker__input', 'transition'),
      ).toBeUndefined();
    });

    it('slides in 300ms, from the slow token, only between the inputs and only with motion allowed', () => {
      expect(declaredValue(source, bar, 'transition')).toBeUndefined();
      expect(
        declaredValue(source, `${bar}[data-animated]`, 'transition'),
      ).toBeUndefined();
      expect(declaredValue(motion, `${bar}[data-animated]`, 'transition')).toBe(
        `opacity var(--andes-motion-duration-fast, 120ms) ${ease}, left ${slide}, width ${slide}`,
      );
      expect(
        declaredValue(motion, `${arrow}[data-animated]`, 'transition'),
      ).toBe(`left ${slide}`);
    });

    it('draws the arrow as a small diamond on the panel edge facing the field, hidden until measured', () => {
      expect(declaredValue(source, arrow, 'transform')).toBe(
        'translateX(-50%) rotate(45deg)',
      );
      expect(declaredValue(source, arrow, 'top')).toBe(
        'calc(var(--_date-picker-arrow-size) / -2)',
      );
      expect(declaredValue(source, `${arrow}[data-side='top']`, 'top')).toBe(
        'auto',
      );
      expect(declaredValue(source, `${arrow}[data-side='top']`, 'bottom')).toBe(
        'calc(var(--_date-picker-arrow-size) / -2)',
      );
      expect(
        declaredValue(source, `${arrow}:not([data-ready])`, 'visibility'),
      ).toBe('hidden');
      expect(declaredValue(source, arrow, 'pointer-events')).toBe('none');
    });

    it('fades with the panel when it opens and closes', () => {
      expect(declaredValue(motion, arrow, 'animation')).toBe(
        'andes-date-picker-arrow-enter var(--andes-motion-duration-mid, 150ms) var(--andes-motion-ease-out, cubic-bezier(0.2, 0, 0, 1))',
      );
      expect(
        declaredValue(motion, `${arrow}[data-andes-closing]`, 'animation'),
      ).toContain('andes-date-picker-arrow-exit');
    });
  });

  describe('panel chrome', () => {
    const panel = '::ng-deep .andes-date-picker__panel';

    it('has the transparent edge and soft three-layer elevation Select and Combobox use', () => {
      expect(declaredValue(source, panel, 'border')).toBe(
        '1px solid transparent',
      );
      const shadow = declaredValue(source, panel, 'box-shadow') ?? '';
      expect(shadow).toContain('--andes-shadow-popover');
      expect(shadow).toContain('0 6px 16px 0 rgb(0 0 0 / 8%)');
      expect(shadow).not.toContain('--andes-shadow-md');
    });
  });

  describe('motion tokens', () => {
    it('writes no hand-made durations or eases in the field, presets or options', () => {
      const field = declaredValue(
        motion,
        '.andes-date-picker__field',
        'transition',
      );
      expect(field).toBe(
        'border-color var(--andes-motion-duration-mid, 150ms) ease, box-shadow var(--andes-motion-duration-mid, 150ms) ease, background-color var(--andes-motion-duration-mid, 150ms) ease',
      );
      expect(
        declaredValue(motion, '.andes-date-picker__preset', 'transition'),
      ).toBe('background-color var(--andes-motion-duration-mid, 150ms) ease');
    });

    it('uses the legacy duration aliases nowhere', () => {
      expect(css.includes('--andes-duration-')).toBe(false);
      expect(css.includes('--andes-ease-')).toBe(false);
    });

    it('fades the time options on hover with the fast token', () => {
      expect(
        declaredValue(motion, '.andes-date-picker__time-option', 'transition'),
      ).toBe(
        'background-color var(--andes-motion-duration-fast, 120ms) var(--andes-motion-ease-out, cubic-bezier(0.2, 0, 0, 1))',
      );
    });
  });
});
