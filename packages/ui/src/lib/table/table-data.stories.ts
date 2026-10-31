import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';

import {
  AndesTableSortingDemo,
  AndesTableMultiSortDemo,
  AndesTableFilterDemo,
  AndesTableTreeFilterDemo,
  AndesTableAdvancedFilterDemo,
  AndesTablePaginationDemo,
  AndesTableServerDemo,
  AndesTableScrollDemo,
  AndesTableVirtualDemo,
  TABLE_PARTS,
} from './table.stories';

const meta: Meta = {
  title: 'Data Display/Table/Features/Data',
  decorators: [
    moduleMetadata({
      imports: [
        AndesTableSortingDemo,
        AndesTableMultiSortDemo,
        AndesTableFilterDemo,
        AndesTableTreeFilterDemo,
        AndesTableAdvancedFilterDemo,
        AndesTablePaginationDemo,
        AndesTableServerDemo,
        AndesTableScrollDemo,
        AndesTableVirtualDemo,
        ...TABLE_PARTS,
      ],
    }),
  ],
};

export default meta;

type Story = StoryObj;

/** Sortable headers with stable sorting: click a header, or press Enter or Space. A second table shows `sortTooltip`, which names the next sort step, and `[sortIcon]="false"` with the `andesTableHead` export to draw a custom indicator. */
export const Sorting: Story = {
  parameters: { docs: { source: { type: 'code' } } },
  render: () => ({
    template: `
      <div style="display: grid; gap: 3rem;">
        <andes-table-sorting-demo />
      <andes-table sortTooltip>
        <thead andesTableHeader>
          <tr andesTableRow>
            <th andesTableHead sortKey="client">Client</th>
            <th andesTableHead sortKey="total" align="end" [sortIcon]="false" #total="andesTableHead">
              Total
              <span aria-hidden="true">{{ total.direction() === 'asc' ? '↑' : total.direction() === 'desc' ? '↓' : '↕' }}</span>
            </th>
          </tr>
        </thead>
        <tbody andesTableBody>
          <tr andesTableRow><td andesTableCell>Andes Mining</td><td andesTableCell align="end">$250.00</td></tr>
          <tr andesTableRow><td andesTableCell>Tamci Peru</td><td andesTableCell align="end">$150.00</td></tr>
        </tbody>
      </andes-table>
      </div>
    `,
  }),
};

/** Sorting by several columns at once. */
export const MultiSort: Story = {
  parameters: { docs: { source: { type: 'code' } } },
  render: () => ({ template: `<andes-table-multi-sort-demo />` }),
};

/**
 * Column filters. The first table filters by option lists; the second combines a tree structure with custom filter panels.
 */
export const Filters: Story = {
  parameters: { docs: { source: { type: 'code' } } },
  render: () => ({
    template: `
      <div style="display: grid; gap: 3rem;">
        <andes-table-filter-demo />
        <andes-table-tree-filter-demo />
      </div>
    `,
  }),
};

/** Text, range and date-range filters with sorting and paging over a larger data set. */
export const AdvancedFilters: Story = {
  parameters: { docs: { source: { type: 'code' } } },
  render: () => ({ template: `<andes-table-advanced-filter-demo />` }),
};

/** A page of rows with a pager. */
export const Pagination: Story = {
  parameters: { docs: { source: { type: 'code' } } },
  render: () => ({ template: `<andes-table-pagination-demo />` }),
};

/** Sorting, filtering and paging delegated to a server. */
export const ServerSideData: Story = {
  parameters: { docs: { source: { type: 'code' } } },
  render: () => ({ template: `<andes-table-server-demo />` }),
};

/** Scrolling in both directions with fixed columns. */
export const ScrollAndFixedColumns: Story = {
  parameters: { docs: { source: { type: 'code' } } },
  render: () => ({ template: `<andes-table-scroll-demo />` }),
};

/** Only the visible rows of a long list are rendered. */
export const VirtualRows: Story = {
  parameters: { docs: { source: { type: 'code' } } },
  render: () => ({ template: `<andes-table-virtual-demo />` }),
};
