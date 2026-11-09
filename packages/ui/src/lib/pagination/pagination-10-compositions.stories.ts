import { signal } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular';

import {
  about,
  articles,
  orders,
  people,
  range,
  scene,
  slicePage,
  TILE_TINTS,
  withDescription,
  withPaginationKit,
} from '../../testing/pagination-story-kit';
import { AndesPagination } from './pagination';

/*
 * The control in a real page: under a list, over a gallery, in a card footer, with a search
 * box, as links for a router, on a phone, as the dots of a reel, in an inbox, and as the
 * footer of a data grid.
 */

const meta: Meta<AndesPagination> = {
  title: 'Navigation/Pagination/Compositions',
  component: AndesPagination,
  decorators: [withDescription, withPaginationKit],
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<AndesPagination>;

const PEOPLE = people(47);

/** The people whose name or role contains the query. */
const matches = (query: string) =>
  PEOPLE.filter((person) =>
    `${person.name} ${person.role}`.toLowerCase().includes(query.toLowerCase()),
  );

export const UnderAList: Story = {
  name: 'Under a list',
  parameters: about(
    'A list of people with the total and the pages under it; the rows follow the page and the page size.',
  ),
  render: () =>
    scene(
      `<div [style]="wide">
        <div [style]="card">
          @for (person of rows(page(), perPage()); track person.id) {
            <div [style]="listRow">
              <andes-avatar><andes-avatar-fallback>{{ person.initials }}</andes-avatar-fallback></andes-avatar>
              <span style="flex: 1;">
                <span [style]="strong" style="display: block;">{{ person.name }}</span>
                <span [style]="muted">{{ person.email }}</span>
              </span>
              <andes-tag>{{ person.role }}</andes-tag>
            </div>
          }
        </div>
        <andes-pagination aria-label="People" [(current)]="page" [(pageSize)]="perPage" [total]="all.length"
          [pageSizeOptions]="[5, 10, 20]" [showSizeChanger]="true" [showTotal]="rangeSummary" />
      </div>`,
      {
        all: PEOPLE,
        page: signal(1),
        perPage: signal(5),
        rows: (page: number, size: number) => slicePage(PEOPLE, page, size),
        rangeSummary: (total: number, range: [number, number]) =>
          `${range[0]}-${range[1]} of ${total} people`,
      },
    ),
};

export const Gallery: Story = {
  name: 'A gallery',
  parameters: about(
    'A grid of tiles with a centred, pill-shaped control under it, where the first and last buttons make a long set quick to cross.',
  ),
  render: () =>
    scene(
      `<div [style]="wide">
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(8rem, 1fr)); gap: 0.75rem;">
          @for (tile of tiles(page()); track tile) {
            <div [style]="'aspect-ratio: 4 / 3; border-radius: 0.75rem; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.25rem; color: #334155; background: ' + tint(tile)">
              <ng-icon name="lucideImage" style="width: 1.5rem; height: 1.5rem;" />
              <span style="font: 0.75rem var(--andes-font-family), sans-serif;">Photo {{ tile }}</span>
            </div>
          }
        </div>
        <andes-pagination aria-label="Gallery" align="center" shape="pill" variant="ghost" [(current)]="page"
          [total]="120" [pageSize]="12" [showFirstLast]="true" />
      </div>`,
      {
        page: signal(2),
        tiles: (page: number) => range(12).map((n) => (page - 1) * 12 + n),
        tint: (tile: number) => TILE_TINTS[tile % TILE_TINTS.length],
      },
    ),
};

export const CardFooter: Story = {
  name: 'In a card footer',
  parameters: about(
    'The compact layout sits in the footer of a card, saying where the page is without taking a row of numbers.',
  ),
  render: () =>
    scene(
      `<div [style]="card + ' width: min(28rem, calc(100vw - 2rem));'">
        <div [style]="listRow">
          <ng-icon name="lucideMessageSquare" />
          <span [style]="strong">Recent activity</span>
        </div>
        @for (person of rows(page()); track person.id) {
          <div [style]="listRow">
            <andes-avatar size="sm"><andes-avatar-fallback>{{ person.initials }}</andes-avatar-fallback></andes-avatar>
            <span [style]="text">{{ person.name }} commented</span>
          </div>
        }
        <div style="padding: 0.75rem 1rem; display: flex; justify-content: center;">
          <andes-pagination aria-label="Activity" layout="compact" size="small" [(current)]="page"
            [total]="people.length" [pageSize]="4" />
        </div>
      </div>`,
      {
        people: PEOPLE,
        page: signal(1),
        rows: (page: number) => slicePage(PEOPLE, page, 4),
      },
    ),
};

export const SearchResults: Story = {
  name: 'Search results page',
  parameters: about(
    'A search box filters the results, the page returns to 1 on every new query, and the total says how many matched.',
  ),
  render: () =>
    scene(
      `<div [style]="wide">
        <andes-input aria-label="Search people" placeholder="Search by name or role" [(value)]="query" (valueChange)="page.set(1)">
          <ng-icon slot="prefix" name="lucideSearch" />
        </andes-input>
        <span [style]="muted">{{ matches(query()).length }} results</span>
        <div [style]="card">
          @for (person of rows(query(), page()); track person.id) {
            <div [style]="listRow">
              <andes-avatar size="sm"><andes-avatar-fallback>{{ person.initials }}</andes-avatar-fallback></andes-avatar>
              <span [style]="text" style="flex: 1;">{{ person.name }}</span>
              <span [style]="muted">{{ person.role }}</span>
            </div>
          } @empty {
            <andes-empty description="No one matches that search" />
          }
        </div>
        <andes-pagination aria-label="Search results" [(current)]="page" [total]="matches(query()).length"
          [pageSize]="5" [hideOnSinglePage]="true" [showTotal]="rangeSummary" />
      </div>`,
      {
        query: signal(''),
        page: signal(1),
        matches,
        rows: (query: string, page: number) =>
          slicePage(matches(query), page, 5),
        rangeSummary: (total: number, range: [number, number]) =>
          `${range[0]}-${range[1]} of ${total}`,
      },
    ),
};

export const BlogWithLinks: Story = {
  name: 'A blog with page links',
  parameters: about(
    'Every page is a real link built by linkFor, so it can be opened in a new tab, while a plain click is handled in place and pageChange tells the router.',
  ),
  render: () => {
    const all = articles(24);
    return scene(
      `<div [style]="wide">
        @for (article of rows(page()); track article.id) {
          <div [style]="card + ' padding: 1rem;'">
            <div [style]="heading">{{ article.title }}</div>
            <p [style]="muted + ' margin: 0.25rem 0 0.5rem;'">{{ article.summary }}</p>
            <andes-tag><ng-icon name="lucideBookOpen" /> {{ article.minutes }} min read</andes-tag>
          </div>
        }
        <andes-pagination aria-label="Blog pages" align="center" [(current)]="page" [total]="all.length" [pageSize]="3"
          [linkFor]="link" prevText="Newer" nextText="Older" />
        <span [style]="muted + ' text-align: center;'">Page {{ page() }}: {{ link(page()) }}</span>
      </div>`,
      {
        all,
        page: signal(1),
        rows: (page: number) => slicePage(all, page, 3),
        link: (page: number) => `#/blog/page/${page}`,
      },
    );
  },
};

export const Phone: Story = {
  name: 'On a phone',
  parameters: about(
    'In a 360px column the responsive control folds into the small simple form, and the page-size select drops to its own row.',
  ),
  render: () =>
    scene(
      `<div [style]="card + ' width: 360px; max-width: 100%; padding: 1rem;'">
        <andes-pagination aria-label="Phone" [total]="500" [defaultCurrent]="6" [responsive]="true"
          [showSizeChanger]="true" [showTotal]="rangeSummary" />
      </div>`,
      {
        rangeSummary: (total: number, range: [number, number]) =>
          `${range[0]}-${range[1]} of ${total}`,
      },
    ),
};

export const Reel: Story = {
  name: 'The dots of a reel',
  parameters: about(
    'itemRender turns the pages into dots under a slide, with the arrows kept, for a carousel that is still a pagination.',
  ),
  render: () =>
    scene(
      `<div [style]="column">
        <div [style]="'display: flex; height: 9rem; align-items: center; justify-content: center; border-radius: 0.75rem; font-size: 1.5rem; background: ' + tint(page())">
          Slide {{ page() }}
        </div>
        <andes-pagination aria-label="Slides" align="center" shape="pill" variant="ghost" [(current)]="page" [total]="5" [pageSize]="1"
          [itemRender]="item" [showTitle]="false" />
        <ng-template #item let-page let-type="type" let-originalElement="originalElement">
          @if (type === 'page') {
            <span style="width: 0.5rem; height: 0.5rem; border-radius: 9999px; background: currentColor;"></span>
          } @else {
            <ng-container *ngTemplateOutlet="originalElement; context: { $implicit: page, type: type }" />
          }
        </ng-template>
      </div>`,
      {
        page: signal(1),
        tint: (page: number) => TILE_TINTS[page % TILE_TINTS.length],
      },
    ),
};

export const Inbox: Story = {
  name: 'An inbox',
  parameters: about(
    'A cursor-style control with Newer and Older: the source does not know its total, so only hasNextPage is needed.',
  ),
  render: () =>
    scene(
      `<div [style]="wide">
        <div [style]="card">
          @for (person of rows(page()); track person.id) {
            <div [style]="listRow">
              <ng-icon name="lucideMail" />
              <span [style]="text" style="flex: 1;">Message from {{ person.name }}</span>
              <span [style]="muted">{{ person.role }}</span>
            </div>
          }
        </div>
        <andes-pagination aria-label="Inbox" align="end" variant="outline" [(current)]="page"
          [hasNextPage]="page() * 5 < people.length" prevText="Newer" nextText="Older" />
      </div>`,
      {
        people: PEOPLE,
        page: signal(1),
        rows: (page: number) => slicePage(PEOPLE, page, 5),
      },
    ),
};

export const Catalogue: Story = {
  name: 'A catalogue',
  parameters: about(
    'A product grid with a sort select above and the page-size select, the range and the pages below.',
  ),
  render: () =>
    scene(
      `<div [style]="wide">
        <div [style]="row + ' justify-content: space-between;'">
          <span [style]="strong">Products</span>
          <andes-select aria-label="Sort" style="width: 11rem;" [(value)]="sort"
            [options]="[{ value: 'name', label: 'Name' }, { value: 'price', label: 'Price' }]" />
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(9rem, 1fr)); gap: 0.75rem;">
          @for (item of products(page(), perPage()); track item) {
            <div [style]="card + ' padding: 0.75rem; display: flex; flex-direction: column; gap: 0.25rem; align-items: flex-start;'">
              <ng-icon name="lucidePackage" style="width: 1.5rem; height: 1.5rem;" />
              <span [style]="text">Product {{ item }}</span>
              <span [style]="muted">\${{ 10 + item * 3 }}.00</span>
            </div>
          }
        </div>
        <andes-pagination aria-label="Catalogue" [(current)]="page" [(pageSize)]="perPage" [total]="96"
          [pageSizeOptions]="[6, 12, 24]" [showSizeChanger]="true" [showTotal]="rangeSummary" />
      </div>`,
      {
        sort: signal('name'),
        page: signal(1),
        perPage: signal(6),
        products: (page: number, size: number) =>
          range(size).map((n) => (page - 1) * size + n),
        rangeSummary: (total: number, range: [number, number]) =>
          `${range[0]}-${range[1]} of ${total} products`,
      },
    ),
};

export const DataGridFooter: Story = {
  name: 'A data grid footer',
  parameters: about(
    'The footer of a grid: a selection count on the left and, on the right, rows per page, the range and the four navigation buttons.',
  ),
  render: () => {
    const all = orders(87);
    return scene(
      `<div [style]="wide">
        <div role="table" aria-label="Orders" [style]="card">
          <div role="row" [style]="listRow + ' font-weight: 600;'">
            <span role="columnheader" style="flex: 1;">Order</span>
            <span role="columnheader" style="flex: 2;">Customer</span>
            <span role="columnheader" style="flex: 1; text-align: end;">Amount</span>
          </div>
          @for (order of rows(page(), perPage()); track order.id) {
            <div role="row" [style]="listRow">
              <span role="cell" style="flex: 1;">{{ order.id }}</span>
              <span role="cell" style="flex: 2;">{{ order.customer }}</span>
              <span role="cell" style="flex: 1; text-align: end;">{{ order.amount }}</span>
            </div>
          }
          <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 0.75rem 1.5rem; padding: 0.75rem 1rem; justify-content: space-between;">
            <span [style]="muted">0 of {{ all.length }} rows selected.</span>
            <andes-pagination aria-label="Orders footer" layout="table" [(current)]="page" [(pageSize)]="perPage"
              [total]="all.length" [pageSizeOptions]="[5, 10, 20, 50]" />
          </div>
        </div>
      </div>`,
      {
        all,
        page: signal(1),
        perPage: signal(10),
        rows: (page: number, size: number) => slicePage(all, page, size),
      },
    );
  },
};

export const Thread: Story = {
  name: 'A comment thread',
  parameters: about(
    'A small, pill-shaped control under a thread, with Previous and Next as words, for a place where numbers would be noise.',
  ),
  render: () =>
    scene(
      `<div [style]="card + ' width: min(32rem, calc(100vw - 2rem));'">
        @for (person of rows(page()); track person.id) {
          <div [style]="listRow">
            <andes-avatar size="sm"><andes-avatar-fallback>{{ person.initials }}</andes-avatar-fallback></andes-avatar>
            <span [style]="text">{{ person.name }}: Looks good to me.</span>
          </div>
        }
        <div style="padding: 0.75rem 1rem;">
          <andes-pagination aria-label="Thread" size="small" shape="pill" variant="outline" align="end"
            [(current)]="page" [total]="people.length" [pageSize]="3" prevText="Earlier" nextText="Later" layout="compact" />
        </div>
      </div>`,
      {
        people: PEOPLE,
        page: signal(1),
        rows: (page: number) => slicePage(PEOPLE, page, 3),
      },
    ),
};
