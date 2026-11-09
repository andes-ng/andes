import { DOCUMENT, NgTemplateOutlet } from '@angular/common';
import {
  afterNextRender,
  afterRenderEffect,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  numberAttribute,
  output,
  signal,
  TemplateRef,
  untracked,
  viewChild,
} from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideCircleCheckBig,
  lucideClockAlert,
  lucideLoaderCircle,
  lucideQrCode,
  lucideRotateCw,
  lucideTriangleAlert,
} from '@ng-icons/lucide';
import clsx from 'clsx';

import { AndesButton } from '../button/button';
import {
  makeQrSegmentList,
  QrCapacityError,
  type QrErrorLevel,
  type QrMatrix,
  type QrSegment,
} from './qr-encoder';
import {
  andesQrCodeClassString,
  andesQrCodeStyleObject,
  type AndesQrCodeClassNames,
  type AndesQrCodeClassNamesInput,
  type AndesQrCodeError,
  type AndesQrCodePart,
  type AndesQrCodePartStyle,
  type AndesQrCodeSegment,
  type AndesQrCodeStyleInfo,
  type AndesQrCodeStyles,
  type AndesQrCodeStylesInput,
} from './qr-code-semantic';
import {
  drawQrToCanvas,
  encodeQrForLayout,
  QR_MAX_ICON_COVERAGE,
  QrColors,
  QrFinderShape,
  QrIconSpec,
  QrLayout,
  QrModuleShape,
  qrSvgMarkup,
} from './qr-render';

export type AndesQrCodeType = 'svg' | 'canvas';
export type AndesQrCodeStatus = 'active' | 'loading' | 'expired' | 'scanned';

/** What an `iconTemplate` receives: the logo box in CSS pixels at the declared `size`. */
export interface AndesQrCodeIconContext {
  readonly $implicit: number;
  readonly width: number;
  readonly height: number;
}

/** `{ width, height }` in pixels, for a logo that is not square. */
export interface AndesQrCodeIconSize {
  readonly width: number;
  readonly height: number;
}

/** What a `statusRender` template receives. */
export interface AndesQrCodeStatusContext {
  readonly $implicit: AndesQrCodeStatus;
  readonly status: AndesQrCodeStatus;
  /** Emits the component's `refresh` output. */
  readonly refresh: () => void;
}

/** Texts the component writes itself; override any of them to localise. */
export interface AndesQrCodeLabels {
  /** Accessible name prefix, and the whole name when there is no value. */
  readonly qrCode: string;
  readonly loading: string;
  readonly expired: string;
  readonly refresh: string;
  readonly scanned: string;
  /** Shown in place of the code while there is no value. */
  readonly empty: string;
  /** Shown in place of the code when the value cannot be encoded. */
  readonly overflow: string;
}

export interface AndesQrCodeExportOptions {
  /** Default `png`. */
  readonly format?: 'png' | 'svg';
  /** Pixel-density multiplier of the exported image. Default 2. Ignored for `svg`. */
  readonly scale?: number;
  /** Any CSS colour; defaults to the colours currently displayed. */
  readonly color?: string;
  readonly bgColor?: string;
  /** A logo image for the export, when the on-screen logo is an `iconTemplate`. */
  readonly icon?: string;
}

const DEFAULT_LABELS: AndesQrCodeLabels = {
  qrCode: 'QR code',
  loading: 'Loading',
  expired: 'QR code expired',
  refresh: 'Refresh',
  scanned: 'Scanned',
  empty: 'No value',
  overflow: 'Too long to encode',
};

/*
 * Dark modules on a light ground whatever the page theme: scanners read that pairing best,
 * and most do not read light-on-dark at all. Follow the theme on purpose with
 * `color="var(--andes-color-foreground)"` and `bgColor="var(--andes-color-background)"`.
 */
const DEFAULT_COLOR = '#0f172a';
const DEFAULT_BG_COLOR = '#ffffff';

/** The accessible name carries at most this much of the encoded value. */
const NAME_VALUE_LIMIT = 100;

/**
 * Resolves any CSS colour (including `var()` and `color-mix()`) to the browser's computed
 * `rgb(...)` string, by letting a throw-away element inherit from `host`.
 */
function resolveColor(doc: Document, host: Element, value: string): string {
  const probe = doc.createElement('span');
  probe.style.color = value;
  probe.style.display = 'none';
  host.appendChild(probe);
  const computed = doc.defaultView?.getComputedStyle(probe).color ?? '';
  probe.remove();
  return computed || value;
}

function loadImage(doc: Document, src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = doc.createElement('img');
    image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = () =>
      reject(new Error('The QR code icon could not be loaded.'));
    image.src = src;
  });
}

type Encoded = { matrix: QrMatrix; layout: QrLayout };

type Outcome =
  | { readonly encoded: Encoded; readonly error: null }
  | { readonly encoded: null; readonly error: AndesQrCodeError }
  | null;

const numberOrUndefined = (value: unknown): number | undefined =>
  value === null || value === undefined || value === ''
    ? undefined
    : Number(value);

const PARTS: readonly AndesQrCodePart[] = [
  'root',
  'symbol',
  'canvas',
  'svg',
  'icon',
  'mask',
  'status',
  'refresh',
];

/**
 * A QR code drawn from `value` with no runtime dependency: the encoder lives in
 * `qr-encoder.ts`. Renders crisp, path-based inline SVG or a canvas, in dark modules on a light
 * ground by default (what scanners read best, on any page theme), with square, rounded or dot
 * modules and styled corner patterns. It can carry a centre logo (an image or any template,
 * raising the error correction level as the logo needs), shows an overlay for the `loading`,
 * `expired` and `scanned` states of a login or payment flow, and exports PNG or SVG.
 *
 * - `value` is a string or a list of segments (each encoded in its most compact mode, or in a
 *   mode you name). A value that cannot be encoded does not throw: the `error` output emits and
 *   a placeholder takes the code's place, as it does while there is no value.
 * - `classNames` and `styles` reach each part (`root`, `symbol`, `canvas`, `svg`, `icon`, `mask`,
 *   `status`, `refresh`) as objects or as functions of `{ props }`.
 * - Methods: `toSvg()`, `toDataUrl()`, `toBlob()`, `download()`, `copy()`, `canCopy()` and
 *   `redraw()`. An exported image holds the logo only when it is an `icon` image, or when
 *   `icon` is passed in the export options.
 *
 * Accessibility: the symbol is `role="img"` with a name built from `aria-label` (or the
 * default `QR code: <value>`) and the current status; the refresh control is a real button
 * outside the image, and status and error changes are announced through a polite live region.
 */
@Component({
  selector: 'andes-qr-code',
  exportAs: 'andesQrCode',
  viewProviders: [
    provideIcons({
      lucideCircleCheckBig,
      lucideClockAlert,
      lucideLoaderCircle,
      lucideQrCode,
      lucideRotateCw,
      lucideTriangleAlert,
    }),
  ],
  imports: [AndesButton, NgIcon, NgTemplateOutlet],
  templateUrl: './qr-code.html',
  styleUrl: './qr-code.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-slot]': '"qr-code"',
    '[attr.data-state]': 'status()',
    '[attr.data-type]': 'type()',
    '[attr.data-shape]': 'shape()',
    '[attr.data-fluid]': 'fluid() ? "" : null',
    '[attr.data-bordered]': 'bordered() ? "" : null',
    '[attr.data-transparent]': 'transparent() ? "" : null',
    '[attr.data-empty]': 'empty() ? "" : null',
    '[attr.data-error]': 'failure() ? failure()?.reason : null',
    '[attr.aria-busy]': 'status() === "loading" ? "true" : null',
    '[attr.data-icon-oversized]': 'iconOversized() ? "" : null',
    // The name lives on the inner image so the refresh button is not swallowed by it.
    '[attr.aria-label]': 'null',
    '[style.--_andes-qr-code-size]': 'pixelSize() + "px"',
    '[style.--andes-qr-code-color]': 'color() ?? null',
    '[style.--andes-qr-code-bg]': 'bgColor() ?? null',
    '[style.--andes-qr-code-finder]': 'finderColor() ?? null',
    '[style.--andes-qr-code-quiet]': 'quietZoneColor() ?? null',
  },
})
export class AndesQrCode {
  private readonly document = inject(DOCUMENT);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly canvas = viewChild<ElementRef<HTMLCanvasElement>>('canvas');

  /**
   * The text to encode (a URL, a payment payload...), or a list of segments: each string takes
   * the most compact mode it can, `{ mode, text }` forces one. Empty draws a placeholder.
   */
  readonly value = input<string | readonly AndesQrCodeSegment[]>('');
  readonly type = input<AndesQrCodeType>('svg');
  /** Side of the graphic in CSS pixels, quiet zone included. */
  readonly size = input(160, { transform: numberAttribute });
  /** Fill the width of the container, up to `size`; the drawing scales without blurring. */
  readonly fluid = input(false, { transform: booleanAttribute });
  /** Module colour: any CSS colour, `var(--token)` included. Default: a dark slate. */
  readonly color = input<string | undefined>(undefined);
  /** Colour of the frame, and of the quiet zone too unless `quietZoneColor` is set. */
  readonly bgColor = input<string | undefined>(undefined);
  /** Colour of the three corner patterns. Default: the module colour. */
  readonly finderColor = input<string | undefined>(undefined);
  /** Colour behind the symbol, quiet zone included. Default: `bgColor`. */
  readonly quietZoneColor = input<string | undefined>(undefined);
  /** Shape of the data modules. */
  readonly shape = input<QrModuleShape>('square');
  /** Shape of the three corner patterns. */
  readonly finderShape = input<QrFinderShape>('square');
  /** Draws a border and padding around the symbol. */
  readonly bordered = input(true, { transform: booleanAttribute });
  /** Requested error correction level; a logo or `boostLevel` may raise it. */
  readonly errorLevel = input<QrErrorLevel>('M');
  /** Raise the level when it does not make the symbol bigger. */
  readonly boostLevel = input(true, { transform: booleanAttribute });
  /** Empty modules around the symbol, in modules. The specification asks for 4. */
  readonly quietZone = input(2, { transform: numberAttribute });
  /** Force one of the masks 0-7; left out, the one with the lowest penalty is chosen. */
  readonly mask = input<number | undefined, unknown>(undefined, {
    transform: numberOrUndefined,
  });
  /** Smallest version (1-40) to use; a larger one makes a denser, finer symbol. */
  readonly minVersion = input<number | undefined, unknown>(undefined, {
    transform: numberOrUndefined,
  });
  /** URL or data URI of a logo drawn over the centre. */
  readonly icon = input<string | undefined>(undefined);
  /** Any template drawn over the centre, e.g. a lucide `ng-icon`; sized like `iconSize`. */
  readonly iconTemplate = input<
    TemplateRef<AndesQrCodeIconContext> | undefined
  >(undefined);
  /** Logo size in pixels (a number, or `{ width, height }`). Default: 20 % of `size`. */
  readonly iconSize = input<number | AndesQrCodeIconSize | undefined>(
    undefined,
  );
  /** Leave a clear margin of one module around the logo. */
  readonly iconBordered = input(true, { transform: booleanAttribute });
  /** Clear the modules under the logo (default). Off, the logo sits over them. */
  readonly excavate = input(true, { transform: booleanAttribute });
  readonly status = input<AndesQrCodeStatus>('active');
  /** Replaces the default content of the status overlay. */
  readonly statusRender = input<
    TemplateRef<AndesQrCodeStatusContext> | undefined
  >(undefined);
  readonly labels = input<Partial<AndesQrCodeLabels> | undefined>(undefined);
  readonly ariaLabel = input<string | undefined>(undefined, {
    alias: 'aria-label',
  });
  /** Extra classes per part, as an object or a function of `{ props }`. */
  readonly classNames = input<AndesQrCodeClassNamesInput | undefined>(
    undefined,
  );
  /** Inline styles per part, as an object or a function of `{ props }`. */
  readonly styles = input<AndesQrCodeStylesInput | undefined>(undefined);

  /** Emits when the user activates the refresh control of the `expired` overlay. */
  readonly refresh = output<void>();
  /** Emits when `value` is set but cannot be turned into a code (too long, or invalid). */
  readonly encodeError = output<AndesQrCodeError>();

  private readonly themeVersion = signal(0);
  /** Bumped per canvas paint so a slow logo load cannot overwrite a newer paint. */
  private paintToken = 0;

  protected readonly resolvedLabels = computed<AndesQrCodeLabels>(() => ({
    ...DEFAULT_LABELS,
    ...this.labels(),
  }));

  protected readonly pixelSize = computed(() => Math.max(1, this.size()));

  /** `true` when the background is the keyword `transparent`: the overlay then uses the theme. */
  protected readonly transparent = computed(
    () => (this.bgColor() ?? '').trim().toLowerCase() === 'transparent',
  );

  private readonly iconSpec = computed<QrIconSpec | null>(() => {
    const src = this.icon();
    if (!src && !this.iconTemplate()) {
      return null;
    }
    const requested = this.iconSize();
    const fallback = Math.max(1, Math.round(this.pixelSize() * 0.2));
    const width =
      typeof requested === 'object' ? requested.width : (requested ?? fallback);
    const height =
      typeof requested === 'object'
        ? requested.height
        : (requested ?? fallback);
    return {
      src: src ?? '',
      width,
      height,
      bordered: this.iconBordered(),
      excavate: this.excavate(),
    };
  });

  /** The value as the text it spells, whichever form it was given in. */
  private readonly valueText = computed(() => {
    const value = this.value();
    return typeof value === 'string'
      ? value
      : value
          .map((part) => (typeof part === 'string' ? part : part.text))
          .join('');
  });

  private readonly segments = computed<QrSegment[] | string | null>(() => {
    const value = this.value();
    if (typeof value === 'string') {
      return value === '' ? null : value;
    }
    try {
      const list = makeQrSegmentList(value);
      return list.length ? list : null;
    } catch {
      return null;
    }
  });

  private readonly outcome = computed<Outcome>(() => {
    const value = this.value();
    const source = this.segments();
    if (source === null) {
      if (typeof value === 'string' || value.length === 0) {
        return null;
      }
      // A list whose segments could not be built (a text outside its named mode).
      return {
        encoded: null,
        error: {
          reason: 'invalid',
          message: 'A segment holds characters its mode cannot encode.',
        },
      };
    }
    try {
      return {
        encoded: encodeQrForLayout(source, {
          errorLevel: this.errorLevel(),
          boostErrorLevel: this.boostLevel(),
          mask: this.mask(),
          minVersion: this.minVersion(),
          size: this.pixelSize(),
          quietZone: this.quietZone(),
          icon: this.iconSpec(),
          shape: this.shape(),
          finderShape: this.finderShape(),
          separateFinders: this.finderColor() !== undefined,
        }),
        error: null,
      };
    } catch (cause) {
      const message =
        cause instanceof Error ? cause.message : 'The value cannot be encoded.';
      return {
        encoded: null,
        error: {
          reason: cause instanceof QrCapacityError ? 'overflow' : 'invalid',
          message,
        },
      };
    }
  });

  private readonly encoded = computed<Encoded | null>(
    () => this.outcome()?.encoded ?? null,
  );

  /** The encoded matrix, or `null` when there is no value or it cannot be encoded. */
  readonly matrix = computed(() => this.encoded()?.matrix ?? null);

  /** The error correction level actually used (after logo and boost adjustments). */
  readonly effectiveErrorLevel = computed(
    () => this.encoded()?.matrix.errorLevel ?? null,
  );

  /** The QR version (1-40) of the code drawn, or `null` without one. */
  readonly version = computed(() => this.encoded()?.matrix.version ?? null);

  /** `true` when `value` is set but too long to encode (more than version 40 holds). */
  readonly overflow = computed(
    () => this.outcome()?.error?.reason === 'overflow',
  );

  /** Why `value` could not be encoded, or `null`. */
  readonly failure = computed<AndesQrCodeError | null>(
    () => this.outcome()?.error ?? null,
  );

  /** `true` while there is no value to draw. */
  readonly empty = computed(() => this.outcome() === null);

  protected readonly layout = computed(() => this.encoded()?.layout ?? null);

  /** The drawn logo box as percentages of the symbol, for the `iconTemplate` overlay. */
  protected readonly iconBox = computed(() => {
    const view = this.layout();
    if (!view?.icon || !this.iconTemplate()) {
      return null;
    }
    const total = view.modules;
    return {
      left: (view.icon.x / total) * 100,
      top: (view.icon.y / total) * 100,
      width: (view.icon.width / total) * 100,
      height: (view.icon.height / total) * 100,
      fraction: view.icon.height / total,
    };
  });

  protected readonly iconContext = computed<AndesQrCodeIconContext>(() => {
    const spec = this.iconSpec();
    return {
      $implicit: spec?.height ?? 0,
      width: spec?.width ?? 0,
      height: spec?.height ?? 0,
    };
  });

  /**
   * `true` when the logo covers more of the symbol than even level H can recover. Such a
   * code may not scan; shrink `iconSize` or drop `iconBordered`.
   */
  readonly iconOversized = computed(
    () => (this.layout()?.coverage ?? 0) > QR_MAX_ICON_COVERAGE,
  );

  private readonly styleInfo = computed<AndesQrCodeStyleInfo>(() => ({
    props: {
      type: this.type(),
      status: this.status(),
      size: this.pixelSize(),
      bordered: this.bordered(),
      shape: this.shape(),
      finderShape: this.finderShape(),
      errorLevel: this.effectiveErrorLevel(),
      hasIcon: this.iconSpec() !== null,
      hasCode: this.encoded() !== null,
    },
  }));

  /** @internal Extra classes of every part. */
  protected readonly partClasses = computed<Record<AndesQrCodePart, string>>(
    () => {
      const input = this.classNames();
      const names: AndesQrCodeClassNames =
        typeof input === 'function' ? input(this.styleInfo()) : (input ?? {});
      return Object.fromEntries(
        PARTS.map((part) => [part, andesQrCodeClassString(names[part])]),
      ) as Record<AndesQrCodePart, string>;
    },
  );

  /** @internal Inline styles of every part. */
  protected readonly partStyles = computed<
    Record<AndesQrCodePart, Record<string, string> | null>
  >(() => {
    const input = this.styles();
    const styles: AndesQrCodeStyles =
      typeof input === 'function' ? input(this.styleInfo()) : (input ?? {});
    return Object.fromEntries(
      PARTS.map((part) => [
        part,
        andesQrCodeStyleObject(styles[part] as AndesQrCodePartStyle),
      ]),
    ) as Record<AndesQrCodePart, Record<string, string> | null>;
  });

  protected readonly classes = computed(() =>
    clsx(
      'andes-qr-code',
      this.bordered() ? 'andes-qr-code--bordered' : 'andes-qr-code--borderless',
      this.partClasses().root,
    ),
  );

  private readonly statusText = computed(() => {
    const labels = this.resolvedLabels();
    switch (this.status()) {
      case 'loading':
        return labels.loading;
      case 'expired':
        return labels.expired;
      case 'scanned':
        return labels.scanned;
      default:
        return '';
    }
  });

  /** The text shown in place of the code, or `''` while a code is drawn. */
  protected readonly placeholderText = computed(() => {
    const labels = this.resolvedLabels();
    if (this.failure()) {
      return labels.overflow;
    }
    return this.empty() ? labels.empty : '';
  });

  protected readonly accessibleName = computed(() => {
    const labels = this.resolvedLabels();
    const value = this.valueText();
    const shown =
      value.length > NAME_VALUE_LIMIT
        ? `${value.slice(0, NAME_VALUE_LIMIT)}...`
        : value;
    const base =
      this.ariaLabel() ??
      (shown ? `${labels.qrCode}: ${shown}` : labels.qrCode);
    const status = this.statusText() || this.placeholderText();
    return status ? `${base} (${status})` : base;
  });

  /** Text for the polite live region; empty while the code is active. */
  protected readonly liveMessage = computed(() =>
    this.failure() ? this.resolvedLabels().overflow : this.statusText(),
  );

  protected readonly statusContext = computed<AndesQrCodeStatusContext>(() => ({
    $implicit: this.status(),
    status: this.status(),
    refresh: () => this.refresh.emit(),
  }));

  constructor() {
    afterRenderEffect({
      write: () => {
        this.themeVersion();
        this.color();
        this.bgColor();
        this.finderColor();
        this.quietZoneColor();
        const canvas = this.canvas()?.nativeElement;
        const encoded = this.encoded();
        if (this.type() !== 'canvas' || !canvas || !encoded) {
          return;
        }
        void this.paintCanvas(canvas, encoded);
      },
    });

    effect(() => {
      const failure = this.failure();
      if (failure) {
        untracked(() => this.encodeError.emit(failure));
      }
    });

    // The canvas holds resolved colours, so it has to repaint when the theme flips; the SVG
    // follows the custom properties by itself.
    afterNextRender(() => {
      const view = this.document.defaultView;
      const root = this.document.documentElement;
      if (!view || typeof view.MutationObserver !== 'function') {
        return;
      }
      const observer = new view.MutationObserver(() =>
        this.themeVersion.update((version) => version + 1),
      );
      observer.observe(root, {
        attributes: true,
        attributeFilter: ['class', 'style', 'data-andes-theme'],
      });
      this.destroyRef.onDestroy(() => observer.disconnect());
    });
  }

  protected onRefresh(): void {
    this.refresh.emit();
  }

  /** Repaints the canvas, e.g. after a theme change this component cannot observe. */
  redraw(): void {
    this.themeVersion.update((version) => version + 1);
  }

  /** A self-contained SVG document (concrete colours) of the current code. */
  toSvg(
    options: Pick<AndesQrCodeExportOptions, 'color' | 'bgColor' | 'icon'> = {},
  ): string {
    const encoded = this.requireEncoded();
    const colors = this.exportColors(options);
    const icon = this.exportIcon(options);
    return qrSvgMarkup(encoded.layout, {
      size: this.pixelSize(),
      quietZone: this.quietZone(),
      icon,
      title: this.accessibleName(),
      ...colors,
    });
  }

  /** The code as a `data:` URL (PNG by default). */
  async toDataUrl(options: AndesQrCodeExportOptions = {}): Promise<string> {
    if (options.format === 'svg') {
      return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(this.toSvg(options))}`;
    }
    return (await this.renderCanvas(options)).toDataURL('image/png');
  }

  /** The code as an image `Blob` (PNG by default). */
  async toBlob(options: AndesQrCodeExportOptions = {}): Promise<Blob> {
    if (options.format === 'svg') {
      return new Blob([this.toSvg(options)], { type: 'image/svg+xml' });
    }
    const canvas = await this.renderCanvas(options);
    return new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (blob) =>
          blob
            ? resolve(blob)
            : reject(new Error('The PNG could not be created.')),
        'image/png',
      ),
    );
  }

  /** Saves the code as `<filename>.png` (or `.svg`) through the browser's download flow. */
  async download(
    filename = 'qr-code',
    options: AndesQrCodeExportOptions = {},
  ): Promise<void> {
    const blob = await this.toBlob(options);
    const view = this.document.defaultView;
    const url = view?.URL.createObjectURL(blob);
    if (!view || !url) {
      throw new Error('Downloads are not available in this environment.');
    }
    const link = this.document.createElement('a');
    link.href = url;
    link.download = `${filename}.${options.format === 'svg' ? 'svg' : 'png'}`;
    link.rel = 'noopener';
    this.document.body.appendChild(link);
    link.click();
    link.remove();
    view.URL.revokeObjectURL(url);
  }

  /** `true` when this browser lets a page put an image on the clipboard. */
  canCopy(): boolean {
    const view = this.document.defaultView as
      (Window & { ClipboardItem?: unknown }) | null;
    return (
      !!view &&
      typeof view.ClipboardItem === 'function' &&
      typeof view.navigator?.clipboard?.write === 'function'
    );
  }

  /**
   * Copies the code to the clipboard as a PNG image. Must run from a user gesture (a click).
   *
   * @throws when the browser cannot copy images (check `canCopy()`), or the user refuses.
   */
  async copy(
    options: Omit<AndesQrCodeExportOptions, 'format'> = {},
  ): Promise<void> {
    const view = this.document.defaultView as
      | (Window & {
          ClipboardItem?: new (items: Record<string, Promise<Blob>>) => unknown;
        })
      | null;
    if (!this.canCopy() || !view?.ClipboardItem) {
      throw new Error('Copying an image is not supported in this browser.');
    }
    // The blob is handed over as a promise so the write starts inside the user gesture.
    const item = new view.ClipboardItem({
      'image/png': this.toBlob({ ...options, format: 'png' }),
    });
    await (
      view.navigator.clipboard as unknown as {
        write: (items: unknown[]) => Promise<void>;
      }
    ).write([item]);
  }

  private requireEncoded(): Encoded {
    const encoded = this.encoded();
    if (!encoded) {
      throw new Error(
        this.failure()
          ? 'The value cannot be encoded as a QR code.'
          : 'There is no value to export.',
      );
    }
    return encoded;
  }

  private exportIcon(
    options: Pick<AndesQrCodeExportOptions, 'icon'>,
  ): QrIconSpec | null {
    const spec = this.iconSpec();
    if (!spec) {
      return null;
    }
    return { ...spec, src: options.icon ?? spec.src };
  }

  private displayedColors(): QrColors {
    const host = this.host.nativeElement;
    const frame = host.firstElementChild ?? host;
    const style = this.document.defaultView?.getComputedStyle(frame);
    const read = (name: string, fallback: string) =>
      resolveColor(
        this.document,
        frame,
        style?.getPropertyValue(name).trim() || fallback,
      );
    const color = read('--_andes-qr-code-color', DEFAULT_COLOR);
    const bgColor = read('--_andes-qr-code-bg', DEFAULT_BG_COLOR);
    return {
      color,
      bgColor,
      finderColor: read('--_andes-qr-code-finder', color),
      quietZoneColor: read('--_andes-qr-code-quiet', bgColor),
    };
  }

  private exportColors(
    options: Pick<AndesQrCodeExportOptions, 'color' | 'bgColor'>,
  ): QrColors {
    const displayed = this.displayedColors();
    const frame = this.host.nativeElement;
    const color = options.color
      ? resolveColor(this.document, frame, options.color)
      : displayed.color;
    const bgColor = options.bgColor
      ? resolveColor(this.document, frame, options.bgColor)
      : displayed.bgColor;
    return {
      color,
      bgColor,
      // An explicit export colour wins over the on-screen corner / quiet-zone colours.
      finderColor:
        options.color || this.finderColor() === undefined
          ? color
          : displayed.finderColor,
      quietZoneColor:
        options.bgColor || this.quietZoneColor() === undefined
          ? bgColor
          : displayed.quietZoneColor,
    };
  }

  private async renderCanvas(
    options: AndesQrCodeExportOptions,
  ): Promise<HTMLCanvasElement> {
    const encoded = this.requireEncoded();
    const canvas = this.document.createElement('canvas');
    await this.draw(canvas, encoded, Math.max(1, options.scale ?? 2), options);
    return canvas;
  }

  private async paintCanvas(
    canvas: HTMLCanvasElement,
    encoded: Encoded,
  ): Promise<void> {
    const ratio = this.document.defaultView?.devicePixelRatio || 1;
    const token = ++this.paintToken;
    try {
      await this.draw(
        canvas,
        encoded,
        ratio,
        {},
        () => token === this.paintToken,
      );
    } catch {
      // A logo that fails to load must not blank the code; draw() already painted the
      // modules before awaiting the image.
    }
  }

  /**
   * Paints the modules synchronously, then (when there is a logo) waits for it and paints
   * again with the logo on top. The first paint means the code is never blank while a logo
   * loads; `isCurrent` lets a newer paint cancel the second step of an older one.
   */
  private async draw(
    canvas: HTMLCanvasElement,
    encoded: Encoded,
    scale: number,
    exportOptions: Pick<AndesQrCodeExportOptions, 'color' | 'bgColor' | 'icon'>,
    isCurrent: () => boolean = () => true,
  ): Promise<void> {
    const pixels = Math.max(1, Math.round(this.pixelSize() * scale));
    canvas.width = pixels;
    canvas.height = pixels;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('A 2D canvas context is not available.');
    }
    const colors = this.exportColors(exportOptions);
    const base = {
      ...colors,
      pixels,
      quietZone: Math.max(0, Math.floor(this.quietZone())),
    };
    drawQrToCanvas(context, encoded.matrix, encoded.layout, base);
    const src = this.exportIcon(exportOptions)?.src;
    if (!src) {
      return;
    }
    const image = await loadImage(this.document, src);
    if (!isCurrent()) {
      return;
    }
    drawQrToCanvas(context, encoded.matrix, encoded.layout, {
      ...base,
      image,
      imageSize: { width: image.naturalWidth, height: image.naturalHeight },
    });
  }
}
