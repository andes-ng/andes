import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { AndesTransfer, type AndesTransferItem } from './transfer';

/*
  The transfer draws lucide icons through `<ng-icon>` and registers them itself: this test bed
  never calls `provideIcons`, so an icon whose svg is rendered proves the registration is
  automatic.
*/

const ITEMS: AndesTransferItem[] = Array.from({ length: 12 }, (_, index) => ({
  key: `k${index}`,
  title: `Item ${index}`,
}));

@Component({
  imports: [AndesTransfer],
  template: `<andes-transfer
    aria-label="Roles"
    showSearch
    [dataSource]="items"
    [targetKeys]="['k0', 'k1']"
    [selectedKeys]="['k2']"
    [pagination]="{ pageSize: 4 }"
  />`,
})
class Host {
  readonly items = ITEMS;
}

@Component({
  imports: [AndesTransfer],
  template: `<andes-transfer
    aria-label="Roles"
    oneWay
    [dataSource]="items"
    [targetKeys]="['k0']"
  />`,
})
class OneWayHost {
  readonly items = ITEMS.slice(0, 3);
}

/** The `name` of every drawn `<ng-icon>` under `root` (one that drew nothing is `!name`). */
function icons(root: ParentNode, drawn = true): string[] {
  return Array.from(root.querySelectorAll('ng-icon'))
    .filter((icon) => (icon.querySelector('svg') !== null) === drawn)
    .map((icon) => icon.getAttribute('name') ?? '?');
}

async function render<T>(host: new () => T) {
  const fixture = TestBed.createComponent(host);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return fixture;
}

describe('transfer icons', () => {
  it('draws the tick, the dash, the search glass and the page and move arrows', async () => {
    const fixture = await render(Host);
    const root: HTMLElement = fixture.nativeElement;
    const names = icons(root);

    expect(names).toContain('lucideCheck');
    expect(names).toContain('lucideMinus');
    expect(names).toContain('lucideSearch');
    expect(names).toContain('lucideChevronLeft');
    expect(names).toContain('lucideChevronRight');
    expect(icons(root, false)).toEqual([]);
    // Header boxes carry both marks, item boxes the tick only.
    expect(root.querySelectorAll('.andes-transfer__mark--dash')).toHaveLength(
      2,
    );
  });

  it('draws the clear cross once the search has text', async () => {
    const fixture = await render(Host);
    const root: HTMLElement = fixture.nativeElement;
    const input = root.querySelector(
      '.andes-transfer__search-input',
    ) as HTMLInputElement;
    input.value = 'Item 1';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const clear = root.querySelector('.andes-transfer__search-clear');
    expect(clear).not.toBeNull();
    expect(icons(clear as Element)).toEqual(['lucideX']);
  });

  it('draws the remove cross on the rows of a one-way target list', async () => {
    const fixture = await render(OneWayHost);
    const root: HTMLElement = fixture.nativeElement;
    const remove = root.querySelector('.andes-transfer__remove');

    expect(remove).not.toBeNull();
    expect(icons(remove as Element)).toEqual(['lucideX']);
    expect(root.querySelectorAll('.andes-transfer__move-icon')).toHaveLength(1);
    expect(icons(root, false)).toEqual([]);
  });
});
