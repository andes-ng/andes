import { JsonPipe } from '@angular/common';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import type { Meta, StoryObj } from '@storybook/angular';

import { AndesButton } from '../button/button';
import { AndesInput } from '../input/input';
import { AndesTreeNodeTemplate } from '../tree/tree-node-template';
import type {
  AndesTreeKey,
  AndesTreeLoadData,
  AndesTreeNode,
} from '../tree/tree-types';
import { AndesTreeSelect } from './tree-select';

const IMPORTS = [
  JsonPipe,
  ReactiveFormsModule,
  AndesTreeSelect,
  AndesTreeNodeTemplate,
];

const STORY_STYLES = [
  `
  .stack { display: flex; flex-direction: column; gap: 16px; width: 320px; color: var(--andes-color-foreground); font-family: var(--andes-font-family), sans-serif; font-size: 0.875rem; line-height: 1.375rem; }
  .label { display: block; margin-bottom: 4px; font-weight: 500; }
  .caption { margin: 0; color: var(--andes-color-muted-foreground); font-size: 0.75rem; line-height: 1.25rem; }
  .error { margin: 4px 0 0; color: var(--andes-color-danger); font-size: 0.75rem; line-height: 1.25rem; }
  `,
];

function regions(): AndesTreeNode[] {
  return [
    {
      key: 'lima',
      title: 'Lima',
      children: [
        {
          key: 'lima-centro',
          title: 'Lima Centro',
          children: [
            { key: 'lima-cercado', title: 'Cercado de Lima' },
            { key: 'lima-brena', title: 'Breña' },
          ],
        },
        { key: 'lima-sur', title: 'Lima Sur' },
        { key: 'lima-norte', title: 'Lima Norte', disabled: true },
      ],
    },
    {
      key: 'arequipa',
      title: 'Arequipa',
      children: [
        { key: 'arequipa-ciudad', title: 'Arequipa Ciudad' },
        { key: 'arequipa-camana', title: 'Camaná' },
      ],
    },
    {
      key: 'cusco',
      title: 'Cusco',
      children: [
        { key: 'cusco-ciudad', title: 'Cusco Ciudad' },
        { key: 'cusco-urubamba', title: 'Urubamba' },
      ],
    },
    { key: 'iquitos', title: 'Iquitos' },
  ];
}

const meta: Meta<AndesTreeSelect> = {
  title: 'Data Entry/Tree Select',
  component: AndesTreeSelect,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    variant: {
      control: 'select',
      options: ['outlined', 'filled', 'borderless', 'underlined'],
    },
    status: { control: 'select', options: [undefined, 'error', 'warning'] },
    placement: {
      control: 'select',
      options: ['bottomLeft', 'bottomRight', 'topLeft', 'topRight'],
    },
    showCheckedStrategy: {
      control: 'select',
      options: ['child', 'parent', 'all'],
    },
    searchPlacement: { control: 'select', options: ['panel', 'trigger'] },
    nodes: { control: false },
    value: { control: false },
    expandedKeys: { control: false },
    fieldNames: { control: false },
    loadData: { control: false },
    filterFn: { control: false },
    maxTagPlaceholder: { control: false },
    labels: { control: false },
  },
  args: {
    size: 'md',
    variant: 'outlined',
    status: undefined,
    placement: 'bottomLeft',
    placeholder: 'Select a region',
    disabled: false,
    allowClear: false,
    loading: false,
    multiple: false,
    checkable: false,
    checkStrictly: false,
    showSearch: false,
    searchPlacement: 'panel',
    showCheckedStrategy: 'child',
    treeDefaultExpandAll: false,
    matchTriggerWidth: true,
  },
  parameters: { layout: 'centered' },
  render: (args) => ({
    moduleMetadata: { imports: IMPORTS },
    props: { ...args, nodes: regions(), selected: null },
    styles: STORY_STYLES,
    template: `
      <div class="stack">
        <andes-tree-select
          aria-label="Region"
          [nodes]="nodes"
          [(value)]="selected"
          [size]="size"
          [variant]="variant"
          [status]="status"
          [placement]="placement"
          [placeholder]="placeholder"
          [disabled]="disabled"
          [allowClear]="allowClear"
          [loading]="loading"
          [multiple]="multiple"
          [checkable]="checkable"
          [checkStrictly]="checkStrictly"
          [showSearch]="showSearch"
          [searchPlacement]="searchPlacement"
          [showCheckedStrategy]="showCheckedStrategy"
          [treeDefaultExpandAll]="treeDefaultExpandAll"
          [matchTriggerWidth]="matchTriggerWidth"
        />
        <p class="caption">Value: <code>{{ selected | json }}</code></p>
      </div>
    `,
  }),
};

export default meta;

type Story = StoryObj<AndesTreeSelect>;

/** A single choice: any enabled node can be picked, parents included. */
export const Default: Story = {};

/** Heights are 24, 32 and 40px, like the other fields. */
export const Sizes: Story = {
  render: () => ({
    moduleMetadata: { imports: IMPORTS },
    props: { regionNodes: regions() },
    styles: STORY_STYLES,
    template: `
      <div class="stack">
        <andes-tree-select aria-label="Region (small)" size="sm" placeholder="Small" [nodes]="regionNodes" />
        <andes-tree-select aria-label="Region (medium)" size="md" placeholder="Medium" [nodes]="regionNodes" />
        <andes-tree-select aria-label="Region (large)" size="lg" placeholder="Large" [nodes]="regionNodes" />
      </div>
    `,
  }),
};

export const Variants: Story = {
  render: () => ({
    moduleMetadata: { imports: IMPORTS },
    props: { regionNodes: regions() },
    styles: STORY_STYLES,
    template: `
      <div class="stack">
        <andes-tree-select aria-label="Outlined" variant="outlined" placeholder="Outlined" [nodes]="regionNodes" />
        <andes-tree-select aria-label="Filled" variant="filled" placeholder="Filled" [nodes]="regionNodes" />
        <andes-tree-select aria-label="Borderless" variant="borderless" placeholder="Borderless" [nodes]="regionNodes" />
        <andes-tree-select aria-label="Underlined" variant="underlined" placeholder="Underlined" [nodes]="regionNodes" />
      </div>
    `,
  }),
};

/**
 * The states of the field: `disabled` (single and multiple), `status` as an error or a
 * warning, an empty `nodes` list (the panel shows an empty state) and `loading` (a spinner
 * in the field and in the panel).
 */
export const States: Story = {
  render: () => ({
    moduleMetadata: { imports: IMPORTS },
    props: { regionNodes: regions() },
    styles: STORY_STYLES,
    template: `
      <div class="stack">
        <andes-tree-select aria-label="Disabled" disabled value="cusco" [nodes]="regionNodes" />
        <andes-tree-select aria-label="Disabled, several" multiple disabled [value]="['cusco', 'iquitos']" [nodes]="regionNodes" />
        <andes-tree-select aria-label="Error" status="error" placeholder="Error" [nodes]="regionNodes" />
        <andes-tree-select aria-label="Warning" status="warning" placeholder="Warning" [nodes]="regionNodes" />
        <andes-tree-select aria-label="Empty" placeholder="No options" [nodes]="[]" />
        <andes-tree-select aria-label="Loading" placeholder="Loading options" loading [nodes]="[]" />
      </div>
    `,
  }),
};

/**
 * Ways to hold the value and the panel. A two-way `[(value)]` whose panel opens on the branch
 * that holds the current value; a form control, bound with `formControl` or `ngModel`, with
 * validation shown through `status`; `labelInValue`, which swaps the bare keys for
 * `{ value, label }` objects (in the value and in the events) so a selection keeps its title
 * even when its node is not loaded; and `[(open)]`, which follows the panel whoever opens or
 * closes it. `selectionChange`, `optionSelect` and `optionDeselect` report what the user did
 * (the last ones are listed under the labelled field).
 */
export const Binding: Story = {
  render: () => {
    const control = new FormControl<AndesTreeKey | null>(
      null,
      Validators.required,
    );
    return {
      moduleMetadata: { imports: [...IMPORTS, AndesButton] },
      props: {
        regionNodes: regions(),
        selected: 'cusco-urubamba' as AndesTreeKey,
        labeled: [{ value: 'iquitos', label: 'Iquitos' }],
        history: [] as string[],
        panelOpen: false,
        control,
      },
      styles: STORY_STYLES,
      template: `
        <div class="stack">
          <andes-tree-select aria-label="Region" allowClear [nodes]="regionNodes" [(value)]="selected" />
          <p class="caption">Value: <code>{{ selected | json }}</code></p>
          <div>
            <label class="label" for="region-field">Region</label>
            <andes-tree-select
              id="region-field"
              allowClear
              placeholder="Required"
              [nodes]="regionNodes"
              [formControl]="control"
              [status]="control.invalid && control.touched ? 'error' : undefined"
            />
            @if (control.invalid && control.touched) {
              <p class="error">Pick a region.</p>
            }
          </div>
          <p class="caption">Value: <code>{{ control.value | json }}</code> · {{ control.status }}</p>
          <div>
            <span class="label">labelInValue</span>
            <andes-tree-select
              aria-label="Regions, labelled"
              multiple
              labelInValue
              allowClear
              [nodes]="regionNodes"
              [(value)]="labeled"
              (optionSelect)="history = ['select ' + $any($event).label, ...history].slice(0, 3)"
              (optionDeselect)="history = ['deselect ' + $any($event).label, ...history].slice(0, 3)"
            />
            <p class="caption">Value: <code>{{ labeled | json }}</code></p>
            <p class="caption">Last events: {{ history.join(' · ') || 'none yet' }}</p>
          </div>
          <div>
            <span class="label">[(open)]</span>
            <andes-tree-select aria-label="Region, controlled panel" placeholder="Controlled panel" [nodes]="regionNodes" [(open)]="panelOpen" />
            <andes-button size="sm" variant="secondary" (click)="panelOpen = !panelOpen">{{ panelOpen ? 'Close' : 'Open' }} the panel</andes-button>
            <p class="caption">open: <code>{{ panelOpen }}</code></p>
          </div>
        </div>
      `,
    };
  },
};

/**
 * `multiple` shows each pick as a removable tag; Backspace removes the last one. Tags past
 * `maxTagCount` collapse into one tag, which `maxTagPlaceholder` can reword (second field).
 */
export const Multiple: Story = {
  render: () => ({
    moduleMetadata: { imports: IMPORTS },
    props: {
      regionNodes: regions(),
      selected: ['lima-sur', 'iquitos'] as AndesTreeKey[],
      collapsed: [
        'lima-sur',
        'iquitos',
        'cusco-ciudad',
        'arequipa-camana',
      ] as AndesTreeKey[],
      more: (omitted: { title: string }[]) => `${omitted.length} más`,
    },
    styles: STORY_STYLES,
    template: `
      <div class="stack">
        <andes-tree-select aria-label="Regions" multiple allowClear placeholder="Pick regions" [nodes]="regionNodes" [(value)]="selected" />
        <p class="caption">Value: <code>{{ selected | json }}</code></p>
        <andes-tree-select aria-label="Regions (max two tags)" multiple [maxTagCount]="2" [nodes]="regionNodes" [(value)]="collapsed" />
        <andes-tree-select aria-label="Regions (custom)" multiple [maxTagCount]="1" [maxTagPlaceholder]="more" [nodes]="regionNodes" [(value)]="collapsed" />
      </div>
    `,
  }),
};

/**
 * `checkable` shows cascading checkboxes. `showCheckedStrategy` decides what the value and the
 * tags hold when a parent is checked: only the leaves (`child`), the topmost checked nodes
 * (`parent`) or every checked node (`all`). With `checkStrictly` a parent and its children are
 * checked independently (last field).
 */
export const Checkable: Story = {
  render: () => ({
    moduleMetadata: { imports: IMPORTS },
    props: {
      regionNodes: regions(),
      child: ['cusco-ciudad'],
      parent: ['cusco', 'iquitos'],
      all: ['arequipa'],
      strict: ['lima'] as AndesTreeKey[],
    },
    styles: STORY_STYLES,
    template: `
      <div class="stack">
        <div>
          <span class="label">child (default)</span>
          <andes-tree-select aria-label="Leaves" checkable treeDefaultExpandAll [nodes]="regionNodes" [(value)]="child" />
          <p class="caption">Value: <code>{{ child | json }}</code></p>
        </div>
        <div>
          <span class="label">parent</span>
          <andes-tree-select aria-label="Topmost" checkable showCheckedStrategy="parent" [nodes]="regionNodes" [(value)]="parent" />
          <p class="caption">Value: <code>{{ parent | json }}</code></p>
        </div>
        <div>
          <span class="label">all</span>
          <andes-tree-select aria-label="Every node" checkable showCheckedStrategy="all" [nodes]="regionNodes" [(value)]="all" />
          <p class="caption">Value: <code>{{ all | json }}</code></p>
        </div>
        <div>
          <span class="label">checkStrictly</span>
          <andes-tree-select aria-label="Regions, strict" checkable checkStrictly [nodes]="regionNodes" [(value)]="strict" />
          <p class="caption">Value: <code>{{ strict | json }}</code></p>
        </div>
      </div>
    `,
  }),
};

/**
 * `showSearch` puts a search box at the top of the panel; it filters the tree, keeping the
 * ancestors of each match. `searchPlacement="trigger"` types straight into the field
 * instead, single or multiple.
 */
export const Search: Story = {
  render: () => ({
    moduleMetadata: { imports: IMPORTS },
    props: {
      regionNodes: regions(),
      inPanel: null,
      one: 'iquitos',
      many: ['lima-sur'] as AndesTreeKey[],
    },
    styles: STORY_STYLES,
    template: `
      <div class="stack">
        <andes-tree-select aria-label="Region" showSearch placeholder="Search a region" [nodes]="regionNodes" [(value)]="inPanel" />
        <andes-tree-select aria-label="Region (in the field)" showSearch searchPlacement="trigger" placeholder="Type to search" [nodes]="regionNodes" [(value)]="one" />
        <andes-tree-select aria-label="Regions (in the field)" multiple showSearch searchPlacement="trigger" placeholder="Type to search" [nodes]="regionNodes" [(value)]="many" />
      </div>
    `,
  }),
};

/** `loadData` runs the first time a node without children opens; add the children to `nodes`. */
export const LoadOnDemand: Story = {
  render: () => {
    const component = {
      lazyNodes: [
        { key: 'sedes', title: 'Sedes' },
        { key: 'areas', title: 'Áreas' },
      ] as AndesTreeNode[],
      selected: null as AndesTreeKey | null,
      loadData: ((node: AndesTreeNode) =>
        new Promise<void>((resolve) => {
          setTimeout(() => {
            const children: AndesTreeNode[] = [1, 2, 3].map((n) => ({
              key: `${String(node.key)}-${n}`,
              title: `${String(node.title)} ${n}`,
              isLeaf: true,
            }));
            component.lazyNodes = component.lazyNodes.map((n) =>
              n.key === node.key ? { ...n, children } : n,
            );
            resolve();
          }, 800);
        })) as AndesTreeLoadData,
    };
    return {
      moduleMetadata: { imports: IMPORTS },
      props: component,
      styles: STORY_STYLES,
      template: `
        <div class="stack">
          <andes-tree-select aria-label="Lazy" placeholder="Open a branch" [nodes]="lazyNodes" [loadData]="loadData" [(value)]="selected" />
        </div>
      `,
    };
  },
};

/** Data with other property names is read through `fieldNames`. */
export const FieldNames: Story = {
  render: () => ({
    moduleMetadata: { imports: IMPORTS },
    props: {
      names: { key: 'codigo', title: 'nombre', children: 'hijos' },
      accountNodes: [
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
      selected: 110,
    },
    styles: STORY_STYLES,
    template: `
      <div class="stack">
        <andes-tree-select aria-label="Cuenta" [fieldNames]="names" [nodes]="accountNodes" [(value)]="selected" />
      </div>
    `,
  }),
};

/** `treeDefaultExpandAll` opens every branch the first time options arrive. */
export const DefaultExpandAll: Story = {
  render: () => ({
    moduleMetadata: { imports: IMPORTS },
    props: { regionNodes: regions(), selected: null },
    styles: STORY_STYLES,
    template: `
      <div class="stack">
        <andes-tree-select aria-label="Region" treeDefaultExpandAll [nodes]="regionNodes" [(value)]="selected" />
      </div>
    `,
  }),
};

/**
 * An `andesTreeNode` template draws the nodes in the panel (first field). The field and the
 * panel take templates too: `tagTemplate` (its context carries `onClose`), `prefix`,
 * `suffixIcon` (`null` removes the chevron), `clearIcon`, `removeIcon` and `loadingIcon`;
 * `panelHeader` and `panelFooter` add content above and below the tree - the footer here adds a
 * region, and its field takes focus like any other - while `panelScroll` fires when the list
 * scrolls (the last field counts those events, on a long list). `matchTriggerWidth` takes a
 * width in px, and `expandAction="click"` opens a branch from a click on its row.
 */
export const CustomNodeContent: Story = {
  render: () => ({
    moduleMetadata: { imports: [...IMPORTS, AndesButton, AndesInput] },
    props: {
      stockNodes: [
        {
          key: 'a',
          title: 'Almacén Lima',
          stock: 1240,
          children: [{ key: 'a1', title: 'Zona A', stock: 800 }],
        },
        { key: 'b', title: 'Almacén Cusco', stock: 310 },
      ] satisfies AndesTreeNode[],
      regionNodes: regions(),
      longNodes: Array.from({ length: 40 }, (_, i) => ({
        key: `n${i}`,
        title: `Region ${i + 1}`,
      })) satisfies AndesTreeNode[],
      selected: null,
      many: ['lima-sur', 'iquitos'] as AndesTreeKey[],
      draft: '',
      scrolls: 0,
      add(this: { regionNodes: AndesTreeNode[]; draft: string }) {
        const title = this.draft.trim();
        if (title) {
          this.regionNodes = [
            ...this.regionNodes,
            { key: title.toLowerCase().replace(/\s+/g, '-'), title },
          ];
          this.draft = '';
        }
      },
    },
    styles: [
      ...STORY_STYLES,
      `.stock { margin-inline-start: 8px; color: var(--andes-color-muted-foreground); font-size: 0.75rem; }`,
    ],
    template: `
      <ng-template #pin>
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
      </ng-template>
      <ng-template #caret>
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m7 15 5 5 5-5M7 9l5-5 5 5"/></svg>
      </ng-template>
      <ng-template #erase>
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M3 6h18M8 6V4h8v2m-9 0 1 14h8l1-14"/></svg>
      </ng-template>
      <ng-template #hourglass>
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M6 2h12M6 22h12M7 2c0 6 10 6 10 10S7 16 7 22M17 2c0 6-10 6-10 10s10 4 10 10"/></svg>
      </ng-template>
      <ng-template #tag let-tag let-onClose="onClose">
        <span style="display: inline-flex; align-items: center; gap: 0.25rem; padding: 0 0.5rem; border-radius: var(--andes-radius-full); background: var(--andes-color-primary-subtle); color: var(--andes-color-primary);">
          {{ tag.title }}
          <andes-button variant="ghost" size="icon-xs" aria-label="Drop" (click)="onClose()">×</andes-button>
        </span>
      </ng-template>
      <ng-template #header let-search>
        <span class="caption">{{ search ? 'Results for "' + search + '"' : 'Pick a region' }}</span>
      </ng-template>
      <ng-template #footer let-close="close">
        <div style="display: flex; gap: 0.5rem; align-items: center;">
          <andes-input aria-label="New region" size="sm" placeholder="New region" [(value)]="draft" (keydown.enter)="add()" />
          <andes-button size="sm" (click)="add(); close()">Add</andes-button>
        </div>
      </ng-template>
      <div class="stack">
        <andes-tree-select aria-label="Almacén" treeDefaultExpandAll [nodes]="stockNodes" [(value)]="selected">
          <ng-template andesTreeNode let-node>
            <span>{{ node.title }}</span><span class="stock">{{ node.stock }} u.</span>
          </ng-template>
        </andes-tree-select>
        <andes-tree-select aria-label="Regions as pills" multiple [tagTemplate]="tag" [nodes]="regionNodes" [(value)]="many" />
        <andes-tree-select aria-label="Region with custom icons" allowClear [prefix]="pin" [suffixIcon]="caret" [clearIcon]="erase" [loadingIcon]="hourglass" [nodes]="regionNodes" [(value)]="selected" />
        <andes-tree-select aria-label="Regions, custom remove icon" multiple [removeIcon]="erase" [nodes]="regionNodes" [(value)]="many" />
        <andes-tree-select aria-label="Loading, custom spinner" loading [loadingIcon]="hourglass" [suffixIcon]="null" placeholder="Loading" [nodes]="regionNodes" />
        <andes-tree-select aria-label="Region with header and footer" [panelHeader]="header" [panelFooter]="footer" placeholder="Add a region from the footer" [nodes]="regionNodes" [(value)]="selected" />
        <andes-tree-select aria-label="Region, branches open on click" expandAction="click" [matchTriggerWidth]="360" [nodes]="regionNodes" placeholder="360px wide, rows expand on click" />
        <andes-tree-select aria-label="Long list" [nodes]="longNodes" (panelScroll)="scrolls = scrolls + 1" placeholder="Scroll the list" />
        <p class="caption">panel scroll events: <code>{{ scrolls }}</code></p>
      </div>
    `,
  }),
};

/**
 * The panel stays above or below the field: `topLeft` opens upwards. `defaultOpen` opens it once
 * on render, so this one is open from the start (click away to dismiss it).
 */
export const PlacementAbove: Story = {
  parameters: { layout: 'padded' },
  render: () => ({
    moduleMetadata: { imports: IMPORTS },
    props: { regionNodes: regions() },
    styles: [
      ...STORY_STYLES,
      `.bottom { display: flex; align-items: flex-end; min-height: 420px; }`,
    ],
    template: `
      <div class="bottom">
        <div class="stack">
          <andes-tree-select aria-label="Region" placement="topLeft" defaultOpen treeDefaultExpandAll [nodes]="regionNodes" />
        </div>
      </div>
    `,
  }),
};
