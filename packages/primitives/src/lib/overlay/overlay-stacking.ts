import {
  ANDES_OVERLAY_Z_INDEX_FALLBACKS,
  andesOverlayZIndex,
  type AndesOverlayLayer,
} from './overlay-config';

/**
 * Reads a `z-index` as a number. A browser resolves `var(--andes-z-index-modal, 1050)` to
 * `1050` in a computed style; an environment that does not resolve custom properties (jsdom)
 * hands the declaration back, so its fallback value is read instead.
 */
function parseZIndex(value: string): number | null {
  const direct = Number.parseInt(value, 10);
  if (Number.isFinite(direct)) {
    return direct;
  }
  const fallback = /,\s*(-?\d+)\s*\)\s*$/.exec(value);
  return fallback ? Number.parseInt(fallback[1], 10) : null;
}

/** The numeric z-index of a layer: the `--andes-z-index-<layer>` token in effect, else its
 *  fallback. */
function layerZIndex(layer: AndesOverlayLayer, view: Window | null): number {
  const token = view
    ?.getComputedStyle(view.document.documentElement)
    .getPropertyValue(`--andes-z-index-${layer}`);
  return (
    (token ? Number.parseInt(token, 10) : Number.NaN) ||
    ANDES_OVERLAY_Z_INDEX_FALLBACKS[layer]
  );
}

/**
 * The `z-index` an overlay of `layer` opened from `origin` (its anchor, or the element it was
 * declared on) takes.
 *
 * Normally the layer's own token. But an overlay opened from INSIDE another overlay has to
 * stack above that one whatever its layer says: a select, a combobox or a menu sits on the
 * `dropdown` layer (1000), below the `modal` layer (1050) of the dialog its trigger lives in,
 * so its list was drawn behind the dialog it was opened from. When the origin sits inside an
 * overlay host (a direct child of the CDK overlay container), the result is the larger of the
 * layer's own value and one above that host's, so it works for any layer pairing, a dialog in
 * a drawer or a menu in a popover, without a table of exceptions.
 */
export function andesOverlayStackedZIndex(
  layer: AndesOverlayLayer,
  origin: Node | null | undefined,
): string {
  const own = andesOverlayZIndex(layer);
  // A view container's anchor is a comment node: start from its parent element.
  const element = origin instanceof Element ? origin : origin?.parentElement;
  const parent = element?.closest('.cdk-overlay-container > *');
  const view = element?.ownerDocument.defaultView ?? null;
  if (!parent || !view) {
    return own;
  }
  const parentIndex = parseZIndex(view.getComputedStyle(parent).zIndex);
  if (parentIndex === null || parentIndex < layerZIndex(layer, view)) {
    return own;
  }
  return String(parentIndex + 1);
}
