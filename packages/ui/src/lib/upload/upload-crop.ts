/*
 * The geometry behind the crop dialog of the "Crop image before uploading" story. A story
 * helper, not library API: nothing here is exported from `index.ts`.
 *
 * Everything is measured in physical px of the picture box (the stage): `x` grows to the
 * right and `y` downwards whatever the writing direction, so the maths needs no RTL care.
 * At zoom 1 the (rotated) picture fills the stage exactly; zooming scales it from its
 * top-left corner and the pan keeps it covering the stage, so a frame inside the stage is
 * always inside the picture.
 */

/** A rectangle in px, from its top-left corner. */
export interface CropRect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/** A size in px. */
export interface CropSize {
  readonly width: number;
  readonly height: number;
}

/** Where the picture sits on the stage: its top-left corner and its zoom. */
export interface CropPlacement {
  readonly x: number;
  readonly y: number;
  readonly zoom: number;
}

/** A side or a corner of the frame, named after the compass (`n` is the top edge). */
export type CropHandle = 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw';

export const CROP_HANDLES: readonly CropHandle[] = [
  'nw',
  'n',
  'ne',
  'e',
  'se',
  's',
  'sw',
  'w',
];

export type CropAspect = 'free' | '1:1' | '4:3' | '16:9';

/** Quarter turns clockwise, 0 to 3. */
export type CropTurns = 0 | 1 | 2 | 3;

export const CROP_MIN_ZOOM = 1;
export const CROP_MAX_ZOOM = 3;

/** The smallest frame side, in stage px. */
export const CROP_MIN_SIZE = 32;

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Width over height, or `null` for a free frame. */
export function aspectRatio(aspect: CropAspect): number | null {
  if (aspect === 'free') {
    return null;
  }
  const [width, height] = aspect.split(':').map(Number);
  return width / height;
}

/** The size of the picture once turned: a quarter turn swaps its sides. */
export function rotatedSize(natural: CropSize, turns: CropTurns): CropSize {
  return turns % 2 === 1
    ? { width: natural.height, height: natural.width }
    : natural;
}

/** The largest box of the picture's shape that fits `space`: the stage at zoom 1. */
export function fitStage(picture: CropSize, space: CropSize): CropSize {
  if (!picture.width || !picture.height) {
    return { width: 0, height: 0 };
  }
  const scale = Math.min(
    space.width / picture.width,
    space.height / picture.height,
  );
  return {
    width: Math.round(picture.width * scale),
    height: Math.round(picture.height * scale),
  };
}

/** Moves `rect` inside `bounds`, first shrinking it to them if it is larger. */
export function clampRect(rect: CropRect, bounds: CropSize): CropRect {
  const width = Math.min(rect.width, bounds.width);
  const height = Math.min(rect.height, bounds.height);
  return {
    x: clamp(rect.x, 0, bounds.width - width),
    y: clamp(rect.y, 0, bounds.height - height),
    width,
    height,
  };
}

/**
 * A frame of the given shape, `fill` of the largest one that fits `bounds`, centred on
 * `centre` (the middle of the bounds by default) and kept inside them.
 */
export function fitFrame(
  bounds: CropSize,
  ratio: number | null,
  centre: { readonly x: number; readonly y: number } = {
    x: bounds.width / 2,
    y: bounds.height / 2,
  },
  fill = 0.8,
): CropRect {
  let width = bounds.width * fill;
  let height = bounds.height * fill;
  if (ratio) {
    width = Math.min(bounds.width, bounds.height * ratio) * fill;
    height = width / ratio;
  }
  return clampRect(
    { x: centre.x - width / 2, y: centre.y - height / 2, width, height },
    bounds,
  );
}

/**
 * Drags one handle of `start` by (`dx`, `dy`): the opposite side (or corner) stays put, the
 * frame stays inside `bounds` and no side gets shorter than `min`. With a `ratio`, a corner
 * follows whichever axis moved further and an edge grows the other axis about its centre,
 * so the shape is kept on every handle.
 */
export function resizeFrame(
  start: CropRect,
  handle: CropHandle,
  dx: number,
  dy: number,
  bounds: CropSize,
  ratio: number | null,
  min = CROP_MIN_SIZE,
): CropRect {
  const west = handle.includes('w');
  const east = handle.includes('e');
  const north = handle.includes('n');
  const south = handle.includes('s');
  const right = start.x + start.width;
  const bottom = start.y + start.height;
  // How far each moving side may go before it leaves the bounds.
  const roomX = east ? bounds.width - start.x : right;
  const roomY = south ? bounds.height - start.y : bottom;
  const proposedWidth = start.width + (east ? dx : west ? -dx : 0);
  const proposedHeight = start.height + (south ? dy : north ? -dy : 0);

  if (!ratio) {
    const width = east || west ? clamp(proposedWidth, min, roomX) : start.width;
    const height =
      north || south ? clamp(proposedHeight, min, roomY) : start.height;
    return {
      x: west ? right - width : start.x,
      y: north ? bottom - height : start.y,
      width,
      height,
    };
  }

  const minWidth = Math.max(min, min * ratio);
  if ((east || west) && (north || south)) {
    // A corner: the axis that moved further (in frame-width units) leads.
    const byHeight = proposedHeight * ratio;
    const lead =
      Math.abs(proposedWidth - start.width) >= Math.abs(byHeight - start.width)
        ? proposedWidth
        : byHeight;
    const width = Math.min(
      Math.max(lead, minWidth),
      Math.min(roomX, roomY * ratio),
    );
    const height = width / ratio;
    return {
      x: west ? right - width : start.x,
      y: north ? bottom - height : start.y,
      width,
      height,
    };
  }

  if (east || west) {
    // A side edge: the height follows, about the frame's middle, nudged back inside.
    const width = Math.min(
      Math.max(proposedWidth, minWidth),
      Math.min(roomX, bounds.height * ratio),
    );
    const height = width / ratio;
    const middle = start.y + start.height / 2;
    return {
      x: west ? right - width : start.x,
      y: clamp(middle - height / 2, 0, bounds.height - height),
      width,
      height,
    };
  }

  // The top or bottom edge: the width follows about the middle.
  const height = Math.min(
    Math.max(proposedHeight, minWidth / ratio),
    Math.min(roomY, bounds.width / ratio),
  );
  const width = height * ratio;
  const middle = start.x + start.width / 2;
  return {
    x: clamp(middle - width / 2, 0, bounds.width - width),
    y: north ? bottom - height : start.y,
    width,
    height,
  };
}

/** Pulls the pan back so the zoomed picture keeps covering the whole stage. */
export function clampPlacement(
  placement: CropPlacement,
  stage: CropSize,
): CropPlacement {
  const zoom = clamp(placement.zoom, CROP_MIN_ZOOM, CROP_MAX_ZOOM);
  return {
    // `+ 0` folds a negative zero into plain zero.
    x: clamp(placement.x, stage.width - stage.width * zoom, 0) + 0,
    y: clamp(placement.y, stage.height - stage.height * zoom, 0) + 0,
    zoom,
  };
}

/** Moves the picture under the frame by (`dx`, `dy`), as far as it still covers the stage. */
export function panPicture(
  placement: CropPlacement,
  dx: number,
  dy: number,
  stage: CropSize,
): CropPlacement {
  return clampPlacement(
    { ...placement, x: placement.x + dx, y: placement.y + dy },
    stage,
  );
}

/** Changes the zoom (clamped to 1x-3x) keeping the stage point `anchor` still. */
export function zoomPicture(
  placement: CropPlacement,
  zoom: number,
  anchor: { readonly x: number; readonly y: number },
  stage: CropSize,
): CropPlacement {
  const next = clamp(zoom, CROP_MIN_ZOOM, CROP_MAX_ZOOM);
  const ratio = next / placement.zoom;
  return clampPlacement(
    {
      x: anchor.x - (anchor.x - placement.x) * ratio,
      y: anchor.y - (anchor.y - placement.y) * ratio,
      zoom: next,
    },
    stage,
  );
}

/**
 * Moves the frame by (`dx`, `dy`). Where it meets the edge of the stage and the picture is
 * zoomed, the rest of the move slides the picture the other way, so the frame keeps
 * travelling over it until the picture's own edge.
 */
export function dragFrame(
  frame: CropRect,
  placement: CropPlacement,
  dx: number,
  dy: number,
  stage: CropSize,
): { readonly frame: CropRect; readonly placement: CropPlacement } {
  const moved = clampRect(
    { ...frame, x: frame.x + dx, y: frame.y + dy },
    stage,
  );
  const leftX = frame.x + dx - moved.x;
  const leftY = frame.y + dy - moved.y;
  return {
    frame: moved,
    placement: panPicture(placement, -leftX, -leftY, stage),
  };
}

/**
 * The part of the rotated picture under the frame, in its real pixels (`picture` is the
 * rotated natural size), whatever size the stage is shown at.
 */
export function sourceRect(
  frame: CropRect,
  placement: CropPlacement,
  stage: CropSize,
  picture: CropSize,
): CropRect {
  const scale = picture.width / (stage.width * placement.zoom);
  const x = clamp(
    Math.round((frame.x - placement.x) * scale),
    0,
    picture.width,
  );
  const y = clamp(
    Math.round((frame.y - placement.y) * scale),
    0,
    picture.height,
  );
  return {
    x,
    y,
    width: clamp(Math.round(frame.width * scale), 1, picture.width - x),
    height: clamp(Math.round(frame.height * scale), 1, picture.height - y),
  };
}

/**
 * Maps a rectangle of the picture turned `turns` quarter turns clockwise back onto the
 * picture as stored (`natural` is its unturned size).
 */
export function unrotateRect(
  rect: CropRect,
  turns: CropTurns,
  natural: CropSize,
): CropRect {
  switch (turns) {
    case 1:
      return {
        x: rect.y,
        y: natural.height - rect.x - rect.width,
        width: rect.height,
        height: rect.width,
      };
    case 2:
      return {
        x: natural.width - rect.x - rect.width,
        y: natural.height - rect.y - rect.height,
        width: rect.width,
        height: rect.height,
      };
    case 3:
      return {
        x: natural.width - rect.y - rect.height,
        y: rect.x,
        width: rect.height,
        height: rect.width,
      };
    default:
      return rect;
  }
}

/** The cropped file keeps a JPEG a JPEG (at 0.92) and makes anything else a PNG. */
export function cropOutput(type: string): {
  readonly type: string;
  readonly quality: number | undefined;
} {
  return type === 'image/jpeg'
    ? { type, quality: 0.92 }
    : { type: 'image/png', quality: undefined };
}
