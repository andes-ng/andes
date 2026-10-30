import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  Injector,
  input,
} from '@angular/core';

import { clamp } from './color-math';
import type {
  AndesColorPanelController,
  AndesGradientStopState,
} from './color-picker-panel-controller';

/** Stop handle width in px; the track is inset by half of it on each side, like the sliders. */
const HANDLE_SIZE = 16;

/**
 * The gradient bar of the colour panel in `mode="gradient"`: the gradient drawn left to right
 * with a handle per colour stop.
 *
 * Every stop is a `role="slider"` (0-100, its position) in a labelled group, one Tab stop
 * each; focusing or pressing a stop selects it, and the panel's area, sliders and fields then
 * edit its colour. Arrow keys move it by 1% (10% with Shift, or `PageUp`/`PageDown`),
 * `Home`/`End` move it to the ends, and `Delete`/`Backspace` remove it while more than two
 * remain. A pointer drags it (pointer-captured); a double click on the bar adds a stop there,
 * coloured as the gradient is at that point.
 *
 * Like the sliders, it is a picture of the gradient line and stays left to right in
 * right-to-left pages.
 *
 * @internal Part of the colour panel's template.
 */
@Component({
  selector: 'andes-color-gradient-bar',
  template: `
    <span
      class="andes-color-gradient__rail"
      [style.background-image]="
        controller().gradientBarCss() + ', var(--_checker)'
      "
      (pointerdown)="onRailPointerDown($event)"
      (dblclick)="onRailDoubleClick($event)"
    ></span>
    <span
      class="andes-color-gradient__stops"
      role="group"
      [attr.aria-label]="controller().text().gradientStops"
    >
      @for (stop of controller().stops(); track stop.id) {
        <span
          role="slider"
          class="andes-color-gradient__stop"
          data-slot="color-picker-gradient-stop"
          aria-orientation="horizontal"
          aria-valuemin="0"
          aria-valuemax="100"
          [attr.aria-label]="controller().text().gradient"
          [attr.aria-valuenow]="round(stop.position)"
          [attr.aria-valuetext]="controller().stopValueText(stop)"
          [attr.aria-disabled]="controller().isDisabled() ? 'true' : null"
          [attr.aria-readonly]="controller().isReadOnly() ? 'true' : null"
          [attr.tabindex]="controller().isDisabled() ? null : 0"
          [attr.data-active]="
            stop.id === controller().activeStop().id ? '' : null
          "
          [attr.data-stop-id]="stop.id"
          [style.--andes-color-gradient-position]="stop.position / 100"
          [style.--andes-color-gradient-stop]="stop.color.toRgbString()"
          (focus)="controller().selectStop(stop.id)"
          (keydown)="onStopKeydown($event, stop)"
          (pointerdown)="onStopPointerDown($event, stop)"
          (pointermove)="onStopPointerMove($event, stop)"
          (pointerup)="onStopPointerUp($event, stop)"
          (pointercancel)="onStopPointerUp($event, stop)"
          (dblclick)="$event.stopPropagation()"
        ></span>
      }
    </span>
  `,
  styleUrl: './color-picker-gradient.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'data-slot': 'color-picker-gradient-bar',
    '[attr.data-disabled]': 'controller().isDisabled() ? "" : null',
    '[attr.data-readonly]': 'controller().isReadOnly() ? "" : null',
  },
})
export class AndesColorGradientBar {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);

  readonly controller = input.required<AndesColorPanelController>();

  private draggingId: number | null = null;
  /** Where on the handle it was grabbed (px from its centre), so it does not jump there. */
  private grabOffset = 0;

  protected round(value: number): number {
    return Math.round(value);
  }

  protected onStopKeydown(
    event: KeyboardEvent,
    stop: AndesGradientStopState,
  ): void {
    const controller = this.controller();
    if (
      !controller.editable() ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey
    ) {
      return;
    }
    const step = event.shiftKey ? 10 : 1;
    let next: number;
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowUp':
        next = stop.position + step;
        break;
      case 'ArrowLeft':
      case 'ArrowDown':
        next = stop.position - step;
        break;
      case 'PageUp':
        next = stop.position + 10;
        break;
      case 'PageDown':
        next = stop.position - 10;
        break;
      case 'Home':
        next = 0;
        break;
      case 'End':
        next = 100;
        break;
      case 'Delete':
      case 'Backspace':
        event.preventDefault();
        if (controller.stops().length > 2) {
          controller.removeStop(stop.id);
          this.focusActiveStop();
        }
        return;
      default:
        return;
    }
    event.preventDefault();
    controller.moveStop(stop.id, clamp(next, 0, 100), true);
  }

  protected onStopPointerDown(
    event: PointerEvent,
    stop: AndesGradientStopState,
  ): void {
    const controller = this.controller();
    if (controller.isDisabled() || (event.button ?? 0) !== 0) {
      return;
    }
    // Keeps the press from starting a text selection; the stop takes focus (and is selected).
    event.preventDefault();
    event.stopPropagation();
    const element = event.currentTarget as HTMLElement;
    element.focus({ preventScroll: true });
    controller.selectStop(stop.id);
    if (!controller.editable()) {
      return;
    }
    try {
      element.setPointerCapture(event.pointerId);
    } catch {
      // Synthetic pointers cannot be captured; dragging still works over the bar.
    }
    const rect = element.getBoundingClientRect();
    this.grabOffset = rect.width
      ? event.clientX - (rect.left + rect.width / 2)
      : 0;
    this.draggingId = stop.id;
  }

  protected onStopPointerMove(
    event: PointerEvent,
    stop: AndesGradientStopState,
  ): void {
    if (this.draggingId === stop.id) {
      this.controller().moveStop(
        stop.id,
        this.positionAt(event.clientX - this.grabOffset),
      );
    }
  }

  protected onStopPointerUp(
    event: PointerEvent,
    stop: AndesGradientStopState,
  ): void {
    if (this.draggingId !== stop.id) {
      return;
    }
    this.draggingId = null;
    try {
      (event.currentTarget as HTMLElement).releasePointerCapture(
        event.pointerId,
      );
    } catch {
      // Nothing was captured.
    }
    // A press without a drag only selects the stop; a drag ends here.
    this.controller().completeEdit();
  }

  /** A press on the bar itself does not start a text selection. */
  protected onRailPointerDown(event: PointerEvent): void {
    if ((event.button ?? 0) === 0) {
      event.preventDefault();
    }
  }

  protected onRailDoubleClick(event: MouseEvent): void {
    const controller = this.controller();
    if (!controller.editable()) {
      return;
    }
    controller.addStop(this.positionAt(event.clientX));
    this.focusActiveStop();
  }

  /** Percent along the bar under `clientX`, the track inset by half a handle. */
  private positionAt(clientX: number): number {
    const rect = this.host.nativeElement.getBoundingClientRect();
    const span = rect.width - HANDLE_SIZE;
    return span > 0
      ? clamp(((clientX - rect.left - HANDLE_SIZE / 2) / span) * 100, 0, 100)
      : 0;
  }

  /** After a stop was added or removed, focus follows the selection. */
  private focusActiveStop(): void {
    afterNextRender(
      () => {
        const id = this.controller().activeStop().id;
        this.host.nativeElement
          .querySelector<HTMLElement>(`[data-stop-id="${id}"]`)
          ?.focus({ preventScroll: true });
      },
      { injector: this.injector },
    );
  }
}
