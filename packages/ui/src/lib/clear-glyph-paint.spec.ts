import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

/*
  The clear button of every field draws lucide's circle-x as a filled disc. Its color is
  translucent, so painting a stroke over the fill doubles the overlap into a darker ring: the disc
  is painted once, with a radius that reaches the edge of the box, and no stroke.
*/
const LIB = 'packages/ui/src/lib';

const GLYPHS: readonly (readonly [file: string, selector: string])[] = [
  ['input/input.css', '.andes-input__clear-glyph'],
  ['textarea/textarea.css', '.andes-textarea__clear-glyph'],
  ['select/select-trigger.css', '.andes-select__clear-glyph'],
  ['date-picker/date-picker.css', '.andes-date-picker__clear-glyph'],
  ['cascader/cascader.css', '.andes-cascader__clear-glyph'],
  ['tree-select/tree-select.css', '.andes-tree-select__clear-glyph'],
  ['mentions/mentions.css', '.andes-mentions__clear-glyph'],
];

/** The declarations of the first rule for `selector circle`, found by plain text search. */
function circleRule(css: string, selector: string): string {
  const head = `${selector} ::ng-deep circle {`;
  const start = css.indexOf(head);
  if (start === -1) {
    throw new Error(`No rule for ${selector} circle`);
  }
  const end = css.indexOf('}', start);
  return css.slice(start + head.length, end);
}

describe('clear button disc', () => {
  it.each(GLYPHS)(
    '%s paints the disc once, without a stroke',
    (file, selector) => {
      const rule = circleRule(readFileSync(join(LIB, file), 'utf8'), selector);
      expect(rule).toMatch(/fill:\s*currentcolor/i);
      expect(rule).toMatch(/stroke:\s*none/);
      expect(rule).toMatch(/\br:\s*12\b/);
      expect(rule).not.toMatch(/stroke-width/);
    },
  );
});
