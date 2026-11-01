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
import { NgTemplateOutlet } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

import {
  andesIdRefs,
  injectAndesFieldBinding,
} from '../form-field/field-binding';
import {
  ANDES_CHECKBOX_SELECT_ALL,
  AndesCheckboxGroupState,
  AndesCheckboxValue,
} from './checkbox-group-state';
import {
  AndesCheckboxSize,
  AndesCheckboxStatus,
  AndesCheckboxVariant,
  optionalBooleanAttribute,
} from './checkbox-types';

let nextCheckboxId = 0;

/**
 * The state change the box is animating, exposed as the label's `data-motion` attribute (the
 * stylesheet's only animation hook). Absent on first render and after each animation ends.
 */
type AndesCheckboxMotion = 'check' | 'indeterminate' | 'uncheck';

type AndesCheckboxVisual = 'checked' | 'indeterminate' | 'unchecked';

/** Which side of the box the projected label sits on, in the current writing direction. */
export type AndesCheckboxLabelPosition = 'start' | 'end';

/**
 * Payload of `AndesCheckbox`'s `changed` output: the new checked state plus the native event,
 * flattened so the common case reads `event.checked` rather than digging through a synthetic
 * `target`.
 */
export interface AndesCheckboxChange {
  /** The new checked state. */
  readonly checked: boolean;
  /** The checkbox's `value`, if it has one. */
  readonly value: AndesCheckboxValue | undefined;
  /** The checkbox that changed. */
  readonly source: AndesCheckbox;
  /** The native `change` event from the underlying `<input type="checkbox">`. */
  readonly event: Event;
}

@Component({
  selector: 'andes-checkbox',
  imports: [NgTemplateOutlet],
  templateUrl: './checkbox.html',
  styleUrl: './checkbox.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    // Forwarded to the native input in the template instead - a screen reader never sees
    // this non-interactive host element, so leaving these here would do nothing (see the
    // same convention in AndesButton). `id` too: an external `<label for>` must point at the
    // focusable input, and a static `id` left on the host would duplicate it.
    '[attr.id]': 'null',
    '[attr.aria-label]': 'null',
    '[attr.aria-labelledby]': 'null',
    '[attr.aria-describedby]': 'null',
    '[attr.aria-invalid]': 'null',
  },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AndesCheckbox),
      multi: true,
    },
  ],
})
export class AndesCheckbox implements ControlValueAccessor {
  /**
   * The enclosing `AndesCheckboxGroup`'s shared state, or `null` when this checkbox is used on
   * its own - which is the whole point of `{ optional: true }`: group participation is opt-in
   * by placement alone, and a standalone checkbox keeps exactly the behavior it always had.
   */
  private readonly group = inject(AndesCheckboxGroupState, { optional: true });

  /**
   * True when `AndesCheckboxSelectAll` sits on this same element. Such a checkbox lives inside
   * the group but must never register as one of its ITEMS - it summarizes them, so counting
   * itself would make the aggregate depend on its own output.
   */
  private readonly isSelectAll =
    inject(ANDES_CHECKBOX_SELECT_ALL, { optional: true, self: true }) !== null;

  /**
   * Single source of truth for the rendered `checked` state - AND the two-way binding
   * surface for it (`model()` auto-generates the `checkedChange` output, enabling
   * `[(checked)]`). A user click writes straight into this signal (see `onNativeChange`) and
   * `writeValue` does the same for Reactive/Template-driven forms - there is no longer a
   * separate "internal" signal that mirrors it, the way the previous `checked` `input()` +
   * `checkedState` `linkedSignal` pair did.
   *
   * That split was the actual bug, not just the `signal()` + `effect()` mirror it replaced:
   * a parent re-asserting a value the reactive graph doesn't perceive as "changed" from what
   * it last wrote is unobservable by ANY Angular signal primitive - traced against Angular's
   * own reactive-graph source, this isn't specific to `linkedSignal`. With two distinct
   * signals, a click could leave the parent's own `checked` sitting on a value it never
   * itself transitioned away from, so a later "reassertion" of that same value was a no-op
   * write from the framework's point of view and the checkbox stayed stuck on the
   * click-diverged state. Folding both into one `model()` signal removes the second signal
   * entirely - a click and a bound parent's own state are the exact same value at every
   * instant (when the parent wires `[(checked)]`/`(checkedChange)`), so there is nothing left
   * to diverge and nothing to "reassert" against.
   */
  readonly checked = model<boolean>(false);

  readonly disabled = input(false, { transform: booleanAttribute });

  /**
   * Two-way model for the native `indeterminate` DOM PROPERTY (not an HTML attribute -
   * `[attr.indeterminate]` is a no-op on a native checkbox, see checkbox.html). Same
   * rationale as `checked` above: a user click writes straight into this signal (see
   * `onNativeChange`) - a native checkbox's `indeterminate` property is automatically reset
   * to `false` by the browser the moment the user interacts with it, and mirroring that
   * directly into the single shared model (rather than a separate internal copy of it) is
   * what lets a bound parent's own `indeterminate` state stay perfectly in sync, with nothing
   * left to fall out of sync the way the previous `indeterminateState` `linkedSignal` could.
   */
  readonly indeterminate = model<boolean>(false);

  readonly required = input(false, { transform: booleanAttribute });
  /**
   * Prevents toggling without visually disabling the control - distinct from `disabled`:
   * a read-only checkbox stays focusable and keeps its normal (non-dimmed) appearance, it
   * just can't be changed.
   * Native `<input type="checkbox">` ignores the HTML `readonly` attribute entirely (the
   * platform only honors it on text-like inputs), so this is enforced by preventing the
   * `click` that would otherwise toggle it - the same technique `AndesButtonPrimitive` uses
   * to block navigation on a disabled anchor.
   */
  readonly readOnly = input(false, { transform: booleanAttribute });
  /**
   * What this checkbox contributes to an enclosing group's selection (and the native input's
   * submitted `value`). A number stays a number in the group's value array.
   */
  readonly value = input<AndesCheckboxValue | undefined>(undefined);
  /** `id` of the native input, for an external `<label for>`. Never left on the host. */
  readonly id = input<string | undefined>(undefined);
  readonly name = input<string | undefined>(undefined);
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

  /** Puts the label before (`start`) or after (`end`, the default) the box. */
  readonly labelPosition = input<AndesCheckboxLabelPosition>('end');

  /**
   * Box and label scale, the same sm / md / lg steps as AndesInput so a checkbox sits level
   * with the fields around it. Unset, it takes the enclosing group's `size` (an explicit size
   * on the checkbox wins), then `md`.
   */
  readonly size = input<AndesCheckboxSize | undefined>(undefined);

  /**
   * Validation tier, like AndesInput's: `error` paints the box (or card / button border) in
   * the danger color and sets `aria-invalid` - the same result as `aria-invalid="true"` -
   * while `warning` only paints the warning color, since a warning is not a failure. Unset, it
   * takes the enclosing group's `status`.
   */
  readonly status = input<AndesCheckboxStatus | undefined>(undefined);

  /**
   * `default` (the plain box), `card` (a bordered card that is clickable as a whole and lights
   * up when checked) or `button` (a toggle button; inside a group the buttons join into one
   * segmented control). Unset, it takes the enclosing group's `variant`.
   */
  readonly variant = input<AndesCheckboxVariant | undefined>(undefined);

  /**
   * Whether the box is drawn. Defaults to shown, except for `variant="button"`, whose checked
   * state is carried by the button itself (pass `indicator` to add the box back). Hiding it
   * never removes the native input, so the control keeps its keyboard stop and semantics.
   */
  readonly indicator = input<boolean | undefined, unknown>(undefined, {
    transform: optionalBooleanAttribute,
  });

  /**
   * Replaces the default tick. A context-free template whose `<svg>` is sized to the box's
   * glyph area and drawn in `currentColor` (the primary foreground), like AndesInput's
   * `clearIcon`. Unset, it takes the enclosing group's `checkedIcon`.
   */
  readonly checkedIcon = input<TemplateRef<unknown> | undefined>(undefined);

  /** Replaces the default indeterminate dash; same contract as `checkedIcon`. */
  readonly indeterminateIcon = input<TemplateRef<unknown> | undefined>(
    undefined,
  );

  /**
   * Focuses the native input once, right after the first render. Read once on purpose (like the
   * HTML `autofocus` attribute): toggling it later never steals focus.
   */
  readonly autoFocus = input(false, { transform: booleanAttribute });

  /**
   * Opts a checkbox placed inside an `AndesCheckboxGroup` out of the group: it keeps its own
   * `checked` model, is not part of the group's `value` array or select-all aggregate, and
   * does not inherit the group's `name`. Like a disabled `<fieldset>`, a disabled group still
   * disables it: opting out only skips the value wiring, not the group's disabled state.
   */
  readonly skipGroup = input(false, { transform: booleanAttribute });

  /**
   * Fires on every USER toggle (never for programmatic `checked`/form writes), carrying the
   * new state and the native event. Deliberately not named `change`: the inner input's native
   * `change` event already bubbles to `<andes-checkbox>` (and `AndesCheckboxSelectAll` listens
   * for it), so an output of that name would make `(change)` fire twice with two different
   * payloads - which is also what `no-output-native` forbids.
   */
  readonly changed = output<AndesCheckboxChange>();

  /**
   * The native input gained focus. Needed as an output because `focus` does not bubble, so a
   * `(focus)` listener on `<andes-checkbox>` itself would never fire. Not named `focus`: that
   * is the imperative method below (and a native event name `no-output-native` forbids).
   */
  readonly focused = output<FocusEvent>();

  /** The native input lost focus - the counterpart of `focused`. */
  readonly blurred = output<FocusEvent>();

  private readonly inputRef =
    viewChild.required<ElementRef<HTMLInputElement>>('input');
  private readonly labelTextRef =
    viewChild.required<ElementRef<HTMLElement>>('labelText');
  private readonly descriptionRef =
    viewChild.required<ElementRef<HTMLElement>>('description');
  private readonly destroyRef = inject(DestroyRef);

  private readonly uid = ++nextCheckboxId;
  protected readonly labelTextId = `andes-checkbox-${this.uid}-label`;
  protected readonly descriptionId = `andes-checkbox-${this.uid}-description`;

  /**
   * Whether anything was projected into `[slot=description]` / the default slot. Read from the
   * DOM after each render (projected content cannot be queried by attribute selector), so they
   * stay `false` during server rendering and the description wiring lands on hydration.
   */
  protected readonly hasDescription = signal(false);
  private readonly hasLabelText = signal(false);

  /**
   * `model()` intentionally has no `transform` option - unlike `input()`, a two-way binding's
   * output has to emit exactly the type its input accepts, so it can't silently coerce values
   * on the way in without breaking that round-trip. That means a bare, bracket-less
   * `checked`/`indeterminate` attribute (e.g. `<andes-checkbox checked>`, used throughout
   * checkbox.stories.ts) is written into the model as the literal empty string, not `true`.
   * The native DOM-property bindings in checkbox.html read through these `booleanAttribute`
   * coerced computeds instead of the raw models directly to restore that. Being `computed()`
   * rather than a locally-settable signal, this can never itself drift out of sync with the
   * model it derives from - it's a pure formatter for the native property setter, not a
   * second piece of state.
   */
  protected readonly checkedProp = computed(() => {
    // Inside a group, the group's selection array - not this checkbox's own `checked` model -
    // is the source of truth, so that a checkbox added, removed or re-rendered at any time
    // always shows the group's current answer rather than a stale local copy of it.
    const fromGroup = this.selectedInGroup();

    return fromGroup ?? booleanAttribute(this.checked());
  });
  protected readonly indeterminateProp = computed(() =>
    booleanAttribute(this.indeterminate()),
  );

  /**
   * `null` when this checkbox is not a group item (standalone, select-all, `skipGroup`, or no
   * `value`).
   */
  private readonly selectedInGroup = computed<boolean | null>(() => {
    const value = this.groupValue();

    return value !== undefined ? (this.group?.isSelected(value) ?? null) : null;
  });

  /**
   * The value this checkbox contributes to its group, or `undefined` when it contributes
   * nothing. Handed to the group as the item's `value` signal, so flipping `skipGroup` at
   * runtime simply makes the item drop out of (or rejoin) the aggregate, without having to
   * unregister and re-register it.
   */
  private readonly groupValue = computed(() =>
    this.group !== null && !this.isSelectAll && !this.skipGroup()
      ? this.value()
      : undefined,
  );

  /** An item's own `name` wins; otherwise it submits under its group's `name`. */
  protected readonly effectiveName = computed(
    () =>
      this.name() ??
      (this.groupValue() !== undefined ? this.group?.name() : undefined),
  );

  private readonly formDisabled = signal(false);

  /**
   * The enclosing form field and form. A checkbox inside a group leaves the field to the
   * group (`field: false`) and only follows the form's size and disabled.
   */
  protected readonly field = injectAndesFieldBinding({
    field: this.group === null,
  });

  /** `id`, else the enclosing field's control id, so its label toggles this checkbox. */
  protected readonly controlId = computed(() => this.id() ?? this.field.id());

  protected readonly isRequired = computed(
    () => this.required() || this.field.required(),
  );

  /**
   * The checkbox's own disabled state: its input, its form control, or the group's. This is
   * what the group's aggregate sees - never the `maxCount` disabling below, which is temporary
   * and must not make select-all think the item is out of reach.
   */
  private readonly ownDisabled = computed(
    () =>
      this.disabled() ||
      this.formDisabled() ||
      this.field.disabled() ||
      (this.group?.disabled() ?? false),
  );

  /** Disabled because the group's `maxCount` is reached and this item is unchecked. */
  private readonly limitDisabled = computed(() => {
    const value = this.groupValue();
    return value !== undefined && (this.group?.isLimitDisabled(value) ?? false);
  });

  protected readonly isDisabled = computed(
    () => this.ownDisabled() || this.limitDisabled(),
  );

  /** Its own `readOnly`, or a read-only group's (which, like `disabled`, covers `skipGroup`). */
  protected readonly isReadOnly = computed(
    () => this.readOnly() || (this.group?.readOnly() ?? false),
  );

  /** The size in effect: its own, the group's, the form's, else `md`. */
  readonly resolvedSize = computed(
    () => this.size() ?? this.group?.size() ?? this.field.size() ?? 'md',
  );
  protected readonly effectiveStatus = computed(
    () => this.status() ?? this.group?.status() ?? this.field.status(),
  );
  protected readonly effectiveVariant = computed(
    () => this.variant() ?? this.group?.variant() ?? 'default',
  );
  protected readonly showIndicator = computed(
    () =>
      this.indicator() ??
      this.group?.indicator() ??
      this.effectiveVariant() !== 'button',
  );

  /** `aria-invalid` and `status="error"` are one state: same look, same announcement. */
  protected readonly isInvalid = computed(
    () => this.ariaInvalid() || this.effectiveStatus() === 'error',
  );

  /**
   * A button inside a group (laid out as a row or a column, not a grid) joins its neighbours
   * into one segmented control: shared borders, outer corners only.
   */
  protected readonly segment = computed<'horizontal' | 'vertical' | null>(() =>
    this.effectiveVariant() === 'button' &&
    this.group !== null &&
    this.group.columns() === undefined
      ? this.group.orientation()
      : null,
  );

  protected readonly effectiveCheckedIcon = computed(
    () => this.checkedIcon() ?? this.group?.checkedIcon(),
  );
  protected readonly effectiveIndeterminateIcon = computed(
    () => this.indeterminateIcon() ?? this.group?.indeterminateIcon(),
  );

  /** Only strings and numbers have a meaningful native `value`; an object submits nothing. */
  protected readonly nativeValue = computed(() => {
    const value = this.value();
    return typeof value === 'string' || typeof value === 'number'
      ? value
      : null;
  });

  /**
   * The description sits inside the `<label>` (so clicking it toggles, and a card is clickable
   * as a whole), which would also fold it into the accessible NAME. Pointing the input at the
   * label text alone keeps the name short and leaves the description to `aria-describedby`.
   */
  protected readonly effectiveLabelledby = computed(
    () =>
      this.ariaLabelledby() ??
      (this.hasDescription() && this.hasLabelText() && !this.ariaLabel()
        ? this.labelTextId
        : undefined) ??
      // With no text of its own, the checkbox is named by the field's label.
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

  /** See `AndesCheckboxMotion`. */
  protected readonly motion = signal<AndesCheckboxMotion | null>(null);

  /**
   * Off until a moment after the first render, so the initial state - including a value a
   * template-driven `ngModel` writes in a microtask after that render - never animates.
   */
  private motionReady = false;
  private lastVisual: AndesCheckboxVisual | null = null;

  private onChange: (value: boolean) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  constructor() {
    const group = this.group;
    if (group !== null && !this.isSelectAll) {
      // Registered unconditionally (rather than only while `value` is set) so the item object
      // stays stable for this checkbox's whole lifetime - `value` and `disabled` are handed
      // over as signals, so the group re-reads them itself instead of needing a re-register.
      const unregister = group.registerItem({
        value: this.groupValue,
        disabled: this.ownDisabled,
      });
      this.destroyRef.onDestroy(unregister);
    }

    afterNextRender(() => {
      if (this.autoFocus()) {
        this.focus();
      }
      const timer = setTimeout(() => (this.motionReady = true));
      this.destroyRef.onDestroy(() => clearTimeout(timer));
    });

    afterEveryRender({
      read: () => {
        const description = this.descriptionRef().nativeElement;
        const label = this.labelTextRef().nativeElement;
        this.hasDescription.set(hasContent(description));
        this.hasLabelText.set(hasContent(label));
      },
    });

    // Turns a change of the RENDERED state (whatever caused it: a click, select-all, a form
    // write) into the one-shot `data-motion` hook the stylesheet animates.
    effect(() => {
      const visual: AndesCheckboxVisual = this.indeterminateProp()
        ? 'indeterminate'
        : this.checkedProp()
          ? 'checked'
          : 'unchecked';
      const previous = this.lastVisual;
      this.lastVisual = visual;
      if (!this.motionReady || previous === null || previous === visual) {
        return;
      }
      this.motion.set(
        visual === 'checked'
          ? 'check'
          : visual === 'indeterminate'
            ? 'indeterminate'
            : 'uncheck',
      );
    });
  }

  /** Moves focus to the native input. */
  focus(options?: FocusOptions): void {
    this.inputRef().nativeElement.focus(options);
  }

  /** Removes focus from the native input. */
  blur(): void {
    this.inputRef().nativeElement.blur();
  }

  /**
   * The underlying `<input type="checkbox">`, for integrations that need the real DOM control
   * (measuring it, anchoring a tooltip to it, reading `validity`). Prefer the component's own
   * inputs and methods for anything they already cover.
   */
  get nativeElement(): HTMLInputElement {
    return this.inputRef().nativeElement;
  }

  protected onNativeClick(event: MouseEvent): void {
    if (this.isReadOnly()) {
      event.preventDefault();
      return;
    }

    // At the group's `minCount` a checked item may not be unchecked. Blocked at the click,
    // like `readOnly`, because by `change` time the native box has already flipped.
    const group = this.group;
    const value = this.groupValue();
    if (group !== null && value !== undefined && group.isLocked(value)) {
      event.preventDefault();
      group.notifyMinBlocked();
    }
  }

  /**
   * The one-shot animation finished: drop the hook so a re-shown box does not replay it. The
   * ripple is the longest of the animations a change starts (the tick and the pop end sooner),
   * so only its end counts; an earlier one would cut the ring short.
   */
  protected onMotionEnd(event: AnimationEvent): void {
    if (event.animationName.includes('andes-checkbox-ripple')) {
      this.motion.set(null);
    }
  }

  protected onNativeChange(event: Event): void {
    const nativeInput = event.target as HTMLInputElement;

    // Writing directly into the shared `checked`/`indeterminate` models - rather than some
    // separate internal signal - is what makes this immediately visible to a bound parent:
    // `model.set()` emits the paired `checkedChange`/`indeterminateChange` output itself
    // whenever the value actually changes, so `[(checked)]`/`[(indeterminate)]` (or a plain
    // `(checkedChange)`/`(indeterminateChange)` listener) stays in lockstep with the click,
    // with no explicit `.emit()` calls needed here.
    this.checked.set(nativeInput.checked);
    // The browser already cleared the DOM property on this same interaction - mirror it into
    // the model rather than letting the next render fight the user's click.
    this.indeterminate.set(nativeInput.indeterminate);

    // Inside a group, the click also has to reach the group's shared selection - that is what
    // `checkedProp` renders from, so without this the DOM would snap straight back.
    const group = this.group;
    const value = this.groupValue();
    if (group !== null && value !== undefined) {
      group.toggleItem(value, nativeInput.checked);
    }

    this.onChange(nativeInput.checked);
    this.changed.emit({
      checked: nativeInput.checked,
      value: this.value(),
      source: this,
      event,
    });
  }

  protected onNativeFocus(event: FocusEvent): void {
    this.focused.emit(event);
  }

  protected onNativeBlur(event: FocusEvent): void {
    this.onTouched();
    this.blurred.emit(event);
  }

  writeValue(value: boolean | null): void {
    // No more "form-controlled vs. plain input" priority dance: `checked` is the one and
    // only signal backing this control now, so a form value simply writes into it directly.
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

function hasContent(element: HTMLElement): boolean {
  return (
    element.childElementCount > 0 || (element.textContent ?? '').trim() !== ''
  );
}
