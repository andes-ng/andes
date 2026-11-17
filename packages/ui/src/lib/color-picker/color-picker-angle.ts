import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  output,
} from '@angular/core';

import { wrapHue } from './color-math';

/** Arrow keys step by 1 degree; Shift, `PageUp` and `PageDown` by this. */
const BIG_STEP = 15;

/**
 * The angle dial of the gradient editor: a small circle with a needle pointing the way the
 * gradient runs (0 up, 90 right, as in CSS).
 *
 * It is a `role="slider"` from 0 to 360: Right/Up turn it clockwise by 1 degree, Left/Down
 * back, Shift (or `PageUp`/`PageDown`) by 15, `Home` to 0 and `End` to 360; the arrows wrap
 * around. A pointer press or drag (pointer-captured) points the needle at the pointer, in
 * 15-degree steps while Shift is held. It is a picture of a direction, the same in
 * right-to-left pages.
 *
 * @internal Part of the colour panel's template.
 */
@Component({
  selector: 'andes-color-angle',
  template: `<span class="andes-color-angle__needle"></span>`,
  styleUrl: './color-picker-angle.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'slider',
    'data-slot': 'color-picker-angle',
    'aria-valuemin': '0',
    'aria-valuemax': '360',
    '[attr.aria-label]': 'label()',
    '[attr.aria-valuenow]': 'rounded()',
    '[attr.aria-valuetext]': 'rounded() + "°"',
    '[attr.aria-disabled]': 'disabled() ? "true" : null',
    '[attr.aria-readonly]': 'readonly() ? "true" : null',
    '[attr.data-disabled]': 'disabled() ? "" : null',
    '[attr.data-readonly]': 'readonly() ? "" : null',
    '[attr.tabindex]': 'disabled() ? null : 0',
    '[style.--andes-color-angle]': 'rounded() + "deg"',
    '(keydown)': 'onKeydown($event)',
    '(pointerdown)': 'onPointerDown($event)',
    '(pointermove)': 'onPointerMove($event)',
    '(pointerup)': 'onPointerUp($event)',
    '(pointercancel)': 'onPointerUp($event)',
  },
})
export class AndesColorAngle {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  /** The angle in degrees, 0-360. */
  readonly value = input.required<number>();
  readonly label = input.required<string>();
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly readonly = input(false, { transform: booleanAttribute });

  /** Every change, while dragging or on the keyboard. */
  readonly valueChange = output<number>();
  /** The end of a gesture: pointer released, or a key press. */
  readonly commit = output<number>();

  protected readonly rounded = computed(() => Math.round(this.value()));

  private dragging = false;
  private last = 0;

  protected onKeydown(event: KeyboardEvent): void {
    if (
      this.disabled() ||
      this.readonly() ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey
    ) {
      return;
    }
    const step = event.shiftKey ? BIG_STEP : 1;
    const value = this.rounded();
    let next: number;
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowUp':
        next = wrapHue(value + step);
        break;
      case 'ArrowLeft':
      case 'ArrowDown':
        next = wrapHue(value - step);
        break;
      case 'PageUp':
        next = wrapHue(value + BIG_STEP);
        break;
      case 'PageDown':
        next = wrapHue(value - BIG_STEP);
        break;
      case 'Home':
        next = 0;
        break;
      case 'End':
        next = 360;
        break;
      default:
        return;
    }
    event.preventDefault();
    this.valueChange.emit(next);
    this.commit.emit(next);
  }

  protected onPointerDown(event: PointerEvent): void {
    if (this.disabled() || this.readonly() || (event.button ?? 0) !== 0) {
      return;
    }
    event.preventDefault();
    const element = this.host.nativeElement;
    element.focus({ preventScroll: true });
    try {
      element.setPointerCapture(event.pointerId);
    } catch {
      // Synthetic pointers cannot be captured.
    }
    this.dragging = true;
    this.pointAt(event);
  }

  protected onPointerMove(event: PointerEvent): void {
    if (this.dragging) {
      this.pointAt(event);
    }
  }

  protected onPointerUp(event: PointerEvent): void {
    if (!this.dragging) {
      return;
    }
    this.dragging = false;
    try {
      this.host.nativeElement.releasePointerCapture(event.pointerId);
    } catch {
      // Nothing was captured.
    }
    this.commit.emit(this.last);
  }

  private pointAt(event: PointerEvent): void {
    const rect = this.host.nativeElement.getBoundingClientRect();
    const dx = event.clientX - (rect.left + rect.width / 2);
    const dy = event.clientY - (rect.top + rect.height / 2);
    if (dx === 0 && dy === 0) {
      return;
    }
    // Clockwise from straight up, as CSS gradient angles run.
    let angle = wrapHue((Math.atan2(dx, -dy) * 180) / Math.PI);
    if (event.shiftKey) {
      angle = wrapHue(Math.round(angle / BIG_STEP) * BIG_STEP);
    }
    this.last = Math.round(angle) % 360;
    this.valueChange.emit(this.last);
  }
}
