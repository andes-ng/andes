import { signal } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular';

import {
  about,
  shared,
  withDescription,
  withDialogKit,
} from '../../testing/dialog-story-kit';
import type { AndesAlertDialog } from './alert-dialog';

/*
 * What the alert dialog does for people who navigate by keyboard, who use a screen reader, who
 * ask for less motion, who use the dark theme and who read right to left.
 */

const meta: Meta<AndesAlertDialog> = {
  title: 'Feedback/Alert Dialog/Accessibility and motion',
  decorators: [withDescription, withDialogKit],
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<AndesAlertDialog>;

/** A danger question with a guard, the same in the last three stories. */
const guardedDialog = `
  <andes-alert-dialog tone="danger" initialFocus="input">
    <andes-button variant="danger" andesAlertDialogTrigger>Delete project</andes-button>

    <andes-alert-dialog-content *andesAlertDialogContent>
      <div andesAlertDialogHeader>
        <andes-alert-dialog-icon />
        <h2 andesAlertDialogTitle>Delete project acme-web?</h2>
        <p andesAlertDialogDescription>
          This permanently removes the project and its deployments. This action cannot be undone.
        </p>
      </div>

      <andes-alert-dialog-confirm-phrase phrase="acme-web" />

      <div andesAlertDialogFooter>
        <andes-button variant="secondary" andesAlertDialogCancel>Cancel</andes-button>
        <andes-button variant="danger" andesAlertDialogAction>Delete project</andes-button>
      </div>
    </andes-alert-dialog-content>
  </andes-alert-dialog>
`;

/** The role. */
export const AlertDialogRole: Story = {
  name: 'The alertdialog role',
  parameters: about(
    'The surface has the role alertdialog and is modal, which tells a screen reader that the user has to answer before going on, and it is named by its title and described by its text, which the readout resolves once the dialog is open.',
  ),
  render: () => {
    const info = signal('Open the dialog to read its attributes.');
    return {
      props: {
        ...shared,
        info,
        read() {
          const surface = document.querySelector<HTMLElement>(
            '[role="alertdialog"]',
          );
          const text = (attribute: string) => {
            const id = surface?.getAttribute(attribute);
            return id
              ? (document.getElementById(id)?.textContent?.trim() ?? '')
              : '';
          };
          info.set(
            `role ${surface?.getAttribute('role')}, aria-modal ${surface?.getAttribute('aria-modal')}, name “${text('aria-labelledby')}”, description “${text('aria-describedby')}”`,
          );
        },
      },
      template: `
        <andes-alert-dialog tone="warning" (afterOpenChange)="$event && read()">
          <andes-button andesAlertDialogTrigger>Open</andes-button>

          <andes-alert-dialog-content *andesAlertDialogContent>
            <div andesAlertDialogHeader>
              <andes-alert-dialog-icon />
              <h2 andesAlertDialogTitle>Leave without saving?</h2>
              <p andesAlertDialogDescription>Your changes will be lost.</p>
            </div>

            <div andesAlertDialogFooter>
              <andes-button variant="secondary" andesAlertDialogCancel>Stay</andes-button>
              <andes-button andesAlertDialogAction>Leave</andes-button>
            </div>
          </andes-alert-dialog-content>
        </andes-alert-dialog>
        <p [style]="muted" style="max-width: 36rem;">{{ info() }}</p>
      `,
    };
  },
};

/** Where focus starts. */
export const InitialFocus: Story = {
  name: 'Initial focus',
  parameters: about(
    'Focus lands on the safe choice by default, initialFocus moves it to Cancel, to the action or to the phrase field, and a keyboard user who opens the dialog with Enter cannot confirm it by accident.',
  ),
  render: () => ({
    props: { ...shared },
    template: `
      <div [style]="row">
        <andes-alert-dialog initialFocus="cancel">
          <andes-button variant="secondary" andesAlertDialogTrigger>Focus on Cancel</andes-button>
          <andes-alert-dialog-content *andesAlertDialogContent>
            <div andesAlertDialogHeader>
              <h2 andesAlertDialogTitle>Empty the trash?</h2>
              <p andesAlertDialogDescription>The 86 items in the trash are deleted forever.</p>
            </div>
            <div andesAlertDialogFooter>
              <andes-button variant="secondary" andesAlertDialogCancel>Cancel</andes-button>
              <andes-button variant="danger" andesAlertDialogAction>Empty trash</andes-button>
            </div>
          </andes-alert-dialog-content>
        </andes-alert-dialog>

        <andes-alert-dialog initialFocus="action">
          <andes-button variant="secondary" andesAlertDialogTrigger>Focus on the action</andes-button>
          <andes-alert-dialog-content *andesAlertDialogContent>
            <div andesAlertDialogHeader>
              <h2 andesAlertDialogTitle>Save changes?</h2>
              <p andesAlertDialogDescription>Saving loses nothing, so it takes the focus.</p>
            </div>
            <div andesAlertDialogFooter>
              <andes-button variant="secondary" andesAlertDialogCancel>Cancel</andes-button>
              <andes-button andesAlertDialogAction>Save</andes-button>
            </div>
          </andes-alert-dialog-content>
        </andes-alert-dialog>

        <andes-alert-dialog initialFocus="input">
          <andes-button variant="secondary" andesAlertDialogTrigger>Focus on the phrase</andes-button>
          <andes-alert-dialog-content *andesAlertDialogContent>
            <div andesAlertDialogHeader>
              <h2 andesAlertDialogTitle>Delete project acme-web?</h2>
              <p andesAlertDialogDescription>Type the name, and the action unlocks.</p>
            </div>
            <andes-alert-dialog-confirm-phrase phrase="acme-web" />
            <div andesAlertDialogFooter>
              <andes-button variant="secondary" andesAlertDialogCancel>Cancel</andes-button>
              <andes-button variant="danger" andesAlertDialogAction>Delete project</andes-button>
            </div>
          </andes-alert-dialog-content>
        </andes-alert-dialog>
      </div>
    `,
  }),
};

/** What a screen reader hears. */
export const Announcements: Story = {
  name: 'Announcements',
  parameters: about(
    'Messages that appear while the dialog is open, a countdown starting and ending, a phrase that does not match, an action pressed too early and a failure, are spoken through a polite live region, and the panel under the dialog mirrors what that region says.',
  ),
  render: () => {
    const announced = signal('Nothing announced yet.');
    let observer: MutationObserver | undefined;
    const stop = () => {
      observer?.disconnect();
      observer = undefined;
    };
    return {
      props: {
        ...shared,
        announced,
        watch() {
          stop();
          const region = document.querySelector<HTMLElement>(
            '[data-slot="alert-dialog-live"]',
          );
          if (!region) {
            return;
          }
          observer = new MutationObserver(() => {
            const text = region.textContent?.trim();
            if (text) {
              announced.set(text);
            }
          });
          observer.observe(region, {
            childList: true,
            characterData: true,
            subtree: true,
          });
        },
        stop,
      },
      template: `
        <andes-alert-dialog tone="danger" (opened)="watch()" (closed)="stop()">
          <andes-button variant="danger" andesAlertDialogTrigger>Drop the database</andes-button>

          <andes-alert-dialog-content *andesAlertDialogContent>
            <div andesAlertDialogHeader>
              <andes-alert-dialog-icon />
              <h2 andesAlertDialogTitle>Drop the production database?</h2>
              <p andesAlertDialogDescription>All tables in orders-prod are dropped.</p>
            </div>

            <andes-alert-dialog-countdown [seconds]="4" />
            <andes-alert-dialog-confirm-phrase phrase="orders-prod" />

            <div andesAlertDialogFooter>
              <andes-button variant="secondary" andesAlertDialogCancel>Cancel</andes-button>
              <andes-button variant="danger" andesAlertDialogAction>Drop database</andes-button>
            </div>
          </andes-alert-dialog-content>
        </andes-alert-dialog>
        <p [style]="muted" style="max-width: 36rem;">
          Live region: <strong [style]="strong">{{ announced() }}</strong>
        </p>
      `,
    };
  },
};

/** Less movement. */
export const ReducedMotion: Story = {
  name: 'Reduced motion',
  parameters: about(
    'When the operating system asks for less motion (prefers-reduced-motion: reduce) the surface appears and goes at once, an action pressed too early no longer shakes, the countdown bar stops sweeping and the hold fill advances in steps, so turn the setting on, or emulate it in the browser tools, and open it.',
  ),
  render: () => ({
    props: { ...shared },
    template: guardedDialog,
  }),
};

/** The dark theme. */
export const DarkMode: Story = {
  name: 'Dark mode',
  parameters: about(
    'In the dark theme the surface is lighter than the scrim, the tone icon and the danger action keep their contrast, and the phrase field and its chip read on the dark surface.',
  ),
  globals: { theme: 'dark' },
  render: () => ({
    props: { ...shared },
    template: guardedDialog,
  }),
};

/** A right-to-left document. */
export const RightToLeft: Story = {
  name: 'Right to left',
  parameters: {
    dir: 'rtl',
    ...about(
      'In a right-to-left document the layout mirrors with no overrides: the icon sits at the right of the title, the actions run from the left and the third answer of a footer sits at the start edge.',
    ),
  },
  render: () => ({
    props: { ...shared },
    template: guardedDialog,
  }),
};
