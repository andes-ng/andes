import { Component, signal, viewChild } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import {
  type AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  type ValidationErrors,
  Validators,
} from '@angular/forms';

import { AndesForm } from './form';
import { AndesFormControl } from './form-control';
import { AndesFormField } from './form-field';
import type { AndesFormMessageMode } from './form-field-tokens';

async function settle(fixture: ComponentFixture<unknown>): Promise<void> {
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
}

function type(input: HTMLInputElement, value: string): void {
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

/** Same value as the control at `path` from the form root. */
function sameAs(path: string) {
  return (control: AbstractControl): ValidationErrors | null =>
    control.value === control.root.get(path)?.value ? null : { mismatch: true };
}

@Component({
  selector: 'andes-test-message-mode-host',
  imports: [ReactiveFormsModule, AndesForm, AndesFormField, AndesFormControl],
  template: `<form andesForm [messageMode]="formMode()">
    <andes-form-field label="Code">
      <input andesFormControl [formControl]="code" />
    </andes-form-field>
    <andes-form-field label="Other" [messageMode]="fieldMode()">
      <input andesFormControl [formControl]="other" />
    </andes-form-field>
  </form>`,
})
class MessageModeHost {
  readonly formMode = signal<AndesFormMessageMode>('first');
  readonly fieldMode = signal<AndesFormMessageMode | undefined>('all');
  readonly code = new FormControl('ab', [
    Validators.minLength(3),
    Validators.pattern(/^\d+$/),
  ]);
  readonly other = new FormControl('ab', [
    Validators.minLength(3),
    Validators.pattern(/^\d+$/),
  ]);
}

@Component({
  selector: 'andes-test-depends-on-host',
  imports: [ReactiveFormsModule, AndesForm, AndesFormField, AndesFormControl],
  template: `<form andesForm [formGroup]="group">
    <andes-form-field label="Password" dependsOn="confirm">
      <input andesFormControl formControlName="password" />
    </andes-form-field>
    <andes-form-field label="Confirm" [dependsOn]="['password']">
      <input andesFormControl formControlName="confirm" />
    </andes-form-field>
  </form>`,
})
class DependsOnHost {
  readonly group = new FormGroup({
    password: new FormControl('a', sameAs('confirm')),
    confirm: new FormControl('a', sameAs('password')),
  });
}

@Component({
  selector: 'andes-test-ids-host',
  imports: [ReactiveFormsModule, AndesForm, AndesFormField, AndesFormControl],
  template: `<form andesForm name="signup" [formGroup]="group">
    <div formGroupName="address">
      <andes-form-field label="City">
        <input andesFormControl formControlName="city" />
      </andes-form-field>
    </div>
    <andes-form-field label="Explicit" id="mine">
      <input andesFormControl formControlName="zip" />
    </andes-form-field>
    <andes-form-field label="Points elsewhere" htmlFor="elsewhere">
      <input andesFormControl formControlName="other" />
    </andes-form-field>
    <andes-form-field label="Not associated" [htmlFor]="null">
      <input andesFormControl formControlName="last" />
    </andes-form-field>
  </form>`,
})
class IdsHost {
  readonly group = new FormGroup({
    address: new FormGroup({ city: new FormControl('') }),
    zip: new FormControl(''),
    other: new FormControl(''),
    last: new FormControl(''),
  });
}

@Component({
  selector: 'andes-test-label-click-host',
  imports: [ReactiveFormsModule, AndesFormField, AndesFormControl],
  template: `<andes-form-field label="Country" id="country">
      <button
        id="country"
        type="button"
        aria-haspopup="listbox"
        (click)="opened = opened + 1"
      >
        Pick
      </button>
    </andes-form-field>
    <andes-form-field label="Accept">
      <input type="checkbox" andesFormControl [formControl]="accept" />
    </andes-form-field>`,
})
class LabelClickHost {
  opened = 0;
  readonly accept = new FormControl(false);
}

@Component({
  selector: 'andes-test-imperative-host',
  imports: [ReactiveFormsModule, AndesForm, AndesFormField, AndesFormControl],
  template: `<form
      andesForm
      #f="andesForm"
      [formGroup]="group"
      scrollToFirstError
      (ngSubmit)="submits = submits + 1"
      (validSubmit)="valid.push($event)"
      (invalidSubmit)="invalid = invalid + 1"
      (valuesChange)="values.push($event)"
      (formReset)="resets = resets + 1"
    >
      <andes-form-field label="Secret" hidden>
        <input andesFormControl formControlName="secret" />
      </andes-form-field>
      <andes-form-field label="Name">
        <input andesFormControl formControlName="name" />
      </andes-form-field>
      <button type="reset">Clear</button>
    </form>
    <button type="button" (click)="f.submit()">Save from outside</button>`,
})
class ImperativeHost {
  readonly form = viewChild.required<AndesForm>('f');
  submits = 0;
  invalid = 0;
  resets = 0;
  readonly valid: unknown[] = [];
  readonly values: unknown[] = [];
  readonly group = new FormGroup({
    secret: new FormControl('', Validators.required),
    name: new FormControl('', Validators.required),
  });
}

const helpOf = (el: HTMLElement, index: number): string[] =>
  Array.from(
    el
      .querySelectorAll('.andes-form-field')
      [index].querySelectorAll('.andes-form-field__help-item'),
    (item) => item.textContent?.trim() ?? '',
  );

describe('AndesForm - field features', () => {
  describe('messageMode', () => {
    it('shows only the first message, from the form, unless a field asks for all', async () => {
      const fixture = TestBed.createComponent(MessageModeHost);
      fixture.componentInstance.code.markAsTouched();
      fixture.componentInstance.other.markAsTouched();
      await settle(fixture);
      const el = fixture.nativeElement as HTMLElement;

      expect(helpOf(el, 0)).toEqual(['Enter at least 3 characters.']);
      expect(helpOf(el, 1)).toHaveLength(2);

      fixture.componentInstance.fieldMode.set(undefined);
      fixture.componentInstance.formMode.set('all');
      await settle(fixture);

      expect(helpOf(el, 0)).toHaveLength(2);
      expect(helpOf(el, 1)).toHaveLength(2);
    });
  });

  describe('dependsOn', () => {
    it('re-validates a control when the one it depends on changes', async () => {
      const fixture = TestBed.createComponent(DependsOnHost);
      await settle(fixture);
      const [password, confirm] = fixture.nativeElement.querySelectorAll(
        'input',
      ) as NodeListOf<HTMLInputElement>;
      const controls = fixture.componentInstance.group.controls;

      type(password, 'abc');
      await settle(fixture);

      expect(controls.confirm.errors).toEqual({ mismatch: true });

      type(confirm, 'abc');
      await settle(fixture);

      // Both ways, without the two fields re-validating each other forever.
      expect(controls.password.errors).toBeNull();
      expect(controls.confirm.errors).toBeNull();
    });
  });

  describe('ids and label association', () => {
    it('builds ids from the form name and the control path', async () => {
      const fixture = TestBed.createComponent(IdsHost);
      await settle(fixture);
      const inputs = fixture.nativeElement.querySelectorAll('input');
      const labels = fixture.nativeElement.querySelectorAll('label');

      expect(inputs[0].id).toBe('signup_address_city');
      expect(labels[0].htmlFor).toBe('signup_address_city');
      expect(inputs[1].id).toBe('mine');
    });

    it('points the label elsewhere with htmlFor, or nowhere with null', async () => {
      const fixture = TestBed.createComponent(IdsHost);
      await settle(fixture);
      const labels = fixture.nativeElement.querySelectorAll('label');

      expect(labels[2].getAttribute('for')).toBe('elsewhere');
      expect(labels[3].hasAttribute('for')).toBe(false);
      // The control keeps its own id either way.
      expect(fixture.nativeElement.querySelectorAll('input')[3].id).toBe(
        'signup_last',
      );
    });

    it('focuses a popup control on label click instead of opening it, and still toggles a checkbox', async () => {
      const fixture = TestBed.createComponent(LabelClickHost);
      await settle(fixture);
      const [countryLabel, acceptLabel] =
        fixture.nativeElement.querySelectorAll('label');
      const button = fixture.nativeElement.querySelector('button');

      countryLabel.click();

      expect(fixture.componentInstance.opened).toBe(0);
      expect(document.activeElement).toBe(button);

      acceptLabel.click();

      expect(fixture.componentInstance.accept.value).toBe(true);
    });
  });

  describe('submit(), reset() and their outputs', () => {
    it('submits from outside the form, and skips a hidden invalid field when focusing', async () => {
      const fixture = TestBed.createComponent(ImperativeHost);
      await settle(fixture);
      const outside = fixture.nativeElement.querySelector(
        'form + button',
      ) as HTMLButtonElement;

      outside.click();
      await settle(fixture);
      await settle(fixture);

      expect(fixture.componentInstance.submits).toBe(1);
      expect(fixture.componentInstance.invalid).toBe(1);
      expect(document.activeElement).toBe(
        fixture.nativeElement.querySelectorAll('input')[1],
      );
    });

    it('emits every value change, and resets values, state and errors with reset()', async () => {
      const fixture = TestBed.createComponent(ImperativeHost);
      await settle(fixture);
      const host = fixture.componentInstance;
      const name = fixture.nativeElement.querySelectorAll('input')[1];

      type(name, 'Ada');
      await settle(fixture);

      expect(host.values.at(-1)).toEqual({ secret: '', name: 'Ada' });

      host.form().submit();
      await settle(fixture);
      host.form().reset({ secret: 'x', name: '' });
      await settle(fixture);

      expect(host.resets).toBe(1);
      expect(host.group.value).toEqual({ secret: 'x', name: '' });
      expect(host.form().submitted()).toBe(false);
      expect(
        fixture.nativeElement.querySelector('.andes-form-field--invalid'),
      ).toBeNull();
    });

    it('reports a reset button too', async () => {
      const fixture = TestBed.createComponent(ImperativeHost);
      await settle(fixture);

      (
        fixture.nativeElement.querySelector(
          'button[type=reset]',
        ) as HTMLButtonElement
      ).click();
      await settle(fixture);

      expect(fixture.componentInstance.resets).toBe(1);
    });
  });
});
