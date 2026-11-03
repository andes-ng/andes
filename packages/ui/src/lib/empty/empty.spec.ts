import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { Component, signal, TemplateRef, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { declaredValue } from '../../testing/computed-style';
import {
  AndesEmpty,
  AndesEmptyDescription,
  AndesEmptyImage,
  AndesEmptyPreset,
  AndesEmptySize,
} from './empty';
import type {
  AndesEmptyClassNamesInput,
  AndesEmptyHeading,
  AndesEmptyStylesInput,
} from './empty-types';

@Component({
  imports: [AndesEmpty],
  template: `
    <ng-template #customImage><i data-test="art">art</i></ng-template>
    <ng-template #customHeading><i data-test="head">Heading</i></ng-template>
    <ng-template #customText
      ><b data-test="rich">Nothing <em>here</em></b></ng-template
    >
    <andes-empty
      [preset]="preset()"
      [image]="image()"
      [imageAlt]="alt()"
      [imageStyle]="imageStyle()"
      [heading]="heading()"
      [description]="description()"
      [size]="size()"
      [classNames]="classNames()"
      [styles]="styles()"
      [announce]="announce()"
    >
      @if (withActions()) {
        <button type="button">Create invoice</button>
      }
    </andes-empty>
  `,
})
class HostComponent {
  readonly customImage =
    viewChild.required<TemplateRef<unknown>>('customImage');
  readonly customText = viewChild.required<TemplateRef<unknown>>('customText');
  readonly customHeading =
    viewChild.required<TemplateRef<unknown>>('customHeading');
  readonly heading = signal<AndesEmptyHeading | undefined>(undefined);
  readonly classNames = signal<AndesEmptyClassNamesInput | undefined>(
    undefined,
  );
  readonly styles = signal<AndesEmptyStylesInput | undefined>(undefined);
  readonly preset = signal<AndesEmptyPreset>('default');
  readonly image = signal<AndesEmptyImage | undefined>(undefined);
  readonly alt = signal('');
  readonly imageStyle = signal<Record<string, string> | null>(null);
  readonly description = signal<AndesEmptyDescription | undefined>(undefined);
  readonly size = signal<AndesEmptySize | undefined>(undefined);
  readonly announce = signal(false);
  readonly withActions = signal(false);
}

describe('AndesEmpty', () => {
  function create() {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const host = fixture.nativeElement.querySelector(
      'andes-empty',
    ) as HTMLElement;
    return { fixture, host };
  }

  const text = (host: HTMLElement) =>
    host.querySelector('[data-slot="empty-description"]')?.textContent?.trim();

  it('shows the default illustration and "No data" out of the box', () => {
    const { host } = create();

    expect(host.querySelector('svg.andes-empty__svg--default')).not.toBeNull();
    expect(text(host)).toBe('No data');
    expect(host.getAttribute('data-size')).toBe('default');
  });

  it('hides the built-in illustrations from assistive technology', () => {
    const { host } = create();

    expect(host.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('switches to the simple illustration', () => {
    const { fixture, host } = create();
    fixture.componentInstance.image.set('simple');
    fixture.detectChanges();

    expect(host.querySelector('svg.andes-empty__svg--simple')).not.toBeNull();
    expect(host.querySelector('svg.andes-empty__svg--default')).toBeNull();
  });

  it('renders a custom image URL with its alt text', () => {
    const { fixture, host } = create();
    fixture.componentInstance.image.set('/assets/empty-inbox.png');
    fixture.componentInstance.alt.set('An empty inbox');
    fixture.detectChanges();
    const img = host.querySelector('img') as HTMLImageElement;

    expect(img.getAttribute('src')).toBe('/assets/empty-inbox.png');
    expect(img.alt).toBe('An empty inbox');
    expect(host.querySelector('svg')).toBeNull();
  });

  it('renders a custom image template', () => {
    const { fixture, host } = create();
    fixture.componentInstance.image.set(
      fixture.componentInstance.customImage(),
    );
    fixture.detectChanges();

    expect(
      host.querySelector('[data-slot="empty-image"] [data-test="art"]'),
    ).not.toBeNull();
    expect(host.querySelector('svg')).toBeNull();
  });

  it.each([false, null] as const)(
    'hides the image when image is %s',
    (value) => {
      const { fixture, host } = create();
      fixture.componentInstance.image.set(value);
      fixture.detectChanges();

      expect(host.querySelector('[data-slot="empty-image"]')).toBeNull();
    },
  );

  it('applies imageStyle to the picture box', () => {
    const { fixture, host } = create();
    fixture.componentInstance.imageStyle.set({
      '--andes-empty-image-size': '120px',
    });
    fixture.detectChanges();
    const box = host.querySelector('[data-slot="empty-image"]') as HTMLElement;

    expect(box.style.getPropertyValue('--andes-empty-image-size')).toBe(
      '120px',
    );
  });

  it('shows custom description text or a template, and hides it with false', () => {
    const { fixture, host } = create();
    fixture.componentInstance.description.set('No invoices yet');
    fixture.detectChanges();
    expect(text(host)).toBe('No invoices yet');

    fixture.componentInstance.description.set(
      fixture.componentInstance.customText(),
    );
    fixture.detectChanges();
    expect(host.querySelector('[data-test="rich"]')).not.toBeNull();

    fixture.componentInstance.description.set(false);
    fixture.detectChanges();
    expect(host.querySelector('[data-slot="empty-description"]')).toBeNull();
  });

  it('projects actions below the message', () => {
    const { fixture, host } = create();
    const actions = host.querySelector(
      '[data-slot="empty-actions"]',
    ) as HTMLElement;
    expect(actions.children).toHaveLength(0);

    fixture.componentInstance.withActions.set(true);
    fixture.detectChanges();
    expect(actions.querySelector('button')?.textContent).toBe('Create invoice');
  });

  it('supports the small size', () => {
    const { fixture, host } = create();
    fixture.componentInstance.size.set('small');
    fixture.detectChanges();

    expect(host.getAttribute('data-size')).toBe('small');
  });

  it('is only a live region when asked to announce', () => {
    const { fixture, host } = create();
    expect(host.hasAttribute('role')).toBe(false);

    fixture.componentInstance.announce.set(true);
    fixture.detectChanges();
    expect(host.getAttribute('role')).toBe('status');
  });

  it('tells the stylesheet what kind of picture it holds', () => {
    const { fixture, host } = create();
    const kind = () => host.getAttribute('data-image');
    expect(kind()).toBe('default');

    fixture.componentInstance.image.set('simple');
    fixture.detectChanges();
    expect(kind()).toBe('simple');

    fixture.componentInstance.image.set('/assets/empty.png');
    fixture.detectChanges();
    expect(kind()).toBe('custom');

    fixture.componentInstance.image.set(
      fixture.componentInstance.customImage(),
    );
    fixture.detectChanges();
    expect(kind()).toBe('custom');

    fixture.componentInstance.image.set(false);
    fixture.detectChanges();
    expect(kind()).toBe('none');
  });

  describe('heading', () => {
    const heading = (host: HTMLElement) =>
      host.querySelector('[data-slot="empty-heading"]');

    it('is absent unless set', () => {
      const { host } = create();

      expect(heading(host)).toBeNull();
    });

    it('shows text or a template above the description', () => {
      const { fixture, host } = create();
      fixture.componentInstance.heading.set('No projects yet');
      fixture.detectChanges();
      expect(heading(host)?.textContent?.trim()).toBe('No projects yet');
      expect(
        heading(host)?.compareDocumentPosition(
          host.querySelector('[data-slot="empty-description"]') as Element,
        ),
      ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);

      fixture.componentInstance.heading.set(
        fixture.componentInstance.customHeading(),
      );
      fixture.detectChanges();
      expect(heading(host)?.querySelector('[data-test="head"]')).not.toBeNull();

      fixture.componentInstance.heading.set(false);
      fixture.detectChanges();
      expect(heading(host)).toBeNull();
    });
  });

  describe('classNames and styles', () => {
    const part = (host: HTMLElement, slot: string) =>
      host.querySelector<HTMLElement>(`[data-slot="${slot}"]`) as HTMLElement;

    it('adds a class to every part, keeping the ones it already has', () => {
      const { fixture, host } = create();
      fixture.componentInstance.heading.set('Title');
      fixture.componentInstance.withActions.set(true);
      fixture.componentInstance.classNames.set({
        root: 'my-root',
        image: 'my-image',
        heading: 'my-heading',
        description: 'my-description',
        footer: 'my-footer',
      });
      fixture.detectChanges();

      expect(host.classList.contains('my-root')).toBe(true);
      expect(part(host, 'empty-image').className).toBe(
        'andes-empty__image my-image',
      );
      expect(part(host, 'empty-heading').className).toBe(
        'andes-empty__heading my-heading',
      );
      expect(part(host, 'empty-description').className).toBe(
        'andes-empty__description my-description',
      );
      expect(part(host, 'empty-actions').className).toBe(
        'andes-empty__actions my-footer',
      );
    });

    it('applies inline styles to every part, camelCase names and numbers included', () => {
      const { fixture, host } = create();
      fixture.componentInstance.styles.set({
        root: { backgroundColor: 'red', borderRadius: '8px' },
        image: { filter: 'grayscale(100%)' },
        description: { color: 'blue', fontWeight: 700 },
        footer: { marginTop: '16px' },
      });
      fixture.detectChanges();

      expect(host.style.backgroundColor).toBe('red');
      expect(host.style.borderRadius).toBe('8px');
      expect(part(host, 'empty-image').style.filter).toBe('grayscale(100%)');
      expect(part(host, 'empty-description').style.color).toBe('blue');
      expect(part(host, 'empty-description').style.fontWeight).toBe('700');
      expect(part(host, 'empty-actions').style.marginTop).toBe('16px');
    });

    it('asks a function for the classes and styles with the resolved state', () => {
      const { fixture, host } = create();
      const info: unknown[] = [];
      fixture.componentInstance.preset.set('select');
      fixture.componentInstance.description.set('Pick one');
      fixture.componentInstance.classNames.set((state) => {
        info.push(state.props);
        return { root: state.props.description ? 'described' : 'bare' };
      });
      fixture.componentInstance.styles.set(({ props }) =>
        props.size === 'small' ? { description: { color: 'green' } } : {},
      );
      fixture.detectChanges();

      expect(info.at(-1)).toEqual({
        preset: 'select',
        image: 'simple',
        heading: false,
        description: 'Pick one',
        size: 'small',
      });
      expect(host.classList.contains('described')).toBe(true);
      expect(part(host, 'empty-description').style.color).toBe('green');

      fixture.componentInstance.description.set(false);
      fixture.detectChanges();
      expect(host.classList.contains('bare')).toBe(true);
    });

    it('lets styles.image win over imageStyle', () => {
      const { fixture, host } = create();
      fixture.componentInstance.imageStyle.set({
        height: '10px',
        'margin-top': '3px',
      });
      fixture.componentInstance.styles.set({ image: { height: '60px' } });
      fixture.detectChanges();
      const box = part(host, 'empty-image');

      expect(box.style.height).toBe('60px');
      expect(box.style.marginTop).toBe('3px');
    });
  });

  describe('presets', () => {
    it.each([
      ['select', 'simple', 'small', 'No data'],
      ['table', 'simple', 'default', 'No data'],
      ['list', 'simple', 'small', 'No items'],
      ['search', 'default', 'default', 'No results found'],
    ] as const)(
      '%s picks the %s illustration, %s size and "%s"',
      (preset, art, size, message) => {
        const { fixture, host } = create();
        fixture.componentInstance.preset.set(preset);
        fixture.detectChanges();

        expect(
          host.querySelector(`svg.andes-empty__svg--${art}`),
        ).not.toBeNull();
        expect(host.getAttribute('data-size')).toBe(size);
        expect(text(host)).toBe(message);
      },
    );

    it('lets explicit inputs win over the preset', () => {
      const { fixture, host } = create();
      fixture.componentInstance.preset.set('select');
      fixture.componentInstance.image.set('default');
      fixture.componentInstance.size.set('default');
      fixture.componentInstance.description.set('Pick a category first');
      fixture.detectChanges();

      expect(
        host.querySelector('svg.andes-empty__svg--default'),
      ).not.toBeNull();
      expect(host.getAttribute('data-size')).toBe('default');
      expect(text(host)).toBe('Pick a category first');
    });
  });

  describe('stylesheet contract', () => {
    const css = readFileSync(
      join(process.cwd(), 'packages/ui/src/lib/empty/empty.css'),
      'utf8',
    ).replace(/\s+/g, ' ');

    it('colours the illustrations from theme tokens only', () => {
      expect(css).toContain('var(--andes-color-foreground)');
      expect(css).toContain('var(--andes-color-background)');
      expect(css).not.toMatch(/#[0-9a-f]{3,8}\b/i);
      expect(css).not.toMatch(/rgba?\(/);
    });

    it('exposes the picture size and description colour as hooks', () => {
      expect(css).toContain('--andes-empty-image-size');
      expect(css).toContain('--andes-empty-color');
    });

    const raw = readFileSync(
      join(process.cwd(), 'packages/ui/src/lib/empty/empty.css'),
      'utf8',
    );
    const rule = (selector: string, property: string) =>
      declaredValue(raw, selector, property);

    it('sizes the picture box like Ant Design: 100px, 40px simple, 35px small', () => {
      const image = '.andes-empty__image';
      expect(rule(image, 'block-size')).toBe(
        'var(--andes-empty-image-size, 6.25rem)',
      );
      expect(rule(":host([data-image='simple']) " + image, 'block-size')).toBe(
        'var(--andes-empty-image-size, 2.5rem)',
      );
      expect(rule(":host([data-size='small']) " + image, 'block-size')).toBe(
        'var(--andes-empty-image-size, 2.1875rem)',
      );
    });

    it('keeps the gaps of Ant Design: 8px under the picture, 16px above the footer', () => {
      expect(rule('.andes-empty__image', 'margin-block-end')).toBe('0.5rem');
      expect(rule('.andes-empty__actions', 'margin-block-start')).toBe('1rem');
    });

    it('takes its margins from Ant Design: 8px sideways, 32px around the simple picture, 8px small', () => {
      expect(rule(':host', 'margin')).toBe(
        'var(--andes-empty-margin, 0 0.5rem)',
      );
      expect(rule(":host([data-image='simple'])", 'margin')).toBe(
        'var(--andes-empty-margin, 2rem 0.5rem)',
      );
      expect(rule(":host([data-size='small'])", 'margin')).toBe(
        'var(--andes-empty-margin, 0.5rem)',
      );
    });

    it('sets the illustration size and tones per theme through light-dark()', () => {
      expect(rule('.andes-empty__svg--default', 'inline-size')).toBe('11.5rem');
      expect(rule('.andes-empty__svg--simple', 'inline-size')).toBe('4rem');
      const tones = ['shadow', 'tray', 'sheet', 'detail', 'lip'].map((tone) =>
        rule(':host', `--andes-empty-tone-${tone}`),
      );
      for (const tone of tones) {
        expect(tone).toMatch(/^light-dark\( color-mix\(/);
      }
    });

    it('keeps the description at 14px / 22px in the muted colour', () => {
      expect(rule(':host', 'font-size')).toBe(
        'var(--andes-text-font-size, 0.875rem)',
      );
      expect(rule(':host', 'line-height')).toBe(
        'var(--andes-text-line-height, 1.375rem)',
      );
      expect(rule('.andes-empty__description', 'color')).toBe(
        'var(--andes-empty-color, var(--andes-color-muted-foreground))',
      );
    });

    it('collapses an empty actions area', () => {
      expect(css).toContain('.andes-empty__actions:empty { display: none; }');
    });
  });
});
