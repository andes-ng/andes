import { NgIcon } from '@ng-icons/core';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';

import {
  about,
  demo,
  demos,
  FOUR,
  FOUR_DESCRIBED,
  THREE,
  withDescription,
  withStepsKit,
} from '../../testing/steps-story-kit';
import { AndesButton } from '../button/button';
import { AndesStep } from './step';
import { AndesStepPanel } from './step-panel';
import { AndesSteps } from './steps';

const meta: Meta<AndesSteps> = {
  title: 'Navigation/Steps/Overview',
  component: AndesSteps,
  tags: ['autodocs'],
  decorators: [
    withDescription,
    withStepsKit,
    moduleMetadata({
      imports: [AndesSteps, AndesStep, AndesStepPanel, AndesButton, NgIcon],
    }),
  ],
  parameters: { layout: 'padded' },
  argTypes: {
    current: { control: { type: 'number', min: 0, max: 4 } },
    orientation: {
      control: 'inline-radio',
      options: ['horizontal', 'vertical'],
    },
    type: {
      control: 'select',
      options: ['default', 'dot', 'panel', 'navigation', 'inline'],
    },
    variant: {
      control: 'inline-radio',
      options: ['soft', 'solid', 'outline', 'plain'],
    },
    size: { control: 'inline-radio', options: ['default', 'small'] },
    titlePlacement: {
      control: 'inline-radio',
      options: ['horizontal', 'vertical'],
    },
    connector: {
      control: 'inline-radio',
      options: ['solid', 'dashed', 'dotted'],
    },
    status: {
      control: 'select',
      options: ['wait', 'process', 'finish', 'error'],
    },
    percent: { control: { type: 'number', min: 0, max: 100 } },
    initial: { control: 'number' },
    maxCount: { control: 'number' },
    offset: { control: 'number' },
    clickable: { control: 'boolean' },
    responsive: { control: 'boolean' },
    breakpoint: { control: 'number' },
    announce: { control: 'boolean' },
    classNames: { control: false },
    styles: { control: false },
    statusIcons: { control: false },
    dotTemplate: { control: false },
    labels: { control: false },
  },
  args: {
    current: 1,
    orientation: 'horizontal',
    type: 'default',
    variant: 'soft',
    size: 'default',
    titlePlacement: 'horizontal',
    connector: 'solid',
    status: 'process',
    initial: 1,
    offset: 0,
    clickable: false,
    responsive: true,
    breakpoint: 480,
    announce: true,
  },
  render: (args) => ({
    props: args,
    template: `
      <andes-steps
        aria-label="Purchase order progress"
        [current]="current"
        [orientation]="orientation"
        [type]="type"
        [variant]="variant"
        [size]="size"
        [titlePlacement]="titlePlacement"
        [connector]="connector"
        [status]="status"
        [percent]="percent"
        [initial]="initial"
        [maxCount]="maxCount"
        [offset]="offset"
        [clickable]="clickable"
        [responsive]="responsive"
        [breakpoint]="breakpoint"
        [announce]="announce"
      >
        <andes-step title="Requested" subtitle="Mon" description="Created by Lucia" />
        <andes-step title="Approved" subtitle="Tue" description="Finance signed off" />
        <andes-step title="Shipped" description="Carrier pickup" />
        <andes-step title="Delivered" description="Warehouse 4" />
        <andes-step title="Closed" />
      </andes-steps>`,
  }),
};

export default meta;

type Story = StoryObj<AndesSteps>;

export const Playground: Story = {
  name: 'Playground',
  parameters: about(
    'Change any input in the controls panel to see how the trail reacts: type, variant, size, placement, connector, status, progress and more.',
  ),
};

export const Basic: Story = {
  name: 'Basic',
  parameters: about(
    'The finished steps show a check, the current one is filled, and the ones to come stay outlined, all derived from the current step.',
  ),
  render: () => ({
    template: `<andes-steps aria-label="Sign up" [current]="1">${FOUR}</andes-steps>`,
  }),
};

export const WithDescriptions: Story = {
  name: 'With descriptions',
  parameters: about(
    'A description under each title says what happens in that step, in muted text that wraps instead of overflowing.',
  ),
  render: () => ({
    template: `<andes-steps aria-label="Sign up" [current]="1">${FOUR_DESCRIBED}</andes-steps>`,
  }),
};

export const WithSubtitles: Story = {
  name: 'With sub titles',
  parameters: about(
    'A sub title sits beside the title for a short secondary fact such as a time, a count or a countdown.',
  ),
  render: () => ({
    template: `
      <andes-steps aria-label="Order" [current]="1">
        <andes-step title="Requested" subtitle="Mon 14:20" description="Created by Lucia Paredes" />
        <andes-step title="Approved" subtitle="Left 00:00:08" description="Finance is reviewing" />
        <andes-step title="Shipped" subtitle="Thu" description="Carrier pickup scheduled" />
      </andes-steps>`,
  }),
};

export const Vertical: Story = {
  name: 'Vertical',
  parameters: about(
    'Set orientation to vertical to stack the steps down the page, with the connector running between the markers.',
  ),
  render: () => ({
    template: `
      <andes-steps aria-label="Onboarding" orientation="vertical" [current]="1">
        <andes-step title="Create workspace" description="Name it and pick a region." />
        <andes-step title="Invite your team" description="Teammates join with a single link." />
        <andes-step title="Connect a data source" description="Import customers, items and open orders." />
        <andes-step title="Go live" />
      </andes-steps>`,
  }),
};

export const Clickable: Story = {
  name: 'Clickable',
  parameters: about(
    'With clickable, every step is a button: a click selects it, updates current and emits changed.',
  ),
  render: () => ({
    props: { picked: 1 },
    template: `
      <andes-steps aria-label="Profile" clickable [(current)]="picked">${FOUR_DESCRIBED}</andes-steps>
      <p style="margin: 1.25rem 0 0; font-size: 0.875rem; color: var(--andes-color-muted-foreground)">Selected: step {{ picked + 1 }}</p>`,
  }),
};

export const Types: Story = {
  name: 'Five types',
  parameters: about(
    'The same four steps drawn as numbered markers, dots, a segmented panel, navigation tabs and compact inline segments.',
  ),
  render: () => ({
    template: demos(
      demo(
        'default',
        `<andes-steps aria-label="Default" [current]="1">${FOUR}</andes-steps>`,
      ),
      demo(
        'dot',
        `<andes-steps aria-label="Dot" type="dot" [current]="1">${FOUR}</andes-steps>`,
      ),
      demo(
        'panel',
        `<andes-steps aria-label="Panel" type="panel" [current]="1">${FOUR}</andes-steps>`,
      ),
      demo(
        'navigation',
        `<andes-steps aria-label="Navigation" type="navigation" [current]="1">${FOUR}</andes-steps>`,
      ),
      demo(
        'inline',
        `<andes-steps aria-label="Inline" type="inline" [current]="1">${FOUR}</andes-steps>`,
        'max-width: 32rem',
      ),
    ),
  }),
};

export const Sizes: Story = {
  name: 'Two sizes',
  parameters: about(
    'The default size draws a 24px marker and the small size a 20px one, with the text scaled to match.',
  ),
  render: () => ({
    template: demos(
      demo(
        'default',
        `<andes-steps aria-label="Default size" [current]="1">${FOUR_DESCRIBED}</andes-steps>`,
      ),
      demo(
        'small',
        `<andes-steps aria-label="Small size" size="small" [current]="1">${FOUR_DESCRIBED}</andes-steps>`,
      ),
    ),
  }),
};

export const WithContent: Story = {
  name: 'With content for each step',
  parameters: about(
    'A step panel shows the content of the step in progress while the other panels stay hidden, and the buttons move the trail.',
  ),
  render: () => ({
    props: { stage: 0 },
    template: `
      <andes-steps #trail aria-label="Create a report" [(current)]="stage">
        <andes-step title="Source" />
        <andes-step title="Filters" />
        <andes-step title="Share" />
        <andes-step-panel style="padding-block: 1.5rem; font-size: 0.875rem">Pick the data source for the report.</andes-step-panel>
        <andes-step-panel style="padding-block: 1.5rem; font-size: 0.875rem">Choose the period and the branches to include.</andes-step-panel>
        <andes-step-panel style="padding-block: 1.5rem; font-size: 0.875rem">Decide who receives the report every Monday.</andes-step-panel>
      </andes-steps>
      <div style="display: flex; gap: 0.75rem">
        <andes-button variant="outline" [disabled]="stage === 0" (click)="trail.previous()">Back</andes-button>
        <andes-button [disabled]="stage === 2" (click)="trail.next()">Next</andes-button>
      </div>`,
  }),
};

export const Three: Story = {
  name: 'Three steps',
  parameters: about(
    'The smallest useful trail: a start, a middle and an end, here with the middle step in progress.',
  ),
  render: () => ({
    template: `<andes-steps aria-label="Verification" [current]="1">${THREE}</andes-steps>`,
  }),
};
