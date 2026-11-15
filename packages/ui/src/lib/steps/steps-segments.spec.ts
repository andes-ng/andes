import { Component, signal, TemplateRef, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { readFileSync } from 'node:fs';

import { AndesStep } from './step';
import { AndesSteps } from './steps';
import type {
  AndesStepsClassNamesInput,
  AndesStepsCollapsedVariant,
  AndesStepsDensity,
  AndesStepsIndicator,
  AndesStepsLabels,
  AndesStepsOrientation,
  AndesStepsSize,
  AndesStepsType,
  AndesStepStatus,
} from './steps-types';

@Component({
  imports: [AndesSteps, AndesStep],
  template: `
    <andes-steps
      aria-label="Checkout"
      [(current)]="current"
      [type]="type()"
      [orientation]="orientation()"
      [size]="size()"
      [density]="density()"
      [indicator]="indicator()"
      [status]="status()"
      [percent]="percent()"
      [clickable]="clickable()"
      [collapsedVariant]="collapsedVariant()"
      [minimumStepWidth]="minimumStepWidth()"
      [labels]="labels()"
      [classNames]="classNames()"
      [beforeChange]="beforeChange()"
      (changed)="changes.push($event)"
    >
      <andes-step title="Cart" description="Review the items" />
      <andes-step title="Shipping" [disabled]="shippingDisabled()" />
      <andes-step title="Payment" [status]="paymentStatus()" />
      <andes-step
        title="Review"
        [indicator]="reviewIndicator()"
        [endContent]="end()"
      />
      <andes-step title="Confirm" />
    </andes-steps>
    <ng-template #endTpl><b class="end-tpl">2 min</b></ng-template>
  `,
})
class Host {
  readonly current = signal(2);
  readonly type = signal<AndesStepsType>('segments');
  readonly orientation = signal<AndesStepsOrientation>('horizontal');
  readonly size = signal<AndesStepsSize>('default');
  readonly density = signal<AndesStepsDensity>('default');
  readonly indicator = signal<AndesStepsIndicator>('auto');
  readonly status = signal<AndesStepStatus>('process');
  readonly percent = signal<number | undefined>(undefined);
  readonly clickable = signal(false);
  readonly collapsedVariant = signal<AndesStepsCollapsedVariant | undefined>(
    undefined,
  );
  readonly minimumStepWidth = signal(112);
  readonly labels = signal<AndesStepsLabels | undefined>(undefined);
  readonly classNames = signal<AndesStepsClassNamesInput | undefined>(
    undefined,
  );
  readonly beforeChange = signal<
    ((to: number, from: number) => boolean | Promise<boolean>) | undefined
  >(undefined);
  readonly shippingDisabled = signal(false);
  readonly paymentStatus = signal<AndesStepStatus | undefined>(undefined);
  readonly reviewIndicator = signal<AndesStepsIndicator | undefined>(undefined);
  readonly end = signal<string | TemplateRef<unknown> | undefined>(undefined);
  readonly endTpl = viewChild.required<TemplateRef<unknown>>('endTpl');
  readonly changes: number[] = [];
}

class FakeResizeObserver {
  static instances: FakeResizeObserver[] = [];
  constructor(private readonly callback: () => void) {
    FakeResizeObserver.instances.push(this);
  }
  observe() {
    /* noop */
  }
  disconnect() {
    /* noop */
  }
  trigger() {
    this.callback();
  }
}

describe('Steps: segments type and the steps upgrade', () => {
  function create(setup?: (host: Host) => void) {
    const fixture = TestBed.createComponent(Host);
    setup?.(fixture.componentInstance);
    fixture.detectChanges();
    const root = fixture.nativeElement.querySelector(
      'andes-steps',
    ) as HTMLElement;
    const items = () =>
      Array.from(
        fixture.nativeElement.querySelectorAll('andes-step'),
      ) as HTMLElement[];
    const marker = (index: number) =>
      items()[index].querySelector('.andes-step__marker') as HTMLElement | null;
    return { fixture, host: fixture.componentInstance, root, items, marker };
  }

  function flush(fixture: ComponentFixture<Host>) {
    fixture.detectChanges();
    fixture.detectChanges();
  }

  function stubWidth(root: HTMLElement, width: number) {
    root.getBoundingClientRect = () =>
      ({
        width,
        height: 40,
        top: 0,
        left: 0,
        right: width,
        bottom: 40,
      }) as DOMRect;
  }

  /** Mounts with a measured container width, as the browser reports it after layout. */
  function createMeasured(width: number, setup?: (host: Host) => void) {
    vi.stubGlobal('ResizeObserver', FakeResizeObserver);
    const fixture = TestBed.createComponent(Host);
    setup?.(fixture.componentInstance);
    const root = fixture.nativeElement.querySelector(
      'andes-steps',
    ) as HTMLElement;
    stubWidth(root, width);
    fixture.detectChanges();
    flush(fixture);
    const resize = (next: number) => {
      stubWidth(root, next);
      FakeResizeObserver.instances[0].trigger();
      flush(fixture);
    };
    return { fixture, host: fixture.componentInstance, root, resize };
  }

  afterEach(() => {
    vi.unstubAllGlobals();
    FakeResizeObserver.instances = [];
  });

  describe('the segments design', () => {
    it('mirrors the type on the trail and on every step', () => {
      const { root, items } = create();

      expect(root.getAttribute('data-type')).toBe('segments');
      for (const item of items()) {
        expect(item.getAttribute('data-type')).toBe('segments');
      }
    });

    it('draws a bar above every step, the last one included', () => {
      const { items } = create();

      for (const item of items()) {
        expect(item.querySelector('.andes-step__tail')).not.toBeNull();
        expect(item.querySelector('.andes-step__rail')).not.toBeNull();
      }
    });

    it('keeps the bar of the default type off the last step', () => {
      const { items } = create((host) => host.type.set('default'));

      expect(items()[4].querySelector('.andes-step__tail')).toBeNull();
    });

    it('shows a check when done, a ring while current and the number ahead', () => {
      const { marker } = create();

      expect(marker(0)?.getAttribute('data-marker')).toBe('check');
      expect(marker(1)?.getAttribute('data-marker')).toBe('check');
      expect(marker(2)?.getAttribute('data-marker')).toBe('ring');
      expect(marker(3)?.getAttribute('data-marker')).toBe('number');
      expect(marker(3)?.textContent?.trim()).toBe('4');
      expect(marker(4)?.textContent?.trim()).toBe('5');
    });

    it('marks the current step for the pill and keeps aria-current', () => {
      const { items } = create();

      expect(items()[2].hasAttribute('data-current')).toBe(true);
      expect(items()[2].getAttribute('aria-current')).toBe('step');
      expect(items()[3].hasAttribute('data-current')).toBe(false);
    });

    it('follows `current` as the user moves on', () => {
      const { fixture, host, marker } = create();
      host.current.set(3);
      flush(fixture);

      expect(marker(2)?.getAttribute('data-marker')).toBe('check');
      expect(marker(3)?.getAttribute('data-marker')).toBe('ring');
    });

    it('shows a cross for an error and keeps the status word for assistive tech', () => {
      const { items, marker } = create((host) => host.status.set('error'));

      expect(marker(2)?.getAttribute('data-marker')).toBe('cross');
      expect(
        items()[2].querySelector('.andes-step__sr')?.textContent,
      ).toContain('Error');
    });

    it('keeps the title on one line (ellipsis) while the full text stays readable', () => {
      const css = readFileSync(
        'packages/ui/src/lib/steps/step-segments.css',
        'utf8',
      );

      expect(css).toContain('text-overflow: ellipsis');
      expect(css).toContain('white-space: nowrap');
    });

    it('fills the bar of the current step by `percent`', () => {
      const { fixture, host, items } = create();
      host.percent.set(40);
      flush(fixture);

      expect(items()[2].style.getPropertyValue('--_percent')).toBe('40%');
      expect(
        items()[2].querySelector('.andes-step__status-text')?.textContent,
      ).toContain('40%');
      expect(items()[2].querySelector('.andes-step__ring')).toBeNull();
      expect(items()[1].style.getPropertyValue('--_percent')).toBe('');
    });

    it.each(['horizontal', 'vertical'] as const)(
      'works in the %s orientation and both sizes',
      (orientation) => {
        const { fixture, host, root, items } = create((h) => {
          h.orientation.set(orientation);
          h.size.set('small');
        });
        flush(fixture);

        expect(root.getAttribute('data-orientation')).toBe(orientation);
        expect(root.getAttribute('data-size')).toBe('small');
        expect(items()[0].getAttribute('data-size')).toBe('small');
        expect(host.current()).toBe(2);
      },
    );

    it('always lays its titles out beside the marker', () => {
      const { root } = create();

      expect(root.getAttribute('data-title-placement')).toBe('horizontal');
    });

    it('reaches the bar through the tail and rail parts', () => {
      const { items } = create((host) =>
        host.classNames.set({ tail: 'my-bar', rail: 'my-fill' }),
      );

      expect(
        items()[0].querySelector('.andes-step__tail.my-bar'),
      ).not.toBeNull();
      expect(
        items()[4].querySelector('.andes-step__rail.my-fill'),
      ).not.toBeNull();
    });
  });

  describe('indicator', () => {
    it('hides every marker with `none`', () => {
      const { items, root } = create((host) => host.indicator.set('none'));

      expect(
        items().every((item) => !item.querySelector('.andes-step__marker')),
      ).toBe(true);
      // The bar and the title still carry the progress.
      expect(root.querySelectorAll('.andes-step__tail')).toHaveLength(5);
      expect(root.textContent).toContain('Payment');
    });

    it('shows the number on every step with `number`', () => {
      const { marker } = create((host) => host.indicator.set('number'));

      for (let index = 0; index < 5; index++) {
        expect(marker(index)?.getAttribute('data-marker')).toBe('number');
        expect(marker(index)?.textContent?.trim()).toBe(String(index + 1));
      }
    });

    it('lets a step override the trail', () => {
      const { marker } = create((host) => host.reviewIndicator.set('none'));

      expect(marker(3)).toBeNull();
      expect(marker(2)).not.toBeNull();
    });

    it('applies to the default type too', () => {
      const { marker, items } = create((host) => {
        host.type.set('default');
        host.indicator.set('number');
        host.reviewIndicator.set('auto');
      });

      expect(marker(0)?.getAttribute('data-marker')).toBe('number');
      expect(marker(3)?.getAttribute('data-marker')).toBe('number');
      expect(items()).toHaveLength(5);
    });

    it('keeps the busy spinner under `number`, so a loading step stays visible', () => {
      const { marker } = create((host) => {
        host.indicator.set('number');
        host.status.set('loading');
      });

      expect(marker(2)?.getAttribute('data-marker')).toBe('spinner');
    });
  });

  describe('warning and loading status', () => {
    it('draws a warning glyph with lucide and names the status', () => {
      const { items, marker } = create((host) =>
        host.paymentStatus.set('warning'),
      );

      expect(marker(2)?.getAttribute('data-marker')).toBe('warning');
      expect(items()[2].querySelector('ng-icon')?.getAttribute('name')).toBe(
        'lucideTriangleAlert',
      );
      expect(items()[2].getAttribute('data-status')).toBe('warning');
      expect(
        items()[2].querySelector('.andes-step__sr')?.textContent,
      ).toContain('Warning');
      expect(items()[2].hasAttribute('aria-busy')).toBe(false);
    });

    it('turns the marker into a spinner and announces a busy step', () => {
      const { items, marker } = create((host) =>
        host.paymentStatus.set('loading'),
      );

      expect(marker(2)?.getAttribute('data-marker')).toBe('spinner');
      expect(marker(2)?.querySelector('ng-icon')).toBeNull();
      expect(items()[2].getAttribute('aria-busy')).toBe('true');
      expect(
        items()[2].querySelector('.andes-step__sr')?.textContent,
      ).toContain('Loading');
      expect(items()[1].hasAttribute('aria-busy')).toBe(false);
    });

    it('applies the trail status to the current step', () => {
      const { items } = create((host) => host.status.set('warning'));

      expect(items()[2].getAttribute('data-status')).toBe('warning');
      expect(items()[3].getAttribute('data-status')).toBe('wait');
    });

    it.each(['default', 'panel', 'dot', 'navigation', 'inline'] as const)(
      'is accepted by the %s type',
      (type) => {
        const { items } = create((host) => {
          host.type.set(type);
          host.paymentStatus.set('warning');
        });

        expect(items()[2].getAttribute('data-status')).toBe('warning');
      },
    );

    it('uses the labels the consumer provides', () => {
      const { items } = create((host) => {
        host.paymentStatus.set('loading');
        host.labels.set({ loading: 'Cargando' });
      });

      expect(
        items()[2].querySelector('.andes-step__sr')?.textContent,
      ).toContain('Cargando');
    });
  });

  describe('end content', () => {
    it('shows text at the end of the title row', () => {
      const { items } = create((host) => host.end.set('2 min'));

      const end = items()[3].querySelector('.andes-step__end');

      expect(end?.textContent?.trim()).toBe('2 min');
      expect(end?.closest('.andes-step__main')).not.toBeNull();
    });

    it('draws a template', () => {
      const { fixture, host } = create();
      host.end.set(host.endTpl());
      flush(fixture);

      expect(fixture.nativeElement.querySelector('.end-tpl')?.textContent).toBe(
        '2 min',
      );
    });

    it('draws nothing without it, and takes a class', () => {
      const { fixture, host, items } = create();

      expect(items()[3].querySelector('.andes-step__end')).toBeNull();

      host.classNames.set({ end: 'my-end' });
      host.end.set('Now');
      flush(fixture);

      expect(
        items()[3].querySelector('.andes-step__end.my-end'),
      ).not.toBeNull();
    });
  });

  describe('density', () => {
    it.each(['compact', 'default', 'comfortable'] as const)(
      'mirrors `%s` on the trail and the steps',
      (density) => {
        const { root, items } = create((host) => host.density.set(density));

        expect(root.getAttribute('data-density')).toBe(density);
        expect(items()[0].getAttribute('data-density')).toBe(density);
      },
    );

    it('tells a classNames function the density', () => {
      const seen: AndesStepsDensity[] = [];
      create((host) => {
        host.density.set('compact');
        host.classNames.set((info) => {
          seen.push(info.density);
          return {};
        });
      });

      expect(seen).toContain('compact');
    });
  });

  describe('collapsed summary', () => {
    const summary = (root: HTMLElement) =>
      root.querySelector('.andes-steps__summary') as HTMLElement | null;
    const controls = (root: HTMLElement) =>
      Array.from(
        root.querySelectorAll('.andes-steps__summary andes-button button'),
      ) as HTMLButtonElement[];

    it('stays a normal trail while every step has room', () => {
      const { root } = createMeasured(900);

      expect(summary(root)).toBeNull();
      expect(root.hasAttribute('data-compact')).toBe(false);
      expect(root.getAttribute('data-orientation')).toBe('horizontal');
    });

    it('collapses to bars and a summary once a step gets under the minimum width', () => {
      const { root } = createMeasured(400);

      // 400 / 5 steps = 80px, under 112px.
      expect(root.getAttribute('data-compact')).toBe('summary-controls');
      expect(root.getAttribute('data-orientation')).toBe('horizontal');
      expect(root.hasAttribute('data-collapsed')).toBe(false);
      expect(summary(root)?.textContent).toContain('Payment');
      expect(summary(root)?.textContent).toContain('3 / 5');
    });

    it('describes the current step in the summary and follows it', () => {
      const { fixture, host, root } = createMeasured(400, (h) =>
        h.current.set(0),
      );

      expect(summary(root)?.textContent).toContain('Cart');
      expect(summary(root)?.textContent).toContain('Review the items');

      host.current.set(3);
      flush(fixture);

      expect(summary(root)?.textContent).toContain('Review');
      expect(summary(root)?.textContent).toContain('4 / 5');
    });

    it('keeps every step name in the list for assistive tech', () => {
      const { root } = createMeasured(400);

      const names = Array.from(
        root.querySelectorAll('.andes-step__title-text'),
      ).map((node) => node.textContent?.trim());

      expect(names).toEqual([
        'Cart',
        'Shipping',
        'Payment',
        'Review',
        'Confirm',
      ]);
      expect(
        root
          .querySelector('.andes-steps__summary-text')
          ?.getAttribute('aria-hidden'),
      ).toBe('true');
    });

    it('goes back to the full trail when the container grows', () => {
      const { root, resize } = createMeasured(400);
      resize(900);

      expect(summary(root)).toBeNull();
      expect(root.hasAttribute('data-compact')).toBe(false);
    });

    it('honours `minimumStepWidth`', () => {
      const { root, resize, host, fixture } = createMeasured(400);
      host.minimumStepWidth.set(60);
      flush(fixture);

      expect(root.hasAttribute('data-compact')).toBe(false);

      host.minimumStepWidth.set(100);
      flush(fixture);
      resize(400);

      expect(root.hasAttribute('data-compact')).toBe(true);
    });

    it('draws previous and next buttons only when the trail is clickable', () => {
      const plain = createMeasured(400);

      expect(controls(plain.root)).toHaveLength(0);

      const { root } = createMeasured(400, (host) => host.clickable.set(true));
      const [previous, next] = controls(root);

      expect(previous.getAttribute('aria-label')).toBe('Previous step');
      expect(next.getAttribute('aria-label')).toBe('Next step');
    });

    it('draws the chevrons with lucide', () => {
      const { root } = createMeasured(400, (host) => host.clickable.set(true));

      const icons = Array.from(
        root.querySelectorAll('.andes-steps__summary ng-icon'),
      ).map((icon) => icon.getAttribute('name'));

      expect(icons).toEqual(['lucideChevronLeft', 'lucideChevronRight']);
    });

    it('moves to the next and previous step and emits `changed`', () => {
      const { fixture, host, root } = createMeasured(400, (h) =>
        h.clickable.set(true),
      );

      controls(root)[1].click();
      flush(fixture);

      expect(host.current()).toBe(3);
      expect(host.changes).toEqual([3]);

      controls(root)[0].click();
      controls(root)[0].click();
      flush(fixture);

      expect(host.current()).toBe(1);
      expect(host.changes).toEqual([3, 2, 1]);
    });

    it('skips a disabled step', () => {
      const { fixture, host, root } = createMeasured(400, (h) => {
        h.clickable.set(true);
        h.current.set(2);
        h.shippingDisabled.set(true);
      });

      controls(root)[0].click();
      flush(fixture);

      expect(host.current()).toBe(0);
    });

    it('disables a button that has nowhere to go', () => {
      const { fixture, host, root } = createMeasured(400, (h) => {
        h.clickable.set(true);
        h.current.set(0);
      });

      expect(controls(root)[0].disabled).toBe(true);
      expect(controls(root)[1].disabled).toBe(false);

      host.current.set(4);
      flush(fixture);

      expect(controls(root)[0].disabled).toBe(false);
      expect(controls(root)[1].disabled).toBe(true);
    });

    it('asks `beforeChange` first', () => {
      const guard = vi.fn(() => false);
      const { fixture, host, root } = createMeasured(400, (h) => {
        h.clickable.set(true);
        h.beforeChange.set(guard);
      });

      controls(root)[1].click();
      flush(fixture);

      expect(guard).toHaveBeenCalledWith(3, 2);
      expect(host.current()).toBe(2);
    });

    it('hands navigation to the summary: the bars are no longer buttons', () => {
      const { root } = createMeasured(400, (host) => host.clickable.set(true));

      expect(root.querySelectorAll('button.andes-step__trigger')).toHaveLength(
        0,
      );
      expect(root.querySelectorAll('andes-step[data-clickable]')).toHaveLength(
        0,
      );
    });

    it('turns the steps back into buttons when it stops collapsing', () => {
      const { root, resize } = createMeasured(400, (host) =>
        host.clickable.set(true),
      );
      resize(900);

      expect(root.querySelectorAll('button.andes-step__trigger')).toHaveLength(
        5,
      );
    });

    it('`summary` shows the text without buttons', () => {
      const { root } = createMeasured(400, (host) => {
        host.clickable.set(true);
        host.collapsedVariant.set('summary');
      });

      expect(root.getAttribute('data-compact')).toBe('summary');
      expect(summary(root)?.textContent).toContain('Payment');
      expect(controls(root)).toHaveLength(0);
    });

    it('`track` shows the bars alone', () => {
      const { root } = createMeasured(400, (host) => {
        host.clickable.set(true);
        host.collapsedVariant.set('track');
      });

      expect(root.getAttribute('data-compact')).toBe('track');
      expect(summary(root)?.textContent?.trim()).toBe('');
      expect(controls(root)).toHaveLength(0);
    });

    it('`stack` turns the trail vertical instead', () => {
      const { root } = createMeasured(400, (host) =>
        host.collapsedVariant.set('stack'),
      );

      expect(root.getAttribute('data-orientation')).toBe('vertical');
      expect(root.hasAttribute('data-compact')).toBe(false);
      expect(summary(root)).toBeNull();
    });

    it('does not collapse a vertical trail', () => {
      const vertical = createMeasured(400, (host) =>
        host.orientation.set('vertical'),
      );

      expect(vertical.root.hasAttribute('data-compact')).toBe(false);
    });

    it('leaves the other types to their own responsive collapse', () => {
      const { root } = createMeasured(400, (host) => {
        host.type.set('default');
        host.collapsedVariant.set('summary-controls');
      });

      expect(root.hasAttribute('data-compact')).toBe(false);
      expect(root.getAttribute('data-orientation')).toBe('vertical');
    });

    it('names the buttons from the labels', () => {
      const { root } = createMeasured(400, (host) => {
        host.clickable.set(true);
        host.labels.set({ previous: 'Atrás', next: 'Siguiente' });
      });

      expect(
        controls(root).map((button) => button.getAttribute('aria-label')),
      ).toEqual(['Atrás', 'Siguiente']);
    });

    it('takes a class on the summary row', () => {
      const { root } = createMeasured(400, (host) =>
        host.classNames.set({ summary: 'my-summary' }),
      );

      expect(
        root.querySelector('.andes-steps__summary.my-summary'),
      ).not.toBeNull();
    });

    it('never collapses without a measured width', () => {
      const { root } = create();

      expect(root.hasAttribute('data-compact')).toBe(false);
    });
  });

  describe('stylesheet contract', () => {
    const css = readFileSync(
      'packages/ui/src/lib/steps/step-segments.css',
      'utf8',
    );

    it('uses logical properties, never physical left/right offsets', () => {
      expect(css).not.toMatch(/\b(?:margin|padding)-(?:left|right)\b/);
      expect(css).not.toMatch(/^\s*(?:left|right)\s*:/m);
    });

    it('reads its colours from public custom properties with token fallbacks', () => {
      for (const name of [
        '--andes-steps-segment-accent',
        '--andes-steps-segment-track',
        '--andes-steps-segment-height',
        '--andes-steps-pill-background',
      ]) {
        expect(css).toContain(name);
      }
      expect(css).toContain('--andes-color-primary');
      expect(css).toContain('--andes-color-foreground');
    });

    it('honours reduced motion and forced colours', () => {
      expect(css).toContain('@media (prefers-reduced-motion: reduce)');
      expect(css).toContain('@media (forced-colors: active)');
    });

    it('is registered with the step and the folded-steps marker', () => {
      for (const file of ['step.ts', 'steps-more.ts']) {
        expect(
          readFileSync(`packages/ui/src/lib/steps/${file}`, 'utf8'),
        ).toContain('./step-segments.css');
      }
    });
  });
});
