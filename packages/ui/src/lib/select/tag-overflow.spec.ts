import { andesMeasureTagFit } from './tag-overflow';

/** A measuring row of tags with the given widths, and a `+ N` tag `rest` px wide. */
function measuring(widths: number[], rest: number): HTMLElement {
  const measure = document.createElement('div');
  const sized = (width: number, kind: string) => {
    const item = document.createElement('span');
    item.setAttribute('data-measure', kind);
    Object.defineProperty(item, 'offsetWidth', { get: () => width });
    measure.append(item);
  };
  widths.forEach((width) => sized(width, 'tag'));
  sized(rest, 'rest');
  return measure;
}

/** A selection row `width` px wide, with `gap` px between its items. */
function row(width: number, gap: number): HTMLElement {
  const selection = document.createElement('div');
  selection.style.columnGap = `${gap}px`;
  Object.defineProperty(selection, 'clientWidth', { get: () => width });
  document.body.append(selection);
  return selection;
}

describe('andesMeasureTagFit', () => {
  afterEach(() => document.body.replaceChildren());

  it('keeps every tag when they all fit, gaps included', () => {
    expect(andesMeasureTagFit(measuring([50, 50, 50], 30), row(160, 4))).toBe(
      3,
    );
  });

  it('fits as many as there is room for beside the + N tag', () => {
    // 30 (+ N) + 4 + 50 + 4 + 50 = 138 fits in 140; a third does not.
    expect(
      andesMeasureTagFit(measuring([50, 50, 50, 50], 30), row(140, 4)),
    ).toBe(2);
  });

  it('keeps room for a search input, plus a gap', () => {
    // 140 - (20 + 4) = 116: only one tag beside the + N tag.
    expect(
      andesMeasureTagFit(measuring([50, 50, 50, 50], 30), row(140, 4), 20),
    ).toBe(1);
  });

  it('never shows fewer than one tag', () => {
    expect(andesMeasureTagFit(measuring([300, 50], 30), row(100, 4))).toBe(1);
    expect(andesMeasureTagFit(measuring([], 30), row(100, 4))).toBe(0);
  });

  it('measures nothing on a row that has not been laid out', () => {
    expect(andesMeasureTagFit(measuring([50], 30), row(0, 4))).toBeNull();
  });
});
