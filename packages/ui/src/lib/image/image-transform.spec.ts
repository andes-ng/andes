import {
  andesDrawTransformedImage,
  ANDES_IMAGE_IDENTITY_TRANSFORM,
  clamp,
  imageTransformCss,
  isIdentityTransform,
  isZoomed,
  reboundTransform,
  zoomTransform,
} from './image-transform';

describe('image transform math', () => {
  const identity = ANDES_IMAGE_IDENTITY_TRANSFORM;

  it('clamps a value into a range', () => {
    expect(clamp(5, 1, 3)).toBe(3);
    expect(clamp(-5, 1, 3)).toBe(1);
    expect(clamp(2, 1, 3)).toBe(2);
  });

  it('writes pan, mirrored zoom and rotation as one transform', () => {
    expect(imageTransformCss(identity)).toBe(
      'translate3d(0px, 0px, 0) scale3d(1, 1, 1) rotate(0deg)',
    );
    expect(
      imageTransformCss({
        x: 10,
        y: -5,
        rotate: 90,
        scale: 2,
        flipX: true,
        flipY: false,
      }),
    ).toBe('translate3d(10px, -5px, 0) scale3d(-2, 2, 1) rotate(90deg)');
  });

  it('zooms about the centre by default', () => {
    const next = zoomTransform(identity, 2, 1, 50);
    expect(next).toMatchObject({ scale: 2, x: 0, y: 0 });
  });

  it('keeps the point under the focal position fixed while zooming', () => {
    const focal = { x: 100, y: 40 };
    const next = zoomTransform(identity, 2, 1, 50, focal);
    // A point at `focal` before the zoom is at `focal` after it: x' = fx - (fx - x) * r.
    expect(next.x).toBe(-100);
    expect(next.y).toBe(-40);
  });

  it('clamps the zoom to the limits and returns the same object when nothing changes', () => {
    expect(zoomTransform(identity, 100, 1, 8).scale).toBe(8);
    expect(zoomTransform(identity, 0.2, 1, 8)).toBe(identity);
  });

  it('centres an image smaller than the viewport and bounds a larger one', () => {
    const viewport = { width: 400, height: 300 };
    const image = { width: 200, height: 100 };

    const dragged = { ...identity, x: 80, y: -30 };
    expect(reboundTransform(dragged, viewport, image)).toMatchObject({
      x: 0,
      y: 0,
    });

    // 3x: 600 x 300 on screen -> may pan 100px horizontally, not at all vertically.
    const zoomed = { ...identity, scale: 3, x: 500, y: 10 };
    expect(reboundTransform(zoomed, viewport, image)).toMatchObject({
      x: 100,
      y: 0,
    });
  });

  it('swaps the image axes after a quarter turn', () => {
    const viewport = { width: 400, height: 300 };
    const image = { width: 200, height: 100 };
    const turned = { ...identity, scale: 3, rotate: 90, x: 500, y: 500 };
    // Rotated 3x: 300 wide x 600 tall -> no horizontal pan, 150px vertical.
    expect(reboundTransform(turned, viewport, image)).toMatchObject({
      x: 0,
      y: 150,
    });
  });

  it('leaves the transform alone when a size is unknown', () => {
    const moved = { ...identity, x: 20 };
    expect(
      reboundTransform(moved, { width: 0, height: 0 }, { width: 5, height: 5 }),
    ).toBe(moved);
  });

  it('knows when it is zoomed and when it is back at rest', () => {
    expect(isZoomed(identity)).toBe(false);
    expect(isZoomed({ ...identity, scale: 1.5 })).toBe(true);
    expect(isIdentityTransform(identity)).toBe(true);
    expect(isIdentityTransform({ ...identity, rotate: 360 })).toBe(true);
    expect(isIdentityTransform({ ...identity, flipY: true })).toBe(false);
  });
});

describe('andesDrawTransformedImage', () => {
  function fakeImage(width: number, height: number) {
    const image = document.createElement('img');
    Object.defineProperty(image, 'naturalWidth', { value: width });
    Object.defineProperty(image, 'naturalHeight', { value: height });
    return image;
  }

  function recordCanvas() {
    const calls: string[] = [];
    const context = {
      translate: (x: number, y: number) => calls.push(`translate ${x} ${y}`),
      scale: (x: number, y: number) => calls.push(`scale ${x} ${y}`),
      rotate: (angle: number) =>
        calls.push(`rotate ${Math.round((angle * 180) / Math.PI)}`),
      drawImage: (_: unknown, x: number, y: number) =>
        calls.push(`draw ${x} ${y}`),
    };
    const spy = vi
      .spyOn(HTMLCanvasElement.prototype, 'getContext')
      .mockReturnValue(context as unknown as CanvasRenderingContext2D);
    return { calls, restore: () => spy.mockRestore() };
  }

  it('rotates then mirrors about the centre, at the natural size', () => {
    const { calls, restore } = recordCanvas();
    const canvas = andesDrawTransformedImage(fakeImage(200, 100), {
      ...ANDES_IMAGE_IDENTITY_TRANSFORM,
      rotate: 90,
      flipX: true,
      scale: 3,
      x: 40,
    });
    restore();
    // A quarter turn swaps the sides; zoom and pan are not drawn.
    expect([canvas?.width, canvas?.height]).toEqual([100, 200]);
    expect(calls).toEqual([
      'translate 50 100',
      'scale -1 1',
      'rotate 90',
      'draw -100 -50',
    ]);
  });

  it('keeps the size for half turns', () => {
    const { restore } = recordCanvas();
    const canvas = andesDrawTransformedImage(fakeImage(200, 100), {
      ...ANDES_IMAGE_IDENTITY_TRANSFORM,
      rotate: -180,
      flipY: true,
    });
    restore();
    expect([canvas?.width, canvas?.height]).toEqual([200, 100]);
  });

  it('gives nothing before the image has loaded, or without a 2D canvas', () => {
    expect(
      andesDrawTransformedImage(
        fakeImage(0, 0),
        ANDES_IMAGE_IDENTITY_TRANSFORM,
      ),
    ).toBeNull();
    const spy = vi
      .spyOn(HTMLCanvasElement.prototype, 'getContext')
      .mockReturnValue(null);
    expect(
      andesDrawTransformedImage(
        fakeImage(10, 10),
        ANDES_IMAGE_IDENTITY_TRANSFORM,
      ),
    ).toBeNull();
    spy.mockRestore();
  });
});
