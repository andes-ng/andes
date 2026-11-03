import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { AndesMenu } from './menu';
import { AndesMenuItem } from './menu-item';
import type { AndesMenuMode } from './menu-types';
import { AndesSubMenu } from './sub-menu';

/*
  The menu draws lucide icons through `<ng-icon>` and registers them itself: this test bed never
  calls `provideIcons`, so an icon whose svg is rendered proves the registration is automatic.
*/

@Component({
  imports: [AndesMenu, AndesMenuItem, AndesSubMenu],
  template: `
    <andes-menu ariaLabel="Main" [mode]="mode()">
      <andes-menu-item key="home">Home</andes-menu-item>
      <andes-sub-menu key="reports" label="Reports">
        <andes-menu-item key="daily">Daily</andes-menu-item>
      </andes-sub-menu>
      <andes-menu-item key="docs">Docs</andes-menu-item>
      <andes-menu-item key="mail">Mail</andes-menu-item>
    </andes-menu>
  `,
})
class Host {
  readonly mode = signal<AndesMenuMode>('vertical');
}

/** The `name` of every drawn `<ng-icon>` under `root`, or of every one that drew nothing. */
function icons(root: ParentNode, drawn = true): string[] {
  return Array.from(root.querySelectorAll('ng-icon'))
    .filter((icon) => (icon.querySelector('svg') !== null) === drawn)
    .map((icon) => icon.getAttribute('name') ?? '?');
}

describe('menu icons', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('draws the chevron of a submenu row', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const root: HTMLElement = fixture.nativeElement;

    expect(icons(root)).toEqual(['lucideChevronDown']);
    expect(icons(root, false)).toEqual([]);
  });

  it('draws the dots of the overflow submenu of a horizontal bar', () => {
    let resizeCallback: (() => void) | null = null;
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(callback: () => void) {
          resizeCallback = callback;
        }
        observe(): void {
          /* noop */
        }
        unobserve(): void {
          /* noop */
        }
        disconnect(): void {
          /* noop */
        }
      },
    );
    // jsdom lays nothing out: a 280px bar and 100px items push the last ones into the overflow.
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(
      function (this: HTMLElement) {
        return this.hasAttribute('data-andes-menu-list') ? 280 : 0;
      },
    );
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(
      function (this: HTMLElement) {
        const isUnit = this.classList.contains('andes-menu__node');
        const width = isUnit && !this.hasAttribute('data-overflowed') ? 100 : 0;
        return {
          width,
          height: 0,
          top: 0,
          left: 0,
          right: width,
          bottom: 0,
          x: 0,
          y: 0,
          toJSON: () => null,
        };
      },
    );

    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.mode.set('horizontal');
    fixture.detectChanges();
    (resizeCallback as (() => void) | null)?.();
    fixture.detectChanges();
    fixture.detectChanges();
    const root: HTMLElement = fixture.nativeElement;

    const trigger = root.querySelector('[data-overflow]');
    expect(trigger).not.toBeNull();
    // The row also holds its (hidden) chevron.
    expect(icons(trigger as Element)).toContain('lucideEllipsis');
    expect(icons(root, false)).toEqual([]);
  });
});
