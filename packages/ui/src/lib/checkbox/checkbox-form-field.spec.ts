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
import { AndesCheckbox } from './checkbox';

/** The `sm` / `md` / `lg` modifier class a control renders, or `null`. */
function sizeClass(element: Element | null, block: string): string | null {
  for (const size of ['sm', 'md', 'lg']) {
    if (element?.classList.contains(`${block}--${size}`)) {
      return size;
    }
  }
  return null;
}

@Component({
  selector: 'andes-test-andes-checkbox-field-host',
  imports: [
    ReactiveFormsModule,
    AndesForm,
    AndesFormField,
    AndesFormDescription,
    AndesCheckbox,
  ],
  template: `<form
    andesForm
    [formGroup]="group"
    size="lg"
    variant="filled"
    [disabled]="disabled()"
  >
    <andes-form-field label="Label">
      <andes-checkbox formControlName="value" />
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

describe('AndesCheckbox in a form field', () => {
  itBindsToTheField(
    () => TestBed.createComponent(FieldHost),
    'andes-checkbox',
    {
      idTarget: 'input',
      labelable: true,
      invalid: 'input',
      required: (c) => (c.querySelector('input') as HTMLInputElement).required,
      size: (c) =>
        sizeClass(c.querySelector('.andes-checkbox'), 'andes-checkbox'),
      disabled: (c) => (c.querySelector('input') as HTMLInputElement).disabled,
      touch: touchFirst('input'),
    },
  );
});
