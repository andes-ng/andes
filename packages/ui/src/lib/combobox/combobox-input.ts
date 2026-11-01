import {
  AndesListNavigation,
  AndesOverlayPrimitive,
  AndesOverlayTriggerPrimitive,
} from '@andes-ng/primitives';
import {
  afterNextRender,
  Directive,
  effect,
  ElementRef,
  inject,
  Renderer2,
} from '@angular/core';

import type { AndesCombobox } from './combobox';
import { ANDES_COMBOBOX } from './combobox-token';

/**
 * The editable text field of a Combobox. Composes `AndesOverlayTriggerPrimitive` via
 * `hostDirectives`, which registers this element as the popup's positioning anchor and
 * keeps `aria-expanded`/`aria-controls`/`aria-haspopup` in sync, and publishes the shared
 * `AndesListNavigation`'s active option as `aria-activedescendant` - this element keeps
 * real focus the whole time.
 *
 * Everything else - `role="combobox"`, filtering on input, the navigation keys,
 * Enter/Escape/Backspace, backfill, the size/variant/status styling hooks, and never
 * moving real focus off this element - lives here. `AndesCombobox` renders one of these
 * itself in its `[options]` mode.
 *
 * Keys, while the popup is open:
 * - ArrowDown/ArrowUp move the highlight (the first press lands on the selected option,
 *   else the first/last); on a closed popup they open it with the highlight placed.
 * - PageDown/PageUp move it by one popup height of options.
 * - Home/End jump to the first/last option while one is highlighted; otherwise they move
 *   the text caret, as in any text field.
 * - Enter chooses the highlighted option.
 * - Escape closes the popup; on a closed popup, with `allowClear`, it empties the field.
 * - Backspace in the empty input of the `multiple` mode removes the last chip.
 *
 * A `<textarea>` works as the field too, for suggestions on a longer, wrapping text. It
 * behaves exactly like the input: the arrow keys open and move through the suggestions
 * rather than moving the caret between lines, and Enter chooses the highlighted one
 * (inserting a line break only while nothing is highlighted).
 *
 * ```html
 * <input andesComboboxInput placeholder="Search fruit..." />
 * <textarea andesComboboxInput rows="3"></textarea>
 * ```
 */
@Directive({
  selector: 'input[andesComboboxInput], textarea[andesComboboxInput]',
  hostDirectives: [AndesOverlayTriggerPrimitive],
  host: {
    class: 'andes-combobox-input',
    role: 'combobox',
    autocomplete: 'off',
    autocapitalize: 'off',
    spellcheck: 'false',
    '[attr.aria-autocomplete]': '"list"',
    '[attr.aria-activedescendant]': 'navigation.activeDescendantId()',
    '[attr.aria-invalid]': 'combobox.invalid() || null',
    '[attr.aria-required]': 'combobox.isRequired() || null',
    // In the `multiple` mode the chip box around this input draws the field, so the
    // input carries none of the box's styling hooks itself.
    '[attr.data-size]': 'boxed() ? null : combobox.resolvedSize()',
    '[attr.data-variant]': 'boxed() ? null : combobox.resolvedVariant()',
    '[attr.data-status]':
      'boxed() ? null : (combobox.resolvedStatus() ?? null)',
    '[attr.data-suffix]': 'boxed() ? null : combobox.suffixCount() || null',
    '[attr.data-prefix]':
      'boxed() || combobox.prefix() === undefined ? null : ""',
    '[value]': 'combobox.displayText()',
    '[disabled]': 'combobox.isDisabled()',
    '[readOnly]': 'combobox.readOnly()',
    '[required]': 'combobox.isRequired() && !combobox.multiple()',
    '(input)': 'onInput($event)',
    '(keydown)': 'onKeydown($event)',
    '(focus)': 'onFocus($event)',
    '(blur)': 'onBlur($event)',
    '(pointerdown)': 'onPointerDown($event)',
    '(click)': 'onClick()',
  },
})
export class AndesComboboxInput<T = string> {
  protected readonly combobox = inject(ANDES_COMBOBOX) as AndesCombobox<T>;
  protected readonly navigation = inject(AndesListNavigation);
  private readonly overlay = inject(AndesOverlayPrimitive);
  private readonly renderer = inject(Renderer2);
  private readonly element: HTMLInputElement | HTMLTextAreaElement =
    inject<ElementRef<HTMLInputElement | HTMLTextAreaElement>>(ElementRef)
      .nativeElement;

  protected readonly boxed = this.combobox.multiple;

  constructor() {
    this.combobox.registerInput(this.element);

    // Set imperatively, and only once the root's input is actually given, rather than as
    // [attr.*] host bindings: a binding would evaluate to null while the input is unset
    // and strip the plain `placeholder="..."`/`maxlength`/`id`/`aria-label` a compound-mode consumer
    // already wrote on this very element.
    let ownPlaceholder: string | null = null;
    let captured = false;
    effect(() => {
      const placeholder = this.combobox.placeholder();
      // Chips already show what was chosen; the placeholder only invites the first pick.
      const hidden =
        this.combobox.multiple() && this.combobox.values().length > 0;
      if (!captured) {
        ownPlaceholder = this.element.getAttribute('placeholder');
        captured = true;
      }
      const text = placeholder ?? ownPlaceholder;
      if (hidden || text == null) {
        this.renderer.removeAttribute(this.element, 'placeholder');
      } else {
        this.renderer.setAttribute(this.element, 'placeholder', text);
      }
    });
    effect(() => {
      const maxLength = this.combobox.maxLength();
      if (maxLength !== undefined) {
        this.renderer.setAttribute(
          this.element,
          'maxlength',
          String(maxLength),
        );
      }
    });
    // The accessible name too: a projected input's own `aria-label` survives unless the
    // root is given one.
    effect(() => {
      const label = this.combobox.ariaLabel();
      if (label !== undefined) {
        this.renderer.setAttribute(this.element, 'aria-label', label);
      }
    });
    effect(() => {
      const labelledBy = this.combobox.labelledBy();
      if (labelledBy !== undefined) {
        this.renderer.setAttribute(this.element, 'aria-labelledby', labelledBy);
      }
    });
    // The description, from the root and the enclosing form field: removed again when the
    // field's messages go away, but a projected input's own one is left alone otherwise.
    let describedBySet = false;
    effect(() => {
      const describedBy = this.combobox.describedBy();
      if (describedBy !== undefined) {
        this.renderer.setAttribute(
          this.element,
          'aria-describedby',
          describedBy,
        );
        describedBySet = true;
      } else if (describedBySet) {
        this.renderer.removeAttribute(this.element, 'aria-describedby');
        describedBySet = false;
      }
    });
    effect(() => {
      const id = this.combobox.fieldId();
      if (id !== undefined) {
        this.renderer.setAttribute(this.element, 'id', id);
      }
    });

    afterNextRender(() => {
      if (this.combobox.autoFocus() && !this.combobox.isDisabled()) {
        this.element.focus();
      }
    });
  }

  protected onInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.combobox.setQuery(value);
    this.combobox.open();
  }

  // Event, not FocusEvent/KeyboardEvent: with two possible host elements the compiler
  // types these host listeners' $event as a plain Event.
  protected onFocus(event: Event): void {
    this.combobox.open();
    this.combobox.inputFocus.emit(event as FocusEvent);
    this.combobox.focused.emit(event as FocusEvent);
  }

  protected onBlur(event: Event): void {
    this.combobox.notifyBlur();
    this.combobox.inputBlur.emit(event as FocusEvent);
    this.combobox.blurred.emit(event as FocusEvent);
  }

  protected onPointerDown(event: Event): void {
    this.combobox.onFieldPointerDown(event as PointerEvent);
  }

  /** A click on the focused field reopens the popup closed by a choice or by Escape. */
  protected onClick(): void {
    this.combobox.open();
  }

  protected onKeydown(event: Event): void {
    const keyboardEvent = event as KeyboardEvent;
    this.handleKey(keyboardEvent);
    this.combobox.inputKeydown.emit(keyboardEvent);
  }

  private handleKey(event: KeyboardEvent): void {
    if (event.altKey || event.ctrlKey || event.metaKey) {
      return;
    }
    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowUp':
        event.preventDefault();
        if (this.combobox.editable()) {
          this.combobox.moveCursor(
            event.key === 'ArrowDown' ? 'next' : 'previous',
          );
        }
        return;
      case 'PageDown':
      case 'PageUp':
        if (this.combobox.moveCursorByPage(event.key === 'PageDown' ? 1 : -1)) {
          event.preventDefault();
        }
        return;
      case 'Home':
      case 'End':
        if (
          !event.shiftKey &&
          this.combobox.moveCursorToEdge(
            event.key === 'Home' ? 'first' : 'last',
          )
        ) {
          event.preventDefault();
        }
        return;
      case 'Enter':
        // An Enter that commits an IME composition (e.g. Japanese/Chinese input) is
        // not the user picking the highlighted option.
        if (event.isComposing) {
          return;
        }
        if (this.combobox.selectActiveItem()) {
          event.preventDefault();
        }
        return;
      case 'Escape':
        if (this.overlay.isOpen()) {
          event.preventDefault();
          event.stopPropagation();
          this.combobox.dismiss();
        } else if (this.combobox.showClear()) {
          // A second Escape, on the closed popup, empties the field.
          event.preventDefault();
          event.stopPropagation();
          this.combobox.clearValue();
        }
        return;
      case 'Backspace':
        if (
          this.combobox.multiple() &&
          this.combobox.editable() &&
          this.element.value === '' &&
          this.combobox.removeLastValue()
        ) {
          event.preventDefault();
        }
        return;
    }
  }
}
