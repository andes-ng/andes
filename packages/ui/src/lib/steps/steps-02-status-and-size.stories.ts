import { Component, DestroyRef, inject, signal } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';

import {
  about,
  demo,
  demos,
  FOUR,
  FOUR_DESCRIBED,
  muted,
  withDescription,
  withStepsKit,
} from '../../testing/steps-story-kit';
import { AndesSegmented } from '../segmented/segmented';
import { AndesStep } from './step';
import { AndesSteps } from './steps';

/** A sub title that counts down, to show a value that changes while the step is in progress. */
@Component({
  selector: 'andes-steps-countdown',
  imports: [AndesSteps, AndesStep],
  template: `
    <andes-steps aria-label="Payment window" [current]="1">
      <andes-step
        title="Order placed"
        subtitle="Done"
        description="Confirmation sent"
      />
      <andes-step
        title="Waiting for payment"
        [subtitle]="left()"
        description="The reservation expires when the time runs out"
      />
      <andes-step title="Packing" />
    </andes-steps>
  `,
})
class CountdownDemo {
  protected readonly left = signal('Left 00:00:08');
  private seconds = 8;

  constructor() {
    const timer = setInterval(() => {
      this.seconds = this.seconds === 0 ? 8 : this.seconds - 1;
      this.left.set(`Left 00:00:0${this.seconds}`);
    }, 1000);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));
  }
}

/** A segmented control that picks the current step of the trail under it. */
@Component({
  selector: 'andes-steps-picker',
  imports: [AndesSteps, AndesStep, AndesSegmented],
  template: `
    <andes-segmented
      aria-label="Current step"
      style="margin-block-end: 1.5rem"
      [options]="options"
      [(value)]="picked"
    />
    <andes-steps aria-label="Release" [current]="picked() ?? 0">
      <andes-step title="Plan" description="Scope the work" />
      <andes-step title="Build" description="Write the code" />
      <andes-step title="Test" description="Run the suites" />
      <andes-step title="Ship" description="Publish it" />
    </andes-steps>
  `,
})
class PickerDemo {
  protected readonly picked = signal<number | null>(1);
  protected readonly options = [
    { value: -1, label: 'None' },
    { value: 0, label: '1' },
    { value: 1, label: '2' },
    { value: 2, label: '3' },
    { value: 3, label: '4' },
    { value: 4, label: 'Past the end' },
  ];
}

const meta: Meta<AndesSteps> = {
  title: 'Navigation/Steps/Status and size',
  component: AndesSteps,
  tags: ['autodocs'],
  decorators: [
    withDescription,
    withStepsKit,
    moduleMetadata({
      imports: [AndesSteps, AndesStep, NgIcon, CountdownDemo, PickerDemo],
    }),
  ],
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<AndesSteps>;

const COPY = `
  <andes-step title="Finished" description="This step is done" />
  <andes-step title="In progress" description="This step is current" />
  <andes-step title="Waiting" description="This step is next" />
  <andes-step title="Failed" status="error" description="This step has its own status" />`;

export const AllStatuses: Story = {
  name: 'The four statuses',
  parameters: about(
    'A step is finished before the current one, in progress at it, waiting after it, and error when its own status says so.',
  ),
  render: () => ({
    template: `<andes-steps aria-label="Statuses" [current]="1">${COPY}</andes-steps>`,
  }),
};

export const ErrorOnCurrent: Story = {
  name: 'Error on the current step',
  parameters: about(
    'Setting status to error on the trail turns the current step red, for a step whose validation or request failed.',
  ),
  render: () => ({
    template: `
      <andes-steps aria-label="Import" status="error" [current]="1">
        <andes-step title="Upload" description="orders.csv" />
        <andes-step title="Validate" description="Row 311 has no price" />
        <andes-step title="Import" />
      </andes-steps>`,
  }),
};

export const ErrorVertical: Story = {
  name: 'Error on a vertical trail',
  parameters: about(
    'The error colour follows the marker, the title and the connector of the failed step in the stacked layout too.',
  ),
  render: () => ({
    template: `
      <andes-steps aria-label="Deployment" orientation="vertical" status="error" [current]="2">
        <andes-step title="Build" description="Compiled in 42 seconds" />
        <andes-step title="Test" description="1,204 tests passed" />
        <andes-step title="Deploy" description="The health check failed on the second instance" />
        <andes-step title="Announce" />
      </andes-steps>`,
  }),
};

export const StatusPerStep: Story = {
  name: 'Status set on one step',
  parameters: about(
    'A step with its own status keeps it whatever the current step is, so one rejected approval does not stop the later ones from waiting.',
  ),
  render: () => ({
    template: `
      <andes-steps aria-label="Approvals" [current]="3">
        <andes-step title="Draft" />
        <andes-step title="Legal" status="error" description="Clause 4 was rejected" />
        <andes-step title="Finance" description="Approved" />
        <andes-step title="Director" description="Waiting for a signature" />
      </andes-steps>`,
  }),
};

export const NothingStarted: Story = {
  name: 'Nothing started',
  parameters: about(
    'A current step of minus one leaves every step waiting, for a flow the user has not entered yet.',
  ),
  render: () => ({
    template: `<andes-steps aria-label="Not started" [current]="-1">${FOUR_DESCRIBED}</andes-steps>`,
  }),
};

export const AllFinished: Story = {
  name: 'Everything finished',
  parameters: about(
    'A current step past the last one shows every step as finished, for a flow that is complete.',
  ),
  render: () => ({
    template: `<andes-steps aria-label="Complete" [current]="4">${FOUR_DESCRIBED}</andes-steps>`,
  }),
};

export const Countdown: Story = {
  name: 'Sub title that changes',
  parameters: about(
    'The sub title can hold a value that updates while the step is in progress, such as the time left to pay.',
  ),
  render: () => ({ template: `<andes-steps-countdown />` }),
};

export const PickCurrent: Story = {
  name: 'Choose the current step',
  parameters: about(
    'The current step comes from a single number: pick it below to see every step before it finish and every step after it wait.',
  ),
  render: () => ({ template: `<andes-steps-picker />` }),
};

const MIXED = `
  <andes-step title="Account" description="Created" />
  <andes-step title="Billing" description="Card added" />
  <andes-step title="Review" description="In progress" />
  <andes-step title="Done" description="Not yet" />`;

export const SoftVariant: Story = {
  name: 'Soft variant',
  parameters: about(
    'The default variant tints finished markers and fills the current one, so progress reads at a glance without heavy colour.',
  ),
  render: () => ({
    template: demos(
      demo(
        'current',
        `<andes-steps aria-label="Soft" variant="soft" [current]="2">${MIXED}</andes-steps>`,
      ),
      demo(
        'error',
        `<andes-steps aria-label="Soft with an error" variant="soft" status="error" [current]="2">${MIXED}</andes-steps>`,
      ),
    ),
  }),
};

export const SolidVariant: Story = {
  name: 'Solid variant',
  parameters: about(
    'The solid variant fills every reached marker, so the finished steps are as strong as the current one.',
  ),
  render: () => ({
    template: demos(
      demo(
        'current',
        `<andes-steps aria-label="Solid" variant="solid" [current]="2">${MIXED}</andes-steps>`,
      ),
      demo(
        'error',
        `<andes-steps aria-label="Solid with an error" variant="solid" status="error" [current]="2">${MIXED}</andes-steps>`,
      ),
    ),
  }),
};

export const OutlineVariant: Story = {
  name: 'Outline variant',
  parameters: about(
    'The outline variant draws rings only, which suits a light page where filled discs would feel heavy.',
  ),
  render: () => ({
    template: demos(
      demo(
        'current',
        `<andes-steps aria-label="Outline" variant="outline" [current]="2">${MIXED}</andes-steps>`,
      ),
      demo(
        'error',
        `<andes-steps aria-label="Outline with an error" variant="outline" status="error" [current]="2">${MIXED}</andes-steps>`,
      ),
    ),
  }),
};

export const PlainVariant: Story = {
  name: 'Plain variant',
  parameters: about(
    'The plain variant drops the disc, so the number or the check sits on the page and only its colour tells the status.',
  ),
  render: () => ({
    template: demos(
      demo(
        'current',
        `<andes-steps aria-label="Plain" variant="plain" [current]="2">${MIXED}</andes-steps>`,
      ),
      demo(
        'error',
        `<andes-steps aria-label="Plain with an error" variant="plain" status="error" [current]="2">${MIXED}</andes-steps>`,
      ),
    ),
  }),
};

export const VariantsVertical: Story = {
  name: 'Variants stacked',
  parameters: about(
    'Each variant also applies to the vertical layout, shown here side by side with the same four steps.',
  ),
  render: () => ({
    template: `
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(13rem, 1fr)); gap: 2rem">
        ${['soft', 'solid', 'outline', 'plain']
          .map((variant) =>
            demo(
              variant,
              `<andes-steps aria-label="${variant}" orientation="vertical" variant="${variant}" [current]="2">${FOUR}</andes-steps>`,
            ),
          )
          .join('')}
      </div>`,
  }),
};

export const DefaultSize: Story = {
  name: 'Default size',
  parameters: about(
    'The default size has a 24px marker, a 14px title and a 13px description.',
  ),
  render: () => ({
    template: `<andes-steps aria-label="Default size" [current]="1">${FOUR_DESCRIBED}</andes-steps>`,
  }),
};

export const SmallSize: Story = {
  name: 'Small size',
  parameters: about(
    'The small size has a 20px marker and tighter spacing, for toolbars, cards and table rows.',
  ),
  render: () => ({
    template: `<andes-steps aria-label="Small size" size="small" [current]="1">${FOUR_DESCRIBED}</andes-steps>`,
  }),
};

export const SmallVariants: Story = {
  name: 'Small size in every variant',
  parameters: about(
    'The small size keeps the shape of every variant, with the glyph and the number scaled to the 20px marker.',
  ),
  render: () => ({
    template: demos(
      ...['soft', 'solid', 'outline', 'plain'].map((variant) =>
        demo(
          variant,
          `<andes-steps aria-label="Small ${variant}" size="small" variant="${variant}" [current]="2">${FOUR}</andes-steps>`,
        ),
      ),
    ),
  }),
};

export const SmallVertical: Story = {
  name: 'Small size stacked',
  parameters: about(
    'The stacked layout scales its markers, text and connector down with the small size.',
  ),
  render: () => ({
    template: `
      <andes-steps aria-label="Small stacked" size="small" orientation="vertical" [current]="1">${FOUR_DESCRIBED}</andes-steps>`,
  }),
};

export const StartingNumber: Story = {
  name: 'Starting number',
  parameters: about(
    'The initial input sets the number shown on the first step, here counting from 0 and from 5, while current stays the position.',
  ),
  render: () => ({
    template: demos(
      demo(
        'initial 0',
        `<andes-steps aria-label="From zero" [initial]="0" [current]="1">${FOUR}</andes-steps>`,
      ),
      demo(
        'initial 5',
        `<andes-steps aria-label="From five" [initial]="5" [current]="1">${FOUR}</andes-steps>`,
      ),
    ),
  }),
};

export const Legend: Story = {
  name: 'Status words',
  parameters: about(
    'Every status also reaches assistive technology as a visually hidden word, and the strings can be replaced with the labels input.',
  ),
  render: () => ({
    props: {
      french: {
        wait: 'A venir',
        process: 'En cours',
        finish: 'Termine',
        error: 'Erreur',
      },
    },
    template: `
      <p style="${muted} margin: 0 0 1rem">Inspect the markup: each title is followed by a hidden word.</p>
      <andes-steps aria-label="Commande" [labels]="french" [current]="1">${FOUR}</andes-steps>`,
  }),
};
