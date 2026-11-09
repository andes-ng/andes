import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { readFileSync } from 'node:fs';

import { atRule } from '../../testing/at-rule';
import { AndesTabs } from './tabs';
import { AndesTabsContent } from './tabs-content';
import { AndesTabsList } from './tabs-list';
import type {
  AndesTabsClassNames,
  AndesTabsSemantic,
  AndesTabsStyles,
} from './tabs-semantic';
import { AndesTabsTrigger } from './tabs-trigger';
import type {
  AndesTabsAnimated,
  AndesTabsIndicator,
  AndesTabsMotion,
  AndesTabsPosition,
  AndesTabsSize,
  AndesTabsType,
} from './tabs-types';

/*
 * The pill and segmented types, stretching, the per-part classes and styles, the indicator
 * thickness, the side bar that moves to the top in a narrow container, the sliding panel motion
 * and the accessible name of an icon-only tab.
 */

@Component({
  imports: [AndesTabs, AndesTabsList, AndesTabsTrigger, AndesTabsContent],
  template: `
    <andes-tabs
      [type]="type()"
      [size]="size()"
      [stretch]="stretch()"
      [tabPosition]="position()"
      [collapseBelow]="collapseBelow()"
      [classNames]="classNames()"
      [styles]="styles()"
      [indicator]="indicator()"
      [animated]="animated()"
      [motion]="motion()"
      [(value)]="value"
    >
      <andes-tabs-list>
        <andes-tabs-trigger value="a">Tab A</andes-tabs-trigger>
        <andes-tabs-trigger value="b" ariaLabel="Second tab" />
        <andes-tabs-trigger value="c">Tab C</andes-tabs-trigger>
      </andes-tabs-list>
      <andes-tabs-content value="a">Panel A</andes-tabs-content>
      <andes-tabs-content value="b">Panel B</andes-tabs-content>
      <andes-tabs-content value="c">Panel C</andes-tabs-content>
    </andes-tabs>
  `,
})
class Host {
  readonly type = signal<AndesTabsType>('line');
  readonly size = signal<AndesTabsSize>('md');
  readonly stretch = signal(false);
  readonly position = signal<AndesTabsPosition | undefined>(undefined);
  readonly collapseBelow = signal<number | null>(480);
  readonly classNames = signal<AndesTabsSemantic<AndesTabsClassNames> | null>(
    null,
  );
  readonly styles = signal<AndesTabsSemantic<AndesTabsStyles> | null>(null);
  readonly indicator = signal<AndesTabsIndicator | undefined>(undefined);
  readonly animated = signal<boolean | AndesTabsAnimated>(true);
  readonly value = signal<string | undefined>(undefined);
  readonly motion = signal<AndesTabsMotion | undefined>(undefined);
}

/** A `ResizeObserver` the test drives by hand. */
class FakeResizeObserver {
  static instances: FakeResizeObserver[] = [];
  constructor(readonly callback: () => void) {
    FakeResizeObserver.instances.push(this);
  }
  observe(): void {
    /* Driven by `resize()`. */
  }
  disconnect(): void {
    FakeResizeObserver.instances = FakeResizeObserver.instances.filter(
      (observer) => observer !== this,
    );
  }
}

describe('AndesTabs parts and types', () => {
  async function create(setup?: (host: Host) => void) {
    const fixture: ComponentFixture<Host> = TestBed.createComponent(Host);
    setup?.(fixture.componentInstance);
    fixture.detectChanges();
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    const q = (selector: string) => root.querySelector<HTMLElement>(selector);
    const settle = async () => {
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
    };
    return { fixture, host: fixture.componentInstance, root, q, settle };
  }

  describe('types', () => {
    it.each(['line', 'card', 'pill', 'segmented'] as const)(
      'marks the %s type on the bar, the list and every tab',
      async (type) => {
        const { root } = await create((host) => host.type.set(type));

        expect(root.querySelector(`.andes-tabs__bar--${type}`)).not.toBeNull();
        expect(
          root.querySelector('andes-tabs-list')?.getAttribute('data-variant'),
        ).toBe(type);
        for (const trigger of Array.from(
          root.querySelectorAll('andes-tabs-trigger'),
        )) {
          expect(trigger.getAttribute('data-variant')).toBe(type);
        }
      },
    );

    it('treats an editable card as a card', async () => {
      const { root } = await create((host) => host.type.set('editable-card'));

      expect(
        root.querySelector('andes-tabs-list')?.getAttribute('data-variant'),
      ).toBe('card');
    });

    it('has no ink bar in the pill and segmented types', async () => {
      for (const type of ['pill', 'segmented'] as const) {
        TestBed.resetTestingModule();
        const { root } = await create((host) => host.type.set(type));

        expect(root.querySelector('.andes-tabs__ink-bar')).toBeNull();
      }
    });
  });

  describe('stretch', () => {
    it('flags the bar, the list and the tabs', async () => {
      const { root, host, settle } = await create();
      expect(root.querySelector('[data-stretch]')).toBeNull();

      host.stretch.set(true);
      await settle();

      expect(root.querySelector('.andes-tabs__bar--stretch')).not.toBeNull();
      expect(
        root.querySelector('andes-tabs-list')?.hasAttribute('data-stretch'),
      ).toBe(true);
      expect(
        root.querySelector('andes-tabs-trigger')?.hasAttribute('data-stretch'),
      ).toBe(true);
    });
  });

  describe('classNames and styles', () => {
    it('reaches each part with an object', async () => {
      const { q } = await create((host) =>
        host.classNames.set({
          root: 'on-root',
          bar: ['on-bar', 'second'],
          list: 'on-list',
          trigger: 'on-trigger',
          content: 'on-content',
          panels: 'on-panels',
        }),
      );

      expect(q('andes-tabs')?.classList.contains('on-root')).toBe(true);
      expect(q('.andes-tabs__bar')?.classList.contains('on-bar')).toBe(true);
      expect(q('.andes-tabs__bar')?.classList.contains('second')).toBe(true);
      expect(q('andes-tabs-list')?.classList.contains('on-list')).toBe(true);
      expect(q('[role="tab"]')?.classList.contains('on-trigger')).toBe(true);
      expect(q('andes-tabs-content')?.classList.contains('on-content')).toBe(
        true,
      );
      expect(q('.andes-tabs__panels')?.classList.contains('on-panels')).toBe(
        true,
      );
    });

    it('keeps the component classes next to the custom ones', async () => {
      const { q } = await create((host) =>
        host.classNames.set({ trigger: 'on-trigger' }),
      );

      expect(q('[role="tab"]')?.classList.contains('andes-tabs__trigger')).toBe(
        true,
      );
    });

    it('calls a function with the current props and follows them', async () => {
      const seen: string[] = [];
      const { q, host, settle } = await create((h) =>
        h.classNames.set(({ props }) => {
          seen.push(`${props.type}/${props.size}/${props.position}`);
          return { trigger: `size-${props.size}` };
        }),
      );
      expect(q('[role="tab"]')?.classList.contains('size-md')).toBe(true);

      host.size.set('lg');
      host.type.set('pill');
      await settle();

      expect(q('[role="tab"]')?.classList.contains('size-lg')).toBe(true);
      expect(seen).toContain('line/md/top');
      expect(seen).toContain('pill/lg/top');
    });

    it('applies inline styles per part, in camelCase or kebab-case, with px for numbers', async () => {
      const { q } = await create((host) =>
        host.styles.set({
          root: { '--tab-gap': '3px' },
          trigger: { letterSpacing: '2px', 'padding-top': 7 },
          content: { opacity: 0.5 },
        }),
      );

      expect(q('andes-tabs')?.style.getPropertyValue('--tab-gap')).toBe('3px');
      expect(q('[role="tab"]')?.style.letterSpacing).toBe('2px');
      expect(q('[role="tab"]')?.style.paddingTop).toBe('7px');
      expect(q('andes-tabs-content')?.style.opacity).toBe('0.5');
    });

    it('computes styles from the props', async () => {
      const { q, host, settle } = await create((h) =>
        h.styles.set(({ props }) =>
          props.stretch ? { list: { outline: '1px solid red' } } : {},
        ),
      );
      expect(q('andes-tabs-list')?.style.outline).toBe('');

      host.stretch.set(true);
      await settle();

      expect(q('andes-tabs-list')?.style.outline).toContain('1px solid');
    });
  });

  describe('indicator thickness', () => {
    const rect = {
      left: 10,
      top: 0,
      width: 50,
      height: 30,
      right: 60,
      bottom: 30,
      x: 10,
      y: 0,
      toJSON: () => ({}),
    };
    let original: typeof HTMLElement.prototype.getBoundingClientRect;

    beforeEach(() => {
      original = HTMLElement.prototype.getBoundingClientRect;
      HTMLElement.prototype.getBoundingClientRect = () => rect as DOMRect;
    });
    afterEach(() => {
      HTMLElement.prototype.getBoundingClientRect = original;
    });

    it('sets the thickness and keeps the styles of the indicator part', async () => {
      const { q } = await create((host) => {
        host.indicator.set({ thickness: 4 });
        host.styles.set({ indicator: { borderRadius: 3 } });
      });
      const ink = q('.andes-tabs__ink-bar');

      expect(ink?.style.height).toBe('4px');
      expect(ink?.style.borderRadius).toBe('3px');
      expect(ink?.style.width).toBe('50px');
    });

    it('sets the width of a vertical bar', async () => {
      const { q } = await create((host) => {
        host.position.set('left');
        host.collapseBelow.set(null);
        host.indicator.set({ thickness: 5 });
      });

      expect(q('.andes-tabs__ink-bar')?.style.width).toBe('5px');
    });
  });

  describe('a side bar in a narrow container', () => {
    let original: typeof ResizeObserver | undefined;
    let width = 0;
    let originalRect: typeof HTMLElement.prototype.getBoundingClientRect;

    beforeEach(() => {
      original = globalThis.ResizeObserver;
      globalThis.ResizeObserver =
        FakeResizeObserver as unknown as typeof ResizeObserver;
      FakeResizeObserver.instances = [];
      originalRect = HTMLElement.prototype.getBoundingClientRect;
      HTMLElement.prototype.getBoundingClientRect = function () {
        return {
          left: 0,
          top: 0,
          right: width,
          bottom: 0,
          width: this.tagName === 'ANDES-TABS' ? width : 0,
          height: 0,
          x: 0,
          y: 0,
          toJSON: () => ({}),
        } as DOMRect;
      };
    });
    afterEach(() => {
      globalThis.ResizeObserver = original as typeof ResizeObserver;
      HTMLElement.prototype.getBoundingClientRect = originalRect;
    });

    async function resize(
      target: ReturnType<typeof create> extends Promise<infer T> ? T : never,
      next: number,
    ) {
      width = next;
      FakeResizeObserver.instances.forEach((observer) => observer.callback());
      await target.settle();
    }

    it('moves to the top below collapseBelow and back above it', async () => {
      const demo = await create((host) => host.position.set('left'));
      expect(demo.q('andes-tabs')?.getAttribute('data-position')).toBe('left');

      await resize(demo, 300);
      expect(demo.q('andes-tabs')?.getAttribute('data-position')).toBe('top');
      expect(demo.q('andes-tabs-list')?.getAttribute('aria-orientation')).toBe(
        'horizontal',
      );

      await resize(demo, 700);
      expect(demo.q('andes-tabs')?.getAttribute('data-position')).toBe('left');
      expect(demo.q('andes-tabs-list')?.getAttribute('aria-orientation')).toBe(
        'vertical',
      );
    });

    it('stays at the side when collapseBelow is null', async () => {
      const demo = await create((host) => {
        host.position.set('right');
        host.collapseBelow.set(null);
      });

      await resize(demo, 200);

      expect(demo.q('andes-tabs')?.getAttribute('data-position')).toBe('right');
    });

    it('never moves a bar that is already on top or at the bottom', async () => {
      const demo = await create((host) => host.position.set('bottom'));

      await resize(demo, 200);

      expect(demo.q('andes-tabs')?.getAttribute('data-position')).toBe(
        'bottom',
      );
    });
  });

  describe('panel motion', () => {
    it('adds the sliding class only for slide, and fades for true', async () => {
      const { q, host, settle } = await create((h) =>
        h.animated.set({ tabPane: 'slide' }),
      );
      const panel = () => q('andes-tabs-content');

      expect(panel()?.classList.contains('andes-tabs-content--animated')).toBe(
        true,
      );
      expect(panel()?.classList.contains('andes-tabs-content--slide')).toBe(
        true,
      );

      host.animated.set({ tabPane: true });
      await settle();
      expect(panel()?.classList.contains('andes-tabs-content--slide')).toBe(
        false,
      );
      expect(panel()?.classList.contains('andes-tabs-content--animated')).toBe(
        true,
      );

      host.animated.set({ tabPane: false });
      await settle();
      expect(panel()?.classList.contains('andes-tabs-content--animated')).toBe(
        false,
      );
    });

    it('slides from the other side when the selection moves backward', async () => {
      const { q, host, settle } = await create((h) => {
        h.animated.set({ tabPane: 'slide' });
        h.value.set('c');
      });
      const panels = () =>
        Array.from(
          document.querySelectorAll<HTMLElement>('andes-tabs-content'),
        );
      expect(
        panels()[2].classList.contains('andes-tabs-content--backward'),
      ).toBe(false);

      host.value.set('a');
      await settle();
      expect(
        panels()[0].classList.contains('andes-tabs-content--backward'),
      ).toBe(true);

      host.value.set('c');
      await settle();
      expect(
        panels()[2].classList.contains('andes-tabs-content--backward'),
      ).toBe(false);
      expect(q('andes-tabs')).not.toBeNull();
    });
  });

  describe('thumb (pill and segmented)', () => {
    let original: typeof HTMLElement.prototype.getBoundingClientRect;

    /** Lays the nav out by hand: tab `i` is 50px wide and starts at 60 * i (or 30 * i tall). */
    function layOut(vertical: boolean) {
      HTMLElement.prototype.getBoundingClientRect = function () {
        let left = 0;
        let top = 0;
        let width = 200;
        let height = 28;
        if (this.tagName === 'ANDES-TABS-TRIGGER') {
          const index = Array.from(this.parentElement?.children ?? []).indexOf(
            this,
          );
          width = 50;
          height = 24;
          if (vertical) {
            top = 2 + index * 30;
            left = 2;
          } else {
            left = 2 + index * 60;
            top = 2;
          }
        }
        return {
          left,
          top,
          width,
          height,
          right: left + width,
          bottom: top + height,
          x: left,
          y: top,
          toJSON: () => ({}),
        } as DOMRect;
      };
    }

    beforeEach(() => {
      original = HTMLElement.prototype.getBoundingClientRect;
      layOut(false);
    });
    afterEach(() => {
      HTMLElement.prototype.getBoundingClientRect = original;
    });

    it.each(['pill', 'segmented'] as const)(
      'draws one thumb under the %s active tab, in the scrolling nav',
      async (type) => {
        const { q, root } = await create((host) => host.type.set(type));
        const thumb = q('.andes-tabs__nav > .andes-tabs__thumb');

        expect(thumb).not.toBeNull();
        expect(root.querySelectorAll('.andes-tabs__thumb').length).toBe(1);
        expect(thumb?.getAttribute('aria-hidden')).toBe('true');
        expect(thumb?.style.width).toBe('50px');
        expect(thumb?.style.height).toBe('24px');
        expect(thumb?.style.transform).toBe('translate(2px, 2px)');
      },
    );

    it('draws no thumb in the line and card types', async () => {
      for (const type of ['line', 'card', 'editable-card'] as const) {
        TestBed.resetTestingModule();
        const { q } = await create((host) => host.type.set(type));

        expect(q('.andes-tabs__thumb')).toBeNull();
      }
    });

    it('moves the same thumb to the newly selected tab', async () => {
      const { q, host, settle } = await create((h) => h.type.set('segmented'));
      const thumb = q('.andes-tabs__thumb');

      host.value.set('c');
      await settle();

      expect(q('.andes-tabs__thumb')).toBe(thumb);
      expect(thumb?.style.transform).toBe('translate(122px, 2px)');
    });

    it('moves along the height of a side bar', async () => {
      layOut(true);
      const { q } = await create((host) => {
        host.type.set('pill');
        host.position.set('left');
        host.collapseBelow.set(null);
        host.value.set('b');
      });

      expect(q('.andes-tabs__thumb')?.style.transform).toBe(
        'translate(2px, 32px)',
      );
    });

    it('keeps the styles of the indicator part on the thumb', async () => {
      const { q } = await create((host) => {
        host.type.set('pill');
        host.styles.set({ indicator: { opacity: 0.5 } });
        host.classNames.set({ indicator: 'on-indicator' });
      });

      expect(q('.andes-tabs__thumb')?.style.opacity).toBe('0.5');
      expect(q('.andes-tabs__thumb')?.classList.contains('on-indicator')).toBe(
        true,
      );
    });

    it('slides only while animated allows it', async () => {
      const { q, host, settle } = await create((h) => h.type.set('pill'));
      expect(
        q('.andes-tabs__thumb')?.classList.contains(
          'andes-tabs__thumb--animated',
        ),
      ).toBe(true);

      host.animated.set({ inkBar: false });
      await settle();
      expect(
        q('.andes-tabs__thumb')?.classList.contains(
          'andes-tabs__thumb--animated',
        ),
      ).toBe(false);
    });

    it('lets the selected tab draw the thumb until it is measured, and while dragging', async () => {
      const { fixture, root, settle } = await create((host) =>
        host.type.set('pill'),
      );
      const tabsInstance = fixture.debugElement.query(By.directive(AndesTabs))
        .componentInstance as AndesTabs;
      const trigger = () => root.querySelector('andes-tabs-trigger');
      expect(trigger()?.getAttribute('data-thumb')).toBe('ready');

      tabsInstance.setSorting(true);
      await settle();

      expect(root.querySelector('.andes-tabs__thumb')).toBeNull();
      expect(trigger()?.getAttribute('data-thumb')).toBe('pending');

      tabsInstance.setSorting(false);
      await settle();
      expect(root.querySelector('.andes-tabs__thumb')).not.toBeNull();
    });

    it('is pending, with no thumb, while nothing has a size', async () => {
      HTMLElement.prototype.getBoundingClientRect = original;
      const { q, root } = await create((host) => host.type.set('segmented'));

      expect(q('.andes-tabs__thumb')).toBeNull();
      expect(
        root.querySelector('andes-tabs-trigger')?.getAttribute('data-thumb'),
      ).toBe('pending');
    });

    it('re-measures when a tab is resized on its own', async () => {
      const observers: { callback: () => void; observed: Element[] }[] = [];
      const originalObserver = globalThis.ResizeObserver;
      globalThis.ResizeObserver = class {
        readonly entry: { callback: () => void; observed: Element[] };
        constructor(callback: () => void) {
          this.entry = { callback, observed: [] };
          observers.push(this.entry);
        }
        observe(element: Element) {
          this.entry.observed.push(element);
        }
        unobserve() {
          /* Not needed here. */
        }
        disconnect() {
          /* Not needed here. */
        }
      } as unknown as typeof ResizeObserver;
      try {
        const { q, root, settle } = await create((host) =>
          host.type.set('segmented'),
        );
        const triggers = Array.from(
          root.querySelectorAll('andes-tabs-trigger'),
        );
        expect(
          observers.some((o) => triggers.every((t) => o.observed.includes(t))),
        ).toBe(true);
        expect(q('.andes-tabs__thumb')?.style.width).toBe('50px');

        HTMLElement.prototype.getBoundingClientRect = function () {
          const wide = this.tagName === 'ANDES-TABS-TRIGGER';
          return {
            left: 2,
            top: 2,
            width: wide ? 80 : 200,
            height: wide ? 24 : 28,
            right: 0,
            bottom: 0,
            x: 2,
            y: 2,
            toJSON: () => ({}),
          } as DOMRect;
        };
        observers.forEach((o) => o.callback());
        await settle();

        expect(q('.andes-tabs__thumb')?.style.width).toBe('80px');
      } finally {
        globalThis.ResizeObserver = originalObserver;
      }
    });
  });

  describe('motion', () => {
    it('writes the duration and the easing as custom properties', async () => {
      const { q, host, settle } = await create((h) =>
        h.motion.set({ duration: 450, easing: 'ease-out' }),
      );

      expect(
        q('andes-tabs')?.style.getPropertyValue('--andes-tabs-duration'),
      ).toBe('450ms');
      expect(
        q('andes-tabs')?.style.getPropertyValue('--andes-tabs-easing'),
      ).toBe('ease-out');

      host.motion.set({ duration: '0.5s' });
      await settle();
      expect(
        q('andes-tabs')?.style.getPropertyValue('--andes-tabs-duration'),
      ).toBe('0.5s');
      expect(
        q('andes-tabs')?.style.getPropertyValue('--andes-tabs-easing'),
      ).toBe('');
    });

    it('sets nothing when there is no motion', async () => {
      const { q } = await create();

      expect(
        q('andes-tabs')?.style.getPropertyValue('--andes-tabs-duration'),
      ).toBe('');
    });
  });

  describe('bringing a tab into view', () => {
    let original: typeof HTMLElement.prototype.getBoundingClientRect;
    beforeEach(() => {
      original = HTMLElement.prototype.getBoundingClientRect;
      HTMLElement.prototype.getBoundingClientRect = function () {
        let left = 0;
        let width = 0;
        if (this.classList.contains('andes-tabs__nav-wrap')) {
          width = 200;
        } else if (this.tagName === 'ANDES-TABS-TRIGGER') {
          const index = Array.from(this.parentElement?.children ?? []).indexOf(
            this,
          );
          left = 10 + index * 90;
          width = 80;
        }
        return {
          left,
          top: 0,
          width,
          height: width ? 30 : 0,
          right: left + width,
          bottom: 30,
          x: left,
          y: 0,
          toJSON: () => ({}),
        } as DOMRect;
      };
    });
    afterEach(() => {
      HTMLElement.prototype.getBoundingClientRect = original;
    });

    it('scrolls until the tab clears the 32px edge fade, not just the edge', async () => {
      const { q, host, settle } = await create();
      const scroller = q('.andes-tabs__nav-wrap') as HTMLElement;
      Object.defineProperty(scroller, 'scrollLeft', {
        configurable: true,
        writable: true,
        value: 0,
      });

      host.value.set('c');
      await settle();
      // The tab ends at 270 and the visible edge, less the fade, is 168.
      expect(scroller.scrollLeft).toBe(102);

      host.value.set('a');
      await settle();
      // The tab starts at 10 and must start at 32.
      expect(scroller.scrollLeft).toBe(80);
    });
  });

  describe('thumb stylesheet', () => {
    const read = (file: string) =>
      readFileSync(`packages/ui/src/lib/tabs/${file}`, 'utf8');

    it('glides over 300ms by default, through the custom properties', () => {
      const css = read('tabs.css');
      const start = css.indexOf('.andes-tabs__thumb--animated {');
      const rule = css.slice(start, css.indexOf('}', start));

      expect(rule).toContain('var(--andes-tabs-duration, 300ms)');
      expect(rule).toContain('var(--andes-tabs-easing,');
      for (const property of ['transform', 'width', 'height']) {
        expect(rule).toContain(property);
      }
    });

    it('does not slide under reduced motion', () => {
      const reduced = atRule(
        read('tabs.css'),
        '@media (prefers-reduced-motion',
      );

      expect(reduced).toContain('.andes-tabs__thumb--animated');
      expect(reduced).toContain('transition: none');
    });

    it('maps the thumb and the selected label onto the system colours in forced colours', () => {
      expect(atRule(read('tabs.css'), '@media (forced-colors')).toContain(
        'background-color: Highlight',
      );
      expect(
        atRule(read('tabs-trigger.css'), '@media (forced-colors'),
      ).toContain('color: HighlightText');
    });

    it('sizes the segment 24px, 32px and 40px inside a 2px inset', () => {
      const trigger = read('tabs-trigger.css');

      expect(trigger).toContain('--_pad-y: 0.125rem');
      expect(trigger).toContain('--_pad-y: 0.375rem');
      expect(trigger).toContain('--_pad-y: 0.5rem');
      expect(read('tabs.css')).toContain('padding: 2px');
    });

    it('pads the label 12px, 14px and 16px from the thumb edge', () => {
      const trigger = read('tabs-trigger.css');

      for (const padding of ['0.75rem', '0.875rem', '1rem']) {
        expect(trigger).toContain(`--_pad-x: ${padding}`);
      }
    });

    it('spaces pill tabs 4px apart and segmented tabs not at all', () => {
      const list = read('tabs-list.css');

      expect(list).toMatch(
        /\[data-variant='pill'\]\)\s*\{\s*gap: var\(--andes-space-1\)/,
      );
      expect(list).toMatch(/\[data-variant='segmented'\]\)\s*\{\s*gap: 0/);
    });
  });

  describe('accessible name', () => {
    it('puts ariaLabel on the tab button', async () => {
      const { root } = await create();
      const buttons = Array.from(
        root.querySelectorAll<HTMLElement>('[role="tab"]'),
      );

      expect(buttons[1].getAttribute('aria-label')).toBe('Second tab');
      expect(buttons[0].hasAttribute('aria-label')).toBe(false);
    });
  });
});
