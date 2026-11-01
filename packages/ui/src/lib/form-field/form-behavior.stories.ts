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
import {
  CdkDrag,
  CdkDragHandle,
  type CdkDragDrop,
  CdkDropList,
} from '@angular/cdk/drag-drop';
import type { Meta, StoryObj } from '@storybook/angular';

import { AndesButton } from '../button/button';
import { AndesInput } from '../input/input';
import { AndesForm } from './form';
import { AndesFormError } from './form-error';
import { AndesFormField } from './form-field';
import { AndesFormIcon } from './form-icons';
import { LIST_ROW_STYLE } from './form-list-demo';
import type {
  AndesFormInvalidSubmit,
  AndesFormShowErrorsOn,
} from './form-field-tokens';

const moduleMetadata = {
  imports: [
    ReactiveFormsModule,
    CdkDrag,
    CdkDragHandle,
    CdkDropList,
    AndesForm,
    AndesFormField,
    AndesFormError,
    AndesButton,
    AndesFormIcon,
    AndesInput,
  ],
};

/** Shared look for the small result panels the stories below print into. */
const LOG_STYLE =
  'margin: 0; padding: 0.5rem 0.75rem; border-radius: var(--andes-radius-md); background: var(--andes-color-muted); color: var(--andes-color-foreground); font-family: var(--andes-font-family), sans-serif; font-size: 0.75rem; line-height: 1.25rem; white-space: pre-wrap;';

/** These stories take no controls. */
interface BehaviorArgs {
  readonly unused?: never;
}

const meta: Meta<BehaviorArgs> = {
  title: 'Data Entry/Form/Behavior',
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
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(11rem, 1fr)); gap: 1.5rem; width: min(960px, 100vw - 2rem);">
        @for (gate of gates; track gate; let i = $index) {
          <form andesForm [showErrorsOn]="gate" [formGroup]="forms[i]">
            <andes-form-field [label]="gate">
              <andes-input formControlName="code" />
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
      <form andesForm scrollToFirstError [formGroup]="form" style="width: min(360px, 100vw - 2rem);">
        <andes-form-field label="First">
          <andes-input formControlName="first" />
        </andes-form-field>
        <div style="height: 120vh; border-inline-start: 2px dashed var(--andes-color-border); padding-inline-start: 0.5rem; font-family: var(--andes-font-family), sans-serif; color: var(--andes-color-muted-foreground);">
          (spacer)
        </div>
        <andes-form-field label="Second">
          <andes-input formControlName="second" />
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
          style="width: min(560px, 100vw - 2rem);"
        >
          <andes-form-field label="Username" [errorMessages]="{ taken: 'That username is taken.' }">
            <andes-input formControlName="username" />
          </andes-form-field>
          <ng-container formGroupName="address">
            <andes-form-field label="City">
              <andes-input formControlName="city" />
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
 * labelled, the rest keep the empty label column so they line up), reordered by dragging the
 * handle (CDK drag and drop moving the array's controls). The array's own error - `required`
 * on an empty array - shows under the list with `<andes-form-error [control]="emails">`, once
 * the list was touched or the form submitted. Nothing beyond `FormArray` is needed.
 */
export const DynamicRows: Story = {
  render: () => {
    const emails = new FormArray(
      [
        new FormControl('ada@lovelace.dev', [
          Validators.required,
          Validators.email,
        ]),
        new FormControl('grace@hopper.dev', [
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
        move: (event: CdkDragDrop<unknown>) => {
          const control = emails.at(event.previousIndex);
          emails.removeAt(event.previousIndex, { emitEvent: false });
          emails.insert(event.currentIndex, control);
        },
        onValid: (value: unknown) => log.set(JSON.stringify(value)),
      },
      template: `
        ${LIST_ROW_STYLE}
        <form
          andesForm
          [formGroup]="form"
          layout="horizontal"
          [labelCol]="8"
          (validSubmit)="onValid($event)"
          style="width: min(560px, 100vw - 2rem);"
        >
          <div formArrayName="emails" class="demo-list" cdkDropList (cdkDropListDropped)="move($event)">
            @for (control of emails.controls; track control; let i = $index) {
              <andes-form-field [label]="i === 0 ? 'Notify' : undefined" class="demo-row" cdkDrag>
                <div class="demo-inline">
                  <andes-input [formControlName]="i" type="email" placeholder="name@company.com" />
                  <span class="demo-quiet demo-grip" cdkDragHandle role="img" [attr.aria-label]="'Move email ' + (i + 1)" style="display: inline-flex; padding: 0.25rem;"><andes-form-icon name="grip" /></span>
                  <andes-button class="demo-remove" variant="ghost" size="icon-sm" [aria-label]="'Remove email ' + (i + 1)" (click)="remove(i)"><andes-form-icon name="minus-circle" /></andes-button>
                </div>
              </andes-form-field>
            }
          </div>
          <andes-form-field [label]="emails.length === 0 ? 'Notify' : undefined">
            <andes-button variant="dashed" fullWidth (click)="add()"><andes-form-icon name="plus" /> Add email</andes-button>
            <andes-form-error [control]="emails" [errorMessages]="{ required: 'Add at least one email.' }" />
          </andes-form-field>
          <andes-form-field>
            <andes-button type="submit">Save</andes-button>
          </andes-form-field>
          @if (log()) {
            <pre style="${LOG_STYLE}">validSubmit {{ log() }}</pre>
          }
        </form>
      `,
    };
  },
};
