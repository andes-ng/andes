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
    field,
    panel,
    pane,
    open,
  };
}

/** Lays the field and the pane out at fixed rectangles; jsdom has no layout of its own. */
function layOut(
  view: Awaited<ReturnType<typeof create>>,
  rects: { field: DOMRect; pane: DOMRect },
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
      return new DOMRect();
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
});
