import { NgTemplateOutlet } from '@angular/common';
import { Component, signal, viewChild } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import { ANDES_DIALOG_IMPORTS } from '../dialog/dialog';
import { AndesForm } from './form';
import { AndesFormControl } from './form-control';
import { AndesFormField } from './form-field';
import type { AndesFormProviderEvent } from './form-field-tokens';
import { AndesFormProvider } from './form-provider';

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
  selector: 'andes-test-provider-host',
  imports: [
    ReactiveFormsModule,
    AndesFormProvider,
    AndesForm,
    AndesFormField,
    AndesFormControl,
    NgTemplateOutlet,
  ],
  template: `<div
      andesFormProvider
      #linked="andesFormProvider"
      (formChange)="changes.push($event)"
      (formFinish)="finishes.push($event)"
    >
      <form
        andesForm
        id="profile-form"
        [name]="profileName()"
        [formGroup]="profile"
      >
        <andes-form-field label="Name">
          <input andesFormControl formControlName="name" />
        </andes-form-field>
      </form>
      @if (showBilling()) {
        <form andesForm name="billing" [formGroup]="billing">
          <andes-form-field label="Card">
            <input andesFormControl formControlName="card" />
          </andes-form-field>
        </form>
      }
      <form andesForm [formGroup]="anonymous">
        <input andesFormControl formControlName="note" />
      </form>
      <ng-template #late>
        <form andesForm name="late" [formGroup]="lateGroup">
          <input andesFormControl formControlName="reason" />
        </form>
      </ng-template>
    </div>
    <section class="elsewhere">
      @if (showLate()) {
        <ng-container [ngTemplateOutlet]="late" />
      }
    </section>`,
})
class ProviderHost {
  readonly provider = viewChild.required(AndesFormProvider);
  readonly profileName = signal<string | undefined>('profile');
  readonly showBilling = signal(true);
  readonly showLate = signal(false);
  readonly changes: AndesFormProviderEvent[] = [];
  readonly finishes: AndesFormProviderEvent[] = [];
  readonly profile = new FormGroup({
    name: new FormControl('', Validators.required),
  });
  readonly billing = new FormGroup({
    card: new FormControl('4242', Validators.required),
  });
  readonly anonymous = new FormGroup({ note: new FormControl('') });
  readonly lateGroup = new FormGroup({
    reason: new FormControl('', Validators.required),
  });
}

async function setup() {
  const fixture = TestBed.createComponent(ProviderHost);
  await settle(fixture);
  await settle(fixture);
  return {
    fixture,
    host: fixture.componentInstance,
    provider: fixture.componentInstance.provider(),
    el: fixture.nativeElement as HTMLElement,
    refresh: () => settle(fixture),
  };
}

describe('AndesFormProvider', () => {
  describe('registry', () => {
    it('lists the named forms inside it, and leaves a form with no name out', async () => {
      const { provider } = await setup();

      expect(provider.names()).toEqual(['profile', 'billing']);
      expect(provider.get('profile')).toBeDefined();
      expect(provider.get('nope')).toBeUndefined();
    });

    it('follows a form being renamed, removed and added', async () => {
      const { host, provider, refresh } = await setup();

      host.profileName.set('person');
      await refresh();
      expect(provider.names().sort()).toEqual(['billing', 'person']);

      host.showBilling.set(false);
      await refresh();
      expect(provider.names()).toEqual(['person']);

      host.profileName.set(undefined);
      await refresh();
      expect(provider.names()).toEqual([]);
    });

    it('finds a form declared inside it but rendered elsewhere', async () => {
      const { host, provider, el, refresh } = await setup();

      host.showLate.set(true);
      await refresh();

      expect(el.querySelector('.elsewhere form')).not.toBeNull();
      expect(provider.names()).toContain('late');

      host.showLate.set(false);
      await refresh();
      expect(provider.names()).not.toContain('late');
    });

    it('lets a later form take a name over without the earlier one removing it', async () => {
      const fixture = TestBed.createComponent(ProviderHost);
      await settle(fixture);
      const provider = fixture.componentInstance.provider();
      const earlier = present(provider.get('profile'));
      const replacement = { ...earlier } as typeof earlier;

      const unregister = provider.register('profile', replacement);
      expect(provider.get('profile')).toBe(replacement);

      // The first form leaving must not remove the name the second now holds.
      fixture.componentInstance.profileName.set('renamed');
      await settle(fixture);
      expect(provider.get('profile')).toBe(replacement);

      unregister();
      expect(provider.get('profile')).toBeUndefined();
    });
  });

  describe('formChange and formFinish', () => {
    it('reports the name, the form and the new value on every change', async () => {
      const { host, provider, el, refresh } = await setup();
      const input = present(
        el.querySelector<HTMLInputElement>('#profile-form input'),
      );

      type(input, 'Ada');
      await refresh();

      expect(host.changes).toHaveLength(1);
      expect(host.changes[0].name).toBe('profile');
      expect(host.changes[0].value).toEqual({ name: 'Ada' });
      expect(host.changes[0].form).toBe(provider.get('profile'));
    });

    it('reports a change made from code too, and none for a form with no name', async () => {
      const { host, refresh } = await setup();

      host.billing.controls.card.setValue('1111');
      host.anonymous.controls.note.setValue('hi');
      await refresh();

      expect(host.changes.map((c) => c.name)).toEqual(['billing']);
    });

    it('reports a valid submit with the value, and nothing for an invalid one', async () => {
      const { host, el, refresh } = await setup();
      const form = present(el.querySelector<HTMLFormElement>('#profile-form'));

      form.dispatchEvent(new Event('submit', { cancelable: true }));
      await refresh();
      expect(host.finishes).toEqual([]);

      host.profile.controls.name.setValue('Ada');
      form.dispatchEvent(new Event('submit', { cancelable: true }));
      await refresh();

      expect(host.finishes).toHaveLength(1);
      expect(host.finishes[0].name).toBe('profile');
      expect(host.finishes[0].value).toEqual({ name: 'Ada' });
    });
  });

  describe('submit, reset and canSubmit by name', () => {
    it('submits a form from outside it, through its own submit path', async () => {
      const { host, provider, refresh } = await setup();
      host.billing.controls.card.setValue('1111');

      expect(provider.submit('billing')).toBe(true);
      await refresh();

      expect(host.finishes.map((f) => f.name)).toEqual(['billing']);
      expect(provider.submit('nope')).toBe(false);
    });

    it('resets a form by name, to its initial values or to given ones', async () => {
      const { host, provider, refresh } = await setup();
      host.billing.controls.card.setValue('1111');
      host.billing.controls.card.markAsTouched();

      expect(provider.reset('billing')).toBe(true);
      await refresh();
      expect(host.billing.controls.card.value).toBeNull();
      expect(host.billing.controls.card.touched).toBe(false);

      provider.reset('billing', { card: '9999' });
      await refresh();
      expect(host.billing.controls.card.value).toBe('9999');
      expect(provider.reset('nope')).toBe(false);
    });

    it('exposes each form’s canSubmit, and whether all of them are ready', async () => {
      const { host, provider, refresh } = await setup();

      expect(present(provider.get('profile')).canSubmit()).toBe(false);
      expect(present(provider.get('billing')).canSubmit()).toBe(true);
      expect(provider.canSubmit()).toBe(false);

      host.profile.controls.name.setValue('Ada');
      await refresh();

      expect(present(provider.get('profile')).canSubmit()).toBe(true);
      expect(provider.canSubmit()).toBe(true);
    });
  });
});

@Component({
  selector: 'andes-test-provider-dialog-host',
  imports: [
    ReactiveFormsModule,
    AndesFormProvider,
    AndesForm,
    AndesFormField,
    AndesFormControl,
    ANDES_DIALOG_IMPORTS,
  ],
  template: `<div
    andesFormProvider
    #linked="andesFormProvider"
    (formFinish)="finishes.push($event)"
  >
    <andes-dialog
      [(open)]="open"
      footer="default"
      okText="Create"
      [okDisabled]="!linked.get('project')?.canSubmit()"
      (ok)="linked.submit('project')"
    >
      <andes-dialog-content *andesDialogContent>
        <div andesDialogHeader>
          <h2 andesDialogTitle>New project</h2>
        </div>
        <form andesForm name="project" [formGroup]="project">
          <andes-form-field label="Name">
            <input andesFormControl formControlName="name" />
          </andes-form-field>
        </form>
      </andes-dialog-content>
    </andes-dialog>
  </div>`,
})
class DialogHost {
  readonly open = signal(false);
  readonly finishes: AndesFormProviderEvent[] = [];
  readonly project = new FormGroup({
    name: new FormControl('', Validators.required),
  });
}

describe('AndesFormProvider with a dialog', () => {
  it('submits a form in a dialog from the dialog’s own footer button', async () => {
    const fixture = TestBed.createComponent(DialogHost);
    await settle(fixture);
    expect(document.querySelector('form[name="project"]')).toBeNull();

    fixture.componentInstance.open.set(true);
    await settle(fixture);
    await settle(fixture);

    const form = present(
      document.querySelector<HTMLFormElement>('form[name="project"]'),
    );
    const ok = () =>
      Array.from(document.querySelectorAll('button')).find((button) =>
        button.textContent?.includes('Create'),
      ) as HTMLButtonElement;
    expect(ok().disabled).toBe(true);

    type(present(form.querySelector('input')), 'Andes');
    await settle(fixture);
    expect(ok().disabled).toBe(false);

    ok().click();
    await settle(fixture);

    expect(fixture.componentInstance.finishes).toHaveLength(1);
    expect(fixture.componentInstance.finishes[0].name).toBe('project');
    expect(fixture.componentInstance.finishes[0].value).toEqual({
      name: 'Andes',
    });
  });
});
