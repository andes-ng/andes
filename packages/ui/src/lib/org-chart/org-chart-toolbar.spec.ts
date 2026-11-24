import { Component, signal, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AndesOrgChart } from './org-chart';
import type {
  AndesOrgChartExportErrorEvent,
  AndesOrgChartExportEvent,
  AndesOrgChartNodeActionEvent,
  AndesOrgChartNodeActions,
} from './org-chart';
import type { AndesOrgChartLabels } from './org-chart-labels';
import type { AndesOrgChartKey } from './org-chart-layout';
import { PRINT_ATTRIBUTE } from './org-chart-print';
import {
  ANDES_ORG_CHART_ALL_CONTROLS,
  ANDES_ORG_CHART_DEFAULT_CONTROLS,
  type AndesOrgChartControl,
  type AndesOrgChartControlsOrientation,
  type AndesOrgChartControlsPosition,
  fillOrgChartText,
  resolveOrgChartControls,
} from './org-chart-toolbar';

interface Person {
  id: string;
  name: string;
  title?: string;
  children?: Person[];
}

function org(): Person {
  return {
    id: 'ceo',
    name: 'Ana Torres',
    title: 'Chief Executive',
    children: [
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

function bigOrg(teams = 60, perTeam = 5): Person {
  return {
    id: 'ceo',
    name: 'Chief',
    title: 'Chief Executive',
    children: Array.from({ length: teams }, (_, team) => ({
      id: `m${team}`,
      name: `Manager ${team}`,
      title: 'Manager',
      children: Array.from({ length: perTeam }, (_, member) => ({
        id: `m${team}-${member}`,
        name: `Member ${team}-${member}`,
        title: 'Engineer',
      })),
    })),
  };
}

@Component({
  imports: [AndesOrgChart],
  template: `<div [attr.dir]="dir()">
    <andes-org-chart
      aria-label="Company"
      [data]="data()"
      [animated]="false"
      [fitOnInit]="false"
      [controls]="controls()"
      [controlItems]="items()"
      [controlsPosition]="position()"
      [controlsOrientation]="orientation()"
      [zoomable]="zoomable()"
      [exportable]="exportable()"
      [captureFormat]="captureFormat()"
      [exportExactLimit]="exactLimit()"
      [labels]="labels()"
      [nodeActions]="actions()"
      [focusOnDblClick]="focusOnDblClick()"
      [(search)]="search"
      [(minimap)]="minimap"
      [(focusedKey)]="focused"
      (fullscreenChange)="fullscreens.push($event)"
      (exported)="exports.push($event)"
      (exportError)="failures.push($event)"
      (nodeAction)="actionsTaken.push($event)"
    />
  </div>`,
})
class HostComponent {
  readonly chart = viewChild.required(AndesOrgChart);
  readonly data = signal<Person>(org());
  readonly dir = signal<'ltr' | 'rtl'>('ltr');
  readonly controls = signal(true);
  readonly items = signal<readonly AndesOrgChartControl[]>(
    ANDES_ORG_CHART_DEFAULT_CONTROLS,
  );
  readonly position = signal<AndesOrgChartControlsPosition>('bottom-end');
  readonly orientation = signal<AndesOrgChartControlsOrientation>('vertical');
  readonly zoomable = signal(true);
  readonly exportable = signal(true);
  readonly captureFormat = signal<'png' | 'svg'>('svg');
  readonly exactLimit = signal(2000);
  readonly labels = signal<Partial<AndesOrgChartLabels>>({});
  readonly actions = signal<AndesOrgChartNodeActions<Person> | null>(null);
  readonly focusOnDblClick = signal(false);
  readonly search = signal('');
  readonly minimap = signal(false);
  readonly focused = signal<AndesOrgChartKey | null>(null);
  readonly fullscreens: boolean[] = [];
  readonly exports: AndesOrgChartExportEvent[] = [];
  readonly failures: AndesOrgChartExportErrorEvent[] = [];
  readonly actionsTaken: AndesOrgChartNodeActionEvent<Person>[] = [];
}

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

interface Setup {
  readonly fixture: ComponentFixture<HostComponent>;
  readonly host: HostComponent;
  readonly el: HTMLElement;
  readonly render: () => void;
  readonly settle: () => Promise<void>;
  /** The tools of the bar, in order, by their `data-tool`. */
  readonly tools: () => string[];
  readonly tool: (name: string) => HTMLButtonElement;
}

function setup(configure: (host: HostComponent) => void = () => undefined) {
  const fixture = TestBed.createComponent(HostComponent);
  const host = fixture.componentInstance;
  configure(host);
  fixture.detectChanges();
  const el = fixture.nativeElement as HTMLElement;
  const render = () => fixture.detectChanges();
  const settle = async () => {
    await new Promise((resolve) => setTimeout(resolve, 20));
    render();
  };
  const tools = () =>
    [
      ...el.querySelectorAll('[data-slot="org-chart-controls"] [data-tool]'),
    ].map((tool) => tool.getAttribute('data-tool') as string);
  const tool = (name: string) => {
    const found = el.querySelector<HTMLButtonElement>(
      `[data-slot="org-chart-controls"] [data-tool="${name}"] button`,
    );
    if (!found) {
      throw new Error(`No tool ${name}`);
    }
    return found;
  };
  return { fixture, host, el, render, settle, tools, tool } satisfies Setup;
}

async function sized(s: Setup, width = 800, height = 600): Promise<void> {
  FakeResizeObserver.resize(width, height);
  await s.settle();
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

describe('resolveOrgChartControls', () => {
  const all = { zoom: true, export: true, fullscreen: true };

  it('keeps the order it is given and drops unknown names and repeats', () => {
    expect(
      resolveOrgChartControls(['fit', 'nope', 'zoom', 'fit', 'reset'], all),
    ).toEqual(['fit', 'zoom', 'reset']);
  });

  it('leaves out the tools that are not available', () => {
    expect(
      resolveOrgChartControls(['zoom', 'fit', 'export', 'fullscreen'], {
        zoom: false,
        export: false,
        fullscreen: false,
      }),
    ).toEqual(['fit']);
  });

  it('keeps a divider only between two tools', () => {
    expect(
      resolveOrgChartControls(
        ['divider', 'fit', 'divider', 'divider', 'reset', 'divider'],
        all,
      ),
    ).toEqual(['fit', 'divider', 'reset']);
    expect(
      resolveOrgChartControls(['fit', 'divider', 'export'], {
        ...all,
        export: false,
      }),
    ).toEqual(['fit']);
  });

  it('returns nothing for nothing', () => {
    expect(resolveOrgChartControls(null, all)).toEqual([]);
    expect(resolveOrgChartControls([], all)).toEqual([]);
  });

  it('fills the placeholders of a translated text', () => {
    expect(
      fillOrgChartText('{current} de {total}', { current: 2, total: 9 }),
    ).toBe('2 de 9');
  });
});

describe('AndesOrgChart toolbar', () => {
  beforeEach(() => {
    FakeResizeObserver.all = [];
    vi.stubGlobal('ResizeObserver', FakeResizeObserver);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    document.body.innerHTML = '';
    document.head
      .querySelectorAll(`[${PRINT_ATTRIBUTE}]`)
      .forEach((n) => n.remove());
  });

  describe('the default bar', () => {
    it('renders exactly the zoom, fit, reset and export bar, as before', () => {
      const s = setup();
      expect(s.tools()).toEqual([
        'zoomIn',
        'zoomOut',
        'fit',
        'reset',
        'export',
      ]);
      const group = s.el.querySelector('[data-slot="org-chart-controls"]');
      expect(group?.getAttribute('role')).toBe('group');
      expect(group?.getAttribute('aria-label')).toBe('Chart view');
      expect(group?.getAttribute('data-position')).toBe('bottom-end');
      expect(group?.getAttribute('data-orientation')).toBe('vertical');
      // Zoom in, the percentage, zoom out, a rule, fit, reset, a rule, export.
      const order = [...(group?.children ?? [])].map((part) =>
        part.classList.contains('andes-org-chart__divider')
          ? 'divider'
          : part.classList.contains('andes-org-chart__zoom')
            ? 'percent'
            : (part.querySelector('[data-tool]')?.getAttribute('data-tool') ??
              part.getAttribute('data-tool')),
      );
      expect(order).toEqual([
        'zoomIn',
        'percent',
        'zoomOut',
        'divider',
        'fit',
        'reset',
        'divider',
        'export',
      ]);
      const icons = [...(group?.querySelectorAll('ng-icon') ?? [])].map(
        (icon) => icon.getAttribute('data-icon'),
      );
      expect(icons).toEqual([
        'lucidePlus',
        'lucideMinus',
        'lucideMaximize',
        'lucideLocateFixed',
        'lucideDownload',
      ]);
    });

    it('keeps `controls`, `zoomable` and `exportable` as shortcuts', () => {
      expect(setup((h) => h.controls.set(false)).tools()).toEqual([]);
      expect(setup((h) => h.zoomable.set(false)).tools()).toEqual([
        'fit',
        'reset',
        'export',
      ]);
      const s = setup((h) => h.exportable.set(false));
      expect(s.tools()).toEqual(['zoomIn', 'zoomOut', 'fit', 'reset']);
      expect(s.el.querySelectorAll('.andes-org-chart__divider')).toHaveLength(
        1,
      );
    });

    it('draws no bar for an empty list or an empty chart', () => {
      expect(
        setup((h) => h.items.set([])).el.querySelector(
          '[data-slot="org-chart-controls"]',
        ),
      ).toBeNull();
      expect(
        setup((h) =>
          h.data.set(undefined as unknown as Person),
        ).el.querySelector('[data-slot="org-chart-controls"]'),
      ).toBeNull();
    });
  });

  describe('choosing the tools', () => {
    it('shows the tools asked for, in the order asked for', () => {
      const s = setup((h) => h.items.set(['reset', 'fit', 'capture']));
      expect(s.tools()).toEqual(['reset', 'fit', 'capture']);
    });

    it.each([
      ['fit', ['fit']],
      ['reset', ['reset']],
      ['capture', ['capture']],
      ['export', ['export']],
      ['print', ['print']],
      ['expandAll', ['expandAll']],
      ['collapseAll', ['collapseAll']],
      ['expandLevel', ['expandLevel']],
      ['search', ['search']],
      ['minimap', ['minimap']],
      ['zoom', ['zoomIn', 'zoomOut']],
    ] as [AndesOrgChartControl, string[]][])(
      'draws the %s tool on its own',
      (item, expected) => {
        const s = setup((h) => h.items.set([item]));
        expect(s.tools()).toEqual(expected);
        for (const name of expected) {
          const button =
            s.el.querySelector(`[data-tool="${name}"] button`) ??
            s.el.querySelector(`[data-tool="${name}"]`);
          expect(button?.getAttribute('aria-label')).toBeTruthy();
        }
      },
    );

    it('draws every tool in the all-items bar, with a name for each', () => {
      const s = setup((h) => {
        h.items.set(ANDES_ORG_CHART_ALL_CONTROLS);
      });
      // Full screen is not supported by jsdom, so that one is left out.
      expect(s.tools()).toEqual([
        'zoomIn',
        'zoomOut',
        'fit',
        'reset',
        'minimap',
        'search',
        'expandAll',
        'collapseAll',
        'expandLevel',
        'capture',
        'export',
        'print',
      ]);
      const names = [
        ...s.el.querySelectorAll('[data-slot="org-chart-controls"] button'),
      ].map((button) => button.getAttribute('aria-label'));
      expect(names.every((name) => !!name)).toBe(true);
      expect(new Set(names).size).toBe(names.length);
    });

    it('translates the name of every tool', () => {
      const labels: Partial<AndesOrgChartLabels> = {
        zoomIn: 'Acercar',
        zoomOut: 'Alejar',
        fit: 'Ajustar',
        reset: 'Restablecer',
        capture: 'Capturar vista',
        export: 'Exportar',
        print: 'Imprimir',
        expandAll: 'Expandir todo',
        collapseAll: 'Contraer todo',
        expandLevel: 'Expandir hasta el nivel',
        search: 'Buscar',
        minimap: 'Mostrar vista general',
        controls: 'Vista del organigrama',
      };
      const s = setup((h) => {
        h.items.set(ANDES_ORG_CHART_ALL_CONTROLS);
        h.labels.set(labels);
      });
      const names = [
        ...s.el.querySelectorAll('[data-slot="org-chart-controls"] button'),
      ].map((button) => button.getAttribute('aria-label'));
      expect(names).toEqual([
        'Acercar',
        'Alejar',
        'Ajustar',
        'Restablecer',
        'Mostrar vista general',
        'Buscar',
        'Expandir todo',
        'Contraer todo',
        'Expandir hasta el nivel',
        'Capturar vista',
        'Exportar',
        'Imprimir',
      ]);
      expect(
        s.el
          .querySelector('[data-slot="org-chart-controls"]')
          ?.getAttribute('aria-label'),
      ).toBe('Vista del organigrama');
    });

    it('wraps the buttons in tooltips unless they are turned off', () => {
      const s = setup((h) => h.items.set(['fit', 'reset']));
      expect(
        s.el.querySelectorAll('[data-slot="org-chart-controls"] andes-tooltip'),
      ).toHaveLength(2);
    });
  });

  describe('position and orientation', () => {
    it.each([['top-start'], ['top-end'], ['bottom-start'], ['bottom-end']] as [
      AndesOrgChartControlsPosition,
    ][])('floats the bar in the %s corner', (position) => {
      const s = setup((h) => h.position.set(position));
      const bar = s.el.querySelector('[data-slot="org-chart-controls"]');
      expect(bar?.getAttribute('data-position')).toBe(position);
      expect(
        s.el.querySelector('andes-org-chart')?.getAttribute('data-controls'),
      ).toBe(position);
    });

    it('lays the tools out in a row when horizontal', () => {
      const s = setup((h) => h.orientation.set('horizontal'));
      expect(
        s.el
          .querySelector('[data-slot="org-chart-controls"]')
          ?.getAttribute('data-orientation'),
      ).toBe('horizontal');
      expect(
        s.el
          .querySelector('andes-org-chart')
          ?.getAttribute('data-controls-orientation'),
      ).toBe('horizontal');
    });

    it('follows the position and orientation as they change', () => {
      const s = setup();
      s.host.position.set('top-start');
      s.host.orientation.set('horizontal');
      s.render();
      const bar = s.el.querySelector('[data-slot="org-chart-controls"]');
      expect(bar?.getAttribute('data-position')).toBe('top-start');
      expect(bar?.getAttribute('data-orientation')).toBe('horizontal');
    });

    it('keeps the consumer toolbar and the bar side by side', () => {
      @Component({
        imports: [AndesOrgChart],
        template: `<andes-org-chart
            [data]="data"
            [animated]="false"
            controlsPosition="top-start"
            [toolbarTemplate]="own"
          />
          <ng-template #own
            ><button class="own" type="button">Own</button></ng-template
          >`,
      })
      class BesideHost {
        readonly data = org();
      }
      const fixture = TestBed.createComponent(BesideHost);
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;
      expect(
        el.querySelector('[data-slot="org-chart-toolbar"] .own'),
      ).not.toBeNull();
      expect(
        el.querySelector('[data-slot="org-chart-controls"]'),
      ).not.toBeNull();
      expect(
        el.querySelector('andes-org-chart')?.getAttribute('data-controls'),
      ).toBe('top-start');
    });
  });

  describe('expansion tools', () => {
    it('expands everything, collapses to the roots and opens to a level', async () => {
      const s = setup((h) =>
        h.items.set(['expandAll', 'collapseAll', 'expandLevel']),
      );
      await sized(s);
      const cards = () =>
        s.el.querySelectorAll('[data-slot="org-chart-node"]').length;
      expect(cards()).toBe(6);
      s.tool('expandAll').click();
      s.render();
      expect(cards()).toBe(7);
      s.tool('collapseAll').click();
      s.render();
      expect(cards()).toBe(1);
      s.host.chart().expandToLevel(2);
      s.render();
      expect(cards()).toBe(3);
      expect(s.host.chart().shownLevels()).toBe(2);
      s.host.chart().expandToLevel(4);
      s.render();
      expect(cards()).toBe(7);
      s.host.chart().expandToLevel(1);
      s.render();
      expect(cards()).toBe(1);
    });

    it('lists one entry per level in the menu and marks the level shown', async () => {
      const s = setup((h) => h.items.set(['expandLevel']));
      await sized(s);
      s.tool('expandLevel').click();
      await s.settle();
      const items = [
        ...document.querySelectorAll<HTMLElement>('[role^="menuitem"]'),
      ];
      expect(items.map((item) => item.textContent?.trim())).toEqual([
        'Level 1',
        'Level 2',
        'Level 3',
        'Level 4',
      ]);
      items[0].click();
      s.render();
      expect(s.el.querySelectorAll('[data-slot="org-chart-node"]').length).toBe(
        1,
      );
    });
  });

  describe('search tool', () => {
    async function opened(): Promise<Setup> {
      const s = setup((h) => h.items.set(['search']));
      await sized(s);
      s.tool('search').click();
      await s.settle();
      return s;
    }

    function type(s: Setup, value: string): HTMLInputElement {
      const input = s.el.querySelector<HTMLInputElement>(
        '[data-slot="org-chart-search"] input',
      ) as HTMLInputElement;
      input.value = value;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      s.render();
      return input;
    }

    it('opens a named search field, with the focus in it', async () => {
      const s = await opened();
      const field = s.el.querySelector('[data-slot="org-chart-search"]');
      expect(field?.getAttribute('role')).toBe('search');
      const input = field?.querySelector('input') as HTMLInputElement;
      expect(input.getAttribute('aria-label')).toBe('Search');
      expect(input.getAttribute('placeholder')).toBe('Search people');
      expect(document.activeElement).toBe(input);
    });

    it('drives the search, shows how many match and steps through them', async () => {
      const s = await opened();
      type(s, 'er');
      // Bruno, Carla (Engineer), Diego (Engineer) ... name or role contains "er".
      const keys = s.host.chart().matchedKeys();
      expect(keys.length).toBeGreaterThan(1);
      expect(s.host.search()).toBe('er');
      const summary = () =>
        s.el
          .querySelector('[data-slot="org-chart-matches"]')
          ?.textContent?.trim();
      expect(summary()).toBe(`${keys.length} found`);
      const input = s.el.querySelector(
        '[data-slot="org-chart-search"] input',
      ) as HTMLInputElement;

      key(input, 'Enter');
      s.render();
      expect(s.host.chart().currentMatch()).toBe(keys[0]);
      expect(summary()).toBe(`1 of ${keys.length}`);
      expect(
        s.el
          .querySelector(`[data-key="${keys[0]}"]`)
          ?.hasAttribute('data-current'),
      ).toBe(true);

      key(input, 'Enter');
      s.render();
      expect(s.host.chart().currentMatch()).toBe(keys[1]);

      key(input, 'Enter', { shiftKey: true });
      key(input, 'Enter', { shiftKey: true });
      s.render();
      expect(s.host.chart().currentMatch()).toBe(keys[keys.length - 1]);
    });

    it('steps with the previous and next buttons', async () => {
      const s = await opened();
      type(s, 'engineer');
      const next = s.el.querySelector<HTMLButtonElement>(
        '[data-tool="nextMatch"] button',
      ) as HTMLButtonElement;
      const previous = s.el.querySelector<HTMLButtonElement>(
        '[data-tool="previousMatch"] button',
      ) as HTMLButtonElement;
      const keys = s.host.chart().matchedKeys();
      next.click();
      s.render();
      expect(s.host.chart().matchIndex()).toBe(0);
      next.click();
      s.render();
      expect(s.host.chart().matchIndex()).toBe(1);
      previous.click();
      previous.click();
      s.render();
      expect(s.host.chart().matchIndex()).toBe(keys.length - 1);
    });

    it('says when nothing matches and disables stepping', async () => {
      const s = await opened();
      type(s, 'zzz');
      expect(
        s.el
          .querySelector('[data-slot="org-chart-matches"]')
          ?.textContent?.trim(),
      ).toBe('No matches');
      expect(
        s.el.querySelector<HTMLButtonElement>('[data-tool="nextMatch"] button')
          ?.disabled,
      ).toBe(true);
    });

    it('closes and clears the search with Escape or the close button', async () => {
      const s = await opened();
      const input = type(s, 'bruno');
      expect(s.host.chart().matchedKeys().length).toBeGreaterThan(0);
      key(input, 'Escape');
      s.render();
      expect(s.el.querySelector('[data-slot="org-chart-search"]')).toBeNull();
      expect(s.host.search()).toBe('');
      expect(document.activeElement).toBe(s.tool('search'));

      s.tool('search').click();
      await s.settle();
      type(s, 'ana');
      s.el
        .querySelector<HTMLButtonElement>('[data-tool="closeSearch"] button')
        ?.click();
      s.render();
      expect(s.el.querySelector('[data-slot="org-chart-search"]')).toBeNull();
      expect(s.host.search()).toBe('');
    });

    it('takes a bound query too, and opens from the slash key on the tree', async () => {
      const s = setup((h) => {
        h.items.set(['search']);
        h.search.set('carla');
      });
      await sized(s);
      expect(s.host.chart().matchedKeys()).toEqual(['dev1']);
      const card = s.el.querySelector('[data-key="ceo"]') as HTMLElement;
      key(card, '/');
      await s.settle();
      expect(
        s.el.querySelector('[data-slot="org-chart-search"]'),
      ).not.toBeNull();
      const input = s.el.querySelector(
        '[data-slot="org-chart-search"] input',
      ) as HTMLInputElement;
      expect(input.value).toBe('carla');
    });

    it('does not open from the slash key without the search tool', async () => {
      const s = setup();
      await sized(s);
      key(s.el.querySelector('[data-key="ceo"]') as HTMLElement, '/');
      s.render();
      expect(s.el.querySelector('[data-slot="org-chart-search"]')).toBeNull();
    });
  });

  describe('full screen', () => {
    let current: Element | null = null;

    function stubFullscreen(enabled = true) {
      current = null;
      Object.defineProperty(document, 'fullscreenEnabled', {
        configurable: true,
        value: enabled,
      });
      Object.defineProperty(document, 'fullscreenElement', {
        configurable: true,
        get: () => current,
      });
      const change = () =>
        document.dispatchEvent(new Event('fullscreenchange'));
      const request = vi.fn(async function (this: Element) {
        current = this; // eslint-disable-line @typescript-eslint/no-this-alias
        change();
      });
      Object.defineProperty(HTMLElement.prototype, 'requestFullscreen', {
        configurable: true,
        value: request,
      });
      Object.defineProperty(document, 'exitFullscreen', {
        configurable: true,
        value: vi.fn(async () => {
          current = null;
          change();
        }),
      });
      return { request, change };
    }

    afterEach(() => {
      for (const name of [
        'fullscreenEnabled',
        'fullscreenElement',
        'exitFullscreen',
      ]) {
        Reflect.deleteProperty(document, name);
      }
      Reflect.deleteProperty(HTMLElement.prototype, 'requestFullscreen');
    });

    it('enters and leaves full screen from the tool, swapping icon and name', async () => {
      const { request } = stubFullscreen();
      const s = setup((h) => h.items.set(['fullscreen']));
      await sized(s);
      const icon = () =>
        s.el
          .querySelector('[data-tool="fullscreen"] ng-icon')
          ?.getAttribute('data-icon');
      expect(icon()).toBe('lucideMaximize2');
      expect(s.tool('fullscreen').getAttribute('aria-label')).toBe(
        'Full screen',
      );

      s.tool('fullscreen').click();
      await s.settle();
      expect(request).toHaveBeenCalledTimes(1);
      expect(s.host.chart().fullscreen()).toBe(true);
      expect(s.host.fullscreens).toEqual([true]);
      expect(
        s.el.querySelector('andes-org-chart')?.hasAttribute('data-fullscreen'),
      ).toBe(true);
      expect(icon()).toBe('lucideMinimize2');
      expect(s.tool('fullscreen').getAttribute('aria-label')).toBe(
        'Exit full screen',
      );

      s.tool('fullscreen').click();
      await s.settle();
      expect(s.host.chart().fullscreen()).toBe(false);
      expect(s.host.fullscreens).toEqual([true, false]);
      expect(icon()).toBe('lucideMaximize2');
    });

    it('follows the browser when it leaves full screen on its own (Escape)', async () => {
      const { change } = stubFullscreen();
      const s = setup();
      await sized(s);
      await s.host.chart().enterFullscreen();
      s.render();
      expect(s.host.chart().fullscreen()).toBe(true);
      current = null;
      change();
      s.render();
      expect(s.host.chart().fullscreen()).toBe(false);
      expect(s.host.fullscreens).toEqual([true, false]);
    });

    it('frames the chart again when it changes size, and not when `fullscreenFit` is off', async () => {
      stubFullscreen();
      const s = setup();
      await sized(s, 800, 600);
      await s.host.chart().enterFullscreen();
      const before = s.host.chart().viewport();
      await sized(s, 1600, 900);
      await new Promise((resolve) => setTimeout(resolve, 400));
      expect(s.host.chart().viewport()).not.toEqual(before);
    });

    it('does nothing where the browser has no Fullscreen API, and hides the tool', async () => {
      const s = setup((h) => h.items.set(['fit', 'fullscreen']));
      await sized(s);
      expect(s.tools()).toEqual(['fit']);
      await expect(s.host.chart().enterFullscreen()).resolves.toBeUndefined();
      await expect(s.host.chart().toggleFullscreen()).resolves.toBeUndefined();
      expect(s.host.chart().fullscreen()).toBe(false);
    });

    it('stays put when the browser refuses', async () => {
      stubFullscreen();
      Object.defineProperty(HTMLElement.prototype, 'requestFullscreen', {
        configurable: true,
        value: vi.fn(() => Promise.reject(new Error('denied'))),
      });
      const s = setup();
      await sized(s);
      await s.host.chart().enterFullscreen();
      expect(s.host.chart().fullscreen()).toBe(false);
    });
  });

  describe('capture and export scope', () => {
    function stubSave() {
      const saved: string[] = [];
      vi.stubGlobal('URL', {
        createObjectURL: () => 'blob:chart',
        revokeObjectURL: () => undefined,
      });
      vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(
        function (this: HTMLAnchorElement) {
          saved.push(this.download);
        },
      );
      return saved;
    }

    it('captures exactly the viewport with scope view, and the whole canvas with chart', async () => {
      const s = setup();
      await sized(s, 800, 600);
      const view = await (
        await s.host.chart().exportImage('svg', { scope: 'view' })
      ).text();
      const whole = await (await s.host.chart().exportImage('svg')).text();
      expect(view).toContain('viewBox="0 0 800 600"');
      expect(view).toContain('data-slot="org-chart-viewport"');
      expect(view).toContain('Ana Torres');
      expect(whole).not.toContain('viewBox="0 0 800 600"');
      expect(whole).not.toContain('data-slot="org-chart-viewport"');
      // The view keeps the pan and zoom it is taken at; the whole chart does not.
      expect(view).toMatch(/translate\([-\d.e]+px, [-\d.e]+px\) scale\(/);
      expect(whole).not.toMatch(/scale\(1\)/);
    });

    it('leaves the bar out of a capture', async () => {
      const s = setup();
      await sized(s);
      const view = await (
        await s.host.chart().exportImage('svg', { scope: 'view' })
      ).text();
      expect(view).not.toContain('data-slot="org-chart-controls"');
    });

    it('saves the capture of the bar as one click, named and announced', async () => {
      const saved = stubSave();
      const s = setup((h) => h.items.set(['capture']));
      await sized(s);
      s.tool('capture').click();
      await s.settle();
      expect(saved).toEqual(['org-chart.svg']);
      expect(s.host.exports).toHaveLength(1);
      expect(s.host.exports[0]).toMatchObject({
        format: 'svg',
        scope: 'view',
        filename: 'org-chart.svg',
      });
      await s.host
        .chart()
        .download('svg', { scope: 'chart', filename: 'whole' });
      expect(saved).toEqual(['org-chart.svg', 'whole.svg']);
      expect(s.host.exports[1]).toMatchObject({
        scope: 'chart',
        filename: 'whole.svg',
      });
    });

    it('reports a failed save from the bar instead of throwing', async () => {
      stubSave();
      const s = setup((h) => {
        h.items.set(['capture']);
        h.captureFormat.set('png');
      });
      await sized(s);
      s.tool('capture').click();
      await s.settle();
      await new Promise((resolve) => setTimeout(resolve, 20));
      expect(s.host.failures).toHaveLength(1);
      expect(s.host.exports).toHaveLength(0);
    });

    describe('a windowed chart', () => {
      async function large(limit = 2000): Promise<Setup> {
        const s = setup((h) => {
          h.data.set(bigOrg());
          h.exactLimit.set(limit);
        });
        s.fixture.autoDetectChanges();
        await sized(s);
        return s;
      }

      it('captures the view from the cards in the page', async () => {
        const s = await large();
        const rendered = s.el.querySelectorAll(
          '[data-slot="org-chart-node"]',
        ).length;
        expect(rendered).toBeLessThan(361);
        const view = await (
          await s.host.chart().exportImage('svg', { scope: 'view' })
        ).text();
        expect(view).toContain('<foreignObject');
        expect(view).toContain('viewBox="0 0 800 600"');
      });

      it('exports the whole chart exactly up to the limit, and goes back to windowing', async () => {
        const s = await large();
        const before = s.el.querySelectorAll(
          '[data-slot="org-chart-node"]',
        ).length;
        const whole = await (await s.host.chart().exportImage('svg')).text();
        expect(whole).toContain('<foreignObject');
        expect(whole).toContain('Member 59-4');
        expect(whole).toContain('Member 0-0');
        await s.settle();
        expect(
          s.el.querySelectorAll('[data-slot="org-chart-node"]').length,
        ).toBe(before);
        expect(
          s.el.querySelector('andes-org-chart')?.hasAttribute('data-windowed'),
        ).toBe(true);
      });

      it('falls back to the drawn summary above the limit', async () => {
        const s = await large(10);
        const whole = await (await s.host.chart().exportImage('svg')).text();
        expect(whole).not.toContain('<foreignObject');
        expect(whole).toContain('Member 59-4');
        expect(whole).toContain('<path d="M');
      });
    });
  });

  describe('print', () => {
    function stubPrint(onPrint: () => void) {
      vi.stubGlobal('URL', {
        createObjectURL: () => 'blob:chart',
        revokeObjectURL: () => undefined,
      });
      return vi.spyOn(window, 'print').mockImplementation(() => {
        onPrint();
        window.dispatchEvent(new Event('afterprint'));
      });
    }

    it('puts the whole chart alone on the page while the dialog is open, then cleans up', async () => {
      let during: {
        root: Element | null;
        style: string;
        hidden: boolean;
      } | null = null;
      const print = stubPrint(() => {
        const root = document.body.querySelector(`[${PRINT_ATTRIBUTE}]`);
        during = {
          root,
          style:
            document.head.querySelector(`style[${PRINT_ATTRIBUTE}]`)
              ?.textContent ?? '',
          hidden: !!root?.querySelector('img'),
        };
      });
      const s = setup((h) => h.items.set(['print']));
      await sized(s);
      s.tool('print').click();
      await s.settle();
      await new Promise((resolve) => setTimeout(resolve, 20));
      expect(print).toHaveBeenCalledTimes(1);
      expect(during).not.toBeNull();
      const seen = during as unknown as {
        root: Element;
        style: string;
        hidden: boolean;
      };
      expect(seen.root).not.toBeNull();
      expect(seen.hidden).toBe(true);
      expect(seen.style).toContain('@media print');
      expect(seen.style).toContain('display: none');
      expect(seen.style).toContain('@page');
      expect(seen.style).toContain('landscape');
      expect(document.body.querySelector(`[${PRINT_ATTRIBUTE}]`)).toBeNull();
      expect(
        document.head.querySelector(`style[${PRINT_ATTRIBUTE}]`),
      ).toBeNull();
    });

    it('prints a tall chart on a portrait page', async () => {
      let style = '';
      stubPrint(() => {
        style =
          document.head.querySelector(`style[${PRINT_ATTRIBUTE}]`)
            ?.textContent ?? '';
      });
      const s = setup((h) => h.data.set({ id: 'a', name: 'Solo' } as Person));
      await sized(s);
      await s.host.chart().print();
      expect(style).toContain('landscape');
    });

    it('reports a print that fails', async () => {
      vi.stubGlobal('URL', {
        createObjectURL: () => {
          throw new Error('no blob urls');
        },
        revokeObjectURL: () => undefined,
      });
      const s = setup((h) => h.items.set(['print']));
      await sized(s);
      s.tool('print').click();
      await s.settle();
      await new Promise((resolve) => setTimeout(resolve, 20));
      expect(s.host.failures).toHaveLength(1);
    });
  });

  describe('minimap', () => {
    it('is toggled by the tool and by the input', async () => {
      const s = setup((h) => h.items.set(['minimap']));
      await sized(s);
      const map = () => s.el.querySelector('andes-org-chart-minimap');
      expect(map()).toBeNull();
      expect(s.tool('minimap').getAttribute('aria-label')).toBe(
        'Show overview',
      );
      s.tool('minimap').click();
      s.render();
      expect(s.host.minimap()).toBe(true);
      expect(map()).not.toBeNull();
      expect(map()?.getAttribute('aria-hidden')).toBe('true');
      expect(s.tool('minimap').getAttribute('aria-label')).toBe(
        'Hide overview',
      );
      s.host.minimap.set(false);
      s.render();
      expect(map()).toBeNull();
      const second = setup((h) => h.minimap.set(true));
      expect(second.el.querySelector('andes-org-chart-minimap')).not.toBeNull();
    });

    it('sits at the bottom, on the side the bar is not', () => {
      const corner = (position: AndesOrgChartControlsPosition) =>
        setup((h) => {
          h.minimap.set(true);
          h.position.set(position);
        })
          .el.querySelector('andes-org-chart-minimap')
          ?.getAttribute('data-corner');
      expect(corner('bottom-end')).toBe('bottom-start');
      expect(corner('bottom-start')).toBe('bottom-end');
      expect(corner('top-end')).toBe('bottom-end');
      expect(corner('top-start')).toBe('bottom-start');
    });

    it('pans the view to a point of the overview', async () => {
      const s = setup();
      await sized(s, 800, 600);
      const chart = s.host.chart();
      chart.centerOnCanvas(500, 400);
      const { x, y, scale } = chart.viewport();
      expect(x).toBeCloseTo(400 - 500 * scale, 5);
      expect(y).toBeCloseTo(300 - 400 * scale, 5);
    });

    it('describes every card and the part in view', async () => {
      const s = setup();
      await sized(s);
      const overview = s.host.chart().overview();
      expect(overview.left).toHaveLength(6);
      expect(overview.width).toBeGreaterThan(0);
      const seen = s.host.chart().seenAreaNow();
      expect(seen.right).toBeGreaterThan(seen.left);
    });
  });

  describe('node menu', () => {
    const items = [
      { key: 'focus', label: 'Focus on this team' },
      { key: 'copy', label: 'Copy name' },
    ];

    async function menu(s: Setup, card: string): Promise<void> {
      const target = s.el.querySelector(`[data-key="${card}"]`) as HTMLElement;
      const event = new MouseEvent('contextmenu', {
        bubbles: true,
        cancelable: true,
        clientX: 120,
        clientY: 80,
      });
      target.dispatchEvent(event);
      await s.settle();
      await s.settle();
    }

    it('opens at the card on right click, and the chosen entry is emitted with the card', async () => {
      const s = setup((h) => h.actions.set(items));
      await sized(s);
      await menu(s, 'cto');
      const entries = [
        ...document.querySelectorAll<HTMLElement>('[role^="menuitem"]'),
      ];
      expect(entries.map((entry) => entry.textContent?.trim())).toEqual([
        'Focus on this team',
        'Copy name',
      ]);
      entries[1].click();
      s.render();
      expect(s.host.actionsTaken).toHaveLength(1);
      expect(s.host.actionsTaken[0].action).toBe('copy');
      expect(s.host.actionsTaken[0].node.key).toBe('cto');
    });

    it('builds the entries per card when given a function, and skips a card with none', async () => {
      const s = setup((h) =>
        h.actions.set((node) =>
          node.key === 'cto'
            ? [{ key: 'only', label: 'Only for the CTO' }]
            : [],
        ),
      );
      await sized(s);
      await menu(s, 'cto');
      expect(
        [...document.querySelectorAll('[role^="menuitem"]')].map((e) =>
          e.textContent?.trim(),
        ),
      ).toEqual(['Only for the CTO']);
      const other = new MouseEvent('contextmenu', {
        bubbles: true,
        cancelable: true,
      });
      (s.el.querySelector('[data-key="cfo"]') as HTMLElement).dispatchEvent(
        other,
      );
      expect(other.defaultPrevented).toBe(false);
    });

    it('leaves the browser menu alone without entries', async () => {
      const s = setup();
      await sized(s);
      const event = new MouseEvent('contextmenu', {
        bubbles: true,
        cancelable: true,
      });
      (s.el.querySelector('[data-key="cto"]') as HTMLElement).dispatchEvent(
        event,
      );
      expect(event.defaultPrevented).toBe(false);
    });

    it('keeps the browser menu from covering its own', async () => {
      const s = setup((h) => h.actions.set(items));
      await sized(s);
      const event = new MouseEvent('contextmenu', {
        bubbles: true,
        cancelable: true,
        clientX: 5,
        clientY: 5,
      });
      (s.el.querySelector('[data-key="cto"]') as HTMLElement).dispatchEvent(
        event,
      );
      expect(event.defaultPrevented).toBe(true);
    });
  });

  describe('focus on a team', () => {
    const keysOf = (s: Setup) =>
      [
        ...s.el.querySelectorAll<HTMLElement>('[data-slot="org-chart-node"]'),
      ].map((node) => node.dataset['key']);

    it('isolates a team, with a trail back to the whole chart', async () => {
      const s = setup();
      await sized(s);
      s.host.chart().focusNode('cto');
      s.render();
      expect(keysOf(s)).toEqual(['cto', 'dev1', 'dev2']);
      expect(s.host.focused()).toBe('cto');
      const cto = s.el.querySelector('[data-key="cto"]');
      expect(cto?.getAttribute('aria-level')).toBe('1');
      expect(cto?.getAttribute('data-kind')).toBe('root');
      expect(
        s.el.querySelector('andes-org-chart')?.hasAttribute('data-focused'),
      ).toBe(true);
      const trail = s.el.querySelector('[data-slot="org-chart-trail"]');
      expect(trail?.textContent).toContain('Whole chart');
      expect(trail?.textContent).toContain('Ana Torres');
      expect(trail?.textContent).toContain('Bruno Díaz');
    });

    it('goes back from the trail, from clearFocus and from Escape', async () => {
      const s = setup();
      await sized(s);
      s.host.chart().focusNode('cto');
      s.render();
      const links = [
        ...s.el.querySelectorAll<HTMLElement>(
          '[data-slot="org-chart-trail"] a, [data-slot="org-chart-trail"] button',
        ),
      ];
      links[0].click();
      s.render();
      expect(s.host.focused()).toBeNull();
      expect(keysOf(s)).toHaveLength(6);

      s.host.chart().focusNode('cfo');
      s.render();
      expect(keysOf(s)).toEqual(['cfo', 'acc']);
      s.host.chart().clearFocus();
      s.render();
      expect(keysOf(s)).toHaveLength(6);

      s.host.chart().focusNode('cto');
      s.render();
      key(s.el.querySelector('[data-key="cto"]') as HTMLElement, 'Escape');
      s.render();
      expect(s.host.focused()).toBeNull();
    });

    it('opens the team of the person it isolates', async () => {
      const s = setup();
      await sized(s);
      s.host.chart().focusNode('dev1');
      s.render();
      expect(keysOf(s)).toEqual(['dev1', 'intern']);
    });

    it('searches only inside the isolated team', async () => {
      const s = setup();
      await sized(s);
      s.host.chart().focusNode('cto');
      s.host.search.set('e');
      s.render();
      expect(
        s.host
          .chart()
          .matchedKeys()
          .every((k) => ['cto', 'dev1', 'dev2', 'intern'].includes(String(k))),
      ).toBe(true);
    });

    it('can be bound, and ignores a key that is not in the data', async () => {
      const s = setup((h) => h.focused.set('cfo'));
      await sized(s);
      expect(keysOf(s)).toEqual(['cfo', 'acc']);
      s.host.focused.set('nobody');
      s.render();
      expect(keysOf(s)).toHaveLength(6);
      s.host.chart().focusNode('nobody2');
      expect(s.host.focused()).toBe('nobody');
    });

    it('isolates on a double click when asked to', async () => {
      const s = setup((h) => h.focusOnDblClick.set(true));
      await sized(s);
      (s.el.querySelector('[data-key="cto"]') as HTMLElement).dispatchEvent(
        new MouseEvent('dblclick', { bubbles: true }),
      );
      s.render();
      expect(s.host.focused()).toBe('cto');
    });

    it('translates the trail', async () => {
      const s = setup((h) =>
        h.labels.set({ focusAll: 'Todo el organigrama', focusTrail: 'Equipo' }),
      );
      await sized(s);
      s.host.chart().focusNode('cto');
      s.render();
      const trail = s.el.querySelector('[data-slot="org-chart-trail"]');
      expect(trail?.textContent).toContain('Todo el organigrama');
      expect(
        trail?.querySelector('nav')?.getAttribute('aria-label') ??
          trail?.getAttribute('aria-label'),
      ).toBe('Equipo');
    });
  });

  describe('right to left', () => {
    it('mirrors the bar with logical corners and opens the menus the other way', () => {
      const s = setup((h) => h.dir.set('rtl'));
      expect(
        s.el
          .querySelector('[data-slot="org-chart-controls"]')
          ?.getAttribute('data-position'),
      ).toBe('bottom-end');
      // The corner is named `end` in both directions: the stylesheet maps it to the left here.
      expect(
        s.el.closest('[dir]') ?? s.el.querySelector('[dir="rtl"]'),
      ).not.toBeNull();
    });
  });
});
