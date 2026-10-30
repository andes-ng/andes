import {
  andesOverlayPreset,
  AndesOverlayContentPrimitive,
  AndesOverlayPrimitive,
  AndesOverlayTriggerPrimitive,
  provideAndesOverlay,
  type AndesOverlayAlign,
  type AndesOverlaySide,
} from '@andes-ng/primitives';
import { NgTemplateOutlet } from '@angular/common';
import {
  afterNextRender,
  afterRenderEffect,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  DestroyRef,
  DOCUMENT,
  effect,
  ElementRef,
  forwardRef,
  inject,
  Injector,
  input,
  model,
  numberAttribute,
  output,
  signal,
  TemplateRef,
  untracked,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';

import { clamp, type AndesColorFormat } from './color-math';
import { AndesColorPickerPanel } from './color-picker-panel';
import {
  ANDES_COLOR_PANEL_HOST,
  AndesColorPanelController,
  type AndesColorPanelHost,
} from './color-picker-panel-controller';
import { AndesColorPickerTrigger } from './color-picker-trigger';
import type {
  AndesColorChangeEvent,
  AndesColorPickerLabels,
  AndesColorPickerMode,
  AndesColorPickerPlacement,
  AndesColorPickerShowText,
  AndesColorPickerSize,
  AndesColorPickerStatus,
  AndesColorPickerTriggerAction,
  AndesColorPickerValue,
  AndesColorPreset,
} from './color-picker-types';

let nextUniqueId = 0;

const PLACEMENTS: Readonly<
  Record<
    AndesColorPickerPlacement,
    { side: AndesOverlaySide; align: AndesOverlayAlign }
  >
> = {
  bottomLeft: { side: 'bottom', align: 'start' },
  bottomRight: { side: 'bottom', align: 'end' },
  topLeft: { side: 'top', align: 'start' },
  topRight: { side: 'top', align: 'end' },
};

/** Delay, in ms, between the pointer resting on a `trigger="hover"` trigger and the panel opening. */
export const ANDES_COLOR_PICKER_HOVER_OPEN_DELAY = 150;

/**
 * Delay, in ms, between the pointer leaving the trigger (or the panel) and a hover-opened
 * panel closing: long enough to cross the gap between them.
 */
export const ANDES_COLOR_PICKER_HOVER_CLOSE_DELAY = 100;

/** Gap between trigger and panel, in px; with `arrow`, room for the arrow as well. */
const SIDE_OFFSET = 4;
const ARROW_SIDE_OFFSET = 9;
/** The arrow keeps this far (px) from the panel's corners... */
const ARROW_EDGE_INSET = 16;
/** ...and never points closer than this (px) to the trigger's own edges. */
const ARROW_ANCHOR_INSET = 8;

/** A touch is followed by compatibility mouse events; this long after it they are ignored. */
const TOUCH_WINDOW = 800;

/**
 * A colour picker: a swatch button that opens a panel with a saturation/brightness area, a
 * hue slider, an optional opacity slider, number and hex fields in five formats, labelled
 * groups of preset colours and, where the browser has one, an eyedropper. With
 * `mode="gradient"` it edits a linear gradient instead: a bar of draggable colour stops and
 * an angle dial above the same controls.
 *
 * The value is text (`'#1677ff'`, `'rgb(22, 119, 255)'`, `'hsl(215 100% 54%)'`,
 * `'linear-gradient(90deg, red, blue)'`...), an {@link AndesColor} or an
 * {@link AndesGradientValue}, and comes back the same way it went in: an object in gives
 * objects out (`AndesColor`, `AndesGradient`), text in gives text in the current `format`
 * out. With no value yet, text is emitted.
 *
 * ```html
 * <andes-color-picker [(value)]="brand" showText allowClear />
 * <andes-color-picker [formControl]="accent" [presets]="presets" aria-label="Accent" />
 * <andes-color-picker mode="gradient" [(value)]="background" arrow trigger="hover" />
 * ```
 *
 * `colorChange` fires for every change the user makes, including each step of a drag;
 * `colorChangeComplete` fires when a gesture ends (pointer release, a key press, a field
 * committed, a preset picked). Both carry the {@link AndesColor} and the value. With
 * `confirm`, edits are staged until Apply.
 *
 * The panel is {@link AndesColorPickerPanel}: everything it does inline it does here, and
 * content marked `slot="panel-header"` / `slot="panel-footer"` is passed on to it.
 *
 * ## Keyboard
 *
 * The area, the hue slider and the opacity slider are `role="slider"` elements: arrow keys
 * step by 1 (10 with Shift), `PageUp`/`PageDown` by 10, `Home`/`End` jump to the ends. In
 * the area, Left/Right change saturation and Up/Down brightness. The preset colours are a
 * listbox with one tab stop per group, navigated with the arrow keys.
 */
@Component({
  selector: 'andes-color-picker',
  imports: [
    AndesColorPickerPanel,
    AndesOverlayContentPrimitive,
    AndesOverlayTriggerPrimitive,
    NgTemplateOutlet,
  ],
  templateUrl: './color-picker.html',
  styleUrl: './color-picker.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    provideAndesOverlay(),
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AndesColorPicker),
      multi: true,
    },
    {
      provide: ANDES_COLOR_PANEL_HOST,
      useExisting: forwardRef(() => AndesColorPicker),
    },
  ],
  host: {
    // Forwarded to the real button instead: a screen reader never sees this wrapper, and a
    // static `id` left here would be a duplicate that a `<label for>` resolves to first.
    '[attr.id]': 'null',
    '[attr.aria-label]': 'null',
    '[attr.aria-labelledby]': 'null',
    '[attr.aria-describedby]': 'null',
    '[attr.aria-invalid]': 'null',
    '[attr.data-state]': 'isOpen() ? "open" : "closed"',
    '[attr.data-disabled]': 'isDisabled() ? "" : null',
  },
})
export class AndesColorPicker
  implements ControlValueAccessor, AndesColorPanelHost
{
  private readonly overlay = inject(AndesOverlayPrimitive);
  private readonly document = inject(DOCUMENT);
  private readonly injector = inject(Injector);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  private readonly triggerButton =
    viewChild<ElementRef<HTMLButtonElement>>('triggerButton');
  private readonly panelTemplate =
    viewChild.required<TemplateRef<unknown>>('panel');

  /** Projected content marks a custom trigger look. */
  protected readonly customTrigger = contentChild(AndesColorPickerTrigger);
  protected readonly hasCustomTrigger = computed(
    () => this.customTrigger() !== undefined,
  );

  /**
   * The colour (or, in `mode="gradient"`, the gradient): text, an {@link AndesColor} or an
   * {@link AndesGradientValue}; `null` for none. Two-way bindable as `[(value)]`, and written
   * by `ngModel` / `formControl` too, so a binding next to a form control sees `valueChange`
   * for values the form writes as well.
   */
  readonly value = model<AndesColorPickerValue | null>(null);

  /**
   * Format of the fields, the trigger text and the emitted text. Setting it makes the format
   * controlled: the picker reports the user's choice through `formatChange` and shows the
   * format given here. Leave it unset to let the user choose, starting from `defaultFormat`.
   */
  readonly format = input<AndesColorFormat | undefined>(undefined);
  /** The format the picker starts in when `format` is not set. */
  readonly defaultFormat = input<AndesColorFormat>('hex');
  /** Hides the format switch, keeping the format as it is. */
  readonly disabledFormat = input(false, { transform: booleanAttribute });

  /**
   * What the picker edits: one colour (`single`, default) or a linear gradient
   * (`gradient`), whose stops the area, sliders and fields then edit one at a time.
   */
  readonly mode = input<AndesColorPickerMode>('single');
  readonly size = input<AndesColorPickerSize>('md');
  readonly status = input<AndesColorPickerStatus | undefined>(undefined);
  readonly disabled = input(false, { transform: booleanAttribute });
  /**
   * Distinct from `disabled`: the panel still opens, shows the colour and lets it be copied,
   * but nothing changes it (no edits, clear, eyedropper or format change). The trigger's
   * name says so ("..., read-only").
   */
  readonly readOnly = input(false, { transform: booleanAttribute });
  /** Adds a button to the panel that removes the colour. */
  readonly allowClear = input(false, { transform: booleanAttribute });
  /**
   * Shows the colour as text next to the swatch: `true` for the value in the current format
   * (a short summary for a gradient), or a template given the colour (`let-color
   * let-value="value" let-gradient="gradient"`).
   */
  readonly showText = input<AndesColorPickerShowText>(false);
  /** Shows the opacity slider and field. Default `true`. */
  readonly showAlpha = input(true, { transform: booleanAttribute });
  /**
   * Takes opacity out of the value altogether: the controls are hidden and every emitted
   * colour is opaque. (`showAlpha="false"` only hides the controls, keeping any opacity the
   * value already has.)
   */
  readonly disabledAlpha = input(false, { transform: booleanAttribute });
  /** Labelled groups of preset colours (and, in gradient mode, gradients) under the picker. */
  readonly presets = input<readonly AndesColorPreset[]>([]);
  /** Shows the eyedropper where the browser supports one. Default `true`. */
  readonly eyeDropper = input(true, { transform: booleanAttribute });
  /** Shows a button next to the fields that copies the value text. Default `true`. */
  readonly showCopy = input(true, { transform: booleanAttribute });
  /** Keeps a "Recent" group of the colours the user committed. Default `false`. */
  readonly recentColors = input(false, { transform: booleanAttribute });
  /** How many recent colours are kept. Default 8. */
  readonly recentColorsMax = input(8, {
    transform: (value: unknown) => numberAttribute(value, 8),
  });
  /** `localStorage` key the recent colours are saved under (guarded, SSR-safe). */
  readonly recentColorsStorageKey = input<string | null>(null);
  /** The recent colours as hex text: readable, and two-way bindable to persist them yourself. */
  readonly recent = model<readonly string[]>([]);
  /**
   * Stages edits until Apply: `value`, the form and `colorChangeComplete` follow Apply, which
   * also closes the panel; Cancel, Escape or any other close throws the edits away.
   */
  readonly confirm = input(false, { transform: booleanAttribute });
  /** A colour to check contrast against (WCAG ratio, AA / AAA badges). `null` hides it. */
  readonly contrastWith = input<string | null>(null);
  /**
   * Renders `<input type="hidden" name>` inside the picker carrying the value text (the
   * colour in the current format, or the CSS gradient), so a native form post includes it.
   */
  readonly name = input<string | null>(null);
  /** `click` (default) or `hover`: hovering the trigger opens the panel too. */
  readonly trigger = input<AndesColorPickerTriggerAction>('click');
  /** Draws an arrow on the panel pointing at the trigger. Default `false`. */
  readonly arrow = input(false, { transform: booleanAttribute });
  readonly placement = input<AndesColorPickerPlacement>('bottomLeft');
  /** Extra classes on the overlay pane - the hook for scoping custom properties. */
  readonly panelClass = input<string | readonly string[] | null>(null);
  /** Text shown with `showText` when there is no colour. */
  readonly placeholder = input('');
  /** Overrides any of the picker's strings, for translation. */
  readonly labels = input<Partial<AndesColorPickerLabels>>({});

  /** `id` of the trigger button, so a `<label for>` names it and focuses it when clicked. */
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
   * Whether the panel is open. Two-way bindable as `[(open)]`; `openChange` fires on every
   * transition, whatever caused it. A one-way `[open]` binding acts as a request.
   */
  readonly openState = model(false, { alias: 'open' });

  /**
   * Every change the user makes, including each step of a drag. Not called `change`: that
   * is a DOM event name, which a component output may not shadow.
   */
  readonly colorChange = output<AndesColorChangeEvent>();
  /** The end of a gesture: pointer released, key pressed, field committed, preset picked. */
  readonly colorChangeComplete = output<AndesColorChangeEvent>();
  /** The user removed the colour with the clear button. */
  readonly clear = output<void>();
  /** The user picked another format in the panel. */
  readonly formatChange = output<AndesColorFormat>();
  /** Confirm mode: Apply was pressed (the panel then closes); carries the value. */
  readonly applied = output<AndesColorPickerValue | null>();
  /** Confirm mode: the staged edits were thrown away (Cancel, Escape, another close). */
  readonly cancelled = output<void>();
  /** The copy button copied this text. */
  readonly copied = output<string>();

  protected readonly uid = nextUniqueId++;
  protected readonly valueId = `andes-color-picker-value-${this.uid}`;

  private readonly disabledByForm = signal(false);
  protected readonly isDisabled = computed(
    () => this.disabled() || this.disabledByForm(),
  );

  readonly isOpen = this.overlay.isOpen;

  private onChange: (value: AndesColorPickerValue | null) => void = () =>
    undefined;
  private onTouched: () => void = () => undefined;

  /** @internal The panel state, shared with the panel inside the popup. */
  readonly panelController = new AndesColorPanelController(
    {
      value: this.value,
      format: this.format,
      defaultFormat: this.defaultFormat,
      disabledFormat: this.disabledFormat,
      showAlpha: this.showAlpha,
      disabledAlpha: this.disabledAlpha,
      presets: this.presets,
      eyeDropper: this.eyeDropper,
      mode: this.mode,
      disabled: this.isDisabled,
      readOnly: this.readOnly,
      allowClear: this.allowClear,
      labels: this.labels,
      recentColors: this.recentColors,
      recentColorsMax: this.recentColorsMax,
      recentColorsStorageKey: this.recentColorsStorageKey,
      recent: this.recent,
      confirm: this.confirm,
      contrastWith: this.contrastWith,
      showCopy: this.showCopy,
    },
    {
      colorChange: (event) => this.colorChange.emit(event),
      colorChangeComplete: (event) => this.colorChangeComplete.emit(event),
      clear: () => this.clear.emit(),
      formatChange: (format) => this.formatChange.emit(format),
      applied: (value) => {
        this.applied.emit(value);
        this.close();
      },
      cancelled: () => {
        this.cancelled.emit();
        this.close();
      },
      copied: (text) => this.copied.emit(text),
      valueWritten: (value) => this.onChange(value),
    },
  );
  protected readonly ctl = this.panelController;

  protected readonly isEmpty = this.ctl.isCommittedEmpty;
  protected readonly summary = this.ctl.summary;

  protected readonly triggerText = computed(() =>
    this.isEmpty() ? this.placeholder() : this.ctl.triggerText(),
  );

  protected readonly textTemplate = computed(() => {
    const show = this.showText();
    return typeof show === 'object' && show !== null ? show : null;
  });
  protected readonly textVisible = computed(() => this.showText() !== false);

  protected readonly triggerLabel = computed(() => {
    if (this.ariaLabelledby()) {
      return null;
    }
    const name = `${this.ariaLabel() ?? this.ctl.text().trigger}, ${this.summary()}`;
    return this.readOnly() ? `${name}, ${this.ctl.text().readOnly}` : name;
  });
  protected readonly triggerLabelledby = computed(() => {
    const given = this.ariaLabelledby();
    return given ? `${given} ${this.valueId}` : null;
  });
  /** What the visually hidden value says: with `aria-labelledby`, it is the spoken value. */
  protected readonly spokenValue = computed(() =>
    this.readOnly()
      ? `${this.summary()}, ${this.ctl.text().readOnly}`
      : this.summary(),
  );
  protected readonly invalid = computed(
    () => this.ariaInvalid() || this.status() === 'error',
  );

  /** Single mode: the swatch's background colour. */
  protected readonly swatchColor = computed(() =>
    this.ctl.isGradient()
      ? null
      : (this.ctl.committedColor()?.toRgbString() ?? null),
  );
  /** Gradient mode: the swatch's background image. */
  protected readonly swatchGradient = computed(() =>
    this.ctl.isGradient()
      ? (this.ctl.committedGradient()?.toCss('rgb') ?? null)
      : null,
  );

  /** The side the panel actually opened on, after any flip; measured once it is placed. */
  protected readonly resolvedSide = signal<AndesOverlaySide>('bottom');
  /**
   * Text direction of the picker, copied onto the popup: the popup is rendered at the end of
   * the document, outside any `dir="rtl"` container the picker sits in.
   */
  protected readonly direction = signal<'ltr' | 'rtl' | null>(null);
  /** Arrow position in px from the panel's left edge; `null` until measured. */
  protected readonly arrowOffset = signal<number | null>(null);

  // Hover state: what currently holds a hover-opened panel open.
  private openTimer: ReturnType<typeof setTimeout> | undefined;
  private closeTimer: ReturnType<typeof setTimeout> | undefined;
  private triggerHover = false;
  private panelHover = false;
  private focusInPanel = false;
  /** Opened by a click, a tap or the keyboard, or used: only those close it, not leaving. */
  private pinned = false;
  private lastTouchAt = -Infinity;
  private escapePressed = false;
  private frame: number | null = null;

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.clearTimers();
      this.stopTracking();
    });

    this.overlay.configure({
      ...andesOverlayPreset('popover'),
      // `popover` is the closest preset: anchored to the trigger, click-opened, dismissed by
      // Escape and outside-click, no backdrop and no scroll lock. Focus moves into the panel
      // but is not trapped (the page stays usable); it goes to the area, which `open()`
      // focuses itself rather than leaving it to a search for the first tabbable element.
      autoFocus: 'none',
      positioning: {
        kind: 'anchored',
        side: 'bottom',
        align: 'start',
        sideOffset: SIDE_OFFSET,
        // Above or below the trigger only: beside it, the panel no longer reads as its own.
        crossSideFallback: false,
      },
    });

    effect(() => {
      const { side, align } = PLACEMENTS[this.placement()];
      this.overlay.configure({
        positioning: {
          kind: 'anchored',
          side,
          align,
          sideOffset: this.arrow() ? ARROW_SIDE_OFFSET : SIDE_OFFSET,
          crossSideFallback: false,
        },
      });
    });

    effect(() => this.overlay.configure({ panelClass: this.panelClass() }));

    effect(() => {
      if (this.isDisabled() && this.overlay.isOpen()) {
        this.overlay.close('imperative');
      }
    });

    // `[open]` is honoured after render: the panel template and the trigger (the
    // positioning anchor) only exist once the view has rendered.
    afterRenderEffect(() => {
      const requested = booleanAttribute(this.openState());
      untracked(() => {
        if (requested && !this.overlay.isOpen()) {
          this.open();
        } else if (!requested && this.overlay.isOpen()) {
          this.close();
        }
      });
    });

    this.overlay.opened.pipe(takeUntilDestroyed()).subscribe(() => {
      this.openState.set(true);
      this.startTracking();
    });

    this.overlay.keydownEvents.pipe(takeUntilDestroyed()).subscribe((event) => {
      if (event.key === 'Escape') {
        // Escape always hands focus back to the trigger, hover-opened or not.
        this.escapePressed = true;
        this.overlay.configure({ restoreFocus: true });
      }
    });

    this.overlay.closed.pipe(takeUntilDestroyed()).subscribe(() => {
      this.ctl.abortEyeDropper();
      this.stopTracking();
      this.clearTimers();
      this.triggerHover = false;
      this.panelHover = false;
      this.focusInPanel = false;
      this.pinned = false;
      this.escapePressed = false;
      this.arrowOffset.set(null);
      this.openState.set(false);
      this.ctl.announcement.set('');
      if (this.confirm() && this.ctl.hasDraft()) {
        this.ctl.cancelDraft();
      }
      this.onTouched();
    });
  }

  // ----- Public API ------------------------------------------------------------------

  /** Opens the panel and moves focus into it. */
  open(): void {
    this.openPanel(true);
  }

  /** Closes the panel. */
  close(): void {
    this.clearTimers();
    this.overlay.close('imperative');
  }

  /** Opens the panel if closed, closes it if open. */
  toggle(): void {
    if (this.overlay.isOpen()) {
      this.close();
    } else {
      this.open();
    }
  }

  /** Moves focus to the trigger. */
  focus(options?: FocusOptions): void {
    this.triggerButton()?.nativeElement.focus(options);
  }

  /** Removes focus from the trigger. */
  blur(): void {
    this.triggerButton()?.nativeElement.blur();
  }

  /** Removes the colour, as the panel's clear button does. */
  clearValue(): void {
    this.ctl.clearValue();
  }

  // ----- ControlValueAccessor --------------------------------------------------------

  writeValue(value: AndesColorPickerValue | null | undefined): void {
    this.value.set(value ?? null);
  }

  registerOnChange(fn: (value: AndesColorPickerValue | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabledByForm.set(isDisabled);
  }

  // ----- Trigger ---------------------------------------------------------------------

  protected onTriggerClick(): void {
    if (this.trigger() !== 'hover') {
      this.toggle();
      return;
    }
    // Hover mode: a click (or a tap, or Enter/Space) pins a hover-opened panel open and
    // moves focus into it; a second one closes it.
    if (!this.overlay.isOpen()) {
      this.pinned = true;
      this.openPanel(true);
    } else if (!this.pinned) {
      this.pinned = true;
      this.clearTimers();
      this.overlay.configure({ restoreFocus: true });
      this.focusArea();
    } else {
      this.close();
    }
  }

  protected onTriggerKeydown(event: KeyboardEvent): void {
    if (
      this.trigger() === 'hover' &&
      event.key === 'ArrowDown' &&
      !event.altKey &&
      !event.ctrlKey &&
      !event.metaKey &&
      !this.isDisabled()
    ) {
      event.preventDefault();
      if (this.overlay.isOpen()) {
        this.pinned = true;
        this.clearTimers();
        this.overlay.configure({ restoreFocus: true });
        this.focusArea();
      } else {
        this.pinned = true;
        this.openPanel(true);
      }
    }
  }

  protected onTriggerPointerDown(event: PointerEvent): void {
    if (event.pointerType === 'touch') {
      this.lastTouchAt = Date.now();
    }
  }

  protected onTriggerPointerEnter(event: PointerEvent): void {
    if (!this.hoverPointer(event)) {
      return;
    }
    this.triggerHover = true;
    this.requestHoverOpen();
  }

  protected onTriggerPointerLeave(event: PointerEvent): void {
    if (!this.hoverPointer(event)) {
      return;
    }
    this.triggerHover = false;
    this.requestHoverClose();
  }

  protected onTriggerBlur(): void {
    if (!this.overlay.isOpen()) {
      this.onTouched();
    }
  }

  // ----- Panel surface ---------------------------------------------------------------

  protected onPanelPointerEnter(event: PointerEvent): void {
    if (!this.hoverPointer(event)) {
      return;
    }
    this.panelHover = true;
    this.cancelClose();
  }

  protected onPanelPointerLeave(event: PointerEvent): void {
    if (!this.hoverPointer(event)) {
      return;
    }
    this.panelHover = false;
    this.requestHoverClose();
  }

  /** Using the panel (a press anywhere in it) pins it: leaving no longer closes it. */
  protected onPanelPointerDown(): void {
    if (this.trigger() === 'hover' && !this.pinned) {
      this.pinned = true;
      this.clearTimers();
    }
  }

  protected onPanelFocusIn(): void {
    this.focusInPanel = true;
    this.cancelClose();
  }

  protected onPanelFocusOut(event: FocusEvent): void {
    const next = event.relatedTarget as Node | null;
    if (next && (event.currentTarget as HTMLElement).contains(next)) {
      return;
    }
    this.focusInPanel = false;
    this.requestHoverClose();
  }

  // ----- Internals -------------------------------------------------------------------

  private openPanel(withFocus: boolean): void {
    if (this.isDisabled() || this.overlay.isOpen()) {
      return;
    }
    this.clearTimers();
    this.resolvedSide.set(PLACEMENTS[this.placement()].side);
    const direction = this.document.defaultView?.getComputedStyle(
      this.host.nativeElement,
    ).direction;
    this.direction.set(
      direction === 'rtl' ? 'rtl' : direction === 'ltr' ? 'ltr' : null,
    );
    // A hover-opened panel is passive: it leaves focus where it is, and does not pull it
    // back to the trigger when the pointer moves away.
    this.overlay.configure({ restoreFocus: withFocus });
    this.overlay.open(this.panelTemplate(), {
      restoreFocusTo: this.triggerButton()?.nativeElement,
    });
    afterNextRender(
      {
        read: () => {
          if (withFocus) {
            this.focusArea();
          }
          this.measure();
        },
      },
      { injector: this.injector },
    );
  }

  private focusArea(): void {
    this.overlay
      .panelElement()
      ?.querySelector<HTMLElement>('andes-color-area')
      ?.focus({ preventScroll: true });
  }

  /** A mouse or pen in hover mode; touch has no hover (its tap is a click). */
  private hoverPointer(event: PointerEvent): boolean {
    return (
      this.trigger() === 'hover' &&
      event.pointerType !== 'touch' &&
      Date.now() - this.lastTouchAt > TOUCH_WINDOW
    );
  }

  private holding(): boolean {
    return (
      this.triggerHover || this.panelHover || this.focusInPanel || this.pinned
    );
  }

  private requestHoverOpen(): void {
    this.cancelClose();
    if (this.overlay.isOpen() || this.openTimer !== undefined) {
      return;
    }
    this.openTimer = setTimeout(() => {
      this.openTimer = undefined;
      if (this.triggerHover && !this.isDisabled()) {
        this.openPanel(false);
      }
    }, ANDES_COLOR_PICKER_HOVER_OPEN_DELAY);
  }

  private requestHoverClose(): void {
    if (this.trigger() !== 'hover') {
      return;
    }
    if (!this.triggerHover) {
      this.cancelOpen();
    }
    if (!this.overlay.isOpen() || this.holding()) {
      return;
    }
    this.cancelClose();
    this.closeTimer = setTimeout(() => {
      this.closeTimer = undefined;
      if (!this.holding() && this.overlay.isOpen()) {
        this.overlay.configure({ restoreFocus: this.escapePressed });
        this.overlay.close('imperative');
      }
    }, ANDES_COLOR_PICKER_HOVER_CLOSE_DELAY);
  }

  private cancelOpen(): void {
    clearTimeout(this.openTimer);
    this.openTimer = undefined;
  }

  private cancelClose(): void {
    clearTimeout(this.closeTimer);
    this.closeTimer = undefined;
  }

  private clearTimers(): void {
    this.cancelOpen();
    this.cancelClose();
  }

  // ----- Side and arrow --------------------------------------------------------------

  private startTracking(): void {
    const view = this.document.defaultView;
    view?.addEventListener('scroll', this.scheduleMeasure, {
      capture: true,
      passive: true,
    });
    view?.addEventListener('resize', this.scheduleMeasure, { passive: true });
  }

  private stopTracking(): void {
    const view = this.document.defaultView;
    view?.removeEventListener('scroll', this.scheduleMeasure, {
      capture: true,
    });
    view?.removeEventListener('resize', this.scheduleMeasure);
    if (this.frame !== null) {
      view?.cancelAnimationFrame(this.frame);
      this.frame = null;
    }
  }

  private readonly scheduleMeasure = (): void => {
    const view = this.document.defaultView;
    if (!view || this.frame !== null) {
      return;
    }
    this.frame = view.requestAnimationFrame(() => {
      this.frame = null;
      this.measure();
    });
  };

  /**
   * Reads which side the panel ended up on (the overlay flips it when there is no room) and
   * where the arrow has to sit to point at the trigger. A no-op without layout (jsdom).
   *
   * The pane is measured rather than the surface: the surface's entrance animation scales
   * it, and `getBoundingClientRect()` includes transforms.
   */
  private measure(): void {
    const anchor = this.triggerButton()?.nativeElement;
    const pane = this.overlay.panelElement();
    const surface = this.overlay.contentElement();
    if (!anchor || !pane || !surface || !this.overlay.isOpen()) {
      return;
    }
    const panel = pane.getBoundingClientRect();
    if (!panel.width && !panel.height) {
      return;
    }
    const trigger = anchor.getBoundingClientRect();
    const side: AndesOverlaySide =
      panel.top >= trigger.top + trigger.height / 2 ? 'bottom' : 'top';
    this.resolvedSide.set(side);
    if (!this.arrow()) {
      return;
    }
    // Aligned with one of the trigger's edges: 16px in from that edge (the centre of a
    // default swatch); otherwise (shifted to fit the window) at the trigger's centre.
    let target: number;
    if (Math.abs(panel.left - trigger.left) < 1) {
      target = panel.left + ARROW_EDGE_INSET;
    } else if (Math.abs(panel.right - trigger.right) < 1) {
      target = panel.right - ARROW_EDGE_INSET;
    } else {
      target = trigger.left + trigger.width / 2;
    }
    const inset = Math.min(ARROW_ANCHOR_INSET, trigger.width / 2);
    target = clamp(target, trigger.left + inset, trigger.right - inset);
    target = clamp(
      target,
      panel.left + ARROW_EDGE_INSET,
      panel.right - ARROW_EDGE_INSET,
    );
    // Physical, measured from the left edge in every direction: it is a measured point.
    this.arrowOffset.set(target - panel.left - surface.clientLeft);
  }
}
