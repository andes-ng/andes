/** Numbers are pixels; strings are passed through verbatim (`'50%'`, `'3rem'`). */
export function toCssSize(
  value: string | number | null | undefined,
): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  return typeof value === 'number' ? `${value}px` : value;
}

/** The width of a paragraph's last row when it is not set and the paragraph has 3 rows or more. */
export const LAST_ROW_WIDTH = '61%';

/**
 * The CSS width of each row of a paragraph (or line of a text placeholder), `undefined` for a full
 * row. An array sets the rows in order; a single value sets only the LAST row, so the paragraph
 * ends on a shorter line; with no width at all, a block of 3 rows or more still ends at 61%.
 * Numbers are pixels. This is Ant Design's rule, shared by `andes-skeleton` and
 * `andes-skeleton-text`.
 */
export function rowWidths(
  rows: number,
  width: string | number | (string | number)[] | null | undefined,
): (string | undefined)[] {
  const count = Math.max(0, Math.floor(rows || 0));
  return Array.from({ length: count }, (_, index) => {
    const rowWidth = Array.isArray(width)
      ? toCssSize(width[index])
      : index === count - 1
        ? toCssSize(width)
        : undefined;
    return (
      rowWidth ??
      (count >= 3 && index === count - 1 ? LAST_ROW_WIDTH : undefined)
    );
  });
}

/** Size scale shared by the avatar/button/input placeholders - the same names as AndesButton. */
export type AndesSkeletonSize = 'sm' | 'md' | 'lg';

/**
 * How a placeholder moves: `shimmer` sweeps a light band across it, `pulse` fades it in and out,
 * `none` keeps it still. Every mode is dropped under `prefers-reduced-motion: reduce`.
 */
export type AndesSkeletonAnimation = 'shimmer' | 'pulse' | 'none';

/**
 * The animation a placeholder runs: an explicit `animation` wins, otherwise the `active` flag
 * means the shimmer (and its absence no animation).
 */
export function resolveAnimation(
  animation: AndesSkeletonAnimation | undefined,
  active: boolean,
): AndesSkeletonAnimation {
  return animation ?? (active ? 'shimmer' : 'none');
}

/** The modifier class of the shared fill stylesheet for an animation, or `null` for none. */
export function animationClass(
  animation: AndesSkeletonAnimation,
): string | null {
  switch (animation) {
    case 'shimmer':
      return 'andes-skeleton-fill--active';
    case 'pulse':
      return 'andes-skeleton-fill--pulse';
    default:
      return null;
  }
}

/**
 * The inline styles a `styles` input applies to one part: CSS property names (`backgroundColor`
 * or `background-color`) mapped to values. A number is pixels, except for unitless properties
 * such as `opacity` and `zIndex`, and for custom properties.
 */
export type AndesSkeletonStyle = Record<
  string,
  string | number | null | undefined
>;

/** What a `classNames` / `styles` function receives: the placeholder's current inputs. */
export interface AndesSkeletonSemanticInfo<P> {
  props: P;
}

/** A value for a `classNames` / `styles` input: the object itself, or a function of the props. */
export type AndesSkeletonSemanticValue<T, P> =
  T | ((info: AndesSkeletonSemanticInfo<P>) => T);

/** Resolves a `classNames` / `styles` input, calling it first when it is a function. */
export function resolveSemantic<T, P>(
  value: AndesSkeletonSemanticValue<T, P> | undefined,
  props: P,
): T | undefined {
  return typeof value === 'function'
    ? (value as (info: AndesSkeletonSemanticInfo<P>) => T)({ props })
    : value;
}

const UNITLESS_PROPERTIES = new Set([
  'aspect-ratio',
  'flex',
  'flex-grow',
  'flex-shrink',
  'font-weight',
  'line-height',
  'opacity',
  'order',
  'scale',
  'z-index',
  'zoom',
]);

/** `backgroundColor` -> `background-color`; custom properties and kebab-case names are kept. */
function toKebabCase(name: string): string {
  return name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
}

/**
 * Turns a `styles` entry into a style map Angular can bind: kebab-case names, and pixels for
 * numbers. Returns `null` for an empty entry so nothing is bound.
 */
export function toStyleMap(
  style: AndesSkeletonStyle | undefined,
): Record<string, string> | null {
  if (!style) {
    return null;
  }

  const map: Record<string, string> = {};
  for (const [name, value] of Object.entries(style)) {
    if (value === undefined || value === null) {
      continue;
    }
    // A custom property keeps its value as written: it has no unit to guess.
    const isCustom = name.startsWith('--');
    const property = isCustom ? name : toKebabCase(name);
    map[property] =
      typeof value === 'number' &&
      !isCustom &&
      !UNITLESS_PROPERTIES.has(property)
        ? `${value}px`
        : String(value);
  }

  return Object.keys(map).length > 0 ? map : null;
}
