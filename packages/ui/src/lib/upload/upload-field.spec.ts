import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { Component, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

import { AndesUpload } from './upload';
import type {
  AndesUploadBeforeRemove,
  AndesUploadChangeEvent,
  AndesUploadFile,
  AndesUploadListType,
  AndesUploadMessages,
  AndesUploadRejection,
  AndesUploadRequestOptions,
  AndesUploadSize,
  AndesUploadVariant,
} from './upload-types';

@Component({
  imports: [AndesUpload],
  template: `<andes-upload
    #upload
    [variant]="variant()"
    [(fileList)]="files"
    [customRequest]="request"
    [autoUpload]="autoUpload()"
    [size]="size()"
    [accept]="accept()"
    [multiple]="multiple()"
    [maxCount]="maxCount()"
    [maxSize]="maxSize()"
    [disabled]="disabled()"
    [listType]="listType()"
    [showUploadList]="showList()"
    [beforeRemove]="beforeRemove()"
    [messages]="messages()"
    [aria-label]="ariaLabel()"
    [aria-describedby]="describedBy()"
    [aria-invalid]="invalid()"
    (changed)="changes.push($event)"
    (remove)="removed.push($event)"
    (rejected)="rejections.push($event)"
    (dropped)="drops = drops + 1"
    ><button type="button" class="projected">Pick</button></andes-upload
  >`,
})
class FieldHost {
  readonly upload = viewChild.required<AndesUpload>('upload');
  readonly variant = signal<AndesUploadVariant>('field');
  readonly files = signal<AndesUploadFile[]>([]);
  readonly autoUpload = signal(true);
  readonly size = signal<AndesUploadSize>('md');
  readonly accept = signal<string | undefined>(undefined);
  readonly multiple = signal(true);
  readonly maxCount = signal<number | undefined>(undefined);
  readonly maxSize = signal<number | undefined>(undefined);
  readonly disabled = signal(false);
  readonly listType = signal<AndesUploadListType>('text');
  readonly showList = signal(true);
  readonly beforeRemove = signal<AndesUploadBeforeRemove | undefined>(
    undefined,
  );
  readonly messages = signal<Partial<AndesUploadMessages> | undefined>(
    undefined,
  );
  readonly ariaLabel = signal<string | undefined>(undefined);
  readonly describedBy = signal<string | undefined>(undefined);
  readonly invalid = signal(false);

  requests: AndesUploadRequestOptions[] = [];
  aborted: string[] = [];
  changes: AndesUploadChangeEvent[] = [];
  removed: AndesUploadFile[] = [];
  rejections: AndesUploadRejection[][] = [];
  drops = 0;

  readonly request = (options: AndesUploadRequestOptions) => {
    this.requests.push(options);
    return { abort: () => this.aborted.push(options.uploadFile.uid) };
  };
}

@Component({
  imports: [AndesUpload, ReactiveFormsModule],
  template: `<andes-upload
    variant="field"
    [formControl]="control"
    [customRequest]="request"
  />`,
})
class FieldFormHost {
  readonly control = new FormControl<AndesUploadFile[]>([]);
  readonly request = () => undefined;
}

const pdf = (name = 'invoice.pdf', size = 100) =>
  new File([new Uint8Array(size)], name, { type: 'application/pdf' });

const done = (uid: string, name: string): AndesUploadFile => ({
  uid,
  name,
  status: 'done',
});

function setup() {
  const fixture = TestBed.createComponent(FieldHost);
  const host = fixture.componentInstance;
  fixture.detectChanges();
  const root = fixture.nativeElement as HTMLElement;
  const q = <T extends Element = HTMLElement>(selector: string) =>
    root.querySelector<T>(selector);
  return {
    fixture,
    host,
    root,
    detect: () => fixture.detectChanges(),
    flush: async () => {
      await new Promise((resolve) => setTimeout(resolve));
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
    },
    field: () => q('[data-slot="upload-field"]'),
    text: () => q('[data-slot="upload-field-text"]'),
    clear: () => q<HTMLButtonElement>('[data-slot="upload-field-clear"]'),
    input: () => q<HTMLInputElement>('input[type="file"]') as HTMLInputElement,
    live: () =>
      q('[role="status"]')
        ?.textContent?.replace(/\u00a0/g, '')
        .trim(),
  };
}

function choose(input: HTMLInputElement, files: File[]) {
  Object.defineProperty(input, 'files', { value: files, configurable: true });
  input.dispatchEvent(new Event('change', { bubbles: true }));
}

function dragEvent(type: string, files: File[] = []) {
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.defineProperty(event, 'dataTransfer', {
    value: { types: ['Files'], files, dropEffect: 'none' },
  });
  return event;
}

describe('AndesUpload field variant', () => {
  describe('rendering', () => {
    it('draws one row: the choose segment, the placeholder and no list', () => {
      const { root, field, text, clear, input } = setup();
      const row = field();
      expect(row).not.toBeNull();
      expect(
        root.querySelector('andes-upload')?.getAttribute('data-variant'),
      ).toBe('field');
      expect(
        row?.querySelector('[data-slot="upload-field-button"]')?.textContent,
      ).toContain('Select files');
      expect(text()?.textContent?.trim()).toBe('No file chosen');
      expect(row?.hasAttribute('data-empty')).toBe(true);
      expect(clear()).toBeNull();
      expect(row?.contains(input())).toBe(true);
      expect(root.querySelector('[data-slot="upload-trigger"]')).toBeNull();
      expect(root.querySelector('.projected')).toBeNull();
    });

    it.each(['sm', 'md', 'lg'] as const)(
      'carries the %s size class',
      (size) => {
        const { host, detect, root } = setup();
        host.size.set(size);
        detect();
        const rootEl = root.querySelector('[data-slot="upload-root"]');
        expect(rootEl?.classList).toContain(`andes-upload--${size}`);
        expect(rootEl?.classList).toContain('andes-upload--field');
      },
    );

    it('shows the one file name, or the count for several', () => {
      const { host, detect, text, field } = setup();
      host.files.set([done('a', 'contract-signed-final.pdf')]);
      detect();
      expect(text()?.textContent?.trim()).toBe('contract-signed-final.pdf');
      expect(text()?.getAttribute('title')).toBe('contract-signed-final.pdf');
      expect(field()?.hasAttribute('data-empty')).toBe(false);

      host.files.set([
        done('a', 'a.pdf'),
        done('b', 'b.pdf'),
        done('c', 'c.pdf'),
      ]);
      detect();
      expect(text()?.textContent?.trim()).toBe('3 files');

      host.messages.set({
        filesChosen: ({ count }) => `${count} archivos`,
      });
      detect();
      expect(text()?.textContent?.trim()).toBe('3 archivos');
    });

    it('never renders the list, whatever listType and showUploadList say', () => {
      const { host, detect, root } = setup();
      host.files.set([done('a', 'a.png'), done('b', 'b.png')]);
      for (const type of ['text', 'picture', 'picture-card'] as const) {
        host.listType.set(type);
        detect();
        expect(root.querySelector('[data-slot="upload-list"]')).toBeNull();
        expect(root.querySelector('[data-slot="upload-cards"]')).toBeNull();
        expect(
          root.querySelector('andes-upload')?.getAttribute('data-list-type'),
        ).toBeNull();
      }
    });

    it('shows progress while sending and the error in the status colours', async () => {
      const { host, detect, flush, input, field, text } = setup();
      host.multiple.set(false);
      detect();
      choose(input(), [pdf()]);
      await flush();
      expect(field()?.getAttribute('data-status')).toBe('uploading');

      // Before the first progress event the line sweeps instead of sitting at 0.
      expect(
        field()
          ?.querySelector('[role="progressbar"]')
          ?.hasAttribute('data-indeterminate'),
      ).toBe(true);

      host.requests[0].onProgress(40);
      detect();
      const bar = field()?.querySelector('[role="progressbar"]');
      expect(bar?.hasAttribute('data-indeterminate')).toBe(false);
      expect(bar?.getAttribute('aria-valuenow')).toBe('40');
      expect(bar?.getAttribute('aria-label')).toBe('Uploading invoice.pdf');
      expect(text()?.textContent).toContain('40%');

      host.requests[0].onError(new Error('Server said no'));
      detect();
      expect(field()?.getAttribute('data-status')).toBe('error');
      expect(field()?.querySelector('[role="progressbar"]')).toBeNull();
      expect(text()?.textContent).toContain('Server said no');
      expect(text()?.querySelector('andes-upload-icon')).not.toBeNull();
    });
  });

  describe('accessibility', () => {
    it('names the file input and describes it with the file name text', () => {
      const { host, detect, input, text } = setup();
      const id = text()?.id ?? '';
      expect(id).toMatch(/^andes-upload-field-text-\d+$/);
      expect(input().getAttribute('aria-label')).toBe('Select files');
      expect(input().getAttribute('aria-describedby')).toBe(id);

      host.ariaLabel.set('Invoice');
      host.describedBy.set('help');
      detect();
      expect(input().getAttribute('aria-label')).toBe('Invoice');
      expect(input().getAttribute('aria-describedby')).toBe(`help ${id}`);
      expect(
        input()
          .closest('[data-slot="upload-field"]')
          ?.querySelector('[aria-hidden="true"]')?.textContent,
      ).toContain('Select files');
    });

    it('gives the clear button its own, localisable name and tab stop', () => {
      const { host, detect, clear } = setup();
      host.files.set([done('a', 'a.pdf')]);
      detect();
      expect(clear()?.getAttribute('aria-label')).toBe('Remove a.pdf');
      expect(clear()?.type).toBe('button');
      expect(clear()?.getAttribute('tabindex')).toBeNull();

      host.files.set([done('a', 'a.pdf'), done('b', 'b.pdf')]);
      host.messages.set({
        remove: 'Quitar {name}',
        filesChosen: '{count} archivos',
      });
      detect();
      expect(clear()?.getAttribute('aria-label')).toBe('Quitar 2 archivos');
    });

    it('announces added files through the live region', async () => {
      const { input, flush, live } = setup();
      choose(input(), [pdf('a.pdf'), pdf('b.pdf')]);
      await flush();
      expect(live()).toBe('a.pdf added. b.pdf added');
    });

    it('announces additions and rejections together', async () => {
      const { host, detect, input, flush, live } = setup();
      host.accept.set('.pdf');
      detect();
      choose(input(), [pdf('a.pdf'), new File(['x'], 'b.exe')]);
      await flush();
      expect(live()).toBe(
        'a.pdf added. b.exe was not added: this file type is not allowed',
      );
      expect(host.rejections[0][0].reason).toBe('accept');
    });

    it('takes localised texts from messages', () => {
      const { host, detect, text, field } = setup();
      host.messages.set({
        selectFiles: 'Elegir archivo',
        noFileChosen: 'Ningún archivo seleccionado',
      });
      detect();
      expect(text()?.textContent?.trim()).toBe('Ningún archivo seleccionado');
      expect(
        field()?.querySelector('[data-slot="upload-field-button"]')
          ?.textContent,
      ).toContain('Elegir archivo');
    });
  });

  describe('clear button', () => {
    it('removes the file through removeFile: events, abort and announcement', async () => {
      const { host, detect, flush, input, clear, live, text } = setup();
      choose(input(), [pdf()]);
      await flush();
      const uid = host.files()[0].uid;
      host.changes = [];

      clear()?.click();
      await flush();
      expect(host.files()).toEqual([]);
      expect(host.aborted).toEqual([uid]);
      expect(host.removed.map((f) => f.status)).toEqual(['removed']);
      expect(host.changes.at(-1)?.file.status).toBe('removed');
      expect(host.changes.at(-1)?.fileList).toEqual([]);
      expect(live()).toBe('invoice.pdf removed');
      expect(text()?.textContent?.trim()).toBe('No file chosen');
      expect(clear()).toBeNull();
      detect();
      expect(document.activeElement === input() || !input().isConnected).toBe(
        true,
      );
    });

    it('does not open the file dialog', () => {
      const { host, detect, input, clear } = setup();
      host.files.set([done('a', 'a.pdf')]);
      detect();
      const click = vi.spyOn(input(), 'click');
      clear()?.click();
      expect(click).not.toHaveBeenCalled();
    });

    it('lets beforeRemove veto each file', async () => {
      const { host, detect, flush, clear, live } = setup();
      host.files.set([done('a', 'keep.pdf'), done('b', 'drop.pdf')]);
      host.beforeRemove.set((file) => file.name !== 'keep.pdf');
      detect();
      clear()?.click();
      await flush();
      expect(host.files().map((f) => f.name)).toEqual(['keep.pdf']);
      expect(host.removed.map((f) => f.name)).toEqual(['drop.pdf']);
      expect(live()).toBe('drop.pdf removed');
      expect(clear()).not.toBeNull();
    });

    it('is not offered while disabled', () => {
      const { host, detect, clear, field, input } = setup();
      host.files.set([done('a', 'a.pdf')]);
      host.disabled.set(true);
      detect();
      expect(clear()).toBeNull();
      expect(field()?.hasAttribute('data-disabled')).toBe(true);
      expect(input().disabled).toBe(true);
    });
  });

  describe('states', () => {
    it('marks the row invalid and forwards aria-invalid', () => {
      const { host, detect, field, input } = setup();
      host.invalid.set(true);
      detect();
      expect(field()?.classList).toContain('andes-upload__field--invalid');
      expect(input().getAttribute('aria-invalid')).toBe('true');
    });

    it('opens the dialog on a row click', () => {
      const { field, input } = setup();
      const click = vi.spyOn(input(), 'click');
      field()?.click();
      expect(click).toHaveBeenCalledTimes(1);
    });
  });

  describe('drop and paste', () => {
    it('highlights the row while dragging and adds dropped files', async () => {
      const { host, field, detect, flush } = setup();
      const row = field() as HTMLElement;
      const enter = dragEvent('dragenter');
      row.dispatchEvent(enter);
      detect();
      expect(enter.defaultPrevented).toBe(true);
      expect(row.hasAttribute('data-dragging')).toBe(true);

      const over = dragEvent('dragover');
      row.dispatchEvent(over);
      expect(over.defaultPrevented).toBe(true);

      row.dispatchEvent(dragEvent('drop', [pdf('dropped.pdf')]));
      await flush();
      expect(row.hasAttribute('data-dragging')).toBe(false);
      expect(host.drops).toBe(1);
      expect(host.files().map((f) => f.name)).toEqual(['dropped.pdf']);
    });

    it('ignores drops while disabled', async () => {
      const { host, field, detect, flush } = setup();
      host.disabled.set(true);
      detect();
      field()?.dispatchEvent(dragEvent('drop', [pdf()]));
      await flush();
      expect(host.files()).toEqual([]);
    });

    it('accepts pasted files', async () => {
      const { host, field, flush } = setup();
      const event = new Event('paste', { bubbles: true, cancelable: true });
      Object.defineProperty(event, 'clipboardData', {
        value: { files: [pdf('pasted.pdf')] },
      });
      field()?.dispatchEvent(event);
      await flush();
      expect(event.defaultPrevented).toBe(true);
      expect(host.files().map((f) => f.name)).toEqual(['pasted.pdf']);
    });
  });

  describe('same rules as the default variant', () => {
    it('applies maxSize, maxCount and replaces with maxCount 1', async () => {
      const { host, detect, flush, input, text } = setup();
      host.maxSize.set(50);
      detect();
      choose(input(), [pdf('big.pdf', 100)]);
      await flush();
      expect(host.rejections[0][0].reason).toBe('size');
      expect(host.files()).toEqual([]);

      host.maxSize.set(undefined);
      host.maxCount.set(1);
      detect();
      choose(input(), [pdf('one.pdf')]);
      await flush();
      choose(input(), [pdf('two.pdf')]);
      await flush();
      expect(host.files().map((f) => f.name)).toEqual(['two.pdf']);
      expect(
        text()?.querySelector('.andes-upload__field-name')?.textContent,
      ).toBe('two.pdf');
      expect(host.removed.map((f) => f.name)).toEqual(['one.pdf']);
    });

    it('leaves files ready without autoUpload', async () => {
      const { host, detect, flush, input, field } = setup();
      host.autoUpload.set(false);
      detect();
      choose(input(), [pdf()]);
      await flush();
      expect(field()?.getAttribute('data-status')).toBe('ready');
      expect(host.requests).toEqual([]);
      host.upload().submit();
      expect(host.requests).toHaveLength(1);
    });
  });

  it('keeps the default variant output unchanged', () => {
    const { host, detect, root, input } = setup();
    host.variant.set('default');
    host.files.set([done('a', 'a.pdf')]);
    detect();
    expect(root.querySelector('[data-slot="upload-field"]')).toBeNull();
    expect(root.querySelector('[data-slot="upload-trigger"]')).not.toBeNull();
    expect(root.querySelector('.projected')).not.toBeNull();
    expect(root.querySelector('[data-slot="upload-list"]')).not.toBeNull();
    expect(input().hasAttribute('aria-describedby')).toBe(false);
    expect(
      root.querySelector('[data-slot="upload-root"]')?.classList,
    ).not.toContain('andes-upload--field');
    expect(
      root.querySelector('andes-upload')?.getAttribute('data-list-type'),
    ).toBe('text');
  });

  it('works as a form control', async () => {
    const fixture = TestBed.createComponent(FieldFormHost);
    fixture.detectChanges();
    const host = fixture.componentInstance;
    const root = fixture.nativeElement as HTMLElement;
    const input = root.querySelector('input[type="file"]') as HTMLInputElement;
    choose(input, [pdf('form.pdf')]);
    await new Promise((resolve) => setTimeout(resolve));
    fixture.detectChanges();
    expect(host.control.value?.map((f) => f.name)).toEqual(['form.pdf']);
    expect(host.control.touched).toBe(true);

    host.control.setValue([done('x', 'restored.pdf')]);
    fixture.detectChanges();
    expect(
      root
        .querySelector('[data-slot="upload-field-text"]')
        ?.textContent?.trim(),
    ).toBe('restored.pdf');

    host.control.disable();
    fixture.detectChanges();
    expect(root.querySelector('[data-slot="upload-field-clear"]')).toBeNull();
    expect(input.disabled).toBe(true);
  });

  describe('stylesheet contract', () => {
    const css = readFileSync(
      join(process.cwd(), 'packages/ui/src/lib/upload/upload.css'),
      'utf8',
    );

    it('uses the text field heights, radii and ring', () => {
      for (const token of [
        '--andes-control-height-sm',
        '--andes-control-height-md',
        '--andes-control-height-lg',
        '--andes-control-radius-sm',
        '--andes-control-radius-lg',
      ]) {
        expect(css).toContain(token);
      }
      expect(css).toContain('.andes-upload__field:focus-within {');
      expect(css).toContain(
        'box-shadow: 0 0 0 2px var(--_andes-upload-field-ring);',
      );
      expect(css).toContain(".andes-upload__field[data-status='error']");
    });

    it('uses logical properties and turns transitions off for reduced motion', () => {
      const rule = css.slice(css.indexOf('.andes-upload__field-button {'));
      expect(rule).toContain('border-inline-end');
      const block = css.slice(css.indexOf('prefers-reduced-motion'));
      expect(block).toContain('.andes-upload__field,');
      expect(block).toContain('.andes-upload__field-progress-bar');
    });
  });
});
