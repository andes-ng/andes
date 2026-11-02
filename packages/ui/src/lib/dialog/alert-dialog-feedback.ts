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
        <path d="M12 6.5v7M12 17.25h.01" />
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
}

/** Geometry of each tone's glyph, cut out of a coloured badge shape. */
const TONE_SHAPES: Record<
  AndesAlertDialogTone,
  { shape: string; glyph: string }
> = {
  // Four distinct silhouettes, so the tone never rests on colour alone.
  danger: {
    shape: 'M8.25 2h7.5L22 8.25v7.5L15.75 22h-7.5L2 15.75v-7.5z',
    glyph: 'M12 7v6M12 16.75h.01',
  },
  warning: {
    shape: 'M12 2.5 22 20.5H2z',
    glyph: 'M12 9.5v5M12 17.75h.01',
  },
  info: {
    shape: 'M12 0a12 12 0 1 0 0 24 12 12 0 0 0 0-24z',
    glyph: 'M12 10.5v6.5M12 7h.01',
  },
  success: {
    shape: 'M12 0a12 12 0 1 0 0 24 12 12 0 0 0 0-24z',
    glyph: 'M7.25 12.5l3.25 3.25 6.25-6.25',
  },
};

/**
 * The status icon for the dialog's `tone`: an octagon for danger, a triangle for warning,
 * a circle for info and success. Place it first in the header; the header makes room
 * for it. Decorative - the title says what is at stake.
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
    @if (geometry(); as g) {
      <svg viewBox="0 0 24 24" focusable="false">
        <path class="andes-alert-dialog__icon-shape" [attr.d]="g.shape" />
        <path class="andes-alert-dialog__icon-glyph" [attr.d]="g.glyph" />
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

  protected readonly geometry = computed(() => {
    const tone = this.resolved();
    return tone ? TONE_SHAPES[tone] : null;
  });
}
