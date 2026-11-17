import type { TemplateRef } from '@angular/core';

/**
 * Where a file is in its life:
 * - `ready`: in the list, not sent (manual upload mode, waiting for `submit()`);
 * - `uploading`: the request is running;
 * - `done`: the server accepted it (or it came in already uploaded);
 * - `error`: the request failed; it can be retried while the original file is still known;
 * - `removed`: only ever seen on the file handed to `change` / `remove` when it leaves the list.
 */
export type AndesUploadStatus =
  'ready' | 'uploading' | 'done' | 'error' | 'removed';

export type AndesUploadListType =
  'text' | 'picture' | 'picture-card' | 'picture-circle';

export type AndesUploadSize = 'sm' | 'md' | 'lg';

/**
 * How the control is drawn:
 * - `default`: the projected trigger (or the default button) with the file list under it;
 * - `field`: one row the height of a text field - a "choose" segment, the chosen file's name
 *   (or a placeholder) and a clear button - with no list under it.
 */
export type AndesUploadVariant = 'default' | 'field';

/** How a batch of files reached the control. */
export type AndesUploadSource = 'select' | 'drop' | 'paste' | 'api';

/**
 * Where a paste of files is taken:
 * - `control`: while the focus is inside the control, or the pointer is over it (hover it and
 *   press Ctrl/Cmd+V, no focus needed);
 * - `page`: anywhere on the page (the control listens on the document), as long as the paste
 *   is not meant for a text field or for another upload.
 */
export type AndesUploadPasteScope = 'control' | 'page';

/** One entry of the file list (the control's value). */
export interface AndesUploadFile<TResponse = unknown> {
  /** Stable identity; generated for files the user adds. */
  uid: string;
  name: string;
  /** Bytes. */
  size?: number;
  /** MIME type. */
  type?: string;
  /** Absent means `done` (a file that was already on the server). */
  status?: AndesUploadStatus;
  /** 0-100 while `uploading`. */
  percent?: number;
  /** Whatever the transport reported on success (parsed JSON when possible). */
  response?: TResponse;
  /** The failure of the last attempt. */
  error?: unknown;
  /** Replaces the generic failure text next to a failed file. */
  errorMessage?: string;
  /** Where the uploaded file can be opened or downloaded. */
  url?: string;
  /** Picture used by the picture list types; generated from the file when missing. */
  thumbUrl?: string;
  /** The file (or the blob `beforeUpload` turned it into) that is sent. */
  originFileObj?: File | Blob;
  lastModified?: number;
}

export interface AndesUploadChangeEvent<TResponse = unknown> {
  /** The file this change is about. */
  file: AndesUploadFile<TResponse>;
  /** The whole list after the change. */
  fileList: AndesUploadFile<TResponse>[];
  /** Present for progress changes. */
  event?: { percent: number };
}

export type AndesUploadRejectReason =
  'accept' | 'size' | 'count' | 'before-upload';

export interface AndesUploadRejection {
  file: File;
  reason: AndesUploadRejectReason;
}

/**
 * What `preview` and `download` emit. Call `preventDefault()` synchronously to replace the
 * default (the image viewer for a picture or opening the file's URL for `preview`, following
 * the link for `download`).
 */
export class AndesUploadItemEvent {
  private prevented = false;

  constructor(
    readonly file: AndesUploadFile,
    /** The DOM event that triggered it, `null` for programmatic calls. */
    readonly nativeEvent: Event | null,
  ) {}

  get defaultPrevented(): boolean {
    return this.prevented;
  }

  preventDefault(): void {
    this.prevented = true;
  }
}

/**
 * What `beforeUpload` may return, now or as a promise:
 * - `true` / `undefined`: go ahead;
 * - a `File` or `Blob`: go ahead, sending this instead (compressed, renamed, converted...);
 * - `false` / `null`, or a rejected promise: the file is not added.
 */
export type AndesUploadBeforeResult = boolean | File | Blob | null | undefined;

export type AndesUploadBeforeUpload = (
  file: File,
  batch: File[],
) => AndesUploadBeforeResult | Promise<AndesUploadBeforeResult>;

/** Return `false` (or reject) to keep the file. */
export type AndesUploadBeforeRemove = (
  file: AndesUploadFile,
) => boolean | undefined | Promise<boolean | undefined>;

export type AndesUploadData =
  | Record<string, unknown>
  | ((
      file: AndesUploadFile,
    ) => Record<string, unknown> | Promise<Record<string, unknown>>);

export type AndesUploadAction =
  string | ((file: AndesUploadFile) => string | Promise<string>);

/** What a transport receives; `data` and `action` are already resolved. */
export interface AndesUploadRequestOptions {
  action: string;
  method: string;
  headers: Record<string, string>;
  data: Record<string, unknown>;
  withCredentials: boolean;
  /** The multipart field name for the file. */
  filename: string;
  file: File | Blob;
  uploadFile: AndesUploadFile;
  /** Report 0-100. */
  onProgress: (percent: number, event?: ProgressEvent) => void;
  onSuccess: (response?: unknown) => void;
  onError: (error: unknown, response?: unknown) => void;
}

export interface AndesUploadRequestHandle {
  abort(): void;
}

/** A transport. Return a handle (or an abort function) to make removal cancel the request. */
export type AndesUploadRequest = (
  options: AndesUploadRequestOptions,
) => AndesUploadRequestHandle | (() => void) | void;

/** What went wrong in a request: a non-2xx answer, no answer at all, or no answer in time. */
export type AndesUploadHttpErrorKind = 'http' | 'network' | 'timeout';

/**
 * The failure the built-in transport reports for a non-2xx answer, a network error or a
 * timeout. `message` is English text for logs; the row shows the translated `messages` entry
 * for its `kind` (`httpError`, `networkError`, `timeout`) unless the file has an `errorMessage`.
 */
export class AndesUploadHttpError extends Error {
  constructor(
    message: string,
    /** The HTTP status, `0` for network errors and timeouts. */
    readonly status: number,
    readonly response?: unknown,
    readonly kind: AndesUploadHttpErrorKind = 'http',
  ) {
    super(message);
    this.name = 'AndesUploadHttpError';
  }
}

/** The error a file carries after `abortFile()`; the row shows `messages.uploadCancelled`. */
export class AndesUploadCancelledError extends Error {
  constructor(message = 'Upload cancelled') {
    super(message);
    this.name = 'AndesUploadCancelledError';
  }
}

/** A flag for every file, or a function that answers per file. */
export type AndesUploadFileFlag =
  boolean | ((file: AndesUploadFile) => boolean);

/**
 * `accept` as an object: `format` is the file input's `accept` list; `filter` says who checks
 * the files against it. `native` leaves it to the browser's own picker (a dropped or pasted
 * file is not checked again); a function decides for every file, chosen, dropped or pasted
 * (reason `accept` when it answers `false`). Without `filter`, the control checks `format`.
 */
export interface AndesUploadAcceptObject {
  format?: string;
  filter?: 'native' | ((file: File) => boolean);
}

export interface AndesUploadListOptions {
  /**
   * The eye action. It appears for pictures the image viewer can show (a web, `blob:` or
   * `data:image` address, a thumbnail, or the chosen file itself) and for other files whose
   * `url` is an `http(s)` or `blob:` address. Default: on for `picture-card` and
   * `picture-circle` (where it is on the hover mask), off for `text` and `picture` rows, where
   * the file name (and the thumbnail of a picture row) opens the preview instead. `true` shows
   * it in rows too.
   */
  showPreviewIcon?: AndesUploadFileFlag;
  showRemoveIcon?: AndesUploadFileFlag;
  showDownloadIcon?: AndesUploadFileFlag;
  showRetryIcon?: boolean;
  /** The file size under the name (list rows only). */
  showFileSize?: boolean;
  /** Replaces the eye icon of the preview action; the button and its label stay. */
  previewIcon?: TemplateRef<AndesUploadIconContext>;
  /** Replaces the icon of the download action (a short text works too). */
  downloadIcon?: TemplateRef<AndesUploadIconContext>;
  /** Replaces the icon of the remove action. */
  removeIcon?: TemplateRef<AndesUploadIconContext>;
  /** Extra text after the caption of a row (the size, a note...); empty shows nothing. */
  extra?: (file: AndesUploadFile) => string | null | undefined;
}

/** The parts of the control that take a consumer's classes and inline styles. */
export type AndesUploadPart = 'root' | 'trigger' | 'list' | 'item';

/**
 * Classes added beside each part's own: `root` the control's box, `trigger` the click / drop
 * area (or the field row), `list` the file list and `item` every row or card. The parts render
 * inside the component, so style these classes from a global stylesheet.
 */
export type AndesUploadClassNames = Partial<Record<AndesUploadPart, string>>;

/** Inline styles set on each part, keyed like {@link AndesUploadClassNames}. */
export type AndesUploadStyles = Partial<
  Record<AndesUploadPart, Record<string, string | number>>
>;

/** How the progress of a file being sent is drawn. */
export interface AndesUploadProgressOptions {
  /**
   * The colour of the filled bar (any CSS colour, a `var(--andes-*)` token works), or the two
   * ends of a gradient that runs from the start of the bar to its end.
   */
  strokeColor?: string | { readonly from: string; readonly to: string };
  /** Thickness of the bar in a list, in px. Default 2. */
  strokeWidth?: number;
  /** The text shown while sending; default `{percent}%`. */
  format?: (percent: number, file: AndesUploadFile) => string;
  /** `false` hides the text (the percent next to the name of a row); default `true`. */
  showInfo?: boolean;
}

/** What a message function receives: the same values a `{placeholder}` would be filled with. */
export type AndesUploadMessageParams = Readonly<
  Record<string, string | number>
>;

/**
 * A text of the control: a string with `{placeholders}`, or a function of the same values for
 * languages whose plural forms need more than a swapped word (`({ count }) => ...`).
 */
export type AndesUploadMessage =
  string | ((params: AndesUploadMessageParams) => string);

/**
 * Texts the control writes itself. `{name}`, `{max}`, `{count}`, `{reason}` and `{status}` are
 * filled in where they make sense; every entry may also be a function of those values.
 */
export interface AndesUploadMessages {
  selectFiles: AndesUploadMessage;
  fileList: AndesUploadMessage;
  uploading: AndesUploadMessage;
  ready: AndesUploadMessage;
  uploadFailed: AndesUploadMessage;
  /** A file the user cancelled while it was sending (`abortFile()`). */
  uploadCancelled: AndesUploadMessage;
  /** The server answered with an error (`{status}`). */
  httpError: AndesUploadMessage;
  /** The request could not reach the server. */
  networkError: AndesUploadMessage;
  /** The server did not answer in time. */
  timeout: AndesUploadMessage;
  announceUploaded: AndesUploadMessage;
  announceFailed: AndesUploadMessage;
  announceRemoved: AndesUploadMessage;
  announceRejected: AndesUploadMessage;
  rejectAccept: AndesUploadMessage;
  rejectSize: AndesUploadMessage;
  /** The limit was hit (`{count}` is the limit): the one entry that needs a plural. */
  rejectCount: AndesUploadMessage;
  rejectBefore: AndesUploadMessage;
  preview: AndesUploadMessage;
  download: AndesUploadMessage;
  remove: AndesUploadMessage;
  retry: AndesUploadMessage;
  dropTitle: AndesUploadMessage;
  /** The default trigger of a card or circle list, under its plus sign. */
  upload: AndesUploadMessage;
  /** What a card or circle shows in place of the picture while its file is sending. */
  uploadingText?: AndesUploadMessage;
  /** Field variant: the text shown while no file is chosen. */
  noFileChosen: AndesUploadMessage;
  /** Field variant: the text shown for several files (`{count}`). */
  filesChosen: AndesUploadMessage;
  /** Field variant: announced when files join the list (`{name}`). */
  announceAdded: AndesUploadMessage;
}

export interface AndesUploadItemContext {
  $implicit: AndesUploadFile;
  file: AndesUploadFile;
  fileList: AndesUploadFile[];
  listType: AndesUploadListType;
  status: AndesUploadStatus;
  thumbUrl: string | undefined;
  preview: () => void;
  download: () => void;
  remove: () => void;
  retry: () => void;
}

export interface AndesUploadIconContext {
  $implicit: AndesUploadFile;
  file: AndesUploadFile;
  listType: AndesUploadListType;
  status: AndesUploadStatus;
  thumbUrl: string | undefined;
}

export type AndesUploadItemTemplate = TemplateRef<AndesUploadItemContext>;
export type AndesUploadIconTemplate = TemplateRef<AndesUploadIconContext>;
