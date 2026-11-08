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
import type { AndesAlertDialog } from './alert-dialog';

/*
 * Guards for the answer an alert dialog asks for. Gating parts (`andes-alert-dialog-confirm-phrase`,
 * `-acknowledge`, `-countdown`) keep the action unavailable until their requirement is met; the
 * action itself can hold, wait for a request and retry; the icon, the impact summary and the third
 * answer shape what the user sees. Every part is composable and optional.
 */

const meta: Meta<AndesAlertDialog> = {
  title: 'Feedback/Alert Dialog/Patterns',
  decorators: [withDescription, withDialogKit],
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<AndesAlertDialog>;

/** Type to confirm. */
export const TypeToConfirm: Story = {
  name: 'Type to confirm',
  parameters: about(
    'A field that must be typed before the action unlocks, such as the name of the repository: the phrase sits in a chip one click selects, a wrong entry is flagged only once it can no longer become the phrase, and Enter confirms a matching one.',
  ),
  render: () => {
    const result = signal(NOTHING_YET);
    return {
      props: { ...shared, result },
      template: `
        <andes-alert-dialog initialFocus="input" (cancelled)="result.set('Cancelled.')">
          <andes-button danger andesAlertDialogTrigger>Delete project</andes-button>

          <andes-alert-dialog-content *andesAlertDialogContent>
            <div andesAlertDialogHeader>
              <h2 andesAlertDialogTitle>Delete project acme-web?</h2>
              <p andesAlertDialogDescription>
                This permanently removes the project, its deployments and its environment
                variables. This action cannot be undone.
              </p>
            </div>

            <andes-alert-dialog-confirm-phrase phrase="acme-web" />

            <div andesAlertDialogFooter>
              <andes-button variant="secondary" andesAlertDialogCancel>Cancel</andes-button>
              <andes-button
                variant="danger"
                andesAlertDialogAction
                (click)="result.set('Deleted acme-web.')"
              >Delete project</andes-button>
            </div>
          </andes-alert-dialog-content>
        </andes-alert-dialog>

        ${resultLine}
      `,
    };
  },
};

/** Copy the phrase. */
export const CopyThePhrase: Story = {
  name: 'Copy the phrase',
  parameters: about(
    'A small button after the phrase copies it and shows a check for a moment, the chip itself can be selected by click, double click or drag without the field stealing focus, copying keeps working when blockPaste forbids pasting into the field, and showCopy hides the button.',
  ),
  render: () => {
    const result = signal(NOTHING_YET);
    return {
      props: { ...shared, result },
      template: `
        <andes-alert-dialog initialFocus="input" (cancelled)="result.set('Cancelled.')">
          <andes-button danger andesAlertDialogTrigger>Delete workspace</andes-button>

          <andes-alert-dialog-content *andesAlertDialogContent>
            <div andesAlertDialogHeader>
              <h2 andesAlertDialogTitle>Delete workspace acme-labs?</h2>
              <p andesAlertDialogDescription>
                Copy the name with the button, then type it: pasting is turned off.
              </p>
            </div>

            <andes-alert-dialog-confirm-phrase phrase="acme-labs" blockPaste />

            <div andesAlertDialogFooter>
              <andes-button variant="secondary" andesAlertDialogCancel>Cancel</andes-button>
              <andes-button
                variant="danger"
                andesAlertDialogAction
                (click)="result.set('Deleted acme-labs.')"
              >Delete workspace</andes-button>
            </div>
          </andes-alert-dialog-content>
        </andes-alert-dialog>

        ${resultLine}
      `,
    };
  },
};

/** Type to confirm, strict. */
export const TypeToConfirmStrict: Story = {
  name: 'Type to confirm, strict',
  parameters: about(
    'The strict form is case-insensitive, refuses pasting and speaks the user’s language, with {phrase} marking where the chip goes in the label, which is the usual type DELETE confirmation.',
  ),
  render: () => {
    const result = signal(NOTHING_YET);
    return {
      props: { ...shared, result },
      template: `
        <andes-alert-dialog (cancelled)="result.set('Cancelled.')">
          <andes-button danger andesAlertDialogTrigger>Delete all backups</andes-button>

          <andes-alert-dialog-content *andesAlertDialogContent>
            <div andesAlertDialogHeader>
              <h2 andesAlertDialogTitle>Eliminar todas las copias</h2>
              <p andesAlertDialogDescription>
                Se borrarán las 14 copias de seguridad de este espacio.
              </p>
            </div>

            <andes-alert-dialog-confirm-phrase
              phrase="ELIMINAR"
              label="Escribe {phrase} para confirmar."
              matchedMessage="Coincide. Puedes continuar."
              mismatchMessage="Todavía no coincide."
              pasteBlockedMessage="Pegar está desactivado. Escribe el texto."
              ignoreCase
              blockPaste
            />

            <div andesAlertDialogFooter>
              <andes-button variant="secondary" andesAlertDialogCancel>Cancelar</andes-button>
              <andes-button
                variant="danger"
                andesAlertDialogAction
                (click)="result.set('Backups deleted.')"
              >Eliminar</andes-button>
            </div>
          </andes-alert-dialog-content>
        </andes-alert-dialog>

        ${resultLine}
      `,
    };
  },
};

/** Acknowledge checkbox. */
export const AcknowledgeCheckbox: Story = {
  name: 'Acknowledge checkbox',
  parameters: about(
    'One checkbox per consequence, each of which has to be ticked before the action unlocks, and pressing the unavailable action shakes it and reads out what is missing.',
  ),
  render: () => {
    const result = signal(NOTHING_YET);
    return {
      props: { ...shared, result },
      template: `
        <andes-alert-dialog (cancelled)="result.set('Cancelled.')">
          <andes-button danger andesAlertDialogTrigger>Delete workspace</andes-button>

          <andes-alert-dialog-content *andesAlertDialogContent>
            <div andesAlertDialogHeader>
              <h2 andesAlertDialogTitle>Delete the Design workspace?</h2>
              <p andesAlertDialogDescription>
                Everyone in the workspace loses access right away.
              </p>
            </div>

            <andes-alert-dialog-acknowledge requirement="Confirm that the files will be removed.">
              I understand that all 312 files are permanently removed.
            </andes-alert-dialog-acknowledge>
            <andes-alert-dialog-acknowledge requirement="Confirm that members lose access.">
              I understand that 18 members lose access immediately.
            </andes-alert-dialog-acknowledge>

            <div andesAlertDialogFooter>
              <andes-button variant="secondary" andesAlertDialogCancel>Cancel</andes-button>
              <andes-button
                variant="danger"
                andesAlertDialogAction
                (click)="result.set('Deleted the Design workspace.')"
              >Delete workspace</andes-button>
            </div>
          </andes-alert-dialog-content>
        </andes-alert-dialog>

        ${resultLine}
      `,
    };
  },
};

/** Countdown. */
export const Countdown: Story = {
  name: 'Countdown',
  parameters: about(
    'The action unlocks after a pause with a visible count and a thin progress bar, screen readers hear the wait when it starts and when it ends rather than every second, and the countdown restarts each time the dialog opens.',
  ),
  render: () => {
    const result = signal(NOTHING_YET);
    return {
      props: { ...shared, result },
      template: `
        <andes-alert-dialog (cancelled)="result.set('Cancelled.')">
          <andes-button danger andesAlertDialogTrigger>Drop database</andes-button>

          <andes-alert-dialog-content *andesAlertDialogContent>
            <div andesAlertDialogHeader>
              <h2 andesAlertDialogTitle>Drop the production database?</h2>
              <p andesAlertDialogDescription>
                All tables in <strong>orders-prod</strong> are dropped. Read the consequences
                before you continue.
              </p>
            </div>

            <andes-alert-dialog-countdown [seconds]="5" />

            <div andesAlertDialogFooter>
              <andes-button variant="secondary" andesAlertDialogCancel>Cancel</andes-button>
              <andes-button
                variant="danger"
                andesAlertDialogAction
                (click)="result.set('Dropped orders-prod.')"
              >Drop database</andes-button>
            </div>
          </andes-alert-dialog-content>
        </andes-alert-dialog>

        ${resultLine}
      `,
    };
  },
};

/** Hold to confirm. */
export const HoldToConfirm: Story = {
  name: 'Hold to confirm',
  parameters: about(
    'Press and hold the action with the mouse, a finger or Space or Enter held down while a fill sweeps across it, letting go early cancels, and a screen reader that can only click gets a cancellable countdown of the same length.',
  ),
  render: () => {
    const result = signal(NOTHING_YET);
    return {
      props: { ...shared, result },
      template: `
        <andes-alert-dialog (cancelled)="result.set('Cancelled.')">
          <andes-button danger andesAlertDialogTrigger>Empty trash</andes-button>

          <andes-alert-dialog-content *andesAlertDialogContent>
            <div andesAlertDialogHeader>
              <h2 andesAlertDialogTitle>Empty the trash?</h2>
              <p andesAlertDialogDescription>
                The 86 items in the trash are deleted forever. Hold the button to confirm.
              </p>
            </div>

            <div andesAlertDialogFooter>
              <andes-button variant="secondary" andesAlertDialogCancel>Cancel</andes-button>
              <andes-button
                variant="danger"
                andesAlertDialogAction
                [holdDuration]="1500"
                (click)="result.set('Trash emptied.')"
              >Hold to empty</andes-button>
            </div>
          </andes-alert-dialog-content>
        </andes-alert-dialog>

        ${resultLine}
      `,
    };
  },
};

/** Async with recovery. */
export const AsyncWithRecovery: Story = {
  name: 'Async with recovery',
  parameters: about(
    'confirm takes the request: the dialog stays open with the action busy, Cancel and Escape are out of reach while it runs, and a failure shows inline so the same button retries, which the first attempt here does.',
  ),
  render: () => {
    const result = signal(NOTHING_YET);
    let attempts = 0;
    return {
      props: {
        ...shared,
        result,
        reset: () => (attempts = 0),
        remove: () => {
          attempts += 1;
          const attempt = attempts;
          return new Promise<void>((resolve, reject) =>
            setTimeout(() => {
              if (attempt === 1) {
                reject(new Error('Could not reach the server.'));
              } else {
                result.set(`Deleted acme-web on attempt ${attempt}.`);
                resolve();
              }
            }, 1400),
          );
        },
      },
      template: `
        <andes-alert-dialog (opened)="reset()" (cancelled)="result.set('Cancelled.')">
          <andes-button danger andesAlertDialogTrigger>Delete project</andes-button>

          <andes-alert-dialog-content *andesAlertDialogContent>
            <div andesAlertDialogHeader>
              <h2 andesAlertDialogTitle>Delete project acme-web?</h2>
              <p andesAlertDialogDescription>
                The project and its deployments are removed from your account.
              </p>
            </div>

            <andes-alert-dialog-error />

            <div andesAlertDialogFooter>
              <andes-button variant="secondary" andesAlertDialogCancel>Cancel</andes-button>
              <andes-button variant="danger" andesAlertDialogAction [confirm]="remove">
                Delete project
              </andes-button>
            </div>
          </andes-alert-dialog-content>
        </andes-alert-dialog>

        ${resultLine}
      `,
    };
  },
};

/** Unsaved changes. */
export const UnsavedChanges: Story = {
  name: 'Unsaved changes',
  parameters: about(
    'Three honest answers instead of two, with the secondary action at the start edge away from the Cancel and Save pair, and focus on Save because the safe choice here is the one that loses nothing.',
  ),
  render: () => {
    const result = signal(NOTHING_YET);
    return {
      props: { ...shared, result },
      template: `
        <andes-alert-dialog tone="warning" initialFocus="action">
          <andes-button andesAlertDialogTrigger>Close editor</andes-button>

          <andes-alert-dialog-content *andesAlertDialogContent>
            <div andesAlertDialogHeader>
              <andes-alert-dialog-icon />
              <h2 andesAlertDialogTitle>Save changes to pricing.md?</h2>
              <p andesAlertDialogDescription>
                Your changes are lost if you do not save them.
              </p>
            </div>

            <div andesAlertDialogFooter>
              <andes-button
                variant="ghost"
                andesAlertDialogSecondary
                (click)="result.set('Discarded the changes.')"
              >Don't save</andes-button>
              <andes-button
                variant="secondary"
                andesAlertDialogCancel
                (click)="result.set('Kept editing.')"
              >Cancel</andes-button>
              <andes-button
                andesAlertDialogAction
                (click)="result.set('Saved pricing.md.')"
              >Save</andes-button>
            </div>
          </andes-alert-dialog-content>
        </andes-alert-dialog>

        ${resultLine}
      `,
    };
  },
};

/** Impact summary. */
export const ImpactSummary: Story = {
  name: 'Impact summary',
  parameters: about(
    'A concrete scope instead of a vague warning, what will be touched with counts, and past maxVisible rows the rest sit behind a control so a long list does not push the actions off screen.',
  ),
  render: () => {
    const result = signal(NOTHING_YET);
    return {
      props: {
        ...shared,
        result,
        items: [
          { label: 'Files', count: 128 },
          { label: 'Folders', count: 12, detail: 'Including 3 shared folders' },
          { label: 'Deployments', count: 41 },
          { label: 'Domains', count: 2, detail: 'acme.dev and acme.app' },
          { label: 'Team members', count: 7 },
          { label: 'API tokens', count: 5 },
        ],
      },
      template: `
        <andes-alert-dialog tone="danger" (cancelled)="result.set('Cancelled.')">
          <andes-button danger andesAlertDialogTrigger>Delete organization</andes-button>

          <andes-alert-dialog-content *andesAlertDialogContent>
            <div andesAlertDialogHeader>
              <andes-alert-dialog-icon />
              <h2 andesAlertDialogTitle>Delete the Acme organization?</h2>
              <p andesAlertDialogDescription>
                Everything in the organization goes with it.
              </p>
            </div>

            <andes-alert-dialog-impact
              heading="This will permanently delete:"
              [items]="items"
              [maxVisible]="4"
            />

            <div andesAlertDialogFooter>
              <andes-button variant="secondary" andesAlertDialogCancel>Cancel</andes-button>
              <andes-button
                variant="danger"
                andesAlertDialogAction
                (click)="result.set('Deleted the Acme organization.')"
              >Delete organization</andes-button>
            </div>
          </andes-alert-dialog-content>
        </andes-alert-dialog>

        ${resultLine}
      `,
    };
  },
};

/** Don’t ask again. */
export const DontAskAgain: Story = {
  name: 'Don’t ask again',
  parameters: about(
    'No part of its own is needed: the library checkbox sits in the body and the action’s handler reads it, kept here in a signal where a real app would write it to its settings before closing.',
  ),
  render: () => {
    const result = signal(NOTHING_YET);
    const skip = signal(false);
    return {
      props: {
        ...shared,
        result,
        skip,
        archive: () =>
          result.set(
            skip()
              ? 'Archived. Next time the archive happens without asking.'
              : 'Archived. The dialog will ask again next time.',
          ),
      },
      template: `
        <andes-alert-dialog (cancelled)="result.set('Cancelled.')">
          <andes-button andesAlertDialogTrigger>Archive project</andes-button>

          <andes-alert-dialog-content *andesAlertDialogContent>
            <div andesAlertDialogHeader>
              <h2 andesAlertDialogTitle>Archive project acme-web?</h2>
              <p andesAlertDialogDescription>
                Archived projects are read-only. You can restore it at any time.
              </p>
            </div>

            <andes-checkbox [(checked)]="skip">Don't ask me again</andes-checkbox>

            <div andesAlertDialogFooter>
              <andes-button variant="secondary" andesAlertDialogCancel>Cancel</andes-button>
              <andes-button andesAlertDialogAction (click)="archive()">Archive</andes-button>
            </div>
          </andes-alert-dialog-content>
        </andes-alert-dialog>

        ${resultLine}
      `,
    };
  },
};

/** Accident guards. */
export const AccidentGuards: Story = {
  name: 'Accident guards',
  parameters: about(
    'armDelay ignores the action for 300 ms after the dialog opens so an Enter still held down from the trigger cannot confirm it, initialFocus="cancel" puts focus on the safe choice, and a second click does nothing while the request runs.',
  ),
  render: () => {
    const result = signal(NOTHING_YET);
    return {
      props: { ...shared, result },
      template: `
        <andes-alert-dialog initialFocus="cancel" (cancelled)="result.set('Cancelled.')">
          <andes-button danger andesAlertDialogTrigger>Revoke access</andes-button>

          <andes-alert-dialog-content *andesAlertDialogContent>
            <div andesAlertDialogHeader>
              <h2 andesAlertDialogTitle>Revoke access for 4 collaborators?</h2>
              <p andesAlertDialogDescription>
                They are signed out of every device and their invitations expire.
              </p>
            </div>

            <div andesAlertDialogFooter>
              <andes-button variant="secondary" andesAlertDialogCancel>Cancel</andes-button>
              <andes-button
                variant="danger"
                andesAlertDialogAction
                [armDelay]="300"
                (click)="result.set('Revoked access.')"
              >Revoke access</andes-button>
            </div>
          </andes-alert-dialog-content>
        </andes-alert-dialog>

        ${resultLine}
      `,
    };
  },
};

/** Danger zone. */
export const DangerZone: Story = {
  name: 'Danger zone',
  parameters: about(
    'Everything together for the most destructive thing an application does: a danger tone, the scope, a phrase to type and a request that can fail and be retried.',
  ),
  render: () => {
    const result = signal(NOTHING_YET);
    let attempts = 0;
    return {
      props: {
        ...shared,
        result,
        items: [
          { label: 'Projects', count: 9 },
          { label: 'Deployments', count: 218 },
          { label: 'Team members', count: 14 },
        ],
        reset: () => (attempts = 0),
        remove: () => {
          attempts += 1;
          const attempt = attempts;
          return new Promise<void>((resolve, reject) =>
            setTimeout(() => {
              if (attempt === 1) {
                reject(new Error('The billing service did not answer.'));
              } else {
                result.set('Deleted the Acme organization.');
                resolve();
              }
            }, 1200),
          );
        },
      },
      template: `
        <andes-alert-dialog
          tone="danger"
          size="lg"
          initialFocus="input"
          (opened)="reset()"
          (cancelled)="result.set('Cancelled.')"
        >
          <andes-button danger andesAlertDialogTrigger>Delete organization</andes-button>

          <andes-alert-dialog-content *andesAlertDialogContent>
            <div andesAlertDialogHeader>
              <andes-alert-dialog-icon />
              <h2 andesAlertDialogTitle>Delete the Acme organization?</h2>
              <p andesAlertDialogDescription>
                This cannot be undone. Billing stops and the data is erased within 24 hours.
              </p>
            </div>

            <andes-alert-dialog-impact heading="This will permanently delete:" [items]="items" />
            <andes-alert-dialog-confirm-phrase phrase="acme" ignoreCase />
            <andes-alert-dialog-error />

            <div andesAlertDialogFooter>
              <andes-button variant="secondary" andesAlertDialogCancel>Cancel</andes-button>
              <andes-button variant="danger" andesAlertDialogAction [confirm]="remove">
                Delete organization
              </andes-button>
            </div>
          </andes-alert-dialog-content>
        </andes-alert-dialog>

        ${resultLine}
      `,
    };
  },
};
