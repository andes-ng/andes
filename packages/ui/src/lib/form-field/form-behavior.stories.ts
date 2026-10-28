import { signal } from '@angular/core';
import {
  type AbstractControl,
  FormArray,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  type ValidationErrors,
  Validators,
} from '@angular/forms';
import type { Meta, StoryObj } from '@storybook/angular';

import { AndesButton } from '../button/button';
import { AndesForm } from './form';
import { AndesFormControl } from './form-control';
import { AndesFormField } from './form-field';
import type {
  AndesFormInvalidSubmit,
  AndesFormShowErrorsOn,
} from './form-field-tokens';
import { withDemoControls } from './form-field.stories';

const moduleMetadata = {
  imports: [
    ReactiveFormsModule,
    AndesForm,
    AndesFormField,
    AndesFormControl,
    AndesButton,
  ],
};

/** Shared look for the small result panels the stories below print into. */
const LOG_STYLE =
  'margin: 0; padding: 0.5rem 0.75rem; border-radius: var(--andes-radius-md); background: var(--andes-color-muted); color: var(--andes-color-foreground); font-family: var(--andes-font-family), sans-serif; font-size: 0.75rem; line-height: 1.25rem; white-space: pre-wrap;';

/** These stories take no controls; the typed shape only keeps the shared decorator assignable. */
interface BehaviorArgs {
  readonly unused?: never;
}

const meta: Meta<BehaviorArgs> = {
  title: 'Data Entry/Form/Behavior',
  decorators: [withDemoControls],
};

export default meta;

type Story = StoryObj<BehaviorArgs>;

/**
 * `showErrorsOn` picks when fields start showing their status - type into each column, tab
 * out, then submit. When validation *runs* stays Angular's `updateOn`.
 */
export const ShowErrorsOn: Story = {
  render: () => ({
    moduleMetadata,
    props: {
      gates: [
        'interacted',
        'touched',
        'dirty',
        'submitted',
        'always',
      ] satisfies AndesFormShowErrorsOn[],
      forms: Array.from(
        { length: 5 },
        () =>
          new FormGroup({
            code: new FormControl('', [
              Validators.required,
              Validators.minLength(4),
            ]),
          }),
      ),
    },
    template: `
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(11rem, 1fr)); gap: 1.5rem; max-width: 960px;">
        @for (gate of gates; track gate; let i = $index) {
          <form andesForm [showErrorsOn]="gate" [formGroup]="forms[i]">
            <andes-form-field [label]="gate" hasFeedback>
              <input andesFormControl formControlName="code" class="andes-demo-control" />
            </andes-form-field>
            <andes-button type="submit" variant="outline" size="sm" style="align-self: flex-start;">Submit</andes-button>
          </form>
        }
      </div>
    `,
  }),
};

/**
 * `scrollToFirstError`: submit the empty form - the page scrolls to, and focuses, the first
 * field in error (the spacer pushes it off-screen first). Errors show on submit without any
 * `markAllAsTouched()`, because fields also reveal errors once their form is submitted.
 */
export const ScrollToFirstError: Story = {
  render: () => ({
    moduleMetadata,
    props: {
      form: new FormGroup({
        first: new FormControl('Filled in'),
        second: new FormControl('', Validators.required),
      }),
    },
    template: `
      <form andesForm scrollToFirstError [formGroup]="form" style="max-width: 360px;">
        <andes-form-field label="First">
          <input andesFormControl formControlName="first" class="andes-demo-control" />
        </andes-form-field>
        <div style="height: 120vh; border-inline-start: 2px dashed var(--andes-color-border); padding-inline-start: 0.5rem; font-family: var(--andes-font-family), sans-serif; color: var(--andes-color-muted-foreground);">
          (spacer)
        </div>
        <andes-form-field label="Second">
          <input andesFormControl formControlName="second" class="andes-demo-control" />
        </andes-form-field>
        <andes-button type="submit" style="position: sticky; bottom: 1rem; align-self: flex-start;">Submit</andes-button>
      </form>
    `,
  }),
};

/**
 * `(validSubmit)` emits the value of a valid submit; `(invalidSubmit)` emits the value plus
 * every failing control as `{ path, errors }` - both after async validators settle, so the
 * username check (≈0.6 s, "admin" is taken) is part of the verdict. `scrollToField(path)`
 * jumps to any field by its control path.
 */
export const SubmitOutputs: Story = {
  render: () => {
    const taken = (control: AbstractControl) =>
      new Promise<ValidationErrors | null>((resolve) =>
        setTimeout(
          () => resolve(control.value === 'admin' ? { taken: true } : null),
          600,
        ),
      );
    const log = signal('Submit the form to see the verdict.');
    return {
      moduleMetadata,
      props: {
        log,
        form: new FormGroup({
          username: new FormControl('admin', {
            validators: Validators.required,
            asyncValidators: taken,
          }),
          address: new FormGroup({
            city: new FormControl('', Validators.required),
          }),
        }),
        onValid: (value: unknown) =>
          log.set('validSubmit\n' + JSON.stringify(value, null, 2)),
        onInvalid: (event: AndesFormInvalidSubmit) =>
          log.set(
            'invalidSubmit\n' +
              event.errors
                .map((e) => e.path.join('.') + ' → ' + Object.keys(e.errors))
                .join('\n'),
          ),
      },
      template: `
        <form
          andesForm
          #f="andesForm"
          [formGroup]="form"
          layout="horizontal"
          [labelCol]="8"
          (validSubmit)="onValid($event)"
          (invalidSubmit)="onInvalid($event)"
          style="width: 100%; max-width: 560px;"
        >
          <andes-form-field label="Username" hasFeedback [errorMessages]="{ taken: 'That username is taken.' }">
            <input andesFormControl formControlName="username" class="andes-demo-control" />
          </andes-form-field>
          <ng-container formGroupName="address">
            <andes-form-field label="City">
              <input andesFormControl formControlName="city" class="andes-demo-control" />
            </andes-form-field>
          </ng-container>
          <andes-form-field>
            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
              <andes-button type="submit">Submit</andes-button>
              <andes-button variant="outline" (click)="f.scrollToField('address.city')">Go to city</andes-button>
            </div>
          </andes-form-field>
          <pre style="${LOG_STYLE}">{{ log() }}</pre>
        </form>
      `,
    };
  },
};

/**
 * Dynamic rows with a plain `FormArray`: every row is its own field (only the first one
 * labelled, the rest keep the empty label column so they line up), and the array-level
 * validator's error is shown on the field holding the add button through `validateStatus` +
 * `help`. Nothing beyond `FormArray` is needed.
 */
export const DynamicRows: Story = {
  render: () => {
    const emails = new FormArray(
      [
        new FormControl('ada@lovelace.dev', [
          Validators.required,
          Validators.email,
        ]),
      ],
      // `required` on an array fails while it is empty.
      Validators.required,
    );
    const form = new FormGroup({ emails });
    const log = signal('');
    return {
      moduleMetadata,
      props: {
        form,
        emails,
        log,
        add: () =>
          emails.push(
            new FormControl('', [Validators.required, Validators.email]),
          ),
        remove: (index: number) => {
          emails.removeAt(index);
          emails.markAsTouched();
        },
        onValid: (value: unknown) => log.set(JSON.stringify(value)),
      },
      template: `
        <form
          andesForm
          [formGroup]="form"
          layout="horizontal"
          [labelCol]="8"
          (validSubmit)="onValid($event)"
          style="width: 100%; max-width: 560px;"
        >
          <ng-container formArrayName="emails">
            @for (control of emails.controls; track control; let i = $index) {
              <andes-form-field [label]="i === 0 ? 'Notify' : undefined">
                <div style="display: flex; gap: 0.5rem;">
                  <input andesFormControl [formControlName]="i" type="email" placeholder="name@company.com" class="andes-demo-control" />
                  <andes-button variant="ghost" size="icon" [aria-label]="'Remove email ' + (i + 1)" (click)="remove(i)">✕</andes-button>
                </div>
              </andes-form-field>
            }
          </ng-container>
          <andes-form-field
            [label]="emails.length === 0 ? 'Notify' : undefined"
            [validateStatus]="emails.errors && emails.touched ? 'error' : undefined"
            [help]="emails.errors && emails.touched ? 'Add at least one email.' : undefined"
          >
            <div style="display: flex; gap: 0.5rem;">
              <andes-button variant="dashed" (click)="add()">Add email</andes-button>
              <andes-button type="submit">Save</andes-button>
            </div>
          </andes-form-field>
          @if (log()) {
            <pre style="${LOG_STYLE}">validSubmit {{ log() }}</pre>
          }
        </form>
      `,
    };
  },
};
