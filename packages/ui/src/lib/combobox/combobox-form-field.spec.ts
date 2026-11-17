import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import {
  itBindsToTheField,
  touchFirst,
} from '../../testing/form-field-contract';
import { AndesForm } from '../form-field/form';
import { AndesFormDescription } from '../form-field/form-description';
import { AndesFormField } from '../form-field/form-field';
import { AndesCombobox } from './combobox';

@Component({
  selector: 'andes-test-andes-combobox-field-host',
  imports: [
    ReactiveFormsModule,
    AndesForm,
    AndesFormField,
    AndesFormDescription,
    AndesCombobox,
  ],
  template: `<form
    andesForm
    [formGroup]="group"
    size="lg"
    variant="filled"
    [disabled]="disabled()"
  >
    <andes-form-field label="Label">
      <andes-combobox formControlName="value" [options]="options" />
      <andes-form-description>Hint</andes-form-description>
    </andes-form-field>
  </form>`,
})
class FieldHost {
  readonly disabled = signal(false);
  readonly group = new FormGroup({
    value: new FormControl<unknown>(null, Validators.required),
  });
  readonly options = [{ value: 'a', label: 'A' }];
}

describe('AndesCombobox in a form field', () => {
  itBindsToTheField(
    () => TestBed.createComponent(FieldHost),
    'andes-combobox',
    {
      idTarget: 'input',
      labelable: true,
      invalid: 'input',
      required: (c) =>
        c.querySelector('input')?.getAttribute('aria-required') === 'true',
      size: (c) => c.querySelector('input')?.getAttribute('data-size') ?? null,
      variant: (c) =>
        c.querySelector('input')?.getAttribute('data-variant') ?? null,
      disabled: (c) => (c.querySelector('input') as HTMLInputElement).disabled,
      touch: touchFirst('input'),
    },
  );
});
