import { signal } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import type { Meta, StoryObj } from '@storybook/angular';

import {
  about,
  NOTHING_YET,
  resultLine,
  scene,
  shared,
  withDescription,
  withDialogKit,
} from '../../testing/dialog-story-kit';
import type { AndesDialog } from './dialog';

/*
 * Dialogs as an application uses them: a form with validation, settings, a picker, an
 * agreement, a wizard, a select inside a dialog, a long form, a preview, an invitation and a
 * cheat sheet.
 */

const meta: Meta<AndesDialog> = {
  title: 'Feedback/Dialog/Compositions',
  decorators: [withDescription, withDialogKit],
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<AndesDialog>;

const SELECT_OPTIONS = {
  roles: [
    { value: 'viewer', label: 'Viewer' },
    { value: 'editor', label: 'Editor' },
    { value: 'admin', label: 'Admin' },
  ],
  languages: [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Español' },
    { value: 'pt', label: 'Português' },
    { value: 'fr', label: 'Français' },
  ],
  countries: [
    { value: 'pe', label: 'Peru' },
    { value: 'co', label: 'Colombia' },
    { value: 'cl', label: 'Chile' },
    { value: 'ar', label: 'Argentina' },
    { value: 'mx', label: 'Mexico' },
    { value: 'es', label: 'Spain' },
    { value: 'pt', label: 'Portugal' },
    { value: 'us', label: 'United States' },
  ],
};

/** A form in a dialog. */
export const EditProfileForm: Story = {
  name: 'Edit profile form',
  parameters: about(
    'A form built with andes-form-field inside the dialog: the fields validate as they are touched, Save marks every field and refuses to go on while one is invalid, and the built-in OK spins while the request runs.',
  ),
  render: () => {
    const open = signal(false);
    const saving = signal(false);
    const result = signal(NOTHING_YET);
    const form = new FormGroup({
      name: new FormControl('', [Validators.required, Validators.minLength(2)]),
      email: new FormControl('', [Validators.required, Validators.email]),
      bio: new FormControl(''),
      notify: new FormControl(true),
    });
    return {
      props: {
        ...shared,
        open,
        saving,
        result,
        form,
        save() {
          form.markAllAsTouched();
          if (form.invalid) {
            return;
          }
          saving.set(true);
          setTimeout(() => {
            saving.set(false);
            open.set(false);
            result.set(`Saved the profile of ${form.value.name}.`);
          }, 1200);
        },
      },
      template: `
        <andes-dialog
          [(open)]="open"
          footer="default"
          okText="Save changes"
          [confirmLoading]="saving()"
          [cancelDisabled]="saving()"
          (ok)="save()"
        >
          <andes-button andesDialogTrigger>Edit profile</andes-button>

          <andes-dialog-content *andesDialogContent>
            <div andesDialogHeader>
              <h2 andesDialogTitle>Edit profile</h2>
              <p andesDialogDescription>Make changes to your profile here. Save when you are done.</p>
            </div>

            <form andesForm [formGroup]="form" layout="vertical" (ngSubmit)="save()">
              <andes-form-field label="Full name">
                <andes-input formControlName="name" placeholder="Ada Lovelace" />
              </andes-form-field>
              <andes-form-field label="Email" extra="We only write to you about your account.">
                <andes-input formControlName="email" type="email" placeholder="ada@example.com" />
              </andes-form-field>
              <andes-form-field label="Bio">
                <andes-textarea formControlName="bio" [rows]="3" [maxLength]="160" showCount />
              </andes-form-field>
              <andes-form-field>
                <andes-switch formControlName="notify">Email me about activity</andes-switch>
              </andes-form-field>
            </form>
          </andes-dialog-content>
        </andes-dialog>
        ${resultLine}
      `,
    };
  },
};

/** Settings in sections. */
export const SettingsWithTabs: Story = {
  name: 'Settings with tabs',
  parameters: about(
    'A settings dialog whose sections are switched by a segmented control, with a body of fixed height so the surface does not change size from one section to the next.',
  ),
  render: () => ({
    props: {
      ...shared,
      tab: signal('general'),
      language: signal('en'),
      tabs: [
        { value: 'general', label: 'General' },
        { value: 'notifications', label: 'Notifications' },
        { value: 'security', label: 'Security' },
      ],
      languages: SELECT_OPTIONS.languages,
    },
    template: `
      <andes-dialog size="lg" footer="default" okText="Save" #dialog (ok)="dialog.hide()">
        <andes-button andesDialogTrigger>
          <ng-icon name="lucideSettings" aria-hidden="true" /> Settings
        </andes-button>

        <andes-dialog-content *andesDialogContent>
          <div andesDialogHeader>
            <h2 andesDialogTitle>Settings</h2>
            <p andesDialogDescription>Choose a section, then change what you need.</p>
          </div>

          <andes-segmented aria-label="Section" block [options]="tabs" [value]="tab()" (valueChange)="tab.set($event ?? 'general')" />

          <div style="display: flex; flex-direction: column; gap: 1rem; min-height: 11rem;">
            @switch (tab()) {
              @case ('general') {
                <andes-form-field label="Display name">
                  <andes-input value="Ada Lovelace" />
                </andes-form-field>
                <andes-form-field label="Language">
                  <andes-select [options]="languages" [value]="language()" (valueChange)="language.set($event)" />
                </andes-form-field>
              }
              @case ('notifications') {
                <andes-switch [checked]="true">Email me when someone mentions me</andes-switch>
                <andes-switch [checked]="true">Email me a weekly summary</andes-switch>
                <andes-switch>Send push notifications</andes-switch>
              }
              @case ('security') {
                <andes-switch [checked]="true">Ask for a code when I sign in on a new device</andes-switch>
                <andes-form-field label="New password" extra="At least 12 characters.">
                  <andes-input type="password" placeholder="New password" />
                </andes-form-field>
              }
            }
          </div>
        </andes-dialog-content>
      </andes-dialog>
    `,
  }),
};

/** Choosing a picture. */
export const ImagePicker: Story = {
  name: 'Image picker',
  parameters: about(
    'A grid of pictures that is really a radio group, so the choice is one tab stop, moves with the arrow keys and is announced, and the dialog keeps OK unavailable until a picture is chosen.',
  ),
  render: () => {
    const result = signal(NOTHING_YET);
    const picked = signal<number | null>(null);
    return {
      props: {
        ...shared,
        result,
        picked,
        covers: [0, 1, 2, 3, 4, 3].map((index, i) => ({
          value: i,
          name: ['Sunrise', 'Meadow', 'Dusk', 'Rose', 'Lagoon', 'Embers'][i],
          src: scene(index, 480, 320),
        })),
        choose() {
          result.set(`Cover ${(picked() ?? 0) + 1} chosen.`);
        },
      },
      template: `
        <andes-dialog
          size="lg"
          footer="default"
          okText="Use this cover"
          [okDisabled]="picked() === null"
          #dialog
          (ok)="choose(); dialog.hide()"
        >
          <andes-button andesDialogTrigger>Choose a cover</andes-button>

          <andes-dialog-content *andesDialogContent>
            <div andesDialogHeader>
              <h2 andesDialogTitle>Choose a cover</h2>
              <p andesDialogDescription>The cover appears at the top of your project.</p>
            </div>

            <andes-radio-group
              aria-label="Cover"
              variant="card"
              [columns]="3"
              [showIndicator]="false"
              [value]="picked()"
              (valueChange)="picked.set($event)"
            >
              @for (cover of covers; track cover.value) {
                <andes-radio [value]="cover.value">
                  <andes-image style="display: block; width: 100%;" [src]="cover.src" [alt]="''" [preview]="false" width="100%" height="4.5rem" loading="eager" />
                  <span [style]="strong">{{ cover.name }}</span>
                </andes-radio>
              }
            </andes-radio-group>
          </andes-dialog-content>
        </andes-dialog>
        ${resultLine}
      `,
    };
  },
};

/** An agreement that has to be read. */
export const TermsDialog: Story = {
  name: 'Terms dialog',
  parameters: about(
    'Accept stays unavailable until the terms have been scrolled to the end, the scrolling region is a labelled stop of the tab order so the keyboard can read it, and a tag says how far the reader is.',
  ),
  render: () => {
    const read = signal(false);
    const result = signal(NOTHING_YET);
    return {
      props: {
        ...shared,
        read,
        result,
        clauses: Array.from({ length: 12 }, (_, i) => i + 1),
        onScroll(event: Event) {
          const element = event.target as HTMLElement;
          if (
            element.scrollTop + element.clientHeight >=
            element.scrollHeight - 4
          ) {
            read.set(true);
          }
        },
      },
      template: `
        <andes-dialog
          footer="default"
          okText="Accept"
          cancelText="Decline"
          [okDisabled]="!read()"
          [closeOnOutsideClick]="false"
          #dialog
          (ok)="result.set('Accepted the terms.'); dialog.hide()"
          (cancelled)="result.set('Declined the terms.')"
          (closed)="read.set(false)"
        >
          <andes-button andesDialogTrigger>Review the terms</andes-button>

          <andes-dialog-content *andesDialogContent [showCloseButton]="false">
            <div andesDialogHeader>
              <h2 andesDialogTitle>Terms of service</h2>
              <p andesDialogDescription>Scroll to the end to accept them.</p>
            </div>

            <div
              tabindex="0"
              role="region"
              aria-label="Terms of service"
              (scroll)="onScroll($event)"
              style="max-height: 11rem; overflow-y: auto; padding: 0.75rem 1rem; border: 1px solid var(--andes-color-border); border-radius: var(--andes-radius-md);"
              [style]="text"
            >
              @for (clause of clauses; track clause) {
                <p style="margin: 0 0 0.75rem;"><strong>{{ clause }}.</strong> The service is provided as is, and either party may end this agreement with thirty days of notice.</p>
              }
            </div>
            <andes-tag [color]="read() ? 'success' : 'warning'">{{ read() ? 'You have read the terms' : 'Keep scrolling' }}</andes-tag>
          </andes-dialog-content>
        </andes-dialog>
        ${resultLine}
      `,
    };
  },
};

/** A task in steps. */
export const MultiStepWizard: Story = {
  name: 'Multi-step wizard',
  parameters: about(
    'A custom footer drives three steps, Back is there from the second one and Next becomes Create on the last, while the title and the tags above the steps say where the reader is.',
  ),
  render: () => {
    const step = signal(1);
    const name = signal('');
    const plan = signal('pro');
    const result = signal(NOTHING_YET);
    return {
      props: {
        ...shared,
        step,
        name,
        plan,
        result,
        steps: ['Project', 'Plan', 'Review'],
        plans: [
          {
            value: 'starter',
            label: 'Starter',
            description: 'Up to 3 members.',
          },
          { value: 'pro', label: 'Pro', description: 'Up to 20 members.' },
          {
            value: 'enterprise',
            label: 'Enterprise',
            description: 'Unlimited members and SSO.',
          },
        ],
      },
      template: `
        <andes-dialog [footer]="footer" (closed)="step.set(1)" #dialog>
          <andes-button andesDialogTrigger>New project</andes-button>

          <andes-dialog-content *andesDialogContent>
            <div andesDialogHeader>
              <h2 andesDialogTitle>New project: step {{ step() }} of 3</h2>
              <p andesDialogDescription>Three short steps, and you can go back at any time.</p>
            </div>

            <div style="display: flex; gap: 0.5rem;">
              @for (label of steps; track label; let i = $index) {
                <andes-tag [color]="step() === i + 1 ? 'primary' : 'default'" [variant]="step() === i + 1 ? 'solid' : 'outlined'">{{ i + 1 }}. {{ label }}</andes-tag>
              }
            </div>

            @switch (step()) {
              @case (1) {
                <andes-form-field label="Project name">
                  <andes-input placeholder="acme-web" [value]="name()" (valueChange)="name.set($event)" />
                </andes-form-field>
              }
              @case (2) {
                <andes-radio-group aria-label="Plan" variant="card" [options]="plans" [value]="plan()" (valueChange)="plan.set($event)" />
              }
              @case (3) {
                <div [style]="stack">
                  <span [style]="text">Name: <strong>{{ name() || 'untitled' }}</strong></span>
                  <span [style]="text">Plan: <strong>{{ plan() }}</strong></span>
                </div>
              }
            }
          </andes-dialog-content>
        </andes-dialog>

        <ng-template #footer let-cancel="cancel">
          @if (step() > 1) {
            <andes-button variant="ghost" style="margin-inline-end: auto" (click)="step.set(step() - 1)">Back</andes-button>
          }
          <andes-button variant="secondary" (click)="cancel()">Cancel</andes-button>
          @if (step() < 3) {
            <andes-button [disabled]="step() === 1 && !name().trim()" (click)="step.set(step() + 1)">Next</andes-button>
          } @else {
            <andes-button (click)="result.set('Created ' + (name() || 'untitled') + ' on the ' + plan() + ' plan.'); dialog.hide()">Create project</andes-button>
          }
        </ng-template>
        ${resultLine}
      `,
    };
  },
};

/** A select inside a dialog. */
export const SelectInADialog: Story = {
  name: 'Select inside a dialog',
  parameters: about(
    'The list of a select opened from inside a dialog is drawn above the dialog, not behind it, with search, a placeholder and a long list that scrolls, and Escape closes the list first and the dialog second.',
  ),
  render: () => ({
    props: {
      ...shared,
      country: signal<string | null>(null),
      role: signal<string | null>('editor'),
      countries: SELECT_OPTIONS.countries,
      roles: SELECT_OPTIONS.roles,
    },
    template: `
      <andes-dialog footer="default" okText="Save" #dialog (ok)="dialog.hide()">
        <andes-button andesDialogTrigger>Shipping address</andes-button>

        <andes-dialog-content *andesDialogContent>
          <div andesDialogHeader>
            <h2 andesDialogTitle>Shipping address</h2>
            <p andesDialogDescription>Open a list: it floats above this dialog.</p>
          </div>

          <andes-form-field label="Country">
            <andes-select
              showSearch
              placeholder="Choose a country"
              [options]="countries"
              [value]="country()"
              (valueChange)="country.set($event)"
            />
          </andes-form-field>
          <andes-form-field label="Contact role">
            <andes-select [options]="roles" [value]="role()" (valueChange)="role.set($event)" />
          </andes-form-field>
        </andes-dialog-content>
      </andes-dialog>
    `,
  }),
};

/** A form taller than the screen. */
export const LongForm: Story = {
  name: 'Long form that scrolls',
  parameters: about(
    'A form taller than the screen scrolls inside the dialog, with the header and the footer pinned so the title and the actions stay in view, and focus keeps moving through the fields as it scrolls.',
  ),
  render: () => ({
    props: {
      ...shared,
      roles: SELECT_OPTIONS.roles,
      countries: SELECT_OPTIONS.countries,
    },
    template: `
      <andes-dialog footer="default" okText="Create account" #dialog (ok)="dialog.hide()">
        <andes-button andesDialogTrigger>Create account</andes-button>

        <andes-dialog-content *andesDialogContent>
          <div andesDialogHeader>
            <h2 andesDialogTitle>Create an account</h2>
            <p andesDialogDescription>Every section is on this page; scroll to see them all.</p>
          </div>

          <form andesForm layout="vertical" style="display: flex; flex-direction: column; gap: 0.25rem;">
            <andes-form-field label="First name"><andes-input placeholder="Ada" /></andes-form-field>
            <andes-form-field label="Last name"><andes-input placeholder="Lovelace" /></andes-form-field>
            <andes-form-field label="Email"><andes-input type="email" placeholder="ada@example.com" /></andes-form-field>
            <andes-form-field label="Phone" extra="With the country code."><andes-input placeholder="+51 999 999 999" /></andes-form-field>
            <andes-form-field label="Country"><andes-select [options]="countries" placeholder="Choose a country" /></andes-form-field>
            <andes-form-field label="Company"><andes-input placeholder="Analytical Engines" /></andes-form-field>
            <andes-form-field label="Role"><andes-select [options]="roles" placeholder="Choose a role" /></andes-form-field>
            <andes-form-field label="About you"><andes-textarea [rows]="3" [maxLength]="200" showCount /></andes-form-field>
            <andes-form-field>
              <andes-checkbox>Send me product news</andes-checkbox>
            </andes-form-field>
            <andes-form-field>
              <andes-switch [checked]="true">Make my profile public</andes-switch>
            </andes-form-field>
          </form>
        </andes-dialog-content>
      </andes-dialog>
    `,
  }),
};

/** A picture and what can be done with it. */
export const MediaPreview: Story = {
  name: 'Media preview',
  parameters: about(
    'A large dialog around a picture, with its author, tags and icon buttons that carry a tooltip and an accessible name, the preview of a file in a library before it is downloaded or shared.',
  ),
  render: () => {
    const result = signal(NOTHING_YET);
    return {
      props: { ...shared, result, picture: scene(0, 1200, 720) },
      template: `
        <andes-dialog size="xl">
          <andes-button andesDialogTrigger variant="secondary">
            <ng-icon name="lucideImage" aria-hidden="true" /> Preview file
          </andes-button>

          <andes-dialog-content *andesDialogContent>
            <div andesDialogHeader>
              <h2 andesDialogTitle>sunrise-over-the-valley.png</h2>
              <p andesDialogDescription>1200 by 720 pixels, uploaded 12 days ago.</p>
            </div>

            <andes-image [src]="picture" alt="A sunrise over three ridges of hills" width="100%" height="15rem" loading="eager" [preview]="false" />

            <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 0.75rem;">
              <andes-avatar><andes-avatar-fallback>LM</andes-avatar-fallback></andes-avatar>
              <span [style]="strong">Lucía Mendoza</span>
              <andes-tag>landscape</andes-tag>
              <andes-tag>morning</andes-tag>
              <andes-tag color="success">approved</andes-tag>
              <span style="display: inline-flex; gap: 0.25rem; margin-inline-start: auto;">
                <andes-tooltip content="Copy the link" side="top">
                  <andes-button andesTooltipTrigger variant="ghost" size="icon" aria-label="Copy the link" (click)="result.set('Link copied.')">
                    <ng-icon name="lucideCopy" aria-hidden="true" />
                  </andes-button>
                </andes-tooltip>
                <andes-tooltip content="Delete the file" side="top">
                  <andes-button andesTooltipTrigger variant="ghost" size="icon" aria-label="Delete the file" (click)="result.set('File deleted.')">
                    <ng-icon name="lucideTrash2" aria-hidden="true" />
                  </andes-button>
                </andes-tooltip>
              </span>
            </div>

            <div andesDialogFooter>
              <andes-button variant="secondary" andesDialogClose>Close</andes-button>
              <andes-button andesDialogClose (click)="result.set('Downloading.')">
                <ng-icon name="lucideDownload" aria-hidden="true" /> Download
              </andes-button>
            </div>
          </andes-dialog-content>
        </andes-dialog>
        ${resultLine}
      `,
    };
  },
};

/** Inviting several people at once. */
export const InviteMembers: Story = {
  name: 'Invite members',
  parameters: about(
    'Addresses are typed and added with Enter or Add, each becomes a tag that can be removed, and Invite stays unavailable until there is at least one, with the count in its label.',
  ),
  render: () => {
    const emails = signal<string[]>(['maria@acme.dev']);
    const draft = signal('');
    const role = signal('editor');
    const result = signal(NOTHING_YET);
    const add = () => {
      const email = draft().trim();
      if (email && !emails().includes(email)) {
        emails.update((list) => [...list, email]);
      }
      draft.set('');
    };
    return {
      props: {
        ...shared,
        emails,
        draft,
        role,
        result,
        roles: SELECT_OPTIONS.roles,
        add,
        remove: (email: string) =>
          emails.update((list) => list.filter((item) => item !== email)),
        invite: () =>
          result.set(`Invited ${emails().length} people as ${role()}.`),
        reset: () => {
          emails.set([]);
          draft.set('');
        },
      },
      template: `
        <andes-dialog
          footer="default"
          [okText]="'Invite ' + emails().length + (emails().length === 1 ? ' person' : ' people')"
          [okDisabled]="emails().length === 0"
          #dialog
          (ok)="invite(); dialog.hide()"
        >
          <andes-button andesDialogTrigger>
            <ng-icon name="lucideUserPlus" aria-hidden="true" /> Invite members
          </andes-button>

          <andes-dialog-content *andesDialogContent>
            <div andesDialogHeader>
              <h2 andesDialogTitle>Invite members</h2>
              <p andesDialogDescription>They get an email with a link to join the workspace.</p>
            </div>

            <div style="display: flex; gap: 0.5rem;">
              <andes-input
                style="flex: 1;"
                type="email"
                placeholder="name@company.com"
                aria-label="Email address"
                [value]="draft()"
                (valueChange)="draft.set($event)"
                (pressEnter)="add()"
              />
              <andes-button variant="secondary" (click)="add()">Add</andes-button>
            </div>

            <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; min-height: 1.75rem;">
              @for (email of emails(); track email) {
                <andes-tag closable (closed)="remove(email)">{{ email }}</andes-tag>
              } @empty {
                <span [style]="muted">No one added yet.</span>
              }
            </div>

            <andes-form-field label="Role for all of them">
              <andes-select [options]="roles" [value]="role()" (valueChange)="role.set($event)" />
            </andes-form-field>
          </andes-dialog-content>
        </andes-dialog>
        ${resultLine}
      `,
    };
  },
};

/** The keyboard shortcuts of an application. */
export const KeyboardShortcuts: Story = {
  name: 'Keyboard shortcuts',
  parameters: about(
    'A cheat sheet that opens from a shortcut button, with every key drawn as a tag, grouped by what it does and filtered as you type in the search field.',
  ),
  render: () => {
    const query = signal('');
    const groups = [
      {
        title: 'Navigation',
        items: [
          { label: 'Open the command palette', keys: ['Ctrl', 'K'] },
          { label: 'Go to the dashboard', keys: ['G', 'D'] },
          { label: 'Go to the inbox', keys: ['G', 'I'] },
        ],
      },
      {
        title: 'Editing',
        items: [
          { label: 'Save', keys: ['Ctrl', 'S'] },
          { label: 'Undo', keys: ['Ctrl', 'Z'] },
          { label: 'Redo', keys: ['Ctrl', 'Shift', 'Z'] },
          { label: 'Duplicate the selection', keys: ['Ctrl', 'D'] },
        ],
      },
      {
        title: 'Help',
        items: [
          { label: 'Show this cheat sheet', keys: ['?'] },
          { label: 'Close any dialog', keys: ['Esc'] },
        ],
      },
    ];
    return {
      props: {
        ...shared,
        query,
        visible: () =>
          groups
            .map((group) => ({
              title: group.title,
              items: group.items.filter((item) =>
                item.label.toLowerCase().includes(query().trim().toLowerCase()),
              ),
            }))
            .filter((group) => group.items.length > 0),
      },
      template: `
        <andes-dialog size="lg" (closed)="query.set('')">
          <andes-button andesDialogTrigger variant="secondary">
            <ng-icon name="lucideKeyboard" aria-hidden="true" /> Keyboard shortcuts
          </andes-button>

          <andes-dialog-content *andesDialogContent>
            <div andesDialogHeader>
              <h2 andesDialogTitle>Keyboard shortcuts</h2>
              <p andesDialogDescription>Type to filter the list.</p>
            </div>

            <andes-input aria-label="Filter shortcuts" placeholder="Filter shortcuts" clearable [value]="query()" (valueChange)="query.set($event)" />

            @for (group of visible(); track group.title) {
              <div [style]="stack">
                <span [style]="caption">{{ group.title }}</span>
                @for (item of group.items; track item.label) {
                  <div style="display: flex; align-items: center; justify-content: space-between; gap: 1rem;">
                    <span [style]="text">{{ item.label }}</span>
                    <span style="display: inline-flex; gap: 0.25rem;">
                      @for (key of item.keys; track key) {
                        <andes-tag variant="filled">{{ key }}</andes-tag>
                      }
                    </span>
                  </div>
                }
              </div>
            } @empty {
              <span [style]="muted">No shortcut matches that.</span>
            }

            <div andesDialogFooter>
              <andes-button andesDialogClose>Close</andes-button>
            </div>
          </andes-dialog-content>
        </andes-dialog>
      `,
    };
  },
};
