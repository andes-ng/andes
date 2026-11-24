import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  input,
  untracked,
  viewChild,
} from '@angular/core';

/** The whole chart as flat rectangles, in canvas pixels. */
export interface AndesOrgChartOverview {
  readonly width: number;
  readonly height: number;
  readonly left: Float64Array;
  readonly top: Float64Array;
  readonly right: Float64Array;
  readonly bottom: Float64Array;
}

/** The part of the canvas the viewport shows, in canvas pixels. */
export interface AndesOrgChartSeenArea {
  readonly left: number;
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
}

/** What the overview needs from the chart it draws. @internal */
export interface AndesOrgChartOverviewSource {
  readonly overview: () => AndesOrgChartOverview;
  readonly seenAreaNow: () => AndesOrgChartSeenArea;
  /** Pans so that the canvas point is at the center of the viewport. */
  readonly centerOnCanvas: (x: number, y: number) => void;
}

/** Longest side of the overview, in CSS pixels. */
const MAX_WIDTH = 192;
const MAX_HEIGHT = 128;

/**
 * The overview of the whole chart: every card as a small block, with a frame on the part the
 * viewport shows. A press or a drag on it moves the view. It is a pointer shortcut like the
 * card toggle (keyboard users pan with the tree and the zoom keys), so it is hidden from
 * assistive technology. Internal to the chart.
 *
 * @internal
 */
@Component({
  selector: 'andes-org-chart-minimap',
  templateUrl: './org-chart-minimap.html',
  styleUrl: './org-chart-minimap.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'data-slot': 'org-chart-minimap',
    'aria-hidden': 'true',
    '(pointerdown)': 'onPointerDown($event)',
    '(pointermove)': 'onPointerMove($event)',
    '(pointerup)': 'onPointerUp($event)',
    '(pointercancel)': 'onPointerUp($event)',
  },
})
export class AndesOrgChartMinimap {
  readonly chart = input.required<AndesOrgChartOverviewSource>();

  private readonly canvasRef =
    viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private readonly element = viewChild.required<ElementRef<HTMLElement>>('map');
  private pressed = false;

  /** CSS pixels per canvas pixel, so the whole chart fits the box. */
  private readonly scale = computed(() => {
    const { width, height } = this.chart().overview();
    return Math.min(MAX_WIDTH / (width || 1), MAX_HEIGHT / (height || 1));
  });

  protected readonly boxWidth = computed(() =>
    Math.max(Math.round(this.chart().overview().width * this.scale()), 1),
  );
  protected readonly boxHeight = computed(() =>
    Math.max(Math.round(this.chart().overview().height * this.scale()), 1),
  );

  /** The frame over the part of the chart in view, clipped to the overview. */
  protected readonly frame = computed(() => {
    const seen = this.chart().seenAreaNow();
    const scale = this.scale();
    const width = this.boxWidth();
    const height = this.boxHeight();
    const left = Math.min(Math.max(seen.left * scale, 0), width);
    const top = Math.min(Math.max(seen.top * scale, 0), height);
    const right = Math.min(Math.max(seen.right * scale, 0), width);
    const bottom = Math.min(Math.max(seen.bottom * scale, 0), height);
    return {
      left,
      top,
      width: Math.max(right - left, 2),
      height: Math.max(bottom - top, 2),
    };
  });

  constructor() {
    effect(() => {
      const overview = this.chart().overview();
      const scale = this.scale();
      const width = this.boxWidth();
      const height = this.boxHeight();
      const canvas = this.canvasRef().nativeElement;
      untracked(() => this.draw(canvas, overview, scale, width, height));
    });
  }

  private draw(
    canvas: HTMLCanvasElement,
    overview: AndesOrgChartOverview,
    scale: number,
    width: number,
    height: number,
  ): void {
    const ratio =
      typeof window === 'undefined'
        ? 1
        : Math.min(Math.max(window.devicePixelRatio || 1, 1), 2);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    let context: CanvasRenderingContext2D | null;
    try {
      context = canvas.getContext('2d');
    } catch {
      return;
    }
    if (!context) {
      return;
    }
    context.scale(ratio, ratio);
    context.clearRect(0, 0, width, height);
    // The block color is the element's own text color, so the theme decides it.
    context.fillStyle = getComputedStyle(canvas).color || '#71717a';
    context.globalAlpha = 0.5;
    const { left, top, right, bottom } = overview;
    for (let index = 0; index < left.length; index++) {
      context.fillRect(
        left[index] * scale,
        top[index] * scale,
        Math.max((right[index] - left[index]) * scale, 1),
        Math.max((bottom[index] - top[index]) * scale, 1),
      );
    }
  }

  private moveTo(event: PointerEvent): void {
    const rect = this.element().nativeElement.getBoundingClientRect();
    const scale = this.scale();
    if (!rect.width || !scale) {
      return;
    }
    this.chart().centerOnCanvas(
      (event.clientX - rect.left) / scale,
      (event.clientY - rect.top) / scale,
    );
  }

  protected onPointerDown(event: PointerEvent): void {
    if (event.button !== 0 && event.pointerType === 'mouse') {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    this.pressed = true;
    (event.currentTarget as Element | null)?.setPointerCapture?.(
      event.pointerId,
    );
    this.moveTo(event);
  }

  protected onPointerMove(event: PointerEvent): void {
    if (this.pressed) {
      this.moveTo(event);
    }
  }

  protected onPointerUp(event: PointerEvent): void {
    this.pressed = false;
    (event.currentTarget as Element | null)?.releasePointerCapture?.(
      event.pointerId,
    );
  }
}
