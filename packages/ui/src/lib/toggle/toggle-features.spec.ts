import { Directionality } from '@angular/cdk/bidi';
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { readFileSync } from 'node:fs';

import { AndesToggle } from './toggle';
import { AndesToggleGroup } from './toggle-group';
import {
  AndesToggleGroupChange,
  AndesToggleGroupLimit,
  AndesToggleStatus,
} from './toggle-types';

function key(target: HTMLElement, name: string): KeyboardEvent {
  const event = new KeyboardEvent('keydown', {
    key: name,
    bubbles: true,
    cancelable: true,
  });
  target.dispatchEvent(event);
  return event;
}

function buttonsOf(root: HTMLElement): HTMLButtonElement[] {
  return Array.from(root.querySelectorAll('button.andes-toggle__button'));
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
  imports: [AndesToggle, AndesToggleGroup],
  template: `<andes-toggle-group
      aria-label="Format"
      [type]="type()"
      [(value)]="value"
      [loop]="loop()"
      [status]="status()"
      [readOnly]="readOnly()"
      [required]="required()"
      [allowEmpty]="allowEmpty()"
      [name]="name()"
      [minCount]="minCount()"
      [maxCount]="maxCount()"
      [orientation]="orientation()"
      (selectionChange)="changes.push($event)"
      (limitReached)="limits.push($event)"
      (focused)="events.push('focused')"
      (blurred)="events.push('blurred')"
    >
      <andes-toggle value="a" aria-label="A">A</andes-toggle>
      <andes-toggle value="b" aria-label="B">B</andes-toggle>
      <andes-toggle value="c" disabled aria-label="C">C</andes-toggle>
      <andes-toggle value="d" aria-label="D">D</andes-toggle>
      <andes-toggle value="e" aria-label="E">E</andes-toggle>
    </andes-toggle-group>
    <button id="outside" type="button">outside</button>`,
})
class GroupHost {
  readonly type = signal<'single' | 'multiple'>('single');
  readonly value = signal<string | readonly string[] | null>(null);
  readonly loop = signal(true);
  readonly status = signal<AndesToggleStatus | undefined>(undefined);
  readonly readOnly = signal(false);
  readonly required = signal(false);
  readonly allowEmpty = signal(true);
  readonly name = signal<string | undefined>(undefined);
  readonly minCount = signal<unknown>(undefined);
  readonly maxCount = signal<unknown>(undefined);
  readonly orientation = signal<'horizontal' | 'vertical'>('horizontal');
  readonly changes: AndesToggleGroupChange<string>[] = [];
  readonly limits: AndesToggleGroupLimit<string>[] = [];
  readonly events: string[] = [];
}

@Component({
  imports: [AndesToggle],
  template: `<ng-template #star><svg id="tpl-star"></svg></ng-template>
    <andes-toggle
      id="templated"
      aria-label="Star"
      [iconStart]="star"
      [iconEnd]="star"
      >Fav</andes-toggle
    >
    <andes-toggle id="slotted" aria-label="Slots">
      <svg slot="icon-start" id="slot-start"></svg>
      Label
      <svg slot="icon-end" id="slot-end"></svg>
    </andes-toggle>
    <andes-toggle id="legacy" aria-label="Bold"
      ><svg id="legacy-svg"></svg
    ></andes-toggle>
    <andes-toggle id="textonly">Plain</andes-toggle>`,
})
class IconsHost {}

@Component({
  imports: [AndesToggle],
  template: `<andes-toggle id="bare"
    ><svg slot="icon-start"></svg
  ></andes-toggle>`,
})
class UnnamedIconToggle {}

@Component({
  imports: [AndesToggle],
  template: `<andes-toggle id="a" tooltip="Bold"
      ><svg slot="icon-start"></svg
    ></andes-toggle>
    <andes-toggle id="b" aria-labelledby="x"
      ><svg slot="icon-start"></svg
    ></andes-toggle>
    <andes-toggle id="c" aria-label="Bold"
      ><svg slot="icon-start"></svg
    ></andes-toggle>
    <andes-toggle id="d">Bold</andes-toggle>`,
})
class NamedIconToggles {}

@Component({
  imports: [AndesToggle],
  template: `<andes-toggle
    aria-label="Lock"
    [status]="status()"
    [readOnly]="readOnly()"
    [(pressed)]="pressed"
    >Lock</andes-toggle
  >`,
})
class SingleHost {
  readonly status = signal<AndesToggleStatus | undefined>(undefined);
  readonly readOnly = signal(false);
  readonly pressed = signal(false);
}

@Component({
  imports: [AndesToggle, AndesToggleGroup, ReactiveFormsModule],
  template: `<andes-toggle-group
    aria-label="Format"
    required
    [type]="type()"
    [minCount]="1"
    [maxCount]="2"
    [formControl]="control"
  >
    <andes-toggle value="a">A</andes-toggle>
    <andes-toggle value="b">B</andes-toggle>
    <andes-toggle value="c">C</andes-toggle>
  </andes-toggle-group>`,
})
class FormHost {
  readonly type = signal<'single' | 'multiple'>('multiple');
  readonly control = new FormControl<string | string[] | null>(null);
}

async function setup(init?: (host: GroupHost) => void) {
  const fixture = TestBed.createComponent(GroupHost);
  init?.(fixture.componentInstance);
  fixture.detectChanges();
  await fixture.whenStable();
  const root = fixture.nativeElement as HTMLElement;
  const buttons = () => buttonsOf(root);
  return {
    fixture,
    host: fixture.componentInstance,
    root,
    group: root.querySelector('andes-toggle-group') as HTMLElement,
    buttons,
    api: fixture.debugElement.query(By.directive(AndesToggleGroup))
      .componentInstance as AndesToggleGroup<string>,
    pressed: () => buttons().map((b) => b.getAttribute('aria-pressed')),
  };
}

describe('AndesToggleGroup loop, Home and End', () => {
  it('wraps by default', async () => {
    const { fixture, buttons } = await setup();
    buttons()[4].focus();
    key(buttons()[4], 'ArrowRight');
    fixture.detectChanges();
    expect(document.activeElement).toBe(buttons()[0]);
    key(buttons()[0], 'ArrowLeft');
    expect(document.activeElement).toBe(buttons()[4]);
  });

  it('stops at the ends with loop off and swallows the key', async () => {
    const { fixture, host, buttons } = await setup();
    host.loop.set(false);
    fixture.detectChanges();
    buttons()[4].focus();
    const event = key(buttons()[4], 'ArrowRight');
    expect(event.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(buttons()[4]);

    buttons()[0].focus();
    expect(key(buttons()[0], 'ArrowLeft').defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(buttons()[0]);

    key(buttons()[0], 'ArrowRight');
    expect(document.activeElement).toBe(buttons()[1]);
    key(buttons()[1], 'ArrowRight');
    // skipped the disabled "C"
    expect(document.activeElement).toBe(buttons()[3]);
  });

  it('jumps to the first and last enabled toggle, even with loop off', async () => {
    const { fixture, host, buttons } = await setup();
    host.loop.set(false);
    fixture.detectChanges();
    buttons()[1].focus();
    key(buttons()[1], 'End');
    expect(document.activeElement).toBe(buttons()[4]);
    key(buttons()[4], 'Home');
    expect(document.activeElement).toBe(buttons()[0]);
  });

  it('follows ArrowUp/Down when vertical', async () => {
    const { fixture, host, buttons } = await setup();
    host.orientation.set('vertical');
    host.loop.set(false);
    fixture.detectChanges();
    buttons()[0].focus();
    expect(key(buttons()[0], 'ArrowUp').defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(buttons()[0]);
    key(buttons()[0], 'ArrowDown');
    expect(document.activeElement).toBe(buttons()[1]);
  });

  it('mirrors the arrows in right-to-left layouts and keeps Home/End logical', async () => {
    rtl();
    const { fixture, host, buttons } = await setup();
    host.loop.set(false);
    fixture.detectChanges();
    buttons()[0].focus();
    // ArrowRight is "backward" in RTL: blocked at the first toggle
    key(buttons()[0], 'ArrowRight');
    expect(document.activeElement).toBe(buttons()[0]);
    key(buttons()[0], 'ArrowLeft');
    expect(document.activeElement).toBe(buttons()[1]);
    key(buttons()[1], 'End');
    expect(document.activeElement).toBe(buttons()[4]);
    key(buttons()[4], 'Home');
    expect(document.activeElement).toBe(buttons()[0]);
  });
});

describe('AndesToggleGroup nested right-to-left layout', () => {
  it('mirrors the arrows for a group laid out right-to-left without a CDK Dir', async () => {
    const { fixture, host, group, buttons } = await setup();
    host.loop.set(false);
    group.style.direction = 'rtl';
    fixture.detectChanges();
    buttons()[1].focus();
    key(buttons()[1], 'ArrowLeft');
    expect(document.activeElement).toBe(buttons()[3]);
  });
});

describe('AndesToggle and AndesToggleGroup status', () => {
  it('exposes the status on a toggle without any aria-invalid', () => {
    const fixture = TestBed.createComponent(SingleHost);
    fixture.detectChanges();
    const toggle = fixture.nativeElement.querySelector(
      'andes-toggle',
    ) as HTMLElement;
    const button = toggle.querySelector('button') as HTMLButtonElement;
    expect(toggle.hasAttribute('data-status')).toBe(false);

    fixture.componentInstance.status.set('error');
    fixture.detectChanges();
    expect(toggle.getAttribute('data-status')).toBe('error');
    expect(button.hasAttribute('aria-invalid')).toBe(false);
    expect(toggle.hasAttribute('aria-invalid')).toBe(false);

    fixture.componentInstance.status.set('warning');
    fixture.detectChanges();
    expect(toggle.getAttribute('data-status')).toBe('warning');
  });

  it('flows from the group to its toggles unless a toggle sets its own', async () => {
    const { fixture, host, group, root } = await setup();
    host.status.set('error');
    fixture.detectChanges();
    expect(group.getAttribute('data-status')).toBe('error');
    expect(group.hasAttribute('aria-invalid')).toBe(false);
    const toggles = Array.from(root.querySelectorAll('andes-toggle'));
    expect(
      toggles.every((t) => t.getAttribute('data-status') === 'error'),
    ).toBe(true);
    host.status.set(undefined);
    fixture.detectChanges();
    expect(toggles.some((t) => t.hasAttribute('data-status'))).toBe(false);
  });
});

describe('AndesToggle and AndesToggleGroup readOnly', () => {
  it('a read-only toggle stays focusable but does not press', () => {
    const fixture = TestBed.createComponent(SingleHost);
    fixture.componentInstance.readOnly.set(true);
    fixture.detectChanges();
    const toggle = fixture.nativeElement.querySelector(
      'andes-toggle',
    ) as HTMLElement;
    const button = toggle.querySelector('button') as HTMLButtonElement;
    expect(toggle.hasAttribute('data-readonly')).toBe(true);
    // `aria-readonly` is not allowed on the button role
    expect(button.hasAttribute('aria-readonly')).toBe(false);
    expect(button.disabled).toBe(false);
    expect(button.getAttribute('tabindex')).toBe('0');

    button.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.pressed()).toBe(false);
    expect(button.getAttribute('aria-pressed')).toBe('false');

    fixture.componentInstance.readOnly.set(false);
    fixture.detectChanges();
    button.click();
    expect(fixture.componentInstance.pressed()).toBe(true);
  });

  it('a read-only group exposes data-readonly, keeps focus movement, and changes nothing', async () => {
    const { fixture, host, group, buttons } = await setup((h) =>
      h.value.set('a'),
    );
    host.readOnly.set(true);
    fixture.detectChanges();
    expect(group.hasAttribute('data-readonly')).toBe(true);
    expect(group.hasAttribute('aria-readonly')).toBe(false);
    expect(buttons()[0].disabled).toBe(false);

    buttons()[1].click();
    fixture.detectChanges();
    expect(host.value()).toBe('a');
    expect(host.changes).toHaveLength(0);

    buttons()[0].focus();
    key(buttons()[0], 'ArrowRight');
    expect(document.activeElement).toBe(buttons()[1]);
    expect(host.value()).toBe('a');
    expect(
      Array.from(group.querySelectorAll('andes-toggle')).every((t) =>
        t.hasAttribute('data-readonly'),
      ),
    ).toBe(true);
  });
});

describe('AndesToggle icons', () => {
  async function iconsSetup() {
    const fixture = TestBed.createComponent(IconsHost);
    fixture.detectChanges();
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('renders iconStart and iconEnd templates around the label, decoratively', async () => {
    const root = await iconsSetup();
    const button = root.querySelector('#templated button') as HTMLElement;
    const icons = Array.from(
      button.querySelectorAll('.andes-toggle__icon'),
    ) as HTMLElement[];
    expect(icons).toHaveLength(2);
    expect(icons.every((i) => i.getAttribute('aria-hidden') === 'true')).toBe(
      true,
    );
    expect(icons[0].querySelector('svg')).not.toBeNull();
    expect(icons[1].querySelector('svg')).not.toBeNull();
    const order = Array.from(button.children).map((c) => c.className);
    expect(order[0]).toContain('andes-toggle__icon');
    expect(order[1]).toContain('andes-toggle__label');
    expect(order[2]).toContain('andes-toggle__icon');
    expect(button.querySelector('.andes-toggle__label')?.textContent).toContain(
      'Fav',
    );
  });

  it('projects [slot=icon-start] and [slot=icon-end] into their own spots', async () => {
    const root = await iconsSetup();
    const button = root.querySelector('#slotted button') as HTMLElement;
    const [start, , end] = Array.from(button.children);
    expect(start.querySelector('#slot-start')).not.toBeNull();
    expect(end.querySelector('#slot-end')).not.toBeNull();
    expect(
      button.querySelector('.andes-toggle__label')?.textContent?.trim(),
    ).toBe('Label');
  });

  it('keeps a bare projected icon inside the label wrapper, as before', async () => {
    const root = await iconsSetup();
    const button = root.querySelector('#legacy button') as HTMLElement;
    expect(
      button.querySelector('.andes-toggle__label #legacy-svg'),
    ).not.toBeNull();
  });

  it('leaves unused icon slots empty so they collapse', async () => {
    const root = await iconsSetup();
    const icons = Array.from(
      root.querySelectorAll('#textonly .andes-toggle__icon'),
    );
    expect(icons).toHaveLength(2);
    expect(icons.every((i) => i.children.length === 0)).toBe(true);
    expect(icons.every((i) => i.textContent === '')).toBe(true);
  });
});

describe('AndesToggle icon-only accessible name warning', () => {
  afterEach(() => vi.restoreAllMocks());

  it('warns once, in development, when a toggle has no text and no name', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const fixture = TestBed.createComponent(UnnamedIconToggle);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0][0])).toContain('aria-label');

    // re-rendering never repeats it
    fixture.detectChanges();
    await fixture.whenStable();
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('is quiet when text, aria-label, aria-labelledby or tooltip names the toggle', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const fixture = TestBed.createComponent(NamedIconToggles);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(warn).not.toHaveBeenCalled();
  });

  it('is quiet for the legacy bare icon with an aria-label', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const fixture = TestBed.createComponent(IconsHost);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(warn).not.toHaveBeenCalled();
  });
});

describe('AndesToggleGroup selectionChange', () => {
  it('reports added for a single selection and the value it replaced as removed', async () => {
    const { fixture, host, buttons } = await setup();
    buttons()[0].click();
    fixture.detectChanges();
    expect(host.changes.at(-1)).toEqual({
      value: 'a',
      added: 'a',
      removed: undefined,
    });

    buttons()[1].click();
    fixture.detectChanges();
    expect(host.changes.at(-1)).toEqual({
      value: 'b',
      added: 'b',
      removed: 'a',
    });

    buttons()[1].click();
    fixture.detectChanges();
    expect(host.changes.at(-1)).toEqual({
      value: null,
      added: undefined,
      removed: 'b',
    });
    expect(host.value()).toBeNull();
  });

  it('reports one added or removed value for multiple', async () => {
    const { fixture, host, buttons } = await setup((h) =>
      h.type.set('multiple'),
    );
    buttons()[0].click();
    buttons()[1].click();
    fixture.detectChanges();
    expect(host.changes.at(-1)).toEqual({
      value: ['a', 'b'],
      added: 'b',
      removed: undefined,
    });
    buttons()[0].click();
    fixture.detectChanges();
    expect(host.changes.at(-1)).toEqual({
      value: ['b'],
      added: undefined,
      removed: 'a',
    });
  });

  it('keeps [(value)] working and never fires for programmatic writes', async () => {
    const { fixture, host, buttons, pressed } = await setup();
    host.value.set('d');
    fixture.detectChanges();
    expect(pressed()).toEqual(['false', 'false', 'false', 'true', 'false']);
    expect(host.changes).toHaveLength(0);

    buttons()[4].click();
    fixture.detectChanges();
    expect(host.value()).toBe('e');
  });

  it('does not fire for a refused change (allowEmpty off)', async () => {
    const { fixture, host, buttons } = await setup((h) => {
      h.value.set('a');
      h.allowEmpty.set(false);
    });
    buttons()[0].click();
    fixture.detectChanges();
    expect(host.value()).toBe('a');
    expect(host.changes).toHaveLength(0);
  });
});

describe('AndesToggleGroup focus API', () => {
  it('focus() lands on the pressed toggle and blur() releases it', async () => {
    const { api, buttons } = await setup((h) => h.value.set('d'));
    api.focus();
    expect(document.activeElement).toBe(buttons()[3]);
    api.blur();
    expect(document.activeElement).not.toBe(buttons()[3]);
  });

  it('focus() falls back to the first enabled toggle', async () => {
    const { api, buttons } = await setup();
    api.focus();
    expect(document.activeElement).toBe(buttons()[0]);
  });

  it('blur() leaves focus that is elsewhere alone', async () => {
    const { api, root } = await setup();
    const outside = root.querySelector('#outside') as HTMLElement;
    outside.focus();
    api.blur();
    expect(document.activeElement).toBe(outside);
  });

  it('emits focused / blurred for the group as a whole, not between toggles', async () => {
    const { fixture, host, root, buttons } = await setup();
    const outside = root.querySelector('#outside') as HTMLElement;
    buttons()[0].focus();
    key(buttons()[0], 'ArrowRight');
    fixture.detectChanges();
    expect(host.events).toEqual(['focused']);
    outside.focus();
    expect(host.events).toEqual(['focused', 'blurred']);
  });
});

describe('AndesToggleGroup required', () => {
  it('stops the pressed toggle of a single group from being released', async () => {
    const { fixture, host, group, buttons } = await setup((h) => {
      h.value.set('a');
      h.required.set(true);
    });
    expect(group.hasAttribute('data-required')).toBe(true);
    expect(group.hasAttribute('aria-required')).toBe(false);

    buttons()[0].click();
    fixture.detectChanges();
    expect(host.value()).toBe('a');
    expect(host.changes).toHaveLength(0);

    buttons()[1].click();
    fixture.detectChanges();
    expect(host.value()).toBe('b');

    host.required.set(false);
    fixture.detectChanges();
    expect(group.hasAttribute('data-required')).toBe(false);
    buttons()[1].click();
    fixture.detectChanges();
    expect(host.value()).toBeNull();
  });

  it('does not stop a multiple group from emptying (that is minCount)', async () => {
    const { fixture, host, buttons } = await setup((h) => {
      h.type.set('multiple');
      h.value.set(['a']);
      h.required.set(true);
    });
    buttons()[0].click();
    fixture.detectChanges();
    expect(host.value()).toEqual([]);
  });

  it('is invalid under Angular forms while empty', () => {
    const fixture = TestBed.createComponent(FormHost);
    fixture.componentInstance.type.set('single');
    fixture.detectChanges();
    const control = fixture.componentInstance.control;
    expect(control.errors).toEqual({ required: true });

    control.setValue('a');
    expect(control.errors).toBeNull();
    control.setValue(null);
    expect(control.errors).toEqual({ required: true });
  });
});

describe('AndesToggleGroup name', () => {
  it('posts one hidden input per pressed value', async () => {
    const { fixture, host, group, buttons } = await setup((h) => {
      h.type.set('multiple');
      h.value.set(['a']);
    });
    const hidden = () =>
      Array.from(
        group.querySelectorAll('input[type="hidden"]'),
      ) as HTMLInputElement[];
    expect(hidden()).toHaveLength(0);

    host.name.set('format');
    fixture.detectChanges();
    expect(hidden().map((i) => [i.name, i.value])).toEqual([['format', 'a']]);

    buttons()[1].click();
    buttons()[3].click();
    fixture.detectChanges();
    expect(hidden().map((i) => i.value)).toEqual(['a', 'b', 'd']);
    expect(hidden().every((i) => i.name === 'format')).toBe(true);

    buttons()[0].click();
    fixture.detectChanges();
    expect(hidden().map((i) => i.value)).toEqual(['b', 'd']);
  });

  it('posts one input for a single selection and none when empty', async () => {
    const { fixture, host, group } = await setup((h) => {
      h.name.set('align');
      h.value.set('b');
    });
    expect(group.querySelectorAll('input[type="hidden"]')).toHaveLength(1);
    host.value.set(null);
    fixture.detectChanges();
    expect(group.querySelectorAll('input[type="hidden"]')).toHaveLength(0);
  });

  it('does not break the joined end radii (hidden inputs follow the toggles)', async () => {
    const { group } = await setup((h) => {
      h.name.set('align');
      h.value.set('b');
    });
    const last = group.querySelector('andes-toggle:last-of-type');
    expect(last?.textContent?.trim()).toBe('E');
  });
});

describe('AndesToggleGroup minCount / maxCount', () => {
  it('disables the unpressed toggles at maxCount and emits limitReached', async () => {
    const { fixture, host, buttons, pressed } = await setup((h) => {
      h.type.set('multiple');
      h.value.set(['a']);
      h.maxCount.set(2);
    });
    expect(buttons().map((b) => b.disabled)).toEqual([
      false,
      false,
      true,
      false,
      false,
    ]);

    buttons()[1].click();
    fixture.detectChanges();
    expect(host.value()).toEqual(['a', 'b']);
    expect(host.limits).toEqual([
      { limit: 'max', count: 2, value: ['a', 'b'] },
    ]);
    // unpressed toggles are now disabled and look it; pressed ones stay enabled
    expect(buttons().map((b) => b.disabled)).toEqual([
      false,
      false,
      true,
      true,
      true,
    ]);
    expect(pressed()).toEqual(['true', 'true', 'false', 'false', 'false']);
    expect(
      buttons()[3].closest('andes-toggle')?.hasAttribute('data-limit'),
    ).toBe(true);
    expect(
      buttons()[0].closest('andes-toggle')?.hasAttribute('data-limit'),
    ).toBe(false);

    buttons()[3].click();
    fixture.detectChanges();
    expect(host.value()).toEqual(['a', 'b']);

    buttons()[0].click();
    fixture.detectChanges();
    expect(host.value()).toEqual(['b']);
    expect(buttons()[3].disabled).toBe(false);
  });

  it('refuses to release below minCount and emits limitReached min', async () => {
    const { fixture, host, buttons } = await setup((h) => {
      h.type.set('multiple');
      h.value.set(['a', 'b']);
      h.minCount.set(2);
    });
    buttons()[0].click();
    fixture.detectChanges();
    expect(host.value()).toEqual(['a', 'b']);
    expect(host.changes).toHaveLength(0);
    expect(host.limits).toEqual([
      { limit: 'min', count: 2, value: ['a', 'b'] },
    ]);

    buttons()[3].click();
    fixture.detectChanges();
    expect(host.value()).toEqual(['a', 'b', 'd']);
    buttons()[3].click();
    fixture.detectChanges();
    expect(host.value()).toEqual(['a', 'b']);
  });

  it('parses numeric strings and ignores junk', async () => {
    const { fixture, host, buttons } = await setup((h) => {
      h.type.set('multiple');
      h.maxCount.set('1');
    });
    buttons()[0].click();
    fixture.detectChanges();
    expect(buttons()[1].disabled).toBe(true);

    host.maxCount.set('abc');
    fixture.detectChanges();
    expect(buttons()[1].disabled).toBe(false);
  });

  it('ignores the limits for a single group', async () => {
    const { fixture, host, buttons } = await setup((h) => {
      h.maxCount.set(1);
      h.minCount.set(1);
    });
    buttons()[0].click();
    fixture.detectChanges();
    expect(buttons()[1].disabled).toBe(false);
    buttons()[0].click();
    fixture.detectChanges();
    expect(host.value()).toBeNull();
    expect(host.limits).toHaveLength(0);
  });

  it('drops disabled toggles from the roving keyboard order', async () => {
    const { fixture, buttons } = await setup((h) => {
      h.type.set('multiple');
      h.value.set(['a', 'b']);
      h.maxCount.set(2);
    });
    buttons()[0].focus();
    key(buttons()[0], 'ArrowRight');
    fixture.detectChanges();
    expect(document.activeElement).toBe(buttons()[1]);
    key(buttons()[1], 'ArrowRight');
    expect(document.activeElement).toBe(buttons()[0]);
  });

  it('validates the bounds under Angular forms', () => {
    const fixture = TestBed.createComponent(FormHost);
    fixture.detectChanges();
    const control = fixture.componentInstance.control;
    expect(control.errors).toEqual({
      required: true,
      minCount: { min: 1, actual: 0 },
    });
    control.setValue(['a']);
    expect(control.errors).toBeNull();
    control.setValue(['a', 'b', 'c']);
    expect(control.errors).toEqual({ maxCount: { max: 2, actual: 3 } });
  });
});

describe('toggle features stylesheet contract', () => {
  const toggle = readFileSync('packages/ui/src/lib/toggle/toggle.css', 'utf8');
  const group = readFileSync(
    'packages/ui/src/lib/toggle/toggle-group.css',
    'utf8',
  );

  it('paints the border and focus ring for each status', () => {
    expect(toggle).toMatch(
      /data-status='error'\]\) \.andes-toggle__button \{[^}]*border-color: var\(--andes-color-danger/,
    );
    expect(toggle).toMatch(
      /data-status='warning'\]\) \.andes-toggle__button \{[^}]*border-color: var\(--andes-color-warning-hover/,
    );
    expect(toggle).toMatch(
      /data-status='error'\]\) \.andes-toggle__button:focus-visible \{[^}]*outline-color: var\(--andes-color-danger/,
    );
  });

  it('lets a status win over the outline variant border', () => {
    expect(toggle.indexOf("data-variant='outline'")).toBeLessThan(
      toggle.indexOf("data-status='error'"),
    );
  });

  it('gives a read-only toggle no hover feedback and a default cursor', () => {
    expect(toggle).toContain(
      ':host(:not([data-readonly])) .andes-toggle__button:hover:not(:disabled)',
    );
    expect(toggle).toMatch(
      /data-readonly\]\) \.andes-toggle__button \{[^}]*cursor: default/,
    );
  });

  it('takes no box for the label wrapper and collapses empty icon slots', () => {
    expect(toggle).toMatch(/\.andes-toggle__label \{[^}]*display: contents/);
    expect(toggle).toMatch(/\.andes-toggle__icon:empty \{[^}]*display: none/);
  });

  it('keeps pressed and statuses distinguishable in forced colors', () => {
    const forced = toggle.slice(toggle.indexOf('forced-colors: active'));
    expect(forced).toContain("[aria-pressed='true']");
    expect(forced).toContain('background-color: Highlight');
    expect(forced).toContain('color: HighlightText');
    expect(forced).toContain('var(--andes-color-danger');
    expect(forced).toContain('GrayText');
  });

  it('finds the joined ends by type (hidden inputs follow the toggles) and lifts statuses', () => {
    expect(group).toContain('andes-toggle:first-of-type');
    expect(group).toContain('andes-toggle:last-of-type');
    expect(group).not.toContain(':last-child');
    expect(group).toContain('andes-toggle[data-status]');
  });
});
