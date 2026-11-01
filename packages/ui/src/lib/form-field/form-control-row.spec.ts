import { readFileSync } from 'node:fs';

import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

import { declaredValue } from '../../testing/computed-style';
import { AndesForm } from './form';
import { AndesFormControl } from './form-control';
import { AndesFormField } from './form-field';
import { AndesFormIcon } from './form-icons';

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

describe('AndesFormIcon', () => {
  @Component({
    imports: [AndesFormIcon],
    template: `@for (name of names; track name) {
      <andes-form-icon [name]="name" />
    }`,
  })
  class IconsHost {
    readonly names = [
      'help',
      'minus',
      'minus-circle',
      'plus',
      'grip',
      'chevron-up',
      'chevron-down',
    ] as const;
  }

  it('draws one decorative svg per name', () => {
    const fixture = TestBed.createComponent(IconsHost);
    fixture.detectChanges();
    const icons = Array.from(
      fixture.nativeElement.querySelectorAll('andes-form-icon svg'),
    ) as SVGElement[];

    expect(icons).toHaveLength(7);
    for (const svg of icons) {
      expect(svg.getAttribute('aria-hidden')).toBe('true');
      expect(svg.children.length).toBeGreaterThan(0);
    }
  });

  it('draws the question-circle as a circle with a question mark', () => {
    const fixture = TestBed.createComponent(IconsHost);
    fixture.detectChanges();
    const help = fixture.nativeElement.querySelector('andes-form-icon svg');

    expect(help.querySelector('circle')).toBeTruthy();
    expect(help.querySelectorAll('path')).toHaveLength(2);
  });

  it('draws the minus-circle as a circle with one horizontal bar', () => {
    const fixture = TestBed.createComponent(IconsHost);
    fixture.detectChanges();
    const icon = fixture.nativeElement.querySelectorAll(
      'andes-form-icon svg',
    )[2] as SVGElement;

    expect(icon.querySelector('circle')).toBeTruthy();
    expect(icon.querySelector('path')?.getAttribute('d')).toBe('M8 12h8');
  });
});
