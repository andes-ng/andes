import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';

import { toDateKey } from '../calendar/date-utils';
import {
  AndesDatePicker,
  type AndesDatePickerMaxTagCount,
  type AndesDatePickerType,
  type AndesDatePickerValue,
} from './date-picker';
import {
  ANDES_DATE_PICKER_OVERFLOW_CLOSE_DELAY,
  ANDES_DATE_PICKER_OVERFLOW_OPEN_DELAY,
} from './date-picker-overflow';

function d(year: number, month1: number, day: number): Date {
  return new Date(year, month1 - 1, day);
}

function keys(value: AndesDatePickerValue | undefined): unknown {
  return Array.isArray(value)
    ? (value as readonly Date[]).map((date) => toDateKey(date))
    : value;
}

/** jsdom has no `PointerEvent` constructor; a mouse event with the field set will do. */
function pointer(target: Element, type: string, pointerType = 'mouse'): void {
  const event = new MouseEvent(type, { bubbles: false, cancelable: true });
  Object.defineProperty(event, 'pointerType', { get: () => pointerType });
  target.dispatchEvent(event);
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

@Component({
  imports: [AndesDatePicker, ReactiveFormsModule],
  template: `
    <button type="button" id="outside">Outside</button>
    <andes-date-picker
      mode="multiple"
      locale="en-US"
      [picker]="picker()"
      [defaultMonth]="defaultMonth"
      [formControl]="control"
      [maxTagCount]="maxTagCount()"
      [maxCount]="maxCount()"
      [needConfirm]="needConfirm()"
      [format]="format()"
      [size]="size()"
      [maxTagPopoverLabel]="popoverLabel()"
      [removeTagLabel]="removeLabel()"
      (valueChange)="values.push($event)"
      (clear)="clears = clears + 1"
    />
  `,
})
class MultipleHost {
  readonly defaultMonth = d(2024, 2, 1);
  readonly control = new FormControl<AndesDatePickerValue>(null);
  readonly picker = signal<AndesDatePickerType>('date');
  readonly maxTagCount = signal<AndesDatePickerMaxTagCount | undefined>(
    undefined,
  );
  readonly maxCount = signal<number | undefined>(undefined);
  readonly needConfirm = signal<boolean | undefined>(undefined);
  readonly format = signal<string | null>(null);
  readonly size = signal<'sm' | 'md' | 'lg'>('md');
  readonly popoverLabel = signal('{count} more selected');
  readonly removeLabel = signal('Remove {label}');
  readonly values: AndesDatePickerValue[] = [];
  clears = 0;
}

function create(setup: (host: MultipleHost) => void = () => undefined) {
  const fixture = TestBed.createComponent(MultipleHost);
  setup(fixture.componentInstance);
  fixture.detectChanges();
  const root = fixture.nativeElement as HTMLElement;
  const host = fixture.componentInstance;
  const detect = () => fixture.detectChanges();
  const input = () =>
    root.querySelector<HTMLInputElement>(
      '[data-slot="date-picker-input"]',
    ) as HTMLInputElement;
  const panel = () =>
    document.querySelector<HTMLElement>('[data-slot="date-picker-panel"]');
  const popover = () =>
    document.querySelector<HTMLElement>('[data-slot="date-picker-overflow"]');
  const fieldTags = () =>
    Array.from(
      root.querySelectorAll<HTMLElement>(
        '.andes-date-picker__selection > [data-slot="date-picker-tag"]',
      ),
    );
  return {
    fixture,
    root,
    host,
    detect,
    input,
    panel,
    popover,
    fieldTags,
    tagTexts: () =>
      fieldTags().map((tag) =>
        tag.querySelector('.andes-date-picker__tag-label')?.textContent?.trim(),
      ),
    rest: () =>
      root.querySelector<HTMLElement>(
        '.andes-date-picker__selection > [data-slot="date-picker-tag-rest"]',
      ),
    popoverTexts: () =>
      Array.from(
        popover()?.querySelectorAll('.andes-date-picker__tag-label') ?? [],
        (label) => label.textContent?.trim(),
      ),
    open: () => {
      input().focus();
      input().click();
      detect();
    },
    clickDay: (date: Date) => {
      const cell = panel()?.querySelector<HTMLButtonElement>(
        `[data-date="${toDateKey(date)}"]`,
      );
      if (!cell) {
        throw new Error(`No cell for ${toDateKey(date)}`);
      }
      cell.click();
      detect();
    },
    type: (text: string) => {
      input().value = text;
      input().dispatchEvent(new Event('input', { bubbles: true }));
      detect();
    },
    key: (target: Element, key: string) => {
      // The overlay reads Escape from `keyCode`, as a real key press sets it.
      const event = new KeyboardEvent('keydown', {
        key,
        keyCode: key === 'Escape' ? 27 : 0,
        bubbles: true,
        cancelable: true,
      });
      target.dispatchEvent(event);
      detect();
      return event;
    },
    blurToOutside: () => {
      const outside = root.querySelector<HTMLElement>('#outside');
      root
        .querySelector('[data-slot="date-picker-trigger"]')
        ?.dispatchEvent(
          new FocusEvent('focusout', { bubbles: true, relatedTarget: outside }),
        );
      outside?.focus();
      detect();
    },
  };
}

describe('AndesDatePicker multiple mode', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    document
      .querySelectorAll('.cdk-overlay-container')
      .forEach((container) => (container.innerHTML = ''));
  });

  describe('selection', () => {
    it('toggles dates from the calendar, keeping the panel open', () => {
      const view = create();
      view.open();
      view.clickDay(d(2024, 2, 20));
      view.clickDay(d(2024, 2, 5));
      view.clickDay(d(2024, 2, 12));

      expect(keys(view.host.control.value)).toEqual([
        '2024-02-05',
        '2024-02-12',
        '2024-02-20',
      ]);
      expect(view.panel()).toBeTruthy();
      expect(view.tagTexts()).toEqual([
        'Feb 5, 2024',
        'Feb 12, 2024',
        'Feb 20, 2024',
      ]);

      view.clickDay(d(2024, 2, 12));
      expect(keys(view.host.values.at(-1))).toEqual([
        '2024-02-05',
        '2024-02-20',
      ]);
      expect(view.host.values).toHaveLength(4);
    });

    it('shows one tag per period when the picker changes under dates that share a period', () => {
      const view = create((host) =>
        host.control.setValue([d(2024, 2, 2), d(2024, 2, 14), d(2024, 3, 5)]),
      );
      expect(view.fieldTags()).toHaveLength(3);

      view.host.picker.set('month');
      view.detect();

      expect(view.fieldTags().map((tag) => tag.textContent?.trim())).toEqual([
        expect.stringContaining('Feb 2024'),
        expect.stringContaining('Mar 2024'),
      ]);
    });

    it('shows the placeholder only while no date is selected', () => {
      const view = create();
      expect(view.input().placeholder).toBe('Select dates');
      expect(
        view.root
          .querySelector('[data-slot="date-picker-trigger"]')
          ?.hasAttribute('data-empty'),
      ).toBe(true);

      view.host.control.setValue([d(2024, 2, 1)]);
      view.detect();
      expect(view.input().placeholder).toBe('');
      expect(view.input().value).toBe('');
    });

    it('reads arrays from the form, and an empty list for null', () => {
      const view = create((host) =>
        host.control.setValue([d(2024, 2, 9), d(2024, 2, 1), d(2024, 2, 9)]),
      );
      expect(view.tagTexts()).toEqual(['Feb 1, 2024', 'Feb 9, 2024']);

      view.host.control.setValue(null);
      view.detect();
      expect(view.fieldTags()).toHaveLength(0);
      view.open();
      view.clickDay(d(2024, 2, 3));
      expect(keys(view.host.control.value)).toEqual(['2024-02-03']);
    });

    it('treats an empty list as missing for a required validator', () => {
      const view = create((host) =>
        host.control.setValidators(Validators.required),
      );
      view.host.control.updateValueAndValidity();
      view.open();
      view.clickDay(d(2024, 2, 3));
      expect(view.host.control.valid).toBe(true);
      view.clickDay(d(2024, 2, 3));
      expect(view.host.control.value).toEqual([]);
      expect(view.host.control.valid).toBe(false);
    });

    it('clears to an empty list and emits clear', () => {
      const view = create((host) =>
        host.control.setValue([d(2024, 2, 1), d(2024, 2, 2)]),
      );
      view.root
        .querySelector<HTMLButtonElement>('[data-slot="date-picker-clear"]')
        ?.click();
      view.detect();
      expect(view.host.control.value).toEqual([]);
      expect(view.host.clears).toBe(1);
      expect(view.fieldTags()).toHaveLength(0);
    });

    it('caps the selection with maxCount', () => {
      const view = create((host) => host.maxCount.set(2));
      view.open();
      view.clickDay(d(2024, 2, 3));
      view.clickDay(d(2024, 2, 4));
      expect(
        view
          .panel()
          ?.querySelector('[data-date="2024-02-05"]')
          ?.getAttribute('aria-disabled'),
      ).toBe('true');

      // Typing past the cap is refused too.
      view.type('2024-02-06');
      view.key(view.input(), 'Enter');
      expect(keys(view.host.control.value)).toEqual([
        '2024-02-03',
        '2024-02-04',
      ]);
    });

    it('selects months with picker="month", formatted for the picker', () => {
      const view = create((host) => host.picker.set('month'));
      view.open();
      view
        .panel()
        ?.querySelector<HTMLButtonElement>('[data-date="2024-05-01"]')
        ?.click();
      view.detect();
      view
        .panel()
        ?.querySelector<HTMLButtonElement>('[data-date="2024-03-01"]')
        ?.click();
      view.detect();
      expect(keys(view.host.control.value)).toEqual([
        '2024-03-01',
        '2024-05-01',
      ]);
      expect(view.tagTexts()).toEqual(['Mar 2024', 'May 2024']);
    });

    it('normalizes form dates to the picker period and uses token formats', () => {
      const view = create((host) => {
        host.picker.set('week');
        host.control.setValue([d(2024, 2, 15)]);
      });
      expect(view.tagTexts()).toEqual(['2024-W07']);

      const formatted = create((host) => {
        host.format.set('DD/MM/YYYY');
        host.control.setValue([d(2024, 2, 15)]);
      });
      expect(formatted.tagTexts()).toEqual(['15/02/2024']);
    });

    it('holds toggles until OK with needConfirm, and drops them on close', () => {
      const view = create((host) => {
        host.needConfirm.set(true);
        host.control.setValue([d(2024, 2, 1)]);
      });
      view.open();
      view.clickDay(d(2024, 2, 7));
      expect(view.host.values).toEqual([]);
      expect(view.tagTexts()).toEqual(['Feb 1, 2024', 'Feb 7, 2024']);

      view.key(document.body, 'Escape');
      expect(view.panel()).toBeFalsy();
      expect(view.tagTexts()).toEqual(['Feb 1, 2024']);

      view.open();
      view.clickDay(d(2024, 2, 7));
      view
        .panel()
        ?.querySelector<HTMLElement>('[data-slot="date-picker-ok"] button')
        ?.click();
      view.detect();
      expect(keys(view.host.control.value)).toEqual([
        '2024-02-01',
        '2024-02-07',
      ]);
    });
  });

  describe('typing and keys', () => {
    it('adds a typed date on Enter, clearing the text and staying open', () => {
      const view = create();
      view.open();
      view.type('2024-02-14');
      // Typing only shows the date; it is not selected until Enter.
      expect(view.fieldTags()).toHaveLength(0);
      view.key(view.input(), 'Enter');

      expect(keys(view.host.control.value)).toEqual(['2024-02-14']);
      expect(view.input().value).toBe('');
      expect(view.panel()).toBeTruthy();

      // The same date again is not added twice.
      view.type('Feb 14, 2024');
      view.key(view.input(), 'Enter');
      expect(keys(view.host.control.value)).toEqual(['2024-02-14']);
    });

    it('adds a typed date on blur, and discards invalid text', () => {
      const view = create();
      view.open();
      view.type('2024-02-14');
      view.blurToOutside();
      expect(keys(view.host.control.value)).toEqual(['2024-02-14']);

      view.open();
      view.type('nope');
      view.blurToOutside();
      expect(view.input().value).toBe('');
      expect(keys(view.host.control.value)).toEqual(['2024-02-14']);
    });

    it('removes the last date with Backspace in the empty input only', () => {
      const view = create((host) =>
        host.control.setValue([d(2024, 2, 1), d(2024, 2, 2)]),
      );
      view.input().focus();
      const handled = view.key(view.input(), 'Backspace');
      expect(handled.defaultPrevented).toBe(true);
      expect(keys(view.host.control.value)).toEqual(['2024-02-01']);

      view.type('20');
      const typing = view.key(view.input(), 'Backspace');
      expect(typing.defaultPrevented).toBe(false);
      expect(keys(view.host.control.value)).toEqual(['2024-02-01']);
    });

    it('removes a date with its tag button, which stays out of the Tab order', () => {
      const view = create((host) =>
        host.control.setValue([d(2024, 2, 1), d(2024, 2, 2)]),
      );
      const remove = view
        .fieldTags()[0]
        .querySelector<HTMLButtonElement>(
          '[data-slot="date-picker-tag-remove"]',
        ) as HTMLButtonElement;
      expect(remove.getAttribute('aria-label')).toBe('Remove Feb 1, 2024');
      expect(remove.getAttribute('tabindex')).toBe('-1');

      remove.click();
      view.detect();
      expect(keys(view.host.control.value)).toEqual(['2024-02-02']);
      expect(document.activeElement).toBe(view.input());
      expect(view.panel()).toBeFalsy();
    });

    it('lists no remove buttons while disabled', () => {
      const view = create((host) => {
        host.control.setValue([d(2024, 2, 1)]);
        host.control.disable();
      });
      expect(
        view.root.querySelector('[data-slot="date-picker-tag-remove"]'),
      ).toBeNull();
      view.key(view.input(), 'Backspace');
      expect(view.host.control.value).toHaveLength(1);
    });
  });

  describe('maxTagCount and the + N popover', () => {
    const four = [d(2024, 2, 1), d(2024, 2, 2), d(2024, 2, 3), d(2024, 2, 4)];

    it('shows maxTagCount tags and a + N button for the rest', () => {
      const view = create((host) => {
        host.maxTagCount.set(2);
        host.control.setValue(four);
      });
      expect(view.tagTexts()).toEqual(['Feb 1, 2024', 'Feb 2, 2024']);
      const rest = view.rest() as HTMLElement;
      expect(rest.textContent?.trim()).toBe('+ 2 ...');
      expect(rest.getAttribute('role')).toBe('button');
      expect(rest.getAttribute('tabindex')).toBe('0');
      expect(rest.getAttribute('aria-label')).toBe('2 more selected');
      expect(rest.getAttribute('aria-haspopup')).toBe('dialog');
      expect(rest.getAttribute('aria-expanded')).toBe('false');
    });

    it('opens the popover on click, listing the hidden dates with remove buttons', () => {
      const view = create((host) => {
        host.maxTagCount.set(2);
        host.control.setValue(four);
      });
      const rest = view.rest() as HTMLElement;
      const press = new MouseEvent('mousedown', {
        bubbles: true,
        cancelable: true,
        button: 0,
      });
      rest.dispatchEvent(press);
      rest.click();
      view.detect();

      // The press neither opens the calendar nor steals focus from the input.
      expect(press.defaultPrevented).toBe(true);
      expect(view.panel()).toBeFalsy();
      expect(view.popover()?.getAttribute('aria-label')).toBe(
        '2 more selected',
      );
      expect(rest.getAttribute('aria-expanded')).toBe('true');
      expect(view.popoverTexts()).toEqual(['Feb 3, 2024', 'Feb 4, 2024']);
      const buttons = Array.from(
        view
          .popover()
          ?.querySelectorAll<HTMLButtonElement>(
            '[data-slot="date-picker-tag-remove"]',
          ) ?? [],
      );
      expect(buttons.every((button) => !button.hasAttribute('tabindex'))).toBe(
        true,
      );

      buttons[0].click();
      view.detect();
      expect(keys(view.host.control.value)).toEqual([
        '2024-02-01',
        '2024-02-02',
        '2024-02-04',
      ]);
      expect(view.popoverTexts()).toEqual(['Feb 4, 2024']);

      // A second click closes a pinned popover.
      rest.click();
      view.detect();
      expect(rest.getAttribute('aria-expanded')).toBe('false');
    });

    it('opens on hover after a delay and closes after the pointer leaves', () => {
      vi.useFakeTimers();
      const view = create((host) => {
        host.maxTagCount.set(1);
        host.control.setValue(four);
      });
      const rest = view.rest() as HTMLElement;
      pointer(rest, 'pointerenter');
      vi.advanceTimersByTime(ANDES_DATE_PICKER_OVERFLOW_OPEN_DELAY - 1);
      view.detect();
      expect(view.popover()).toBeFalsy();
      vi.advanceTimersByTime(1);
      view.detect();
      expect(view.popoverTexts()).toHaveLength(3);

      // Crossing into the popover keeps it open.
      pointer(rest, 'pointerleave');
      pointer(view.popover() as HTMLElement, 'pointerenter');
      vi.advanceTimersByTime(ANDES_DATE_PICKER_OVERFLOW_CLOSE_DELAY * 3);
      view.detect();
      expect(rest.getAttribute('aria-expanded')).toBe('true');

      pointer(view.popover() as HTMLElement, 'pointerleave');
      vi.advanceTimersByTime(ANDES_DATE_PICKER_OVERFLOW_CLOSE_DELAY);
      view.detect();
      expect(rest.getAttribute('aria-expanded')).toBe('false');

      // Touch never hovers.
      pointer(rest, 'pointerenter', 'touch');
      vi.advanceTimersByTime(ANDES_DATE_PICKER_OVERFLOW_OPEN_DELAY * 2);
      view.detect();
      expect(rest.getAttribute('aria-expanded')).toBe('false');
    });

    it('opens on keyboard focus, moves in with ArrowDown and closes on Escape', () => {
      keyboardFocus();
      const view = create((host) => {
        host.maxTagCount.set(2);
        host.control.setValue(four);
      });
      const rest = view.rest() as HTMLElement;
      rest.focus();
      view.detect();
      expect(rest.getAttribute('aria-expanded')).toBe('true');

      view.key(rest, 'ArrowDown');
      const first = view
        .popover()
        ?.querySelector('[data-slot="date-picker-tag-remove"]');
      expect(document.activeElement).toBe(first);

      view.key(view.popover() as HTMLElement, 'Escape');
      expect(rest.getAttribute('aria-expanded')).toBe('false');
      expect(document.activeElement).toBe(rest);
    });

    it('sends Tab past the last remove button on to the input', () => {
      keyboardFocus();
      const view = create((host) => {
        host.maxTagCount.set(3);
        host.control.setValue(four);
      });
      const rest = view.rest() as HTMLElement;
      rest.focus();
      view.detect();
      view.key(rest, 'Enter');
      const tab = view.key(document.activeElement as Element, 'Tab');
      expect(tab.defaultPrevented).toBe(true);
      expect(document.activeElement).toBe(view.input());
      expect(rest.getAttribute('aria-expanded')).toBe('false');
    });

    it('moves focus to the input when the last hidden date is removed', async () => {
      keyboardFocus();
      const view = create((host) => {
        host.maxTagCount.set(3);
        host.control.setValue(four);
      });
      (view.rest() as HTMLElement).focus();
      view.detect();
      view.key(view.rest() as HTMLElement, 'Enter');
      (document.activeElement as HTMLButtonElement).click();
      view.detect();
      await view.fixture.whenStable();
      expect(view.rest()).toBeNull();
      expect(document.activeElement).toBe(view.input());
    });

    it('never shows while the calendar is open', () => {
      const view = create((host) => {
        host.maxTagCount.set(2);
        host.control.setValue(four);
      });
      const rest = view.rest() as HTMLElement;
      rest.click();
      view.detect();
      expect(view.popover()).toBeTruthy();

      view.open();
      expect(view.panel()).toBeTruthy();
      expect(rest.getAttribute('aria-expanded')).toBe('false');
      rest.click();
      view.detect();
      expect(rest.getAttribute('aria-expanded')).toBe('false');
    });

    it('takes localized labels and the field size', () => {
      const view = create((host) => {
        host.maxTagCount.set(0);
        host.control.setValue(four.slice(0, 2));
        host.popoverLabel.set('{count} fechas más');
        host.removeLabel.set('Quitar {label}');
        host.size.set('sm');
      });
      expect(view.rest()?.getAttribute('aria-label')).toBe('2 fechas más');
      view.rest()?.click();
      view.detect();
      expect(view.popover()?.getAttribute('data-size')).toBe('sm');
      expect(
        view
          .popover()
          ?.querySelector('[data-slot="date-picker-tag-remove"]')
          ?.getAttribute('aria-label'),
      ).toBe('Quitar Feb 1, 2024');
    });

    it('still opens for a disabled picker, without a Tab stop or remove buttons', () => {
      const view = create((host) => {
        host.maxTagCount.set(1);
        host.control.setValue(four);
        host.control.disable();
      });
      const rest = view.rest() as HTMLElement;
      expect(rest.hasAttribute('tabindex')).toBe(false);
      expect(rest.getAttribute('aria-disabled')).toBe('true');
      rest.click();
      view.detect();
      expect(view.popoverTexts()).toHaveLength(3);
      expect(
        view.popover()?.querySelector('[data-slot="date-picker-tag-remove"]'),
      ).toBeNull();
    });
  });

  describe('maxTagCount="responsive"', () => {
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
          return this.classList.contains('andes-date-picker__selection')
            ? (widths.get('selection') ?? 0)
            : 0;
        },
      );
    });

    afterEach(() => widths.clear());

    it('shows as many tags as fit beside the + N tag and the input', () => {
      widths.set('tag', 90);
      widths.set('rest', 40);
      widths.set('selection', 300);
      const view = create((host) => {
        host.maxTagCount.set('responsive');
        host.control.setValue([
          d(2024, 2, 1),
          d(2024, 2, 2),
          d(2024, 2, 3),
          d(2024, 2, 4),
        ]);
      });
      view.detect();
      expect(
        view.root
          .querySelector('[data-slot="date-picker-trigger"]')
          ?.hasAttribute('data-responsive'),
      ).toBe(true);
      // 300px minus the input's reserve: two 90px tags and the 40px + N tag.
      expect(view.fieldTags()).toHaveLength(2);
      expect(view.rest()?.textContent?.trim()).toBe('+ 2 ...');
      // Every tag is measured in an inert, hidden row.
      const measure = view.root.querySelector(
        '[data-slot="date-picker-tag-measure"]',
      );
      expect(measure?.getAttribute('aria-hidden')).toBe('true');
      expect(measure?.hasAttribute('inert')).toBe(true);
      expect(measure?.querySelectorAll('[data-measure="tag"]')).toHaveLength(4);
    });

    it('shows every tag when they all fit, and keeps one when none does', () => {
      widths.set('tag', 40);
      widths.set('rest', 40);
      widths.set('selection', 400);
      const view = create((host) => {
        host.maxTagCount.set('responsive');
        host.control.setValue([d(2024, 2, 1), d(2024, 2, 2)]);
      });
      view.detect();
      expect(view.fieldTags()).toHaveLength(2);
      expect(view.rest()).toBeNull();

      widths.set('tag', 500);
      view.host.control.setValue([d(2024, 2, 1), d(2024, 2, 2), d(2024, 2, 3)]);
      view.detect();
      view.detect();
      expect(view.fieldTags()).toHaveLength(1);
      expect(view.rest()?.textContent?.trim()).toBe('+ 2 ...');
    });
  });
});
