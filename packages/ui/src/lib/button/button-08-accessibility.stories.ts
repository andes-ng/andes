import type { Meta, StoryObj } from '@storybook/angular';

import {
  about,
  bar,
  column,
  withButtonKit,
  withDescription,
} from '../../testing/button-story-kit';
import { AndesButton } from './button';

/* Naming, the current item of a set, the loading announcement, right to left and the dark theme. */

const meta: Meta<AndesButton> = {
  title: 'General/Button/Accessibility',
  component: AndesButton,
  decorators: [withDescription, withButtonKit],
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<AndesButton>;

export const Naming: Story = {
  name: 'Naming',
  parameters: about(
    'The text is the accessible name of a button, aria-label names an icon-only one, and aria-describedby adds a hint a screen reader reads after the name.',
  ),
  render: () => ({
    template: `
      <div style="${column}">
        <div style="${bar} gap: 1rem;">
          <andes-button>Save changes</andes-button>
          <andes-button size="icon" aria-label="Search the catalogue"><ng-icon name="lucideSearch" /></andes-button>
          <andes-button variant="outline" aria-describedby="story-delete-hint" danger>Delete account</andes-button>
        </div>
        <span id="story-delete-hint" style="font-size: 0.75rem;">Deleting your account cannot be undone.</span>
      </div>
    `,
  }),
};

export const CurrentItem: Story = {
  name: 'Current item',
  parameters: about(
    'aria-current marks the current item of a set on the real button, here the current page of a short pager.',
  ),
  render: () => ({
    template: `
      <andes-button-group aria-label="Pages">
        <andes-button variant="outline" size="sm">1</andes-button>
        <andes-button size="sm" aria-current="page">2</andes-button>
        <andes-button variant="outline" size="sm">3</andes-button>
      </andes-button-group>
    `,
  }),
};

export const BusyAnnouncement: Story = {
  name: 'Busy announcement',
  parameters: about(
    'A loading button is aria-busy and announces its loadingLabel through a polite status region, which can be translated.',
  ),
  render: () => ({
    template: `
      <div style="${bar} gap: 1rem;">
        <andes-button [loading]="true">Save</andes-button>
        <andes-button [loading]="true" loadingLabel="Guardando" variant="outline">Guardar</andes-button>
      </div>
    `,
  }),
};

export const RightToLeft: Story = {
  name: 'Right to left',
  parameters: {
    ...about(
      'In a right-to-left page the icons swap sides and a roving group reverses its arrow keys.',
    ),
    dir: 'rtl',
  },
  render: () => ({
    template: `
      <div dir="rtl" style="${column}">
        <andes-button>
          <ng-icon slot="icon-start" name="lucideArrowRight" />
          Back
        </andes-button>
        <andes-button-group aria-label="Edit" roving>
          <andes-button variant="outline">Undo</andes-button>
          <andes-button variant="outline">Redo</andes-button>
          <andes-button variant="outline">Clear</andes-button>
        </andes-button-group>
      </div>
    `,
  }),
};

export const DarkTheme: Story = {
  name: 'Dark theme',
  parameters: about(
    'The same buttons on the dark theme, with their press feedback, focus ring and colours.',
  ),
  globals: { theme: 'dark' },
  render: () => ({
    template: `
      <div style="${bar} gap: 1rem;">
        <andes-button>Primary</andes-button>
        <andes-button variant="secondary">Secondary</andes-button>
        <andes-button variant="outline">Outline</andes-button>
        <andes-button variant="ghost">Ghost</andes-button>
        <andes-button danger>Delete</andes-button>
      </div>
    `,
  }),
};
