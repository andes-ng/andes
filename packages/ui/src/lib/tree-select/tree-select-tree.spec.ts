import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';

import type { AndesTreeKey, AndesTreeNode } from '../tree/tree-types';
import { AndesTreeSelect } from './tree-select';

@Component({
  imports: [AndesTreeSelect],
  template: `
    <ng-template #switcher let-expanded="expanded">
      <i class="custom-switcher">{{ expanded ? '-' : '+' }}</i>
    </ng-template>
    <andes-tree-select
      aria-label="Servers"
      [nodes]="nodes()"
      [loadData]="load"
      [(loadedKeys)]="loaded"
      [switcherIcon]="custom() ? switcher : undefined"
    />
  `,
})
class TreeHost {
  readonly nodes = signal<AndesTreeNode[]>([
    { key: 'a', title: 'Alpha' },
    { key: 'b', title: 'Beta' },
  ]);
  readonly loaded = signal<AndesTreeKey[]>(['b']);
  readonly custom = signal(false);
  readonly calls: AndesTreeKey[] = [];
  readonly load = async (node: AndesTreeNode): Promise<void> => {
    this.calls.push(node.key as AndesTreeKey);
    this.nodes.update((nodes) =>
      nodes.map((n) =>
        n.key === node.key
          ? { ...n, children: [{ key: `${n.key}-1`, title: 'Child' }] }
          : n,
      ),
    );
  };
}

describe('AndesTreeSelect tree options', () => {
  let fixture: ComponentFixture<TreeHost>;

  const item = (title: string) =>
    Array.from(
      document.querySelectorAll<HTMLElement>(
        '.andes-tree-select__panel [role="treeitem"]',
      ),
    ).find(
      (el) =>
        el
          .querySelector(':scope > .andes-tree__row .andes-tree__title')
          ?.textContent?.trim() === title,
    ) as HTMLElement;
  const switcher = (title: string) =>
    item(title).querySelector(
      ':scope > .andes-tree__row .andes-tree__switcher',
    ) as HTMLElement;

  function setup(configure?: (host: TreeHost) => void): TreeHost {
    fixture = TestBed.createComponent(TreeHost);
    configure?.(fixture.componentInstance);
    fixture.detectChanges();
    document.body.appendChild(fixture.nativeElement);
    (
      fixture.nativeElement.querySelector(
        '.andes-tree-select__trigger',
      ) as HTMLElement
    ).click();
    fixture.detectChanges();
    return fixture.componentInstance;
  }

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('hands loadedKeys to the tree both ways', async () => {
    const host = setup();
    // Beta is already loaded: it needs no loading and shows as a leaf.
    expect(switcher('Beta').hasAttribute('data-leaf')).toBe(true);
    expect(switcher('Alpha').hasAttribute('data-leaf')).toBe(false);

    switcher('Alpha').click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(host.calls).toEqual(['a']);
    expect(host.loaded()).toEqual(['b', 'a']);
  });

  it('draws a custom switcher icon in the panel tree', () => {
    setup((h) => h.custom.set(true));
    expect(
      switcher('Alpha').querySelector('.custom-switcher')?.textContent,
    ).toBe('+');
  });
});
