import type { Meta, StoryObj } from '@storybook/angular';

import { AndesButton } from '../button/button';
import { AndesInput } from '../input/input';
import { AndesTree } from './tree';
import { AndesTreeNodeTemplate } from './tree-node-template';
import type {
  AndesTreeKey,
  AndesTreeLoadData,
  AndesTreeNode,
} from './tree-types';

const TREE_IMPORTS = [
  AndesTree,
  AndesTreeNodeTemplate,
  AndesButton,
  AndesInput,
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
          <andes-tree aria-label="Carga bajo demanda" [(nodes)]="nodes" [(expandedKeys)]="expanded" [loadData]="loadData" />
        </div>
      `,
    };
  },
};

/**
 * Drag a node onto another: the top and bottom quarter of a row drop before or after it, the
 * middle drops inside. Without a pointer, Alt + arrow keys move the focused node: Up and Down past
 * a sibling, Right into the sibling above, Left out to the parent's level. The `nodeDrop` output
 * reports each move and `nodes` already holds the result.
 */
export const DragAndDrop: Story = {
  render: () => ({
    moduleMetadata: { imports: TREE_IMPORTS },
    props: {
      nodes: warehouses(),
      expanded: ['lima'],
      moves: [] as string[],
      recordMove: function (
        this: { moves: string[] },
        event: {
          dragKey: AndesTreeKey;
          position: string;
          targetKey: AndesTreeKey;
        },
      ) {
        this.moves = [
          `${String(event.dragKey)} → ${event.position} ${String(event.targetKey)}`,
          ...this.moves,
        ].slice(0, 4);
      },
    },
    styles: STORY_STYLES,
    template: `
      <div class="panel">
        <andes-tree
          aria-label="Reordenar almacenes"
          draggable
          blockNode
          [(nodes)]="nodes"
          [(expandedKeys)]="expanded"
          (nodeDrop)="recordMove($event)"
        />
        <p class="caption">Alt + arrow keys moves the focused node.</p>
        <p class="caption">{{ moves.length ? moves.join('  ·  ') : 'No moves yet' }}</p>
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

/** Arrow keys, indentation and the switcher all mirror in a right-to-left layout. */
export const RightToLeft: Story = {
  render: () => ({
    moduleMetadata: { imports: TREE_IMPORTS },
    props: { nodes: warehouses() },
    styles: STORY_STYLES,
    template: `
      <div class="panel" dir="rtl">
        <andes-tree aria-label="Almacenes" showLine defaultExpandAll [nodes]="nodes" />
      </div>
    `,
  }),
};
