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
  inject,
  input,
  model,
  signal,
  TemplateRef,
  viewChild,
} from '@angular/core';
import clsx from 'clsx';

import {
  AndesRadioGroupState,
  AndesRadioStatus,
  AndesRadioVariant,
  optionalBooleanAttribute,
} from './radio-group-state';

let nextRadioId = 0;

function hasContent(element: HTMLElement | undefined): boolean {
  return (
    element !== undefined &&
    (element.childElementCount > 0 || (element.textContent ?? '').trim() !== '')
  );
}

/**
 * A radio: the circle (or, in a `optionType="button"` group, the segment) and its label. The
 * default slot is the label; content with `slot="description"` becomes muted secondary text
 * under it.
 *
 * ```html
 * <andes-radio value="pro">
 *   Pro
 *   <span slot="description">For teams that ship every week.</span>
 * </andes-radio>
 * ```
 */
@Component({
  selector: 'andes-radio',
  imports: [NgTemplateOutlet],
  templateUrl: './radio.html',
  styleUrl: './radio.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'classes()',
    '[attr.data-checked]': 'isChecked() ? "" : null',
    '[attr.data-disabled]': 'isDisabled() ? "" : null',
    '[attr.data-readonly]': 'isReadOnly() ? "" : null',
    // Forwarded to the real native radio input in the template instead - a screen reader
    // never sees this non-interactive host element, so leaving these here would do nothing,
    // and a static `id` left behind would be duplicated on both elements at once.
    '[attr.id]': 'null',
    '[attr.aria-label]': 'null',
    '[attr.aria-labelledby]': 'null',
    '[attr.aria-describedby]': 'null',
  },
})
export class AndesRadio {
  /** `null` when the radio is used on its own, outside any `<andes-radio-group>`. */
  private readonly state = inject(AndesRadioGroupState, { optional: true });
  private readonly uid = ++nextRadioId;
  private readonly generatedId = `andes-radio-${this.uid}`;
  protected readonly labelTextId = `andes-radio-${this.uid}-label`;
  protected readonly descriptionId = `andes-radio-${this.uid}-description`;
  private readonly destroyRef = inject(DestroyRef);
  private readonly inputRef =
    viewChild.required<ElementRef<HTMLInputElement>>('input');
  private readonly labelTextRef =
    viewChild<ElementRef<HTMLElement>>('labelText');
  private readonly descriptionRef =
    viewChild<ElementRef<HTMLElement>>('description');

  /** Compared with `===` (or the group's `compareWith`) against the group's value. Any type
   *  is accepted; the native input's `value` attribute (used for plain HTML form submission)
   *  gets `String(value)`. Required inside a group; optional for a standalone radio. */
  readonly value = input<unknown>(undefined);
  /** Checked state of a standalone radio (one placed outside any `<andes-radio-group>`).
   *  Two-way bindable (`[(checked)]`); a one-way `[checked]="true"` only seeds the initial
   *  state. Selecting the radio sets it to `true` - like a native radio it cannot be
   *  unchecked by the user. Ignored inside a group, where the group's value decides which
   *  item is checked. */
  readonly checked = model(false);
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Prevents changing the selection without visually disabling the radio: it stays
   *  focusable and keeps its normal look, it just cannot be selected (and gives no hover
   *  feedback). Enforced by cancelling the native `click`, since the platform has no
   *  `readonly` for radios. Inside a group, the group's `readOnly` applies too. */
  readonly readOnly = input(false, { transform: booleanAttribute });
  readonly id = input<string | undefined>(undefined);
  /** Focus this item's native input once it first renders. */
  readonly autoFocus = input(false, { transform: booleanAttribute });
  readonly ariaLabel = input<string | undefined>(undefined, {
    alias: 'aria-label',
  });
  readonly ariaLabelledby = input<string | undefined>(undefined, {
    alias: 'aria-labelledby',
  });
  readonly ariaDescribedby = input<string | undefined>(undefined, {
    alias: 'aria-describedby',
  });

  /** Validation tier; unset, it takes the group's `status`. `error` paints the danger color
   *  and, when set on the radio itself, sets `aria-invalid` on its native input (a group's
   *  `status="error"` is announced on the radiogroup instead, the only place WAI-ARIA
   *  supports it); `warning` only paints the warning color. */
  readonly status = input<AndesRadioStatus | undefined>(undefined);
  /** `card` makes the whole item a bordered, clickable card. Unset, it takes the group's
   *  `variant`. Ignored inside an `optionType="button"` group, whose look wins. */
  readonly variant = input<AndesRadioVariant | undefined>(undefined);
  /** Whether the circle is drawn. Defaults to shown (unset takes the group's value); hiding it
   *  leaves the native input as the keyboard stop and the label (or card) as the click
   *  target. A button segment never draws a circle. */
  readonly showIndicator = input<boolean | undefined, unknown>(undefined, {
    transform: optionalBooleanAttribute,
  });
  /** Replaces the default dot of the checked radio. A context-free template (typically an
   *  `<svg>` drawn in `currentColor`, the primary color) sized from the circle. Unset, it
   *  takes the group's `indicator`. */
  readonly indicator = input<TemplateRef<unknown> | undefined>(undefined);

  protected readonly inputId = computed(() => this.id() ?? this.generatedId);
  /** Falls back to the browser's own default (`on`) for a standalone radio with no value. */
  protected readonly nativeValue = computed(() => {
    const value = this.value();
    return value === undefined ? 'on' : String(value);
  });
  /** A standalone radio has no name, so it never unchecks (or is unchecked by) another one. */
  protected readonly name = computed(() => this.state?.name() ?? null);
  protected readonly required = computed(() => this.state?.required() ?? false);
  protected readonly isButton = computed(
    () => this.state?.optionType() === 'button',
  );

  protected readonly isChecked = computed(() =>
    this.state ? this.state.isSelected(this.value()) : this.checked(),
  );
  protected readonly isDisabled = computed(
    () => this.disabled() || (this.state?.disabled() ?? false),
  );
  protected readonly isReadOnly = computed(
    () => this.readOnly() || (this.state?.readOnly() ?? false),
  );

  protected readonly effectiveStatus = computed(
    () => this.status() ?? this.state?.status(),
  );
  protected readonly effectiveVariant = computed(
    () => this.variant() ?? this.state?.variant() ?? 'default',
  );
  protected readonly isCard = computed(
    () => this.effectiveVariant() === 'card' && !this.isButton(),
  );
  /** The group's `aria-invalid`, or an `error` status from the radio or the group. */
  protected readonly isInvalid = computed(
    () =>
      (this.state?.invalid() ?? false) || this.effectiveStatus() === 'error',
  );
  protected readonly effectiveIndicator = computed(
    () => this.indicator() ?? this.state?.indicator(),
  );
  protected readonly hasControl = computed(
    () =>
      !this.isButton() &&
      (this.showIndicator() ?? this.state?.showIndicator() ?? true),
  );
  /** Only a radio's OWN `status="error"` reaches its native input - see `status`. */
  protected readonly nativeInvalid = computed(() => this.status() === 'error');

  /**
   * Whether anything was projected into `[slot=description]` / the default slot. Read from the
   * DOM after each render (projected content cannot be queried by attribute selector), so they
   * stay `false` during server rendering and the description wiring lands on hydration.
   */
  protected readonly hasDescription = signal(false);
  private readonly hasLabelText = signal(false);

  /** The description sits inside the `<label>` (so clicking it selects, and a card is
   *  clickable as a whole), which would also fold it into the accessible NAME. Pointing the
   *  input at the label text alone keeps the name short and leaves the description to
   *  `aria-describedby`. */
  protected readonly effectiveLabelledby = computed(
    () =>
      this.ariaLabelledby() ??
      (this.hasDescription() && this.hasLabelText() && !this.ariaLabel()
        ? this.labelTextId
        : undefined),
  );
  protected readonly effectiveDescribedby = computed(() => {
    const ids = [
      this.ariaDescribedby(),
      this.hasDescription() ? this.descriptionId : undefined,
    ].filter((id): id is string => !!id);
    return ids.length > 0 ? ids.join(' ') : undefined;
  });

  protected readonly classes = computed(() => {
    const state = this.state;
    const isButton = this.isButton();
    const grid = state?.columns() !== undefined;
    return clsx(
      'andes-radio',
      state && !grid && `andes-radio--${state.orientation()}`,
      state && grid && 'andes-radio--grid',
      this.isChecked() && 'andes-radio--checked',
      this.isDisabled() && 'andes-radio--disabled',
      this.isReadOnly() && 'andes-radio--readonly',
      this.isInvalid() && 'andes-radio--invalid',
      // An error (or the group's `aria-invalid`) always wins over a warning.
      !this.isInvalid() &&
        this.effectiveStatus() === 'warning' &&
        'andes-radio--warning',
      this.isCard() && 'andes-radio--card',
      !this.hasControl() && !isButton && 'andes-radio--no-indicator',
      isButton && 'andes-radio--button',
      isButton && state && `andes-radio--${state.buttonStyle()}`,
      isButton && state && `andes-radio--${state.size()}`,
      state?.block() && 'andes-radio--block',
      !isButton &&
        state?.labelPlacement() === 'start' &&
        'andes-radio--label-start',
    );
  });

  /**
   * The one-shot animation hook, exposed as the label's `data-motion` attribute. `check` while a
   * radio that just became checked rings; `press` / `press-alt` while an ALREADY checked radio
   * is clicked again (nothing changes, but the click still answers back). The two press values
   * alternate on every such click, and the stylesheet plays the ring under a different name for
   * each, so a click that follows another within the ring's second restarts it. Absent on first
   * render and once the ring ends, so a radio that starts out checked never animates.
   */
  protected readonly motion = signal<'check' | 'press' | 'press-alt' | null>(
    null,
  );

  /** Off until a moment after the first render, so the initial state - including a value a
   *  template-driven `ngModel` writes in a microtask after that render - never animates. */
  private motionReady = false;
  private lastChecked: boolean | null = null;

  constructor() {
    afterNextRender(() => {
      if (this.autoFocus()) {
        this.focus();
      }
      const timer = setTimeout(() => (this.motionReady = true));
      this.destroyRef.onDestroy(() => clearTimeout(timer));
    });

    afterEveryRender({
      read: () => {
        this.hasDescription.set(
          hasContent(this.descriptionRef()?.nativeElement),
        );
        this.hasLabelText.set(hasContent(this.labelTextRef()?.nativeElement));
      },
    });

    effect(() => {
      const checked = this.isChecked();
      const previous = this.lastChecked;
      this.lastChecked = checked;
      if (!checked) {
        this.motion.set(null);
      } else if (this.motionReady && previous === false) {
        this.motion.set('check');
      }
    });
  }

  focus(options?: FocusOptions): void {
    this.inputRef().nativeElement.focus(options);
  }

  blur(): void {
    this.inputRef().nativeElement.blur();
  }

  /**
   * The ring finished: drop the hook so a re-shown dot does not replay it. Only the ring counts
   * (its end bubbles up from whichever element plays it); a colour transition or any other
   * animation inside the label must not cut it short.
   */
  protected onMotionEnd(event: AnimationEvent): void {
    if (event.animationName.includes('andes-radio-ripple')) {
      this.motion.set(null);
    }
  }

  protected onClick(event: MouseEvent): void {
    if (this.isReadOnly()) {
      event.preventDefault();
      return;
    }
    // A click on the radio that is already selected changes nothing, so the `check` hook (set
    // when it BECOMES selected) never fires: ring it here instead, on every press-release.
    if (this.motionReady && this.isChecked()) {
      this.motion.set(this.motion() === 'press' ? 'press-alt' : 'press');
    }
  }

  protected onChange(event: Event): void {
    if (!(event.target as HTMLInputElement).checked || this.isReadOnly()) {
      return;
    }
    if (this.state) {
      this.state.select(this.value(), event);
    } else {
      this.checked.set(true);
    }
  }
}
