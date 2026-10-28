import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';

import { AndesCarousel } from './carousel';
import { AndesCarouselLazy } from './carousel-lazy';
import { AndesCarouselSlide } from './carousel-slide';

/** Scenic slides drawn as SVG, so the stories need no network. */
const PALETTES = [
  ['#fde68a', '#fb923c', '#7c3aed'],
  ['#bae6fd', '#38bdf8', '#16a34a'],
  ['#c7d2fe', '#4338ca', '#1e1b4b'],
  ['#fecdd3', '#fb7185', '#be123c'],
  ['#a7f3d0', '#2dd4bf', '#0f766e'],
  ['#fef08a', '#f59e0b', '#92400e'],
];
const TITLES = [
  'Sunset ridge',
  'Green valley',
  'Night hills',
  'Rose horizon',
  'Teal coast',
  'Amber dunes',
];

function scene(index: number, width = 900, height = 420): string {
  const [top, bottom, hills] = PALETTES[index % PALETTES.length];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${bottom}"/></linearGradient></defs><rect width="${width}" height="${height}" fill="url(#g)"/><circle cx="${width * 0.7}" cy="${height * 0.3}" r="${height * 0.1}" fill="#fff" opacity="0.85"/><path d="M0 ${height * 0.7} Q ${width * 0.3} ${height * 0.45} ${width * 0.6} ${height * 0.68} T ${width} ${height * 0.6} V ${height} H0Z" fill="${hills}"/><path d="M0 ${height * 0.86} Q ${width * 0.4} ${height * 0.7} ${width * 0.75} ${height * 0.84} T ${width} ${height * 0.8} V ${height} H0Z" fill="${hills}" opacity="0.7"/></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const SLIDES = TITLES.map((title, i) => ({ title, src: scene(i) }));

const imports = [AndesCarousel, AndesCarouselSlide, AndesCarouselLazy];

const PICTURE =
  'display: block; width: 100%; height: 100%; object-fit: cover; user-select: none;';
const FRAME = 'max-width: 40rem; border-radius: 0.5rem; overflow: hidden;';

/** The slides of most stories: one picture each, named after its scene. */
function pictures(style = ''): string {
  return `@for (slide of slides; track slide.title) {
    <andes-carousel-slide [label]="slide.title"><img [src]="slide.src" [alt]="slide.title" [style]="picture + '${style}'" draggable="false" /></andes-carousel-slide>
  }`;
}

const COMMON_PROPS = { slides: SLIDES, frame: FRAME, picture: PICTURE };

const meta: Meta<AndesCarousel> = {
  title: 'Data Display/Carousel/Layout',
  component: AndesCarousel,
  decorators: [moduleMetadata({ imports })],
  parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj<AndesCarousel>;

/**
 * How many slides show at once. First: three per view with a gap. Second: `slidesPerView` of
 * 1.25 lets the next slide peek in. Third: with `infinite` off the carousel stops at the ends
 * and an arrow is disabled there.
 */
export const SlidesPerView: Story = {
  render: () => ({
    props: COMMON_PROPS,
    template: `
      <div style="display: flex; flex-direction: column; gap: 2rem; max-width: 48rem; font: 12px/20px system-ui;">
        <figure style="margin: 0;">
          <andes-carousel aria-label="Photos" [slidesPerView]="3" [gap]="12" arrows="always">
            ${pictures('aspect-ratio: 4 / 3; border-radius: 0.375rem;')}
          </andes-carousel>
          <figcaption>slidesPerView 3</figcaption>
        </figure>
        <figure style="margin: 0;">
          <andes-carousel aria-label="Peeking" [slidesPerView]="1.25" [gap]="12" arrows="hover">
            ${pictures('aspect-ratio: 4 / 3; border-radius: 0.375rem;')}
          </andes-carousel>
          <figcaption>slidesPerView 1.25, the next slide peeks in</figcaption>
        </figure>
        <figure style="margin: 0;">
          <div [style]="frame">
            <andes-carousel aria-label="Not infinite" [infinite]="false" arrows="always">
              ${pictures()}
            </andes-carousel>
          </div>
          <figcaption>infinite off</figcaption>
        </figure>
      </div>`,
  }),
};

export const ResponsivePerView: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "`slidesPerView` takes a map of the carousel's own minimum width to a count. Drag the corner of the frame to resize it.",
      },
    },
  },
  render: () => ({
    props: { ...COMMON_PROPS, breakpoints: { 0: 1, 360: 2, 560: 3 } },
    template: `
      <div style="max-width: 100%; width: 40rem; min-width: 12rem; resize: horizontal; overflow: auto; padding-bottom: 0.5rem; border: 1px dashed var(--andes-color-border);">
        <andes-carousel aria-label="Responsive" [slidesPerView]="breakpoints" [gap]="12" arrows="hover" dotPosition="outside">
          ${pictures('aspect-ratio: 4 / 3; border-radius: 0.375rem;')}
        </andes-carousel>
      </div>`,
  }),
};

export const SlidesToScroll: Story = {
  parameters: {
    docs: {
      description: {
        story:
          '`slidesToScroll` moves by pages: three slides per view, three per step, so the dots become pages.',
      },
    },
  },
  render: () => ({
    props: COMMON_PROPS,
    template: `
      <div style="max-width: 48rem;">
        <andes-carousel aria-label="Pages" [slidesPerView]="3" [slidesToScroll]="3" [gap]="12" arrows="always" [infinite]="false" dotPosition="outside">
          ${pictures('aspect-ratio: 4 / 3; border-radius: 0.375rem;')}
        </andes-carousel>
      </div>`,
  }),
};

/**
 * `align="center"` lines the selected slide up with the middle of the view. First: one slide
 * with `peek` showing a sliver of each neighbour. Second: three per view, centered, with
 * `containScroll` off so the first and last slides can reach the middle.
 */
export const Alignment: Story = {
  render: () => ({
    props: COMMON_PROPS,
    template: `
      <div style="display: flex; flex-direction: column; gap: 2rem; font: 12px/20px system-ui;">
        <figure style="margin: 0; max-width: 44rem;">
          <andes-carousel aria-label="Centered" align="center" [slidesPerView]="1" [peek]="56" [gap]="12" arrows="hover" dotPosition="outside" dotStyle="pill">
            ${pictures('border-radius: 0.5rem;')}
          </andes-carousel>
          <figcaption>centered with peek</figcaption>
        </figure>
        <figure style="margin: 0; max-width: 48rem;">
          <andes-carousel aria-label="Centered several" align="center" [slidesPerView]="3" [gap]="12" [containScroll]="false" [infinite]="false" arrows="always" dotPosition="outside">
            ${pictures('aspect-ratio: 4 / 3; border-radius: 0.375rem;')}
          </andes-carousel>
          <figcaption>centered, three per view</figcaption>
        </figure>
      </div>`,
  }),
};

/**
 * What decides the carousel's height. First: `aspectRatio` fixes the shape of the viewport and
 * slides stretch to fill it. Second: `adaptiveHeight` lets the viewport follow the height of the
 * slides in view, animating between them.
 */
export const Sizing: Story = {
  render: () => ({
    props: COMMON_PROPS,
    template: `
      <div style="display: flex; flex-direction: column; gap: 2rem; font: 12px/20px system-ui;">
        <figure style="margin: 0;">
          <div [style]="frame">
            <andes-carousel aria-label="Square" [aspectRatio]="'1 / 1'" arrows="hover">
              ${pictures()}
            </andes-carousel>
          </div>
          <figcaption>aspectRatio 1 / 1</figcaption>
        </figure>
        <figure style="margin: 0;">
          <div style="max-width: 32rem; border: 1px solid var(--andes-color-border); border-radius: 0.5rem; overflow: hidden; font: 14px/22px system-ui;">
            <andes-carousel aria-label="Notes" adaptiveHeight arrows="always" dotPosition="outside">
              <andes-carousel-slide label="Short"><div style="padding: 1rem 3.5rem;">One short line.</div></andes-carousel-slide>
              <andes-carousel-slide label="Medium"><div style="padding: 1rem 3.5rem;"><p style="margin: 0;">A note that runs to a few lines, so the carousel has to grow to hold it and shrink again for the next one.</p><p style="margin: 0.5rem 0 0;">Second paragraph.</p></div></andes-carousel-slide>
              <andes-carousel-slide label="Tall"><div style="padding: 1rem 3.5rem;"><p style="margin: 0;">The tallest note.</p><ul style="margin: 0.5rem 0 0;"><li>First</li><li>Second</li><li>Third</li><li>Fourth</li><li>Fifth</li></ul></div></andes-carousel-slide>
            </andes-carousel>
          </div>
          <figcaption>adaptiveHeight</figcaption>
        </figure>
      </div>`,
  }),
};

export const LazySlides: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Only the visible slides and their neighbours are created; the rest build when they come near.',
      },
    },
  },
  render: () => ({
    props: COMMON_PROPS,
    template: `
      <div [style]="frame">
        <andes-carousel aria-label="Lazy slides" arrows="hover" [preload]="0">
          @for (slide of slides; track slide.title) {
            <andes-carousel-slide>
              <ng-template andesCarouselLazy><img [src]="slide.src" [alt]="slide.title" [style]="picture" draggable="false" /></ng-template>
            </andes-carousel-slide>
          }
        </andes-carousel>
      </div>`,
  }),
};

/**
 * `orientation="vertical"` (or the `vertical` shorthand) needs a height: give the host one
 * (here `height: 16rem`) or set `slideHeight`. Up and Down move it, a drag follows the vertical
 * axis, the arrows go to the top and bottom and the dots to the end rail. First: a plain
 * vertical carousel. Second: vertical with autoplay and progress dots. Third: `slideHeight` sizes
 * the carousel from its slides: three at 5rem, with a gap and wheel scrolling.
 */
export const Vertical: Story = {
  render: () => ({
    props: { slides: SLIDES, picture: PICTURE },
    template: `
      <div style="display: flex; flex-wrap: wrap; gap: 2rem; align-items: flex-start; font: 12px/20px system-ui;">
        <figure style="margin: 0; width: 24rem;">
          <div style="height: 16rem;">
            <andes-carousel aria-label="Vertical landscapes" orientation="vertical" arrows="hover" style="height: 100%;">
              ${pictures()}
            </andes-carousel>
          </div>
          <figcaption>vertical</figcaption>
        </figure>
        <figure style="margin: 0; width: 24rem;">
          <div style="height: 16rem;">
            <andes-carousel aria-label="Vertical autoplay" vertical autoplay [autoplaySpeed]="2500" dotStyle="pill" dotProgress arrows="hover" style="height: 100%;">
              ${pictures()}
            </andes-carousel>
          </div>
          <figcaption>vertical autoplay</figcaption>
        </figure>
        <figure style="margin: 0; width: 22rem;">
          <andes-carousel aria-label="News" orientation="vertical" [slidesPerView]="3" [gap]="8" slideHeight="5rem" wheel dotPosition="outside" arrows="hover">
            ${pictures('border-radius: 0.375rem;')}
          </andes-carousel>
          <figcaption>three per view, slideHeight</figcaption>
        </figure>
      </div>`,
  }),
};
