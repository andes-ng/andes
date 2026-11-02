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
import { AndesSelect } from './select';
import { AndesSelectContent } from './select-content';
import { AndesSelectItem } from './select-item';
import { AndesSelectTrigger } from './select-trigger';
import { AndesSelectValue } from './select-value';

@Component({
  selector: 'andes-test-andes-select-field-host',
  imports: [
    ReactiveFormsModule,
    AndesForm,
    AndesFormField,
    AndesFormDescription,
    AndesSelect,
    AndesSelectContent,
    AndesSelectItem,
    AndesSelectTrigger,
    AndesSelectValue,
  ],
  template: `<form
    andesForm
    [formGroup]="group"
    size="lg"
    variant="filled"
    [disabled]="disabled()"
  >
    <andes-form-field label="Label">
      <andes-select formControlName="value"
        ><andes-select-trigger><andes-select-value /></andes-select-trigger
        ><andes-select-content
          ><andes-select-item value="a"
            >A</andes-select-item
          ></andes-select-content
        ></andes-select
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

describe('AndesSelect in a form field', () => {
  itBindsToTheField(() => TestBed.createComponent(FieldHost), 'andes-select', {
    idTarget: '[role=combobox]',
    labelable: true,
    invalid: '[role=combobox]',
    required: (c) =>
      c.querySelector('[role=combobox]')?.getAttribute('aria-required') ===
      'true',
    size: (c) =>
      c.querySelector('[data-size]')?.getAttribute('data-size') ?? null,
    variant: (c) =>
      c.querySelector('[data-variant]')?.getAttribute('data-variant') ?? null,
    disabled: (c) =>
      (c.querySelector('[role=combobox]') as HTMLButtonElement).disabled,
    touch: touchFirst('[role=combobox]'),
  });
});
