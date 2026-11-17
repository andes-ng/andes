import {
  aspectRatio,
  clampPlacement,
  clampRect,
  CROP_HANDLES,
  CROP_MIN_SIZE,
  cropOutput,
  dragFrame,
  fitFrame,
  fitStage,
  panPicture,
  resizeFrame,
  rotatedSize,
  sourceRect,
  unrotateRect,
  zoomPicture,
  type CropRect,
  type CropSize,
} from './upload-crop';

const stage: CropSize = { width: 400, height: 300 };
const identity = { x: 0, y: 0, zoom: 1 };

function inside(rect: CropRect, bounds: CropSize): void {
  expect(rect.x).toBeGreaterThanOrEqual(0);
  expect(rect.y).toBeGreaterThanOrEqual(0);
  expect(rect.x + rect.width).toBeLessThanOrEqual(bounds.width + 1e-9);
  expect(rect.y + rect.height).toBeLessThanOrEqual(bounds.height + 1e-9);
}

describe('upload crop maths', () => {
  describe('shapes and stage', () => {
    it('reads the aspect as width over height, or null when free', () => {
      expect(aspectRatio('free')).toBeNull();
      expect(aspectRatio('1:1')).toBe(1);
      expect(aspectRatio('4:3')).toBeCloseTo(4 / 3);
      expect(aspectRatio('16:9')).toBeCloseTo(16 / 9);
    });

    it('swaps the sides on a quarter turn only', () => {
      const natural = { width: 4000, height: 3000 };
      expect(rotatedSize(natural, 0)).toEqual(natural);
      expect(rotatedSize(natural, 1)).toEqual({ width: 3000, height: 4000 });
      expect(rotatedSize(natural, 2)).toEqual(natural);
      expect(rotatedSize(natural, 3)).toEqual({ width: 3000, height: 4000 });
    });

    it('fits the stage to the picture shape inside the space', () => {
      const space = { width: 480, height: 360 };
      expect(fitStage({ width: 4000, height: 1000 }, space)).toEqual({
        width: 480,
        height: 120,
      });
      expect(fitStage({ width: 1000, height: 2000 }, space)).toEqual({
        width: 180,
        height: 360,
      });
      expect(fitStage({ width: 0, height: 0 }, space)).toEqual({
        width: 0,
        height: 0,
      });
    });
  });

  describe('frame clamp', () => {
    it('moves a frame back inside the picture', () => {
      expect(
        clampRect({ x: -20, y: 280, width: 100, height: 50 }, stage),
      ).toEqual({ x: 0, y: 250, width: 100, height: 50 });
      expect(
        clampRect({ x: 350, y: -5, width: 100, height: 50 }, stage),
      ).toEqual({ x: 300, y: 0, width: 100, height: 50 });
    });

    it('shrinks a frame larger than the picture', () => {
      expect(
        clampRect({ x: -10, y: -10, width: 900, height: 900 }, stage),
      ).toEqual({ x: 0, y: 0, width: 400, height: 300 });
    });

    it('fits a free frame to 80% of the picture, centred', () => {
      expect(fitFrame(stage, null)).toEqual({
        x: 40,
        y: 30,
        width: 320,
        height: 240,
      });
    });

    it('fits a locked frame to the largest box of its shape', () => {
      const square = fitFrame(stage, 1, undefined, 1);
      expect(square).toEqual({ x: 50, y: 0, width: 300, height: 300 });
      const wide = fitFrame(stage, 16 / 9, undefined, 1);
      expect(wide.width).toBe(400);
      expect(wide.height).toBeCloseTo(225);
      expect(wide.y).toBeCloseTo(37.5);
    });

    it('re-fits about a given centre and stays inside', () => {
      const frame = fitFrame(stage, 1, { x: 390, y: 10 });
      expect(frame.width).toBe(240);
      expect(frame).toMatchObject({ x: 160, y: 0 });
    });
  });

  describe('resize', () => {
    const start: CropRect = { x: 100, y: 100, width: 100, height: 100 };

    it('moves only the dragged sides of a free frame', () => {
      expect(resizeFrame(start, 'e', 30, 99, stage, null)).toEqual({
        x: 100,
        y: 100,
        width: 130,
        height: 100,
      });
      expect(resizeFrame(start, 'nw', -20, -40, stage, null)).toEqual({
        x: 80,
        y: 60,
        width: 120,
        height: 140,
      });
      expect(resizeFrame(start, 's', 0, 25, stage, null)).toEqual({
        x: 100,
        y: 100,
        width: 100,
        height: 125,
      });
    });

    it('keeps every handle inside the picture', () => {
      for (const handle of CROP_HANDLES) {
        inside(resizeFrame(start, handle, -999, -999, stage, null), stage);
        inside(resizeFrame(start, handle, 999, 999, stage, null), stage);
      }
      expect(resizeFrame(start, 'se', 999, 999, stage, null)).toEqual({
        x: 100,
        y: 100,
        width: 300,
        height: 200,
      });
    });

    it('never goes below the minimum size', () => {
      for (const handle of CROP_HANDLES) {
        const shrunk = resizeFrame(start, handle, 999, 999, stage, null);
        const grown = resizeFrame(start, handle, -999, -999, stage, null);
        for (const rect of [shrunk, grown]) {
          expect(rect.width).toBeGreaterThanOrEqual(CROP_MIN_SIZE);
          expect(rect.height).toBeGreaterThanOrEqual(CROP_MIN_SIZE);
        }
      }
      expect(resizeFrame(start, 'w', 999, 0, stage, null)).toEqual({
        x: 200 - CROP_MIN_SIZE,
        y: 100,
        width: CROP_MIN_SIZE,
        height: 100,
      });
    });

    it.each([
      ['1:1', 1],
      ['4:3', 4 / 3],
      ['16:9', 16 / 9],
    ])('keeps %s on every handle, grown or shrunk', (_, ratio) => {
      const frame = { x: 120, y: 90, width: 120, height: 120 / ratio };
      for (const handle of CROP_HANDLES) {
        for (const [dx, dy] of [
          [37, 11],
          [-23, -41],
          [999, 999],
          [-999, -999],
        ]) {
          const rect = resizeFrame(frame, handle, dx, dy, stage, ratio);
          expect(rect.width / rect.height).toBeCloseTo(ratio);
          expect(Math.min(rect.width, rect.height)).toBeGreaterThanOrEqual(
            CROP_MIN_SIZE - 1e-9,
          );
          inside(rect, stage);
        }
      }
    });

    it('pins the opposite corner of a locked corner drag', () => {
      const rect = resizeFrame(start, 'nw', -30, -10, stage, 1);
      expect(rect).toEqual({ x: 70, y: 70, width: 130, height: 130 });
    });

    it('grows the other axis about the middle on a locked edge drag', () => {
      const rect = resizeFrame(start, 'e', 40, 0, stage, 1);
      expect(rect).toEqual({ x: 100, y: 80, width: 140, height: 140 });
      // Near the top edge the grown frame is nudged down rather than cut.
      const high = resizeFrame(
        { x: 100, y: 0, width: 100, height: 100 },
        's',
        0,
        60,
        stage,
        1,
      );
      expect(high).toEqual({ x: 70, y: 0, width: 160, height: 160 });
    });
  });

  describe('zoom and pan', () => {
    it('keeps the zoomed picture covering the stage', () => {
      expect(clampPlacement({ x: 50, y: -999, zoom: 2 }, stage)).toEqual({
        x: 0,
        y: -300,
        zoom: 2,
      });
      expect(clampPlacement({ x: 0, y: 0, zoom: 9 }, stage).zoom).toBe(3);
      expect(clampPlacement({ x: -10, y: -10, zoom: 1 }, stage)).toEqual(
        identity,
      );
    });

    it('zooms about an anchor point, which stays still', () => {
      const zoomed = zoomPicture(identity, 2, { x: 200, y: 150 }, stage);
      expect(zoomed).toEqual({ x: -200, y: -150, zoom: 2 });
      const back = zoomPicture(zoomed, 1, { x: 200, y: 150 }, stage);
      expect(back).toEqual(identity);
    });

    it('pans only while the picture still covers the stage', () => {
      const zoomed = { x: -200, y: -150, zoom: 2 };
      expect(panPicture(zoomed, 50, -50, stage)).toEqual({
        x: -150,
        y: -200,
        zoom: 2,
      });
      expect(panPicture(zoomed, 999, -999, stage)).toEqual({
        x: 0,
        y: -300,
        zoom: 2,
      });
      expect(panPicture(identity, 30, 30, stage)).toEqual(identity);
    });

    it('slides a zoomed picture once the dragged frame meets the edge', () => {
      const frame = { x: 250, y: 100, width: 100, height: 100 };
      const zoomed = { x: -200, y: -150, zoom: 2 };
      const result = dragFrame(frame, zoomed, 80, 0, stage);
      expect(result.frame).toMatchObject({ x: 300, y: 100 });
      expect(result.placement).toEqual({ x: -230, y: -150, zoom: 2 });
      // Unzoomed there is nothing to slide: the frame just stops.
      expect(dragFrame(frame, identity, 80, 0, stage).placement).toEqual(
        identity,
      );
    });

    it('maps the frame to the real pixels of the picture', () => {
      const picture = { width: 4000, height: 3000 };
      const frame = { x: 100, y: 75, width: 200, height: 150 };
      expect(sourceRect(frame, identity, stage, picture)).toEqual({
        x: 1000,
        y: 750,
        width: 2000,
        height: 1500,
      });
      // Zoomed 2x about the centre, the same frame covers half as many pixels.
      const zoomed = zoomPicture(identity, 2, { x: 200, y: 150 }, stage);
      expect(sourceRect(frame, zoomed, stage, picture)).toEqual({
        x: 1500,
        y: 1125,
        width: 1000,
        height: 750,
      });
      // Panned to the top-left corner.
      const corner = { x: 0, y: 0, zoom: 2 };
      expect(
        sourceRect({ x: 0, y: 0, width: 40, height: 30 }, corner, stage, {
          width: 4000,
          height: 3000,
        }),
      ).toEqual({ x: 0, y: 0, width: 200, height: 150 });
    });

    it('does not depend on the size the stage is shown at', () => {
      const picture = { width: 4000, height: 3000 };
      const small = sourceRect(
        { x: 50, y: 37.5, width: 100, height: 75 },
        identity,
        { width: 200, height: 150 },
        picture,
      );
      expect(small).toEqual(
        sourceRect(
          { x: 100, y: 75, width: 200, height: 150 },
          identity,
          stage,
          picture,
        ),
      );
    });
  });

  describe('rotation', () => {
    const natural = { width: 400, height: 300 };
    // A 10x20 rectangle at (30, 40) of the turned picture.
    const rect = { x: 30, y: 40, width: 10, height: 20 };

    it('leaves an unturned rectangle alone', () => {
      expect(unrotateRect(rect, 0, natural)).toEqual(rect);
    });

    it('maps a quarter turn back onto the stored picture', () => {
      // Turned clockwise, the stored left column is the turned top row.
      expect(unrotateRect(rect, 1, natural)).toEqual({
        x: 40,
        y: 260,
        width: 20,
        height: 10,
      });
      expect(
        unrotateRect({ x: 0, y: 0, width: 300, height: 400 }, 1, natural),
      ).toEqual({ x: 0, y: 0, width: 400, height: 300 });
    });

    it('maps a half turn back onto the stored picture', () => {
      expect(unrotateRect(rect, 2, natural)).toEqual({
        x: 360,
        y: 240,
        width: 10,
        height: 20,
      });
    });

    it('maps three quarter turns back onto the stored picture', () => {
      expect(unrotateRect(rect, 3, natural)).toEqual({
        x: 340,
        y: 30,
        width: 20,
        height: 10,
      });
    });

    it('maps each turned corner pixel to the matching stored corner', () => {
      // The turned picture's top-left pixel, for each turn.
      const pixel = { x: 0, y: 0, width: 1, height: 1 };
      expect(unrotateRect(pixel, 1, natural)).toMatchObject({ x: 0, y: 299 });
      expect(unrotateRect(pixel, 2, natural)).toMatchObject({ x: 399, y: 299 });
      expect(unrotateRect(pixel, 3, natural)).toMatchObject({ x: 399, y: 0 });
    });
  });

  describe('output', () => {
    it('keeps a JPEG a JPEG at 0.92', () => {
      expect(cropOutput('image/jpeg')).toEqual({
        type: 'image/jpeg',
        quality: 0.92,
      });
    });

    it('keeps a PNG a PNG, and makes anything else one', () => {
      expect(cropOutput('image/png')).toEqual({
        type: 'image/png',
        quality: undefined,
      });
      expect(cropOutput('image/gif').type).toBe('image/png');
    });
  });
});
