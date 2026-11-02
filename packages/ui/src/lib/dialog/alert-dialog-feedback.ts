import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';

import {
  AndesAlertDialogState,
  type AndesAlertDialogTone,
} from './alert-dialog-state';
import { ANDES_DIALOG_STATUS_GLYPHS } from './dialog-status-glyph';

/**
 * Why an asynchronous confirmation failed, shown inline above the actions so the user
 * can retry from the same dialog. It fills in when the action's `confirm` handler
 * rejects and clears on the next attempt. The failure is also announced politely through
 * the dialog's live region, so the part is safe to leave out.
 *
 * ```html
 * <andes-alert-dialog-error />
 * ```
 */
@Component({
  selector: 'andes-alert-dialog-error',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'andes-alert-dialog__error',
    '[attr.data-slot]': '"alert-dialog-error"',
    '[hidden]': '!state.error()',
  },
  template: `
    @if (state.error(); as message) {
      <svg
        class="andes-alert-dialog__error-icon"
        viewBox="0 0 24 24"
        aria-hidden="true"
        focusable="false"
      >
        <circle cx="12" cy="12" r="12" />
        <path [attr.d]="glyph" />
      </svg>
      <span class="andes-alert-dialog__error-text">
        {{ message }}
        @if (hint(); as text) {
          {{ text }}
        }
      </span>
    }
  `,
})
export class AndesAlertDialogError {
  protected readonly state = inject(AndesAlertDialogState);

  /** Added after the failure message. Empty to leave it out. */
  readonly hint = input('You can try again.');

  /** The exclamation mark of the shared status discs. */
  protected readonly glyph = ANDES_DIALOG_STATUS_GLYPHS.warning;
}

/**
 * The status icon for the dialog's `tone`: the filled disc `andes-alert` and the dialog
 * service draw, with a cross for danger, an exclamation mark for warning, an "i" for info
 * and a check for success, so the tone never rests on colour alone. Place it first in the
 * header; the header makes room for it. Decorative - the title says what is at stake.
 *
 * ```html
 * <div andesAlertDialogHeader>
 *   <andes-alert-dialog-icon />
 *   <h2 andesAlertDialogTitle>Delete project acme-web?</h2>
 * </div>
 * ```
 */
@Component({
  selector: 'andes-alert-dialog-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'andes-alert-dialog__icon',
    'aria-hidden': 'true',
    '[attr.data-slot]': '"alert-dialog-icon"',
    '[attr.data-tone]': 'resolved()',
  },
  template: `
    @if (glyph(); as d) {
      <svg viewBox="0 0 24 24" focusable="false">
        <circle class="andes-alert-dialog__icon-disc" cx="12" cy="12" r="12" />
        <path class="andes-alert-dialog__icon-glyph" [attr.d]="d" />
      </svg>
    }
  `,
})
export class AndesAlertDialogIcon {
  private readonly state = inject(AndesAlertDialogState, { optional: true });

  /** Overrides the dialog's tone. */
  readonly tone = input<AndesAlertDialogTone | null>(null);

  protected readonly resolved = computed(
    () => this.tone() ?? this.state?.tone() ?? null,
  );

  protected readonly glyph = computed(() => {
    const tone = this.resolved();
    return tone ? ANDES_DIALOG_STATUS_GLYPHS[tone] : null;
  });
}
