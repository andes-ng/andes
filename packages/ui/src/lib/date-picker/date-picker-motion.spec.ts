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
});
