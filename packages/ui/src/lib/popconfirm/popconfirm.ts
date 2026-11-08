import {
  provideAndesOverlay,
  type AndesOverlayCloseReason,
  type AndesOverlayRole,
  type AndesOverlaySide,
} from '@andes-ng/primitives';
import { NgTemplateOutlet } from '@angular/common';
import { OverlayContainer } from '@angular/cdk/overlay';
import {
  afterNextRender,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  ErrorHandler,
  inject,
  Injector,
  input,
  output,
  Renderer2,
  signal,
  TemplateRef,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCircleAlert } from '@ng-icons/lucide';

import {
  AndesButton,
  type AndesButtonColor,
  type AndesButtonShape,
  type AndesButtonSize,
  type AndesButtonVariant,
} from '../button/button';
import {
  AndesPopoverBase,
  andesPopoverRenderable,
} from '../popover/popover-base';
import { AndesPopoverOverlayContainer } from '../popover/popover-container';
import { AndesPopoverContent } from '../popover/popover-content';
import { AndesPopoverOutlet } from '../popover/popover-outlet';
import type { AndesPopoverContentInput } from '../popover/popover-types';

/**
 * Called when OK is pressed. Returning a promise keeps the OK button loading
 * until it settles: the popconfirm closes on resolve and stays open on reject.
 */
export type AndesPopconfirmHandler = () => unknown;

/**
 * Extra settings for one of the two buttons, on top of `okText` / `okType` / `okDisabled`
 * / `okLoading` (and their cancel counterparts). A value here wins over the matching input.
 */
export interface AndesPopconfirmButtonProps {
  /** Visual variant. */
  readonly variant?: AndesButtonVariant;
  /** Size. Default `'sm'`. */
  readonly size?: AndesButtonSize;
  readonly shape?: AndesButtonShape;
  /** Semantic colour for the variants that take one. */
  readonly color?: AndesButtonColor;
  /** Red, destructive styling. */
  readonly danger?: boolean;
  readonly ghost?: boolean;
  readonly disabled?: boolean;
  readonly loading?: boolean;
  /** Accessible name, when the label alone is not enough. */
  readonly ariaLabel?: string;
  /** Extra classes on the button. */
  readonly class?: string | readonly string[];
}

/** Which button receives focus when the popconfirm opens. */
export type AndesPopconfirmInitialFocus = 'cancel' | 'ok';

function classOf(value: string | readonly string[] | undefined): string {
  return typeof value === 'string' ? value : (value?.join(' ') ?? '');
}

function isPromiseLike(value: unknown): value is PromiseLike<unknown> {
  return (
    !!value &&
    (typeof value === 'object' || typeof value === 'function') &&
    typeof (value as PromiseLike<unknown>).then === 'function'
  );
}

/**
 * A small confirmation bubble anchored to the element that triggered an action -
 * lighter than an alert dialog for "are you sure?" checks on reversible or
 * low-stakes actions.
 *
 * ```html
 * <andes-popconfirm
 *   title="Delete the task"
 *   description="Are you sure to delete this task?"
 *   okType="danger"
 *   okText="Delete"
 *   [onConfirm]="deleteTask"
 *   (cancelled)="log('kept')"
 * >
 *   <button andes-button variant="danger" andesPopconfirmTrigger>Delete</button>
 * </andes-popconfirm>
 * ```
 *
 * Shares placement, triggers, arrow, collision handling and `[(open)]` with
 * `AndesPopover`, with defaults suited to a confirmation: `placement` top, arrow
 * on, `click` trigger. The panel is a non-modal `alertdialog` labelled by the
 * title and described by the description; focus starts on Cancel (on OK when
 * `showCancel` is off), Escape counts as Cancel, and an outside click simply
 * dismisses it.
 */
@Component({
  selector: 'andes-popconfirm',
  viewProviders: [provideIcons({ lucideCircleAlert })],
  imports: [
    NgIcon,
    AndesButton,
    AndesPopoverContent,
    AndesPopoverOutlet,
    NgTemplateOutlet,
  ],
  providers: [
    { provide: OverlayContainer, useClass: AndesPopoverOverlayContainer },
    provideAndesOverlay(),
    { provide: AndesPopoverBase, useExisting: AndesPopconfirm },
  ],
  templateUrl: './popconfirm.html',
  styleUrl: './popconfirm.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    // `title` is also a global HTML attribute - see `AndesPopover`.
    '[attr.title]': 'null',
  },
})
export class AndesPopconfirm extends AndesPopoverBase {
  private readonly errorHandler = inject(ErrorHandler);
  private readonly popconfirmInjector = inject(Injector);

  protected override readonly panelRole: AndesOverlayRole = 'alertdialog';

  /** Side of the trigger the panel prefers to render on. Default `'top'`. */
  override readonly side = input<AndesOverlaySide>('top');
  /** Renders the pointer on the panel. Default `true`. */
  override readonly showArrow = input(true, { transform: booleanAttribute });

  /** The question: text, a template or a function returning either. Labels the alert dialog. */
  readonly title = input<AndesPopoverContentInput>(undefined);
  /** Supporting text under the title: text, a template or a function returning either. */
  readonly description = input<AndesPopoverContentInput>(undefined);
  /**
   * Icon before the text. `undefined` (default) renders the warning icon, a
   * template replaces it, a string is the name of an icon registered with
   * `provideIcons` (any lucide icon), and `null` removes it.
   */
  readonly icon = input<TemplateRef<unknown> | string | null | undefined>(
    undefined,
  );
  /** OK button label. Default `'OK'`. */
  readonly okText = input('OK');
  /** Cancel button label. Default `'Cancel'`. */
  readonly cancelText = input('Cancel');
  /** OK button variant - `'danger'` for destructive actions. Default `'primary'`. */
  readonly okType = input<AndesButtonVariant>('primary');
  /** Cancel button variant. Default `'outline'`. */
  readonly cancelType = input<AndesButtonVariant>('outline');
  /** Further settings for the OK button (variant, size, colour, `aria-label`, class...). */
  readonly okButtonProps = input<AndesPopconfirmButtonProps | null | undefined>(
    undefined,
  );
  /** Further settings for the Cancel button. */
  readonly cancelButtonProps = input<
    AndesPopconfirmButtonProps | null | undefined
  >(undefined);
  /**
   * Which button gets focus when the popconfirm opens. Cancel by default, the safe
   * answer to a destructive question; `'ok'` for a routine one.
   */
  readonly initialFocus = input<AndesPopconfirmInitialFocus>('cancel');
  /** Disables the OK button. Default `false`. */
  readonly okDisabled = input(false, { transform: booleanAttribute });
  /** Shows the OK button's loading state. Default `false`. */
  readonly okLoading = input(false, { transform: booleanAttribute });
  /** Renders the Cancel button. Default `true`. */
  readonly showCancel = input(true, { transform: booleanAttribute });
  /**
   * Async-aware confirm handler (may return a promise). The
   * `confirm` output still fires first on every OK press.
   */
  readonly onConfirm = input<AndesPopconfirmHandler | undefined>(undefined);
  /**
   * Handler for Cancel and Escape (may return a promise, in which case both buttons wait
   * for it and the popconfirm closes when it settles). The `cancelled` output still
   * fires first.
   */
  readonly onCancel = input<AndesPopconfirmHandler | undefined>(undefined);

  /** OK was pressed. */
  readonly confirm = output<void>();
  /** Cancel was pressed, or Escape dismissed the popconfirm. */
  readonly cancelled = output<void>();
  /** Any click inside the panel, buttons included. */
  readonly popupClick = output<MouseEvent>();

  protected readonly panelTemplate = viewChild<TemplateRef<unknown>>('panel');

  protected readonly pending = signal<'ok' | 'cancel' | false>(false);
  protected readonly okBusy = computed(
    () => this.okLoading() || this.pending() === 'ok',
  );
  protected readonly cancelBusy = computed(() => this.pending() === 'cancel');

  protected readonly titleContent = computed(() =>
    andesPopoverRenderable(this.title()),
  );
  protected readonly descriptionContent = computed(() =>
    andesPopoverRenderable(this.description()),
  );

  override readonly panelLabelledBy = computed(() =>
    this.titleContent() ? this.titleId : null,
  );
  override readonly panelDescribedBy = computed(() =>
    this.descriptionContent() ? this.bodyId : null,
  );

  /** The OK button's resolved settings: `okButtonProps` over the dedicated inputs. */
  protected readonly ok = computed(() => {
    const props = this.okButtonProps() ?? {};
    return {
      variant: props.variant ?? this.okType(),
      size: props.size ?? 'sm',
      shape: props.shape ?? 'default',
      color: props.color,
      danger: props.danger ?? false,
      ghost: props.ghost ?? false,
      disabled: props.disabled ?? this.okDisabled(),
      loading: props.loading ?? this.okBusy(),
      ariaLabel: props.ariaLabel,
      class: classOf(props.class),
    };
  });

  /** The Cancel button's resolved settings: `cancelButtonProps` over `cancelType`. */
  protected readonly cancel = computed(() => {
    const props = this.cancelButtonProps() ?? {};
    return {
      variant: props.variant ?? this.cancelType(),
      size: props.size ?? 'sm',
      shape: props.shape ?? 'default',
      color: props.color,
      danger: props.danger ?? false,
      ghost: props.ghost ?? false,
      disabled: props.disabled ?? this.cancelBusy(),
      loading: props.loading ?? false,
      ariaLabel: props.ariaLabel,
      class: classOf(props.class),
    };
  });

  /** The icon, as the template or the icon name it was given as. */
  protected readonly iconTemplate = computed(() => {
    const icon = this.icon();
    return icon instanceof TemplateRef ? icon : null;
  });
  protected readonly iconName = computed(() => {
    const icon = this.icon();
    return typeof icon === 'string' ? icon : null;
  });

  /** Invalidates an in-flight `onConfirm` once the panel has closed. */
  private confirmRun = 0;

  constructor() {
    super();
    // The panel is portalled and has no interactive role of its own, so the
    // click is observed on its element rather than bound in the template.
    const renderer = inject(Renderer2);
    let stopListening: (() => void) | null = null;
    this.overlay.opened.pipe(takeUntilDestroyed()).subscribe(() => {
      stopListening?.();
      const panel = this.overlay.contentElement();
      stopListening = panel
        ? renderer.listen(panel, 'click', (event: MouseEvent) =>
            this.popupClick.emit(event),
          )
        : null;
    });
    this.overlay.closed.pipe(takeUntilDestroyed()).subscribe(() => {
      stopListening?.();
      stopListening = null;
    });
  }

  protected isTemplate(value: unknown): value is TemplateRef<unknown> {
    return value instanceof TemplateRef;
  }

  protected async handleOk(): Promise<void> {
    if (this.okDisabled() || this.okBusy() || this.pending()) {
      return;
    }
    this.confirm.emit();
    await this.settle(this.onConfirm, 'ok', 'confirm');
  }

  protected async handleCancel(): Promise<void> {
    if (this.pending()) {
      return;
    }
    this.cancelled.emit();
    await this.settle(this.onCancel, 'cancel', 'cancel');
  }

  /**
   * Runs a handler. A promise keeps the matching button busy until it settles: the
   * popconfirm closes on resolve and stays open on reject (the error goes to the
   * `ErrorHandler`). A plain result closes at once.
   */
  private async settle(
    handler: () => AndesPopconfirmHandler | undefined,
    button: 'ok' | 'cancel',
    source: 'confirm' | 'cancel',
  ): Promise<void> {
    const run = this.confirmRun;
    const result = handler()?.();
    if (isPromiseLike(result)) {
      this.pending.set(button);
      try {
        await result;
      } catch (error) {
        if (run === this.confirmRun) {
          this.pending.set(false);
          this.refocus(button);
        }
        this.errorHandler.handleError(error);
        return;
      }
      if (run !== this.confirmRun) {
        return;
      }
      this.pending.set(false);
    }
    this.requestClose(source);
  }

  /**
   * The busy button is disabled, which drops focus to `<body>` while the promise runs.
   * Once it is re-enabled after a rejection, put keyboard users back where they were so
   * they can retry or cancel.
   */
  private refocus(button: 'ok' | 'cancel'): void {
    afterNextRender(
      {
        write: () =>
          this.overlay
            .contentElement()
            ?.querySelector<HTMLElement>(`.andes-popconfirm-${button} button`)
            ?.focus(),
      },
      { injector: this.popconfirmInjector },
    );
  }

  protected override handleClosed(reason: AndesOverlayCloseReason): void {
    this.confirmRun++;
    this.pending.set(false);
    if (reason === 'escape-key') {
      this.cancelled.emit();
      // Escape has already closed it: the handler cannot keep it open, so a promise
      // is simply left to run.
      const result = this.onCancel()?.();
      if (isPromiseLike(result)) {
        result.then(undefined, (error) => this.errorHandler.handleError(error));
      }
    }
  }
}
