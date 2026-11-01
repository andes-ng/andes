import { NgTemplateOutlet } from '@angular/common';
import { signal } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular';

import { AndesButton } from '../button/button';
import { AndesInput } from '../input/input';
import { ANDES_DIALOG_IMPORTS, AndesDialog } from './dialog';

/**
 * Buttons inside the stories are `AndesButton` wherever the element is not the
 * trigger. The trigger itself is a native `<button>`: the overlay primitive puts
 * `aria-haspopup`/`aria-expanded`/`aria-controls` on the element the directive sits
 * on, and those attributes are only valid on an element with an interactive role -
 * putting the directive on the `<andes-button>` host wrapper would land them on a
 * roleless element and fail axe's `aria-allowed-attr`.
 */
const TRIGGER_STYLES = `
  <style>
    /* Metrics copied from .andes-button--md rather than invented: 2.25rem/0.875rem was a
       step that does not exist in the button scale, so the trigger read as a button from
       a different system than the AndesButtons it opens. */
    .sb-dialog-trigger {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: var(--andes-space-2);
      height: 2rem;
      padding: 0 var(--andes-space-4);
      border: 1px solid transparent;
      border-radius: var(--andes-radius-md);
      background-color: var(--andes-color-primary);
      color: var(--andes-color-primary-foreground);
      font-family: var(--andes-font-family), sans-serif;
      font-weight: var(--andes-font-weight-medium);
      font-size: 0.875rem;
      cursor: pointer;
      transition: background-color 0.15s ease;
    }
    .sb-dialog-trigger:hover { background-color: var(--andes-color-primary-hover); }
    .sb-dialog-trigger:focus-visible {
      outline: 2px solid var(--andes-color-focus-ring);
      outline-offset: 2px;
    }
    .sb-field {
      display: flex;
      flex-direction: column;
      gap: var(--andes-space-1);
      font-family: var(--andes-font-family), sans-serif;
      font-size: 0.875rem;
      color: var(--andes-color-foreground);
    }
  </style>
`;

const meta: Meta<AndesDialog> = {
  title: 'Feedback/Dialog/Footer',
  component: AndesDialog,
};

export default meta;

type Story = StoryObj<AndesDialog>;

const LOG_STYLE =
  'font-family: var(--andes-font-family), sans-serif; font-size: 0.875rem; color: var(--andes-color-foreground);';

/**
 * `footer="default"` renders the built-in Cancel/OK pair. OK emits `(ok)` and does
 * not close on its own - the handler flips `confirmLoading` around the async work and
 * closes when it is done. Cancel, the
 * "x", Escape and a backdrop click all emit `(cancelled)`.
 */
export const BuiltInFooter: Story = {
  render: () => {
    const open = signal(false);
    const saving = signal(false);
    const log = signal<string[]>([]);
    return {
      moduleMetadata: { imports: [ANDES_DIALOG_IMPORTS, AndesInput] },
      props: {
        open,
        saving,
        log,
        push: (entry: string) => log.update((l) => [...l.slice(-5), entry]),
        save() {
          saving.set(true);
          log.update((l) => [...l.slice(-5), 'ok']);
          setTimeout(() => {
            saving.set(false);
            open.set(false);
          }, 1500);
        },
      },
      template: `
        ${TRIGGER_STYLES}
        <andes-dialog
          [(open)]="open"
          footer="default"
          okText="Save changes"
          cancelText="Cancel"
          [confirmLoading]="saving()"
          (ok)="save()"
          (cancelled)="push('cancelled: ' + $event)"
        >
          <button type="button" class="sb-dialog-trigger" andesDialogTrigger>Edit profile</button>

          <andes-dialog-content *andesDialogContent>
            <div andesDialogHeader>
              <h2 andesDialogTitle>Edit profile</h2>
              <p andesDialogDescription>OK spins for 1.5s, then the dialog closes.</p>
            </div>

            <label class="sb-field">
              Name
              <andes-input value="Ada Lovelace" />
            </label>
          </andes-dialog-content>
        </andes-dialog>
        <p style="${LOG_STYLE}">Events: {{ log().join(', ') || '-' }}</p>
      `,
    };
  },
};

/**
 * A destructive confirmation. `okType="danger"` with focus on Cancel (`autoFocusButton`) is the
 * dedicated shortcut; `okButtonProps` and `cancelButtonProps` reach past the dedicated inputs
 * (size, ghost, an accessible name, extra classes): `variant` wins over `okType`, while
 * `disabled`/`loading` add to `okDisabled`/`confirmLoading`.
 */
export const Destructive: Story = {
  render: () => ({
    moduleMetadata: { imports: [ANDES_DIALOG_IMPORTS] },
    template: `
      ${TRIGGER_STYLES}
      <div style="display: flex; flex-wrap: wrap; gap: var(--andes-space-2);">
        <andes-dialog
          #dialog
          size="sm"
          footer="default"
          okText="Delete"
          okType="danger"
          autoFocusButton="cancel"
          (ok)="dialog.hide()"
        >
          <button type="button" class="sb-dialog-trigger" andesDialogTrigger>Delete file</button>

          <andes-dialog-content *andesDialogContent>
            <div andesDialogHeader>
              <h2 andesDialogTitle>Delete report.pdf?</h2>
              <p andesDialogDescription>The file moves to the bin for 30 days.</p>
            </div>
          </andes-dialog-content>
        </andes-dialog>

        <andes-dialog
          #propsDialog
          footer="default"
          okText="Remove 3 users"
          cancelText="Keep them"
          [okButtonProps]="{ variant: 'danger', ariaLabel: 'Remove the 3 selected users' }"
          [cancelButtonProps]="{ variant: 'ghost' }"
          autoFocusButton="cancel"
          (ok)="propsDialog.hide()"
        >
          <button type="button" class="sb-dialog-trigger" andesDialogTrigger>Remove users (button props)</button>

          <andes-dialog-content *andesDialogContent>
            <div andesDialogHeader>
              <h2 andesDialogTitle>Remove selected users?</h2>
              <p andesDialogDescription>They lose access to this workspace immediately.</p>
            </div>
          </andes-dialog-content>
        </andes-dialog>
      </div>
    `,
  }),
};

/**
 * A custom `footer` template keeps the footer box (pinning, stacking) and receives
 * `ok()`/`cancel()`, so bespoke actions keep the built-in OK/Cancel semantics.
 */
export const CustomFooter: Story = {
  render: () => ({
    moduleMetadata: { imports: [ANDES_DIALOG_IMPORTS, AndesButton] },
    props: { lastAction: '' },
    template: `
      ${TRIGGER_STYLES}
      <andes-dialog
        #dialog
        [footer]="footer"
        (ok)="lastAction = 'publish'; dialog.hide()"
        (cancelled)="lastAction = 'cancel'"
      >
        <button type="button" class="sb-dialog-trigger" andesDialogTrigger>Publish post</button>

        <andes-dialog-content *andesDialogContent>
          <div andesDialogHeader>
            <h2 andesDialogTitle>Publish post</h2>
            <p andesDialogDescription>Publish now, or keep it as a draft.</p>
          </div>
        </andes-dialog-content>
      </andes-dialog>

      <ng-template #footer let-ok="ok" let-cancel="cancel">
        <andes-button variant="ghost" (click)="cancel()">Cancel</andes-button>
        <andes-button variant="secondary" (click)="lastAction = 'draft'; dialog.hide()">Save draft</andes-button>
        <andes-button variant="primary" (click)="ok()">Publish</andes-button>
      </ng-template>
      <p style="${LOG_STYLE}">Last action: {{ lastAction || '-' }}</p>
    `,
  }),
};

/**
 * A custom `footer` template also receives the built-in buttons as templates
 * (`defaultButtons`, or `okButton` and `cancelButton` one by one), already labelled,
 * styled and wired - so a footer can add an action beside the default pair instead of
 * rebuilding it.
 */
export const ExtendDefaultFooter: Story = {
  render: () => ({
    moduleMetadata: {
      imports: [ANDES_DIALOG_IMPORTS, AndesButton, NgTemplateOutlet],
    },
    props: { lastAction: '' },
    template: `
      ${TRIGGER_STYLES}
      <andes-dialog
        #dialog
        [footer]="footer"
        okText="Submit"
        (ok)="lastAction = 'submit'; dialog.hide()"
        (cancelled)="lastAction = 'cancel'"
      >
        <button type="button" class="sb-dialog-trigger" andesDialogTrigger>Submit expense</button>

        <andes-dialog-content *andesDialogContent>
          <div andesDialogHeader>
            <h2 andesDialogTitle>Submit expense report</h2>
            <p andesDialogDescription>Send it for approval, or come back to it later.</p>
          </div>
        </andes-dialog-content>
      </andes-dialog>

      <ng-template #footer let-buttons="defaultButtons">
        <andes-button
          variant="ghost"
          style="margin-inline-end: auto"
          (click)="lastAction = 'draft'; dialog.hide()"
        >
          Save draft
        </andes-button>
        <ng-container *ngTemplateOutlet="buttons" />
      </ng-template>
      <p style="${LOG_STYLE}">Last action: {{ lastAction || '-' }}</p>
    `,
  }),
};
