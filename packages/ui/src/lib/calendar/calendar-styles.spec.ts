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
          '.andes-calendar:not(.andes-calendar--week-picker) .andes-calendar__day--preview-start::before',
          'inset-inline-start',
        ),
      ).toBe('50%');
      expect(
        declaredValue(
          source,
          '.andes-calendar:not(.andes-calendar--week-picker) .andes-calendar__day--preview-end::before',
          'inset-inline-end',
        ),
      ).toBe('50%');
    });

    it("keeps a week picker's boundary rows whole, without half bands", () => {
      for (const selector of [
        '.andes-calendar:not(.andes-calendar--week-picker) .andes-calendar__day--preview-start::before',
        '.andes-calendar:not(.andes-calendar--week-picker) .andes-calendar__day--preview-end::before',
        '.andes-calendar:not(.andes-calendar--week-picker) .andes-calendar__day--range-end:not(.andes-calendar__day--range-start)::before',
      ]) {
        expect(source.includes(`${selector} {`)).toBe(true);
      }
      expect(
        source.includes(
          '.andes-calendar:not(.andes-calendar--week-picker):has(',
        ),
      ).toBe(true);
    });

    it('runs the band behind the whole chip of the previewed boundary that is not selected', () => {
      const end =
        '.andes-calendar:not(.andes-calendar--week-picker) .andes-calendar__day--preview-end:not(.andes-calendar__day--selected)::before';
      const start =
        '.andes-calendar:not(.andes-calendar--week-picker) .andes-calendar__day--preview-start:not(.andes-calendar__day--selected)::before';
      const edge =
        'calc(50% - var(--_andes-calendar-chip-width, var(--andes-calendar-chip)) / 2)';
      const squeeze = (value: string | undefined) => value?.replace(/\s+/g, '');
      expect(squeeze(declaredValue(source, end, 'inset-inline-end'))).toBe(
        squeeze(edge),
      );
      expect(squeeze(declaredValue(source, start, 'inset-inline-start'))).toBe(
        squeeze(edge),
      );
      // A period's chip is wider than a day's, so it names its own width.
      expect(
        declaredValue(
          source,
          '.andes-calendar__period',
          '--_andes-calendar-chip-width',
        ),
      ).toBe('3.75rem');
      // The chip itself stays unfilled, so the translucent band is never layered twice.
      expect(source).not.toContain(
        ":not([aria-disabled='true']) > * {\n  background-color: var(--andes-calendar-band);",
      );
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
          '.andes-calendar__day--today > :is(.andes-calendar__cell-text, .andes-calendar__cell-content)',
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

    it('outlines today with a rule as specific as the chip border it overrides', () => {
      const today =
        '.andes-calendar__day--today > :is(.andes-calendar__cell-text, .andes-calendar__cell-content)';
      expect(declaredValue(source, today, 'border-color')).toBe(
        'var(--andes-color-primary-text, var(--andes-color-primary))',
      );
      // After the chip rule, so that on equal specificity today wins.
      expect(source.indexOf(today)).toBeGreaterThan(
        source.indexOf('border: 1px solid transparent;'),
      );
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

  describe('cell chip and band', () => {
    // Each part of the shared day and period rules.
    const cell = '.andes-calendar__period';
    const band = '.andes-calendar__period::before';
    const content =
      ':is(.andes-calendar__day, .andes-calendar__period) > .andes-calendar__cell-content';

    it('centres one chip-tall track in the cell, which the band shares', () => {
      expect(declaredValue(source, cell, 'display')).toBe('inline-grid');
      expect(declaredValue(source, cell, 'grid-template-columns')).toBe('100%');
      expect(declaredValue(source, cell, 'align-content')).toBe('center');
      expect(declaredValue(source, cell, 'justify-items')).toBe('center');
      // The band is centred on that track and is the 24px chip tall whatever the chip holds, so
      // a boundary chip grown by a template does not make its band taller than its neighbours'.
      expect(declaredValue(source, band, 'position')).toBe('absolute');
      expect(declaredValue(source, band, 'grid-area')).toBe('1 / 1 / 2 / 2');
      expect(declaredValue(source, band, 'inset-inline')).toBe('0');
      expect(declaredValue(source, band, 'top')).toBe('50%');
      expect(declaredValue(source, band, 'height')).toBe(
        'var(--andes-calendar-chip)',
      );
      expect(declaredValue(source, band, 'transform')).toBe('translateY(-50%)');
    });

    it('grows a cellTemplate chip to its content, 4px clear of it, never under 24px', () => {
      expect(declaredValue(source, content, 'height')).toBe('auto');
      expect(declaredValue(source, content, 'min-height')).toBe(
        'var(--andes-calendar-chip)',
      );
      expect(declaredValue(source, content, 'padding-block')).toBe(
        'var(--andes-space-1)',
      );
      // The default chip, the day number alone, stays a fixed 24px square.
      expect(
        declaredValue(
          source,
          ':is(.andes-calendar__day, .andes-calendar__period) > :is(.andes-calendar__cell-text, .andes-calendar__cell-content)',
          'height',
        ),
      ).toBe('var(--andes-calendar-chip)');
    });

    it('lets a fullCellTemplate fill the whole cell', () => {
      expect(
        declaredValue(
          source,
          ':is(.andes-calendar__day, .andes-calendar__period):has(> .andes-calendar__cell-content--full)',
          'align-content',
        ),
      ).toBe('stretch');
      const full =
        ':is(.andes-calendar__day, .andes-calendar__period) > .andes-calendar__cell-content--full';
      expect(declaredValue(source, full, 'height')).toBe('100%');
      expect(declaredValue(source, full, 'padding-block')).toBe('0');
    });

    it('keeps the fullscreen cells a column of their own', () => {
      expect(
        declaredValue(
          source,
          '.andes-calendar--fullscreen .andes-calendar__day',
          'display',
        ),
      ).toBe('inline-flex');
    });
  });

  describe('week picker hover on the selected week', () => {
    it('keeps the selection fill instead of the hover fill, on the days and on the week number', () => {
      const days = source.match(
        /\.andes-calendar--week-picker \.andes-calendar__row:hover \.andes-calendar__day:not\(\[aria-disabled='true'\], \.andes-calendar__day--selected\)::before\s*{[^}]*accent-hover/,
      );
      expect(days).not.toBeNull();
      const number = source.match(
        /\.andes-calendar__row:hover:not\(:has\(\.andes-calendar__day--selected\)\):has\([^{]*week-number::before\s*{[^}]*accent-hover/,
      );
      expect(number).not.toBeNull();
    });
  });

  describe('preview through a committed boundary', () => {
    it('fills the whole cell of a committed start or end that the preview passes through', () => {
      expect(source).toMatch(
        /day--in-preview:not\(\.andes-calendar__day--preview-start\):not\(\.andes-calendar__day--preview-end\)::before\s*{[^}]*inset-inline: 0/,
      );
    });
  });
});
