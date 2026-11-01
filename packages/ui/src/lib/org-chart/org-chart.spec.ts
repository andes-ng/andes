import { Component, signal, TemplateRef, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AndesOrgChart } from './org-chart';
import type {
  AndesOrgChartBadgeCount,
  AndesOrgChartExpandEvent,
  AndesOrgChartHoverEvent,
  AndesOrgChartLoadChildren,
  AndesOrgChartLoadErrorEvent,
  AndesOrgChartNodeEvent,
  AndesOrgChartSecondaryLink,
  AndesOrgChartSelectEvent,
  AndesOrgChartSelectionMode,
  AndesOrgChartViewport,
} from './org-chart';
import {
  andesOrgChartFromFlat,
  andesOrgChartInitials,
  AndesOrgChartDataFormat,
  AndesOrgChartFieldNames,
} from './org-chart-data';
import type {
  AndesOrgChartKey,
  AndesOrgChartLeafLayout,
  AndesOrgChartOrientation,
} from './org-chart-layout';
import {
  AndesOrgChartBadgeTemplate,
  AndesOrgChartConnectorTemplate,
  AndesOrgChartEmptyTemplate,
  AndesOrgChartNodeContext,
  AndesOrgChartNodeTemplate,
  AndesOrgChartToolbarTemplate,
} from './org-chart-templates';

interface Person {
  id: string;
  name: string;
  title?: string;
  avatar?: string;
  color?: string;
  disabled?: boolean;
  readonly?: boolean;
  assistant?: boolean;
  isLeaf?: boolean;
  children?: Person[];
}

function org(): Person {
  return {
    id: 'ceo',
    name: 'Ana Torres',
    title: 'Chief Executive',
    children: [
      { id: 'ea', name: 'Iris Mora', title: 'Assistant', assistant: true },
      {
        id: 'cto',
        name: 'Bruno Díaz',
        title: 'Technology',
        children: [
          {
            id: 'dev1',
            name: 'Carla Ruiz',
            title: 'Engineer',
            children: [{ id: 'intern', name: 'Gael Vera', title: 'Intern' }],
          },
          { id: 'dev2', name: 'Diego Paz', title: 'Engineer' },
        ],
      },
      {
        id: 'cfo',
        name: 'Elena Soto',
        title: 'Finance',
        children: [{ id: 'acc', name: 'Fabio León', title: 'Accountant' }],
      },
    ],
  };
}

/** A person's report by position, failing loudly instead of with a non-null assertion. */
function report(person: Person, ...path: number[]): Person {
  let current = person;
  for (const index of path) {
    const next = current.children?.[index];
    if (!next) {
      throw new Error(`No report at ${path.join('/')}`);
    }
    current = next;
  }
  return current;
}

@Component({
  imports: [AndesOrgChart],
  template: `<andes-org-chart
    aria-label="Company"
    [data]="data()"
    [dataFormat]="dataFormat()"
    [fieldNames]="fieldNames()"
    [orientation]="orientation()"
    [reversed]="reversed()"
    [direction]="direction()"
    [selectionMode]="selectionMode()"
    [(selected)]="selected"
    [(expanded)]="expanded"
    [defaultExpandDepth]="depth()"
    [expandAll]="expandAll()"
    [expandOnClick]="expandOnClick()"
    [search]="search()"
    [secondaryLinks]="links()"
    [loadChildren]="loadChildren()"
    [badge]="badge()"
    [leafLayout]="leafLayout()"
    [levelColors]="levelColors()"
    [nodeClass]="nodeClass()"
    [nodeSize]="nodeSize()"
    [animated]="false"
    [fitOnInit]="fitOnInit()"
    [labels]="{ zoomIn: 'Acercar' }"
    (nodeClick)="clicks.push($event)"
    (nodeDblClick)="dblClicks.push($event)"
    (nodeContextMenu)="menus.push($event)"
    (nodeHover)="hovers.push($event)"
    (nodeExpand)="expands.push($event)"
    (nodeSelect)="selects.push($event)"
    (loadError)="errors.push($event)"
    (viewportChange)="views.push($event)"
  />`,
})
class HostComponent {
  readonly chart = viewChild.required(AndesOrgChart);
  readonly data = signal<Person | readonly Person[]>(org());
  readonly dataFormat = signal<AndesOrgChartDataFormat>('nested');
  readonly fieldNames = signal<AndesOrgChartFieldNames | undefined>(undefined);
  readonly orientation = signal<AndesOrgChartOrientation>('vertical');
  readonly reversed = signal(false);
  readonly direction = signal<'auto' | 'ltr' | 'rtl'>('auto');
  readonly selectionMode = signal<AndesOrgChartSelectionMode>('single');
  readonly selected = signal<readonly AndesOrgChartKey[]>([]);
  readonly expanded = signal<readonly AndesOrgChartKey[] | undefined>(
    undefined,
  );
  readonly depth = signal(2);
  readonly expandAll = signal(false);
  readonly expandOnClick = signal(false);
  readonly search = signal('');
  readonly links = signal<readonly AndesOrgChartSecondaryLink[]>([]);
  readonly loadChildren = signal<AndesOrgChartLoadChildren<Person> | null>(
    null,
  );
  readonly badge = signal<AndesOrgChartBadgeCount>('direct');
  readonly leafLayout = signal<AndesOrgChartLeafLayout>('tree');
  readonly levelColors = signal<readonly string[]>([]);
  readonly nodeClass = signal<string | ((node: Person) => string) | null>(null);
  readonly nodeSize = signal<
    | { width: number; height: number }
    | ((node: Person) => { width: number; height: number })
  >({ width: 200, height: 60 });
  readonly fitOnInit = signal(false);
  readonly clicks: AndesOrgChartNodeEvent<Person>[] = [];
  readonly dblClicks: AndesOrgChartNodeEvent<Person>[] = [];
  readonly menus: AndesOrgChartNodeEvent<Person>[] = [];
  readonly hovers: AndesOrgChartHoverEvent<Person>[] = [];
  readonly expands: AndesOrgChartExpandEvent<Person>[] = [];
  readonly selects: AndesOrgChartSelectEvent<Person>[] = [];
  readonly errors: AndesOrgChartLoadErrorEvent<Person>[] = [];
  readonly views: AndesOrgChartViewport[] = [];
}

interface Setup {
  readonly fixture: ComponentFixture<HostComponent>;
  readonly host: HostComponent;
  readonly el: HTMLElement;
  readonly card: (key: string) => HTMLElement;
  readonly cardOrNull: (key: string) => HTMLElement | null;
  readonly keys: () => string[];
  readonly render: () => void;
}

function setup(
  configure: (host: HostComponent) => void = () => undefined,
): Setup {
  const fixture = TestBed.createComponent(HostComponent);
  const host = fixture.componentInstance;
  configure(host);
  fixture.detectChanges();
  const el = fixture.nativeElement as HTMLElement;
  const cardOrNull = (key: string) =>
    el.querySelector<HTMLElement>(
      `[data-slot="org-chart-node"][data-key="${key}"]`,
    );
  const card = (key: string) => {
    const found = cardOrNull(key);
    if (!found) {
      throw new Error(`No card for ${key}`);
    }
    return found;
  };
  const keys = () =>
    [...el.querySelectorAll<HTMLElement>('[data-slot="org-chart-node"]')].map(
      (node) => node.dataset['key'] as string,
    );
  return {
    fixture,
    host,
    el,
    card,
    cardOrNull,
    keys,
    render: () => fixture.detectChanges(),
  };
}

function key(
  target: Element,
  name: string,
  init: KeyboardEventInit = {},
): KeyboardEvent {
  const event = new KeyboardEvent('keydown', {
    key: name,
    bubbles: true,
    cancelable: true,
    ...init,
  });
  target.dispatchEvent(event);
  return event;
}

function badgeOf(card: HTMLElement): HTMLButtonElement {
  const badge = card.querySelector<HTMLButtonElement>(
    '[data-slot="org-chart-badge"]',
  );
  if (!badge) {
    throw new Error('No badge');
  }
  return badge;
}

function translateOf(element: HTMLElement): { x: number; y: number } {
  const match = /translate\((-?[\d.]+)px, (-?[\d.]+)px\)/.exec(
    element.style.transform,
  );
  if (!match) {
    throw new Error(`No translate in "${element.style.transform}"`);
  }
  return { x: Number(match[1]), y: Number(match[2]) };
}

function canvasView(el: HTMLElement): { x: number; y: number; scale: number } {
  const canvas = el.querySelector<HTMLElement>(
    '[data-slot="org-chart-canvas"]',
  );
  const match =
    /translate\((-?[\d.e-]+)px, (-?[\d.e-]+)px\) scale\(([\d.e-]+)\)/.exec(
      canvas?.style.transform ?? '',
    );
  if (!match) {
    throw new Error(`No canvas transform in "${canvas?.style.transform}"`);
  }
  return { x: Number(match[1]), y: Number(match[2]), scale: Number(match[3]) };
}

const flush = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

/** A `ResizeObserver` the spec drives by hand, so the viewport gets a real size. */
class FakeResizeObserver {
  static all: FakeResizeObserver[] = [];
  readonly targets = new Set<Element>();
  constructor(private readonly callback: ResizeObserverCallback) {
    FakeResizeObserver.all.push(this);
  }
  observe(target: Element): void {
    this.targets.add(target);
  }
  unobserve(target: Element): void {
    this.targets.delete(target);
  }
  disconnect(): void {
    this.targets.clear();
  }
  static resize(width: number, height: number): void {
    for (const observer of FakeResizeObserver.all) {
      const entries = [...observer.targets].map(
        (target) =>
          ({
            target,
            contentRect: { width, height },
            contentBoxSize: [{ inlineSize: width, blockSize: height }],
            borderBoxSize: [{ inlineSize: width, blockSize: height }],
          }) as unknown as ResizeObserverEntry,
      );
      if (entries.length) {
        observer.callback(entries, observer as unknown as ResizeObserver);
      }
    }
  }
}

async function sized(s: Setup, width = 800, height = 600): Promise<void> {
  FakeResizeObserver.resize(width, height);
  await new Promise((resolve) => setTimeout(resolve, 40));
  s.render();
}

describe('AndesOrgChart', () => {
  let restore: (() => void) | null = null;

  beforeEach(() => {
    const previous = (globalThis as { ResizeObserver?: unknown })
      .ResizeObserver;
    FakeResizeObserver.all = [];
    (globalThis as { ResizeObserver?: unknown }).ResizeObserver =
      FakeResizeObserver;
    restore = () => {
      (globalThis as { ResizeObserver?: unknown }).ResizeObserver = previous;
    };
  });

  afterEach(() => restore?.());

  describe('rendering and data', () => {
    it('renders one tree item per visible person, three levels by default', () => {
      const { el, keys } = setup();
      expect(
        el.querySelector('[role="tree"]')?.getAttribute('aria-label'),
      ).toBe('Company');
      expect(keys()).toEqual([
        'ceo',
        'ea',
        'cto',
        'dev1',
        'dev2',
        'cfo',
        'acc',
      ]);
    });

    it('keeps the host free of the label, which belongs to the tree', () => {
      const { el } = setup();
      const host = el.querySelector('andes-org-chart') as HTMLElement;
      expect(host.getAttribute('aria-label')).toBeNull();
    });

    it('shows the name, the role and initials on the default card', () => {
      const { card } = setup();
      const ceo = card('ceo');
      expect(
        ceo.querySelector('[data-slot="org-chart-name"]')?.textContent?.trim(),
      ).toBe('Ana Torres');
      expect(
        ceo.querySelector('[data-slot="org-chart-title"]')?.textContent?.trim(),
      ).toBe('Chief Executive');
      expect(
        ceo
          .querySelector('[data-slot="org-chart-avatar"]')
          ?.textContent?.trim(),
      ).toBe('AT');
    });

    it('shows a photo when there is one and falls back to initials when it fails', () => {
      const s = setup((host) => {
        const data = org();
        data.avatar = 'https://example.test/ana.png';
        host.data.set(data);
      });
      const image = s.card('ceo').querySelector('img');
      expect(image?.getAttribute('src')).toBe('https://example.test/ana.png');
      expect(image?.getAttribute('alt')).toBe('');
      image?.dispatchEvent(new Event('error'));
      s.render();
      expect(s.card('ceo').querySelector('img')).toBeNull();
      expect(
        s
          .card('ceo')
          .querySelector('[data-slot="org-chart-avatar"]')
          ?.textContent?.trim(),
      ).toBe('AT');
    });

    it('makes initials from the first and last word', () => {
      expect(andesOrgChartInitials('maría del carmen')).toBe('MC');
      expect(andesOrgChartInitials('  Prince ')).toBe('P');
      expect(andesOrgChartInitials('')).toBe('');
    });

    it('reads any data shape through fieldNames', () => {
      const s = setup((host) => {
        host.fieldNames.set({
          id: 'code',
          name: 'label',
          title: 'role',
          children: 'reports',
        });
        host.data.set({
          code: 1,
          label: 'Root Person',
          role: 'Boss',
          reports: [{ code: 2, label: 'Report One', role: 'Staff' }],
        } as unknown as Person);
      });
      expect(s.keys()).toEqual(['1', '2']);
      expect(s.card('2').textContent).toContain('Report One');
      expect(s.card('2').textContent).toContain('Staff');
    });

    it('reads flat rows with dataFormat="flat"', () => {
      const s = setup((host) => {
        host.dataFormat.set('flat');
        host.data.set([
          { id: 'b', parentId: 'a', name: 'Second' },
          { id: 'a', parentId: null, name: 'First' },
          { id: 'c', parentId: 'a', name: 'Third' },
        ] as unknown as Person[]);
      });
      expect(s.keys()).toEqual(['a', 'b', 'c']);
      expect(s.card('b').getAttribute('aria-level')).toBe('2');
    });

    it('turns flat rows into nested items with andesOrgChartFromFlat', () => {
      const nested = andesOrgChartFromFlat([
        { id: 1, parentId: null, name: 'Root' },
        { id: 2, parentId: 1, name: 'Child' },
        { id: 3, parentId: 99, name: 'Orphan' },
        { id: 4, parentId: 5, name: 'Loop A' },
        { id: 5, parentId: 4, name: 'Loop B' },
      ]);
      expect(nested.map((item) => item.name)).toEqual([
        'Root',
        'Orphan',
        'Loop A',
      ]);
      const children = (index: number) =>
        (nested[index] as unknown as { children: { name: string }[] }).children;
      expect(children(0)[0].name).toBe('Child');
      expect(children(2)[0].name).toBe('Loop B');
    });

    it('skips items without a key and repeated keys', () => {
      const s = setup((host) =>
        host.data.set([
          {
            id: 'a',
            name: 'A',
            children: [{ name: 'no key' }, { id: 'a', name: 'dup' }],
          },
        ] as unknown as Person[]),
      );
      expect(s.keys()).toEqual(['a']);
    });

    it('sizes cards with a fixed size or a function', () => {
      const s = setup((host) =>
        host.nodeSize.set((person) =>
          person.id === 'ceo'
            ? { width: 300, height: 90 }
            : { width: 120, height: 50 },
        ),
      );
      expect(s.card('ceo').style.width).toBe('300px');
      expect(s.card('ceo').style.height).toBe('90px');
      expect(s.card('cto').style.width).toBe('120px');
    });

    it('places reports below their manager, or beside it when horizontal', () => {
      const s = setup();
      expect(translateOf(s.card('cto')).y).toBeGreaterThan(
        translateOf(s.card('ceo')).y,
      );
      s.host.orientation.set('horizontal');
      s.render();
      const host = s.el.querySelector('andes-org-chart') as HTMLElement;
      expect(host.dataset['orientation']).toBe('horizontal');
      expect(host.dataset['childrenSide']).toBe('right');
      expect(translateOf(s.card('cto')).x).toBeGreaterThan(
        translateOf(s.card('ceo')).x,
      );
    });

    it('mirrors the chart in a right-to-left direction', () => {
      const s = setup((host) => host.direction.set('rtl'));
      const host = s.el.querySelector('andes-org-chart') as HTMLElement;
      expect(host.dataset['direction']).toBe('rtl');
      expect(translateOf(s.card('cto')).x).toBeGreaterThan(
        translateOf(s.card('cfo')).x,
      );
      s.host.orientation.set('horizontal');
      s.render();
      expect(host.dataset['childrenSide']).toBe('left');
      expect(translateOf(s.card('cto')).x).toBeLessThan(
        translateOf(s.card('ceo')).x,
      );
    });

    it('follows the closest dir attribute when the direction is auto', async () => {
      const wrapper = document.createElement('div');
      wrapper.setAttribute('dir', 'rtl');
      document.body.append(wrapper);
      const fixture = TestBed.createComponent(HostComponent);
      wrapper.append(fixture.nativeElement);
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
      const host = (fixture.nativeElement as HTMLElement).querySelector(
        'andes-org-chart',
      ) as HTMLElement;
      expect(host.dataset['direction']).toBe('rtl');
      wrapper.remove();
    });

    it('puts the reports above when reversed', () => {
      const s = setup((host) => host.reversed.set(true));
      expect(translateOf(s.card('cto')).y).toBeLessThan(
        translateOf(s.card('ceo')).y,
      );
      expect(
        (s.el.querySelector('andes-org-chart') as HTMLElement).dataset[
          'childrenSide'
        ],
      ).toBe('top');
    });

    it('marks root, branch and leaf cards and assistants', () => {
      const { card } = setup();
      expect(card('ceo').dataset['kind']).toBe('root');
      expect(card('cto').dataset['kind']).toBe('branch');
      expect(card('dev2').dataset['kind']).toBe('leaf');
      expect(card('ea').hasAttribute('data-assistant')).toBe(true);
    });

    it('stacks all-leaf teams with leafLayout', () => {
      const s = setup((host) => {
        const data = org();
        report(data, 2).children?.push({ id: 'acc2', name: 'Gina Ramos' });
        host.data.set(data);
        host.leafLayout.set('hanging');
      });
      const kinds = [
        ...s.el.querySelectorAll<HTMLElement>('[data-slot="org-chart-link"]'),
      ]
        .filter((link) => link.dataset['from'] === 'cfo')
        .map((link) => link.dataset['kind']);
      expect(kinds).toEqual(['stack', 'stack']);
    });

    it('paints the accent from the node color, else from levelColors', () => {
      const s = setup((host) => {
        const data = org();
        report(data, 1).color = 'rgb(1, 2, 3)';
        host.data.set(data);
        host.levelColors.set(['red', 'blue']);
      });
      const accent = (k: string) =>
        s.card(k).style.getPropertyValue('--andes-org-chart-node-accent');
      expect(accent('cto')).toBe('rgb(1, 2, 3)');
      expect(accent('ceo')).toBe('red');
      expect(accent('cfo')).toBe('blue');
      expect(accent('acc')).toBe('red');
    });

    it('adds nodeClass, as a string or per item', () => {
      const s = setup((host) => host.nodeClass.set('person'));
      expect(s.card('ceo').classList).toContain('person');
      expect(s.card('ceo').classList).toContain('andes-org-chart__node');
      s.host.nodeClass.set((person) => (person.id === 'cto' ? 'tech' : ''));
      s.render();
      expect(s.card('cto').classList).toContain('tech');
      expect(s.card('ceo').classList).not.toContain('tech');
    });

    it('draws one connector per visible manager and report', () => {
      const s = setup();
      const links = s.el.querySelectorAll('[data-slot="org-chart-link"]');
      expect(links).toHaveLength(6);
      const assistant = s.el.querySelector<HTMLElement>(
        '[data-slot="org-chart-link"][data-to="ea"]',
      );
      expect(assistant?.dataset['kind']).toBe('assistant');
      expect(assistant?.querySelector('path')?.getAttribute('d')).toMatch(/^M/);
      expect(
        s.el
          .querySelector('[data-slot="org-chart-links"]')
          ?.getAttribute('aria-hidden'),
      ).toBe('true');
    });

    it('draws secondary links only while both ends are visible', () => {
      const s = setup((host) =>
        host.links.set([
          { from: 'dev2', to: 'acc', label: 'Works with' },
          { from: 'intern', to: 'acc' },
        ]),
      );
      const secondary = () =>
        s.el.querySelectorAll('[data-slot="org-chart-secondary-link"]');
      expect(secondary()).toHaveLength(1);
      expect(secondary()[0].querySelector('title')?.textContent).toBe(
        'Works with',
      );
      s.host.chart().expandPath('intern');
      s.render();
      expect(secondary()).toHaveLength(2);
    });

    it('shows the empty text, the labels override, or the empty template', () => {
      const s = setup((host) => host.data.set([]));
      expect(
        s.el
          .querySelector('[data-slot="org-chart-empty"]')
          ?.textContent?.trim(),
      ).toBe('No data');
      expect(s.el.querySelector('[role="tree"]')).toBeNull();
      expect(s.el.querySelector('[data-slot="org-chart-controls"]')).toBeNull();
    });
  });

  describe('accessibility', () => {
    it('exposes level, position, set size and expansion', () => {
      const { card } = setup();
      expect(card('ceo').getAttribute('role')).toBe('treeitem');
      expect(card('ceo').getAttribute('aria-level')).toBe('1');
      expect(card('cto').getAttribute('aria-level')).toBe('2');
      expect(card('cto').getAttribute('aria-posinset')).toBe('2');
      expect(card('cto').getAttribute('aria-setsize')).toBe('3');
      expect(card('cto').getAttribute('aria-expanded')).toBe('true');
      expect(card('dev1').getAttribute('aria-expanded')).toBe('false');
      expect(card('dev2').hasAttribute('aria-expanded')).toBe(false);
    });

    it('exposes selection only when nodes can be selected', () => {
      const s = setup();
      expect(s.card('ceo').getAttribute('aria-selected')).toBe('false');
      expect(
        s.el
          .querySelector('[role="tree"]')
          ?.hasAttribute('aria-multiselectable'),
      ).toBe(false);
      s.host.selectionMode.set('multiple');
      s.render();
      expect(
        s.el
          .querySelector('[role="tree"]')
          ?.getAttribute('aria-multiselectable'),
      ).toBe('true');
      s.host.selectionMode.set('none');
      s.render();
      expect(s.card('ceo').hasAttribute('aria-selected')).toBe(false);
    });

    it('has exactly one tab stop, on the first card', () => {
      const { el, card } = setup();
      const stops = [...el.querySelectorAll('[role="treeitem"]')].filter(
        (node) => node.getAttribute('tabindex') === '0',
      );
      expect(stops).toEqual([card('ceo')]);
    });

    it('hides the badge from assistive technology and the tab order', () => {
      const { card } = setup();
      const badge = badgeOf(card('cto'));
      expect(badge.getAttribute('aria-hidden')).toBe('true');
      expect(badge.getAttribute('tabindex')).toBe('-1');
      expect(badge.getAttribute('type')).toBe('button');
    });

    it('labels the zoom controls, with translatable texts', () => {
      const { el } = setup();
      const group = el.querySelector('[data-slot="org-chart-controls"]');
      expect(group?.getAttribute('role')).toBe('group');
      expect(group?.getAttribute('aria-label')).toBe('Chart view');
      const labels = [...(group?.querySelectorAll('button') ?? [])].map(
        (button) => button.getAttribute('aria-label'),
      );
      expect(labels).toEqual([
        'Acercar',
        'Zoom out',
        'Fit to view',
        'Reset view',
      ]);
    });

    it('marks disabled people as disabled', () => {
      const s = setup((host) => {
        const data = org();
        report(data, 2).disabled = true;
        host.data.set(data);
      });
      expect(s.card('cfo').getAttribute('aria-disabled')).toBe('true');
      expect(s.card('cfo').hasAttribute('data-disabled')).toBe(true);
    });
  });

  describe('keyboard', () => {
    function focused(): string | undefined {
      return (document.activeElement as HTMLElement | null)?.dataset['key'];
    }

    function start(configure?: (host: HostComponent) => void): Setup {
      const s = setup(configure);
      document.body.append(s.el);
      s.card('ceo').focus();
      return s;
    }

    afterEach(() => {
      document.body.innerHTML = '';
    });

    it('moves through the cards in reading order with Up and Down', () => {
      const s = start();
      key(s.card('ceo'), 'ArrowDown');
      expect(focused()).toBe('ea');
      key(s.card('ea'), 'ArrowDown');
      expect(focused()).toBe('cto');
      key(s.card('cto'), 'ArrowDown');
      expect(focused()).toBe('dev1');
      key(s.card('dev1'), 'ArrowUp');
      expect(focused()).toBe('cto');
    });

    it('moves the single tab stop with focus', () => {
      const s = start();
      key(s.card('ceo'), 'ArrowDown');
      s.render();
      expect(s.card('ea').getAttribute('tabindex')).toBe('0');
      expect(s.card('ceo').getAttribute('tabindex')).toBe('-1');
    });

    it('jumps to the first and last card with Home and End', () => {
      const s = start();
      key(s.card('ceo'), 'End');
      expect(focused()).toBe('acc');
      key(s.card('acc'), 'Home');
      expect(focused()).toBe('ceo');
    });

    it('expands with Right, enters the first report, and goes back with Left', () => {
      const s = start();
      s.card('dev1').focus();
      key(s.card('dev1'), 'ArrowRight');
      s.render();
      expect(s.card('dev1').getAttribute('aria-expanded')).toBe('true');
      expect(s.cardOrNull('intern')).not.toBeNull();
      key(s.card('dev1'), 'ArrowRight');
      expect(focused()).toBe('intern');
      key(s.card('intern'), 'ArrowLeft');
      expect(focused()).toBe('dev1');
      key(s.card('dev1'), 'ArrowLeft');
      s.render();
      expect(s.card('dev1').getAttribute('aria-expanded')).toBe('false');
      expect(s.cardOrNull('intern')).toBeNull();
      expect(s.host.expands.map((e) => [e.node.key, e.expanded])).toEqual([
        ['dev1', true],
        ['dev1', false],
      ]);
    });

    it('swaps Left and Right in a right-to-left chart', () => {
      const s = start((host) => host.direction.set('rtl'));
      s.card('dev1').focus();
      key(s.card('dev1'), 'ArrowLeft');
      s.render();
      expect(s.card('dev1').getAttribute('aria-expanded')).toBe('true');
    });

    it('expands and collapses with Alt+Down and Alt+Up', () => {
      const s = start();
      s.card('cto').focus();
      const up = key(s.card('cto'), 'ArrowUp', { altKey: true });
      s.render();
      expect(up.defaultPrevented).toBe(true);
      expect(s.card('cto').getAttribute('aria-expanded')).toBe('false');
      expect(focused()).toBe('cto');
      key(s.card('cto'), 'ArrowDown', { altKey: true });
      s.render();
      expect(s.card('cto').getAttribute('aria-expanded')).toBe('true');
    });

    it('selects with Enter and Space and reports a click', () => {
      const s = start();
      s.card('cto').focus();
      key(s.card('cto'), 'Enter');
      s.render();
      expect(s.host.selected()).toEqual(['cto']);
      expect(s.host.clicks.map((e) => e.node.key)).toEqual(['cto']);
      s.card('cfo').focus();
      const space = key(s.card('cfo'), ' ');
      s.render();
      expect(space.defaultPrevented).toBe(true);
      expect(s.host.selected()).toEqual(['cfo']);
      expect(s.card('cfo').getAttribute('aria-selected')).toBe('true');
    });

    it('toggles with Enter when nothing can be selected', () => {
      const s = start((host) => host.selectionMode.set('none'));
      s.card('cto').focus();
      key(s.card('cto'), 'Enter');
      s.render();
      expect(s.card('cto').getAttribute('aria-expanded')).toBe('false');
    });

    it('jumps to a card by typing its name', () => {
      const s = start();
      key(s.card('ceo'), 'e');
      expect(focused()).toBe('cfo');
    });

    it('expands every sibling with *', () => {
      const s = start();
      s.card('dev1').focus();
      key(s.card('dev1'), '*');
      s.render();
      expect(s.card('dev1').getAttribute('aria-expanded')).toBe('true');
    });

    it('zooms with + and - and fits with 0', async () => {
      const s = start();
      await sized(s);
      key(s.card('ceo'), '+');
      s.render();
      expect(canvasView(s.el).scale).toBeCloseTo(1.25, 5);
      key(s.card('ceo'), '-');
      key(s.card('ceo'), '-');
      s.render();
      expect(canvasView(s.el).scale).toBeCloseTo(0.8, 5);
      key(s.card('ceo'), '0');
      s.render();
      expect(s.host.views.length).toBeGreaterThan(2);
    });

    it('leaves keys typed into a control inside a card alone', () => {
      @Component({
        imports: [AndesOrgChart, AndesOrgChartNodeTemplate],
        template: `<andes-org-chart [data]="data" [animated]="false">
          <ng-template andesOrgChartNode let-person
            ><input [attr.aria-label]="person.name"
          /></ng-template>
        </andes-org-chart>`,
      })
      class InputHost {
        readonly data = org();
      }
      const fixture = TestBed.createComponent(InputHost);
      fixture.detectChanges();
      document.body.append(fixture.nativeElement);
      const input = (fixture.nativeElement as HTMLElement).querySelector(
        'input',
      ) as HTMLInputElement;
      input.focus();
      const event = key(input, 'ArrowDown');
      expect(event.defaultPrevented).toBe(false);
      expect(document.activeElement).toBe(input);
    });
  });

  describe('pointer events and selection', () => {
    it('selects a card on click and reports click and select', () => {
      const s = setup();
      s.card('cto').click();
      s.render();
      expect(s.host.selected()).toEqual(['cto']);
      expect(s.card('cto').hasAttribute('data-selected')).toBe(true);
      expect(s.host.clicks[0].node.key).toBe('cto');
      expect(s.host.clicks[0].node.data.name).toBe('Bruno Díaz');
      expect(s.host.selects.map((e) => [e.node.key, e.selected])).toEqual([
        ['cto', true],
      ]);
      s.card('cfo').click();
      s.render();
      expect(s.host.selected()).toEqual(['cfo']);
    });

    it('deselects with Ctrl+click in single mode', () => {
      const s = setup((host) => host.selected.set(['cto']));
      s.card('cto').dispatchEvent(
        new MouseEvent('click', { bubbles: true, ctrlKey: true }),
      );
      s.render();
      expect(s.host.selected()).toEqual([]);
    });

    it('toggles cards in multiple mode', () => {
      const s = setup((host) => host.selectionMode.set('multiple'));
      s.card('cto').click();
      s.card('cfo').click();
      s.render();
      expect(s.host.selected()).toEqual(['cto', 'cfo']);
      s.card('cto').click();
      s.render();
      expect(s.host.selected()).toEqual(['cfo']);
    });

    it('selects nothing in none mode but still reports clicks', () => {
      const s = setup((host) => host.selectionMode.set('none'));
      s.card('cto').click();
      s.render();
      expect(s.host.selected()).toEqual([]);
      expect(s.host.clicks).toHaveLength(1);
    });

    it('follows a bound selection', () => {
      const s = setup();
      s.host.selected.set(['acc']);
      s.render();
      expect(s.card('acc').getAttribute('aria-selected')).toBe('true');
    });

    it('never selects disabled or read-only people', () => {
      const s = setup((host) => {
        const data = org();
        report(data, 1).disabled = true;
        report(data, 2).readonly = true;
        host.data.set(data);
      });
      s.card('cto').click();
      s.card('cfo').click();
      s.render();
      expect(s.host.selected()).toEqual([]);
      expect(s.host.clicks.map((e) => e.node.key)).toEqual(['cfo']);
    });

    it('reports double clicks, context menus and hovering', () => {
      const s = setup();
      s.card('cto').dispatchEvent(
        new MouseEvent('dblclick', { bubbles: true }),
      );
      s.card('cto').dispatchEvent(
        new MouseEvent('contextmenu', { bubbles: true }),
      );
      s.card('cto').dispatchEvent(new Event('pointerenter'));
      s.card('cto').dispatchEvent(new Event('pointerleave'));
      expect(s.host.dblClicks.map((e) => e.node.key)).toEqual(['cto']);
      expect(s.host.menus.map((e) => e.node.key)).toEqual(['cto']);
      expect(s.host.hovers.map((e) => [e.node.key, e.hovered])).toEqual([
        ['cto', true],
        ['cto', false],
      ]);
    });

    it('expands and collapses with the badge, without selecting', () => {
      const s = setup();
      badgeOf(s.card('cto')).click();
      s.render();
      expect(s.cardOrNull('dev1')).toBeNull();
      expect(s.host.expanded()).not.toContain('cto');
      expect(s.host.selected()).toEqual([]);
      expect(s.host.expands.map((e) => [e.node.key, e.expanded])).toEqual([
        ['cto', false],
      ]);
      badgeOf(s.card('cto')).click();
      s.render();
      expect(s.cardOrNull('dev1')).not.toBeNull();
    });

    it('counts direct reports, everyone below, or nothing in the badge', () => {
      const s = setup();
      const count = () =>
        badgeOf(s.card('cto')).textContent?.replace(/\s+/g, '').trim() ?? '';
      expect(count()).toBe('2');
      s.host.badge.set('total');
      s.render();
      expect(count()).toBe('3');
      s.host.badge.set('none');
      s.render();
      expect(count()).toBe('');
    });

    it('also toggles on card click with expandOnClick', () => {
      const s = setup((host) => host.expandOnClick.set(true));
      s.card('cto').click();
      s.render();
      expect(s.card('cto').getAttribute('aria-expanded')).toBe('false');
    });

    it('ignores clicks on a disabled card', () => {
      const s = setup((host) => {
        const data = org();
        report(data, 1).disabled = true;
        host.data.set(data);
      });
      s.card('cto').click();
      badgeOf(s.card('cto')).click();
      s.render();
      expect(s.host.clicks).toEqual([]);
      expect(s.card('cto').getAttribute('aria-expanded')).toBe('true');
    });
  });

  describe('expansion state', () => {
    it('starts from defaultExpandDepth', () => {
      const s = setup((host) => host.depth.set(1));
      expect(s.keys()).toEqual(['ceo', 'ea', 'cto', 'cfo']);
      expect(s.host.expanded()).toEqual(['ceo']);
    });

    it('starts with everything open with expandAll', () => {
      const s = setup((host) => host.expandAll.set(true));
      expect(s.keys()).toContain('intern');
    });

    it('starts from a bound expanded list and follows it', () => {
      const s = setup((host) => host.expanded.set(['ceo', 'cfo']));
      expect(s.keys()).toEqual(['ceo', 'ea', 'cto', 'cfo', 'acc']);
      s.host.expanded.set(['ceo']);
      s.render();
      expect(s.keys()).toEqual(['ceo', 'ea', 'cto', 'cfo']);
    });

    it('expands the path to a node, collapses all and expands all', () => {
      const s = setup((host) => host.depth.set(0));
      expect(s.keys()).toEqual(['ceo']);
      s.host.chart().expandPath('intern');
      s.render();
      expect(s.keys()).toContain('intern');
      s.host.chart().collapseAll();
      s.render();
      expect(s.keys()).toEqual(['ceo']);
      s.host.chart().expandAllNodes();
      s.render();
      expect(s.keys()).toHaveLength(8);
      s.host.chart().collapse('cto');
      s.render();
      expect(s.cardOrNull('dev1')).toBeNull();
      s.host.chart().expand('cto');
      s.render();
      expect(s.cardOrNull('dev1')).not.toBeNull();
    });
  });

  describe('dynamic data', () => {
    it('adds a new report and opens a manager who just got one', () => {
      const s = setup();
      const data = org();
      report(data, 2, 0).children = [{ id: 'new', name: 'New Hire' }];
      s.host.data.set(data);
      s.render();
      expect(s.cardOrNull('new')).not.toBeNull();
      expect(s.card('acc').getAttribute('aria-expanded')).toBe('true');
    });

    it('removes people that left and keeps the rest of the state', () => {
      const s = setup((host) => host.selected.set(['cfo']));
      const data = org();
      data.children = (data.children ?? []).filter(
        (child) => child.id !== 'cto',
      );
      s.host.data.set(data);
      s.render();
      expect(s.cardOrNull('cto')).toBeNull();
      expect(s.cardOrNull('dev1')).toBeNull();
      expect(s.card('cfo').getAttribute('aria-selected')).toBe('true');
      expect(s.card('cfo').getAttribute('aria-posinset')).toBe('2');
    });

    it('updates a card in place when its data changes', () => {
      const s = setup();
      const before = s.card('cto');
      const data = org();
      report(data, 1).title = 'Chief Technology Officer';
      s.host.data.set(data);
      s.render();
      expect(s.card('cto')).toBe(before);
      expect(before.textContent).toContain('Chief Technology Officer');
    });

    it('moves cards when their position changes', () => {
      const s = setup();
      const before = translateOf(s.card('cfo'));
      s.host.chart().collapse('cto');
      s.render();
      expect(translateOf(s.card('cfo'))).not.toEqual(before);
    });
  });

  describe('async loading', () => {
    function lazyOrg(): Person {
      return {
        id: 'root',
        name: 'Root',
        children: [
          { id: 'team', name: 'Team Lead' },
          { id: 'solo', name: 'Solo', isLeaf: true },
        ],
      };
    }

    it('loads reports on first expand and shows the loading state', async () => {
      let resolve: (value: Person[]) => void = () => undefined;
      const calls: string[] = [];
      const s = setup((host) => {
        host.data.set(lazyOrg());
        host.loadChildren.set((person) => {
          calls.push(person.id);
          return new Promise<Person[]>((done) => (resolve = done));
        });
      });
      expect(s.card('team').getAttribute('aria-expanded')).toBe('false');
      expect(s.card('solo').hasAttribute('aria-expanded')).toBe(false);
      badgeOf(s.card('team')).click();
      s.render();
      expect(calls).toEqual(['team']);
      expect(s.card('team').getAttribute('aria-busy')).toBe('true');
      expect(badgeOf(s.card('team')).hasAttribute('data-loading')).toBe(true);
      resolve([{ id: 'm1', name: 'Member One' }]);
      await flush();
      s.render();
      expect(s.card('team').hasAttribute('aria-busy')).toBe(false);
      expect(s.cardOrNull('m1')).not.toBeNull();
      badgeOf(s.card('team')).click();
      badgeOf(s.card('team')).click();
      expect(calls).toEqual(['team']);
    });

    it('accepts an observable-like result and a plain array', async () => {
      const s = setup((host) => {
        host.data.set(lazyOrg());
        host.loadChildren.set((person) =>
          person.id === 'team'
            ? {
                subscribe(observer) {
                  observer.next?.([{ id: 'o1', name: 'From stream' }]);
                  return { unsubscribe: () => undefined };
                },
              }
            : [{ id: 'a1', name: 'From array' }],
        );
      });
      s.host.chart().expand('team');
      s.render();
      expect(s.cardOrNull('o1')).not.toBeNull();
    });

    it('shows no count on a team that has not been loaded yet', () => {
      const s = setup((host) => {
        host.data.set(lazyOrg());
        host.loadChildren.set(() => Promise.resolve([]));
      });
      expect(badgeOf(s.card('team')).textContent?.trim()).toBe('');
      expect(badgeOf(s.card('team')).querySelector('svg')).not.toBeNull();
    });

    it('collapses again and reports a failed load', async () => {
      const s = setup((host) => {
        host.data.set(lazyOrg());
        host.loadChildren.set(() => Promise.reject(new Error('offline')));
      });
      badgeOf(s.card('team')).click();
      await flush();
      s.render();
      expect(s.card('team').getAttribute('aria-expanded')).toBe('false');
      expect(
        s.host.errors.map((e) => [e.node.key, (e.error as Error).message]),
      ).toEqual([['team', 'offline']]);
    });

    it('treats an empty result as a person without reports', async () => {
      const s = setup((host) => {
        host.data.set(lazyOrg());
        host.loadChildren.set(() => Promise.resolve([]));
      });
      badgeOf(s.card('team')).click();
      await flush();
      s.render();
      expect(s.card('team').hasAttribute('aria-expanded')).toBe(false);
      expect(
        s.card('team').querySelector('[data-slot="org-chart-badge"]'),
      ).toBeNull();
    });
  });

  describe('search', () => {
    it('marks matches, lights their path and dims everyone else', () => {
      const s = setup((host) => host.search.set('diego'));
      expect(s.card('dev2').hasAttribute('data-matched')).toBe(true);
      expect(s.card('cto').hasAttribute('data-highlighted')).toBe(true);
      expect(s.card('ceo').hasAttribute('data-highlighted')).toBe(true);
      expect(s.card('cfo').hasAttribute('data-dimmed')).toBe(true);
      expect(s.card('dev2').hasAttribute('data-dimmed')).toBe(false);
      const lit = [
        ...s.el.querySelectorAll<HTMLElement>(
          '[data-slot="org-chart-link"][data-highlighted]',
        ),
      ].map((link) => `${link.dataset['from']}>${link.dataset['to']}`);
      expect(lit).toEqual(['ceo>cto', 'cto>dev2']);
      expect(s.host.chart().matchedKeys()).toEqual(['dev2']);
    });

    it('ignores case and accents and also matches the role', () => {
      const s = setup((host) => host.search.set('DIAZ'));
      expect(s.host.chart().matchedKeys()).toEqual(['cto']);
      s.host.search.set('engineer');
      s.render();
      expect(s.host.chart().matchedKeys()).toEqual(['dev1', 'dev2']);
    });

    it('opens the way to hidden matches', () => {
      const s = setup((host) => host.depth.set(0));
      s.host.search.set('gael');
      s.render();
      expect(s.card('intern').hasAttribute('data-matched')).toBe(true);
    });

    it('clears every mark when the query is empty', () => {
      const s = setup((host) => host.search.set('ana'));
      s.host.search.set('');
      s.render();
      expect(
        s.el.querySelector('[data-dimmed], [data-matched], [data-highlighted]'),
      ).toBeNull();
    });
  });

  describe('view', () => {
    it('fits the chart into the viewport once it has a size', async () => {
      const s = setup((host) => host.fitOnInit.set(true));
      await sized(s, 400, 300);
      const view = canvasView(s.el);
      expect(view.scale).toBeLessThan(1);
      expect(view.scale).toBeGreaterThanOrEqual(0.1);
      expect(s.host.views.length).toBeGreaterThan(0);
    });

    it('zooms with the controls within the scale extent', async () => {
      const s = setup();
      await sized(s);
      const [zoomIn, zoomOut] = [
        ...s.el.querySelectorAll<HTMLButtonElement>(
          '[data-slot="org-chart-controls"] button',
        ),
      ];
      zoomIn.click();
      s.render();
      expect(canvasView(s.el).scale).toBeCloseTo(1.25, 5);
      expect(
        s.el.querySelector('[data-slot="org-chart-zoom"]')?.textContent?.trim(),
      ).toBe('125%');
      for (let index = 0; index < 10; index++) {
        s.host.chart().zoomIn();
      }
      s.render();
      expect(canvasView(s.el).scale).toBe(2);
      expect(zoomIn.disabled).toBe(true);
      zoomOut.click();
      s.render();
      expect(canvasView(s.el).scale).toBeCloseTo(1.6, 5);
    });

    it('zooms around the viewport center', async () => {
      const s = setup();
      await sized(s, 800, 600);
      const before = canvasView(s.el);
      s.host.chart().zoomTo(2);
      s.render();
      expect(canvasView(s.el)).toMatchObject({
        x: 400 - (400 - before.x) * 2,
        y: 300 - (300 - before.y) * 2,
        scale: 2,
      });
    });

    it('resets to 100% with the root at the top center', async () => {
      const s = setup();
      await sized(s, 800, 600);
      s.host.chart().zoomTo(0.5);
      s.host.chart().resetView();
      s.render();
      const view = canvasView(s.el);
      expect(view.scale).toBe(1);
      const root = translateOf(s.card('ceo'));
      expect(root.x + view.x + 100).toBeCloseTo(400, 5);
      expect(root.y + view.y).toBeCloseTo(32, 5);
    });

    it('centers a node with scrollToNode and can select it', async () => {
      const s = setup((host) => host.depth.set(0));
      await sized(s, 800, 600);
      s.host.chart().scrollToNode('intern', { select: true, animate: false });
      s.render();
      const view = canvasView(s.el);
      const intern = translateOf(s.card('intern'));
      expect(intern.x + view.x + 100).toBeCloseTo(400, 5);
      expect(intern.y + view.y + 30).toBeCloseTo(300, 5);
      expect(s.host.selected()).toEqual(['intern']);
    });

    it('zooms with the wheel around the pointer, or pans in pan mode', async () => {
      const s = setup();
      await sized(s);
      const viewport = s.el.querySelector(
        '[data-slot="org-chart-viewport"]',
      ) as HTMLElement;
      const wheel = new WheelEvent('wheel', {
        deltaY: -100,
        clientX: 0,
        clientY: 0,
        bubbles: true,
        cancelable: true,
      });
      viewport.dispatchEvent(wheel);
      s.render();
      expect(wheel.defaultPrevented).toBe(true);
      expect(canvasView(s.el).scale).toBeGreaterThan(1);
    });

    it('pans when dragging and swallows the click that ends the drag', async () => {
      const s = setup();
      await sized(s);
      const viewport = s.el.querySelector(
        '[data-slot="org-chart-viewport"]',
      ) as HTMLElement;
      const before = canvasView(s.el);
      const pointer = (type: string, x: number, y: number, target: Element) =>
        target.dispatchEvent(
          Object.assign(
            new MouseEvent(type, { bubbles: true, clientX: x, clientY: y }),
            {
              pointerId: 1,
              pointerType: 'mouse',
            },
          ),
        );
      pointer('pointerdown', 10, 10, s.card('cto'));
      pointer('pointermove', 60, 40, viewport);
      pointer('pointerup', 60, 40, viewport);
      s.card('cto').click();
      s.render();
      const after = canvasView(s.el);
      expect(after.x - before.x).toBe(50);
      expect(after.y - before.y).toBe(30);
      expect(s.host.selected()).toEqual([]);
    });

    it('keeps a card still on screen while its own team opens or closes', async () => {
      const s = setup();
      await sized(s);
      const onScreen = (k: string) => {
        const view = canvasView(s.el);
        const card = translateOf(s.card(k));
        return {
          x: card.x * view.scale + view.x,
          y: card.y * view.scale + view.y,
        };
      };
      const before = onScreen('cto');
      badgeOf(s.card('cto')).click();
      s.render();
      expect(onScreen('cto').x).toBeCloseTo(before.x, 5);
      expect(onScreen('cto').y).toBeCloseTo(before.y, 5);
    });

    it('exports the chart as a standalone SVG', () => {
      const s = setup();
      const svg = s.host.chart().exportSvg();
      expect(svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg"')).toBe(
        true,
      );
      expect(svg).toContain('Ana Torres');
      expect(svg.match(/<rect /g)?.length).toBeGreaterThanOrEqual(7);
      expect(svg).toContain('<path d="M');
    });
  });

  describe('templates', () => {
    @Component({
      imports: [
        AndesOrgChart,
        AndesOrgChartNodeTemplate,
        AndesOrgChartBadgeTemplate,
        AndesOrgChartToolbarTemplate,
        AndesOrgChartConnectorTemplate,
      ],
      template: `<andes-org-chart
        [data]="data"
        [animated]="false"
        [search]="'Bruno'"
      >
        <ng-template
          andesOrgChartNode
          let-person
          let-level="level"
          let-matched="matched"
          let-toggle="toggle"
        >
          <span class="custom"
            >{{ person.name }} L{{ level }}{{ matched ? ' *' : '' }}</span
          >
          <button type="button" class="custom-toggle" (click)="toggle()">
            toggle
          </button>
        </ng-template>
        <ng-template andesOrgChartBadge let-total="descendantCount"
          >({{ total }})</ng-template
        >
        <ng-template andesOrgChartToolbar let-chart>
          <button type="button" class="tool" (click)="chart.collapseAll()">
            collapse
          </button>
        </ng-template>
        <ng-template andesOrgChartConnector let-d let-kind="kind">
          <svg:path class="custom-link" [attr.d]="d" [attr.data-kind]="kind" />
        </ng-template>
      </andes-org-chart>`,
    })
    class TemplateHost {
      readonly data = org();
    }

    it('renders the node, badge, toolbar and connector templates with their context', () => {
      const fixture = TestBed.createComponent(TemplateHost);
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;
      const cto = el.querySelector('[data-key="cto"]') as HTMLElement;
      expect(cto.querySelector('.custom')?.textContent).toBe('Bruno Díaz L2 *');
      expect(cto.querySelector('[data-slot="org-chart-name"]')).toBeNull();
      expect(
        cto.querySelector('[data-slot="org-chart-badge"]')?.textContent?.trim(),
      ).toBe('(3)');
      const links = el.querySelectorAll('path.custom-link');
      expect(links.length).toBe(6);
      expect(links[0].namespaceURI).toBe('http://www.w3.org/2000/svg');
      (el.querySelector('.tool') as HTMLButtonElement).click();
      fixture.detectChanges();
      expect(el.querySelectorAll('[data-slot="org-chart-node"]')).toHaveLength(
        1,
      );
    });

    it('lets a button inside a custom card act without selecting the card', () => {
      const fixture = TestBed.createComponent(TemplateHost);
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;
      const cto = el.querySelector('[data-key="cto"]') as HTMLElement;
      (cto.querySelector('.custom-toggle') as HTMLButtonElement).click();
      fixture.detectChanges();
      expect(cto.getAttribute('aria-expanded')).toBe('false');
      expect(cto.getAttribute('aria-selected')).toBe('false');
    });

    it('takes templates as inputs too, and an empty template', () => {
      @Component({
        imports: [AndesOrgChart, AndesOrgChartEmptyTemplate],
        template: ` <ng-template #card let-person
            >[{{ person.name }}]</ng-template
          >
          <andes-org-chart
            [data]="data"
            [nodeTemplate]="card"
            [animated]="false"
          />
          <andes-org-chart [data]="[]">
            <ng-template andesOrgChartEmpty
              ><p class="nobody">Nobody</p></ng-template
            >
          </andes-org-chart>`,
      })
      class InputTemplates {
        readonly data = { id: 1, name: 'Solo' };
        readonly card =
          viewChild.required<TemplateRef<AndesOrgChartNodeContext<unknown>>>(
            'card',
          );
      }
      const fixture = TestBed.createComponent(InputTemplates);
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;
      expect(
        el.querySelector('[data-slot="org-chart-card"]')?.textContent?.trim(),
      ).toBe('[Solo]');
      expect(el.querySelector('.nobody')?.textContent).toBe('Nobody');
    });
  });
});
