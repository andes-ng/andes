import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { AndesColor } from './color';
import {
  clamp,
  compositeOver,
  contrastRatio,
  formatHex,
  formatHsb,
  formatHsl,
  formatOklch,
  formatRgb,
  linearToSrgb,
  oklchToRgb,
  relativeLuminance,
  rgbToOklch,
  srgbToLinear,
  hsbToHsl,
  hsbToRgb,
  hslToHsb,
  hslToRgb,
  parseColor,
  rgbToHsb,
  rgbToHsl,
  roundTo,
  wrapHue,
} from './color-math';

describe('color math', () => {
  describe('helpers', () => {
    it('clamps and rounds', () => {
      expect(clamp(5, 0, 3)).toBe(3);
      expect(clamp(-1, 0, 3)).toBe(0);
      expect(clamp(2, 0, 3)).toBe(2);
      expect(roundTo(1.2345, 2)).toBe(1.23);
      expect(roundTo(1.5)).toBe(2);
    });

    it('folds hues into [0, 360)', () => {
      expect(wrapHue(360)).toBe(0);
      expect(wrapHue(-30)).toBe(330);
      expect(wrapHue(725)).toBe(5);
    });
  });

  describe('conversions', () => {
    it.each([
      [[255, 0, 0], { h: 0, s: 100, b: 100 }],
      [[0, 255, 0], { h: 120, s: 100, b: 100 }],
      [[0, 0, 255], { h: 240, s: 100, b: 100 }],
      [[255, 255, 255], { h: 0, s: 0, b: 100 }],
      [[0, 0, 0], { h: 0, s: 0, b: 0 }],
      [[128, 128, 128], { h: 0, s: 0, b: 50.2 }],
    ])('turns rgb %j into hsb', ([r, g, b], expected) => {
      const hsb = rgbToHsb(r, g, b);
      expect(hsb.h).toBeCloseTo(expected.h, 5);
      expect(hsb.s).toBeCloseTo(expected.s, 5);
      expect(hsb.b).toBeCloseTo(expected.b, 1);
    });

    it('turns hsb back into rgb', () => {
      const rgb = hsbToRgb(215, 91, 100);
      expect(Math.round(rgb.r)).toBe(23);
      expect(Math.round(rgb.g)).toBe(120);
      expect(Math.round(rgb.b)).toBe(255);
    });

    it('converts between hsb and hsl', () => {
      const hsl = hsbToHsl(210, 50, 80);
      expect(hsl.l).toBeCloseTo(60, 5);
      expect(hsl.s).toBeCloseTo(50, 5);
      const hsb = hslToHsb(hsl.h, hsl.s, hsl.l);
      expect(hsb.s).toBeCloseTo(50, 5);
      expect(hsb.b).toBeCloseTo(80, 5);
    });

    it('has no hsl saturation at black and white', () => {
      expect(hsbToHsl(0, 0, 0).s).toBe(0);
      expect(hsbToHsl(0, 0, 100).s).toBe(0);
    });

    it('converts rgb to hsl and back', () => {
      const hsl = rgbToHsl(255, 0, 0);
      expect(hsl).toEqual({ h: 0, s: 100, l: 50 });
      const rgb = hslToRgb(120, 100, 25);
      expect(Math.round(rgb.r)).toBe(0);
      expect(Math.round(rgb.g)).toBe(128);
      expect(Math.round(rgb.b)).toBe(0);
    });

    it('round-trips every 8-bit rgb triple on a coarse grid through hsb and hsl', () => {
      for (let r = 0; r <= 255; r += 17) {
        for (let g = 0; g <= 255; g += 17) {
          for (let b = 0; b <= 255; b += 17) {
            const hsb = rgbToHsb(r, g, b);
            const back = hsbToRgb(hsb.h, hsb.s, hsb.b);
            expect([
              Math.round(back.r),
              Math.round(back.g),
              Math.round(back.b),
            ]).toEqual([r, g, b]);

            const hsl = rgbToHsl(r, g, b);
            const viaHsl = hslToRgb(hsl.h, hsl.s, hsl.l);
            expect([
              Math.round(viaHsl.r),
              Math.round(viaHsl.g),
              Math.round(viaHsl.b),
            ]).toEqual([r, g, b]);
          }
        }
      }
    });
  });

  describe('parseColor', () => {
    it('reads 3, 4, 6 and 8 digit hex', () => {
      expect(parseColor('#f80')).toEqual({ r: 255, g: 136, b: 0, a: 1 });
      expect(parseColor('#f808')).toMatchObject({ r: 255, g: 136, b: 0 });
      expect(parseColor('#f808')?.a).toBeCloseTo(0.533, 3);
      expect(parseColor('#1677ff')).toEqual({ r: 22, g: 119, b: 255, a: 1 });
      expect(parseColor('#1677FF80')).toMatchObject({ r: 22, g: 119, b: 255 });
      expect(parseColor('#1677FF80')?.a).toBeCloseTo(0.502, 3);
    });

    it('rejects malformed hex', () => {
      expect(parseColor('#12')).toBeNull();
      expect(parseColor('#12345')).toBeNull();
      expect(parseColor('#1234567')).toBeNull();
      expect(parseColor('#ggg')).toBeNull();
      expect(parseColor('#')).toBeNull();
    });

    it('reads bare hex only on request', () => {
      expect(parseColor('1677ff')).toBeNull();
      expect(parseColor('1677ff', { bareHex: true })).toEqual({
        r: 22,
        g: 119,
        b: 255,
        a: 1,
      });
    });

    it('reads rgb() and rgba() in comma, space and slash syntax', () => {
      const expected = { r: 22, g: 119, b: 255, a: 1 };
      expect(parseColor('rgb(22, 119, 255)')).toEqual(expected);
      expect(parseColor('rgb(22 119 255)')).toEqual(expected);
      expect(parseColor('RGB( 22,119 , 255 )')).toEqual(expected);
      expect(parseColor('rgba(22, 119, 255, 0.5)')).toEqual({
        ...expected,
        a: 0.5,
      });
      expect(parseColor('rgb(22 119 255 / 50%)')).toEqual({
        ...expected,
        a: 0.5,
      });
    });

    it('reads percentages and clamps out-of-range channels', () => {
      expect(parseColor('rgb(100%, 0%, 50%)')).toEqual({
        r: 255,
        g: 0,
        b: 128,
        a: 1,
      });
      expect(parseColor('rgb(300, -5, 10)')).toEqual({
        r: 255,
        g: 0,
        b: 10,
        a: 1,
      });
      expect(parseColor('rgba(0, 0, 0, 4)')?.a).toBe(1);
    });

    it('reads hsl() and hsla()', () => {
      expect(parseColor('hsl(0, 100%, 50%)')).toMatchObject({
        r: 255,
        g: 0,
        b: 0,
        a: 1,
      });
      expect(parseColor('hsla(120deg 100% 25% / 0.4)')).toMatchObject({
        r: 0,
        g: 128,
        b: 0,
        a: 0.4,
      });
    });

    it('reads hsb(), hsba(), hsv() and keeps the hue of greys', () => {
      expect(parseColor('hsb(215, 91%, 100%)')).toMatchObject({
        r: 23,
        g: 120,
        b: 255,
      });
      expect(parseColor('hsba(215, 91%, 100%, 0.5)')?.a).toBe(0.5);
      expect(parseColor('hsv(120, 0%, 50%)')?.hsb).toEqual({
        h: 120,
        s: 0,
        b: 50,
      });
    });

    it('reads named colours and transparent', () => {
      expect(parseColor('Red')).toEqual({ r: 255, g: 0, b: 0, a: 1 });
      expect(parseColor('teal')).toEqual({ r: 0, g: 128, b: 128, a: 1 });
      expect(parseColor('transparent')).toEqual({ r: 0, g: 0, b: 0, a: 0 });
    });

    it('rejects everything else', () => {
      for (const text of [
        '',
        '   ',
        'not a colour',
        'rgb(1, 2)',
        'rgb(1, 2, 3, 4, 5)',
        'rgb(a, b, c)',
        'rgb(1deg, 2, 3)',
        'hsl(10%, 20%, 30%)',
        'rgba(1, 2, 3, 4deg)',
        'rgb(1, 2, 3',
      ]) {
        expect(parseColor(text)).toBeNull();
      }
    });
  });

  describe('formatters', () => {
    it('formats hex, with alpha only when needed', () => {
      expect(formatHex({ r: 22, g: 119, b: 255, a: 1 })).toBe('#1677ff');
      expect(formatHex({ r: 22, g: 119, b: 255, a: 0.5 })).toBe('#1677ff80');
      expect(formatHex({ r: 22, g: 119, b: 255, a: 0.5 }, false)).toBe(
        '#1677ff',
      );
      expect(formatHex({ r: 0, g: 0, b: 0, a: 1 })).toBe('#000000');
    });

    it('formats rgb, hsl and hsb', () => {
      expect(formatRgb({ r: 22, g: 119, b: 255, a: 1 })).toBe(
        'rgb(22, 119, 255)',
      );
      expect(formatRgb({ r: 22, g: 119, b: 255, a: 0.456 })).toBe(
        'rgba(22, 119, 255, 0.46)',
      );
      expect(formatHsl({ h: 215, s: 100, l: 54, a: 1 })).toBe(
        'hsl(215, 100%, 54%)',
      );
      expect(formatHsl({ h: 215, s: 100, l: 54, a: 0.5 })).toBe(
        'hsla(215, 100%, 54%, 0.5)',
      );
      expect(formatHsb({ h: 215, s: 91, b: 100, a: 1 })).toBe(
        'hsb(215, 91%, 100%)',
      );
      expect(formatHsb({ h: 215, s: 91, b: 100, a: 0.25 })).toBe(
        'hsba(215, 91%, 100%, 0.25)',
      );
    });

    it('round-trips text through parse and format', () => {
      for (const hex of [
        '#000000',
        '#ffffff',
        '#1677ff',
        '#ff4d4f80',
        '#00ff0087',
      ]) {
        const parsed = parseColor(hex);
        expect(parsed && formatHex(parsed)).toBe(hex);
      }
      for (const rgb of [
        'rgb(0, 0, 0)',
        'rgb(22, 119, 255)',
        'rgba(1, 2, 3, 0.5)',
      ]) {
        const parsed = parseColor(rgb);
        expect(parsed && formatRgb(parsed)).toBe(rgb);
      }
    });
  });
});

describe('AndesColor', () => {
  it('parses and exposes the formats', () => {
    const color = AndesColor.parse('#1677ff');
    expect(color?.toHex()).toBe('#1677ff');
    expect(color?.toRgbString()).toBe('rgb(22, 119, 255)');
    expect(color?.toHsbString()).toBe('hsb(215, 91%, 100%)');
    expect(color?.toHslString()).toBe('hsl(215, 100%, 54%)');
    expect(color?.toFormat('hex')).toBe('#1677ff');
    expect(color?.toFormat('rgb')).toBe('rgb(22, 119, 255)');
    expect(color?.toFormat('hsb')).toBe('hsb(215, 91%, 100%)');
  });

  it('returns null for text that is not a colour', () => {
    expect(AndesColor.parse('nope')).toBeNull();
    expect(AndesColor.from(42)).toBeNull();
    expect(AndesColor.from(null)).toBeNull();
    expect(AndesColor.from('nope')).toBeNull();
  });

  it('is permissive about what from() takes', () => {
    const color = AndesColor.fromHsb(10, 20, 30);
    expect(AndesColor.from(color)).toBe(color);
    expect(AndesColor.from('red')?.toHex()).toBe('#ff0000');
  });

  it('keeps alpha out of formats on request', () => {
    const color = AndesColor.parse('#1677ff80');
    expect(color?.alpha).toBeCloseTo(0.5, 2);
    expect(color?.toHex()).toBe('#1677ff80');
    expect(color?.toRgb().a).toBe(0.5);
    expect(color?.toHex(false)).toBe('#1677ff');
    expect(color?.toFormat('rgb', false)).toBe('rgb(22, 119, 255)');
    expect(color?.toRgbString()).toBe('rgba(22, 119, 255, 0.5)');
  });

  it('keeps the hue of a grey when the hint says so', () => {
    const grey = AndesColor.fromRgb(120, 120, 120, 1, 200);
    expect(grey.hue).toBe(200);
    expect(grey.saturation).toBe(0);
    expect(AndesColor.fromRgb(120, 120, 120).hue).toBe(0);
    // A hint never overrides a colour that has a hue of its own.
    expect(AndesColor.fromRgb(255, 0, 0, 1, 200).hue).toBe(0);
  });

  it('preserves the hue through black, which RGB cannot', () => {
    const color = AndesColor.fromHsb(200, 80, 0);
    expect(color.toHex()).toBe('#000000');
    expect(color.hue).toBe(200);
    expect(color.withHsb({ b: 100 }).hue).toBe(200);
  });

  it('clamps out-of-range components', () => {
    const color = AndesColor.fromHsb(725, 140, -10, 3);
    expect(color.hue).toBe(5);
    expect(color.saturation).toBe(100);
    expect(color.brightness).toBe(0);
    expect(color.alpha).toBe(1);
  });

  it('compares by what is visible', () => {
    const a = AndesColor.fromHsb(200, 80, 0);
    const b = AndesColor.fromHsb(10, 0, 0);
    expect(a.equals(b)).toBe(true);
    expect(a.equals(a.withAlpha(0.5))).toBe(false);
    expect(a.equals(null)).toBe(false);
  });

  it('round-trips through every format', () => {
    for (const hex of ['#000000', '#ffffff', '#1677ff', '#52c41a', '#ff4d4f']) {
      const color = AndesColor.parse(hex);
      expect(AndesColor.parse(color?.toRgbString() ?? '')?.toHex()).toBe(hex);
      expect(AndesColor.parse(color?.toHex() ?? '')?.toHex()).toBe(hex);
    }
  });

  it('tells light colours from dark ones', () => {
    expect(AndesColor.parse('#ffffff')?.isLight()).toBe(true);
    expect(AndesColor.parse('#000000')?.isLight()).toBe(false);
    expect(AndesColor.parse('#1677ff')?.isLight()).toBe(false);
    expect(AndesColor.parse('#fadb14')?.isLight()).toBe(true);
    expect(AndesColor.parse('#00000000')?.isLight()).toBe(true);
    expect(AndesColor.parse('transparent')?.isTransparent()).toBe(true);
  });

  it('serialises as hex', () => {
    const color = AndesColor.parse('#1677ff');
    expect(String(color)).toBe('#1677ff');
    expect(JSON.stringify({ color })).toBe('{"color":"#1677ff"}');
  });
});

describe('OKLCH', () => {
  // Reference readings of the sRGB primaries and white in OKLCH, from the published OKLab
  // definition (the values CSS Color 4 tools report): oklch(62.796% 0.25768 29.234) for red.
  it.each([
    ['#ff0000', 0.627955, 0.257683, 29.2339],
    ['#00ff00', 0.86644, 0.294827, 142.4953],
    ['#0000ff', 0.452014, 0.313214, 264.052],
    ['#ffff00', 0.967983, 0.211006, 109.7692],
    ['#ff00ff', 0.701674, 0.322491, 328.3634],
  ])('reads %s as its reference OKLCH', (hex, l, c, h) => {
    const rgb = parseColor(hex);
    const oklch = rgbToOklch(rgb?.r ?? 0, rgb?.g ?? 0, rgb?.b ?? 0);
    expect(oklch.l).toBeCloseTo(l, 4);
    expect(oklch.c).toBeCloseTo(c, 4);
    expect(oklch.h).toBeCloseTo(h, 2);
  });

  it('gives white and black full and no lightness, and greys no chroma', () => {
    expect(rgbToOklch(255, 255, 255).l).toBeCloseTo(1, 6);
    expect(rgbToOklch(255, 255, 255).c).toBe(0);
    expect(rgbToOklch(255, 255, 255).h).toBe(0);
    expect(rgbToOklch(0, 0, 0)).toEqual({ l: 0, c: 0, h: 0 });
    expect(rgbToOklch(128, 128, 128).c).toBe(0);
    // Mid grey: L is the cube root of its linear luminance.
    expect(rgbToOklch(128, 128, 128).l).toBeCloseTo(0.59987, 4);
  });

  it('round-trips every 8-bit rgb triple on a coarse grid', () => {
    const steps = [0, 1, 17, 64, 127, 128, 200, 254, 255];
    for (const r of steps) {
      for (const g of steps) {
        for (const b of steps) {
          const oklch = rgbToOklch(r, g, b);
          const back = oklchToRgb(oklch.l, oklch.c, oklch.h);
          expect(Math.round(back.r)).toBe(r);
          expect(Math.round(back.g)).toBe(g);
          expect(Math.round(back.b)).toBe(b);
          // Not just to the byte: within a thousandth of a channel step (the published
          // matrices are given to ten digits, so the inverse is not exact beyond that).
          expect(back.r).toBeCloseTo(r, 3);
          expect(back.b).toBeCloseTo(b, 3);
        }
      }
    }
  });

  it('clips colours outside sRGB channel by channel', () => {
    const rgb = oklchToRgb(0.7, 0.4, 145);
    for (const channel of [rgb.r, rgb.g, rgb.b]) {
      expect(channel).toBeGreaterThanOrEqual(0);
      expect(channel).toBeLessThanOrEqual(255);
    }
    const white = oklchToRgb(2, 0, 0);
    expect(white.r).toBeCloseTo(255, 9);
    expect(white.g).toBeCloseTo(255, 9);
    expect(white.b).toBeCloseTo(255, 9);
  });

  it('pairs the transfer functions', () => {
    for (const value of [0, 0.002, 0.04, 0.2, 0.5, 1]) {
      expect(linearToSrgb(srgbToLinear(value))).toBeCloseTo(value, 10);
    }
  });

  it('reads oklch() with numbers, percentages, deg and a slash alpha', () => {
    const red = parseColor('oklch(62.796% 0.25768 29.234)');
    expect(red && formatHex(red)).toBe('#ff0000');
    expect(parseColor('oklch(0.62796 0.25768 29.234deg)')).toMatchObject({
      r: 255,
      g: 0,
      b: 0,
    });
    // 100% chroma is 0.4, the CSS reference range.
    expect(parseColor('oklch(45.2% 78.3% 264.05)')).toMatchObject({
      r: 0,
      g: 0,
      b: 255,
    });
    expect(parseColor('OKLCH(100% 0 0 / 50%)')).toMatchObject({
      r: 255,
      g: 255,
      b: 255,
      a: 0.5,
    });
    expect(parseColor('oklch(50% 0 0 / 0.25)')?.a).toBe(0.25);
  });

  it('rejects malformed oklch()', () => {
    for (const text of [
      'oklch(50deg 0.1 20)',
      'oklch(50% 0.1deg 20)',
      'oklch(50% 0.1 20%)',
      'oklch(50% 0.1)',
      'oklch(a b c)',
    ]) {
      expect(parseColor(text)).toBeNull();
    }
  });

  it('formats oklch() to 2 / 4 / 2 decimals, without hue when achromatic', () => {
    expect(
      formatOklch({ l: 0.6279554, c: 0.2576833, h: 29.2338852, a: 1 }),
    ).toBe('oklch(62.8% 0.2577 29.23)');
    expect(formatOklch({ l: 1, c: 0, h: 120, a: 0.5 })).toBe(
      'oklch(100% 0 0 / 0.5)',
    );
    expect(formatOklch({ l: 0.5, c: 0.1, h: 359.999, a: 1 })).toBe(
      'oklch(50% 0.1 0)',
    );
  });

  it('round-trips AndesColor through oklch() text', () => {
    for (const hex of ['#1677ff', '#ff4d4f', '#00b8a9', '#808080', '#fadb14']) {
      const color = AndesColor.parse(hex) as AndesColor;
      const text = color.toOklchString();
      expect(AndesColor.parse(text)?.toHex()).toBe(hex);
      expect(color.toFormat('oklch')).toBe(text);
    }
    expect(AndesColor.parse('#ff0000')?.toOklchString()).toBe(
      'oklch(62.8% 0.2577 29.23)',
    );
    expect(AndesColor.parse('#ff000080')?.toOklchString()).toBe(
      'oklch(62.8% 0.2577 29.23 / 0.5)',
    );
    const fromNumbers = AndesColor.fromOklch(0.627955, 0.257683, 29.2339);
    expect(fromNumbers.toHex()).toBe('#ff0000');
  });
});

describe('HSL format', () => {
  it('reads the space, slash and comma syntaxes', () => {
    expect(parseColor('hsl(210 50% 40% / 0.5)')).toMatchObject({
      r: 51,
      g: 102,
      b: 153,
      a: 0.5,
    });
    expect(parseColor('hsl(210, 50%, 40%)')).toMatchObject({
      r: 51,
      g: 102,
      b: 153,
      a: 1,
    });
    expect(parseColor('hsla(210deg, 50%, 40%, 50%)')?.a).toBe(0.5);
  });

  it('writes hsl() text and edits by HSL channel, keeping the hue of greys', () => {
    const color = AndesColor.parse('hsl(210 50% 40% / 0.5)') as AndesColor;
    expect(color.toFormat('hsl')).toBe('hsla(210, 50%, 40%, 0.5)');
    expect(color.withAlpha(1).toFormat('hsl')).toBe('hsl(210, 50%, 40%)');
    expect(color.withHsl({ l: 60 }).toHslString()).toBe(
      'hsla(210, 50%, 60%, 0.5)',
    );
    const grey = color.withHsl({ s: 0 });
    expect(grey.hue).toBeCloseTo(210, 5);
    expect(grey.withHsl({ s: 50 }).toHslString()).toBe(
      'hsla(210, 50%, 40%, 0.5)',
    );
    expect(color.withHsl({ h: 30 }).toHsl().h).toBe(30);
  });
});

describe('contrast', () => {
  const ratio = (fg: string, bg: string) =>
    (AndesColor.parse(fg) as AndesColor).contrastRatio(
      AndesColor.parse(bg) as AndesColor,
    );

  it('computes WCAG relative luminance', () => {
    expect(relativeLuminance(255, 255, 255)).toBe(1);
    expect(relativeLuminance(0, 0, 0)).toBe(0);
    expect(relativeLuminance(255, 0, 0)).toBeCloseTo(0.2126, 6);
    expect(relativeLuminance(118, 118, 118)).toBeCloseTo(0.18116, 4);
  });

  it('matches the known WCAG examples', () => {
    expect(contrastRatio(1, 0)).toBe(21);
    expect(ratio('#000000', '#ffffff')).toBe(21);
    expect(ratio('#ffffff', '#000000')).toBe(21);
    expect(ratio('#777777', '#777777')).toBe(1);
    // #767676 is the lightest grey that passes AA on white; #777777 just fails.
    expect(ratio('#767676', '#ffffff')).toBeCloseTo(4.54, 2);
    expect(ratio('#767676', '#ffffff')).toBeGreaterThanOrEqual(4.5);
    expect(ratio('#777777', '#ffffff')).toBeLessThan(4.5);
    expect(ratio('#777777', '#ffffff')).toBeCloseTo(4.48, 2);
    expect(ratio('#0000ff', '#ffffff')).toBeCloseTo(8.59, 2);
    expect(ratio('#ff0000', '#ffffff')).toBeCloseTo(4, 2);
  });

  it('composites a translucent colour onto the background first', () => {
    // Half-transparent black on white is seen as #808080 (127.5 grey).
    const seen = compositeOver(
      { r: 0, g: 0, b: 0, a: 0.5 },
      { r: 255, g: 255, b: 255, a: 1 },
    );
    expect(seen).toEqual({ r: 127.5, g: 127.5, b: 127.5, a: 1 });
    const grey = relativeLuminance(127.5, 127.5, 127.5);
    expect(ratio('rgba(0, 0, 0, 0.5)', '#ffffff')).toBeCloseTo(
      contrastRatio(1, grey),
      10,
    );
    // Fully transparent shows only the background: no contrast at all.
    expect(ratio('transparent', '#123456')).toBe(1);
    // A translucent background sits on white.
    expect(ratio('#000000', 'rgba(0, 0, 0, 0)')).toBe(21);
    expect(
      compositeOver({ r: 9, g: 9, b: 9, a: 0 }, { r: 0, g: 0, b: 0, a: 0 }),
    ).toEqual({ r: 0, g: 0, b: 0, a: 0 });
  });
});

describe('parsing source', () => {
  it('never builds a regular expression at run time', () => {
    const folder = dirname(fileURLToPath(import.meta.url));
    const sources = readdirSync(folder).filter(
      (file) => file.endsWith('.ts') && !file.endsWith('.spec.ts'),
    );
    expect(sources.length).toBeGreaterThan(5);
    for (const file of sources) {
      expect(readFileSync(join(folder, file), 'utf-8')).not.toMatch(
        /new RegExp\(/,
      );
    }
  });
});
