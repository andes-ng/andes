import {
  afterRenderEffect,
  Directive,
  ElementRef,
  inject,
  input,
} from '@angular/core';

/** Attribute values `andesTableAria` writes; `null` or `undefined` removes the attribute, `false` writes "false". */
export type AndesTableAriaAttributes = Readonly<
  Record<string, string | number | boolean | null | undefined>
>;

/**
 * Writes ARIA attributes the library button has no input for (`aria-expanded`,
 * `aria-controls`, `aria-haspopup`) on the real button element it renders, so a screen reader
 * hears the state of a toggle built from `andes-button`.
 *
 * ```html
 * <andes-button [andesTableAria]="{ 'aria-expanded': open() }">...</andes-button>
 * ```
 */
@Directive({ selector: 'andes-button[andesTableAria]' })
export class AndesTableButtonAria {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly attributes = input.required<AndesTableAriaAttributes>({
    alias: 'andesTableAria',
  });

  constructor() {
    afterRenderEffect(() => {
      const button = this.host.nativeElement.querySelector('button, a');
      if (!button) {
        return;
      }
      for (const [name, value] of Object.entries(this.attributes())) {
        if (value === null || value === undefined) {
          button.removeAttribute(name);
        } else {
          button.setAttribute(name, String(value));
        }
      }
    });
  }
}
