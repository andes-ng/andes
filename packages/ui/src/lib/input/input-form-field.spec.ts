import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { FormField, form, required } from '@angular/forms/signals';

import {
  itBindsToTheField,
  touchFirst,
} from '../../testing/form-field-contract';
import { AndesForm } from '../form-field/form';
import { AndesFormControl } from '../form-field/form-control';
import { AndesFormDescription } from '../form-field/form-description';
import { AndesFormField } from '../form-field/form-field';
import { AndesInput } from './input';

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
  selector: 'andes-test-andes-input-field-host',
  imports: [
    ReactiveFormsModule,
    AndesForm,
    AndesFormField,
    AndesFormDescription,
    AndesInput,
  ],
  template: `<form
    andesForm
    [formGroup]="group"
    size="lg"
    variant="filled"
    [disabled]="disabled()"
  >
    <andes-form-field label="Label">
      <andes-input formControlName="value" />
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

describe('AndesInput in a form field', () => {
  itBindsToTheField(() => TestBed.createComponent(FieldHost), 'andes-input', {
    idTarget: 'input',
    labelable: true,
    invalid: 'input',
    required: (c) => (c.querySelector('input') as HTMLInputElement).required,
    size: (c) =>
      sizeClass(c.querySelector('.andes-input-group'), 'andes-input-group'),
    variant: (c) =>
      c.querySelector('.andes-input-group--filled') ? 'filled' : null,
    disabled: (c) => (c.querySelector('input') as HTMLInputElement).disabled,
    touch: touchFirst('input'),
  });
});

@Component({
  selector: 'andes-test-input-signal-field-host',
  imports: [AndesFormField, AndesInput, FormField],
  template: `<andes-form-field label="Name">
    <andes-input [formField]="signup.name" />
  </andes-form-field>`,
})
class SignalFieldHost {
  readonly model = signal({ name: '' });
  readonly signup = form(this.model, (path) => {
    required(path.name);
  });
}

@Component({
  selector: 'andes-test-input-directive-host',
  imports: [
    ReactiveFormsModule,
    AndesFormField,
    AndesFormControl,
    AndesFormDescription,
    AndesInput,
  ],
  template: `<andes-form-field label="Name" #field="andesFormField">
    <andes-input
      andesFormControl
      #ctrl="andesFormControl"
      [formControl]="name"
      [id]="field.controlId()"
      [aria-describedby]="ctrl.describedBy()"
      [aria-invalid]="field.showError()"
    />
    <andes-form-description>Hint</andes-form-description>
  </andes-form-field>`,
})
class DirectiveHost {
  readonly name = new FormControl('', Validators.required);
}

describe('AndesInput in a form field - other bindings', () => {
  it('binds a signal forms [formField] with no andesFormControl', async () => {
    const fixture = TestBed.createComponent(SignalFieldHost);
    fixture.detectChanges();
    await fixture.whenStable();
    const input = fixture.nativeElement.querySelector('input');
    input.dispatchEvent(new FocusEvent('blur'));
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector('.andes-form-label__required'),
    ).not.toBeNull();
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.id).toBe(fixture.nativeElement.querySelector('label').htmlFor);
  });

  it('keeps working with andesFormControl and the old manual binding, ids listed once', async () => {
    const fixture = TestBed.createComponent(DirectiveHost);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input');
    const hint = fixture.nativeElement.querySelector('.andes-form-description');

    expect(input.getAttribute('aria-describedby')).toBe(hint.id);
    expect(document.querySelectorAll(`[id="${input.id}"]`)).toHaveLength(1);
  });
});
