import { Directionality } from '@angular/cdk/bidi';
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { readFileSync } from 'node:fs';

import { AndesSegmented } from './segmented';
import { AndesSegmentedOption } from './segmented-option';
import {
  AndesSegmentedChange,
  AndesSegmentedMotion,
  AndesSegmentedOptionInput,
  AndesSegmentedStatus,
  AndesSegmentedVariant,
} from './segmented-types';

function radios(root: HTMLElement): HTMLButtonElement[] {
  return Array.from(root.querySelectorAll('button[role="radio"]'));
}

function key(target: HTMLElement, name: string): KeyboardEvent {
  const event = new KeyboardEvent('keydown', {
    key: name,
    bubbles: true,
    cancelable: true,
  });
  target.dispatchEvent(event);
  return event;
}

function rtl(): void {
  TestBed.overrideProvider(Directionality, {
    useValue: {
      value: 'rtl',
      change: { subscribe: () => ({ unsubscribe: () => undefined }) },
    },
  });
}

@Component({
  imports: [AndesSegmented],
  template: `<andes-segmented
      aria-label="Plan"
      [(value)]="value"
      [options]="options()"
      [status]="status()"
      [aria-invalid]="invalid()"
      [variant]="variant()"
      [readOnly]="readOnly()"
      [motion]="motion()"
      [scrollable]="scrollable()"
      [vertical]="vertical()"
      [loop]="loop()"
      [columns]="columns()"
      [block]="block()"
      [autoFocus]="autoFocus()"
      (selectionChange)="changes.push($event)"
      (focused)="events.push('focused')"
      (blurred)="events.push('blurred')"
    />
    <button id="outside" type="button">outside</button>`,
})
class FeaturesHost {
  readonly value = signal<string | null>('b');
  readonly options = signal<AndesSegmentedOptionInput<string>[]>([
    'a',
    'b',
    'c',
    { label: 'Dis', value: 'd', disabled: true },
    'e',
  ]);
  readonly status = signal<AndesSegmentedStatus | undefined>(undefined);
  readonly invalid = signal(false);
  readonly variant = signal<AndesSegmentedVariant>('default');
  readonly readOnly = signal(false);
  readonly motion = signal<AndesSegmentedMotion | undefined>(undefined);
  readonly scrollable = signal(false);
  readonly vertical = signal(false);
  readonly loop = signal(true);
  readonly columns = signal<unknown>(undefined);
  readonly block = signal(false);
  readonly autoFocus = signal(false);
  readonly changes: AndesSegmentedChange<string>[] = [];
  readonly events: string[] = [];
}

@Component({
  imports: [AndesSegmented, AndesSegmentedOption],
  template: `<andes-segmented aria-label="Mode" value="x">
    <andes-segmented-option value="x" description="Fast and cheap"
      >Quick</andes-segmented-option
    >
    <andes-segmented-option value="y">Plain</andes-segmented-option>
  </andes-segmented>`,
})
class ProjectedDescriptionHost {}

@Component({
  imports: [AndesSegmented, ReactiveFormsModule],
  template: `<andes-segmented
    aria-label="Plan"
    readOnly
    [formControl]="control"
    [options]="['a', 'b', 'c']"
  />`,
})
class ReadOnlyFormHost {
  readonly control = new FormControl<string | null>('b');
}

async function setup() {
  const fixture = TestBed.createComponent(FeaturesHost);
  fixture.detectChanges();
  await fixture.whenStable();
  const root = fixture.nativeElement as HTMLElement;
  return {
    fixture,
    host: fixture.componentInstance,
    root,
    group: root.querySelector('andes-segmented') as HTMLElement,
    buttons: () => radios(root),
  };
}

/** jsdom has no layout: give the track the geometry a scrollable browser would report. */
function stubGeometry(
  element: HTMLElement,
  geometry: Partial<
    Record<
      | 'scrollWidth'
      | 'clientWidth'
      | 'scrollLeft'
      | 'scrollHeight'
      | 'clientHeight'
      | 'scrollTop',
      number
    >
  >,
): void {
  for (const [name, value] of Object.entries(geometry)) {
    Object.defineProperty(element, name, { configurable: true, value });
  }
}

describe('AndesSegmented status', () => {
  it('error sets aria-invalid and data-status', async () => {
    const { fixture, host, group } = await setup();
    expect(group.hasAttribute('aria-invalid')).toBe(false);
    expect(group.hasAttribute('data-status')).toBe(false);

    host.status.set('error');
    fixture.detectChanges();
    expect(group.getAttribute('aria-invalid')).toBe('true');
    expect(group.getAttribute('data-status')).toBe('error');
  });

  it('warning only paints: no aria-invalid', async () => {
    const { fixture, host, group } = await setup();
    host.status.set('warning');
    fixture.detectChanges();
    expect(group.getAttribute('data-status')).toBe('warning');
    expect(group.hasAttribute('aria-invalid')).toBe(false);
  });

  it('keeps the aria-invalid input working as the error state', async () => {
    const { fixture, host, group } = await setup();
    host.invalid.set(true);
    fixture.detectChanges();
    expect(group.getAttribute('aria-invalid')).toBe('true');
    expect(group.getAttribute('data-status')).toBe('error');

    host.status.set('warning');
    fixture.detectChanges();
    // an explicit invalid flag still wins over the softer tier
    expect(group.getAttribute('data-status')).toBe('error');
  });
});

describe('AndesSegmented variant', () => {
  it('exposes the variant, defaulting to the original look', async () => {
    const { fixture, host, group } = await setup();
    expect(group.getAttribute('data-variant')).toBe('default');
    for (const variant of ['outlined', 'filled', 'borderless'] as const) {
      host.variant.set(variant);
      fixture.detectChanges();
      expect(group.getAttribute('data-variant')).toBe(variant);
    }
  });
});

describe('AndesSegmented readOnly', () => {
  it('is announced, focusable and changes nothing', async () => {
    const { fixture, host, group, buttons } = await setup();
    host.readOnly.set(true);
    fixture.detectChanges();

    expect(group.getAttribute('aria-readonly')).toBe('true');
    expect(group.hasAttribute('data-readonly')).toBe(true);
    expect(group.hasAttribute('aria-disabled')).toBe(false);
    expect(
      buttons().every((b) => b.getAttribute('aria-disabled') === null),
    ).toBe(true);
    expect(buttons()[1].getAttribute('tabindex')).toBe('0');
    expect(buttons()[1].disabled).toBe(false);
    expect(
      group
        .querySelector('andes-segmented-option')
        ?.hasAttribute('data-readonly'),
    ).toBe(true);

    buttons()[2].click();
    fixture.detectChanges();
    expect(host.value()).toBe('b');
    expect(host.changes).toHaveLength(0);
  });

  it('moves focus with the arrow keys and Home/End without selecting', async () => {
    const { fixture, host, buttons } = await setup();
    host.readOnly.set(true);
    fixture.detectChanges();
    buttons()[1].focus();

    const next = key(buttons()[1], 'ArrowRight');
    expect(next.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(buttons()[2]);
    key(buttons()[2], 'End');
    expect(document.activeElement).toBe(buttons()[4]);
    key(buttons()[4], 'Home');
    expect(document.activeElement).toBe(buttons()[0]);
    fixture.detectChanges();
    expect(host.value()).toBe('b');
    expect(host.changes).toHaveLength(0);
  });

  it('selects again once switched off', async () => {
    const { fixture, host, buttons } = await setup();
    host.readOnly.set(true);
    fixture.detectChanges();
    host.readOnly.set(false);
    fixture.detectChanges();
    buttons()[2].click();
    expect(host.value()).toBe('c');
  });

  it('does not write to a form control or mark it dirty', async () => {
    const fixture = TestBed.createComponent(ReadOnlyFormHost);
    fixture.detectChanges();
    await fixture.whenStable();
    const buttons = radios(fixture.nativeElement);
    buttons[2].click();
    fixture.detectChanges();
    expect(fixture.componentInstance.control.value).toBe('b');
    expect(fixture.componentInstance.control.dirty).toBe(false);
  });
});

describe('AndesSegmented motion', () => {
  it('writes the duration and easing to the documented custom properties', async () => {
    const { fixture, host, group } = await setup();
    expect(group.style.getPropertyValue('--andes-segmented-duration')).toBe('');
    expect(group.style.getPropertyValue('--andes-segmented-easing')).toBe('');

    host.motion.set({ duration: 300, easing: 'ease-in-out' });
    fixture.detectChanges();
    expect(group.style.getPropertyValue('--andes-segmented-duration')).toBe(
      '300ms',
    );
    expect(group.style.getPropertyValue('--andes-segmented-easing')).toBe(
      'ease-in-out',
    );

    host.motion.set({ duration: '0.4s' });
    fixture.detectChanges();
    expect(group.style.getPropertyValue('--andes-segmented-duration')).toBe(
      '0.4s',
    );
    expect(group.style.getPropertyValue('--andes-segmented-easing')).toBe('');
  });

  it('treats 0 as an instant snap and never goes negative', async () => {
    const { fixture, host, group } = await setup();
    host.motion.set({ duration: 0 });
    fixture.detectChanges();
    expect(group.style.getPropertyValue('--andes-segmented-duration')).toBe(
      '0ms',
    );
    host.motion.set({ duration: -50 });
    fixture.detectChanges();
    expect(group.style.getPropertyValue('--andes-segmented-duration')).toBe(
      '0ms',
    );
  });
});

describe('AndesSegmented scrollable', () => {
  it('is off by default and marks the track when on', async () => {
    const { fixture, host, group } = await setup();
    expect(group.hasAttribute('data-scrollable')).toBe(false);
    host.scrollable.set(true);
    fixture.detectChanges();
    expect(group.hasAttribute('data-scrollable')).toBe(true);
  });

  it('shows an edge fade only on sides that have more content', async () => {
    const { fixture, host, group } = await setup();
    host.scrollable.set(true);
    fixture.detectChanges();

    stubGeometry(group, { scrollWidth: 600, clientWidth: 200, scrollLeft: 0 });
    group.dispatchEvent(new Event('scroll'));
    fixture.detectChanges();
    expect(group.hasAttribute('data-fade-before')).toBe(false);
    expect(group.hasAttribute('data-fade-after')).toBe(true);

    stubGeometry(group, { scrollLeft: 150 });
    group.dispatchEvent(new Event('scroll'));
    fixture.detectChanges();
    expect(group.hasAttribute('data-fade-before')).toBe(true);
    expect(group.hasAttribute('data-fade-after')).toBe(true);

    stubGeometry(group, { scrollLeft: 400 });
    group.dispatchEvent(new Event('scroll'));
    fixture.detectChanges();
    expect(group.hasAttribute('data-fade-before')).toBe(true);
    expect(group.hasAttribute('data-fade-after')).toBe(false);
  });

  it('shows no fade when everything fits', async () => {
    const { fixture, host, group } = await setup();
    host.scrollable.set(true);
    fixture.detectChanges();
    stubGeometry(group, { scrollWidth: 200, clientWidth: 200, scrollLeft: 0 });
    group.dispatchEvent(new Event('scroll'));
    fixture.detectChanges();
    expect(group.hasAttribute('data-fade-before')).toBe(false);
    expect(group.hasAttribute('data-fade-after')).toBe(false);
  });

  it('reads the right-to-left scroll range (negative positions) correctly', async () => {
    rtl();
    const { fixture, host, group } = await setup();
    host.scrollable.set(true);
    fixture.detectChanges();

    // At rest in RTL the track sits at its right end: more content lies to the left (before).
    stubGeometry(group, { scrollWidth: 600, clientWidth: 200, scrollLeft: 0 });
    group.dispatchEvent(new Event('scroll'));
    fixture.detectChanges();
    expect(group.hasAttribute('data-fade-before')).toBe(true);
    expect(group.hasAttribute('data-fade-after')).toBe(false);

    stubGeometry(group, { scrollLeft: -400 });
    group.dispatchEvent(new Event('scroll'));
    fixture.detectChanges();
    expect(group.hasAttribute('data-fade-before')).toBe(false);
    expect(group.hasAttribute('data-fade-after')).toBe(true);
  });

  it('uses the vertical axis with vertical', async () => {
    const { fixture, host, group } = await setup();
    host.scrollable.set(true);
    host.vertical.set(true);
    fixture.detectChanges();
    stubGeometry(group, {
      scrollHeight: 500,
      clientHeight: 100,
      scrollTop: 50,
      scrollWidth: 100,
      clientWidth: 100,
    });
    group.dispatchEvent(new Event('scroll'));
    fixture.detectChanges();
    expect(group.hasAttribute('data-fade-before')).toBe(true);
    expect(group.hasAttribute('data-fade-after')).toBe(true);
  });

  it('clears the fades when scrollable is switched off', async () => {
    const { fixture, host, group } = await setup();
    host.scrollable.set(true);
    fixture.detectChanges();
    stubGeometry(group, { scrollWidth: 600, clientWidth: 200, scrollLeft: 0 });
    group.dispatchEvent(new Event('scroll'));
    fixture.detectChanges();
    expect(group.hasAttribute('data-fade-after')).toBe(true);

    host.scrollable.set(false);
    fixture.detectChanges();
    group.dispatchEvent(new Event('scroll'));
    fixture.detectChanges();
    expect(group.hasAttribute('data-fade-after')).toBe(false);
  });

  it('scrolls the active option into view on keyboard moves', async () => {
    const { fixture, host, group, buttons } = await setup();
    host.scrollable.set(true);
    fixture.detectChanges();
    const scrollTo = vi.fn();
    (group as unknown as { scrollTo: unknown }).scrollTo = scrollTo;
    stubGeometry(group, { clientWidth: 100, scrollLeft: 0, scrollWidth: 500 });
    const target = buttons()[2].closest(
      'andes-segmented-option',
    ) as HTMLElement;
    Object.defineProperty(target, 'offsetLeft', { value: 250 });
    Object.defineProperty(target, 'offsetWidth', { value: 60 });

    buttons()[1].focus();
    key(buttons()[1], 'ArrowRight');
    fixture.detectChanges();

    // 250 + 60 + 20px margin - 100px viewport, so the option clears the fade
    expect(scrollTo).toHaveBeenCalledWith(
      expect.objectContaining({ left: 230 }),
    );
    expect(host.value()).toBe('c');
  });

  it('does not scroll an option that is already in view', async () => {
    const { fixture, host, group, buttons } = await setup();
    host.scrollable.set(true);
    fixture.detectChanges();
    const scrollTo = vi.fn();
    (group as unknown as { scrollTo: unknown }).scrollTo = scrollTo;
    stubGeometry(group, { clientWidth: 400, scrollLeft: 0, scrollWidth: 500 });
    const target = buttons()[2].closest(
      'andes-segmented-option',
    ) as HTMLElement;
    Object.defineProperty(target, 'offsetLeft', { value: 100 });
    Object.defineProperty(target, 'offsetWidth', { value: 60 });

    buttons()[1].focus();
    key(buttons()[1], 'ArrowRight');
    expect(scrollTo).not.toHaveBeenCalled();
  });

  it('scrolls toward the start when the option lies before the viewport', async () => {
    const { fixture, host, group, buttons } = await setup();
    host.scrollable.set(true);
    fixture.detectChanges();
    const scrollTo = vi.fn();
    (group as unknown as { scrollTo: unknown }).scrollTo = scrollTo;
    stubGeometry(group, {
      clientWidth: 100,
      scrollLeft: 300,
      scrollWidth: 500,
    });
    const target = buttons()[0].closest(
      'andes-segmented-option',
    ) as HTMLElement;
    Object.defineProperty(target, 'offsetLeft', { value: 4 });
    Object.defineProperty(target, 'offsetWidth', { value: 60 });

    buttons()[1].focus();
    key(buttons()[1], 'ArrowLeft');
    expect(scrollTo).toHaveBeenCalledWith(
      expect.objectContaining({ left: -16 }),
    );
  });

  it('does not touch the scroll position when not scrollable', async () => {
    const { group, buttons } = await setup();
    const scrollTo = vi.fn();
    (group as unknown as { scrollTo: unknown }).scrollTo = scrollTo;
    buttons()[1].focus();
    key(buttons()[1], 'ArrowRight');
    expect(scrollTo).not.toHaveBeenCalled();
  });
});

describe('AndesSegmented loop, Home and End', () => {
  it('wraps by default in both directions', async () => {
    const { fixture, host, buttons } = await setup();
    host.value.set('e');
    fixture.detectChanges();
    buttons()[4].focus();
    key(buttons()[4], 'ArrowRight');
    fixture.detectChanges();
    expect(host.value()).toBe('a');
    key(buttons()[0], 'ArrowLeft');
    fixture.detectChanges();
    expect(host.value()).toBe('e');
  });

  it('stops at the ends with loop off, swallowing the key', async () => {
    const { fixture, host, buttons } = await setup();
    host.loop.set(false);
    host.value.set('e');
    fixture.detectChanges();
    buttons()[4].focus();
    host.changes.length = 0;

    for (const name of ['ArrowRight', 'ArrowDown']) {
      const event = key(buttons()[4], name);
      expect(event.defaultPrevented).toBe(true);
    }
    fixture.detectChanges();
    expect(host.value()).toBe('e');
    expect(host.changes).toHaveLength(0);
    expect(document.activeElement).toBe(buttons()[4]);

    key(buttons()[4], 'ArrowLeft');
    fixture.detectChanges();
    expect(host.value()).toBe('c'); // the disabled "Dis" option is skipped

    host.value.set('a');
    fixture.detectChanges();
    buttons()[0].focus();
    key(buttons()[0], 'ArrowLeft');
    key(buttons()[0], 'ArrowUp');
    fixture.detectChanges();
    expect(host.value()).toBe('a');
    expect(document.activeElement).toBe(buttons()[0]);
  });

  it('still moves forward and back inside the range with loop off', async () => {
    const { fixture, host, buttons } = await setup();
    host.loop.set(false);
    fixture.detectChanges();
    buttons()[1].focus();
    key(buttons()[1], 'ArrowRight');
    fixture.detectChanges();
    expect(host.value()).toBe('c');
    key(buttons()[2], 'ArrowLeft');
    fixture.detectChanges();
    expect(host.value()).toBe('b');
  });

  it('jumps to the first and last enabled option with Home and End, even with loop off', async () => {
    const { fixture, host, buttons } = await setup();
    host.loop.set(false);
    fixture.detectChanges();
    buttons()[1].focus();
    key(buttons()[1], 'End');
    fixture.detectChanges();
    expect(host.value()).toBe('e');
    expect(document.activeElement).toBe(buttons()[4]);
    key(buttons()[4], 'Home');
    fixture.detectChanges();
    expect(host.value()).toBe('a');
    expect(document.activeElement).toBe(buttons()[0]);
  });

  it('keeps Home and End on the first and last option in right-to-left layouts', async () => {
    rtl();
    const { fixture, host, buttons } = await setup();
    buttons()[1].focus();
    key(buttons()[1], 'Home');
    fixture.detectChanges();
    expect(host.value()).toBe('a');
    key(buttons()[0], 'End');
    fixture.detectChanges();
    expect(host.value()).toBe('e');
  });

  it('mirrors the horizontal arrows and the loop edges in right-to-left layouts', async () => {
    rtl();
    const { fixture, host, buttons } = await setup();
    host.loop.set(false);
    host.value.set('a');
    fixture.detectChanges();
    buttons()[0].focus();
    // In RTL, ArrowRight goes backward: at the first option it is the blocked edge.
    key(buttons()[0], 'ArrowRight');
    fixture.detectChanges();
    expect(host.value()).toBe('a');
    key(buttons()[0], 'ArrowLeft');
    fixture.detectChanges();
    expect(host.value()).toBe('b');
  });
});

describe('AndesSegmented nested right-to-left layout', () => {
  it('mirrors the arrows for a group laid out right-to-left without a CDK Dir', async () => {
    const { fixture, group, buttons, host } = await setup();
    group.style.direction = 'rtl';
    fixture.detectChanges();
    buttons()[1].focus();
    key(buttons()[1], 'ArrowLeft');
    fixture.detectChanges();
    expect(host.value()).toBe('c');
  });
});

describe('AndesSegmented focus API', () => {
  it('focus() lands on the selected option and blur() releases it', async () => {
    const { fixture, group, buttons } = await setup();
    const instance = fixture.debugElement.query(By.directive(AndesSegmented))
      .componentInstance as AndesSegmented<string>;
    expect(group).toBeTruthy();
    instance.focus();
    expect(document.activeElement).toBe(buttons()[1]);
    instance.blur();
    expect(document.activeElement).not.toBe(buttons()[1]);
  });

  it('blur() ignores focus that is elsewhere', async () => {
    const { fixture, root } = await setup();
    const outside = root.querySelector('#outside') as HTMLElement;
    outside.focus();
    const instance = fixture.debugElement.query(By.directive(AndesSegmented))
      .componentInstance as AndesSegmented<string>;
    instance.blur();
    expect(document.activeElement).toBe(outside);
  });

  it('autoFocus focuses the selected option after the first render', async () => {
    const fixture = TestBed.createComponent(FeaturesHost);
    fixture.componentInstance.autoFocus.set(true);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(document.activeElement).toBe(radios(fixture.nativeElement)[1]);
  });

  it('emits focused and blurred for the group as a whole, not between options', async () => {
    const { fixture, host, root, buttons } = await setup();
    const outside = root.querySelector('#outside') as HTMLElement;

    buttons()[1].focus();
    expect(host.events).toEqual(['focused']);

    key(buttons()[1], 'ArrowRight');
    fixture.detectChanges();
    expect(host.events).toEqual(['focused']);

    outside.focus();
    expect(host.events).toEqual(['focused', 'blurred']);

    buttons()[2].focus();
    expect(host.events).toEqual(['focused', 'blurred', 'focused']);
  });
});

describe('AndesSegmented columns', () => {
  it('lays the options out in a grid of N columns', async () => {
    const { fixture, host, group } = await setup();
    expect(group.hasAttribute('data-columns')).toBe(false);
    host.columns.set(3);
    fixture.detectChanges();
    expect(group.getAttribute('data-columns')).toBe('3');
    expect(group.style.getPropertyValue('--andes-segmented-columns')).toBe('3');
  });

  it('accepts a numeric string and floors fractions', async () => {
    const { fixture, host, group } = await setup();
    host.columns.set('2');
    fixture.detectChanges();
    expect(group.getAttribute('data-columns')).toBe('2');
    host.columns.set(2.9);
    fixture.detectChanges();
    expect(group.getAttribute('data-columns')).toBe('2');
  });

  it('ignores values that are not a whole number of at least 1', async () => {
    const { fixture, host, group } = await setup();
    for (const bad of [0, -2, 'abc', '', null, 0.5]) {
      host.columns.set(bad);
      fixture.detectChanges();
      expect(group.hasAttribute('data-columns')).toBe(false);
    }
  });
});

describe('AndesSegmented option description', () => {
  it('renders a second line linked with aria-describedby', async () => {
    const { fixture, host, group, buttons } = await setup();
    expect(group.hasAttribute('data-described')).toBe(false);
    expect(buttons()[0].hasAttribute('aria-describedby')).toBe(false);

    host.options.set([
      { label: 'Free', value: 'free', description: 'For hobby projects' },
      { label: 'Pro', value: 'pro' },
    ]);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(group.hasAttribute('data-described')).toBe(true);
    const first = radios(group)[0];
    const id = first.getAttribute('aria-describedby') as string;
    const description = group.querySelector(`#${id}`) as HTMLElement;
    expect(description.textContent?.trim()).toBe('For hobby projects');
    expect(first.contains(description)).toBe(true);
    expect(radios(group)[1].hasAttribute('aria-describedby')).toBe(false);
    // every option learns the group is tall, so the segments grow together
    expect(
      Array.from(group.querySelectorAll('andes-segmented-option')).every((o) =>
        o.hasAttribute('data-described'),
      ),
    ).toBe(true);
  });

  it('gives each description its own id', async () => {
    const { fixture, host, group } = await setup();
    host.options.set([
      { label: 'A', value: 'a', description: 'one' },
      { label: 'B', value: 'b', description: 'two' },
    ]);
    fixture.detectChanges();
    const ids = radios(group).map((b) => b.getAttribute('aria-describedby'));
    expect(new Set(ids).size).toBe(2);
  });

  it('works on a projected option', async () => {
    const fixture = TestBed.createComponent(ProjectedDescriptionHost);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const [quick, plain] = radios(root);
    const id = quick.getAttribute('aria-describedby') as string;
    expect(root.querySelector(`#${id}`)?.textContent?.trim()).toBe(
      'Fast and cheap',
    );
    expect(plain.hasAttribute('aria-describedby')).toBe(false);
    expect(
      root.querySelector('andes-segmented')?.hasAttribute('data-described'),
    ).toBe(true);
  });
});

describe('segmented features stylesheet contract', () => {
  const group = readFileSync(
    'packages/ui/src/lib/segmented/segmented.css',
    'utf8',
  );
  const option = readFileSync(
    'packages/ui/src/lib/segmented/segmented-option.css',
    'utf8',
  );

  it('styles every variant from tokens', () => {
    for (const variant of ['outlined', 'filled', 'borderless']) {
      expect(group).toContain(`:host([data-variant='${variant}'])`);
    }
    expect(group).toContain('--andes-color-primary');
    expect(group).toContain('--andes-color-primary-foreground');
    expect(group).toContain('--andes-color-input');
  });

  it('paints the status ring and focus ring in the danger and warning colors', () => {
    expect(group).toMatch(
      /data-status='error'\]\)\s*\{[^}]*--_ring: var\(--andes-color-danger/,
    );
    expect(group).toMatch(
      /data-status='warning'\]\)\s*\{[^}]*--_ring: var\(--andes-color-warning-hover/,
    );
    expect(group).toMatch(
      /data-status='error'\]\)\s*\{[^}]*--_focus: var\(--andes-color-danger/,
    );
    expect(option).toContain('outline: 2px solid var(--_focus');
  });

  it('declares the variants before the status so a status wins', () => {
    expect(group.indexOf("data-variant='borderless'")).toBeLessThan(
      group.indexOf("data-status='error'"),
    );
  });

  it('keeps the 300ms ease-in-out slide behind overridable properties', () => {
    expect(group).toContain('--andes-segmented-duration, 300ms');
    expect(group).toContain('--andes-segmented-easing, cubic-bezier(');
  });

  it('gives a read-only group no hover feedback and a default cursor', () => {
    expect(option).toContain(':not([data-disabled]):not([data-readonly]))');
    expect(option).toMatch(
      /data-readonly\]\) \.andes-segmented-option__button \{[^}]*cursor: default/,
    );
  });

  it('scrolls the track along its axis with hidden scrollbars and edge masks', () => {
    expect(group).toMatch(/data-scrollable\]\) \{[^}]*overflow: auto hidden/);
    expect(group).toContain('scrollbar-width: none');
    expect(group).toContain('mask-image: linear-gradient(');
    expect(group).toMatch(
      /data-orientation='vertical'\]\) \{[^}]*overflow: hidden auto/,
    );
    expect(group).toContain('to bottom');
    expect(group).toContain('[data-scrollable][data-fade-before]');
    expect(group).toContain('[data-scrollable][data-fade-after]');
  });

  it('never lets scrollable options shrink and keeps the focus ring inside the track', () => {
    expect(group).toMatch(
      /data-scrollable\]\) ::ng-deep andes-segmented-option \{[^}]*flex: 0 0 auto/,
    );
    expect(group).toContain('--_focus-offset: -2px');
    expect(option).toContain('outline-offset: var(--_focus-offset');
  });

  it('smooth-scrolls only when motion is allowed', () => {
    const block = group.slice(
      group.indexOf('prefers-reduced-motion: no-preference'),
    );
    expect(block).toContain('scroll-behavior: smooth');
  });

  it('builds the columns grid from equal minmax tracks, also with block', () => {
    expect(group).toContain(
      'repeat(\n    var(--andes-segmented-columns, 1),\n    minmax(0, 1fr)\n  )',
    );
    expect(group).toContain(':host([data-columns][data-block])');
  });

  it('grows the segments for descriptions and mutes the second line', () => {
    expect(option).toMatch(
      /data-described\]\) \.andes-segmented-option__button \{[^}]*height: auto[^}]*min-height/,
    );
    expect(option).toContain('.andes-segmented-option__description');
    expect(option).toContain('color-mix(in srgb, currentColor 70%');
  });

  it('maps the track, thumb and selected label onto the system palette in forced colors', () => {
    const forced = group.slice(group.indexOf('forced-colors: active'));
    expect(forced).toContain('outline: 1px solid CanvasText');
    expect(forced).toContain('background-color: Highlight');
    expect(forced).toContain('forced-color-adjust: none');
    expect(option.slice(option.indexOf('forced-colors: active'))).toContain(
      'color: HighlightText',
    );
  });

  it('uses logical properties only in the new rules', () => {
    for (const css of [group, option]) {
      expect(css).not.toMatch(
        /margin-left|margin-right|padding-left|padding-right/,
      );
    }
    expect(option).toContain('padding-block: 0.25rem');
  });
});
