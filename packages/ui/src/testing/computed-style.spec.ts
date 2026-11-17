import {
  declaredValue,
  expectInherited,
  expectLength,
  isZeroLength,
  px,
  toPx,
  toRem,
} from './computed-style';

describe('computed-style test helpers', () => {
  describe('px', () => {
    it('reads resolved pixel lengths, including the bare initial zero', () => {
      expect(px('38px')).toBe(38);
      expect(px('-5px')).toBe(-5);
      expect(px('10.5px')).toBe(10.5);
      expect(px('0')).toBe(0);
    });

    it.each(['2.375rem', '0.75em', '12', 'auto', '', 'var(--x)'])(
      'refuses the unresolved value %j',
      (value) => {
        expect(() => px(value)).toThrow(/resolved px length/);
      },
    );
  });

  it('converts pixels to rem', () => {
    expect(toRem(38)).toBe(2.375);
    expect(toRem(20, 10)).toBe(2);
  });

  describe('toPx', () => {
    it.each([
      ['2.375rem', {}, 38],
      ['0.75em', { fontSize: 14 }, 10.5],
      ['1em', {}, 16],
      ['24px', {}, 24],
      ['0', {}, 0],
      ['calc((1.5rem - 1em) / 2)', { fontSize: 14 }, 5],
      ['calc((1em - 1.5rem) / 2)', { fontSize: 16 }, -4],
      ['calc(4 * 1.375rem)', {}, 88],
      ['var(--andes-text-font-size, 0.875rem)', {}, 14],
      ['calc(var(--a, var(--b, 1rem)) * 2)', {}, 32],
      ['1rem', { rootFontSize: 10 }, 10],
    ] as const)('resolves %s to px', (length, context, expected) => {
      expect(toPx(length, context)).toBeCloseTo(expected, 6);
    });

    it.each([
      '50%',
      '2',
      'var(--x)',
      'calc(1rem * 1rem)',
      'calc(1rem + 2)',
      'auto',
    ])('refuses %j', (length) => {
      expect(() => toPx(length)).toThrow();
    });
  });

  it('recognises the values that draw no length', () => {
    for (const value of ['', '0', '0px', '0rem', ' 0em ']) {
      expect(isZeroLength(value)).toBe(true);
    }
    for (const value of ['1px', 'var(--andes-space-4)', 'auto', '0.5rem']) {
      expect(isZeroLength(value)).toBe(false);
    }
  });

  describe('expectLength', () => {
    it('compares an authored expectation in resolved pixels', () => {
      expectLength('38px', '2.375rem');
      expectLength('10.5px', '0.75em', { fontSize: 14 });
      expectLength('0', 0);
      expectLength('0px', '0');
      expect(() => expectLength('40px', '2.375rem')).toThrow();
    });

    it('accepts a var() expectation verbatim, as jsdom still reports a var() longhand', () => {
      expectLength('var(--x, 0.875rem)', 'var(--x, 0.875rem)');
      expectLength('14px', 'var(--x, 0.875rem)');
      expect(() =>
        expectLength('var(--y, 0.875rem)', 'var(--x, 0.875rem)'),
      ).toThrow();
    });

    it('fails loudly on an unresolved actual value', () => {
      expect(() => expectLength('2.375rem', '2.375rem')).toThrow(
        /resolved px length/,
      );
    });
  });

  it('compares inherited values with the parent', () => {
    const parent = document.createElement('div');
    parent.style.fontSize = '20px';
    parent.style.lineHeight = '30px';
    const child = document.createElement('span');
    child.style.lineHeight = 'inherit';
    parent.appendChild(child);
    document.body.appendChild(parent);

    try {
      expectInherited(child, ['font-size', 'line-height']);
      child.style.lineHeight = '1px';
      expect(() => expectInherited(child, ['line-height'])).toThrow();
      expect(() => expectInherited(child, ['border-radius'])).toThrow(
        /no computed "border-radius"/,
      );
    } finally {
      parent.remove();
    }
  });

  describe('declaredValue', () => {
    const css = `
      /* :host { border-bottom: 2px dotted red; } */
      :host {
        display: block;
        border-bottom: 1px solid var(--andes-color-border);
      }

      :host(:last-child),
      :host([data-variant='ghost']) {
        border-bottom: none;
      }

      @media (forced-colors: active) {
        :host { border-bottom: 1px solid CanvasText; }
      }

      .a   >   .b { padding: calc((1.5rem - 1em) / 2); }
      .a > .b { padding: 0; }
    `;

    it('returns the declaration of the rule written for the selector', () => {
      expect(declaredValue(css, ':host', 'border-bottom')).toBe(
        '1px solid var(--andes-color-border)',
      );
      expect(
        declaredValue(css, ":host([data-variant='ghost'])", 'border-bottom'),
      ).toBe('none');
      expect(declaredValue(css, ':host', 'display')).toBe('block');
    });

    it('takes the last matching rule and collapses whitespace in the selector', () => {
      expect(declaredValue(css, '.a > .b', 'padding')).toBe('0');
    });

    it('returns undefined when no rule declares the property', () => {
      expect(declaredValue(css, ':host', 'outline')).toBeUndefined();
      expect(declaredValue(css, '.missing', 'display')).toBeUndefined();
    });
  });
});
