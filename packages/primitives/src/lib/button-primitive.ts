import {
  booleanAttribute,
  Directive,
  ElementRef,
  HOST_TAG_NAME,
  inject,
  input,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { fromEvent } from 'rxjs';
import { filter } from 'rxjs/operators';

@Directive({
  selector: 'button[andesButtonPrimitive], a[andesButtonPrimitive]',
  host: {
    '[attr.tabindex]': 'tabIndexValue()',
    '[attr.disabled]':
      '!isAnchor && disabled() && !focusable() ? "" : undefined',
    // Anchors have no native disabled state, so screen readers need aria-disabled to announce
    // it. A button kept focusable has none either, for the same reason.
    '[attr.aria-disabled]':
      '(isAnchor || focusable()) && disabled() ? "true" : undefined',
    '[attr.data-disabled]': 'disabled() ? "" : undefined',
  },
})
export class AndesButtonPrimitive {
  readonly disabled = input(false, { transform: booleanAttribute });
  /**
   * Keeps a disabled button in the tab order: it carries `aria-disabled` instead of the native
   * `disabled` attribute, so keyboard focus is never dropped (a button that turns busy while
   * it has focus keeps it), and its clicks are swallowed here. Anchors always behave this way.
   */
  readonly focusable = input(false, { transform: booleanAttribute });
  /**
   * `false` takes the control out of the tab sequence while it stays focusable from script
   * (the roving tabindex of a toolbar). Unset or `true` leaves the native tab order alone.
   */
  readonly tabStop = input<boolean | undefined>(undefined);

  protected readonly isAnchor = inject(HOST_TAG_NAME) === 'a';

  protected tabIndexValue(): -1 | undefined {
    if (this.disabled() && (this.isAnchor || !this.focusable())) {
      return -1;
    }
    return this.tabStop() === false ? -1 : undefined;
  }

  constructor() {
    const elementRef = inject(ElementRef<HTMLElement>);
    fromEvent<MouseEvent>(elementRef.nativeElement, 'click')
      .pipe(
        filter(() => (this.isAnchor || this.focusable()) && this.disabled()),
        takeUntilDestroyed(),
      )
      .subscribe((event) => {
        event.preventDefault();
        event.stopImmediatePropagation();
      });
  }
}
