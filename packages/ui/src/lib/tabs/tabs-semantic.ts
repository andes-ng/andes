import type { AndesStyleMap } from '../tag/tag-semantic';
import type {
  AndesTabsOrientation,
  AndesTabsPosition,
  AndesTabsSize,
  AndesTabsType,
} from './tabs-types';

/**
 * The parts of a Tabs widget that `classNames` and `styles` can reach one by one:
 *
 * - `root`: the `andes-tabs` host, around the bar and the panels.
 * - `bar`: the row (or column) that holds the extra content, the tabs and the buttons.
 * - `list`: the `role="tablist"` element that holds only the tabs.
 * - `trigger`: each tab's button.
 * - `indicator`: the sliding ink bar of the `line` type.
 * - `panels`: the box around every panel.
 * - `content`: each panel.
 * - `extra`: both extra-content slots of the bar.
 * - `more`: the overflow button.
 * - `moreMenu`: the overflow menu's popup.
 * - `add`: the `editable-card` add button.
 */
export type AndesTabsSemanticPart =
  | 'root'
  | 'bar'
  | 'list'
  | 'trigger'
  | 'indicator'
  | 'panels'
  | 'content'
  | 'extra'
  | 'more'
  | 'moreMenu'
  | 'add';

/** Extra classes per part. */
export type AndesTabsClassNames = Partial<
  Record<AndesTabsSemanticPart, string | readonly string[]>
>;

/** Inline styles per part; see {@link AndesStyleMap} for the key and value rules. */
export type AndesTabsStyles = Partial<
  Record<AndesTabsSemanticPart, AndesStyleMap>
>;

/** What a `classNames` / `styles` function can look at to decide its result. */
export interface AndesTabsSemanticProps {
  readonly type: AndesTabsType;
  readonly size: AndesTabsSize;
  /** Where the bar sits after the responsive collapse has been applied. */
  readonly position: AndesTabsPosition;
  readonly orientation: AndesTabsOrientation;
  readonly centered: boolean;
  readonly stretch: boolean;
  readonly draggable: boolean;
  /** Whether the tabs currently overflow the bar. */
  readonly overflowing: boolean;
}

export interface AndesTabsSemanticInfo {
  readonly props: AndesTabsSemanticProps;
}

/** An object, or a function of the Tabs' props (returning nothing leaves the Tabs as they are). */
export type AndesTabsSemantic<T> =
  T | ((info: AndesTabsSemanticInfo) => T | null | undefined);
