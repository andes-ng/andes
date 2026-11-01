import { DOCUMENT } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';

import { AndesButton } from '../button/button';
import { ANDES_DIALOG_IMPORTS } from '../dialog/dialog';
import { AndesGallery } from './gallery';
import { AndesGalleryItem } from './gallery-item';
import type {
  AndesGalleryAction,
  AndesGalleryImage,
  AndesGalleryLabels,
  AndesGalleryThumbnailPosition,
} from './gallery-types';

/**
 * Landscapes drawn as SVG so the stories need no network and look the same everywhere: a sky
 * gradient, a sun or moon, and three ridges of hills, varied per index.
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
  {
    sky: ['#e9d5ff', '#a855f7'],
    sun: '#faf5ff',
    hills: ['#6b21a8', '#581c87', '#3b0764'],
  },
];

const PLACES = [
  'Ridge',
  'Valley',
  'Hills',
  'Horizon',
  'Coast',
  'Meadow',
  'Canyon',
  'Plateau',
  'Dunes',
  'Pass',
];

function scene(index: number, width: number, height: number): string {
  const p = PALETTES[index % PALETTES.length];
  const h = height;
  const w = width;
  const lift = ((index * 37) % 9) / 100;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
  <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p.sky[0]}"/><stop offset="1" stop-color="${p.sky[1]}"/></linearGradient></defs>
  <rect width="${w}" height="${h}" fill="url(#g)"/>
  <circle cx="${w * (0.18 + 0.13 * (index % 6))}" cy="${h * (0.22 + lift)}" r="${h * 0.08}" fill="${p.sun}" opacity="0.92"/>
  <path d="M0 ${h * (0.6 - lift)} Q ${w * 0.25} ${h * 0.42} ${w * 0.5} ${h * 0.6} T ${w} ${h * (0.52 + lift)} V ${h} H0Z" fill="${p.hills[0]}"/>
  <path d="M0 ${h * 0.74} Q ${w * 0.3} ${h * (0.56 + lift)} ${w * 0.6} ${h * 0.72} T ${w} ${h * 0.68} V ${h} H0Z" fill="${p.hills[1]}"/>
  <path d="M0 ${h * 0.88} Q ${w * 0.35} ${h * 0.74} ${w * 0.7} ${h * 0.86} T ${w} ${h * (0.8 + lift / 2)} V ${h} H0Z" fill="${p.hills[2]}"/>
</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function photos(count: number): AndesGalleryImage[] {
  return Array.from({ length: count }, (_, i) => {
    const title = `${PLACES[i % PLACES.length]} ${Math.floor(i / PLACES.length) + 1}`;
    return {
      src: scene(i, 1800, 1200),
      thumbnail: scene(i, 180, 120),
      alt: `Landscape: ${title.toLowerCase()}`,
      title,
      name: `${title.toLowerCase().replace(/\s+/g, '-')}.svg`,
    };
  });
}

const SIX = photos(6);
const THIRTY = photos(30);

/** A box for an inline gallery: it fills whatever it is given. */
const BOX = 'height: 30rem; max-width: 56rem;';

const meta: Meta<AndesGallery> = {
  title: 'Data Display/Gallery',
  component: AndesGallery,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [AndesGallery, AndesGalleryItem] })],
  parameters: { layout: 'padded' },
  argTypes: {
    thumbnailPosition: {
      control: 'inline-radio',
      options: ['bottom', 'top', 'start', 'end'],
    },
    loop: { control: 'boolean' },
    counter: { control: 'boolean' },
    thumbnails: { control: 'boolean' },
  },
  args: {
    thumbnailPosition: 'bottom',
    loop: false,
    counter: true,
    thumbnails: true,
  },
};

export default meta;
type Story = StoryObj<AndesGallery>;

export const Basic: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Inline, the gallery fills its container: one picture on a dark stage with round previous / next buttons, the toolbar and the counter at the top, the caption (the `title`) and the thumbnail strip at the bottom. Drag a zoomed picture, wheel or double click to zoom, swipe to change image, or use the arrow keys.',
      },
    },
  },
  render: (args) => ({
    props: { ...args, images: SIX, box: BOX },
    template: `
      <div [style]="box">
        <andes-gallery
          [images]="images"
          [thumbnailPosition]="thumbnailPosition"
          [loop]="loop"
          [counter]="counter"
          [thumbnails]="thumbnails"
        />
      </div>`,
  }),
};

export const Toolbar: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "`actions` picks the toolbar buttons and their order: the image viewer's zoom, rotate, flip, reset and download, plus `fullscreen`. The zoom ratio sits between the zoom buttons. An empty list hides the toolbar.",
      },
    },
  },
  render: () => ({
    props: {
      images: SIX,
      box: BOX,
      few: ['zoomOut', 'zoomIn', 'reset', 'fullscreen'] as AndesGalleryAction[],
    },
    template: `
      <div style="display: grid; gap: 1.5rem; font: 13px/20px system-ui;">
        <div>
          <p style="margin: 0 0 0.5rem;">Every action (the default)</p>
          <div [style]="box"><andes-gallery [images]="images" /></div>
        </div>
        <div>
          <p style="margin: 0 0 0.5rem;"><code>[actions]="['zoomOut', 'zoomIn', 'reset', 'fullscreen']"</code></p>
          <div [style]="box"><andes-gallery [images]="images" [actions]="few" /></div>
        </div>
        <div>
          <p style="margin: 0 0 0.5rem;"><code>[actions]="[]"</code></p>
          <div [style]="box"><andes-gallery [images]="images" [actions]="[]" /></div>
        </div>
      </div>`,
  }),
};

@Component({
  selector: 'andes-story-gallery-strips',
  imports: [AndesGallery],
  template: `
    <div
      role="radiogroup"
      aria-label="Thumbnail position"
      style="display: flex; gap: 0.5rem; margin-bottom: 1rem; font: 14px/22px system-ui;"
    >
      @for (option of positions; track option) {
        <label style="display: flex; gap: 0.25rem; align-items: center;">
          <input
            type="radio"
            name="strip-position"
            [checked]="position() === option"
            (change)="position.set(option)"
          />
          {{ option }}
        </label>
      }
    </div>
    <div style="height: 30rem; max-width: 56rem;">
      <andes-gallery [images]="images" [thumbnailPosition]="position()" />
    </div>
  `,
})
class StripDemo {
  protected readonly images = THIRTY;
  protected readonly positions: AndesGalleryThumbnailPosition[] = [
    'bottom',
    'top',
    'start',
    'end',
  ];
  protected readonly position = signal<AndesGalleryThumbnailPosition>('bottom');
}

export const Thumbnails: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'The strip sits at the `bottom` (default), `top`, or in a vertical column at the `start` or `end`. It keeps the active thumbnail in view, is a single tab stop, and the arrow keys walk it (left / right across, up / down in a column) with the picture following.',
      },
    },
  },
  decorators: [moduleMetadata({ imports: [StripDemo] })],
  render: () => ({ template: `<andes-story-gallery-strips />` }),
};

export const Single: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'With one picture there is nothing to step to: previous / next, the counter and the strip go away and the stage keeps the toolbar.',
      },
    },
  },
  render: () => ({
    props: { images: [SIX[2]], box: BOX },
    template: `<div [style]="box"><andes-gallery [images]="images" /></div>`,
  }),
};

@Component({
  selector: 'andes-story-gallery-grid',
  imports: [AndesGallery],
  template: `
    <ul
      style="display: grid; grid-template-columns: repeat(auto-fill, minmax(7rem, 1fr)); gap: 0.5rem; max-width: 56rem; margin: 0; padding: 0; list-style: none;"
    >
      @for (image of images; track image.src; let i = $index) {
        <li>
          <button
            type="button"
            [attr.aria-label]="'Open ' + image.title"
            style="display: block; width: 100%; aspect-ratio: 3 / 2; padding: 0; border: 0; border-radius: var(--andes-radius-md); overflow: hidden; cursor: zoom-in;"
            (click)="open(i)"
          >
            <img
              [src]="image.thumbnail"
              alt=""
              style="display: block; width: 100%; height: 100%; object-fit: cover;"
            />
          </button>
        </li>
      }
    </ul>
    <andes-gallery
      [images]="images"
      [inline]="false"
      [loop]="true"
      [(fullscreen)]="lightbox"
      [(activeIndex)]="index"
    />
  `,
})
class GridDemo {
  protected readonly images = THIRTY;
  protected readonly lightbox = signal(false);
  protected readonly index = signal(0);

  protected open(index: number): void {
    this.index.set(index);
    this.lightbox.set(true);
  }
}

export const GridToLightbox: Story = {
  name: 'Grid to lightbox',
  parameters: {
    docs: {
      description: {
        story:
          'Thirty thumbnails of your own; a click opens a lightbox-only gallery (`[inline]="false"`) on that picture. It grows out of the clicked thumbnail, closes on Escape, its close button or a click beside the picture, and gives focus back to the thumbnail.',
      },
    },
  },
  decorators: [moduleMetadata({ imports: [GridDemo] })],
  render: () => ({ template: `<andes-story-gallery-grid />` }),
};

export const Autoplay: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'A slideshow every three seconds. It waits while the pointer is over the gallery or focus is inside it, stops once you step, zoom or pick a thumbnail, and the play / pause button in the toolbar resumes or stops it. While it runs, the live region is quiet so a screen reader is not interrupted on every slide; it starts paused when the system asks for reduced motion.',
      },
    },
  },
  render: () => ({
    props: { images: SIX, box: BOX },
    template: `<div [style]="box"><andes-gallery [images]="images" [autoplay]="true" [autoplayInterval]="3000" /></div>`,
  }),
};

export const CustomTemplates: Story = {
  parameters: {
    docs: {
      description: {
        story:
          '`headerTemplate` adds to the top bar (here a title and an "open in a new tab" link), `captionTemplate` replaces the caption, `thumbnailTemplate` draws each thumbnail (here with its number) and `footerTemplate` adds a line under the strip. `imageTemplate` would replace the picture itself; the zoom and rotation still apply to it.',
      },
    },
  },
  render: () => ({
    props: { images: SIX, box: BOX },
    template: `
      <ng-template #header let-image>
        <strong style="color: var(--andes-color-ghost); font-weight: 600;">{{ image.title }}</strong>
        <a [href]="image.src" target="_blank" rel="noopener" style="color: inherit;">Open in a new tab</a>
      </ng-template>
      <ng-template #caption let-image let-index="index" let-total="total">
        <span>{{ image.alt }} <span style="opacity: 0.7;">({{ index + 1 }} of {{ total }})</span></span>
      </ng-template>
      <ng-template #thumb let-image let-index="index" let-active="active">
        <img [src]="image.thumbnail" alt="" style="width: 100%; height: 100%; object-fit: cover;" />
        <span style="position: absolute; inset-block-end: 2px; inset-inline-end: 4px; font: 600 11px/14px system-ui; color: white; text-shadow: 0 1px 2px black;">{{ index + 1 }}</span>
      </ng-template>
      <ng-template #footer let-image>
        <span style="font-size: 12px;">Drawn as SVG · {{ image.name }}</span>
      </ng-template>
      <div [style]="box">
        <andes-gallery
          [images]="images"
          [headerTemplate]="header"
          [captionTemplate]="caption"
          [thumbnailTemplate]="thumb"
          [footerTemplate]="footer"
          [counter]="false"
        />
      </div>`,
  }),
};

export const DeclaredInMarkup: Story = {
  name: 'Declared in markup',
  parameters: {
    docs: {
      description: {
        story:
          'Without `images`, the gallery reads its `andes-gallery-item` children; they render nothing themselves.',
      },
    },
  },
  render: () => ({
    props: { images: SIX.slice(0, 3), box: BOX },
    template: `
      <div [style]="box">
        <andes-gallery>
          @for (image of images; track image.src) {
            <andes-gallery-item [src]="image.src" [thumbnail]="image.thumbnail" [alt]="image.alt" [title]="image.title" />
          }
        </andes-gallery>
      </div>`,
  }),
};

const SPANISH: AndesGalleryLabels = {
  gallery: 'Galería de imágenes',
  previous: 'Imagen anterior',
  next: 'Imagen siguiente',
  close: 'Cerrar',
  zoomIn: 'Acercar',
  zoomOut: 'Alejar',
  rotateLeft: 'Girar a la izquierda',
  rotateRight: 'Girar a la derecha',
  flipX: 'Voltear horizontalmente',
  flipY: 'Voltear verticalmente',
  reset: 'Restablecer',
  download: 'Descargar',
  fullscreen: 'Pantalla completa',
  exitFullscreen: 'Salir de pantalla completa',
  play: 'Iniciar presentación',
  pause: 'Pausar presentación',
  toolbar: 'Herramientas de imagen',
  thumbnails: 'Miniaturas',
  zoomRatio: 'Ampliación',
  loadError: 'No se pudo cargar la imagen',
  position: (current, total) => `Imagen ${current} de ${total}`,
};

export const Localised: Story = {
  parameters: {
    docs: {
      description: {
        story:
          '`labels` localises every name, tooltip and announcement; unset fields keep their English default.',
      },
    },
  },
  render: () => ({
    props: { images: SIX, box: BOX, labels: SPANISH },
    template: `<div [style]="box"><andes-gallery [images]="images" [labels]="labels" [autoplay]="false" /></div>`,
  }),
};

@Component({
  selector: 'andes-story-gallery-rtl',
  imports: [AndesGallery],
  template: `
    <div dir="rtl" style="height: 30rem; max-width: 56rem;">
      <andes-gallery [images]="images" thumbnailPosition="start" />
    </div>
  `,
})
class RightToLeftDemo {
  protected readonly images = THIRTY;

  constructor() {
    // The lightbox renders in the overlay container, so it follows the document direction.
    const root = inject(DOCUMENT).documentElement;
    const previous = root.dir;
    root.dir = 'rtl';
    inject(DestroyRef).onDestroy(() => (root.dir = previous));
  }
}

export const RightToLeft: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'In right-to-left the layout mirrors: the `start` strip sits on the right, previous is on the right and points right, the arrow keys follow the reading direction and the counter keeps its order.',
      },
    },
  },
  decorators: [moduleMetadata({ imports: [RightToLeftDemo] })],
  render: () => ({ template: `<andes-story-gallery-rtl />` }),
};

@Component({
  selector: 'andes-story-gallery-controlled',
  imports: [AndesGallery, AndesButton],
  template: `
    <div
      style="display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: center; margin-bottom: 1rem; font: 14px/22px system-ui;"
    >
      <andes-button variant="outline" (click)="index.set(0)"
        >First</andes-button
      >
      <andes-button variant="outline" (click)="index.set(images.length - 1)"
        >Last</andes-button
      >
      <andes-button (click)="fullscreen.set(true)"
        >Open full screen</andes-button
      >
      <span>activeIndex: {{ index() }}, fullscreen: {{ fullscreen() }}</span>
      <span>last change: {{ lastChange() }}</span>
    </div>
    <div style="height: 30rem; max-width: 56rem;">
      <andes-gallery
        [images]="images"
        [(activeIndex)]="index"
        [(fullscreen)]="fullscreen"
        (transformChange)="lastChange.set($event.action)"
        (closed)="lastChange.set('closed: ' + $event)"
      />
    </div>
  `,
})
class ControlledDemo {
  protected readonly images = SIX;
  protected readonly index = signal(2);
  protected readonly fullscreen = signal(false);
  protected readonly lastChange = signal('none');
}

export const Controlled: Story = {
  parameters: {
    docs: {
      description: {
        story:
          '`[(activeIndex)]` and `[(fullscreen)]` are two-way; `transformChange` reports every zoom, rotation, flip and pan with what caused it, and `closed` how the lightbox closed.',
      },
    },
  },
  decorators: [moduleMetadata({ imports: [ControlledDemo] })],
  render: () => ({ template: `<andes-story-gallery-controlled />` }),
};

/** The library's own dialog with a gallery in it, whose lightbox stacks over the dialog. */
@Component({
  selector: 'andes-story-gallery-dialog',
  imports: [AndesGallery, AndesButton, ...ANDES_DIALOG_IMPORTS],
  template: `
    <andes-button (click)="open.set(true)">Open the dialog</andes-button>
    <andes-dialog [(open)]="open">
      <andes-dialog-content *andesDialogContent>
        <div andesDialogHeader>
          <h2 andesDialogTitle>Trip album</h2>
          <p andesDialogDescription>
            Full screen opens a lightbox over the dialog; Escape closes it
            first.
          </p>
        </div>
        <div style="height: 22rem;">
          <andes-gallery [images]="images" />
        </div>
        <div andesDialogFooter>
          <andes-button variant="secondary" andesDialogClose>Done</andes-button>
        </div>
      </andes-dialog-content>
    </andes-dialog>
  `,
})
class DialogDemo {
  protected readonly open = signal(false);
  protected readonly images = SIX;
}

export const InADialog: Story = {
  name: 'In a dialog',
  decorators: [moduleMetadata({ imports: [DialogDemo] })],
  render: () => ({ template: `<andes-story-gallery-dialog />` }),
};
