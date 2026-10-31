import { CommonModule } from '@angular/common';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import type { Decorator, Meta, StoryObj } from '@storybook/angular';

import { AndesButton } from '../button/button';
import { AndesForm } from './form';
import { AndesFormControl } from './form-control';
import { AndesFormDescription } from './form-description';
import { AndesFormError } from './form-error';
import { AndesFormField } from './form-field';
import { AndesFormLabel } from './form-label';

export const fieldModuleMetadata = {
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    AndesForm,
    AndesFormField,
    AndesFormLabel,
    AndesFormControl,
    AndesFormDescription,
    AndesFormError,
    // The one andes-ng control this package can depend on today: AndesButton is already on
    // `develop`. AndesInput/AndesSelect are still unmerged branches of their own - see the
    // "Using andes-ng's own controls" section of the docs below.
    AndesButton,
  ],
};

// Native controls on purpose: the field tints status and feedback only on a direct native child, and andesFormControl wires AndesInput by hand.
/**
 * Andes-look styling for the NATIVE controls these stories render (AndesInput/AndesSelect are
 * not on `develop` yet - see the docs below): the shared control scale (24/32/40px, 14px text)
 * and the shared field focus (border + 2px ring, never an outline outside the border). Injected once as a real stylesheet rather than
 * an inline `style` attribute: an inline border would outrank - and so hide - the field's own
 * status tint (`.andes-form-field--invalid :where(input)`), which is part of what these
 * stories demonstrate. Everything sits in zero-specificity `:where()` so any library rule wins.
 * Also used by the other form story files, hence exported (and excluded from the story list).
 */
export const DEMO_CONTROL_CSS = `
:where(.andes-demo-control) {
  box-sizing: border-box;
  width: 100%;
  height: 2rem;
  margin: 0;
  padding: 0.25rem 0.6875rem;
  border: 1px solid var(--andes-color-input);
  border-radius: 0.375rem;
  background: var(--andes-color-background);
  color: var(--andes-color-foreground);
  font-family: var(--andes-font-family), sans-serif;
  font-size: 0.875rem;
  line-height: 1.375rem;
  transition: border-color 150ms ease, box-shadow 150ms ease, background-color 150ms ease;
}
:where(.andes-demo-control)::placeholder {
  color: var(--andes-color-muted-foreground);
}
:where(.andes-demo-control:hover:not(:disabled)) {
  border-color: color-mix(in srgb, var(--andes-color-primary) 65%, var(--andes-color-input));
}
:where(.andes-demo-control:focus) {
  border-color: var(--andes-color-primary);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--andes-color-primary) 20%, transparent);
  outline: none;
}
:where(.andes-demo-control:disabled) {
  background: var(--andes-color-muted);
  color: var(--andes-color-muted-foreground);
  cursor: not-allowed;
}
:where([data-size='sm'] .andes-demo-control) {
  height: 1.5rem;
  padding: 0 0.4375rem;
  border-radius: 0.25rem;
}
:where([data-size='lg'] .andes-demo-control) {
  height: 2.5rem;
  padding: 0.4375rem 0.6875rem;
  border-radius: 0.5rem;
  font-size: 1rem;
  line-height: 1.5rem;
}
`;

export const withDemoControls: Decorator = (story) => {
  if (!document.getElementById('andes-demo-control-css')) {
    const style = document.createElement('style');
    style.id = 'andes-demo-control-css';
    style.textContent = DEMO_CONTROL_CSS;
    document.head.appendChild(style);
  }
  return story();
};

const meta: Meta<AndesFormField> = {
  title: 'Data Entry/Form/Field/Basics',
  component: AndesFormField,
  tags: ['autodocs'],
  excludeStories: [
    'DEMO_CONTROL_CSS',
    'withDemoControls',
    'fieldModuleMetadata',
  ],
  decorators: [withDemoControls],
  parameters: {
    docs: {
      description: {
        component: [
          'Wire `andesFormControl` onto the control itself, alongside `formControlName` /',
          '`[formControl]` / `[(ngModel)]`. For a **native** `<input>` / `<textarea>` /',
          '`<select>` everything (`id`/`for`, `aria-describedby`, `aria-invalid`,',
          '`aria-required`) is derived and applied automatically - nothing to hand-wire. That is',
          'what the stories below render.',
          '',
          '### Field features',
          '',
          '`validateStatus` (derived from the control - touched/dirty/submitted, pending,',
          'invalid - or set by hand), `hasFeedback` status icons, `help` / `extra` text,',
          'error messages generated from the control’s real `ValidationErrors` through a',
          'configurable message map (`errorMessages` on the field or `andesForm`, or',
          '`provideAndesFormErrorMessages()`), a required mark detected from',
          '`Validators.required` (`required` / `requiredMark` to override), `tooltip`, `label`',
          'and `noStyle`. Form-wide layout (`horizontal` / `vertical` / `inline`),',
          '`labelCol` / `wrapperCol`, `labelAlign`, `colon`, `size` and',
          '`scrollToFirstError` live on the `andesForm` directive - see the **Form** stories.',
          '',
          '### Using andes-ng’s own controls',
          '',
          'For a wrapper component that renders its real control inside its own template',
          '(`AndesInput`, `AndesSelect`, `AndesCheckbox`, `AndesSwitch`, `AndesRadioGroup`,',
          '`AndesSlider`), `andesFormControl` sits on the outer custom element, which is not a',
          'labelable form control and is deliberately kept out of the accessibility tree by',
          "those components' own host metadata. Writing `id`/`aria-*` there would reach neither",
          'the `<label for>` machinery nor the buried native control, so the directive writes',
          'nothing at all in that case and instead exposes `resolvedId()`, `labelledBy()`,',
          "`describedBy()`, `showError()` and `isRequired()` for you to bind into the wrapper's",
          'own inputs.',
          '',
          '**`AndesInput` is fully supported by that pattern** - verified against its own',
          'component source: it exposes `id`, `aria-labelledby`, `aria-describedby` and',
          '`aria-invalid` inputs, nulls each of them on its host element and forwards them onto',
          'the real `<input>` in its template, so the label is correctly associated *and*',
          'clickable. Its `required` input puts the native `required` attribute on that same',
          'inner `<input>`, which already implies `aria-required`:',
          '',
          '```html',
          '<andes-form-field #field="andesFormField">',
          '  <andes-form-label>Full name</andes-form-label>',
          '  <andes-input',
          '    andesFormControl',
          '    #ctrl="andesFormControl"',
          '    formControlName="name"',
          '    [id]="field.controlId()"',
          '    [aria-describedby]="ctrl.describedBy()"',
          '    [aria-invalid]="ctrl.showError()"',
          '    [required]="ctrl.isRequired()"',
          '  />',
          '  <andes-form-error>Your name is required.</andes-form-error>',
          '</andes-form-field>',
          '```',
          '',
          '### Known limitation: wrappers with no `id` input',
          '',
          '`AndesSelect`, `AndesCheckbox`, `AndesSwitch`, `AndesRadioGroup` and `AndesSlider`',
          'expose **no `id` input**, so `[id]="field.controlId()"` has nowhere to land and the',
          "label's `for` stays dangling - deliberately detectable rather than silently pointing",
          'at an element the platform refuses to associate. Adding an `id` input to each of them',
          'is the proper fix and has to happen on their own branches.',
          '',
          'All five *do* accept `aria-labelledby` and forward it onto their real internal',
          'control, so `AndesFormLabel` now stamps an id onto the `<label>` it renders and the',
          'field exposes it as `labelledBy()`. That gives those controls a correct accessible',
          'name today, without changing a line of their source:',
          '',
          '```html',
          '<andes-form-field>',
          '  <andes-form-label>Country</andes-form-label>',
          '  <andes-select',
          '    andesFormControl',
          '    #ctrl="andesFormControl"',
          '    formControlName="country"',
          '    [aria-labelledby]="ctrl.labelledBy()"',
          '    [aria-describedby]="ctrl.describedBy()"',
          '    [aria-invalid]="ctrl.showError()"',
          '  >',
          '    <andes-select-trigger><andes-select-value /></andes-select-trigger>',
          '    <andes-select-content>',
          '      <andes-select-item value="pe">Peru</andes-select-item>',
          '    </andes-select-content>',
          '  </andes-select>',
          '  <andes-form-error>Please pick a country.</andes-form-error>',
          '</andes-form-field>',
          '```',
          '',
          'It is an improvement, not a full substitute: `aria-labelledby` supplies the accessible',
          'name, but only a native `for`/`id` pair makes the label **clickable**. Label-click',
          'focus is the one thing still genuinely missing for those five.',
          '',
          '### Why these stories still render native controls',
          '',
          'Only `AndesButton` (used for the submit action in **Binding**) has landed',
          'on `develop` so far. `AndesInput` and `AndesSelect` are still open, unmerged PRs of',
          'their own - and `AndesSelect` additionally depends on the overlay and list-navigation',
          'primitives, which are two further unmerged PRs. Importing them here would make this',
          'package fail to build until all of those merge, so the live examples stay on native',
          'controls and the wiring for the andes-ng controls is documented above instead. Swap',
          'them in - using exactly the snippets above - once those branches are on `develop`.',
        ].join('\n'),
      },
    },
  },
};

export default meta;

type Story = StoryObj<AndesFormField>;

/**
 * The core anatomy: label, a native input carrying `andesFormControl` alongside
 * `[formControl]`, a description and an error. Focus the input then blur it without typing
 * anything to see the error appear - it stays hidden on load even though the field is
 * already invalid (empty + required), matching the idiomatic Angular
 * "invalid && (touched || dirty)" rule instead of shouting at the user immediately.
 *
 * The second field shows that the parts are optional: a description with no error slot at
 * all (an error slot with no description works too), and `aria-describedby` only ever
 * includes the parts actually present.
 */
export const Basic: Story = {
  render: () => ({
    moduleMetadata: fieldModuleMetadata,
    props: {
      email: new FormControl('', {
        validators: [Validators.required, Validators.email],
      }),
      coupon: new FormControl(''),
    },
    template: `
      <div style="max-width: 320px; display: flex; flex-direction: column; gap: 1.25rem;">
        <andes-form-field>
          <andes-form-label>Email</andes-form-label>
          <input
            andesFormControl
            [formControl]="email"
            type="email"
            placeholder="you@example.com"
            class="andes-demo-control"
          />
          <andes-form-description>
            We'll only use this to send your receipt.
          </andes-form-description>
          <andes-form-error>Enter a valid email address.</andes-form-error>
        </andes-form-field>
        <andes-form-field>
          <andes-form-label>Coupon code</andes-form-label>
          <input andesFormControl [formControl]="coupon" class="andes-demo-control" />
          <andes-form-description>Optional - leave blank if you don't have one.</andes-form-description>
        </andes-form-field>
      </div>
    `,
  }),
};

/**
 * The two Angular forms APIs side by side - `AndesFormControl` reads whichever `NgControl` is
 * present (`FormControlName`, `FormControlDirective` or `NgModel`) without caring which.
 *
 * The first form is a reactive `FormGroup` with two independently wired fields, plus an
 * `AndesButton` submit that force-marks everything as touched (`markAllAsTouched`) - the
 * standard pattern for surfacing every remaining error on a failed submit attempt. The
 * library's `<andes-button type="submit">` keeps implicit submission and `(ngSubmit)` working
 * as with a native button. Its controls are native `<input>`/`<select>` for the reason
 * documented on the component above.
 *
 * The second is template-driven (`[(ngModel)]`); its `AndesButton` only echoes the current
 * value, since the field needs no submit to work.
 */
export const Binding: Story = {
  render: () => {
    const form = new FormGroup({
      name: new FormControl('', { validators: Validators.required }),
      country: new FormControl('', { validators: Validators.required }),
    });
    return {
      moduleMetadata: fieldModuleMetadata,
      props: {
        form,
        submitted: false,
        submit: function (this: { submitted: boolean }) {
          if (form.invalid) {
            form.markAllAsTouched();
            return;
          }
          this.submitted = true;
        },
        nickname: '',
        echoed: '',
      },
      template: `
        <div style="max-width: 360px; display: flex; flex-direction: column; gap: 2rem;">
          <form
            [formGroup]="form"
            (ngSubmit)="submit()"
            style="display: flex; flex-direction: column; gap: 1.25rem;"
          >
            <andes-form-field>
              <andes-form-label>Full name</andes-form-label>
              <input andesFormControl formControlName="name" class="andes-demo-control" />
              <andes-form-error>Your name is required.</andes-form-error>
            </andes-form-field>

            <andes-form-field>
              <andes-form-label>Country</andes-form-label>
              <select andesFormControl formControlName="country" class="andes-demo-control">
                <option value="">Select a country</option>
                <option value="pe">Peru</option>
                <option value="cl">Chile</option>
                <option value="co">Colombia</option>
              </select>
              <andes-form-description>Used to calculate shipping.</andes-form-description>
              <andes-form-error>Please pick a country.</andes-form-error>
            </andes-form-field>

            <andes-button type="submit" style="align-self: flex-start;">Submit</andes-button>
            @if (submitted) {
              <p>Submitted: {{ form.value | json }}</p>
            }
          </form>

          <div style="display: flex; flex-direction: column; gap: 1rem;">
            <andes-form-field>
              <andes-form-label>Nickname</andes-form-label>
              <input
                andesFormControl
                name="nickname"
                required
                [(ngModel)]="nickname"
                class="andes-demo-control"
              />
              <andes-form-error>A nickname is required.</andes-form-error>
            </andes-form-field>
            <andes-button
              variant="secondary"
              style="align-self: flex-start;"
              (click)="echoed = nickname"
              >Greet me</andes-button
            >
            @if (echoed) {
              <p>Hello, {{ echoed }}!</p>
            }
          </div>
        </div>
      `,
    };
  },
};

/**
 * Text around the control. `help` replaces the generated messages (and is coloured by the
 * status), `extra` always sits underneath; both are folded into the control's
 * `aria-describedby`.
 *
 * The required mark is detected from `Validators.required`/`requiredTrue` (or a native
 * `required` attribute); `requiredMark` on the form switches between the asterisk, nothing,
 * and `'optional'` (marks the *non*-required fields instead). `tooltip` adds an info button
 * next to the label - hover or focus it; Escape closes it.
 */
export const Hints: Story = {
  render: () => {
    const password = new FormControl('abc', Validators.minLength(8));
    password.markAsTouched();
    return {
      moduleMetadata: fieldModuleMetadata,
      props: {
        password,
        plain: new FormControl(''),
        groups: [true, 'optional', false].map((mark) => ({
          mark,
          name: new FormControl('', Validators.required),
          company: new FormControl(''),
        })),
      },
      template: `
        <div style="display: flex; flex-direction: column; gap: 2rem; max-width: 900px;">
          <div andesForm style="max-width: 360px;">
            <andes-form-field
              label="Password"
              help="Use 8 or more characters."
              extra="We never store your password in plain text."
            >
              <input andesFormControl type="password" [formControl]="password" class="andes-demo-control" />
            </andes-form-field>
            <andes-form-field label="Nickname" extra="Shown on your public profile.">
              <input andesFormControl [formControl]="plain" class="andes-demo-control" />
            </andes-form-field>
          </div>
          <div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 2rem;">
            @for (c of groups; track $index) {
              <div andesForm [requiredMark]="c.mark">
                <p style="margin: 0; font-family: var(--andes-font-family), sans-serif; font-size: 0.75rem; color: var(--andes-color-muted-foreground);">
                  requiredMark = {{ c.mark }}
                </p>
                <andes-form-field label="Full name" tooltip="As printed on your ID.">
                  <input andesFormControl [formControl]="c.name" class="andes-demo-control" />
                </andes-form-field>
                <andes-form-field label="Company">
                  <input andesFormControl [formControl]="c.company" class="andes-demo-control" />
                </andes-form-field>
              </div>
            }
          </div>
        </div>
      `,
    };
  },
};

/**
 * `noStyle` fields render only their control - several of them can share one labelled
 * parent field, whose status and messages aggregate theirs (a compound field).
 */
export const Compound: Story = {
  render: () => {
    const prefix = new FormControl('+51', Validators.required);
    const phone = new FormControl('98', [
      Validators.required,
      Validators.minLength(9),
    ]);
    phone.markAsTouched();
    return {
      moduleMetadata: fieldModuleMetadata,
      props: { prefix, phone },
      template: `
        <div andesForm style="max-width: 360px;">
          <andes-form-field label="Phone">
            <div style="display: flex; gap: 0.5rem;">
              <andes-form-field noStyle style="width: 5rem; flex: none;">
                <input andesFormControl [formControl]="prefix" class="andes-demo-control" aria-label="Country code" />
              </andes-form-field>
              <andes-form-field noStyle style="flex: 1;">
                <input andesFormControl [formControl]="phone" class="andes-demo-control" aria-label="Number" />
              </andes-form-field>
            </div>
          </andes-form-field>
        </div>
      `,
    };
  },
};

/**
 * `hidden` hides a field but keeps its control in the form - its value and validity still
 * count (here the record id travels with the value). `feedbackIcons` swaps the built-in
 * status icons for a template, and `tooltip` accepts a template for rich hint content.
 */
export const HiddenAndTemplates: Story = {
  render: () => {
    const form = new FormGroup({
      id: new FormControl('INV-0042'),
      ruc: new FormControl('2010', [
        Validators.required,
        Validators.pattern(/^\d{11}$/),
      ]),
    });
    form.controls.ruc.markAsTouched();
    return {
      moduleMetadata: fieldModuleMetadata,
      props: { form },
      template: `
        <ng-template #icons let-status>
          <span style="display: inline-grid; place-items: center; width: 1rem; height: 1rem; border-radius: var(--andes-radius-sm); background: currentColor;"><span style="color: var(--andes-color-background); font-size: 0.6875rem; font-weight: 700; line-height: 1;">{{ status === 'error' ? '!' : status === 'success' ? '✓' : status === 'warning' ? '?' : '…' }}</span></span>
        </ng-template>
        <ng-template #tip>Taxpayer id: <strong>11 digits</strong>, no spaces.</ng-template>
        <form andesForm [formGroup]="form" [feedbackIcons]="icons" style="max-width: 360px;">
          <andes-form-field label="Record id" hidden>
            <input andesFormControl formControlName="id" class="andes-demo-control" />
          </andes-form-field>
          <andes-form-field label="Tax id" hasFeedback [tooltip]="tip">
            <input andesFormControl formControlName="ruc" class="andes-demo-control" />
          </andes-form-field>
          <code style="font-size: 0.75rem; color: var(--andes-color-muted-foreground);">form.value = {{ form.value | json }}</code>
        </form>
      `,
    };
  },
};
