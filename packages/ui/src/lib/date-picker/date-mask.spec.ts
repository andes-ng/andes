import { DateMask } from './date-mask';

function mask(pattern: string): DateMask {
  const created = DateMask.from(pattern);
  if (!created) {
    throw new Error(`No mask for ${pattern}`);
  }
  return created;
}

describe('DateMask', () => {
  it('lays a pattern out as cells between its literals', () => {
    const date = mask('YYYY-MM-DD HH:mm');
    expect(date.template).toBe('YYYY-MM-DD HH:mm');
    expect(date.cells.map(({ token, start, end }) => [token, start, end])).toEqual([
      ['YYYY', 0, 4],
      ['MM', 5, 7],
      ['DD', 8, 10],
      ['HH', 11, 13],
      ['mm', 14, 16],
    ]);
  });

  it('keeps bracketed literal text out of the cells', () => {
    expect(mask('YYYY-[Q]Q').template).toBe('YYYY-QQ');
    expect(mask('YYYY-[Q]Q').cells.map((cell) => cell.start)).toEqual([0, 6]);
  });

  it('refuses a pattern with a token it cannot type', () => {
    expect(DateMask.from('DD MMM YYYY')).toBeNull();
    expect(DateMask.from('h:mm A')).toBeNull();
    expect(DateMask.from('[today]')).toBeNull();
  });

  it('finds the cell at a caret, or the next one', () => {
    const date = mask('DD/MM/YYYY');
    expect(date.cellAt(0)).toBe(0);
    expect(date.cellAt(2)).toBe(0);
    expect(date.cellAt(3)).toBe(1);
    expect(date.cellAt(99)).toBe(2);
  });

  describe('fill', () => {
    const date = mask('DD/MM/YYYY');

    it('pads what is typed so far and moves on once the cell is full', () => {
      expect(date.fill(date.template, 0, '1')).toEqual({
        text: '01/MM/YYYY',
        done: false,
      });
      expect(date.fill('01/MM/YYYY', 0, '15')).toEqual({
        text: '15/MM/YYYY',
        done: true,
      });
    });

    it('moves on early when no second digit fits', () => {
      expect(date.fill('15/MM/YYYY', 1, '4')).toEqual({
        text: '15/04/YYYY',
        done: true,
      });
    });

    it('clamps a full cell into its range', () => {
      expect(date.fill('15/MM/YYYY', 1, '19').text).toBe('15/12/YYYY');
      expect(date.fill('00/MM/YYYY', 0, '00').text).toBe('01/MM/YYYY');
    });
  });

  describe('step', () => {
    const time = mask('HH:mm');
    const seed = new Date(2024, 1, 15, 9, 41);

    it('starts an empty cell from the seed date', () => {
      expect(time.step(time.template, 1, 1, seed)).toBe('HH:41');
    });

    it('wraps round at either end', () => {
      expect(time.step('23:59', 0, 1, seed)).toBe('00:59');
      expect(time.step('00:00', 1, -1, seed)).toBe('00:59');
    });

    it('moves a year without wrapping', () => {
      const year = mask('YYYY');
      expect(year.step('2024', 0, 1, seed)).toBe('2025');
      expect(year.step('0000', 0, -1, seed)).toBe('0000');
    });
  });

  it('tells a complete, an empty and a misshapen text apart', () => {
    const date = mask('DD/MM/YYYY');
    expect(date.isComplete('15/02/2024')).toBe(true);
    expect(date.isComplete('15/MM/2024')).toBe(false);
    expect(date.isEmpty(date.clear(date.clear('15/MM/YYYY', 0), 1))).toBe(true);
    expect(date.fits('15/02/2024')).toBe(true);
    expect(date.fits('15-02-2024')).toBe(false);
    expect(date.fits('15/02/24')).toBe(false);
  });
});
