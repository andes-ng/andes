import { JsonPipe } from '@angular/common';
import { Component, computed, input, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import type { Meta, StoryObj } from '@storybook/angular';
import { startWith } from 'rxjs';

import { AndesButton } from '../button/button';
import { AndesCheckbox } from '../checkbox/checkbox';
import { ANDES_DIALOG_IMPORTS } from '../dialog/dialog';
import { AndesInput } from '../input/input';
import { AndesSelect } from '../select/select';
import { AndesForm } from './form';
import { AndesFormControl } from './form-control';
import { AndesFormField } from './form-field';
import type { AndesFormProviderEvent } from './form-field-tokens';
import { PLAN_OPTIONS } from './form-field.stories';
import { AndesFormProvider } from './form-provider';

const moduleMetadata = {
  imports: [
    JsonPipe,
    ReactiveFormsModule,
    ANDES_DIALOG_IMPORTS,
    AndesFormProvider,
    AndesForm,
    AndesFormControl,
    AndesFormField,
    AndesButton,
    AndesCheckbox,
    AndesInput,
    AndesSelect,
  ],
};

/** Shared look for the small result panels the stories below print into. */
const LOG_STYLE =
  'margin: 0; padding: 0.5rem 0.75rem; border-radius: var(--andes-radius-md); background: var(--andes-color-muted); color: var(--andes-color-foreground); font-family: var(--andes-font-family), sans-serif; font-size: 0.75rem; line-height: 1.25rem; white-space: pre-wrap;';

/** These stories take no controls. */
interface LinkedArgs {
  readonly unused?: never;
}

const meta: Meta<LinkedArgs> = {
  title: 'Data Entry/Form/Linked',
  parameters: {
    docs: {
      description: {
        component: [
          'A form rarely lives alone: it sits in a dialog whose footer holds the button, or beside',
          'other forms that save together, or in a component whose parent owns the data.',
          '`andesFormProvider` links the named `andesForm`s below it - a registry by name,',
          '`(formChange)` and `(formFinish)` for all of them, and `submit(name)` / `reset(name)` for',
          'a button that lives outside the form.',
        ].join('\n'),
      },
    },
  },
};

export default meta;

type Story = StoryObj<LinkedArgs>;

/**
 * A form in a dialog. The form sits in the dialog's body, its Create button in the dialog's own
 * footer - outside the `<form>` - and the provider joins them: the footer button is disabled
 * until the form `canSubmit()` and calls `submit('project')`, which runs the form's normal
 * submit (so an invalid one scrolls to its first error), and `(formFinish)` closes the dialog
 * with the value. The provider reaches the form through the place it was declared, so it works
 * although the dialog renders its content in an overlay. Cancel, Escape and the backdrop
 * discard the draft.
 */
export const FormInADialog: Story = {
  render: () => {
    const open = signal(false);
    const saving = signal(false);
    const log = signal('');
    const project = new FormGroup({
      name: new FormControl('', Validators.required),
      owner: new FormControl('', [Validators.required, Validators.email]),
      plan: new FormControl('free', Validators.required),
    });
    return {
      moduleMetadata,
      props: {
        open,
        saving,
        log,
        project,
        plans: PLAN_OPTIONS,
        finish: (event: AndesFormProviderEvent) => {
          saving.set(true);
          setTimeout(() => {
            saving.set(false);
            open.set(false);
            log.set(`Created ${JSON.stringify(event.value)}`);
            project.reset({ plan: 'free' });
          }, 700);
        },
      },
      template: `
        <div andesFormProvider #linked="andesFormProvider" (formFinish)="finish($event)">
          <andes-button (click)="open.set(true)">New project</andes-button>
          <andes-dialog
            [(open)]="open"
            footer="default"
            okText="Create"
            [okDisabled]="!linked.get('project')?.canSubmit()"
            [confirmLoading]="saving()"
            (ok)="linked.submit('project')"
            (cancelled)="project.reset({ plan: 'free' })"
          >
            <andes-dialog-content *andesDialogContent>
              <div andesDialogHeader>
                <h2 andesDialogTitle>New project</h2>
                <p andesDialogDescription>Create is enabled once the form is complete.</p>
              </div>
              <form andesForm name="project" [formGroup]="project" scrollToFirstError style="padding-block-end: 1rem;">
                <andes-form-field label="Name">
                  <andes-input formControlName="name" />
                </andes-form-field>
                <andes-form-field label="Owner email">
                  <andes-input formControlName="owner" type="email" />
                </andes-form-field>
                <andes-form-field label="Plan">
                  <andes-select formControlName="plan" [options]="plans" />
                </andes-form-field>
              </form>
            </andes-dialog-content>
          </andes-dialog>
          @if (log()) {
            <pre style="${LOG_STYLE} margin-top: 1rem; max-width: 420px;">{{ log() }}</pre>
          }
        </div>
      `,
    };
  },
};

/**
 * Linked forms: two forms side by side, each with a `name`, under one `andesFormProvider`. It
 * lists the forms it knows, reports every change and every valid submit with the form's name,
 * and its own `canSubmit` is true when all of them are ready - so one button saves both, in
 * the order it chooses, through each form's regular submit path.
 */
export const LinkedForms: Story = {
  render: () => {
    const log = signal<string[]>([]);
    const push = (line: string) =>
      log.update((lines) => [...lines.slice(-5), line]);
    return {
      moduleMetadata,
      props: {
        log,
        profile: new FormGroup({
          name: new FormControl('', Validators.required),
          email: new FormControl('', [Validators.required, Validators.email]),
        }),
        billing: new FormGroup({
          card: new FormControl('', [
            Validators.required,
            Validators.minLength(8),
          ]),
        }),
        changed: (event: AndesFormProviderEvent) =>
          push(`formChange ${event.name} ${JSON.stringify(event.value)}`),
        finished: (event: AndesFormProviderEvent) =>
          push(`formFinish ${event.name} ${JSON.stringify(event.value)}`),
        saveAll: (linked: AndesFormProvider) => {
          linked.submit('profile');
          linked.submit('billing');
        },
      },
      template: `
        <div
          andesFormProvider
          #linked="andesFormProvider"
          (formChange)="changed($event)"
          (formFinish)="finished($event)"
          style="display: flex; flex-direction: column; gap: 1.5rem; width: min(560px, 100vw - 2rem);"
        >
          <form andesForm name="profile" [formGroup]="profile" (ngSubmit)="profile.markAllAsTouched()">
            <andes-form-field label="Name">
              <andes-input formControlName="name" />
            </andes-form-field>
            <andes-form-field label="Email">
              <andes-input formControlName="email" type="email" />
            </andes-form-field>
          </form>
          <form andesForm name="billing" [formGroup]="billing" (ngSubmit)="billing.markAllAsTouched()">
            <andes-form-field label="Card number">
              <andes-input formControlName="card" />
            </andes-form-field>
          </form>
          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <andes-button [disabled]="!linked.canSubmit()" (click)="saveAll(linked)">Save both</andes-button>
            <span style="font-family: var(--andes-font-family), sans-serif; font-size: 0.75rem; color: var(--andes-color-muted-foreground);">
              forms: {{ linked.names().join(', ') }} · ready: {{ linked.canSubmit() }}
            </span>
          </div>
          <pre style="${LOG_STYLE}">{{ log().join('\\n') || 'Type in a form, then save.' }}</pre>
        </div>
      `,
    };
  },
};

/** The profile fields, with the form handed in by whoever owns the data. */
@Component({
  selector: 'andes-story-profile-fields',
  imports: [
    ReactiveFormsModule,
    AndesForm,
    AndesFormField,
    AndesInput,
    AndesCheckbox,
  ],
  template: `
    <form andesForm [formGroup]="form()" layout="horizontal" [labelCol]="7">
      <andes-form-field label="Name">
        <andes-input formControlName="name" />
      </andes-form-field>
      <andes-form-field label="Email">
        <andes-input formControlName="email" type="email" />
      </andes-form-field>
      <andes-form-field label="Newsletter">
        <andes-checkbox formControlName="newsletter"
          >Send me product news</andes-checkbox
        >
      </andes-form-field>
    </form>
  `,
})
class ProfileFields {
  readonly form = input.required<FormGroup>();
}

@Component({
  selector: 'andes-story-store-in-parent',
  imports: [JsonPipe, AndesButton, ProfileFields],
  template: `
    <div
      style="display: flex; flex-direction: column; gap: 1rem; width: min(520px, 100vw - 2rem);"
    >
      <andes-story-profile-fields [form]="profile" />
      <div style="display: flex; gap: 0.5rem;">
        <andes-button size="sm" variant="outline" (click)="load()"
          >Load saved</andes-button
        >
        <andes-button size="sm" variant="outline" (click)="profile.reset()"
          >Clear</andes-button
        >
      </div>
      <pre style="${LOG_STYLE}">
The parent holds the data ({{ summary() }}):
{{ value() | json }}</pre>
    </div>
  `,
})
class StoreInParentDemo {
  /** The form lives here: the child only draws it. */
  protected readonly profile = new FormGroup({
    name: new FormControl('', Validators.required),
    email: new FormControl('', [Validators.required, Validators.email]),
    newsletter: new FormControl(false),
  });
  protected readonly value = toSignal(
    this.profile.valueChanges.pipe(startWith(this.profile.value)),
  );
  protected readonly summary = computed(() =>
    this.value()?.name ? 'filled' : 'empty',
  );
  protected load(): void {
    this.profile.setValue({
      name: 'Ada Lovelace',
      email: 'ada@lovelace.dev',
      newsletter: true,
    });
  }
}

/**
 * Store the form data in an upper component: the parent creates the `FormGroup` and passes it
 * down, the child component only draws the fields, and the parent reads the value as a signal
 * and loads or clears it from its own buttons. Nothing is mirrored into a second store - the
 * `FormGroup` is the store, and the parent is where it lives.
 */
export const StoreInParent: Story = {
  render: () => ({
    moduleMetadata: { imports: [StoreInParentDemo] },
    template: `<andes-story-store-in-parent />`,
  }),
};

@Component({
  selector: 'andes-story-watch',
  imports: [
    JsonPipe,
    ReactiveFormsModule,
    AndesForm,
    AndesFormControl,
    AndesFormField,
    AndesInput,
    AndesSelect,
  ],
  template: `
    <form
      andesForm
      [formGroup]="form"
      (valuesChange)="whole.set($event)"
      style="width: min(460px, 100vw - 2rem);"
    >
      <andes-form-field label="Plan">
        <andes-select formControlName="plan" [options]="plans" />
      </andes-form-field>
      @if (plan() !== 'free') {
        <andes-form-field label="Seats" extra="Shown for a paid plan.">
          <andes-input formControlName="seats" type="number" />
        </andes-form-field>
      }
      <andes-form-field label="Name">
        <andes-input
          formControlName="name"
          andesFormControl
          #name="andesFormControl"
        />
      </andes-form-field>
      <pre style="${LOG_STYLE}">
plan (a signal of the control) = {{ plan() }}
name (the directive’s value signal) = {{ name.value() }}
(valuesChange) = {{ whole() | json }}</pre>
    </form>
  `,
})
class WatchDemo {
  protected readonly plans = PLAN_OPTIONS;
  protected readonly form = new FormGroup({
    plan: new FormControl('free'),
    seats: new FormControl(1),
    name: new FormControl(''),
  });
  /** Watch one control: its `valueChanges` as a signal. */
  protected readonly plan = toSignal(
    this.form.controls.plan.valueChanges.pipe(
      startWith(this.form.controls.plan.value),
    ),
  );
  /** Watch the whole form: the latest `(valuesChange)`. */
  protected readonly whole = signal<unknown>(this.form.value);
}

/**
 * Watch a field: three ways, none of them a hook. A control's `valueChanges` as a signal
 * (`toSignal`) drives the Seats field; `andesFormControl`'s own `value()` signal, read through a
 * template reference, shows the name; and `(valuesChange)` on `andesForm` reports the whole
 * form each time anything changes.
 */
export const Watch: Story = {
  render: () => ({
    moduleMetadata: { imports: [WatchDemo] },
    template: `<andes-story-watch />`,
  }),
};
