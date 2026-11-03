import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { AndesCalendar, type AndesCalendarCaptionLayout } from './calendar';
import { toDateKey, type AndesPickerType } from './date-utils';

function d(year: number, month1: number, day: number): Date {
  return new Date(year, month1 - 1, day);
}

@Component({
  imports: [AndesCalendar],
  template: `
    <div [attr.dir]="dir()">
      <andes-calendar
        locale="en-US"
        [mode]="mode()"
        [picker]="picker()"
        [numberOfMonths]="numberOfMonths()"
        [captionLayout]="captionLayout()"
        [defaultMonth]="month"
        [value]="value()"
      />
    </div>
  `,
})
class DirectionHost {
  readonly dir = signal<'ltr' | 'rtl' | null>(null);
  readonly mode = signal<'single' | 'range'>('single');
  readonly picker = signal<AndesPickerType>('date');
  readonly numberOfMonths = signal(1);
  readonly captionLayout = signal<AndesCalendarCaptionLayout>('label');
  readonly month = d(2024, 2, 1);
  readonly value = signal<Date | null>(d(2024, 2, 15));
}

function create(setup: (host: DirectionHost) => void = () => undefined) {
  const fixture = TestBed.createComponent(DirectionHost);
  setup(fixture.componentInstance);
  fixture.detectChanges();
  const root = fixture.nativeElement as HTMLElement;
  return {
    fixture,
    root,
    host: fixture.componentInstance,
    press: (key: string, options: KeyboardEventInit = {}) => {
      root
        .querySelector<HTMLElement>('[data-date][tabindex="0"]')
        ?.dispatchEvent(
          new KeyboardEvent('keydown', { key, bubbles: true, ...options }),
        );
      fixture.detectChanges();
    },
    active: () =>
      root
        .querySelector<HTMLElement>('[data-date][tabindex="0"]')
        ?.getAttribute('data-date'),
    announcer: () =>
      root.querySelector<HTMLElement>('[data-slot="calendar-announcer"]'),
  };
}

describe('AndesCalendar direction and announcements', () => {
  describe('arrow keys in a right-to-left grid', () => {
    it('keeps Left as the previous day in a left-to-right grid', () => {
      const { press, active } = create((host) => host.dir.set('ltr'));
      press('ArrowLeft');
      expect(active()).toBe(toDateKey(d(2024, 2, 14)));
      press('ArrowRight');
      press('ArrowRight');
      expect(active()).toBe(toDateKey(d(2024, 2, 16)));
    });

    it('goes back with Right and forward with Left under dir="rtl"', () => {
      const { press, active } = create((host) => host.dir.set('rtl'));
      press('ArrowRight');
      expect(active()).toBe(toDateKey(d(2024, 2, 14)));
      press('ArrowLeft');
      press('ArrowLeft');
      expect(active()).toBe(toDateKey(d(2024, 2, 16)));
    });

    it('mirrors Shift+Left and Shift+Right, which step a month', () => {
      const { press, active } = create((host) => host.dir.set('rtl'));
      press('ArrowRight', { shiftKey: true });
      expect(active()).toBe(toDateKey(d(2024, 1, 15)));
      press('ArrowLeft', { shiftKey: true });
      press('ArrowLeft', { shiftKey: true });
      expect(active()).toBe(toDateKey(d(2024, 3, 15)));
    });

    it('leaves the vertical and paging keys alone', () => {
      const { press, active } = create((host) => host.dir.set('rtl'));
      press('ArrowDown');
      expect(active()).toBe(toDateKey(d(2024, 2, 22)));
      press('ArrowUp');
      press('PageDown');
      expect(active()).toBe(toDateKey(d(2024, 3, 15)));
    });

    it('mirrors the month and year grids too', () => {
      const { press, active } = create((host) => {
        host.dir.set('rtl');
        host.picker.set('month');
        host.value.set(d(2024, 5, 1));
      });
      press('ArrowRight');
      expect(active()).toBe(toDateKey(d(2024, 4, 1)));
      press('ArrowLeft');
      press('ArrowLeft');
      expect(active()).toBe(toDateKey(d(2024, 6, 1)));
    });

    it('leaves Left and Right alone when no ancestor says otherwise', () => {
      const { press, active } = create();
      press('ArrowRight');
      expect(active()).toBe(toDateKey(d(2024, 2, 16)));
    });
  });

  describe('one live region', () => {
    it('has a single polite region, whatever the number of months', () => {
      const { root } = create((host) => host.numberOfMonths.set(2));
      expect(root.querySelectorAll('[aria-live]')).toHaveLength(1);
      expect(
        root.querySelectorAll('.andes-calendar__caption-wrap'),
      ).toHaveLength(2);
      expect(
        root
          .querySelector('.andes-calendar__caption-wrap')
          ?.hasAttribute('aria-live'),
      ).toBe(false);
    });

    it('says every caption on show, once', () => {
      const { announcer } = create((host) => host.numberOfMonths.set(2));
      expect(announcer()?.getAttribute('aria-live')).toBe('polite');
      expect(announcer()?.getAttribute('aria-atomic')).toBe('true');
      expect(announcer()?.textContent?.trim()).toBe(
        'February 2024 – March 2024',
      );
    });

    it('follows the shown months as the calendar pages', () => {
      const { root, announcer, fixture } = create((host) =>
        host.numberOfMonths.set(2),
      );
      root
        .querySelector<HTMLButtonElement>('[data-slot="calendar-next"]')
        ?.click();
      fixture.detectChanges();
      expect(announcer()?.textContent?.trim()).toBe('March 2024 – April 2024');
    });

    it('says the year of a month grid and the decade of a year grid', () => {
      const months = create((host) => host.picker.set('month'));
      expect(months.announcer()?.textContent?.trim()).toBe('2024');
      const years = create((host) => host.picker.set('year'));
      expect(years.announcer()?.textContent?.trim()).toBe('2020 – 2029');
    });

    it('stays empty where the caption selects announce the change themselves', () => {
      const { announcer } = create((host) =>
        host.captionLayout.set('dropdown'),
      );
      expect(announcer()?.textContent?.trim()).toBe('');
    });
  });
});
