import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import {
  AndesPagination,
  type AndesPaginationChange,
  type AndesPaginationClassNames,
  type AndesPaginationLayout,
  type AndesPaginationShape,
  type AndesPaginationState,
  type AndesPaginationStyles,
  type AndesPaginationVariant,
} from './pagination';

/*
  The layouts and options added on top of the numbered pages: the table footer and the
  compact form, first / last and text buttons, the cursor mode, loading, links, the part
  classes and styles, the announcement and the keyboard.
*/

@Component({
  imports: [AndesPagination],
  template: `<andes-pagination
    aria-label="Rows"
    [(current)]="current"
    [(pageSize)]="pageSize"
    [total]="total()"
    [totalPages]="totalPages()"
    [layout]="layout()"
    [variant]="variant()"
    [shape]="shape()"
    [showFirstLast]="showFirstLast()"
    [showSizeChanger]="showSizeChanger()"
    [prevText]="prevText()"
    [nextText]="nextText()"
    [showNavIcons]="showNavIcons()"
    [hasNextPage]="hasNextPage()"
    [loading]="loading()"
    [linkFor]="linkFor()"
    [classNames]="classNames()"
    [styles]="styles()"
    [showQuickJumper]="showQuickJumper()"
    [jumperIcon]="jumperIcon()"
    [goButton]="goButton()"
    [defaultCurrent]="defaultCurrent()"
    (pageChange)="changes.push($event)"
  />`,
})
class Host {
  readonly current = signal(1);
  readonly pageSize = signal(10);
  readonly total = signal(95);
  readonly totalPages = signal<number | undefined>(undefined);
  readonly layout = signal<AndesPaginationLayout>('default');
  readonly variant = signal<AndesPaginationVariant>('default');
  readonly shape = signal<AndesPaginationShape>('default');
  readonly showFirstLast = signal<boolean | undefined>(undefined);
  readonly showSizeChanger = signal<boolean | undefined>(undefined);
  readonly prevText = signal('');
  readonly nextText = signal('');
  readonly showNavIcons = signal(true);
  readonly hasNextPage = signal<boolean | undefined>(undefined);
  readonly loading = signal(false);
  readonly linkFor = signal<((page: number) => string | null) | null>(null);
  readonly classNames = signal<
    | AndesPaginationClassNames
    | ((state: AndesPaginationState) => AndesPaginationClassNames)
    | null
  >(null);
  readonly styles = signal<
    | AndesPaginationStyles
    | ((state: AndesPaginationState) => AndesPaginationStyles)
    | null
  >(null);
  readonly showQuickJumper = signal(false);
  readonly jumperIcon = signal(false);
  readonly goButton = signal<boolean | string>(false);
  readonly defaultCurrent = signal<number | undefined>(undefined);
  readonly changes: AndesPaginationChange[] = [];
}

function setup(configure?: (host: Host) => void) {
  const fixture = TestBed.createComponent(Host);
  configure?.(fixture.componentInstance);
  fixture.detectChanges();
  const root: HTMLElement = fixture.nativeElement;
  const q = <T extends Element>(selector: string) =>
    root.querySelector<T>(selector);
  const all = <T extends Element>(selector: string) =>
    Array.from(root.querySelectorAll<T>(selector));
  const update = (fn: (host: Host) => void) => {
    fn(fixture.componentInstance);
    fixture.detectChanges();
  };
  return { fixture, host: fixture.componentInstance, root, q, all, update };
}

const names = (items: Element[]) =>
  items.map((item) => item.getAttribute('aria-label'));

function key(element: Element, name: string) {
  element.dispatchEvent(
    new KeyboardEvent('keydown', { key: name, bubbles: true }),
  );
}

describe('AndesPagination layouts and options', () => {
  describe('first and last', () => {
    it('adds the first and last buttons around Previous and Next', () => {
      const { all } = setup((h) => h.showFirstLast.set(true));

      expect(names(all('.andes-pagination__item')).slice(0, 2)).toEqual([
        'First page',
        'Previous page',
      ]);
      expect(names(all('.andes-pagination__item')).slice(-2)).toEqual([
        'Next page',
        'Last page',
      ]);
    });

    it('goes to the first and last page, and disables them at the ends', () => {
      const { fixture, host, q } = setup((h) => {
        h.showFirstLast.set(true);
        h.current.set(4);
      });

      q<HTMLButtonElement>('.andes-pagination__item--last')?.click();
      fixture.detectChanges();
      expect(host.current()).toBe(10);
      expect(
        q<HTMLButtonElement>('.andes-pagination__item--last')?.disabled,
      ).toBe(true);

      q<HTMLButtonElement>('.andes-pagination__item--first')?.click();
      fixture.detectChanges();
      expect(host.current()).toBe(1);
      expect(
        q<HTMLButtonElement>('.andes-pagination__item--first')?.disabled,
      ).toBe(true);
    });

    it('is off by default', () => {
      const { q } = setup();
      expect(q('.andes-pagination__item--first')).toBeNull();
    });
  });

  describe('Previous and Next text', () => {
    it('draws the text beside the chevron', () => {
      const { q } = setup((h) => {
        h.prevText.set('Previous');
        h.nextText.set('Next');
      });
      const prev = q<HTMLElement>('.andes-pagination__item--prev');
      const next = q<HTMLElement>('.andes-pagination__item--next');

      expect(prev?.textContent?.trim()).toBe('Previous');
      expect(next?.textContent?.trim()).toBe('Next');
      expect(prev?.querySelector('ng-icon')).not.toBeNull();
      expect(prev?.classList).toContain('andes-pagination__item--text');
      // The accessible name stays the localised label.
      expect(prev?.getAttribute('aria-label')).toBe('Previous page');
    });

    it('can drop the chevrons', () => {
      const { q } = setup((h) => {
        h.prevText.set('Previous');
        h.nextText.set('Next');
        h.showNavIcons.set(false);
      });

      expect(q('.andes-pagination__item--prev ng-icon')).toBeNull();
      expect(q('.andes-pagination__item--next ng-icon')).toBeNull();
    });
  });

  describe('table layout', () => {
    const table = (h: Host) => h.layout.set('table');

    it('draws rows per page, the range and four buttons, with no page numbers', () => {
      const { q, all } = setup(table);

      expect(q('.andes-pagination__rows-label')?.textContent).toBe(
        'Rows per page',
      );
      expect(q('andes-select')).not.toBeNull();
      expect(q('.andes-pagination__total')?.textContent?.trim()).toBe(
        '1-10 of 95',
      );
      expect(all('.andes-pagination__page')).toEqual([]);
      expect(names(all('.andes-pagination__item'))).toEqual([
        'First page',
        'Previous page',
        'Next page',
        'Last page',
      ]);
    });

    it('puts the rows-per-page control first in the reading order', () => {
      const { q } = setup(table);
      const rows = q('.andes-pagination__options') as Node;
      const list = q('.andes-pagination__list') as Node;

      expect(
        rows.compareDocumentPosition(list) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    });

    it('follows the page in the range, and the last page is shorter', () => {
      const { q, update } = setup(table);

      update((h) => h.current.set(10));
      expect(q('.andes-pagination__total')?.textContent?.trim()).toBe(
        '91-95 of 95',
      );
    });
  });

  describe('compact layout', () => {
    it('draws previous, "Page n of m" and next', () => {
      const { q, all, update } = setup((h) => h.layout.set('compact'));

      expect(q('.andes-pagination__status')?.textContent?.trim()).toBe(
        'Page 1 of 10',
      );
      expect(all('.andes-pagination__page')).toEqual([]);

      q<HTMLButtonElement>('.andes-pagination__item--next')?.click();
      update(() => undefined);
      expect(q('.andes-pagination__status')?.textContent?.trim()).toBe(
        'Page 2 of 10',
      );
    });
  });

  describe('cursor mode', () => {
    it('draws previous, the page and next, and follows hasNextPage', () => {
      const { fixture, host, q, update } = setup((h) => {
        h.hasNextPage.set(true);
        h.current.set(3);
      });

      expect(q('.andes-pagination__status')?.textContent?.trim()).toBe(
        'Page 3',
      );
      expect(
        q<HTMLButtonElement>('.andes-pagination__item--next')?.disabled,
      ).toBe(false);

      q<HTMLButtonElement>('.andes-pagination__item--next')?.click();
      fixture.detectChanges();
      expect(host.current()).toBe(4);

      update((h) => h.hasNextPage.set(false));
      expect(
        q<HTMLButtonElement>('.andes-pagination__item--next')?.disabled,
      ).toBe(true);
      expect(
        q<HTMLButtonElement>('.andes-pagination__item--prev')?.disabled,
      ).toBe(false);
    });

    it('ignores total and totalPages', () => {
      const { q } = setup((h) => {
        h.hasNextPage.set(false);
        h.totalPages.set(40);
      });

      expect(q('.andes-pagination__page')).toBeNull();
      expect(
        q<HTMLButtonElement>('.andes-pagination__item--next')?.disabled,
      ).toBe(true);
    });
  });

  describe('loading', () => {
    it('shows a spinner on the current page, marks the control busy and holds page changes', () => {
      const { fixture, host, q } = setup((h) => {
        h.current.set(2);
        h.loading.set(true);
      });

      expect(q('nav')?.getAttribute('aria-busy')).toBe('true');
      expect(
        q('.andes-pagination__page--active ng-icon')?.getAttribute('name'),
      ).toBe('lucideLoaderCircle');
      q<HTMLButtonElement>('.andes-pagination__item--next')?.click();
      fixture.detectChanges();
      expect(host.current()).toBe(2);
      expect(host.changes).toEqual([]);
    });
  });

  describe('links', () => {
    it('draws the pages as links, and a plain click still changes the page', () => {
      const { fixture, host, q, all } = setup((h) => {
        h.linkFor.set((page) => `/results?page=${page}`);
        h.current.set(3);
      });
      const links = all<HTMLAnchorElement>('a.andes-pagination__page');

      expect(links.length).toBeGreaterThan(0);
      expect(
        links
          .find((link) => link.textContent?.trim() === '4')
          ?.getAttribute('href'),
      ).toBe('/results?page=4');
      expect(q('a.andes-pagination__item--next')?.getAttribute('href')).toBe(
        '/results?page=4',
      );

      const click = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
      });
      q('a.andes-pagination__item--next')?.dispatchEvent(click);
      fixture.detectChanges();
      expect(click.defaultPrevented).toBe(true);
      expect(host.current()).toBe(4);
    });

    it('leaves a modifier click to the browser', () => {
      const { fixture, host, q } = setup((h) => {
        h.linkFor.set((page) => `#page-${page}`);
        h.current.set(3);
      });
      const click = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        ctrlKey: true,
      });
      q('a.andes-pagination__item--next')?.dispatchEvent(click);
      fixture.detectChanges();

      expect(click.defaultPrevented).toBe(false);
      expect(host.current()).toBe(3);
    });

    it('keeps the current page marked and a disabled edge as a button', () => {
      const { q } = setup((h) => h.linkFor.set((page) => `#${page}`));

      expect(q('a[aria-current="page"]')?.textContent?.trim()).toBe('1');
      expect(q('button.andes-pagination__item--prev')).not.toBeNull();
      expect(q('a.andes-pagination__item--prev')).toBeNull();
    });
  });

  describe('variant and shape', () => {
    it('exposes them for the styles', () => {
      const { q } = setup((h) => {
        h.variant.set('outline');
        h.shape.set('pill');
      });

      expect(q('nav')?.getAttribute('data-variant')).toBe('outline');
      expect(q('nav')?.getAttribute('data-shape')).toBe('pill');
    });
  });

  describe('classNames and styles', () => {
    it('adds the classes to each part', () => {
      const { q } = setup((h) => {
        h.showQuickJumper.set(true);
        h.showSizeChanger.set(true);
        h.current.set(5);
        h.classNames.set({
          root: 'c-root',
          item: 'c-item',
          activeItem: 'c-active',
          prev: 'c-prev',
          next: 'c-next',
          jump: 'c-jump',
          options: 'c-options',
          sizeChanger: 'c-size',
          jumper: 'c-jumper',
        });
      });

      expect(q('nav')?.classList).toContain('c-root');
      expect(q('.andes-pagination__page--active')?.classList).toContain(
        'c-item',
      );
      expect(q('.andes-pagination__page--active')?.classList).toContain(
        'c-active',
      );
      expect(q('.andes-pagination__item--prev')?.classList).toContain('c-prev');
      expect(q('.andes-pagination__item--next')?.classList).toContain('c-next');
      expect(q('.andes-pagination__jumper')?.classList).toContain('c-jump');
      expect(q('.andes-pagination__options')?.classList).toContain('c-options');
      expect(q('.andes-pagination__size-changer')?.classList).toContain(
        'c-size',
      );
      expect(q('.andes-pagination__jump')?.classList).toContain('c-jumper');
      // The built-in class stays.
      expect(q('nav')?.classList).toContain('andes-pagination');
    });

    it('takes a function of the state', () => {
      const { q, update } = setup((h) => {
        h.classNames.set((state) => ({
          root: state.current > 5 ? 'late' : 'early',
        }));
      });
      expect(q('nav')?.classList).toContain('early');

      update((h) => h.current.set(8));
      expect(q('nav')?.classList).toContain('late');
      expect(q('nav')?.classList).not.toContain('early');
    });

    it('applies inline styles and custom properties', () => {
      const { q } = setup((h) => {
        h.styles.set({
          root: { '--andes-pagination-gap': '1rem' },
          total: { color: 'red' },
          activeItem: { 'font-weight': 800 },
        });
        h.layout.set('table');
      });

      expect(
        q<HTMLElement>('nav')?.style.getPropertyValue('--andes-pagination-gap'),
      ).toBe('1rem');
      expect(q<HTMLElement>('.andes-pagination__total')?.style.color).toBe(
        'red',
      );
    });
  });

  describe('announcement', () => {
    it('says the page and the range, and follows the page', () => {
      const { q, update } = setup();
      const live = () => q('.andes-pagination__announcer');

      expect(live()?.getAttribute('aria-live')).toBe('polite');
      expect(live()?.textContent?.trim()).toBe('Page 1 of 10. 1-10 of 95');

      update((h) => h.current.set(10));
      expect(live()?.textContent?.trim()).toBe('Page 10 of 10. 91-95 of 95');
    });

    it('says only the page when there is no total', () => {
      const { q } = setup((h) => {
        h.total.set(0);
        h.totalPages.set(7);
      });

      expect(q('.andes-pagination__announcer')?.textContent?.trim()).toBe(
        'Page 1 of 7',
      );
    });
  });

  describe('keyboard', () => {
    it('moves focus with the arrow keys, Home and End', () => {
      const { fixture, q, all } = setup((h) => h.current.set(5));
      const items = all<HTMLElement>(
        '.andes-pagination__list .andes-pagination__item',
      );
      const active = q<HTMLElement>(
        '.andes-pagination__page--active',
      ) as HTMLElement;
      active.focus();

      key(active, 'ArrowRight');
      expect(document.activeElement).toBe(items[items.indexOf(active) + 1]);

      key(document.activeElement as Element, 'End');
      expect(document.activeElement).toBe(items[items.length - 1]);

      key(document.activeElement as Element, 'Home');
      expect(document.activeElement).toBe(items[0]);
      fixture.detectChanges();
    });

    it('skips disabled controls', () => {
      const { all } = setup();
      const items = all<HTMLElement>(
        '.andes-pagination__list .andes-pagination__item',
      );
      // On page 1 Previous is disabled, so Home lands on page 1.
      items[1]?.focus();
      key(items[1] as Element, 'Home');

      expect(document.activeElement).toBe(items[1]);
    });
  });

  describe('quick jumper', () => {
    it('marks text that is not a page number, until it is edited', () => {
      const { fixture, q } = setup((h) => h.showQuickJumper.set(true));
      const field = q<HTMLInputElement>(
        '.andes-pagination__jump-input',
      ) as HTMLInputElement;

      field.value = 'abc';
      key(field, 'Enter');
      fixture.detectChanges();
      expect(field.getAttribute('aria-invalid')).toBe('true');
      expect(field.value).toBe('abc');

      field.value = '4';
      field.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      expect(field.getAttribute('aria-invalid')).toBeNull();
    });

    it('draws an arrow in the go button when asked', () => {
      const { q } = setup((h) => {
        h.showQuickJumper.set(true);
        h.goButton.set(true);
        h.jumperIcon.set(true);
      });

      expect(q('.andes-pagination__go-icon')?.getAttribute('name')).toBe(
        'lucideArrowRight',
      );
    });
  });

  describe('default values', () => {
    it('starts on defaultCurrent', () => {
      const { host } = setup((h) => h.defaultCurrent.set(6));
      expect(host.current()).toBe(6);
    });
  });
});
