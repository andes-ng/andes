import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import {
  AndesPagination,
  type AndesPaginationLayout,
  type AndesPaginationShape,
  type AndesPaginationSize,
  type AndesPaginationVariant,
} from './pagination';

/*
 * "Page change without a trail": after any change of the page there is exactly one selected
 * item in the very next render, never the old one and the new one together. The current flag
 * of every item comes from one computed list, so both are rendered in the same pass; the
 * stylesheet spec holds the other half (no transition on the selected look).
 */

@Component({
  imports: [AndesPagination],
  template: `<andes-pagination
    aria-label="Pages"
    [(current)]="current"
    [total]="500"
    [variant]="variant()"
    [shape]="shape()"
    [size]="size()"
    [layout]="layout()"
    [showFirstLast]="true"
    [showQuickJumper]="true"
  />`,
})
class Host {
  readonly current = signal(8);
  readonly variant = signal<AndesPaginationVariant>('default');
  readonly shape = signal<AndesPaginationShape>('default');
  readonly size = signal<AndesPaginationSize>('default');
  readonly layout = signal<AndesPaginationLayout>('default');
}

function setup(configure?: (host: Host) => void) {
  const fixture = TestBed.createComponent(Host);
  configure?.(fixture.componentInstance);
  fixture.detectChanges();
  const root: HTMLElement = fixture.nativeElement;
  return { fixture, host: fixture.componentInstance, root };
}

/** The selected items of the rendering: by `aria-current` and by the selected class. */
function selected(root: HTMLElement) {
  return {
    current: Array.from(root.querySelectorAll('[aria-current="page"]')).map(
      (el) => el.textContent?.trim(),
    ),
    marked: Array.from(
      root.querySelectorAll('.andes-pagination__page--active'),
    ).map((el) => el.textContent?.trim()),
  };
}

function expectOneSelected(root: HTMLElement, page: number) {
  const { current, marked } = selected(root);

  expect(current).toEqual([String(page)]);
  expect(marked).toEqual([String(page)]);
}

const click = (root: HTMLElement, selector: string) =>
  root.querySelector<HTMLElement>(selector)?.click();

describe('page change without a trail', () => {
  const variants: AndesPaginationVariant[] = [
    'default',
    'outline',
    'ghost',
    'filled',
  ];
  const shapes: AndesPaginationShape[] = ['default', 'pill'];
  const sizes: AndesPaginationSize[] = ['small', 'default', 'large'];

  it.each(variants.flatMap((v) => shapes.map((s) => [v, s] as const)))(
    'has one selected item after Next, Previous and a page click: %s, %s',
    (variant, shape) => {
      const { fixture, host, root } = setup((h) => {
        h.variant.set(variant);
        h.shape.set(shape);
      });
      expectOneSelected(root, 8);

      click(root, '.andes-pagination__item--next');
      fixture.detectChanges();
      expectOneSelected(root, 9);

      click(root, '.andes-pagination__item--prev');
      fixture.detectChanges();
      expectOneSelected(root, 8);

      click(root, '[aria-label="Page 9"]');
      fixture.detectChanges();
      expectOneSelected(root, 9);
      expect(host.current()).toBe(9);
    },
  );

  it.each(sizes)('has one selected item in the %s size', (size) => {
    const { fixture, root } = setup((h) => h.size.set(size));

    click(root, '.andes-pagination__item--next');
    fixture.detectChanges();

    expectOneSelected(root, 9);
  });

  it('has one selected item after First, Last and a jump item', () => {
    const { fixture, root } = setup();

    click(root, '.andes-pagination__item--last');
    fixture.detectChanges();
    expectOneSelected(root, 50);

    click(root, '.andes-pagination__item--first');
    fixture.detectChanges();
    expectOneSelected(root, 1);

    click(root, '[aria-label="Next 5 pages"]');
    fixture.detectChanges();
    expectOneSelected(root, 6);

    click(root, '[aria-label="Previous 5 pages"]');
    fixture.detectChanges();
    expectOneSelected(root, 1);
  });

  it('has one selected item after the quick jumper', () => {
    const { fixture, root } = setup();
    const field = root.querySelector<HTMLInputElement>(
      '.andes-pagination__jump-input input',
    ) as HTMLInputElement;

    field.value = '21';
    field.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    field.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }),
    );
    fixture.detectChanges();

    expectOneSelected(root, 21);
  });

  it('has one selected item when the page changes from outside', () => {
    const { fixture, host, root } = setup();

    host.current.set(30);
    fixture.detectChanges();
    expectOneSelected(root, 30);

    host.current.set(2);
    fixture.detectChanges();
    expectOneSelected(root, 2);
  });

  it('keeps the selected flag on the new item in right-to-left text', () => {
    const { fixture, root } = setup();
    root.setAttribute('dir', 'rtl');

    click(root, '.andes-pagination__item--next');
    fixture.detectChanges();

    expectOneSelected(root, 9);
  });

  it('draws no selected page at all in the table layout, and moves nothing else', () => {
    const { fixture, root } = setup((h) => h.layout.set('table'));

    click(root, '.andes-pagination__item--next');
    fixture.detectChanges();

    expect(selected(root)).toEqual({ current: [], marked: [] });
  });
});
