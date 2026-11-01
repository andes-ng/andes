import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  forwardRef,
  inject,
  input,
  type Signal,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import type { AbstractControl } from '@angular/forms';
import type { Observable } from 'rxjs';

import { resolveAndesFormErrorMessages } from './form-error-messages';
import {
  ANDES_FORM,
  ANDES_FORM_ERROR,
  ANDES_FORM_ERROR_MESSAGES,
  ANDES_FORM_FIELD,
  type AndesFormErrorMessages,
} from './form-field-tokens';

let nextErrorId = 0;

/** The messages of a group or array control's own errors, and whether to show them yet. */
export interface AndesControlErrors {
  /** The control is invalid on its own and was touched, changed or submitted. */
  readonly visible: Signal<boolean>;
  /** One display string per own error, resolved through the message maps. */
  readonly messages: Signal<readonly string[]>;
}

/**
 * Follows the own errors (not its children's) of `control()` - typically a `FormGroup` with a
 * cross-field validator or a `FormArray` with a length rule - and resolves their messages
 * through `messages()`, the enclosing form's `errorMessages` and `provideAndesFormErrorMessages`.
 * They are visible once the control is invalid and any of its controls was touched or changed,
 * or the enclosing form was submitted. Must run in an injection context.
 */
export function injectAndesControlErrors(
  control: () => AbstractControl | null | undefined,
  messages: () => AndesFormErrorMessages | undefined,
): AndesControlErrors {
  const form = inject(ANDES_FORM, { optional: true });
  const provided = inject(ANDES_FORM_ERROR_MESSAGES, { optional: true });
  const tick = signal(0);
  effect((onCleanup) => {
    const events = (control() as { events?: Observable<unknown> } | null)
      ?.events;
    const subscription = events?.subscribe(() => tick.update((n) => n + 1));
    onCleanup(() => subscription?.unsubscribe());
  });
  const state = computed(() => {
    tick();
    const target = control();
    return target
      ? {
          errors: target.errors,
          interacted: target.touched || target.dirty,
        }
      : null;
  });
  const visible = computed(() => {
    const current = state();
    return (
      !!current?.errors && (current.interacted || (form?.submitted() ?? false))
    );
  });
  return {
    visible,
    messages: computed(() =>
      visible()
        ? [
            ...new Set(
              resolveAndesFormErrorMessages(
                state()?.errors ?? null,
                [messages(), form?.errorMessages(), provided],
                undefined,
              ),
            ),
          ]
        : [],
    ),
  };
}

/**
 * Validation error message. Two uses:
 *
 * - inside an `AndesFormField`, a hand-written message for the field's control, rendered only
 *   while the field is in the `error` status (it then replaces the generated messages);
 * - with `[control]`, the errors of a group or array control that no single field shows - a
 *   `FormArray` that needs at least one row, a `FormGroup` validator - rendered once that
 *   control is invalid and touched, changed or submitted, with one generated line per error
 *   after any projected text. Give it an `id` to point an `aria-describedby` at.
 *
 * Rendered with `role="alert"`, so assistive technology announces the message the moment it
 * appears.
 */
@Component({
  selector: 'andes-form-error',
  imports: [],
  template: `@if (visible()) {
    <p
      class="andes-form-error"
      [id]="elementId()"
      role="alert"
      animate.leave="andes-form-field__message--leave"
    >
      <ng-content />
      @for (message of controlErrors.messages(); track message) {
        <span class="andes-form-error__item">{{ message }}</span>
      }
    </p>
  }`,
  styleUrl: './form-field.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // See the header comment in form-field.css for why the shared sheet is unscoped.
  encapsulation: ViewEncapsulation.None,
  // The `id` input names the message element; left on the host too, it would duplicate it.
  host: { '[attr.id]': 'null' },
  providers: [
    {
      provide: ANDES_FORM_ERROR,
      useExisting: forwardRef(() => AndesFormError),
    },
  ],
})
export class AndesFormError {
  protected readonly field = inject(ANDES_FORM_FIELD, { optional: true });
  private readonly autoId = `andes-form-error-${nextErrorId++}`;

  /** A group or array control whose own errors this message reports, instead of the field's
   *  control. */
  readonly control = input<AbstractControl | null | undefined>(undefined);

  /** Messages for the errors of `control`, merged over the form's and the provided ones. */
  readonly errorMessages = input<AndesFormErrorMessages | undefined>(undefined);

  /** Id of the message element. Defaults to the field's error id inside a field. */
  readonly id = input<string | undefined>(undefined);

  protected readonly controlErrors = injectAndesControlErrors(
    () => this.control(),
    () => this.errorMessages(),
  );

  protected readonly elementId = computed(
    () =>
      this.id() ??
      (this.control() ? this.autoId : (this.field?.errorId() ?? null)),
  );

  protected readonly visible = computed(() =>
    this.control()
      ? this.controlErrors.visible()
      : (this.field?.showError() ?? false),
  );
}
