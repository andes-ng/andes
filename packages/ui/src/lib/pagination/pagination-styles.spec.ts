import { readFileSync } from 'node:fs';

/*
 * The visual rules that a jsdom run cannot measure, pinned in the stylesheet: tabular
 * numerals on the page items, a 150ms cross-fade between the ellipsis and the double
 * chevrons of a jump item (and no animation under reduced motion), a flex box per list
 * item so every item shares one centre line, and 8px between "Rows per page" and its select.
 * The same things were measured in a real browser; this keeps them from being edited away.
 */
const css = readFileSync(
  'packages/ui/src/lib/pagination/pagination.css',
  'utf8',
);

/** The declarations of the first rule whose selector starts with `selector`. */
function rule(selector: string): string {
  // A rule starts a line, so a longer selector that ends the same way is not mistaken for it.
  const start = css.indexOf(`\n${selector} {`);
  if (start === -1) {
    return '';
  }
  return css.slice(start, css.indexOf('}', start));
}

describe('pagination styles', () => {
  it('sets tabular numerals on the items', () => {
    expect(rule('.andes-pagination__item ::ng-deep .andes-button')).toContain(
      'font-variant-numeric: tabular-nums',
    );
  });

  it('cross-fades the jump glyphs in 150ms inside one box', () => {
    expect(rule('.andes-pagination__jumper-glyph > *')).toContain(
      'transition: opacity 150ms ease',
    );
    expect(rule('.andes-pagination__jumper-glyph')).toContain('display: grid');
    expect(css).toContain('grid-area: 1 / 1');
  });

  it('drops the cross-fade and the spinner under reduced motion', () => {
    const reduced = css.slice(css.indexOf('prefers-reduced-motion'));

    expect(reduced).toContain('.andes-pagination__jumper-glyph > *');
    expect(reduced).toContain('transition: none');
    expect(reduced).toContain('animation: none');
  });

  it('gives every list item its own flex box, so icon and numbered items share a centre line', () => {
    expect(rule('.andes-pagination__list > li')).toContain('display: flex');
    expect(rule('.andes-pagination__list > li')).toContain(
      'align-items: center',
    );
  });

  it('puts 8px between the rows label and the select', () => {
    expect(rule('.andes-pagination__size-group')).toContain(
      'gap: var(--andes-space-2, 0.5rem)',
    );
  });

  it('draws the totals in the muted colour', () => {
    expect(rule('.andes-pagination__total')).toContain(
      'color: var(--andes-color-muted-foreground)',
    );
  });

  it('lightens the tint of a hovered or pressed current page so its text keeps 4.5:1', () => {
    expect(css).toContain('var(--andes-button-color) 5%');
    expect(css).toContain('var(--andes-button-color) 8%');
  });

  describe('no trail on the selected page', () => {
    const itemRule = '\n.andes-pagination__item ::ng-deep .andes-button {';

    it('turns every transition off on an item, so the old and the new current page change at once', () => {
      const rules = css
        .split(itemRule)
        .slice(1)
        .map((part) => part.slice(0, part.indexOf('}')));

      expect(rules.some((rule) => rule.includes('transition: none'))).toBe(
        true,
      );
    });

    it('fades only the tint of a hovered plain item, in at most 80ms', () => {
      // The selector may wrap over lines, so the rule is found from its first words.
      const first = css.indexOf(
        '.andes-pagination__item:not(.andes-pagination__page--active)',
      );
      const start = css.indexOf('{', first);
      const body = css.slice(start, css.indexOf('}', start));

      expect(first).toBeGreaterThan(-1);
      expect(body).toContain('background-color 80ms ease');
      expect(body).toContain('color 80ms ease');
      expect(body).toContain('border-color 80ms ease');
      // Only the plain item: the current page never animates, hovered or not.
      expect(body).not.toContain('page--active)');
    });

    it('declares no other transition than those, the jump cross-fade and reduced motion', () => {
      const declarations = css
        .split('\n')
        .filter((line) => line.trim().startsWith('transition'))
        .map((line) => line.trim());

      // none (items), the multi-line hover list, the jump glyph, none (reduced motion x2).
      expect(declarations).toEqual([
        'transition: none;',
        'transition:',
        'transition: opacity 150ms ease;',
        'transition: none;',
        'transition: none;',
      ]);
    });

    it('does not ripple or press an item', () => {
      const html = readFileSync(
        'packages/ui/src/lib/pagination/pagination.html',
        'utf8',
      );

      expect(html).toContain('[ripple]="false"');
    });
  });
});
