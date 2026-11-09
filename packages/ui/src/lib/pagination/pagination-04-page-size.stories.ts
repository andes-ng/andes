import { signal } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular';

import {
  about,
  controlSize,
  labelled,
  people,
  pg,
  pgAuto,
  scene,
  slicePage,
  stack,
  withDescription,
  withPaginationKit,
} from '../../testing/pagination-story-kit';
import { AndesPagination } from './pagination';

/*
 * How many items a page holds: the page-size select, its options and default, when it shows,
 * its labels, and a control of your own in its place (a segmented control, a row of buttons,
 * a select).
 */

const meta: Meta<AndesPagination> = {
  title: 'Navigation/Pagination/Page size',
  component: AndesPagination,
  decorators: [withDescription, withPaginationKit],
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<AndesPagination>;

export const Changer: Story = {
  name: 'Page-size changer',
  parameters: about(
    'A select next to the pages that sets how many items a page holds; picking a size keeps the current page when it still exists.',
  ),
  render: () =>
    scene(
      `<div [style]="column">
        <andes-pagination aria-label="Page size" style="width: 100%;"
          [(current)]="page" [(pageSize)]="perPage" [total]="95" [showSizeChanger]="true" />
        <span [style]="muted">Page {{ page() }}, {{ perPage() }} per page:
          {{ names(page(), perPage()) }}</span>
      </div>`,
      {
        page: signal(1),
        perPage: signal(10),
        names: (page: number, size: number) =>
          slicePage(people(95), page, size)
            .map((person) => person.id)
            .join(', '),
      },
    ),
};

export const CustomOptions: Story = {
  name: 'Custom size options',
  parameters: about(
    'pageSizeOptions sets the sizes offered; numeric strings work too, and the current size is added when it is missing.',
  ),
  render: () =>
    scene(
      stack(
        labelled(
          '5, 15 and 25',
          pg(
            '[total]="200" [showSizeChanger]="true" [pageSizeOptions]="[5, 15, 25]" [defaultPageSize]="5"',
            'Five, fifteen, twenty-five',
          ),
        ),
        labelled(
          'Numeric strings',
          pg(
            '[total]="200" [showSizeChanger]="true" [pageSizeOptions]="[\'25\', \'50\', \'200\']" [defaultPageSize]="25"',
            'Strings',
          ),
        ),
        labelled(
          'A size that is not in the list is added',
          pg(
            '[total]="200" [showSizeChanger]="true" [pageSizeOptions]="[10, 20]" [defaultPageSize]="15"',
            'Added size',
          ),
        ),
      ),
    ),
};

export const DefaultSize: Story = {
  name: 'Default page size',
  parameters: about(
    'defaultPageSize starts an uncontrolled control at a size other than ten.',
  ),
  render: () =>
    scene(
      pg(
        '[total]="500" [showSizeChanger]="true" [defaultPageSize]="50"',
        'Default size',
      ),
    ),
};

export const ChangerVisibility: Story = {
  name: 'When the changer shows',
  parameters: about(
    'Left unset, the select appears once the total passes totalBoundaryShowSizeChanger (50 by default); showSizeChanger forces it on or off.',
  ),
  render: () =>
    scene(
      stack(
        labelled(
          'Total 40: hidden',
          pgAuto('[total]="40"', 'Hidden below the boundary'),
        ),
        labelled(
          'Total 60: shown',
          pgAuto('[total]="60"', 'Shown above the boundary'),
        ),
        labelled(
          'Total 40, forced on',
          pg('[total]="40" [showSizeChanger]="true"', 'Forced on'),
        ),
        labelled(
          'Total 500, forced off',
          pg('[total]="500" [showSizeChanger]="false"', 'Forced off'),
        ),
        labelled(
          'Boundary at 10',
          pg(
            '[total]="20" [totalBoundaryShowSizeChanger]="10"',
            'Lower boundary',
          ),
        ),
      ),
    ),
};

export const ChangerLabels: Story = {
  name: 'Page-size labels',
  parameters: about(
    'The words after each size and the name a screen reader hears are inputs, so they can be translated.',
  ),
  render: () =>
    scene(
      stack(
        labelled(
          '"per page"',
          pg(
            '[total]="500" [showSizeChanger]="true" itemsPerPageLabel="per page"',
            'Per page',
          ),
        ),
        labelled(
          'Spanish',
          pg(
            '[total]="500" [showSizeChanger]="true" itemsPerPageLabel="/ página" pageSizeLabel="Elementos por página"',
            'Paginación',
          ),
        ),
        labelled(
          'No suffix',
          pg(
            '[total]="500" [showSizeChanger]="true" itemsPerPageLabel=""',
            'No suffix',
          ),
        ),
      ),
    ),
};

export const ChangerLoading: Story = {
  name: 'Page-size changer while loading',
  parameters: about(
    'While the control is loading, the select shows its own spinner and ignores new sizes.',
  ),
  render: () =>
    scene(
      pg('[total]="500" [showSizeChanger]="true" [loading]="true"', 'Loading'),
    ),
};

export const CustomSegmented: Story = {
  name: 'Custom component: segmented control',
  parameters: about(
    'sizeChangerRender swaps the select for any control; here a segmented control calls change() with the picked size.',
  ),
  render: () =>
    scene(
      `<div [style]="column">
        <andes-pagination aria-label="Segmented sizes" style="width: 100%;" [total]="500" [showSizeChanger]="true"
          [sizeChangerRender]="sizes" />
        <ng-template #sizes let-pageSize let-options="options" let-change="change" let-size="size" let-disabled="disabled" let-label="label">
          <andes-segmented [aria-label]="label" [options]="options" [value]="pageSize"
            [size]="controlSize(size)" [disabled]="disabled" (valueChange)="change($event)" />
        </ng-template>
      </div>`,
      { controlSize },
    ),
};

export const CustomButtons: Story = {
  name: 'Custom component: row of buttons',
  parameters: about(
    'A row of buttons of your own, each calling change(); the current size is the filled one.',
  ),
  render: () =>
    scene(
      `<div [style]="column">
        <andes-pagination aria-label="Button sizes" style="width: 100%;" [total]="500" [showSizeChanger]="true"
          [sizeChangerRender]="sizes" />
        <ng-template #sizes let-pageSize let-options="options" let-change="change" let-size="size" let-disabled="disabled">
          <span [style]="row">
            <span [style]="muted">Show</span>
            @for (option of options; track option) {
              <andes-button [size]="controlSize(size)" [variant]="option === pageSize ? 'primary' : 'outline'"
                [disabled]="disabled" (click)="change(option)">{{ option }}</andes-button>
            }
          </span>
        </ng-template>
      </div>`,
      { controlSize },
    ),
};

export const CustomSelect: Story = {
  name: 'Custom component: select with a label',
  parameters: about(
    'A select of your own with a visible label and an icon, sized to match the pagination through the context.',
  ),
  render: () =>
    scene(
      `<div [style]="column">
        <andes-pagination aria-label="Select sizes" style="width: 100%;" [total]="500" [showSizeChanger]="true"
          [sizeChangerRender]="sizes" />
        <ng-template #sizes let-pageSize let-options="options" let-change="change" let-size="size" let-disabled="disabled" let-label="label">
          <span [style]="row">
            <ng-icon name="lucideRows3" />
            <andes-select style="width: 8.5rem;" [aria-label]="label" [options]="withLabels(options)" [value]="pageSize"
              [size]="controlSize(size)" [disabled]="disabled" (valueChange)="change($event)" />
          </span>
        </ng-template>
      </div>`,
      {
        controlSize,
        withLabels: (() => {
          const cache = new Map<string, { value: number; label: string }[]>();
          return (options: readonly number[]) => {
            const key = options.join(',');
            if (!cache.has(key)) {
              cache.set(
                key,
                options.map((value) => ({ value, label: `${value} rows` })),
              );
            }
            return cache.get(key);
          };
        })(),
      },
    ),
};
