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

/** The body of the first at-rule whose prelude is `prelude`, braces matched. jsdom evaluates
 *  neither container nor media queries, so the specs read the declared rules instead. */
function atRuleBody(css: string, prelude: string): string {
  const start = css.indexOf(`${prelude} {`);
  if (start < 0) {
    throw new Error(`no "${prelude}" block`);
  }
  let depth = 0;
  for (let i = css.indexOf('{', start); i < css.length; i++) {
    if (css[i] === '{') {
      depth++;
    } else if (css[i] === '}' && --depth === 0) {
      return css.slice(css.indexOf('{', start) + 1, i);
    }
  }
  throw new Error(`unclosed "${prelude}" block`);
}

const NARROW = atRuleBody(CSS, '@media (max-width: 575px)');

@Component({
  selector: 'andes-test-responsive-host',
  imports: [ReactiveFormsModule, AndesForm, AndesFormField, AndesFormControl],
  template: `<form andesForm layout="horizontal">
    <andes-form-field label="Name">
      <input andesFormControl [formControl]="name" />
    </andes-form-field>
  </form>`,
})
class ResponsiveHost {
  readonly name = new FormControl('');
}

describe('AndesForm - responsive horizontal layout', () => {
  it('never makes the form a size container, which would collapse it in a content-sized parent', () => {
    for (const layout of ['horizontal', 'vertical', 'inline']) {
      expect(declaredValue(CSS, `.andes-form--${layout}`, 'container')).toBe(
        undefined,
      );
      expect(
        declaredValue(CSS, `.andes-form--${layout}`, 'container-type'),
      ).toBe(undefined);
    }

    const fixture = TestBed.createComponent(ResponsiveHost);
    fixture.detectChanges();
    const form = fixture.nativeElement.querySelector('form');

    expect(form.classList).toContain('andes-form--horizontal');
    expect(
      fixture.nativeElement.querySelector('.andes-form-field').classList,
    ).toContain('andes-form-field--horizontal');
  });

  it('stacks horizontal fields on a screen 575px wide or less', () => {
    const field =
      '.andes-form-field--horizontal:not(.andes-form-field--no-style)';

    expect(declaredValue(NARROW, field, 'display')).toBe('flex');
    expect(declaredValue(NARROW, field, 'flex-direction')).toBe('column');
    // The control spans the form, not its own content width.
    expect(declaredValue(NARROW, field, 'align-items')).toBe('stretch');
  });

  it('puts the label above the control, at the start, 8px over it', () => {
    const label = '.andes-form-field--horizontal > .andes-form-field__label';

    expect(declaredValue(NARROW, label, 'justify-content')).toBe('flex-start');
    expect(declaredValue(NARROW, label, 'min-height')).toBe('0');
    expect(declaredValue(NARROW, label, 'padding-inline-end')).toBe('0');
    expect(declaredValue(NARROW, label, 'padding-block-end')).toBe(
      'var(--andes-space-2)',
    );
  });

  it('wraps long labels, drops the colon and the empty label column', () => {
    expect(
      declaredValue(
        NARROW,
        '.andes-form-field--horizontal:not(.andes-form-field--label-wrap) .andes-form-label',
        'white-space',
      ),
    ).toBe('normal');
    expect(
      declaredValue(
        NARROW,
        '.andes-form-field--horizontal .andes-form-label__colon',
        'display',
      ),
    ).toBe('none');
    expect(
      declaredValue(
        NARROW,
        '.andes-form-field--horizontal.andes-form-field--no-label > .andes-form-field__label',
        'display',
      ),
    ).toBe('none');
  });
});
