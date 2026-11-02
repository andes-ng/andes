import { Component, signal, TemplateRef, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { declaredValue } from '../../testing/computed-style';
import {
  ANDES_SLIDER_TRACK_DRAG,
  AndesSlider,
  AndesSliderDragEvent,
  AndesSliderFocusEvent,
  AndesSliderMarkInput,
  AndesSliderOrientation,
  AndesSliderRangeConfig,
  AndesSliderSize,
  AndesSliderStatus,
  AndesSliderValue,
} from './slider';
import { AndesSliderThumbContext } from './slider-templates';

type LogEntry = readonly [string, unknown];

@Component({
  imports: [AndesSlider],
  template: `
    <form #form>
      <andes-slider
        [value]="value()"
        [min]="min()"
        [max]="max()"
        [step]="step()"
        [range]="range()"
        [orientation]="orientation()"
        [reverse]="reverse()"
        [disabled]="disabled()"
        [marks]="marks()"
        [dots]="dots()"
        [name]="name()"
        [minDistance]="minDistance()"
        [status]="status()"
        [aria-invalid]="invalid()"
        [readOnly]="readOnly()"
        [size]="size()"
        [thumbTemplate]="customThumb() ? thumbTpl : undefined"
        [trackClick]="trackClick()"
        [snapToMarks]="snapToMarks()"
        [snapThreshold]="snapThreshold()"
        [tooltip]="'never'"
        aria-label="Level"
        startAriaLabel="Low"
        endAriaLabel="High"
        (valueChange)="log.push(['valueChange', $event])"
        (valueCommit)="log.push(['valueCommit', $event])"
        (focused)="log.push(['focused', $event])"
        (blurred)="log.push(['blurred', $event])"
        (dragStart)="log.push(['dragStart', $event])"
        (dragEnd)="log.push(['dragEnd', $event])"
      />
    </form>
    <ng-template
      #thumbTpl
      let-value
      let-index="index"
      let-dragging="dragging"
      let-focused="focused"
    >
      <b class="custom-thumb"
        >{{ index }}:{{ value }}:{{ dragging }}:{{ focused }}</b
      >
    </ng-template>
  `,
})
class FeatureHost {
  readonly slider = viewChild.required(AndesSlider);
  readonly thumbTpl =
    viewChild.required<TemplateRef<AndesSliderThumbContext>>('thumbTpl');
  readonly value = signal<AndesSliderValue | undefined>(undefined);
  readonly min = signal(0);
  readonly max = signal(100);
  readonly step = signal<number | null>(1);
  readonly range = signal<boolean | AndesSliderRangeConfig>(false);
  readonly orientation = signal<AndesSliderOrientation>('horizontal');
  readonly reverse = signal(false);
  readonly disabled = signal<boolean | readonly boolean[]>(false);
  readonly marks = signal<readonly AndesSliderMarkInput[]>([]);
  readonly dots = signal(false);
  readonly name = signal<string | undefined>(undefined);
  readonly minDistance = signal(0);
  readonly status = signal<AndesSliderStatus | undefined>(undefined);
  readonly invalid = signal(false);
  readonly readOnly = signal(false);
  readonly size = signal<AndesSliderSize>('md');
  readonly customThumb = signal(false);
  readonly trackClick = signal(true);
  readonly snapToMarks = signal(false);
  readonly snapThreshold = signal<number | null>(null);
  readonly log: LogEntry[] = [];
}

function stubRect(
  element: HTMLElement,
  init: { left?: number; top?: number; width?: number; height?: number },
): DOMRect {
  const left = init.left ?? 0;
  const top = init.top ?? 0;
  const width = init.width ?? 0;
  const height = init.height ?? 0;
  const rect = {
    x: left,
    y: top,
    left,
    top,
    width,
    height,
    right: left + width,
    bottom: top + height,
    toJSON: () => undefined,
  } as DOMRect;
  element.getBoundingClientRect = () => rect;
  return rect;
}

function pointer(
  type: 'pointerdown' | 'pointermove' | 'pointerup' | 'pointercancel',
  clientX: number,
  clientY = 0,
): MouseEvent {
  return new MouseEvent(type, {
    bubbles: true,
    cancelable: true,
    button: 0,
    clientX,
    clientY,
  });
}

function key(name: string): KeyboardEvent {
  return new KeyboardEvent('keydown', {
    key: name,
    bubbles: true,
    cancelable: true,
  });
}

const CSS = readFileSync(
  join(process.cwd(), new URL('./slider.css', import.meta.url).pathname),
  'utf8',
);

describe('AndesSlider features', () => {
  function mount(setup: (host: FeatureHost) => void = () => undefined) {
    const fixture = TestBed.createComponent(FeatureHost);
    setup(fixture.componentInstance);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const all = (selector: string) =>
      Array.from(root.querySelectorAll<HTMLElement>(selector));

    const view = {
      fixture,
      host: fixture.componentInstance,
      root,
      get slider() {
        return root.querySelector('andes-slider') as HTMLElement;
      },
      get form() {
        return root.querySelector('form') as HTMLFormElement;
      },
      get control() {
        return root.querySelector(
          '[data-slot="slider-control"]',
        ) as HTMLElement;
      },
      get track() {
        return root.querySelector('[data-slot="slider-track"]') as HTMLElement;
      },
      get thumbs() {
        return all('[data-slot="slider-thumb"]');
      },
      get inputs() {
        return all(
          'input[data-slot="slider-input"]',
        ) as unknown as HTMLInputElement[];
      },
      values() {
        return all('[data-slot="slider-thumb"]').map((thumb) =>
          Number(thumb.getAttribute('aria-valuenow')),
        );
      },
      detect() {
        fixture.detectChanges();
      },
      /** Presses, moves to each `to` position and releases, in track-percent coordinates. */
      drag(from: HTMLElement, startX: number, ...to: number[]) {
        from.dispatchEvent(pointer('pointerdown', startX));
        for (const x of to) {
          view.control.dispatchEvent(pointer('pointermove', x));
        }
        view.control.dispatchEvent(
          pointer('pointerup', to[to.length - 1] ?? startX),
        );
        fixture.detectChanges();
      },
      press(key_: string, index = 0) {
        view.thumbs[index].dispatchEvent(key(key_));
        fixture.detectChanges();
      },
      entries(kind: string) {
        return view.host.log
          .filter(([name]) => name === kind)
          .map(([, payload]) => payload);
      },
    };
    stubRect(view.track, { left: 0, width: 100 });
    return view;
  }

  // --- name / native forms -------------------------------------------------

  describe('name', () => {
    it('renders no hidden input without a name', () => {
      const view = mount();

      expect(view.inputs).toHaveLength(0);
      view.host.name.set('');
      view.detect();
      expect(view.inputs).toHaveLength(0);
    });

    it('renders one hidden input for a single value and keeps it current', () => {
      const view = mount((host) => {
        host.name.set('volume');
        host.value.set(30);
      });

      expect(view.inputs).toHaveLength(1);
      expect(view.inputs[0].type).toBe('hidden');
      expect(view.inputs[0].name).toBe('volume');
      expect(view.inputs[0].value).toBe('30');
      expect(new FormData(view.form).getAll('volume')).toEqual(['30']);

      view.press('End');
      expect(new FormData(view.form).getAll('volume')).toEqual(['100']);
    });

    it('repeats the same name once per handle, in handle order', () => {
      const view = mount((host) => {
        host.name.set('price');
        host.range.set(true);
        host.value.set([20, 70]);
      });

      expect(view.inputs.map((input) => input.name)).toEqual([
        'price',
        'price',
      ]);
      expect(new FormData(view.form).getAll('price')).toEqual(['20', '70']);

      view.host.range.set({ editable: true });
      view.host.value.set([10, 40, 90]);
      view.detect();
      expect(new FormData(view.form).getAll('price')).toEqual([
        '10',
        '40',
        '90',
      ]);
    });

    it('submits nothing while the whole slider is disabled', () => {
      const view = mount((host) => {
        host.name.set('volume');
        host.value.set(30);
        host.disabled.set(true);
      });

      expect(view.inputs[0].disabled).toBe(true);
      expect(new FormData(view.form).has('volume')).toBe(false);
    });

    it('skips the entry of a disabled handle only', () => {
      const view = mount((host) => {
        host.name.set('price');
        host.range.set(true);
        host.value.set([20, 70]);
        host.disabled.set([true, false]);
      });

      expect(view.inputs.map((input) => input.disabled)).toEqual([true, false]);
      expect(new FormData(view.form).getAll('price')).toEqual(['70']);
    });

    it('still submits a read-only slider', () => {
      const view = mount((host) => {
        host.name.set('volume');
        host.value.set(30);
        host.readOnly.set(true);
      });

      expect(new FormData(view.form).getAll('volume')).toEqual(['30']);
    });
  });

  // --- minDistance ---------------------------------------------------------

  describe('minDistance', () => {
    const range = (host: FeatureHost, distance = 10, value = [20, 60]) => {
      host.range.set(true);
      host.minDistance.set(distance);
      host.value.set(value);
    };

    it('stops a handle at its neighbour plus the gap on the keyboard', () => {
      const view = mount((host) => range(host));

      view.press('End', 0);
      expect(view.values()).toEqual([50, 60]);

      view.press('Home', 1);
      expect(view.values()).toEqual([50, 60]);

      view.press('ArrowRight', 0);
      expect(view.values()).toEqual([50, 60]);
    });

    it('stops the high handle at the low one plus the gap', () => {
      const view = mount((host) => range(host));

      view.press('Home', 1);

      expect(view.values()).toEqual([20, 30]);
    });

    it('holds a low handle dragged into the high one, then lets it come back', () => {
      const view = mount((host) => range(host));

      view.thumbs[0].dispatchEvent(pointer('pointerdown', 20));
      view.control.dispatchEvent(pointer('pointermove', 90));
      view.detect();
      expect(view.values()).toEqual([50, 60]);

      view.control.dispatchEvent(pointer('pointermove', 35));
      view.control.dispatchEvent(pointer('pointerup', 35));
      view.detect();
      expect(view.values()).toEqual([35, 60]);
    });

    it('holds a high handle dragged into the low one', () => {
      const view = mount((host) => range(host));

      view.drag(view.thumbs[1], 60, 5);

      expect(view.values()).toEqual([20, 30]);
    });

    it('applies to a rail click, which moves the nearest handle only as far as allowed', () => {
      const view = mount((host) => range(host, 10, [40, 50]));

      // Nearest to 47 is the high handle (50): 47 would be 7 from the low one.
      view.drag(view.control, 47);
      expect(view.values()).toEqual([40, 50]);

      // Nearest to 43 is the low handle (40): 43 would be 7 from the high one.
      view.drag(view.control, 43);
      expect(view.values()).toEqual([40, 50]);

      // Away from the neighbour the same click goes through.
      view.drag(view.control, 5);
      expect(view.values()).toEqual([5, 50]);
      view.drag(view.control, 90);
      expect(view.values()).toEqual([5, 90]);
    });

    it('applies to a mark click', () => {
      const view = mount((host) => {
        range(host, 10, [40, 50]);
        host.marks.set([
          { value: 48, label: '48' },
          { value: 70, label: '70' },
        ]);
      });
      const [near, far] = Array.from(
        view.root.querySelectorAll<HTMLElement>('[data-slot="slider-mark"]'),
      );

      near.click();
      view.detect();
      // 48 is nearest to the high handle (50), but only 8 from the low one.
      expect(view.values()).toEqual([40, 50]);

      far.click();
      view.detect();
      expect(view.values()).toEqual([40, 70]);
    });

    it('rounds the gap up to the step grid', () => {
      const view = mount((host) => {
        range(host, 7, [20, 60]);
        host.step.set(5);
      });

      view.press('End', 0);
      // 60 - 7 = 53 is off the grid: the nearest step at or below it.
      expect(view.values()).toEqual([50, 60]);

      view.host.value.set([20, 60]);
      view.detect();
      view.press('Home', 1);
      // 20 + 7 = 27, rounded up to the grid.
      expect(view.values()).toEqual([20, 30]);
    });

    it('keeps fractional steps free of float drift', () => {
      const view = mount((host) => {
        range(host, 0.25, [0.2, 0.9]);
        host.min.set(0);
        host.max.set(1);
        host.step.set(0.1);
      });

      view.press('Home', 1);

      expect(view.values()).toEqual([0.2, 0.5]);
    });

    it('moves one mark at a time and keeps the gap in marks-only mode', () => {
      const view = mount((host) => {
        range(host, 25, [0, 50]);
        host.marks.set([0, 20, 50, 70, 100]);
        host.step.set(null);
      });

      view.press('End', 0);
      // The mark at or below 50 - 25 = 25 is 20.
      expect(view.values()).toEqual([20, 50]);
    });

    it('pushes an incoming value that is too close apart', () => {
      const view = mount((host) => range(host, 10, [50, 52]));
      expect(view.values()).toEqual([50, 60]);

      view.host.value.set([95, 96]);
      view.detect();
      expect(view.values()).toEqual([90, 100]);

      view.host.range.set({ editable: true });
      view.host.value.set([95, 96, 97]);
      view.detect();
      expect(view.values()).toEqual([80, 90, 100]);
    });

    it('re-spreads the current value when minDistance changes', () => {
      const view = mount((host) => range(host, 0, [50, 52]));
      expect(view.values()).toEqual([50, 52]);

      view.host.minDistance.set(10);
      view.detect();

      expect(view.values()).toEqual([50, 60]);
    });

    it('is not enforced when the handles cannot all fit', () => {
      const view = mount((host) => {
        host.range.set({ editable: true });
        host.minDistance.set(60);
        host.value.set([10, 20, 30]);
      });

      expect(view.values()).toEqual([10, 20, 30]);
    });

    it('ignores a negative gap and a single handle', () => {
      const view = mount((host) => {
        host.minDistance.set(-5);
        host.value.set(40);
      });

      view.press('ArrowRight');
      expect(view.values()).toEqual([41]);

      view.host.minDistance.set(30);
      view.detect();
      view.press('End');
      expect(view.values()).toEqual([100]);
    });

    describe('in an editable range', () => {
      const editable = (
        host: FeatureHost,
        value: number[],
        distance = 10,
        config: AndesSliderRangeConfig = {},
      ) => {
        host.range.set({ editable: true, ...config });
        host.minDistance.set(distance);
        host.value.set(value);
      };

      it('adds a handle where it fits', () => {
        const view = mount((host) => editable(host, [20, 80]));

        view.drag(view.control, 50);

        expect(view.values()).toEqual([20, 50, 80]);
      });

      it('moves an added handle out of its neighbours gap', () => {
        const view = mount((host) => editable(host, [20, 60]));

        view.drag(view.control, 25);
        expect(view.values()).toEqual([20, 30, 60]);

        view.host.value.set([20, 60]);
        view.detect();
        view.drag(view.control, 57);
        expect(view.values()).toEqual([20, 50, 60]);

        view.host.value.set([20, 60]);
        view.detect();
        view.drag(view.control, 62);
        expect(view.values()).toEqual([20, 60, 70]);
      });

      it('adds nothing, and moves the nearest handle instead, when the gap leaves no room', () => {
        const view = mount((host) => editable(host, [20, 30]));

        view.drag(view.control, 25);

        // No room for a third handle between 20 and 30; the nearest handle cannot get closer.
        expect(view.values()).toEqual([20, 30]);
      });

      it('caps the handle count below maxCount when the track is full', () => {
        const view = mount((host) =>
          editable(host, [10, 50, 90], 40, { maxCount: 10 }),
        );

        view.drag(view.control, 70);

        expect(view.values()).toHaveLength(3);
      });

      it('adds nothing next to a bound that leaves no room for the gap', () => {
        const view = mount((host) => editable(host, [5, 60], 10));

        // A click at 2 would need a slot below `min`: it moves the nearest handle instead.
        view.drag(view.control, 2);

        expect(view.values()).toEqual([2, 60]);
        expect(view.values()).toHaveLength(2);

        view.host.value.set([20, 60]);
        view.detect();
        view.drag(view.control, 98);
        expect(view.values().every((v) => v >= 0 && v <= 100)).toBe(true);
      });

      it('keeps the gap while the new handle is dragged', () => {
        const view = mount((host) => editable(host, [20, 80]));

        view.drag(view.control, 50, 75, 79);

        expect(view.values()).toEqual([20, 70, 80]);
      });
    });

    describe('with draggableTrack', () => {
      it('moves the whole range rigidly, so the gap is untouched', () => {
        const view = mount((host) => {
          host.range.set({ draggableTrack: true });
          host.minDistance.set(10);
          host.value.set([20, 40]);
        });

        view.drag(view.control, 30, 50);
        expect(view.values()).toEqual([40, 60]);

        view.drag(view.control, 50, 200);
        expect(view.values()).toEqual([80, 100]);
      });

      it('still keeps a pressed handle away from its neighbour', () => {
        const view = mount((host) => {
          host.range.set({ draggableTrack: true });
          host.minDistance.set(10);
          host.value.set([20, 40]);
        });

        view.drag(view.thumbs[0], 20, 90);

        expect(view.values()).toEqual([30, 40]);
      });
    });

    describe('with reverse, vertical and RTL', () => {
      it('holds the gap on a reversed slider', () => {
        const view = mount((host) => {
          range(host);
          host.reverse.set(true);
        });

        // Reversed: pointer x=95 means value 5.
        view.drag(view.thumbs[1], 40, 95);

        expect(view.values()).toEqual([20, 30]);
      });

      it('holds the gap on a vertical slider', () => {
        const view = mount((host) => {
          range(host);
          host.orientation.set('vertical');
        });
        stubRect(view.track, { top: 0, height: 100 });

        // Bottom edge is the minimum: y=0 is the maximum.
        view.thumbs[0].dispatchEvent(pointer('pointerdown', 0, 80));
        view.control.dispatchEvent(pointer('pointermove', 0, 0));
        view.control.dispatchEvent(pointer('pointerup', 0, 0));
        view.detect();

        expect(view.values()).toEqual([50, 60]);
      });

      it('holds the gap under dir="rtl"', () => {
        @Component({
          imports: [AndesSlider],
          template: `<div dir="rtl">
            <andes-slider
              range
              [minDistance]="10"
              [value]="[20, 60]"
              startAriaLabel="Low"
              endAriaLabel="High"
            />
          </div>`,
        })
        class RtlHost {}

        const fixture = TestBed.createComponent(RtlHost);
        fixture.detectChanges();
        const root = fixture.nativeElement as HTMLElement;
        const track = root.querySelector('[data-slot="slider-track"]');
        const control = root.querySelector('[data-slot="slider-control"]');
        stubRect(track as HTMLElement, { left: 0, width: 100 });
        const thumbs = Array.from(
          root.querySelectorAll<HTMLElement>('[data-slot="slider-thumb"]'),
        );

        // RTL: the inline start is the right edge, so x=0 is the maximum.
        thumbs[0].dispatchEvent(pointer('pointerdown', 80));
        control?.dispatchEvent(pointer('pointermove', 0));
        control?.dispatchEvent(pointer('pointerup', 0));
        fixture.detectChanges();

        expect(
          thumbs.map((thumb) => Number(thumb.getAttribute('aria-valuenow'))),
        ).toEqual([50, 60]);
      });
    });
  });

  // --- status --------------------------------------------------------------

  describe('status', () => {
    it('paints the error tier and marks every handle invalid', () => {
      const view = mount((host) => {
        host.range.set(true);
        host.value.set([20, 60]);
        host.status.set('error');
      });

      expect(view.slider.getAttribute('data-status')).toBe('error');
      expect(view.thumbs.map((t) => t.getAttribute('aria-invalid'))).toEqual([
        'true',
        'true',
      ]);
      expect(view.slider.hasAttribute('aria-invalid')).toBe(false);
    });

    it('paints the warning tier without announcing it as invalid', () => {
      const view = mount((host) => host.status.set('warning'));

      expect(view.slider.getAttribute('data-status')).toBe('warning');
      expect(view.thumbs[0].hasAttribute('aria-invalid')).toBe(false);
    });

    it('treats aria-invalid exactly like status="error"', () => {
      const view = mount((host) => host.invalid.set(true));

      expect(view.slider.getAttribute('data-status')).toBe('error');
      expect(view.thumbs[0].getAttribute('aria-invalid')).toBe('true');

      view.host.invalid.set(false);
      view.detect();
      expect(view.slider.hasAttribute('data-status')).toBe(false);
      expect(view.thumbs[0].hasAttribute('aria-invalid')).toBe(false);
    });

    it('lets an error win over a warning from aria-invalid', () => {
      const view = mount((host) => {
        host.status.set('warning');
        host.invalid.set(true);
      });

      expect(view.slider.getAttribute('data-status')).toBe('error');
    });

    it('leaves the markup unchanged without a status', () => {
      const view = mount();

      expect(view.slider.hasAttribute('data-status')).toBe(false);
      expect(view.thumbs[0].hasAttribute('aria-invalid')).toBe(false);
      expect(view.thumbs[0].hasAttribute('aria-readonly')).toBe(false);
    });

    it('swaps only the accent in the stylesheet, so a consumer hook still wins', () => {
      expect(
        declaredValue(
          CSS,
          ":host([data-status='error'])",
          '--_andes-slider-accent',
        ),
      ).toBe('var(--andes-color-danger)');
      expect(
        declaredValue(
          CSS,
          ":host([data-status='warning'])",
          '--_andes-slider-accent',
        ),
      ).toBe('var(--andes-color-warning-hover)');
      // The consumer hook is read first; the status accent is only the fallback.
      expect(
        declaredValue(
          CSS,
          '.andes-slider__indicator',
          'background-color',
        )?.replace(/\s+/g, ''),
      ).toBe('var(--andes-slider-track-color,var(--_andes-slider-accent))');
    });

    it('maps the parts onto the system palette in forced-colors mode', () => {
      const forced = CSS.slice(CSS.indexOf('@media (forced-colors: active)'));

      expect(forced).toContain('background-color: Highlight');
      expect(forced).toContain('forced-color-adjust: none');
      expect(forced).toContain('GrayText');
    });
  });

  // --- readOnly ------------------------------------------------------------

  describe('readOnly', () => {
    const readOnly = (host: FeatureHost) => {
      host.readOnly.set(true);
      host.value.set(40);
    };

    it('announces every handle as read-only and keeps it focusable', () => {
      const view = mount((host) => {
        host.range.set(true);
        host.value.set([20, 60]);
        host.readOnly.set(true);
      });

      expect(view.slider.hasAttribute('data-readonly')).toBe(true);
      for (const thumb of view.thumbs) {
        expect(thumb.getAttribute('aria-readonly')).toBe('true');
        expect(thumb.getAttribute('tabindex')).toBe('0');
        expect(thumb.hasAttribute('aria-disabled')).toBe(false);
      }
    });

    it('ignores every key', () => {
      const view = mount(readOnly);

      for (const name of [
        'ArrowRight',
        'ArrowLeft',
        'ArrowUp',
        'ArrowDown',
        'PageUp',
        'PageDown',
        'Home',
        'End',
      ]) {
        view.press(name);
      }

      expect(view.values()).toEqual([40]);
      expect(view.host.log).toEqual([]);
    });

    it('ignores a press, a drag and a mark click', () => {
      const view = mount((host) => {
        readOnly(host);
        host.marks.set([{ value: 90, label: '90' }]);
      });

      view.drag(view.control, 80, 90);
      view.drag(view.thumbs[0], 40, 10);
      (
        view.root.querySelector('[data-slot="slider-mark"]') as HTMLElement
      ).click();
      view.detect();

      expect(view.values()).toEqual([40]);
      expect(view.host.log).toEqual([]);
      expect(view.slider.hasAttribute('data-dragging')).toBe(false);
    });

    it('does not remove a handle from an editable range', () => {
      const view = mount((host) => {
        host.range.set({ editable: true });
        host.value.set([20, 60]);
        host.readOnly.set(true);
      });

      view.press('Delete');
      view.drag(view.control, 40);

      expect(view.values()).toEqual([20, 60]);
    });

    it('still applies a programmatic value and can be edited again', () => {
      const view = mount(readOnly);

      view.host.value.set(70);
      view.detect();
      expect(view.values()).toEqual([70]);

      view.host.readOnly.set(false);
      view.detect();
      view.press('End');
      expect(view.values()).toEqual([100]);
      expect(view.thumbs[0].hasAttribute('aria-readonly')).toBe(false);
    });

    it('gives no hover or press feedback in the stylesheet', () => {
      expect(
        declaredValue(
          CSS,
          ':host([data-readonly]) .andes-slider__thumb',
          'cursor',
        ),
      ).toBe('default');
      expect(
        declaredValue(
          CSS,
          ':host([data-readonly]) .andes-slider__control',
          'touch-action',
        ),
      ).toBe('auto');
      // The hover growth is scoped to the editable, enabled slider; focus-visible shows the halo.
      expect(CSS).toContain(
        ':host(:not([data-readonly]):not([data-disabled]))\n  .andes-slider__thumb:not([data-disabled]):hover::after',
      );
      expect(CSS).not.toContain('\n.andes-slider__thumb:hover::after');
    });
  });

  // --- motion --------------------------------------------------------------

  describe('thumb halo', () => {
    const THUMB_AFTER = '.andes-slider__thumb::after';

    it('rests with no halo and transitions its width and colour with the ring', () => {
      expect(declaredValue(CSS, THUMB_AFTER, 'outline')).toBe(
        '0 solid transparent',
      );
      expect(declaredValue(CSS, THUMB_AFTER, 'transition')).toContain(
        'outline var(--andes-motion-duration-mid, 0.2s)',
      );
    });

    it('draws a 6px translucent halo while hovered, focused or dragged', () => {
      const halo = CSS.slice(CSS.indexOf('outline: 6px solid'));
      expect(halo).toContain('color-mix(');
      expect(halo).toContain('20%');
      expect(CSS.split('outline: 6px solid').length - 1).toBe(2);
      expect(CSS).toContain('.andes-slider__thumb:focus::after');
      expect(CSS).toContain('.andes-slider__thumb[data-dragging]::after');
    });

    it('marks keyboard focus with the halo alone, without a second outline', () => {
      expect(
        declaredValue(CSS, '.andes-slider__thumb:focus-visible', 'outline'),
      ).toBe('none');
      expect(
        declaredValue(
          CSS,
          '.andes-slider__thumb:focus-visible',
          'outline-offset',
        ),
      ).toBeUndefined();
    });

    it('gives a disabled thumb no halo and no hover growth', () => {
      const start = CSS.indexOf('.andes-slider__thumb[data-disabled]::after {');
      const rule = CSS.slice(start, CSS.indexOf('}', start));
      expect(rule).toContain('outline: 0 solid transparent');
      expect(CSS).toContain(
        '.andes-slider__thumb:not([data-disabled]):hover::after',
      );
    });

    it('drops the translucent halo in forced colors', () => {
      const forced = CSS.slice(CSS.indexOf('@media (forced-colors: active)'));
      expect(forced).toContain('outline: 0 solid transparent');
      expect(forced).not.toContain('outline: 6px solid');
      expect(forced).toContain(
        '.andes-slider__thumb:focus-visible {\n    outline: 2px solid Highlight;',
      );
    });
  });

  // --- size ----------------------------------------------------------------

  describe('size', () => {
    it('defaults to md and reflects the size on the host', () => {
      const view = mount();
      expect(view.slider.getAttribute('data-size')).toBe('md');

      view.host.size.set('sm');
      view.detect();
      expect(view.slider.getAttribute('data-size')).toBe('sm');

      view.host.size.set('lg');
      view.detect();
      expect(view.slider.getAttribute('data-size')).toBe('lg');
    });

    it('keeps md as the original 14px thumb box and 4px rail', () => {
      expect(declaredValue(CSS, ':host', '--andes-slider-thumb-size')).toBe(
        '0.875rem',
      );
      expect(declaredValue(CSS, ':host', '--andes-slider-rail-size')).toBe(
        '0.25rem',
      );
      expect(declaredValue(CSS, ':host', '--andes-slider-dot-size')).toBe(
        '0.5rem',
      );
    });

    it('scales the thumb, rail and dots for sm and lg', () => {
      const sm = ":host([data-size='sm'])";
      const lg = ":host([data-size='lg'])";

      expect(declaredValue(CSS, sm, '--andes-slider-thumb-size')).toBe(
        '0.75rem',
      );
      expect(declaredValue(CSS, sm, '--andes-slider-rail-size')).toBe(
        '0.1875rem',
      );
      expect(declaredValue(CSS, lg, '--andes-slider-thumb-size')).toBe(
        '1.125rem',
      );
      expect(declaredValue(CSS, lg, '--andes-slider-rail-size')).toBe(
        '0.375rem',
      );
    });

    it('offsets the marks and the tooltip from the same variables', () => {
      expect(CSS).toContain(
        '(var(--andes-slider-thumb-size) - var(--andes-slider-rail-size)) / 2',
      );
      expect(
        declaredValue(
          CSS,
          ".andes-slider__tooltip[data-placement='top']",
          'inset-block-end',
        ),
      ).toBe('calc(100% + var(--andes-space-2))');
    });
  });

  // --- thumbTemplate -------------------------------------------------------

  describe('thumbTemplate', () => {
    it('renders nothing extra without a template', () => {
      const view = mount();

      expect(
        view.root.querySelector('[data-slot="slider-thumb-content"]'),
      ).toBeNull();
      expect(view.thumbs[0].hasAttribute('data-custom')).toBe(false);
    });

    it('renders the template inside every handle with value and index', () => {
      const view = mount((host) => {
        host.customThumb.set(true);
        host.range.set(true);
        host.value.set([20, 60]);
      });

      const texts = view.thumbs.map((thumb) =>
        thumb.querySelector('.custom-thumb')?.textContent?.trim(),
      );
      expect(texts).toEqual(['0:20:false:false', '1:60:false:false']);
      for (const thumb of view.thumbs) {
        expect(thumb.hasAttribute('data-custom')).toBe(true);
        expect(thumb.getAttribute('role')).toBe('slider');
        expect(
          thumb
            .querySelector('[data-slot="slider-thumb-content"]')
            ?.getAttribute('aria-hidden'),
        ).toBe('true');
      }
    });

    it('keeps the handle role, value and keyboard behaviour', () => {
      const view = mount((host) => {
        host.customThumb.set(true);
        host.value.set(30);
      });

      view.press('ArrowRight');

      expect(view.thumbs[0].getAttribute('aria-valuenow')).toBe('31');
      expect(
        view.thumbs[0].querySelector('.custom-thumb')?.textContent,
      ).toContain('0:31');
    });

    it('reports dragging for the dragged handle only', () => {
      const view = mount((host) => {
        host.customThumb.set(true);
        host.range.set(true);
        host.value.set([20, 60]);
      });

      view.thumbs[1].dispatchEvent(pointer('pointerdown', 60));
      view.detect();
      const texts = view.thumbs.map((thumb) =>
        thumb.querySelector('.custom-thumb')?.textContent?.trim(),
      );
      // The press also focuses the handle it grabbed.
      expect(texts).toEqual(['0:20:false:false', '1:60:true:true']);

      view.control.dispatchEvent(pointer('pointerup', 60));
      view.detect();
      expect(
        view.thumbs[1].querySelector('.custom-thumb')?.textContent,
      ).toContain(':false:');
    });

    it('reports focused for the focused handle only', () => {
      const view = mount((host) => {
        host.customThumb.set(true);
        host.range.set(true);
        host.value.set([20, 60]);
      });
      document.body.appendChild(view.root);

      view.thumbs[0].focus();
      view.detect();
      expect(
        view.thumbs[0].querySelector('.custom-thumb')?.textContent,
      ).toContain(':true');
      expect(
        view.thumbs[1].querySelector('.custom-thumb')?.textContent,
      ).toContain(':false');
      expect(view.thumbs[0].hasAttribute('data-focused')).toBe(true);

      view.thumbs[0].blur();
      view.detect();
      expect(
        view.thumbs[0].querySelector('.custom-thumb')?.textContent,
      ).toContain(':false');
      view.root.remove();
    });

    it('swaps the default circle out through the stylesheet, not the markup', () => {
      expect(
        declaredValue(
          CSS,
          '.andes-slider__thumb[data-custom]::after',
          'display',
        ),
      ).toBe('none');
      expect(
        declaredValue(CSS, '.andes-slider__thumb-content', 'pointer-events'),
      ).toBe('none');
    });
  });

  // --- focus API -----------------------------------------------------------

  describe('focus API', () => {
    function attached(setup: (host: FeatureHost) => void = () => undefined) {
      const view = mount((host) => {
        host.range.set(true);
        host.value.set([20, 60]);
        setup(host);
      });
      document.body.appendChild(view.root);
      return view;
    }

    it('focuses a handle by index and reports it with the native event', () => {
      const view = attached();

      view.host.slider().focus(1);
      expect(document.activeElement).toBe(view.thumbs[1]);

      const events = view.entries('focused') as AndesSliderFocusEvent[];
      expect(events).toHaveLength(1);
      expect(events[0].index).toBe(1);
      expect(events[0].event.type).toBe('focus');
      expect(events[0].event.target).toBe(view.thumbs[1]);
      view.root.remove();
    });

    it('focuses the first handle by default', () => {
      const view = attached();

      view.host.slider().focus();

      expect(document.activeElement).toBe(view.thumbs[0]);
      view.root.remove();
    });

    it('does nothing for a missing or disabled handle', () => {
      const view = attached((host) => host.disabled.set([true, false]));

      view.host.slider().focus(0);
      view.host.slider().focus(7);

      expect(document.activeElement).toBe(document.body);
      expect(view.entries('focused')).toHaveLength(0);
      view.root.remove();
    });

    it('reports blur with the index, and when focus moves between handles', () => {
      const view = attached();

      view.host.slider().focus(0);
      view.host.slider().focus(1);
      view.host.slider().blur();

      expect(
        view.host.log.map(([name, payload]) => [
          name,
          (payload as AndesSliderFocusEvent).index,
        ]),
      ).toEqual([
        ['focused', 0],
        ['blurred', 0],
        ['focused', 1],
        ['blurred', 1],
      ]);
      expect(document.activeElement).toBe(document.body);
      view.root.remove();
    });

    it('keeps blur() a no-op when focus is elsewhere', () => {
      const view = attached();
      const other = document.createElement('button');
      document.body.appendChild(other);
      other.focus();

      view.host.slider().blur();

      expect(document.activeElement).toBe(other);
      other.remove();
      view.root.remove();
    });

    it('focuses a read-only handle', () => {
      const view = attached((host) => host.readOnly.set(true));

      view.host.slider().focus(0);

      expect(document.activeElement).toBe(view.thumbs[0]);
      view.root.remove();
    });
  });

  // --- drag events ---------------------------------------------------------

  describe('drag events', () => {
    it('fires dragStart before the value change and dragEnd before the commit', () => {
      const view = mount((host) => host.value.set(30));

      view.drag(view.thumbs[0], 30, 50, 70);

      const order = view.host.log
        .map(([name]) => name)
        .filter((name) => name !== 'focused');
      expect(order).toEqual([
        'dragStart',
        'valueChange',
        'valueChange',
        'dragEnd',
        'valueCommit',
      ]);
      expect(view.entries('dragStart')).toEqual([{ index: 0, value: 30 }]);
      expect(view.entries('dragEnd')).toEqual([{ index: 0, value: 70 }]);
    });

    it('reports the handle index in a range and the value after the press', () => {
      const view = mount((host) => {
        host.range.set(true);
        host.value.set([20, 60]);
      });

      view.drag(view.thumbs[1], 62, 80);

      expect(view.entries('dragStart')).toEqual([{ index: 1, value: 62 }]);
      expect(view.entries('dragEnd')).toEqual([{ index: 1, value: 80 }]);
    });

    it('reports the nearest handle for a rail press', () => {
      const view = mount((host) => {
        host.range.set(true);
        host.value.set([20, 60]);
      });

      view.drag(view.control, 30);

      expect(view.entries('dragStart')).toEqual([{ index: 0, value: 30 }]);
      expect(view.entries('dragEnd')).toEqual([{ index: 0, value: 30 }]);
    });

    it('uses the documented sentinel and the whole range for a track drag', () => {
      const view = mount((host) => {
        host.range.set({ draggableTrack: true });
        host.value.set([20, 40]);
      });

      view.drag(view.control, 30, 50);

      expect(ANDES_SLIDER_TRACK_DRAG).toBe(-1);
      expect(view.entries('dragStart')).toEqual([
        { index: ANDES_SLIDER_TRACK_DRAG, value: [20, 40] },
      ]);
      expect(view.entries('dragEnd')).toEqual([
        { index: ANDES_SLIDER_TRACK_DRAG, value: [40, 60] },
      ]);
    });

    it('fires dragEnd on pointercancel too', () => {
      const view = mount((host) => host.value.set(30));

      view.thumbs[0].dispatchEvent(pointer('pointerdown', 30));
      view.control.dispatchEvent(pointer('pointercancel', 30));

      expect(view.entries('dragEnd')).toEqual([{ index: 0, value: 30 }]);
    });

    it('does not fire for the keyboard or a mark click', () => {
      const view = mount((host) => {
        host.value.set(30);
        host.marks.set([{ value: 80, label: '80' }]);
      });

      view.press('ArrowRight');
      (
        view.root.querySelector('[data-slot="slider-mark"]') as HTMLElement
      ).click();

      expect(view.entries('dragStart')).toEqual([]);
      expect(view.entries('dragEnd')).toEqual([]);
    });

    it('does not fire while disabled, read-only or when trackClick ignores the press', () => {
      const view = mount((host) => {
        host.value.set(30);
        host.disabled.set(true);
      });
      view.drag(view.thumbs[0], 30, 60);
      view.host.disabled.set(false);
      view.host.readOnly.set(true);
      view.detect();
      view.drag(view.thumbs[0], 30, 60);
      view.host.readOnly.set(false);
      view.host.trackClick.set(false);
      view.detect();
      view.drag(view.control, 80);

      expect(view.entries('dragStart')).toEqual([]);
      expect(view.entries('dragEnd')).toEqual([]);
    });

    it('fires for an added handle of an editable range, and for a dropped one', () => {
      const view = mount((host) => {
        host.range.set({ editable: true });
        host.value.set([20, 80]);
      });

      view.drag(view.control, 50, 55);
      expect(view.entries('dragStart')).toEqual([{ index: 1, value: 50 }]);
      expect(view.entries('dragEnd')).toEqual([{ index: 1, value: 55 }]);
    });

    it('reports a handle dragged off an editable track with its last value', () => {
      const view = mount((host) => {
        host.range.set({ editable: true });
        host.value.set([20, 80]);
      });
      stubRect(view.track, { left: 0, top: 0, width: 100, height: 4 });

      view.thumbs[0].dispatchEvent(pointer('pointerdown', 20, 2));
      view.control.dispatchEvent(pointer('pointermove', 25, 400));
      view.control.dispatchEvent(pointer('pointerup', 25, 400));
      view.detect();

      expect(view.values()).toEqual([80]);
      expect(view.entries('dragEnd')).toEqual([{ index: 0, value: 20 }]);
    });

    it('follows the stacked handle that actually travels', () => {
      const view = mount((host) => {
        host.range.set(true);
        host.value.set([50, 50]);
      });

      view.drag(view.control, 50, 70);

      const end = view.entries('dragEnd')[0] as AndesSliderDragEvent;
      expect(end).toEqual({ index: 1, value: 70 });
    });
  });

  // --- trackClick ----------------------------------------------------------

  describe('trackClick', () => {
    it("keeps today's behaviour by default", () => {
      const view = mount((host) => host.value.set(30));

      view.drag(view.control, 80);

      expect(view.values()).toEqual([80]);
      expect(view.slider.hasAttribute('data-no-track-click')).toBe(false);
    });

    it('ignores a rail press when false, and starts no drag', () => {
      const view = mount((host) => {
        host.value.set(30);
        host.trackClick.set(false);
      });

      view.drag(view.control, 80, 90);

      expect(view.values()).toEqual([30]);
      expect(view.host.log).toEqual([]);
      expect(view.slider.hasAttribute('data-no-track-click')).toBe(true);
    });

    it('still drags a grabbed handle and honours the keyboard', () => {
      const view = mount((host) => {
        host.value.set(30);
        host.trackClick.set(false);
      });

      view.drag(view.thumbs[0], 30, 60);
      expect(view.values()).toEqual([60]);

      view.press('ArrowLeft');
      expect(view.values()).toEqual([59]);
    });

    it('does not add a handle to an editable range', () => {
      const view = mount((host) => {
        host.range.set({ editable: true });
        host.value.set([20, 80]);
        host.trackClick.set(false);
      });

      view.drag(view.control, 50);

      expect(view.values()).toEqual([20, 80]);
    });

    it('keeps dragging a draggableTrack range by its filled segment', () => {
      const view = mount((host) => {
        host.range.set({ draggableTrack: true });
        host.value.set([20, 40]);
        host.trackClick.set(false);
      });

      view.drag(view.control, 30, 50);
      expect(view.values()).toEqual([40, 60]);

      // Outside the segment it is a rail press: ignored.
      view.drag(view.control, 90);
      expect(view.values()).toEqual([40, 60]);
    });

    it('keeps mark labels clickable', () => {
      const view = mount((host) => {
        host.value.set(30);
        host.trackClick.set(false);
        host.marks.set([{ value: 80, label: '80' }]);
      });

      (
        view.root.querySelector('[data-slot="slider-mark"]') as HTMLElement
      ).click();
      view.detect();

      expect(view.values()).toEqual([80]);
    });
  });

  // --- snapToMarks ---------------------------------------------------------

  describe('snapToMarks', () => {
    const marked = (host: FeatureHost) => {
      host.value.set(0);
      host.marks.set([0, 25, 50, 100]);
      host.snapToMarks.set(true);
    };

    it('does nothing by default', () => {
      const view = mount((host) => {
        marked(host);
        host.snapToMarks.set(false);
      });

      view.drag(view.thumbs[0], 0, 26);

      expect(view.values()).toEqual([26]);
    });

    it('pulls a drag within one step of a mark onto it', () => {
      const view = mount(marked);

      view.thumbs[0].dispatchEvent(pointer('pointerdown', 0));
      view.control.dispatchEvent(pointer('pointermove', 24));
      view.detect();
      expect(view.values()).toEqual([25]);

      view.control.dispatchEvent(pointer('pointermove', 26));
      view.detect();
      expect(view.values()).toEqual([25]);

      view.control.dispatchEvent(pointer('pointermove', 27));
      view.control.dispatchEvent(pointer('pointerup', 27));
      view.detect();
      expect(view.values()).toEqual([27]);
    });

    it('uses snapThreshold as the reach on each side', () => {
      const view = mount((host) => {
        marked(host);
        host.snapThreshold.set(5);
      });

      view.thumbs[0].dispatchEvent(pointer('pointerdown', 0));
      view.control.dispatchEvent(pointer('pointermove', 30));
      view.detect();
      expect(view.values()).toEqual([25]);

      view.control.dispatchEvent(pointer('pointermove', 31));
      view.detect();
      expect(view.values()).toEqual([31]);

      view.control.dispatchEvent(pointer('pointermove', 46));
      view.control.dispatchEvent(pointer('pointerup', 46));
      view.detect();
      expect(view.values()).toEqual([50]);
    });

    it('also snaps a rail press', () => {
      const view = mount(marked);

      view.drag(view.control, 99);

      expect(view.values()).toEqual([100]);
    });

    it('leaves the keyboard and mark clicks alone', () => {
      const view = mount((host) => {
        marked(host);
        host.value.set(24);
      });

      view.press('ArrowRight');
      expect(view.values()).toEqual([25]);
      view.press('ArrowRight');
      expect(view.values()).toEqual([26]);
    });

    it('does nothing without marks', () => {
      const view = mount((host) => {
        host.value.set(0);
        host.snapToMarks.set(true);
      });

      view.drag(view.thumbs[0], 0, 26);

      expect(view.values()).toEqual([26]);
    });

    it('rounds a mark that is off the step grid back onto it', () => {
      const view = mount((host) => {
        host.value.set(0);
        host.step.set(10);
        host.marks.set([0, 23]);
        host.snapToMarks.set(true);
        host.snapThreshold.set(4);
      });

      view.drag(view.thumbs[0], 0, 20);

      expect(view.values()).toEqual([20]);
    });

    it('leaves marks-only sliders (step null) as they were', () => {
      const view = mount((host) => {
        marked(host);
        host.step.set(null);
      });

      view.drag(view.thumbs[0], 0, 40);

      expect(view.values()).toEqual([50]);
    });

    it('does not snap a rigid track drag', () => {
      const view = mount((host) => {
        host.range.set({ draggableTrack: true });
        host.value.set([20, 40]);
        host.marks.set([0, 25, 50, 100]);
        host.snapToMarks.set(true);
      });

      view.drag(view.control, 30, 33);

      expect(view.values()).toEqual([23, 43]);
    });

    it('works together with minDistance', () => {
      const view = mount((host) => {
        host.range.set(true);
        host.value.set([0, 30]);
        host.minDistance.set(10);
        host.marks.set([0, 25, 50]);
        host.snapToMarks.set(true);
      });

      view.drag(view.thumbs[0], 0, 24);

      // The mark at 25 is only 5 from the high handle: held at 20.
      expect(view.values()).toEqual([20, 30]);
    });

    it('works on reversed and vertical sliders', () => {
      const view = mount((host) => {
        marked(host);
        host.orientation.set('vertical');
      });
      stubRect(view.track, { top: 0, height: 100 });

      view.thumbs[0].dispatchEvent(pointer('pointerdown', 0, 100));
      view.control.dispatchEvent(pointer('pointermove', 0, 76));
      view.control.dispatchEvent(pointer('pointerup', 0, 76));
      view.detect();
      expect(view.values()).toEqual([25]);

      view.host.orientation.set('horizontal');
      view.host.reverse.set(true);
      stubRect(view.track, { left: 0, width: 100 });
      view.detect();
      view.drag(view.thumbs[0], 75, 51);
      expect(view.values()).toEqual([50]);
    });
  });
});
