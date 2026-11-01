import { NgTemplateOutlet } from '@angular/common';
import {
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
  isDevMode,
  model,
  signal,
  TemplateRef,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

import {
  andesIdRefs,
  injectAndesFieldBinding,
} from '../form-field/field-binding';
import {
  ANDES_TOGGLE_GROUP,
  AndesToggleSize,
  AndesToggleStatus,
  AndesToggleVariant,
} from './toggle-types';

export type {
  AndesToggleGroupChange,
  AndesToggleGroupLimit,
  AndesToggleGroupOrientation,
  AndesToggleGroupType,
  AndesToggleSize,
  AndesToggleStatus,
  AndesToggleVariant,
} from './toggle-types';

function noop(): void {
  /* replaced by registerOnChange/registerOnTouched */
}

/** Whether a (framework-scoped) keyframes name is the click ring or its twin. */
function isRing(animationName: string): boolean {
  return (
    animationName.endsWith('andes-toggle-ripple') ||
    animationName.endsWith('andes-toggle-ripple-alt')
  );
}

/**
 * A button that stays pressed: renders `<button aria-pressed>` and flips `pressed` on click.
 *
 * Standalone it is a boolean control (`[(pressed)]`, `[formControl]`, `[(ngModel)]`). Inside an
 * `<andes-toggle-group>` its state comes from the group's `value` instead, matched by this
 * toggle's `value`, and the group supplies `variant`, `size` and `disabled` unless set here.
 *
 * Icons: `iconStart` / `iconEnd` (templates) or projected `[slot=icon-start]` /
 * `[slot=icon-end]` elements sit beside the label and are decorative. A toggle with no text
 * (an icon-only toggle, including a bare projected `<svg>`) must be named through `aria-label`,
 * `aria-labelledby` or `tooltip`; in development a console warning says so, once per toggle.
 *
 * `status` paints the border and the focus ring (`error` danger, `warning` amber) and
 * `readOnly` keeps the toggle focusable and looking normal but stops it from changing. Neither
 * uses an ARIA attribute, because `aria-invalid` and `aria-readonly` are not allowed on the
 * `button` role: they set `data-status` and `data-readonly`, and an error message should be
 * linked through `aria-describedby`.
 */
@Component({
  selector: 'andes-toggle',
  imports: [NgTemplateOutlet],
  templateUrl: './toggle.html',
  styleUrl: './toggle.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AndesToggle),
      multi: true,
    },
  ],
  host: {
    'data-slot': 'toggle',
    '[attr.data-state]': "isPressed() ? 'on' : 'off'",
    '[attr.data-variant]': 'resolvedVariant()',
    '[attr.data-size]': 'resolvedSize()',
    '[attr.data-status]': 'resolvedStatus() ?? null',
    '[attr.data-disabled]': "isDisabled() ? '' : null",
    '[attr.data-readonly]': "isReadOnly() ? '' : null",
    '[attr.data-limit]': "isLimited() ? '' : null",
    // Forwarded to the inner button; the host itself stays out of the accessibility tree.
    '[attr.aria-label]': 'null',
    '[attr.aria-labelledby]': 'null',
    '[attr.aria-describedby]': 'null',
  },
})
export class AndesToggle<T = unknown> implements ControlValueAccessor {
  protected readonly group = inject(ANDES_TOGGLE_GROUP, { optional: true });
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);

  /** Pressed state when used on its own. Ignored inside a group (the group's value rules). */
  readonly pressed = model(false);
  /** Identifies this toggle inside a group's `value`. */
  readonly value = input<T | undefined>(undefined);
  readonly variant = input<AndesToggleVariant | undefined>(undefined);
  readonly size = input<AndesToggleSize | undefined>(undefined);
  /** Validation tier; inside a group, the group's `status` unless set here. */
  readonly status = input<AndesToggleStatus | undefined>(undefined);
  /** Nothing can be changed, but the toggle stays focusable and keeps its normal look (no
   *  hover feedback). Inside a group, the group's `readOnly` also applies. */
  readonly readOnly = input(false, { transform: booleanAttribute });
  /** Rendered before the label (an alternative to a projected `[slot=icon-start]`). */
  readonly iconStart = input<TemplateRef<unknown> | undefined>(undefined);
  /** Rendered after the label (an alternative to a projected `[slot=icon-end]`). */
  readonly iconEnd = input<TemplateRef<unknown> | undefined>(undefined);
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Native tooltip (`title`). */
  readonly tooltip = input<string | undefined>(undefined);
  readonly ariaLabel = input<string | undefined>(undefined, {
    alias: 'aria-label',
  });
  readonly ariaLabelledby = input<string | undefined>(undefined, {
    alias: 'aria-labelledby',
  });
  readonly ariaDescribedby = input<string | undefined>(undefined, {
    alias: 'aria-describedby',
  });
  /** Id of the toggle button. Defaults to the enclosing field's control id (on its own, not
   *  inside a group). */
  readonly id = input<string | undefined>(undefined);
  /** Marks the toggle as required, as `data-required` on the button (a button has no
   *  `aria-required`). Also set by a required field. */
  readonly required = input(false, { transform: booleanAttribute });

  private readonly cvaDisabled = signal(false);

  /**
   * The enclosing form field and form. A toggle inside a group leaves the field to the group
   * (`field: false`) and only follows the form's size and disabled.
   */
  protected readonly field = injectAndesFieldBinding({
    field: this.group === null,
  });

  /** Whether the button has text of its own, measured after the first render. */
  private readonly hasText = signal(true);

  protected readonly controlId = computed(() => this.id() ?? this.field.id());

  /** `aria-labelledby`, else - for an icon-only toggle - the field's label. */
  protected readonly labelledBy = computed(
    () =>
      this.ariaLabelledby() ??
      (this.ariaLabel() || this.hasText()
        ? undefined
        : this.field.labelledBy()),
  );

  protected readonly describedBy = computed(() =>
    andesIdRefs(this.ariaDescribedby(), this.field.describedBy()),
  );

  protected readonly isRequired = computed(
    () => this.required() || this.field.required(),
  );
  private onChange: (pressed: boolean) => void = noop;
  private onTouched: () => void = noop;

  protected readonly resolvedVariant = computed(
    () => this.variant() ?? this.group?.variant() ?? 'default',
  );
  /** The size in effect: its own, the group's, else the form's, else `md`. */
  readonly resolvedSize = computed<AndesToggleSize>(
    () =>
      this.size() ?? this.group?.resolvedSize() ?? this.field.size() ?? 'md',
  );
  /** The status in effect: its own, the group's, else the enclosing field's. */
  readonly resolvedStatus = computed<AndesToggleStatus | undefined>(
    () => this.status() ?? this.group?.resolvedStatus() ?? this.field.status(),
  );
  /** The group is at its `maxCount` and this toggle is not pressed. */
  protected readonly isLimited = computed(
    () => this.group?.isLimitDisabled(this.value()) ?? false,
  );
  readonly isReadOnly = computed(
    () => this.readOnly() || (this.group?.readOnly() ?? false),
  );
  readonly isDisabled = computed(
    () =>
      this.disabled() ||
      this.cvaDisabled() ||
      this.field.disabled() ||
      (this.group?.isDisabled() ?? false) ||
      this.isLimited(),
  );
  readonly isPressed = computed(() =>
    this.group ? this.group.isPressed(this.value()) : this.pressed(),
  );
  protected readonly tabIndex = computed(() =>
    !this.group || this.group.tabbable() === this ? 0 : -1,
  );

  /**
   * The one-shot ring hook, exposed as the button's `data-motion` attribute: `press` (or its
   * twin `press-alt`) from the moment `pressed` changes, either way, until the ring animation
   * ends. Absent on the first render and afterwards, so a toggle that starts out pressed never
   * rings. The twin names alternate so a change that lands while a ring runs restarts it.
   */
  protected readonly motion = signal<'press' | 'press-alt' | null>(null);
  private motionFlip = false;

  /**
   * Off until a moment after the first render, so the initial state - including a value a
   * form or the group writes in a microtask after that render - never animates.
   */
  private motionReady = false;
  private lastPressed: boolean | null = null;

  constructor() {
    // After the first render only, so it is browser-only (SSR-safe) and runs once per toggle.
    afterNextRender(() => {
      this.hasText.set((this.button?.textContent ?? '').trim() !== '');
      this.warnWithoutName();
      const timer = setTimeout(() => (this.motionReady = true));
      this.destroyRef.onDestroy(() => clearTimeout(timer));
    });

    // Turns a change of the RENDERED state (a click, the group's value, a form write) into the
    // one-shot `data-motion` hook the stylesheet animates. A toggle that cannot change takes no
    // hook: with no animation to run it would never be cleared and would ring later, stale.
    effect(() => {
      const pressed = this.isPressed();
      const previous = this.lastPressed;
      this.lastPressed = pressed;
      if (
        this.motionReady &&
        previous !== null &&
        previous !== pressed &&
        !this.isDisabled() &&
        !this.isReadOnly()
      ) {
        this.motionFlip = !this.motionFlip;
        this.motion.set(this.motionFlip ? 'press' : 'press-alt');
      }
    });
  }

  /** Moves focus to the button. */
  focus(options?: FocusOptions): void {
    this.button?.focus(options);
  }

  get button(): HTMLButtonElement | null {
    return this.element.nativeElement.querySelector('button');
  }

  protected onClick(): void {
    if (this.isDisabled() || this.isReadOnly()) {
      return;
    }
    if (this.group) {
      this.group.toggle(this.value());
      return;
    }
    const next = !this.pressed();
    this.pressed.set(next);
    this.onChange(next);
  }

  /**
   * The ring finished: drop the hook so the next change can replay it. Only the ring counts -
   * the stylesheet's keyframes names are scoped by the framework (hence the suffix match) and
   * any other animation, or one bubbling up from the label, must not clear it.
   */
  protected onMotionEnd(event: AnimationEvent): void {
    if (event.target === event.currentTarget && isRing(event.animationName)) {
      this.motion.set(null);
    }
  }

  /**
   * A ring that is cut short (the toggle was disabled or went read-only mid-way) never ends, so
   * it would replay when the toggle is enabled again. Restarting under the twin name cancels the
   * old ring too, so only the cancel of the ring that is current clears the hook.
   */
  protected onMotionCancel(event: AnimationEvent): void {
    if (
      event.target === event.currentTarget &&
      isRing(event.animationName) &&
      event.animationName.endsWith('-alt') === (this.motion() === 'press-alt')
    ) {
      this.motion.set(null);
    }
  }

  protected onBlur(): void {
    this.onTouched();
  }

  writeValue(pressed: boolean | null): void {
    this.pressed.set(!!pressed);
  }

  registerOnChange(fn: (pressed: boolean) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.cvaDisabled.set(isDisabled);
  }

  /** Development aid: a toggle with no text and no accessible name is announced as just
   *  "button", so say so once instead of failing silently. */
  private warnWithoutName(): void {
    const button = this.button;
    if (!isDevMode() || !button) {
      return;
    }
    const hasText = (button.textContent ?? '').trim() !== '';
    const named = !!this.ariaLabel() || !!this.labelledBy() || !!this.tooltip();
    if (!hasText && !named) {
      console.warn(
        '[andes-toggle] An icon-only toggle needs an accessible name: set aria-label (or tooltip).',
      );
    }
  }
}
