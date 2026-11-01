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
import { AndesRadio } from './radio';
import { AndesRadioGroup } from './radio-group';

@Component({
  selector: 'andes-test-andes-radio-group-field-host',
  imports: [
    ReactiveFormsModule,
    AndesForm,
    AndesFormField,
    AndesFormDescription,
    AndesRadio,
    AndesRadioGroup,
  ],
  template: `<form
    andesForm
    [formGroup]="group"
    size="lg"
    variant="filled"
    [disabled]="disabled()"
  >
    <andes-form-field label="Label">
      <andes-radio-group formControlName="value"
        ><andes-radio value="a">A</andes-radio
        ><andes-radio value="b">B</andes-radio></andes-radio-group
      >
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

describe('AndesRadioGroup in a form field', () => {
  itBindsToTheField(
    () => TestBed.createComponent(FieldHost),
    'andes-radio-group',
    {
      idTarget: 'andes-radio-group',
      labelable: false,
      invalid: 'andes-radio-group',
      required: (c) => c.getAttribute('aria-required') === 'true',
      size: (c) => c.getAttribute('data-size'),
      disabled: (c) =>
        Array.from(c.querySelectorAll('input')).every(
          (input) => input.disabled,
        ),
      touch: touchFirst('input'),
    },
  );
});
