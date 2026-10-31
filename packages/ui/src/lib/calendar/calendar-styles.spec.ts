import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { collapsed } from '../../testing/at-rule';
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
    const dashed =
      '1px dashed var(--andes-color-primary-text, var(--andes-color-primary))';

    it('runs the dashed band from chip to chip: half a band at each boundary', () => {
      for (const selector of [
        '.andes-calendar__day--in-preview::before',
        '.andes-calendar__day--preview-start::before',
        '.andes-calendar__day--preview-end::before',
      ]) {
        expect(declaredValue(source, selector, 'border-block')).toBe(dashed);
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
});
