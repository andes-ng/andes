/**
 * Pure layout math for the organization chart: no Angular, no DOM, so it is unit tested on its
 * own and could later run in a worker.
 *
 * The algorithm is a "tidy tree" for cards of different sizes, computed in logical axes and
 * mapped to the screen last:
 *
 * - **main axis**: the direction the hierarchy grows (down in a vertical chart, towards the
 *   inline end in a horizontal one);
 * - **cross axis**: the direction siblings are laid out in.
 *
 * Every subtree is treated as a rigid shape described by its two contours: for each stretch of
 * the main axis, how far the subtree reaches towards the cross start and towards the cross end.
 * A contour is a list of steps `(start, end, value)` relative to the subtree's own root (the
 * root's top is main 0, its center is cross 0). Children start one `levelGap` below their parent,
 * so cards of different heights simply push their own subtree further down ("non-layered").
 *
 * Siblings are packed twice: from the first towards the last, and from the last back to the
 * first. Each pass sets a subtree against its neighbour, then against the subtrees further back;
 * when a far subtree pushes it, the push is shared out over the subtrees in between, so small
 * subtrees between two large ones are evenly spaced. Both placements keep every pair of siblings
 * at least their required distance apart, a set of linear constraints `x[j] - x[i] >= d[i][j]`,
 * so the average of the two satisfies them too, and the average is mirror symmetric. The parent
 * is then centered over its first and last child.
 *
 * Contour work is proportional to the subtree height at each level, so the whole layout costs
 * O(n * h): effectively linear for organization charts, which are wide rather than deep.
 */

/** Identifies a node. Keys are compared with `===`. */
export type AndesOrgChartKey = string | number;

/** Which way the hierarchy grows: `vertical` puts children below, `horizontal` beside. */
export type AndesOrgChartOrientation = 'vertical' | 'horizontal';

/**
 * How the children of a parent whose children are all leaves are arranged.
 *
 * - `tree`: side by side, like every other level.
 * - `hanging`: one column, indented from the parent's start edge, with a stem running down
 *   beside it. Keeps very wide teams narrow.
 * - `compact`: two columns either side of a stem under the parent's center.
 */
export type AndesOrgChartLeafLayout = 'tree' | 'hanging' | 'compact';

/** What a connector joins: a manager to a report, to an assistant, or to a stacked leaf. */
export type AndesOrgChartLinkKind = 'tree' | 'assistant' | 'stack';

/** A node as the layout needs to know it. Sizes are in screen pixels, before any zoom. */
export interface AndesOrgChartLayoutNode {
  readonly key: AndesOrgChartKey;
  readonly width: number;
  readonly height: number;
  /** Visible children, in reading order. Collapsed nodes pass an empty list. */
  readonly children: readonly AndesOrgChartLayoutNode[];
  /**
   * Placed beside the parent's stem, between the parent and its other children. An assistant
   * that has visible children of its own is laid out as a regular child instead.
   */
  readonly assistant?: boolean;
  /**
   * Whether the node counts as a leaf for `leafLayout` and assistant placement. Defaults to
   * "has no visible children"; pass `false` for a collapsed manager, so a team of managers does
   * not stack while collapsed and jump back into a row when one of them opens.
   */
  readonly leaf?: boolean;
}

/** Options of {@link andesOrgChartLayout}. Every key is optional. */
export interface AndesOrgChartLayoutOptions {
  /** Default `'vertical'`. */
  readonly orientation?: AndesOrgChartOrientation;
  /** Grow towards the top (vertical) or the inline start (horizontal). Default `false`. */
  readonly reversed?: boolean;
  /**
   * Right-to-left: a vertical chart lists siblings from the right, a horizontal chart grows
   * towards the left. Default `false`.
   */
  readonly rtl?: boolean;
  /** Space between two sibling cards. Default `24`. */
  readonly nodeGap?: number;
  /** Space between cards of neighbouring subtrees below the siblings (cousins). Default `40`. */
  readonly subtreeGap?: number;
  /** Space between a parent and its children along the main axis. Default `56`. */
  readonly levelGap?: number;
  /** How all-leaf children are arranged. Default `'tree'`. */
  readonly leafLayout?: AndesOrgChartLeafLayout;
  /** Fewest all-leaf children before `leafLayout` applies. Default `2`. */
  readonly leafLayoutMinCount?: number;
  /** Distance from the parent's start edge to the stem of a `hanging` stack. Default `nodeGap`. */
  readonly hangingIndent?: number;
}

/** A card's position on the chart, in unzoomed pixels from the chart's top-left corner. */
export interface AndesOrgChartBox {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/** A point on the chart, in unzoomed pixels. */
export interface AndesOrgChartPoint {
  readonly x: number;
  readonly y: number;
}

/** A connector from a parent to one child, as an orthogonal route. */
export interface AndesOrgChartLayoutLink {
  readonly from: AndesOrgChartKey;
  readonly to: AndesOrgChartKey;
  readonly kind: AndesOrgChartLinkKind;
  /**
   * The route: starts on the parent's edge, ends on the child's edge. Tree links have four
   * points (parent, fork, fork, child), assistant and stack links three (parent, corner, child).
   */
  readonly points: readonly AndesOrgChartPoint[];
}

/** The result of {@link andesOrgChartLayout}. */
export interface AndesOrgChartLayout {
  readonly boxes: ReadonlyMap<AndesOrgChartKey, AndesOrgChartBox>;
  readonly links: readonly AndesOrgChartLayoutLink[];
  /** Size of the area every card fits in; the top-left card corner is at 0, 0. */
  readonly width: number;
  readonly height: number;
}

// ------------------------------------------------------------------ internals

/** One step of a contour: over `[start, end)` of the main axis the edge sits at `value`. */
interface Step {
  readonly start: number;
  readonly end: number;
  readonly value: number;
  /** Whether the step is the subtree's own root card, which keeps the smaller sibling gap. */
  readonly root: boolean;
}

type Contour = readonly Step[];

/** What the layout knows about a node once its subtree is done. */
interface Frame {
  readonly node: AndesOrgChartLayoutNode;
  /** Card size along the main and the cross axis. */
  readonly mainSize: number;
  readonly crossSize: number;
  /** Offset of the node from its parent: card top (main) and card center (cross). */
  offsetMain: number;
  offsetCross: number;
  /** How the node hangs from its parent. */
  kind: AndesOrgChartLinkKind;
  /** For tree links: main position of the fork, relative to the parent's top. */
  fork: number;
  /** For assistant and stack links: cross position of the stem, relative to the parent. */
  stem: number;
  /** For assistant and stack links: the side of the stem the card is on (-1 start, 1 end). */
  side: number;
  left: Contour;
  right: Contour;
  readonly children: Frame[];
}

interface Resolved {
  readonly nodeGap: number;
  readonly subtreeGap: number;
  readonly levelGap: number;
  readonly leafLayout: AndesOrgChartLeafLayout;
  readonly leafLayoutMinCount: number;
  readonly hangingIndent: number;
  /**
   * How far a card's contour reaches above and below the card: half a level gap. Two cards of
   * neighbouring subtrees therefore never come closer than a level gap along the main axis
   * either, and no card can slide into the strip where a parent's connectors fork.
   */
  readonly margin: number;
}

function finite(value: number | undefined, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
    ? value
    : fallback;
}

/** Moves a child's contour into its parent's frame; it no longer describes a root card there. */
function shift(contour: Contour, main: number, cross: number): Step[] {
  return contour.map((step) => ({
    start: step.start + main,
    end: step.end + main,
    value: step.value + cross,
    root: false,
  }));
}

/**
 * Combines two contours that share a main axis. Where both have a step the `pick` decides which
 * value wins (min for a start contour, max for an end contour); elsewhere whichever exists is kept.
 */
function combine(
  a: Contour,
  b: Contour,
  pick: (x: number, y: number) => number,
): Step[] {
  if (a.length === 0) {
    return [...b];
  }
  if (b.length === 0) {
    return [...a];
  }
  const cuts = new Set<number>();
  for (const step of a) {
    cuts.add(step.start).add(step.end);
  }
  for (const step of b) {
    cuts.add(step.start).add(step.end);
  }
  const points = [...cuts].sort((x, y) => x - y);
  const out: Step[] = [];
  let i = 0;
  let j = 0;
  for (let k = 0; k < points.length - 1; k++) {
    const start = points[k];
    const end = points[k + 1];
    while (i < a.length && a[i].end <= start) {
      i++;
    }
    while (j < b.length && b[j].end <= start) {
      j++;
    }
    const fromA = i < a.length && a[i].start <= start ? a[i] : null;
    const fromB = j < b.length && b[j].start <= start ? b[j] : null;
    let value: number;
    let root: boolean;
    if (fromA && fromB) {
      value = pick(fromA.value, fromB.value);
      root = value === fromA.value ? fromA.root : fromB.root;
    } else if (fromA || fromB) {
      const only = (fromA ?? fromB) as Step;
      value = only.value;
      root = only.root;
    } else {
      continue;
    }
    const last = out[out.length - 1];
    if (
      last &&
      last.end === start &&
      last.value === value &&
      last.root === root
    ) {
      out[out.length - 1] = { ...last, end };
    } else {
      out.push({ start, end, value, root });
    }
  }
  return out;
}

/**
 * Smallest cross distance between two shapes placed one after the other so that, over every
 * stretch of the main axis they share, `next` starts at least a gap after `previous` ends.
 * `previousEnd` is the end contour of what is already placed; `nextStart` is the start contour
 * of the shape being placed, relative to its own origin.
 */
function separation(
  previousEnd: Contour,
  nextStart: Contour,
  gaps: { readonly sibling: number; readonly subtree: number },
): number {
  let needed = Number.NEGATIVE_INFINITY;
  let i = 0;
  let j = 0;
  while (i < previousEnd.length && j < nextStart.length) {
    const a = previousEnd[i];
    const b = nextStart[j];
    if (a.start < b.end && b.start < a.end) {
      const gap = a.root && b.root ? gaps.sibling : gaps.subtree;
      needed = Math.max(needed, a.value + gap - b.value);
    }
    if (a.end <= b.end) {
      i++;
    } else {
      j++;
    }
  }
  return needed === Number.NEGATIVE_INFINITY ? 0 : needed;
}

interface Shape {
  readonly left: Contour;
  readonly right: Contour;
}

interface Gaps {
  readonly sibling: number;
  readonly subtree: number;
}

function extreme(
  contour: Contour,
  pick: (a: number, b: number) => number,
): number {
  let value = contour.length ? contour[0].value : 0;
  for (const step of contour) {
    value = pick(value, step.value);
  }
  return value;
}

/**
 * Places shapes from the first to the last, each as close to the ones before it as the gaps
 * allow. A shape is first set against its direct neighbour, then checked against the shapes
 * further back; when one of those pushes it further, the push is shared out evenly over the
 * shapes in between, so small subtrees between two large ones end up evenly spaced instead of
 * clumped against the first. Moving the shapes in between by a growing fraction of the push
 * only ever widens their gaps, so no constraint that held before is broken.
 */
function packForward(shapes: readonly Shape[], gaps: Gaps): number[] {
  const count = shapes.length;
  const positions = new Array<number>(count).fill(0);
  if (count === 0) {
    return positions;
  }
  const reach = shapes.map((shape) => extreme(shape.right, Math.max));
  const lowest = shapes.map((shape) => extreme(shape.left, Math.min));
  const widestGap = Math.max(gaps.sibling, gaps.subtree);
  // furthest[k]: how far towards the cross end any of the shapes 0..k reaches.
  const furthest = new Array<number>(count);
  furthest[0] = reach[0];
  for (let next = 1; next < count; next++) {
    const left = shapes[next].left;
    let position =
      positions[next - 1] + separation(shapes[next - 1].right, left, gaps);
    for (let back = next - 2; back >= 0; back--) {
      if (furthest[back] + widestGap - lowest[next] <= position) {
        break; // Nothing at or before `back` reaches far enough to matter.
      }
      const needed =
        positions[back] + separation(shapes[back].right, left, gaps);
      if (needed > position) {
        const push = needed - position;
        position = needed;
        const span = next - back;
        for (let between = back + 1; between < next; between++) {
          positions[between] += (push * (between - back)) / span;
          furthest[between] = Math.max(
            furthest[between - 1],
            positions[between] + reach[between],
          );
        }
      }
    }
    positions[next] = position;
    furthest[next] = Math.max(furthest[next - 1], position + reach[next]);
  }
  return positions;
}

/**
 * Places shapes along the cross axis. Returns the cross position of every shape's origin, the
 * first at 0. The result is the average of packing from the first shape and packing from the
 * last one (as a mirror image), which makes the arrangement symmetric.
 */
function pack(shapes: readonly Shape[], gaps: Gaps): number[] {
  const count = shapes.length;
  if (count === 0) {
    return [];
  }
  const forward = packForward(shapes, gaps);
  const mirrored = packForward(
    [...shapes].reverse().map((shape) => ({
      left: mirror(shape.right),
      right: mirror(shape.left),
    })),
    gaps,
  );
  const backward = mirrored.map((_, index) => -mirrored[count - 1 - index]);
  const offset = forward[0] - backward[0];
  return forward.map((value, index) => (value + backward[index] + offset) / 2);
}

/** Turns a start contour into an end contour of the mirrored shape, and back. */
function mirror(contour: Contour): Step[] {
  return contour.map((step) => ({ ...step, value: -step.value }));
}

function isLeaf(node: AndesOrgChartLayoutNode): boolean {
  return node.leaf ?? node.children.length === 0;
}

function frameOf(
  node: AndesOrgChartLayoutNode,
  vertical: boolean,
): Omit<Frame, 'children'> & { children: Frame[] } {
  const width = finite(node.width, 0);
  const height = finite(node.height, 0);
  const mainSize = vertical ? height : width;
  const crossSize = vertical ? width : height;
  return {
    node,
    mainSize,
    crossSize,
    offsetMain: 0,
    offsetCross: 0,
    kind: 'tree',
    fork: 0,
    stem: 0,
    side: 1,
    left: [],
    right: [],
    children: [],
  };
}

/** Lays out one node whose children are already done; fills in their offsets and its contours. */
function arrange(frame: Frame, options: Resolved): void {
  const { nodeGap, subtreeGap, levelGap } = options;
  const half = frame.crossSize / 2;
  const own: Step = {
    start: -options.margin,
    end: frame.mainSize + options.margin,
    value: 0,
    root: true,
  };
  let left: Step[] = [{ ...own, value: -half }];
  let right: Step[] = [{ ...own, value: half }];

  const assistants = frame.children.filter(
    (child) => child.node.assistant && isLeaf(child.node),
  );
  const regular = frame.children.filter(
    (child) => !(child.node.assistant && isLeaf(child.node)),
  );

  // Assistants: rows of up to two cards either side of the stem, below the parent.
  let next = frame.mainSize + (assistants.length ? levelGap / 2 : levelGap);
  for (let row = 0; row * 2 < assistants.length; row++) {
    const pair = assistants.slice(row * 2, row * 2 + 2);
    const rowSize = Math.max(...pair.map((child) => child.mainSize));
    pair.forEach((child, index) => {
      // The first assistant of a row goes to the end side, the second to the start side.
      const side = index === 0 ? 1 : -1;
      child.kind = 'assistant';
      child.side = side;
      child.stem = 0;
      child.offsetMain = next + (rowSize - child.mainSize) / 2;
      child.offsetCross = side * (nodeGap + child.crossSize / 2);
      const band: Step = {
        start: child.offsetMain - options.margin,
        end: child.offsetMain + child.mainSize + options.margin,
        value: 0,
        root: false,
      };
      left = combine(
        left,
        [{ ...band, value: child.offsetCross - child.crossSize / 2 }],
        Math.min,
      );
      right = combine(
        right,
        [{ ...band, value: child.offsetCross + child.crossSize / 2 }],
        Math.max,
      );
    });
    next += rowSize + nodeGap;
  }
  if (assistants.length) {
    // A full level gap below the last assistant row, so the reports' fork line keeps half a
    // level gap of air from the assistant cards instead of touching them.
    next += levelGap - nodeGap;
  }

  const stacked =
    options.leafLayout !== 'tree' &&
    regular.length >= options.leafLayoutMinCount &&
    regular.every((child) => isLeaf(child.node));

  if (regular.length === 0) {
    // Nothing more to place.
  } else if (stacked && options.leafLayout === 'hanging') {
    const stem = -half + options.hangingIndent;
    let main = next - levelGap / 2;
    for (const child of regular) {
      child.kind = 'stack';
      child.side = 1;
      child.stem = stem;
      child.offsetMain = main;
      child.offsetCross = stem + options.hangingIndent + child.crossSize / 2;
      main += child.mainSize + nodeGap;
      left = combine(left, stackStep(child, -1, options.margin), Math.min);
      right = combine(right, stackStep(child, 1, options.margin), Math.max);
    }
  } else if (stacked) {
    // Two columns: reading order fills the start column, then the end column, row by row.
    let main = next - levelGap / 2;
    for (let row = 0; row * 2 < regular.length; row++) {
      const pair = regular.slice(row * 2, row * 2 + 2);
      const rowSize = Math.max(...pair.map((child) => child.mainSize));
      pair.forEach((child, index) => {
        const side = index === 0 ? -1 : 1;
        child.kind = 'stack';
        child.side = side;
        child.stem = 0;
        child.offsetMain = main + (rowSize - child.mainSize) / 2;
        child.offsetCross = side * (nodeGap + child.crossSize / 2);
        left = combine(left, stackStep(child, -1, options.margin), Math.min);
        right = combine(right, stackStep(child, 1, options.margin), Math.max);
      });
      main += rowSize + nodeGap;
    }
  } else {
    const positions = pack(regular, { sibling: nodeGap, subtree: subtreeGap });
    const middle = (positions[0] + positions[positions.length - 1]) / 2;
    let childLeft: Step[] = [];
    let childRight: Step[] = [];
    regular.forEach((child, index) => {
      child.kind = 'tree';
      child.offsetMain = next;
      child.offsetCross = positions[index] - middle;
      child.fork = next - levelGap / 2;
      childLeft = combine(
        childLeft,
        shift(child.left, child.offsetMain, child.offsetCross),
        Math.min,
      );
      childRight = combine(
        childRight,
        shift(child.right, child.offsetMain, child.offsetCross),
        Math.max,
      );
    });
    left = combine(left, childLeft, Math.min);
    right = combine(right, childRight, Math.max);
  }

  frame.left = left;
  frame.right = right;
}

function stackStep(child: Frame, side: -1 | 1, margin: number): Step[] {
  return [
    {
      start: child.offsetMain - margin,
      end: child.offsetMain + child.mainSize + margin,
      value: child.offsetCross + (side * child.crossSize) / 2,
      root: false,
    },
  ];
}

/** Builds the frames bottom-up without recursion, so a very deep chain cannot overflow. */
function buildFrames(
  roots: readonly AndesOrgChartLayoutNode[],
  vertical: boolean,
  options: Resolved,
): Frame[] {
  const top = roots.map((root) => frameOf(root, vertical));
  const stack: { frame: Frame; visited: boolean }[] = top.map((frame) => ({
    frame,
    visited: false,
  }));
  while (stack.length) {
    const entry = stack[stack.length - 1];
    if (!entry.visited) {
      entry.visited = true;
      for (const child of entry.frame.node.children) {
        const frame = frameOf(child, vertical);
        entry.frame.children.push(frame);
        stack.push({ frame, visited: false });
      }
    } else {
      stack.pop();
      arrange(entry.frame, options);
    }
  }
  return top;
}

/**
 * Lays out a forest of cards. Several roots are placed side by side, a `subtreeGap` apart.
 * Returns each card's box and one routed link per parent-child pair.
 */
export function andesOrgChartLayout(
  roots: readonly AndesOrgChartLayoutNode[],
  options: AndesOrgChartLayoutOptions = {},
): AndesOrgChartLayout {
  const nodeGap = finite(options.nodeGap, 24);
  const resolved: Resolved = {
    nodeGap,
    subtreeGap: finite(options.subtreeGap, 40),
    levelGap: finite(options.levelGap, 56),
    leafLayout: options.leafLayout ?? 'tree',
    leafLayoutMinCount: Math.max(
      1,
      Math.floor(finite(options.leafLayoutMinCount, 2)),
    ),
    hangingIndent: finite(options.hangingIndent, nodeGap),
    margin: finite(options.levelGap, 56) / 2,
  };
  const vertical = (options.orientation ?? 'vertical') === 'vertical';
  const frames = buildFrames(roots, vertical, resolved);
  if (frames.length === 0) {
    return { boxes: new Map(), links: [], width: 0, height: 0 };
  }

  // Roots are independent trees: every pair keeps the subtree gap, even their own cards.
  const rootPositions = pack(
    frames.map((frame) => ({
      left: frame.left.map((step) => ({ ...step, root: false })),
      right: frame.right.map((step) => ({ ...step, root: false })),
    })),
    { sibling: resolved.subtreeGap, subtree: resolved.subtreeGap },
  );

  // Absolute logical positions: card top on the main axis, card center on the cross axis.
  const mainOf = new Map<Frame, number>();
  const crossOf = new Map<Frame, number>();
  const order: Frame[] = [];
  const queue: { frame: Frame; main: number; cross: number }[] = frames.map(
    (frame, index) => ({ frame, main: 0, cross: rootPositions[index] }),
  );
  for (let head = 0; head < queue.length; head++) {
    const { frame, main, cross } = queue[head];
    mainOf.set(frame, main);
    crossOf.set(frame, cross);
    order.push(frame);
    for (const child of frame.children) {
      queue.push({
        frame: child,
        main: main + child.offsetMain,
        cross: cross + child.offsetCross,
      });
    }
  }

  const rtl = !!options.rtl;
  const reversed = !!options.reversed;
  const mainSign = vertical ? (reversed ? -1 : 1) : rtl !== reversed ? -1 : 1;
  const crossSign = vertical && rtl ? -1 : 1;
  const toPoint = (main: number, cross: number): AndesOrgChartPoint =>
    vertical
      ? { x: cross * crossSign, y: main * mainSign }
      : { x: main * mainSign, y: cross * crossSign };

  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  const raw = new Map<AndesOrgChartKey, AndesOrgChartBox>();
  for (const frame of order) {
    const main = mainOf.get(frame) as number;
    const cross = crossOf.get(frame) as number;
    const a = toPoint(main, cross - frame.crossSize / 2);
    const b = toPoint(main + frame.mainSize, cross + frame.crossSize / 2);
    const box = {
      x: Math.min(a.x, b.x),
      y: Math.min(a.y, b.y),
      width: Math.abs(b.x - a.x),
      height: Math.abs(b.y - a.y),
    };
    raw.set(frame.node.key, box);
    minX = Math.min(minX, box.x);
    minY = Math.min(minY, box.y);
    maxX = Math.max(maxX, box.x + box.width);
    maxY = Math.max(maxY, box.y + box.height);
  }

  const round = (value: number): number => Math.round(value * 100) / 100;
  const place = (point: AndesOrgChartPoint): AndesOrgChartPoint => ({
    x: round(point.x - minX),
    y: round(point.y - minY),
  });

  const boxes = new Map<AndesOrgChartKey, AndesOrgChartBox>();
  for (const [key, box] of raw) {
    boxes.set(key, {
      x: round(box.x - minX),
      y: round(box.y - minY),
      width: box.width,
      height: box.height,
    });
  }

  const links: AndesOrgChartLayoutLink[] = [];
  for (const parent of order) {
    const pMain = mainOf.get(parent) as number;
    const pCross = crossOf.get(parent) as number;
    const pEnd = pMain + parent.mainSize;
    for (const child of parent.children) {
      const cMain = mainOf.get(child) as number;
      const cCross = crossOf.get(child) as number;
      let route: [number, number][];
      if (child.kind === 'tree') {
        const fork = pMain + child.fork;
        route = [
          [pEnd, pCross],
          [fork, pCross],
          [fork, cCross],
          [cMain, cCross],
        ];
      } else {
        const stem = pCross + child.stem;
        const middle = cMain + child.mainSize / 2;
        const edge = cCross - (child.side * child.crossSize) / 2;
        route = [
          [pEnd, stem],
          [middle, stem],
          [middle, edge],
        ];
      }
      links.push({
        from: parent.node.key,
        to: child.node.key,
        kind: child.kind,
        points: route.map(([main, cross]) => place(toPoint(main, cross))),
      });
    }
  }

  return {
    boxes,
    links,
    width: round(maxX - minX),
    height: round(maxY - minY),
  };
}
