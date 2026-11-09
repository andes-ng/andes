import { signal } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';

import {
  about,
  caption,
  stage,
  withDescription,
  withPopoverKit,
  wideStage,
} from '../../testing/popover-story-kit';
import { AndesButton } from '../button/button';
import { AndesInput } from '../input/input';
import { AndesPopconfirmTrigger } from '../popover/popover-trigger';
import { AndesPopconfirm } from './popconfirm';

const meta: Meta<AndesPopconfirm> = {
  title: 'Feedback/Popconfirm/Buttons',
  component: AndesPopconfirm,
  decorators: [
    withDescription,
    withPopoverKit,
    moduleMetadata({
      imports: [AndesButton, AndesInput, NgIcon, AndesPopconfirmTrigger],
    }),
  ],
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<AndesPopconfirm>;

/** Labels. */
export const Labels: Story = {
  name: 'Button labels',
  parameters: about(
    'okText and cancelText name the two answers, which reads better than OK and Cancel when the question is not a yes or no.',
  ),
  render: () => ({
    template: `
      <div style="${wideStage}">
        <andes-popconfirm title="Delete the task?" okText="Delete" cancelText="Keep it">
          <andes-button variant="outline" andesPopconfirmTrigger>Delete / Keep</andes-button>
        </andes-popconfirm>
        <andes-popconfirm title="Publish the page?" okText="Publish now" cancelText="Not yet">
          <andes-button variant="outline" andesPopconfirmTrigger>Publish / Not yet</andes-button>
        </andes-popconfirm>
      </div>
    `,
  }),
};

/** OK variants. */
export const OkTypes: Story = {
  name: 'OK button types',
  parameters: about(
    'okType takes any button variant: primary for a routine yes, danger for a destructive one, and the quieter ones for a low-stakes check.',
  ),
  render: () => ({
    props: {
      types: ['primary', 'secondary', 'danger', 'outline', 'dashed', 'ghost'],
    },
    template: `
      <div style="${wideStage}">
        @for (type of types; track type) {
          <andes-popconfirm title="Continue?" [okType]="type">
            <andes-button variant="outline" size="sm" andesPopconfirmTrigger>{{ type }}</andes-button>
          </andes-popconfirm>
        }
      </div>
    `,
  }),
};

/** Cancel variants. */
export const CancelTypes: Story = {
  name: 'Cancel button type',
  parameters: about(
    'cancelType restyles the Cancel button, which is an outline button unless told otherwise.',
  ),
  render: () => ({
    template: `
      <div style="${wideStage}">
        <andes-popconfirm title="Continue?" cancelType="ghost">
          <andes-button variant="outline" size="sm" andesPopconfirmTrigger>ghost cancel</andes-button>
        </andes-popconfirm>
        <andes-popconfirm title="Continue?" cancelType="secondary">
          <andes-button variant="outline" size="sm" andesPopconfirmTrigger>secondary cancel</andes-button>
        </andes-popconfirm>
      </div>
    `,
  }),
};

/** No cancel. */
export const NoCancel: Story = {
  name: 'Without a Cancel button',
  parameters: about(
    'showCancel off leaves one button, for a notice that only needs acknowledging, and focus then starts on it.',
  ),
  render: () => ({
    template: `
      <div style="${stage}">
        <andes-popconfirm title="Your session ends in 5 minutes." [showCancel]="false" okText="Got it">
          <andes-button variant="outline" andesPopconfirmTrigger>Session</andes-button>
        </andes-popconfirm>
      </div>
    `,
  }),
};

/** Button props. */
export const OkButtonProps: Story = {
  name: 'OK button props',
  parameters: about(
    'okButtonProps sets whatever a button takes, here a colour with the dashed variant and an accessible name that says more than the label.',
  ),
  render: () => ({
    props: {
      props: {
        variant: 'dashed',
        color: 'success',
        ariaLabel: 'Approve the request',
      },
    },
    template: `
      <div style="${stage}">
        <andes-popconfirm title="Approve this request?" okText="Approve" [okButtonProps]="props">
          <andes-button variant="outline" andesPopconfirmTrigger>Review</andes-button>
        </andes-popconfirm>
      </div>
    `,
  }),
};

/** Cancel props. */
export const CancelButtonProps: Story = {
  name: 'Cancel button props',
  parameters: about(
    'cancelButtonProps does the same for Cancel, here a text-only button with its own class.',
  ),
  render: () => ({
    props: { props: { variant: 'link', class: 'my-cancel' } },
    template: `
      <div style="${stage}">
        <andes-popconfirm title="Leave this page?" [cancelButtonProps]="props">
          <andes-button variant="outline" andesPopconfirmTrigger>Leave</andes-button>
        </andes-popconfirm>
      </div>
    `,
  }),
};

/** Disabled OK. */
export const OkDisabled: Story = {
  name: 'OK disabled until ready',
  parameters: about(
    'okDisabled holds OK back until a condition is met, here typing the name of the project to confirm that it is the right one.',
  ),
  render: () => ({
    props: { typed: signal(''), caption },
    template: `
      <div style="${stage}">
        <andes-popconfirm title="Delete the project?" [description]="detail" [okDisabled]="typed() !== 'atlas'" okType="danger" okText="Delete project">
          <andes-button variant="danger" andesPopconfirmTrigger>Delete project</andes-button>
        </andes-popconfirm>
        <ng-template #detail>
          <span>Type <strong>atlas</strong> to confirm.</span>
          <andes-input aria-label="Project name" size="sm" style="display: block; margin-top: 0.5rem;" [(value)]="typed" />
        </ng-template>
      </div>
    `,
  }),
};

/** Initial focus. */
export const InitialFocus: Story = {
  name: 'Initial focus',
  parameters: about(
    'Focus starts on Cancel, the safe answer, and initialFocus ok moves it to OK for a routine question where Enter should confirm.',
  ),
  render: () => ({
    template: `
      <div style="${wideStage}">
        <andes-popconfirm title="Delete the task?" okType="danger" okText="Delete">
          <andes-button variant="outline" andesPopconfirmTrigger>Starts on Cancel</andes-button>
        </andes-popconfirm>
        <andes-popconfirm title="Save the changes?" initialFocus="ok" okText="Save">
          <andes-button variant="outline" andesPopconfirmTrigger>Starts on OK</andes-button>
        </andes-popconfirm>
      </div>
    `,
  }),
};

/** Sizes. */
export const Sizes: Story = {
  name: 'Button size',
  parameters: about(
    'The buttons are small (24px high, 13px text) and size in the button props makes them smaller or larger when a layout asks for it.',
  ),
  render: () => ({
    props: { xs: { size: 'xs' }, md: { size: 'md' } },
    template: `
      <div style="${wideStage}">
        <andes-popconfirm title="Continue?" [okButtonProps]="xs" [cancelButtonProps]="xs">
          <andes-button variant="outline" size="sm" andesPopconfirmTrigger>xs</andes-button>
        </andes-popconfirm>
        <andes-popconfirm title="Continue?">
          <andes-button variant="outline" size="sm" andesPopconfirmTrigger>sm (default)</andes-button>
        </andes-popconfirm>
        <andes-popconfirm title="Continue?" [okButtonProps]="md" [cancelButtonProps]="md">
          <andes-button variant="outline" size="sm" andesPopconfirmTrigger>md</andes-button>
        </andes-popconfirm>
      </div>
    `,
  }),
};
