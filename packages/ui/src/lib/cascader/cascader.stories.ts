import { JsonPipe } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import type { Meta, StoryObj } from '@storybook/angular';

import { AndesButton } from '../button/button';
import { AndesInput } from '../input/input';
import { AndesCascader } from './cascader';
import type { AndesCascaderOption } from './cascader-types';

const IMPORTS = [AndesCascader, JsonPipe, ReactiveFormsModule];

/** Thirty departments, so a column is taller than the panel and scrolls. */
const LONG_LIST: AndesCascaderOption[] = Array.from({ length: 30 }, (_, i) => ({
  value: `dept-${i + 1}`,
  label: `Department ${i + 1}`,
  children: [
    { value: `dept-${i + 1}-a`, label: 'North' },
    { value: `dept-${i + 1}-b`, label: 'South' },
  ],
}));

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
 * Ways to hold the value and the panel. `[(value)]` with `allowClear` and the
 * `selectionChange` event (the last change is shown under the field); a reactive `FormControl`
 * driven from outside, with a `<label for>` naming the field; `[(open)]`, which follows the
 * panel whoever opens or closes it (the button, a click, Escape); `focused` / `blurred`, which
 * fire when focus enters or leaves the field (moving into the panel's own controls is not
 * leaving). `name` posts the last value of each selected path with a native `<form>`, and
 * `autoFocus` focuses the field on render.
 */
export const Binding: Story = {
  render: () => ({
    moduleMetadata: { imports: [...IMPORTS, AndesButton] },
    props: {
      places: PLACES,
      picked: ['cusco', 'urubamba', 'machu-picchu'],
      last: null,
      panelOpen: false,
      focusLog: [] as string[],
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
          <andes-button size="sm" variant="secondary" (click)="control.setValue(['cusco', 'cusco-province', 'wanchaq'])">Set Wanchaq</andes-button>
          <andes-button size="sm" variant="secondary" (click)="control.disabled ? control.enable() : control.disable()">Toggle disabled</andes-button>
        </div>
        <code style="font-size: 0.75rem;">{{ control.value | json }} · {{ control.status }}</code>

        <span style="font-size: 0.875rem; margin-top: 0.75rem;">Panel and focus</span>
        <andes-cascader
          aria-label="Place with a controlled panel"
          [options]="places"
          [(open)]="panelOpen"
          placeholder="Controlled panel"
          (focused)="focusLog = ['focused', ...focusLog].slice(0, 3)"
          (blurred)="focusLog = ['blurred', ...focusLog].slice(0, 3)"
        />
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <andes-button size="sm" variant="secondary" (click)="panelOpen = !panelOpen">{{ panelOpen ? 'Close' : 'Open' }} the panel</andes-button>
          <code style="font-size: 0.75rem;">open: {{ panelOpen }} · {{ focusLog.join(', ') || 'no focus events' }}</code>
        </div>
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
 * Tag density. `maxTagCount="responsive"` keeps the tags on one row and shows as many as fit -
 * resize the container - and the "+ N ..." tag opens a popover listing (and removing) the
 * hidden paths, on hover, click or keyboard. `maxTagPlaceholder` rewords that tag,
 * `maxTagTextLength` cuts long tags short and `maxCount` caps the selection. The tags line up
 * with a multiple select's.
 */
export const TagDensity: Story = {
  name: 'Tag density',
  render: () => ({
    moduleMetadata: { imports: IMPORTS },
    props: {
      places: PLACES,
      many: [
        ['lima', 'lima-province', 'miraflores'],
        ['lima', 'lima-province', 'san-isidro'],
        ['cusco', 'cusco-province', 'wanchaq'],
        ['callao'],
        ['lima', 'huaral', 'chancay'],
      ],
      capped: [['callao']],
      more: (omitted: readonly unknown[]) => `y ${omitted.length} más`,
    },
    template: `
      <div style="display: flex; flex-direction: column; gap: 0.75rem; width: 380px;">
        <div style="resize: horizontal; overflow: hidden; width: 380px; min-width: 160px; max-width: 640px; padding-block-end: 4px;">
          <andes-cascader aria-label="Places (responsive)" multiple allowClear maxTagCount="responsive" [options]="places" [(value)]="many" />
        </div>
        <span style="font-size: 0.75rem;">maxTagCount="responsive" - drag the corner to resize</span>
        <andes-cascader aria-label="Places (custom +N)" multiple [maxTagCount]="1" [maxTagPlaceholder]="more" [maxTagTextLength]="12" [options]="places" [(value)]="many" />
        <span style="font-size: 0.75rem;">maxTagPlaceholder as a function, maxTagTextLength=12</span>
        <andes-cascader aria-label="Places (up to three)" multiple [maxCount]="3" placeholder="Pick up to three" [options]="places" [(value)]="capped" />
        <span style="font-size: 0.75rem;">maxCount=3 - the other options stop taking a check once three are picked</span>
      </div>
    `,
  }),
};

/**
 * Icons. `expandIcon` replaces the arrow of an option that opens a column, and with
 * `showSearch` a `searchIcon` stands in for the chevron while the panel is open.
 */
export const Icons: Story = {
  render: () => ({
    moduleMetadata: { imports: IMPORTS },
    props: { places: PLACES },
    template: `
      <ng-template #plus>
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M8 3v10M3 8h10" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
        </svg>
      </ng-template>
      <ng-template #magnifier>
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <circle cx="7" cy="7" r="4.5" stroke="currentColor" stroke-width="1.5" />
          <path d="m10.5 10.5 3 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
        </svg>
      </ng-template>
      <div style="display: flex; flex-direction: column; gap: 0.75rem; width: 320px;">
        <andes-cascader aria-label="Places (custom expand icon)" placeholder="Pick a place" [options]="places" [expandIcon]="plus" />
        <andes-cascader aria-label="Places (search icon)" placeholder="Search a place" showSearch [options]="places" [searchIcon]="magnifier" />
      </div>
    `,
  }),
};

/**
 * `showSearch` filters every path: single, `multiple`, and with a custom `filter`/`sort`/
 * `limit` object (the third field matches only the last label, lists the shortest labels
 * first and caps the list at five).
 *
 * An `optionTemplate` also renders the results (see Display render): it receives the matching
 * path and the text typed, so it can highlight on its own.
 */
export const Search: Story = {
  render: () => ({
    moduleMetadata: { imports: [...IMPORTS, AndesInput] },
    props: {
      places: PLACES,
      picked: null,
      typed: '',
      many: [['cusco', 'urubamba', 'machu-picchu']],
      keepText: [['lima', 'lima-province', 'miraflores']],
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
        <span style="font-size: 0.875rem; margin-top: 0.75rem;">The search text is a two-way <code>searchValue</code>, and <code>autoClearSearchValue</code> off keeps it after a pick, to tick several results</span>
        <andes-cascader aria-label="Places, keeping the text" multiple showSearch [autoClearSearchValue]="false" [(searchValue)]="typed" [options]="places" [(value)]="keepText" placeholder="Search places" />
        <andes-input aria-label="Search text" size="sm" [(value)]="typed" placeholder="Edit the search text from outside" />
      </div>
    `,
  }),
};

/**
 * What the cascader renders. `displayRender` shapes the selection in the field and
 * `optionTemplate` every option, in the columns and in search results (where it also gets the
 * whole `path` and the `searchValue`). `tagTemplate` replaces a tag in `multiple` mode - its
 * context carries `onClose` - and `prefix`, `suffixIcon` (`null` removes the chevron),
 * `clearIcon`, `removeIcon` and `loadingIcon` swap the field's icons. `panelHeader` and
 * `panelFooter` add content inside the panel - the footer here adds a department, and its field
 * takes focus like any other - and `panelScroll` fires when a column scrolls (the last field
 * counts those events).
 */
export const DisplayRender: Story = {
  render: () => ({
    moduleMetadata: { imports: [...IMPORTS, AndesButton, AndesInput] },
    props: {
      places: PLACES,
      choices: [...PLACES],
      longList: LONG_LIST,
      picked: ['lima', 'lima-province', 'surco'],
      many: [['cusco', 'cusco-province', 'wanchaq'], ['callao']],
      added: null,
      draft: '',
      scrolls: 0,
      add(this: { choices: AndesCascaderOption[]; draft: string }) {
        const label = this.draft.trim();
        if (label) {
          this.choices = [
            ...this.choices,
            { value: label.toLowerCase().replace(/\s+/g, '-'), label },
          ];
          this.draft = '';
        }
      },
    },
    template: `
      <ng-template #last let-labels let-options="selectedOptions">
        <span>{{ labels[labels.length - 1] }} <span style="opacity: 0.6;">({{ options[0].label }})</span></span>
      </ng-template>
      <ng-template #option let-option let-path="path" let-search="searchValue">
        <span>{{ option.label }} <span style="opacity: 0.6;">{{ path.length === 1 ? 'department' : search ? path.length + ' levels' : '' }}</span></span>
      </ng-template>
      <ng-template #tag let-tag let-onClose="onClose">
        <span style="display: inline-flex; align-items: center; gap: 0.125rem; height: 1.375rem; padding: 0 0.125rem 0 0.625rem; border-radius: var(--andes-radius-full); background: var(--andes-color-primary-subtle); color: var(--andes-color-primary); font-size: 0.875rem; line-height: 1;">
          {{ tag.labels[tag.labels.length - 1] }}
          <andes-button variant="ghost" size="icon-xs" aria-label="Drop" style="display: inline-flex; margin: 0;" (click)="onClose()">
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>
          </andes-button>
        </span>
      </ng-template>
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
      <ng-template #header let-search>
        <span style="font-size: 0.75rem; color: var(--andes-color-muted-foreground);">{{ search ? 'Results for "' + search + '"' : 'Pick a department, then narrow it down' }}</span>
      </ng-template>
      <ng-template #footer let-close="close">
        <div style="display: flex; gap: 0.5rem; align-items: center;">
          <andes-input aria-label="New department" size="sm" placeholder="New department" [(value)]="draft" (keydown.enter)="add()" />
          <andes-button size="sm" (click)="add(); close()">Add</andes-button>
        </div>
      </ng-template>
      <div style="display: flex; flex-direction: column; gap: 1rem; width: 340px;">
        <andes-cascader aria-label="Last level only" [displayRender]="last" [options]="places" [(value)]="picked" />
        <andes-cascader aria-label="Custom separator" separator=" › " [options]="places" [(value)]="picked" />
        <andes-cascader aria-label="Option template, columns and search" showSearch [optionTemplate]="option" [options]="places" placeholder="Search to see the path in each result" />
        <andes-cascader aria-label="Places as pills" multiple [tagTemplate]="tag" [options]="places" [(value)]="many" />
        <andes-cascader aria-label="Place with custom icons" allowClear [prefix]="pin" [suffixIcon]="caret" [clearIcon]="erase" [loadingIcon]="hourglass" [options]="places" [(value)]="picked" />
        <andes-cascader aria-label="Places, custom remove icon" multiple [removeIcon]="erase" [options]="places" [(value)]="many" />
        <andes-cascader aria-label="Loading, custom spinner" loading [loadingIcon]="hourglass" [suffixIcon]="null" [options]="places" placeholder="Loading" />
        <andes-cascader aria-label="Place with header and footer" [panelHeader]="header" [panelFooter]="footer" showSearch [options]="choices" [(value)]="added" placeholder="Add a department from the footer" />
        <andes-cascader aria-label="Long list" [options]="longList" (panelScroll)="scrolls = scrolls + 1" placeholder="Scroll the first column" />
        <code style="font-size: 0.75rem;">column scroll events: {{ scrolls }}</code>
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

/**
 * The panel opens above (`topLeft`, `topRight`) or below the field. The first field has
 * `defaultOpen`, which opens the panel once on render (click away to dismiss it).
 */
export const Placement: Story = {
  parameters: { layout: 'fullscreen' },
  render: () => ({
    moduleMetadata: { imports: IMPORTS },
    props: { places: PLACES },
    template: `
      <div style="display: flex; justify-content: space-between; align-items: flex-end; height: 22rem; padding: 1rem;">
        <andes-cascader aria-label="Opens upwards" placement="topLeft" defaultOpen style="width: 220px;" [options]="places" placeholder="Opens upwards" />
        <andes-cascader aria-label="Opens upwards, end" placement="topRight" style="width: 220px;" [options]="places" placeholder="Aligned to the end" />
      </div>
    `,
  }),
};
