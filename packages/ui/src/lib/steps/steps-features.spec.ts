import { Component, signal, TemplateRef, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideStar } from '@ng-icons/lucide';
import { readFileSync } from 'node:fs';

import { atRule } from '../../testing/at-rule';
import { AndesStep } from './step';
import { AndesStepPanel } from './step-panel';
import { AndesSteps } from './steps';
import { hiddenRanges, isFolded } from './steps-overflow';
import type {
  AndesStepsClassNamesInput,
  AndesStepsConnector,
  AndesStepsStatusIcons,
  AndesStepsStylesInput,
  AndesStepsType,
  AndesStepsVariant,
} from './steps-types';

@Component({
  imports: [AndesSteps, AndesStep, AndesStepPanel],
  providers: [provideIcons({ lucideStar })],
  template: `
    <andes-steps
      aria-label="Features"
      [(current)]="current"
      [type]="type()"
      [variant]="variant()"
      [connector]="connector()"
      [initial]="initial()"
      [maxCount]="maxCount()"
      [offset]="offset()"
      [percent]="percent()"
      [clickable]="clickable()"
      [statusIcons]="statusIcons()"
      [dotTemplate]="dotTemplate()"
      [classNames]="classNames()"
      [styles]="styles()"
      [beforeChange]="beforeChange()"
      (changed)="changes.push($event)"
    >
      @for (title of titles(); track title) {
        <andes-step
          [title]="title"
          [optional]="optional(title)"
          [disabled]="disabled().includes(title)"
          [icon]="icons()[title]"
        />
      }
      <andes-step-panel class="p0">First panel</andes-step-panel>
      <andes-step-panel class="p1">Second panel</andes-step-panel>
      <andes-step-panel class="pn" [step]="3">Fourth panel</andes-step-panel>
    </andes-steps>
    <ng-template #dot let-status let-index="index"
      ><i class="dot">{{ status }}-{{ index }}</i></ng-template
    >
  `,
})
class Host {
  readonly current = signal(1);
  readonly type = signal<AndesStepsType>('default');
  readonly variant = signal<AndesStepsVariant>('soft');
  readonly connector = signal<AndesStepsConnector>('solid');
  readonly initial = signal(1);
  readonly maxCount = signal<number | undefined>(undefined);
  readonly offset = signal(0);
  readonly percent = signal<number | undefined>(undefined);
  readonly clickable = signal(false);
  readonly statusIcons = signal<AndesStepsStatusIcons | undefined>(undefined);
  readonly dotTemplate = signal<TemplateRef<never> | undefined>(undefined);
  readonly classNames = signal<AndesStepsClassNamesInput | undefined>(
    undefined,
  );
  readonly styles = signal<AndesStepsStylesInput | undefined>(undefined);
  readonly beforeChange = signal<
    ((to: number, from: number) => boolean | Promise<boolean>) | undefined
  >(undefined);
  readonly titles = signal(['A', 'B', 'C', 'D']);
  readonly disabled = signal<string[]>([]);
  readonly icons = signal<Record<string, string | undefined>>({});
  readonly changes: number[] = [];
  readonly dotRef = viewChild<TemplateRef<never>>('dot');

  optional(title: string): boolean | string {
    return title === 'B' ? true : title === 'C' ? 'Skippable' : false;
  }
}

describe('AndesSteps features', () => {
  function create() {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const root = fixture.nativeElement.querySelector(
      'andes-steps',
    ) as HTMLElement;
    const items = () =>
      Array.from(
        fixture.nativeElement.querySelectorAll('andes-step'),
      ) as HTMLElement[];
    const buttons = () =>
      Array.from(
        fixture.nativeElement.querySelectorAll('button.andes-step__trigger'),
      ) as HTMLButtonElement[];
    return { fixture, host: fixture.componentInstance, root, items, buttons };
  }

  /** The lucide name an `ng-icon` inside the step at `index` draws. */
  const iconAt = (fixture: ComponentFixture<Host>, index: number) =>
    fixture.debugElement
      .queryAll(By.directive(NgIcon))
      .find(
        (icon) =>
          icon.nativeElement.closest('andes-step') ===
          fixture.nativeElement.querySelectorAll('andes-step')[index],
      )
      ?.componentInstance.name();

  const flush = (fixture: ComponentFixture<Host>) => {
    fixture.detectChanges();
    fixture.detectChanges();
  };

  describe('type and variant', () => {
    it('mirrors the type, the variant and the connector onto the host and every step', () => {
      const { fixture, host, root, items } = create();
      host.type.set('panel');
      host.variant.set('outline');
      host.connector.set('dashed');
      flush(fixture);

      for (const element of [root, items()[0]]) {
        expect(element.getAttribute('data-type')).toBe('panel');
        expect(element.getAttribute('data-variant')).toBe('outline');
        expect(element.getAttribute('data-connector')).toBe('dashed');
      }
    });

    it('starts as the soft variant and the solid connector', () => {
      const { root } = create();

      expect(root.getAttribute('data-variant')).toBe('soft');
      expect(root.getAttribute('data-connector')).toBe('solid');
      expect(root.getAttribute('data-type')).toBe('default');
    });

    it('draws no marker in the panel, navigation or inline types unless a step has an icon', () => {
      const { fixture, host, items } = create();

      for (const type of ['panel', 'navigation', 'inline'] as const) {
        host.type.set(type);
        flush(fixture);

        expect(items()[0].querySelector('.andes-step__marker')).toBeNull();
      }

      host.type.set('panel');
      host.icons.set({ A: 'lucideStar' });
      flush(fixture);

      expect(items()[0].querySelector('.andes-step__marker')).toBeTruthy();
      expect(items()[1].querySelector('.andes-step__marker')).toBeNull();
    });
  });

  describe('panel type', () => {
    it('fills the current segment by the percent, as a custom property', () => {
      const { fixture, host, items } = create();
      host.type.set('panel');
      host.percent.set(60);
      flush(fixture);

      expect(items()[1].style.getPropertyValue('--_percent')).toBe('60%');
      expect(items()[0].style.getPropertyValue('--_percent')).toBe('');
      expect(items()[2].style.getPropertyValue('--_percent')).toBe('');
    });

    it('draws no ring around an icon, the percent being a fill in this type', () => {
      const { fixture, host, items } = create();
      host.type.set('panel');
      host.percent.set(60);
      host.icons.set({ B: 'lucideStar' });
      flush(fixture);

      expect(items()[1].querySelector('.andes-step__ring')).toBeTruthy();
      expect(items()[1].textContent).toContain('60%');
    });

    it('marks the first and the last segment so the ends can be rounded', () => {
      const { fixture, host, items } = create();
      host.type.set('panel');
      flush(fixture);

      expect(items()[0].hasAttribute('data-first')).toBe(true);
      expect(items()[3].hasAttribute('data-last')).toBe(true);
      expect(items()[1].hasAttribute('data-first')).toBe(false);
      expect(items()[1].hasAttribute('data-last')).toBe(false);
    });

    it('keeps the status words for assistive technology', () => {
      const { fixture, host, items } = create();
      host.type.set('panel');
      flush(fixture);

      expect(items()[1].textContent).toContain('In progress');
    });
  });

  describe('initial', () => {
    it('counts the numbers from the initial value while current stays a position', () => {
      const { fixture, host, items } = create();
      host.initial.set(5);
      flush(fixture);

      expect(items()[1].querySelector('.andes-step__number')?.textContent).toBe(
        '6',
      );
      expect(items()[1].getAttribute('aria-current')).toBe('step');
    });

    it('can start at zero', () => {
      const { fixture, host, items } = create();
      host.initial.set(0);
      flush(fixture);

      expect(items()[1].querySelector('.andes-step__number')?.textContent).toBe(
        '1',
      );
      expect(items()[2].querySelector('.andes-step__number')?.textContent).toBe(
        '2',
      );
    });
  });

  describe('optional', () => {
    it('shows the word Optional, or the text it is given', () => {
      const { items } = create();

      expect(
        items()[1].querySelector('.andes-step__optional')?.textContent,
      ).toBe('Optional');
      expect(
        items()[2].querySelector('.andes-step__optional')?.textContent,
      ).toBe('Skippable');
      expect(items()[0].querySelector('.andes-step__optional')).toBeNull();
      expect(items()[1].hasAttribute('data-optional')).toBe(true);
    });
  });

  describe('icons', () => {
    it('draws a lucide icon named by the step in place of the number', () => {
      const { fixture, host, items } = create();
      host.icons.set({ C: 'lucideStar' });
      flush(fixture);

      const glyph = items()[2].querySelector('ng-icon.andes-step__glyph');

      expect(iconAt(fixture, 2)).toBe('lucideStar');
      expect(glyph?.querySelector('svg')).toBeTruthy();
      expect(items()[2].querySelector('.andes-step__number')).toBeNull();
    });

    it('replaces the marker of every step in a status with the status icons', () => {
      const { fixture, host, items } = create();
      host.statusIcons.set({ finish: 'lucideStar' });
      flush(fixture);

      expect(iconAt(fixture, 0)).toBe('lucideStar');
      expect(items()[1].querySelector('.andes-step__number')).toBeTruthy();
    });

    it("lets a step's own icon win over the status icons", () => {
      const { fixture, host } = create();
      host.statusIcons.set({ finish: 'lucideCheck' });
      host.icons.set({ A: 'lucideStar' });
      flush(fixture);

      expect(iconAt(fixture, 0)).toBe('lucideStar');
    });

    it('draws every dot from the dot template with the status and the index', () => {
      const { fixture, host, items } = create();
      host.type.set('dot');
      host.dotTemplate.set(host.dotRef());
      flush(fixture);

      expect(items()[0].querySelector('.dot')?.textContent).toBe('finish-0');
      expect(items()[1].querySelector('.dot')?.textContent).toBe('process-1');
      expect(
        items()[0]
          .querySelector('.andes-step__marker')
          ?.getAttribute('data-marker'),
      ).toBe('dot-template');
    });
  });

  describe('classNames and styles', () => {
    it('adds classes and styles to the named parts', () => {
      const { fixture, host, root, items } = create();
      host.classNames.set({
        root: 'r',
        item: 'i',
        title: 't',
        tail: 'l',
        rail: 'a',
      });
      host.styles.set({
        icon: { borderRadius: '0.25rem' },
        title: { color: 'red' },
      });
      flush(fixture);

      expect(root.classList.contains('r')).toBe(true);
      expect(items()[0].classList.contains('i')).toBe(true);
      expect(items()[0].querySelector('.andes-step__title.t')).toBeTruthy();
      expect(items()[0].querySelector('.andes-step__tail.l')).toBeTruthy();
      expect(items()[0].querySelector('.andes-step__rail.a')).toBeTruthy();
      expect(
        (items()[0].querySelector('.andes-step__title') as HTMLElement).style
          .color,
      ).toBe('red');
      expect(
        (items()[0].querySelector('.andes-step__marker') as HTMLElement).style
          .borderRadius,
      ).toBe('0.25rem');
    });

    it('calls a function with the state of the trail and of the step', () => {
      const { fixture, host, items } = create();
      host.classNames.set(
        (info) =>
          ({
            item: `${info.stepStatus}-${info.index}-${info.type}-${info.current}`,
          }) as never,
      );
      flush(fixture);

      expect(items()[0].classList.contains('finish-0-default-1')).toBe(true);
      expect(items()[1].classList.contains('process-1-default-1')).toBe(true);
      expect(items()[2].classList.contains('wait-2-default-1')).toBe(true);
    });

    it('re-evaluates the function when the current step changes', () => {
      const { fixture, host, items } = create();
      host.classNames.set((info) => ({ item: `at-${info.current}` }));
      flush(fixture);
      host.current.set(2);
      flush(fixture);

      expect(items()[0].classList.contains('at-2')).toBe(true);
    });
  });

  describe('maxCount', () => {
    const twelve = Array.from({ length: 12 }, (_, index) => `S${index + 1}`);

    function folded() {
      const context = create();
      context.host.titles.set(twelve);
      context.host.maxCount.set(5);
      context.host.current.set(5);
      flush(context.fixture);
      return context;
    }

    it('hides the folded steps and draws a marker for each folded run', () => {
      const { fixture, items } = folded();
      const shown = items().filter((step) => !step.hasAttribute('data-folded'));

      expect(
        shown.map((step) =>
          step.querySelector('.andes-step__title-text')?.textContent?.trim(),
        ),
      ).toEqual(['S1', 'S6', 'S12']);
      expect(
        fixture.nativeElement.querySelectorAll('andes-steps-more'),
      ).toHaveLength(2);
    });

    it('orders the markers between the steps they separate', () => {
      const { fixture, items } = folded();
      const more = Array.from(
        fixture.nativeElement.querySelectorAll('andes-steps-more'),
      ) as HTMLElement[];

      expect(more.map((marker) => marker.style.order)).toEqual(['2', '12']);
      expect(items()[0].style.order).toBe('0');
      expect(items()[5].style.order).toBe('10');
    });

    it('names the marker after how many steps it hides', () => {
      const { fixture } = folded();
      const buttons = fixture.nativeElement.querySelectorAll(
        'andes-steps-more button',
      );

      expect(buttons[0].getAttribute('aria-label')).toBe('4 more steps');
      expect(buttons[1].getAttribute('aria-label')).toBe('5 more steps');
    });

    it('moves the folded runs with the current step', () => {
      const { fixture, host, items } = folded();
      host.current.set(0);
      flush(fixture);

      const shown = items().filter((step) => !step.hasAttribute('data-folded'));

      expect(shown).toHaveLength(4);
      expect(
        fixture.nativeElement.querySelectorAll('andes-steps-more'),
      ).toHaveLength(1);
    });

    it('lists the folded steps with their status and selects one from a clickable trail', async () => {
      const { fixture, host, items } = folded();
      host.clickable.set(true);
      flush(fixture);
      const marker = fixture.nativeElement.querySelector(
        'andes-steps-more button',
      ) as HTMLButtonElement;
      marker.click();
      flush(fixture);
      await fixture.whenStable();
      flush(fixture);

      const entries = Array.from(
        document.querySelectorAll('.andes-step__more-entry'),
      ) as HTMLElement[];

      expect(
        entries.map((entry) => entry.textContent?.replace(/\s+/g, ' ').trim()),
      ).toEqual([
        'S2, Completed',
        'S3, Completed',
        'S4, Completed',
        'S5, Completed',
      ]);

      entries[1].click();
      flush(fixture);

      expect(host.current()).toBe(2);
      expect(host.changes).toEqual([2]);
      expect(items()[2].getAttribute('aria-current')).toBe('step');
    });

    it('does not fold when the trail fits', () => {
      const { fixture, host } = create();
      host.maxCount.set(10);
      flush(fixture);

      expect(
        fixture.nativeElement.querySelectorAll('andes-steps-more'),
      ).toHaveLength(0);
    });

    it('skips folded steps when the arrow keys move the focus', () => {
      const { fixture, host, buttons } = folded();
      host.clickable.set(true);
      flush(fixture);
      const first = buttons()[0];
      first.focus();
      first.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'ArrowRight',
          bubbles: true,
          cancelable: true,
        }),
      );

      expect(document.activeElement?.textContent).toContain('S6');
    });
  });

  describe('hiddenRanges', () => {
    const lengths = (ranges: { start: number; end: number }[]) =>
      ranges.map((range) => [range.start, range.end]);

    it('returns nothing when the limit is off or the trail fits', () => {
      expect(hiddenRanges(5, undefined, 0)).toEqual([]);
      expect(hiddenRanges(5, 2, 0)).toEqual([]);
      expect(hiddenRanges(5, 5, 2)).toEqual([]);
    });

    it('folds the end when the current step is at the start', () => {
      expect(lengths(hiddenRanges(12, 5, 0))).toEqual([[3, 10]]);
    });

    it('folds the start when the current step is at the end', () => {
      expect(lengths(hiddenRanges(12, 5, 11))).toEqual([[1, 8]]);
    });

    it('folds both sides around a current step in the middle', () => {
      expect(lengths(hiddenRanges(12, 5, 5))).toEqual([
        [1, 4],
        [6, 10],
      ]);
    });

    it('never folds a single step, which would cost the slot it saves', () => {
      const ranges = hiddenRanges(8, 5, 3);
      for (const range of ranges) {
        expect(range.end - range.start).toBeGreaterThanOrEqual(1);
      }
    });

    it('always keeps the first, the last and the current step visible', () => {
      for (let current = 0; current < 20; current++) {
        const ranges = hiddenRanges(20, 6, current);

        expect(isFolded(ranges, 0)).toBe(false);
        expect(isFolded(ranges, 19)).toBe(false);
        expect(isFolded(ranges, current)).toBe(false);
      }
    });

    it('keeps the number of slots within the limit', () => {
      for (let current = 0; current < 20; current++) {
        const ranges = hiddenRanges(20, 7, current);
        const folded = ranges.reduce(
          (sum, range) => sum + range.end - range.start + 1,
          0,
        );

        expect(20 - folded + ranges.length).toBeLessThanOrEqual(7);
      }
    });
  });

  describe('roving tab stop', () => {
    it('gives the tab stop to the current step and to nobody else', () => {
      const { fixture, host, buttons } = create();
      host.clickable.set(true);
      flush(fixture);

      expect(buttons().map((button) => button.tabIndex)).toEqual([
        -1, 0, -1, -1,
      ]);
    });

    it('falls to the first enabled step when the current one is disabled', () => {
      const { fixture, host, buttons } = create();
      host.clickable.set(true);
      host.disabled.set(['B']);
      flush(fixture);

      expect(buttons().map((button) => button.tabIndex)).toEqual([
        0, -1, -1, -1,
      ]);
    });

    it('follows the focus and goes back to the current step on blur', () => {
      const { fixture, host, buttons } = create();
      host.clickable.set(true);
      flush(fixture);
      buttons()[3].focus();
      flush(fixture);

      expect(buttons().map((button) => button.tabIndex)).toEqual([
        -1, -1, -1, 0,
      ]);

      buttons()[3].blur();
      flush(fixture);

      expect(buttons().map((button) => button.tabIndex)).toEqual([
        -1, 0, -1, -1,
      ]);
    });
  });

  describe('beforeChange', () => {
    it('keeps the current step when the guard says no', () => {
      const { fixture, host, buttons } = create();
      host.clickable.set(true);
      host.beforeChange.set(() => false);
      flush(fixture);
      buttons()[2].click();
      flush(fixture);

      expect(host.current()).toBe(1);
      expect(host.changes).toEqual([]);
    });

    it('moves when the guard says yes and tells it where from and to', () => {
      const { fixture, host, buttons } = create();
      const guard = vi.fn(() => true);
      host.clickable.set(true);
      host.beforeChange.set(guard);
      flush(fixture);
      buttons()[3].click();
      flush(fixture);

      expect(guard).toHaveBeenCalledWith(3, 1);
      expect(host.current()).toBe(3);
      expect(host.changes).toEqual([3]);
    });

    it('waits for a promise before moving', async () => {
      const { fixture, host, buttons } = create();
      host.clickable.set(true);
      host.beforeChange.set(() => Promise.resolve(true));
      flush(fixture);
      buttons()[2].click();

      expect(host.current()).toBe(1);

      await fixture.whenStable();
      flush(fixture);

      expect(host.current()).toBe(2);
    });

    it('stays when a promise resolves to false', async () => {
      const { fixture, host, buttons } = create();
      host.clickable.set(true);
      host.beforeChange.set(() => Promise.resolve(false));
      flush(fixture);
      buttons()[2].click();
      await fixture.whenStable();
      flush(fixture);

      expect(host.current()).toBe(1);
    });
  });

  describe('next and previous', () => {
    it('move the current step without emitting changed, and stop at both ends', () => {
      const { fixture, host, root } = create();
      const steps = fixture.debugElement.children[0]
        .componentInstance as AndesSteps;
      expect(root).toBeTruthy();

      steps.next();
      steps.next();
      steps.next();
      flush(fixture);

      expect(host.current()).toBe(3);

      steps.previous();
      steps.previous();
      steps.previous();
      steps.previous();
      flush(fixture);

      expect(host.current()).toBe(0);
      expect(host.changes).toEqual([]);
    });
  });

  describe('step panels', () => {
    const panel = (fixture: ComponentFixture<Host>, name: string) =>
      fixture.nativeElement.querySelector(`.${name}`) as HTMLElement;

    it('shows only the panel of the current step', () => {
      const { fixture } = create();

      expect(panel(fixture, 'p0').hasAttribute('hidden')).toBe(true);
      expect(panel(fixture, 'p1').hasAttribute('hidden')).toBe(false);
      expect(panel(fixture, 'p1').hasAttribute('data-active')).toBe(true);
    });

    it('follows the current step and honours an explicit step', () => {
      const { fixture, host } = create();
      host.current.set(3);
      flush(fixture);

      expect(panel(fixture, 'p1').hasAttribute('hidden')).toBe(true);
      expect(panel(fixture, 'pn').hasAttribute('hidden')).toBe(false);
    });

    it('is a region named by the title of its step and stays in the DOM when hidden', () => {
      const { fixture, items } = create();
      const labelled = panel(fixture, 'p1').getAttribute('aria-labelledby');

      expect(panel(fixture, 'p1').getAttribute('role')).toBe('region');
      expect(labelled).toBeTruthy();
      expect(
        items()[1].querySelector(`#${labelled}`)?.textContent?.trim(),
      ).toBe('B');
      expect(panel(fixture, 'p0').textContent).toContain('First panel');
    });
  });

  describe('offset', () => {
    it('sets the offset and the step count as custom properties for the inline grid', () => {
      const { fixture, host, root } = create();
      host.type.set('inline');
      host.offset.set(2);
      flush(fixture);

      expect(root.style.getPropertyValue('--andes-steps-offset')).toBe('2');
      expect(root.style.getPropertyValue('--andes-steps-count')).toBe('4');
    });
  });

  describe('motion flag', () => {
    it('marks the trail ready after the first render so glyphs do not animate on load', () => {
      const { root, items } = create();

      expect(root.hasAttribute('data-ready')).toBe(true);
      expect(items()[0].hasAttribute('data-ready')).toBe(true);
    });
  });

  describe('stylesheet contract', () => {
    const step = readFileSync('packages/ui/src/lib/steps/step.css', 'utf8');

    it('fills the connector with a 300ms transform transition', () => {
      expect(step).toContain('.andes-step__rail');
      expect(step).toContain('transform: scaleX(0)');
      expect(step).toContain('var(--andes-motion-duration-slow, 300ms)');
    });

    it('cuts dashed and dotted connectors with a mask', () => {
      expect(step).toContain("[data-connector='dashed']");
      expect(step).toContain("[data-connector='dotted']");
      expect(step).toContain('mask-image: repeating-linear-gradient');
    });

    it('plays the glyph entrance only after the first render and never under reduced motion', () => {
      expect(step).toContain(':host([data-ready]) .andes-step__glyph');
      const reduced = atRule(step, '@media (prefers-reduced-motion: reduce)');

      expect(reduced).toContain('animation: none');
    });

    it('keeps the markers and connectors visible in forced colours', () => {
      const forced = atRule(step, '@media (forced-colors: active)');

      expect(forced).toContain('CanvasText');
      expect(forced).toContain('Highlight');
    });

    it('sizes the markers at 24px, and 20px when small', () => {
      expect(step).toContain('--_icon: 1.5rem;');
      expect(step).toContain('--_icon: 1.25rem;');
    });

    it('spaces the marker, the title and the connector by at least 8px', () => {
      expect(step).toContain('--_gap: 0.75rem;');
      expect(step).toContain('--_space: 0.75rem;');
    });

    it('mirrors the fill under right-to-left', () => {
      expect(step).toContain(':host(:dir(rtl)) .andes-step__rail');
      expect(step).toContain('transform-origin: right center');
    });
  });

  describe('panel geometry', () => {
    // One line, no space inside parentheses, so a selector the formatter broke still matches.
    const chevron = readFileSync(
      'packages/ui/src/lib/steps/step-chevron.css',
      'utf8',
    )
      .replace(/\s+/g, ' ')
      .replace(/\( /g, '(')
      .replace(/ \)/g, ')');
    /** The points of every polygon that follows `selector {` and `clip-path:`. */
    const polygons = (selector: string): string[][] => {
      const found: string[][] = [];
      for (
        let at = chevron.indexOf(selector);
        at !== -1;
        at = chevron.indexOf(selector, at + 1)
      ) {
        const open = chevron.indexOf('polygon(', at);
        const close = chevron.indexOf(');', open);
        found.push(
          chevron
            .slice(open + 'polygon('.length, close)
            .split(/,\s*(?![^()]*\))/)
            .map((point) => point.trim()),
        );
      }
      return found;
    };
    const host = (parts: string) => `:host(${parts}) .andes-step__trigger {`;

    it('cuts a first segment with a tip, a middle one with a tip and a notch, and a last one with a notch', () => {
      const base = "[data-type='panel'][data-orientation='horizontal']";
      const [first] = polygons(host(`${base}[data-first]:not([data-last])`));
      const [middle] = polygons(
        host(`${base}:not([data-first]):not([data-last])`),
      );
      const [last] = polygons(host(`${base}[data-last]:not([data-first])`));

      expect(first).toHaveLength(5);
      expect(middle).toHaveLength(6);
      expect(last).toHaveLength(5);
      expect(first).toContain('100% 50%');
      expect(middle).toContain('var(--_tip) 50%');
      expect(last).toContain('var(--_tip) 50%');
    });

    it('gives the tip and the notch of two neighbours the same depth', () => {
      const base = "[data-type='panel'][data-orientation='horizontal']";
      const [middle] = polygons(
        host(`${base}:not([data-first]):not([data-last])`),
      );

      expect(middle).toContain('calc(100% - var(--_tip)) 0');
      expect(middle).toContain('calc(100% - var(--_tip)) 100%');
      expect(chevron).toContain('--_tip: 1.25rem;');
      expect(chevron).toContain(
        'margin-inline-start: calc(var(--_tip) * -1 + var(--_line))',
      );
    });

    it('mirrors every horizontal polygon under right-to-left', () => {
      const base =
        ":dir(rtl)[data-type='panel'][data-orientation='horizontal']";
      const [first] = polygons(host(`${base}[data-first]:not([data-last])`));
      const [last] = polygons(host(`${base}[data-last]:not([data-first])`));

      expect(first).toContain('0 50%');
      expect(first[0]).toBe('100% 0');
      expect(last).toContain('calc(100% - var(--_tip)) 50%');
    });

    it('points down when stacked, with the notch on top and the tip at the bottom', () => {
      const base = "[data-type='panel'][data-orientation='vertical']";
      const [middle] = polygons(
        host(`${base}:not([data-first]):not([data-last])`),
      );

      expect(middle).toContain('50% var(--_tip-v)');
      expect(middle).toContain('50% 100%');
      expect(middle).toHaveLength(6);
    });

    it('draws the outline with a second layer pulled in by the line width', () => {
      expect(chevron).toContain('.andes-step__trigger::before {');
      expect(chevron).toContain('inset-block: var(--_seg-b);');
      expect(chevron).toContain('background: var(--_seg-edge);');
      expect(chevron).toContain('--_seg-b: 1px;');
      expect(chevron).toContain('calc(var(--_radius) - var(--_seg-b))');
    });

    it('does not pull the notch in, so the shared edge is drawn once, by the tip before it', () => {
      const base = "[data-type='panel'][data-orientation='horizontal']";
      const [inner] = polygons(
        `:host(${base}:not([data-first]):not([data-last])) .andes-step__trigger::before {`,
      );

      expect(inner[0]).toBe('0 0');
      expect(inner).toContain('var(--_tip) 50%');
      expect(inner).toContain('calc(100% - var(--_tip) - var(--_s)) 0');
    });

    it('rings the focused segment by widening the line, so the ring follows the shape', () => {
      expect(chevron).toContain('button.andes-step__trigger:focus-visible');
      expect(chevron).toContain('--_seg-b: 2px;');
      expect(chevron).toContain('outline: none;');
    });

    it('has a hover and a pressed colour for a clickable trail, and dims a disabled step', () => {
      expect(chevron).toContain('button.andes-step__trigger:hover');
      expect(chevron).toContain('button.andes-step__trigger:active');
      expect(chevron).toContain('[data-disabled]) .andes-step__trigger');
    });

    it('is drawn with CSS only: no svg, no path, no physical offsets', () => {
      expect(chevron).not.toContain('<svg');
      expect(chevron).not.toContain('path(');
      expect(chevron).not.toMatch(/\b(?:margin|padding)-(?:left|right)\b/);
      expect(chevron).not.toMatch(/^\s*(?:left|right)\s*:/m);
    });

    it('keeps the segments visible in forced colours', () => {
      const forced = atRule(chevron, '@media (forced-colors: active)');

      expect(forced).toContain('Highlight');
      expect(forced).toContain('CanvasText');
    });

    it('draws each look from the variant: filled for soft and solid, outlined for outline and plain', () => {
      expect(chevron).toContain("[data-variant='soft'][data-status='process']");
      expect(chevron).toContain("[data-variant='solid'][data-status='finish']");
      expect(chevron).toContain(
        "[data-variant='outline'][data-status='error']",
      );
      expect(chevron).toContain("[data-variant='plain']");
    });

    it('names the surface the fills are mixed over', () => {
      expect(chevron).toContain('--andes-steps-surface');
    });
  });
});
