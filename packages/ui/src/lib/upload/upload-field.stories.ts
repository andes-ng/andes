import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';

import { AndesButton } from '../button/button';
import { AndesInput } from '../input/input';
import { AndesUpload } from './upload';
import { andesUploadSettled } from './upload-forms';
import type {
  AndesUploadFile,
  AndesUploadMessages,
  AndesUploadRejection,
  AndesUploadRequest,
} from './upload-types';

/**
 * A stand-in transport so the stories need no server: progress on a timer, and a failure for
 * any file whose name contains "fail".
 */
const fakeUpload: AndesUploadRequest = (options) => {
  let percent = 0;
  const timer = setInterval(() => {
    percent = Math.min(100, percent + 8 + Math.round(Math.random() * 10));
    options.onProgress(percent);
    if (percent >= 100) {
      clearInterval(timer);
      if (options.file instanceof File && /fail/i.test(options.file.name)) {
        options.onError(new Error('The server refused this file'));
      } else {
        options.onSuccess({ id: Math.round(Math.random() * 1e6) });
      }
    }
  }, 300);
  return { abort: () => clearInterval(timer) };
};

const sampleFile = (name: string, bytes = 20_000) =>
  new File([new Uint8Array(bytes)], name, { type: 'application/pdf' });

const SPANISH: Partial<AndesUploadMessages> = {
  selectFiles: 'Elegir archivo',
  noFileChosen: 'Ningún archivo seleccionado',
  filesChosen: '{count} archivos',
  remove: 'Quitar {name}',
  uploading: 'Subiendo {name}',
  uploadFailed: 'No se pudo subir',
  announceAdded: '{name} agregado',
  announceRemoved: '{name} quitado',
  announceUploaded: '{name} subido',
  announceFailed: '{name} no se pudo subir',
  announceRejected: '{name} no se agregó: {reason}',
  rejectAccept: 'este tipo de archivo no está permitido',
  rejectSize: 'el archivo supera {max}',
  rejectCount: 'se alcanzó el límite de {count} archivos',
};

const meta: Meta<AndesUpload> = {
  title: 'Data Entry/Input/Specialized/File field',
  component: AndesUpload,
  decorators: [moduleMetadata({ imports: [AndesUpload, AndesButton] })],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          '`variant="field"` draws `andes-upload` as one row the height of a text field: a "choose" segment, the chosen file name (or a placeholder, or "{count} files"), a progress line while sending and a clear button. It has no list under it. The hidden native file input stays the keyboard stop and is described by the file name; the clear button is its own tab stop. Every rule of the default variant applies (`accept`, `maxSize`, `maxCount`, `multiple`, `directory`, `beforeUpload`, `beforeRemove`, `customRequest`, `action`, `autoUpload`, Forms).',
      },
    },
  },
};

export default meta;

type Story = StoryObj<AndesUpload>;

/** `sm`, `md` and `lg` use the text field heights: 24, 32 and 40px. */
export const Sizes: Story = {
  render: () => ({
    props: { demoRequest: fakeUpload },
    template: `<div style="display: grid; gap: 0.75rem; max-width: 24rem;">
      <andes-upload variant="field" size="sm" [customRequest]="demoRequest" aria-label="Small file field" />
      <andes-upload variant="field" size="md" [customRequest]="demoRequest" aria-label="Medium file field" />
      <andes-upload variant="field" size="lg" [customRequest]="demoRequest" aria-label="Large file field" />
    </div>`,
  }),
};

@Component({
  selector: 'andes-story-file-field-limits',
  imports: [AndesUpload],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div style="display: grid; gap: 0.5rem; max-width: 24rem;">
      <span id="cv-label" style="font-weight: 500;">Curriculum (PDF)</span>
      <andes-upload
        variant="field"
        accept=".pdf"
        [maxSize]="1048576"
        [customRequest]="request"
        aria-labelledby="cv-label"
        aria-describedby="cv-help"
        (rejected)="rejections.set($event)"
      />
      <span
        id="cv-help"
        style="font-size: 0.75rem; line-height: 1.25rem; color: var(--andes-color-muted-foreground);"
        >PDF only, at most 1 MB.</span
      >
      @for (item of rejections(); track $index) {
        <span
          style="color: var(--andes-color-danger-text, var(--andes-color-danger));"
          >{{ item.file.name }}: {{ item.reason }}</span
        >
      }
    </div>
  `,
})
class LimitsDemo {
  protected readonly request = fakeUpload;
  protected readonly rejections = signal<AndesUploadRejection[]>([]);
}

export const Limits: Story = {
  name: 'Accept, size and rejections',
  decorators: [moduleMetadata({ imports: [LimitsDemo] })],
  render: () => ({ template: `<andes-story-file-field-limits />` }),
};

/** With `multiple`, several files read as "{count} files"; the clear button removes them all. */
export const Multiple: Story = {
  render: () => ({
    props: {
      demoRequest: fakeUpload,
      demoFiles: [
        { uid: 'm1', name: 'front.jpg', status: 'done' },
        { uid: 'm2', name: 'back.jpg', status: 'done' },
        { uid: 'm3', name: 'side.jpg', status: 'done' },
      ] satisfies AndesUploadFile[],
    },
    template: `<div style="max-width: 24rem;">
      <andes-upload variant="field" [multiple]="true" [maxCount]="5" [(fileList)]="demoFiles" [customRequest]="demoRequest" aria-label="Vehicle photos" />
    </div>`,
  }),
};

/** A failed upload and `aria-invalid` both draw the danger border and ring; disabled is muted. */
export const StatusAndDisabled: Story = {
  name: 'Error and disabled',
  render: () => ({
    props: {
      failedFiles: [
        {
          uid: 'f1',
          name: 'tax-return-2025-signed-and-stamped.pdf',
          status: 'error',
          errorMessage: 'The file is password protected',
        },
      ] satisfies AndesUploadFile[],
      lockedFiles: [
        { uid: 'l1', name: 'contract.pdf', status: 'done' },
      ] satisfies AndesUploadFile[],
    },
    template: `<div style="display: grid; gap: 0.75rem; max-width: 24rem;">
      <andes-upload variant="field" [(fileList)]="failedFiles" aria-label="Tax return" />
      <andes-upload variant="field" [aria-invalid]="true" aria-label="Required document" />
      <andes-upload variant="field" [disabled]="true" [(fileList)]="lockedFiles" aria-label="Contract (locked)" />
      <andes-upload variant="field" [disabled]="true" aria-label="Annex (locked)" />
    </div>`,
  }),
};

/** A form row with `andes-input` next to the upload field, to show the alignment of the two. */
@Component({
  selector: 'andes-story-file-field-form',
  imports: [AndesUpload, AndesButton, AndesInput, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form
      [formGroup]="form"
      style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; align-items: end; max-width: 40rem;"
      (ngSubmit)="saved.set(true)"
    >
      <div style="display: grid; gap: 0.25rem;">
        <label for="story-reference" style="font-weight: 500;">Reference</label>
        <andes-input
          id="story-reference"
          formControlName="reference"
          placeholder="INV-0001"
        />
      </div>
      <div style="display: grid; gap: 0.25rem;">
        <span id="invoice-label" style="font-weight: 500;">Invoice</span>
        <andes-upload
          variant="field"
          accept=".pdf"
          formControlName="invoice"
          [customRequest]="request"
          [aria-invalid]="invoice.invalid && invoice.touched"
          aria-labelledby="invoice-label"
        />
      </div>
      <div>
        <andes-button type="submit" [disabled]="form.invalid"
          >Save</andes-button
        >
      </div>
      @if (saved()) {
        <span>Saved {{ invoice.value?.length }} file(s).</span>
      }
    </form>
  `,
})
class FormDemo {
  protected readonly request = fakeUpload;
  protected readonly saved = signal(false);
  protected readonly invoice = new FormControl<AndesUploadFile[]>([], {
    validators: [Validators.required, andesUploadSettled()],
  });
  protected readonly form = new FormGroup({
    reference: new FormControl(''),
    invoice: this.invoice,
  });
}

export const InAForm: Story = {
  name: 'In a form, next to a text field',
  decorators: [moduleMetadata({ imports: [FormDemo] })],
  render: () => ({ template: `<andes-story-file-field-form />` }),
};

@Component({
  selector: 'andes-story-file-field-controlled',
  imports: [AndesUpload, AndesButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div style="display: grid; gap: 0.75rem; max-width: 24rem;">
      <andes-upload
        #upload
        variant="field"
        [maxCount]="1"
        [(fileList)]="files"
        [customRequest]="request"
        aria-label="Delivery note"
      />
      <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
        <andes-button
          variant="outline"
          size="sm"
          (click)="upload.addFiles([sample('delivery-note.pdf')])"
          >Upload a sample file</andes-button
        >
        <andes-button
          variant="outline"
          size="sm"
          (click)="upload.addFiles([sample('will-fail.pdf')])"
          >Upload a failing file</andes-button
        >
        <andes-button variant="ghost" size="sm" (click)="files.set([])"
          >Reset from outside</andes-button
        >
      </div>
      <code style="font-size: 0.75rem;">{{ summary() }}</code>
    </div>
  `,
})
class ControlledDemo {
  protected readonly request = fakeUpload;
  protected readonly files = signal<AndesUploadFile[]>([
    { uid: 'c1', name: 'delivery-note-march.pdf', status: 'done' },
  ]);
  protected readonly summary = computed(() =>
    JSON.stringify(
      this.files().map(({ name, status, percent }) => ({
        name,
        status,
        percent,
      })),
    ),
  );
  protected sample(name: string): File {
    return sampleFile(name);
  }
}

/**
 * `[(fileList)]` keeps the value outside the control. The buttons add a file through
 * `addFiles()` so the fake `customRequest` shows the progress line and the error state.
 */
export const ControlledWithProgress: Story = {
  name: 'Controlled value and custom request',
  decorators: [moduleMetadata({ imports: [ControlledDemo] })],
  render: () => ({ template: `<andes-story-file-field-controlled />` }),
};

/** Every text comes from `messages`, here in Spanish. */
export const CustomMessages: Story = {
  name: 'Custom messages',
  render: () => ({
    props: { spanishTexts: SPANISH, demoRequest: fakeUpload },
    template: `<div style="max-width: 24rem;">
      <andes-upload variant="field" [multiple]="true" [messages]="spanishTexts" [customRequest]="demoRequest" aria-label="Documentos" />
    </div>`,
  }),
};
