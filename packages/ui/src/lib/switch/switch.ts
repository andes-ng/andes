import { NgTemplateOutlet } from '@angular/common';
import {
  afterEveryRender,
  afterNextRender,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  forwardRef,
  inject,
  input,
  model,
  output,
  signal,
  TemplateRef,
  viewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import clsx from 'clsx';

import {
  andesIdRefs,
  injectAndesFieldBinding,
} from '../form-field/field-binding';
import { isObservable, Observable, Subscription, take } from 'rxjs';

let nextSwitchId = 0;

/**
 * The shared control scale: `sm` (16px track), `md` (22px, the default) and `lg` (28px, with
 * 16px / 24px label text like the Input's `lg`).
 */
export type AndesSwitchSize = 'sm' | 'md' | 'lg';

/**
 * Validation tier, mirroring AndesInput's `status`: `error` paints the danger color AND sets
 * `aria-invalid`, `warning` only paints the warning color (a warning is advice, not a failure,
 * so it must not be announced as invalid).
 */
export type AndesSwitchStatus = 'error' | 'warning';

/**
 * How the switch is drawn: `default` (the track beside its label) or `card` (the track, label
 * and description in a bordered, fully clickable settings row).
 */
export type AndesSwitchVariant = 'default' | 'card';

/** Which side of the track the label sits on, in the current writing direction. */
export type AndesSwitchLabelPosition = 'start' | 'end';

/**
 * A guard consulted before a USER toggle. It receives the state the switch is about to take and
 * answers whether to allow it - immediately (`boolean`), later (`Promise`), or on the first value
 * of a stream (`Observable`). Only an answer of exactly `true` lets the change through.
 */
export type AndesSwitchBeforeChange = (
  next: boolean,
) => boolean | Promise<boolean> | Observable<boolean>;

/**
 * Payload of `changed` / `clicked`: the new checked state and the triggering event folded into
 * one object, since an Angular output emits a single value.
 */
export interface AndesSwitchChangeEvent {
  readonly checked: boolean;
  readonly event: MouseEvent;
}

/**
 * Payload of `changeBlocked`: a user toggle that a `beforeChange` guard stopped.
 */
export interface AndesSwitchBlockedEvent {
  /** The state the user asked for and did not get (the opposite of the unchanged state). */
  readonly attempted: boolean;
  /** `refused`: the guard answered anything but `true`; `error`: it threw, rejected or errored. */
  readonly reason: 'refused' | 'error';
  readonly event: MouseEvent;
}

/**
 * An on/off toggle rendered as a native `<button role="switch">`.
 *
 * The button sits in a `<label>` together with the projected text: the default slot (or
 * `[slot=label]`) is the label and `[slot=description]` secondary text, so clicking either
 * toggles the switch. The accessible name is the label alone; the description is linked with
 * `aria-describedby`. `[slot=checked]` / `[slot=unchecked]` fill the track.
 *
 * Styling hooks - CSS custom properties read from the `<andes-switch>` host (or any ancestor),
 * each falling back to the design-token default for the current `size`:
 * - geometry: `--andes-switch-track-height`, `--andes-switch-track-width` (a minimum - the track
 *   still grows to fit its content), `--andes-switch-thumb-size`, `--andes-switch-track-padding`,
 *   `--andes-switch-inner-margin` (gap between track content and the far edge);
 * - color: `--andes-switch-track-color`, `--andes-switch-track-hover-color`,
 *   `--andes-switch-track-checked-color`, `--andes-switch-track-checked-hover-color`,
 *   `--andes-switch-thumb-color`, `--andes-switch-thumb-shadow`.
 */
@Component({
  selector: 'andes-switch',
  imports: [NgTemplateOutlet],
  templateUrl: './switch.html',
  styleUrl: './switch.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AndesSwitch),
      multi: true,
    },
  ],
  host: {
    // Forwarded to the real button in the template instead - a screen reader never sees
    // this non-interactive host element, so leaving these here would do nothing. Same
    // class of bug already found and fixed in AndesButton. `id` too: a `<label for>` must
    // target the focusable button, and a duplicate id on the host would be invalid.
    '[attr.id]': 'null',
    '[attr.aria-label]': 'null',
    '[attr.aria-labelledby]': 'null',
    '[attr.aria-describedby]': 'null',
    '[attr.aria-invalid]': 'null',
    // The card is a full-width row, so its host has to be a block-level box (the default host
    // shrinks to its content).
    '[class.andes-switch-host--card]': "variant() === 'card'",
  },
})
export class AndesSwitch implements ControlValueAccessor {
  /**
   * The rendered `checked` state, and the single source of truth for it - a `model()` rather
   * than an `input()`. A click writes straight into this signal (`this.checked.set(next)`), the
   * same signal a `[checked]`/`[(checked)]`-bound parent reads and writes, via the
   * `checkedChange` output `model()` generates for it. There is no separate internal signal
   * that mirrors or derives from `checked` (previously a `linkedSignal`), so there is nothing
   * left for it to silently diverge from.
   *
   * `model()` does not support the `transform` option that `input()` does, so a bare boolean
   * attribute (`<andes-switch checked>`, no brackets) is written into the model as the literal
   * empty string, not `true` - the same gap `AndesCheckbox` hit on its own `model()` fields.
   * `isChecked` below coerces that back through `booleanAttribute` for template consumption;
   * callers still writing new templates should prefer a property binding (`[checked]="true"`).
   *
   * A one-way `[checked]="expr"` works as an initial value, but once the user toggles,
   * re-evaluating an unchanged `expr` can't push it back: Angular only re-writes an input when
   * the bound value itself changes. A parent that needs to own the state (e.g. to roll back a
   * rejected toggle) binds `[(checked)]` so its own signal moves in lockstep.
   */
  readonly checked = model(false);
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly required = input(false, { transform: booleanAttribute });
  readonly readonly = input(false, { transform: booleanAttribute });
  /**
   * Shows a busy state. This does NOT natively disable the button: a switch that goes busy right
   * after the user toggles it (the usual async-save pattern) would otherwise drop keyboard focus
   * to `<body>` mid-interaction. It stays focusable, announces `aria-busy`, and
   * `onClick` ignores activation until it clears.
   */
  readonly loading = input(false, { transform: booleanAttribute });
  /**
   * Focuses the button once, right after the first render. Read once on purpose (like the HTML
   * `autofocus` attribute): toggling it later never steals focus.
   */
  readonly autoFocus = input(false, { transform: booleanAttribute });
  /**
   * Track and label scale: `sm` / `md` / `lg`, the same steps as AndesInput and AndesCheckbox
   * (the label text follows them; the track is 16 / 22 / 28px tall).
   */
  /** `md` unless set, or the enclosing `andesForm`'s `size`. */
  readonly size = input<AndesSwitchSize | undefined>(undefined);
  /**
   * Validation tier, like AndesInput's: `error` paints the track (or card) in the danger color
   * and sets `aria-invalid` - the same result as `aria-invalid="true"` - while `warning` only
   * paints the warning color, since a warning is not a failure.
   */
  readonly status = input<AndesSwitchStatus | undefined>(undefined);
  /**
   * `default` (the track beside its label) or `card` (a bordered settings row that is clickable
   * as a whole and lights up when on). In a card the text takes the row and the track sits on
   * the opposite side; `labelPosition` flips them.
   */
  readonly variant = input<AndesSwitchVariant>('default');
  /** Puts the label before (`start`) or after (`end`, the default) the track. */
  readonly labelPosition = input<AndesSwitchLabelPosition>('end');
  /**
   * Native form field name. With a `name`, a switch that is on submits `name=value` through a
   * hidden input, like a checked native checkbox; one that is off submits nothing. The field is
   * disabled with the switch.
   */
  readonly name = input<string | undefined>(undefined);
  /** What an on switch with a `name` submits. Defaults to `on`, like a native checkbox. */
  readonly value = input('on');
  /**
   * Track content for the `[slot=checked]` / `[slot=unchecked]` positions: a string, or a
   * `TemplateRef` (an icon or markup, context-free). Rendered as `<ng-content>` fallback, so a
   * projected slot element wins over the input when both are given.
   */
  readonly checkedChildren = input<string | TemplateRef<unknown>>('');
  readonly unCheckedChildren = input<string | TemplateRef<unknown>>('');
  /**
   * Icons drawn INSIDE the thumb while the switch is on / off: context-free templates whose
   * `<svg>` (or text) is sized from the thumb, centered and tinted like the loading spinner.
   * Hidden while the switch is `loading` (or waiting on `beforeChange`), when the spinner
   * takes the thumb.
   */
  readonly checkedIcon = input<TemplateRef<unknown> | undefined>(undefined);
  readonly uncheckedIcon = input<TemplateRef<unknown> | undefined>(undefined);
  /**
   * Guard for USER toggles (click, Space, Enter, or a click on the label). Called with the state
   * the switch is about to take; the change only happens when it answers `true`. Otherwise the
   * switch stays put and `changeBlocked` fires. While a `Promise` / `Observable` is pending the
   * switch shows its `loading` state, ignores further clicks and sets `aria-busy`; a throw,
   * rejection or error counts as blocked. Writes that do not come from the user (`writeValue`,
   * a `[checked]` binding) bypass it, so a form can still set the value without asking.
   */
  readonly beforeChange = input<AndesSwitchBeforeChange | undefined>(undefined);
  /** `id` of the rendered button, so a `<label for>` (or a form field) can target it. */
  readonly id = input<string | undefined>(undefined);
  readonly ariaLabel = input<string | undefined>(undefined, {
    alias: 'aria-label',
  });
  readonly ariaLabelledby = input<string | undefined>(undefined, {
    alias: 'aria-labelledby',
  });
  readonly ariaDescribedby = input<string | undefined>(undefined, {
    alias: 'aria-describedby',
  });
  readonly ariaInvalid = input(false, {
    alias: 'aria-invalid',
    transform: booleanAttribute,
  });

  /**
   * `checked` coerced through `booleanAttribute`, for TEMPLATE CONSUMPTION only (see the doc
   * comment on `checked` above) - mirrors `checkedProp` on `AndesCheckbox`. Reads in switch.html
   * that render state (`aria-checked`, the `data-checked`/`data-unchecked` attrs, the
   * checked/unchecked slot switch) go through this computed instead of the raw model, so a bare
   * `<andes-switch checked>` renders as truthy instead of leaking the empty-string attribute
   * value into the DOM. Writes (`this.checked.set(...)`, `writeValue`) still go straight to the
   * `checked` model itself - it stays the single source of truth for reads/writes and the
   * `[(checked)]` two-way binding surface; this computed can never itself drift out of sync
   * with it, being a pure derived formatter.
   */
  protected readonly isChecked = computed(() =>
    booleanAttribute(this.checked()),
  );

  /** Whether a `beforeChange` guard is still deciding. Shown as `loading`. */
  private readonly pending = signal(false);

  /** `loading` or waiting on the guard: the switch is busy and ignores activation. */
  protected readonly isBusy = computed(() => this.loading() || this.pending());

  /**
   * Fires only on a user-initiated toggle - never for `writeValue` or a parent-driven `[checked]`
   * change, which `checkedChange` (from the `model()`) also reports. Named `changed`, not
   * `change`, because `@angular-eslint/no-output-native` forbids shadowing DOM event names.
   */
  readonly changed = output<AndesSwitchChangeEvent>();
  /**
   * Fires for every activation that reaches the control, carrying the state after it (unchanged
   * when `readonly`). Not emitted while `disabled` or `loading`, since neither state accepts
   * activation.
   */
  readonly clicked = output<AndesSwitchChangeEvent>();
  /**
   * A user toggle that `beforeChange` stopped (it answered anything but `true`, or failed).
   * `clicked` also fires, carrying the unchanged state.
   */
  readonly changeBlocked = output<AndesSwitchBlockedEvent>();
  /**
   * The button gained focus. Needed as an output because `focus` does not bubble, so a `(focus)`
   * listener on `<andes-switch>` itself would never fire.
   */
  readonly focused = output<FocusEvent>();
  /** The button lost focus - the counterpart of `focused`. */
  readonly blurred = output<FocusEvent>();

  private readonly control =
    viewChild.required<ElementRef<HTMLButtonElement>>('control');

  private readonly labelTextRef =
    viewChild.required<ElementRef<HTMLElement>>('labelText');
  private readonly descriptionRef =
    viewChild.required<ElementRef<HTMLElement>>('description');
  private readonly destroyRef = inject(DestroyRef);

  private readonly uid = ++nextSwitchId;
  protected readonly labelTextId = `andes-switch-${this.uid}-label`;
  protected readonly descriptionId = `andes-switch-${this.uid}-description`;

  /**
   * Whether anything was projected into the label / `[slot=description]` positions. Read from
   * the DOM after each render (projected content cannot be queried by attribute selector), so
   * they stay `false` during server rendering and the aria wiring lands on hydration.
   */
  protected readonly hasDescription = signal(false);
  private readonly hasLabelText = signal(false);

  private readonly formDisabled = signal(false);

  /** The enclosing form field and form: id, ARIA, status, size and disabled. */
  protected readonly field = injectAndesFieldBinding();

  /** The size in effect: `size`, else the form's, else `md`. */
  readonly resolvedSize = computed<AndesSwitchSize>(
    () => this.size() ?? this.field.size() ?? 'md',
  );

  /** The status in effect: `status`, else the enclosing field's error or warning. */
  readonly resolvedStatus = computed<AndesSwitchStatus | undefined>(
    () => this.status() ?? this.field.status(),
  );

  /** `id`, else the enclosing field's control id, so its label toggles the switch. */
  protected readonly controlId = computed(() => this.id() ?? this.field.id());

  protected readonly isRequired = computed(
    () => this.required() || this.field.required(),
  );

  protected readonly isDisabled = computed(
    () => this.disabled() || this.formDisabled() || this.field.disabled(),
  );

  /** `aria-invalid` and `status="error"` are one state: same look, same announcement. */
  protected readonly isInvalid = computed(
    () => this.ariaInvalid() || this.resolvedStatus() === 'error',
  );

  protected readonly classes = computed(() =>
    clsx(
      'andes-switch',
      `andes-switch--${this.resolvedSize()}`,
      this.isInvalid() && 'andes-switch--invalid',
      this.resolvedStatus() === 'warning' && 'andes-switch--warning',
      this.isBusy() && 'andes-switch--loading',
    ),
  );

  protected readonly fieldClasses = computed(() =>
    clsx(
      'andes-switch-field',
      `andes-switch-field--${this.resolvedSize()}`,
      this.variant() === 'card' && 'andes-switch-field--card',
      this.labelPosition() === 'start' && 'andes-switch-field--label-start',
      this.isChecked() && 'andes-switch-field--checked',
      this.isDisabled() && 'andes-switch-field--disabled',
      this.readonly() && 'andes-switch-field--readonly',
      this.isBusy() && 'andes-switch-field--loading',
      this.isInvalid() && 'andes-switch-field--invalid',
      this.resolvedStatus() === 'warning' && 'andes-switch-field--warning',
    ),
  );

  /** Track content as a string (the `<ng-content>` fallback text) ... */
  protected readonly checkedText = computed(() =>
    textOf(this.checkedChildren()),
  );
  protected readonly uncheckedText = computed(() =>
    textOf(this.unCheckedChildren()),
  );
  /** ... or as a template. */
  protected readonly checkedTemplate = computed(() =>
    templateOf(this.checkedChildren()),
  );
  protected readonly uncheckedTemplate = computed(() =>
    templateOf(this.unCheckedChildren()),
  );

  /** The thumb icon for the current state, if any. */
  protected readonly thumbIcon = computed(
    () =>
      (this.isChecked() ? this.checkedIcon() : this.uncheckedIcon()) ?? null,
  );

  /**
   * The description sits inside the `<label>` (so clicking it toggles, and a card is clickable
   * as a whole), which would also fold it into the accessible NAME. Pointing the button at the
   * label text alone keeps the name short and leaves the description to `aria-describedby`.
   */
  protected readonly effectiveLabelledby = computed(
    () =>
      this.ariaLabelledby() ??
      (this.hasDescription() && this.hasLabelText() && !this.ariaLabel()
        ? this.labelTextId
        : undefined) ??
      // With no text of its own, the switch is named by the field's label.
      (this.hasLabelText() || this.ariaLabel()
        ? undefined
        : this.field.labelledBy()),
  );

  protected readonly effectiveDescribedby = computed(() =>
    andesIdRefs(
      this.ariaDescribedby(),
      this.hasDescription() ? this.descriptionId : undefined,
      this.field.describedBy(),
    ),
  );

  /** The hidden form field exists only for a named switch that is on. */
  protected readonly submitsValue = computed(
    () => !!this.name() && this.isChecked(),
  );

  /**
   * The one-shot ripple hook, exposed as the button's `data-motion` attribute: `change` from the
   * moment the checked state flips (either way) until the ripple animation ends. Absent on the
   * first render and after the animation ends, so a switch that starts out on never ripples.
   */
  protected readonly motion = signal<'change' | 'change-alt' | null>(null);
  private motionFlip = false;

  /**
   * Off until a moment after the first render, so the initial state - including a value a
   * template-driven `ngModel` writes in a microtask after that render - never animates.
   */
  private motionReady = false;
  private lastChecked: boolean | null = null;

  /** Releases an in-flight `Observable` guard when the component goes away. */
  private guardSubscription: Subscription | undefined;
  private destroyed = false;

  constructor() {
    afterNextRender(() => {
      if (this.autoFocus()) {
        this.focus();
      }
      const timer = setTimeout(() => (this.motionReady = true));
      this.destroyRef.onDestroy(() => clearTimeout(timer));
    });

    // Turns a change of the RENDERED state (whatever caused it: a click, a form write, a
    // binding) into the one-shot `data-motion` hook the stylesheet animates.
    effect(() => {
      const checked = this.isChecked();
      const previous = this.lastChecked;
      this.lastChecked = checked;
      if (this.motionReady && previous !== null && previous !== checked) {
        // Alternating names restart a ring that is still running when the next change lands.
        this.motionFlip = !this.motionFlip;
        this.motion.set(this.motionFlip ? 'change' : 'change-alt');
      }
    });

    afterEveryRender({
      read: () => {
        this.hasDescription.set(
          hasContent(this.descriptionRef().nativeElement),
        );
        this.hasLabelText.set(hasContent(this.labelTextRef().nativeElement));
      },
    });

    this.destroyRef.onDestroy(() => {
      this.destroyed = true;
      this.guardSubscription?.unsubscribe();
    });
  }

  /** Moves focus to the button. */
  focus(options?: FocusOptions): void {
    this.control().nativeElement.focus(options);
  }

  /** Removes focus from the button. */
  blur(): void {
    this.control().nativeElement.blur();
  }

  /**
   * The ripple finished: drop the hook so it can replay on the next change. Only the ripple
   * counts - the stylesheet's keyframes name is scoped by the framework (hence the suffix match)
   * and any other animation bubbling up from the track content must not clear it.
   */
  protected onMotionEnd(event: AnimationEvent): void {
    if (
      event.target === event.currentTarget &&
      (event.animationName.endsWith('andes-switch-ripple') ||
        event.animationName.endsWith('andes-switch-ripple-alt'))
    ) {
      this.motion.set(null);
    }
  }

  private onChange: (value: boolean) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  protected onClick(event: MouseEvent): void {
    if (this.isDisabled() || this.isBusy()) {
      return;
    }

    if (this.readonly()) {
      this.clicked.emit({ checked: this.isChecked(), event });
      return;
    }

    // Toggle off the coerced value, not the raw model: a bare `<andes-switch checked>` holds `""`
    // in the model, and `!""` is `true` - the first click would have been a silent no-op.
    const from = this.isChecked();
    const next = !from;
    const guard = this.beforeChange();
    if (guard === undefined) {
      this.commit(next, event);
      return;
    }

    let answer: ReturnType<AndesSwitchBeforeChange>;
    try {
      answer = guard(next);
    } catch {
      this.block(next, 'error', event);
      return;
    }

    if (typeof answer === 'boolean') {
      this.settle(answer ? 'allowed' : 'refused', from, next, event);
      return;
    }

    // Pending until the guard answers. Cleared before the outcome is applied, so an answer that
    // arrives in the same tick (an `of(true)` stream) never flashes the loading state.
    this.pending.set(true);
    const finish = (outcome: GuardOutcome): void => {
      this.pending.set(false);
      this.settle(outcome, from, next, event);
    };

    if (isObservable(answer)) {
      let finished = false;
      const once = (outcome: GuardOutcome): void => {
        if (!finished) {
          finished = true;
          finish(outcome);
        }
      };
      this.guardSubscription?.unsubscribe();
      this.guardSubscription = answer.pipe(take(1)).subscribe({
        next: (value) => once(value === true ? 'allowed' : 'refused'),
        error: () => once('error'),
        // Completed without ever answering: nobody said yes.
        complete: () => once('refused'),
      });
    } else {
      Promise.resolve(answer).then(
        (value) => finish(value === true ? 'allowed' : 'refused'),
        () => finish('error'),
      );
    }
  }

  /**
   * Applies a guard's answer. An answer that arrives after the component was destroyed, or after
   * something else (a form write, a parent binding) already moved the switch, is dropped: it was
   * about a transition that no longer exists.
   */
  private settle(
    outcome: GuardOutcome,
    from: boolean,
    next: boolean,
    event: MouseEvent,
  ): void {
    if (this.destroyed || this.isChecked() !== from) {
      return;
    }

    if (outcome === 'allowed') {
      this.commit(next, event);
    } else {
      this.block(next, outcome, event);
    }
  }

  private commit(next: boolean, event: MouseEvent): void {
    // Writes straight into the model signal - the same signal a `[checked]`/`[(checked)]`-bound
    // parent reads, and `model()` auto-emits `checkedChange` for us, so there's no separate
    // `.emit()` call here (that would double-fire the event).
    this.checked.set(next);
    this.onChange(next);
    this.changed.emit({ checked: next, event });
    this.clicked.emit({ checked: next, event });
  }

  private block(
    attempted: boolean,
    outcome: 'refused' | 'error',
    event: MouseEvent,
  ): void {
    this.changeBlocked.emit({ attempted, reason: outcome, event });
    this.clicked.emit({ checked: this.isChecked(), event });
  }

  protected onFocus(event: FocusEvent): void {
    this.focused.emit(event);
  }

  protected onBlur(event: FocusEvent): void {
    this.onTouched();
    this.blurred.emit(event);
  }

  writeValue(value: boolean): void {
    this.checked.set(!!value);
  }

  registerOnChange(fn: (value: boolean) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.formDisabled.set(isDisabled);
  }
}

type GuardOutcome = 'allowed' | 'refused' | 'error';

function textOf(content: string | TemplateRef<unknown>): string {
  return typeof content === 'string' ? content : '';
}

function templateOf(
  content: string | TemplateRef<unknown>,
): TemplateRef<unknown> | null {
  return content instanceof TemplateRef ? content : null;
}

function hasContent(element: HTMLElement): boolean {
  return (
    element.childElementCount > 0 || (element.textContent ?? '').trim() !== ''
  );
}
