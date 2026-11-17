import type { Meta, StoryObj } from '@storybook/angular';

import {
  about,
  featureItems,
  shared,
  withDescription,
  withScrollerKit,
} from '../../testing/carousel-story-kit';
import { AndesCarouselScroller } from './carousel-scroller';

/*
 * How the row comes to rest and how a flick or a swipe moves it: free scrolling, one item
 * per gesture and one view per gesture.
 */

const meta: Meta<AndesCarouselScroller> = {
  title: 'Data Display/Carousel/Scroller snapping and paging',
  component: AndesCarouselScroller,
  decorators: [withDescription, withScrollerKit],
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<AndesCarouselScroller>;

/** Free scrolling. */
export const WithoutSnap: Story = {
  name: 'Without snapping',
  parameters: about(
    'With snap off the row stops wherever it is released, and the arrow keys pan it the way the browser does.',
  ),
  render: () => ({
    props: shared,
    template: `
      <div [style]="frame">
        <andes-carousel-scroller aria-label="Features, free scrolling" [snap]="false" [gap]="16" [itemWidth]="256">
          ${featureItems()}
        </andes-carousel-scroller>
      </div>`,
  }),
};

/** One item per flick. */
export const PagingByItem: Story = {
  name: 'Paging by item',
  parameters: about(
    'With paging item a flick of a finger, a horizontal swipe on a trackpad or Shift with the wheel moves exactly one card, while the mouse wheel keeps the native snapping.',
  ),
  render: () => ({
    props: shared,
    template: `
      <div [style]="frame">
        <andes-carousel-scroller aria-label="Features, one card at a time" paging="item" [gap]="16" [itemWidth]="256">
          ${featureItems()}
        </andes-carousel-scroller>
      </div>`,
  }),
};

/** One view per flick. */
export const PagingByView: Story = {
  name: 'Paging by view',
  parameters: about(
    'With paging view a flick, a swipe or the next button moves a whole view of cards, starting with the first card that was cut off.',
  ),
  render: () => ({
    props: shared,
    template: `
      <div [style]="frame">
        <andes-carousel-scroller aria-label="Features, one view at a time" paging="view" [gap]="16" [itemWidth]="176">
          ${featureItems()}
        </andes-carousel-scroller>
      </div>`,
  }),
};
