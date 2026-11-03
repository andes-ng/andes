import { AndesColor } from './color';
import { AndesGradient } from './gradient';

const hexes = (gradient: AndesGradient | null) =>
  gradient?.stops.map((stop) => [stop.color.toHex(), stop.position]);

describe('AndesGradient', () => {
  describe('parse', () => {
    it('reads an angle and stops with positions', () => {
      const gradient = AndesGradient.parse(
        'linear-gradient(45deg, #ff0000 10%, #0000ff 90%)',
      );
      expect(gradient?.angle).toBe(45);
      expect(hexes(gradient)).toEqual([
        ['#ff0000', 10],
        ['#0000ff', 90],
      ]);
    });

    it('reads every angle unit and folds the angle into [0, 360)', () => {
      const angle = (text: string) =>
        AndesGradient.parse(`linear-gradient(${text}, red, blue)`)?.angle;
      expect(angle('0')).toBe(0);
      expect(angle('100grad')).toBeCloseTo(90, 10);
      expect(angle('0.25turn')).toBe(90);
      expect(angle(`${Math.PI}rad`)).toBeCloseTo(180, 10);
      expect(angle('-90deg')).toBe(270);
      expect(angle('450deg')).toBe(90);
    });

    it('reads the to-side keywords and defaults to top-to-bottom', () => {
      const angle = (text: string) =>
        AndesGradient.parse(`linear-gradient(${text}red, blue)`)?.angle;
      expect(angle('to top, ')).toBe(0);
      expect(angle('to right, ')).toBe(90);
      expect(angle('to bottom, ')).toBe(180);
      expect(angle('to left, ')).toBe(270);
      expect(angle('to  top   right, ')).toBe(45);
      expect(angle('to left bottom, ')).toBe(225);
      expect(angle('')).toBe(180);
    });

    it('spreads missing positions the way CSS does', () => {
      expect(
        hexes(AndesGradient.parse('linear-gradient(red, lime, blue)')),
      ).toEqual([
        ['#ff0000', 0],
        ['#00ff00', 50],
        ['#0000ff', 100],
      ]);
      expect(
        hexes(
          AndesGradient.parse(
            'linear-gradient(90deg, red 20%, lime, yellow, blue 80%)',
          ),
        ),
      ).toEqual([
        ['#ff0000', 20],
        ['#00ff00', 40],
        ['#ffff00', 60],
        ['#0000ff', 80],
      ]);
      // A stop before an earlier one moves up to it.
      expect(
        hexes(AndesGradient.parse('linear-gradient(red 60%, blue 30%)')),
      ).toEqual([
        ['#ff0000', 60],
        ['#0000ff', 60],
      ]);
    });

    it('reads two positions on one stop and colours with spaces and commas', () => {
      const gradient = AndesGradient.parse(
        'LINEAR-GRADIENT(90deg, rgb(255, 0, 0) 0% 25%, rgb(0 0 255 / 50%) 100%)',
      );
      expect(gradient?.stops.map((stop) => stop.position)).toEqual([
        0, 25, 100,
      ]);
      expect(gradient?.stops[2].color.toHex()).toBe('#0000ff80');
      expect(
        AndesGradient.parse(
          'linear-gradient(oklch(62.8% 0.2577 29.23), hsl(240 100% 50%) 100%)',
        )?.stops.map((stop) => stop.color.toHex()),
      ).toEqual(['#ff0000', '#0000ff']);
    });

    it('rejects what it cannot represent', () => {
      for (const text of [
        'radial-gradient(red, blue)',
        'repeating-linear-gradient(red, blue)',
        'linear-gradient(red)',
        'linear-gradient(red 10px, blue)',
        'linear-gradient(90deg, red, nope)',
        'linear-gradient(90deg, red, , blue)',
        'linear-gradient(90deg, red, blue',
        'red',
        '',
      ]) {
        expect(AndesGradient.parse(text)).toBeNull();
      }
    });
  });

  describe('from', () => {
    it('takes a gradient, text or a value object', () => {
      const gradient = AndesGradient.parse(
        'linear-gradient(red, blue)',
      ) as AndesGradient;
      expect(AndesGradient.from(gradient)).toBe(gradient);
      expect(AndesGradient.from('linear-gradient(red, blue)')?.angle).toBe(180);
      const fromValue = AndesGradient.from({
        angle: 30,
        stops: [
          { color: '#0000ff', position: 100 },
          { color: AndesColor.parse('#ff0000') as AndesColor, position: 0 },
        ],
      });
      expect(fromValue?.angle).toBe(30);
      // Sorted by position.
      expect(hexes(fromValue)).toEqual([
        ['#ff0000', 0],
        ['#0000ff', 100],
      ]);
    });

    it('skips unreadable stops, spreads a single one and refuses none', () => {
      expect(
        hexes(
          AndesGradient.from({
            angle: Number.NaN,
            stops: [
              { color: 'not a colour', position: 10 },
              { color: '#00ff00', position: 40 },
              { color: '#000000', position: Number.NaN },
            ],
          }),
        ),
      ).toEqual([
        ['#00ff00', 0],
        ['#00ff00', 100],
      ]);
      expect(AndesGradient.from({ angle: 0, stops: [] })).toBeNull();
      expect(AndesGradient.from({ angle: 0 })).toBeNull();
      expect(AndesGradient.from(42)).toBeNull();
      expect(AndesGradient.from(null)).toBeNull();
      expect(AndesGradient.create(Number.NaN, [])).toBeNull();
    });

    it('turns one colour into a flat left-to-right gradient', () => {
      const flat = AndesGradient.fromColor(
        AndesColor.parse('#123456') as AndesColor,
      );
      expect(flat.angle).toBe(90);
      expect(flat.toCss()).toBe(
        'linear-gradient(90deg, #123456 0%, #123456 100%)',
      );
    });
  });

  describe('interpolation', () => {
    const gradient = AndesGradient.parse(
      'linear-gradient(90deg, #ff0000 0%, #0000ff 100%)',
    ) as AndesGradient;

    it('mixes neighbouring stops linearly in sRGB', () => {
      expect(gradient.colorAt(50).toHex()).toBe('#800080');
      expect(gradient.colorAt(25).toHex()).toBe('#bf0040');
      expect(gradient.colorAt(0).toHex()).toBe('#ff0000');
      expect(gradient.colorAt(100).toHex()).toBe('#0000ff');
      expect(gradient.colorAt(-5).toHex()).toBe('#ff0000');
      expect(gradient.colorAt(120).toHex()).toBe('#0000ff');
    });

    it('premultiplies alpha, as browsers paint gradients', () => {
      const fade = AndesGradient.parse(
        'linear-gradient(#ff0000, transparent)',
      ) as AndesGradient;
      // Not the muddy rgba(128, 0, 0, 0.5) of a straight mix.
      expect(fade.colorAt(50).toRgbString()).toBe('rgba(255, 0, 0, 0.5)');
      const clear = AndesGradient.parse(
        'linear-gradient(transparent, transparent)',
      ) as AndesGradient;
      expect(clear.colorAt(50).alpha).toBe(0);
    });

    it('holds the colour of the nearest stop outside the stops', () => {
      const inner = AndesGradient.parse(
        'linear-gradient(red 20%, lime 50%, blue 80%)',
      ) as AndesGradient;
      expect(inner.colorAt(10).toHex()).toBe('#ff0000');
      expect(inner.colorAt(65).toHex()).toBe('#008080');
      expect(inner.colorAt(90).toHex()).toBe('#0000ff');
    });
  });

  describe('output', () => {
    const gradient = AndesGradient.parse(
      'linear-gradient(33.333deg, #ff000080 0%, #0000ff 33.3333%)',
    ) as AndesGradient;

    it('writes CSS in any format, hsb falling back to hex', () => {
      expect(gradient.toCss()).toBe(
        'linear-gradient(33.33deg, #ff000080 0%, #0000ff 33.33%)',
      );
      expect(gradient.toCss('rgb')).toBe(
        'linear-gradient(33.33deg, rgba(255, 0, 0, 0.5) 0%, rgb(0, 0, 255) 33.33%)',
      );
      expect(gradient.toCss('hsl')).toBe(
        'linear-gradient(33.33deg, hsla(0, 100%, 50%, 0.5) 0%, hsl(240, 100%, 50%) 33.33%)',
      );
      expect(gradient.toCss('hsb')).toBe(gradient.toCss('hex'));
      expect(gradient.toCss('hex', false)).toBe(
        'linear-gradient(33.33deg, #ff0000 0%, #0000ff 33.33%)',
      );
      expect(String(gradient)).toBe(gradient.toCss());
    });

    it('round-trips through its own CSS and serialises as data', () => {
      expect(AndesGradient.parse(gradient.toCss('oklch'))?.toCss()).toBe(
        gradient.toCss(),
      );
      expect(JSON.parse(JSON.stringify(gradient))).toEqual({
        angle: 33.33,
        stops: [
          { color: '#ff000080', position: 0 },
          { color: '#0000ff', position: 33.33 },
        ],
      });
      expect(gradient.toValue('rgb').stops[1].color).toBe('rgb(0, 0, 255)');
    });

    it('compares by what is visible, and copies with another angle or opaque', () => {
      const same = AndesGradient.parse(
        'linear-gradient(33.33deg, rgba(255, 0, 0, 0.5), blue 33.33%)',
      );
      expect(gradient.equals(same)).toBe(true);
      expect(gradient.equals(gradient.withAngle(90))).toBe(false);
      expect(gradient.equals(null)).toBe(false);
      expect(
        gradient.equals(
          AndesGradient.parse('linear-gradient(red, blue, lime)'),
        ),
      ).toBe(false);
      expect(gradient.withAngle(90).angle).toBe(90);
      expect(gradient.opaque().stops[0].color.toHex()).toBe('#ff0000');
    });
  });
});
