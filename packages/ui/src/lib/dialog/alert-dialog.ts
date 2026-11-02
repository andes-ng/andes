import {
  AndesOverlayClosePrimitive,
  AndesOverlayContentPrimitive,
  AndesOverlayTriggerPrimitive,
  provideAndesOverlay,
  type AndesOverlayConfig,
  type AndesOverlayPreset,
} from '@andes-ng/primitives';
import {
  type AfterViewInit,
  afterRenderEffect,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  DestroyRef,
  Directive,
  DOCUMENT,
  effect,
  ElementRef,
  forwardRef,
  inject,
  input,
  InjectionToken,
  numberAttribute,
  signal,
  type Signal,
  TemplateRef,
  ViewEncapsulation,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { AndesAlertDialogAcknowledge } from './alert-dialog-acknowledge';
import { AndesAlertDialogConfirmPhrase } from './alert-dialog-confirm-phrase';
import { AndesAlertDialogCountdown } from './alert-dialog-countdown';
import {
  AndesAlertDialogError,
  AndesAlertDialogIcon,
} from './alert-dialog-feedback';
import { AndesAlertDialogImpact } from './alert-dialog-impact';
import {
  blockClicks,
  errorText,
  isPromiseLike,
  markInitialFocus,
  markUnavailable,
} from './alert-dialog-internal';
import {
  AndesAlertDialogState,
  type AndesAlertDialogInitialFocus,
  type AndesAlertDialogTone,
} from './alert-dialog-state';

export type {
  AndesAlertDialogInitialFocus,
  AndesAlertDialogTone,
} from './alert-dialog-state';
import { AndesDialogActions } from './dialog-actions';
import {
  AndesDialogRoot,
  AndesDialogRootBase,
  AndesDialogSurface,
  AndesDialogSurfaceBase,
  dialogSurfaceClasses,
  dialogWidthStyles,
  registerDialogLabel,
} from './dialog-base';

/**
 * Lets the service's own dialog opt an alert dialog back into outside-click dismissal,
 * for its `maskClosable` option. Internal: not exported from the package, so the
 * declarative alert dialog keeps refusing outside clicks for every consumer.
 */
export const ANDES_ALERT_DIALOG_OUTSIDE_CLICK = new InjectionToken<
  Signal<boolean>
>('AndesAlertDialogOutsideClick');

/**
 * Marks the `<ng-template>` holding an alert dialog's surface. The alert-dialog
 * counterpart of `[andesDialogContent]`, kept separate so a nested confirmation
 * inside a plain dialog cannot have its template captured by the outer root's
 * content query.
 */
@Directive({
  selector: '[andesAlertDialogContent]',
  exportAs: 'andesAlertDialogContent',
})
export class AndesAlertDialogContentTemplate {
  /** The template the root portals when it opens. */
  readonly templateRef = inject<TemplateRef<void>>(TemplateRef);
}

/**
 * Root of the Alert Dialog compound: a modal that interrupts the user and expects
 * an explicit answer, for destructive confirmations.
 *
 * Deliberately more restrictive than `AndesDialog`: it renders
 * `role="alertdialog"` and refuses outside-click dismissal, so the only ways out
 * are its own actions (or Escape). Both come from the shared overlay's
 * `alert-dialog` preset rather than from config assembled here, and outside-click
 * dismissal is not exposed as an input — re-enabling it would erase the semantic
 * distinction the component exists for.
 *
 * ```html
 * <andes-alert-dialog>
 *   <button type="button" andesAlertDialogTrigger>Delete project</button>
 *
 *   <andes-alert-dialog-content *andesAlertDialogContent>
 *     <div andesAlertDialogHeader>
 *       <h2 andesAlertDialogTitle>Delete this project?</h2>
 *       <p andesAlertDialogDescription>This cannot be undone.</p>
 *     </div>
 *
 *     <div andesAlertDialogFooter>
 *       <button type="button" andesAlertDialogCancel>Cancel</button>
 *       <button type="button" andesAlertDialogAction (click)="destroy()">Delete</button>
 *     </div>
 *   </andes-alert-dialog-content>
 * </andes-alert-dialog>
 * ```
 */
@Component({
  selector: 'andes-alert-dialog',
  template: '<ng-content />',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    provideAndesOverlay(),
    AndesAlertDialogState,
    {
      provide: AndesDialogRoot,
      useExisting: forwardRef(() => AndesAlertDialog),
    },
  ],
  host: {
    '[attr.data-slot]': '"alert-dialog"',
  },
})
export class AndesAlertDialog extends AndesDialogRootBase {
  /**
   * What kind of interruption this is. Adds a coloured accent along the top edge of the
   * surface and drives the icon of `andes-alert-dialog-icon`. It is purely visual: the
   * title and description still have to say what is at stake.
   */
  readonly tone = input<AndesAlertDialogTone | null>(null);
  /**
   * The control that receives focus on open, overriding the DOM order (which already
   * puts the safe Cancel first when it precedes the action). `'input'` targets the
   * confirmation phrase field. Takes effect on the next open.
   */
  readonly initialFocus = input<AndesAlertDialogInitialFocus | null>(null);

  private readonly state = inject(AndesAlertDialogState);
  private readonly outsideClickDismissal = inject(
    ANDES_ALERT_DIALOG_OUTSIDE_CLICK,
    { optional: true },
  );
  private readonly contentTemplate = contentChild(
    AndesAlertDialogContentTemplate,
    { descendants: true },
  );

  constructor() {
    super();
    this.state.connect({ tone: this.tone, initialFocus: this.initialFocus });
    // The next open starts clean: no leftover failure, no stale announcement.
    this.overlay.closed.pipe(takeUntilDestroyed()).subscribe(() => {
      this.state.reset();
    });
  }

  protected overlayPreset(): AndesOverlayPreset {
    return 'alert-dialog';
  }

  protected surfaceTemplate(): TemplateRef<void> | undefined {
    return this.contentTemplate()?.templateRef;
  }

  protected override configOverrides(): Partial<AndesOverlayConfig> {
    // The one root that lets a caller re-open outside-click dismissal is the
    // service's own dialog, through an internal token no consumer can reach.
    const dismissal = this.outsideClickDismissal;
    // While a confirmation is in flight there is no way out but its outcome: Escape
    // and a re-opened outside click would orphan the request.
    const busy = this.state.pending();
    return {
      ...(dismissal ? { closeOnOutsideClick: dismissal() && !busy } : {}),
      ...(busy ? { closeOnEscape: false } : {}),
    };
  }
}

/** The element that opens an alert dialog. */
@Directive({
  selector: '[andesAlertDialogTrigger]',
  exportAs: 'andesAlertDialogTrigger',
  hostDirectives: [AndesOverlayTriggerPrimitive],
  host: {
    '(click)': 'root.toggle()',
    '[attr.data-slot]': '"alert-dialog-trigger"',
  },
})
export class AndesAlertDialogTrigger {
  /** The alert dialog this trigger opens. */
  protected readonly root = inject(AndesDialogRoot);
}

/**
 * The alert dialog's surface. Carries `role="alertdialog"` and
 * `aria-modal="true"` (from the preset) plus the labelling relationships.
 *
 * Renders no built-in close control: the
 * dismiss path must be an explicit, labelled Cancel action, not an anonymous "x".
 */
@Component({
  selector: 'andes-alert-dialog-content',
  templateUrl: './alert-dialog-content.html',
  styleUrls: ['./dialog.css', './alert-dialog-patterns.css'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AndesDialogActions],
  hostDirectives: [AndesOverlayContentPrimitive],
  providers: [
    {
      provide: AndesDialogSurface,
      useExisting: forwardRef(() => AndesAlertDialogContent),
    },
  ],
  host: {
    '[class]': 'classes()',
    '[style]': 'styles()',
    '[attr.aria-labelledby]': 'titleId()',
    '[attr.aria-describedby]': 'descriptionId()',
    '[attr.aria-busy]': 'root.loading() || state.pending() || null',
    '[attr.data-slot]': '"alert-dialog-content"',
    '[attr.data-tone]': 'state.tone()',
  },
})
export class AndesAlertDialogContent extends AndesDialogSurfaceBase {
  protected readonly root = inject(AndesDialogRoot);
  protected readonly state = inject(AndesAlertDialogState);

  protected readonly classes = computed(() => {
    const tone = this.state.tone();
    return [
      ...dialogSurfaceClasses(this.root),
      'andes-dialog--alert',
      ...(tone ? [`andes-dialog--tone-${tone}`] : []),
    ].join(' ');
  });

  constructor() {
    super();
    // Two visually hidden elements the parts talk through. They are created here, in the
    // surface, because it is the one place every alert dialog passes through: a polite
    // live region for countdown, mismatch and failure messages, and the sentence that
    // describes why the action is blocked (`aria-describedby` on the action points at it).
    const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const document = inject(DOCUMENT);
    const live = document.createElement('span');
    live.className = 'andes-alert-dialog__sr';
    live.setAttribute('role', 'status');
    live.setAttribute('aria-live', 'polite');
    live.setAttribute('aria-atomic', 'true');
    live.dataset['slot'] = 'alert-dialog-live';
    const requirements = document.createElement('span');
    requirements.className = 'andes-alert-dialog__sr';
    requirements.id = this.state.requirementsId;
    requirements.dataset['slot'] = 'alert-dialog-requirements';
    host.append(live, requirements);

    effect(() => {
      live.textContent = this.state.announcement().text;
    });
    effect(() => {
      requirements.textContent = this.state.requirements();
    });
  }

  protected readonly styles = computed(() =>
    dialogWidthStyles(this.root.width()),
  );
}

/** Layout wrapper for an alert dialog's title and description. */
@Directive({
  selector: '[andesAlertDialogHeader]',
  host: {
    class: 'andes-dialog__header',
    '[attr.data-slot]': '"alert-dialog-header"',
  },
})
export class AndesAlertDialogHeader {}

/** The alert dialog's heading, wired as the surface's `aria-labelledby`. */
@Directive({
  selector: '[andesAlertDialogTitle]',
  host: {
    class: 'andes-dialog__title',
    '[attr.id]': 'id',
    '[attr.data-slot]': '"alert-dialog-title"',
  },
})
export class AndesAlertDialogTitle {
  /** Id the surface's `aria-labelledby` points at. */
  readonly id = registerDialogLabel('title');
}

/** Supporting copy, wired as the surface's `aria-describedby`. */
@Directive({
  selector: '[andesAlertDialogDescription]',
  host: {
    class: 'andes-dialog__description',
    '[attr.id]': 'id',
    '[attr.data-slot]': '"alert-dialog-description"',
  },
})
export class AndesAlertDialogDescription {
  /** Id the surface's `aria-describedby` points at. */
  readonly id = registerDialogLabel('description');
}

/** Layout wrapper for an alert dialog's Cancel/Action pair. */
@Directive({
  selector: '[andesAlertDialogFooter]',
  host: {
    class: 'andes-dialog__footer',
    '[attr.data-slot]': '"alert-dialog-footer"',
  },
})
export class AndesAlertDialogFooter {}

/**
 * The dismissing action. Place it before the affirmative action in the DOM so the
 * focus trap's initial focus lands on the safe choice, the same default the
 * built-in footer uses for confirmations (`autoFocusButton: 'cancel'`).
 *
 * Runs the root's cancel path, like the built-in Cancel: emits `cancelled`, then
 * closes reporting `'close-button'`. While an asynchronous confirmation runs
 * (`[confirm]` on the action) it is unavailable, so the request cannot be orphaned.
 */
@Directive({
  selector: '[andesAlertDialogCancel]',
  exportAs: 'andesAlertDialogCancel',
  host: {
    class: 'andes-dialog__cancel',
    '(click)': 'root.requestCancel()',
    '[attr.data-slot]': '"alert-dialog-cancel"',
  },
})
export class AndesAlertDialogCancel implements AfterViewInit {
  /** The alert dialog this action cancels. */
  protected readonly root = inject(AndesDialogRoot);

  private readonly state = inject(AndesAlertDialogState);
  private readonly host =
    inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  constructor() {
    blockClicks(this.host, inject(DestroyRef), () => this.state.pending());
    afterRenderEffect(() => {
      markUnavailable(this.host, this.state.pending(), null);
    });
  }

  ngAfterViewInit(): void {
    if (this.state.initialFocus() === 'cancel') {
      markInitialFocus(this.host);
    }
  }
}

/** How the hold-to-confirm action talks to assistive technology. */
export interface AndesAlertDialogHoldMessages {
  /** Announced when the hold starts. */
  readonly start: string;
  /** Announced when the hold is released before it completes. */
  readonly release: string;
  /**
   * Announced when a screen reader activates the action without a real press and hold.
   * `{seconds}` is replaced with the hold time.
   */
  readonly assistive: string;
}

const DEFAULT_HOLD_MESSAGES: AndesAlertDialogHoldMessages = {
  start: 'Keep holding to confirm.',
  release: 'Released too early. Hold the button to confirm.',
  assistive:
    'Confirming in {seconds} seconds. Activate the button again to cancel.',
};

/** Ignore the click a browser still synthesises right after a keyboard hold ends. */
const HOLD_CLICK_GRACE_MS = 150;

/** How long the "blocked" shake plays; the stylesheet's animation lasts as long. */
const SHAKE_MS = 400;

/**
 * The affirmative action. Closes the alert dialog;
 * bind your own `(click)` for the work it confirms.
 *
 * On its own it is the plain confirm button: one click, the dialog closes. Around it
 * sit the guards that make a click harder to get wrong, all opt-in:
 *
 * - **Gates.** With a gating part in the dialog (`andes-alert-dialog-confirm-phrase`,
 *   `-acknowledge`, `-countdown`) the action is unavailable until every gate is
 *   satisfied. It stays focusable (`aria-disabled`, never `disabled`) and its
 *   description says what is missing; an early attempt shakes it and is announced.
 * - **`confirm`.** An asynchronous handler. The dialog stays open with the action
 *   showing a spinner until the promise settles; resolving closes it, rejecting keeps
 *   it open with the failure in `andes-alert-dialog-error` so the user can retry.
 * - **`holdDuration`.** A deliberate press-and-hold (pointer, touch or Space/Enter),
 *   with a progress fill. Releasing early cancels.
 * - **`armDelay`.** Ignores activation for a moment after the dialog opens, so an
 *   Enter still held from the trigger cannot confirm it.
 *
 * For an asynchronous confirmation with the built-in footer instead, use the root's
 * `footer="default"`, `(ok)` and `[confirmLoading]`, or
 * `AndesDialogService.confirm()` with an `onOk` that returns a promise.
 */
@Directive({
  selector: '[andesAlertDialogAction]',
  exportAs: 'andesAlertDialogAction',
  host: {
    class: 'andes-dialog__action',
    '[attr.data-slot]': '"alert-dialog-action"',
    '[attr.data-blocked]': 'blocked() ? "true" : null',
    '[attr.data-pending]': 'pending() ? "" : null',
    '[attr.data-hold]': 'holdDuration() > 0 ? "" : null',
    '[attr.data-holding]': 'holding() ? "" : null',
    '[style.--andes-hold-duration]':
      'holdDuration() > 0 ? holdDuration() + "ms" : null',
    '(click)': 'onClick()',
    '(keydown)': 'onKeydown($event)',
    '(keyup)': 'onKeyup($event)',
    '(pointerdown)': 'onPointerdown($event)',
    '(pointerup)': 'cancelHold(true)',
    '(pointercancel)': 'cancelHold(true)',
    '(pointerleave)': 'cancelHold(true)',
    '(focusout)': 'cancelHold(false)',
    '(contextmenu)': 'onContextmenu($event)',
  },
})
export class AndesAlertDialogAction implements AfterViewInit {
  private readonly root = inject(AndesDialogRoot);
  private readonly state = inject(AndesAlertDialogState);
  private readonly host =
    inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  /**
   * The work this action confirms. Return a promise to keep the dialog open, with the
   * action in its pending state, until it settles: resolving closes the dialog,
   * rejecting (or throwing) keeps it open and shows the failure so the user can retry.
   * Any other return value closes the dialog at once, like an action without one.
   */
  readonly confirm = input<(() => unknown) | null>(null);
  /**
   * Replaces the message shown when `confirm` fails: a fixed text, or a function of
   * what was rejected. By default the rejection's own message is used.
   */
  readonly errorMessage = input<string | ((error: unknown) => string) | null>(
    null,
  );
  /**
   * Milliseconds the action must be pressed and held before it confirms; `0` (default)
   * is a plain click. Space and Enter hold too, and a screen reader that can only
   * "click" starts a cancellable countdown of the same length instead.
   */
  readonly holdDuration = input(0, { transform: numberAttribute });
  /** Texts the hold announces; any subset overrides the defaults. */
  readonly holdMessages = input<Partial<AndesAlertDialogHoldMessages>>({});
  /**
   * Milliseconds after the dialog opens during which the action ignores activation
   * (clicks and Enter alike), so a key still held down from the trigger cannot answer
   * the dialog. `0` (default) is off; 300 is a good value for a destructive action.
   */
  readonly armDelay = input(0, { transform: numberAttribute });

  /** Whether an asynchronous confirmation is running. */
  readonly pending = this.state.pending;
  /** Whether a gate still blocks the action. */
  readonly blocked = computed(() => !this.state.satisfied());
  /** Whether a hold is in progress. */
  readonly holding = signal(false);

  private readonly armed = signal(true);
  private holdTimer: ReturnType<typeof setTimeout> | undefined;
  private shakeTimer: ReturnType<typeof setTimeout> | undefined;
  private bypass = false;
  private ignoreClicksUntil = 0;

  constructor() {
    const destroyRef = inject(DestroyRef);

    blockClicks(this.host, destroyRef, (event) => this.shouldBlock(event));

    this.state.registerSubmit(() => this.activate(), destroyRef);

    afterRenderEffect(() => {
      markUnavailable(
        this.host,
        this.blocked(),
        this.state.requirementsId,
        this.pending(),
      );
    });

    // Re-arm on every open, so a kept-alive surface guards each opening, not just the first.
    effect((onCleanup) => {
      const delay = this.armDelay();
      if (!this.root.isOpen() || delay <= 0) {
        this.armed.set(true);
        return;
      }
      this.armed.set(false);
      const timer = setTimeout(() => this.armed.set(true), delay);
      onCleanup(() => clearTimeout(timer));
    });

    // A blocked attempt shakes the action. Re-triggered through the DOM rather than a
    // binding, since the attribute has to go off and on again for the animation to restart.
    let seenAttempts = this.state.attempts();
    effect(() => {
      const attempts = this.state.attempts();
      if (attempts === seenAttempts) {
        return;
      }
      seenAttempts = attempts;
      this.shake();
    });

    destroyRef.onDestroy(() => {
      clearTimeout(this.holdTimer);
      clearTimeout(this.shakeTimer);
    });
  }

  ngAfterViewInit(): void {
    if (this.state.initialFocus() === 'action') {
      markInitialFocus(this.host);
    }
  }

  /**
   * Activates the action as if it were clicked - what Enter inside a gating field
   * calls. A blocked action refuses and says why.
   */
  activate(): void {
    if (this.holdDuration() > 0) {
      this.toggleAssistiveHold();
      return;
    }
    this.clickThrough();
  }

  /** Whether `event` must not reach the consumer's handler or the close below. */
  private shouldBlock(event: MouseEvent): boolean {
    if (this.bypass) {
      return false;
    }
    if (this.holdDuration() > 0) {
      // A real click after a hold is the browser finishing the gesture. One without a
      // pointer (`detail` 0) is a screen reader or a script.
      if (event.detail === 0 && Date.now() >= this.ignoreClicksUntil) {
        this.toggleAssistiveHold();
      }
      return true;
    }
    if (this.pending() || !this.armed()) {
      return true;
    }
    if (this.blocked()) {
      this.state.reject();
      return true;
    }
    return false;
  }

  protected onClick(): void {
    // Reached only for a click `shouldBlock` let through.
    const handler = this.confirm();
    if (!handler) {
      this.root.hide('close-button');
      return;
    }

    let result: unknown;
    try {
      result = handler();
    } catch (error) {
      this.fail(error);
      return;
    }
    if (!isPromiseLike(result)) {
      this.root.hide('close-button');
      return;
    }

    this.state.begin();
    result.then(
      () => {
        this.state.settle();
        if (this.root.isOpen()) {
          this.root.hide('close-button');
        }
      },
      (error: unknown) => this.fail(error),
    );
  }

  private fail(error: unknown): void {
    const custom = this.errorMessage();
    const message =
      typeof custom === 'function'
        ? custom(error)
        : (custom ?? errorText(error, 'Something went wrong. Try again.'));
    this.state.settle(message);
    this.state.announce(message);
  }

  /** Re-dispatches a click on the host that the guards above let through. */
  private clickThrough(): void {
    this.host.click();
  }

  // --- Hold to confirm -------------------------------------------------------------

  protected onPointerdown(event: PointerEvent): void {
    if (this.holdDuration() > 0 && event.button === 0) {
      this.startHold();
    }
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (this.holdDuration() <= 0 || !isActivationKey(event)) {
      return;
    }
    // Space and Enter would click the button (on press and on release respectively).
    event.preventDefault();
    if (!event.repeat) {
      this.startHold();
    }
  }

  protected onKeyup(event: KeyboardEvent): void {
    if (this.holdDuration() <= 0 || !isActivationKey(event)) {
      return;
    }
    event.preventDefault();
    this.ignoreClicksUntil = Date.now() + HOLD_CLICK_GRACE_MS;
    this.cancelHold(true);
  }

  protected onContextmenu(event: Event): void {
    // A long press on touch opens the context menu, which would steal the hold.
    if (this.holdDuration() > 0) {
      event.preventDefault();
    }
  }

  private startHold(assistive = false): void {
    if (this.holding() || this.pending() || !this.armed()) {
      return;
    }
    if (this.blocked()) {
      this.state.reject();
      return;
    }
    this.holding.set(true);
    const messages = { ...DEFAULT_HOLD_MESSAGES, ...this.holdMessages() };
    this.state.announce(
      assistive
        ? messages.assistive.replace(
            '{seconds}',
            String(Math.max(1, Math.round(this.holdDuration() / 1000))),
          )
        : messages.start,
    );
    this.holdTimer = setTimeout(() => this.finishHold(), this.holdDuration());
  }

  /** Ends a hold that was let go early. */
  protected cancelHold(announce: boolean): void {
    if (!this.holding()) {
      return;
    }
    clearTimeout(this.holdTimer);
    this.holding.set(false);
    if (announce) {
      this.state.announce(
        { ...DEFAULT_HOLD_MESSAGES, ...this.holdMessages() }.release,
      );
    }
  }

  private toggleAssistiveHold(): void {
    if (this.holding()) {
      this.cancelHold(false);
      this.state.announce('Cancelled.');
    } else {
      this.startHold(true);
    }
  }

  private finishHold(): void {
    this.holding.set(false);
    // A gate may have closed while holding.
    if (this.blocked()) {
      this.state.reject();
      return;
    }
    // The hold stands in for the click, so the click it dispatches skips the hold guard
    // but reaches the consumer's `(click)` and the close below like any other.
    this.bypass = true;
    try {
      this.clickThrough();
    } finally {
      this.bypass = false;
    }
  }

  private shake(): void {
    clearTimeout(this.shakeTimer);
    this.host.removeAttribute('data-shake');
    // Reading a layout property flushes the style, so the animation restarts.
    void this.host.offsetWidth;
    this.host.setAttribute('data-shake', '');
    this.shakeTimer = setTimeout(
      () => this.host.removeAttribute('data-shake'),
      SHAKE_MS,
    );
  }
}

function isActivationKey(event: KeyboardEvent): boolean {
  return event.key === ' ' || event.key === 'Enter';
}

/**
 * A third answer beside Cancel and the action: "Discard", "Don't save", "Not now". It
 * closes the dialog like `[andesAlertDialogClose]` and sits at the start edge of the
 * footer, away from the Cancel/action pair, so the two-button muscle memory still holds.
 * Bind your own `(click)` to tell the answers apart.
 *
 * ```html
 * <div andesAlertDialogFooter>
 *   <button type="button" andesAlertDialogSecondary (click)="discard()">Discard</button>
 *   <button type="button" andesAlertDialogCancel>Keep editing</button>
 *   <button type="button" andesAlertDialogAction (click)="save()">Save</button>
 * </div>
 * ```
 */
@Directive({
  selector: '[andesAlertDialogSecondary]',
  exportAs: 'andesAlertDialogSecondary',
  host: {
    class: 'andes-dialog__secondary',
    '(click)': 'root.hide("close-button")',
    '[attr.data-slot]': '"alert-dialog-secondary"',
  },
})
export class AndesAlertDialogSecondary {
  protected readonly root = inject(AndesDialogRoot);

  constructor() {
    const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const state = inject(AndesAlertDialogState);
    blockClicks(host, inject(DestroyRef), () => state.pending());
    afterRenderEffect(() => {
      markUnavailable(host, state.pending(), null);
    });
  }
}

/**
 * Closes the alert dialog when activated. The direct counterpart of
 * `[andesDialogClose]`, for a dismiss control that is neither the Cancel nor the
 * Action button (a header "x" a consumer adds themselves, say).
 */
@Directive({
  selector: '[andesAlertDialogClose]',
  exportAs: 'andesAlertDialogClose',
  hostDirectives: [AndesOverlayClosePrimitive],
  host: {
    '[attr.data-slot]': '"alert-dialog-close"',
  },
})
export class AndesAlertDialogClose {}

/** Everything a consumer needs to import to use the Alert Dialog compound. */
export const ANDES_ALERT_DIALOG_IMPORTS = [
  AndesAlertDialog,
  AndesAlertDialogTrigger,
  AndesAlertDialogContentTemplate,
  AndesAlertDialogContent,
  AndesAlertDialogHeader,
  AndesAlertDialogTitle,
  AndesAlertDialogDescription,
  AndesAlertDialogFooter,
  AndesAlertDialogCancel,
  AndesAlertDialogAction,
  AndesAlertDialogSecondary,
  AndesAlertDialogClose,
  AndesAlertDialogConfirmPhrase,
  AndesAlertDialogAcknowledge,
  AndesAlertDialogCountdown,
  AndesAlertDialogImpact,
  AndesAlertDialogError,
  AndesAlertDialogIcon,
];
