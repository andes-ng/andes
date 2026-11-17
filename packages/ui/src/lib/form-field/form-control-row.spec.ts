import { readFileSync } from 'node:fs';

import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

import { declaredValue } from '../../testing/computed-style';
import { AndesForm } from './form';
import { AndesFormControl } from './form-control';
import { AndesFormField } from './form-field';

const CSS = readFileSync(
  'packages/ui/src/lib/form-field/form-field.css',
  'utf8',
);

@Component({
  imports: [ReactiveFormsModule, AndesForm, AndesFormField, AndesFormControl],
  template: `<form andesForm [layout]="layout">
    <andes-form-field label="Name">
      <input andesFormControl [formControl]="name" />
    </andes-form-field>
  </form>`,
})
class RowHost {
  layout: 'horizontal' | 'vertical' | 'inline' = 'horizontal';
  readonly name = new FormControl('');
}

describe('AndesFormField - one control row for every control', () => {
  it('gives the control area the height of a control and centres what is shorter on it', () => {
    expect(
      declaredValue(CSS, '.andes-form-field__control', 'min-height'),
    ).toContain('--_andes-form-control-height');
    expect(
      declaredValue(CSS, '.andes-form-field__control', 'align-content'),
    ).toBe('center');
  });

  it('puts an inline control on the top of its line, not on the text baseline', () => {
    expect(
      declaredValue(
        CSS,
        '.andes-form-field__control > :where(*)',
        'vertical-align',
      ),
    ).toBe('top');
  });

  it('uses the same control height for the label box, so both centre on one line', () => {
    expect(
      declaredValue(
        CSS,
        '.andes-form-field--horizontal > .andes-form-field__label',
        'min-height',
      ),
    ).toBe('var(--_andes-form-control-height)');
  });

  it.each(['horizontal', 'vertical', 'inline'] as const)(
    'renders the control area in the %s layout',
    (layout) => {
      const fixture = TestBed.createComponent(RowHost);
      fixture.componentInstance.layout = layout;
      fixture.detectChanges();
      const control = fixture.nativeElement.querySelector(
        '.andes-form-field__control',
      ) as HTMLElement;

      expect(control).toBeTruthy();
      expect(control.closest('.andes-form-field')?.classList).toContain(
        `andes-form-field--${layout}`,
      );
    },
  );
});
