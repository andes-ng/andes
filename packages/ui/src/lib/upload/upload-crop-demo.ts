import {
  afterRenderEffect,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  signal,
  TemplateRef,
  untracked,
  viewChild,
} from '@angular/core';

import { AndesButton } from '../button/button';
import { ANDES_DIALOG_IMPORTS } from '../dialog/dialog';
import { AndesSegmented } from '../segmented/segmented';
import type { AndesSegmentedOptionInput } from '../segmented/segmented-types';
import { AndesSlider } from '../slider/slider';
import type { AndesSliderValue } from '../slider/slider';
import {
  aspectRatio,
  clampRect,
  CROP_HANDLES,
  CROP_MAX_ZOOM,
  CROP_MIN_ZOOM,
  cropOutput,
  dragFrame,
  fitFrame,
  fitStage,
  panPicture,
  resizeFrame,
  rotatedSize,
  sourceRect,
  unrotateRect,
  zoomPicture,
  type CropAspect,
  type CropHandle,
  type CropPlacement,
  type CropRect,
  type CropSize,
  type CropTurns,
} from './upload-crop';

/*
 * The crop dialog of the "Crop image before uploading" story: a story helper built only from
 * library components, not library API (nothing here is exported from `index.ts`). The
 * geometry lives in `upload-crop.ts`.
 */

/** The picture box before the dialog is measured (and wherever nothing can be measured). */
const DEFAULT_STAGE: CropSize = { width: 560, height: 380 };

/** The output size is announced at most this often while the frame is being dragged. */
const ANNOUNCE_EVERY = 800;

/** The on-screen copy of the picture is drawn once at most this many px on its long side. */
const MAX_PREVIEW = 2048;

/** Arrow keys move (or, with Shift, resize) the frame by this many px. */
const KEY_STEP = 4;

/** `+` and `-` (and the zoom buttons) change the zoom by this much. */
const ZOOM_STEP = 0.1;

const ARROWS_X: Readonly<Record<string, number>> = {
  ArrowLeft: -1,
  ArrowRight: 1,
};
const ARROWS_Y: Readonly<Record<string, number>> = {
  ArrowUp: -1,
  ArrowDown: 1,
};

const ZERO: CropRect = { x: 0, y: 0, width: 0, height: 0 };
const UNZOOMED: CropPlacement = { x: 0, y: 0, zoom: 1 };

type Gesture = 'move' | 'pan' | CropHandle;

interface Drag {
  readonly gesture: Gesture;
  readonly pointerId: number;
  readonly startX: number;
  readonly startY: number;
  readonly frame: CropRect;
  lastX: number;
  lastY: number;
}

type CropGlyphName =
  | 'free'
  | 'square'
  | 'four-three'
  | 'sixteen-nine'
  | 'zoom-in'
  | 'zoom-out'
  | 'rotate'
  | 'reset';

/** 24x24 stroke paths (Lucide's crop, zoom and rotate shapes; the ratios drawn to scale). */
const GLYPHS: Readonly<Record<CropGlyphName, readonly string[]>> = {
  free: ['M6 2v14a2 2 0 0 0 2 2h14', 'M18 22V8a2 2 0 0 0-2-2H2'],
  square: [
    'M6.5 5h11A1.5 1.5 0 0 1 19 6.5v11a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 17.5v-11A1.5 1.5 0 0 1 6.5 5z',
  ],
  'four-three': [
    'M3.5 4.5h17A1.5 1.5 0 0 1 22 6v12a1.5 1.5 0 0 1-1.5 1.5h-17A1.5 1.5 0 0 1 2 18V6a1.5 1.5 0 0 1 1.5-1.5z',
  ],
  'sixteen-nine': [
    'M3.5 6.375h17A1.5 1.5 0 0 1 22 7.875v8.25a1.5 1.5 0 0 1-1.5 1.5h-17A1.5 1.5 0 0 1 2 16.125v-8.25a1.5 1.5 0 0 1 1.5-1.5z',
  ],
  'zoom-in': [
    'M19 11a8 8 0 1 1-16 0 8 8 0 0 1 16 0z',
    'm21 21-4.35-4.35',
    'M11 8v6',
    'M8 11h6',
  ],
  'zoom-out': [
    'M19 11a8 8 0 1 1-16 0 8 8 0 0 1 16 0z',
    'm21 21-4.35-4.35',
    'M8 11h6',
  ],
  rotate: ['M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8', 'M21 3v5h-5'],
  reset: ['M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8', 'M3 3v5h5'],
};

/** A decorative 18px line icon: its control carries the accessible name. */
@Component({
  selector: 'andes-story-crop-glyph',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true' },
  styles: `
    :host {
      display: inline-flex;
      flex: none;
      inline-size: 1.125rem;
      block-size: 1.125rem;
    }
    svg {
      inline-size: 100%;
      block-size: 100%;
      fill: none;
      stroke: currentColor;
      stroke-width: 1.75;
      stroke-linecap: round;
      stroke-linejoin: round;
    }
  `,
  template: `<svg viewBox="0 0 24 24" focusable="false">
    @for (path of paths(); track path) {
      <path [attr.d]="path" />
    }
  </svg>`,
})
class CropGlyph {
  readonly name = input.required<CropGlyphName>();

  protected readonly paths = computed(() => GLYPHS[this.name()]);
}

interface PendingCrop {
  readonly file: File;
  readonly resolve: (result: File | false) => void;
}

/**
 * Opens a dialog to crop a picture by hand: `crop(file)` resolves the cropped `File` (same
 * name and type) on "Crop and upload", or `false` when the dialog is dismissed, which is
 * exactly what `beforeUpload` takes.
 */
@Component({
  selector: 'andes-story-upload-crop-dialog',
  imports: [
    AndesButton,
    AndesSegmented,
    AndesSlider,
    CropGlyph,
    ...ANDES_DIALOG_IMPORTS,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-template #freeIcon><andes-story-crop-glyph name="free" /></ng-template>
    <ng-template #squareIcon
      ><andes-story-crop-glyph name="square"
    /></ng-template>
    <ng-template #fourThreeIcon
      ><andes-story-crop-glyph name="four-three"
    /></ng-template>
    <ng-template #sixteenNineIcon
      ><andes-story-crop-glyph name="sixteen-nine"
    /></ng-template>
    <andes-dialog
      [(open)]="open"
      size="lg"
      footer="default"
      okText="Crop and upload"
      [okDisabled]="!ready()"
      [confirmLoading]="busy()"
      (ok)="confirm()"
      (closed)="settle()"
    >
      <andes-dialog-content *andesDialogContent>
        <div andesDialogHeader>
          <h2 andesDialogTitle>Crop the picture</h2>
          <p andesDialogDescription class="crop__sr">
            Drag the frame or its handles; zoom and drag the picture to choose
            what is kept.
          </p>
        </div>
        <div class="crop">
          <div #area class="crop__area">
            <!-- Measures the height the viewport leaves for the picture (a CSS length). -->
            <span #probe class="crop__probe" aria-hidden="true"></span>
            <div
              #stageElement
              class="crop__stage"
              [style.width.px]="stage().width"
              [style.height.px]="stage().height"
              [attr.data-dragging]="dragging()"
              [attr.data-zoomed]="placement().zoom > 1 ? '' : null"
              (pointerdown)="press($event)"
              (pointermove)="drag($event)"
              (pointerup)="release($event)"
              (pointercancel)="release($event)"
              (lostpointercapture)="release($event)"
              (wheel)="wheel($event)"
            >
              <!-- The picture and the dimmed mask are clipped; the handles are not. -->
              <div class="crop__clip">
                <canvas
                  #picture
                  class="crop__picture"
                  aria-hidden="true"
                  [style.width.px]="stage().width"
                  [style.height.px]="stage().height"
                  [style.transform]="pictureTransform()"
                ></canvas>
                @if (ready()) {
                  <div
                    class="crop__mask"
                    aria-hidden="true"
                    [style.left.px]="frame().x"
                    [style.top.px]="frame().y"
                    [style.width.px]="frame().width"
                    [style.height.px]="frame().height"
                  ></div>
                }
              </div>
              @if (ready()) {
                <div
                  #frameElement
                  class="crop__frame"
                  tabindex="0"
                  role="group"
                  aria-roledescription="crop area"
                  aria-label="Crop area"
                  aria-describedby="andes-story-crop-hint andes-story-crop-size"
                  [style.left.px]="frame().x"
                  [style.top.px]="frame().y"
                  [style.width.px]="frame().width"
                  [style.height.px]="frame().height"
                  (keydown)="key($event)"
                >
                  <span class="crop__guides" aria-hidden="true">
                    <span class="crop__guide crop__guide--columns"></span>
                    <span class="crop__guide crop__guide--rows"></span>
                  </span>
                  @for (handle of handles; track handle) {
                    <span
                      class="crop__handle"
                      aria-hidden="true"
                      [attr.data-handle]="handle"
                    ></span>
                  }
                </div>
                <span class="crop__size" aria-hidden="true"
                  >{{ outputSize().width }} × {{ outputSize().height }}</span
                >
              }
            </div>
          </div>
          <p id="andes-story-crop-hint" class="crop__sr">
            Arrow keys move the frame, Shift and the arrow keys resize it, + and
            - zoom.
          </p>
          <p
            id="andes-story-crop-size"
            class="crop__sr"
            aria-live="polite"
            aria-atomic="true"
          >
            {{ announcedSize() }}
          </p>
          <div class="crop__toolbar">
            <andes-segmented
              class="crop__aspect"
              size="lg"
              [options]="aspects()"
              [value]="aspect()"
              (valueChange)="setAspect($event)"
              aria-label="Crop shape"
            />
            <div class="crop__zoom">
              <andes-button
                variant="ghost"
                size="icon"
                title="Zoom out"
                aria-label="Zoom out"
                [disabled]="!ready() || placement().zoom <= minZoom"
                (click)="stepZoom(-1)"
              >
                <andes-story-crop-glyph name="zoom-out" />
              </andes-button>
              <andes-slider
                class="crop__slider"
                size="sm"
                [min]="minZoom"
                [max]="maxZoom"
                [step]="0.01"
                [value]="placement().zoom"
                [valueFormatter]="formatZoom"
                (valueChange)="setZoom($event)"
                aria-label="Zoom"
              />
              <andes-button
                variant="ghost"
                size="icon"
                title="Zoom in"
                aria-label="Zoom in"
                [disabled]="!ready() || placement().zoom >= maxZoom"
                (click)="stepZoom(1)"
              >
                <andes-story-crop-glyph name="zoom-in" />
              </andes-button>
            </div>
            <div class="crop__actions">
              <andes-button
                variant="ghost"
                size="icon"
                title="Rotate"
                aria-label="Rotate a quarter turn"
                [disabled]="!ready()"
                (click)="rotate()"
              >
                <andes-story-crop-glyph name="rotate" />
              </andes-button>
              <andes-button
                variant="ghost"
                size="icon"
                title="Reset"
                aria-label="Reset the crop"
                [disabled]="!ready()"
                (click)="reset()"
              >
                <andes-story-crop-glyph name="reset" />
              </andes-button>
            </div>
          </div>
        </div>
      </andes-dialog-content>
    </andes-dialog>
  `,
  styles: `
    .crop {
      display: grid;
      /* Not auto: the picture box would stretch the column and the dialog could never
         shrink it back when it narrows. */
      grid-template-columns: minmax(0, 1fr);
      gap: var(--andes-space-3);
      min-inline-size: 0;
      /* The toolbar lays itself out by the room the dialog gives it, not the screen's. */
      container-type: inline-size;
    }

    .crop__sr {
      position: absolute;
      inline-size: 1px;
      block-size: 1px;
      margin: -1px;
      padding: 0;
      overflow: hidden;
      border: 0;
      clip-path: inset(50%);
      white-space: nowrap;
    }

    .crop__area {
      position: relative;
      display: grid;
      justify-items: center;
      min-inline-size: 0;
    }

    /*
     * The tallest the picture gets: the viewport less the dialog's own chrome, within a
     * range. Read back in px by the component, so the picture fits without a scrollbar.
     */
    .crop__probe {
      position: absolute;
      inset-block-start: 0;
      inline-size: 0;
      block-size: clamp(8rem, calc(100dvh - 19rem), 28rem);
      visibility: hidden;
      pointer-events: none;
    }

    .crop__stage {
      position: relative;
      max-inline-size: 100%;
      /* The stage takes every touch: no page scroll or pinch while cropping. */
      touch-action: none;
      user-select: none;
      -webkit-user-select: none;
    }

    .crop__stage[data-zoomed] {
      cursor: grab;
    }

    .crop__stage[data-dragging='pan'] {
      cursor: grabbing;
    }

    .crop__clip {
      position: absolute;
      inset: 0;
      overflow: hidden;
      border-radius: var(--andes-radius-sm);
      background: var(--andes-color-muted);
    }

    .crop__picture {
      position: absolute;
      top: 0;
      left: 0;
      display: block;
      transform-origin: 0 0;
    }

    /* The dimmed area outside the frame: a huge shadow, clipped by the stage. */
    .crop__mask {
      position: absolute;
      box-shadow: 0 0 0 1000px var(--andes-color-overlay);
      pointer-events: none;
      transition-property: left, top, width, height;
      transition-duration: var(--andes-motion-duration-fast);
      transition-timing-function: var(--andes-motion-ease-out);
    }

    /* Positioned with physical left/top: the frame maths is in the picture's own px. */
    .crop__frame {
      position: absolute;
      box-sizing: border-box;
      border: 1px solid var(--andes-color-ghost);
      cursor: move;
      outline: none;
      transition-property: left, top, width, height;
      transition-duration: var(--andes-motion-duration-fast);
      transition-timing-function: var(--andes-motion-ease-out);
    }

    .crop__frame:focus-visible {
      border-color: var(--andes-color-focus-ring);
      outline: 2px solid var(--andes-color-focus-ring);
      outline-offset: 2px;
    }

    .crop__stage[data-dragging] .crop__frame,
    .crop__stage[data-dragging] .crop__mask {
      transition: none;
    }

    .crop__guides {
      position: absolute;
      inset: 0;
      opacity: 0;
      pointer-events: none;
      transition: opacity var(--andes-motion-duration-fast)
        var(--andes-motion-ease-out);
    }

    .crop__stage[data-dragging] .crop__guides {
      opacity: 1;
    }

    .crop__guide {
      position: absolute;
      box-sizing: border-box;
      border: 0 solid
        color-mix(in srgb, var(--andes-color-ghost) 70%, transparent);
    }

    .crop__guide--columns {
      top: 0;
      bottom: 0;
      left: 33.333%;
      width: 33.334%;
      border-left-width: 1px;
      border-right-width: 1px;
    }

    .crop__guide--rows {
      left: 0;
      right: 0;
      top: 33.333%;
      height: 33.334%;
      border-top-width: 1px;
      border-bottom-width: 1px;
    }

    /* A 24px hit area (32px for touch) around a small visible square. */
    .crop__handle {
      --crop-hit: 1.5rem;
      position: absolute;
      inline-size: var(--crop-hit);
      block-size: var(--crop-hit);
      margin: calc(var(--crop-hit) / -2) 0 0 calc(var(--crop-hit) / -2);
    }

    .crop__handle::after {
      content: '';
      position: absolute;
      inset: calc(50% - 0.3125rem);
      box-sizing: border-box;
      border: 1px solid var(--andes-color-primary);
      border-radius: 2px;
      background: var(--andes-color-ghost);
    }

    @media (pointer: coarse) {
      .crop__handle {
        --crop-hit: 2.25rem;
      }
    }

    .crop__handle[data-handle='nw'] {
      top: 0;
      left: 0;
      cursor: nwse-resize;
    }

    .crop__handle[data-handle='n'] {
      top: 0;
      left: 50%;
      cursor: ns-resize;
    }

    .crop__handle[data-handle='ne'] {
      top: 0;
      left: 100%;
      cursor: nesw-resize;
    }

    .crop__handle[data-handle='e'] {
      top: 50%;
      left: 100%;
      cursor: ew-resize;
    }

    .crop__handle[data-handle='se'] {
      top: 100%;
      left: 100%;
      cursor: nwse-resize;
    }

    .crop__handle[data-handle='s'] {
      top: 100%;
      left: 50%;
      cursor: ns-resize;
    }

    .crop__handle[data-handle='sw'] {
      top: 100%;
      left: 0;
      cursor: nesw-resize;
    }

    .crop__handle[data-handle='w'] {
      top: 50%;
      left: 0;
      cursor: ew-resize;
    }

    /*
     * The output size, as a quiet chip over the picture. Two layers of the overlay tone make
     * it dark enough to read on a white picture; the border keeps it apart from a black one.
     */
    .crop__size {
      position: absolute;
      inset-block-end: var(--andes-space-2);
      inset-inline: 0;
      inline-size: fit-content;
      margin-inline: auto;
      padding: 0 var(--andes-space-2);
      border: 1px solid
        color-mix(in srgb, var(--andes-color-ghost) 28%, transparent);
      border-radius: var(--andes-radius-sm);
      background-color: var(--andes-color-overlay);
      background-image: linear-gradient(
        var(--andes-color-overlay),
        var(--andes-color-overlay)
      );
      color: var(--andes-color-ghost);
      font-size: var(--andes-font-size-xs, 0.75rem);
      font-variant-numeric: tabular-nums;
      line-height: 1.25rem;
      white-space: nowrap;
      pointer-events: none;
    }

    /* One row when there is room: shape | zoom | rotate, reset. */
    .crop__toolbar {
      display: grid;
      grid-template-areas:
        'aspect actions'
        'zoom zoom';
      grid-template-columns: auto auto;
      gap: var(--andes-space-2) var(--andes-space-3);
      align-items: center;
      justify-content: space-between;
    }

    /* A very narrow dialog: each group on its own row, centred. */
    @container (max-width: 17.5rem) {
      .crop__toolbar {
        grid-template-areas:
          'aspect'
          'zoom'
          'actions';
        grid-template-columns: 1fr;
        justify-items: center;
      }

      .crop__zoom {
        justify-self: stretch;
      }

      .crop__aspect,
      .crop__actions {
        justify-self: center;
      }
    }

    @container (min-width: 30rem) {
      .crop__toolbar {
        grid-template-areas: 'aspect zoom actions';
        grid-template-columns: auto minmax(8rem, 1fr) auto;
      }
    }

    .crop__aspect {
      grid-area: aspect;
      justify-self: start;
    }

    /* Icon-sized segments: a 36px target (44px for touch) instead of a padded label. */
    .crop__aspect[data-size] {
      --_px: 0.5625rem;
    }

    /* The empty label and icon slots must not add their gap beside the icon. */
    .crop__aspect ::ng-deep .andes-segmented-option__button {
      gap: 0;
    }

    .crop__zoom {
      grid-area: zoom;
      display: flex;
      gap: var(--andes-space-1);
      align-items: center;
      min-inline-size: 0;
    }

    .crop__slider {
      flex: 1;
      min-inline-size: 0;
    }

    .crop__actions {
      grid-area: actions;
      display: flex;
      gap: var(--andes-space-1);
      justify-self: end;
    }

    /* The library's own parts: their inner elements are reached from here. */
    .crop__toolbar ::ng-deep .andes-button {
      flex: none;
    }

    /* The slider's press target is 24px thick; the thumb is 12px. Stretch it to 32px. */
    .crop__slider ::ng-deep .andes-slider__control::before {
      inset-block: -0.625rem;
    }

    @media (pointer: coarse) {
      .crop__aspect[data-size] {
        --_h: 2.75rem;
        --_px: 0.8125rem;
      }

      .crop__toolbar ::ng-deep .andes-button--icon {
        width: 2.75rem;
        height: 2.75rem;
      }

      .crop__slider ::ng-deep .andes-slider__control::before {
        inset-block: -1rem;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .crop__frame,
      .crop__mask,
      .crop__guides {
        transition: none;
      }
    }
  `,
})
export class UploadCropDialog {
  private readonly destroyRef = inject(DestroyRef);
  private readonly areaRef = viewChild<ElementRef<HTMLElement>>('area');
  private readonly probeRef = viewChild<ElementRef<HTMLElement>>('probe');
  private readonly freeIcon = viewChild.required('freeIcon', {
    read: TemplateRef,
  });
  private readonly squareIcon = viewChild.required('squareIcon', {
    read: TemplateRef,
  });
  private readonly fourThreeIcon = viewChild.required('fourThreeIcon', {
    read: TemplateRef,
  });
  private readonly sixteenNineIcon = viewChild.required('sixteenNineIcon', {
    read: TemplateRef,
  });
  private readonly stageRef =
    viewChild<ElementRef<HTMLElement>>('stageElement');
  private readonly canvasRef =
    viewChild<ElementRef<HTMLCanvasElement>>('picture');
  private readonly frameRef =
    viewChild<ElementRef<HTMLElement>>('frameElement');

  protected readonly handles = CROP_HANDLES;
  protected readonly minZoom = CROP_MIN_ZOOM;
  protected readonly maxZoom = CROP_MAX_ZOOM;
  /** The shapes as icons: each is named for assistive tech and in its tooltip. */
  protected readonly aspects = computed<
    AndesSegmentedOptionInput<CropAspect>[]
  >(() => [
    option('free', 'Free shape', this.freeIcon()),
    option('1:1', 'Square, 1:1', this.squareIcon()),
    option('4:3', 'Landscape, 4:3', this.fourThreeIcon()),
    option('16:9', 'Wide, 16:9', this.sixteenNineIcon()),
  ]);
  protected readonly formatZoom = (value: number) => `${value.toFixed(1)}x`;

  protected readonly open = signal(false);
  protected readonly busy = signal(false);
  protected readonly aspect = signal<CropAspect>('1:1');
  protected readonly turns = signal<CropTurns>(0);
  protected readonly dragging = signal<Gesture | null>(null);

  /** The decoded picture, at its natural size: the crop reads its real pixels. */
  private readonly source = signal<ImageBitmap | null>(null);
  /** The room the dialog leaves for the picture box (0 until measured). */
  private readonly measured = signal<CropSize>({ width: 0, height: 0 });
  /*
   * The frame and the pan are kept as fractions of the stage, so a resized dialog (a phone
   * turned, a window narrowed) scales them with the picture.
   */
  private readonly frameFraction = signal<CropRect>(ZERO);
  private readonly placementFraction = signal<CropPlacement>(UNZOOMED);

  private readonly natural = computed<CropSize>(() => {
    const source = this.source();
    return source
      ? { width: source.width, height: source.height }
      : { width: 0, height: 0 };
  });

  /** The picture box, in px: the turned picture fitted to the room the dialog leaves. */
  protected readonly stage = computed(() =>
    fitStage(rotatedSize(this.natural(), this.turns()), {
      width: this.measured().width || DEFAULT_STAGE.width,
      height: this.measured().height || DEFAULT_STAGE.height,
    }),
  );

  protected readonly ready = computed(() => this.stage().width > 0);

  protected readonly frame = computed<CropRect>(() => {
    const stage = this.stage();
    const f = this.frameFraction();
    return {
      x: f.x * stage.width,
      y: f.y * stage.height,
      width: f.width * stage.width,
      height: f.height * stage.height,
    };
  });

  protected readonly placement = computed<CropPlacement>(() => {
    const stage = this.stage();
    const p = this.placementFraction();
    return { x: p.x * stage.width, y: p.y * stage.height, zoom: p.zoom };
  });

  protected readonly pictureTransform = computed(() => {
    const { x, y, zoom } = this.placement();
    return `translate(${x}px, ${y}px) scale(${zoom})`;
  });

  /** The size of the file "Crop and upload" makes, in the picture's own pixels. */
  protected readonly outputSize = computed<CropSize>(() =>
    this.ready() ? this.sourceArea() : { width: 0, height: 0 },
  );

  /** The size read out to assistive tech: it trails `outputSize` while the frame is dragged. */
  protected readonly announcedSize = signal('');

  private announceTimer: ReturnType<typeof setTimeout> | undefined;
  private pending: PendingCrop | null = null;
  private pointer: Drag | null = null;

  constructor() {
    // Room for the picture box: the stage follows the dialog's width.
    effect((onCleanup) => {
      const area = this.areaRef()?.nativeElement;
      const probe = this.probeRef()?.nativeElement;
      if (!area || !probe) {
        return;
      }
      const measure = () =>
        this.measured.set({
          width: area.clientWidth,
          height: probe.clientHeight,
        });
      measure();
      if (typeof ResizeObserver === 'undefined') {
        return;
      }
      const observer = new ResizeObserver(measure);
      observer.observe(area);
      observer.observe(probe);
      onCleanup(() => observer.disconnect());
    });

    // The first size is read out at once; the ones that follow a drag are spaced out.
    effect(() => {
      const { width, height } = this.outputSize();
      const text = width ? `Output size ${width} by ${height} pixels` : '';
      if (!text || !untracked(this.announcedSize)) {
        clearTimeout(this.announceTimer);
        this.announceTimer = undefined;
        this.announcedSize.set(text);
      } else if (this.announceTimer === undefined) {
        this.announceTimer = setTimeout(() => {
          this.announceTimer = undefined;
          const latest = this.outputSize();
          this.announcedSize.set(
            `Output size ${latest.width} by ${latest.height} pixels`,
          );
        }, ANNOUNCE_EVERY);
      }
    });

    // The on-screen copy is drawn once per picture and turn; zoom and pan only move it
    // with CSS, so a 4000px photo stays smooth to drag.
    afterRenderEffect(() => {
      const canvas = this.canvasRef()?.nativeElement;
      const source = this.source();
      const turns = this.turns();
      if (canvas && source) {
        paintPreview(canvas, source, turns);
      }
    });

    this.destroyRef.onDestroy(() => {
      clearTimeout(this.announceTimer);
      this.settle();
    });
  }

  /** Opens the dialog for `file`: the cropped file, or `false` when the dialog is dismissed. */
  crop(file: File): Promise<File | false> {
    return new Promise<File | false>((resolve) => {
      this.pending?.resolve(false);
      this.pending = { file, resolve };
      this.aspect.set('1:1');
      this.turns.set(0);
      this.placementFraction.set(UNZOOMED);
      this.dropSource();
      this.open.set(true);
      createImageBitmap(file).then(
        (source) => {
          if (this.pending?.file !== file) {
            source.close();
            return;
          }
          this.source.set(source);
          this.refit();
        },
        () => {
          // Not a picture the browser can read: leave it out of the list.
          this.open.set(false);
          this.settle();
        },
      );
    });
  }

  protected setAspect(value: CropAspect | null): void {
    if (value) {
      this.aspect.set(value);
      const frame = this.frame();
      this.refit({
        x: frame.x + frame.width / 2,
        y: frame.y + frame.height / 2,
      });
    }
  }

  protected setZoom(value: AndesSliderValue | undefined): void {
    if (typeof value === 'number') {
      this.zoomAboutFrame(value);
    }
  }

  /** The zoom buttons: one `ZOOM_STEP` out (-1) or in (1), about the middle of the frame. */
  protected stepZoom(direction: -1 | 1): void {
    this.zoomAboutFrame(this.placement().zoom + direction * ZOOM_STEP);
  }

  protected rotate(): void {
    this.turns.update((turns) => ((turns + 1) % 4) as CropTurns);
    this.placementFraction.set(UNZOOMED);
    this.refit();
  }

  protected reset(): void {
    this.turns.set(0);
    this.placementFraction.set(UNZOOMED);
    this.refit();
  }

  protected press(event: PointerEvent): void {
    if (
      this.pointer ||
      !this.ready() ||
      (event.pointerType === 'mouse' && event.button !== 0)
    ) {
      return;
    }
    const target = event.target as Element;
    const handle = target
      .closest('[data-handle]')
      ?.getAttribute('data-handle') as CropHandle | undefined;
    const gesture: Gesture =
      handle ?? (target.closest('.crop__frame') ? 'move' : 'pan');
    this.pointer = {
      gesture,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      lastX: event.clientX,
      lastY: event.clientY,
      frame: this.frame(),
    };
    // Captured, the drag keeps going when the pointer leaves the stage (or the dialog).
    this.stageRef()?.nativeElement.setPointerCapture?.(event.pointerId);
    // No text selection or native image drag; the frame takes the keyboard from here.
    event.preventDefault();
    this.frameRef()?.nativeElement.focus({ preventScroll: true });
    this.dragging.set(gesture);
  }

  protected drag(event: PointerEvent): void {
    const pointer = this.pointer;
    if (!pointer || pointer.pointerId !== event.pointerId) {
      return;
    }
    const stage = this.stage();
    const dx = event.clientX - pointer.lastX;
    const dy = event.clientY - pointer.lastY;
    pointer.lastX = event.clientX;
    pointer.lastY = event.clientY;
    if (pointer.gesture === 'pan') {
      this.setPlacement(panPicture(this.placement(), dx, dy, stage));
    } else if (pointer.gesture === 'move') {
      this.moveFrame(dx, dy);
    } else {
      // Resizing is measured from the press, so the frame never drifts from the pointer.
      this.setFrame(
        resizeFrame(
          pointer.frame,
          pointer.gesture,
          event.clientX - pointer.startX,
          event.clientY - pointer.startY,
          stage,
          aspectRatio(this.aspect()),
        ),
      );
    }
  }

  protected release(event: PointerEvent): void {
    if (this.pointer?.pointerId === event.pointerId) {
      this.pointer = null;
      this.dragging.set(null);
    }
  }

  protected wheel(event: WheelEvent): void {
    const stage = this.stageRef()?.nativeElement;
    if (!stage || !this.ready()) {
      return;
    }
    event.preventDefault();
    const box = stage.getBoundingClientRect();
    const placement = this.placement();
    this.setPlacement(
      zoomPicture(
        placement,
        placement.zoom * Math.exp(-event.deltaY * 0.002),
        { x: event.clientX - box.left, y: event.clientY - box.top },
        this.stage(),
      ),
    );
  }

  protected key(event: KeyboardEvent): void {
    const x = ARROWS_X[event.key] ?? 0;
    const y = ARROWS_Y[event.key] ?? 0;
    if (x || y) {
      if (event.shiftKey) {
        // Shift drags the right edge (left/right) or the bottom edge (up/down).
        this.setFrame(
          resizeFrame(
            this.frame(),
            x ? 'e' : 's',
            x * KEY_STEP,
            y * KEY_STEP,
            this.stage(),
            aspectRatio(this.aspect()),
          ),
        );
      } else {
        this.moveFrame(x * KEY_STEP, y * KEY_STEP);
      }
    } else if (event.key === '+' || event.key === '=') {
      this.stepZoom(1);
    } else if (event.key === '-' || event.key === '_') {
      this.stepZoom(-1);
    } else {
      return;
    }
    event.preventDefault();
  }

  protected async confirm(): Promise<void> {
    const pending = this.pending;
    const source = this.source();
    if (!pending || !source || this.busy()) {
      return;
    }
    this.busy.set(true);
    try {
      const file = await this.cut(pending.file, source);
      if (this.pending === pending) {
        pending.resolve(file);
        this.pending = null;
      }
    } finally {
      this.busy.set(false);
    }
    this.open.set(false);
  }

  /** Closed without confirming: the file is not added. */
  protected settle(): void {
    this.pending?.resolve(false);
    this.pending = null;
    this.pointer = null;
    this.dragging.set(null);
    this.dropSource();
  }

  /** The frame's part of the turned picture, in its real pixels. */
  private sourceArea(): CropRect {
    return sourceRect(
      this.frame(),
      this.placement(),
      this.stage(),
      rotatedSize(this.natural(), this.turns()),
    );
  }

  /** Draws the frame's pixels of the picture as stored, turned, into a file like `file`. */
  private async cut(file: File, source: ImageBitmap): Promise<File> {
    const turns = this.turns();
    const area = this.sourceArea();
    const from = unrotateRect(area, turns, this.natural());
    const canvas = document.createElement('canvas');
    canvas.width = area.width;
    canvas.height = area.height;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('No 2D canvas');
    }
    context.translate(area.width / 2, area.height / 2);
    context.rotate((turns * Math.PI) / 2);
    context.drawImage(
      source,
      from.x,
      from.y,
      from.width,
      from.height,
      -from.width / 2,
      -from.height / 2,
      from.width,
      from.height,
    );
    const output = cropOutput(file.type);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, output.type, output.quality),
    );
    if (!blob) {
      throw new Error('The picture could not be encoded');
    }
    return new File([blob], file.name, {
      type: output.type,
      lastModified: Date.now(),
    });
  }

  /** A fresh frame of the chosen shape, centred on `centre` (the stage's middle by default). */
  private refit(centre?: { readonly x: number; readonly y: number }): void {
    this.setFrame(fitFrame(this.stage(), aspectRatio(this.aspect()), centre));
  }

  private moveFrame(dx: number, dy: number): void {
    const moved = dragFrame(
      this.frame(),
      this.placement(),
      dx,
      dy,
      this.stage(),
    );
    this.setFrame(moved.frame);
    this.setPlacement(moved.placement);
  }

  private zoomAboutFrame(zoom: number): void {
    const frame = this.frame();
    this.setPlacement(
      zoomPicture(
        this.placement(),
        // Rounded to the hundredth, so repeated steps do not drift (1.2000000000000002).
        Math.round(zoom * 100) / 100,
        { x: frame.x + frame.width / 2, y: frame.y + frame.height / 2 },
        this.stage(),
      ),
    );
  }

  private setFrame(frame: CropRect): void {
    const stage = this.stage();
    if (!stage.width || !stage.height) {
      return;
    }
    const inside = clampRect(frame, stage);
    this.frameFraction.set({
      x: inside.x / stage.width,
      y: inside.y / stage.height,
      width: inside.width / stage.width,
      height: inside.height / stage.height,
    });
  }

  private setPlacement(placement: CropPlacement): void {
    const stage = this.stage();
    if (!stage.width || !stage.height) {
      return;
    }
    this.placementFraction.set({
      x: placement.x / stage.width,
      y: placement.y / stage.height,
      zoom: placement.zoom,
    });
  }

  private dropSource(): void {
    this.source()?.close();
    this.source.set(null);
    this.frameFraction.set(ZERO);
  }
}

/** An icon-only shape option: the label is the accessible name and the tooltip. */
function option(
  value: CropAspect,
  label: string,
  icon: TemplateRef<unknown>,
): AndesSegmentedOptionInput<CropAspect> {
  return { value, icon, ariaLabel: label, tooltip: label };
}

/** Draws the turned picture into the on-screen canvas, scaled down to `MAX_PREVIEW`. */
function paintPreview(
  canvas: HTMLCanvasElement,
  source: ImageBitmap,
  turns: CropTurns,
): void {
  const turned = rotatedSize(
    { width: source.width, height: source.height },
    turns,
  );
  const scale = Math.min(
    1,
    MAX_PREVIEW / Math.max(turned.width, turned.height),
  );
  canvas.width = Math.max(1, Math.round(turned.width * scale));
  canvas.height = Math.max(1, Math.round(turned.height * scale));
  const context = canvas.getContext('2d');
  if (!context) {
    return;
  }
  context.translate(canvas.width / 2, canvas.height / 2);
  context.rotate((turns * Math.PI) / 2);
  const width = source.width * scale;
  const height = source.height * scale;
  context.drawImage(source, -width / 2, -height / 2, width, height);
}
