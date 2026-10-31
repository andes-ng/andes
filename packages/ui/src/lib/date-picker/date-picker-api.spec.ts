import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { toDateKey } from '../calendar/date-utils';
import {
  AndesDatePicker,
  type AndesDatePickerMode,
  type AndesDatePickerValue,
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
