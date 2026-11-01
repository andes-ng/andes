import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { declaredValue, expectLength } from '../../testing/computed-style';
import { AndesOrgChart } from './org-chart';
import type { AndesOrgChartOrientation } from './org-chart-layout';

const CSS = readFileSync(
  join(process.cwd(), new URL('./org-chart.css', import.meta.url).pathname),
  'utf8',
);

/**
 * A declaration of the stylesheet with the line breaks the formatter puts inside long `var()`
 * calls removed, so the expectation can be written on one line.
 */
function declared(selector: string, property: string): string | undefined {
  return declaredValue(CSS, selector, property)
    ?.replace(/\(\s+/g, '(')
    .replace(/\s+\)/g, ')');
}

/** The body of the first `@media` block whose condition contains `condition`. */
function mediaBlock(condition: string): string {
  const start = CSS.indexOf(`@media (${condition})`);
  if (start === -1) {
    return '';
  }
  let depth = 0;
  for (let index = CSS.indexOf('{', start); index < CSS.length; index++) {
    if (CSS[index] === '{') {
      depth++;
    } else if (CSS[index] === '}' && --depth === 0) {
      return CSS.slice(start, index + 1);
    }
  }
  return '';
}

@Component({
  imports: [AndesOrgChart],
  template: `<andes-org-chart
    aria-label="Styles"
    [data]="data"
    [orientation]="orientation()"
    [reversed]="reversed()"
    [selected]="['b']"
    [search]="search()"
    [animated]="false"
  />`,
})
class HostComponent {
  readonly data = {
    id: 'a',
    name: 'Ana Torres',
    title: 'Chief',
    children: [
      {
        id: 'b',
        name: 'Bruno Díaz',
        title: 'Technology',
        children: [{ id: 'c', name: 'Carla' }],
      },
      { id: 'd', name: 'Diego Paz', title: 'Finance' },
    ],
  };
  readonly orientation = signal<AndesOrgChartOrientation>('vertical');
  readonly reversed = signal(false);
  readonly search = signal('');
}

function setup() {
  const fixture = TestBed.createComponent(HostComponent);
  fixture.detectChanges();
  const el = fixture.nativeElement as HTMLElement;
  const host = el.querySelector('andes-org-chart') as HTMLElement;
  const part = (selector: string) => el.querySelector(selector) as HTMLElement;
  return { fixture, el, host, part };
}

describe('AndesOrgChart styles', () => {
  it('clips a positioned host of the hookable height', () => {
    const { host } = setup();
    const style = getComputedStyle(host);
    expect(style.display).toBe('block');
    expect(style.position).toBe('relative');
    expect(style.overflow).toBe('hidden');
    expect(style.boxSizing).toBe('border-box');
    expectLength(style.blockSize, 'var(--andes-org-chart-height, 32rem)');
    expect(declared(':host', 'block-size')).toBe(
      'var(--andes-org-chart-height, 32rem)',
    );
    expect(declared(':host', 'border')).toBe(
      '1px solid var(--andes-org-chart-border-color, var(--andes-color-border))',
    );
  });

  it('fills the host with the viewport and scales the canvas from its corner', () => {
    const { part } = setup();
    const viewport = getComputedStyle(part('[data-slot="org-chart-viewport"]'));
    expect(viewport.position).toBe('absolute');
    expect(viewport.overflow).toBe('hidden');
    expect(viewport.touchAction).toBe('none');
    expect(viewport.cursor).toBe('grab');
    const canvas = getComputedStyle(part('[data-slot="org-chart-canvas"]'));
    expect(canvas.position).toBe('absolute');
    expectLength(canvas.top, 0);
    expectLength(canvas.left, 0);
    expect(declared('.andes-org-chart__canvas', 'transform-origin')).toBe(
      '0 0',
    );
  });

  it('positions cards physically, with the transform carrying the layout', () => {
    const { part } = setup();
    const node = part('[data-key="b"]');
    const style = getComputedStyle(node);
    expect(style.position).toBe('absolute');
    expectLength(style.top, 0);
    expectLength(style.left, 0);
    expect(node.style.transform).toMatch(/^translate\(/);
  });

  it('draws the card as a bordered, rounded, clipped flex row', () => {
    const { part } = setup();
    const card = getComputedStyle(
      part('[data-key="b"] [data-slot="org-chart-card"]'),
    );
    expect(card.position).toBe('absolute');
    expect(card.display).toBe('flex');
    expect(card.alignItems).toBe('center');
    expect(card.overflow).toBe('hidden');
    expect(card.boxSizing).toBe('border-box');
    expect(declared('.andes-org-chart__card', 'border-radius')).toBe(
      'var(--andes-org-chart-node-radius, var(--andes-radius-lg))',
    );
    expect(declared('.andes-org-chart__card::before', 'inline-size')).toBe(
      '3px',
    );
  });

  it('truncates the name and the role on one line', () => {
    const { part } = setup();
    for (const slot of ['org-chart-name', 'org-chart-title']) {
      const style = getComputedStyle(
        part(`[data-key="b"] [data-slot="${slot}"]`),
      );
      expect(style.whiteSpace).toBe('nowrap');
      expect(style.textOverflow).toBe('ellipsis');
      expect(style.overflow).toBe('hidden');
    }
  });

  it('draws a round avatar of 2.5rem', () => {
    const { part } = setup();
    const avatar = getComputedStyle(
      part('[data-key="b"] [data-slot="org-chart-avatar"]'),
    );
    expectLength(avatar.inlineSize, '2.5rem');
    expectLength(avatar.blockSize, '2.5rem');
    expect(avatar.display).toBe('grid');
    expect(declared('.andes-org-chart__avatar', 'border-radius')).toBe(
      'var(--andes-radius-full)',
    );
  });

  it('centers the badge on the card edge that faces the reports', () => {
    const s = setup();
    const badge = () =>
      getComputedStyle(s.part('[data-key="b"] [data-slot="org-chart-badge"]'));
    expect(badge().position).toBe('absolute');
    expect(badge().translate).toBe('-50% -50%');
    expect(badge().top).toBe('100%');
    expect(badge().left).toBe('50%');

    s.fixture.componentInstance.orientation.set('horizontal');
    s.fixture.detectChanges();
    expect(badge().top).toBe('50%');
    expect(badge().left).toBe('100%');

    s.fixture.componentInstance.reversed.set(true);
    s.fixture.detectChanges();
    expectLength(badge().left, 0);
  });

  it('draws the connectors unfilled with a hookable stroke', () => {
    const { part } = setup();
    // jsdom reports `fill: none` as a transparent color, so the declaration is checked.
    expect(part('[data-slot="org-chart-link"] path').classList).toContain(
      'andes-org-chart__link',
    );
    expect(declared('.andes-org-chart__link', 'fill')).toBe('none');
    expect(declared('.andes-org-chart__link', 'stroke-width')).toBe(
      'var(--andes-org-chart-connector-width, 1.5px)',
    );
    expect(
      declared('.andes-org-chart__link--secondary', 'stroke-dasharray'),
    ).toBe('var(--andes-org-chart-secondary-dasharray, 6 4)');
    const svg = getComputedStyle(part('[data-slot="org-chart-links"]'));
    expect(svg.pointerEvents).toBe('none');
  });

  it('dims cards off the search path without losing text contrast', () => {
    const s = setup();
    s.fixture.componentInstance.search.set('carla');
    s.fixture.detectChanges();
    const dimmed = s.part('[data-key="d"]');
    expect(dimmed.hasAttribute('data-dimmed')).toBe(true);
    expect(s.part('[data-key="c"]').hasAttribute('data-dimmed')).toBe(false);
    // The card itself stays opaque; only its decoration fades.
    expect(getComputedStyle(dimmed).opacity).toBe('1');
    expect(
      getComputedStyle(
        dimmed.querySelector('[data-slot="org-chart-name"]') as Element,
      ).color,
    ).toBe('var(--andes-color-muted-foreground)');
    expect(
      declared(
        '.andes-org-chart__node[data-dimmed] .andes-org-chart__card::before',
        'opacity',
      ),
    ).toBe('var(--andes-org-chart-dimmed-opacity, 0.35)');
  });

  it('marks the selected card with its accent', () => {
    expect(
      declared(
        '.andes-org-chart__node[data-selected] .andes-org-chart__card',
        'border-color',
      ),
    ).toBe(
      'var(--andes-org-chart-node-accent, var(--_andes-org-chart-accent))',
    );
    expect(
      declared(
        '.andes-org-chart__node:focus-visible .andes-org-chart__card',
        'outline',
      ),
    ).toBe('2px solid var(--andes-color-focus-ring)');
  });

  it('stacks the zoom controls in a column in the inline-end corner', () => {
    const { part } = setup();
    const controls = getComputedStyle(part('[data-slot="org-chart-controls"]'));
    expect(controls.position).toBe('absolute');
    expect(controls.display).toBe('flex');
    expect(controls.flexDirection).toBe('column');
    expect(declared('.andes-org-chart__controls', 'inset-inline-end')).toBe(
      'var(--andes-space-3)',
    );
  });

  it('animates moves only when motion is on and the chart is ready', () => {
    expect(
      declared(
        ':host([data-motion][data-ready]) .andes-org-chart__node',
        'transition',
      ),
    ).toContain('transform var(--_andes-org-chart-motion)');
    expect(declared('.andes-org-chart__node', 'transition')).toBeUndefined();
    const { host } = setup();
    expect(host.hasAttribute('data-motion')).toBe(false);
  });

  it('turns every transition off under reduced motion', () => {
    const block = mediaBlock('prefers-reduced-motion: reduce');
    expect(block).toContain('.andes-org-chart__node');
    expect(block).toContain('transition: none !important');
    expect(block).toContain('animation: none !important');
  });

  it('keeps cards, lines, selection and the badge visible in forced colors', () => {
    const block = mediaBlock('forced-colors: active');
    expect(block).toContain('border-color: CanvasText');
    expect(block).toContain('stroke: CanvasText');
    expect(block).toContain('outline: 2px solid Highlight');
    expect(block).toContain('border-color: ButtonText');
  });
});
