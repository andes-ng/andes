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
 * How the items look: the three heights (each with and without the total, in simple mode and
 * with the page-size changer), the four item variants and the pill shape.
 */

const meta: Meta<AndesPagination> = {
  title: 'Navigation/Pagination/Sizes and variants',
  component: AndesPagination,
  decorators: [withDescription, withPaginationKit],
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<AndesPagination>;

const SIZES = ['small', 'default', 'large'] as const;

/** One pagination per size, each captioned with its height. */
function sizes(attributes: string, label: string): string {
  const heights = { small: '24px', default: '32px', large: '40px' };
  return stack(
    ...SIZES.map((size) =>
      labelled(
        `${size} (${heights[size]})`,
        pg(`size="${size}" ${attributes}`, `${label}, ${size}`),
      ),
    ),
  );
}

export const Sizes: Story = {
  name: 'Sizes',
  parameters: about(
    'Three heights, 24px, 32px and 40px, each with its own spacing so the items never touch.',
  ),
  render: () => scene(sizes('[total]="500" [defaultCurrent]="4"', 'Sizes')),
};

export const SizesWithTotal: Story = {
  name: 'Sizes with the total',
  parameters: about(
    'The same three heights with the item range written before the pages.',
  ),
  render: () =>
    scene(
      sizes(
        '[total]="85" [defaultCurrent]="2" [showTotal]="rangeSummary"',
        'Sizes with the total',
      ),
      {
        rangeSummary: (total: number, range: [number, number]) =>
          `${range[0]}-${range[1]} of ${total} items`,
      },
    ),
};

export const SizesWithoutTotal: Story = {
  name: 'Sizes with a page count only',
  parameters: about(
    'When only the number of pages is known, the control is sized the same and has no range to show.',
  ),
  render: () =>
    scene(
      sizes(
        '[totalPages]="12" [defaultCurrent]="6"',
        'Sizes with a page count',
      ),
    ),
};

export const SizesSimple: Story = {
  name: 'Sizes in simple mode',
  parameters: about(
    'The compact "page / total" form in each height, with the input matching the buttons beside it.',
  ),
  render: () =>
    scene(
      sizes('[total]="500" [simple]="true" [defaultCurrent]="4"', 'Simple'),
    ),
};

export const SizesWithChanger: Story = {
  name: 'Sizes with the page-size changer',
  parameters: about(
    'The page-size select and the quick jumper take the height of the items in every size.',
  ),
  render: () =>
    scene(
      sizes(
        '[total]="500" [defaultCurrent]="4" [showSizeChanger]="true" [showQuickJumper]="true"',
        'With the changer',
      ),
    ),
};

export const Outline: Story = {
  name: 'Outline items',
  parameters: about(
    'Every item gets a border and the current page takes the primary colour on a soft tint.',
  ),
  render: () =>
    scene(
      stack(
        labelled(
          'Default size',
          pg('[total]="500" [defaultCurrent]="4" variant="outline"', 'Outline'),
        ),
        labelled(
          'Small',
          pg(
            '[total]="500" [defaultCurrent]="4" variant="outline" size="small"',
            'Outline, small',
          ),
        ),
        labelled(
          'Large',
          pg(
            '[total]="500" [defaultCurrent]="4" variant="outline" size="large"',
            'Outline, large',
          ),
        ),
      ),
    ),
};

export const Ghost: Story = {
  name: 'Ghost items',
  parameters: about(
    'No borders anywhere; the current page sits on a soft tint of the primary colour.',
  ),
  render: () =>
    scene(
      stack(
        labelled(
          'Default size',
          pg('[total]="500" [defaultCurrent]="4" variant="ghost"', 'Ghost'),
        ),
        labelled(
          'Small',
          pg(
            '[total]="500" [defaultCurrent]="4" variant="ghost" size="small"',
            'Ghost, small',
          ),
        ),
        labelled(
          'Large',
          pg(
            '[total]="500" [defaultCurrent]="4" variant="ghost" size="large"',
            'Ghost, large',
          ),
        ),
      ),
    ),
};

export const Filled: Story = {
  name: 'Filled items',
  parameters: about(
    'The current page is a solid primary block with white text, the loudest way to mark where you are.',
  ),
  render: () =>
    scene(
      stack(
        labelled(
          'Default size',
          pg('[total]="500" [defaultCurrent]="4" variant="filled"', 'Filled'),
        ),
        labelled(
          'Small',
          pg(
            '[total]="500" [defaultCurrent]="4" variant="filled" size="small"',
            'Filled, small',
          ),
        ),
        labelled(
          'Large',
          pg(
            '[total]="500" [defaultCurrent]="4" variant="filled" size="large"',
            'Filled, large',
          ),
        ),
      ),
    ),
};

export const Variants: Story = {
  name: 'All variants',
  parameters: about(
    'The default, outline, ghost and filled items one under another, for choosing between them.',
  ),
  render: () =>
    scene(
      stack(
        ...(['default', 'outline', 'ghost', 'filled'] as const).map((variant) =>
          labelled(
            variant,
            pg(
              `[total]="500" [defaultCurrent]="4" variant="${variant}" [showFirstLast]="true"`,
              `Variant ${variant}`,
            ),
          ),
        ),
      ),
    ),
};

export const Pill: Story = {
  name: 'Pill shape',
  parameters: about('Fully rounded items, in each variant, for a softer look.'),
  render: () =>
    scene(
      stack(
        ...(['default', 'outline', 'ghost', 'filled'] as const).map((variant) =>
          labelled(
            `pill, ${variant}`,
            pg(
              `[total]="500" [defaultCurrent]="4" shape="pill" variant="${variant}"`,
              `Pill ${variant}`,
            ),
          ),
        ),
      ),
    ),
};

export const PillSizes: Story = {
  name: 'Pill shape in every size',
  parameters: about(
    'The pill shape at 24px, 32px and 40px with the filled marker and the quick jumper.',
  ),
  render: () =>
    scene(
      sizes(
        '[total]="500" [defaultCurrent]="4" shape="pill" variant="filled" [showQuickJumper]="true"',
        'Pill',
      ),
    ),
};
