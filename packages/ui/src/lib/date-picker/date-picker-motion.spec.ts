import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import {
  AndesDatePicker,
  type AndesDatePickerPlacement,
  type AndesDatePickerValue,
  type AndesTimeOptions,
} from './date-picker';

function d(year: number, month1: number, day: number): Date {
  return new Date(year, month1 - 1, day);
}

@Component({
  imports: [AndesDatePicker],
  template: `
    <div [attr.dir]="dir()">
      <andes-date-picker
        locale="en-US"
        aria-label="Trip"
        [mode]="mode()"
        [placement]="placement()"
        [defaultMonth]="defaultMonth()"
        [showTime]="showTime()"
        [fixedWeeks]="fixedWeeks()"
        [(value)]="value"
      />
    </div>
  `,
})
class MotionHost {
  readonly dir = signal<'ltr' | 'rtl'>('ltr');
  readonly mode = signal<'single' | 'range'>('single');
  readonly placement = signal<AndesDatePickerPlacement>('bottomLeft');
  readonly defaultMonth = signal(d(2024, 2, 1));
  readonly showTime = signal<AndesTimeOptions | boolean | null>(null);
  readonly fixedWeeks = signal(true);
  readonly value = signal<AndesDatePickerValue | undefined>(undefined);
}

async function create(setup: (host: MotionHost) => void = () => undefined) {
  const fixture = TestBed.createComponent(MotionHost);
  setup(fixture.componentInstance);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  const root = fixture.nativeElement as HTMLElement;
  const detect = () => fixture.detectChanges();
  const input = () =>
    root.querySelector<HTMLInputElement>('[data-slot^="date-picker-input"]');
  const endInput = () =>
    root.querySelector<HTMLInputElement>('[data-slot="date-picker-input-end"]');
  const bar = () =>
    root.querySelector<HTMLElement>('[data-slot="date-picker-active-bar"]');
  const arrow = () =>
    document.querySelector<HTMLElement>('[data-slot="date-picker-arrow"]');
  const field = () =>
    root.querySelector<HTMLElement>('[data-slot="date-picker-trigger"]');
  const panel = () =>
    document.querySelector<HTMLElement>('[data-slot="date-picker-panel"]');
  const pane = () => panel()?.closest<HTMLElement>('.cdk-overlay-pane') ?? null;
  const open = async () => {
    input()?.click();
    detect();
    await fixture.whenStable();
    detect();
  };
  return {
    fixture,
    root,
    host: fixture.componentInstance,
    detect,
    input,
    endInput,
    bar,
    arrow,
    field,
    panel,
    pane,
    open,
  };
}

/** Lays the field and the pane out at fixed rectangles; jsdom has no layout of its own. */
function layOut(
  view: Awaited<ReturnType<typeof create>>,
  rects: { field: DOMRect; pane: DOMRect; start?: DOMRect; end?: DOMRect },
) {
  const field = view.field();
  const pane = view.pane();
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(
    function (this: HTMLElement) {
      if (this === field) {
        return rects.field;
      }
      if (this === pane) {
        return rects.pane;
      }
      if (this === view.input() && rects.start) {
        return rects.start;
      }
      if (this === view.endInput() && rects.end) {
        return rects.end;
      }
      return new DOMRect();
    },
  );
}

/** Gives the two range inputs an offset inside the field, as layout would. */
function placeInputs(left: { start: number; end: number }, width = 100) {
  vi.spyOn(HTMLElement.prototype, 'offsetLeft', 'get').mockImplementation(
    function (this: HTMLElement) {
      const slot = this.getAttribute('data-slot');
      if (slot === 'date-picker-input-start') {
        return left.start;
      }
      return slot === 'date-picker-input-end' ? left.end : 0;
    },
  );
  vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockImplementation(
    function (this: HTMLElement) {
      return this.getAttribute('data-slot')?.startsWith('date-picker-input')
        ? width
        : 0;
    },
  );
}

/** Lets the re-measure the picker schedules on a window resize run. */
async function resizeAndSettle(view: Awaited<ReturnType<typeof create>>) {
  window.dispatchEvent(new Event('resize'));
  await new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
  );
  view.detect();
}

describe('AndesDatePicker motion and layout', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    document
      .querySelectorAll('.cdk-overlay-container')
      .forEach((container) => (container.innerHTML = ''));
  });

  describe('panel side and alignment', () => {
    const cases: readonly [AndesDatePickerPlacement, string, string][] = [
      ['bottomLeft', 'bottom', 'start'],
      ['bottomRight', 'bottom', 'end'],
      ['topLeft', 'top', 'start'],
      ['topRight', 'top', 'end'],
    ];

    it.each(cases)(
      'starts a %s panel on the %s side, aligned to the %s edge',
      async (placement, side, align) => {
        const view = await create((host) => host.placement.set(placement));
        await view.open();
        expect(view.panel()?.getAttribute('data-side')).toBe(side);
        expect(view.panel()?.getAttribute('data-align')).toBe(align);
      },
    );

    it('reports the real side once the overlay has flipped the panel', async () => {
      const view = await create();
      await view.open();
      expect(view.panel()?.getAttribute('data-side')).toBe('bottom');

      // No room below: the panel ends up above the field.
      layOut(view, {
        field: new DOMRect(40, 400, 240, 32),
        pane: new DOMRect(40, 50, 288, 340),
      });
      await resizeAndSettle(view);
      expect(view.panel()?.getAttribute('data-side')).toBe('top');

      layOut(view, {
        field: new DOMRect(40, 100, 240, 32),
        pane: new DOMRect(40, 138, 288, 340),
      });
      await resizeAndSettle(view);
      expect(view.panel()?.getAttribute('data-side')).toBe('bottom');
    });

    it('reports the edge the panel lines up with, whatever the placement asked for', async () => {
      const view = await create();
      await view.open();
      layOut(view, {
        field: new DOMRect(400, 100, 240, 32),
        pane: new DOMRect(100, 138, 540, 340),
      });
      await resizeAndSettle(view);
      expect(view.panel()?.getAttribute('data-align')).toBe('end');

      layOut(view, {
        field: new DOMRect(40, 100, 240, 32),
        pane: new DOMRect(40, 138, 540, 340),
      });
      await resizeAndSettle(view);
      expect(view.panel()?.getAttribute('data-align')).toBe('start');
    });

    it('measures the alignment in the panel direction, so an RTL panel on the right is "start"', async () => {
      const view = await create((host) => host.dir.set('rtl'));
      await view.open();
      expect(view.panel()?.getAttribute('dir')).toBe('rtl');
      layOut(view, {
        field: new DOMRect(400, 100, 240, 32),
        pane: new DOMRect(100, 138, 540, 340),
      });
      await resizeAndSettle(view);
      expect(view.panel()?.getAttribute('data-align')).toBe('start');
    });

    it('stops listening to the window once the panel is closed', async () => {
      const view = await create();
      const remove = vi.spyOn(window, 'removeEventListener');
      await view.open();
      view
        .input()
        ?.dispatchEvent(
          new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
        );
      document.body.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'Escape',
          keyCode: 27,
          bubbles: true,
        }),
      );
      view.detect();
      await view.fixture.whenStable();
      expect(remove.mock.calls.some(([type]) => type === 'resize')).toBe(true);
    });
  });

  describe('stable panel height', () => {
    const weekRows = (view: Awaited<ReturnType<typeof create>>) =>
      view
        .panel()
        ?.querySelectorAll(
          '.andes-calendar__row:not(.andes-calendar__row--weekdays)',
        ).length;

    it('keeps six week rows for a five-week month and a six-week month alike', async () => {
      // February 2024 spans five weeks from Sunday; March 2024 spans six.
      const feb = await create();
      await feb.open();
      expect(weekRows(feb)).toBe(6);
      feb.fixture.destroy();
      document
        .querySelectorAll('.cdk-overlay-container')
        .forEach((container) => (container.innerHTML = ''));

      const march = await create((host) =>
        host.defaultMonth.set(d(2024, 3, 1)),
      );
      await march.open();
      expect(weekRows(march)).toBe(6);
    });

    it('can still shrink to the weeks a month needs with [fixedWeeks]="false"', async () => {
      const view = await create((host) => host.fixedWeeks.set(false));
      await view.open();
      expect(weekRows(view)).toBe(5);
    });
  });

  describe('range active bar', () => {
    it('is only there for a range', async () => {
      const single = await create();
      await single.open();
      expect(single.bar()).toBeNull();
      expect(single.arrow()).toBeNull();
    });

    it('is hidden while the panel is closed and shows under the start input once open', async () => {
      placeInputs({ start: 12, end: 140 });
      const view = await create((host) => host.mode.set('range'));
      expect(view.bar()).toBeTruthy();
      expect(view.bar()?.hasAttribute('data-visible')).toBe(false);

      await view.open();
      expect(view.bar()?.hasAttribute('data-visible')).toBe(true);
      expect(view.bar()?.style.left).toBe('12px');
      expect(view.bar()?.style.width).toBe('100px');
    });

    it('appears in place, then slides to the end input when the next pick moves there', async () => {
      placeInputs({ start: 12, end: 140 });
      const view = await create((host) => host.mode.set('range'));
      await view.open();
      expect(view.bar()?.hasAttribute('data-animated')).toBe(false);

      view.endInput()?.click();
      view.detect();
      await view.fixture.whenStable();
      view.detect();
      expect(view.bar()?.style.left).toBe('140px');
      expect(view.bar()?.hasAttribute('data-animated')).toBe(true);
    });

    it('keeps its place while it fades out on close, and starts over in place on reopening', async () => {
      placeInputs({ start: 12, end: 140 });
      const view = await create((host) => host.mode.set('range'));
      await view.open();
      view.endInput()?.click();
      view.detect();
      await view.fixture.whenStable();
      view.detect();

      document.body.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'Escape',
          keyCode: 27,
          bubbles: true,
        }),
      );
      view.detect();
      await view.fixture.whenStable();
      view.detect();
      expect(view.bar()?.hasAttribute('data-visible')).toBe(false);
      expect(view.bar()?.style.left).toBe('140px');
      expect(view.bar()?.hasAttribute('data-animated')).toBe(false);
    });

    it('is re-fitted in place when the field changes size', async () => {
      placeInputs({ start: 12, end: 140 });
      let resize: ResizeObserverCallback | undefined;
      vi.stubGlobal(
        'ResizeObserver',
        class {
          constructor(callback: ResizeObserverCallback) {
            resize = callback;
          }
          observe() {
            return undefined;
          }
          disconnect() {
            return undefined;
          }
        },
      );
      const view = await create((host) => host.mode.set('range'));
      await view.open();
      view.endInput()?.click();
      view.detect();
      await view.fixture.whenStable();
      view.detect();
      expect(view.bar()?.style.left).toBe('140px');

      placeInputs({ start: 12, end: 180 });
      resize?.([], {} as ResizeObserver);
      view.detect();
      expect(view.bar()?.style.left).toBe('180px');
      expect(view.bar()?.hasAttribute('data-animated')).toBe(false);
      vi.unstubAllGlobals();
    });
  });

  describe('range panel arrow', () => {
    const rects = {
      field: new DOMRect(40, 100, 300, 32),
      pane: new DOMRect(40, 138, 576, 340),
      start: new DOMRect(52, 100, 100, 32),
      end: new DOMRect(192, 100, 100, 32),
    };

    it('points just inside the active input, measured from the pane edge', async () => {
      const view = await create((host) => host.mode.set('range'));
      await view.open();
      layOut(view, rects);
      await resizeAndSettle(view);
      expect(view.arrow()?.hasAttribute('data-ready')).toBe(true);
      // 52 + 20 inside the input, minus the pane's own 40.
      expect(view.arrow()?.style.left).toBe('32px');
      expect(view.arrow()?.getAttribute('data-side')).toBe('bottom');
    });

    it('moves to the end input with the bar', async () => {
      const view = await create((host) => host.mode.set('range'));
      await view.open();
      layOut(view, rects);
      await resizeAndSettle(view);

      view.endInput()?.click();
      view.detect();
      await view.fixture.whenStable();
      view.detect();
      expect(view.arrow()?.style.left).toBe('172px');
      expect(view.arrow()?.hasAttribute('data-animated')).toBe(true);
    });

    it('measures from the input right edge in an RTL panel, and sits on the bottom edge of a top panel', async () => {
      const view = await create((host) => {
        host.mode.set('range');
        host.dir.set('rtl');
        host.placement.set('topLeft');
      });
      await view.open();
      layOut(view, {
        ...rects,
        pane: new DOMRect(40, -240, 576, 340),
      });
      await resizeAndSettle(view);
      // 152 - 20, minus the pane's 40.
      expect(view.arrow()?.style.left).toBe('92px');
      expect(view.arrow()?.getAttribute('data-side')).toBe('top');
    });

    it('stays inside the panel, away from its corners', async () => {
      const view = await create((host) => host.mode.set('range'));
      await view.open();
      layOut(view, {
        ...rects,
        start: new DOMRect(41, 100, 100, 32),
      });
      await resizeAndSettle(view);
      expect(view.arrow()?.style.left).toBe('21px');

      layOut(view, { ...rects, start: new DOMRect(40, 100, 6, 32) });
      await resizeAndSettle(view);
      // A 6px input leaves 3px: the arrow keeps 16px from the edge.
      expect(view.arrow()?.style.left).toBe('16px');
    });
  });

  describe('time columns', () => {
    const FEB_15_0930 = new Date(2024, 1, 15, 9, 30);

    const column = (view: Awaited<ReturnType<typeof create>>, unit: string) =>
      document.querySelector<HTMLElement>(
        `[data-slot="date-picker-time"] [data-unit="${unit}"]`,
      ) as HTMLElement;
    const texts = (view: Awaited<ReturnType<typeof create>>, unit: string) =>
      Array.from(column(view, unit).querySelectorAll('[role="option"]')).map(
        (option) => option.textContent?.trim(),
      );
    const selected = (view: Awaited<ReturnType<typeof create>>, unit: string) =>
      column(view, unit)
        .querySelector('[aria-selected="true"]')
        ?.textContent?.trim();
    const press = (
      view: Awaited<ReturnType<typeof create>>,
      unit: string,
      key: string,
    ) => {
      column(view, unit).dispatchEvent(
        new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }),
      );
      view.detect();
    };
    const withTime = (options: AndesTimeOptions | boolean = true) =>
      create((host) => {
        host.showTime.set(options);
        host.value.set(FEB_15_0930);
      });

    describe('one clock for the field and the columns', () => {
      it('shows a 24-hour time in the field when the columns run 00-23', async () => {
        const view = await withTime();
        expect(view.input()?.value).toBe('Feb 15, 2024, 09:30');
        await view.open();
        expect(texts(view, 'hours')).toHaveLength(24);
        expect(texts(view, 'hours')[0]).toBe('00');
        expect(selected(view, 'hours')).toBe('09');
      });

      it('never prints 24:xx just after midnight', async () => {
        const view = await create((host) => {
          host.showTime.set(true);
          host.value.set(new Date(2024, 1, 15, 0, 30));
        });
        expect(view.input()?.value).toBe('Feb 15, 2024, 00:30');
      });

      it('shows the locale 12-hour form when use12Hours asks for it', async () => {
        const view = await withTime({ use12Hours: true });
        expect(view.input()?.value).toBe('Feb 15, 2024, 9:30 AM');
        await view.open();
        expect(texts(view, 'hours')).toHaveLength(12);
        expect(texts(view, 'meridiem')).toEqual(['AM', 'PM']);
      });

      it('parses typed 24-hour text back', async () => {
        const view = await withTime();
        const input = view.input() as HTMLInputElement;
        input.value = 'Feb 20, 2024, 18:45';
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(
          new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }),
        );
        view.detect();
        await view.fixture.whenStable();
        const value = view.host.value() as Date;
        expect([value.getDate(), value.getHours(), value.getMinutes()]).toEqual(
          [20, 18, 45],
        );
      });
    });

    describe('keyboard', () => {
      it('jumps five options with PageDown and PageUp', async () => {
        const view = await withTime();
        await view.open();
        press(view, 'hours', 'PageDown');
        expect(selected(view, 'hours')).toBe('14');
        press(view, 'hours', 'PageUp');
        press(view, 'hours', 'PageUp');
        expect(selected(view, 'hours')).toBe('04');
      });

      it('stops at the ends of the column', async () => {
        const view = await create((host) => {
          host.showTime.set(true);
          host.value.set(new Date(2024, 1, 15, 22, 30));
        });
        await view.open();
        press(view, 'hours', 'PageDown');
        expect(selected(view, 'hours')).toBe('23');
        press(view, 'hours', 'PageDown');
        expect(selected(view, 'hours')).toBe('23');
        press(view, 'hours', 'Home');
        press(view, 'hours', 'PageUp');
        expect(selected(view, 'hours')).toBe('00');
      });

      it('moves to the neighbouring column with ArrowRight and ArrowLeft', async () => {
        const view = await withTime();
        await view.open();
        column(view, 'hours').focus();
        press(view, 'hours', 'ArrowRight');
        expect(document.activeElement).toBe(column(view, 'minutes'));
        press(view, 'minutes', 'ArrowLeft');
        expect(document.activeElement).toBe(column(view, 'hours'));
        // Nowhere to go past the first column; the value is left alone.
        press(view, 'hours', 'ArrowLeft');
        expect(document.activeElement).toBe(column(view, 'hours'));
        expect(selected(view, 'hours')).toBe('09');
        expect(selected(view, 'minutes')).toBe('30');
      });

      it('reads the row of columns the other way round in an RTL panel', async () => {
        const view = await create((host) => {
          host.dir.set('rtl');
          host.showTime.set(true);
          host.value.set(FEB_15_0930);
        });
        await view.open();
        column(view, 'hours').focus();
        press(view, 'hours', 'ArrowLeft');
        expect(document.activeElement).toBe(column(view, 'minutes'));
        press(view, 'minutes', 'ArrowRight');
        expect(document.activeElement).toBe(column(view, 'hours'));
      });
    });

    describe('scrolling to the picked option', () => {
      /** Frames the test runs by hand, so the easing can be sampled. */
      let frames: Map<number, FrameRequestCallback>;
      let nextFrame: number;

      const run = (now: number) => {
        const due = [...frames.entries()];
        frames.clear();
        due.forEach(([, callback]) => callback(now));
      };

      beforeEach(() => {
        frames = new Map();
        nextFrame = 1;
        // The nth option of a column sits 28px lower than the one before, after 4px of padding.
        vi.spyOn(HTMLElement.prototype, 'offsetTop', 'get').mockImplementation(
          function (this: HTMLElement) {
            const index = Number(this.id.split('-').pop());
            return this.getAttribute('role') === 'option' ? 4 + index * 28 : 0;
          },
        );
      });

      const manualFrames = () => {
        vi.spyOn(window, 'requestAnimationFrame').mockImplementation(
          (callback) => {
            frames.set(nextFrame, callback);
            return nextFrame++;
          },
        );
        vi.spyOn(window, 'cancelAnimationFrame').mockImplementation((id) => {
          frames.delete(id);
        });
      };

      it('puts the selected option at the top at once when the panel opens', async () => {
        const view = await withTime();
        await view.open();
        expect(column(view, 'hours').scrollTop).toBe(9 * 28);
        expect(column(view, 'minutes').scrollTop).toBe(30 * 28);
      });

      it('leaves a column where it is when an option is picked with the pointer', async () => {
        const view = await withTime();
        await view.open();
        manualFrames();
        column(view, 'hours').scrollTop = 3 * 28;

        column(view, 'hours')
          .querySelector<HTMLElement>('[id$="-hours-14"]')
          ?.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
        view.detect();
        await view.fixture.whenStable();
        view.detect();

        expect(selected(view, 'hours')).toBe('14');
        expect(column(view, 'hours').scrollTop).toBe(3 * 28);
        expect(frames.size).toBe(0);
      });

      it('eases to an option picked afterwards, ending exactly on it', async () => {
        const view = await withTime();
        await view.open();
        manualFrames();

        press(view, 'hours', 'PageDown');
        view.detect();
        await view.fixture.whenStable();
        view.detect();
        // Not there yet: the first frame only starts the clock.
        expect(column(view, 'hours').scrollTop).toBe(9 * 28);

        run(1000);
        run(1075);
        const midway = column(view, 'hours').scrollTop;
        expect(midway).toBeGreaterThan(9 * 28);
        expect(midway).toBeLessThan(14 * 28);
        // Eased out: past the half-way point after half the time.
        expect(midway).toBeGreaterThan((9 * 28 + 14 * 28) / 2);

        run(1150);
        expect(column(view, 'hours').scrollTop).toBe(14 * 28);
        expect(frames.size).toBe(0);
      });

      it('retargets from where it is when another option is picked mid-flight', async () => {
        const view = await withTime();
        await view.open();
        manualFrames();

        press(view, 'hours', 'PageDown');
        await view.fixture.whenStable();
        view.detect();
        run(1000);
        run(1060);
        const partway = column(view, 'hours').scrollTop;
        press(view, 'hours', 'PageUp');
        await view.fixture.whenStable();
        view.detect();
        // The earlier flight is gone, only the new one is pending.
        expect(frames.size).toBe(1);
        run(2000);
        run(2150);
        expect(column(view, 'hours').scrollTop).toBe(9 * 28);
        expect(partway).toBeGreaterThan(9 * 28);
      });

      it('moves at once under reduced motion', async () => {
        const view = await withTime();
        await view.open();
        manualFrames();
        // jsdom has no matchMedia of its own.
        vi.stubGlobal('matchMedia', (query: string) => ({
          matches: query.includes('prefers-reduced-motion: reduce'),
          media: query,
          addEventListener: () => undefined,
          removeEventListener: () => undefined,
        }));

        press(view, 'hours', 'PageDown');
        await view.fixture.whenStable();
        view.detect();
        expect(column(view, 'hours').scrollTop).toBe(14 * 28);
        expect(frames.size).toBe(0);
      });

      it('drops a flight still under way when the panel closes', async () => {
        const view = await withTime();
        await view.open();
        manualFrames();
        press(view, 'hours', 'PageDown');
        await view.fixture.whenStable();
        view.detect();
        expect(frames.size).toBe(1);

        document.body.dispatchEvent(
          new KeyboardEvent('keydown', {
            key: 'Escape',
            keyCode: 27,
            bubbles: true,
          }),
        );
        view.detect();
        await view.fixture.whenStable();
        expect(frames.size).toBe(0);
      });
    });
  });

  describe('range separator', () => {
    it('marks the default arrow, so a right-to-left field can turn it round', async () => {
      const view = await create((host) => host.mode.set('range'));
      const separator = view.root.querySelector(
        '.andes-date-picker__separator',
      );
      expect(separator?.hasAttribute('data-arrow')).toBe(true);
    });
  });
});
