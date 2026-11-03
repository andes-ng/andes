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
import { AndesToggle } from './toggle';

@Component({
  selector: 'andes-test-andes-toggle-field-host',
  imports: [
    ReactiveFormsModule,
    AndesForm,
    AndesFormField,
    AndesFormDescription,
    AndesToggle,
  ],
  template: `<form
    andesForm
    [formGroup]="group"
    size="lg"
    variant="filled"
    [disabled]="disabled()"
  >
    <andes-form-field label="Label">
      <andes-toggle formControlName="value" />
      <andes-form-description>Hint</andes-form-description>
    </andes-form-field>
  </form>`,
})
class FieldHost {
  readonly disabled = signal(false);
  readonly group = new FormGroup({
    value: new FormControl<unknown>(null, Validators.requiredTrue),
  });
}

describe('AndesToggle in a form field', () => {
  itBindsToTheField(() => TestBed.createComponent(FieldHost), 'andes-toggle', {
    idTarget: 'button',
    labelable: true,
    // A pressed button has no aria-invalid: the error shows as its status.
    invalid: (c) => c.getAttribute('data-status') === 'error',
    required: (c) =>
      c.querySelector('button')?.hasAttribute('data-required') ?? false,
    size: (c) => c.getAttribute('data-size'),
    disabled: (c) => (c.querySelector('button') as HTMLButtonElement).disabled,
    touch: touchFirst('button'),
  });
});
