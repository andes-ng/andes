import type { AndesOverlayAlign, AndesOverlaySide } from '@andes-ng/primitives';
import type { ElementRef, TemplateRef } from '@angular/core';

/**
 * The twelve supported placements. The first word is the side of the trigger the
 * panel renders on; the second (if any) is which edge of the panel lines up with
 * the matching edge of the trigger.
 */
export type AndesPopoverPlacement =
  | 'top'
  | 'topLeft'
  | 'topRight'
  | 'bottom'
  | 'bottomLeft'
  | 'bottomRight'
  | 'left'
  | 'leftTop'
  | 'leftBottom'
  | 'right'
  | 'rightTop'
  | 'rightBottom';

/** What opens the panel. Several can be combined by passing an array. */
export type AndesPopoverTriggerAction =
  'click' | 'hover' | 'focus' | 'contextMenu';

/** Plain text, or a template for rich markup. */
export type AndesPopoverRenderable = string | TemplateRef<unknown>;

/**
 * How the open panel is being used. A panel opened by hover or by keyboard focus is a preview
 * (`'hover'`), which closes when the pointer or the focus leaves; a click turns the same panel
 * into a pinned one (`'click'`), which stays until it is dismissed. A panel opened by a click,
 * a context menu or code starts in `'click'`.
 */
export type AndesPopoverMode = 'hover' | 'click';

/**
 * What a template given to `title`, `content` or `description` receives (`let-close`,
 * `let-mode`, `let-popover`), and what a function given to them is called with.
 */
export interface AndesPopoverTemplateContext {
  /** The popover or popconfirm that renders the template. */
  readonly $implicit: { close(): void };
  /** Closes the panel; the same as `$implicit.close()`. */
  readonly close: () => void;
  /** Whether the panel is a hover preview or has been pinned open by a click. */
  readonly mode: AndesPopoverMode;
}

/**
 * What the `title`, `content` and `description` inputs accept: text, a template, or a function
 * returning either. The function is called with the {@link AndesPopoverTemplateContext} and
 * again whenever the signals it reads change, so it can swap its text with the `mode`.
 */
export type AndesPopoverContentInput =
  | AndesPopoverRenderable
  | null
  | undefined
  | ((
      context: AndesPopoverTemplateContext,
    ) => AndesPopoverRenderable | null | undefined);

/**
 * What caused an open or close, as reported by `openChangeDetail`.
 *
 * - `click`, `hover`, `focus`, `contextMenu`: the matching trigger (leaving or blurring
 *   closes it again, so those two close with `hover` / `focus`).
 * - `escape-key`, `outside-click`: dismissed by the page.
 * - `close-button`: an `[andesPopoverClose]` element was activated.
 * - `confirm`, `cancel`: the buttons of a popconfirm (Escape is `escape-key`).
 * - `imperative`: `show()`, `close()` or `toggle()` was called.
 */
export type AndesPopoverChangeSource =
  | 'click'
  | 'hover'
  | 'focus'
  | 'contextMenu'
  | 'escape-key'
  | 'outside-click'
  | 'close-button'
  | 'confirm'
  | 'cancel'
  | 'imperative';

/** What `openChangeDetail` emits: the new state, and what caused it. */
export interface AndesPopoverOpenChange {
  readonly open: boolean;
  readonly source: AndesPopoverChangeSource;
}

/**
 * Where the panel is drawn: an element, a reference to one, a CSS selector, or a function
 * that returns one. `null` (default) uses the page-wide overlay layer.
 */
export type AndesPopoverContainer =
  | HTMLElement
  | ElementRef<HTMLElement>
  | string
  | (() => HTMLElement | null | undefined)
  | null
  | undefined;

/**
 * The parts of a panel that can be styled one by one:
 *
 * - `root`: the surface (background, border, padding, shadow).
 * - `arrow`: the pointer between the surface and the trigger.
 * - `title`, `body`: the heading and the text under it (a popconfirm's description).
 * - `icon`, `footer`: a popconfirm's icon and its row of buttons.
 */
export type AndesPopoverSemanticPart =
  'root' | 'arrow' | 'title' | 'body' | 'icon' | 'footer';

/** Extra classes per part. */
export type AndesPopoverClassNames = Partial<
  Record<AndesPopoverSemanticPart, string | readonly string[]>
>;

/**
 * Inline styles per part. A property is spelled the CSS way (`'border-radius'`,
 * `'--my-var'`) or the camelCase way (`borderRadius`); a number means pixels, except
 * for the unitless properties (`opacity`, `zIndex`, `lineHeight`, ...).
 */
export type AndesPopoverStyles = Partial<
  Record<
    AndesPopoverSemanticPart,
    Readonly<Record<string, string | number | null | undefined>>
  >
>;

/** What the function forms of `classNames` and `styles` can base their answer on. */
export interface AndesPopoverSemanticProps {
  /** The `placement` input, or `undefined` when `side` and `align` are used. */
  readonly placement: AndesPopoverPlacement | undefined;
  /** The side the panel prefers, whether it came from `placement` or `side`. */
  readonly side: AndesOverlaySide;
  /** The alignment along that side. */
  readonly align: AndesOverlayAlign;
  /** Whether the arrow is shown. */
  readonly showArrow: boolean;
  /** The `color` input. */
  readonly color: string | null;
  /** Whether the panel is open. */
  readonly open: boolean;
}

/** The argument the function forms of `classNames` and `styles` receive. */
export interface AndesPopoverSemanticInfo {
  readonly props: AndesPopoverSemanticProps;
}

/** `classNames`: the parts' classes as an object, or computed from the panel's props. */
export type AndesPopoverClassNamesInput =
  | AndesPopoverClassNames
  | ((info: AndesPopoverSemanticInfo) => AndesPopoverClassNames);

/** `styles`: the parts' inline styles as an object, or computed from the panel's props. */
export type AndesPopoverStylesInput =
  AndesPopoverStyles | ((info: AndesPopoverSemanticInfo) => AndesPopoverStyles);

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
]);

/**
 * Normalises one part's style object for an Angular `[style]` binding: dashed names,
 * numbers turned into pixels (unless the property is unitless), and no empty entries.
 * `null` when there is nothing to apply.
 */
export function andesPopoverStyleObject(
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
    const name = property.startsWith('--')
      ? property
      : property.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
    result[name] =
      typeof value === 'number' && value !== 0 && !UNITLESS.has(name)
        ? `${value}px`
        : String(value);
  }
  return Object.keys(result).length ? result : null;
}

export const ANDES_POPOVER_PLACEMENTS: Readonly<
  Record<
    AndesPopoverPlacement,
    { readonly side: AndesOverlaySide; readonly align: AndesOverlayAlign }
  >
> = {
  top: { side: 'top', align: 'center' },
  topLeft: { side: 'top', align: 'start' },
  topRight: { side: 'top', align: 'end' },
  bottom: { side: 'bottom', align: 'center' },
  bottomLeft: { side: 'bottom', align: 'start' },
  bottomRight: { side: 'bottom', align: 'end' },
  left: { side: 'left', align: 'center' },
  leftTop: { side: 'left', align: 'start' },
  leftBottom: { side: 'left', align: 'end' },
  right: { side: 'right', align: 'center' },
  rightTop: { side: 'right', align: 'start' },
  rightBottom: { side: 'right', align: 'end' },
};

/**
 * Semantic color presets for the panel's `color` input, each backed by an
 * existing `--andes-color-*` / `--andes-color-*-foreground` token pair.
 */
export const ANDES_POPOVER_PRESET_COLORS = [
  'primary',
  'secondary',
  'success',
  'warning',
  'danger',
  'info',
] as const;

/** One of {@link ANDES_POPOVER_PRESET_COLORS}. */
export type AndesPopoverPresetColor =
  (typeof ANDES_POPOVER_PRESET_COLORS)[number];

/** Default hover open/close delay, in ms (0.1s). */
export const ANDES_POPOVER_DEFAULT_HOVER_DELAY = 100;
