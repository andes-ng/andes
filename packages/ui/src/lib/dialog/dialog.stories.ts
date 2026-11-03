import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCircleX } from '@ng-icons/lucide';
import type { Meta, StoryObj } from '@storybook/angular';

import { AndesButton } from '../button/button';
import { AndesInput } from '../input/input';
import { ANDES_DIALOG_IMPORTS, AndesDialog } from './dialog';

/**
 * Every button in these stories is an `AndesButton`, the trigger included:
 * `andesDialogTrigger` sits on the `<andes-button>` and moves the ARIA state to the real
 * button inside it.
 */
const FIELD_STYLES = `
  <style>
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
    moduleMetadata: {
      imports: [ANDES_DIALOG_IMPORTS, AndesButton, AndesInput],
    },
    props: args,
    template: `
      ${FIELD_STYLES}
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
        <andes-button andesDialogTrigger>Edit profile</andes-button>

        <andes-dialog-content *andesDialogContent>
          <div andesDialogHeader>
            <h2 andesDialogTitle>Edit profile</h2>
            <p andesDialogDescription>
              Make changes to your profile here. Click save when you are done.
            </p>
          </div>

          <label class="sb-field">
            Name
            <andes-input value="Ada Lovelace" />
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
      ${FIELD_STYLES}
      <div style="display: flex; flex-wrap: wrap; gap: var(--andes-space-2);">
        @for (size of sizes; track size) {
          <andes-dialog [size]="size">
            <andes-button andesDialogTrigger>Size {{ size }}</andes-button>

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
    moduleMetadata: {
      imports: [ANDES_DIALOG_IMPORTS, AndesButton, NgIcon],
      providers: [provideIcons({ lucideCircleX })],
    },
    template: `
      ${FIELD_STYLES}
      <div style="display: flex; flex-wrap: wrap; gap: var(--andes-space-2);">
        <andes-dialog>
          <andes-button andesDialogTrigger>Without close button</andes-button>

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
          <andes-button andesDialogTrigger>Not dismissible</andes-button>

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
          <andes-button andesDialogTrigger>Custom close icon</andes-button>

          <andes-dialog-content *andesDialogContent [closeIcon]="icon" closeLabel="Dismiss">
            <div andesDialogHeader>
              <h2 andesDialogTitle>Custom close icon</h2>
              <p andesDialogDescription>The glyph is yours; the button is still the component's.</p>
            </div>
          </andes-dialog-content>
        </andes-dialog>
      </div>

      <ng-template #icon>
        <ng-icon name="lucideCircleX" size="1rem" aria-hidden="true" />
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
      ${FIELD_STYLES}
      <div style="display: flex; flex-wrap: wrap; gap: var(--andes-space-2);">
        <andes-dialog [maskBlur]="true">
          <andes-button andesDialogTrigger>Blurred mask</andes-button>

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
          <andes-button andesDialogTrigger>No mask</andes-button>

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
      ${FIELD_STYLES}
      <andes-dialog>
        <andes-button andesDialogTrigger>Release notes</andes-button>

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
 * `maximizable` adds a control beside the "x" that fills the viewport edge to edge, and
 * `[(fullscreen)]` keeps it in sync with the page (or opens the dialog maximized).
 */
export const Maximizable: Story = {
  render: () => ({
    moduleMetadata: { imports: [ANDES_DIALOG_IMPORTS, AndesButton] },
    props: { paragraphs: Array.from({ length: 6 }, (_, i) => i + 1) },
    template: `
      ${FIELD_STYLES}
      <andes-dialog [maximizable]="true" #dialog>
        <andes-button andesDialogTrigger>Open document</andes-button>

        <andes-dialog-content *andesDialogContent>
          <div andesDialogHeader>
            <h2 andesDialogTitle>Quarterly report</h2>
            <p andesDialogDescription>Maximize it to read at full size.</p>
          </div>

          @for (paragraph of paragraphs; track paragraph) {
            <p style="margin: 0; font-size: 0.875rem;">
              Section {{ paragraph }} - the surface grows to the whole viewport.
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
    moduleMetadata: { imports: [ANDES_DIALOG_IMPORTS, AndesButton] },
    props: { width: { xs: '100%', md: '80%', lg: 720, xl: 960 } },
    template: `
      ${FIELD_STYLES}
      <andes-dialog [centered]="false" [width]="width" footer="default" okText="Done" [showCancel]="false" #dialog (ok)="dialog.hide()">
        <andes-button andesDialogTrigger>Open wide dialog</andes-button>

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
