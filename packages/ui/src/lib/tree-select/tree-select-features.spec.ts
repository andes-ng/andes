import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

import type { AndesTreeKey, AndesTreeNode } from '../tree/tree-types';
import { AndesTreeSelect } from './tree-select';
import type {
  AndesTreeSelectLabeledValue,
  AndesTreeSelectModel,
} from './tree-select-types';

function sample(): AndesTreeNode[] {
  return [
    {
      key: 'lima',
      title: 'Lima',
      children: [
        { key: 'lima-a', title: 'Zona A' },
        { key: 'lima-b', title: 'Zona B' },
      ],
    },
    {
      key: 'cusco',
      title: 'Cusco',
      children: [{ key: 'cusco-a', title: 'Zona A Cusco' }],
    },
    { key: 'iquitos', title: 'Iquitos' },
  ];
}

@Component({
  imports: [AndesTreeSelect, ReactiveFormsModule],
  template: `
    <ng-template #header let-search let-close="close">
      <span class="header-text">Header {{ search }}</span>
      <button type="button" class="header-close" (click)="close()">Done</button>
    </ng-template>
    <ng-template #footer let-search let-close="close">
      <input class="footer-input" type="text" aria-label="New region" />
      <button type="button" class="footer-add" (click)="close()">Add</button>
    </ng-template>
    <ng-template #tag let-tag let-onClose="onClose">
      <span class="custom-tag" [attr.data-closable]="tag.closable">
        {{ tag.title }}
        <button type="button" class="custom-tag-close" (click)="onClose()">
          drop
        </button>
      </span>
    </ng-template>
    <ng-template #prefixIcon><i class="my-prefix">P</i></ng-template>
    <ng-template #suffix><i class="my-suffix">S</i></ng-template>
    <ng-template #clearGlyph><i class="my-clear">C</i></ng-template>
    <ng-template #removeGlyph><i class="my-remove">R</i></ng-template>
    <ng-template #loadingGlyph><i class="my-loading">L</i></ng-template>

    <andes-tree-select
      aria-label="Region"
      [nodes]="nodes()"
      [(value)]="value"
      [(open)]="open"
      [multiple]="multiple()"
      [checkable]="checkable()"
      [labelInValue]="labelInValue()"
      [defaultOpen]="defaultOpen()"
      [showSearch]="showSearch()"
      [searchPlacement]="searchPlacement()"
      [expandAction]="expandAction()"
      [matchTriggerWidth]="matchTriggerWidth()"
      [panelClass]="panelClass()"
      [allowClear]="allowClear()"
      [loading]="loading()"
      [disabled]="disabled()"
      [panelHeader]="withPanel() ? header : undefined"
      [panelFooter]="withPanel() ? footer : undefined"
      [tagTemplate]="withTags() ? tag : undefined"
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
      (selectionChange)="changes.push($event)"
      (optionSelect)="selected.push($event)"
      (optionDeselect)="deselected.push($event)"
      (panelScroll)="scrolls.push($event)"
      (openChange)="opens.push($event)"
    />
    <button type="button" class="elsewhere">elsewhere</button>
  `,
})
class FeaturesHost {
  readonly nodes = signal<AndesTreeNode[]>(sample());
  readonly value = signal<AndesTreeSelectModel>(null);
  readonly open = signal(false);
  readonly multiple = signal(false);
  readonly checkable = signal(false);
  readonly labelInValue = signal(false);
  readonly defaultOpen = signal(false);
  readonly showSearch = signal(false);
  readonly searchPlacement = signal<'panel' | 'trigger'>('panel');
  readonly expandAction = signal<false | 'click' | 'doubleClick' | undefined>(
    undefined,
  );
  readonly matchTriggerWidth = signal<boolean | number | undefined>(undefined);
  readonly panelClass = signal<string | string[] | null>(null);
  readonly allowClear = signal(false);
  readonly loading = signal(false);
  readonly disabled = signal(false);
  readonly withPanel = signal(false);
  readonly withTags = signal(false);
  readonly withIcons = signal(false);
  readonly suffixMode = signal<'default' | 'custom' | 'none'>('default');
  readonly changes: AndesTreeSelectModel[] = [];
  readonly selected: (AndesTreeKey | AndesTreeSelectLabeledValue)[] = [];
  readonly deselected: (AndesTreeKey | AndesTreeSelectLabeledValue)[] = [];
  readonly scrolls: Event[] = [];
  readonly opens: boolean[] = [];
}

@Component({
  imports: [AndesTreeSelect, ReactiveFormsModule],
  template: `<andes-tree-select
    aria-label="Region"
    labelInValue
    multiple
    [nodes]="nodes"
    [formControl]="control"
  />`,
})
class LabeledFormHost {
  readonly nodes = sample();
  readonly control = new FormControl<AndesTreeSelectModel>(null);
}

describe('AndesTreeSelect features', () => {
  let fixture: ComponentFixture<FeaturesHost>;

  const box = () =>
    fixture.nativeElement.querySelector(
      '.andes-tree-select__trigger',
    ) as HTMLElement;
  const panel = () =>
    document.querySelector<HTMLElement>('.andes-tree-select__panel');
  const detect = () => fixture.detectChanges();
  const node = (title: string) =>
    Array.from(
      document.querySelectorAll<HTMLElement>(
        '.andes-tree-select__panel [role="treeitem"]',
      ),
    ).find(
      (el) =>
        el
          .querySelector(':scope > .andes-tree__row .andes-tree__title')
          ?.textContent?.trim() === title,
    ) as HTMLElement;
  const row = (title: string) =>
    node(title).querySelector(':scope > .andes-tree__row') as HTMLElement;
  const openPanel = () => {
    box().click();
    detect();
  };
  const tagTexts = () =>
    Array.from(
      fixture.nativeElement.querySelectorAll(
        '[data-slot="tree-select-tag"] .andes-tree-select__tag-label',
      ),
    ).map((el) => (el as HTMLElement).textContent?.trim());
  const key = (target: Element, name: string, init: KeyboardEventInit = {}) => {
    const event = new KeyboardEvent('keydown', {
      key: name,
      bubbles: true,
      cancelable: true,
      ...init,
    });
    target.dispatchEvent(event);
    return event;
  };

  function setup(configure?: (host: FeaturesHost) => void) {
    fixture = TestBed.createComponent(FeaturesHost);
    configure?.(fixture.componentInstance);
    fixture.detectChanges();
    document.body.appendChild(fixture.nativeElement);
    return fixture.componentInstance;
  }

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('open', () => {
    it('follows the panel through [(open)], whoever opens or closes it', () => {
      const host = setup();
      expect(host.open()).toBe(false);

      openPanel();
      expect(host.open()).toBe(true);
      box().click();
      detect();
      expect(host.open()).toBe(false);
      expect(host.opens).toEqual([true, false]);
    });

    it('opens and closes the panel when the bound value changes', () => {
      const host = setup();

      host.open.set(true);
      detect();
      expect(panel()).not.toBeNull();

      host.open.set(false);
      detect();
      expect(panel()).toBeNull();
    });

    it('opens once on render with defaultOpen, and the user can close it', async () => {
      const host = setup((h) => h.defaultOpen.set(true));
      await fixture.whenStable();
      detect();

      expect(panel()).not.toBeNull();
      expect(host.open()).toBe(true);

      box().click();
      detect();
      expect(panel()).toBeNull();
    });

    it('does not open a disabled select from [(open)]', () => {
      const host = setup((h) => h.disabled.set(true));
      host.open.set(true);
      detect();
      expect(panel()).toBeNull();
    });
  });

  describe('panel options', () => {
    it('adds panelClass to the overlay pane', () => {
      const host = setup();
      host.panelClass.set(['wide', 'tinted']);
      detect();
      openPanel();

      const pane = panel()?.closest('.cdk-overlay-pane');
      expect(pane?.classList).toContain('wide');
      expect(pane?.classList).toContain('tinted');
    });

    it('hands expandAction to the tree', () => {
      // Multiple, so that picking a row leaves the panel open.
      const host = setup((h) => h.multiple.set(true));
      openPanel();
      row('Lima').click();
      detect();
      expect(node('Lima').getAttribute('aria-expanded')).toBe('false');

      host.expandAction.set('click');
      detect();
      row('Lima').click();
      detect();
      expect(node('Lima').getAttribute('aria-expanded')).toBe('true');
    });

    it('sizes the panel to the field by default, to its content, or to a number of px', () => {
      const host = setup();
      openPanel();
      expect(panel()?.hasAttribute('data-match-width')).toBe(true);
      expect(panel()?.hasAttribute('data-fixed-width')).toBe(false);

      host.matchTriggerWidth.set(false);
      detect();
      expect(panel()?.hasAttribute('data-match-width')).toBe(false);
      expect(panel()?.hasAttribute('data-fixed-width')).toBe(false);
      expect(panel()?.style.width).toBe('');

      host.matchTriggerWidth.set(320);
      detect();
      expect(panel()?.hasAttribute('data-match-width')).toBe(false);
      expect(panel()?.hasAttribute('data-fixed-width')).toBe(true);
      expect(panel()?.style.width).toBe('320px');
    });
  });

  describe('events', () => {
    it('emits selectionChange and optionSelect when the user picks', () => {
      const host = setup();
      openPanel();

      row('Iquitos').click();
      detect();

      expect(host.changes).toEqual(['iquitos']);
      expect(host.selected).toEqual(['iquitos']);
      expect(host.deselected).toEqual([]);
      expect(host.value()).toBe('iquitos');
    });

    it('emits optionSelect again for the node that is already selected, and no selectionChange', () => {
      const host = setup((h) => h.value.set('iquitos'));
      openPanel();

      row('Iquitos').click();
      detect();

      expect(host.changes).toEqual([]);
      expect(host.selected).toEqual(['iquitos']);
    });

    it('stays silent for a value written from outside', () => {
      const host = setup();
      host.value.set('cusco-a');
      detect();
      expect(host.changes).toEqual([]);
      expect(host.selected).toEqual([]);
    });

    it('tells apart the nodes that came and went in a multiple select', () => {
      const host = setup((h) => h.multiple.set(true));
      openPanel();

      row('Iquitos').click();
      detect();
      row('Cusco').click();
      detect();
      expect(host.selected).toEqual(['iquitos', 'cusco']);

      (
        fixture.nativeElement.querySelector(
          '.andes-tree-select__tag-remove',
        ) as HTMLElement
      ).click();
      detect();

      expect(host.deselected).toEqual(['iquitos']);
      expect(host.changes.at(-1)).toEqual(['cusco']);
    });

    it('emits every leaf a checked branch adds, and every one that clearing removes', () => {
      const host = setup((h) => {
        h.checkable.set(true);
        h.allowClear.set(true);
      });
      openPanel();
      (
        node('Lima').querySelector(
          ':scope > .andes-tree__row .andes-tree__checkbox',
        ) as HTMLElement
      ).click();
      detect();
      expect(host.selected).toEqual(['lima-a', 'lima-b']);
      expect(host.changes).toEqual([['lima-a', 'lima-b']]);

      (
        fixture.nativeElement.querySelector(
          '[data-slot="tree-select-clear"]',
        ) as HTMLElement
      ).click();
      detect();
      expect(host.deselected).toEqual(['lima-a', 'lima-b']);
      expect(host.changes.at(-1)).toEqual([]);
    });
  });

  describe('labelInValue', () => {
    it('holds and emits { value, label } for a single select', () => {
      const host = setup((h) => h.labelInValue.set(true));
      openPanel();

      row('Iquitos').click();
      detect();

      const labeled = { value: 'iquitos', label: 'Iquitos' };
      expect(host.value()).toEqual(labeled);
      expect(host.changes).toEqual([labeled]);
      expect(host.selected).toEqual([labeled]);
      expect(box().textContent).toContain('Iquitos');
    });

    it('holds and emits a list of them for a multiple select, and null for none', () => {
      const host = setup((h) => {
        h.labelInValue.set(true);
        h.multiple.set(true);
        h.allowClear.set(true);
      });
      openPanel();
      row('Iquitos').click();
      detect();
      row('Cusco').click();
      detect();

      expect(host.value()).toEqual([
        { value: 'iquitos', label: 'Iquitos' },
        { value: 'cusco', label: 'Cusco' },
      ]);
      expect(tagTexts()).toEqual(['Iquitos', 'Cusco']);

      (
        fixture.nativeElement.querySelector(
          '[data-slot="tree-select-clear"]',
        ) as HTMLElement
      ).click();
      detect();
      expect(host.value()).toEqual([]);
      expect(host.deselected).toEqual([
        { value: 'iquitos', label: 'Iquitos' },
        { value: 'cusco', label: 'Cusco' },
      ]);
    });

    it('reads a labelled value: the node is marked and a missing node keeps its label', () => {
      const host = setup((h) => {
        h.labelInValue.set(true);
        h.multiple.set(true);
        h.value.set([
          { value: 'cusco-a', label: 'Zona A Cusco' },
          { value: 'gone', label: 'Removed region' },
        ]);
      });

      expect(tagTexts()).toEqual(['Zona A Cusco', 'Removed region']);
      openPanel();
      expect(node('Cusco').getAttribute('aria-expanded')).toBe('true');
      expect(node('Zona A Cusco').getAttribute('aria-selected')).toBe('true');
      expect(host.changes).toEqual([]);
    });

    it('keeps bare keys when it is off', () => {
      const host = setup();
      openPanel();
      row('Iquitos').click();
      detect();
      expect(host.value()).toBe('iquitos');
    });

    it('works with a form control', () => {
      const formFixture = TestBed.createComponent(LabeledFormHost);
      formFixture.detectChanges();
      document.body.appendChild(formFixture.nativeElement);
      const control = formFixture.componentInstance.control;

      control.setValue([{ value: 'iquitos', label: 'Iquitos' }]);
      formFixture.detectChanges();
      expect(
        formFixture.nativeElement.querySelector('.andes-tree-select__tag-label')
          .textContent,
      ).toBe('Iquitos');

      (
        formFixture.nativeElement.querySelector(
          '.andes-tree-select__trigger',
        ) as HTMLElement
      ).click();
      formFixture.detectChanges();
      (
        document.querySelector(
          '.andes-tree-select__panel [role="treeitem"] .andes-tree__title',
        ) as HTMLElement
      ).click();
      formFixture.detectChanges();

      expect(control.value).toEqual([
        { value: 'iquitos', label: 'Iquitos' },
        { value: 'lima', label: 'Lima' },
      ]);
      expect(control.dirty).toBe(true);
    });
  });

  describe('accessibility', () => {
    it('points aria-controls at the tree, or at the panel when it has no rows', () => {
      const host = setup();
      openPanel();
      const tree = panel()?.querySelector('[role="tree"]');
      expect(box().getAttribute('aria-controls')).toBe(tree?.id);

      host.nodes.set([]);
      detect();
      expect(panel()?.querySelector('[role="tree"]')).toBeNull();
      expect(box().getAttribute('aria-controls')).toBe(panel()?.id);
    });

    it('does the same for the search input of an in-field search', () => {
      setup((h) => {
        h.showSearch.set(true);
        h.searchPlacement.set('trigger');
      });
      openPanel();
      const input = fixture.nativeElement.querySelector(
        '.andes-tree-select__input',
      ) as HTMLInputElement;
      const tree = panel()?.querySelector('[role="tree"]');
      expect(input.getAttribute('aria-controls')).toBe(tree?.id);
      expect(box().hasAttribute('aria-controls')).toBe(false);
    });
  });

  describe('panel header and footer', () => {
    it('renders both around the tree, handing out the search text and close()', () => {
      setup((h) => h.withPanel.set(true));
      openPanel();

      const header = panel()?.querySelector(
        '[data-slot="tree-select-panel-header"]',
      ) as Node;
      const footer = panel()?.querySelector(
        '[data-slot="tree-select-panel-footer"]',
      ) as Node;
      const tree = panel()?.querySelector('[role="tree"]') as Node;
      expect(header.textContent).toContain('Header');
      expect(
        header.compareDocumentPosition(tree) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
      expect(
        footer.compareDocumentPosition(tree) & Node.DOCUMENT_POSITION_PRECEDING,
      ).toBeTruthy();

      (panel()?.querySelector('.footer-add') as HTMLElement).click();
      detect();
      expect(panel()).toBeNull();
    });

    it('passes the search text to the header', () => {
      setup((h) => {
        h.withPanel.set(true);
        h.showSearch.set(true);
      });
      openPanel();
      const search = panel()?.querySelector(
        '.andes-tree-select__search-input',
      ) as HTMLInputElement;
      search.value = 'zon';
      search.dispatchEvent(new Event('input', { bubbles: true }));
      detect();

      expect(panel()?.querySelector('.header-text')?.textContent).toBe(
        'Header zon',
      );
    });

    it('lets Tab walk from the tree to the footer and between its controls', () => {
      setup((h) => h.withPanel.set(true));
      openPanel();
      const item = panel()?.querySelector(
        '[role="treeitem"][tabindex="0"]',
      ) as HTMLElement;
      item.focus();

      const fromTree = key(item, 'Tab');
      detect();
      expect(panel()).not.toBeNull();
      expect(fromTree.defaultPrevented).toBe(false);

      const field = panel()?.querySelector('.footer-input') as HTMLElement;
      key(field, 'Tab');
      detect();
      expect(panel()).not.toBeNull();
    });

    it('hands Tab off the last footer control on to the field', () => {
      setup((h) => h.withPanel.set(true));
      box().focus();
      openPanel();
      const add = panel()?.querySelector('.footer-add') as HTMLElement;
      add.focus();

      key(add, 'Tab');
      detect();

      expect(panel()).toBeNull();
      expect(document.activeElement).toBe(box());
    });

    it('hands Shift+Tab off the first header control back to the field', () => {
      setup((h) => h.withPanel.set(true));
      box().focus();
      openPanel();
      const first = panel()?.querySelector('.header-close') as HTMLElement;
      first.focus();

      // The header holds a single control, so Shift+Tab leaves from it.
      key(first, 'Tab', { shiftKey: true });
      detect();
      expect(panel()).toBeNull();
    });

    it('still leaves from the tree when there is no footer', () => {
      setup();
      box().focus();
      openPanel();
      const item = panel()?.querySelector(
        '[role="treeitem"][tabindex="0"]',
      ) as HTMLElement;
      item.focus();

      key(item, 'Tab');
      detect();

      expect(panel()).toBeNull();
      expect(document.activeElement).toBe(box());
    });
  });

  describe('panel scroll', () => {
    it('emits when the panel list scrolls, and stops once it closes', () => {
      const host = setup();
      openPanel();

      const viewport = panel()?.querySelector(
        '.andes-tree-select__viewport',
      ) as HTMLElement;
      viewport.dispatchEvent(new Event('scroll'));
      expect(host.scrolls).toHaveLength(1);
      expect(host.scrolls[0].target).toBe(viewport);

      box().click();
      detect();
      document.dispatchEvent(new Event('scroll'));
      expect(host.scrolls).toHaveLength(1);
    });
  });

  describe('templates', () => {
    it('renders a tagTemplate per node, and onClose removes it', () => {
      const host = setup((h) => {
        h.multiple.set(true);
        h.withTags.set(true);
        h.value.set(['iquitos', 'cusco']);
      });
      const tags = () =>
        Array.from(fixture.nativeElement.querySelectorAll('.custom-tag')).map(
          (el) => (el as HTMLElement).textContent?.replace(/\s+/g, ' ').trim(),
        );
      expect(tags()).toEqual(['Iquitos drop', 'Cusco drop']);
      expect(
        fixture.nativeElement.querySelector('[data-slot="tree-select-tag"]'),
      ).toBeNull();
      expect(
        fixture.nativeElement
          .querySelector('.custom-tag')
          .getAttribute('data-closable'),
      ).toBe('true');

      (
        fixture.nativeElement.querySelector('.custom-tag-close') as HTMLElement
      ).click();
      detect();

      expect(host.value()).toEqual(['cusco']);
      expect(host.deselected).toEqual(['iquitos']);
    });

    it('reports a tag as not closable while disabled', () => {
      setup((h) => {
        h.multiple.set(true);
        h.withTags.set(true);
        h.disabled.set(true);
        h.value.set(['iquitos']);
      });
      expect(
        fixture.nativeElement
          .querySelector('.custom-tag')
          .getAttribute('data-closable'),
      ).toBe('false');
    });

    it('renders the prefix, a custom suffix icon, and drops the chevron on null', () => {
      const host = setup((h) => h.withIcons.set(true));
      const root = fixture.nativeElement as HTMLElement;
      expect(
        root.querySelector('[data-slot="tree-select-prefix"] .my-prefix'),
      ).not.toBeNull();
      expect(
        root.querySelector('.andes-tree-select__chevron svg'),
      ).not.toBeNull();

      host.suffixMode.set('custom');
      detect();
      expect(
        root.querySelector('.andes-tree-select__chevron .my-suffix'),
      ).not.toBeNull();
      expect(root.querySelector('.andes-tree-select__chevron svg')).toBeNull();

      host.suffixMode.set('none');
      detect();
      expect(root.querySelector('.andes-tree-select__chevron')).toBeNull();
    });

    it('puts the clear button and the indicator in one cell, alone with no indicator', () => {
      const host = setup((h) => {
        h.allowClear.set(true);
        h.value.set('iquitos');
      });
      const root = fixture.nativeElement as HTMLElement;
      const swap = root.querySelector(
        '.andes-tree-select__swap',
      ) as HTMLElement;
      expect(
        swap.querySelector('[data-slot="tree-select-clear"]'),
      ).not.toBeNull();
      expect(
        swap.querySelector(
          '.andes-tree-select__chevron.andes-tree-select__indicator',
        ),
      ).not.toBeNull();
      expect(swap.hasAttribute('data-alone')).toBe(false);

      host.loading.set(true);
      detect();
      expect(
        swap.querySelector('[data-slot="tree-select-loading"]')?.classList,
      ).toContain('andes-tree-select__indicator');

      host.loading.set(false);
      host.suffixMode.set('none');
      detect();
      expect(swap.hasAttribute('data-alone')).toBe(true);
    });

    it('replaces the clear and remove icons', () => {
      setup((h) => {
        h.withIcons.set(true);
        h.allowClear.set(true);
        h.multiple.set(true);
        h.value.set(['iquitos']);
      });
      const root = fixture.nativeElement as HTMLElement;
      expect(
        root.querySelector('[data-slot="tree-select-clear"] .my-clear'),
      ).not.toBeNull();
      expect(
        root.querySelector('[data-slot="tree-select-clear"] svg'),
      ).toBeNull();
      expect(
        root.querySelector('.andes-tree-select__tag-remove .my-remove'),
      ).not.toBeNull();
    });

    it('replaces the spinner of the field while loading', () => {
      const host = setup((h) => h.loading.set(true));
      const root = fixture.nativeElement as HTMLElement;
      expect(root.querySelector('.andes-tree-select__spinner')).not.toBeNull();

      host.withIcons.set(true);
      detect();

      expect(
        root.querySelector('[data-slot="tree-select-loading"] .my-loading'),
      ).not.toBeNull();
      expect(root.querySelector('.andes-tree-select__spinner')).toBeNull();
    });
  });
});
