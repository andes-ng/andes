import { patternParts } from '../calendar/date-format';

/** One number of a mask: where it sits in the text and which values it takes. */
export interface DateMaskCell {
  /** The pattern token (`YYYY`, `MM`, ...), also the cell's text while it is empty. */
  readonly token: string;
  readonly start: number;
  readonly end: number;
  readonly min: number;
  readonly max: number;
}

/** The tokens a mask can hold: fixed-width numbers, with the values each one takes. */
const CELL_RANGES: Readonly<Record<string, readonly [number, number]>> = {
  YYYY: [0, 9999],
  BBBB: [0, 9999],
  YY: [0, 99],
  BB: [0, 99],
  Q: [1, 4],
  MM: [1, 12],
  DD: [1, 31],
  ww: [1, 53],
  HH: [0, 23],
  hh: [1, 12],
  mm: [0, 59],
  ss: [0, 59],
};

/** Which date field a cell reads, for stepping an empty cell from a known date. */
function fieldOf(date: Date, token: string): number {
  switch (token) {
    case 'YYYY':
      return date.getFullYear();
    case 'BBBB':
      return date.getFullYear() + 543;
    case 'YY':
      return date.getFullYear() % 100;
    case 'BB':
      return (date.getFullYear() + 543) % 100;
    case 'Q':
      return Math.floor(date.getMonth() / 3) + 1;
    case 'MM':
      return date.getMonth() + 1;
    case 'DD':
      return date.getDate();
    case 'HH':
      return date.getHours();
    case 'hh':
      return date.getHours() % 12 || 12;
    case 'mm':
      return date.getMinutes();
    case 'ss':
      return date.getSeconds();
    default:
      return 1;
  }
}

const DIGITS = '0123456789';

function isDigits(text: string): boolean {
  return (
    text.length > 0 && Array.from(text).every((char) => DIGITS.includes(char))
  );
}

/**
 * A token pattern as a fixed-width mask: the empty mask is the pattern's own shape
 * (`YYYY-MM-DD`), and each number token is a cell typed into on its own. Every operation
 * takes the input's text and returns the next one; the text never changes length, so a
 * cell's position never moves.
 */
export class DateMask {
  private constructor(
    /** The token pattern the mask types, for formatting and parsing. */
    readonly pattern: string,
    /** The empty mask: literals as they are, each cell as its token. */
    readonly template: string,
    readonly cells: readonly DateMaskCell[],
  ) {}

  /** The mask of `pattern`, or `null` when it holds a token a mask cannot type. */
  static from(pattern: string): DateMask | null {
    const cells: DateMaskCell[] = [];
    let template = '';
    for (const part of patternParts(pattern)) {
      if (part.kind === 'literal') {
        template += part.text;
        continue;
      }
      const range = CELL_RANGES[part.token];
      if (!range) {
        return null;
      }
      cells.push({
        token: part.token,
        start: template.length,
        end: template.length + part.token.length,
        min: range[0],
        max: range[1],
      });
      template += part.token;
    }
    return cells.length ? new DateMask(pattern, template, cells) : null;
  }

  /** The cell holding `caret`, or the nearest one after it (the last at the end). */
  cellAt(caret: number): number {
    const index = this.cells.findIndex((cell) => caret <= cell.end);
    return index < 0 ? this.cells.length - 1 : index;
  }

  /** Whether `text` is in the mask's shape: same length, literals in place. */
  fits(text: string): boolean {
    if (text.length !== this.template.length) {
      return false;
    }
    let at = 0;
    for (const cell of this.cells) {
      if (text.slice(at, cell.start) !== this.template.slice(at, cell.start)) {
        return false;
      }
      at = cell.end;
    }
    return text.slice(at) === this.template.slice(at);
  }

  /** Whether every cell holds a number. */
  isComplete(text: string): boolean {
    return this.cells.every((cell) =>
      isDigits(text.slice(cell.start, cell.end)),
    );
  }

  /** Whether every cell is empty (shows its token). */
  isEmpty(text: string): boolean {
    return this.cells.every(
      (cell) => text.slice(cell.start, cell.end) === cell.token,
    );
  }

  /**
   * Types `typed` (the digits typed into the cell so far) into cell `index`, zero-padded.
   * Returns the text and whether the cell is done, which happens when it is full or when
   * no further digit could keep it in range (a 2 typed into a month).
   */
  fill(
    text: string,
    index: number,
    typed: string,
  ): { readonly text: string; readonly done: boolean } {
    const cell = this.cells[index];
    const width = cell.end - cell.start;
    let value = Number(typed);
    const full = typed.length >= width;
    const done = full || value * 10 > cell.max;
    if (done) {
      value = Math.min(Math.max(value, cell.min), cell.max);
    }
    return {
      text: this.write(text, index, value),
      done,
    };
  }

  /** Moves cell `index` by `delta`, from its number or, when it is empty, from `seed`. */
  step(text: string, index: number, delta: number, seed: Date): string {
    const cell = this.cells[index];
    const current = text.slice(cell.start, cell.end);
    if (!isDigits(current)) {
      return this.write(text, index, fieldOf(seed, cell.token));
    }
    const span = cell.max - cell.min + 1;
    // Wrap round (23 to 00); a year has no end to wrap round, and only moves.
    const next =
      span > 1000
        ? Math.min(Math.max(Number(current) + delta, cell.min), cell.max)
        : ((((Number(current) + delta - cell.min) % span) + span) % span) +
          cell.min;
    return this.write(text, index, next);
  }

  /** Empties cell `index`, back to its token. */
  clear(text: string, index: number): string {
    const cell = this.cells[index];
    return text.slice(0, cell.start) + cell.token + text.slice(cell.end);
  }

  private write(text: string, index: number, value: number): string {
    const cell = this.cells[index];
    const digits = String(value).padStart(cell.end - cell.start, '0');
    return text.slice(0, cell.start) + digits + text.slice(cell.end);
  }
}
