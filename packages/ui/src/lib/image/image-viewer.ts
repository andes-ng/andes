import {
  computed,
  effect,
  linkedSignal,
  signal,
  untracked,
  type WritableSignal,
} from '@angular/core';

import {
  ANDES_IMAGE_IDENTITY_TRANSFORM,
  clamp,
  isZoomed,
  reboundTransform,
  zoomTransform,
} from './image-transform';
import type {
  AndesImageTransform,
  AndesImageTransformAction,
  AndesImageTransformEvent,
} from './image-types';

/**
 * The viewers' scrim: darker than the dialog scrim (`--andes-color-overlay`), so the picture
 * and the light controls stand out. Override `--andes-image-preview-scrim` to retune it.
 */
export const ANDES_IMAGE_VIEWER_SCRIM =
  'var(--andes-image-preview-scrim, color-mix(in srgb, ' +
  'var(--andes-color-ghost-foreground, #111827) 45%, ' +
  'var(--andes-color-overlay, rgb(15 23 42 / 45%))))';

/** Longest the previous picture may stay while it cross-fades out (the fade is 300ms). */
const LEAVING_TIMEOUT_MS = 400;

/** Movement below this is still a click, not a drag. */
const DRAG_THRESHOLD = 4;
/** Horizontal travel that turns a drag of a fitted image into a previous / next swipe. */
const SWIPE_DISTANCE = 60;
/** Double-click / double-tap zoom target. */
const DOUBLE_CLICK_SCALE = 2;

/** The zoom and pan rules a viewer applies, read at event time. */
export interface AndesImageViewerLimits {
  /** Each zoom step multiplies the scale by `1 + scaleStep`. */
  readonly scaleStep: number;
  readonly minScale: number;
  readonly maxScale: number;
  /** Pan a zoomed image by dragging. */
  readonly movable: boolean;
  /** Zoom with the wheel / trackpad pinch. */
  readonly wheel: boolean;
}

/** What a viewer hands its gesture controller. */
export interface AndesImageViewerHost {
  readonly limits: () => AndesImageViewerLimits;
  /** The box the picture is centred in; its size bounds the pan. */
  readonly stage: () => HTMLElement | null | undefined;
  /** The transformed element (the `<img>` or a custom box), at its laid-out size. */
  readonly image: () => HTMLElement | null | undefined;
  /** Whether a press landed on the empty area around the picture, not on it. */
  readonly isEmptyArea: (event: Event) => boolean;
  readonly rtl: () => boolean;
  /** A committed change, to report as `transformChange`. */
  readonly changed: (event: AndesImageTransformEvent) => void;
  /** A swipe across a fitted picture: `-1` toward the previous image, `1` the next. */
  readonly swipe?: (direction: -1 | 1) => void;
}

/** Whether the click that follows a press should count, and where that press began. */
export interface AndesImageViewerClick {
  /** The press turned into a drag, a pinch or a swipe: the click is not a click. */
  readonly suppressed: boolean;
  /** The press began on the empty area around the picture. */
  readonly pressedOnEmptyArea: boolean;
}

interface Press {
  readonly startX: number;
  readonly startY: number;
  readonly originX: number;
  readonly originY: number;
  readonly onEmptyArea: boolean;
  x: number;
  y: number;
  moved: boolean;
}

interface Pinch {
  readonly distance: number;
  readonly scale: number;
}

/**
 * The gestures and transform rules shared by the image viewers (`andes-image-preview` and
 * `andes-gallery`): button / wheel / keyboard zoom about a focal point, rotate, flip, reset,
 * drag to pan a zoomed picture, double click to zoom, pinch with two fingers, and a swipe
 * across a fitted picture to change image. The pan is always pulled back so the picture
 * never strays off its stage.
 *
 * Plain state, no DOM of its own: the viewer binds its stage's pointer, wheel and dblclick
 * events to the handlers and renders `transform`.
 */
export class AndesImageViewerController {
  readonly dragging = signal(false);
  readonly zoomed = computed(() => isZoomed(this.transform()));
  readonly canPan = computed(() => this.zoomed() && this.host.limits().movable);

  private readonly presses = new Map<number, Press>();
  private pinch: Pinch | null = null;
  private click: AndesImageViewerClick = {
    suppressed: false,
    pressedOnEmptyArea: true,
  };

  constructor(
    /** The transform the viewer renders; often a `linkedSignal` that resets per image. */
    readonly transform: WritableSignal<AndesImageTransform>,
    private readonly host: AndesImageViewerHost,
  ) {}

  zoomIn(action: AndesImageTransformAction = 'zoomIn'): void {
    this.zoomBy(1, action);
  }

  zoomOut(action: AndesImageTransformAction = 'zoomOut'): void {
    this.zoomBy(-1, action);
  }

  /** One zoom step in (`1`) or out (`-1`), about the centre. */
  zoomBy(direction: 1 | -1, action: AndesImageTransformAction): void {
    const { scaleStep } = this.host.limits();
    const scale = this.transform().scale;
    this.zoomAt(
      direction > 0 ? scale * (1 + scaleStep) : scale / (1 + scaleStep),
      action,
    );
  }

  /** Zooms to `scale` (clamped), keeping the point at `focal` (from the centre) still. */
  zoomAt(
    scale: number,
    action: AndesImageTransformAction,
    focal?: { x: number; y: number },
  ): void {
    const { minScale, maxScale } = this.host.limits();
    let next = zoomTransform(
      this.transform(),
      scale,
      minScale,
      maxScale,
      focal,
    );
    if (next.scale <= 1) {
      next = { ...next, x: 0, y: 0 };
    }
    this.commit(this.rebound(next), action);
  }

  /** A quarter turn: positive is clockwise. */
  rotate(direction: 1 | -1): void {
    const transform = this.transform();
    this.commit(
      this.rebound({ ...transform, rotate: transform.rotate + 90 * direction }),
      direction > 0 ? 'rotateRight' : 'rotateLeft',
    );
  }

  /** Mirrors on the horizontal (`'x'`) or vertical (`'y'`) screen axis. */
  flip(axis: 'x' | 'y'): void {
    const transform = this.transform();
    this.commit(
      axis === 'x'
        ? { ...transform, flipX: !transform.flipX }
        : { ...transform, flipY: !transform.flipY },
      axis === 'x' ? 'flipX' : 'flipY',
    );
  }

  /** Back to fit, unrotated, unmirrored. */
  reset(action: AndesImageTransformAction = 'reset'): void {
    this.commit(ANDES_IMAGE_IDENTITY_TRANSFORM, action);
  }

  /** Pans by a distance in px (arrow keys); only a zoomed, movable picture moves. */
  panBy(dx: number, dy: number, action: AndesImageTransformAction): boolean {
    if (!this.canPan()) {
      return false;
    }
    const transform = this.transform();
    this.commit(
      this.rebound({ ...transform, x: transform.x + dx, y: transform.y + dy }),
      action,
    );
    return true;
  }

  /** Re-checks the pan once the picture has its real size (after a load or a resize). */
  settle(): void {
    const transform = this.transform();
    const next = this.rebound(transform);
    if (next !== transform) {
      this.transform.set(next);
    }
  }

  onWheel(event: WheelEvent): void {
    const limits = this.host.limits();
    if (!limits.wheel) {
      return;
    }
    event.preventDefault();
    const delta = event.deltaY * (event.deltaMode === 1 ? 33 : 1);
    // One 100px mouse-wheel notch is half a zoom step; a trackpad pinch (reported as
    // ctrl+wheel with small deltas) is made four times as sensitive.
    const exponent = clamp(-delta / (event.ctrlKey ? 25 : 200), -1, 1);
    const next = this.transform().scale * (1 + limits.scaleStep) ** exponent;
    this.zoomAt(next, 'wheel', this.focalPoint(event));
  }

  onDoubleClick(event: MouseEvent): void {
    event.preventDefault();
    if (this.zoomed()) {
      this.reset('doubleClick');
      return;
    }
    const target = Math.min(this.host.limits().maxScale, DOUBLE_CLICK_SCALE);
    this.zoomAt(target, 'doubleClick', this.focalPoint(event));
  }

  onPointerDown(event: PointerEvent): void {
    if (event.pointerType === 'mouse' && event.button !== 0) {
      return;
    }
    if (this.presses.size >= 2) {
      return;
    }
    const transform = this.transform();
    this.presses.set(event.pointerId, {
      startX: event.clientX,
      startY: event.clientY,
      originX: transform.x,
      originY: transform.y,
      onEmptyArea: this.host.isEmptyArea(event),
      x: event.clientX,
      y: event.clientY,
      moved: false,
    });
    if (this.presses.size === 2) {
      this.startPinch(event);
    }
  }

  onPointerMove(event: PointerEvent): void {
    const press = this.presses.get(event.pointerId);
    if (!press) {
      return;
    }
    press.x = event.clientX;
    press.y = event.clientY;
    if (this.pinch) {
      this.movePinch();
      return;
    }
    const dx = event.clientX - press.startX;
    const dy = event.clientY - press.startY;
    if (!press.moved) {
      if (Math.hypot(dx, dy) < DRAG_THRESHOLD) {
        return;
      }
      press.moved = true;
      this.dragging.set(true);
      this.capture(event);
    }
    if (this.canPan()) {
      this.transform.set({
        ...this.transform(),
        x: press.originX + dx,
        y: press.originY + dy,
      });
    }
  }

  onPointerEnd(event: PointerEvent): void {
    const press = this.presses.get(event.pointerId);
    if (!press) {
      return;
    }
    this.presses.delete(event.pointerId);
    this.release(event);

    if (this.pinch) {
      // The first finger up ends the pinch; the other one must not start a drag midway.
      this.pinch = null;
      this.presses.clear();
      this.dragging.set(false);
      this.click = { suppressed: true, pressedOnEmptyArea: false };
      this.commit(this.rebound(this.transform()), 'pinch', true);
      return;
    }

    this.dragging.set(false);
    this.click = {
      suppressed: press.moved,
      pressedOnEmptyArea: press.onEmptyArea,
    };
    if (!press.moved) {
      return;
    }
    if (this.canPan()) {
      this.commit(this.rebound(this.transform()), 'move', true);
      return;
    }
    if (event.type !== 'pointerup' || this.zoomed() || !this.host.swipe) {
      return;
    }
    const dx = event.clientX - press.startX;
    const dy = event.clientY - press.startY;
    if (Math.abs(dx) >= SWIPE_DISTANCE && Math.abs(dx) > Math.abs(dy) * 1.5) {
      this.host.swipe(dx > 0 !== this.host.rtl() ? -1 : 1);
    }
  }

  /**
   * Reads, and forgets, how the press before a click went, so the viewer can tell a real
   * click from the end of a drag.
   */
  takeClick(): AndesImageViewerClick {
    const click = this.click;
    this.click = { suppressed: false, pressedOnEmptyArea: true };
    return click;
  }

  /** Pointer position measured from the stage centre. */
  focalPoint(point: { clientX: number; clientY: number }): {
    x: number;
    y: number;
  } {
    const stage = this.host.stage();
    if (!stage) {
      return { x: 0, y: 0 };
    }
    const rect = stage.getBoundingClientRect();
    return {
      x: point.clientX - (rect.left + rect.width / 2),
      y: point.clientY - (rect.top + rect.height / 2),
    };
  }

  private startPinch(event: PointerEvent): void {
    const [a, b] = [...this.presses.values()];
    const distance = Math.hypot(a.x - b.x, a.y - b.y);
    if (!distance) {
      return;
    }
    this.pinch = { distance, scale: this.transform().scale };
    this.dragging.set(true);
    this.capture(event);
  }

  private movePinch(): void {
    const pinch = this.pinch;
    const [a, b] = [...this.presses.values()];
    if (!pinch || !a || !b) {
      return;
    }
    const distance = Math.hypot(a.x - b.x, a.y - b.y);
    const { minScale, maxScale } = this.host.limits();
    let next = zoomTransform(
      this.transform(),
      (pinch.scale * distance) / pinch.distance,
      minScale,
      maxScale,
      this.focalPoint({
        clientX: (a.x + b.x) / 2,
        clientY: (a.y + b.y) / 2,
      }),
    );
    if (next.scale <= 1) {
      next = { ...next, x: 0, y: 0 };
    }
    // Live while the fingers move; reported once, when they lift.
    this.transform.set(next);
  }

  private rebound(transform: AndesImageTransform): AndesImageTransform {
    const stage = this.host.stage();
    const image = this.host.image();
    if (!stage || !image) {
      return transform;
    }
    return reboundTransform(
      transform,
      { width: stage.clientWidth, height: stage.clientHeight },
      { width: image.offsetWidth, height: image.offsetHeight },
    );
  }

  /**
   * Stores and reports a change. A gesture that already moved the picture live reports its
   * end even when the final transform is the one on screen (`force`).
   */
  private commit(
    transform: AndesImageTransform,
    action: AndesImageTransformAction,
    force = false,
  ): void {
    if (transform === this.transform() && !force) {
      return;
    }
    this.transform.set(transform);
    this.host.changed({ transform, action });
  }

  private capture(event: PointerEvent): void {
    // Capture only once it is a real drag: capturing on press would retarget the click that
    // follows a plain press onto the stage.
    try {
      (event.currentTarget as HTMLElement | null)?.setPointerCapture(
        event.pointerId,
      );
    } catch {
      // Not every environment can capture; the drag still works while over the stage.
    }
  }

  private release(event: PointerEvent): void {
    try {
      (event.currentTarget as HTMLElement | null)?.releasePointerCapture(
        event.pointerId,
      );
    } catch {
      // Nothing was captured.
    }
  }
}

/** Whether the user asked the system for reduced motion. */
export function andesPrefersReducedMotion(document: Document): boolean {
  const view = document.defaultView;
  return (
    typeof view?.matchMedia === 'function' &&
    view.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/** Best-effort file name for a download: `name`, else the last URL segment. */
export function andesImageFileName(url: string, name?: string): string {
  if (name) {
    return name;
  }
  if (url.startsWith('data:')) {
    const type = /^data:image\/([a-z0-9.+-]+)/i.exec(url)?.[1] ?? 'png';
    return `image.${type === 'svg+xml' ? 'svg' : type}`;
  }
  const path = url.split(/[?#]/)[0];
  const last = path.slice(path.lastIndexOf('/') + 1);
  return last || 'image';
}

/** Saves `url` as `name`, through a blob where the browser allows it. */
export async function andesDownloadImage(
  document: Document,
  url: string,
  name: string,
): Promise<void> {
  const clickAnchor = (href: string) => {
    const anchor = document.createElement('a');
    anchor.href = href;
    anchor.download = name;
    anchor.rel = 'noopener';
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  };
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(String(response.status));
    }
    const objectUrl = URL.createObjectURL(await response.blob());
    clickAnchor(objectUrl);
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  } catch {
    // Cross-origin without CORS: a plain download link is the best that is left.
    clickAnchor(url);
  }
}

/** The picture that is fading out while the next one fades in. */
export interface AndesLeavingFrame {
  readonly key: number;
  readonly src: string;
  readonly alt: string;
  readonly css: string;
}

/** What the cross-fade compares between two renders. */
export interface AndesFrameSource {
  /** Index of the shown picture. */
  readonly key: number;
  /** Whether the viewer is showing at all. */
  readonly open: boolean;
  readonly src: string | null;
  readonly alt: string;
  /** The shown picture's CSS transform. */
  readonly css: string;
}

/**
 * The previous picture while it fades out under the next one, for a viewer to render beside
 * the current one. It keeps the transform it had, so a zoomed picture fades where it was
 * rather than jumping back to fit first. Set it to `null` on the frame's `animationend`; a
 * timer drops it anyway if the animation never runs. Call it in an injection context.
 */
export function andesCrossFade(
  source: () => AndesFrameSource,
  reducedMotion: () => boolean,
): WritableSignal<AndesLeavingFrame | null> {
  const leaving = linkedSignal<AndesFrameSource, AndesLeavingFrame | null>({
    source,
    computation: (next, previous) => {
      if (!previous) {
        return null;
      }
      const before = previous.source;
      if (before.key === next.key) {
        return next.open ? previous.value : null;
      }
      if (!before.open || !next.open || !before.src || reducedMotion()) {
        return null;
      }
      return {
        key: before.key,
        src: before.src,
        alt: before.alt,
        css: before.css,
      };
    },
  });

  effect((onCleanup) => {
    const frame = leaving();
    if (!frame) {
      return;
    }
    const timer = setTimeout(() => {
      if (untracked(leaving) === frame) {
        leaving.set(null);
      }
    }, LEAVING_TIMEOUT_MS);
    onCleanup(() => clearTimeout(timer));
  });

  return leaving;
}
