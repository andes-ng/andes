import {
  Component,
  ElementRef,
  signal,
  viewChild,
  type TemplateRef,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { AndesPopover } from './popover';
import { AndesPopoverContent } from './popover-content';
import { AndesPopoverClose } from './popover-parts';
import { AndesPopoverTrigger } from './popover-trigger';
import type {
  AndesPopoverChangeSource,
  AndesPopoverClassNamesInput,
  AndesPopoverContainer,
  AndesPopoverContentInput,
  AndesPopoverOpenChange,
  AndesPopoverStylesInput,
  AndesPopoverTriggerAction,
} from './popover-types';

/** jsdom has no layout, which makes CDK treat every element as untabbable (see popover.spec.ts). */
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

@Component({
  imports: [
    AndesPopover,
    AndesPopoverTrigger,
    AndesPopoverContent,
    AndesPopoverClose,
  ],
  template: `
    <button type="button" id="outside">Outside</button>
    <div id="box" #box></div>
    <andes-popover
      [title]="title()"
      [content]="content()"
      [trigger]="trigger()"
      [defaultOpen]="defaultOpen()"
      [closeOnEscape]="closeOnEscape()"
      [closeOnOutsideClick]="closeOnOutsideClick()"
      [autoFocus]="autoFocus()"
      [restoreFocus]="restoreFocus()"
      [width]="width()"
      [maxWidth]="maxWidth()"
      [container]="container()"
      [classNames]="classNames()"
      [styles]="styles()"
      [showArrow]="true"
      [openDelay]="0"
      [closeDelay]="0"
      (openChangeDetail)="details.push($event)"
    >
      <button type="button" id="trigger" andesPopoverTrigger>Open</button>
    </andes-popover>
    <ng-template #contentTemplate let-close="close" let-popover>
      <button type="button" id="template-button" andesPopoverClose>Done</button>
      <button type="button" id="template-close" (click)="close()">Close</button>
      <button type="button" id="template-popover" (click)="popover.close()">
        Close 2
      </button>
    </ng-template>
  `,
})
class FeatureHost {
  readonly title = signal<AndesPopoverContentInput>('Title');
  readonly content = signal<AndesPopoverContentInput>('Body');
  readonly trigger = signal<
    AndesPopoverTriggerAction | AndesPopoverTriggerAction[]
  >('click');
  readonly defaultOpen = signal(false);
  readonly closeOnEscape = signal(true);
  readonly closeOnOutsideClick = signal(true);
  readonly autoFocus = signal<'first-tabbable' | 'container' | 'none'>(
    'first-tabbable',
  );
  readonly restoreFocus = signal(true);
  readonly width = signal<number | string | undefined>(undefined);
  readonly maxWidth = signal<number | string | undefined>(undefined);
  readonly container = signal<AndesPopoverContainer>(null);
  readonly classNames = signal<AndesPopoverClassNamesInput | null>(null);
  readonly styles = signal<AndesPopoverStylesInput | null>(null);
  readonly details: AndesPopoverOpenChange[] = [];
  readonly box = viewChild.required<ElementRef<HTMLElement>>('box');
  readonly contentTemplate =
    viewChild.required<TemplateRef<unknown>>('contentTemplate');
  readonly popover = viewChild.required(AndesPopover);
}

describe('AndesPopover - added features', () => {
  withElementGeometry();

  function setup(configure: (host: FeatureHost) => void = () => undefined) {
    const fixture = TestBed.createComponent(FeatureHost);
    configure(fixture.componentInstance);
    fixture.detectChanges();
    const host = fixture.componentInstance;
    const byId = (id: string) => document.getElementById(id) as HTMLElement;
    return {
      fixture,
      host,
      byId,
      panel: () =>
        document.querySelector('.andes-popover-content') as HTMLElement | null,
      update: () => fixture.detectChanges(),
      trigger: () => byId('trigger'),
    };
  }

  function press(key: string) {
    document.body.dispatchEvent(
      new KeyboardEvent('keydown', {
        key,
        keyCode: key === 'Escape' ? 27 : 0,
        bubbles: true,
        cancelable: true,
      }),
    );
  }

  function pressOutside(element: Element) {
    element.dispatchEvent(
      new PointerEvent('pointerdown', { bubbles: true, cancelable: true }),
    );
    element.dispatchEvent(
      new MouseEvent('click', { bubbles: true, cancelable: true }),
    );
  }

  const sources = (host: FeatureHost) =>
    host.details.map(
      (detail) => `${detail.open ? 'open' : 'close'}:${detail.source}`,
    );

  afterEach(() => vi.useRealTimers());

  describe('defaultOpen', () => {
    it('draws the panel on the first render without reporting a change', async () => {
      const { fixture, host, panel } = setup((h) => h.defaultOpen.set(true));
      await fixture.whenStable();
      fixture.detectChanges();

      expect(panel()).not.toBeNull();
      expect(host.details).toEqual([]);
    });

    it('is read once: later changes of the input do not close or reopen the panel', async () => {
      const { fixture, host, panel, update } = setup((h) =>
        h.defaultOpen.set(true),
      );
      await fixture.whenStable();
      press('Escape');
      update();
      expect(panel()).toBeNull();

      host.defaultOpen.set(false);
      update();
      host.defaultOpen.set(true);
      update();

      expect(panel()).toBeNull();
    });
  });

  describe('openChangeDetail', () => {
    it('reports a trigger click and a second click', () => {
      const { host, trigger, update } = setup();
      trigger().click();
      update();
      trigger().click();
      update();

      expect(sources(host)).toEqual(['open:click', 'close:click']);
    });

    it('reports Escape and an outside press', () => {
      const { host, byId, trigger, update } = setup();
      trigger().click();
      update();
      press('Escape');
      update();
      trigger().click();
      update();
      pressOutside(byId('outside'));
      update();

      expect(sources(host)).toEqual([
        'open:click',
        'close:escape-key',
        'open:click',
        'close:outside-click',
      ]);
    });

    it('reports a right click as contextMenu', () => {
      const { host, trigger, update } = setup((h) =>
        h.trigger.set('contextMenu'),
      );
      trigger().dispatchEvent(
        new MouseEvent('contextmenu', { bubbles: true, cancelable: true }),
      );
      update();

      expect(sources(host)).toEqual(['open:contextMenu']);
    });

    it('reports hover and focus opens and the matching closes', () => {
      vi.useFakeTimers();
      const { host, trigger, update } = setup((h) =>
        h.trigger.set(['hover', 'focus']),
      );
      trigger().dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      vi.advanceTimersByTime(10);
      update();
      trigger().dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
      vi.advanceTimersByTime(10);
      update();
      trigger().dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
      update();
      trigger().dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
      update();

      expect(sources(host)).toEqual([
        'open:hover',
        'close:hover',
        'open:focus',
        'close:focus',
      ]);
    });

    it('reports show(), close() and toggle() as imperative', () => {
      const { host, update } = setup();
      host.popover().show();
      update();
      host.popover().close();
      update();
      host.popover().toggle();
      update();
      host.popover().toggle();
      update();

      expect(sources(host)).toEqual([
        'open:imperative',
        'close:imperative',
        'open:imperative',
        'close:imperative',
      ] as `${'open' | 'close'}:${AndesPopoverChangeSource}`[]);
    });

    it('reports a close button as close-button and a template close function as imperative', () => {
      const { host, byId, trigger, update } = setup();
      host.content.set(host.contentTemplate());
      update();
      trigger().click();
      update();
      byId('template-button').click();
      update();
      trigger().click();
      update();
      byId('template-close').click();
      update();

      expect(sources(host)).toEqual([
        'open:click',
        'close:close-button',
        'open:click',
        'close:imperative',
      ]);
    });

    it('does not report a change written through open', () => {
      const { host, update } = setup();
      host.popover().open.set(true);
      update();
      host.popover().open.set(false);
      update();

      expect(host.details).toEqual([]);
    });
  });

  describe('dismissal', () => {
    it('keeps the panel open on Escape when closeOnEscape is off', () => {
      const { trigger, panel, update } = setup((h) =>
        h.closeOnEscape.set(false),
      );
      trigger().click();
      update();
      press('Escape');
      update();

      expect(panel()).not.toBeNull();
    });

    it('keeps the panel open on an outside press when closeOnOutsideClick is off', () => {
      const { byId, trigger, panel, update } = setup((h) =>
        h.closeOnOutsideClick.set(false),
      );
      trigger().click();
      update();
      pressOutside(byId('outside'));
      update();

      expect(panel()).not.toBeNull();
    });

    it('still closes from the trigger and from inside when both are off', () => {
      const { host, trigger, panel, update } = setup((h) => {
        h.closeOnEscape.set(false);
        h.closeOnOutsideClick.set(false);
      });
      trigger().click();
      update();
      trigger().click();
      update();
      expect(panel()).toBeNull();

      trigger().click();
      update();
      host.popover().close();
      update();
      expect(panel()).toBeNull();
    });
  });

  describe('manual trigger', () => {
    it('never opens from the trigger when the trigger list is empty', () => {
      vi.useFakeTimers();
      const { host, trigger, panel, update } = setup((h) => h.trigger.set([]));
      trigger().click();
      trigger().dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      trigger().dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
      trigger().dispatchEvent(
        new MouseEvent('contextmenu', { bubbles: true, cancelable: true }),
      );
      vi.advanceTimersByTime(500);
      update();
      expect(panel()).toBeNull();

      host.popover().show();
      update();
      expect(panel()).not.toBeNull();
    });
  });

  describe('focus options', () => {
    it('moves focus to the panel itself with autoFocus container', async () => {
      const { fixture, trigger, panel, update } = setup((h) => {
        h.autoFocus.set('container');
        h.content.set('Text only');
      });
      trigger().focus();
      trigger().click();
      update();
      await fixture.whenStable();

      expect(document.activeElement?.contains(panel())).toBe(true);
    });

    it('leaves focus on the trigger with autoFocus none', async () => {
      const { fixture, trigger, update } = setup((h) =>
        h.autoFocus.set('none'),
      );
      trigger().focus();
      trigger().click();
      update();
      await fixture.whenStable();

      expect(document.activeElement).toBe(trigger());
    });

    it('does not return focus to the trigger on close with restoreFocus off', async () => {
      const { fixture, byId, host, trigger, update } = setup((h) => {
        h.restoreFocus.set(false);
        h.autoFocus.set('container');
      });
      trigger().focus();
      trigger().click();
      update();
      await fixture.whenStable();
      byId('outside').focus();
      host.popover().close();
      update();
      await fixture.whenStable();

      expect(document.activeElement).toBe(byId('outside'));
    });
  });

  describe('function content', () => {
    it('calls a function for the title and the content each time they are read', () => {
      let count = 0;
      const { host, trigger, panel, update } = setup();
      host.title.set(() => `Title ${++count}`);
      host.content.set(() => 'From a function');
      update();
      trigger().click();
      update();

      expect(
        panel()?.querySelector('.andes-popover-title')?.textContent,
      ).toContain('Title 1');
      expect(
        panel()?.querySelector('.andes-popover-body')?.textContent,
      ).toContain('From a function');
    });
  });

  describe('template context', () => {
    it('gives a template close() and the popover to dismiss the panel', () => {
      const { host, byId, trigger, panel, update } = setup();
      host.content.set(host.contentTemplate());
      update();
      trigger().click();
      update();
      byId('template-close').click();
      update();
      expect(panel()).toBeNull();

      trigger().click();
      update();
      byId('template-popover').click();
      update();
      expect(panel()).toBeNull();
    });
  });

  describe('size', () => {
    it('sets a width and a maximum width as px or any CSS length', () => {
      const { host, trigger, panel, update } = setup();
      host.width.set(320);
      host.maxWidth.set('30rem');
      update();
      trigger().click();
      update();

      expect(panel()?.style.getPropertyValue('--andes-popover-width')).toBe(
        '320px',
      );
      expect(panel()?.style.getPropertyValue('--andes-popover-max-width')).toBe(
        '30rem',
      );
    });

    it('sets nothing without them', () => {
      const { trigger, panel, update } = setup();
      trigger().click();
      update();

      expect(panel()?.style.getPropertyValue('--andes-popover-width')).toBe('');
    });
  });

  describe('classNames and styles', () => {
    it('adds classes and inline styles to each part', () => {
      const { host, trigger, panel, update } = setup();
      host.classNames.set({
        root: 'my-root',
        title: ['t1', 't2'],
        body: 'my-body',
        arrow: 'my-arrow',
      });
      host.styles.set({
        root: { borderRadius: 12, '--x': 'y' },
        title: { color: 'red' },
        body: { opacity: 0.5 },
        arrow: { 'z-index': 3 },
      });
      update();
      trigger().click();
      update();

      const surface = panel() as HTMLElement;
      expect(surface.classList).toContain('my-root');
      expect(surface.classList).toContain('andes-popover-content');
      expect(surface.style.borderRadius).toBe('12px');
      expect(surface.style.getPropertyValue('--x')).toBe('y');
      const title = surface.querySelector(
        '.andes-popover-title',
      ) as HTMLElement;
      expect(title.classList).toContain('t1');
      expect(title.classList).toContain('t2');
      expect(title.style.color).toBe('red');
      const body = surface.querySelector('.andes-popover-body') as HTMLElement;
      expect(body.classList).toContain('my-body');
      expect(body.style.opacity).toBe('0.5');
      const arrow = surface.querySelector(
        '.andes-popover-arrow',
      ) as HTMLElement;
      expect(arrow.classList).toContain('my-arrow');
      expect(arrow.style.zIndex).toBe('3');
    });

    it('computes them from the popover props', () => {
      const { host, trigger, panel, update } = setup();
      host.classNames.set((info) => ({
        root: `side-${info.props.side} ${info.props.open ? 'is-open' : 'is-closed'}`,
      }));
      update();
      trigger().click();
      update();

      expect(panel()?.classList).toContain('side-bottom');
      expect(panel()?.classList).toContain('is-open');
    });
  });

  describe('container', () => {
    it('draws the panel inside an element', () => {
      const { host, trigger, update } = setup();
      host.container.set(host.box().nativeElement);
      update();
      trigger().click();
      update();

      expect(
        host.box().nativeElement.querySelector('.andes-popover-content'),
      ).not.toBeNull();
    });

    it('takes a CSS selector, an ElementRef or a function', () => {
      for (const container of [
        '#box',
        (host: FeatureHost) => host.box(),
        (host: FeatureHost) => () => host.box().nativeElement,
      ]) {
        const { fixture, host, trigger, update } = setup();
        host.container.set(
          typeof container === 'string' ? container : container(host),
        );
        update();
        trigger().click();
        update();

        expect(
          host.box().nativeElement.querySelector('.andes-popover-content'),
        ).not.toBeNull();
        fixture.destroy();
      }
    });

    it('uses the page-wide layer without one, and again after it is cleared', () => {
      const { host, trigger, panel, update } = setup();
      host.container.set(host.box().nativeElement);
      update();
      host.popover().show();
      update();
      host.popover().close();
      update();
      host.container.set(null);
      update();
      trigger().click();
      update();

      expect(host.box().nativeElement.contains(panel())).toBe(false);
      expect(
        document.querySelector('.cdk-overlay-container')?.contains(panel()),
      ).toBe(true);
    });

    it('removes the layer it added when the popover is destroyed', () => {
      const { fixture, host, trigger, update } = setup();
      host.container.set(host.box().nativeElement);
      update();
      trigger().click();
      update();
      host.popover().close();
      update();
      fixture.destroy();

      expect(document.querySelector('[data-andes-popover-layer]')).toBeNull();
    });
  });
});

@Component({
  imports: [AndesPopover, AndesPopoverTrigger, AndesPopoverContent],
  template: `
    <button type="button" id="outside">Outside</button>
    <andes-popover>
      <button type="button" id="outer-trigger" andesPopoverTrigger>
        Outer
      </button>
      <andes-popover-content>
        <p id="outer-text">Outer text</p>
        <andes-popover>
          <button type="button" id="inner-trigger" andesPopoverTrigger>
            Inner
          </button>
          <andes-popover-content
            ><p id="inner-text">Inner text</p></andes-popover-content
          >
        </andes-popover>
      </andes-popover-content>
    </andes-popover>
  `,
})
class NestedHost {}

describe('AndesPopover - nested', () => {
  withElementGeometry();

  function setup() {
    const fixture = TestBed.createComponent(NestedHost);
    fixture.detectChanges();
    const byId = (id: string) =>
      document.getElementById(id) as HTMLElement | null;
    const panels = () => document.querySelectorAll('.andes-popover-content');
    return { fixture, byId, panels, update: () => fixture.detectChanges() };
  }

  function pressOn(element: Element) {
    element.dispatchEvent(
      new PointerEvent('pointerdown', { bubbles: true, cancelable: true }),
    );
    element.dispatchEvent(
      new MouseEvent('click', { bubbles: true, cancelable: true }),
    );
  }

  it('keeps the outer panel open while the inner one is used', () => {
    const { byId, panels, update } = setup();
    byId('outer-trigger')?.click();
    update();
    byId('inner-trigger')?.click();
    update();
    expect(panels().length).toBe(2);

    pressOn(byId('inner-text') as Element);
    update();

    expect(panels().length).toBe(2);
  });

  it('closes the inner panel first on Escape, then the outer one', () => {
    const { byId, panels, update } = setup();
    byId('outer-trigger')?.click();
    update();
    byId('inner-trigger')?.click();
    update();

    const escape = () =>
      document.body.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'Escape',
          keyCode: 27,
          bubbles: true,
          cancelable: true,
        }),
      );
    escape();
    update();
    expect(panels().length).toBe(1);
    expect(byId('outer-text')).not.toBeNull();

    escape();
    update();
    expect(panels().length).toBe(0);
  });

  it('closes both on a press outside', () => {
    const { byId, panels, update } = setup();
    byId('outer-trigger')?.click();
    update();
    byId('inner-trigger')?.click();
    update();

    pressOn(byId('outside') as Element);
    update();

    expect(panels().length).toBe(0);
  });
});
