import {
  afterNextRender,
  booleanAttribute,
  computed,
  DestroyRef,
  Directive,
  effect,
  ElementRef,
  forwardRef,
  inject,
  Injector,
  input,
  output,
  signal,
  type Signal,
  type TemplateRef,
  untracked,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  type AbstractControl,
  FormArray,
  FormGroup,
  FormGroupDirective,
  FormResetEvent,
  NgForm,
} from '@angular/forms';
import { type FieldState, FormRoot } from '@angular/forms/signals';
import { filter, first, map, of } from 'rxjs';

import {
  ANDES_FORM,
  type AndesFormApi,
  type AndesFormColumn,
  type AndesFormErrorMessages,
  type AndesFormFeedbackIconContext,
  type AndesFormFieldError,
  type AndesFormInvalidSubmit,
  type AndesFormLabelAlign,
  type AndesFormLayout,
  type AndesFormMessageMode,
  type AndesFormRequiredMark,
  type AndesFormScrollOptions,
  type AndesFormShowErrorsOn,
  type AndesFormSize,
  type AndesFormVariant,
} from './form-field-tokens';
import { ANDES_FORM_LOCALE, ANDES_FORM_LOCALE_EN } from './form-locale';

/** Elements `scrollToFirstError` may move focus to, in the invalid field's control slot. */
const FOCUSABLE =
  'input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])';

const DEFAULT_SCROLL: AndesFormScrollOptions = {
  block: 'center',
  behavior: 'smooth',
  focus: true,
};

/** `true`/`''`/`'true'` -> defaults, an options object -> itself, anything falsy -> `false`. */
function scrollOption(value: unknown): boolean | AndesFormScrollOptions {
  return value !== null && typeof value === 'object'
    ? (value as AndesFormScrollOptions)
    : booleanAttribute(value);
}

/**
 * Every enabled control under `control` (itself included) that currently has errors, with its
 * path from `control` - the list `invalidSubmit` reports. Disabled controls are skipped, as
 * Angular leaves them out of the form's validity too.
 */
export function collectAndesFormErrors(
  control: AbstractControl,
  path: readonly (string | number)[] = [],
): AndesFormFieldError[] {
  if (control.disabled) {
    return [];
  }
  const own: AndesFormFieldError[] = control.errors
    ? [{ path, errors: control.errors }]
    : [];
  if (control instanceof FormArray) {
    return own.concat(
      control.controls.flatMap((child, index) =>
        collectAndesFormErrors(child, [...path, index]),
      ),
    );
  }
  if (control instanceof FormGroup) {
    return own.concat(
      Object.entries(control.controls).flatMap(([key, child]) =>
        collectAndesFormErrors(child, [...path, key]),
      ),
    );
  }
  return own;
}

/**
 * Form-wide layout and presentation defaults for every `AndesFormField` inside it (`layout`,
 * `labelCol`, `wrapperCol`, `labelAlign`, `labelWrap`, `colon`, `requiredMark`, `size`,
 * `variant`, `showErrorsOn`, `feedbackIcons`, `errorMessages`, `scrollToFirstError`), plus a
 * few thin conveniences over the Angular form on the same element: `disabled`,
 * `validSubmit` / `invalidSubmit` and `scrollToField()`.
 *
 * It is an attribute directive, not a component, so it composes with - rather than replaces -
 * Angular's own form directives on the same element:
 *
 * ```html
 * <form andesForm layout="horizontal" [labelCol]="6" [formGroup]="form" (ngSubmit)="save()">
 * ```
 *
 * Form *state* (values, validation, reset, submit) stays with `FormGroupDirective` /
 * `NgForm`, or signal forms' `[formRoot]`; nothing here duplicates a form store - `disabled`
 * and the submit outputs simply drive / read that same form. With `[formRoot]`, the submit
 * outputs, `valuesChange`, `submitted`, `reset()` and the field paths follow the signal form;
 * `disabled` cannot disable a signal form's model (use the schema's `disabled()` rule), so it
 * only reaches the controls that read {@link injectAndesFormDisabled}. The defaults reach the fields through DI
 * (`ANDES_FORM`), and every field-level input of the same name overrides them.
 *
 * Its host classes (`andes-form`, `andes-form--<layout>`) are styled from `form-field.css`,
 * which every field part injects - so the directive itself needs no stylesheet of its own.
 */
@Directive({
  selector: '[andesForm]',
  exportAs: 'andesForm',
  providers: [
    { provide: ANDES_FORM, useExisting: forwardRef(() => AndesForm) },
  ],
  host: {
    class: 'andes-form',
    '[class.andes-form--horizontal]': 'layout() === "horizontal"',
    '[class.andes-form--vertical]': 'layout() === "vertical"',
    '[class.andes-form--inline]': 'layout() === "inline"',
    '[attr.data-size]': 'size() ?? null',
    '[attr.data-variant]': 'variant() ?? null',
    '[attr.data-disabled]': 'disabled() ? "" : null',
    '(submit)': 'onSubmit()',
    '(reset)': 'onNativeReset()',
  },
})
export class AndesForm implements AndesFormApi {
  private readonly element =
    inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly injector = inject(Injector);
  /** The Angular form on the same element, if any - `[formGroup]` or the implicit `NgForm`. */
  private readonly formDirective =
    inject(FormGroupDirective, { self: true, optional: true }) ??
    inject(NgForm, { self: true, optional: true });
  /** Whether `disabled` is what disabled the form, so only then does it re-enable it. */
  private disabledByInput = false;
  /** Submit state of a form with no Angular form directive (signal forms, plain forms). */
  private readonly ownSubmitted = signal(false);
  /** Bumped when the Angular form directive is submitted or reset. */
  private readonly submitTick = signal(0);

  /** Defaults to `vertical` - the stacked layout every `AndesFormField` already had before
   *  this directive existed - so wrapping an existing form in `andesForm` never changes how
   *  it looks. */
  readonly layout = input<AndesFormLayout>('vertical');
  /** Label text alignment inside its column; only visible in `horizontal` layout. */
  readonly labelAlign = input<AndesFormLabelAlign>('right');
  /** Label column width in `horizontal` layout. Defaults to one third (`8` of 24). */
  readonly labelCol = input<AndesFormColumn | undefined>(undefined);
  /** Control column width in `horizontal` layout. Defaults to the remaining space. */
  readonly wrapperCol = input<AndesFormColumn | undefined>(undefined);
  /** Let long labels wrap instead of being truncated with an ellipsis (`horizontal`). */
  readonly labelWrap = input(false, { transform: booleanAttribute });
  /** Trailing colon after each label. Only ever drawn in `horizontal` layout. */
  readonly colon = input(true, { transform: booleanAttribute });
  readonly requiredMark = input<AndesFormRequiredMark>(true);
  /** Suffix used by `requiredMark="optional"`. Defaults to the provided locale's
   *  (`provideAndesFormLocale()`), else `(optional)`. */
  readonly optionalText = input(
    inject(ANDES_FORM_LOCALE, { optional: true })?.optionalText ??
      ANDES_FORM_LOCALE_EN.optionalText,
  );
  /**
   * Size hint for the controls inside. Fields do not resize anything themselves; controls
   * read it through {@link injectAndesFormSize}. Also reflected
   * as `data-size` on the host for plain-CSS consumers.
   */
  readonly size = input<AndesFormSize | undefined>(undefined);
  /**
   * Visual variant hint for the controls inside, read through {@link injectAndesFormVariant}
   * the same way `size` is. Also reflected as `data-variant` on the host.
   */
  readonly variant = input<AndesFormVariant | undefined>(undefined);
  /**
   * Disable every control of the Angular form on this element (`FormGroup.disable()`), and
   * re-enable them (`enable()`) when it goes back to `false`. Controls added later are
   * disabled as soon as the form emits its next event. Re-enabling enables the whole group,
   * including controls that were disabled on their own before - keep those disabled through
   * the form model instead. Also reflected as `data-disabled` and readable by non-form
   * controls (buttons, uploaders) through {@link injectAndesFormDisabled}.
   */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** When fields start showing their status; see {@link AndesFormShowErrorsOn}. Each field's
   *  own `showErrorsOn` wins. */
  readonly showErrorsOn = input<AndesFormShowErrorsOn>('interacted');
  /** Custom `hasFeedback` icons for every field - a template rendered with the status as
   *  `$implicit`. */
  readonly feedbackIcons = input<
    TemplateRef<AndesFormFeedbackIconContext> | undefined
  >(undefined);
  /** Error messages for every field in this form. */
  readonly errorMessages = input<AndesFormErrorMessages | undefined>(undefined);
  /** Every failing validator's message (`all`), or only the first; each field's own
   *  `messageMode` wins. */
  readonly messageMode = input<AndesFormMessageMode>('all');
  /**
   * Prefix of the ids the fields generate: a field whose control sits at `address.city` gets
   * `<name>_address_city`, stable across renders and server-side rendering, instead of a
   * counter. On a `<form>` it is also the form's native `name` attribute.
   */
  readonly name = input<string | undefined>(undefined);
  /**
   * On a submit that leaves the form invalid, scroll to and focus the first field in an error
   * state. Waits for pending async validators and one render, so that anything the submit
   * handler itself did (typically `markAllAsTouched()`) is already reflected in the fields.
   * `true` scrolls the field to the middle of the viewport, smoothly; an
   * {@link AndesFormScrollOptions} object tunes that, and `focus: false` scrolls only.
   */
  readonly scrollToFirstError = input<
    boolean | AndesFormScrollOptions,
    unknown
  >(false, { transform: scrollOption });

  /**
   * Emits the form's `value` on a submit that leaves it valid - after any pending async
   * validators settle. Needs a `[formGroup]` or template-driven form on the same element.
   */
  // The value's shape is the consumer's own form model.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly validSubmit = output<any>();

  /** Emits the value and every failing control on a submit that leaves the form invalid -
   *  after any pending async validators settle. */
  readonly invalidSubmit = output<AndesFormInvalidSubmit>();

  /** Emits the form's whole value each time it changes - typed by the user or set from code.
   *  Needs an Angular form on the same element. */
  // The value's shape is the consumer's own form model.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly valuesChange = output<any>();

  /** Emits after the form is reset - by {@link reset}, a `type="reset"` button or the Angular
   *  form directive's `resetForm()`. */
  readonly formReset = output<void>();

  /** Whether the form was submitted and not reset since - the Angular form directive's
   *  `submitted` when there is one, as a signal. */
  readonly submitted = computed(() => {
    this.submitTick();
    return this.formDirective
      ? this.formDirective.submitted
      : this.ownSubmitted();
  });

  /** Signal forms' `[formRoot]` on the same `<form>`, if any. */
  private readonly formRoot = inject(FormRoot, {
    self: true,
    optional: true,
  }) as FormRoot<unknown> | null;

  /** The state of the signal forms root field bound with `[formRoot]`. */
  private readonly signalRoot = computed<FieldState<unknown> | null>(
    () => (this.formRoot?.fieldTree()() as FieldState<unknown>) ?? null,
  );

  /** Name of the signal forms root field bound with `[formRoot]`; `null` without one. */
  readonly signalRootName = computed<string | null>(
    () => this.signalRoot()?.name() ?? null,
  );

  constructor() {
    const destroyRef = inject(DestroyRef);
    if (this.formRoot) {
      let initial = true;
      effect(() => {
        const value = this.signalRoot()?.value();
        if (initial) {
          initial = false;
          return;
        }
        untracked(() => this.valuesChange.emit(value));
      });
    }
    const formDirective = this.formDirective;
    if (!formDirective) {
      return;
    }
    formDirective.ngSubmit
      .pipe(takeUntilDestroyed(destroyRef))
      .subscribe(() => {
        this.submitTick.update((n) => n + 1);
        this.afterSubmit(formDirective.form);
      });

    effect(() => this.syncDisabled(this.disabled()));
    // `[formGroup]` may not be bound yet when the effect first runs, so sync once more after
    // the first render - and again a microtask later, once a template-driven form has
    // registered its controls (it does so asynchronously). From then on, re-apply on every
    // form event: a group gaining an enabled control flips back to enabled.
    afterNextRender(
      () => {
        this.syncDisabled(this.disabled());
        queueMicrotask(() => this.syncDisabled(this.disabled()));
        formDirective.form.events
          .pipe(takeUntilDestroyed(destroyRef))
          .subscribe((event) => {
            this.syncDisabled(this.disabled());
            if (event instanceof FormResetEvent) {
              // `resetForm()` clears `submitted` only after the reset event.
              queueMicrotask(() => this.submitTick.update((n) => n + 1));
            }
          });
        formDirective.form.valueChanges
          .pipe(takeUntilDestroyed(destroyRef))
          .subscribe((value) => this.valuesChange.emit(value));
      },
      { injector: this.injector },
    );
  }

  private syncDisabled(disabled: boolean): void {
    const form = this.formDirective?.form;
    if (!form) {
      return;
    }
    if (disabled) {
      if (!form.disabled) {
        this.disabledByInput = true;
        form.disable();
      }
    } else if (this.disabledByInput) {
      this.disabledByInput = false;
      form.enable();
    }
  }

  private afterSubmit(form: FormGroup): void {
    const settled = form.pending
      ? form.statusChanges.pipe(
          filter((status) => status !== 'PENDING'),
          first(),
          map(() => form),
        )
      : of(form);
    settled.subscribe(() => {
      if (form.valid || form.disabled) {
        this.validSubmit.emit(form.value);
        return;
      }
      this.invalidSubmit.emit({
        value: form.value,
        errors: collectAndesFormErrors(form),
      });
      this.scheduleScroll();
    });
  }

  protected onSubmit(): void {
    // With an Angular form on the element, scrolling waits for its verdict (`afterSubmit`).
    if (!this.formDirective) {
      this.ownSubmitted.set(true);
      if (this.formRoot) {
        this.afterSignalSubmit();
      } else {
        this.scheduleScroll();
      }
    }
  }

  /** The submit verdict of a signal form, once its async validators settle. */
  private afterSignalSubmit(): void {
    const root = untracked(this.signalRoot);
    if (!root) {
      return;
    }
    const decide = (): boolean => {
      if (root.pending()) {
        return false;
      }
      untracked(() => {
        if (root.valid()) {
          this.validSubmit.emit(root.value());
          return;
        }
        this.invalidSubmit.emit({
          value: root.value(),
          errors: this.signalErrors(root),
        });
        this.scheduleScroll();
      });
      return true;
    };
    if (untracked(decide)) {
      return;
    }
    const watcher = effect(
      () => {
        if (decide()) {
          watcher.destroy();
        }
      },
      { injector: this.injector },
    );
  }

  /** The errors of a signal form, grouped per field with its path from the root. */
  private signalErrors(root: FieldState<unknown>): AndesFormFieldError[] {
    const rootName = root.name();
    const byField = new Map<string, AndesFormFieldError>();
    for (const error of root.errorSummary()) {
      const name = error.fieldTree().name();
      const path =
        name === rootName
          ? []
          : name
              .slice(rootName.length + 1)
              .split('.')
              .map((key) => (/^\d+$/.test(key) ? Number(key) : key));
      const entry = byField.get(name) ?? { path, errors: {} };
      byField.set(name, {
        path: entry.path,
        errors: { ...entry.errors, [error.kind]: error },
      });
    }
    return [...byField.values()];
  }

  protected onNativeReset(): void {
    if (!this.formDirective) {
      this.untouchedSignalRoot();
      this.ownSubmitted.set(false);
    }
    // The Angular form directive resets itself on the same event; report it once it has.
    queueMicrotask(() => this.formReset.emit());
  }

  /**
   * Submits the form as its submit button would - from a dialog footer, a keyboard shortcut,
   * anywhere outside the `<form>` - running the same `ngSubmit`, `validSubmit` /
   * `invalidSubmit` and `scrollToFirstError` path.
   */
  submit(): void {
    const form = this.element as HTMLFormElement;
    if (typeof form.requestSubmit === 'function') {
      form.requestSubmit();
    } else {
      this.element.dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true }),
      );
    }
  }

  /**
   * Resets the form: values (to `value`, or each control's initial value), touched, dirty and
   * submitted, so no error stays on screen - `resetForm()` of the Angular form directive.
   * Emits {@link formReset}.
   */
  // The value's shape is the consumer's own form model.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  reset(value?: any): void {
    if (this.formDirective) {
      this.formDirective.resetForm(value);
    } else {
      this.untouchedSignalRoot(value);
      this.ownSubmitted.set(false);
    }
    this.formReset.emit();
  }

  /** Resets a signal form's touched and dirty state, and its value when one is given. */
  private untouchedSignalRoot(value?: unknown): void {
    const root = untracked(this.signalRoot);
    if (value === undefined) {
      root?.reset();
    } else {
      root?.reset(value);
    }
  }

  private scheduleScroll(): void {
    const option = this.scrollToFirstError();
    if (!option) {
      return;
    }
    afterNextRender(
      () => this.focusFirstError(option === true ? undefined : option),
      { injector: this.injector },
    );
  }

  /** Scrolls to and focuses the first field currently showing an error. Returns whether one
   *  was found. Public so it can also be called after a programmatic (non-submit) check. */
  focusFirstError(options?: AndesFormScrollOptions): boolean {
    return this.reveal(
      this.visibleFields('.andes-form-field--invalid')[0] ?? null,
      options,
    );
  }

  /** Fields matching `selector` that are on screen: a `hidden` field keeps validating, but
   *  there is nothing to scroll to or focus in it. */
  private visibleFields(selector: string): HTMLElement[] {
    return Array.from(
      this.element.querySelectorAll<HTMLElement>(selector),
    ).filter((field) => !field.closest('[hidden]'));
  }

  /**
   * Scrolls to (and by default focuses) the field whose control sits at `path` - the same
   * segments `FormGroup.get()` takes, as an array or a dot-separated string
   * (`'address.city'`, `['lines', 2, 'qty']`). Returns whether such a field was found.
   */
  scrollToField(
    path: string | readonly (string | number)[],
    options?: AndesFormScrollOptions,
  ): boolean {
    const key = typeof path === 'string' ? path : path.join('.');
    const field = this.visibleFields('.andes-form-field[data-path]').find(
      (candidate) => candidate.dataset['path'] === key,
    );
    return this.reveal(field ?? null, options);
  }

  private reveal(
    field: HTMLElement | null,
    options: AndesFormScrollOptions | undefined,
  ): boolean {
    if (!field) {
      return false;
    }
    const { focus, ...scroll } = { ...DEFAULT_SCROLL, ...options };
    field.scrollIntoView?.(scroll);
    if (focus) {
      field
        .querySelector('.andes-form-field__control')
        ?.querySelector<HTMLElement>(FOCUSABLE)
        ?.focus({ preventScroll: true });
    }
    return true;
  }
}

/**
 * The size of the nearest enclosing `AndesForm`, or `undefined` outside one - the hook a
 * control calls (in an injection context) to default its own `size` from the form's, so one
 * `size` on the form cascades to every control inside it:
 *
 * ```ts
 * private readonly formSize = injectAndesFormSize();
 * protected readonly effectiveSize = computed(() => this.size() ?? this.formSize() ?? 'md');
 * ```
 */
export function injectAndesFormSize(): Signal<AndesFormSize | undefined> {
  const form = inject(ANDES_FORM, { optional: true });
  return computed(() => form?.size());
}

/** The `variant` of the nearest enclosing `AndesForm`, or `undefined` - the variant
 *  counterpart of {@link injectAndesFormSize}. */
export function injectAndesFormVariant(): Signal<AndesFormVariant | undefined> {
  const form = inject(ANDES_FORM, { optional: true });
  return computed(() => form?.variant());
}

/**
 * Whether the nearest enclosing `AndesForm` is `disabled` (`false` outside one). Controls bound
 * to the form are already disabled through the form model; this is for the ones that are not -
 * an action button, an uploader - to follow the form anyway.
 */
export function injectAndesFormDisabled(): Signal<boolean> {
  const form = inject(ANDES_FORM, { optional: true });
  return computed(() => form?.disabled() ?? false);
}
