import {
  type AfterContentChecked,
  computed,
  DestroyRef,
  Directive,
  type DoCheck,
  ElementRef,
  forwardRef,
  inject,
  Injector,
  type OnInit,
  signal,
  type Signal,
  untracked,
} from '@angular/core';
import {
  type AbstractControl,
  FormGroupDirective,
  FormResetEvent,
  NgControl,
  NgForm,
  type ValidationErrors,
  Validators,
} from '@angular/forms';
import { FORM_FIELD, type FormField } from '@angular/forms/signals';
import type { Observable, Subscription } from 'rxjs';

import {
  ANDES_FORM,
  ANDES_FORM_CONTROL,
  ANDES_FORM_FIELD,
  type AndesFormControlApi,
} from './form-field-tokens';

/**
 * The HTML elements that are both *labelable* (a `<label for>` can point at them) and able to
 * carry `aria-describedby`/`aria-invalid`/`aria-required` meaningfully on the very element this
 * directive sits on.
 *
 * A custom element is only labelable when it is registered with `formAssociated = true`, which
 * no Angular component is, so a library control (`<andes-input>`) never qualifies: it puts the
 * field's id and ARIA on its own inner element instead (see `injectAndesFieldBinding()`).
 */
const LABELABLE_NATIVE_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT']);

/**
 * The `events` stream reactive forms put on every `AbstractControl`. The stand-in control
 * signal forms hand out through `NgControl` has no such stream: its getters read signals, so a
 * `computed()` over them is already reactive.
 */
interface ControlWithEvents {
  readonly events?: Observable<unknown>;
}

/**
 * The state of the Angular forms control bound to one element, read through that element's
 * `NgControl` - whichever directive registered it (`formControlName`, `[formControl]`,
 * `ngModel` or signal forms' `[formField]`) - and registered with the enclosing
 * `AndesFormField`.
 *
 * It is the body of the `andesFormControl` directive, and also what a library control creates
 * for itself when it sits in a field without that directive (see `injectAndesFieldBinding()`).
 * Must be constructed in an injection context. The `NgControl` is looked up lazily, from
 * {@link sync}, never while constructing: a control component that injects this state from its
 * own constructor is the `NgControl`'s value accessor, so an eager lookup would be circular.
 */
export class AndesFormControlState implements AndesFormControlApi {
  private readonly injector = inject(Injector);
  protected readonly field = inject(ANDES_FORM_FIELD, { optional: true });
  private readonly form = inject(ANDES_FORM, { optional: true });
  /** The enclosing reactive (`[formGroup]`) or template-driven (`<form>`/`ngForm`) form, if
   *  any - read for its `submitted` flag, so a failed submit reveals every error at once. */
  private readonly formDirective =
    inject(FormGroupDirective, { optional: true }) ??
    inject(NgForm, { optional: true });
  protected readonly element =
    inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  private ngControl: NgControl | null | undefined;
  private subscriptions: Subscription[] = [];
  private readonly bound = signal<AbstractControl | null>(null);
  /** Bumped on every event of the bound control so the plain-property
   *  reads below are re-evaluated. Signal forms' getters are tracked on their own. */
  private readonly tick = signal(0);
  /** Bumped on submit and reset of the enclosing Angular form. */
  private readonly submitTick = signal(0);

  private read<T>(pick: (control: AbstractControl) => T, fallback: T) {
    return computed(() => {
      this.tick();
      const control = this.bound();
      return control ? pick(control) : fallback;
    });
  }

  protected readonly invalid = this.read((c) => c.invalid === true, false);
  protected readonly touched = this.read((c) => c.touched === true, false);
  protected readonly dirty = this.read((c) => c.dirty === true, false);

  /** Whether the enclosing form was submitted (and not reset since). Reads the Angular form
   *  directive when there is one, else the `AndesForm` on the `<form>` (signal forms). */
  readonly submitted = computed(() => {
    this.submitTick();
    this.tick();
    if (this.formDirective) {
      return this.formDirective.submitted;
    }
    return this.form?.submitted() ?? false;
  });

  /**
   * Whether the status (error, warning, validating, success) is worth showing yet - by default
   * once the control is touched or dirty, or the enclosing `<form>` has been submitted. The
   * exact gate is the enclosing field's (else form's) `showErrorsOn`.
   */
  readonly interacted = computed(() => {
    const gate =
      this.field?.resolvedShowErrorsOn() ??
      this.form?.showErrorsOn() ??
      'interacted';
    switch (gate) {
      case 'always':
        return true;
      case 'submitted':
        return this.submitted();
      case 'touched':
        return this.touched() || this.submitted();
      case 'dirty':
        return this.dirty() || this.submitted();
      default:
        return this.touched() || this.dirty() || this.submitted();
    }
  });

  /** `invalid` once the {@link interacted} gate is open - Angular's idiomatic "don't yell at
   *  the user before they've interacted with the field" rule, widened to a submitted form. */
  readonly showError = computed(() => this.invalid() && this.interacted());

  /** An async validator is still running (`control.pending`). */
  readonly pending = this.read((c) => c.pending === true, false);

  readonly valid = this.read((c) => c.valid === true, false);

  /** The bound control's current `ValidationErrors`, as a signal. */
  readonly errors = this.read<ValidationErrors | null>(
    (c) => c.errors ?? null,
    null,
  );

  readonly value = this.read<unknown>((c) => c.value, undefined);

  /** The bound control, once a forms directive has created it. With signal forms this is the
   *  stand-in control `[formField]` exposes through `NgControl`. */
  readonly control: Signal<AbstractControl | null> = this.bound.asReadonly();

  private readonly pathState = signal<string | null>(null);

  /** The control's path from its form root, joined with `.`, or `null` when standalone. */
  readonly path = computed(() => {
    const signalField = this.signalFieldState();
    if (signalField) {
      const root = this.form?.signalRootName();
      const name = signalField.name();
      return root && name.startsWith(`${root}.`)
        ? name.slice(root.length + 1)
        : null;
    }
    return this.pathState();
  });

  private readonly signalFieldRef = signal<FormField<unknown> | null>(null);
  private readonly signalFieldState = computed(
    () => this.signalFieldRef()?.state() ?? null,
  );

  /** Whether a signal forms schema hides this field (`hidden()`); the field hides itself. */
  readonly hidden = computed(() => this.signalFieldState()?.hidden() ?? false);

  private readonly requiredAttribute = signal(false);

  /**
   * Whether the bound control carries `Validators.required` or `Validators.requiredTrue`, or -
   * with signal forms - a `required()` rule. Read through `AbstractControl.hasValidator()`, so
   * validators swapped at runtime are followed. The template-driven `required` attribute is
   * covered by {@link markedRequired} instead.
   */
  readonly isRequired = this.read(
    (c) =>
      c.hasValidator(Validators.required) ||
      c.hasValidator(Validators.requiredTrue),
    false,
  );

  /** `'true'` when {@link isRequired} is set, `null` otherwise - shaped as an attribute
   *  value. */
  readonly ariaRequired = computed(() => (this.isRequired() ? 'true' : null));

  /** Whether the label should carry a required mark: {@link isRequired}, or a native
   *  `required` attribute on the element (template-driven forms). */
  readonly markedRequired = computed(
    () => this.isRequired() || this.requiredAttribute(),
  );

  /** The id of the enclosing field's control, or `null` outside a field. */
  readonly resolvedId = computed(() => this.field?.controlId() ?? null);

  /** The ids of the enclosing field's description and messages, space separated, or `null`
   *  when there are none. */
  readonly describedBy = computed(() => this.field?.describedBy() ?? null);

  /** The enclosing field's `<andes-form-label>` id, or `null` when there is no label. */
  readonly labelledBy = computed(() => this.field?.labelledBy() ?? null);

  constructor() {
    // Registered while constructing, before the field's own view is first checked, so the field
    // never renders a frame without knowing its control.
    const unregister = this.field?.registerControl(this);
    const destroyRef = inject(DestroyRef);
    destroyRef.onDestroy(() => {
      unregister?.();
      this.unsubscribe();
    });
    if (this.formDirective) {
      // `ngSubmit` fires once `submitted` is true; a reset of the form flips it back after the
      // reset event, hence the microtask in `bind()`.
      const submit = this.formDirective.ngSubmit.subscribe(() =>
        this.submitTick.update((n) => n + 1),
      );
      destroyRef.onDestroy(() => submit.unsubscribe());
    }
  }

  /**
   * Looks the `NgControl` up (once) and follows the control it currently points at. Cheap when
   * nothing changed, so it can run on every change detection: a `[formControl]` re-bound to
   * another `FormControl` keeps the same directive and only swaps its control.
   */
  sync(): void {
    if (this.ngControl === undefined) {
      this.ngControl = this.injector.get(NgControl, null, {
        self: true,
        optional: true,
      });
      this.signalFieldRef.set(
        this.injector.get(FORM_FIELD, null, {
          self: true,
          optional: true,
        }) as FormField<unknown> | null,
      );
    }
    this.requiredAttribute.set(
      LABELABLE_NATIVE_TAGS.has(this.element.tagName) &&
        this.element.hasAttribute('required'),
    );
    const control = (this.ngControl?.control ?? null) as AbstractControl | null;
    if (control === untracked(this.bound)) {
      return;
    }
    this.bind(control);
  }

  private bind(control: AbstractControl | null): void {
    this.unsubscribe();
    const path = this.ngControl?.path ?? [];
    this.pathState.set(path.length > 0 ? path.join('.') : null);
    this.bound.set(control);
    const bump = () => this.tick.update((n) => n + 1);
    const events = (control as ControlWithEvents | null)?.events;
    if (control && events) {
      this.subscriptions.push(events.subscribe(bump));
      const rootEvents = (control.root as ControlWithEvents | null)?.events;
      if (rootEvents) {
        this.subscriptions.push(
          rootEvents.subscribe((event) => {
            // `resetForm()` resets the controls - emitting this event - and only then clears
            // `submitted`, so read it again once that has happened.
            if (event instanceof FormResetEvent) {
              queueMicrotask(() => this.submitTick.update((n) => n + 1));
            }
          }),
        );
      }
    }
    bump();
  }

  private unsubscribe(): void {
    for (const subscription of this.subscriptions) {
      subscription.unsubscribe();
    }
    this.subscriptions = [];
  }
}

/**
 * Registers the form control on its element with the enclosing `AndesFormField`, which derives
 * its status, messages and required mark from it. Applied on the actual control - a native
 * `<input>`/`<select>`/`<textarea>`, or a `ControlValueAccessor` component - alongside
 * `formControlName`, `[formControl]`, `[(ngModel)]` or signal forms' `[formField]`.
 *
 * On a native element it also writes `id`, `aria-describedby`, `aria-invalid`, `aria-required`
 * and `aria-busy` onto that element, so `<label for>` resolves to it and assistive technology
 * reads the field's state.
 *
 * On one of this library's controls (`<andes-input>`, `<andes-select>`, ...) it writes nothing
 * on the host, which is not a labelable element. Those controls read the field themselves
 * through `injectAndesFieldBinding()` and put the id and ARIA on their own inner element, and
 * they register with the field even without this directive. Applying it to them is harmless, and
 * still useful as a template reference (`#ctrl="andesFormControl"`) to the state signals below.
 *
 * A third-party `ControlValueAccessor` component that does neither can be wired by hand from
 * those signals:
 *
 * ```html
 * <andes-form-field label="Accept" #field="andesFormField">
 *   <other-checkbox andesFormControl #ctrl="andesFormControl" [formControl]="accept"
 *     [inputId]="field.controlId()" [describedBy]="ctrl.describedBy()"
 *     [invalid]="field.showError()" [ariaRequired]="ctrl.isRequired()" />
 * </andes-form-field>
 * ```
 */
@Directive({
  selector: '[andesFormControl]',
  exportAs: 'andesFormControl',
  providers: [
    {
      provide: ANDES_FORM_CONTROL,
      useExisting: forwardRef(() => AndesFormControl),
    },
  ],
  host: {
    '[attr.id]': 'hostId()',
    '[attr.aria-describedby]': 'hostDescribedBy()',
    '[attr.aria-invalid]': 'hostAriaInvalid()',
    '[attr.aria-required]': 'hostAriaRequired()',
    '[attr.aria-busy]': 'hostAriaBusy()',
  },
})
export class AndesFormControl
  extends AndesFormControlState
  implements OnInit, DoCheck, AfterContentChecked
{
  /** Whether this directive sits directly on a native, labelable form element - the single
   *  gate on whether the host bindings below write anything. */
  readonly isNativeFormElement = LABELABLE_NATIVE_TAGS.has(
    this.element.tagName,
  );

  protected readonly hostId = computed(() =>
    this.isNativeFormElement ? this.resolvedId() : null,
  );

  protected readonly hostDescribedBy = computed(() =>
    this.isNativeFormElement ? this.describedBy() : null,
  );

  protected readonly hostAriaInvalid = computed(() =>
    this.isNativeFormElement && (this.field?.showError() ?? this.showError())
      ? 'true'
      : null,
  );

  protected readonly hostAriaBusy = computed(() =>
    this.isNativeFormElement && this.pending() ? 'true' : null,
  );

  protected readonly hostAriaRequired = computed(() =>
    this.isNativeFormElement ? this.ariaRequired() : null,
  );

  ngOnInit(): void {
    this.sync();
  }

  ngDoCheck(): void {
    this.sync();
  }

  // The forms directive on the same element may apply a re-bound `[formControl]` after this
  // directive's `ngDoCheck`; content hooks run once every directive of the view has.
  ngAfterContentChecked(): void {
    this.sync();
  }
}
