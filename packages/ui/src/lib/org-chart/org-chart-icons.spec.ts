import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { AndesOrgChart } from './org-chart';

/*
  The chart draws its glyphs (toggle chevron, spinner, checkbox marks, zoom controls) with
  lucide through `<ng-icon>` and registers them itself: no test bed here calls `provideIcons`,
  so an icon whose svg is rendered proves the registration is automatic. The connector lines
  between the cards stay an illustration and are not asserted here.
*/

interface Person {
  id: string;
  name: string;
  children?: Person[];
}

const ORG: Person = {
  id: 'ceo',
  name: 'Ana Torres',
  children: [
    {
      id: 'cto',
      name: 'Bruno Diaz',
      children: [{ id: 'dev', name: 'Carla Ruiz' }],
    },
    { id: 'cfo', name: 'Elena Soto' },
  ],
};

/** The lucide name of every `<ng-icon>` under `root` whose svg was drawn. */
function drawn(root: ParentNode): string[] {
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
  imports: [AndesOrgChart],
  template: `<andes-org-chart
    aria-label="Company"
    [data]="data"
    [selectionMode]="mode"
    [expandAll]="true"
    [animated]="false"
    [loadChildren]="loadChildren"
  />`,
})
class Host {
  data: Person = ORG;
  mode: 'none' | 'checkbox' = 'none';
  loadChildren: (() => Promise<Person[]>) | null = null;
}

async function render(configure: (host: Host) => void) {
  const fixture = TestBed.createComponent(Host);
  configure(fixture.componentInstance);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return fixture;
}

describe('AndesOrgChart lucide icons', () => {
  it('draws the toggle chevron and the five zoom controls', async () => {
    const fixture = await render(() => undefined);
    const el = fixture.nativeElement as HTMLElement;
    const controls = el.querySelector('[data-slot="org-chart-controls"]');

    expect(blank(el)).toEqual([]);
    expect(drawn(el)).toContain('lucideChevronDown');
    expect(drawn(controls as Element)).toEqual([
      'lucidePlus',
      'lucideMinus',
      'lucideMaximize',
      'lucideLocateFixed',
    ]);
  });

  it('draws the checkbox tick and the mixed dash', async () => {
    const fixture = await render((host) => (host.mode = 'checkbox'));
    const el = fixture.nativeElement as HTMLElement;
    const box = (key: string) =>
      el.querySelector(`[data-key="${key}"] [data-slot="org-chart-checkbox"]`);

    (box('dev') as HTMLElement).click();
    fixture.detectChanges();

    expect(drawn(box('dev') as Element)).toEqual(['lucideCheck']);
    expect(drawn(box('cto') as Element)).toEqual(['lucideCheck']);
    expect(drawn(box('ceo') as Element)).toEqual(['lucideMinus']);
    expect(drawn(box('cfo') as Element)).toEqual([]);
    expect(blank(el)).toEqual([]);
  });

  it('shows the spinner while a team loads, and hides it from assistive technology', async () => {
    const fixture = await render((host) => {
      host.data = {
        id: 'root',
        name: 'Root',
        children: [{ id: 'team', name: 'Team Lead' }],
      };
      host.loadChildren = () => new Promise<Person[]>(() => undefined);
    });
    const el = fixture.nativeElement as HTMLElement;
    const toggle = el.querySelector(
      '[data-key="team"] [data-slot="org-chart-toggle"]',
    ) as HTMLElement;

    toggle.click();
    fixture.detectChanges();

    const spinner = toggle.querySelector('ng-icon');
    expect(spinner?.getAttribute('name')).toBe('lucideLoaderCircle');
    expect(spinner?.classList).toContain('andes-org-chart__spinner');
    expect(spinner?.getAttribute('aria-hidden')).toBe('true');
    expect(spinner?.querySelector('svg')).not.toBeNull();
  });
});
