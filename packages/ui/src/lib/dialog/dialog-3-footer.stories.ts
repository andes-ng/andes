import { signal } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular';

import {
  about,
  NOTHING_YET,
  resultLine,
  shared,
  withDescription,
  withDialogKit,
} from '../../testing/dialog-story-kit';
import type { AndesDialog } from './dialog';

/*
 * The footer of a dialog: the built-in Cancel / OK pair and what can be done to it, and a
 * footer of your own.
 */

const meta: Meta<AndesDialog> = {
  title: 'Feedback/Dialog/Footer',
  decorators: [withDescription, withDialogKit],
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<AndesDialog>;

/** The Cancel and OK pair. */
export const BuiltInFooter: Story = {
  name: 'Built-in footer',
  parameters: about(
    'footer="default" renders the Cancel and OK pair with your labels, OK emits (ok) without closing so the handler decides when, and Cancel, the close button, Escape and a click on the mask all emit (cancelled) with the reason.',
  ),
  render: () => {
    const result = signal(NOTHING_YET);
    return {
      props: { ...shared, result, open: signal(false) },
      template: `
        <andes-dialog
          [(open)]="open"
          footer="default"
          okText="Save changes"
          cancelText="Discard"
          (ok)="result.set('Saved.'); open.set(false)"
          (cancelled)="result.set('Cancelled: ' + $event + '.')"
        >
          <andes-button andesDialogTrigger>Edit profile</andes-button>

          <andes-dialog-content *andesDialogContent>
            <div andesDialogHeader>
              <h2 andesDialogTitle>Edit profile</h2>
              <p andesDialogDescription>Save closes the dialog; every other way out is a cancel.</p>
            </div>

            <andes-form-field label="Name">
              <andes-input value="Ada Lovelace" />
            </andes-form-field>
          </andes-dialog-content>
        </andes-dialog>
        ${resultLine}
      `,
    };
  },
};

/** An acknowledgement. */
export const OkOnly: Story = {
  name: 'OK only',
  parameters: about(
    'With [showCancel]="false" the built-in footer is a single OK, the footer of a dialog that only has to be read.',
  ),
  render: () => ({
    props: { ...shared },
    template: `
      <andes-dialog footer="default" okText="Got it" [showCancel]="false" #dialog (ok)="dialog.hide()">
        <andes-button andesDialogTrigger>What is new</andes-button>

        <andes-dialog-content *andesDialogContent>
          <div andesDialogHeader>
            <h2 andesDialogTitle>What is new in 4.2</h2>
            <p andesDialogDescription>
              Faster search, dark mode for charts and a calmer notification centre.
            </p>
          </div>
        </andes-dialog-content>
      </andes-dialog>
    `,
  }),
};

/** OK while the work runs. */
export const LoadingOk: Story = {
  name: 'OK loading',
  parameters: about(
    'The handler of (ok) switches [confirmLoading] on, which makes OK spin and inert, and closes the dialog when the work is done; [cancelDisabled] keeps the way out shut meanwhile.',
  ),
  render: () => {
    const open = signal(false);
    const saving = signal(false);
    const message = signal('The changes are saved when you press OK.');
    return {
      props: {
        ...shared,
        open,
        saving,
        message,
        save() {
          message.set('Saving; the dialog closes in two seconds.');
          saving.set(true);
          setTimeout(() => {
            saving.set(false);
            open.set(false);
            message.set('The changes are saved when you press OK.');
          }, 2000);
        },
      },
      template: `
        <andes-dialog
          [(open)]="open"
          footer="default"
          okText="Save changes"
          [confirmLoading]="saving()"
          [cancelDisabled]="saving()"
          [closeOnEscape]="!saving()"
          [closeOnOutsideClick]="!saving()"
          (ok)="save()"
        >
          <andes-button andesDialogTrigger>Open</andes-button>

          <andes-dialog-content *andesDialogContent [closeDisabled]="saving()">
            <div andesDialogHeader>
              <h2 andesDialogTitle>Publish the report</h2>
              <p andesDialogDescription>{{ message() }}</p>
            </div>
          </andes-dialog-content>
        </andes-dialog>
      `,
    };
  },
};

/** OK that waits for the user. */
export const DisabledOk: Story = {
  name: 'OK disabled',
  parameters: about(
    '[okDisabled] keeps OK unavailable until the dialog has what it needs, here a name and a role, and it follows the fields as they change.',
  ),
  render: () => ({
    props: {
      ...shared,
      name: signal(''),
      role: signal<string | null>(null),
      roles: [
        { value: 'viewer', label: 'Viewer' },
        { value: 'editor', label: 'Editor' },
        { value: 'admin', label: 'Admin' },
      ],
    },
    template: `
      <andes-dialog
        footer="default"
        okText="Invite"
        [okDisabled]="!name().trim() || !role()"
        #dialog
        (ok)="dialog.hide()"
      >
        <andes-button andesDialogTrigger>Invite a member</andes-button>

        <andes-dialog-content *andesDialogContent>
          <div andesDialogHeader>
            <h2 andesDialogTitle>Invite a member</h2>
            <p andesDialogDescription>Invite stays unavailable until both fields are filled in.</p>
          </div>

          <andes-form-field label="Name">
            <andes-input placeholder="Full name" [value]="name()" (valueChange)="name.set($event)" />
          </andes-form-field>
          <andes-form-field label="Role">
            <andes-select placeholder="Choose a role" [options]="roles" [value]="role()" (valueChange)="role.set($event)" />
          </andes-form-field>
        </andes-dialog-content>
      </andes-dialog>
    `,
  }),
};

/** A destructive confirmation. */
export const Destructive: Story = {
  name: 'Destructive',
  parameters: about(
    'okType="danger" turns OK into the red action and autoFocusButton="cancel" puts focus on the safe choice, so a stray Enter does not delete anything.',
  ),
  render: () => ({
    props: { ...shared },
    template: `
      <andes-dialog
        #dialog
        size="sm"
        footer="default"
        okText="Delete"
        okType="danger"
        autoFocusButton="cancel"
        (ok)="dialog.hide()"
      >
        <andes-button andesDialogTrigger variant="secondary">Delete file</andes-button>

        <andes-dialog-content *andesDialogContent>
          <div andesDialogHeader>
            <h2 andesDialogTitle>Delete report.pdf?</h2>
            <p andesDialogDescription>The file moves to the bin for 30 days.</p>
          </div>
        </andes-dialog-content>
      </andes-dialog>
    `,
  }),
};

/** Your own buttons in the footer box. */
export const CustomFooter: Story = {
  name: 'Custom footer',
  parameters: about(
    'A footer template keeps the footer box, with its pinning and stacking, and receives ok() and cancel(), so three actions of your own keep the semantics of the built-in pair.',
  ),
  render: () => {
    const result = signal(NOTHING_YET);
    return {
      props: { ...shared, result },
      template: `
        <andes-dialog
          #dialog
          [footer]="footer"
          (ok)="result.set('Published.'); dialog.hide()"
          (cancelled)="result.set('Cancelled.')"
        >
          <andes-button andesDialogTrigger>Publish post</andes-button>

          <andes-dialog-content *andesDialogContent>
            <div andesDialogHeader>
              <h2 andesDialogTitle>Publish post</h2>
              <p andesDialogDescription>Publish now, or keep it as a draft.</p>
            </div>
          </andes-dialog-content>
        </andes-dialog>

        <ng-template #footer let-ok="ok" let-cancel="cancel">
          <andes-button variant="ghost" (click)="cancel()">Cancel</andes-button>
          <andes-button variant="secondary" (click)="result.set('Saved as a draft.'); dialog.hide()">Save draft</andes-button>
          <andes-button (click)="ok()">Publish</andes-button>
        </ng-template>
        ${resultLine}
      `,
    };
  },
};

/** The default pair, plus an action. */
export const ExtendTheDefaultFooter: Story = {
  name: 'Extend the default footer',
  parameters: about(
    'A footer template also receives the built-in buttons as templates (defaultButtons, or okButton and cancelButton one by one), already labelled, styled and wired, so an action can be added beside the pair instead of rebuilding it.',
  ),
  render: () => {
    const result = signal(NOTHING_YET);
    return {
      props: { ...shared, result },
      template: `
        <andes-dialog
          #dialog
          [footer]="footer"
          okText="Submit"
          (ok)="result.set('Submitted.'); dialog.hide()"
          (cancelled)="result.set('Cancelled.')"
        >
          <andes-button andesDialogTrigger>Submit expense</andes-button>

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
            (click)="result.set('Saved as a draft.'); dialog.hide()"
          >Save draft</andes-button>
          <ng-container *ngTemplateOutlet="buttons" />
        </ng-template>
        ${resultLine}
      `,
    };
  },
};

/** Settings for the built-in buttons. */
export const ButtonProps: Story = {
  name: 'Button props',
  parameters: about(
    'okButtonProps and cancelButtonProps reach past the dedicated inputs to the size, the ghost form, an accessible name or extra classes, where variant wins over okType and disabled or loading add to okDisabled and confirmLoading.',
  ),
  render: () => ({
    props: { ...shared },
    template: `
      <div [style]="row">
        <andes-dialog
          #small
          footer="default"
          okText="Apply"
          [okButtonProps]="{ size: 'sm' }"
          [cancelButtonProps]="{ size: 'sm', variant: 'ghost' }"
          (ok)="small.hide()"
        >
          <andes-button andesDialogTrigger variant="secondary">Small, ghost cancel</andes-button>
          <andes-dialog-content *andesDialogContent>
            <div andesDialogHeader>
              <h2 andesDialogTitle>Apply the filter</h2>
              <p andesDialogDescription>Compact buttons, and a Cancel that is only text.</p>
            </div>
          </andes-dialog-content>
        </andes-dialog>

        <andes-dialog
          #remove
          footer="default"
          okText="Remove 3 users"
          cancelText="Keep them"
          [okButtonProps]="{ variant: 'danger', ariaLabel: 'Remove the 3 selected users' }"
          [cancelButtonProps]="{ variant: 'ghost' }"
          autoFocusButton="cancel"
          (ok)="remove.hide()"
        >
          <andes-button andesDialogTrigger variant="secondary">Danger and an accessible name</andes-button>
          <andes-dialog-content *andesDialogContent>
            <div andesDialogHeader>
              <h2 andesDialogTitle>Remove selected users?</h2>
              <p andesDialogDescription>They lose access to this workspace immediately.</p>
            </div>
          </andes-dialog-content>
        </andes-dialog>

        <andes-dialog
          #locked
          footer="default"
          [okButtonProps]="{ disabled: true }"
          [cancelButtonProps]="{ disabled: true }"
          (ok)="locked.hide()"
        >
          <andes-button andesDialogTrigger variant="secondary">Both disabled</andes-button>
          <andes-dialog-content *andesDialogContent>
            <div andesDialogHeader>
              <h2 andesDialogTitle>Both buttons disabled</h2>
              <p andesDialogDescription>Only the close button and Escape are left.</p>
            </div>
          </andes-dialog-content>
        </andes-dialog>
      </div>
    `,
  }),
};
