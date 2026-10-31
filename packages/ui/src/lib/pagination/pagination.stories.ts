import { NgTemplateOutlet } from '@angular/common';
import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { AndesPagination } from './pagination';

const meta: Meta<AndesPagination> = {
  title: 'Navigation/Pagination/Basics/Pages',
  component: AndesPagination,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [NgTemplateOutlet] })],
  argTypes: {
    current: { control: 'number' },
    pageSize: { control: 'number' },
    total: { control: 'number' },
    totalPages: { control: 'number' },
    siblingCount: { control: 'number' },
    boundaryCount: { control: 'number' },
    disabled: { control: 'boolean' },
    showLessItems: { control: 'boolean' },
    showPrevNextJumpers: { control: 'boolean' },
    showTitle: { control: 'boolean' },
    hideOnSinglePage: { control: 'boolean' },
    showSizeChanger: { control: 'boolean' },
    showQuickJumper: { control: 'boolean' },
    responsive: { control: 'boolean' },
    size: {
      control: 'inline-radio',
      options: ['small', 'default', 'medium', 'large'],
    },
    align: { control: 'inline-radio', options: ['start', 'center', 'end'] },
  },
  args: {
    current: 1,
    totalPages: 10,
    siblingCount: 1,
    boundaryCount: 1,
    disabled: false,
  },
  render: (args) => ({
    props: args,
    template: `<andes-pagination
      [current]="current"
      [pageSize]="pageSize ?? 10"
      [total]="total ?? 0"
      [totalPages]="totalPages"
      [siblingCount]="siblingCount ?? 1"
      [boundaryCount]="boundaryCount ?? 1"
      [disabled]="disabled"
      [showLessItems]="showLessItems"
      [showPrevNextJumpers]="showPrevNextJumpers ?? true"
      [showTitle]="showTitle ?? true"
      [hideOnSinglePage]="hideOnSinglePage"
      [showSizeChanger]="showSizeChanger"
      [showQuickJumper]="showQuickJumper"
      [goButton]="goButton ?? false"
      [simple]="simple ?? false"
      [responsive]="responsive"
      [size]="size ?? 'default'"
      [align]="align ?? 'start'"
    />`,
  }),
};

export default meta;

type Story = StoryObj<AndesPagination>;

const CAPTION =
  'margin: 0 0 0.5rem; font: 0.75rem var(--andes-font-family), sans-serif; color: var(--andes-color-muted-foreground);';

export const Default: Story = {};

/**
 * How the page window behaves, one pagination per case: few pages, near the start, in the
 * middle and near the end of a long list, a wider `siblingCount` and `boundaryCount`, and a page
 * count derived from `total` / `pageSize` instead of an explicit `totalPages`.
 */
export const PageWindows: Story = {
  render: () => ({
    template: `
      <div style="display: grid; gap: 1.5rem;">
        <div>
          <p style="${CAPTION}">Few pages (5)</p>
          <andes-pagination [totalPages]="5" [current]="3" aria-label="Few pages" />
        </div>
        <div>
          <p style="${CAPTION}">Near the start</p>
          <andes-pagination [totalPages]="10" [current]="1" aria-label="Near the start" />
        </div>
        <div>
          <p style="${CAPTION}">Middle of a long list</p>
          <andes-pagination [totalPages]="20" [current]="10" aria-label="Middle" />
        </div>
        <div>
          <p style="${CAPTION}">Near the end</p>
          <andes-pagination [totalPages]="10" [current]="10" aria-label="Near the end" />
        </div>
        <div>
          <p style="${CAPTION}">siblingCount 2</p>
          <andes-pagination [totalPages]="20" [current]="10" [siblingCount]="2" aria-label="Larger sibling count" />
        </div>
        <div>
          <p style="${CAPTION}">boundaryCount 2</p>
          <andes-pagination [totalPages]="20" [current]="10" [boundaryCount]="2" aria-label="Larger boundary count" />
        </div>
        <div>
          <p style="${CAPTION}">Derived from total 240 / pageSize 25 instead of totalPages</p>
          <andes-pagination [total]="240" [pageSize]="25" [current]="4" aria-label="Derived from total" />
        </div>
      </div>`,
  }),
};

/**
 * Collapsed ranges become jump buttons (5 pages; 3 with `showLessItems`), and
 * `showPrevNextJumpers` turns them off.
 */
export const Jumpers: Story = {
  render: () => ({
    template: `
      <div style="display: grid; gap: 1.5rem;">
        <div>
          <p style="${CAPTION}">Prev/next jumpers: collapsed ranges become jump buttons (5 pages)</p>
          <andes-pagination [totalPages]="50" [current]="25" aria-label="With jumpers" />
        </div>
        <div>
          <p style="${CAPTION}">showPrevNextJumpers off</p>
          <andes-pagination [totalPages]="50" [current]="25" [showPrevNextJumpers]="false" aria-label="Without jumpers" />
        </div>
        <div>
          <p style="${CAPTION}">showLessItems (3 pages per jump)</p>
          <andes-pagination [totalPages]="50" [current]="25" [siblingCount]="2" [showLessItems]="true" aria-label="Show less items" />
        </div>
      </div>`,
  }),
};

/** The states with nothing to page through: disabled, no records at all, and a single page that is hidden. */
export const States: Story = {
  render: () => ({
    template: `
      <div style="display: grid; gap: 1.5rem;">
        <div>
          <p style="${CAPTION}">Disabled, with the size changer and the quick jumper</p>
          <andes-pagination [totalPages]="10" [current]="5" [disabled]="true" [showSizeChanger]="true" [showQuickJumper]="true" aria-label="Disabled" />
        </div>
        <div>
          <p style="${CAPTION}">total of 0: no page items, every control disabled</p>
          <andes-pagination [total]="0" [showQuickJumper]="true" [showSizeChanger]="true" aria-label="Empty" />
        </div>
        <div>
          <p style="${CAPTION}">hideOnSinglePage with a single page: renders nothing (the box below is empty on purpose)</p>
          <andes-pagination [total]="8" [hideOnSinglePage]="true" aria-label="Hidden on a single page" />
        </div>
      </div>`,
  }),
};

/**
 * The three control heights side by side: 24, 32 and 40px, each with the size changer and the
 * quick jumper (and the go button on the large one).
 */
export const Sizes: Story = {
  render: () => ({
    template: `
      <div style="display: grid; gap: 1rem;">
        <andes-pagination [total]="500" [current]="4" size="small" [showSizeChanger]="true" [showQuickJumper]="true" aria-label="Small" />
        <andes-pagination [total]="500" [current]="4" [showSizeChanger]="true" [showQuickJumper]="true" aria-label="Default" />
        <andes-pagination [total]="500" [current]="4" size="large" [showSizeChanger]="true" [showQuickJumper]="true" [goButton]="true" aria-label="Large" />
      </div>`,
  }),
};

export const Align: Story = {
  parameters: { layout: 'padded' },
  render: () => ({
    template: `
      <div style="display: grid; gap: 1rem; width: 100%;">
        <andes-pagination [total]="50" align="start" aria-label="Start aligned" />
        <andes-pagination [total]="50" align="center" aria-label="Center aligned" />
        <andes-pagination [total]="50" align="end" aria-label="End aligned" />
      </div>`,
  }),
};
