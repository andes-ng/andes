import { signal } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular';

import { AndesButton } from '../button/button';
import { ANDES_ALERT_DIALOG_IMPORTS, AndesAlertDialog } from './alert-dialog';

const meta: Meta<AndesAlertDialog> = {
  title: 'Feedback/Alert Dialog',
  component: AndesAlertDialog,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: ['sm', 'md', 'lg', 'xl'] },
    closeOnEscape: { control: 'boolean' },
    lockScroll: { control: 'boolean' },
  },
  args: {
    size: 'md',
    closeOnEscape: true,
    lockScroll: true,
  },
  render: (args) => ({
    moduleMetadata: { imports: [ANDES_ALERT_DIALOG_IMPORTS, AndesButton] },
    props: args,
    template: `
      <andes-alert-dialog
        [size]="size"
        [closeOnEscape]="closeOnEscape"
        [lockScroll]="lockScroll"
      >
        <andes-button danger andesAlertDialogTrigger>Delete project</andes-button>

        <andes-alert-dialog-content *andesAlertDialogContent>
          <div andesAlertDialogHeader>
            <h2 andesAlertDialogTitle>Delete this project?</h2>
            <p andesAlertDialogDescription>
              This permanently removes the project and everything in it. This
              action cannot be undone.
            </p>
          </div>

          <div andesAlertDialogFooter>
            <andes-button variant="secondary" andesAlertDialogCancel>Cancel</andes-button>
            <andes-button variant="danger" andesAlertDialogAction>Delete project</andes-button>
          </div>
        </andes-alert-dialog-content>
      </andes-alert-dialog>
    `,
  }),
};

export default meta;

type Story = StoryObj<AndesAlertDialog>;

/**
 * Clicking the backdrop does nothing - an alert dialog has no outside-click
 * dismissal by design, so the user has to answer it.
 */
export const Default: Story = {};

/** Escape refused as well, for a confirmation with no accidental way out. */
export const EscapeRefused: Story = {
  args: { closeOnEscape: false },
};

/** `size` is `sm`, `md` (the default), `lg` or `xl`; each trigger opens the same confirmation at a different size. */
export const Sizes: Story = {
  render: () => ({
    moduleMetadata: { imports: [ANDES_ALERT_DIALOG_IMPORTS, AndesButton] },
    props: { sizes: ['sm', 'md', 'lg', 'xl'] },
    template: `
      <div style="display: flex; flex-wrap: wrap; gap: var(--andes-space-2);">
        @for (size of sizes; track size) {
          <andes-alert-dialog [size]="size">
            <andes-button danger andesAlertDialogTrigger>Size {{ size }}</andes-button>

            <andes-alert-dialog-content *andesAlertDialogContent>
              <div andesAlertDialogHeader>
                <h2 andesAlertDialogTitle>Delete this project?</h2>
                <p andesAlertDialogDescription>
                  This permanently removes the project and everything in it.
                </p>
              </div>

              <div andesAlertDialogFooter>
                <andes-button variant="secondary" andesAlertDialogCancel>Cancel</andes-button>
                <andes-button variant="danger" andesAlertDialogAction>Delete project</andes-button>
              </div>
            </andes-alert-dialog-content>
          </andes-alert-dialog>
        }
      </div>
    `,
  }),
};

/** Reporting the outcome: `closed` carries why the dialog went away. */
export const ReportsTheOutcome: Story = {
  render: (args) => ({
    moduleMetadata: { imports: [ANDES_ALERT_DIALOG_IMPORTS, AndesButton] },
    props: { ...args, confirmed: false, lastReason: '' },
    template: `
      <andes-alert-dialog (closed)="lastReason = $event">
        <andes-button danger andesAlertDialogTrigger>Revoke access</andes-button>

        <andes-alert-dialog-content *andesAlertDialogContent>
          <div andesAlertDialogHeader>
            <h2 andesAlertDialogTitle>Revoke access?</h2>
            <p andesAlertDialogDescription>
              The member loses access immediately.
            </p>
          </div>

          <div andesAlertDialogFooter>
            <andes-button variant="secondary" andesAlertDialogCancel>Cancel</andes-button>
            <andes-button
              variant="danger"
              andesAlertDialogAction
              (click)="confirmed = true"
            >
              Revoke
            </andes-button>
          </div>
        </andes-alert-dialog-content>
      </andes-alert-dialog>

      <p style="font-family: var(--andes-font-family), sans-serif; font-size: 0.875rem;">
        Confirmed: {{ confirmed }} &middot; last close reason: {{ lastReason || '-' }}
      </p>
    `,
  }),
};

/**
 * The built-in footer on an alert dialog: `okType="danger"`, focus on Cancel, and OK
 * held in its loading state (`confirmLoading`) while the deletion runs. The dialog
 * closes when the consumer says so, not when OK is pressed.
 */
export const AsyncConfirmation: Story = {
  render: () => {
    const open = signal(false);
    const deleting = signal(false);
    return {
      moduleMetadata: { imports: [ANDES_ALERT_DIALOG_IMPORTS, AndesButton] },
      props: {
        open,
        deleting,
        remove() {
          deleting.set(true);
          setTimeout(() => {
            deleting.set(false);
            open.set(false);
          }, 1500);
        },
      },
      template: `
          <andes-alert-dialog
          [(open)]="open"
          footer="default"
          okText="Delete project"
          okType="danger"
          autoFocusButton="cancel"
          [confirmLoading]="deleting()"
          [cancelDisabled]="deleting()"
          [closeOnEscape]="!deleting()"
          (ok)="remove()"
        >
          <andes-button danger andesAlertDialogTrigger>Delete project</andes-button>

          <andes-alert-dialog-content *andesAlertDialogContent>
            <div andesAlertDialogHeader>
              <h2 andesAlertDialogTitle>Delete this project?</h2>
              <p andesAlertDialogDescription>
                This permanently removes the project and everything in it.
              </p>
            </div>
          </andes-alert-dialog-content>
        </andes-alert-dialog>
      `,
    };
  },
};
