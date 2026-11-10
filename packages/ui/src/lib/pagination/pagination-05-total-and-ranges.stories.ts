import { signal } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular';

import {
  about,
  labelled,
  pg,
  scene,
  stack,
  withDescription,
  withPaginationKit,
} from '../../testing/pagination-story-kit';
import { AndesPagination } from './pagination';

/*
 * Saying where the page sits in the data: the total as a function or a template, the item
 * range, other languages, with the page-size changer, and an empty list.
 */

const meta: Meta<AndesPagination> = {
  title: 'Navigation/Pagination/Total and ranges',
  component: AndesPagination,
  decorators: [withDescription, withPaginationKit],
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<AndesPagination>;

type Range = [number, number];

export const TotalNumber: Story = {
  name: 'Total number',
  parameters: about(
    'showTotal as a function: it receives the total and returns the text drawn before the pages.',
  ),
  render: () =>
    scene(pg('[total]="85" [showTotal]="rangeSummary"', 'Total number'), {
      rangeSummary: (total: number) => `Total ${total} items`,
    }),
};

export const TotalRange: Story = {
  name: 'Total with the range',
  parameters: about(
    'The same function also receives the [from, to] range of the current page, so it can write "1-20 of 85 items".',
  ),
  render: () =>
    scene(
      pg('[total]="85" [pageSize]="20" [showTotal]="rangeSummary"', 'Range'),
      {
        rangeSummary: (total: number, range: Range) =>
          `${range[0]}-${range[1]} of ${total} items`,
      },
    ),
};

export const TotalFollowsPage: Story = {
  name: 'Range follows the page',
  parameters: about(
    'The range is recomputed on every change, and the last page shows the shorter range that remains.',
  ),
  render: () =>
    scene(
      pg(
        '[(current)]="page" [total]="85" [pageSize]="20" [showTotal]="rangeSummary"',
        'Range follows the page',
      ),
      {
        page: signal(4),
        rangeSummary: (total: number, range: Range) =>
          `${range[0]}-${range[1]} of ${total} items`,
      },
    ),
};

export const TotalTemplate: Story = {
  name: 'Total as a template',
  parameters: about(
    'A template gets the total and the range as context, so the text can carry tags, icons or emphasis.',
  ),
  render: () =>
    scene(
      `${pg('[total]="85" [pageSize]="20" [showTotal]="totalTpl"', 'Total template')}
      <ng-template #totalTpl let-total let-range="range">
        <span [style]="row">
          <ng-icon name="lucideList" />
          <span [style]="strong">{{ range[0] }}-{{ range[1] }}</span>
          <span [style]="muted">of</span>
          <andes-tag color="info">{{ total }} items</andes-tag>
        </span>
      </ng-template>`,
    ),
};

export const TotalLocalised: Story = {
  name: 'Total in another language',
  parameters: about('The text is yours, so any language or wording works.'),
  render: () =>
    scene(
      stack(
        labelled(
          'Spanish',
          pg(
            '[total]="85" [pageSize]="20" [showTotal]="spanish" previousLabel="Página anterior" nextLabel="Página siguiente" pageLabel="Página"',
            'Paginación',
          ),
        ),
        labelled(
          'German',
          pg(
            '[total]="85" [pageSize]="20" [showTotal]="german" previousLabel="Vorherige Seite" nextLabel="Nächste Seite" pageLabel="Seite"',
            'Seitennavigation',
          ),
        ),
      ),
      {
        spanish: (total: number, range: Range) =>
          `Mostrando ${range[0]}-${range[1]} de ${total} elementos`,
        german: (total: number, range: Range) =>
          `${range[0]}-${range[1]} von ${total} Einträgen`,
      },
    ),
};

export const TotalWithChanger: Story = {
  name: 'Total with the page-size changer',
  parameters: about(
    'The total, the pages and the page-size select in one row, with the range following the size.',
  ),
  render: () =>
    scene(
      `<andes-pagination aria-label="Total with the changer" style="width: min(56rem, calc(100vw - 2rem));"
        [total]="285" [showSizeChanger]="true" [showTotal]="rangeSummary" />`,
      {
        rangeSummary: (total: number, range: Range) =>
          `${range[0]}-${range[1]} of ${total} items`,
      },
    ),
};

export const TotalEmpty: Story = {
  name: 'Total of zero',
  parameters: about(
    'With nothing to page through the range is [0, 0], no page is drawn and every control is disabled.',
  ),
  render: () =>
    scene(
      pg(
        '[total]="0" [showTotal]="rangeSummary" [showSizeChanger]="true" [showQuickJumper]="true"',
        'Empty',
      ),
      {
        rangeSummary: (total: number, range: Range) =>
          `${range[0]}-${range[1]} of ${total} items`,
      },
    ),
};
