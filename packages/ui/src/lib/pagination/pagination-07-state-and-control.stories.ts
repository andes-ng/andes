import { signal } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular';

import {
  about,
  labelled,
  people,
  pg,
  scene,
  slicePage,
  stack,
  withDescription,
  withPaginationKit,
} from '../../testing/pagination-story-kit';
import type { AndesPaginationChange } from './pagination';
import { AndesPagination } from './pagination';

/*
 * What the control is doing and who owns the page: two-way binding and change events, a start
 * page, an outside change, disabled, loading, hiding on a single page, an empty list, the
 * cursor style with no known total, and a load-more companion.
 */

const meta: Meta<AndesPagination> = {
  title: 'Navigation/Pagination/State and control',
  component: AndesPagination,
  decorators: [withDescription, withPaginationKit],
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<AndesPagination>;

export const Controlled: Story = {
  name: 'Controlled',
  parameters: about(
    'current and pageSize are two-way models, so the page and the size live in your own state and stay in step with the control.',
  ),
  render: () =>
    scene(
      `<div [style]="column">
        <andes-pagination aria-label="Controlled" style="width: 100%;" [(current)]="page" [(pageSize)]="perPage"
          [total]="240" [showSizeChanger]="true" />
        <span [style]="muted">page = {{ page() }}, pageSize = {{ perPage() }}</span>
      </div>`,
      { page: signal(3), perPage: signal(20) },
    ),
};

export const ChangeEvents: Story = {
  name: 'Change events',
  parameters: about(
    'pageChange reports the page and the size together whenever either changes, and showSizeChange reports a new size.',
  ),
  render: () => {
    const log = signal<string[]>([]);
    return scene(
      `<div [style]="column">
        <andes-pagination aria-label="Events" style="width: 100%;" [total]="240" [showSizeChanger]="true"
          (pageChange)="onPage($event)" (showSizeChange)="onSize($event)" />
        <div [style]="muted">
          @for (line of log(); track $index) {
            <div>{{ line }}</div>
          } @empty {
            <div>Change the page or the size to see the events.</div>
          }
        </div>
      </div>`,
      {
        log,
        onPage: (event: AndesPaginationChange) =>
          log.update((lines) =>
            [
              `pageChange: page ${event.page}, size ${event.pageSize}`,
              ...lines,
            ].slice(0, 5),
          ),
        onSize: (event: { current: number; pageSize: number }) =>
          log.update((lines) =>
            [
              `showSizeChange: size ${event.pageSize}, page ${event.current}`,
              ...lines,
            ].slice(0, 5),
          ),
      },
    );
  },
};

export const OutsideChange: Story = {
  name: 'Changed from outside',
  parameters: about(
    'Setting the model from your own buttons moves the control without emitting an event, and a page past the end is held to the last one.',
  ),
  render: () => {
    const page = signal(4);
    return scene(
      `<div [style]="column">
        <div [style]="row">
          <andes-button variant="outline" (click)="page.set(1)">Page 1</andes-button>
          <andes-button variant="outline" (click)="page.set(12)">Page 12</andes-button>
          <andes-button variant="outline" (click)="page.set(99)">Page 99</andes-button>
          <andes-button variant="ghost" (click)="page.set(page() + 1)"><ng-icon name="lucidePlus" /> One more</andes-button>
        </div>
        <andes-pagination aria-label="Changed from outside" style="width: 100%;" [(current)]="page" [total]="200" />
        <span [style]="muted">page = {{ page() }}</span>
      </div>`,
      { page },
    );
  },
};

export const StartPage: Story = {
  name: 'Start page and size',
  parameters: about(
    'defaultCurrent and defaultPageSize start a control you do not bind, and it keeps its own page from there.',
  ),
  render: () =>
    scene(
      pg(
        '[total]="500" [defaultCurrent]="7" [defaultPageSize]="20" [showSizeChanger]="true"',
        'Start page',
      ),
    ),
};

export const Disabled: Story = {
  name: 'Disabled',
  parameters: about(
    'Every control is switched off, including the page-size select and the quick jumper, and the current page stays visible.',
  ),
  render: () =>
    scene(
      stack(
        labelled(
          'Pages',
          pg(
            '[total]="500" [defaultCurrent]="6" [disabled]="true"',
            'Disabled',
          ),
        ),
        labelled(
          'With the options',
          pg(
            '[total]="500" [defaultCurrent]="6" [disabled]="true" [showSizeChanger]="true" [showQuickJumper]="true" [goButton]="true"',
            'Disabled with options',
          ),
        ),
        labelled(
          'Simple',
          pg(
            '[total]="500" [defaultCurrent]="6" [disabled]="true" [simple]="true"',
            'Disabled simple',
          ),
        ),
        labelled(
          'Table footer',
          pg(
            '[total]="500" [defaultCurrent]="6" [disabled]="true" layout="table"',
            'Disabled table footer',
          ),
        ),
      ),
    ),
};

export const DisabledToggle: Story = {
  name: 'Disabled with a switch',
  parameters: about(
    'A switch turns the control off and on, as when a form around it is saving.',
  ),
  render: () =>
    scene(
      `<div [style]="column">
        <andes-switch [(checked)]="off">Disable the pagination</andes-switch>
        <andes-pagination aria-label="Disabled with a switch" [total]="500" [disabled]="off()" [showSizeChanger]="true" />
      </div>`,
      { off: signal(false) },
    ),
};

export const Loading: Story = {
  name: 'Loading',
  parameters: about(
    'loading puts a spinner on the current page, marks the control busy and ignores clicks until the data arrives.',
  ),
  render: () =>
    scene(
      stack(
        labelled(
          'Pages',
          pg('[total]="500" [defaultCurrent]="6" [loading]="true"', 'Loading'),
        ),
        labelled(
          'Filled',
          pg(
            '[total]="500" [defaultCurrent]="6" [loading]="true" variant="filled"',
            'Loading, filled',
          ),
        ),
        labelled(
          'Table footer',
          pg(
            '[total]="500" [defaultCurrent]="6" [loading]="true" layout="table"',
            'Loading table footer',
          ),
        ),
      ),
    ),
};

export const LoadingFetch: Story = {
  name: 'Loading while a page is fetched',
  parameters: about(
    'A page change starts a fake request; the control stays busy until it answers and the rows of the new page appear.',
  ),
  render: () => {
    const page = signal(1);
    const busy = signal(false);
    const rows = signal(slicePage(people(60), 1, 5));
    return scene(
      `<div [style]="column">
        <div [style]="card">
          @for (person of rows(); track person.id) {
            <div [style]="listRow + (busy() ? ' opacity: 0.5;' : '')">
              <andes-avatar size="sm"><andes-avatar-fallback>{{ person.initials }}</andes-avatar-fallback></andes-avatar>
              <span [style]="text">{{ person.name }}</span>
              <span [style]="muted">{{ person.role }}</span>
            </div>
          }
        </div>
        <andes-pagination aria-label="Loading while fetching" [(current)]="page" [total]="60" [pageSize]="5"
          [loading]="busy()" (pageChange)="load($event.page)" />
      </div>`,
      {
        page,
        busy,
        rows,
        load: (target: number) => {
          busy.set(true);
          setTimeout(() => {
            rows.set(slicePage(people(60), target, 5));
            busy.set(false);
          }, 900);
        },
      },
    );
  },
};

export const HideOnSinglePage: Story = {
  name: 'Hide on a single page',
  parameters: about(
    'With hideOnSinglePage the control draws nothing while there is at most one page; change the total to bring it back.',
  ),
  render: () =>
    scene(
      `<div [style]="column">
        <div [style]="row">
          <andes-button variant="outline" (click)="count.set(8)">8 items</andes-button>
          <andes-button variant="outline" (click)="count.set(40)">40 items</andes-button>
          <span [style]="muted">total = {{ count() }}</span>
        </div>
        <andes-pagination aria-label="Hide on a single page" [total]="count()" [hideOnSinglePage]="true" />
      </div>`,
      { count: signal(8) },
    ),
};

export const Empty: Story = {
  name: 'Nothing to page through',
  parameters: about(
    'With no items every control is disabled and no page is drawn, so an empty result keeps the layout steady.',
  ),
  render: () =>
    scene(
      stack(
        labelled('Pages', pg('[total]="0"', 'Empty')),
        labelled('Simple', pg('[total]="0" [simple]="true"', 'Empty simple')),
        labelled(
          'Table footer',
          pg('[total]="0" layout="table"', 'Empty table footer'),
        ),
      ),
    ),
};

export const PageCountOnly: Story = {
  name: 'A page count without a total',
  parameters: about(
    'totalPages sets the number of pages directly, for a source that reports pages and not items.',
  ),
  render: () =>
    scene(
      pg(
        '[totalPages]="24" [defaultCurrent]="3" [showQuickJumper]="true"',
        'Page count only',
      ),
    ),
};

export const OutOfRange: Story = {
  name: 'A page past the end',
  parameters: about(
    'A current page outside the range is held to the nearest real page instead of drawing a page that does not exist.',
  ),
  render: () =>
    scene(
      stack(
        labelled(
          'current 99 of 5',
          pg('[total]="50" [current]="99"', 'Too high'),
        ),
        labelled('current -4', pg('[total]="50" [current]="-4"', 'Too low')),
      ),
    ),
};

export const CursorMode: Story = {
  name: 'Cursor style, no total',
  parameters: about(
    'When the source cannot count its items, hasNextPage says whether another page follows and the control draws Previous, the page and Next.',
  ),
  render: () => {
    const page = signal(1);
    return scene(
      `<div [style]="column">
        <andes-pagination aria-label="Cursor" [(current)]="page" [hasNextPage]="page() < 5" />
        <span [style]="muted">page = {{ page() }}, hasNextPage = {{ page() < 5 }}</span>
      </div>`,
      { page },
    );
  },
};

export const CursorModeVariants: Story = {
  name: 'Cursor style in each look',
  parameters: about(
    'The cursor control follows the same sizes, variants and shapes as the numbered one.',
  ),
  render: () =>
    scene(
      stack(
        labelled(
          'Default',
          pg('[hasNextPage]="true" [defaultCurrent]="3"', 'Cursor'),
        ),
        labelled(
          'Outline, with text',
          pg(
            '[hasNextPage]="true" [defaultCurrent]="3" variant="outline" prevText="Older" nextText="Newer"',
            'Cursor, outline',
          ),
        ),
        labelled(
          'Pill, small',
          pg(
            '[hasNextPage]="false" [defaultCurrent]="3" shape="pill" size="small"',
            'Cursor, pill',
          ),
        ),
        labelled(
          'Table footer',
          pg(
            '[hasNextPage]="true" [defaultCurrent]="3" layout="table"',
            'Cursor table footer',
          ),
        ),
      ),
    ),
};

export const LoadMore: Story = {
  name: 'Load more companion',
  parameters: about(
    'A load-more button reveals the next page under the list, with the count so far; pagination and load-more suit different lists.',
  ),
  render: () => {
    const shown = signal(5);
    return scene(
      `<div [style]="column">
        <div [style]="card">
          @for (person of people.slice(0, shown()); track person.id) {
            <div [style]="listRow">
              <andes-avatar size="sm"><andes-avatar-fallback>{{ person.initials }}</andes-avatar-fallback></andes-avatar>
              <span [style]="text">{{ person.name }}</span>
            </div>
          }
        </div>
        <div [style]="row + ' justify-content: space-between;'">
          <span [style]="muted">Showing {{ shown() }} of {{ people.length }}</span>
          <andes-button variant="outline" [disabled]="shown() >= people.length" (click)="shown.set(shown() + 5)">
            <ng-icon name="lucideRefreshCw" /> Load more
          </andes-button>
        </div>
      </div>`,
      { shown, people: people(20) },
    );
  },
};
