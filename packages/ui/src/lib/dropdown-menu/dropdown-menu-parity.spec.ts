import { AndesOverlayPrimitive } from '@andes-ng/primitives';
import { Component, signal, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideChevronDown } from '@ng-icons/lucide';
import { readFileSync } from 'node:fs';

import { declaredValue } from '../../testing/computed-style';
import { AndesButton } from '../button/button';
import { AndesDropdownButton } from './dropdown-button';
import { AndesDropdownMenu } from './dropdown-menu';
import { AndesDropdownMenuContent } from './dropdown-menu-content';
import { AndesDropdownMenuItem } from './dropdown-menu-item';
import { AndesDropdownMenuTrigger } from './dropdown-menu-trigger';
import type {
  AndesDropdownMenuClickEvent,
  AndesDropdownMenuItemDef,
  AndesDropdownMenuOpenChange,
} from './dropdown-menu-types';

/** jsdom reports zero geometry for every element, which CDK reads as "not focusable". */
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

const sleep = (ms = 0) => new Promise((resolve) => setTimeout(resolve, ms));

async function settle(fixture: ComponentFixture<unknown>, ms = 0) {
  fixture.detectChanges();
  await fixture.whenStable();
  await sleep(ms);
  fixture.detectChanges();
  await fixture.whenStable();
}

function pressKey(target: EventTarget, key: string): void {
  const event = new KeyboardEvent('keydown', {
    key,
    bubbles: true,
    cancelable: true,
  });
  Object.defineProperty(event, 'keyCode', {
    get: () => (key === 'Escape' ? 27 : key.toUpperCase().charCodeAt(0)),
  });
  target.dispatchEvent(event);
}

const menus = () =>
  Array.from(document.querySelectorAll<HTMLElement>('[role="menu"]'));
const byId = (id: string) => document.getElementById(id) as HTMLElement;

const MENU_CSS = readFileSync(
  'packages/ui/src/lib/dropdown-menu/dropdown-menu.css',
  'utf8',
);
const BUTTON_CSS = readFileSync(
  'packages/ui/src/lib/button/button.css',
  'utf8',
);

// ---------------------------------------------------------------------------
// showAt(): a menu with no trigger element ("selection actions")
// ---------------------------------------------------------------------------

@Component({
  imports: [AndesDropdownMenu],
  template: `
    <button type="button" id="before">Before</button>
    <andes-dropdown-menu
      [items]="items"
      [disabled]="disabled()"
      (itemClick)="clicks.push($event)"
      (openStateChange)="changes.push($event)"
    />
  `,
})
class PointHost {
  readonly menu = viewChild.required(AndesDropdownMenu);
  readonly disabled = signal(false);
  readonly clicks: AndesDropdownMenuClickEvent[] = [];
  readonly changes: AndesDropdownMenuOpenChange[] = [];
  readonly items: AndesDropdownMenuItemDef[] = [
    { key: 'copy', label: 'Copy' },
    { key: 'search', label: 'Search' },
  ];
}

describe('AndesDropdownMenu.showAt (no trigger element)', () => {
  withElementGeometry();

  let fixture: ComponentFixture<PointHost>;
  let host: PointHost;

  const anchor = () =>
    fixture.debugElement
      .query(By.directive(AndesDropdownMenu))
      .injector.get(AndesOverlayPrimitive)
      .anchor() as HTMLElement;

  beforeEach(async () => {
    fixture = TestBed.createComponent(PointHost);
    host = fixture.componentInstance;
    await settle(fixture);
  });

  afterEach(() => fixture.destroy());

  it('opens at the given viewport point, with the first item focused', async () => {
    byId('before').focus();
    host.menu().showAt(120, 80);
    await settle(fixture);

    expect(menus()).toHaveLength(1);
    expect(anchor().classList).toContain('andes-dropdown-menu__point-anchor');
    expect(anchor().style.left).toBe('120px');
    expect(anchor().style.top).toBe('80px');
    expect(host.changes).toEqual([{ open: true, source: 'programmatic' }]);
    expect(document.activeElement?.textContent).toContain('Copy');
  });

  it('reports a click on an item and closes, returning focus to where it was', async () => {
    byId('before').focus();
    host.menu().showAt(10, 10);
    await settle(fixture);

    (document.activeElement as HTMLElement).click();
    await settle(fixture);

    expect(host.clicks.map((click) => click.key)).toEqual(['copy']);
    expect(menus()).toHaveLength(0);
    expect(document.activeElement).toBe(byId('before'));
    expect(
      document.querySelector('.andes-dropdown-menu__point-anchor'),
    ).toBeNull();
  });

  it('moves an open menu to the new point instead of stacking a second one', async () => {
    host.menu().showAt(10, 10);
    await settle(fixture);
    host.menu().showAt(50, 60);
    await settle(fixture);

    expect(menus()).toHaveLength(1);
    expect(anchor().style.left).toBe('50px');
    expect(
      document.querySelectorAll('.andes-dropdown-menu__point-anchor'),
    ).toHaveLength(1);
  });

  it('closes on Escape', async () => {
    host.menu().showAt(10, 10);
    await settle(fixture);
    pressKey(document.body, 'Escape');
    await settle(fixture);

    expect(menus()).toHaveLength(0);
    expect(host.changes.at(-1)).toEqual({ open: false, source: 'escape-key' });
  });

  it('does nothing while the menu is disabled', async () => {
    host.disabled.set(true);
    await settle(fixture);
    host.menu().showAt(10, 10);
    await settle(fixture);

    expect(menus()).toHaveLength(0);
    expect(host.changes).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Items array and split button additions
// ---------------------------------------------------------------------------

@Component({
  imports: [AndesDropdownMenu, AndesDropdownMenuTrigger],
  host: { 'data-spec': 'classes' },
  template: `
    <andes-dropdown-menu [items]="items" [subMenuOpenDelay]="0">
      <button type="button" id="trigger" andesDropdownMenuTrigger>
        Classes
      </button>
    </andes-dropdown-menu>
  `,
})
class ClassHost {
  readonly items: AndesDropdownMenuItemDef[] = [
    { key: 'a', label: 'Styled', class: 'my-row other-row' },
    { key: 'b', label: 'Plain' },
    { key: 'c', label: 'Nested', class: 'my-sub', children: [] },
  ];
}

@Component({
  imports: [AndesDropdownButton],
  template: `
    <andes-dropdown-button [danger]="danger()" [items]="[]">
      Remove
    </andes-dropdown-button>
  `,
})
class DangerHost {
  readonly danger = signal(true);
}

describe('items entry `class`', () => {
  withElementGeometry();

  it('adds the classes to that row only, keeping the item class', async () => {
    const fixture = TestBed.createComponent(ClassHost);
    await settle(fixture);
    byId('trigger').click();
    await settle(fixture);

    const rows = Array.from(
      document.querySelectorAll<HTMLElement>('.andes-dropdown-menu__item'),
    );
    expect(rows[0].classList).toContain('my-row');
    expect(rows[0].classList).toContain('other-row');
    expect(rows[0].classList).toContain('andes-dropdown-menu__item');
    expect(rows[1].classList).not.toContain('my-row');
    expect(rows[2].classList).toContain('my-sub');
    expect(rows[2].classList).toContain('andes-dropdown-menu__sub-trigger');
    fixture.destroy();
  });
});

describe('AndesDropdownButton danger', () => {
  it('styles both halves as danger, and stops when turned off', async () => {
    const fixture = TestBed.createComponent(DangerHost);
    await settle(fixture);
    const colors = () =>
      Array.from(
        (fixture.nativeElement as HTMLElement).querySelectorAll('button'),
      ).map((button) => button.getAttribute('data-color'));

    expect(colors()).toEqual(['danger', 'danger']);

    fixture.componentInstance.danger.set(false);
    await settle(fixture);
    expect(colors()).toEqual([null, null]);
    fixture.destroy();
  });
});

// ---------------------------------------------------------------------------
// Stylesheet contracts
// ---------------------------------------------------------------------------

describe('dropdown-menu.css', () => {
  it('tints a selected row with the primary color, not a neutral mix', () => {
    expect(
      declaredValue(
        MENU_CSS,
        '.andes-dropdown-menu__item[data-selected]',
        'background-color',
      ),
    ).toMatch(/var\(--andes-color-primary\) \d+%/);
  });

  it('lays trailing content and the submenu chevron out on the inline axis', () => {
    for (const selector of [
      '.andes-dropdown-menu__shortcut',
      '.andes-dropdown-menu__extra',
      '.andes-dropdown-menu__expand-icon',
    ]) {
      expect(declaredValue(MENU_CSS, selector, 'margin-inline-start')).toBe(
        'auto',
      );
      expect(declaredValue(MENU_CSS, selector, 'margin-left')).toBeUndefined();
      expect(declaredValue(MENU_CSS, selector, 'padding-left')).toBeUndefined();
    }
  });

  it('mirrors the default submenu chevron in a right-to-left document', () => {
    expect(
      declaredValue(
        MENU_CSS,
        '.andes-dropdown-menu__chevron:dir(rtl)',
        'transform',
      ),
    ).toBe('scaleX(-1)');
  });
});

// ---------------------------------------------------------------------------
// A button used as a menu trigger hugs its content
// ---------------------------------------------------------------------------

@Component({
  imports: [
    AndesButton,
    AndesDropdownMenu,
    AndesDropdownMenuContent,
    AndesDropdownMenuItem,
    AndesDropdownMenuTrigger,
    NgIcon,
  ],
  providers: [provideIcons({ lucideChevronDown })],
  template: `
    <div style="display: flex; gap: 1rem; align-items: flex-start">
      <andes-dropdown-menu>
        <andes-button andesDropdownMenuTrigger id="plain">Options</andes-button>
      </andes-dropdown-menu>
      <andes-dropdown-menu>
        <andes-button andesDropdownMenuTrigger id="icons">
          With icons <ng-icon slot="icon-end" name="lucideChevronDown" />
        </andes-button>
        <andes-dropdown-menu-content>
          <andes-dropdown-menu-item>Edit</andes-dropdown-menu-item>
        </andes-dropdown-menu-content>
      </andes-dropdown-menu>
    </div>
  `,
})
class TriggerHost {}

/**
 * The trigger is a button of the regular control scale: label, then the icon a gap away,
 * all sized by its content. Nothing in the chain may give it a width of its own, grow it, or
 * spread its children apart - the "Hover me v" trigger of Ant's Dropdown is exactly that.
 * jsdom has no layout, so this pins the declarations that decide it.
 */
describe('a button as a dropdown menu trigger', () => {
  let fixture: ComponentFixture<TriggerHost>;

  beforeEach(async () => {
    fixture = TestBed.createComponent(TriggerHost);
    await settle(fixture);
  });

  afterEach(() => fixture.destroy());

  const host = (id: string) => byId(id);
  const inner = (id: string) =>
    host(id).querySelector('button') as HTMLButtonElement;

  it('makes the host a shrink-to-fit inline box that does not grow', () => {
    for (const id of ['plain', 'icons']) {
      const style = getComputedStyle(host(id));
      expect(style.display).toBe('inline-flex');
      expect(style.width).toBe('auto');
      expect(style.flexGrow).toBe('0');
    }
  });

  it('keeps the inner button content-sized and centered with the 8px gap and 15px padding', () => {
    const style = getComputedStyle(inner('icons'));

    expect(style.width).toBe('auto');
    expect(style.minWidth).toBe('auto');
    expect(style.flexGrow).toBe('0');
    expect(style.justifyContent).toBe('center');
    expect(declaredValue(BUTTON_CSS, '.andes-button', 'gap')).toBe(
      'var(--andes-space-2)',
    );
    // The md size: a 15px inline padding (8px/16px rhythm less the 1px border) around a
    // 32px control height. `padding-inline` is a logical shorthand jsdom does not expand.
    expect(
      declaredValue(BUTTON_CSS, '.andes-button--md', 'padding-inline'),
    ).toBe('0.9375rem');
    expect(declaredValue(BUTTON_CSS, '.andes-button--md', 'height')).toBe(
      'var(--andes-control-height-md, 2rem)',
    );
  });

  it('declares no width, min-width or space-between spreading on the base button', () => {
    for (const property of ['width', 'min-width', 'flex', 'flex-grow']) {
      expect(declaredValue(BUTTON_CSS, '.andes-button', property)).toBe(
        undefined,
      );
    }
    expect(declaredValue(BUTTON_CSS, '.andes-button', 'justify-content')).toBe(
      'center',
    );
  });

  it('projects the label first and the end icon last, as direct children', () => {
    const button = inner('icons');
    const elements = Array.from(button.children);

    expect(button.textContent?.trim()).toBe('With icons');
    expect(elements).toHaveLength(1);
    expect(elements[0].tagName).toBe('NG-ICON');
    expect(button.lastElementChild).toBe(elements[0]);
  });
});
