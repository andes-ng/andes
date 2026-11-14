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
 * The size of the items and the gap between them, items of their own width, a right-to-left
 * page, translated strings and the keyboard.
 */

const meta: Meta<AndesCarouselScroller> = {
  title: 'Data Display/Carousel/Scroller layout and accessibility',
  component: AndesCarouselScroller,
  decorators: [withDescription, withScrollerKit],
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<AndesCarouselScroller>;

/** Three cards per view. */
export const ItemWidthAndGap: Story = {
  name: 'Item width and gap',
  parameters: about(
    'itemWidth and gap give every card the same size and spacing, and a calc() width such as a third of the row minus the gaps shows exactly three cards per view.',
  ),
  render: () => ({
    props: shared,
    template: `
      <div [style]="frame">
        <andes-carousel-scroller aria-label="Three at a time" [gap]="12" itemWidth="calc((100% - 24px) / 3)">
          ${personItems()}
        </andes-carousel-scroller>
      </div>`,
  }),
};

/** Cards of different widths. */
export const ContentWidth: Story = {
  name: 'Content width',
  parameters: about(
    'Without an itemWidth each item is as wide as its content, so a row of tags of different lengths scrolls and snaps just the same.',
  ),
  render: () => ({
    props: {
      ...shared,
      tags: [
        'Accessibility',
        'Design tokens',
        'Right to left',
        'Dark theme',
        'Reduced motion',
        'Keyboard support',
        'Touch gestures',
        'Server rendering',
      ],
    },
    template: `
      <div style="max-width: 24rem;">
        <andes-carousel-scroller aria-label="Topics" [gap]="8" [arrowSize]="'sm'">
          @for (tag of tags; track tag) {
            <andes-carousel-scroller-item><andes-tag>{{ tag }}</andes-tag></andes-carousel-scroller-item>
          }
        </andes-carousel-scroller>
      </div>`,
  }),
};

/** Right-to-left. */
export const RightToLeft: Story = {
  name: 'Right to left',
  parameters: about(
    'In a right-to-left page the row starts at the right edge, the fades and buttons mirror, and the arrow keys and swipes follow the reading direction.',
  ),
  render: () => ({
    props: shared,
    template: `
      <div dir="rtl" [style]="frame">
        <andes-carousel-scroller aria-label="Browse features" [gap]="16" [itemWidth]="256">
          ${featureItems()}
        </andes-carousel-scroller>
      </div>`,
  }),
};

/** Translated strings. */
export const Localisation: Story = {
  name: 'Localisation',
  parameters: about(
    'The labels input translates the name of the scroll container, the buttons and the "n of m" announcement of every item.',
  ),
  render: () => ({
    props: {
      ...shared,
      labels: {
        slides: 'Elementos',
        slide: (position: number, total: number) => `${position} de ${total}`,
        previous: 'Anterior',
        next: 'Siguiente',
      },
    },
    template: `
      <div [style]="frame">
        <andes-carousel-scroller aria-label="Explorar funciones" [labels]="labels" [gap]="16" [itemWidth]="256">
          ${featureItems()}
        </andes-carousel-scroller>
      </div>`,
  }),
};

/** Keyboard use. */
export const Keyboard: Story = {
  name: 'Keyboard',
  parameters: about(
    'Tab reaches the row only while the cards overflow, the arrow keys then move one card, Home and End jump to the ends, and Tab again continues into the controls inside the cards.',
  ),
  render: () => ({
    props: shared,
    template: `
      <div [style]="frame">
        <andes-carousel-scroller aria-label="Browse features with the keyboard" [gap]="16" [itemWidth]="256">
          ${featureItems()}
        </andes-carousel-scroller>
      </div>`,
  }),
};
