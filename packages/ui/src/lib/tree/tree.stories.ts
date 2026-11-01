import { JsonPipe } from '@angular/common';
import type { Meta, StoryObj } from '@storybook/angular';

import { AndesSegmented } from '../segmented/segmented';
import { AndesSwitch } from '../switch/switch';
import { AndesTree } from './tree';
import { AndesTreeNodeTemplate } from './tree-node-template';
import type { AndesTreeKey, AndesTreeNode } from './tree-types';
import { andesTreeFromFlat } from './tree-utils';

const TREE_IMPORTS = [
  JsonPipe,
  AndesTree,
  AndesTreeNodeTemplate,
  AndesSwitch,
  AndesSegmented,
];

/** Panel and caption styles shared by the stories. */
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
  .caption { margin: 12px 0 0; color: var(--andes-color-muted-foreground); font-size: 0.75rem; line-height: 1.25rem; }
  .caption code { font-size: inherit; }
  .controls { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 16px; margin-bottom: 12px; }
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

function permissions(): AndesTreeNode[] {
  return [
    {
      key: 'ventas',
      title: 'Ventas',
      children: [
        { key: 'ventas-ver', title: 'Ver pedidos' },
        { key: 'ventas-crear', title: 'Crear pedidos' },
        { key: 'ventas-anular', title: 'Anular pedidos' },
        {
          key: 'ventas-descuento',
          title: 'Aplicar descuentos',
          disableCheckbox: true,
        },
      ],
    },
    {
      key: 'compras',
      title: 'Compras',
      children: [
        { key: 'compras-ver', title: 'Ver órdenes' },
        { key: 'compras-aprobar', title: 'Aprobar órdenes' },
      ],
    },
    {
      key: 'finanzas',
      title: 'Finanzas',
      children: [
        {
          key: 'finanzas-tesoreria',
          title: 'Tesorería',
          children: [
            { key: 'finanzas-pagos', title: 'Registrar pagos' },
            { key: 'finanzas-conciliar', title: 'Conciliar bancos' },
          ],
        },
        { key: 'finanzas-reportes', title: 'Reportes contables' },
      ],
    },
  ];
}

function files(): AndesTreeNode[] {
  return [
    {
      key: 'reportes',
      title: 'reportes',
      children: [
        { key: 'r-2026', title: 'ventas-2026.xlsx' },
        { key: 'r-2025', title: 'ventas-2025.xlsx' },
        {
          key: 'r-archivo',
          title: 'archivo',
          children: [{ key: 'r-2024', title: 'ventas-2024.xlsx' }],
        },
      ],
    },
    {
      key: 'facturas',
      title: 'facturas',
      children: [
        { key: 'f-001', title: 'F001-000231.pdf' },
        { key: 'f-002', title: 'F001-000232.pdf' },
      ],
    },
    { key: 'leeme', title: 'leeme.txt' },
  ];
}

const meta: Meta<AndesTree> = {
  title: 'Data Display/Tree/Basics/Tree',
  component: AndesTree,
  tags: ['autodocs'],
  argTypes: {
    nodes: { control: false },
    expandedKeys: { control: false },
    selectedKeys: { control: false },
    checkedKeys: { control: false },
    loadedKeys: { control: false },
    fieldNames: { control: false },
    loadData: { control: false },
    allowDrop: { control: false },
    filterFn: { control: false },
    nodeTemplate: { control: false },
    iconTemplate: { control: false },
    labels: { control: false },
    classNames: { control: false },
    styles: { control: false },
    switcherIcon: { control: false },
    showLeafIcon: { control: 'boolean' },
    density: { control: 'select', options: ['default', 'compact'] },
    expandAction: {
      control: 'select',
      options: [undefined, 'click', 'doubleClick', false],
    },
    filterMode: { control: 'select', options: ['filter', 'highlight'] },
    height: { control: 'text' },
  },
  args: {
    defaultExpandAll: false,
    multiple: false,
    selectable: true,
    checkable: false,
    checkStrictly: false,
    showLine: false,
    showIcon: false,
    directory: false,
    blockNode: false,
    density: 'default',
    draggable: false,
    dragHandle: true,
    autoExpandParent: false,
    showLeafIcon: false,
    virtualScroll: false,
    loading: false,
  },
  parameters: { layout: 'centered' },
  render: (args) => ({
    moduleMetadata: { imports: TREE_IMPORTS },
    props: { ...args, nodes: warehouses(), expanded: ['lima'] },
    styles: STORY_STYLES,
    template: `
      <div class="panel">
        <andes-tree
          aria-label="Almacenes"
          [nodes]="nodes"
          [(expandedKeys)]="expanded"
          [defaultExpandAll]="defaultExpandAll"
          [multiple]="multiple"
          [selectable]="selectable"
          [checkable]="checkable"
          [checkStrictly]="checkStrictly"
          [showLine]="showLine"
          [showIcon]="showIcon"
          [directory]="directory"
          [blockNode]="blockNode"
          [density]="density"
          [draggable]="draggable"
          [dragHandle]="dragHandle"
          [autoExpandParent]="autoExpandParent"
          [showLeafIcon]="showLeafIcon"
          [loading]="loading"
        />
      </div>
    `,
  }),
};

export default meta;

type Story = StoryObj<AndesTree>;

/**
 * A plain tree: click a switcher to open a branch, click a title to select it. The
 * `defaultExpandAll` control opens every branch from the start.
 */
export const Default: Story = {};

/**
 * The everyday tree, checkable and selectable at once: some branches start open, one node
 * selected and two checked. "Zona B" is disabled (it still opens) and the "Cámara 2" box is
 * locked, so neither takes part in the cascade. Below the tree, what each output reported.
 */
export const Basic: Story = {
  render: () => ({
    moduleMetadata: { imports: TREE_IMPORTS },
    props: {
      nodes: (() => {
        const nodes = warehouses();
        const lima = nodes[0].children as AndesTreeNode[];
        lima[1] = { ...lima[1], disabled: true };
        const camaras = lima[1].children as AndesTreeNode[];
        camaras[1] = { ...camaras[1], disableCheckbox: true };
        return nodes;
      })(),
      expanded: ['lima', 'lima-a', 'lima-b'],
      selected: ['lima-a-2'],
      checked: ['lima-a-1', 'lima-a-3'],
      lastEvent: 'Nothing yet',
    },
    styles: STORY_STYLES,
    template: `
      <div class="panel">
        <andes-tree
          aria-label="Almacenes"
          checkable
          [nodes]="nodes"
          [(expandedKeys)]="expanded"
          [(selectedKeys)]="selected"
          [(checkedKeys)]="checked"
          (nodeSelect)="lastEvent = ($event.selected ? 'Selected ' : 'Deselected ') + $event.node.title"
          (nodeCheck)="lastEvent = ($event.checked ? 'Checked ' : 'Unchecked ') + $event.node.title"
        />
        <p class="caption">{{ lastEvent }}</p>
        <p class="caption">Selected: <code>{{ selected | json }}</code> · checked: <code>{{ checked | json }}</code></p>
      </div>
    `,
  }),
};

/**
 * Selection. In the single tree a click selects a node and a second click clears it; in the
 * multiple tree (`multiple`) a click toggles each node and Shift + click selects a range.
 * The selected keys are shown below each tree.
 */
export const Selection: Story = {
  render: () => ({
    moduleMetadata: { imports: TREE_IMPORTS },
    props: {
      nodes: warehouses(),
      singleExpanded: ['lima'],
      singleSelected: ['lima-a-2'],
      multiExpanded: ['lima', 'lima-a'],
      multiSelected: ['lima-a-1', 'lima-a-3'],
    },
    styles: STORY_STYLES,
    template: `
      <div style="display: flex; flex-wrap: wrap; gap: 16px; align-items: flex-start;">
        <div class="panel" style="width: 300px;">
          <andes-tree
            aria-label="Almacenes (single)"
            [nodes]="nodes"
            [(expandedKeys)]="singleExpanded"
            [(selectedKeys)]="singleSelected"
          />
          <p class="caption">Selected: <code>{{ singleSelected | json }}</code></p>
        </div>
        <div class="panel" style="width: 300px;">
          <andes-tree
            aria-label="Almacenes (multiple)"
            multiple
            [nodes]="nodes"
            [(expandedKeys)]="multiExpanded"
            [(selectedKeys)]="multiSelected"
          />
          <p class="caption">Selected: <code>{{ multiSelected | json }}</code></p>
        </div>
      </div>
    `,
  }),
};

/**
 * Checking cascades: a parent is checked when everything below it is, and half-checked when only
 * some of it is. A node with a locked checkbox keeps its own state and is left out of the cascade.
 * The second tree sets `checkStrictly`, which makes every node independent: no cascade up or down.
 */
export const Checkable: Story = {
  render: () => ({
    moduleMetadata: { imports: TREE_IMPORTS },
    props: {
      nodes: permissions(),
      expanded: ['ventas', 'finanzas'],
      checked: ['ventas-ver', 'compras-ver', 'compras-aprobar'],
      strictExpanded: ['ventas'],
      strictChecked: ['ventas'],
    },
    styles: STORY_STYLES,
    template: `
      <div style="display: flex; flex-wrap: wrap; gap: 16px; align-items: flex-start;">
        <div class="panel" style="width: 300px;">
          <andes-tree
            aria-label="Permisos"
            checkable
            [selectable]="false"
            [nodes]="nodes"
            [(expandedKeys)]="expanded"
            [(checkedKeys)]="checked"
            #tree
          />
          <p class="caption">Half-checked: <code>{{ tree.halfCheckedKeys() | json }}</code></p>
          <p class="caption">Checked: <code>{{ checked | json }}</code></p>
        </div>
        <div class="panel" style="width: 300px;">
          <andes-tree
            aria-label="Permisos (strict)"
            checkable
            checkStrictly
            [selectable]="false"
            [nodes]="nodes"
            [(expandedKeys)]="strictExpanded"
            [(checkedKeys)]="strictChecked"
          />
        </div>
      </div>
    `,
  }),
};

/**
 * Look of the rows, side by side. `showLine` joins a parent to its children with connector lines
 * and turns the switcher into a boxed plus / minus. `directory` is the file-browser look: icons,
 * rows that fill the width, a solid selected row, and a click on a folder opens it. `blockNode`
 * stretches each row's hover and selected background across the full width. `density="compact"`
 * drops the 4px gap between rows (24px rows instead of 28px).
 */
export const Appearance: Story = {
  render: () => ({
    moduleMetadata: { imports: TREE_IMPORTS },
    props: {
      nodes: warehouses(),
      fileNodes: files(),
      dirExpanded: ['reportes'],
      dirSelected: ['r-2026'],
      blockExpanded: ['lima'],
      blockSelected: ['lima-c'],
    },
    styles: STORY_STYLES,
    template: `
      <div style="display: flex; flex-wrap: wrap; gap: 16px; align-items: flex-start;">
        <div class="panel" style="width: 280px;">
          <p class="caption" style="margin: 0 0 8px;">showLine</p>
          <andes-tree aria-label="Almacenes (lines)" showLine defaultExpandAll [nodes]="nodes" />
        </div>
        <div class="panel" style="width: 280px;">
          <p class="caption" style="margin: 0 0 8px;">directory</p>
          <andes-tree aria-label="Archivos" directory [nodes]="fileNodes" [(expandedKeys)]="dirExpanded" [(selectedKeys)]="dirSelected" />
        </div>
        <div class="panel" style="width: 280px;">
          <p class="caption" style="margin: 0 0 8px;">blockNode</p>
          <andes-tree aria-label="Almacenes (block)" blockNode [nodes]="nodes" [(expandedKeys)]="blockExpanded" [(selectedKeys)]="blockSelected" />
        </div>
        <div class="panel" style="width: 280px;">
          <p class="caption" style="margin: 0 0 8px;">Default density</p>
          <andes-tree aria-label="Almacenes (normal)" defaultExpandAll [nodes]="nodes" />
        </div>
        <div class="panel" style="width: 280px;">
          <p class="caption" style="margin: 0 0 8px;">Compact density</p>
          <andes-tree aria-label="Almacenes (compacto)" density="compact" defaultExpandAll [nodes]="nodes" />
        </div>
      </div>
    `,
  }),
};

/**
 * `showIcon` draws a folder or a file for nodes that have no icon of their own. A node can bring
 * a glyph in its `icon`. The second tree gives every node one `iconTemplate`, which gets the node
 * context: its pin fills in while the node is selected.
 */
export const Icons: Story = {
  render: () => ({
    moduleMetadata: { imports: TREE_IMPORTS },
    props: {
      nodes: [
        {
          key: 'a',
          title: 'Almacenes',
          icon: '🏭',
          children: [
            { key: 'a1', title: 'Lima', icon: '📍' },
            { key: 'a2', title: 'Cusco' },
          ],
        },
        { key: 'b', title: 'Alertas', icon: '⚠️' },
        {
          key: 'c',
          title: 'Sin icono propio',
          children: [{ key: 'c1', title: 'Hoja' }],
        },
      ] satisfies AndesTreeNode[],
      expanded: ['a', 'c'],
      placeNodes: warehouses().slice(0, 3),
      placeExpanded: ['lima'],
      placeSelected: ['lima-b'],
    },
    styles: STORY_STYLES,
    template: `
      <div style="display: flex; flex-wrap: wrap; gap: 16px; align-items: flex-start;">
        <div class="panel" style="width: 300px;">
          <andes-tree aria-label="Iconos" showIcon [nodes]="nodes" [(expandedKeys)]="expanded" />
        </div>
        <div class="panel" style="width: 300px;">
          <ng-template #pin let-selected="selected">
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
              <path
                d="M8 14.5s4.5-4.2 4.5-7.75a4.5 4.5 0 0 0-9 0C3.5 10.3 8 14.5 8 14.5Z"
                stroke="currentColor"
                stroke-linejoin="round"
                [attr.fill]="selected ? 'currentColor' : 'none'"
              />
            </svg>
          </ng-template>
          <andes-tree
            aria-label="Ubicaciones con icono propio"
            showIcon
            [iconTemplate]="pin"
            [nodes]="placeNodes"
            [(expandedKeys)]="placeExpanded"
            [(selectedKeys)]="placeSelected"
          />
        </div>
      </div>
    `,
  }),
};

/** A disabled node cannot be selected, checked or dragged, but its branch still opens. */
export const DisabledNodes: Story = {
  render: () => ({
    moduleMetadata: { imports: TREE_IMPORTS },
    props: {
      nodes: [
        {
          key: 'a',
          title: 'Activo',
          children: [
            { key: 'a1', title: 'Hijo disponible' },
            { key: 'a2', title: 'Hijo bloqueado', disabled: true },
          ],
        },
        {
          key: 'b',
          title: 'Bloqueado con hijos',
          disabled: true,
          children: [{ key: 'b1', title: 'Hijo de un bloqueado' }],
        },
        { key: 'c', title: 'No seleccionable', selectable: false },
      ] satisfies AndesTreeNode[],
      expanded: ['a', 'b'],
    },
    styles: STORY_STYLES,
    template: `
      <div class="panel">
        <andes-tree aria-label="Estados" checkable [nodes]="nodes" [(expandedKeys)]="expanded" />
      </div>
    `,
  }),
};

/**
 * Data shape and node content. The first tree reads data with other property names through
 * `fieldNames`; the second draws the content of every node with an `andesTreeNode` template.
 * The third is built with `andesTreeFromFlat` from flat rows that name their parent (`id` /
 * `pId`), and replaces the expand arrow with a `switcherIcon` template, which turns as the
 * node opens.
 */
export const DataAndContent: Story = {
  name: 'Data and content',
  render: () => ({
    moduleMetadata: { imports: TREE_IMPORTS },
    props: {
      names: { key: 'codigo', title: 'nombre', children: 'hijos' },
      accounts: [
        {
          codigo: 100,
          nombre: 'Activo',
          hijos: [
            { codigo: 110, nombre: 'Caja y bancos' },
            { codigo: 120, nombre: 'Cuentas por cobrar' },
          ],
        },
        {
          codigo: 200,
          nombre: 'Pasivo',
          hijos: [{ codigo: 210, nombre: 'Tributos por pagar' }],
        },
      ] satisfies AndesTreeNode[],
      accountsExpanded: [100],
      stockNodes: [
        {
          key: 'lima',
          title: 'Almacén Lima',
          stock: 1240,
          children: [
            { key: 'l1', title: 'Zona A', stock: 800 },
            { key: 'l2', title: 'Zona B', stock: 440 },
          ],
        },
        { key: 'cusco', title: 'Almacén Cusco', stock: 310 },
      ] satisfies AndesTreeNode[],
      stockExpanded: ['lima'],
      flatNodes: andesTreeFromFlat([
        { id: 1, pId: null, title: 'Perú' },
        { id: 2, pId: 1, title: 'Lima' },
        { id: 3, pId: 2, title: 'Miraflores' },
        { id: 4, pId: 2, title: 'Barranco' },
        { id: 5, pId: 1, title: 'Cusco' },
      ]),
      flatExpanded: [1, 2],
    },
    styles: [
      ...STORY_STYLES,
      `.stock { margin-inline-start: 8px; padding: 0 6px; border-radius: 999px; background: var(--andes-color-muted); color: var(--andes-color-muted-foreground); font-size: 0.75rem; line-height: 1.25rem; }`,
    ],
    template: `
      <div style="display: flex; flex-wrap: wrap; gap: 16px; align-items: flex-start;">
        <div class="panel" style="width: 300px;">
          <andes-tree aria-label="Plan de cuentas" [fieldNames]="names" [nodes]="accounts" [(expandedKeys)]="accountsExpanded" />
        </div>
        <div class="panel" style="width: 300px;">
          <andes-tree aria-label="Stock" blockNode [nodes]="stockNodes" [(expandedKeys)]="stockExpanded">
            <ng-template andesTreeNode let-node let-segments="segments">
              <span>{{ node.title }}</span>
              <span class="stock">{{ node.stock }} u.</span>
            </ng-template>
          </andes-tree>
        </div>
        <div class="panel" style="width: 300px;">
          <ng-template #plus>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M6 3.5 10.5 8 6 12.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </ng-template>
          <andes-tree aria-label="Ubicaciones" [nodes]="flatNodes" [(expandedKeys)]="flatExpanded" [switcherIcon]="plus" />
        </div>
      </div>
    `,
  }),
};

/**
 * Connector lines. Every guide runs unbroken from row to row, the open box's stem leads straight
 * into its children's elbows, and each tick reaches the box of a parent or the label of a leaf.
 * `showLeafIcon` puts a file (or a template of your own) in each leaf's switcher instead, and
 * the leaf's tick stops at it. The switches and the segmented control drive the tree.
 */
export const Lines: Story = {
  render: () => ({
    moduleMetadata: { imports: TREE_IMPORTS },
    props: {
      nodes: warehouses(),
      expanded: ['lima', 'lima-a', 'lima-b', 'arequipa'],
      selected: ['lima-a-2'],
      showLine: true,
      showIcon: false,
      leafIcon: 'off',
      leafIconOptions: [
        { label: 'No leaf icon', value: 'off' },
        { label: 'File', value: 'file' },
        { label: 'Custom', value: 'custom' },
      ],
    },
    styles: STORY_STYLES,
    template: `
      <div class="panel">
        <div class="controls">
          <andes-switch size="sm" [(checked)]="showLine">showLine</andes-switch>
          <andes-switch size="sm" [(checked)]="showIcon">showIcon</andes-switch>
          <andes-segmented
            size="sm"
            aria-label="showLeafIcon"
            [options]="leafIconOptions"
            [(value)]="leafIcon"
          />
        </div>
        <ng-template #dot>
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
            <circle cx="7" cy="7" r="2.5" fill="currentColor" />
          </svg>
        </ng-template>
        <andes-tree
          aria-label="Almacenes con líneas"
          [showLine]="showLine"
          [showIcon]="showIcon"
          [showLeafIcon]="leafIcon === 'custom' ? dot : leafIcon === 'file'"
          [nodes]="nodes"
          [(expandedKeys)]="expanded"
          [(selectedKeys)]="selected"
        />
      </div>
    `,
  }),
};

/**
 * A directory tree is a file browser: folder and file icons, a row that highlights as one bar
 * across the full width on hover, a solid selected row, and a folder opens on click (or on
 * double click, chosen below). It is `multiple` here: a click selects one file, Ctrl / Cmd +
 * click adds or removes one, Shift + click selects a range; Ctrl / Cmd + Space from the keyboard.
 */
export const Directory: Story = {
  render: () => ({
    moduleMetadata: { imports: TREE_IMPORTS },
    props: {
      nodes: files(),
      expanded: ['reportes'],
      selected: ['r-2026'] as AndesTreeKey[],
      expandAction: 'click',
      actions: [
        { label: 'Open on click', value: 'click' },
        { label: 'Open on double click', value: 'doubleClick' },
      ],
    },
    styles: STORY_STYLES,
    template: `
      <div class="panel">
        <div class="controls">
          <andes-segmented size="sm" aria-label="expandAction" [options]="actions" [(value)]="expandAction" />
        </div>
        <andes-tree
          aria-label="Archivos"
          directory
          multiple
          [expandAction]="expandAction"
          [nodes]="nodes"
          [(expandedKeys)]="expanded"
          [(selectedKeys)]="selected"
        />
        <p class="caption">Selected: <code>{{ selected | json }}</code></p>
      </div>
    `,
  }),
};

/**
 * Restyling one part. `styles` sets inline styles on the tree (`root`), every row (`item`),
 * its icon (`itemIcon`) and its title (`itemTitle`); `classNames` adds classes to the same
 * parts, styled here from the story's stylesheet with `::ng-deep` because the parts live in the
 * tree's own view.
 */
export const PartStyles: Story = {
  name: 'Part classes and styles',
  render: () => ({
    moduleMetadata: { imports: TREE_IMPORTS },
    props: {
      nodes: warehouses(),
      expanded: ['lima', 'lima-a'],
      partStyles: {
        root: {
          padding: '4px',
          'border-radius': '8px',
          background: 'var(--andes-color-muted)',
        },
        itemIcon: { color: 'var(--andes-color-primary)' },
      },
      partClasses: { item: 'story-row', itemTitle: 'story-title' },
    },
    styles: [
      ...STORY_STYLES,
      `::ng-deep .story-title { font-weight: 500; letter-spacing: 0.01em; }
       ::ng-deep .story-row[data-selected] .story-title { text-decoration: underline; text-underline-offset: 3px; }`,
    ],
    template: `
      <div class="panel">
        <andes-tree
          aria-label="Almacenes con estilos propios"
          showIcon
          [styles]="partStyles"
          [classNames]="partClasses"
          [nodes]="nodes"
          [(expandedKeys)]="expanded"
        />
      </div>
    `,
  }),
};
