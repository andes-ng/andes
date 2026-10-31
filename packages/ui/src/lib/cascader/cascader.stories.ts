import { JsonPipe } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import type { Meta, StoryObj } from '@storybook/angular';

import { AndesCascader } from './cascader';
import type { AndesCascaderOption } from './cascader-types';

const IMPORTS = [AndesCascader, JsonPipe, ReactiveFormsModule];

/** Departments, provinces and districts: a realistic three-level tree. */
const PLACES: AndesCascaderOption[] = [
  {
    value: 'lima',
    label: 'Lima',
    children: [
      {
        value: 'lima-province',
        label: 'Lima',
        children: [
          { value: 'miraflores', label: 'Miraflores' },
          { value: 'san-isidro', label: 'San Isidro' },
          { value: 'surco', label: 'Santiago de Surco' },
          { value: 'barranco', label: 'Barranco', disabled: true },
        ],
      },
      {
        value: 'huaral',
        label: 'Huaral',
        children: [
          { value: 'huaral-district', label: 'Huaral' },
          { value: 'chancay', label: 'Chancay' },
        ],
      },
      { value: 'cajatambo', label: 'Cajatambo' },
    ],
  },
  {
    value: 'cusco',
    label: 'Cusco',
    children: [
      {
        value: 'cusco-province',
        label: 'Cusco',
        children: [
          { value: 'wanchaq', label: 'Wanchaq' },
          { value: 'san-blas', label: 'San Blas' },
        ],
      },
      {
        value: 'urubamba',
        label: 'Urubamba',
        children: [
          { value: 'ollantaytambo', label: 'Ollantaytambo' },
          { value: 'machu-picchu', label: 'Machu Picchu' },
        ],
      },
    ],
  },
  {
    value: 'arequipa',
    label: 'Arequipa',
    children: [
      {
        value: 'arequipa-province',
        label: 'Arequipa',
        children: [
          { value: 'cayma', label: 'Cayma' },
          { value: 'yanahuara', label: 'Yanahuara' },
        ],
      },
      { value: 'caylloma', label: 'Caylloma' },
    ],
  },
  { value: 'callao', label: 'Callao' },
];

const meta: Meta<AndesCascader> = {
  title: 'Data Entry/Cascader',
  component: AndesCascader,
  tags: ['autodocs'],
  // The panel opens below the field, so the stories sit at the top of the canvas.
  parameters: { layout: 'padded' },
  argTypes: {
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    variant: {
      control: 'select',
      options: ['outlined', 'filled', 'borderless', 'underlined'],
    },
    status: { control: 'select', options: [undefined, 'error', 'warning'] },
    expandTrigger: { control: 'select', options: ['click', 'hover'] },
    placement: {
      control: 'select',
      options: ['bottomLeft', 'bottomRight', 'topLeft', 'topRight'],
    },
    placeholder: { control: 'text' },
    disabled: { control: 'boolean' },
    allowClear: { control: 'boolean' },
    multiple: { control: 'boolean' },
    changeOnSelect: { control: 'boolean' },
    showSearch: { control: 'boolean' },
    loading: { control: 'boolean' },
  },
  args: {
    size: 'md',
    variant: 'outlined',
    status: undefined,
    expandTrigger: 'click',
    placement: 'bottomLeft',
    placeholder: 'Select a place',
    disabled: false,
    allowClear: false,
    multiple: false,
    changeOnSelect: false,
    showSearch: false,
    loading: false,
  },
  render: (args) => ({
    moduleMetadata: { imports: IMPORTS },
    props: { ...args, places: PLACES },
    template: `
      <div style="width: 300px;">
        <andes-cascader
          aria-label="Place"
          [options]="places"
          [size]="size"
          [variant]="variant"
          [status]="status"
          [expandTrigger]="expandTrigger"
          [placement]="placement"
          [placeholder]="placeholder"
          [disabled]="disabled"
          [allowClear]="allowClear"
          [multiple]="multiple"
          [changeOnSelect]="changeOnSelect"
          [showSearch]="showSearch"
          [loading]="loading"
        />
      </div>
    `,
  }),
};

export default meta;

type Story = StoryObj<AndesCascader>;

export const Default: Story = {};

export const Sizes: Story = {
  render: () => ({
    moduleMetadata: { imports: IMPORTS },
    props: { places: PLACES },
    template: `
      <div style="display: flex; flex-direction: column; gap: 1rem; width: 300px;">
        <andes-cascader aria-label="Small" size="sm" [options]="places" placeholder="Small" />
        <andes-cascader aria-label="Medium" size="md" [options]="places" placeholder="Medium" />
        <andes-cascader aria-label="Large" size="lg" [options]="places" placeholder="Large" />
      </div>
    `,
  }),
};

export const Variants: Story = {
  render: () => ({
    moduleMetadata: { imports: IMPORTS },
    props: { places: PLACES, preset: ['arequipa', 'caylloma'] },
    template: `
      <div style="display: flex; flex-direction: column; gap: 1rem; width: 300px;">
        <andes-cascader aria-label="Outlined" variant="outlined" [options]="places" [value]="preset" />
        <andes-cascader aria-label="Filled" variant="filled" [options]="places" [value]="preset" />
        <andes-cascader aria-label="Borderless" variant="borderless" [options]="places" [value]="preset" />
        <andes-cascader aria-label="Underlined" variant="underlined" [options]="places" [value]="preset" />
      </div>
    `,
  }),
};

export const States: Story = {
  render: () => ({
    moduleMetadata: { imports: IMPORTS },
    props: { places: PLACES, preset: ['callao'] },
    template: `
      <div style="display: flex; flex-direction: column; gap: 1rem; width: 300px;">
        <andes-cascader aria-label="Disabled" disabled [options]="places" [value]="preset" />
        <andes-cascader aria-label="Error" status="error" [options]="places" placeholder="Error" />
        <andes-cascader aria-label="Warning" status="warning" [options]="places" placeholder="Warning" />
        <andes-cascader aria-label="Loading" loading [options]="places" placeholder="Loading" />
      </div>
    `,
  }),
};

/**
 * Three ways to hold the value: `[(value)]` with `allowClear` and the `selectionChange`
 * event (the last change is shown under the field), and a reactive `FormControl` driven
 * from outside - set a value, toggle `disabled` - with a `<label for>` naming the field.
 */
export const Binding: Story = {
  render: () => ({
    moduleMetadata: { imports: IMPORTS },
    props: {
      places: PLACES,
      picked: ['cusco', 'urubamba', 'machu-picchu'],
      last: null,
      control: new FormControl<string[] | null>([
        'arequipa',
        'arequipa-province',
        'cayma',
      ]),
    },
    template: `
      <div style="display: flex; flex-direction: column; gap: 0.75rem; width: 320px;">
        <andes-cascader
          aria-label="Place"
          allowClear
          [options]="places"
          [(value)]="picked"
          (selectionChange)="last = $event"
        />
        <code style="font-size: 0.75rem; white-space: pre-wrap;">value: {{ picked | json }}</code>
        <code style="font-size: 0.75rem; white-space: pre-wrap;">last change: {{ last ? (last.value | json) : '-' }}</code>
        <label for="story-place" style="font-size: 0.875rem; margin-top: 0.75rem;">Delivery place</label>
        <andes-cascader id="story-place" [options]="places" [formControl]="control" allowClear />
        <div style="display: flex; gap: 0.5rem;">
          <button type="button" (click)="control.setValue(['cusco', 'cusco-province', 'wanchaq'])">Set Wanchaq</button>
          <button type="button" (click)="control.disabled ? control.enable() : control.disable()">Toggle disabled</button>
        </div>
        <code style="font-size: 0.75rem;">{{ control.value | json }} · {{ control.status }}</code>
      </div>
    `,
  }),
};

/**
 * How a selection is made: `changeOnSelect` lets any level be picked, not only a leaf, and
 * `expandTrigger="hover"` opens the next column when the pointer rests on an option.
 */
export const Expansion: Story = {
  render: () => ({
    moduleMetadata: { imports: IMPORTS },
    props: { places: PLACES, picked: null },
    template: `
      <div style="display: flex; flex-direction: column; gap: 0.75rem; width: 300px;">
        <andes-cascader aria-label="Any level" changeOnSelect [options]="places" [(value)]="picked" placeholder="Pick any level" />
        <code style="font-size: 0.75rem;">value: {{ picked | json }}</code>
        <andes-cascader aria-label="Place" expandTrigger="hover" [options]="places" placeholder="Rest on an option" />
      </div>
    `,
  }),
};

/**
 * `multiple` stores a list of paths, shown as tags. `maxTagCount` collapses the overflow
 * (second field) and `showCheckedStrategy="parent"` lists a fully checked branch as one
 * entry instead of each of its leaves (third field).
 */
export const Multiple: Story = {
  render: () => ({
    moduleMetadata: { imports: IMPORTS },
    props: {
      places: PLACES,
      picked: [
        ['lima', 'lima-province', 'miraflores'],
        ['cusco', 'cusco-province', 'wanchaq'],
      ],
      many: [
        ['lima', 'lima-province', 'miraflores'],
        ['cusco', 'cusco-province', 'wanchaq'],
        ['arequipa', 'caylloma'],
        ['callao'],
      ],
      parents: [['cusco']],
    },
    template: `
      <div style="display: flex; flex-direction: column; gap: 0.75rem; width: 380px;">
        <andes-cascader aria-label="Places" multiple allowClear [options]="places" [(value)]="picked" />
        <code style="font-size: 0.75rem; white-space: pre-wrap;">value: {{ picked | json }}</code>
        <andes-cascader aria-label="Places, max two tags" multiple [maxTagCount]="2" [options]="places" [(value)]="many" />
        <span style="font-size: 0.75rem;">Checking a whole branch lists the branch, not each of its leaves</span>
        <andes-cascader aria-label="Places, parent strategy" multiple showCheckedStrategy="parent" [options]="places" [(value)]="parents" />
        <code style="font-size: 0.75rem; white-space: pre-wrap;">value: {{ parents | json }}</code>
      </div>
    `,
  }),
};

/**
 * `showSearch` filters every path: single, `multiple`, and with a custom `filter`/`sort`/
 * `limit` object (the third field matches only the last label, lists the shortest labels
 * first and caps the list at five).
 */
export const Search: Story = {
  render: () => ({
    moduleMetadata: { imports: IMPORTS },
    props: {
      places: PLACES,
      picked: null,
      many: [['cusco', 'urubamba', 'machu-picchu']],
      search: {
        // Matches only the last label, and lists the shortest labels first.
        filter: (text: string, path: AndesCascaderOption[]) =>
          String(path[path.length - 1]['label'])
            .toLowerCase()
            .startsWith(text.toLowerCase()),
        sort: (a: AndesCascaderOption[], b: AndesCascaderOption[]) =>
          String(a[a.length - 1]['label']).length -
          String(b[b.length - 1]['label']).length,
        limit: 5,
      },
    },
    template: `
      <div style="display: flex; flex-direction: column; gap: 0.75rem; width: 380px;">
        <andes-cascader aria-label="Place" showSearch [options]="places" [(value)]="picked" placeholder="Type to search every path" />
        <code style="font-size: 0.75rem;">value: {{ picked | json }}</code>
        <andes-cascader aria-label="Places" multiple showSearch [options]="places" [(value)]="many" placeholder="Search places" />
        <andes-cascader aria-label="Place, starts with" [showSearch]="search" [options]="places" placeholder="Starts with..." />
      </div>
    `,
  }),
};

export const DisplayRender: Story = {
  render: () => ({
    moduleMetadata: { imports: IMPORTS },
    props: { places: PLACES, picked: ['lima', 'lima-province', 'surco'] },
    template: `
      <ng-template #last let-labels let-options="selectedOptions">
        <span>{{ labels[labels.length - 1] }} <span style="opacity: 0.6;">({{ options[0].label }})</span></span>
      </ng-template>
      <div style="display: flex; flex-direction: column; gap: 1rem; width: 300px;">
        <andes-cascader aria-label="Last level only" [displayRender]="last" [options]="places" [(value)]="picked" />
        <andes-cascader aria-label="Custom separator" separator=" › " [options]="places" [(value)]="picked" />
      </div>
    `,
  }),
};

export const AsyncLoading: Story = {
  render: () => ({
    moduleMetadata: { imports: IMPORTS },
    props: {
      lazyPlaces: [
        { value: 'peru', label: 'Peru' },
        { value: 'chile', label: 'Chile' },
        { value: 'bolivia', label: 'Bolivia', isLeaf: true },
      ] as AndesCascaderOption[],
      picked: null,
      loadData: async (selected: AndesCascaderOption[]) => {
        const target = selected[selected.length - 1];
        await new Promise((resolve) => setTimeout(resolve, 700));
        const prefix = String(target['value']);
        target.children = [1, 2, 3].map((n) => ({
          value: `${prefix}-${n}`,
          label: `${target['label']} ${selected.length === 1 ? 'region' : 'city'} ${n}`,
          isLeaf: selected.length >= 2,
        }));
      },
    },
    template: `
      <div style="display: flex; flex-direction: column; gap: 0.75rem; width: 320px;">
        <andes-cascader aria-label="Place" [options]="lazyPlaces" [loadData]="loadData" [(value)]="picked" placeholder="Expand to load" />
        <code style="font-size: 0.75rem;">value: {{ picked | json }}</code>
      </div>
    `,
  }),
};

/**
 * The shape of the data: a disabled option (Barranco, under Lima > Lima), `fieldNames`
 * mapping `code` / `name` / `items` onto value / label / children, and an empty list with
 * the default message and with a `notFoundContent` template.
 */
export const OptionsData: Story = {
  render: () => ({
    moduleMetadata: { imports: IMPORTS },
    props: {
      places: PLACES,
      fieldNames: { value: 'code', label: 'name', children: 'items' },
      foods: [
        {
          code: 'fruit',
          name: 'Fruit',
          items: [
            { code: 'apple', name: 'Apple' },
            { code: 'pear', name: 'Pear' },
          ],
        },
        {
          code: 'veg',
          name: 'Vegetables',
          items: [{ code: 'leek', name: 'Leek' }],
        },
      ],
    },
    template: `
      <div style="display: flex; flex-direction: column; gap: 1rem; width: 300px;">
        <andes-cascader aria-label="Place" [options]="places" placeholder="Barranco is disabled" />
        <andes-cascader aria-label="Food" [fieldNames]="fieldNames" [options]="foods" placeholder="code / name / items" />
        <andes-cascader aria-label="Empty" [options]="[]" placeholder="No options at all" />
        <ng-template #empty><em>Nothing here yet</em></ng-template>
        <andes-cascader aria-label="Custom empty" [options]="[]" [notFoundContent]="empty" placeholder="Custom empty content" />
      </div>
    `,
  }),
};

export const Placement: Story = {
  parameters: { layout: 'fullscreen' },
  render: () => ({
    moduleMetadata: { imports: IMPORTS },
    props: { places: PLACES },
    template: `
      <div style="display: flex; justify-content: space-between; align-items: flex-end; height: 22rem; padding: 1rem;">
        <andes-cascader aria-label="Opens upwards" placement="topLeft" style="width: 220px;" [options]="places" placeholder="Opens upwards" />
        <andes-cascader aria-label="Opens upwards, end" placement="topRight" style="width: 220px;" [options]="places" placeholder="Aligned to the end" />
      </div>
    `,
  }),
};
