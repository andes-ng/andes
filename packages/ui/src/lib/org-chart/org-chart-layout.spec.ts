import {
  andesOrgChartLinkPath,
  andesOrgChartRoundedPath,
  andesOrgChartSecondaryPath,
} from './org-chart-connectors';
import {
  andesOrgChartLayout,
  AndesOrgChartBox,
  AndesOrgChartKey,
  AndesOrgChartLayout,
  AndesOrgChartLayoutNode,
  AndesOrgChartLayoutOptions,
} from './org-chart-layout';

interface Spec {
  readonly key: AndesOrgChartKey;
  readonly width?: number;
  readonly height?: number;
  readonly assistant?: boolean;
  readonly children?: readonly Spec[];
}

function node(spec: Spec): AndesOrgChartLayoutNode {
  return {
    key: spec.key,
    width: spec.width ?? 100,
    height: spec.height ?? 40,
    assistant: spec.assistant,
    children: (spec.children ?? []).map(node),
  };
}

function leaves(
  prefix: string,
  count: number,
  size: Partial<Spec> = {},
): Spec[] {
  return Array.from({ length: count }, (_, index) => ({
    key: `${prefix}${index}`,
    ...size,
  }));
}

function layout(
  roots: Spec | readonly Spec[],
  options: AndesOrgChartLayoutOptions = {},
): AndesOrgChartLayout {
  return andesOrgChartLayout(
    (Array.isArray(roots) ? roots : [roots]).map(node),
    options,
  );
}

function box(
  result: AndesOrgChartLayout,
  key: AndesOrgChartKey,
): AndesOrgChartBox {
  const found = result.boxes.get(key);
  if (!found) {
    throw new Error(`No box for ${String(key)}`);
  }
  return found;
}

const centerX = (b: AndesOrgChartBox): number => b.x + b.width / 2;
const centerY = (b: AndesOrgChartBox): number => b.y + b.height / 2;

/** Smallest distance between any two cards, along whichever axis separates them. */
function smallestClearance(result: AndesOrgChartLayout): number {
  const all = [...result.boxes.values()];
  let smallest = Number.POSITIVE_INFINITY;
  for (let i = 0; i < all.length; i++) {
    for (let j = i + 1; j < all.length; j++) {
      const a = all[i];
      const b = all[j];
      const gapX = Math.max(b.x - (a.x + a.width), a.x - (b.x + b.width));
      const gapY = Math.max(b.y - (a.y + a.height), a.y - (b.y + b.height));
      smallest = Math.min(smallest, Math.max(gapX, gapY));
    }
  }
  return smallest;
}

/** A random but repeatable tree (a small linear congruential generator). */
function generate(count: number, maxChildren: number, seed = 7): Spec {
  let state = seed;
  const random = (): number => {
    state = (state * 1103515245 + 12345) % 2147483648;
    return state / 2147483648;
  };
  interface Mutable {
    key: string;
    width: number;
    height: number;
    children: Mutable[];
  }
  const root: Mutable = { key: 'n0', width: 120, height: 48, children: [] };
  const open: Mutable[] = [root];
  let made = 1;
  while (made < count && open.length) {
    const parent = open.shift() as Mutable;
    const children = 1 + Math.floor(random() * maxChildren);
    for (let index = 0; index < children && made < count; index++) {
      const child: Mutable = {
        key: `n${made++}`,
        width: 80 + Math.floor(random() * 80),
        height: 32 + Math.floor(random() * 48),
        children: [],
      };
      parent.children.push(child);
      open.push(child);
    }
  }
  return root;
}

describe('andesOrgChartLayout', () => {
  describe('basic shapes', () => {
    it('returns an empty layout for no roots', () => {
      const result = andesOrgChartLayout([]);
      expect(result.boxes.size).toBe(0);
      expect(result.links).toEqual([]);
      expect(result.width).toBe(0);
      expect(result.height).toBe(0);
    });

    it('puts a lone card at the origin with its own size', () => {
      const result = layout({ key: 'a', width: 120, height: 60 });
      expect(box(result, 'a')).toEqual({ x: 0, y: 0, width: 120, height: 60 });
      expect(result.width).toBe(120);
      expect(result.height).toBe(60);
      expect(result.links).toEqual([]);
    });

    it('centers a single child under its parent, one level gap below', () => {
      const result = layout(
        { key: 'p', width: 200, children: [{ key: 'c', width: 80 }] },
        { levelGap: 50 },
      );
      expect(centerX(box(result, 'c'))).toBe(centerX(box(result, 'p')));
      expect(box(result, 'c').y).toBe(40 + 50);
    });

    it('keeps siblings exactly one node gap apart and the parent centered over them', () => {
      const result = layout(
        { key: 'p', children: leaves('c', 3) },
        { nodeGap: 30 },
      );
      const [a, b, c] = ['c0', 'c1', 'c2'].map((key) => box(result, key));
      expect(b.x - (a.x + a.width)).toBe(30);
      expect(c.x - (b.x + b.width)).toBe(30);
      expect(centerX(box(result, 'p'))).toBe((centerX(a) + centerX(c)) / 2);
    });

    it('lists siblings in reading order from the start edge', () => {
      const result = layout({ key: 'p', children: leaves('c', 4) });
      const xs = ['c0', 'c1', 'c2', 'c3'].map((key) => box(result, key).x);
      expect([...xs].sort((a, b) => a - b)).toEqual(xs);
    });
  });

  describe('wide fans and uneven depth', () => {
    it('lays a fan of 200 leaves in one row without overlap', () => {
      const result = layout(
        { key: 'p', children: leaves('c', 200) },
        { nodeGap: 10 },
      );
      expect(result.width).toBe(200 * 100 + 199 * 10);
      expect(smallestClearance(result)).toBeGreaterThanOrEqual(10 - 1e-6);
      const row = new Set(
        leaves('c', 200).map((leaf) => box(result, leaf.key).y),
      );
      expect(row.size).toBe(1);
    });

    it('separates cousins by the subtree gap and siblings by the node gap', () => {
      const result = layout(
        {
          key: 'root',
          children: [
            { key: 'a', children: leaves('a', 3) },
            { key: 'b', children: leaves('b', 3) },
          ],
        },
        { nodeGap: 20, subtreeGap: 60 },
      );
      const lastOfA = box(result, 'a2');
      const firstOfB = box(result, 'b0');
      expect(firstOfB.x - (lastOfA.x + lastOfA.width)).toBe(60);
      // The parents themselves are siblings, but their subtrees push them further apart.
      expect(box(result, 'b').x - (box(result, 'a').x + 100)).toBeGreaterThan(
        20,
      );
    });

    it('lets a shallow sibling tuck under the overhang of a deep neighbour', () => {
      const result = layout(
        {
          key: 'root',
          children: [
            {
              key: 'deep',
              children: [{ key: 'd1', children: leaves('dd', 6) }],
            },
            { key: 'shallow' },
          ],
        },
        { nodeGap: 20, subtreeGap: 40 },
      );
      // The deep subtree is wide two levels down only; its sibling sits beside its top card.
      expect(box(result, 'shallow').x - (box(result, 'deep').x + 100)).toBe(20);
      expect(smallestClearance(result)).toBeGreaterThanOrEqual(20 - 1e-6);
    });

    it('spreads small subtrees evenly between two large ones', () => {
      const big = (key: string): Spec => ({
        key,
        children: leaves(`${key}-`, 5),
      });
      const result = layout(
        {
          key: 'root',
          children: [big('L'), { key: 's1' }, { key: 's2' }, big('R')],
        },
        { nodeGap: 20, subtreeGap: 20 },
      );
      const left = box(result, 'L');
      const s1 = box(result, 's1');
      const s2 = box(result, 's2');
      const right = box(result, 'R');
      const gaps = [
        s1.x - (left.x + left.width),
        s2.x - (s1.x + s1.width),
        right.x - (s2.x + s2.width),
      ];
      expect(gaps[0]).toBeCloseTo(gaps[2], 6);
      expect(gaps[1]).toBeCloseTo(gaps[0], 6);
    });

    it('draws a tree and its mirror image as mirror images', () => {
      const spec: Spec = {
        key: 'r',
        children: [
          { key: 'a', children: [{ key: 'a1', children: leaves('a1-', 3) }] },
          { key: 'b' },
          { key: 'c', children: leaves('c', 2) },
        ],
      };
      const mirrorSpec = (s: Spec): Spec => ({
        ...s,
        children: [...(s.children ?? [])].reverse().map(mirrorSpec),
      });
      const result = layout(spec);
      const mirrored = layout(mirrorSpec(spec));
      for (const [key, b] of result.boxes) {
        const m = box(mirrored, key);
        expect(m.x).toBeCloseTo(result.width - (b.x + b.width), 6);
        expect(m.y).toBe(b.y);
      }
    });

    it('never overlaps cards in random trees with variable sizes', () => {
      for (const seed of [1, 2, 3, 4, 5]) {
        const result = layout(generate(150, 5, seed), {
          nodeGap: 12,
          subtreeGap: 24,
          levelGap: 40,
        });
        expect(result.boxes.size).toBe(150);
        expect(smallestClearance(result)).toBeGreaterThanOrEqual(12 - 1e-6);
      }
    });
  });

  describe('variable node sizes', () => {
    it('starts each child one level gap below its own parent (non-layered)', () => {
      const result = layout(
        {
          key: 'r',
          children: [
            { key: 'tall', height: 120, children: [{ key: 't1' }] },
            { key: 'short', height: 30, children: [{ key: 's1' }] },
          ],
        },
        { levelGap: 40 },
      );
      expect(box(result, 't1').y).toBe(box(result, 'tall').y + 120 + 40);
      expect(box(result, 's1').y).toBe(box(result, 'short').y + 30 + 40);
    });

    it('keeps the node gap between cards of different widths', () => {
      const result = layout(
        {
          key: 'r',
          children: [
            { key: 'w', width: 300 },
            { key: 'n', width: 40 },
            { key: 'm', width: 160 },
          ],
        },
        { nodeGap: 16 },
      );
      expect(box(result, 'n').x).toBe(box(result, 'w').x + 300 + 16);
      expect(box(result, 'm').x).toBe(box(result, 'n').x + 40 + 16);
    });
  });

  describe('compact and hanging leaves', () => {
    const team: Spec = { key: 'm', width: 120, children: leaves('e', 6) };

    it('stacks all-leaf children in two columns around a stem under the parent', () => {
      const result = layout(team, { leafLayout: 'compact', nodeGap: 20 });
      const parent = box(result, 'm');
      const stem = centerX(parent);
      for (let index = 0; index < 6; index++) {
        const card = box(result, `e${index}`);
        if (index % 2 === 0) {
          expect(card.x + card.width).toBe(stem - 20);
        } else {
          expect(card.x).toBe(stem + 20);
        }
      }
      expect(box(result, 'e0').y).toBe(box(result, 'e1').y);
      expect(box(result, 'e2').y).toBeGreaterThan(box(result, 'e0').y);
      expect(result.width).toBeLessThan(layout(team).width);
      expect(result.links.every((link) => link.kind === 'stack')).toBe(true);
    });

    it('hangs all-leaf children in one indented column', () => {
      const result = layout(team, {
        leafLayout: 'hanging',
        hangingIndent: 16,
        nodeGap: 10,
      });
      const parent = box(result, 'm');
      const ys = leaves('e', 6).map((leaf) => box(result, leaf.key).y);
      for (let index = 0; index < 6; index++) {
        expect(box(result, `e${index}`).x).toBe(parent.x + 32);
      }
      for (let index = 1; index < ys.length; index++) {
        expect(ys[index] - ys[index - 1]).toBe(40 + 10);
      }
      const link = result.links.find((entry) => entry.to === 'e3');
      expect(link?.points[0]).toEqual({
        x: parent.x + 16,
        y: parent.y + parent.height,
      });
      expect(link?.points[2].x).toBe(parent.x + 32);
    });

    it('stacks only below the minimum count and only when every child is a leaf', () => {
      const few = layout(
        { key: 'm', children: leaves('e', 2) },
        { leafLayout: 'compact', leafLayoutMinCount: 3 },
      );
      expect(few.links.every((link) => link.kind === 'tree')).toBe(true);
      const mixed = layout(
        {
          key: 'm',
          children: [
            ...leaves('e', 4),
            { key: 'boss', children: leaves('x', 1) },
          ],
        },
        { leafLayout: 'compact' },
      );
      expect(
        mixed.links
          .filter((link) => link.from === 'm')
          .every((link) => link.kind === 'tree'),
      ).toBe(true);
    });

    it('does not stack collapsed managers marked as non-leaves', () => {
      const result = andesOrgChartLayout(
        [
          {
            key: 'm',
            width: 100,
            height: 40,
            children: ['a', 'b', 'c'].map((key) => ({
              key,
              width: 100,
              height: 40,
              children: [],
              leaf: key !== 'b',
            })),
          },
        ],
        { leafLayout: 'compact' },
      );
      expect(result.links.every((link) => link.kind === 'tree')).toBe(true);
    });

    it('applies the leaf layout at every level where it fits', () => {
      const result = layout(
        {
          key: 'r',
          children: [
            { key: 'a', children: leaves('a', 4) },
            { key: 'b', children: leaves('b', 4) },
          ],
        },
        { leafLayout: 'hanging' },
      );
      expect(
        result.links
          .filter((link) => link.from === 'r')
          .map((link) => link.kind),
      ).toEqual(['tree', 'tree']);
      expect(result.links.filter((link) => link.kind === 'stack')).toHaveLength(
        8,
      );
      expect(smallestClearance(result)).toBeGreaterThan(0);
    });
  });

  describe('assistants', () => {
    it('places assistants beside the stem, between the parent and its reports', () => {
      const result = layout(
        {
          key: 'ceo',
          children: [{ key: 'asst', assistant: true }, ...leaves('vp', 3)],
        },
        { nodeGap: 20, levelGap: 60 },
      );
      const ceo = box(result, 'ceo');
      const asst = box(result, 'asst');
      expect(asst.x).toBe(centerX(ceo) + 20);
      expect(asst.y).toBeGreaterThan(ceo.y + ceo.height);
      expect(box(result, 'vp0').y).toBeGreaterThan(asst.y + asst.height);
      const link = result.links.find((entry) => entry.to === 'asst');
      expect(link?.kind).toBe('assistant');
      expect(link?.points[2]).toEqual({ x: asst.x, y: centerY(asst) });
      expect(smallestClearance(result)).toBeGreaterThan(0);
    });

    it('keeps half a level gap between the assistants and the reports fork', () => {
      const result = layout(
        {
          key: 'ceo',
          children: [{ key: 'asst', assistant: true }, ...leaves('vp', 2)],
        },
        { levelGap: 60 },
      );
      const asst = box(result, 'asst');
      const fork = result.links.find((link) => link.to === 'vp0')?.points[1];
      expect(fork?.y).toBe(asst.y + asst.height + 30);
      expect(box(result, 'vp0').y).toBe(asst.y + asst.height + 60);
    });

    it('alternates assistants between the two sides of the stem', () => {
      const result = layout({
        key: 'ceo',
        children: [
          { key: 'a1', assistant: true },
          { key: 'a2', assistant: true },
          { key: 'a3', assistant: true },
          { key: 'vp' },
        ],
      });
      const stem = centerX(box(result, 'ceo'));
      expect(box(result, 'a1').x).toBeGreaterThan(stem);
      expect(box(result, 'a2').x + 100).toBeLessThan(stem);
      expect(box(result, 'a3').y).toBeGreaterThan(box(result, 'a1').y);
      expect(smallestClearance(result)).toBeGreaterThan(0);
    });

    it('lays out an assistant with reports of its own as a regular child', () => {
      const result = layout({
        key: 'ceo',
        children: [
          { key: 'a', assistant: true, children: [{ key: 'x' }] },
          { key: 'b' },
        ],
      });
      expect(result.links.find((link) => link.to === 'a')?.kind).toBe('tree');
    });

    it('keeps a neighbour clear of an assistant band', () => {
      const result = layout({
        key: 'r',
        children: [
          {
            key: 'm',
            children: [
              { key: 'a1', assistant: true, width: 220 },
              { key: 'a2', assistant: true, width: 220 },
              { key: 'x' },
            ],
          },
          { key: 'n', children: leaves('n', 2) },
        ],
      });
      expect(smallestClearance(result)).toBeGreaterThanOrEqual(24 - 1e-6);
    });
  });

  describe('orientation, direction and roots', () => {
    const spec: Spec = {
      key: 'r',
      children: [{ key: 'a' }, { key: 'b' }],
    };

    it('swaps the axes in a horizontal chart', () => {
      const result = layout(spec, { orientation: 'horizontal', levelGap: 50 });
      expect(box(result, 'r').x).toBe(0);
      expect(box(result, 'a').x).toBe(100 + 50);
      expect(box(result, 'b').y).toBeGreaterThan(box(result, 'a').y);
      expect(centerY(box(result, 'r'))).toBe(
        (centerY(box(result, 'a')) + centerY(box(result, 'b'))) / 2,
      );
    });

    it('mirrors sibling order in a right-to-left vertical chart', () => {
      const result = layout(spec, { rtl: true });
      expect(box(result, 'a').x).toBeGreaterThan(box(result, 'b').x);
      expect(box(result, 'r').y).toBe(0);
    });

    it('grows towards the left in a right-to-left horizontal chart', () => {
      const result = layout(spec, { orientation: 'horizontal', rtl: true });
      expect(box(result, 'r').x).toBeGreaterThan(box(result, 'a').x);
      expect(box(result, 'a').y).toBeLessThan(box(result, 'b').y);
    });

    it('puts the root at the far end when reversed', () => {
      const vertical = layout(spec, { reversed: true });
      expect(box(vertical, 'r').y).toBeGreaterThan(box(vertical, 'a').y);
      const horizontal = layout(spec, {
        orientation: 'horizontal',
        reversed: true,
      });
      expect(box(horizontal, 'r').x).toBeGreaterThan(box(horizontal, 'a').x);
      const both = layout(spec, {
        orientation: 'horizontal',
        reversed: true,
        rtl: true,
      });
      expect(box(both, 'r').x).toBeLessThan(box(both, 'a').x);
    });

    it('swaps width and height into the main and cross axes', () => {
      const result = layout(
        {
          key: 'r',
          width: 200,
          height: 20,
          children: [{ key: 'c', width: 50, height: 90 }],
        },
        { orientation: 'horizontal', levelGap: 10 },
      );
      expect(box(result, 'c')).toEqual({ x: 210, y: 0, width: 50, height: 90 });
      expect(box(result, 'r').y).toBe(35);
    });

    it('places several roots side by side, a subtree gap apart', () => {
      const result = layout([{ key: 'x' }, { key: 'y' }], { subtreeGap: 70 });
      expect(box(result, 'y').x - (box(result, 'x').x + 100)).toBe(70);
      expect(box(result, 'x').y).toBe(box(result, 'y').y);
    });
  });

  describe('links', () => {
    it('routes a tree link from the parent edge through the fork to the child edge', () => {
      const result = layout(
        { key: 'p', children: leaves('c', 2) },
        { levelGap: 40 },
      );
      const parent = box(result, 'p');
      const child = box(result, 'c1');
      const link = result.links.find((entry) => entry.to === 'c1');
      expect(link?.from).toBe('p');
      expect(link?.kind).toBe('tree');
      expect(link?.points).toEqual([
        { x: centerX(parent), y: 40 },
        { x: centerX(parent), y: 60 },
        { x: centerX(child), y: 60 },
        { x: centerX(child), y: 80 },
      ]);
    });

    it('routes links along the chart in a reversed horizontal layout too', () => {
      const result = layout(
        { key: 'p', children: [{ key: 'c' }] },
        { orientation: 'horizontal', reversed: true, levelGap: 40 },
      );
      const link = result.links[0];
      const parent = box(result, 'p');
      const child = box(result, 'c');
      expect(link.points[0]).toEqual({ x: parent.x, y: centerY(parent) });
      expect(link.points[3]).toEqual({
        x: child.x + child.width,
        y: centerY(child),
      });
    });

    it('emits one link per visible parent-child pair', () => {
      const result = layout(generate(300, 4));
      expect(result.links).toHaveLength(299);
    });
  });

  describe('robustness and timing', () => {
    it('handles a very deep chain without recursion limits', () => {
      let chain: AndesOrgChartLayoutNode = {
        key: 'd0',
        width: 100,
        height: 40,
        children: [],
      };
      for (let index = 1; index < 3000; index++) {
        chain = { key: `d${index}`, width: 100, height: 40, children: [chain] };
      }
      const result = andesOrgChartLayout([chain]);
      expect(result.boxes.size).toBe(3000);
      expect(result.width).toBe(100);
    });

    it('treats missing or negative sizes as zero instead of failing', () => {
      const result = andesOrgChartLayout([
        { key: 'a', width: Number.NaN, height: -4, children: [] },
      ]);
      expect(box(result, 'a')).toEqual({ x: 0, y: 0, width: 0, height: 0 });
    });

    for (const [count, budget] of [
      [1000, 250],
      [5000, 1000],
    ] as const) {
      it(`lays out ${count} nodes within ${budget}ms`, () => {
        const roots = [node(generate(count, 8))];
        andesOrgChartLayout(roots); // warm up the JIT
        const started = performance.now();
        const result = andesOrgChartLayout(roots, { leafLayout: 'compact' });
        const elapsed = performance.now() - started;
        expect(result.boxes.size).toBe(count);
        expect(elapsed).toBeLessThan(budget);
      });
    }
  });
});

describe('connector paths', () => {
  const route = [
    { x: 50, y: 40 },
    { x: 50, y: 60 },
    { x: 150, y: 60 },
    { x: 150, y: 80 },
  ];

  it('rounds the corners of an elbow with quadratic curves', () => {
    expect(andesOrgChartLinkPath(route, 'tree', 'elbow', 8)).toBe(
      'M50 40 L50 52 Q50 60 58 60 L142 60 Q150 60 150 68 L150 80',
    );
  });

  it('clamps the radius to half of the shorter segment', () => {
    expect(andesOrgChartRoundedPath(route, 50)).toBe(
      'M50 40 L50 50 Q50 60 60 60 L140 60 Q150 60 150 70 L150 80',
    );
  });

  it('draws a straight tree link as one line and a curved one as an S-curve', () => {
    expect(andesOrgChartLinkPath(route, 'tree', 'straight', 8)).toBe(
      'M50 40 L150 80',
    );
    expect(andesOrgChartLinkPath(route, 'tree', 'curved', 8)).toBe(
      'M50 40 C50 60 150 60 150 80',
    );
  });

  it('runs straight and curved links down the stem past the assistants first', () => {
    const long = [
      { x: 50, y: 40 },
      { x: 50, y: 140 },
      { x: 150, y: 140 },
      { x: 150, y: 160 },
    ];
    expect(andesOrgChartLinkPath(long, 'tree', 'straight', 8)).toBe(
      'M50 40 L50 120 L150 160',
    );
    expect(andesOrgChartLinkPath(long, 'tree', 'curved', 8)).toBe(
      'M50 40 L50 120 C50 140 150 140 150 160',
    );
  });

  it('keeps the stem of stacked links in every style', () => {
    const stack = [
      { x: 10, y: 40 },
      { x: 10, y: 100 },
      { x: 30, y: 100 },
    ];
    expect(andesOrgChartLinkPath(stack, 'stack', 'straight', 8)).toBe(
      'M10 40 L10 100 L30 100',
    );
    expect(andesOrgChartLinkPath(stack, 'stack', 'elbow', 8)).toContain(
      'Q10 100',
    );
  });

  it('drops repeated points and returns nothing for an empty route', () => {
    expect(andesOrgChartRoundedPath([], 4)).toBe('');
    expect(
      andesOrgChartRoundedPath(
        [
          { x: 0, y: 0 },
          { x: 0, y: 0 },
          { x: 0, y: 10 },
        ],
        4,
      ),
    ).toBe('M0 0 L0 10');
  });

  it('bows a secondary link between cards on different levels', () => {
    const d = andesOrgChartSecondaryPath(
      { x: 0, y: 0, width: 100, height: 40 },
      { x: 100, y: 200, width: 100, height: 40 },
    );
    expect(d.startsWith('M50 40 C')).toBe(true);
    expect(d.endsWith('150 200')).toBe(true);
  });

  it('arcs a secondary link between cards on the same level over the row', () => {
    const d = andesOrgChartSecondaryPath(
      { x: 0, y: 100, width: 100, height: 40 },
      { x: 400, y: 100, width: 100, height: 40 },
    );
    expect(d).toBe('M100 120 C100 40 400 40 400 120');
  });
});
