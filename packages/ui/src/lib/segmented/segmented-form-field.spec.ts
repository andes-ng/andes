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
import { AndesSegmented } from './segmented';

@Component({
  selector: 'andes-test-andes-segmented-field-host',
  imports: [
    ReactiveFormsModule,
    AndesForm,
    AndesFormField,
    AndesFormDescription,
    AndesSegmented,
  ],
  template: `<form
    andesForm
    [formGroup]="group"
    size="lg"
    variant="filled"
    [disabled]="disabled()"
  >
    <andes-form-field label="Label">
      <andes-segmented formControlName="value" [options]="options" />
      <andes-form-description>Hint</andes-form-description>
    </andes-form-field>
  </form>`,
})
class FieldHost {
  readonly disabled = signal(false);
  readonly group = new FormGroup({
    value: new FormControl<unknown>(null, Validators.required),
  });
  readonly options = ['a', 'b'];
}

describe('AndesSegmented in a form field', () => {
  itBindsToTheField(
    () => TestBed.createComponent(FieldHost),
    'andes-segmented',
    {
      idTarget: 'andes-segmented',
      labelable: false,
      invalid: 'andes-segmented',
      required: (c) => c.getAttribute('aria-required') === 'true',
      size: (c) => c.getAttribute('data-size'),
      variant: (c) => c.getAttribute('data-variant'),
      disabled: (c) => c.hasAttribute('data-disabled'),
      touch: touchFirst('[role=radio]'),
    },
  );
});
