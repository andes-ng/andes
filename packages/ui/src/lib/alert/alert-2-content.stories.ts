import type { Meta, StoryObj } from '@storybook/angular';

import {
  about,
  column,
  narrow,
  withAlertKit,
  withDescription,
} from '../../testing/alert-story-kit';
import { AndesAlert } from './alert';

const meta: Meta<AndesAlert> = {
  title: 'Feedback/Alert/Content',
  component: AndesAlert,
  decorators: [withDescription, withAlertKit],
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<AndesAlert>;

const LONG_TITLE =
  'Long alert title wraps to multiple lines when the alert container is narrow enough.';
const LONG_DESCRIPTION =
  'A longer description wraps inside the text column, under the title, and keeps the icon and the close button at the top edge of the card.';

/** Only a message. */
export const MessageOnly: Story = {
  name: 'Message only',
  parameters: about(
    'A message alone makes a 40px strip: a 16px icon, one 14px line and the close button, all centred on the row.',
  ),
  render: () => ({
    props: { column },
    template: `<div [style]="column">
      <andes-alert severity="success">Your changes have been saved.</andes-alert>
      <andes-alert severity="info" closable>A new version of the app is available.</andes-alert>
    </div>`,
  }),
};

/** A title, projected. */
export const TitleAndDescription: Story = {
  name: 'Title and description',
  parameters: about(
    'With a title over a description the icon steps up to 20px, the title takes a medium weight and the description a softer ink, and the parts hang from the top edge.',
  ),
  render: () => ({
    props: { column },
    template: `<div [style]="column">
      <andes-alert severity="info" closable>
        <span slot="title">Heads up</span>
        A title projected through the title slot, with the description underneath.
      </andes-alert>
      <andes-alert severity="warning" closable>
        <span slot="title">Your plan expires soon</span>
        Renew before the end of the month to avoid any interruption in your service.
      </andes-alert>
    </div>`,
  }),
};

/** No icon. */
export const WithoutIcon: Story = {
  name: 'Without an icon',
  parameters: about(
    'Turning showIcon off gives the text the whole row, for a notice whose colour is signal enough.',
  ),
  render: () => ({
    props: { column },
    template: `<div [style]="column">
      <andes-alert severity="warning" [showIcon]="false">No icon: the text takes the whole row.</andes-alert>
      <andes-alert severity="info" [showIcon]="false" closable title="No icon" description="showIcon is false, so the title and the description start at the edge." />
    </div>`,
  }),
};

/** Own icon. */
export const CustomIcon: Story = {
  name: 'Custom icon',
  parameters: about(
    'The icon input takes a template, drawn in the severity colour and in the same slot as the built-in glyph.',
  ),
  render: () => ({
    props: { column },
    template: `<ng-template #bell>
        <ng-icon name="lucideBell" aria-hidden="true" />
      </ng-template>
      <ng-template #rocket>
        <ng-icon name="lucideRocket" aria-hidden="true" />
      </ng-template>
      <div [style]="column">
        <andes-alert severity="success" [icon]="bell">
          <span slot="title">Reminder set</span>
          We will notify you when the report is ready.
        </andes-alert>
        <andes-alert severity="info" [icon]="rocket" description="Version 2.4 is live." />
      </div>`,
  }),
};

/** Text as inputs. */
export const PlainTextInputs: Story = {
  name: 'Plain-text inputs',
  parameters: about(
    'The title and description inputs take plain strings and win over the projected slots, the shortest way to write a notice.',
  ),
  render: () => ({
    props: { column },
    template: `<div [style]="column">
      <andes-alert severity="info" title="Plain-text title" description="Plain-text description, passed as inputs instead of projected content." />
      <andes-alert severity="success" title="Only a title, passed as an input" />
    </div>`,
  }),
};

/** Templates for rich content. */
export const RichTemplates: Story = {
  name: 'Rich templates',
  parameters: about(
    'Title, description and action also take templates, which receive the resolved severity, for markup inside the text.',
  ),
  render: () => ({
    props: { column },
    template: `<ng-template #richTitle let-severity>Payment failed <span style="font-weight: 400;">({{ severity }})</span></ng-template>
      <ng-template #richDescription>Your card was declined. <strong>No charge was made.</strong></ng-template>
      <ng-template #retry><andes-button size="xs" variant="outline" danger>Try another card</andes-button></ng-template>
      <div [style]="column">
        <andes-alert severity="danger" [title]="richTitle" [description]="richDescription" [action]="retry" />
      </div>`,
  }),
};

/** Long description. */
export const LongContent: Story = {
  name: 'Long content wraps',
  parameters: about(
    'In a narrow column a long description wraps under the title and the icon and the close button stay at the top edge.',
  ),
  render: () => ({
    props: { narrow, title: 'Import finished', description: LONG_DESCRIPTION },
    template: `<div [style]="narrow">
      <andes-alert severity="success" closable [title]="title" [description]="description" />
    </div>`,
  }),
};

/** Long title. */
export const LongTitle: Story = {
  name: 'Long title wraps',
  parameters: about(
    'A long message wraps in a narrow container and, with no description, the icon, text and close button stay centred on the row.',
  ),
  render: () => ({
    props: { narrow, title: LONG_TITLE },
    template: `<div [style]="narrow">
      <andes-alert severity="info" [title]="title" closable />
      <andes-alert severity="success" [title]="title" actionPlacement="end" closable>
        <andes-button slot="action" size="xs" variant="ghost">Action</andes-button>
      </andes-alert>
    </div>`,
  }),
};
