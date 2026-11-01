import type { Provider } from '@angular/core';
import type { ValidationErrors } from '@angular/forms';

import {
  ANDES_FORM_ERROR_MESSAGES,
  type AndesFormErrorMessages,
} from './form-field-tokens';

/**
 * Built-in messages for every validator `@angular/forms` ships (`Validators.*`, their
 * template-driven directive twins and signal forms' rules). Deliberately label-free, so they read correctly whether
 * or not the field was given a `label` input; use `{label}` in your own map if you want it.
 */
export const ANDES_DEFAULT_FORM_ERROR_MESSAGES: AndesFormErrorMessages = {
  required: 'This field is required.',
  requiredTrue: 'This field is required.',
  email: 'Enter a valid email address.',
  minlength: 'Enter at least {requiredLength} characters.',
  maxlength: 'Enter no more than {requiredLength} characters.',
  // Signal forms name these two in camel case, with the limit under the same key.
  minLength: 'Enter at least {minLength} characters.',
  maxLength: 'Enter no more than {maxLength} characters.',
  min: 'Enter a value of at least {min}.',
  max: 'Enter a value of at most {max}.',
  pattern: 'The value does not match the expected format.',
  default: 'This value is invalid.',
};

/**
 * Registers error messages for every `AndesFormField` in the injector subtree it is provided
 * in (app config, a route, or a component's `providers`). Entries are merged over the built-in
 * defaults, and are themselves overridden by an `AndesForm`'s or `AndesFormField`'s own
 * `errorMessages` input.
 *
 * ```ts
 * providers: [provideAndesFormErrorMessages({ required: 'Campo obligatorio.' })]
 * ```
 */
export function provideAndesFormErrorMessages(
  messages: AndesFormErrorMessages,
): Provider {
  return { provide: ANDES_FORM_ERROR_MESSAGES, useValue: messages };
}

const PLACEHOLDER = /\{(\w+)\}/g;

/**
 * Turns an Angular `ValidationErrors` object into display strings, one per failing validator
 * in the order the validators reported them. `maps` is highest-priority first; the built-in
 * defaults are always consulted last.
 */
export function resolveAndesFormErrorMessages(
  errors: ValidationErrors | null,
  maps: readonly (AndesFormErrorMessages | null | undefined)[],
  label: string | undefined,
): string[] {
  if (!errors) {
    return [];
  }
  const own = maps.filter((map): map is AndesFormErrorMessages => !!map);
  const find = (chain: readonly AndesFormErrorMessages[], key: string) =>
    chain.find((map) => Object.hasOwn(map, key))?.[key];

  return Object.entries(errors).map(([key, error]) => {
    // A key nobody mapped, whose validator already wrote a human-readable message - a string
    // error (`{ taken: 'That username is taken.' }`) or a signal forms error's `message` - is
    // its own best message, ahead of the built-in default for its kind.
    const written =
      typeof error === 'string'
        ? error
        : typeof error?.message === 'string'
          ? (error.message as string)
          : undefined;
    const message =
      find(own, key) ??
      written ??
      find([ANDES_DEFAULT_FORM_ERROR_MESSAGES], key) ??
      find(own, 'default') ??
      ANDES_DEFAULT_FORM_ERROR_MESSAGES['default'] ??
      '';
    if (typeof message === 'function') {
      return message(error, { key, label });
    }
    const values: Record<string, unknown> = {
      ...(error !== null && typeof error === 'object' ? error : {}),
      label: label ?? '',
    };
    return message.replace(PLACEHOLDER, (_, name: string) =>
      values[name] === undefined ? '' : String(values[name]),
    );
  });
}
