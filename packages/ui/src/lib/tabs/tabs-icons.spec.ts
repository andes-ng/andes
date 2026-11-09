import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { AndesTabs } from './tabs';
import type { AndesTabsItem } from './tabs-types';

/*
  Tabs draw lucide icons through `<ng-icon>` and register them themselves: this test bed never
  calls `provideIcons`, so an icon whose svg is rendered proves the registration is automatic,
  in the bar and in the overflow menu panel alike.
*/

const ITEMS: AndesTabsItem[] = [
  { key: 'a', label: 'Tab a' },
  { key: 'b', label: 'Tab b' },
  { key: 'c', label: 'Tab c' },
];

@Component({
  imports: [AndesTabs],
  template: `<andes-tabs
    type="editable-card"
    [items]="items"
    [size]="size()"
    value="b"
  />`,
})
class Host {
  readonly items = ITEMS;
  readonly size = signal<'md' | 'lg'>('md');
}

/** The `name` of every drawn `<ng-icon>` under `root`, or of every one that drew nothing. */
function icons(root: ParentNode, drawn = true): string[] {
  return Array.from(root.querySelectorAll('ng-icon'))
    .filter((icon) => (icon.querySelector('svg') !== null) === drawn)
    .map((icon) => icon.getAttribute('name') ?? '?');
}

/** Stubs `getBoundingClientRect` on one element - jsdom lays nothing out. */
function stubRect(
  element: Element,
  rect: { left: number; width: number; height: number },
): void {
  Object.defineProperty(element, 'getBoundingClientRect', {
    configurable: true,
    value: () => ({
      ...rect,
      top: 0,
      right: rect.left + rect.width,
      bottom: rect.height,
      x: rect.left,
      y: 0,
      toJSON: () => ({}),
    }),
  });
}

async function settle(fixture: {
  detectChanges(): void;
  whenStable(): Promise<unknown>;
}) {
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
}

describe('tabs icons', () => {
  afterEach(() => {
    document.querySelector('.cdk-overlay-container')?.replaceChildren();
  });

  it('draws the add plus and the remove cross of an editable tab bar', async () => {
    const fixture = TestBed.createComponent(Host);
    await settle(fixture);
    const root: HTMLElement = fixture.nativeElement;
    const names = icons(root);

    expect(names).toContain('lucidePlus');
    expect(names.filter((name) => name === 'lucideX')).toHaveLength(3);
    expect(icons(root, false)).toEqual([]);
  });

  it('draws the scroll arrows and the "more" dots once the tabs overflow, and the cross in the menu', async () => {
    const fixture = TestBed.createComponent(Host);
    await settle(fixture);
    const root: HTMLElement = fixture.nativeElement;
    const scroller = root.querySelector('.andes-tabs__nav-wrap') as HTMLElement;
    for (const [key, value] of Object.entries({
      scrollWidth: 600,
      clientWidth: 200,
    })) {
      Object.defineProperty(scroller, key, { configurable: true, value });
    }
    stubRect(scroller, { left: 0, width: 200, height: 40 });
    const [a, b, c] = Array.from(root.querySelectorAll('andes-tabs-trigger'));
    stubRect(a, { left: -60, width: 60, height: 40 });
    stubRect(b, { left: 0, width: 100, height: 40 });
    stubRect(c, { left: 160, width: 100, height: 40 });
    // Any layout-affecting change re-measures; a real browser gets there via ResizeObserver.
    fixture.componentInstance.size.set('lg');
    await settle(fixture);

    const names = icons(root);
    expect(names).toContain('lucideChevronLeft');
    expect(names).toContain('lucideChevronRight');
    expect(names).toContain('lucideEllipsis');

    (root.querySelector('.andes-tabs__more') as HTMLButtonElement).click();
    await settle(fixture);

    const menu = document.querySelector('andes-tabs-more-menu') as Element;
    expect(menu).not.toBeNull();
    expect(icons(menu)).toEqual(['lucideX', 'lucideX']);
    expect(icons(document, false)).toEqual([]);
  });
});
