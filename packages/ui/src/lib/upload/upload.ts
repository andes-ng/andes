import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  forwardRef,
  inject,
} from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';

import { ANDES_BUTTON_CONTEXT } from '../button/button-context';
import { AndesButton } from '../button/button';
import { AndesImagePreview } from '../image/image-preview';
import { AndesUploadBase } from './upload-base';
import { AndesUploadIcon } from './upload-icon';

/**
 * Click-to-select upload. Project the trigger (a button, an icon...) as content, or leave it
 * empty for a default `andes-button`; the real, visually hidden file input stays focusable
 * behind it and is the control's single tab stop. A disabled upload also disables the
 * `andes-button`s inside it (through `ANDES_BUTTON_CONTEXT`).
 * Works with Forms (the value is the file list) and inside `andes-form-field`.
 *
 * The preview of a picture opens the library's image viewer (`andes-image-preview`) over all
 * the pictures of the list, growing out of the thumbnail; `imagePreview`, `previewConfig` and
 * `previewLabels` tune it, and a `preview` handler that calls `preventDefault()` replaces it.
 *
 * `variant="field"` draws it instead as one row the height of `andes-input` (sizes sm/md/lg):
 * a "choose" segment, the chosen file name, `{count} files` or a "No file chosen" placeholder,
 * a progress line while sending, the danger colours for a failed file or `aria-invalid`, and
 * a clear button that removes the files through `removeFile()`. Files can be dropped on and
 * pasted into the row. There is no list under it, so `listType`, `showUploadList`,
 * `itemRender` and projected content are ignored.
 */
@Component({
  selector: 'andes-upload',
  exportAs: 'andesUpload',
  imports: [NgTemplateOutlet, AndesButton, AndesImagePreview, AndesUploadIcon],
  templateUrl: './upload.html',
  styleUrl: './upload.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AndesUpload),
      multi: true,
    },
    {
      provide: ANDES_BUTTON_CONTEXT,
      useFactory: () => inject(AndesUpload).buttonContext,
    },
  ],
})
export class AndesUpload extends AndesUploadBase {}

/**
 * The same control with a drag-and-drop area as its trigger: an icon, a title and a hint
 * (`dropIcon`, `dropTitle`, `dropHint`), highlighted while files are dragged over it. Content
 * projected into it shows under the hint.
 */
@Component({
  selector: 'andes-upload-dragger',
  exportAs: 'andesUploadDragger',
  imports: [NgTemplateOutlet, AndesButton, AndesImagePreview, AndesUploadIcon],
  templateUrl: './upload.html',
  styleUrl: './upload.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AndesUploadDragger),
      multi: true,
    },
    {
      provide: ANDES_BUTTON_CONTEXT,
      useFactory: () => inject(AndesUploadDragger).buttonContext,
    },
  ],
})
export class AndesUploadDragger extends AndesUploadBase {
  protected override readonly dragMode = true;
}
