import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  type AsyncValidatorFn,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  type ValidationErrors,
  type ValidatorFn,
  Validators,
} from '@angular/forms';
import { of, Subject } from 'rxjs';

import { AndesForm } from './form';
import { AndesFormControl } from './form-control';
import { AndesFormField } from './form-field';
import { AndesValidators } from './form-validators';

/** A validator that records what it was asked and fails when the value is `bad`. */
function recording(
  key: string,
  bad: unknown,
  calls: unknown[] = [],
): ValidatorFn {
  return (control) => {
    calls.push(key);
    return control.value === bad ? { [key]: true } : null;
  };
}

describe('AndesValidators.first', () => {
  it('returns the errors of the first failing validator and does not run the rest', () => {
    const calls: unknown[] = [];
    const validator = AndesValidators.first(
      recording('one', 'x', calls),
      recording('two', 'x', calls),
      recording('three', 'x', calls),
    );

    expect(validator(new FormControl('x'))).toEqual({ one: true });
    expect(calls).toEqual(['one']);
  });

  it('runs on to a later validator while the earlier ones pass', () => {
    const calls: unknown[] = [];
    const validator = AndesValidators.first(
      recording('one', 'never', calls),
      recording('two', 'x', calls),
      recording('three', 'x', calls),
    );

    expect(validator(new FormControl('x'))).toEqual({ two: true });
    expect(calls).toEqual(['one', 'two']);
  });

  it('is valid when every validator passes, and skips null and undefined entries', () => {
    const validator = AndesValidators.first(
      null,
      Validators.required,
      undefined,
      Validators.email,
    );

    expect(validator(new FormControl('ada@lovelace.dev'))).toBeNull();
    expect(validator(new FormControl(''))).toEqual({ required: true });
    expect(validator(new FormControl('ada@'))).toEqual({
      email: true,
    });
  });

  it('is one error object on the control, where Validators.compose merges them all', () => {
    const rules = [Validators.minLength(5), Validators.pattern(/^\d+$/)];
    const merged = new FormControl('ab', Validators.compose(rules));
    const first = new FormControl('ab', AndesValidators.first(...rules));

    expect(Object.keys(merged.errors ?? {}).sort()).toEqual([
      'minlength',
      'pattern',
    ]);
    expect(Object.keys(first.errors ?? {})).toEqual(['minlength']);
  });
});

describe('AndesValidators.firstAsync', () => {
  const later = (
    key: string,
    bad: unknown,
    calls: unknown[],
  ): AsyncValidatorFn => {
    return (control) => {
      calls.push(key);
      return Promise.resolve(control.value === bad ? { [key]: true } : null);
    };
  };

  const run = (validator: AsyncValidatorFn, value: unknown) =>
    new Promise<ValidationErrors | null>((resolve) => {
      const result = validator(new FormControl(value));
      if (result instanceof Promise) {
        void result.then(resolve);
      } else {
        result.subscribe(resolve);
      }
    });

  it('stops at the first failing validator, so a later one never starts', async () => {
    const calls: unknown[] = [];
    const validator = AndesValidators.firstAsync(
      later('one', 'x', calls),
      later('two', 'x', calls),
    );

    expect(await run(validator, 'x')).toEqual({ one: true });
    expect(calls).toEqual(['one']);
  });

  it('waits for each validator before starting the next', async () => {
    const calls: unknown[] = [];
    const slow = new Subject<ValidationErrors | null>();
    const validator = AndesValidators.firstAsync(
      () => {
        calls.push('slow');
        return slow.asObservable();
      },
      later('two', 'x', calls),
    );
    const settled = run(validator, 'x');

    await Promise.resolve();
    expect(calls).toEqual(['slow']);

    slow.next(null);
    slow.complete();
    expect(await settled).toEqual({ two: true });
    expect(calls).toEqual(['slow', 'two']);
  });

  it('is valid when every validator passes, whether it answers with a promise or an observable', async () => {
    const validator = AndesValidators.firstAsync(
      () => of(null),
      () => Promise.resolve(null),
    );

    expect(await run(validator, 'x')).toBeNull();
    expect(await run(AndesValidators.firstAsync(), 'x')).toBeNull();
  });
});

describe('AndesValidators.debounceAsync', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  function setup(delay = 300) {
    const calls: unknown[] = [];
    const taken: AsyncValidatorFn = (control) => {
      calls.push(control.value);
      return Promise.resolve(
        control.value === 'admin' ? { taken: true } : null,
      );
    };
    const control = new FormControl('', {
      asyncValidators: AndesValidators.debounceAsync(taken, delay),
    });
    return { calls, control };
  }

  it('runs the validator once the value has settled, and is pending until then', async () => {
    const { calls, control } = setup();
    await vi.advanceTimersByTimeAsync(300);
    calls.length = 0;

    control.setValue('admin');
    expect(control.pending).toBe(true);
    await vi.advanceTimersByTimeAsync(299);
    expect(calls).toEqual([]);

    await vi.advanceTimersByTimeAsync(1);
    expect(calls).toEqual(['admin']);
    expect(control.errors).toEqual({ taken: true });
    expect(control.pending).toBe(false);
  });

  it('restarts the wait on every change, and only checks the last value', async () => {
    const { calls, control } = setup();
    await vi.advanceTimersByTimeAsync(300);
    calls.length = 0;

    control.setValue('a');
    await vi.advanceTimersByTimeAsync(200);
    control.setValue('ad');
    await vi.advanceTimersByTimeAsync(200);
    control.setValue('admin');
    await vi.advanceTimersByTimeAsync(299);
    expect(calls).toEqual([]);

    await vi.advanceTimersByTimeAsync(1);
    expect(calls).toEqual(['admin']);
  });

  it('still runs the sync validators at once: the async check waits for them', async () => {
    const calls: unknown[] = [];
    const control = new FormControl('', {
      validators: Validators.required,
      asyncValidators: AndesValidators.debounceAsync((c) => {
        calls.push(c.value);
        return of(null);
      }, 300),
    });
    await vi.advanceTimersByTimeAsync(1000);

    control.setValue('');
    expect(control.errors).toEqual({ required: true });
    await vi.advanceTimersByTimeAsync(1000);
    expect(calls).toEqual([]);
  });
});

@Component({
  selector: 'andes-test-debounce-host',
  imports: [ReactiveFormsModule, AndesForm, AndesFormField, AndesFormControl],
  template: `<form
    andesForm
    [formGroup]="group"
    [validateDebounce]="formDelay()"
  >
    <andes-form-field label="Username" [validateDebounce]="fieldDelay()">
      <input andesFormControl formControlName="username" />
    </andes-form-field>
    <andes-form-field label="Other">
      <input andesFormControl formControlName="other" />
    </andes-form-field>
  </form>`,
})
class DebounceHost {
  readonly formDelay = signal(0);
  readonly fieldDelay = signal<number | undefined>(undefined);
  readonly calls: { name: string; value: unknown }[] = [];
  readonly group = new FormGroup({
    username: new FormControl('', {
      asyncValidators: this.checker('username'),
    }),
    other: new FormControl('', { asyncValidators: this.checker('other') }),
  });

  private checker(name: string): AsyncValidatorFn {
    return (control) => {
      this.calls.push({ name, value: control.value });
      return Promise.resolve(
        control.value === 'admin' ? { taken: true } : null,
      );
    };
  }
}

describe('validateDebounce on AndesFormField and AndesForm', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  async function setup(configure?: (host: DebounceHost) => void) {
    const fixture = TestBed.createComponent(DebounceHost);
    configure?.(fixture.componentInstance);
    fixture.detectChanges();
    await vi.advanceTimersByTimeAsync(1000);
    fixture.componentInstance.calls.length = 0;
    const host = fixture.componentInstance;
    const field = (index: number) =>
      (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLElement>(
        '.andes-form-field',
      )[index];
    const change = async (name: 'username' | 'other', value: string) => {
      host.group.controls[name].setValue(value);
      fixture.detectChanges();
    };
    const advance = async (ms: number) => {
      await vi.advanceTimersByTimeAsync(ms);
      fixture.detectChanges();
    };
    host.group.markAllAsTouched();
    return { fixture, host, field, change, advance };
  }

  it('runs the async validators at once by default', async () => {
    const { host, change, advance } = await setup();

    await change('username', 'admin');
    await advance(0);

    expect(host.calls).toEqual([{ name: 'username', value: 'admin' }]);
  });

  it('waits for the value to settle, showing validating meanwhile', async () => {
    const { host, field, change, advance } = await setup((h) =>
      h.fieldDelay.set(400),
    );

    await change('username', 'ad');
    await advance(200);
    await change('username', 'admin');
    expect(field(0).getAttribute('data-status')).toBe('validating');
    await advance(399);
    expect(host.calls).toEqual([]);

    await advance(1);
    expect(host.calls).toEqual([{ name: 'username', value: 'admin' }]);
    expect(field(0).getAttribute('data-status')).toBe('error');
  });

  it('takes the form delay as the default for every field, and a field overrides it', async () => {
    const { host, change, advance } = await setup((h) => {
      h.formDelay.set(500);
      h.fieldDelay.set(100);
    });

    await change('username', 'a');
    await change('other', 'b');
    await advance(100);
    expect(host.calls).toEqual([{ name: 'username', value: 'a' }]);
    await advance(399);
    expect(host.calls).toHaveLength(1);
    await advance(1);
    expect(host.calls).toEqual([
      { name: 'username', value: 'a' },
      { name: 'other', value: 'b' },
    ]);
  });

  it('lets a field turn the form delay off with 0', async () => {
    const { host, change, advance } = await setup((h) => {
      h.formDelay.set(500);
      h.fieldDelay.set(0);
    });

    await change('username', 'a');
    await advance(0);

    expect(host.calls).toEqual([{ name: 'username', value: 'a' }]);
  });

  it('follows the delay changing at runtime and gives the original validator back at 0', async () => {
    const { host, change, advance } = await setup((h) => h.fieldDelay.set(400));
    const control = host.group.controls.username;
    const wrapped = control.asyncValidator;

    host.fieldDelay.set(undefined);
    TestBed.tick();
    expect(control.asyncValidator).not.toBe(wrapped);

    await change('username', 'a');
    await advance(0);
    expect(host.calls).toEqual([{ name: 'username', value: 'a' }]);
  });

  it('puts the original validators back when the field goes away', async () => {
    const { fixture, host } = await setup((h) => h.fieldDelay.set(400));
    const control = host.group.controls.username;
    const wrapped = control.asyncValidator;

    fixture.destroy();

    expect(control.asyncValidator).not.toBe(wrapped);
  });

  it('does not overwrite validators the consumer set after the field wrapped them', async () => {
    const { fixture, host } = await setup((h) => h.fieldDelay.set(400));
    const control = host.group.controls.username;
    const mine: AsyncValidatorFn = () => of(null);

    control.setAsyncValidators(mine);
    fixture.destroy();

    expect(control.asyncValidator).toBe(mine);
  });
});
