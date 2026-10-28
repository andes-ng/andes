import type { Meta, StoryObj } from '@storybook/angular';

import { AndesButton } from '../button/button';
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
    /* The library has no Input component yet, so this demo field is a native input styled
       as one: a single focus indicator (primary border plus a soft 2px ring), never an
       outline drawn around the border as a second frame. */
    .sb-field input {
      box-sizing: border-box;
      height: 2rem;
      padding: 0 0.6875rem;
      border: 1px solid var(--andes-color-input);
      border-radius: var(--andes-radius-md);
      background-color: var(--andes-color-background);
      color: var(--andes-color-foreground);
      font: inherit;
      line-height: 1.375rem;
      outline: none;
      transition: border-color 0.15s ease, box-shadow 0.15s ease, background-color 0.15s ease;
    }
    .sb-field input::placeholder { color: var(--andes-color-muted-foreground); }
    .sb-field input:hover {
      border-color: color-mix(in srgb, var(--andes-color-primary) 65%, var(--andes-color-input));
    }
    .sb-field input:focus {
      border-color: var(--andes-color-primary);
      box-shadow: 0 0 0 2px color-mix(in srgb, var(--andes-color-primary) 20%, transparent);
      outline: none;
    }
  </style>
`;

const meta: Meta<AndesDialog> = {
  title: 'Feedback/Dialog/Basics',
  component: AndesDialog,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: ['sm', 'md', 'lg', 'xl'] },
    closeOnEscape: { control: 'boolean' },
    closeOnOutsideClick: { control: 'boolean' },
    lockScroll: { control: 'boolean' },
    centered: { control: 'boolean' },
    mask: { control: 'boolean' },
    maskBlur: { control: 'boolean' },
    loading: { control: 'boolean' },
    restoreFocus: { control: 'boolean' },
    trapFocus: { control: 'boolean' },
  },
  args: {
    size: 'md',
    closeOnEscape: true,
    closeOnOutsideClick: true,
    lockScroll: true,
    centered: true,
    mask: true,
    maskBlur: false,
    loading: false,
    restoreFocus: true,
    trapFocus: true,
  },
  render: (args) => ({
    moduleMetadata: { imports: [ANDES_DIALOG_IMPORTS, AndesButton] },
    props: args,
    template: `
      ${TRIGGER_STYLES}
      <andes-dialog
        [size]="size"
        [closeOnEscape]="closeOnEscape"
        [closeOnOutsideClick]="closeOnOutsideClick"
        [lockScroll]="lockScroll"
        [centered]="centered"
        [mask]="mask"
        [maskBlur]="maskBlur"
        [loading]="loading"
        [restoreFocus]="restoreFocus"
        [trapFocus]="trapFocus"
      >
        <button type="button" class="sb-dialog-trigger" andesDialogTrigger>Edit profile</button>

        <andes-dialog-content *andesDialogContent>
          <div andesDialogHeader>
            <h2 andesDialogTitle>Edit profile</h2>
            <p andesDialogDescription>
              Make changes to your profile here. Click save when you are done.
            </p>
          </div>

          <label class="sb-field">
            Name
            <input value="Ada Lovelace" />
          </label>

          <div andesDialogFooter>
            <andes-button variant="secondary" andesDialogClose>Cancel</andes-button>
            <andes-button variant="primary" andesDialogClose>Save changes</andes-button>
          </div>
        </andes-dialog-content>
      </andes-dialog>
    `,
  }),
};

export default meta;

type Story = StoryObj<AndesDialog>;

/** The playground: use the controls to try every dialog input on one dialog. */
export const Default: Story = {};

/**
 * `size` is `sm`, `md` (the default), `lg` or `xl`. Each trigger opens the same dialog at a
 * different size.
 */
export const Sizes: Story = {
  render: () => ({
    moduleMetadata: { imports: [ANDES_DIALOG_IMPORTS, AndesButton] },
    props: { sizes: ['sm', 'md', 'lg', 'xl'] },
    template: `
      ${TRIGGER_STYLES}
      <div style="display: flex; flex-wrap: wrap; gap: var(--andes-space-2);">
        @for (size of sizes; track size) {
          <andes-dialog [size]="size">
            <button type="button" class="sb-dialog-trigger" andesDialogTrigger>Size {{ size }}</button>

            <andes-dialog-content *andesDialogContent>
              <div andesDialogHeader>
                <h2 andesDialogTitle>Size {{ size }}</h2>
                <p andesDialogDescription>
                  Make changes to your profile here. Click save when you are done.
                </p>
              </div>

              <div andesDialogFooter>
                <andes-button variant="secondary" andesDialogClose>Cancel</andes-button>
                <andes-button variant="primary" andesDialogClose>Save changes</andes-button>
              </div>
            </andes-dialog-content>
          </andes-dialog>
        }
      </div>
    `,
  }),
};

/**
 * Ways a dialog can be answered or refused. `[showCloseButton]="false"` drops the built-in "x",
 * for a dialog that must be answered. `closeOnEscape` and `closeOnOutsideClick` set to false
 * leave only the dialog's own actions. `closeIcon` swaps the glyph (and `closeLabel` renames
 * the button); the button, its label and hit area stay the component's.
 */
export const Dismissal: Story = {
  render: () => ({
    moduleMetadata: { imports: [ANDES_DIALOG_IMPORTS, AndesButton] },
    template: `
      ${TRIGGER_STYLES}
      <div style="display: flex; flex-wrap: wrap; gap: var(--andes-space-2);">
        <andes-dialog>
          <button type="button" class="sb-dialog-trigger" andesDialogTrigger>Without close button</button>

          <andes-dialog-content *andesDialogContent [showCloseButton]="false">
            <div andesDialogHeader>
              <h2 andesDialogTitle>Terms of service</h2>
              <p andesDialogDescription>Please accept the terms to continue.</p>
            </div>

            <div andesDialogFooter>
              <andes-button variant="secondary" andesDialogClose>Decline</andes-button>
              <andes-button variant="primary" andesDialogClose>Accept</andes-button>
            </div>
          </andes-dialog-content>
        </andes-dialog>

        <andes-dialog [closeOnEscape]="false" [closeOnOutsideClick]="false">
          <button type="button" class="sb-dialog-trigger" andesDialogTrigger>Not dismissible</button>

          <andes-dialog-content *andesDialogContent>
            <div andesDialogHeader>
              <h2 andesDialogTitle>Not dismissible</h2>
              <p andesDialogDescription>
                Neither Escape nor an outside click dismisses this one - only its own actions do.
              </p>
            </div>

            <div andesDialogFooter>
              <andes-button variant="primary" andesDialogClose>Done</andes-button>
            </div>
          </andes-dialog-content>
        </andes-dialog>

        <andes-dialog>
          <button type="button" class="sb-dialog-trigger" andesDialogTrigger>Custom close icon</button>

          <andes-dialog-content *andesDialogContent [closeIcon]="icon" closeLabel="Dismiss">
            <div andesDialogHeader>
              <h2 andesDialogTitle>Custom close icon</h2>
              <p andesDialogDescription>The glyph is yours; the button is still the component's.</p>
            </div>
          </andes-dialog-content>
        </andes-dialog>
      </div>

      <ng-template #icon>
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" style="fill: none; stroke: currentcolor; stroke-width: 2; stroke-linecap: round;">
          <circle cx="12" cy="12" r="9" />
          <path d="M9 9l6 6M15 9l-6 6" />
        </svg>
      </ng-template>
    `,
  }),
};

/**
 * The scrim. The default mask dims the page; `maskBlur` frosts it as well; `[mask]="false"`
 * drops it altogether. In every case the dialog keeps its focus trap and scroll lock.
 */
export const Mask: Story = {
  render: () => ({
    moduleMetadata: { imports: [ANDES_DIALOG_IMPORTS, AndesButton] },
    template: `
      ${TRIGGER_STYLES}
      <div style="display: flex; flex-wrap: wrap; gap: var(--andes-space-2);">
        <andes-dialog [maskBlur]="true">
          <button type="button" class="sb-dialog-trigger" andesDialogTrigger>Blurred mask</button>

          <andes-dialog-content *andesDialogContent>
            <div andesDialogHeader>
              <h2 andesDialogTitle>Blurred mask</h2>
              <p andesDialogDescription>The page behind the scrim is frosted as well as dimmed.</p>
            </div>

            <div andesDialogFooter>
              <andes-button variant="primary" andesDialogClose>Done</andes-button>
            </div>
          </andes-dialog-content>
        </andes-dialog>

        <andes-dialog [mask]="false">
          <button type="button" class="sb-dialog-trigger" andesDialogTrigger>No mask</button>

          <andes-dialog-content *andesDialogContent>
            <div andesDialogHeader>
              <h2 andesDialogTitle>Without a mask</h2>
              <p andesDialogDescription>
                <code>[mask]="false"</code> drops the scrim; focus stays trapped and scroll stays locked.
              </p>
            </div>

            <div andesDialogFooter>
              <andes-button variant="primary" andesDialogClose>Done</andes-button>
            </div>
          </andes-dialog-content>
        </andes-dialog>
      </div>
    `,
  }),
};

/** A long body scrolls inside the surface while the page behind stays locked. */
export const ScrollingContent: Story = {
  render: (args) => ({
    moduleMetadata: { imports: [ANDES_DIALOG_IMPORTS, AndesButton] },
    props: { ...args, paragraphs: Array.from({ length: 14 }, (_, i) => i + 1) },
    template: `
      ${TRIGGER_STYLES}
      <andes-dialog>
        <button type="button" class="sb-dialog-trigger" andesDialogTrigger>Release notes</button>

        <andes-dialog-content *andesDialogContent>
          <div andesDialogHeader>
            <h2 andesDialogTitle>Release notes</h2>
            <p andesDialogDescription>Everything that changed in this version.</p>
          </div>

          @for (paragraph of paragraphs; track paragraph) {
            <p style="margin: 0; font-size: 0.875rem;">
              Section {{ paragraph }} - the surface scrolls, the page behind it does not.
            </p>
          }

          <div andesDialogFooter>
            <andes-button variant="primary" andesDialogClose>Close</andes-button>
          </div>
        </andes-dialog-content>
      </andes-dialog>
    `,
  }),
};

/**
 * `[centered]="false"` parks the dialog near the top so the surface
 * does not jump as its content grows. `width` takes px, any CSS length or a
 * per-breakpoint map - resize the viewport to watch this one step.
 */
export const TopAlignedResponsiveWidth: Story = {
  render: () => ({
    moduleMetadata: { imports: [ANDES_DIALOG_IMPORTS] },
    props: { width: { xs: '100%', md: '80%', lg: 720, xl: 960 } },
    template: `
      ${TRIGGER_STYLES}
      <andes-dialog [centered]="false" [width]="width" footer="default" okText="Done" [showCancel]="false" #dialog (ok)="dialog.hide()">
        <button type="button" class="sb-dialog-trigger" andesDialogTrigger>Open wide dialog</button>

        <andes-dialog-content *andesDialogContent>
          <div andesDialogHeader>
            <h2 andesDialogTitle>Responsive width</h2>
            <p andesDialogDescription>
              100% below 768px, 80% up to 992px, 720px up to 1200px, 960px beyond.
            </p>
          </div>
        </andes-dialog-content>
      </andes-dialog>
    `,
  }),
};
