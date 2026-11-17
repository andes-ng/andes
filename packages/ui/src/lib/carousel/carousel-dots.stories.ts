import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';

import { AndesCarousel } from './carousel';
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

const imports = [AndesCarousel, AndesCarouselSlide];

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
  title: 'Data Display/Carousel/Dots',
  component: AndesCarousel,
  decorators: [moduleMetadata({ imports })],
  parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj<AndesCarousel>;

export const DotStyles: Story = {
  parameters: {
    docs: {
      description: {
        story:
          '`dotStyle` is a circle (`dot`), a flat bar (`line`) or a short bar whose active one is longer (`pill`). `dotSize` sets the thickness.',
      },
    },
  },
  render: () => ({
    props: { ...COMMON_PROPS, styles: ['dot', 'line', 'pill'] },
    template: `
      <div style="display: grid; gap: 1.5rem; max-width: 40rem;">
        @for (style of styles; track style) {
          <figure style="margin: 0; font: 12px/20px system-ui;">
            <div [style]="frame">
              <andes-carousel [aria-label]="style + ' dots'" [dotStyle]="style" autoplay dotProgress [active]="1">
                ${pictures()}
              </andes-carousel>
            </div>
            <figcaption>{{ style }}</figcaption>
          </figure>
        }
      </div>`,
  }),
};

/**
 * The dots sit on any edge; `start` and `end` are vertical rails on the inline edges and swap
 * sides in right-to-left layouts. The first four carousels keep them over the slides, the last
 * four use `dotPosition="outside"` to give them their own space beside the slides, in the page
 * colours.
 */
export const DotPlacements: Story = {
  render: () => ({
    props: {
      slides: SLIDES.slice(0, 4),
      frame: FRAME,
      picture: PICTURE,
      placements: ['top', 'bottom', 'start', 'end'],
    },
    template: `
      <div style="display: flex; flex-direction: column; gap: 2rem;">
        <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 20rem)); gap: 1.5rem;">
          @for (placement of placements; track placement) {
            <figure style="margin: 0; font: 12px/20px system-ui;">
              <div [style]="frame">
                <andes-carousel [aria-label]="'Dots at ' + placement" dotStyle="pill" [dotPlacement]="placement" [active]="1">
                  ${pictures()}
                </andes-carousel>
              </div>
              <figcaption>{{ placement }}</figcaption>
            </figure>
          }
        </div>
        <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 22rem)); gap: 1.5rem;">
          @for (placement of placements; track placement) {
            <figure style="margin: 0; font: 12px/20px system-ui;">
              <andes-carousel [aria-label]="'Outside dots at ' + placement" dotStyle="pill" dotPosition="outside" [dotPlacement]="placement" [active]="1">
                ${pictures('border-radius: 0.5rem;')}
              </andes-carousel>
              <figcaption>outside, {{ placement }}</figcaption>
            </figure>
          }
        </div>
      </div>`,
  }),
};

export const DotColours: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Colours come from `--andes-carousel-dot-color`, `-dot-active-color`, `-dot-hover-color`, `-dot-size`, `-dot-length`, `-dot-active-length` and `-dot-background`. Set them on the carousel, an ancestor or through `dots.className`.',
      },
    },
  },
  render: () => ({
    props: COMMON_PROPS,
    template: `
      <style>
        .story-dots-dark { --andes-carousel-dot-color: rgb(15 23 42 / 30%); --andes-carousel-dot-active-color: rgb(15 23 42); }
        .story-dots-brand { --andes-carousel-dot-color: rgb(255 255 255 / 45%); --andes-carousel-dot-active-color: #f59e0b; --andes-carousel-dot-background: rgb(15 23 42 / 55%); }
      </style>
      <div style="display: grid; gap: 1.5rem; max-width: 40rem;">
        <div [style]="frame">
          <andes-carousel aria-label="Dark dots" dotStyle="pill" [dots]="{ className: 'story-dots-dark' }" [active]="1">${pictures()}</andes-carousel>
        </div>
        <div [style]="frame">
          <andes-carousel aria-label="Light dots" dotStyle="line" [active]="2">${pictures()}</andes-carousel>
        </div>
        <div [style]="frame">
          <andes-carousel aria-label="Branded dots" dotStyle="dot" [dots]="{ className: 'story-dots-brand' }" [dotSize]="8">${pictures()}</andes-carousel>
        </div>
      </div>`,
  }),
};

export const CustomDots: Story = {
  render: () => ({
    props: { slides: SLIDES.slice(0, 5), frame: FRAME, picture: PICTURE },
    template: `
      <ng-template #dot let-index="index" let-active="active"><span style="font: 600 12px/20px system-ui; min-width: 1rem;">{{ index + 1 }}</span></ng-template>
      <div [style]="frame">
        <andes-carousel aria-label="Numbered dots" [dotTemplate]="dot">
          ${pictures()}
        </andes-carousel>
      </div>`,
  }),
};
