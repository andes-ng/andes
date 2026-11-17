import { Component, signal, viewChild } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import {
  FormField,
  FormRoot,
  form,
  hidden,
  minLength,
  required,
  validate,
} from '@angular/forms/signals';

import { AndesInput } from '../input/input';
import { AndesForm } from './form';
import { AndesFormControl } from './form-control';
import { AndesFormField } from './form-field';
import type { AndesFormInvalidSubmit } from './form-field-tokens';

async function settle(fixture: ComponentFixture<unknown>): Promise<void> {
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
}

interface Signup {
  name: string;
  handle: string;
  nickname: string;
  company: string;
}

@Component({
  selector: 'andes-test-signal-form-host',
  imports: [
    AndesForm,
    AndesFormField,
    AndesFormControl,
    AndesInput,
    FormField,
    FormRoot,
  ],
  template: `<form
    andesForm
    #f="andesForm"
    [formRoot]="signup"
    [scrollToFirstError]="{ behavior: 'auto' }"
    (validSubmit)="valid.push($event)"
    (invalidSubmit)="invalid.push($event)"
    (valuesChange)="values.push($event)"
  >
    <andes-form-field label="Name">
      <andes-input andesFormControl [formField]="signup.name" />
    </andes-form-field>
    <andes-form-field label="Handle">
      <input andesFormControl [formField]="signup.handle" />
    </andes-form-field>
    <andes-form-field label="Nickname">
      <input andesFormControl [formField]="signup.nickname" />
    </andes-form-field>
    <andes-form-field label="Company">
      <input andesFormControl [formField]="signup.company" />
    </andes-form-field>
    <button type="submit">Sign up</button>
  </form>`,
})
class SignalFormHost {
  readonly form = viewChild.required<AndesForm>('f');
  readonly model = signal<Signup>({
    name: '',
    handle: 'ab',
    nickname: 'taken',
    company: '',
  });
  readonly signup = form(this.model, (path) => {
    required(path.name);
    minLength(path.handle, 3);
    validate(path.nickname, ({ value }) =>
      value() === 'taken'
        ? { kind: 'taken', message: 'That nickname is taken.' }
        : null,
    );
    hidden(path.company, ({ valueOf }) => valueOf(path.name) === 'hide');
  });
  readonly valid: unknown[] = [];
  readonly invalid: AndesFormInvalidSubmit[] = [];
  readonly values: unknown[] = [];
}

function submit(fixture: ComponentFixture<SignalFormHost>): void {
  (
    fixture.nativeElement.querySelector('form') as HTMLFormElement
  ).dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
}

const fields = (fixture: ComponentFixture<unknown>) =>
  Array.from(
    (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLElement>(
      'andes-form-field',
    ),
  );

describe('AndesForm - signal forms', () => {
  it('reports an invalid submit with each failing field path, and reveals every error', async () => {
    const fixture = TestBed.createComponent(SignalFormHost);
    await settle(fixture);
    submit(fixture);
    await settle(fixture);
    const { invalid } = fixture.componentInstance;

    expect(invalid).toHaveLength(1);
    expect(invalid[0].errors.map((error) => error.path)).toEqual([
      ['name'],
      ['handle'],
      ['nickname'],
    ]);
    expect(Object.keys(invalid[0].errors[0].errors)).toEqual(['required']);
    expect(fixture.componentInstance.form().submitted()).toBe(true);

    const [name, handle, nickname] = fields(fixture);
    expect(name.textContent).toContain('This field is required.');
    expect(handle.textContent).toContain('Enter at least 3 characters.');
    // A rule's own message wins over any built-in default.
    expect(nickname.textContent).toContain('That nickname is taken.');
    expect(handle.querySelector('input')?.getAttribute('aria-invalid')).toBe(
      'true',
    );
  });

  it('marks the label of a required() field and paths each field from the root', async () => {
    const fixture = TestBed.createComponent(SignalFormHost);
    await settle(fixture);
    const [name, handle] = fields(fixture);

    expect(name.querySelector('.andes-form-label__required')).not.toBeNull();
    expect(handle.querySelector('.andes-form-label__required')).toBeNull();
    expect(
      handle.querySelector('.andes-form-field')?.getAttribute('data-path'),
    ).toBe('handle');
  });

  it('emits validSubmit with the model value once valid, and each value change', async () => {
    const fixture = TestBed.createComponent(SignalFormHost);
    await settle(fixture);
    const host = fixture.componentInstance;
    host.model.set({
      name: 'Ada',
      handle: 'ada',
      nickname: 'countess',
      company: '',
    });
    await settle(fixture);
    submit(fixture);
    await settle(fixture);

    expect(host.valid).toEqual([
      { name: 'Ada', handle: 'ada', nickname: 'countess', company: '' },
    ]);
    expect(host.values.at(-1)).toEqual(host.valid[0]);
  });

  it('hides a field its schema hides, keeping it in the model', async () => {
    const fixture = TestBed.createComponent(SignalFormHost);
    await settle(fixture);
    const company = fields(fixture)[3];

    expect(company.hasAttribute('hidden')).toBe(false);

    fixture.componentInstance.model.update((m) => ({ ...m, name: 'hide' }));
    await settle(fixture);

    expect(company.hasAttribute('hidden')).toBe(true);
  });

  it('reset() clears the submitted, touched and error state', async () => {
    const fixture = TestBed.createComponent(SignalFormHost);
    await settle(fixture);
    submit(fixture);
    await settle(fixture);

    fixture.componentInstance.form().reset();
    await settle(fixture);

    expect(fixture.componentInstance.form().submitted()).toBe(false);
    expect(
      fixture.nativeElement.querySelector('.andes-form-field--invalid'),
    ).toBeNull();
  });
});
