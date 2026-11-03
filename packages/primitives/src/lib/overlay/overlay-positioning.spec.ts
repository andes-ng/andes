import {
  andesClippingAncestors,
  andesHorizontalShift,
  andesIsAnchorInView,
  type AndesClientRect,
} from './overlay-positioning';

const VIEWPORT: AndesClientRect = { top: 0, left: 0, right: 1024, bottom: 768 };

function rect(
  top: number,
  left: number,
  height = 32,
  width = 200,
): AndesClientRect {
  return { top, left, bottom: top + height, right: left + width };
}

describe('andesIsAnchorInView', () => {
  it('counts an anchor that is only partly on screen as visible', () => {
    expect(andesIsAnchorInView(rect(-20, 16), VIEWPORT)).toBe(true);
    expect(andesIsAnchorInView(rect(750, 16), VIEWPORT)).toBe(true);
  });

  it('reports an anchor scrolled past the top or the bottom as out of view', () => {
    expect(andesIsAnchorInView(rect(-100, 16), VIEWPORT)).toBe(false);
    expect(andesIsAnchorInView(rect(900, 16), VIEWPORT)).toBe(false);
    // Touching the edge is not being visible.
    expect(andesIsAnchorInView(rect(-32, 16), VIEWPORT)).toBe(false);
    expect(andesIsAnchorInView(rect(768, 16), VIEWPORT)).toBe(false);
  });

  it('reports an anchor scrolled sideways out of the viewport as out of view', () => {
    expect(andesIsAnchorInView(rect(100, -300), VIEWPORT)).toBe(false);
    expect(andesIsAnchorInView(rect(100, 1100), VIEWPORT)).toBe(false);
  });

  it('reports an anchor scrolled out of a clipping ancestor as out of view', () => {
    const container = rect(200, 0, 260, 400);

    expect(andesIsAnchorInView(rect(300, 16), VIEWPORT, [container])).toBe(
      true,
    );
    // Still inside the viewport, but above the container's visible area.
    expect(andesIsAnchorInView(rect(100, 16), VIEWPORT, [container])).toBe(
      false,
    );
  });

  it('treats an anchor that is not laid out as visible', () => {
    expect(andesIsAnchorInView(rect(0, 0, 0, 0), VIEWPORT)).toBe(true);
  });
});

describe('andesHorizontalShift', () => {
  it('leaves a pane that fits alone', () => {
    expect(andesHorizontalShift({ left: 16, right: 316 }, 1024, 8)).toBe(0);
  });

  it('moves a pane past the right edge back in, with the bounds CDK pushes to', () => {
    // CDK keeps 2 * margin from the right edge: 1024 - 16 = 1008.
    expect(andesHorizontalShift({ left: 900, right: 1200 }, 1024, 8)).toBe(
      -192,
    );
  });

  it('moves a pane past the left edge back in', () => {
    expect(andesHorizontalShift({ left: -40, right: 260 }, 1024, 8)).toBe(48);
  });

  it('only keeps the start of a pane wider than the room on screen', () => {
    expect(andesHorizontalShift({ left: -40, right: 1060 }, 1024, 8)).toBe(48);
    expect(andesHorizontalShift({ left: 100, right: 1200 }, 1024, 8)).toBe(0);
  });
});

describe('andesClippingAncestors', () => {
  let root: HTMLElement;

  beforeEach(() => {
    root = document.createElement('div');
    root.innerHTML = `
      <div id="scroller" style="overflow: auto">
        <div id="plain">
          <div id="clipper" style="overflow-x: hidden">
            <button id="anchor" type="button">Open</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(root);
  });

  afterEach(() => root.remove());

  it('lists every ancestor that clips its overflow, nearest first', () => {
    const anchor = root.querySelector<HTMLElement>('#anchor');
    if (!anchor) {
      throw new Error('missing anchor');
    }

    expect(andesClippingAncestors(anchor).map((element) => element.id)).toEqual(
      ['clipper', 'scroller'],
    );
  });
});
