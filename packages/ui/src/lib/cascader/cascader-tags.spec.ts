import { Component, signal, type TemplateRef, viewChild } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';

import { AndesCascader, type AndesCascaderModel } from './cascader';
import type {
  AndesCascaderChange,
  AndesCascaderMaxTagCount,
  AndesCascaderMaxTagPlaceholder,
  AndesCascaderOption,
  AndesCascaderTag,
} from './cascader-types';

const PLACES: AndesCascaderOption[] = [
  {
    value: 'peru',
    label: 'Perú',
    children: [
      { value: 'lima', label: 'Lima' },
      { value: 'cusco', label: 'Cusco' },
      { value: 'arequipa', label: 'Arequipa' },
      { value: 'trujillo', label: 'Trujillo' },
    ],
  },
  { value: 'iquitos', label: 'Iquitos' },
];

@Component({
  imports: [AndesCascader],
  template: `
    <ng-template #rest let-omitted>{{ omitted.length }} más</ng-template>
    <andes-cascader
      aria-label="Cities"
      multiple
      [options]="options"
      [(value)]="value"
      [disabled]="disabled()"
      [maxTagCount]="maxTagCount()"
      [maxTagPlaceholder]="placeholder()"
      [maxTagPopover]="maxTagPopover()"
      [maxTagTextLength]="maxTagTextLength()"
      [maxCount]="maxCount()"
      (selectionChange)="changes.push($event)"
    />
  `,
})
class TagsHost {
  readonly rest =
    viewChild.required<TemplateRef<{ $implicit: readonly AndesCascaderTag[] }>>(
      'rest',
    );
  readonly options = PLACES;
  readonly value = signal<AndesCascaderModel>([
    ['peru', 'lima'],
    ['peru', 'cusco'],
    ['peru', 'arequipa'],
    ['peru', 'trujillo'],
  ]);
  readonly disabled = signal(false);
  readonly maxTagCount = signal<AndesCascaderMaxTagCount | undefined>(2);
  readonly placeholder = signal<AndesCascaderMaxTagPlaceholder | undefined>(
    undefined,
  );
  readonly maxTagPopover = signal(true);
  readonly maxTagTextLength = signal<number | undefined>(undefined);
  readonly maxCount = signal<number | undefined>(undefined);
  readonly changes: AndesCascaderChange[] = [];
}

describe('AndesCascader tags', () => {
  let fixture: ComponentFixture<TagsHost>;

  const field = () => fixture.nativeElement as HTMLElement;
  const tagTexts = () =>
    Array.from(
      field().querySelectorAll<HTMLElement>(
        '.andes-cascader__selection > [data-slot="cascader-tag"] .andes-cascader__tag-label',
      ),
    ).map((el) => el.textContent?.trim());
  const rest = () =>
    field().querySelector<HTMLElement>('[data-slot="cascader-tag-rest"]');
  const popover = () =>
    document.querySelector<HTMLElement>('[data-slot="cascader-overflow"]');

  function setup(configure?: (host: TagsHost) => void): TagsHost {
    fixture = TestBed.createComponent(TagsHost);
    configure?.(fixture.componentInstance);
    fixture.detectChanges();
    document.body.appendChild(fixture.nativeElement);
    return fixture.componentInstance;
  }

  afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = '';
  });

  describe('the "+ N" popover', () => {
    it('opens a popover listing the hidden tags from the "+ N" button', () => {
      setup();
      expect(tagTexts()).toEqual(['Perú / Lima', 'Perú / Cusco']);
      const tag = rest() as HTMLElement;
      expect(tag.getAttribute('role')).toBe('button');
      expect(tag.getAttribute('tabindex')).toBe('0');
      expect(tag.getAttribute('aria-label')).toBe('2 more selected');

      tag.click();
      fixture.detectChanges();

      expect(tag.getAttribute('aria-expanded')).toBe('true');
      expect(
        Array.from(
          (popover() as HTMLElement).querySelectorAll(
            '.andes-cascader__tag-label',
          ),
        ).map((el) => el.textContent?.trim()),
      ).toEqual(['Perú / Arequipa', 'Perú / Trujillo']);
    });

    it('removes a hidden path from the popover', () => {
      const host = setup();
      (rest() as HTMLElement).click();
      fixture.detectChanges();
      const remove = (popover() as HTMLElement).querySelector(
        '.andes-cascader__tag-remove',
      ) as HTMLButtonElement;
      expect(remove.hasAttribute('tabindex')).toBe(false);
      expect(remove.getAttribute('aria-label')).toBe('Remove Perú / Arequipa');

      remove.click();
      fixture.detectChanges();

      expect(host.value()).toEqual([
        ['peru', 'lima'],
        ['peru', 'cusco'],
        ['peru', 'trujillo'],
      ]);
      expect(host.changes.length).toBe(1);
    });

    it('falls back to a native tooltip with maxTagPopover off', () => {
      setup((h) => h.maxTagPopover.set(false));
      const tag = rest() as HTMLElement;
      expect(tag.hasAttribute('role')).toBe(false);
      expect(tag.getAttribute('title')).toBe(
        'Perú / Arequipa, Perú / Trujillo',
      );
    });

    it('does not open the panel with a click on the "+ N" tag', () => {
      setup();
      (rest() as HTMLElement).click();
      fixture.detectChanges();
      expect(document.querySelector('[data-slot="cascader-panel"]')).toBeNull();
    });
  });

  describe('maxTagPlaceholder', () => {
    it('takes a text, a function of the hidden tags, or a template', () => {
      const host = setup((h) => h.placeholder.set('more'));
      expect(rest()?.textContent?.trim()).toBe('more');

      host.placeholder.set((omitted: readonly AndesCascaderTag[]) =>
        omitted.map((tag) => tag.labels.at(-1)).join('+'),
      );
      fixture.detectChanges();
      expect(rest()?.textContent?.trim()).toBe('Arequipa+Trujillo');

      host.placeholder.set(host.rest());
      fixture.detectChanges();
      expect(rest()?.textContent?.trim()).toBe('2 más');
    });
  });

  describe('maxTagTextLength', () => {
    it('cuts long tag texts short, keeping the full path as a tooltip', () => {
      setup((h) => {
        h.maxTagCount.set(undefined);
        h.maxTagTextLength.set(7);
      });
      expect(tagTexts()[0]).toBe('Perú / ...');
      const tag = field().querySelector('[data-slot="cascader-tag"]');
      expect(tag?.getAttribute('title')).toBe('Perú / Lima');
    });
  });

  describe('maxTagCount="responsive"', () => {
    /** Each measured tag is 80px wide (the "+ N" tag 30px); the row is `width` px. */
    function layout(width: number): void {
      vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockImplementation(
        function (this: HTMLElement) {
          return this.getAttribute('data-measure') === 'rest' ? 30 : 80;
        },
      );
      vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(
        function (this: HTMLElement) {
          return this.classList.contains('andes-cascader__selection')
            ? width
            : 0;
        },
      );
    }

    it('shows as many tags as fit on one row and the rest behind "+ N"', () => {
      layout(220);
      setup((h) => h.maxTagCount.set('responsive'));
      fixture.detectChanges();

      // 30 (+ N) + 80 + 80 fits in 220 with the gaps; a third tag does not.
      expect(tagTexts()).toEqual(['Perú / Lima', 'Perú / Cusco']);
      expect(rest()?.textContent?.trim()).toBe('+ 2 ...');
      const measure = field().querySelector(
        '[data-slot="cascader-tag-measure"]',
      );
      expect(measure?.hasAttribute('inert')).toBe(true);
      expect(measure?.querySelectorAll('[data-measure="tag"]').length).toBe(4);
      expect(
        field()
          .querySelector('[data-slot="cascader-trigger"]')
          ?.hasAttribute('data-responsive'),
      ).toBe(true);
    });

    it('shows every tag when they all fit', () => {
      layout(600);
      setup((h) => h.maxTagCount.set('responsive'));
      fixture.detectChanges();
      expect(tagTexts().length).toBe(4);
      expect(rest()).toBeNull();
    });
  });

  describe('maxCount', () => {
    const item = (label: string) =>
      Array.from(
        document.querySelectorAll<HTMLElement>('[data-slot="cascader-option"]'),
      ).find(
        (el) => el.textContent?.replace(/\s+/g, ' ').trim() === label,
      ) as HTMLElement;
    const open = () => {
      (
        field().querySelector('[data-slot="cascader-trigger"]') as HTMLElement
      ).click();
      fixture.detectChanges();
      item('Perú').click();
      fixture.detectChanges();
    };

    it('stops more paths from being checked once the value holds maxCount', () => {
      const host = setup((h) => {
        h.maxTagCount.set(undefined);
        h.maxCount.set(2);
        h.value.set([['peru', 'lima']]);
      });
      open();
      expect(item('Cusco').hasAttribute('data-blocked')).toBe(false);

      item('Cusco').click();
      fixture.detectChanges();
      expect(host.value()).toEqual([
        ['peru', 'lima'],
        ['peru', 'cusco'],
      ]);
      expect(item('Arequipa').hasAttribute('data-blocked')).toBe(true);
      expect(item('Arequipa').getAttribute('aria-disabled')).toBe('true');
      // A branch still opens its column, and a checked path can still be taken off.
      expect(item('Perú').hasAttribute('aria-disabled')).toBe(false);
      expect(item('Cusco').hasAttribute('data-blocked')).toBe(false);

      item('Arequipa').click();
      fixture.detectChanges();
      expect(host.value()).toEqual([
        ['peru', 'lima'],
        ['peru', 'cusco'],
      ]);

      item('Cusco').click();
      fixture.detectChanges();
      expect(host.value()).toEqual([['peru', 'lima']]);
      expect(item('Arequipa').hasAttribute('data-blocked')).toBe(false);
    });

    it('refuses a branch whose leaves would overshoot it', () => {
      const host = setup((h) => {
        h.maxTagCount.set(undefined);
        h.maxCount.set(3);
        h.value.set([]);
      });
      open();
      (
        item('Perú').querySelector('.andes-cascader__check') as HTMLElement
      ).click();
      fixture.detectChanges();
      expect(host.value()).toEqual([]);
    });
  });

  describe('announcements', () => {
    const live = () =>
      field().querySelector('[data-slot="cascader-tags-live"]') as HTMLElement;

    it('announces a removed path and the leaves a check adds, politely', () => {
      setup((h) => {
        h.maxTagCount.set(undefined);
        h.value.set([['iquitos']]);
      });
      expect(live().getAttribute('role')).toBe('status');
      expect(live().getAttribute('aria-live')).toBe('polite');
      expect(live().textContent).toBe('');

      (
        field().querySelector('.andes-cascader__tag-remove') as HTMLElement
      ).click();
      fixture.detectChanges();
      expect(live().textContent).toBe('Removed Iquitos');

      (
        field().querySelector('[data-slot="cascader-trigger"]') as HTMLElement
      ).click();
      fixture.detectChanges();
      const peru = Array.from(
        document.querySelectorAll<HTMLElement>('[data-slot="cascader-option"]'),
      ).find((el) => el.textContent?.trim() === 'Perú') as HTMLElement;
      (peru.querySelector('.andes-cascader__check') as HTMLElement).click();
      fixture.detectChanges();
      expect(live().textContent).toBe(
        'Added Perú / Lima, Perú / Cusco, Perú / Arequipa, Perú / Trujillo',
      );
    });

    it('stays quiet for a value written from outside', () => {
      const host = setup((h) => h.maxTagCount.set(undefined));
      host.value.set([['iquitos']]);
      fixture.detectChanges();
      expect(live().textContent).toBe('');
    });
  });
});
