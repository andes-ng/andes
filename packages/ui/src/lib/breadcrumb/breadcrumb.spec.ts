import { AndesOverlayPrimitive } from '@andes-ng/primitives';
import { Component, signal, type TemplateRef, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { readFileSync } from 'node:fs';

import { declaredValue } from '../../testing/computed-style';
import { AndesDropdownMenu } from '../dropdown-menu/dropdown-menu';
import {
  AndesBreadcrumb,
  AndesBreadcrumbEllipsis,
  type AndesBreadcrumbEllipsisItem,
  AndesBreadcrumbItem,
  AndesBreadcrumbLink,
  AndesBreadcrumbList,
  AndesBreadcrumbPage,
  AndesBreadcrumbSeparator,
} from './breadcrumb';
import type {
  AndesBreadcrumbClassNames,
  AndesBreadcrumbItemClickEvent,
  AndesBreadcrumbItemRenderContext,
  AndesBreadcrumbItemType,
  AndesBreadcrumbMenuClickEvent,
  AndesBreadcrumbMenuOpenChangeEvent,
  AndesBreadcrumbSeparatorContent,
  AndesBreadcrumbStyles,
} from './breadcrumb-items';

/**
 * jsdom reports zero geometry for every element, which makes CDK's `InteractivityChecker` treat
 * them all as invisible and therefore untabbable - the interactive ellipsis opens a real CDK
 * overlay, so it needs the same shim `dropdown-menu.spec.ts` and `overlay-primitive.spec.ts` use.
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

/** `ListKeyManager` reads the deprecated-but-universal `KeyboardEvent.keyCode`. */
const KEY_CODES: Record<string, number> = {
  ArrowUp: 38,
  ArrowDown: 40,
  Home: 36,
  End: 35,
  Tab: 9,
  Enter: 13,
  Escape: 27,
  ' ': 32,
};

function pressKey(target: EventTarget, key: string): KeyboardEvent {
  const event = new KeyboardEvent('keydown', {
    key,
    bubbles: true,
    cancelable: true,
  });
  const keyCode = KEY_CODES[key] ?? key.toUpperCase().charCodeAt(0);
  Object.defineProperty(event, 'keyCode', { get: () => keyCode });
  target.dispatchEvent(event);
  return event;
}

/** The overlay dismisses on `pointerdown`, which `HTMLElement.click()` alone does not fire. */
function clickOn(element: Element): void {
  element.dispatchEvent(
    new PointerEvent('pointerdown', { bubbles: true, cancelable: true }),
  );
  element.dispatchEvent(
    new MouseEvent('click', { bubbles: true, cancelable: true }),
  );
}

@Component({
  imports: [
    AndesBreadcrumb,
    AndesBreadcrumbList,
    AndesBreadcrumbItem,
    AndesBreadcrumbLink,
    AndesBreadcrumbPage,
    AndesBreadcrumbSeparator,
  ],
  template: `
    <andes-breadcrumb>
      <ol andesBreadcrumbList>
        <li andesBreadcrumbItem>
          <a andesBreadcrumbLink href="/">Home</a>
        </li>
        <li andesBreadcrumbSeparator></li>
        <li andesBreadcrumbItem>
          <a andesBreadcrumbLink href="/library">Library</a>
        </li>
        <li andesBreadcrumbSeparator></li>
        <li andesBreadcrumbItem>
          <span andesBreadcrumbPage>Data</span>
        </li>
      </ol>
    </andes-breadcrumb>
  `,
})
class TrailHostComponent {}

describe('Breadcrumb', () => {
  function createTrail() {
    const fixture = TestBed.createComponent(TrailHostComponent);
    fixture.detectChanges();
    const nav = fixture.nativeElement.querySelector('nav') as HTMLElement;
    return { fixture, nav };
  }

  it('renders a nav landmark labelled "breadcrumb" by default', () => {
    const { nav } = createTrail();

    expect(nav.tagName).toBe('NAV');
    expect(nav.getAttribute('aria-label')).toBe('breadcrumb');
  });

  it('allows overriding the aria-label for localization', () => {
    @Component({
      imports: [AndesBreadcrumb],
      template: `<andes-breadcrumb aria-label="Ruta de navegación" />`,
    })
    class LocalizedHost {}

    const fixture = TestBed.createComponent(LocalizedHost);
    fixture.detectChanges();
    const nav = fixture.nativeElement.querySelector('nav') as HTMLElement;

    expect(nav.getAttribute('aria-label')).toBe('Ruta de navegación');
  });

  it('renders aria-label only on the <nav>, never duplicated onto the <andes-breadcrumb> host', () => {
    @Component({
      imports: [AndesBreadcrumb],
      template: `<andes-breadcrumb aria-label="Ruta de navegación" />`,
    })
    class LocalizedHost {}

    const fixture = TestBed.createComponent(LocalizedHost);
    fixture.detectChanges();
    const host = fixture.nativeElement.querySelector(
      'andes-breadcrumb',
    ) as HTMLElement;
    const nav = host.querySelector('nav') as HTMLElement;

    expect(nav.getAttribute('aria-label')).toBe('Ruta de navegación');
    // Angular writes a static/bound attribute matching an input's alias to both the component's
    // own template AND its host element unless the host metadata explicitly nulls it out - this
    // asserts that nulling actually took effect and the host isn't a second element in the a11y
    // tree with the same accessible name as the nav landmark it wraps.
    expect(host.hasAttribute('aria-label')).toBe(false);
  });

  it('reaches the <nav> when aria-label is bound dynamically (as the Storybook control does)', () => {
    @Component({
      imports: [AndesBreadcrumb],
      template: `<andes-breadcrumb [aria-label]="label" />`,
    })
    class DynamicHost {
      label = 'Ruta dinámica';
    }

    const fixture = TestBed.createComponent(DynamicHost);
    fixture.detectChanges();
    const host = fixture.nativeElement.querySelector(
      'andes-breadcrumb',
    ) as HTMLElement;
    const nav = host.querySelector('nav') as HTMLElement;

    expect(nav.getAttribute('aria-label')).toBe('Ruta dinámica');
    expect(host.hasAttribute('aria-label')).toBe(false);
  });

  it('renders the ol/li structure with no intervening wrapper elements', () => {
    const { nav } = createTrail();
    const list = nav.querySelector('ol') as HTMLOListElement;

    expect(list.classList).toContain('andes-breadcrumb-list');
    expect(
      Array.from(list.children).every((child) => child.tagName === 'LI'),
    ).toBe(true);
    expect(list.children.length).toBe(5);
  });

  it('renders crumb links with their href and text preserved', () => {
    const { nav } = createTrail();
    const links = Array.from(nav.querySelectorAll('a')) as HTMLAnchorElement[];

    expect(links).toHaveLength(2);
    expect(links[0].getAttribute('href')).toBe('/');
    expect(links[0].textContent?.trim()).toBe('Home');
    expect(links[0].classList).toContain('andes-breadcrumb-link');
    expect(links[1].getAttribute('href')).toBe('/library');
  });

  it('marks only the last crumb as the current page with aria-current', () => {
    const { nav } = createTrail();
    const page = nav.querySelector('.andes-breadcrumb-page') as HTMLElement;

    expect(page.tagName).toBe('SPAN');
    expect(page.getAttribute('aria-current')).toBe('page');
    expect(page.getAttribute('aria-disabled')).toBe('true');
    expect(page.getAttribute('role')).toBe('link');
    expect(page.textContent?.trim()).toBe('Data');
    // aria-current must not leak onto the non-current crumbs.
    for (const link of Array.from(nav.querySelectorAll('a'))) {
      expect(link.hasAttribute('aria-current')).toBe(false);
    }
  });

  it('renders separators as presentational and hidden from assistive tech', () => {
    const { nav } = createTrail();
    const separators = Array.from(
      nav.querySelectorAll('.andes-breadcrumb-separator'),
    ) as HTMLElement[];

    expect(separators).toHaveLength(2);
    for (const separator of separators) {
      expect(separator.tagName).toBe('LI');
      expect(separator.getAttribute('role')).toBe('presentation');
      expect(separator.getAttribute('aria-hidden')).toBe('true');
    }
  });

  it('renders a default chevron icon in the separator when nothing is projected', async () => {
    const { fixture, nav } = createTrail();
    // The default icon is inserted imperatively after the first render (afterNextRender).
    await fixture.whenStable();
    const separator = nav.querySelector(
      '.andes-breadcrumb-separator',
    ) as HTMLElement;

    expect(
      separator.querySelector('svg.andes-breadcrumb-separator__icon'),
    ).toBeTruthy();
  });

  it('renders custom projected content in the separator instead of the default icon', async () => {
    @Component({
      imports: [AndesBreadcrumbSeparator],
      template: `<li andesBreadcrumbSeparator>/</li>`,
    })
    class CustomSeparatorHost {}

    const fixture = TestBed.createComponent(CustomSeparatorHost);
    fixture.detectChanges();
    await fixture.whenStable();
    const separator = fixture.nativeElement.querySelector('li') as HTMLElement;

    expect(separator.textContent?.trim()).toBe('/');
    expect(separator.querySelector('svg')).toBeFalsy();
  });

  it('renders the ellipsis as presentational with a default icon and sr-only text', () => {
    @Component({
      imports: [AndesBreadcrumbEllipsis],
      template: `<andes-breadcrumb-ellipsis></andes-breadcrumb-ellipsis>`,
    })
    class EllipsisHost {}

    const fixture = TestBed.createComponent(EllipsisHost);
    fixture.detectChanges();
    const ellipsis = fixture.nativeElement.querySelector(
      'andes-breadcrumb-ellipsis',
    ) as HTMLElement;

    expect(ellipsis.getAttribute('role')).toBe('presentation');
    expect(ellipsis.getAttribute('aria-hidden')).toBe('true');
    expect(
      ellipsis.querySelector('svg.andes-breadcrumb-ellipsis__icon'),
    ).toBeTruthy();
    expect(
      ellipsis.querySelector('.andes-breadcrumb-ellipsis__sr-only')
        ?.textContent,
    ).toBe('More');
  });

  it('supports a collapsed trail with an ellipsis item between two real crumbs', async () => {
    @Component({
      imports: [
        AndesBreadcrumb,
        AndesBreadcrumbList,
        AndesBreadcrumbItem,
        AndesBreadcrumbLink,
        AndesBreadcrumbEllipsis,
        AndesBreadcrumbSeparator,
        AndesBreadcrumbPage,
      ],
      template: `
        <andes-breadcrumb>
          <ol andesBreadcrumbList>
            <li andesBreadcrumbItem>
              <a andesBreadcrumbLink href="/">Home</a>
            </li>
            <li andesBreadcrumbSeparator></li>
            <li andesBreadcrumbItem>
              <andes-breadcrumb-ellipsis></andes-breadcrumb-ellipsis>
            </li>
            <li andesBreadcrumbSeparator></li>
            <li andesBreadcrumbItem>
              <span andesBreadcrumbPage>Current</span>
            </li>
          </ol>
        </andes-breadcrumb>
      `,
    })
    class CollapsedHost {}

    const fixture = TestBed.createComponent(CollapsedHost);
    fixture.detectChanges();
    await fixture.whenStable();
    const nav = fixture.nativeElement as HTMLElement;

    expect(nav.querySelector('andes-breadcrumb-ellipsis')).toBeTruthy();
    expect(
      nav.querySelector('.andes-breadcrumb-page')?.textContent?.trim(),
    ).toBe('Current');
  });

  // Regression coverage for breadcrumb.css being dead CSS: AndesBreadcrumbList/Item/Link/Page/
  // Separator are directives applied to elements the consumer authors and Angular projects in
  // via <ng-content>, so under the default (Emulated) view encapsulation those elements never
  // carry AndesBreadcrumb's own scope attribute and its stylesheet's selectors never match them.
  // A test asserting `list.classList.toContain('andes-breadcrumb-list')` (as earlier tests in
  // this file do, for structural coverage) would stay green even if every rule in breadcrumb.css
  // were dead, because it never asks the browser/jsdom CSS engine to actually resolve a
  // selector - only real computed styles, read off the actually-compiled component, can catch
  // that regression.
  describe('applies real layout/color styles to the projected list (not dead CSS)', () => {
    function renderStyledTrail() {
      const fixture = TestBed.createComponent(TrailHostComponent);
      fixture.detectChanges();
      const nav = fixture.nativeElement.querySelector('nav') as HTMLElement;
      const list = nav.querySelector('ol') as HTMLOListElement;
      const item = nav.querySelector('li') as HTMLLIElement;
      const link = nav.querySelector('a') as HTMLAnchorElement;
      const separator = nav.querySelector(
        '.andes-breadcrumb-separator',
      ) as HTMLElement;
      return { fixture, list, item, link, separator };
    }

    it('lays the <ol> out as a wrapping, centered flex row with a real gap', () => {
      const { list } = renderStyledTrail();
      const style = getComputedStyle(list);

      expect(style.display).toBe('flex');
      expect(style.flexWrap).toBe('wrap');
      expect(style.alignItems).toBe('center');
      // Not asserting the literal --andes-space-2 value: jsdom's CSSOM doesn't resolve custom
      // properties, but a non-empty/non-"normal" gap still proves the rule (and not the
      // display: block browser default for <ol>, which has no gap at all) actually matched.
      expect(style.gap).not.toBe('');
      expect(style.gap).not.toBe('normal');
      expect(style.margin).toBe('0px');
      expect(style.getPropertyValue('list-style')).toBe('none');
    });

    it('sets the trail in 14/22 body text', () => {
      const { list } = renderStyledTrail();
      const style = getComputedStyle(list);

      expect(style.fontSize).toBe('var(--andes-text-font-size, 0.875rem)');
      expect(style.lineHeight).toBe('var(--andes-text-line-height, 1.375rem)');
    });

    it('lays each <li> item out as a centered inline-flex group', () => {
      const { item } = renderStyledTrail();
      const style = getComputedStyle(item);

      expect(style.display).toBe('inline-flex');
      expect(style.alignItems).toBe('center');
    });

    it('styles the crumb <a> as a plain, underline-free link (not the browser default blue)', () => {
      const { link } = renderStyledTrail();
      const style = getComputedStyle(link);

      expect(style.getPropertyValue('text-decoration')).toBe('none');
      // jsdom's UA stylesheet gives an unstyled <a> "rgb(0, 0, 238)" - proving the color is no
      // longer that default (it now inherits --andes-color-muted-foreground from the list) is
      // enough to show `.andes-breadcrumb-link` actually matched, without hard-coding a
      // resolved token value jsdom won't compute anyway.
      expect(style.color).not.toBe('rgb(0, 0, 238)');
    });

    it('lays the separator out inline and sizes its default chevron icon explicitly', async () => {
      const { fixture, separator } = renderStyledTrail();
      await fixture.whenStable();
      const style = getComputedStyle(separator);
      const svg = separator.querySelector('svg') as SVGElement;

      expect(style.display).toBe('inline-flex');
      expect(style.alignItems).toBe('center');
      // The default chevron is inserted imperatively via Renderer2 (see breadcrumb.ts) using the
      // consumer's own renderer, so it can never be reached by breadcrumb.css's scoped selectors
      // either - it must carry an explicit size so it can't fall back to a replaced element's
      // ~300x150px browser default.
      expect(svg.getAttribute('width')).toBe('14');
      expect(svg.getAttribute('height')).toBe('14');
    });
  });

  // Interactive ellipsis: a non-empty `[items]` turns the "..." into an AndesDropdownMenu
  // trigger listing the crumbs collapsed behind it.
  describe('AndesBreadcrumbEllipsis with collapsed items', () => {
    withElementGeometry();

    @Component({
      imports: [
        AndesBreadcrumb,
        AndesBreadcrumbList,
        AndesBreadcrumbItem,
        AndesBreadcrumbLink,
        AndesBreadcrumbSeparator,
        AndesBreadcrumbPage,
        AndesBreadcrumbEllipsis,
      ],
      template: `
        <button type="button" id="outside">Outside</button>
        <andes-breadcrumb>
          <ol andesBreadcrumbList>
            <li andesBreadcrumbItem>
              <a andesBreadcrumbLink href="/">Home</a>
            </li>
            <li andesBreadcrumbSeparator></li>
            <li andesBreadcrumbItem>
              <andes-breadcrumb-ellipsis
                [items]="hidden()"
                [label]="label()"
                (itemSelected)="selected.set($event)"
              ></andes-breadcrumb-ellipsis>
            </li>
            <li andesBreadcrumbSeparator></li>
            <li andesBreadcrumbItem>
              <span andesBreadcrumbPage>Breadcrumb</span>
            </li>
          </ol>
        </andes-breadcrumb>
      `,
    })
    class CollapsedDropdownHost {
      readonly hidden = signal<AndesBreadcrumbEllipsisItem[]>([
        { label: 'Documentation', href: '/docs' },
        { label: 'Building Your Application', href: '/docs/building' },
        { label: 'Data Fetching', href: '/docs/building/data-fetching' },
      ]);
      readonly label = signal('More');
      readonly selected = signal<AndesBreadcrumbEllipsisItem | null>(null);
    }

    function createCollapsed() {
      const fixture = TestBed.createComponent(CollapsedDropdownHost);
      fixture.detectChanges();

      const root = fixture.nativeElement as HTMLElement;

      return {
        fixture,
        host: fixture.componentInstance,
        ellipsis: () =>
          root.querySelector('andes-breadcrumb-ellipsis') as HTMLElement,
        trigger: () =>
          root.querySelector(
            '.andes-breadcrumb-ellipsis__trigger',
          ) as HTMLButtonElement | null,
        outside: () => root.querySelector('#outside') as HTMLElement,
        // The menu is portalled into the CDK overlay container at the end of <body>, not into
        // the fixture's own DOM.
        menu: () =>
          document.querySelector('[role="menu"]') as HTMLElement | null,
        menuItems: () =>
          Array.from(document.querySelectorAll('[role="menuitem"]')),
      };
    }

    async function settle(
      fixture: ReturnType<typeof createCollapsed>['fixture'],
    ) {
      fixture.detectChanges();
      await fixture.whenStable();
      // Lets AndesDropdownMenu's deferred (setTimeout-based) focus work settle too.
      await new Promise((resolve) => setTimeout(resolve, 0));
      fixture.detectChanges();
    }

    it('renders a real button trigger and drops the decorative role/aria-hidden', () => {
      const { ellipsis, trigger } = createCollapsed();

      expect(trigger()).toBeTruthy();
      expect(trigger()?.type).toBe('button');
      // A focusable control inside an aria-hidden subtree is the "hidden but focusable" a11y
      // error, so the presentational attributes the static ellipsis carries must be gone here.
      expect(ellipsis().hasAttribute('role')).toBe(false);
      expect(ellipsis().hasAttribute('aria-hidden')).toBe(false);
    });

    it('keeps the default "..." glyph and exposes the sr-only text as the trigger name', () => {
      const { trigger } = createCollapsed();

      expect(
        trigger()?.querySelector('svg.andes-breadcrumb-ellipsis__icon'),
      ).toBeTruthy();
      expect(
        trigger()?.querySelector('.andes-breadcrumb-ellipsis__sr-only')
          ?.textContent,
      ).toBe('More');
    });

    it('localizes the trigger name via [label]', () => {
      const { fixture, host, trigger } = createCollapsed();
      host.label.set('Más');
      fixture.detectChanges();

      expect(
        trigger()?.querySelector('.andes-breadcrumb-ellipsis__sr-only')
          ?.textContent,
      ).toBe('Más');
    });

    it('is closed until the ellipsis is clicked', () => {
      const { menu } = createCollapsed();

      expect(menu()).toBeNull();
    });

    it('opens a menu listing exactly the hidden crumbs when the ellipsis is clicked', async () => {
      const { fixture, trigger, menu, menuItems } = createCollapsed();
      trigger()!.click();
      await settle(fixture);

      expect(menu()).toBeTruthy();
      expect(menuItems().map((item) => item.textContent?.trim())).toEqual([
        'Documentation',
        'Building Your Application',
        'Data Fetching',
      ]);
    });

    it('renders each href-carrying crumb as a real <a> with the breadcrumb link class', async () => {
      const { fixture, trigger, menu } = createCollapsed();
      trigger()!.click();
      await settle(fixture);

      const anchors = Array.from(
        menu()!.querySelectorAll('a.andes-breadcrumb-link'),
      ) as HTMLAnchorElement[];

      expect(anchors.map((anchor) => anchor.getAttribute('href'))).toEqual([
        '/docs',
        '/docs/building',
        '/docs/building/data-fetching',
      ]);
      // The roving tabindex lives on the role="menuitem" host; a separately tabbable inner
      // anchor would add a second stop inside the menu and break that model.
      expect(
        anchors.every((anchor) => anchor.getAttribute('tabindex') === '-1'),
      ).toBe(true);
    });

    it('renders crumbs without an href as plain text entries, not links', async () => {
      const { fixture, host, trigger, menu, menuItems } = createCollapsed();
      host.hidden.set([{ label: 'Documentación' }, { label: 'Componentes' }]);
      fixture.detectChanges();
      trigger()!.click();
      await settle(fixture);

      expect(menuItems().map((item) => item.textContent?.trim())).toEqual([
        'Documentación',
        'Componentes',
      ]);
      expect(menu()!.querySelector('a')).toBeNull();
    });

    it('marks a disabled crumb aria-disabled and does not activate it', async () => {
      const { fixture, host, trigger, menuItems } = createCollapsed();
      host.hidden.set([{ label: 'Archived', disabled: true }]);
      fixture.detectChanges();
      trigger()!.click();
      await settle(fixture);

      const item = menuItems()[0] as HTMLElement;

      expect(item.getAttribute('aria-disabled')).toBe('true');

      item.click();
      fixture.detectChanges();

      expect(host.selected()).toBeNull();
    });

    it('emits (itemSelected) with the clicked crumb and closes the menu', async () => {
      const { fixture, host, trigger, menu, menuItems } = createCollapsed();
      trigger()!.click();
      await settle(fixture);

      (menuItems()[1] as HTMLElement).click();
      fixture.detectChanges();

      expect(host.selected()).toEqual({
        label: 'Building Your Application',
        href: '/docs/building',
      });
      expect(menu()).toBeNull();
    });

    it('activates the focused crumb on Enter, forwarding it to that crumb’s anchor', async () => {
      const { fixture, host, trigger, menu, menuItems } = createCollapsed();
      trigger()!.click();
      await settle(fixture);

      const anchor = menu()!.querySelector('a') as HTMLAnchorElement;
      const clickSpy = vi.spyOn(anchor, 'click');

      // Keyboard activation lands on the role="menuitem" host, never on the anchor - forwarding
      // it is what makes Enter navigate the same way a click does, including through whatever
      // router directive the consumer attached to the anchor.
      pressKey(menuItems()[0], 'Enter');
      fixture.detectChanges();

      expect(clickSpy).toHaveBeenCalledTimes(1);
      expect(host.selected()?.label).toBe('Documentation');
    });

    it('does not re-click the anchor when the anchor itself was the click target', async () => {
      const { fixture, trigger, menu } = createCollapsed();
      trigger()!.click();
      await settle(fixture);

      const anchor = menu()!.querySelector('a') as HTMLAnchorElement;
      const clickSpy = vi.spyOn(anchor, 'click');
      anchor.dispatchEvent(
        new MouseEvent('click', { bubbles: true, cancelable: true }),
      );
      fixture.detectChanges();

      // The same click bubbles to the role="menuitem" host and fires `activated`; that must NOT
      // synthesize a second navigation on an anchor the browser is already following.
      expect(clickSpy).not.toHaveBeenCalled();
    });

    it('moves focus between crumbs with the arrow keys', async () => {
      const { fixture, trigger, menuItems } = createCollapsed();
      trigger()!.click();
      await settle(fixture);

      expect(document.activeElement).toBe(menuItems()[0]);

      pressKey(document.activeElement!, 'ArrowDown');
      fixture.detectChanges();

      expect(document.activeElement).toBe(menuItems()[1]);
    });

    it('closes on Escape and returns focus to the ellipsis trigger', async () => {
      const { fixture, trigger, menu } = createCollapsed();
      trigger()!.focus();
      trigger()!.click();
      await settle(fixture);

      expect(menu()).toBeTruthy();

      pressKey(document.body, 'Escape');
      fixture.detectChanges();

      expect(menu()).toBeNull();
      expect(document.activeElement).toBe(trigger());
    });

    it('closes on an outside click', async () => {
      const { fixture, trigger, menu, outside } = createCollapsed();
      trigger()!.click();
      await settle(fixture);

      expect(menu()).toBeTruthy();

      clickOn(outside());
      fixture.detectChanges();

      expect(menu()).toBeNull();
    });

    it('falls back to the static, presentational glyph when there are no hidden items', () => {
      const { fixture, host, ellipsis, trigger } = createCollapsed();
      host.hidden.set([]);
      fixture.detectChanges();

      expect(trigger()).toBeNull();
      expect(ellipsis().getAttribute('role')).toBe('presentation');
      expect(ellipsis().getAttribute('aria-hidden')).toBe('true');
      expect(
        ellipsis().querySelector('svg.andes-breadcrumb-ellipsis__icon'),
      ).toBeTruthy();
      expect(
        ellipsis().querySelector('.andes-breadcrumb-ellipsis__sr-only')
          ?.textContent,
      ).toBe('More');
    });

    it('projects a custom glyph into the trigger, not only into the static fallback', async () => {
      @Component({
        imports: [AndesBreadcrumbEllipsis],
        template: `
          <andes-breadcrumb-ellipsis [items]="crumbs">
            <span id="customGlyph">···</span>
          </andes-breadcrumb-ellipsis>
        `,
      })
      class CustomGlyphHost {
        readonly crumbs: AndesBreadcrumbEllipsisItem[] = [
          { label: 'Docs', href: '/docs' },
        ];
      }

      const fixture = TestBed.createComponent(CustomGlyphHost);
      fixture.detectChanges();
      await fixture.whenStable();
      const trigger = (fixture.nativeElement as HTMLElement).querySelector(
        '.andes-breadcrumb-ellipsis__trigger',
      ) as HTMLElement;

      expect(trigger.querySelector('#customGlyph')).toBeTruthy();
      expect(trigger.querySelector('svg')).toBeNull();
    });
  });

  // Separator inheritance and per-separator overrides, in projected mode.
  describe('separator content', () => {
    @Component({
      imports: [
        AndesBreadcrumb,
        AndesBreadcrumbList,
        AndesBreadcrumbItem,
        AndesBreadcrumbSeparator,
        AndesBreadcrumbPage,
      ],
      template: `
        <ng-template #star><b class="star">*</b></ng-template>
        <andes-breadcrumb [separator]="separator()">
          <ol andesBreadcrumbList>
            <li andesBreadcrumbItem>A</li>
            <li andesBreadcrumbSeparator id="inherit"></li>
            <li andesBreadcrumbItem>B</li>
            <li [andesBreadcrumbSeparator]="override()" id="override"></li>
            <li andesBreadcrumbItem>C</li>
            <li andesBreadcrumbSeparator id="own">|</li>
            <li andesBreadcrumbItem><span andesBreadcrumbPage>D</span></li>
          </ol>
        </andes-breadcrumb>
      `,
    })
    class SeparatorHost {
      readonly star = viewChild.required<TemplateRef<unknown>>('star');
      readonly separator = signal<AndesBreadcrumbSeparatorContent | undefined>(
        undefined,
      );
      readonly override = signal<AndesBreadcrumbSeparatorContent>('');
    }

    async function render() {
      const fixture = TestBed.createComponent(SeparatorHost);
      fixture.detectChanges();
      await fixture.whenStable();
      const root = fixture.nativeElement as HTMLElement;
      const get = (id: string) => root.querySelector(`#${id}`) as HTMLElement;
      const update = async () => {
        fixture.detectChanges();
        await fixture.whenStable();
      };
      return { fixture, host: fixture.componentInstance, get, update };
    }

    it('inherits the root separator string into empty separators', async () => {
      const { host, get, update } = await render();
      expect(get('inherit').querySelector('svg')).toBeTruthy();

      host.separator.set('/');
      await update();

      expect(get('inherit').textContent).toBe('/');
      expect(get('inherit').querySelector('svg')).toBeNull();
      expect(get('override').textContent).toBe('/');
    });

    it('renders a root separator template', async () => {
      const { host, get, update } = await render();
      host.separator.set(host.star());
      await update();

      expect(get('inherit').querySelector('b.star')?.textContent).toBe('*');
    });

    it('renders nothing for an empty root separator', async () => {
      const { host, get, update } = await render();
      host.separator.set('');
      await update();

      expect(get('inherit').childNodes.length).toBe(0);
    });

    it('lets [andesBreadcrumbSeparator] override the root separator for one position', async () => {
      const { host, get, update } = await render();
      host.separator.set('/');
      host.override.set('>');
      await update();

      expect(get('inherit').textContent).toBe('/');
      expect(get('override').textContent).toBe('>');

      host.override.set(host.star());
      await update();

      expect(get('override').querySelector('b.star')).toBeTruthy();
      expect(get('override').textContent).toBe('*');
    });

    it('never touches a separator with its own projected content', async () => {
      const { host, get, update } = await render();
      host.separator.set('/');
      await update();

      expect(get('own').textContent).toBe('|');
    });
  });

  describe('[items]', () => {
    withElementGeometry();

    @Component({
      imports: [AndesBreadcrumb],
      template: `
        <ng-template
          #render
          let-title="title"
          let-paths="paths"
          let-last="last"
          let-params="params"
        >
          <span
            class="custom"
            [attr.data-paths]="paths.join('/')"
            [attr.data-last]="last"
            [attr.data-id]="params.id"
            >{{ title }}</span
          >
        </ng-template>
        <ng-template #caret><i class="custom-caret">v</i></ng-template>
        <ng-template #dot><i class="dot">•</i></ng-template>
        <ng-template #icon><svg class="test-icon"></svg></ng-template>
        <andes-breadcrumb
          [items]="items()"
          [params]="params()"
          [separator]="separator()"
          [itemRender]="useRender() ? render : undefined"
          [dropdownIcon]="useCaret() ? caret : undefined"
          [maxItems]="maxItems()"
          [itemsBeforeCollapse]="before()"
          [itemsAfterCollapse]="after()"
          ellipsisLabel="Más"
          menuLabel="Mostrar menú"
          (itemClick)="clicks.push($event)"
          (menuClick)="menuClicks.push($event)"
          (menuOpenChange)="openChanges.push($event)"
        >
          <p id="projected">projected</p>
        </andes-breadcrumb>
      `,
    })
    class ItemsHost {
      readonly dot = viewChild.required<TemplateRef<unknown>>('dot');
      readonly icon = viewChild.required<TemplateRef<unknown>>('icon');
      readonly render =
        viewChild.required<TemplateRef<AndesBreadcrumbItemRenderContext>>(
          'render',
        );
      readonly items = signal<AndesBreadcrumbItemType[] | undefined>([
        { title: 'Home', href: '/' },
        { title: 'Users', path: 'users' },
        { title: 'User :id', path: ':id', className: 'is-user' },
      ]);
      readonly params = signal<Record<string, string | number>>({ id: 42 });
      readonly separator = signal<AndesBreadcrumbSeparatorContent | undefined>(
        undefined,
      );
      readonly useRender = signal(false);
      readonly useCaret = signal(false);
      readonly maxItems = signal<number | undefined>(undefined);
      readonly before = signal(1);
      readonly after = signal(1);
      readonly clicks: AndesBreadcrumbItemClickEvent[] = [];
      readonly menuClicks: AndesBreadcrumbMenuClickEvent[] = [];
      readonly openChanges: AndesBreadcrumbMenuOpenChangeEvent[] = [];
    }

    async function render(setup?: (host: ItemsHost) => void) {
      const fixture = TestBed.createComponent(ItemsHost);
      setup?.(fixture.componentInstance);
      fixture.detectChanges();
      await fixture.whenStable();
      const root = fixture.nativeElement as HTMLElement;
      const list = () => root.querySelector('ol') as HTMLOListElement;
      return {
        fixture,
        root,
        host: fixture.componentInstance,
        list,
        children: () => Array.from(list().children) as HTMLElement[],
        update: async () => {
          fixture.detectChanges();
          await fixture.whenStable();
          await new Promise((resolve) => setTimeout(resolve, 0));
          fixture.detectChanges();
        },
        menuItems: () =>
          Array.from(
            document.querySelectorAll('[role="menuitem"]'),
          ) as HTMLElement[],
      };
    }

    it('renders an ol of li crumbs and separators, ignoring projected content', async () => {
      const { root, children } = await render();

      expect(root.querySelector('nav')?.getAttribute('aria-label')).toBe(
        'breadcrumb',
      );
      expect(root.querySelector('#projected')).toBeNull();
      expect(children().map((li) => li.tagName)).toEqual([
        'LI',
        'LI',
        'LI',
        'LI',
        'LI',
      ]);
      expect(
        children().map((li) => li.className.includes('separator')),
      ).toEqual([false, true, false, true, false]);
    });

    it('falls back to projected content when items is unset', async () => {
      const { root } = await render((host) => host.items.set(undefined));

      expect(root.querySelector('#projected')).toBeTruthy();
      expect(root.querySelector('ol')).toBeNull();
    });

    it('joins paths into hrefs, interpolates params and renders the last crumb as the page', async () => {
      const { root } = await render();
      const links = Array.from(
        root.querySelectorAll('a'),
      ) as HTMLAnchorElement[];

      expect(links.map((a) => a.getAttribute('href'))).toEqual(['/', '/users']);
      expect(
        links.every((a) => a.classList.contains('andes-breadcrumb-link')),
      ).toBe(true);

      // The last crumb has a path too, but it is the current page - not a link.
      const page = root.querySelector('.andes-breadcrumb-page') as HTMLElement;
      expect(page.tagName).toBe('SPAN');
      expect(page.textContent?.trim()).toBe('User 42');
      expect(page.getAttribute('aria-current')).toBe('page');
      expect(root.querySelectorAll('[aria-current]')).toHaveLength(1);
    });

    it('adds an item className to its li without dropping the item class', async () => {
      const { children } = await render();
      const last = children()[4];

      expect(last.classList).toContain('is-user');
      expect(last.classList).toContain('andes-breadcrumb-item');
    });

    it('renders the default chevron, a string or a template separator', async () => {
      const { host, children, update } = await render();
      expect(children()[1].querySelector('svg')).toBeTruthy();

      host.separator.set('/');
      await update();
      expect(children()[1].textContent).toBe('/');

      host.separator.set(host.dot());
      await update();
      expect(children()[1].querySelector('i.dot')).toBeTruthy();
    });

    it('lets a separator entry override one position', async () => {
      const { host, children, update } = await render();
      host.separator.set('/');
      host.items.set([
        { title: 'A', href: '/a' },
        { type: 'separator', separator: ':' },
        { title: 'B', href: '/b' },
        { title: 'C' },
      ]);
      await update();

      expect(children().map((li) => li.textContent?.trim())).toEqual([
        'A',
        ':',
        'B',
        '/',
        'C',
      ]);
    });

    it('emits (itemClick) and calls onClick with the crumb and the MouseEvent', async () => {
      const onClick = vi.fn((event: MouseEvent) => event.preventDefault());
      const { root, host } = await render((h) =>
        h.items.set([{ title: 'Home', href: '/', onClick }, { title: 'Here' }]),
      );
      const link = root.querySelector('a') as HTMLAnchorElement;
      link.click();

      expect(onClick).toHaveBeenCalledTimes(1);
      expect(host.clicks).toHaveLength(1);
      expect(host.clicks[0].item.title).toBe('Home');
      expect(host.clicks[0].index).toBe(0);
      expect(host.clicks[0].event).toBeInstanceOf(MouseEvent);
      expect(host.clicks[0].event.defaultPrevented).toBe(true);
    });

    it('renders a crumb with onClick but no href as a keyboard-reachable button', async () => {
      const onClick = vi.fn();
      const { root, host } = await render((h) =>
        h.items.set([
          { title: 'Action', onClick },
          { title: 'Text' },
          { title: 'Here' },
        ]),
      );
      const button = root.querySelector(
        'button.andes-breadcrumb-link',
      ) as HTMLButtonElement;

      expect(button.type).toBe('button');
      expect(button.textContent?.trim()).toBe('Action');
      expect(root.querySelector('.andes-breadcrumb-text')?.textContent).toBe(
        'Text',
      );

      button.click();
      expect(onClick).toHaveBeenCalledTimes(1);
      expect(host.clicks[0].item.title).toBe('Action');
    });

    it('hands each crumb to itemRender with title, params, paths and last', async () => {
      const { root } = await render((h) => h.useRender.set(true));
      const custom = Array.from(
        root.querySelectorAll('.custom'),
      ) as HTMLElement[];

      expect(custom.map((el) => el.textContent)).toEqual([
        'Home',
        'Users',
        'User 42',
      ]);
      expect(custom.map((el) => el.dataset['paths'])).toEqual([
        '',
        'users',
        'users/42',
      ]);
      expect(custom.map((el) => el.dataset['last'])).toEqual([
        'false',
        'false',
        'true',
      ]);
      expect(custom[0].dataset['id']).toBe('42');
      // The template owns the crumb: no default link/page is rendered around it.
      expect(root.querySelector('a')).toBeNull();
    });

    describe('icons', () => {
      async function renderIcons() {
        const result = await render();
        const icon = result.host.icon();
        result.host.items.set([
          { icon, ariaLabel: 'Home', href: '/' },
          { icon, title: 'Users', href: '/users' },
          { icon, title: 'Reports', onClick: () => undefined },
          { icon, title: 'Archive' },
          { icon, title: 'Profile' },
        ]);
        await result.update();
        return result;
      }

      it('renders an item icon before the title in links, buttons, text and the page', async () => {
        const { root } = await renderIcons();
        const holders = Array.from(
          root.querySelectorAll('.andes-breadcrumb-has-icon'),
        ) as HTMLElement[];

        expect(holders.map((el) => el.tagName)).toEqual([
          'A',
          'A',
          'BUTTON',
          'SPAN',
          'SPAN',
        ]);
        for (const holder of holders) {
          const icon = holder.querySelector('.andes-breadcrumb-icon');
          expect(icon?.getAttribute('aria-hidden')).toBe('true');
          expect(icon?.querySelector('svg.test-icon')).toBeTruthy();
          expect(holder.firstElementChild).toBe(icon);
        }
        expect(holders[1].textContent?.trim()).toBe('Users');
        expect(holders[4].classList).toContain('andes-breadcrumb-page');
      });

      it('names an icon-only crumb with visually hidden ariaLabel text', async () => {
        const { root } = await renderIcons();
        const home = root.querySelector('a') as HTMLAnchorElement;

        expect(
          home.querySelector('.andes-breadcrumb-sr-only')?.textContent,
        ).toBe('Home');
        // A titled crumb never gets the hidden text.
        expect(root.querySelectorAll('.andes-breadcrumb-sr-only')).toHaveLength(
          1,
        );
      });

      it('shows a hidden crumb’s icon and ariaLabel in the ellipsis dropdown', async () => {
        const { root, host, update, menuItems: entries } = await renderIcons();
        host.maxItems.set(2);
        await update();
        (
          root.querySelector(
            '.andes-breadcrumb-ellipsis__trigger',
          ) as HTMLElement
        ).click();
        await update();

        expect(entries().map((el) => el.textContent?.trim())).toEqual([
          'Users',
          'Reports',
          'Archive',
        ]);
        expect(
          entries().every((el) =>
            el.querySelector(
              '.andes-breadcrumb-menu-entry__icon svg.test-icon',
            ),
          ),
        ).toBe(true);
      });

      it('labels a hidden icon-only crumb with its ariaLabel in the ellipsis dropdown', async () => {
        const { root, host, update, menuItems: entries } = await render();
        host.items.set([
          { title: 'Root', href: '/' },
          { icon: host.icon(), ariaLabel: 'Settings', href: '/settings' },
          { title: 'A', href: '/a' },
          { title: 'Here' },
        ]);
        host.maxItems.set(2);
        await update();
        (
          root.querySelector(
            '.andes-breadcrumb-ellipsis__trigger',
          ) as HTMLElement
        ).click();
        await update();
        expect(entries()[0].textContent?.trim()).toBe('Settings');
      });
    });

    describe('per-item menu', () => {
      const menuItems = [
        { label: 'General', href: '/general' },
        { label: 'Layout' },
        { label: 'Archived', href: '/archived', disabled: true },
      ];

      async function renderMenu(setup?: (host: ItemsHost) => void) {
        const onEntry = vi.fn();
        const result = await render((h) => {
          h.items.set([
            { title: 'Home', href: '/' },
            {
              title: 'Component',
              menu: {
                items: menuItems.map((entry) => ({
                  ...entry,
                  onClick: onEntry,
                })),
              },
            },
            { title: 'Button' },
          ]);
          setup?.(h);
        });
        const trigger = result.root.querySelector(
          '.andes-breadcrumb-menu-trigger',
        ) as HTMLButtonElement;
        return { ...result, trigger, onEntry };
      }

      it('renders the crumb as a caret dropdown trigger', async () => {
        const { trigger } = await renderMenu();

        expect(trigger.tagName).toBe('BUTTON');
        expect(trigger.textContent?.trim()).toBe('Component');
        expect(trigger.getAttribute('aria-haspopup')).toBe('menu');
        expect(trigger.getAttribute('aria-expanded')).toBe('false');
        expect(
          trigger.querySelector('svg.andes-breadcrumb-menu-trigger__icon'),
        ).toBeTruthy();
        expect(trigger.hasAttribute('aria-current')).toBe(false);
      });

      it('uses the dropdownIcon template instead of the default caret', async () => {
        const { trigger } = await renderMenu((h) => h.useCaret.set(true));

        expect(trigger.querySelector('i.custom-caret')).toBeTruthy();
        expect(trigger.querySelector('svg')).toBeNull();
      });

      it('opens the menu entries and reports a click via onClick and (menuClick)', async () => {
        const {
          trigger,
          update,
          menuItems: entries,
          host,
          onEntry,
        } = await renderMenu();
        trigger.click();
        await update();

        expect(entries().map((el) => el.textContent?.trim())).toEqual([
          'General',
          'Layout',
          'Archived',
        ]);
        expect(entries()[0].querySelector('a')?.getAttribute('href')).toBe(
          '/general',
        );

        entries()[1].click();
        await update();

        expect(onEntry).toHaveBeenCalledTimes(1);
        expect(host.menuClicks).toHaveLength(1);
        expect(host.menuClicks[0].item.title).toBe('Component');
        expect(host.menuClicks[0].menuItem.label).toBe('Layout');
        expect(host.menuClicks[0].event).toBeInstanceOf(MouseEvent);
        expect(document.querySelector('[role="menu"]')).toBeNull();
      });

      it('activates an entry from the keyboard exactly once', async () => {
        const {
          trigger,
          update,
          menuItems: entries,
          host,
        } = await renderMenu();
        trigger.click();
        await update();

        pressKey(entries()[0], 'Enter');
        await update();

        expect(host.menuClicks.map((c) => c.menuItem.label)).toEqual([
          'General',
        ]);
      });

      it('keeps a disabled href entry from navigating or reporting', async () => {
        const {
          trigger,
          update,
          menuItems: entries,
          host,
        } = await renderMenu();
        trigger.click();
        await update();

        const anchor = entries()[2].querySelector('a') as HTMLAnchorElement;
        const click = new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
        });
        anchor.dispatchEvent(click);

        expect(click.defaultPrevented).toBe(true);
        expect(host.menuClicks).toHaveLength(0);
      });

      it('renders dividers, group headings, icons, danger and target on entries', async () => {
        const result = await render();
        const icon = result.host.icon();
        const onEntry = vi.fn();
        result.host.items.set([
          { title: 'Home', href: '/' },
          {
            title: 'Component',
            menu: {
              items: [
                { key: 'general', label: 'General', icon, onClick: onEntry },
                { type: 'divider' },
                {
                  type: 'group',
                  label: 'Data',
                  children: [
                    { key: 'table', label: 'Table', href: '/table' },
                    {
                      key: 'docs',
                      label: 'Docs',
                      href: 'https://example.com',
                      target: '_blank',
                    },
                  ],
                },
                { key: 'delete', label: 'Delete', danger: true },
              ],
            },
          },
          { title: 'Button' },
        ]);
        await result.update();
        (
          result.root.querySelector(
            '.andes-breadcrumb-menu-trigger',
          ) as HTMLElement
        ).click();
        await result.update();

        const menu = document.querySelector('[role="menu"]') as HTMLElement;
        expect(
          Array.from(menu.children).map((el) => el.tagName.toLowerCase()),
        ).toEqual([
          'andes-dropdown-menu-item',
          'andes-dropdown-menu-separator',
          'andes-dropdown-menu-label',
          'andes-dropdown-menu-item',
          'andes-dropdown-menu-item',
          'andes-dropdown-menu-item',
        ]);
        expect(
          menu.querySelector('andes-dropdown-menu-label')?.textContent?.trim(),
        ).toBe('Data');

        const entries = result.menuItems();
        expect(entries.map((el) => el.textContent?.trim())).toEqual([
          'General',
          'Table',
          'Docs',
          'Delete',
        ]);
        expect(
          entries[0].querySelector(
            '.andes-breadcrumb-menu-entry__icon[aria-hidden="true"] svg.test-icon',
          ),
        ).toBeTruthy();
        expect(entries[3].getAttribute('data-variant')).toBe('destructive');
        expect(entries[0].getAttribute('data-variant')).toBe('default');

        const table = entries[1].querySelector('a') as HTMLAnchorElement;
        expect(table.hasAttribute('target')).toBe(false);
        expect(table.hasAttribute('rel')).toBe(false);
        const docs = entries[2].querySelector('a') as HTMLAnchorElement;
        expect(docs.getAttribute('target')).toBe('_blank');
        expect(docs.getAttribute('rel')).toBe('noopener noreferrer');

        entries[0].click();
        await result.update();
        expect(onEntry).toHaveBeenCalledTimes(1);
        expect(result.host.menuClicks[0].menuItem.key).toBe('general');
      });

      it('disables the trigger through dropdownProps.disabled', async () => {
        const { root, update } = await render((h) =>
          h.items.set([
            { title: 'Home', href: '/' },
            {
              title: 'Component',
              menu: { items: [{ label: 'General' }] },
              dropdownProps: { disabled: true },
            },
            { title: 'Button' },
          ]),
        );
        const trigger = root.querySelector(
          '.andes-breadcrumb-menu-trigger',
        ) as HTMLButtonElement;

        expect(trigger.disabled).toBe(true);
        expect(trigger.querySelector('svg')).toBeTruthy();
        trigger.click();
        await update();
        expect(document.querySelector('[role="menu"]')).toBeNull();
      });

      it('reports open and close through onOpenChange and (menuOpenChange)', async () => {
        const onOpenChange = vi.fn();
        const { root, host, update } = await render((h) =>
          h.items.set([
            { title: 'Home', href: '/' },
            {
              title: 'Component',
              menu: { items: [{ label: 'General' }] },
              dropdownProps: { onOpenChange },
            },
            { title: 'Button' },
          ]),
        );
        const trigger = root.querySelector(
          '.andes-breadcrumb-menu-trigger',
        ) as HTMLButtonElement;

        trigger.click();
        await update();
        pressKey(document.querySelector('[role="menu"]') as Element, 'Escape');
        await update();

        expect(onOpenChange.mock.calls).toEqual([[true], [false]]);
        expect(host.openChanges.map((e) => [e.item.title, e.open])).toEqual([
          ['Component', true],
          ['Component', false],
        ]);
      });

      it('applies dropdownProps placement and panelClass to the floating panel', async () => {
        const { root, fixture, update } = await render((h) =>
          h.items.set([
            { title: 'Home', href: '/' },
            {
              title: 'Component',
              menu: { items: [{ label: 'General' }] },
              dropdownProps: {
                side: 'top',
                align: 'end',
                panelClass: 'my-panel  other-panel',
              },
            },
            { title: 'Button' },
          ]),
        );
        const overlay = fixture.debugElement
          .query(By.directive(AndesDropdownMenu))
          .injector.get(AndesOverlayPrimitive);

        expect(overlay.config().positioning).toMatchObject({
          kind: 'anchored',
          side: 'top',
          align: 'end',
        });

        (
          root.querySelector('.andes-breadcrumb-menu-trigger') as HTMLElement
        ).click();
        await update();
        expect(
          document.querySelector(
            '.cdk-overlay-pane.andes-breadcrumb-dropdown-panel.my-panel.other-panel',
          ),
        ).toBeTruthy();
      });

      it('marks a last crumb with a menu as the current page', async () => {
        const { root } = await render((h) =>
          h.items.set([
            { title: 'Home', href: '/' },
            { title: 'Here', menu: { items: [{ label: 'Sibling' }] } },
          ]),
        );
        const trigger = root.querySelector(
          '.andes-breadcrumb-menu-trigger',
        ) as HTMLElement;

        expect(trigger.getAttribute('aria-current')).toBe('page');
        expect(root.querySelector('.andes-breadcrumb-page')).toBeNull();
      });
    });

    describe('collapse (maxItems)', () => {
      const long: AndesBreadcrumbItemType[] = [
        { title: 'Home', href: '/' },
        { title: 'Docs', path: 'docs' },
        { title: 'Guides', path: 'guides' },
        { title: 'Forms', path: 'forms' },
        { title: 'Validation' },
      ];

      it('does not collapse unless maxItems is set', async () => {
        const { root } = await render((h) => h.items.set(long));

        expect(root.querySelector('andes-breadcrumb-ellipsis')).toBeNull();
        expect(root.querySelectorAll('.andes-breadcrumb-item')).toHaveLength(5);
      });

      it('collapses the middle crumbs into an ellipsis dropdown', async () => {
        const {
          root,
          children,
          update,
          menuItems: entries,
        } = await render((h) => {
          h.items.set(long);
          h.maxItems.set(3);
          h.after.set(2);
        });

        expect(children().map((li) => li.textContent?.trim())).toEqual([
          'Home',
          '',
          'Más',
          '',
          'Forms',
          '',
          'Validation',
        ]);
        const trigger = root.querySelector(
          '.andes-breadcrumb-ellipsis__trigger',
        ) as HTMLButtonElement;
        trigger.click();
        await update();

        expect(entries().map((el) => el.textContent?.trim())).toEqual([
          'Docs',
          'Guides',
        ]);
        expect(
          entries().map((el) => el.querySelector('a')?.getAttribute('href')),
        ).toEqual(['/docs', '/docs/guides']);
      });

      it('reports a collapsed crumb chosen from the ellipsis as an (itemClick)', async () => {
        const onClick = vi.fn();
        const {
          root,
          host,
          update,
          menuItems: entries,
        } = await render((h) => {
          h.items.set(
            long.map((item, i) => (i === 2 ? { ...item, onClick } : item)),
          );
          h.maxItems.set(2);
        });
        (
          root.querySelector(
            '.andes-breadcrumb-ellipsis__trigger',
          ) as HTMLElement
        ).click();
        await update();

        pressKey(entries()[1], 'Enter');
        await update();

        expect(onClick).toHaveBeenCalledTimes(1);
        expect(host.clicks).toHaveLength(1);
        expect(host.clicks[0].item.title).toBe('Guides');
        expect(host.clicks[0].index).toBe(2);
      });

      it('lists a disabled hidden crumb as a disabled entry and keeps its link target', async () => {
        const {
          root,
          update,
          menuItems: entries,
        } = await render((h) => {
          h.items.set(
            long.map((item, i) =>
              i === 1
                ? { ...item, disabled: true }
                : i === 2
                  ? { ...item, target: '_blank' }
                  : item,
            ),
          );
          h.maxItems.set(2);
        });
        (
          root.querySelector(
            '.andes-breadcrumb-ellipsis__trigger',
          ) as HTMLElement
        ).click();
        await update();

        expect(entries()[0].hasAttribute('data-disabled')).toBe(true);
        expect(entries()[1].querySelector('a')?.getAttribute('target')).toBe(
          '_blank',
        );
        expect(entries()[1].querySelector('a')?.getAttribute('rel')).toBe(
          'noopener noreferrer',
        );
      });
    });

    describe('link target and disabled crumbs', () => {
      it('opens a link crumb in its target, protecting the opener for _blank', async () => {
        const { root } = await render((h) =>
          h.items.set([
            { title: 'Docs', href: '/docs', target: '_blank' },
            { title: 'Blog', href: '/blog', target: '_self' },
            { title: 'Plain', href: '/plain' },
            { title: 'Here' },
          ]),
        );
        const [blank, self, plain] = Array.from(
          root.querySelectorAll('a'),
        ) as HTMLAnchorElement[];

        expect(blank.getAttribute('target')).toBe('_blank');
        expect(blank.getAttribute('rel')).toBe('noopener noreferrer');
        expect(self.getAttribute('target')).toBe('_self');
        expect(self.hasAttribute('rel')).toBe(false);
        expect(plain.hasAttribute('target')).toBe(false);
        expect(plain.hasAttribute('rel')).toBe(false);
      });

      it('renders a disabled crumb as dimmed text that is neither a link nor focusable', async () => {
        const onClick = vi.fn();
        const { root } = await render((h) =>
          h.items.set([
            { title: 'Home', href: '/' },
            { title: 'Archive', href: '/archive', disabled: true, onClick },
            { title: 'Here' },
          ]),
        );
        const disabled = root.querySelector(
          '.andes-breadcrumb-text--disabled',
        ) as HTMLElement;

        expect(disabled.tagName).toBe('SPAN');
        expect(disabled.textContent?.trim()).toBe('Archive');
        expect(disabled.getAttribute('aria-disabled')).toBe('true');
        expect(disabled.classList).not.toContain('andes-breadcrumb-link');
        expect(root.querySelectorAll('a')).toHaveLength(1);
        expect(root.querySelector('button')).toBeNull();

        disabled.click();
        expect(onClick).not.toHaveBeenCalled();
      });

      it('never shows the last crumb as disabled: it stays the current page', async () => {
        const { root } = await render((h) =>
          h.items.set([
            { title: 'Home', href: '/' },
            { title: 'Here', disabled: true },
          ]),
        );

        expect(
          root.querySelector('.andes-breadcrumb-text--disabled'),
        ).toBeNull();
        expect(
          root
            .querySelector('.andes-breadcrumb-page')
            ?.getAttribute('aria-current'),
        ).toBe('page');
      });

      it('keeps the caret of a disabled crumb with a menu, but the menu cannot open', async () => {
        const {
          root,
          update,
          menuItems: entries,
        } = await render((h) =>
          h.items.set([
            { title: 'Home', href: '/' },
            {
              title: 'Archive',
              href: '/archive',
              disabled: true,
              menu: { items: [{ label: 'Old' }] },
            },
            { title: 'Here' },
          ]),
        );
        const trigger = root.querySelector(
          '.andes-breadcrumb-menu-trigger',
        ) as HTMLButtonElement;

        expect(trigger.disabled).toBe(true);
        expect(root.querySelector('.andes-breadcrumb-split')).toBeNull();
        trigger.click();
        await update();
        expect(entries()).toHaveLength(0);
      });
    });

    describe('a crumb with its own link and a menu', () => {
      const menu = { items: [{ label: 'General', href: '/general' }] };

      async function renderSplit(setup?: (host: ItemsHost) => void) {
        const result = await render((h) => {
          h.items.set([
            { title: 'Home', href: '/' },
            { title: 'Components', href: '/components', menu },
            { title: 'Button' },
          ]);
          setup?.(h);
        });
        const split = result.root.querySelector(
          '.andes-breadcrumb-split',
        ) as HTMLElement | null;
        return { ...result, split };
      }

      it('keeps the link and adds a separate caret button that names the menu', async () => {
        const { split } = await renderSplit();
        const link = split?.querySelector('a') as HTMLAnchorElement;
        const caret = split?.querySelector('button') as HTMLButtonElement;

        expect(link.getAttribute('href')).toBe('/components');
        expect(link.textContent?.trim()).toBe('Components');
        expect(link.classList).toContain('andes-breadcrumb-link');
        expect(caret.classList).toContain(
          'andes-breadcrumb-menu-trigger--caret',
        );
        expect(caret.getAttribute('aria-haspopup')).toBe('menu');
        expect(caret.textContent?.trim()).toBe('Components: Mostrar menú');
        expect(caret.querySelector('svg')?.getAttribute('aria-hidden')).toBe(
          'true',
        );
        expect(
          split?.querySelectorAll('.andes-breadcrumb-menu-trigger'),
        ).toHaveLength(1);
      });

      it('navigates from the link and opens the menu from the caret only', async () => {
        const { split, host, update, menuItems: entries } = await renderSplit();
        const link = split?.querySelector('a') as HTMLAnchorElement;
        const caret = split?.querySelector('button') as HTMLButtonElement;
        link.addEventListener('click', (event) => event.preventDefault());

        link.click();
        await update();
        expect(host.clicks.map((c) => c.index)).toEqual([1]);
        expect(entries()).toHaveLength(0);

        caret.click();
        await update();
        expect(entries().map((el) => el.textContent?.trim())).toEqual([
          'General',
        ]);
        expect(caret.getAttribute('aria-expanded')).toBe('true');
      });

      it('reports the open state through (menuOpenChange)', async () => {
        const { split, host, update } = await renderSplit();
        (split?.querySelector('button') as HTMLButtonElement).click();
        await update();

        expect(host.openChanges.map((e) => [e.item.title, e.open])).toEqual([
          ['Components', true],
        ]);
      });

      it('stays a single trigger when the crumb has no link, is the last, or is rendered by itemRender', async () => {
        const noLink = await render((h) =>
          h.items.set([
            { title: 'Home', href: '/' },
            { title: 'Pick', menu },
            { title: 'Here' },
          ]),
        );
        expect(noLink.root.querySelector('.andes-breadcrumb-split')).toBeNull();
        expect(
          noLink.root
            .querySelector('.andes-breadcrumb-menu-trigger')
            ?.textContent?.trim(),
        ).toBe('Pick');

        const last = await render((h) =>
          h.items.set([
            { title: 'Home', href: '/' },
            { title: 'Here', href: '/here', menu },
          ]),
        );
        expect(last.root.querySelector('.andes-breadcrumb-split')).toBeNull();
        expect(
          last.root
            .querySelector('.andes-breadcrumb-menu-trigger')
            ?.getAttribute('aria-current'),
        ).toBe('page');

        const custom = await renderSplit((h) => h.useRender.set(true));
        expect(custom.split).toBeNull();
      });

      it('falls back to the plain menu label when the crumb has no title', async () => {
        const { split } = await render((h) =>
          h.items.set([
            { title: 'Home', href: '/' },
            { ariaLabel: 'Section', href: '/section', menu },
            { title: 'Here' },
          ]),
        ).then((result) => ({
          split: result.root.querySelector('.andes-breadcrumb-split'),
        }));

        expect(split?.querySelector('button')?.textContent?.trim()).toBe(
          'Mostrar menú',
        );
      });
    });

    describe('accessibility of the rendered trail', () => {
      it('is a labelled nav around an ol whose separators are hidden from assistive tech', async () => {
        const { root, list } = await render();

        const nav = root.querySelector('nav') as HTMLElement;
        expect(nav.getAttribute('aria-label')).toBe('breadcrumb');
        expect(list().tagName).toBe('OL');
        expect(list().parentElement).toBe(nav);
        const separators = Array.from(
          list().querySelectorAll('.andes-breadcrumb-separator'),
        );
        expect(separators.length).toBeGreaterThan(0);
        expect(
          separators.every(
            (el) =>
              el.getAttribute('aria-hidden') === 'true' &&
              el.getAttribute('role') === 'presentation',
          ),
        ).toBe(true);
        expect(
          Array.from(list().children).every((el) => el.tagName === 'LI'),
        ).toBe(true);
      });

      it('marks only the last crumb as the current page, without a link role to follow', async () => {
        const { root } = await render();
        const current = Array.from(root.querySelectorAll('[aria-current]'));

        expect(current).toHaveLength(1);
        expect(current[0].getAttribute('aria-current')).toBe('page');
        expect(current[0].closest('li')?.nextElementSibling).toBeNull();
      });
    });
  });

  // The hover/active/focus treatment and its motion live in breadcrumb.css, behind pseudo-classes
  // and media queries jsdom does not evaluate, so the contract is read from the stylesheet source.
  describe('hover, focus and motion (stylesheet contract)', () => {
    const css = readFileSync(
      'packages/ui/src/lib/breadcrumb/breadcrumb.css',
      'utf8',
    );

    /** Body of the first top-level at-rule whose prelude is `prelude`, found by brace counting. */
    function atRuleBody(source: string, prelude: string): string {
      const start = source.indexOf(prelude);
      if (start < 0) {
        return '';
      }
      const open = source.indexOf('{', start);
      let depth = 0;
      for (let i = open; i < source.length; i++) {
        if (source[i] === '{') {
          depth++;
        } else if (source[i] === '}') {
          depth--;
          if (depth === 0) {
            return source.slice(open + 1, i);
          }
        }
      }
      return '';
    }

    const NOT_CURRENT = ":where(:not([aria-current='page']))";
    const motion = atRuleBody(
      css,
      '@media (prefers-reduced-motion: no-preference)',
    );
    const forced = atRuleBody(css, '@media (forced-colors: active)');

    it('never underlines a crumb', () => {
      expect(css).not.toContain('text-decoration: underline');
      expect(
        declaredValue(css, '.andes-breadcrumb-link', 'text-decoration'),
      ).toBe('none');
    });

    it('turns a link into a soft pill whose padding is cancelled by a negative margin', () => {
      const link = '.andes-breadcrumb-link';

      expect(declaredValue(css, link, 'padding-inline')).toBe(
        'var(--andes-space-1)',
      );
      expect(declaredValue(css, link, 'margin-inline')).toBe(
        'calc(var(--andes-space-1) * -1)',
      );
      expect(declaredValue(css, link, 'border-radius')).toBe(
        'var(--andes-radius-sm)',
      );
      expect(declaredValue(css, link, 'background-color')).toBe('transparent');
      expect(declaredValue(css, link, 'min-block-size')).toBe(
        'var(--andes-text-line-height, 1.375rem)',
      );
    });

    it('fills a hovered link with the subtle accent and a pressed one a step darker', () => {
      const hover = `.andes-breadcrumb-link:hover${NOT_CURRENT}`;
      const active = `.andes-breadcrumb-link:active${NOT_CURRENT}`;

      expect(declaredValue(css, hover, 'background-color')).toBe(
        'var(--andes-color-accent)',
      );
      expect(declaredValue(css, hover, 'color')).toBe(
        'var(--andes-color-foreground)',
      );
      expect(declaredValue(css, active, 'background-color')).toBe(
        'var(--andes-color-accent-hover)',
      );
    });

    it('gives the current page no hover or active state', () => {
      expect(css).not.toContain('.andes-breadcrumb-page:hover');
      expect(css).not.toContain('.andes-breadcrumb-page:active');
      expect(css).not.toContain('.andes-breadcrumb-text:hover');
      // A link marked `aria-current` is excluded from the pill; the hover rules never match it.
      expect(css).toContain(`.andes-breadcrumb-link:hover${NOT_CURRENT}`);
      expect(declaredValue(css, '.andes-breadcrumb-page', 'color')).toBe(
        'var(--andes-color-foreground)',
      );
    });

    it('gives the menu trigger and the collapse dots the same pill, open or hovered', () => {
      const trigger = '.andes-breadcrumb-menu-trigger';
      const dots = '.andes-breadcrumb-ellipsis__trigger';

      expect(declaredValue(css, trigger, 'padding-inline')).toBe(
        'var(--andes-space-1)',
      );
      expect(declaredValue(css, trigger, 'margin-inline')).toBe(
        'calc(var(--andes-space-1) * -1)',
      );
      expect(declaredValue(css, trigger, 'min-block-size')).toBe(
        'var(--andes-text-line-height, 1.375rem)',
      );
      expect(declaredValue(css, trigger, 'border-radius')).toBe(
        'var(--andes-radius-sm)',
      );
      for (const selector of [
        `${trigger}:hover:not(:disabled)`,
        `${trigger}[aria-expanded='true']:not(:disabled)`,
        `${dots}:hover`,
        `${dots}[aria-expanded='true']`,
      ]) {
        expect(declaredValue(css, selector, 'background-color')).toBe(
          'var(--andes-color-accent)',
        );
        expect(declaredValue(css, selector, 'color')).toBe(
          'var(--andes-color-foreground)',
        );
      }
      for (const selector of [
        `${trigger}:active:not(:disabled)`,
        `${dots}:active`,
      ]) {
        expect(declaredValue(css, selector, 'background-color')).toBe(
          'var(--andes-color-accent-hover)',
        );
      }
      expect(
        declaredValue(css, `${trigger}--caret`, 'margin-inline-start'),
      ).toBe('0');
    });

    it('draws the library focus ring on every interactive crumb', () => {
      for (const selector of [
        '.andes-breadcrumb-link:focus-visible',
        '.andes-breadcrumb-menu-trigger:focus-visible',
        '.andes-breadcrumb-ellipsis__trigger:focus-visible',
      ]) {
        expect(declaredValue(css, selector, 'outline')).toBe(
          '2px solid var(--andes-color-focus-ring)',
        );
        expect(declaredValue(css, selector, 'outline-offset')).toBe('2px');
      }
    });

    it('keeps the dropdown entries free of the pill', () => {
      for (const selector of [
        '.andes-breadcrumb-menu-entry',
        '.andes-breadcrumb-menu-entry:hover',
        '.andes-breadcrumb-menu-entry:active',
      ]) {
        expect(declaredValue(css, selector, 'padding')).toBe('0');
        expect(declaredValue(css, selector, 'margin')).toBe('0');
        expect(declaredValue(css, selector, 'background-color')).toBe(
          'transparent',
        );
        expect(declaredValue(css, selector, 'text-decoration')).toBe('none');
      }
    });

    it('fades color and fill in 200ms on the shared curve, only when motion is allowed', () => {
      const fade = [
        'color var(--andes-motion-duration-slow, 0.2s) var(--andes-motion-ease-in-out, cubic-bezier(0.645, 0.045, 0.355, 1))',
        'background-color var(--andes-motion-duration-slow, 0.2s) var(--andes-motion-ease-in-out, cubic-bezier(0.645, 0.045, 0.355, 1))',
      ].join(', ');

      expect(motion).not.toBe('');
      for (const selector of [
        '.andes-breadcrumb-link:not(.andes-breadcrumb-menu-entry)',
        '.andes-breadcrumb-menu-trigger',
        '.andes-breadcrumb-ellipsis__trigger',
      ]) {
        expect(declaredValue(motion, selector, 'transition')).toBe(fade);
        // Outside the media query there is no transition at all, so reduced motion has none.
        expect(declaredValue(css, selector, 'transition')).toBeUndefined();
      }
      expect(css).not.toContain('transition: none');
    });

    it('animates nothing that would move the text', () => {
      expect(motion).not.toContain('transform');
      expect(motion).not.toContain('padding');
      expect(motion).not.toContain('margin');
    });

    it('draws the hover fill and the focus ring from system colors when colors are forced', () => {
      expect(forced).not.toBe('');
      const hovered = `.andes-breadcrumb-link:hover${NOT_CURRENT}`;

      expect(declaredValue(forced, hovered, 'background-color')).toBe(
        'Highlight',
      );
      expect(declaredValue(forced, hovered, 'color')).toBe('HighlightText');
      expect(
        declaredValue(
          forced,
          '.andes-breadcrumb-ellipsis__trigger:hover',
          'background-color',
        ),
      ).toBe('Highlight');
      expect(
        declaredValue(
          forced,
          '.andes-breadcrumb-menu-trigger:focus-visible',
          'outline-color',
        ),
      ).toBe('Highlight');
      expect(
        declaredValue(forced, '.andes-breadcrumb-text--disabled', 'color'),
      ).toBe('GrayText');
    });

    it('uses logical properties only, so the pill is symmetric in right-to-left text', () => {
      for (const physical of [
        'margin-left',
        'margin-right',
        'padding-left',
        'padding-right',
      ]) {
        expect(css).not.toContain(physical);
      }
    });
  });

  // Semantic parts: `classNames` / `styles` reach the root, the list, every item, link,
  // separator, the collapse ellipsis and the dropdown panel.
  describe('semantic parts (classNames / styles)', () => {
    withElementGeometry();

    @Component({
      imports: [AndesBreadcrumb],
      template: `
        <andes-breadcrumb
          [items]="items()"
          [classNames]="classNames()"
          [styles]="styles()"
          [maxItems]="maxItems()"
          [separator]="separator()"
        />
      `,
    })
    class PartsHost {
      readonly items = signal<AndesBreadcrumbItemType[]>([
        { title: 'Home', href: '/', className: 'own-item' },
        { title: 'Action', onClick: () => undefined },
        { title: 'Text' },
        { title: 'Off', href: '/off', disabled: true },
        { title: 'Here' },
      ]);
      readonly classNames = signal<AndesBreadcrumbClassNames | null>({
        root: 'my-root',
        list: 'my-list',
        item: 'my-item',
        link: 'my-link',
        separator: 'my-separator',
        ellipsis: 'my-ellipsis',
        menu: 'my-menu',
      });
      readonly styles = signal<AndesBreadcrumbStyles | null>({
        root: { outline: '3px solid red' },
        list: { 'column-gap': '9px' },
        item: { 'letter-spacing': '1px' },
        link: { 'font-weight': '700' },
        separator: { opacity: '0.5' },
        ellipsis: { 'border-radius': '4px' },
        menu: { 'border-width': '5px' },
      });
      readonly maxItems = signal<number | undefined>(undefined);
      readonly separator = signal<AndesBreadcrumbSeparatorContent | undefined>(
        undefined,
      );
    }

    async function renderParts(setup?: (host: PartsHost) => void) {
      const fixture = TestBed.createComponent(PartsHost);
      setup?.(fixture.componentInstance);
      fixture.detectChanges();
      await fixture.whenStable();
      const root = fixture.nativeElement as HTMLElement;
      return {
        fixture,
        host: fixture.componentInstance,
        root,
        el: (selector: string) => root.querySelector(selector) as HTMLElement,
        all: (selector: string) =>
          Array.from(root.querySelectorAll(selector)) as HTMLElement[],
        update: async () => {
          fixture.detectChanges();
          await fixture.whenStable();
          await new Promise((resolve) => setTimeout(resolve, 0));
          fixture.detectChanges();
        },
      };
    }

    it('adds classes and styles to the root, the list, the items and the separators', async () => {
      const { el, all } = await renderParts();
      const rootEl = el('andes-breadcrumb');

      expect(rootEl.classList).toContain('my-root');
      expect(rootEl.classList).toContain('andes-breadcrumb');
      expect(rootEl.style.outline).toBe('3px solid red');

      const list = el('ol');
      expect(list.classList).toContain('my-list');
      expect(list.classList).toContain('andes-breadcrumb-list');
      expect(list.style.columnGap).toBe('9px');

      const items = all('li.andes-breadcrumb-item');
      expect(items).toHaveLength(5);
      for (const item of items) {
        expect(item.classList).toContain('my-item');
        expect(item.style.letterSpacing).toBe('1px');
      }
      // The item's own `className` stays next to the part's class.
      expect(items[0].classList).toContain('own-item');

      const separators = all('li.andes-breadcrumb-separator');
      expect(separators).toHaveLength(4);
      for (const separator of separators) {
        expect(separator.classList).toContain('my-separator');
        expect(separator.style.opacity).toBe('0.5');
      }
    });

    it('adds the link part to whatever a crumb renders', async () => {
      const { all, el } = await renderParts();

      const link = el('a.andes-breadcrumb-link');
      const button = el('button.andes-breadcrumb-link--button');
      const text = el(
        '.andes-breadcrumb-text:not(.andes-breadcrumb-text--disabled)',
      );
      const disabled = el('.andes-breadcrumb-text--disabled');
      const page = el('.andes-breadcrumb-page');

      for (const crumb of [link, button, text, disabled, page]) {
        expect(crumb.classList).toContain('my-link');
        expect(crumb.style.fontWeight).toBe('700');
      }
      // Each keeps its own class: the part adds, never replaces.
      expect(button.classList).toContain('andes-breadcrumb-link');
      expect(disabled.classList).toContain('andes-breadcrumb-text');
      expect(disabled.getAttribute('aria-disabled')).toBe('true');
      expect(page.getAttribute('aria-current')).toBe('page');
      // Nothing outside the crumbs picks it up.
      expect(all('.my-link')).toHaveLength(5);
    });

    it('adds the link part to a crumb menu trigger and its caret-only button', async () => {
      const { host, all, update } = await renderParts();
      host.items.set([
        { title: 'Home', href: '/' },
        {
          title: 'Components',
          href: '/components',
          menu: { items: [{ label: 'General' }] },
        },
        { title: 'Group', menu: { items: [{ label: 'Layout' }] } },
        { title: 'Here' },
      ]);
      await update();

      const triggers = all('button.andes-breadcrumb-menu-trigger');
      expect(triggers).toHaveLength(2);
      for (const trigger of triggers) {
        expect(trigger.classList).toContain('my-link');
        expect(trigger.style.fontWeight).toBe('700');
      }
      expect(triggers[0].classList).toContain(
        'andes-breadcrumb-menu-trigger--caret',
      );
      // The link beside the caret is a link too.
      expect(all('a.my-link')).toHaveLength(2);
    });

    it('adds the ellipsis part to the collapse dots and the menu part to its panel', async () => {
      const { host, el, update } = await renderParts((h) => h.maxItems.set(3));
      const ellipsis = el('andes-breadcrumb-ellipsis');

      expect(ellipsis.classList).toContain('my-ellipsis');
      expect(ellipsis.classList).toContain('andes-breadcrumb-ellipsis');
      expect(ellipsis.style.borderRadius).toBe('4px');

      (
        ellipsis.querySelector(
          '.andes-breadcrumb-ellipsis__trigger',
        ) as HTMLElement
      ).click();
      await update();

      const panel = document.querySelector(
        '.andes-dropdown-menu__content',
      ) as HTMLElement;
      expect(panel.classList).toContain('my-menu');
      expect(panel.classList).toContain('andes-dropdown-menu__content');
      expect(panel.style.borderWidth).toBe('5px');
      // The classes of the part never leak onto the trail.
      expect(host.items().length).toBeGreaterThan(3);
      expect(el('ol').classList).not.toContain('my-menu');
    });

    it('adds the menu part to the panel of a crumb menu', async () => {
      const { host, el, update } = await renderParts();
      host.items.set([
        { title: 'Home', href: '/' },
        { title: 'Group', menu: { items: [{ label: 'Layout' }] } },
        { title: 'Here' },
      ]);
      await update();
      el('.andes-breadcrumb-menu-trigger').click();
      await update();

      const panel = document.querySelector(
        '.andes-dropdown-menu__content',
      ) as HTMLElement;
      expect(panel.classList).toContain('my-menu');
      expect(panel.style.borderWidth).toBe('5px');
    });

    it('follows the inputs and leaves only the library classes when they are cleared', async () => {
      const { host, el, update } = await renderParts();
      host.classNames.set({ link: 'other-link' });
      host.styles.set({ link: { 'font-style': 'italic' } });
      await update();

      expect(el('a.andes-breadcrumb-link').classList).toContain('other-link');
      expect(el('a.andes-breadcrumb-link').classList).not.toContain('my-link');
      expect(el('a.andes-breadcrumb-link').style.fontStyle).toBe('italic');
      expect(el('a.andes-breadcrumb-link').style.fontWeight).toBe('');
      expect(el('andes-breadcrumb').classList).not.toContain('my-root');
      expect(el('andes-breadcrumb').style.outline).toBe('');

      host.classNames.set(null);
      host.styles.set(null);
      await update();

      expect(el('andes-breadcrumb').className.trim()).toBe('andes-breadcrumb');
      expect(el('ol').className.trim()).toBe('andes-breadcrumb-list');
      expect(el('a.andes-breadcrumb-link').className.trim()).toBe(
        'andes-breadcrumb-link',
      );
      expect(el('andes-breadcrumb').getAttribute('style') ?? '').toBe('');
      expect(el('ol').getAttribute('style') ?? '').toBe('');
      expect(el('a.andes-breadcrumb-link').getAttribute('style') ?? '').toBe(
        '',
      );
    });

    it('reaches the parts of a projected trail', async () => {
      @Component({
        imports: [
          AndesBreadcrumb,
          AndesBreadcrumbList,
          AndesBreadcrumbItem,
          AndesBreadcrumbLink,
          AndesBreadcrumbPage,
          AndesBreadcrumbSeparator,
          AndesBreadcrumbEllipsis,
        ],
        template: `
          <andes-breadcrumb
            [classNames]="{
              root: 'p-root',
              list: 'p-list',
              item: 'p-item',
              link: 'p-link',
              separator: 'p-sep',
              ellipsis: 'p-dots',
            }"
            [styles]="{ link: { 'font-weight': '700' } }"
          >
            <ol andesBreadcrumbList class="mine">
              <li andesBreadcrumbItem>
                <a andesBreadcrumbLink href="/" class="mine-link">Home</a>
              </li>
              <li andesBreadcrumbSeparator></li>
              <li andesBreadcrumbItem><andes-breadcrumb-ellipsis /></li>
              <li andesBreadcrumbSeparator></li>
              <li andesBreadcrumbItem>
                <span andesBreadcrumbPage>Here</span>
              </li>
            </ol>
          </andes-breadcrumb>
        `,
      })
      class ProjectedHost {}

      const fixture = TestBed.createComponent(ProjectedHost);
      fixture.detectChanges();
      await fixture.whenStable();
      const root = fixture.nativeElement as HTMLElement;
      const q = (selector: string) =>
        root.querySelector(selector) as HTMLElement;

      expect(q('andes-breadcrumb').classList).toContain('p-root');
      expect(q('ol').classList).toContain('p-list');
      // The consumer's own class stays beside the part's.
      expect(q('ol').classList).toContain('mine');
      expect(q('a').classList).toContain('p-link');
      expect(q('a').classList).toContain('mine-link');
      expect(q('a').style.fontWeight).toBe('700');
      expect(q('.andes-breadcrumb-page').classList).toContain('p-link');
      expect(q('li.andes-breadcrumb-item').classList).toContain('p-item');
      expect(q('li.andes-breadcrumb-separator').classList).toContain('p-sep');
      expect(q('andes-breadcrumb-ellipsis').classList).toContain('p-dots');
    });

    it('leaves a part alone outside a breadcrumb root', () => {
      @Component({
        imports: [AndesBreadcrumbList, AndesBreadcrumbLink],
        template: `
          <ol andesBreadcrumbList>
            <li><a andesBreadcrumbLink href="/">Home</a></li>
          </ol>
        `,
      })
      class LooseHost {}

      const fixture = TestBed.createComponent(LooseHost);
      fixture.detectChanges();
      const root = fixture.nativeElement as HTMLElement;

      expect(root.querySelector('ol')?.className.trim()).toBe(
        'andes-breadcrumb-list',
      );
      expect(root.querySelector('a')?.className.trim()).toBe(
        'andes-breadcrumb-link',
      );
    });
  });

  describe('title as a template', () => {
    withElementGeometry();

    @Component({
      imports: [AndesBreadcrumb],
      template: `
        <ng-template #bold let-item="item" let-last="last" let-params="params">
          <strong
            class="bold"
            [attr.data-last]="last"
            [attr.data-id]="params.id"
            >{{ item.ariaLabel }}</strong
          >
        </ng-template>
        <andes-breadcrumb
          [items]="[
            { title: bold, ariaLabel: 'Start', href: '/' },
            {
              title: bold,
              ariaLabel: 'Menu crumb',
              menu: { items: [{ label: 'Sibling' }] },
              href: '/menu',
            },
            { title: bold, ariaLabel: 'Hidden', href: '/hidden' },
            { title: bold, ariaLabel: 'Also hidden', href: '/also' },
            { title: bold, ariaLabel: 'Here' },
          ]"
          [params]="{ id: 7 }"
          [maxItems]="maxItems()"
          menuLabel="Show menu"
        />
      `,
    })
    class TemplateTitleHost {
      readonly maxItems = signal<number | undefined>(undefined);
    }

    async function renderTemplateTitles(maxItems?: number) {
      const fixture = TestBed.createComponent(TemplateTitleHost);
      fixture.componentInstance.maxItems.set(maxItems);
      fixture.detectChanges();
      await fixture.whenStable();
      return {
        fixture,
        root: fixture.nativeElement as HTMLElement,
        update: async () => {
          fixture.detectChanges();
          await fixture.whenStable();
          await new Promise((resolve) => setTimeout(resolve, 0));
          fixture.detectChanges();
        },
      };
    }

    it('renders the template inside the link and the page with the render context', async () => {
      const { root } = await renderTemplateTitles();
      const link = root.querySelector('a.andes-breadcrumb-link') as HTMLElement;
      const page = root.querySelector('.andes-breadcrumb-page') as HTMLElement;

      expect(link.querySelector('strong.bold')?.textContent).toBe('Start');
      expect(link.querySelector('strong.bold')?.getAttribute('data-id')).toBe(
        '7',
      );
      expect(page.querySelector('strong.bold')?.textContent).toBe('Here');
      expect(page.querySelector('strong.bold')?.getAttribute('data-last')).toBe(
        'true',
      );
      // The template is the content: the ariaLabel is not added as a second, hidden copy.
      expect(root.querySelector('.andes-breadcrumb-sr-only')?.textContent).toBe(
        'Menu crumb: Show menu',
      );
    });

    it('names the caret button of a crumb with a menu by its ariaLabel', async () => {
      const { root } = await renderTemplateTitles();
      const caret = root.querySelector(
        '.andes-breadcrumb-menu-trigger--caret',
      ) as HTMLElement;

      expect(caret.textContent?.trim()).toBe('Menu crumb: Show menu');
    });

    it('labels a collapsed template crumb by its ariaLabel in the ellipsis dropdown', async () => {
      const { root, update } = await renderTemplateTitles(3);
      (
        root.querySelector('.andes-breadcrumb-ellipsis__trigger') as HTMLElement
      ).click();
      await update();

      const entries = Array.from(
        document.querySelectorAll('[role="menuitem"]'),
      ).map((entry) => entry.textContent?.trim());
      expect(entries.length).toBeGreaterThan(0);
      expect(
        entries.every(
          (label) =>
            label === 'Hidden' ||
            label === 'Also hidden' ||
            label === 'Menu crumb',
        ),
      ).toBe(true);
    });
  });

  // Right-to-left: the trail flows from the right, the separator chevron points left, and the
  // dropdown panel repeats the trail's direction and opens on the edge the trail's start is on.
  describe('right-to-left text', () => {
    withElementGeometry();

    const css = readFileSync(
      'packages/ui/src/lib/breadcrumb/breadcrumb.css',
      'utf8',
    );

    @Component({
      imports: [AndesBreadcrumb],
      template: `
        <div [attr.dir]="dir()">
          <andes-breadcrumb [items]="items" />
          <andes-breadcrumb [items]="longItems" [maxItems]="3" />
        </div>
      `,
    })
    class DirectionHost {
      readonly dir = signal<'rtl' | 'ltr' | null>('rtl');
      readonly items: AndesBreadcrumbItemType[] = [
        { title: 'Home', href: '/' },
        { title: 'Docs', href: '/docs' },
        {
          title: 'Forms',
          href: '/forms',
          menu: { items: [{ label: 'Validation' }, { label: 'Layout' }] },
          dropdownProps: { side: 'right' },
        },
        { title: 'Fields', menu: { items: [{ label: 'Text' }] } },
        { title: 'Here' },
      ];
      readonly longItems: AndesBreadcrumbItemType[] = [
        { title: 'Home', href: '/' },
        { title: 'Docs', href: '/docs' },
        { title: 'Guides', href: '/guides' },
        { title: 'Here' },
      ];
    }

    async function renderDirection(dir: 'rtl' | 'ltr' | null) {
      const fixture = TestBed.createComponent(DirectionHost);
      fixture.componentInstance.dir.set(dir);
      fixture.detectChanges();
      await fixture.whenStable();
      const root = fixture.nativeElement as HTMLElement;
      // The split "Forms" caret, then "Fields", then the collapse ellipsis of the second trail.
      const overlays = fixture.debugElement
        .queryAll(By.directive(AndesDropdownMenu))
        .map((node) => node.injector.get(AndesOverlayPrimitive));
      return {
        fixture,
        root,
        overlays,
        first: root.querySelector('andes-breadcrumb') as HTMLElement,
        update: async () => {
          fixture.detectChanges();
          await fixture.whenStable();
          await new Promise((resolve) => setTimeout(resolve, 0));
          fixture.detectChanges();
        },
      };
    }

    it('keeps the crumbs in reading order and puts a chevron between each pair', async () => {
      const { first } = await renderDirection('rtl');
      const list = first.querySelector('ol') as HTMLElement;

      expect(list.closest('[dir]')?.getAttribute('dir')).toBe('rtl');
      // DOM order is reading order; the flex row starts from the right on its own.
      const kinds = Array.from(list.children).map((li) =>
        li.classList.contains('andes-breadcrumb-separator') ? 'sep' : 'crumb',
      );
      expect(kinds).toEqual([
        'crumb',
        'sep',
        'crumb',
        'sep',
        'crumb',
        'sep',
        'crumb',
        'sep',
        'crumb',
      ]);
      expect(list.firstElementChild?.textContent?.trim()).toBe('Home');
      expect(
        first.querySelectorAll('.andes-breadcrumb-separator__icon'),
      ).toHaveLength(4);
    });

    it('mirrors the default chevron so it points toward the next crumb', async () => {
      const { first } = await renderDirection('rtl');
      const chevron = first.querySelector(
        '.andes-breadcrumb-separator__icon',
      ) as SVGElement;

      // The chevron is drawn pointing right, so the stylesheet flips it in right-to-left text...
      expect(chevron.querySelector('path')?.getAttribute('d')).toBe(
        'm9 18 6-6-6-6',
      );
      expect(
        declaredValue(
          css,
          '.andes-breadcrumb-separator__icon:dir(rtl)',
          'transform',
        ),
      ).toBe('scaleX(-1)');
      // ...and only that glyph: the caret and the dots are symmetric.
      expect(css.match(/scaleX\(-1\)/g)).toHaveLength(1);
      expect(css).not.toContain('menu-trigger__icon:dir');
      expect(css).not.toContain('ellipsis__icon:dir');
      expect(css).not.toContain('[dir=');
    });

    it('draws the menu caret after the label and the ellipsis as one centered box', async () => {
      const { root } = await renderDirection('rtl');
      const ellipsis = root.querySelector(
        'andes-breadcrumb-ellipsis',
      ) as HTMLElement;
      const trigger = root.querySelector(
        '.andes-breadcrumb-menu-trigger:not(.andes-breadcrumb-menu-trigger--caret)',
      ) as HTMLElement;

      expect(ellipsis.querySelector('button')?.textContent?.trim()).toBe(
        'More',
      );
      // The caret follows the label in the markup, so in right-to-left text it sits to its left.
      expect(trigger.textContent?.trim()).toBe('Fields');
      expect(trigger.lastElementChild?.classList).toContain(
        'andes-breadcrumb-menu-trigger__icon',
      );
    });

    it('repeats the trail direction on the dropdown panel it renders outside the trail', async () => {
      const { root, update } = await renderDirection('rtl');
      (
        root.querySelector('.andes-breadcrumb-ellipsis__trigger') as HTMLElement
      ).click();
      await update();

      const panel = document.querySelector(
        '.andes-dropdown-menu__content',
      ) as HTMLElement;
      expect(panel.getAttribute('dir')).toBe('rtl');
      expect(panel.closest('andes-breadcrumb')).toBeNull();
    });

    it('gives a left-to-right trail a left-to-right panel', async () => {
      const { root, update } = await renderDirection('ltr');
      (
        root.querySelector('.andes-breadcrumb-ellipsis__trigger') as HTMLElement
      ).click();
      await update();

      expect(
        document
          .querySelector('.andes-dropdown-menu__content')
          ?.getAttribute('dir'),
      ).toBe('ltr');
    });

    it('opens on the start edge of a right-to-left trail inside a left-to-right page', async () => {
      const { overlays } = await renderDirection('rtl');

      // `side: 'right'` is the end of the text, which here is the left; the page is
      // left-to-right, so the overlay's `start` would be the left: mirrored to `end` it sits on
      // the right, where this trail starts.
      expect(overlays[0].config().positioning).toMatchObject({
        side: 'left',
        align: 'end',
      });
      expect(overlays[1].config().positioning).toMatchObject({
        side: 'bottom',
        align: 'end',
      });
    });

    it('takes the placement again, before the menu opens, when the direction changes', async () => {
      const { fixture, overlays, root, update } = await renderDirection('ltr');
      expect(overlays[1].config().positioning).toMatchObject({
        align: 'start',
      });

      fixture.componentInstance.dir.set('rtl');
      await update();
      (
        root.querySelectorAll(
          '.andes-breadcrumb-menu-trigger',
        )[1] as HTMLElement
      ).click();
      await update();

      expect(overlays[1].config().positioning).toMatchObject({
        side: 'bottom',
        align: 'end',
      });
      expect(
        document
          .querySelector('.andes-dropdown-menu__content')
          ?.getAttribute('dir'),
      ).toBe('rtl');
    });

    it('does not mirror the placement of a left-to-right trail', async () => {
      const { overlays } = await renderDirection('ltr');

      expect(overlays[0].config().positioning).toMatchObject({
        side: 'right',
        align: 'start',
      });
      expect(overlays[1].config().positioning).toMatchObject({
        side: 'bottom',
        align: 'start',
      });
    });

    describe('when the whole page is right-to-left', () => {
      beforeEach(() => document.body.setAttribute('dir', 'rtl'));
      afterEach(() => document.body.removeAttribute('dir'));

      it('leaves the placement to the overlay, which already lays start and end out by it', async () => {
        const { overlays } = await renderDirection(null);

        expect(overlays[0].config().positioning).toMatchObject({
          side: 'right',
          align: 'start',
        });
        expect(overlays[1].config().positioning).toMatchObject({
          side: 'bottom',
          align: 'start',
        });
      });

      it('gives the panel the page direction', async () => {
        const { root, update } = await renderDirection(null);
        (
          root.querySelector(
            '.andes-breadcrumb-ellipsis__trigger',
          ) as HTMLElement
        ).click();
        await update();

        expect(
          document
            .querySelector('.andes-dropdown-menu__content')
            ?.getAttribute('dir'),
        ).toBe('rtl');
      });
    });
  });

  describe('keyboard on a crumb menu trigger', () => {
    withElementGeometry();

    async function renderTrigger() {
      @Component({
        imports: [AndesBreadcrumb],
        template: `
          <andes-breadcrumb
            [items]="[
              { title: 'Home', href: '/' },
              {
                title: 'Group',
                menu: { items: [{ label: 'Layout' }, { label: 'Form' }] },
              },
              { title: 'Here' },
            ]"
          />
        `,
      })
      class TriggerHost {}

      const fixture = TestBed.createComponent(TriggerHost);
      fixture.detectChanges();
      await fixture.whenStable();
      const trigger = (fixture.nativeElement as HTMLElement).querySelector(
        '.andes-breadcrumb-menu-trigger',
      ) as HTMLButtonElement;
      return {
        fixture,
        trigger,
        update: async () => {
          fixture.detectChanges();
          await fixture.whenStable();
          await new Promise((resolve) => setTimeout(resolve, 0));
          fixture.detectChanges();
        },
      };
    }

    it('is a focusable native button, so Tab reaches it and Enter or Space press it', async () => {
      const { trigger } = await renderTrigger();

      expect(trigger.tagName).toBe('BUTTON');
      expect(trigger.type).toBe('button');
      expect(trigger.tabIndex).toBe(0);
      expect(trigger.hasAttribute('tabindex')).toBe(false);
    });

    it('opens on ArrowDown, moves through the entries and closes on Escape back onto the trigger', async () => {
      const { trigger, update } = await renderTrigger();
      trigger.focus();
      pressKey(trigger, 'ArrowDown');
      await update();

      expect(trigger.getAttribute('aria-expanded')).toBe('true');
      const entries = () =>
        Array.from(
          document.querySelectorAll('[role="menuitem"]'),
        ) as HTMLElement[];
      expect(entries().map((entry) => entry.textContent?.trim())).toEqual([
        'Layout',
        'Form',
      ]);

      pressKey(document.activeElement ?? document.body, 'Escape');
      await update();
      expect(trigger.getAttribute('aria-expanded')).toBe('false');
      expect(document.activeElement).toBe(trigger);
    });

    it('opens when it is pressed, which is what Enter and Space do on a button', async () => {
      const { trigger, update } = await renderTrigger();
      trigger.click();
      await update();

      expect(trigger.getAttribute('aria-expanded')).toBe('true');
    });
  });

  describe('dark mode and tokens', () => {
    const css = readFileSync(
      'packages/ui/src/lib/breadcrumb/breadcrumb.css',
      'utf8',
    );

    it('takes every color from a library token or the forced-colors system palette', () => {
      const withoutComments = css.replace(/\/\*[\s\S]*?\*\//g, '');
      // No literal color: a hex, an rgb()/hsl() or a named color would stay put in dark mode.
      expect(withoutComments).not.toMatch(/#[0-9a-f]{3,8}\b/i);
      expect(withoutComments).not.toMatch(/\b(?:rgb|rgba|hsl|hsla|oklch)\(/);
      for (const named of ['white', 'black', 'gray', 'red', 'blue']) {
        expect(withoutComments).not.toMatch(
          new RegExp(`(?:color|background(?:-color)?)\\s*:\\s*${named}\\b`),
        );
      }
      // Every `--andes-*` the stylesheet reads, so a theme can override it.
      expect(withoutComments).toContain('var(--andes-color-muted-foreground)');
      expect(withoutComments).toContain('var(--andes-color-foreground)');
      expect(withoutComments).toContain('var(--andes-color-accent)');
    });
  });
});
