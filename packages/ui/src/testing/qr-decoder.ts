import {
  qrAlignmentPositions,
  qrBlockLayout,
  qrReedSolomonRemainder,
  type QrErrorLevel,
} from '../lib/qr-code/qr-encoder';

/*
 * A small QR reader for tests: it takes the module grid of an error-free symbol and reads the
 * text back out, the way a scanner would after sampling the image. It shares no drawing code
 * with the encoder: the format bits, the zigzag read order, the masks and the segment headers
 * are decoded here from the specification, and the error correction codewords are checked
 * against a fresh Reed-Solomon pass. It does not correct errors. Internal to the specs:
 * excluded from the library build in `tsconfig.lib.json`.
 */

export interface DecodedQr {
  readonly version: number;
  readonly errorLevel: QrErrorLevel;
  readonly mask: number;
  readonly text: string;
  /** The modes of the segments, in order. */
  readonly modes: readonly ('numeric' | 'alphanumeric' | 'byte')[];
  /** `true` when every block's correction codewords match its data. */
  readonly eccValid: boolean;
}

const LEVEL_FROM_BITS: Record<number, QrErrorLevel> = {
  1: 'L',
  0: 'M',
  3: 'Q',
  2: 'H',
};

const ALPHANUMERIC = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:';

const MASKS: ((x: number, y: number) => boolean)[] = [
  (x, y) => (x + y) % 2 === 0,
  (_x, y) => y % 2 === 0,
  (x) => x % 3 === 0,
  (x, y) => (x + y) % 3 === 0,
  (x, y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0,
  (x, y) => ((x * y) % 2) + ((x * y) % 3) === 0,
  (x, y) => (((x * y) % 2) + ((x * y) % 3)) % 2 === 0,
  (x, y) => (((x + y) % 2) + ((x * y) % 3)) % 2 === 0,
];

function functionMap(version: number): boolean[][] {
  const size = version * 4 + 17;
  const map = Array.from({ length: size }, () =>
    new Array<boolean>(size).fill(false),
  );
  const mark = (x0: number, y0: number, w: number, h: number) => {
    for (let y = y0; y < y0 + h; y++) {
      for (let x = x0; x < x0 + w; x++) {
        map[y][x] = true;
      }
    }
  };
  // Finders with their separators, and the format information beside them.
  mark(0, 0, 9, 9);
  mark(size - 8, 0, 8, 9);
  mark(0, size - 8, 9, 8);
  // Timing patterns.
  mark(6, 0, 1, size);
  mark(0, 6, size, 1);
  // Alignment patterns, except the three that would sit on a finder.
  const centres = qrAlignmentPositions(version);
  centres.forEach((cy, row) => {
    centres.forEach((cx, column) => {
      const last = centres.length - 1;
      const onFinder =
        (row === 0 && column === 0) ||
        (row === 0 && column === last) ||
        (row === last && column === 0);
      if (!onFinder) {
        mark(cx - 2, cy - 2, 5, 5);
      }
    });
  });
  // Version information blocks.
  if (version >= 7) {
    mark(size - 11, 0, 3, 6);
    mark(0, size - 11, 6, 3);
  }
  return map;
}

class BitReader {
  private position = 0;

  constructor(private readonly bytes: readonly number[]) {}

  get remaining(): number {
    return this.bytes.length * 8 - this.position;
  }

  /** The next `count` bits without consuming them. */
  peek(count: number): number {
    const saved = this.position;
    const value = this.read(count);
    this.position = saved;
    return value;
  }

  read(count: number): number {
    let value = 0;
    for (let i = 0; i < count; i++) {
      const byte = this.bytes[this.position >>> 3];
      value = (value << 1) | ((byte >>> (7 - (this.position & 7))) & 1);
      this.position++;
    }
    return value;
  }
}

/**
 * Reads the text back from a module grid (`modules[y][x]`, dark = `true`, no quiet zone).
 *
 * @throws when the grid is not a well-formed symbol.
 */
export function decodeQrModules(
  modules: readonly (readonly boolean[])[],
): DecodedQr {
  const size = modules.length;
  if (size < 21 || (size - 17) % 4 !== 0) {
    throw new Error('The grid is not a QR symbol size.');
  }
  const version = (size - 17) / 4;
  const at = (x: number, y: number) => (modules[y][x] ? 1 : 0);

  // Format information, first copy (around the top-left finder).
  let format = 0;
  for (let i = 0; i <= 5; i++) {
    format |= at(8, i) << i;
  }
  format |= at(8, 7) << 6;
  format |= at(8, 8) << 7;
  format |= at(7, 8) << 8;
  for (let i = 9; i < 15; i++) {
    format |= at(14 - i, 8) << i;
  }
  // The second copy must agree, or the symbol is damaged.
  let second = 0;
  for (let i = 0; i < 8; i++) {
    second |= at(size - 1 - i, 8) << i;
  }
  for (let i = 8; i < 15; i++) {
    second |= at(8, size - 15 + i) << i;
  }
  if (format !== second) {
    throw new Error('The two copies of the format information differ.');
  }
  const data = (format ^ 0x5412) >>> 10;
  const errorLevel = LEVEL_FROM_BITS[data >>> 3];
  const mask = data & 7;

  // Codeword bits in the zigzag order of the specification.
  const isFunction = functionMap(version);
  const bits: number[] = [];
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) {
      right = 5;
    }
    for (let step = 0; step < size; step++) {
      for (let k = 0; k < 2; k++) {
        const x = right - k;
        const upward = ((right + 1) & 2) === 0;
        const y = upward ? size - 1 - step : step;
        if (!isFunction[y][x]) {
          bits.push(at(x, y) ^ (MASKS[mask](x, y) ? 1 : 0));
        }
      }
    }
  }
  const layout = qrBlockLayout(version, errorLevel);
  const codewords: number[] = [];
  for (
    let i = 0;
    i + 8 <= bits.length && codewords.length < layout.rawCodewords;
    i += 8
  ) {
    let byte = 0;
    for (let j = 0; j < 8; j++) {
      byte = (byte << 1) | bits[i + j];
    }
    codewords.push(byte);
  }

  // Undo the interleaving.
  const blocks: number[][] = Array.from(
    { length: layout.blockCount },
    () => [],
  );
  const dataLength = (block: number) =>
    layout.shortBlockLength -
    layout.eccPerBlock +
    (block < layout.shortBlocks ? 0 : 1);
  let cursor = 0;
  for (
    let column = 0;
    column < layout.shortBlockLength - layout.eccPerBlock + 1;
    column++
  ) {
    for (let block = 0; block < layout.blockCount; block++) {
      if (column < dataLength(block)) {
        blocks[block].push(codewords[cursor++]);
      }
    }
  }
  const dataWords: number[] = [];
  let eccValid = true;
  const eccStart = cursor;
  const ecc: number[][] = blocks.map(() => []);
  for (let column = 0; column < layout.eccPerBlock; column++) {
    for (let block = 0; block < layout.blockCount; block++) {
      ecc[block].push(codewords[eccStart + column * layout.blockCount + block]);
    }
  }
  blocks.forEach((block, index) => {
    const expected = qrReedSolomonRemainder(block, layout.eccPerBlock);
    if (expected.join() !== ecc[index].join()) {
      eccValid = false;
    }
    dataWords.push(...block);
  });

  // Segments.
  const reader = new BitReader(dataWords);
  const tier = version <= 9 ? 0 : version <= 26 ? 1 : 2;
  const countBits = {
    numeric: [10, 12, 14][tier],
    alphanumeric: [9, 11, 13][tier],
    byte: [8, 16, 16][tier],
  };
  let text = '';
  const modes: DecodedQr['modes'][number][] = [];
  let pendingBytes: number[] = [];
  const flushBytes = () => {
    if (pendingBytes.length) {
      text += new TextDecoder().decode(new Uint8Array(pendingBytes));
      pendingBytes = [];
    }
  };
  while (reader.remaining >= 4) {
    const indicator = reader.read(4);
    if (indicator === 0) {
      break;
    }
    if (indicator === 1) {
      modes.push('numeric');
      flushBytes();
      let count = reader.read(countBits.numeric);
      while (count >= 3) {
        text += String(reader.read(10)).padStart(3, '0');
        count -= 3;
      }
      if (count === 2) {
        text += String(reader.read(7)).padStart(2, '0');
      } else if (count === 1) {
        text += String(reader.read(4));
      }
    } else if (indicator === 2) {
      modes.push('alphanumeric');
      flushBytes();
      let count = reader.read(countBits.alphanumeric);
      while (count >= 2) {
        const pair = reader.read(11);
        text += ALPHANUMERIC[Math.floor(pair / 45)] + ALPHANUMERIC[pair % 45];
        count -= 2;
      }
      if (count === 1) {
        text += ALPHANUMERIC[reader.read(6)];
      }
    } else if (indicator === 4) {
      modes.push('byte');
      const count = reader.read(countBits.byte);
      for (let i = 0; i < count; i++) {
        pendingBytes.push(reader.read(8));
      }
      // Consecutive byte segments are decoded together: a character may straddle them.
      if (reader.remaining < 4 || reader.peek(4) !== 4) {
        flushBytes();
      }
    } else {
      throw new Error(`Unsupported mode indicator ${indicator}.`);
    }
  }
  flushBytes();
  return { version, errorLevel, mask, text, modes, eccValid };
}
