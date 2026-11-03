import { readFileSync } from 'node:fs';

import {
  andesOverlayPreset,
  AndesOverlayContentPrimitive,
  AndesOverlayPrimitive,
  provideAndesOverlay,
} from '@andes-ng/primitives';
import { Directionality } from '@angular/cdk/bidi';
import {
  Component,
  inject,
  signal,
  type TemplateRef,
  viewChild,
} from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import type { AndesImageTransformEvent } from '../image/image-types';
import {
  declaredValue,
  expectLength,
  toPx,
} from '../../testing/computed-style';
import { AndesGallery } from './gallery';
import { AndesGalleryItem } from './gallery-item';
import type {
  AndesGalleryAction,
  AndesGalleryLabels,
  AndesGallerySource,
  AndesGalleryThumbnailPosition,
} from './gallery-types';

/**
 * jsdom reports zero geometry for every element, which makes CDK treat everything as
 * invisible and so unfocusable. A nominal size lets the focus handling run.
 */
function withElementGeometry() {
  const descriptors = (['offsetWidth', 'offsetHeight'] as const).map(
    (prop) =>
      [
        prop,
        Object.getOwnPropertyDescriptor(HTMLElement.prototype, prop),
      ] as const,
  );
  beforeAll(() => {
    for (const [prop] of descriptors) {
      Object.defineProperty(HTMLElement.prototype, prop, {
        configurable: true,
        get: () => 1,
      });
    }
  });
  afterAll(() => {
    for (const [prop, descriptor] of descriptors) {
      if (descriptor) {
        Object.defineProperty(HTMLElement.prototype, prop, descriptor);
      } else {
        delete (HTMLElement.prototype as unknown as Record<string, unknown>)[
          prop
        ];
      }
    }
  });
}

function withReducedMotion(reduce: boolean) {
  const original = window.matchMedia;
  beforeEach(() => {
    window.matchMedia = ((query: string) => ({
      matches: reduce && query.includes('reduce'),
      media: query,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    })) as unknown as typeof window.matchMedia;
  });
  afterEach(() => {
    window.matchMedia = original;
  });
}

const PHOTOS: readonly AndesGallerySource[] = [
  { src: '/one.jpg', thumbnail: '/one-small.jpg', alt: 'One', title: 'First' },
  { src: '/two.jpg', alt: 'Two' },
  '/three.jpg',
  { src: '/four.jpg', alt: 'Four', fallback: '/four-fallback.jpg' },
];

@Component({
  imports: [AndesGallery],
  template: `
    <button type="button" id="outside">Outside</button>
    <andes-gallery
      [images]="images()"
      [(activeIndex)]="index"
      [(fullscreen)]="fullscreen"
      [inline]="inline()"
      [thumbnails]="thumbnails()"
      [thumbnailPosition]="position()"
      [actions]="actions()"
      [loop]="loop()"
      [autoplay]="autoplay()"
      [autoplayInterval]="interval()"
      [counter]="counter()"
      [fallback]="fallback()"
      [labels]="labels()"
      (transformChange)="events.push($event)"
      (closed)="reasons.push($event)"
    />
  `,
})
class Host {
  readonly images = signal<readonly AndesGallerySource[] | null>(PHOTOS);
  readonly index = signal(0);
  readonly fullscreen = signal(false);
  readonly inline = signal(true);
  readonly thumbnails = signal<boolean | null>(null);
  readonly position = signal<AndesGalleryThumbnailPosition>('bottom');
  readonly actions = signal<readonly AndesGalleryAction[]>([
    'zoomOut',
    'zoomIn',
    'rotateLeft',
    'rotateRight',
    'flipX',
    'flipY',
    'reset',
    'download',
    'fullscreen',
  ]);
  readonly loop = signal(false);
  readonly autoplay = signal(false);
  readonly interval = signal(4000);
  readonly counter = signal(true);
  readonly fallback = signal<string | null>(null);
  readonly labels = signal<AndesGalleryLabels | null>(null);
  readonly events: AndesImageTransformEvent[] = [];
  readonly reasons: string[] = [];
}

function setup(configure?: (host: Host) => void) {
  const fixture = TestBed.createComponent(Host);
  configure?.(fixture.componentInstance);
  fixture.detectChanges();
  return fixture;
}

const q = <T extends HTMLElement = HTMLElement>(selector: string) =>
  document.querySelector<T>(selector);
const all = (selector: string) =>
  Array.from(document.querySelectorAll<HTMLElement>(selector));
const gallery = () => q('.andes-gallery') as HTMLElement;
const stage = () => q('.andes-gallery__stage') as HTMLElement;
const picture = () => q<HTMLImageElement>('img.andes-gallery__image');
/** The native `<button>` an `andes-button` renders: what a user clicks, focuses and hears. */
const native = (host: Element | null | undefined) =>
  host?.querySelector<HTMLButtonElement>(':scope > button') ?? null;
const hook = (action: string) =>
  q(`.andes-gallery__button[data-action="${action}"]`);
const button = (action: string) => native(hook(action));
const nav = (side: 'previous' | 'next') =>
  native(q(`.andes-gallery__nav--${side}`));
/** The `andes-button` hosts of the thumbnails, and the native buttons inside them. */
const thumbs = () => all('.andes-gallery__thumbnail');
const thumbButtons = () =>
  thumbs().map((thumb) => native(thumb) as HTMLButtonElement);
const counter = () =>
  q('.andes-gallery__counter')?.textContent?.replace(/\s+/g, ' ').trim();
const live = () => q('.andes-gallery__sr[role="status"]');

function key(name: string, target: Element = stage(), init = {}) {
  const event = new KeyboardEvent('keydown', {
    key: name,
    keyCode: name === 'Escape' ? 27 : 0,
    bubbles: true,
    cancelable: true,
    ...init,
  });
  target.dispatchEvent(event);
  return event;
}

function pointer(type: string, target: Element, x: number, y: number) {
  target.dispatchEvent(
    new PointerEvent(type, {
      pointerId: 1,
      pointerType: 'touch',
      clientX: x,
      clientY: y,
      bubbles: true,
      cancelable: true,
    }),
  );
}

describe('AndesGallery', () => {
  withElementGeometry();

  describe('inline', () => {
    it('renders a named region with the first picture, a counter and the caption', () => {
      setup();
      expect(gallery().getAttribute('role')).toBe('region');
      expect(gallery().getAttribute('aria-label')).toBe('Image gallery');
      expect(picture()?.getAttribute('src')).toBe('/one.jpg');
      expect(picture()?.getAttribute('alt')).toBe('One');
      expect(counter()).toBe('1 / 4');
      expect(q('.andes-gallery__caption')?.textContent?.trim()).toBe('First');
    });

    it('takes bare URLs', () => {
      const f = setup((h) => h.index.set(2));
      expect(picture()?.getAttribute('src')).toBe('/three.jpg');
      expect(picture()?.getAttribute('alt')).toBe('');
      f.componentInstance.images.set(['/a.jpg', '/b.jpg']);
      f.detectChanges();
      expect(counter()).toBe('2 / 2');
    });

    it('names the stage after the position and makes it a tab stop', () => {
      setup((h) => h.index.set(1));
      expect(stage().getAttribute('role')).toBe('group');
      expect(stage().getAttribute('aria-label')).toBe('Image 2 of 4');
      expect(stage().getAttribute('tabindex')).toBe('0');
    });

    it('clamps an out-of-range index', () => {
      setup((h) => h.index.set(99));
      expect(counter()).toBe('4 / 4');
    });
  });

  describe('content-projected items', () => {
    it('reads andes-gallery-item children when there are no images', () => {
      @Component({
        imports: [AndesGallery, AndesGalleryItem],
        template: `
          <andes-gallery>
            <andes-gallery-item
              src="/x.jpg"
              alt="X"
              title="Ex"
              thumbnail="/x-s.jpg"
            />
            @if (more()) {
              <andes-gallery-item src="/y.jpg" alt="Y" />
            }
          </andes-gallery>
        `,
      })
      class ItemsHost {
        readonly more = signal(true);
      }
      const f = TestBed.createComponent(ItemsHost);
      f.detectChanges();
      expect(counter()).toBe('1 / 2');
      expect(picture()?.getAttribute('alt')).toBe('X');
      expect(thumbs()[0].querySelector('img')?.getAttribute('src')).toBe(
        '/x-s.jpg',
      );
      // The items only carry data: nothing of them is rendered.
      expect(q('andes-gallery-item')).toBeNull();
      f.componentInstance.more.set(false);
      f.detectChanges();
      expect(q('.andes-gallery__strip')).toBeNull();
    });
  });

  describe('navigation', () => {
    it('steps with the round buttons and updates the model', () => {
      const f = setup();
      nav('next')?.click();
      f.detectChanges();
      expect(f.componentInstance.index()).toBe(1);
      expect(picture()?.getAttribute('src')).toBe('/two.jpg');
      nav('previous')?.click();
      f.detectChanges();
      expect(f.componentInstance.index()).toBe(0);
    });

    it('marks the ends aria-disabled and stops there, unless it loops', () => {
      const f = setup();
      const previous = nav('previous') as HTMLElement;
      expect(previous.getAttribute('aria-disabled')).toBe('true');
      previous.click();
      f.detectChanges();
      expect(f.componentInstance.index()).toBe(0);
      f.componentInstance.loop.set(true);
      f.detectChanges();
      expect(previous.getAttribute('aria-disabled')).toBeNull();
      previous.click();
      f.detectChanges();
      expect(f.componentInstance.index()).toBe(3);
    });

    it('steps with the arrow keys, PageUp / PageDown, Home and End', () => {
      const f = setup();
      expect(key('ArrowRight').defaultPrevented).toBe(true);
      f.detectChanges();
      expect(f.componentInstance.index()).toBe(1);
      key('PageDown');
      f.detectChanges();
      expect(f.componentInstance.index()).toBe(2);
      key('Home');
      f.detectChanges();
      expect(f.componentInstance.index()).toBe(0);
      key('End');
      f.detectChanges();
      expect(f.componentInstance.index()).toBe(3);
      key('ArrowLeft');
      key('PageUp');
      f.detectChanges();
      expect(f.componentInstance.index()).toBe(1);
    });

    it('mirrors the arrow keys in right-to-left', () => {
      TestBed.overrideProvider(Directionality, {
        useValue: { value: 'rtl', change: of('rtl') },
      });
      const f = setup();
      key('ArrowLeft');
      f.detectChanges();
      expect(f.componentInstance.index()).toBe(1);
    });

    it('leaves keys typed into a field alone', () => {
      const f = setup();
      const input = document.createElement('input');
      gallery().append(input);
      expect(key('ArrowRight', input).defaultPrevented).toBe(false);
      f.detectChanges();
      expect(f.componentInstance.index()).toBe(0);
    });

    it('swipes a fitted picture to change image', () => {
      const f = setup();
      pointer('pointerdown', stage(), 300, 100);
      pointer('pointermove', stage(), 150, 100);
      pointer('pointerup', stage(), 150, 100);
      f.detectChanges();
      expect(f.componentInstance.index()).toBe(1);
    });

    it('announces the position and description politely', () => {
      const f = setup();
      expect(live()?.getAttribute('aria-live')).toBe('polite');
      expect(live()?.textContent?.trim()).toBe('Image 1 of 4: First');
      key('ArrowRight');
      f.detectChanges();
      expect(live()?.textContent?.trim()).toBe('Image 2 of 4: Two');
    });
  });

  describe('toolbar', () => {
    it('is a labelled group of named buttons with the zoom ratio after zoom out', () => {
      setup();
      const toolbar = q('.andes-gallery__toolbar') as HTMLElement;
      expect(toolbar.getAttribute('role')).toBe('group');
      expect(toolbar.getAttribute('aria-label')).toBe('Image tools');
      expect(
        all('.andes-gallery__button').map((b) =>
          native(b)?.getAttribute('aria-label'),
        ),
      ).toEqual([
        'Zoom out',
        'Zoom in',
        'Rotate left',
        'Rotate right',
        'Flip horizontally',
        'Flip vertically',
        'Reset',
        'Download',
        'Full screen',
      ]);
      const ratio = q('[data-slot="gallery-ratio"]') as HTMLElement;
      expect(ratio.previousElementSibling?.getAttribute('data-action')).toBe(
        'zoomOut',
      );
      expect(ratio.textContent?.replace(/\s+/g, ' ').trim()).toBe('Zoom 100%');
    });

    it('shows only the requested actions, and none at all', () => {
      const f = setup((h) => h.actions.set(['rotateRight', 'zoomIn']));
      expect(
        all('.andes-gallery__button').map((b) => b.dataset['action']),
      ).toEqual(['rotateRight', 'zoomIn']);
      expect(
        q('[data-slot="gallery-ratio"]')?.nextElementSibling?.getAttribute(
          'data-action',
        ),
      ).toBe('zoomIn');
      f.componentInstance.actions.set([]);
      f.detectChanges();
      expect(q('.andes-gallery__toolbar')).toBeNull();
    });

    it('zooms, rotates, flips and resets, reporting each change', () => {
      const f = setup();
      button('zoomIn')?.click();
      button('rotateRight')?.click();
      button('flipY')?.click();
      f.detectChanges();
      expect(picture()?.style.transform).toBe(
        'translate3d(0px, 0px, 0) scale3d(1.5, -1.5, 1) rotate(90deg)',
      );
      expect(q('[data-slot="gallery-ratio"]')?.textContent).toContain('150%');
      expect(f.componentInstance.events.map((e) => e.action)).toEqual([
        'zoomIn',
        'rotateRight',
        'flipY',
      ]);
      button('reset')?.click();
      f.detectChanges();
      expect(picture()?.style.transform).toBe(
        'translate3d(0px, 0px, 0) scale3d(1, 1, 1) rotate(0deg)',
      );
    });

    it('disables zoom out and reset at rest, keeping them focusable', () => {
      setup();
      expect(button('zoomOut')?.getAttribute('aria-disabled')).toBe('true');
      expect(button('reset')?.getAttribute('aria-disabled')).toBe('true');
      expect(button('zoomOut')?.hasAttribute('disabled')).toBe(false);
      expect(button('zoomIn')?.getAttribute('aria-disabled')).toBeNull();
    });

    it('zooms with + and -, and resets with 0', () => {
      const f = setup();
      key('+');
      f.detectChanges();
      expect(picture()?.style.transform).toContain('scale3d(1.5, 1.5, 1)');
      key('0');
      f.detectChanges();
      expect(picture()?.style.transform).toContain('scale3d(1, 1, 1)');
    });

    it('resets the transform when the picture changes', () => {
      const f = setup();
      button('rotateLeft')?.click();
      f.detectChanges();
      key('ArrowRight');
      f.detectChanges();
      expect(picture()?.style.transform).toContain('rotate(0deg)');
    });

    it('zooms with the wheel and on double click', () => {
      const f = setup();
      const wheel = new WheelEvent('wheel', {
        deltaY: -200,
        bubbles: true,
        cancelable: true,
      });
      stage().dispatchEvent(wheel);
      f.detectChanges();
      expect(wheel.defaultPrevented).toBe(true);
      expect(picture()?.style.transform).toContain('scale3d(1.5, 1.5, 1)');
      picture()?.dispatchEvent(
        new MouseEvent('dblclick', { bubbles: true, cancelable: true }),
      );
      f.detectChanges();
      expect(picture()?.style.transform).toContain('scale3d(1, 1, 1)');
      expect(f.componentInstance.events.at(-1)?.action).toBe('doubleClick');
    });

    it('pans a zoomed picture with the arrow keys instead of stepping', () => {
      const f = setup();
      button('zoomIn')?.click();
      f.detectChanges();
      key('ArrowRight');
      f.detectChanges();
      expect(f.componentInstance.index()).toBe(0);
      expect(f.componentInstance.events.at(-1)?.action).toBe('keyboard');
    });

    it('downloads the shown picture through a named link', async () => {
      const clicked: string[] = [];
      const click = vi
        .spyOn(HTMLAnchorElement.prototype, 'click')
        .mockImplementation(function (this: HTMLAnchorElement) {
          clicked.push(this.download);
        });
      const fetchSpy = vi
        .spyOn(globalThis, 'fetch')
        .mockRejectedValue(new Error('offline'));
      const f = setup((h) => h.index.set(1));
      button('download')?.click();
      await new Promise((resolve) => setTimeout(resolve));
      f.detectChanges();
      expect(clicked).toEqual(['two.jpg']);
      expect(f.componentInstance.events.at(-1)?.action).toBe('download');
      click.mockRestore();
      fetchSpy.mockRestore();
    });
  });

  describe('thumbnail strip', () => {
    it('is a labelled group of thumbnails, the active one marked current', () => {
      setup((h) => h.index.set(1));
      const strip = q('.andes-gallery__strip') as HTMLElement;
      expect(strip.getAttribute('role')).toBe('group');
      expect(strip.getAttribute('aria-label')).toBe('Thumbnails');
      expect(thumbs()).toHaveLength(4);
      expect(thumbButtons().map((t) => t.getAttribute('aria-current'))).toEqual(
        [null, 'true', null, null],
      );
      expect(thumbButtons()[0].getAttribute('aria-label')).toBe(
        'Image 1 of 4: First',
      );
      // The small source when there is one, the full one otherwise.
      expect(thumbs()[0].querySelector('img')?.getAttribute('src')).toBe(
        '/one-small.jpg',
      );
      expect(thumbs()[2].querySelector('img')?.getAttribute('src')).toBe(
        '/three.jpg',
      );
    });

    it('is one tab stop: only the active thumbnail is tabbable', () => {
      setup((h) => h.index.set(2));
      expect(thumbButtons().map((t) => t.getAttribute('tabindex'))).toEqual([
        '-1',
        '-1',
        '0',
        '-1',
      ]);
    });

    it('shows a picture on click', () => {
      const f = setup();
      thumbButtons()[3].click();
      f.detectChanges();
      expect(f.componentInstance.index()).toBe(3);
    });

    it('moves focus and the picture with the arrow keys, Home and End', async () => {
      const f = setup();
      thumbButtons()[0].focus();
      const event = key('ArrowRight', thumbButtons()[0]);
      expect(event.defaultPrevented).toBe(true);
      f.detectChanges();
      await f.whenStable();
      expect(f.componentInstance.index()).toBe(1);
      expect(document.activeElement).toBe(thumbButtons()[1]);
      key('End', thumbButtons()[1]);
      f.detectChanges();
      await f.whenStable();
      expect(f.componentInstance.index()).toBe(3);
      expect(document.activeElement).toBe(thumbButtons()[3]);
      key('Home', thumbButtons()[3]);
      f.detectChanges();
      expect(f.componentInstance.index()).toBe(0);
    });

    it('walks a vertical strip with up and down', () => {
      const f = setup((h) => h.position.set('end'));
      expect(gallery().dataset['position']).toBe('end');
      expect(q('.andes-gallery__strip')?.getAttribute('aria-orientation')).toBe(
        'vertical',
      );
      key('ArrowDown', thumbButtons()[0]);
      f.detectChanges();
      expect(f.componentInstance.index()).toBe(1);
      key('ArrowRight', thumbButtons()[1]);
      f.detectChanges();
      // Right is the stage's key in a vertical strip: it steps the picture.
      expect(f.componentInstance.index()).toBe(2);
    });

    it('scrolls the active thumbnail into view inside the strip', async () => {
      const scrolls: ScrollToOptions[] = [];
      const original = HTMLElement.prototype.scrollBy;
      HTMLElement.prototype.scrollBy = function (options?: unknown) {
        scrolls.push(options as ScrollToOptions);
      } as typeof HTMLElement.prototype.scrollBy;
      const f = setup();
      const strip = q('.andes-gallery__strip') as HTMLElement;
      strip.getBoundingClientRect = () => new DOMRect(0, 0, 200, 60);
      thumbs().forEach((thumb, i) => {
        thumb.getBoundingClientRect = () => new DOMRect(i * 120, 0, 100, 60);
      });
      f.componentInstance.index.set(3);
      f.detectChanges();
      await f.whenStable();
      HTMLElement.prototype.scrollBy = original;
      // Thumbnail 4 spans 360-460 in a 200px strip: centred, it moves by 310px.
      expect(scrolls.at(-1)).toEqual({ left: 310, behavior: 'smooth' });
    });

    it('can be hidden', () => {
      setup((h) => h.thumbnails.set(false));
      expect(q('.andes-gallery__strip')).toBeNull();
    });

    it('draws a thumbnail with the library image, which shows its own error state', () => {
      const f = setup();
      const image = thumbs()[1].querySelector('andes-image') as HTMLElement;
      expect(image).not.toBeNull();
      expect(image.dataset['state']).toBe('loading');
      thumbs()[1].querySelector('img')?.dispatchEvent(new Event('error'));
      f.detectChanges();
      expect(image.dataset['state']).toBe('error');
      expect(
        image.querySelector('ng-icon[name="lucideImageOff"]'),
      ).not.toBeNull();
    });

    it('opens no preview from a thumbnail', () => {
      setup();
      expect(thumbs()[0].querySelector('.andes-image__mask')).toBeNull();
    });
  });

  describe('single picture', () => {
    it('hides previous / next, the strip and the counter', () => {
      setup((h) => h.images.set(['/only.jpg']));
      expect(gallery().hasAttribute('data-single')).toBe(true);
      expect(q('.andes-gallery__nav')).toBeNull();
      expect(q('.andes-gallery__strip')).toBeNull();
      expect(q('.andes-gallery__counter')).toBeNull();
      expect(live()?.textContent?.trim()).toBe('');
    });
  });

  describe('loading and failure', () => {
    it('shows a spinner until the picture loads', () => {
      const f = setup();
      expect(q('[data-slot="gallery-loading"]')).not.toBeNull();
      picture()?.dispatchEvent(new Event('load'));
      f.detectChanges();
      expect(q('[data-slot="gallery-loading"]')).toBeNull();
    });

    it('tries the picture fallback, then the gallery fallback, then shows an error', () => {
      const f = setup((h) => h.index.set(3));
      picture()?.dispatchEvent(new Event('error'));
      f.detectChanges();
      expect(picture()?.getAttribute('src')).toBe('/four-fallback.jpg');
      picture()?.dispatchEvent(new Event('error'));
      f.detectChanges();
      expect(q('[data-slot="gallery-error"]')?.textContent?.trim()).toBe(
        'The image could not be loaded',
      );

      f.componentInstance.fallback.set('/everyone.jpg');
      f.componentInstance.index.set(1);
      f.detectChanges();
      picture()?.dispatchEvent(new Event('error'));
      f.detectChanges();
      expect(picture()?.getAttribute('src')).toBe('/everyone.jpg');
    });

    it('loads the neighbours ahead', () => {
      const created: string[] = [];
      const original = document.createElement.bind(document);
      const spy = vi
        .spyOn(document, 'createElement')
        .mockImplementation(
          (name: string, options?: ElementCreationOptions) => {
            const element = original(name, options);
            if (name === 'img') {
              const image = element as HTMLImageElement;
              const descriptor = Object.getOwnPropertyDescriptor(
                HTMLImageElement.prototype,
                'src',
              );
              Object.defineProperty(image, 'src', {
                set: (value: string) => {
                  created.push(value);
                  descriptor?.set?.call(image, value);
                },
                get: () => descriptor?.get?.call(image),
              });
            }
            return element;
          },
        );
      const f = setup((h) => h.index.set(1));
      expect(created).toEqual(
        expect.arrayContaining(['/three.jpg', '/one.jpg']),
      );
      f.componentInstance.index.set(2);
      f.detectChanges();
      expect(created).toContain('/four.jpg');
      spy.mockRestore();
    });
  });

  describe('lightbox', () => {
    it('opens a named modal dialog with a close button from the fullscreen button', () => {
      const f = setup();
      button('fullscreen')?.click();
      f.detectChanges();
      expect(f.componentInstance.fullscreen()).toBe(true);
      const dialog = q('.andes-gallery-lightbox') as HTMLElement;
      expect(dialog.getAttribute('role')).toBe('dialog');
      expect(dialog.getAttribute('aria-modal')).toBe('true');
      expect(dialog.getAttribute('aria-label')).toBe('Image gallery');
      expect(
        dialog.querySelector('.andes-gallery')?.getAttribute('role'),
      ).toBeNull();
      expect(
        native(q('[data-slot="gallery-close"]'))?.getAttribute('aria-label'),
      ).toBe('Close');
      // The page keeps the gallery's place with an empty box.
      expect(
        f.nativeElement.querySelector('.andes-gallery--placeholder'),
      ).not.toBeNull();
      expect(button('fullscreen')?.getAttribute('aria-label')).toBe(
        'Exit full screen',
      );
      expect(button('fullscreen')?.getAttribute('aria-pressed')).toBe('true');
    });

    it('closes on Escape, the close button and a click beside the picture', () => {
      const f = setup((h) => h.fullscreen.set(true));
      key('Escape');
      f.detectChanges();
      expect(q('.andes-gallery-lightbox')).toBeNull();
      expect(f.componentInstance.fullscreen()).toBe(false);

      f.componentInstance.fullscreen.set(true);
      f.detectChanges();
      native(q('[data-slot="gallery-close"]'))?.click();
      f.detectChanges();
      expect(q('.andes-gallery-lightbox')).toBeNull();

      f.componentInstance.fullscreen.set(true);
      f.detectChanges();
      stage().click();
      f.detectChanges();
      expect(q('.andes-gallery-lightbox')).toBeNull();
      expect(f.componentInstance.reasons).toEqual([
        'escape-key',
        'close-button',
        'backdrop-click',
      ]);
    });

    it('traps focus on the stage and gives it back to the opener', async () => {
      const f = setup((h) => h.inline.set(false));
      expect(f.nativeElement.querySelector('.andes-gallery')).toBeNull();
      const opener = q<HTMLButtonElement>('#outside') as HTMLButtonElement;
      opener.focus();
      f.componentInstance.fullscreen.set(true);
      f.detectChanges();
      await f.whenStable();
      expect(document.activeElement).toBe(stage());
      expect(button('fullscreen')).toBeNull();
      key('Escape');
      f.detectChanges();
      expect(document.activeElement).toBe(opener);
    });

    it('returns focus to the inline fullscreen button it was opened from', async () => {
      const f = setup();
      button('fullscreen')?.focus();
      button('fullscreen')?.click();
      f.detectChanges();
      await f.whenStable();
      key('Escape');
      f.detectChanges();
      await f.whenStable();
      expect(document.activeElement).toBe(button('fullscreen'));
    });

    it('opens on a given picture and keeps the index in sync', () => {
      const f = setup((h) => h.inline.set(false));
      const instance = f.debugElement.children[1]
        .componentInstance as AndesGallery;
      instance.open(2);
      f.detectChanges();
      expect(f.componentInstance.index()).toBe(2);
      expect(counter()).toBe('3 / 4');
    });

    it('makes the page behind inert', () => {
      const f = setup((h) => h.fullscreen.set(true));
      expect(f.nativeElement.closest('[inert]')).toBeTruthy();
    });
  });

  describe('autoplay', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    function advance(f: ComponentFixture<Host>, ms: number) {
      vi.advanceTimersByTime(ms);
      f.detectChanges();
    }

    it('advances on the interval and wraps at the end', () => {
      const f = setup((h) => {
        h.autoplay.set(true);
        h.interval.set(2000);
        h.index.set(3);
      });
      advance(f, 1999);
      expect(f.componentInstance.index()).toBe(3);
      advance(f, 1);
      expect(f.componentInstance.index()).toBe(0);
      advance(f, 2000);
      expect(f.componentInstance.index()).toBe(1);
    });

    it('silences the live region while it runs', () => {
      setup((h) => h.autoplay.set(true));
      expect(live()?.getAttribute('aria-live')).toBe('off');
    });

    it('waits while hovered or focused', () => {
      const f = setup((h) => h.autoplay.set(true));
      gallery().dispatchEvent(new MouseEvent('mouseenter'));
      advance(f, 10000);
      expect(f.componentInstance.index()).toBe(0);
      gallery().dispatchEvent(new MouseEvent('mouseleave'));
      gallery().dispatchEvent(new FocusEvent('focusin'));
      f.detectChanges();
      advance(f, 10000);
      expect(f.componentInstance.index()).toBe(0);
      gallery().dispatchEvent(new FocusEvent('focusout'));
      f.detectChanges();
      advance(f, 4000);
      expect(f.componentInstance.index()).toBe(1);
    });

    it('stops for good once the user acts, and the play button resumes it', () => {
      const f = setup((h) => h.autoplay.set(true));
      const play = button('play') as HTMLButtonElement;
      expect(play.getAttribute('aria-label')).toBe('Pause slideshow');
      button('zoomIn')?.click();
      f.detectChanges();
      advance(f, 10000);
      expect(f.componentInstance.index()).toBe(0);
      expect(play.getAttribute('aria-label')).toBe('Start slideshow');
      play.click();
      f.detectChanges();
      advance(f, 4000);
      expect(f.componentInstance.index()).toBe(1);
    });

    describe('with reduced motion', () => {
      withReducedMotion(true);

      it('starts paused', () => {
        const f = setup((h) => h.autoplay.set(true));
        advance(f, 10000);
        expect(f.componentInstance.index()).toBe(0);
        expect(button('play')?.getAttribute('aria-label')).toBe(
          'Start slideshow',
        );
      });
    });
  });

  describe('templates', () => {
    @Component({
      imports: [AndesGallery],
      template: `
        <ng-template
          #picture
          let-image
          let-index="index"
          let-transform="transform"
        >
          <figure id="custom-picture">
            {{ image.alt }} {{ index }} {{ transform.rotate }}
          </figure>
        </ng-template>
        <ng-template #thumb let-image let-active="active">
          <span class="custom-thumb"
            >{{ image.alt }}{{ active ? '*' : '' }}</span
          >
        </ng-template>
        <ng-template #caption let-image let-total="total">
          <span id="custom-caption">{{ image.alt }} of {{ total }}</span>
        </ng-template>
        <ng-template #header let-actions="actions" let-index="index">
          <button type="button" id="header-next" (click)="actions.next()">
            Header {{ index }}
          </button>
        </ng-template>
        <ng-template #footer let-image>
          <p id="custom-footer">{{ image.src }}</p>
        </ng-template>
        <andes-gallery
          [images]="images"
          [imageTemplate]="picture"
          [thumbnailTemplate]="thumb"
          [captionTemplate]="caption"
          [headerTemplate]="header"
          [footerTemplate]="footer"
        />
      `,
    })
    class TemplateHost {
      images = PHOTOS;
    }

    it('renders every template with its context', () => {
      const f = TestBed.createComponent(TemplateHost);
      f.detectChanges();
      expect(q('#custom-picture')?.textContent?.trim()).toBe('One 0 0');
      expect(q('img.andes-gallery__image')).toBeNull();
      expect(q('[data-slot="gallery-loading"]')).toBeNull();
      expect(all('.custom-thumb').map((t) => t.textContent)).toEqual([
        'One*',
        'Two',
        '',
        'Four',
      ]);
      expect(q('#custom-caption')?.textContent).toBe('One of 4');
      expect(q('#custom-footer')?.textContent).toBe('/one.jpg');
      q<HTMLButtonElement>('#header-next')?.click();
      f.detectChanges();
      expect(q('#header-next')?.textContent?.trim()).toBe('Header 1');
      button('rotateRight')?.click();
      f.detectChanges();
      expect(q('#custom-picture')?.textContent?.trim()).toBe('Two 1 90');
      expect(
        (q('[data-slot="gallery-image"]') as HTMLElement).style.transform,
      ).toContain('rotate(90deg)');
    });
  });

  describe('localisation', () => {
    it('takes every label', () => {
      setup((h) =>
        h.labels.set({
          gallery: 'Galería',
          previous: 'Anterior',
          next: 'Siguiente',
          thumbnails: 'Miniaturas',
          zoomIn: 'Acercar',
          fullscreen: 'Pantalla completa',
          position: (current, total) => `Imagen ${current} de ${total}`,
        }),
      );
      expect(gallery().getAttribute('aria-label')).toBe('Galería');
      expect(nav('previous')?.getAttribute('aria-label')).toBe('Anterior');
      expect(q('.andes-gallery__strip')?.getAttribute('aria-label')).toBe(
        'Miniaturas',
      );
      expect(button('zoomIn')?.getAttribute('aria-label')).toBe('Acercar');
      expect(button('fullscreen')?.getAttribute('aria-label')).toBe(
        'Pantalla completa',
      );
      expect(stage().getAttribute('aria-label')).toBe('Imagen 1 de 4');
      // Unset labels keep their English default.
      expect(button('zoomOut')?.getAttribute('aria-label')).toBe('Zoom out');
    });
  });

  describe('motion', () => {
    describe('with motion', () => {
      withReducedMotion(false);

      it('cross-fades from the previous picture', () => {
        const f = setup();
        key('ArrowRight');
        f.detectChanges();
        const leaving = q<HTMLImageElement>('.andes-gallery__leaving');
        expect(leaving?.getAttribute('src')).toBe('/one.jpg');
        expect(leaving?.getAttribute('aria-hidden')).toBe('true');
        expect(picture()?.classList).toContain(
          'andes-gallery__image--entering',
        );
        leaving?.dispatchEvent(new Event('animationend'));
        f.detectChanges();
        expect(q('.andes-gallery__leaving')).toBeNull();
      });

      it('grows the lightbox out of the element that opened it', () => {
        const f = setup((h) => h.inline.set(false));
        const opener = q('#outside') as HTMLElement;
        opener.getBoundingClientRect = () => new DOMRect(40, 60, 100, 40);
        opener.focus();
        f.componentInstance.fullscreen.set(true);
        f.detectChanges();
        expect(
          (q('.andes-gallery-lightbox') as HTMLElement).style.getPropertyValue(
            '--andes-gallery-origin',
          ),
        ).toBe('90px 80px');
      });
    });

    describe('with reduced motion', () => {
      withReducedMotion(true);

      it('swaps pictures without a cross-fade', () => {
        const f = setup();
        key('ArrowRight');
        f.detectChanges();
        expect(q('.andes-gallery__leaving')).toBeNull();
      });
    });
  });

  describe('the library components', () => {
    it('draws every control as an andes-button holding the native button', () => {
      setup((h) => h.autoplay.set(true));
      const controls = all(
        '.andes-gallery__button, .andes-gallery__nav, .andes-gallery__thumbnail',
      );
      expect(controls.length).toBeGreaterThan(10);
      for (const control of controls) {
        expect(control.tagName).toBe('ANDES-BUTTON');
        expect(native(control)?.dataset['slot']).toBe('button');
      }
      // No bare native button anywhere in the gallery: each sits inside an andes-button.
      for (const bare of all('.andes-gallery button')) {
        expect(bare.parentElement?.tagName).toBe('ANDES-BUTTON');
      }
      expect(button('play')?.getAttribute('type')).toBe('button');
    });

    it('draws every thumbnail with andes-image, with no preview of its own', () => {
      setup();
      for (const thumb of thumbs()) {
        const image = thumb.querySelector('andes-image') as HTMLElement;
        expect(image).not.toBeNull();
        expect(image.hasAttribute('data-preview')).toBe(false);
        expect(image.querySelector('[data-slot="image-img"]')).not.toBeNull();
      }
      expect(
        all('.andes-gallery__strip img:not(.andes-image__img)'),
      ).toHaveLength(0);
    });

    it('keeps the stage picture a native image for the transform engine', () => {
      setup();
      expect(picture()?.closest('andes-image')).toBeNull();
      expect(picture()?.style.transform).toContain('scale3d');
    });

    it('keeps names, tooltips and hooks on the andes-button host', () => {
      setup();
      expect(hook('zoomIn')?.getAttribute('title')).toBe('Zoom in');
      expect(native(hook('zoomIn'))?.getAttribute('aria-label')).toBe(
        'Zoom in',
      );
      // The host is not a second control: the name lives on the native button alone.
      expect(hook('zoomIn')?.hasAttribute('aria-label')).toBe(false);
      expect(
        native(q('[data-slot="gallery-next"]'))?.getAttribute(
          'aria-keyshortcuts',
        ),
      ).toBe('ArrowRight PageDown');
      expect(nav('previous')?.getAttribute('aria-keyshortcuts')).toBe(
        'ArrowLeft PageUp',
      );
    });

    describe('a control at its limit', () => {
      it('stays in the tab order and announced, but ignores the click', () => {
        const f = setup();
        const zoomOut = button('zoomOut') as HTMLButtonElement;
        expect(zoomOut.getAttribute('aria-disabled')).toBe('true');
        expect(zoomOut.hasAttribute('disabled')).toBe(false);
        expect(zoomOut.hasAttribute('tabindex')).toBe(false);
        expect(zoomOut.tabIndex).toBe(0);
        zoomOut.focus();
        expect(document.activeElement).toBe(zoomOut);
        zoomOut.click();
        f.detectChanges();
        expect(f.componentInstance.events).toEqual([]);
        expect(picture()?.style.transform).toContain('scale3d(1, 1, 1)');
      });

      it('takes the disabled look of the button, and no hover', () => {
        setup();
        // `data-disabled` is what the button's own disabled and hover rules read.
        expect(button('zoomOut')?.hasAttribute('data-disabled')).toBe(true);
        expect(button('zoomIn')?.hasAttribute('data-disabled')).toBe(false);
        expect(getComputedStyle(button('zoomOut') as Element).cursor).toBe(
          'not-allowed',
        );
      });

      it('wakes up when the limit is left, and sleeps again when it is reached', () => {
        const f = setup();
        button('zoomIn')?.click();
        f.detectChanges();
        expect(button('zoomOut')?.getAttribute('aria-disabled')).toBeNull();
        expect(button('zoomOut')?.hasAttribute('data-disabled')).toBe(false);
        expect(button('reset')?.getAttribute('aria-disabled')).toBeNull();
        button('zoomOut')?.click();
        f.detectChanges();
        expect(button('zoomOut')?.getAttribute('aria-disabled')).toBe('true');
        expect(button('reset')?.getAttribute('aria-disabled')).toBe('true');
      });

      it('keeps the focused control focused while it goes to its limit', async () => {
        const f = setup();
        button('zoomIn')?.click();
        f.detectChanges();
        const zoomOut = button('zoomOut') as HTMLButtonElement;
        zoomOut.focus();
        zoomOut.click();
        f.detectChanges();
        await f.whenStable();
        expect(zoomOut.getAttribute('aria-disabled')).toBe('true');
        expect(document.activeElement).toBe(zoomOut);
      });

      it('lets previous / next at the ends keep the focus without stepping', () => {
        const f = setup();
        const previous = nav('previous') as HTMLButtonElement;
        previous.focus();
        expect(document.activeElement).toBe(previous);
        expect(previous.hasAttribute('data-disabled')).toBe(true);
        previous.click();
        f.detectChanges();
        expect(f.componentInstance.index()).toBe(0);
        f.componentInstance.index.set(3);
        f.detectChanges();
        expect(previous.hasAttribute('data-disabled')).toBe(false);
        expect(nav('next')?.getAttribute('aria-disabled')).toBe('true');
      });
    });

    describe('the thumbnails', () => {
      it('move the current marker and the tab stop with the picture, leaving no stale one', () => {
        const f = setup();
        f.componentInstance.index.set(2);
        f.detectChanges();
        expect(
          thumbButtons().map((t) => t.getAttribute('aria-current')),
        ).toEqual([null, null, 'true', null]);
        expect(thumbButtons().map((t) => t.tabIndex)).toEqual([-1, -1, 0, -1]);
        f.componentInstance.index.set(0);
        f.detectChanges();
        expect(
          thumbButtons().map((t) => t.getAttribute('aria-current')),
        ).toEqual(['true', null, null, null]);
        expect(thumbButtons().map((t) => t.tabIndex)).toEqual([0, -1, -1, -1]);
      });

      it('are reached by Tab as a single stop and walked with the arrows', async () => {
        const f = setup((h) => h.index.set(1));
        expect(thumbButtons().filter((t) => t.tabIndex >= 0)).toHaveLength(1);
        thumbButtons()[1].focus();
        key('ArrowRight', thumbButtons()[1]);
        f.detectChanges();
        await f.whenStable();
        expect(document.activeElement).toBe(thumbButtons()[2]);
        expect(thumbButtons()[2].getAttribute('aria-current')).toBe('true');
      });

      it('are picked with Enter and Space on the native button', () => {
        const f = setup();
        const target = thumbButtons()[2];
        // A native button turns Enter and Space into a click; the gallery listens to that.
        target.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        f.detectChanges();
        expect(f.componentInstance.index()).toBe(2);
      });
    });

    it('marks the full screen button pressed on its native button', () => {
      const f = setup();
      expect(button('fullscreen')?.getAttribute('aria-pressed')).toBe('false');
      f.componentInstance.fullscreen.set(true);
      f.detectChanges();
      expect(button('fullscreen')?.getAttribute('aria-pressed')).toBe('true');
    });
  });

  describe('stylesheet', () => {
    const css = readFileSync('packages/ui/src/lib/gallery/gallery.css', 'utf8');

    it('fits a phone: one counter line, the toolbar on one row of smaller buttons, nearly opaque lightbox', () => {
      const narrow = css.slice(css.indexOf('@container andes-gallery'));
      expect(css).toMatch(
        /\.andes-gallery \{\s*container: andes-gallery \/ inline-size/,
      );
      expect(narrow).toMatch(
        /\.andes-gallery__counter\s*\{[^}]*white-space: nowrap/,
      );
      expect(narrow).toMatch(
        /\.andes-gallery__toolbar\s*\{[^}]*flex: 1 1 100%;[^}]*order: 2;[^}]*justify-content: center/,
      );
      expect(narrow).toMatch(/\.andes-gallery__ratio\s*\{\s*display: none/);
      expect(narrow).toMatch(
        /\.andes-gallery__header\s*\{\s*--andes-gallery-button-size: 2rem/,
      );
      expect(narrow).toMatch(
        /@media \(max-width: 32rem\)\s*\{\s*\.andes-gallery--lightbox\s*\{[^}]*96%/,
      );
    });

    it('lays the strip out on every side, mirroring start and end with the direction', () => {
      expect(css).toMatch(
        /\[data-position='top'\]\s*\{[^}]*grid-template-areas: 'header' 'strip' 'stage' 'footer'/,
      );
      expect(css).toMatch(
        /\[data-position='start'\]\s*\{[^}]*grid-template-areas: 'header header' 'strip stage' 'footer footer'/,
      );
      expect(css).toMatch(
        /\[data-position='end'\]\s*\{[^}]*grid-template-areas: 'header header' 'stage strip' 'footer footer'/,
      );
    });

    it('draws light controls on a fixed dark surface', () => {
      expect(css).toMatch(
        /--andes-gallery-surface: var\(--andes-color-ghost-foreground, #111827\)/,
      );
      expect(css).toMatch(
        /--andes-gallery-color-strong: var\(--andes-color-ghost, #fff\)/,
      );
      expect(css).toMatch(
        /\.andes-gallery__nav\s*\{[^}]*inset-block-start: 50%/,
      );
    });

    it('rings the active thumbnail in the ring colour with a glow, and dims the others', () => {
      expect(
        declaredValue(
          css,
          '.andes-gallery__thumbnail[data-active]::after',
          'box-shadow',
        ),
      ).toBe('inset 0 0 0 2px var(--andes-gallery-ring)');
      expect(
        declaredValue(
          css,
          '.andes-gallery__thumbnail[data-active]',
          'box-shadow',
        ),
      ).toContain('var(--andes-gallery-glow');
      expect(declaredValue(css, '.andes-gallery__thumbnail', 'opacity')).toBe(
        '0.55',
      );
      expect(
        declaredValue(css, '.andes-gallery__thumbnail[data-active]', 'opacity'),
      ).toBe('1');
    });

    it('takes the page theme inline and keeps the dark surface for the lightbox', () => {
      const inline = css.match(
        /\.andes-gallery:not\(\.andes-gallery--lightbox\)\s*\{[^}]*\}/,
      )?.[0];
      expect(inline).toMatch(
        /--andes-gallery-surface: var\(\s*--andes-color-card/,
      );
      expect(inline).toContain(
        '--andes-gallery-color-strong: var(--andes-color-foreground',
      );
      expect(inline).toContain(
        '--andes-gallery-ring: var(--andes-color-primary',
      );
      expect(css).toMatch(
        /\.andes-gallery,\s*\.andes-gallery-lightbox\s*\{[^}]*--andes-gallery-surface: var\(--andes-color-ghost-foreground/,
      );
    });

    describe('the inline look', () => {
      const inlineBlock = css.match(
        /\.andes-gallery:not\(\.andes-gallery--lightbox\)\s*\{[^}]*\}/,
      )?.[0] as string;

      it('has no outline: the edge is the elevation token, with a radius token', () => {
        const shadow = declaredValue(css, '.andes-gallery', 'box-shadow');
        expect(shadow).toContain('--andes-shadow-md');
        expect(shadow).not.toContain('inset');
        expect(declaredValue(css, '.andes-gallery', 'border')).toBeUndefined();
        expect(declaredValue(css, '.andes-gallery', 'border-radius')).toContain(
          'var(--andes-radius-xl',
        );
        // The forced-colours border is the one exception: shadows do not draw there.
        const forced = css.slice(css.indexOf('@media (forced-colors: active)'));
        expect(forced).toMatch(
          /\.andes-gallery\s*\{\s*border: 1px solid CanvasText/,
        );
      });

      it('rests the picture on a faint wash of the primary colour, not on the muted grey', () => {
        expect(inlineBlock).toMatch(
          /--andes-gallery-stage: color-mix\(\s*in srgb,\s*var\(--andes-color-primary, #2563eb\) 5%,\s*var\(--andes-gallery-surface\)/,
        );
        expect(css).not.toContain('--andes-color-muted,');
        expect(css).not.toContain('--andes-gallery-edge');
        expect(declaredValue(css, '.andes-gallery__stage', 'background')).toBe(
          'var(--andes-gallery-stage, transparent)',
        );
      });

      it('draws icons in the foreground and turns them primary on hover and focus', () => {
        expect(inlineBlock).toContain(
          '--andes-gallery-icon: var(--andes-color-foreground',
        );
        expect(inlineBlock).toContain(
          '--andes-gallery-accent: var(--andes-color-primary-text',
        );
        const hover =
          '.andes-gallery .andes-gallery__button > .andes-button.andes-button:hover:not([data-disabled])';
        expect(declaredValue(css, hover, 'color')).toBe(
          'var(--andes-gallery-accent)',
        );
        expect(
          declaredValue(
            css,
            '.andes-gallery .andes-gallery__button > .andes-button.andes-button:focus-visible',
            'color',
          ),
        ).toBe('var(--andes-gallery-accent)');
        expect(
          declaredValue(
            css,
            '.andes-gallery .andes-gallery__button > .andes-button.andes-button',
            'color',
          ),
        ).toBe('var(--andes-gallery-icon)');
      });

      it('makes previous / next surface discs with a soft shadow that turn primary-tinted', () => {
        expect(inlineBlock).toContain(
          '--andes-gallery-nav-background: var(--andes-gallery-surface)',
        );
        expect(inlineBlock).toMatch(
          /--andes-gallery-nav-background-hover: color-mix\(\s*in srgb,\s*var\(--andes-color-primary, #2563eb\) 12%/,
        );
        expect(inlineBlock).toContain('--andes-shadow-md');
        expect(
          declaredValue(
            css,
            '.andes-gallery .andes-gallery__nav > .andes-button.andes-button',
            'box-shadow',
          ),
        ).toBe('var(--andes-gallery-nav-shadow)');
      });

      it('sets the caption as a blurred surface pill and the counter as a small pill', () => {
        expect(inlineBlock).toMatch(
          /--andes-gallery-caption-background: color-mix\(\s*in srgb,\s*var\(--andes-gallery-surface\) 90%/,
        );
        expect(inlineBlock).toContain(
          '--andes-gallery-caption-radius: var(--andes-radius-full',
        );
        expect(
          declaredValue(
            css,
            '.andes-gallery:not(.andes-gallery--lightbox) .andes-gallery__caption',
            'backdrop-filter',
          ),
        ).toBe('blur(8px)');
        expect(
          declaredValue(
            css,
            '.andes-gallery:not(.andes-gallery--lightbox) .andes-gallery__counter',
            'border-radius',
          ),
        ).toBe('var(--andes-radius-full, 9999px)');
      });

      it('separates the header, stage and strip by spacing, with no divider line', () => {
        expect(css).not.toMatch(
          /border-(top|bottom|block|block-start|block-end)(-width|-style)?\s*:/,
        );
        expect(css).not.toMatch(/<hr|divider/);
        expect(inlineBlock).toContain(
          '--andes-gallery-stage-inset: var(--andes-space-3',
        );
        expect(
          declaredValue(css, '.andes-gallery__stage', 'margin-inline'),
        ).toBe('var(--andes-gallery-stage-inset)');
      });

      it('keeps the lightbox on its dark scrim with light controls and no inset stage', () => {
        const base = css.match(
          /\.andes-gallery,\s*\.andes-gallery-lightbox\s*\{[^}]*\}/,
        )?.[0] as string;
        expect(base).toContain('--andes-gallery-stage-inset: 0px');
        expect(base).toContain(
          '--andes-gallery-icon: var(--andes-gallery-color)',
        );
        expect(base).toContain('--andes-gallery-nav-shadow: none');
        expect(base).not.toContain('--andes-gallery-stage:');
        expect(
          declaredValue(css, '.andes-gallery--lightbox', 'box-shadow'),
        ).toBe('none');
      });

      it('dims the inactive thumbnails and lights the active one in the strip', () => {
        const f = setup((h) => h.index.set(1));
        expect(thumbs().map((t) => t.hasAttribute('data-active'))).toEqual([
          false,
          true,
          false,
          false,
        ]);
        expect(getComputedStyle(thumbs()[0]).opacity).toBe('0.55');
        expect(getComputedStyle(thumbs()[1]).opacity).toBe('1');
        f.componentInstance.index.set(3);
        f.detectChanges();
        expect(getComputedStyle(thumbs()[1]).opacity).toBe('0.55');
        expect(getComputedStyle(thumbs()[3]).opacity).toBe('1');
      });
    });

    it('moves on the reference curve and drops motion when asked', () => {
      expect(css).toMatch(
        /--andes-gallery-ease: cubic-bezier\(0\.78, 0\.14, 0\.15, 0\.86\)/,
      );
      expect(css).toMatch(
        /\.andes-gallery-lightbox\s*\{[^}]*transform-origin: var\(--andes-gallery-origin, 50% 50%\)/,
      );
      const reduced = css.slice(
        css.indexOf('@media (prefers-reduced-motion: reduce)'),
      );
      expect(reduced).toMatch(
        /\.andes-gallery__leaving,[\s\S]*animation: none/,
      );
      expect(reduced).toMatch(
        /\.andes-gallery__thumbnail,[^{]*\.andes-gallery__nav > \.andes-button\.andes-button\s*\{\s*transition: none/,
      );
    });

    it('outlines the controls in forced colours', () => {
      const forced = css.slice(css.indexOf('@media (forced-colors: active)'));
      expect(forced).toMatch(/border: 1px solid ButtonText/);
      expect(forced).toMatch(/Highlight/);
      expect(forced).toContain('[data-active]::after');
      expect(forced).toContain('[data-disabled]');
    });

    it('keeps the counter in reading order in right-to-left', () => {
      expect(css).toMatch(
        /\.andes-gallery__counter\s*\{[^}]*direction: ltr;\s*unicode-bidi: isolate/,
      );
    });

    it('keeps no hard-coded colour outside a token fallback', () => {
      const withoutFallbacks = css.replace(
        /var\([^()]*(?:\([^()]*\)[^()]*)*\)/g,
        'var()',
      );
      expect(withoutFallbacks).not.toMatch(/#[0-9a-f]{3,8}\b|rgb\(/i);
    });

    it('sizes the inline host from its container with a usable minimum', () => {
      expect(declaredValue(css, '.andes-gallery-host', 'height')).toBe('100%');
      expect(
        toPx(declaredValue(css, '.andes-gallery-host', 'min-height') as string),
      ).toBe(352);
      expect(
        toPx(
          declaredValue(
            css,
            '.andes-gallery',
            '--andes-gallery-thumbnail-width',
          ) as string,
        ),
      ).toBe(72);
    });

    it('gives the zoom ratio a stable width so the toolbar does not jump', () => {
      setup();
      const ratio = q('[data-slot="gallery-ratio"]') as HTMLElement;
      expectLength(getComputedStyle(ratio).minWidth, '3rem');
    });
  });
});

@Component({
  imports: [AndesGallery, AndesOverlayContentPrimitive],
  providers: [provideAndesOverlay()],
  template: `
    <ng-template #panel>
      <div andesOverlayContent aria-label="Album" data-test="dialog">
        <andes-gallery [images]="images" [(fullscreen)]="fullscreen" />
      </div>
    </ng-template>
  `,
})
class DialogHost {
  readonly overlay = inject(AndesOverlayPrimitive);
  readonly panel = viewChild.required<TemplateRef<unknown>>('panel');
  readonly images = PHOTOS;
  readonly fullscreen = signal(false);
  constructor() {
    this.overlay.configure(andesOverlayPreset('dialog'));
  }
}

describe('AndesGallery inside a modal dialog', () => {
  withElementGeometry();

  it('works inline in the dialog and closes only its lightbox on Escape', async () => {
    const f = TestBed.createComponent(DialogHost);
    f.detectChanges();
    f.componentInstance.overlay.open(f.componentInstance.panel());
    f.detectChanges();
    expect(q('[data-test="dialog"] .andes-gallery')).not.toBeNull();
    button('fullscreen')?.focus();
    button('fullscreen')?.click();
    f.detectChanges();
    await f.whenStable();
    expect(document.activeElement).toBe(stage());
    key('Escape', document.activeElement as Element);
    f.detectChanges();
    await f.whenStable();
    expect(q('.andes-gallery-lightbox')).toBeNull();
    expect(f.componentInstance.overlay.isOpen()).toBe(true);
    expect(q('[data-test="dialog"]')).not.toBeNull();
  });
});
