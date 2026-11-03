import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import { AndesForm } from './form';
import { AndesFormControl } from './form-control';
import { AndesFormError } from './form-error';
import { AndesFormField } from './form-field';
import type { AndesFormClassNames, AndesFormStyles } from './form-field-tokens';

/** The value, or a failed test: a lookup the markup guarantees. */
function present<T>(value: T | null | undefined): T {
  if (value === null || value === undefined) {
    throw new Error('Expected a value, got ' + String(value));
  }
  return value;
}

@Component({
  selector: 'andes-test-parts-host',
  imports: [
    ReactiveFormsModule,
    AndesForm,
    AndesFormField,
    AndesFormControl,
    AndesFormError,
  ],
  template: `<form
    andesForm
    class="mine"
    style="color: red"
    [formGroup]="group"
    [classNames]="formClassNames()"
    [styles]="formStyles()"
  >
    <andes-form-field
      label="Name"
      extra="Shown on your badge."
      [classNames]="fieldClassNames()"
      [styles]="fieldStyles()"
    >
      <input andesFormControl formControlName="name" />
    </andes-form-field>
    <andes-form-field label="Bio" help="Short and sweet.">
      <input andesFormControl formControlName="bio" />
    </andes-form-field>
    <andes-form-field label="Code">
      <input andesFormControl formControlName="code" />
      <andes-form-error>Enter your code.</andes-form-error>
    </andes-form-field>
  </form>`,
})
class PartsHost {
  readonly formClassNames = signal<AndesFormClassNames>({});
  readonly formStyles = signal<AndesFormStyles>({});
  readonly fieldClassNames = signal<AndesFormClassNames>({});
  readonly fieldStyles = signal<AndesFormStyles>({});
  readonly group = new FormGroup({
    name: new FormControl('', Validators.required),
    bio: new FormControl('', Validators.required),
    code: new FormControl('', Validators.required),
  });
}

function setup(configure?: (host: PartsHost) => void) {
  const fixture = TestBed.createComponent(PartsHost);
  configure?.(fixture.componentInstance);
  fixture.detectChanges();
  const el = fixture.nativeElement as HTMLElement;
  const update = (fn: (host: PartsHost) => void) => {
    fn(fixture.componentInstance);
    fixture.detectChanges();
  };
  const field = (index: number) =>
    el.querySelectorAll<HTMLElement>('.andes-form-field')[index];
  const part = (index: number, name: string) =>
    field(index).querySelector<HTMLElement>(`.andes-form-field__${name}`);
  const showErrors = () => {
    fixture.componentInstance.group.markAllAsTouched();
    fixture.detectChanges();
  };
  return {
    fixture,
    el,
    update,
    field,
    part,
    showErrors,
    form: present(el.querySelector('form')),
  };
}

describe('AndesFormField - classNames and styles', () => {
  it('adds no class and no style until some are given', () => {
    const { field, part } = setup();

    expect(field(0).className).not.toContain('undefined');
    expect(field(0).getAttribute('style')).toBeNull();
    expect(part(0, 'label')?.getAttribute('style')).toBeNull();
    expect(part(0, 'control')?.getAttribute('style')).toBeNull();
    expect(part(0, 'label')?.className).toBe('andes-form-field__label');
  });

  it('adds a field’s classes to each of its parts, beside its own', () => {
    const { field, part, update } = setup();
    update((h) =>
      h.fieldClassNames.set({
        root: 'r1 r2',
        label: 'l',
        control: 'c',
        extra: 'x',
      }),
    );

    expect(field(0).classList).toContain('andes-form-field');
    expect(field(0).classList).toContain('r1');
    expect(field(0).classList).toContain('r2');
    expect(part(0, 'label')?.classList).toContain('andes-form-field__label');
    expect(part(0, 'label')?.classList).toContain('l');
    expect(part(0, 'control')?.classList).toContain('c');
    expect(part(0, 'extra')?.classList).toContain('x');
  });

  it('keeps the field’s own state classes when the root class changes', () => {
    const { field, update, showErrors } = setup();
    update((h) => h.fieldClassNames.set({ root: 'a' }));
    showErrors();
    expect(field(0).classList).toContain('andes-form-field--invalid');

    update((h) => h.fieldClassNames.set({ root: 'b' }));

    expect(field(0).classList).toContain('andes-form-field--invalid');
    expect(field(0).classList).toContain('b');
    expect(field(0).classList).not.toContain('a');
  });

  it('sets a field’s inline styles on each part', () => {
    const { field, part, update } = setup();
    update((h) =>
      h.fieldStyles.set({
        root: { 'background-color': 'yellow' },
        label: { 'font-weight': 700 },
        control: { 'padding-block': '2px' },
        extra: { 'font-style': 'italic' },
      }),
    );

    expect(field(0).style.backgroundColor).toBe('yellow');
    expect(part(0, 'label')?.style.fontWeight).toBe('700');
    expect(part(0, 'control')?.style.paddingBlock).toBe('2px');
    expect(part(0, 'extra')?.style.fontStyle).toBe('italic');
  });

  it('keeps the grid columns of a horizontal field next to a root style', () => {
    const { field, update } = setup();
    update((h) => h.fieldStyles.set({ root: { 'row-gap': '4px' } }));

    expect(field(0).style.rowGap).toBe('4px');
  });

  it('styles the generated error messages as the error part, and help text and warnings as help', () => {
    const { part, update, showErrors } = setup();
    update((h) => {
      h.fieldClassNames.set({ error: 'err', help: 'hlp' });
      h.fieldStyles.set({
        error: { 'letter-spacing': '1px' },
        help: { 'word-spacing': '2px' },
      });
    });
    showErrors();

    const messages = part(0, 'help') as HTMLElement;
    expect(messages.classList).toContain('err');
    expect(messages.classList).not.toContain('hlp');
    expect(messages.style.letterSpacing).toBe('1px');
    expect(messages.style.wordSpacing).toBe('');

    update((h) => h.group.controls.name.setValue('Ada'));
    expect(part(0, 'help')).toBeNull();
  });

  it('styles the help input’s text as the help part, even in an error', () => {
    const { part, update, showErrors } = setup();
    update((h) => h.formClassNames.set({ error: 'err', help: 'hlp' }));
    showErrors();

    const help = part(1, 'help') as HTMLElement;
    expect(help.textContent).toContain('Short and sweet.');
    expect(help.classList).toContain('hlp');
    expect(help.classList).not.toContain('err');
  });

  it('styles an <andes-form-error> as the error part', () => {
    const { el, update, showErrors } = setup();
    update((h) => {
      h.formClassNames.set({ error: 'err' });
      h.formStyles.set({ error: { 'letter-spacing': '3px' } });
    });
    showErrors();

    const error = present(el.querySelector<HTMLElement>('.andes-form-error'));
    expect(error.textContent).toContain('Enter your code.');
    expect(error.classList).toContain('err');
    expect(error.style.letterSpacing).toBe('3px');
  });
});

describe('AndesForm - classNames and styles', () => {
  it('puts the root classes and styles on the form element, beside its own', () => {
    const { form, update } = setup();
    update((h) => {
      h.formClassNames.set({ root: 'form-root' });
      h.formStyles.set({ root: { 'max-width': '30rem' } });
    });

    expect(form.classList).toContain('andes-form');
    expect(form.classList).toContain('mine');
    expect(form.classList).toContain('form-root');
    expect(form.style.maxWidth).toBe('30rem');
    expect(form.style.color).toBe('red');
  });

  it('is the default for the parts of every field in it', () => {
    const { part, update } = setup();
    update((h) => {
      h.formClassNames.set({ label: 'form-label', control: 'form-control' });
      h.formStyles.set({ label: { 'font-weight': 700 } });
    });

    for (const index of [0, 1, 2]) {
      expect(part(index, 'label')?.classList).toContain('form-label');
      expect(part(index, 'control')?.classList).toContain('form-control');
      expect(part(index, 'label')?.style.fontWeight).toBe('700');
    }
  });

  it('keeps the form’s root class off the fields', () => {
    const { field, update } = setup();
    update((h) => h.formClassNames.set({ root: 'form-root' }));

    expect(field(0).classList).not.toContain('form-root');
  });

  it('adds the field’s classes to the form’s, and lets the field’s styles win', () => {
    const { part, update } = setup();
    update((h) => {
      h.formClassNames.set({ label: 'form-label' });
      h.formStyles.set({
        label: { 'font-weight': 700, 'font-style': 'italic' },
      });
      h.fieldClassNames.set({ label: 'field-label' });
      h.fieldStyles.set({ label: { 'font-weight': 400 } });
    });

    const label = part(0, 'label') as HTMLElement;
    expect([...label.classList].sort()).toEqual([
      'andes-form-field__label',
      'field-label',
      'form-label',
    ]);
    expect(label.style.fontWeight).toBe('400');
    expect(label.style.fontStyle).toBe('italic');
    expect(part(1, 'label')?.style.fontWeight).toBe('700');
  });
});
