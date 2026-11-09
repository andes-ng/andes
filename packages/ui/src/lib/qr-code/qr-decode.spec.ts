import { decodeQrModules } from '../../testing/qr-decoder';
import {
  encodeQr,
  encodeQrSegments,
  makeQrSegmentList,
  QR_ERROR_LEVELS,
  type QrErrorLevel,
} from './qr-encoder';
import {
  buildQrLayout,
  type QrFinderShape,
  type QrModuleShape,
} from './qr-render';

/*
 * Scannability: a symbol is only worth drawing if a reader gets the text back. The reader here
 * (`testing/qr-decoder.ts`) is written from the specification and shares no drawing code with
 * the encoder, so a round trip through it checks the format bits, the masks, the module order,
 * the block interleaving, the segment headers and the Reed-Solomon codewords at once.
 */

const SAMPLES: Record<string, string> = {
  numeric: '0123456789012345678901234567890123456789',
  alphanumeric: 'HTTPS://ANDES.EXAMPLE/PAY/42 TOTAL: $12.50',
  url: 'https://andes.example/pay/42?ref=abc&lang=es',
  unicode: 'Café ñandú - 日本語 - €12,50 - 🎟️',
  wifi: 'WIFI:T:WPA;S:Andes Guest;P:correct horse battery;H:false;;',
  vcard:
    'BEGIN:VCARD\nVERSION:3.0\nN:Lovelace;Ada\nFN:Ada Lovelace\nTEL:+51987654321\nEMAIL:ada@example.com\nEND:VCARD',
  mailto: 'mailto:hello@example.com?subject=Hello&body=Hi%20there',
  geo: 'geo:-12.0464,-77.0428',
  sms: 'SMSTO:+51987654321:Hello',
  single: 'A',
};

/** The grid a reader would sample from the path data of a rendered layout. */
function gridFromPath(
  path: string,
  size: number,
  quietZone: number,
  shape: QrModuleShape,
): boolean[][] {
  const grid = Array.from({ length: size }, () =>
    new Array<boolean>(size).fill(false),
  );
  const mark = (x: number, y: number) => {
    const column = Math.floor(x - quietZone + 1e-6);
    const row = Math.floor(y - quietZone + 1e-6);
    if (grid[row]?.[column] !== undefined) {
      grid[row][column] = true;
    }
  };
  if (shape === 'square') {
    for (const match of path.matchAll(/M(\d+) (\d+)h(\d+)v1h-\d+z/g)) {
      const [x, y, length] = [match[1], match[2], match[3]].map(Number);
      for (let i = 0; i < length; i++) {
        mark(x + i, y);
      }
    }
  } else {
    // A dot starts at its left-middle point, a rounded square after its top-left corner.
    const start =
      shape === 'dots' ? /M([\d.]+) ([\d.]+)a/g : /M([\d.]+) ([\d.]+)h[\d.]+a/g;
    for (const match of path.matchAll(start)) {
      const x = Number(match[1]) - (shape === 'dots' ? 0.05 : 0.3);
      const y = Number(match[2]) - (shape === 'dots' ? 0.5 : 0);
      mark(x, y);
    }
  }
  return grid;
}

/** Puts the three standard corner patterns back (they are a separate path when styled). */
function withFinders(grid: boolean[][]): boolean[][] {
  const size = grid.length;
  for (const [fx, fy] of [
    [0, 0],
    [size - 7, 0],
    [0, size - 7],
  ]) {
    for (let y = 0; y < 7; y++) {
      for (let x = 0; x < 7; x++) {
        const ring = x === 0 || x === 6 || y === 0 || y === 6;
        const eye = x >= 2 && x <= 4 && y >= 2 && y <= 4;
        grid[fy + y][fx + x] = ring || eye;
      }
    }
  }
  return grid;
}

describe('QR round trip through an independent reader', () => {
  describe.each(Object.entries(SAMPLES))('%s', (_name, text) => {
    it.each(QR_ERROR_LEVELS)(
      'reads back at level %s',
      (level: QrErrorLevel) => {
        const matrix = encodeQr(text, {
          errorLevel: level,
          boostErrorLevel: false,
        });
        const decoded = decodeQrModules(matrix.modules);

        expect(decoded.text).toBe(text);
        expect(decoded.errorLevel).toBe(level);
        expect(decoded.version).toBe(matrix.version);
        expect(decoded.mask).toBe(matrix.mask);
        expect(decoded.eccValid).toBe(true);
      },
    );
  });

  it.each([0, 1, 2, 3, 4, 5, 6, 7])(
    'reads back with mask %i forced',
    (mask) => {
      const matrix = encodeQr(SAMPLES['url'], { mask });
      const decoded = decodeQrModules(matrix.modules);

      expect(decoded.mask).toBe(mask);
      expect(decoded.text).toBe(SAMPLES['url']);
      expect(decoded.eccValid).toBe(true);
    },
  );

  it.each([1, 2, 6, 7, 10, 14, 21, 27, 33, 40])(
    'reads back at version %i',
    (version) => {
      // Enough text to need the version, then pinned to it.
      const text = 'andes-ng '.repeat(version * 2).slice(0, version * 14 + 1);
      const matrix = encodeQr(text, {
        errorLevel: 'L',
        minVersion: version,
        maxVersion: version,
      });
      const decoded = decodeQrModules(matrix.modules);

      expect(matrix.version).toBe(version);
      expect(decoded.version).toBe(version);
      expect(decoded.text).toBe(text);
      expect(decoded.eccValid).toBe(true);
    },
  );

  it('reads back the largest payload a version 40 symbol holds', () => {
    const text = 'x'.repeat(2953);
    const decoded = decodeQrModules(
      encodeQr(text, { errorLevel: 'L', boostErrorLevel: false }).modules,
    );

    expect(decoded.version).toBe(40);
    expect(decoded.text).toBe(text);
    expect(decoded.eccValid).toBe(true);
  });

  it('reads back a multi-segment value, one mode per part', () => {
    const matrix = encodeQrSegments(
      makeQrSegmentList([
        'https://andes.example/t/',
        '0123456789012345678',
        { mode: 'alphanumeric', text: 'TICKET-7' },
      ]),
    );
    const decoded = decodeQrModules(matrix.modules);

    expect(decoded.modes).toEqual(['byte', 'numeric', 'alphanumeric']);
    expect(decoded.text).toBe(
      'https://andes.example/t/0123456789012345678TICKET-7',
    );
    expect(decoded.eccValid).toBe(true);
  });

  it('is smaller in segments than as one byte string', () => {
    const parts = ['id=', '0123456789012345678901234567890123456789'];
    const joined = encodeQr(parts.join(''));
    const split = encodeQrSegments(makeQrSegmentList(parts));

    expect(split.version).toBeLessThanOrEqual(joined.version);
    expect(decodeQrModules(split.modules).text).toBe(parts.join(''));
  });

  it('rejects a grid whose two format copies disagree', () => {
    const matrix = encodeQr('damaged');
    const modules = matrix.modules.map((row) => [...row]);
    modules[8][0] = !modules[8][0];

    expect(() => decodeQrModules(modules)).toThrow('format');
  });

  it('notices a flipped module near the end of the read order through the correction codewords', () => {
    const matrix = encodeQr('https://andes.example/pay/42');
    const modules = matrix.modules.map((row) => [...row]);
    modules[12][0] = !modules[12][0];

    expect(decodeQrModules(modules).eccValid).toBe(false);
  });

  describe('reading the rendered path data', () => {
    const matrix = encodeQr(SAMPLES['wifi'], { errorLevel: 'Q' });

    it.each([0, 2, 4])(
      'reads square modules back from the path with a quiet zone of %i',
      (quietZone) => {
        const layout = buildQrLayout(matrix, { size: 240, quietZone });
        const grid = gridFromPath(
          layout.path,
          matrix.size,
          quietZone,
          'square',
        );
        const decoded = decodeQrModules(grid);

        expect(decoded.text).toBe(SAMPLES['wifi']);
        expect(decoded.eccValid).toBe(true);
      },
    );

    it.each([
      ['dots', 'square'],
      ['dots', 'circle'],
      ['rounded', 'rounded'],
      ['rounded', 'square'],
      ['square', 'circle'],
      ['square', 'rounded'],
    ] as [QrModuleShape, QrFinderShape][])(
      'reads %s modules with %s corners back, the corners drawn apart',
      (shape, finderShape) => {
        const layout = buildQrLayout(matrix, {
          size: 240,
          quietZone: 2,
          shape,
          finderShape,
        });
        expect(layout.finderPath).not.toBe('');
        const grid = withFinders(
          gridFromPath(layout.path, matrix.size, 2, shape),
        );
        const decoded = decodeQrModules(grid);

        expect(decoded.text).toBe(SAMPLES['wifi']);
        expect(decoded.eccValid).toBe(true);
      },
    );
  });
});
