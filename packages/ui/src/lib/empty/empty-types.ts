import type { TemplateRef } from '@angular/core';

/** The built-in illustrations. `default` is a tray with a document; `simple` is a minimal outline. */
export type AndesEmptyIllustration = 'default' | 'simple';
export type AndesEmptySize = 'default' | 'small';
/**
 * Ready-made combinations of illustration, size and message for the places an empty state
 * usually appears: a dropdown list, a table body, a list, or a search with no hits.
 */
export type AndesEmptyPreset =
  'default' | 'select' | 'table' | 'list' | 'search';

/**
 * What `image` takes: a built-in illustration, a URL to an image, a template (any markup, e.g.
 * your own SVG), or `false` / `null` to show no picture.
 */
export type AndesEmptyImage =
  AndesEmptyIllustration | string | TemplateRef<unknown> | false | null;

/** What `description` takes: text, a template, or `false` / `null` to hide it. */
export type AndesEmptyDescription =
  string | TemplateRef<unknown> | false | null;

/** What `heading` takes: text, a template, or `false` / `null` / nothing for no heading. */
export type AndesEmptyHeading = string | TemplateRef<unknown> | false | null;

/**
 * The parts of the state `classNames` and `styles` reach: the host (`root`), the picture box
 * (`image`), the optional `heading`, the message (`description`) and the projected
 * actions area (`footer`).
 */
export type AndesEmptyPart =
  'root' | 'image' | 'heading' | 'description' | 'footer';

/** The state a `classNames` / `styles` function sees: what the empty state resolved to. */
export interface AndesEmptyStyleInfo {
  readonly props: {
    readonly preset: AndesEmptyPreset;
    readonly image: AndesEmptyImage;
    readonly heading: AndesEmptyHeading;
    readonly description: AndesEmptyDescription;
    readonly size: AndesEmptySize;
  };
}

/** One class string per part. */
export type AndesEmptyClassNames = Partial<Record<AndesEmptyPart, string>>;

/** Inline styles of one part: camelCase or dashed names, custom properties included. */
export type AndesEmptyPartStyle = Readonly<
  Record<string, string | number | null | undefined>
>;

/** One style object per part. A length needs its unit (`'60px'`), as in any `[style]` binding. */
export type AndesEmptyStyles = Partial<
  Record<AndesEmptyPart, AndesEmptyPartStyle>
>;

/** `classNames` as an object, or as a function of the resolved state. */
export type AndesEmptyClassNamesInput =
  AndesEmptyClassNames | ((info: AndesEmptyStyleInfo) => AndesEmptyClassNames);

/** `styles` as an object, or as a function of the resolved state. */
export type AndesEmptyStylesInput =
  AndesEmptyStyles | ((info: AndesEmptyStyleInfo) => AndesEmptyStyles);
