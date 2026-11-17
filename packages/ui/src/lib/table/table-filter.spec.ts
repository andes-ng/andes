import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { AndesTable, type AndesTableChange } from './table';
import { AndesTableBody } from './table-body';
import { AndesTableCell } from './table-cell';
import type { AndesFilterValue, AndesTableFilters } from './table-data';
import {
  AndesTableFilter,
  type AndesTableFilterMode,
  type AndesTableFilterOption,
  type AndesTableFilterSearchFn,
} from './table-filter';
import { AndesTableHead } from './table-head';
import { AndesTableHeader } from './table-header';
import { AndesTableRow } from './table-row';
import type { AndesSortState } from './table-sort';

/**
 * jsdom has no Popover API: `showPopover()` does not exist and its user-agent rule
 * `[popover]:not(:popover-open) { display: none }` keeps every popover hidden for good, and a
 * hidden element cannot take focus. Show a popover the way a browser does once it is open.
 */
beforeEach(() => {
  Object.defineProperty(HTMLElement.prototype, 'showPopover', {
    configurable: true,
    value(this: HTMLElement) {
      this.style.display = 'block';
    },
  });
});

/** Zero jsdom geometry makes CDK treat everything as untabbable, so a popover cannot focus. */
beforeAll(() => {
  for (const key of ['offsetWidth', 'offsetHeight'] as const) {
    Object.defineProperty(HTMLElement.prototype, key, {
      configurable: true,
      get: () => 1,
    });
  }
});

interface Person {
  readonly key: number;
  readonly name: string;
  readonly address: string;
}

// Sample people for the tree filter.
const PEOPLE: readonly Person[] = [
  { key: 1, name: 'John Brown', address: 'New York No. 1 Lake Park' },
  { key: 2, name: 'Jim Green', address: 'London No. 1 Lake Park' },
  { key: 3, name: 'Joe Black', address: 'Sydney No. 1 Lake Park' },
  { key: 4, name: 'Jim Red', address: 'London No. 2 Lake Park' },
];

const NAME_OPTIONS: readonly AndesTableFilterOption[] = [
  { text: 'Joe', value: 'Joe' },
  {
    text: 'Category 1',
    value: 'Category 1',
    children: [
      { text: 'Yellow', value: 'Yellow' },
      { text: 'Pink', value: 'Pink' },
    ],
  },
  {
    text: 'Category 2',
    value: 'Category 2',
    children: [
      { text: 'Green', value: 'Green' },
      { text: 'Black', value: 'Black' },
    ],
  },
];

const ADDRESS_OPTIONS: readonly AndesTableFilterOption[] = [
  { text: 'London', value: 'London' },
  { text: 'New York', value: 'New York' },
];

@Component({
  imports: [
    AndesTable,
    AndesTableBody,
    AndesTableCell,
    AndesTableFilter,
    AndesTableHead,
    AndesTableHeader,
    AndesTableRow,
  ],
  template: `<andes-table
      #table
      [(filters)]="filters"
      [(sort)]="sort"
      (tableChange)="changes.push($event)"
    >
      <thead andesTableHeader>
        <tr andesTableRow>
          <th andesTableHead sortKey="name">
            Name
            <andes-table-filter
              column="name"
              label="Filter name"
              [options]="nameOptions"
              [mode]="mode()"
              [multiple]="multiple()"
              [searchable]="searchable()"
              [predicate]="nameIncludes"
              (filterChange)="nameChanges.push($event)"
              (openChange)="openChanges.push($event)"
            />
          </th>
          <th andesTableHead>
            Address
            <andes-table-filter
              column="address"
              label="Filter address"
              [options]="addressOptions"
              [filteredValue]="addressValue()"
              [defaultFilteredValue]="addressDefault()"
              [resetToDefault]="resetToDefault()"
              [predicate]="addressStarts"
            />
          </th>
        </tr>
      </thead>
      <tbody andesTableBody>
        @for (person of table.filterRows(people); track person.key) {
          <tr andesTableRow [attr.data-key]="person.key">
            <td andesTableCell>{{ person.name }}</td>
            <td andesTableCell>{{ person.address }}</td>
          </tr>
        }
      </tbody>
    </andes-table>
    <button type="button" class="outside">Outside</button>`,
})
class AdvancedHost {
  readonly people = PEOPLE;
  readonly nameOptions = NAME_OPTIONS;
  readonly addressOptions = ADDRESS_OPTIONS;
  readonly filters = signal<AndesTableFilters>({});
  readonly sort = signal<AndesSortState | null>(null);
  readonly mode = signal<AndesTableFilterMode>('tree');
  readonly multiple = signal(true);
  readonly searchable = signal<boolean | AndesTableFilterSearchFn>(false);
  readonly addressValue = signal<
    readonly AndesFilterValue[] | null | undefined
  >(undefined);
  readonly addressDefault = signal<readonly AndesFilterValue[]>([]);
  readonly resetToDefault = signal(false);
  readonly changes: AndesTableChange[] = [];
  readonly nameChanges: (readonly AndesFilterValue[])[] = [];
  readonly openChanges: boolean[] = [];

  readonly nameIncludes = (value: AndesFilterValue, person: Person) =>
    person.name.includes(String(value));
  readonly addressStarts = (value: AndesFilterValue, person: Person) =>
    person.address.startsWith(String(value));
}

function setup(configure?: (host: AdvancedHost) => void) {
  const fixture = TestBed.createComponent(AdvancedHost);
  configure?.(fixture.componentInstance);
  fixture.detectChanges();
  const root = fixture.nativeElement as HTMLElement;
  const host = fixture.componentInstance;

  // The button is the library's; the panel is its popover, drawn in the overlay layer.
  const triggerHost = (index = 0) =>
    root.querySelectorAll('.andes-table-filter__trigger')[index] as HTMLElement;
  const trigger = (index = 0) =>
    triggerHost(index).querySelector('button') as HTMLButtonElement;
  const panel = () =>
    document.querySelector('.andes-table-filter__panel') as HTMLElement | null;
  const choices = () =>
    Array.from(
      panel()?.querySelectorAll('andes-checkbox, andes-radio') ?? [],
    ).filter(
      (element) => !element.classList.contains('andes-table-filter__check-all'),
    );
  const labelled = (text: string) => {
    const choice = Array.from(
      panel()?.querySelectorAll('andes-checkbox, andes-radio') ?? [],
    ).find((element) => element.textContent?.trim() === text);
    return choice?.querySelector('input') as HTMLInputElement;
  };
  const optionTexts = () =>
    choices().map((choice) => choice.textContent?.trim());
  const visibleKeys = () =>
    Array.from(root.querySelectorAll('tbody tr')).map((row) =>
      Number(row.getAttribute('data-key')),
    );
  // `andesTableAria` writes after the render that follows a change.
  const detect = () => {
    fixture.detectChanges();
    fixture.detectChanges();
  };
  const act = (element: Element) => {
    element.dispatchEvent(
      new MouseEvent('click', { bubbles: true, cancelable: true }),
    );
    detect();
  };
  const check = (input: HTMLInputElement) => {
    input.click();
    detect();
  };
  const button = (text: string) =>
    Array.from(panel()?.querySelectorAll('button') ?? []).find(
      (element) => element.textContent?.trim() === text,
    ) as HTMLButtonElement;
  const key = (element: Element, value: string) => {
    element.dispatchEvent(
      new KeyboardEvent('keydown', { key: value, bubbles: true }),
    );
    detect();
  };
  const search = (text: string) => {
    const input = document.querySelector(
      '.andes-table-filter__search input',
    ) as HTMLInputElement;
    input.value = text;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    detect();
  };
  detect();

  return {
    fixture,
    root,
    host,
    trigger,
    triggerHost,
    panel,
    labelled,
    optionTexts,
    visibleKeys,
    detect,
    act,
    check,
    button,
    key,
    search,
  };
}

describe('AndesTableFilter tree mode', () => {
  it('checks a whole subtree from its parent and derives parents from children', () => {
    const { host, trigger, labelled, act, check, button } = setup();

    act(trigger());
    check(labelled('Category 1'));

    expect(labelled('Yellow').checked).toBe(true);
    expect(labelled('Pink').checked).toBe(true);

    check(labelled('Pink'));
    expect(labelled('Category 1').checked).toBe(false);
    expect(labelled('Category 1').indeterminate).toBe(true);

    check(labelled('Green'));
    check(labelled('Black'));
    expect(labelled('Category 2').checked).toBe(true);

    act(button('OK'));
    // A fully checked parent's own value is included.
    expect([...host.filters()['name']].sort()).toEqual(
      ['Black', 'Category 2', 'Green', 'Yellow'].sort(),
    );
  });

  it('heads the tree with a tri-state "select all"', () => {
    const { trigger, labelled, act, check } = setup();

    act(trigger());
    const all = labelled('Select all items');
    expect(all.checked).toBe(false);

    check(labelled('Joe'));
    expect(all.indeterminate).toBe(true);

    check(all);
    expect(
      [
        'Joe',
        'Category 1',
        'Yellow',
        'Pink',
        'Category 2',
        'Green',
        'Black',
      ].every((text) => labelled(text).checked),
    ).toBe(true);

    check(all);
    expect(labelled('Joe').checked).toBe(false);
  });

  it('collapses and expands a node from its switcher and the arrow keys', () => {
    const { trigger, labelled, optionTexts, act, key } = setup();

    act(trigger());
    const switcher = document.querySelector(
      '.andes-table-filter__switcher button',
    ) as HTMLButtonElement;
    expect(switcher.getAttribute('aria-expanded')).toBe('true');

    act(switcher);
    expect(switcher.getAttribute('aria-expanded')).toBe('false');
    expect(optionTexts()).not.toContain('Yellow');

    key(labelled('Category 1'), 'ArrowRight');
    expect(optionTexts()).toContain('Yellow');
    key(labelled('Category 1'), 'ArrowLeft');
    expect(optionTexts()).not.toContain('Yellow');
  });

  it('selects a single node with radios when multiple is off', () => {
    const { host, trigger, labelled, act, check, button } = setup((h) =>
      h.multiple.set(false),
    );

    act(trigger());
    expect(document.querySelector('.andes-table-filter__check-all')).toBeNull();
    check(labelled('Category 1'));
    check(labelled('Pink'));
    act(button('OK'));

    expect(host.filters()).toEqual({ name: ['Pink'] });
  });

  it('keeps the parents of search matches visible', () => {
    const { trigger, optionTexts, act, search } = setup((h) =>
      h.searchable.set(true),
    );

    act(trigger());
    search('pin');

    expect(optionTexts()).toEqual(['Category 1', 'Pink']);
  });
});

describe('AndesTableFilter search and menu groups', () => {
  it('uses a custom search function', () => {
    const { trigger, optionTexts, act, search } = setup((h) => {
      h.mode.set('menu');
      h.searchable.set((query, option) =>
        String(option.value).startsWith(query),
      );
    });

    act(trigger());
    search('B');

    expect(optionTexts()).toEqual(['Black']);
  });

  it('shows nested options as labelled groups in menu mode', () => {
    const { trigger, optionTexts, act } = setup((h) => h.mode.set('menu'));

    act(trigger());

    const groups = Array.from(
      document.querySelectorAll('.andes-table-filter__group'),
    );
    expect(groups.map((group) => group.getAttribute('role'))).toEqual([
      'group',
      'group',
    ]);
    expect(
      groups[0]
        .querySelector('.andes-table-filter__group-title')
        ?.textContent?.trim(),
    ).toBe('Category 1');
    // Group titles are labels, not choices.
    expect(optionTexts()).toEqual(['Joe', 'Yellow', 'Pink', 'Green', 'Black']);
  });
});

describe('AndesTableFilter value control', () => {
  it('follows a controlled filteredValue and only proposes changes', () => {
    const {
      host,
      detect,
      trigger,
      triggerHost,
      labelled,
      visibleKeys,
      act,
      check,
      button,
    } = setup((h) => h.addressValue.set(['London']));

    expect(host.filters()).toEqual({ address: ['London'] });
    expect(visibleKeys()).toEqual([2, 4]);
    expect(triggerHost(1).getAttribute('data-active')).toBe('');

    act(trigger(1));
    check(labelled('New York'));
    act(button('OK'));

    // Not applied: the consumer owns the value...
    expect(host.filters()).toEqual({ address: ['London'] });
    // ...but is told what the user chose.
    expect(host.changes.at(-1)).toEqual(
      expect.objectContaining({
        action: 'filter',
        columnId: 'address',
        filters: { address: ['London', 'New York'] },
      }),
    );

    host.addressValue.set(['London', 'New York']);
    detect();
    expect(visibleKeys()).toEqual([1, 2, 4]);

    host.addressValue.set(null);
    detect();
    expect(host.filters()).toEqual({});
    expect(triggerHost(1).getAttribute('data-active')).toBeNull();
  });

  it('seeds defaultFilteredValue and resets back to it with resetToDefault', () => {
    const { host, trigger, labelled, visibleKeys, act, check, button } = setup(
      (h) => {
        h.addressDefault.set(['New York']);
        h.resetToDefault.set(true);
      },
    );

    expect(host.filters()).toEqual({ address: ['New York'] });
    expect(visibleKeys()).toEqual([1]);

    act(trigger(1));
    expect(button('Reset').disabled).toBe(true);
    check(labelled('London'));
    expect(button('Reset').disabled).toBe(false);

    act(button('Reset'));
    expect(labelled('London').checked).toBe(false);
    expect(labelled('New York').checked).toBe(true);
  });

  it('filters rows itself from each filter predicate', () => {
    const { host, detect, visibleKeys } = setup();

    host.filters.set({ name: ['Jim'], address: ['London'] });
    detect();
    expect(visibleKeys()).toEqual([2, 4]);

    host.filters.set({ name: ['Joe', 'John'] });
    detect();
    expect(visibleKeys()).toEqual([1, 3]);
  });
});

describe('AndesTableFilter templates and events', () => {
  it('renders a custom trigger icon with the filtered state', () => {
    @Component({
      imports: [AndesTable, AndesTableFilter, AndesTableHead, AndesTableHeader],
      template: `<andes-table [(filters)]="filters">
          <thead andesTableHeader>
            <tr>
              <th andesTableHead>
                Name
                <andes-table-filter column="name" [icon]="funnel" />
              </th>
            </tr>
          </thead>
        </andes-table>
        <ng-template #funnel let-filtered>
          <span class="custom-icon" [attr.data-filtered]="filtered"></span>
        </ng-template>`,
    })
    class IconHost {
      readonly filters = signal<AndesTableFilters>({});
    }

    const fixture = TestBed.createComponent(IconHost);
    fixture.detectChanges();
    const icon = () =>
      fixture.nativeElement.querySelector('.custom-icon') as HTMLElement;

    expect(
      fixture.nativeElement.querySelector('.andes-table-filter__icon'),
    ).toBeNull();
    expect(icon().getAttribute('data-filtered')).toBe('false');

    fixture.componentInstance.filters.set({ name: ['x'] });
    fixture.detectChanges();
    expect(icon().getAttribute('data-filtered')).toBe('true');
  });

  it('lets a custom panel apply without closing and clear without applying', () => {
    @Component({
      imports: [AndesTable, AndesTableFilter, AndesTableHead, AndesTableHeader],
      template: `<andes-table [(filters)]="filters">
          <thead andesTableHeader>
            <tr>
              <th andesTableHead>
                Name
                <andes-table-filter column="name" [panel]="custom" />
              </th>
            </tr>
          </thead>
        </andes-table>
        <ng-template
          #custom
          let-selected
          let-set="setSelected"
          let-confirm="confirm"
          let-clear="clear"
        >
          <input
            class="custom-input"
            [value]="selected[0] ?? ''"
            (input)="set([$any($event.target).value])"
          />
          <button
            type="button"
            class="custom-filter"
            (click)="confirm({ closeDropdown: false })"
          >
            Filter
          </button>
          <button
            type="button"
            class="custom-reset"
            (click)="clear({ confirm: false, closeDropdown: false })"
          >
            Reset
          </button>
        </ng-template>`,
    })
    class PanelHost {
      readonly filters = signal<AndesTableFilters>({});
    }

    const fixture = TestBed.createComponent(PanelHost);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const host = fixture.componentInstance;
    const inPanel = (selector: string) =>
      document.querySelector(selector) as HTMLElement;
    const panel = () => document.querySelector('.andes-table-filter__panel');

    (
      root.querySelector('.andes-table-filter__trigger button') as HTMLElement
    ).click();
    fixture.detectChanges();
    const input = inPanel('.custom-input') as HTMLInputElement;
    input.value = 'Jim';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    inPanel('.custom-filter').click();
    fixture.detectChanges();
    expect(host.filters()).toEqual({ name: ['Jim'] });
    expect(panel()).not.toBeNull();

    inPanel('.custom-reset').click();
    fixture.detectChanges();
    expect((inPanel('.custom-input') as HTMLInputElement).value).toBe('');
    expect(host.filters()).toEqual({ name: ['Jim'] });
    expect(panel()).not.toBeNull();
  });

  it('reports sorting and filtering through tableChange, and filter/open changes', () => {
    const { host, root, trigger, labelled, act, check, button } = setup((h) =>
      h.mode.set('menu'),
    );

    act(root.querySelector('th') as HTMLElement);
    expect(host.changes.at(-1)).toEqual({
      action: 'sort',
      columnId: 'name',
      filters: {},
      sort: { columnId: 'name', direction: 'asc' },
      sorts: [{ columnId: 'name', direction: 'asc' }],
    });

    act(trigger());
    check(labelled('Joe'));
    act(button('OK'));

    expect(host.nameChanges).toEqual([['Joe']]);
    expect(host.openChanges).toEqual([true, false]);
    expect(host.changes.at(-1)).toEqual(
      expect.objectContaining({
        action: 'filter',
        columnId: 'name',
        filters: { name: ['Joe'] },
      }),
    );

    // Confirming an unchanged filter reports nothing.
    const count = host.changes.length;
    act(trigger());
    act(button('OK'));
    expect(host.changes).toHaveLength(count);
    expect(host.nameChanges).toHaveLength(1);
  });

  it('moves between checkbox options with the arrow keys', () => {
    const { trigger, labelled, act, key } = setup((h) => h.mode.set('menu'));

    act(trigger());
    labelled('Joe').focus();
    key(labelled('Joe'), 'ArrowDown');
    expect(document.activeElement).toBe(labelled('Yellow'));
    key(labelled('Yellow'), 'ArrowUp');
    expect(document.activeElement).toBe(labelled('Joe'));
  });
});
