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

  describe('time columns', () => {
    const column = '.andes-date-picker__time-column';

    it('leaves room after the last option so any option can scroll to the top', () => {
      // The column's own height is the size container the spacer is measured against.
      expect(declaredValue(source, column, 'container-type')).toBe('size');
      const spacer = `${column}::after`;
      expect(declaredValue(source, spacer, 'content')).toBe("''");
      expect(declaredValue(source, spacer, 'display')).toBe('block');
      // The column's height less one 1.75rem option.
      expect(declaredValue(source, spacer, 'height')).toBe(
        'calc(100cqh - 1.75rem)',
      );
      expect(
        declaredValue(source, '.andes-date-picker__time-option', 'height'),
      ).toBe('1.75rem');
    });
  });

  describe('intrinsic width', () => {
    it('lets the host shrink to its content and fill whatever stretches it', () => {
      expect(declaredValue(source, ':host', 'display')).toBe('inline-block');
      expect(declaredValue(source, ':host', 'width')).toBe(
        'var(--andes-date-picker-width, auto)',
      );
      expect(declaredValue(source, ':host', 'max-width')).toBe('100%');
      const field = '.andes-date-picker__field';
      expect(declaredValue(source, field, 'flex')).toBe('1 1 auto');
      expect(declaredValue(source, field, 'min-width')).toBe('0');
      expect(declaredValue(source, field, 'width')).toBeUndefined();
    });

    it('starts each input at the width of a value, in em so the sizes scale it', () => {
      const input = '.andes-date-picker__input';
      expect(declaredValue(source, input, 'flex')).toBe(
        '1 1 var(--_date-picker-input-width)',
      );
      expect(declaredValue(source, input, 'width')).toBe(
        'var(--_date-picker-input-width)',
      );
      const range = ":host([data-mode='range']) .andes-date-picker__input";
      expect(declaredValue(source, range, 'width')).toBe(
        'calc(var(--_date-picker-input-width) + 0.25rem)',
      );
    });

    it.each([
      [':host', '6.5625em'],
      [":host([data-picker='time'])", '5.5625em'],
      [":host([data-picker='time'][data-time='12h'])", '6.5625em'],
      [":host([data-picker='date'][data-time])", '11.1875em'],
      [
        ":host([data-mode='single'][data-picker='time'][data-time='24h'])",
        '6.125em',
      ],
      [":host([data-mode='single'][data-picker='month'])", '7em'],
      [":host([data-mode='single'][data-picker='quarter'])", '7.4375em'],
    ])('gives %s inputs %s', (selector, width) => {
      expect(
        declaredValue(source, selector, '--_date-picker-input-width'),
      ).toBe(width);
    });

    it('gives a multiple field, whose tags wrap, a range width that still grows', () => {
      const multiple = '.andes-date-picker__field--multiple';
      expect(declaredValue(source, multiple, 'width')).toBe('16.625rem');
      expect(
        declaredValue(
          source,
          '.andes-date-picker__selection .andes-date-picker__input',
          'width',
        ),
      ).toBe('auto');
    });
  });

  describe('panel following the active input', () => {
    it('slides the marked pane for 300ms, with motion allowed only', () => {
      const pane = '::ng-deep .andes-date-picker__pane--shifting';
      expect(declaredValue(source, pane, 'transition')).toBeUndefined();
      expect(declaredValue(motion, pane, 'transition')).toBe(
        'transform calc(var(--andes-motion-duration-slow, 200ms) * 1.5) var(--andes-motion-ease-out, cubic-bezier(0.2, 0, 0, 1))',
      );
    });
  });

  describe('forced colors', () => {
    const forced = atRule(source, '@media (forced-colors: active)');

    it('has a forced-colors block', () => {
      expect(forced).not.toBe('');
    });

    it('rings the focused or open field with an outline, since the shadow ring is dropped', () => {
      const focused = '.andes-date-picker__field:focus-within';
      expect(declaredValue(forced, focused, 'outline')).toBe(
        '2px solid Highlight',
      );
      expect(declaredValue(forced, focused, 'border-color')).toBe('Highlight');
      expect(
        declaredValue(forced, '.andes-date-picker__field--open', 'outline'),
      ).toBe('2px solid Highlight');
    });

    it('mutes a disabled field with GrayText', () => {
      expect(
        declaredValue(
          forced,
          '.andes-date-picker__field[data-disabled]',
          'color',
        ),
      ).toBe('GrayText');
    });

    it('keeps the range bar and the picked time visible with system colors', () => {
      expect(
        declaredValue(
          forced,
          '.andes-date-picker__active-bar',
          'background-color',
        ),
      ).toBe('Highlight');
      const selected = '.andes-date-picker__time-option--selected';
      expect(declaredValue(forced, selected, 'background-color')).toBe(
        'SelectedItem',
      );
      expect(declaredValue(forced, selected, 'color')).toBe('SelectedItemText');
      expect(declaredValue(forced, selected, 'forced-color-adjust')).toBe(
        'none',
      );
    });

    it('draws hovered options and presets with an outline', () => {
      for (const selector of [
        '.andes-date-picker__time-option:hover',
        '.andes-date-picker__preset:hover',
      ]) {
        expect(declaredValue(forced, selector, 'outline')).toBe(
          '1px solid Highlight',
        );
      }
    });

    it('keeps the knocked-out "x" of the clear button apart from its disc', () => {
      expect(
        declaredValue(forced, '.andes-date-picker__clear-glyph circle', 'fill'),
      ).toBe('ButtonText');
      expect(
        declaredValue(forced, '.andes-date-picker__clear-glyph path', 'stroke'),
      ).toBe('Canvas');
    });

    it('edges only the sides of the arrow that face away from the panel', () => {
      const arrow = '.andes-date-picker__arrow';
      expect(declaredValue(forced, arrow, 'border-top-color')).toBe(
        'CanvasText',
      );
      expect(declaredValue(forced, arrow, 'border-left-color')).toBe(
        'CanvasText',
      );
      expect(declaredValue(forced, arrow, 'border-color')).toBe('Canvas');
      const below = `${arrow}[data-side='top']`;
      expect(declaredValue(forced, below, 'border-bottom-color')).toBe(
        'CanvasText',
      );
      expect(declaredValue(forced, below, 'border-right-color')).toBe(
        'CanvasText',
      );
    });

    it("leaves the panel's transparent border to be painted by the browser", () => {
      expect(
        declaredValue(source, '::ng-deep .andes-date-picker__panel', 'border'),
      ).toBe('1px solid transparent');
    });
  });

  describe('right-to-left', () => {
    it('turns the default range arrow round and the panel arrow edges follow the sides', () => {
      expect(
        declaredValue(
          source,
          ":host-context([dir='rtl']) .andes-date-picker__separator[data-arrow]",
          'scale',
        ),
      ).toBe('-1 1');
      const arrow = '.andes-date-picker__arrow';
      expect(declaredValue(source, arrow, 'border-top-color')).toBe(
        'var(--andes-color-border)',
      );
      expect(
        declaredValue(
          source,
          `${arrow}[data-side='top']`,
          'border-bottom-color',
        ),
      ).toBe('var(--andes-color-border)');
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
