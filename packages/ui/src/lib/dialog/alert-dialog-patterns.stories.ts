import { signal } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular';

import { AndesButton } from '../button/button';
import { AndesCheckbox } from '../checkbox/checkbox';
import { ANDES_ALERT_DIALOG_IMPORTS, AndesAlertDialog } from './alert-dialog';

/**
 * Each story fills `result` from the dialog's own handlers, so what the user chose is
 * visible after the dialog has gone. The trigger is a native `<button>`: the overlay
 * primitive puts `aria-haspopup`/`aria-expanded`/`aria-controls` on the element the
 * directive sits on, and those are only valid on an element with an interactive role.
 */
const STYLES = `
  <style>
    .sb-trigger {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      height: 2rem;
      padding: 0 var(--andes-space-4);
      border: 1px solid transparent;
      border-radius: var(--andes-radius-md);
      background-color: var(--andes-color-danger);
      color: var(--andes-color-danger-foreground);
      font-family: var(--andes-font-family), sans-serif;
      font-weight: var(--andes-font-weight-medium);
      font-size: 0.875rem;
      cursor: pointer;
      transition: background-color 0.15s ease;
    }
    .sb-trigger:hover { background-color: var(--andes-color-danger-hover); }
    .sb-trigger:focus-visible {
      outline: 2px solid var(--andes-color-danger);
      outline-offset: 2px;
    }
    .sb-trigger--neutral {
      background-color: var(--andes-color-primary);
      color: var(--andes-color-primary-foreground);
    }
    .sb-trigger--neutral:hover { background-color: var(--andes-color-primary-hover); }
    .sb-trigger--neutral:focus-visible { outline-color: var(--andes-color-focus-ring); }
    .sb-row { display: flex; flex-wrap: wrap; gap: var(--andes-space-2); }
    .sb-result {
      margin: var(--andes-space-3) 0 0;
      font-family: var(--andes-font-family), sans-serif;
      font-size: 0.875rem;
      color: var(--andes-color-muted-foreground);
    }
    .sb-result strong { color: var(--andes-color-foreground); font-weight: 600; }
  </style>
`;

const IMPORTS = [ANDES_ALERT_DIALOG_IMPORTS, AndesButton, AndesCheckbox];

const meta: Meta<AndesAlertDialog> = {
  title: 'Feedback/Alert Dialog/Patterns',
  component: AndesAlertDialog,
  parameters: {
    docs: {
      description: {
        component:
          'Guards for the answer an alert dialog asks for. Gating parts (`andes-alert-dialog-confirm-phrase`, `-acknowledge`, `-countdown`) keep the action unavailable until their requirement is met; the action itself can hold, wait for a request and retry; `tone`, the icon, the impact summary and the third answer shape what the user sees. Every part is composable and optional.',
      },
    },
  },
};

export default meta;

type Story = StoryObj<AndesAlertDialog>;

/**
 * A field that must be typed before the action unlocks (GitHub's "type the repository
 * name"). The phrase sits in a chip one click selects; a wrong entry is only flagged
 * once it can no longer become the phrase; Enter confirms a matching one.
 */
export const TypeToConfirm: Story = {
  render: () => {
    const result = signal('Nothing yet.');
    return {
      moduleMetadata: { imports: IMPORTS },
      props: { result },
      template: `
        ${STYLES}
        <andes-alert-dialog initialFocus="input" (cancelled)="result.set('Cancelled.')">
          <button type="button" class="sb-trigger" andesAlertDialogTrigger>Delete project</button>

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

        <p class="sb-result">Result: <strong>{{ result() }}</strong></p>
      `,
    };
  },
};

/**
 * Case-insensitive, pasting refused, and the label in the user's language: `{phrase}`
 * marks where the chip goes. The usual "type DELETE" confirmation.
 */
export const TypeToConfirmStrict: Story = {
  render: () => {
    const result = signal('Nothing yet.');
    return {
      moduleMetadata: { imports: IMPORTS },
      props: { result },
      template: `
        ${STYLES}
        <andes-alert-dialog (cancelled)="result.set('Cancelled.')">
          <button type="button" class="sb-trigger" andesAlertDialogTrigger>Delete all backups</button>

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

        <p class="sb-result">Result: <strong>{{ result() }}</strong></p>
      `,
    };
  },
};

/**
 * "I understand this cannot be undone": one checkbox per consequence, each of which has to
 * be ticked. Pressing the unavailable action shakes it and reads out what is missing.
 */
export const AcknowledgeCheckbox: Story = {
  render: () => {
    const result = signal('Nothing yet.');
    return {
      moduleMetadata: { imports: IMPORTS },
      props: { result },
      template: `
        ${STYLES}
        <andes-alert-dialog (cancelled)="result.set('Cancelled.')">
          <button type="button" class="sb-trigger" andesAlertDialogTrigger>Delete workspace</button>

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

        <p class="sb-result">Result: <strong>{{ result() }}</strong></p>
      `,
    };
  },
};

/**
 * The action unlocks after a pause, with a visible count and a thin progress bar. Screen
 * readers hear the wait when it starts and when it ends, not every second. The countdown
 * restarts each time the dialog opens.
 */
export const Countdown: Story = {
  render: () => {
    const result = signal('Nothing yet.');
    return {
      moduleMetadata: { imports: IMPORTS },
      props: { result },
      template: `
        ${STYLES}
        <andes-alert-dialog (cancelled)="result.set('Cancelled.')">
          <button type="button" class="sb-trigger" andesAlertDialogTrigger>Drop database</button>

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

        <p class="sb-result">Result: <strong>{{ result() }}</strong></p>
      `,
    };
  },
};

/**
 * Press and hold the action (mouse, touch, or Space/Enter held down) while a fill sweeps
 * across it. Letting go early cancels. A screen reader that can only "click" gets a
 * cancellable countdown of the same length instead of an action it cannot perform.
 */
export const HoldToConfirm: Story = {
  render: () => {
    const result = signal('Nothing yet.');
    return {
      moduleMetadata: { imports: IMPORTS },
      props: { result },
      template: `
        ${STYLES}
        <andes-alert-dialog (cancelled)="result.set('Cancelled.')">
          <button type="button" class="sb-trigger" andesAlertDialogTrigger>Empty trash</button>

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

        <p class="sb-result">Result: <strong>{{ result() }}</strong></p>
      `,
    };
  },
};

/**
 * `[confirm]` takes the request. The dialog stays open with the action busy, Cancel and
 * Escape are out of reach while it runs, and a failure shows inline so the same button
 * retries. The first attempt here fails; the second succeeds.
 */
export const AsyncWithRecovery: Story = {
  render: () => {
    const result = signal('Nothing yet.');
    let attempts = 0;
    return {
      moduleMetadata: { imports: IMPORTS },
      props: {
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
        ${STYLES}
        <andes-alert-dialog (opened)="reset()" (cancelled)="result.set('Cancelled.')">
          <button type="button" class="sb-trigger" andesAlertDialogTrigger>Delete project</button>

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

        <p class="sb-result">Result: <strong>{{ result() }}</strong></p>
      `,
    };
  },
};

/**
 * Three honest answers instead of two. The secondary action sits at the start edge, away
 * from the Cancel/Save pair, and the dialog opens with focus on Save: the safe choice
 * here is the one that loses nothing.
 */
export const UnsavedChanges: Story = {
  render: () => {
    const result = signal('Nothing yet.');
    return {
      moduleMetadata: { imports: IMPORTS },
      props: { result },
      template: `
        ${STYLES}
        <andes-alert-dialog tone="warning" initialFocus="action">
          <button type="button" class="sb-trigger sb-trigger--neutral" andesAlertDialogTrigger>Close editor</button>

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

        <p class="sb-result">Result: <strong>{{ result() }}</strong></p>
      `,
    };
  },
};

/**
 * `tone` adds a coloured band along the top and drives the icon. The icons differ in
 * shape as well as colour (octagon, triangle, circle), so the tone never rests on colour
 * alone.
 */
export const Tones: Story = {
  render: () => {
    const result = signal('Nothing yet.');
    return {
      moduleMetadata: { imports: IMPORTS },
      props: {
        result,
        tones: [
          {
            tone: 'danger',
            trigger: 'Danger',
            title: 'Remove this member?',
            text: 'Maria Quispe loses access to every project at once.',
            action: 'Remove member',
            variant: 'danger',
          },
          {
            tone: 'warning',
            trigger: 'Warning',
            title: 'Publish with 3 broken links?',
            text: 'Visitors will land on error pages until the links are fixed.',
            action: 'Publish anyway',
            variant: 'primary',
          },
          {
            tone: 'info',
            trigger: 'Info',
            title: 'A new version is available',
            text: 'Reload to get 4.2. Unsaved forms keep their drafts.',
            action: 'Reload now',
            variant: 'primary',
          },
          {
            tone: 'success',
            trigger: 'Success',
            title: 'Ready to ship?',
            text: 'All 214 checks passed. Release 4.2 goes live to every region.',
            action: 'Ship release',
            variant: 'primary',
          },
        ],
      },
      template: `
        ${STYLES}
        <div class="sb-row">
          @for (item of tones; track item.tone) {
            <andes-alert-dialog [tone]="item.tone" (cancelled)="result.set('Cancelled the ' + item.tone + ' dialog.')">
              <button type="button" class="sb-trigger sb-trigger--neutral" andesAlertDialogTrigger>{{ item.trigger }}</button>

              <andes-alert-dialog-content *andesAlertDialogContent>
                <div andesAlertDialogHeader>
                  <andes-alert-dialog-icon />
                  <h2 andesAlertDialogTitle>{{ item.title }}</h2>
                  <p andesAlertDialogDescription>{{ item.text }}</p>
                </div>

                <div andesAlertDialogFooter>
                  <andes-button variant="secondary" andesAlertDialogCancel>Cancel</andes-button>
                  <andes-button
                    [variant]="item.variant"
                    andesAlertDialogAction
                    (click)="result.set(item.action + ' confirmed.')"
                  >{{ item.action }}</andes-button>
                </div>
              </andes-alert-dialog-content>
            </andes-alert-dialog>
          }
        </div>

        <p class="sb-result">Result: <strong>{{ result() }}</strong></p>
      `,
    };
  },
};

/**
 * A concrete scope rather than a vague warning: what will be touched, with counts. Past
 * `maxVisible` rows the rest sit behind a control, so a long list does not push the
 * actions off screen.
 */
export const ImpactSummary: Story = {
  render: () => {
    const result = signal('Nothing yet.');
    return {
      moduleMetadata: { imports: IMPORTS },
      props: {
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
        ${STYLES}
        <andes-alert-dialog tone="danger" (cancelled)="result.set('Cancelled.')">
          <button type="button" class="sb-trigger" andesAlertDialogTrigger>Delete organization</button>

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

        <p class="sb-result">Result: <strong>{{ result() }}</strong></p>
      `,
    };
  },
};

/**
 * "Don't ask me again" needs no part of its own: the library checkbox sits in the body
 * and the action's handler reads it. Here the choice is kept in a signal; a real app
 * would write it to its settings before closing.
 */
export const DontAskAgain: Story = {
  render: () => {
    const result = signal('Nothing yet.');
    const skip = signal(false);
    return {
      moduleMetadata: { imports: IMPORTS },
      props: {
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
        ${STYLES}
        <andes-alert-dialog (cancelled)="result.set('Cancelled.')">
          <button type="button" class="sb-trigger sb-trigger--neutral" andesAlertDialogTrigger>Archive project</button>

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

        <p class="sb-result">Result: <strong>{{ result() }}</strong></p>
      `,
    };
  },
};

/**
 * Small guards against an accidental answer. `armDelay` ignores the action for 300 ms
 * after the dialog opens, so an Enter still held down from the trigger cannot confirm it;
 * `initialFocus="cancel"` puts focus on the safe choice; while the request runs a second
 * click does nothing. Try opening it with the keyboard and pressing Enter at once.
 */
export const AccidentGuards: Story = {
  render: () => {
    const result = signal('Nothing yet.');
    return {
      moduleMetadata: { imports: IMPORTS },
      props: { result },
      template: `
        ${STYLES}
        <andes-alert-dialog initialFocus="cancel" (cancelled)="result.set('Cancelled.')">
          <button type="button" class="sb-trigger" andesAlertDialogTrigger>Revoke access</button>

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

        <p class="sb-result">Result: <strong>{{ result() }}</strong></p>
      `,
    };
  },
};

/**
 * Everything together for the most destructive thing an app does: a danger tone, the
 * scope, a phrase to type and a request that can fail and be retried.
 */
export const DangerZone: Story = {
  render: () => {
    const result = signal('Nothing yet.');
    let attempts = 0;
    return {
      moduleMetadata: { imports: IMPORTS },
      props: {
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
        ${STYLES}
        <andes-alert-dialog
          tone="danger"
          size="lg"
          initialFocus="input"
          (opened)="reset()"
          (cancelled)="result.set('Cancelled.')"
        >
          <button type="button" class="sb-trigger" andesAlertDialogTrigger>Delete organization</button>

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

        <p class="sb-result">Result: <strong>{{ result() }}</strong></p>
      `,
    };
  },
};
