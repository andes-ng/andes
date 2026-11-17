import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { AndesSelect } from './select';
import { AndesSelectContent } from './select-content';
import { AndesSelectGroup } from './select-group';
import { AndesSelectItem } from './select-item';
import { AndesSelectLabel } from './select-label';
import { AndesSelectSeparator } from './select-separator';
import { AndesSelectTrigger } from './select-trigger';
import { AndesSelectValue } from './select-value';
import type { AndesSelectMode, AndesSelectPanelClass } from './select-state';

/** See `select.spec.ts`: the CDK's key manager reads `keyCode`, which jsdom leaves at 0. */
const KEY_CODES: Record<string, number> = {
  ArrowUp: 38,
  ArrowDown: 40,
  Enter: 13,
  Escape: 27,
  PageUp: 33,
  PageDown: 34,
  End: 35,
  Home: 36,
  ' ': 32,
};

function pressKey(target: Element, key: string): KeyboardEvent {
  const event = new KeyboardEvent('keydown', {
    key,
    bubbles: true,
    cancelable: true,
  });
  Object.defineProperty(event, 'keyCode', {
    get: () => KEY_CODES[key] ?? key.toUpperCase().charCodeAt(0),
  });
  target.dispatchEvent(event);
  return event;
}

/** A click with a real pointer behind it: `detail` counts the presses. */
function pointerClick(target: Element, x = 10, y = 10): void {
  target.dispatchEvent(
    new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      detail: 1,
      screenX: x,
      screenY: y,
    }),
  );
}

/** jsdom has no `PointerEvent` constructor; a mouse event with the field set will do. */
function pointerMove(
  target: Element,
  x: number,
  y: number,
  pointerType = 'mouse',
): void {
  const event = new MouseEvent('pointermove', {
    bubbles: true,
    screenX: x,
    screenY: y,
  });
  Object.defineProperty(event, 'pointerType', { get: () => pointerType });
  target.dispatchEvent(event);
}

const panel = () =>
  document.querySelector<HTMLElement>('[data-slot="select-panel"]');
const options = () =>
  Array.from(
    document.querySelectorAll<HTMLElement>(
      '[data-slot="select-content"] [role="option"]',
    ),
  );
const option = (label: string) =>
  options().find((element) => element.textContent?.trim() === label) as
    HTMLElement | undefined;
const highlighted = () =>
  options()
    .filter((element) => element.hasAttribute('data-highlighted'))
    .map((element) => element.textContent?.trim());
const active = () =>
  options()
    .filter((element) => element.hasAttribute('data-active'))
    .map((element) => element.textContent?.trim());
const joins = () =>
  options()
    .filter((element) => element.hasAttribute('data-selected'))
    .map(
      (element) =>
        `${element.textContent?.trim()}:${element.hasAttribute('data-joined-prev') ? 'p' : '-'}${element.hasAttribute('data-joined-next') ? 'n' : '-'}`,
    );

const FRUITS = [
  { value: 'apple', label: 'Apple' },
  { value: 'apricot', label: 'Apricot' },
  { value: 'banana', label: 'Banana', disabled: true },
  { value: 'cherry', label: 'Cherry' },
  { value: 'grape', label: 'Grape' },
];

@Component({
  imports: [AndesSelect],
  template: `<andes-select
    aria-label="Fruit"
    [mode]="mode()"
    [showSearch]="showSearch()"
    [options]="options()"
    [optionLabelProp]="optionLabelProp()"
    [name]="name()"
    [panelClass]="panelClass()"
    [maxTagCount]="maxTagCount()"
    [maxTagPopover]="maxTagPopover()"
    [(value)]="value"
  />`,
})
class StatesHost {
  readonly mode = signal<AndesSelectMode>('single');
  readonly showSearch = signal<boolean | undefined>(undefined);
  readonly options = signal<readonly object[]>(FRUITS);
  readonly optionLabelProp = signal<string | undefined>(undefined);
  readonly name = signal<string | undefined>(undefined);
  readonly panelClass = signal<AndesSelectPanelClass>(null);
  readonly maxTagCount = signal<number | undefined>(undefined);
  readonly maxTagPopover = signal(true);
  readonly value = signal<unknown>(null);
}

function setup(configure: (host: StatesHost) => void = () => undefined) {
  const fixture = TestBed.createComponent(StatesHost);
  configure(fixture.componentInstance);
  fixture.detectChanges();
  return helpers(fixture);
}

function helpers<T>(fixture: ComponentFixture<T>) {
  const root = fixture.nativeElement as HTMLElement;
  const detect = () => fixture.detectChanges();
  const box = () =>
    root.querySelector<HTMLElement>(
      '[data-slot="select-trigger"]',
    ) as HTMLElement;
  const combobox = () =>
    root.querySelector<HTMLElement>('[role="combobox"]') as HTMLElement;
  const select = () =>
    fixture.debugElement.query(By.directive(AndesSelect))
      .componentInstance as AndesSelect;
  /** Where keys land while the panel is open: the focused option, or the input. */
  const keyTarget = () =>
    (document.activeElement as HTMLElement | null) ?? combobox();
  return {
    fixture,
    host: fixture.componentInstance,
    root,
    detect,
    box,
    combobox,
    select,
    keyTarget,
  };
}

describe('AndesSelect highlight on open', () => {
  it('highlights nothing when the panel is opened with the pointer', () => {
    const { box, detect } = setup();
    pointerClick(box());
    detect();

    expect(active()).toEqual(['Apple']);
    expect(highlighted()).toEqual([]);
    expect(panel()?.hasAttribute('data-cursor')).toBe(false);
  });

  it('keeps the selected option active and scrolled to, but not highlighted', () => {
    const { box, detect } = setup((h) => h.value.set('cherry'));
    pointerClick(box());
    detect();

    expect(active()).toEqual(['Cherry']);
    expect(document.activeElement).toBe(option('Cherry'));
    expect(highlighted()).toEqual([]);
  });

  it('highlights nothing for a panel opened from code', () => {
    const { select, detect } = setup();
    select().open();
    detect();

    expect(active()).toEqual(['Apple']);
    expect(highlighted()).toEqual([]);
  });

  it('highlights the keyboard cursor when opened with the keyboard', () => {
    const { combobox, detect } = setup();
    pressKey(combobox(), 'ArrowDown');
    detect();

    expect(highlighted()).toEqual(['Apple']);
    expect(panel()?.hasAttribute('data-cursor')).toBe(true);
  });

  it('opens on the last option with ArrowUp when nothing is selected', () => {
    const { combobox, detect } = setup();
    pressKey(combobox(), 'ArrowUp');
    detect();

    expect(highlighted()).toEqual(['Grape']);
  });

  it('opens on the selected option with ArrowUp when there is one', () => {
    const { combobox, detect } = setup((h) => h.value.set('apricot'));
    pressKey(combobox(), 'ArrowUp');
    detect();

    expect(highlighted()).toEqual(['Apricot']);
  });

  it('treats a click without a pointer (assistive technology) as a keyboard open', () => {
    const { box, detect } = setup();
    box().click();
    detect();

    expect(highlighted()).toEqual(['Apple']);
  });

  it('opens with the cursor shown from the search input', () => {
    const { combobox, detect } = setup((h) => h.showSearch.set(true));
    pressKey(combobox(), 'ArrowDown');
    detect();

    expect(highlighted()).toEqual(['Apple']);
  });

  it('clears the highlight when the panel closes', () => {
    const { combobox, detect, select } = setup();
    pressKey(combobox(), 'ArrowDown');
    detect();
    select().close();
    detect();
    select().open();
    detect();

    expect(highlighted()).toEqual([]);
  });
});

describe('AndesSelect pointer highlight', () => {
  it('highlights an option once the pointer moves over it, and makes it active', () => {
    const { box, detect, select } = setup();
    const moves: unknown[] = [];
    select().activeOptionChange.subscribe((value) => moves.push(value));
    pointerClick(box(), 10, 10);
    detect();
    pointerMove(option('Cherry') as HTMLElement, 40, 120);
    detect();

    expect(highlighted()).toEqual(['Cherry']);
    expect(active()).toEqual(['Cherry']);
    expect(moves).toEqual(['apple', 'cherry']);
  });

  it('ignores a pointermove at the spot of the click that opened the panel', () => {
    const { box, detect } = setup();
    pointerClick(box(), 25, 30);
    detect();
    // What a browser may send as the list appears under a pointer that never moved.
    pointerMove(option('Apricot') as HTMLElement, 25, 30);
    detect();

    expect(highlighted()).toEqual([]);
    expect(active()).toEqual(['Apple']);
  });

  it('ignores a repeated pointermove at the same spot', () => {
    const { box, detect, combobox } = setup();
    pointerClick(box(), 10, 10);
    detect();
    pointerMove(option('Apricot') as HTMLElement, 50, 50);
    detect();
    pressKey(document.activeElement as HTMLElement, 'ArrowDown');
    detect();
    expect(highlighted()).toEqual(['Cherry']);

    pointerMove(option('Apricot') as HTMLElement, 50, 50);
    detect();

    expect(highlighted()).toEqual(['Cherry']);
    expect(combobox()).toBeTruthy();
  });

  it('does not hover with touch input', () => {
    const { box, detect } = setup();
    pointerClick(box());
    detect();
    pointerMove(option('Cherry') as HTMLElement, 80, 80, 'touch');
    detect();

    expect(highlighted()).toEqual([]);
  });

  it('shows no highlight over a disabled option', () => {
    const { box, detect } = setup();
    pointerClick(box());
    detect();
    pointerMove(option('Apricot') as HTMLElement, 40, 40);
    detect();
    pointerMove(option('Banana') as HTMLElement, 40, 60);
    detect();

    expect(highlighted()).toEqual([]);
    expect(active()).toEqual(['Apricot']);
  });

  it('drops the highlight when the pointer leaves the list', () => {
    const { box, detect } = setup();
    pointerClick(box());
    detect();
    pointerMove(option('Cherry') as HTMLElement, 40, 40);
    detect();
    document
      .querySelector('[data-slot="select-viewport"]')
      ?.dispatchEvent(new MouseEvent('pointerleave'));
    detect();

    expect(highlighted()).toEqual([]);
    expect(active()).toEqual(['Cherry']);
  });

  it('lets the keyboard carry on from the hovered option', () => {
    const { box, detect, keyTarget } = setup();
    pointerClick(box());
    detect();
    pointerMove(option('Apricot') as HTMLElement, 40, 40);
    detect();
    pressKey(keyTarget(), 'ArrowDown');
    detect();

    expect(highlighted()).toEqual(['Cherry']);
  });

  it('commits the hovered option on Enter', () => {
    const { box, detect, keyTarget, host } = setup();
    pointerClick(box());
    detect();
    pointerMove(option('Grape') as HTMLElement, 40, 40);
    detect();
    pressKey(keyTarget(), 'Enter');
    detect();

    expect(host.value()).toBe('grape');
  });
});

describe('AndesSelect first key after a pointer open', () => {
  it('shows the cursor where it is on the first arrow key, then moves it', () => {
    const { box, detect, keyTarget } = setup((h) => h.value.set('apricot'));
    pointerClick(box());
    detect();

    pressKey(keyTarget(), 'ArrowDown');
    detect();
    expect(highlighted()).toEqual(['Apricot']);

    pressKey(keyTarget(), 'ArrowDown');
    detect();
    expect(highlighted()).toEqual(['Cherry']);
  });

  it('shows the cursor on the first Enter instead of picking an unseen option', () => {
    const { box, detect, keyTarget, host } = setup();
    pointerClick(box());
    detect();

    pressKey(keyTarget(), 'Enter');
    detect();
    expect(host.value()).toBeNull();
    expect(highlighted()).toEqual(['Apple']);

    pressKey(keyTarget(), 'Enter');
    detect();
    expect(host.value()).toBe('apple');
  });

  it('does the same from the search input', () => {
    const { box, detect, combobox, host } = setup((h) =>
      h.showSearch.set(true),
    );
    pointerClick(box());
    detect();

    pressKey(combobox(), 'ArrowDown');
    detect();
    expect(highlighted()).toEqual(['Apple']);
    pressKey(combobox(), 'ArrowDown');
    detect();
    expect(highlighted()).toEqual(['Apricot']);
    pressKey(combobox(), 'Enter');
    detect();
    expect(host.value()).toBe('apricot');
  });

  it('highlights the first match as soon as the user types', () => {
    const { box, detect, combobox } = setup((h) => h.showSearch.set(true));
    pointerClick(box());
    detect();
    const input = combobox() as HTMLInputElement;
    input.value = 'gr';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    detect();

    expect(highlighted()).toEqual(['Grape']);
  });

  it('shows the cursor on a typeahead jump', () => {
    const { box, detect, keyTarget } = setup();
    pointerClick(box());
    detect();
    pressKey(keyTarget(), 'End');
    detect();

    expect(highlighted()).toEqual(['Grape']);
  });
});

describe('AndesSelect PageUp/PageDown', () => {
  const ROOMS = Array.from({ length: 30 }, (_, index) => ({
    value: index,
    label: `Room ${index}`,
    disabled: index === 10,
  }));

  it('moves ten options at a time, stepping off disabled ones', () => {
    const { combobox, detect, keyTarget } = setup((h) => h.options.set(ROOMS));
    pressKey(combobox(), 'ArrowDown');
    detect();

    pressKey(keyTarget(), 'PageDown');
    detect();
    // Room 10 is disabled: the nearest enabled option before it.
    expect(highlighted()).toEqual(['Room 9']);

    pressKey(keyTarget(), 'PageDown');
    detect();
    expect(highlighted()).toEqual(['Room 19']);

    pressKey(keyTarget(), 'PageDown');
    pressKey(keyTarget(), 'PageDown');
    detect();
    expect(highlighted()).toEqual(['Room 29']);

    pressKey(keyTarget(), 'PageUp');
    detect();
    expect(highlighted()).toEqual(['Room 19']);
  });

  it('stops at the first option', () => {
    const { combobox, detect, keyTarget } = setup((h) => h.options.set(ROOMS));
    pressKey(combobox(), 'ArrowDown');
    detect();
    pressKey(keyTarget(), 'PageUp');
    detect();

    expect(highlighted()).toEqual(['Room 0']);
  });

  it('works from the search input too, and does nothing while closed', () => {
    const { combobox, detect } = setup((h) => {
      h.options.set(ROOMS);
      h.showSearch.set(true);
    });
    const closed = pressKey(combobox(), 'PageDown');
    expect(closed.defaultPrevented).toBe(false);

    pressKey(combobox(), 'ArrowDown');
    detect();
    pressKey(combobox(), 'PageDown');
    detect();

    expect(highlighted()).toEqual(['Room 9']);
  });

  it('pages by the panel height once the list is laid out', () => {
    const height = vi
      .spyOn(HTMLElement.prototype, 'offsetHeight', 'get')
      .mockReturnValue(32);
    const client = vi
      .spyOn(HTMLElement.prototype, 'clientHeight', 'get')
      .mockReturnValue(160);
    try {
      const { combobox, detect, keyTarget } = setup((h) =>
        h.options.set(ROOMS),
      );
      pressKey(combobox(), 'ArrowDown');
      detect();
      pressKey(keyTarget(), 'PageDown');
      detect();

      // Five rows fit; a page keeps one of them in view.
      expect(highlighted()).toEqual(['Room 4']);
    } finally {
      height.mockRestore();
      client.mockRestore();
    }
  });
});

@Component({
  imports: [
    AndesSelect,
    AndesSelectContent,
    AndesSelectGroup,
    AndesSelectItem,
    AndesSelectLabel,
    AndesSelectSeparator,
    AndesSelectTrigger,
    AndesSelectValue,
  ],
  template: `<andes-select
    aria-label="Produce"
    mode="multiple"
    [(value)]="value"
  >
    <andes-select-trigger><andes-select-value /></andes-select-trigger>
    <andes-select-content>
      <andes-select-item value="a">A</andes-select-item>
      <andes-select-item value="b">B</andes-select-item>
      <andes-select-item value="c" disabled>C</andes-select-item>
      <andes-select-separator />
      <andes-select-item value="d">D</andes-select-item>
      <andes-select-group>
        <andes-select-label>Group</andes-select-label>
        <andes-select-item value="e">E</andes-select-item>
        <andes-select-item value="f">F</andes-select-item>
      </andes-select-group>
      <andes-select-item value="g">G</andes-select-item>
    </andes-select-content>
  </andes-select>`,
})
class RunsHost {
  readonly value = signal<unknown>(['a', 'b', 'c', 'd', 'e', 'f', 'g']);
}

describe('AndesSelect selected runs', () => {
  it('joins consecutive selected options into one block', () => {
    const { box, detect } = setup((h) => {
      h.mode.set('multiple');
      h.value.set(['apple', 'apricot', 'banana', 'grape']);
    });
    pointerClick(box());
    detect();

    expect(joins()).toEqual([
      'Apple:-n',
      'Apricot:pn',
      'Banana:p-',
      'Grape:--',
    ]);
  });

  it('breaks a run at a separator, a group label and a group boundary', () => {
    const fixture = TestBed.createComponent(RunsHost);
    fixture.detectChanges();
    const { box, detect } = helpers(fixture);
    pointerClick(box());
    detect();

    // C is disabled yet selected: it still belongs to the run it sits in.
    expect(joins()).toEqual([
      'A:-n',
      'B:pn',
      'C:p-',
      'D:--',
      'E:-n',
      'F:p-',
      'G:--',
    ]);
  });

  it('joins options that the search leaves next to each other', () => {
    const { box, detect, combobox } = setup((h) => {
      h.mode.set('multiple');
      h.value.set(['apricot', 'grape']);
    });
    pointerClick(box());
    detect();
    expect(joins()).toEqual(['Apricot:--', 'Grape:--']);

    const input = combobox() as HTMLInputElement;
    input.value = 'p';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    detect();

    expect(joins()).toEqual(['Apricot:-n', 'Grape:p-']);
  });

  it('updates a run as options are picked and removed', () => {
    const { box, detect, host } = setup((h) => {
      h.mode.set('multiple');
      h.value.set(['apple']);
    });
    pointerClick(box());
    detect();
    expect(joins()).toEqual(['Apple:--']);

    option('Apricot')?.click();
    detect();
    expect(joins()).toEqual(['Apple:-n', 'Apricot:p-']);

    host.value.set(['apricot']);
    detect();
    expect(joins()).toEqual(['Apricot:--']);
  });

  it('never joins in single mode, where only one option is selected', () => {
    const { box, detect } = setup((h) => h.value.set('apple'));
    pointerClick(box());
    detect();

    expect(joins()).toEqual(['Apple:--']);
  });
});

describe('AndesSelect optionLabelProp', () => {
  const CURRENCIES = [
    { value: 'usd', label: 'US dollar (USD)', code: 'USD' },
    { value: 'pen', label: 'Peruvian sol (PEN)', code: 'PEN' },
    { value: 'eur', label: 'Euro' },
  ];

  it('shows the named field in the trigger, and the label in the panel', () => {
    const { combobox, detect, box } = setup((h) => {
      h.options.set(CURRENCIES);
      h.optionLabelProp.set('code');
      h.value.set('pen');
    });

    expect(combobox().textContent?.trim()).toBe('PEN');
    pointerClick(box());
    detect();
    expect(option('Peruvian sol (PEN)')).toBeTruthy();
  });

  it('shows the named field on tags, falling back to the label', () => {
    const { root } = setup((h) => {
      h.mode.set('multiple');
      h.options.set(CURRENCIES);
      h.optionLabelProp.set('code');
      h.value.set(['usd', 'eur']);
    });

    const tags = Array.from(
      root.querySelectorAll(
        '[data-slot="select-tag"] .andes-select__tag-label',
      ),
      (tag) => tag.textContent?.trim(),
    );
    expect(tags).toEqual(['USD', 'Euro']);
  });
});

describe('AndesSelect native form value', () => {
  const formValues = (root: HTMLElement) =>
    Array.from(
      root.querySelectorAll<HTMLInputElement>(
        '[data-slot="select-form-value"]',
      ),
      (input) => `${input.name}=${input.value}`,
    );

  it('renders one hidden input per value under the given name', () => {
    const { root } = setup((h) => {
      h.mode.set('multiple');
      h.name.set('fruit');
      h.value.set(['apple', 'grape']);
    });

    expect(formValues(root)).toEqual(['fruit=apple', 'fruit=grape']);
  });

  it('serialises object values as JSON', () => {
    const { root } = setup((h) => {
      h.name.set('owner');
      h.options.set([{ value: { id: 1 }, label: 'Ada' }]);
      h.value.set({ id: 1 });
    });

    expect(formValues(root)).toEqual(['owner={"id":1}']);
  });

  it('renders nothing without a name, or without a value', () => {
    const unnamed = setup((h) => h.value.set('apple'));
    expect(formValues(unnamed.root)).toEqual([]);

    const empty = setup((h) => h.name.set('fruit'));
    expect(formValues(empty.root)).toEqual([]);
  });
});

@Component({
  imports: [AndesSelect],
  template: `<andes-select aria-label="Fruit" autoFocus [options]="options" />`,
})
class AutoFocusHost {
  readonly options = FRUITS;
}

describe('AndesSelect autoFocus and panelClass', () => {
  it('focuses the combobox once rendered', async () => {
    const fixture = TestBed.createComponent(AutoFocusHost);
    fixture.autoDetectChanges();
    await fixture.whenStable();

    expect(document.activeElement?.getAttribute('role')).toBe('combobox');
    fixture.destroy();
  });

  it('puts panelClass on the panel next to its own class', () => {
    const { box, detect } = setup((h) => h.panelClass.set(['tinted', 'wide']));
    pointerClick(box());
    detect();

    expect(panel()?.className).toContain('andes-select__panel');
    expect(panel()?.classList.contains('tinted')).toBe(true);
    expect(panel()?.classList.contains('wide')).toBe(true);
  });
});

describe('AndesSelect hidden tags tooltip', () => {
  it('lists the hidden tags in the + N tag tooltip without the popover', () => {
    const { root } = setup((h) => {
      h.mode.set('multiple');
      h.maxTagCount.set(1);
      h.maxTagPopover.set(false);
      h.value.set(['apple', 'cherry', 'grape']);
    });

    expect(
      root
        .querySelector('[data-slot="select-tag-rest"]')
        ?.getAttribute('title'),
    ).toBe('Cherry, Grape');
  });
});

describe('AndesSelect direction', () => {
  function withRtlField() {
    const original = window.getComputedStyle.bind(window);
    return vi
      .spyOn(window, 'getComputedStyle')
      .mockImplementation((element, pseudo) => {
        const style = original(element, pseudo);
        if ((element as Element).closest?.('[data-slot="select-trigger"]')) {
          return { ...style, direction: 'rtl' } as CSSStyleDeclaration;
        }
        return style;
      });
  }

  it('gives the panel the field direction and mirrors start/end alignment', () => {
    const spy = withRtlField();
    try {
      const { box, detect, select } = setup();
      pointerClick(box());
      detect();

      expect(panel()?.getAttribute('dir')).toBe('rtl');
      expect(select().overlay.config().positioning).toMatchObject({
        side: 'bottom',
        align: 'end',
      });
    } finally {
      spy.mockRestore();
    }
  });

  it('keeps the alignment of a left-to-right field', () => {
    const { box, detect, select } = setup();
    pointerClick(box());
    detect();

    expect(panel()?.getAttribute('dir')).toBe('ltr');
    expect(select().overlay.config().positioning).toMatchObject({
      align: 'start',
    });
  });
});

describe('AndesSelect while the page scrolls', () => {
  function rect(top: number, bottom: number): DOMRect {
    return {
      top,
      bottom,
      left: 0,
      right: 200,
      width: 200,
      height: bottom - top,
      x: 0,
      y: top,
      toJSON: () => ({}),
    };
  }

  function scroll(target: EventTarget = document) {
    target.dispatchEvent(new Event('scroll'));
  }

  it('stays open while the trigger is in view', () => {
    const { box, detect, select } = setup();
    vi.spyOn(box(), 'getBoundingClientRect').mockReturnValue(rect(100, 132));
    pointerClick(box());
    detect();
    scroll();

    expect(select().isOpen()).toBe(true);
  });

  it('closes once the trigger has scrolled off the viewport, without scrolling back', () => {
    const { box, detect, select, combobox } = setup();
    const position = vi
      .spyOn(box(), 'getBoundingClientRect')
      .mockReturnValue(rect(100, 132));
    pointerClick(box());
    detect();
    const focus = vi.spyOn(combobox(), 'focus');

    position.mockReturnValue(rect(-80, -48));
    scroll();
    detect();

    expect(select().isOpen()).toBe(false);
    expect(focus).toHaveBeenCalledWith({ preventScroll: true });
  });

  it('closes once the trigger is scrolled out of a scrolling container', () => {
    const { box, detect, select, root } = setup();
    const container = root;
    container.style.overflowY = 'auto';
    vi.spyOn(container, 'getBoundingClientRect').mockReturnValue(
      rect(200, 400),
    );
    const position = vi
      .spyOn(box(), 'getBoundingClientRect')
      .mockReturnValue(rect(250, 282));
    try {
      pointerClick(box());
      detect();
      scroll(container);
      expect(select().isOpen()).toBe(true);

      position.mockReturnValue(rect(150, 182));
      scroll(container);
      detect();
      expect(select().isOpen()).toBe(false);
    } finally {
      container.style.overflowY = '';
    }
  });

  it('ignores scrolling inside its own option list', () => {
    const { box, detect, select } = setup();
    const position = vi
      .spyOn(box(), 'getBoundingClientRect')
      .mockReturnValue(rect(100, 132));
    pointerClick(box());
    detect();
    position.mockReturnValue(rect(-80, -48));

    scroll(document.querySelector('[data-slot="select-viewport"]') as Element);

    expect(select().isOpen()).toBe(true);
  });

  it('does not close a trigger that is not laid out', () => {
    const { box, detect, select } = setup();
    pointerClick(box());
    detect();
    scroll();

    expect(select().isOpen()).toBe(true);
  });

  it('stops listening once closed', () => {
    const { box, detect, select } = setup();
    const position = vi
      .spyOn(box(), 'getBoundingClientRect')
      .mockReturnValue(rect(100, 132));
    pointerClick(box());
    detect();
    select().close();
    detect();
    const close = vi.spyOn(select(), 'close');

    position.mockReturnValue(rect(-80, -48));
    scroll();

    expect(close).not.toHaveBeenCalled();
  });
});
