import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AndesCascader, type AndesCascaderModel } from './cascader';
import type {
  AndesCascaderLoadData,
  AndesCascaderOption,
  AndesCascaderSearch,
} from './cascader-types';

const PLACES: AndesCascaderOption[] = [
  {
    value: 'lima',
    label: 'Lima',
    children: [
      {
        value: 'lima-province',
        label: 'Lima',
        children: [
          { value: 'miraflores', label: 'Miraflores' },
          { value: 'surco', label: 'Santiago de Surco' },
        ],
      },
      { value: 'huaral', label: 'Huaral', children: [] },
    ],
  },
  {
    value: 'cusco',
    label: 'Cusco',
    children: [
      { value: 'wanchaq', label: 'Wanchaq' },
      { value: 'san-blas', label: 'San Blas' },
    ],
  },
  { value: 'callao', label: 'Callao' },
  { value: 'tumbes', label: 'Tumbes', disabled: true },
];

@Component({
  imports: [AndesCascader],
  template: `
    <ng-template #header let-search let-close="close">
      <span class="header-text">Header {{ search }}</span>
      <button type="button" class="header-close" (click)="close()">Done</button>
    </ng-template>
    <ng-template #footer let-search let-close="close">
      <input class="footer-input" type="text" aria-label="New place" />
      <button type="button" class="footer-add" (click)="close()">Add</button>
    </ng-template>
    <ng-template #tag let-tag let-onClose="onClose">
      <span class="custom-tag" [attr.data-closable]="tag.closable">
        {{ tag.labels.join('>') }}
        <button type="button" class="custom-tag-close" (click)="onClose()">
          drop
        </button>
      </span>
    </ng-template>
    <ng-template #option let-option let-path="path" let-search="searchValue">
      <span class="custom-option" [attr.data-search]="search"
        >{{ path.length }}:{{ option.label }}</span
      >
    </ng-template>
    <ng-template #prefixIcon><i class="my-prefix">P</i></ng-template>
    <ng-template #suffix><i class="my-suffix">S</i></ng-template>
    <ng-template #clearGlyph><i class="my-clear">C</i></ng-template>
    <ng-template #removeGlyph><i class="my-remove">R</i></ng-template>
    <ng-template #loadingGlyph><i class="my-loading">L</i></ng-template>

    <andes-cascader
      aria-label="Place"
      [options]="options()"
      [(value)]="value"
      [(open)]="open"
      [(searchValue)]="searchValue"
      [multiple]="multiple()"
      [showSearch]="showSearch()"
      [expandTrigger]="expandTrigger()"
      [loading]="loading()"
      [loadData]="loadData()"
      [allowClear]="allowClear()"
      [defaultOpen]="defaultOpen()"
      [autoFocus]="autoFocus()"
      [autoClearSearchValue]="autoClear()"
      [required]="required()"
      [name]="name()"
      [maxTagCount]="maxTagCount()"
      [panelHeader]="withPanel() ? header : undefined"
      [panelFooter]="withPanel() ? footer : undefined"
      [tagTemplate]="withTemplates() ? tag : undefined"
      [optionTemplate]="withTemplates() ? option : undefined"
      [prefix]="withIcons() ? prefixIcon : undefined"
      [suffixIcon]="
        suffixMode() === 'custom'
          ? suffix
          : suffixMode() === 'none'
            ? null
            : undefined
      "
      [clearIcon]="withIcons() ? clearGlyph : undefined"
      [removeIcon]="withIcons() ? removeGlyph : undefined"
      [loadingIcon]="withIcons() ? loadingGlyph : undefined"
      (focused)="events.push('focused')"
      (blurred)="events.push('blurred')"
      (panelScroll)="scrolls.push($event)"
    />
    <button type="button" class="elsewhere">elsewhere</button>
  `,
})
class FeaturesHost {
  readonly options = signal<readonly AndesCascaderOption[]>(PLACES);
  readonly value = signal<AndesCascaderModel>(undefined);
  readonly open = signal(false);
  readonly searchValue = signal('');
  readonly multiple = signal(false);
  readonly showSearch = signal<boolean | AndesCascaderSearch>(false);
  readonly expandTrigger = signal<'click' | 'hover'>('click');
  readonly loading = signal(false);
  readonly allowClear = signal(false);
  readonly defaultOpen = signal(false);
  readonly autoFocus = signal(false);
  readonly autoClear = signal(true);
  readonly required = signal(false);
  readonly name = signal<string | undefined>(undefined);
  readonly maxTagCount = signal<number | undefined>(undefined);
  readonly withPanel = signal(false);
  readonly withTemplates = signal(false);
  readonly withIcons = signal(false);
  readonly suffixMode = signal<'default' | 'custom' | 'none'>('default');
  readonly loadData = signal<AndesCascaderLoadData | undefined>(undefined);
  readonly events: string[] = [];
  readonly scrolls: Event[] = [];
}

/** jsdom has no `PointerEvent` constructor; a mouse event with the field set will do. */
function pointerMove(
  target: Element,
  x: number,
  y: number,
  pointerType = 'mouse',
): void {
  const event = new MouseEvent('pointermove', {
    bubbles: true,
    screenX: x,
    screenY: y,
  });
  Object.defineProperty(event, 'pointerType', { get: () => pointerType });
  target.dispatchEvent(event);
}

const KEY_CODES: Record<string, number> = { Escape: 27, Tab: 9, Enter: 13 };

function key(target: Element, name: string, init: KeyboardEventInit = {}) {
  const event = new KeyboardEvent('keydown', {
    key: name,
    bubbles: true,
    cancelable: true,
    ...init,
  });
  Object.defineProperty(event, 'keyCode', { get: () => KEY_CODES[name] ?? 0 });
  target.dispatchEvent(event);
  return event;
}

/** A click as a pointer sends it: with a `detail`, and a screen position. */
function pointerClick(target: Element, x = 0, y = 0): void {
  target.dispatchEvent(
    new MouseEvent('click', {
      bubbles: true,
      detail: 1,
      screenX: x,
      screenY: y,
    }),
  );
}

describe('AndesCascader features', () => {
  let fixture: ComponentFixture<FeaturesHost>;

  function setup(configure?: (host: FeaturesHost) => void) {
    fixture = TestBed.createComponent(FeaturesHost);
    configure?.(fixture.componentInstance);
    fixture.detectChanges();
    const host = fixture.componentInstance;
    const root = fixture.nativeElement as HTMLElement;
    const detect = () => fixture.detectChanges();
    const combobox = () =>
      root.querySelector<HTMLElement>('[role="combobox"]') as HTMLElement;
    const box = () =>
      root.querySelector<HTMLElement>(
        '[data-slot="cascader-trigger"]',
      ) as HTMLElement;
    const panel = () =>
      document.querySelector<HTMLElement>('[data-slot="cascader-panel"]');
    const item = (text: string) =>
      Array.from(
        document.querySelectorAll<HTMLElement>(
          '[data-slot="cascader-option"], [data-slot="cascader-result"]',
        ),
      ).find(
        (el) => el.textContent?.replace(/\s+/g, ' ').trim() === text,
      ) as HTMLElement;
    const marked = (attribute: string) =>
      Array.from(document.querySelectorAll(`[${attribute}]`)).map((el) =>
        el.textContent?.replace(/\s+/g, ' ').trim(),
      );
    const openWithPointer = (x = 5, y = 5) => {
      combobox().focus();
      pointerClick(box(), x, y);
      detect();
    };
    const type = (text: string) => {
      const input = combobox() as HTMLInputElement;
      input.focus();
      input.value = text;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      detect();
    };
    return {
      host,
      root,
      detect,
      combobox,
      box,
      panel,
      item,
      marked,
      openWithPointer,
      type,
    };
  }

  describe('pointer highlight', () => {
    it('shows no highlight when the panel opens under a pointer at rest', () => {
      const { openWithPointer, marked, item } = setup();
      openWithPointer(25, 30);

      // What a browser may send as the panel appears under a pointer that never moved.
      pointerMove(item('Lima'), 25, 30);
      fixture.detectChanges();

      expect(marked('data-highlighted')).toEqual([]);
      expect(marked('data-active')).toEqual([]);
    });

    it('highlights the option a real pointer move lands on, leaving the keyboard cursor alone', () => {
      const { openWithPointer, marked, item, detect } = setup();
      openWithPointer(25, 30);

      pointerMove(item('Cusco'), 40, 60);
      detect();

      expect(marked('data-highlighted')).toEqual(['Cusco']);
      expect(marked('data-active')).toEqual([]);

      pointerMove(item('Callao'), 41, 90);
      detect();
      expect(marked('data-highlighted')).toEqual(['Callao']);
    });

    it('does not highlight a disabled option, nor on touch input', () => {
      const { openWithPointer, marked, item, detect } = setup();
      openWithPointer();

      pointerMove(item('Tumbes'), 40, 60);
      detect();
      expect(marked('data-highlighted')).toEqual([]);

      pointerMove(item('Cusco'), 50, 70, 'touch');
      detect();
      expect(marked('data-highlighted')).toEqual([]);
    });

    it('ignores a repeated pointermove at the same spot', () => {
      const { openWithPointer, marked, item, detect } = setup();
      openWithPointer();
      pointerMove(item('Lima'), 50, 50);
      detect();
      expect(marked('data-highlighted')).toEqual(['Lima']);

      // A column scrolling under a pointer at rest may send another one from the same spot.
      pointerMove(item('Cusco'), 50, 50);
      detect();

      expect(marked('data-highlighted')).toEqual(['Lima']);
    });

    it('lets the keyboard cursor take over from the pointer', () => {
      const { openWithPointer, marked, item, detect, combobox } = setup();
      openWithPointer();
      pointerMove(item('Callao'), 40, 60);
      detect();
      expect(marked('data-highlighted')).toEqual(['Callao']);

      key(combobox(), 'ArrowDown');
      detect();

      expect(marked('data-highlighted')).toEqual([]);
      expect(marked('data-active')).toEqual(['Lima']);
    });

    it('clears when the pointer leaves the panel and when it closes', () => {
      const { openWithPointer, marked, item, detect, panel, combobox } =
        setup();
      openWithPointer();
      pointerMove(item('Cusco'), 40, 60);
      detect();
      expect(marked('data-highlighted')).toEqual(['Cusco']);

      panel()?.dispatchEvent(new MouseEvent('pointerleave'));
      detect();
      expect(marked('data-highlighted')).toEqual([]);

      pointerMove(item('Cusco'), 45, 65);
      detect();
      key(combobox(), 'Escape');
      detect();
      pointerClick(combobox(), 5, 5);
      detect();
      expect(marked('data-highlighted')).toEqual([]);
    });

    it('does not take a click without a pointer for a pointer open', () => {
      const { combobox, marked, item, detect } = setup();
      combobox().focus();
      // `detail` 0: a keyboard or assistive technology activating the field.
      combobox().click();
      detect();

      pointerMove(item('Lima'), 0, 0);
      detect();

      expect(marked('data-highlighted')).toEqual(['Lima']);
    });

    it('still expands on mouseenter with expandTrigger hover, without highlighting', () => {
      const { openWithPointer, marked, item, detect } = setup((h) =>
        h.expandTrigger.set('hover'),
      );
      openWithPointer();

      item('Cusco').dispatchEvent(new MouseEvent('mouseenter'));
      detect();

      expect(document.querySelectorAll('.andes-cascader__column').length).toBe(
        2,
      );
      expect(marked('data-highlighted')).toEqual([]);
      expect(marked('data-active')).toEqual(['Cusco']);
    });

    it('highlights a search result by pointer and carries the cursor there', () => {
      const { type, marked, detect } = setup((h) => h.showSearch.set(true));
      type('a');
      expect(marked('data-highlighted')).toEqual([]);
      const results = Array.from(
        document.querySelectorAll<HTMLElement>('[data-slot="cascader-result"]'),
      );

      pointerMove(results[2], 30, 40);
      detect();

      expect(marked('data-highlighted')).toEqual([
        results[2].textContent?.trim(),
      ]);
      expect(marked('data-active')).toEqual([results[2].textContent?.trim()]);
    });
  });

  describe('right-to-left', () => {
    it('gives the panel the field direction, so :dir() reaches its chevrons', () => {
      const { openWithPointer, panel, root } = setup();
      root.setAttribute('dir', 'rtl');

      openWithPointer();

      expect(panel()?.getAttribute('dir')).toBe('rtl');
      expect(
        panel()?.querySelector('.andes-cascader__expand')?.matches(':dir(rtl)'),
      ).toBe(true);
    });

    it('marks the panel ltr otherwise', () => {
      const { openWithPointer, panel } = setup();
      openWithPointer();
      expect(panel()?.getAttribute('dir')).toBe('ltr');
    });
  });

  describe('accessibility', () => {
    it('points aria-controls at the tree, or at the panel when there is none', () => {
      const { openWithPointer, combobox, host, detect } = setup();
      openWithPointer();
      const tree = document.querySelector('[role="tree"]');
      expect(combobox().getAttribute('aria-controls')).toBe(tree?.id);

      host.options.set([]);
      detect();
      expect(document.querySelector('[role="tree"]')).toBeNull();
      expect(combobox().getAttribute('aria-controls')).toBe(
        document.querySelector('[data-slot="cascader-panel"]')?.id,
      );
    });

    it('marks the combobox required', () => {
      const { combobox, host, detect } = setup();
      expect(combobox().hasAttribute('aria-required')).toBe(false);
      host.required.set(true);
      detect();
      expect(combobox().getAttribute('aria-required')).toBe('true');
    });
  });

  describe('opening and focus', () => {
    it('opens once on render with defaultOpen, highlighting nothing', async () => {
      const { panel, marked, host } = setup((h) => h.defaultOpen.set(true));
      await fixture.whenStable();
      fixture.detectChanges();

      expect(panel()).not.toBeNull();
      expect(host.open()).toBe(true);
      expect(marked('data-active')).toEqual([]);
      expect(marked('data-highlighted')).toEqual([]);
    });

    it('lets the user close a defaultOpen panel for good', async () => {
      const { panel, combobox, detect } = setup((h) => h.defaultOpen.set(true));
      await fixture.whenStable();
      detect();

      key(combobox(), 'Escape');
      detect();

      expect(panel()).toBeNull();
    });

    it('focuses the combobox on render with autoFocus', async () => {
      const { combobox } = setup((h) => h.autoFocus.set(true));
      await fixture.whenStable();

      expect(document.activeElement).toBe(combobox());
    });

    it('emits focused once when focus enters, and blurred when it leaves', async () => {
      const { combobox, host, root } = setup();

      combobox().focus();
      combobox().focus();
      expect(host.events).toEqual(['focused']);

      (root.querySelector('.elsewhere') as HTMLElement).focus();
      await new Promise((resolve) => setTimeout(resolve));
      expect(host.events).toEqual(['focused', 'blurred']);
    });

    it('does not report a blur while focus moves into the panel footer', async () => {
      const { openWithPointer, host, root } = setup((h) =>
        h.withPanel.set(true),
      );
      openWithPointer();
      expect(host.events).toEqual(['focused']);

      (document.querySelector('.footer-input') as HTMLElement).focus();
      await new Promise((resolve) => setTimeout(resolve));
      expect(host.events).toEqual(['focused']);

      (root.querySelector('.elsewhere') as HTMLElement).focus();
      await new Promise((resolve) => setTimeout(resolve));
      expect(host.events).toEqual(['focused', 'blurred']);
    });
  });

  describe('search value', () => {
    it('shows a bound searchValue and reports what the user types', () => {
      const { combobox, host, detect, type } = setup((h) =>
        h.showSearch.set(true),
      );
      host.searchValue.set('cus');
      detect();
      expect((combobox() as HTMLInputElement).value).toBe('cus');

      type('lim');
      expect(host.searchValue()).toBe('lim');
    });

    it('empties the search text when the panel closes', () => {
      const { type, host, combobox, detect } = setup((h) =>
        h.showSearch.set(true),
      );
      type('lim');
      key(combobox(), 'Escape');
      detect();

      expect(host.searchValue()).toBe('');
    });

    it('clears the text after a pick in multiple mode, unless told not to', () => {
      const { type, host, item, detect } = setup((h) => {
        h.showSearch.set(true);
        h.multiple.set(true);
      });
      type('wanchaq');
      item('Cusco / Wanchaq').click();
      detect();
      expect(host.searchValue()).toBe('');

      host.autoClear.set(false);
      detect();
      type('san blas');
      item('Cusco / San Blas').click();
      detect();
      expect(host.searchValue()).toBe('san blas');
      expect(
        document.querySelectorAll('[data-slot="cascader-result"]').length,
      ).toBe(1);
    });
  });

  describe('search results', () => {
    it('renders the optionTemplate for results, with the path and the search text', () => {
      const { type } = setup((h) => {
        h.showSearch.set(true);
        h.withTemplates.set(true);
      });
      type('wanch');

      const rendered = Array.from(
        document.querySelectorAll<HTMLElement>(
          '[data-slot="cascader-result"] .custom-option',
        ),
      );
      expect(rendered.map((el) => el.textContent)).toEqual(['2:Wanchaq']);
      expect(rendered[0].getAttribute('data-search')).toBe('wanch');
      expect(
        document.querySelector('[data-slot="cascader-result"] mark'),
      ).toBeNull();
    });

    it('hands the column options their path and no search text', () => {
      const { openWithPointer } = setup((h) => h.withTemplates.set(true));
      openWithPointer();

      const first = document.querySelector<HTMLElement>(
        '[data-slot="cascader-option"] .custom-option',
      );
      expect(first?.textContent).toBe('1:Lima');
      expect(first?.getAttribute('data-search')).toBeNull();
    });

    it('keeps the highlighted path when no template is given', () => {
      const { type } = setup((h) => h.showSearch.set(true));
      type('wanch');
      expect(
        document.querySelector('[data-slot="cascader-result"] mark')
          ?.textContent,
      ).toBe('Wanch');
    });
  });

  describe('form value', () => {
    it('posts one hidden input per selected path with the last value, when named', () => {
      const { root, host, detect } = setup((h) => {
        h.multiple.set(true);
        h.name.set('place');
        h.value.set([['cusco', 'wanchaq'], ['callao']]);
      });
      const inputs = () =>
        Array.from(
          root.querySelectorAll<HTMLInputElement>(
            '[data-slot="cascader-form-value"]',
          ),
        );
      expect(inputs().map((input) => [input.name, input.value])).toEqual([
        ['place', 'wanchaq'],
        ['place', 'callao'],
      ]);

      host.name.set(undefined);
      detect();
      expect(inputs()).toHaveLength(0);
    });

    it('does not leave the name on the host element', () => {
      const { root } = setup((h) => h.name.set('place'));
      expect(root.querySelector('andes-cascader')?.hasAttribute('name')).toBe(
        false,
      );
    });
  });

  describe('panel header and footer', () => {
    it('renders both around the columns, handing out the search text and close()', () => {
      const { openWithPointer, panel, detect } = setup((h) =>
        h.withPanel.set(true),
      );
      openWithPointer();

      const header = panel()?.querySelector(
        '[data-slot="cascader-panel-header"]',
      );
      const footer = panel()?.querySelector(
        '[data-slot="cascader-panel-footer"]',
      );
      const columns = panel()?.querySelector('[data-slot="cascader-columns"]');
      expect(header?.querySelector('.header-text')?.textContent).toBe(
        'Header ',
      );
      expect(
        (header as Node).compareDocumentPosition(columns as Node) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
      expect(
        (footer as Node).compareDocumentPosition(columns as Node) &
          Node.DOCUMENT_POSITION_PRECEDING,
      ).toBeTruthy();

      (footer?.querySelector('.footer-add') as HTMLElement).click();
      detect();
      expect(panel()).toBeNull();
    });

    it('passes the search text to the header', () => {
      const { type, panel } = setup((h) => {
        h.showSearch.set(true);
        h.withPanel.set(true);
      });
      type('cus');
      expect(panel()?.querySelector('.header-text')?.textContent).toBe(
        'Header cus',
      );
    });

    it('lets a press on a footer text field take focus, and keeps every other press off it', () => {
      const { openWithPointer, panel } = setup((h) => h.withPanel.set(true));
      openWithPointer();

      const onField = new MouseEvent('mousedown', {
        bubbles: true,
        cancelable: true,
      });
      panel()?.querySelector('.footer-input')?.dispatchEvent(onField);
      expect(onField.defaultPrevented).toBe(false);

      const onText = new MouseEvent('mousedown', {
        bubbles: true,
        cancelable: true,
      });
      panel()?.querySelector('.header-text')?.dispatchEvent(onText);
      expect(onText.defaultPrevented).toBe(true);
    });

    it('does not read keys typed in the footer as option navigation', () => {
      const { openWithPointer, panel, marked, detect } = setup((h) =>
        h.withPanel.set(true),
      );
      openWithPointer();

      key(panel()?.querySelector('.footer-input') as Element, 'ArrowDown');
      detect();

      expect(marked('data-active')).toEqual([]);
    });

    it('hands Tab off the last footer control on to the field', () => {
      const { openWithPointer, panel, combobox, detect } = setup((h) =>
        h.withPanel.set(true),
      );
      openWithPointer();
      const add = panel()?.querySelector('.footer-add') as HTMLElement;
      add.focus();

      key(add, 'Tab');
      detect();

      expect(panel()).toBeNull();
      expect(document.activeElement).toBe(combobox());
    });

    it('leaves Tab alone between controls of the panel', () => {
      const { openWithPointer, panel } = setup((h) => h.withPanel.set(true));
      openWithPointer();
      const input = panel()?.querySelector('.footer-input') as HTMLElement;
      input.focus();

      const event = key(input, 'Tab');

      expect(panel()).not.toBeNull();
      expect(event.defaultPrevented).toBe(false);
    });
  });

  describe('panel scroll', () => {
    it('emits when a column scrolls, with the column as the target', () => {
      const { openWithPointer, host, detect } = setup();
      openWithPointer();

      const column = document.querySelector('.andes-cascader__column');
      column?.dispatchEvent(new Event('scroll'));
      detect();

      expect(host.scrolls).toHaveLength(1);
      expect(host.scrolls[0].target).toBe(column);
    });

    it('emits for the list of search results too', () => {
      const { type, host } = setup((h) => h.showSearch.set(true));
      type('a');

      document
        .querySelector('.andes-cascader__results')
        ?.dispatchEvent(new Event('scroll'));

      expect(host.scrolls).toHaveLength(1);
    });
  });

  describe('templates', () => {
    it('renders a tagTemplate per path, and onClose removes it', () => {
      const { root, host, detect } = setup((h) => {
        h.multiple.set(true);
        h.withTemplates.set(true);
        h.value.set([['cusco', 'wanchaq'], ['callao']]);
      });
      const tags = () =>
        Array.from(root.querySelectorAll('.custom-tag')).map((el) =>
          el.textContent?.replace(/\s+/g, ' ').trim(),
        );
      expect(tags()).toEqual(['Cusco>Wanchaq drop', 'Callao drop']);
      expect(root.querySelector('[data-slot="cascader-tag"]')).toBeNull();
      expect(
        root.querySelector('.custom-tag')?.getAttribute('data-closable'),
      ).toBe('true');

      (root.querySelector('.custom-tag-close') as HTMLElement).click();
      detect();

      expect(host.value()).toEqual([['callao']]);
      expect(tags()).toEqual(['Callao drop']);
    });

    it('does not remove through onClose while disabled', () => {
      const { root, host, detect } = setup((h) => {
        h.multiple.set(true);
        h.withTemplates.set(true);
        h.value.set([['callao']]);
      });
      const cascader = fixture.debugElement.children[0]
        .componentInstance as AndesCascader;
      cascader.setDisabledState(true);
      detect();

      expect(
        root.querySelector('.custom-tag')?.getAttribute('data-closable'),
      ).toBe('false');
      (root.querySelector('.custom-tag-close') as HTMLElement).click();
      detect();

      expect(host.value()).toEqual([['callao']]);
    });

    it('renders the prefix, a custom suffix icon, and drops the chevron on null', () => {
      const { root, host, detect } = setup((h) => h.withIcons.set(true));
      expect(
        root.querySelector('[data-slot="cascader-prefix"] .my-prefix'),
      ).not.toBeNull();
      expect(root.querySelector('.andes-cascader__chevron svg')).not.toBeNull();

      host.suffixMode.set('custom');
      detect();
      expect(
        root.querySelector('.andes-cascader__chevron .my-suffix'),
      ).not.toBeNull();
      expect(root.querySelector('.andes-cascader__chevron svg')).toBeNull();

      host.suffixMode.set('none');
      detect();
      expect(root.querySelector('.andes-cascader__chevron')).toBeNull();
    });

    it('replaces the clear and remove icons', () => {
      const { root } = setup((h) => {
        h.withIcons.set(true);
        h.allowClear.set(true);
        h.multiple.set(true);
        h.value.set([['callao']]);
      });

      expect(
        root.querySelector('[data-slot="cascader-clear"] .my-clear'),
      ).not.toBeNull();
      expect(root.querySelector('[data-slot="cascader-clear"] svg')).toBeNull();
      expect(
        root.querySelector('[data-slot="cascader-tag-remove"] .my-remove'),
      ).not.toBeNull();
    });

    it('replaces the spinner of the field while loading', () => {
      const { root, host, detect } = setup((h) => h.loading.set(true));
      expect(root.querySelector('.andes-cascader__spinner')).not.toBeNull();

      host.withIcons.set(true);
      detect();

      expect(
        root.querySelector('[data-slot="cascader-loading"] .my-loading'),
      ).not.toBeNull();
      expect(root.querySelector('.andes-cascader__spinner')).toBeNull();
    });

    it('replaces the spinner of an option whose children load', () => {
      const { openWithPointer, detect, item } = setup((h) => {
        h.withIcons.set(true);
        h.options.set([{ value: 'a', label: 'A' }]);
        h.loadData.set(() => new Promise<void>(() => undefined));
      });
      openWithPointer();

      item('A').click();
      detect();

      const row = document.querySelector<HTMLElement>('[data-loading]');
      expect(row).not.toBeNull();
      expect(row?.querySelector('.my-loading')).not.toBeNull();
      expect(row?.querySelector('.andes-cascader__spinner')).toBeNull();
    });
  });
});
