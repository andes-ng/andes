import { Component, signal } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import {
  FormControl,
  FormGroup,
  FormGroupDirective,
  ReactiveFormsModule,
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
});
