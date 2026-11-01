import { Component, signal } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import {
  type AbstractControl,
  FormControl,
  FormGroup,
  FormGroupDirective,
  ReactiveFormsModule,
  type ValidationErrors,
  Validators,
} from '@angular/forms';
import { FormField, form, required } from '@angular/forms/signals';
import { By } from '@angular/platform-browser';

import { AndesInput } from '../input/input';
import { AndesForm } from './form';
import { AndesFormControl } from './form-control';
import { AndesFormField } from './form-field';

async function settle(fixture: ComponentFixture<unknown>): Promise<void> {
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
}

function blur(element: HTMLElement): void {
  element.dispatchEvent(new FocusEvent('focus'));
  element.dispatchEvent(new FocusEvent('blur'));
}

const fieldOf = (fixture: ComponentFixture<unknown>, index = 0) =>
  (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLElement>(
    '.andes-form-field',
  )[index];

@Component({
  selector: 'andes-test-signal-native-host',
  imports: [AndesFormField, AndesFormControl, FormField],
  template: `<andes-form-field label="Name">
    <input andesFormControl [formField]="f.name" />
  </andes-form-field>`,
})
class SignalNativeHost {
  readonly model = signal({ name: '' });
  readonly f = form(this.model, (path) => {
    required(path.name);
  });
}

@Component({
  selector: 'andes-test-signal-component-host',
  imports: [AndesFormField, AndesFormControl, AndesInput, FormField],
  template: `<andes-form-field label="Name">
    <andes-input andesFormControl [formField]="f.name" />
  </andes-form-field>`,
})
class SignalComponentHost {
  readonly model = signal({ name: '' });
  readonly f = form(this.model, (path) => {
    required(path.name);
  });
}

@Component({
  selector: 'andes-test-reset-native-host',
  imports: [ReactiveFormsModule, AndesForm, AndesFormField, AndesFormControl],
  template: `<form andesForm [formGroup]="group">
    <andes-form-field label="Name">
      <input andesFormControl formControlName="name" />
    </andes-form-field>
    <button type="submit">Save</button>
  </form>`,
})
class ResetNativeHost {
  readonly group = new FormGroup({
    name: new FormControl('', Validators.required),
  });
}

@Component({
  selector: 'andes-test-reset-component-host',
  imports: [
    ReactiveFormsModule,
    AndesForm,
    AndesFormField,
    AndesFormControl,
    AndesInput,
  ],
  template: `<form andesForm [formGroup]="group">
    <andes-form-field label="Name">
      <andes-input andesFormControl formControlName="name" />
    </andes-form-field>
    <button type="submit">Save</button>
  </form>`,
})
class ResetComponentHost {
  readonly group = new FormGroup({
    name: new FormControl('', Validators.required),
  });
}

@Component({
  selector: 'andes-test-rebind-host',
  imports: [ReactiveFormsModule, AndesFormField, AndesFormControl],
  template: `<andes-form-field label="Name">
    <input andesFormControl [formControl]="current()" />
  </andes-form-field>`,
})
class RebindHost {
  readonly first = new FormControl('', Validators.required);
  readonly second = new FormControl('ok', Validators.required);
  readonly current = signal(this.first);
}

const matching = (group: AbstractControl): ValidationErrors | null =>
  group.get('password')?.value === group.get('confirm')?.value
    ? null
    : { mismatch: true };

@Component({
  selector: 'andes-test-group-error-host',
  imports: [ReactiveFormsModule, AndesForm, AndesFormField, AndesFormControl],
  template: `<form andesForm [formGroup]="group">
    <andes-form-field label="Password">
      <input andesFormControl formControlName="password" />
    </andes-form-field>
    <andes-form-field
      label="Confirm"
      groupErrors="mismatch"
      [errorMessages]="{ mismatch: 'The passwords do not match.' }"
    >
      <input andesFormControl formControlName="confirm" />
    </andes-form-field>
  </form>`,
})
class GroupErrorHost {
  readonly group = new FormGroup(
    {
      password: new FormControl('abc'),
      confirm: new FormControl('xyz'),
    },
    { validators: matching },
  );
}

/** Compiles only if the documented manual binding type-checks against a library control under
 *  strictTemplates: `describedBy()` and `labelledBy()` return `string | undefined`. */
@Component({
  selector: 'andes-test-manual-binding-host',
  imports: [ReactiveFormsModule, AndesFormField, AndesFormControl, AndesInput],
  template: `<andes-form-field label="Name" #field="andesFormField">
    <andes-input
      andesFormControl
      #ctrl="andesFormControl"
      [formControl]="name"
      [id]="field.controlId()"
      [aria-describedby]="ctrl.describedBy()"
      [aria-labelledby]="ctrl.labelledBy()"
      [aria-invalid]="field.showError()"
    />
  </andes-form-field>`,
})
class ManualBindingHost {
  readonly name = new FormControl('', Validators.required);
}

@Component({
  selector: 'andes-test-explicit-id-host',
  imports: [ReactiveFormsModule, AndesFormField, AndesFormControl],
  template: `<andes-form-field label="Name" id="name">
    <input andesFormControl [formControl]="name" />
  </andes-form-field>`,
})
class ExplicitIdHost {
  readonly name = new FormControl('');
}

describe('AndesFormControl - regressions', () => {
  describe('signal forms', () => {
    it('binds [formField] on a native input inside a field without throwing', async () => {
      const fixture = TestBed.createComponent(SignalNativeHost);
      await settle(fixture);
      const input = fixture.nativeElement.querySelector('input');

      expect(fieldOf(fixture).dataset['status']).toBeUndefined();
      expect(
        fixture.nativeElement.querySelector('.andes-form-label__required'),
      ).not.toBeNull();

      blur(input);
      await settle(fixture);

      expect(fieldOf(fixture).dataset['status']).toBe('error');
      expect(input.getAttribute('aria-invalid')).toBe('true');
      expect(fieldOf(fixture).textContent).toContain('This field is required.');

      fixture.componentInstance.model.set({ name: 'Ada' });
      await settle(fixture);

      expect(fieldOf(fixture).dataset['status']).toBe('success');
    });

    it('binds [formField] on a library control inside a field without throwing', async () => {
      const fixture = TestBed.createComponent(SignalComponentHost);
      await settle(fixture);
      const input = fixture.nativeElement.querySelector('input');

      blur(input);
      await settle(fixture);

      expect(fieldOf(fixture).dataset['status']).toBe('error');
    });
  });

  describe('resetForm()', () => {
    for (const [name, host] of [
      ['a native input', ResetNativeHost],
      ['a library control', ResetComponentHost],
    ] as const) {
      it(`clears the error a failed submit revealed, with ${name}`, async () => {
        const fixture = TestBed.createComponent(host);
        await settle(fixture);
        fixture.nativeElement
          .querySelector('form')
          .dispatchEvent(
            new Event('submit', { bubbles: true, cancelable: true }),
          );
        await settle(fixture);

        expect(fieldOf(fixture).classList).toContain(
          'andes-form-field--invalid',
        );

        fixture.debugElement
          .query(By.directive(FormGroupDirective))
          .injector.get(FormGroupDirective)
          .resetForm();
        await settle(fixture);

        expect(fieldOf(fixture).classList).not.toContain(
          'andes-form-field--invalid',
        );
        expect(fieldOf(fixture).dataset['status']).toBeUndefined();
      });
    }
  });

  it('follows a [formControl] re-bound to another control', async () => {
    const fixture = TestBed.createComponent(RebindHost);
    await settle(fixture);
    blur(fixture.nativeElement.querySelector('input'));
    await settle(fixture);

    expect(fieldOf(fixture).dataset['status']).toBe('error');

    fixture.componentInstance.second.markAsTouched();
    fixture.componentInstance.current.set(fixture.componentInstance.second);
    await settle(fixture);

    expect(fieldOf(fixture).dataset['status']).toBe('success');

    // The old control no longer drives the field.
    fixture.componentInstance.first.setValue('changed');
    fixture.componentInstance.second.setValue('');
    await settle(fixture);

    expect(fieldOf(fixture).dataset['status']).toBe('error');
  });

  describe('group validator errors', () => {
    it('shows the adopted group error on the field once it is touched', async () => {
      const fixture = TestBed.createComponent(GroupErrorHost);
      await settle(fixture);

      expect(fieldOf(fixture, 1).dataset['status']).toBeUndefined();

      blur(fixture.nativeElement.querySelectorAll('input')[1]);
      await settle(fixture);
      const confirm = fieldOf(fixture, 1);

      expect(confirm.classList).toContain('andes-form-field--invalid');
      expect(confirm.textContent).toContain('The passwords do not match.');
      expect(
        fixture.nativeElement
          .querySelectorAll('input')[1]
          .getAttribute('aria-invalid'),
      ).toBe('true');
      // The field that does not adopt the key stays out of it.
      expect(fieldOf(fixture, 0).classList).not.toContain(
        'andes-form-field--invalid',
      );
    });

    it('clears once the group validator passes after a change to the other control', async () => {
      const fixture = TestBed.createComponent(GroupErrorHost);
      await settle(fixture);
      blur(fixture.nativeElement.querySelectorAll('input')[1]);
      await settle(fixture);

      fixture.componentInstance.group.controls.password.setValue('xyz');
      await settle(fixture);

      expect(fieldOf(fixture, 1).dataset['status']).toBe('success');
    });
  });

  it('types the manual binding snippet for library controls under strictTemplates', async () => {
    const fixture = TestBed.createComponent(ManualBindingHost);
    await settle(fixture);
    const input = fixture.nativeElement.querySelector(
      'andes-input input',
    ) as HTMLInputElement;
    const label = fixture.nativeElement.querySelector('label');

    expect(input.id).toBe(label.htmlFor);
    expect(input.getAttribute('aria-labelledby')).toBe(label.id);
  });

  it('puts an explicit field id on the control only, not on the field host too', async () => {
    const fixture = TestBed.createComponent(ExplicitIdHost);
    await settle(fixture);
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelectorAll('#name')).toHaveLength(1);
    expect(el.querySelector('#name')?.tagName).toBe('INPUT');
    expect(el.querySelector('andes-form-field')?.hasAttribute('id')).toBe(
      false,
    );
  });
});
