import { Component, signal, TemplateRef, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { AndesEmptyProvider, provideAndesEmpty } from '../empty/empty-config';
import {
  AndesTransfer,
  type AndesTransferEmptyContext,
  type AndesTransferItem,
} from './transfer';

const ITEMS: AndesTransferItem[] = [
  { key: 'a', title: 'Alpha' },
  { key: 'b', title: 'Bravo' },
];

@Component({
  imports: [AndesTransfer, AndesEmptyProvider],
  template: `
    <ng-template #slot let-direction="direction" let-search="search">
      <b data-test="slot">nothing in {{ direction }} ({{ search }})</b>
    </ng-template>
    <section [andesEmptyProvider]="config()">
      <andes-transfer
        aria-label="Empty"
        [dataSource]="dataSource()"
        [targetKeys]="[]"
        [showSearch]="true"
        [emptyText]="emptyText()"
        [noMatchText]="noMatchText()"
      />
    </section>
  `,
})
class EmptyTransferHost {
  readonly slot =
    viewChild.required<TemplateRef<AndesTransferEmptyContext>>('slot');
  readonly dataSource = signal<readonly AndesTransferItem[]>([]);
  readonly emptyText = signal<
    string | TemplateRef<AndesTransferEmptyContext> | undefined
  >(undefined);
  readonly noMatchText = signal('No results');
  readonly config = signal<{
    description?: string;
    image?: 'default' | 'simple';
  }>({});
}

describe('AndesTransfer empty state', () => {
  function setup() {
    const fixture = TestBed.createComponent(EmptyTransferHost);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    return {
      fixture,
      host: fixture.componentInstance,
      root,
      list: (direction: 'source' | 'target') =>
        root.querySelector<HTMLElement>(`[data-list="${direction}"]`),
      empty: (direction: 'source' | 'target' = 'target') =>
        root
          .querySelector(`[data-list="${direction}"]`)
          ?.querySelector('andes-empty') ?? null,
    };
  }

  it('shows an andes-empty with the small simple picture and "No data" by default', () => {
    const { empty } = setup();

    expect(empty('source')?.getAttribute('data-image')).toBe('simple');
    expect(empty('source')?.getAttribute('data-size')).toBe('small');
    expect(empty('source')?.textContent?.trim()).toBe('No data');
    expect(empty('target')?.textContent?.trim()).toBe('No data');
  });

  it('keeps the empty area in the list body', () => {
    const { list } = setup();
    const area = list('target')?.querySelector('[data-slot="transfer-empty"]');

    expect(area?.querySelector('andes-empty')).not.toBeNull();
    expect(list('target')?.querySelector('[role="listbox"]')).toBeNull();
  });

  it('takes the text of emptyText', () => {
    const { fixture, host, empty } = setup();
    host.emptyText.set('Nothing chosen yet');
    fixture.detectChanges();

    expect(empty('source')?.textContent?.trim()).toBe('Nothing chosen yet');
    expect(empty('source')?.getAttribute('data-image')).toBe('simple');
  });

  it('takes a template as emptyText, with the list in its context', () => {
    const { fixture, host, empty } = setup();
    host.emptyText.set(host.slot());
    fixture.detectChanges();

    expect(
      empty('source')?.querySelector('[data-test="slot"]')?.textContent,
    ).toBe('nothing in source ()');
    expect(
      empty('target')?.querySelector('[data-test="slot"]')?.textContent,
    ).toBe('nothing in target ()');
    expect(empty('source')?.getAttribute('data-image')).toBe('simple');
  });

  it('follows the empty state provider', () => {
    const { fixture, host, empty } = setup();
    host.config.set({ description: 'Data Not Found', image: 'default' });
    fixture.detectChanges();

    expect(empty('source')?.textContent?.trim()).toBe('Data Not Found');
    expect(empty('source')?.getAttribute('data-image')).toBe('default');
  });

  it('lets emptyText win over the provider', () => {
    const { fixture, host, empty } = setup();
    host.config.set({ description: 'Data Not Found' });
    host.emptyText.set('Pick something');
    fixture.detectChanges();

    expect(empty('source')?.textContent?.trim()).toBe('Pick something');
  });

  it('follows provideAndesEmpty() from the injector', () => {
    TestBed.configureTestingModule({
      providers: [provideAndesEmpty({ description: 'Sin datos' })],
    });
    const fixture = TestBed.createComponent(EmptyTransferHost);
    fixture.detectChanges();

    expect(
      (fixture.nativeElement as HTMLElement)
        .querySelector('andes-empty')
        ?.textContent?.trim(),
    ).toBe('Sin datos');
  });

  it('explains a search with no match in an andes-empty too', () => {
    const { fixture, host, list, empty } = setup();
    host.dataSource.set(ITEMS);
    fixture.detectChanges();
    const input = list('source')?.querySelector<HTMLInputElement>(
      '.andes-transfer__search-input',
    ) as HTMLInputElement;
    input.value = 'zzz';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();

    expect(empty('source')?.textContent?.trim()).toBe('No results');
    expect(empty('source')?.getAttribute('data-image')).toBe('simple');

    host.noMatchText.set('Nothing matches');
    fixture.detectChanges();

    expect(empty('source')?.textContent?.trim()).toBe('Nothing matches');
  });
});
