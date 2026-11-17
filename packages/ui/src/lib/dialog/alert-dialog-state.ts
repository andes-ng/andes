import {
  computed,
  DestroyRef,
  Injectable,
  signal,
  type Signal,
} from '@angular/core';

/**
 * One requirement a confirmation puts in front of its action: a phrase to type, a box
 * to tick, a countdown to wait out. The Alert Dialog's action stays blocked until
 * every registered gate is satisfied.
 */
export interface AndesAlertDialogGate {
  /** Whether the requirement is currently met. */
  readonly satisfied: Signal<boolean>;
  /**
   * What is still missing, in one short sentence ("Type acme-web to confirm."). It
   * describes the blocked action to assistive technology and is announced when the
   * user tries the action too early.
   */
  readonly requirement: Signal<string>;
}

let nextStateId = 0;

/** Colour and icon of an alert dialog: what kind of interruption it is. */
export type AndesAlertDialogTone = 'danger' | 'warning' | 'info' | 'success';

/** Which control receives focus when an alert dialog opens. */
export type AndesAlertDialogInitialFocus = 'cancel' | 'action' | 'input';

/** The root's own inputs that the parts inside the dialog read. */
export interface AndesAlertDialogSettings {
  readonly tone: Signal<AndesAlertDialogTone | null>;
  readonly initialFocus: Signal<AndesAlertDialogInitialFocus | null>;
}

/**
 * The state the parts of one alert dialog share: the gates the action waits for, the
 * pending/error state of an asynchronous confirmation and the live announcements.
 *
 * Provided by `AndesAlertDialog`, so it lives and dies with the dialog and every part
 * inside the dialog finds the same instance. Internal: not exported from the package.
 */
@Injectable()
export class AndesAlertDialogState {
  private readonly gates = signal<readonly AndesAlertDialogGate[]>([]);
  private readonly _pending = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _attempts = signal(0);
  private readonly _announcement = signal({ text: '', sequence: 0 });
  private readonly settings = signal<AndesAlertDialogSettings | null>(null);
  private submitHandler: (() => void) | null = null;

  /** Id of the hidden element that spells out `requirements` for the blocked action. */
  readonly requirementsId = `andes-alert-dialog-requirements-${nextStateId++}`;

  /** The dialog's `tone`. */
  readonly tone = computed(() => this.settings()?.tone() ?? null);

  /** The dialog's `initialFocus`. */
  readonly initialFocus = computed(
    () => this.settings()?.initialFocus() ?? null,
  );

  /** The gates that are not satisfied yet. */
  readonly blockers = computed(() =>
    this.gates().filter((gate) => !gate.satisfied()),
  );

  /** Whether every gate is satisfied (trivially so with none). */
  readonly satisfied = computed(() => this.blockers().length === 0);

  /** The open requirements, joined into one sentence. */
  readonly requirements = computed(() =>
    this.blockers()
      .map((gate) => gate.requirement())
      .filter(Boolean)
      .join(' '),
  );

  /** An asynchronous confirmation is running. */
  readonly pending = this._pending.asReadonly();

  /** Why the last asynchronous confirmation failed; `null` while there is no failure. */
  readonly error = this._error.asReadonly();

  /** How many times a blocked action was attempted. Parts react to it with feedback. */
  readonly attempts = this._attempts.asReadonly();

  /** The latest live announcement. A fresh `sequence` makes an identical text re-announce. */
  readonly announcement = this._announcement.asReadonly();

  /** Called once by the root, to hand its inputs to the parts. */
  connect(settings: AndesAlertDialogSettings): void {
    this.settings.set(settings);
  }

  /** Adds a gate; the returned function removes it. */
  register(gate: AndesAlertDialogGate, destroyRef?: DestroyRef): () => void {
    this.gates.update((gates) => [...gates, gate]);
    const unregister = () =>
      this.gates.update((gates) => gates.filter((entry) => entry !== gate));
    destroyRef?.onDestroy(unregister);
    return unregister;
  }

  /**
   * Registers what pressing Enter inside a gating field does: the action's own
   * activation, so a typed phrase can be confirmed without reaching for the button.
   */
  registerSubmit(handler: () => void, destroyRef?: DestroyRef): void {
    this.submitHandler = handler;
    destroyRef?.onDestroy(() => {
      if (this.submitHandler === handler) {
        this.submitHandler = null;
      }
    });
  }

  /** Activates the action as if it had been clicked. */
  submit(): void {
    this.submitHandler?.();
  }

  /** Says something through the dialog's polite live region. */
  announce(text: string): void {
    this._announcement.update(({ sequence }) => ({
      text,
      sequence: sequence + 1,
    }));
  }

  /** Records a blocked attempt and tells the user what is still missing. */
  reject(): void {
    this._attempts.update((count) => count + 1);
    const missing = this.requirements();
    if (missing) {
      this.announce(missing);
    }
  }

  /** Starts an asynchronous confirmation, clearing the previous failure. */
  begin(): void {
    this._error.set(null);
    this._pending.set(true);
  }

  /** Ends an asynchronous confirmation, with the failure message when it failed. */
  settle(error: string | null = null): void {
    this._pending.set(false);
    this._error.set(error);
  }

  /** Back to a fresh state, for the next time the dialog opens. */
  reset(): void {
    this._pending.set(false);
    this._error.set(null);
    this._announcement.set({ text: '', sequence: 0 });
  }
}
