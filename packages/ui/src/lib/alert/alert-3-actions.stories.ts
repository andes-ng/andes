import type { Meta, StoryObj } from '@storybook/angular';

import {
  about,
  column,
  withAlertKit,
  withDescription,
} from '../../testing/alert-story-kit';
import { AndesAlert } from './alert';

const meta: Meta<AndesAlert> = {
  title: 'Feedback/Alert/Actions',
  component: AndesAlert,
  decorators: [withDescription, withAlertKit],
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<AndesAlert>;

/** Under the text. */
export const ActionUnderText: Story = {
  name: 'Action under the text',
  parameters: about(
    'The action slot sits under the text by default, 8px below the last line, for a message with room to breathe.',
  ),
  render: () => ({
    props: { column },
    template: `<div [style]="column">
      <andes-alert severity="warning">
        <span slot="title">Your plan expires soon</span>
        Renew before the end of the month to avoid any interruption.
        <andes-button slot="action" size="sm" variant="outline">Renew now</andes-button>
      </andes-alert>
    </div>`,
  }),
};

/** Beside the text. */
export const ActionAtEnd: Story = {
  name: 'Action at the end',
  parameters: about(
    'Placing the action at the end puts it beside the text, so a one-line notice with a short action stays one line tall.',
  ),
  render: () => ({
    props: { column },
    template: `<div [style]="column">
      <andes-alert severity="success" actionPlacement="end" closable>
        Invoice F001-000123 was voided.
        <andes-button slot="action" size="xs" variant="ghost">Undo</andes-button>
      </andes-alert>
      <andes-alert severity="danger" actionPlacement="end" closable title="Sync failed" description="The tax authority service did not answer; your documents are queued and will be sent again.">
        <andes-button slot="action" size="sm" variant="outline" danger>Retry now</andes-button>
      </andes-alert>
      <andes-alert severity="info" actionPlacement="end" [showIcon]="false">
        3 rows selected.
        <andes-button slot="action" size="xs" variant="ghost">Clear selection</andes-button>
      </andes-alert>
    </div>`,
  }),
};

/** Action as a template. */
export const ActionTemplate: Story = {
  name: 'Action as an input',
  parameters: about(
    'The action input takes a template that receives the resolved severity, and wins over the slot.',
  ),
  render: () => ({
    props: { column },
    template: `<ng-template #review let-severity>
        <andes-button size="sm" variant="outline" [danger]="severity === 'danger'">Review {{ severity }}</andes-button>
      </ng-template>
      <div [style]="column">
        <andes-alert severity="danger" title="Two payments failed" description="Review them before the next billing run." [action]="review" />
      </div>`,
  }),
};

/** Several actions. */
export const SeveralActions: Story = {
  name: 'Several actions',
  parameters: about(
    'Any number of buttons can share the action slot, here a primary choice and a plain one under the text, and stacked at the end.',
  ),
  render: () => ({
    props: { column },
    template: `<div [style]="column">
      <andes-alert severity="info">
        <span slot="title">Enable two-step verification</span>
        Protect your account with a second step when you sign in.
        <span slot="action" style="display: flex; gap: 0.5rem;">
          <andes-button size="sm">Enable</andes-button>
          <andes-button size="sm" variant="ghost">Not now</andes-button>
        </span>
      </andes-alert>
      <andes-alert severity="warning" actionPlacement="end" title="Unsaved changes" description="Leaving this page discards your edits.">
        <div slot="action" style="display: flex; flex-direction: column; gap: 0.25rem; min-width: 5rem;">
          <andes-button size="xs" fullWidth>Save</andes-button>
          <andes-button size="xs" variant="outline" danger fullWidth>Discard</andes-button>
        </div>
      </andes-alert>
    </div>`,
  }),
};

/** Action with an icon. */
export const ActionWithIcon: Story = {
  name: 'Action with an icon',
  parameters: about(
    'A button in the action slot can carry a lucide icon like any other button in the library.',
  ),
  render: () => ({
    props: { column },
    template: `<div [style]="column">
      <andes-alert severity="success" actionPlacement="end" closable>
        The export is ready.
        <andes-button slot="action" size="xs" variant="outline">
          <ng-icon name="lucideDownload" aria-hidden="true" />
          Download
        </andes-button>
      </andes-alert>
    </div>`,
  }),
};
