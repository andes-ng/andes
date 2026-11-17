import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  numberAttribute,
  signal,
  untracked,
} from '@angular/core';

import { AndesAlertDialogState } from './alert-dialog-state';
import { AndesDialogRoot } from './dialog-base';

/**
 * A pause before a destructive action unlocks: the action stays unavailable for
 * `seconds`, with a visible count and a thin progress bar. The countdown starts each time
 * the dialog opens.
 *
 * ```html
 * <andes-alert-dialog-countdown [seconds]="5" />
 * ```
 *
 * The ticking is not read aloud second by second; a screen reader hears the wait once
 * when it starts and once when the action unlocks. Under `prefers-reduced-motion` the
 * bar steps instead of gliding.
 */
@Component({
  selector: 'andes-alert-dialog-countdown',
  templateUrl: './alert-dialog-countdown.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'andes-alert-dialog__countdown',
    '[attr.data-slot]': '"alert-dialog-countdown"',
    '[attr.data-state]': 'remaining() > 0 ? "waiting" : "ready"',
  },
})
export class AndesAlertDialogCountdown {
  private readonly root = inject(AndesDialogRoot);
  private readonly state = inject(AndesAlertDialogState);

  /** How long the action stays unavailable, in whole seconds. */
  readonly seconds = input(5, { transform: numberAttribute });
  /** Shown while waiting. `{seconds}` is the time left. */
  readonly label = input('You can continue in {seconds}s.');
  /** Shown, and announced, once the action unlocks. */
  readonly readyLabel = input('You can continue now.');
  /** Announced once when the wait starts. `{seconds}` is the whole wait. */
  readonly startLabel = input('You can continue in {seconds} seconds.');

  /** Whole seconds left; `0` once the action is unlocked. */
  readonly remaining = signal(Math.max(0, Math.round(this.seconds())));

  protected readonly text = computed(() =>
    this.label().replace('{seconds}', String(this.remaining())),
  );

  protected readonly progress = computed(() => {
    const total = Math.round(this.seconds());
    return total > 0 ? ((total - this.remaining()) / total) * 100 : 100;
  });

  constructor() {
    this.state.register(
      {
        satisfied: computed(() => this.remaining() <= 0),
        requirement: this.text,
      },
      inject(DestroyRef),
    );

    // Idle until the dialog is actually open, and restarted by every opening.
    effect((onCleanup) => {
      const total = Math.max(0, Math.round(this.seconds()));
      untracked(() => this.remaining.set(total));
      if (!this.root.isOpen() || total === 0) {
        return;
      }
      untracked(() =>
        this.state.announce(
          this.startLabel().replace('{seconds}', String(total)),
        ),
      );
      let left = total;
      const timer = setInterval(() => {
        left -= 1;
        this.remaining.set(left);
        if (left <= 0) {
          clearInterval(timer);
          this.state.announce(this.readyLabel());
        }
      }, 1000);
      onCleanup(() => clearInterval(timer));
    });
  }
}
