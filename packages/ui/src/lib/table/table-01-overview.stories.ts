import { signal } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular';

import {
  about,
  bar,
  control,
  money,
  PEOPLE,
  makeOrders,
  stack,
  strong,
  withDescription,
  withTableKit,
} from '../../testing/table-story-kit';
import { AndesTable } from './table';

/*
 * The first stories: the playground, the plain table and the things every table needs - an
 * actions column with tags, the three sizes, borders, a title and a footer, the header toggle.
 */

const meta: Meta<AndesTable> = {
  title: 'Data Display/Table/Overview',
  component: AndesTable,
  tags: ['autodocs'],
  decorators: [withDescription, withTableKit],
  parameters: { layout: 'padded' },
  argTypes: {
    density: {
      control: 'inline-radio',
      options: ['compact', 'default', 'comfortable'],
    },
    bordered: { control: 'boolean' },
    striped: { control: 'boolean' },
    framed: { control: 'boolean' },
    rowHover: { control: 'boolean' },
    loading: { control: 'boolean' },
    tableLayout: { control: 'inline-radio', options: ['auto', 'fixed'] },
    captionSide: { control: 'inline-radio', options: ['top', 'bottom'] },
  },
  args: {
    density: 'default',
    bordered: false,
    striped: false,
    framed: true,
    rowHover: true,
    loading: false,
    tableLayout: 'auto',
    captionSide: 'bottom',
  },
  render: (args) => ({
    props: { ...args, rows: makeOrders(6), money },
    template: `
      <andes-table style="max-width: 44rem;"
        [density]="density" [bordered]="bordered" [striped]="striped" [framed]="framed"
        [rowHover]="rowHover" [loading]="loading" [tableLayout]="tableLayout" [captionSide]="captionSide">
        <caption andesTableCaption>Recent invoices</caption>
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
              <td andesTableCell>{{ row.status }}</td>
              <td andesTableCell align="end">{{ money(row.total) }}</td>
            </tr>
          }
        </tbody>
      </andes-table>`,
  }),
};

export default meta;

type Story = StoryObj<AndesTable>;

/** The playground. */
export const Playground: Story = {
  name: 'Playground',
  parameters: about(
    'Use the controls to try the size, the borders, the stripes, the frame, the hover and the loading state on one table.',
  ),
};

/** The smallest table. */
export const Basic: Story = {
  name: 'Basic usage',
  parameters: about(
    'A table is a real table: a header row of heads and a body of rows of cells, each one a native element with a directive.',
  ),
  render: () => ({
    props: { people: PEOPLE },
    template: `
      <andes-table style="max-width: 40rem;">
        <thead andesTableHeader>
          <tr andesTableRow>
            <th andesTableHead>Name</th>
            <th andesTableHead align="end">Age</th>
            <th andesTableHead>Address</th>
          </tr>
        </thead>
        <tbody andesTableBody>
          @for (person of people; track person.key) {
            <tr andesTableRow>
              <td andesTableCell>{{ person.name }}</td>
              <td andesTableCell align="end">{{ person.age }}</td>
              <td andesTableCell>{{ person.address }}</td>
            </tr>
          }
        </tbody>
      </andes-table>`,
  }),
};

/** Tags and actions. */
export const ActionsAndTags: Story = {
  name: 'Actions column and tags',
  parameters: about(
    'A cell can hold any component: tags for the labels of a row and buttons for its actions, with clear air between them.',
  ),
  render: () => ({
    props: { people: PEOPLE },
    template: `
      <andes-table style="max-width: 52rem;">
        <thead andesTableHeader>
          <tr andesTableRow>
            <th andesTableHead>Name</th>
            <th andesTableHead align="end">Age</th>
            <th andesTableHead>Address</th>
            <th andesTableHead>Tags</th>
            <th andesTableHead>Action</th>
          </tr>
        </thead>
        <tbody andesTableBody>
          @for (person of people; track person.key) {
            <tr andesTableRow>
              <td andesTableCell>{{ person.name }}</td>
              <td andesTableCell align="end">{{ person.age }}</td>
              <td andesTableCell>{{ person.address }}</td>
              <td andesTableCell>
                <span style="display: inline-flex; gap: 0.5rem;">
                  @for (tag of person.tags; track tag) {
                    <andes-tag [color]="tag === 'loser' ? 'danger' : 'success'">{{ tag }}</andes-tag>
                  }
                </span>
              </td>
              <td andesTableCell>
                <span style="display: inline-flex; gap: 0.25rem;">
                  <andes-button variant="link" size="sm">Invite {{ person.name }}</andes-button>
                  <andes-button variant="link" size="sm">Delete</andes-button>
                </span>
              </td>
            </tr>
          }
        </tbody>
      </andes-table>`,
  }),
};

/** The three sizes. */
export const Sizes: Story = {
  name: 'Sizes',
  parameters: about(
    'The density sets the row height and the padding: compact rows are 36px tall, the default 44px and comfortable ones 52px.',
  ),
  render: () => ({
    props: {
      people: PEOPLE,
      sizes: ['compact', 'default', 'comfortable'],
      strong,
    },
    template: `
      <div style="${stack} max-width: 40rem;">
        @for (size of sizes; track size) {
          <div>
            <p [style]="strong" style="margin: 0 0 0.5rem;">{{ size }}</p>
            <andes-table [density]="size">
              <thead andesTableHeader>
                <tr andesTableRow>
                  <th andesTableHead>Name</th>
                  <th andesTableHead align="end">Age</th>
                  <th andesTableHead>Address</th>
                </tr>
              </thead>
              <tbody andesTableBody>
                @for (person of people; track person.key) {
                  <tr andesTableRow>
                    <td andesTableCell>{{ person.name }}</td>
                    <td andesTableCell align="end">{{ person.age }}</td>
                    <td andesTableCell>{{ person.address }}</td>
                  </tr>
                }
              </tbody>
            </andes-table>
          </div>
        }
      </div>`,
  }),
};

/** Grid lines. */
export const Bordered: Story = {
  name: 'Bordered',
  parameters: about(
    'The bordered table draws a light line between every cell, as soft as the row separators.',
  ),
  render: () => ({
    props: { people: PEOPLE },
    template: `
      <andes-table bordered style="max-width: 40rem;">
        <thead andesTableHeader>
          <tr andesTableRow>
            <th andesTableHead>Name</th>
            <th andesTableHead align="end">Age</th>
            <th andesTableHead>Address</th>
          </tr>
        </thead>
        <tbody andesTableBody>
          @for (person of people; track person.key) {
            <tr andesTableRow>
              <td andesTableCell>{{ person.name }}</td>
              <td andesTableCell align="end">{{ person.age }}</td>
              <td andesTableCell>{{ person.address }}</td>
            </tr>
          }
        </tbody>
      </andes-table>`,
  }),
};

/** Title and footer. */
export const TitleAndFooter: Story = {
  name: 'Title and footer',
  parameters: about(
    'A caption names the table for everyone, and a footer row carries the totals.',
  ),
  render: () => ({
    props: { rows: makeOrders(4), money },
    template: `
      <andes-table style="max-width: 40rem;" captionSide="top">
        <caption andesTableCaption>Invoices of the month</caption>
        <thead andesTableHeader>
          <tr andesTableRow>
            <th andesTableHead>Invoice</th>
            <th andesTableHead>Customer</th>
            <th andesTableHead align="end">Total</th>
          </tr>
        </thead>
        <tbody andesTableBody>
          @for (row of rows; track row.id) {
            <tr andesTableRow>
              <td andesTableCell>{{ row.id }}</td>
              <td andesTableCell>{{ row.customer }}</td>
              <td andesTableCell align="end">{{ money(row.total) }}</td>
            </tr>
          }
        </tbody>
        <tfoot andesTableFooter>
          <tr andesTableRow>
            <td andesTableCell colspan="2">Total</td>
            <td andesTableCell align="end">{{ money(rows[0].total + rows[1].total + rows[2].total + rows[3].total) }}</td>
          </tr>
        </tfoot>
      </andes-table>`,
  }),
};

/** Border, title and footer. */
export const BorderTitleFooter: Story = {
  name: 'Border, title and footer',
  parameters: about(
    'Borders, a caption above and a footer below work together on one table.',
  ),
  render: () => ({
    props: { rows: makeOrders(4), money },
    template: `
      <andes-table bordered captionSide="top" style="max-width: 40rem;">
        <caption andesTableCaption>Invoices of the month</caption>
        <thead andesTableHeader>
          <tr andesTableRow>
            <th andesTableHead>Invoice</th>
            <th andesTableHead>Customer</th>
            <th andesTableHead align="end">Total</th>
          </tr>
        </thead>
        <tbody andesTableBody>
          @for (row of rows; track row.id) {
            <tr andesTableRow>
              <td andesTableCell>{{ row.id }}</td>
              <td andesTableCell>{{ row.customer }}</td>
              <td andesTableCell align="end">{{ money(row.total) }}</td>
            </tr>
          }
        </tbody>
        <tfoot andesTableFooter>
          <tr andesTableRow>
            <td andesTableCell colspan="3">{{ rows.length }} invoices</td>
          </tr>
        </tfoot>
      </andes-table>`,
  }),
};

/** The header can go. */
export const HeaderToggle: Story = {
  name: 'Header toggle',
  parameters: about(
    'The header row is just markup, so a switch can show it or leave it out.',
  ),
  render: () => ({
    props: { people: PEOPLE, header: signal(true), control, bar },
    template: `
      <div style="${stack} max-width: 40rem;">
        <span [style]="control"><andes-switch [checked]="header()" (checkedChange)="header.set($event)">Show the header</andes-switch></span>
        <andes-table>
          @if (header()) {
            <thead andesTableHeader>
              <tr andesTableRow>
                <th andesTableHead>Name</th>
                <th andesTableHead align="end">Age</th>
                <th andesTableHead>Address</th>
              </tr>
            </thead>
          }
          <tbody andesTableBody>
            @for (person of people; track person.key) {
              <tr andesTableRow>
                <td andesTableCell>{{ person.name }}</td>
                <td andesTableCell align="end">{{ person.age }}</td>
                <td andesTableCell>{{ person.address }}</td>
              </tr>
            }
          </tbody>
        </andes-table>
      </div>`,
  }),
};

/** Without the frame. */
export const Unframed: Story = {
  name: 'Without frame',
  parameters: about(
    'Turn the frame off when the table already sits in a card or a panel of its own.',
  ),
  render: () => ({
    props: { people: PEOPLE },
    template: `
      <div style="max-width: 40rem; padding: 1rem; border: 1px solid var(--andes-color-border); border-radius: var(--andes-radius-lg);">
        <andes-table [framed]="false">
          <thead andesTableHeader>
            <tr andesTableRow>
              <th andesTableHead>Name</th>
              <th andesTableHead align="end">Age</th>
              <th andesTableHead>Address</th>
            </tr>
          </thead>
          <tbody andesTableBody>
            @for (person of people; track person.key) {
              <tr andesTableRow>
                <td andesTableCell>{{ person.name }}</td>
                <td andesTableCell align="end">{{ person.age }}</td>
                <td andesTableCell>{{ person.address }}</td>
              </tr>
            }
          </tbody>
        </andes-table>
      </div>`,
  }),
};

/** Striped rows. */
export const Striped: Story = {
  name: 'Striped rows',
  parameters: about(
    'Every other row carries a light tint, which helps the eye follow a long row across the width.',
  ),
  render: () => ({
    props: { rows: makeOrders(7), money },
    template: `
      <andes-table striped style="max-width: 44rem;">
        <thead andesTableHeader>
          <tr andesTableRow>
            <th andesTableHead>Invoice</th>
            <th andesTableHead>Customer</th>
            <th andesTableHead>Method</th>
            <th andesTableHead align="end">Total</th>
          </tr>
        </thead>
        <tbody andesTableBody>
          @for (row of rows; track row.id) {
            <tr andesTableRow>
              <td andesTableCell>{{ row.id }}</td>
              <td andesTableCell>{{ row.customer }}</td>
              <td andesTableCell>{{ row.method }}</td>
              <td andesTableCell align="end">{{ money(row.total) }}</td>
            </tr>
          }
        </tbody>
      </andes-table>`,
  }),
};
