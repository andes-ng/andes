import { readFileSync } from 'node:fs';

import { Component, signal } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';

import { AndesCarouselScroller } from './carousel-scroller';
import { AndesCarouselScrollerItem } from './carousel-scroller-item';
import { stepOffset, type AndesScrollerBox } from './carousel-scroller-math';
import type {
  AndesCarouselArrowSize,
  AndesCarouselLabels,
  AndesCarouselReducedMotion,
  AndesCarouselScrollerPaging,
} from './carousel-types';

@Component({
  imports: [AndesCarouselScroller, AndesCarouselScrollerItem],
  template: `
    <div [attr.dir]="dir()">
      <andes-carousel-scroller
        [aria-label]="ariaLabel()"
        [snap]="snap()"
        [paging]="paging()"
        [loop]="loop()"
        [fadeEdges]="fadeEdges()"
        [arrows]="arrows()"
        [arrowSize]="arrowSize()"
        [gap]="gap()"
        [itemWidth]="itemWidth()"
        [reducedMotion]="reducedMotion()"
        [labels]="labels()"
      >
        @for (n of items(); track n) {
          <andes-carousel-scroller-item [label]="n === 1 ? 'First' : null">
            <button type="button" class="in-item" [attr.data-n]="n">
              Item {{ n }}
            </button>
          </andes-carousel-scroller-item>
        }
      </andes-carousel-scroller>
    </div>
  `,
})
class Host {
  readonly dir = signal<'ltr' | 'rtl'>('ltr');
  readonly ariaLabel = signal<string | null>('Browse features');
  readonly snap = signal(true);
  readonly paging = signal<AndesCarouselScrollerPaging>('none');
  readonly loop = signal(false);
  readonly fadeEdges = signal(true);
  readonly arrows = signal(true);
  readonly arrowSize = signal<AndesCarouselArrowSize>('md');
  readonly gap = signal<number | string | null>(null);
  readonly itemWidth = signal<number | string | null>(null);
  readonly reducedMotion = signal<AndesCarouselReducedMotion>('system');
  readonly labels = signal<AndesCarouselLabels | null>(null);
  readonly items = signal([1, 2, 3, 4, 5, 6]);
}

interface Layout {
  readonly calls: { left: number; behavior: string }[];
  /** Current scroll offset, always >= 0 whatever the direction. */
  offset(): number;
  /** Moves the content as a user scrolling would: sets the offset and fires `scroll`. */
  scrollBy(offset: number): void;
  readonly max: number;
}

const ITEM = 100;
const GAP = 10;
const VIEW = 250;

/**
 * jsdom has no layout, so the geometry is faked: `count` items of `ITEM` px, `GAP` px apart,
 * in a `view` px wide scroll container, positioned from the faked scroll offset the way a
 * browser reports them (left to right, or mirrored when `rtl`).
 */
function mockLayout(
  f: ComponentFixture<Host>,
  { count = 6, view = VIEW, rtl = false } = {},
): Layout {
  const el = viewport(f);
  const content = count * ITEM + (count - 1) * GAP;
  let signed = 0;
  const calls: Layout['calls'] = [];
  const setSigned = (value: number) => {
    const max = content - view;
    const offset = Math.min(Math.max(Math.abs(value), 0), max);
    signed = rtl ? -offset : offset;
  };
  Object.defineProperty(el, 'clientWidth', { configurable: true, value: view });
  Object.defineProperty(el, 'scrollWidth', {
    configurable: true,
    value: content,
  });
  Object.defineProperty(el, 'scrollLeft', {
    configurable: true,
    get: () => signed,
    set: (value: number) => setSigned(value),
  });
  el.getBoundingClientRect = () =>
    ({
      left: 0,
      right: view,
      top: 0,
      bottom: 40,
      width: view,
      height: 40,
    }) as DOMRect;
  el.scrollTo = ((options: ScrollToOptions) => {
    calls.push({
      left: options.left ?? 0,
      behavior: String(options.behavior),
    });
    setSigned(options.left ?? 0);
    el.dispatchEvent(new Event('scroll'));
  }) as typeof el.scrollTo;
  items(f).forEach((item, i) => {
    item.getBoundingClientRect = () => {
      const start = i * (ITEM + GAP) - Math.abs(signed);
      const left = rtl ? view - start - ITEM : start;
      return {
        left,
        right: left + ITEM,
        top: 0,
        bottom: 40,
        width: ITEM,
        height: 40,
      } as DOMRect;
    };
  });
  el.dispatchEvent(new Event('scroll'));
  f.detectChanges();
  return {
    calls,
    offset: () => Math.abs(signed),
    scrollBy(offset: number) {
      setSigned(offset);
      el.dispatchEvent(new Event('scroll'));
      f.detectChanges();
    },
    max: content - view,
  };
}

function setup(configure?: (host: Host) => void) {
  const fixture = TestBed.createComponent(Host);
  configure?.(fixture.componentInstance);
  fixture.detectChanges();
  return fixture;
}

const root = (f: ComponentFixture<Host>) =>
  f.nativeElement.querySelector('andes-carousel-scroller') as HTMLElement;
const items = (f: ComponentFixture<Host>) =>
  Array.from(
    f.nativeElement.querySelectorAll('andes-carousel-scroller-item'),
  ) as HTMLElement[];
const viewport = (f: ComponentFixture<Host>) =>
  f.nativeElement.querySelector(
    '[data-slot="carousel-scroller-viewport"]',
  ) as HTMLElement;
const previous = (f: ComponentFixture<Host>) =>
  f.nativeElement.querySelector(
    '[data-slot="carousel-scroller-previous"]',
  ) as HTMLButtonElement | null;
const next = (f: ComponentFixture<Host>) =>
  f.nativeElement.querySelector(
    '[data-slot="carousel-scroller-next"]',
  ) as HTMLButtonElement | null;

function keydown(target: Element, key: string, init: KeyboardEventInit = {}) {
  const event = new KeyboardEvent('keydown', {
    key,
    bubbles: true,
    cancelable: true,
    ...init,
  });
  target.dispatchEvent(event);
  return event;
}

function wheel(target: Element, init: WheelEventInit, time = 0) {
  const event = new WheelEvent('wheel', {
    bubbles: true,
    cancelable: true,
    ...init,
  });
  Object.defineProperty(event, 'timeStamp', { value: time });
  target.dispatchEvent(event);
  return event;
}

function pointer(
  target: Element,
  type: string,
  x: number,
  y: number,
  time: number,
  pointerType = 'touch',
) {
  const event = new PointerEvent(type, {
    pointerId: 1,
    pointerType,
    button: 0,
    clientX: x,
    clientY: y,
    bubbles: true,
    cancelable: true,
  });
  Object.defineProperty(event, 'timeStamp', { value: time });
  target.dispatchEvent(event);
}

/** A finger that presses at `from`, moves to `to` over `ms` and lifts. */
function swipe(target: Element, from: number, to: number, ms = 100) {
  pointer(target, 'pointerdown', from, 20, 0);
  pointer(target, 'pointermove', (from + to) / 2, 20, ms / 2);
  pointer(target, 'pointermove', to, 20, ms);
  pointer(target, 'pointerup', to, 20, ms);
}

describe('AndesCarouselScroller', () => {
  describe('semantics', () => {
    it('is a labelled carousel region', () => {
      const f = setup();
      expect(root(f).getAttribute('role')).toBe('region');
      expect(root(f).getAttribute('aria-roledescription')).toBe('carousel');
      expect(root(f).getAttribute('aria-label')).toBe('Browse features');
    });

    it('falls back to a default name and says so in development', () => {
      const warn = vi
        .spyOn(console, 'warn')
        .mockImplementation(() => undefined);
      const f = setup((h) => h.ariaLabel.set(null));
      f.detectChanges();
      expect(root(f).getAttribute('aria-label')).toBe('Carousel');
      expect(
        warn.mock.calls.some((call) =>
          String(call[0]).includes('accessible name'),
        ),
      ).toBe(true);
      warn.mockRestore();
    });

    it('stays quiet when the region is named', () => {
      const warn = vi
        .spyOn(console, 'warn')
        .mockImplementation(() => undefined);
      const f = setup();
      f.detectChanges();
      expect(warn).not.toHaveBeenCalled();
      warn.mockRestore();
    });

    it('announces each item as a "slide, n of m" group, with its own label appended', () => {
      const f = setup();
      expect(items(f).map((i) => i.getAttribute('role'))).toEqual(
        Array(6).fill('group'),
      );
      expect(items(f)[0].getAttribute('aria-roledescription')).toBe('slide');
      expect(items(f).map((i) => i.getAttribute('aria-label'))).toEqual([
        '1 of 6: First',
        '2 of 6',
        '3 of 6',
        '4 of 6',
        '5 of 6',
        '6 of 6',
      ]);
    });

    it('keeps every item in the accessibility tree and the tab order', () => {
      const f = setup();
      for (const item of items(f)) {
        expect(item.hasAttribute('inert')).toBe(false);
        expect(item.hasAttribute('aria-hidden')).toBe(false);
      }
    });

    it('names the scroll container and has no live region', () => {
      const f = setup();
      expect(viewport(f).getAttribute('role')).toBe('group');
      expect(viewport(f).getAttribute('aria-label')).toBe('Slides');
      expect(viewport(f).hasAttribute('aria-live')).toBe(false);
    });

    it('localises every string', () => {
      const f = setup((h) =>
        h.labels.set({
          slides: 'Diapositivas',
          slide: (n, t) => `${n} de ${t}`,
          previous: 'Anterior',
          next: 'Siguiente',
        }),
      );
      mockLayout(f);
      expect(viewport(f).getAttribute('aria-label')).toBe('Diapositivas');
      expect(items(f)[1].getAttribute('aria-label')).toBe('2 de 6');
      expect(next(f)?.getAttribute('aria-label')).toBe('Siguiente');
      expect(previous(f)).toBeNull();
    });
  });

  describe('tab stop', () => {
    it('is a tab stop only while the items overflow', () => {
      const f = setup();
      expect(viewport(f).getAttribute('tabindex')).toBe('-1');
      expect(root(f).hasAttribute('data-overflowing')).toBe(false);

      mockLayout(f);
      expect(viewport(f).getAttribute('tabindex')).toBe('0');
      expect(root(f).hasAttribute('data-overflowing')).toBe(true);
    });

    it('leaves the tab order again when everything fits', () => {
      const f = setup();
      mockLayout(f, { view: 1000 });
      expect(viewport(f).getAttribute('tabindex')).toBe('-1');
      expect(previous(f)).toBeNull();
      expect(next(f)).toBeNull();
    });

    it('can still take programmatic focus while it is not a tab stop', () => {
      const f = setup();
      document.body.appendChild(f.nativeElement);
      viewport(f).focus();
      expect(document.activeElement).toBe(viewport(f));
      f.nativeElement.remove();
    });
  });

  describe('buttons', () => {
    it('show only for the directions the content can still move', () => {
      const f = setup();
      const layout = mockLayout(f);
      expect(previous(f)).toBeNull();
      expect(next(f)).not.toBeNull();

      layout.scrollBy(120);
      expect(previous(f)).not.toBeNull();
      expect(next(f)).not.toBeNull();

      layout.scrollBy(layout.max);
      expect(previous(f)).not.toBeNull();
      expect(next(f)).toBeNull();
    });

    it('can be switched off', () => {
      const f = setup((h) => h.arrows.set(false));
      mockLayout(f);
      expect(previous(f)).toBeNull();
      expect(next(f)).toBeNull();
    });

    it('draw lucide chevrons through ng-icon, hidden from assistive technology', () => {
      const f = setup();
      const layout = mockLayout(f);
      layout.scrollBy(120);
      for (const [button, name] of [
        [previous(f), 'lucideChevronLeft'],
        [next(f), 'lucideChevronRight'],
      ] as const) {
        const icon = button?.querySelector('ng-icon');
        expect(icon?.getAttribute('name')).toBe(name);
        expect(icon?.getAttribute('aria-hidden')).toBe('true');
        expect(icon?.querySelector('svg')).not.toBeNull();
      }
    });

    it('move by one item with snapping to the start edge', () => {
      const f = setup();
      const layout = mockLayout(f);
      next(f)?.click();
      expect(layout.calls.at(-1)).toEqual({ left: 110, behavior: 'smooth' });
      f.detectChanges();

      next(f)?.click();
      expect(layout.calls.at(-1)?.left).toBe(220);
      previous(f)?.click();
      expect(layout.calls.at(-1)?.left).toBe(110);
    });

    it('end on the last position the content allows', () => {
      const f = setup();
      const layout = mockLayout(f);
      layout.scrollBy(layout.max - 20);
      next(f)?.click();
      expect(layout.calls.at(-1)?.left).toBe(layout.max);
    });

    it('move by a whole view with paging "view"', () => {
      const f = setup((h) => h.paging.set('view'));
      const layout = mockLayout(f);
      next(f)?.click();
      // Items 0 and 1 are fully in view, item 2 is cut off: it starts the next view.
      expect(layout.calls.at(-1)?.left).toBe(220);
      f.detectChanges();
      previous(f)?.click();
      expect(layout.calls.at(-1)?.left).toBe(0);
    });

    it('move instantly under reduced motion', () => {
      const f = setup((h) => h.reducedMotion.set('reduce'));
      const layout = mockLayout(f);
      expect(root(f).hasAttribute('data-reduced')).toBe(true);
      next(f)?.click();
      expect(layout.calls.at(-1)).toEqual({ left: 110, behavior: 'auto' });
    });

    it('hand focus to the scroll container when the pressed button goes away', () => {
      const f = setup();
      document.body.appendChild(f.nativeElement);
      const layout = mockLayout(f);
      layout.scrollBy(layout.max - 20);
      next(f)?.focus();
      expect(document.activeElement).toBe(next(f));

      next(f)?.click();
      f.detectChanges();
      expect(next(f)).toBeNull();
      f.detectChanges();
      expect(document.activeElement).toBe(viewport(f));
      f.nativeElement.remove();
    });

    it('size with arrowSize', () => {
      const f = setup((h) => h.arrowSize.set('lg'));
      expect(root(f).getAttribute('data-arrow-size')).toBe('lg');
    });
  });

  describe('looping', () => {
    it('keeps the next button at the end and wraps to the first item', () => {
      const f = setup((h) => h.loop.set(true));
      const layout = mockLayout(f);
      layout.scrollBy(layout.max);
      expect(next(f)).not.toBeNull();
      next(f)?.click();
      expect(layout.calls.at(-1)?.left).toBe(0);
    });

    it('keeps the previous button at the start and wraps to the last item', () => {
      const f = setup((h) => h.loop.set(true));
      const layout = mockLayout(f);
      expect(previous(f)).not.toBeNull();
      previous(f)?.click();
      expect(layout.calls.at(-1)?.left).toBe(layout.max);
    });

    it('does not wrap without loop', () => {
      const f = setup();
      const layout = mockLayout(f);
      layout.scrollBy(layout.max);
      expect(next(f)).toBeNull();
      expect(f.componentInstance.items().length).toBe(6);
    });

    it('shows no button while everything fits, even when looping', () => {
      const f = setup((h) => h.loop.set(true));
      mockLayout(f, { view: 1000 });
      expect(previous(f)).toBeNull();
      expect(next(f)).toBeNull();
    });
  });

  describe('fading edges', () => {
    it('are on by default and only mark the edges with more content', () => {
      const f = setup();
      const layout = mockLayout(f);
      expect(root(f).hasAttribute('data-fade')).toBe(true);
      expect(root(f).hasAttribute('data-can-start')).toBe(false);
      expect(root(f).hasAttribute('data-can-end')).toBe(true);

      layout.scrollBy(120);
      expect(root(f).hasAttribute('data-can-start')).toBe(true);
      expect(root(f).hasAttribute('data-can-end')).toBe(true);

      layout.scrollBy(layout.max);
      expect(root(f).hasAttribute('data-can-start')).toBe(true);
      expect(root(f).hasAttribute('data-can-end')).toBe(false);
    });

    it('can be switched off', () => {
      const f = setup((h) => h.fadeEdges.set(false));
      mockLayout(f);
      expect(root(f).hasAttribute('data-fade')).toBe(false);
    });
  });

  describe('snapping', () => {
    it('is on by default and told to every item', () => {
      const f = setup();
      expect(root(f).hasAttribute('data-snap')).toBe(true);
      expect(items(f).every((i) => i.hasAttribute('data-snap'))).toBe(true);
    });

    it('can be switched off', () => {
      const f = setup((h) => h.snap.set(false));
      expect(root(f).hasAttribute('data-snap')).toBe(false);
      expect(items(f).some((i) => i.hasAttribute('data-snap'))).toBe(false);
    });

    it('stops at every item with paging "item"', () => {
      const f = setup((h) => h.paging.set('item'));
      expect(items(f)[0].getAttribute('data-paging')).toBe('item');
      expect(root(f).getAttribute('data-paging')).toBe('item');
    });
  });

  describe('layout', () => {
    it('publishes the gap and the item width as custom properties', () => {
      const f = setup((h) => {
        h.gap.set(24);
        h.itemWidth.set('15rem');
      });
      expect(root(f).style.getPropertyValue('--andes-carousel-gap')).toBe(
        '24px',
      );
      expect(
        root(f).style.getPropertyValue('--andes-carousel-item-width'),
      ).toBe('15rem');
    });

    it('leaves them to CSS when not given', () => {
      const f = setup();
      expect(root(f).style.getPropertyValue('--andes-carousel-gap')).toBe('');
      expect(
        root(f).style.getPropertyValue('--andes-carousel-item-width'),
      ).toBe('');
    });
  });

  describe('keyboard', () => {
    it('steps by item with the arrow keys while snapping', () => {
      const f = setup();
      const layout = mockLayout(f);
      expect(keydown(viewport(f), 'ArrowRight').defaultPrevented).toBe(true);
      expect(layout.calls.at(-1)?.left).toBe(110);
      f.detectChanges();
      keydown(viewport(f), 'ArrowRight');
      expect(layout.calls.at(-1)?.left).toBe(220);
      keydown(viewport(f), 'ArrowLeft');
      expect(layout.calls.at(-1)?.left).toBe(110);
    });

    it('goes to the first and last item with Home and End', () => {
      const f = setup();
      const layout = mockLayout(f);
      expect(keydown(viewport(f), 'End').defaultPrevented).toBe(true);
      expect(layout.calls.at(-1)?.left).toBe(layout.max);
      keydown(viewport(f), 'Home');
      expect(layout.calls.at(-1)?.left).toBe(0);
    });

    it('swaps the arrows in right-to-left', () => {
      const f = setup((h) => h.dir.set('rtl'));
      const layout = mockLayout(f, { rtl: true });
      keydown(viewport(f), 'ArrowLeft');
      // Scroll offsets are negative in right-to-left; the step is the same distance.
      expect(layout.calls.at(-1)?.left).toBe(-110);
      expect(layout.offset()).toBe(110);
    });

    it('lets the browser pan when snapping is off', () => {
      const f = setup((h) => h.snap.set(false));
      const layout = mockLayout(f);
      expect(keydown(viewport(f), 'ArrowRight').defaultPrevented).toBe(false);
      expect(layout.calls).toEqual([]);
    });

    it('leaves the arrows to the controls inside an item', () => {
      const f = setup();
      const layout = mockLayout(f);
      const inner = f.nativeElement.querySelector('.in-item') as HTMLElement;
      expect(keydown(inner, 'ArrowRight').defaultPrevented).toBe(false);
      expect(layout.calls).toEqual([]);
    });

    it('does nothing while everything fits', () => {
      const f = setup();
      const layout = mockLayout(f, { view: 1000 });
      expect(keydown(viewport(f), 'ArrowRight').defaultPrevented).toBe(false);
      expect(layout.calls).toEqual([]);
    });

    it('ignores keys with modifiers', () => {
      const f = setup();
      const layout = mockLayout(f);
      expect(
        keydown(viewport(f), 'ArrowRight', { altKey: true }).defaultPrevented,
      ).toBe(false);
      expect(layout.calls).toEqual([]);
    });
  });

  describe('right-to-left', () => {
    it('measures items from the right and steps the same distance', () => {
      const f = setup((h) => h.dir.set('rtl'));
      const layout = mockLayout(f, { rtl: true });
      expect(previous(f)).toBeNull();
      next(f)?.click();
      expect(layout.calls.at(-1)?.left).toBe(-110);
      f.detectChanges();
      expect(previous(f)).not.toBeNull();
      previous(f)?.click();
      expect(layout.calls.at(-1)?.left).toBe(-0);
    });
  });

  describe('trackpad and wheel', () => {
    it('leaves every wheel to the browser without paging', () => {
      const f = setup();
      const layout = mockLayout(f);
      expect(wheel(viewport(f), { deltaX: 40 }).defaultPrevented).toBe(false);
      expect(
        wheel(viewport(f), { deltaY: 40, shiftKey: true }).defaultPrevented,
      ).toBe(false);
      expect(layout.calls).toEqual([]);
    });

    it('keeps the native vertical wheel with paging', () => {
      const f = setup((h) => h.paging.set('item'));
      const layout = mockLayout(f);
      expect(wheel(viewport(f), { deltaY: 100 }).defaultPrevented).toBe(false);
      expect(layout.calls).toEqual([]);
    });

    it('moves one item per horizontal swipe with paging "item"', () => {
      const f = setup((h) => h.paging.set('item'));
      const layout = mockLayout(f);
      expect(wheel(viewport(f), { deltaX: 30 }, 1000).defaultPrevented).toBe(
        true,
      );
      expect(layout.calls).toEqual([{ left: 110, behavior: 'smooth' }]);
    });

    it('moves one view per horizontal swipe with paging "view"', () => {
      const f = setup((h) => h.paging.set('view'));
      const layout = mockLayout(f);
      wheel(viewport(f), { deltaX: 30 }, 1000);
      expect(layout.calls).toEqual([{ left: 220, behavior: 'smooth' }]);
    });

    it('moves once for the whole swipe, inertia included', () => {
      const f = setup((h) => h.paging.set('item'));
      const layout = mockLayout(f);
      for (let step = 0; step < 8; step++) {
        wheel(viewport(f), { deltaX: 30 - step * 3 }, 1000 + step * 40);
      }
      expect(layout.calls.length).toBe(1);
    });

    it('moves again for a new swipe after a quiet moment', () => {
      const f = setup((h) => h.paging.set('item'));
      const layout = mockLayout(f);
      wheel(viewport(f), { deltaX: 30 }, 1000);
      wheel(viewport(f), { deltaX: 30 }, 2000);
      expect(layout.calls.length).toBe(2);
      expect(layout.calls[1].left).toBe(220);
    });

    it('moves backwards for a swipe the other way', () => {
      const f = setup((h) => h.paging.set('item'));
      const layout = mockLayout(f);
      layout.scrollBy(220);
      wheel(viewport(f), { deltaX: -30 }, 1000);
      expect(layout.calls.at(-1)?.left).toBe(110);
    });

    it('moves through the items with Shift plus the wheel', () => {
      const f = setup((h) => h.paging.set('item'));
      const layout = mockLayout(f);
      expect(
        wheel(viewport(f), { deltaY: 100, shiftKey: true }, 1000)
          .defaultPrevented,
      ).toBe(true);
      expect(layout.calls.at(-1)?.left).toBe(110);
    });

    it('gives the swipe back to the page when the content cannot move that way', () => {
      const f = setup((h) => h.paging.set('item'));
      const layout = mockLayout(f);
      expect(wheel(viewport(f), { deltaX: -30 }, 1000).defaultPrevented).toBe(
        false,
      );
      expect(layout.calls).toEqual([]);
    });

    it('follows the reading direction in right-to-left', () => {
      const f = setup((h) => {
        h.paging.set('item');
        h.dir.set('rtl');
      });
      const layout = mockLayout(f, { rtl: true });
      // Scrolling to the left shows what lies beyond the left edge: the next items.
      wheel(viewport(f), { deltaX: -30 }, 1000);
      expect(layout.calls.at(-1)?.left).toBe(-110);
    });
  });

  describe('touch paging', () => {
    it('moves one item for a flick with paging "item"', () => {
      const f = setup((h) => h.paging.set('item'));
      const layout = mockLayout(f);
      swipe(viewport(f), 200, 120, 60);
      expect(layout.calls.at(-1)).toEqual({ left: 110, behavior: 'smooth' });
    });

    it('moves one view for a flick with paging "view"', () => {
      const f = setup((h) => h.paging.set('view'));
      const layout = mockLayout(f);
      swipe(viewport(f), 200, 120, 60);
      expect(layout.calls.at(-1)?.left).toBe(220);
    });

    it('moves back for a flick the other way', () => {
      const f = setup((h) => h.paging.set('item'));
      const layout = mockLayout(f);
      layout.scrollBy(220);
      swipe(viewport(f), 100, 180, 60);
      expect(layout.calls.at(-1)?.left).toBe(110);
    });

    it('follows the finger while dragging and returns to rest on a short, slow drag', () => {
      const f = setup((h) => h.paging.set('item'));
      const layout = mockLayout(f);
      const el = viewport(f);
      pointer(el, 'pointerdown', 200, 20, 0);
      pointer(el, 'pointermove', 190, 20, 500);
      pointer(el, 'pointermove', 170, 20, 1000);
      expect(layout.offset()).toBe(30);
      f.detectChanges();
      expect(root(f).hasAttribute('data-dragging')).toBe(true);
      expect(el.style.scrollSnapType).toBe('none');

      pointer(el, 'pointerup', 170, 20, 1000);
      f.detectChanges();
      expect(root(f).hasAttribute('data-dragging')).toBe(false);
      expect(el.style.scrollSnapType).toBe('');
      expect(layout.calls.at(-1)?.left).toBe(0);
    });

    it('moves a long slow drag by one item from where it began', () => {
      const f = setup((h) => h.paging.set('item'));
      const layout = mockLayout(f);
      const el = viewport(f);
      pointer(el, 'pointerdown', 220, 20, 0);
      pointer(el, 'pointermove', 140, 20, 1500);
      pointer(el, 'pointerup', 140, 20, 3000);
      expect(layout.calls.at(-1)?.left).toBe(110);
    });

    it('ignores a mouse press so the mouse keeps its native behaviour', () => {
      const f = setup((h) => h.paging.set('item'));
      const layout = mockLayout(f);
      pointer(viewport(f), 'pointerdown', 200, 20, 0, 'mouse');
      pointer(viewport(f), 'pointermove', 100, 20, 50, 'mouse');
      pointer(viewport(f), 'pointerup', 100, 20, 60, 'mouse');
      expect(layout.calls).toEqual([]);
      expect(root(f).hasAttribute('data-dragging')).toBe(false);
    });

    it('leaves touch scrolling to the browser without paging', () => {
      const f = setup();
      const layout = mockLayout(f);
      swipe(viewport(f), 200, 100, 60);
      expect(layout.calls).toEqual([]);
    });

    it('lets a mostly vertical gesture scroll the page', () => {
      const f = setup((h) => h.paging.set('item'));
      const layout = mockLayout(f);
      const el = viewport(f);
      pointer(el, 'pointerdown', 200, 20, 0);
      pointer(el, 'pointermove', 190, 100, 30);
      pointer(el, 'pointerup', 190, 100, 40);
      expect(layout.calls).toEqual([]);
      expect(root(f).hasAttribute('data-dragging')).toBe(false);
    });

    it('swallows the click that ends a drag', () => {
      const f = setup((h) => h.paging.set('item'));
      mockLayout(f);
      const clicked = vi.fn();
      const inner = f.nativeElement.querySelector('.in-item') as HTMLElement;
      inner.addEventListener('click', clicked);
      swipe(viewport(f), 200, 120, 60);
      inner.click();
      expect(clicked).not.toHaveBeenCalled();
    });

    it('is mirrored in right-to-left', () => {
      const f = setup((h) => {
        h.paging.set('item');
        h.dir.set('rtl');
      });
      const layout = mockLayout(f, { rtl: true });
      // In right-to-left the next item lies beyond the left edge, so a flick to the right
      // brings it in and a flick to the left goes back.
      swipe(viewport(f), 120, 200, 60);
      expect(layout.calls.at(-1)?.left).toBe(-110);
      swipe(viewport(f), 200, 120, 60);
      expect(layout.calls.at(-1)?.left).toBe(-0);
    });
  });

  describe('public API', () => {
    it('scrolls to an item and steps through next and prev', () => {
      const f = setup();
      const layout = mockLayout(f);
      const scroller = f.debugElement.children[0].children[0]
        .componentInstance as AndesCarouselScroller;
      scroller.scrollToItem(3);
      expect(layout.calls.at(-1)).toEqual({ left: 330, behavior: 'smooth' });
      scroller.scrollToItem(2, false);
      expect(layout.calls.at(-1)).toEqual({ left: 220, behavior: 'auto' });
      f.detectChanges();
      scroller.next();
      expect(layout.calls.at(-1)?.left).toBe(330);
      scroller.prev();
      expect(layout.calls.at(-1)?.left).toBe(220);
    });

    it('reports what it can do through signals', () => {
      const f = setup();
      const layout = mockLayout(f);
      const scroller = f.debugElement.children[0].children[0]
        .componentInstance as AndesCarouselScroller;
      expect(scroller.overflowing()).toBe(true);
      expect(scroller.canScrollPrev()).toBe(false);
      expect(scroller.canScrollNext()).toBe(true);
      layout.scrollBy(layout.max);
      expect(scroller.canScrollPrev()).toBe(true);
      expect(scroller.canScrollNext()).toBe(false);
    });
  });
});

describe('stepOffset', () => {
  const boxes: AndesScrollerBox[] = Array.from({ length: 6 }, (_, i) => ({
    start: i * 110,
    end: i * 110 + 100,
  }));
  const base = { max: 410, client: 250, inset: 0, paging: 'item' } as const;

  it('goes to the next and previous item start', () => {
    expect(stepOffset(boxes, 1, { ...base, from: 0 })).toBe(110);
    expect(stepOffset(boxes, -1, { ...base, from: 220 })).toBe(110);
  });

  it('goes to the first item from a position between two items', () => {
    expect(stepOffset(boxes, -1, { ...base, from: 150 })).toBe(110);
    expect(stepOffset(boxes, 1, { ...base, from: 150 })).toBe(220);
  });

  it('reaches the end of the content, then reports there is no more', () => {
    expect(stepOffset(boxes, 1, { ...base, from: 330 })).toBe(410);
    expect(stepOffset(boxes, 1, { ...base, from: 410 })).toBeNull();
    expect(stepOffset(boxes, -1, { ...base, from: 0 })).toBeNull();
  });

  it('keeps an inset from the start edge, except for the first item', () => {
    const options = { ...base, inset: 20 };
    expect(stepOffset(boxes, 1, { ...options, from: 0 })).toBe(90);
    expect(stepOffset(boxes, -1, { ...options, from: 90 })).toBe(0);
  });

  it('moves a view at a time', () => {
    const options = { ...base, paging: 'view' } as const;
    expect(stepOffset(boxes, 1, { ...options, from: 0 })).toBe(220);
    expect(stepOffset(boxes, 1, { ...options, from: 220 })).toBe(410);
    expect(stepOffset(boxes, -1, { ...options, from: 410 })).toBe(220);
    expect(stepOffset(boxes, -1, { ...options, from: 220 })).toBe(0);
  });

  it('moves item by item when nothing is paged', () => {
    expect(stepOffset(boxes, 1, { ...base, paging: 'none', from: 0 })).toBe(
      110,
    );
  });
});

describe('AndesCarouselScroller stylesheet', () => {
  const css = readFileSync(
    'packages/ui/src/lib/carousel/carousel-scroller.css',
    'utf8',
  );
  const itemCss = readFileSync(
    'packages/ui/src/lib/carousel/carousel-scroller-item.css',
    'utf8',
  );

  it('scrolls natively, snaps to the start edge and hides the scrollbar', () => {
    expect(css).toContain('overflow-x: auto');
    expect(css).toContain('scroll-snap-type: x mandatory');
    expect(css).toContain('scrollbar-width: none');
    expect(itemCss).toContain('scroll-snap-align: start');
  });

  it('fades the edges with a mask, mirrored in right-to-left', () => {
    expect(css).toContain('mask-image: linear-gradient(');
    expect(css).toContain('to left');
    expect(css).toContain('--andes-carousel-fade-size');
  });

  it('hands every item the same width and gap through custom properties', () => {
    expect(itemCss).toContain('var(--andes-carousel-item-width, auto)');
    expect(css).toContain('gap: var(--andes-carousel-gap, 1rem)');
  });

  it('keeps the vertical pan for the page while paging', () => {
    expect(css).toContain('touch-action: pan-y pinch-zoom');
  });
});
