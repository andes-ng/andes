import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import {
  AndesCalendar,
  coerceDisabledSides,
  type AndesCalendarCaptionLayout,
  type AndesCalendarMode,
  type AndesCalendarPanelChange,
  type AndesCalendarRangeSide,
  type AndesCalendarValue,
} from './calendar';
import {
  toDateKey,
  type AndesOpenDateRange,
  type AndesPickerType,
} from './date-utils';

function d(year: number, month1: number, day: number): Date {
  return new Date(year, month1 - 1, day);
}

@Component({
  imports: [AndesCalendar],
  template: `<div [attr.dir]="dir()">
    <andes-calendar
      [mode]="mode()"
      [picker]="picker()"
      [(value)]="value"
      [min]="min()"
      [max]="max()"
      [locale]="locale()"
      [disabled]="disabled()"
      [editingSide]="editingSide()"
      [maxCount]="maxCount()"
      [captionLayout]="captionLayout()"
      [startYear]="startYear()"
      [endYear]="endYear()"
      [numberOfMonths]="numberOfMonths()"
      [defaultMonth]="defaultMonth()"
      [dateDisabled]="dateDisabled()"
      (monthChange)="months.push($event)"
      (panelChange)="panels.push($event)"
    />
  </div>`,
})
class Host {
  readonly dir = signal<'ltr' | 'rtl'>('ltr');
  readonly mode = signal<AndesCalendarMode>('single');
  readonly picker = signal<AndesPickerType>('date');
  readonly value = signal<AndesCalendarValue>(null);
  readonly min = signal<Date | null>(null);
  readonly max = signal<Date | null>(null);
  readonly locale = signal<string | undefined>('en-US');
  readonly disabled = signal<boolean | readonly [boolean, boolean]>(false);
  readonly editingSide = signal<AndesCalendarRangeSide | null>(null);
  readonly maxCount = signal<number | undefined>(undefined);
  readonly captionLayout = signal<AndesCalendarCaptionLayout>('label');
  readonly startYear = signal<number | undefined>(undefined);
  readonly endYear = signal<number | undefined>(undefined);
  readonly numberOfMonths = signal(1);
  readonly defaultMonth = signal<Date | null>(d(2024, 2, 1));
  readonly dateDisabled = signal<
    ((date: Date, info: { from?: Date }) => boolean) | null
  >(null);
  readonly months: Date[] = [];
  readonly panels: AndesCalendarPanelChange[] = [];
}

function create(setup: (host: Host) => void = () => undefined) {
  const fixture = TestBed.createComponent(Host);
  setup(fixture.componentInstance);
  fixture.detectChanges();
  const root = fixture.nativeElement as HTMLElement;
  const host = fixture.componentInstance;
  const day = (date: Date) =>
    root.querySelector<HTMLButtonElement>(
      `[data-date="${toDateKey(date)}"]:not([data-outside])`,
    ) as HTMLButtonElement;
  const click = (date: Date) => {
    day(date).click();
    fixture.detectChanges();
  };
  /** The caption selects: `andes-select` hosts. */
  const selects = (slot: 'month' | 'year') =>
    Array.from(
      root.querySelectorAll<HTMLElement>(
        `[data-slot="calendar-${slot}-select"]`,
      ),
    );
  const combobox = (select: HTMLElement) =>
    select.querySelector<HTMLButtonElement>(
      '[role="combobox"]',
    ) as HTMLButtonElement;
  /** What the select's trigger shows. */
  const shown = (select: HTMLElement) =>
    combobox(select).textContent?.trim() ?? '';
  /** Opens the select's list and returns its options. */
  const openList = (select: HTMLElement) => {
    combobox(select).click();
    fixture.detectChanges();
    return Array.from(
      document.querySelectorAll<HTMLElement>(
        '[data-slot="select-content"] [role="option"]',
      ),
    );
  };
  const closeList = () => {
    document.body.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Escape',
        keyCode: 27,
        bubbles: true,
      }),
    );
    fixture.detectChanges();
  };
  /** Picks the option labelled `label` from the select's list. */
  const choose = (select: HTMLElement, label: string) => {
    const option = openList(select).find(
      (candidate) => candidate.textContent?.trim() === label,
    );
    if (!option) {
      throw new Error(`No option "${label}"`);
    }
    option.click();
    fixture.detectChanges();
  };
  const captions = () =>
    Array.from(
      root.querySelectorAll<HTMLElement>('[data-slot="calendar-panel"]'),
    ).map(
      (panel) =>
        panel.querySelector('[role="grid"]')?.getAttribute('aria-label') ?? '',
    );
  const rangeKeys = () => {
    const range = host.value() as AndesOpenDateRange | null;
    return [
      range?.start ? toDateKey(range.start) : null,
      range?.end ? toDateKey(range.end) : null,
    ];
  };
  return {
    fixture,
    root,
    host,
    day,
    click,
    selects,
    combobox,
    shown,
    openList,
    closeList,
    choose,
    captions,
    rangeKeys,
  };
}

describe('AndesCalendar features', () => {
  describe('multiple mode', () => {
    it('toggles days in and out, keeping the value in order', () => {
      const view = create((host) => host.mode.set('multiple'));

      view.click(d(2024, 2, 20));
      view.click(d(2024, 2, 5));
      view.click(d(2024, 2, 12));
      expect((view.host.value() as Date[]).map(toDateKey)).toEqual([
        '2024-02-05',
        '2024-02-12',
        '2024-02-20',
      ]);
      expect(view.day(d(2024, 2, 12)).getAttribute('aria-selected')).toBe(
        'true',
      );

      view.click(d(2024, 2, 12));
      expect((view.host.value() as Date[]).map(toDateKey)).toEqual([
        '2024-02-05',
        '2024-02-20',
      ]);
      expect(view.day(d(2024, 2, 12)).getAttribute('aria-selected')).toBe(
        'false',
      );
    });

    it('marks the grid multi-selectable, and only in multiple mode', () => {
      const view = create((host) => host.mode.set('multiple'));
      const grid = () => view.root.querySelector('[role="grid"]');
      expect(grid()?.getAttribute('aria-multiselectable')).toBe('true');

      view.host.mode.set('single');
      view.fixture.detectChanges();
      expect(grid()?.hasAttribute('aria-multiselectable')).toBe(false);
    });

    it('toggles with Enter and Space from the keyboard', () => {
      const view = create((host) => host.mode.set('multiple'));
      const cell = view.day(d(2024, 2, 9));
      cell.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }),
      );
      view.fixture.detectChanges();
      view
        .day(d(2024, 2, 9))
        .dispatchEvent(
          new KeyboardEvent('keydown', { key: ' ', bubbles: true }),
        );
      view.fixture.detectChanges();
      view
        .day(d(2024, 2, 10))
        .dispatchEvent(
          new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }),
        );
      view.fixture.detectChanges();

      expect((view.host.value() as Date[]).map(toDateKey)).toEqual([
        '2024-02-10',
      ]);
    });

    it('caps the selection at maxCount, disabling the days not picked', () => {
      const view = create((host) => {
        host.mode.set('multiple');
        host.maxCount.set(2);
      });
      view.click(d(2024, 2, 3));
      view.click(d(2024, 2, 4));

      const extra = view.day(d(2024, 2, 5));
      expect(extra.getAttribute('aria-disabled')).toBe('true');
      view.click(d(2024, 2, 5));
      expect(view.host.value() as Date[]).toHaveLength(2);

      // A selected day can still be toggled off, which frees a slot again.
      expect(view.day(d(2024, 2, 3)).hasAttribute('aria-disabled')).toBe(false);
      view.click(d(2024, 2, 3));
      expect(view.day(d(2024, 2, 5)).hasAttribute('aria-disabled')).toBe(false);
      view.click(d(2024, 2, 5));
      expect((view.host.value() as Date[]).map(toDateKey)).toEqual([
        '2024-02-04',
        '2024-02-05',
      ]);
    });

    it('selects whole periods with the month picker, normalizing the value', () => {
      const view = create((host) => {
        host.mode.set('multiple');
        host.picker.set('month');
        host.value.set([d(2024, 3, 17)]);
      });
      const cell = (month1: number) =>
        view.root.querySelector<HTMLButtonElement>(
          `[data-date="${toDateKey(d(2024, month1, 1))}"]`,
        ) as HTMLButtonElement;

      expect(cell(3).getAttribute('aria-selected')).toBe('true');
      cell(6).click();
      view.fixture.detectChanges();
      cell(3).click();
      view.fixture.detectChanges();

      expect((view.host.value() as Date[]).map(toDateKey)).toEqual([
        '2024-06-01',
      ]);
    });

    it('opens on the first selected date', () => {
      const view = create((host) => {
        host.defaultMonth.set(null);
        host.mode.set('multiple');
        host.value.set([d(2023, 9, 30), d(2023, 7, 4)]);
      });
      expect(view.captions()).toEqual(['July 2023']);
    });
  });

  describe('range editing', () => {
    it('reads a [start, end] pair for disabled, each side through booleanAttribute', () => {
      expect(coerceDisabledSides(['true', ''])).toEqual([true, true]);
      expect(coerceDisabledSides([false, 'false'])).toEqual([false, false]);
      expect(coerceDisabledSides('')).toBe(true);
      expect(coerceDisabledSides(null)).toBe(false);
    });

    it('keeps a locked start and sets the end with every pick', () => {
      const view = create((host) => {
        host.mode.set('range');
        host.disabled.set([true, false]);
        host.value.set({ start: d(2024, 2, 10), end: d(2024, 2, 15) });
      });

      // Days before the locked start would reorder the range: disabled.
      expect(view.day(d(2024, 2, 9)).getAttribute('aria-disabled')).toBe(
        'true',
      );
      expect(view.day(d(2024, 2, 10)).hasAttribute('aria-disabled')).toBe(
        false,
      );
      view.click(d(2024, 2, 9));
      expect(view.rangeKeys()).toEqual(['2024-02-10', '2024-02-15']);

      view.click(d(2024, 2, 20));
      expect(view.rangeKeys()).toEqual(['2024-02-10', '2024-02-20']);
      view.click(d(2024, 2, 12));
      expect(view.rangeKeys()).toEqual(['2024-02-10', '2024-02-12']);
    });

    it('keeps a locked end and sets the start with every pick', () => {
      const view = create((host) => {
        host.mode.set('range');
        host.disabled.set([false, true]);
        host.value.set([d(2024, 2, 10), d(2024, 2, 15)]);
      });

      expect(view.day(d(2024, 2, 16)).getAttribute('aria-disabled')).toBe(
        'true',
      );
      view.click(d(2024, 2, 3));
      expect(view.rangeKeys()).toEqual(['2024-02-03', '2024-02-15']);
      view.click(d(2024, 2, 15));
      expect(view.rangeKeys()).toEqual(['2024-02-15', '2024-02-15']);
    });

    it('stays enabled as a whole while one side is locked, and disables with both', () => {
      const view = create((host) => {
        host.mode.set('range');
        host.disabled.set([true, false]);
      });
      const calendar = () =>
        view.root.querySelector('andes-calendar') as HTMLElement;
      expect(calendar().hasAttribute('data-disabled')).toBe(false);

      view.host.disabled.set([true, true]);
      view.fixture.detectChanges();
      expect(calendar().hasAttribute('data-disabled')).toBe(true);

      // Outside range mode a pair reads its first entry.
      view.host.mode.set('single');
      view.host.disabled.set([true, false]);
      view.fixture.detectChanges();
      expect(calendar().hasAttribute('data-disabled')).toBe(true);
    });

    it('moves only the end with editingSide="end", swapping a pick before the start', () => {
      const view = create((host) => {
        host.mode.set('range');
        host.editingSide.set('end');
        host.value.set({ start: d(2024, 2, 10), end: d(2024, 2, 15) });
      });

      view.click(d(2024, 2, 20));
      expect(view.rangeKeys()).toEqual(['2024-02-10', '2024-02-20']);
      view.click(d(2024, 2, 4));
      expect(view.rangeKeys()).toEqual(['2024-02-04', '2024-02-10']);
    });

    it('moves only the start with editingSide="start"', () => {
      const view = create((host) => {
        host.mode.set('range');
        host.editingSide.set('start');
        host.value.set({ start: d(2024, 2, 10), end: d(2024, 2, 15) });
      });
      view.click(d(2024, 2, 12));
      expect(view.rangeKeys()).toEqual(['2024-02-12', '2024-02-15']);
      view.click(d(2024, 2, 18));
      expect(view.rangeKeys()).toEqual(['2024-02-15', '2024-02-18']);

      view.host.value.set(null);
      view.fixture.detectChanges();
      view.click(d(2024, 2, 7));
      expect(view.rangeKeys()).toEqual(['2024-02-07', null]);
    });

    it('sets an end on an empty start with editingSide="end", for open-ended ranges', () => {
      const view = create((host) => {
        host.mode.set('range');
        host.editingSide.set('end');
      });
      view.click(d(2024, 2, 9));
      expect(view.rangeKeys()).toEqual([null, '2024-02-09']);
      expect(view.day(d(2024, 2, 9)).getAttribute('aria-selected')).toBe(
        'true',
      );
    });

    it('shows an open-ended [null, end] value and takes the next pick as its start', () => {
      const view = create((host) => {
        host.defaultMonth.set(null);
        host.mode.set('range');
        host.value.set([null, d(2024, 5, 20)]);
      });
      expect(view.captions()).toEqual(['May 2024']);
      expect(view.day(d(2024, 5, 20)).classList).toContain(
        'andes-calendar__day--range-end',
      );
      expect(
        view.root.querySelectorAll('.andes-calendar__day--in-range'),
      ).toHaveLength(0);

      view.click(d(2024, 5, 25));
      expect(view.rangeKeys()).toEqual(['2024-05-20', '2024-05-25']);
    });

    it('previews the range a pick with editingSide would make, and nothing when it would not change', () => {
      const view = create((host) => {
        host.mode.set('range');
        host.editingSide.set('end');
        host.value.set({ start: d(2024, 2, 10), end: d(2024, 2, 12) });
      });
      view.day(d(2024, 2, 16)).dispatchEvent(new MouseEvent('mouseenter'));
      view.fixture.detectChanges();
      expect(view.day(d(2024, 2, 14)).hasAttribute('data-in-preview')).toBe(
        true,
      );

      view.host.disabled.set([true, false]);
      view.fixture.detectChanges();
      view.day(d(2024, 2, 12)).dispatchEvent(new MouseEvent('mouseenter'));
      view.fixture.detectChanges();
      expect(view.root.querySelectorAll('[data-in-preview]').length).toBe(0);
    });

    it('hands dateDisabled the start as info.from while the end is edited', () => {
      const froms: (string | null)[] = [];
      const view = create((host) => {
        host.mode.set('range');
        host.editingSide.set('end');
        host.value.set({ start: d(2024, 2, 10), end: d(2024, 2, 12) });
        host.dateDisabled.set((date, info) => {
          if (toDateKey(date) === '2024-02-20') {
            froms.push(info.from ? toDateKey(info.from) : null);
          }
          return false;
        });
      });
      expect(view.day(d(2024, 2, 20))).toBeTruthy();
      expect(froms.at(-1)).toBe('2024-02-10');
    });
  });

  describe('captionLayout', () => {
    afterEach(() => {
      document
        .querySelectorAll('.cdk-overlay-container')
        .forEach((container) => (container.innerHTML = ''));
    });

    const texts = (options: readonly HTMLElement[]) =>
      options.map((option) => option.textContent?.trim());
    const disabledTexts = (options: readonly HTMLElement[]) =>
      texts(
        options.filter(
          (option) => option.getAttribute('aria-disabled') === 'true',
        ),
      );

    it('keeps the caption button by default', () => {
      const view = create();
      expect(
        view.root.querySelector('[data-slot="calendar-caption"]')?.tagName,
      ).toBe('BUTTON');
      expect(view.selects('month')).toHaveLength(0);
      expect(view.selects('year')).toHaveLength(0);
    });

    it('swaps the caption for the library select, labelled, small and not searchable', () => {
      const view = create((host) => host.captionLayout.set('dropdown'));
      const [month] = view.selects('month');
      const [year] = view.selects('year');

      expect(month.tagName).toBe('ANDES-SELECT');
      expect(month.querySelector('select')).toBeNull();
      expect(view.combobox(month).getAttribute('aria-label')).toBe('Month');
      expect(view.combobox(year).getAttribute('aria-label')).toBe('Year');
      expect(view.combobox(month).tagName).toBe('BUTTON');
      expect(
        month
          .querySelector('[data-slot="select-trigger"]')
          ?.getAttribute('data-size'),
      ).toBe('sm');
      expect(view.shown(month)).toBe('Feb');
      expect(view.shown(year)).toBe('2024');
      expect(
        view.root.querySelector('[data-slot="calendar-caption"]'),
      ).toBeNull();

      const months = view.openList(month);
      expect(months).toHaveLength(12);
      expect(
        months
          .find((option) => option.getAttribute('aria-selected') === 'true')
          ?.textContent?.trim(),
      ).toBe('Feb');
      view.closeList();

      // Unbounded: a hundred years either side of the opening month.
      const years = view.openList(year);
      expect(years[0].textContent?.trim()).toBe('1924');
      expect(years[years.length - 1].textContent?.trim()).toBe('2124');
    });

    it('drops the year arrows for a year select, keeping them otherwise', () => {
      const fast = (view: ReturnType<typeof create>) =>
        view.root.querySelectorAll(
          '[data-slot="calendar-previous-year"], [data-slot="calendar-next-year"]',
        ).length;
      expect(fast(create((host) => host.captionLayout.set('dropdown')))).toBe(
        0,
      );
      expect(
        fast(create((host) => host.captionLayout.set('dropdown-years'))),
      ).toBe(0);
      expect(
        fast(create((host) => host.captionLayout.set('dropdown-months'))),
      ).toBe(2);
      expect(fast(create())).toBe(2);

      const two = create((host) => {
        host.captionLayout.set('dropdown');
        host.numberOfMonths.set(2);
      });
      expect(
        two.root.querySelectorAll('.andes-calendar__nav-spacer--single'),
      ).toHaveLength(2);
    });

    it('opens its list on the popover layer, above a picker panel', () => {
      const view = create((host) => host.captionLayout.set('dropdown'));
      view.openList(view.selects('month')[0]);
      const pane = document
        .querySelector('[data-slot="select-content"]')
        ?.closest('.cdk-overlay-pane')?.parentElement as HTMLElement;
      expect(pane.style.getPropertyValue('z-index')).toContain(
        '--andes-z-index-popover',
      );
    });

    it('navigates on a month or year pick and reports it', () => {
      const view = create((host) => host.captionLayout.set('dropdown'));
      view.choose(view.selects('month')[0], 'Jul');
      expect(view.captions()).toEqual(['July 2024']);
      expect(toDateKey(view.host.months.at(-1) as Date)).toBe('2024-07-01');
      expect(view.host.panels.at(-1)?.view).toBe('date');

      view.choose(view.selects('year')[0], '2030');
      expect(view.captions()).toEqual(['July 2030']);
      expect(toDateKey(view.host.panels.at(-1)?.date as Date)).toBe(
        '2030-07-01',
      );
      expect(view.shown(view.selects('month')[0])).toBe('Jul');
      expect(view.shown(view.selects('year')[0])).toBe('2030');
    });

    it('follows the arrows: the selects show the month on screen', () => {
      const view = create((host) => host.captionLayout.set('dropdown'));
      view.root
        .querySelector<HTMLButtonElement>('[data-slot="calendar-next"]')
        ?.click();
      view.fixture.detectChanges();
      expect(view.shown(view.selects('month')[0])).toBe('Mar');
    });

    it('does not report a pick of the month already shown', () => {
      const view = create((host) => host.captionLayout.set('dropdown'));
      view.choose(view.selects('month')[0], 'Feb');
      expect(view.host.months).toHaveLength(0);
      expect(view.host.panels).toHaveLength(0);
    });

    it('bounds the years by min/max and disables the months outside them', () => {
      const view = create((host) => {
        host.captionLayout.set('dropdown');
        host.min.set(d(2023, 3, 15));
        host.max.set(d(2025, 10, 2));
        host.defaultMonth.set(d(2023, 5, 1));
      });
      expect(texts(view.openList(view.selects('year')[0]))).toEqual([
        '2023',
        '2024',
        '2025',
      ]);
      view.closeList();
      // March 2023 holds min: it stays enabled.
      expect(disabledTexts(view.openList(view.selects('month')[0]))).toEqual([
        'Jan',
        'Feb',
      ]);
      view.closeList();
      expect(view.shown(view.selects('month')[0])).toBe('May');

      // May 2025 is in bounds; in 2025 the months after October are disabled.
      view.choose(view.selects('year')[0], '2025');
      expect(view.captions()).toEqual(['May 2025']);
      expect(disabledTexts(view.openList(view.selects('month')[0]))).toEqual([
        'Nov',
        'Dec',
      ]);
    });

    it('clamps a year pick into min/max when the month falls outside them', () => {
      const view = create((host) => {
        host.captionLayout.set('dropdown');
        host.min.set(d(2023, 3, 15));
        host.max.set(d(2025, 10, 2));
        host.defaultMonth.set(d(2024, 1, 1));
      });
      view.choose(view.selects('year')[0], '2023');
      expect(view.captions()).toEqual(['March 2023']);
      view.choose(view.selects('month')[0], 'Dec');
      view.choose(view.selects('year')[0], '2025');
      expect(view.captions()).toEqual(['October 2025']);
      expect(view.shown(view.selects('month')[0])).toBe('Oct');
    });

    it('lists startYear to endYear, disabling years outside min/max, and always the shown year', () => {
      const view = create((host) => {
        host.captionLayout.set('dropdown-years');
        host.startYear.set(2020);
        host.endYear.set(2022);
        host.min.set(d(2021, 1, 1));
        host.defaultMonth.set(d(2024, 2, 1));
      });
      const [year] = view.selects('year');
      const options = view.openList(year);
      expect(texts(options)).toEqual(['2020', '2021', '2022', '2023', '2024']);
      expect(disabledTexts(options)).toEqual(['2020']);
      expect(view.shown(year)).toBe('2024');
    });

    it('keeps one half as text with dropdown-months and dropdown-years', () => {
      const months = create((host) =>
        host.captionLayout.set('dropdown-months'),
      );
      expect(months.selects('month')).toHaveLength(1);
      expect(months.selects('year')).toHaveLength(0);
      expect(
        months.root
          .querySelector('[data-slot="calendar-caption-year"]')
          ?.textContent?.trim(),
      ).toBe('2024');

      const years = create((host) => host.captionLayout.set('dropdown-years'));
      expect(years.selects('month')).toHaveLength(0);
      expect(years.selects('year')).toHaveLength(1);
      expect(
        years.root
          .querySelector('[data-slot="calendar-caption-month"]')
          ?.textContent?.trim(),
      ).toBe('February');
    });

    it('gives each visible month its own selects, moving the view by its offset', () => {
      const view = create((host) => {
        host.captionLayout.set('dropdown');
        host.numberOfMonths.set(2);
      });
      const months = view.selects('month');
      expect(months).toHaveLength(2);
      expect(months.map((select) => view.shown(select))).toEqual([
        'Feb',
        'Mar',
      ]);

      // Picking June in the second panel shows May and June.
      view.choose(months[1], 'Jun');
      expect(view.captions()).toEqual(['May 2024', 'June 2024']);
      expect(toDateKey(view.host.months.at(-1) as Date)).toBe('2024-05-01');

      // A year in the second panel keeps that panel's month.
      view.choose(view.selects('year')[1], '2026');
      expect(view.captions()).toEqual(['May 2026', 'June 2026']);
    });

    it('offers a year select in the month grid when the layout has one', () => {
      const view = create((host) => {
        host.captionLayout.set('dropdown');
        host.picker.set('month');
      });
      expect(view.selects('month')).toHaveLength(0);
      view.choose(view.selects('year')[0], '2027');
      expect(
        view.root.querySelector('[role="grid"]')?.getAttribute('aria-label'),
      ).toBe('2027');
      expect(view.host.panels.at(-1)?.view).toBe('month');

      const labels = create((host) => {
        host.captionLayout.set('dropdown-months');
        host.picker.set('month');
      });
      expect(labels.selects('year')).toHaveLength(0);
      expect(
        labels.root.querySelector('[data-slot="calendar-caption"]'),
      ).toBeTruthy();
    });

    it('disables the selects with the calendar and names options in the locale', () => {
      const view = create((host) => {
        host.captionLayout.set('dropdown');
        host.locale.set('es-PE');
      });
      expect(view.shown(view.selects('month')[0]).toLowerCase()).toContain(
        'feb',
      );
      view.host.disabled.set(true);
      view.fixture.detectChanges();
      expect(view.combobox(view.selects('month')[0]).disabled).toBe(true);
      expect(view.combobox(view.selects('year')[0]).disabled).toBe(true);
    });

    it('reports its list as its own, for a host overlay', () => {
      const view = create((host) => host.captionLayout.set('dropdown'));
      const calendar = view.fixture.debugElement.query(
        (element) => element.name === 'andes-calendar',
      ).componentInstance as AndesCalendar;
      const [option] = view.openList(view.selects('month')[0]);
      expect(calendar.containsPanelNode(option)).toBe(true);
      expect(calendar.containsPanelNode(document.body)).toBe(false);
      expect(calendar.containsPanelNode(null)).toBe(false);
    });

    it('lays out in RTL like the label caption, with the selects in the header', () => {
      const view = create((host) => {
        host.captionLayout.set('dropdown');
        host.dir.set('rtl');
      });
      const header = view.root.querySelector('.andes-calendar__header');
      expect(header?.closest('[dir="rtl"]')).toBeTruthy();
      const wrap = header?.querySelector(
        '[data-slot="calendar-caption-dropdowns"]',
      );
      expect(wrap?.querySelectorAll('andes-select')).toHaveLength(2);
    });
  });
});
