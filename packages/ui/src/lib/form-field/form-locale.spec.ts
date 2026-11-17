import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import { AndesForm } from './form';
import { AndesFormControl } from './form-control';
import { ANDES_DEFAULT_FORM_ERROR_MESSAGES } from './form-error-messages';
import { AndesFormField } from './form-field';
import {
  ANDES_FORM_LOCALE_EN,
  ANDES_FORM_LOCALE_ES,
  provideAndesFormLocale,
} from './form-locale';

@Component({
  selector: 'andes-test-locale-host',
  imports: [ReactiveFormsModule, AndesForm, AndesFormField, AndesFormControl],
  template: `<form andesForm [formGroup]="group" requiredMark="optional">
    <andes-form-field label="Name" tooltip="As on your ID.">
      <input andesFormControl formControlName="name" />
    </andes-form-field>
    <andes-form-field label="Nickname" tooltipLabel="Ayuda">
      <input andesFormControl formControlName="nickname" />
    </andes-form-field>
  </form>`,
})
class LocaleHost {
  readonly group = new FormGroup({
    name: new FormControl('', Validators.required),
    nickname: new FormControl(''),
  });
}

describe('provideAndesFormLocale', () => {
  it('translates the optional mark, the tooltip button and the generated messages', () => {
    TestBed.configureTestingModule({
      providers: [provideAndesFormLocale(ANDES_FORM_LOCALE_ES)],
    });
    const fixture = TestBed.createComponent(LocaleHost);
    fixture.componentInstance.group.markAllAsTouched();
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelector('.andes-form-label__optional')?.textContent).toBe(
      '(opcional)',
    );
    expect(
      el
        .querySelector('.andes-form-label__tooltip-trigger')
        ?.getAttribute('aria-label'),
    ).toBe('Más información');
    expect(el.querySelector('.andes-form-field__help')?.textContent).toContain(
      'Este campo es obligatorio.',
    );
  });

  it('keeps English without a provider', () => {
    const fixture = TestBed.createComponent(LocaleHost);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelector('.andes-form-label__optional')?.textContent).toBe(
      ANDES_FORM_LOCALE_EN.optionalText,
    );
    expect(
      el
        .querySelector('.andes-form-label__tooltip-trigger')
        ?.getAttribute('aria-label'),
    ).toBe(ANDES_FORM_LOCALE_EN.tooltipLabel);
  });

  it('lets the Spanish locale cover every built-in message key', () => {
    expect(Object.keys(ANDES_FORM_LOCALE_ES.errorMessages).sort()).toEqual(
      Object.keys(ANDES_DEFAULT_FORM_ERROR_MESSAGES).sort(),
    );
  });
});
