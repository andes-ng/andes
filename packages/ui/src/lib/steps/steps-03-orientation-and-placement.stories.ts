import { NgIcon } from '@ng-icons/core';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';

import {
  about,
  demo,
  demos,
  FOUR,
  FOUR_DESCRIBED,
  phone,
  resizable,
  withDescription,
  withStepsKit,
} from '../../testing/steps-story-kit';
import { AndesStep } from './step';
import { AndesSteps } from './steps';

const meta: Meta<AndesSteps> = {
  title: 'Navigation/Steps/Orientation and placement',
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

const ICONS = `
  <andes-step title="Packed" icon="lucideBox" description="Left the warehouse" />
  <andes-step title="In transit" icon="lucideTruck" description="Two stops to go" />
  <andes-step title="Delivered" icon="lucideHouse" description="Signed by the receiver" />`;

export const Horizontal: Story = {
  name: 'Horizontal',
  parameters: about(
    'The default layout runs the steps along the line, each connector filling the space between two steps.',
  ),
  render: () => ({
    template: `<andes-steps aria-label="Horizontal" [current]="1">${FOUR}</andes-steps>`,
  }),
};

export const VerticalBasic: Story = {
  name: 'Vertical',
  parameters: about(
    'The vertical orientation stacks the steps, with a connector under every marker except the last.',
  ),
  render: () => ({
    template: `<andes-steps aria-label="Vertical" orientation="vertical" [current]="1">${FOUR}</andes-steps>`,
  }),
};

export const VerticalDescriptions: Story = {
  name: 'Vertical with descriptions',
  parameters: about(
    'In the stacked layout a description has the full width under its title, so longer text reads comfortably.',
  ),
  render: () => ({
    template: `
      <andes-steps aria-label="Vertical" orientation="vertical" [current]="1" style="max-width: 28rem">
        <andes-step title="Create workspace" subtitle="2 min" description="Name it and pick a region. You can change both later in the settings." />
        <andes-step title="Invite your team" subtitle="1 min" description="Teammates join with a single link that you can revoke at any time." />
        <andes-step title="Connect a data source" description="Import customers, items and open orders from a spreadsheet or the API." />
        <andes-step title="Go live" />
      </andes-steps>`,
  }),
};

export const VerticalIcons: Story = {
  name: 'Vertical with icons',
  parameters: about(
    'A lucide icon name on each step replaces the number, here for a delivery that moves from the warehouse to a door.',
  ),
  render: () => ({
    template: `<andes-steps aria-label="Delivery" orientation="vertical" [current]="1">${ICONS}</andes-steps>`,
  }),
};

export const VerticalDots: Story = {
  name: 'Vertical with dots',
  parameters: about(
    'The dot type stacks too, with a small dot on the connector and the title beside it, like a timeline.',
  ),
  render: () => ({
    template: `<andes-steps aria-label="Timeline" type="dot" orientation="vertical" [current]="1">${FOUR_DESCRIBED}</andes-steps>`,
  }),
};

export const VerticalSmall: Story = {
  name: 'Vertical, small',
  parameters: about(
    'The small size narrows the marker column and the spacing, to fit a sidebar or a drawer.',
  ),
  render: () => ({
    template: `<andes-steps aria-label="Sidebar" size="small" orientation="vertical" [current]="2" style="max-width: 16rem">${FOUR_DESCRIBED}</andes-steps>`,
  }),
};

export const TitleBeside: Story = {
  name: 'Title beside the marker',
  parameters: about(
    'By default the title and the description sit beside the marker, which keeps the trail one row tall.',
  ),
  render: () => ({
    template: `<andes-steps aria-label="Beside" titlePlacement="horizontal" [current]="1">${FOUR_DESCRIBED}</andes-steps>`,
  }),
};

export const TitleBelow: Story = {
  name: 'Title below the marker',
  parameters: about(
    'With the title placed below, the markers sit on one line and the connectors run between them, with the titles aligned under each marker.',
  ),
  render: () => ({
    template: `<andes-steps aria-label="Below" titlePlacement="vertical" [current]="1">${FOUR}</andes-steps>`,
  }),
};

export const TitleBelowDescriptions: Story = {
  name: 'Title below with descriptions',
  parameters: about(
    'Descriptions fall under the titles and can use the whole width of their step.',
  ),
  render: () => ({
    template: `<andes-steps aria-label="Below" titlePlacement="vertical" [current]="2">${FOUR_DESCRIBED}</andes-steps>`,
  }),
};

export const TitleBelowSubtitles: Story = {
  name: 'Title below with sub titles',
  parameters: about(
    'A sub title stays on the title line, wrapping under it when the step is narrow.',
  ),
  render: () => ({
    template: `
      <andes-steps aria-label="Below" titlePlacement="vertical" [current]="1">
        <andes-step title="Requested" subtitle="Mon 14:20" description="Lucia Paredes" />
        <andes-step title="Approved" subtitle="Tue 09:05" description="Finance" />
        <andes-step title="Shipped" subtitle="Wed" description="Carrier pickup" />
      </andes-steps>`,
  }),
};

export const TitleBelowIcons: Story = {
  name: 'Title below with icons',
  parameters: about(
    'Icons in the markers and titles underneath make a compact, readable tracker.',
  ),
  render: () => ({
    template: `<andes-steps aria-label="Delivery" titlePlacement="vertical" [current]="1">${ICONS}</andes-steps>`,
  }),
};

export const TitleBelowSmall: Story = {
  name: 'Title below, small',
  parameters: about(
    'The small size keeps the markers close to their titles while the connectors stay clear of both.',
  ),
  render: () => ({
    template: `<andes-steps aria-label="Small" size="small" titlePlacement="vertical" [current]="1">${FOUR_DESCRIBED}</andes-steps>`,
  }),
};

export const TitlePlacementIgnoredVertical: Story = {
  name: 'Title placement on a stacked trail',
  parameters: about(
    'Title placement applies to the horizontal layout only, so a stacked trail looks the same with either value.',
  ),
  render: () => ({
    template: demos(
      demo(
        'beside',
        `<andes-steps aria-label="Beside" orientation="vertical" titlePlacement="horizontal" [current]="1">${FOUR}</andes-steps>`,
      ),
      demo(
        'below',
        `<andes-steps aria-label="Below" orientation="vertical" titlePlacement="vertical" [current]="1">${FOUR}</andes-steps>`,
      ),
    ),
  }),
};

export const LongTitles: Story = {
  name: 'Long titles',
  parameters: about(
    'Long titles and descriptions wrap inside their step instead of pushing the trail wider than its container.',
  ),
  render: () => ({
    template: `
      <andes-steps aria-label="Long text" [current]="1" style="max-width: 44rem">
        <andes-step title="Confirm the billing address of the organisation" description="Make sure the legal name matches the tax registration." />
        <andes-step title="Upload the supporting documents" description="Pdf or image files up to ten megabytes each." />
        <andes-step title="Wait for the compliance review" />
      </andes-steps>`,
  }),
};

export const ResponsiveCollapse: Story = {
  name: 'Collapses when narrow',
  parameters: about(
    'Drag the corner to make the container narrower than 480px and the horizontal trail switches to the stacked layout.',
  ),
  render: () => ({
    template: `
      <div style="${resizable}">
        <andes-steps aria-label="Resizable" [current]="1">${FOUR_DESCRIBED}</andes-steps>
      </div>`,
  }),
};

export const CustomBreakpoint: Story = {
  name: 'Collapse breakpoint',
  parameters: about(
    'The breakpoint input moves the width at which the trail stacks, here 700px for a trail with long descriptions.',
  ),
  render: () => ({
    template: `
      <div style="${resizable} width: 48rem">
        <andes-steps aria-label="Breakpoint" [breakpoint]="700" [current]="1">${FOUR_DESCRIBED}</andes-steps>
      </div>`,
  }),
};

export const ResponsiveOff: Story = {
  name: 'Never collapses',
  parameters: about(
    'With responsive off the trail stays horizontal at any width, and scrolls sideways when it does not fit.',
  ),
  render: () => ({
    template: `
      <div style="${resizable} width: 18rem">
        <andes-steps aria-label="Fixed" [responsive]="false" titlePlacement="vertical" [current]="1">${FOUR}</andes-steps>
      </div>`,
  }),
};

export const PhoneWidth: Story = {
  name: 'At phone width',
  parameters: about(
    'In a 360px frame the numbered trail stacks, and the compact inline trail keeps its row with narrower segments.',
  ),
  render: () => ({
    template: `
      <div style="display: flex; flex-wrap: wrap; gap: 2rem">
        <div style="${phone}">
          <andes-steps aria-label="Phone default" [current]="1">${FOUR_DESCRIBED}</andes-steps>
        </div>
        <div style="${phone}">
          <andes-steps aria-label="Phone inline" type="inline" [current]="1">${FOUR}</andes-steps>
        </div>
      </div>`,
  }),
};
