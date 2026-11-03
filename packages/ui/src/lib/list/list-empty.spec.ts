import { Component, signal, TemplateRef, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { AndesEmptyProvider, provideAndesEmpty } from '../empty/empty-config';
import { AndesList } from './list';

@Component({
  imports: [AndesList, AndesEmptyProvider],
  template: `
    <ng-template #slot><b data-test="slot">Nothing here</b></ng-template>
    <section [andesEmptyProvider]="config()">
      <andes-list
        label="People"
        [dataSource]="data()"
        [notFoundContent]="notFound()"
      />
    </section>
  `,
})
class EmptyListHost {
  readonly slot = viewChild.required<TemplateRef<unknown>>('slot');
  readonly data = signal<readonly string[] | null>([]);
  readonly notFound = signal<string | TemplateRef<unknown> | null | undefined>(
    undefined,
  );
  readonly config = signal<{
    description?: string;
    image?: 'default' | 'simple';
  }>({});
}

describe('AndesList not-found content', () => {
  function setup() {
    const fixture = TestBed.createComponent(EmptyListHost);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    return {
      fixture,
      host: fixture.componentInstance,
      area: () => root.querySelector<HTMLElement>('[data-slot="list-empty"]'),
    };
  }

  it('shows an andes-empty with the simple picture at the default size', () => {
    const { area } = setup();
    const empty = area()?.querySelector('andes-empty');

    expect(empty?.getAttribute('data-image')).toBe('simple');
    expect(empty?.getAttribute('data-size')).toBe('default');
    expect(empty?.querySelector('svg.andes-empty__svg--simple')).not.toBeNull();
    expect(empty?.textContent?.trim()).toBe('No items');
  });

  it('shows it for a missing data source as well', () => {
    const { fixture, host, area } = setup();
    host.data.set(null);
    fixture.detectChanges();

    expect(area()?.querySelector('andes-empty')).not.toBeNull();
  });

  it('follows the empty state provider', () => {
    const { fixture, host, area } = setup();
    host.config.set({ description: 'Data Not Found', image: 'default' });
    fixture.detectChanges();
    const empty = area()?.querySelector('andes-empty');

    expect(empty?.textContent?.trim()).toBe('Data Not Found');
    expect(empty?.getAttribute('data-image')).toBe('default');
  });

  it('follows provideAndesEmpty() from the injector', () => {
    TestBed.configureTestingModule({
      providers: [provideAndesEmpty({ description: 'Sin datos' })],
    });
    const fixture = TestBed.createComponent(EmptyListHost);
    fixture.detectChanges();

    expect(
      (fixture.nativeElement as HTMLElement)
        .querySelector('[data-slot="list-empty"] andes-empty')
        ?.textContent?.trim(),
    ).toBe('Sin datos');
  });

  it('keeps plain text as plain text', () => {
    const { fixture, host, area } = setup();
    host.notFound.set('Nobody matches your search');
    fixture.detectChanges();

    expect(area()?.querySelector('andes-empty')).toBeNull();
    expect(area()?.textContent?.trim()).toBe('Nobody matches your search');
  });

  it('renders a template instead', () => {
    const { fixture, host, area } = setup();
    host.notFound.set(host.slot());
    fixture.detectChanges();

    expect(area()?.querySelector('[data-test="slot"]')).not.toBeNull();
    expect(area()?.querySelector('andes-empty')).toBeNull();
  });

  it('shows no empty state for null', () => {
    const { fixture, host, area } = setup();
    host.notFound.set(null);
    fixture.detectChanges();

    expect(area()).toBeNull();
  });

  it('shows no empty state while there are rows', () => {
    const { fixture, host, area } = setup();
    host.data.set(['Ada']);
    fixture.detectChanges();

    expect(area()).toBeNull();
  });
});
