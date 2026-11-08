import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

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
