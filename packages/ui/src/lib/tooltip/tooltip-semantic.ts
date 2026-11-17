import type { AndesOverlayAlign, AndesOverlaySide } from '@andes-ng/primitives';

import type { AndesTooltipPlacement } from './tooltip-placement';

/**
 * The three parts of a tooltip that can be styled one by one:
 *
 * - `root`: the element the overlay positions, which carries the `role`, the
 *   `id`, the drop shadow and the enter/leave motion, and holds the other two.
 * - `container`: the visible box around the content - padding, background,
 *   radius and text color.
 * - `arrow`: the pointer between the container and the trigger.
 */
export type AndesTooltipSemanticPart = 'root' | 'container' | 'arrow';

/** Extra classes per part. */
export type AndesTooltipClassNames = Partial<
  Record<AndesTooltipSemanticPart, string | readonly string[]>
>;

/**
 * Inline styles per part. A property is spelled the CSS way (`'border-radius'`,
 * `'--my-var'`) or the camelCase way (`borderRadius`); a number means pixels,
 * except for the unitless properties (`opacity`, `zIndex`, `lineHeight`, ...).
 */
export type AndesTooltipStyles = Partial<
  Record<
    AndesTooltipSemanticPart,
    Readonly<Record<string, string | number | null | undefined>>
  >
>;

/** What the function forms of `classNames` and `styles` can base their answer on. */
export interface AndesTooltipSemanticProps {
  /** The `placement` input, or `null` when `side` and `align` are used. */
  readonly placement: AndesTooltipPlacement | null;
  /** The preferred side, whether it came from `placement` or from `side`. */
  readonly side: AndesOverlaySide;
  /** The alignment along that side, whether it came from `placement` or from `align`. */
  readonly align: AndesOverlayAlign;
  /** Whether the arrow is shown. */
  readonly arrow: boolean;
  /** Whether the arrow points at the trigger's center instead of just inside its edge. */
  readonly pointAtCenter: boolean;
  /** The `color` input. */
  readonly color: string | null;
  /** The `variant` input. */
  readonly variant: string;
  /** Whether the tooltip is open. */
  readonly open: boolean;
}

/** The argument the function forms of `classNames` and `styles` receive. */
export interface AndesTooltipSemanticInfo {
  readonly props: AndesTooltipSemanticProps;
}

/** `classNames`: the parts' classes as an object, or computed from the tooltip's props. */
export type AndesTooltipClassNamesInput =
  | AndesTooltipClassNames
  | ((info: AndesTooltipSemanticInfo) => AndesTooltipClassNames);

/** `styles`: the parts' inline styles as an object, or computed from the tooltip's props. */
export type AndesTooltipStylesInput =
  AndesTooltipStyles | ((info: AndesTooltipSemanticInfo) => AndesTooltipStyles);

/** CSS properties whose numeric value is a plain number, not a length. */
const UNITLESS = new Set([
  'opacity',
  'z-index',
  'font-weight',
  'line-height',
  'flex',
  'flex-grow',
  'flex-shrink',
  'order',
  'zoom',
  'scale',
  'aspect-ratio',
  'orphans',
  'widows',
]);

/** `borderRadius` -> `border-radius`; custom properties and dashed names are kept. */
function dashed(property: string): string {
  return property.startsWith('--')
    ? property
    : property.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
}

/**
 * Normalizes one part's style object for an Angular `[style]` binding: dashed
 * names, numbers turned into pixels (unless the property is unitless), and no
 * empty entries. `null` when there is nothing to apply.
 */
export function andesTooltipStyleObject(
  style:
    Readonly<Record<string, string | number | null | undefined>> | undefined,
): Record<string, string> | null {
  if (!style) {
    return null;
  }
  const result: Record<string, string> = {};
  for (const [property, value] of Object.entries(style)) {
    if (value == null || value === '') {
      continue;
    }
    const name = dashed(property);
    result[name] =
      typeof value === 'number' && value !== 0 && !UNITLESS.has(name)
        ? `${value}px`
        : String(value);
  }
  return Object.keys(result).length ? result : null;
}
