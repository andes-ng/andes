import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { toDateKey } from '../calendar/date-utils';
import {
  AndesDatePicker,
  type AndesDatePickerCalendarChange,
  type AndesDatePickerIds,
  type AndesDatePickerMode,
  type AndesDatePickerType,
  type AndesDatePickerValue,
  type AndesDatePickerValueText,
  type AndesTimeDisabledFn,
  type AndesTimeOptions,
} from './date-picker';

function d(year: number, month1: number, day: number): Date {
  return new Date(year, month1 - 1, day);
}

/** The visible month captions of the open panel. */
function captions(): string[] {
  return Array.from(
    document.querySelectorAll(
      '[data-slot="date-picker-panel"] [data-slot="calendar-caption"]',
    ),
    (caption) => caption.textContent?.trim() ?? '',
  );
}

function panelButton(slot: string): HTMLElement | null {
  return document.querySelector<HTMLElement>(
    `[data-slot="date-picker-panel"] [data-slot="${slot}"]`,
  );
}

@Component({
  imports: [AndesDatePicker],
  template: `<andes-date-picker
    locale="en-US"
    [mode]="mode()"
    [defaultMonth]="defaultMonth()"
    [(pickerValue)]="pickerValue"
    [(value)]="value"
  />`,
})
class PanelMonthHost {
  readonly mode = signal<AndesDatePickerMode>('single');
  readonly defaultMonth = signal<Date | readonly [Date, Date] | null>(null);
  readonly pickerValue = signal<Date | readonly [Date, Date] | null>(null);
  readonly value = signal<AndesDatePickerValue | undefined>(undefined);
}

describe('AndesDatePicker panel month', () => {
  function create(setup: (host: PanelMonthHost) => void = () => undefined) {
    const fixture = TestBed.createComponent(PanelMonthHost);
    setup(fixture.componentInstance);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const input = () =>
      root.querySelector<HTMLInputElement>(
        '[data-slot^="date-picker-input"]',
      ) as HTMLInputElement;
    return {
      fixture,
      host: fixture.componentInstance,
      open: () => {
        input().focus();
        input().click();
        fixture.detectChanges();
      },
      click: (slot: string) => {
        panelButton(slot)?.click();
        fixture.detectChanges();
      },
      detect: () => fixture.detectChanges(),
    };
  }

  it('opens on pickerValue rather than on the value', () => {
    const view = create((host) => {
      host.value.set(d(2024, 2, 15));
      host.pickerValue.set(d(2025, 7, 3));
    });
    view.open();

    expect(captions()).toEqual(['July 2025']);
  });

  it('writes the navigation back through pickerValueChange', () => {
    const view = create((host) => host.pickerValue.set(d(2025, 7, 3)));
    view.open();

    view.click('calendar-next');

    expect(captions()).toEqual(['August 2025']);
    expect(toDateKey(view.host.pickerValue() as Date)).toBe('2025-08-01');
  });

  it('moves an open panel when pickerValue changes from outside', () => {
    const view = create((host) => host.pickerValue.set(d(2025, 7, 3)));
    view.open();

    view.host.pickerValue.set(d(2023, 1, 1));
    view.detect();

    expect(captions()).toEqual(['January 2023']);
  });

  it('takes a range pair, of which the first date counts', () => {
    const view = create((host) => {
      host.mode.set('range');
      host.pickerValue.set([d(2025, 3, 1), d(2025, 9, 1)]);
    });
    view.open();

    expect(captions()).toEqual(['March 2025', 'April 2025']);
  });

  it('lets defaultMonth take a range pair too', () => {
    const view = create((host) => {
      host.mode.set('range');
      host.defaultMonth.set([d(2026, 11, 1), d(2027, 1, 1)]);
    });
    view.open();

    expect(captions()).toEqual(['November 2026', 'December 2026']);
  });
});

@Component({
  imports: [AndesDatePicker],
  template: `<andes-date-picker
    [locale]="locale()"
    [format]="format()"
    [(value)]="value"
  />`,
})
class EraHost {
  readonly locale = signal('th-TH');
  readonly format = signal<string | null>(null);
  readonly value = signal<AndesDatePickerValue | undefined>(d(2024, 2, 15));
}

describe('AndesDatePicker Buddhist era', () => {
  function create(setup: (host: EraHost) => void = () => undefined) {
    const fixture = TestBed.createComponent(EraHost);
    setup(fixture.componentInstance);
    fixture.detectChanges();
    const input = (fixture.nativeElement as HTMLElement).querySelector(
      'input',
    ) as HTMLInputElement;
    return {
      host: fixture.componentInstance,
      input,
      type: (text: string) => {
        input.focus();
        input.value = text;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(
          new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }),
        );
        fixture.detectChanges();
      },
    };
  }

  it('shows the year of a Buddhist-calendar locale and reads it back', () => {
    const view = create();
    expect(view.input.value).toContain('2567');

    view.type(view.input.value.replace('15', '20'));

    expect(toDateKey(view.host.value() as Date)).toBe('2024-02-20');
  });

  it('takes the BBBB token in a format', () => {
    const view = create((host) => {
      host.locale.set('en-US');
      host.format.set('DD/MM/BBBB');
    });
    expect(view.input.value).toBe('15/02/2567');

    view.type('01/03/2567');

    expect(toDateKey(view.host.value() as Date)).toBe('2024-03-01');
  });
});

@Component({
  imports: [AndesDatePicker],
  template: `<andes-date-picker
    picker="time"
    locale="en-GB"
    [format]="format()"
    [showTime]="showTime()"
    [open]="true"
    [(value)]="value"
  />`,
})
class TimeFormatHost {
  readonly format = signal<string | null>(null);
  readonly showTime = signal<AndesTimeOptions | null>(null);
  readonly value = signal<AndesDatePickerValue | undefined>(
    new Date(2024, 1, 15, 14, 5, 9),
  );
}

describe('AndesDatePicker time columns from the format', () => {
  function create(setup: (host: TimeFormatHost) => void) {
    const fixture = TestBed.createComponent(TimeFormatHost);
    setup(fixture.componentInstance);
    fixture.detectChanges();
    fixture.detectChanges();
    return {
      input: (fixture.nativeElement as HTMLElement).querySelector(
        'input',
      ) as HTMLInputElement,
      units: () =>
        Array.from(
          document.querySelectorAll('.andes-date-picker__time-column'),
          (column) => column.getAttribute('data-unit'),
        ),
      texts: (unit: string) =>
        Array.from(
          document.querySelectorAll(
            `.andes-date-picker__time-column[data-unit="${unit}"] [role="option"]`,
          ),
          (option) => option.textContent?.trim(),
        ),
    };
  }

  it('shows hours and minutes for HH:mm', () => {
    const view = create((host) => host.format.set('HH:mm'));
    expect(view.units()).toEqual(['hours', 'minutes']);
    expect(view.input.value).toBe('14:05');
  });

  it('shows the hours alone for HH', () => {
    const view = create((host) => host.format.set('HH'));
    expect(view.units()).toEqual(['hours']);
  });

  it('shows seconds when the format has them', () => {
    const view = create((host) => host.format.set('HH:mm:ss'));
    expect(view.units()).toEqual(['hours', 'minutes', 'seconds']);
  });

  it('runs a 12-hour clock with AM/PM for h:mm a', () => {
    const view = create((host) => host.format.set('h:mm a'));
    expect(view.units()).toEqual(['hours', 'minutes', 'meridiem']);
    expect(view.texts('hours').slice(0, 2)).toEqual(['12', '01']);
    expect(view.input.value).toBe('2:05 pm');
  });

  it('lets the format win over showTime options', () => {
    const view = create((host) => {
      host.format.set('HH:mm');
      host.showTime.set({ showSecond: true, use12Hours: true });
    });
    expect(view.units()).toEqual(['hours', 'minutes']);
  });

  it('hides columns through showHour and showMinute without a format', () => {
    const view = create((host) =>
      host.showTime.set({ showHour: false, showSecond: true }),
    );
    expect(view.units()).toEqual(['minutes', 'seconds']);
  });
});

@Component({
  imports: [AndesDatePicker],
  template: `
    <ng-template #cell let-shown let-unit="unit" let-selected="selected">
      <b
        class="time-cell"
        [attr.data-unit]="unit"
        [attr.data-selected]="selected"
        >{{ unit }}:{{ shown }}</b
      >
    </ng-template>
    <andes-date-picker
      picker="time"
      locale="en-GB"
      [showTime]="showTime()"
      [timeCellTemplate]="useTemplate() ? cell : null"
      [timeDisabled]="rules()"
      [open]="true"
      [(value)]="value"
    />
  `,
})
class TimeCellHost {
  readonly showTime = signal<AndesTimeOptions>({ use12Hours: true });
  readonly useTemplate = signal(true);
  readonly rules = signal<AndesTimeDisabledFn | null>(null);
  readonly value = signal<AndesDatePickerValue | undefined>(
    new Date(2024, 1, 15, 14, 5),
  );
}

describe('AndesDatePicker time options', () => {
  function create(setup: (host: TimeCellHost) => void = () => undefined) {
    const fixture = TestBed.createComponent(TimeCellHost);
    setup(fixture.componentInstance);
    fixture.detectChanges();
    fixture.detectChanges();
    const column = (unit: string) =>
      document.querySelector<HTMLElement>(
        `.andes-date-picker__time-column[data-unit="${unit}"]`,
      ) as HTMLElement;
    const options = (unit: string) =>
      Array.from(column(unit).querySelectorAll<HTMLElement>('[role="option"]'));
    return {
      fixture,
      host: fixture.componentInstance,
      input: (fixture.nativeElement as HTMLElement).querySelector(
        'input',
      ) as HTMLInputElement,
      column,
      options,
      detect: () => fixture.detectChanges(),
    };
  }

  describe('timeCellTemplate', () => {
    it('renders each option through the template with its column and number', () => {
      const view = create();

      const hours = view.options('hours');
      expect(hours[0].textContent?.trim()).toBe('hour:12');
      expect(hours[2].textContent?.trim()).toBe('hour:2');
      expect(
        hours[2].querySelector('.time-cell')?.getAttribute('data-selected'),
      ).toBe('true');
      expect(view.options('minutes')[5].textContent?.trim()).toBe('minute:5');
      expect(
        view.options('meridiem').map((option) => option.textContent?.trim()),
      ).toEqual(['meridiem:0', 'meridiem:12']);
    });

    it('keeps the option itself, its role and selection, around the template', () => {
      const view = create();
      const selected = view
        .options('hours')
        .find((option) => option.getAttribute('aria-selected') === 'true');
      expect(selected?.querySelector('.time-cell')).toBeTruthy();
    });
  });

  describe('hover preview', () => {
    function hover(view: ReturnType<typeof create>, option: HTMLElement) {
      option.dispatchEvent(
        new MouseEvent('pointermove', {
          bubbles: true,
          screenX: 9,
          screenY: 9,
        }),
      );
      option.dispatchEvent(new MouseEvent('mouseenter'));
      view.detect();
    }

    it('shows the time under the pointer in the input, then the value again', () => {
      const view = create((host) => {
        host.useTemplate.set(false);
        host.showTime.set({});
      });
      expect(view.input.value).toBe('14:05');

      hover(view, view.options('hours')[9]);
      expect(view.input.value).toBe('09:05');

      view.column('hours').dispatchEvent(new MouseEvent('mouseleave'));
      view.detect();
      expect(view.input.value).toBe('14:05');
    });

    it('does not preview a ruled-out option', () => {
      const view = create((host) => {
        host.useTemplate.set(false);
        host.showTime.set({});
        host.rules.set(() => ({ disabledHours: () => [9] }));
      });
      hover(view, view.options('hours')[9]);
      expect(view.input.value).toBe('14:05');
      hover(view, view.options('minutes')[30]);
      expect(view.input.value).toBe('14:30');
    });
  });

  describe('changeOnScroll', () => {
    /** Lays the options of a column out 28px apart, as the stylesheet does. */
    function layOut(column: HTMLElement): void {
      Array.from(column.querySelectorAll('[role="option"]')).forEach(
        (option, index) =>
          Object.defineProperty(option, 'offsetTop', {
            configurable: true,
            value: index * 28,
          }),
      );
    }

    async function scroll(column: HTMLElement, top: number) {
      column.scrollTop = top;
      column.dispatchEvent(new Event('scroll'));
      await new Promise((resolve) => setTimeout(resolve, 150));
    }

    it('picks the option a scrolled column rests on', async () => {
      const view = create((host) => {
        host.useTemplate.set(false);
        host.showTime.set({ changeOnScroll: true });
      });
      layOut(view.column('minutes'));

      await scroll(view.column('minutes'), 20 * 28 + 6);
      view.detect();

      expect(view.input.value).toBe('14:20');
      expect(view.options('minutes')[20].getAttribute('aria-selected')).toBe(
        'true',
      );
    });

    it('leaves the value alone without changeOnScroll', async () => {
      const view = create((host) => {
        host.useTemplate.set(false);
        host.showTime.set({});
      });
      layOut(view.column('minutes'));

      await scroll(view.column('minutes'), 20 * 28);
      view.detect();

      expect(view.input.value).toBe('14:05');
    });
  });
});

@Component({
  imports: [AndesDatePicker],
  template: `
    <ng-template #tag let-tag let-remove="remove" let-disabled="disabled">
      <span class="my-tag">{{ tag.key }}</span>
      @if (!disabled) {
        <button type="button" class="my-remove" (click)="remove($event)">
          x
        </button>
      }
    </ng-template>
    <ng-template #separator><i class="my-separator">to</i></ng-template>
    <andes-date-picker
      [mode]="mode()"
      locale="en-US"
      [id]="id()"
      [rangeSeparator]="useSeparator() ? separator : 'until'"
      [tagTemplate]="tag"
      [maxTagCount]="maxTagCount()"
      [(value)]="value"
    />
  `,
})
class FieldSlotHost {
  readonly mode = signal<AndesDatePickerMode>('range');
  readonly id = signal<string | AndesDatePickerIds | undefined>(undefined);
  readonly useSeparator = signal(true);
  readonly maxTagCount = signal<number | undefined>(undefined);
  readonly value = signal<AndesDatePickerValue | undefined>(undefined);
}

describe('AndesDatePicker field slots', () => {
  function create(setup: (host: FieldSlotHost) => void = () => undefined) {
    const fixture = TestBed.createComponent(FieldSlotHost);
    setup(fixture.componentInstance);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    return {
      fixture,
      root,
      host: fixture.componentInstance,
      inputs: () =>
        Array.from(
          root.querySelectorAll<HTMLInputElement>(
            '[data-slot^="date-picker-input"]',
          ),
        ),
      detect: () => fixture.detectChanges(),
    };
  }

  describe('id', () => {
    it('puts a string id on the start input only', () => {
      const view = create((host) => host.id.set('trip'));
      expect(view.inputs().map((input) => input.id)).toEqual(['trip', '']);
    });

    it('gives each input of a range its own id from { start, end }', () => {
      const view = create((host) =>
        host.id.set({ start: 'trip-from', end: 'trip-to' }),
      );
      expect(view.inputs().map((input) => input.id)).toEqual([
        'trip-from',
        'trip-to',
      ]);
      expect(view.root.querySelector('andes-date-picker')?.id).toBe('');
    });
  });

  describe('rangeSeparator', () => {
    it('renders a template between the inputs', () => {
      const view = create();
      const separator = view.root.querySelector(
        '[data-slot="date-picker-separator"]',
      );
      expect(separator?.querySelector('.my-separator')?.textContent).toBe('to');
      expect(separator?.hasAttribute('data-arrow')).toBe(false);
    });

    it('still takes plain text', () => {
      const view = create((host) => host.useSeparator.set(false));
      expect(
        view.root
          .querySelector('[data-slot="date-picker-separator"]')
          ?.textContent?.trim(),
      ).toBe('until');
    });
  });

  describe('tagTemplate', () => {
    function createMultiple() {
      return create((host) => {
        host.mode.set('multiple');
        host.value.set([d(2024, 2, 1), d(2024, 2, 9), d(2024, 2, 20)]);
      });
    }

    it('draws each tag through the template', () => {
      const view = createMultiple();
      expect(
        Array.from(
          view.root.querySelectorAll('.my-tag'),
          (tag) => tag.textContent,
        ),
      ).toEqual(['2024-02-01', '2024-02-09', '2024-02-20']);
      expect(
        view.root.querySelector(
          '.andes-date-picker__tag:not(.andes-date-picker__tag--rest)',
        ),
      ).toBeNull();
    });

    it("removes the tag's date through the context's remove", () => {
      const view = createMultiple();
      view.root.querySelectorAll<HTMLElement>('.my-remove')[1].click();
      view.detect();

      expect(
        (view.host.value() as Date[]).map((date) => toDateKey(date)),
      ).toEqual(['2024-02-01', '2024-02-20']);
    });

    it('keeps the + N tag beside the custom tags', () => {
      const view = create((host) => {
        host.mode.set('multiple');
        host.maxTagCount.set(1);
        host.value.set([d(2024, 2, 1), d(2024, 2, 9)]);
      });
      expect(view.root.querySelectorAll('.my-tag')).toHaveLength(1);
      expect(
        view.root
          .querySelector('[data-slot="date-picker-tag-rest"]')
          ?.textContent?.trim(),
      ).toContain('+ 1');
    });
  });
});

@Component({
  imports: [AndesDatePicker],
  template: `
    <button type="button" id="outside">Outside</button>
    <andes-date-picker
      [mode]="mode()"
      [picker]="picker()"
      locale="en-US"
      [format]="format()"
      [defaultMonth]="defaultMonth"
      [(value)]="value"
      (valueTextChange)="texts.push($event)"
      (calendarChange)="changes.push($event)"
      (focused)="focusEvents.push('focus:' + $event.range)"
      (blurred)="focusEvents.push('blur:' + $event.range)"
    />
  `,
})
class EventHost {
  readonly mode = signal<AndesDatePickerMode>('single');
  readonly picker = signal<AndesDatePickerType>('date');
  readonly format = signal<string | null>(null);
  readonly defaultMonth = d(2024, 2, 1);
  readonly value = signal<AndesDatePickerValue | undefined>(undefined);
  readonly texts: AndesDatePickerValueText[] = [];
  readonly changes: AndesDatePickerCalendarChange[] = [];
  readonly focusEvents: string[] = [];
}

describe('AndesDatePicker events', () => {
  function create(setup: (host: EventHost) => void = () => undefined) {
    const fixture = TestBed.createComponent(EventHost);
    setup(fixture.componentInstance);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const inputs = () =>
      Array.from(
        root.querySelectorAll<HTMLInputElement>(
          '[data-slot^="date-picker-input"]',
        ),
      );
    const detect = () => fixture.detectChanges();
    return {
      host: fixture.componentInstance,
      root,
      inputs,
      detect,
      open: (index = 0) => {
        inputs()[index].focus();
        inputs()[index].click();
        detect();
      },
      clickDay: (key: string) => {
        document
          .querySelector<HTMLElement>(
            `[data-slot="date-picker-panel"] [data-date="${key}"]`,
          )
          ?.click();
        detect();
      },
      leave: (from: HTMLElement) => {
        const outside = root.querySelector<HTMLElement>('#outside');
        from.dispatchEvent(
          new FocusEvent('focusout', { bubbles: true, relatedTarget: outside }),
        );
        outside?.focus();
        detect();
      },
    };
  }

  describe('valueTextChange', () => {
    it('emits the committed date in the display format', () => {
      const view = create((host) => host.format.set('DD/MM/YYYY'));
      view.open();
      view.clickDay('2024-02-09');

      expect(view.host.texts).toEqual(['09/02/2024']);
    });

    it('emits a range as a pair and an empty value as empty text', () => {
      const view = create((host) => host.mode.set('range'));
      view.open();
      view.clickDay('2024-02-09');
      view.clickDay('2024-02-12');

      expect(view.host.texts.at(-1)).toEqual(['Feb 9, 2024', 'Feb 12, 2024']);
    });

    it('emits a list in multiple mode', () => {
      const view = create((host) => host.mode.set('multiple'));
      view.open();
      view.clickDay('2024-02-09');
      view.clickDay('2024-02-03');

      expect(view.host.texts.at(-1)).toEqual(['Feb 3, 2024', 'Feb 9, 2024']);
    });
  });

  describe('calendarChange', () => {
    it('reports an end picked from the end input as the end', () => {
      const view = create((host) => {
        host.mode.set('range');
        host.value.set([d(2024, 2, 5), d(2024, 2, 8)]);
      });
      view.open(1);
      view.clickDay('2024-02-14');

      expect(view.host.changes.at(-1)?.range).toBe('end');
      expect(view.host.changes.at(-1)?.text).toEqual([
        'Feb 5, 2024',
        'Feb 14, 2024',
      ]);
    });

    it('reports each time picked in a time range, with its side', () => {
      const view = create((host) => {
        host.mode.set('range');
        host.picker.set('time');
        host.value.set([
          new Date(2024, 1, 15, 9, 0),
          new Date(2024, 1, 15, 17, 0),
        ]);
      });
      view.open(1);
      document
        .querySelector<HTMLElement>(
          '.andes-date-picker__time-column[data-unit="hours"] [role="option"]:nth-child(19)',
        )
        ?.dispatchEvent(new MouseEvent('mousedown', { button: 0 }));
      view.detect();

      const last = view.host.changes.at(-1);
      expect(last?.range).toBe('end');
      expect(last?.value[1]?.getHours()).toBe(18);
    });
  });

  describe('focused and blurred', () => {
    it('reports focus entering, moving between the inputs, and leaving', () => {
      const view = create((host) => host.mode.set('range'));
      const [start, end] = view.inputs();

      start.focus();
      view.detect();
      end.focus();
      view.detect();
      view.leave(end);

      expect(view.host.focusEvents).toEqual([
        'focus:start',
        'focus:end',
        'blur:end',
      ]);
    });

    it('does not report a blur while focus stays in the picker', () => {
      const view = create();
      const [input] = view.inputs();
      input.focus();
      view.detect();

      input.dispatchEvent(
        new FocusEvent('focusout', {
          bubbles: true,
          relatedTarget: view.root.querySelector('[data-slot="date-picker-trigger"]'),
        }),
      );
      view.detect();

      expect(view.host.focusEvents).toEqual(['focus:start']);
    });
  });
});
