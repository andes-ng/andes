/** Slack for float comparisons between scroll offsets, in px. */
const EPSILON = 1;

/** Where an item sits along the scroll axis, in px from the start of the scrolled content. */
export interface AndesScrollerBox {
  readonly start: number;
  readonly end: number;
}

export interface AndesScrollerStepOptions {
  /** Scroll offset (px from the start) the move begins from. */
  readonly from: number;
  /** Furthest scroll offset the content allows. */
  readonly max: number;
  /** Size of the visible area along the axis. */
  readonly client: number;
  /** Space kept between the start edge and an item that has been scrolled to. */
  readonly inset: number;
  /** `view` moves by a full view of items, anything else by one item. */
  readonly paging: 'item' | 'view' | 'none';
}

function clamp(value: number, max: number): number {
  return Math.min(Math.max(value, 0), Math.max(0, max));
}

/** The scroll offset that lines an item up with the start edge. */
export function snapOffset(
  box: AndesScrollerBox,
  inset: number,
  max: number,
): number {
  return clamp(box.start - inset, max);
}

/**
 * The scroll offset one step forward (`direction` 1) or back (-1) from `options.from`, or
 * `null` when the content cannot move that way.
 */
export function stepOffset(
  boxes: readonly AndesScrollerBox[],
  direction: 1 | -1,
  options: AndesScrollerStepOptions,
): number | null {
  const { from, max, client, inset, paging } = options;
  const targets = boxes.map((box) => ({
    box,
    offset: snapOffset(box, inset, max),
  }));

  if (direction > 0) {
    const ahead = targets.filter((t) => t.offset > from + EPSILON);
    if (ahead.length === 0) {
      return from < max - EPSILON ? max : null;
    }
    if (paging === 'view') {
      // The first item that is not fully in view becomes the first one in the next view;
      // when everything left fits, the end of the content is the next view.
      const hidden = ahead.find((t) => t.box.end > from + client + EPSILON);
      return hidden ? hidden.offset : max;
    }
    return ahead[0].offset;
  }

  const behind = targets.filter((t) => t.offset < from - EPSILON);
  if (behind.length === 0) {
    return from > EPSILON ? 0 : null;
  }
  if (paging === 'view') {
    const wanted = from - client;
    const first = behind.find((t) => t.offset >= wanted - EPSILON);
    return (first ?? behind[behind.length - 1]).offset;
  }
  return behind[behind.length - 1].offset;
}
