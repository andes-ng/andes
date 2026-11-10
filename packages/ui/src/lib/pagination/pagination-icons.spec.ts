import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { AndesPagination } from './pagination';

/*
  The pagination draws lucide icons through `<ng-icon>` and registers them itself: this test bed
  never calls `provideIcons`, so an icon whose svg is rendered proves the registration is
  automatic.
*/

@Component({
  imports: [AndesPagination],
  template: `<andes-pagination
    aria-label="Invoices"
    showSizeChanger
    [total]="300"
    [current]="15"
  />`,
})
class Host {}

/** The `name` of every drawn `<ng-icon>` under `root`, or of every one that drew nothing. */
function icons(root: ParentNode, drawn = true): string[] {
  return Array.from(root.querySelectorAll('ng-icon'))
    .filter((icon) => (icon.querySelector('svg') !== null) === drawn)
    .map((icon) => icon.getAttribute('name') ?? '?');
}

describe('pagination icons', () => {
  it('draws the arrows, both jumpers and the size changer chevron', async () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const root: HTMLElement = fixture.nativeElement;
    const names = icons(root);

    expect(names).toContain('lucideChevronLeft');
    expect(names).toContain('lucideChevronRight');
    expect(names).toContain('lucideChevronsLeft');
    expect(names).toContain('lucideChevronsRight');
    expect(names).toContain('lucideChevronDown');
    // Each jumper rests as the dots, and the size changer sits beside them.
    expect(names.filter((name) => name === 'lucideEllipsis')).toHaveLength(2);
    expect(icons(root, false)).toEqual([]);
  });

  it('draws the dots of a trailing gap that is not a jumper', async () => {
    @Component({
      imports: [AndesPagination],
      template: `<andes-pagination
        aria-label="Invoices"
        [showPrevNextJumpers]="false"
        [total]="300"
        [current]="15"
      />`,
    })
    class NoJumpers {}

    const fixture = TestBed.createComponent(NoJumpers);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const root: HTMLElement = fixture.nativeElement;

    expect(
      icons(root).filter((name) => name === 'lucideEllipsis'),
    ).toHaveLength(2);
    expect(icons(root)).not.toContain('lucideChevronsLeft');
    expect(icons(root, false)).toEqual([]);
  });
});
