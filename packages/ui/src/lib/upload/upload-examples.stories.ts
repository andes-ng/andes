import {
  CdkDrag,
  CdkDropList,
  moveItemInArray,
  type CdkDragDrop,
} from '@angular/cdk/drag-drop';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideStar, lucideUpload } from '@ng-icons/lucide';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';

import { AndesButton } from '../button/button';
import { AndesImage } from '../image/image';
import { AndesInput } from '../input/input';
import { AndesSwitch } from '../switch/switch';
import { AndesUpload } from './upload';
import { UploadCropDialog } from './upload-crop-demo';
import { formatFileSize } from './upload-files';
import { andesUploadSettled } from './upload-forms';
import type {
  AndesUploadChangeEvent,
  AndesUploadClassNames,
  AndesUploadFile,
  AndesUploadProgressOptions,
  AndesUploadRejection,
  AndesUploadRequest,
  AndesUploadStyles,
} from './upload-types';

/**
 * A stand-in server so the stories need no network: it reports progress on a timer, answers
 * with the address the file would get, and fails any file whose name contains "fail".
 */
const simulatedUpload: AndesUploadRequest = (options) => {
  let percent = 0;
  const timer = setInterval(() => {
    percent = Math.min(100, percent + 10 + Math.round(Math.random() * 15));
    options.onProgress(percent);
    if (percent >= 100) {
      clearInterval(timer);
      const name = options.uploadFile.name;
      if (/fail/i.test(name)) {
        options.onError(new Error('The server refused this file'));
      } else {
        options.onSuccess({
          url: `https://files.example/${encodeURIComponent(name)}`,
        });
      }
    }
  }, 250);
  return { abort: () => clearInterval(timer) };
};

/** Scenic placeholders drawn as SVG (as in the Image stories), so the viewer has real pictures. */
const PALETTES = [
  ['#fde68a', '#fb923c', '#7c3aed', '#3b0764'],
  ['#bae6fd', '#38bdf8', '#16a34a', '#14532d'],
  ['#1e1b4b', '#4338ca', '#312e81', '#0f0a3c'],
  ['#fecdd3', '#fb7185', '#be123c', '#4c0519'],
  ['#a7f3d0', '#2dd4bf', '#0f766e', '#042f2e'],
];

function scene(index: number, width = 1200, height = 800): string {
  const [skyTop, skyBottom, near, far] = PALETTES[index % PALETTES.length];
  const h = height;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${skyTop}"/><stop offset="1" stop-color="${skyBottom}"/></linearGradient></defs>
  <rect width="${width}" height="${height}" fill="url(#g)"/>
  <circle cx="${width * (0.25 + 0.12 * (index % 4))}" cy="${h * 0.3}" r="${h * 0.09}" fill="#ffffff" opacity="0.85"/>
  <path d="M0 ${h * 0.66} Q ${width * 0.3} ${h * 0.48} ${width * 0.6} ${h * 0.64} T ${width} ${h * 0.6} V ${h} H0Z" fill="${near}"/>
  <path d="M0 ${h * 0.84} Q ${width * 0.35} ${h * 0.7} ${width * 0.7} ${h * 0.82} T ${width} ${h * 0.78} V ${h} H0Z" fill="${far}"/>
</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const NAMES = ['sunset-ridge', 'green-valley', 'night-hills', 'rose-horizon'];

/** Pictures already on the server: the viewer shows `url`, the card shows `thumbUrl`. */
function photos(count = 4): AndesUploadFile[] {
  return Array.from({ length: count }, (_, i) => ({
    uid: `photo-${i}`,
    name: `${NAMES[i % NAMES.length]}.svg`,
    status: 'done' as const,
    type: 'image/svg+xml',
    url: scene(i, 2400, 1600),
    thumbUrl: scene(i, 240, 240),
  }));
}

const HINT =
  'margin: 0; font-size: 0.75rem; line-height: 1.25rem; color: var(--andes-color-muted-foreground);';
const ERROR =
  'margin: 0; font-size: 0.875rem; color: var(--andes-color-danger-text, var(--andes-color-danger));';

/** Draws `source` onto a canvas and hands it to `paint`; resolves the canvas as a file. */
async function redraw(
  source: Blob,
  name: string,
  paint: (
    context: CanvasRenderingContext2D,
    image: ImageBitmap,
    canvas: HTMLCanvasElement,
  ) => void,
  type = source.type === 'image/jpeg' ? 'image/jpeg' : 'image/png',
): Promise<File> {
  const image = await createImageBitmap(source);
  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('No 2D canvas');
  }
  paint(context, image, canvas);
  image.close();
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, type, 0.92),
  );
  if (!blob) {
    throw new Error('The picture could not be encoded');
  }
  return new File([blob], name, { type: blob.type });
}

/** A design token read from the page, for the pixels a canvas paints. */
function token(name: string, fallback: string): string {
  return (
    getComputedStyle(document.documentElement).getPropertyValue(name).trim() ||
    fallback
  );
}

const meta: Meta<AndesUpload> = {
  title: 'Data Entry/Upload/Examples',
  component: AndesUpload,
  decorators: [moduleMetadata({ imports: [AndesUpload, AndesButton] })],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'One story for each example of the Ant Design Upload that the Basics page does not already show (clicking, default files, drag and drop, directories, manual upload, max count and the picture list are there). Every story uploads to a simulated server.',
      },
    },
  },
};

export default meta;

type Story = StoryObj<AndesUpload>;

/* ------------------------------------------------------------ pictures wall */

@Component({
  selector: 'andes-story-upload-wall',
  imports: [AndesUpload],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div style="display: grid; gap: 1.5rem; max-width: 36rem;">
      <andes-upload
        listType="picture-card"
        accept="image/*"
        [multiple]="true"
        [maxCount]="8"
        [(fileList)]="cards"
        [customRequest]="request"
        aria-label="Photos"
      />
      <p style="${HINT}">
        {{ cards().length }} of 8 photos. The add tile goes away at the limit.
      </p>
      <andes-upload
        listType="picture-circle"
        accept="image/*"
        [multiple]="true"
        [maxCount]="5"
        [(fileList)]="circles"
        [customRequest]="request"
        aria-label="Team photos"
      />
    </div>
  `,
})
class PicturesWallDemo {
  protected readonly request = simulatedUpload;
  protected readonly cards = signal<AndesUploadFile[]>([
    ...photos(4),
    {
      uid: 'uploading',
      name: 'still-sending.png',
      status: 'uploading',
      percent: 50,
    },
    {
      uid: 'failed',
      name: 'broken.png',
      status: 'error',
      errorMessage: 'The server refused this file',
    },
  ]);
  protected readonly circles = signal<AndesUploadFile[]>(photos(2));
}

export const PicturesWall: Story = {
  name: 'Pictures wall',
  parameters: {
    docs: {
      description: {
        story:
          'A `picture-card` list with `maxCount`: the dashed add tile (a plus over "Upload" when nothing is projected) disappears once the limit is reached. Hovering or focusing a card shows the eye and the trash; the eye opens the library\'s image viewer over every picture of the list, growing out of the thumbnail, with zoom, rotation, flipping, dragging, previous / next and the keyboard shortcuts. Pictures just chosen are viewable too, from the file itself. Below, the same with `picture-circle`.',
      },
    },
  },
  decorators: [moduleMetadata({ imports: [PicturesWallDemo] })],
  render: () => ({ template: `<andes-story-upload-wall />` }),
};

/* ------------------------------------------------------------------ png only */

@Component({
  selector: 'andes-story-upload-png',
  imports: [AndesUpload, AndesButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div style="display: grid; gap: 0.75rem; max-width: 21rem;">
      <andes-upload
        [multiple]="true"
        [beforeUpload]="onlyPng"
        [customRequest]="request"
        (rejected)="onRejected($event)"
        aria-label="PNG pictures"
      >
        <andes-button variant="outline">Upload PNG only</andes-button>
      </andes-upload>
      @for (message of messages(); track $index) {
        <p role="alert" style="${ERROR}">{{ message }}</p>
      }
    </div>
  `,
})
class PngOnlyDemo {
  protected readonly request = simulatedUpload;
  protected readonly messages = signal<string[]>([]);
  /** Vetoing in `beforeUpload` keeps the file out of the list (Ant's `Upload.LIST_IGNORE`). */
  protected readonly onlyPng = (file: File) => file.type === 'image/png';

  protected onRejected(rejections: AndesUploadRejection[]): void {
    this.messages.set(
      rejections
        .filter(({ reason }) => reason === 'before-upload')
        .map(({ file }) => `${file.name} is not a PNG file`),
    );
  }
}

export const PngOnly: Story = {
  name: 'Upload PNG only',
  parameters: {
    docs: {
      description: {
        story:
          '`accept` only filters the picker, so the check that counts lives in `beforeUpload`: returning `false` keeps the file out of the list altogether (what Ant spells `Upload.LIST_IGNORE`), and `rejected` reports it with the reason `before-upload` so the page can say why.',
      },
    },
  },
  decorators: [moduleMetadata({ imports: [PngOnlyDemo] })],
  render: () => ({ template: `<andes-story-upload-png />` }),
};

/* ---------------------------------------------------- customize preview file */

/** A frame of a video, or a small copy of a picture; other files keep their icon. */
async function thumbnailOf(file: File | Blob): Promise<string> {
  // The row draws a 48px square, so twice that is enough for a sharp thumbnail.
  const size = 96;
  if (file.type.startsWith('image/')) {
    const image = await createImageBitmap(file);
    const scale = Math.min(1, size / Math.max(image.width, image.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(image.width * scale);
    canvas.height = Math.round(image.height * scale);
    canvas
      .getContext('2d')
      ?.drawImage(image, 0, 0, canvas.width, canvas.height);
    image.close();
    return canvas.toDataURL('image/png');
  }
  if (file.type.startsWith('video/')) {
    const url = URL.createObjectURL(file);
    try {
      const video = document.createElement('video');
      video.muted = true;
      video.preload = 'auto';
      video.src = url;
      await new Promise<void>((resolve, reject) => {
        video.onloadeddata = () => resolve();
        video.onerror = () => reject(new Error('Unreadable video'));
      });
      video.currentTime = Math.min(1, video.duration / 2 || 0);
      await new Promise<void>((resolve) => (video.onseeked = () => resolve()));
      const scale = size / Math.max(video.videoWidth, video.videoHeight);
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(video.videoWidth * scale);
      canvas.height = Math.round(video.videoHeight * scale);
      canvas
        .getContext('2d')
        ?.drawImage(video, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL('image/jpeg', 0.8);
    } catch {
      return '';
    } finally {
      URL.revokeObjectURL(url);
    }
  }
  return '';
}

export const CustomPreviewFile: Story = {
  name: 'Customize preview file',
  parameters: {
    docs: {
      description: {
        story:
          "A `previewFile` function is asked for the thumbnail of every chosen file, not only pictures: here a video gets a frame of itself and a picture a small copy, while anything else (an empty answer) keeps its icon. The preview of a video is not the image viewer: like any other file that is not a picture, it opens the file's address in a new tab, and the video already on the server below shows how. Choose a short video to try it.",
      },
    },
  },
  render: () => ({
    props: {
      request: simulatedUpload,
      thumbnail: thumbnailOf,
      files: [
        {
          uid: 'clip',
          name: 'site-visit.mp4',
          status: 'done',
          type: 'video/mp4',
          url: 'https://files.example/site-visit.mp4',
          // The row draws a 48px square: a picture twice that size keeps it sharp.
          thumbUrl: scene(1, 96, 96),
        },
      ] satisfies AndesUploadFile[],
    },
    template: `<div style="max-width: 21rem;">
      <andes-upload listType="picture" accept="video/*,image/*" [multiple]="true" [previewFile]="thumbnail" [(fileList)]="files" [customRequest]="request" aria-label="Videos and pictures">
        <andes-button variant="outline">Upload a video or a picture</andes-button>
      </andes-upload>
    </div>`,
  }),
};

/* --------------------------------------------------- transform before request */

/** Stamps a watermark on a picture: the file that is sent, and listed, is the new one. */
function watermark(file: File): Promise<File> {
  return redraw(file, file.name, (context, image, canvas) => {
    context.drawImage(image, 0, 0);
    const size = Math.max(16, Math.round(canvas.width / 18));
    context.font = `600 ${size}px sans-serif`;
    context.textAlign = 'end';
    context.textBaseline = 'bottom';
    context.globalAlpha = 0.8;
    context.fillStyle = token('--andes-color-ghost', 'white');
    context.shadowColor = token('--andes-color-foreground', 'black');
    context.shadowBlur = size / 4;
    context.fillText('Andes', canvas.width - size, canvas.height - size / 2);
  });
}

export const TransformFile: Story = {
  name: 'Transform file before request',
  parameters: {
    docs: {
      description: {
        story:
          '`beforeUpload` may resolve a different `File` or `Blob`: that is what gets sent, and what the thumbnail and the image viewer show. Here every picture gets a watermark drawn with a canvas.',
      },
    },
  },
  render: () => ({
    props: {
      request: simulatedUpload,
      before: (file: File) => watermark(file),
    },
    template: `<div style="max-width: 21rem;">
      <andes-upload listType="picture" accept="image/png,image/jpeg" [multiple]="true" [beforeUpload]="before" [customRequest]="request" aria-label="Watermarked pictures">
        <andes-button variant="outline">Upload pictures</andes-button>
      </andes-upload>
    </div>`,
  }),
};

/* ----------------------------------------------- custom action icon and extra */

@Component({
  selector: 'andes-story-upload-actions',
  imports: [AndesUpload, AndesButton, NgIcon],
  providers: [provideIcons({ lucideStar })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div style="display: grid; gap: 0.75rem; max-width: 21rem;">
      <andes-upload
        [multiple]="true"
        [(fileList)]="files"
        [customRequest]="request"
        [showUploadList]="{
          showDownloadIcon: true,
          showFileSize: false,
          removeIcon: starIcon,
          extra: sizeInMb,
        }"
        (download)="onDownload($event.file)"
        aria-label="Reports"
      >
        <andes-button variant="outline">Upload</andes-button>
      </andes-upload>
      <ng-template #starIcon
        ><ng-icon name="lucideStar" size="0.875rem"
      /></ng-template>
      @if (last()) {
        <p style="${HINT}">Download asked for {{ last() }}.</p>
      }
    </div>
  `,
})
class CustomActionsDemo {
  protected readonly request = simulatedUpload;
  protected readonly last = signal('');
  protected readonly files = signal<AndesUploadFile[]>([
    {
      uid: '1',
      name: 'annual-report.pdf',
      size: 2_621_440,
      status: 'done',
      url: 'https://files.example/annual-report.pdf',
    },
    {
      uid: '2',
      name: 'balance-sheet.xlsx',
      size: 734_003,
      status: 'done',
      url: 'https://files.example/balance-sheet.xlsx',
    },
  ]);
  protected readonly sizeInMb = (file: AndesUploadFile) =>
    file.size === undefined
      ? ''
      : `(${(file.size / 1024 / 1024).toFixed(2)} MB)`;

  protected onDownload(file: AndesUploadFile): void {
    this.last.set(file.name);
  }
}

export const CustomActions: Story = {
  name: 'Custom action icon and extra info',
  parameters: {
    docs: {
      description: {
        story:
          '`showUploadList` takes templates for `previewIcon`, `downloadIcon` and `removeIcon` (an icon or a short word; the button, its label and its action stay; here the remove button is a star) and an `extra` function whose text follows the caption; here it writes the size in megabytes, so `showFileSize: false` hides the default one.',
      },
    },
  },
  decorators: [moduleMetadata({ imports: [CustomActionsDemo] })],
  render: () => ({ template: `<andes-story-upload-actions />` }),
};

/* ------------------------------------------------------- crop before uploading */

@Component({
  selector: 'andes-story-upload-crop',
  imports: [AndesUpload, UploadCropDialog],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <andes-upload
      listType="picture-card"
      accept="image/png,image/jpeg"
      [maxCount]="4"
      [beforeUpload]="crop"
      [customRequest]="request"
      aria-label="Cropped pictures"
    />
    <andes-story-upload-crop-dialog />
  `,
})
class CropDemo {
  private readonly dialog = viewChild.required(UploadCropDialog);
  protected readonly request = simulatedUpload;

  /** `beforeUpload` waits for the dialog: the cropped file, or `false` when cancelled. */
  protected readonly crop = (file: File) => this.dialog().crop(file);
}

export const CropBeforeUpload: Story = {
  name: 'Crop image before uploading',
  parameters: {
    docs: {
      description: {
        story:
          '`beforeUpload` can wait for the user: here it opens an `andes-dialog` cropper built from library parts. Drag the frame to move it, or one of its eight handles to resize it (a locked shape keeps its ratio); pick the shape from the icons (free, 1:1, 4:3 or 16:9); zoom with the slider, its two end buttons or the mouse wheel and drag the picture under the frame; rotate by quarter turns, or reset. Every icon has a tooltip and an accessible name, and the size of the cut sits on the picture as a small chip. The frame takes the keyboard too: the arrow keys move it, Shift and the arrow keys resize it, `+` and `-` zoom. "Crop and upload" cuts the real pixels with a canvas and resolves a `File` of the same name and type (JPEG at 0.92) that replaces the original; cancelling resolves `false`, which keeps the original out of the list. No crop library is needed.',
      },
    },
  },
  decorators: [moduleMetadata({ imports: [CropDemo] })],
  render: () => ({ template: `<andes-story-upload-crop />` }),
};

/* ---------------------------------------------------- semantic dom styling */

@Component({
  selector: 'andes-story-upload-parts',
  imports: [AndesUpload, AndesButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  // The parts render inside the control, so their classes need a global stylesheet.
  encapsulation: ViewEncapsulation.None,
  styles: `
    .story-upload-root {
      padding: var(--andes-space-3);
      border: 1px solid var(--andes-color-border);
      border-radius: var(--andes-radius-lg);
      background-color: var(--andes-color-card);
    }
    .story-upload-list {
      margin-block-start: var(--andes-space-3);
      padding-block-start: var(--andes-space-2);
      border-block-start: 1px dashed var(--andes-color-border);
    }
    .story-upload-item {
      border-radius: var(--andes-radius-md);
    }
    .story-upload-item:nth-child(odd) {
      background-color: var(--andes-color-muted);
    }
  `,
  template: `
    <div style="display: grid; gap: 1.5rem; max-width: 21rem;">
      <andes-upload
        [multiple]="true"
        [(fileList)]="files"
        [customRequest]="request"
        [classNames]="classNames"
        aria-label="Styled with classes"
      >
        <andes-button variant="outline">Classes</andes-button>
      </andes-upload>
      <andes-upload
        listType="picture-card"
        [(fileList)]="pictures"
        [customRequest]="request"
        [styles]="styles"
        aria-label="Styled inline"
      />
    </div>
  `,
})
class SemanticPartsDemo {
  protected readonly request = simulatedUpload;
  protected readonly files = signal<AndesUploadFile[]>([
    { uid: '1', name: 'brief.pdf', size: 120_000, status: 'done' },
    { uid: '2', name: 'notes.txt', size: 4_000, status: 'done' },
    { uid: '3', name: 'budget.xlsx', size: 88_000, status: 'done' },
  ]);
  protected readonly pictures = signal(photos(2));
  protected readonly classNames: AndesUploadClassNames = {
    root: 'story-upload-root',
    list: 'story-upload-list',
    item: 'story-upload-item',
  };
  protected readonly styles: AndesUploadStyles = {
    root: { '--andes-upload-card-size': '7.5rem' },
    trigger: {
      'border-color': 'var(--andes-color-primary)',
      color: 'var(--andes-color-primary-text)',
    },
    item: {
      'border-radius': 'var(--andes-radius-lg)',
      'box-shadow': 'var(--andes-shadow-md)',
    },
  };
}

export const SemanticParts: Story = {
  name: 'Custom semantic dom styling',
  parameters: {
    docs: {
      description: {
        story:
          "`classNames` and `styles` reach the control's parts: `root`, `trigger` (the click or drop area, or the field row), `list` and `item`. Classes need a global stylesheet (the parts render inside the component); styles work from anywhere, including the custom properties such as `--andes-upload-card-size`.",
      },
    },
  },
  decorators: [moduleMetadata({ imports: [SemanticPartsDemo] })],
  render: () => ({ template: `<andes-story-upload-parts />` }),
};

/* -------------------------------------------------------------------- avatar */

@Component({
  selector: 'andes-story-upload-avatar',
  imports: [AndesUpload, AndesImage],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div style="display: grid; gap: 0.75rem; justify-items: start;">
      <andes-upload
        listType="picture-card"
        accept="image/png,image/jpeg"
        [maxCount]="1"
        [showUploadList]="false"
        [beforeUpload]="check"
        [customRequest]="request"
        (changed)="onChanged($event)"
        (rejected)="onRejected($event)"
        aria-label="Profile picture"
      >
        @if (avatar(); as src) {
          <andes-image
            [src]="src"
            alt="Profile picture"
            [preview]="false"
            width="100%"
            height="100%"
          />
        } @else if (sending()) {
          <span>Uploading...</span>
        }
      </andes-upload>
      <p style="${HINT}">JPG or PNG, smaller than 2 MB.</p>
      @if (error()) {
        <p role="alert" style="${ERROR}">{{ error() }}</p>
      }
    </div>
  `,
})
class AvatarDemo {
  protected readonly request = simulatedUpload;
  protected readonly avatar = signal<string | null>(null);
  protected readonly sending = signal(false);
  protected readonly error = signal('');

  protected readonly check = (file: File) => {
    if (file.type !== 'image/jpeg' && file.type !== 'image/png') {
      this.error.set('You can only upload a JPG or PNG file.');
      return false;
    }
    if (file.size > 2 * 1024 * 1024) {
      this.error.set(
        `The picture is ${formatFileSize(file.size)}; it must be smaller than 2 MB.`,
      );
      return false;
    }
    this.error.set('');
    return true;
  };

  protected onChanged({ file }: AndesUploadChangeEvent): void {
    this.sending.set(file.status === 'uploading');
    if (file.status === 'done' && file.originFileObj) {
      // Shown from the file itself; a real server would answer with its address.
      const reader = new FileReader();
      reader.onload = () => this.avatar.set(reader.result as string);
      reader.readAsDataURL(file.originFileObj);
    }
  }

  protected onRejected(rejections: AndesUploadRejection[]): void {
    if (rejections.some(({ reason }) => reason !== 'before-upload')) {
      this.error.set('That file cannot be used as a profile picture.');
    }
  }
}

export const Avatar: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'A `picture-card` with `maxCount` 1 and no list: the tile itself shows the picture once it is uploaded, and a new one replaces it. `beforeUpload` checks the format and the size and says why a file was turned away.',
      },
    },
  },
  decorators: [moduleMetadata({ imports: [AvatarDemo] })],
  render: () => ({ template: `<andes-story-upload-avatar />` }),
};

/* ----------------------------------------------------- complete control list */

@Component({
  selector: 'andes-story-upload-controlled',
  imports: [AndesUpload, AndesButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div style="display: grid; gap: 0.75rem; max-width: 21rem;">
      <andes-upload
        [multiple]="true"
        [fileList]="files()"
        [customRequest]="request"
        (changed)="onChanged($event)"
        aria-label="Latest two files"
      >
        <andes-button variant="outline">Upload</andes-button>
      </andes-upload>
      <p style="${HINT}">
        Only the last two files stay; an uploaded file links to the address the
        server answered with.
      </p>
    </div>
  `,
})
class ControlledListDemo {
  protected readonly request = simulatedUpload;
  protected readonly files = signal<AndesUploadFile[]>([
    {
      uid: '-1',
      name: 'xxx.png',
      status: 'done',
      url: 'https://files.example/xxx.png',
    },
  ]);

  protected onChanged({ fileList }: AndesUploadChangeEvent): void {
    this.files.set(
      fileList.slice(-2).map((file) => {
        const response = file.response as { url?: string } | undefined;
        return response?.url ? { ...file, url: response.url } : file;
      }),
    );
  }
}

export const ControlledList: Story = {
  name: 'Complete control over file list',
  parameters: {
    docs: {
      description: {
        story:
          'With `[fileList]` and `(changed)` the page owns the list: here it keeps only the last two files and, once the server answers, copies the address from `response` to `url`, which turns the name into a link.',
      },
    },
  },
  decorators: [moduleMetadata({ imports: [ControlledListDemo] })],
  render: () => ({ template: `<andes-story-upload-controlled />` }),
};

/* --------------------------------------------------------------------- paste */

export const Paste: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Put the pointer over the upload and press Ctrl+V (Cmd+V on a Mac) with a copied file or a screenshot on the clipboard: no focus is needed (the focus inside works too). With `pasteScope="page"` the control takes a paste made anywhere on the page. A paste that brings text into a text field pastes as text, a paste inside another upload goes to that upload, a hovered upload wins over page-wide ones, and with several page-wide uploads the first enabled one in document order takes the files. `allowPaste` turns it off.',
      },
    },
  },
  render: () => ({
    props: { request: simulatedUpload },
    template: `<div style="display: grid; gap: 1rem; max-width: 21rem;">
      <andes-upload listType="picture" [multiple]="true" [customRequest]="request" aria-label="Pasted files">
        <andes-button variant="outline">Click or paste to upload</andes-button>
      </andes-upload>
      <p style="${HINT}">Hover the component and press Ctrl/Cmd+V, or use <code>pasteScope="page"</code> to paste anywhere.</p>
    </div>`,
  }),
};

/* ----------------------------------------------------------- upload directory */

@Component({
  selector: 'andes-story-upload-directory',
  imports: [AndesUpload, AndesButton, NgIcon],
  providers: [provideIcons({ lucideUpload })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div style="display: grid; gap: 0.75rem; max-width: 21rem;">
      <andes-upload
        [directory]="true"
        [customRequest]="request"
        aria-label="Directory"
      >
        <andes-button variant="outline"
          ><ng-icon slot="icon-start" name="lucideUpload" />Upload
          Directory</andes-button
        >
      </andes-upload>
      <p style="${HINT}">
        The picker chooses a folder and every file inside it joins the list.
      </p>
    </div>
  `,
})
class DirectoryDemo {
  protected readonly request = simulatedUpload;
}

export const UploadDirectory: Story = {
  name: 'Upload directory',
  parameters: {
    docs: {
      description: {
        story:
          'With `directory` the picker chooses a folder (`webkitdirectory`) and every file inside it is added, with its relative path on `webkitRelativePath`; a folder dropped on a dragger is walked the same way (the Basics page has that one). The trigger is any projected button.',
      },
    },
  },
  decorators: [moduleMetadata({ imports: [DirectoryDemo] })],
  render: () => ({ template: `<andes-story-upload-directory />` }),
};

/* --------------------------------------------------------- preview: viewer or page */

@Component({
  selector: 'andes-story-upload-preview',
  imports: [AndesUpload, AndesButton, AndesSwitch],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div style="display: grid; gap: 1rem; max-width: 21rem;">
      <andes-switch [(checked)]="viewer"
        >Open pictures in the image viewer</andes-switch
      >
      <andes-upload
        [multiple]="true"
        [imagePreview]="viewer()"
        [(fileList)]="files"
        [customRequest]="request"
        aria-label="Attachments"
      >
        <andes-button variant="outline">Upload</andes-button>
      </andes-upload>
      <andes-upload
        listType="picture"
        [multiple]="true"
        [imagePreview]="viewer()"
        [(fileList)]="files"
        [customRequest]="request"
        aria-label="Attachments (pictures)"
      >
        <andes-button variant="outline">Upload</andes-button>
      </andes-upload>
      <p style="${HINT}">
        Click a file name (or the thumbnail of a picture) to preview it. A file
        you choose opens too, even before it has an address.
      </p>
    </div>
  `,
})
class PreviewDemo {
  protected readonly request = simulatedUpload;
  protected readonly viewer = signal(true);
  private readonly urls: string[] = [];
  protected readonly files = signal<AndesUploadFile[]>([
    ...photos(2).map((photo, i) => ({
      ...photo,
      // An address a new tab can open; the viewer draws the same picture.
      url: this.blobUrl(this.svgOf(i), 'image/svg+xml'),
    })),
    {
      uid: 'notes',
      name: 'site-notes.txt',
      status: 'done',
      type: 'text/plain',
      url: this.blobUrl('Visit notes: the north wall is dry.', 'text/plain'),
    },
  ]);

  constructor() {
    inject(DestroyRef).onDestroy(() =>
      this.urls.forEach((url) => URL.revokeObjectURL(url)),
    );
  }

  private svgOf(index: number): string {
    return decodeURIComponent(scene(index, 1200, 800).split(',')[1]);
  }

  private blobUrl(content: string, type: string): string {
    const url = URL.createObjectURL(new Blob([content], { type }));
    this.urls.push(url);
    return url;
  }
}

export const PreviewViewerOrPage: Story = {
  name: 'Preview: viewer or new page',
  parameters: {
    docs: {
      description: {
        story:
          'Clicking the name of a file (or the thumbnail in a `picture` list) previews it; the rows have no eye, which is only on the hover mask of `picture-card` and `picture-circle` tiles (`showPreviewIcon` turns it on in rows). A picture opens in the image viewer (`imagePreview`, the default) or, with it off, in a new page together with every other file; a file just chosen is opened from the file itself. A `(preview)` handler that calls `preventDefault()` replaces both. Use the switch to compare.',
      },
    },
  },
  decorators: [moduleMetadata({ imports: [PreviewDemo] })],
  render: () => ({ template: `<andes-story-upload-preview />` }),
};

/* ----------------------------------------------------------- photos in a form */

@Component({
  selector: 'andes-story-upload-form-photos',
  imports: [AndesUpload, AndesButton, AndesInput, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form
      [formGroup]="form"
      style="display: grid; gap: 1rem; max-width: 21rem;"
      (ngSubmit)="saved.set(true)"
    >
      <div style="display: grid; gap: 0.25rem;">
        <label for="story-listing" style="font-weight: 500;">Listing</label>
        <andes-input
          id="story-listing"
          formControlName="title"
          placeholder="Two-bedroom flat"
        />
      </div>
      <div style="display: grid; gap: 0.25rem;">
        <span id="story-photos" style="font-weight: 500;">Photos</span>
        <andes-upload
          listType="picture-card"
          accept="image/*"
          [multiple]="true"
          [maxCount]="6"
          formControlName="photos"
          [customRequest]="request"
          [aria-invalid]="photos.invalid && photos.touched"
          aria-labelledby="story-photos"
          aria-describedby="story-photos-help"
        />
        <span id="story-photos-help" style="${HINT}"
          >At least one photo, at most six.</span
        >
        @if (photos.touched && photos.errors; as errors) {
          <span role="alert" style="${ERROR}">
            @if (errors['required']) {
              Add a photo.
            } @else if (errors['uploadPending']) {
              Wait for the photos to finish uploading.
            } @else if (errors['uploadFailed']) {
              Remove or retry the failed photo.
            }
          </span>
        }
      </div>
      <div>
        <andes-button type="submit" [disabled]="form.invalid"
          >Publish</andes-button
        >
      </div>
      @if (saved()) {
        <span>Published with {{ photos.value?.length }} photo(s).</span>
      }
    </form>
  `,
})
class FormPhotosDemo {
  protected readonly request = simulatedUpload;
  protected readonly saved = signal(false);
  protected readonly photos = new FormControl<AndesUploadFile[]>(photos(1), {
    validators: [Validators.required, andesUploadSettled()],
  });
  protected readonly form = new FormGroup({
    title: new FormControl('Two-bedroom flat'),
    photos: this.photos,
  });
}

export const PhotosInAForm: Story = {
  name: 'Photos inside a form',
  parameters: {
    docs: {
      description: {
        story:
          'The value of the control is the file list, so a picture-card upload is a form control like any other: here it is required and `andesUploadSettled()` keeps the form invalid while a photo is uploading or failed. Previews still open in the image viewer.',
      },
    },
  },
  decorators: [moduleMetadata({ imports: [FormPhotosDemo] })],
  render: () => ({ template: `<andes-story-upload-form-photos />` }),
};

/* --------------------------------------------------------- signed (OSS) upload */

interface UploadPolicy {
  readonly host: string;
  readonly key: string;
  readonly policy: string;
  readonly signature: string;
}

/** Stands in for the endpoint of your server that signs an upload to object storage. */
async function signUpload(file: AndesUploadFile): Promise<UploadPolicy> {
  await new Promise((resolve) => setTimeout(resolve, 400));
  const key = `uploads/${Date.now()}-${file.name}`;
  return {
    host: 'https://bucket.oss.example',
    key,
    policy: btoa(JSON.stringify({ key, expires: Date.now() + 60_000 })),
    signature: Math.random().toString(36).slice(2),
  };
}

@Component({
  selector: 'andes-story-upload-signed',
  imports: [AndesUpload, AndesButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div style="display: grid; gap: 0.75rem; max-width: 21rem;">
      <andes-upload
        [multiple]="true"
        [customRequest]="signedRequest"
        aria-label="Files for the bucket"
      >
        <andes-button variant="outline">Upload to the bucket</andes-button>
      </andes-upload>
      @for (line of log(); track $index) {
        <code style="font-size: 0.75rem; overflow-wrap: anywhere;">{{
          line
        }}</code>
      }
    </div>
  `,
})
class SignedUploadDemo {
  protected readonly log = signal<string[]>([]);

  /**
   * Asks the server for a policy, then posts the file with it to the storage host. Removing
   * the file while either step runs cancels it.
   */
  protected readonly signedRequest: AndesUploadRequest = (options) => {
    let cancelled = false;
    let sending: ReturnType<AndesUploadRequest>;
    signUpload(options.uploadFile).then(
      (policy) => {
        if (cancelled) {
          return;
        }
        this.log.update((log) => [
          ...log,
          `POST ${policy.host} key=${policy.key} signature=${policy.signature}`,
        ]);
        sending = simulatedUpload({
          ...options,
          action: policy.host,
          data: { ...options.data, ...policy },
        });
      },
      (error) => options.onError(error),
    );
    return {
      abort: () => {
        cancelled = true;
        if (typeof sending === 'function') {
          sending();
        } else {
          sending?.abort();
        }
      },
    };
  };
}

export const SignedUpload: Story = {
  name: 'Custom request (signed upload)',
  parameters: {
    docs: {
      description: {
        story:
          'Uploading straight to object storage (Aliyun OSS, S3...) takes a signed policy from your server first. A `customRequest` does both steps: it awaits the signature, then posts the file with the policy fields to the storage host, reporting progress and the answer through `onProgress`, `onSuccess` and `onError`, and returns an `abort` that cancels whichever step is running. (`action` and `data` may also be async functions, for transports that only need the address and the fields.) The log shows each signed request.',
      },
    },
  },
  decorators: [moduleMetadata({ imports: [SignedUploadDemo] })],
  render: () => ({ template: `<andes-story-upload-signed />` }),
};

/* ---------------------------------------------------------------- drag sorting */

@Component({
  selector: 'andes-story-upload-sorting',
  imports: [AndesUpload, AndesButton, CdkDropList, CdkDrag],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  styles: `
    .story-sort-row {
      display: flex;
      align-items: center;
      gap: var(--andes-space-2);
      padding: var(--andes-space-1) var(--andes-space-2);
      border: 1px solid var(--andes-color-border);
      border-radius: var(--andes-radius-md);
      background-color: var(--andes-color-background);
      color: var(--andes-color-foreground);
      font-size: 0.875rem;
      cursor: grab;
    }
    .story-sort-row.cdk-drag-preview {
      box-shadow: var(--andes-shadow-md);
    }
    .story-sort-row.cdk-drag-placeholder {
      opacity: 0.4;
    }
    @media (prefers-reduced-motion: no-preference) {
      .cdk-drop-list-dragging .story-sort-row:not(.cdk-drag-placeholder),
      .story-sort-row.cdk-drag-animating {
        transition: transform var(--andes-motion-duration-mid)
          var(--andes-motion-ease-out);
      }
    }
  `,
  template: `
    <div style="max-width: 21rem;">
      <andes-upload
        cdkDropList
        [cdkDropListData]="files()"
        (cdkDropListDropped)="drop($event)"
        [multiple]="true"
        [(fileList)]="files"
        [itemRender]="row"
        [customRequest]="request"
        aria-label="Ordered files"
      >
        <ng-template #row let-file let-remove="remove">
          <div class="story-sort-row" cdkDrag>
            <span style="flex: 1; min-width: 0; overflow-wrap: anywhere;">{{
              file.name
            }}</span>
            <span style="${HINT}">{{
              file.status === 'uploading'
                ? (file.percent ?? 0) + '%'
                : file.status
            }}</span>
            <andes-button variant="ghost" size="sm" (click)="remove()"
              >Remove</andes-button
            >
          </div>
        </ng-template>
      </andes-upload>
    </div>
  `,
})
class DragSortingDemo {
  protected readonly request = simulatedUpload;
  protected readonly files = signal<AndesUploadFile[]>(
    ['cover.png', 'chapter-1.pdf', 'chapter-2.pdf', 'appendix.pdf'].map(
      (name, i) => ({ uid: `s${i}`, name, status: 'done' as const }),
    ),
  );

  protected drop(event: CdkDragDrop<AndesUploadFile[]>): void {
    const next = [...this.files()];
    moveItemInArray(next, event.previousIndex, event.currentIndex);
    this.files.set(next);
  }
}

export const DragSorting: Story = {
  name: 'Drag sorting of the upload list',
  parameters: {
    docs: {
      description: {
        story:
          'The list order is the `fileList` order, so sorting is a matter of moving entries: `itemRender` draws each row with a CDK `cdkDrag` (the `cdkDropList` sits on the control, which holds the rows), and the drop handler moves the entry with `moveItemInArray`. Drag a row up or down.',
      },
    },
  },
  decorators: [moduleMetadata({ imports: [DragSortingDemo] })],
  render: () => ({ template: `<andes-story-upload-sorting />` }),
};

/* ------------------------------------------------------ customize progress bar */

export const CustomProgress: Story = {
  name: 'Customize progress bar',
  parameters: {
    docs: {
      description: {
        story:
          '`progress` sets the colour of the bar (a token, any CSS colour, or the two ends of a gradient that follows the reading direction), its thickness in px and the text shown while sending. In forced-colors mode the bar keeps the system colour.',
      },
    },
  },
  render: () => ({
    props: {
      request: simulatedUpload,
      gradient: {
        strokeColor: {
          from: 'var(--andes-color-primary)',
          to: 'var(--andes-color-success)',
        },
        strokeWidth: 3,
        format: (percent: number) => `${percent.toFixed(0)} of 100`,
      } satisfies AndesUploadProgressOptions,
      solid: {
        strokeColor: 'var(--andes-color-success)',
        strokeWidth: 6,
      } satisfies AndesUploadProgressOptions,
    },
    template: `<div style="display: grid; gap: 1.5rem; max-width: 21rem;">
      <andes-upload [multiple]="true" [progress]="gradient" [customRequest]="request" aria-label="Gradient progress">
        <andes-button variant="outline">Gradient, 3px</andes-button>
      </andes-upload>
      <andes-upload listType="picture-card" [multiple]="true" [progress]="solid" [customRequest]="request" aria-label="Solid progress" />
    </div>`,
  }),
};
