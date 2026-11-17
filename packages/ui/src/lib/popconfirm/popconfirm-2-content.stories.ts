import { NgIcon } from '@ng-icons/core';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';

import {
  about,
  stage,
  withDescription,
  withPopoverKit,
  wideStage,
} from '../../testing/popover-story-kit';
import { AndesButton } from '../button/button';
import { AndesTag } from '../tag/tag';
import { AndesPopconfirmTrigger } from '../popover/popover-trigger';
import { AndesPopconfirm } from './popconfirm';

const meta: Meta<AndesPopconfirm> = {
  title: 'Feedback/Popconfirm/Content',
  component: AndesPopconfirm,
  decorators: [
    withDescription,
    withPopoverKit,
    moduleMetadata({
      imports: [AndesButton, AndesTag, NgIcon, AndesPopconfirmTrigger],
    }),
  ],
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<AndesPopconfirm>;

/** Title only. */
export const TitleOnly: Story = {
  name: 'Title only',
  parameters: about(
    'With no description the panel is one line of text and the buttons, 12px apart.',
  ),
  render: () => ({
    template: `
      <div style="${stage}">
        <andes-popconfirm title="Remove this member?" okText="Remove">
          <andes-button variant="outline" andesPopconfirmTrigger>Remove</andes-button>
        </andes-popconfirm>
      </div>
    `,
  }),
};

/** Template content. */
export const TemplateContent: Story = {
  name: 'Template title and description',
  parameters: about(
    'Both texts take templates, so the question can name the thing with emphasis and the description can carry a tag or a link.',
  ),
  render: () => ({
    template: `
      <div style="${stage}">
        <andes-popconfirm [title]="question" [description]="detail">
          <andes-button variant="outline" andesPopconfirmTrigger>Delete file</andes-button>
        </andes-popconfirm>
        <ng-template #question>Delete <strong>report-2024.pdf</strong>?</ng-template>
        <ng-template #detail>It is shared with <andes-tag color="info">3 people</andes-tag> who will lose access.</ng-template>
      </div>
    `,
  }),
};

/** Function content. */
export const FunctionContent: Story = {
  name: 'Function content',
  parameters: about(
    'A function for the title or the description is read each time the panel opens, so it can name what is selected at that moment.',
  ),
  render: () => ({
    props: {
      question: () =>
        `Delete ${new Date().getSeconds() % 2 ? 'this item' : 'the item'}?`,
      detail: () => `Asked at ${new Date().toLocaleTimeString()}.`,
    },
    template: `
      <div style="${stage}">
        <andes-popconfirm [title]="question" [description]="detail">
          <andes-button variant="outline" andesPopconfirmTrigger>Delete</andes-button>
        </andes-popconfirm>
      </div>
    `,
  }),
};

/** Default icon. */
export const DefaultIcon: Story = {
  name: 'Default icon',
  parameters: about(
    'Without an icon input the panel shows a warning mark drawn from the lucide circle-alert glyph, centred on the first line of the title.',
  ),
  render: () => ({
    template: `
      <div style="${stage}">
        <andes-popconfirm title="Discard the draft?" description="Your changes will be lost.">
          <andes-button variant="outline" andesPopconfirmTrigger>Discard</andes-button>
        </andes-popconfirm>
      </div>
    `,
  }),
};

/** Icon by name. */
export const IconByName: Story = {
  name: 'Icon by name',
  parameters: about(
    'A string is the name of any lucide icon the app has registered, so a trash can or a lock needs no template.',
  ),
  render: () => ({
    template: `
      <div style="${wideStage}">
        <andes-popconfirm icon="lucideTrash2" title="Delete the task?" okType="danger" okText="Delete">
          <andes-button variant="outline" andesPopconfirmTrigger>Trash icon</andes-button>
        </andes-popconfirm>
        <andes-popconfirm icon="lucideLock" title="Lock the document?" description="Only owners can edit it afterwards.">
          <andes-button variant="outline" andesPopconfirmTrigger>Lock icon</andes-button>
        </andes-popconfirm>
        <andes-popconfirm icon="lucideLogOut" title="Sign out of every device?">
          <andes-button variant="outline" andesPopconfirmTrigger>Sign out icon</andes-button>
        </andes-popconfirm>
      </div>
    `,
  }),
};

/** Icon template. */
export const IconTemplate: Story = {
  name: 'Icon from a template',
  parameters: about(
    'A template replaces the mark with anything, here a lucide icon tinted with the danger colour.',
  ),
  render: () => ({
    template: `
      <div style="${stage}">
        <andes-popconfirm [icon]="danger" title="Delete the account?" description="All data is removed for good." okType="danger" okText="Delete">
          <andes-button variant="danger" andesPopconfirmTrigger>Delete account</andes-button>
        </andes-popconfirm>
        <ng-template #danger><ng-icon name="lucideTriangleAlert" aria-hidden="true" style="color: var(--andes-color-danger);" /></ng-template>
      </div>
    `,
  }),
};

/** No icon. */
export const NoIcon: Story = {
  name: 'No icon',
  parameters: about(
    'null removes the icon, and the text takes the full width of the panel.',
  ),
  render: () => ({
    template: `
      <div style="${stage}">
        <andes-popconfirm [icon]="null" title="Mark all as read?" description="You have 12 unread messages.">
          <andes-button variant="outline" andesPopconfirmTrigger>Mark all read</andes-button>
        </andes-popconfirm>
      </div>
    `,
  }),
};

/** Long text. */
export const LongText: Story = {
  name: 'Long text',
  parameters: about(
    'A long title or description wraps inside the panel width, with the icon staying on the first line of the title.',
  ),
  render: () => ({
    template: `
      <div style="${stage}">
        <andes-popconfirm title="Do you really want to delete all the tasks that were completed more than ninety days ago?" description="They are removed from every board and every report, and the activity log keeps only the number of tasks that were removed. This cannot be undone." okType="danger" okText="Delete all">
          <andes-button variant="outline" andesPopconfirmTrigger>Clean up</andes-button>
        </andes-popconfirm>
      </div>
    `,
  }),
};
