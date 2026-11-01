import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';

import type { AndesTreeKey, AndesTreeNode } from '../tree/tree-types';
import { AndesTreeSelect } from './tree-select';
import type {
  AndesTreeSelectMaxTagCount,
  AndesTreeSelectModel,
} from './tree-select-types';

function cities(): AndesTreeNode[] {
  return [
    {
      key: 'peru',
      title: 'Perú',
      children: [
        { key: 'lima', title: 'Lima' },
        { key: 'cusco', title: 'Cusco' },
        { key: 'arequipa', title: 'Arequipa' },
        { key: 'trujillo', title: 'Trujillo' },
      ],
    },
    { key: 'iquitos', title: 'Iquitos' },
  ];
}

@Component({
  imports: [AndesTreeSelect],
  template: `
    <andes-tree-select
      aria-label="Cities"
      [nodes]="nodes"
      [(value)]="value"
      [multiple]="!checkable()"
      [checkable]="checkable()"
      [disabled]="disabled()"
      [maxTagCount]="maxTagCount()"
      [maxTagPopover]="maxTagPopover()"
      [maxTagTextLength]="maxTagTextLength()"
      (selectionChange)="changes.push($event)"
    />
  `,
})
class TagsHost {
  readonly nodes = cities();
  readonly value = signal<AndesTreeSelectModel>([
    'lima',
    'cusco',
    'arequipa',
    'trujillo',
  ]);
  readonly checkable = signal(false);
  readonly disabled = signal(false);
  readonly maxTagCount = signal<AndesTreeSelectMaxTagCount | undefined>(2);
  readonly maxTagPopover = signal(true);
  readonly maxTagTextLength = signal<number | undefined>(undefined);
  readonly changes: AndesTreeSelectModel[] = [];
}

/** jsdom has no `PointerEvent` constructor; a mouse event with the field set will do. */
function pointer(target: Element, type: string): void {
  const event = new MouseEvent(type, { bubbles: false, cancelable: true });
  Object.defineProperty(event, 'pointerType', { get: () => 'mouse' });
  target.dispatchEvent(event);
}

describe('AndesTreeSelect tags', () => {
  let fixture: ComponentFixture<TagsHost>;

  const field = () => fixture.nativeElement as HTMLElement;
  const tagTexts = () =>
    Array.from(
      field().querySelectorAll<HTMLElement>(
        '.andes-tree-select__selection > [data-slot="tree-select-tag"] .andes-tree-select__tag-label',
      ),
    ).map((el) => el.textContent?.trim());
  const rest = () =>
    field().querySelector<HTMLElement>('[data-slot="tree-select-tag-rest"]');
  const popover = () =>
    document.querySelector<HTMLElement>('[data-slot="tree-select-overflow"]');

  function setup(configure?: (host: TagsHost) => void): TagsHost {
    fixture = TestBed.createComponent(TagsHost);
    configure?.(fixture.componentInstance);
    fixture.detectChanges();
    document.body.appendChild(fixture.nativeElement);
    return fixture.componentInstance;
  }

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    document.body.innerHTML = '';
  });

  describe('the "+ N" popover', () => {
    it('makes the "+ N" tag a button that opens a popover of the hidden tags', () => {
      setup();
      expect(tagTexts()).toEqual(['Lima', 'Cusco']);
      const tag = rest() as HTMLElement;
      expect(tag.getAttribute('role')).toBe('button');
      expect(tag.getAttribute('tabindex')).toBe('0');
      expect(tag.getAttribute('aria-haspopup')).toBe('dialog');
      expect(tag.getAttribute('aria-label')).toBe('2 more selected');
      expect(tag.getAttribute('aria-expanded')).toBe('false');

      tag.click();
      fixture.detectChanges();

      expect(tag.getAttribute('aria-expanded')).toBe('true');
      const listed = Array.from(
        (popover() as HTMLElement).querySelectorAll(
          '.andes-tree-select__tag-label',
        ),
      ).map((el) => el.textContent?.trim());
      expect(listed).toEqual(['Arequipa', 'Trujillo']);
      expect(popover()?.getAttribute('aria-label')).toBe('2 more selected');
    });

    it('opens on hover after a short delay', () => {
      vi.useFakeTimers();
      setup();
      pointer(rest() as HTMLElement, 'pointerenter');
      expect(popover()).toBeNull();
      vi.advanceTimersByTime(200);
      fixture.detectChanges();
      expect(popover()).not.toBeNull();
    });

    it('removes a hidden value from the popover, its remove buttons being Tab stops', () => {
      const host = setup();
      (rest() as HTMLElement).click();
      fixture.detectChanges();
      const remove = (popover() as HTMLElement).querySelector(
        '.andes-tree-select__tag-remove',
      ) as HTMLButtonElement;
      expect(remove.hasAttribute('tabindex')).toBe(false);
      expect(remove.getAttribute('aria-label')).toBe('Remove Arequipa');

      remove.click();
      fixture.detectChanges();

      expect(host.value()).toEqual(['lima', 'cusco', 'trujillo']);
      expect(host.changes.at(-1)).toEqual(['lima', 'cusco', 'trujillo']);
    });

    it('lists a disabled select’s hidden tags without remove buttons', () => {
      setup((host) => host.disabled.set(true));
      expect(rest()?.hasAttribute('tabindex')).toBe(false);
      (rest() as HTMLElement).click();
      fixture.detectChanges();
      expect(
        popover()?.querySelector('.andes-tree-select__tag-remove'),
      ).toBeNull();
    });

    it('falls back to a native tooltip with maxTagPopover off', () => {
      setup((host) => host.maxTagPopover.set(false));
      const tag = rest() as HTMLElement;
      expect(tag.hasAttribute('role')).toBe(false);
      expect(tag.getAttribute('title')).toBe('Arequipa, Trujillo');
      tag.click();
      fixture.detectChanges();
      expect(popover()).toBeNull();
    });

    it('closes the popover when the panel opens', () => {
      setup();
      (rest() as HTMLElement).click();
      fixture.detectChanges();
      expect(popover()).not.toBeNull();
      (
        field().querySelector('.andes-tree-select__trigger') as HTMLElement
      ).click();
      fixture.detectChanges();
      expect(popover()).toBeNull();
      expect(
        document.querySelector('.andes-tree-select__panel'),
      ).not.toBeNull();
    });
  });

  describe('maxTagTextLength', () => {
    it('cuts long tag texts short, keeping the full title as a tooltip', () => {
      setup((host) => {
        host.maxTagCount.set(undefined);
        host.maxTagTextLength.set(4);
      });
      expect(tagTexts()).toEqual(['Lima', 'Cusc...', 'Areq...', 'Truj...']);
      const tag = field().querySelectorAll('[data-slot="tree-select-tag"]')[1];
      expect(tag.getAttribute('title')).toBe('Cusco');
    });
  });

  describe('maxTagCount="responsive"', () => {
    /** Each measured tag is 60px wide (the "+ N" tag 30px); the row is `width` px. */
    function layout(width: number): void {
      vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockImplementation(
        function (this: HTMLElement) {
          return this.getAttribute('data-measure') === 'rest' ? 30 : 60;
        },
      );
      vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(
        function (this: HTMLElement) {
          return this.classList.contains('andes-tree-select__selection')
            ? width
            : 0;
        },
      );
    }

    it('shows as many tags as fit on one row and the rest behind "+ N"', () => {
      layout(200);
      setup((host) => host.maxTagCount.set('responsive'));
      fixture.detectChanges();

      // 30 (+ N) + 60 + 60 fits in 200 with the 6px gaps; a third tag does not.
      expect(tagTexts()).toEqual(['Lima', 'Cusco']);
      expect(rest()?.textContent?.trim()).toBe('+ 2 ...');
      const box = field().querySelector('.andes-tree-select__trigger');
      expect(box?.hasAttribute('data-responsive')).toBe(true);
      const measure = field().querySelector(
        '[data-slot="tree-select-tag-measure"]',
      );
      expect(measure?.getAttribute('aria-hidden')).toBe('true');
      expect(measure?.hasAttribute('inert')).toBe(true);
      expect(measure?.querySelectorAll('[data-measure="tag"]').length).toBe(4);
    });

    it('shows every tag when they all fit', () => {
      layout(400);
      setup((host) => host.maxTagCount.set('responsive'));
      fixture.detectChanges();
      expect(tagTexts()).toEqual(['Lima', 'Cusco', 'Arequipa', 'Trujillo']);
      expect(rest()).toBeNull();
    });

    it('is off for a single select', () => {
      layout(100);
      setup((host) => {
        host.maxTagCount.set('responsive');
        host.value.set(['lima']);
      });
      fixture.componentInstance.checkable.set(false);
      fixture.detectChanges();
      expect(rest()).toBeNull();
    });
  });

  it('keeps every tag with no maxTagCount', () => {
    setup((host) => host.maxTagCount.set(undefined));
    expect(tagTexts()).toEqual(['Lima', 'Cusco', 'Arequipa', 'Trujillo']);
    expect(rest()).toBeNull();
  });

  it('accepts a key list for the value', () => {
    const keys: AndesTreeKey[] = ['lima'];
    setup((host) => host.value.set(keys));
    expect(tagTexts()).toEqual(['Lima']);
  });
});
