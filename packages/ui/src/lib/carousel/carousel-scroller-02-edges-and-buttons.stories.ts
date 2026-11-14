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
 * The fading edges and the previous and next buttons: switching them off, looping a small
 * set, sizing the buttons and what happens when everything fits.
 */

const meta: Meta<AndesCarouselScroller> = {
  title: 'Data Display/Carousel/Scroller edges and buttons',
  component: AndesCarouselScroller,
  decorators: [withDescription, withScrollerKit],
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<AndesCarouselScroller>;

/** No fade on the edges. */
export const WithoutFadeEdges: Story = {
  name: 'Without fading edges',
  parameters: about(
    'With fadeEdges off the cards are cut off sharply at the edges of the row instead of fading out.',
  ),
  render: () => ({
    props: shared,
    template: `
      <div [style]="frame">
        <andes-carousel-scroller aria-label="Features without fading edges" [fadeEdges]="false" [gap]="16" [itemWidth]="256">
          ${featureItems()}
        </andes-carousel-scroller>
      </div>`,
  }),
};

/** No buttons. */
export const WithoutButtons: Story = {
  name: 'Without buttons',
  parameters: about(
    'With arrows off there are no buttons and the row is moved by swiping, the scroll wheel with Shift, or the arrow keys once the row has focus.',
  ),
  render: () => ({
    props: shared,
    template: `
      <div [style]="frame">
        <andes-carousel-scroller aria-label="Features without buttons" [arrows]="false" [gap]="16" [itemWidth]="256">
          ${featureItems()}
        </andes-carousel-scroller>
      </div>`,
  }),
};

/** Wrapping round. */
export const Loop: Story = {
  name: 'Loop',
  parameters: about(
    'With loop the next button stays on the last card and goes back to the first one, and the previous button does the reverse, which suits a small set.',
  ),
  render: () => ({
    props: shared,
    template: `
      <div [style]="frame">
        <andes-carousel-scroller aria-label="Featured, looping" loop [gap]="16" [itemWidth]="256">
          ${featureItems(0, 4)}
        </andes-carousel-scroller>
      </div>`,
  }),
};

/** Button sizes. */
export const ButtonSizes: Story = {
  name: 'Button sizes',
  parameters: about(
    'The buttons come in the same three sizes as the other controls, small, medium and large.',
  ),
  render: () => ({
    props: { ...shared, sizes: ['sm', 'md', 'lg'] },
    template: `
      <div [style]="frame + 'display: grid; gap: 1.5rem;'">
        @for (size of sizes; track size) {
          <div>
            <span [style]="caption">arrowSize {{ size }}</span>
            <andes-carousel-scroller [aria-label]="'Features, ' + size + ' buttons'" [arrowSize]="size" [gap]="16" [itemWidth]="256">
              ${featureItems()}
            </andes-carousel-scroller>
          </div>
        }
      </div>`,
  }),
};

/** Everything fits. */
export const EverythingFits: Story = {
  name: 'Everything fits',
  parameters: about(
    'When the cards fit there is nothing to scroll, so no buttons or fades appear and the row leaves the tab order.',
  ),
  render: () => ({
    props: shared,
    template: `
      <div style="max-width: 60rem;">
        <andes-carousel-scroller aria-label="Features that fit" [gap]="16" [itemWidth]="176">
          ${featureItems(0, 3)}
        </andes-carousel-scroller>
      </div>`,
  }),
};
