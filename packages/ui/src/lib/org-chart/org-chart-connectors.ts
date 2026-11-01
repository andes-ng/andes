/**
 * SVG path strings for the chart's connectors. Pure functions over routed points, so the shape
 * of a connector never depends on the DOM.
 *
 * Rounded corners are quadratic curves rather than arcs: a quadratic curve keeps its shape under
 * any mirror, so the same code serves left-to-right, right-to-left and reversed charts.
 */
import type {
  AndesOrgChartBox,
  AndesOrgChartLinkKind,
  AndesOrgChartPoint,
} from './org-chart-layout';

/**
 * How a parent is joined to its children.
 *
 * - `elbow`: horizontal and vertical segments with rounded corners (the default).
 * - `straight`: one straight line from the parent to the child (stacked leaves and assistants
 *   keep their stem, with sharp corners).
 * - `curved`: a smooth S-curve from the parent to the child.
 */
export type AndesOrgChartConnectorStyle = 'elbow' | 'straight' | 'curved';

function format(value: number): string {
  return String(Math.round(value * 100) / 100);
}

function point(p: AndesOrgChartPoint): string {
  return `${format(p.x)} ${format(p.y)}`;
}

function distance(a: AndesOrgChartPoint, b: AndesOrgChartPoint): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function towards(
  from: AndesOrgChartPoint,
  to: AndesOrgChartPoint,
  length: number,
): AndesOrgChartPoint {
  const total = distance(from, to);
  if (total === 0) {
    return from;
  }
  const ratio = length / total;
  return {
    x: from.x + (to.x - from.x) * ratio,
    y: from.y + (to.y - from.y) * ratio,
  };
}

/**
 * A polyline through `points` whose corners are rounded with the given radius. The radius is
 * clamped to half of each neighbouring segment, so short segments never overshoot.
 */
export function andesOrgChartRoundedPath(
  points: readonly AndesOrgChartPoint[],
  radius: number,
): string {
  const clean = points.filter(
    (p, index) => index === 0 || distance(points[index - 1], p) > 0.01,
  );
  if (clean.length === 0) {
    return '';
  }
  if (clean.length === 1) {
    return `M${point(clean[0])}`;
  }
  let d = `M${point(clean[0])}`;
  for (let index = 1; index < clean.length - 1; index++) {
    const previous = clean[index - 1];
    const corner = clean[index];
    const following = clean[index + 1];
    const r = Math.max(
      0,
      Math.min(
        radius,
        distance(previous, corner) / 2,
        distance(corner, following) / 2,
      ),
    );
    if (r === 0) {
      d += ` L${point(corner)}`;
      continue;
    }
    d += ` L${point(towards(corner, previous, r))}`;
    d += ` Q${point(corner)} ${point(towards(corner, following, r))}`;
  }
  d += ` L${point(clean[clean.length - 1])}`;
  return d;
}

/**
 * The path of a parent-to-child connector. `points` is the route the layout produced: four
 * points for a tree link (parent, fork, fork, child), three for an assistant or a stacked leaf.
 */
export function andesOrgChartLinkPath(
  points: readonly AndesOrgChartPoint[],
  kind: AndesOrgChartLinkKind,
  style: AndesOrgChartConnectorStyle,
  radius: number,
): string {
  if (points.length < 2) {
    return '';
  }
  const first = points[0];
  const last = points[points.length - 1];
  if (kind !== 'tree') {
    // A stem with side branches reads as one structure; only its corners change with the style.
    return andesOrgChartRoundedPath(
      points,
      style === 'straight' ? 0 : style === 'curved' ? radius * 2 : radius,
    );
  }
  if (style === 'straight') {
    return `M${point(first)} L${point(last)}`;
  }
  if (style === 'curved') {
    // Control points on the fork line keep the curve leaving and entering along the main axis.
    const forkStart = points[1];
    const forkEnd = points[points.length - 2];
    return `M${point(first)} C${point(forkStart)} ${point(forkEnd)} ${point(last)}`;
  }
  return andesOrgChartRoundedPath(points, radius);
}

function center(box: AndesOrgChartBox): AndesOrgChartPoint {
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

/**
 * A secondary (dotted-line) link between two cards anywhere on the chart: a curve from the edge
 * of `from` that faces `to`, bowing away from the straight line so it does not run along the
 * tree's own connectors.
 */
export function andesOrgChartSecondaryPath(
  from: AndesOrgChartBox,
  to: AndesOrgChartBox,
): string {
  const a = center(from);
  const b = center(to);
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  if (Math.abs(dy) >= Math.abs(dx)) {
    const down = dy >= 0 ? 1 : -1;
    const start = { x: a.x, y: a.y + (down * from.height) / 2 };
    const end = { x: b.x, y: b.y - (down * to.height) / 2 };
    const bow = Math.max(24, Math.abs(dx) * 0.25);
    const middle = (start.y + end.y) / 2;
    return `M${point(start)} C${point({ x: start.x + bow, y: middle })} ${point({ x: end.x + bow, y: middle })} ${point(end)}`;
  }
  const right = dx >= 0 ? 1 : -1;
  const start = { x: a.x + (right * from.width) / 2, y: a.y };
  const end = { x: b.x - (right * to.width) / 2, y: b.y };
  const bow = Math.max(32, Math.abs(dx) * 0.2);
  const top = Math.min(start.y, end.y) - bow;
  return `M${point(start)} C${point({ x: start.x, y: top })} ${point({ x: end.x, y: top })} ${point(end)}`;
}
