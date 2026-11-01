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
import { AndesToggleGroup } from './toggle-group';

@Component({
  selector: 'andes-test-andes-toggle-group-field-host',
  imports: [
    ReactiveFormsModule,
    AndesForm,
    AndesFormField,
    AndesFormDescription,
    AndesToggle,
    AndesToggleGroup,
  ],
  template: `<form
    andesForm
    [formGroup]="group"
    size="lg"
    variant="filled"
    [disabled]="disabled()"
  >
    <andes-form-field label="Label">
      <andes-toggle-group formControlName="value"
        ><andes-toggle value="a">A</andes-toggle
        ><andes-toggle value="b">B</andes-toggle></andes-toggle-group
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

describe('AndesToggleGroup in a form field', () => {
  itBindsToTheField(
    () => TestBed.createComponent(FieldHost),
    'andes-toggle-group',
    {
      idTarget: 'andes-toggle-group',
      labelable: false,
      // A group has no aria-invalid: every toggle shows the error status.
      invalid: (c) =>
        Array.from(c.querySelectorAll('andes-toggle')).every(
          (toggle) => toggle.getAttribute('data-status') === 'error',
        ),
      required: (c) => c.hasAttribute('data-required'),
      size: (c) =>
        c.querySelector('andes-toggle')?.getAttribute('data-size') ?? null,
      disabled: (c) =>
        Array.from(c.querySelectorAll('button')).every(
          (button) => button.disabled,
        ),
      touch: touchFirst('button'),
    },
  );
});
