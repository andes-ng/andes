import { Component, signal, TemplateRef, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { readFileSync } from 'node:fs';
import { By } from '@angular/platform-browser';
import { AndesOverlayPrimitive } from '@andes-ng/primitives';

import { AndesButton } from '../button/button';
import type {
  AndesPopoverPlacement,
  AndesPopoverRenderable,
  AndesPopoverTriggerAction,
} from './popover-types';

import { AndesPopoverContent } from './popover-content';
import {
  AndesPopoverClose,
  AndesPopoverDescription,
  AndesPopoverHeader,
  AndesPopoverTitle,
} from './popover-parts';
import { AndesPopoverTrigger } from './popover-trigger';
import { AndesPopover } from './popover';
import type { AndesOverlayAlign, AndesOverlaySide } from '@andes-ng/primitives';
import { expectLength } from '../../testing/computed-style';

/**
 * jsdom reports zero geometry for every element, which makes CDK's
 * `InteractivityChecker` treat them all as invisible and therefore untabbable -
 * the same workaround the shared overlay primitive's own spec uses.
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

@Component({
  imports: [AndesPopover, AndesPopoverTrigger, AndesPopoverContent],
  template: `
    <button type="button" id="outside">Outside</button>
    <andes-popover
      [side]="side()"
      [align]="align()"
      [showArrow]="showArrow()"
      [(open)]="open"
    >
      <button type="button" id="trigger" andesPopoverTrigger>Open</button>
      <andes-popover-content>
        <button type="button" id="first">First</button>
        <input id="middle" />
      </andes-popover-content>
    </andes-popover>
  `,
})
class HostComponent {
  readonly side = signal<AndesOverlaySide>('bottom');
  readonly align = signal<AndesOverlayAlign>('center');
  readonly showArrow = signal(false);
  readonly open = signal(false);
}

describe('AndesPopover', () => {
  withElementGeometry();

  function createHost() {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    const query = (id: string) =>
      (document.querySelector(`#${id}`) as HTMLElement) ?? null;

    return {
      fixture,
      host: fixture.componentInstance,
      trigger: () => query('trigger'),
      outside: () => query('outside'),
      panel: () =>
        document.querySelector('.andes-popover-content') as HTMLElement | null,
      first: () => query('first'),
      middle: () => query('middle'),
    };
  }

  function pressEscape() {
    document.body.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Escape',
        keyCode: 27,
        bubbles: true,
        cancelable: true,
      }),
    );
  }

  function clickOn(element: Element) {
    element.dispatchEvent(
      new PointerEvent('pointerdown', { bubbles: true, cancelable: true }),
    );
    element.dispatchEvent(
      new MouseEvent('click', { bubbles: true, cancelable: true }),
    );
  }

  it('renders nothing until the trigger is clicked', () => {
    const { panel } = createHost();

    expect(panel()).toBeNull();
  });

  it('opens the panel on trigger click', () => {
    const { fixture, trigger, panel } = createHost();

    trigger().click();
    fixture.detectChanges();

    expect(panel()).toBeTruthy();
  });

  it('closes the panel on a second trigger click (toggle)', () => {
    const { fixture, trigger, panel } = createHost();

    trigger().click();
    fixture.detectChanges();
    expect(panel()).toBeTruthy();

    trigger().click();
    fixture.detectChanges();

    expect(panel()).toBeNull();
  });

  it('closes on Escape', () => {
    const { fixture, trigger, panel } = createHost();

    trigger().click();
    fixture.detectChanges();
    expect(panel()).toBeTruthy();

    pressEscape();
    fixture.detectChanges();

    expect(panel()).toBeNull();
  });

  it('closes on an outside click', () => {
    const { fixture, trigger, outside, panel } = createHost();

    trigger().click();
    fixture.detectChanges();
    expect(panel()).toBeTruthy();

    clickOn(outside());
    fixture.detectChanges();

    expect(panel()).toBeNull();
  });

  it('does not close on a click inside the panel', () => {
    const { fixture, trigger, middle, panel } = createHost();

    trigger().click();
    fixture.detectChanges();

    clickOn(middle());
    fixture.detectChanges();

    expect(panel()).toBeTruthy();
  });

  it('renders the panel inside the CDK overlay container, positioned relative to the trigger', () => {
    const { fixture, trigger, panel } = createHost();

    trigger().click();
    fixture.detectChanges();

    const rendered = panel();
    expect(rendered?.closest('.cdk-overlay-container')).toBeTruthy();
    expect(
      rendered
        ?.closest('.cdk-overlay-connected-position-bounding-box')
        ?.classList.contains('cdk-overlay-connected-position-bounding-box'),
    ).toBe(true);
  });

  it('exposes aria-haspopup/aria-expanded/aria-controls on the trigger', () => {
    const { fixture, trigger, panel } = createHost();

    expect(trigger().getAttribute('aria-expanded')).toBe('false');
    expect(trigger().getAttribute('aria-haspopup')).toBe('dialog');

    trigger().click();
    fixture.detectChanges();

    expect(trigger().getAttribute('aria-expanded')).toBe('true');
    expect(trigger().getAttribute('aria-controls')).toBe(panel()?.id);
  });

  it('does not trap focus - Tab can move focus out of the panel while open', async () => {
    const { fixture, trigger, outside } = createHost();

    trigger().click();
    fixture.detectChanges();
    await fixture.whenStable();

    outside().focus();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(document.activeElement).toBe(outside());
  });

  it('moves focus into the panel on open, without trapping it', async () => {
    const { fixture, trigger, first } = createHost();

    trigger().click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(document.activeElement).toBe(first());
  });

  it('restores focus to the trigger on close', async () => {
    const { fixture, trigger } = createHost();

    trigger().focus();
    trigger().click();
    fixture.detectChanges();
    await fixture.whenStable();

    pressEscape();
    fixture.detectChanges();

    expect(document.activeElement).toBe(trigger());
  });

  it.each([
    ['top', 'start'],
    ['right', 'center'],
    ['bottom', 'end'],
    ['left', 'center'],
  ] as const)(
    'reflects side=%s align=%s as data attributes on the panel',
    (side, align) => {
      const { fixture, host, trigger, panel } = createHost();
      host.side.set(side);
      host.align.set(align);
      fixture.detectChanges();

      trigger().click();
      fixture.detectChanges();

      expect(panel()?.getAttribute('data-side')).toBe(side);
      expect(panel()?.getAttribute('data-align')).toBe(align);
    },
  );

  it('renders no arrow by default', () => {
    const { fixture, trigger, panel } = createHost();

    trigger().click();
    fixture.detectChanges();

    expect(panel()?.querySelector('.andes-popover-arrow')).toBeFalsy();
  });

  it('renders an arrow when showArrow is set', () => {
    const { fixture, host, trigger, panel } = createHost();
    host.showArrow.set(true);
    fixture.detectChanges();

    trigger().click();
    fixture.detectChanges();

    const arrow = panel()?.querySelector('.andes-popover-arrow');
    expect(arrow).toBeTruthy();
    expect(arrow?.getAttribute('data-side')).toBe('bottom');
  });

  it('supports controlled usage via the two-way open binding', () => {
    const { fixture, host, panel } = createHost();

    host.open.set(true);
    fixture.detectChanges();

    expect(panel()).toBeTruthy();

    host.open.set(false);
    fixture.detectChanges();

    expect(panel()).toBeNull();
  });

  it('renders no backdrop, matching the non-modal popover preset', () => {
    const { fixture, trigger } = createHost();

    trigger().click();
    fixture.detectChanges();

    expect(document.querySelector('.andes-overlay-backdrop')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Extended features: structured title/content, trigger modes, placements,
// collision handling, destroyOnHidden, zIndex, disabled handling.
// ---------------------------------------------------------------------------

@Component({
  imports: [AndesPopover, AndesPopoverTrigger],
  template: `
    <button type="button" id="outside">Outside</button>
    <input id="other" />
    <andes-popover
      [title]="title()"
      [content]="content()"
      [placement]="placement()"
      [trigger]="trigger()"
      [openDelay]="openDelay()"
      [closeDelay]="closeDelay()"
      [disabled]="disabled()"
      [destroyOnHidden]="destroyOnHidden()"
      [zIndex]="zIndex()"
      [showArrow]="showArrow()"
      [arrowPointAtCenter]="pointAtCenter()"
      [autoAdjustOverflow]="autoAdjust()"
      [maxHeight]="maxHeight()"
      [(open)]="open"
      (openChange)="changes.push($event)"
    >
      <button
        type="button"
        id="trigger"
        andesPopoverTrigger
        [attr.aria-disabled]="triggerDisabled() || null"
      >
        Open
      </button>
    </andes-popover>
    <ng-template #titleTpl><em id="title-tpl">Rich title</em></ng-template>
    <ng-template #bodyTpl>
      <input id="body-input" />
      <span id="body-tpl">Rich body</span>
    </ng-template>
  `,
})
class FeatureHost {
  readonly title = signal<AndesPopoverRenderable | undefined>('Title');
  readonly content = signal<AndesPopoverRenderable | undefined>('Body');
  readonly placement = signal<AndesPopoverPlacement | undefined>(undefined);
  readonly trigger = signal<
    AndesPopoverTriggerAction | AndesPopoverTriggerAction[]
  >('click');
  readonly openDelay = signal(100);
  readonly closeDelay = signal(100);
  readonly disabled = signal(false);
  readonly destroyOnHidden = signal(false);
  readonly zIndex = signal<number | undefined>(undefined);
  readonly showArrow = signal(false);
  readonly pointAtCenter = signal(false);
  readonly autoAdjust = signal(true);
  readonly maxHeight = signal<number | string | undefined>(undefined);
  readonly triggerDisabled = signal(false);
  readonly open = signal(false);
  readonly changes: boolean[] = [];
  readonly titleTpl = viewChild.required<TemplateRef<unknown>>('titleTpl');
  readonly bodyTpl = viewChild.required<TemplateRef<unknown>>('bodyTpl');
}

@Component({
  imports: [AndesPopover, AndesPopoverTrigger, AndesButton],
  template: `
    <andes-popover title="Static title" content="Body">
      <andes-button id="wrapper" andesPopoverTrigger>Open</andes-button>
    </andes-popover>
    <andes-popover content="Body">
      <andes-button id="disabled-wrapper" andesPopoverTrigger disabled
        >Disabled</andes-button
      >
    </andes-popover>
  `,
})
class WrapperHost {}

describe('AndesPopover - extended features', () => {
  withElementGeometry();

  function setup() {
    const fixture = TestBed.createComponent(FeatureHost);
    fixture.detectChanges();
    const host = fixture.componentInstance;
    const byId = (id: string) => document.getElementById(id) as HTMLElement;
    const panel = () =>
      document.querySelector('.andes-popover-content') as HTMLElement | null;
    const overlay = fixture.debugElement
      .query(By.directive(AndesPopover))
      .injector.get(AndesOverlayPrimitive);
    const update = () => fixture.detectChanges();
    return {
      fixture,
      host,
      byId,
      panel,
      overlay,
      update,
      trigger: () => byId('trigger'),
    };
  }

  function fire(element: Element, type: string, init: EventInit = {}) {
    const event = new MouseEvent(type, {
      bubbles: true,
      cancelable: true,
      ...init,
    });
    element.dispatchEvent(event);
    return event;
  }

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('maxHeight', () => {
    it('leaves the panel uncapped by default', () => {
      const { trigger, panel, update } = setup();
      trigger().click();
      update();

      expect(panel()?.hasAttribute('data-scrollable')).toBe(false);
      expect(
        panel()?.style.getPropertyValue('--andes-popover-max-height'),
      ).toBe('');
      expect(
        panel()
          ?.querySelector('.andes-popover-scroll')
          ?.hasAttribute('tabindex'),
      ).toBe(false);
    });

    it('caps the panel at a px number and scrolls only the region below the title', () => {
      const { host, trigger, panel, update } = setup();
      host.maxHeight.set(240);
      update();
      trigger().click();
      update();

      const surface = panel() as HTMLElement;
      expect(surface.hasAttribute('data-scrollable')).toBe(true);
      expect(surface.style.getPropertyValue('--andes-popover-max-height')).toBe(
        '240px',
      );
      const scroll = surface.querySelector('.andes-popover-scroll');
      expect(scroll?.querySelector('.andes-popover-body')).not.toBeNull();
      // The title stays outside the scrolling region, so it remains in view.
      expect(scroll?.querySelector('.andes-popover-title')).toBeNull();
      expect(
        surface.querySelector(':scope > .andes-popover-title'),
      ).not.toBeNull();
      // A tab stop, so long text can be scrolled from the keyboard.
      expect(scroll?.getAttribute('tabindex')).toBe('0');
    });

    it('passes a CSS length through unchanged', () => {
      const { host, trigger, panel, update } = setup();
      host.maxHeight.set('50vh');
      update();
      trigger().click();
      update();

      expect(
        panel()?.style.getPropertyValue('--andes-popover-max-height'),
      ).toBe('50vh');
    });

    it('scrolls the inner region, never the surface the arrow hangs off', () => {
      const css = readFileSync(
        'packages/ui/src/lib/popover/popover-content.css',
        'utf8',
      );
      const surface =
        /\.andes-popover-content\[data-scrollable\] \{([^}]*)\}/.exec(
          css,
        )?.[1] ?? '';
      expect(surface).toContain('max-height: var(--andes-popover-max-height);');
      expect(surface).not.toContain('overflow');
      const region =
        /\.andes-popover-content\[data-scrollable\] > \.andes-popover-scroll \{([^}]*)\}/.exec(
          css,
        )?.[1] ?? '';
      expect(region).toContain('overflow-y: auto;');
      expect(region).toContain('min-height: 0;');
    });
  });

  describe('title and content', () => {
    it('renders string title and content as structured header/body parts', () => {
      const { trigger, panel, update } = setup();
      trigger().click();
      update();

      const title = panel()?.querySelector('.andes-popover-title');
      const body = panel()?.querySelector('.andes-popover-body');
      expect(title?.textContent?.trim()).toBe('Title');
      expect(body?.textContent?.trim()).toBe('Body');
      expect(panel()?.getAttribute('role')).toBe('dialog');
      expect(panel()?.getAttribute('aria-labelledby')).toBe(title?.id);
    });

    it('sets a 14/20 medium title over 13/20 muted text on a 14/20 panel', () => {
      const { trigger, panel, update } = setup();
      trigger().click();
      update();

      const surface = getComputedStyle(panel() as Element);
      expectLength(surface.fontSize, '0.875rem');
      expectLength(surface.lineHeight, '1.25rem');
      const title = getComputedStyle(
        panel()?.querySelector('.andes-popover-title') as Element,
      );
      expectLength(title.fontSize, '0.875rem');
      expectLength(title.lineHeight, '1.25rem');
      expect(title.fontWeight).toBe('500');
      const body = getComputedStyle(
        panel()?.querySelector('.andes-popover-body') as Element,
      );
      expectLength(body.fontSize, '0.8125rem');
      expectLength(body.lineHeight, '1.25rem');
    });

    it('pads 12px by 16px measured to the outer edge, with the soft shadow and an 8px radius', () => {
      const css = readFileSync(
        'packages/ui/src/lib/popover/popover-content.css',
        'utf8',
      );
      expect(css).toContain('var(--andes-popover-padding, 0.75rem)');
      expect(css).toContain('var(--andes-popover-padding, 1rem)');
      expect(css).toContain('calc(var(--_pad-block) - 1px)');
      expect(css).toContain('0 6px 16px 0 rgb(0 0 0 / 8%)');
      expect(css).toContain(
        'var(--andes-popover-radius, var(--andes-radius-lg))',
      );
    });

    it('enters with a soft 200ms fade, a 6px drift and a 0.97 scale on a long ease-out', () => {
      // Read from the stylesheet source: jsdom runs no transitions.
      const css = readFileSync(
        'packages/ui/src/lib/popover/popover-content.css',
        'utf8',
      );
      expect(css).toContain(
        '--_duration: var(--andes-popover-duration, 200ms);',
      );
      expect(css).toContain(
        '--_ease: var(--andes-popover-ease, cubic-bezier(0.16, 1, 0.3, 1));',
      );
      expect(css).toContain('--_distance: var(--andes-popover-distance, 6px);');
      expect(css).toContain('--_scale: var(--andes-popover-scale, 0.97);');
      const starting =
        /@starting-style\s*\{([\s\S]*?)\n\}/.exec(css)?.[1] ?? '';
      expect(starting).toContain('opacity: 0;');
      expect(starting).toContain('translate: var(--_from);');
      expect(starting).toContain('scale: var(--_scale);');
    });

    it('drifts in from the side of the trigger for each of the four sides', () => {
      const css = readFileSync(
        'packages/ui/src/lib/popover/popover-content.css',
        'utf8',
      );
      expect(css).toContain('--_from: 0 calc(var(--_distance) * -1);');
      expect(css).toContain(
        "[data-side='top'] {\n  --_from: 0 var(--_distance);",
      );
      expect(css).toContain(
        "[data-side='left'] {\n  --_from: var(--_distance) 0;",
      );
      expect(css).toContain(
        "[data-side='right'] {\n  --_from: calc(var(--_distance) * -1) 0;",
      );
    });

    it('grows from the arrow tip: the side of the trigger, at the trigger position, mirrored for rtl', () => {
      const css = readFileSync(
        'packages/ui/src/lib/popover/popover-content.css',
        'utf8',
      );
      expect(css).toContain(
        'transform-origin: var(--andes-popover-origin, var(--_along, 50%)) 100%;',
      );
      expect(css).toContain(
        'transform-origin: 100% var(--andes-popover-origin, var(--_along, 50%));',
      );
      expect(css).toContain(
        'transform-origin: 0 var(--andes-popover-origin, var(--_along, 50%));',
      );
      expect(css).toContain(
        "[data-align='start']:dir(rtl) {\n  --_along: calc(100% - 20px);",
      );
      expect(css).toContain("[data-align='end']:dir(rtl) {\n  --_along: 20px;");
    });

    it('measures where the motion grows from once the panel is laid out', async () => {
      const { fixture, trigger, panel, update } = setup();
      vi.spyOn(
        HTMLElement.prototype,
        'getBoundingClientRect',
      ).mockImplementation(function (this: HTMLElement) {
        const box =
          this.id === 'trigger'
            ? { left: 300, top: 100, width: 100, height: 30 }
            : this.classList.contains('cdk-overlay-pane')
              ? { left: 200, top: 138, width: 240, height: 80 }
              : { left: 0, top: 0, width: 0, height: 0 };
        return {
          ...box,
          x: box.left,
          y: box.top,
          right: box.left + box.width,
          bottom: box.top + box.height,
          toJSON: () => ({}),
        } as DOMRect;
      });
      trigger().click();
      update();
      await fixture.whenStable();
      update();

      // Trigger centre 350 - panel left 200.
      expect(panel()?.style.getPropertyValue('--andes-popover-origin')).toBe(
        '150px',
      );
    });

    it('leaves with a quicker, softer ease-in once the overlay marks it closing', () => {
      const css = readFileSync(
        'packages/ui/src/lib/popover/popover-content.css',
        'utf8',
      );
      // A `:host-context()` rule never matches an unencapsulated stylesheet, which is why the
      // exit used to be skipped: the rule has to key off the attribute on an ancestor.
      expect(css).not.toContain(':host-context');
      expect(css).toContain(
        '--_exit-duration: var(--andes-popover-exit-duration, 140ms);',
      );
      expect(css).toContain(
        '--_exit-ease: var(--andes-popover-exit-ease, cubic-bezier(0.4, 0, 1, 1));',
      );
      const rule =
        /\[data-andes-closing\] \.andes-popover-content \{([^}]*)\}/.exec(
          css,
        )?.[1] ?? '';
      expect(rule).toContain('opacity: 0;');
      expect(rule).toContain('translate: var(--_from);');
      expect(rule).toContain('scale: var(--_scale);');
      expect(rule).toContain('var(--_exit-duration) var(--_exit-ease)');
    });

    it('is shorter in every respect, and fade-only, with reduced motion', () => {
      const css = readFileSync(
        'packages/ui/src/lib/popover/popover-content.css',
        'utf8',
      );
      const reduced =
        /@media \(prefers-reduced-motion: reduce\) \{([\s\S]*?)\n\}/.exec(
          css,
        )?.[1] ?? '';
      expect(reduced).toContain('--_distance: 0px;');
      expect(reduced).toContain('--_scale: 1;');
      expect(reduced).toContain('--_duration: 80ms;');
      expect(reduced).toContain('--_exit-duration: 0ms;');
    });

    it('draws the arrow as two stacked path layers on whole pixels, based on the panel border', () => {
      const css = readFileSync(
        'packages/ui/src/lib/popover/popover-content.css',
        'utf8',
      );
      // 16px by 9px: 8px of arrow and the 1px of the panel border it overlaps.
      expect(css).toMatch(
        /\.andes-popover-arrow \{[^}]*width: 16px;[^}]*height: 9px;/,
      );
      const paths = [...css.matchAll(/clip-path: path\(\s*'([^']+)'/g)].map(
        (m) => m[1],
      );
      expect(paths).toHaveLength(2);
      // The outline starts on the border (y = 8 base line, 9 inner edge), the fill 1px inside.
      expect(paths[0]).toMatch(/^M 0 9 L 0 8 A 4 4 /);
      expect(paths[0]).toMatch(/ A 2 2 0 0 1 /);
      expect(paths[0]).toMatch(/A 4 4 0 0 0 16 8 L 16 9 Z$/);
      expect(paths[1]).toMatch(/^M 0 9 A 5 5 /);
      expect(paths[1]).toMatch(/ A 1 1 0 0 1 /);
      expect(paths[1]).toMatch(/A 5 5 0 0 0 16 9 Z$/);
      // Whole-pixel placement for each side: base on the surface's outer border edge.
      expect(css).toContain("[data-side='bottom'] {\n  top: -9px;");
      expect(css).toContain("[data-side='top'] {\n  bottom: -2px;");
      expect(css).toContain("[data-side='right'] {\n  left: -9px;");
      expect(css).toContain("[data-side='left'] {\n  right: -9px;");
      expect(css).not.toContain('polygon');
    });

    it('deepens the success and info fills and the warning text for 4.5:1', () => {
      const css = readFileSync(
        'packages/ui/src/lib/popover/popover-content.css',
        'utf8',
      ).replace(/\s+/g, ' ');
      const rule = (color: string) =>
        ruleBody(css, `.andes-popover-content[data-color='${color}']`);
      expect(rule('success')).toContain(
        '--andes-popover-background: color-mix( in srgb, var(--andes-color-success) 80%, #000 );',
      );
      expect(rule('info')).toContain(
        '--andes-popover-background: color-mix( in srgb, var(--andes-color-info) 85%, #000 );',
      );
      expect(rule('warning')).toContain(
        '--andes-popover-foreground: color-mix( in srgb, var(--andes-color-warning-foreground) 70%, #000 );',
      );
    });

    it('sets the body in the muted foreground under a title', () => {
      const css = readFileSync(
        'packages/ui/src/lib/popover/popover-content.css',
        'utf8',
      );
      const rule =
        /\.andes-popover-title \+ \.andes-popover-scroll > \.andes-popover-body \{([^}]*)\}/.exec(
          css,
        )?.[1] ?? '';
      expect(rule).toContain('--andes-popover-muted-foreground');
      expect(rule).toContain('var(--andes-color-muted-foreground)');
    });

    it('renders template title and content', () => {
      const { host, trigger, panel, update } = setup();
      host.title.set(host.titleTpl());
      host.content.set(host.bodyTpl());
      update();
      trigger().click();
      update();

      expect(
        panel()?.querySelector('.andes-popover-title #title-tpl')?.textContent,
      ).toBe('Rich title');
      expect(
        panel()?.querySelector('.andes-popover-body #body-tpl')?.textContent,
      ).toBe('Rich body');
    });

    it('omits the header and aria-labelledby without a title', () => {
      const { host, trigger, panel, update } = setup();
      host.title.set(undefined);
      update();
      trigger().click();
      update();

      expect(panel()?.querySelector('.andes-popover-title')).toBeNull();
      expect(panel()?.hasAttribute('aria-labelledby')).toBe(false);
    });

    it('does not leak a static title attribute onto the host (no native tooltip)', () => {
      const fixture = TestBed.createComponent(WrapperHost);
      fixture.detectChanges();

      expect(
        fixture.nativeElement
          .querySelector('andes-popover')
          .hasAttribute('title'),
      ).toBe(false);
    });
  });

  describe('trigger modes', () => {
    it('hover: opens after openDelay and closes after closeDelay, without moving focus', async () => {
      vi.useFakeTimers();
      const { host, trigger, panel, update, byId } = setup();
      host.trigger.set('hover');
      update();
      byId('other').focus();

      fire(trigger(), 'mouseenter');
      vi.advanceTimersByTime(99);
      update();
      expect(panel()).toBeNull();

      vi.advanceTimersByTime(1);
      update();
      await vi.runOnlyPendingTimersAsync();
      update();
      expect(panel()).toBeTruthy();
      expect(document.activeElement).toBe(byId('other'));

      fire(trigger(), 'mouseleave');
      vi.advanceTimersByTime(100);
      update();
      expect(panel()).toBeNull();
      expect(document.activeElement).toBe(byId('other'));
    });

    it('hover: moving the pointer onto the panel keeps it open', () => {
      vi.useFakeTimers();
      const { host, trigger, panel, update } = setup();
      host.trigger.set('hover');
      host.openDelay.set(0);
      update();

      fire(trigger(), 'mouseenter');
      update();
      expect(panel()).toBeTruthy();

      fire(trigger(), 'mouseleave');
      vi.advanceTimersByTime(50);
      fire(panel() as HTMLElement, 'mouseenter');
      vi.advanceTimersByTime(200);
      update();
      expect(panel()).toBeTruthy();

      fire(panel() as HTMLElement, 'mouseleave');
      vi.advanceTimersByTime(100);
      update();
      expect(panel()).toBeNull();
    });

    it('hover only: a click does not open it', () => {
      const { host, trigger, panel, update } = setup();
      host.trigger.set('hover');
      update();

      trigger().click();
      update();
      expect(panel()).toBeNull();
    });

    it('focus: opens on focus and closes when focus leaves', () => {
      const { host, trigger, panel, update, byId } = setup();
      host.trigger.set('focus');
      update();

      trigger().focus();
      update();
      expect(panel()).toBeTruthy();
      expect(document.activeElement).toBe(trigger());

      byId('other').focus();
      update();
      expect(panel()).toBeNull();
    });

    it('contextMenu: opens on right click and suppresses the native menu', () => {
      const { host, trigger, panel, update } = setup();
      host.trigger.set('contextMenu');
      update();

      trigger().click();
      update();
      expect(panel()).toBeNull();

      const event = fire(trigger(), 'contextmenu');
      update();
      expect(event.defaultPrevented).toBe(true);
      expect(panel()).toBeTruthy();
    });

    it('combined hover + click: a click pins a hover-opened panel', () => {
      vi.useFakeTimers();
      const { host, trigger, panel, update } = setup();
      host.trigger.set(['hover', 'click']);
      host.openDelay.set(0);
      update();

      fire(trigger(), 'mouseenter');
      update();
      expect(panel()).toBeTruthy();

      trigger().click();
      update();
      fire(trigger(), 'mouseleave');
      vi.advanceTimersByTime(500);
      update();
      expect(panel()).toBeTruthy();

      trigger().click();
      update();
      expect(panel()).toBeNull();
    });
  });

  describe('placement', () => {
    it.each([
      ['top', 'top', 'center'],
      ['topLeft', 'top', 'start'],
      ['topRight', 'top', 'end'],
      ['bottom', 'bottom', 'center'],
      ['bottomLeft', 'bottom', 'start'],
      ['bottomRight', 'bottom', 'end'],
      ['left', 'left', 'center'],
      ['leftTop', 'left', 'start'],
      ['leftBottom', 'left', 'end'],
      ['right', 'right', 'center'],
      ['rightTop', 'right', 'start'],
      ['rightBottom', 'right', 'end'],
    ] as const)('%s maps to side=%s align=%s', (placement, side, align) => {
      const { host, trigger, panel, update, overlay } = setup();
      host.placement.set(placement);
      update();
      trigger().click();
      update();

      expect(panel()?.getAttribute('data-side')).toBe(side);
      expect(panel()?.getAttribute('data-align')).toBe(align);
      expect(overlay.config().positioning).toMatchObject({ side, align });
    });
  });

  describe('collision handling and arrow', () => {
    function mockGeometry(rects: {
      trigger: Partial<DOMRect>;
      panel: Partial<DOMRect>;
    }) {
      const toRect = (r: Partial<DOMRect>) => {
        const left = r.left ?? 0;
        const top = r.top ?? 0;
        const width = r.width ?? 0;
        const height = r.height ?? 0;
        return {
          left,
          top,
          width,
          height,
          x: left,
          y: top,
          right: left + width,
          bottom: top + height,
          toJSON: () => ({}),
        } as DOMRect;
      };
      vi.spyOn(
        HTMLElement.prototype,
        'getBoundingClientRect',
      ).mockImplementation(function (this: HTMLElement) {
        if (this.id === 'trigger') {
          return toRect(rects.trigger);
        }
        if (this.classList.contains('cdk-overlay-pane')) {
          return toRect(rects.panel);
        }
        return toRect({});
      });
    }

    it('flips to the opposite side when the preferred one does not fit', async () => {
      const { fixture, trigger, panel, update, overlay } = setup();
      const viewportHeight = window.innerHeight;
      mockGeometry({
        trigger: { left: 100, top: viewportHeight - 40, width: 80, height: 30 },
        panel: { left: 60, top: 0, width: 200, height: 120 },
      });

      trigger().click();
      update();
      await fixture.whenStable();
      update();

      expect(panel()?.getAttribute('data-side')).toBe('top');
      expect(overlay.config().positioning).toMatchObject({ side: 'top' });
    });

    it('keeps the requested side when autoAdjustOverflow is off', async () => {
      const { fixture, host, trigger, panel, update } = setup();
      host.autoAdjust.set(false);
      update();
      mockGeometry({
        trigger: {
          left: 100,
          top: window.innerHeight - 40,
          width: 80,
          height: 30,
        },
        panel: { left: 60, top: 0, width: 200, height: 120 },
      });

      trigger().click();
      update();
      await fixture.whenStable();
      update();

      expect(panel()?.getAttribute('data-side')).toBe('bottom');
    });

    it('places a start-aligned arrow near the aligned edge', async () => {
      const { fixture, host, trigger, panel, update } = setup();
      host.placement.set('bottomLeft');
      host.showArrow.set(true);
      update();
      mockGeometry({
        trigger: { left: 100, top: 100, width: 200, height: 30 },
        panel: { left: 100, top: 138, width: 240, height: 80 },
      });

      trigger().click();
      update();
      await fixture.whenStable();
      update();

      const arrow = panel()?.querySelector<HTMLElement>('.andes-popover-arrow');
      expect(
        arrow?.style.getPropertyValue('--andes-popover-arrow-offset'),
      ).toBe('20px');
    });

    it('centres the arrow on the trigger, snapped to a whole device pixel', async () => {
      const { fixture, host, trigger, panel, update } = setup();
      host.showArrow.set(true);
      update();
      // An odd-width trigger puts its center on a half pixel.
      mockGeometry({
        trigger: { left: 100, top: 100, width: 81, height: 30 },
        panel: { left: 20, top: 138, width: 240, height: 80 },
      });

      trigger().click();
      update();
      await fixture.whenStable();
      update();

      // Trigger centre 140.5 rounds to 141; minus the panel left 20 (no border in jsdom).
      const arrow = panel()?.querySelector<HTMLElement>('.andes-popover-arrow');
      expect(
        arrow?.style.getPropertyValue('--andes-popover-arrow-offset'),
      ).toBe('121px');
    });

    it('arrowPointAtCenter shifts the panel so the arrow points at the trigger center', async () => {
      const { fixture, host, trigger, panel, update, overlay } = setup();
      host.placement.set('bottomLeft');
      host.showArrow.set(true);
      host.pointAtCenter.set(true);
      update();
      mockGeometry({
        trigger: { left: 100, top: 100, width: 200, height: 30 },
        panel: { left: 184, top: 138, width: 240, height: 80 },
      });

      trigger().click();
      update();
      await fixture.whenStable();
      update();

      // 200 / 2 - 20px arrow inset (the 8px radius, the 8px half-width, 4px clear).
      expect(overlay.config().positioning).toMatchObject({ alignOffset: 80 });
      const arrow = panel()?.querySelector<HTMLElement>('.andes-popover-arrow');
      expect(
        arrow?.style.getPropertyValue('--andes-popover-arrow-offset'),
      ).toBe('20px');
    });
  });

  describe('arrow offsets for every placement', () => {
    /** [placement, side, align]: the twelve, with the geometry each one implies. */
    const PLACEMENTS_UNDER_TEST: [
      AndesPopoverPlacement,
      'top' | 'bottom' | 'left' | 'right',
      'start' | 'center' | 'end',
    ][] = [
      ['top', 'top', 'center'],
      ['topLeft', 'top', 'start'],
      ['topRight', 'top', 'end'],
      ['bottom', 'bottom', 'center'],
      ['bottomLeft', 'bottom', 'start'],
      ['bottomRight', 'bottom', 'end'],
      ['left', 'left', 'center'],
      ['leftTop', 'left', 'start'],
      ['leftBottom', 'left', 'end'],
      ['right', 'right', 'center'],
      ['rightTop', 'right', 'start'],
      ['rightBottom', 'right', 'end'],
    ];

    it.each(PLACEMENTS_UNDER_TEST)(
      '%s points at the trigger and clears the corner by at least the radius and 4px',
      async (placement, side, align) => {
        const fixture = TestBed.createComponent(FeatureHost);
        const host = fixture.componentInstance;
        host.placement.set(placement);
        host.showArrow.set(true);
        fixture.detectChanges();

        // A 100 x 40 trigger at (400, 300); a 240 x 120 panel lined up the way the
        // alignment says, on the side the placement names.
        const trigger = { left: 400, top: 300, width: 100, height: 40 };
        const size = { width: 240, height: 120 };
        const horizontal = side === 'top' || side === 'bottom';
        const along = (start: number, extent: number, panelExtent: number) =>
          align === 'start'
            ? start
            : align === 'end'
              ? start + extent - panelExtent
              : start + extent / 2 - panelExtent / 2;
        const panel = horizontal
          ? {
              ...size,
              left: along(trigger.left, trigger.width, size.width),
              top:
                side === 'top'
                  ? trigger.top - 8 - size.height
                  : trigger.top + trigger.height + 8,
            }
          : {
              ...size,
              top: along(trigger.top, trigger.height, size.height),
              left:
                side === 'left'
                  ? trigger.left - 8 - size.width
                  : trigger.left + trigger.width + 8,
            };
        const toRect = (r: {
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
        vi.spyOn(
          HTMLElement.prototype,
          'getBoundingClientRect',
        ).mockImplementation(function (this: HTMLElement) {
          if (this.id === 'trigger') {
            return toRect(trigger);
          }
          return this.classList.contains('cdk-overlay-pane')
            ? toRect(panel)
            : toRect({ left: 0, top: 0, width: 0, height: 0 });
        });

        (document.getElementById('trigger') as HTMLElement).click();
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();

        const surface = document.querySelector(
          '.andes-popover-content',
        ) as HTMLElement;
        const arrow = surface.querySelector(
          '.andes-popover-arrow',
        ) as HTMLElement;
        const offset = Number.parseFloat(
          arrow.style.getPropertyValue('--andes-popover-arrow-offset'),
        );
        const start = horizontal ? panel.left : panel.top;
        const extent = horizontal ? panel.width : panel.height;
        const triggerStart = horizontal ? trigger.left : trigger.top;
        const triggerExtent = horizontal ? trigger.width : trigger.height;

        expect(surface.getAttribute('data-side')).toBe(side);
        // Whole pixel, inside the panel, over the trigger.
        expect(Number.isInteger(offset)).toBe(true);
        expect(start + offset).toBeGreaterThanOrEqual(triggerStart);
        expect(start + offset).toBeLessThanOrEqual(
          triggerStart + triggerExtent,
        );
        // The arrow's 16px footprint stays 8px (the radius) + 4px away from both corners.
        expect(offset - 8).toBeGreaterThanOrEqual(8 + 4);
        expect(extent - offset - 8).toBeGreaterThanOrEqual(8 + 4);
        // And a centred panel points at the middle of the trigger.
        if (align === 'center') {
          expect(start + offset).toBe(
            Math.round(triggerStart + triggerExtent / 2),
          );
        }
        fixture.destroy();
      },
    );
  });

  describe('openChange', () => {
    it('emits for changes the popover makes, not for parent writes', () => {
      const { host, trigger, update } = setup();

      host.open.set(true);
      update();
      host.open.set(false);
      update();
      expect(host.changes).toEqual([]);

      trigger().click();
      update();
      trigger().click();
      update();
      expect(host.changes).toEqual([true, false]);
    });

    it('emits false when Escape closes it', () => {
      const { host, trigger, update } = setup();
      trigger().click();
      update();

      document.body.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'Escape',
          keyCode: 27,
          bubbles: true,
        }),
      );
      update();
      expect(host.changes).toEqual([true, false]);
      expect(host.open()).toBe(false);
    });
  });

  describe('destroyOnHidden', () => {
    function typeAndReopen(destroyOnHidden: boolean) {
      const { host, trigger, update, byId } = setup();
      host.content.set(host.bodyTpl());
      host.destroyOnHidden.set(destroyOnHidden);
      update();

      trigger().click();
      update();
      const first = byId('body-input') as HTMLInputElement;
      first.value = 'draft';

      trigger().click();
      update();
      expect(document.getElementById('body-input')).toBeNull();

      trigger().click();
      update();
      const second = byId('body-input') as HTMLInputElement;
      return { first, second };
    }

    it('keeps template content alive between opens by default', () => {
      const { first, second } = typeAndReopen(false);
      expect(second).toBe(first);
      expect(second.value).toBe('draft');
    });

    it('re-creates template content on every open when set', () => {
      const { first, second } = typeAndReopen(true);
      expect(second).not.toBe(first);
      expect(second.value).toBe('');
    });
  });

  it('zIndex overrides the stacking layer', () => {
    const { host, trigger, update, overlay } = setup();
    host.zIndex.set(4242);
    update();
    trigger().click();
    update();

    expect(overlay.panelElement()?.parentElement?.style.zIndex).toBe('4242');
  });

  describe('disabled', () => {
    it('never opens while disabled, and closes when it becomes disabled', () => {
      const { host, trigger, panel, update } = setup();
      host.disabled.set(true);
      update();
      trigger().click();
      update();
      expect(panel()).toBeNull();

      host.disabled.set(false);
      update();
      trigger().click();
      update();
      expect(panel()).toBeTruthy();

      host.disabled.set(true);
      update();
      expect(panel()).toBeNull();
      expect(host.open()).toBe(false);
    });

    it('ignores a trigger marked aria-disabled', () => {
      const { host, trigger, panel, update } = setup();
      host.triggerDisabled.set(true);
      update();
      trigger().click();
      update();
      expect(panel()).toBeNull();
    });

    it('ignores an andes-button trigger whose inner button is disabled', async () => {
      const fixture = TestBed.createComponent(WrapperHost);
      fixture.detectChanges();
      await fixture.whenStable();

      const wrapper = document.getElementById(
        'disabled-wrapper',
      ) as HTMLElement;
      fire(wrapper, 'click');
      fixture.detectChanges();
      expect(document.querySelector('.andes-popover-content')).toBeNull();
    });
  });

  describe('andes-button trigger', () => {
    it('mirrors the trigger ARIA onto the inner button and restores focus to it', async () => {
      const fixture = TestBed.createComponent(WrapperHost);
      fixture.detectChanges();
      await fixture.whenStable();

      const inner = document.querySelector('#wrapper button') as HTMLElement;
      expect(inner.getAttribute('aria-haspopup')).toBe('dialog');
      expect(inner.getAttribute('aria-expanded')).toBe('false');

      inner.focus();
      inner.click();
      fixture.detectChanges();
      await fixture.whenStable();
      expect(inner.getAttribute('aria-expanded')).toBe('true');
      expect(inner.getAttribute('aria-controls')).toBe(
        document.querySelector('.andes-popover-content')?.id,
      );

      document.body.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'Escape',
          keyCode: 27,
          bubbles: true,
        }),
      );
      fixture.detectChanges();
      expect(document.activeElement).toBe(inner);
    });
  });

  it('does not steal focus back from an input clicked outside', async () => {
    const { fixture, host, trigger, panel, update, byId } = setup();
    host.content.set(host.bodyTpl());
    update();
    trigger().click();
    update();
    await fixture.whenStable();
    expect(panel()?.contains(document.activeElement)).toBe(true);

    const other = byId('other');
    other.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    other.focus();
    fire(other, 'click');
    update();

    expect(panel()).toBeNull();
    expect(document.activeElement).toBe(other);
  });
});

// ---------------------------------------------------------------------------
// Composed content: header/title/description parts and the close directive.
// ---------------------------------------------------------------------------

@Component({
  imports: [
    AndesPopover,
    AndesPopoverTrigger,
    AndesPopoverContent,
    AndesPopoverHeader,
    AndesPopoverTitle,
    AndesPopoverDescription,
    AndesPopoverClose,
  ],
  template: `
    <andes-popover [title]="title()" [trigger]="trigger()">
      <button type="button" id="trigger" andesPopoverTrigger>Open</button>
      <andes-popover-content>
        <div andesPopoverHeader id="header">
          @if (showTitle()) {
            <h3 andesPopoverTitle>Dimensions</h3>
          }
          <p andesPopoverDescription id="custom-description">
            Set the dimensions for the layer.
          </p>
        </div>
        <input id="width" />
        <button type="button" id="close" andesPopoverClose>Done</button>
      </andes-popover-content>
    </andes-popover>
  `,
})
class ComposedHost {
  readonly title = signal<AndesPopoverRenderable | undefined>(undefined);
  readonly trigger = signal<AndesPopoverTriggerAction>('click');
  readonly showTitle = signal(true);
}

describe('AndesPopover - composed content', () => {
  withElementGeometry();

  function setup() {
    const fixture = TestBed.createComponent(ComposedHost);
    fixture.detectChanges();
    const byId = (id: string) => document.getElementById(id) as HTMLElement;
    const panel = () =>
      document.querySelector('.andes-popover-content') as HTMLElement | null;
    const update = () => fixture.detectChanges();
    return {
      fixture,
      host: fixture.componentInstance,
      byId,
      panel,
      update,
      trigger: () => byId('trigger'),
    };
  }

  // The description carries an author-supplied static id, which is kept.
  it('labels the panel with the title part and describes it with the description part', () => {
    const { trigger, panel, update } = setup();
    trigger().click();
    update();

    const title = panel()?.querySelector('[andesPopoverTitle]');
    expect(title?.id).toMatch(/^andes-popover-title-\d+$/);
    expect(panel()?.getAttribute('aria-labelledby')).toBe(title?.id);
    expect(panel()?.getAttribute('aria-describedby')).toBe(
      'custom-description',
    );
  });

  it('drops aria-labelledby when the title part is removed', () => {
    const { host, trigger, panel, update } = setup();
    host.showTitle.set(false);
    update();
    trigger().click();
    update();

    expect(panel()?.hasAttribute('aria-labelledby')).toBe(false);
  });

  it('applies the part classes and data-slot hooks', () => {
    const { byId, trigger, panel, update } = setup();
    trigger().click();
    update();

    expect(byId('header').classList).toContain('andes-popover-header');
    expect(panel()?.querySelector('[andesPopoverTitle]')?.classList).toContain(
      'andes-popover-title',
    );
    expect(byId('custom-description').classList).toContain(
      'andes-popover-description',
    );
    expect(byId('close').getAttribute('data-slot')).toBe('popover-close');
  });

  it('combines the title input with a title part in aria-labelledby', () => {
    const { host, trigger, panel, update } = setup();
    host.title.set('From input');
    update();
    trigger().click();
    update();

    const [inputTitle, partTitle] = Array.from(
      panel()?.querySelectorAll('.andes-popover-title') ?? [],
    );
    expect(inputTitle?.textContent?.trim()).toBe('From input');
    expect(panel()?.getAttribute('aria-labelledby')).toBe(
      `${inputTitle?.id} ${partTitle?.id}`,
    );
  });

  it('andesPopoverClose closes the panel and restores focus to the trigger', async () => {
    const { fixture, byId, trigger, panel, update } = setup();
    trigger().focus();
    trigger().click();
    update();
    await fixture.whenStable();
    expect(panel()?.contains(document.activeElement)).toBe(true);

    byId('close').click();
    update();

    expect(panel()).toBeNull();
    expect(document.activeElement).toBe(trigger());
  });

  it('andesPopoverClose leaves focus alone for a hover-opened panel', async () => {
    const { fixture, host, byId, trigger, panel, update } = setup();
    host.trigger.set('hover');
    update();
    vi.useFakeTimers();
    try {
      trigger().dispatchEvent(new MouseEvent('mouseenter'));
      vi.advanceTimersByTime(100);
      update();
      expect(panel()).toBeTruthy();

      byId('width').focus();
      byId('close').click();
      update();
    } finally {
      vi.useRealTimers();
    }
    await fixture.whenStable();

    expect(panel()).toBeNull();
    expect(document.activeElement).not.toBe(trigger());
  });

  it('reports the close through the open model', () => {
    const { fixture, byId, trigger, update } = setup();
    const popover = fixture.debugElement
      .query(By.directive(AndesPopover))
      .injector.get(AndesPopover);
    trigger().click();
    update();
    expect(popover.open()).toBe(true);

    byId('close').click();
    update();

    expect(popover.open()).toBe(false);
  });
});

@Component({
  imports: [AndesPopover, AndesPopoverTrigger],
  template: `
    <andes-popover title="Legacy title" content="Legacy body">
      <button type="button" id="trigger" andesPopoverTrigger>Open</button>
    </andes-popover>
  `,
})
class LegacyHost {}

describe('AndesPopover - legacy title/content inputs', () => {
  it('still renders and labels the panel from the inputs alone', () => {
    const fixture = TestBed.createComponent(LegacyHost);
    fixture.detectChanges();
    (document.getElementById('trigger') as HTMLElement).click();
    fixture.detectChanges();

    const panel = document.querySelector('.andes-popover-content');
    const title = panel?.querySelector('.andes-popover-title');
    expect(title?.textContent?.trim()).toBe('Legacy title');
    expect(
      panel?.querySelector('.andes-popover-body')?.textContent?.trim(),
    ).toBe('Legacy body');
    expect(panel?.getAttribute('aria-labelledby')).toBe(title?.id);
    expect(panel?.hasAttribute('aria-describedby')).toBe(false);
  });
});

@Component({
  imports: [
    AndesPopover,
    AndesPopoverTrigger,
    AndesPopoverContent,
    AndesPopoverClose,
  ],
  template: `
    <andes-popover [color]="color()" [content]="body" [(open)]="open">
      <button type="button" id="trigger" andesPopoverTrigger>Open</button>
    </andes-popover>
    <ng-template #body>
      <button type="button" id="done" andesPopoverClose>Done</button>
    </ng-template>
    <andes-popover [(open)]="projectedOpen">
      <button type="button" id="trigger2" andesPopoverTrigger>Open</button>
      <andes-popover-content>
        <button type="button" id="done2" andesPopoverClose>Done</button>
      </andes-popover-content>
    </andes-popover>
  `,
})
class ColorAndCloseHostComponent {
  readonly color = signal<string | null>(null);
  readonly open = signal(false);
  readonly projectedOpen = signal(false);
}

describe('AndesPopover - color and close-from-content', () => {
  withElementGeometry();

  function createHost() {
    const fixture = TestBed.createComponent(ColorAndCloseHostComponent);
    fixture.detectChanges();
    const panel = () =>
      document.querySelector('.andes-popover-content') as HTMLElement | null;
    return { fixture, host: fixture.componentInstance, panel };
  }

  it('marks a preset color on the panel without an inline background', () => {
    const { fixture, host, panel } = createHost();
    host.color.set('success');
    host.open.set(true);
    fixture.detectChanges();

    expect(panel()?.getAttribute('data-color')).toBe('success');
    expect(panel()?.style.getPropertyValue('--andes-popover-background')).toBe(
      '',
    );
  });

  it('paints a custom color through --andes-popover-background', () => {
    const { fixture, host, panel } = createHost();
    host.color.set('#7c3aed');
    host.open.set(true);
    fixture.detectChanges();

    expect(panel()?.getAttribute('data-color')).toBe('custom');
    expect(panel()?.style.getPropertyValue('--andes-popover-background')).toBe(
      '#7c3aed',
    );
  });

  it('leaves the regular surface without a color', () => {
    const { fixture, host, panel } = createHost();
    host.open.set(true);
    fixture.detectChanges();

    expect(panel()?.hasAttribute('data-color')).toBe(false);
  });

  it('andesPopoverClose closes the popover from TemplateRef content', () => {
    const { fixture, host, panel } = createHost();
    host.open.set(true);
    fixture.detectChanges();

    (document.querySelector('#done') as HTMLElement).click();
    fixture.detectChanges();

    expect(host.open()).toBe(false);
    expect(panel()).toBeNull();
  });

  it('andesPopoverClose closes the popover from projected content', () => {
    const { fixture, host } = createHost();
    host.projectedOpen.set(true);
    fixture.detectChanges();

    (document.querySelector('#done2') as HTMLElement).click();
    fixture.detectChanges();

    expect(host.projectedOpen()).toBe(false);
  });

  it('close() closes an open popover and reports it through openChange', () => {
    const { fixture, host } = createHost();
    host.open.set(true);
    fixture.detectChanges();

    const popover = fixture.debugElement
      .query(By.directive(AndesPopover))
      .injector.get(AndesPopover);
    popover.close();
    fixture.detectChanges();

    expect(host.open()).toBe(false);
  });
});

/** The declarations between the braces of the rule whose selector is exactly `selector`. */
function ruleBody(css: string, selector: string): string {
  let from = 0;
  for (;;) {
    const at = css.indexOf(selector, from);
    if (at < 0) {
      return '';
    }
    const end = at + selector.length;
    const open = css.indexOf('{', end);
    if (open >= 0 && css.slice(end, open).trim() === '') {
      return css.slice(open + 1, css.indexOf('}', open));
    }
    from = at + 1;
  }
}
