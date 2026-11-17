import { AndesButtonPrimitive } from '@andes-ng/primitives';
import { NgTemplateOutlet } from '@angular/common';
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  DOCUMENT,
  effect,
  ElementRef,
  ErrorHandler,
  inject,
  input,
  isDevMode,
  Renderer2,
  signal,
  TemplateRef,
} from '@angular/core';
import clsx from 'clsx';

import { injectAndesFieldBinding } from '../form-field/field-binding';
import { ANDES_BUTTON_CONTEXT } from './button-context';
import { ANDES_BUTTON_GROUP } from './button-group';

export type AndesButtonVariant =
  | 'primary'
  | 'secondary'
  | 'danger'
  | 'outline'
  | 'dashed'
  | 'filled'
  | 'ghost'
  | 'link';
export type AndesButtonSize =
  'xs' | 'sm' | 'md' | 'lg' | 'icon-xs' | 'icon-sm' | 'icon' | 'icon-lg';
/** `full` and `round` are the same pill shape; `circle` is fully rounded with equal sides. */
export type AndesButtonShape = 'default' | 'full' | 'round' | 'circle';
/**
 * Semantic color that tints the `primary` (solid), `outline`, `dashed`, `filled`, `ghost` and
 * `link` variants. The `secondary` and `danger` variants keep their own palette.
 */
export type AndesButtonColor =
  'primary' | 'danger' | 'success' | 'warning' | 'info';
export type AndesButtonType = 'button' | 'submit' | 'reset';
/**
 * Resting shadow depth for a floating button (a floating action button): `none` is the flat
 * default, the other steps map to the small, medium and large shadow tokens.
 */
export type AndesButtonElevation = 'none' | 'low' | 'medium' | 'high';
/**
 * What `clickAction` runs: a function that may return a promise. The button shows its loading
 * state until the promise settles.
 */
export type AndesButtonClickAction = (
  event: MouseEvent,
) => void | PromiseLike<unknown>;
/** The values `aria-current` takes: which item of a set is the current one. */
export type AndesButtonAriaCurrent =
  'page' | 'step' | 'location' | 'date' | 'time' | 'true' | 'false';

const RIPPLE_DURATION_MS = 400;

function isThenable(value: unknown): value is PromiseLike<unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as PromiseLike<unknown>).then === 'function'
  );
}

@Component({
  selector: 'andes-button',
  imports: [AndesButtonPrimitive, NgTemplateOutlet],
  templateUrl: './button.html',
  styleUrl: './button.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(pointerdown)': 'onPointerDown($event)',
    // Forwarded to the real button/anchor in the template instead - a screen reader never
    // sees this non-interactive host element, so leaving these here would do nothing.
    '[attr.aria-label]': 'null',
    '[attr.aria-labelledby]': 'null',
    '[attr.aria-describedby]': 'null',
    '[attr.aria-invalid]': 'null',
    '[attr.aria-current]': 'null',
  },
})
export class AndesButton {
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly renderer = inject(Renderer2);
  private readonly document = inject(DOCUMENT);
  private readonly group = inject(ANDES_BUTTON_GROUP, { optional: true });
  private readonly context = inject(ANDES_BUTTON_CONTEXT, { optional: true });

  readonly variant = input<AndesButtonVariant>('primary');
  /**
   * Control size. Left unset, the button takes the size of an enclosing `andes-button-group`,
   * else of an enclosing `andesForm`, else `md`.
   */
  readonly size = input<AndesButtonSize | undefined>(undefined);
  readonly shape = input<AndesButtonShape>('default');
  readonly color = input<AndesButtonColor | undefined>(undefined);
  /** Shorthand for `color="danger"`: a destructive action in any variant. Wins over `color`. */
  readonly danger = input(false, { transform: booleanAttribute });
  /** Press feedback ripple. Turn it off for dense toolbars or custom press styling. */
  readonly ripple = input(true, { transform: booleanAttribute });
  /**
   * Press feedback scale: while pressed the button scales a little (`--andes-button-press-scale`,
   * 0.98 by default) with a short ease. Disabled and loading buttons, links and users who prefer
   * reduced motion get none; turn it off here for a button with its own press styling.
   */
  readonly pressScale = input(true, { transform: booleanAttribute });
  /** Resting shadow for a floating button. Inside a `andes-button-group` the group owns it. */
  readonly elevation = input<AndesButtonElevation>('none');
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly loading = input(false, { transform: booleanAttribute });
  readonly loadingDelay = input(0);
  readonly loadingIcon = input<TemplateRef<unknown> | undefined>(undefined);
  /** What a screen reader announces when the button turns busy. */
  readonly loadingLabel = input('Loading');
  /**
   * Async click handler: runs on every click and, when it returns a promise, keeps the button
   * in its loading state (blocked, with a spinner and `aria-busy`) until the promise settles. A
   * rejection goes to Angular's `ErrorHandler`. Independent of the `(click)` event.
   */
  readonly clickAction = input<AndesButtonClickAction | undefined>(undefined);
  /**
   * Keeps the button clickable while a `clickAction` is pending: the spinner and `aria-busy`
   * still show, a click starts a fresh action and only the newest one ends the loading state.
   */
  readonly interruptible = input(false, { transform: booleanAttribute });
  /**
   * Keeps a disabled or loading button in the tab order: it carries `aria-disabled` instead of
   * the native `disabled` attribute, so keyboard focus is never dropped mid-action. Clicks are
   * still blocked.
   */
  readonly focusableWhenDisabled = input(false, {
    transform: booleanAttribute,
  });
  readonly fullWidth = input(false, { transform: booleanAttribute });
  readonly href = input<string | undefined>(undefined);
  readonly target = input<string | undefined>(undefined);
  readonly type = input<AndesButtonType>('button');
  /** The `rel` of the link rendered for `href` (for example `noopener noreferrer`). */
  readonly rel = input<string | undefined>(undefined);
  /** The id of the form the button belongs to, when it is not inside it (`form` attribute). */
  readonly form = input<string | undefined>(undefined);
  /** The `name` submitted with the form, together with `value`. */
  readonly name = input<string | undefined>(undefined);
  /** The `value` submitted with the form when this button submits it. */
  readonly value = input<string | number | undefined>(undefined);
  readonly ghost = input(false, { transform: booleanAttribute });
  readonly ariaLabel = input<string | undefined>(undefined, {
    alias: 'aria-label',
  });
  readonly ariaLabelledby = input<string | undefined>(undefined, {
    alias: 'aria-labelledby',
  });
  readonly ariaDescribedby = input<string | undefined>(undefined, {
    alias: 'aria-describedby',
  });
  readonly ariaInvalid = input(false, {
    alias: 'aria-invalid',
    transform: booleanAttribute,
  });
  /**
   * Marks the button as the current item of a set (`page` for the current page of a
   * pagination, `step`, `location`...), on the real button or link a screen reader reports.
   */
  readonly ariaCurrent = input<AndesButtonAriaCurrent | undefined>(undefined, {
    alias: 'aria-current',
  });

  /** `loading`, once any `loadingDelay` has elapsed. */
  private readonly delayedLoading = signal(false);
  /** Whether a `clickAction` is still running. */
  private readonly actionPending = signal(false);
  private latestAction = 0;
  private loadingTimeoutId: ReturnType<typeof setTimeout> | undefined;
  private readonly errorHandler = inject(ErrorHandler);

  /**
   * Whether the busy state has a status region to announce through. A live region is read
   * reliably only when it is already in the page before its text changes, so it is present
   * on a button with a `clickAction` and, otherwise, from the first time the button is loading.
   */
  protected readonly announcesBusy = computed(
    () => !!this.clickAction() || this.hasBeenBusy(),
  );
  private readonly hasBeenBusy = signal(false);

  /** The loading state in effect: from `loading`, or while a `clickAction` is pending. */
  protected readonly visibleLoading = computed(
    () => this.delayedLoading() || this.actionPending(),
  );

  /** The enclosing form's size and disabled state. A button never takes a field's id: it is
   *  not the control a field labels. */
  private readonly field = injectAndesFieldBinding({ field: false });

  /** Own `disabled`, the disabled state of a control that hosts this button, loading, or a
   *  disabled enclosing `andesForm` - so a submit button follows the form it submits. */
  protected readonly isDisabled = computed(
    () =>
      this.disabled() ||
      (this.context?.disabled() ?? false) ||
      (this.group?.disabled?.() ?? false) ||
      this.delayedLoading() ||
      (this.actionPending() && !this.interruptible()) ||
      this.field.disabled(),
  );

  /** Whether the button can take focus and a press right now (for a group's keyboard moves). */
  readonly focusable = computed(
    () => !this.isDisabled() || this.focusableWhenDisabled(),
  );

  /**
   * `false` takes the button out of the tab sequence: only the current stop of a group with
   * roving focus stays in it.
   */
  protected readonly tabStop = computed(() => {
    const group = this.group;
    return group?.roving?.() ? (group.isTabStop?.(this) ?? true) : true;
  });

  /** The size in effect: `size`, the button group's, the form's, else `md`. */
  readonly resolvedSize = computed<AndesButtonSize>(
    () => this.size() ?? this.group?.size() ?? this.field.size() ?? 'md',
  );

  /** An icon-only button has no label, so its spinner replaces the projected icon outright. */
  protected readonly iconOnly = computed(() =>
    this.resolvedSize().startsWith('icon'),
  );

  protected readonly resolvedColor = computed<AndesButtonColor | undefined>(
    () => (this.danger() ? 'danger' : this.color()),
  );

  protected readonly classes = computed(() => {
    const shape = this.shape();
    const color = this.resolvedColor();
    return clsx(
      'andes-button',
      `andes-button--${this.variant()}`,
      `andes-button--${this.resolvedSize()}`,
      (shape === 'full' || shape === 'round') && 'andes-button--full',
      shape === 'circle' && 'andes-button--circle',
      color && `andes-button--colored andes-button--color-${color}`,
      this.visibleLoading() && 'andes-button--loading',
      !this.pressScale() && 'andes-button--no-press',
      this.elevation() !== 'none' &&
        `andes-button--elevation-${this.elevation()}`,
      this.fullWidth() && 'andes-button--full-width',
      this.ariaInvalid() && 'andes-button--invalid',
      this.ghost() && 'andes-button--ghost-mode',
    );
  });

  constructor() {
    effect((onCleanup) => {
      const loading = this.loading();
      const delay = this.loadingDelay();
      clearTimeout(this.loadingTimeoutId);

      if (!loading || delay <= 0) {
        this.delayedLoading.set(loading);
        return;
      }

      this.loadingTimeoutId = setTimeout(
        () => this.delayedLoading.set(true),
        delay,
      );
      onCleanup(() => clearTimeout(this.loadingTimeoutId));
    });

    effect(() => {
      if (this.visibleLoading()) {
        this.hasBeenBusy.set(true);
      }
    });

    // An icon-only button has no text to name it: say so while developing, once.
    let warned = false;
    effect(() => {
      if (
        !warned &&
        isDevMode() &&
        this.iconOnly() &&
        !this.ariaLabel() &&
        !this.ariaLabelledby()
      ) {
        warned = true;
        console.warn(
          'andes-button: an icon-only button needs an accessible name. Set aria-label or aria-labelledby.',
        );
      }
    });
  }

  /** Moves keyboard focus to the real button or link. */
  focus(options?: FocusOptions): void {
    this.control()?.focus(options);
  }

  /** Whether `node` is inside this button (for a group deciding which member has focus). */
  contains(node: Node | null): boolean {
    return !!node && this.elementRef.nativeElement.contains(node);
  }

  private control(): HTMLElement | null {
    return this.elementRef.nativeElement.querySelector(
      '[andesbuttonprimitive]',
    ) as HTMLElement | null;
  }

  protected onClick(event: MouseEvent): void {
    const action = this.clickAction();
    if (!action || this.isDisabled()) {
      return;
    }

    let result: unknown;
    try {
      result = action(event);
    } catch (error) {
      this.errorHandler.handleError(error);
      return;
    }
    if (!isThenable(result)) {
      return;
    }

    const run = ++this.latestAction;
    this.actionPending.set(true);
    const settle = () => {
      // Only the newest action ends the loading state, so an interrupted one cannot clear it.
      if (run === this.latestAction) {
        this.actionPending.set(false);
      }
    };
    result.then(settle, (error) => {
      settle();
      this.errorHandler.handleError(error);
    });
  }

  protected onPointerDown(event: PointerEvent): void {
    // A press ripple is decorative motion - skip it entirely for users who ask for less.
    if (this.isDisabled() || !this.ripple() || this.prefersReducedMotion()) {
      return;
    }

    const host = this.elementRef.nativeElement.querySelector(
      '[andesbuttonprimitive]',
    ) as HTMLElement | null;
    if (!host) {
      return;
    }

    const rect = host.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const ripple = this.renderer.createElement('span') as HTMLSpanElement;
    this.renderer.addClass(ripple, 'andes-button__ripple');
    this.renderer.setStyle(ripple, 'width', `${size}px`);
    this.renderer.setStyle(ripple, 'height', `${size}px`);
    this.renderer.setStyle(
      ripple,
      'left',
      `${event.clientX - rect.left - size / 2}px`,
    );
    this.renderer.setStyle(
      ripple,
      'top',
      `${event.clientY - rect.top - size / 2}px`,
    );
    this.renderer.appendChild(host, ripple);

    setTimeout(() => ripple.remove(), RIPPLE_DURATION_MS);
  }

  private prefersReducedMotion(): boolean {
    return (
      this.document.defaultView?.matchMedia?.(
        '(prefers-reduced-motion: reduce)',
      ).matches ?? false
    );
  }
}
