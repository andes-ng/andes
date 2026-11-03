/** A map of CSS declarations. Keys are camelCase or kebab-case (or `--custom`), values a string
 * or a number (a bare number gets `px`, except for properties that take a plain number). */
export type AndesStyleMap = Readonly<Record<string, string | number>>;

/** The parts of a tag that `classNames` and `styles` can reach. */
export type AndesTagSemanticPart = 'root' | 'icon' | 'content';

export type AndesTagClassNames = Partial<Record<AndesTagSemanticPart, string>>;
export type AndesTagStyles = Partial<
  Record<AndesTagSemanticPart, AndesStyleMap>
>;

/** What a `classNames` / `styles` function can look at to decide its result. */
export interface AndesTagSemanticProps {
  readonly color: string;
  readonly variant: 'outlined' | 'filled' | 'solid';
  readonly bordered: boolean;
  readonly disabled: boolean;
  readonly closable: boolean;
  readonly checkable: boolean;
  readonly checked: boolean;
}

export interface AndesTagSemanticInfo {
  readonly props: AndesTagSemanticProps;
}

/** An object, or a function of the tag's props (returning nothing leaves the tag as it is). */
export type AndesTagSemantic<T> =
  T | ((info: AndesTagSemanticInfo) => T | null | undefined);

/** The parts of a checkable tag group. `item` is each option's tag. */
export type AndesCheckableTagGroupSemanticPart = 'root' | 'item';

export type AndesCheckableTagGroupClassNames = Partial<
  Record<AndesCheckableTagGroupSemanticPart, string>
>;
export type AndesCheckableTagGroupStyles = Partial<
  Record<AndesCheckableTagGroupSemanticPart, AndesStyleMap>
>;

export interface AndesCheckableTagGroupSemanticInfo {
  readonly props: {
    readonly multiple: boolean;
    readonly disabled: boolean;
  };
}

export type AndesCheckableTagGroupSemantic<T> =
  T | ((info: AndesCheckableTagGroupSemanticInfo) => T | null | undefined);

/** Properties whose number is not a length. */
const UNITLESS = new Set([
  'opacity',
  'font-weight',
  'line-height',
  'z-index',
  'flex',
  'flex-grow',
  'flex-shrink',
  'order',
  'scale',
  'zoom',
]);

/**
 * Normalises a style map for Angular's `[style]` binding: kebab-case keys, `px` on bare numbers.
 * `null` when there is nothing to apply, so the binding is dropped.
 */
export function toStyleMap(
  style: AndesStyleMap | null | undefined,
): Record<string, string> | null {
  if (!style) {
    return null;
  }
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(style)) {
    const name = key.startsWith('--')
      ? key
      : key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
    result[name] =
      typeof value === 'number' && value !== 0 && !UNITLESS.has(name)
        ? `${value}px`
        : String(value);
  }
  return result;
}

/** Resolves an object-or-function semantic input to its object. */
export function resolveSemantic<T, I>(
  value: T | ((info: I) => T | null | undefined) | undefined,
  info: I,
): T | undefined {
  const resolved =
    typeof value === 'function'
      ? (value as (info: I) => T | null | undefined)(info)
      : value;
  return resolved ?? undefined;
}
