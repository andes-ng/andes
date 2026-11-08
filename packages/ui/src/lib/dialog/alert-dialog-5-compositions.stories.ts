import { computed, signal } from '@angular/core';
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
 * Alert dialogs as an application uses them: each one sits in a screen that has a reason to
 * ask, and the answer changes what the screen shows.
 */

const meta: Meta<AndesAlertDialog> = {
  title: 'Feedback/Alert Dialog/Compositions',
  decorators: [withDescription, withDialogKit],
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<AndesAlertDialog>;

/** A request that takes `ms` and can be made to fail once. */
function request(ms: number, fail = false): Promise<void> {
  return new Promise((resolve, reject) =>
    setTimeout(
      () =>
        fail ? reject(new Error('The server did not answer.')) : resolve(),
      ms,
    ),
  );
}

/** One member removed from a list. */
export const RemoveAMember: Story = {
  name: 'Remove a member',
  parameters: about(
    'Each row of a team list has its own danger dialog that names the person and says what they lose, focus starts on Cancel, and confirming takes the row off the list.',
  ),
  render: () => {
    const initial = [
      {
        id: 1,
        name: 'Maria Quispe',
        email: 'maria@acme.dev',
        role: 'Editor',
        initials: 'MQ',
      },
      {
        id: 2,
        name: 'Diego Paredes',
        email: 'diego@acme.dev',
        role: 'Admin',
        initials: 'DP',
      },
      {
        id: 3,
        name: 'Lucía Mendoza',
        email: 'lucia@acme.dev',
        role: 'Viewer',
        initials: 'LM',
      },
    ];
    const members = signal(initial);
    const result = signal(NOTHING_YET);
    return {
      props: {
        ...shared,
        members,
        result,
        remove: (id: number, name: string) => {
          members.update((list) => list.filter((member) => member.id !== id));
          result.set(`Removed ${name}.`);
        },
        restore: () => {
          members.set(initial);
          result.set('Restored the list.');
        },
      },
      template: `
        <div [style]="card" style="max-width: 36rem; padding: 0.5rem 1rem;">
          @for (member of members(); track member.id) {
            <div style="display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 0;" [style.border-top]="$first ? 'none' : '1px solid var(--andes-color-border)'">
              <andes-avatar><andes-avatar-fallback>{{ member.initials }}</andes-avatar-fallback></andes-avatar>
              <div style="flex: 1; display: flex; flex-direction: column;">
                <span [style]="strong">{{ member.name }}</span>
                <span [style]="muted">{{ member.email }}</span>
              </div>
              <andes-tag>{{ member.role }}</andes-tag>

              <andes-alert-dialog tone="danger" initialFocus="cancel">
                <andes-button variant="ghost" size="sm" andesAlertDialogTrigger [aria-label]="'Remove ' + member.name">
                  <ng-icon name="lucideTrash2" aria-hidden="true" /> Remove
                </andes-button>

                <andes-alert-dialog-content *andesAlertDialogContent>
                  <div andesAlertDialogHeader>
                    <andes-alert-dialog-icon />
                    <h2 andesAlertDialogTitle>Remove {{ member.name }}?</h2>
                    <p andesAlertDialogDescription>
                      {{ member.name }} loses access to every project in the workspace at once. Their comments stay.
                    </p>
                  </div>

                  <div andesAlertDialogFooter>
                    <andes-button variant="secondary" andesAlertDialogCancel>Cancel</andes-button>
                    <andes-button variant="danger" andesAlertDialogAction (click)="remove(member.id, member.name)">Remove member</andes-button>
                  </div>
                </andes-alert-dialog-content>
              </andes-alert-dialog>
            </div>
          } @empty {
            <p [style]="muted" style="margin: 0.75rem 0;">Everyone has been removed.</p>
          }
        </div>
        <div [style]="row" style="margin-top: 1rem;">
          <andes-button variant="secondary" size="sm" (click)="restore()">Restore the list</andes-button>
        </div>
        ${resultLine}
      `,
    };
  },
};

/** Leaving an editor with changes. */
export const DiscardUnsavedChanges: Story = {
  name: 'Discard unsaved changes',
  parameters: about(
    'Leaving an editor asks only when something changed, with three answers (Don’t save, Cancel and Save) and focus on Save, and a clean editor leaves at once without a dialog.',
  ),
  render: () => {
    const title = signal('Pricing');
    const body = signal('');
    const saved = signal({ title: 'Pricing', body: '' });
    const open = signal(false);
    const result = signal(NOTHING_YET);
    const dirty = computed(
      () => title() !== saved().title || body() !== saved().body,
    );
    return {
      props: {
        ...shared,
        title,
        body,
        open,
        result,
        dirty,
        leave() {
          if (dirty()) {
            open.set(true);
          } else {
            result.set('Left the editor; nothing to save.');
          }
        },
        save() {
          saved.set({ title: title(), body: body() });
          result.set('Saved, then left the editor.');
        },
        discard() {
          title.set(saved().title);
          body.set(saved().body);
          result.set('Discarded the changes and left the editor.');
        },
      },
      template: `
        <div [style]="card" style="max-width: 36rem; display: flex; flex-direction: column; gap: 1rem;">
          <andes-form-field label="Title">
            <andes-input [value]="title()" (valueChange)="title.set($event)" />
          </andes-form-field>
          <andes-form-field label="Notes">
            <andes-textarea [rows]="3" placeholder="Type something, then leave" [value]="body()" (valueChange)="body.set($event)" />
          </andes-form-field>
          <div [style]="formRow">
            <andes-button variant="secondary" (click)="leave()">Leave the editor</andes-button>
            <andes-tag [color]="dirty() ? 'warning' : 'success'">{{ dirty() ? 'Unsaved changes' : 'All changes saved' }}</andes-tag>
          </div>
        </div>

        <andes-alert-dialog [(open)]="open" tone="warning" initialFocus="action" (cancelled)="result.set('Kept editing.')">
          <andes-alert-dialog-content *andesAlertDialogContent>
            <div andesAlertDialogHeader>
              <andes-alert-dialog-icon />
              <h2 andesAlertDialogTitle>Save changes to {{ title() }}?</h2>
              <p andesAlertDialogDescription>Your changes are lost if you do not save them.</p>
            </div>

            <div andesAlertDialogFooter>
              <andes-button variant="ghost" andesAlertDialogSecondary (click)="discard()">Don't save</andes-button>
              <andes-button variant="secondary" andesAlertDialogCancel>Cancel</andes-button>
              <andes-button andesAlertDialogAction (click)="save()">Save</andes-button>
            </div>
          </andes-alert-dialog-content>
        </andes-alert-dialog>
        ${resultLine}
      `,
    };
  },
};

/** Revoking a credential. */
export const RevokeAnApiKey: Story = {
  name: 'Revoke an API key by typing its name',
  parameters: about(
    'One dialog serves the whole list of keys, it asks for the name of the key that was chosen before Revoke unlocks, and it reports a failure inline so the same button retries, which the first attempt does.',
  ),
  render: () => {
    const initial = [
      { name: 'ci-deploy', created: 'Created 14 March', scope: 'Write' },
      { name: 'analytics-readonly', created: 'Created 2 June', scope: 'Read' },
      { name: 'mobile-app', created: 'Created 21 August', scope: 'Write' },
    ];
    const keys = signal(initial);
    const selected = signal<string>('');
    const open = signal(false);
    const result = signal(NOTHING_YET);
    let attempts = 0;
    return {
      props: {
        ...shared,
        keys,
        selected,
        open,
        result,
        choose(name: string) {
          attempts = 0;
          selected.set(name);
          open.set(true);
        },
        revoke: () => {
          attempts += 1;
          const attempt = attempts;
          return request(1000, attempt === 1).then(() => {
            keys.update((list) =>
              list.filter((key) => key.name !== selected()),
            );
            result.set(`Revoked ${selected()}.`);
          });
        },
        restore() {
          keys.set(initial);
          result.set('Restored the keys.');
        },
      },
      template: `
        <div [style]="card" style="max-width: 36rem; padding: 0.5rem 1rem;">
          @for (key of keys(); track key.name) {
            <div style="display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 0;" [style.border-top]="$first ? 'none' : '1px solid var(--andes-color-border)'">
              <ng-icon name="lucideLock" aria-hidden="true" />
              <div style="flex: 1; display: flex; flex-direction: column;">
                <span [style]="strong">{{ key.name }}</span>
                <span [style]="muted">{{ key.created }}</span>
              </div>
              <andes-tag [color]="key.scope === 'Write' ? 'warning' : 'default'">{{ key.scope }}</andes-tag>
              <andes-button variant="ghost" size="sm" [aria-label]="'Revoke ' + key.name" (click)="choose(key.name)">Revoke</andes-button>
            </div>
          } @empty {
            <p [style]="muted" style="margin: 0.75rem 0;">No active keys.</p>
          }
        </div>
        <div [style]="row" style="margin-top: 1rem;">
          <andes-button variant="secondary" size="sm" (click)="restore()">Restore the keys</andes-button>
        </div>

        <andes-alert-dialog [(open)]="open" tone="danger" initialFocus="input" (cancelled)="result.set('Kept ' + selected() + '.')">
          <andes-alert-dialog-content *andesAlertDialogContent>
            <div andesAlertDialogHeader>
              <andes-alert-dialog-icon />
              <h2 andesAlertDialogTitle>Revoke {{ selected() }}?</h2>
              <p andesAlertDialogDescription>
                Anything that still uses this key stops working at once. A revoked key cannot be restored.
              </p>
            </div>

            <andes-alert-dialog-confirm-phrase [phrase]="selected()" ignoreCase />
            <andes-alert-dialog-error />

            <div andesAlertDialogFooter>
              <andes-button variant="secondary" andesAlertDialogCancel>Cancel</andes-button>
              <andes-button variant="danger" andesAlertDialogAction [confirm]="revoke">Revoke key</andes-button>
            </div>
          </andes-alert-dialog-content>
        </andes-alert-dialog>
        ${resultLine}
      `,
    };
  },
};

/** A release that goes to every customer. */
export const PublishToProduction: Story = {
  name: 'Publish to production',
  parameters: about(
    'A release that reaches every customer waits for two things, a countdown to read the summary and a checkbox that says it was read, and then publishes with the action busy until the request is done.',
  ),
  render: () => {
    const result = signal(NOTHING_YET);
    return {
      props: {
        ...shared,
        result,
        publish: () =>
          request(1200).then(() =>
            result.set('Published 4.2.0 to production.'),
          ),
      },
      template: `
        <andes-alert-dialog tone="warning" size="lg" (cancelled)="result.set('Held the release.')">
          <div [style]="card" style="max-width: 36rem; display: flex; align-items: center; justify-content: space-between; gap: 1rem;">
            <div style="display: flex; flex-direction: column; gap: 0.25rem;">
              <span [style]="strong">Release 4.2.0</span>
              <span [style]="muted">Built from main, 12 minutes ago</span>
            </div>
            <andes-button andesAlertDialogTrigger>Publish to production</andes-button>
          </div>

          <andes-alert-dialog-content *andesAlertDialogContent>
            <div andesAlertDialogHeader>
              <andes-alert-dialog-icon />
              <h2 andesAlertDialogTitle>Publish 4.2.0 to production?</h2>
              <p andesAlertDialogDescription>
                Every customer gets this version within a few minutes.
              </p>
            </div>

            <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
              <andes-tag color="success">214 checks passed</andes-tag>
              <andes-tag color="warning">2 database migrations</andes-tag>
              <andes-tag>3 regions</andes-tag>
            </div>

            <andes-alert-dialog-countdown [seconds]="5" />
            <andes-alert-dialog-acknowledge requirement="Confirm that you read the summary.">
              I read the summary and the migrations can run without a rollback.
            </andes-alert-dialog-acknowledge>
            <andes-alert-dialog-error />

            <div andesAlertDialogFooter>
              <andes-button variant="secondary" andesAlertDialogCancel>Cancel</andes-button>
              <andes-button andesAlertDialogAction [confirm]="publish">Publish to production</andes-button>
            </div>
          </andes-alert-dialog-content>
        </andes-alert-dialog>
        ${resultLine}
      `,
    };
  },
};

/** An account that cannot come back. */
export const DeleteAnAccount: Story = {
  name: 'Delete an account by holding',
  parameters: about(
    'Deleting an account lists what goes with it and asks the user to press and hold the action for two seconds, so it cannot be done by a single click, and a keyboard or screen reader user holds Space or gets a countdown instead.',
  ),
  render: () => {
    const result = signal(NOTHING_YET);
    return {
      props: {
        ...shared,
        result,
        items: [
          { label: 'Projects', count: 9 },
          { label: 'Deployments', count: 218 },
          { label: 'Stored files', count: 4120, detail: 'About 18 GB' },
          { label: 'Team members', count: 14 },
        ],
      },
      template: `
        <andes-alert-dialog tone="danger" initialFocus="cancel" (cancelled)="result.set('Kept the account.')">
          <andes-button variant="danger" andesAlertDialogTrigger>Delete my account</andes-button>

          <andes-alert-dialog-content *andesAlertDialogContent>
            <div andesAlertDialogHeader>
              <andes-alert-dialog-icon />
              <h2 andesAlertDialogTitle>Delete your account?</h2>
              <p andesAlertDialogDescription>
                This cannot be undone. Billing stops and the data is erased within 24 hours.
              </p>
            </div>

            <andes-alert-dialog-impact heading="This will permanently delete:" [items]="items" />

            <div andesAlertDialogFooter>
              <andes-button variant="secondary" andesAlertDialogCancel>Cancel</andes-button>
              <andes-button variant="danger" andesAlertDialogAction [holdDuration]="2000" (click)="result.set('Deleted the account.')">Hold to delete</andes-button>
            </div>
          </andes-alert-dialog-content>
        </andes-alert-dialog>
        ${resultLine}
      `,
    };
  },
};

/** Deleting what is selected. */
export const BulkDelete: Story = {
  name: 'Bulk delete with an impact list',
  parameters: about(
    'The impact list is computed from the selection, so the dialog counts exactly what is about to go, files, size and shared links, and the trigger stays unavailable while nothing is selected.',
  ),
  render: () => {
    const initial = [
      {
        id: 1,
        name: 'brand-guidelines.pdf',
        mb: 12,
        shared: 2,
        selected: true,
      },
      { id: 2, name: 'q3-forecast.xlsx', mb: 3, shared: 0, selected: true },
      {
        id: 3,
        name: 'onboarding-video.mp4',
        mb: 220,
        shared: 1,
        selected: false,
      },
      { id: 4, name: 'team-photo.png', mb: 6, shared: 0, selected: true },
      { id: 5, name: 'contract-draft.docx', mb: 1, shared: 4, selected: false },
    ];
    const files = signal(initial);
    const result = signal(NOTHING_YET);
    const chosen = computed(() => files().filter((file) => file.selected));
    return {
      props: {
        ...shared,
        files,
        result,
        chosen,
        items: computed(() => [
          { label: 'Files', count: chosen().length },
          {
            label: 'Megabytes freed',
            count: chosen().reduce((sum, file) => sum + file.mb, 0),
          },
          {
            label: 'Shared links',
            count: chosen().reduce((sum, file) => sum + file.shared, 0),
            detail: 'They stop working',
          },
        ]),
        toggle(id: number, selected: boolean) {
          files.update((list) =>
            list.map((file) => (file.id === id ? { ...file, selected } : file)),
          );
        },
        remove() {
          const count = chosen().length;
          files.update((list) => list.filter((file) => !file.selected));
          result.set(`Deleted ${count} files.`);
        },
        restore() {
          files.set(initial);
          result.set('Restored the files.');
        },
      },
      template: `
        <div [style]="card" style="max-width: 36rem; display: flex; flex-direction: column; gap: 0.75rem;">
          @for (file of files(); track file.id) {
            <andes-checkbox [checked]="file.selected" (checkedChange)="toggle(file.id, $event)">
              {{ file.name }} <span [style]="muted">({{ file.mb }} MB)</span>
            </andes-checkbox>
          } @empty {
            <span [style]="muted">No files left.</span>
          }
          <hr [style]="divider" />
          <div [style]="formRow">
            <andes-alert-dialog tone="danger" initialFocus="cancel" (cancelled)="result.set('Kept the files.')">
              <andes-button variant="danger" andesAlertDialogTrigger [disabled]="chosen().length === 0">
                <ng-icon name="lucideTrash2" aria-hidden="true" /> Delete {{ chosen().length }} selected
              </andes-button>

              <andes-alert-dialog-content *andesAlertDialogContent>
                <div andesAlertDialogHeader>
                  <andes-alert-dialog-icon />
                  <h2 andesAlertDialogTitle>Delete {{ chosen().length }} files?</h2>
                  <p andesAlertDialogDescription>They are removed for everyone who can see them.</p>
                </div>

                <andes-alert-dialog-impact heading="This will remove:" [items]="items()" />

                <div andesAlertDialogFooter>
                  <andes-button variant="secondary" andesAlertDialogCancel>Cancel</andes-button>
                  <andes-button variant="danger" andesAlertDialogAction (click)="remove()">Delete files</andes-button>
                </div>
              </andes-alert-dialog-content>
            </andes-alert-dialog>
            <andes-button variant="ghost" size="sm" (click)="restore()">Restore the files</andes-button>
          </div>
        </div>
        ${resultLine}
      `,
    };
  },
};

/** A timer that makes the choice if nobody does. */
export const SessionAboutToExpire: Story = {
  name: 'Session about to expire',
  parameters: about(
    'A dialog that counts down its own deadline: Stay signed in answers it, Sign out is the other answer, and when the seconds run out the dialog closes itself and signs the user out.',
  ),
  render: () => {
    const open = signal(false);
    const seconds = signal(20);
    const result = signal(NOTHING_YET);
    let timer: ReturnType<typeof setInterval> | undefined;
    const stop = () => {
      clearInterval(timer);
      timer = undefined;
    };
    return {
      props: {
        ...shared,
        open,
        seconds,
        result,
        start() {
          seconds.set(20);
          stop();
          timer = setInterval(() => {
            seconds.update((value) => value - 1);
            if (seconds() <= 0) {
              stop();
              open.set(false);
              result.set('The session ran out; signed out.');
            }
          }, 1000);
        },
        stop,
      },
      template: `
        <div [style]="row">
          <andes-button variant="secondary" (click)="open.set(true)">Simulate an idle session</andes-button>
        </div>

        <andes-alert-dialog
          [(open)]="open"
          tone="warning"
          initialFocus="action"
          [closeOnEscape]="false"
          (opened)="start()"
          (closed)="stop()"
        >
          <andes-alert-dialog-content *andesAlertDialogContent>
            <div andesAlertDialogHeader>
              <andes-alert-dialog-icon />
              <h2 andesAlertDialogTitle>Are you still there?</h2>
              <p andesAlertDialogDescription>
                For your security you will be signed out in {{ seconds() }} seconds.
              </p>
            </div>

            <div andesAlertDialogFooter>
              <andes-button variant="secondary" andesAlertDialogCancel (click)="result.set('Signed out.')">Sign out</andes-button>
              <andes-button andesAlertDialogAction (click)="result.set('Still signed in.')">Stay signed in</andes-button>
            </div>
          </andes-alert-dialog-content>
        </andes-alert-dialog>
        ${resultLine}
      `,
    };
  },
};

/** Putting settings back. */
export const ResetToDefaults: Story = {
  name: 'Reset to defaults',
  parameters: about(
    'A settings panel that counts how many options differ from their defaults, offers the reset only when something does, asks before it puts them all back and then shows the panel as it was.',
  ),
  render: () => {
    const defaults = {
      compact: false,
      sound: true,
      beta: false,
      language: 'en',
    };
    const compact = signal(true);
    const sound = signal(false);
    const beta = signal(true);
    const language = signal('es');
    const result = signal(NOTHING_YET);
    const changed = computed(
      () =>
        [
          compact() !== defaults.compact,
          sound() !== defaults.sound,
          beta() !== defaults.beta,
          language() !== defaults.language,
        ].filter(Boolean).length,
    );
    return {
      props: {
        ...shared,
        compact,
        sound,
        beta,
        language,
        result,
        changed,
        languages: [
          { value: 'en', label: 'English' },
          { value: 'es', label: 'Español' },
          { value: 'pt', label: 'Português' },
        ],
        reset() {
          compact.set(defaults.compact);
          sound.set(defaults.sound);
          beta.set(defaults.beta);
          language.set(defaults.language);
          result.set('Everything is back to its default.');
        },
      },
      template: `
        <div [style]="card" style="max-width: 36rem; display: flex; flex-direction: column; gap: 1rem;">
          <andes-switch [checked]="compact()" (checkedChange)="compact.set($event)">Compact tables</andes-switch>
          <andes-switch [checked]="sound()" (checkedChange)="sound.set($event)">Play a sound for new messages</andes-switch>
          <andes-switch [checked]="beta()" (checkedChange)="beta.set($event)">Try beta features</andes-switch>
          <andes-form-field label="Language">
            <andes-select [options]="languages" [value]="language()" (valueChange)="language.set($event)" />
          </andes-form-field>
          <hr [style]="divider" />
          <div [style]="formRow">
            <andes-alert-dialog tone="info" (cancelled)="result.set('Kept the settings.')">
              <andes-button variant="secondary" andesAlertDialogTrigger [disabled]="changed() === 0">Reset to defaults</andes-button>

              <andes-alert-dialog-content *andesAlertDialogContent>
                <div andesAlertDialogHeader>
                  <andes-alert-dialog-icon />
                  <h2 andesAlertDialogTitle>Reset all settings?</h2>
                  <p andesAlertDialogDescription>
                    {{ changed() }} {{ changed() === 1 ? 'option goes' : 'options go' }} back to the default. Your data is not touched.
                  </p>
                </div>

                <div andesAlertDialogFooter>
                  <andes-button variant="secondary" andesAlertDialogCancel>Cancel</andes-button>
                  <andes-button andesAlertDialogAction (click)="reset()">Reset settings</andes-button>
                </div>
              </andes-alert-dialog-content>
            </andes-alert-dialog>
            <andes-tag [color]="changed() ? 'warning' : 'success'">{{ changed() ? changed() + ' changed' : 'All defaults' }}</andes-tag>
          </div>
        </div>
        ${resultLine}
      `,
    };
  },
};
