import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { AndesTable } from './table';
import { AndesTableBody } from './table-body';
import { AndesTableCaption } from './table-caption';
import { AndesTableCell } from './table-cell';
import {
  AndesTableColumnSettings,
  type AndesTablePinned,
} from './table-column-settings';
import { andesRowsToCsv } from './table-data';
import { AndesTableExpandAll, AndesTableExpandToggle } from './table-expand';
import { AndesTableFooter } from './table-footer';
import { AndesTableHead } from './table-head';
import { AndesTableHeader } from './table-header';
import { AndesTableRow } from './table-row';
import { AndesTableSelection } from './table-selection';
import type { AndesTableClassNamesInput } from './table-semantic';

@Component({
  imports: [
    AndesTable,
    AndesTableBody,
    AndesTableCaption,
    AndesTableCell,
    AndesTableExpandAll,
    AndesTableExpandToggle,
    AndesTableFooter,
    AndesTableHead,
    AndesTableHeader,
    AndesTableRow,
    AndesTableSelection,
  ],
  template: `<andes-table
    [striped]="true"
    [pinIcon]="true"
    [gridNavigation]="grid()"
    [rowCount]="rowCount()"
    [cards]="'md'"
    [classNames]="classNames()"
    [styles]="{ row: { opacity: 0.9 }, headerCell: { letterSpacing: 1 } }"
    [(selectedKeys)]="selected"
  >
    <caption andesTableCaption>
      People
    </caption>
    <thead andesTableHeader>
      <tr andesTableRow>
        <th andesTableHead fixed="start">
          <andes-table-expand-all [keys]="keys" />
        </th>
        <th andesTableHead sortKey="name">Name</th>
        <th andesTableHead sortKey="age">Age</th>
      </tr>
    </thead>
    <tbody andesTableBody>
      @for (key of keys; track key) {
        <tr andesTableRow [rowKey]="key">
          <td andesTableCell label="Toggle">
            <andes-table-selection />
            <andes-table-expand-toggle />
          </td>
          <td andesTableCell label="Name">Person {{ key }}</td>
          <td andesTableCell label="Age">3{{ key.length }}</td>
        </tr>
      }
    </tbody>
    <tfoot andesTableFooter>
      <tr andesTableRow>
        <td andesTableCell colspan="3">Total</td>
      </tr>
    </tfoot>
  </andes-table>`,
})
class Host {
  readonly keys = ['a', 'b', 'c'];
  readonly grid = signal(true);
  readonly rowCount = signal<number | undefined>(undefined);
  readonly selected = signal<readonly (string | number)[]>([]);
  readonly classNames = signal<AndesTableClassNamesInput>({
    row: 'my-row',
    summary: ['my-summary'],
    headerCell: 'my-head',
  });
}

describe('table parts, grid and extras', () => {
  async function render() {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  it('applies striped and card classes to the table', async () => {
    const root: HTMLElement = (await render()).nativeElement;
    const table = root.querySelector('table') as HTMLElement;

    expect(table.classList).toContain('andes-table--striped');
    expect(table.classList).toContain('andes-table--cards-md');
    expect(root.querySelector('td')?.getAttribute('data-label')).toBe('Toggle');
  });

  it('reaches each part with classNames and styles', async () => {
    const root: HTMLElement = (await render()).nativeElement;

    expect(root.querySelectorAll('tbody tr.my-row')).toHaveLength(3);
    expect(root.querySelector('tfoot td')?.classList).toContain('my-summary');
    expect(root.querySelector('thead th')?.classList).toContain('my-head');
    expect(root.querySelector('tbody tr')?.getAttribute('style')).toContain(
      'opacity: 0.9',
    );
    expect(root.querySelector('thead th')?.getAttribute('style')).toContain(
      'letter-spacing: 1px',
    );
  });

  it('computes classNames from the table state', async () => {
    const fixture = await render();
    fixture.componentInstance.classNames.set(({ props }) => ({
      root: props.selectedCount ? 'has-selection' : 'no-selection',
    }));
    fixture.detectChanges();
    const root: HTMLElement = fixture.nativeElement;
    const host = root.querySelector('andes-table') as HTMLElement;

    expect(host.classList).toContain('no-selection');
    fixture.componentInstance.selected.set(['a']);
    fixture.detectChanges();
    expect(host.classList).toContain('has-selection');
  });

  it('draws lucide sorter icons, one per state, and a pin on fixed headers', async () => {
    const fixture = await render();
    const root: HTMLElement = fixture.nativeElement;
    const names = Array.from(
      root.querySelectorAll('.andes-table__sorter ng-icon'),
    ).map((icon) => icon.getAttribute('name'));

    expect(names).toEqual(['lucideChevronsUpDown', 'lucideChevronsUpDown']);
    expect(root.querySelector('.andes-table__pin')?.getAttribute('name')).toBe(
      'lucidePin',
    );

    const sortable = root.querySelectorAll<HTMLElement>('th')[1];
    sortable.click();
    fixture.detectChanges();
    expect(sortable.getAttribute('aria-sort')).toBe('ascending');
    expect(
      sortable
        .querySelector('.andes-table__sorter ng-icon')
        ?.getAttribute('name'),
    ).toBe('lucideArrowUp');
    sortable.click();
    fixture.detectChanges();
    expect(
      sortable
        .querySelector('.andes-table__sorter ng-icon')
        ?.getAttribute('name'),
    ).toBe('lucideArrowDown');
  });

  it('expands and collapses every listed row from the header control', async () => {
    const fixture = await render();
    const root: HTMLElement = fixture.nativeElement;
    const button = root.querySelector(
      'andes-table-expand-all button',
    ) as HTMLElement;

    button.click();
    fixture.detectChanges();
    expect(button.getAttribute('aria-label')).toBe('Collapse all rows');
    expect(
      root.querySelectorAll(
        'andes-table-expand-toggle button[aria-expanded="true"]',
      ),
    ).toHaveLength(3);

    button.click();
    fixture.detectChanges();
    expect(button.getAttribute('aria-label')).toBe('Expand all rows');
  });

  it('makes the table a grid with one tab stop that arrow keys move', async () => {
    const fixture = await render();
    const root: HTMLElement = fixture.nativeElement;
    const table = root.querySelector('table') as HTMLElement;

    expect(table.getAttribute('role')).toBe('grid');
    expect(table.getAttribute('aria-colcount')).toBe('3');
    expect(table.getAttribute('aria-rowcount')).toBe('5');
    const stops = root.querySelectorAll('[data-andes-roving][tabindex="0"]');
    expect(stops).toHaveLength(1);

    const first = stops[0] as HTMLElement;
    first.focus();
    first.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }),
    );
    expect(document.activeElement).toBe(first.nextElementSibling);
    fixture.detectChanges();
    expect(
      root.querySelectorAll('[data-andes-roving][tabindex="0"]'),
    ).toHaveLength(1);

    (document.activeElement as HTMLElement).dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }),
    );
    expect(
      (document.activeElement?.parentElement as HTMLTableRowElement).rowIndex,
    ).toBe(2);
    expect(root.querySelector('tbody tr')?.getAttribute('aria-selected')).toBe(
      'false',
    );
  });

  it('toggles the row selection with Space on a cell', async () => {
    const fixture = await render();
    const root: HTMLElement = fixture.nativeElement;
    const cell = root.querySelector('tbody td') as HTMLElement;

    cell.focus();
    cell.dispatchEvent(
      new KeyboardEvent('keydown', { key: ' ', bubbles: true }),
    );
    fixture.detectChanges();
    expect(fixture.componentInstance.selected()).toEqual(['a']);
  });

  it('publishes the full row count of paged data', async () => {
    const fixture = await render();
    fixture.componentInstance.rowCount.set(200);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const table = (fixture.nativeElement as HTMLElement).querySelector(
      'table',
    ) as HTMLElement;

    expect(table.getAttribute('aria-rowcount')).toBe('202');
  });
});

describe('column settings pinning', () => {
  @Component({
    imports: [AndesTableColumnSettings],
    template: `<andes-table-column-settings
      pinnable
      [columns]="columns"
      [order]="['name', 'city']"
      [(pinned)]="pinned"
    />`,
  })
  class Pins {
    readonly columns = [
      { key: 'name', label: 'Name' },
      { key: 'city', label: 'City', pinnable: false },
    ];
    readonly pinned = signal<AndesTablePinned>({});
  }

  beforeEach(() => {
    Object.defineProperty(HTMLElement.prototype, 'showPopover', {
      configurable: true,
      value(this: HTMLElement) {
        this.style.display = 'block';
      },
    });
  });

  it('pins and unpins a column with a lucide pin', async () => {
    const fixture = TestBed.createComponent(Pins);
    fixture.detectChanges();
    const root: HTMLElement = fixture.nativeElement;
    (
      root.querySelector('.andes-table-column-settings__trigger') as HTMLElement
    ).click();
    fixture.detectChanges();

    const pins = root.querySelectorAll<HTMLElement>(
      '.andes-table-column-settings__pin',
    );
    expect(pins).toHaveLength(1);
    expect(pins[0].getAttribute('aria-label')).toBe('Pin Name');
    pins[0].click();
    fixture.detectChanges();

    expect(fixture.componentInstance.pinned()).toEqual({ name: 'start' });
    expect(pins[0].getAttribute('aria-pressed')).toBe('true');
    expect(pins[0].getAttribute('aria-label')).toBe('Unpin Name');
    expect(pins[0].querySelector('ng-icon')?.getAttribute('name')).toBe(
      'lucidePinOff',
    );
  });
});

describe('andesRowsToCsv', () => {
  it('quotes fields, doubles quotes and defuses formulas', () => {
    const csv = andesRowsToCsv(
      [{ name: 'Ana, "A"', note: '=SUM(1)', n: 3, d: null }],
      [
        { header: 'Name', value: (r) => r.name },
        { header: 'Note', value: (r) => r.note },
        { header: 'N', value: (r) => r.n },
        { header: 'D', value: (r) => r.d },
      ],
    );

    expect(csv).toBe('Name,Note,N,D\r\n"Ana, ""A""",\'=SUM(1),3,');
  });
});
