import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { AndesTable, type AndesTableLoading } from './table';
import { AndesTableBody } from './table-body';
import { AndesTableCell } from './table-cell';
import { AndesTableHead } from './table-head';
import { AndesTableHeader } from './table-header';
import { AndesTableRow } from './table-row';

/*
 * The loading layout contract: the header is never the place of the loading state; the body is.
 * `skeleton` draws as many placeholder rows as asked, as wide as the header; `overlay` keeps the
 * rows and draws the spinner over the body; the table says it is busy and announces the label.
 */

@Component({
  imports: [
    AndesTable,
    AndesTableBody,
    AndesTableCell,
    AndesTableHead,
    AndesTableHeader,
    AndesTableRow,
  ],
  template: `<andes-table
    [loading]="loading()"
    loadingLabel="Loading people"
    loadingTip="Please wait"
  >
    <thead andesTableHeader>
      <tr andesTableRow>
        <th andesTableHead>Name</th>
        <th andesTableHead>Role</th>
        <th andesTableHead>City</th>
      </tr>
    </thead>
    <tbody andesTableBody>
      @for (row of rows(); track row) {
        <tr andesTableRow>
          <td andesTableCell>{{ row }}</td>
          <td andesTableCell>Admin</td>
          <td andesTableCell>Lima</td>
        </tr>
      }
    </tbody>
  </andes-table>`,
})
class Host {
  readonly loading = signal<boolean | AndesTableLoading>(false);
  readonly rows = signal<readonly string[]>(['Ana', 'Bruno']);
}

describe('table loading layout', () => {
  function setup(loading: boolean | AndesTableLoading, rows?: string[]) {
    const fixture = TestBed.createComponent(Host);
    if (rows) {
      fixture.componentInstance.rows.set(rows);
    }
    fixture.componentInstance.loading.set(loading);
    fixture.detectChanges();
    return fixture;
  }
  const root = (f: { nativeElement: unknown }) =>
    f.nativeElement as HTMLElement;

  it('marks the table busy, announces the label and never draws anything in the header', () => {
    const el = root(setup(true));

    expect(el.querySelector('table')?.getAttribute('aria-busy')).toBe('true');
    expect(
      el.querySelector('.andes-table__sr-only[role="status"]')?.textContent,
    ).toContain('Loading people');
    expect(el.querySelector('thead .andes-table__spinner')).toBeNull();
    expect(el.querySelector('thead andes-skeleton-text')).toBeNull();
    expect(el.querySelectorAll('thead th')).toHaveLength(3);
    expect(
      el.querySelector('.andes-table__loading-tip')?.textContent,
    ).toContain('Please wait');
  });

  it('keeps the rows and puts the spinner over the body in the overlay type', () => {
    const el = root(setup(true));
    const overlay = el.querySelector('.andes-table__loading') as HTMLElement;

    expect(overlay.querySelector('.andes-table__spinner')).not.toBeNull();
    expect(el.querySelector('table')?.classList).toContain(
      'andes-table--loading-overlay',
    );
    expect(
      el.querySelectorAll('tbody tr:not(.andes-table__skeleton tr)').length,
    ).toBe(2);
    expect(overlay.closest('thead')).toBeNull();
  });

  it('draws as many skeleton rows as asked, one cell per header cell', () => {
    const el = root(setup({ type: 'skeleton', rows: 6 }, []));
    const rows = el.querySelectorAll('.andes-table__skeleton tr');

    expect(rows).toHaveLength(6);
    expect(rows[0].querySelectorAll('td')).toHaveLength(3);
    expect(rows[0].querySelectorAll('andes-skeleton-text')).toHaveLength(3);
    expect(el.querySelector('.andes-table__loading')).toBeNull();
    expect(el.querySelector('table')?.classList).toContain(
      'andes-table--loading-skeleton',
    );
  });

  it('shows only the spinner in the spinner type, and nothing once loaded', () => {
    const fixture = setup({ type: 'spinner' });
    const el = root(fixture);

    expect(el.querySelector('.andes-table__loading')).not.toBeNull();
    expect(el.querySelector('.andes-table__skeleton')).toBeNull();
    fixture.componentInstance.loading.set(false);
    fixture.detectChanges();
    expect(el.querySelector('.andes-table__loading')).toBeNull();
    expect(el.querySelector('table')?.getAttribute('aria-busy')).toBeNull();
  });
});
