import { Component, signal, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

import {
  AndesCombobox,
  type AndesComboboxOptionEntry,
  type AndesComboboxSelectEvent,
} from './combobox';
import { AndesComboboxContent } from './combobox-content';
import { AndesComboboxInput } from './combobox-input';
import { AndesComboboxItem } from './combobox-item';

/** jsdom leaves `keyCode` at 0 on synthetic events; CDK's key manager reads that field. */
const KEY_CODES: Record<string, number> = {
  ArrowUp: 38,
  ArrowDown: 40,
  Enter: 13,
  Escape: 27,
  Backspace: 8,
};

const FRUIT_OPTIONS: readonly AndesComboboxOptionEntry<string>[] = [
  { value: 'apple', label: 'Apple' },
  { value: 'apricot', label: 'Apricot' },
  { value: 'banana', label: 'Banana' },
  { value: 'cherry', label: 'Cherry', disabled: true },
  { value: 'kiwi', label: 'Kiwi' },
];

@Component({
  imports: [AndesCombobox, ReactiveFormsModule],
  template: `
    <andes-combobox
      multiple
      [options]="options()"
      [formControl]="control"
      [maxCount]="maxCount()"
      [maxTagCount]="maxTagCount()"
      [allowCreate]="allowCreate()"
      [allowClear]="allowClear()"
      [readOnly]="readOnly()"
      name="fruit"
      placeholder="Pick fruit"
      aria-label="Fruit"
      (optionSelect)="selected.push($event)"
      (optionDeselect)="deselected.push($event)"
      (optionCreate)="created.push($event)"
      (searchChange)="searches.push($event)"
    />
  `,
})
class MultipleHost {
  readonly combobox = viewChild.required(AndesCombobox<string>);
  readonly options =
    signal<readonly AndesComboboxOptionEntry<string>[]>(FRUIT_OPTIONS);
  readonly control = new FormControl<readonly string[]>([]);
  readonly maxCount = signal<number | undefined>(undefined);
  readonly maxTagCount = signal<number | undefined>(undefined);
  readonly allowCreate = signal(false);
  readonly allowClear = signal(false);
  readonly readOnly = signal(false);
  readonly selected: AndesComboboxSelectEvent<string>[] = [];
  readonly deselected: AndesComboboxSelectEvent<string>[] = [];
  readonly created: string[] = [];
  readonly searches: string[] = [];
}

@Component({
  imports: [AndesCombobox],
  template: `
    <andes-combobox
      [options]="options()"
      [(value)]="value"
      allowCreate
      [createLabel]="createLabel()"
      aria-label="Tag"
      (optionCreate)="create($event)"
    />
  `,
})
class CreateHost {
  readonly options = signal<readonly AndesComboboxOptionEntry<string>[]>([
    { value: 'angular', label: 'Angular' },
    { value: 'signals', label: 'Signals' },
  ]);
  readonly value = signal<string | null>(null);
  readonly createLabel = signal('Add "{query}" as a new tag');
  readonly created: string[] = [];

  create(text: string): void {
    this.created.push(text);
    this.options.set([...this.options(), { value: text, label: text }]);
    this.value.set(text);
  }
}

@Component({
  imports: [
    AndesCombobox,
    AndesComboboxInput,
    AndesComboboxContent,
    AndesComboboxItem,
  ],
  template: `
    <andes-combobox
      #combobox
      [items]="items"
      multiple
      allowCreate
      [(values)]="values"
      (optionCreate)="created.push($event)"
    >
      <input andesComboboxInput aria-label="Fruit" />
      <div andesComboboxContent>
        @for (item of combobox.filteredItems(); track item) {
          <div andesComboboxItem [value]="item">{{ item }}</div>
        }
        @if (combobox.createCandidate(); as text) {
          <div andesComboboxItem create [value]="text">New {{ text }}</div>
        }
      </div>
    </andes-combobox>
  `,
})
class CompoundMultipleHost {
  readonly items = ['Apple', 'Banana'];
  readonly values = signal<readonly string[]>([]);
  readonly created: string[] = [];
}

function setup<H>(component: new () => H) {
  const fixture: ComponentFixture<H> = TestBed.createComponent(component);
  fixture.detectChanges();
  const host = fixture.componentInstance;
  const root = fixture.nativeElement as HTMLElement;
  const input = root.querySelector(
    'input:not([type="hidden"])',
  ) as HTMLInputElement;
  const options = () =>
    Array.from(document.querySelectorAll<HTMLElement>('[role="option"]'));
  const labels = () => options().map((el) => el.textContent?.trim());
  const panel = () => document.querySelector<HTMLElement>('[role="listbox"]');
  const tags = () =>
    Array.from(
      root.querySelectorAll<HTMLElement>('[data-slot="combobox-tag"]'),
    ).map((el) => el.textContent?.trim());
  const detect = () => fixture.detectChanges();

  function focus(): void {
    input.dispatchEvent(new Event('focus'));
    detect();
  }

  function type(text: string): void {
    input.value = text;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    detect();
  }

  function press(key: string): KeyboardEvent {
    const event = new KeyboardEvent('keydown', {
      key,
      bubbles: true,
      cancelable: true,
    });
    Object.defineProperty(event, 'keyCode', { get: () => KEY_CODES[key] ?? 0 });
    input.dispatchEvent(event);
    detect();
    return event;
  }

  function pick(label: string): void {
    const option = options().find((el) => el.textContent?.trim() === label);
    option?.dispatchEvent(
      new MouseEvent('mousedown', { bubbles: true, cancelable: true }),
    );
    detect();
  }

  return {
    fixture,
    host,
    root,
    input,
    options,
    labels,
    panel,
    tags,
    detect,
    focus,
    type,
    press,
    pick,
  };
}

describe('AndesCombobox (multiple and create)', () => {
  afterEach(() => {
    document
      .querySelectorAll('.cdk-overlay-container')
      .forEach((el) => el.remove());
  });

  describe('multiple', () => {
    it('adds each pick as a chip, writes the array to the form and keeps the list open', () => {
      const { host, focus, pick, tags, panel } = setup(MultipleHost);
      focus();

      pick('Apple');
      pick('Kiwi');

      expect(tags()).toEqual(['Apple', 'Kiwi']);
      expect(host.control.value).toEqual(['apple', 'kiwi']);
      expect(panel()).toBeTruthy();
      expect(host.selected.map((event) => event.value)).toEqual([
        'apple',
        'kiwi',
      ]);
    });

    it('marks the chosen options selected and the list multiselectable', () => {
      const { focus, pick, options, panel } = setup(MultipleHost);
      focus();

      pick('Apple');
      pick('Banana');

      expect(panel()?.getAttribute('aria-multiselectable')).toBe('true');
      expect(
        options()
          .filter((el) => el.getAttribute('aria-selected') === 'true')
          .map((el) => el.textContent?.trim()),
      ).toEqual(['Apple', 'Banana']);
    });

    it('removes a value picked again, and reports it', () => {
      const { host, focus, pick, tags } = setup(MultipleHost);
      focus();
      pick('Apple');

      pick('Apple');

      expect(tags()).toEqual([]);
      expect(host.control.value).toEqual([]);
      expect(host.deselected.map((event) => event.value)).toEqual(['apple']);
    });

    it('empties the typed filter after a pick', () => {
      const { host, focus, type, pick, input, labels } = setup(MultipleHost);
      focus();
      type('ap');
      expect(labels()).toEqual(['Apple', 'Apricot']);

      pick('Apricot');

      expect(input.value).toBe('');
      expect(labels()).toHaveLength(5);
      expect(host.searches.at(-1)).toBe('');
    });

    it('keeps the keyboard cursor on the row just toggled with Enter', () => {
      const { focus, press, options } = setup(MultipleHost);
      focus();
      press('ArrowDown');
      press('ArrowDown');

      press('Enter');

      const active = options().find((el) => el.hasAttribute('data-active'));
      expect(active?.textContent?.trim()).toBe('Apricot');
      expect(active?.getAttribute('aria-selected')).toBe('true');
    });

    it('removes a chip with its button, which has an accessible name', () => {
      const { host, root, focus, pick, tags, detect } = setup(MultipleHost);
      focus();
      pick('Apple');
      pick('Banana');

      const remove = root.querySelector<HTMLButtonElement>(
        '[data-slot="combobox-tag-remove"]',
      );
      expect(remove?.getAttribute('aria-label')).toBe('Remove Apple');
      expect(remove?.getAttribute('tabindex')).toBe('-1');
      remove?.click();
      detect();

      expect(tags()).toEqual(['Banana']);
      expect(host.control.value).toEqual(['banana']);
    });

    it('removes the last chip with Backspace in the empty input', () => {
      const { host, focus, pick, press, tags } = setup(MultipleHost);
      focus();
      pick('Apple');
      pick('Banana');

      const event = press('Backspace');

      expect(event.defaultPrevented).toBe(true);
      expect(tags()).toEqual(['Apple']);
      expect(host.deselected.map((entry) => entry.value)).toEqual(['banana']);
    });

    it('leaves Backspace to the text while there is some', () => {
      const { focus, pick, type, press, tags } = setup(MultipleHost);
      focus();
      pick('Apple');
      type('b');

      const event = press('Backspace');

      expect(event.defaultPrevented).toBe(false);
      expect(tags()).toEqual(['Apple']);
    });

    it('keeps a disabled option chip without a remove button, and Backspace skips it', () => {
      const { host, root, detect, press, tags, focus } = setup(MultipleHost);
      host.control.setValue(['cherry', 'apple']);
      detect();
      focus();

      const cherry = root.querySelector('[data-slot="combobox-tag"]');
      expect(cherry?.hasAttribute('data-disabled')).toBe(true);
      expect(cherry?.querySelector('button')).toBeNull();

      press('Backspace');
      press('Backspace');

      expect(tags()).toEqual(['Cherry']);
    });

    it('blocks the unchosen options once maxCount is reached', () => {
      const { host, detect, focus, pick, options, tags } = setup(MultipleHost);
      host.maxCount.set(2);
      detect();
      focus();
      pick('Apple');
      pick('Banana');

      const kiwi = options().find((el) => el.textContent?.trim() === 'Kiwi');
      expect(kiwi?.getAttribute('aria-disabled')).toBe('true');
      pick('Kiwi');
      expect(tags()).toEqual(['Apple', 'Banana']);

      // A chosen one stays removable.
      pick('Apple');
      expect(tags()).toEqual(['Banana']);
      expect(kiwi?.hasAttribute('aria-disabled')).toBe(false);
    });

    it('folds the chips past maxTagCount into a "+ N" chip listing them', () => {
      const { host, root, detect, tags } = setup(MultipleHost);
      host.maxTagCount.set(1);
      host.control.setValue(['apple', 'banana', 'kiwi']);
      detect();

      expect(tags()).toEqual(['Apple']);
      const rest = root.querySelector('[data-slot="combobox-tag-rest"]');
      expect(rest?.textContent?.trim()).toBe('+ 2');
      expect(rest?.getAttribute('title')).toBe('Banana, Kiwi');
    });

    it('hides the placeholder once a chip shows', () => {
      const { focus, pick, input } = setup(MultipleHost);
      expect(input.getAttribute('placeholder')).toBe('Pick fruit');
      focus();

      pick('Apple');

      expect(input.hasAttribute('placeholder')).toBe(false);
    });

    it('submits one hidden input per value with a native form', () => {
      const { host, root, detect } = setup(MultipleHost);
      host.control.setValue(['apple', 'kiwi']);
      detect();

      const hidden = Array.from(
        root.querySelectorAll<HTMLInputElement>(
          '[data-slot="combobox-form-value"]',
        ),
      );
      expect(hidden.map((el) => [el.name, el.value])).toEqual([
        ['fruit', 'apple'],
        ['fruit', 'kiwi'],
      ]);
    });

    it('clears every chip with the clear button', () => {
      const { host, root, detect, focus, pick } = setup(MultipleHost);
      host.allowClear.set(true);
      detect();
      focus();
      pick('Apple');

      root.querySelector<HTMLButtonElement>('.andes-combobox-clear')?.click();
      detect();

      expect(host.control.value).toEqual([]);
    });

    it('draws the box on the field, which the popup hangs from', () => {
      const { root, input } = setup(MultipleHost);

      const field = root.querySelector('.andes-combobox-field');
      expect(field?.hasAttribute('data-multiple')).toBe(true);
      expect(field?.getAttribute('data-size')).toBe('md');
      expect(input.hasAttribute('data-size')).toBe(false);
      expect(input.hasAttribute('data-variant')).toBe(false);
    });

    it('moves focus to the input on a press between the chips, opening the list', () => {
      const { root, input, panel, detect } = setup(MultipleHost);
      const selection = root.querySelector(
        '.andes-combobox-selection',
      ) as HTMLElement;
      const focusSpy = vi.spyOn(input, 'focus');

      const event = new MouseEvent('mousedown', {
        bubbles: true,
        cancelable: true,
      });
      selection.dispatchEvent(event);
      detect();

      expect(event.defaultPrevented).toBe(true);
      expect(focusSpy).toHaveBeenCalled();
      // The focus opens the list, as a click on the input does.
      expect(panel()).toBeTruthy();
    });

    it('offers no removal on a read-only field', () => {
      const { host, root, detect, press, tags } = setup(MultipleHost);
      host.control.setValue(['apple']);
      host.readOnly.set(true);
      detect();

      expect(
        root.querySelector('[data-slot="combobox-tag-remove"]'),
      ).toBeNull();
      press('Backspace');
      expect(tags()).toEqual(['Apple']);
    });
  });

  describe('allowCreate', () => {
    it('offers to create text no option is labelled with, at the end of the list', () => {
      const { focus, type, labels } = setup(CreateHost);
      focus();

      type('Sig');
      expect(labels()).toEqual(['Signals', 'Add "Sig" as a new tag']);

      type('signals');
      expect(labels()).toEqual(['Signals']);
    });

    it('creates with Enter when the create row is the only match', () => {
      const { host, focus, type, press, panel, input } = setup(CreateHost);
      focus();
      type('  Zoneless ');

      press('Enter');

      expect(host.created).toEqual(['Zoneless']);
      expect(host.value()).toBe('Zoneless');
      expect(panel()).toBeNull();
      expect(input.value).toBe('Zoneless');
    });

    it('creates with a click too, and shows no empty state next to it', () => {
      const { host, focus, type, pick, panel } = setup(CreateHost);
      focus();
      type('Router');

      expect(panel()?.querySelector('.andes-combobox-empty')).toBeNull();
      pick('Add "Router" as a new tag');

      expect(host.created).toEqual(['Router']);
    });

    it('takes a template as the label', () => {
      @Component({
        imports: [AndesCombobox],
        template: `
          <andes-combobox
            [options]="[]"
            allowCreate
            [createLabel]="tpl"
            aria-label="Tag"
          />
          <ng-template #tpl let-text
            ><b class="made">{{ text }}!</b></ng-template
          >
        `,
      })
      class TemplateHost {}

      const { focus, type, panel } = setup(TemplateHost);
      focus();
      type('x');

      expect(panel()?.querySelector('.made')?.textContent).toBe('x!');
    });

    it('creates in the multiple mode, emptying the filter and staying open', () => {
      const { host, focus, type, press, panel, input } = setup(MultipleHost);
      host.allowCreate.set(true);
      focus();
      type('Mango');

      press('Enter');

      expect(host.created).toEqual(['Mango']);
      expect(input.value).toBe('');
      expect(panel()).toBeTruthy();
    });

    it('does not offer a value already chosen in the multiple mode', () => {
      const { host, detect, focus, pick, type, labels } = setup(MultipleHost);
      host.allowCreate.set(true);
      host.options.set([]);
      host.control.setValue(['Fig']);
      detect();
      focus();
      pick('nothing');

      type('fig');

      expect(labels()).toEqual([]);
    });

    it('lets a compound list render its own create row', () => {
      const { host, focus, type, pick } = setup(CompoundMultipleHost);
      focus();
      type('Pear');

      pick('New Pear');

      expect(host.created).toEqual(['Pear']);
      expect(host.values()).toEqual([]);
    });

    it('writes [(values)] in the compound mode', () => {
      const { host, focus, pick, tags } = setup(CompoundMultipleHost);
      focus();

      pick('Banana');

      expect(host.values()).toEqual(['Banana']);
      expect(tags()).toEqual(['Banana']);
    });
  });
});
