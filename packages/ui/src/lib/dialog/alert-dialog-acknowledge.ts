import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  input,
  model,
  untracked,
} from '@angular/core';

import { AndesCheckbox } from '../checkbox/checkbox';
import { AndesAlertDialogState } from './alert-dialog-state';
import { AndesDialogRoot } from './dialog-base';

/**
 * "I understand this cannot be undone": a checkbox that keeps the alert dialog's action
 * unavailable until it is ticked. The label is the projected content.
 *
 * ```html
 * <andes-alert-dialog-acknowledge>
 *   I understand that deleted projects cannot be restored.
 * </andes-alert-dialog-acknowledge>
 * ```
 *
 * Add one per consequence for a confirmation that has several; every box has to be
 * ticked. The box clears whenever the dialog closes, so each opening asks again.
 */
@Component({
  selector: 'andes-alert-dialog-acknowledge',
  imports: [AndesCheckbox],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'andes-alert-dialog__acknowledge',
    '[attr.data-slot]': '"alert-dialog-acknowledge"',
  },
  template: `
    <andes-checkbox [(checked)]="checked" [disabled]="state.pending()">
      <ng-content />
    </andes-checkbox>
  `,
})
export class AndesAlertDialogAcknowledge {
  private readonly root = inject(AndesDialogRoot);
  protected readonly state = inject(AndesAlertDialogState);

  /** Whether the box is ticked. Two-way bindable. */
  readonly checked = model(false);
  /** What the blocked action tells the user is missing. */
  readonly requirement = input('Tick the box to confirm that you understand.');

  constructor() {
    this.state.register(
      { satisfied: this.checked, requirement: this.requirement },
      inject(DestroyRef),
    );

    let wasOpen = false;
    effect(() => {
      const open = this.root.isOpen();
      if (wasOpen && !open) {
        untracked(() => this.checked.set(false));
      }
      wasOpen = open;
    });
  }
}
