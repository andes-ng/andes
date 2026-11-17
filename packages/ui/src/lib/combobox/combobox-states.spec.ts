import { Component, signal, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { AndesOverlayPrimitive } from '@andes-ng/primitives';

import {
  AndesCombobox,
  type AndesComboboxOptionEntry,
  type AndesComboboxPlacement,
} from './combobox';

/** jsdom leaves `keyCode` at 0 on synthetic events; CDK's key manager reads that field. */
const KEY_CODES: Record<string, number> = {
  ArrowUp: 38,
  ArrowDown: 40,
  Enter: 13,
  Escape: 27,
  Home: 36,
  End: 35,
  PageUp: 33,
  PageDown: 34,
};

const FRUITS = [
  'Apple',
  'Apricot',
  'Banana',
  'Blueberry',
  'Cherry',
  'Cranberry',
  'Grape',
  'Kiwi',
  'Lemon',
  'Mango',
  'Orange',
  'Peach',
  'Pineapple',
  'Strawberry',
];

const FRUIT_OPTIONS: readonly AndesComboboxOptionEntry<string>[] = FRUITS.map(
  (label) => ({
    value: label.toLowerCase(),
    label,
    disabled: label === 'Cherry',
  }),
);

@Component({
  imports: [AndesCombobox, FormsModule],
  template: `
    <div [attr.dir]="dir()">
      <andes-combobox
        [options]="options()"
        [(ngModel)]="value"
        [autoHighlight]="autoHighlight()"
        [allowClear]="allowClear()"
        [placement]="placement()"
        [selectOnBlur]="selectOnBlur()"
        aria-label="Fruit"
      />
    </div>
  `,
})
class StatesHost {
  readonly combobox = viewChild.required(AndesCombobox<string>);
  readonly options =
    signal<readonly AndesComboboxOptionEntry<string>[]>(FRUIT_OPTIONS);
  readonly value = signal<string | null>(null);
  readonly autoHighlight = signal(true);
  readonly allowClear = signal(false);
  readonly placement = signal<AndesComboboxPlacement>('bottom-start');
  readonly selectOnBlur = signal(false);
  readonly dir = signal<'ltr' | 'rtl' | null>(null);
}

function setup() {
  const fixture: ComponentFixture<StatesHost> =
    TestBed.createComponent(StatesHost);
  fixture.detectChanges();
  const host = fixture.componentInstance;
  const input = fixture.nativeElement.querySelector(
    'input',
  ) as HTMLInputElement;
  const options = () =>
    Array.from(document.querySelectorAll<HTMLElement>('[role="option"]'));
  const panel = () => document.querySelector<HTMLElement>('[role="listbox"]');
  const painted = () =>
    options()
      .filter((el) => el.hasAttribute('data-active'))
      .map((el) => el.textContent?.trim());
  const activeLabel = () => {
    const id = input.getAttribute('aria-activedescendant');
    return id ? document.getElementById(id)?.textContent?.trim() : undefined;
  };
  const detect = () => fixture.detectChanges();

  async function settle(): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  /** A press on the field, the way a mouse click opens it: pointerdown, focus, click. */
  function clickField(x = 100, y = 20): void {
    input.dispatchEvent(
      new PointerEvent('pointerdown', {
        bubbles: true,
        pointerType: 'mouse',
        screenX: x,
        screenY: y,
      }),
    );
    input.dispatchEvent(new Event('focus'));
    input.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    detect();
  }

  function focus(): void {
    input.dispatchEvent(new Event('focus'));
    detect();
  }

  function type(text: string): void {
    input.value = text;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    detect();
  }

  function press(key: string, init: KeyboardEventInit = {}): KeyboardEvent {
    const event = new KeyboardEvent('keydown', {
      key,
      bubbles: true,
      cancelable: true,
      ...init,
    });
    Object.defineProperty(event, 'keyCode', { get: () => KEY_CODES[key] ?? 0 });
    input.dispatchEvent(event);
    detect();
    return event;
  }

  function pointerMove(
    el: Element,
    x: number,
    y: number,
    pointerType = 'mouse',
  ): void {
    el.dispatchEvent(
      new PointerEvent('pointermove', {
        bubbles: true,
        pointerType,
        screenX: x,
        screenY: y,
      }),
    );
    detect();
  }

  return {
    fixture,
    host,
    input,
    options,
    panel,
    painted,
    activeLabel,
    detect,
    settle,
    clickField,
    focus,
    type,
    press,
    pointerMove,
  };
}

describe('AndesCombobox option states', () => {
  afterEach(() => {
    document
      .querySelectorAll('.cdk-overlay-container')
      .forEach((el) => el.remove());
  });

  describe('opening', () => {
    it('paints no option when the list opens from a click, even with autoHighlight', () => {
      const { clickField, options, painted, input } = setup();
      clickField();

      expect(options().length).toBeGreaterThan(0);
      expect(painted()).toEqual([]);
      expect(input.hasAttribute('aria-activedescendant')).toBe(false);
    });

    it('paints no option when the list opens from focus', () => {
      const { focus, painted } = setup();
      focus();

      expect(painted()).toEqual([]);
    });

    it('ignores a pointermove at the spot of the press that opened the list', () => {
      const { clickField, options, pointerMove, painted } = setup();
      clickField(120, 30);

      // The list appearing under the stationary pointer.
      pointerMove(options()[1], 120, 30);

      expect(painted()).toEqual([]);
    });

    it('highlights an option once the pointer really moves over it', () => {
      const { clickField, options, pointerMove, painted, activeLabel } =
        setup();
      clickField(120, 30);

      pointerMove(options()[1], 120, 34);

      expect(painted()).toEqual(['Apricot']);
      expect(activeLabel()).toBe('Apricot');
    });

    it('never hovers from touch', () => {
      const { clickField, options, pointerMove, painted } = setup();
      clickField();

      pointerMove(options()[1], 5, 5, 'touch');

      expect(painted()).toEqual([]);
    });

    it('drops the hover highlight when the pointer leaves the list', () => {
      const { clickField, options, pointerMove, painted, panel, detect } =
        setup();
      clickField();
      pointerMove(options()[1], 1, 1);
      expect(painted()).toEqual(['Apricot']);

      panel()?.dispatchEvent(new PointerEvent('pointerleave'));
      detect();

      expect(painted()).toEqual([]);
    });

    it('drops the highlight over a disabled option', () => {
      const { clickField, options, pointerMove, painted, activeLabel } =
        setup();
      clickField();
      pointerMove(options()[1], 1, 1);

      pointerMove(
        options().find((el) => el.textContent?.trim() === 'Cherry') as Element,
        1,
        9,
      );

      expect(painted()).toEqual([]);
      expect(activeLabel()).toBeUndefined();
    });

    it('scrolls the selected option to the middle of the list, without highlighting it', async () => {
      const { host, detect, clickField, painted, settle } = setup();
      // The whole list shows although the field holds the selected label.
      host.value.set('strawberry');
      await settle();
      // Strawberry is row 13 of 14: 416px down a 256px-tall list.
      vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(
        function (this: Element) {
          const row = this.getAttribute('role') === 'option';
          const top = row ? 100 + 13 * 32 : 100;
          const height = row ? 32 : 256;
          return { top, height, bottom: top + height } as DOMRect;
        },
      );
      vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(
        256,
      );
      const scrolled = vi.spyOn(Element.prototype, 'scrollTop', 'set');

      clickField();
      await settle();
      detect();

      // 416px down, less half of the room the row leaves: (256 - 32) / 2.
      expect(scrolled).toHaveBeenCalledWith(416 - 112);
      expect(painted()).toEqual([]);
      vi.restoreAllMocks();
    });
  });

  describe('reopening a filled field', () => {
    it('lists every option while the text is still the selected label, filtering on edit', async () => {
      const { host, focus, type, options, settle } = setup();
      host.value.set('kiwi');
      await settle();
      focus();

      expect(options()).toHaveLength(FRUITS.length);
      expect(
        options().find((el) => el.getAttribute('aria-selected') === 'true')
          ?.textContent,
      ).toContain('Kiwi');

      type('Kiw');

      expect(options().map((el) => el.textContent?.trim())).toEqual(['Kiwi']);
      expect(host.value()).toBeNull();
    });
  });

  describe('typing', () => {
    it('paints the first match once the user types, with autoHighlight', () => {
      const { focus, type, painted, activeLabel } = setup();
      focus();

      type('an');

      expect(painted()).toEqual(['Banana']);
      expect(activeLabel()).toBe('Banana');
    });

    it('paints nothing while typing with autoHighlight off', () => {
      const { host, focus, type, painted, detect } = setup();
      host.autoHighlight.set(false);
      detect();
      focus();

      type('an');

      expect(painted()).toEqual([]);
    });

    it('keeps the cursor on the first match when the list re-filters under a resting pointer', () => {
      const { clickField, type, options, pointerMove, painted } = setup();
      clickField(50, 50);
      pointerMove(options()[0], 50, 50);

      type('ap');
      // The re-filtered rows report a move at the very same spot.
      pointerMove(options()[1], 50, 50);

      expect(painted()).toEqual(['Apple']);
    });

    it('brings the first match back when a hover leaves the list', () => {
      const { focus, type, options, pointerMove, painted, panel, detect } =
        setup();
      focus();
      type('ap');
      pointerMove(options()[2], 10, 10);
      expect(painted()).toEqual(['Grape']);

      panel()?.dispatchEvent(new PointerEvent('pointerleave'));
      detect();

      expect(painted()).toEqual(['Apple']);
    });

    it('picks the first match with Enter right after typing', () => {
      const { host, focus, type, press } = setup();
      focus();
      type('ban');

      press('Enter');

      expect(host.value()).toBe('banana');
    });

    it('does not pick anything with Enter on a list that only opened', () => {
      const { host, clickField, press, panel } = setup();
      clickField();

      press('Enter');

      expect(host.value()).toBeNull();
      expect(panel()).toBeTruthy();
    });
  });

  describe('keyboard cursor', () => {
    it('lands on the first option with the first ArrowDown and paints it', () => {
      const { clickField, press, painted } = setup();
      clickField();

      press('ArrowDown');

      expect(painted()).toEqual(['Apple']);
    });

    it('lands on the selected option with the first ArrowDown', async () => {
      const { host, focus, press, painted, settle } = setup();
      host.value.set('kiwi');
      await settle();
      focus();

      press('ArrowDown');

      expect(painted()).toEqual(['Kiwi']);
    });

    it('opens a closed list with the cursor already placed', async () => {
      const { focus, press, painted, panel, settle } = setup();
      focus();
      press('Escape');
      expect(panel()).toBeNull();

      press('ArrowUp');
      await settle();

      expect(panel()).toBeTruthy();
      expect(painted()).toEqual(['Strawberry']);
    });

    it('carries on from the hovered option', () => {
      const { clickField, options, pointerMove, press, painted } = setup();
      clickField();
      pointerMove(options()[3], 9, 9);

      press('ArrowDown');

      expect(painted()).toEqual(['Cranberry']);
    });

    it('jumps by a page with PageDown/PageUp, skipping disabled options', () => {
      const { clickField, press, painted } = setup();
      clickField();
      press('ArrowDown');

      const down = press('PageDown');
      expect(down.defaultPrevented).toBe(true);
      // Ten rows without layout: Apple + 10 = Orange.
      expect(painted()).toEqual(['Orange']);

      press('PageUp');
      expect(painted()).toEqual(['Apple']);
    });

    it('moves the caret with Home/End until an option is highlighted, then jumps', () => {
      const { clickField, press, painted } = setup();
      clickField();

      const caret = press('End');
      expect(caret.defaultPrevented).toBe(false);
      expect(painted()).toEqual([]);

      press('ArrowDown');
      const jump = press('End');
      expect(jump.defaultPrevented).toBe(true);
      expect(painted()).toEqual(['Strawberry']);

      press('Home');
      expect(painted()).toEqual(['Apple']);
    });

    it('leaves modified arrow keys alone', () => {
      const { clickField, press, painted } = setup();
      clickField();

      const event = press('ArrowDown', { altKey: true });

      expect(event.defaultPrevented).toBe(false);
      expect(painted()).toEqual([]);
    });
  });

  describe('Escape', () => {
    it('closes first, then clears the field with allowClear', () => {
      const { host, detect, focus, type, press, panel, input } = setup();
      host.allowClear.set(true);
      detect();
      focus();
      type('ban');
      press('Enter');
      expect(host.value()).toBe('banana');
      press('ArrowDown');
      expect(panel()).toBeTruthy();

      press('Escape');
      expect(panel()).toBeNull();
      expect(host.value()).toBe('banana');

      press('Escape');
      expect(host.value()).toBeNull();
      expect(input.value).toBe('');
    });

    it('does nothing on a closed popup without allowClear', () => {
      const { focus, type, press } = setup();
      focus();
      type('ban');
      press('Escape');

      const second = press('Escape');

      expect(second.defaultPrevented).toBe(false);
    });
  });

  describe('selectOnBlur', () => {
    it('commits the highlighted option when the field loses focus', () => {
      const { host, detect, focus, type, input } = setup();
      host.selectOnBlur.set(true);
      detect();
      focus();
      type('ki');

      input.dispatchEvent(new Event('blur'));
      detect();

      expect(host.value()).toBe('kiwi');
    });

    it('leaves the value alone when nothing is highlighted', () => {
      const { host, detect, clickField, input } = setup();
      host.selectOnBlur.set(true);
      detect();
      clickField();

      input.dispatchEvent(new Event('blur'));
      detect();

      expect(host.value()).toBeNull();
    });
  });

  describe('positioning', () => {
    function positioning(fixture: ComponentFixture<StatesHost>) {
      const overlay = fixture.debugElement
        .query((el) => el.name === 'andes-combobox')
        .injector.get(AndesOverlayPrimitive);
      return overlay.config().positioning;
    }

    it('flips above or below by the room there is and shrinks to it, never beside the field', () => {
      const { fixture } = setup();

      expect(positioning(fixture)).toMatchObject({
        kind: 'anchored',
        side: 'bottom',
        align: 'start',
        matchAnchorWidth: true,
        crossSideFallback: false,
        flexibleDimensions: true,
      });
    });

    it('follows a scrolling ancestor of the field', () => {
      const { fixture } = setup();
      const overlay = fixture.debugElement
        .query((el) => el.name === 'andes-combobox')
        .injector.get(AndesOverlayPrimitive);

      expect(overlay.config().repositionOnScroll).toBe(true);
    });

    it('mirrors start/end for a field laid out right to left on a left-to-right page', () => {
      const { fixture, host, detect, focus, panel } = setup();
      host.dir.set('rtl');
      detect();
      // jsdom computes no direction from `dir`, so the field reports it inline.
      const input = fixture.nativeElement.querySelector('input') as HTMLElement;
      input.style.direction = 'rtl';

      focus();

      expect(positioning(fixture)).toMatchObject({ align: 'end' });
      expect(panel()?.getAttribute('dir')).toBe('rtl');
    });

    it('closes once the field has scrolled out of a scrolling container', () => {
      const { fixture, focus, panel, detect } = setup();
      const scroller = document.createElement('div');
      scroller.style.overflowY = 'auto';
      document.body.appendChild(scroller);
      scroller.appendChild(fixture.nativeElement);
      focus();
      expect(panel()).toBeTruthy();

      const input = fixture.nativeElement.querySelector('input') as HTMLElement;
      input.getBoundingClientRect = () =>
        ({
          top: -60,
          bottom: -28,
          left: 0,
          right: 200,
          width: 200,
          height: 32,
        }) as DOMRect;
      scroller.getBoundingClientRect = () =>
        ({
          top: 0,
          bottom: 300,
          left: 0,
          right: 300,
          width: 300,
          height: 300,
        }) as DOMRect;
      scroller.dispatchEvent(new Event('scroll'));
      detect();

      expect(panel()).toBeNull();
      scroller.remove();
    });

    it('stays open while the field is still in view', () => {
      const { fixture, focus, panel, detect } = setup();
      focus();
      const input = fixture.nativeElement.querySelector('input') as HTMLElement;
      input.getBoundingClientRect = () =>
        ({
          top: 40,
          bottom: 72,
          left: 0,
          right: 200,
          width: 200,
          height: 32,
        }) as DOMRect;

      document.dispatchEvent(new Event('scroll'));
      detect();

      expect(panel()).toBeTruthy();
    });
  });
});
