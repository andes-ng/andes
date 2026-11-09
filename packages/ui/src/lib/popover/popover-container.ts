import { OverlayContainer } from '@angular/cdk/overlay';
import { Injectable, inject } from '@angular/core';

/** Marks the layer this class puts inside a custom container. */
const LAYER_ATTRIBUTE = 'data-andes-popover-layer';

/**
 * The overlay container of one popover or popconfirm. Without a `container` it is the
 * page-wide one every other overlay uses; with one, the panel is drawn inside that
 * element instead, so it picks up the element's theme scope (`data-andes-theme`, custom
 * properties), its `dir`, and stays inside a shadow root or a fullscreen element.
 *
 * The layer is a fixed, full-viewport, click-through box (the CDK overlay container's own
 * styles), so the panel is still positioned against the viewport: the container (and its
 * ancestors) must not have a `transform`, `filter` or `contain: paint`, which would make
 * that box relative to themselves.
 *
 * @internal
 */
@Injectable()
export class AndesPopoverOverlayContainer extends OverlayContainer {
  private readonly page = inject(OverlayContainer, { skipSelf: true });
  private target: HTMLElement | null = null;
  private layer: HTMLElement | null = null;

  /** Draws the next panel inside `target` (`null`: the page-wide layer). */
  setTarget(target: HTMLElement | null): void {
    if (target === this.target) {
      return;
    }
    this.removeLayer();
    this.target = target;
  }

  override getContainerElement(): HTMLElement {
    const target = this.target;
    if (!target) {
      return this.page.getContainerElement();
    }
    this._loadStyles();
    if (!this.layer || !target.contains(this.layer)) {
      this.layer = this.ensureLayer(target);
    }
    return this.layer;
  }

  override ngOnDestroy(): void {
    this.removeLayer();
  }

  private ensureLayer(target: HTMLElement): HTMLElement {
    const existing = target.querySelector<HTMLElement>(
      `:scope > [${LAYER_ATTRIBUTE}]`,
    );
    if (existing) {
      return existing;
    }
    const layer = this._document.createElement('div');
    layer.classList.add('cdk-overlay-container');
    layer.setAttribute(LAYER_ATTRIBUTE, '');
    target.appendChild(layer);
    return layer;
  }

  /** Removes the layer once no panel is left in it (another popover may share it). */
  private removeLayer(): void {
    if (this.layer && !this.layer.firstElementChild) {
      this.layer.remove();
    }
    this.layer = null;
  }
}

/** Resolves the `container` input to an element, or `null` for the page-wide layer. */
export function resolveAndesPopoverContainer(
  value: unknown,
  document: Document,
): HTMLElement | null {
  const resolved = typeof value === 'function' ? value() : value;
  if (typeof resolved === 'string') {
    return document.querySelector<HTMLElement>(resolved);
  }
  const element =
    (resolved as { nativeElement?: unknown } | null | undefined)
      ?.nativeElement ?? resolved;
  return element instanceof HTMLElement ? element : null;
}
