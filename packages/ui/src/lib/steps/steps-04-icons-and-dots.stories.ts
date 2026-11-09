import { NgIcon } from '@ng-icons/core';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';

import {
  about,
  demo,
  demos,
  FOUR,
  FOUR_DESCRIBED,
  withDescription,
  withStepsKit,
} from '../../testing/steps-story-kit';
import { AndesStep } from './step';
import { AndesSteps } from './steps';

const meta: Meta<AndesSteps> = {
  title: 'Navigation/Steps/Icons and dots',
  component: AndesSteps,
  tags: ['autodocs'],
  decorators: [
    withDescription,
    withStepsKit,
    moduleMetadata({ imports: [AndesSteps, AndesStep, NgIcon] }),
  ],
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<AndesSteps>;

const ACCOUNT = `
  <andes-step title="Profile" icon="lucideUser" description="Your name and photo" />
  <andes-step title="Security" icon="lucideLock" description="Password and codes" />
  <andes-step title="Payment" icon="lucideCreditCard" description="A card or a wallet" />
  <andes-step title="Welcome" icon="lucidePartyPopper" />`;

export const IconPerStep: Story = {
  name: 'An icon for each step',
  parameters: about(
    'The icon input takes a lucide icon name and draws it in the marker in place of the number.',
  ),
  render: () => ({
    template: `<andes-steps aria-label="Account" [current]="1">${ACCOUNT}</andes-steps>`,
  }),
};

export const IconTemplates: Story = {
  name: 'Icons from a template',
  parameters: about(
    'A template draws any markup in the marker, and receives the status, the index and whether the step is current.',
  ),
  render: () => ({
    template: `
      <andes-steps aria-label="Delivery" [current]="1">
        <andes-step title="Packed" [icon]="pick" />
        <andes-step title="In transit" [icon]="pick" />
        <andes-step title="Delivered" [icon]="pick" />
      </andes-steps>
      <ng-template #pick let-status let-index="index" let-current="current">
        @switch (index) {
          @case (0) { <ng-icon name="lucideBox" /> }
          @case (1) { <ng-icon [name]="current ? 'lucideLoader' : 'lucideTruck'" /> }
          @default { <ng-icon name="lucideHouse" /> }
        }
      </ng-template>`,
  }),
};

export const IconWithDescriptions: Story = {
  name: 'Icons with descriptions',
  parameters: about(
    'Icons and descriptions together give each stage a recognisable shape and a line of explanation.',
  ),
  render: () => ({
    template: `<andes-steps aria-label="Account" [current]="2">${ACCOUNT}</andes-steps>`,
  }),
};

export const IconsSmall: Story = {
  name: 'Small icons',
  parameters: about(
    'In the small size the icon shrinks with the 20px marker and keeps its stroke weight.',
  ),
  render: () => ({
    template: `<andes-steps aria-label="Account" size="small" [current]="1">${ACCOUNT}</andes-steps>`,
  }),
};

export const IconsInCircle: Story = {
  name: 'Icons inside a circle',
  parameters: about(
    'In the soft, solid and outline variants the icon sits in the same circle as a number would, tinted by the status.',
  ),
  render: () => ({
    template: demos(
      ...['soft', 'solid', 'outline'].map((variant) =>
        demo(
          variant,
          `<andes-steps aria-label="${variant}" variant="${variant}" [current]="1">${ACCOUNT}</andes-steps>`,
        ),
      ),
    ),
  }),
};

export const IconsOnly: Story = {
  name: 'Icons without a circle',
  parameters: about(
    'The plain variant drops the circle so the icon alone marks the step, larger and tinted by its status.',
  ),
  render: () => ({
    template: demos(
      demo(
        'plain',
        `<andes-steps aria-label="Plain" variant="plain" [current]="1">${ACCOUNT}</andes-steps>`,
      ),
      demo(
        'plain, stacked',
        `<andes-steps aria-label="Plain stacked" variant="plain" orientation="vertical" [current]="1">${ACCOUNT}</andes-steps>`,
      ),
    ),
  }),
};

export const StatusIcons: Story = {
  name: 'Icons for every status',
  parameters: about(
    'The statusIcons input replaces the marker of every step in a status at once, here a circle for each of finished, error and waiting.',
  ),
  render: () => ({
    props: {
      icons: {
        finish: 'lucideCircleCheck',
        error: 'lucideCircleAlert',
        wait: 'lucideCircleDashed',
      },
    },
    template: `
      <andes-steps aria-label="Build" variant="plain" [statusIcons]="icons" [current]="2">
        <andes-step title="Compile" />
        <andes-step title="Test" status="error" />
        <andes-step title="Package" />
        <andes-step title="Publish" />
      </andes-steps>`,
  }),
};

export const StatusIconTemplates: Story = {
  name: 'Status icons from templates',
  parameters: about(
    'The status icons can be templates too, so a finished step draws a badge and the one in progress draws a spinner.',
  ),
  render: () => ({
    template: `
      <andes-steps aria-label="Review" [statusIcons]="{ finish: done, process: busy }" [current]="1">
        <andes-step title="Draft" />
        <andes-step title="Review" />
        <andes-step title="Publish" />
      </andes-steps>
      <ng-template #done><ng-icon name="lucideBadgeCheck" /></ng-template>
      <ng-template #busy><ng-icon name="lucideLoader" /></ng-template>`,
  }),
};

export const StatusIconAndOwnIcon: Story = {
  name: 'A step icon wins over a status icon',
  parameters: about(
    'An icon set on a single step takes precedence over the status icons of the trail.',
  ),
  render: () => ({
    props: { icons: { finish: 'lucideBadgeCheck' } },
    template: `
      <andes-steps aria-label="Mixed" [statusIcons]="icons" [current]="3">
        <andes-step title="Draft" />
        <andes-step title="Legal" icon="lucideShieldCheck" />
        <andes-step title="Finance" />
        <andes-step title="Launch" icon="lucideRocket" />
      </andes-steps>`,
  }),
};

export const ErrorIcon: Story = {
  name: 'A custom icon for the error',
  parameters: about(
    'Only the error status is given an icon here, so the other steps keep their numbers and checks.',
  ),
  render: () => ({
    props: { icons: { error: 'lucideCircleAlert' } },
    template: `
      <andes-steps aria-label="Upload" status="error" [statusIcons]="icons" [current]="1">
        <andes-step title="Select" />
        <andes-step title="Upload" description="The file is too large" />
        <andes-step title="Done" />
      </andes-steps>`,
  }),
};

export const DotBasic: Story = {
  name: 'Dots',
  parameters: about(
    'The dot type replaces the numbered markers with small dots, and the current one gets a soft halo.',
  ),
  render: () => ({
    template: `<andes-steps aria-label="Dots" type="dot" [current]="1">${FOUR}</andes-steps>`,
  }),
};

export const DotDescriptions: Story = {
  name: 'Dots with descriptions',
  parameters: about(
    'Titles and descriptions sit under the dots, which suits a release or a project timeline.',
  ),
  render: () => ({
    template: `<andes-steps aria-label="Dots" type="dot" [current]="2">${FOUR_DESCRIBED}</andes-steps>`,
  }),
};

export const DotSubtitles: Story = {
  name: 'Dots with sub titles',
  parameters: about(
    'A sub title next to the title carries a date or a time for each milestone.',
  ),
  render: () => ({
    template: `
      <andes-steps aria-label="Milestones" type="dot" [current]="1">
        <andes-step title="Kick-off" subtitle="Jan 8" description="Scope agreed" />
        <andes-step title="Beta" subtitle="Mar 2" description="First customers" />
        <andes-step title="Launch" subtitle="May 20" description="Public release" />
        <andes-step title="Review" subtitle="Jul 1" />
      </andes-steps>`,
  }),
};

export const DotVerticalSubtitles: Story = {
  name: 'Vertical dots with sub titles',
  parameters: about(
    'Stacked dots with a sub title and a description make a timeline of dated events.',
  ),
  render: () => ({
    template: `
      <andes-steps aria-label="History" type="dot" orientation="vertical" [current]="2" style="max-width: 26rem">
        <andes-step title="Order placed" subtitle="09:12" description="Paid with a card ending 4242" />
        <andes-step title="Packed" subtitle="11:40" description="Two boxes, 3.2 kg in total" />
        <andes-step title="Out for delivery" subtitle="Today" description="The courier is nearby" />
        <andes-step title="Delivered" />
      </andes-steps>`,
  }),
};

export const DotError: Story = {
  name: 'Dots with an error',
  parameters: about(
    'An error colours the dot, its halo and the title of the failed step.',
  ),
  render: () => ({
    template: `<andes-steps aria-label="Dots" type="dot" status="error" [current]="2">${FOUR_DESCRIBED}</andes-steps>`,
  }),
};

export const DotClickable: Story = {
  name: 'Clickable dots',
  parameters: about(
    'Dots can be buttons too: the whole step, title included, selects its stage and takes keyboard focus.',
  ),
  render: () => ({
    props: { picked: 1 },
    template: `<andes-steps aria-label="Dots" type="dot" clickable [(current)]="picked">${FOUR_DESCRIBED}</andes-steps>`,
  }),
};

export const DotSmall: Story = {
  name: 'Small dots',
  parameters: about(
    'The small size keeps the dot and tightens the text underneath it.',
  ),
  render: () => ({
    template: `<andes-steps aria-label="Dots" type="dot" size="small" [current]="1">${FOUR_DESCRIBED}</andes-steps>`,
  }),
};

export const DotTemplate: Story = {
  name: 'Custom dots',
  parameters: about(
    'A dot template draws every dot yourself, here a ring for the steps to come, a check for finished ones and a star for the current one.',
  ),
  render: () => ({
    template: `
      <andes-steps aria-label="Custom dots" type="dot" [dotTemplate]="dot" [current]="1">${FOUR_DESCRIBED}</andes-steps>
      <ng-template #dot let-status let-current="current">
        @if (status === 'finish') {
          <ng-icon name="lucideCircleCheck" style="font-size: 1.125rem; color: var(--andes-color-primary-text)" />
        } @else if (current) {
          <ng-icon name="lucideStar" style="font-size: 1.125rem; color: var(--andes-color-primary-text)" />
        } @else {
          <ng-icon name="lucideCircleDashed" style="font-size: 1.125rem" />
        }
      </ng-template>`,
  }),
};

export const DotTemplateVertical: Story = {
  name: 'Custom dots, stacked',
  parameters: about(
    'The same dot template works in the stacked layout, where each custom dot sits on the connector.',
  ),
  render: () => ({
    template: `
      <andes-steps aria-label="Custom dots" type="dot" orientation="vertical" [dotTemplate]="dot" [current]="1">${FOUR}</andes-steps>
      <ng-template #dot let-status>
        <ng-icon [name]="status === 'finish' ? 'lucideCircleCheck' : status === 'process' ? 'lucideLoader' : 'lucideCircleDashed'" style="font-size: 1.125rem" />
      </ng-template>`,
  }),
};
