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
 * The tone draws the icon of the question and a thin accent along the top edge of the surface;
 * it never carries the meaning alone, which stays in the title and the description.
 */

const meta: Meta<AndesAlertDialog> = {
  title: 'Feedback/Alert Dialog/Tones',
  decorators: [withDescription, withDialogKit],
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<AndesAlertDialog>;

/** Destructive. */
export const Danger: Story = {
  name: 'Danger',
  parameters: about(
    'A danger tone draws a cross on a red disc for an action that cannot be undone, and pairs with a danger action and focus on the safe choice.',
  ),
  render: () => {
    const result = signal(NOTHING_YET);
    return {
      props: { ...shared, result },
      template: `
        <andes-alert-dialog tone="danger" initialFocus="cancel" (cancelled)="result.set('Cancelled.')">
          <andes-button variant="danger" andesAlertDialogTrigger>Remove member</andes-button>

          <andes-alert-dialog-content *andesAlertDialogContent>
            <div andesAlertDialogHeader>
              <andes-alert-dialog-icon />
              <h2 andesAlertDialogTitle>Remove this member?</h2>
              <p andesAlertDialogDescription>
                Maria Quispe loses access to every project at once.
              </p>
            </div>

            <div andesAlertDialogFooter>
              <andes-button variant="secondary" andesAlertDialogCancel>Cancel</andes-button>
              <andes-button variant="danger" andesAlertDialogAction (click)="result.set('Removed Maria Quispe.')">Remove member</andes-button>
            </div>
          </andes-alert-dialog-content>
        </andes-alert-dialog>
        ${resultLine}
      `,
    };
  },
};

/** Proceed with care. */
export const Warning: Story = {
  name: 'Warning',
  parameters: about(
    'A warning tone draws an exclamation mark on an amber disc for an action that can be done but may not be what was meant.',
  ),
  render: () => {
    const result = signal(NOTHING_YET);
    return {
      props: { ...shared, result },
      template: `
        <andes-alert-dialog tone="warning" initialFocus="cancel" (cancelled)="result.set('Cancelled.')">
          <andes-button andesAlertDialogTrigger>Publish site</andes-button>

          <andes-alert-dialog-content *andesAlertDialogContent>
            <div andesAlertDialogHeader>
              <andes-alert-dialog-icon />
              <h2 andesAlertDialogTitle>Publish with 3 broken links?</h2>
              <p andesAlertDialogDescription>
                Visitors will land on error pages until the links are fixed.
              </p>
            </div>

            <div andesAlertDialogFooter>
              <andes-button variant="secondary" andesAlertDialogCancel>Go back</andes-button>
              <andes-button andesAlertDialogAction (click)="result.set('Published with 3 broken links.')">Publish anyway</andes-button>
            </div>
          </andes-alert-dialog-content>
        </andes-alert-dialog>
        ${resultLine}
      `,
    };
  },
};

/** Worth knowing. */
export const Info: Story = {
  name: 'Info',
  parameters: about(
    'An info tone draws an i on a blue disc for a question that carries no risk, the choice between a good moment and a later one.',
  ),
  render: () => {
    const result = signal(NOTHING_YET);
    return {
      props: { ...shared, result },
      template: `
        <andes-alert-dialog tone="info" (cancelled)="result.set('Postponed the update.')">
          <andes-button andesAlertDialogTrigger>Check for updates</andes-button>

          <andes-alert-dialog-content *andesAlertDialogContent>
            <div andesAlertDialogHeader>
              <andes-alert-dialog-icon />
              <h2 andesAlertDialogTitle>A new version is available</h2>
              <p andesAlertDialogDescription>
                Reload to get 4.2. Your unsaved forms keep their drafts.
              </p>
            </div>

            <div andesAlertDialogFooter>
              <andes-button variant="secondary" andesAlertDialogCancel>Later</andes-button>
              <andes-button andesAlertDialogAction (click)="result.set('Reloading.')">Reload now</andes-button>
            </div>
          </andes-alert-dialog-content>
        </andes-alert-dialog>
        ${resultLine}
      `,
    };
  },
};

/** Good news that needs a go-ahead. */
export const Success: Story = {
  name: 'Success',
  parameters: about(
    'A success tone draws a check on a green disc for a confirmation that follows good news, such as checks that passed before a release goes out.',
  ),
  render: () => {
    const result = signal(NOTHING_YET);
    return {
      props: { ...shared, result },
      template: `
        <andes-alert-dialog tone="success" (cancelled)="result.set('Held the release.')">
          <andes-button andesAlertDialogTrigger>Release 4.2</andes-button>

          <andes-alert-dialog-content *andesAlertDialogContent>
            <div andesAlertDialogHeader>
              <andes-alert-dialog-icon />
              <h2 andesAlertDialogTitle>Ready to ship?</h2>
              <p andesAlertDialogDescription>
                All 214 checks passed. Release 4.2 goes live to every region.
              </p>
            </div>

            <div andesAlertDialogFooter>
              <andes-button variant="secondary" andesAlertDialogCancel>Not yet</andes-button>
              <andes-button andesAlertDialogAction (click)="result.set('Shipped release 4.2.')">Ship release</andes-button>
            </div>
          </andes-alert-dialog-content>
        </andes-alert-dialog>
        ${resultLine}
      `,
    };
  },
};

/** No tone. */
export const WithoutATone: Story = {
  name: 'Without a tone',
  parameters: about(
    'With no tone the dialog keeps a neutral surface and draws no icon, which suits a plain question where nothing is at stake.',
  ),
  render: () => {
    const result = signal(NOTHING_YET);
    return {
      props: { ...shared, result },
      template: `
        <andes-alert-dialog (cancelled)="result.set('Kept the draft.')">
          <andes-button variant="secondary" andesAlertDialogTrigger>Discard draft</andes-button>

          <andes-alert-dialog-content *andesAlertDialogContent>
            <div andesAlertDialogHeader>
              <h2 andesAlertDialogTitle>Discard this draft?</h2>
              <p andesAlertDialogDescription>
                The draft was last saved 2 minutes ago.
              </p>
            </div>

            <div andesAlertDialogFooter>
              <andes-button variant="secondary" andesAlertDialogCancel>Keep editing</andes-button>
              <andes-button andesAlertDialogAction (click)="result.set('Discarded the draft.')">Discard</andes-button>
            </div>
          </andes-alert-dialog-content>
        </andes-alert-dialog>
        ${resultLine}
      `,
    };
  },
};
