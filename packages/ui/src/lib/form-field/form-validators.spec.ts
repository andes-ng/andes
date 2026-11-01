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
import { resolveAndesFormErrorMessages } from './form-error-messages';
import { AndesFormField } from './form-field';
import { AndesValidators } from './form-validators';

const check = (validator: (c: FormControl) => unknown, value: unknown) =>
  validator(new FormControl(value));

describe('AndesValidators', () => {
  it('notBlank fails whitespace only, and leaves empty values to required', () => {
    expect(check(AndesValidators.notBlank, '   ')).toEqual({ blank: true });
    expect(check(AndesValidators.notBlank, ' a ')).toBeNull();
    expect(check(AndesValidators.notBlank, '')).toBeNull();
    expect(check(AndesValidators.notBlank, null)).toBeNull();
  });

  it('exactLength checks strings and arrays', () => {
    const four = AndesValidators.exactLength(4);

    expect(check(four, '1234')).toBeNull();
    expect(check(four, '123')).toEqual({
      exactlength: { requiredLength: 4, actualLength: 3 },
    });
    expect(check(four, [1, 2, 3, 4, 5])).toEqual({
      exactlength: { requiredLength: 4, actualLength: 5 },
    });
    expect(check(four, '')).toBeNull();
  });

  it('url accepts absolute http(s) URLs, or the schemes given', () => {
    const url = AndesValidators.url();

    expect(check(url, 'https://example.com/a?b=c')).toBeNull();
    expect(check(url, 'example.com')).toEqual({
      url: { protocols: 'http, https' },
    });
    expect(check(url, 'ftp://example.com')).not.toBeNull();
    expect(
      check(AndesValidators.url({ protocols: ['ftp'] }), 'ftp://example.com'),
    ).toBeNull();
    expect(check(url, '')).toBeNull();
  });

  it('oneOf accepts only the listed values', () => {
    const size = AndesValidators.oneOf(['sm', 'md', 'lg']);

    expect(check(size, 'md')).toBeNull();
    expect(check(size, 'xl')).toEqual({ oneOf: { allowed: 'sm, md, lg' } });
    expect(check(size, null)).toBeNull();
  });

  it('matchField compares with another control of the same form', () => {
    const group = new FormGroup({
      password: new FormControl('secret'),
      confirm: new FormControl('other', AndesValidators.matchField('password')),
    });
    // A control validates once when created, before it joins its group.
    group.controls.confirm.updateValueAndValidity();

    expect(group.controls.confirm.errors).toEqual({
      mismatch: { field: 'password' },
    });

    group.controls.confirm.setValue('secret');

    expect(group.controls.confirm.errors).toBeNull();
  });

  it('has a built-in message for every error key', () => {
    expect(
      resolveAndesFormErrorMessages(
        {
          blank: true,
          exactlength: { requiredLength: 4, actualLength: 3 },
          url: { protocols: 'http, https' },
          oneOf: { allowed: 'sm, md, lg' },
          mismatch: { field: 'password' },
        },
        [],
        undefined,
      ),
    ).toEqual([
      'This field cannot be blank.',
      'Enter exactly 4 characters.',
      'Enter a valid URL.',
      'Choose one of: sm, md, lg.',
      'The values do not match.',
    ]);
  });
});

@Component({
  selector: 'andes-test-confirm-host',
  imports: [ReactiveFormsModule, AndesForm, AndesFormField, AndesFormControl],
  template: `<form andesForm [formGroup]="group">
    <andes-form-field label="Password">
      <input andesFormControl formControlName="password" />
    </andes-form-field>
    <andes-form-field label="Confirm" dependsOn="password">
      <input andesFormControl formControlName="confirm" />
    </andes-form-field>
  </form>`,
})
class ConfirmHost {
  readonly group = new FormGroup({
    password: new FormControl('', Validators.required),
    confirm: new FormControl('', [
      Validators.required,
      AndesValidators.matchField('password'),
    ]),
  });
}

describe('AndesValidators.matchField in a form', () => {
  it('shows the mismatch on the confirmation, re-checked when the password changes', async () => {
    const fixture = TestBed.createComponent(ConfirmHost);
    const { password, confirm } = fixture.componentInstance.group.controls;
    password.setValue('secret');
    confirm.setValue('secret');
    confirm.markAsTouched();
    fixture.detectChanges();
    await fixture.whenStable();
    const field =
      fixture.nativeElement.querySelectorAll('.andes-form-field')[1];

    expect(field.dataset.status).toBe('success');

    password.setValue('changed');
    fixture.detectChanges();

    expect(field.dataset.status).toBe('error');
    expect(field.textContent).toContain('The values do not match.');
  });
});
