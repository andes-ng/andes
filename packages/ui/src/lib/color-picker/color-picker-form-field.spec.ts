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
import { AndesColorPicker } from './color-picker';

@Component({
  selector: 'andes-test-andes-color-picker-field-host',
  imports: [
    ReactiveFormsModule,
    AndesForm,
    AndesFormField,
    AndesFormDescription,
    AndesColorPicker,
  ],
  template: `<form
    andesForm
    [formGroup]="group"
    size="lg"
    variant="filled"
    [disabled]="disabled()"
  >
    <andes-form-field label="Label">
      <andes-color-picker formControlName="value" />
      <andes-form-description>Hint</andes-form-description>
    </andes-form-field>
  </form>`,
})
class FieldHost {
  readonly disabled = signal(false);
  readonly group = new FormGroup({
    value: new FormControl<unknown>(null, Validators.required),
  });
}

describe('AndesColorPicker in a form field', () => {
  itBindsToTheField(
    () => TestBed.createComponent(FieldHost),
    'andes-color-picker',
    {
      idTarget: 'button.andes-color-picker__trigger',
      labelable: true,
      invalid: 'button.andes-color-picker__trigger',
      required: (c) => c.hasAttribute('data-required'),
      size: (c) =>
        c
          .querySelector('button.andes-color-picker__trigger')
          ?.getAttribute('data-size') ?? null,
      disabled: (c) =>
        (
          c.querySelector(
            'button.andes-color-picker__trigger',
          ) as HTMLButtonElement
        ).disabled,
      touch: touchFirst('button.andes-color-picker__trigger'),
    },
  );
});
