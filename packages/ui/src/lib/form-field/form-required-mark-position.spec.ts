import { readFileSync } from 'node:fs';

import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import { declaredValue } from '../../testing/computed-style';
import { AndesForm } from './form';
import { AndesFormControl } from './form-control';
import { AndesFormField } from './form-field';
import type {
  AndesFormLabelAlign,
  AndesFormLayout,
  AndesFormRequiredMark,
  AndesFormRequiredMarkPosition,
} from './form-field-tokens';

const CSS = readFileSync(
  'packages/ui/src/lib/form-field/form-field.css',
  'utf8',
);

@Component({
  selector: 'andes-test-mark-position-host',
  imports: [ReactiveFormsModule, AndesForm, AndesFormField, AndesFormControl],
  template: `<ng-template #tag let-required
      ><b class="custom-mark">{{ required }}</b></ng-template
    >
    <form
      andesForm
      [dir]="dir()"
      [formGroup]="group"
      [layout]="layout()"
      [labelAlign]="align()"
      [requiredMark]="useTemplate() ? tag : mark()"
      [requiredMarkPosition]="position()"
    >
      <andes-form-field label="Name" tooltip="Your legal name.">
        <input andesFormControl formControlName="name" />
      </andes-form-field>
      <andes-form-field label="Own" [requiredMarkPosition]="own()">
        <input andesFormControl formControlName="own" />
      </andes-form-field>
      <andes-form-field label="Nickname">
        <input andesFormControl formControlName="nickname" />
      </andes-form-field>
    </form>`,
})
class MarkHost {
  readonly dir = signal<'ltr' | 'rtl'>('ltr');
  readonly layout = signal<AndesFormLayout>('vertical');
  readonly align = signal<AndesFormLabelAlign>('right');
  readonly mark = signal<AndesFormRequiredMark>(true);
  readonly useTemplate = signal(false);
  readonly position = signal<AndesFormRequiredMarkPosition>('start');
  readonly own = signal<AndesFormRequiredMarkPosition | undefined>(undefined);
  readonly group = new FormGroup({
    name: new FormControl('', Validators.required),
    own: new FormControl('', Validators.required),
    nickname: new FormControl(''),
  });
}

function setup(configure?: (host: MarkHost) => void) {
  const fixture = TestBed.createComponent(MarkHost);
  configure?.(fixture.componentInstance);
  fixture.detectChanges();
  const el = fixture.nativeElement as HTMLElement;
  const update = (fn: (host: MarkHost) => void) => {
    fn(fixture.componentInstance);
    fixture.detectChanges();
  };
  /** The i-th field's label. */
  const label = (index: number) =>
    el
      .querySelectorAll('andes-form-field')
      [index].querySelector('label') as HTMLLabelElement;
  const star = (index: number) =>
    label(index).querySelector<HTMLElement>('.andes-form-label__required');
  /** Whether the asterisk comes before the label text. */
  const starFirst = (index: number) =>
    label(index).firstElementChild === star(index);
  /** Whether it comes after: nothing but the asterisk follows the text. */
  const starLast = (index: number) =>
    label(index).lastElementChild === star(index);
  return { fixture, el, update, label, star, starFirst, starLast };
}

describe('AndesForm / AndesFormField - requiredMarkPosition', () => {
  it('puts the asterisk before the label text by default', () => {
    const { star, starFirst, label } = setup();
    expect(star(0)?.textContent).toBe('*');
    expect(starFirst(0)).toBe(true);
    expect(label(0).textContent?.trim()).toBe('*Name');
    expect(star(0)?.classList).not.toContain('andes-form-label__required--end');
  });

  it('puts it after the text with requiredMarkPosition="end", still hidden from assistive technology', () => {
    const { star, starLast, label, update } = setup();
    update((h) => h.position.set('end'));
    expect(starLast(0)).toBe(true);
    expect(label(0).textContent?.trim()).toBe('Name*');
    expect(star(0)?.getAttribute('aria-hidden')).toBe('true');
    expect(star(0)?.classList).toContain('andes-form-label__required--end');
  });

  it('keeps the asterisk before the tooltip button, which sits outside the label', () => {
    const { label, update } = setup();
    update((h) => h.position.set('end'));
    const tooltip = label(0).nextElementSibling;
    expect(tooltip?.classList).toContain('andes-form-label__tooltip');
    expect(label(0).contains(tooltip)).toBe(false);
  });

  it('lets a field override the form, either way', () => {
    const { starFirst, starLast, update } = setup();
    update((h) => h.position.set('end'));
    update((h) => h.own.set('start'));
    expect(starLast(0)).toBe(true);
    expect(starFirst(1)).toBe(true);
    update((h) => h.position.set('start'));
    update((h) => h.own.set('end'));
    expect(starFirst(0)).toBe(true);
    expect(starLast(1)).toBe(true);
  });

  it('marks nothing on a field that is not required, whatever the position', () => {
    const { star, update } = setup();
    update((h) => h.position.set('end'));
    expect(star(2)).toBeNull();
  });

  describe.each<[AndesFormLayout, AndesFormLabelAlign]>([
    ['horizontal', 'right'],
    ['horizontal', 'left'],
    ['vertical', 'right'],
    ['inline', 'right'],
  ])('in a %s layout, labels aligned %s', (layout, align) => {
    it('follows the position', () => {
      const { el, update, starFirst, starLast } = setup((h) => {
        h.layout.set(layout);
        h.align.set(align);
      });
      expect(starFirst(0)).toBe(true);
      update((h) => h.position.set('end'));
      expect(starLast(0)).toBe(true);
      expect(
        el
          .querySelector('.andes-form-field')
          ?.classList.contains(`andes-form-field--${layout}`),
      ).toBe(true);
    });
  });

  it('draws the colon after the asterisk in a horizontal layout', () => {
    const { label, update } = setup((h) => h.layout.set('horizontal'));
    update((h) => h.position.set('end'));
    const colon = label(0).parentElement?.querySelector(
      '.andes-form-label__colon',
    );
    expect(colon).not.toBeNull();
    expect(
      label(0).compareDocumentPosition(colon as Node) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it('flips with the writing direction: the gap is a logical margin, on the side the mark faces', () => {
    const { el, update, starLast } = setup();
    update((h) => {
      h.dir.set('rtl');
      h.position.set('end');
    });
    expect(el.querySelector('form')?.getAttribute('dir')).toBe('rtl');
    expect(starLast(0)).toBe(true);
    // Margins are logical, so "after the text" is on the left in right-to-left text.
    expect(
      declaredValue(CSS, '.andes-form-label__required', 'margin-inline-end'),
    ).toBe('var(--andes-space-1)');
    expect(
      declaredValue(
        CSS,
        '.andes-form-label__required--end',
        'margin-inline-start',
      ),
    ).toBe('var(--andes-space-1)');
    expect(
      declaredValue(
        CSS,
        '.andes-form-label__required--end',
        'margin-inline-end',
      ),
    ).toBe('0');
    expect(CSS).not.toMatch(
      /\.andes-form-label__required[^{]*\{[^}]*margin-(left|right)/,
    );
  });

  describe('with the other mark styles', () => {
    it('leaves the optional suffix after the text, and no asterisk', () => {
      const { label, star, update } = setup();
      update((h) => {
        h.mark.set('optional');
        h.position.set('end');
      });
      expect(star(0)).toBeNull();
      expect(label(2).textContent?.replace(/\s+/g, ' ').trim()).toBe(
        'Nickname(optional)',
      );
      const optional = label(2).querySelector('.andes-form-label__optional');
      expect(label(2).lastElementChild).toBe(optional);
    });

    it('leaves a custom template after the text, whatever the position', () => {
      const { label, star, update } = setup();
      update((h) => h.useTemplate.set(true));
      const before = label(0).textContent?.replace(/\s+/g, ' ').trim();
      update((h) => h.position.set('end'));
      expect(star(0)).toBeNull();
      expect(label(0).textContent?.replace(/\s+/g, ' ').trim()).toBe(before);
      expect(label(0).lastElementChild?.classList).toContain('custom-mark');
    });

    it('hides the mark with requiredMark=false at either position', () => {
      const { star, update } = setup();
      update((h) => {
        h.mark.set(false);
        h.position.set('end');
      });
      expect(star(0)).toBeNull();
    });
  });
});
