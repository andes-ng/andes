import { signal } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular';

import {
  about,
  bar,
  control,
  makeOrders,
  makeProducts,
  makeUsers,
  money,
  muted,
  stack,
  statusColor,
  strong,
  withDescription,
  withTableKit,
} from '../../testing/table-story-kit';
import { AndesTable } from './table';
import type {
  AndesTableClassNames,
  AndesTableSemanticInfo,
  AndesTableStyles,
} from './table-semantic';

/*
 * Making the table your own: classes and styles per part (as objects and as functions of the
 * table state), classes and events on rows, per-cell values, stripes, density, the design tokens
 * and the icons the table draws.
 */

const meta: Meta<AndesTable> = {
  title: 'Data Display/Table/Customisation',
  component: AndesTable,
  tags: ['autodocs'],
  decorators: [withDescription, withTableKit],
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<AndesTable>;

/**
 * The classes the stories hand out. They are chained under `.story-cn table.andes-table` so
 * they outrank the table's own rules the way a consumer's stylesheet would.
 */
const CSS = `
  .story-cn table.andes-table .cn-header.andes-table__header { background: color-mix(in srgb, var(--andes-color-primary) 10%, var(--andes-color-background)); }
  .story-cn table.andes-table th.cn-head { color: var(--andes-color-primary-text); font-size: 0.75rem; letter-spacing: 0.05em; text-transform: uppercase; }
  .story-cn table.andes-table .cn-body.andes-table__body { background: var(--andes-color-background); }
  .story-cn table.andes-table tr.cn-row { border-bottom-style: dashed; }
  .story-cn table.andes-table td.cn-cell { font-variant-numeric: tabular-nums; }
  .story-cn table.andes-table .cn-footer.andes-table__footer { background: color-mix(in srgb, var(--andes-color-primary) 10%, var(--andes-color-background)); }
  .story-cn table.andes-table caption.cn-caption { color: var(--andes-color-primary-text); font-weight: 600; }
  .story-cn andes-table.cn-root { display: block; padding: 0.5rem; border-radius: var(--andes-radius-lg); background: color-mix(in srgb, var(--andes-color-primary) 6%, var(--andes-color-background)); }
  .story-cn andes-table.cn-busy { opacity: 0.7; }
  .story-cn table.andes-table th.cn-hot { color: var(--andes-color-primary-text); }
  .story-cn table.andes-table td.cn-tight { font-size: 0.8125rem; }
  .story-cn table.andes-table td.cn-summary { font-weight: 600; color: var(--andes-color-primary-text); }
  .story-cn table.andes-table .cn-expand button { color: var(--andes-color-primary-text); }
  .story-cn table.andes-table .cn-selection { padding: 0.125rem; border-radius: 0.375rem; background: color-mix(in srgb, var(--andes-color-primary) 10%, transparent); }
  .story-cn table.andes-table .cn-sorter { color: var(--andes-color-primary-text); }
  .story-cn table.andes-table tr.story-low { background: color-mix(in srgb, var(--andes-color-destructive) 8%, var(--andes-color-background)); }
  .story-cn table.andes-table tr.story-picked { background: color-mix(in srgb, var(--andes-color-primary) 12%, var(--andes-color-background)); }
  .story-cn table.andes-table td.story-hot { color: var(--andes-color-destructive); font-weight: 600; }
  .story-cn table.andes-table td.story-flash { animation: story-flash 1400ms ease-out; }
  @keyframes story-flash { from { background: color-mix(in srgb, var(--andes-color-primary) 30%, transparent); } }
  @media (prefers-reduced-motion: reduce) { .story-cn table.andes-table td.story-flash { animation: none; } }
  .story-tokens { --andes-table-line: color-mix(in srgb, var(--andes-color-primary) 30%, transparent); --andes-table-tint: color-mix(in srgb, var(--andes-color-primary) 8%, var(--andes-color-background)); --andes-table-row-height: 3.5rem; --andes-table-cell-padding-inline: 1.5rem; --andes-table-cell-padding-block: 1rem; }
`;

function injectCss(): void {
  if (
    typeof document === 'undefined' ||
    document.getElementById('story-cn-css')
  ) {
    return;
  }
  const style = document.createElement('style');
  style.id = 'story-cn-css';
  style.textContent = CSS;
  document.head.appendChild(style);
}

/** The people table the part stories decorate. */
const PEOPLE_TABLE = (attributes: string, extra = '') => `
  <andes-table ${attributes}>
    <caption andesTableCaption>People of the team</caption>
    <thead andesTableHeader>
      <tr andesTableRow>
        <th andesTableHead>Name</th>
        <th andesTableHead>Role</th>
        <th andesTableHead>City</th>
        <th andesTableHead align="end">Score</th>
      </tr>
    </thead>
    <tbody andesTableBody>
      @for (user of users; track user.id) {
        <tr andesTableRow>
          <td andesTableCell>{{ user.name }}</td>
          <td andesTableCell>{{ user.role }}</td>
          <td andesTableCell>{{ user.city }}</td>
          <td andesTableCell align="end">{{ user.score }}</td>
        </tr>
      }
    </tbody>
    ${extra}
  </andes-table>`;

/** Classes per part, as an object. */
export const ClassNamesObject: Story = {
  name: 'classNames as an object',
  parameters: about(
    'Hand a class to any part, the root, the header, a header cell, the body, a row, a cell, the footer or the caption, and style it from your own stylesheet.',
  ),
  render: () => {
    injectCss();
    return {
      props: {
        users: makeUsers(4),
        classNames: {
          root: 'cn-root',
          header: 'cn-header',
          headerCell: 'cn-head',
          body: 'cn-body',
          row: 'cn-row',
          cell: 'cn-cell',
          footer: 'cn-footer',
          caption: 'cn-caption',
        } satisfies AndesTableClassNames,
      },
      template: `
        <div class="story-cn" style="max-width: 40rem;">
          ${PEOPLE_TABLE('captionSide="top" [classNames]="classNames"', '<tfoot andesTableFooter><tr andesTableRow><td andesTableCell colspan="4">Four people</td></tr></tfoot>')}
        </div>`,
    };
  },
};

/** Classes computed from the state. */
export const ClassNamesFunction: Story = {
  name: 'classNames as a function of the state',
  parameters: about(
    'A function receives the table state, such as the loading flag, the density and how many rows are selected, and answers with the classes of each part.',
  ),
  render: () => {
    injectCss();
    const density = signal<'compact' | 'default' | 'comfortable'>('default');
    return {
      props: {
        users: makeUsers(4),
        density,
        loading: signal(false),
        selected: signal<readonly (string | number)[]>([]),
        control,
        bar,
        options: [
          { value: 'compact', label: 'Compact' },
          { value: 'default', label: 'Default' },
          { value: 'comfortable', label: 'Comfortable' },
        ],
        classNames: ({
          props,
        }: AndesTableSemanticInfo): AndesTableClassNames => ({
          root: props.loading ? 'cn-busy' : '',
          headerCell: props.selectedCount > 0 ? 'cn-hot' : '',
          cell: props.density === 'compact' ? 'cn-tight' : '',
          row: props.selectedCount > 0 ? 'cn-row' : '',
        }),
      },
      template: `
        <div class="story-cn" style="${stack} max-width: 40rem;">
          <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 0.75rem 1.5rem;">
            <andes-segmented aria-label="Density" [options]="options" [(value)]="density" />
            <span [style]="control"><andes-switch [checked]="loading()" (checkedChange)="loading.set($event)">Loading</andes-switch></span>
          </div>
          <andes-table [density]="density()" [loading]="loading()" [classNames]="classNames" [(selectedKeys)]="selected">
            <thead andesTableHeader>
              <tr andesTableRow>
                <th andesTableHead><andes-table-select-all label="Select all people" /></th>
                <th andesTableHead>Name</th>
                <th andesTableHead>Role</th>
                <th andesTableHead align="end">Score</th>
              </tr>
            </thead>
            <tbody andesTableBody>
              @for (user of users; track user.id) {
                <tr andesTableRow [rowKey]="user.id">
                  <td andesTableCell><andes-table-selection [label]="'Select ' + user.name" /></td>
                  <td andesTableCell>{{ user.name }}</td>
                  <td andesTableCell>{{ user.role }}</td>
                  <td andesTableCell align="end">{{ user.score }}</td>
                </tr>
              }
            </tbody>
          </andes-table>
          <p [style]="muted" style="margin: 0;">{{ selected().length }} selected: the header cells and the rows change class once something is selected.</p>
        </div>`,
    };
  },
};

/** Styles per part, as an object. */
export const StylesObject: Story = {
  name: 'styles as an object',
  parameters: about(
    'The same parts take inline styles, spelled the CSS way or the camel case way, and a plain number means pixels.',
  ),
  render: () => ({
    props: {
      users: makeUsers(4),
      styles: {
        root: { maxWidth: 640 },
        headerCell: {
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          fontSize: '0.75rem',
        },
        row: { 'border-bottom-style': 'dashed' },
        cell: { fontVariantNumeric: 'tabular-nums' },
        caption: { fontWeight: 600 },
      } satisfies AndesTableStyles,
    },
    template: PEOPLE_TABLE('captionSide="top" [styles]="styles"'),
  }),
};

/** Styles computed from the state. */
export const StylesFunction: Story = {
  name: 'styles as a function of the state',
  parameters: about(
    'A function of the state can also compute styles, here fading the rows while the table loads and tinting the rows once some are picked.',
  ),
  render: () => ({
    props: {
      users: makeUsers(4),
      loading: signal(false),
      striped: signal(false),
      control,
      bar,
      styles: ({ props }: AndesTableSemanticInfo): AndesTableStyles => ({
        root: { maxWidth: 640 },
        body: { opacity: props.loading ? 0.45 : 1 },
        headerCell: {
          color: props.striped ? 'var(--andes-color-primary-text)' : '',
        },
      }),
    },
    template: `
      <div style="${stack} max-width: 40rem;">
        <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 0.75rem 1.5rem;">
          <span [style]="control"><andes-switch [checked]="loading()" (checkedChange)="loading.set($event)">Loading</andes-switch></span>
          <span [style]="control"><andes-switch [checked]="striped()" (checkedChange)="striped.set($event)">Striped</andes-switch></span>
        </div>
        ${PEOPLE_TABLE('[loading]="loading()" [striped]="striped()" [styles]="styles"')}
      </div>`,
  }),
};

/** Footer and summary parts. */
export const SummaryParts: Story = {
  name: 'Summary and footer part styling',
  parameters: about(
    'The footer part styles the whole footer and the summary part styles its cells, so a total can stand out without a class on each cell.',
  ),
  render: () => {
    injectCss();
    return {
      props: {
        users: makeUsers(4),
        classNames: {
          footer: 'cn-footer',
          summary: 'cn-summary',
        } satisfies AndesTableClassNames,
      },
      template: `
        <div class="story-cn" style="max-width: 40rem;">
          ${PEOPLE_TABLE('[classNames]="classNames"', '<tfoot andesTableFooter><tr andesTableRow><td andesTableCell colspan="3">Total score</td><td andesTableCell align="end">{{ users[0].score + users[1].score + users[2].score + users[3].score }}</td></tr></tfoot>')}
        </div>`,
    };
  },
};

/** Classes for the controls. */
export const ControlParts: Story = {
  name: 'Parts of controls',
  parameters: about(
    'The row toggle, the selection control, the sort mark and the filter button are parts too, so each can carry a class of its own.',
  ),
  render: () => {
    injectCss();
    return {
      props: {
        users: makeUsers(4),
        roles: ['Admin', 'Editor', 'Viewer', 'Billing'].map((value) => ({
          text: value,
          value,
        })),
        classNames: {
          expand: 'cn-expand',
          selection: 'cn-selection',
          sorter: 'cn-sorter',
          filter: 'cn-filter',
        } satisfies AndesTableClassNames,
      },
      template: `
        <div class="story-cn" style="max-width: 40rem;">
          <andes-table [classNames]="classNames">
            <thead andesTableHeader>
              <tr andesTableRow>
                <th andesTableHead><span class="andes-table__sr-only">Select</span></th>
                <th andesTableHead><span class="andes-table__sr-only">Details</span></th>
                <th andesTableHead sortKey="name">Name</th>
                <th andesTableHead>
                  Role
                  <andes-table-filter column="role" label="Filter role" [options]="roles" />
                </th>
              </tr>
            </thead>
            <tbody andesTableBody>
              @for (user of users; track user.id) {
                <tr andesTableRow [rowKey]="user.id">
                  <td andesTableCell><andes-table-selection [label]="'Select ' + user.name" /></td>
                  <td andesTableCell><andes-table-expand-toggle [label]="'Details of ' + user.name" /></td>
                  <td andesTableCell>{{ user.name }}</td>
                  <td andesTableCell>{{ user.role }}</td>
                </tr>
                <tr *andesTableExpandedRow="user.id">
                  <td andesTableCell colspan="4">{{ user.email }} · {{ user.city }}</td>
                </tr>
              }
            </tbody>
          </andes-table>
        </div>`,
    };
  },
};

/** Row classes from the data. */
export const RowClassFromData: Story = {
  name: 'Row class names from data',
  parameters: about(
    'A row is plain markup, so a class bound to the data tints it: here the products that are nearly out of stock.',
  ),
  render: () => {
    injectCss();
    return {
      props: {
        products: makeProducts(7).map((product, i) => ({
          ...product,
          stock: i % 3 === 0 ? 4 + i : 40 + i,
        })),
        money,
      },
      template: `
        <div class="story-cn" style="max-width: 40rem;">
          <andes-table>
            <thead andesTableHeader>
              <tr andesTableRow>
                <th andesTableHead>Product</th>
                <th andesTableHead>Category</th>
                <th andesTableHead align="end">Stock</th>
                <th andesTableHead align="end">Price</th>
              </tr>
            </thead>
            <tbody andesTableBody>
              @for (product of products; track product.sku) {
                <tr andesTableRow [class.story-low]="product.stock < 20">
                  <td andesTableCell>{{ product.name }}</td>
                  <td andesTableCell>{{ product.category }}</td>
                  <td andesTableCell align="end">
                    <span style="display: inline-flex; align-items: center; gap: 0.5rem;">
                      @if (product.stock < 20) {
                        <ng-icon name="lucideTriangleAlert" aria-hidden="true" />
                      }
                      {{ product.stock }}
                    </span>
                  </td>
                  <td andesTableCell align="end">{{ money(product.price) }}</td>
                </tr>
              }
            </tbody>
          </andes-table>
        </div>`,
    };
  },
};

/** Row events. */
export const RowEvents: Story = {
  name: 'Row events',
  parameters: about(
    'Rows take the usual events, click, double click, pointer enter and context menu, so a row can open a detail, a menu or a readout.',
  ),
  render: () => {
    injectCss();
    const last = signal('Interact with a row.');
    const picked = signal<number | null>(null);
    return {
      props: {
        users: makeUsers(4),
        last,
        picked,
        muted,
        say: (event: string, name: string) => last.set(`${event} on ${name}`),
      },
      template: `
        <div class="story-cn" style="${stack} max-width: 40rem;">
          <andes-table>
            <thead andesTableHeader>
              <tr andesTableRow>
                <th andesTableHead>Name</th>
                <th andesTableHead>Role</th>
                <th andesTableHead>City</th>
              </tr>
            </thead>
            <tbody andesTableBody>
              @for (user of users; track user.id) {
                <tr andesTableRow style="cursor: pointer;" [class.story-picked]="picked() === user.id"
                  (click)="picked.set(user.id); say('Click', user.name)"
                  (dblclick)="say('Double click', user.name)"
                  (mouseenter)="say('Pointer enter', user.name)"
                  (contextmenu)="$event.preventDefault(); say('Context menu', user.name)">
                  <td andesTableCell>{{ user.name }}</td>
                  <td andesTableCell>{{ user.role }}</td>
                  <td andesTableCell>{{ user.city }}</td>
                </tr>
              }
            </tbody>
          </andes-table>
          <p [style]="muted" style="margin: 0;" role="status">{{ last() }}</p>
        </div>`,
    };
  },
};

/** Per-cell props. */
export const CellProps: Story = {
  name: 'Cell props',
  parameters: about(
    'Each cell takes its own class, style and attributes computed from its value, such as a data attribute that carries the raw number and a colour for the low scores.',
  ),
  render: () => {
    injectCss();
    return {
      props: { users: makeUsers(6) },
      template: `
        <div class="story-cn" style="max-width: 40rem;">
          <andes-table>
            <thead andesTableHeader>
              <tr andesTableRow>
                <th andesTableHead>Name</th>
                <th andesTableHead align="end">Age</th>
                <th andesTableHead align="end">Score</th>
              </tr>
            </thead>
            <tbody andesTableBody>
              @for (user of users; track user.id) {
                <tr andesTableRow>
                  <td andesTableCell [style.font-weight]="user.role === 'Admin' ? 600 : null">{{ user.name }}</td>
                  <td andesTableCell align="end" [attr.data-years]="user.age">{{ user.age }}</td>
                  <td andesTableCell align="end" [class.story-hot]="user.score < 60" [attr.data-score]="user.score">{{ user.score }}</td>
                </tr>
              }
            </tbody>
          </andes-table>
        </div>`,
    };
  },
};

/** Stripes with selection. */
export const StripesAndSelection: Story = {
  name: 'Stripes and selection',
  parameters: about(
    'Stripes sit under the hover and the selected tint, so a selected or hovered row is never mistaken for a stripe.',
  ),
  render: () => ({
    props: {
      users: makeUsers(8),
      selected: signal<readonly (string | number)[]>([2, 3]),
    },
    template: `
      <andes-table striped style="max-width: 40rem;" [(selectedKeys)]="selected">
        <thead andesTableHeader>
          <tr andesTableRow>
            <th andesTableHead><andes-table-select-all label="Select all people" /></th>
            <th andesTableHead>Name</th>
            <th andesTableHead>Role</th>
            <th andesTableHead>City</th>
          </tr>
        </thead>
        <tbody andesTableBody>
          @for (user of users; track user.id) {
            <tr andesTableRow [rowKey]="user.id">
              <td andesTableCell><andes-table-selection [label]="'Select ' + user.name" /></td>
              <td andesTableCell>{{ user.name }}</td>
              <td andesTableCell>{{ user.role }}</td>
              <td andesTableCell>{{ user.city }}</td>
            </tr>
          }
        </tbody>
      </andes-table>`,
  }),
};

/** No hover. */
export const ZebraNoHover: Story = {
  name: 'Zebra with hover off',
  parameters: about(
    'Switch the row hover off for a table that is only read, and let the stripes alone carry the rows.',
  ),
  render: () => ({
    props: { rows: makeOrders(7), money, statusColor },
    template: `
      <andes-table striped [rowHover]="false" style="max-width: 44rem;">
        <thead andesTableHeader>
          <tr andesTableRow>
            <th andesTableHead>Invoice</th>
            <th andesTableHead>Customer</th>
            <th andesTableHead>Status</th>
            <th andesTableHead align="end">Total</th>
          </tr>
        </thead>
        <tbody andesTableBody>
          @for (row of rows; track row.id) {
            <tr andesTableRow>
              <td andesTableCell>{{ row.id }}</td>
              <td andesTableCell>{{ row.customer }}</td>
              <td andesTableCell><andes-tag [color]="statusColor(row.status)">{{ row.status }}</andes-tag></td>
              <td andesTableCell align="end">{{ money(row.total) }}</td>
            </tr>
          }
        </tbody>
      </andes-table>`,
  }),
};

/** Density toggle. */
export const DensityToggle: Story = {
  name: 'Density toggle',
  parameters: about(
    'A segmented control lets the reader pick how much of the table fits on screen: compact rows are 36px, default 44px and comfortable 52px.',
  ),
  render: () => ({
    props: {
      rows: makeOrders(6),
      density: signal<'compact' | 'default' | 'comfortable'>('default'),
      money,
      statusColor,
      options: [
        { value: 'compact', label: 'Compact' },
        { value: 'default', label: 'Default' },
        { value: 'comfortable', label: 'Comfortable' },
      ],
    },
    template: `
      <div style="${stack} max-width: 44rem;">
        <andes-segmented aria-label="Density" [options]="options" [(value)]="density" />
        <andes-table [density]="density()">
          <thead andesTableHeader>
            <tr andesTableRow>
              <th andesTableHead>Invoice</th>
              <th andesTableHead>Customer</th>
              <th andesTableHead>Status</th>
              <th andesTableHead align="end">Total</th>
            </tr>
          </thead>
          <tbody andesTableBody>
            @for (row of rows; track row.id) {
              <tr andesTableRow>
                <td andesTableCell>{{ row.id }}</td>
                <td andesTableCell>{{ row.customer }}</td>
                <td andesTableCell><andes-tag [color]="statusColor(row.status)">{{ row.status }}</andes-tag></td>
                <td andesTableCell align="end">{{ money(row.total) }}</td>
              </tr>
            }
          </tbody>
        </andes-table>
      </div>`,
  }),
};

/** Design tokens. */
export const Tokens: Story = {
  name: 'Design tokens',
  parameters: about(
    'The row height, the cell padding, the line colour and the tint are custom properties of the table, so a stylesheet can retune them in one rule.',
  ),
  render: () => {
    injectCss();
    return {
      props: { users: makeUsers(4), strong },
      template: `
        <div style="${stack} max-width: 40rem;">
          <div>
            <p [style]="strong" style="margin: 0 0 0.5rem;">Default tokens</p>
            ${PEOPLE_TABLE('')}
          </div>
          <div class="story-tokens">
            <p [style]="strong" style="margin: 0 0 0.5rem;">Row height 56px, padding 16px by 24px, tinted lines</p>
            ${PEOPLE_TABLE('')}
          </div>
        </div>`,
    };
  },
};

const ICONS: readonly (readonly [string, string])[] = [
  ['lucideChevronsUpDown', 'A sortable column that is not sorted'],
  ['lucideArrowUp', 'Sorted ascending'],
  ['lucideArrowDown', 'Sorted descending'],
  ['lucideFunnel', 'The filter button of a column'],
  ['lucideSearch', 'The search box inside a filter'],
  ['lucidePin', 'A pinned column, and the pin button of the column menu'],
  ['lucidePinOff', 'Unpin a column'],
  [
    'lucideChevronRight',
    'The row toggle, turning a quarter when the row opens',
  ],
  ['lucideChevronsDownUp', 'Collapse every row from the header'],
  ['lucideChevronsUpDown', 'Expand every row from the header'],
  ['lucideCheck', 'A selected row'],
  ['lucideMinus', 'Some of the rows are selected'],
  ['lucideGripVertical', 'The handle that drags a row'],
  ['lucideColumns3', 'The columns menu'],
  ['lucideEllipsis', 'More actions of a row'],
  ['lucideRefreshCw', 'Reload the data'],
  ['lucideDownload', 'Export the rows'],
  ['lucideInbox', 'An empty table'],
  ['lucideCircleAlert', 'The data could not be loaded'],
];

/** The icons the table draws. */
export const IconLegend: Story = {
  name: 'Icons the table draws',
  parameters: about(
    'Every icon in and around the table is a lucide icon drawn with the icon component, listed here with what it means.',
  ),
  render: () => ({
    props: { icons: ICONS, muted },
    template: `
      <andes-table style="max-width: 40rem;" density="compact">
        <thead andesTableHeader>
          <tr andesTableRow>
            <th andesTableHead style="width: 3.5rem;">Icon</th>
            <th andesTableHead>Name</th>
            <th andesTableHead>Used for</th>
          </tr>
        </thead>
        <tbody andesTableBody>
          @for (icon of icons; track icon[0] + icon[1]) {
            <tr andesTableRow>
              <td andesTableCell><ng-icon [name]="icon[0]" size="1.125rem" aria-hidden="true" /></td>
              <td andesTableCell><span [style]="muted">{{ icon[0] }}</span></td>
              <td andesTableCell>{{ icon[1] }}</td>
            </tr>
          }
        </tbody>
      </andes-table>`,
  }),
};

/** Your own icons. */
export const CustomIcons: Story = {
  name: 'Custom filter and expand icons',
  parameters: about(
    'Project your own icon into the filter button or into the row toggle, and read the state from the template to change it.',
  ),
  render: () => ({
    props: {
      users: makeUsers(4),
      roles: ['Admin', 'Editor', 'Viewer', 'Billing'].map((value) => ({
        text: value,
        value,
      })),
    },
    template: `
      <ng-template #filterIcon let-active>
        <ng-icon name="lucideSearch" [style.color]="active ? 'var(--andes-color-primary-text)' : 'inherit'" aria-hidden="true" />
      </ng-template>
      <andes-table style="max-width: 40rem;">
        <thead andesTableHeader>
          <tr andesTableRow>
            <th andesTableHead><span class="andes-table__sr-only">Details</span></th>
            <th andesTableHead>Name</th>
            <th andesTableHead>
              Role
              <andes-table-filter column="role" label="Filter role" [options]="roles" [icon]="filterIcon" />
            </th>
          </tr>
        </thead>
        <tbody andesTableBody>
          @for (user of users; track user.id) {
            <tr andesTableRow [rowKey]="user.id">
              <td andesTableCell>
                <andes-table-expand-toggle #toggle="andesTableExpandToggle" [label]="'Details of ' + user.name">
                  @if (toggle.expanded()) {
                    <ng-icon name="lucideMinus" size="0.875rem" aria-hidden="true" />
                  } @else {
                    <ng-icon name="lucidePlus" size="0.875rem" aria-hidden="true" />
                  }
                </andes-table-expand-toggle>
              </td>
              <td andesTableCell>{{ user.name }}</td>
              <td andesTableCell>{{ user.role }}</td>
            </tr>
            <tr *andesTableExpandedRow="user.id">
              <td andesTableCell colspan="3">{{ user.email }}</td>
            </tr>
          }
        </tbody>
      </andes-table>`,
  }),
};

/** Row grouping. */
export const RowGrouping: Story = {
  name: 'Row grouping',
  parameters: about(
    'A group row spans every column with a name and a count, and its chevron opens and closes the rows of the group.',
  ),
  render: () => {
    const users = makeUsers(9);
    const closed = signal<readonly string[]>([]);
    return {
      props: {
        closed,
        groups: ['Admin', 'Editor', 'Viewer', 'Billing'].map((role) => ({
          role,
          users: users.filter((user) => user.role === role),
        })),
        toggle: (role: string) =>
          closed.update((list) =>
            list.includes(role)
              ? list.filter((item) => item !== role)
              : [...list, role],
          ),
      },
      template: `
        <andes-table style="max-width: 40rem;">
          <thead andesTableHeader>
            <tr andesTableRow>
              <th andesTableHead>Name</th>
              <th andesTableHead>City</th>
              <th andesTableHead align="end">Score</th>
            </tr>
          </thead>
          <tbody andesTableBody>
            @for (group of groups; track group.role) {
              <tr andesTableRow style="background: var(--andes-table-tint, var(--andes-color-muted));">
                <td andesTableCell colspan="3">
                  <span style="display: inline-flex; align-items: center; gap: 0.5rem;">
                    <andes-button variant="ghost" size="icon-xs" [attr.aria-expanded]="!closed().includes(group.role)" [aria-label]="'Toggle ' + group.role" (click)="toggle(group.role)">
                      <ng-icon name="lucideChevronRight" [style.transform]="closed().includes(group.role) ? 'none' : 'rotate(90deg)'" />
                    </andes-button>
                    <strong>{{ group.role }}</strong>
                    <andes-badge standalone [count]="group.users.length" size="small" variant="secondary" />
                  </span>
                </td>
              </tr>
              @if (!closed().includes(group.role)) {
                @for (user of group.users; track user.id) {
                  <tr andesTableRow>
                    <td andesTableCell>{{ user.name }}</td>
                    <td andesTableCell>{{ user.city }}</td>
                    <td andesTableCell align="end">{{ user.score }}</td>
                  </tr>
                }
              }
            }
          </tbody>
        </andes-table>`,
    };
  },
};

/** Sticky first column. */
export const StickyFirstColumn: Story = {
  name: 'Sticky first column with shadow',
  parameters: about(
    'The first column is pinned to the start edge, and a soft shadow appears on its edge as soon as the rest of the table scrolls under it.',
  ),
  render: () => ({
    props: { users: makeUsers(6) },
    template: `
      <div style="max-width: 32rem;">
        <andes-table scrollX="780">
          <thead andesTableHeader>
            <tr andesTableRow>
              <th andesTableHead fixed="start" [width]="170">Name</th>
              <th andesTableHead [width]="120">Role</th>
              <th andesTableHead [width]="130">City</th>
              <th andesTableHead [width]="260">Email</th>
              <th andesTableHead align="end" [width]="100">Score</th>
            </tr>
          </thead>
          <tbody andesTableBody>
            @for (user of users; track user.id) {
              <tr andesTableRow>
                <td andesTableCell fixed="start">{{ user.name }}</td>
                <td andesTableCell>{{ user.role }}</td>
                <td andesTableCell>{{ user.city }}</td>
                <td andesTableCell>{{ user.email }}</td>
                <td andesTableCell align="end">{{ user.score }}</td>
              </tr>
            }
          </tbody>
        </andes-table>
      </div>`,
  }),
};

/** A cell that flashes. */
export const ChangedValues: Story = {
  name: 'Highlight changed values',
  parameters: about(
    'A cell whose value just changed flashes a soft tint for a moment, which helps the eye find what an update touched.',
  ),
  render: () => {
    injectCss();
    const products = signal(makeProducts(5));
    const flashing = signal<readonly string[]>([]);
    return {
      props: {
        products,
        flashing,
        money,
        bar,
        update: () => {
          const changed: string[] = [];
          products.update((list) =>
            list.map((product, i) => {
              if (i % 2 === 0) {
                changed.push(product.sku);
                return { ...product, price: product.price + 3 };
              }
              return product;
            }),
          );
          flashing.set(changed);
          setTimeout(() => flashing.set([]), 1500);
        },
      },
      template: `
        <div class="story-cn" style="${stack} max-width: 40rem;">
          <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 0.75rem 1.5rem;">
            <andes-button variant="outline" (click)="update()">
              <ng-icon slot="icon-start" name="lucideTrendingUp" />
              Raise some prices
            </andes-button>
          </div>
          <andes-table>
            <thead andesTableHeader>
              <tr andesTableRow>
                <th andesTableHead>Product</th>
                <th andesTableHead>Category</th>
                <th andesTableHead align="end">Price</th>
              </tr>
            </thead>
            <tbody andesTableBody>
              @for (product of products(); track product.sku) {
                <tr andesTableRow>
                  <td andesTableCell>{{ product.name }}</td>
                  <td andesTableCell>{{ product.category }}</td>
                  <td andesTableCell align="end" [class.story-flash]="flashing().includes(product.sku)">{{ money(product.price) }}</td>
                </tr>
              }
            </tbody>
          </andes-table>
        </div>`,
    };
  },
};
