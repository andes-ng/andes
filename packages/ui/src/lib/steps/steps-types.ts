import { InjectionToken, Signal, TemplateRef } from '@angular/core';

/** Where the steps run: along the inline axis or stacked down the block axis. */
export type AndesStepsOrientation = 'horizontal' | 'vertical';

/** Control size. `small` shrinks the marker from 24px to 20px. */
export type AndesStepsSize = 'default' | 'small';

/**
 * What the trail looks like.
 * - `default`: numbered markers joined by a connector.
 * - `dot`: small dots instead of markers.
 * - `panel`: one bordered bar cut into segments, one per step.
 * - `navigation`: a row of link-like titles with a chevron between them and an underline on the
 *   current one.
 * - `inline`: compact segments with a thin bar on top and the title below, for lists and rows.
 * - `segments`: a thin progress bar above every step, then its indicator (a check when done, a
 *   ring while current, the number ahead) and title; the current step sits in a soft pill.
 */
export type AndesStepsType =
  'default' | 'dot' | 'panel' | 'navigation' | 'inline' | 'segments';

/**
 * How much air a trail keeps around its steps: the gap between stacked steps, the padding of a
 * `navigation` cell and of a `segments` pill.
 */
export type AndesStepsDensity = 'compact' | 'default' | 'comfortable';

/**
 * What the marker of a step shows.
 * - `auto`: a check when done, a cross on error, a ring while current in the `segments` type,
 *   the number otherwise.
 * - `number`: always the number.
 * - `none`: no marker; the bar and the title carry the progress.
 * A step's own `icon` replaces the marker in every mode but `none`.
 */
export type AndesStepsIndicator = 'auto' | 'number' | 'none';

/**
 * What a `segments` trail shows once its container leaves less than `minimumStepWidth` per step.
 * - `stack`: it turns vertical (the behaviour of every other type).
 * - `summary`: the bars stay and the title of the current step is written under them.
 * - `summary-controls`: the same, with previous and next buttons beside the title (they appear
 *   when the trail is `clickable`).
 * - `track`: the bars alone.
 */
export type AndesStepsCollapsedVariant =
  'stack' | 'summary' | 'summary-controls' | 'track';

/**
 * How the marker of the `default` and `panel` types is filled.
 * - `soft`: a tinted disc for finished steps, a solid one for the current step.
 * - `solid`: every reached step is a solid disc.
 * - `outline`: rings only, no fill.
 * - `plain`: no disc at all; the number or the icon sits on the page.
 */
export type AndesStepsVariant = 'soft' | 'solid' | 'outline' | 'plain';

/** Where the title sits relative to the marker (horizontal orientation only). */
export type AndesStepsTitlePlacement = 'horizontal' | 'vertical';

/** How the connector between two steps is drawn. */
export type AndesStepsConnector = 'solid' | 'dashed' | 'dotted';

/**
 * State of one step. `wait` = upcoming, `process` = in progress, `finish` = done, `error` =
 * failed, `warning` = done or pending with something to check, `loading` = in progress and busy
 * (the marker turns into a spinner and the step is announced as busy).
 */
export type AndesStepStatus =
  'wait' | 'process' | 'finish' | 'error' | 'warning' | 'loading';

/** Title, subtitle and description accept plain text or a template. */
export type AndesStepContent = string | TemplateRef<unknown>;

/** Context handed to a step's custom `icon` template. */
export interface AndesStepIconContext {
  $implicit: AndesStepStatus;
  status: AndesStepStatus;
  /** Zero-based position of the step. */
  index: number;
  /** Whether this is the step `current` points at. */
  current: boolean;
}

/** A lucide icon name (registered with `provideIcons`) or a template that draws one. */
export type AndesStepIcon = string | TemplateRef<AndesStepIconContext>;

/** Icons that replace the marker of every step in a status, e.g. a flag for `finish`. */
export type AndesStepsStatusIcons = Partial<
  Record<AndesStepStatus, AndesStepIcon>
>;

/** The parts of a trail that `classNames` and `styles` can reach. */
export type AndesStepsPart =
  | 'root'
  | 'item'
  | 'icon'
  | 'content'
  | 'title'
  | 'subtitle'
  | 'description'
  | 'end'
  | 'tail'
  | 'rail'
  | 'summary';

/** What a `classNames` or `styles` function is told about the trail and the step it styles. */
export interface AndesStepsPartInfo {
  type: AndesStepsType;
  variant: AndesStepsVariant;
  orientation: AndesStepsOrientation;
  size: AndesStepsSize;
  density: AndesStepsDensity;
  /** The trail's current step. */
  current: number;
  /** The trail's `status`. */
  status: AndesStepStatus;
  /** Zero-based index of the step being styled; `-1` for the root. */
  index: number;
  /** Status of the step being styled; the trail's status for the root. */
  stepStatus: AndesStepStatus;
}

/** Extra CSS classes per part. */
export type AndesStepsClassNames = Partial<Record<AndesStepsPart, string>>;

/** Inline styles per part, as property/value maps. */
export type AndesStepsStyles = Partial<
  Record<AndesStepsPart, Record<string, string | number>>
>;

/** An object, or a function of the props that returns one. */
export type AndesStepsClassNamesInput =
  AndesStepsClassNames | ((info: AndesStepsPartInfo) => AndesStepsClassNames);

export type AndesStepsStylesInput =
  AndesStepsStyles | ((info: AndesStepsPartInfo) => AndesStepsStyles);

/**
 * User-facing strings. Every entry is optional. `stepOf` is a template with `{index}`, `{count}`
 * and `{title}` placeholders used for the polite announcement when `current` changes; `more` is
 * the name of the overflow button (`{count}` hidden steps).
 */
export interface AndesStepsLabels {
  wait?: string;
  process?: string;
  finish?: string;
  error?: string;
  warning?: string;
  loading?: string;
  stepOf?: string;
  optional?: string;
  more?: string;
  /** Name of the button that goes to the previous step of a collapsed `segments` trail. */
  previous?: string;
  /** Name of the button that goes to the next step of a collapsed `segments` trail. */
  next?: string;
}

export const ANDES_STEPS_DEFAULT_LABELS: Required<AndesStepsLabels> = {
  wait: 'Upcoming',
  process: 'In progress',
  finish: 'Completed',
  error: 'Error',
  warning: 'Warning',
  loading: 'Loading',
  stepOf: 'Step {index} of {count}: {title}',
  optional: 'Optional',
  more: '{count} more steps',
  previous: 'Previous step',
  next: 'Next step',
};

/** A run of consecutive steps folded into one overflow marker by `maxCount`. */
export interface AndesStepsHiddenRange {
  /** Zero-based index of the first hidden step. */
  start: number;
  /** Zero-based index of the last hidden step, inclusive. */
  end: number;
}

/** Read-only view of the parent `andes-steps`, injected by every `andes-step`. */
export interface AndesStepsContext {
  readonly current: Signal<number>;
  /** Orientation actually in use (after the responsive collapse). */
  readonly layoutOrientation: Signal<AndesStepsOrientation>;
  readonly type: Signal<AndesStepsType>;
  readonly variant: Signal<AndesStepsVariant>;
  readonly size: Signal<AndesStepsSize>;
  readonly density: Signal<AndesStepsDensity>;
  readonly indicator: Signal<AndesStepsIndicator>;
  /**
   * The summary layout in use while a `segments` trail is collapsed, `null` otherwise. The
   * steps then draw their bars only, and navigation moves to the summary row.
   */
  readonly compact: Signal<Exclude<AndesStepsCollapsedVariant, 'stack'> | null>;
  readonly layoutTitlePlacement: Signal<AndesStepsTitlePlacement>;
  readonly connector: Signal<AndesStepsConnector>;
  readonly clickable: Signal<boolean>;
  readonly status: Signal<AndesStepStatus>;
  readonly percent: Signal<number | undefined>;
  readonly initial: Signal<number>;
  readonly statusIcons: Signal<AndesStepsStatusIcons | undefined>;
  readonly dotTemplate: Signal<TemplateRef<AndesStepIconContext> | undefined>;
  readonly resolvedLabels: Signal<Required<AndesStepsLabels>>;
  readonly count: Signal<number>;
  /** Set after the first render, so entrance animations do not play on load. */
  readonly ready: Signal<boolean>;
  /** The step that holds the single tab stop of a clickable trail. */
  readonly tabStop: Signal<number>;
  readonly hiddenRanges: Signal<AndesStepsHiddenRange[]>;
  indexOf(step: unknown): number;
  isHidden(index: number): boolean;
  select(index: number): void;
  moveFocus(step: unknown, key: 'next' | 'previous' | 'first' | 'last'): void;
  noteFocus(index: number): void;
  noteBlur(index: number): void;
  titleTextAt(index: number): string;
  statusAt(index: number): AndesStepStatus;
  classNamesFor(
    index: number,
    stepStatus: AndesStepStatus,
  ): AndesStepsClassNames;
  stylesFor(index: number, stepStatus: AndesStepStatus): AndesStepsStyles;
  panelIndexOf(panel: unknown): number;
  titleIdAt(index: number): string | null;
}

export const ANDES_STEPS = new InjectionToken<AndesStepsContext>('ANDES_STEPS');
