import { Component, signal } from '@angular/core';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';

import { AndesCarousel } from './carousel';
import { AndesCarouselSlide } from './carousel-slide';
import { AndesCarouselThumbs } from './carousel-thumbs';

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

const imports = [AndesCarousel, AndesCarouselSlide, AndesCarouselThumbs];

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
  title: 'Data Display/Carousel/Basics',
  component: AndesCarousel,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports })],
  argTypes: {
    effect: {
      control: 'inline-radio',
      options: ['scroll', 'fade', 'slide-fade'],
    },
    orientation: {
      control: 'inline-radio',
      options: ['horizontal', 'vertical'],
    },
    autoplay: { control: 'boolean' },
    autoplaySpeed: { control: 'number' },
    pauseOnHover: { control: 'boolean' },
    pauseOnFocus: { control: 'boolean' },
    stopOnInteraction: { control: 'boolean' },
    autoplayControl: { control: 'boolean' },
    dots: { control: 'boolean' },
    dotStyle: { control: 'inline-radio', options: ['dot', 'line', 'pill'] },
    dotSize: { control: 'number' },
    dotPlacement: {
      control: 'select',
      options: [null, 'top', 'bottom', 'start', 'end'],
    },
    dotPosition: { control: 'inline-radio', options: ['inside', 'outside'] },
    dotProgress: { control: 'boolean' },
    arrows: { control: 'select', options: [false, 'hover', 'always'] },
    arrowPlacement: { control: 'inline-radio', options: ['inside', 'outside'] },
    arrowSize: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    hideArrowsOnTouch: { control: 'boolean' },
    infinite: { control: 'boolean' },
    slidesPerView: { control: 'number' },
    slidesToScroll: { control: 'number' },
    align: { control: 'inline-radio', options: ['start', 'center', 'end'] },
    containScroll: { control: 'boolean' },
    gap: { control: 'number' },
    peek: { control: 'number' },
    speed: { control: 'number' },
    easing: {
      control: 'select',
      options: [null, 'out', 'ease', 'ease-in-out', 'linear', 'spring'],
    },
    waitForAnimate: { control: 'boolean' },
    reducedMotion: {
      control: 'inline-radio',
      options: ['system', 'reduce', 'allow'],
    },
    draggable: { control: 'boolean' },
    dragFree: { control: 'boolean' },
    dragThreshold: { control: 'number' },
    skipSnaps: { control: 'boolean' },
    wheel: { control: 'boolean' },
    keyboard: { control: 'boolean' },
    dotTemplate: { control: false },
    arrowTemplate: { control: false },
    labels: { control: false },
    active: { control: 'number' },
  },
  args: {
    effect: 'scroll',
    orientation: 'horizontal',
    autoplay: false,
    autoplaySpeed: 3000,
    pauseOnHover: true,
    pauseOnFocus: true,
    stopOnInteraction: false,
    autoplayControl: true,
    dots: true,
    dotStyle: 'dot',
    dotSize: null,
    dotPlacement: null,
    dotPosition: 'inside',
    dotProgress: false,
    arrows: 'hover',
    arrowPlacement: 'inside',
    arrowSize: 'md',
    hideArrowsOnTouch: false,
    infinite: true,
    slidesPerView: 1,
    slidesToScroll: 1,
    align: 'start',
    containScroll: true,
    gap: 0,
    peek: null,
    speed: null,
    easing: null,
    waitForAnimate: false,
    reducedMotion: 'system',
    draggable: true,
    dragFree: false,
    dragThreshold: 6,
    skipSnaps: false,
    wheel: false,
    keyboard: true,
    active: 0,
  },
  parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj<AndesCarousel>;

export const Default: Story = {
  render: (args) => ({
    props: { ...args, ...COMMON_PROPS },
    template: `
      <div [style]="frame">
        <andes-carousel aria-label="Landscapes" [effect]="effect" [orientation]="orientation" [autoplay]="autoplay" [autoplaySpeed]="autoplaySpeed" [pauseOnHover]="pauseOnHover" [pauseOnFocus]="pauseOnFocus" [stopOnInteraction]="stopOnInteraction" [autoplayControl]="autoplayControl" [dots]="dots" [dotStyle]="dotStyle" [dotSize]="dotSize" [dotPlacement]="dotPlacement" [dotPosition]="dotPosition" [dotProgress]="dotProgress" [arrows]="arrows" [arrowPlacement]="arrowPlacement" [arrowSize]="arrowSize" [hideArrowsOnTouch]="hideArrowsOnTouch" [infinite]="infinite" [slidesPerView]="slidesPerView" [slidesToScroll]="slidesToScroll" [align]="align" [containScroll]="containScroll" [gap]="gap" [peek]="peek" [speed]="speed" [easing]="easing" [waitForAnimate]="waitForAnimate" [reducedMotion]="reducedMotion" [draggable]="draggable" [dragFree]="dragFree" [dragThreshold]="dragThreshold" [skipSnaps]="skipSnaps" [wheel]="wheel" [keyboard]="keyboard" [active]="active" [style.height]="orientation === 'vertical' ? '16rem' : null">
          ${pictures()}
        </andes-carousel>
      </div>`,
  }),
};

export const Content: Story = {
  parameters: {
    docs: {
      description: { story: 'Slides hold any content, not just pictures.' },
    },
  },
  render: () => ({
    template: `
      <div style="max-width: 32rem; border: 1px solid var(--andes-color-border); border-radius: 0.5rem; overflow: hidden; font: 14px/22px system-ui;">
        <andes-carousel aria-label="Release notes" arrows="always">
          <andes-carousel-slide label="Reports"><div style="padding: 2.5rem 3.5rem; min-height: 9rem;"><strong style="font-size: 16px; line-height: 24px;">Faster reports</strong><p style="margin: 0.5rem 0 0;">Exports now run in the background and arrive by email.</p><a href="#reports" style="color: var(--andes-color-primary-text);">Read more</a></div></andes-carousel-slide>
          <andes-carousel-slide label="Search"><div style="padding: 2.5rem 3.5rem; min-height: 9rem;"><strong style="font-size: 16px; line-height: 24px;">Better search</strong><p style="margin: 0.5rem 0 0;">Filter by status, owner and date in one box.</p><a href="#search" style="color: var(--andes-color-primary-text);">Read more</a></div></andes-carousel-slide>
          <andes-carousel-slide label="Roles"><div style="padding: 2.5rem 3.5rem; min-height: 9rem;"><strong style="font-size: 16px; line-height: 24px;">Custom roles</strong><p style="margin: 0.5rem 0 0;">Give each team exactly the access it needs.</p><a href="#roles" style="color: var(--andes-color-primary-text);">Read more</a></div></andes-carousel-slide>
        </andes-carousel>
      </div>`,
  }),
};

@Component({
  selector: 'andes-story-carousel-controlled',
  imports: [AndesCarousel, AndesCarouselSlide],
  template: `
    <div
      style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.75rem; align-items: center; font: 14px/22px system-ui;"
    >
      <button type="button" (click)="carousel.prev()">prev()</button>
      <button type="button" (click)="carousel.next()">next()</button>
      <button type="button" (click)="carousel.goTo(3, false)">
        goTo(3, false)
      </button>
      <button type="button" (click)="carousel.play()">play()</button>
      <button type="button" (click)="carousel.pause()">pause()</button>
      <button type="button" (click)="active.set(0)">active = 0</button>
    </div>
    <p style="margin: 0 0 0.75rem; font: 12px/20px system-ui;">
      active: {{ active() }} · selectedIndex: {{ carousel.selectedIndex() }} ·
      slideCount: {{ carousel.slideCount() }} · canScrollPrev:
      {{ carousel.canScrollPrev() }} · canScrollNext:
      {{ carousel.canScrollNext() }} · isPlaying: {{ carousel.isPlaying() }}
      <br />
      events: {{ log() }}
    </p>
    <div style="max-width: 40rem; border-radius: 0.5rem; overflow: hidden;">
      <andes-carousel
        #carousel
        aria-label="Controlled"
        arrows="hover"
        autoplay
        [autoplaySpeed]="4000"
        [infinite]="false"
        [(active)]="active"
        (slideChange)="push('slideChange ' + $event.from + '>' + $event.to)"
        (slideChanged)="push('slideChanged ' + $event)"
        (settled)="push('settled ' + $event)"
        (dragStarted)="push('dragStarted ' + $event)"
        (dragEnded)="push('dragEnded ' + $event.from + '>' + $event.to)"
        (ready)="push('ready')"
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
class ControlledDemo {
  protected readonly slides = SLIDES;
  protected readonly active = signal(1);
  protected readonly log = signal('none');
  private readonly recent: string[] = [];

  protected push(entry: string): void {
    this.recent.unshift(entry);
    this.recent.length = Math.min(this.recent.length, 3);
    this.log.set(this.recent.join(' | '));
  }
}

export const Controlled: Story = {
  decorators: [moduleMetadata({ imports: [ControlledDemo] })],
  parameters: {
    docs: {
      description: {
        story:
          'The two-way `active` model, the methods `next()`, `prev()`, `goTo()`, `play()` and `pause()`, the signals `selectedIndex`, `slideCount`, `canScrollPrev`, `canScrollNext` and `isPlaying`, and the outputs `slideChange`, `slideChanged`, `settled`, `dragStarted`, `dragEnded` and `ready`.',
      },
    },
  },
  render: () => ({ template: `<andes-story-carousel-controlled />` }),
};

@Component({
  selector: 'andes-story-carousel-gallery',
  imports: [AndesCarousel, AndesCarouselSlide, AndesCarouselThumbs],
  template: `
    <div style="max-width: 40rem;">
      <andes-carousel
        #main
        aria-label="Gallery"
        arrows="hover"
        [dots]="false"
        [infinite]="false"
        style="border-radius: 0.5rem; overflow: hidden;"
      >
        @for (slide of slides; track slide.title) {
          <andes-carousel-slide [label]="slide.title"
            ><img
              [src]="slide.src"
              [alt]="slide.title"
              style="display: block; width: 100%; height: 100%; object-fit: cover;"
              draggable="false"
          /></andes-carousel-slide>
        }
      </andes-carousel>
      <andes-carousel-thumbs
        style="margin-top: 0.5rem;"
        [carousel]="main"
        [items]="thumbs"
      />
    </div>
  `,
})
class GalleryDemo {
  protected readonly slides = SLIDES;
  protected readonly thumbs = SLIDES.map((s) => s.src);
}

export const Thumbnails: Story = {
  decorators: [moduleMetadata({ imports: [GalleryDemo] })],
  parameters: {
    docs: {
      description: {
        story:
          '`andes-carousel-thumbs` keeps a strip of thumbnails in step with a carousel: the current one is marked and scrolled into view, and pressing one goes to that slide.',
      },
    },
  },
  render: () => ({ template: `<andes-story-carousel-gallery />` }),
};

/**
 * Dragging, with a mouse, finger or pen. A drag follows the pointer, resists at the ends of a
 * carousel that does not loop, snaps to the nearest stop and never clicks what it was released
 * over. The cursor is a grab hand; the page still scrolls on the other axis on touch screens.
 * First: the default snapping drag on a carousel that does not loop. Second: `dragFree` lets a
 * drag coast to rest anywhere, without snapping (`--andes-carousel-release-duration` sets the
 * length of the coast). Third: with `draggable` off the cursor is a plain pointer and text can
 * be selected; arrows, dots and keys still work.
 */
export const Dragging: Story = {
  render: () => ({
    props: COMMON_PROPS,
    template: `
      <div style="display: flex; flex-direction: column; gap: 2rem; font: 12px/20px system-ui;">
        <figure style="margin: 0; max-width: 40rem;">
          <div [style]="frame">
            <andes-carousel aria-label="Drag and swipe" [infinite]="false" arrows="always">
              ${pictures()}
            </andes-carousel>
          </div>
          <figcaption>Snapping drag, no loop</figcaption>
        </figure>
        <figure style="margin: 0; max-width: 48rem;">
          <andes-carousel aria-label="Free drag" [dragFree]="true" [slidesPerView]="2.5" [gap]="12" [infinite]="false" [dots]="false">
            ${pictures('aspect-ratio: 4 / 3; border-radius: 0.375rem;')}
          </andes-carousel>
          <figcaption>dragFree</figcaption>
        </figure>
        <figure style="margin: 0; max-width: 32rem;">
          <div style="border: 1px solid var(--andes-color-border); border-radius: 0.5rem; overflow: hidden; font: 14px/22px system-ui;">
            <andes-carousel aria-label="Selectable text" [draggable]="false" arrows="always">
              <andes-carousel-slide label="Terms"><div style="padding: 2.5rem 3.5rem; min-height: 8rem;"><strong>Select this text</strong><p style="margin: 0.5rem 0 0;">Payment is due within thirty days of the invoice date.</p></div></andes-carousel-slide>
              <andes-carousel-slide label="Delivery"><div style="padding: 2.5rem 3.5rem; min-height: 8rem;"><strong>Delivery</strong><p style="margin: 0.5rem 0 0;">Orders ship within two working days.</p></div></andes-carousel-slide>
              <andes-carousel-slide label="Returns"><div style="padding: 2.5rem 3.5rem; min-height: 8rem;"><strong>Returns</strong><p style="margin: 0.5rem 0 0;">Unused items can be returned for thirty days.</p></div></andes-carousel-slide>
            </andes-carousel>
          </div>
          <figcaption>draggable off, text stays selectable</figcaption>
        </figure>
      </div>`,
  }),
};

export const WheelAndKeys: Story = {
  render: () => ({
    props: COMMON_PROPS,
    template: `
      <div [style]="frame">
        <andes-carousel aria-label="Wheel and keys" wheel [infinite]="false" arrows="always">
          ${pictures()}
        </andes-carousel>
      </div>`,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'A horizontal wheel or trackpad swipe moves one stop at a time, and lets the page scroll once the end is reached. Arrow keys, Home and End work while focus is inside.',
      },
    },
  },
};

/**
 * The arrow controls. `arrows` is `hover` (default), `always` or `false`; `arrowPlacement="outside"`
 * puts them beside the slides and `arrowSize` is 24, 32 or 40 px; at the ends of a carousel that
 * does not loop an arrow is disabled. `arrowTemplate` swaps the glyph (with `hideArrowsOnTouch`),
 * and with `dots` and `arrows` both off the slides stand alone.
 */
export const Arrows: Story = {
  render: () => ({
    props: { ...COMMON_PROPS, sizes: ['sm', 'md', 'lg'] },
    template: `
      <ng-template #arrow let-direction="direction" let-disabled="disabled"><span style="font: 600 16px/1 system-ui;" [style.opacity]="disabled ? 0.4 : 1">{{ direction === 'prev' ? '‹' : '›' }}</span></ng-template>
      <div style="display: grid; gap: 1.5rem; max-width: 40rem; font: 12px/20px system-ui;">
        <figure style="margin: 0;">
          <div [style]="frame">
            <andes-carousel aria-label="Arrows always" arrows="always">${pictures()}</andes-carousel>
          </div>
          <figcaption>always visible (the default, hover, shows them on pointer or focus)</figcaption>
        </figure>
        @for (size of sizes; track size) {
          <figure style="margin: 0;">
            <andes-carousel [aria-label]="'Outside arrows ' + size" arrows="always" arrowPlacement="outside" [arrowSize]="size" [infinite]="false" dotPosition="outside">
              ${pictures('border-radius: 0.5rem;')}
            </andes-carousel>
            <figcaption>outside, {{ size }}</figcaption>
          </figure>
        }
        <figure style="margin: 0;">
          <div [style]="frame">
            <andes-carousel aria-label="Custom arrows" arrows="always" [arrowTemplate]="arrow" [hideArrowsOnTouch]="true">${pictures()}</andes-carousel>
          </div>
          <figcaption>arrowTemplate</figcaption>
        </figure>
        <figure style="margin: 0;">
          <div [style]="frame">
            <andes-carousel aria-label="No controls" [dots]="false" [arrows]="false">${pictures()}</andes-carousel>
          </div>
          <figcaption>no dots, no arrows</figcaption>
        </figure>
      </div>`,
  }),
};

@Component({
  selector: 'andes-story-carousel-rtl',
  imports: [AndesCarousel, AndesCarouselSlide],
  template: `
    <div
      dir="rtl"
      style="max-width: 40rem; border-radius: 0.5rem; overflow: hidden;"
    >
      <andes-carousel
        aria-label="RTL"
        arrows="always"
        dotStyle="pill"
        dotPlacement="end"
      >
        @for (slide of slides; track slide.title) {
          <andes-carousel-slide
            ><img
              [src]="slide.src"
              alt=""
              style="display: block; width: 100%; height: 100%; object-fit: cover;"
              draggable="false"
          /></andes-carousel-slide>
        }
      </andes-carousel>
    </div>
  `,
})
class RtlDemo {
  protected readonly slides = SLIDES.slice(0, 4);
}

/**
 * Text and direction. The first carousel replaces every built-in string through `labels`
 * (Spanish here, including the "n of total" and "go to" functions); the second renders in
 * right-to-left text, where the arrows, the drag direction and the `end` dot rail all mirror.
 */
export const Localisation: Story = {
  decorators: [moduleMetadata({ imports: [RtlDemo] })],
  render: () => ({
    props: {
      slides: SLIDES.slice(0, 3),
      frame: FRAME,
      picture: PICTURE,
      labels: {
        carousel: 'Carrusel',
        slides: 'Diapositivas',
        slide: (n: number, total: number) => `${n} de ${total}`,
        previous: 'Diapositiva anterior',
        next: 'Diapositiva siguiente',
        goTo: (n: number) => `Ir a la diapositiva ${n}`,
        dots: 'Elegir diapositiva',
        pause: 'Pausar',
        play: 'Reproducir',
      },
    },
    template: `
      <div style="display: flex; flex-direction: column; gap: 2rem;">
        <div [style]="frame">
          <andes-carousel [labels]="labels" autoplay arrows="always">
            ${pictures()}
          </andes-carousel>
        </div>
        <andes-story-carousel-rtl />
      </div>`,
  }),
};
