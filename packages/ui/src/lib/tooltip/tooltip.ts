import {
  andesOverlayPreset,
  AndesOverlayContentPrimitive,
  AndesOverlayPrimitive,
  provideAndesOverlay,
  type AndesOverlayAlign,
  type AndesOverlayCloseReason,
  type AndesOverlayConfig,
  type AndesOverlaySide,
} from '@andes-ng/primitives';
import { NgTemplateOutlet } from '@angular/common';
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  DestroyRef,
  effect,
  ElementRef,
  type EmbeddedViewRef,
  inject,
  input,
  model,
  output,
  signal,
  TemplateRef,
  untracked,
  viewChild,
  ViewContainerRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import clsx from 'clsx';

import { ANDES_TOOLTIP_CONFIG } from './tooltip-config';
import { AndesTooltipContent } from './tooltip-content';
import { AndesTooltipGroup } from './tooltip-group';
import {
  AndesTooltipHoverIntent,
  type AndesTooltipChangeSource,
  type AndesTooltipTriggerAction,
} from './tooltip-hover-intent';
import {
  ANDES_TOOLTIP_ARROW_HEIGHT,
  andesTooltipArrowAttribute,
  andesTooltipArrowOffset,
  andesTooltipPlacementToSideAlign,
  andesTooltipPointAtCenterOffset,
  andesTooltipResolveSide,
  type AndesTooltipArrowConfig,
  type AndesTooltipArrowInput,
  type AndesTooltipPlacement,
} from './tooltip-placement';
import {
  andesTooltipStyleObject,
  type AndesTooltipClassNamesInput,
  type AndesTooltipSemanticInfo,
  type AndesTooltipStylesInput,
} from './tooltip-semantic';

/**
 * Default open delay, in ms: long enough that a pointer sweeping across the page
 * does not flash hints.
 */
export const ANDES_TOOLTIP_DEFAULT_OPEN_DELAY = 600;

/**
 * Default close delay, in ms. `0`: a tooltip is a
 * passive hint, so blur closes it promptly. Leaving with the pointer still
 * waits at least `ANDES_TOOLTIP_HOVERABLE_GRACE` while the tooltip is
 * hoverable (the default), so the pointer can cross onto it.
 */
export const ANDES_TOOLTIP_DEFAULT_CLOSE_DELAY = 0;

/**
 * Default "instant reopen" grouping window, in ms: if another `<andes-tooltip>`
 * anywhere on the page closed within this window, the next one to open skips
 * `openDelay` entirely. The window exists for exactly this case - e.g. sweeping across a
 * toolbar of icon buttons should feel instant after the first tooltip opens.
 */
export const ANDES_TOOLTIP_DEFAULT_INSTANT_REOPEN_WINDOW = 400;

/**
 * Default triggers. `focus` is included alongside `hover` so keyboard users
 * get the same hint mouse users do, per the WAI-ARIA tooltip pattern.
 */
export const ANDES_TOOLTIP_DEFAULT_TRIGGERS: readonly AndesTooltipTriggerAction[] =
  ['hover', 'focus'];

/**
 * Semantic color presets, each backed by an existing `--andes-color-*` /
 * `--andes-color-*-foreground` token pair. For a hue with no andes-ng token,
 * pass any CSS color instead - or one of {@link ANDES_TOOLTIP_HUE_COLORS}.
 */
export const ANDES_TOOLTIP_PRESET_COLORS = [
  'primary',
  'secondary',
  'success',
  'warning',
  'danger',
  'info',
] as const;

/**
 * Named hues, with the names and the fills of Ant Design's preset colours, for a
 * tooltip that labels rather than themes. A hue is the same in both themes.
 */
export const ANDES_TOOLTIP_HUE_COLORS = [
  'pink',
  'red',
  'yellow',
  'orange',
  'cyan',
  'green',
  'blue',
  'purple',
  'geekblue',
  'magenta',
  'volcano',
  'gold',
  'lime',
] as const;

/** One of {@link ANDES_TOOLTIP_HUE_COLORS}. */
export type AndesTooltipHueColor = (typeof ANDES_TOOLTIP_HUE_COLORS)[number];

/** One of {@link ANDES_TOOLTIP_PRESET_COLORS} or {@link ANDES_TOOLTIP_HUE_COLORS}. */
export type AndesTooltipPresetColor =
  (typeof ANDES_TOOLTIP_PRESET_COLORS)[number] | AndesTooltipHueColor;

/**
 * The tooltip's surface: `default` is a near-black one with white text (a lifted grey on
 * a dark page), as in Ant Design; `light` follows the theme's popover surface instead
 * (light on a light page, dark on a dark one); `inverse` is always a dark slate surface
 * with light text.
 */
export type AndesTooltipVariant = 'default' | 'light' | 'inverse';

/** What the `content` input accepts: text, a template, or a function returning either. */
export type AndesTooltipContentInput =
  | string
  | TemplateRef<unknown>
  | null
  | undefined
  | (() => string | TemplateRef<unknown> | null | undefined);

/** What `openChangeDetail` emits: the new state, and what caused it. */
export interface AndesTooltipOpenChange {
  readonly open: boolean;
  readonly source: AndesTooltipChangeSource;
}

function isPresetColor(value: string): value is AndesTooltipPresetColor {
  return (
    (ANDES_TOOLTIP_PRESET_COLORS as readonly string[]).includes(value) ||
    isHueColor(value)
  );
}

function isHueColor(value: string): value is AndesTooltipHueColor {
  return (ANDES_TOOLTIP_HUE_COLORS as readonly string[]).includes(value);
}

/** How long, in ms, a `unique` group's tooltip takes to glide to the next trigger. */
export const ANDES_TOOLTIP_HANDOFF_DURATION = 200;

/** Why the overlay closed, as a tooltip change source, when no interaction said otherwise. */
function closeSourceOf(
  reason: AndesOverlayCloseReason,
): AndesTooltipChangeSource {
  return reason === 'escape-key' || reason === 'outside-click'
    ? reason
    : 'imperative';
}

function prefersReducedMotion(): boolean {
  return (
    typeof matchMedia === 'function' &&
    matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/**
 * A hover/focus-triggered hint attached to a trigger element.
 *
 * Compound API, split into `Tooltip` / `TooltipTrigger` /
 * `TooltipContent`:
 *
 * ```html
 * <andes-tooltip content="Delete this project">
 *   <button andesTooltipTrigger aria-label="Delete">
 *     <ng-icon name="lucideTrash2" />
 *   </button>
 * </andes-tooltip>
 * ```
 *
 * Rich content uses `AndesTooltipContent` (or a `TemplateRef` passed to
 * `content`) instead of a string:
 *
 * ```html
 * <andes-tooltip>
 *   <button andesTooltipTrigger>Status</button>
 *   <ng-template andesTooltipContent>
 *     Last synced <strong>{{ lastSynced() | date: 'short' }}</strong>
 *   </ng-template>
 * </andes-tooltip>
 * ```
 *
 * `AndesTooltip` itself renders no visible DOM for the trigger - it only
 * projects it (`<ng-content />`) - and owns the overlay content's wrapper, so
 * that the popup's markup, `role="tooltip"` and `id` (via
 * `AndesOverlayContentPrimitive`) always come from one place, regardless of
 * which content style a caller uses. It never receives focus itself
 * (`autoFocus: 'none'`, `trapFocus: false`, per the `tooltip` overlay preset)
 * and is announced to assistive tech via `aria-describedby` on the trigger,
 * wired by `AndesTooltipTrigger` - not `aria-labelledby`, since the tooltip
 * describes the trigger rather than naming it.
 *
 * ## Styling
 *
 * The tooltip is portalled into the CDK overlay container, outside the
 * trigger's DOM, so it is styled through inputs (`color`, `variant`, `maxWidth`,
 * `tooltipClass`, `classNames`, `styles`) and four CSS custom properties that can
 * be set on `:root` or on a `tooltipClass` selector: `--andes-tooltip-background`,
 * `--andes-tooltip-foreground`, `--andes-tooltip-border-color` and
 * `--andes-tooltip-max-width`. `classNames` and `styles` reach the tooltip's three
 * parts one by one - `root`, `container` and `arrow` - as objects or as functions
 * of the tooltip's props.
 *
 * ## Smooth transition
 *
 * A `unique` group (`andesTooltipProvider`, `provideAndesTooltipConfig`) shows one
 * tooltip at a time and glides it from trigger to trigger.
 */
@Component({
  selector: 'andes-tooltip',
  imports: [NgTemplateOutlet, AndesOverlayContentPrimitive],
  templateUrl: './tooltip.html',
  styleUrl: './tooltip.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [provideAndesOverlay(), AndesTooltipHoverIntent],
  host: {
    '[attr.data-disabled-trigger]': 'intent.triggerDisabled() ? "" : null',
    '(pointerenter)': 'intent.pointerEnter($event, "wrapper")',
    '(pointerleave)': 'intent.pointerLeave($event, "wrapper")',
    '(pointerdown)': 'intent.pointerDown($event, "wrapper")',
    '(pointerup)': 'onWrapperPointerUp($event)',
    '(pointercancel)': 'onWrapperPointerUp($event)',
    '(click)': 'intent.click("wrapper")',
    '(contextmenu)': 'intent.contextMenu($event, "wrapper")',
  },
})
export class AndesTooltip {
  protected readonly overlay = inject(AndesOverlayPrimitive);
  protected readonly intent = inject(AndesTooltipHoverIntent);
  private readonly hostElement =
    inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  /**
   * Tooltip content: plain text, or a `TemplateRef` for rich content. It is not
   * named `title` because a static `title` attribute would also give the host a
   * native browser tooltip. A projected `<ng-template andesTooltipContent>`
   * takes precedence. With no content at all - `null`, `undefined` or an empty string -
   * the tooltip does not open. A function is called while the tooltip renders, so a
   * signal it reads keeps the content up to date.
   */
  readonly content = input<AndesTooltipContentInput>('');

  /**
   * Named placement shorthand (`top`, `topLeft`, `rightBottom`, ... - all 12). When set, it overrides `side` and `align`.
   */
  readonly placement = input<AndesTooltipPlacement | null | undefined>(null);
  /** Preferred side of the trigger. Default `'top'`. Overridden by `placement`. */
  readonly side = input<AndesOverlaySide>('top');
  /** Alignment along that side. Default `'center'`. Overridden by `placement`. */
  readonly align = input<AndesOverlayAlign>('center');
  /**
   * Gap in px between the trigger and the tooltip - measured to the arrow's
   * tip while the arrow is shown. Default `6`.
   */
  readonly sideOffset = input(6);
  /** Extra px offset along the alignment axis. Default `0`. */
  readonly alignOffset = input(0);

  /**
   * Whether to draw an arrow pointing at the trigger. `{ pointAtCenter: true }`
   * shifts an edge-aligned tooltip (`topLeft`, ...) so the arrow lands on the
   * trigger's center. The arrow follows the tooltip through flips and shifts.
   * Default `true`.
   */
  readonly arrow = input<
    AndesTooltipArrowConfig | false,
    AndesTooltipArrowInput
  >({ pointAtCenter: false }, { transform: andesTooltipArrowAttribute });

  /**
   * Flip to the opposite side, and shift along the trigger, when the tooltip
   * would otherwise overflow the viewport. It never moves to the sides
   * perpendicular to the one asked for. Default `true`.
   */
  readonly autoAdjustOverflow = input(true, { transform: booleanAttribute });

  /**
   * What opens the tooltip: `'hover'`, `'focus'`, `'click'`, `'contextMenu'`,
   * or an array of them. Default `['hover', 'focus']`.
   */
  readonly trigger = input<
    AndesTooltipTriggerAction | readonly AndesTooltipTriggerAction[]
  >(ANDES_TOOLTIP_DEFAULT_TRIGGERS);

  /**
   * Disables the tooltip entirely: it never opens, and closes immediately if
   * it happened to already be open when this flips to `true`.
   */
  readonly disabled = input(false, { transform: booleanAttribute });

  /**
   * Hover/focus delay, in ms, before the tooltip opens. Default: the tooltip
   * provider's, else `600`.
   */
  readonly openDelay = input<number | undefined>(undefined);
  /**
   * Delay, in ms, before the tooltip closes after mouse-leave/blur. Default:
   * the tooltip provider's, else `0`.
   */
  readonly closeDelay = input<number | undefined>(undefined);
  /**
   * Grouping window, in ms, for the cross-tooltip "instant reopen" pattern.
   * Default: the tooltip provider's, else `400`.
   */
  readonly instantReopenWindow = input<number | undefined>(undefined);

  /**
   * By default the pointer can move from the trigger onto the tooltip - to
   * read it, select its text or magnify it - without it closing, per WCAG
   * 2.1 SC 1.4.13 "Content on Hover or Focus". With `true`, the tooltip lets
   * the pointer pass straight through and closes as soon as it leaves the
   * trigger.
   */
  readonly disableHoverablePopup = input(false, {
    transform: booleanAttribute,
  });

  /**
   * Close a hover/focus tooltip when its trigger is pressed (mouse or pen),
   * and keep it closed until the pointer leaves the trigger. Ignored with a
   * `click` trigger, which toggles instead. Same name and default as Base
   * UI's `closeOnClick`. Default `true`.
   */
  readonly closeOnClick = input(true, { transform: booleanAttribute });

  /**
   * Whether the tooltip is open. Two-way bindable (`[(open)]`); `openChange`
   * fires whenever user interaction opens or closes it. Setting it opens or
   * closes the tooltip programmatically (never while `disabled`).
   */
  readonly open = model(false);

  /**
   * Whether the tooltip starts open, for one that is not controlled with `open`. Read once,
   * when the tooltip first renders.
   */
  readonly defaultOpen = input(false, { transform: booleanAttribute });

  /**
   * Fires with the new state and what caused it whenever user interaction opens or closes
   * the tooltip - the counterpart of `openChange`, which only carries the state. Not
   * fired for a change made through `open`.
   */
  readonly openChangeDetail = output<AndesTooltipOpenChange>();

  /**
   * Background color: a semantic preset (`primary`, `success`, `danger`, ...)
   * or any CSS color. The text color follows automatically - the preset's
   * `-foreground` token, or black/white by lightness for a custom color - and
   * the arrow always matches.
   */
  readonly color = input<AndesTooltipPresetColor | (string & {}) | null>(null);

  /**
   * The surface: `'default'` is a near-black one with white text (a lifted grey on a dark
   * page); `'light'` follows the theme's popover surface; `'inverse'` renders a dark slate
   * surface with light text in both themes (lifted a step off a dark page so it still reads
   * as a layer). A `color` takes precedence over all of them. Default `'default'`.
   */
  readonly variant = input<AndesTooltipVariant>('default');

  /** Max width of the tooltip: px as a number, or any CSS length. Default `250px`. */
  readonly maxWidth = input<number | string | null>(null);

  /** Extra classes on the tooltip element, a scoping hook for the CSS custom properties. */
  readonly tooltipClass = input<string | readonly string[] | null>(null);

  /**
   * Extra classes for the tooltip's parts (`root`, `container`, `arrow`), as an object or
   * as a function of the tooltip's props. `root` adds to `tooltipClass`.
   *
   * ```ts
   * classNames = { container: 'my-tooltip-box' };
   * classNames = ({ props }) => ({ container: props.arrow ? 'with-arrow' : 'plain' });
   * ```
   */
  readonly classNames = input<AndesTooltipClassNamesInput | null | undefined>(
    null,
  );

  /**
   * Inline styles for the tooltip's parts (`root`, `container`, `arrow`), as an object or
   * as a function of the tooltip's props. Properties are spelled the CSS way or in
   * camelCase, and a number means pixels.
   *
   * ```ts
   * styles = { container: { borderRadius: 12, boxShadow: 'inset 0 0 8px #ccc' } };
   * ```
   */
  readonly styles = input<AndesTooltipStylesInput | null | undefined>(null);

  /**
   * Explicit `z-index` for the tooltip's overlay, overriding the
   * `--andes-z-index-tooltip` token. Relative to other andes-ng overlays,
   * since they all live in the CDK overlay container.
   */
  readonly zIndex = input<number | null>(null);

  /**
   * Destroy the rendered content when the tooltip closes. By default it is
   * kept, detached, and re-attached on the next open, so a component inside
   * rich content keeps its state across openings.
   */
  readonly destroyOnHidden = input(false, { transform: booleanAttribute });

  /**
   * Keep kept-alive content updating while the tooltip is closed. By default
   * change detection is paused on hidden content and resumes on the next
   * open. Only meaningful without `destroyOnHidden`.
   */
  readonly fresh = input(false, { transform: booleanAttribute });

  private readonly projectedContent = contentChild(AndesTooltipContent);
  private readonly overlayTemplate =
    viewChild<TemplateRef<unknown>>('overlayTemplate');
  private readonly bodyTemplate =
    viewChild<TemplateRef<unknown>>('bodyTemplate');
  private readonly bodyCache = viewChild('bodyCache', {
    read: ViewContainerRef,
  });

  /** The `content` input with a function resolved to what it returns. */
  private readonly resolvedContent = computed(() => {
    const content = this.content();
    return typeof content === 'function' ? content() : content;
  });

  /** The rich-content template, when the caller provided one. */
  protected readonly richContent = computed(() => {
    const projected = this.projectedContent()?.templateRef;
    if (projected) {
      return projected;
    }
    const content = this.resolvedContent();
    return content instanceof TemplateRef ? content : null;
  });

  protected readonly textContent = computed(() => {
    const content = this.resolvedContent();
    return typeof content === 'string' ? content : '';
  });

  private readonly hasContent = computed(
    () => !!this.richContent() || this.textContent().trim() !== '',
  );

  private readonly openState = computed(() => booleanAttribute(this.open()));

  private readonly group = inject(AndesTooltipGroup);
  private readonly shared = inject(ANDES_TOOLTIP_CONFIG, { optional: true });
  /** The defaults of the tooltip provider above, or none. */
  private readonly sharedConfig = computed(() => this.shared?.config() ?? {});
  private readonly unique = computed(() => !!this.sharedConfig().unique);
  private readonly resolvedInstantReopenWindow = computed(
    () =>
      this.instantReopenWindow() ??
      this.sharedConfig().instantReopenWindow ??
      ANDES_TOOLTIP_DEFAULT_INSTANT_REOPEN_WINDOW,
  );

  private readonly sideAlign = computed(() => {
    const placement = this.placement();
    return placement
      ? andesTooltipPlacementToSideAlign(placement)
      : { side: this.side(), align: this.align() };
  });

  private readonly triggers = computed(() => {
    const trigger = this.trigger();
    return typeof trigger === 'string' ? [trigger] : trigger;
  });

  /** Trigger size, measured at open time, for `pointAtCenter`. */
  private readonly anchorSize = signal<{
    width: number;
    height: number;
  } | null>(null);

  /** The side the tooltip actually rendered on, after any flip. */
  protected readonly renderedSide = signal<AndesOverlaySide>('top');
  /** Arrow position along the tooltip's cross axis, in px, once measured. */
  protected readonly arrowOffset = signal<number | null>(null);

  private readonly positioning = computed<AndesOverlayConfig['positioning']>(
    () => {
      const { side, align } = this.sideAlign();
      const arrow = this.arrow();
      const anchorSize = this.anchorSize();
      const pointAtCenterShift =
        arrow && arrow.pointAtCenter && anchorSize
          ? andesTooltipPointAtCenterOffset(side, align, anchorSize)
          : 0;
      const adjust = this.autoAdjustOverflow();
      return {
        kind: 'anchored',
        side,
        align,
        sideOffset:
          this.sideOffset() + (arrow ? ANDES_TOOLTIP_ARROW_HEIGHT : 0),
        alignOffset: this.alignOffset() + pointAtCenterShift,
        flip: adjust,
        // Like Ant Design: move along the trigger to stay on screen, never to its other sides.
        crossSideFallback: false,
        shift: adjust,
      };
    },
  );

  /** What the function forms of `classNames` and `styles` are given. */
  private readonly semanticInfo = computed<AndesTooltipSemanticInfo>(() => {
    const { side, align } = this.sideAlign();
    const arrow = this.arrow();
    return {
      props: {
        placement: this.placement() ?? null,
        side,
        align,
        arrow: !!arrow,
        pointAtCenter: !!arrow && arrow.pointAtCenter,
        color: this.color(),
        variant: this.variant(),
        open: this.openState(),
      },
    };
  });

  private readonly semanticClassNames = computed(() => {
    const classNames = this.classNames();
    return (
      (typeof classNames === 'function'
        ? classNames(this.semanticInfo())
        : classNames) ?? {}
    );
  });

  private readonly semanticStyles = computed(() => {
    const styles = this.styles();
    return (
      (typeof styles === 'function' ? styles(this.semanticInfo()) : styles) ??
      {}
    );
  });

  protected readonly panelClasses = computed(() => {
    const color = this.color();
    const variant = this.variant();
    return clsx(
      'andes-tooltip',
      variant === 'inverse' && 'andes-tooltip--inverse',
      variant === 'light' && 'andes-tooltip--light',
      color && isPresetColor(color) && `andes-tooltip--${color}`,
      color && isHueColor(color) && 'andes-tooltip--hue',
      color && !isPresetColor(color) && 'andes-tooltip--custom-color',
      this.tooltipClass(),
      this.semanticClassNames().root,
    );
  });

  protected readonly containerClasses = computed(() =>
    clsx(this.semanticClassNames().container),
  );
  protected readonly arrowClasses = computed(() =>
    clsx(this.semanticClassNames().arrow),
  );
  protected readonly rootStyle = computed(() =>
    andesTooltipStyleObject(this.semanticStyles().root),
  );
  protected readonly containerStyle = computed(() =>
    andesTooltipStyleObject(this.semanticStyles().container),
  );
  protected readonly arrowStyle = computed(() =>
    andesTooltipStyleObject(this.semanticStyles().arrow),
  );

  protected readonly customColor = computed(() => {
    const color = this.color();
    return color && !isPresetColor(color) ? color : null;
  });

  protected readonly maxWidthValue = computed(() => {
    const maxWidth = this.maxWidth();
    if (maxWidth == null || maxWidth === '') {
      return null;
    }
    return typeof maxWidth === 'number' ? `${maxWidth}px` : maxWidth;
  });

  protected readonly arrowOffsetValue = computed(() => {
    const offset = this.arrowOffset();
    return offset == null ? null : `${offset}px`;
  });

  private bodyView: EmbeddedViewRef<unknown> | null = null;
  private positionObserver: MutationObserver | null = null;
  private layoutObserver: ResizeObserver | null = null;

  /** What asked for the open in flight, and for the close in flight. */
  private openSource: AndesTooltipChangeSource = 'imperative';
  private closeSource: AndesTooltipChangeSource | null = null;
  /** Where the previous tooltip of a `unique` group stood, to glide in from. */
  private handoffFrom: DOMRect | null = null;
  private defaultOpenApplied = false;

  private readonly groupMember = { dismiss: () => this.dismissNow() };

  constructor() {
    this.overlay.configure(andesOverlayPreset('tooltip'));

    this.intent.bind({
      open: (source) => this.show(source),
      close: (source) => {
        this.closeSource = source;
        this.overlay.close('imperative');
      },
    });

    this.overlay.opened
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.onOpened());
    this.overlay.closed
      .pipe(takeUntilDestroyed())
      .subscribe((reason) => this.onClosed(reason));

    inject(DestroyRef).onDestroy(() => {
      this.group.release(this.groupMember);
      this.positionObserver?.disconnect();
      this.layoutObserver?.disconnect();
      this.bodyView?.destroy();
      this.bodyView = null;
    });

    effect(() => {
      const positioning = this.positioning();
      untracked(() => this.configureOverlay({ positioning }));
    });

    effect(() => {
      const shared = this.sharedConfig();
      this.intent.configure({
        openDelay:
          this.openDelay() ??
          shared.openDelay ??
          ANDES_TOOLTIP_DEFAULT_OPEN_DELAY,
        closeDelay:
          this.closeDelay() ??
          shared.closeDelay ??
          ANDES_TOOLTIP_DEFAULT_CLOSE_DELAY,
        instantReopenWindow: this.resolvedInstantReopenWindow(),
        disabled: this.disabled(),
        triggers: this.triggers(),
        hoverable: !this.disableHoverablePopup(),
        closeOnClick: this.closeOnClick(),
        unique: this.unique(),
      });
    });

    // Only a tooltip the user opened by clicking is closed by clicking
    // elsewhere. A hover/focus tooltip already closes on leave
    // or blur, and closing a programmatically-opened one on any page click
    // would fight `[(open)]`.
    effect(() => {
      const triggers = this.triggers();
      const closeOnOutsideClick =
        triggers.includes('click') || triggers.includes('contextMenu');
      untracked(() => this.configureOverlay({ closeOnOutsideClick }));
    });

    // `open` -> overlay. The reverse direction (overlay -> `open`) is the
    // `opened`/`closed` subscriptions above, so user interaction and
    // programmatic control can never disagree for longer than one tick.
    effect(() => {
      const wanted = this.openState() && !this.disabled();
      // Tracked so an initially-`true` `open` waits for the template query.
      const template = this.overlayTemplate();
      untracked(() => {
        if (wanted && template && !this.overlay.isOpen()) {
          this.show('imperative');
        } else if (!wanted && this.overlay.isOpen()) {
          this.overlay.close('imperative');
        }
      });
    });

    // `defaultOpen`: the tooltip's first render, once its template is there. After that
    // the tooltip is the user's (or `open`'s) to open and close.
    effect(() => {
      const template = this.overlayTemplate();
      const wanted = this.defaultOpen();
      if (this.defaultOpenApplied || !template) {
        return;
      }
      this.defaultOpenApplied = true;
      if (wanted) {
        untracked(() => this.show('imperative'));
      }
    });

    effect(() => {
      this.zIndex();
      this.disableHoverablePopup();
      if (this.overlay.isOpen()) {
        untracked(() => this.configureOverlay({}));
      }
    });

    // Honour `destroyOnHidden`/`fresh` changing while the tooltip is closed.
    effect(() => {
      const destroy = this.destroyOnHidden();
      const fresh = this.fresh();
      if (this.overlay.isOpen()) {
        return;
      }
      untracked(() => {
        const view = this.bodyView;
        if (!view) {
          return;
        }
        if (destroy) {
          view.destroy();
          this.bodyView = null;
        } else if (fresh) {
          view.reattach();
        } else {
          view.detach();
        }
      });
    });
  }

  /**
   * Re-aligns an open tooltip with its trigger. Size changes of the trigger
   * or of the tooltip itself are already followed automatically; call this
   * after a layout change that moves the trigger without resizing either,
   * e.g. a sibling expanding above it. A no-op while closed.
   */
  updatePosition(): void {
    if (!this.overlay.isOpen()) {
      return;
    }
    this.overlay.updatePosition();
    this.measure();
  }

  protected onWrapperPointerUp(event: PointerEvent): void {
    if (this.intent.triggerDisabled()) {
      this.intent.pointerUp(event);
    }
  }

  /** Measures the trigger, then opens the overlay against it. */
  private show(source: AndesTooltipChangeSource): void {
    const template = this.overlayTemplate();
    if (
      !template ||
      this.overlay.isOpen() ||
      this.disabled() ||
      !this.hasContent()
    ) {
      return;
    }
    this.openSource = source;

    // A disabled trigger is `pointer-events: none` inside the host, which
    // has turned `inline-block` around it - anchor to that wrapper, so the
    // outside-click check sees the wrapper as "inside".
    const anchor = this.intent.triggerDisabled()
      ? this.hostElement
      : (this.intent.triggerTarget() ?? this.overlay.anchor());
    this.overlay.registerAnchor(anchor);
    if (anchor) {
      const rect = anchor.getBoundingClientRect();
      this.anchorSize.set({ width: rect.width, height: rect.height });
    }
    this.renderedSide.set(this.sideAlign().side);
    this.arrowOffset.set(null);
    this.configureOverlay({ positioning: this.positioning() });
    if (this.unique()) {
      this.handoffFrom = this.group.claim(
        this.groupMember,
        this.resolvedInstantReopenWindow(),
      );
    }
    this.overlay.open(template);
  }

  /** Closes at once, without the exit motion: the next tooltip of a `unique` group takes over. */
  private dismissNow(): void {
    this.overlay.contentElement()?.setAttribute('data-instant', '');
    this.closeSource = 'imperative';
    this.overlay.close('imperative');
  }

  /**
   * Every `configure()` re-applies the primitive's own layer `z-index`, so an
   * explicit `zIndex` has to be re-applied after it. The primitive has no
   * z-index override of its own; this writes the same inline style on the
   * same CDK host element it does.
   *
   * The CDK pane around the tooltip catches the pointer on its own, so with
   * `disableHoverablePopup` it is made `pointer-events: none` too - otherwise
   * the tooltip would still swallow clicks meant for whatever is beneath it.
   */
  private configureOverlay(patch: Partial<AndesOverlayConfig>): void {
    this.overlay.configure(patch);
    const zIndex = this.zIndex();
    const pane = this.overlay.panelElement();
    const host = pane?.parentElement;
    if (host && zIndex != null) {
      host.style.setProperty('z-index', String(zIndex));
    }
    if (pane) {
      pane.style.pointerEvents = this.disableHoverablePopup() ? 'none' : '';
    }
  }

  private onOpened(): void {
    // An exit cut short by this open keeps its element: it is a normal tooltip again.
    this.overlay.contentElement()?.removeAttribute('data-instant');
    this.attachBody();
    this.configureOverlay({});
    this.playHandoff();
    this.observePosition();
    this.observeLayout();
    if (!this.openState()) {
      this.open.set(true);
      this.openChangeDetail.emit({ open: true, source: this.openSource });
    }
  }

  private onClosed(reason: AndesOverlayCloseReason): void {
    this.group.release(this.groupMember);
    this.positionObserver?.disconnect();
    this.positionObserver = null;
    this.layoutObserver?.disconnect();
    this.layoutObserver = null;

    const view = this.bodyView;
    if (view) {
      if (this.destroyOnHidden()) {
        view.destroy();
        this.bodyView = null;
      } else if (!this.fresh()) {
        view.detach();
      }
    }

    const source = this.closeSource ?? closeSourceOf(reason);
    this.closeSource = null;
    if (this.openState()) {
      this.open.set(false);
      this.openChangeDetail.emit({ open: false, source });
    }
  }

  /**
   * In a `unique` group, starts the tooltip where the previous one stood and glides it
   * to its own place, so the two read as one tooltip moving between triggers.
   */
  private playHandoff(): void {
    const from = this.handoffFrom;
    this.handoffFrom = null;
    const root = this.overlay.contentElement();
    const pane = this.overlay.panelElement();
    if (
      !from ||
      !root ||
      !pane ||
      typeof root.animate !== 'function' ||
      prefersReducedMotion()
    ) {
      return;
    }
    // The CDK places the pane once the tooltip is stable; the glide needs the final spot.
    this.overlay.updatePosition();
    const to = pane.getBoundingClientRect();
    const dx = from.left - to.left;
    const dy = from.top - to.top;
    if (
      (to.width === 0 && to.height === 0) ||
      (Math.abs(dx) < 1 && Math.abs(dy) < 1)
    ) {
      return;
    }
    root.setAttribute('data-handoff', '');
    const glide = root.animate(
      [{ translate: `${dx}px ${dy}px` }, { translate: '0 0' }],
      {
        duration: ANDES_TOOLTIP_HANDOFF_DURATION,
        easing: 'cubic-bezier(0.645, 0.045, 0.355, 1)',
      },
    );
    const done = () => root.removeAttribute('data-handoff');
    glide.addEventListener('finish', done);
    glide.addEventListener('cancel', done);
  }

  /**
   * Renders the content into the freshly-opened overlay. The content lives in
   * its own embedded view, owned by this component rather than by the
   * overlay's (which the CDK destroys on every close), and only its DOM is
   * moved into the overlay - that is what lets it outlive a close when
   * `destroyOnHidden` is off.
   */
  private attachBody(): void {
    const host = this.overlay.contentElement();
    const cache = this.bodyCache();
    const template = this.bodyTemplate();
    if (!host || !cache || !template) {
      return;
    }
    if (!this.bodyView || this.bodyView.destroyed) {
      this.bodyView = cache.createEmbeddedView(template);
    } else {
      this.bodyView.reattach();
    }
    this.bodyView.detectChanges();
    for (const node of this.bodyView.rootNodes as Node[]) {
      host.appendChild(node);
    }
  }

  /**
   * The CDK repositions (and possibly flips) the pane on open, scroll and
   * resize, by rewriting its inline styles, without telling the primitive
   * which fallback position it picked. Watching those style writes is the
   * cheapest way to keep the arrow on the side - and at the spot - the
   * tooltip actually rendered at.
   */
  private observePosition(): void {
    const pane = this.overlay.panelElement();
    if (!pane) {
      return;
    }
    this.measure();
    if (typeof MutationObserver === 'undefined') {
      return;
    }
    this.positionObserver = new MutationObserver(() => this.measure());
    const options = { attributes: true, attributeFilter: ['style', 'class'] };
    this.positionObserver.observe(pane, options);
    if (pane.parentElement) {
      this.positionObserver.observe(pane.parentElement, options);
    }
  }

  /**
   * Keeps an open tooltip glued to its trigger when either one changes size -
   * a trigger whose label grows, or rich content that loads late. The CDK
   * only repositions on scroll and viewport resize on its own.
   */
  private observeLayout(): void {
    if (typeof ResizeObserver === 'undefined') {
      return;
    }
    const anchor = this.overlay.anchor();
    const content = this.overlay.contentElement();
    if (!anchor && !content) {
      return;
    }
    this.layoutObserver = new ResizeObserver(() => this.updatePosition());
    if (anchor) {
      this.layoutObserver.observe(anchor);
    }
    if (content) {
      this.layoutObserver.observe(content);
    }
  }

  private measure(): void {
    const pane = this.overlay.panelElement();
    const anchor = this.overlay.anchor();
    if (!pane || !anchor) {
      return;
    }
    const { side, align } = this.sideAlign();
    const anchorRect = anchor.getBoundingClientRect();
    const panelRect = pane.getBoundingClientRect();
    const rendered = andesTooltipResolveSide(anchorRect, panelRect, side);
    this.renderedSide.set(rendered);
    if (this.unique()) {
      this.group.update(this.groupMember, panelRect);
    }

    const arrow = this.arrow();
    if (!arrow || (panelRect.width === 0 && panelRect.height === 0)) {
      return;
    }
    this.arrowOffset.set(
      andesTooltipArrowOffset(
        rendered,
        align,
        arrow.pointAtCenter,
        anchorRect,
        panelRect,
      ),
    );
  }
}
