import { signal } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular';

import {
  about,
  labelled,
  orders,
  pg,
  scene,
  slicePage,
  stack,
  stackWide,
  withDescription,
  withPaginationKit,
} from '../../testing/pagination-story-kit';
import { AndesPagination } from './pagination';

/*
 * The compact forms: the simple "page / total" input, the compact status layout, the control
 * that collapses on a phone, and the data-table footer.
 */

const meta: Meta<AndesPagination> = {
  title: 'Navigation/Pagination/Simple and compact',
  component: AndesPagination,
  decorators: [withDescription, withPaginationKit],
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<AndesPagination>;

export const Simple: Story = {
  name: 'Simple mode',
  parameters: about(
    'A compact "page / total" input between Previous and Next; type a page and press Enter, or use the arrow keys in the field.',
  ),
  render: () => scene(pg('[total]="500" [simple]="true"', 'Simple')),
};

export const SimpleReadOnly: Story = {
  name: 'Simple mode, read-only',
  parameters: about(
    'The current page as plain text, for a place where the buttons are enough.',
  ),
  render: () =>
    scene(
      pg(
        '[total]="500" [defaultCurrent]="3" [simple]="{ readOnly: true }"',
        'Simple read-only',
      ),
    ),
};

export const SimpleGo: Story = {
  name: 'Simple mode with a go button',
  parameters: about(
    'With the quick jumper on, the simple input gets a go button and no longer jumps when it loses focus.',
  ),
  render: () =>
    scene(
      stack(
        labelled(
          'Go button',
          pg(
            '[total]="500" [simple]="true" [showQuickJumper]="true" [goButton]="true"',
            'Simple with go',
          ),
        ),
        labelled(
          'Go button with an arrow',
          pg(
            '[total]="500" [simple]="true" [showQuickJumper]="true" [goButton]="true" [jumperIcon]="true"',
            'Simple with a go arrow',
          ),
        ),
      ),
    ),
};

export const SimpleWithTotals: Story = {
  name: 'Simple mode with the total',
  parameters: about(
    'Simple mode keeps the total text and the page-size select beside it.',
  ),
  render: () =>
    scene(
      `<andes-pagination aria-label="Simple with total" style="width: min(44rem, calc(100vw - 2rem));"
        [total]="285" [simple]="true" [showSizeChanger]="true" [showTotal]="rangeSummary" />`,
      {
        rangeSummary: (total: number, range: [number, number]) =>
          `${range[0]}-${range[1]} of ${total}`,
      },
    ),
};

export const Compact: Story = {
  name: 'Compact layout',
  parameters: about(
    'Previous, "Page 2 of 10" and Next with no page numbers, the smallest control that still says where you are.',
  ),
  render: () =>
    scene(
      stack(
        labelled(
          'Default',
          pg('[total]="100" [defaultCurrent]="2" layout="compact"', 'Compact'),
        ),
        labelled(
          'Small',
          pg(
            '[total]="100" [defaultCurrent]="2" layout="compact" size="small"',
            'Compact, small',
          ),
        ),
        labelled(
          'Outline',
          pg(
            '[total]="100" [defaultCurrent]="2" layout="compact" variant="outline"',
            'Compact, outline',
          ),
        ),
        labelled(
          'Large, with first and last',
          pg(
            '[total]="100" [defaultCurrent]="2" layout="compact" size="large" [showFirstLast]="true"',
            'Compact, large',
          ),
        ),
      ),
    ),
};

export const CompactStatusText: Story = {
  name: 'Compact with its own words',
  parameters: about(
    'statusLabel sets the text between the arrows; {page} and {pages} are replaced.',
  ),
  render: () =>
    scene(
      stack(
        labelled(
          'Step',
          pg(
            '[total]="100" [defaultCurrent]="2" layout="compact" statusLabel="Step {page} of {pages}"',
            'Steps',
          ),
        ),
        labelled(
          'Spanish',
          pg(
            '[total]="100" [defaultCurrent]="2" layout="compact" statusLabel="Página {page} de {pages}" previousLabel="Página anterior" nextLabel="Página siguiente"',
            'Paginación',
          ),
        ),
      ),
    ),
};

export const Responsive: Story = {
  name: 'Responsive',
  parameters: about(
    'With responsive on, the control becomes the small simple form on screens narrower than 576px; narrow the window to see it.',
  ),
  render: () =>
    scene(
      pg(
        '[total]="500" [defaultCurrent]="6" [responsive]="true" [showSizeChanger]="true"',
        'Responsive',
      ),
    ),
};

export const TableFooter: Story = {
  name: 'Table footer',
  parameters: about(
    'layout="table" is the data-table footer: "Rows per page" and its select, the item range, and first, previous, next and last buttons.',
  ),
  render: () =>
    scene(
      stackWide(
        labelled(
          'Default size',
          pg('[total]="100" layout="table"', 'Table footer'),
        ),
        labelled(
          'Small',
          pg(
            '[total]="100" layout="table" size="small"',
            'Table footer, small',
          ),
        ),
        labelled(
          'Large',
          pg(
            '[total]="100" layout="table" size="large"',
            'Table footer, large',
          ),
        ),
        labelled(
          'Outline items',
          pg(
            '[total]="100" layout="table" variant="outline"',
            'Table footer, outline',
          ),
        ),
      ),
    ),
};

export const TableFooterOptions: Story = {
  name: 'Table footer options',
  parameters: about(
    'The footer takes the usual options: sizes to offer, a start page, no first and last buttons, a quick jumper, and its own words.',
  ),
  render: () =>
    scene(
      stackWide(
        labelled(
          'Sizes 5, 10, 25 and 50',
          pg(
            '[total]="237" layout="table" [pageSizeOptions]="[5, 10, 25, 50]" [defaultPageSize]="5"',
            'Table footer, sizes',
          ),
        ),
        labelled(
          'Without first and last',
          pg(
            '[total]="237" layout="table" [showFirstLast]="false"',
            'Table footer, no first and last',
          ),
        ),
        labelled(
          'With a quick jumper',
          pg(
            '[total]="237" layout="table" [showQuickJumper]="true"',
            'Table footer, jumper',
          ),
        ),
        labelled(
          'Spanish',
          pg(
            '[total]="237" layout="table" rowsPerPageLabel="Filas por página" rangeLabel="{from}-{to} de {total}" firstLabel="Primera página" previousLabel="Página anterior" nextLabel="Página siguiente" lastLabel="Última página"',
            'Pie de tabla',
          ),
        ),
      ),
    ),
};

export const TableFooterWithData: Story = {
  name: 'Table footer with its rows',
  parameters: about(
    'The footer under a table of rows: the page and the rows per page decide which rows are drawn.',
  ),
  render: () =>
    scene(
      `<div [style]="wide">
        <div role="table" aria-label="Orders" [style]="card">
          <div role="row" [style]="listRow + ' font-weight: 600;'">
            <span role="columnheader" style="flex: 1;">Order</span>
            <span role="columnheader" style="flex: 2;">Customer</span>
            <span role="columnheader" style="flex: 1;">Status</span>
            <span role="columnheader" style="flex: 1; text-align: end;">Amount</span>
          </div>
          @for (order of rows(page(), perPage()); track order.id) {
            <div role="row" [style]="listRow">
              <span role="cell" style="flex: 1;">{{ order.id }}</span>
              <span role="cell" style="flex: 2;">{{ order.customer }}</span>
              <span role="cell" style="flex: 1;"><andes-tag [color]="order.status === 'Paid' ? 'success' : order.status === 'Pending' ? 'warning' : 'default'">{{ order.status }}</andes-tag></span>
              <span role="cell" style="flex: 1; text-align: end;">{{ order.amount }}</span>
            </div>
          }
          <div style="padding: 0.75rem 1rem;">
            <andes-pagination aria-label="Orders pages" layout="table" [total]="all.length"
              [(current)]="page" [(pageSize)]="perPage" [pageSizeOptions]="[5, 10, 20]" />
          </div>
        </div>
      </div>`,
      {
        all: orders(47),
        page: signal(1),
        perPage: signal(5),
        rows(page: number, size: number) {
          return slicePage(orders(47), page, size);
        },
      },
    ),
};
