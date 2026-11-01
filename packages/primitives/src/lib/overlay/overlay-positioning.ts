import { DOCUMENT, type Injector } from '@angular/core';
import {
  createFlexibleConnectedPositionStrategy,
  createGlobalPositionStrategy,
  ViewportRuler,
  type ConnectedPosition,
  type FlexibleConnectedPositionStrategy,
  type GlobalPositionStrategy,
  type OverlayRef,
  type PositionStrategy,
} from '@angular/cdk/overlay';
import { Subscription } from 'rxjs';

import {
  type AndesOverlayAlign,
  type AndesOverlayAnchoredPositioning,
  type AndesOverlayConfig,
  type AndesOverlayEdge,
  type AndesOverlayPositioning,
  type AndesOverlaySide,
} from './overlay-config';

const OPPOSITE_SIDE: Readonly<Record<AndesOverlaySide, AndesOverlaySide>> = {
  top: 'bottom',
  bottom: 'top',
  left: 'right',
  right: 'left',
};

const CROSS_SIDES: Readonly<
  Record<AndesOverlaySide, readonly AndesOverlaySide[]>
> = {
  top: ['right', 'left'],
  bottom: ['right', 'left'],
  left: ['bottom', 'top'],
  right: ['bottom', 'top'],
};

/**
 * Translates one andes-ng `side`/`align` pair into a CDK `ConnectedPosition`.
 *
 * `sideOffset` always pushes the overlay *away* from the anchor, so its sign
 * depends on the side; `alignOffset` shifts along the perpendicular axis.
 */
export function andesConnectedPosition(
  side: AndesOverlaySide,
  align: AndesOverlayAlign,
  sideOffset: number,
  alignOffset: number,
): ConnectedPosition {
  const alignToX = { start: 'start', center: 'center', end: 'end' } as const;
  const alignToY = { start: 'top', center: 'center', end: 'bottom' } as const;

  switch (side) {
    case 'bottom':
      return {
        originX: alignToX[align],
        originY: 'bottom',
        overlayX: alignToX[align],
        overlayY: 'top',
        offsetX: alignOffset,
        offsetY: sideOffset,
      };
    case 'top':
      return {
        originX: alignToX[align],
        originY: 'top',
        overlayX: alignToX[align],
        overlayY: 'bottom',
        offsetX: alignOffset,
        offsetY: -sideOffset,
      };
    case 'right':
      return {
        originX: 'end',
        originY: alignToY[align],
        overlayX: 'start',
        overlayY: alignToY[align],
        offsetX: sideOffset,
        offsetY: alignOffset,
      };
    case 'left':
      return {
        originX: 'start',
        originY: alignToY[align],
        overlayX: 'end',
        overlayY: alignToY[align],
        offsetX: -sideOffset,
        offsetY: alignOffset,
      };
  }
}

/**
 * The preferred position first, then the fallbacks CDK walks when it does not fit:
 * the opposite side (a flip), then - unless `crossSideFallback` is off - the two
 * perpendicular sides (a last resort before CDK falls back to pushing the overlay into
 * view).
 */
export function andesConnectedPositions(
  side: AndesOverlaySide,
  align: AndesOverlayAlign,
  sideOffset: number,
  alignOffset: number,
  flip: boolean,
  crossSideFallback = true,
): ConnectedPosition[] {
  const build = (candidate: AndesOverlaySide) =>
    andesConnectedPosition(candidate, align, sideOffset, alignOffset);

  if (!flip) {
    return [build(side)];
  }

  return [
    build(side),
    build(OPPOSITE_SIDE[side]),
    ...(crossSideFallback ? CROSS_SIDES[side].map(build) : []),
  ];
}

function applyEdge(
  strategy: GlobalPositionStrategy,
  edge: AndesOverlayEdge,
): GlobalPositionStrategy {
  switch (edge) {
    case 'left':
      return strategy.top('0').left('0');
    case 'right':
      return strategy.top('0').right('0');
    case 'top':
      return strategy.top('0').left('0');
    case 'bottom':
      return strategy.bottom('0').left('0');
  }
}

/** A box in viewport (client) coordinates. */
export interface AndesClientRect {
  readonly top: number;
  readonly bottom: number;
  readonly left: number;
  readonly right: number;
}

/**
 * The ancestors of `element` that clip what overflows them (`overflow` other than
 * `visible` on either axis): a scrolling list, a dialog body, a sidebar. The anchor can
 * only be seen inside all of them, and inside the viewport.
 */
export function andesClippingAncestors(element: HTMLElement): HTMLElement[] {
  const document = element.ownerDocument;
  const view = document.defaultView;
  if (!view) {
    return [];
  }
  const ancestors: HTMLElement[] = [];
  for (
    let parent = element.parentElement;
    parent && parent !== document.body && parent !== document.documentElement;
    parent = parent.parentElement
  ) {
    const { overflow, overflowX, overflowY } = view.getComputedStyle(parent);
    if ([overflow, overflowX, overflowY].some(clipsOverflow)) {
      ancestors.push(parent);
    }
  }
  return ancestors;
}

function clipsOverflow(overflow: string): boolean {
  return overflow !== '' && overflow !== 'visible';
}

/**
 * Whether an anchor is still at least partly visible: it overlaps the viewport and every
 * clipping ancestor. An anchor that is not laid out (zero width and height, e.g.
 * `display: none`) has nothing to measure and counts as visible, so the overlay keeps
 * the regular collision handling.
 */
export function andesIsAnchorInView(
  anchor: AndesClientRect,
  viewport: AndesClientRect,
  clips: readonly AndesClientRect[] = [],
): boolean {
  if (anchor.right - anchor.left === 0 && anchor.bottom - anchor.top === 0) {
    return true;
  }
  return [viewport, ...clips].every(
    (clip) =>
      anchor.bottom > clip.top &&
      anchor.top < clip.bottom &&
      anchor.right > clip.left &&
      anchor.left < clip.right,
  );
}

/**
 * Horizontal px to move a pane by to keep it inside the viewport's side edges, with the
 * same bounds CDK's push uses: `margin` from the left, `2 * margin` from the right edge
 * of a viewport `viewportWidth` wide. A pane wider than that only has its start kept
 * on screen. `0` when nothing needs to move.
 */
export function andesHorizontalShift(
  pane: Pick<AndesClientRect, 'left' | 'right'>,
  viewportWidth: number,
  margin: number,
): number {
  const width = pane.right - pane.left;
  const room = viewportWidth - 2 * margin;
  const overflowLeft = Math.max(margin - pane.left, 0);
  if (width > room || overflowLeft > 0) {
    return overflowLeft;
  }
  const overflowRight = Math.max(pane.left + width - room, 0);
  return overflowRight > 0 ? -overflowRight : 0;
}

/** The anchored positioning with every default filled in. */
type ResolvedAnchoredPositioning = Required<
  Omit<AndesOverlayAnchoredPositioning, 'kind' | 'matchAnchorWidth'>
>;

/**
 * Anchored positioning on top of CDK's flexible connected strategy, attached to its
 * anchor the way a page element is.
 *
 * While the anchor is at least partly visible the CDK strategy does all the work: flip,
 * shrink to the room (`flexibleDimensions`) and push the pane into the viewport. Once the
 * anchor has scrolled out of sight (off the viewport, or out of a clipping ancestor),
 * pushing would pin the pane to the viewport edge over unrelated content, so the pane
 * instead stays on the side it was on and leaves together with its anchor. Only the
 * horizontal containment is kept, while the anchor is still within the viewport's width,
 * so a pane near the left or right edge does not jump sideways as it scrolls away.
 *
 * Push on/off needs a fresh CDK strategy: CDK keeps its "pushed" state across `apply()`
 * calls when push is turned off, so the switch swaps the inner strategy instead.
 */
class AndesAnchoredPositionStrategy implements PositionStrategy {
  private readonly viewportRuler: ViewportRuler;
  private readonly document: Document;
  private readonly positions: ConnectedPosition[];
  private readonly followsVisibility: boolean;
  private inner: FlexibleConnectedPositionStrategy;
  private overlayRef: OverlayRef | null = null;
  private clippingAncestors: HTMLElement[] = [];
  private anchorInView = true;
  private lastPosition: ConnectedPosition | null = null;
  private innerSubscription = new Subscription();
  private resizeSubscription = new Subscription();

  constructor(
    private readonly injector: Injector,
    private readonly anchor: HTMLElement,
    private readonly positioning: ResolvedAnchoredPositioning,
  ) {
    this.viewportRuler = injector.get(ViewportRuler);
    this.document = injector.get(DOCUMENT);
    const { side, align, sideOffset, alignOffset, flip, crossSideFallback } =
      positioning;
    this.positions = andesConnectedPositions(
      side,
      align,
      sideOffset,
      alignOffset,
      flip,
      crossSideFallback,
    );
    // Without push there is nothing to turn off, and a locked position re-applies its
    // first push amount, which already moves with the anchor.
    this.followsVisibility = positioning.shift && !positioning.lockPosition;
    this.inner = this.createInner();
  }

  attach(overlayRef: OverlayRef): void {
    this.overlayRef = overlayRef;
    this.clippingAncestors = this.followsVisibility
      ? andesClippingAncestors(this.anchor)
      : [];
    this.inner.attach(overlayRef);
    this.resizeSubscription.unsubscribe();
    // The inner strategy re-applies itself on resize; this re-evaluates the anchor's
    // visibility and the horizontal containment after it.
    this.resizeSubscription = this.followsVisibility
      ? this.viewportRuler.change().subscribe(() => this.apply())
      : new Subscription();
  }

  apply(): void {
    const inView = this.measureAnchorInView();
    if (inView !== this.anchorInView) {
      this.anchorInView = inView;
      this.replaceInner();
    }
    this.inner.apply();
    if (!inView) {
      this.containHorizontally();
    }
  }

  detach(): void {
    this.resizeSubscription.unsubscribe();
    this.inner.detach();
  }

  dispose(): void {
    this.resizeSubscription.unsubscribe();
    this.innerSubscription.unsubscribe();
    this.inner.dispose();
    this.overlayRef = null;
  }

  private createInner(): FlexibleConnectedPositionStrategy {
    const { shift, viewportMargin, flexibleDimensions, lockPosition } =
      this.positioning;
    const leaving = !this.anchorInView;
    // Out of view the pane keeps the side it was on: a flip now would bring it back
    // into the viewport on the anchor's far side, away from where it scrolled off.
    const positions =
      leaving && this.lastPosition ? [this.lastPosition] : this.positions;
    const strategy = createFlexibleConnectedPositionStrategy(
      this.injector,
      this.anchor,
    )
      .withPositions(positions)
      .withPush(shift && !leaving)
      .withViewportMargin(viewportMargin)
      .withFlexibleDimensions(flexibleDimensions)
      .withGrowAfterOpen(false)
      .withLockedPosition(lockPosition);

    this.innerSubscription.unsubscribe();
    this.innerSubscription = this.followsVisibility
      ? strategy.positionChanges.subscribe((change) => {
          this.lastPosition = change.connectionPair;
        })
      : new Subscription();
    return strategy;
  }

  private replaceInner(): void {
    this.inner.dispose();
    this.inner = this.createInner();
    if (this.overlayRef) {
      this.inner.attach(this.overlayRef);
    }
  }

  private measureAnchorInView(): boolean {
    if (!this.followsVisibility) {
      return true;
    }
    const { clientWidth, clientHeight } = this.document.documentElement;
    return andesIsAnchorInView(
      this.anchor.getBoundingClientRect(),
      { top: 0, left: 0, right: clientWidth, bottom: clientHeight },
      this.clippingAncestors.map((ancestor) =>
        ancestor.getBoundingClientRect(),
      ),
    );
  }

  /**
   * Keeps the pane inside the viewport's side edges while it leaves through the top or
   * bottom. An anchor that left sideways takes its pane along instead.
   */
  private containHorizontally(): void {
    const pane = this.overlayRef?.overlayElement;
    if (!pane) {
      return;
    }
    // The viewport width CDK measures against, without a classic vertical scrollbar.
    const width = this.document.documentElement.clientWidth;
    const anchor = this.anchor.getBoundingClientRect();
    if (anchor.right <= 0 || anchor.left >= width) {
      return;
    }
    const shift = andesHorizontalShift(
      pane.getBoundingClientRect(),
      width,
      this.positioning.viewportMargin,
    );
    if (shift !== 0) {
      // CDK rewrites the pane's `transform` on every apply, so this never accumulates.
      pane.style.transform =
        `${pane.style.transform} translateX(${shift}px)`.trim();
    }
  }
}

/**
 * Builds the CDK position strategy for a config. Anchored positioning needs the
 * anchor element; without one it degrades to centered rather than throwing, so a
 * Popover whose trigger has not attached yet still renders somewhere sane.
 */
export function createAndesPositionStrategy(
  injector: Injector,
  positioning: AndesOverlayPositioning,
  anchor: HTMLElement | null,
): PositionStrategy {
  if (positioning.kind === 'anchored' && anchor) {
    const {
      side = 'bottom',
      align = 'center',
      sideOffset = 0,
      alignOffset = 0,
      flip = true,
      crossSideFallback = true,
      shift = true,
      flexibleDimensions = false,
      viewportMargin = 8,
      lockPosition = false,
    } = positioning;

    return new AndesAnchoredPositionStrategy(injector, anchor, {
      side,
      align,
      sideOffset,
      alignOffset,
      flip,
      crossSideFallback,
      shift,
      flexibleDimensions,
      viewportMargin,
      lockPosition,
    });
  }

  const strategy = createGlobalPositionStrategy(injector);

  if (positioning.kind === 'edge') {
    return applyEdge(strategy, positioning.edge ?? 'right');
  }

  return strategy.centerHorizontally().centerVertically();
}

/**
 * Sizing implied by the positioning, before the consumer's explicit `size` wins.
 * An edge-anchored panel spans the edge it is pinned to; nothing else implies a size.
 */
export function andesImpliedSize(
  positioning: AndesOverlayPositioning,
): Pick<AndesOverlayConfig['size'], 'width' | 'height'> {
  if (positioning.kind !== 'edge') {
    return {};
  }

  const edge = positioning.edge ?? 'right';
  return edge === 'left' || edge === 'right'
    ? { height: '100%' }
    : { width: '100%' };
}
