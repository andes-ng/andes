import {
  afterRenderEffect,
  Directive,
  ElementRef,
  inject,
  input,
} from '@angular/core';

/** Attribute values for the native button; `null` removes the attribute. */
export type AndesGalleryControlAttributes = Readonly<
  Record<string, string | null>
>;

/**
 * Reaches the native `<button>` that an `andes-button` renders, for what the library's button
 * has no input for: `aria-current`, `aria-keyshortcuts`, a roving `tabindex`, and a *soft*
 * disabled state.
 *
 * Soft disabled is `aria-disabled="true"`: the control keeps its place in the tab order and
 * stays announced (a native `disabled` would drop it, so the keyboard user who just zoomed to the
 * limit would lose focus). It also sets the `data-disabled` flag the button's own styles read,
 * so it looks disabled and ignores hover, exactly like a disabled button. The gallery guards the
 * click itself.
 *
 * Internal to the gallery; not exported from the library.
 */
@Directive({
  selector: 'andes-button[andesGalleryControl]',
  exportAs: 'andesGalleryControl',
})
export class AndesGalleryControl {
  /** Attributes to mirror on the native button. */
  readonly attributes = input<AndesGalleryControlAttributes>(
    {},
    { alias: 'andesGalleryControl' },
  );

  /** The `andes-button` element. */
  readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  private applied: readonly string[] = [];

  constructor() {
    afterRenderEffect({
      write: () => {
        const attributes = this.attributes();
        const native = this.native();
        if (!native) {
          return;
        }
        const names = Object.keys(attributes);
        for (const name of this.applied) {
          if (!names.includes(name)) {
            this.write(native, name, null);
          }
        }
        for (const name of names) {
          this.write(native, name, attributes[name]);
        }
        this.applied = names;
      },
    });
  }

  /** Focuses the native button (the `andes-button` element itself is not focusable). */
  focus(options?: FocusOptions): void {
    this.native()?.focus(options);
  }

  private native(): HTMLElement | null {
    return this.element.querySelector<HTMLElement>(':scope > button');
  }

  private write(native: HTMLElement, name: string, value: string | null): void {
    if (value === null) {
      native.removeAttribute(name);
    } else if (native.getAttribute(name) !== value) {
      native.setAttribute(name, value);
    }
    if (name === 'aria-disabled') {
      if (value === 'true') {
        native.setAttribute('data-disabled', '');
      } else {
        native.removeAttribute('data-disabled');
      }
    }
  }
}
