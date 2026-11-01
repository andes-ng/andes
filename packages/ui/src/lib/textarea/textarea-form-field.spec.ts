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
import { AndesTextarea } from './textarea';

@Component({
  selector: 'andes-test-andes-textarea-field-host',
  imports: [
    ReactiveFormsModule,
    AndesForm,
    AndesFormField,
    AndesFormDescription,
    AndesTextarea,
  ],
  template: `<form
    andesForm
    [formGroup]="group"
    size="lg"
    variant="filled"
    [disabled]="disabled()"
  >
    <andes-form-field label="Label">
      <andes-textarea formControlName="value" />
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

describe('AndesTextarea in a form field', () => {
  itBindsToTheField(
    () => TestBed.createComponent(FieldHost),
    'andes-textarea',
    {
      idTarget: 'textarea',
      labelable: true,
      invalid: 'textarea',
      required: (c) =>
        (c.querySelector('textarea') as HTMLTextAreaElement).required,
      size: (c) =>
        c.querySelector('textarea')?.getAttribute('data-size') ?? null,
      variant: (c) =>
        c.querySelector('.andes-textarea-wrapper--filled') ? 'filled' : null,
      disabled: (c) =>
        (c.querySelector('textarea') as HTMLTextAreaElement).disabled,
      touch: touchFirst('textarea'),
    },
  );
});
