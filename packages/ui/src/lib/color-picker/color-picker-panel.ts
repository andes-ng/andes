import { NgTemplateOutlet } from '@angular/common';
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  DOCUMENT,
  effect,
  forwardRef,
  inject,
  input,
  model,
  numberAttribute,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';

import { AndesButton, type AndesButtonSize } from '../button/button';
import { AndesInput } from '../input/input';
import {
  AndesInputNumber,
  type AndesInputNumberSize,
  type AndesInputNumberValue,
} from '../input-number/input-number';
import { AndesSelect } from '../select/select';
import type { AndesSelectSize } from '../select/select-state';
import { clamp, type AndesColorFormat } from './color-math';
import { AndesColorAngle } from './color-picker-angle';
import { AndesColorArea, type AndesColorAreaChange } from './color-picker-area';
import { AndesColorGradientBar } from './color-picker-gradient';
import {
  ANDES_COLOR_PANEL_HOST,
  AndesColorPanelController,
  type AndesColorPresetGroup,
} from './color-picker-panel-controller';
import { AndesColorSlider } from './color-picker-slider';
import type {
  AndesColorChangeEvent,
  AndesColorPickerLabels,
  AndesColorPickerMode,
  AndesColorPickerSize,
  AndesColorPickerValue,
  AndesColorPreset,
} from './color-picker-types';

let nextUniqueId = 0;

/**
 * The colour picker's panel on its own, inline in the page: no trigger and no popup. It edits
 * the same value, with the same inputs, events and forms support as `<andes-color-picker>`,
 * whose popup is this very panel.
 *
 * ```html
 * <andes-color-picker-panel [(value)]="brand" [presets]="presets" aria-label="Brand color" />
 * <andes-color-picker-panel [formControl]="accent" confirm (applied)="save($event)" />
 * ```
 *
 * The panel is a `role="group"` named by `aria-label` (default: the `panel` label). Content
 * marked `slot="panel-header"` / `slot="panel-footer"` is shown above / below the controls.
 * With `confirm`, edits are staged: the value (and the form) change only when Apply is
 * pressed, and Cancel or Escape go back to it.
 *
 * Inside `<andes-color-picker>` the panel is driven by the picker: its own inputs and
 * outputs are not used there, the picker's are.
 */
@Component({
  selector: 'andes-color-picker-panel',
  imports: [
    AndesButton,
    AndesColorAngle,
    AndesColorArea,
    AndesColorGradientBar,
    AndesColorSlider,
    AndesInput,
    AndesInputNumber,
    AndesSelect,
    NgTemplateOutlet,
  ],
  templateUrl: './color-picker-panel.html',
  styleUrl: './color-picker-panel.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AndesColorPickerPanel),
      multi: true,
    },
  ],
  host: {
    'data-slot': 'color-picker-panel-body',
    '[attr.role]': 'embedded ? null : "group"',
    '[attr.aria-label]': 'embedded ? null : (ariaLabel() ?? ctl.text().panel)',
    '[attr.aria-labelledby]': 'embedded ? null : (ariaLabelledby() ?? null)',
    '[attr.data-embedded]': 'embedded ? "" : null',
    '[attr.data-size]': 'embedded ? null : size()',
    '[attr.data-mode]': 'ctl.isGradient() ? "gradient" : null',
    '[attr.data-control]': 'controlSize()',
    '[attr.data-disabled]': 'ctl.isDisabled() ? "" : null',
    '[attr.data-readonly]': 'ctl.isReadOnly() ? "" : null',
    '(keydown)': 'onHostKeydown($event)',
    '(focusout)': 'onFocusOut($event)',
  },
})
export class AndesColorPickerPanel implements ControlValueAccessor {
  private readonly document = inject(DOCUMENT);
  private readonly pickerHost = inject(ANDES_COLOR_PANEL_HOST, {
    optional: true,
  });
  /** Inside `<andes-color-picker>`: the picker owns the state and the popup the surface. */
  protected readonly embedded = this.pickerHost !== null;

  /**
   * The colour or gradient: text, an {@link AndesColor} or an {@link AndesGradientValue}
   * (see {@link AndesColorPickerValue}); `null` for none. Two-way bindable as `[(value)]` and
   * written by forms. It comes back in the kind it went in: objects give objects, text gives
   * text in the current `format`.
   */
  readonly value = model<AndesColorPickerValue | null>(null);
  /**
   * Format of the fields and the emitted text. Setting it makes the format controlled (the
   * choice is reported through `formatChange`); unset, the user chooses from `defaultFormat`.
   */
  readonly format = input<AndesColorFormat | undefined>(undefined);
  readonly defaultFormat = input<AndesColorFormat>('hex');
  /** Hides the format switch. */
  readonly disabledFormat = input(false, { transform: booleanAttribute });
  /** Edits one colour (`single`, default) or a linear gradient of colour stops. */
  readonly mode = input<AndesColorPickerMode>('single');
  /** `sm` (14rem wide), `md` (16rem, the popup's size) or `lg` (20rem). */
  readonly size = input<AndesColorPickerSize>('md');
  readonly disabled = input(false, { transform: booleanAttribute });
  /**
   * Shows the colour and lets it be copied, but nothing changes it: the controls stay
   * focusable and announce `aria-readonly`, the fields are `readonly`, clear, the eyedropper
   * and the format switch are disabled.
   */
  readonly readOnly = input(false, { transform: booleanAttribute });
  readonly allowClear = input(false, { transform: booleanAttribute });
  /** Shows the opacity slider and field. Default `true`. */
  readonly showAlpha = input(true, { transform: booleanAttribute });
  /** Takes opacity out of the value: controls hidden, every emitted colour opaque. */
  readonly disabledAlpha = input(false, { transform: booleanAttribute });
  /** Labelled groups of preset colours (and, in gradient mode, gradients). */
  readonly presets = input<readonly AndesColorPreset[]>([]);
  /** Shows the eyedropper where the browser supports one. Default `true`. */
  readonly eyeDropper = input(true, { transform: booleanAttribute });
  /** Shows the copy button next to the fields. Default `true`. */
  readonly showCopy = input(true, { transform: booleanAttribute });
  /**
   * Keeps a "Recent" group of the colours the user committed (a finished gesture, a preset),
   * most recent first and without duplicates. Default `false`.
   */
  readonly recentColors = input(false, { transform: booleanAttribute });
  /** How many recent colours are kept. Default 8. */
  readonly recentColorsMax = input(8, {
    transform: (value: unknown) => numberAttribute(value, 8),
  });
  /**
   * `localStorage` key the recent colours are saved under and restored from. Every access is
   * guarded: without storage (the server, a blocked sandbox) the list simply is not saved.
   */
  readonly recentColorsStorageKey = input<string | null>(null);
  /** The recent colours, as hex text: readable, and two-way bindable to save them yourself. */
  readonly recent = model<readonly string[]>([]);
  /**
   * Stages edits until Apply is pressed (Cancel or Escape discard them). `colorChange` still
   * reports every edit; `value`, the form and `colorChangeComplete` follow on Apply.
   */
  readonly confirm = input(false, { transform: booleanAttribute });
  /**
   * A colour (CSS text) to check the contrast against: the WCAG ratio and AA / AAA badges for
   * normal and large text are shown. `null` (default) hides the check.
   */
  readonly contrastWith = input<string | null>(null);
  /** Renders a hidden `<input name>` carrying the value text, for native form posts. */
  readonly name = input<string | null>(null);
  /** Overrides any of the panel's strings, for translation. */
  readonly labels = input<Partial<AndesColorPickerLabels>>({});
  readonly ariaLabel = input<string | undefined>(undefined, {
    alias: 'aria-label',
  });
  readonly ariaLabelledby = input<string | undefined>(undefined, {
    alias: 'aria-labelledby',
  });

  /** Every change the user makes, including each step of a drag (staged ones too). */
  readonly colorChange = output<AndesColorChangeEvent>();
  /** The end of a gesture; with `confirm`, an Apply that changed the value. */
  readonly colorChangeComplete = output<AndesColorChangeEvent>();
  /** The user removed the colour. */
  readonly clear = output<void>();
  /** The user picked another format. */
  readonly formatChange = output<AndesColorFormat>();
  /** Confirm mode: Apply was pressed; carries the value. */
  readonly applied = output<AndesColorPickerValue | null>();
  /** Confirm mode: Cancel or Escape discarded the staged edits. */
  readonly cancelled = output<void>();
  /** The copy button copied this text. */
  readonly copied = output<string>();

  private readonly disabledByForm = signal(false);
  private onChange: (value: AndesColorPickerValue | null) => void = () =>
    undefined;
  private onTouched: () => void = () => undefined;

  /** The panel's state: the picker's when inside one, otherwise its own. */
  readonly ctl: AndesColorPanelController =
    this.pickerHost?.panelController ??
    new AndesColorPanelController(
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
        disabled: computed(() => this.disabled() || this.disabledByForm()),
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
        applied: (value) => this.applied.emit(value),
        cancelled: () => this.cancelled.emit(),
        copied: (text) => this.copied.emit(text),
        valueWritten: (value) => this.onChange(value),
      },
    );

  /**
   * Size of the fields, select and buttons: the small (24px) control scale in the 14rem and
   * 16rem panels and the popup, the medium (32px) one in a 20rem inline panel.
   */
  protected readonly controlSize = computed<
    AndesSelectSize & AndesInputNumberSize
  >(() => (!this.embedded && this.size() === 'lg' ? 'md' : 'sm'));
  protected readonly buttonSize = computed<AndesButtonSize>(() =>
    this.controlSize() === 'sm' ? 'icon-sm' : 'icon',
  );

  private readonly formatSelect = viewChild(AndesSelect);

  protected readonly uid = nextUniqueId++;
  protected readonly presetsId = `andes-color-picker-presets-${this.uid}`;
  protected readonly contrastId = `andes-color-picker-contrast-${this.uid}`;

  constructor() {
    effect(() => {
      // The list opens from inside a popup (the picker's) or a dialog, whose layers are above
      // the select's own: it stacks on the topmost layer that is not a toast.
      this.formatSelect()?.overlay.configure({ layer: 'tooltip' });
    });
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

  // ----- Template handlers -----------------------------------------------------------

  protected onAreaChange(
    change: AndesColorAreaChange,
    complete: boolean,
  ): void {
    this.ctl.onArea(change.saturation, change.brightness, complete);
  }

  protected onHexEnter(event: KeyboardEvent): void {
    event.preventDefault();
    this.ctl.onHexCommit();
  }

  protected onFormatSelect(select: AndesSelect, format: unknown): void {
    this.ctl.selectFormat(String(format));
    // A controlled `format` may not follow the choice: the list shows what is really used.
    select.value.set(this.ctl.currentFormat());
  }

  protected onAngleValue(value: AndesInputNumberValue): void {
    if (typeof value === 'number') {
      this.ctl.setAngle(value);
    }
  }

  protected onStopPositionValue(value: AndesInputNumberValue): void {
    if (typeof value === 'number') {
      this.ctl.moveStop(this.ctl.activeStop().id, value);
    }
  }

  /**
   * A number field lost focus: the gesture is over, and the box shows what the colour really
   * holds (an emptied or clamped box included).
   */
  protected onNumberBlur(
    field: AndesInputNumber,
    value: AndesInputNumberValue,
  ): void {
    field.value.set(value);
    this.ctl.completeEdit();
  }

  protected contrastHeading(): string {
    return this.ctl
      .text()
      .contrast.split('{color}')
      .join(this.ctl.source.contrastWith() ?? '');
  }

  protected removeActiveStop(): void {
    this.ctl.removeStop(this.ctl.activeStop().id);
  }

  /** Escape in an inline confirm panel discards the staged edits. */
  protected onHostKeydown(event: KeyboardEvent): void {
    if (
      event.key === 'Escape' &&
      !event.defaultPrevented &&
      !this.embedded &&
      !this.ctl.nestedOverlayOpen() &&
      this.ctl.source.confirm() &&
      this.ctl.hasDraft()
    ) {
      event.preventDefault();
      this.ctl.cancelDraft();
    }
  }

  protected onFocusOut(event: FocusEvent): void {
    if (this.embedded) {
      return;
    }
    const next = event.relatedTarget as Node | null;
    if (!next || !(event.currentTarget as HTMLElement).contains(next)) {
      this.onTouched();
    }
  }

  protected onPresetKeydown(
    event: KeyboardEvent,
    group: AndesColorPresetGroup,
    entryIndex: number,
  ): void {
    if (event.altKey || event.ctrlKey || event.metaKey) {
      return;
    }
    const list = (event.currentTarget as HTMLElement).parentElement;
    const options = Array.from(
      list?.querySelectorAll<HTMLElement>('[role="option"]') ?? [],
    );
    const current = options[entryIndex];
    if (!current) {
      return;
    }

    let target: HTMLElement | undefined;
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowLeft': {
        const forward =
          (event.key === 'ArrowRight') !==
          (this.document.defaultView?.getComputedStyle(current).direction ===
            'rtl');
        target =
          options[
            clamp(entryIndex + (forward ? 1 : -1), 0, options.length - 1)
          ];
        break;
      }
      case 'ArrowDown':
      case 'ArrowUp':
        target = this.neighbourInRow(
          options,
          current,
          event.key === 'ArrowDown' ? 1 : -1,
        );
        break;
      case 'Home':
        target = options[0];
        break;
      case 'End':
        target = options[options.length - 1];
        break;
      case ' ':
      case 'Enter':
        event.preventDefault();
        current.click();
        return;
      default:
        return;
    }
    event.preventDefault();
    if (target) {
      this.ctl.rememberTabStop(group, options.indexOf(target));
      target.focus();
    }
  }

  private neighbourInRow(
    options: readonly HTMLElement[],
    current: HTMLElement,
    direction: 1 | -1,
  ): HTMLElement | undefined {
    const centre = current.offsetLeft + current.offsetWidth / 2;
    const rows = options.filter((option) =>
      direction === 1
        ? option.offsetTop > current.offsetTop
        : option.offsetTop < current.offsetTop,
    );
    if (rows.length === 0) {
      return undefined;
    }
    // The nearest row in that direction, then the swatch in it closest to this column.
    const rowTop =
      direction === 1
        ? Math.min(...rows.map((option) => option.offsetTop))
        : Math.max(...rows.map((option) => option.offsetTop));
    return rows
      .filter((option) => option.offsetTop === rowTop)
      .reduce((best, option) =>
        Math.abs(option.offsetLeft + option.offsetWidth / 2 - centre) <
        Math.abs(best.offsetLeft + best.offsetWidth / 2 - centre)
          ? option
          : best,
      );
  }
}
