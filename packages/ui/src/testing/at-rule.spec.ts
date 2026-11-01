import { atRule, collapsed } from './at-rule';
import { declaredValue } from './computed-style';

const css = `
.a { color: red; }
@media (forced-colors: active) {
  .a { color: CanvasText; }
  .b:hover { outline: 1px solid Highlight; }
}
@media (hover: none) { .c { visibility: visible; } }
@media (forced-colors: active) { .d { color: GrayText; } }
`;

describe('atRule', () => {
  it('returns the rules inside a matching at-rule, so declaredValue can read them', () => {
    const forced = atRule(css, '@media (forced-colors: active)');
    expect(declaredValue(forced, '.a', 'color')).toBe('CanvasText');
    expect(declaredValue(forced, '.b:hover', 'outline')).toBe(
      '1px solid Highlight',
    );
  });

  it('joins every block with the same prelude and leaves the others out', () => {
    const forced = atRule(css, '@media (forced-colors: active)');
    expect(declaredValue(forced, '.d', 'color')).toBe('GrayText');
    expect(declaredValue(forced, '.c', 'visibility')).toBeUndefined();
  });

  it('is empty when no at-rule matches', () => {
    expect(atRule(css, '@media (prefers-reduced-motion: reduce)')).toBe('');
  });

  it('collapses whitespace and drops comments', () => {
    expect(collapsed('.a {\n  /* x */ color:   red;\n}')).toBe(
      '.a { color: red; }',
    );
  });
});
