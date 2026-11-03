import type {
  AbstractControl,
  AsyncValidatorFn,
  ValidationErrors,
  ValidatorFn,
} from '@angular/forms';
import { concatMap, defer, first, from, switchMap, timer } from 'rxjs';

/** Whether a value counts as "nothing entered", so a validator leaves it to `required`. */
function isEmpty(value: unknown): boolean {
  return (
    value === null ||
    value === undefined ||
    ((typeof value === 'string' || Array.isArray(value)) && value.length === 0)
  );
}

/**
 * Validators the reference form offers as rules and `Validators` does not: a value that is
 * only spaces, an exact length, a URL, a value from a fixed set and a value equal to another
 * control's. Each one passes on an empty value, like `Validators.minLength` does, so it
 * combines with `Validators.required`. The built-in messages cover each error key.
 *
 * Three helpers compose validators instead of checking a value. Angular runs every validator
 * of a control and merges their errors (`messageMode="first"` then only hides the extra
 * messages), and runs the async ones in parallel, only once the sync ones pass. {@link first}
 * and {@link firstAsync} stop at the first failing validator, so a later one - a server call -
 * never runs for a value an earlier one already rejected. {@link debounceAsync} waits for the
 * value to settle before an async validator runs.
 *
 * They are `ValidatorFn`s for reactive and template-driven forms. Signal forms already ship
 * `required`, `email`, `min`, `max`, `minLength`, `maxLength` and `pattern`; write the rest with
 * `validate()` there.
 */
export const AndesValidators = {
  /**
   * Fails a string made only of whitespace with `{ blank: true }` - `Validators.required`
   * accepts `'   '`. Pair it with `Validators.required` for the required mark.
   */
  notBlank(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    return typeof value === 'string' && value.length > 0 && !value.trim()
      ? { blank: true }
      : null;
  },

  /**
   * Requires exactly `length` characters (or array items):
   * `{ exactlength: { requiredLength, actualLength } }`.
   */
  exactLength(length: number): ValidatorFn {
    return (control) => {
      const value = control.value as { length?: unknown } | null;
      if (isEmpty(value) || typeof value?.length !== 'number') {
        return null;
      }
      return value.length === length
        ? null
        : {
            exactlength: { requiredLength: length, actualLength: value.length },
          };
    };
  },

  /**
   * Requires an absolute URL whose scheme is one of `protocols` (`http` and `https` by
   * default): `{ url: { protocols } }`.
   */
  url(options: { readonly protocols?: readonly string[] } = {}): ValidatorFn {
    const protocols = options.protocols ?? ['http', 'https'];
    return (control) => {
      const value = control.value;
      if (isEmpty(value)) {
        return null;
      }
      let scheme: string | null = null;
      try {
        scheme = new URL(String(value)).protocol.replace(/:$/, '');
      } catch {
        scheme = null;
      }
      return scheme && protocols.includes(scheme)
        ? null
        : { url: { protocols: protocols.join(', ') } };
    };
  },

  /** Requires one of `allowed` (compared with `Object.is`): `{ oneOf: { allowed } }`. */
  oneOf(allowed: readonly unknown[]): ValidatorFn {
    return (control) =>
      isEmpty(control.value) ||
      allowed.some((item) => Object.is(item, control.value))
        ? null
        : { oneOf: { allowed: allowed.join(', ') } };
  },

  /**
   * Runs `validators` in order and returns the errors of the first one that fails; the rest do
   * not run. `null` and `undefined` entries are skipped, so it takes a conditional list:
   *
   * ```ts
   * new FormControl('', AndesValidators.first(Validators.required, Validators.email));
   * ```
   */
  first(
    ...validators: readonly (ValidatorFn | null | undefined)[]
  ): ValidatorFn {
    return (control) => {
      for (const validator of validators) {
        const errors = validator?.(control);
        if (errors) {
          return errors;
        }
      }
      return null;
    };
  },

  /**
   * The async counterpart of {@link first}: runs `validators` one after the other, waiting for
   * each, and settles on the errors of the first that fails - later ones, a slower server
   * call among them, never start. Angular's own async validators run in parallel.
   */
  firstAsync(...validators: readonly AsyncValidatorFn[]): AsyncValidatorFn {
    return (control) =>
      from(validators).pipe(
        concatMap((validator) => defer(() => validator(control))),
        first((errors) => !!errors, null),
      );
  },

  /**
   * Runs `validator` once the control has gone `milliseconds` without changing. A new value
   * cancels the wait (Angular drops the async validation it replaces), so a username check
   * asks the server when the user stops typing, not on every key. The control is `pending`
   * meanwhile. Set the `validateDebounce` input on a field or form to do this to the
   * validators already on the control.
   */
  debounceAsync(
    validator: AsyncValidatorFn,
    milliseconds: number,
  ): AsyncValidatorFn {
    return (control) =>
      timer(milliseconds).pipe(
        switchMap(() => defer(() => validator(control))),
      );
  },

  /**
   * Requires the same value as the control at `path` from the form root - a password
   * confirmation: `{ mismatch: { field: path } }`. Add `dependsOn="<path>"` on the field so it
   * runs again when the other control changes.
   */
  matchField(path: string): ValidatorFn {
    return (control) => {
      const other = control.root.get(path);
      return !other || isEmpty(control.value) || control.value === other.value
        ? null
        : { mismatch: { field: path } };
    };
  },
} as const;
