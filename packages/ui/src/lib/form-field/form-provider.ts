import { computed, Directive, forwardRef, output, signal } from '@angular/core';

import {
  ANDES_FORM_PROVIDER,
  type AndesFormProviderApi,
  type AndesFormProviderEvent,
  type AndesLinkedForm,
} from './form-field-tokens';

/**
 * Links the forms below it: it keeps a registry of the named `andesForm`s inside, reports their
 * changes and their valid submits to one place, and lets a button outside any of them submit or
 * reset one by name. It is what a form in a dialog needs - the footer button lives beside the
 * form, not in it - and what a page needs to collect the data of several forms.
 *
 * ```html
 * <div andesFormProvider #linked="andesFormProvider"
 *      (formChange)="draft.set($event.value)" (formFinish)="save($event.name, $event.value)">
 *   <form andesForm name="profile" [formGroup]="profile">...</form>
 *   <button [disabled]="!linked.get('profile')?.canSubmit()" (click)="linked.submit('profile')">
 *     Save
 *   </button>
 * </div>
 * ```
 *
 * A form joins by having a `name`; forms with none stay out of it. The provider reaches the
 * forms through the injector of where the form was declared, so a form inside an
 * `<ng-template>` rendered elsewhere - a dialog's content - still finds the provider around the
 * template.
 */
@Directive({
  selector: '[andesFormProvider]',
  exportAs: 'andesFormProvider',
  providers: [
    {
      provide: ANDES_FORM_PROVIDER,
      useExisting: forwardRef(() => AndesFormProvider),
    },
  ],
})
export class AndesFormProvider implements AndesFormProviderApi {
  private readonly registry = signal<ReadonlyMap<string, AndesLinkedForm>>(
    new Map(),
  );

  /** A named form's value changed - typed by the user or set from code. */
  readonly formChange = output<AndesFormProviderEvent>();

  /** A named form was submitted and is valid. */
  readonly formFinish = output<AndesFormProviderEvent>();

  /** The forms registered right now, by name. */
  readonly forms = this.registry.asReadonly();

  /** The names of the registered forms. */
  readonly names = computed(() => [...this.registry().keys()]);

  /** Whether every registered form could be submitted right now (and there is at least one). */
  readonly canSubmit = computed(() => {
    const forms = [...this.registry().values()];
    return forms.length > 0 && forms.every((form) => form.canSubmit());
  });

  /** The form registered as `name`, or `undefined`. Read inside a `computed` or a template to
   *  follow forms joining and leaving. */
  get(name: string): AndesLinkedForm | undefined {
    return this.registry().get(name);
  }

  /** Submits the form `name` as its own submit button would. Returns whether it exists. */
  submit(name: string): boolean {
    const form = this.registry().get(name);
    form?.submit();
    return !!form;
  }

  /** Resets the form `name` (to `value`, or each control's initial value). Returns whether it
   *  exists. */
  reset(name: string, value?: unknown): boolean {
    const form = this.registry().get(name);
    form?.reset(value);
    return !!form;
  }

  register(name: string, form: AndesLinkedForm): () => void {
    this.registry.update((forms) => new Map(forms).set(name, form));
    return () =>
      this.registry.update((forms) => {
        // A later form may have taken the name over; only remove our own entry.
        if (forms.get(name) !== form) {
          return forms;
        }
        const next = new Map(forms);
        next.delete(name);
        return next;
      });
  }

  notifyChange(name: string, form: AndesLinkedForm, value: unknown): void {
    this.formChange.emit({ name, form, value });
  }

  notifyFinish(name: string, form: AndesLinkedForm, value: unknown): void {
    this.formFinish.emit({ name, form, value });
  }
}
