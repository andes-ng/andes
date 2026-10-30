import type { TemplateRef } from '@angular/core';

import type { AndesColor, AndesColorInput } from './color';
import type {
  AndesGradient,
  AndesGradientInput,
  AndesGradientValue,
} from './gradient';

export type AndesColorPickerSize = 'sm' | 'md' | 'lg';

/** `error` also sets `aria-invalid`; `warning` is purely visual. */
export type AndesColorPickerStatus = 'error' | 'warning';

/** Where the panel opens relative to the trigger: above or below, aligned to one edge. */
export type AndesColorPickerPlacement =
  'bottomLeft' | 'bottomRight' | 'topLeft' | 'topRight';

/**
 * What opens the panel. `click` (the default) toggles it from the trigger. `hover` also opens
 * it when the pointer rests on the trigger and closes it once the pointer has left both the
 * trigger and the panel; a click, a tap or the keyboard opens it as with `click`.
 */
export type AndesColorPickerTriggerAction = 'click' | 'hover';

/**
 * What the picker edits: one colour (`single`, the default), or a linear gradient of colour
 * stops (`gradient`).
 */
export type AndesColorPickerMode = 'single' | 'gradient';

/**
 * Everything `value` accepts. A colour - text or an {@link AndesColor} - in `single` mode; in
 * `gradient` mode, CSS `linear-gradient()` text or an {@link AndesGradientValue} (an
 * {@link AndesGradient} is one). Either mode reads the other kind too: a colour becomes a flat
 * two-stop gradient, a gradient gives its first stop's colour.
 */
export type AndesColorPickerValue = AndesColorInput | AndesGradientValue;

/** A labelled group of ready-made colours or gradients shown under the picker. */
export interface AndesColorPreset {
  /** Heading of the group; also the accessible name of its list of colours. */
  label: string;
  /** The colours, as text (`'#ff4d4f'`, `'rgb(0 0 0)'`, `'teal'`) or {@link AndesColor}s. */
  colors?: readonly AndesColorInput[];
  /**
   * Ready-made gradients, as CSS `linear-gradient()` text or {@link AndesGradientValue}s.
   * Shown in `mode="gradient"` only, where picking one replaces the whole gradient (a colour
   * preset there recolours the selected stop).
   */
  gradients?: readonly AndesGradientInput[];
  /** Whether the group starts expanded. Default `true`. */
  defaultOpen?: boolean;
  /**
   * Whether the group heading is a button that expands and collapses it (`aria-expanded`).
   * Default `true`; `false` shows a plain heading and keeps the group open.
   */
  collapsible?: boolean;
}

/** The gradient part of an {@link AndesColorChangeEvent}, present in `mode="gradient"` only. */
export interface AndesGradientChange {
  /** The whole gradient as the picker's value now holds it: CSS text or an AndesGradient. */
  value: string | AndesGradient;
  /** The whole gradient, parsed. */
  gradient: AndesGradient;
  /** Index, in position order, of the stop that is selected (and was edited, if any). */
  stop: number;
}

/** What `colorChange` and `colorChangeComplete` carry. */
export interface AndesColorChangeEvent {
  /** The new colour; in `mode="gradient"`, the selected stop's colour. */
  color: AndesColor;
  /**
   * The new value as the picker's value now holds it: an {@link AndesColor} when the value
   * is one, otherwise text in the current format (`#1677ff`, `rgb(22, 119, 255)`,
   * `hsb(215, 91%, 100%)`). In `mode="gradient"` it is the selected stop's colour in that
   * form; the gradient itself is in `gradient`.
   */
  value: AndesColorInput;
  /** In `mode="gradient"`: the whole gradient. Absent in `single` mode. */
  gradient?: AndesGradientChange;
}

/** Context of a custom `showText` template. */
export interface AndesColorPickerTextContext {
  /** The current colour; in `mode="gradient"`, the first stop's colour. */
  $implicit: AndesColor;
  /** The colour as text in the current format; in `mode="gradient"`, the CSS gradient. */
  value: string;
  /** In `mode="gradient"`: the gradient. */
  gradient?: AndesGradient;
}

/** Every visible or spoken string, so the picker can be translated. */
export interface AndesColorPickerLabels {
  /** Name of the trigger button. */
  trigger: string;
  /** Spoken (and shown, with `showText`) when no colour is set. */
  noColor: string;
  /** Name of the panel. */
  panel: string;
  /** Name of the saturation / brightness area. */
  area: string;
  /** Spoken value of the area; `{s}` and `{b}` are the two percentages. */
  areaValue: string;
  hue: string;
  alpha: string;
  format: string;
  hex: string;
  red: string;
  green: string;
  blue: string;
  saturation: string;
  brightness: string;
  /** HSL and OKLCH lightness field. */
  lightness: string;
  /** OKLCH chroma field. */
  chroma: string;
  clear: string;
  eyeDropper: string;
  /** Added to the trigger's name when `readOnly` is set. */
  readOnly: string;
  /** Name of the copy button. */
  copy: string;
  /** Shown and announced after a copy. */
  copied: string;
  /** Confirm-mode button that commits the staged colour. */
  apply: string;
  /** Confirm-mode button that discards the staged colour. */
  cancel: string;
  /** Heading of the recent colours group. */
  recent: string;
  /** Name of the gradient editor. */
  gradient: string;
  /** Name of the list of gradient stops. */
  gradientStops: string;
  /**
   * Spoken value of a gradient stop: `{index}`, `{count}`, `{color}` and `{position}`
   * ("Stop 1 of 3, #ff0000 at 20%").
   */
  gradientStop: string;
  /** The trigger text and name of a gradient: `{angle}` and `{count}`. */
  gradientSummary: string;
  addStop: string;
  removeStop: string;
  /** Name of the gradient angle dial and field. */
  angle: string;
  /** Heading of the contrast check: `{color}` is the `contrastWith` colour. */
  contrast: string;
  /** Text-size rows of the contrast check. */
  contrastNormal: string;
  contrastLarge: string;
  /** What a contrast badge says, spoken after its level ("AA pass"). */
  contrastPass: string;
  contrastFail: string;
  /**
   * Announced politely when a gesture ends: `{ratio}`, then `{normal}` and `{large}` (the
   * levels met, or `{none}`).
   */
  contrastSummary: string;
  /** Used in `contrastSummary` when no level is met. */
  contrastNone: string;
}

export const ANDES_COLOR_PICKER_DEFAULT_LABELS: AndesColorPickerLabels = {
  trigger: 'Color',
  noColor: 'No color',
  panel: 'Color picker',
  area: 'Saturation and brightness',
  areaValue: 'Saturation {s}%, brightness {b}%',
  hue: 'Hue',
  alpha: 'Opacity',
  format: 'Color format',
  hex: 'Hex color',
  red: 'Red',
  green: 'Green',
  blue: 'Blue',
  saturation: 'Saturation',
  brightness: 'Brightness',
  lightness: 'Lightness',
  chroma: 'Chroma',
  clear: 'Clear color',
  eyeDropper: 'Pick a color from the screen',
  readOnly: 'read-only',
  copy: 'Copy color value',
  copied: 'Copied',
  apply: 'Apply',
  cancel: 'Cancel',
  recent: 'Recent',
  gradient: 'Gradient',
  gradientStops: 'Gradient stops',
  gradientStop: 'Stop {index} of {count}, {color} at {position}%',
  gradientSummary: 'Linear gradient, {angle}°, {count} stops',
  addStop: 'Add stop',
  removeStop: 'Remove stop',
  angle: 'Angle',
  contrast: 'Contrast with {color}',
  contrastNormal: 'Normal text',
  contrastLarge: 'Large text',
  contrastPass: 'pass',
  contrastFail: 'fail',
  contrastSummary:
    'Contrast {ratio} to 1. Normal text: {normal}. Large text: {large}.',
  contrastNone: 'fails AA',
};

/** Content of the `showText` input: a flag, or a template given the colour. */
export type AndesColorPickerShowText =
  boolean | TemplateRef<AndesColorPickerTextContext>;
