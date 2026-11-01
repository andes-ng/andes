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
      '1px solid var(--andes-org-chart-border-color, var(--_andes-org-chart-hairline))',
    );
  });

  it('fills the host with the viewport and scales the canvas from its corner', () => {
    const { part } = setup();
    const viewport = getComputedStyle(part('[data-slot="org-chart-viewport"]'));
    expect(viewport.position).toBe('absolute');
    expect(viewport.overflow).toBe('hidden');
    expect(viewport.touchAction).toBe('none');
    expect(viewport.cursor).toBe('grab');
    expect(viewport.userSelect).toBe('none');
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
    // Quiet by default: no accent bar, no shadow, a hairline border.
    expect(
      declared('.andes-org-chart__card::before', 'content'),
    ).toBeUndefined();
    expect(declared('.andes-org-chart__card', 'box-shadow')).toBe(
      'var(--andes-org-chart-node-shadow, none)',
    );
    expect(declared('.andes-org-chart__card', 'border')).toBe(
      '1px solid var(--andes-org-chart-node-border-color, var(--_andes-org-chart-hairline))',
    );
    // The token spacing scale (16px across, 12px down) is not loaded in the unit tests.
    expect(declared('.andes-org-chart__card', 'padding-inline')).toBe(
      'var(--andes-space-4)',
    );
    expect(declared('.andes-org-chart__card', 'padding-block')).toBe(
      'var(--andes-space-3)',
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
    expectLength(
      avatar.inlineSize,
      'var(--andes-org-chart-avatar-size, 2.5rem)',
    );
    expectLength(
      avatar.blockSize,
      'var(--andes-org-chart-avatar-size, 2.5rem)',
    );
    expect(avatar.display).toBe('grid');
    expect(declared('.andes-org-chart__avatar', 'border-radius')).toBe(
      'var(--andes-radius-full)',
    );
  });

  it('centers the toggle on the card edge that faces the reports', () => {
    const s = setup();
    const toggle = () =>
      getComputedStyle(s.part('[data-key="b"] [data-slot="org-chart-toggle"]'));
    expect(toggle().position).toBe('absolute');
    expect(toggle().translate).toBe('-50% -50%');
    expect(toggle().top).toBe('100%');
    expect(toggle().left).toBe('50%');

    s.fixture.componentInstance.orientation.set('horizontal');
    s.fixture.detectChanges();
    expect(toggle().top).toBe('50%');
    expect(toggle().left).toBe('100%');

    s.fixture.componentInstance.reversed.set(true);
    s.fixture.detectChanges();
    expectLength(toggle().left, 0);
  });

  it('draws the toggle as a small hairline circle that grows into a pill for a count', () => {
    const s = setup();
    const toggle = getComputedStyle(
      s.part('[data-key="b"] [data-slot="org-chart-toggle"]'),
    );
    expectLength(
      toggle.blockSize,
      'var(--andes-org-chart-toggle-size, 1.25rem)',
    );
    expect(declared('.andes-org-chart__toggle', 'border-radius')).toBe(
      'var(--andes-radius-full)',
    );
    expect(declared('.andes-org-chart__toggle', 'box-shadow')).toBeUndefined();
    expect(
      declared('.andes-org-chart__toggle[data-count]', 'padding-inline'),
    ).toBe('0.375rem 0.25rem');
  });

  it('steps the canvas, card and hairline in the dark theme', () => {
    const dark = ":host-context([data-andes-theme='dark'])";
    expect(declared(':host', '--_andes-org-chart-canvas')).toBe(
      'var(--andes-color-muted)',
    );
    expect(declared(dark, '--_andes-org-chart-canvas')).toBe(
      'var(--andes-color-background)',
    );
    expect(declared(dark, '--_andes-org-chart-hairline')).toBe(
      'var(--andes-color-border)',
    );
    expect(declared(':host', 'background')).toBe(
      'var(--andes-org-chart-background, var(--_andes-org-chart-canvas))',
    );
  });

  it('draws the checkbox, filled when checked or mixed', () => {
    expect(declared('.andes-org-chart__checkbox', 'inline-size')).toBe('1rem');
    expect(
      declared(
        '.andes-org-chart__node[data-checked] .andes-org-chart__checkbox',
        'background',
      ),
    ).toBe('var(--andes-org-chart-checkbox-color, var(--andes-color-primary))');
  });

  it('draws the connectors unfilled with a hookable stroke', () => {
    const { part } = setup();
    // jsdom reports `fill: none` as a transparent color, so the declaration is checked.
    expect(part('[data-slot="org-chart-link"] path').classList).toContain(
      'andes-org-chart__link',
    );
    expect(declared('.andes-org-chart__link', 'fill')).toBe('none');
    expect(declared('.andes-org-chart__link', 'stroke-width')).toBe(
      'var(--andes-org-chart-connector-width, 1px)',
    );
    expect(
      declared('.andes-org-chart__link--secondary', 'stroke-dasharray'),
    ).toBe('var(--andes-org-chart-secondary-dasharray, 4 4)');
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
        '.andes-org-chart__node[data-dimmed] .andes-org-chart__toggle',
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

  it('keeps cards, lines, selection and the toggle visible in forced colors', () => {
    const block = mediaBlock('forced-colors: active');
    expect(block).toContain('border-color: CanvasText');
    expect(block).toContain('stroke: CanvasText');
    expect(block).toContain('outline: 2px solid Highlight');
    expect(block).toContain('border-color: ButtonText');
  });
});
