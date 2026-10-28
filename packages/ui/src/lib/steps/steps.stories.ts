import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';

import { AndesButton } from '../button/button';
import { AndesStep } from './step';
import { AndesSteps } from './steps';

const meta: Meta<AndesSteps> = {
  title: 'Navigation/Steps',
  component: AndesSteps,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({ imports: [AndesSteps, AndesStep, AndesButton] }),
  ],
  parameters: { layout: 'padded' },
  argTypes: {
    current: { control: { type: 'number', min: 0, max: 4 } },
    orientation: {
      control: 'inline-radio',
      options: ['horizontal', 'vertical'],
    },
    variant: {
      control: 'select',
      options: ['default', 'dot', 'navigation', 'inline'],
    },
    size: { control: 'inline-radio', options: ['default', 'small'] },
    labelPlacement: {
      control: 'inline-radio',
      options: ['horizontal', 'vertical'],
    },
    status: {
      control: 'select',
      options: ['wait', 'process', 'finish', 'error'],
    },
    percent: { control: { type: 'number', min: 0, max: 100 } },
    clickable: { control: 'boolean' },
    responsive: { control: 'boolean' },
    breakpoint: { control: 'number' },
    announce: { control: 'boolean' },
  },
  args: {
    current: 1,
    orientation: 'horizontal',
    variant: 'default',
    size: 'default',
    labelPlacement: 'horizontal',
    status: 'process',
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
        [variant]="variant"
        [size]="size"
        [labelPlacement]="labelPlacement"
        [status]="status"
        [percent]="percent"
        [clickable]="clickable"
        [responsive]="responsive"
        [breakpoint]="breakpoint"
        [announce]="announce"
      >
        <andes-step title="Requested" />
        <andes-step title="Approved" />
        <andes-step title="Shipped" />
        <andes-step title="Delivered" />
      </andes-steps>`,
  }),
};

export default meta;

type Story = StoryObj<AndesSteps>;

const CAPTION =
  'margin: 0 0 0.5rem; font: 0.75rem var(--andes-font-family), sans-serif; color: var(--andes-color-muted-foreground);';

export const Default: Story = {};

/**
 * How a trail is laid out: with descriptions and timestamps at the default and `small` sizes,
 * with the label placed below the marker (`labelPlacement="vertical"`) and stacked
 * (`orientation="vertical"`).
 */
export const Layouts: Story = {
  render: () => ({
    template: `
      <div style="display: grid; gap: 2.5rem;">
        <div>
          <p style="${CAPTION}">Descriptions, default size</p>
          <andes-steps aria-label="Order fulfilment" [current]="1">
            <andes-step title="Requested" subtitle="Mon 14:20" description="Created by Lucia Paredes" />
            <andes-step title="Approved" subtitle="Tue 09:05" description="Finance signed off" />
            <andes-step title="Shipped" description="Carrier pickup scheduled" />
            <andes-step title="Delivered" description="Goes to warehouse 4" />
          </andes-steps>
        </div>
        <div>
          <p style="${CAPTION}">Small</p>
          <andes-steps aria-label="Order fulfilment, small" [current]="1" size="small">
            <andes-step title="Requested" subtitle="Mon 14:20" description="Created by Lucia Paredes" />
            <andes-step title="Approved" subtitle="Tue 09:05" description="Finance signed off" />
            <andes-step title="Shipped" description="Carrier pickup scheduled" />
            <andes-step title="Delivered" description="Goes to warehouse 4" />
          </andes-steps>
        </div>
        <div>
          <p style="${CAPTION}">Label below</p>
          <andes-steps aria-label="Checkout" [current]="2" labelPlacement="vertical">
            <andes-step title="Cart" description="3 items" />
            <andes-step title="Shipping" description="Lima, PE" />
            <andes-step title="Payment" description="Card ending 4242" />
            <andes-step title="Confirmation" />
          </andes-steps>
        </div>
        <div>
          <p style="${CAPTION}">Vertical</p>
          <andes-steps aria-label="Onboarding" [current]="2" orientation="vertical">
            <andes-step title="Create workspace" description="Name it and pick a region." />
            <andes-step title="Invite your team" description="Teammates join with a single link." />
            <andes-step title="Connect a data source" description="Import customers, items and open orders." />
            <andes-step title="Go live" />
          </andes-steps>
        </div>
      </div>`,
  }),
};

/**
 * The visual variants: `dot` (horizontal and stacked), `navigation` (clickable, with a disabled
 * step) and `inline` (compact, for a narrow column).
 */
export const Variants: Story = {
  render: () => ({
    template: `
      <div style="display: grid; gap: 2.5rem;">
        <div>
          <p style="${CAPTION}">Dot</p>
          <andes-steps aria-label="Release train" [current]="2" variant="dot">
            <andes-step title="Planned" description="Sprint 41" />
            <andes-step title="Built" description="CI green" />
            <andes-step title="In QA" description="Regression suite" />
            <andes-step title="Released" />
          </andes-steps>
        </div>
        <div>
          <p style="${CAPTION}">Dot, stacked</p>
          <andes-steps aria-label="Release train, stacked" [current]="2" variant="dot" orientation="vertical">
            <andes-step title="Planned" description="Sprint 41" />
            <andes-step title="Built" description="CI green" />
            <andes-step title="In QA" description="Regression suite" />
            <andes-step title="Released" />
          </andes-steps>
        </div>
        <div>
          <p style="${CAPTION}">Navigation</p>
          <andes-steps aria-label="Report wizard" [current]="1" variant="navigation" [clickable]="true">
            <andes-step title="Filters" description="Period and branch" />
            <andes-step title="Columns" description="What to include" />
            <andes-step title="Schedule" description="Who gets it" />
            <andes-step title="Review" [disabled]="true" />
          </andes-steps>
        </div>
        <div style="max-width: 28rem">
          <p style="${CAPTION}">Inline</p>
          <andes-steps aria-label="Upload status" [current]="1" variant="inline">
            <andes-step title="Upload" description="orders.csv" />
            <andes-step title="Validate" description="1,204 rows" />
            <andes-step title="Import" />
          </andes-steps>
        </div>
      </div>`,
  }),
};

/**
 * Status and progress: a trail with `status="error"` on the current step, one step with its own
 * `status="error"` (the later steps stay waiting), and `percent` on the current step.
 */
export const Status: Story = {
  render: () => ({
    template: `
      <div style="display: grid; gap: 2.5rem;">
        <div>
          <p style="${CAPTION}">status="error" on the trail</p>
          <andes-steps aria-label="Import progress" [current]="2" status="error">
            <andes-step title="Upload" description="orders.csv" />
            <andes-step title="Validate" description="1,204 rows" />
            <andes-step title="Import" description="Failed on row 311" />
            <andes-step title="Done" />
          </andes-steps>
        </div>
        <div>
          <p style="${CAPTION}">status on a single step</p>
          <andes-steps aria-label="Approval chain" [current]="3">
            <andes-step title="Draft" />
            <andes-step title="Legal" status="error" description="Clause 4 rejected" />
            <andes-step title="Finance" />
            <andes-step title="Director" />
          </andes-steps>
        </div>
        <div>
          <p style="${CAPTION}">percent: 60</p>
          <andes-steps aria-label="Sync progress" [current]="1" [percent]="60">
            <andes-step title="Extract" />
            <andes-step title="Transform" description="60% of 5,000 rows" />
            <andes-step title="Load" />
          </andes-steps>
        </div>
      </div>`,
  }),
};

/**
 * Two ways to drive the current step: a clickable trail with two-way `[(current)]` (a disabled
 * step cannot be selected), and a wizard whose Back and Next buttons move `current`. The demo
 * state is named `pickedStep` / `wizardStep`, not `current`, because `current` is an input of
 * the meta component and Storybook would forward it onto the first instance.
 */
export const Interaction: Story = {
  render: () => ({
    props: {
      pickedStep: 1,
      wizardStep: 0,
      next(this: { wizardStep: number }) {
        this.wizardStep = Math.min(this.wizardStep + 1, 3);
      },
      back(this: { wizardStep: number }) {
        this.wizardStep = Math.max(this.wizardStep - 1, 0);
      },
    },
    template: `
      <div style="display: grid; gap: 2.5rem;">
        <div>
          <andes-steps aria-label="Edit profile" [(current)]="pickedStep" [clickable]="true">
            <andes-step title="Personal" description="Name and contact" />
            <andes-step title="Work" description="Role and manager" />
            <andes-step title="Access" [disabled]="true" description="Needs admin" />
            <andes-step title="Summary" />
          </andes-steps>
          <p style="margin-top: 1rem; font-size: 0.875rem">Selected step: {{ pickedStep + 1 }}</p>
        </div>
        <div>
          <andes-steps aria-label="New supplier" [current]="wizardStep">
            <andes-step title="Company" description="Legal name and tax id" />
            <andes-step title="Contacts" description="Buyers and billing" />
            <andes-step title="Terms" description="Payment and delivery" />
            <andes-step title="Review" />
          </andes-steps>
          <div style="display:flex; gap: .5rem; margin-top: 1.5rem">
            <andes-button variant="outline" [disabled]="wizardStep === 0" (click)="back()">Back</andes-button>
            <andes-button [disabled]="wizardStep === 3" (click)="next()">Next</andes-button>
          </div>
        </div>
      </div>`,
  }),
};

export const CustomContent: Story = {
  render: () => ({
    template: `
      <andes-steps aria-label="Shipment" [current]="1">
        <andes-step [title]="titleTpl" [icon]="iconTpl" description="Packed at dock 2" />
        <andes-step title="In transit" [icon]="iconTpl">
          <span style="font-size: .75rem">ETA <strong>Thu</strong></span>
        </andes-step>
        <andes-step title="Delivered" [icon]="iconTpl" />
      </andes-steps>
      <ng-template #titleTpl><span><strong>Warehouse</strong> <em>(Lima)</em></span></ng-template>
      <ng-template #iconTpl let-status let-index="index">
        <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
          @if (index === 0) { <path d="M2.5 5.5 8 2.5l5.5 3v5L8 13.5l-5.5-3z" /> }
          @else if (index === 1) { <path d="M1.5 4h8v6h-8zM9.5 6.5h3l2 2V10h-5" /> }
          @else { <path d="M3 8.5l3.5 3.5L13 5" /> }
        </svg>
      </ng-template>`,
  }),
};

export const ResponsiveCollapse: Story = {
  render: () => ({
    template: `
      <p style="font-size: .75rem; margin: 0 0 .5rem">Container below 480px stacks vertically.</p>
      <div style="width: 340px; resize: horizontal; overflow: auto; border: 1px dashed var(--andes-color-border); padding: 1rem">
        <andes-steps aria-label="Resizable trail" [current]="1">
          <andes-step title="Account" description="Create a login" />
          <andes-step title="Billing" description="Add a card" />
          <andes-step title="Review" />
        </andes-steps>
      </div>`,
  }),
};

export const Rtl: Story = {
  render: () => ({
    template: `
      <div dir="rtl">
        <andes-steps aria-label="Progress" [current]="1" [clickable]="true">
          <andes-step title="Account" description="Create a login" />
          <andes-step title="Billing" description="Add a card" />
          <andes-step title="Review" />
        </andes-steps>
        <div style="margin-top: 2rem">
          <andes-steps aria-label="Navigation" [current]="1" variant="navigation">
            <andes-step title="Filters" />
            <andes-step title="Columns" />
            <andes-step title="Review" />
          </andes-steps>
        </div>
      </div>`,
  }),
};
