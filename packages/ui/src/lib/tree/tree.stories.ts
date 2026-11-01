import { JsonPipe } from '@angular/common';
import type { Meta, StoryObj } from '@storybook/angular';

import { AndesTree } from './tree';
import { AndesTreeNodeTemplate } from './tree-node-template';
import type { AndesTreeNode } from './tree-types';
import { andesTreeFromFlat } from './tree-utils';

const TREE_IMPORTS = [JsonPipe, AndesTree, AndesTreeNodeTemplate];

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
 * a glyph in its `icon`, and a tree-wide `iconTemplate` replaces them all.
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
    },
    styles: STORY_STYLES,
    template: `
      <div class="panel">
        <andes-tree aria-label="Iconos" showIcon [nodes]="nodes" [(expandedKeys)]="expanded" />
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
