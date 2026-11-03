import { DOCUMENT, NgTemplateOutlet } from '@angular/common';
import {
  Component,
  DestroyRef,
  inject,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';

import { AndesButton } from '../button/button';
import { ANDES_DIALOG_IMPORTS } from '../dialog/dialog';
import { AndesImage } from './image';
import { AndesImageGroup } from './image-group';
import { AndesImagePreview } from './image-preview';
import { andesDrawTransformedImage } from './image-transform';
import type {
  AndesImagePreviewItem,
  AndesImageToolbarContext,
} from './image-types';

/**
 * Scenic placeholders drawn as SVG so the stories need no network and look the same
 * everywhere: a sky gradient, a sun or moon, and three ridges of hills.
 */
const PALETTES = [
  {
    sky: ['#fde68a', '#fb923c'],
    sun: '#fff7ed',
    hills: ['#7c3aed', '#5b21b6', '#3b0764'],
  },
  {
    sky: ['#bae6fd', '#38bdf8'],
    sun: '#ffffff',
    hills: ['#16a34a', '#15803d', '#14532d'],
  },
  {
    sky: ['#1e1b4b', '#4338ca'],
    sun: '#e0e7ff',
    hills: ['#312e81', '#1e1b4b', '#0f0a3c'],
  },
  {
    sky: ['#fecdd3', '#fb7185'],
    sun: '#fff1f2',
    hills: ['#be123c', '#9f1239', '#4c0519'],
  },
  {
    sky: ['#a7f3d0', '#2dd4bf'],
    sun: '#f0fdfa',
    hills: ['#0f766e', '#115e59', '#042f2e'],
  },
];

function scene(index: number, width = 1200, height = 800): string {
  const p = PALETTES[Math.abs(index) % PALETTES.length];
  const h = height;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p.sky[0]}"/><stop offset="1" stop-color="${p.sky[1]}"/></linearGradient></defs>
  <rect width="${width}" height="${height}" fill="url(#g)"/>
  <circle cx="${width * (0.25 + 0.12 * (index % 4))}" cy="${h * 0.3}" r="${h * 0.09}" fill="${p.sun}" opacity="0.9"/>
  <path d="M0 ${h * 0.62} Q ${width * 0.25} ${h * 0.42} ${width * 0.5} ${h * 0.6} T ${width} ${h * 0.55} V ${h} H0Z" fill="${p.hills[0]}"/>
  <path d="M0 ${h * 0.74} Q ${width * 0.3} ${h * 0.56} ${width * 0.6} ${h * 0.72} T ${width} ${h * 0.68} V ${h} H0Z" fill="${p.hills[1]}"/>
  <path d="M0 ${h * 0.88} Q ${width * 0.35} ${h * 0.74} ${width * 0.7} ${h * 0.86} T ${width} ${h * 0.82} V ${h} H0Z" fill="${p.hills[2]}"/>
</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const THUMBS = [0, 1, 2, 3, 4].map((i) => scene(i, 480, 320));
const LARGE = [0, 1, 2, 3, 4].map((i) => scene(i, 2400, 1600));
const NAMES = [
  'Sunset ridge',
  'Green valley',
  'Night hills',
  'Rose horizon',
  'Teal coast',
];

const GALLERY: readonly AndesImagePreviewItem[] = LARGE.map((src, i) => ({
  src,
  alt: NAMES[i],
  name: `${NAMES[i].toLowerCase().replace(/\s+/g, '-')}.svg`,
}));

const imports = [AndesImage, AndesImageGroup, AndesImagePreview, AndesButton];

/** Decodes to nothing, so the load fails at once without a network request. */
const BROKEN = 'data:image/png;base64,AAAA';

const meta: Meta<AndesImage> = {
  title: 'Data Display/Image',
  component: AndesImage,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports })],
  argTypes: {
    src: { control: 'text' },
    alt: { control: 'text' },
    width: { control: 'text' },
    height: { control: 'text' },
    fallback: { control: 'text' },
    fit: {
      control: 'select',
      options: ['cover', 'contain', 'fill', 'none', 'scale-down'],
    },
    loading: { control: 'inline-radio', options: ['lazy', 'eager'] },
    preview: { control: 'boolean' },
    previewSrc: { control: 'text' },
    mask: { control: false },
    placeholder: { control: false },
    labels: { control: false },
  },
  args: {
    src: THUMBS[0],
    alt: NAMES[0],
    width: 240,
    height: 160,
    fit: 'cover',
    loading: 'eager',
    preview: true,
  },
  parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj<AndesImage>;

export const Default: Story = {
  render: (args) => ({
    props: args,
    template: `<andes-image [src]="src" [alt]="alt" [width]="width" [height]="height" [fit]="fit" [loading]="loading" [preview]="preview" [previewSrc]="previewSrc" [fallback]="fallback" />`,
  }),
};

export const FitModes: Story = {
  render: () => ({
    props: {
      src: scene(1, 480, 320),
      modes: ['cover', 'contain', 'fill', 'none', 'scale-down'],
    },
    template: `
      <div style="display: flex; flex-wrap: wrap; gap: 1rem; font: 12px/20px system-ui;">
        @for (mode of modes; track mode) {
          <figure style="margin: 0;">
            <andes-image loading="eager" [src]="src" alt="" [width]="140" [height]="140" [fit]="mode" [preview]="false" />
            <figcaption>{{ mode }}</figcaption>
          </figure>
        }
      </div>`,
  }),
};

/**
 * What clicking a thumbnail does. First: `previewSrc` makes the viewer load a larger file than
 * the thumbnail. Second: `[preview]="false"` turns the viewer off. Then the hover mask: a
 * template, a plain string, or `false` for none.
 */
export const PreviewAndMask: Story = {
  args: { previewSrc: LARGE[0] },
  render: (args) => ({
    props: { ...args, variants: ['dimmed', 'blur', 'none'] },
    template: `
      <ng-template #zoom><strong style="font: 600 14px/22px system-ui;">Open full size</strong></ng-template>
      <div style="display: flex; gap: 1rem; flex-wrap: wrap; font: 12px/20px system-ui;">
        <figure style="margin: 0;">
          <andes-image loading="eager" [src]="src" [alt]="alt" [width]="width" [height]="height" [previewSrc]="previewSrc" />
          <figcaption>Thumbnail small, preview large</figcaption>
        </figure>
        <figure style="margin: 0;">
          <andes-image loading="eager" [src]="src" [alt]="alt" [width]="width" [height]="height" [preview]="false" />
          <figcaption>Preview disabled</figcaption>
        </figure>
        <figure style="margin: 0;">
          <andes-image loading="eager" [src]="src" [alt]="alt" [width]="width" [height]="height" [mask]="zoom" />
          <figcaption>Mask template</figcaption>
        </figure>
        <figure style="margin: 0;">
          <andes-image loading="eager" [src]="src" [alt]="alt" [width]="width" [height]="height" mask="View" />
          <figcaption>Mask text</figcaption>
        </figure>
        <figure style="margin: 0;">
          <andes-image loading="eager" [src]="src" [alt]="alt" [width]="width" [height]="height" [mask]="false" />
          <figcaption>No mask</figcaption>
        </figure>
      </div>
      <p style="font: 13px/20px system-ui; margin: 1.5rem 0 0.5rem;">Mask variants (hover or focus a picture)</p>
      <div style="display: flex; gap: 1rem; flex-wrap: wrap; font: 12px/20px system-ui;">
        @for (variant of variants; track variant) {
          <figure style="margin: 0;">
            <andes-image loading="eager" [src]="src" [alt]="alt" [width]="width" [height]="height" [maskVariant]="variant" />
            <figcaption>{{ variant }}</figcaption>
          </figure>
        }
      </div>`,
  }),
};

@Component({
  selector: 'andes-story-image-loading',
  imports: [AndesImage, AndesButton],
  template: `
    <div
      style="display: flex; gap: 0.5rem; margin-bottom: 1rem; font: 14px/22px system-ui;"
    >
      <andes-button (click)="reload()">Reload Image</andes-button>
      <andes-button (click)="generate()">Generate</andes-button>
    </div>
    <div
      style="display: flex; gap: 1.5rem; flex-wrap: wrap; align-items: flex-start; font: 12px/20px system-ui;"
    >
      <figure style="margin: 0;">
        <andes-image
          [src]="url()"
          alt="Skeleton placeholder"
          [width]="200"
          [height]="134"
          [placeholder]="true"
          [preview]="false"
        />
        <figcaption>Skeleton</figcaption>
      </figure>
      <figure style="margin: 0;">
        <andes-image
          [src]="url()"
          alt="Blurred placeholder"
          [width]="200"
          [height]="134"
          placeholder="blur"
          [placeholderSrc]="blur()"
          [preview]="false"
        />
        <figcaption>Blur-up</figcaption>
      </figure>
      <figure style="margin: 0;">
        <andes-image
          [src]="url()"
          alt="Progress wash"
          [width]="200"
          [height]="134"
          [placeholder]="{ progress: true }"
          [preview]="false"
        />
        <figcaption>
          <code>{{ '{' }} progress: true {{ '}' }}</code>
        </figcaption>
      </figure>
      <figure style="margin: 0;">
        <andes-image
          [src]="url()"
          alt="Progress with percent"
          [width]="200"
          [height]="134"
          [placeholder]="{ progress: { percent: percent() } }"
          [preview]="false"
        />
        <figcaption>
          <code>{{ '{' }} progress: {{ '{' }} percent {{ '}' }} {{ '}' }}</code>
        </figcaption>
      </figure>
      <figure style="margin: 0;">
        <ng-template #custom>
          <span
            style="display: grid; place-items: center; height: 100%; font: 13px/20px system-ui; color: var(--andes-color-muted-foreground);"
            >Fetching…</span
          >
        </ng-template>
        <andes-image
          [src]="url()"
          alt="Template placeholder"
          [width]="200"
          [height]="134"
          [placeholder]="custom"
          [preview]="false"
        />
        <figcaption>Template</figcaption>
      </figure>
    </div>
  `,
})
class LoadingDemo {
  protected readonly url = signal<string | undefined>(undefined);
  protected readonly blur = signal(scene(0, 24, 16));
  protected readonly percent = signal(0);
  private picture = 0;
  private timer: ReturnType<typeof setInterval> | undefined;

  constructor() {
    inject(DestroyRef).onDestroy(() => clearInterval(this.timer));
    this.reload();
  }

  /** Loads the same picture again, slowly. */
  protected reload(): void {
    this.fakeSlowLoad();
  }

  /** Loads a new picture, slowly. */
  protected generate(): void {
    this.picture = Math.floor(Math.random() * 1000);
    this.blur.set(scene(this.picture, 24, 16));
    this.fakeSlowLoad();
  }

  /** The URL is "downloading" for a couple of seconds; the percent climbs meanwhile. */
  private fakeSlowLoad(): void {
    clearInterval(this.timer);
    this.url.set(undefined);
    this.percent.set(0);
    this.timer = setInterval(() => {
      const next = Math.min(100, this.percent() + 4 + Math.random() * 12);
      this.percent.set(next);
      if (next >= 100) {
        clearInterval(this.timer);
        this.url.set(scene(this.picture, 480, 320));
      }
    }, 160);
  }
}

export const Loading: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'While `src` has not arrived (`undefined`) the image shows its placeholder, then fades in over it. "Reload" fetches the same picture again and "Generate" a new one, both slowly, so every placeholder can be watched: a skeleton, a blurred thumbnail, `{ progress: true }` (a soft wash), `{ progress: { percent } }` (a thin bar with the percent you report) and a template.',
      },
    },
  },
  decorators: [moduleMetadata({ imports: [LoadingDemo] })],
  render: () => ({ template: `<andes-story-image-loading />` }),
};

/** A plain SVG file (no raster data) as the source. */
const SVG_LOGO = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 80"><rect width="120" height="80" rx="10" fill="#0f766e"/><path d="M20 62 48 22l16 22 10-12 26 30Z" fill="#ccfbf1"/><circle cx="88" cy="24" r="8" fill="#fde68a"/></svg>`,
)}`;

export const FaultTolerance: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'When `src` fails, `fallback` takes over: another URL, or a template drawn in the box (here with a retry button). With neither, a neutral error box. SVG sources work like any other image, in the thumbnail and in the viewer.',
      },
    },
  },
  render: () => ({
    props: {
      fallback: scene(3, 480, 320),
      broken: BROKEN,
      svg: SVG_LOGO,
      retried: scene(1, 480, 320),
      attempt: 0,
    },
    template: `
      <ng-template #failed>
        <span style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.5rem; height: 100%; font: 13px/20px system-ui;">
          Could not load the photo
          <andes-button size="sm" variant="outline" (click)="attempt = attempt + 1">Try again</andes-button>
        </span>
      </ng-template>
      <div style="display: flex; gap: 1.5rem; flex-wrap: wrap; font: 12px/20px system-ui;">
        <figure style="margin: 0;">
          <andes-image loading="eager" [src]="broken" alt="Falls back" [fallback]="fallback" [width]="200" [height]="134" />
          <figcaption>Broken src, fallback image</figcaption>
        </figure>
        <figure style="margin: 0;">
          <andes-image loading="eager" [src]="attempt ? retried : broken" alt="Green valley" [fallback]="failed" [width]="200" [height]="134" />
          <figcaption>Broken src, fallback template</figcaption>
        </figure>
        <figure style="margin: 0;">
          <andes-image loading="eager" [src]="broken" alt="Could not be loaded" [width]="200" [height]="134" />
          <figcaption>Broken src, nothing to fall back to</figcaption>
        </figure>
        <figure style="margin: 0;">
          <andes-image loading="eager" [src]="svg" alt="Mountain logo" [width]="200" [height]="134" fit="contain" />
          <figcaption>SVG source</figcaption>
        </figure>
      </div>`,
  }),
};

export const Group: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Clicking any thumbnail opens one viewer over the whole group. Previous / next buttons, the arrow keys, `PageUp` / `PageDown`, `Home` and `End` move between images. Three groups: the default, one with `loop` so next wraps from the last image to the first, and one where the third picture has `[preview]="false"` so the viewer skips it.',
      },
    },
  },
  render: () => ({
    props: { thumbs: THUMBS, large: LARGE, names: NAMES },
    template: `
      <div style="display: flex; flex-direction: column; gap: 1.5rem; font: 12px/20px system-ui;">
        <div>
          <andes-image-group>
            <div style="display: flex; gap: 0.75rem; flex-wrap: wrap;">
              @for (thumb of thumbs; track thumb; let i = $index) {
                <andes-image [src]="thumb" [alt]="names[i]" [previewSrc]="large[i]" [width]="150" [height]="100" loading="eager" />
              }
            </div>
          </andes-image-group>
          <p style="margin: 0.5rem 0 0;">Default group</p>
        </div>
        <div>
          <andes-image-group [preview]="{ loop: true }">
            <div style="display: flex; gap: 0.75rem; flex-wrap: wrap;">
              @for (thumb of thumbs; track thumb; let i = $index) {
                <andes-image [src]="thumb" [alt]="names[i]" [previewSrc]="large[i]" [width]="150" [height]="100" loading="eager" />
              }
            </div>
          </andes-image-group>
          <p style="margin: 0.5rem 0 0;">Looping group</p>
        </div>
        <div>
          <andes-image-group>
            <div style="display: flex; gap: 0.75rem; flex-wrap: wrap;">
              @for (thumb of thumbs; track thumb; let i = $index) {
                <andes-image [src]="thumb" [alt]="names[i]" [previewSrc]="large[i]" [width]="150" [height]="100" loading="eager" [preview]="i !== 2" />
              }
            </div>
          </andes-image-group>
          <p style="margin: 0.5rem 0 0;">The third picture has <code>[preview]="false"</code>, so the viewer skips it.</p>
        </div>
      </div>`,
  }),
};

export const AlbumAndHiddenImages: Story = {
  name: 'Album and hidden images',
  parameters: {
    docs: {
      description: {
        story:
          'A group with `items` browses that list instead of its thumbnails. Left: a single cover opens a whole album. Right: two thumbnails on the page, five images in the viewer; each thumbnail opens on the item with its own preview URL.',
      },
    },
  },
  render: () => ({
    props: {
      cover: scene(7, 480, 320),
      album: GALLERY,
      thumbs: THUMBS.slice(0, 2),
      large: LARGE,
      names: NAMES,
    },
    template: `
      <div style="display: flex; gap: 2rem; flex-wrap: wrap; font: 12px/20px system-ui;">
        <figure style="margin: 0;">
          <andes-image-group [items]="album">
            <andes-image [src]="cover" alt="Album: five landscapes" [width]="200" [height]="134" loading="eager" />
          </andes-image-group>
          <figcaption>One cover opens the album (5 images)</figcaption>
        </figure>
        <figure style="margin: 0;">
          <andes-image-group [items]="album">
            <div style="display: flex; gap: 0.75rem;">
              @for (thumb of thumbs; track thumb; let i = $index) {
                <andes-image [src]="thumb" [alt]="names[i]" [previewSrc]="large[i]" [width]="150" [height]="100" loading="eager" />
              }
            </div>
          </andes-image-group>
          <figcaption>Two thumbnails, three more images only in the viewer</figcaption>
        </figure>
      </div>`,
  }),
};

function saveFile(href: string, name: string): void {
  const anchor = document.createElement('a');
  anchor.href = href;
  anchor.download = name;
  anchor.click();
}

@Component({
  selector: 'andes-story-image-toolbar',
  imports: [AndesImage, AndesImageGroup, NgTemplateOutlet],
  template: `
    <ng-template
      #toolbar
      let-image="image"
      let-item="item"
      let-transform="transform"
      let-defaultToolbar="defaultToolbar"
    >
      <ng-container [ngTemplateOutlet]="defaultToolbar" />
      <button
        type="button"
        style="{{ buttonStyle }}"
        (click)="downloadOriginal(item)"
      >
        Original
      </button>
      <button
        type="button"
        style="{{ buttonStyle }}"
        (click)="downloadAsShown(image, transform, item)"
      >
        As shown
      </button>
    </ng-template>
    <andes-image-group
      [preview]="{ toolbarTemplate: toolbar, actions: actions }"
    >
      <div style="display: flex; gap: 0.75rem; flex-wrap: wrap;">
        @for (thumb of thumbs; track thumb; let i = $index) {
          <andes-image
            [src]="thumb"
            [alt]="names[i]"
            [previewSrc]="large[i]"
            [width]="150"
            [height]="100"
            loading="eager"
          />
        }
      </div>
    </andes-image-group>
  `,
})
class CustomToolbarDemo {
  protected readonly thumbs = THUMBS.slice(0, 3);
  protected readonly large = LARGE;
  protected readonly names = NAMES;
  protected readonly actions = [
    'flipY',
    'flipX',
    'rotateLeft',
    'rotateRight',
    'zoomOut',
    'zoomIn',
  ];
  protected readonly buttonStyle =
    'margin-inline-start: 0.25rem; height: 1.75rem; padding: 0 0.75rem; border: 1px solid currentColor; border-radius: 999px; background: transparent; color: inherit; font: 500 12px/1 system-ui; cursor: pointer;';

  protected downloadOriginal(item: AndesImagePreviewItem): void {
    saveFile(item.src, item.name ?? 'image.svg');
  }

  /** Draws the picture rotated and flipped the way the viewer shows it, then saves a PNG. */
  protected downloadAsShown(
    image: AndesImageToolbarContext['image'],
    transform: AndesImageToolbarContext['transform'],
    item: AndesImagePreviewItem,
  ): void {
    const canvas = image ? andesDrawTransformedImage(image, transform) : null;
    canvas?.toBlob((blob) => {
      if (!blob) {
        return;
      }
      const url = URL.createObjectURL(blob);
      saveFile(url, (item.name ?? 'image').replace(/\.\w+$/, '') + '.png');
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    });
  }
}

export const CustomToolbar: Story = {
  parameters: {
    docs: {
      description: {
        story:
          '`toolbarTemplate` replaces the toolbar. It receives the actions, the shown item, its index and transform, the `<img>` and the built-in buttons as `defaultToolbar`. Here the built-ins come first (in the order of `actions`) followed by two downloads: the original file, and the picture rotated and flipped as shown, drawn with `andesDrawTransformedImage`.',
      },
    },
  },
  decorators: [moduleMetadata({ imports: [CustomToolbarDemo] })],
  render: () => ({ template: `<andes-story-image-toolbar />` }),
};

export const CustomPreviewContent: Story = {
  parameters: {
    docs: {
      description: {
        story:
          '`imageTemplate` replaces the previewed picture with any content (a video, a chart, a captioned figure); zoom, rotate, flip and pan still apply to it.',
      },
    },
  },
  render: () => ({
    props: { thumbs: THUMBS.slice(0, 3), large: LARGE, names: NAMES },
    template: `
      <ng-template #content let-item let-index="index" let-total="total">
        <figure style="margin: 0; display: flex; flex-direction: column; align-items: center; gap: 0.75rem;">
          <img [src]="item.src" [alt]="item.alt" draggable="false" style="display: block; max-width: min(80vw, 56rem); max-height: 60vh; border-radius: 0.5rem;" />
          <figcaption style="font: 500 14px/20px system-ui; color: var(--andes-color-ghost);">{{ item.alt }} · {{ index + 1 }} of {{ total }}</figcaption>
        </figure>
      </ng-template>
      <andes-image-group [preview]="{ imageTemplate: content }">
        <div style="display: flex; gap: 0.75rem;">
          @for (thumb of thumbs; track thumb; let i = $index) {
            <andes-image [src]="thumb" [alt]="names[i]" [previewSrc]="large[i]" [width]="150" [height]="100" loading="eager" />
          }
        </div>
      </andes-image-group>`,
  }),
};

@Component({
  selector: 'andes-story-image-parts',
  imports: [AndesImage],
  // The parts' classes are styled from a global stylesheet: the viewer renders outside here.
  encapsulation: ViewEncapsulation.None,
  styles: `
    .story-polaroid {
      padding: 0.5rem 0.5rem 1.75rem;
      background: var(--andes-color-card);
      box-shadow: var(--andes-shadow-md);
    }
    .story-viewer-toolbar {
      outline: 1px solid var(--andes-color-primary-ghost);
    }
  `,
  template: `
    <andes-image
      loading="eager"
      [src]="src"
      alt="Rose horizon"
      [previewSrc]="large"
      [width]="240"
      [height]="190"
      [classNames]="{ root: 'story-polaroid', toolbar: 'story-viewer-toolbar' }"
      [styles]="{
        root: { 'border-radius': '0.25rem' },
        image: { 'border-radius': '0.125rem', filter: 'saturate(1.3)' },
        mask: { inset: '0.5rem 0.5rem 1.75rem' },
        viewerImage: {
          'border-radius': '0.75rem',
          'box-shadow': 'var(--andes-shadow-lg)',
        },
      }"
    />
  `,
})
class SemanticPartsDemo {
  protected readonly src = THUMBS[3];
  protected readonly large = LARGE[3];
}

export const SemanticParts: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "`classNames` and `styles` reach every part: `root`, `image`, `mask`, and the viewer's `viewer`, `toolbar`, `viewerImage` and `counter`. Here a polaroid frame (a class on the root), a rounded and more saturated picture, a mask that stops at the frame, an outlined toolbar and a rounded, shadowed preview.",
      },
    },
  },
  decorators: [moduleMetadata({ imports: [SemanticPartsDemo] })],
  render: () => ({ template: `<andes-story-image-parts />` }),
};

/** The library's own dialog with a group of photos in it, so the viewer stacks over a real one. */
@Component({
  selector: 'andes-story-image-dialog',
  imports: [AndesImage, AndesImageGroup, AndesButton, ...ANDES_DIALOG_IMPORTS],
  template: `
    <andes-button (click)="open.set(true)">Open the dialog</andes-button>
    <andes-dialog [(open)]="open">
      <andes-dialog-content *andesDialogContent>
        <div andesDialogHeader>
          <h2 andesDialogTitle>Trip photos</h2>
          <p andesDialogDescription>
            Open a photo: Escape closes the viewer first, then the dialog.
          </p>
        </div>
        <andes-image-group>
          <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
            @for (thumb of thumbs; track thumb; let i = $index) {
              <andes-image
                [src]="thumb"
                [alt]="names[i]"
                [previewSrc]="large[i]"
                [width]="140"
                [height]="94"
                loading="eager"
              />
            }
          </div>
        </andes-image-group>
        <div andesDialogFooter>
          <andes-button variant="secondary" andesDialogClose>Done</andes-button>
        </div>
      </andes-dialog-content>
    </andes-dialog>
  `,
})
class DialogDemo {
  protected readonly open = signal(false);
  protected readonly thumbs = THUMBS.slice(0, 3);
  protected readonly large = LARGE;
  protected readonly names = NAMES;
}

export const NestedInDialog: Story = {
  name: 'Nested in a dialog',
  parameters: {
    docs: {
      description: {
        story:
          'A viewer opened from inside a modal dialog stacks above it. Escape closes the viewer only, focus goes back to the thumbnail inside the dialog, and the dialog stays open until it is dismissed itself.',
      },
    },
  },
  decorators: [moduleMetadata({ imports: [DialogDemo] })],
  render: () => ({ template: `<andes-story-image-dialog />` }),
};

export const PreviewConfig: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Everything about the viewer goes through the `preview` config object. First image: zoom limits and step, which toolbar buttons appear, and a blurred scrim. Group: an extra toolbar action and a custom "n of total" counter, both templates.',
      },
    },
  },
  render: () => ({
    props: {
      src: THUMBS[2],
      large: LARGE[2],
      config: {
        scaleStep: 0.25,
        maxScale: 8,
        actions: ['zoomOut', 'zoomIn', 'rotateRight', 'reset'],
        scrim: { blur: true },
      },
      thumbs: THUMBS.slice(0, 3),
      larges: LARGE,
      names: NAMES,
    },
    template: `
      <ng-template #extra let-item let-close="close">
        <button type="button" (click)="close()" style="border: 0; background: transparent; color: inherit; font: 500 13px/20px system-ui; padding: 0 0.5rem; cursor: pointer;">Use "{{ item.alt }}"</button>
      </ng-template>
      <ng-template #count let-current let-total="total"><span>Photo {{ current }} of {{ total }}</span></ng-template>
      <div style="display: flex; gap: 2rem; flex-wrap: wrap; align-items: flex-start;">
        <andes-image loading="eager" [src]="src" alt="Night hills" [previewSrc]="large" [width]="240" [height]="160" [preview]="config" />
        <andes-image-group [preview]="{ extraActions: extra, countTemplate: count }">
          <div style="display: flex; gap: 0.75rem;">
            @for (thumb of thumbs; track thumb; let i = $index) {
              <andes-image [src]="thumb" [alt]="names[i]" [previewSrc]="larges[i]" [width]="150" [height]="100" loading="eager" />
            }
          </div>
        </andes-image-group>
      </div>`,
  }),
};

@Component({
  selector: 'andes-story-image-controlled',
  imports: [AndesImage, AndesImageGroup, AndesButton],
  template: `
    <div
      style="display: flex; gap: 0.5rem; margin-bottom: 1rem; font: 14px/22px system-ui;"
    >
      <andes-button variant="outline" (click)="show(1)"
        >Open the second</andes-button
      >
      <andes-button variant="outline" (click)="show(4)"
        >Open the last</andes-button
      >
      <span style="align-self: center;"
        >open: {{ open() }}, current: {{ current() }}</span
      >
    </div>
    <andes-image-group [(open)]="open" [(current)]="current">
      <div style="display: flex; gap: 0.75rem; flex-wrap: wrap;">
        @for (thumb of thumbs; track thumb; let i = $index) {
          <andes-image
            [src]="thumb"
            [alt]="names[i]"
            [previewSrc]="large[i]"
            [width]="120"
            [height]="80"
            loading="eager"
          />
        }
      </div>
    </andes-image-group>
  `,
})
class ControlledDemo {
  protected readonly thumbs = THUMBS;
  protected readonly large = LARGE;
  protected readonly names = NAMES;
  protected readonly open = signal(false);
  protected readonly current = signal(0);

  protected show(index: number): void {
    this.current.set(index);
    this.open.set(true);
  }
}

export const Controlled: Story = {
  decorators: [moduleMetadata({ imports: [ControlledDemo] })],
  render: () => ({ template: `<andes-story-image-controlled />` }),
};

@Component({
  selector: 'andes-story-image-standalone',
  imports: [AndesImagePreview, AndesButton],
  template: `
    <andes-button (click)="open.set(true)">Open the viewer</andes-button>
    <andes-image-preview
      [items]="items"
      [(open)]="open"
      [(current)]="current"
      [config]="{ loop: true }"
    />
  `,
})
class StandaloneDemo {
  protected readonly items = GALLERY;
  protected readonly open = signal(false);
  protected readonly current = signal(0);
}

export const ViewerWithoutThumbnails: Story = {
  name: 'Viewer without thumbnails',
  decorators: [moduleMetadata({ imports: [StandaloneDemo] })],
  render: () => ({ template: `<andes-story-image-standalone />` }),
};

export const Localised: Story = {
  render: () => ({
    props: {
      src: THUMBS[1],
      large: LARGE[1],
      labels: {
        preview: 'Vista previa',
        dialog: 'Vista previa de imagen',
        close: 'Cerrar',
        zoomIn: 'Acercar',
        zoomOut: 'Alejar',
        rotateLeft: 'Girar a la izquierda',
        rotateRight: 'Girar a la derecha',
        flipX: 'Voltear horizontalmente',
        flipY: 'Voltear verticalmente',
        reset: 'Restablecer',
        download: 'Descargar',
        toolbar: 'Herramientas de imagen',
        zoomRatio: 'Ampliación',
        loadError: 'No se pudo cargar la imagen',
      },
    },
    template: `<andes-image loading="eager" [src]="src" alt="Valle verde" [previewSrc]="large" [width]="240" [height]="160" [labels]="labels" />`,
  }),
};

@Component({
  selector: 'andes-story-image-rtl',
  imports: [AndesImage, AndesImageGroup],
  template: `
    <andes-image-group>
      <div style="display: flex; gap: 0.75rem;">
        @for (thumb of thumbs; track thumb; let i = $index) {
          <andes-image
            loading="eager"
            [src]="thumb"
            [alt]="names[i]"
            [previewSrc]="large[i]"
            [width]="150"
            [height]="100"
          />
        }
      </div>
    </andes-image-group>
  `,
})
class RightToLeftDemo {
  protected readonly thumbs = THUMBS.slice(0, 3);
  protected readonly large = LARGE;
  protected readonly names = NAMES;

  constructor() {
    // The viewer renders in the overlay container, so it follows the document direction.
    const root = inject(DOCUMENT).documentElement;
    const previous = root.dir;
    root.dir = 'rtl';
    inject(DestroyRef).onDestroy(() => (root.dir = previous));
  }
}

export const RightToLeft: Story = {
  decorators: [moduleMetadata({ imports: [RightToLeftDemo] })],
  render: () => ({ template: `<andes-story-image-rtl />` }),
};
