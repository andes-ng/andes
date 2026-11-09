import type { AndesListNavigationItemRef } from '@andes-ng/primitives';
import { InjectionToken, type Signal, type TemplateRef } from '@angular/core';

import type { AndesTabsSemanticPart } from './tabs-semantic';

/** Which arrow keys move focus between tabs, per the WAI-ARIA Tabs pattern. */
export type AndesTabsOrientation = 'horizontal' | 'vertical';

/**
 * Whether moving focus with the arrow keys also selects the focused tab.
 *
 * - `automatic` (default) — moving focus to a tab immediately shows its panel too. This is
 *   the WAI-ARIA APG's recommended default for simple tabs.
 * - `manual` — arrow keys only move focus; the user must press `Enter` or `Space` on the
 *   focused tab to activate it. Use this when switching tabs is expensive (e.g. each panel
 *   triggers a network request), so a user arrowing through the list doesn't fire it for
 *   every tab passed over.
 */
export type AndesTabsActivationMode = 'automatic' | 'manual';

/**
 * The visual style of the tab bar.
 *
 * - `line` (default) — plain labels over a divider, with a sliding ink bar under the active one.
 * - `card` — each tab is an enclosed card; the active card merges into the panel below it.
 * - `editable-card` — `card`, plus a per-tab remove button and an add button in the bar.
 *   Neither adds nor removes anything itself: both only emit `(edit)`, and the consumer
 *   updates its own list of tabs in response.
 * - `pill` — a tinted, rounded thumb glides behind the active tab, whose label takes the
 *   primary colour; the track is transparent.
 * - `segmented` — the tabs sit in a muted track and a white, raised thumb glides behind the
 *   active one.
 */
export type AndesTabsType =
  'line' | 'card' | 'editable-card' | 'pill' | 'segmented';

/**
 * Which side of the panels the tab bar sits on. `left`/`right` lay the bar out vertically
 * (and switch keyboard navigation to the vertical arrow keys); they follow the inline
 * direction, so they mirror under `dir="rtl"`.
 */
export type AndesTabsPosition = 'top' | 'bottom' | 'left' | 'right';

/** Preset tab sizes, named after `AndesButton`'s scale. */
export type AndesTabsSize = 'sm' | 'md' | 'lg';

/** The visual variants the types resolve to (`editable-card` is a `card`). */
export type AndesTabsVariant = 'line' | 'card' | 'pill' | 'segmented';

/** Fine-grained form of the `animated` input. */
export interface AndesTabsAnimated {
  /** Whether the ink bar (and the thumb of the `pill` and `segmented` types) slides between
   * tabs. Default `true`. */
  inkBar?: boolean;
  /**
   * How a newly shown panel enters: `true` or `'fade'` fades in, `'slide'` also moves in from
   * the side the new tab sits on. Default `false`.
   */
  tabPane?: boolean | 'fade' | 'slide';
}

/**
 * Timing of the sliding indicator (the ink bar of the `line` type and the thumb of the `pill`
 * and `segmented` types). Both parts are optional; the defaults are 200ms for the ink bar and
 * 300ms for the thumb, and `prefers-reduced-motion: reduce` still removes the slide.
 */
export interface AndesTabsMotion {
  /** Milliseconds (a number) or any CSS time such as `'0.3s'`. `0` snaps without sliding. */
  duration?: number | string;
  /** Any CSS easing function, e.g. `'ease-in-out'` or `'cubic-bezier(0.2, 0, 0, 1)'`. */
  easing?: string;
}

/** How a newly shown panel enters, once `animated` has been resolved. */
export type AndesTabsPaneMotion = 'none' | 'fade' | 'slide';

/** Customizes the `line`-type ink bar under the active tab. */
export interface AndesTabsIndicator {
  /**
   * The ink bar's length in px, or a function of the active tab's own length (its width, or
   * its height for a vertical bar). Default: the full length of the tab.
   */
  size?: number | ((origin: number) => number);
  /** Where a shorter-than-the-tab ink bar sits along the tab. Default `'center'`. */
  align?: 'start' | 'center' | 'end';
  /** The ink bar's thickness in px. Default 2. */
  thickness?: number;
}

/** Emitted by `(edit)` on an `editable-card` Tabs. */
export type AndesTabsEditEvent =
  | { action: 'add'; event: Event }
  | { action: 'remove'; key: string; event: Event };

/** Emitted by `(tabClick)`. */
export interface AndesTabsClickEvent {
  key: string;
  event: MouseEvent;
}

/** Emitted by `(tabScroll)` whenever an overflowing tab bar scrolls. */
export interface AndesTabsScrollEvent {
  direction: 'left' | 'right' | 'top' | 'bottom';
}

/**
 * Emitted by `(reorder)` when a `draggable` Tabs' tab is dropped at a new place, or moved
 * one step with `Alt`+`Shift`+arrow key. Indices count every tab in the bar, disabled ones
 * included. Like `(edit)`, it only reports the request: the consumer reorders its own list
 * of tabs (e.g. with `moveItemInArray` from `@angular/cdk/drag-drop`).
 */
export interface AndesTabsReorderEvent {
  key: string;
  previousIndex: number;
  currentIndex: number;
}

/** How the overflow menu button opens its menu. */
export type AndesTabsMoreTrigger = 'click' | 'hover';

/** One tab listed in the overflow menu: a tab currently scrolled (partly) out of view. */
export interface AndesTabsMoreTab {
  key: string;
  /** The tab's visible text. */
  label: string;
  icon: TemplateRef<unknown> | undefined;
  disabled: boolean;
  /** Whether the tab shows a remove button (`editable-card` only). */
  removable: boolean;
  selected: boolean;
}

/** Template context of a custom `moreTemplate`. */
export interface AndesTabsMoreContext {
  /** The tabs currently out of view. */
  $implicit: readonly AndesTabsMoreTab[];
  /** Selects a tab, closes the menu and focuses the tab. */
  select: (key: string) => void;
  /** Closes the menu. */
  close: () => void;
}

/** The object form of `tabBarExtraContent`. */
export interface AndesTabsExtraContent {
  left?: TemplateRef<unknown>;
  right?: TemplateRef<unknown>;
}

/**
 * One entry of the `items` input - the data-driven alternative to projecting
 * `<andes-tabs-list>`/`<andes-tabs-trigger>`/`<andes-tabs-content>` by hand.
 */
export interface AndesTabsItem {
  /** Unique key; becomes the trigger/panel `value`. */
  key: string;
  /** The tab's label. */
  label: string | TemplateRef<unknown>;
  /** An icon rendered before the label. */
  icon?: TemplateRef<unknown>;
  /** The tab's accessible name, for a tab with an icon and no visible text. */
  ariaLabel?: string;
  /** The panel's content. Always rendered lazily - see `AndesTabsContentLazy`. */
  content?: string | TemplateRef<unknown>;
  disabled?: boolean;
  /** Whether an `editable-card` tab shows its remove button. Default `true`. */
  closable?: boolean;
  /** Custom remove icon; `null` hides the remove button. */
  closeIcon?: TemplateRef<unknown> | null;
  /** Overrides the Tabs-level `destroyOnHidden` for this panel. */
  destroyOnHidden?: boolean;
  /** Render the panel before it is first activated, instead of lazily on first activation. */
  forceRender?: boolean;
}

/**
 * The contract a trigger must satisfy to register with the parent {@link AndesTabs}.
 *
 * This interface exists purely so `tabs.ts` never has to import `tabs-trigger.ts` (which
 * itself imports `tabs.ts` to inject the parent) - the same avoid-a-circular-import shape
 * used by `AndesListNavigationItemRef` in `@andes-ng/primitives`.
 */
export interface AndesTabsTriggerRef {
  /** The value identifying this tab; matches the `AndesTabsContent` it controls. */
  readonly value: Signal<string>;
  /** Whether this tab is disabled and should be skipped when picking a default tab. */
  readonly disabled: Signal<boolean>;
  /** The trigger's own host element, used to keep the registry in DOM order. */
  readonly element: HTMLElement;
  /**
   * The real `id` of the trigger's focusable button, once `AndesListNavigationItem` has
   * assigned one - `undefined` before the view initializes. `AndesTabsContent` reads this
   * (rather than minting its own id for the trigger) so it never has to fight the primitive
   * for control of that attribute; see the comment in `tabs-trigger.ts`.
   */
  readonly elementId: Signal<string | undefined>;
  /**
   * The trigger's own registered `AndesListNavigationItem`, once its view has initialized -
   * `undefined` before then. Read by `AndesTabs` to keep the shared `AndesListNavigation`'s
   * roving-tabindex target in sync with whichever tab is currently selected.
   */
  readonly navigationItem: Signal<AndesListNavigationItemRef | undefined>;
  /** The icon rendered before the label, if any. */
  readonly icon: Signal<TemplateRef<unknown> | undefined>;
  /** Whether the tab currently shows a remove button. */
  readonly removable: Signal<boolean>;
  /** The tab button's visible text, read from the DOM. */
  labelText(): string;
}

/**
 * What `AndesTabsList`, `AndesTabsTrigger` and `AndesTabsContent` need from their parent
 * `AndesTabs`, provided under {@link ANDES_TABS}.
 *
 * The children inject this token rather than the `AndesTabs` class itself because `AndesTabs`
 * now also *imports* them (to render the `items` input) - injecting the class would make
 * `tabs.ts` and each child file import one another, and a component's `imports` array is
 * evaluated at module load, when one side of that cycle is still undefined.
 */
export interface AndesTabsContext {
  readonly activeValue: Signal<string | undefined>;
  /** The effective orientation, derived from `tabPosition`/`orientation`. */
  readonly resolvedOrientation: Signal<AndesTabsOrientation>;
  readonly position: Signal<AndesTabsPosition>;
  readonly activationMode: Signal<AndesTabsActivationMode>;
  readonly type: Signal<AndesTabsType>;
  readonly size: Signal<AndesTabsSize>;
  readonly editable: Signal<boolean>;
  readonly tabBarGutter: Signal<number | undefined>;
  readonly tabPaneAnimated: Signal<boolean>;
  /** How a newly shown panel enters. */
  readonly paneMotion: Signal<AndesTabsPaneMotion>;
  /** Which way the selection last moved along the bar, for the `slide` panel motion. */
  readonly paneDirection: Signal<'forward' | 'backward'>;
  /** The visual variant the type resolves to: `line`, `card`, `pill` or `segmented`. */
  readonly variant: Signal<AndesTabsVariant>;
  readonly stretch: Signal<boolean>;
  /** Whether the thumb is in place (`ready`) or the selected tab draws it itself (`pending`). */
  readonly thumbState: Signal<'ready' | 'pending'>;
  /** Resolved per-part classes from the `classNames` input. */
  readonly partClasses: Signal<Partial<Record<AndesTabsSemanticPart, string>>>;
  /** Resolved per-part inline styles from the `styles` input. */
  readonly partStyles: Signal<
    Partial<Record<AndesTabsSemanticPart, Record<string, string> | null>>
  >;
  readonly destroyOnHidden: Signal<boolean>;
  readonly removeIcon: Signal<TemplateRef<unknown> | undefined>;
  readonly draggable: Signal<boolean>;
  /** Whether a tab is being dragged right now. */
  readonly sorting: Signal<boolean>;
  select(value: string): void;
  setSorting(sorting: boolean): void;
  requestReorder(
    value: string,
    previousIndex: number,
    currentIndex: number,
  ): void;
  moveByKeyboard(value: string, step: -1 | 1): void;
  syncOrder(): void;
  handleTabClick(value: string, event: MouseEvent): void;
  requestRemove(value: string, event: Event, fromKeyboard: boolean): void;
  registerTrigger(trigger: AndesTabsTriggerRef): void;
  unregisterTrigger(trigger: AndesTabsTriggerRef): void;
  panelId(value: string): string;
  triggerElementId(value: string): string | undefined;
}

/** @internal Provided by `AndesTabs`; see {@link AndesTabsContext}. */
export const ANDES_TABS = new InjectionToken<AndesTabsContext>('ANDES_TABS');
