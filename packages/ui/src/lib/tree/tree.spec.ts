/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Directionality } from '@angular/cdk/bidi';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { Component, signal, viewChild } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { Subject } from 'rxjs';

import { declaredValue, toPx } from '../../testing/computed-style';
import { AndesTree } from './tree';
import { AndesTreeNodeTemplate } from './tree-node-template';
import { andesMoveTreeNode } from './tree-utils';
import type {
  AndesTreeCheckEvent,
  AndesTreeDragEvent,
  AndesTreeDropEvent,
  AndesTreeExpandEvent,
  AndesTreeFieldNames,
  AndesTreeKey,
  AndesTreeLoadData,
  AndesTreeLoadErrorEvent,
  AndesTreeNode,
  AndesTreeSelectEvent,
} from './tree-types';

function sample(): AndesTreeNode[] {
  return [
    {
      key: 'a',
      title: 'Almacén central',
      children: [
        {
          key: 'a1',
          title: 'Pasillo 1',
          children: [
            { key: 'a1x', title: 'Estante X' },
            { key: 'a1y', title: 'Estante Y' },
          ],
        },
        { key: 'a2', title: 'Pasillo 2', disabled: true },
      ],
    },
    {
      key: 'b',
      title: 'Sucursal norte',
      children: [{ key: 'b1', title: 'Caja' }],
    },
    { key: 'c', title: 'Archivo' },
  ];
}

@Component({
  imports: [AndesTree, AndesTreeNodeTemplate],
  template: `
    <ng-template #leafTpl let-title="title"
      ><i class="leaf-glyph">{{ title }}</i></ng-template
    >
    <andes-tree
      [nodes]="nodes()"
      [(expandedKeys)]="expanded"
      [(selectedKeys)]="selected"
      [(checkedKeys)]="checked"
      [fieldNames]="fieldNames()"
      [multiple]="multiple()"
      [selectable]="selectable()"
      [deselectable]="deselectable()"
      [checkable]="checkable()"
      [checkStrictly]="checkStrictly()"
      [defaultExpandAll]="defaultExpandAll()"
      [autoExpandParent]="autoExpandParent()"
      [showLine]="showLine()"
      [showIcon]="showIcon()"
      [showLeafIcon]="leafIconTemplate() ? leafTpl : showLeafIcon()"
      [directory]="directory()"
      [blockNode]="blockNode()"
      [density]="density()"
      [expandAction]="expandAction()"
      [draggable]="draggable()"
      [dragHandle]="dragHandle()"
      [allowDrop]="allowDrop()"
      [loadData]="loadData()"
      [loading]="loading()"
      [filter]="filter()"
      [filterMode]="filterMode()"
      [virtualScroll]="virtual()"
      [height]="200"
      [labels]="labels()"
      aria-label="Warehouses"
      (nodeExpand)="expands.push($event)"
      (nodeSelect)="selects.push($event)"
      (nodeCheck)="checks.push($event)"
      (nodeDrop)="onDrop($event)"
      (nodeDragStart)="logDrag('start', $event)"
      (nodeDragEnter)="logDrag('enter', $event)"
      (nodeDragOver)="logDrag('over', $event)"
      (nodeDragLeave)="logDrag('leave', $event)"
      (nodeDragEnd)="logDrag('end', $event)"
      (nodeLoadError)="loadErrors.push($event)"
      (nodeClick)="clicks = clicks + 1"
    >
      @if (customTemplate()) {
        <ng-template
          andesTreeNode
          let-node
          let-level="level"
          let-expanded="expanded"
        >
          <b class="custom">{{ node.title }}</b
          ><i class="meta">L{{ level }}{{ expanded ? '-open' : '' }}</i>
        </ng-template>
      }
    </andes-tree>
  `,
})
class HostComponent {
  readonly tree = viewChild.required(AndesTree);
  readonly nodes = signal<AndesTreeNode[]>(sample());
  readonly expanded = signal<AndesTreeKey[]>([]);
  readonly selected = signal<AndesTreeKey[]>([]);
  readonly checked = signal<AndesTreeKey[]>([]);
  readonly fieldNames = signal<AndesTreeFieldNames | undefined>(undefined);
  readonly multiple = signal(false);
  readonly selectable = signal(true);
  readonly deselectable = signal(true);
  readonly checkable = signal(false);
  readonly checkStrictly = signal(false);
  readonly defaultExpandAll = signal(false);
  readonly autoExpandParent = signal(false);
  readonly showLine = signal(false);
  readonly showIcon = signal(false);
  readonly showLeafIcon = signal(false);
  readonly leafIconTemplate = signal(false);
  readonly directory = signal(false);
  readonly blockNode = signal(false);
  readonly density = signal<'default' | 'compact'>('default');
  readonly expandAction = signal<false | 'click' | 'doubleClick' | undefined>(
    undefined,
  );
  readonly draggable = signal(false);
  readonly dragHandle = signal(true);
  readonly allowDrop = signal<
    | ((info: { dragKey: AndesTreeKey; targetKey: AndesTreeKey }) => boolean)
    | undefined
  >(undefined);
  readonly loadData = signal<AndesTreeLoadData | undefined>(undefined);
  readonly loading = signal(false);
  readonly filter = signal('');
  readonly filterMode = signal<'filter' | 'highlight'>('filter');
  readonly virtual = signal(false);
  readonly labels = signal({});
  readonly customTemplate = signal(false);

  expands: AndesTreeExpandEvent[] = [];
  selects: AndesTreeSelectEvent[] = [];
  checks: AndesTreeCheckEvent[] = [];
  /** Whether the host applies each reported move to its data, as a consumer would. */
  applyDrops = true;
  drops: AndesTreeDropEvent[] = [];
  loadErrors: AndesTreeLoadErrorEvent[] = [];
  clicks = 0;

  /** Each drag output as `type:node:dragged:position`. */
  dragLog: string[] = [];

  logDrag(type: string, event: AndesTreeDragEvent): void {
    this.dragLog.push(
      `${type}:${event.key}:${event.dragKey}:${event.position ?? '-'}`,
    );
  }

  onDrop(event: AndesTreeDropEvent): void {
    this.drops.push(event);
    if (this.applyDrops) {
      const moved = andesMoveTreeNode(
        this.nodes(),
        event.dragKey,
        event.targetKey,
        event.position,
        this.fieldNames(),
      );
      if (moved) {
        this.nodes.set(moved);
      }
    }
  }
}

type Fixture = ComponentFixture<HostComponent>;

function setup(configure?: (host: HostComponent) => void): Fixture {
  const fixture = TestBed.createComponent(HostComponent);
  configure?.(fixture.componentInstance);
  fixture.detectChanges();
  return fixture;
}

/** The treeitem whose own title text is `title`. */
function node(fixture: Fixture, title: string): HTMLElement {
  const items = [
    ...fixture.nativeElement.querySelectorAll('[role="treeitem"]'),
  ] as HTMLElement[];
  const found = items.find(
    (el) =>
      el
        .querySelector(':scope > .andes-tree__row .andes-tree__title')
        ?.textContent?.trim() === title,
  );
  if (!found) {
    throw new Error(`No node titled "${title}"`);
  }
  return found;
}

const row = (el: HTMLElement) =>
  el.querySelector(':scope > .andes-tree__row') as HTMLElement;
const switcher = (el: HTMLElement) =>
  el.querySelector(
    ':scope > .andes-tree__row .andes-tree__switcher',
  ) as HTMLElement;
const checkbox = (el: HTMLElement) =>
  el.querySelector(
    ':scope > .andes-tree__row .andes-tree__checkbox',
  ) as HTMLElement;

function key(el: HTMLElement, name: string, init: KeyboardEventInit = {}) {
  el.dispatchEvent(
    new KeyboardEvent('keydown', {
      key: name,
      bubbles: true,
      cancelable: true,
      ...init,
    }),
  );
}

function titles(fixture: Fixture): string[] {
  return (
    [
      ...fixture.nativeElement.querySelectorAll('[role="treeitem"]'),
    ] as HTMLElement[]
  )
    .filter((el) => !el.closest('[inert]'))
    .map(
      (el) =>
        (
          el.querySelector(
            ':scope > .andes-tree__row .andes-tree__title',
          ) as HTMLElement
        ).textContent?.trim() ?? '',
    );
}

function cssText(name = 'tree.css'): string {
  return readFileSync(join(__dirname, name), 'utf8');
}

/**
 * Resolves a length written with the tree's private sizes (`var(--_indent)`, `var(--_gap)`...)
 * to pixels, reading each size from the `.andes-tree` rule. jsdom reports a `var()` longhand
 * verbatim, so geometry built on them is summed here, the way the browser would.
 */
function treeLength(css: string, expression: string): number {
  const resolved = expression.replace(
    /var\((--_[a-z-]+)\)/g,
    (_match, name: string) => {
      const value = declaredValue(css, '.andes-tree', name);
      if (value === undefined) {
        throw new Error(`.andes-tree declares no ${name}`);
      }
      return `(${value})`;
    },
  );
  return toPx(resolved.includes('var(') ? resolved : `calc(${resolved})`);
}

describe('AndesTree', () => {
  describe('structure and ARIA', () => {
    it('renders a labelled tree of treeitems with level, position and set size', () => {
      const fixture = setup();
      const tree = fixture.nativeElement.querySelector(
        '[role="tree"]',
      ) as HTMLElement;
      expect(tree).toBeTruthy();
      expect(tree.getAttribute('aria-label')).toBe('Warehouses');
      expect(tree.hasAttribute('aria-multiselectable')).toBe(false);

      const roots = [
        ...tree.querySelectorAll(':scope > [role="treeitem"]'),
      ] as HTMLElement[];
      expect(roots.map((r) => r.getAttribute('aria-posinset'))).toEqual([
        '1',
        '2',
        '3',
      ]);
      expect(roots.every((r) => r.getAttribute('aria-setsize') === '3')).toBe(
        true,
      );
      expect(roots.every((r) => r.getAttribute('aria-level') === '1')).toBe(
        true,
      );
    });

    it('gives the role=tree element an id a field can name in aria-controls, only while it has rows', () => {
      const fixture = setup();
      const instance = fixture.componentInstance.tree();
      const list = fixture.nativeElement.querySelector(
        '[role="tree"]',
      ) as HTMLElement;
      expect(list.id).toBe(instance.listId);
      expect(instance.hasRows()).toBe(true);

      fixture.componentInstance.nodes.set([]);
      fixture.detectChanges();
      expect(instance.hasRows()).toBe(false);
      expect(fixture.nativeElement.querySelector('[role="tree"]')).toBeNull();
    });

    it('does not set aria-label on the host element', () => {
      const fixture = setup();
      expect(
        fixture.nativeElement
          .querySelector('andes-tree')
          .hasAttribute('aria-label'),
      ).toBe(false);
    });

    it('marks parents with aria-expanded and leaves leaves without it', () => {
      const fixture = setup();
      expect(
        node(fixture, 'Almacén central').getAttribute('aria-expanded'),
      ).toBe('false');
      expect(node(fixture, 'Archivo').hasAttribute('aria-expanded')).toBe(
        false,
      );
    });

    it('wraps children in a role=group and numbers nested levels', () => {
      const fixture = setup((h) => h.expanded.set(['a', 'a1']));
      const a = node(fixture, 'Almacén central');
      expect(
        a.querySelector(':scope > .andes-tree__collapse [role="group"]'),
      ).toBeTruthy();
      const x = node(fixture, 'Estante X');
      expect(x.getAttribute('aria-level')).toBe('3');
      expect(x.getAttribute('aria-posinset')).toBe('1');
      expect(x.getAttribute('aria-setsize')).toBe('2');
      expect(x.parentElement?.getAttribute('role')).toBe('group');
    });

    it('names every treeitem from its own title, not from its subtree', () => {
      const fixture = setup((h) => h.expanded.set(['a']));
      const a = node(fixture, 'Almacén central');
      const labelledBy = a.getAttribute('aria-labelledby') as string;
      expect(
        fixture.nativeElement
          .querySelector(`#${labelledBy}`)
          .textContent.trim(),
      ).toBe('Almacén central');
    });

    it('sets aria-multiselectable in multiple mode', () => {
      const fixture = setup((h) => h.multiple.set(true));
      expect(
        fixture.nativeElement
          .querySelector('[role="tree"]')
          .getAttribute('aria-multiselectable'),
      ).toBe('true');
    });

    it('marks disabled nodes with aria-disabled', () => {
      const fixture = setup((h) => h.expanded.set(['a']));
      expect(node(fixture, 'Pasillo 2').getAttribute('aria-disabled')).toBe(
        'true',
      );
      expect(node(fixture, 'Pasillo 1').hasAttribute('aria-disabled')).toBe(
        false,
      );
    });

    it('renders an empty state instead of an empty tree', () => {
      const fixture = setup((h) => h.nodes.set([]));
      expect(fixture.nativeElement.querySelector('[role="tree"]')).toBeNull();
      const empty = fixture.nativeElement.querySelector(
        '.andes-tree__empty',
      ) as HTMLElement;
      expect(empty.textContent).toContain('No data');
      // A decorative tray above the text; the loading state shows the spinner instead.
      expect(empty.hasAttribute('data-empty')).toBe(true);
      const icon = empty.querySelector('.andes-tree__empty-icon');
      expect(icon?.getAttribute('aria-hidden')).toBe('true');
    });

    it('shows a loading state, with translated labels', () => {
      const fixture = setup((h) => {
        h.nodes.set([]);
        h.loading.set(true);
        h.labels.set({ loading: 'Cargando' });
      });
      const empty = fixture.nativeElement.querySelector(
        '.andes-tree__empty',
      ) as HTMLElement;
      expect(empty.textContent).toContain('Cargando');
      expect(empty.getAttribute('aria-busy')).toBe('true');
      expect(empty.hasAttribute('data-empty')).toBe(false);
      expect(empty.querySelector('.andes-tree__empty-icon')).toBeNull();
    });

    it('renders the data attributes that carry the look', () => {
      const fixture = setup((h) => {
        h.showLine.set(true);
        h.directory.set(true);
        h.density.set('compact');
      });
      const root = fixture.nativeElement.querySelector(
        '.andes-tree',
      ) as HTMLElement;
      expect(root.hasAttribute('data-line')).toBe(true);
      expect(root.hasAttribute('data-directory')).toBe(true);
      expect(root.hasAttribute('data-block')).toBe(true);
      expect(root.getAttribute('data-density')).toBe('compact');
    });
  });

  describe('expanding', () => {
    it('opens and closes a branch from its switcher and updates the model', () => {
      const fixture = setup();
      const a = node(fixture, 'Almacén central');
      switcher(a).click();
      fixture.detectChanges();

      expect(fixture.componentInstance.expanded()).toEqual(['a']);
      expect(a.getAttribute('aria-expanded')).toBe('true');
      expect(titles(fixture)).toContain('Pasillo 1');
      expect(fixture.componentInstance.expands.at(-1)).toMatchObject({
        key: 'a',
        expanded: true,
        expandedKeys: ['a'],
      });

      switcher(a).click();
      fixture.detectChanges();
      expect(fixture.componentInstance.expanded()).toEqual([]);
      expect(a.getAttribute('aria-expanded')).toBe('false');
      expect(fixture.componentInstance.expands.at(-1)?.expanded).toBe(false);
    });

    it('keeps a closed branch in the DOM but inert, so it can animate and stays unreachable', () => {
      const fixture = setup((h) => h.expanded.set(['a']));
      const collapse = () =>
        node(fixture, 'Almacén central').querySelector(
          ':scope > .andes-tree__collapse',
        ) as HTMLElement;
      expect(collapse().hasAttribute('inert')).toBe(false);
      expect(collapse().hasAttribute('data-expanded')).toBe(true);

      switcher(node(fixture, 'Almacén central')).click();
      fixture.detectChanges();
      expect(collapse().hasAttribute('inert')).toBe(true);
      expect(collapse().hasAttribute('data-expanded')).toBe(false);
    });

    it('does not select when the switcher is clicked', () => {
      const fixture = setup();
      switcher(node(fixture, 'Almacén central')).click();
      expect(fixture.componentInstance.selected()).toEqual([]);
    });

    it('has no switcher action on a leaf', () => {
      const fixture = setup();
      switcher(node(fixture, 'Archivo')).click();
      expect(fixture.componentInstance.expanded()).toEqual([]);
    });

    it('opens every branch with defaultExpandAll, once', () => {
      const fixture = setup((h) => h.defaultExpandAll.set(true));
      expect(fixture.componentInstance.expanded()).toEqual(['a', 'a1', 'b']);
      expect(titles(fixture)).toContain('Estante X');

      fixture.componentInstance.expanded.set([]);
      fixture.detectChanges();
      fixture.componentInstance.nodes.set(sample());
      fixture.detectChanges();
      expect(fixture.componentInstance.expanded()).toEqual([]);
    });

    it('opens the ancestors of the expanded keys with autoExpandParent', () => {
      const fixture = setup((h) => {
        h.autoExpandParent.set(true);
        h.expanded.set(['a1']);
      });
      expect(fixture.componentInstance.expanded()).toEqual(['a1', 'a']);
      expect(titles(fixture)).toContain('Estante X');

      // A key set later is followed too.
      fixture.componentInstance.expanded.set(['b1x-missing', 'b1']);
      fixture.detectChanges();
      expect(fixture.componentInstance.expanded()).toEqual([
        'b1x-missing',
        'b1',
        'b',
      ]);
    });

    it('leaves the ancestors closed without autoExpandParent', () => {
      const fixture = setup((h) => h.expanded.set(['a1']));
      expect(fixture.componentInstance.expanded()).toEqual(['a1']);
      expect(titles(fixture)).not.toContain('Estante X');
    });

    it('exposes expandAll, collapseAll, expandKeys, collapseKeys and toggleExpanded', () => {
      const fixture = setup();
      const tree = fixture.componentInstance.tree();
      tree.expandAll();
      fixture.detectChanges();
      expect(fixture.componentInstance.expanded()).toEqual(['a', 'a1', 'b']);

      tree.collapseKeys(['a1']);
      expect(fixture.componentInstance.expanded()).toEqual(['a', 'b']);
      tree.expandKeys(['a1', 'b']);
      expect(fixture.componentInstance.expanded()).toEqual(['a', 'b', 'a1']);

      tree.collapseAll();
      expect(fixture.componentInstance.expanded()).toEqual([]);
      tree.toggleExpanded('b');
      expect(fixture.componentInstance.expanded()).toEqual(['b']);
    });

    it('toggles on click or double click when expandAction asks for it', () => {
      const fixture = setup((h) => h.expandAction.set('click'));
      row(node(fixture, 'Sucursal norte')).click();
      expect(fixture.componentInstance.expanded()).toEqual(['b']);

      fixture.componentInstance.expandAction.set('doubleClick');
      fixture.detectChanges();
      row(node(fixture, 'Almacén central')).click();
      expect(fixture.componentInstance.expanded()).toEqual(['b']);
      row(node(fixture, 'Almacén central')).dispatchEvent(
        new MouseEvent('dblclick', { bubbles: true }),
      );
      expect(fixture.componentInstance.expanded()).toEqual(['b', 'a']);
    });

    it('treats a directory tree as click-to-open by default', () => {
      const fixture = setup((h) => h.directory.set(true));
      row(node(fixture, 'Sucursal norte')).click();
      expect(fixture.componentInstance.expanded()).toEqual(['b']);
    });

    it('animates only the branches that were just toggled', () => {
      const fixture = setup((h) => h.expanded.set(['a']));
      const collapse = () =>
        node(fixture, 'Almacén central').querySelector(
          ':scope > .andes-tree__collapse',
        ) as HTMLElement;
      // Branches that start open (from the data) do not animate in.
      expect(collapse().hasAttribute('data-animate')).toBe(false);

      switcher(node(fixture, 'Almacén central')).click();
      fixture.detectChanges();
      expect(collapse().hasAttribute('data-animate')).toBe(true);

      // The flag goes once its animation ends, so later data changes are not animated.
      collapse().dispatchEvent(new Event('animationend'));
      fixture.detectChanges();
      expect(collapse().hasAttribute('data-animate')).toBe(false);
    });

    it('ignores animation events that bubble up from a nested branch', () => {
      const fixture = setup((h) => h.expanded.set(['a', 'a1']));
      switcher(node(fixture, 'Almacén central')).click();
      fixture.detectChanges();
      const outer = node(fixture, 'Almacén central').querySelector(
        ':scope > .andes-tree__collapse',
      ) as HTMLElement;
      const inner = node(fixture, 'Pasillo 1').querySelector(
        ':scope > .andes-tree__collapse',
      ) as HTMLElement;
      inner.dispatchEvent(new Event('animationend', { bubbles: true }));
      fixture.detectChanges();
      expect(outer.hasAttribute('data-animate')).toBe(true);
    });
  });

  describe('selection', () => {
    it('selects a node on click, reports it and flags aria-selected', () => {
      const fixture = setup();
      const c = node(fixture, 'Archivo');
      row(c).click();
      fixture.detectChanges();

      expect(fixture.componentInstance.selected()).toEqual(['c']);
      expect(c.getAttribute('aria-selected')).toBe('true');
      expect(
        node(fixture, 'Sucursal norte').getAttribute('aria-selected'),
      ).toBe('false');
      expect(fixture.componentInstance.selects.at(-1)).toMatchObject({
        key: 'c',
        selected: true,
        selectedKeys: ['c'],
      });
      expect(fixture.componentInstance.clicks).toBe(1);
    });

    it('replaces the selection in single mode and clears it on a second click', () => {
      const fixture = setup();
      row(node(fixture, 'Archivo')).click();
      row(node(fixture, 'Sucursal norte')).click();
      expect(fixture.componentInstance.selected()).toEqual(['b']);
      row(node(fixture, 'Sucursal norte')).click();
      expect(fixture.componentInstance.selected()).toEqual([]);
    });

    it('keeps the selection when deselectable is off', () => {
      const fixture = setup((h) => h.deselectable.set(false));
      row(node(fixture, 'Archivo')).click();
      row(node(fixture, 'Archivo')).click();
      expect(fixture.componentInstance.selected()).toEqual(['c']);
    });

    it('selects several nodes in multiple mode and selects a range with shift', () => {
      const fixture = setup((h) => {
        h.multiple.set(true);
        h.expanded.set(['a', 'a1']);
      });
      row(node(fixture, 'Almacén central')).click();
      row(node(fixture, 'Archivo')).click();
      expect(fixture.componentInstance.selected()).toEqual(['a', 'c']);
      row(node(fixture, 'Archivo')).click();
      expect(fixture.componentInstance.selected()).toEqual(['a']);

      row(node(fixture, 'Pasillo 1')).click();
      row(node(fixture, 'Estante Y')).dispatchEvent(
        new MouseEvent('click', { bubbles: true, shiftKey: true }),
      );
      // The range skips the disabled node.
      expect(fixture.componentInstance.selected()).toEqual([
        'a',
        'a1',
        'a1x',
        'a1y',
      ]);
    });

    describe('in a directory tree', () => {
      function click(
        fixture: Fixture,
        title: string,
        init: MouseEventInit = {},
      ) {
        (
          row(node(fixture, title)).querySelector(
            '.andes-tree__content',
          ) as HTMLElement
        ).dispatchEvent(new MouseEvent('click', { bubbles: true, ...init }));
        fixture.detectChanges();
      }

      function directory(): Fixture {
        return setup((h) => {
          h.directory.set(true);
          h.multiple.set(true);
          h.expandAction.set(false);
          h.expanded.set(['a', 'a1']);
        });
      }

      it('selects only the clicked node on a plain click, like a file browser', () => {
        const fixture = directory();
        click(fixture, 'Estante X');
        click(fixture, 'Estante Y');
        expect(fixture.componentInstance.selected()).toEqual(['a1y']);
        // A second plain click keeps it selected.
        click(fixture, 'Estante Y');
        expect(fixture.componentInstance.selected()).toEqual(['a1y']);
      });

      it('adds and removes nodes with Ctrl or Cmd + click', () => {
        const fixture = directory();
        click(fixture, 'Estante X');
        click(fixture, 'Archivo', { ctrlKey: true });
        click(fixture, 'Pasillo 1', { metaKey: true });
        expect(fixture.componentInstance.selected()).toEqual([
          'a1x',
          'c',
          'a1',
        ]);
        click(fixture, 'Archivo', { metaKey: true });
        expect(fixture.componentInstance.selected()).toEqual(['a1x', 'a1']);
      });

      it('replaces the selection with the range on Shift + click', () => {
        const fixture = directory();
        click(fixture, 'Archivo', { ctrlKey: true });
        click(fixture, 'Pasillo 1');
        click(fixture, 'Estante Y', { shiftKey: true });
        expect(fixture.componentInstance.selected()).toEqual([
          'a1',
          'a1x',
          'a1y',
        ]);
      });

      it('selects one node with Space and adds one with Ctrl + Space', () => {
        const fixture = directory();
        document.body.appendChild(fixture.nativeElement);
        try {
          key(node(fixture, 'Estante X'), ' ');
          fixture.detectChanges();
          key(node(fixture, 'Archivo'), ' ', { ctrlKey: true });
          fixture.detectChanges();
          expect(fixture.componentInstance.selected()).toEqual(['a1x', 'c']);
          key(node(fixture, 'Estante Y'), ' ');
          expect(fixture.componentInstance.selected()).toEqual(['a1y']);
        } finally {
          document.body.innerHTML = '';
        }
      });

      it('keeps toggling on a plain click outside directory mode', () => {
        const fixture = setup((h) => {
          h.multiple.set(true);
          h.expanded.set(['a', 'a1']);
        });
        click(fixture, 'Estante X');
        click(fixture, 'Estante Y');
        expect(fixture.componentInstance.selected()).toEqual(['a1x', 'a1y']);
      });
    });

    it('ignores disabled nodes and nodes that opt out', () => {
      const fixture = setup((h) => {
        h.expanded.set(['a']);
        h.nodes.update((nodes) => [
          ...nodes,
          { key: 'd', title: 'Fijo', selectable: false },
        ]);
      });
      row(node(fixture, 'Pasillo 2')).click();
      row(node(fixture, 'Fijo')).click();
      expect(fixture.componentInstance.selected()).toEqual([]);
      expect(node(fixture, 'Fijo').hasAttribute('aria-selected')).toBe(false);
    });

    it('turns selection off with selectable false', () => {
      const fixture = setup((h) => h.selectable.set(false));
      row(node(fixture, 'Archivo')).click();
      expect(fixture.componentInstance.selected()).toEqual([]);
      expect(node(fixture, 'Archivo').hasAttribute('aria-selected')).toBe(
        false,
      );
    });

    it('reflects a bound selectedKeys', () => {
      const fixture = setup((h) => h.selected.set(['b']));
      expect(
        node(fixture, 'Sucursal norte').getAttribute('aria-selected'),
      ).toBe('true');
      expect(
        row(node(fixture, 'Sucursal norte')).hasAttribute('data-selected'),
      ).toBe(true);
    });
  });

  describe('checking', () => {
    function checkable(fixture: Fixture) {
      fixture.componentInstance.checkable.set(true);
      fixture.componentInstance.expanded.set(['a', 'a1', 'b']);
      fixture.detectChanges();
    }

    describe('check motion', () => {
      afterEach(() => vi.useRealTimers());

      it('plays the checkbox motion on the boxes a click changed, and only on those', () => {
        vi.useFakeTimers();
        const fixture = setup();
        checkable(fixture);
        expect(
          fixture.nativeElement.querySelector(
            '.andes-tree__checkbox[data-motion]',
          ),
        ).toBeNull();

        checkbox(node(fixture, 'Estante X')).click();
        fixture.detectChanges();

        expect(
          checkbox(node(fixture, 'Estante X')).getAttribute('data-motion'),
        ).toBe('check');
        // The parents it cascaded to turn mixed, and play the dash.
        expect(
          checkbox(node(fixture, 'Pasillo 1')).getAttribute('data-motion'),
        ).toBe('indeterminate');
        expect(
          checkbox(node(fixture, 'Almacén central')).getAttribute(
            'data-motion',
          ),
        ).toBe('indeterminate');
        // An unchanged box stays still.
        expect(
          checkbox(node(fixture, 'Estante Y')).hasAttribute('data-motion'),
        ).toBe(false);
        expect(checkbox(node(fixture, 'Estante X')).classList).toContain(
          'andes-check-motion',
        );
        expect(
          checkbox(node(fixture, 'Estante X')).querySelector('svg')?.classList,
        ).toContain('andes-check-motion__tick');
        expect(
          checkbox(node(fixture, 'Pasillo 1')).querySelector('svg')?.classList,
        ).toContain('andes-check-motion__dash');
      });

      it('plays the uncheck ring and drops every hook once the ring has played', () => {
        vi.useFakeTimers();
        const fixture = setup();
        checkable(fixture);
        checkbox(node(fixture, 'Estante X')).click();
        fixture.detectChanges();
        checkbox(node(fixture, 'Estante X')).click();
        fixture.detectChanges();

        expect(
          checkbox(node(fixture, 'Estante X')).getAttribute('data-motion'),
        ).toBe('uncheck');

        vi.advanceTimersByTime(1000);
        fixture.detectChanges();
        expect(
          fixture.nativeElement.querySelector(
            '.andes-tree__checkbox[data-motion]',
          ),
        ).toBeNull();
      });

      it('never animates a box rendered checked from data', () => {
        const fixture = setup((h) => h.checked.set(['a1x']));
        checkable(fixture);
        expect(
          checkbox(node(fixture, 'Estante X')).getAttribute('data-state'),
        ).toBe('checked');
        expect(
          fixture.nativeElement.querySelector(
            '.andes-tree__checkbox[data-motion]',
          ),
        ).toBeNull();
      });

      it('takes the motion from the shared checkbox stylesheet', () => {
        const shared = readFileSync(
          join(__dirname, '../checkbox/check-motion.css'),
          'utf8',
        );
        expect(shared).toContain(
          '@media (prefers-reduced-motion: no-preference) and (forced-colors: none)',
        );
        expect(shared).toContain(".andes-check-motion[data-motion='check']");
        expect(shared).toContain('@keyframes andes-checkbox-ripple');
      });
    });

    it('renders a checkbox per node with aria-checked on the treeitem', () => {
      const fixture = setup();
      checkable(fixture);
      expect(checkbox(node(fixture, 'Archivo'))).toBeTruthy();
      expect(node(fixture, 'Archivo').getAttribute('aria-checked')).toBe(
        'false',
      );
    });

    it('cascades down, reports half-checked parents and mixed state', () => {
      const fixture = setup();
      checkable(fixture);
      checkbox(node(fixture, 'Pasillo 1')).click();
      fixture.detectChanges();

      // `a2` is disabled, so it takes no part in the cascade and the root follows `a1` alone.
      expect(fixture.componentInstance.checked()).toEqual([
        'a',
        'a1',
        'a1x',
        'a1y',
      ]);
      expect(node(fixture, 'Estante X').getAttribute('aria-checked')).toBe(
        'true',
      );
      expect(
        node(fixture, 'Almacén central').getAttribute('aria-checked'),
      ).toBe('true');
      expect(fixture.componentInstance.checks.at(-1)).toMatchObject({
        key: 'a1',
        checked: true,
        checkedKeys: ['a', 'a1', 'a1x', 'a1y'],
        halfCheckedKeys: [],
      });
    });

    it('marks a parent mixed while only some of its children are checked', () => {
      const fixture = setup();
      checkable(fixture);
      checkbox(node(fixture, 'Estante X')).click();
      fixture.detectChanges();

      expect(fixture.componentInstance.checked()).toEqual(['a1x']);
      const root = node(fixture, 'Almacén central');
      expect(root.getAttribute('aria-checked')).toBe('mixed');
      expect(node(fixture, 'Pasillo 1').getAttribute('aria-checked')).toBe(
        'mixed',
      );
      expect(checkbox(root).getAttribute('data-state')).toBe('indeterminate');
      expect(fixture.componentInstance.tree().halfCheckedKeys()).toEqual([
        'a',
        'a1',
      ]);
      expect(fixture.componentInstance.checks.at(-1)?.halfCheckedKeys).toEqual([
        'a',
        'a1',
      ]);
    });

    it('checks a parent once every enabled child is checked', () => {
      const fixture = setup();
      checkable(fixture);
      fixture.componentInstance.nodes.update((nodes) => {
        const copy = structuredClone(nodes);
        delete copy[0].children![1].disabled;
        return copy;
      });
      fixture.detectChanges();
      checkbox(node(fixture, 'Pasillo 1')).click();
      checkbox(node(fixture, 'Pasillo 2')).click();
      fixture.detectChanges();
      expect(fixture.componentInstance.checked()).toContain('a');
      expect(
        node(fixture, 'Almacén central').getAttribute('aria-checked'),
      ).toBe('true');
    });

    it('unchecks a single child without re-checking it through its parent', () => {
      const fixture = setup((h) => h.checked.set(['a1', 'a1x', 'a1y']));
      checkable(fixture);
      checkbox(node(fixture, 'Estante X')).click();
      fixture.detectChanges();
      expect(fixture.componentInstance.checked()).toEqual(['a1y']);
      expect(node(fixture, 'Pasillo 1').getAttribute('aria-checked')).toBe(
        'mixed',
      );
    });

    it('conforms keys the consumer set: a checked parent checks its subtree', () => {
      const fixture = setup((h) => h.checked.set(['b']));
      checkable(fixture);
      expect(node(fixture, 'Caja').getAttribute('aria-checked')).toBe('true');
    });

    it('makes every node independent with checkStrictly', () => {
      const fixture = setup((h) => h.checkStrictly.set(true));
      checkable(fixture);
      checkbox(node(fixture, 'Pasillo 1')).click();
      fixture.detectChanges();
      expect(fixture.componentInstance.checked()).toEqual(['a1']);
      expect(node(fixture, 'Estante X').getAttribute('aria-checked')).toBe(
        'false',
      );
      expect(
        node(fixture, 'Almacén central').getAttribute('aria-checked'),
      ).toBe('false');
    });

    it('leaves nodes with a locked checkbox alone', () => {
      const fixture = setup((h) =>
        h.nodes.set([
          {
            key: 'p',
            title: 'P',
            children: [{ key: 'q', title: 'Q', disableCheckbox: true }],
          },
        ]),
      );
      fixture.componentInstance.checkable.set(true);
      fixture.componentInstance.expanded.set(['p']);
      fixture.detectChanges();
      checkbox(node(fixture, 'Q')).click();
      expect(fixture.componentInstance.checked()).toEqual([]);
      expect(checkbox(node(fixture, 'Q')).hasAttribute('data-disabled')).toBe(
        true,
      );
    });

    it('hides the checkbox of nodes with checkable false', () => {
      const fixture = setup((h) =>
        h.nodes.set([{ key: 'p', title: 'P', checkable: false }]),
      );
      fixture.componentInstance.checkable.set(true);
      fixture.detectChanges();
      expect(checkbox(node(fixture, 'P'))).toBeNull();
      expect(node(fixture, 'P').hasAttribute('aria-checked')).toBe(false);
    });

    it('does not select when the checkbox is clicked', () => {
      const fixture = setup();
      checkable(fixture);
      checkbox(node(fixture, 'Archivo')).click();
      expect(fixture.componentInstance.selected()).toEqual([]);
    });

    it('checks and clears everything with setAllChecked', () => {
      const fixture = setup();
      checkable(fixture);
      fixture.componentInstance.tree().setAllChecked(true);
      fixture.detectChanges();
      // The disabled node is left out of the cascade.
      expect(fixture.componentInstance.checked()).toEqual([
        'a',
        'a1',
        'a1x',
        'a1y',
        'b',
        'b1',
        'c',
      ]);
      fixture.componentInstance.tree().setAllChecked(false);
      expect(fixture.componentInstance.checked()).toEqual([]);
    });
  });

  describe('keyboard', () => {
    function focused(_fixture: Fixture): string {
      const el = document.activeElement as HTMLElement;
      return (
        el
          ?.querySelector(':scope > .andes-tree__row .andes-tree__title')
          ?.textContent?.trim() ?? ''
      );
    }

    function start(configure?: (h: HostComponent) => void) {
      const fixture = setup(configure);
      document.body.appendChild(fixture.nativeElement);
      return fixture;
    }

    afterEach(() => {
      document.body.innerHTML = '';
    });

    it('keeps exactly one node in the tab order', () => {
      const fixture = setup((h) => h.expanded.set(['a']));
      const items = [
        ...fixture.nativeElement.querySelectorAll('[role="treeitem"]'),
      ] as HTMLElement[];
      expect(
        items.filter((el) => el.getAttribute('tabindex') === '0'),
      ).toHaveLength(1);
      expect(items[0].getAttribute('tabindex')).toBe('0');
    });

    it('puts the selected node in the tab order', () => {
      const fixture = setup((h) => h.selected.set(['c']));
      expect(node(fixture, 'Archivo').getAttribute('tabindex')).toBe('0');
      expect(node(fixture, 'Almacén central').getAttribute('tabindex')).toBe(
        '-1',
      );
    });

    it('moves with the arrow keys, Home and End, and follows focus with the tab stop', () => {
      const fixture = start((h) => h.expanded.set(['a']));
      const a = node(fixture, 'Almacén central');
      a.focus();
      key(a, 'ArrowDown');
      expect(focused(fixture)).toBe('Pasillo 1');
      fixture.detectChanges();
      expect(node(fixture, 'Pasillo 1').getAttribute('tabindex')).toBe('0');
      expect(a.getAttribute('tabindex')).toBe('-1');

      key(document.activeElement as HTMLElement, 'ArrowUp');
      expect(focused(fixture)).toBe('Almacén central');
      key(document.activeElement as HTMLElement, 'End');
      expect(focused(fixture)).toBe('Archivo');
      key(document.activeElement as HTMLElement, 'ArrowDown');
      expect(focused(fixture)).toBe('Archivo');
      key(document.activeElement as HTMLElement, 'Home');
      expect(focused(fixture)).toBe('Almacén central');
    });

    it('opens with ArrowRight, steps into the first child, then closes with ArrowLeft', () => {
      const fixture = start();
      const a = node(fixture, 'Almacén central');
      a.focus();
      key(a, 'ArrowRight');
      fixture.detectChanges();
      expect(fixture.componentInstance.expanded()).toEqual(['a']);
      expect(focused(fixture)).toBe('Almacén central');

      key(a, 'ArrowRight');
      expect(focused(fixture)).toBe('Pasillo 1');
      key(document.activeElement as HTMLElement, 'ArrowLeft');
      expect(focused(fixture)).toBe('Almacén central');
      key(document.activeElement as HTMLElement, 'ArrowLeft');
      fixture.detectChanges();
      expect(fixture.componentInstance.expanded()).toEqual([]);
    });

    it('does nothing on ArrowRight over a leaf and ArrowLeft at a root', () => {
      const fixture = start();
      const c = node(fixture, 'Archivo');
      c.focus();
      key(c, 'ArrowRight');
      key(c, 'ArrowLeft');
      expect(focused(fixture)).toBe('Archivo');
    });

    it('mirrors the horizontal arrows in a right-to-left context', () => {
      TestBed.configureTestingModule({
        providers: [
          {
            provide: Directionality,
            useValue: { value: 'rtl', change: new Subject() },
          },
        ],
      });
      const fixture = start();
      const a = node(fixture, 'Almacén central');
      a.focus();
      key(a, 'ArrowLeft');
      fixture.detectChanges();
      expect(fixture.componentInstance.expanded()).toEqual(['a']);
      key(a, 'ArrowRight');
      fixture.detectChanges();
      expect(fixture.componentInstance.expanded()).toEqual([]);
    });

    it('selects with Enter and toggles selection with Space', () => {
      const fixture = start();
      const c = node(fixture, 'Archivo');
      c.focus();
      key(c, 'Enter');
      expect(fixture.componentInstance.selected()).toEqual(['c']);
      key(c, ' ');
      expect(fixture.componentInstance.selected()).toEqual([]);
    });

    it('checks with Space in a checkable tree and opens a node that cannot be selected with Enter', () => {
      const fixture = start((h) => {
        h.checkable.set(true);
        h.selectable.set(false);
      });
      const b = node(fixture, 'Sucursal norte');
      b.focus();
      key(b, ' ');
      fixture.detectChanges();
      expect(fixture.componentInstance.checked()).toEqual(['b', 'b1']);
      fixture.componentInstance.tree().setAllChecked(false);
      // Enter on a checkable node toggles its box when it cannot be selected.
      key(b, 'Enter');
      expect(fixture.componentInstance.checked()).toEqual(['b', 'b1']);
    });

    it('toggles a plain parent with Enter when it can neither be selected nor checked', () => {
      const fixture = start((h) => h.selectable.set(false));
      const b = node(fixture, 'Sucursal norte');
      b.focus();
      key(b, 'Enter');
      expect(fixture.componentInstance.expanded()).toEqual(['b']);
    });

    it('opens all the siblings with *', () => {
      const fixture = start();
      const a = node(fixture, 'Almacén central');
      a.focus();
      key(a, '*');
      expect(fixture.componentInstance.expanded()).toEqual(['a', 'b']);
    });

    it('jumps to the next title that starts with the typed characters', () => {
      vi.useFakeTimers();
      try {
        const fixture = start();
        const a = node(fixture, 'Almacén central');
        a.focus();
        key(a, 's');
        expect(focused(fixture)).toBe('Sucursal norte');
        // A pause ends the search, so the next letter starts a new one.
        vi.advanceTimersByTime(600);
        key(document.activeElement as HTMLElement, 'a');
        expect(focused(fixture)).toBe('Archivo');
      } finally {
        vi.useRealTimers();
      }
    });

    it('builds a multi-character search and wraps around', () => {
      const fixture = start();
      const c = node(fixture, 'Archivo');
      c.focus();
      key(c, 'a');
      expect(focused(fixture)).toBe('Almacén central');
      key(document.activeElement as HTMLElement, 'r');
      expect(focused(fixture)).toBe('Archivo');
    });

    it('ignores keys that come from inside a node, like a field in a custom template', () => {
      const fixture = start();
      const a = node(fixture, 'Almacén central');
      const input = document.createElement('input');
      row(a).appendChild(input);
      input.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'ArrowDown',
          bubbles: true,
          cancelable: true,
        }),
      );
      expect(document.activeElement).not.toBe(node(fixture, 'Sucursal norte'));
    });

    it('does not steal keys with modifiers', () => {
      const fixture = start();
      const a = node(fixture, 'Almacén central');
      a.focus();
      const event = new KeyboardEvent('keydown', {
        key: 'ArrowDown',
        ctrlKey: true,
        bubbles: true,
        cancelable: true,
      });
      a.dispatchEvent(event);
      expect(event.defaultPrevented).toBe(false);
    });

    it('prevents the page from scrolling on keys it handles', () => {
      const fixture = start();
      const a = node(fixture, 'Almacén central');
      a.focus();
      const event = new KeyboardEvent('keydown', {
        key: 'ArrowDown',
        bubbles: true,
        cancelable: true,
      });
      a.dispatchEvent(event);
      expect(event.defaultPrevented).toBe(true);
    });

    it('scrolls to a node, opening its ancestors, and can focus it', async () => {
      const fixture = start();
      const result = fixture.componentInstance
        .tree()
        .scrollToKey('a1x', { focus: true });
      expect(result).toBe(true);
      expect(fixture.componentInstance.expanded()).toEqual(['a', 'a1']);
      fixture.detectChanges();
      await fixture.whenStable();
      expect(focused(fixture)).toBe('Estante X');
    });

    it('refuses to scroll to an unknown node or into a closed branch when asked not to expand', () => {
      const fixture = start();
      const tree = fixture.componentInstance.tree();
      expect(tree.scrollToKey('nope')).toBe(false);
      expect(tree.scrollToKey('a1x', { expand: false })).toBe(false);
      expect(fixture.componentInstance.expanded()).toEqual([]);
    });
  });

  describe('data shapes', () => {
    it('reads renamed fields', () => {
      const fixture = setup((h) => {
        h.fieldNames.set({ key: 'id', title: 'name', children: 'items' });
        h.nodes.set([
          { id: 1, name: 'Raíz', items: [{ id: 2, name: 'Hoja' }] },
        ] as unknown as AndesTreeNode[]);
        h.expanded.set([1]);
      });
      expect(titles(fixture)).toEqual(['Raíz', 'Hoja']);
      row(node(fixture, 'Hoja')).click();
      expect(fixture.componentInstance.selected()).toEqual([2]);
    });

    it('renders custom node content with the node context', () => {
      const fixture = setup((h) => {
        h.customTemplate.set(true);
        h.expanded.set(['a']);
      });
      const items = [
        ...fixture.nativeElement.querySelectorAll('[role="treeitem"]'),
      ] as HTMLElement[];
      const [a, a1] = items;
      expect(
        a.querySelector(':scope > .andes-tree__row .custom')?.textContent,
      ).toBe('Almacén central');
      expect(
        a.querySelector(':scope > .andes-tree__row .meta')?.textContent,
      ).toBe('L1-open');
      expect(a1.querySelector('.meta')?.textContent).toBe('L2');
    });

    it('shows default folder and file icons, or a node glyph', () => {
      const fixture = setup((h) => {
        h.showIcon.set(true);
        h.nodes.set([
          {
            key: 'f',
            title: 'Carpeta',
            children: [{ key: 'g', title: 'Archivo' }],
          },
          { key: 'h', title: 'Glifo', icon: '★' },
        ]);
      });
      const icon = (title: string) =>
        node(fixture, title).querySelector(
          ':scope > .andes-tree__row .andes-tree__icon',
        ) as HTMLElement;
      expect(icon('Carpeta').querySelector('svg')).toBeTruthy();
      expect(icon('Glifo').textContent?.trim()).toBe('★');
      expect(icon('Glifo').getAttribute('aria-hidden')).toBe('true');
    });

    it('shows no icons unless asked to', () => {
      const fixture = setup();
      expect(
        fixture.nativeElement.querySelector('.andes-tree__icon'),
      ).toBeNull();
    });

    it('shows a boxed switcher with connector lines', () => {
      const fixture = setup((h) => {
        h.showLine.set(true);
        h.expanded.set(['a']);
      });
      expect(
        switcher(node(fixture, 'Almacén central')).querySelector(
          '.andes-tree__box',
        ),
      ).toBeTruthy();
      const cells = row(node(fixture, 'Pasillo 1')).querySelectorAll(
        '.andes-tree__indent',
      );
      expect(cells).toHaveLength(1);
      expect(cells[0].hasAttribute('data-elbow')).toBe(true);
      expect(cells[0].hasAttribute('data-line')).toBe(true);
      // The last child's elbow turns instead of continuing.
      const last = row(node(fixture, 'Pasillo 2')).querySelector(
        '.andes-tree__indent',
      ) as HTMLElement;
      expect(last.hasAttribute('data-line')).toBe(false);
    });

    it('draws the boxed +/- at 14px and marks leaf rows for their longer tick', () => {
      const fixture = setup((h) => {
        h.showLine.set(true);
        h.expanded.set(['a', 'a1']);
      });
      const box = switcher(node(fixture, 'Almacén central')).querySelector(
        '.andes-tree__box',
      ) as SVGElement;
      expect(box.getAttribute('viewBox')).toBe('0 0 14 14');
      expect(row(node(fixture, 'Estante X')).hasAttribute('data-leaf')).toBe(
        true,
      );
      expect(row(node(fixture, 'Pasillo 1')).hasAttribute('data-leaf')).toBe(
        false,
      );
    });
  });

  describe('showLeafIcon', () => {
    const leafIcon = (fixture: Fixture, title: string) =>
      switcher(node(fixture, title)).querySelector('.andes-tree__leaf-icon');

    it('draws a file in each leaf switcher with lines on, and marks the row', () => {
      const fixture = setup((h) => {
        h.showLine.set(true);
        h.showLeafIcon.set(true);
        h.expanded.set(['a', 'a1']);
      });
      expect(leafIcon(fixture, 'Estante X')?.tagName.toLowerCase()).toBe('svg');
      expect(
        row(node(fixture, 'Estante X')).hasAttribute('data-leaf-icon'),
      ).toBe(true);
      // Parents keep their box.
      expect(leafIcon(fixture, 'Pasillo 1')).toBeNull();
      expect(
        row(node(fixture, 'Pasillo 1')).hasAttribute('data-leaf-icon'),
      ).toBe(false);
    });

    it('does nothing without lines, or when off', () => {
      const fixture = setup((h) => {
        h.showLeafIcon.set(true);
        h.expanded.set(['a', 'a1']);
      });
      expect(leafIcon(fixture, 'Estante X')).toBeNull();
      fixture.componentInstance.showLine.set(true);
      fixture.componentInstance.showLeafIcon.set(false);
      fixture.detectChanges();
      expect(leafIcon(fixture, 'Estante X')).toBeNull();
      expect(
        row(node(fixture, 'Estante X')).hasAttribute('data-leaf-icon'),
      ).toBe(false);
    });

    it('renders a template of its own with the node context', () => {
      const fixture = setup((h) => {
        h.showLine.set(true);
        h.leafIconTemplate.set(true);
        h.expanded.set(['a', 'a1']);
      });
      expect(
        leafIcon(fixture, 'Estante Y')?.querySelector('.leaf-glyph')
          ?.textContent,
      ).toBe('Estante Y');
    });

    it("stops a leaf's tick at its icon, as a parent's stops at its box", () => {
      const css = cssText();
      expect(
        declaredValue(
          css,
          '.andes-tree__switcher > .andes-tree__leaf-icon',
          'width',
        ),
      ).toBe('var(--_box)');
      // The long tick is only for leaves without an icon; the others keep the box-length one.
      expect(css).toContain(
        '.andes-tree__row[data-leaf]:not([data-leaf-icon]) .andes-tree__indent[data-elbow]::after',
      );
      expect(css).not.toMatch(
        /\.andes-tree__row\[data-leaf\] \.andes-tree__indent\[data-elbow\]::after/,
      );
    });
  });

  describe('connector line geometry', () => {
    const css = cssText();
    const vertical =
      '.andes-tree[data-line] .andes-tree__indent[data-line]::before';
    const elbow =
      '.andes-tree[data-line] .andes-tree__indent[data-elbow]::after';
    const leafElbow =
      '.andes-tree[data-line] .andes-tree__row[data-leaf]:not([data-leaf-icon]) .andes-tree__indent[data-elbow]::after';
    const stem =
      ".andes-tree[data-line] .andes-tree__row[data-state='open'] .andes-tree__switcher::after";

    it('keeps the measured proportions: 24px indent, switcher and title, 4px gaps, 14px box', () => {
      expect(treeLength(css, 'var(--_indent)')).toBe(24);
      expect(treeLength(css, 'var(--_title-height)')).toBe(24);
      expect(treeLength(css, 'var(--_gap)')).toBe(4);
      expect(treeLength(css, 'var(--_switcher-gap)')).toBe(4);
      expect(treeLength(css, 'var(--_box)')).toBe(14);
      expect(declaredValue(css, '.andes-tree__switcher', 'width')).toBe(
        'var(--_indent)',
      );
      expect(
        declaredValue(css, '.andes-tree__switcher', 'margin-inline-end'),
      ).toBe('var(--_switcher-gap)');
    });

    it('runs every vertical through the gap below its row, so rows join without a break', () => {
      const inset = declaredValue(css, vertical, 'inset-block') as string;
      const top = inset.slice(0, inset.indexOf(' '));
      const bottom = inset.slice(inset.indexOf(' ') + 1);
      expect(top).toBe('0');
      // The cell is the title's height; reaching -gap below it touches the next row's line.
      expect(treeLength(css, bottom)).toBe(-4);
      expect(declaredValue(css, vertical, 'border-inline-start')).toBe(
        '1px solid var(--_line)',
      );
    });

    it("starts the open box's stem at the box's lower edge and carries it into the gap", () => {
      const inset = declaredValue(css, stem, 'inset-block') as string;
      const split = inset.lastIndexOf(' calc(');
      const top = treeLength(css, inset.slice(0, split));
      const bottom = treeLength(css, inset.slice(split + 1));
      const boxBottom =
        (treeLength(css, 'var(--_title-height)') +
          treeLength(css, 'var(--_box)')) /
        2;
      expect(top).toBe(boxBottom);
      expect(bottom).toBe(-4);
    });

    it("ends a parent's tick on its box and a leaf's tick where the content starts", () => {
      const indent = treeLength(css, 'var(--_indent)');
      const box = treeLength(css, 'var(--_box)');
      // The tick starts on the elbow's line, half a cell in.
      const start = indent / 2;
      const parentEnd =
        start + treeLength(css, declaredValue(css, elbow, 'width') as string);
      const leafEnd =
        start +
        treeLength(css, declaredValue(css, leafElbow, 'width') as string);
      // The next cell is the row's switcher, with the box centred in it.
      expect(parentEnd).toBe(indent + (indent - box) / 2);
      // Past the empty switcher and its gap: the first pixel of the content.
      expect(leafEnd).toBe(
        indent + indent + treeLength(css, 'var(--_switcher-gap)'),
      );
      expect(declaredValue(css, elbow, 'top')).toBe(
        'calc(var(--_title-height) / 2)',
      );
    });
  });

  describe('filtering', () => {
    it('keeps matches and their ancestors, opens the ancestors and marks the match', () => {
      const fixture = setup((h) => h.filter.set('estante y'));
      expect(titles(fixture)).toEqual([
        'Almacén central',
        'Pasillo 1',
        'Estante Y',
      ]);
      expect(fixture.componentInstance.expanded()).toEqual(['a', 'a1']);
      const mark = node(fixture, 'Estante Y').querySelector(
        'mark.andes-tree__match',
      );
      expect(mark?.textContent).toBe('Estante Y');
    });

    it('matches without regard to case or accents', () => {
      const fixture = setup((h) => h.filter.set('ALMACEN'));
      expect(titles(fixture)).toEqual(['Almacén central']);
      expect(
        node(fixture, 'Almacén central').querySelector('mark')?.textContent,
      ).toBe('Almacén');
      // A matched node keeps its whole subtree, which shows once it is opened.
      fixture.componentInstance.tree().expandKeys(['a']);
      fixture.detectChanges();
      expect(titles(fixture)).toEqual([
        'Almacén central',
        'Pasillo 1',
        'Pasillo 2',
      ]);
    });

    it('reports positions among the visible siblings', () => {
      const fixture = setup((h) => h.filter.set('caja'));
      expect(titles(fixture)).toEqual(['Sucursal norte', 'Caja']);
      expect(node(fixture, 'Sucursal norte').getAttribute('aria-setsize')).toBe(
        '1',
      );
    });

    it('shows the empty state when nothing matches', () => {
      const fixture = setup((h) => h.filter.set('zzzz'));
      expect(fixture.nativeElement.querySelector('[role="tree"]')).toBeNull();
      expect(
        fixture.nativeElement.querySelector('.andes-tree__empty'),
      ).toBeTruthy();
    });

    it('restores the tree when the filter is cleared', () => {
      const fixture = setup((h) => h.filter.set('caja'));
      fixture.componentInstance.filter.set('');
      fixture.detectChanges();
      expect(node(fixture, 'Archivo')).toBeTruthy();
      expect(fixture.nativeElement.querySelector('mark')).toBeNull();
    });

    it('only highlights in highlight mode and keeps every node', () => {
      const fixture = setup((h) => {
        h.filterMode.set('highlight');
        h.filter.set('caja');
      });
      expect(node(fixture, 'Archivo')).toBeTruthy();
      expect(node(fixture, 'Caja').querySelector('mark')).toBeTruthy();
    });

    it('announces how many nodes match', () => {
      const fixture = setup((h) => h.filter.set('estante'));
      fixture.detectChanges();
      expect(
        fixture.nativeElement.querySelector('.andes-tree__live').textContent,
      ).toBe('2 results');
    });
  });

  describe('loading children on demand', () => {
    function lazy(fixture: Fixture, load: AndesTreeLoadData) {
      fixture.componentInstance.nodes.set([
        { key: 'root', title: 'Servidor' },
        { key: 'leaf', title: 'Fijo', isLeaf: true },
      ]);
      fixture.componentInstance.loadData.set(load);
      fixture.detectChanges();
    }

    it('shows a switcher for a node with no children yet and loads on first open', async () => {
      const fixture = setup();
      const load = vi.fn(async (loaded: AndesTreeNode) => {
        fixture.componentInstance.nodes.update((nodes) =>
          nodes.map((n) =>
            n.key === loaded.key
              ? { ...n, children: [{ key: 'kid', title: 'Hijo' }] }
              : n,
          ),
        );
      });
      lazy(fixture, load);

      const root = node(fixture, 'Servidor');
      expect(root.getAttribute('aria-expanded')).toBe('false');
      expect(node(fixture, 'Fijo').hasAttribute('aria-expanded')).toBe(false);

      switcher(root).click();
      fixture.detectChanges();
      expect(load).toHaveBeenCalledTimes(1);
      expect(root.getAttribute('aria-busy')).toBe('true');
      expect(switcher(root).querySelector('.andes-tree__spinner')).toBeTruthy();

      await fixture.whenStable();
      fixture.detectChanges();
      expect(root.hasAttribute('aria-busy')).toBe(false);
      expect(fixture.componentInstance.tree().loadedKeys()).toEqual(['root']);
      expect(titles(fixture)).toContain('Hijo');

      // Closing and opening again does not reload.
      switcher(root).click();
      switcher(root).click();
      expect(load).toHaveBeenCalledTimes(1);
    });

    it('treats a loaded node with no children as a leaf', async () => {
      const fixture = setup();
      lazy(fixture, async () => undefined);
      switcher(node(fixture, 'Servidor')).click();
      await fixture.whenStable();
      fixture.detectChanges();
      expect(node(fixture, 'Servidor').hasAttribute('aria-expanded')).toBe(
        false,
      );
    });

    it('supports a loader that returns an observable', async () => {
      const fixture = setup();
      const done = new Subject<void>();
      lazy(fixture, () => done);
      switcher(node(fixture, 'Servidor')).click();
      fixture.detectChanges();
      expect(node(fixture, 'Servidor').getAttribute('aria-busy')).toBe('true');
      done.next();
      done.complete();
      await fixture.whenStable();
      fixture.detectChanges();
      expect(fixture.componentInstance.tree().loadedKeys()).toEqual(['root']);
    });

    it('closes the node again and reports the error when loading fails', async () => {
      const fixture = setup();
      lazy(fixture, () => Promise.reject(new Error('offline')));
      switcher(node(fixture, 'Servidor')).click();
      await fixture.whenStable();
      fixture.detectChanges();
      expect(fixture.componentInstance.expanded()).toEqual([]);
      expect(fixture.componentInstance.loadErrors).toHaveLength(1);
      expect(
        (fixture.componentInstance.loadErrors[0].error as Error).message,
      ).toBe('offline');
      expect(node(fixture, 'Servidor').hasAttribute('aria-busy')).toBe(false);
    });

    it('handles a loader that throws', async () => {
      const fixture = setup();
      lazy(fixture, () => {
        throw new Error('boom');
      });
      switcher(node(fixture, 'Servidor')).click();
      await fixture.whenStable();
      expect(fixture.componentInstance.loadErrors).toHaveLength(1);
    });

    it('skips unloaded nodes when opening everything', () => {
      const fixture = setup();
      lazy(fixture, async () => undefined);
      fixture.componentInstance.tree().expandAll();
      expect(fixture.componentInstance.expanded()).toEqual([]);
    });
  });

  describe('drag and drop', () => {
    function dragEvent(type: string, clientY = 0): Event {
      const event = new Event(type, { bubbles: true, cancelable: true });
      Object.defineProperty(event, 'clientY', { value: clientY });
      Object.defineProperty(event, 'dataTransfer', {
        value: { setData: vi.fn(), effectAllowed: '', dropEffect: '' },
      });
      return event;
    }

    function drag(fixture: Fixture, from: string, to: string, at: number) {
      const source = row(node(fixture, from));
      const target = row(node(fixture, to));
      target.getBoundingClientRect = () =>
        ({ top: 0, height: 100, bottom: 100 }) as DOMRect;
      (
        source.querySelector('.andes-tree__content') as HTMLElement
      ).dispatchEvent(dragEvent('dragstart'));
      fixture.detectChanges();
      const over = dragEvent('dragover', at);
      target.dispatchEvent(over);
      fixture.detectChanges();
      return { source, target, over };
    }

    it('reports drag start, enter, changes of the drop it would make, leave and end', () => {
      const fixture = setup((h) => h.draggable.set(true));
      const { source, target } = drag(fixture, 'Archivo', 'Sucursal norte', 10);
      expect(
        fixture.nativeElement.querySelector('.andes-tree__live').textContent,
      ).toBe('Archivo grabbed');
      target.dispatchEvent(dragEvent('dragenter', 10));
      // The same part of the same row again: nothing new to report.
      target.dispatchEvent(dragEvent('dragover', 10));
      target.dispatchEvent(dragEvent('dragover', 50));
      target.dispatchEvent(dragEvent('dragleave', 50));
      source.dispatchEvent(dragEvent('dragend'));
      expect(fixture.componentInstance.dragLog).toEqual([
        'start:c:c:-',
        'over:b:c:before',
        'enter:b:c:before',
        'over:b:c:inside',
        'leave:b:c:-',
        'end:c:c:-',
      ]);
    });

    it('reports a null position over a node the drag cannot land on', () => {
      const fixture = setup((h) => {
        h.draggable.set(true);
        h.expanded.set(['a', 'a1']);
      });
      drag(fixture, 'Almacén central', 'Estante X', 50);
      expect(fixture.componentInstance.dragLog).toEqual([
        'start:a:a:-',
        'over:a1x:a:-',
      ]);
    });

    it('ignores enter and leave between the elements of one row', () => {
      const fixture = setup((h) => h.draggable.set(true));
      const { target } = drag(fixture, 'Archivo', 'Sucursal norte', 10);
      const inner = target.querySelector('.andes-tree__title') as HTMLElement;
      const leave = dragEvent('dragleave', 10);
      Object.defineProperty(leave, 'relatedTarget', { value: inner });
      target.dispatchEvent(leave);
      expect(
        fixture.componentInstance.dragLog.filter((e) => e.startsWith('leave')),
      ).toEqual([]);
    });

    describe('grips', () => {
      const handle = (fixture: Fixture, title: string) =>
        row(node(fixture, title)).querySelector(
          ':scope > .andes-tree__handle',
        ) as HTMLElement | null;

      it('opens every row of a draggable tree with a six-dot grip, before the indentation', () => {
        const fixture = setup((h) => h.expanded.set(['a']));
        expect(handle(fixture, 'Archivo')).toBeNull();
        fixture.componentInstance.draggable.set(true);
        fixture.detectChanges();

        const grip = handle(fixture, 'Pasillo 1') as HTMLElement;
        expect(grip.getAttribute('aria-hidden')).toBe('true');
        expect(grip.getAttribute('draggable')).toBe('true');
        expect(grip.querySelectorAll('svg circle')).toHaveLength(6);
        expect(row(node(fixture, 'Pasillo 1')).firstElementChild).toBe(grip);
        expect(grip.nextElementSibling?.classList).toContain(
          'andes-tree__indent',
        );
        expect(
          fixture.nativeElement
            .querySelector('.andes-tree')
            .hasAttribute('data-handles'),
        ).toBe(true);
      });

      it('keeps the column but draws no grip for a node that cannot move', () => {
        const fixture = setup((h) => {
          h.draggable.set(true);
          h.expanded.set(['a']);
        });
        const locked = handle(fixture, 'Pasillo 2') as HTMLElement;
        expect(locked.hasAttribute('data-disabled')).toBe(true);
        expect(locked.hasAttribute('draggable')).toBe(false);
        expect(locked.querySelector('svg')).toBeNull();
      });

      it('starts a drag from the grip as from the content', () => {
        const fixture = setup((h) => h.draggable.set(true));
        (handle(fixture, 'Archivo') as HTMLElement).dispatchEvent(
          dragEvent('dragstart'),
        );
        expect(fixture.componentInstance.dragLog).toEqual(['start:c:c:-']);
      });

      it('hides the grips with dragHandle false and keeps dragging', () => {
        const fixture = setup((h) => {
          h.draggable.set(true);
          h.dragHandle.set(false);
        });
        expect(handle(fixture, 'Archivo')).toBeNull();
        expect(
          fixture.nativeElement
            .querySelector('.andes-tree')
            .hasAttribute('data-handles'),
        ).toBe(false);
        expect(
          row(node(fixture, 'Archivo'))
            .querySelector('.andes-tree__content')
            ?.getAttribute('draggable'),
        ).toBe('true');
      });

      it('sizes the grip column like an indent step and the dots like the line box', () => {
        const css = cssText();
        expect(declaredValue(css, '.andes-tree', '--_lead')).toBe('0rem');
        expect(declaredValue(css, '.andes-tree[data-handles]', '--_lead')).toBe(
          'var(--_indent)',
        );
        expect(treeLength(css, 'var(--_indent)')).toBe(24);
        expect(declaredValue(css, '.andes-tree__handle', 'width')).toBe(
          'var(--_lead)',
        );
        expect(declaredValue(css, '.andes-tree__handle', 'height')).toBe(
          'var(--_title-height)',
        );
        expect(declaredValue(css, '.andes-tree__handle > svg', 'width')).toBe(
          'var(--_box)',
        );
        expect(declaredValue(css, '.andes-tree__handle', 'cursor')).toBe(
          'grab',
        );
        expect(declaredValue(css, '.andes-tree__handle', 'color')).toBe(
          'color-mix( in srgb, var(--andes-color-muted-foreground, #64748b) 55%, transparent )',
        );
        expect(
          declaredValue(
            css,
            '.andes-tree__row:hover > .andes-tree__handle',
            'color',
          ),
        ).toBe('var(--andes-color-muted-foreground, #64748b)');
      });
    });

    it('only offers dragging for draggable trees and skips disabled nodes', () => {
      const fixture = setup((h) => h.expanded.set(['a']));
      const content = (t: string) =>
        row(node(fixture, t)).querySelector(
          '.andes-tree__content',
        ) as HTMLElement;
      expect(content('Archivo').hasAttribute('draggable')).toBe(false);
      fixture.componentInstance.draggable.set(true);
      fixture.detectChanges();
      expect(content('Archivo').getAttribute('draggable')).toBe('true');
      expect(content('Pasillo 2').hasAttribute('draggable')).toBe(false);
    });

    it('shows an indicator above, below or inside the node under the pointer', () => {
      const fixture = setup((h) => h.draggable.set(true));
      let { target } = drag(fixture, 'Archivo', 'Sucursal norte', 10);
      expect(
        target
          .querySelector('.andes-tree__drop-indicator')
          ?.getAttribute('data-position'),
      ).toBe('before');
      ({ target } = drag(fixture, 'Archivo', 'Sucursal norte', 90));
      expect(
        target
          .querySelector('.andes-tree__drop-indicator')
          ?.getAttribute('data-position'),
      ).toBe('after');
      ({ target } = drag(fixture, 'Archivo', 'Sucursal norte', 50));
      expect(target.getAttribute('data-drop')).toBe('inside');
      const inside = target.querySelector(
        '.andes-tree__drop-indicator',
      ) as HTMLElement;
      expect(inside.getAttribute('data-position')).toBe('inside');
      // Dropped inside, the node becomes a child: the line is one level in.
      expect(inside.style.getPropertyValue('--_drop-level')).toBe('2');
    });

    it('draws the line at the level the node would land on', () => {
      const fixture = setup((h) => {
        h.draggable.set(true);
        h.expanded.set(['b']);
      });
      const level = (target: HTMLElement) =>
        (
          target.querySelector('.andes-tree__drop-indicator') as HTMLElement
        ).style.getPropertyValue('--_drop-level');
      expect(level(drag(fixture, 'Archivo', 'Sucursal norte', 10).target)).toBe(
        '1',
      );
      // After an open parent means before its first child, a level in.
      expect(level(drag(fixture, 'Archivo', 'Sucursal norte', 90).target)).toBe(
        '2',
      );
      expect(level(drag(fixture, 'Archivo', 'Caja', 90).target)).toBe('2');
    });

    it('places the line in the gaps between rows, 4px into the landing content', () => {
      const css = cssText();
      const indicator = '.andes-tree__drop-indicator';
      const content = declaredValue(
        css,
        indicator,
        '--_content-start',
      ) as string;
      const at = (level: number, lead = '0rem') =>
        treeLength(
          css,
          content
            .replace('var(--_drop-level, 1)', String(level))
            .replace('var(--_lead)', lead),
        );
      // A root node's content starts after its switcher and the switcher's gap: 28px.
      expect(at(1)).toBe(24 + 4);
      expect(at(2)).toBe(24 + 24 + 4);
      // A draggable tree's grip column pushes everything 24px further.
      expect(at(1, 'var(--_indent)')).toBe(24 + 24 + 4);
      expect(declaredValue(css, indicator, 'inset-inline')).toBe(
        'calc(var(--_content-start) + 0.25rem) 0',
      );
      // 2px tall: centred in the 4px gap above (-3px) or below (25px) the 24px title.
      expect(declaredValue(css, indicator, 'height')).toBe('2px');
      expect(
        treeLength(
          css,
          declaredValue(
            css,
            `${indicator}[data-position='before']`,
            'top',
          ) as string,
        ),
      ).toBe(-3);
      expect(
        treeLength(
          css,
          declaredValue(
            css,
            `${indicator}[data-position='after']`,
            'top',
          ) as string,
        ),
      ).toBe(25);
      expect(
        declaredValue(css, `${indicator}[data-position='inside']`, 'top'),
      ).toBe(declaredValue(css, `${indicator}[data-position='after']`, 'top'));
      // An 8px ring with a 2px edge opens the line.
      expect(declaredValue(css, `${indicator}::before`, 'width')).toBe('8px');
      expect(declaredValue(css, `${indicator}::before`, 'border')).toBe(
        '2px solid var(--andes-color-primary, #2563eb)',
      );
      expect(
        declaredValue(css, `${indicator}::before`, 'inset-inline-start'),
      ).toBe('-0.375rem');
    });

    it('tints the node a drop would go into, and outlines it in forced colours', () => {
      const css = cssText();
      expect(
        declaredValue(
          css,
          ".andes-tree__row[data-drop='inside'] .andes-tree__content",
          'background-color',
        ),
      ).toBe(
        'color-mix( in srgb, var(--andes-color-primary, #2563eb) 12%, transparent )',
      );
      const forced = css.slice(css.indexOf('@media (forced-colors: active)'));
      expect(forced).toMatch(
        /\.andes-tree__drop-indicator\s*{[^}]*background-color: Highlight/,
      );
      expect(forced).toMatch(
        /\[data-drop='inside'\] \.andes-tree__content\s*{[^}]*outline: 2px solid Highlight/,
      );
    });

    it('reports a drop without touching the nodes, and stays quiet until they carry it', () => {
      const fixture = setup((h) => {
        h.draggable.set(true);
        h.applyDrops = false;
      });
      const before = fixture.componentInstance.nodes();
      const { target } = drag(fixture, 'Archivo', 'Almacén central', 10);
      target.dispatchEvent(dragEvent('drop', 10));
      fixture.detectChanges();

      expect(fixture.componentInstance.drops).toEqual([
        expect.objectContaining({
          dragKey: 'c',
          targetKey: 'a',
          position: 'before',
          via: 'pointer',
        }),
      ]);
      expect(fixture.componentInstance.drops[0]).not.toHaveProperty('nodes');
      expect(fixture.componentInstance.nodes()).toBe(before);
      expect(before.map((n) => n.key)).toEqual(['a', 'b', 'c']);
      expect(titles(fixture)[0]).toBe('Almacén central');
      const live = fixture.nativeElement.querySelector('.andes-tree__live');
      // Only the grab was spoken: no move is announced before the data shows it.
      expect(live.textContent).toBe('Archivo grabbed');

      // The consumer applies it later: the announcement follows.
      fixture.componentInstance.nodes.set(
        andesMoveTreeNode(before, 'c', 'a', 'before') as AndesTreeNode[],
      );
      fixture.detectChanges();
      expect(live.textContent).toBe('Archivo moved before Almacén central');
    });

    it('opens the branch a node is dropped into before the consumer applies it', () => {
      const fixture = setup((h) => {
        h.draggable.set(true);
        h.applyDrops = false;
      });
      const { target } = drag(fixture, 'Archivo', 'Sucursal norte', 50);
      target.dispatchEvent(dragEvent('drop', 50));
      fixture.detectChanges();
      expect(fixture.componentInstance.expanded()).toEqual(['b']);
    });

    it('reorders on drop once the consumer applies the move, and announces it', () => {
      const fixture = setup((h) => h.draggable.set(true));
      const { target, over } = drag(fixture, 'Archivo', 'Almacén central', 10);
      expect(over.defaultPrevented).toBe(true);
      target.dispatchEvent(dragEvent('drop', 10));
      fixture.detectChanges();

      expect(fixture.componentInstance.nodes().map((n) => n.key)).toEqual([
        'c',
        'a',
        'b',
      ]);
      expect(fixture.componentInstance.drops).toHaveLength(1);
      expect(fixture.componentInstance.drops[0]).toMatchObject({
        dragKey: 'c',
        targetKey: 'a',
        position: 'before',
      });
      expect(titles(fixture)[0]).toBe('Archivo');
      expect(
        fixture.nativeElement.querySelector('.andes-tree__live').textContent,
      ).toBe('Archivo moved before Almacén central');
    });

    it('drops inside a node and opens it', () => {
      const fixture = setup((h) => h.draggable.set(true));
      const { target } = drag(fixture, 'Archivo', 'Sucursal norte', 50);
      target.dispatchEvent(dragEvent('drop', 50));
      fixture.detectChanges();
      expect(
        fixture.componentInstance.nodes()[1].children?.map((n) => n.key),
      ).toEqual(['c', 'b1']);
      expect(fixture.componentInstance.expanded()).toEqual(['b']);
    });

    it('drops after an open parent as its first child', () => {
      const fixture = setup((h) => {
        h.draggable.set(true);
        h.expanded.set(['b']);
      });
      const { target } = drag(fixture, 'Archivo', 'Sucursal norte', 90);
      expect(
        target
          .querySelector('.andes-tree__drop-indicator')
          ?.getAttribute('data-position'),
      ).toBe('after');
      target.dispatchEvent(dragEvent('drop', 90));
      expect(fixture.componentInstance.drops[0]).toMatchObject({
        targetKey: 'b1',
        position: 'before',
      });
      expect(
        fixture.componentInstance.nodes()[1].children?.map((n) => n.key),
      ).toEqual(['c', 'b1']);
    });

    it('refuses a drop into the dragged node itself', () => {
      const fixture = setup((h) => {
        h.draggable.set(true);
        h.expanded.set(['a', 'a1']);
      });
      const { target, over } = drag(
        fixture,
        'Almacén central',
        'Estante X',
        50,
      );
      expect(over.defaultPrevented).toBe(false);
      expect(target.querySelector('.andes-tree__drop-indicator')).toBeNull();
      target.dispatchEvent(dragEvent('drop', 50));
      expect(fixture.componentInstance.drops).toHaveLength(0);
    });

    it('lets allowDrop veto a drop', () => {
      const fixture = setup((h) => {
        h.draggable.set(true);
        h.allowDrop.set((info) => info.targetKey !== 'a');
      });
      const { over } = drag(fixture, 'Archivo', 'Almacén central', 10);
      expect(over.defaultPrevented).toBe(false);
      const second = drag(fixture, 'Archivo', 'Sucursal norte', 10);
      expect(second.over.defaultPrevented).toBe(true);
    });

    it('clears the indicator when the drag ends', () => {
      const fixture = setup((h) => h.draggable.set(true));
      const { source } = drag(fixture, 'Archivo', 'Sucursal norte', 10);
      source.dispatchEvent(dragEvent('dragend'));
      fixture.detectChanges();
      expect(
        fixture.nativeElement.querySelector('.andes-tree__drop-indicator'),
      ).toBeNull();
    });

    it('opens a closed parent after the pointer rests on it', () => {
      vi.useFakeTimers();
      try {
        const fixture = setup((h) => h.draggable.set(true));
        drag(fixture, 'Archivo', 'Sucursal norte', 50);
        vi.advanceTimersByTime(700);
        expect(fixture.componentInstance.expanded()).toEqual(['b']);
      } finally {
        vi.useRealTimers();
      }
    });

    it('limits dragging to the nodes a function picks', () => {
      const fixture = setup();
      (
        fixture.componentInstance.draggable as unknown as {
          set(v: unknown): void;
        }
      ).set((n: AndesTreeNode) => n.key === 'c');
      fixture.detectChanges();
      const content = (t: string) =>
        row(node(fixture, t)).querySelector(
          '.andes-tree__content',
        ) as HTMLElement;
      expect(content('Archivo').getAttribute('draggable')).toBe('true');
      expect(content('Sucursal norte').hasAttribute('draggable')).toBe(false);
    });

    describe('with the keyboard', () => {
      function start(configure?: (h: HostComponent) => void) {
        const fixture = setup((h) => {
          h.draggable.set(true);
          configure?.(h);
        });
        document.body.appendChild(fixture.nativeElement);
        return fixture;
      }

      afterEach(() => {
        document.body.innerHTML = '';
      });

      it('moves a node past its next sibling with Alt+ArrowDown and keeps focus on it', async () => {
        const fixture = start();
        const a = node(fixture, 'Almacén central');
        a.focus();
        key(a, 'ArrowDown', { altKey: true });
        fixture.detectChanges();
        await fixture.whenStable();
        expect(fixture.componentInstance.nodes().map((n) => n.key)).toEqual([
          'b',
          'a',
          'c',
        ]);
        expect(fixture.componentInstance.drops[0]).toMatchObject({
          dragKey: 'a',
          targetKey: 'b',
          position: 'after',
          via: 'keyboard',
        });
        expect(document.activeElement).toBe(node(fixture, 'Almacén central'));
        expect(
          fixture.nativeElement.querySelector('.andes-tree__live').textContent,
        ).toBe('Almacén central moved after Sucursal norte');
      });

      it('leaves the data alone when the consumer does not apply a keyboard move', () => {
        const fixture = start((h) => (h.applyDrops = false));
        const a = node(fixture, 'Almacén central');
        a.focus();
        key(a, 'ArrowDown', { altKey: true });
        fixture.detectChanges();
        expect(fixture.componentInstance.drops).toHaveLength(1);
        expect(fixture.componentInstance.nodes().map((n) => n.key)).toEqual([
          'a',
          'b',
          'c',
        ]);
        expect(
          fixture.nativeElement.querySelector('.andes-tree__live').textContent,
        ).toBe('');
      });

      it('moves up with Alt+ArrowUp', () => {
        const fixture = start();
        const c = node(fixture, 'Archivo');
        c.focus();
        key(c, 'ArrowUp', { altKey: true });
        expect(fixture.componentInstance.nodes().map((n) => n.key)).toEqual([
          'a',
          'c',
          'b',
        ]);
      });

      it('indents into the sibling above with Alt+ArrowRight and outdents with Alt+ArrowLeft', () => {
        const fixture = start();
        const b = node(fixture, 'Sucursal norte');
        b.focus();
        key(b, 'ArrowRight', { altKey: true });
        fixture.detectChanges();
        // The sibling above (a) has children, so b lands after its last child.
        const root = fixture.componentInstance.nodes();
        expect(root.map((n) => n.key)).toEqual(['a', 'c']);
        expect(root[0].children?.map((n) => n.key)).toEqual(['a1', 'a2', 'b']);

        key(node(fixture, 'Sucursal norte'), 'ArrowLeft', { altKey: true });
        expect(fixture.componentInstance.nodes().map((n) => n.key)).toEqual([
          'a',
          'b',
          'c',
        ]);
      });

      it('indents into a leaf sibling as its first child', () => {
        const fixture = start((h) =>
          h.nodes.set([
            { key: 'x', title: 'X' },
            { key: 'y', title: 'Y' },
          ]),
        );
        const y = node(fixture, 'Y');
        y.focus();
        key(y, 'ArrowRight', { altKey: true });
        expect(
          fixture.componentInstance.nodes()[0].children?.map((n) => n.key),
        ).toEqual(['y']);
      });

      it('does nothing at the edges and when dragging is off', () => {
        const fixture = start();
        const a = node(fixture, 'Almacén central');
        a.focus();
        key(a, 'ArrowUp', { altKey: true });
        key(a, 'ArrowLeft', { altKey: true });
        key(a, 'ArrowRight', { altKey: true });
        expect(fixture.componentInstance.drops).toHaveLength(0);

        fixture.componentInstance.draggable.set(false);
        fixture.detectChanges();
        key(a, 'ArrowDown', { altKey: true });
        expect(fixture.componentInstance.drops).toHaveLength(0);
      });

      it('respects allowDrop', () => {
        const fixture = start((h) => h.allowDrop.set(() => false));
        const a = node(fixture, 'Almacén central');
        a.focus();
        key(a, 'ArrowDown', { altKey: true });
        expect(fixture.componentInstance.drops).toHaveLength(0);
      });
    });
  });

  describe('virtual scrolling', () => {
    beforeEach(() => {
      // jsdom has no layout: give the viewport a size and a scroll method.
      vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(
        200,
      );
      vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(
        300,
      );
      Element.prototype.scrollTo =
        vi.fn() as unknown as typeof Element.prototype.scrollTo;
    });

    afterEach(() => {
      vi.restoreAllMocks();
      delete (Element.prototype as { scrollTo?: unknown }).scrollTo;
    });

    function big(count: number): AndesTreeNode[] {
      return Array.from({ length: count }, (_, i) => ({
        key: `n${i}`,
        title: `Nodo ${i}`,
      }));
    }

    async function settle(fixture: Fixture) {
      // The viewport measures itself in a microtask after it is created.
      await fixture.whenStable();
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
    }

    it('renders only a window of rows, with the set position of each', async () => {
      const fixture = setup((h) => {
        h.virtual.set(true);
        h.nodes.set(big(2000));
      });
      await settle(fixture);
      const items = [
        ...fixture.nativeElement.querySelectorAll('[role="treeitem"]'),
      ] as HTMLElement[];
      expect(items.length).toBeGreaterThan(0);
      expect(items.length).toBeLessThan(100);
      expect(items[0].getAttribute('aria-posinset')).toBe('1');
      expect(items[0].getAttribute('aria-setsize')).toBe('2000');
      expect(items[0].getAttribute('aria-level')).toBe('1');
      expect(
        fixture.nativeElement.querySelector('cdk-virtual-scroll-viewport'),
      ).toBeTruthy();
      expect(
        fixture.nativeElement.querySelector('.andes-tree__collapse'),
      ).toBeNull();
    });

    it('lists nested rows flat with their own level', async () => {
      const fixture = setup((h) => {
        h.virtual.set(true);
        h.expanded.set(['a', 'a1']);
      });
      await settle(fixture);
      const x = node(fixture, 'Estante X');
      expect(x.getAttribute('aria-level')).toBe('3');
      expect(x.parentElement?.getAttribute('role')).not.toBe('group');
    });

    it('keeps the viewport at the requested height', () => {
      const fixture = setup((h) => h.virtual.set(true));
      const viewport = fixture.nativeElement.querySelector(
        'cdk-virtual-scroll-viewport',
      ) as HTMLElement;
      expect(viewport.style.height).toBe('200px');
    });

    it('focuses a row that is not rendered by scrolling to it first', async () => {
      const fixture = setup((h) => {
        h.virtual.set(true);
        h.nodes.set(big(500));
      });
      await settle(fixture);
      document.body.appendChild(fixture.nativeElement);
      try {
        expect(
          fixture.componentInstance.tree().scrollToKey('n300', { focus: true }),
        ).toBe(true);
        fixture.detectChanges();
        await fixture.whenStable();
        expect(fixture.componentInstance.tree().getNode('n300')?.title).toBe(
          'Nodo 300',
        );
      } finally {
        document.body.innerHTML = '';
      }
    });
  });

  describe('disabledKeys', () => {
    @Component({
      imports: [AndesTree],
      template: `
        <andes-tree
          checkable
          [nodes]="nodes"
          [expandedKeys]="['a', 'a1']"
          [disabledKeys]="locked()"
          [(checkedKeys)]="checked"
          aria-label="Warehouses"
        />
      `,
    })
    class LockedHost {
      readonly nodes = sample();
      readonly locked = signal<AndesTreeKey[]>(['a1y']);
      checked: AndesTreeKey[] = [];
    }

    it('disables the listed nodes on top of their own flag, and lets go of them again', () => {
      const fixture = TestBed.createComponent(LockedHost);
      fixture.detectChanges();
      const item = () =>
        [...fixture.nativeElement.querySelectorAll('[role="treeitem"]')].find(
          (el) =>
            el
              .querySelector(':scope > .andes-tree__row .andes-tree__title')
              ?.textContent?.trim() === 'Estante Y',
        ) as HTMLElement;

      expect(item().getAttribute('aria-disabled')).toBe('true');
      checkbox(item()).click();
      fixture.detectChanges();
      expect(fixture.componentInstance.checked).toEqual([]);

      fixture.componentInstance.locked.set([]);
      fixture.detectChanges();
      expect(item().hasAttribute('aria-disabled')).toBe(false);
      checkbox(item()).click();
      fixture.detectChanges();
      expect(fixture.componentInstance.checked).toEqual(['a1y']);
    });
  });

  describe('switcherIcon', () => {
    @Component({
      imports: [AndesTree],
      template: `
        <ng-template #switcher let-expanded="expanded">
          <i class="custom-switcher">{{ expanded ? 'open' : 'closed' }}</i>
        </ng-template>
        <andes-tree
          [nodes]="nodes"
          [(expandedKeys)]="expanded"
          [switcherIcon]="switcher"
          aria-label="Warehouses"
        />
      `,
    })
    class SwitcherHost {
      readonly nodes = sample();
      expanded: AndesTreeKey[] = [];
    }

    it('draws a custom expand icon on branches only, with the node context', () => {
      const fixture = TestBed.createComponent(SwitcherHost);
      fixture.detectChanges();
      const root = fixture.nativeElement.querySelector(
        '[role="treeitem"]',
      ) as HTMLElement;
      const icon = switcher(root).querySelector('.andes-tree__switcher-icon');

      expect(icon?.classList).toContain('andes-tree__chevron');
      expect(icon?.textContent?.trim()).toBe('closed');
      expect(switcher(root).querySelector('svg')).toBeNull();

      switcher(root).click();
      fixture.detectChanges();
      expect(
        switcher(root).querySelector('.custom-switcher')?.textContent,
      ).toBe('open');
      // A leaf keeps an empty switcher.
      const leaves = [
        ...fixture.nativeElement.querySelectorAll(
          '.andes-tree__switcher[data-leaf]',
        ),
      ] as HTMLElement[];
      expect(leaves.length).toBeGreaterThan(0);
      for (const leaf of leaves) {
        expect(leaf.querySelector('.custom-switcher')).toBeNull();
      }
    });
  });

  describe('stylesheet contract', () => {
    const css = cssText();

    it('gives the nodes the measured row anatomy', () => {
      expect(css).toContain('--_indent: 1.5rem');
      expect(css).toContain('--_title-height: 1.5rem');
      expect(css).toContain('--_gap: 0.25rem');
      expect(css).toMatch(/\[data-density='compact'\]\s*{\s*--_gap: 0rem/);
    });

    it('keeps the checkbox edge above 3:1 by mixing the input colour towards the foreground', () => {
      expect(declaredValue(css, '.andes-tree__checkbox', 'border')).toBe(
        '1px solid color-mix( in srgb, var(--andes-color-input, #cbd5e1), var(--andes-color-foreground, #0f172a) 35% )',
      );
    });

    it('slows the spinner under reduced motion instead of freezing it', () => {
      const start = css.indexOf('@media (prefers-reduced-motion: reduce)');
      const block = css.slice(start, css.indexOf('/* Virtual list', start));
      expect(block).toContain('animation-duration: 2.4s');
      expect(block).not.toContain('animation: none');
    });

    it('fills a directory row, on hover and when selected, with one rounded full-width pseudo-element', () => {
      expect(css).not.toContain('background-clip: content-box');
      const fill = '.andes-tree[data-directory] .andes-tree__row::before';
      expect(declaredValue(css, fill, 'inset')).toBe('0 0 var(--_gap)');
      expect(declaredValue(css, fill, 'border-radius')).toBe(
        'var(--andes-radius-md, 0.375rem)',
      );
      expect(
        declaredValue(
          css,
          '.andes-tree[data-directory] .andes-tree__row:not([data-selected]):not([data-disabled]):hover::before',
          'background-color',
        ),
      ).toBe('var(--_hover)');
      expect(
        declaredValue(
          css,
          '.andes-tree[data-directory] .andes-tree__row[data-selected]::before',
          'background-color',
        ),
      ).toBe('var(--andes-color-primary, #2563eb)');
      // The content draws no second, shorter fill on top.
      expect(
        declaredValue(
          css,
          '.andes-tree[data-directory] .andes-tree__content:hover',
          'background-color',
        ),
      ).toBe('transparent');
    });

    it('animates a branch open and shut between 150ms and 200ms, without bounce', () => {
      expect(css).toContain('grid-template-rows: 0fr');
      expect(css).toMatch(
        /andes-tree-expand var\(--andes-motion-duration-slow, 200ms\)/,
      );
      expect(css).toMatch(
        /andes-tree-collapse var\(--andes-motion-duration-mid, 150ms\)/,
      );
      expect(css).not.toMatch(/cubic-bezier\([^)]*-\d/);
    });

    it('only animates when motion is allowed', () => {
      const motion = css.slice(
        css.indexOf('@media (prefers-reduced-motion: no-preference)'),
      );
      expect(motion).toContain('andes-tree-expand');
      expect(motion).toContain('andes-tree-collapse');
      const outside = css.slice(
        0,
        css.indexOf('@media (prefers-reduced-motion: no-preference)'),
      );
      expect(outside).not.toMatch(/animation: andes-tree-(expand|collapse)/);
      expect(css).toMatch(
        /prefers-reduced-motion: reduce\)\s*{[^}]*transition: none/,
      );
    });

    it('draws focus on the row of the focused node, not on the whole branch', () => {
      expect(css).toContain(
        '.andes-tree__item:focus-visible > .andes-tree__row > .andes-tree__content',
      );
      expect(css).toMatch(/\.andes-tree__item\s*{[^}]*outline: none/);
    });

    it('uses logical properties and mirrors the arrow in right-to-left', () => {
      expect(css).toContain(':dir(rtl)');
      expect(css).not.toMatch(/(^|[\s;{])(margin|padding)-(left|right)\s*:/);
      expect(css).not.toMatch(/(^|[\s;{])(left|right)\s*:/);
    });

    it('takes colours from tokens, always with a fallback', () => {
      // Every token reference carries a literal fallback (the font stack is followed by its own).
      const vars = [...css.matchAll(/var\(--andes-[a-z-]+\)/g)].map(
        (m) => m[0],
      );
      expect(vars).toEqual(['var(--andes-font-family)']);
      expect(css).not.toMatch(/#[0-9a-f]{3,8}\b(?![^()]*\))/i);
    });

    it('hides a closed branch from assistive technology and the tab order', () => {
      expect(css).toMatch(/\.andes-tree__collapse\s*{[^}]*visibility: hidden/);
    });

    it('never continues a selector on a new line that starts with a combinator', () => {
      // Emulated encapsulation mis-scopes such a selector, which silently drops the rule.
      expect(css).not.toMatch(/^\s*[>+~]\s/m);
    });

    it('draws the drop indicator without capturing pointer events', () => {
      expect(css).toMatch(
        /\.andes-tree__drop-indicator\s*{[^}]*pointer-events: none/,
      );
    });
  });

  it('is exported from the package entry point', async () => {
    const barrel = await import('../../index');
    expect(barrel.AndesTree).toBe(AndesTree);
    expect(barrel.andesFlattenTree).toBeTypeOf('function');
    expect(barrel.andesConductCheck).toBeTypeOf('function');
  });
});
