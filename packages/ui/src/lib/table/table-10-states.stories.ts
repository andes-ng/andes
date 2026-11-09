import { computed, signal } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular';

import {
  about,
  bar,
  control,
  makeOrders,
  money,
  stack,
  statusColor,
  strong,
  withDescription,
  withTableKit,
} from '../../testing/table-story-kit';
import { AndesTable } from './table';
import { andesFilterRows, andesOptionFilter } from './table-data';
import type { AndesTableFilters } from './table-data';

/*
 * What a table shows when it is not showing data: the loading overlay, skeleton rows, the empty
 * state, an empty filter result, an error, and the footer and summary rows that close a table.
 */

const meta: Meta<AndesTable> = {
  title: 'Data Display/Table/States',
  component: AndesTable,
  tags: ['autodocs'],
  decorators: [withDescription, withTableKit],
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<AndesTable>;

/** The header shared by the invoice tables of this group. */
const HEAD = `
  <thead andesTableHeader>
    <tr andesTableRow>
      <th andesTableHead>Invoice</th>
      <th andesTableHead>Customer</th>
      <th andesTableHead>Status</th>
      <th andesTableHead align="end">Total</th>
    </tr>
  </thead>`;

/** The body rows shared by the invoice tables of this group. */
const ROWS = (source: string) => `
  @for (row of ${source}; track row.id) {
    <tr andesTableRow>
      <td andesTableCell>{{ row.id }}</td>
      <td andesTableCell>{{ row.customer }}</td>
      <td andesTableCell><andes-tag [color]="statusColor(row.status)">{{ row.status }}</andes-tag></td>
      <td andesTableCell align="end">{{ money(row.total) }}</td>
    </tr>
  }`;

/** The loading overlay. */
export const Loading: Story = {
  name: 'Loading',
  parameters: about(
    'While loading is on, a soft overlay with a spinner covers the rows, stops the pointer and announces the loading text to assistive tech.',
  ),
  render: () => ({
    props: {
      rows: makeOrders(4),
      loading: signal(true),
      money,
      statusColor,
      control,
    },
    template: `
      <div style="${stack} max-width: 44rem;">
        <span [style]="control"><andes-switch [checked]="loading()" (checkedChange)="loading.set($event)">Loading</andes-switch></span>
        <andes-table [loading]="loading()" loadingLabel="Loading invoices">
          ${HEAD}
          <tbody andesTableBody>${ROWS('rows')}</tbody>
        </andes-table>
      </div>`,
  }),
};

/** Skeleton rows. */
export const SkeletonRows: Story = {
  name: 'Loading skeleton rows',
  parameters: about(
    'Instead of an overlay, the cells of the first load can show skeleton lines of the same size as the values that will come.',
  ),
  render: () => ({
    props: {
      rows: makeOrders(4),
      skeleton: signal(true),
      placeholders: [1, 2, 3, 4],
      money,
      statusColor,
      control,
    },
    template: `
      <div style="${stack} max-width: 44rem;">
        <span [style]="control"><andes-switch [checked]="skeleton()" (checkedChange)="skeleton.set($event)">Show the skeleton</andes-switch></span>
        <andes-table [attr.aria-busy]="skeleton()">
          ${HEAD}
          <tbody andesTableBody>
            @if (skeleton()) {
              @for (placeholder of placeholders; track placeholder) {
                <tr andesTableRow>
                  <td andesTableCell><andes-skeleton-text active [width]="60" /></td>
                  <td andesTableCell><andes-skeleton-text active [width]="120" /></td>
                  <td andesTableCell><andes-skeleton-text active [width]="64" /></td>
                  <td andesTableCell align="end"><andes-skeleton-text active [width]="56" /></td>
                </tr>
              }
            } @else {
              ${ROWS('rows')}
            }
          </tbody>
        </andes-table>
      </div>`,
  }),
};

/** Refreshing. */
export const Refresh: Story = {
  name: 'Refresh with a loading button',
  parameters: about(
    'A refresh button starts the request, shows its own spinner and the table overlay, and the rows change when the answer arrives.',
  ),
  render: () => {
    const loading = signal(false);
    const batch = signal(0);
    return {
      props: {
        loading,
        money,
        statusColor,
        bar,
        rows: computed(() => makeOrders(4 + batch()).slice(batch())),
        refresh: () => {
          loading.set(true);
          setTimeout(() => {
            batch.update((value) => (value + 1) % 5);
            loading.set(false);
          }, 900);
        },
      },
      template: `
        <div style="${stack} max-width: 44rem;">
          <div [style]="bar">
            <andes-button variant="outline" size="sm" [loading]="loading()" (click)="refresh()">
              <ng-icon slot="icon-start" name="lucideRefreshCw" />
              Refresh
            </andes-button>
          </div>
          <andes-table [loading]="loading()" loadingLabel="Refreshing invoices">
            ${HEAD}
            <tbody andesTableBody>${ROWS('rows()')}</tbody>
          </andes-table>
        </div>`,
    };
  },
};

/** The default empty state. */
export const Empty: Story = {
  name: 'Empty',
  parameters: about(
    'A body with no rows holds one cell that spans every column and shows the empty state: a quiet picture and the words No data.',
  ),
  render: () => ({
    template: `
      <andes-table style="max-width: 44rem;">
        ${HEAD}
        <tbody andesTableBody>
          <tr andesTableRow>
            <td andesTableCell colspan="4"><andes-table-empty /></td>
          </tr>
        </tbody>
      </andes-table>`,
  }),
};

/** A custom empty state. */
export const CustomEmpty: Story = {
  name: 'Custom empty',
  parameters: about(
    'Project your own content to replace the default: an empty picture with a message of its own and a button that fixes the problem.',
  ),
  render: () => ({
    template: `
      <andes-table style="max-width: 44rem;">
        ${HEAD}
        <tbody andesTableBody>
          <tr andesTableRow>
            <td andesTableCell colspan="4">
              <andes-table-empty>
                <div style="display: flex; flex-direction: column; align-items: center; gap: 0.75rem;">
                  <andes-empty preset="table" heading="No invoices yet" description="Create the first one and it will show here" />
                  <andes-button size="sm">
                    <ng-icon slot="icon-start" name="lucidePlus" />
                    Create an invoice
                  </andes-button>
                </div>
              </andes-table-empty>
            </td>
          </tr>
        </tbody>
      </andes-table>`,
  }),
};

/** An empty state from a provider. */
export const EmptyProvider: Story = {
  name: 'Empty from a provider',
  parameters: about(
    'A provider sets the text of every empty state under it, so a whole section says the same thing without repeating it in each table.',
  ),
  render: () => ({
    template: `
      <div [andesEmptyProvider]="{ description: 'Nothing to show for this period' }" style="display: grid; gap: 1.5rem; max-width: 44rem;">
        @for (name of ['Sales', 'Refunds']; track name) {
          <andes-table>
            <caption andesTableCaption>{{ name }}</caption>
            <thead andesTableHeader>
              <tr andesTableRow>
                <th andesTableHead>Invoice</th>
                <th andesTableHead align="end">Total</th>
              </tr>
            </thead>
            <tbody andesTableBody>
              <tr andesTableRow>
                <td andesTableCell colspan="2"><andes-table-empty /></td>
              </tr>
            </tbody>
          </andes-table>
        }
      </div>`,
  }),
};

/** A filter that matches nothing. */
export const FilteredEmpty: Story = {
  name: 'Filter empty and column empty',
  parameters: about(
    'When a search and a column filter leave no rows, say so, name what was asked for and offer a button that clears both.',
  ),
  render: () => {
    const search = signal('zzz');
    const filters = signal<AndesTableFilters>({});
    const all = makeOrders(8);
    return {
      props: {
        search,
        filters,
        money,
        statusColor,
        bar,
        statuses: ['Paid', 'Pending', 'Overdue', 'Refunded'].map((value) => ({
          text: value,
          value,
        })),
        rows: computed(() =>
          andesFilterRows(
            all.filter((row) =>
              row.customer.toLowerCase().includes(search().toLowerCase()),
            ),
            filters(),
            { status: andesOptionFilter((row) => row.status) },
          ),
        ),
        clear: () => {
          search.set('');
          filters.set({});
        },
      },
      template: `
        <div style="${stack} max-width: 44rem;">
          <div [style]="bar">
            <andes-input style="width: 14rem;" aria-label="Search customers" placeholder="Search customers" [(value)]="search" />
          </div>
          <andes-table [(filters)]="filters">
            <thead andesTableHeader>
              <tr andesTableRow>
                <th andesTableHead>Invoice</th>
                <th andesTableHead>Customer</th>
                <th andesTableHead>
                  Status
                  <andes-table-filter column="status" label="Filter status" [options]="statuses" />
                </th>
                <th andesTableHead align="end">Total</th>
              </tr>
            </thead>
            <tbody andesTableBody>
              ${ROWS('rows()')}
              @if (rows().length === 0) {
                <tr andesTableRow>
                  <td andesTableCell colspan="4">
                    <andes-table-empty>
                      <div style="display: flex; flex-direction: column; align-items: center; gap: 0.75rem; padding-block: 1rem;">
                        <andes-empty preset="table" description="No invoice matches the search and the filters" />
                        <andes-button variant="outline" size="sm" (click)="clear()">
                          <ng-icon slot="icon-start" name="lucideX" />
                          Clear filters
                        </andes-button>
                      </div>
                    </andes-table-empty>
                  </td>
                </tr>
              }
            </tbody>
          </andes-table>
        </div>`,
    };
  },
};

/** An error with a retry. */
export const ErrorState: Story = {
  name: 'Error state with retry',
  parameters: about(
    'When the request fails the body explains it in words with an icon, and a button asks again.',
  ),
  render: () => {
    const state = signal<'error' | 'loading' | 'data'>('error');
    return {
      props: {
        state,
        rows: makeOrders(4),
        money,
        statusColor,
        retry: () => {
          state.set('loading');
          setTimeout(() => state.set('data'), 900);
        },
      },
      template: `
        <andes-table style="max-width: 44rem;" [loading]="state() === 'loading'" loadingLabel="Loading invoices">
          ${HEAD}
          <tbody andesTableBody>
            @if (state() === 'data') {
              ${ROWS('rows')}
            } @else {
              <tr andesTableRow>
                <td andesTableCell colspan="4">
                  <andes-alert severity="danger" title="The invoices could not be loaded" description="Check the connection and try once more.">
                    <andes-button slot="action" variant="outline" size="sm" (click)="retry()">
                      <ng-icon slot="icon-start" name="lucideRefreshCw" />
                      Try again
                    </andes-button>
                  </andes-alert>
                </td>
              </tr>
            }
          </tbody>
        </andes-table>`,
    };
  },
};

/** Footer totals. */
export const FooterTotals: Story = {
  name: 'Footer totals',
  parameters: about(
    'A footer row closes the table with a total, laid out with the same columns as the rows above it.',
  ),
  render: () => {
    const rows = makeOrders(5);
    return {
      props: {
        rows,
        money,
        statusColor,
        total: rows.reduce((sum, row) => sum + row.total, 0),
      },
      template: `
        <andes-table style="max-width: 44rem;">
          ${HEAD}
          <tbody andesTableBody>${ROWS('rows')}</tbody>
          <tfoot andesTableFooter>
            <tr andesTableRow>
              <td andesTableCell colspan="3">Total of {{ rows.length }} invoices</td>
              <td andesTableCell align="end">{{ money(total) }}</td>
            </tr>
          </tfoot>
        </andes-table>`,
    };
  },
};

/** Several summary rows. */
export const SummaryRows: Story = {
  name: 'Summary rows',
  parameters: about(
    'A footer can hold several rows, with cells that span columns, such as a subtotal, a tax and the total to pay.',
  ),
  render: () => {
    const rows = makeOrders(4);
    const subtotal = rows.reduce((sum, row) => sum + row.total, 0);
    return {
      props: {
        rows,
        money,
        statusColor,
        subtotal,
        tax: subtotal * 0.18,
        strong,
      },
      template: `
        <andes-table style="max-width: 44rem;">
          ${HEAD}
          <tbody andesTableBody>${ROWS('rows')}</tbody>
          <tfoot andesTableFooter>
            <tr andesTableRow>
              <td andesTableCell colspan="3" align="end">Subtotal</td>
              <td andesTableCell align="end">{{ money(subtotal) }}</td>
            </tr>
            <tr andesTableRow>
              <td andesTableCell colspan="3" align="end">Tax (18%)</td>
              <td andesTableCell align="end">{{ money(tax) }}</td>
            </tr>
            <tr andesTableRow>
              <td andesTableCell colspan="3" align="end">To pay</td>
              <td andesTableCell align="end">{{ money(subtotal + tax) }}</td>
            </tr>
          </tfoot>
        </andes-table>`,
    };
  },
};

/** Caption. */
export const Captions: Story = {
  name: 'Caption',
  parameters: about(
    'The caption names the table and can be drawn above or below it, whatever its place in the markup.',
  ),
  render: () => ({
    props: { rows: makeOrders(3), money, statusColor, strong },
    template: `
      <div style="${stack} max-width: 44rem;">
        @for (side of ['top', 'bottom']; track side) {
          <andes-table [captionSide]="side">
            <caption andesTableCaption>Recent invoices, caption at the {{ side }}</caption>
            ${HEAD}
            <tbody andesTableBody>${ROWS('rows')}</tbody>
          </andes-table>
        }
      </div>`,
  }),
};

/** All the states. */
export const Gallery: Story = {
  name: 'Per-state gallery',
  parameters: about(
    'One table and a switch between its states: data, loading, skeleton rows, empty and error.',
  ),
  render: () => ({
    props: {
      state: signal('data'),
      rows: makeOrders(4),
      placeholders: [1, 2, 3, 4],
      money,
      statusColor,
      options: [
        { value: 'data', label: 'Data' },
        { value: 'loading', label: 'Loading' },
        { value: 'skeleton', label: 'Skeleton' },
        { value: 'empty', label: 'Empty' },
        { value: 'error', label: 'Error' },
      ],
    },
    template: `
      <div style="${stack} max-width: 44rem;">
        <andes-segmented aria-label="State" [options]="options" [(value)]="state" />
        <andes-table [loading]="state() === 'loading'">
          ${HEAD}
          <tbody andesTableBody>
            @switch (state()) {
              @case ('empty') {
                <tr andesTableRow><td andesTableCell colspan="4"><andes-table-empty /></td></tr>
              }
              @case ('error') {
                <tr andesTableRow>
                  <td andesTableCell colspan="4">
                    <andes-alert severity="danger" title="The invoices could not be loaded" />
                  </td>
                </tr>
              }
              @case ('skeleton') {
                @for (placeholder of placeholders; track placeholder) {
                  <tr andesTableRow>
                    <td andesTableCell><andes-skeleton-text active [width]="60" /></td>
                    <td andesTableCell><andes-skeleton-text active [width]="120" /></td>
                    <td andesTableCell><andes-skeleton-text active [width]="64" /></td>
                    <td andesTableCell align="end"><andes-skeleton-text active [width]="56" /></td>
                  </tr>
                }
              }
              @default {
                ${ROWS('rows')}
              }
            }
          </tbody>
        </andes-table>
      </div>`,
  }),
};
