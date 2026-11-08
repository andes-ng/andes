import type { AndesOverlayCloseReason } from '@andes-ng/primitives';
import { NgTemplateOutlet } from '@angular/common';
import {
  ApplicationRef,
  ChangeDetectionStrategy,
  Component,
  computed,
  createComponent,
  EnvironmentInjector,
  inject,
  Injectable,
  input,
  signal,
  type Signal,
  TemplateRef,
  viewChild,
  type WritableSignal,
} from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideCircleAlert,
  lucideCircleCheck,
  lucideCircleX,
  lucideInfo,
  lucideX,
} from '@ng-icons/lucide';

import type { AndesButtonVariant } from '../button/button';
import {
  ANDES_ALERT_DIALOG_OUTSIDE_CLICK,
  AndesAlertDialog,
  AndesAlertDialogContent,
  AndesAlertDialogContentTemplate,
  AndesAlertDialogDescription,
  AndesAlertDialogTitle,
} from './alert-dialog';
import { AndesDialogActions } from './dialog-actions';
import {
  ANDES_DIALOG_STATUS_ICONS,
  type AndesDialogStatus,
} from './dialog-status-icons';
import type { AndesDialogActionsLayout } from './dialog-actions';
import type {
  AndesDialogAutoFocusButton,
  AndesDialogButtonProps,
  AndesDialogFooterContext,
  AndesDialogSize,
  AndesDialogWidth,
} from './dialog-base';

/** The five imperative flavours: one confirmation and four acknowledgements. */
export type AndesDialogMethodKind =
  'confirm' | 'info' | 'success' | 'error' | 'warning';

/** How an imperative dialog was closed. */
export type AndesDialogMethodCloseReason =
  'ok' | 'cancel' | 'close-button' | 'escape' | 'backdrop' | 'destroyed';

/** What an imperative dialog settled with: see `AndesDialogMethodRef.outcome`. */
export interface AndesDialogMethodOutcome<T = unknown> {
  /** `true` when the dialog closed through OK. */
  readonly confirmed: boolean;
  /** Which way out the user (or the code) took. */
  readonly reason: AndesDialogMethodCloseReason;
  /** What the promise returned by `onOk` resolved to; `undefined` when it returned none. */
  readonly value: T | undefined;
}

/** Text, or a template for rich content. Templates receive the dialog's ref. */
export type AndesDialogMethodContent =
  string | TemplateRef<{ $implicit: AndesDialogMethodRef }>;

/**
 * Configuration for `AndesDialogService.confirm()` and its siblings. Field names match
 * the declarative dialog's inputs wherever the concept carries over.
 */
export interface AndesDialogMethodConfig {
  /** Heading, wired as the dialog's accessible name. */
  readonly title?: AndesDialogMethodContent;
  /** Body copy, wired as the dialog's accessible description. */
  readonly content?: AndesDialogMethodContent;
  /**
   * Replaces the kind's status icon. `null` renders none. Put `aria-hidden="true"`
   * on a decorative icon - the kind is conveyed by the title, not the glyph.
   */
  readonly icon?: TemplateRef<unknown> | null;
  /**
   * Colour and glyph of the status icon, overriding the kind's own: a `confirm` is a
   * warning by default, `tone: 'danger'` makes it a destructive one.
   */
  readonly tone?: AndesDialogStatus;
  /**
   * What to say under the content when `onOk` rejects, shown in the dialog (and announced)
   * so the user can retry: a fixed text, or a function of the rejection. By default the
   * rejection's own message is shown. A handler that throws synchronously is treated alike.
   */
  readonly errorMessage?: string | ((error: unknown) => string);
  /**
   * Wait for the dialogs that are open (and queued before this one) to close, then open.
   * Without it a new dialog opens at once, on top of the others. The returned ref is
   * usable straight away: `result` settles when the dialog has been shown and closed, and
   * `destroy()` withdraws it from the queue.
   */
  readonly queue?: boolean;
  /**
   * How the footer buttons are laid out: `'end'` (default) pushes them to the end edge,
   * `'stretch'` makes them share the row evenly, `'stacked'` puts them one above the
   * other with the affirmative action first.
   */
  readonly actionsLayout?: AndesDialogActionsLayout;
  /** OK label. Default `'OK'`. */
  readonly okText?: string;
  /** Cancel label. Default `'Cancel'`. */
  readonly cancelText?: string;
  /** OK button variant. Default `'primary'`; `'danger'` for a destructive confirm. */
  readonly okType?: AndesButtonVariant;
  /** Disable OK. */
  readonly okDisabled?: boolean;
  /** Disable Cancel. */
  readonly cancelDisabled?: boolean;
  /** Extra OK button settings (size, ghost, accessible name, classes). */
  readonly okButtonProps?: AndesDialogButtonProps | null;
  /** Extra Cancel button settings. */
  readonly cancelButtonProps?: AndesDialogButtonProps | null;
  /**
   * Show Cancel next to OK. Defaults to `true` for `confirm` and `false` for the
   * four acknowledgement kinds, which only need dismissing.
   */
  readonly okCancel?: boolean;
  /**
   * Runs when OK is activated. Return a promise to keep the dialog open with OK in
   * its loading state until it settles: resolving closes the dialog, rejecting keeps
   * it open so the user can retry.
   *
   * The handler receives a `close` function. A handler that declares that parameter
   * and returns no promise takes over closing: the dialog stays open until it calls
   * `close()` (say, after a validation step of its own).
   */
  readonly onOk?: (close: () => void) => unknown;
  /**
   * Runs when the user backs out - Cancel, the "x", Escape or (with `maskClosable`) a
   * backdrop click. From the Cancel button a returned promise, or a declared `close`
   * parameter, works like `onOk`'s; from the other paths the dialog has already
   * closed, `close` does nothing and the result is ignored.
   */
  readonly onCancel?: (close: () => void) => unknown;
  /** Runs once the dialog has closed and been torn down, whatever the outcome. */
  readonly afterClose?: () => void;
  /**
   * Which footer button receives initial focus. Defaults to `'cancel'` for
   * `confirm` - the safe choice, the one a stray Enter should land on - and to
   * `'ok'`, the only button, for the other kinds.
   */
  readonly autoFocusButton?: AndesDialogAutoFocusButton;
  /** Render a close ("x") control. Default `false`; the footer already offers a way out. */
  readonly closable?: boolean;
  /** Accessible label for the "x". Default `'Close'`. */
  readonly closeLabel?: string;
  /** Replaces the "x" glyph; keep it decorative (`aria-hidden="true"`). */
  readonly closeIcon?: TemplateRef<unknown> | null;
  /** Escape closes the dialog (as a cancel). Default `true`. */
  readonly keyboard?: boolean;
  /** Render the backdrop scrim. Default `true`. */
  readonly mask?: boolean;
  /**
   * A click on the backdrop closes the dialog, as a cancel. Default `false`: these
   * dialogs ask for an explicit answer, so a stray click beside one should not count
   * as one. Meant for the acknowledgement kinds, where nothing is lost by dismissing.
   */
  readonly maskClosable?: boolean;
  /** Blur the page behind the backdrop. Default `false`. */
  readonly maskBlur?: boolean;
  /** Return focus to the element focused at open time once closed. Default `true`. */
  readonly restoreFocus?: boolean;
  /** Block document scroll while open. Default `true`. */
  readonly lockScroll?: boolean;
  /** Centre vertically. Default `true`; `false` parks it near the top. */
  readonly centered?: boolean;
  /** Surface max-width step. Default `'md'` (26rem, 416px). */
  readonly size?: AndesDialogSize;
  /** Explicit width, overriding `size`. */
  readonly width?: AndesDialogWidth | null;
  /** Explicit z-index, overriding the modal layer. */
  readonly zIndex?: number | null;
  /**
   * Custom footer, given `ok()`/`cancel()` that run the same handlers as the
   * built-in buttons. `null` renders no footer (then keep `keyboard` or `closable`
   * on, or the dialog has no way out).
   */
  readonly footer?: TemplateRef<AndesDialogFooterContext> | null;
  /** Extra classes on the surface. */
  readonly className?: string;
}

/**
 * Handle to one imperative dialog: `update`/`destroy` it, or await its `result`
 * promise to learn how it closed.
 */
export class AndesDialogMethodRef {
  private readonly _config: WritableSignal<AndesDialogMethodConfig>;
  private readonly _closed = signal(false);
  private resolveResult!: (confirmed: boolean) => void;
  private resolveOutcome!: (outcome: AndesDialogMethodOutcome) => void;
  private closeHandler: (() => void) | null = null;

  /**
   * Settles when the dialog closes: `true` if it closed through OK, `false` for any
   * other way out (Cancel, "x", Escape, `destroy()`).
   */
  readonly result: Promise<boolean>;

  /**
   * Settles with the full outcome when the dialog closes: whether OK was chosen, which way
   * out was taken, and the value `onOk`'s promise resolved to. `result` is its `confirmed`.
   */
  readonly outcome: Promise<AndesDialogMethodOutcome>;

  /** The dialog's current configuration. */
  readonly config: Signal<AndesDialogMethodConfig>;
  /** Whether the dialog has closed. */
  readonly closed = this._closed.asReadonly();

  constructor(
    /** Which flavour this dialog is. */
    readonly kind: AndesDialogMethodKind,
    config: AndesDialogMethodConfig,
  ) {
    this._config = signal(config);
    this.config = this._config.asReadonly();
    this.result = new Promise<boolean>((resolve) => {
      this.resolveResult = resolve;
    });
    this.outcome = new Promise<AndesDialogMethodOutcome>((resolve) => {
      this.resolveOutcome = resolve;
    });
  }

  /**
   * Merges new configuration into the open dialog - retitle it, flip `okDisabled`,
   * swap its content. Accepts a patch or a function of the previous config.
   */
  update(
    patch:
      | Partial<AndesDialogMethodConfig>
      | ((
          previous: AndesDialogMethodConfig,
        ) => Partial<AndesDialogMethodConfig>),
  ): void {
    this._config.update((previous) => ({
      ...previous,
      ...(typeof patch === 'function' ? patch(previous) : patch),
    }));
  }

  /** Closes the dialog without running `onOk`/`onCancel`. `result` settles `false`. */
  destroy(): void {
    if (this.closeHandler) {
      this.closeHandler();
    } else {
      // Not rendered yet (destroyed in the same tick it was created).
      this.settle(false);
    }
  }

  /** @internal Wires `destroy()` to the rendered dialog. */
  attach(close: () => void): void {
    this.closeHandler = close;
  }

  /** @internal Records the outcome. Idempotent. */
  settle(
    confirmed: boolean,
    detail: {
      readonly reason?: AndesDialogMethodCloseReason;
      readonly value?: unknown;
    } = {},
  ): void {
    if (this._closed()) {
      return;
    }
    this._closed.set(true);
    this.closeHandler = null;
    this.resolveResult(confirmed);
    this.resolveOutcome({
      confirmed,
      reason: detail.reason ?? (confirmed ? 'ok' : 'destroyed'),
      value: detail.value,
    });
  }
}

// `confirm` shares the exclamation icon with `warning`: both ask for attention. The icons are
// the lucide ones `andes-alert` and the alert dialog's tone icon draw, each a disc whose mark
// the stylesheet cuts out.
const METHOD_TONES: Record<AndesDialogMethodKind, AndesDialogStatus> = {
  confirm: 'warning',
  warning: 'warning',
  error: 'danger',
  info: 'info',
  success: 'success',
};

/** The stylesheet's name for each tone's icon colour (`error` is what `danger` was first called). */
const TONE_CLASSES: Record<AndesDialogStatus, string> = {
  warning: 'warning',
  danger: 'error',
  info: 'info',
  success: 'success',
};

/**
 * The component `AndesDialogService` instantiates per call: an `AndesAlertDialog` -
 * `role="alertdialog"`, no outside-click dismissal - laid out with a status icon
 * beside title and content and the actions below.
 *
 * Internal: created only by the service.
 */
@Component({
  selector: 'andes-dialog-method',
  viewProviders: [
    provideIcons({
      lucideCircleAlert,
      lucideCircleCheck,
      lucideCircleX,
      lucideInfo,
      lucideX,
    }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgIcon,
    AndesAlertDialog,
    AndesAlertDialogContent,
    AndesAlertDialogContentTemplate,
    AndesAlertDialogTitle,
    AndesAlertDialogDescription,
    AndesDialogActions,
    NgTemplateOutlet,
  ],
  providers: [
    {
      provide: ANDES_ALERT_DIALOG_OUTSIDE_CLICK,
      useFactory: () => {
        const method = inject(AndesDialogMethod);
        return computed(() => method.ref().config().maskClosable ?? false);
      },
    },
  ],
  template: `
    @let cfg = ref().config();
    <andes-alert-dialog
      [(open)]="open"
      [closeOnEscape]="cfg.keyboard ?? true"
      [lockScroll]="cfg.lockScroll ?? true"
      [mask]="cfg.mask ?? true"
      [maskBlur]="cfg.maskBlur ?? false"
      [restoreFocus]="cfg.restoreFocus ?? true"
      [centered]="cfg.centered ?? true"
      [size]="cfg.size ?? 'md'"
      [width]="cfg.width ?? null"
      [zIndex]="cfg.zIndex ?? null"
      (closed)="onClosed($event)"
    >
      <andes-alert-dialog-content
        *andesAlertDialogContent
        [class]="surfaceClass()"
        [attr.aria-label]="cfg.title ? null : defaultLabel()"
      >
        <div class="andes-dialog__method" data-slot="dialog-method-body">
          @if (cfg.icon !== null) {
            <span
              class="andes-dialog__method-icon"
              data-slot="dialog-method-icon"
              aria-hidden="true"
            >
              @if (cfg.icon) {
                <ng-container *ngTemplateOutlet="cfg.icon" />
              } @else {
                <ng-icon
                  class="andes-dialog__method-glyph"
                  [name]="iconName()"
                />
              }
            </span>
          }
          <div class="andes-dialog__method-text">
            @if (cfg.title; as title) {
              <h2 andesAlertDialogTitle>
                <ng-container
                  *ngTemplateOutlet="
                    asTemplate(title) ?? textTpl;
                    context: { $implicit: ref(), text: title }
                  "
                />
              </h2>
            }
            @if (cfg.content; as content) {
              <div andesAlertDialogDescription>
                <ng-container
                  *ngTemplateOutlet="
                    asTemplate(content) ?? textTpl;
                    context: { $implicit: ref(), text: content }
                  "
                />
              </div>
            }
          </div>
        </div>

        <!-- Why OK failed, so the user can retry from the same dialog. -->
        @if (failure(); as message) {
          <p
            class="andes-alert-dialog__error andes-dialog__method-error"
            data-slot="dialog-method-error"
            role="alert"
          >
            <ng-icon
              class="andes-alert-dialog__error-icon"
              aria-hidden="true"
              name="lucideCircleAlert"
            />
            <span class="andes-alert-dialog__error-text">{{ message }}</span>
          </p>
        }

        @if (cfg.footer !== null) {
          <andes-dialog-actions
            slot="alert-dialog-footer"
            size="sm"
            [template]="cfg.footer ?? null"
            [context]="footerContext"
            [okText]="cfg.okText ?? 'OK'"
            [cancelText]="cfg.cancelText ?? 'Cancel'"
            [okType]="cfg.okType ?? 'primary'"
            [okDisabled]="cfg.okDisabled ?? false"
            [cancelDisabled]="cfg.cancelDisabled ?? false"
            [okLoading]="okLoading()"
            [cancelLoading]="cancelLoading()"
            [showCancel]="showCancel()"
            [layout]="cfg.actionsLayout ?? 'end'"
            [autoFocusButton]="autoFocusButton()"
            [okButtonProps]="cfg.okButtonProps ?? null"
            [cancelButtonProps]="cfg.cancelButtonProps ?? null"
            (okClick)="runOk()"
            (cancelClick)="runCancel()"
          />
        }

        @if (cfg.closable) {
          <button
            type="button"
            class="andes-dialog__close"
            data-slot="dialog-close-button"
            [attr.aria-label]="cfg.closeLabel ?? 'Close'"
            (click)="dismiss()"
          >
            @if (cfg.closeIcon; as closeIcon) {
              <ng-container *ngTemplateOutlet="closeIcon" />
            } @else {
              <ng-icon class="andes-dialog__close-icon" name="lucideX" />
            }
          </button>
        }
      </andes-alert-dialog-content>
    </andes-alert-dialog>

    <ng-template #textTpl let-text="text">{{ text }}</ng-template>
  `,
})
export class AndesDialogMethod {
  /** The handle this dialog renders and reports to. */
  readonly ref = input.required<AndesDialogMethodRef>();

  protected readonly open = signal(true);
  private readonly root = viewChild(AndesAlertDialog);
  protected readonly okLoading = signal(false);
  protected readonly cancelLoading = signal(false);

  protected readonly showCancel = computed(
    () => this.ref().config().okCancel ?? this.ref().kind === 'confirm',
  );

  protected readonly autoFocusButton = computed(() => {
    const configured = this.ref().config().autoFocusButton;
    if (configured !== undefined) {
      return configured;
    }
    return this.showCancel() ? 'cancel' : 'ok';
  });

  protected readonly surfaceClass = computed(() => {
    const cfg = this.ref().config();
    // The kind's own class stays for consumers' styling; the tone's decides the icon colour.
    return [
      'andes-dialog--method',
      `andes-dialog--method-${this.ref().kind}`,
      `andes-dialog--method-${TONE_CLASSES[this.tone()]}`,
      cfg.closable ? 'andes-dialog--method-closable' : '',
      cfg.className ?? '',
    ]
      .filter((name, at, all) => name && all.indexOf(name) === at)
      .join(' ');
  });

  /** The status the icon shows: the `tone` asked for, else the kind's own. */
  protected readonly tone = computed(
    () => this.ref().config().tone ?? METHOD_TONES[this.ref().kind],
  );

  protected readonly iconName = computed(
    () => ANDES_DIALOG_STATUS_ICONS[this.tone()],
  );

  /** Why the last OK failed; cleared by the next attempt. */
  protected readonly failure = signal<string | null>(null);

  /** Accessible name when no title is given, so the alertdialog is never unnamed. */
  protected readonly defaultLabel = computed(() => {
    const kind = this.ref().kind;
    return kind.charAt(0).toUpperCase() + kind.slice(1);
  });

  protected readonly footerContext: AndesDialogFooterContext = (() => {
    const actions = {
      ok: () => this.runOk(),
      cancel: () => this.runCancel(),
    };
    return { $implicit: actions, ...actions };
  })();

  /** How the pending close should settle `result`. */
  private outcome: boolean | null = null;
  private cancelHandled = false;
  /** Which way out was taken, when the code (not the overlay) knows. */
  private source: AndesDialogMethodCloseReason | null = null;
  /** What `onOk`'s promise resolved to. */
  private okValue: unknown;
  /** Set once a close is under way, so a late handler result cannot undo it. */
  private closing = false;

  protected asTemplate(
    value: AndesDialogMethodContent,
  ): TemplateRef<unknown> | null {
    return value instanceof TemplateRef ? value : null;
  }

  protected async runOk(): Promise<void> {
    if (this.okLoading() || this.cancelLoading()) {
      return;
    }
    this.failure.set(null);
    const done = await this.settleThrough(
      this.ref().config().onOk,
      this.okLoading,
      () => this.close(true),
      true,
    );
    if (done) {
      this.close(true);
    }
  }

  protected async runCancel(): Promise<void> {
    if (this.okLoading() || this.cancelLoading()) {
      return;
    }
    this.cancelHandled = true;
    const done = await this.settleThrough(
      this.ref().config().onCancel,
      this.cancelLoading,
      () => {
        // A deferred close still came from the Cancel button, whose handler has run.
        this.cancelHandled = true;
        this.source = 'cancel';
        this.close(false);
      },
    );
    if (done) {
      this.source = 'cancel';
      this.close(false);
    } else if (!this.closing) {
      this.cancelHandled = false;
    }
  }

  /** The "x": a cancel that does not wait on `onCancel`. */
  protected dismiss(): void {
    this.source = 'close-button';
    this.open.set(false);
  }

  /** @internal */
  close(confirmed: boolean): void {
    if (this.closing) {
      return;
    }
    this.closing = true;
    this.outcome = confirmed;
    this.open.set(false);
  }

  /** @internal Closes without running any handler, for `destroy()`. */
  destroy(): void {
    this.cancelHandled = true;
    this.source = 'destroyed';
    if (this.root()?.isOpen()) {
      this.close(false);
    } else {
      // Destroyed before the overlay attached: there is no close to wait for.
      this.open.set(false);
      this.ref().settle(false);
    }
  }

  protected onClosed(reason: AndesOverlayCloseReason): void {
    const confirmed = this.outcome ?? false;
    // Escape and the "x" close the overlay before any handler runs, so they are the
    // one path that still owes `onCancel` a call. Its result cannot keep the dialog
    // open any more, but a rejection must not go unhandled either.
    if (!confirmed && !this.cancelHandled && reason !== 'destroyed') {
      Promise.resolve()
        .then(() =>
          this.ref()
            .config()
            .onCancel?.(() => undefined),
        )
        .catch((error: unknown) => console.error(error));
    }
    this.ref().settle(confirmed, {
      reason: confirmed ? 'ok' : (this.source ?? closeReasonOf(reason)),
      value: confirmed ? this.okValue : undefined,
    });
  }

  /** A failed handler: logged, and (for OK) shown in the dialog so the user can retry. */
  private report(error: unknown, isOk: boolean): void {
    console.error(error);
    if (!isOk) {
      return;
    }
    const custom = this.ref().config().errorMessage;
    const message =
      typeof custom === 'function'
        ? custom(error)
        : (custom ??
          (error instanceof Error && error.message
            ? error.message
            : 'Something went wrong. Try again.'));
    this.failure.set(message);
  }

  /**
   * Runs a handler, holding `loading` while a returned promise is pending. Resolves
   * whether the dialog should now close: a rejected promise keeps it open (so the
   * user can retry) and is logged rather than swallowed, and a handler that declared
   * the `close` parameter without returning a promise keeps it open until it calls
   * `close`.
   */
  private async settleThrough(
    handler: ((close: () => void) => unknown) | undefined,
    loading: WritableSignal<boolean>,
    close: () => void,
    isOk = false,
  ): Promise<boolean> {
    let result: unknown;
    try {
      result = handler?.(close);
    } catch (error) {
      this.report(error, isOk);
      return false;
    }
    if (!isPromiseLike(result)) {
      return !handler || handler.length === 0;
    }
    loading.set(true);
    try {
      const value = await result;
      if (isOk) {
        this.okValue = value;
      }
      return true;
    } catch (error) {
      this.report(error, isOk);
      return false;
    } finally {
      loading.set(false);
    }
  }
}

function closeReasonOf(
  reason: AndesOverlayCloseReason,
): AndesDialogMethodCloseReason {
  switch (reason) {
    case 'escape-key':
      return 'escape';
    case 'outside-click':
    case 'backdrop-click':
      return 'backdrop';
    case 'close-button':
      return 'close-button';
    case 'destroyed':
      return 'destroyed';
    default:
      return 'cancel';
  }
}

function isPromiseLike(value: unknown): value is PromiseLike<unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { then?: unknown }).then === 'function'
  );
}

/**
 * Imperative dialogs: `confirm()`, `info()`, `success()`, `error()` and `warning()`.
 *
 * Each call renders an `AndesAlertDialog` and returns an `AndesDialogMethodRef` to
 * update, destroy or await it. Because the service is injected, dialogs it opens
 * already live inside the app's injector tree, so no separate context holder is
 * needed.
 *
 * ```ts
 * private readonly dialogs = inject(AndesDialogService);
 *
 * async delete() {
 *   const ref = this.dialogs.confirm({
 *     title: 'Delete this project?',
 *     content: 'This cannot be undone.',
 *     okText: 'Delete',
 *     okType: 'danger',
 *     onOk: () => this.api.delete(this.id), // OK spins until this settles
 *   });
 *   if (await ref.result) {
 *     this.router.navigate(['/projects']);
 *   }
 * }
 * ```
 */
@Injectable({ providedIn: 'root' })
export class AndesDialogService {
  private readonly appRef = inject(ApplicationRef);
  private readonly environmentInjector = inject(EnvironmentInjector);
  private readonly open = new Set<AndesDialogMethodRef>();
  private readonly waiting: AndesDialogMethodRef[] = [];

  /** A confirmation with OK and Cancel. */
  confirm(config: AndesDialogMethodConfig): AndesDialogMethodRef {
    return this.show('confirm', config);
  }

  /** An informational acknowledgement (OK only). */
  info(config: AndesDialogMethodConfig): AndesDialogMethodRef {
    return this.show('info', config);
  }

  /** A success acknowledgement (OK only). */
  success(config: AndesDialogMethodConfig): AndesDialogMethodRef {
    return this.show('success', config);
  }

  /** An error acknowledgement (OK only). */
  error(config: AndesDialogMethodConfig): AndesDialogMethodRef {
    return this.show('error', config);
  }

  /** A warning acknowledgement (OK only). */
  warning(config: AndesDialogMethodConfig): AndesDialogMethodRef {
    return this.show('warning', config);
  }

  /** Destroys every dialog this service has open, and withdraws the queued ones. */
  destroyAll(): void {
    for (const ref of [...this.waiting]) {
      ref.destroy();
    }
    for (const ref of [...this.open]) {
      ref.destroy();
    }
  }

  private show(
    kind: AndesDialogMethodKind,
    config: AndesDialogMethodConfig,
  ): AndesDialogMethodRef {
    const ref = new AndesDialogMethodRef(kind, config);
    if (config.queue && (this.open.size > 0 || this.waiting.length > 0)) {
      this.waiting.push(ref);
      // Withdrawn (destroyed while it waits, or settled in any other way): off the queue.
      void ref.result.then(() => {
        const at = this.waiting.indexOf(ref);
        if (at !== -1) {
          this.waiting.splice(at, 1);
        }
      });
      return ref;
    }
    this.render(ref);
    return ref;
  }

  /** Opens the next queued dialog once nothing else is open. */
  private next(): void {
    if (this.open.size > 0) {
      return;
    }
    const ref = this.waiting.shift();
    if (ref && !ref.closed()) {
      this.render(ref);
    }
  }

  private render(ref: AndesDialogMethodRef): void {
    const componentRef = createComponent(AndesDialogMethod, {
      environmentInjector: this.environmentInjector,
    });
    componentRef.setInput('ref', ref);
    ref.attach(() => componentRef.instance.destroy());
    this.appRef.attachView(componentRef.hostView);
    this.open.add(ref);

    void ref.result.then(() => {
      this.open.delete(ref);
      // Deferred a task: the close that settled `result` is still unwinding
      // through the dialog being torn down here.
      setTimeout(() => {
        componentRef.destroy();
        ref.config().afterClose?.();
        this.next();
      });
    });
  }
}
