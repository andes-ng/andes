import {
  ANDES_IMAGE_LABELS,
  type AndesImagePreviewAction,
  type AndesImageTransform,
} from '../image/image-types';

/** One picture of a gallery. */
export interface AndesGalleryImage {
  /** Full-size source shown on the stage. */
  readonly src: string;
  /** Small source for the thumbnail strip; defaults to `src`. */
  readonly thumbnail?: string;
  /** Alternative text; announced with the position when the image changes. */
  readonly alt?: string;
  /** Shown as the caption under the picture. */
  readonly title?: string;
  /** Tried once if `src` fails to load. */
  readonly fallback?: string;
  /** File name used by the download action; defaults to the last URL segment. */
  readonly name?: string;
}

/** A gallery image: a bare URL or a full {@link AndesGalleryImage}. */
export type AndesGallerySource = string | AndesGalleryImage;

/** Toolbar buttons of the gallery: the image viewer's actions plus fullscreen. */
export type AndesGalleryAction = AndesImagePreviewAction | 'fullscreen';

/** Every default toolbar action, in the order the toolbar lays them out. */
export const ANDES_GALLERY_ACTIONS: readonly AndesGalleryAction[] = [
  'zoomOut',
  'zoomIn',
  'rotateLeft',
  'rotateRight',
  'flipX',
  'flipY',
  'reset',
  'download',
  'fullscreen',
];

/** Where the thumbnail strip sits; `start` / `end` are vertical strips (mirrored in RTL). */
export type AndesGalleryThumbnailPosition = 'bottom' | 'top' | 'start' | 'end';

/** Every action a template can call on the gallery. */
export interface AndesGalleryActions {
  previous(): void;
  next(): void;
  /** Shows the image at a 0-based index. */
  goTo(index: number): void;
  zoomIn(): void;
  zoomOut(): void;
  rotateLeft(): void;
  rotateRight(): void;
  flipX(): void;
  flipY(): void;
  reset(): void;
  download(): Promise<void>;
  /** Opens or closes the lightbox. */
  toggleFullscreen(): void;
  /** Starts or stops the slideshow. */
  togglePlay(): void;
}

/** Context of `imageTemplate`, which replaces the picture on the stage. */
export interface AndesGalleryImageContext {
  readonly $implicit: AndesGalleryImage;
  readonly image: AndesGalleryImage;
  readonly index: number;
  readonly total: number;
  readonly transform: AndesImageTransform;
}

/** Context of `thumbnailTemplate`, which replaces a thumbnail's content. */
export interface AndesGalleryThumbnailContext {
  readonly $implicit: AndesGalleryImage;
  readonly image: AndesGalleryImage;
  readonly index: number;
  readonly active: boolean;
}

/** Context of `captionTemplate`, `headerTemplate` and `footerTemplate`. */
export interface AndesGalleryContext {
  readonly $implicit: AndesGalleryImage;
  readonly image: AndesGalleryImage;
  readonly index: number;
  readonly total: number;
  readonly fullscreen: boolean;
  readonly actions: AndesGalleryActions;
}

/** Every user-facing string of the gallery, for localisation. */
export interface AndesGalleryLabels {
  /** Accessible name of the gallery (its region, or its lightbox dialog). */
  readonly gallery?: string;
  readonly previous?: string;
  readonly next?: string;
  readonly close?: string;
  readonly zoomIn?: string;
  readonly zoomOut?: string;
  readonly rotateLeft?: string;
  readonly rotateRight?: string;
  readonly flipX?: string;
  readonly flipY?: string;
  readonly reset?: string;
  readonly download?: string;
  readonly fullscreen?: string;
  readonly exitFullscreen?: string;
  readonly play?: string;
  readonly pause?: string;
  /** Accessible name of the toolbar. */
  readonly toolbar?: string;
  /** Accessible name of the thumbnail strip. */
  readonly thumbnails?: string;
  /** Accessible name of the zoom ratio. */
  readonly zoomRatio?: string;
  /** Shown on the stage when an image cannot be loaded. */
  readonly loadError?: string;
  /** Announced on every change, and the stage's name: receives the 1-based position. */
  readonly position?: (current: number, total: number) => string;
}

/** English defaults for {@link AndesGalleryLabels}. */
export const ANDES_GALLERY_LABELS: Required<AndesGalleryLabels> = {
  gallery: 'Image gallery',
  previous: ANDES_IMAGE_LABELS.previous,
  next: ANDES_IMAGE_LABELS.next,
  close: ANDES_IMAGE_LABELS.close,
  zoomIn: ANDES_IMAGE_LABELS.zoomIn,
  zoomOut: ANDES_IMAGE_LABELS.zoomOut,
  rotateLeft: ANDES_IMAGE_LABELS.rotateLeft,
  rotateRight: ANDES_IMAGE_LABELS.rotateRight,
  flipX: ANDES_IMAGE_LABELS.flipX,
  flipY: ANDES_IMAGE_LABELS.flipY,
  reset: ANDES_IMAGE_LABELS.reset,
  download: ANDES_IMAGE_LABELS.download,
  fullscreen: 'Full screen',
  exitFullscreen: 'Exit full screen',
  play: 'Start slideshow',
  pause: 'Pause slideshow',
  toolbar: ANDES_IMAGE_LABELS.toolbar,
  thumbnails: 'Thumbnails',
  zoomRatio: ANDES_IMAGE_LABELS.zoomRatio,
  loadError: ANDES_IMAGE_LABELS.loadError,
  position: ANDES_IMAGE_LABELS.position,
};

/** Merges partial labels over the English defaults. */
export function resolveGalleryLabels(
  labels: AndesGalleryLabels | null | undefined,
): Required<AndesGalleryLabels> {
  const merged: Record<string, unknown> = { ...ANDES_GALLERY_LABELS };
  for (const [key, value] of Object.entries(labels ?? {})) {
    if (value !== undefined) {
      merged[key] = value;
    }
  }
  return merged as unknown as Required<AndesGalleryLabels>;
}

/** Turns bare URLs into images. */
export function normalizeGalleryImages(
  sources: readonly AndesGallerySource[] | null | undefined,
): readonly AndesGalleryImage[] {
  return (sources ?? []).map((source) =>
    typeof source === 'string' ? { src: source } : source,
  );
}
