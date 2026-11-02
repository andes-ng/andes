import {
  type AfterViewInit,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  model,
  signal,
  untracked,
} from '@angular/core';

import { AndesInput } from '../input/input';
import { AndesAlertDialogState } from './alert-dialog-state';
import { AndesDialogRoot } from './dialog-base';

let nextPhraseId = 0;

/** How strictly typed text has to equal the phrase. */
export interface AndesConfirmPhraseOptions {
  /** Ignore letter case ("delete" matches "DELETE"). Default `false`. */
  readonly ignoreCase?: boolean;
  /** Ignore whitespace around the text. Default `true`. */
  readonly trim?: boolean;
}

function normalize(
  text: string,
  { ignoreCase = false, trim = true }: AndesConfirmPhraseOptions,
): string {
  // NFC so "é" typed as one character and as e + accent compare equal.
  let result = text.normalize('NFC');
  if (trim) {
    result = result.trim();
  }
  return ignoreCase ? result.toLocaleLowerCase() : result;
}

/** Whether `value` is the phrase the user has to type. An empty phrase never matches. */
export function matchesConfirmPhrase(
  value: string,
  phrase: string,
  options: AndesConfirmPhraseOptions = {},
): boolean {
  const expected = normalize(phrase, options);
  return expected !== '' && normalize(value, options) === expected;
}

/**
 * "Type the name to confirm": a labelled field that keeps the alert dialog's action
 * unavailable until what is typed equals `phrase`. The pattern GitHub uses to delete a
 * repository and Vercel or AWS use for projects and buckets - a deliberate act of
 * reading that a button click is not.
 *
 * ```html
 * <andes-alert-dialog-confirm-phrase phrase="acme-web" />
 * ```
 *
 * The phrase is shown in a monospace chip a single click selects whole. A wrong entry
 * is only flagged once it has stopped being a prefix of the phrase (or the field lost
 * focus), so typing the right thing never shows an error on the way. Match and mismatch
 * are announced through the field's own status line, Enter in the field activates the
 * action, and `blockPaste` makes the user type the text rather than paste it.
 */
@Component({
  selector: 'andes-alert-dialog-confirm-phrase',
  imports: [AndesInput],
  templateUrl: './alert-dialog-confirm-phrase.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'andes-alert-dialog__phrase-field',
    '[attr.data-slot]': '"alert-dialog-confirm-phrase"',
    '[attr.data-state]': 'status()',
  },
})
export class AndesAlertDialogConfirmPhrase implements AfterViewInit {
  private readonly root = inject(AndesDialogRoot);
  protected readonly state = inject(AndesAlertDialogState);
  private readonly host =
    inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  /** The text the user has to type. */
  readonly phrase = input.required<string>();
  /**
   * The label. `{phrase}` is replaced by the phrase, shown in its monospace chip; put
   * it where it belongs in your language. Without the token the label is used as is.
   */
  readonly label = input('Type {phrase} to confirm.');
  /** Placeholder of the field. */
  readonly placeholder = input<string | undefined>(undefined);
  /** Ignore letter case. */
  readonly ignoreCase = input(false, { transform: booleanAttribute });
  /** Ignore whitespace around the typed text. On by default. */
  readonly trim = input(true, { transform: booleanAttribute });
  /** Refuse pasted and dropped text, so the phrase has to be typed. */
  readonly blockPaste = input(false, { transform: booleanAttribute });
  /** Said (and shown) once the text matches. */
  readonly matchedMessage = input('Matches. You can continue.');
  /** Shown once the text can no longer become the phrase by typing more. */
  readonly mismatchMessage = input("That doesn't match yet.");
  /** Announced when a paste is refused under `blockPaste`. */
  readonly pasteBlockedMessage = input(
    'Pasting is turned off. Type the text to continue.',
  );
  /** What has been typed. Two-way bindable. */
  readonly value = model('');

  protected readonly inputId = `andes-alert-dialog-phrase-${nextPhraseId++}`;
  protected readonly hintId = `${this.inputId}-hint`;
  private readonly touched = signal(false);

  private readonly options = computed<AndesConfirmPhraseOptions>(() => ({
    ignoreCase: this.ignoreCase(),
    trim: this.trim(),
  }));

  /** Whether the typed text equals the phrase. */
  readonly matches = computed(() =>
    matchesConfirmPhrase(this.value(), this.phrase(), this.options()),
  );

  /** `idle`, `matched`, or `mismatch`: what the field shows right now. */
  protected readonly status = computed(() => {
    if (this.matches()) {
      return 'matched';
    }
    const typed = normalize(this.value(), this.options());
    if (typed === '') {
      return 'idle';
    }
    const expected = normalize(this.phrase(), this.options());
    const onTrack = expected.startsWith(typed);
    return onTrack && !this.touched() ? 'idle' : 'mismatch';
  });

  protected readonly labelParts = computed(() => {
    const [before, ...rest] = this.label().split('{phrase}');
    return { before, after: rest.join('{phrase}'), hasPhrase: rest.length > 0 };
  });

  protected readonly hint = computed(() => {
    switch (this.status()) {
      case 'matched':
        return this.matchedMessage();
      case 'mismatch':
        return this.mismatchMessage();
      default:
        return '';
    }
  });

  constructor() {
    const destroyRef = inject(DestroyRef);

    this.state.register(
      {
        satisfied: this.matches,
        requirement: computed(() =>
          this.label().replace('{phrase}', this.phrase()),
        ),
      },
      destroyRef,
    );

    // A kept-alive surface comes back as it was; a confirmation must not.
    let wasOpen = false;
    effect(() => {
      const open = this.root.isOpen();
      if (wasOpen && !open) {
        untracked(() => {
          this.value.set('');
          this.touched.set(false);
        });
      }
      wasOpen = open;
    });
  }

  ngAfterViewInit(): void {
    if (this.state.initialFocus() === 'input') {
      this.host.querySelector('input')?.setAttribute('cdkFocusInitial', '');
    }
  }

  protected onBlur(): void {
    this.touched.set(true);
  }

  protected onEnter(event: KeyboardEvent): void {
    // Not a form submission, whatever the field sits in.
    event.preventDefault();
    this.state.submit();
  }

  protected onPaste(event: Event): void {
    if (this.blockPaste()) {
      event.preventDefault();
      this.state.announce(this.pasteBlockedMessage());
    }
  }
}
