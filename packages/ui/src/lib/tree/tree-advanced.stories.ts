import type { Meta, StoryObj } from '@storybook/angular';

import { AndesButton } from '../button/button';
import { AndesInput } from '../input/input';
import { AndesSelect } from '../select/select';
import { AndesSwitch } from '../switch/switch';
import { AndesTree } from './tree';
import { AndesTreeNodeTemplate } from './tree-node-template';
import type {
  AndesTreeDragEvent,
  AndesTreeDropEvent,
  AndesTreeDropInfo,
  AndesTreeKey,
  AndesTreeLoadData,
  AndesTreeNode,
} from './tree-types';
import { andesMoveTreeNode } from './tree-utils';

const TREE_IMPORTS = [
  AndesTree,
  AndesTreeNodeTemplate,
  AndesButton,
  AndesInput,
  AndesSelect,
  AndesSwitch,
];

/** Layout helpers for the demo panels; the search boxes are the library's own `andes-input`. */
const STORY_STYLES = [
  `
  .panel {
    box-sizing: border-box;
    width: 360px;
    padding: 12px;
    border: 1px solid var(--andes-color-border);
    border-radius: var(--andes-radius-md, 0.375rem);
    background: var(--andes-color-background);
    color: var(--andes-color-foreground);
    font-family: var(--andes-font-family), sans-serif;
    font-size: 0.875rem;
    line-height: 1.375rem;
  }
  .row { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; }
  .field { display: block; margin-bottom: 12px; }
  .caption { margin: 12px 0 0; color: var(--andes-color-muted-foreground); font-size: 0.75rem; line-height: 1.25rem; }
  .caption code { font-size: inherit; }
  .controls { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 16px; margin-bottom: 12px; }
  .log { margin: 8px 0 0; padding: 0; list-style: none; color: var(--andes-color-muted-foreground); font-size: 0.75rem; line-height: 1.25rem; }
  `,
];

function warehouses(): AndesTreeNode[] {
  return [
    {
      key: 'lima',
      title: 'Almacén Lima',
      children: [
        {
          key: 'lima-a',
          title: 'Zona A · Abarrotes',
          children: [
            { key: 'lima-a-1', title: 'Pasillo 1 · Granos' },
            { key: 'lima-a-2', title: 'Pasillo 2 · Conservas' },
            { key: 'lima-a-3', title: 'Pasillo 3 · Bebidas' },
          ],
        },
        {
          key: 'lima-b',
          title: 'Zona B · Refrigerados',
          children: [
            { key: 'lima-b-1', title: 'Cámara 1 · Lácteos' },
            { key: 'lima-b-2', title: 'Cámara 2 · Congelados' },
          ],
        },
        { key: 'lima-c', title: 'Zona C · Devoluciones' },
      ],
    },
    {
      key: 'arequipa',
      title: 'Almacén Arequipa',
      children: [
        { key: 'arequipa-a', title: 'Zona A · General' },
        { key: 'arequipa-b', title: 'Zona B · Mayorista' },
      ],
    },
    {
      key: 'cusco',
      title: 'Almacén Cusco',
      children: [{ key: 'cusco-a', title: 'Zona A · General' }],
    },
    { key: 'transito', title: 'En tránsito' },
  ];
}

function large(groups: number, perGroup: number): AndesTreeNode[] {
  return Array.from({ length: groups }, (_, g) => ({
    key: `g${g}`,
    title: `Categoría ${g + 1}`,
    children: Array.from({ length: perGroup }, (__, i) => ({
      key: `g${g}-${i}`,
      title: `Producto ${g + 1}-${String(i + 1).padStart(3, '0')}`,
    })),
  }));
}

const REGIONS = ['Lima', 'Arequipa', 'Cusco', 'Piura', 'Trujillo', 'Iquitos'];

/** Three levels deep: region › warehouse › product, a few thousand nodes. */
function nested(): AndesTreeNode[] {
  return REGIONS.map((region, r) => ({
    key: `r${r}`,
    title: `Región ${region}`,
    children: Array.from({ length: 8 }, (_, w) => ({
      key: `r${r}-w${w}`,
      title: `Almacén ${region} ${w + 1}`,
      children: Array.from({ length: 60 }, (__, p) => ({
        key: `r${r}-w${w}-p${p}`,
        title: `SKU ${r + 1}${w + 1}-${String(p + 1).padStart(3, '0')}`,
      })),
    })),
  }));
}

const meta: Meta<AndesTree> = {
  title: 'Data Display/Tree/Advanced/Behavior',
  component: AndesTree,
  parameters: { layout: 'centered' },
};

export default meta;

type Story = StoryObj<AndesTree>;

/**
 * Filtering. A `filter` keeps the matching nodes and their ancestors, opens the path to each match
 * and marks it; case and accents are ignored ("almacen" finds "Almacén"). The second tree sets
 * `filterMode="highlight"`, which keeps every node in place and only marks the matches. The
 * search text is kept in `searchText` and `highlightText` so Storybook does not forward it onto the
 * tree's own `filter` input.
 */
export const Filtering: Story = {
  render: () => ({
    moduleMetadata: { imports: TREE_IMPORTS },
    props: {
      nodes: warehouses(),
      searchText: '',
      highlightText: 'zona',
      expanded: [],
      highlightExpanded: [],
    },
    styles: STORY_STYLES,
    template: `
      <div style="display: flex; flex-wrap: wrap; gap: 16px; align-items: flex-start;">
        <div class="panel" style="width: 300px;">
          <andes-input
            class="field"
            type="search"
            aria-label="Search the tree"
            placeholder="Search…"
            [(value)]="searchText"
          />
          <andes-tree
            aria-label="Almacenes"
            [nodes]="nodes"
            [filter]="searchText"
            [(expandedKeys)]="expanded"
          />
        </div>
        <div class="panel" style="width: 300px;">
          <andes-input
            class="field"
            type="search"
            aria-label="Highlight in the tree"
            [(value)]="highlightText"
          />
          <andes-tree
            aria-label="Almacenes (highlight)"
            filterMode="highlight"
            [nodes]="nodes"
            [filter]="highlightText"
            [(expandedKeys)]="highlightExpanded"
          />
        </div>
      </div>
    `,
  }),
};

/**
 * `loadData` runs the first time a node without children opens. Add the children to `nodes` and
 * return (or resolve) once they are in; a spinner shows meanwhile, and a failure closes the node
 * again and reports `nodeLoadError`.
 */
export const LoadOnDemand: Story = {
  render: () => {
    const component = {
      nodes: [
        { key: 'sedes', title: 'Sedes' },
        { key: 'areas', title: 'Áreas' },
        { key: 'vacio', title: 'Sin contenido' },
      ] as AndesTreeNode[],
      expanded: [] as AndesTreeKey[],
      loadData: ((node: AndesTreeNode) =>
        new Promise<void>((resolve) => {
          setTimeout(() => {
            const children: AndesTreeNode[] =
              node.key === 'vacio'
                ? []
                : [1, 2, 3].map((n) => ({
                    key: `${String(node.key)}-${n}`,
                    title: `${String(node.title)} ${n}`,
                    // Only the first level goes deeper, so the demo ends.
                    isLeaf: String(node.key).includes('-'),
                  }));
            component.nodes = component.nodes.map((n) =>
              n.key === node.key ? { ...n, children } : n,
            );
            resolve();
          }, 900);
        })) as AndesTreeLoadData,
    };
    return {
      moduleMetadata: { imports: TREE_IMPORTS },
      props: component,
      styles: STORY_STYLES,
      template: `
        <div class="panel">
          <andes-tree aria-label="Carga bajo demanda" [nodes]="nodes" [(expandedKeys)]="expanded" [loadData]="loadData" />
        </div>
      `,
    };
  },
};

/**
 * Drag a node by its grip (or its title) onto another: the top and bottom quarter of a row drop
 * before or after it, the middle drops inside, and a closed parent opens when the pointer rests on
 * it. A line in the gap between rows, starting at the level the node would land on, shows where it
 * goes; a drop inside also tints the target. "En tránsito" cannot move (a `draggable` predicate)
 * and nothing can be dropped into it (`allowDrop`). Without a pointer, Alt + arrow keys move the
 * focused node. The tree only reports: the story applies each `nodeDrop` with `andesMoveTreeNode`
 * and lists the drag outputs below.
 */
export const DragAndDrop: Story = {
  name: 'Drag and drop',
  render: () => ({
    moduleMetadata: { imports: TREE_IMPORTS },
    props: {
      nodes: warehouses(),
      expanded: ['lima', 'lima-a'],
      grips: true,
      block: true,
      log: [] as string[],
      canDrag: (node: AndesTreeNode) => node.key !== 'transito',
      canDrop: (info: AndesTreeDropInfo) =>
        !(info.position === 'inside' && info.targetKey === 'transito'),
      pushLog: function (this: { log: string[] }, line: string) {
        this.log = [line, ...this.log].slice(0, 5);
      },
      recordDrag: function (
        this: { pushLog(line: string): void },
        type: string,
        event: AndesTreeDragEvent,
      ) {
        this.pushLog(
          `${type}: ${String(event.node['title'])}${event.position ? ` (${event.position})` : ''}`,
        );
      },
      applyDrop: function (
        this: { nodes: AndesTreeNode[]; pushLog(line: string): void },
        event: AndesTreeDropEvent,
      ) {
        this.nodes =
          andesMoveTreeNode(
            this.nodes,
            event.dragKey,
            event.targetKey,
            event.position,
          ) ?? this.nodes;
        this.pushLog(
          `drop (${event.via}): ${String(event.dragNode['title'])} ${event.position} ${String(event.targetNode['title'])}`,
        );
      },
    },
    styles: STORY_STYLES,
    template: `
      <div class="panel">
        <div class="controls">
          <andes-switch size="sm" [(checked)]="grips">dragHandle</andes-switch>
          <andes-switch size="sm" [(checked)]="block">blockNode</andes-switch>
        </div>
        <andes-tree
          aria-label="Reordenar almacenes"
          [draggable]="canDrag"
          [allowDrop]="canDrop"
          [dragHandle]="grips"
          [blockNode]="block"
          [nodes]="nodes"
          [(expandedKeys)]="expanded"
          (nodeDragStart)="recordDrag('start', $event)"
          (nodeDragEnter)="recordDrag('enter', $event)"
          (nodeDragLeave)="recordDrag('leave', $event)"
          (nodeDragEnd)="recordDrag('end', $event)"
          (nodeDrop)="applyDrop($event)"
        />
        <p class="caption">Alt + arrow keys move the focused node.</p>
        <ul class="log" aria-label="Drag events">
          @for (line of log; track $index) { <li>{{ line }}</li> } @empty { <li>No drag yet</li> }
        </ul>
      </div>
    `,
  }),
};

/**
 * A controlled tree: expanded, selected and checked keys all live in the story and are shown
 * below. The checked keys start with "Zona A · Abarrotes" alone: the tree checks its aisles and
 * half-checks "Almacén Lima", and a click writes the conducted keys back into the model.
 * `autoExpandParent` opens the ancestors of the one expanded key ("Zona B") at first and is
 * turned off on the first expand or collapse, so a parent can close again.
 */
export const Controlled: Story = {
  render: () => ({
    moduleMetadata: { imports: TREE_IMPORTS },
    props: {
      nodes: warehouses(),
      expanded: ['lima-b'] as AndesTreeKey[],
      selected: [] as AndesTreeKey[],
      checked: ['lima-a'] as AndesTreeKey[],
      autoExpand: true,
    },
    styles: STORY_STYLES,
    template: `
      <div class="panel">
        <andes-tree
          aria-label="Almacenes (controlado)"
          checkable
          [autoExpandParent]="autoExpand"
          [nodes]="nodes"
          [(expandedKeys)]="expanded"
          [(selectedKeys)]="selected"
          [(checkedKeys)]="checked"
          (nodeExpand)="autoExpand = false"
          #tree
        />
        <p class="caption">Expanded: <code>{{ expanded.join(', ') }}</code></p>
        <p class="caption">Selected: <code>{{ selected.join(', ') || '—' }}</code></p>
        <p class="caption">Checked: <code>{{ checked.join(', ') || '—' }}</code></p>
        <p class="caption">Half-checked: <code>{{ tree.halfCheckedKeys().join(', ') || '—' }}</code></p>
        <div class="controls" style="margin: 8px 0 0;">
          <andes-button size="sm" variant="outline" (click)="expanded = []; selected = []; checked = []; autoExpand = true">Clear</andes-button>
        </div>
      </div>
    `,
  }),
};

/**
 * Scrolling to a node deep in a long, virtual tree. Pick a product: the controlled way reads the
 * node's path with `getNodePath()`, opens it through `expandedKeys` and then calls
 * `scrollToKey()`; `scrollToKey()` alone also opens the closed ancestors before it scrolls.
 */
export const ScrollToNode: Story = {
  name: 'Scroll to a nested node',
  render: () => ({
    moduleMetadata: { imports: TREE_IMPORTS },
    props: {
      nodes: nested(),
      expanded: [] as AndesTreeKey[],
      target: 'r3-w5-p41',
      path: '',
      targets: [
        { value: 'r0-w2-p7', label: 'SKU 13-008 · Lima' },
        { value: 'r3-w5-p41', label: 'SKU 46-042 · Piura' },
        { value: 'r5-w7-p59', label: 'SKU 68-060 · Iquitos' },
      ],
    },
    styles: STORY_STYLES,
    template: `
      <div class="panel">
        <div class="controls">
          <andes-select size="sm" aria-label="Node to scroll to" style="width: 200px;" [options]="targets" [(value)]="target" />
          <andes-button
            size="sm"
            variant="outline"
            (click)="path = tree.getNodePath(target).join(' › '); expanded = tree.getNodePath(target).slice(0, -1); tree.scrollToKey(target, { align: 'center', focus: true })"
          >Open path and scroll</andes-button>
          <andes-button size="sm" variant="outline" (click)="tree.collapseAll(); path = ''">Collapse all</andes-button>
        </div>
        <andes-tree
          #tree
          aria-label="Catálogo"
          virtualScroll
          [height]="280"
          [nodes]="nodes"
          [(expandedKeys)]="expanded"
        />
        <p class="caption">Path: <code>{{ path || '—' }}</code></p>
      </div>
    `,
  }),
};

/**
 * `virtualScroll` renders only the rows in view, so ten thousand nodes stay light. Give the tree a
 * `height`; rows keep reporting their level and position to assistive technology.
 */
export const VirtualScroll: Story = {
  render: () => ({
    moduleMetadata: { imports: TREE_IMPORTS },
    props: {
      nodes: large(50, 200),
      expanded: ['g0', 'g1', 'g2', 'g3', 'g4', 'g5', 'g6', 'g7', 'g8', 'g9'],
    },
    styles: STORY_STYLES,
    template: `
      <div class="panel">
        <andes-tree
          aria-label="Catálogo"
          virtualScroll
          [height]="320"
          [nodes]="nodes"
          [(expandedKeys)]="expanded"
          #tree
        />
        <p class="caption">2 000 rows are open out of 10 050 nodes; only the visible ones exist in the page.</p>
        <div class="row" style="margin: 8px 0 0;">
          <andes-button size="sm" variant="outline" (click)="tree.scrollToKey('g9-150', { align: 'center' })">Scroll to Producto 10-151</andes-button>
        </div>
      </div>
    `,
  }),
};

/** `expandAll()`, `collapseAll()` and `scrollToKey()` are public methods. */
export const ImperativeApi: Story = {
  render: () => ({
    moduleMetadata: { imports: TREE_IMPORTS },
    props: { nodes: warehouses(), expanded: [] },
    styles: STORY_STYLES,
    template: `
      <div class="panel">
        <div class="row">
          <andes-button size="sm" variant="outline" (click)="tree.expandAll()">Expand all</andes-button>
          <andes-button size="sm" variant="outline" (click)="tree.collapseAll()">Collapse all</andes-button>
          <andes-button size="sm" variant="outline" (click)="tree.scrollToKey('lima-b-2', { focus: true })">Go to Cámara 2</andes-button>
        </div>
        <andes-tree #tree aria-label="Almacenes" [nodes]="nodes" [(expandedKeys)]="expanded" />
      </div>
    `,
  }),
};

/** With no nodes the tree shows an empty message, or a loading state while data is on its way. */
export const EmptyAndLoading: Story = {
  render: () => ({
    moduleMetadata: { imports: TREE_IMPORTS },
    styles: STORY_STYLES,
    template: `
      <div style="display: flex; gap: 16px; align-items: flex-start;">
        <div class="panel" style="width: 220px;"><andes-tree aria-label="Vacío" [nodes]="[]" /></div>
        <div class="panel" style="width: 220px;"><andes-tree aria-label="Cargando" loading [nodes]="[]" /></div>
        <div class="panel" style="width: 220px;"><andes-tree aria-label="Sin resultados" filter="zzz" [nodes]="[{ key: 'a', title: 'Alfa' }]" [labels]="{ empty: 'Sin resultados' }" /></div>
      </div>
    `,
  }),
};

/**
 * Arrow keys, indentation, connector lines, the switcher, the drag grips and the drop line all
 * mirror in a right-to-left layout. The tree is draggable; the story applies each drop.
 */
export const RightToLeft: Story = {
  render: () => ({
    moduleMetadata: { imports: TREE_IMPORTS },
    props: {
      nodes: warehouses(),
      applyDrop: function (
        this: { nodes: AndesTreeNode[] },
        event: AndesTreeDropEvent,
      ) {
        this.nodes =
          andesMoveTreeNode(
            this.nodes,
            event.dragKey,
            event.targetKey,
            event.position,
          ) ?? this.nodes;
      },
    },
    styles: STORY_STYLES,
    template: `
      <div class="panel" dir="rtl">
        <andes-tree
          aria-label="Almacenes"
          showLine
          draggable
          defaultExpandAll
          [nodes]="nodes"
          (nodeDrop)="applyDrop($event)"
        />
      </div>
    `,
  }),
};
