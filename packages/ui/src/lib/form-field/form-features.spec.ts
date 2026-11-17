import { readFileSync } from 'node:fs';

import { Component, signal, viewChild } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import {
  type AbstractControl,
  FormArray,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  type ValidationErrors,
  Validators,
} from '@angular/forms';

import { declaredValue, expectLength } from '../../testing/computed-style';
import { AndesForm } from './form';
import { AndesFormControl } from './form-control';
import { AndesFormError } from './form-error';
import { AndesFormField } from './form-field';
import { AndesFormFieldset } from './form-fieldset';
import type { AndesFormMessageMode } from './form-field-tokens';

const CSS = readFileSync(
  'packages/ui/src/lib/form-field/form-field.css',
  'utf8',
);

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

@Component({
  selector: 'andes-test-group-blocks-host',
  imports: [
    ReactiveFormsModule,
    AndesForm,
    AndesFormField,
    AndesFormControl,
    AndesFormError,
    AndesFormFieldset,
  ],
  template: `<form andesForm [formGroup]="group">
    <andes-form-fieldset
      legend="Guests"
      description="Everyone coming along."
      [control]="group.controls.guests"
      [errorMessages]="{ atLeastOne: 'Add at least one guest.' }"
    >
      <span slot="legend" class="legend-extra">(up to 4)</span>
      @for (guest of group.controls.guests.controls; track guest) {
        <andes-form-field label="Guest">
          <input andesFormControl [formControl]="guest" />
        </andes-form-field>
      }
    </andes-form-fieldset>
    <andes-form-error
      id="dates-error"
      [control]="group.controls.dates"
      [errorMessages]="{ order: 'The end comes before the start.' }"
    />
    <div formGroupName="dates">
      <andes-form-field label="From">
        <input andesFormControl formControlName="from" />
      </andes-form-field>
      <andes-form-field label="To">
        <input andesFormControl formControlName="to" />
      </andes-form-field>
    </div>
    <button type="submit">Book</button>
  </form>`,
})
class GroupBlocksHost {
  readonly group = new FormGroup({
    guests: new FormArray<FormControl<string | null>>([], {
      validators: (array: AbstractControl) =>
        (array.value as unknown[]).length > 0 ? null : { atLeastOne: true },
    }),
    dates: new FormGroup(
      { from: new FormControl('2'), to: new FormControl('1') },
      {
        validators: (g: AbstractControl) =>
          g.get('from')?.value <= g.get('to')?.value ? null : { order: true },
      },
    ),
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

    it('keeps a field or error id on the control or message only, never twice', async () => {
      const fixture = TestBed.createComponent(LabelClickHost);
      await settle(fixture);

      expect(fixture.nativeElement.querySelectorAll('#country')).toHaveLength(
        1,
      );
      expect(
        fixture.nativeElement
          .querySelector('andes-form-field')
          .hasAttribute('id'),
      ).toBe(false);
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

  describe('group and list errors', () => {
    it('shows a group validator error once a control in it changes, with its own id', async () => {
      const fixture = TestBed.createComponent(GroupBlocksHost);
      await settle(fixture);
      const el = fixture.nativeElement as HTMLElement;

      expect(el.querySelector('#dates-error')).toBeNull();

      type(el.querySelectorAll('input')[0], '3');
      await settle(fixture);
      const error = el.querySelector('#dates-error') as HTMLElement;

      expect(error.textContent?.trim()).toBe('The end comes before the start.');
      expect(error.tagName).toBe('P');
      expect(el.querySelectorAll('#dates-error')).toHaveLength(1);
      expect(error.getAttribute('role')).toBe('alert');
    });

    it('titles a fieldset with its legend and describes it', async () => {
      const fixture = TestBed.createComponent(GroupBlocksHost);
      await settle(fixture);
      const fieldset = fixture.nativeElement.querySelector(
        'fieldset',
      ) as HTMLFieldSetElement;
      const legend = fieldset.querySelector('legend') as HTMLElement;
      const description = fieldset.querySelector(
        '.andes-form-description',
      ) as HTMLElement;

      expect(legend.textContent).toContain('Guests');
      expect(legend.querySelector('.legend-extra')).not.toBeNull();
      expect(fieldset.getAttribute('aria-describedby')).toBe(description.id);
      const style = getComputedStyle(legend);
      expectLength(style.fontSize, '1rem');
      expect(
        declaredValue(CSS, '.andes-form-fieldset__legend', 'font-weight'),
      ).toBe('var(--andes-font-weight-semibold)');
      expect(getComputedStyle(fieldset).borderTopStyle).toBe('none');
    });

    it('shows a list error at the bottom of the fieldset after a submit', async () => {
      const fixture = TestBed.createComponent(GroupBlocksHost);
      await settle(fixture);
      const fieldset = fixture.nativeElement.querySelector(
        'fieldset',
      ) as HTMLFieldSetElement;

      expect(fieldset.querySelector('.andes-form-fieldset__error')).toBeNull();

      fixture.nativeElement
        .querySelector('form')
        .dispatchEvent(new Event('submit', { cancelable: true }));
      await settle(fixture);
      const error = fieldset.querySelector(
        '.andes-form-fieldset__error',
      ) as HTMLElement;

      expect(error.textContent?.trim()).toBe('Add at least one guest.');
      expect(fieldset.dataset['status']).toBe('error');
      expect(fieldset.getAttribute('aria-describedby')?.split(' ')).toContain(
        error.id,
      );

      fixture.componentInstance.group.controls.guests.push(
        new FormControl('Ada'),
      );
      await settle(fixture);

      expect(fieldset.querySelector('.andes-form-fieldset__error')).toBeNull();
    });
  });
});
