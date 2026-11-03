import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { AndesCommand } from './command';
import { AndesCommandDialog } from './command-dialog';
import type { AndesCommandEntry, AndesCommandItem } from './command-types';

/*
  The search mark, the "opens a page" chevron and the back arrow are lucide icons drawn through
  `<ng-icon>` and registered by the component itself: no test bed here calls `provideIcons`,
  so an icon whose svg is rendered proves the registration is automatic, in the dialog's
  overlay panel too.
*/

const ENTRIES: AndesCommandEntry[] = [
  { value: 'home', label: 'Home' },
  {
    value: 'projects',
    label: 'Projects',
    children: [{ value: 'alpha', label: 'Alpha' }],
  },
];

function names(root: ParentNode): string[] {
  return Array.from(root.querySelectorAll('ng-icon'))
    .filter((icon) => icon.querySelector('svg') !== null)
    .map((icon) => icon.getAttribute('name') ?? '?');
}

function blank(root: ParentNode): string[] {
  return Array.from(root.querySelectorAll('ng-icon'))
    .filter((icon) => icon.querySelector('svg') === null)
    .map((icon) => icon.getAttribute('name') ?? '?');
}

@Component({
  imports: [AndesCommand],
  template: `<andes-command [items]="items" [(pages)]="pages" />`,
})
class Host {
  readonly items = ENTRIES;
  readonly pages = signal<readonly AndesCommandItem[]>([]);
}

@Component({
  imports: [AndesCommandDialog],
  template: `<andes-command-dialog
    [items]="items"
    [open]="true"
    label="Palette"
  />`,
})
class DialogHost {
  readonly items = ENTRIES;
}

describe('AndesCommand lucide icons', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('draws the search mark and the chevron of an item that opens a page', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    expect(names(el)).toEqual(['lucideSearch', 'lucideChevronRight']);
    expect(
      el
        .querySelector('.andes-command__search-icon')
        ?.getAttribute('aria-hidden'),
    ).toBe('true');
    expect(blank(el)).toEqual([]);
  });

  it('draws the back arrow once a page is open', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.pages.set([ENTRIES[1] as AndesCommandItem]);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const back = el.querySelector('.andes-command__back ng-icon');

    expect(back?.getAttribute('name')).toBe('lucideChevronLeft');
    expect(back?.querySelector('svg')).not.toBeNull();
    expect(blank(el)).toEqual([]);
  });

  describe('in the dialog', () => {
    // jsdom reports zero geometry, which the overlay's positioning cannot place.
    const sizes = (['offsetWidth', 'offsetHeight'] as const).map(
      (prop) =>
        [
          prop,
          Object.getOwnPropertyDescriptor(HTMLElement.prototype, prop),
        ] as const,
    );

    beforeAll(() => {
      for (const [prop] of sizes) {
        Object.defineProperty(HTMLElement.prototype, prop, {
          configurable: true,
          get: () => 1,
        });
      }
    });

    afterAll(() => {
      for (const [prop, descriptor] of sizes) {
        if (descriptor) {
          Object.defineProperty(HTMLElement.prototype, prop, descriptor);
        } else {
          delete (HTMLElement.prototype as unknown as Record<string, unknown>)[
            prop
          ];
        }
      }
    });

    it('draws the icons inside the overlay panel', async () => {
      const fixture = TestBed.createComponent(DialogHost);
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
      const panel = document.querySelector(
        '.andes-command-dialog',
      ) as HTMLElement;

      expect(names(panel)).toEqual(['lucideSearch', 'lucideChevronRight']);
      expect(blank(panel)).toEqual([]);
    });
  });
});
