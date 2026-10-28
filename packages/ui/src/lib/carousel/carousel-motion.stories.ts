import { Component } from '@angular/core';
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
  title: 'Data Display/Carousel/Motion',
  component: AndesCarousel,
  decorators: [moduleMetadata({ imports })],
  parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj<AndesCarousel>;

/**
 * Autoplay with progress dots: the active dot fills over the delay, so it shows when the next
 * change comes, and restarts whenever the delay does. Hover, keyboard focus, a drag, a hidden tab
 * and scrolling out of view each hold it, and each lets go on its own: the delay then starts over
 * from the full length. A press with the pointer does not count as focus. The button in the
 * corner stops and restarts it for good; the live region stays quiet while it rotates.
 */
export const Autoplay: Story = {
  render: () => ({
    props: COMMON_PROPS,
    template: `
      <div [style]="frame">
        <andes-carousel aria-label="Autoplay" autoplay [autoplaySpeed]="2500" dotProgress dotStyle="pill" arrows="hover">
          ${pictures()}
        </andes-carousel>
      </div>`,
  }),
};

@Component({
  selector: 'andes-story-carousel-autoplay-state',
  imports: [AndesCarousel, AndesCarouselSlide],
  template: `
    <p style="margin: 0 0 0.5rem; font: 14px/22px system-ui;">
      State:
      <strong data-testid="state">{{ carousel.autoplayState() }}</strong> ·
      playing:
      <strong data-testid="playing">{{ carousel.isPlaying() }}</strong> · stop:
      <strong data-testid="stop">{{ carousel.selectedIndex() + 1 }}</strong>
    </p>
    <div style="max-width: 40rem; border-radius: 0.5rem; overflow: hidden;">
      <andes-carousel
        #carousel
        aria-label="Autoplay states"
        [autoplay]="{ speed: 2000, pauseOnHover: true, pauseOnFocus: true }"
        dotProgress
        dotStyle="pill"
        arrows="hover"
      >
        @for (slide of slides; track slide.title) {
          <andes-carousel-slide
            ><img
              [src]="slide.src"
              [alt]="slide.title"
              style="display: block; width: 100%; height: 100%; object-fit: cover;"
              draggable="false"
          /></andes-carousel-slide>
        }
      </andes-carousel>
    </div>
  `,
})
class AutoplayStateDemo {
  protected readonly slides = SLIDES.slice(0, 4);
}

export const AutoplayStates: Story = {
  decorators: [moduleMetadata({ imports: [AutoplayStateDemo] })],
  parameters: {
    docs: {
      description: {
        story:
          'The readout shows which state autoplay is in: running, or paused by hover, focus, a drag, the user, a hidden tab, scrolling out of view; or off for reduced motion. Move the pointer in and out, press Tab, drag, scroll the page.',
      },
    },
  },
  render: () => ({ template: `<andes-story-carousel-autoplay-state />` }),
};

/**
 * The other autoplay options. First: `direction: 'backward'` without pausing on hover. Second:
 * `stopOnInteraction` - the first drag, arrow, dot or key stops autoplay until the play button
 * is pressed. Third: `autoplayControl` off hides the play button, which is only for short,
 * non-essential motion: a slide show that runs for more than a few seconds needs the button.
 */
export const AutoplayOptions: Story = {
  render: () => ({
    props: COMMON_PROPS,
    template: `
      <div style="display: grid; gap: 1.5rem; max-width: 40rem; font: 12px/20px system-ui;">
        <figure style="margin: 0;">
          <div [style]="frame">
            <andes-carousel aria-label="Backwards" [autoplay]="{ speed: 2000, direction: 'backward', pauseOnHover: false }" arrows="hover">
              ${pictures()}
            </andes-carousel>
          </div>
          <figcaption>backwards, no pause on hover</figcaption>
        </figure>
        <figure style="margin: 0;">
          <div [style]="frame">
            <andes-carousel aria-label="Stops on interaction" autoplay [autoplaySpeed]="2000" stopOnInteraction>
              ${pictures()}
            </andes-carousel>
          </div>
          <figcaption>stopOnInteraction</figcaption>
        </figure>
        <figure style="margin: 0;">
          <div [style]="frame">
            <andes-carousel aria-label="No play button" autoplay [autoplayControl]="false">
              ${pictures()}
            </andes-carousel>
          </div>
          <figcaption>autoplayControl off</figcaption>
        </figure>
      </div>`,
  }),
};

/**
 * The `effect` input: `scroll` (the default slide), `fade`, and `slide-fade` where slides move as
 * usual and fade out as they leave, following a drag.
 */
export const Effects: Story = {
  render: () => ({
    props: {
      ...COMMON_PROPS,
      effects: [
        { effect: 'scroll', speed: null },
        { effect: 'fade', speed: null },
        { effect: 'slide-fade', speed: 600 },
      ],
    },
    template: `
      <div style="display: grid; gap: 1.5rem; max-width: 40rem;">
        @for (item of effects; track item.effect) {
          <figure style="margin: 0; font: 12px/20px system-ui;">
            <div [style]="frame">
              <andes-carousel [aria-label]="item.effect" [effect]="item.effect" [speed]="item.speed" arrows="hover">
                ${pictures()}
              </andes-carousel>
            </div>
            <figcaption>{{ item.effect }}</figcaption>
          </figure>
        }
      </div>`,
  }),
};

/**
 * `speed` (ms) and `easing` (a preset or any CSS easing) set the transition; `waitForAnimate`
 * ignores arrows, dots and keys while a change is still moving. The last carousel sets the whole
 * transition from CSS with `--andes-carousel-duration` and `--andes-carousel-easing`, with no
 * input at all.
 */
export const SpeedAndEasing: Story = {
  render: () => ({
    props: {
      ...COMMON_PROPS,
      curves: [
        { easing: 'out', speed: 400 },
        { easing: 'ease-in-out', speed: 700 },
        { easing: 'linear', speed: 700 },
        { easing: 'spring', speed: 700 },
      ],
    },
    template: `
      <style>.story-slow { --andes-carousel-duration: 1200ms; --andes-carousel-easing: cubic-bezier(0.7, 0, 0.3, 1); }</style>
      <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 20rem)); gap: 1.5rem;">
        @for (curve of curves; track curve.easing) {
          <figure style="margin: 0; font: 12px/20px system-ui;">
            <div [style]="frame">
              <andes-carousel [aria-label]="curve.easing" [easing]="curve.easing" [speed]="curve.speed" waitForAnimate arrows="always" [dots]="false">
                ${pictures()}
              </andes-carousel>
            </div>
            <figcaption>{{ curve.easing }}, {{ curve.speed }}ms</figcaption>
          </figure>
        }
        <figure style="margin: 0; font: 12px/20px system-ui;">
          <div [style]="frame">
            <andes-carousel class="story-slow" aria-label="Slow" arrows="always" [dots]="false">
              ${pictures()}
            </andes-carousel>
          </div>
          <figcaption>CSS custom properties, 1200ms</figcaption>
        </figure>
      </div>`,
  }),
};

export const ReducedMotion: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'With `prefers-reduced-motion: reduce` slides change instantly and autoplay does not start (and the play button is not shown). `reducedMotion="reduce"` forces that; `"allow"` keeps the motion whatever the preference. This one forces it.',
      },
    },
  },
  render: () => ({
    props: COMMON_PROPS,
    template: `
      <div [style]="frame">
        <andes-carousel aria-label="Reduced motion" autoplay reducedMotion="reduce" arrows="always">
          ${pictures()}
        </andes-carousel>
      </div>`,
  }),
};
