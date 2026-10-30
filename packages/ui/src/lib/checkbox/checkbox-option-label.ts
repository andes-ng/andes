import { Directive, inject, TemplateRef } from '@angular/core';

import { AndesCheckboxValue } from './checkbox-group-state';
import type { AndesCheckboxVariant } from './checkbox-types';

/**
 * One entry of `AndesCheckboxGroup`'s `options` input, in its object form. A bare string or
 * number is shorthand for `{ label: String(v), value: v }`; an object value is always given in
 * this form.
 */
export interface AndesCheckboxOption<T extends AndesCheckboxValue = string> {
  readonly label: string;
  readonly value: T;
  /**
   * Secondary text under the label (muted, and linked to the input with `aria-describedby`),
   * e.g. what a plan includes on a card.
   */
  readonly description?: string;
  readonly disabled?: boolean;
  /** This option's own variant, over the group's (one highlighted card in a plain list). */
  readonly variant?: AndesCheckboxVariant;
  /** Native tooltip for the option (the rendered checkbox's `title` attribute). */
  readonly title?: string;
  /** Extra class(es) on the rendered `<andes-checkbox>`, e.g. to style or size one option. */
  readonly className?: string;
  /** Inline styles on the rendered `<andes-checkbox>`, in any form `[style]` accepts. */
  readonly style?: string | Readonly<Record<string, string | number>>;
}

/**
 * Anything `AndesCheckboxGroup`'s `options` input accepts per entry: the option object, or a
 * bare string / number as shorthand. Object values have no shorthand - an object entry is
 * always read as an option - so they must be wrapped as `{ label, value }`.
 */
export type AndesCheckboxOptionInput<T extends AndesCheckboxValue = string> =
  (T extends object ? never : T) | AndesCheckboxOption<T>;

/** Template context of `AndesCheckboxOptionLabel`. */
export interface AndesCheckboxOptionLabelContext<
  T extends AndesCheckboxValue = AndesCheckboxValue,
> {
  /** The (normalized) option being rendered. */
  readonly $implicit: AndesCheckboxOption<T>;
  readonly index: number;
}

/**
 * Custom label for every checkbox an `AndesCheckboxGroup` renders from its `options` input.
 *
 * ```html
 * <andes-checkbox-group [options]="plans">
 *   <ng-template andesCheckboxOptionLabel let-option>
 *     <strong>{{ option.label }}</strong>
 *   </ng-template>
 * </andes-checkbox-group>
 * ```
 *
 * A structural `<ng-template>` rather than a render-function input: it is Angular's idiomatic
 * slot for per-item markup, and the static context guard below types `let-option`.
 */
@Directive({
  selector: 'ng-template[andesCheckboxOptionLabel]',
})
export class AndesCheckboxOptionLabel {
  readonly template =
    inject<TemplateRef<AndesCheckboxOptionLabelContext>>(TemplateRef);

  /** Only consulted by the template type checker - it is what types `let-option`. */
  static ngTemplateContextGuard(
    _directive: AndesCheckboxOptionLabel,
    context: unknown,
  ): context is AndesCheckboxOptionLabelContext {
    return typeof context === 'object' && context !== null;
  }
}
