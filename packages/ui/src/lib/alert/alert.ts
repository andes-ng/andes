import { DOCUMENT, NgTemplateOutlet } from '@angular/common';
import {
  afterNextRender,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  Injector,
  input,
  output,
  signal,
  TemplateRef,
  viewChild,
} from '@angular/core';
import clsx from 'clsx';

export type AndesAlertSeverity = 'success' | 'info' | 'warning' | 'danger';
export type AndesAlertRole = 'alert' | 'status';
/**
 * `tinted` fills the card with a soft wash of the severity color and draws a stronger tinted
 * border; `filled` keeps the same wash but drops the border, for alerts sitting on a busy
 * surface where an extra outline only adds noise; `outlined` keeps the neutral card surface
 * and carries the severity only in the icon and a tinted border.
 */
export type AndesAlertVariant = 'tinted' | 'filled' | 'outlined';
/**
 * `bottom` stacks the action under the text, for messages with room to breathe; `end` puts it
 * beside the text at the inline-end edge, lined up with the first line, so a one-line notice
 * with a short action ("Undo", "Retry") stays one line tall.
 */
export type AndesAlertActionPlacement = 'bottom' | 'end';

/** The visible parts of an alert that `classNames` and `styles` can address. */
export type AndesAlertPart =
  'root' | 'icon' | 'section' | 'title' | 'description' | 'actions' | 'close';

/** Extra class names per part, e.g. `{ root: 'my-alert', title: 'my-alert-title' }`. */
export type AndesAlertClassNames = Partial<Record<AndesAlertPart, string>>;

/**
 * Inline styles for one part. Keys may be camelCase (`backgroundColor`), dash-case
 * (`background-color`) or custom properties (`--andes-alert-success-bg`).
 */
export type AndesAlertPartStyle = Record<string, string | number | null>;

/** Inline styles per part, e.g. `{ root: { borderWidth: '2px' }, icon: { marginTop: '4px' } }`. */
export type AndesAlertStyles = Partial<
  Record<AndesAlertPart, AndesAlertPartStyle>
>;

/** What a `classNames` / `styles` function is told about the alert it styles. */
export interface AndesAlertSemanticInfo {
  props: {
    /** The resolved severity - i.e. after `banner`'s `warning` default has been applied. */
    severity: AndesAlertSeverity;
    variant: AndesAlertVariant;
    banner: boolean;
    closable: boolean;
    showIcon: boolean;
    marquee: boolean;
    actionPlacement: AndesAlertActionPlacement;
  };
}

/** A value for `classNames` / `styles`: a plain object, or a function of the alert's props. */
export type AndesAlertSemanticValue<T> =
  T | ((info: AndesAlertSemanticInfo) => T) | null | undefined;

/** Context handed to every template input (`icon`, `title`, `description`, `action`, `closeIcon`). */
export interface AndesAlertTemplateContext {
  /** The resolved severity - i.e. after `banner`'s `warning` default has been applied. */
  $implicit: AndesAlertSeverity;
  severity: AndesAlertSeverity;
}

/** Content inputs accept plain text for the common case and a template for rich content. */
export type AndesAlertContent =
  string | TemplateRef<AndesAlertTemplateContext> | null | undefined;

/**
 * Emitted by `closing` before the alert starts hiding. Beyond observing the dismissal,
 * `preventDefault()` lets a consumer veto it (e.g. to confirm first, or to keep the alert until
 * a request settles) without having to own the visibility state themselves.
 */
export class AndesAlertCloseEvent {
  private prevented = false;

  constructor(
    readonly source: AndesAlert,
    readonly originalEvent: MouseEvent,
  ) {}

  get defaultPrevented(): boolean {
    return this.prevented;
  }

  preventDefault(): void {
    this.prevented = true;
  }
}

/**
 * Collapse duration and easing, the same 0.3s ease-in-out-circ that Ant Design uses to unmount
 * an alert. There is no motion token for them in `@andes-ng/tokens` yet, so they live here
 * rather than in the stylesheet.
 */
const COLLAPSE_DURATION_MS = 300;
const COLLAPSE_EASING = 'cubic-bezier(0.78, 0.14, 0.15, 0.86)';

/**
 * Used until the marquee track has been measured, and wherever it can't be (SSR, jsdom). Slow
 * enough to read along without chasing the words.
 */
const DEFAULT_MARQUEE_SPEED = 40;

/** Natively keyboard-focusable elements, plus anything opted in with a tabindex. */
const FOCUSABLE_SELECTOR = [
  'a[href]',
  'area[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'iframe',
  '[contenteditable]:not([contenteditable="false"])',
  '[tabindex]',
].join(',');

@Component({
  selector: 'andes-alert',
  imports: [NgTemplateOutlet],
  templateUrl: './alert.html',
  styleUrl: './alert.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    // The `role` input is forwarded to the inner div in the template - a static or bound
    // `role` attribute matching an input's name is otherwise ALSO applied to this host
    // element by Angular, producing two elements (host + inner div) both carrying
    // role="alert"/"status", which assistive tech reads as two separate live regions with
    // duplicate content. Null it out here so only the inner div carries it.
    '[attr.role]': 'null',
    // Same trap for `title`: a static `title="..."` would otherwise also become the native
    // tooltip attribute on the host, popping the alert's heading up as a hover tooltip over
    // the whole card.
    '[attr.title]': 'null',
    // Hiding the inner card alone would leave an empty block box behind, which still takes a
    // `gap` slot in the consumer's flex/grid layout after the alert is dismissed.
    '[style.display]': 'visible() ? null : "none"',
  },
})
export class AndesAlert {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);
  private readonly document = inject(DOCUMENT);

  /** Left unset, resolves to `info` - or to `warning` in `banner` mode. */
  readonly severity = input<AndesAlertSeverity | undefined>(undefined);
  readonly variant = input<AndesAlertVariant>('tinted');
  readonly closable = input(false, { transform: booleanAttribute });
  readonly showIcon = input(true, { transform: booleanAttribute });
  /**
   * Full-width, square-cornered strip for the top of a page or panel. It keeps the card's quiet
   * language - neutral surface, tinted hairline - and only drops what makes it read as a
   * floating card: the radius and the inline-side borders.
   */
  readonly banner = input(false, { transform: booleanAttribute });
  /**
   * Scrolls the description across the alert in a continuous loop, for a one-line notice that
   * is longer than the space it gets (typically inside a `banner`). The loop pauses while the
   * pointer is over the alert or focus is inside it, and is replaced by the normal wrapped text
   * under prefers-reduced-motion.
   */
  readonly marquee = input(false, { transform: booleanAttribute });
  /** Marquee speed in pixels per second, so long and short messages travel at the same pace. */
  readonly marqueeSpeed = input(DEFAULT_MARQUEE_SPEED);
  /**
   * Overrides the automatically-picked ARIA role. Leave unset unless the consumer knows
   * better than the component's own default whether this alert is static page content or a
   * dynamically-inserted announcement - see the default logic in `resolvedRole` below.
   */
  readonly role = input<AndesAlertRole | undefined>(undefined);
  readonly closeLabel = input('Close');
  /**
   * Visible text for the close button instead of the (x) glyph, for a dismissal that reads as an
   * acknowledgement ("Got it", "Dismiss"). The text is then the button's accessible name -
   * `closeLabel` is dropped so the spoken name always matches what is on screen. A `closeIcon`
   * template still wins over it.
   */
  readonly closeText = input<string | null>(null);
  /**
   * Keeps the close button visible but inert - e.g. while the request the alert reports on is
   * still in flight. Native `disabled`, so the button also leaves the tab order.
   */
  readonly closeDisabled = input(false, { transform: booleanAttribute });
  readonly actionPlacement = input<AndesAlertActionPlacement>('bottom');

  /**
   * Extra class names for the alert's parts (`root`, `icon`, `section`, `title`, `description`,
   * `actions`, `close`), as an object or as a function of the alert's props - so a consumer can
   * style one part without reaching into the component's encapsulated stylesheet. The
   * component's own rules are scoped to it, so a consumer rule made of one class loses to
   * them: repeat the class (`.mine.mine`) to out-weigh it, or use `styles`, which always wins.
   */
  readonly classNames =
    input<AndesAlertSemanticValue<AndesAlertClassNames>>(undefined);
  /** Inline styles for the same parts as `classNames`; takes an object or a function too. */
  readonly styles = input<AndesAlertSemanticValue<AndesAlertStyles>>(undefined);

  /** Replaces the built-in severity glyph. Still gated by `showIcon`, still severity-tinted. */
  readonly icon = input<TemplateRef<AndesAlertTemplateContext> | null>(null);
  /** Replaces the built-in close (x) glyph. The button keeps `closeLabel` as its name. */
  readonly closeIcon = input<TemplateRef<AndesAlertTemplateContext> | null>(
    null,
  );
  /** Alternative to projecting `[slot=title]`; when set it wins over the slot. */
  readonly title = input<AndesAlertContent>(null);
  /** Alternative to projecting default content; when set it wins over the projection. */
  readonly description = input<AndesAlertContent>(null);
  /** Alternative to projecting `[slot=action]`; when set it wins over the slot. */
  readonly action = input<TemplateRef<AndesAlertTemplateContext> | null>(null);

  /**
   * Fires when the close button is activated, before anything is hidden. Call
   * `preventDefault()` on the event to keep the alert open.
   */
  readonly closing = output<AndesAlertCloseEvent>();
  /** Fires once the alert has finished collapsing and is no longer rendered. */
  readonly afterClose = output<void>();

  protected readonly visible = signal(true);
  private readonly leaving = signal(false);

  private readonly card = viewChild<ElementRef<HTMLElement>>('card');
  private readonly marqueeTrack =
    viewChild<ElementRef<HTMLElement>>('marqueeTrack');
  /** Width of the marquee track - its own content plus the one-column run-in before it. */
  private readonly marqueeDistance = signal<number | null>(null);

  /**
   * One pass has to cover the whole track, so the duration grows with the message instead of
   * long messages racing past. Null until measured, leaving the stylesheet's fallback in place.
   */
  protected readonly marqueeDuration = computed(() => {
    const distance = this.marqueeDistance();
    const speed = this.marqueeSpeed();
    if (!distance || !(speed > 0)) return null;
    return `${Math.round((distance / speed) * 100) / 100}s`;
  });

  constructor() {
    effect((onCleanup) => {
      const track = this.marqueeTrack()?.nativeElement;
      const view = this.document.defaultView;
      if (!track || typeof view?.ResizeObserver !== 'function') {
        this.marqueeDistance.set(null);
        return;
      }
      // Measured once up front as well: resize callbacks only fire while the page is being
      // rendered, so a tab opened in the background would otherwise keep the fallback pace.
      this.marqueeDistance.set(track.offsetWidth);
      const observer = new view.ResizeObserver(() =>
        this.marqueeDistance.set(track.offsetWidth),
      );
      observer.observe(track);
      onCleanup(() => observer.disconnect());
    });
  }

  protected readonly showCloseText = computed(
    () => !this.closeIcon() && !!this.closeText(),
  );

  protected readonly closeAriaLabel = computed(() =>
    this.showCloseText() ? null : this.closeLabel(),
  );

  protected readonly resolvedSeverity = computed<AndesAlertSeverity>(
    () => this.severity() ?? (this.banner() ? 'warning' : 'info'),
  );

  protected readonly templateContext = computed<AndesAlertTemplateContext>(
    () => ({
      $implicit: this.resolvedSeverity(),
      severity: this.resolvedSeverity(),
    }),
  );

  protected readonly titleTemplate = computed(() => asTemplate(this.title()));
  protected readonly titleText = computed(() => asText(this.title()));
  protected readonly descriptionTemplate = computed(() =>
    asTemplate(this.description()),
  );
  protected readonly descriptionText = computed(() =>
    asText(this.description()),
  );

  /**
   * There is no single standard default ARIA role for an alert (see
   * docs/research/components/alert.md, section 4). The generally-accepted rule is:
   * `role="status"` (polite) for a non-urgent alert that is part of the page's static/initial
   * content, and `role="alert"` (assertive) for one that appears dynamically and needs
   * immediate announcement. This component can't know at render time whether a consumer is
   * about to *ngIf/@if it into existence in response to a user action (dynamic) or render it
   * as part of the initial page (static) - so it falls back to a severity-driven default
   * (danger implies "something just went wrong, interrupt me" far more often than the other
   * three severities, which are more commonly static/confirmatory) while still letting a
   * consumer who knows better override it via the `role` input.
   */
  protected readonly resolvedRole = computed<AndesAlertRole>(
    () =>
      this.role() ??
      (this.resolvedSeverity() === 'danger' ? 'alert' : 'status'),
  );

  /**
   * State modifiers on the card, so consumer styles (and unit tests) can key off the layout
   * without having to inspect which parts happen to be rendered.
   */
  protected readonly classes = computed(() =>
    clsx(
      'andes-alert',
      `andes-alert--${this.resolvedSeverity()}`,
      `andes-alert--${this.variant()}`,
      {
        'andes-alert--no-icon': !this.showIcon(),
        'andes-alert--closable': this.closable(),
        'andes-alert--banner': this.banner(),
        'andes-alert--marquee': this.marquee(),
        'andes-alert--action-end': this.actionPlacement() === 'end',
      },
      this.partClassNames().root,
    ),
  );

  private readonly semanticInfo = computed<AndesAlertSemanticInfo>(() => ({
    props: {
      severity: this.resolvedSeverity(),
      variant: this.variant(),
      banner: this.banner(),
      closable: this.closable(),
      showIcon: this.showIcon(),
      marquee: this.marquee(),
      actionPlacement: this.actionPlacement(),
    },
  }));

  protected readonly partClassNames = computed<AndesAlertClassNames>(() =>
    resolveSemantic(this.classNames(), this.semanticInfo()),
  );

  protected readonly partStyles = computed<AndesAlertStyles>(() =>
    resolveSemantic(this.styles(), this.semanticInfo()),
  );

  protected dismiss(event: MouseEvent): void {
    // `disabled` already blocks real clicks; this also covers a synthetic `click()`.
    if (this.leaving() || this.closeDisabled()) return;

    const closeEvent = new AndesAlertCloseEvent(this, event);
    this.closing.emit(closeEvent);
    if (closeEvent.defaultPrevented) return;

    this.leaving.set(true);
    const animation = this.collapse();
    if (!animation) {
      this.finishClose();
      return;
    }
    animation.finished.then(
      () => this.finishClose(animation),
      // Cancelled (e.g. the host was destroyed mid-collapse) - nothing left to hide.
      () => undefined,
    );
  }

  /**
   * Squeezes the card - its height and vertical padding shrink to nothing while it fades out -
   * so content below slides up instead of jumping. Returns null - hide instantly - when the
   * user asked for reduced motion, or where the Web Animations API isn't available (SSR,
   * jsdom).
   */
  private collapse(): Animation | null {
    const card = this.card()?.nativeElement;
    const view = this.document.defaultView;
    if (!card || typeof card.animate !== 'function') return null;
    if (view?.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      return null;
    }

    const style = view?.getComputedStyle(card);
    const height = style?.height.endsWith('px')
      ? style.height
      : `${card.offsetHeight}px`;
    card.style.overflow = 'hidden';
    // Height, padding and opacity run together over the whole duration, as in Ant Design.
    return card.animate(
      [
        {
          height,
          paddingBlock: style?.paddingBlock || '0px',
          opacity: 1,
        },
        { height: '0px', paddingBlock: '0px', opacity: 0 },
      ],
      {
        duration: COLLAPSE_DURATION_MS,
        easing: COLLAPSE_EASING,
        // Hold the collapsed frame until `display: none` has actually been rendered, so the
        // card can't flash back to full height for one frame in between.
        fill: 'forwards',
      },
    );
  }

  private finishClose(animation?: Animation): void {
    this.restoreFocus();
    this.visible.set(false);
    afterNextRender(
      () => {
        animation?.cancel();
        this.card()?.nativeElement.style.removeProperty('overflow');
        this.afterClose.emit();
      },
      { injector: this.injector },
    );
  }

  /**
   * Hiding the alert removes the focused close button, which would drop focus to <body> and
   * send keyboard and screen reader users back to the top of the page. If focus is still inside
   * the alert, move it to the next tabbable element after the alert in DOM order, else the
   * previous one, else the closest focusable ancestor (e.g. a container with tabindex="-1").
   * Focus that has already moved elsewhere (the user tabbed away mid-collapse) is left alone.
   */
  private restoreFocus(): void {
    const host = this.host.nativeElement;
    if (!host.contains(this.document.activeElement)) return;

    const candidates = Array.from(
      this.document.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
    ).filter((el) => !host.contains(el) && isTabbable(el));
    const next = candidates.find(
      (el) =>
        host.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING,
    );
    const previous = candidates
      .filter(
        (el) =>
          host.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_PRECEDING,
      )
      .at(-1);
    const ancestor = host.parentElement?.closest<HTMLElement>('[tabindex]');
    (next ?? previous ?? ancestor)?.focus();
  }
}

function isTabbable(el: HTMLElement): boolean {
  if (el.tabIndex < 0 || el.closest('[hidden], [inert]')) return false;
  // Catches `display: none` / `visibility: hidden` where layout exists (not in SSR or jsdom).
  return typeof el.checkVisibility !== 'function' || el.checkVisibility();
}

function resolveSemantic<T extends object>(
  value: AndesAlertSemanticValue<T>,
  info: AndesAlertSemanticInfo,
): T {
  const resolved = typeof value === 'function' ? value(info) : value;
  return resolved ?? ({} as T);
}

function asTemplate(
  content: AndesAlertContent,
): TemplateRef<AndesAlertTemplateContext> | null {
  return content instanceof TemplateRef ? content : null;
}

function asText(content: AndesAlertContent): string | null {
  return typeof content === 'string' && content !== '' ? content : null;
}
