import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { AndesEmpty } from '../empty/empty';
import { AndesEmptyProvider, provideAndesEmpty } from '../empty/empty-config';
import { AndesTable } from './table';
import { AndesTableBody } from './table-body';
import { AndesTableCell } from './table-cell';
import { AndesTableEmpty } from './table-empty';
import { AndesTableHead } from './table-head';
import { AndesTableHeader } from './table-header';
import { AndesTableRow } from './table-row';

@Component({
  imports: [
    AndesEmpty,
    AndesEmptyProvider,
    AndesTable,
    AndesTableBody,
    AndesTableCell,
    AndesTableEmpty,
    AndesTableHead,
    AndesTableHeader,
    AndesTableRow,
  ],
  template: `
    <section [andesEmptyProvider]="config()">
      <andes-table>
        <thead andesTableHeader>
          <tr andesTableRow>
            <th andesTableHead>Name</th>
            <th andesTableHead>Age</th>
          </tr>
        </thead>
        <tbody andesTableBody>
          <tr andesTableRow>
            <td andesTableCell colspan="2">
              @switch (content()) {
                @case ('default') {
                  <andes-table-empty />
                }
                @case ('text') {
                  <andes-table-empty>Nothing to list</andes-table-empty>
                }
                @case ('empty') {
                  <andes-table-empty>
                    <andes-empty preset="table" description="Data Not Found" />
                  </andes-table-empty>
                }
              }
            </td>
          </tr>
        </tbody>
      </andes-table>
    </section>
  `,
})
class EmptyTableHost {
  readonly content = signal<'default' | 'text' | 'empty'>('default');
  readonly config = signal<{
    description?: string;
    image?: 'default' | 'simple';
  }>({});
}

describe('AndesTableEmpty', () => {
  function setup() {
    const fixture = TestBed.createComponent(EmptyTableHost);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    return {
      fixture,
      host: fixture.componentInstance,
      root,
      empty: () =>
        root.querySelector('andes-table-empty')?.querySelector('andes-empty') ??
        null,
    };
  }

  it('shows an andes-empty with the simple picture and "No data" by default', () => {
    const { empty, root } = setup();

    expect(empty()?.getAttribute('data-image')).toBe('simple');
    expect(empty()?.getAttribute('data-size')).toBe('default');
    expect(
      empty()?.querySelector('svg.andes-empty__svg--simple'),
    ).not.toBeNull();
    expect(empty()?.textContent?.trim()).toBe('No data');
    expect(
      root
        .querySelector('andes-table-empty')
        ?.classList.contains('andes-table-empty'),
    ).toBe(true);
  });

  it('sits in the single full-width cell of the body', () => {
    const { root } = setup();
    const cell = root.querySelector('andes-table-empty')?.closest('td');

    expect(cell?.getAttribute('colspan')).toBe('2');
    expect(cell?.closest('tbody')).not.toBeNull();
    expect(root.querySelectorAll('tbody td')).toHaveLength(1);
  });

  it('replaces the andes-empty with projected text', () => {
    const { fixture, host, root, empty } = setup();
    host.content.set('text');
    fixture.detectChanges();

    expect(empty()).toBeNull();
    expect(root.querySelector('andes-table-empty')?.textContent?.trim()).toBe(
      'Nothing to list',
    );
  });

  it('keeps a projected andes-empty with its own message', () => {
    const { fixture, host, empty } = setup();
    host.content.set('empty');
    fixture.detectChanges();

    expect(empty()?.textContent?.trim()).toBe('Data Not Found');
    expect(empty()?.getAttribute('data-image')).toBe('simple');
  });

  it('follows the empty state provider', () => {
    const { fixture, host, empty } = setup();
    host.config.set({ description: 'Data Not Found', image: 'default' });
    fixture.detectChanges();

    expect(empty()?.textContent?.trim()).toBe('Data Not Found');
    expect(empty()?.getAttribute('data-image')).toBe('default');
  });

  it('follows provideAndesEmpty() from the injector', () => {
    TestBed.configureTestingModule({
      providers: [provideAndesEmpty({ description: 'Sin datos' })],
    });
    const fixture = TestBed.createComponent(EmptyTableHost);
    fixture.detectChanges();
    const empty = (fixture.nativeElement as HTMLElement).querySelector(
      'andes-table-empty andes-empty',
    );

    // The provider directive in the host template spreads over the injector's config.
    expect(empty?.textContent?.trim()).toBe('Sin datos');
  });
});
