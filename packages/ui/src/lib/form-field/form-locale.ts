import { InjectionToken, type Provider } from '@angular/core';

import { ANDES_DEFAULT_FORM_ERROR_MESSAGES } from './form-error-messages';
import {
  ANDES_FORM_ERROR_MESSAGES,
  type AndesFormErrorMessages,
} from './form-field-tokens';

/**
 * The texts the form shows by itself, for one language: the `requiredMark="optional"` suffix,
 * the accessible name of a label's tooltip button, and the generated error messages.
 */
export interface AndesFormLocale {
  /** Suffix of a non-required field's label with `requiredMark="optional"`. */
  readonly optionalText: string;
  /** Accessible name of the info button `tooltip` adds next to a label. */
  readonly tooltipLabel: string;
  /** Message per validator error key; see `provideAndesFormErrorMessages()`. */
  readonly errorMessages: AndesFormErrorMessages;
}

/** The built-in English texts. */
export const ANDES_FORM_LOCALE_EN: AndesFormLocale = {
  optionalText: '(optional)',
  tooltipLabel: 'More information',
  errorMessages: ANDES_DEFAULT_FORM_ERROR_MESSAGES,
};

/** Spanish texts, ready for `provideAndesFormLocale(ANDES_FORM_LOCALE_ES)`. */
export const ANDES_FORM_LOCALE_ES: AndesFormLocale = {
  optionalText: '(opcional)',
  tooltipLabel: 'Más información',
  errorMessages: {
    required: 'Este campo es obligatorio.',
    requiredTrue: 'Este campo es obligatorio.',
    email: 'Ingresa un correo electrónico válido.',
    minlength: 'Ingresa al menos {requiredLength} caracteres.',
    maxlength: 'Ingresa como máximo {requiredLength} caracteres.',
    minLength: 'Ingresa al menos {minLength} caracteres.',
    maxLength: 'Ingresa como máximo {maxLength} caracteres.',
    min: 'Ingresa un valor de al menos {min}.',
    max: 'Ingresa un valor de como máximo {max}.',
    pattern: 'El valor no tiene el formato esperado.',
    blank: 'Este campo no puede quedar en blanco.',
    exactlength: 'Ingresa exactamente {requiredLength} caracteres.',
    url: 'Ingresa una URL válida.',
    oneOf: 'Elige una de estas opciones: {allowed}.',
    mismatch: 'Los valores no coinciden.',
    default: 'Este valor no es válido.',
  },
};

/** The `optionalText` and `tooltipLabel` provided with {@link provideAndesFormLocale}. */
export const ANDES_FORM_LOCALE = new InjectionToken<AndesFormLocale>(
  'AndesFormLocale',
);

/**
 * Sets the language of everything the form writes by itself, for the injector subtree it is
 * provided in (app config, a route, a component): `ANDES_FORM_LOCALE_ES`, or a locale of your
 * own. Its error messages work like `provideAndesFormErrorMessages()` - an `andesForm`'s or a
 * field's `errorMessages` still win - and the `optionalText` / `tooltipLabel` inputs still win
 * over its texts.
 *
 * ```ts
 * providers: [provideAndesFormLocale(ANDES_FORM_LOCALE_ES)]
 * ```
 */
export function provideAndesFormLocale(locale: AndesFormLocale): Provider[] {
  return [
    { provide: ANDES_FORM_LOCALE, useValue: locale },
    { provide: ANDES_FORM_ERROR_MESSAGES, useValue: locale.errorMessages },
  ];
}
