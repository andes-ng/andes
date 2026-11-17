import { Component, signal, TemplateRef, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { AndesEmpty } from './empty';
import {
  ANDES_EMPTY_TEXTS_EN,
  ANDES_EMPTY_TEXTS_ES,
  AndesEmptyProvider,
  provideAndesEmpty,
  type AndesEmptyConfig,
} from './empty-config';
import type { AndesEmptyImage } from './empty-types';

@Component({
  imports: [AndesEmpty, AndesEmptyProvider],
  template: `
    <ng-template #smile><i data-test="smile">:)</i></ng-template>
    <andes-empty data-test="outside" />
    <section [andesEmptyProvider]="config()">
      <andes-empty data-test="inside" [image]="image()" />
      <andes-empty data-test="table" preset="table" />
      <section [andesEmptyProvider]="nested()">
        <andes-empty data-test="nested" />
      </section>
    </section>
  `,
})
class ProviderHost {
  readonly smile = viewChild.required<TemplateRef<unknown>>('smile');
  readonly config = signal<AndesEmptyConfig>({});
  readonly nested = signal<AndesEmptyConfig>({});
  readonly image = signal<AndesEmptyImage | undefined>(undefined);
}

@Component({ imports: [AndesEmpty], template: `<andes-empty />` })
class PlainHost {}

describe('Empty configuration', () => {
  const text = (el: Element | null) =>
    el?.querySelector('[data-slot="empty-description"]')?.textContent?.trim();

  function provider() {
    const fixture = TestBed.createComponent(ProviderHost);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const by = (name: string) =>
      root.querySelector(`[data-test="${name}"]`) as HTMLElement;
    return { fixture, host: fixture.componentInstance, by };
  }

  it('changes nothing without a provider', () => {
    const fixture = TestBed.createComponent(PlainHost);
    fixture.detectChanges();
    const empty = fixture.nativeElement.querySelector('andes-empty');

    expect(empty.querySelector('svg.andes-empty__svg--default')).not.toBeNull();
    expect(text(empty)).toBe('No data');
  });

  describe('provideAndesEmpty()', () => {
    function plain(config: AndesEmptyConfig) {
      TestBed.configureTestingModule({
        providers: [provideAndesEmpty(config)],
      });
      const fixture = TestBed.createComponent(PlainHost);
      fixture.detectChanges();
      return fixture.nativeElement.querySelector('andes-empty') as HTMLElement;
    }

    it('sets the picture and the message of every empty state', () => {
      const empty = plain({ image: 'simple', description: 'Data Not Found' });

      expect(
        empty.querySelector('svg.andes-empty__svg--simple'),
      ).not.toBeNull();
      expect(empty.getAttribute('data-image')).toBe('simple');
      expect(text(empty)).toBe('Data Not Found');
    });

    it('can hide the picture for all of them', () => {
      const empty = plain({ image: false });

      expect(empty.querySelector('[data-slot="empty-image"]')).toBeNull();
    });

    it('translates the messages of the presets', () => {
      const empty = plain({ texts: ANDES_EMPTY_TEXTS_ES });

      expect(text(empty)).toBe('Sin datos');
    });

    it('styles the parts of every empty state', () => {
      const empty = plain({
        classNames: { root: 'shared-root' },
        styles: ({ props }) => ({
          description: { color: props.size === 'default' ? 'red' : 'blue' },
        }),
      });

      expect(empty.classList.contains('shared-root')).toBe(true);
      expect(
        empty.querySelector<HTMLElement>('[data-slot="empty-description"]')
          ?.style.color,
      ).toBe('red');
    });
  });

  describe('[andesEmptyProvider]', () => {
    it('reaches only what is inside it', () => {
      const { host, by, fixture } = provider();
      host.config.set({ description: 'Data Not Found' });
      fixture.detectChanges();

      expect(text(by('inside'))).toBe('Data Not Found');
      expect(text(by('outside'))).toBe('No data');
    });

    it('follows a config that changes at runtime', () => {
      const { host, by, fixture } = provider();
      host.config.set({ image: host.smile(), description: 'Data Not Found' });
      fixture.detectChanges();
      expect(by('inside').querySelector('[data-test="smile"]')).not.toBeNull();

      host.config.set({});
      fixture.detectChanges();
      expect(by('inside').querySelector('[data-test="smile"]')).toBeNull();
      expect(text(by('inside'))).toBe('No data');
    });

    it("is overridden by the empty state's own inputs", () => {
      const { host, by, fixture } = provider();
      host.config.set({ image: 'simple' });
      host.image.set('default');
      fixture.detectChanges();

      expect(
        by('inside').querySelector('svg.andes-empty__svg--default'),
      ).not.toBeNull();
    });

    it("beats a preset's own picture and message", () => {
      const { host, by, fixture } = provider();
      host.config.set({ image: 'default', description: 'Nothing' });
      fixture.detectChanges();

      expect(by('table').getAttribute('data-image')).toBe('default');
      expect(text(by('table'))).toBe('Nothing');
    });

    it('lets a nested provider replace the outer one field by field', () => {
      const { host, by, fixture } = provider();
      host.config.set({ image: 'simple', description: 'Outer' });
      host.nested.set({ description: 'Inner' });
      fixture.detectChanges();

      expect(text(by('nested'))).toBe('Inner');
      expect(by('nested').getAttribute('data-image')).toBe('simple');
    });
  });

  describe('texts', () => {
    it('has a message for every preset in English and Spanish', () => {
      const presets = ['default', 'select', 'table', 'list', 'search'];

      expect(Object.keys(ANDES_EMPTY_TEXTS_EN).sort()).toEqual(presets.sort());
      expect(Object.keys(ANDES_EMPTY_TEXTS_ES).sort()).toEqual(presets.sort());
    });

    it('uses the message of the preset in use, and description over it', () => {
      const { host, by, fixture } = provider();
      host.config.set({ texts: { table: 'Tabla vacía' } });
      fixture.detectChanges();
      expect(text(by('table'))).toBe('Tabla vacía');
      expect(text(by('inside'))).toBe('No data');

      host.config.set({ texts: { table: 'Tabla vacía' }, description: 'Ya' });
      fixture.detectChanges();
      expect(text(by('table'))).toBe('Ya');
    });
  });
});
