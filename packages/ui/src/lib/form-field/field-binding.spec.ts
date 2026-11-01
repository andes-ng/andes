import { Component, computed, forwardRef, input, signal } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import {
  type ControlValueAccessor,
  FormControl,
  FormGroup,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import {
  andesIdRefs,
  injectAndesFieldBinding,
  provideAndesFieldBoundary,
} from './field-binding';
import { AndesForm } from './form';
import { AndesFormControl } from './form-control';
import { AndesFormDescription } from './form-description';
import { AndesFormField } from './form-field';

/** A library-style control: it renders its own native input and reads the field itself. */
@Component({
  selector: 'andes-test-bound-input',
  template: `<input
    [attr.id]="controlId() ?? null"
    [attr.aria-describedby]="describedBy() ?? null"
    [attr.aria-labelledby]="labelledBy() ?? null"
    [attr.aria-invalid]="field.invalid() || null"
    [required]="field.required()"
    [disabled]="isDisabled()"
    [attr.data-size]="resolvedSize()"
    [attr.data-variant]="field.variant() ?? null"
    [attr.data-status]="field.status() ?? null"
    [value]="value()"
    (input)="onInput($event)"
    (blur)="onTouched()"
  />`,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => BoundInput),
      multi: true,
    },
  ],
})
class BoundInput implements ControlValueAccessor {
  protected readonly field = injectAndesFieldBinding();
  readonly id = input<string | undefined>(undefined);
  readonly ariaDescribedby = input<string | undefined>(undefined, {
    alias: 'aria-describedby',
  });
  readonly size = input<'sm' | 'md' | 'lg' | undefined>(undefined);
  protected readonly value = signal('');
  private readonly formDisabled = signal(false);
  protected readonly controlId = computed(() => this.id() ?? this.field.id());
  protected readonly describedBy = computed(() =>
    andesIdRefs(this.ariaDescribedby(), this.field.describedBy()),
  );
  protected readonly labelledBy = computed(() => this.field.labelledBy());
  protected readonly resolvedSize = computed(
    () => this.size() ?? this.field.size() ?? 'md',
  );
  protected readonly isDisabled = computed(
    () => this.formDisabled() || this.field.disabled(),
  );
  private onChange: (value: string) => void = () => undefined;
  protected onTouched: () => void = () => undefined;

  writeValue(value: string | null): void {
    this.value.set(value ?? '');
  }
  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(disabled: boolean): void {
    this.formDisabled.set(disabled);
  }
  protected onInput(event: Event): void {
    this.value.set((event.target as HTMLInputElement).value);
    this.onChange(this.value());
  }
}

/** A composite control rendering a library control inside its own template. */
@Component({
  selector: 'andes-test-composite',
  imports: [BoundInput],
  template: `<andes-test-bound-input />`,
  viewProviders: [provideAndesFieldBoundary()],
})
class Composite {
  protected readonly field = injectAndesFieldBinding();
}

@Component({
  selector: 'andes-test-binding-host',
  imports: [
    ReactiveFormsModule,
    AndesForm,
    AndesFormField,
    AndesFormControl,
    AndesFormDescription,
    BoundInput,
    Composite,
  ],
  template: `<form
      andesForm
      [formGroup]="group"
      [size]="size()"
      variant="filled"
      [disabled]="disabled()"
    >
      <andes-form-field label="Plain">
        <andes-test-bound-input formControlName="plain" />
        <andes-form-description>Hint.</andes-form-description>
      </andes-form-field>
      <andes-form-field label="Directive">
        <andes-test-bound-input
          andesFormControl
          formControlName="directive"
          aria-describedby="own-hint"
        />
      </andes-form-field>
      <andes-form-field label="Two controls">
        <andes-test-bound-input formControlName="first" />
        <andes-test-bound-input formControlName="second" size="sm" />
      </andes-form-field>
      <andes-form-field label="Composite">
        <andes-test-composite />
      </andes-form-field>
    </form>
    <andes-test-bound-input class="outside" />`,
})
class BindingHost {
  readonly size = signal<'sm' | 'md' | 'lg' | undefined>('lg');
  readonly disabled = signal(false);
  readonly group = new FormGroup({
    plain: new FormControl('', Validators.required),
    directive: new FormControl('', Validators.required),
    first: new FormControl(''),
    second: new FormControl(''),
  });
}

async function setup(): Promise<{
  fixture: ComponentFixture<BindingHost>;
  inputs: HTMLInputElement[];
  labels: HTMLLabelElement[];
  fields: HTMLElement[];
}> {
  const fixture = TestBed.createComponent(BindingHost);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  const el = fixture.nativeElement as HTMLElement;
  return {
    fixture,
    inputs: Array.from(el.querySelectorAll('input')),
    labels: Array.from(el.querySelectorAll('label')),
    fields: Array.from(el.querySelectorAll('.andes-form-field')),
  };
}

describe('injectAndesFieldBinding', () => {
  it('names and describes the control, without andesFormControl', async () => {
    const { inputs, labels, fields } = await setup();
    const description = fields[0].querySelector('.andes-form-description');

    expect(labels[0].control).toBe(inputs[0]);
    expect(inputs[0].getAttribute('aria-labelledby')).toBe(labels[0].id);
    expect(inputs[0].getAttribute('aria-describedby')).toBe(description?.id);
  });

  it('registers the control, so the field reads its required validator and status', async () => {
    const { fixture, inputs, fields } = await setup();

    expect(
      fields[0].querySelector('.andes-form-label__required'),
    ).not.toBeNull();
    expect(inputs[0].required).toBe(true);
    expect(inputs[0].hasAttribute('aria-invalid')).toBe(false);

    inputs[0].dispatchEvent(new FocusEvent('blur'));
    fixture.detectChanges();

    expect(fields[0].dataset['status']).toBe('error');
    expect(inputs[0].getAttribute('aria-invalid')).toBe('true');
    expect(inputs[0].dataset['status']).toBe('error');
    expect(inputs[0].getAttribute('aria-describedby')?.split(' ')).toContain(
      fields[0].querySelector('.andes-form-field__help')?.id,
    );
  });

  it('uses andesFormControl when present, merging the consumer`s own describedby', async () => {
    const { fixture, inputs, fields } = await setup();
    inputs[1].dispatchEvent(new FocusEvent('blur'));
    fixture.detectChanges();
    const help = fields[1].querySelector('.andes-form-field__help');

    expect(fields[1].dataset['status']).toBe('error');
    expect(inputs[1].getAttribute('aria-describedby')).toBe(
      `own-hint ${help?.id}`,
    );
  });

  it('gives the field id to the first control only', async () => {
    const { inputs, labels } = await setup();

    expect(labels[2].control).toBe(inputs[2]);
    expect(inputs[3].hasAttribute('id')).toBe(false);
    expect(inputs[3].hasAttribute('aria-labelledby')).toBe(false);
  });

  it('keeps the field away from the controls inside a composite', async () => {
    const { fixture, inputs } = await setup();
    const inner = fixture.nativeElement.querySelector(
      'andes-test-composite input',
    ) as HTMLInputElement;

    expect(inputs).toContain(inner);
    expect(inner.hasAttribute('id')).toBe(false);
    expect(inner.hasAttribute('aria-labelledby')).toBe(false);
  });

  it('cascades the form size, variant and disabled; the control`s own size wins', async () => {
    const { fixture, inputs } = await setup();
    const outside = fixture.nativeElement.querySelector(
      '.outside input',
    ) as HTMLInputElement;

    expect(inputs[0].dataset['size']).toBe('lg');
    expect(inputs[3].dataset['size']).toBe('sm');
    expect(inputs[0].dataset['variant']).toBe('filled');
    expect(outside.dataset['size']).toBe('md');
    expect(outside.hasAttribute('data-variant')).toBe(false);

    fixture.componentInstance.disabled.set(true);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(inputs.slice(0, 4).every((input) => input.disabled)).toBe(true);
    expect(outside.disabled).toBe(false);
  });
});

@Component({
  selector: 'andes-test-group-item',
  template: `<input
    [attr.id]="field.id() ?? null"
    [attr.data-size]="field.size()"
  />`,
})
class GroupItem {
  protected readonly field = injectAndesFieldBinding({ field: false });
}

@Component({
  selector: 'andes-test-group-item-host',
  imports: [AndesForm, AndesFormField, GroupItem],
  template: `<form andesForm size="sm">
    <andes-form-field label="Items"><andes-test-group-item /></andes-form-field>
  </form>`,
})
class GroupItemHost {}

describe('injectAndesFieldBinding({ field: false })', () => {
  it('ignores the field (no id, no registration) but follows the form', () => {
    const fixture = TestBed.createComponent(GroupItemHost);
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input');

    expect(input.hasAttribute('id')).toBe(false);
    expect(input.dataset.size).toBe('sm');
    expect(fixture.nativeElement.querySelector('label').control).toBeNull();
  });
});

describe('andesIdRefs', () => {
  it('joins id lists, dropping blanks and repeats', () => {
    expect(andesIdRefs('a b', undefined, 'b  c', null, '')).toBe('a b c');
    expect(andesIdRefs(undefined, '')).toBeUndefined();
  });
});
