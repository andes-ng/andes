import { signal } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular';

import {
  about,
  shared,
  withDescription,
  withDialogKit,
} from '../../testing/dialog-story-kit';
import type { AndesDialog } from './dialog';

/*
 * What the dialog does for people who navigate by keyboard, who use a screen reader, who ask
 * for less motion, who use the dark theme, who read right to left or who hold a phone.
 */

const meta: Meta<AndesDialog> = {
  title: 'Feedback/Dialog/Accessibility and motion',
  decorators: [withDescription, withDialogKit],
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<AndesDialog>;

/** A form that is the same in every story below. */
const profileDialog = `
  <andes-dialog footer="default" okText="Save changes" #dialog (ok)="dialog.hide()">
    <andes-button andesDialogTrigger>Edit profile</andes-button>

    <andes-dialog-content *andesDialogContent>
      <div andesDialogHeader>
        <h2 andesDialogTitle>Edit profile</h2>
        <p andesDialogDescription>
          Make changes to your profile here. Save when you are done.
        </p>
      </div>

      <andes-form-field label="Full name">
        <andes-input value="Ada Lovelace" />
      </andes-form-field>
      <andes-form-field label="Email">
        <andes-input type="email" value="ada@example.com" />
      </andes-form-field>
      <andes-switch [checked]="true">Email me about activity</andes-switch>
    </andes-dialog-content>
  </andes-dialog>
`;

/** Tab stays inside. */
export const FocusTrapAndReturn: Story = {
  name: 'Focus trap and return',
  parameters: about(
    'Focus moves into the dialog when it opens, Tab and Shift+Tab cycle through its controls without leaving it, the page behind is inert, and closing returns focus to the trigger, with a readout of the control that holds it.',
  ),
  render: () => {
    const focused = signal('-');
    return {
      props: {
        ...shared,
        focused,
        onFocus(event: FocusEvent) {
          const element = event.target as HTMLElement;
          focused.set(
            element.getAttribute('aria-label') ||
              element.textContent?.trim() ||
              element.tagName.toLowerCase(),
          );
        },
      },
      template: `
        <andes-dialog>
          <andes-button andesDialogTrigger>Open</andes-button>

          <andes-dialog-content *andesDialogContent (focusin)="onFocus($event)">
            <div andesDialogHeader>
              <h2 andesDialogTitle>Invite a teammate</h2>
              <p andesDialogDescription>Press Tab until you have been round the whole dialog.</p>
            </div>

            <andes-input aria-label="Email address" placeholder="Email address" />
            <andes-checkbox>Send a welcome message</andes-checkbox>
            <span [style]="muted">Focus is on: <strong [style]="strong">{{ focused() }}</strong></span>

            <div andesDialogFooter>
              <andes-button variant="secondary" andesDialogClose>Cancel</andes-button>
              <andes-button andesDialogClose>Send invitation</andes-button>
            </div>
          </andes-dialog-content>
        </andes-dialog>
      `,
    };
  },
};

/** The name and the description. */
export const LabelledAndDescribed: Story = {
  name: 'Labelled and described',
  parameters: about(
    'The surface is a dialog whose accessible name is its title and whose description is the text under it, joined with aria-labelledby and aria-describedby by the title and description parts, which the readout resolves once the dialog is open.',
  ),
  render: () => {
    const info = signal('Open the dialog to read its attributes.');
    return {
      props: {
        ...shared,
        info,
        read() {
          const surface =
            document.querySelector<HTMLElement>('[role="dialog"]');
          const text = (attribute: string) => {
            const id = surface?.getAttribute(attribute);
            return id
              ? (document.getElementById(id)?.textContent?.trim() ?? '')
              : '';
          };
          info.set(
            `role dialog, aria-modal ${surface?.getAttribute('aria-modal')}, name “${text('aria-labelledby')}”, description “${text('aria-describedby')}”`,
          );
        },
      },
      template: `
        <andes-dialog (afterOpenChange)="$event && read()">
          <andes-button andesDialogTrigger>Open</andes-button>

          <andes-dialog-content *andesDialogContent>
            <div andesDialogHeader>
              <h2 andesDialogTitle>Delete the draft</h2>
              <p andesDialogDescription>It will be removed from every device you use.</p>
            </div>

            <div andesDialogFooter>
              <andes-button variant="secondary" andesDialogClose>Keep it</andes-button>
              <andes-button variant="danger" andesDialogClose>Delete</andes-button>
            </div>
          </andes-dialog-content>
        </andes-dialog>
        <p [style]="muted" style="max-width: 36rem;">{{ info() }}</p>
      `,
    };
  },
};

/** Less movement. */
export const ReducedMotion: Story = {
  name: 'Reduced motion',
  parameters: about(
    'When the operating system asks for less motion (prefers-reduced-motion: reduce) the zoom and fade of the surface and the fade of the mask are switched off and the dialog appears and goes away at once, so turn the setting on, or emulate it in the browser tools, and open it.',
  ),
  render: () => ({
    props: { ...shared },
    template: profileDialog,
  }),
};

/** The dark theme. */
export const DarkMode: Story = {
  name: 'Dark mode',
  parameters: about(
    'In the dark theme the surface is lighter than the scrim and carries a one-pixel border, which is what separates it from the page, and the form controls inside keep their own dark look.',
  ),
  globals: { theme: 'dark' },
  render: () => ({
    props: { ...shared },
    template: profileDialog,
  }),
};

/** A right-to-left document. */
export const RightToLeft: Story = {
  name: 'Right to left',
  parameters: {
    dir: 'rtl',
    ...about(
      'In a right-to-left document the layout mirrors: the close button sits at the left corner, the title reads from the right and the footer puts its primary action at the left.',
    ),
  },
  render: () => ({
    props: { ...shared },
    template: profileDialog,
  }),
};

/** A phone. */
export const NarrowScreen: Story = {
  name: 'Narrow screen',
  parameters: {
    viewport: {
      options: {
        phone375: {
          name: 'Phone, 375px',
          styles: { width: '375px', height: '667px' },
          type: 'mobile',
        },
      },
    },
    ...about(
      'On a 375px screen the surface keeps a 16px gutter on each side, the footer buttons stay reachable and a body taller than the screen scrolls inside the dialog, which the viewport of this story already is.',
    ),
  },
  globals: { viewport: { value: 'phone375', isRotated: false } },
  render: () => ({
    props: { ...shared, sections: [1, 2, 3, 4, 5, 6, 7, 8] },
    template: `
      <andes-dialog footer="default" okText="Save changes" #dialog (ok)="dialog.hide()">
        <andes-button andesDialogTrigger>Edit profile</andes-button>

        <andes-dialog-content *andesDialogContent>
          <div andesDialogHeader>
            <h2 andesDialogTitle>Edit profile</h2>
            <p andesDialogDescription>
              Make changes to your profile here. Save when you are done.
            </p>
          </div>

          <andes-form-field label="Full name">
            <andes-input value="Ada Lovelace" />
          </andes-form-field>
          @for (section of sections; track section) {
            <andes-form-field [label]="'Field ' + section">
              <andes-input placeholder="Type here" />
            </andes-form-field>
          }
        </andes-dialog-content>
      </andes-dialog>
    `,
  }),
};
