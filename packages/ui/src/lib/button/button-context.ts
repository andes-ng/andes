import { InjectionToken, Signal } from '@angular/core';

/**
 * What a control that hosts buttons tells the ones inside it. A button reads it optionally, so
 * outside such a control nothing changes. Today that is only the disabled state, which saves
 * repeating `[disabled]` on a button projected into an upload (or any control that provides this).
 */
export interface AndesButtonContext {
  /** When `true`, every button in the control is disabled, whatever its own `disabled` says. */
  readonly disabled: Signal<boolean>;
}

export const ANDES_BUTTON_CONTEXT = new InjectionToken<AndesButtonContext>(
  'ANDES_BUTTON_CONTEXT',
);
