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
 * The first stories: the playground, the plain control and the things every pagination needs
 * (few and many pages, the jump links, alignment, and every option switched on at once).
 */

const meta: Meta<AndesPagination> = {
  title: 'Navigation/Pagination/Overview',
  component: AndesPagination,
  tags: ['autodocs'],
  decorators: [withDescription, withPaginationKit],
  parameters: { layout: 'padded' },
  argTypes: {
    current: { control: 'number' },
    pageSize: { control: 'number' },
    total: { control: 'number' },
    size: {
      control: 'inline-radio',
      options: ['small', 'default', 'large'],
    },
    variant: {
      control: 'inline-radio',
      options: ['default', 'outline', 'ghost', 'filled'],
    },
    shape: { control: 'inline-radio', options: ['default', 'pill'] },
    layout: {
      control: 'inline-radio',
      options: ['default', 'compact', 'table'],
    },
    align: { control: 'inline-radio', options: ['start', 'center', 'end'] },
    siblingCount: { control: 'number' },
    boundaryCount: { control: 'number' },
    showLessItems: { control: 'boolean' },
    showPrevNextJumpers: { control: 'boolean' },
    showFirstLast: { control: 'boolean' },
    showSizeChanger: { control: 'boolean' },
    showQuickJumper: { control: 'boolean' },
    hideOnSinglePage: { control: 'boolean' },
    loading: { control: 'boolean' },
    disabled: { control: 'boolean' },
    responsive: { control: 'boolean' },
  },
  args: {
    current: 1,
    pageSize: 10,
    total: 500,
    size: 'default',
    variant: 'default',
    shape: 'default',
    layout: 'default',
    align: 'start',
    siblingCount: 1,
    boundaryCount: 1,
    showLessItems: false,
    showPrevNextJumpers: true,
    showFirstLast: undefined,
    showSizeChanger: undefined,
    showQuickJumper: false,
    hideOnSinglePage: false,
    loading: false,
    disabled: false,
    responsive: false,
  },
  render: (args) =>
    scene(
      `<andes-pagination aria-label="Playground" style="width: min(52rem, calc(100vw - 2rem));"
        [current]="current" [pageSize]="pageSize" [total]="total" [size]="size"
        [variant]="variant" [shape]="shape" [layout]="layout" [align]="align"
        [siblingCount]="siblingCount" [boundaryCount]="boundaryCount"
        [showLessItems]="showLessItems" [showPrevNextJumpers]="showPrevNextJumpers"
        [showFirstLast]="showFirstLast" [showSizeChanger]="showSizeChanger"
        [showQuickJumper]="showQuickJumper" [hideOnSinglePage]="hideOnSinglePage"
        [loading]="loading" [disabled]="disabled" [responsive]="responsive" />`,
      args,
    ),
};

export default meta;

type Story = StoryObj<AndesPagination>;

export const Playground: Story = {
  name: 'Playground',
  parameters: about(
    'Every option of the control behind a knob, so a combination can be tried before it is written down.',
  ),
};

export const Basic: Story = {
  name: 'Basic',
  parameters: about(
    'The control with nothing but a total: the pages, a Previous and a Next button, and the current page marked.',
  ),
  render: () => scene(pg('[total]="50"', 'Basic')),
};

export const FewPages: Story = {
  name: 'Few pages',
  parameters: about(
    'With five pages or fewer every page is listed and nothing collapses into an ellipsis.',
  ),
  render: () =>
    scene(
      stack(
        labelled(
          '3 pages',
          pg('[total]="30" [defaultCurrent]="2"', 'Three pages'),
        ),
        labelled(
          '5 pages',
          pg('[total]="50" [defaultCurrent]="3"', 'Five pages'),
        ),
      ),
    ),
};

export const ManyPages: Story = {
  name: 'Many pages',
  parameters: about(
    'Long ranges keep the first and last page and the neighbours of the current one, and collapse the rest into an ellipsis.',
  ),
  render: () =>
    scene(
      stack(
        labelled(
          'Near the start',
          pg('[total]="500" [defaultCurrent]="2"', 'Near the start'),
        ),
        labelled(
          'In the middle',
          pg('[total]="500" [defaultCurrent]="25"', 'In the middle'),
        ),
        labelled(
          'Near the end',
          pg('[total]="500" [defaultCurrent]="49"', 'Near the end'),
        ),
        labelled(
          'A thousand pages',
          pg('[total]="10000" [defaultCurrent]="512"', 'A thousand pages'),
        ),
      ),
    ),
};

export const MorePages: Story = {
  name: 'More pages',
  parameters: about(
    'A collapsed range is a button that jumps five pages; hover or focus it and its dots turn into double chevrons, and its tooltip names the jump.',
  ),
  render: () =>
    scene(
      stack(
        labelled(
          'Hover or focus an ellipsis',
          pg(
            '[total]="1000" [defaultCurrent]="50" [showSizeChanger]="false"',
            'More pages',
          ),
        ),
      ),
    ),
};

export const Align: Story = {
  name: 'Align',
  parameters: about(
    'The whole control can sit at the start, the centre or the end of its row.',
  ),
  render: () =>
    scene(
      stack(
        labelled('start', pg('[total]="50" align="start"', 'Start aligned')),
        labelled('center', pg('[total]="50" align="center"', 'Centre aligned')),
        labelled('end', pg('[total]="50" align="end"', 'End aligned')),
      ),
    ),
};

export const ShowAll: Story = {
  name: 'Show all',
  parameters: about(
    'Every part at once: first and last, the jump links, the total, the page-size changer and a quick jumper with a go button.',
  ),
  render: () =>
    scene(
      `<andes-pagination aria-label="Everything on" style="width: min(60rem, calc(100vw - 2rem));"
        [(current)]="page" [(pageSize)]="perPage" [total]="1000" [showFirstLast]="true"
        [showSizeChanger]="true" [showQuickJumper]="true" [goButton]="true" [jumperIcon]="true"
        [showTotal]="rangeSummary" [pageSizeOptions]="[10, 20, 50, 100]" />`,
      {
        page: signal(8),
        perPage: signal(20),
        rangeSummary: (total: number, range: [number, number]) =>
          `${range[0]}-${range[1]} of ${total} items`,
      },
    ),
};
