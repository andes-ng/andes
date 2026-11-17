import {
  Component,
  ElementRef,
  signal,
  viewChild,
  type TemplateRef,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { AndesInput } from '../input/input';
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
  AndesPopoverPlacement,
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

@Component({
  imports: [AndesPopover, AndesPopoverTrigger, AndesInput],
  template: `
    <andes-popover
      trigger="focus"
      placement="right"
      [showArrow]="true"
      content="Rules"
    >
      <andes-input andesPopoverTrigger aria-label="Password" />
    </andes-popover>
  `,
})
class FieldHost {
  readonly popover = viewChild.required(AndesPopover);
}

describe('AndesPopover - on a field', () => {
  withElementGeometry();
  afterEach(() => vi.restoreAllMocks());

  const rect = (r: {
    left: number;
    top: number;
    width: number;
    height: number;
  }) =>
    ({
      ...r,
      x: r.left,
      y: r.top,
      right: r.left + r.width,
      bottom: r.top + r.height,
      toJSON: () => ({}),
    }) as DOMRect;

  it('anchors to the outer box of the field, not to the native input inside it', async () => {
    const fixture = TestBed.createComponent(FieldHost);
    fixture.detectChanges();
    await fixture.whenStable();
    const host = document.querySelector('andes-input') as HTMLElement;
    const input = host.querySelector('input') as HTMLInputElement;

    const anchor = (
      fixture.componentInstance.popover() as unknown as {
        overlay: { anchor(): HTMLElement | null };
      }
    ).overlay.anchor();

    expect(anchor).toBe(host);
    expect(anchor).not.toBe(input);
  });

  it('points the arrow at the middle of the whole field, not of the input inside it', async () => {
    const fixture = TestBed.createComponent(FieldHost);
    fixture.detectChanges();
    await fixture.whenStable();
    const host = document.querySelector('andes-input') as HTMLElement;
    const input = host.querySelector('input') as HTMLInputElement;
    // The field is 224 x 80 at (100, 100); the input sits 13px in, and is shorter.
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(
      function (this: HTMLElement) {
        // The field's own boxes (the host and the bordered group inside it) are all 224 x 80.
        if (this === host || (host.contains(this) && this !== input)) {
          return rect({ left: 100, top: 100, width: 224, height: 80 });
        }
        if (this === input) {
          return rect({ left: 113, top: 105, width: 198, height: 22 });
        }
        return this.classList.contains('cdk-overlay-pane')
          ? rect({ left: 332, top: 90, width: 150, height: 100 })
          : rect({ left: 0, top: 0, width: 0, height: 0 });
      },
    );

    input.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const surface = document.querySelector(
      '.andes-popover-content',
    ) as HTMLElement;
    const arrow = surface.querySelector('.andes-popover-arrow') as HTMLElement;
    // Field middle 140 - panel top 90; the input middle (116) would have been clamped to 20.
    expect(arrow.style.getPropertyValue('--andes-popover-arrow-offset')).toBe(
      '50px',
    );
  });

  it('gives focus back to the input inside the field on close', async () => {
    const fixture = TestBed.createComponent(FieldHost);
    fixture.detectChanges();
    await fixture.whenStable();
    const input = document
      .querySelector('andes-input')
      ?.querySelector('input') as HTMLInputElement;
    input.focus();

    fixture.componentInstance.popover().show();
    fixture.detectChanges();
    await fixture.whenStable();
    (document.body as HTMLElement).focus();
    fixture.componentInstance.popover().close();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(document.activeElement).toBe(input);
  });
});

@Component({
  imports: [AndesPopover, AndesPopoverTrigger, AndesPopoverClose],
  template: `
    <button type="button" id="outside">Outside</button>
    <andes-popover
      [trigger]="['hover', 'click']"
      [openDelay]="0"
      [closeDelay]="0"
      [title]="title"
      [content]="body"
      (openChangeDetail)="
        details.push(
          $event.open ? 'open:' + $event.source : 'close:' + $event.source
        )
      "
    >
      <button type="button" id="trigger" andesPopoverTrigger>
        Hover and click
      </button>
    </andes-popover>
    <ng-template #body let-mode="mode">
      @if (mode === 'click') {
        <span id="pinned-text">Click content</span>
        <button type="button" id="close" andesPopoverClose>Close</button>
      } @else {
        <span id="hover-text">Hover content</span>
      }
    </ng-template>
  `,
})
class PinHost {
  readonly details: string[] = [];
  readonly title = (context: { mode: string }) =>
    context.mode === 'click' ? 'Click title' : 'Hover title';
}

describe('AndesPopover - hover, then click to pin', () => {
  withElementGeometry();
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  function setup() {
    vi.useFakeTimers();
    const fixture = TestBed.createComponent(PinHost);
    fixture.detectChanges();
    const q = (selector: string) =>
      document.querySelector(selector) as HTMLElement | null;
    const trigger = q('#trigger') as HTMLElement;
    const settle = async () => {
      fixture.detectChanges();
      await vi.advanceTimersByTimeAsync(20);
      fixture.detectChanges();
    };
    const hover = async () => {
      trigger.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      await settle();
    };
    const leave = async () => {
      trigger.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
      await settle();
    };
    const click = async () => {
      trigger.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
      trigger.click();
      await settle();
    };
    const escape = async () => {
      document.body.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'Escape',
          keyCode: 27,
          bubbles: true,
          cancelable: true,
        }),
      );
      await settle();
    };
    return {
      fixture,
      q,
      trigger,
      hover,
      leave,
      click,
      escape,
      settle,
      panels: () => document.querySelectorAll('.andes-popover-content').length,
      text: () =>
        q('.andes-popover-content')?.textContent?.replace(/\s+/g, ' ').trim(),
    };
  }

  it('opens as a hover preview with the hover content', async () => {
    const { hover, text, fixture } = setup();
    await hover();

    expect(text()).toBe('Hover title Hover content');
    expect(fixture.componentInstance.details).toEqual(['open:hover']);
  });

  it('closes a hover preview when the pointer leaves', async () => {
    const { hover, leave, panels } = setup();
    await hover();
    await leave();

    expect(panels()).toBe(0);
  });

  it('turns the same panel into the click content on a click, without a second panel', async () => {
    const { hover, click, q, text, panels } = setup();
    await hover();
    const surface = q('.andes-popover-content');

    await click();

    expect(panels()).toBe(1);
    expect(q('.andes-popover-content')).toBe(surface);
    expect(text()).toBe('Click title Click contentClose');
  });

  it('stays open when the pointer leaves once pinned', async () => {
    const { hover, click, leave, panels, text } = setup();
    await hover();
    await click();
    await leave();
    await vi.advanceTimersByTimeAsync(500);

    expect(panels()).toBe(1);
    expect(text()).toContain('Click content');
  });

  it('a click opens it straight into the click content', async () => {
    const { click, text } = setup();
    await click();

    expect(text()).toContain('Click content');
  });

  it('closes a pinned panel from its Close action', async () => {
    const { hover, click, q, settle, panels } = setup();
    await hover();
    await click();
    q('#close')?.click();
    await settle();

    expect(panels()).toBe(0);
  });

  it('closes a pinned panel on a second click on the trigger', async () => {
    const { hover, click, panels } = setup();
    await hover();
    await click();
    await click();

    expect(panels()).toBe(0);
  });

  it('closes a pinned panel on Escape', async () => {
    const { hover, click, escape, panels } = setup();
    await hover();
    await click();
    await escape();

    expect(panels()).toBe(0);
  });

  it('closes a pinned panel on a press outside', async () => {
    const { hover, click, q, settle, panels, fixture } = setup();
    await hover();
    await click();
    const outside = q('#outside') as HTMLElement;
    outside.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    outside.click();
    await settle();

    expect(panels()).toBe(0);
    expect(fixture.componentInstance.details.at(-1)).toBe(
      'close:outside-click',
    );
  });

  it('reports the hover and the pinned states as one open panel, closed by the click or by the page', async () => {
    const { hover, click, escape, fixture } = setup();
    await hover();
    await click();
    await escape();

    expect(fixture.componentInstance.details).toEqual([
      'open:hover',
      'close:escape-key',
    ]);
  });

  it('moves focus to the first control of the pinned content', async () => {
    const { hover, click, q } = setup();
    await hover();
    await click();
    await vi.advanceTimersByTimeAsync(50);

    expect(document.activeElement).toBe(q('#close'));
  });

  it('fades the content in and eases the height when the content swaps', async () => {
    const animate = vi.fn(() => ({ finished: Promise.resolve() }));
    (HTMLElement.prototype as unknown as { animate: unknown }).animate =
      animate;
    try {
      const { hover, click, q } = setup();
      let surfaceHeights = [66, 96];
      vi.spyOn(
        HTMLElement.prototype,
        'getBoundingClientRect',
      ).mockImplementation(function (this: HTMLElement) {
        const height = this.classList.contains('andes-popover-content')
          ? ((surfaceHeights.length > 1
              ? surfaceHeights.shift()
              : surfaceHeights[0]) as number)
          : 0;
        return {
          left: 0,
          top: 0,
          width: 100,
          height,
          x: 0,
          y: 0,
          right: 100,
          bottom: height,
          toJSON: () => ({}),
        } as DOMRect;
      });
      await hover();
      surfaceHeights = [66, 96];
      await click();
      await vi.advanceTimersByTimeAsync(50);

      const frames = animate.mock.calls.map((call) =>
        JSON.stringify((call as unknown[])[0]),
      );
      expect(frames).toContain('[{"opacity":0},{"opacity":1}]');
      expect(
        frames.some((f) =>
          f.startsWith('[{"height":"66px"},{"height":"96px"}'),
        ),
      ).toBe(true);
      expect(q('.andes-popover-content')).not.toBeNull();
    } finally {
      delete (HTMLElement.prototype as unknown as { animate?: unknown })
        .animate;
    }
  });
});

@Component({
  imports: [AndesPopover, AndesPopoverTrigger],
  template: `
    <andes-popover
      [showArrow]="arrow()"
      [sideOffset]="offset()"
      [side]="side()"
      content="Body"
    >
      <button type="button" id="trigger" andesPopoverTrigger>Open</button>
    </andes-popover>
  `,
})
class GapHost {
  readonly arrow = signal(true);
  readonly offset = signal<number | undefined>(undefined);
  readonly side = signal<'top' | 'bottom' | 'left' | 'right'>('bottom');
  readonly popover = viewChild.required(AndesPopover);
}

describe('AndesPopover - distance to the trigger', () => {
  function distance(host: GapHost, fixture: { detectChanges(): void }) {
    fixture.detectChanges();
    const positioning = (
      host.popover() as unknown as {
        overlay: { config(): { positioning: { sideOffset?: number } } };
      }
    ).overlay.config().positioning;
    return positioning.sideOffset;
  }

  afterEach(() => vi.restoreAllMocks());

  it('keeps the arrow tip 6px from the trigger: 8px of arrow plus 6px of air', () => {
    const fixture = TestBed.createComponent(GapHost);
    expect(distance(fixture.componentInstance, fixture)).toBe(14);
  });

  it('keeps a smaller 8px gap without an arrow', () => {
    const fixture = TestBed.createComponent(GapHost);
    fixture.componentInstance.arrow.set(false);
    expect(distance(fixture.componentInstance, fixture)).toBe(8);
  });

  it('takes an explicit sideOffset as the whole distance, arrow or not', () => {
    const fixture = TestBed.createComponent(GapHost);
    fixture.componentInstance.offset.set(20);
    expect(distance(fixture.componentInstance, fixture)).toBe(20);
    fixture.componentInstance.arrow.set(false);
    expect(distance(fixture.componentInstance, fixture)).toBe(20);
  });

  it('reads the --andes-popover-gap air from the trigger, before the arrow height', () => {
    const fixture = TestBed.createComponent(GapHost);
    fixture.detectChanges();
    const trigger = document.getElementById('trigger') as HTMLElement;
    trigger.style.setProperty('--andes-popover-gap', '10px');
    fixture.componentInstance.arrow.set(false);
    fixture.detectChanges();
    expect(distance(fixture.componentInstance, fixture)).toBe(10);
    fixture.componentInstance.arrow.set(true);
    expect(distance(fixture.componentInstance, fixture)).toBe(18);
  });

  it('flips on the real distance: a panel that fits with 8px but not with 14px', async () => {
    vi.useFakeTimers();
    const fixture = TestBed.createComponent(GapHost);
    fixture.detectChanges();
    const height = window.innerHeight;
    // Room below: 100 for the panel (92) + distance + the 8px viewport margin -> fits at 8, not at 14.
    const rect = (r: {
      left: number;
      top: number;
      width: number;
      height: number;
    }) =>
      ({
        ...r,
        x: r.left,
        y: r.top,
        right: r.left + r.width,
        bottom: r.top + r.height,
        toJSON: () => ({}),
      }) as DOMRect;
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(
      function (this: HTMLElement) {
        if (this.id === 'trigger') {
          return rect({ left: 100, top: height - 142, width: 80, height: 30 });
        }
        return this.classList.contains('cdk-overlay-pane')
          ? rect({ left: 60, top: 0, width: 200, height: 92 })
          : rect({ left: 0, top: 0, width: 0, height: 0 });
      },
    );
    for (const [arrow, expected] of [
      [false, 'bottom'],
      [true, 'top'],
    ] as const) {
      fixture.componentInstance.arrow.set(arrow);
      fixture.detectChanges();
      (document.getElementById('trigger') as HTMLElement).click();
      fixture.detectChanges();
      await vi.advanceTimersByTimeAsync(20);
      fixture.detectChanges();
      expect(
        document
          .querySelector('.andes-popover-content')
          ?.getAttribute('data-side'),
      ).toBe(expected);
      fixture.componentInstance.popover().close();
      fixture.detectChanges();
      await vi.advanceTimersByTimeAsync(400);
    }
    vi.useRealTimers();
  });
});

@Component({
  imports: [AndesPopover, AndesPopoverTrigger],
  template: `
    <div style="display: grid; grid-template-columns: 136px;">
      <andes-popover
        [placement]="placement()"
        [showArrow]="true"
        content="Body"
      >
        <span
          id="stretched"
          andesPopoverTrigger
          style="display: block; width: 100%"
        >
          <button
            type="button"
            id="visible"
            style="border: 1px solid #000; background: #fff"
          >
            Open
          </button>
        </span>
      </andes-popover>
    </div>
  `,
})
class StretchedHost {
  readonly placement = signal<AndesPopoverPlacement>('bottom');
  readonly popover = viewChild.required(AndesPopover);
}

describe('AndesPopover - a trigger host stretched by its grid cell', () => {
  withElementGeometry();
  afterEach(() => vi.restoreAllMocks());

  const rect = (r: {
    left: number;
    top: number;
    width: number;
    height: number;
  }) =>
    ({
      ...r,
      x: r.left,
      y: r.top,
      right: r.left + r.width,
      bottom: r.top + r.height,
      toJSON: () => ({}),
    }) as DOMRect;

  const PLACEMENTS: AndesPopoverPlacement[] = [
    'top',
    'topLeft',
    'topRight',
    'bottom',
    'bottomLeft',
    'bottomRight',
    'left',
    'leftTop',
    'leftBottom',
    'right',
    'rightTop',
    'rightBottom',
  ];

  it.each(PLACEMENTS)(
    '%s anchors to the visible button, not to the 136px cell, 14px away',
    async (placement) => {
      const fixture = TestBed.createComponent(StretchedHost);
      fixture.componentInstance.placement.set(placement);
      fixture.detectChanges();
      await fixture.whenStable();
      const host = document.getElementById('stretched') as HTMLElement;
      const button = document.getElementById('visible') as HTMLElement;
      // The cell stretches the host to 136px; the button inside is only 64px wide.
      vi.spyOn(
        HTMLElement.prototype,
        'getBoundingClientRect',
      ).mockImplementation(function (this: HTMLElement) {
        if (this === host) {
          return rect({ left: 400, top: 300, width: 136, height: 32 });
        }
        if (this === button) {
          return rect({ left: 400, top: 300, width: 64, height: 32 });
        }
        return this.classList.contains('cdk-overlay-pane')
          ? rect({ left: 0, top: 0, width: 150, height: 60 })
          : rect({ left: 0, top: 0, width: 0, height: 0 });
      });

      button.click();
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      const overlay = fixture.componentInstance.popover() as unknown as {
        overlay: {
          anchor(): HTMLElement | null;
          config(): {
            positioning: { sideOffset?: number; side?: string; align?: string };
          };
        };
      };
      expect(overlay.overlay.anchor()).toBe(button);
      const positioning = overlay.overlay.config().positioning;
      // 8px of arrow and 6px of air, measured from the button's border box.
      expect(positioning.sideOffset).toBe(14);
      expect(positioning.side).toBe(
        placement.replace(/(Left|Right|Top|Bottom)$/, '').toLowerCase() ||
          placement,
      );
      const surface = document.querySelector(
        '.andes-popover-content',
      ) as HTMLElement;
      expect(surface.getAttribute('data-side')).toBe(positioning.side);
      expect(positioning.align).toBe(
        /Left$|Top$/.test(placement)
          ? 'start'
          : /Right$|Bottom$/.test(placement)
            ? 'end'
            : 'center',
      );
      fixture.destroy();
    },
  );
});

describe('AndesPopover - a trigger that moves under an open panel', () => {
  withElementGeometry();
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('puts the panel back against the trigger when the trigger moves without a scroll or a resize', async () => {
    vi.useFakeTimers();
    const fixture = TestBed.createComponent(GapHost);
    fixture.detectChanges();
    const trigger = document.getElementById('trigger') as HTMLElement;
    let top = 100;
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(
      function (this: HTMLElement) {
        const box =
          this === trigger
            ? { left: 100, top, width: 80, height: 30 }
            : { left: 0, top: 0, width: 0, height: 0 };
        return {
          ...box,
          x: box.left,
          y: box.top,
          right: box.left + box.width,
          bottom: box.top + box.height,
          toJSON: () => ({}),
        } as DOMRect;
      },
    );
    trigger.click();
    fixture.detectChanges();
    await vi.advanceTimersByTimeAsync(60);
    const overlay = (
      fixture.componentInstance.popover() as unknown as {
        overlay: { updatePosition(): void };
      }
    ).overlay;
    const update = vi.spyOn(overlay, 'updatePosition');

    await vi.advanceTimersByTimeAsync(60);
    expect(update).not.toHaveBeenCalled();

    top = 160;
    await vi.advanceTimersByTimeAsync(60);

    expect(update).toHaveBeenCalled();
  });
});
