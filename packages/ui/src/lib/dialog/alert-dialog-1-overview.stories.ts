import { computed, signal } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular';

import {
  about,
  shared,
  withDescription,
  withDialogKit,
} from '../../testing/dialog-story-kit';
import { AndesAlertDialog } from './alert-dialog';

/*
 * The playground of the Alert Dialog: the tone and the control that is focused first are
 * chosen from a panel built with library components, then tried on one dialog.
 */

const meta: Meta<AndesAlertDialog> = {
  title: 'Feedback/Alert Dialog/Overview',
  component: AndesAlertDialog,
  tags: ['autodocs'],
  decorators: [withDescription, withDialogKit],
  parameters: {
    layout: 'padded',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'A modal that interrupts to ask a question and waits for the answer: it has the role alertdialog, a click on the mask does not dismiss it, and the safe choice is where focus starts. Its parts (`andesAlertDialogTrigger`, content, header, title, description, footer, cancel, action) are composed in the template; the guards and the tone icon are optional parts.',
      },
    },
  },
};

export default meta;

type Story = StoryObj<AndesAlertDialog>;

/** The playground: choose a tone and the control focused first, then open the dialog. */
export const Playground: Story = {
  name: 'Playground',
  parameters: about(
    'A panel of radios and a switch that choose the tone, the control focused first and whether Escape answers, and one dialog that follows them, whose icon, accent and action change with the tone.',
  ),
  render: () => {
    const toneChoice = signal<
      'none' | 'danger' | 'warning' | 'info' | 'success'
    >('danger');
    const focusChoice = signal<'default' | 'cancel' | 'action'>('default');
    const keyboard = signal(true);
    const result = signal('Nothing yet.');
    const copy = {
      none: {
        title: 'Discard this draft?',
        text: 'Without a tone the dialog keeps a neutral surface and no icon.',
        action: 'Discard',
        variant: 'primary',
      },
      danger: {
        title: 'Delete this project?',
        text: 'This permanently removes the project and everything in it. This action cannot be undone.',
        action: 'Delete project',
        variant: 'danger',
      },
      warning: {
        title: 'Publish with 3 broken links?',
        text: 'Visitors will land on error pages until the links are fixed.',
        action: 'Publish anyway',
        variant: 'primary',
      },
      info: {
        title: 'A new version is available',
        text: 'Reload to get 4.2. Your unsaved forms keep their drafts.',
        action: 'Reload now',
        variant: 'primary',
      },
      success: {
        title: 'Ready to ship?',
        text: 'All 214 checks passed. Release 4.2 goes live to every region.',
        action: 'Ship release',
        variant: 'primary',
      },
    };
    return {
      props: {
        ...shared,
        toneChoice,
        focusChoice,
        keyboard,
        result,
        toneValue: computed(() =>
          toneChoice() === 'none' ? null : toneChoice(),
        ),
        focusValue: computed(() =>
          focusChoice() === 'default' ? null : focusChoice(),
        ),
        current: computed(() => copy[toneChoice()]),
      },
      template: `
        <div [style]="card" style="display: flex; flex-direction: column; gap: 1rem; max-width: 40rem;">
          <div [style]="formRow">
            <span [style]="formItem">Tone</span>
            <andes-radio-group aria-label="Tone" [value]="toneChoice()" (valueChange)="toneChoice.set($event)">
              <andes-radio value="none">None</andes-radio>
              <andes-radio value="danger">Danger</andes-radio>
              <andes-radio value="warning">Warning</andes-radio>
              <andes-radio value="info">Info</andes-radio>
              <andes-radio value="success">Success</andes-radio>
            </andes-radio-group>
          </div>
          <div [style]="formRow">
            <span [style]="formItem">Focus starts on</span>
            <andes-radio-group aria-label="Initial focus" [value]="focusChoice()" (valueChange)="focusChoice.set($event)">
              <andes-radio value="default">The default</andes-radio>
              <andes-radio value="cancel">Cancel</andes-radio>
              <andes-radio value="action">The action</andes-radio>
            </andes-radio-group>
            <andes-switch [checked]="keyboard()" (checkedChange)="keyboard.set($event)">Escape answers</andes-switch>
          </div>
          <hr [style]="divider" />
          <div [style]="formRow">
            <andes-alert-dialog
              [tone]="toneValue()"
              [initialFocus]="focusValue()"
              [closeOnEscape]="keyboard()"
              (cancelled)="result.set('Cancelled.')"
            >
              <andes-button [variant]="current().variant === 'danger' ? 'danger' : 'primary'" andesAlertDialogTrigger>Open</andes-button>

              <andes-alert-dialog-content *andesAlertDialogContent>
                <div andesAlertDialogHeader>
                  @if (toneValue()) {
                    <andes-alert-dialog-icon />
                  }
                  <h2 andesAlertDialogTitle>{{ current().title }}</h2>
                  <p andesAlertDialogDescription>{{ current().text }}</p>
                </div>

                <div andesAlertDialogFooter>
                  <andes-button variant="secondary" andesAlertDialogCancel>Cancel</andes-button>
                  <andes-button
                    [variant]="current().variant"
                    andesAlertDialogAction
                    (click)="result.set(current().action + ' confirmed.')"
                  >{{ current().action }}</andes-button>
                </div>
              </andes-alert-dialog-content>
            </andes-alert-dialog>
            <span [style]="muted">Result: <strong [style]="strong">{{ result() }}</strong></span>
          </div>
        </div>
      `,
    };
  },
};

/** The four steps of the width scale. */
export const Sizes: Story = {
  name: 'Sizes',
  parameters: about(
    'size is sm, md (the default), lg or xl, and each trigger opens the same question in a surface of a different width.',
  ),
  render: () => ({
    props: { ...shared, sizes: ['sm', 'md', 'lg', 'xl'] },
    template: `
      <div [style]="row">
        @for (size of sizes; track size) {
          <andes-alert-dialog [size]="size">
            <andes-button variant="danger" andesAlertDialogTrigger>Size {{ size }}</andes-button>

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

/** Why the dialog went away. */
export const ReportsTheOutcome: Story = {
  name: 'Reports the outcome',
  parameters: about(
    'A click on the mask does nothing because the user has to answer, closed reports why the dialog went away, and with closeOnEscape off there is no accidental way out at all.',
  ),
  render: () => ({
    props: {
      ...shared,
      confirmed: signal(false),
      reason: signal('-'),
      escape: signal(true),
    },
    template: `
      <div style="display: flex; flex-direction: column; gap: 1rem;">
        <andes-switch [checked]="escape()" (checkedChange)="escape.set($event)">Escape answers</andes-switch>
        <div [style]="formRow">
          <andes-alert-dialog [closeOnEscape]="escape()" (closed)="reason.set($event)">
            <andes-button variant="danger" andesAlertDialogTrigger>Revoke access</andes-button>

            <andes-alert-dialog-content *andesAlertDialogContent>
              <div andesAlertDialogHeader>
                <h2 andesAlertDialogTitle>Revoke access?</h2>
                <p andesAlertDialogDescription>The member loses access immediately.</p>
              </div>

              <div andesAlertDialogFooter>
                <andes-button variant="secondary" andesAlertDialogCancel>Cancel</andes-button>
                <andes-button variant="danger" andesAlertDialogAction (click)="confirmed.set(true)">Revoke</andes-button>
              </div>
            </andes-alert-dialog-content>
          </andes-alert-dialog>
          <span [style]="muted">
            Confirmed: <strong [style]="strong">{{ confirmed() }}</strong>
            &middot; last close reason: <strong [style]="strong">{{ reason() }}</strong>
          </span>
        </div>
      </div>
    `,
  }),
};

/** The Cancel and OK pair. */
export const BuiltInFooter: Story = {
  name: 'Built-in footer',
  parameters: about(
    'footer="default" gives an alert dialog the Cancel and OK pair with okType="danger" and focus on Cancel, OK is held in its loading state while the deletion runs, and the dialog closes when the page says so, not when OK is pressed.',
  ),
  render: () => {
    const dialogOpen = signal(false);
    const deleting = signal(false);
    return {
      props: {
        ...shared,
        dialogOpen,
        deleting,
        remove() {
          deleting.set(true);
          setTimeout(() => {
            deleting.set(false);
            dialogOpen.set(false);
          }, 1500);
        },
      },
      template: `
        <andes-alert-dialog
          [(open)]="dialogOpen"
          footer="default"
          okText="Delete project"
          okType="danger"
          autoFocusButton="cancel"
          [confirmLoading]="deleting()"
          [cancelDisabled]="deleting()"
          [closeOnEscape]="!deleting()"
          (ok)="remove()"
        >
          <andes-button variant="danger" andesAlertDialogTrigger>Delete project</andes-button>

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
