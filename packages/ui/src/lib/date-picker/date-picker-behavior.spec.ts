import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import type { AndesCalendarCaptionLayout } from '../calendar/calendar';
import { toDateKey } from '../calendar/date-utils';
import {
  AndesDatePicker,
  type AndesDatePickerPanelClass,
  type AndesDatePickerValue,
  type AndesTimeOptions,
} from './date-picker';

function d(year: number, month1: number, day: number): Date {
  return new Date(year, month1 - 1, day);
}

@Component({
  imports: [AndesDatePicker],
  template: `
    <button type="button" id="outside">Outside</button>
    <div [attr.dir]="dir()">
      <andes-date-picker
        locale="en-US"
        aria-label="Due date"
        [mode]="mode()"
        [defaultMonth]="defaultMonth"
        [min]="min()"
        [max]="max()"
        [(value)]="value"
        [defaultOpen]="defaultOpen()"
        [autoFocus]="autoFocus()"
        [disabled]="disabled()"
        [panelClass]="panelClass()"
        [changeOnBlur]="changeOnBlur()"
        [preserveInvalidOnBlur]="preserveInvalidOnBlur()"
        [needConfirm]="needConfirm()"
        [showTime]="showTime()"
        [captionLayout]="captionLayout()"
        [startYear]="startYear()"
        [endYear]="endYear()"
        (valueChange)="values.push($event)"
        (panelChange)="panelChanges.push($event.date)"
      />
    </div>
  `,
})
class BehaviorHost {
  readonly dir = signal<'ltr' | 'rtl'>('ltr');
  readonly mode = signal<'single' | 'range'>('single');
  readonly defaultMonth = d(2024, 2, 1);
  readonly min = signal<Date | null>(null);
  readonly max = signal<Date | null>(null);
  readonly value = signal<AndesDatePickerValue | undefined>(undefined);
  readonly defaultOpen = signal(false);
  readonly autoFocus = signal(false);
  readonly disabled = signal(false);
  readonly panelClass = signal<AndesDatePickerPanelClass>(null);
  readonly changeOnBlur = signal(false);
  readonly preserveInvalidOnBlur = signal(false);
  readonly needConfirm = signal<boolean | undefined>(undefined);
  readonly showTime = signal<AndesTimeOptions | boolean | null>(null);
  readonly captionLayout = signal<AndesCalendarCaptionLayout>('label');
  readonly startYear = signal<number | undefined>(undefined);
  readonly endYear = signal<number | undefined>(undefined);
  readonly values: AndesDatePickerValue[] = [];
  readonly panelChanges: Date[] = [];
}

async function create(setup: (host: BehaviorHost) => void = () => undefined) {
  const fixture = TestBed.createComponent(BehaviorHost);
  setup(fixture.componentInstance);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  const root = fixture.nativeElement as HTMLElement;
  const host = fixture.componentInstance;
  const detect = () => fixture.detectChanges();
  const input = () =>
    root.querySelector<HTMLInputElement>(
      '[data-slot^="date-picker-input"]',
    ) as HTMLInputElement;
  const panel = () =>
    document.querySelector<HTMLElement>('[data-slot="date-picker-panel"]');
  return {
    fixture,
    root,
    host,
    detect,
    input,
    panel,
    type: (text: string) => {
      input().value = text;
      input().dispatchEvent(new Event('input', { bubbles: true }));
      detect();
    },
    close: () => {
      document.body.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'Escape',
          keyCode: 27,
          bubbles: true,
        }),
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
    clickDay: (date: Date) => {
      panel()
        ?.querySelector<HTMLButtonElement>(`[data-date="${toDateKey(date)}"]`)
        ?.click();
      detect();
    },
  };
}

describe('AndesDatePicker behavior options', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    document
      .querySelectorAll('.cdk-overlay-container')
      .forEach((container) => (container.innerHTML = ''));
  });

  describe('defaultOpen, autoFocus and panelClass', () => {
    it('stays closed and unfocused by default', async () => {
      const view = await create();
      expect(view.panel()).toBeFalsy();
      expect(document.activeElement).not.toBe(view.input());
    });

    it('opens once on init with defaultOpen, reporting open', async () => {
      const view = await create((host) => host.defaultOpen.set(true));
      expect(view.panel()).toBeTruthy();
      expect(view.input().getAttribute('aria-expanded')).toBe('true');

      view.close();
      expect(view.panel()).toBeFalsy();
      // A later change is not a request to open again.
      view.host.defaultOpen.set(false);
      view.detect();
      view.host.defaultOpen.set(true);
      view.detect();
      await view.fixture.whenStable();
      expect(view.panel()).toBeFalsy();
    });

    it('does not open a disabled picker with defaultOpen', async () => {
      const view = await create((host) => {
        host.defaultOpen.set(true);
        host.disabled.set(true);
      });
      expect(view.panel()).toBeFalsy();
    });

    it('focuses the input after the first render with autoFocus, without opening', async () => {
      const view = await create((host) => host.autoFocus.set(true));
      expect(document.activeElement).toBe(view.input());
      expect(view.panel()).toBeFalsy();
    });

    it('puts panelClass on the panel, as a string or a list', async () => {
      const view = await create((host) => {
        host.panelClass.set('booking-panel wide');
        host.defaultOpen.set(true);
      });
      const panel = view.panel() as HTMLElement;
      expect(panel.classList).toContain('andes-date-picker__panel');
      expect(panel.classList).toContain('booking-panel');
      expect(panel.classList).toContain('wide');

      view.host.panelClass.set(['one', 'two']);
      view.detect();
      expect(panel.classList).toContain('one');
      expect(panel.classList).toContain('two');
      expect(panel.classList).not.toContain('wide');
      expect(panel.classList).toContain('andes-date-picker__panel');
    });

    it('mirrors an RTL field onto the portalled panel', async () => {
      const view = await create((host) => {
        host.dir.set('rtl');
        host.defaultOpen.set(true);
      });
      expect(view.panel()?.getAttribute('dir')).toBe('rtl');
    });

    it('sets no dir on the panel of an LTR field', async () => {
      const view = await create((host) => host.defaultOpen.set(true));
      expect(view.panel()?.hasAttribute('dir')).toBe(false);
    });
  });

  describe('changeOnBlur and preserveInvalidOnBlur', () => {
    const confirmed = (host: BehaviorHost) => {
      host.needConfirm.set(true);
      host.value.set(d(2024, 2, 1));
    };

    it('drops valid typed text on blur when confirmation is required (default)', async () => {
      const view = await create(confirmed);
      view.type('2024-02-20');
      view.blurToOutside();
      expect(toDateKey(view.host.value() as Date)).toBe('2024-02-01');
      expect(view.host.values).toEqual([]);
    });

    it('commits valid typed text on blur with changeOnBlur, even with needConfirm', async () => {
      const view = await create((host) => {
        confirmed(host);
        host.changeOnBlur.set(true);
      });
      view.type('2024-02-20');
      view.blurToOutside();
      expect(toDateKey(view.host.value() as Date)).toBe('2024-02-20');
      expect(view.host.values).toHaveLength(1);
      expect(view.input().value).toBe('Feb 20, 2024');
      expect(view.panel()).toBeFalsy();
    });

    it('keeps preserved text and focus where the user went when the panel closes late', async () => {
      const view = await create((host) => {
        host.changeOnBlur.set(true);
        host.preserveInvalidOnBlur.set(true);
        host.value.set(d(2024, 2, 15));
      });
      const picker = view.fixture.debugElement.query(
        (element) => element.name === 'andes-date-picker',
      ).componentInstance as AndesDatePicker;
      // A browser runs the panel's exit animation first: the overlay reports the
      // close a little after it was asked for.
      const close = picker.overlay.close.bind(picker.overlay);
      vi.spyOn(picker.overlay, 'close').mockImplementation((reason) => {
        setTimeout(() => close(reason));
      });

      view.input().focus();
      view.type('Feb 31, 2024');
      view.blurToOutside();
      await new Promise((resolve) => setTimeout(resolve));
      view.detect();

      expect(view.panel()).toBeFalsy();
      expect(view.input().value).toBe('Feb 31, 2024');
      expect(document.activeElement).not.toBe(view.input());
      expect(toDateKey(view.host.value() as Date)).toBe('2024-02-15');
    });

    it('commits pending calendar picks on blur with changeOnBlur', async () => {
      const view = await create((host) => {
        confirmed(host);
        host.changeOnBlur.set(true);
        host.defaultOpen.set(true);
      });
      view.clickDay(d(2024, 2, 9));
      expect(view.host.values).toEqual([]);
      view.blurToOutside();
      expect(toDateKey(view.host.value() as Date)).toBe('2024-02-09');
    });

    it('commits a typed date-time on blur with showTime and changeOnBlur', async () => {
      const view = await create((host) => {
        host.showTime.set(true);
        host.changeOnBlur.set(true);
      });
      view.type('2024-02-20 10:30');
      view.blurToOutside();
      const value = view.host.value() as Date;
      expect(toDateKey(value)).toBe('2024-02-20');
      expect(value.getHours()).toBe(10);
      expect(value.getMinutes()).toBe(30);
    });

    it('never commits an incomplete range on blur', async () => {
      const view = await create((host) => {
        host.mode.set('range');
        host.needConfirm.set(true);
        host.changeOnBlur.set(true);
      });
      view.type('2024-02-20');
      view.blurToOutside();
      expect(view.host.values).toEqual([]);
    });

    it('commits valid text without confirmation either way (default flow)', async () => {
      const view = await create((host) => host.value.set(d(2024, 2, 1)));
      view.type('2024-02-20');
      view.blurToOutside();
      expect(toDateKey(view.host.value() as Date)).toBe('2024-02-20');
    });

    it.each([
      [false, false, ''],
      [false, true, 'Feb 31, 2024'],
      [true, false, ''],
      [true, true, 'Feb 31, 2024'],
    ])(
      'with changeOnBlur=%s and preserveInvalidOnBlur=%s, invalid text leaves %j and the value',
      async (changeOnBlur, preserve, kept) => {
        const view = await create((host) => {
          host.changeOnBlur.set(changeOnBlur);
          host.preserveInvalidOnBlur.set(preserve);
          host.value.set(d(2024, 2, 15));
        });
        view.type('Feb 31, 2024');
        view.blurToOutside();
        expect(toDateKey(view.host.value() as Date)).toBe('2024-02-15');
        expect(view.host.values).toEqual([]);
        expect(view.input().value).toBe(kept || 'Feb 15, 2024');
      },
    );
  });

  describe('captionLayout through the picker', () => {
    const listOptions = () =>
      Array.from(
        document.querySelectorAll<HTMLElement>(
          '[data-slot="select-content"] [role="option"]',
        ),
      );
    const combobox = (slot: 'month' | 'year', index = 0) =>
      document.querySelectorAll<HTMLButtonElement>(
        `[data-slot="calendar-${slot}-select"] [role="combobox"]`,
      )[index];

    it('passes the dropdown layout and the year bounds to the calendar', async () => {
      const view = await create((host) => {
        host.captionLayout.set('dropdown');
        host.startYear.set(2020);
        host.endYear.set(2030);
        host.defaultOpen.set(true);
      });
      combobox('year').click();
      view.detect();
      const years = listOptions().map((option) => option.textContent?.trim());
      expect(years[0]).toBe('2020');
      expect(years.at(-1)).toBe('2030');

      listOptions()
        .find((option) => option.textContent?.trim() === '2027')
        ?.click();
      view.detect();
      expect(toDateKey(view.host.panelChanges.at(-1) as Date)).toBe(
        '2027-02-01',
      );
      // Picking in the select's list leaves the picker open.
      expect(view.panel()).toBeTruthy();
    });

    it('keeps the picker open while focus and clicks are in a caption list', async () => {
      const view = await create((host) => {
        host.captionLayout.set('dropdown');
        host.defaultOpen.set(true);
      });
      const month = combobox('month');
      // A press on the trigger keeps focus where it is; the click then focuses the
      // select and opens its list.
      const press = new MouseEvent('mousedown', {
        bubbles: true,
        cancelable: true,
      });
      month.dispatchEvent(press);
      expect(press.defaultPrevented).toBe(true);
      month.click();
      view.detect();
      // The select moves focus onto its selected option, in its own overlay: the
      // picker, which saw focus leave its panel, stays open.
      const february = listOptions().find(
        (option) => option.getAttribute('aria-selected') === 'true',
      );
      expect(document.activeElement).toBe(february);
      expect(view.panel()).toBeTruthy();
      const [january] = listOptions();

      // Focus moving into the list (keyboard navigation) is not leaving the picker.
      view
        .panel()
        ?.dispatchEvent(
          new FocusEvent('focusout', { bubbles: true, relatedTarget: january }),
        );
      view.detect();
      expect(view.panel()).toBeTruthy();

      // Escape closes the innermost panel only: the list, not the picker.
      document.body.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'Escape',
          keyCode: 27,
          bubbles: true,
        }),
      );
      view.detect();
      await view.fixture.whenStable();
      expect(listOptions()).toHaveLength(0);
      expect(view.panel()).toBeTruthy();

      // A second Escape closes the picker.
      document.body.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'Escape',
          keyCode: 27,
          bubbles: true,
        }),
      );
      view.detect();
      expect(view.panel()).toBeFalsy();
    });

    it('gives each month of a range its own selects, bounded by min and max', async () => {
      const view = await create((host) => {
        host.mode.set('range');
        host.captionLayout.set('dropdown');
        host.min.set(d(2024, 1, 10));
        host.max.set(d(2025, 6, 1));
        host.defaultOpen.set(true);
      });
      expect(
        view.panel()?.querySelectorAll('[data-slot="calendar-month-select"]'),
      ).toHaveLength(2);
      combobox('year').click();
      view.detect();
      expect(listOptions().map((option) => option.textContent?.trim())).toEqual(
        ['2024', '2025'],
      );
    });
  });

  describe('hover preview on open', () => {
    it('previews a day only once the pointer has moved over the panel', async () => {
      const view = await create((host) => host.defaultOpen.set(true));
      const cell = view
        .panel()
        ?.querySelector('[data-date="2024-02-09"]') as HTMLElement;

      // The panel opened under a resting pointer: hover events alone do not preview.
      cell.dispatchEvent(new MouseEvent('mouseenter'));
      view.detect();
      expect(view.input().value).toBe('');

      cell.dispatchEvent(
        new MouseEvent('pointermove', {
          bubbles: true,
          screenX: 5,
          screenY: 5,
        }),
      );
      cell.dispatchEvent(new MouseEvent('mouseenter'));
      view.detect();
      expect(view.input().value).toBe('Feb 9, 2024');
    });

    it('previews the day hovered just before the first move, once the pointer moves', async () => {
      const view = await create((host) => host.defaultOpen.set(true));
      const cell = view
        .panel()
        ?.querySelector('[data-date="2024-02-09"]') as HTMLElement;
      // Browsers fire the hover first, then the move that caused it.
      cell.dispatchEvent(new MouseEvent('mouseenter'));
      view.detect();
      expect(view.input().value).toBe('');
      cell.dispatchEvent(
        new MouseEvent('pointermove', {
          bubbles: true,
          screenX: 3,
          screenY: 3,
        }),
      );
      view.detect();
      expect(view.input().value).toBe('Feb 9, 2024');
    });

    it('previews on keyboard focus in the grid without a pointer move', async () => {
      const view = await create((host) => host.defaultOpen.set(true));
      const cell = view
        .panel()
        ?.querySelector('[data-date="2024-02-09"]') as HTMLElement;
      cell.focus();
      view.detect();
      expect(view.input().value).toBe('Feb 9, 2024');
    });

    it('ignores a pointermove at the position the field was pressed at', async () => {
      const view = await create();
      view.root
        .querySelector('[data-slot="date-picker-trigger"]')
        ?.dispatchEvent(
          new MouseEvent('mousedown', {
            bubbles: true,
            cancelable: true,
            screenX: 7,
            screenY: 7,
          }),
        );
      view.detect();
      const cell = view
        .panel()
        ?.querySelector('[data-date="2024-02-09"]') as HTMLElement;
      cell.dispatchEvent(
        new MouseEvent('pointermove', {
          bubbles: true,
          screenX: 7,
          screenY: 7,
        }),
      );
      cell.dispatchEvent(new MouseEvent('mouseenter'));
      view.detect();
      expect(view.input().value).toBe('');
    });
  });
});
