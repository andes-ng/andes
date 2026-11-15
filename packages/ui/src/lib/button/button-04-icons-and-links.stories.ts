import type { Meta, StoryObj } from '@storybook/angular';

import {
  about,
  bar,
  column,
  withButtonKit,
  withDescription,
} from '../../testing/button-story-kit';
import { AndesButton } from './button';

/* Icons beside the label, icon-only buttons with a tooltip, links and form buttons. */

const meta: Meta<AndesButton> = {
  title: 'General/Button/Icons and links',
  component: AndesButton,
  decorators: [withDescription, withButtonKit],
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<AndesButton>;

export const WithIcons: Story = {
  name: 'With icons',
  parameters: about(
    'Icons go in the icon-start and icon-end slots, before or after the label.',
  ),
  render: () => ({
    template: `
      <div style="${bar} gap: 1rem;">
        <andes-button>
          <ng-icon slot="icon-start" name="lucideArrowLeft" />
          Back
        </andes-button>
        <andes-button>
          Next
          <ng-icon slot="icon-end" name="lucideArrowRight" />
        </andes-button>
        <andes-button variant="outline">
          <ng-icon slot="icon-start" name="lucidePlus" />
          New item
        </andes-button>
        <andes-button variant="secondary">
          <ng-icon slot="icon-start" name="lucideDownload" />
          Download
        </andes-button>
        <andes-button danger variant="outline">
          <ng-icon slot="icon-start" name="lucideTrash2" />
          Delete
        </andes-button>
      </div>
    `,
  }),
};

export const IconOnlyWithTooltips: Story = {
  name: 'Icon only with tooltips',
  parameters: about(
    'An icon-only button is named by aria-label for a screen reader, and a tooltip around it tells sighted users what it does.',
  ),
  render: () => ({
    template: `
      <div style="${bar} padding-top: 2.5rem;">
        <andes-tooltip content="Edit">
          <andes-button andesTooltipTrigger size="icon" variant="ghost" aria-label="Edit"><ng-icon name="lucidePencil" /></andes-button>
        </andes-tooltip>
        <andes-tooltip content="Download">
          <andes-button andesTooltipTrigger size="icon" variant="ghost" aria-label="Download"><ng-icon name="lucideDownload" /></andes-button>
        </andes-tooltip>
        <andes-tooltip content="Delete the conversation">
          <andes-button andesTooltipTrigger size="icon" variant="ghost" danger aria-label="Delete the conversation"><ng-icon name="lucideTrash2" /></andes-button>
        </andes-tooltip>
      </div>
    `,
  }),
};

export const Links: Story = {
  name: 'Links',
  parameters: about(
    'With an href the button renders as an anchor, target opens it elsewhere and rel sets the relationship of the link.',
  ),
  render: () => ({
    template: `
      <div style="${bar} gap: 1rem;">
        <andes-button href="https://andes-ng.dev">Open the docs</andes-button>
        <andes-button href="https://andes-ng.dev" target="_blank" rel="noopener noreferrer" variant="outline">Open in a new tab</andes-button>
        <andes-button href="https://andes-ng.dev" disabled variant="outline">Disabled link</andes-button>
      </div>
    `,
  }),
};

export const FormButtons: Story = {
  name: 'Form buttons',
  parameters: about(
    'type="submit" submits the form, form ties a button outside the form to it by id, and name with value says which button was used.',
  ),
  render: () => ({
    props: {
      sent: (event: Event) => event.preventDefault(),
    },
    template: `
      <div style="${column}">
        <form id="invoice-form" (submit)="sent($event)">
          <div style="${bar} gap: 1rem;">
            <andes-button type="submit" name="intent" value="draft" variant="outline">Save draft</andes-button>
            <andes-button type="submit" name="intent" value="send">Send invoice</andes-button>
            <andes-button type="reset" variant="ghost">Reset</andes-button>
          </div>
        </form>
        <andes-button type="submit" form="invoice-form" name="intent" value="send" variant="secondary">Send from outside the form</andes-button>
      </div>
    `,
  }),
};
