import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { Component, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';

import { declaredValue } from '../../testing/computed-style';
import { AndesButton } from '../button/button';
import { AndesUpload, AndesUploadDragger } from './upload';
import { andesUploadMaxFiles, andesUploadSettled } from './upload-forms';
import {
  AndesUploadCancelledError,
  AndesUploadHttpError,
  AndesUploadItemEvent,
  type AndesUploadBeforeRemove,
  type AndesUploadBeforeUpload,
  type AndesUploadChangeEvent,
  type AndesUploadFile,
  type AndesUploadListOptions,
  type AndesUploadListType,
  type AndesUploadMessages,
  type AndesUploadRejection,
  type AndesUploadRequest,
  type AndesUploadRequestOptions,
} from './upload-types';

/* ---------------------------------------------------------------- test hosts */

@Component({
  imports: [AndesUpload],
  template: `<andes-upload
      #upload
      [(fileList)]="files"
      [action]="action()"
      [method]="method()"
      [headers]="headers()"
      [data]="data()"
      [name]="fieldName()"
      [customRequest]="customRequest()"
      [autoUpload]="autoUpload()"
      [accept]="accept()"
      [multiple]="multiple()"
      [directory]="directory()"
      [maxCount]="maxCount()"
      [maxSize]="maxSize()"
      [disabled]="disabled()"
      [allowPaste]="allowPaste()"
      [openFileDialogOnClick]="openOnClick()"
      [beforeUpload]="beforeUpload()"
      [beforeRemove]="beforeRemove()"
      [listType]="listType()"
      [showUploadList]="showList()"
      [itemRender]="custom() ? itemTpl : undefined"
      [iconRender]="custom() ? iconTpl : undefined"
      [previewFile]="previewFile()"
      [messages]="messages()"
      [id]="id()"
      [aria-label]="ariaLabel()"
      [aria-labelledby]="labelledBy()"
      [aria-describedby]="describedBy()"
      [aria-invalid]="invalid()"
      (changed)="changes.push($event)"
      (preview)="onPreview($event)"
      (download)="onDownload($event)"
      (remove)="removed.push($event)"
      (rejected)="rejections.push($event)"
    >
      @if (withContent()) {
        <button type="button" class="trigger">Choose files</button>
      }
    </andes-upload>
    <ng-template #itemTpl let-file let-remove="remove">
      <span class="custom-item">{{ file.name }}</span>
      <button type="button" class="custom-remove" (click)="remove()">x</button>
    </ng-template>
    <ng-template #iconTpl let-file>
      <i class="custom-icon">{{ file.name.length }}</i>
    </ng-template>`,
})
class HostComponent {
  readonly upload = viewChild.required<AndesUpload>('upload');
  readonly files = signal<AndesUploadFile[]>([]);
  readonly action = signal<
    string | ((f: AndesUploadFile) => string | Promise<string>) | undefined
  >('/api/files');
  readonly method = signal('POST');
  readonly headers = signal<Record<string, string>>({});
  readonly data = signal<
    | Record<string, unknown>
    | ((f: AndesUploadFile) => Record<string, unknown>)
    | undefined
  >(undefined);
  readonly fieldName = signal('file');
  readonly customRequest = signal<AndesUploadRequest | undefined>(undefined);
  readonly autoUpload = signal(true);
  readonly accept = signal<string | undefined>(undefined);
  readonly multiple = signal(true);
  readonly directory = signal(false);
  readonly maxCount = signal<number | undefined>(undefined);
  readonly maxSize = signal<number | undefined>(undefined);
  readonly disabled = signal(false);
  readonly allowPaste = signal(true);
  readonly openOnClick = signal(true);
  readonly beforeUpload = signal<AndesUploadBeforeUpload | undefined>(
    undefined,
  );
  readonly beforeRemove = signal<AndesUploadBeforeRemove | undefined>(
    undefined,
  );
  readonly listType = signal<AndesUploadListType>('text');
  readonly showList = signal<boolean | AndesUploadListOptions>(true);
  readonly custom = signal(false);
  readonly previewFile = signal<
    ((f: File | Blob) => Promise<string>) | undefined
  >(undefined);
  readonly messages = signal<Partial<AndesUploadMessages> | undefined>(
    undefined,
  );
  readonly id = signal<string | undefined>(undefined);
  readonly ariaLabel = signal<string | undefined>(undefined);
  readonly labelledBy = signal<string | undefined>(undefined);
  readonly describedBy = signal<string | undefined>(undefined);
  readonly invalid = signal(false);
  readonly withContent = signal(true);

  changes: AndesUploadChangeEvent[] = [];
  removed: AndesUploadFile[] = [];
  rejections: AndesUploadRejection[][] = [];
  previews: AndesUploadItemEvent[] = [];
  downloads: AndesUploadItemEvent[] = [];
  preventPreview = false;
  preventDownload = false;

  onPreview(event: AndesUploadItemEvent): void {
    this.previews.push(event);
    if (this.preventPreview) {
      event.preventDefault();
    }
  }

  onDownload(event: AndesUploadItemEvent): void {
    this.downloads.push(event);
    if (this.preventDownload) {
      event.preventDefault();
    }
  }
}

@Component({
  imports: [AndesUploadDragger],
  template: `<div (drop)="nativeDrops = nativeDrops + 1">
    <andes-upload-dragger
      #dragger
      action="/api/files"
      [multiple]="true"
      [disabled]="disabled()"
      [dropTitle]="title()"
      [dropHint]="hint()"
      (dropped)="drops.push($event)"
      (rejected)="rejections.push($event)"
    />
  </div>`,
})
class DraggerHost {
  readonly dragger = viewChild.required<AndesUploadDragger>('dragger');
  readonly disabled = signal(false);
  readonly title = signal<string | undefined>(undefined);
  readonly hint = signal<string | undefined>(undefined);
  drops: DragEvent[] = [];
  rejections: AndesUploadRejection[][] = [];
  nativeDrops = 0;
}

@Component({
  imports: [AndesUpload, ReactiveFormsModule],
  template: `<andes-upload
    [formControl]="control"
    [customRequest]="request"
    [multiple]="true"
    ><button type="button">Choose</button></andes-upload
  >`,
})
class FormHost {
  readonly control = new FormControl<AndesUploadFile[]>([], {
    validators: [
      Validators.required,
      andesUploadSettled(),
      andesUploadMaxFiles(2),
    ],
  });
  readonly upload = viewChild.required(AndesUpload);
  options: AndesUploadRequestOptions[] = [];
  readonly request: AndesUploadRequest = (options) => {
    this.options.push(options);
  };
}

@Component({
  imports: [AndesUpload, ReactiveFormsModule],
  template: `<andes-upload
    [formControl]="control"
    [customRequest]="request"
    [emitProgressToForm]="emitProgress()"
    ><button type="button">Choose</button></andes-upload
  >`,
})
class ProgressFormHost {
  readonly control = new FormControl<AndesUploadFile[]>([]);
  readonly emitProgress = signal(false);
  options: AndesUploadRequestOptions[] = [];
  readonly request: AndesUploadRequest = (options) => {
    this.options.push(options);
  };
}

@Component({
  imports: [AndesUpload, AndesUploadDragger, AndesButton],
  template: `<andes-upload class="plain" [disabled]="disabled()" [maxCount]="1">
      <andes-button class="projected-button">Pick</andes-button>
    </andes-upload>
    <andes-upload-dragger class="drag" [disabled]="disabled()">
      <andes-button class="dragger-button">Pick</andes-button>
    </andes-upload-dragger>
    <andes-button class="outside-button">Outside</andes-button>`,
})
class ButtonsHost {
  readonly disabled = signal(false);
}

/* ------------------------------------------------------------------- helpers */

const png = (name = 'photo.png', size = 100) =>
  new File([new Uint8Array(size)], name, { type: 'image/png' });
const pdf = (name = 'invoice.pdf', size = 100) =>
  new File([new Uint8Array(size)], name, { type: 'application/pdf' });

let active: { detectChanges(): void; nativeElement: HTMLElement };

/** Applies pending input changes, then simulates choosing files in the picker. */
function pick(files: File[]) {
  active.detectChanges();
  choose(
    active.nativeElement.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement,
    files,
  );
}

function setup() {
  const fixture = TestBed.createComponent(HostComponent);
  active = fixture;
  const host = fixture.componentInstance;
  const requests: AndesUploadRequestOptions[] = [];
  const aborted: string[] = [];
  host.customRequest.set((options) => {
    requests.push(options);
    return { abort: () => aborted.push(options.uploadFile.uid) };
  });
  fixture.detectChanges();
  const root = fixture.nativeElement as HTMLElement;
  return {
    fixture,
    host,
    root,
    requests,
    aborted,
    upload: host.upload(),
    el: root.querySelector('andes-upload') as HTMLElement,
    input: () => root.querySelector('input[type="file"]') as HTMLInputElement,
    items: () =>
      Array.from(root.querySelectorAll<HTMLElement>('.andes-upload__item')),
    live: () =>
      root
        .querySelector('[role="status"]')
        ?.textContent?.replace(/\u00a0/g, '')
        .trim(),
    flush: async () => {
      await new Promise((resolve) => setTimeout(resolve));
      fixture.detectChanges();
    },
  };
}

function choose(input: HTMLInputElement, files: File[]) {
  Object.defineProperty(input, 'files', { value: files, configurable: true });
  input.dispatchEvent(new Event('change', { bubbles: true }));
}

function dragEvent(
  type: string,
  files: File[] = [],
  types: string[] = ['Files'],
) {
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.defineProperty(event, 'dataTransfer', {
    value: { types, files, dropEffect: 'none' },
  });
  return event;
}

describe('AndesUpload', () => {
  let created: string[];
  let revoked: string[];

  beforeEach(() => {
    created = [];
    revoked = [];
    let counter = 0;
    Object.assign(URL, {
      createObjectURL: vi.fn(() => {
        const url = `blob:mock-${++counter}`;
        created.push(url);
        return url;
      }),
      revokeObjectURL: vi.fn((url: string) => revoked.push(url)),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  describe('file input and trigger', () => {
    it('keeps a real, focusable, named file input behind the trigger', () => {
      const { input, host, fixture } = setup();
      host.accept.set('.png,.pdf');
      fixture.detectChanges();

      const el = input();
      expect(el.type).toBe('file');
      expect(el.getAttribute('aria-label')).toBe('Select files');
      expect(el.getAttribute('name')).toBe('file');
      expect(el.getAttribute('accept')).toBe('.png,.pdf');
      expect(el.multiple).toBe(true);
      expect(el.disabled).toBe(false);
      expect(el.getAttribute('tabindex')).toBeNull();
      expect(el.hidden).toBe(false);
    });

    it('forwards id and aria attributes to the input, not the host', () => {
      const { input, host, fixture, el } = setup();
      host.id.set('attachments');
      host.ariaLabel.set('Attachments');
      host.describedBy.set('help');
      host.invalid.set(true);
      fixture.detectChanges();

      expect(input().id).toBe('attachments');
      expect(input().getAttribute('aria-label')).toBe('Attachments');
      expect(input().getAttribute('aria-describedby')).toBe('help');
      expect(input().getAttribute('aria-invalid')).toBe('true');
      for (const attribute of [
        'id',
        'aria-label',
        'aria-describedby',
        'aria-invalid',
        'name',
      ]) {
        expect(el.getAttribute(attribute)).toBeNull();
      }

      host.labelledBy.set('label-1');
      fixture.detectChanges();
      expect(input().getAttribute('aria-labelledby')).toBe('label-1');
      expect(input().getAttribute('aria-label')).toBeNull();
    });

    it('opens the dialog when the projected trigger is clicked', () => {
      const { root, input } = setup();
      const click = vi.spyOn(input(), 'click');
      (root.querySelector('.trigger') as HTMLElement).click();
      expect(click).toHaveBeenCalledTimes(1);
    });

    it('does not reopen the dialog from the input\u2019s own click', () => {
      const { input } = setup();
      const click = vi.spyOn(input(), 'click');
      input().dispatchEvent(new MouseEvent('click', { bubbles: true }));
      expect(click).not.toHaveBeenCalled();
    });

    it('stays shut when disabled or when only open() may start a selection', () => {
      const { root, input, host, fixture, upload } = setup();
      const click = vi.spyOn(input(), 'click');
      host.disabled.set(true);
      fixture.detectChanges();
      (root.querySelector('.trigger') as HTMLElement).click();
      expect(click).not.toHaveBeenCalled();
      expect(input().disabled).toBe(true);
      expect(
        root
          .querySelector('.andes-upload__select')
          ?.hasAttribute('data-disabled'),
      ).toBe(true);

      host.disabled.set(false);
      host.openOnClick.set(false);
      fixture.detectChanges();
      (root.querySelector('.trigger') as HTMLElement).click();
      expect(click).not.toHaveBeenCalled();
      upload.open();
      expect(click).toHaveBeenCalledTimes(1);
    });

    it('leaves the file input as the only tab stop', () => {
      const { root } = setup();
      expect(
        (root.querySelector('.trigger') as HTMLElement).getAttribute(
          'tabindex',
        ),
      ).toBe('-1');
    });

    it('moves focus to the input with focus()', () => {
      const { upload, input } = setup();
      upload.focus();
      expect(document.activeElement).toBe(input());
    });

    it('draws a default trigger when nothing is projected', async () => {
      const { root, host, fixture, flush } = setup();
      expect(root.querySelector('.andes-upload__default')).toBeNull();
      host.withContent.set(false);
      fixture.detectChanges();
      // The slot is watched with a MutationObserver, which reports on a microtask.
      await flush();
      expect(
        root.querySelector('.andes-upload__default')?.textContent,
      ).toContain('Select files');
    });

    describe('default trigger', () => {
      async function withDefault() {
        const ctx = setup();
        ctx.host.withContent.set(false);
        ctx.fixture.detectChanges();
        await ctx.flush();
        const button = () =>
          ctx.root.querySelector('andes-button') as HTMLElement;
        const inner = () =>
          button().querySelector('button') as HTMLButtonElement;
        return { ...ctx, button, inner };
      }

      it('is an outline andes-button with the upload icon and the label', async () => {
        const { button, inner } = await withDefault();
        expect(button().classList).toContain('andes-upload__default');
        expect(inner().classList).toContain('andes-button--outline');
        expect(inner().classList).toContain('andes-button--md');
        expect(inner().textContent).toContain('Select files');
        expect(inner().querySelector('andes-upload-icon')).not.toBeNull();
      });

      it('keeps the file input as the one tab stop', async () => {
        const { inner, fixture, flush } = await withDefault();
        await flush();
        fixture.detectChanges();
        expect(inner().getAttribute('tabindex')).toBe('-1');
      });

      it('follows the size, the language and aria-invalid', async () => {
        const { host, fixture, inner } = await withDefault();
        host.messages.set({ selectFiles: 'Elegir' });
        host.invalid.set(true);
        fixture.detectChanges();
        expect(inner().textContent).toContain('Elegir');
        expect(inner().classList).toContain('andes-button--invalid');
        expect(inner().getAttribute('aria-invalid')).toBe('true');
      });

      it('is disabled with the upload, and while a full list refuses files', async () => {
        const { host, fixture, inner, flush } = await withDefault();
        expect(inner().disabled).toBe(false);
        host.disabled.set(true);
        fixture.detectChanges();
        expect(inner().disabled).toBe(true);

        host.disabled.set(false);
        host.maxCount.set(1);
        host.multiple.set(true);
        fixture.detectChanges();
        expect(inner().disabled).toBe(false);
        host.maxCount.set(2);
        host.files.set([
          { uid: 'a', name: 'a.pdf', status: 'done' },
          { uid: 'b', name: 'b.pdf', status: 'done' },
        ]);
        fixture.detectChanges();
        await flush();
        expect(inner().disabled).toBe(true);
      });
    });

    it('turns the input into a folder picker with `directory`', () => {
      const { input, host, fixture } = setup();
      host.directory.set(true);
      fixture.detectChanges();
      expect(input().hasAttribute('webkitdirectory')).toBe(true);
      expect(input().multiple).toBe(true);
    });

    it('lets the user choose the same file twice', () => {
      const { input } = setup();
      const el = input();
      Object.defineProperty(el, 'value', {
        value: 'C:/x.pdf',
        writable: true,
        configurable: true,
      });
      choose(el, [pdf()]);
      expect(el.value).toBe('');
    });
  });

  describe('adding files', () => {
    it('adds a chosen file and starts uploading it with the resolved options', async () => {
      const { host, requests, items, flush } = setup();
      host.method.set('PUT');
      host.headers.set({ Authorization: 'Bearer t' });
      host.data.set({ orderId: 7 });
      host.fieldName.set('document');
      pick([pdf('invoice.pdf', 2048)]);
      await flush();

      const [file] = host.files();
      expect(file).toMatchObject({
        name: 'invoice.pdf',
        size: 2048,
        type: 'application/pdf',
        status: 'uploading',
        percent: 0,
      });
      expect(file.uid).toMatch(/^andes-upload-/);
      expect(file.originFileObj).toBeInstanceOf(File);
      expect(items()).toHaveLength(1);
      expect(requests).toHaveLength(1);
      expect(requests[0]).toMatchObject({
        action: '/api/files',
        method: 'PUT',
        headers: { Authorization: 'Bearer t' },
        data: { orderId: 7 },
        filename: 'document',
        withCredentials: false,
      });
      expect(host.changes.at(0)?.file.uid).toBe(file.uid);
    });

    it('resolves `action` and `data` functions per file', async () => {
      const { host, requests, flush } = setup();
      host.action.set(async (f) => `/files/${f.name}`);
      host.data.set((f) => ({ label: f.name.toUpperCase() }));
      pick([pdf('a.pdf')]);
      await flush();
      expect(requests[0].action).toBe('/files/a.pdf');
      expect(requests[0].data).toEqual({ label: 'A.PDF' });
    });

    it('marks the file failed when there is nothing to send it with', async () => {
      const { host, flush, live } = setup();
      host.customRequest.set(undefined);
      host.action.set(undefined);
      pick([pdf('a.pdf')]);
      await flush();
      expect(host.files()[0].status).toBe('error');
      expect(live()).toContain('could not be uploaded');
    });

    it('rejects files that break `accept`, announcing why', async () => {
      const { host, fixture, flush, live } = setup();
      host.accept.set('.pdf');
      fixture.detectChanges();
      pick([png('a.png'), pdf('b.pdf')]);
      await flush();

      expect(host.files().map((f) => f.name)).toEqual(['b.pdf']);
      expect(host.rejections[0]).toEqual([
        { file: expect.objectContaining({ name: 'a.png' }), reason: 'accept' },
      ]);
      expect(live()).toBe('a.png was not added: this file type is not allowed');
    });

    it('rejects files over `maxSize`', async () => {
      const { host, fixture, flush, live } = setup();
      host.maxSize.set(1024 * 1024);
      fixture.detectChanges();
      pick([pdf('big.pdf', 2 * 1024 * 1024), pdf('ok.pdf', 10)]);
      await flush();

      expect(host.files().map((f) => f.name)).toEqual(['ok.pdf']);
      expect(host.rejections[0][0].reason).toBe('size');
      expect(live()).toContain('larger than 1 MB');
    });

    it('takes only the first file when `multiple` is off', async () => {
      const { host, fixture, flush } = setup();
      host.multiple.set(false);
      fixture.detectChanges();
      pick([pdf('a.pdf'), pdf('b.pdf')]);
      await flush();
      expect(host.files().map((f) => f.name)).toEqual(['a.pdf']);
      expect(host.rejections[0][0]).toMatchObject({ reason: 'count' });
    });

    it('trims to `maxCount` and blocks the input once full', async () => {
      const { input, host, fixture, flush } = setup();
      host.maxCount.set(2);
      fixture.detectChanges();
      pick([pdf('a.pdf'), pdf('b.pdf'), pdf('c.pdf')]);
      await flush();

      expect(host.files().map((f) => f.name)).toEqual(['a.pdf', 'b.pdf']);
      expect(host.rejections[0][0]).toMatchObject({ reason: 'count' });
      expect(input().disabled).toBe(true);
    });

    it('replaces the current file when `maxCount` is 1', async () => {
      const { input, host, fixture, flush, aborted } = setup();
      host.maxCount.set(1);
      fixture.detectChanges();
      pick([pdf('first.pdf')]);
      await flush();
      const first = host.files()[0];
      pick([pdf('second.pdf')]);
      await flush();

      expect(host.files().map((f) => f.name)).toEqual(['second.pdf']);
      expect(host.removed.map((f) => f.uid)).toEqual([first.uid]);
      expect(host.removed[0].status).toBe('removed');
      expect(aborted).toEqual([first.uid]);
      expect(input().disabled).toBe(false);
    });

    it('adds files programmatically', async () => {
      const { upload, host, flush } = setup();
      await upload.addFiles([pdf('a.pdf')]);
      await flush();
      expect(host.files()).toHaveLength(1);
    });
  });

  describe('beforeUpload', () => {
    it('skips files it vetoes, with false, null or a rejected promise', async () => {
      const { host, flush } = setup();
      host.beforeUpload.set((file) => {
        if (file.name === 'a.pdf') return false;
        if (file.name === 'b.pdf') return null;
        if (file.name === 'c.pdf') return Promise.reject(new Error('no'));
        return true;
      });
      pick([pdf('a.pdf'), pdf('b.pdf'), pdf('c.pdf'), pdf('d.pdf')]);
      await flush();

      expect(host.files().map((f) => f.name)).toEqual(['d.pdf']);
      expect(host.rejections[0].map((r) => r.reason)).toEqual([
        'before-upload',
        'before-upload',
        'before-upload',
      ]);
    });

    it('sends the blob it returns, keeping the original name', async () => {
      const { host, requests, flush } = setup();
      const compressed = new Blob([new Uint8Array(10)], { type: 'image/webp' });
      host.beforeUpload.set(async () => compressed);
      pick([png('photo.png', 500)]);
      await flush();

      expect(requests[0].file).toBe(compressed);
      expect(host.files()[0]).toMatchObject({
        name: 'photo.png',
        size: 10,
        type: 'image/webp',
      });
    });

    it('receives the whole batch', async () => {
      const { host, flush } = setup();
      const seen: string[][] = [];
      host.beforeUpload.set((_file, batch) => {
        seen.push(batch.map((f) => f.name));
        return true;
      });
      pick([pdf('a.pdf'), pdf('b.pdf')]);
      await flush();
      expect(seen).toEqual([
        ['a.pdf', 'b.pdf'],
        ['a.pdf', 'b.pdf'],
      ]);
    });
  });

  describe('upload lifecycle', () => {
    it('tracks progress, completion and the response', async () => {
      const { host, requests, flush, root, live } = setup();
      pick([pdf('a.pdf')]);
      await flush();

      requests[0].onProgress(40);
      await flush();
      expect(host.files()[0]).toMatchObject({
        status: 'uploading',
        percent: 40,
      });
      expect(host.changes.at(-1)?.event).toEqual({ percent: 40 });
      const bar = root.querySelector('[role="progressbar"]') as HTMLElement;
      expect(bar.getAttribute('aria-valuenow')).toBe('40');
      expect(bar.getAttribute('aria-label')).toBe('Uploading a.pdf');
      expect((bar.firstElementChild as HTMLElement).style.inlineSize).toBe(
        '40%',
      );

      requests[0].onSuccess({ id: 99 });
      await flush();
      expect(host.files()[0]).toMatchObject({
        status: 'done',
        percent: 100,
        response: { id: 99 },
      });
      expect(root.querySelector('[role="progressbar"]')).toBeNull();
      expect(live()).toBe('a.pdf uploaded');
    });

    it('shows a failure with a retry that sends the same file again', async () => {
      const { host, requests, flush, root, live } = setup();
      pick([pdf('a.pdf')]);
      await flush();
      requests[0].onError(new Error('Server said no'));
      await flush();

      expect(host.files()[0].status).toBe('error');
      expect(root.querySelector('.andes-upload__error')?.textContent).toBe(
        'Server said no',
      );
      expect(live()).toBe('a.pdf could not be uploaded');
      expect(
        root.querySelector('.andes-upload__item')?.getAttribute('data-status'),
      ).toBe('error');

      (
        root.querySelector(
          'button[aria-label="Retry uploading a.pdf"]',
        ) as HTMLButtonElement
      ).click();
      await flush();
      expect(requests).toHaveLength(2);
      expect(requests[1].file).toBe(requests[0].file);
      expect(host.files()[0]).toMatchObject({
        status: 'uploading',
        percent: 0,
      });
      expect(host.files()[0].error).toBeUndefined();
    });

    it('falls back to the generic failure text', async () => {
      const { requests, flush, root } = setup();
      pick([pdf('a.pdf')]);
      await flush();
      requests[0].onError('boom');
      await flush();
      expect(root.querySelector('.andes-upload__error')?.textContent).toBe(
        'Upload failed',
      );
    });

    it('ignores callbacks that arrive after the file was removed', async () => {
      const { host, requests, flush } = setup();
      pick([pdf('a.pdf')]);
      await flush();
      await host.upload().removeFile(host.files()[0]);
      requests[0].onSuccess({});
      requests[0].onProgress(90);
      expect(host.files()).toEqual([]);
    });

    it('accepts a transport that reports synchronously', async () => {
      const { host, flush } = setup();
      host.customRequest.set((options) => {
        options.onSuccess('done');
      });
      pick([pdf('a.pdf')]);
      await flush();
      expect(host.files()[0]).toMatchObject({
        status: 'done',
        response: 'done',
      });
    });

    it('accepts a transport that returns a bare abort function', async () => {
      const { host, flush } = setup();
      const abort = vi.fn();
      host.customRequest.set(() => abort);
      pick([pdf('a.pdf')]);
      await flush();
      await host.upload().removeFile(host.files()[0]);
      expect(abort).toHaveBeenCalledTimes(1);
    });

    it('turns a throwing transport into a failed file', async () => {
      const { host, flush } = setup();
      host.customRequest.set(() => {
        throw new Error('bad transport');
      });
      pick([pdf('a.pdf')]);
      await flush();
      expect(host.files()[0].status).toBe('error');
    });

    it('waits for submit() with autoUpload off', async () => {
      const { host, requests, flush, root } = setup();
      host.autoUpload.set(false);
      pick([pdf('a.pdf')]);
      await flush();
      expect(host.files()[0].status).toBe('ready');
      expect(requests).toHaveLength(0);
      expect(root.querySelector('.andes-upload__caption')?.textContent).toBe(
        'Ready to upload',
      );

      host.upload().submit();
      await flush();
      expect(requests).toHaveLength(1);
      expect(host.files()[0].status).toBe('uploading');
    });

    it('cancels a running upload with abortFile and keeps it as failed', async () => {
      const { host, flush, aborted } = setup();
      pick([pdf('a.pdf')]);
      await flush();
      const uid = host.files()[0].uid;
      host.upload().abortFile(uid);
      expect(aborted).toEqual([uid]);
      expect(host.files()[0].status).toBe('error');
    });

    it('goes through the built-in XMLHttpRequest transport when no custom one is set', async () => {
      const sent: { url: string; body: FormData }[] = [];
      class FakeXhr {
        upload = { onprogress: null as ((e: unknown) => void) | null };
        onload: (() => void) | null = null;
        status = 0;
        responseText = '';
        withCredentials = false;
        static last: FakeXhr;
        constructor() {
          FakeXhr.last = this;
        }
        open(_method: string, url: string) {
          sent.push({ url, body: new FormData() });
        }
        setRequestHeader() {
          // not needed
        }
        send(body: FormData) {
          sent[0].body = body;
        }
        abort() {
          // not needed
        }
      }
      vi.stubGlobal('XMLHttpRequest', FakeXhr);
      const instance = () => FakeXhr.last;
      const { host, flush } = setup();
      host.customRequest.set(undefined);
      pick([pdf('a.pdf')]);
      await flush();

      expect(sent[0].url).toBe('/api/files');
      expect((sent[0].body.get('file') as File).name).toBe('a.pdf');
      instance().upload.onprogress?.({
        lengthComputable: true,
        loaded: 1,
        total: 2,
      });
      await flush();
      expect(host.files()[0].percent).toBe(50);
      instance().status = 200;
      instance().responseText = '{"ok":true}';
      instance().onload?.();
      await flush();
      expect(host.files()[0]).toMatchObject({
        status: 'done',
        response: { ok: true },
      });
    });
  });

  describe('removal', () => {
    async function withFile() {
      const ctx = setup();
      pick([pdf('a.pdf')]);
      await ctx.flush();
      return ctx;
    }

    it('removes a file from its button, cancelling the request', async () => {
      const { host, root, flush, aborted, live } = await withFile();
      const uid = host.files()[0].uid;
      (
        root.querySelector(
          'button[aria-label="Remove a.pdf"]',
        ) as HTMLButtonElement
      ).click();
      await flush();

      expect(host.files()).toEqual([]);
      expect(aborted).toEqual([uid]);
      expect(host.removed[0]).toMatchObject({ uid, status: 'removed' });
      expect(host.changes.at(-1)?.file.status).toBe('removed');
      expect(host.changes.at(-1)?.fileList).toEqual([]);
      expect(live()).toBe('a.pdf removed');
    });

    it('keeps the file when beforeRemove vetoes, now or later', async () => {
      const { host, flush, fixture } = await withFile();
      host.beforeRemove.set(() => false);
      fixture.detectChanges();
      expect(await host.upload().removeFile(host.files()[0])).toBe(false);
      host.beforeRemove.set(async () => false);
      fixture.detectChanges();
      expect(await host.upload().removeFile(host.files()[0])).toBe(false);
      host.beforeRemove.set(() => Promise.reject(new Error('cancelled')));
      fixture.detectChanges();
      expect(await host.upload().removeFile(host.files()[0])).toBe(false);
      await flush();
      expect(host.files()).toHaveLength(1);
      expect(host.removed).toEqual([]);

      host.beforeRemove.set(async () => true);
      fixture.detectChanges();
      expect(await host.upload().removeFile(host.files()[0])).toBe(true);
      expect(host.files()).toEqual([]);
    });

    it('hides the actions that no longer apply while disabled', async () => {
      const { host, root, fixture } = await withFile();
      host.disabled.set(true);
      fixture.detectChanges();
      expect(
        root.querySelector('button[aria-label="Remove a.pdf"]'),
      ).toBeNull();
      expect(await host.upload().removeFile(host.files()[0])).toBe(false);
    });

    describe('focus after removal', () => {
      const three: AndesUploadFile[] = [
        { uid: 'a', name: 'a.pdf', status: 'done' },
        { uid: 'b', name: 'b.pdf', status: 'done' },
        { uid: 'c', name: 'c.pdf', status: 'done' },
      ];

      function removeButton(root: HTMLElement, name: string) {
        return root.querySelector(
          `button[aria-label="Remove ${name}"]`,
        ) as HTMLButtonElement;
      }

      it('moves the focus to the remove button of the next file', async () => {
        const { host, root, fixture, flush } = setup();
        host.files.set(three);
        fixture.detectChanges();
        removeButton(root, 'b.pdf').focus();
        removeButton(root, 'b.pdf').click();
        await flush();

        expect(host.files().map((f) => f.uid)).toEqual(['a', 'c']);
        expect(document.activeElement).toBe(removeButton(root, 'c.pdf'));
      });

      it('moves the focus to the previous file when the last one goes', async () => {
        const { host, root, fixture, flush } = setup();
        host.files.set(three);
        fixture.detectChanges();
        removeButton(root, 'c.pdf').focus();
        removeButton(root, 'c.pdf').click();
        await flush();

        expect(document.activeElement).toBe(removeButton(root, 'b.pdf'));
      });

      it('falls back to the file input when the list empties', async () => {
        const { host, root, fixture, flush, input } = setup();
        host.files.set([three[0]]);
        fixture.detectChanges();
        removeButton(root, 'a.pdf').focus();
        removeButton(root, 'a.pdf').click();
        await flush();

        expect(host.files()).toEqual([]);
        expect(document.activeElement).toBe(input());
      });

      it('reaches a file input that was disabled by a full list', async () => {
        const { host, root, fixture, flush, input } = setup();
        host.maxCount.set(1);
        host.listType.set('picture-card');
        host.files.set([three[0]]);
        fixture.detectChanges();
        expect(input().disabled).toBe(false);
        host.maxCount.set(2);
        host.files.set([three[0], three[1]]);
        fixture.detectChanges();
        expect(input().disabled).toBe(true);

        removeButton(root, 'a.pdf').focus();
        removeButton(root, 'a.pdf').click();
        await flush();

        expect(document.activeElement).toBe(removeButton(root, 'b.pdf'));
        removeButton(root, 'b.pdf').click();
        await flush();
        expect(document.activeElement).toBe(input());
      });

      it('leaves the focus alone when it was not inside the removed row', async () => {
        const { host, root, fixture, flush, upload } = setup();
        host.files.set(three);
        fixture.detectChanges();
        removeButton(root, 'c.pdf').focus();

        expect(await upload.removeFile('a')).toBe(true);
        await flush();
        expect(document.activeElement).toBe(removeButton(root, 'c.pdf'));
      });

      it('keeps the focus on the button when beforeRemove vetoes', async () => {
        const { host, root, fixture, flush } = setup();
        host.beforeRemove.set(async () => false);
        host.files.set(three);
        fixture.detectChanges();
        removeButton(root, 'b.pdf').focus();
        removeButton(root, 'b.pdf').click();
        await flush();

        expect(host.files()).toHaveLength(3);
        expect(document.activeElement).toBe(removeButton(root, 'b.pdf'));
      });
    });

    it('aborts requests when the control is destroyed', async () => {
      const { fixture, aborted, host } = await withFile();
      const uid = host.files()[0].uid;
      fixture.destroy();
      expect(aborted).toEqual([uid]);
    });
  });

  describe('list', () => {
    it('is a labelled list with one item per file, name and size', async () => {
      const { host, root, items, fixture } = setup();
      host.files.set([
        { uid: '1', name: 'contract.pdf', size: 1536, status: 'done' },
        { uid: '2', name: 'photo.png', size: 3 * 1024 * 1024 },
      ]);
      fixture.detectChanges();

      const list = root.querySelector('ul') as HTMLElement;
      expect(list.getAttribute('aria-label')).toBe('Files');
      expect(
        items().map(
          (item) => item.querySelector('.andes-upload__name')?.textContent,
        ),
      ).toEqual(['contract.pdf', 'photo.png']);
      expect(
        items().map(
          (item) => item.querySelector('.andes-upload__caption')?.textContent,
        ),
      ).toEqual(['1.5 KB', '3 MB']);
      expect(items()[1].getAttribute('data-status')).toBe('done');
    });

    it('can be hidden, or lose individual parts', () => {
      const { host, root, fixture } = setup();
      host.files.set([
        { uid: '1', name: 'a.pdf', size: 10, url: 'https://files.test/a.pdf' },
      ]);
      fixture.detectChanges();
      expect(
        root.querySelector('button[aria-label="Remove a.pdf"]'),
      ).not.toBeNull();
      expect(
        root.querySelector('button[aria-label="Preview a.pdf"]'),
      ).not.toBeNull();
      expect(root.querySelector('a[aria-label="Download a.pdf"]')).toBeNull();

      host.showList.set({
        showRemoveIcon: false,
        showDownloadIcon: true,
        showFileSize: false,
      });
      fixture.detectChanges();
      expect(
        root.querySelector('button[aria-label="Remove a.pdf"]'),
      ).toBeNull();
      expect(
        root.querySelector('a[aria-label="Download a.pdf"]'),
      ).not.toBeNull();
      expect(root.querySelector('.andes-upload__caption')).toBeNull();

      host.showList.set(false);
      fixture.detectChanges();
      expect(root.querySelector('ul')).toBeNull();
    });

    describe('preview', () => {
      const entry = (name: string, url?: string): AndesUploadFile => ({
        uid: name,
        name,
        status: 'done',
        url,
        thumbUrl: 'https://cdn.test/thumb.png',
      });

      function previewButtons(root: HTMLElement) {
        return Array.from(
          root.querySelectorAll<HTMLButtonElement>('[data-action="preview"]'),
        ).map((button) => button.getAttribute('aria-label'));
      }

      it('is offered only for files with a web or blob address', () => {
        const { host, root, fixture } = setup();
        host.listType.set('picture-card');
        host.files.set([
          entry('web.png', 'https://files.test/web.png'),
          entry('relative.png', '/files/relative.png'),
          entry('blob.png', 'blob:http://localhost/1234'),
          entry('inline.png', 'data:image/png;base64,AAAA'),
          entry('script.png', 'javascript:alert(1)'),
          entry('local.png'),
        ]);
        fixture.detectChanges();

        expect(previewButtons(root)).toEqual([
          'Preview web.png',
          'Preview relative.png',
          'Preview blob.png',
        ]);
      });

      it('never opens an address the browser refuses, but still reports the click', () => {
        const { host, root, fixture } = setup();
        host.files.set([entry('inline.png', 'data:image/png;base64,AAAA')]);
        fixture.detectChanges();
        const open = vi.fn();
        vi.stubGlobal('open', open);

        // A custom row can still ask for it through the item context.
        const ctx = (
          host.upload() as unknown as {
            items(): { ctx: { preview(): void } }[];
          }
        ).items()[0].ctx;
        ctx.preview();

        expect(host.previews).toHaveLength(1);
        expect(open).not.toHaveBeenCalled();
        expect(root.querySelector('[data-action="preview"]')).toBeNull();
      });

      it('opens a blob address in a new tab', () => {
        const { host, root, fixture } = setup();
        host.files.set([entry('blob.png', 'blob:http://localhost/1234')]);
        fixture.detectChanges();
        const open = vi.fn();
        vi.stubGlobal('open', open);
        (
          root.querySelector('[data-action="preview"]') as HTMLButtonElement
        ).click();

        expect(open).toHaveBeenCalledWith(
          'blob:http://localhost/1234',
          '_blank',
          'noopener,noreferrer',
        );
      });
    });

    it('links the name to the file, and emits preview and download events', () => {
      const { host, root, fixture } = setup();
      host.showList.set({ showDownloadIcon: true });
      host.files.set([
        {
          uid: '1',
          name: 'a.pdf',
          url: 'https://files.test/a.pdf',
          status: 'done',
        },
      ]);
      fixture.detectChanges();

      const link = root.querySelector(
        'a.andes-upload__name',
      ) as HTMLAnchorElement;
      expect(link.getAttribute('href')).toBe('https://files.test/a.pdf');
      expect(link.rel).toContain('noopener');

      const open = vi.fn();
      vi.stubGlobal('open', open);
      (
        root.querySelector(
          'button[aria-label="Preview a.pdf"]',
        ) as HTMLButtonElement
      ).click();
      expect(host.previews[0].file.uid).toBe('1');
      expect(open).toHaveBeenCalledWith(
        'https://files.test/a.pdf',
        '_blank',
        'noopener,noreferrer',
      );

      host.preventPreview = true;
      (
        root.querySelector(
          'button[aria-label="Preview a.pdf"]',
        ) as HTMLButtonElement
      ).click();
      expect(open).toHaveBeenCalledTimes(1);

      const download = root.querySelector(
        'a[aria-label="Download a.pdf"]',
      ) as HTMLAnchorElement;
      expect(download.hasAttribute('download')).toBe(true);
      const free = new MouseEvent('click', { bubbles: true, cancelable: true });
      download.dispatchEvent(free);
      expect(free.defaultPrevented).toBe(false);
      host.preventDownload = true;
      const blocked = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
      });
      download.dispatchEvent(blocked);
      expect(blocked.defaultPrevented).toBe(true);
      expect(host.downloads).toHaveLength(2);
    });

    it('lets itemRender and iconRender take over', () => {
      const { host, root, fixture } = setup();
      host.files.set([{ uid: '1', name: 'a.pdf', status: 'done' }]);
      host.custom.set(true);
      fixture.detectChanges();
      expect(root.querySelector('.custom-item')?.textContent).toBe('a.pdf');

      (root.querySelector('.custom-remove') as HTMLButtonElement).click();
      expect(host.files()).toEqual([]);

      host.files.set([{ uid: '2', name: 'abcd.pdf', status: 'done' }]);
      host.listType.set('picture');
      fixture.detectChanges();
      expect(root.querySelector('.custom-item')).not.toBeNull();
    });

    it('treats a file without a status as already uploaded', () => {
      const { host, root, fixture } = setup();
      host.files.set([{ uid: '1', name: 'old.pdf' }]);
      fixture.detectChanges();
      expect(
        root.querySelector('.andes-upload__item')?.getAttribute('data-status'),
      ).toBe('done');
      expect(root.querySelector('[role="progressbar"]')).toBeNull();
    });

    it('localises its texts', async () => {
      const { host, root, fixture, input, flush } = setup();
      host.messages.set({
        selectFiles: 'Elegir',
        fileList: 'Archivos',
        remove: 'Quitar {name}',
      });
      pick([pdf('a.pdf')]);
      await flush();
      fixture.detectChanges();
      expect(input().getAttribute('aria-label')).toBe('Elegir');
      expect(root.querySelector('ul')?.getAttribute('aria-label')).toBe(
        'Archivos',
      );
      expect(
        root.querySelector('button[aria-label="Quitar a.pdf"]'),
      ).not.toBeNull();
    });
  });

  describe('picture lists and thumbnails', () => {
    it('makes object URLs for pictures and revokes them when the file goes', async () => {
      const { host, flush, root } = setup();
      host.listType.set('picture');
      pick([png('a.png'), pdf('b.pdf')]);
      await flush();

      expect(created).toHaveLength(1);
      expect(
        root.querySelector('img.andes-upload__img')?.getAttribute('src'),
      ).toBe(created[0]);
      expect(root.querySelectorAll('img')).toHaveLength(1);

      await host.upload().removeFile(host.files()[0]);
      await flush();
      expect(revoked).toEqual([created[0]]);
    });

    it('revokes every URL when the control is destroyed', async () => {
      const { host, flush, fixture } = setup();
      host.listType.set('picture-card');
      pick([png('a.png'), png('b.png')]);
      await flush();
      fixture.destroy();
      expect(revoked.sort()).toEqual([...created].sort());
    });

    it('does no work for a plain text list', async () => {
      const { flush } = setup();
      pick([png('a.png')]);
      await flush();
      expect(created).toHaveLength(0);
    });

    it('uses a given thumbUrl, and a picture URL when there is none', () => {
      const { host, root, fixture } = setup();
      host.listType.set('picture');
      host.files.set([
        {
          uid: '1',
          name: 'a.png',
          status: 'done',
          thumbUrl: 'https://cdn.test/thumb.png',
        },
        {
          uid: '2',
          name: 'b.jpg',
          status: 'done',
          url: 'https://cdn.test/b.jpg',
        },
        {
          uid: '3',
          name: 'c.pdf',
          status: 'done',
          url: 'https://cdn.test/c.pdf',
        },
      ]);
      fixture.detectChanges();
      const sources = Array.from(root.querySelectorAll('img')).map((img) =>
        img.getAttribute('src'),
      );
      expect(sources).toEqual([
        'https://cdn.test/thumb.png',
        'https://cdn.test/b.jpg',
      ]);
      expect(created).toHaveLength(0);
    });

    it('asks previewFile for the thumbnail and never revokes what it returns', async () => {
      const { host, flush, root, fixture } = setup();
      host.listType.set('picture');
      host.previewFile.set(async () => 'data:image/png;base64,AAAA');
      pick([png('a.png')]);
      await flush();
      await flush();
      expect(root.querySelector('img')?.getAttribute('src')).toBe(
        'data:image/png;base64,AAAA',
      );
      fixture.destroy();
      expect(created).toHaveLength(0);
      expect(revoked).toHaveLength(0);
    });

    describe('failed files', () => {
      const long =
        'The storage service rejected this upload because the quota of the account was exceeded, try again later';

      it('shows a failed card its message, not only to screen readers', () => {
        const { host, root, fixture } = setup();
        host.listType.set('picture-card');
        host.files.set([
          {
            uid: '1',
            name: 'photo.png',
            status: 'error',
            errorMessage: long,
            thumbUrl: 'https://cdn.test/t.png',
          },
        ]);
        fixture.detectChanges();

        const meta = root.querySelector('.andes-upload__meta') as HTMLElement;
        expect(meta.classList).not.toContain('andes-upload__meta--sr');
        expect(meta.classList).toContain('andes-upload__meta--over');
        const error = root.querySelector('.andes-upload__error') as HTMLElement;
        expect(error.textContent).toBe(long);
        expect(error.getAttribute('title')).toBe(long);
        expect(
          root.querySelector('.andes-upload__thumb .andes-upload__thumb-alert'),
        ).not.toBeNull();
      });

      it('keeps the picture card of a healthy file free of text', () => {
        const { host, root, fixture } = setup();
        host.listType.set('picture-card');
        host.files.set([
          {
            uid: '1',
            name: 'photo.png',
            status: 'done',
            thumbUrl: 'https://cdn.test/t.png',
          },
        ]);
        fixture.detectChanges();

        const meta = root.querySelector('.andes-upload__meta') as HTMLElement;
        expect(meta.classList).toContain('andes-upload__meta--sr');
        expect(meta.classList).not.toContain('andes-upload__meta--over');
        expect(root.querySelector('.andes-upload__thumb-alert')).toBeNull();
      });

      it('draws the alert over the picture of a card only, not of a picture row', () => {
        const { host, root, fixture } = setup();
        host.listType.set('picture');
        host.files.set([
          {
            uid: '1',
            name: 'photo.png',
            status: 'error',
            errorMessage: 'Too big',
            thumbUrl: 'https://cdn.test/t.png',
          },
        ]);
        fixture.detectChanges();
        expect(root.querySelector('.andes-upload__thumb-alert')).toBeNull();
        expect(root.querySelector('.andes-upload__meta--over')).toBeNull();

        host.listType.set('picture-card');
        fixture.detectChanges();
        expect(root.querySelector('.andes-upload__thumb-alert')).not.toBeNull();
      });

      it('relies on the alert icon of a failed card that has no picture', () => {
        const { host, root, fixture } = setup();
        host.listType.set('picture-card');
        host.files.set([
          {
            uid: '1',
            name: 'sheet.xlsx',
            status: 'error',
            errorMessage: 'Password protected',
          },
        ]);
        fixture.detectChanges();

        expect(root.querySelector('.andes-upload__thumb-alert')).toBeNull();
        expect(
          root.querySelector('.andes-upload__thumb andes-upload-icon'),
        ).not.toBeNull();
        expect(root.querySelector('.andes-upload__error')?.textContent).toBe(
          'Password protected',
        );
      });

      it('gives a failed text row the whole message as its title', () => {
        const { host, root, fixture } = setup();
        host.files.set([
          { uid: '1', name: 'a.pdf', status: 'error', errorMessage: long },
        ]);
        fixture.detectChanges();

        const error = root.querySelector('.andes-upload__error') as HTMLElement;
        expect(error.textContent).toBe(long);
        expect(error.getAttribute('title')).toBe(long);
        expect(root.querySelector('.andes-upload__meta--over')).toBeNull();
      });
    });

    it('draws a progress bar and the actions on picture-card tiles', async () => {
      const { host, flush, root, requests } = setup();
      host.listType.set('picture-card');
      pick([png('a.png')]);
      await flush();
      requests[0].onProgress(25);
      await flush();

      expect(root.querySelector('.andes-upload__cards')).not.toBeNull();
      expect(root.querySelector('ul')?.getAttribute('data-list-type')).toBe(
        'picture-card',
      );
      expect(
        root
          .querySelector('[role="progressbar"]')
          ?.getAttribute('aria-valuenow'),
      ).toBe('25');
      requests[0].onSuccess({});
      await flush();
      // A local picture has no address to open, so there is no preview action to be dead.
      expect(
        root.querySelector('button[aria-label="Preview a.png"]'),
      ).toBeNull();
      expect(
        root.querySelector('button[aria-label="Remove a.png"]'),
      ).not.toBeNull();
    });

    it('hides the add tile of a picture-card list once the limit is reached', async () => {
      const { host, flush, root, fixture } = setup();
      host.listType.set('picture-card');
      host.maxCount.set(1);
      fixture.detectChanges();
      expect(
        (root.querySelector('.andes-upload__select') as HTMLElement).hidden,
      ).toBe(false);
      pick([png('a.png')]);
      await flush();
      expect(
        (root.querySelector('.andes-upload__select') as HTMLElement).hidden,
      ).toBe(true);
    });

    it('switches layout without losing the projected trigger', () => {
      const { host, root, fixture } = setup();
      host.files.set([{ uid: '1', name: 'a.png', status: 'done' }]);
      fixture.detectChanges();
      expect(root.querySelectorAll('.trigger')).toHaveLength(1);
      host.listType.set('picture-card');
      fixture.detectChanges();
      expect(root.querySelectorAll('.trigger')).toHaveLength(1);
      host.listType.set('text');
      fixture.detectChanges();
      expect(root.querySelectorAll('.trigger')).toHaveLength(1);
    });
  });

  describe('paste', () => {
    it('adds pasted files', async () => {
      const { root, host, flush } = setup();
      const event = new Event('paste', { bubbles: true, cancelable: true });
      Object.defineProperty(event, 'clipboardData', {
        value: { files: [png('shot.png')] },
      });
      root.querySelector('input')?.dispatchEvent(event);
      await flush();
      expect(event.defaultPrevented).toBe(true);
      expect(host.files().map((f) => f.name)).toEqual(['shot.png']);
    });

    it('ignores text pastes and, when asked, file pastes', async () => {
      const { root, host, fixture, flush } = setup();
      const text = new Event('paste', { bubbles: true, cancelable: true });
      Object.defineProperty(text, 'clipboardData', { value: { files: [] } });
      root.querySelector('input')?.dispatchEvent(text);
      expect(text.defaultPrevented).toBe(false);

      host.allowPaste.set(false);
      fixture.detectChanges();
      const files = new Event('paste', { bubbles: true, cancelable: true });
      Object.defineProperty(files, 'clipboardData', {
        value: { files: [png()] },
      });
      root.querySelector('input')?.dispatchEvent(files);
      await flush();
      expect(host.files()).toEqual([]);
    });
  });

  describe('edge cases', () => {
    it('keeps the add tile of a card list that shows no list (an avatar field)', async () => {
      const { host, flush, root, fixture } = setup();
      host.listType.set('picture-circle');
      host.maxCount.set(1);
      host.showList.set(false);
      fixture.detectChanges();
      pick([png('a.png')]);
      await flush();

      expect(host.files()).toHaveLength(1);
      expect(
        (root.querySelector('.andes-upload__select') as HTMLElement).hidden,
      ).toBe(false);

      host.showList.set(true);
      fixture.detectChanges();
      expect(
        (root.querySelector('.andes-upload__select') as HTMLElement).hidden,
      ).toBe(true);
    });

    describe('maxCount of 1', () => {
      it('asks beforeRemove about the file it replaces', async () => {
        const { host, flush } = setup();
        host.maxCount.set(1);
        const asked: string[] = [];
        host.beforeRemove.set(async (file) => {
          asked.push(file.name);
        });
        pick([pdf('a.pdf')]);
        await flush();
        expect(asked).toEqual([]);

        pick([pdf('b.pdf')]);
        await flush();
        expect(asked).toEqual(['a.pdf']);
        expect(host.files().map((file) => file.name)).toEqual(['b.pdf']);
        expect(host.removed.map((file) => file.name)).toEqual(['a.pdf']);
      });

      it('keeps the current file and turns the new one away when beforeRemove vetoes', async () => {
        const { host, flush, live, aborted } = setup();
        host.maxCount.set(1);
        pick([pdf('a.pdf')]);
        await flush();
        const keptUid = host.files()[0].uid;
        host.beforeRemove.set(async () => false);

        pick([pdf('b.pdf')]);
        await flush();
        expect(host.files().map((file) => file.uid)).toEqual([keptUid]);
        expect(aborted).toEqual([]);
        expect(host.removed).toEqual([]);
        expect(host.rejections.at(-1)).toMatchObject([
          { reason: 'count', file: { name: 'b.pdf' } },
        ]);
        expect(live()).toBe(
          'b.pdf was not added: the limit of 1 file is reached',
        );
      });

      it('treats a rejecting beforeRemove as a veto', async () => {
        const { host, flush } = setup();
        host.maxCount.set(1);
        pick([pdf('a.pdf')]);
        await flush();
        host.beforeRemove.set(() => Promise.reject(new Error('no')));
        pick([pdf('b.pdf')]);
        await flush();
        expect(host.files().map((file) => file.name)).toEqual(['a.pdf']);
      });
    });

    it('does not read the Node global, which a server does not have', async () => {
      const fixture = TestBed.createComponent(HostComponent);
      fixture.componentInstance.withContent.set(false);
      // Angular's own testing code needs `Node`; the control must not.
      vi.stubGlobal('Node', undefined);
      try {
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();
      } finally {
        vi.unstubAllGlobals();
      }
      expect(
        fixture.nativeElement.querySelector('.andes-upload__default'),
      ).not.toBeNull();
    });
  });

  describe('localisation', () => {
    const errorText = (root: HTMLElement) =>
      root.querySelector('.andes-upload__error')?.textContent;

    async function failWith(error: unknown) {
      const ctx = setup();
      pick([pdf('a.pdf')]);
      await ctx.flush();
      ctx.requests[0].onError(error);
      await ctx.flush();
      return ctx;
    }

    it('writes the cancelled upload in the chosen language', async () => {
      const { host, root, flush, fixture } = setup();
      pick([pdf('a.pdf')]);
      await flush();
      host.upload().abortFile(host.files()[0].uid);
      await flush();
      expect(host.files()[0].error).toBeInstanceOf(AndesUploadCancelledError);
      expect(errorText(root)).toBe('Upload cancelled');

      host.messages.set({ uploadCancelled: 'Subida cancelada' });
      fixture.detectChanges();
      expect(errorText(root)).toBe('Subida cancelada');
    });

    it.each([
      ['http', 503, 'Upload failed with status 503', 'Error 503 del servidor'],
      ['network', 0, 'Network error', 'Sin conexion'],
      ['timeout', 0, 'The upload timed out', 'Tiempo agotado'],
    ] as const)(
      'translates a %s failure of the transport',
      async (kind, status, english, spanish) => {
        const { host, root, fixture } = await failWith(
          new AndesUploadHttpError(english, status, undefined, kind),
        );
        expect(errorText(root)).toBe(english);

        host.messages.set({
          httpError: 'Error {status} del servidor',
          networkError: 'Sin conexion',
          timeout: 'Tiempo agotado',
        });
        fixture.detectChanges();
        expect(errorText(root)).toBe(spanish);
      },
    );

    it('keeps the file errorMessage, then any other error message', async () => {
      const { host, root, fixture } = await failWith(new Error('Disk full'));
      expect(errorText(root)).toBe('Disk full');
      host.messages.set({ uploadFailed: 'Fallo' });
      host.files.update((list) =>
        list.map((file) => ({ ...file, errorMessage: 'Archivo bloqueado' })),
      );
      fixture.detectChanges();
      expect(errorText(root)).toBe('Archivo bloqueado');

      host.files.update((list) =>
        list.map((file) => ({
          ...file,
          errorMessage: undefined,
          error: 'not an error object',
        })),
      );
      fixture.detectChanges();
      expect(errorText(root)).toBe('Fallo');
    });

    it('says "file" for a limit of one and "files" for more', async () => {
      const { host, flush, live, fixture } = setup();
      host.multiple.set(false);
      host.maxCount.set(2);
      fixture.detectChanges();
      pick([pdf('a.pdf'), pdf('b.pdf')]);
      await flush();
      expect(live()).toBe(
        'b.pdf was not added: the limit of 2 files is reached',
      );

      host.multiple.set(true);
      host.maxCount.set(1);
      host.files.set([]);
      fixture.detectChanges();
      pick([pdf('c.pdf'), pdf('d.pdf')]);
      await flush();
      expect(live()).toBe(
        'd.pdf was not added: the limit of 1 file is reached',
      );
    });

    it('lets a message be a function for languages with more plural forms', async () => {
      const { host, flush, live, fixture } = setup();
      host.multiple.set(true);
      host.maxCount.set(1);
      host.messages.set({
        rejectCount: ({ count }) =>
          count === 1 ? 'solo cabe 1 archivo' : `caben ${count} archivos`,
        announceRejected: '{name}: {reason}',
      });
      fixture.detectChanges();
      pick([pdf('c.pdf'), pdf('d.pdf')]);
      await flush();
      expect(live()).toBe('d.pdf: solo cabe 1 archivo');
    });

    it('keeps the English texts when only some are given', () => {
      const { host, root, fixture } = setup();
      host.messages.set({ selectFiles: () => 'Elegir' });
      host.files.set([{ uid: '1', name: 'a.pdf', status: 'ready' }]);
      fixture.detectChanges();
      expect(
        root.querySelector('input[type="file"]')?.getAttribute('aria-label'),
      ).toBe('Elegir');
      expect(root.querySelector('.andes-upload__caption')?.textContent).toBe(
        'Ready to upload',
      );
    });
  });

  describe('list animation', () => {
    const html = readFileSync(
      join(process.cwd(), 'packages/ui/src/lib/upload/upload.html'),
      'utf8',
    );

    /** The opening tag that carries `needle`, from its `<` to its `>`. */
    function openingTag(needle: string): string {
      const at = html.indexOf(needle);
      const start = html.lastIndexOf('<', at);
      return html.slice(start, html.indexOf('>', at) + 1);
    }

    it('hooks the row, the thumbnail and both progress bars into Angular animations', () => {
      const row = openingTag('data-slot="upload-item"');
      expect(row).toContain('animate.enter="andes-upload__item--enter"');
      expect(row).toContain('animate.leave="andes-upload__item--leave"');
      expect(openingTag('class="andes-upload__img"')).toContain(
        'animate.enter="andes-upload__img--enter"',
      );
      expect(openingTag('class="andes-upload__progress"')).toContain(
        'animate.leave="andes-upload__progress--leave"',
      );
      expect(openingTag('class="andes-upload__field-progress"')).toContain(
        'animate.leave="andes-upload__field-progress--leave"',
      );
    });

    it('wraps the row contents so they can collapse inside the list item', () => {
      const { host, root, fixture } = setup();
      host.files.set([{ uid: '1', name: 'a.pdf', status: 'done' }]);
      host.custom.set(true);
      fixture.detectChanges();
      const item = root.querySelector('.andes-upload__item') as HTMLElement;
      expect(item.children).toHaveLength(1);
      expect(item.children[0].classList).toContain('andes-upload__item-inner');
      expect(item.children[0].querySelector('.custom-item')).not.toBeNull();
    });

    it('lets rows animate only after the first render', async () => {
      const fixture = TestBed.createComponent(HostComponent);
      fixture.componentInstance.files.set([
        { uid: '1', name: 'a.pdf', status: 'done' },
      ]);
      fixture.detectChanges();
      const root = fixture.nativeElement.querySelector(
        '[data-slot="upload-root"]',
      ) as HTMLElement;
      expect(root.hasAttribute('data-animate')).toBe(false);

      await new Promise((resolve) => requestAnimationFrame(resolve));
      fixture.detectChanges();
      expect(root.hasAttribute('data-animate')).toBe(true);
    });

    it('moves the focus to the next row before the removed one has left', async () => {
      const { host, root, fixture, upload } = setup();
      host.files.set([
        { uid: 'a', name: 'a.pdf', status: 'done' },
        { uid: 'b', name: 'b.pdf', status: 'done' },
      ]);
      fixture.detectChanges();
      const first = root.querySelector(
        'button[aria-label="Remove a.pdf"]',
      ) as HTMLButtonElement;
      first.focus();

      // No change detection yet: the removed row is still on screen, as it is while it leaves.
      expect(await upload.removeFile('a')).toBe(true);
      expect(first.isConnected).toBe(true);
      expect(document.activeElement).toBe(
        root.querySelector('button[aria-label="Remove b.pdf"]'),
      );
    });
  });

  describe('stylesheet contract', () => {
    const css = readFileSync(
      join(process.cwd(), 'packages/ui/src/lib/upload/upload.css'),
      'utf8',
    ).replace(/\s+/g, ' ');

    it('draws the progress as a calm 4px track', () => {
      expect(css).toContain(
        '.andes-upload__progress { position: relative; block-size: 4px;',
      );
      expect(css).toContain(
        'background-color: var(--andes-color-primary, #2563eb);',
      );
    });

    it('shows the keyboard focus on the trigger when the hidden input is focused', () => {
      expect(css).toContain(
        '.andes-upload__select:has(.andes-upload__input:focus-visible) { outline: 2px solid var(--andes-color-focus-ring, #2563eb);',
      );
    });

    it('keeps the hidden input out of the layout but not out of the tab order', () => {
      const rule = css.slice(css.indexOf('.andes-upload__input {'));
      expect(rule.slice(0, rule.indexOf('}'))).toContain('opacity: 0');
      expect(rule.slice(0, rule.indexOf('}'))).not.toContain('display: none');
      expect(rule.slice(0, rule.indexOf('}'))).not.toContain('visibility');
    });

    it('turns transitions off for reduced motion', () => {
      const block = css.slice(css.indexOf('prefers-reduced-motion'));
      expect(block).toContain('.andes-upload__progress-bar');
      expect(block).toContain('transition: none');
    });

    it('uses logical properties for direction-safe layout', () => {
      expect(css).toContain('inline-size');
      expect(css).toContain('padding-inline');
      expect(css).not.toMatch(
        /margin-left|margin-right|padding-left|padding-right/,
      );
    });

    it('lets a long error message wrap beside the name instead of overflowing', () => {
      const error = (property: string) =>
        declaredValue(css, '.andes-upload__error', property);
      expect(error('flex')).toBe('1 1 8rem');
      expect(error('min-inline-size')).toBe('0');
      expect(error('overflow-wrap')).toBe('anywhere');
      // Picture rows stack the meta in a column, where a flex basis would be a height.
      expect(
        declaredValue(
          css,
          '.andes-upload--picture .andes-upload__error',
          'flex',
        ),
      ).toBe('none');
      expect(
        declaredValue(css, '.andes-upload--card .andes-upload__error', 'flex'),
      ).toBe('none');
    });

    it('lets the meta wrap in rows and keeps it a column in pictures and cards', () => {
      expect(declaredValue(css, '.andes-upload__meta', 'flex-wrap')).toBe(
        'wrap',
      );
      expect(
        declaredValue(
          css,
          '.andes-upload--picture .andes-upload__meta',
          'flex-wrap',
        ),
      ).toBe('nowrap');
      expect(
        declaredValue(
          css,
          '.andes-upload--card .andes-upload__meta',
          'flex-wrap',
        ),
      ).toBe('nowrap');
      // A long unbroken name must stay inside its box in every layout.
      expect(declaredValue(css, '.andes-upload__name', 'max-inline-size')).toBe(
        '100%',
      );
    });

    it('keeps the actions of a failed card in a strip that leaves the message readable', () => {
      const strip =
        ".andes-upload--card .andes-upload__item[data-status='error'] .andes-upload__actions";
      expect(declaredValue(css, strip, 'opacity')).toBe('1');
      expect(declaredValue(css, strip, 'background-color')).toBe('transparent');
      expect(declaredValue(css, strip, 'block-size')).toBe('1.75rem');
      expect(
        declaredValue(css, '.andes-upload__thumb-alert', 'inset-inline-start'),
      ).toBe('0.5rem');
    });

    it('clamps the message of a failed card to two lines', () => {
      const card = '.andes-upload--card .andes-upload__error';
      expect(declaredValue(css, card, '-webkit-line-clamp')).toBe('2');
      expect(declaredValue(css, card, 'overflow')).toBe('hidden');
      expect(
        declaredValue(css, '.andes-upload__meta--over', 'margin-block-start'),
      ).toBe('auto');
      expect(
        declaredValue(
          css,
          ".andes-upload--card .andes-upload__item[data-status='error'] .andes-upload__img",
          'opacity',
        ),
      ).toBe('0.35');
    });

    /** The text between the braces of the at-rule that starts with `head`. */
    function atRule(head: string, which: 'first' | 'last' = 'first'): string {
      const start =
        which === 'first' ? css.indexOf(head) : css.lastIndexOf(head);
      expect(start).toBeGreaterThan(-1);
      const open = css.indexOf('{', start);
      let depth = 0;
      for (let i = open; i < css.length; i++) {
        depth += css[i] === '{' ? 1 : css[i] === '}' ? -1 : 0;
        if (depth === 0) {
          return css.slice(open + 1, i);
        }
      }
      throw new Error(`unclosed ${head}`);
    }

    describe('motion', () => {
      const motion = atRule('@media (prefers-reduced-motion: no-preference)');

      it('keeps every animation inside the no-preference query', () => {
        const rest = css.replace(motion, '');
        expect(rest).not.toContain('@keyframes');
        expect(rest).not.toContain('animation:');
        expect(motion).toContain('@keyframes andes-upload-row-in');
        expect(motion).toContain('@keyframes andes-upload-row-out');
        expect(motion).toContain('@keyframes andes-upload-card-in');
        expect(motion).toContain('@keyframes andes-upload-card-out');
      });

      it('only animates rows that arrive after the first render', () => {
        const arriving = [
          '.andes-upload[data-animate] .andes-upload__item--enter',
          '.andes-upload--card[data-animate] .andes-upload__item--enter',
          '.andes-upload[data-animate] .andes-upload__img--enter',
        ];
        for (const selector of arriving) {
          expect(declaredValue(motion, selector, 'animation')).toBeDefined();
        }
        expect(
          declaredValue(motion, '.andes-upload__item--enter', 'animation'),
        ).toBeUndefined();
      });

      it('collapses rows by their grid track with the library motion tokens', () => {
        const enter = declaredValue(
          motion,
          '.andes-upload[data-animate] .andes-upload__item--enter',
          'animation',
        );
        expect(enter).toContain('andes-upload-row-in');
        expect(enter).toContain('var(--andes-motion-duration-slow');
        expect(enter).toContain('var(--_andes-upload-ease)');
        const leave = declaredValue(
          motion,
          '.andes-upload__item--leave',
          'animation',
        );
        expect(leave).toContain('andes-upload-row-out');
        expect(leave).toContain('var(--andes-motion-duration-mid');
        expect(leave).toContain('var(--andes-motion-ease-in');
        expect(leave).toContain('forwards');
        expect(
          declaredValue(motion, '.andes-upload__item--leave', 'display'),
        ).toBe('grid');
        const frames = atRule('@keyframes andes-upload-row-out');
        expect(declaredValue(frames, 'to', 'grid-template-rows')).toBe('0fr');
        expect(declaredValue(frames, 'from', 'grid-template-rows')).toBe('1fr');
      });

      it('scales and fades the cards instead of resizing them', () => {
        expect(
          declaredValue(
            motion,
            '.andes-upload--card .andes-upload__item--leave',
            'display',
          ),
        ).toBe('block');
        const frames = atRule('@keyframes andes-upload-card-out');
        expect(declaredValue(frames, 'to', 'scale')).toBe('0.9');
        expect(declaredValue(frames, 'to', 'opacity')).toBe('0');
        expect(motion).not.toContain('width: 0');
      });

      it('fills a finished bar before it fades, and only fades a failed one', () => {
        expect(
          declaredValue(motion, '.andes-upload__progress--leave', 'animation'),
        ).toContain('andes-upload-fade-out');
        expect(
          declaredValue(
            motion,
            ".andes-upload__item[data-status='done'] .andes-upload__progress-bar",
            'inline-size',
          ),
        ).toBe('100% !important');
        expect(motion).not.toContain(
          "[data-status='error'] .andes-upload__progress",
        );
      });

      it('eases the error colours in', () => {
        expect(
          declaredValue(motion, '.andes-upload__name', 'transition'),
        ).toContain('color');
        expect(
          declaredValue(motion, '.andes-upload__row', 'transition'),
        ).toContain('border-color');
      });
    });

    describe('forced colors', () => {
      // The last block: the field row has an earlier one for its focus ring.
      const forced = atRule('@media (forced-colors: active)', 'last');

      it('keeps the progress bar visible with system colours', () => {
        expect(
          declaredValue(
            forced,
            '.andes-upload__progress-bar',
            'background-color',
          ),
        ).toBe('Highlight');
        expect(
          declaredValue(
            forced,
            '.andes-upload__progress',
            'forced-color-adjust',
          ),
        ).toBe('none');
      });

      it('adds shape cues where colour alone would carry the state', () => {
        expect(
          declaredValue(
            forced,
            '.andes-upload__select--drag[data-dragging]',
            'outline',
          ),
        ).toContain('Highlight');
        expect(
          declaredValue(
            forced,
            '.andes-upload__select--drag.andes-upload__select--invalid',
            'border-style',
          ),
        ).toBe('solid');
      });
    });

    describe('invalid state', () => {
      const invalidBorder = (selector: string) =>
        declaredValue(css, selector, 'border-color');

      it('keeps the danger border on the drop area through hover and dragging', () => {
        const base =
          '.andes-upload__select--drag.andes-upload__select--invalid';
        for (const selector of [
          base,
          `${base}:hover`,
          `${base}[data-dragging]`,
        ]) {
          expect(invalidBorder(selector)).toBe(
            'var(--andes-color-danger, #dc2626)',
          );
        }
      });

      it('draws the card trigger with the danger border too', () => {
        const base =
          '.andes-upload__select--card.andes-upload__select--invalid';
        expect(invalidBorder(base)).toBe('var(--andes-color-danger, #dc2626)');
        expect(invalidBorder(`${base}:hover`)).toBe(
          'var(--andes-color-danger, #dc2626)',
        );
      });

      it('comes after the drag and card rules it has to beat', () => {
        const invalid = css.indexOf(
          '.andes-upload__select--card.andes-upload__select--invalid',
        );
        expect(invalid).toBeGreaterThan(
          css.indexOf('.andes-upload__select--card:not([data-disabled]):hover'),
        );
        expect(invalid).toBeGreaterThan(
          css.indexOf('.andes-upload__select--drag[data-dragging]'),
        );
      });

      it('marks the trigger and the real input as invalid', async () => {
        const { host, root, fixture, input } = setup();
        host.withContent.set(false);
        host.listType.set('picture-card');
        fixture.detectChanges();
        const trigger = root.querySelector(
          '[data-slot="upload-trigger"]',
        ) as HTMLElement;
        expect(trigger.hasAttribute('data-invalid')).toBe(false);

        host.invalid.set(true);
        fixture.detectChanges();
        expect(trigger.hasAttribute('data-invalid')).toBe(true);
        expect(trigger.classList).toContain('andes-upload__select--invalid');
        expect(input().getAttribute('aria-invalid')).toBe('true');
      });
    });

    describe('focus ring', () => {
      it('follows the corners of the drop area and of the cards', () => {
        const ring = ':has(.andes-upload__input:focus-visible)';
        const radius = (selector: string) =>
          declaredValue(css, `${selector}${ring}`, 'border-radius');
        expect(radius('.andes-upload__select--drag')).toBe(
          'var(--andes-radius-lg, 0.5rem)',
        );
        expect(radius('.andes-upload__select--card')).toBe(
          'var(--andes-radius-lg, 0.5rem)',
        );
        expect(radius('.andes-upload__select[data-circle]')).toBe(
          'var(--andes-radius-full, 9999px)',
        );
        // The drop area itself is drawn with the same radius.
        expect(
          declaredValue(css, '.andes-upload__select--drag', 'border-radius'),
        ).toBe('var(--andes-radius-lg, 0.5rem)');
      });
    });

    it('reveals picture-card actions on hover and keyboard focus', () => {
      expect(css).toContain(':focus-within .andes-upload__actions');
    });
  });
});

/* ------------------------------------------------------------------- dragger */

describe('AndesUploadDragger', () => {
  beforeEach(() => {
    Object.assign(URL, {
      createObjectURL: vi.fn(() => 'blob:x'),
      revokeObjectURL: vi.fn(),
    });
  });

  function setup() {
    const fixture = TestBed.createComponent(DraggerHost);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    return {
      fixture,
      host: fixture.componentInstance,
      root,
      area: () => root.querySelector('.andes-upload__select') as HTMLElement,
      flush: async () => {
        await new Promise((resolve) => setTimeout(resolve));
        fixture.detectChanges();
      },
    };
  }

  it('renders the icon, title and hint of the drop area', () => {
    const { root, host, fixture } = setup();
    expect(root.querySelector('.andes-upload__drag-icon svg')).not.toBeNull();
    expect(
      root.querySelector('.andes-upload__drag-title')?.textContent?.trim(),
    ).toBe('Click or drag files to this area to upload');
    expect(root.querySelector('.andes-upload__drag-hint')).toBeNull();

    host.title.set('Drop the invoices here');
    host.hint.set('PDF up to 5 MB');
    fixture.detectChanges();
    expect(
      root.querySelector('.andes-upload__drag-title')?.textContent?.trim(),
    ).toBe('Drop the invoices here');
    expect(root.querySelector('.andes-upload__drag-hint')?.textContent).toBe(
      'PDF up to 5 MB',
    );
  });

  it('highlights while files are dragged over and clears on leave', () => {
    const { area, fixture } = setup();
    const over = dragEvent('dragenter');
    area().dispatchEvent(over);
    fixture.detectChanges();
    expect(over.defaultPrevented).toBe(true);
    expect(area().hasAttribute('data-dragging')).toBe(true);

    area().dispatchEvent(dragEvent('dragenter'));
    area().dispatchEvent(dragEvent('dragleave'));
    fixture.detectChanges();
    expect(area().hasAttribute('data-dragging')).toBe(true);
    area().dispatchEvent(dragEvent('dragleave'));
    fixture.detectChanges();
    expect(area().hasAttribute('data-dragging')).toBe(false);
  });

  it('sets the drop effect and ignores drags that carry no files', () => {
    const { area, fixture } = setup();
    const over = dragEvent('dragover');
    area().dispatchEvent(over);
    expect(
      (over as unknown as { dataTransfer: { dropEffect: string } }).dataTransfer
        .dropEffect,
    ).toBe('copy');

    const text = dragEvent('dragenter', [], ['text/plain']);
    area().dispatchEvent(text);
    fixture.detectChanges();
    expect(text.defaultPrevented).toBe(false);
    expect(area().hasAttribute('data-dragging')).toBe(false);
  });

  it('adds dropped files, emits drop and keeps the raw event off the host', async () => {
    const { area, host, flush } = setup();
    const drop = dragEvent('drop', [pdf('a.pdf'), pdf('b.pdf')]);
    area().dispatchEvent(drop);
    await flush();

    expect(drop.defaultPrevented).toBe(true);
    expect(host.drops).toHaveLength(1);
    expect(host.nativeDrops).toBe(0);
    expect(
      host
        .dragger()
        .fileList()
        .map((f) => f.name),
    ).toEqual(['a.pdf', 'b.pdf']);
    expect(area().hasAttribute('data-dragging')).toBe(false);
  });

  it('ignores drops while disabled', async () => {
    const { area, host, fixture, flush } = setup();
    host.disabled.set(true);
    fixture.detectChanges();
    area().dispatchEvent(dragEvent('drop', [pdf()]));
    await flush();
    expect(host.drops).toHaveLength(0);
    expect(host.dragger().fileList()).toEqual([]);
  });

  it('shows the same focus and tab behaviour as the plain control', () => {
    const { root } = setup();
    const input = root.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input.getAttribute('tabindex')).toBeNull();
    expect(input.getAttribute('aria-label')).toBe('Select files');
  });

  it('does not accept drops on the plain control', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const area = fixture.nativeElement.querySelector(
      '.andes-upload__select',
    ) as HTMLElement;
    const event = dragEvent('dragenter');
    area.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
    expect(area.hasAttribute('data-dragging')).toBe(false);
  });
});

/* --------------------------------------------------------------------- forms */

describe('AndesUpload with Forms', () => {
  function setup() {
    const fixture = TestBed.createComponent(FormHost);
    fixture.detectChanges();
    return {
      fixture,
      host: fixture.componentInstance,
      input: fixture.nativeElement.querySelector(
        'input[type="file"]',
      ) as HTMLInputElement,
      flush: async () => {
        await new Promise((resolve) => setTimeout(resolve));
        fixture.detectChanges();
      },
    };
  }

  it('writes the control value into the list', () => {
    const { host, fixture } = setup();
    host.control.setValue([{ uid: '1', name: 'a.pdf', status: 'done' }]);
    fixture.detectChanges();
    expect(host.upload().fileList()).toHaveLength(1);
    host.control.setValue(null);
    expect(host.upload().fileList()).toEqual([]);
  });

  it('pushes list changes to the control and validates them', async () => {
    const { host, flush, input } = setup();
    expect(host.control.errors).toEqual({ required: true });

    choose(input, [pdf('a.pdf')]);
    await flush();
    expect(host.control.value).toHaveLength(1);
    expect(host.control.errors).toEqual({ uploadPending: true });

    host.options[0].onSuccess({});
    await flush();
    expect(host.control.errors).toBeNull();
    expect(host.control.dirty).toBe(true);

    choose(input, [pdf('b.pdf')]);
    await flush();
    host.options[1].onError(new Error('x'));
    await flush();
    expect(host.control.errors).toEqual({ uploadFailed: true });

    choose(input, [pdf('c.pdf')]);
    await flush();
    expect(host.control.errors).toMatchObject({
      uploadMaxFiles: { max: 2, actual: 3 },
    });
  });

  describe('upload progress', () => {
    async function start(emitProgress: boolean) {
      const fixture = TestBed.createComponent(ProgressFormHost);
      fixture.componentInstance.emitProgress.set(emitProgress);
      fixture.detectChanges();
      const emitted: AndesUploadFile[][] = [];
      fixture.componentInstance.control.valueChanges.subscribe((value) =>
        emitted.push(value ?? []),
      );
      choose(
        fixture.nativeElement.querySelector(
          'input[type="file"]',
        ) as HTMLInputElement,
        [pdf('a.pdf')],
      );
      await new Promise((resolve) => setTimeout(resolve));
      fixture.detectChanges();
      return { fixture, host: fixture.componentInstance, emitted };
    }

    it('tells the control about states, not about every percent', async () => {
      const { host, fixture, emitted } = await start(false);
      expect(emitted).toHaveLength(1);
      expect(emitted[0][0].status).toBe('uploading');

      for (const percent of [10, 40, 80]) {
        host.options[0].onProgress(percent);
      }
      fixture.detectChanges();
      expect(emitted).toHaveLength(1);
      // The model still carries the progress.
      const upload = fixture.debugElement.children[0].componentInstance;
      expect(upload.fileList()[0].percent).toBe(80);

      host.options[0].onSuccess({});
      expect(emitted).toHaveLength(2);
      expect(emitted[1][0]).toMatchObject({ status: 'done', percent: 100 });
    });

    it('reports every step with emitProgressToForm', async () => {
      const { host, emitted } = await start(true);
      for (const percent of [10, 40, 80]) {
        host.options[0].onProgress(percent);
      }
      expect(emitted.map((list) => list[0].percent)).toEqual([0, 10, 40, 80]);
    });

    it('still reports a file that starts sending later', async () => {
      const fixture = TestBed.createComponent(ProgressFormHost);
      fixture.detectChanges();
      const emitted: AndesUploadFile[][] = [];
      fixture.componentInstance.control.valueChanges.subscribe((value) =>
        emitted.push(value ?? []),
      );
      fixture.componentInstance.control.setValue([
        {
          uid: 'x',
          name: 'x.pdf',
          status: 'ready',
          originFileObj: pdf('x.pdf'),
        },
      ]);
      emitted.length = 0;
      const upload = fixture.debugElement.children[0].componentInstance;
      upload.submit();
      await new Promise((resolve) => setTimeout(resolve));
      expect(emitted).toHaveLength(1);
      expect(emitted[0][0].status).toBe('uploading');
    });
  });

  it('follows the control\u2019s disabled state', () => {
    const { host, fixture, input } = setup();
    host.control.disable();
    fixture.detectChanges();
    expect(input.disabled).toBe(true);
    host.control.enable();
    fixture.detectChanges();
    expect(input.disabled).toBe(false);
  });

  it('marks the control touched when focus leaves', () => {
    const { host, input } = setup();
    expect(host.control.touched).toBe(false);
    input.dispatchEvent(
      new FocusEvent('focusout', { bubbles: true, relatedTarget: null }),
    );
    expect(host.control.touched).toBe(true);
  });
});

describe('upload validators', () => {
  it('reports nothing for empty or missing values', () => {
    expect(andesUploadSettled()(new FormControl(null))).toBeNull();
    expect(andesUploadSettled()(new FormControl([]))).toBeNull();
    expect(andesUploadMaxFiles(1)(new FormControl(null))).toBeNull();
  });
});

@Component({
  imports: [AndesUpload, AndesButton, ReactiveFormsModule],
  template: `<andes-upload [formControl]="control"
    ><andes-button>Pick</andes-button></andes-upload
  >`,
})
class FormButtonHost {
  readonly control = new FormControl<AndesUploadFile[]>([]);
}

describe('AndesUpload button context', () => {
  function create() {
    const fixture = TestBed.createComponent(ButtonsHost);
    fixture.detectChanges();
    const isDisabled = (selector: string) =>
      (
        fixture.nativeElement.querySelector(
          `${selector} button`,
        ) as HTMLButtonElement
      ).disabled;
    return { fixture, host: fixture.componentInstance, isDisabled };
  }

  it('disables the buttons projected into a disabled upload', () => {
    const { fixture, host, isDisabled } = create();
    expect(isDisabled('.projected-button')).toBe(false);
    expect(isDisabled('.dragger-button')).toBe(false);

    host.disabled.set(true);
    fixture.detectChanges();
    expect(isDisabled('.projected-button')).toBe(true);
    expect(isDisabled('.dragger-button')).toBe(true);
    expect(isDisabled('.outside-button')).toBe(false);

    host.disabled.set(false);
    fixture.detectChanges();
    expect(isDisabled('.projected-button')).toBe(false);
  });

  it('follows the disabled state a form control sets', () => {
    const fixture = TestBed.createComponent(FormButtonHost);
    fixture.detectChanges();
    const button = () =>
      fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(button().disabled).toBe(false);
    fixture.componentInstance.control.disable();
    fixture.detectChanges();
    expect(button().disabled).toBe(true);
  });
});
