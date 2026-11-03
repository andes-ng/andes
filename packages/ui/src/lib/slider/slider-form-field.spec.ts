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
import { AndesSlider } from './slider';

@Component({
  selector: 'andes-test-andes-slider-field-host',
  imports: [
    ReactiveFormsModule,
    AndesForm,
    AndesFormField,
    AndesFormDescription,
    AndesSlider,
  ],
  template: `<form
    andesForm
    [formGroup]="group"
    size="lg"
    variant="filled"
    [disabled]="disabled()"
  >
    <andes-form-field label="Label">
      <andes-slider formControlName="value" />
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

describe('AndesSlider in a form field', () => {
  itBindsToTheField(() => TestBed.createComponent(FieldHost), 'andes-slider', {
    idTarget: '[role=slider]',
    labelable: false,
    invalid: '[role=slider]',
    required: (c) => c.hasAttribute('data-required'),
    size: (c) => c.getAttribute('data-size'),
    disabled: (c) => c.hasAttribute('data-disabled'),
    touch: touchFirst('[role=slider]'),
  });
});
