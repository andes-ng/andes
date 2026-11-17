import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  contentChildren,
  ElementRef,
  forwardRef,
  inject,
  InjectionToken,
  input,
  Signal,
  signal,
  ViewEncapsulation,
} from '@angular/core';

import { AndesButton } from './button';
import type { AndesButtonElevation, AndesButtonSize } from './button';

export type AndesButtonGroupOrientation = 'horizontal' | 'vertical';

/** What a button reads from the group that contains it. */
export interface AndesButtonGroupContext {
  readonly size: Signal<AndesButtonSize | undefined>;
  /** When `true`, every button in the group is disabled. */
  readonly disabled?: Signal<boolean>;
  /** When `true`, the group is one tab stop and arrow keys move between its buttons. */
  readonly roving?: Signal<boolean>;
  /** Whether `button` is the one button of a roving group that sits in the tab sequence. */
  isTabStop?(button: AndesButton): boolean;
}

export const ANDES_BUTTON_GROUP = new InjectionToken<AndesButtonGroupContext>(
  'ANDES_BUTTON_GROUP',
);

/**
 * Joins adjacent buttons into one segmented control: inner corners are squared off and
 * neighbouring borders overlap so the row reads as a single unit (a split button, a pager, a
 * toolbar cluster). `size` applies to every button that doesn't set its own, `disabled` to all
 * of them, and `elevation` raises the whole group on one shadow. Name the group with
 * `aria-label` so a screen reader announces what its buttons act on.
 *
 * With `roving` the group is a single tab stop: arrow keys along the orientation move between
 * its buttons (Home and End jump to the ends), and the last one focused is the one Tab returns to.
 */
@Component({
  selector: 'andes-button-group',
  template: '<ng-content />',
  styleUrl: './button-group.css',
  // The group styles the inner element of each projected button, which emulated
  // encapsulation can't reach. Every selector is scoped under `.andes-button-group`.
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: ANDES_BUTTON_GROUP, useExisting: AndesButtonGroup }],
  host: {
    role: 'group',
    class: 'andes-button-group',
    '[class.andes-button-group--horizontal]': "orientation() === 'horizontal'",
    '[class.andes-button-group--vertical]': "orientation() === 'vertical'",
    '[attr.data-elevation]': "elevation() === 'none' ? null : elevation()",
    '[attr.data-orientation]': 'orientation()',
    '(focusin)': 'onFocusIn($event)',
    '(keydown)': 'onKeydown($event)',
  },
})
export class AndesButtonGroup implements AndesButtonGroupContext {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly size = input<AndesButtonSize | undefined>(undefined);
  readonly orientation = input<AndesButtonGroupOrientation>('horizontal');
  /** Disables every button in the group, whatever their own `disabled` says. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Shadow of the whole group, which the joined buttons share. */
  readonly elevation = input<AndesButtonElevation>('none');
  /** One tab stop with arrow-key movement between the buttons (a roving tabindex). */
  readonly roving = input(false, { transform: booleanAttribute });

  private readonly buttons = contentChildren(
    forwardRef(() => AndesButton),
    { descendants: true },
  );
  private readonly lastFocused = signal<AndesButton | undefined>(undefined);

  isTabStop(button: AndesButton): boolean {
    const focusable = this.buttons().filter((member) => member.focusable());
    const current = this.lastFocused();
    const stop =
      current && focusable.includes(current) ? current : focusable[0];
    return stop === button || !focusable.includes(button);
  }

  protected onFocusIn(event: FocusEvent): void {
    if (!this.roving()) {
      return;
    }
    const member = this.buttons().find((button) =>
      button.contains(event.target as Node),
    );
    if (member) {
      this.lastFocused.set(member);
    }
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (!this.roving() || event.defaultPrevented) {
      return;
    }
    const members = this.buttons().filter((button) => button.focusable());
    const from = members.findIndex((button) =>
      button.contains(event.target as Node),
    );
    if (from === -1) {
      return;
    }

    const vertical = this.orientation() === 'vertical';
    const rtl =
      this.host.nativeElement.closest('[dir]')?.getAttribute('dir') === 'rtl';
    const forward = vertical ? 'ArrowDown' : rtl ? 'ArrowLeft' : 'ArrowRight';
    const backward = vertical ? 'ArrowUp' : rtl ? 'ArrowRight' : 'ArrowLeft';
    let to: number;
    switch (event.key) {
      case forward:
        to = (from + 1) % members.length;
        break;
      case backward:
        to = (from - 1 + members.length) % members.length;
        break;
      case 'Home':
        to = 0;
        break;
      case 'End':
        to = members.length - 1;
        break;
      default:
        return;
    }
    event.preventDefault();
    members[to].focus();
  }
}
