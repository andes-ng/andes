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

import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCheck, lucideCopy } from '@ng-icons/lucide';

import { AndesButton } from '../button/button';
import { AndesInput } from '../input/input';
import { AndesAlertDialogState } from './alert-dialog-state';
import { AndesDialogRoot } from './dialog-base';

let nextPhraseId = 0;

/** How long the copy button shows its check after a copy. */
const COPIED_MS = 1500;

/** Writes `text` to the clipboard: the async API where there is one, else a hidden field. */
async function copyText(text: string, document: Document): Promise<boolean> {
  try {
    if (document.defaultView?.navigator.clipboard) {
      await document.defaultView.navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Refused (permissions, insecure context): fall through to the older route.
  }
  const field = document.createElement('textarea');
  field.value = text;
  field.setAttribute('readonly', '');
  field.setAttribute('aria-hidden', 'true');
  field.style.cssText = 'position:fixed;inset-block-start:0;opacity:0;';
  const previous = document.activeElement as HTMLElement | null;
  // Inside the dialog, so the focus trap does not fight the temporary field.
  (
    document.querySelector('.andes-dialog[role="alertdialog"]') ?? document.body
  ).append(field);
  field.select();
  let ok = false;
  try {
    ok = document.execCommand('copy');
  } catch {
    ok = false;
  }
  field.remove();
  previous?.focus();
  return ok;
}

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
  viewProviders: [provideIcons({ lucideCheck, lucideCopy })],
  imports: [AndesInput, AndesButton, NgIcon],
  templateUrl: './alert-dialog-confirm-phrase.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'andes-alert-dialog__phrase-field',
    '[attr.data-slot]': '"alert-dialog-confirm-phrase"',
    '[attr.data-state]': 'status()',
    '(click)': 'onClick($event)',
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
  /** Show a small button after the phrase that copies it. On by default. */
  readonly showCopy = input(true, { transform: booleanAttribute });
  /** Accessible name of the copy button; `{phrase}` is replaced by the phrase. */
  readonly copyLabel = input('Copy {phrase}');
  /** Announced once the phrase has been copied; `{phrase}` is replaced by the phrase. */
  readonly copiedMessage = input('Copied {phrase}.');
  /** Announced when the browser refuses to copy. */
  readonly copyFailedMessage = input(
    'Could not copy. Select the text and copy it.',
  );
  /** What has been typed. Two-way bindable. */
  readonly value = model('');

  protected readonly inputId = `andes-alert-dialog-phrase-${nextPhraseId++}`;
  protected readonly hintId = `${this.inputId}-hint`;
  protected readonly labelId = `${this.inputId}-label`;
  /** True for a moment after the phrase was copied, so the button shows a check. */
  protected readonly copied = signal(false);
  private copiedTimer: ReturnType<typeof setTimeout> | undefined;
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
    destroyRef.onDestroy(() => clearTimeout(this.copiedTimer));

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

  /**
   * A click on the label's own words focuses the field, as a label would. A click on the
   * phrase chip, or one that ends a text selection, must not: moving focus would collapse
   * the selection the user is making in order to copy it.
   */
  protected onClick(event: MouseEvent): void {
    const target = event.target as Element | null;
    // Heard on the host rather than on the label: the label is a plain element, which a
    // template listener would have to make focusable.
    if (
      !target?.closest('.andes-alert-dialog__phrase-label') ||
      target.closest('.andes-alert-dialog__phrase')
    ) {
      return;
    }
    if (this.host.ownerDocument.getSelection()?.toString()) {
      return;
    }
    this.host.querySelector('input')?.focus();
  }

  /** Copies the phrase to the clipboard and says so. */
  protected async copyPhrase(): Promise<void> {
    const phrase = this.phrase();
    const done = await copyText(phrase, this.host.ownerDocument);
    this.state.announce(
      done
        ? this.copiedMessage().replace('{phrase}', phrase)
        : this.copyFailedMessage(),
    );
    if (!done) {
      return;
    }
    this.copied.set(true);
    clearTimeout(this.copiedTimer);
    this.copiedTimer = setTimeout(() => this.copied.set(false), COPIED_MS);
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
