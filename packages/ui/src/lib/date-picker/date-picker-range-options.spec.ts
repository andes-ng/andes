import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';

import { toDateKey } from '../calendar/date-utils';
import {
  AndesDatePicker,
  type AndesDatePickerActiveIndex,
  type AndesDatePickerPreset,
  type AndesDatePickerValue,
} from './date-picker';

function d(year: number, month1: number, day: number): Date {
  return new Date(year, month1 - 1, day);
}

/** A range value as `YYYY-MM-DD` keys, `null` for an empty side. */
function keys(value: AndesDatePickerValue | undefined): unknown {
  if (!Array.isArray(value)) {
    return value ?? null;
  }
  return (value as readonly (Date | null)[]).map((date) =>
    date ? toDateKey(date) : null,
  );
}

@Component({
  imports: [AndesDatePicker, ReactiveFormsModule],
  template: `
    <button type="button" id="outside">Outside</button>
    <andes-date-picker
      mode="range"
      locale="en-US"
      [defaultMonth]="defaultMonth"
      [formControl]="control"
      [disabledSides]="sides()"
      [allowEmpty]="allowEmpty()"
      [needConfirm]="needConfirm()"
      [format]="format()"
      [presets]="presets()"
      [(activePickerIndex)]="active"
      (valueChange)="values.push($event)"
      (activePickerIndexChange)="indexChanges.push($event)"
      (clear)="clears = clears + 1"
    />
  `,
})
class RangeHost {
  readonly defaultMonth = d(2024, 2, 1);
  readonly control = new FormControl<AndesDatePickerValue>(null);
  readonly sides = signal<readonly [boolean, boolean] | null>(null);
  readonly allowEmpty = signal<boolean | readonly [boolean, boolean]>(false);
  readonly needConfirm = signal<boolean | undefined>(undefined);
  readonly format = signal<string | null>(null);
  readonly presets = signal<readonly AndesDatePickerPreset[]>([]);
  readonly active = signal<AndesDatePickerActiveIndex>(0);
  readonly values: AndesDatePickerValue[] = [];
  readonly indexChanges: AndesDatePickerActiveIndex[] = [];
  clears = 0;
}

/** Without a forms directive, `[disabled]` itself takes the per-side pair. */
@Component({
  imports: [AndesDatePicker],
  template: `<andes-date-picker
    [mode]="mode()"
    locale="en-US"
    [defaultMonth]="defaultMonth"
    [disabled]="disabled()"
    [(value)]="value"
  />`,
})
class PlainRangeHost {
  readonly mode = signal<'single' | 'range'>('range');
  readonly defaultMonth = d(2024, 2, 1);
  readonly disabled = signal<boolean | readonly [boolean, boolean]>(false);
  readonly value = signal<AndesDatePickerValue | undefined>([
    d(2024, 2, 10),
    d(2024, 2, 15),
  ]);
}

function create(setup: (host: RangeHost) => void = () => undefined) {
  const fixture = TestBed.createComponent(RangeHost);
  setup(fixture.componentInstance);
  fixture.detectChanges();
  const root = fixture.nativeElement as HTMLElement;
  const host = fixture.componentInstance;
  const inputs = () =>
    Array.from(
      root.querySelectorAll<HTMLInputElement>(
        '[data-slot^="date-picker-input"]',
      ),
    );
  const panel = () =>
    document.querySelector<HTMLElement>('[data-slot="date-picker-panel"]');
  const detect = () => fixture.detectChanges();
  return {
    fixture,
    root,
    host,
    inputs,
    panel,
    detect,
    texts: () => inputs().map((input) => input.value),
    open: (index = 0) => {
      inputs()[index].focus();
      inputs()[index].click();
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
    type: (index: number, text: string) => {
      const input = inputs()[index];
      input.value = text;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      detect();
    },
    key: (index: number, key: string) => {
      inputs()[index].dispatchEvent(
        new KeyboardEvent('keydown', { key, bubbles: true }),
      );
      detect();
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
    clickOk: () => {
      panel()
        ?.querySelector<HTMLElement>('[data-slot="date-picker-ok"] button')
        ?.click();
      detect();
    },
    clear: () => {
      root
        .querySelector<HTMLButtonElement>('[data-slot="date-picker-clear"]')
        ?.click();
      detect();
    },
  };
}

describe('AndesDatePicker range options', () => {
  afterEach(() => {
    document
      .querySelectorAll('.cdk-overlay-container')
      .forEach((container) => (container.innerHTML = ''));
  });

  describe('disabled per side', () => {
    it('locks the start input: read-only, out of the Tab order, aria-disabled', () => {
      const view = create((host) => {
        host.sides.set([true, false]);
        host.control.setValue([d(2024, 2, 10), d(2024, 2, 15)]);
      });
      const [start, end] = view.inputs();

      expect(start.readOnly).toBe(true);
      expect(start.disabled).toBe(false);
      expect(start.getAttribute('tabindex')).toBe('-1');
      expect(start.getAttribute('aria-disabled')).toBe('true');
      expect(start.hasAttribute('data-locked')).toBe(true);
      expect(end.readOnly).toBe(false);
      expect(end.hasAttribute('tabindex')).toBe(false);
      expect(end.hasAttribute('aria-disabled')).toBe(false);
      // The field as a whole stays enabled.
      expect(
        view.root
          .querySelector('andes-date-picker')
          ?.hasAttribute('data-disabled'),
      ).toBe(false);
      expect(view.texts()).toEqual(['Feb 10, 2024', 'Feb 15, 2024']);
    });

    it('hands focus to the end when the locked start is pressed or focused', () => {
      const view = create((host) => {
        host.sides.set([true, false]);
        host.control.setValue([d(2024, 2, 10), d(2024, 2, 15)]);
      });
      const [start, end] = view.inputs();

      const press = new MouseEvent('mousedown', {
        bubbles: true,
        cancelable: true,
        button: 0,
      });
      start.dispatchEvent(press);
      view.detect();
      expect(press.defaultPrevented).toBe(true);
      expect(document.activeElement).toBe(end);
      expect(view.panel()).toBeTruthy();

      start.focus();
      view.detect();
      expect(document.activeElement).toBe(end);
      expect(view.host.active()).toBe(1);
    });

    it('lets the calendar move only the end, keeping the locked start in forms', () => {
      const view = create((host) => {
        host.sides.set([true, false]);
        host.control.setValue([d(2024, 2, 10), d(2024, 2, 15)]);
      });
      view.open(1);

      expect(
        view
          .panel()
          ?.querySelector(`[data-date="2024-02-09"]`)
          ?.getAttribute('aria-disabled'),
      ).toBe('true');
      view.clickDay(d(2024, 2, 20));

      expect(keys(view.host.control.value)).toEqual([
        '2024-02-10',
        '2024-02-20',
      ]);
      expect(view.panel()).toBeFalsy();
    });

    it('locks the end the same way', () => {
      const view = create((host) => {
        host.sides.set([false, true]);
        host.control.setValue([d(2024, 2, 10), d(2024, 2, 15)]);
      });
      const [start, end] = view.inputs();
      expect(end.readOnly).toBe(true);
      expect(end.getAttribute('aria-disabled')).toBe('true');
      expect(start.readOnly).toBe(false);

      view.open(0);
      view.clickDay(d(2024, 2, 3));
      expect(keys(view.host.control.value)).toEqual([
        '2024-02-03',
        '2024-02-15',
      ]);
    });

    it('clears only the editable side, keeping the locked one', () => {
      const view = create((host) => {
        host.sides.set([true, false]);
        host.allowEmpty.set([false, true]);
        host.control.setValue([d(2024, 2, 10), d(2024, 2, 15)]);
      });
      view.clear();
      expect(view.texts()).toEqual(['Feb 10, 2024', '']);
      expect(keys(view.host.control.value)).toEqual(['2024-02-10', null]);
      expect(view.host.clears).toBe(1);
    });

    it('hides the clear button when only the locked side holds a date', () => {
      const view = create((host) => {
        host.sides.set([true, false]);
        host.allowEmpty.set([false, true]);
        host.control.setValue([d(2024, 2, 10), null]);
      });
      expect(
        view.root.querySelector('[data-slot="date-picker-clear"]'),
      ).toBeNull();
    });

    it('fills only the editable side from a preset', () => {
      const view = create((host) => {
        host.sides.set([true, false]);
        host.control.setValue([d(2024, 2, 10), d(2024, 2, 15)]);
        host.presets.set([
          { label: 'Late Feb', value: [d(2024, 2, 20), d(2024, 2, 28)] },
          { label: 'Early Feb', value: [d(2024, 2, 1), d(2024, 2, 5)] },
        ]);
      });
      view.open(1);
      view
        .panel()
        ?.querySelector<HTMLButtonElement>('.andes-date-picker__preset')
        ?.click();
      view.detect();
      expect(keys(view.host.control.value)).toEqual([
        '2024-02-10',
        '2024-02-28',
      ]);
    });

    it('disables everything with [true, true], and the form disables everything', () => {
      const view = create((host) => host.sides.set([true, true]));
      expect(view.inputs().every((input) => input.disabled)).toBe(true);

      view.host.sides.set([true, false]);
      view.host.control.disable();
      view.detect();
      expect(view.inputs().every((input) => input.disabled)).toBe(true);
    });

    it('keeps a locked empty side valid with allowEmpty', () => {
      const view = create((host) => {
        host.sides.set([true, false]);
        host.allowEmpty.set([true, false]);
      });
      view.open(1);
      view.clickDay(d(2024, 2, 12));
      expect(keys(view.host.control.value)).toEqual([null, '2024-02-12']);
      expect(view.texts()).toEqual(['', 'Feb 12, 2024']);
    });
  });

  describe('disabled with a [start, end] pair', () => {
    function plain(setup: (host: PlainRangeHost) => void) {
      const fixture = TestBed.createComponent(PlainRangeHost);
      setup(fixture.componentInstance);
      fixture.detectChanges();
      const inputs = () =>
        Array.from(
          (
            fixture.nativeElement as HTMLElement
          ).querySelectorAll<HTMLInputElement>(
            '[data-slot^="date-picker-input"]',
          ),
        );
      return { fixture, inputs };
    }

    it('locks the start through [disabled] itself', () => {
      const { inputs } = plain((host) => host.disabled.set([true, false]));
      expect(inputs()[0].getAttribute('aria-disabled')).toBe('true');
      expect(inputs()[0].readOnly).toBe(true);
      expect(inputs()[1].readOnly).toBe(false);
      expect(inputs().some((input) => input.disabled)).toBe(false);
    });

    it('keeps a plain boolean disabling the whole field', () => {
      const { fixture, inputs } = plain((host) => host.disabled.set(true));
      expect(inputs().every((input) => input.disabled)).toBe(true);
      expect(
        (fixture.nativeElement as HTMLElement)
          .querySelector('andes-date-picker')
          ?.hasAttribute('data-disabled'),
      ).toBe(true);
    });

    it('reads the first entry outside range mode', () => {
      const { inputs } = plain((host) => {
        host.mode.set('single');
        host.value.set(d(2024, 2, 10));
        host.disabled.set([true, false]);
      });
      expect(inputs()).toHaveLength(1);
      expect(inputs()[0].disabled).toBe(true);
      expect(inputs()[0].hasAttribute('aria-disabled')).toBe(false);
    });
  });

  describe('allowEmpty', () => {
    it('commits [start, null] once the start is picked, keeping the panel open', () => {
      const view = create((host) => host.allowEmpty.set([false, true]));
      view.open();
      view.clickDay(d(2024, 2, 10));

      expect(keys(view.host.values.at(-1))).toEqual(['2024-02-10', null]);
      expect(keys(view.host.control.value)).toEqual(['2024-02-10', null]);
      expect(view.panel()).toBeTruthy();
      expect(view.host.active()).toBe(1);

      // Closing keeps the open-ended range.
      view.key(0, 'Enter');
      expect(view.panel()).toBeFalsy();
      expect(keys(view.host.control.value)).toEqual(['2024-02-10', null]);
    });

    it('still completes the range with the second pick', () => {
      const view = create((host) => host.allowEmpty.set(true));
      view.open();
      view.clickDay(d(2024, 2, 10));
      view.clickDay(d(2024, 2, 14));
      expect(keys(view.host.control.value)).toEqual([
        '2024-02-10',
        '2024-02-14',
      ]);
      expect(view.panel()).toBeFalsy();
    });

    it('commits [null, end] when the end input is used first', () => {
      const view = create((host) => host.allowEmpty.set([true, false]));
      view.open(1);
      view.clickDay(d(2024, 2, 20));

      expect(keys(view.host.control.value)).toEqual([null, '2024-02-20']);
      expect(view.texts()).toEqual(['', 'Feb 20, 2024']);
      // The empty start is where the next pick goes.
      expect(view.host.active()).toBe(0);
    });

    it('does not emit half a range for a side that may not be empty', () => {
      const view = create((host) => host.allowEmpty.set([true, false]));
      view.open();
      view.clickDay(d(2024, 2, 10));
      expect(view.host.values.at(-1)).toBeNull();
      expect(view.host.control.value).toBeNull();
    });

    it('keeps today behavior without allowEmpty: half a range is null', () => {
      const view = create();
      view.open();
      view.clickDay(d(2024, 2, 10));
      expect(view.host.values).toEqual([null]);
      view.blurToOutside();
      expect(view.host.control.value).toBeNull();
    });

    it('reads half ranges from the form and formats each side', () => {
      const view = create((host) => {
        host.allowEmpty.set(true);
        host.format.set('DD/MM/YYYY');
        host.control.setValue([null, d(2024, 3, 9)]);
      });
      expect(view.texts()).toEqual(['', '09/03/2024']);

      view.host.control.setValue([d(2024, 3, 1), null]);
      view.detect();
      expect(view.texts()).toEqual(['01/03/2024', '']);
    });

    it('drops an end alone from the form without allowEmpty on the start', () => {
      const view = create((host) => {
        host.allowEmpty.set([false, true]);
        host.control.setValue([null, d(2024, 3, 9)]);
      });
      expect(view.texts()).toEqual(['', '']);
    });

    it('commits typed half ranges on blur and keeps the end when the start is emptied', () => {
      const view = create((host) => {
        host.allowEmpty.set(true);
        host.control.setValue([d(2024, 2, 10), d(2024, 2, 15)]);
      });
      view.inputs()[0].focus();
      view.type(0, '');
      view.blurToOutside();
      expect(keys(view.host.control.value)).toEqual([null, '2024-02-15']);
      expect(view.host.clears).toBe(0);

      view.inputs()[1].focus();
      view.type(1, '');
      view.blurToOutside();
      expect(view.host.control.value).toBeNull();
      expect(view.host.clears).toBe(1);
    });

    it('types a single side into an open-ended range', () => {
      const view = create((host) => host.allowEmpty.set([true, false]));
      view.inputs()[1].focus();
      view.type(1, '2024-04-30');
      view.key(1, 'Enter');
      expect(keys(view.host.control.value)).toEqual([null, '2024-04-30']);
    });

    it('confirms a half range with needConfirm', () => {
      const view = create((host) => {
        host.allowEmpty.set([false, true]);
        host.needConfirm.set(true);
      });
      view.open();
      view.clickDay(d(2024, 2, 10));
      expect(view.host.values).toEqual([]);

      const ok = view
        .panel()
        ?.querySelector<HTMLButtonElement>(
          '[data-slot="date-picker-ok"] button',
        );
      expect(ok?.disabled).toBe(false);
      view.clickOk();
      expect(keys(view.host.control.value)).toEqual(['2024-02-10', null]);
    });

    it('satisfies a required validator with an allowed half range', () => {
      const view = create((host) => {
        host.allowEmpty.set([false, true]);
        host.control.setValidators(Validators.required);
      });
      view.host.control.updateValueAndValidity();
      expect(view.host.control.valid).toBe(false);
      view.open();
      view.clickDay(d(2024, 2, 10));
      expect(view.host.control.valid).toBe(true);
    });
  });

  describe('activePickerIndex', () => {
    it('follows focus and the calendar, reporting each move', () => {
      const view = create();
      view.open(0);
      expect(view.host.active()).toBe(0);

      view.clickDay(d(2024, 2, 10));
      expect(view.host.active()).toBe(1);
      expect(view.host.indexChanges).toEqual([1]);
      expect(view.inputs()[1].hasAttribute('data-active')).toBe(true);

      view.clickDay(d(2024, 2, 12));
      view.open(0);
      expect(view.host.active()).toBe(0);
      expect(view.host.indexChanges).toEqual([1, 0]);
    });

    it('makes the end active from outside, so the next pick moves the end', () => {
      const view = create((host) =>
        host.control.setValue([d(2024, 2, 10), d(2024, 2, 15)]),
      );
      view.inputs()[0].focus();
      view.detect();

      view.host.active.set(1);
      view.detect();
      // The picker held focus, so focus follows to the end input.
      expect(document.activeElement).toBe(view.inputs()[1]);

      view.open(1);
      view.clickDay(d(2024, 2, 22));
      expect(keys(view.host.control.value)).toEqual([
        '2024-02-10',
        '2024-02-22',
      ]);
    });

    it('marks the side without moving focus when the picker does not hold it', () => {
      const view = create();
      view.host.active.set(1);
      view.detect();
      expect(document.activeElement).not.toBe(view.inputs()[1]);

      view.fixture.componentInstance.control.setValue(null);
      view.root
        .querySelector<HTMLElement>('[data-slot="date-picker-trigger"]')
        ?.dispatchEvent(
          new MouseEvent('mousedown', {
            bubbles: true,
            cancelable: true,
            button: 0,
          }),
        );
      view.detect();
      expect(document.activeElement).toBe(view.inputs()[1]);
    });

    it('refuses a locked side and puts the model back', async () => {
      const view = create((host) => host.sides.set([false, true]));
      view.host.active.set(1);
      view.detect();
      await view.fixture.whenStable();
      view.detect();
      expect(view.host.active()).toBe(0);
    });

    it('starts on the end when the start is locked', async () => {
      const view = create((host) => {
        host.sides.set([true, false]);
        host.control.setValue([d(2024, 2, 10), d(2024, 2, 15)]);
      });
      await view.fixture.whenStable();
      view.detect();
      expect(view.host.active()).toBe(1);
      view.fixture.debugElement
        .query((element) => element.name === 'andes-date-picker')
        .componentInstance.focus();
      expect(document.activeElement).toBe(view.inputs()[1]);
    });
  });
});
