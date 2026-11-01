import { Directionality } from '@angular/cdk/bidi';
import { NgTemplateOutlet } from '@angular/common';
import {
  afterNextRender,
  afterRenderEffect,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChildren,
  DestroyRef,
  ElementRef,
  forwardRef,
  inject,
  input,
  model,
  numberAttribute,
  output,
  signal,
  TemplateRef,
  viewChildren,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

import {
  andesIdRefs,
  injectAndesFieldBinding,
} from '../form-field/field-binding';
import { AndesSegmentedOption } from './segmented-option';
import {
  ANDES_SEGMENTED,
  AndesSegmentedApi,
  AndesSegmentedChange,
  AndesSegmentedMotion,
  AndesSegmentedOptionConfig,
  AndesSegmentedOptionContext,
  AndesSegmentedOptionInput,
  AndesSegmentedShape,
  AndesSegmentedSize,
  AndesSegmentedStatus,
  AndesSegmentedVariant,
} from './segmented-types';

export type {
  AndesSegmentedChange,
  AndesSegmentedMotion,
  AndesSegmentedOptionConfig,
  AndesSegmentedOptionContext,
  AndesSegmentedOptionInput,
  AndesSegmentedShape,
  AndesSegmentedSize,
  AndesSegmentedStatus,
  AndesSegmentedVariant,
} from './segmented-types';

interface ThumbBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

function noop(): void {
  /* replaced by registerOnChange/registerOnTouched */
}

/** `columns` must be a whole number of at least 1; anything else means "no grid". */
function columnsAttribute(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  const parsed = numberAttribute(value, Number.NaN);
  return Number.isNaN(parsed) || parsed < 1 ? undefined : Math.floor(parsed);
}

/** How far (px) an option is kept from the scrollport edge, so it clears the edge fade. */
const REVEAL_MARGIN = 20;

/**
 * A single-choice control drawn as one pill of adjacent segments, with a thumb that slides to
 * the selected one. Semantically it is a radio group: `role="radiogroup"` containing
 * `role="radio"` buttons with a roving tab stop, so Tab reaches the selected segment and the
 * arrow keys (mirrored in right-to-left layouts) move and select, Home/End jump to the ends,
 * and disabled segments are skipped.
 *
 * Options come from the `options` input, from projected `<andes-segmented-option>` elements, or
 * both (generated ones first). The thumb is placed by measuring the selected segment, so it
 * follows any label width, font or `block`/`vertical` layout; it slides over 300ms and snaps
 * instantly under `prefers-reduced-motion`.
 *
 * Integrates with Angular forms (`[(ngModel)]`, `formControl`) and with `[(value)]`.
 *
 * Mirrors the other choice controls: `status` (`error` also sets `aria-invalid`), `readOnly`
 * (focusable and announced through `aria-readonly`, but changes nothing), `loop`, `columns`,
 * and the `focused` / `blurred` outputs with `focus()` / `blur()` for the group as a whole.
 * `variant`, `motion`, `scrollable` and option `description` adapt it to the layout at hand.
 */
@Component({
  selector: 'andes-segmented',
  imports: [AndesSegmentedOption, NgTemplateOutlet],
  templateUrl: './segmented.html',
  styleUrl: './segmented.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AndesSegmented),
      multi: true,
    },
    { provide: ANDES_SEGMENTED, useExisting: forwardRef(() => AndesSegmented) },
  ],
  host: {
    role: 'radiogroup',
    'data-slot': 'segmented',
    '[attr.id]': 'controlId() ?? null',
    '[attr.aria-label]': 'ariaLabel()',
    '[attr.aria-labelledby]': 'labelledBy() ?? null',
    '[attr.aria-describedby]': 'describedBy() ?? null',
    // `error` and `aria-invalid` are one state: same look, same announcement.
    '[attr.aria-invalid]': 'isInvalid() || null',
    '[attr.aria-required]': 'isRequired() || null',
    // `aria-readonly` is supported on the radiogroup role (not on the individual radios).
    '[attr.aria-readonly]': 'readOnly() || null',
    '[attr.aria-disabled]': 'isDisabled() || null',
    '[attr.data-size]': 'resolvedSize()',
    '[attr.data-shape]': 'shape()',
    '[attr.data-variant]': 'resolvedVariant()',
    '[attr.data-status]': 'resolvedStatus()',
    '[attr.data-orientation]': "vertical() ? 'vertical' : 'horizontal'",
    '[attr.data-block]': "block() ? '' : null",
    '[attr.data-disabled]': "isDisabled() ? '' : null",
    '[attr.data-readonly]': "readOnly() ? '' : null",
    '[attr.data-scrollable]': "scrollable() ? '' : null",
    // Physical (left/top = before, right/bottom = after): scrolling geometry is physical.
    '[attr.data-fade-before]': "scrollEdges().before ? '' : null",
    '[attr.data-fade-after]': "scrollEdges().after ? '' : null",
    '[attr.data-columns]': 'columns() ?? null',
    '[attr.data-described]': "hasDescription() ? '' : null",
    '[attr.data-thumb]': 'thumbState()',
    '[style.--andes-segmented-columns]': 'columns() ?? null',
    '[style.--andes-segmented-duration]': 'motionDuration()',
    '[style.--andes-segmented-easing]': 'motionEasing()',
    '(keydown)': 'onKeydown($event)',
    '(focusin)': 'onFocusIn($event)',
    '(focusout)': 'onFocusOut($event)',
    '(scroll)': 'updateScrollEdges()',
  },
})
export class AndesSegmented<T = unknown>
  implements ControlValueAccessor, AndesSegmentedApi
{
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly directionality = inject(Directionality);
  private readonly destroyRef = inject(DestroyRef);

  /** Selected value. Two-way bindable (`[(value)]`) and driven by Angular forms. */
  readonly value = model<T | null>(null);
  /** Generated options; strings and numbers are shorthand for `{ label, value }`. */
  readonly options = input<readonly AndesSegmentedOptionInput<T>[]>([]);
  /** Custom content for generated options; receives the option as `let-option`. */
  readonly optionLabel = input<
    TemplateRef<AndesSegmentedOptionContext<T>> | undefined
  >(undefined);
  /** `md` unless set, or the enclosing `andesForm`'s `size`. */
  readonly size = input<AndesSegmentedSize | undefined>(undefined);
  readonly shape = input<AndesSegmentedShape>('default');
  /**
   * Look of the control: `default` (muted track, raised thumb), `outlined` (bordered track),
   * `filled` (selected segment in the primary color) or `borderless` (no track). The
   * `--andes-segmented-bg` and `--andes-segmented-thumb-bg` properties still restyle the
   * colors of `default`.
   */
  readonly variant = input<AndesSegmentedVariant | undefined>(undefined);
  /** Id of the radiogroup element. Defaults to the enclosing field's control id. */
  readonly id = input<string | undefined>(undefined);
  /**
   * Validation tier, like AndesInput's `status`: `error` draws the track and the focus ring in
   * the danger color and sets `aria-invalid` (the existing `aria-invalid` input keeps working
   * and means the same as `error`); `warning` only paints them in the warning color.
   */
  readonly status = input<AndesSegmentedStatus | undefined>(undefined);
  /**
   * Nothing can be changed, but the options stay focusable and keep their normal look (no
   * hover feedback), and the group is announced as read-only (`aria-readonly`). Arrow keys
   * still move focus; they just no longer select. Unlike `disabled`, nothing is dimmed and the
   * group stays in the tab order.
   */
  readonly readOnly = input(false, { transform: booleanAttribute });
  /**
   * Timing of the sliding thumb (`{ duration, easing }`), written to the
   * `--andes-segmented-duration` / `--andes-segmented-easing` custom properties on the host,
   * which can also be set from CSS instead. Reduced-motion users never get a slide.
   */
  readonly motion = input<AndesSegmentedMotion | undefined>(undefined);
  /**
   * With more options than fit, scroll the track along its axis (horizontally, or vertically
   * with `vertical`) instead of squeezing or overflowing: the selected option is kept in view,
   * keyboard moves scroll the active option into view and a soft fade marks each edge that has
   * more behind it. A vertical track needs a height to scroll in (`max-height` on the host).
   */
  readonly scrollable = input(false, { transform: booleanAttribute });
  /**
   * Whether ArrowRight/ArrowDown on the last option wraps to the first and ArrowLeft/ArrowUp on
   * the first wraps to the last (the radiogroup default). Set `false` to stop at the ends;
   * Home and End always jump to the first and last enabled option.
   */
  readonly loop = input(true, { transform: booleanAttribute });
  /**
   * Lays the options out in a grid of this many equal columns (a whole number of at least 1),
   * for wrapped layouts, usually together with `block`. It replaces `vertical`.
   */
  readonly columns = input<number | undefined, unknown>(undefined, {
    transform: columnsAttribute,
  });
  /** Focus the selected option (or the first enabled one) once the group first renders. */
  readonly autoFocus = input(false, { transform: booleanAttribute });
  /** Stretch to the container's width, giving every segment an equal share. */
  readonly block = input(false, { transform: booleanAttribute });
  /** Stack the segments top to bottom. */
  readonly vertical = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly required = input(false, { transform: booleanAttribute });
  /** Submitted with a native form as a hidden input of this name. */
  readonly name = input<string | undefined>(undefined);
  /** Decides whether two values are the same choice; defaults to `Object.is`. */
  readonly compareWith = input<(a: T | null, b: T | null) => boolean>(
    Object.is,
  );
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

  /** Fires when the user selects a segment (click, Space/Enter or arrow keys), not for
   *  programmatic writes. Not named `change` so it cannot collide with the native event. */
  readonly selectionChange = output<AndesSegmentedChange<T>>();

  /** Focus entered the group from outside (it does not fire when moving between options). */
  readonly focused = output<FocusEvent>();

  /** Focus left the group as a whole (not when moving between its options). */
  readonly blurred = output<FocusEvent>();

  private readonly cvaDisabled = signal(false);
  private onChange: (value: T | null) => void = noop;
  private onTouched: () => void = noop;

  protected readonly normalizedOptions = computed<
    AndesSegmentedOptionConfig<T>[]
  >(() =>
    this.options().map((option) =>
      typeof option === 'object' && option !== null
        ? (option as AndesSegmentedOptionConfig<T>)
        : { label: String(option), value: option as T },
    ),
  );

  private readonly viewOptions = viewChildren(AndesSegmentedOption);
  private readonly contentOptions = contentChildren(AndesSegmentedOption, {
    descendants: true,
  });
  /** Every option in DOM order: generated ones, then projected ones. */
  protected readonly allOptions = computed(
    () =>
      [
        ...this.viewOptions(),
        ...this.contentOptions(),
      ] as AndesSegmentedOption<T>[],
  );

  /** The enclosing form field and form: id, ARIA, status, size, variant and disabled. */
  protected readonly field = injectAndesFieldBinding();

  /** The size in effect: `size`, else the form's, else `md`. */
  readonly resolvedSize = computed<AndesSegmentedSize>(
    () => this.size() ?? this.field.size() ?? 'md',
  );

  /** The variant in effect: `variant`, else the form's when this control has it
   *  (`underlined` it has not), else `default`. */
  readonly resolvedVariant = computed<AndesSegmentedVariant>(() => {
    const own = this.variant();
    if (own) {
      return own;
    }
    const form = this.field.variant();
    return form && form !== 'underlined' ? form : 'default';
  });

  protected readonly controlId = computed(() => this.id() ?? this.field.id());

  /** `aria-labelledby`, else the field's label - unless an `aria-label` names the group. */
  protected readonly labelledBy = computed(
    () =>
      this.ariaLabelledby() ??
      (this.ariaLabel() ? undefined : this.field.labelledBy()),
  );

  protected readonly describedBy = computed(() =>
    andesIdRefs(this.ariaDescribedby(), this.field.describedBy()),
  );

  protected readonly isRequired = computed(
    () => this.required() || this.field.required(),
  );

  readonly isDisabled = computed(
    () => this.disabled() || this.cvaDisabled() || this.field.disabled(),
  );

  /** `status`, else the enclosing field's error or warning. */
  private readonly effectiveStatus = computed(
    () => this.status() ?? this.field.status(),
  );

  /** `aria-invalid` and `status="error"` are one state. */
  protected readonly isInvalid = computed(
    () => this.ariaInvalid() || this.effectiveStatus() === 'error',
  );
  protected readonly resolvedStatus = computed<AndesSegmentedStatus | null>(
    () => (this.isInvalid() ? 'error' : (this.effectiveStatus() ?? null)),
  );
  protected readonly motionDuration = computed(() => {
    const duration = this.motion()?.duration;
    if (duration === undefined) {
      return null;
    }
    return typeof duration === 'number'
      ? `${Math.max(0, duration)}ms`
      : duration;
  });
  protected readonly motionEasing = computed(
    () => this.motion()?.easing ?? null,
  );

  readonly hasDescription = computed(() =>
    this.allOptions().some((option) => !!option.description()),
  );

  readonly isChecked = (value: unknown): boolean =>
    this.compareWith()(this.value(), value as T) && this.value() !== null;

  private readonly checkedOption = computed(
    () =>
      this.allOptions().find((option) => this.isChecked(option.value())) ??
      null,
  );

  readonly tabbable = computed<unknown>(() => {
    const enabled = this.allOptions().filter((option) => !option.isDisabled());
    const checked = this.checkedOption();
    return checked && !checked.isDisabled() ? checked : (enabled[0] ?? null);
  });

  protected readonly thumb = signal<ThumbBox | null>(null);
  private readonly thumbReady = signal(false);
  protected readonly thumbState = computed(() =>
    this.thumbReady() ? 'ready' : 'pending',
  );
  protected readonly thumbStyle = computed(() => {
    const box = this.thumb();
    return box
      ? {
          width: `${box.width}px`,
          height: `${box.height}px`,
          transform: `translate(${box.x}px, ${box.y}px)`,
        }
      : null;
  });

  /** Which edges of a scrollable track have more content behind them (physical sides). */
  protected readonly scrollEdges = signal({ before: false, after: false });
  private revealed: AndesSegmentedOption<T> | null = null;

  private observer: ResizeObserver | undefined;
  private readyTimer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    afterRenderEffect(() => {
      // Re-measure whenever anything that can move the selected segment changes.
      this.checkedOption();
      const options = this.allOptions();
      this.resolvedSize();
      this.shape();
      this.resolvedVariant();
      this.vertical();
      this.block();
      this.columns();
      this.hasDescription();
      const scrollable = this.scrollable();
      this.measureThumb();
      this.observeSizes(options);
      this.updateScrollEdges();
      const checked = this.checkedOption();
      if (scrollable && checked && checked !== this.revealed) {
        // The first placement is instant; later selections glide (CSS decides, honoring
        // reduced motion).
        this.reveal(checked, this.revealed === null);
      }
      this.revealed = checked;
    });

    this.destroyRef.onDestroy(() => {
      this.observer?.disconnect();
      clearTimeout(this.readyTimer);
    });
    // Web fonts change label widths after the first measurement.
    afterNextRender(() => {
      void this.host.nativeElement.ownerDocument.fonts?.ready.then(() =>
        this.measureThumb(),
      );
      if (this.autoFocus()) {
        this.focus();
      }
    });
  }

  /** Focus the selected segment, or the first enabled one. */
  focus(options?: FocusOptions): void {
    (this.tabbable() as AndesSegmentedOption<T> | null)?.focus(options);
  }

  /** Remove focus from whichever option of this group currently has it (no-op otherwise). */
  blur(): void {
    const element = this.host.nativeElement;
    const active = element.ownerDocument.activeElement;
    if (active instanceof HTMLElement && element.contains(active)) {
      active.blur();
    }
  }

  select(value: unknown, event: Event): void {
    if (this.isDisabled() || this.readOnly()) {
      return;
    }
    const next = value as T;
    const changed = !this.isChecked(next);
    this.value.set(next);
    if (changed) {
      this.onChange(next);
      this.selectionChange.emit({ value: next, event });
    }
    this.onTouched();
  }

  writeValue(value: T | null): void {
    this.value.set(value);
  }

  registerOnChange(fn: (value: T | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.cvaDisabled.set(isDisabled);
  }

  protected serialize(value: T | null): string {
    return value === null || value === undefined ? '' : String(value);
  }

  protected onFocusIn(event: FocusEvent): void {
    if (!this.contains(event.relatedTarget)) {
      this.focused.emit(event);
    }
  }

  protected onFocusOut(event: FocusEvent): void {
    if (!this.contains(event.relatedTarget)) {
      this.onTouched();
      this.blurred.emit(event);
    }
  }

  private contains(target: EventTarget | null): boolean {
    return target instanceof Node && this.host.nativeElement.contains(target);
  }

  private isRtl(): boolean {
    const element = this.host.nativeElement;
    return (
      this.directionality.value === 'rtl' ||
      element.ownerDocument.defaultView?.getComputedStyle(element).direction ===
        'rtl'
    );
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (this.isDisabled() || event.altKey || event.ctrlKey || event.metaKey) {
      return;
    }
    const enabled = this.allOptions().filter((option) => !option.isDisabled());
    const current = enabled.findIndex((option) =>
      option.element.contains(event.target as Node),
    );
    if (current === -1) {
      return;
    }
    const rtl = this.isRtl();
    const forward = rtl ? 'ArrowLeft' : 'ArrowRight';
    const backward = rtl ? 'ArrowRight' : 'ArrowLeft';
    const last = enabled.length - 1;
    const loop = this.loop();
    let target: number;
    // An arrow past either end with `loop` off: swallowed, so the page does not scroll either.
    let blocked = false;
    switch (event.key) {
      case 'ArrowDown':
      case forward:
        blocked = current === last && !loop;
        target = blocked ? current : current < last ? current + 1 : 0;
        break;
      case 'ArrowUp':
      case backward:
        blocked = current === 0 && !loop;
        target = blocked ? current : current > 0 ? current - 1 : last;
        break;
      case 'Home':
        target = 0;
        break;
      case 'End':
        target = last;
        break;
      default:
        return;
    }
    event.preventDefault();
    if (blocked) {
      return;
    }
    const option = enabled[target];
    // The browser's own scroll-into-view would leave the option under the edge fade.
    option.focus(this.scrollable() ? { preventScroll: true } : undefined);
    this.reveal(option, false);
    this.select(option.value(), event);
  }

  /** Re-places the thumb when the group or any segment is resized (window, font, content). */
  private observeSizes(options: readonly AndesSegmentedOption<T>[]): void {
    if (typeof ResizeObserver === 'undefined') {
      return;
    }
    this.observer ??= new ResizeObserver(() => {
      this.measureThumb();
      this.updateScrollEdges();
    });
    this.observer.disconnect();
    this.observer.observe(this.host.nativeElement);
    for (const option of options) {
      this.observer.observe(option.element);
    }
  }

  private measureThumb(): void {
    const selected = this.checkedOption();
    if (!selected) {
      this.thumb.set(null);
      return;
    }
    const element = selected.element;
    const next: ThumbBox = {
      x: element.offsetLeft,
      y: element.offsetTop,
      width: element.offsetWidth,
      height: element.offsetHeight,
    };
    const previous = this.thumb();
    if (
      !previous ||
      previous.x !== next.x ||
      previous.y !== next.y ||
      previous.width !== next.width ||
      previous.height !== next.height
    ) {
      this.thumb.set(next);
    }
    if (!this.thumbReady() && next.width > 0 && this.readyTimer === undefined) {
      // Enable the slide only after the first placement has been painted, so the thumb never
      // glides in from 0,0. A timer rather than a frame callback: those pause in hidden tabs.
      this.readyTimer = setTimeout(() => this.thumbReady.set(true), 32);
    }
  }

  /**
   * Scrolls a scrollable track just enough to bring `option` into view, clear of the edge
   * fade. Offsets are physical and share one coordinate space with `scrollLeft` (negative in
   * right-to-left layouts), so no direction handling is needed.
   */
  private reveal(option: AndesSegmentedOption<T>, instant: boolean): void {
    if (!this.scrollable()) {
      return;
    }
    const track = this.host.nativeElement;
    const element = option.element;
    const vertical = this.vertical();
    const start = vertical ? element.offsetTop : element.offsetLeft;
    const size = vertical ? element.offsetHeight : element.offsetWidth;
    const position = vertical ? track.scrollTop : track.scrollLeft;
    const viewport = vertical ? track.clientHeight : track.clientWidth;
    let next = position;
    if (start - REVEAL_MARGIN < position) {
      next = start - REVEAL_MARGIN;
    } else if (start + size + REVEAL_MARGIN > position + viewport) {
      next = start + size + REVEAL_MARGIN - viewport;
    }
    if (next === position) {
      return;
    }
    const behavior = instant ? 'instant' : 'auto';
    if (typeof track.scrollTo === 'function') {
      track.scrollTo(
        vertical ? { top: next, behavior } : { left: next, behavior },
      );
    } else if (vertical) {
      track.scrollTop = next;
    } else {
      track.scrollLeft = next;
    }
  }

  /** Records which edges of a scrollable track have more content behind them. */
  protected updateScrollEdges(): void {
    let before = false;
    let after = false;
    if (this.scrollable()) {
      const track = this.host.nativeElement;
      const vertical = this.vertical();
      const range = vertical
        ? track.scrollHeight - track.clientHeight
        : track.scrollWidth - track.clientWidth;
      const position = vertical ? track.scrollTop : track.scrollLeft;
      // Horizontal scroll positions run from -range to 0 in right-to-left layouts.
      const min = !vertical && this.isRtl() ? -range : 0;
      before = range > 1 && position - min > 1;
      after = range > 1 && min + range - position > 1;
    }
    const previous = this.scrollEdges();
    if (previous.before !== before || previous.after !== after) {
      this.scrollEdges.set({ before, after });
    }
  }
}
