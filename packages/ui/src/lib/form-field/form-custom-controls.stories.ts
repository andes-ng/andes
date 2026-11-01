import { JsonPipe } from '@angular/common';
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  forwardRef,
  input,
  signal,
} from '@angular/core';
import {
  type ControlValueAccessor,
  FormControl,
  FormGroup,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import type { Meta, StoryObj } from '@storybook/angular';

import { AndesButton } from '../button/button';
import { AndesInputNumber } from '../input-number/input-number';
import { AndesForm } from './form';
import { AndesFormControl } from './form-control';
import { AndesFormField } from './form-field';
import { AndesFormIcon } from './form-icons';
import { andesIdRefs, injectAndesFieldBinding } from './field-binding';

/** Shared look for the small result panels the stories below print into. */
const LOG_STYLE =
  'margin: 0; padding: 0.5rem 0.75rem; border-radius: var(--andes-radius-md); background: var(--andes-color-muted); color: var(--andes-color-foreground); font-family: var(--andes-font-family), sans-serif; font-size: 0.75rem; line-height: 1.25rem; white-space: pre-wrap;';

/** A bare, library-looking text box for the demo controls below. */
const BOX_STYLE = `
  .box { box-sizing: border-box; width: 100%; height: 2rem; padding: 0 0.75rem; border: 1px solid var(--andes-color-border); border-radius: var(--andes-radius-md); background: var(--andes-color-background); color: var(--andes-color-foreground); font: inherit; font-size: 0.875rem; }
  .box:focus-visible { outline: 2px solid var(--andes-color-focus-ring); outline-offset: 1px; }
  .box[aria-invalid='true'] { border-color: var(--andes-color-danger); }
  .box:disabled { opacity: 0.5; }
`;

/**
 * A custom control that reads its field: a stepper (minus, value, plus). `injectAndesFieldBinding()`
 * hands it the field's id for its labelable `<input>`, the described-by ids, the invalid and
 * required flags and the form's disabled - four lines in the class, no binding in the template of
 * whoever uses it.
 */
@Component({
  selector: 'andes-story-stepper',
  imports: [AndesButton, AndesFormIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => StepperControl),
      multi: true,
    },
  ],
  styles: `
    :host {
      display: inline-flex;
      gap: 0.25rem;
      align-items: center;
    }
    ${BOX_STYLE}
    .box {
      width: 4rem;
      text-align: center;
    }
  `,
  template: `
    <andes-button
      variant="outline"
      size="icon"
      aria-label="Decrease"
      [disabled]="isDisabled()"
      (click)="step(-1)"
      ><andes-form-icon name="minus"
    /></andes-button>
    <!-- A native, labelable <input> on purpose: the story shows a custom control putting the
         field's id and ARIA on its own native element. -->
    <input
      class="box"
      readonly
      [attr.id]="field.id() ?? null"
      [attr.aria-labelledby]="field.labelledBy() ?? null"
      [attr.aria-describedby]="describedBy() ?? null"
      [attr.aria-invalid]="field.invalid() ? 'true' : null"
      [attr.aria-required]="field.required() ? 'true' : null"
      [disabled]="isDisabled()"
      [value]="value()"
      (blur)="onTouched()"
    />
    <andes-button
      variant="outline"
      size="icon"
      aria-label="Increase"
      [disabled]="isDisabled()"
      (click)="step(1)"
      ><andes-form-icon name="plus"
    /></andes-button>
  `,
})
class StepperControl implements ControlValueAccessor {
  protected readonly field = injectAndesFieldBinding();
  readonly describedByOwn = input<string | undefined>(undefined);
  protected readonly value = signal(0);
  private readonly disabledByForm = signal(false);
  protected readonly isDisabled = computed(
    () => this.disabledByForm() || this.field.disabled(),
  );
  protected readonly describedBy = computed(() =>
    andesIdRefs(this.describedByOwn(), this.field.describedBy()),
  );
  private onChange: (value: number) => void = () => undefined;
  protected onTouched: () => void = () => undefined;

  protected step(by: number): void {
    this.value.update((n) => Math.max(0, n + by));
    this.onChange(this.value());
    this.onTouched();
  }

  writeValue(value: number | null): void {
    this.value.set(value ?? 0);
  }
  registerOnChange(fn: (value: number) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(disabled: boolean): void {
    this.disabledByForm.set(disabled);
  }
}

/**
 * A control from somewhere else, one that knows nothing about the form: it takes an `inputId`,
 * a `describedBy` and an `invalid` flag as plain inputs. `andesFormControl` plus the field's
 * state signals wire it by hand. Its native `<button role="switch">` is the stand-in for that
 * foreign control, on purpose: the story is about wiring a control the library did not write.
 */
@Component({
  selector: 'andes-story-third-party-toggle',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ThirdPartyToggle),
      multi: true,
    },
  ],
  styles: `
    ${BOX_STYLE} .box {
      width: auto;
      cursor: pointer;
      padding: 0 1rem;
    }
  `,
  template: `<button
    type="button"
    class="box"
    role="switch"
    [attr.id]="inputId()"
    [attr.aria-checked]="on()"
    [attr.aria-describedby]="describedBy()"
    [attr.aria-invalid]="invalid() ? 'true' : null"
    [disabled]="disabledByForm()"
    (click)="toggle()"
    (blur)="onTouched()"
  >
    {{ on() ? 'On' : 'Off' }}
  </button>`,
})
class ThirdPartyToggle implements ControlValueAccessor {
  readonly inputId = input<string | undefined>(undefined);
  readonly describedBy = input<string | undefined>(undefined);
  readonly invalid = input(false, { transform: booleanAttribute });
  protected readonly on = signal(false);
  protected readonly disabledByForm = signal(false);
  private onChange: (value: boolean) => void = () => undefined;
  protected onTouched: () => void = () => undefined;

  protected toggle(): void {
    this.on.update((value) => !value);
    this.onChange(this.on());
  }

  writeValue(value: boolean | null): void {
    this.on.set(!!value);
  }
  registerOnChange(fn: (value: boolean) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(disabled: boolean): void {
    this.disabledByForm.set(disabled);
  }
}

/** A comma-separated text box whose model is a `string[]`: the view and the model differ. It is
 *  built on a native `<input>` on purpose: the story is about the `ControlValueAccessor` that
 *  converts between the two, not about the box. */
@Component({
  selector: 'andes-story-csv-input',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CsvInput),
      multi: true,
    },
  ],
  styles: BOX_STYLE,
  template: `<input
    class="box"
    [attr.id]="field.id() ?? null"
    [attr.aria-labelledby]="field.labelledBy() ?? null"
    [attr.aria-describedby]="field.describedBy() ?? null"
    [attr.aria-invalid]="field.invalid() ? 'true' : null"
    [disabled]="disabledByForm() || field.disabled()"
    [value]="text()"
    (input)="typed($any($event.target).value)"
    (blur)="commit()"
  />`,
})
class CsvInput implements ControlValueAccessor {
  protected readonly field = injectAndesFieldBinding();
  protected readonly text = signal('');
  protected readonly disabledByForm = signal(false);
  private onChange: (value: string[]) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  /** View -> model: split, trim, lower-case and drop the empty entries. */
  private static parse(text: string): string[] {
    return text
      .split(',')
      .map((part) => part.trim().toLowerCase())
      .filter(Boolean);
  }

  protected typed(text: string): void {
    this.text.set(text);
    this.onChange(CsvInput.parse(text));
  }

  /** Leaving the box tidies the text to what the model holds. */
  protected commit(): void {
    this.text.set(CsvInput.parse(this.text()).join(', '));
    this.onTouched();
  }

  /** Model -> view. */
  writeValue(value: string[] | null): void {
    this.text.set((value ?? []).join(', '));
  }
  registerOnChange(fn: (value: string[]) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(disabled: boolean): void {
    this.disabledByForm.set(disabled);
  }
}

const moduleMetadata = {
  imports: [
    JsonPipe,
    ReactiveFormsModule,
    AndesForm,
    AndesFormControl,
    AndesFormField,
    AndesButton,
    AndesInputNumber,
    StepperControl,
    ThirdPartyToggle,
    CsvInput,
  ],
};

/** These stories take no controls. */
interface CustomArgs {
  readonly unused?: never;
}

const meta: Meta<CustomArgs> = {
  title: 'Data Entry/Form/Custom controls',
};

export default meta;

type Story = StoryObj<CustomArgs>;

/**
 * Customised controls. The stepper reads its field with `injectAndesFieldBinding()`: it is
 * labelled by the field's label, described by its hint and error, marked invalid and required,
 * and disabled with the form, with nothing bound where it is used. The toggle comes from a
 * library that knows nothing of the form; its `inputId`, `describedBy` and `invalid` inputs are
 * wired by hand from `andesFormControl`'s signals. Click the label of each: the control
 * takes focus.
 */
export const CustomControl: Story = {
  render: () => ({
    moduleMetadata,
    props: {
      form: new FormGroup({
        seats: new FormControl(0, Validators.min(1)),
        alerts: new FormControl(false, Validators.requiredTrue),
      }),
    },
    template: `
      <form andesForm [formGroup]="form" (ngSubmit)="form.markAllAsTouched()" style="width: min(420px, 100vw - 2rem);">
        <andes-form-field label="Seats (reads the field)" extra="At least one." [errorMessages]="{ min: 'Pick at least one seat.' }">
          <andes-story-stepper formControlName="seats" />
        </andes-form-field>
        <andes-form-field label="Alerts (wired by hand)" #alerts="andesFormField" extra="Must be on.">
          <andes-story-third-party-toggle
            formControlName="alerts"
            andesFormControl
            #ctrl="andesFormControl"
            [inputId]="alerts.controlId()"
            [describedBy]="ctrl.describedBy()"
            [invalid]="alerts.showError()"
          />
        </andes-form-field>
        <div style="display: flex; gap: 0.5rem;">
          <andes-button type="submit">Save</andes-button>
          <andes-button variant="outline" (click)="form.disabled ? form.enable() : form.disable()">Disable / enable</andes-button>
        </div>
      </form>
    `,
  }),
};

/**
 * Value and format conversion. What the user sees and what the form holds are two things, and
 * the control's `ControlValueAccessor` is where they meet: `writeValue()` turns the model into
 * the view, the change callback turns the view back into the model. That is the whole of what
 * `getValueProps` plus `normalize` do elsewhere. The tags box shows `Design, Ops` and holds
 * `['design', 'ops']`; the price shows `$ 1,200.00` through the input number's `formatter` /
 * `parser` and holds a plain number. Read the model underneath.
 */
export const ValueConversion: Story = {
  render: () => {
    const money = (value: number | string) =>
      `$ ${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    return {
      moduleMetadata,
      props: {
        form: new FormGroup({
          tags: new FormControl(['design', 'ops']),
          price: new FormControl<number | null>(1200),
        }),
        money,
        unmoney: (text: string) => parseFloat(text.replace(/[^\d.]/g, '')),
      },
      template: `
        <form andesForm [formGroup]="form" style="width: min(420px, 100vw - 2rem);">
          <andes-form-field label="Tags" extra="Comma separated; tidied when you leave the box.">
            <andes-story-csv-input formControlName="tags" />
          </andes-form-field>
          <andes-form-field label="Price">
            <andes-input-number formControlName="price" [precision]="2" [formatter]="money" [parser]="unmoney" />
          </andes-form-field>
          <pre style="${LOG_STYLE}">model = {{ form.value | json }}</pre>
        </form>
      `,
    };
  },
};
