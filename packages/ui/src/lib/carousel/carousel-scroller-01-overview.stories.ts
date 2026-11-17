import type { Meta, StoryObj } from '@storybook/angular';

import {
  about,
  featureItems,
  personItems,
  shared,
  withDescription,
  withScrollerKit,
} from '../../testing/carousel-story-kit';
import { AndesCarouselScroller } from './carousel-scroller';

/*
 * The scroller in its two everyday shapes: a row of feature cards and a row of team members,
 * both with snapping, fading edges and the buttons that appear when there is more to see.
 */

const meta: Meta<AndesCarouselScroller> = {
  title: 'Data Display/Carousel/Scroller',
  component: AndesCarouselScroller,
  decorators: [withDescription, withScrollerKit],
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<AndesCarouselScroller>;

/** A row of cards that scrolls when they overflow. */
export const BrowseFeatures: Story = {
  name: 'Browse features',
  parameters: about(
    'A row of cards that snaps each card to the start edge, fades the edges that have more behind them and shows the previous and next buttons only while the row can move that way.',
  ),
  render: () => ({
    props: shared,
    template: `
      <div [style]="frame">
        <andes-carousel-scroller aria-label="Browse features" [gap]="16" [itemWidth]="256">
          ${featureItems()}
        </andes-carousel-scroller>
      </div>`,
  }),
};

/** People cards with snapping and buttons. */
export const TeamMembers: Story = {
  name: 'Team members',
  parameters: about(
    'Team member cards in a snapping row with navigation buttons, each card announced with the name of the person it shows.',
  ),
  render: () => ({
    props: shared,
    template: `
      <div [style]="frame">
        <andes-carousel-scroller aria-label="Team members" [gap]="16" [itemWidth]="176" [fadeEdges]="false">
          ${personItems()}
        </andes-carousel-scroller>
      </div>`,
  }),
};
