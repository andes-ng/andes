import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { atRule, collapsed } from '../../testing/at-rule';
import { declaredValue } from '../../testing/computed-style';

const source = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), 'calendar.css'),
  'utf-8',
);
const css = collapsed(source);

describe('AndesCalendar styles', () => {
  describe('motion tokens', () => {
    it('falls back to the real token values, not older hand-made ones', () => {
      const chip = declaredValue(
        source,
        ':is(.andes-calendar__day, .andes-calendar__period) > :is(.andes-calendar__cell-text, .andes-calendar__cell-content)',
        'transition',
      );
      expect(chip).toBe(
        'background-color var(--andes-motion-duration-fast, 120ms) var(--andes-motion-ease-out, cubic-bezier(0.2, 0, 0, 1)), color var(--andes-motion-duration-fast, 120ms) var(--andes-motion-ease-out, cubic-bezier(0.2, 0, 0, 1))',
      );
      for (const selector of [
        '.andes-calendar__nav',
        '.andes-calendar__caption--button',
      ]) {
        expect(declaredValue(source, selector, 'transition')).toBe(
          'color var(--andes-motion-duration-fast, 120ms) var(--andes-motion-ease-out, cubic-bezier(0.2, 0, 0, 1))',
        );
      }
    });

    it('keeps no stale fallback anywhere in the sheet', () => {
      expect(css.includes('0.1s')).toBe(false);
      expect(css.includes('0.215, 0.61, 0.355')).toBe(false);
    });
  });

  describe('range preview', () => {
    const band = 'var(--andes-calendar-band)';

    it('fills the preview with the range band, half a band at each boundary', () => {
      for (const selector of [
        '.andes-calendar__day--in-preview::before',
        '.andes-calendar__day--preview-start::before',
        '.andes-calendar__day--preview-end::before',
      ]) {
        expect(declaredValue(source, selector, 'background-color')).toBe(band);
        expect(declaredValue(source, selector, 'border-block')).toBeUndefined();
      }
      expect(
        declaredValue(
          source,
          '.andes-calendar__day--preview-start::before',
          'inset-inline-start',
        ),
      ).toBe('50%');
      expect(
        declaredValue(
          source,
          '.andes-calendar__day--preview-end::before',
          'inset-inline-end',
        ),
      ).toBe('50%');
    });

    it('declares the half bands after the full-width band they override', () => {
      expect(
        source.indexOf('.andes-calendar__day--preview-end::before {'),
      ).toBeGreaterThan(
        source.indexOf('.andes-calendar__day--in-preview::before {'),
      );
    });
  });

  describe('right-to-left', () => {
    it('mirrors the default chevrons under dir="rtl"', () => {
      expect(
        declaredValue(
          source,
          ":host-context([dir='rtl']) .andes-calendar__nav svg",
          'scale',
        ),
      ).toBe('-1 1');
    });

    it('draws nothing it would have to mirror by hand: the bands use logical insets', () => {
      expect(css.includes('inset-inline-start: 50%')).toBe(true);
      expect(css.includes('inset-inline-end: 50%')).toBe(true);
      // No physical left/right offsets anywhere in the sheet.
      expect(css.includes(' left:')).toBe(false);
      expect(css.includes(' right:')).toBe(false);
    });
  });

  describe('live region', () => {
    it('is visually hidden but still read out', () => {
      const announcer = '.andes-calendar__announcer';
      expect(declaredValue(source, announcer, 'position')).toBe('absolute');
      expect(declaredValue(source, announcer, 'width')).toBe('1px');
      expect(declaredValue(source, announcer, 'height')).toBe('1px');
      expect(declaredValue(source, announcer, 'clip-path')).toBe('inset(50%)');
      expect(declaredValue(source, announcer, 'display')).toBeUndefined();
      expect(declaredValue(source, announcer, 'visibility')).toBeUndefined();
      expect(declaredValue(source, '.andes-calendar', 'position')).toBe(
        'relative',
      );
    });
  });

  describe('forced colors', () => {
    const forced = atRule(source, '@media (forced-colors: active)');
    const chip =
      ':is(.andes-calendar__day, .andes-calendar__period) > :is(.andes-calendar__cell-text, .andes-calendar__cell-content)';

    it('has a forced-colors block', () => {
      expect(forced).not.toBe('');
    });

    it('tells a selected day by system selection colors that keep their fill', () => {
      const selected = '.andes-calendar__day--selected > *';
      expect(declaredValue(forced, selected, 'background-color')).toBe(
        'SelectedItem',
      );
      expect(declaredValue(forced, selected, 'color')).toBe('SelectedItemText');
      expect(declaredValue(forced, selected, 'border-color')).toBe(
        'SelectedItem',
      );
      expect(declaredValue(forced, selected, 'forced-color-adjust')).toBe(
        'none',
      );
    });

    it('draws today with a dashed edge, which a selected day (solid) is not', () => {
      expect(
        declaredValue(
          forced,
          '.andes-calendar__day--today > *',
          'border-style',
        ),
      ).toBe('dashed');
      expect(
        declaredValue(
          forced,
          '.andes-calendar__day--selected > *',
          'border-style',
        ),
      ).toBe('solid');
    });

    it('blanks the chip border, which would otherwise be painted around every day', () => {
      expect(declaredValue(forced, chip, 'border-color')).toBe('Canvas');
    });

    it('draws the range as a solid line above and below, the preview dashed', () => {
      expect(
        declaredValue(
          forced,
          '.andes-calendar__day--in-range::before',
          'border-block',
        ),
      ).toBe('1px solid Highlight');
      expect(
        declaredValue(
          forced,
          '.andes-calendar__day--range-end:not(.andes-calendar__day--range-start)::before',
          'border-block',
        ),
      ).toBe('1px solid Highlight');
      // Fills are replaced in forced colors, so only there the preview is a dashed line.
      expect(
        declaredValue(
          forced,
          '.andes-calendar__day--in-preview::before',
          'border-block',
        ),
      ).toBe('1px dashed CanvasText');
    });

    it('dims outside and disabled days with GrayText rather than opacity alone', () => {
      expect(
        declaredValue(forced, '.andes-calendar__day--outside', 'color'),
      ).toBe('GrayText');
      expect(
        declaredValue(
          forced,
          ".andes-calendar__day[aria-disabled='true']",
          'color',
        ),
      ).toBe('GrayText');
    });

    it("keeps a week picker's selected row readable", () => {
      expect(
        declaredValue(
          forced,
          '.andes-calendar--week-picker .andes-calendar__day--selected::before',
          'background-color',
        ),
      ).toBe('SelectedItem');
      expect(
        declaredValue(
          forced,
          '.andes-calendar--week-picker .andes-calendar__day--selected',
          'color',
        ),
      ).toBe('SelectedItemText');
    });
  });
});
