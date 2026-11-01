import { Component, signal, viewChild } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import {
  type AsyncValidatorFn,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  FormField,
  FormRoot,
  form,
  minLength,
  required,
} from '@angular/forms/signals';
import { Subject } from 'rxjs';

import { AndesForm } from './form';
import { AndesFormControl } from './form-control';
import { AndesFormField } from './form-field';

/** The value, or a failed test: a lookup the markup guarantees. */
function present<T>(value: T | null | undefined): T {
  if (value === null || value === undefined) {
    throw new Error('Expected a value, got ' + String(value));
  }
  return value;
}

async function settle(fixture: ComponentFixture<unknown>): Promise<void> {
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
}

function type(input: HTMLInputElement, value: string): void {
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

@Component({
  selector: 'andes-test-can-submit-host',
  imports: [ReactiveFormsModule, AndesForm, AndesFormField, AndesFormControl],
  template: `<form andesForm #f="andesForm" [formGroup]="group">
      <andes-form-field label="Email">
        <input andesFormControl formControlName="email" />
      </andes-form-field>
      <andes-form-field label="Username">
        <input andesFormControl formControlName="username" />
      </andes-form-field>
    </form>
    <button class="save" type="submit" form="x" [disabled]="!f.canSubmit()">
      Save
    </button>
    <output class="valid">{{ f.valid() }}</output
    ><output class="pending">{{ f.pending() }}</output>`,
})
class CanSubmitHost {
  readonly form = viewChild.required<AndesForm>('f');
  /** Answers of the async check, which the test settles by hand. */
  readonly answers: Subject<{ taken: boolean } | null>[] = [];
  readonly group = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    username: new FormControl('', {
      validators: Validators.required,
      asyncValidators: this.check(),
    }),
  });

  private check(): AsyncValidatorFn {
    return () => {
      const answer = new Subject<{ taken: boolean } | null>();
      this.answers.push(answer);
      return answer;
    };
  }
}

describe('AndesForm - valid, pending and canSubmit', () => {
  function setup() {
    const fixture = TestBed.createComponent(CanSubmitHost);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const host = fixture.componentInstance;
    return {
      fixture,
      el,
      host,
      save: () => present(el.querySelector<HTMLButtonElement>('.save')),
      text: (selector: string) => el.querySelector(selector)?.textContent,
      refresh: () => settle(fixture),
    };
  }

  it('is false while a required control is empty, and shows no error for it', async () => {
    const { el, save, text, refresh } = setup();
    await refresh();

    expect(text('.valid')).toBe('false');
    expect(save().disabled).toBe(true);
    expect(el.querySelector('.andes-form-field--invalid')).toBeNull();
    expect(el.querySelector('.andes-form-field__help')).toBeNull();
  });

  it('leaves every control untouched, pristine and without a status', async () => {
    const { host, el, refresh } = setup();
    await refresh();

    expect(host.group.touched).toBe(false);
    expect(host.group.dirty).toBe(false);
    expect(
      el.querySelector('.andes-form-field')?.getAttribute('data-status'),
    ).toBeNull();
  });

  it('turns true once every control is valid and the async check has answered', async () => {
    const { host, fixture, save, text, refresh } = setup();
    await refresh();
    const [email, username] = fixture.nativeElement.querySelectorAll('input');

    type(email, 'ada@lovelace.dev');
    await refresh();
    expect(save().disabled).toBe(true);

    type(username, 'ada');
    await refresh();
    expect(text('.pending')).toBe('true');
    expect(text('.valid')).toBe('false');
    expect(save().disabled).toBe(true);

    const answer = present(host.answers.at(-1));
    answer.next(null);
    answer.complete();
    await refresh();

    expect(text('.pending')).toBe('false');
    expect(text('.valid')).toBe('true');
    expect(save().disabled).toBe(false);
  });

  it('goes back to false as soon as a control becomes invalid again', async () => {
    const { host, fixture, save, refresh } = setup();
    const [email, username] = fixture.nativeElement.querySelectorAll('input');
    type(email, 'ada@lovelace.dev');
    type(username, 'ada');
    const answer = present(host.answers.at(-1));
    answer.next(null);
    answer.complete();
    await refresh();
    expect(save().disabled).toBe(false);

    type(email, 'ada@');
    await refresh();

    expect(save().disabled).toBe(true);
  });

  it('is false for a disabled form, and follows the model when it is set from code', async () => {
    const { host, save, refresh } = setup();
    host.group.controls.email.setValue('ada@lovelace.dev');
    host.group.controls.username.setValue('ada');
    const answer = present(host.answers.at(-1));
    answer.next(null);
    answer.complete();
    await refresh();
    expect(save().disabled).toBe(false);

    host.group.disable();
    await refresh();
    expect(save().disabled).toBe(true);
  });
});

@Component({
  selector: 'andes-test-can-submit-template-host',
  imports: [FormsModule, AndesForm, AndesFormField, AndesFormControl],
  template: `<form andesForm #f="andesForm">
    <andes-form-field label="Nick">
      <input andesFormControl name="nick" required [(ngModel)]="nick" />
    </andes-form-field>
    <output>{{ f.canSubmit() }}</output>
  </form>`,
})
class TemplateDrivenHost {
  readonly nick = signal('');
}

@Component({
  selector: 'andes-test-can-submit-signal-host',
  imports: [AndesForm, AndesFormField, AndesFormControl, FormField, FormRoot],
  template: `<form andesForm [formRoot]="signup" #f="andesForm">
    <andes-form-field label="Handle">
      <input andesFormControl [formField]="signup.handle" />
    </andes-form-field>
    <output>{{ f.canSubmit() }}</output>
  </form>`,
})
class SignalHost {
  readonly form = viewChild.required<AndesForm>('f');
  readonly model = signal({ handle: 'ab' });
  readonly signup = form(this.model, (path) => {
    required(path.handle);
    minLength(path.handle, 3);
  });
}

describe('AndesForm - canSubmit with other form kinds', () => {
  it('follows a template-driven form', async () => {
    const fixture = TestBed.createComponent(TemplateDrivenHost);
    await settle(fixture);
    const output = fixture.nativeElement.querySelector('output');
    expect(output.textContent).toBe('false');

    fixture.componentInstance.nick.set('ada');
    await settle(fixture);
    await settle(fixture);

    expect(output.textContent).toBe('true');
  });

  it('follows a signal form without touching it', async () => {
    const fixture = TestBed.createComponent(SignalHost);
    await settle(fixture);
    const output = fixture.nativeElement.querySelector('output');
    expect(output.textContent).toBe('false');
    expect(fixture.componentInstance.signup.handle().touched()).toBe(false);

    fixture.componentInstance.model.set({ handle: 'abc' });
    await settle(fixture);

    expect(output.textContent).toBe('true');
    expect(fixture.componentInstance.signup.handle().touched()).toBe(false);
  });

  it('is true for an andesForm with no Angular form', async () => {
    @Component({
      imports: [AndesForm],
      template: `<form andesForm #f="andesForm">
        <output>{{ f.canSubmit() }}</output>
      </form>`,
    })
    class PlainHost {}
    const fixture = TestBed.createComponent(PlainHost);
    await settle(fixture);

    expect(fixture.nativeElement.querySelector('output').textContent).toBe(
      'true',
    );
  });
});
