import { readFileSync } from 'node:fs';

import {
  Component,
  inject,
  signal,
  TemplateRef,
  viewChild,
} from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';

import {
  andesOverlayPreset,
  AndesOverlayContentPrimitive,
  AndesOverlayPrimitive,
  provideAndesOverlay,
} from '@andes-ng/primitives';

import {
  AndesImage,
  type AndesImageMaskVariant,
  type AndesImagePlaceholder,
} from './image';
import type {
  AndesImageClassNames,
  AndesImageLabels,
  AndesImagePreviewConfig,
  AndesImageStyles,
} from './image-types';

/**
 * jsdom reports zero geometry for every element, which makes CDK treat everything as
 * invisible and so unfocusable. A nominal size lets the viewer's focus handling run.
 */
function withElementGeometry() {
  const descriptors = (['offsetWidth', 'offsetHeight'] as const).map(
    (prop) =>
      [
        prop,
        Object.getOwnPropertyDescriptor(HTMLElement.prototype, prop),
      ] as const,
  );
  beforeAll(() => {
    for (const [prop] of descriptors) {
      Object.defineProperty(HTMLElement.prototype, prop, {
        configurable: true,
        get: () => 1,
      });
    }
  });
  afterAll(() => {
    for (const [prop, descriptor] of descriptors) {
      if (descriptor) {
        Object.defineProperty(HTMLElement.prototype, prop, descriptor);
      } else {
        delete (HTMLElement.prototype as unknown as Record<string, unknown>)[
          prop
        ];
      }
    }
  });
}

@Component({
  imports: [AndesImage],
  template: `
    <ng-template #maskTemplate><b id="custom-mask">Zoom</b></ng-template>
    <ng-template #placeholderTemplate
      ><i id="custom-placeholder">…</i></ng-template
    >
    <ng-template #fallbackTemplate
      ><span id="custom-fallback">Not found</span></ng-template
    >
    <button type="button" id="outside">Outside</button>
    <andes-image
      [src]="src()"
      [alt]="alt()"
      [width]="width()"
      [height]="height()"
      [fallback]="fallback()"
      [placeholder]="placeholder()"
      [placeholderSrc]="placeholderSrc()"
      [preview]="preview()"
      [previewSrc]="previewSrc()"
      [mask]="mask()"
      [maskVariant]="maskVariant()"
      [classNames]="classNames()"
      [styles]="styles()"
      [labels]="labels()"
      [loading]="loading()"
      [(previewOpen)]="open"
      (loaded)="loadedCount = loadedCount + 1"
      (errored)="erroredCount = erroredCount + 1"
    />
  `,
})
class Host {
  readonly maskTemplate =
    viewChild.required<TemplateRef<unknown>>('maskTemplate');
  readonly placeholderTemplate = viewChild.required<TemplateRef<unknown>>(
    'placeholderTemplate',
  );
  readonly fallbackTemplate =
    viewChild.required<TemplateRef<unknown>>('fallbackTemplate');
  readonly src = signal<string | null>('/a.jpg');
  readonly alt = signal('Harbour at dusk');
  readonly width = signal<number | string | null>(240);
  readonly height = signal<number | string | null>(160);
  readonly fallback = signal<string | TemplateRef<unknown> | null>(null);
  readonly placeholder = signal<AndesImagePlaceholder>(false);
  readonly placeholderSrc = signal<string | null>(null);
  readonly preview = signal<boolean | AndesImagePreviewConfig | ''>(true);
  readonly previewSrc = signal<string | null>(null);
  readonly mask = signal<boolean | string | TemplateRef<unknown>>(true);
  readonly maskVariant = signal<AndesImageMaskVariant>('dimmed');
  readonly classNames = signal<AndesImageClassNames | null>(null);
  readonly styles = signal<AndesImageStyles | null>(null);
  readonly labels = signal<AndesImageLabels | null>(null);
  readonly loading = signal<'lazy' | 'eager'>('lazy');
  readonly open = signal(false);
  loadedCount = 0;
  erroredCount = 0;
}

function setup(configure?: (host: Host) => void) {
  const fixture = TestBed.createComponent(Host);
  configure?.(fixture.componentInstance);
  fixture.detectChanges();
  return fixture;
}

const q = <T extends HTMLElement = HTMLElement>(
  selector: string,
  root: ParentNode = document,
) => root.querySelector<T>(selector);

const image = (f: ComponentFixture<Host>) =>
  q<HTMLElement>('andes-image', f.nativeElement) as HTMLElement;
const img = (f: ComponentFixture<Host>) =>
  q<HTMLImageElement>(
    'img.andes-image__img',
    f.nativeElement,
  ) as HTMLImageElement;
const trigger = (f: ComponentFixture<Host>) =>
  q<HTMLButtonElement>('.andes-image__mask', f.nativeElement);
const viewer = () => q('.andes-image-preview');

function fire(element: Element, type: 'load' | 'error') {
  element.dispatchEvent(new Event(type));
}

function pressEscape() {
  document.body.dispatchEvent(
    new KeyboardEvent('keydown', {
      key: 'Escape',
      keyCode: 27,
      bubbles: true,
      cancelable: true,
    }),
  );
}

describe('AndesImage', () => {
  withElementGeometry();

  describe('the picture', () => {
    it('wraps a native img carrying src, alt and lazy loading', () => {
      const f = setup();
      expect(image(f).getAttribute('data-slot')).toBe('image');
      expect(img(f).getAttribute('src')).toBe('/a.jpg');
      expect(img(f).getAttribute('alt')).toBe('Harbour at dusk');
      expect(img(f).getAttribute('loading')).toBe('lazy');
      expect(img(f).getAttribute('decoding')).toBe('async');
    });

    it('takes eager loading', () => {
      const f = setup((h) => h.loading.set('eager'));
      expect(img(f).getAttribute('loading')).toBe('eager');
    });

    it('sizes the box: numbers are px, strings pass through', () => {
      const f = setup((h) => {
        h.width.set(240);
        h.height.set('50%');
      });
      expect(image(f).style.width).toBe('240px');
      expect(image(f).style.height).toBe('50%');
    });

    it('reports load and tracks the state', () => {
      const f = setup();
      expect(image(f).dataset['state']).toBe('loading');
      fire(img(f), 'load');
      f.detectChanges();
      expect(image(f).dataset['state']).toBe('loaded');
      expect(f.componentInstance.loadedCount).toBe(1);
    });

    it('starts loading again when src changes', () => {
      const f = setup();
      fire(img(f), 'load');
      f.detectChanges();
      f.componentInstance.src.set('/b.jpg');
      f.detectChanges();
      expect(image(f).dataset['state']).toBe('loading');
      expect(img(f).getAttribute('src')).toBe('/b.jpg');
    });
  });

  describe('failure', () => {
    it('shows an error box and reports it', () => {
      const f = setup();
      fire(img(f), 'error');
      f.detectChanges();
      expect(image(f).dataset['state']).toBe('error');
      expect(q('[data-slot="image-error"]', f.nativeElement)).not.toBeNull();
      expect(f.componentInstance.erroredCount).toBe(1);
    });

    it('offers no preview for an image that failed', () => {
      const f = setup();
      fire(img(f), 'error');
      f.detectChanges();
      expect(trigger(f)).toBeNull();
    });

    it('swaps in the fallback once, then gives up', () => {
      const f = setup((h) => h.fallback.set('/fallback.jpg'));
      fire(img(f), 'error');
      f.detectChanges();
      expect(img(f).getAttribute('src')).toBe('/fallback.jpg');
      expect(image(f).dataset['state']).toBe('loading');

      fire(img(f), 'error');
      f.detectChanges();
      expect(image(f).dataset['state']).toBe('error');
      expect(f.componentInstance.erroredCount).toBe(2);
    });

    it('shows the fallback straight away when there is no src', () => {
      const f = setup((h) => {
        h.src.set(null);
        h.fallback.set('/fallback.jpg');
      });
      expect(img(f).getAttribute('src')).toBe('/fallback.jpg');
    });

    it('keeps loading while the url has not arrived, and fails for an empty one', () => {
      const f = setup((h) => {
        h.src.set(null);
        h.placeholder.set(true);
      });
      expect(image(f).dataset['state']).toBe('loading');
      expect(img(f).hasAttribute('src')).toBe(false);
      expect(
        q('[data-slot="image-placeholder"]', f.nativeElement),
      ).not.toBeNull();

      f.componentInstance.src.set('');
      f.detectChanges();
      expect(image(f).dataset['state']).toBe('error');

      f.componentInstance.src.set('/a.jpg');
      f.detectChanges();
      expect(image(f).dataset['state']).toBe('loading');
    });

    it('lets a new src recover from an error', () => {
      const f = setup();
      fire(img(f), 'error');
      f.detectChanges();
      f.componentInstance.src.set('/b.jpg');
      f.detectChanges();
      expect(image(f).dataset['state']).toBe('loading');
      expect(q('[data-slot="image-error"]', f.nativeElement)).toBeNull();
    });
  });

  describe('placeholder', () => {
    it('shows nothing by default', () => {
      const f = setup();
      expect(q('[data-slot="image-placeholder"]', f.nativeElement)).toBeNull();
    });

    it('shows a skeleton while loading and removes it on load', () => {
      const f = setup((h) => h.placeholder.set(true));
      const placeholder = q('[data-slot="image-placeholder"]', f.nativeElement);
      expect(placeholder?.classList).toContain(
        'andes-image__placeholder--skeleton',
      );
      expect(placeholder?.getAttribute('aria-hidden')).toBe('true');
      expect(img(f).classList).toContain('andes-image__img--pending');

      fire(img(f), 'load');
      f.detectChanges();
      expect(q('[data-slot="image-placeholder"]', f.nativeElement)).toBeNull();
      expect(img(f).classList).not.toContain('andes-image__img--pending');
    });

    it('blurs the placeholder source', () => {
      const f = setup((h) => {
        h.placeholder.set('blur');
        h.placeholderSrc.set('/tiny.jpg');
      });
      const blurred = q<HTMLImageElement>(
        '.andes-image__blur',
        f.nativeElement,
      );
      expect(blurred?.getAttribute('src')).toBe('/tiny.jpg');
      expect(blurred?.getAttribute('alt')).toBe('');
    });

    it('renders a template placeholder', () => {
      const f = setup();
      f.componentInstance.placeholder.set(
        f.componentInstance.placeholderTemplate(),
      );
      f.detectChanges();
      expect(q('#custom-placeholder', f.nativeElement)).not.toBeNull();
    });
  });

  describe('preview button', () => {
    it('covers the thumbnail with a named, dialog-announcing button', () => {
      const f = setup();
      const button = trigger(f);
      expect(button?.tagName).toBe('BUTTON');
      expect(button?.getAttribute('type')).toBe('button');
      expect(button?.getAttribute('aria-label')).toBe(
        'Preview: Harbour at dusk',
      );
      expect(button?.getAttribute('aria-haspopup')).toBe('dialog');
      expect(button?.textContent).toContain('Preview');
    });

    it('is absent with preview off, in every spelling', () => {
      const f = setup((h) => h.preview.set(false));
      expect(trigger(f)).toBeNull();
      expect(image(f).getAttribute('data-preview')).toBeNull();
    });

    it('treats a bare attribute as on', () => {
      const f = setup((h) => h.preview.set(''));
      expect(trigger(f)).not.toBeNull();
    });

    it('takes a custom label, a template, or none', () => {
      const f = setup((h) => h.mask.set('View'));
      expect(trigger(f)?.textContent).toContain('View');

      f.componentInstance.mask.set(f.componentInstance.maskTemplate());
      f.detectChanges();
      expect(q('#custom-mask', f.nativeElement)).not.toBeNull();

      f.componentInstance.mask.set(false);
      f.detectChanges();
      expect(trigger(f)?.classList).toContain('andes-image__mask--bare');
      expect(trigger(f)?.textContent?.trim()).toBe('');
      // Still a named, working control.
      expect(trigger(f)?.getAttribute('aria-label')).toBe(
        'Preview: Harbour at dusk',
      );
    });

    it('localises the label and the button name', () => {
      const f = setup((h) => h.labels.set({ preview: 'Vista previa' }));
      expect(trigger(f)?.textContent).toContain('Vista previa');
      expect(trigger(f)?.getAttribute('aria-label')).toBe(
        'Vista previa: Harbour at dusk',
      );
    });
  });

  describe('opening the viewer', () => {
    it('opens a modal dialog on click and reports the state', () => {
      const f = setup();
      expect(viewer()).toBeNull();
      trigger(f)?.click();
      f.detectChanges();

      const root = viewer();
      expect(root?.getAttribute('role')).toBe('dialog');
      expect(root?.getAttribute('aria-modal')).toBe('true');
      expect(root?.getAttribute('aria-label')).toBe(
        'Image preview: Harbour at dusk',
      );
      expect(f.componentInstance.open()).toBe(true);
      expect(
        q<HTMLImageElement>('.andes-image-preview__image')?.getAttribute('src'),
      ).toBe('/a.jpg');
    });

    it('opens from the two-way model', () => {
      const f = setup();
      f.componentInstance.open.set(true);
      f.detectChanges();
      expect(viewer()).not.toBeNull();
    });

    it('shows the larger asset when previewSrc is given', () => {
      const f = setup((h) => h.previewSrc.set('/a-large.jpg'));
      expect(img(f).getAttribute('src')).toBe('/a.jpg');
      trigger(f)?.click();
      f.detectChanges();
      expect(
        q<HTMLImageElement>('.andes-image-preview__image')?.getAttribute('src'),
      ).toBe('/a-large.jpg');
    });

    it('falls back to the thumbnail when the larger asset fails', () => {
      const f = setup((h) => h.previewSrc.set('/a-large.jpg'));
      trigger(f)?.click();
      f.detectChanges();
      fire(q('.andes-image-preview__image') as HTMLElement, 'error');
      f.detectChanges();
      expect(
        q<HTMLImageElement>('.andes-image-preview__image')?.getAttribute('src'),
      ).toBe('/a.jpg');
    });

    it('closes with the close button, Escape and a click on the empty stage', () => {
      const f = setup();
      const open = () => {
        trigger(f)?.click();
        f.detectChanges();
      };

      open();
      q<HTMLButtonElement>('.andes-image-preview__close')?.click();
      f.detectChanges();
      expect(viewer()).toBeNull();
      expect(f.componentInstance.open()).toBe(false);

      open();
      pressEscape();
      f.detectChanges();
      expect(viewer()).toBeNull();

      open();
      q('.andes-image-preview__stage')?.click();
      f.detectChanges();
      expect(viewer()).toBeNull();
    });

    it('does not close on a click on the picture itself', () => {
      const f = setup();
      trigger(f)?.click();
      f.detectChanges();
      q('.andes-image-preview__image')?.click();
      f.detectChanges();
      expect(viewer()).not.toBeNull();
    });

    it('moves focus into the viewer and returns it to the thumbnail', () => {
      const f = setup();
      trigger(f)?.focus();
      trigger(f)?.click();
      f.detectChanges();
      expect(q('.andes-image-preview')?.contains(document.activeElement)).toBe(
        true,
      );

      pressEscape();
      f.detectChanges();
      expect(document.activeElement).toBe(trigger(f));
    });

    it('makes the page behind inert while open', () => {
      const f = setup();
      trigger(f)?.click();
      f.detectChanges();
      expect(
        f.nativeElement.closest('[inert]') ??
          f.nativeElement.hasAttribute('inert'),
      ).toBeTruthy();
      pressEscape();
      f.detectChanges();
      expect(f.nativeElement.hasAttribute('inert')).toBe(false);
    });
  });

  describe('progress placeholder', () => {
    it('draws a soft wash for `{ progress: true }`', () => {
      const f = setup((h) => {
        h.src.set(null);
        h.placeholder.set({ progress: true });
      });
      const placeholder = q('[data-slot="image-placeholder"]', f.nativeElement);
      expect(placeholder?.classList).toContain(
        'andes-image__placeholder--progress',
      );
      expect(q('.andes-image__wash', f.nativeElement)).not.toBeNull();
      expect(q('[role="progressbar"]', f.nativeElement)).toBeNull();
    });

    it('draws a named progress bar with the percent, clamped', () => {
      const f = setup((h) => {
        h.src.set(null);
        h.placeholder.set({ progress: { percent: 42.4 } });
      });
      const bar = q('[role="progressbar"]', f.nativeElement) as HTMLElement;
      expect(bar.getAttribute('aria-valuenow')).toBe('42');
      expect(bar.getAttribute('aria-valuemin')).toBe('0');
      expect(bar.getAttribute('aria-valuemax')).toBe('100');
      expect(bar.getAttribute('aria-label')).toBe('Loading image');
      expect(
        (q('.andes-image__progress-bar', f.nativeElement) as HTMLElement).style
          .width,
      ).toBe('42%');
      expect(
        q('.andes-image__progress-text', f.nativeElement)?.textContent?.trim(),
      ).toBe('42%');

      f.componentInstance.placeholder.set({ progress: { percent: 140 } });
      f.detectChanges();
      expect(bar.getAttribute('aria-valuenow')).toBe('100');
      f.componentInstance.labels.set({ loading: 'Cargando imagen' });
      f.detectChanges();
      expect(bar.getAttribute('aria-label')).toBe('Cargando imagen');
    });

    it('goes away once the picture has loaded', () => {
      const f = setup((h) => h.placeholder.set({ progress: { percent: 90 } }));
      expect(q('[role="progressbar"]', f.nativeElement)).not.toBeNull();
      fire(img(f), 'load');
      f.detectChanges();
      expect(q('[data-slot="image-placeholder"]', f.nativeElement)).toBeNull();
    });
  });

  describe('fallback template', () => {
    it('draws the template in the box when the source fails', () => {
      const f = setup((h) => h.fallback.set(h.fallbackTemplate()));
      expect(q('#custom-fallback', f.nativeElement)).toBeNull();
      fire(img(f), 'error');
      f.detectChanges();
      expect(image(f).dataset['state']).toBe('error');
      expect(
        q('[data-slot="image-fallback"] #custom-fallback', f.nativeElement),
      ).not.toBeNull();
      expect(q('[data-slot="image-error"]', f.nativeElement)).toBeNull();
      expect(f.componentInstance.erroredCount).toBe(1);
    });

    it('is not mistaken for a URL to retry', () => {
      const f = setup((h) => h.fallback.set(h.fallbackTemplate()));
      fire(img(f), 'error');
      f.detectChanges();
      expect(img(f).getAttribute('src')).toBe('/a.jpg');
    });
  });

  describe('mask variants', () => {
    it('dims by default, and blurs or stays clear on request', () => {
      const f = setup();
      const mask = trigger(f) as HTMLElement;
      expect(mask.classList).not.toContain('andes-image__mask--blur');
      expect(mask.classList).not.toContain('andes-image__mask--clear');
      f.componentInstance.maskVariant.set('blur');
      f.detectChanges();
      expect(mask.classList).toContain('andes-image__mask--blur');
      f.componentInstance.maskVariant.set('none');
      f.detectChanges();
      expect(mask.classList).toContain('andes-image__mask--clear');
      expect(mask.classList).not.toContain('andes-image__mask--blur');
      // The label is still there to read: only the tint changes.
      expect(mask.textContent).toContain('Preview');
    });
  });

  describe('semantic parts', () => {
    it('adds classes and styles to the root, the picture and the mask', () => {
      const f = setup((h) => {
        h.classNames.set({ root: 'my-root', image: 'my-img', mask: 'my-mask' });
        h.styles.set({
          root: { outline: '3px solid red' },
          image: { filter: 'grayscale(1)' },
          mask: { 'letter-spacing': '1px' },
        });
      });
      expect(image(f).classList).toContain('my-root');
      expect(image(f).style.outline).toBe('3px solid red');
      // The host keeps its own sizing next to the consumer's styles.
      expect(image(f).style.width).toBe('240px');
      expect(img(f).classList).toContain('my-img');
      expect(img(f).classList).toContain('andes-image__img');
      expect(img(f).style.filter).toBe('grayscale(1)');
      expect(img(f).style.objectFit).toBe('cover');
      expect(trigger(f)?.classList).toContain('my-mask');
      expect(trigger(f)?.classList).toContain('andes-image__mask');
      expect(trigger(f)?.style.letterSpacing).toBe('1px');
    });

    it('passes the viewer parts on to the viewer', () => {
      const f = setup((h) => {
        h.classNames.set({ viewer: 'my-viewer', toolbar: 'my-toolbar' });
        h.styles.set({ viewerImage: { opacity: '0.5' } });
      });
      trigger(f)?.click();
      f.detectChanges();
      expect(viewer()?.classList).toContain('my-viewer');
      expect(q('.andes-image-preview__toolbar')?.classList).toContain(
        'my-toolbar',
      );
      expect(q<HTMLElement>('.andes-image-preview__image')?.style.opacity).toBe(
        '0.5',
      );
    });
  });

  describe('motion origin', () => {
    it('grows the viewer out of the thumbnail', () => {
      const f = setup();
      image(f).getBoundingClientRect = () => new DOMRect(10, 20, 240, 160);
      trigger(f)?.click();
      f.detectChanges();
      expect(
        viewer()?.style.getPropertyValue('--andes-image-preview-origin'),
      ).toBe('130px 100px');
    });
  });

  describe('stylesheets', () => {
    const css = readFileSync('packages/ui/src/lib/image/image.css', 'utf8');
    const previewCss = readFileSync(
      'packages/ui/src/lib/image/image-preview.css',
      'utf8',
    );

    it('fits a phone: smaller controls, no zoom ratio and a toolbar that stays one pill', () => {
      const narrow = previewCss.slice(
        previewCss.indexOf('@media (max-width: 32rem)'),
      );
      expect(narrow).toMatch(
        /\.andes-image-preview\s*\{\s*--andes-image-preview-control-size: 2\.25rem/,
      );
      expect(narrow).toMatch(
        /\.andes-image-preview__ratio\s*\{\s*display: none/,
      );
      expect(narrow).toMatch(
        /\.andes-image-preview__counter\s*\{\s*white-space: nowrap/,
      );
    });

    it('reveals the thumbnail label on hover and keyboard focus with the focus ring', () => {
      expect(css).toMatch(
        /\.andes-image__mask:hover,\s*\.andes-image__mask:focus-visible\s*\{[^}]*opacity: 1/,
      );
      expect(css).toMatch(
        /\.andes-image__mask:focus-visible\s*\{[^}]*outline: 2px solid var\(--andes-color-focus-ring/,
      );
    });

    it('runs the placeholder shimmer slowly and stops it for reduced motion', () => {
      expect(css).toMatch(/animation: andes-image-shimmer 1\.8s/);
      expect(css).toMatch(
        /@media \(prefers-reduced-motion: reduce\)[\s\S]*andes-image__placeholder--skeleton::after,\s*\.andes-image__wash\s*\{\s*animation: none/,
      );
    });

    it('fades the scrim in over 0.3s and leaves within the exit window, on one curve', () => {
      expect(previewCss).toMatch(
        /--andes-image-preview-duration: 0\.3s;\s*--andes-image-preview-exit-duration: 0\.25s;\s*--andes-image-preview-ease: cubic-bezier\(0\.78, 0\.14, 0\.15, 0\.86\)/,
      );
      expect(previewCss).toMatch(
        /\.andes-image-preview-backdrop\s*\{[^}]*transition-duration: var\(--andes-image-preview-duration, 0\.3s\)/,
      );
      expect(previewCss).toMatch(
        /\.andes-image-preview\[data-andes-closing\]\s*\{[^}]*animation: andes-image-preview-fade-out\s+var\(--andes-image-preview-exit-duration\)\s+var\(--andes-image-preview-ease\)\s+forwards/,
      );
      expect(previewCss).toMatch(
        /\.andes-image-preview-backdrop\[data-andes-closing\]\s*\{[^}]*animation: andes-image-preview-fade-out[^;]*forwards/,
      );
    });

    it('drops every animation and transition for reduced motion', () => {
      const reduced = previewCss.slice(
        previewCss.indexOf('@media (prefers-reduced-motion: reduce)'),
      );
      expect(reduced).toMatch(
        /\.andes-image-preview\[data-andes-closing\][\s\S]*animation: none/,
      );
      expect(reduced).toMatch(
        /\.andes-image-preview__image[\s\S]*transition: none/,
      );
    });

    it('reveals the mask over 0.3s and blurs it for the blur variant', () => {
      expect(css).toMatch(
        /\.andes-image__mask\s*\{[^}]*transition: opacity 0\.3s ease/,
      );
      expect(css).toMatch(
        /\.andes-image__mask--blur:hover,\s*\.andes-image__mask--blur:focus-visible\s*\{[^}]*backdrop-filter: blur\(4px\)/,
      );
    });

    it('stops the progress wash and bar for reduced motion', () => {
      const reduced = css.slice(
        css.indexOf('@media (prefers-reduced-motion: reduce)'),
      );
      expect(reduced).toMatch(/\.andes-image__wash\s*\{\s*animation: none/);
      expect(reduced).toMatch(
        /\.andes-image__progress-bar\s*\{\s*transition: none/,
      );
    });

    it('draws the viewer with light icons on see-through discs, whatever the theme', () => {
      expect(previewCss).toMatch(
        /--andes-image-preview-control-color-hover: var\(--andes-color-ghost, #fff\)/,
      );
      expect(previewCss).toMatch(
        /--andes-image-preview-control-background: color-mix\(\s*in srgb,\s*var\(--andes-color-overlay/,
      );
      expect(previewCss).toMatch(
        /\.andes-image-preview__nav\s*\{[^}]*inset-block-start: 50%/,
      );
      expect(previewCss).toMatch(
        /\.andes-image-preview__close,\s*\.andes-image-preview__nav\s*\{[^}]*border-radius: var\(--andes-radius-full/,
      );
    });

    it('zooms the stage out of the origin point and back', () => {
      expect(previewCss).toMatch(
        /\.andes-image-preview__stage\s*\{[^}]*transform-origin: var\(--andes-image-preview-origin, 50% 50%\)[^}]*animation: andes-image-preview-zoom-in/,
      );
      expect(previewCss).toMatch(
        /\[data-andes-closing\] \.andes-image-preview__stage\s*\{[^}]*animation: andes-image-preview-zoom-out/,
      );
      expect(previewCss).toMatch(
        /\.andes-image-preview__leaving\s*\{[^}]*animation: andes-image-preview-fade-out/,
      );
    });

    it('keeps the counter in reading order in right-to-left', () => {
      expect(previewCss).toMatch(
        /\.andes-image-preview__counter\s*\{[^}]*direction: ltr;\s*unicode-bidi: isolate/,
      );
    });

    it('gives every control a system outline in forced colours', () => {
      for (const source of [css, previewCss]) {
        expect(source).toContain('@media (forced-colors: active)');
      }
      const forced = previewCss.slice(
        previewCss.indexOf('@media (forced-colors: active)'),
      );
      expect(forced).toMatch(/border: 1px solid ButtonText/);
      expect(forced).toMatch(/GrayText/);
    });

    it('keeps no hard-coded colour outside a token fallback', () => {
      for (const source of [css, previewCss]) {
        const withoutFallbacks = source.replace(
          /var\([^()]*(?:\([^()]*\)[^()]*)*\)/g,
          'var()',
        );
        expect(withoutFallbacks).not.toMatch(/#[0-9a-f]{3,8}\b|rgb\(/i);
      }
    });
  });
});

@Component({
  imports: [AndesImage, AndesOverlayContentPrimitive],
  providers: [provideAndesOverlay()],
  template: `
    <button type="button" id="open-dialog" (click)="openDialog()">Open</button>
    <ng-template #panel>
      <div andesOverlayContent aria-label="Photos" data-test="dialog">
        <andes-image id="inner" src="/a.jpg" alt="Inside" />
        <button type="button" id="dialog-done">Done</button>
      </div>
    </ng-template>
  `,
})
class DialogHost {
  readonly overlay = inject(AndesOverlayPrimitive);
  readonly panel = viewChild.required<TemplateRef<unknown>>('panel');
  constructor() {
    this.overlay.configure(andesOverlayPreset('dialog'));
  }
  openDialog() {
    this.overlay.open(this.panel());
  }
}

describe('AndesImage inside a modal dialog', () => {
  withElementGeometry();

  function openBoth() {
    const f = TestBed.createComponent(DialogHost);
    f.detectChanges();
    f.componentInstance.openDialog();
    f.detectChanges();
    const thumb = q<HTMLButtonElement>('#inner .andes-image__mask');
    thumb?.focus();
    thumb?.click();
    f.detectChanges();
    return { f, thumb };
  }

  it('stacks the viewer above the dialog', () => {
    openBoth();
    const panes = Array.from(
      document.querySelectorAll(
        '.cdk-overlay-connected-position-bounding-box, .cdk-global-overlay-wrapper',
      ),
    );
    const dialogHost = q('[data-test="dialog"]')?.closest(
      '.cdk-global-overlay-wrapper',
    );
    const viewerHost = viewer()?.closest('.cdk-global-overlay-wrapper');
    expect(dialogHost).toBeTruthy();
    expect(viewerHost).toBeTruthy();
    expect(panes.indexOf(viewerHost as Element)).toBeGreaterThan(
      panes.indexOf(dialogHost as Element),
    );
    // The same modal layer: the later overlay paints on top.
    expect((viewerHost as HTMLElement).style.zIndex).toBe(
      (dialogHost as HTMLElement).style.zIndex,
    );
  });

  function pressEscapeOnFocus() {
    (document.activeElement ?? document.body).dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Escape',
        keyCode: 27,
        bubbles: true,
        cancelable: true,
      }),
    );
  }

  it('closes only the viewer on Escape and returns focus to the thumbnail in the dialog', () => {
    const { f, thumb } = openBoth();
    // Focus sits on the viewer's stage, as it does after opening.
    expect(document.activeElement?.classList).toContain(
      'andes-image-preview__stage',
    );
    pressEscapeOnFocus();
    f.detectChanges();
    expect(viewer()).toBeNull();
    expect(q('[data-test="dialog"]')).not.toBeNull();
    expect(f.componentInstance.overlay.isOpen()).toBe(true);
    expect(document.activeElement).toBe(thumb);
    pressEscapeOnFocus();
    f.detectChanges();
    expect(q('[data-test="dialog"]')).toBeNull();
  });

  it('closes only the viewer on Escape from a toolbar button too', () => {
    const { f } = openBoth();
    q<HTMLButtonElement>('.andes-image-preview__button')?.focus();
    pressEscapeOnFocus();
    f.detectChanges();
    expect(viewer()).toBeNull();
    expect(f.componentInstance.overlay.isOpen()).toBe(true);
  });

  it('keeps the dialog usable again once the viewer is gone', () => {
    const { f } = openBoth();
    expect(q('[data-test="dialog"]')?.closest('[inert]')).toBeTruthy();
    pressEscape();
    f.detectChanges();
    expect(q('[data-test="dialog"]')?.closest('[inert]')).toBeNull();
  });
});
