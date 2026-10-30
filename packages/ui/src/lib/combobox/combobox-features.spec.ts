import { Component, signal, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

import {
  AndesCombobox,
  type AndesComboboxOptionEntry,
  type AndesComboboxPanelClass,
} from './combobox';
import { AndesComboboxContent } from './combobox-content';
import { AndesComboboxInput } from './combobox-input';
import { AndesComboboxItem } from './combobox-item';

const FRUIT_OPTIONS: readonly AndesComboboxOptionEntry<string>[] = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana' },
];

interface Fruit {
  readonly id: number;
  readonly name: string;
}

@Component({
  imports: [AndesCombobox, ReactiveFormsModule],
  template: `
    <label for="fruit-field">Fruit</label>
    <andes-combobox
      id="fruit-field"
      [options]="options()"
      [formControl]="control"
      [defaultOpen]="defaultOpen()"
      [panelClass]="panelClass()"
      [required]="required()"
      [name]="name()"
      [prefix]="prefix()"
      [suffixIcon]="useSuffix() ? suffixTpl : undefined"
      [loading]="loading()"
      [allowClear]="true"
      [searchDebounce]="debounce()"
      (searchChange)="searches.push($event)"
    />
    <ng-template #suffixTpl><svg class="custom-suffix"></svg></ng-template>
  `,
})
class FeaturesHost {
  readonly combobox = viewChild.required(AndesCombobox<string>);
  readonly options =
    signal<readonly AndesComboboxOptionEntry<string>[]>(FRUIT_OPTIONS);
  readonly control = new FormControl<string | null>(null);
  readonly defaultOpen = signal(false);
  readonly panelClass = signal<AndesComboboxPanelClass | undefined>(undefined);
  readonly required = signal(false);
  readonly name = signal<string | undefined>(undefined);
  readonly prefix = signal<string | undefined>(undefined);
  readonly useSuffix = signal(false);
  readonly loading = signal(false);
  readonly debounce = signal(0);
  readonly searches: string[] = [];
}

@Component({
  imports: [AndesCombobox],
  template: `
    <andes-combobox
      [options]="options"
      defaultOpen
      [itemToStringValue]="toName"
      [compareWith]="sameId"
      [(value)]="value"
      name="fruit"
      aria-label="Fruit"
    />
  `,
})
class ObjectHost {
  readonly options: readonly AndesComboboxOptionEntry<Fruit>[] = [
    { value: { id: 1, name: 'Apple' } },
    { value: { id: 2, name: 'Banana' } },
  ];
  readonly value = signal<Fruit | null>({ id: 2, name: 'Banana' });
  readonly toName = (fruit: Fruit) => fruit.name;
  readonly sameId = (a: Fruit, b: Fruit) => a.id === b.id;
}

@Component({
  imports: [
    AndesCombobox,
    AndesComboboxInput,
    AndesComboboxContent,
    AndesComboboxItem,
  ],
  template: `
    <andes-combobox #combobox [items]="items" id="projected">
      <div andesComboboxField class="addon-group">
        <span class="addon">https://</span>
        <input andesComboboxInput aria-label="Site" />
      </div>
      <div andesComboboxContent>
        @for (item of combobox.filteredItems(); track item) {
          <div andesComboboxItem [value]="item">{{ item }}</div>
        }
      </div>
    </andes-combobox>
  `,
})
class FieldHost {
  readonly items = ['andes.dev', 'angular.dev'];
}

function setup<H>(component: new () => H) {
  const fixture: ComponentFixture<H> = TestBed.createComponent(component);
  fixture.detectChanges();
  const root = fixture.nativeElement as HTMLElement;
  const input = root.querySelector(
    'input:not([type="hidden"])',
  ) as HTMLInputElement;
  const panel = () => document.querySelector<HTMLElement>('[role="listbox"]');
  const detect = () => fixture.detectChanges();

  async function settle(): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  function type(text: string): void {
    input.value = text;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    detect();
  }

  return {
    fixture,
    host: fixture.componentInstance,
    root,
    input,
    panel,
    detect,
    settle,
    type,
  };
}

describe('AndesCombobox (field features)', () => {
  afterEach(() => {
    document
      .querySelectorAll('.cdk-overlay-container')
      .forEach((el) => el.remove());
  });

  it('puts the id on the input, not on the host, so a label names it', () => {
    const { root, input } = setup(FeaturesHost);

    expect(input.id).toBe('fruit-field');
    expect(root.querySelector('andes-combobox')?.hasAttribute('id')).toBe(
      false,
    );
    expect(root.querySelectorAll('#fruit-field')).toHaveLength(1);
  });

  it('opens once on render with defaultOpen, highlighting nothing', async () => {
    const { panel, settle } = setup(ObjectHost);
    await settle();

    expect(panel()).toBeTruthy();
    expect(panel()?.querySelectorAll('[data-active]').length).toBe(0);
  });

  it('adds panelClass to the popup element', () => {
    const { host, input, panel, detect } = setup(FeaturesHost);
    host.panelClass.set(['wide', 'tinted']);
    detect();

    input.dispatchEvent(new Event('focus'));
    detect();

    expect(panel()?.classList).toContain('andes-combobox-content');
    expect(panel()?.classList).toContain('wide');
    expect(panel()?.classList).toContain('tinted');
  });

  it('marks the field required, natively and for assistive tech', () => {
    const { host, input, detect } = setup(FeaturesHost);
    host.required.set(true);
    detect();

    expect(input.required).toBe(true);
    expect(input.getAttribute('aria-required')).toBe('true');
  });

  it('submits the value through a hidden input, objects as JSON', async () => {
    const { root, settle } = setup(ObjectHost);
    await settle();

    const hidden = root.querySelector<HTMLInputElement>(
      '[data-slot="combobox-form-value"]',
    );
    expect(hidden?.name).toBe('fruit');
    expect(hidden?.value).toBe('{"id":2,"name":"Banana"}');
  });

  it('renders no hidden input without a name, or without a value', () => {
    const { host, root, detect } = setup(FeaturesHost);
    expect(root.querySelector('[data-slot="combobox-form-value"]')).toBeNull();

    host.name.set('fruit');
    detect();
    expect(root.querySelector('[data-slot="combobox-form-value"]')).toBeNull();

    host.control.setValue('apple');
    detect();
    expect(
      root.querySelector<HTMLInputElement>('[data-slot="combobox-form-value"]')
        ?.value,
    ).toBe('apple');
  });

  it('shows a prefix at the start and reserves room for it', () => {
    const { host, root, input, detect } = setup(FeaturesHost);
    host.prefix.set('$');
    detect();

    const prefix = root.querySelector('.andes-combobox-prefix');
    expect(prefix?.textContent?.trim()).toBe('$');
    expect(prefix?.getAttribute('aria-hidden')).toBe('true');
    expect(input.hasAttribute('data-prefix')).toBe(true);
  });

  it('shows a suffix icon after the spinner and counts it in the reserved room', () => {
    const { host, root, input, detect, type } = setup(FeaturesHost);
    host.useSuffix.set(true);
    host.loading.set(true);
    detect();
    type('a');

    const suffix = root.querySelector('.andes-combobox-suffix');
    expect(
      suffix?.lastElementChild?.querySelector('.custom-suffix'),
    ).toBeTruthy();
    expect(input.getAttribute('data-suffix')).toBe('3');
  });

  describe('searchDebounce', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it('waits for a pause in typing before emitting searchChange', () => {
      const { host, detect, type } = setup(FeaturesHost);
      host.debounce.set(300);
      detect();

      type('a');
      vi.advanceTimersByTime(100);
      type('ap');
      vi.advanceTimersByTime(299);
      expect(host.searches).toEqual([]);

      vi.advanceTimersByTime(1);
      expect(host.searches).toEqual(['ap']);
    });

    it('still filters the list on every keystroke', () => {
      const { host, detect, type } = setup(FeaturesHost);
      host.debounce.set(300);
      detect();

      type('ban');

      expect(
        Array.from(document.querySelectorAll('[role="option"]')).map((el) =>
          el.textContent?.trim(),
        ),
      ).toEqual(['Banana']);
    });

    it('emits the cleared text at once, dropping a pending one', () => {
      const { host, detect, type } = setup(FeaturesHost);
      host.debounce.set(300);
      detect();

      type('ap');
      host.combobox().clearValue();
      vi.advanceTimersByTime(300);

      expect(host.searches).toEqual(['']);
    });
  });

  it('projects a wrapper around the input, keeping the combobox wiring on the input', () => {
    const { root, input, detect } = setup(FieldHost);

    expect(root.querySelector('.addon-group .addon')?.textContent).toBe(
      'https://',
    );
    expect(input.getAttribute('role')).toBe('combobox');
    expect(input.id).toBe('projected');
    // Its own accessible name stays, as the root sets none.
    expect(input.getAttribute('aria-label')).toBe('Site');
    input.dispatchEvent(new Event('focus'));
    detect();
    expect(input.getAttribute('aria-expanded')).toBe('true');
  });

  it('shows an object value through itemToStringValue and compareWith', async () => {
    const { input, settle } = setup(ObjectHost);
    await settle();

    expect(input.value).toBe('Banana');
    expect(
      document
        .querySelector('[role="option"][aria-selected="true"]')
        ?.textContent?.trim(),
    ).toBe('Banana');
  });
});
