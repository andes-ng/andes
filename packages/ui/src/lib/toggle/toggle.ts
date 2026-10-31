import { NgTemplateOutlet } from '@angular/common';
import {
  afterNextRender,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
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

  private readonly cvaDisabled = signal(false);
  private onChange: (pressed: boolean) => void = noop;
  private onTouched: () => void = noop;

  protected readonly resolvedVariant = computed(
    () => this.variant() ?? this.group?.variant() ?? 'default',
  );
  protected readonly resolvedSize = computed(
    () => this.size() ?? this.group?.size() ?? 'md',
  );
  protected readonly resolvedStatus = computed(
    () => this.status() ?? this.group?.status(),
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
      (this.group?.isDisabled() ?? false) ||
      this.isLimited(),
  );
  readonly isPressed = computed(() =>
    this.group ? this.group.isPressed(this.value()) : this.pressed(),
  );
  protected readonly tabIndex = computed(() =>
    !this.group || this.group.tabbable() === this ? 0 : -1,
  );

  constructor() {
    // After the first render only, so it is browser-only (SSR-safe) and runs once per toggle.
    afterNextRender(() => this.warnWithoutName());
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
    const named =
      !!this.ariaLabel() || !!this.ariaLabelledby() || !!this.tooltip();
    if (!hasText && !named) {
      console.warn(
        '[andes-toggle] An icon-only toggle needs an accessible name: set aria-label (or tooltip).',
      );
    }
  }
}
