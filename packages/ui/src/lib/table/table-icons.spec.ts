import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { AndesTable } from './table';
import { AndesTableBody } from './table-body';
import { AndesTableCell } from './table-cell';
import {
  AndesTableColumnSettings,
  type AndesTableColumnSetting,
} from './table-column-settings';
import { AndesTableExpandToggle } from './table-expand';
import { AndesTableFilter, type AndesTableFilterOption } from './table-filter';
import { AndesTableTextFilter } from './table-filter-panels';
import { AndesTableHead } from './table-head';
import { AndesTableHeader } from './table-header';
import { AndesTableRow } from './table-row';
import { AndesTableSelectAll } from './table-selection';

/*
  The table draws lucide icons through `<ng-icon>` and registers them itself: this test bed
  never calls `provideIcons`, so an icon whose svg is rendered proves the registration is
  automatic. The sort carets are CSS shapes, not icons, and are not checked here.
*/

beforeEach(() => {
  // jsdom has no Popover API: show a popover the way a browser does once it is open.
  Object.defineProperty(HTMLElement.prototype, 'showPopover', {
    configurable: true,
    value(this: HTMLElement) {
      this.style.display = 'block';
    },
  });
});

/** The `name` of every `<ng-icon>` under `root` whose svg was drawn. */
function drawn(root: ParentNode): string[] {
  return Array.from(root.querySelectorAll('ng-icon'))
    .filter((icon) => icon.querySelector('svg') !== null)
    .map((icon) => icon.getAttribute('name') ?? '?');
}

/** Every `<ng-icon>` that drew nothing, as `name` (an unregistered icon). */
function blank(root: ParentNode): string[] {
  return Array.from(root.querySelectorAll('ng-icon'))
    .filter((icon) => icon.querySelector('svg') === null)
    .map((icon) => icon.getAttribute('name') ?? '?');
}

const OPTIONS: readonly AndesTableFilterOption[] = [
  {
    text: 'Group',
    value: 'group',
    children: [{ text: 'Leaf', value: 'leaf' }],
  },
];

const SETTINGS: readonly AndesTableColumnSetting[] = [
  { key: 'name', label: 'Name' },
  { key: 'city', label: 'City' },
];

@Component({
  imports: [
    AndesTable,
    AndesTableBody,
    AndesTableCell,
    AndesTableColumnSettings,
    AndesTableExpandToggle,
    AndesTableFilter,
    AndesTableHead,
    AndesTableHeader,
    AndesTableRow,
    AndesTableSelectAll,
    AndesTableTextFilter,
  ],
  template: `
    <andes-table>
      <andes-table-column-settings
        andesTableTop
        [columns]="settings"
        [order]="['name', 'city']"
      />
      <thead andesTableHeader>
        <tr andesTableRow>
          <th andesTableHead>
            <andes-table-select-all [selections]="['all', 'none']" />
          </th>
          <th andesTableHead sortKey="name">
            Name
            <andes-table-filter
              column="name"
              label="Filter name"
              mode="tree"
              searchable
              [options]="options"
            />
          </th>
          <th andesTableHead>
            City
            <andes-table-filter column="city" label="Filter city">
              <andes-table-text-filter [operators]="['contains', 'equals']" />
            </andes-table-filter>
          </th>
        </tr>
      </thead>
      <tbody andesTableBody>
        <tr andesTableRow rowKey="a">
          <td andesTableCell><andes-table-expand-toggle /></td>
          <td andesTableCell>Ana</td>
          <td andesTableCell>Lima</td>
        </tr>
      </tbody>
    </andes-table>
  `,
})
class Host {
  readonly options = OPTIONS;
  readonly settings = SETTINGS;
}

function click(element: Element | null): void {
  (element as HTMLElement).click();
}

describe('table icons', () => {
  async function render() {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  it('draws the column settings icon, the expand chevron and the filter funnels at rest', async () => {
    const fixture = await render();
    const root: HTMLElement = fixture.nativeElement;
    const icons = drawn(root);

    expect(icons).toContain('lucideColumns3');
    expect(icons).toContain('lucideChevronRight');
    expect(icons.filter((name) => name === 'lucideFunnel')).toHaveLength(2);
    expect(blank(root)).toEqual([]);
  });

  it('draws the select-all caret', async () => {
    const fixture = await render();
    const root: HTMLElement = fixture.nativeElement;

    expect(
      drawn(root.querySelector('andes-table-select-all') as Element),
    ).toEqual(['lucideChevronDown']);
  });

  it('draws the move arrows of the column settings panel', async () => {
    const fixture = await render();
    const root: HTMLElement = fixture.nativeElement;
    click(root.querySelector('.andes-table-column-settings__trigger'));
    fixture.detectChanges();

    const panel = root.querySelector('.andes-table-column-settings__panel');
    expect(panel).not.toBeNull();
    expect(drawn(panel as Element)).toEqual([
      'lucideChevronUp',
      'lucideChevronDown',
      'lucideChevronUp',
      'lucideChevronDown',
    ]);
    expect(blank(root)).toEqual([]);
  });

  it('draws the search glass and the tree switcher chevron in a filter panel', async () => {
    const fixture = await render();
    const root: HTMLElement = fixture.nativeElement;
    click(root.querySelector('.andes-table-filter__trigger'));
    fixture.detectChanges();

    const panel = root.querySelector('.andes-table-filter__panel');
    expect(panel).not.toBeNull();
    expect(drawn(panel as Element)).toEqual([
      'lucideSearch',
      'lucideChevronDown',
    ]);
    expect(blank(root)).toEqual([]);
  });

  it('draws the chevron of the text filter operator select', async () => {
    const fixture = await render();
    const root: HTMLElement = fixture.nativeElement;
    click(root.querySelectorAll('.andes-table-filter__trigger')[1]);
    fixture.detectChanges();

    expect(
      drawn(root.querySelector('andes-table-text-filter') as Element),
    ).toEqual(['lucideChevronDown']);
    expect(blank(root)).toEqual([]);
  });
});
