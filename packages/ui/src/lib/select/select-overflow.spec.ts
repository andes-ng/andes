import { AndesOverlayPrimitive } from '@andes-ng/primitives';
import { Component, signal, viewChild, type TemplateRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { AndesSelect } from './select';
import {
  AndesSelectOverflow,
  ANDES_SELECT_OVERFLOW_CLOSE_DELAY,
  ANDES_SELECT_OVERFLOW_OPEN_DELAY,
} from './select-overflow';
import type {
  AndesSelectMaxTagCount,
  AndesSelectMaxTagPopoverContext,
  AndesSelectTagContext,
} from './select-state';

/** See `select.spec.ts`: the CDK's key manager reads `keyCode`, which jsdom leaves at 0. */
const KEY_CODES: Record<string, number> = {
  ArrowDown: 40,
  Enter: 13,
  Escape: 27,
  Tab: 9,
  ' ': 32,
};

function pressKey(
  target: Element,
  key: string,
  init: KeyboardEventInit = {},
): KeyboardEvent {
  const event = new KeyboardEvent('keydown', {
    key,
    bubbles: true,
    cancelable: true,
    ...init,
  });
  Object.defineProperty(event, 'keyCode', {
    get: () => KEY_CODES[key] ?? key.toUpperCase().charCodeAt(0),
  });
  target.dispatchEvent(event);
  return event;
}

/** jsdom has no `PointerEvent` constructor; a mouse event with the field set will do. */
function pointer(target: Element, type: string, pointerType = 'mouse'): void {
  const event = new MouseEvent(type, { bubbles: false, cancelable: true });
  Object.defineProperty(event, 'pointerType', { get: () => pointerType });
  target.dispatchEvent(event);
}

function click(target: Element): void {
  target.dispatchEvent(
    new MouseEvent('click', { bubbles: true, cancelable: true, detail: 1 }),
  );
}

/** Makes `:focus-visible` match the focused element, as it does after a key press. */
function keyboardFocus(): void {
  const original = Element.prototype.matches;
  vi.spyOn(Element.prototype, 'matches').mockImplementation(function (
    this: Element,
    selector: string,
  ) {
    if (selector === ':focus-visible') {
      return document.activeElement === this;
    }
    return original.call(this, selector);
  });
}

const FRUITS = [
  { value: 'apple', label: 'Apple' },
  { value: 'apricot', label: 'Apricot' },
  { value: 'banana', label: 'Banana' },
  { value: 'cherry', label: 'Cherry' },
  { value: 'durian', label: 'Durian', disabled: true },
  { value: 'grape', label: 'Grape' },
];

@Component({
  imports: [AndesSelect],
  template: `<andes-select
      aria-label="Fruit"
      mode="multiple"
      [options]="fruits"
      [maxTagCount]="maxTagCount()"
      [maxTagPopover]="popover()"
      [maxTagPopoverTemplate]="popoverTemplate()"
      [maxTagPopoverLabel]="popoverLabel()"
      [removeTagLabel]="removeLabel()"
      [tagTemplate]="tagTemplate()"
      [disabled]="disabled()"
      [(value)]="value"
      (optionDeselect)="deselected.push($event)"
      (selectionChange)="changes.push($event)"
      (blurred)="blurs.push('blur')"
    />
    <button type="button" id="after">after</button>
    <ng-template #customPopover let-omitted let-remove="remove">
      <p data-testid="custom-popover">{{ omitted.length }} hidden</p>
      <button
        type="button"
        data-testid="custom-remove"
        (click)="remove(omitted[0])"
      >
        drop first
      </button>
    </ng-template>
    <ng-template #customTag let-tag let-inPopover="inPopover">
      <span data-slot="select-tag" [attr.data-in-popover]="inPopover">{{
        tag.label
      }}</span>
    </ng-template>`,
})
class OverflowHost {
  readonly fruits = FRUITS;
  readonly maxTagCount = signal<AndesSelectMaxTagCount | undefined>(2);
  readonly popover = signal(true);
  readonly popoverTemplate = signal<
    TemplateRef<AndesSelectMaxTagPopoverContext> | undefined
  >(undefined);
  readonly popoverLabel = signal('{count} more selected');
  readonly removeLabel = signal('Remove {label}');
  readonly tagTemplate = signal<TemplateRef<AndesSelectTagContext> | undefined>(
    undefined,
  );
  readonly disabled = signal(false);
  readonly value = signal<unknown>([
    'apple',
    'apricot',
    'banana',
    'cherry',
    'grape',
  ]);
  readonly deselected: unknown[] = [];
  readonly changes: unknown[] = [];
  readonly blurs: string[] = [];
  readonly customPopover =
    viewChild.required<TemplateRef<AndesSelectMaxTagPopoverContext>>(
      'customPopover',
    );
  readonly customTag =
    viewChild.required<TemplateRef<AndesSelectTagContext>>('customTag');
}

function setup(configure: (host: OverflowHost) => void = () => undefined) {
  const fixture = TestBed.createComponent(OverflowHost);
  configure(fixture.componentInstance);
  fixture.detectChanges();
  const root = fixture.nativeElement as HTMLElement;
  const detect = () => fixture.detectChanges();
  const rest = () =>
    root.querySelector<HTMLElement>(
      '.andes-select__selection > [data-slot="select-tag-rest"]',
    );
  const popover = () =>
    document.querySelector<HTMLElement>('[data-slot="select-overflow"]');
  const popoverTags = () =>
    Array.from(
      popover()?.querySelectorAll<HTMLElement>('[data-slot="select-tag"]') ??
        [],
    ).map((tag) => tag.textContent?.trim());
  const removeButtons = () =>
    Array.from(
      popover()?.querySelectorAll<HTMLElement>(
        '[data-slot="select-tag-remove"]',
      ) ?? [],
    );
  const combobox = () =>
    root.querySelector<HTMLElement>('[role="combobox"]') as HTMLElement;
  const select = () =>
    fixture.debugElement.query(By.directive(AndesSelect))
      .componentInstance as AndesSelect;
  return {
    fixture,
    host: fixture.componentInstance,
    root,
    detect,
    rest,
    popover,
    popoverTags,
    removeButtons,
    combobox,
    select,
  };
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('AndesSelect overflow popover: the + N tag', () => {
  it('is a button that controls a dialog, without a native tooltip', () => {
    const { rest } = setup();
    const tag = rest() as HTMLElement;

    expect(tag.textContent?.trim()).toBe('+ 3 ...');
    expect(tag.getAttribute('role')).toBe('button');
    expect(tag.getAttribute('tabindex')).toBe('0');
    expect(tag.getAttribute('aria-haspopup')).toBe('dialog');
    expect(tag.getAttribute('aria-expanded')).toBe('false');
    expect(tag.getAttribute('aria-label')).toBe('3 more selected');
    expect(tag.hasAttribute('aria-controls')).toBe(false);
    expect(tag.hasAttribute('title')).toBe(false);
  });

  it('falls back to plain text with a title when maxTagPopover is off', () => {
    const { rest, detect, popover, select } = setup((h) =>
      h.popover.set(false),
    );
    const tag = rest() as HTMLElement;

    expect(tag.hasAttribute('role')).toBe(false);
    expect(tag.hasAttribute('tabindex')).toBe(false);
    expect(tag.hasAttribute('aria-label')).toBe(false);
    expect(tag.getAttribute('title')).toBe('Banana, Cherry, Grape');

    // A click is the box's again: it opens the option list, not a popover.
    click(tag);
    detect();
    expect(select().isOpen()).toBe(true);
    expect(popover()).toBeNull();
  });

  it('keeps the measuring row free of interactive copies', () => {
    const { root } = setup((h) => h.maxTagCount.set('responsive'));
    const measured = root.querySelector(
      '[data-slot="select-tag-measure"] [data-slot="select-tag-rest"]',
    );
    expect(measured).not.toBeNull();
    expect(measured?.hasAttribute('role')).toBe(false);
  });
});

describe('AndesSelect overflow popover: pointer', () => {
  beforeEach(() => vi.useFakeTimers());

  it('opens after the open delay and lists the hidden tags', () => {
    const { rest, popover, popoverTags, detect } = setup();
    pointer(rest() as HTMLElement, 'pointerenter');
    vi.advanceTimersByTime(ANDES_SELECT_OVERFLOW_OPEN_DELAY - 1);
    detect();
    expect(popover()).toBeNull();

    vi.advanceTimersByTime(1);
    detect();
    const dialog = popover() as HTMLElement;
    expect(dialog.getAttribute('role')).toBe('dialog');
    expect(dialog.getAttribute('aria-label')).toBe('3 more selected');
    expect(dialog.querySelector('[role="list"]')?.children).toHaveLength(3);
    expect(popoverTags()).toEqual(['Banana', 'Cherry', 'Grape']);

    const tag = rest() as HTMLElement;
    expect(tag.getAttribute('aria-expanded')).toBe('true');
    expect(tag.getAttribute('aria-controls')).toBe(dialog.id);
    expect(tag.getAttribute('data-state')).toBe('open');
  });

  it('does not open when the pointer leaves before the delay', () => {
    const { rest, popover, detect } = setup();
    pointer(rest() as HTMLElement, 'pointerenter');
    vi.advanceTimersByTime(100);
    pointer(rest() as HTMLElement, 'pointerleave');
    vi.advanceTimersByTime(ANDES_SELECT_OVERFLOW_OPEN_DELAY);
    detect();
    expect(popover()).toBeNull();
  });

  it('stays open while the pointer travels into the popover, closes after leaving it', () => {
    const { rest, popover, detect } = setup();
    pointer(rest() as HTMLElement, 'pointerenter');
    vi.advanceTimersByTime(ANDES_SELECT_OVERFLOW_OPEN_DELAY);
    detect();

    pointer(rest() as HTMLElement, 'pointerleave');
    vi.advanceTimersByTime(ANDES_SELECT_OVERFLOW_CLOSE_DELAY - 20);
    pointer(popover() as HTMLElement, 'pointerenter');
    vi.advanceTimersByTime(ANDES_SELECT_OVERFLOW_CLOSE_DELAY * 3);
    detect();
    expect(popover()).not.toBeNull();

    pointer(popover() as HTMLElement, 'pointerleave');
    vi.advanceTimersByTime(ANDES_SELECT_OVERFLOW_CLOSE_DELAY - 1);
    detect();
    expect(popover()).not.toBeNull();
    vi.advanceTimersByTime(1);
    detect();
    expect(popover()).toBeNull();
    expect(rest()?.getAttribute('aria-expanded')).toBe('false');
  });

  it('pins on click without opening the option list, and a second click closes it', () => {
    const { rest, popover, detect, select } = setup();
    click(rest() as HTMLElement);
    detect();
    expect(popover()).not.toBeNull();
    expect(select().isOpen()).toBe(false);

    // Pinned: the pointer leaving does not close it.
    pointer(rest() as HTMLElement, 'pointerleave');
    vi.advanceTimersByTime(ANDES_SELECT_OVERFLOW_CLOSE_DELAY * 2);
    detect();
    expect(popover()).not.toBeNull();

    click(rest() as HTMLElement);
    detect();
    expect(popover()).toBeNull();
    expect(select().isOpen()).toBe(false);
  });

  it('pins a popover opened by hover when the tag is clicked', () => {
    const { rest, popover, detect } = setup();
    pointer(rest() as HTMLElement, 'pointerenter');
    vi.advanceTimersByTime(ANDES_SELECT_OVERFLOW_OPEN_DELAY);
    detect();
    click(rest() as HTMLElement);
    pointer(rest() as HTMLElement, 'pointerleave');
    vi.advanceTimersByTime(ANDES_SELECT_OVERFLOW_CLOSE_DELAY * 2);
    detect();
    expect(popover()).not.toBeNull();
  });

  it('toggles with a touch tap and ignores touch hover', () => {
    const { rest, popover, detect } = setup();
    const tag = rest() as HTMLElement;
    pointer(tag, 'pointerenter', 'touch');
    vi.advanceTimersByTime(ANDES_SELECT_OVERFLOW_OPEN_DELAY);
    detect();
    expect(popover()).toBeNull();

    pointer(tag, 'pointerdown', 'touch');
    click(tag);
    detect();
    expect(popover()).not.toBeNull();
    pointer(popover() as HTMLElement, 'pointerleave', 'touch');
    pointer(tag, 'pointerleave', 'touch');
    vi.advanceTimersByTime(ANDES_SELECT_OVERFLOW_CLOSE_DELAY * 2);
    detect();
    expect(popover()).not.toBeNull();

    pointer(tag, 'pointerdown', 'touch');
    click(tag);
    detect();
    expect(popover()).toBeNull();
  });
});

describe('AndesSelect overflow popover: keyboard', () => {
  beforeEach(() => keyboardFocus());

  it('opens when the tag gets keyboard focus, not mouse focus', () => {
    const { rest, popover, detect } = setup();
    const tag = rest() as HTMLElement;
    vi.mocked(Element.prototype.matches).mockImplementation(() => false);
    tag.focus();
    detect();
    expect(popover()).toBeNull();
    tag.blur();

    vi.mocked(Element.prototype.matches).mockRestore();
    keyboardFocus();
    tag.focus();
    detect();
    expect(popover()).not.toBeNull();
    // Focus stays on the tag: the popover only takes it when asked to.
    expect(document.activeElement).toBe(tag);
  });

  it('closes when focus moves on to something outside', async () => {
    vi.useFakeTimers();
    const { rest, popover, detect } = setup();
    (rest() as HTMLElement).focus();
    detect();
    expect(popover()).not.toBeNull();

    document.getElementById('after')?.focus();
    vi.advanceTimersByTime(ANDES_SELECT_OVERFLOW_CLOSE_DELAY);
    detect();
    expect(popover()).toBeNull();
  });

  it('moves focus into the popover on Enter, ArrowDown and Space', () => {
    for (const key of ['Enter', 'ArrowDown', ' ']) {
      const { rest, removeButtons, detect, fixture } = setup();
      const tag = rest() as HTMLElement;
      tag.focus();
      detect();
      const event = pressKey(tag, key);
      detect();
      expect(event.defaultPrevented).toBe(true);
      expect(document.activeElement).toBe(removeButtons()[0]);
      fixture.destroy();
    }
  });

  it('closes on Escape and returns focus to the tag without reopening', () => {
    const { rest, popover, removeButtons, detect } = setup();
    const tag = rest() as HTMLElement;
    tag.focus();
    pressKey(tag, 'Enter');
    detect();
    expect(document.activeElement).toBe(removeButtons()[0]);

    pressKey(removeButtons()[0], 'Escape');
    detect();
    expect(popover()).toBeNull();
    expect(document.activeElement).toBe(tag);
    expect(tag.getAttribute('aria-expanded')).toBe('false');
  });

  it('closes on Escape with focus on the tag', () => {
    const { rest, popover, detect } = setup();
    const tag = rest() as HTMLElement;
    tag.focus();
    detect();
    pressKey(tag, 'Escape');
    detect();
    expect(popover()).toBeNull();
    expect(document.activeElement).toBe(tag);
  });

  it('hands Tab past the last control on to the combobox, Shift+Tab back to the tag', () => {
    const { rest, popover, removeButtons, combobox, detect, host } = setup();
    const tag = rest() as HTMLElement;
    tag.focus();
    pressKey(tag, 'Enter');
    detect();

    const buttons = removeButtons();
    let event = pressKey(buttons[0], 'Tab', { shiftKey: true });
    expect(event.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(tag);

    pressKey(tag, 'Enter');
    detect();
    buttons[buttons.length - 1].focus();
    event = pressKey(buttons[buttons.length - 1], 'Tab');
    detect();
    expect(event.defaultPrevented).toBe(true);
    expect(popover()).toBeNull();
    expect(document.activeElement).toBe(combobox());
    // Focus never left the select.
    expect(host.blurs).toEqual([]);

    // Tab between the controls inside is left alone.
    tag.focus();
    pressKey(tag, 'Enter');
    detect();
    event = pressKey(removeButtons()[0], 'Tab');
    expect(event.defaultPrevented).toBe(false);
  });

  it('leaves the combobox keyboard handling alone', () => {
    const { combobox, detect, host, popover } = setup();
    pressKey(combobox(), 'Backspace');
    detect();
    expect(host.value()).toEqual(['apple', 'apricot', 'banana', 'cherry']);
    expect(popover()).toBeNull();
  });
});

describe('AndesSelect overflow popover: removing', () => {
  beforeEach(() => keyboardFocus());

  it('emits the same events as removing a visible tag and keeps focus in place', () => {
    const { rest, removeButtons, popoverTags, detect, host } = setup();
    const tag = rest() as HTMLElement;
    tag.focus();
    pressKey(tag, 'Enter');
    detect();

    const buttons = removeButtons();
    expect(buttons.map((button) => button.getAttribute('aria-label'))).toEqual([
      'Remove Banana',
      'Remove Cherry',
      'Remove Grape',
    ]);
    expect(buttons.every((button) => !button.hasAttribute('tabindex'))).toBe(
      true,
    );

    buttons[1].focus();
    click(buttons[1]);
    detect();

    expect(host.deselected).toEqual(['cherry']);
    expect(host.changes).toEqual([['apple', 'apricot', 'banana', 'grape']]);
    expect(host.value()).toEqual(['apple', 'apricot', 'banana', 'grape']);
    expect(popoverTags()).toEqual(['Banana', 'Grape']);
    expect(rest()?.textContent?.trim()).toBe('+ 2 ...');
    // Focus moved to the control now at the same place: Grape's remove button.
    expect(document.activeElement).toBe(removeButtons()[1]);
    expect(host.blurs).toEqual([]);
  });

  it('moves focus to the combobox once the last hidden tag goes', () => {
    const { rest, removeButtons, popover, combobox, detect, host } = setup(
      (h) => h.value.set(['apple', 'apricot', 'banana']),
    );
    const tag = rest() as HTMLElement;
    tag.focus();
    pressKey(tag, 'Enter');
    detect();

    click(removeButtons()[0]);
    detect();
    expect(host.value()).toEqual(['apple', 'apricot']);
    expect(rest()).toBeNull();
    expect(popover()).toBeNull();
    expect(document.activeElement).toBe(combobox());
  });

  it('removes with the pointer without moving focus', () => {
    vi.useFakeTimers();
    const { rest, removeButtons, popoverTags, detect, host } = setup();
    pointer(rest() as HTMLElement, 'pointerenter');
    vi.advanceTimersByTime(ANDES_SELECT_OVERFLOW_OPEN_DELAY);
    detect();
    const button = removeButtons()[0];
    const press = new MouseEvent('mousedown', {
      bubbles: true,
      cancelable: true,
    });
    button.dispatchEvent(press);
    expect(press.defaultPrevented).toBe(true);
    click(button);
    detect();
    expect(host.deselected).toEqual(['banana']);
    expect(popoverTags()).toEqual(['Cherry', 'Grape']);
  });

  it('lists a disabled option without a remove button', () => {
    vi.useFakeTimers();
    const { rest, popover, removeButtons, detect } = setup((h) =>
      h.value.set(['apple', 'apricot', 'durian', 'grape']),
    );
    pointer(rest() as HTMLElement, 'pointerenter');
    vi.advanceTimersByTime(ANDES_SELECT_OVERFLOW_OPEN_DELAY);
    detect();
    const tags = popover()?.querySelectorAll('[data-slot="select-tag"]');
    expect(tags?.[0].hasAttribute('data-disabled')).toBe(true);
    expect(removeButtons()).toHaveLength(1);
  });
});

describe('AndesSelect overflow popover: states', () => {
  beforeEach(() => vi.useFakeTimers());

  it('stays informative on a disabled select, without remove buttons or a Tab stop', () => {
    const { rest, popover, popoverTags, removeButtons, detect } = setup((h) =>
      h.disabled.set(true),
    );
    const tag = rest() as HTMLElement;
    expect(tag.hasAttribute('tabindex')).toBe(false);
    expect(tag.getAttribute('aria-disabled')).toBe('true');

    pointer(tag, 'pointerenter');
    vi.advanceTimersByTime(ANDES_SELECT_OVERFLOW_OPEN_DELAY);
    detect();
    expect(popover()).not.toBeNull();
    expect(popoverTags()).toEqual(['Banana', 'Cherry', 'Grape']);
    expect(removeButtons()).toHaveLength(0);

    // Enter has nothing to focus inside.
    pressKey(tag, 'Enter');
    detect();
    expect(popover()).not.toBeNull();
  });

  it('closes when the option list opens, and does not open over it', () => {
    const { rest, popover, detect, select } = setup();
    click(rest() as HTMLElement);
    detect();
    expect(popover()).not.toBeNull();

    select().open();
    detect();
    expect(select().isOpen()).toBe(true);
    expect(popover()).toBeNull();

    pointer(rest() as HTMLElement, 'pointerenter');
    vi.advanceTimersByTime(ANDES_SELECT_OVERFLOW_OPEN_DELAY);
    detect();
    expect(popover()).toBeNull();
  });

  it('closes when nothing is hidden any more', () => {
    const { rest, popover, detect, host } = setup();
    click(rest() as HTMLElement);
    detect();
    host.maxTagCount.set(undefined);
    detect();
    expect(rest()).toBeNull();
    expect(popover()).toBeNull();
  });

  it('closes when maxTagPopover is switched off while open', () => {
    const { rest, popover, detect, host } = setup();
    click(rest() as HTMLElement);
    detect();
    host.popover.set(false);
    detect();
    expect(popover()).toBeNull();
  });

  it('closes once the tag scrolls out of view', () => {
    const { rest, popover, detect } = setup();
    click(rest() as HTMLElement);
    detect();
    const tag = rest() as HTMLElement;

    document.dispatchEvent(new Event('scroll'));
    detect();
    expect(popover()).not.toBeNull();

    vi.spyOn(tag, 'getBoundingClientRect').mockReturnValue({
      top: -40,
      bottom: -10,
      left: 0,
      right: 40,
      width: 40,
      height: 30,
      x: 0,
      y: -40,
      toJSON: () => ({}),
    });
    // A scroll inside the popover is its own business.
    popover()?.dispatchEvent(new Event('scroll'));
    detect();
    expect(popover()).not.toBeNull();

    document.dispatchEvent(new Event('scroll'));
    detect();
    expect(popover()).toBeNull();
  });

  it('takes the field direction', () => {
    const original = window.getComputedStyle.bind(window);
    vi.spyOn(window, 'getComputedStyle').mockImplementation(
      (element, pseudo) => {
        const style = original(element, pseudo);
        if ((element as Element).matches?.('[data-slot="select-tag-rest"]')) {
          return { ...style, direction: 'rtl' } as CSSStyleDeclaration;
        }
        return style;
      },
    );
    const { rest, popover, detect, fixture } = setup();
    click(rest() as HTMLElement);
    detect();
    expect(popover()?.getAttribute('dir')).toBe('rtl');
    // The field's start edge is the right one, on a left-to-right page.
    const overlay = fixture.debugElement
      .query(By.directive(AndesSelectOverflow))
      .injector.get(AndesOverlayPrimitive);
    expect(overlay.config().positioning).toMatchObject({ align: 'end' });
  });
});

describe('AndesSelect overflow popover: customisation', () => {
  beforeEach(() => vi.useFakeTimers());

  it('renders maxTagPopoverTemplate with the hidden tags and a remove callback', () => {
    const { rest, popover, detect, host, fixture } = setup();
    host.popoverTemplate.set(host.customPopover());
    fixture.detectChanges();
    click(rest() as HTMLElement);
    detect();

    expect(
      popover()?.querySelector('[data-testid="custom-popover"]')?.textContent,
    ).toBe('3 hidden');
    click(
      popover()?.querySelector('[data-testid="custom-remove"]') as HTMLElement,
    );
    detect();
    expect(host.deselected).toEqual(['banana']);
    expect(
      popover()?.querySelector('[data-testid="custom-popover"]')?.textContent,
    ).toBe('2 hidden');
  });

  it('renders tagTemplate tags inside the popover, flagged inPopover', () => {
    const { rest, popover, detect, host, root } = setup();
    host.tagTemplate.set(host.customTag());
    detect();
    click(rest() as HTMLElement);
    detect();

    const inPopover = Array.from(
      popover()?.querySelectorAll('[data-slot="select-tag"]') ?? [],
    );
    expect(inPopover.map((tag) => tag.textContent?.trim())).toEqual([
      'Banana',
      'Cherry',
      'Grape',
    ]);
    expect(inPopover[0].getAttribute('data-in-popover')).toBe('true');
    expect(
      root
        .querySelector('.andes-select__selection > [data-slot="select-tag"]')
        ?.getAttribute('data-in-popover'),
    ).toBe('false');
  });

  it('takes localised labels for the tag, the popover and the remove buttons', () => {
    const { rest, popover, removeButtons, detect, root } = setup((h) => {
      h.popoverLabel.set('{count} más seleccionados');
      h.removeLabel.set('Quitar {label}');
    });
    expect(rest()?.getAttribute('aria-label')).toBe('3 más seleccionados');
    click(rest() as HTMLElement);
    detect();
    expect(popover()?.getAttribute('aria-label')).toBe('3 más seleccionados');
    expect(removeButtons()[0].getAttribute('aria-label')).toBe('Quitar Banana');
    expect(
      root
        .querySelector('[data-slot="select-tag-remove"]')
        ?.getAttribute('aria-label'),
    ).toBe('Quitar Apple');
  });
});

describe('AndesSelect overflow popover: responsive tags', () => {
  const widths = new Map<string, number>();

  beforeEach(() => {
    vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockImplementation(
      function (this: HTMLElement) {
        const kind = this.getAttribute('data-measure');
        return kind ? (widths.get(kind) ?? 0) : 0;
      },
    );
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(
      function (this: HTMLElement) {
        return this.classList.contains('andes-select__selection')
          ? (widths.get('selection') ?? 0)
          : 0;
      },
    );
  });

  afterEach(() => widths.clear());

  it('updates the open popover as the hidden set changes', () => {
    widths.set('tag', 60);
    widths.set('rest', 40);
    widths.set('selection', 200);
    const { rest, popoverTags, detect, select } = setup((h) =>
      h.maxTagCount.set('responsive'),
    );
    expect(rest()?.textContent?.trim()).toBe('+ 3 ...');
    click(rest() as HTMLElement);
    detect();
    expect(popoverTags()).toEqual(['Banana', 'Cherry', 'Grape']);

    // The trigger narrows: one tag fits, four are hidden.
    select().setResponsiveTagCount(1);
    detect();
    expect(rest()?.textContent?.trim()).toBe('+ 4 ...');
    expect(popoverTags()).toEqual(['Apricot', 'Banana', 'Cherry', 'Grape']);
  });
});
