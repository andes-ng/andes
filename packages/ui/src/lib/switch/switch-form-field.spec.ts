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
import { AndesSwitch } from './switch';

@Component({
  selector: 'andes-test-andes-switch-field-host',
  imports: [
    ReactiveFormsModule,
    AndesForm,
    AndesFormField,
    AndesFormDescription,
    AndesSwitch,
  ],
  template: `<form
    andesForm
    [formGroup]="group"
    size="lg"
    variant="filled"
    [disabled]="disabled()"
  >
    <andes-form-field label="Label">
      <andes-switch formControlName="value" />
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

describe('AndesSwitch in a form field', () => {
  itBindsToTheField(() => TestBed.createComponent(FieldHost), 'andes-switch', {
    idTarget: '[role=switch]',
    labelable: true,
    invalid: '[role=switch]',
    required: (c) =>
      c.querySelector('[role=switch]')?.getAttribute('aria-required') ===
      'true',
    size: (c) =>
      c.querySelector('[role=switch]')?.getAttribute('data-size') ?? null,
    disabled: (c) =>
      (c.querySelector('[role=switch]') as HTMLButtonElement).disabled,
    touch: touchFirst('[role=switch]'),
  });
});
