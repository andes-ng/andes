import { AndesOverlayPrimitive } from '@andes-ng/primitives';
import { Component, signal, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { readFileSync } from 'node:fs';

import { declaredValue } from '../../testing/computed-style';
import { AndesDropdownMenu } from './dropdown-menu';
import { AndesDropdownMenuTrigger } from './dropdown-menu-trigger';
import type { AndesDropdownMenuItemDef } from './dropdown-menu-types';

/*
 * The sizes of a dropdown, pinned to the ones Ant Design draws (measured on
 * https://ant.design/components/dropdown): a 4px padded panel with an 8px radius and no
 * border, 32px rows with a 4px radius, a 1px divider with 4px above and below, a 12px
 * chevron 8px from the row's end, a 16 x 8 arrow, and a 4px gap to the trigger. jsdom has no
 * layout, so the sizes are asserted where they are declared; the story
 * `Navigation/Dropdown Menu/Examples` shows them side by side with Ant's.
 */

const MENU_CSS = readFileSync(
  'packages/ui/src/lib/dropdown-menu/dropdown-menu.css',
  'utf8',
);

const value = (selector: string, property: string) =>
  declaredValue(MENU_CSS, selector, property);

describe('dropdown-menu.css sizes (as drawn by Ant Design)', () => {
  it('pads the panel by 4px, rounds it by 8px and draws no border', () => {
    expect(value('.andes-dropdown-menu__content', 'padding')).toBe(
      'var(--andes-space-1)',
    );
    expect(value('.andes-dropdown-menu__content', 'border-radius')).toBe(
      'var(--andes-radius-lg)',
    );
    expect(value('.andes-dropdown-menu__content', 'border')).toBeUndefined();
    expect(value('.andes-dropdown-menu__content', 'box-shadow')).toBe(
      'var(--andes-dropdown-menu-shadow)',
    );
    expect(value('.andes-dropdown-menu__popup', 'border')).toBeUndefined();
  });

  it('lifts the panel with three soft layers, stronger in the dark theme', () => {
    const light = value(
      '.andes-dropdown-menu__content',
      '--andes-dropdown-menu-shadow',
    );
    const dark = value(
      "[data-andes-theme='dark'] .andes-dropdown-menu__content",
      '--andes-dropdown-menu-shadow',
    );
    expect(light?.split('rgb(')).toHaveLength(4);
    expect(light).toContain('0 6px 16px 0 rgb(0 0 0 / 8%)');
    expect(light).toContain('0 3px 6px -4px rgb(0 0 0 / 12%)');
    expect(light).toContain('0 9px 28px 8px rgb(0 0 0 / 5%)');
    expect(dark?.split('rgb(')).toHaveLength(4);
    expect(dark).toContain('0 6px 16px 0 rgb(0 0 0 / 40%)');
  });

  it('is no narrower than its trigger and has no minimum of its own', () => {
    expect(value('.andes-dropdown-menu__content', 'min-width')).toBe(
      'var(--andes-dropdown-menu-min-width, 0)',
    );
    expect(value('.andes-dropdown-menu__popup', 'min-width')).toBe(
      'var(--andes-dropdown-menu-min-width, 0)',
    );
  });

  it('makes a row 32px tall with 12px of inline padding and a 4px radius', () => {
    expect(value('.andes-dropdown-menu__item', 'min-height')).toBe('2rem');
    expect(value('.andes-dropdown-menu__item', 'padding')).toBe(
      'var(--andes-space-1) var(--andes-space-3)',
    );
    expect(value('.andes-dropdown-menu__item', 'border-radius')).toBe(
      'var(--andes-radius-sm)',
    );
  });

  it('only tints a hovered or focused row, keeping its text color', () => {
    for (const selector of [
      '.andes-dropdown-menu__item:hover:not([data-disabled])',
      '.andes-dropdown-menu__item[data-active]:not([data-disabled])',
    ]) {
      expect(value(selector, 'background-color')).toBe(
        'var(--andes-dropdown-menu-hover)',
      );
      expect(value(selector, 'color')).toBeUndefined();
    }
  });

  it('does not make a selected row heavier', () => {
    expect(
      value(
        '.andes-dropdown-menu__item[data-selected]:not([data-disabled])',
        'font-weight',
      ),
    ).toBeUndefined();
  });

  it('draws a 1px divider inside the panel padding, 4px above and below', () => {
    expect(value('.andes-dropdown-menu__separator', 'height')).toBe('1px');
    expect(value('.andes-dropdown-menu__separator', 'margin')).toBe(
      'var(--andes-space-1) 0',
    );
  });

  it('draws a group title as a 32px, 14/22 row and insets the rows of its group', () => {
    expect(value('.andes-dropdown-menu__label', 'padding')).toBe(
      '0.3125rem var(--andes-space-3)',
    );
    expect(value('.andes-dropdown-menu__label', 'font-size')).toBe(
      'var(--andes-text-font-size, 0.875rem)',
    );
    expect(value('.andes-dropdown-menu__label', 'line-height')).toBe(
      'var(--andes-text-line-height, 1.375rem)',
    );
    expect(
      value(
        '.andes-dropdown-menu__group .andes-dropdown-menu__item',
        'margin-inline',
      ),
    ).toBe('var(--andes-space-2)');
  });

  it('draws the submenu chevron at 12px, 8px from the end of its row', () => {
    expect(value('.andes-dropdown-menu__expand-icon', 'font-size')).toBe(
      '0.75rem',
    );
    expect(
      value('.andes-dropdown-menu__expand-icon', 'margin-inline-end'),
    ).toBe('calc(var(--andes-space-1) * -1)');
    expect(value('.andes-dropdown-menu__expand-icon svg', 'width')).toBe('1em');
    // The chevron follows the row's text color, even while the row is hovered.
    expect(value('.andes-dropdown-menu__expand-icon', 'color')).toBeUndefined();
  });

  it('draws the arrow as a 16 x 9 box, tip outwards, painted in the panel surface', () => {
    expect(value('.andes-dropdown-menu__arrow', 'width')).toBe('16px');
    expect(value('.andes-dropdown-menu__arrow', 'height')).toBe('9px');
    expect(value('.andes-dropdown-menu__arrow', 'background-color')).toBe(
      'var(--andes-color-popover)',
    );
    expect(value('.andes-dropdown-menu__arrow', 'border')).toBeUndefined();
    // 8px outside the panel, 1px of it overlapping the panel so they read as one shape.
    expect(
      value(".andes-dropdown-menu__arrow[data-side='bottom']", 'top'),
    ).toBe('-8px');
    expect(
      value(".andes-dropdown-menu__arrow[data-side='top']", 'bottom'),
    ).toBe('-8px');
  });

  it('starts a submenu where its row ends, level with the first row', () => {
    const sub = readFileSync(
      'packages/ui/src/lib/dropdown-menu/dropdown-menu-sub.ts',
      'utf8',
    );
    expect(sub).toContain('const SIDE_OFFSET = 0;');
    expect(sub).toContain('const ALIGN_OFFSET = -4;');
  });
});

// ---------------------------------------------------------------------------
// Behaviour: the gap to the trigger and the panel's minimum width
// ---------------------------------------------------------------------------

const sleep = (ms = 0) => new Promise((resolve) => setTimeout(resolve, ms));

async function settle(fixture: ComponentFixture<unknown>) {
  fixture.detectChanges();
  await fixture.whenStable();
  await sleep();
  fixture.detectChanges();
  await fixture.whenStable();
}

@Component({
  imports: [AndesDropdownMenu, AndesDropdownMenuTrigger],
  template: `
    <andes-dropdown-menu [items]="items" [arrow]="arrow()">
      <button type="button" id="trigger" andesDropdownMenuTrigger>
        Trigger
      </button>
    </andes-dropdown-menu>
  `,
})
class GapHost {
  readonly menu = viewChild.required(AndesDropdownMenu);
  readonly arrow = signal(false);
  readonly items: AndesDropdownMenuItemDef[] = [{ key: 'a', label: 'A' }];
}

describe('AndesDropdownMenu spacing', () => {
  let fixture: ComponentFixture<GapHost>;

  const overlay = () =>
    fixture.debugElement
      .query(By.directive(AndesDropdownMenu))
      .injector.get(AndesOverlayPrimitive);
  const trigger = () => document.getElementById('trigger') as HTMLButtonElement;

  beforeEach(async () => {
    fixture = TestBed.createComponent(GapHost);
    await settle(fixture);
  });

  afterEach(() => fixture.destroy());

  it('keeps a 4px gap between the trigger and the panel', () => {
    expect(overlay().config().positioning).toMatchObject({ sideOffset: 4 });
  });

  it('keeps 11.5px for an arrow: its 5.5px tip and a 6px gap', async () => {
    fixture.componentInstance.arrow.set(true);
    await settle(fixture);
    expect(overlay().config().positioning).toMatchObject({ sideOffset: 11.5 });
  });

  it('never opens narrower than its trigger', async () => {
    vi.spyOn(trigger(), 'getBoundingClientRect').mockReturnValue(
      new DOMRect(0, 0, 148, 32),
    );
    trigger().click();
    await settle(fixture);

    expect(overlay().config().size.minWidth).toBe(148);
  });

  it('has no minimum width when it opens at a point', async () => {
    fixture.componentInstance.menu().showAt(10, 10);
    await settle(fixture);

    expect(overlay().config().size.minWidth).toBe(0);
  });

  it('leaves a minimum width a wrapping component set itself', async () => {
    overlay().configure({ size: { minWidth: 240 } });
    trigger().click();
    await settle(fixture);

    expect(overlay().config().size.minWidth).toBe(240);
  });
});
