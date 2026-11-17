import {
  computed,
  DestroyRef,
  DOCUMENT,
  effect,
  inject,
  InjectionToken,
  linkedSignal,
  signal,
  untracked,
  type Signal,
  type WritableSignal,
} from '@angular/core';

import { AndesColor, type AndesColorInput } from './color';
import { clamp, roundTo, type AndesColorFormat } from './color-math';
import {
  ANDES_COLOR_PICKER_DEFAULT_LABELS,
  type AndesColorChangeEvent,
  type AndesColorPickerLabels,
  type AndesColorPickerMode,
  type AndesColorPickerTextContext,
  type AndesColorPickerValue,
  type AndesColorPreset,
} from './color-picker-types';
import {
  ANDES_GRADIENT_DEFAULT_ANGLE,
  AndesGradient,
  type AndesGradientValue,
} from './gradient';

/** What an empty picker starts editing from the first time the panel is used. */
export const ANDES_COLOR_FALLBACK = AndesColor.fromHsb(217, 91, 96);

/** What an empty gradient picker starts editing from. */
const FALLBACK_GRADIENT = AndesGradient.create(ANDES_GRADIENT_DEFAULT_ANGLE, [
  { color: ANDES_COLOR_FALLBACK, position: 0 },
  { color: AndesColor.fromHsb(271, 65, 97), position: 100 },
]) as AndesGradient;

/** How long the copy button shows its confirmation, in ms. */
export const ANDES_COLOR_PICKER_COPIED_MS = 1500;

/** The channels the number fields edit. */
export type AndesColorChannel =
  'r' | 'g' | 'b' | 'h' | 's' | 'v' | 'hs' | 'l' | 'ol' | 'oc' | 'oh' | 'a';

const CHANNEL_MAX: Readonly<Record<AndesColorChannel, number>> = {
  r: 255,
  g: 255,
  b: 255,
  h: 360,
  s: 100,
  v: 100,
  hs: 100,
  l: 100,
  ol: 100,
  oc: 0.4,
  oh: 360,
  a: 100,
};

const CHANNEL_STEP: Readonly<Partial<Record<AndesColorChannel, number>>> = {
  ol: 0.1,
  oc: 0.001,
};

const FORMAT_CHANNELS: Readonly<
  Record<Exclude<AndesColorFormat, 'hex'>, readonly AndesColorChannel[]>
> = {
  rgb: ['r', 'g', 'b'],
  hsb: ['h', 's', 'v'],
  hsl: ['h', 'hs', 'l'],
  oklch: ['ol', 'oc', 'oh'],
};

export interface AndesColorPresetEntry {
  readonly color: AndesColor;
  readonly label: string;
}

export interface AndesGradientPresetEntry {
  readonly gradient: AndesGradient;
  readonly label: string;
  /** What the swatch paints. */
  readonly css: string;
}

export interface AndesColorPresetGroup {
  /** Stable key of the group's expanded state and tab stop: `preset-<index>` or `recent`. */
  readonly key: string;
  readonly label: string;
  readonly defaultOpen: boolean;
  readonly collapsible: boolean;
  readonly entries: readonly AndesColorPresetEntry[];
  readonly gradients: readonly AndesGradientPresetEntry[];
}

/** A gradient stop being edited: the id keeps it selected while it is dragged past others. */
export interface AndesGradientStopState {
  readonly id: number;
  readonly color: AndesColor;
  readonly position: number;
}

/** The result of the contrast check against `contrastWith`. */
export interface AndesColorContrast {
  /** The unrounded WCAG ratio, 1-21. */
  readonly ratio: number;
  /** The ratio truncated (never rounded up) to two decimals, as shown. */
  readonly text: string;
  /** Normal text: AA needs 4.5, AAA 7. Large text: AA needs 3, AAA 4.5. */
  readonly aa: boolean;
  readonly aaa: boolean;
  readonly aaLarge: boolean;
  readonly aaaLarge: boolean;
}

/** The inputs the controller reads: the panel's own, or the picker's for its popup. */
export interface AndesColorPanelSource {
  readonly value: WritableSignal<AndesColorPickerValue | null>;
  readonly format: Signal<AndesColorFormat | undefined>;
  readonly defaultFormat: Signal<AndesColorFormat>;
  readonly disabledFormat: Signal<boolean>;
  readonly showAlpha: Signal<boolean>;
  readonly disabledAlpha: Signal<boolean>;
  readonly presets: Signal<readonly AndesColorPreset[]>;
  readonly eyeDropper: Signal<boolean>;
  readonly mode: Signal<AndesColorPickerMode>;
  readonly disabled: Signal<boolean>;
  readonly readOnly: Signal<boolean>;
  readonly allowClear: Signal<boolean>;
  readonly labels: Signal<Partial<AndesColorPickerLabels>>;
  readonly recentColors: Signal<boolean>;
  readonly recentColorsMax: Signal<number>;
  readonly recentColorsStorageKey: Signal<string | null | undefined>;
  readonly recent: WritableSignal<readonly string[]>;
  readonly confirm: Signal<boolean>;
  readonly contrastWith: Signal<string | null | undefined>;
  readonly showCopy: Signal<boolean>;
}

/** Where the controller reports to: the outputs of the component that owns it. */
export interface AndesColorPanelSink {
  colorChange(event: AndesColorChangeEvent): void;
  colorChangeComplete(event: AndesColorChangeEvent): void;
  clear(): void;
  formatChange(format: AndesColorFormat): void;
  applied(value: AndesColorPickerValue | null): void;
  cancelled(): void;
  copied(text: string): void;
  /** The value was written by the user: the forms `onChange` hook. */
  valueWritten(value: AndesColorPickerValue | null): void;
}

/**
 * What an `<andes-color-picker>` provides to the panel inside its popup, so the panel shows
 * and edits the picker's own state (which survives the popup closing) instead of its own.
 */
export interface AndesColorPanelHost {
  readonly panelController: AndesColorPanelController;
}

export const ANDES_COLOR_PANEL_HOST = new InjectionToken<AndesColorPanelHost>(
  'ANDES_COLOR_PANEL_HOST',
);

interface EyeDropperLike {
  open(options?: { signal?: AbortSignal }): Promise<{ sRGBHex: string }>;
}

type EyeDropperConstructor = new () => EyeDropperLike;

function isObjectValue(value: unknown): boolean {
  return (
    value instanceof AndesColor ||
    (typeof value === 'object' &&
      value !== null &&
      Array.isArray((value as AndesGradientValue).stops))
  );
}

function fill(template: string, values: Record<string, string | number>) {
  return Object.entries(values).reduce(
    (text, [key, value]) => text.split(`{${key}}`).join(String(value)),
    template,
  );
}

/** Reads a value as a colour: a gradient gives its first stop. */
function readColor(value: unknown): AndesColor | null {
  return (
    AndesColor.from(value) ?? AndesGradient.from(value)?.stops[0].color ?? null
  );
}

/** Reads a value as a gradient: a colour gives a flat two-stop gradient. */
function readGradient(value: unknown): AndesGradient | null {
  if (typeof value === 'string') {
    const gradient = AndesGradient.parse(value);
    if (gradient) {
      return gradient;
    }
  } else {
    const gradient = AndesGradient.from(value);
    if (gradient) {
      return gradient;
    }
  }
  const color = AndesColor.from(value);
  return color ? AndesGradient.fromColor(color) : null;
}

/**
 * The state and behaviour of a colour panel, shared by `<andes-color-picker-panel>` (which
 * owns one) and `<andes-color-picker>` (which owns one for its popup, so the edit state, the
 * expanded groups and the recent colours outlive each opening of the popup).
 *
 * It must be created in an injection context (a field initializer).
 *
 * @internal Not part of the public API.
 */
export class AndesColorPanelController {
  private readonly document = inject(DOCUMENT);

  readonly text = computed<AndesColorPickerLabels>(() => ({
    ...ANDES_COLOR_PICKER_DEFAULT_LABELS,
    ...this.source.labels(),
  }));

  readonly isDisabled = computed(() => this.source.disabled());
  readonly isReadOnly = computed(() => this.source.readOnly());
  /** Neither disabled nor read-only: the user can change the colour. */
  readonly editable = computed(() => !this.isDisabled() && !this.isReadOnly());
  readonly isGradient = computed(() => this.source.mode() === 'gradient');

  private readonly formatState = linkedSignal(() =>
    this.source.defaultFormat(),
  );
  /** The format in use: the controlled `format`, otherwise the user's choice. */
  readonly currentFormat = computed(
    () => this.source.format() ?? this.formatState(),
  );

  /** Whether values are emitted as objects (`AndesColor` / `AndesGradient`) or as text. */
  private readonly valueKind = signal<'string' | 'object'>('string');

  /**
   * In confirm mode, the staged value (`{ value }`, which may be `null` for a staged clear);
   * `null` when nothing is staged.
   */
  private readonly draft = signal<{
    value: AndesColorPickerValue | null;
  } | null>(null);
  /** Whether confirm mode holds edits that are not applied yet. */
  readonly hasDraft = computed(() => this.draft() !== null);
  /** What the panel shows: the staged value in confirm mode, otherwise the value. */
  private readonly shownValue = computed(() => {
    const draft = this.draft();
    return draft ? draft.value : this.source.value();
  });

  /** The committed value read as a colour; `null` when empty or not a colour. */
  readonly committedColor = computed(() => {
    const color = readColor(this.source.value());
    return color && this.source.disabledAlpha() ? color.withAlpha(1) : color;
  });
  /** The committed value read as a gradient; `null` when empty or unreadable. */
  readonly committedGradient = computed(() => {
    const gradient = readGradient(this.source.value());
    return gradient && this.source.disabledAlpha()
      ? gradient.opaque()
      : gradient;
  });
  readonly isCommittedEmpty = computed(() =>
    this.isGradient()
      ? this.committedGradient() === null
      : this.committedColor() === null,
  );

  private readonly shownColor = computed(() => {
    const color = readColor(this.shownValue());
    return color && this.source.disabledAlpha() ? color.withAlpha(1) : color;
  });
  private readonly shownGradient = computed(() => {
    const gradient = readGradient(this.shownValue());
    return gradient && this.source.disabledAlpha()
      ? gradient.opaque()
      : gradient;
  });
  /** Whether the panel shows no colour (cleared or never set). */
  readonly isEmpty = computed(() =>
    this.isGradient()
      ? this.shownGradient() === null
      : this.shownColor() === null,
  );

  // ----- Working state ---------------------------------------------------------------

  /**
   * The colour being edited in single mode. Kept apart from the value because the value is
   * rounded text: dragging through black or grey would otherwise lose the hue.
   */
  readonly working = signal<AndesColor>(ANDES_COLOR_FALLBACK);

  private nextStopId = 0;
  /** The stops being edited in gradient mode, in the order they were created. */
  readonly stops = signal<readonly AndesGradientStopState[]>(
    this.toStopStates(FALLBACK_GRADIENT),
  );
  readonly angle = signal(FALLBACK_GRADIENT.angle);
  readonly activeStopId = signal(0);

  /** The stops in position order (ties keep their creation order). */
  readonly sortedStops = computed(() =>
    [...this.stops()].sort((a, b) => a.position - b.position || a.id - b.id),
  );
  readonly activeStop = computed(
    () =>
      this.stops().find((stop) => stop.id === this.activeStopId()) ??
      this.sortedStops()[0],
  );
  /** Index of the selected stop in position order. */
  readonly activeIndex = computed(() =>
    this.sortedStops().indexOf(this.activeStop()),
  );
  readonly workingGradient = computed(
    () =>
      AndesGradient.create(
        this.angle(),
        this.sortedStops().map(({ color, position }) => ({ color, position })),
      ) as AndesGradient,
  );

  /** The colour the area, sliders and fields edit: in gradient mode, the selected stop's. */
  readonly editColor = computed(() =>
    this.isGradient() ? this.activeStop().color : this.working(),
  );

  readonly editRgb = computed(() => this.editColor().toRgb());
  readonly editHsb = computed(() => this.editColor().toHsb());
  readonly editHsl = computed(() => this.editColor().toHsl());
  readonly editOklch = computed(() => this.editColor().toOklch());
  readonly editHueCss = computed(() => `hsl(${this.editColor().hue} 100% 50%)`);
  readonly editOpaque = computed(() =>
    this.editColor().withAlpha(1).toRgbString(),
  );
  readonly editCss = computed(() => this.editColor().toRgbString());
  readonly editAlphaPercent = computed(() => this.editColor().alpha * 100);
  readonly editHexDigits = computed(() =>
    this.editColor().toHex(false).slice(1).toUpperCase(),
  );
  readonly areaValueText = computed(() =>
    fill(this.text().areaValue, {
      s: Math.round(this.editColor().saturation),
      b: Math.round(this.editColor().brightness),
    }),
  );
  readonly hueValueText = computed(
    () => `${Math.round(this.editColor().hue)}°`,
  );
  readonly alphaValueText = computed(
    () => `${Math.round(this.editColor().alpha * 100)}%`,
  );

  /** CSS of the gradient bar: the working gradient drawn left to right. */
  readonly gradientBarCss = computed(() =>
    this.workingGradient().withAngle(90).toCss('rgb'),
  );
  /** CSS of the preview in gradient mode: the working gradient at its angle. */
  readonly gradientPreviewCss = computed(() =>
    this.workingGradient().toCss('rgb'),
  );

  readonly alphaVisible = computed(
    () => this.source.showAlpha() && !this.source.disabledAlpha(),
  );

  readonly hexInvalid = signal(false);
  /** What the hex field holds while it is being edited, so typing is never rewritten. */
  private readonly hexDraft = signal<string | null>(null);
  readonly hexText = computed(() => this.hexDraft() ?? this.editHexDigits());
  /** True while a list opened from a field (the format select) is up over the panel. */
  readonly nestedOverlayOpen = signal(false);

  /** Spoken after a gesture ends, through a polite live region in the panel. */
  readonly announcement = signal('');

  /** The number fields of the current format (hex has its own text field). */
  readonly channels = computed<readonly AndesColorChannel[]>(() => {
    const format = this.currentFormat();
    return format === 'hex' ? [] : FORMAT_CHANNELS[format];
  });

  readonly formats: readonly { value: AndesColorFormat; label: string }[] = [
    { value: 'hex', label: 'HEX' },
    { value: 'rgb', label: 'RGB' },
    { value: 'hsb', label: 'HSB' },
    { value: 'hsl', label: 'HSL' },
    { value: 'oklch', label: 'OKLCH' },
  ];

  // ----- Text of the committed value (the trigger, the hidden input) -------------------

  /** The committed value as text: the colour in the current format, or the CSS gradient. */
  readonly committedText = computed(() => {
    if (this.isGradient()) {
      return (
        this.committedGradient()?.toCss(
          this.currentFormat(),
          !this.source.disabledAlpha(),
        ) ?? ''
      );
    }
    return (
      this.committedColor()?.toFormat(
        this.currentFormat(),
        !this.source.disabledAlpha(),
      ) ?? ''
    );
  });

  /** Spoken summary of the committed value. */
  readonly summary = computed(() => {
    if (this.isCommittedEmpty()) {
      return this.text().noColor;
    }
    const gradient = this.isGradient() ? this.committedGradient() : null;
    return gradient ? this.gradientSummary(gradient) : this.committedText();
  });

  /** Visible text of the trigger (`showText`): hex upper-cased, a gradient summarised. */
  readonly triggerText = computed(() => {
    const value = this.summary();
    return value.startsWith('#') ? value.toUpperCase() : value;
  });

  /** Context of a `showText` template; `null` while empty. */
  readonly textContext = computed<AndesColorPickerTextContext | null>(() => {
    if (this.isGradient()) {
      const gradient = this.committedGradient();
      return gradient
        ? {
            $implicit: gradient.stops[0].color,
            value: this.committedText(),
            gradient,
          }
        : null;
    }
    const color = this.committedColor();
    return color ? { $implicit: color, value: this.committedText() } : null;
  });

  /** What the copy button copies: the shown (possibly staged) value as text. */
  readonly copyText = computed(() => {
    if (this.isEmpty()) {
      return '';
    }
    const allowAlpha = !this.source.disabledAlpha();
    return this.isGradient()
      ? this.workingGradient().toCss(this.currentFormat(), allowAlpha)
      : this.working().toFormat(this.currentFormat(), allowAlpha);
  });
  readonly copiedState = signal(false);

  // ----- Presets and recent colours ---------------------------------------------------

  readonly presetGroups = computed<readonly AndesColorPresetGroup[]>(() => {
    const gradientMode = this.isGradient();
    const groups: AndesColorPresetGroup[] = this.source
      .presets()
      .map((group, index) => ({
        key: `preset-${index}`,
        label: group.label,
        defaultOpen: group.defaultOpen !== false,
        collapsible: group.collapsible !== false,
        entries: (group.colors ?? []).flatMap(
          (entry): AndesColorPresetEntry[] => {
            const color = AndesColor.from(entry);
            return color
              ? [
                  {
                    color,
                    label: typeof entry === 'string' ? entry : color.toHex(),
                  },
                ]
              : [];
          },
        ),
        gradients: gradientMode
          ? (group.gradients ?? []).flatMap(
              (entry): AndesGradientPresetEntry[] => {
                const gradient = AndesGradient.from(entry);
                return gradient
                  ? [
                      {
                        gradient,
                        label:
                          typeof entry === 'string' ? entry : gradient.toCss(),
                        css: gradient.toCss('rgb'),
                      },
                    ]
                  : [];
              },
            )
          : [],
      }));

    const recent = this.recentEntries();
    if (recent.length > 0) {
      groups.push({
        key: 'recent',
        label: this.text().recent,
        defaultOpen: true,
        collapsible: true,
        entries: recent,
        gradients: [],
      });
    }
    return groups.filter(
      (group) => group.entries.length > 0 || group.gradients.length > 0,
    );
  });

  private readonly recentEntries = computed<readonly AndesColorPresetEntry[]>(
    () =>
      this.source.recentColors()
        ? this.source.recent().flatMap((text) => {
            const color = AndesColor.parse(text);
            return color ? [{ color, label: text }] : [];
          })
        : [],
  );

  private readonly groupOpenOverrides = signal<
    Readonly<Record<string, boolean>>
  >({});
  /** The remembered tab stop of each group (by key). */
  readonly presetTabStops = signal<Readonly<Record<string, number>>>({});

  // ----- Contrast ---------------------------------------------------------------------

  readonly contrastBackground = computed(() => {
    const given = this.source.contrastWith();
    return given ? AndesColor.parse(given) : null;
  });

  readonly contrast = computed<AndesColorContrast | null>(() => {
    const background = this.contrastBackground();
    if (!background || this.isEmpty()) {
      return null;
    }
    const ratio = this.editColor().contrastRatio(background);
    return {
      ratio,
      text: String(Math.floor(ratio * 100 + 1e-9) / 100),
      aa: ratio >= 4.5,
      aaa: ratio >= 7,
      aaLarge: ratio >= 3,
      aaaLarge: ratio >= 4.5,
    };
  });
  /** Announced (politely) when a gesture ends. */
  readonly contrastAnnouncement = signal('');

  readonly supportsEyeDropper = computed(
    () => this.source.eyeDropper() && this.eyeDropperConstructor() !== null,
  );

  private hasPendingChange = false;
  /** The last value the panel wrote, so reading it back does not reset the edit state. */
  private lastWritten: AndesColorPickerValue | null | undefined = undefined;
  private eyeDropperAbort: AbortController | null = null;
  private copiedTimer: ReturnType<typeof setTimeout> | undefined;

  constructor(
    readonly source: AndesColorPanelSource,
    private readonly sink: AndesColorPanelSink,
  ) {
    inject(DestroyRef).onDestroy(() => {
      this.eyeDropperAbort?.abort();
      clearTimeout(this.copiedTimer);
    });

    // Remembers whether the value is an object, so edits come back in the same kind.
    effect(() => {
      const value = this.source.value();
      untracked(() => {
        if (isObjectValue(value)) {
          this.valueKind.set('object');
        } else if (typeof value === 'string') {
          this.valueKind.set('string');
        }
      });
    });

    // Keeps the working colour in step with a value that changed from outside, but never
    // replaces it with a rounded reading of itself: what the panel wrote is skipped.
    effect(() => {
      const parsed = this.shownColor();
      const written = this.shownValue() === this.lastWritten;
      untracked(() => {
        if (parsed && !written && !parsed.equals(this.working())) {
          this.working.set(parsed);
        }
      });
    });

    effect(() => {
      const gradient = this.isGradient() ? this.shownGradient() : null;
      const written = this.shownValue() === this.lastWritten;
      untracked(() => {
        if (gradient && !written && !gradient.equals(this.workingGradient())) {
          this.loadGradient(gradient);
        }
      });
    });

    effect(() => {
      const key = this.source.recentColorsStorageKey();
      if (!key) {
        return;
      }
      untracked(() => {
        const stored = this.readStoredRecent(key);
        if (stored && this.source.recent().length === 0) {
          this.source.recent.set(
            stored.slice(0, Math.max(this.source.recentColorsMax(), 0)),
          );
        }
      });
    });
  }

  // ----- Editing ---------------------------------------------------------------------

  /** Applies an edit of the colour (in gradient mode, of the selected stop's colour). */
  apply(next: AndesColor, complete = false): void {
    if (!this.editable()) {
      return;
    }
    const color = this.source.disabledAlpha() ? next.withAlpha(1) : next;
    const wasEmpty = this.isEmpty();

    if (this.isGradient()) {
      const active = this.activeStop();
      const previous = active.color;
      this.stops.update((stops) =>
        stops.map((stop) =>
          stop.id === active.id ? { ...stop, color } : stop,
        ),
      );
      if (wasEmpty || !color.equals(previous)) {
        this.emitCurrent();
      }
    } else {
      const previous = this.working();
      this.working.set(color);
      if (wasEmpty || !color.equals(previous)) {
        this.emitCurrent();
      }
    }
    if (complete) {
      this.completeEdit();
    }
  }

  /** Ends a gesture: reports it once if it changed anything. */
  completeEdit(): void {
    // A gesture that changed nothing (a key at the end of its range, a click on the
    // current colour) is not a change to report.
    if (!this.hasPendingChange) {
      return;
    }
    this.hasPendingChange = false;
    const color = this.editColor();
    this.announcement.set(
      color.toFormat(this.currentFormat(), !this.source.disabledAlpha()),
    );
    this.announceContrast();
    if (this.source.confirm()) {
      // Staged: reported when applied.
      return;
    }
    this.sink.colorChangeComplete(this.eventFor());
    this.recordRecent(color);
  }

  onArea(saturation: number, brightness: number, complete: boolean): void {
    this.apply(
      this.editColor().withHsb({ s: saturation, b: brightness }),
      complete,
    );
  }

  onHue(hue: number, complete: boolean): void {
    // 360 is the same hue as 0: stopping just short keeps the handle at the far end.
    this.apply(
      this.editColor().withHsb({ h: Math.min(hue, 359.99) }),
      complete,
    );
  }

  onAlpha(percent: number, complete: boolean): void {
    this.apply(this.editColor().withAlpha(percent / 100), complete);
  }

  selectFormat(format: string): void {
    if (
      !this.editable() ||
      !this.formats.some((option) => option.value === format)
    ) {
      return;
    }
    this.formatState.set(format as AndesColorFormat);
    this.sink.formatChange(format as AndesColorFormat);
  }

  /** Removes the colour, as the panel's clear button does. Staged in confirm mode. */
  clearValue(): void {
    if (!this.editable() || this.isEmpty()) {
      return;
    }
    this.hasPendingChange = false;
    this.write(null);
    if (!this.source.confirm()) {
      this.sink.clear();
    }
    this.announcement.set(this.text().noColor);
  }

  // ----- Fields ----------------------------------------------------------------------

  channelLabel(channel: AndesColorChannel): string {
    const text = this.text();
    switch (channel) {
      case 'r':
        return text.red;
      case 'g':
        return text.green;
      case 'b':
        return text.blue;
      case 'h':
      case 'oh':
        return text.hue;
      case 's':
      case 'hs':
        return text.saturation;
      case 'v':
        return text.brightness;
      case 'l':
      case 'ol':
        return text.lightness;
      case 'oc':
        return text.chroma;
      default:
        return text.alpha;
    }
  }

  channelMax(channel: AndesColorChannel): number {
    return CHANNEL_MAX[channel];
  }

  channelStep(channel: AndesColorChannel): number {
    return CHANNEL_STEP[channel] ?? 1;
  }

  channelValue(channel: AndesColorChannel): number {
    const rgb = this.editRgb();
    const hsb = this.editHsb();
    switch (channel) {
      case 'r':
        return rgb.r;
      case 'g':
        return rgb.g;
      case 'b':
        return rgb.b;
      case 'h':
        return hsb.h;
      case 's':
        return hsb.s;
      case 'v':
        return hsb.b;
      case 'hs':
        return this.editHsl().s;
      case 'l':
        return this.editHsl().l;
      case 'ol':
        return roundTo(this.editOklch().l * 100, 1);
      case 'oc':
        return roundTo(this.editOklch().c, 3);
      case 'oh':
        return Math.round(this.editOklch().h) % 360;
      default:
        return Math.round(this.editColor().alpha * 100);
    }
  }

  /** Fraction digits a number field keeps. */
  channelPrecision(channel: AndesColorChannel): number {
    const step = this.channelStep(channel);
    return step >= 1 ? 0 : String(step).split('.')[1].length;
  }

  /** A number field reports a value (each keystroke that reads as a number, a step). */
  setChannel(channel: AndesColorChannel, value: number | string | null): void {
    const parsed = value === null || value === '' ? NaN : Number(value);
    if (Number.isFinite(parsed)) {
      this.apply(this.withChannel(channel, parsed));
    }
  }

  /** What the hex field is told while it is edited: typing is applied once it reads as hex. */
  onHexInput(text: string): void {
    this.hexDraft.set(text);
    const parsed = this.parseHexField(text);
    this.hexInvalid.set(parsed === null && text.trim() !== '');
    if (parsed) {
      this.apply(parsed);
    }
  }

  /** Enter or blur in the hex field: the typed colour is final, the field shows the colour. */
  onHexCommit(): void {
    const parsed = this.parseHexField(this.hexText());
    if (parsed) {
      this.apply(parsed, true);
    }
    this.hexInvalid.set(false);
    this.hexDraft.set(null);
  }

  // ----- Gradient --------------------------------------------------------------------

  selectStop(id: number): void {
    if (this.stops().some((stop) => stop.id === id)) {
      this.activeStopId.set(id);
    }
  }

  /** Moves a stop to `position` (percent, rounded to a whole percent). */
  moveStop(id: number, position: number, complete = false): void {
    if (!this.editable()) {
      return;
    }
    const next = clamp(Math.round(position), 0, 100);
    const stop = this.stops().find((entry) => entry.id === id);
    if (stop && stop.position !== next) {
      this.stops.update((stops) =>
        stops.map((entry) =>
          entry.id === id ? { ...entry, position: next } : entry,
        ),
      );
      this.emitCurrent();
    }
    if (complete) {
      this.completeEdit();
    }
  }

  /**
   * Adds a stop at `position`, coloured as the gradient is there; without a position, in the
   * middle of the widest gap between stops. The new stop is selected.
   */
  addStop(position?: number): void {
    if (!this.editable()) {
      return;
    }
    const at = clamp(Math.round(position ?? this.widestGapMiddle()), 0, 100);
    const id = this.nextStopId++;
    const color = this.workingGradient().colorAt(at);
    this.stops.update((stops) => [...stops, { id, color, position: at }]);
    this.activeStopId.set(id);
    this.emitCurrent();
    this.completeEdit();
  }

  /** Removes a stop while more than two remain; its neighbour is selected. */
  removeStop(id: number): void {
    if (!this.editable() || this.stops().length <= 2) {
      return;
    }
    const sorted = this.sortedStops();
    const index = sorted.findIndex((stop) => stop.id === id);
    if (index < 0) {
      return;
    }
    const neighbour = sorted[index > 0 ? index - 1 : 1];
    this.stops.update((stops) => stops.filter((stop) => stop.id !== id));
    if (
      this.activeStopId() === id ||
      !this.stops().some((s) => s.id === this.activeStopId())
    ) {
      this.activeStopId.set(neighbour.id);
    }
    this.emitCurrent();
    this.completeEdit();
  }

  /** Sets the gradient angle (degrees, 0-360, whole degrees). */
  setAngle(angle: number, complete = false): void {
    if (!this.editable() || !Number.isFinite(angle)) {
      return;
    }
    const next = clamp(Math.round(angle), 0, 360);
    if (next !== this.angle() || this.isEmpty()) {
      this.angle.set(next);
      this.emitCurrent();
    }
    if (complete) {
      this.completeEdit();
    }
  }

  /** The spoken value of a stop ("Stop 1 of 3, #ff0000 at 20%"). */
  stopValueText(stop: AndesGradientStopState): string {
    const sorted = this.sortedStops();
    return fill(this.text().gradientStop, {
      index: sorted.indexOf(stop) + 1,
      count: sorted.length,
      color: stop.color.toFormat(
        this.currentFormat() === 'hsb' ? 'hex' : this.currentFormat(),
        !this.source.disabledAlpha(),
      ),
      position: roundTo(stop.position, 2),
    });
  }

  gradientSummary(gradient: AndesGradient): string {
    return fill(this.text().gradientSummary, {
      angle: roundTo(gradient.angle, 2),
      count: gradient.stops.length,
    });
  }

  // ----- Presets ---------------------------------------------------------------------

  selectPreset(entry: AndesColorPresetEntry): void {
    if (!this.editable()) {
      return;
    }
    this.apply(entry.color, true);
    // Picking the current colour changes nothing, but still moves it up the recent list.
    if (!this.source.confirm()) {
      this.recordRecent(entry.color);
    }
  }

  selectGradientPreset(entry: AndesGradientPresetEntry): void {
    if (!this.editable()) {
      return;
    }
    const gradient = this.source.disabledAlpha()
      ? entry.gradient.opaque()
      : entry.gradient;
    const changed = this.isEmpty() || !gradient.equals(this.workingGradient());
    this.loadGradient(gradient);
    if (changed) {
      this.emitCurrent();
    }
    this.completeEdit();
  }

  isPresetSelected(entry: AndesColorPresetEntry): boolean {
    return !this.isEmpty() && entry.color.equals(this.editColor());
  }

  isGradientPresetSelected(entry: AndesGradientPresetEntry): boolean {
    return !this.isEmpty() && entry.gradient.equals(this.workingGradient());
  }

  isGroupOpen(group: AndesColorPresetGroup): boolean {
    return (
      !group.collapsible ||
      (this.groupOpenOverrides()[group.key] ?? group.defaultOpen)
    );
  }

  toggleGroup(group: AndesColorPresetGroup): void {
    if (!group.collapsible) {
      return;
    }
    this.groupOpenOverrides.update((overrides) => ({
      ...overrides,
      [group.key]: !this.isGroupOpen(group),
    }));
  }

  /** The swatch that takes the group's single tab stop: the selected one, else the last used. */
  presetTabStop(group: AndesColorPresetGroup): number {
    const selected = group.gradients.length
      ? group.gradients.findIndex((entry) =>
          this.isGradientPresetSelected(entry),
        )
      : -1;
    const selectedColor = group.entries.findIndex((entry) =>
      this.isPresetSelected(entry),
    );
    if (selected >= 0) {
      return selected;
    }
    if (selectedColor >= 0) {
      return group.gradients.length + selectedColor;
    }
    return clamp(
      this.presetTabStops()[group.key] ?? 0,
      0,
      Math.max(group.gradients.length + group.entries.length - 1, 0),
    );
  }

  rememberTabStop(group: AndesColorPresetGroup, index: number): void {
    this.presetTabStops.update((stops) => ({ ...stops, [group.key]: index }));
  }

  // ----- Confirm mode ----------------------------------------------------------------

  /** Commits the staged value (confirm mode). */
  applyDraft(): void {
    const draft = this.draft();
    this.hasPendingChange = false;
    if (draft) {
      this.draft.set(null);
      this.source.value.set(draft.value);
      this.sink.valueWritten(draft.value);
      if (draft.value === null) {
        this.sink.clear();
      } else {
        this.sink.colorChangeComplete(this.eventFor());
        this.recordRecent(this.editColor());
      }
    }
    this.sink.applied(this.source.value());
  }

  /** Throws the staged value away (confirm mode); the panel shows the value again. */
  cancelDraft(): void {
    this.hasPendingChange = false;
    this.draft.set(null);
    this.hexDraft.set(null);
    this.hexInvalid.set(false);
    this.sink.cancelled();
  }

  // ----- Copy ------------------------------------------------------------------------

  /**
   * Copies the shown value as text in the current format: through the asynchronous
   * clipboard API, falling back to a hidden text area and `execCommand('copy')` where that
   * is missing or refused. Nothing happens on the server.
   */
  async copy(): Promise<void> {
    const text = this.copyText();
    if (!text || this.isDisabled()) {
      return;
    }
    if (!(await this.writeClipboard(text))) {
      return;
    }
    this.copiedState.set(true);
    this.sink.copied(text);
    clearTimeout(this.copiedTimer);
    this.copiedTimer = setTimeout(
      () => this.copiedState.set(false),
      ANDES_COLOR_PICKER_COPIED_MS,
    );
  }

  // ----- Eyedropper ------------------------------------------------------------------

  async pickWithEyeDropper(): Promise<void> {
    const Ctor = this.eyeDropperConstructor();
    if (!Ctor || !this.editable()) {
      return;
    }
    this.eyeDropperAbort?.abort();
    const abort = new AbortController();
    this.eyeDropperAbort = abort;
    try {
      const result = await new Ctor().open({ signal: abort.signal });
      const picked = AndesColor.parse(result.sRGBHex);
      if (picked && !abort.signal.aborted) {
        this.apply(picked.withAlpha(this.editColor().alpha), true);
      }
    } catch {
      // Cancelled with Escape, or aborted because the panel closed.
    } finally {
      if (this.eyeDropperAbort === abort) {
        this.eyeDropperAbort = null;
      }
    }
  }

  /** Stops an eyedropper pick in progress (the popup closed). */
  abortEyeDropper(): void {
    this.eyeDropperAbort?.abort();
  }

  // ----- Internals -------------------------------------------------------------------

  /** Writes a value: to the stage in confirm mode, otherwise to the value and the form. */
  private write(value: AndesColorPickerValue | null): void {
    this.lastWritten = value;
    if (this.source.confirm()) {
      this.draft.set({ value });
      return;
    }
    this.source.value.set(value);
    this.sink.valueWritten(value);
  }

  /** Writes the working colour or gradient as the value and reports the change. */
  private emitCurrent(): void {
    const allowAlpha = !this.source.disabledAlpha();
    const object = this.valueKind() === 'object';
    const out: AndesColorPickerValue = this.isGradient()
      ? object
        ? this.workingGradient()
        : this.workingGradient().toCss(this.currentFormat(), allowAlpha)
      : object
        ? this.working()
        : this.working().toFormat(this.currentFormat(), allowAlpha);
    this.write(out);
    this.sink.colorChange(this.eventFor());
    this.hasPendingChange = true;
  }

  private eventFor(): AndesColorChangeEvent {
    const allowAlpha = !this.source.disabledAlpha();
    const object = this.valueKind() === 'object';
    const color = this.editColor();
    const value: AndesColorInput = object
      ? color
      : color.toFormat(this.currentFormat(), allowAlpha);
    if (!this.isGradient()) {
      return { color, value };
    }
    const gradient = this.workingGradient();
    return {
      color,
      value,
      gradient: {
        value: object
          ? gradient
          : gradient.toCss(this.currentFormat(), allowAlpha),
        gradient,
        stop: this.activeIndex(),
      },
    };
  }

  private announceContrast(): void {
    const contrast = this.contrast();
    if (!contrast) {
      this.contrastAnnouncement.set('');
      return;
    }
    const text = this.text();
    const levels = (aa: boolean, aaa: boolean) =>
      aaa ? 'AAA' : aa ? 'AA' : text.contrastNone;
    this.contrastAnnouncement.set(
      fill(text.contrastSummary, {
        ratio: contrast.text,
        normal: levels(contrast.aa, contrast.aaa),
        large: levels(contrast.aaLarge, contrast.aaaLarge),
      }),
    );
  }

  private loadGradient(gradient: AndesGradient): void {
    const activeIndex = Math.max(this.activeIndex(), 0);
    // The same number of stops keeps their ids, so a selection (or a drag) carries over.
    const ids = this.sortedStops().map((stop) => stop.id);
    const states =
      ids.length === gradient.stops.length
        ? gradient.stops.map((stop, index) => ({
            id: ids[index],
            color: stop.color,
            position: stop.position,
          }))
        : this.toStopStates(gradient);
    this.stops.set(states);
    this.angle.set(gradient.angle);
    this.activeStopId.set(states[Math.min(activeIndex, states.length - 1)].id);
  }

  private toStopStates(gradient: AndesGradient): AndesGradientStopState[] {
    return gradient.stops.map((stop) => ({
      id: this.nextStopId++,
      color: stop.color,
      position: stop.position,
    }));
  }

  private widestGapMiddle(): number {
    const positions = this.sortedStops().map((stop) => stop.position);
    let best = { start: 0, size: -1 };
    const edges = [0, ...positions, 100];
    for (let index = 1; index < edges.length; index++) {
      const size = edges[index] - edges[index - 1];
      if (size > best.size) {
        best = { start: edges[index - 1], size };
      }
    }
    return best.start + best.size / 2;
  }

  private withChannel(channel: AndesColorChannel, input: number): AndesColor {
    const value = clamp(input, 0, CHANNEL_MAX[channel]);
    const current = this.editColor();
    const rgb = this.editRgb();
    switch (channel) {
      case 'r':
        return AndesColor.fromRgb(
          value,
          rgb.g,
          rgb.b,
          current.alpha,
          current.hue,
        );
      case 'g':
        return AndesColor.fromRgb(
          rgb.r,
          value,
          rgb.b,
          current.alpha,
          current.hue,
        );
      case 'b':
        return AndesColor.fromRgb(
          rgb.r,
          rgb.g,
          value,
          current.alpha,
          current.hue,
        );
      case 'h':
        return current.withHsb({ h: value });
      case 's':
        return current.withHsb({ s: value });
      case 'v':
        return current.withHsb({ b: value });
      case 'hs':
        return current.withHsl({ s: value });
      case 'l':
        return current.withHsl({ l: value });
      case 'ol':
      case 'oc':
      case 'oh': {
        const oklch = current.toOklch();
        const next = AndesColor.fromOklch(
          channel === 'ol' ? value / 100 : oklch.l,
          channel === 'oc' ? value : oklch.c,
          channel === 'oh' ? value : oklch.h,
          current.alpha,
        );
        // A grey or black has no hue of its own: keep the one being edited.
        return next.saturation === 0 || next.brightness === 0
          ? next.withHsb({ h: current.hue })
          : next;
      }
      default:
        return current.withAlpha(value / 100);
    }
  }

  /** Reads the hex field; short forms keep the current opacity, 4 / 8 digits carry theirs. */
  private parseHexField(text: string): AndesColor | null {
    const digits = text.trim().replace(/^#/, '');
    if (![3, 4, 6, 8].includes(digits.length)) {
      return null;
    }
    const parsed = AndesColor.parse(`#${digits}`);
    if (!parsed) {
      return null;
    }
    const current = this.editColor();
    const { r, g, b } = parsed.toRgb();
    const hasAlpha = digits.length === 4 || digits.length === 8;
    return AndesColor.fromRgb(
      r,
      g,
      b,
      hasAlpha ? parsed.alpha : current.alpha,
      current.hue,
    );
  }

  private recordRecent(color: AndesColor): void {
    if (!this.source.recentColors()) {
      return;
    }
    const text = color.toHex(!this.source.disabledAlpha());
    const max = Math.max(this.source.recentColorsMax(), 0);
    const list = [
      text,
      ...this.source.recent().filter((entry) => entry.toLowerCase() !== text),
    ].slice(0, max);
    this.source.recent.set(list);
    const key = this.source.recentColorsStorageKey();
    if (key) {
      this.writeStoredRecent(key, list);
    }
  }

  private storage(): Storage | null {
    try {
      return this.document.defaultView?.localStorage ?? null;
    } catch {
      // Storage access can throw (blocked cookies, sandboxed frames).
      return null;
    }
  }

  private readStoredRecent(key: string): string[] | null {
    try {
      const raw = this.storage()?.getItem(key);
      if (!raw) {
        return null;
      }
      const parsed: unknown = JSON.parse(raw);
      return Array.isArray(parsed)
        ? parsed.filter(
            (entry): entry is string =>
              typeof entry === 'string' && AndesColor.parse(entry) !== null,
          )
        : null;
    } catch {
      return null;
    }
  }

  private writeStoredRecent(key: string, list: readonly string[]): void {
    try {
      this.storage()?.setItem(key, JSON.stringify(list));
    } catch {
      // Full or blocked storage: the list still lives in `recent`.
    }
  }

  private async writeClipboard(text: string): Promise<boolean> {
    const view = this.document.defaultView;
    if (!view) {
      return false;
    }
    try {
      if (view.navigator.clipboard?.writeText) {
        await view.navigator.clipboard.writeText(text);
        return true;
      }
    } catch {
      // Refused (no permission, not focused): try the old way below.
    }
    return this.copyWithTextArea(text);
  }

  private copyWithTextArea(text: string): boolean {
    const doc = this.document;
    const active = doc.activeElement as HTMLElement | null;
    const area = doc.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.insetBlockStart = '0';
    area.style.opacity = '0';
    doc.body.appendChild(area);
    try {
      area.select();
      return typeof doc.execCommand === 'function'
        ? doc.execCommand('copy')
        : false;
    } catch {
      return false;
    } finally {
      area.remove();
      active?.focus?.({ preventScroll: true });
    }
  }

  private eyeDropperConstructor(): EyeDropperConstructor | null {
    const view = this.document.defaultView as
      (Window & { EyeDropper?: EyeDropperConstructor }) | null;
    return view?.EyeDropper ?? null;
  }
}
