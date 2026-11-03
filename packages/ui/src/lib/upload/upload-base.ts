import {
  afterNextRender,
  booleanAttribute,
  computed,
  DestroyRef,
  Directive,
  DOCUMENT,
  effect,
  ElementRef,
  inject,
  Injector,
  input,
  model,
  numberAttribute,
  output,
  signal,
  TemplateRef,
  viewChild,
} from '@angular/core';
import { ControlValueAccessor } from '@angular/forms';
import clsx from 'clsx';

import type { AndesButtonContext } from '../button/button-context';
import type {
  AndesImageLabels,
  AndesImagePreviewConfig,
  AndesImagePreviewItem,
} from '../image/image-types';
import type { AndesUploadIconName } from './upload-icon';
import {
  formatFileSize,
  formatMessage,
  isImageFile,
  isImageSource,
  isNavigableUrl,
  readDroppedFiles,
  toUploadFile,
  validateUploadFile,
} from './upload-files';
import { xhrUploadRequest } from './upload-request';
import {
  AndesUploadCancelledError,
  AndesUploadHttpError,
  AndesUploadItemEvent,
  type AndesUploadAcceptObject,
  type AndesUploadAction,
  type AndesUploadBeforeRemove,
  type AndesUploadBeforeUpload,
  type AndesUploadChangeEvent,
  type AndesUploadClassNames,
  type AndesUploadData,
  type AndesUploadFile,
  type AndesUploadFileFlag,
  type AndesUploadIconContext,
  type AndesUploadItemContext,
  type AndesUploadListOptions,
  type AndesUploadListType,
  type AndesUploadMessages,
  type AndesUploadPasteScope,
  type AndesUploadProgressOptions,
  type AndesUploadRejection,
  type AndesUploadRequest,
  type AndesUploadRequestHandle,
  type AndesUploadRequestOptions,
  type AndesUploadSize,
  type AndesUploadSource,
  type AndesUploadStatus,
  type AndesUploadStyles,
  type AndesUploadVariant,
} from './upload-types';

export const DEFAULT_UPLOAD_MESSAGES: AndesUploadMessages = {
  selectFiles: 'Select files',
  fileList: 'Files',
  uploading: 'Uploading {name}',
  ready: 'Ready to upload',
  uploadFailed: 'Upload failed',
  uploadCancelled: 'Upload cancelled',
  httpError: 'Upload failed with status {status}',
  networkError: 'Network error',
  timeout: 'The upload timed out',
  announceUploaded: '{name} uploaded',
  announceFailed: '{name} could not be uploaded',
  announceRemoved: '{name} removed',
  announceRejected: '{name} was not added: {reason}',
  rejectAccept: 'this file type is not allowed',
  rejectSize: 'the file is larger than {max}',
  rejectCount: ({ count }) =>
    `the limit of ${count} ${count === 1 ? 'file' : 'files'} is reached`,
  rejectBefore: 'the file was not accepted',
  preview: 'Preview {name}',
  download: 'Download {name}',
  remove: 'Remove {name}',
  retry: 'Retry uploading {name}',
  dropTitle: 'Click or drag files to this area to upload',
  upload: 'Upload',
  uploadingText: 'Uploading...',
  noFileChosen: 'No file chosen',
  filesChosen: ({ count }) => `${count} ${count === 1 ? 'file' : 'files'}`,
  announceAdded: '{name} added',
};

/** Makes the id of the field variant's file name text unique per instance. */
let fieldTextCounter = 0;

/** What the field variant shows for the whole list. */
export interface AndesUploadFieldView {
  /** The name, `{count} files`, or the placeholder. */
  readonly text: string;
  readonly empty: boolean;
  /** `error` if any file failed, then `uploading`, `ready`, `done`; `null` when empty. */
  readonly status: AndesUploadStatus | null;
  /** The average percent of the files being sent. */
  readonly percent: number;
  /** `percent` as the row shows it (`progress.format`, default `{percent}%`). */
  readonly percentText: string;
  /** The failure text of the first failed file. */
  readonly errorText: string | undefined;
  readonly uploadingLabel: string;
  readonly clearLabel: string;
  readonly canClear: boolean;
}

/** Natively keyboard-focusable elements, plus anything opted in with a tabindex. */
const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button',
  'input:not([type="hidden"])',
  'select',
  'textarea',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

/** What the default item template renders for one file. */
export interface AndesUploadItemView {
  readonly uid: string;
  readonly file: AndesUploadFile;
  readonly status: AndesUploadStatus;
  readonly percent: number;
  readonly thumb: string | undefined;
  readonly icon: AndesUploadIconName;
  readonly caption: string;
  /** `showUploadList.extra` for this file. */
  readonly extra: string;
  readonly errorText: string | undefined;
  /** What the image viewer shows for this file; set only for pictures it can draw. */
  readonly viewSrc: string | undefined;
  /** The file can be previewed: the name (and a picture row's thumbnail) is then a click target. */
  readonly previewable: boolean;
  /** The eye action is drawn (`previewable` and `showUploadList.showPreviewIcon`). */
  readonly canPreview: boolean;
  readonly canDownload: boolean;
  readonly canRetry: boolean;
  readonly canRemove: boolean;
  readonly labels: {
    readonly preview: string;
    readonly download: string;
    readonly remove: string;
    readonly retry: string;
    readonly uploading: string;
  };
  readonly ctx: AndesUploadItemContext;
  readonly iconCtx: AndesUploadIconContext;
}

interface ThumbEntry {
  url: string | undefined;
  readonly source: File | Blob;
  /** Object URLs we created are ours to revoke; ones a `previewFile` returned are not. */
  readonly owned: boolean;
}

function noop(): void {
  // Default Forms callbacks until the real ones are registered.
}

/** `Node.ELEMENT_NODE` and `Node.TEXT_NODE`, spelled out: there is no `Node` global on a server. */
const ELEMENT_NODE = 1;
const TEXT_NODE = 3;

function hasProjectedContent(slot: HTMLElement): boolean {
  return Array.from(slot.childNodes).some(
    (node) =>
      node.nodeType === ELEMENT_NODE ||
      (node.nodeType === TEXT_NODE && !!node.textContent?.trim()),
  );
}

/** A show-this-action flag, which may answer per file. */
function flagged(flag: AndesUploadFileFlag, file: AndesUploadFile): boolean {
  return typeof flag === 'function' ? flag(file) : flag;
}

function hasFiles(event: DragEvent): boolean {
  return Array.from(event.dataTransfer?.types ?? []).includes('Files');
}

/** Input types that hold no text, so a paste into them is not a paste of text. */
const NON_TEXT_INPUTS = new Set([
  'button',
  'checkbox',
  'color',
  'file',
  'hidden',
  'image',
  'radio',
  'range',
  'reset',
  'submit',
]);

/** Whether the paste lands where text is typed: a text input, a textarea or editable content. */
function isTextEditing(target: EventTarget | null): boolean {
  const element = target as Element | null;
  if (typeof element?.closest !== 'function') {
    return false;
  }
  if (element.closest('textarea')) {
    return true;
  }
  const input = element.closest('input');
  if (input) {
    return !NON_TEXT_INPUTS.has(input.type);
  }
  const editable = element.closest('[contenteditable]');
  return !!editable && editable.getAttribute('contenteditable') !== 'false';
}

/**
 * The uploads that take pastes anywhere on a page, per document. Every one of them hears a
 * paste; only the first eligible one in document order takes the files.
 */
const pageUploads = new WeakMap<Document, Set<AndesUploadBase>>();

/**
 * The `control`-scope uploads that have the pointer over them, per document: a paste made while
 * one of them is hovered goes to it, ahead of any page-wide upload.
 */
const hoveredUploads = new WeakMap<Document, Set<AndesUploadBase>>();

/**
 * What a chosen file can be opened as in a new tab. Pages that could run scripts under the
 * application's origin (HTML, SVG, XML) are left out on purpose.
 */
const BLOB_OPENABLE =
  /^(image\/(png|jpe?g|gif|webp|avif|bmp)|application\/pdf|text\/plain|audio\/|video\/)/i;

/**
 * Everything `andes-upload` and `andes-upload-dragger` share: the two components render the
 * exact same template and differ only in `dragMode`, so they stay separate selectors without
 * re-forwarding ~40 inputs.
 *
 * ## How files flow
 *
 * Files arrive from the picker, a drop, a paste or `addFiles()`. Each is checked against
 * `accept` and `maxSize`, trimmed to `maxCount`, then handed to `beforeUpload` (which may veto
 * or replace it). The survivors join `fileList` and, with `autoUpload`, start sending through
 * `customRequest` or the built-in multipart transport. Every change to the list - added,
 * progress, done, failed, removed - goes through `commit()`, which updates the `fileList`
 * model, the bound form control and the `changed` output together.
 */
@Directive({
  host: {
    '[attr.data-slot]': '"upload"',
    '[attr.data-list-type]': 'isField() ? null : listType()',
    '[attr.data-variant]': 'variant()',
    '[attr.data-disabled]': 'isDisabled() ? "" : null',
    // These belong on the real file input inside the template.
    '[attr.id]': 'null',
    '[attr.name]': 'null',
    '[attr.aria-label]': 'null',
    '[attr.aria-labelledby]': 'null',
    '[attr.aria-describedby]': 'null',
    '[attr.aria-invalid]': 'null',
    '(focusout)': 'onFocusOut($event)',
  },
})
export abstract class AndesUploadBase implements ControlValueAccessor {
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);
  private readonly document = inject(DOCUMENT);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly fileInput =
    viewChild<ElementRef<HTMLInputElement>>('fileInput');
  private readonly projected = viewChild<ElementRef<HTMLElement>>('projected');
  private readonly defaultTrigger = viewChild('defaultTrigger', {
    read: ElementRef<HTMLElement>,
  });

  /** The drag-and-drop variant sets this; it only changes what the trigger area looks like. */
  protected readonly dragMode: boolean = false;

  /* ------------------------------------------------------------------ inputs */

  /** The list of files; two-way (`[(fileList)]`) and the value seen by Forms. */
  readonly fileList = model<AndesUploadFile[]>([]);

  /** Where files are sent; a function can pick a URL per file. */
  readonly action = input<AndesUploadAction | undefined>(undefined);
  readonly method = input('POST');
  readonly headers = input<Record<string, string>>({});
  /** Extra form fields sent with each file; a function can compute them per file. */
  readonly data = input<AndesUploadData | undefined>(undefined);
  readonly withCredentials = input(false, { transform: booleanAttribute });
  /** The multipart field name of the file (and the file input's `name`). */
  readonly name = input('file');
  /** Replaces the built-in transport entirely. */
  readonly customRequest = input<AndesUploadRequest | undefined>(undefined);
  /** Start sending as soon as files are added. Off: files wait as `ready` for `submit()`. */
  readonly autoUpload = input(true, { transform: booleanAttribute });

  /**
   * File types, as a file input's `accept` (`.pdf,image/*`), or an object with that list as
   * `format` and a `filter` (`native`, or your own function) that decides who checks the files.
   */
  readonly accept = input<string | AndesUploadAcceptObject | undefined>(
    undefined,
  );
  readonly multiple = input(false, { transform: booleanAttribute });
  /** Pick (or drop) whole folders; every file inside is added. */
  readonly directory = input(false, { transform: booleanAttribute });
  /** At most this many files. With 1, a new file replaces the current one. */
  readonly maxCount = input<number | undefined, unknown>(undefined, {
    transform: (value: unknown) =>
      value === undefined || value === null
        ? undefined
        : numberAttribute(value),
  });
  /** Largest file, in bytes. */
  readonly maxSize = input<number | undefined, unknown>(undefined, {
    transform: (value: unknown) =>
      value === undefined || value === null
        ? undefined
        : numberAttribute(value),
  });
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Accept pasted files (see `pasteScope` for where). Off: no paste is taken at all. */
  readonly allowPaste = input(true, { transform: booleanAttribute });
  /**
   * `control` (default) takes files pasted while the focus is inside the control or while the
   * pointer is over it (hover it and press Ctrl/Cmd+V; no focus needed). `page` takes them
   * anywhere on the page, except a paste that carries text into a text field (it pastes as
   * usual) or one inside another upload. A hovered control wins over page-wide ones; with
   * several page-wide uploads on a page, the first one in document order that is enabled and
   * has room takes the files.
   */
  readonly pasteScope = input<AndesUploadPasteScope>('control');
  /** Off: only `open()` (or a drop) starts a selection. */
  readonly openFileDialogOnClick = input(true, { transform: booleanAttribute });

  /**
   * Tell the bound form control about upload progress too. By default it hears about a file
   * only when its state changes (added, started, done, failed, removed), so `valueChanges`
   * does not fire for every percent point; the `changed` output and `fileList` still carry
   * every step.
   */
  readonly emitProgressToForm = input(false, { transform: booleanAttribute });

  readonly beforeUpload = input<AndesUploadBeforeUpload | undefined>(undefined);
  /**
   * Return `false` (or reject) to keep a file the user asked to remove. It also runs for the
   * file that a new one replaces when `maxCount` is 1; if it vetoes, the new file is rejected
   * (reason `count`) and the current one stays.
   */
  readonly beforeRemove = input<AndesUploadBeforeRemove | undefined>(undefined);

  /**
   * `field` draws the control as one text-field-sized row (choose segment, file name, clear
   * button) that lines up with `andes-input`; it shows no list, so `listType`,
   * `showUploadList`, `itemRender` and projected content are ignored there.
   */
  readonly variant = input<AndesUploadVariant>('default');
  readonly listType = input<AndesUploadListType>('text');
  readonly size = input<AndesUploadSize>('md');
  /** `false` hides the list; an object picks which actions show. */
  readonly showUploadList = input<boolean | AndesUploadListOptions>(true);
  /** Draws a whole row (inside the `<li>`) yourself. */
  readonly itemRender = input<TemplateRef<AndesUploadItemContext> | undefined>(
    undefined,
  );
  /** Draws just the leading icon / thumbnail of a row. */
  readonly iconRender = input<TemplateRef<AndesUploadIconContext> | undefined>(
    undefined,
  );
  /**
   * Turns a chosen file into a thumbnail URL for the picture list types. The default makes an
   * object URL for pictures; a function given here is asked for every file (a video can get a
   * frame, a PDF its first page), and an empty answer keeps the file's icon.
   */
  readonly previewFile = input<
    ((file: File | Blob) => Promise<string>) | undefined
  >(undefined);
  /** Decides what counts as a picture; default looks at the type, then the extension. */
  readonly isImage = input<((file: AndesUploadFile) => boolean) | undefined>(
    undefined,
  );
  /**
   * The preview of a picture opens the library's image viewer (`andes-image-preview`) over
   * every picture of the list, with zoom, rotation and previous / next. Off, or for any other
   * file, the preview opens the file's `http(s)` or `blob:` address in a new tab.
   */
  readonly imagePreview = input(true, { transform: booleanAttribute });
  /** Behaviour of the image viewer: zoom limits, toolbar actions, loop, scrim... */
  readonly previewConfig = input<AndesImagePreviewConfig | null>(null);
  /** Localised texts of the image viewer. */
  readonly previewLabels = input<AndesImageLabels | null>(null);
  /** The colour, thickness and text of the progress of a file being sent. */
  readonly progress = input<AndesUploadProgressOptions | null>(null);
  /** Classes for the control's parts (`root`, `trigger`, `list`, `item`). */
  readonly classNames = input<AndesUploadClassNames | null>(null);
  /** Inline styles for the same parts. */
  readonly styles = input<AndesUploadStyles | null>(null);
  readonly messages = input<Partial<AndesUploadMessages> | undefined>(
    undefined,
  );

  /** Drag area: the title line (default is a localisable instruction). */
  readonly dropTitle = input<string | undefined>(undefined);
  /** Drag area: the smaller hint line under the title. */
  readonly dropHint = input<string | undefined>(undefined);
  /** Drag area: replaces the default icon. */
  readonly dropIcon = input<TemplateRef<unknown> | undefined>(undefined);

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

  /* ----------------------------------------------------------------- outputs */

  /** A file was added, progressed, finished, failed or left the list. Not named `change`: a file input's native `change` bubbles to the host. */
  readonly changed = output<AndesUploadChangeEvent>();
  /**
   * The preview action, or a click on the name (or, in a `picture` list, the thumbnail) of a
   * file that can be previewed. By default a picture opens in the image viewer (see
   * `imagePreview`) and another file's `http(s)` or `blob:` `url` (or, for a file just chosen,
   * the file itself, when a browser can show it) opens in a new tab; `preventDefault()`
   * replaces that (e.g. with your own viewer).
   */
  readonly preview = output<AndesUploadItemEvent>();
  /** The download action; `preventDefault()` replaces following the link. */
  readonly download = output<AndesUploadItemEvent>();
  /** Files were dropped on the drag area (before they are validated). Not named `drop`: that is a native event. */
  readonly dropped = output<DragEvent>();
  /** A file left the list because the user removed it (or `maxCount` 1 replaced it). */
  readonly remove = output<AndesUploadFile>();
  /** Files that were not added, with the rule they broke. */
  readonly rejected = output<AndesUploadRejection[]>();

  /* ------------------------------------------------------------------- state */

  private readonly disabledByForm = signal(false);
  protected readonly dragging = signal(false);
  /** The pointer is over the control (`pasteScope="control"` takes a paste then). */
  private readonly hovered = signal(false);
  /**
   * Off while the first render's rows are entering, on after it: rows that are there from the
   * start (an initial value) are not animated in, rows added later are.
   */
  protected readonly animateReady = signal(false);
  protected readonly announcement = signal('');
  /** Assumed true until the slot is measured, so an empty one is the exception. */
  protected readonly hasContent = signal(true);
  private readonly thumbs = signal<Readonly<Record<string, string>>>({});
  /** Object URLs of chosen files themselves (not of a `previewFile` thumbnail), by uid. */
  private readonly originals = signal<Readonly<Record<string, string>>>({});
  /** Whether the image viewer is open (`[(open)]` of the rendered `andes-image-preview`). */
  protected readonly viewerOpen = signal(false);
  /** The file the viewer shows, by uid, so it stays on it when other files come or go. */
  private readonly viewerUid = signal<string | null>(null);
  /** The file whose preview opened the viewer; focus returns there by itself. */
  private viewerOpener: string | null = null;

  private readonly thumbEntries = new Map<string, ThumbEntry>();
  /** Object URLs made to open a chosen file in a new tab; revoked with the control. */
  private readonly openedUrls = new Set<string>();
  /**
   * Object URLs made when the viewer opens, for chosen pictures that have none yet (a text
   * list, or thumbnails from `previewFile`); dropped like thumbnails.
   */
  private readonly viewerSources = new Map<string, ThumbEntry>();
  /** uid -> marker of the running attempt; a callback with a stale marker is ignored. */
  private readonly attempts = new Map<string, object>();
  private readonly handles = new Map<string, AndesUploadRequestHandle>();
  private dragDepth = 0;
  private announceFlip = false;
  /** The field variant's file name text, referenced by the file input's `aria-describedby`. */
  protected readonly fieldTextId = `andes-upload-field-text-${++fieldTextCounter}`;
  private destroyed = false;
  private onChange: (value: AndesUploadFile[]) => void = noop;
  private onTouched: () => void = noop;

  protected readonly isDisabled = computed(
    () => this.disabled() || this.disabledByForm(),
  );

  /**
   * Provided to the buttons in the control (the projected trigger and the default one) as
   * `ANDES_BUTTON_CONTEXT`, so a disabled upload disables them without a second `[disabled]`.
   */
  readonly buttonContext: AndesButtonContext = { disabled: this.isDisabled };

  /** The field row (never for the drag-and-drop variant, whose trigger is the drop area). */
  protected readonly isField = computed(
    () => !this.dragMode && this.variant() === 'field',
  );

  protected readonly rootClass = computed(() =>
    clsx(
      'andes-upload',
      `andes-upload--${this.size()}`,
      this.isField() && 'andes-upload--field',
      !this.dragMode &&
        !this.isField() &&
        this.listType() === 'picture' &&
        'andes-upload--picture',
      this.isCardList() && 'andes-upload--card',
      this.isCardList() &&
        this.listType() === 'picture-circle' &&
        'andes-upload--circle',
      this.isDisabled() && 'andes-upload--disabled',
      this.classNames()?.root,
    ),
  );

  /** Consumer classes and styles per part. */
  protected readonly parts = computed(() => ({
    classNames: this.classNames() ?? {},
    styles: this.styles() ?? {},
  }));

  /** The root's inline style: the `progress` options as custom properties, then `styles.root`. */
  protected readonly rootStyle = computed(() => {
    const progress = this.progress();
    const vars: Record<string, string | number> = {};
    const stroke = progress?.strokeColor;
    if (typeof stroke === 'string') {
      vars['--andes-upload-progress-color'] = stroke;
    } else if (stroke) {
      vars['--andes-upload-progress-fill'] =
        `linear-gradient(to right, ${stroke.from}, ${stroke.to})`;
      vars['--andes-upload-progress-fill-rtl'] =
        `linear-gradient(to left, ${stroke.from}, ${stroke.to})`;
    }
    const width = progress?.strokeWidth;
    if (width !== undefined && Number.isFinite(width) && width > 0) {
      vars['--andes-upload-progress-size'] = `${width}px`;
    }
    const style = { ...vars, ...this.parts().styles.root };
    return Object.keys(style).length > 0 ? style : null;
  });

  /** The viewer is rendered for the list layouts (the field row has no preview). */
  protected readonly viewerOn = computed(
    () => this.imagePreview() && !this.isField(),
  );

  /** The rows the viewer browses: pictures that offer a preview and have a source. */
  private readonly viewerFiles = computed(() =>
    this.items().filter((item) => item.previewable && !!item.viewSrc),
  );

  /** If the full picture cannot be loaded, the viewer falls back to the thumbnail. */
  protected readonly viewerItems = computed<AndesImagePreviewItem[]>(() =>
    this.viewerFiles().map((item) => {
      const src = item.viewSrc as string;
      const thumb = item.file.thumbUrl ?? this.thumbs()[item.uid];
      return {
        src,
        alt: item.file.name,
        name: item.file.name,
        ...(thumb !== src && this.isDrawable(thumb) ? { fallback: thumb } : {}),
      };
    }),
  );

  protected readonly viewerIndex = computed(() =>
    Math.max(
      0,
      this.viewerFiles().findIndex((item) => item.uid === this.viewerUid()),
    ),
  );

  /** The thumbnail (or, in a text list, the row) of the shown file: the viewer grows from it. */
  protected readonly viewerOrigin = computed<HTMLElement | null>(() => {
    const uid = this.viewerUid();
    this.viewerFiles();
    const row = uid ? this.itemElement(uid) : undefined;
    if (!row) {
      return null;
    }
    return this.listType() === 'text'
      ? row
      : (row.querySelector<HTMLElement>('[data-slot="upload-item-icon"]') ??
          row);
  });

  protected readonly msg = computed<AndesUploadMessages>(() => ({
    ...DEFAULT_UPLOAD_MESSAGES,
    ...this.messages(),
  }));

  /** The texts with no placeholders that the template prints as they are. */
  protected readonly text = computed(() => {
    const messages = this.msg();
    return {
      selectFiles: formatMessage(messages.selectFiles),
      fileList: formatMessage(messages.fileList),
      dropTitle: formatMessage(messages.dropTitle),
      upload: formatMessage(messages.upload),
      uploadingText: formatMessage(messages.uploadingText ?? 'Uploading...'),
    };
  });

  /** The `accept` list the file input gets. */
  protected readonly acceptFormat = computed(() => {
    const accept = this.accept();
    return typeof accept === 'object' && accept ? accept.format : accept;
  });

  protected readonly isCardList = computed(
    () =>
      !this.dragMode &&
      !this.isField() &&
      (this.listType() === 'picture-card' ||
        this.listType() === 'picture-circle'),
  );

  protected readonly listConfig = computed(() => {
    const value = this.showUploadList();
    const options = typeof value === 'object' ? value : {};
    return {
      show: value !== false,
      // The eye lives on the hover mask of a card or circle; a row opens the preview from its
      // name (and a picture row from its thumbnail) instead.
      preview: options.showPreviewIcon ?? this.isCardList(),
      remove: options.showRemoveIcon ?? true,
      download: options.showDownloadIcon ?? false,
      retry: options.showRetryIcon ?? true,
      fileSize: options.showFileSize ?? true,
      previewIcon: options.previewIcon ?? null,
      downloadIcon: options.downloadIcon ?? null,
      removeIcon: options.removeIcon ?? null,
      extra: options.extra,
    };
  });

  /** `true` when `maxCount` > 1 and that many files are in the list. */
  protected readonly isFull = computed(() => {
    const max = this.maxCount();
    return max !== undefined && max > 1 && this.fileList().length >= max;
  });

  /** The file input and the drop area refuse new files. */
  protected readonly triggerBlocked = computed(
    () => this.isDisabled() || this.isFull(),
  );

  /**
   * Picture-card lists replace the "add" tile with the pictures once the limit is hit. With
   * the list turned off there are no pictures to take its place (the tile is then the picture,
   * as in an avatar field), so it stays.
   */
  protected readonly triggerHidden = computed(() => {
    const max = this.maxCount();
    return (
      this.isCardList() &&
      this.listConfig().show &&
      max !== undefined &&
      this.fileList().length >= max
    );
  });

  protected readonly items = computed<AndesUploadItemView[]>(() => {
    const list = this.fileList();
    return list.map((file) => this.toView(file, list));
  });

  /** The field row's text, state and labels. */
  protected readonly fieldView = computed<AndesUploadFieldView>(() => {
    const list = this.fileList();
    const messages = this.msg();
    const statuses = list.map((file) => file.status ?? 'done');
    const status: AndesUploadStatus | null =
      list.length === 0
        ? null
        : ((['error', 'uploading', 'ready'] as const).find((s) =>
            statuses.includes(s),
          ) ?? 'done');
    const sending = list.filter(
      (file) => (file.status ?? 'done') === 'uploading',
    );
    const percent =
      sending.length === 0
        ? 0
        : Math.round(
            sending.reduce((sum, file) => sum + (file.percent ?? 0), 0) /
              sending.length,
          );
    const failed = list.find((file) => file.status === 'error');
    const text =
      list.length === 0
        ? formatMessage(messages.noFileChosen)
        : list.length === 1
          ? list[0].name
          : formatMessage(messages.filesChosen, { count: list.length });
    const format = this.progress()?.format;
    return {
      text,
      empty: list.length === 0,
      status,
      percent,
      percentText:
        format && sending.length > 0
          ? format(percent, sending[0])
          : `${percent}%`,
      errorText: failed ? this.errorTextOf(failed) : undefined,
      uploadingLabel: formatMessage(messages.uploading, { name: text }),
      clearLabel: formatMessage(messages.remove, { name: text }),
      canClear: list.length > 0 && !this.isDisabled(),
    };
  });

  /** The file input's description: the consumer's ids, then (field variant) the file name. */
  protected readonly inputDescribedby = computed(() => {
    const ids = [this.ariaDescribedby(), this.isField() ? this.fieldTextId : '']
      .filter(Boolean)
      .join(' ');
    return ids || null;
  });

  /** Drops are taken by the drag area and by the field row. */
  private readonly acceptsDrop = computed(
    () => this.dragMode || this.isField(),
  );

  constructor() {
    effect(() =>
      this.syncThumbs(
        this.fileList(),
        this.isField() ? 'text' : this.listType(),
      ),
    );

    // Keeps the trigger (projected, or the default button) out of the tab order - the file input
    // is the one stop - and notices an empty slot so a default button can stand in.
    effect((onCleanup) => {
      const slot = this.projected()?.nativeElement;
      if (!slot) {
        return;
      }
      const roots = [slot, this.defaultTrigger()?.nativeElement].filter(
        (root): root is HTMLElement => !!root,
      );
      const sync = () => {
        this.hasContent.set(hasProjectedContent(slot));
        for (const root of roots) {
          root.querySelectorAll(FOCUSABLE_SELECTOR).forEach((element) => {
            if (element.getAttribute('tabindex') !== '-1') {
              element.setAttribute('tabindex', '-1');
            }
          });
        }
      };
      sync();
      if (typeof MutationObserver === 'undefined') {
        return;
      }
      const observer = new MutationObserver(sync);
      for (const root of roots) {
        observer.observe(root, {
          childList: true,
          subtree: true,
          attributes: true,
          attributeFilter: ['tabindex', 'disabled'],
        });
      }
      onCleanup(() => observer.disconnect());
    });

    // Angular checks the entering classes of the first render on the next animation frame. This
    // waits for that frame to pass (its callback was queued first), so those rows are not
    // animated, and only then lets later rows animate.
    afterNextRender(() => {
      const view = this.document.defaultView;
      const ready = () => {
        if (!this.destroyed) {
          this.animateReady.set(true);
        }
      };
      if (view?.requestAnimationFrame) {
        view.requestAnimationFrame(ready);
      } else {
        ready();
      }
    });

    // A page-wide paste is heard on the document; the listener goes with the scope or the control.
    effect((onCleanup) => {
      if (this.pasteScope() !== 'page' || !this.allowPaste()) {
        return;
      }
      const doc = this.document;
      let registry = pageUploads.get(doc);
      if (!registry) {
        registry = new Set();
        pageUploads.set(doc, registry);
      }
      const uploads = registry;
      const listener = (event: Event) =>
        this.onPagePaste(event as ClipboardEvent, uploads);
      uploads.add(this);
      doc.addEventListener('paste', listener);
      onCleanup(() => {
        doc.removeEventListener('paste', listener);
        uploads.delete(this);
      });
    });

    // With the `control` scope, a paste is also taken while the pointer is over the control, with
    // no focus in it: the document listener exists only while it is hovered.
    effect((onCleanup) => {
      if (
        this.pasteScope() !== 'control' ||
        !this.allowPaste() ||
        !this.hovered()
      ) {
        return;
      }
      const doc = this.document;
      let registry = hoveredUploads.get(doc);
      if (!registry) {
        registry = new Set();
        hoveredUploads.set(doc, registry);
      }
      const hovering = registry;
      const listener = (event: Event) =>
        this.onHoverPaste(event as ClipboardEvent);
      hovering.add(this);
      doc.addEventListener('paste', listener);
      onCleanup(() => {
        doc.removeEventListener('paste', listener);
        hovering.delete(this);
      });
    });

    this.destroyRef.onDestroy(() => {
      this.destroyed = true;
      for (const url of this.openedUrls) {
        URL.revokeObjectURL(url);
      }
      this.openedUrls.clear();
      for (const handle of this.handles.values()) {
        handle.abort();
      }
      this.handles.clear();
      this.attempts.clear();
      for (const uid of [...this.thumbEntries.keys()]) {
        this.dropThumb(uid);
      }
      for (const uid of [...this.viewerSources.keys()]) {
        this.dropViewerSource(uid);
      }
    });
  }

  /* ---------------------------------------------------- ControlValueAccessor */

  writeValue(value: AndesUploadFile[] | null | undefined): void {
    this.fileList.set(Array.isArray(value) ? value : []);
  }

  registerOnChange(fn: (value: AndesUploadFile[]) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabledByForm.set(isDisabled);
  }

  /* -------------------------------------------------------------- public API */

  /** Opens the file dialog, as a click on the trigger would. */
  open(): void {
    if (!this.triggerBlocked()) {
      this.fileInput()?.nativeElement.click();
    }
  }

  /** Moves focus to the file input (the control's one tab stop). */
  focus(options?: FocusOptions): void {
    this.fileInput()?.nativeElement.focus(options);
  }

  /**
   * Adds files as if the user had chosen them: checked against `accept`, `maxSize` and
   * `maxCount`, passed through `beforeUpload`, then uploaded (or left `ready`).
   */
  async addFiles(
    files: readonly File[],
    source: AndesUploadSource = 'api',
  ): Promise<void> {
    if (this.destroyed || this.isDisabled() || files.length === 0) {
      return;
    }
    const rejections: AndesUploadRejection[] = [];
    let candidates: File[] = [];
    for (const file of files) {
      const accept = this.accept();
      const filter =
        typeof accept === 'object' && accept ? accept.filter : undefined;
      // With a `filter`, the control's own check of the list gives way to it.
      const reason =
        validateUploadFile(file, {
          accept: filter ? undefined : this.acceptFormat(),
          maxSize: this.maxSize(),
        }) ?? (typeof filter === 'function' && !filter(file) ? 'accept' : null);
      if (reason) {
        rejections.push({ file, reason });
      } else {
        candidates.push(file);
      }
    }

    if (!this.multiple() && !this.directory() && candidates.length > 1) {
      rejections.push(
        ...candidates
          .slice(1)
          .map((file) => ({ file, reason: 'count' as const })),
      );
      candidates = candidates.slice(0, 1);
    }
    candidates = this.trimToRoom(candidates, rejections);

    const hook = this.beforeUpload();
    const outcomes = await Promise.all(
      candidates.map(async (file) => {
        if (!hook) {
          return { file, sent: file as File | Blob | null };
        }
        try {
          const result = await hook(file, candidates);
          if (result === false || result === null) {
            return { file, sent: null };
          }
          return { file, sent: result instanceof Blob ? result : file };
        } catch {
          return { file, sent: null };
        }
      }),
    );
    if (this.destroyed) {
      return;
    }

    let approved: { file: File; sent: File | Blob }[] = [];
    for (const outcome of outcomes) {
      if (outcome.sent) {
        approved.push({ file: outcome.file, sent: outcome.sent });
      } else {
        rejections.push({ file: outcome.file, reason: 'before-upload' });
      }
    }
    // With room for one file, a new file replaces the current one, which `beforeRemove` may
    // want to keep: then the new file is the one turned away.
    if (approved.length > 0 && this.maxCount() === 1 && this.beforeRemove()) {
      for (const current of this.fileList()) {
        if (!(await this.mayRemove(current))) {
          rejections.push(
            ...approved.map(({ file }) => ({ file, reason: 'count' as const })),
          );
          approved = [];
          break;
        }
      }
      if (this.destroyed) {
        return;
      }
    }
    // The list may have changed while the hooks ran.
    const room = this.roomLeft();
    if (approved.length > room) {
      rejections.push(
        ...approved
          .slice(room)
          .map(({ file }) => ({ file, reason: 'count' as const })),
      );
      approved = approved.slice(0, room);
    }

    if (approved.length > 0) {
      const status = this.autoUpload() ? 'uploading' : 'ready';
      const entries = approved.map(({ file, sent }) =>
        toUploadFile(file, sent, status),
      );
      const previous = this.fileList();
      const replaced = this.maxCount() === 1 ? previous : [];
      for (const old of replaced) {
        this.cancelAttempt(old.uid);
      }
      const next = replaced.length > 0 ? entries : [...previous, ...entries];
      this.fileList.set(next);
      this.onChange(next);
      for (const old of replaced) {
        const gone = { ...old, status: 'removed' as const };
        this.changed.emit({ file: gone, fileList: next });
        this.remove.emit(gone);
      }
      for (const entry of entries) {
        this.changed.emit({ file: entry, fileList: next });
      }
      if (this.autoUpload()) {
        for (const entry of entries) {
          void this.startUpload(entry);
        }
      }
    }

    // The field variant shows no list, so additions are announced; rejections follow.
    const notices: string[] = [];
    if (this.isField() && approved.length > 0) {
      notices.push(
        ...approved.map(({ file }) =>
          formatMessage(this.msg().announceAdded, { name: file.name }),
        ),
      );
    }
    if (rejections.length > 0) {
      this.rejected.emit(rejections);
      notices.push(this.describeRejections(rejections));
    }
    if (notices.length > 0) {
      this.announce(notices.join('. '));
    }
    if (source === 'select' || approved.length > 0) {
      this.onTouched();
    }
  }

  /** Sends every file still waiting as `ready`. */
  submit(): void {
    for (const file of this.fileList()) {
      if ((file.status ?? 'done') === 'ready' && file.originFileObj) {
        const started = this.patch(file.uid, {
          status: 'uploading',
          percent: 0,
        });
        if (started) {
          void this.startUpload(started);
        }
      }
    }
  }

  /** Sends a failed file again. */
  retryFile(target: AndesUploadFile | string): void {
    const file = this.find(target);
    if (!file?.originFileObj || this.isDisabled()) {
      return;
    }
    const started = this.patch(file.uid, {
      status: 'uploading',
      percent: 0,
      error: undefined,
      errorMessage: undefined,
    });
    if (started) {
      void this.startUpload(started);
    }
  }

  /**
   * Takes a file out of the list, cancelling its request. `beforeRemove` can veto it.
   * Resolves `true` when the file was removed.
   */
  async removeFile(target: AndesUploadFile | string): Promise<boolean> {
    const removed = await this.removeEntry(target);
    if (removed) {
      this.announce(
        formatMessage(this.msg().announceRemoved, { name: removed.name }),
      );
    }
    return removed !== undefined;
  }

  /** Asks `beforeRemove`; a `false` answer or a rejection keeps the file. */
  private async mayRemove(file: AndesUploadFile): Promise<boolean> {
    const hook = this.beforeRemove();
    if (!hook) {
      return true;
    }
    try {
      return (await hook(file)) !== false;
    } catch {
      return false;
    }
  }

  /** Removes one file (vetoable, cancelling its request) without announcing it. */
  private async removeEntry(
    target: AndesUploadFile | string,
  ): Promise<AndesUploadFile | undefined> {
    const file = this.find(target);
    if (!file || this.isDisabled()) {
      return undefined;
    }
    // Awaiting only when there is a hook keeps a plain removal synchronous.
    if (this.beforeRemove() && !(await this.mayRemove(file))) {
      return undefined;
    }
    if (this.destroyed || !this.find(file.uid)) {
      return undefined;
    }
    this.cancelAttempt(file.uid);
    const gone = { ...file, status: 'removed' as const };
    const before = this.fileList();
    const next = before.filter((entry) => entry.uid !== file.uid);
    // Decided before the list changes: once the row is gone there is nothing left to ask.
    const refocus = this.holdsFocus(file.uid);
    this.fileList.set(next);
    if (refocus) {
      this.moveFocusAfterRemoval(before, file.uid);
    }
    this.onChange(next);
    this.changed.emit({ file: gone, fileList: next });
    this.remove.emit(gone);
    this.onTouched();
    return file;
  }

  /** Stops a running upload; the file stays in the list as failed. */
  abortFile(target: AndesUploadFile | string): void {
    const file = this.find(target);
    if (!file || (file.status ?? 'done') !== 'uploading') {
      return;
    }
    this.cancelAttempt(file.uid);
    this.patch(file.uid, {
      status: 'error',
      error: new AndesUploadCancelledError(),
    });
  }

  /* ---------------------------------------------------------- template hooks */

  protected onTriggerClick(event: MouseEvent): void {
    const input = this.fileInput()?.nativeElement;
    if (
      !input ||
      event.target === input ||
      !this.openFileDialogOnClick() ||
      this.triggerBlocked()
    ) {
      return;
    }
    input.click();
  }

  protected onInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    input.value = '';
    void this.addFiles(files, 'select');
  }

  protected onDragEnter(event: DragEvent): void {
    if (!this.acceptsDrop() || this.triggerBlocked() || !hasFiles(event)) {
      return;
    }
    event.preventDefault();
    this.dragDepth++;
    this.dragging.set(true);
  }

  protected onDragOver(event: DragEvent): void {
    if (!this.acceptsDrop() || !hasFiles(event)) {
      return;
    }
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = this.triggerBlocked() ? 'none' : 'copy';
    }
  }

  protected onDragLeave(): void {
    this.dragDepth = Math.max(0, this.dragDepth - 1);
    if (this.dragDepth === 0) {
      this.dragging.set(false);
    }
  }

  protected onDrop(event: DragEvent): void {
    if (!this.acceptsDrop()) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    this.dragDepth = 0;
    this.dragging.set(false);
    if (this.triggerBlocked()) {
      return;
    }
    this.dropped.emit(event);
    const transfer = event.dataTransfer;
    if (transfer) {
      void readDroppedFiles(transfer, { directory: this.directory() }).then(
        (files) => this.addFiles(files, 'drop'),
      );
    }
  }

  protected onPaste(event: ClipboardEvent): void {
    if (!this.allowPaste() || this.triggerBlocked()) {
      return;
    }
    const files = Array.from(event.clipboardData?.files ?? []);
    if (files.length > 0) {
      event.preventDefault();
      void this.addFiles(files, 'paste');
    }
  }

  protected onPointerEnter(): void {
    this.hovered.set(true);
  }

  protected onPointerLeave(): void {
    this.hovered.set(false);
  }

  /**
   * The files of a paste that reached the document, or `null` when it is not ours to take: when
   * something already handled it (an upload that holds the focus took it first), when it carries
   * no files, when it brings text into a text field, or when it happened inside an upload.
   */
  private documentPasteFiles(event: ClipboardEvent): File[] | null {
    const data = event.clipboardData;
    const files = Array.from(data?.files ?? []);
    if (event.defaultPrevented || files.length === 0) {
      return null;
    }
    const target = event.target as Element | null;
    const carriesText = Array.from(data?.types ?? []).some((type) =>
      type.startsWith('text/'),
    );
    if (carriesText && isTextEditing(target)) {
      return null;
    }
    if (target?.closest?.('[data-slot="upload"]')) {
      return null;
    }
    return files;
  }

  /**
   * A paste made while the pointer is over the control (`pasteScope="control"`), whatever holds
   * the focus. The same guards as a page-wide paste apply.
   */
  private onHoverPaste(event: ClipboardEvent): void {
    const files = this.documentPasteFiles(event);
    if (!files || !this.canTakePaste('control')) {
      return;
    }
    event.preventDefault();
    void this.addFiles(files, 'paste');
  }

  /**
   * A paste anywhere on the page (`pasteScope="page"`): the first eligible page-wide upload in
   * document order takes the files, unless a hovered control is eligible, which takes them.
   */
  private onPagePaste(
    event: ClipboardEvent,
    uploads: ReadonlySet<AndesUploadBase>,
  ): void {
    const files = this.documentPasteFiles(event);
    if (!files) {
      return;
    }
    const hovered = hoveredUploads.get(this.document);
    if (
      hovered &&
      [...hovered].some((upload) => upload.canTakePaste('control'))
    ) {
      return;
    }
    const first = [...uploads]
      .filter((upload) => upload.canTakePaste('page'))
      .sort((a, b) =>
        // 4 is Node.DOCUMENT_POSITION_FOLLOWING, spelled out for servers without `Node`.
        a.host.nativeElement.compareDocumentPosition(b.host.nativeElement) & 4
          ? -1
          : 1,
      )[0];
    if (first !== this) {
      return;
    }
    event.preventDefault();
    void this.addFiles(files, 'paste');
  }

  /** Whether this control can take a paste of that scope from the document now. */
  private canTakePaste(scope: AndesUploadPasteScope): boolean {
    const host = this.host.nativeElement;
    return (
      !this.destroyed &&
      this.allowPaste() &&
      this.pasteScope() === scope &&
      (scope === 'page' || this.hovered()) &&
      !this.triggerBlocked() &&
      host.isConnected &&
      // Behind a modal (a dialog, the image viewer) the page is inert and takes no files.
      !host.closest('[inert]')
    );
  }

  protected onFocusOut(event: FocusEvent): void {
    const host = event.currentTarget as HTMLElement;
    if (!host.contains(event.relatedTarget as Node | null)) {
      this.onTouched();
    }
  }

  protected onPreviewClick(file: AndesUploadFile, event: Event | null): void {
    const preview = new AndesUploadItemEvent(file, event);
    this.preview.emit(preview);
    if (preview.defaultPrevented || this.openViewer(file)) {
      return;
    }
    const url = file.url;
    if (url && this.isOpenable(url)) {
      globalThis.open?.(url, '_blank', 'noopener,noreferrer');
    } else {
      this.openLocal(file);
    }
  }

  /**
   * The thumbnail of a `picture` row opens the preview like its name does (the name is the
   * keyboard way in; the thumbnail is the bigger target for a pointer).
   */
  protected onThumbClick(item: AndesUploadItemView, event: MouseEvent): void {
    if (this.listType() === 'picture' && item.previewable) {
      this.onPreviewClick(item.file, event);
    }
  }

  /**
   * The linked name of an uploaded file. A plain click is a preview: it emits `preview` and
   * opens a picture in the viewer; otherwise (or with `preventDefault()`) the link is followed
   * or not. A click with a modifier key or another button is left to the browser.
   */
  protected onNameClick(file: AndesUploadFile, event: MouseEvent): void {
    if (
      event.button !== 0 ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }
    const preview = new AndesUploadItemEvent(file, event);
    this.preview.emit(preview);
    if (preview.defaultPrevented || this.openViewer(file)) {
      event.preventDefault();
    }
  }

  /** The viewer moved to another picture. */
  protected onViewerCurrent(index: number): void {
    this.viewerUid.set(this.viewerFiles()[index]?.uid ?? null);
  }

  /**
   * Focus went back to the preview action that opened the viewer; if the user paged to another
   * picture since, that one's action is the better place to land.
   */
  protected onViewerClosed(): void {
    const shown = this.viewerUid();
    const opener = this.viewerOpener;
    this.viewerOpener = null;
    const row = shown && shown !== opener ? this.itemElement(shown) : undefined;
    (
      row?.querySelector<HTMLElement>('[data-action="preview"]') ??
      row?.querySelector<HTMLElement>('.andes-upload__name--link')
    )?.focus();
  }

  protected onDownloadClick(file: AndesUploadFile, event: Event | null): void {
    const download = new AndesUploadItemEvent(file, event);
    this.download.emit(download);
    if (download.defaultPrevented) {
      event?.preventDefault();
    }
  }

  protected onRemoveClick(file: AndesUploadFile): void {
    void this.removeFile(file);
  }

  /**
   * The field row's clear button: removes every file through `removeFile`'s path (each one
   * vetoable by `beforeRemove`), announces the removals together and returns focus to the
   * file input, since the button itself goes away.
   */
  protected async onClearClick(event: MouseEvent): Promise<void> {
    // The row forwards clicks to the file dialog; this one must not open it.
    event.stopPropagation();
    const names: string[] = [];
    for (const file of [...this.fileList()]) {
      const removed = await this.removeEntry(file);
      if (removed) {
        names.push(
          formatMessage(this.msg().announceRemoved, { name: removed.name }),
        );
      }
    }
    if (names.length > 0) {
      this.announce(names.join('. '));
    }
    if (this.fileList().length === 0 && !this.destroyed) {
      // After the render that removes the button and re-enables a full input.
      afterNextRender(() => this.focus(), { injector: this.injector });
    }
  }

  protected onRetryClick(file: AndesUploadFile): void {
    this.retryFile(file);
  }

  /* ------------------------------------------------------------------ internals */

  /** A URL the default preview may open: a web address or a blob, never `data:` or a script. */
  private isOpenable(url: string | undefined): boolean {
    return isNavigableUrl(url, this.document.baseURI || undefined);
  }

  /** Whether a browser can show this chosen file in a tab (and nothing in it can run). */
  private isBlobOpenable(file: AndesUploadFile): boolean {
    const source = file.originFileObj;
    return !!source && BLOB_OPENABLE.test(source.type || file.type || '');
  }

  /** Opens a file that was just chosen (it has no address yet) in a new tab, from the file. */
  private openLocal(file: AndesUploadFile): void {
    const source = file.originFileObj;
    if (
      !source ||
      !this.isBlobOpenable(file) ||
      typeof URL === 'undefined' ||
      !URL.createObjectURL
    ) {
      return;
    }
    const url = URL.createObjectURL(source);
    this.openedUrls.add(url);
    globalThis.open?.(url, '_blank', 'noopener,noreferrer');
  }

  /** A URL the image viewer may draw: a web, blob or `data:image` address. */
  private isDrawable(url: string | undefined): url is string {
    return isImageSource(url, this.document.baseURI || undefined);
  }

  /**
   * Opens the viewer on a picture of the list, over every picture it can show. `false` when
   * the viewer is off or cannot show this file, so the caller falls back to the new tab.
   */
  private openViewer(file: AndesUploadFile): boolean {
    if (!this.viewerOn() || !this.isPicture(file)) {
      return false;
    }
    this.ensureViewerSources();
    if (!this.viewerFiles().some((item) => item.uid === file.uid)) {
      return false;
    }
    this.viewerOpener = file.uid;
    this.viewerUid.set(file.uid);
    this.viewerOpen.set(true);
    return true;
  }

  /**
   * What the viewer shows for a picture: its address, else the chosen file itself, else its
   * thumbnail. The file comes before the thumbnail, which `previewFile` may have shrunk.
   */
  private viewSourceOf(file: AndesUploadFile): string | undefined {
    if (this.isDrawable(file.url)) {
      return file.url;
    }
    const original = this.originals()[file.uid];
    if (original) {
      return original;
    }
    const thumb = file.thumbUrl ?? this.thumbs()[file.uid];
    return this.isDrawable(thumb) ? thumb : undefined;
  }

  /** Gives every chosen picture without an address an object URL the viewer can show. */
  private ensureViewerSources(): void {
    if (typeof URL === 'undefined' || !URL.createObjectURL) {
      return;
    }
    let changed = false;
    for (const file of this.fileList()) {
      const source = file.originFileObj;
      if (!source || this.isDrawable(file.url) || !this.isPicture(file)) {
        continue;
      }
      const thumb = this.thumbEntries.get(file.uid);
      if (
        (thumb?.owned && thumb.source === source) ||
        this.viewerSources.get(file.uid)?.source === source
      ) {
        continue;
      }
      this.dropViewerSource(file.uid);
      this.viewerSources.set(file.uid, {
        url: URL.createObjectURL(source),
        source,
        owned: true,
      });
      changed = true;
    }
    if (changed) {
      this.publishThumbs();
    }
  }

  private dropViewerSource(uid: string): void {
    const entry = this.viewerSources.get(uid);
    this.viewerSources.delete(uid);
    if (entry?.url) {
      URL.revokeObjectURL(entry.url);
    }
  }

  /** The row of one file, if it is rendered. */
  private itemElement(uid: string): HTMLElement | undefined {
    return Array.from(
      this.host.nativeElement.querySelectorAll<HTMLElement>(
        '[data-slot="upload-item"]',
      ),
    ).find((element) => element.getAttribute('data-uid') === uid);
  }

  /** Whether the keyboard focus sits inside the row of this file. */
  private holdsFocus(uid: string): boolean {
    const active = this.document.activeElement;
    return !!active && !!this.itemElement(uid)?.contains(active);
  }

  /**
   * The row that had the focus is going away, and with it the focus (it would fall back to the
   * page). Moves it to the same action of the next row, else the previous one, else the file
   * input. The neighbour is already on screen, so this happens before the removed row starts
   * (or finishes) leaving; the input may still be disabled or hidden until the next render.
   */
  private moveFocusAfterRemoval(
    before: readonly AndesUploadFile[],
    uid: string,
  ): void {
    const index = before.findIndex((entry) => entry.uid === uid);
    for (const neighbour of [before[index + 1], before[index - 1]]) {
      const row = neighbour ? this.itemElement(neighbour.uid) : undefined;
      const target =
        row?.querySelector<HTMLElement>('[data-action="remove"]') ??
        row?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
      if (target) {
        target.focus();
        return;
      }
    }
    afterNextRender(
      () => {
        if (!this.destroyed) {
          this.focus();
        }
      },
      { injector: this.injector },
    );
  }

  private find(target: AndesUploadFile | string): AndesUploadFile | undefined {
    const uid = typeof target === 'string' ? target : target.uid;
    return this.fileList().find((file) => file.uid === uid);
  }

  /** How many more files `maxCount` lets in (replacing mode always has room for one). */
  private roomLeft(): number {
    const max = this.maxCount();
    if (max === undefined) {
      return Infinity;
    }
    return max === 1 ? 1 : Math.max(0, max - this.fileList().length);
  }

  private trimToRoom(
    files: File[],
    rejections: AndesUploadRejection[],
  ): File[] {
    const room = this.roomLeft();
    if (files.length <= room) {
      return files;
    }
    rejections.push(
      ...files.slice(room).map((file) => ({ file, reason: 'count' as const })),
    );
    return files.slice(0, room);
  }

  /**
   * Why a file failed, in the control's language: the file's own `errorMessage`, else the text
   * for the kind of failure the transport or `abortFile()` reported, else any other error's
   * message, else the generic one.
   */
  private errorTextOf(file: AndesUploadFile): string {
    const messages = this.msg();
    if (file.errorMessage) {
      return file.errorMessage;
    }
    const error = file.error;
    if (error instanceof AndesUploadCancelledError) {
      return formatMessage(messages.uploadCancelled);
    }
    if (error instanceof AndesUploadHttpError) {
      switch (error.kind) {
        case 'network':
          return formatMessage(messages.networkError);
        case 'timeout':
          return formatMessage(messages.timeout);
        default:
          return formatMessage(messages.httpError, { status: error.status });
      }
    }
    return error instanceof Error && error.message
      ? error.message
      : formatMessage(messages.uploadFailed);
  }

  private describeRejections(rejections: AndesUploadRejection[]): string {
    const messages = this.msg();
    const reasons: Record<AndesUploadRejection['reason'], string> = {
      accept: formatMessage(messages.rejectAccept),
      size: formatMessage(messages.rejectSize, {
        max: formatFileSize(this.maxSize() ?? 0),
      }),
      count: formatMessage(messages.rejectCount, {
        count: this.maxCount() ?? 1,
      }),
      'before-upload': formatMessage(messages.rejectBefore),
    };
    return rejections
      .map(({ file, reason }) =>
        formatMessage(messages.announceRejected, {
          name: file.name,
          reason: reasons[reason],
        }),
      )
      .join('. ');
  }

  private announce(message: string): void {
    // The same text twice in a row would not be announced again; a trailing no-break space
    // makes it a new string without changing what is read.
    this.announceFlip = !this.announceFlip;
    this.announcement.set(this.announceFlip ? message : `${message}\u00a0`);
  }

  /** Replaces one entry, updates every listener, and returns the new entry. */
  private patch(
    uid: string,
    changes: Partial<AndesUploadFile>,
    event?: { percent: number },
  ): AndesUploadFile | undefined {
    const list = this.fileList();
    const index = list.findIndex((file) => file.uid === uid);
    if (index < 0) {
      return undefined;
    }
    const updated = { ...list[index], ...changes };
    const next = list.map((file, i) => (i === index ? updated : file));
    this.fileList.set(next);
    // A progress tick that changes no state is not news for the form control.
    const stateChanged =
      (list[index].status ?? 'done') !== (updated.status ?? 'done');
    if (!event || stateChanged || this.emitProgressToForm()) {
      this.onChange(next);
    }
    this.changed.emit({ file: updated, fileList: next, event });
    return updated;
  }

  private cancelAttempt(uid: string): void {
    this.attempts.delete(uid);
    const handle = this.handles.get(uid);
    this.handles.delete(uid);
    handle?.abort();
  }

  private fail(uid: string, error: unknown, response?: unknown): void {
    const file = this.patch(uid, {
      status: 'error',
      error,
      ...(response === undefined ? {} : { response }),
    });
    if (file) {
      this.announce(
        formatMessage(this.msg().announceFailed, { name: file.name }),
      );
    }
  }

  private async startUpload(entry: AndesUploadFile): Promise<void> {
    const uid = entry.uid;
    const file = entry.originFileObj;
    if (!file) {
      return;
    }
    const attempt = {};
    this.attempts.set(uid, attempt);
    const alive = () => this.attempts.get(uid) === attempt && !this.destroyed;

    let action: string;
    let data: Record<string, unknown>;
    try {
      const actionInput = this.action();
      action =
        typeof actionInput === 'function'
          ? await actionInput(entry)
          : (actionInput ?? '');
      const dataInput = this.data();
      data =
        typeof dataInput === 'function'
          ? await dataInput(entry)
          : (dataInput ?? {});
    } catch (error) {
      if (alive()) {
        this.attempts.delete(uid);
        this.fail(uid, error);
      }
      return;
    }
    if (!alive()) {
      return;
    }

    const transport = this.customRequest() ?? xhrUploadRequest;
    if (!this.customRequest() && !action) {
      this.attempts.delete(uid);
      this.fail(
        uid,
        new Error('andes-upload needs an `action` URL or a `customRequest`.'),
      );
      return;
    }

    const options: AndesUploadRequestOptions = {
      action,
      method: this.method(),
      headers: this.headers(),
      data,
      withCredentials: this.withCredentials(),
      filename: this.name(),
      file,
      uploadFile: entry,
      onProgress: (percent) => {
        if (alive()) {
          this.patch(
            uid,
            {
              percent: Math.max(0, Math.min(100, percent)),
              status: 'uploading',
            },
            { percent },
          );
        }
      },
      onSuccess: (response) => {
        if (!alive()) {
          return;
        }
        this.attempts.delete(uid);
        this.handles.delete(uid);
        const done = this.patch(uid, {
          status: 'done',
          percent: 100,
          response,
          error: undefined,
          errorMessage: undefined,
        });
        if (done) {
          this.announce(
            formatMessage(this.msg().announceUploaded, { name: done.name }),
          );
        }
      },
      onError: (error, response) => {
        if (!alive()) {
          return;
        }
        this.attempts.delete(uid);
        this.handles.delete(uid);
        this.fail(uid, error, response);
      },
    };

    let handle: ReturnType<AndesUploadRequest>;
    try {
      handle = transport(options);
    } catch (error) {
      if (alive()) {
        this.attempts.delete(uid);
        this.fail(uid, error);
      }
      return;
    }
    if (alive() && handle) {
      this.handles.set(
        uid,
        typeof handle === 'function' ? { abort: handle } : handle,
      );
    }
  }

  /* -------------------------------------------------------------- thumbnails */

  private isPicture(file: AndesUploadFile): boolean {
    return (
      this.isImage()?.(file) ??
      isImageFile({ name: file.name, type: file.type, url: file.url })
    );
  }

  private syncThumbs(
    list: AndesUploadFile[],
    listType: AndesUploadListType,
  ): void {
    const wanted = new Set<string>();
    let changed = false;
    const custom = this.previewFile();
    if (listType !== 'text') {
      for (const file of list) {
        const source = file.originFileObj;
        // A custom `previewFile` is asked for every file; the default only draws pictures.
        if (file.thumbUrl || !source || (!custom && !this.isPicture(file))) {
          continue;
        }
        wanted.add(file.uid);
        const existing = this.thumbEntries.get(file.uid);
        if (existing?.source === source) {
          continue;
        }
        if (existing) {
          this.dropThumb(file.uid);
        }
        changed = true;
        if (custom) {
          const entry: ThumbEntry = { url: undefined, source, owned: false };
          this.thumbEntries.set(file.uid, entry);
          custom(source).then(
            (url) => {
              if (
                this.thumbEntries.get(file.uid) === entry &&
                !this.destroyed
              ) {
                entry.url = url;
                this.publishThumbs();
              }
            },
            () => undefined,
          );
        } else if (typeof URL !== 'undefined' && URL.createObjectURL) {
          this.thumbEntries.set(file.uid, {
            url: URL.createObjectURL(source),
            source,
            owned: true,
          });
        }
      }
    }
    for (const uid of [...this.thumbEntries.keys()]) {
      if (!wanted.has(uid)) {
        this.dropThumb(uid);
        changed = true;
      }
    }
    // The viewer's object URLs go with their file, or when it was replaced by another blob.
    const sources = new Map(list.map((file) => [file.uid, file.originFileObj]));
    for (const [uid, entry] of [...this.viewerSources]) {
      if (sources.get(uid) !== entry.source) {
        this.dropViewerSource(uid);
        changed = true;
      }
    }
    if (changed) {
      this.publishThumbs();
    }
  }

  private dropThumb(uid: string): void {
    const entry = this.thumbEntries.get(uid);
    this.thumbEntries.delete(uid);
    if (entry?.owned && entry.url) {
      URL.revokeObjectURL(entry.url);
    }
  }

  private publishThumbs(): void {
    const record: Record<string, string> = {};
    const originals: Record<string, string> = {};
    for (const [uid, entry] of this.thumbEntries) {
      if (entry.url) {
        record[uid] = entry.url;
        if (entry.owned) {
          originals[uid] = entry.url;
        }
      }
    }
    for (const [uid, entry] of this.viewerSources) {
      if (entry.url) {
        originals[uid] = entry.url;
      }
    }
    this.thumbs.set(record);
    this.originals.set(originals);
  }

  /* ------------------------------------------------------------------- views */

  private toView(
    file: AndesUploadFile,
    list: AndesUploadFile[],
  ): AndesUploadItemView {
    const messages = this.msg();
    const config = this.listConfig();
    const status = file.status ?? 'done';
    const picture = this.isPicture(file);
    const thumb =
      this.listType() === 'text'
        ? undefined
        : (file.thumbUrl ??
          this.thumbs()[file.uid] ??
          (picture ? file.url : undefined));
    const percent = Math.round(file.percent ?? 0);
    const name = { name: file.name };

    let caption = '';
    if (status === 'uploading') {
      const progress = this.progress();
      if (progress?.showInfo !== false) {
        caption = progress?.format
          ? progress.format(percent, file)
          : `${percent}%`;
      }
    } else if (status === 'ready') {
      caption = formatMessage(messages.ready);
    } else if (status !== 'error' && config.fileSize && file.size != null) {
      caption = formatFileSize(file.size);
    }
    const errorText = status === 'error' ? this.errorTextOf(file) : undefined;
    const viewer = this.viewerOn() && picture;
    const viewSrc = viewer ? this.viewSourceOf(file) : undefined;
    // A chosen picture has no address yet; the viewer makes one for it when it opens.
    const viewable = viewer && (!!viewSrc || !!file.originFileObj);

    // A picture opens in the viewer, which can draw a thumbnail or the chosen file too. Any
    // other file needs a web or blob address to open, or to be a chosen file a browser shows.
    const previewable =
      status !== 'uploading' &&
      (viewable || this.isOpenable(file.url) || this.isBlobOpenable(file));

    const disabled = this.isDisabled();
    // A failed file keeps its icon and turns red, like Ant's; the message is the tooltip.
    const icon: AndesUploadIconName =
      status === 'uploading'
        ? 'loading'
        : this.listType() === 'text'
          ? 'paperclip'
          : picture
            ? 'image'
            : 'file';

    const ctx: AndesUploadItemContext = {
      $implicit: file,
      file,
      fileList: list,
      listType: this.listType(),
      status,
      thumbUrl: thumb,
      preview: () => this.onPreviewClick(file, null),
      download: () => this.onDownloadClick(file, null),
      remove: () => this.onRemoveClick(file),
      retry: () => this.onRetryClick(file),
    };

    return {
      uid: file.uid,
      file,
      status,
      percent,
      thumb,
      icon,
      caption,
      extra: config.extra?.(file) ?? '',
      errorText,
      viewSrc,
      previewable,
      canPreview: flagged(config.preview, file) && previewable,
      canDownload:
        flagged(config.download, file) && !!file.url && status === 'done',
      canRetry:
        config.retry && status === 'error' && !!file.originFileObj && !disabled,
      canRemove: flagged(config.remove, file) && !disabled,
      labels: {
        preview: formatMessage(messages.preview, name),
        download: formatMessage(messages.download, name),
        remove: formatMessage(messages.remove, name),
        retry: formatMessage(messages.retry, name),
        uploading: formatMessage(messages.uploading, name),
      },
      ctx,
      iconCtx: {
        $implicit: file,
        file,
        listType: this.listType(),
        status,
        thumbUrl: thumb,
      },
    };
  }
}
