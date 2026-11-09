import { NgIcon } from '@ng-icons/core';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';

import {
  about,
  caption,
  demo,
  demos,
  FOUR,
  FOUR_DESCRIBED,
  muted,
  surface,
  text,
  withDescription,
  withStepsKit,
} from '../../testing/steps-story-kit';
import { AndesButton } from '../button/button';
import { AndesTag } from '../tag/tag';
import { AndesStep } from './step';
import { AndesSteps } from './steps';

const meta: Meta<AndesSteps> = {
  title: 'Navigation/Steps/Types',
  component: AndesSteps,
  tags: ['autodocs'],
  decorators: [
    withDescription,
    withStepsKit,
    moduleMetadata({
      imports: [AndesSteps, AndesStep, AndesButton, AndesTag, NgIcon],
    }),
  ],
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<AndesSteps>;

const REPORT = `
  <andes-step title="Filters" subtitle="Period" description="Choose the dates and the branches" />
  <andes-step title="Columns" subtitle="Layout" description="Pick what to include" />
  <andes-step title="Schedule" subtitle="Delivery" description="Decide who gets it" />
  <andes-step title="Review" subtitle="Final" description="Check and send" />`;

const COLUMNS = `
  <andes-step title="Quote" subtitle="Day 1" />
  <andes-step title="Order" subtitle="Day 3" />
  <andes-step title="Ship" subtitle="Day 9" />
  <andes-step title="Deliver" subtitle="Day 12" />
  <andes-step title="Invoice" subtitle="Day 14" />`;

export const DefaultType: Story = {
  name: 'Default type',
  parameters: about(
    'The default type joins numbered markers with a connector, and is the one to use for a wizard with a handful of stages.',
  ),
  render: () => ({
    template: `<andes-steps aria-label="Default" [current]="1">${FOUR_DESCRIBED}</andes-steps>`,
  }),
};

const SIGN_IN = `
  <andes-step title="Login" />
  <andes-step title="Verification" />
  <andes-step title="Pay" />
  <andes-step title="Done" />`;

const CONTENT = `
  <andes-step title="Step 1" subtitle="00:00" description="This is a content." />
  <andes-step title="Step 2" subtitle="00:00" description="This is a content." />
  <andes-step title="Step 3" subtitle="00:00" description="This is a content." />`;

const PANEL_FRAME = 'max-width: 44rem';

export const PanelFilled: Story = {
  name: 'Panel, filled',
  parameters: about(
    'The panel type is one bar of chevron-shaped segments that interlock, with the current step in a solid fill, finished steps tinted and the ones to come in a grey wash.',
  ),
  render: () => ({
    template: `<andes-steps aria-label="Sign in" type="panel" [current]="1" style="${PANEL_FRAME}">${SIGN_IN}</andes-steps>`,
  }),
};

export const PanelOutlined: Story = {
  name: 'Panel, outlined',
  parameters: about(
    'The outline variant draws the chevron as a line in the colour of each status around a pale fill, with the edge between two segments drawn once.',
  ),
  render: () => ({
    template: `<andes-steps aria-label="Sign in" type="panel" variant="outline" [current]="1" style="${PANEL_FRAME}">${SIGN_IN}</andes-steps>`,
  }),
};

export const PanelSolid: Story = {
  name: 'Panel, every step solid',
  parameters: about(
    'The solid variant fills every reached segment, the finished ones in a deeper blue than the current one.',
  ),
  render: () => ({
    template: `<andes-steps aria-label="Sign in" type="panel" variant="solid" [current]="2" style="${PANEL_FRAME}">${SIGN_IN}</andes-steps>`,
  }),
};

export const PanelPlain: Story = {
  name: 'Panel, neutral outline',
  parameters: about(
    'The plain variant keeps the chevron outline in one neutral line and lets only the text carry the status.',
  ),
  render: () => ({
    template: `<andes-steps aria-label="Sign in" type="panel" variant="plain" [current]="1" style="${PANEL_FRAME}">${SIGN_IN}</andes-steps>`,
  }),
};

export const PanelDescriptions: Story = {
  name: 'Panel with sub titles and descriptions',
  parameters: about(
    'Each segment shows a title with a sub title beside it and a description under it, left aligned with room before the arrow tip.',
  ),
  render: () => ({
    template: demos(
      demo(
        'filled',
        `<andes-steps aria-label="Filled" type="panel" [current]="1" style="${PANEL_FRAME}">${CONTENT}</andes-steps>`,
      ),
      demo(
        'outlined',
        `<andes-steps aria-label="Outlined" type="panel" variant="outline" [current]="1" style="${PANEL_FRAME}">${CONTENT}</andes-steps>`,
      ),
    ),
  }),
};

export const PanelStatuses: Story = {
  name: 'Panel statuses',
  parameters: about(
    'Finished, in progress, waiting and failed segments side by side, in the filled and the outlined look.',
  ),
  render: () => ({
    template: demos(
      ...['soft', 'outline'].map((variant) =>
        demo(
          variant,
          `<andes-steps aria-label="${variant}" type="panel" variant="${variant}" [current]="1" style="${PANEL_FRAME}">
            <andes-step title="Finished" description="This is a content." />
            <andes-step title="In progress" description="This is a content." />
            <andes-step title="Waiting" description="This is a content." />
            <andes-step title="Failed" status="error" description="This is a content." />
          </andes-steps>`,
        ),
      ),
    ),
  }),
};

export const PanelError: Story = {
  name: 'Panel with an error on the current step',
  parameters: about(
    'A status of error on the trail gives the current segment a pale red wash and red text, and a red outline in the outlined look.',
  ),
  render: () => ({
    template: demos(
      demo(
        'filled',
        `<andes-steps aria-label="Filled error" type="panel" status="error" [current]="1" style="${PANEL_FRAME}">${CONTENT}</andes-steps>`,
      ),
      demo(
        'outlined',
        `<andes-steps aria-label="Outlined error" type="panel" variant="outline" status="error" [current]="1" style="${PANEL_FRAME}">${CONTENT}</andes-steps>`,
      ),
    ),
  }),
};

export const PanelClickable: Story = {
  name: 'Clickable panel',
  parameters: about(
    'A clickable panel shades the segment under the pointer, darkens it while pressed and draws a focus ring that follows the chevron.',
  ),
  render: () => ({
    props: { picked: 1 },
    template: demos(
      demo(
        'filled',
        `<andes-steps aria-label="Filled" type="panel" clickable [(current)]="picked" style="${PANEL_FRAME}">${CONTENT}</andes-steps>`,
      ),
      demo(
        'outlined',
        `<andes-steps aria-label="Outlined" type="panel" variant="outline" clickable [(current)]="picked" style="${PANEL_FRAME}">${CONTENT}</andes-steps>`,
      ),
    ),
  }),
};

export const PanelDisabled: Story = {
  name: 'Panel with a disabled step',
  parameters: about(
    'A disabled segment is dimmed, cannot be selected and is skipped by the arrow keys.',
  ),
  render: () => ({
    template: `
      <andes-steps aria-label="Sign in" type="panel" clickable [current]="1" style="${PANEL_FRAME}">
        <andes-step title="Login" />
        <andes-step title="Verification" />
        <andes-step title="Pay" [disabled]="true" />
        <andes-step title="Done" [disabled]="true" />
      </andes-steps>`,
  }),
};

export const PanelSmall: Story = {
  name: 'Small panel',
  parameters: about(
    'The small size shortens the tip to 16px and trims the padding, for the top of a dialog or a toolbar.',
  ),
  render: () => ({
    template: demos(
      demo(
        'filled',
        `<andes-steps aria-label="Filled" type="panel" size="small" [current]="1" style="${PANEL_FRAME}">${SIGN_IN}</andes-steps>`,
      ),
      demo(
        'outlined',
        `<andes-steps aria-label="Outlined" type="panel" size="small" variant="outline" [current]="1" style="${PANEL_FRAME}">${SIGN_IN}</andes-steps>`,
      ),
    ),
  }),
};

export const PanelVertical: Story = {
  name: 'Stacked panel',
  parameters: about(
    'In the vertical orientation the arrows point down: each segment has a V-shaped notch on top and a tip at the bottom.',
  ),
  render: () => ({
    template: `
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(14rem, 18rem)); gap: 2rem">
        ${demo('filled', `<andes-steps aria-label="Filled" type="panel" orientation="vertical" [current]="1">${CONTENT}</andes-steps>`)}
        ${demo('outlined', `<andes-steps aria-label="Outlined" type="panel" orientation="vertical" variant="outline" [current]="1">${CONTENT}</andes-steps>`)}
      </div>`,
  }),
};

export const PanelIcons: Story = {
  name: 'Panel with icons',
  parameters: about(
    'A step icon is drawn before the title with no circle around it, here for a short sign-in flow.',
  ),
  render: () => ({
    template: `
      <andes-steps aria-label="Sign in" type="panel" [current]="1" style="${PANEL_FRAME}">
        <andes-step title="Login" icon="lucideUser" />
        <andes-step title="Verification" icon="lucideShieldCheck" />
        <andes-step title="Pay" icon="lucideCreditCard" />
        <andes-step title="Done" icon="lucideBadgeCheck" />
      </andes-steps>`,
  }),
};

export const PanelOptional: Story = {
  name: 'Panel with an optional step',
  parameters: about(
    'An optional step shows its muted label after the title, inside the segment.',
  ),
  render: () => ({
    template: `
      <andes-steps aria-label="Setup" type="panel" [current]="1" style="${PANEL_FRAME}">
        <andes-step title="Account" />
        <andes-step title="Photo" optional />
        <andes-step title="Invite" optional="Skippable" />
        <andes-step title="Done" />
      </andes-steps>`,
  }),
};

export const PanelProgress: Story = {
  name: 'Panel with progress',
  parameters: about(
    'The percent input fills the current segment from its start, as a lighter band inside the solid colour or the pale fill.',
  ),
  render: () => ({
    template: demos(
      demo(
        'filled',
        `<andes-steps aria-label="Filled" type="panel" [current]="1" [percent]="60" style="${PANEL_FRAME}">${CONTENT}</andes-steps>`,
      ),
      demo(
        'outlined',
        `<andes-steps aria-label="Outlined" type="panel" variant="outline" [current]="1" [percent]="60" style="${PANEL_FRAME}">${CONTENT}</andes-steps>`,
      ),
    ),
  }),
};

export const PanelInCard: Story = {
  name: 'Panel in a card',
  parameters: about(
    'On a card the fills are mixed over the card colour when the --andes-steps-surface custom property names it.',
  ),
  render: () => ({
    template: `
      <div style="${surface} max-width: 48rem; --andes-steps-surface: var(--andes-color-card)">
        <p style="margin: 0 0 1rem; font-weight: 600">Verify your account</p>
        <andes-steps aria-label="Verify" type="panel" variant="outline" [current]="1">${CONTENT}</andes-steps>
      </div>`,
  }),
};

export const PanelMany: Story = {
  name: 'Panel with many steps',
  parameters: about(
    'A long panel that does not fit scrolls sideways when it must stay horizontal, and stacks below 480px otherwise.',
  ),
  render: () => ({
    template: `
      <div style="max-width: 30rem; border: 1px dashed var(--andes-color-border); padding: 1rem; border-radius: var(--andes-radius-lg)">
        <andes-steps aria-label="Many" type="panel" [responsive]="false" [current]="2">
          ${['Plan', 'Design', 'Build', 'Test', 'Review', 'Release'].map((title) => `<andes-step title="${title}" />`).join('')}
        </andes-steps>
      </div>`,
  }),
};

export const PanelFolded: Story = {
  name: 'Panel with folded steps',
  parameters: about(
    'With maxCount the middle of a long panel folds into one chevron with an ellipsis that opens the list of hidden steps.',
  ),
  render: () => ({
    template: `
      <andes-steps aria-label="Folded" type="panel" [maxCount]="5" [current]="5" style="max-width: 52rem">
        ${['Plan', 'Design', 'Build', 'Test', 'Review', 'Stage', 'Approve', 'Release'].map((title) => `<andes-step title="${title}" />`).join('')}
      </andes-steps>`,
  }),
};

export const PanelNarrow: Story = {
  name: 'Panel on a narrow screen',
  parameters: about(
    'In a container narrower than 480px the panel stacks into a vertical bar with down arrows instead of overflowing.',
  ),
  render: () => ({
    template: `
      <div style="box-sizing: border-box; width: 22.5rem; max-width: 100%; padding: 1rem; border: 1px dashed var(--andes-color-border); border-radius: var(--andes-radius-lg)">
        <andes-steps aria-label="Narrow" type="panel" [current]="1">${CONTENT}</andes-steps>
      </div>`,
  }),
};

export const PanelRightToLeft: Story = {
  name: 'Panel, right to left',
  parameters: {
    dir: 'rtl',
    ...about(
      'Under a right-to-left document the arrows point left, the notch moves to the right edge and the rounded ends swap sides.',
    ),
  },
  render: () => ({
    template: demos(
      demo(
        'filled',
        `<andes-steps aria-label="Filled" type="panel" clickable [current]="1" style="${PANEL_FRAME}">${CONTENT}</andes-steps>`,
      ),
      demo(
        'outlined',
        `<andes-steps aria-label="Outlined" type="panel" variant="outline" [current]="1" style="${PANEL_FRAME}">${CONTENT}</andes-steps>`,
      ),
    ),
  }),
};

export const PanelDark: Story = {
  name: 'Panel, dark theme',
  globals: { theme: 'dark' },
  parameters: about(
    'The filled and the outlined panel in the dark theme, with their text at least 4.5:1 against every fill.',
  ),
  render: () => ({
    template: demos(
      demo(
        'filled',
        `<andes-steps aria-label="Filled" type="panel" [current]="1" style="${PANEL_FRAME}">${CONTENT}</andes-steps>`,
      ),
      demo(
        'error',
        `<andes-steps aria-label="Error" type="panel" status="error" [current]="1" style="${PANEL_FRAME}">${CONTENT}</andes-steps>`,
      ),
      demo(
        'outlined',
        `<andes-steps aria-label="Outlined" type="panel" variant="outline" [current]="1" style="${PANEL_FRAME}">${CONTENT}</andes-steps>`,
      ),
    ),
  }),
};

export const NavigationBasic: Story = {
  name: 'Navigation',
  parameters: about(
    'The navigation type reads like tabs: each step is a link-like cell with a chevron after it and an underline on the current one.',
  ),
  render: () => ({
    props: { picked: 1 },
    template: `<andes-steps aria-label="Navigation" type="navigation" clickable [(current)]="picked">${FOUR}</andes-steps>`,
  }),
};

export const NavigationDetails: Story = {
  name: 'Navigation with sub titles and descriptions',
  parameters: about(
    'Every cell can show a title, a sub title and a description, and the cells share the width equally.',
  ),
  render: () => ({
    props: { picked: 1 },
    template: `<andes-steps aria-label="Report" type="navigation" clickable [(current)]="picked">${REPORT}</andes-steps>`,
  }),
};

export const NavigationHeader: Story = {
  name: 'Navigation in a page header',
  parameters: about(
    'The navigation type fits under the title of a page, where it moves between the sections of a long form.',
  ),
  render: () => ({
    props: { picked: 1 },
    template: `
      <div style="${surface} padding-block-end: 0">
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin-block-end: 1rem">
          <div>
            <h2 style="margin: 0; font: 600 1.125rem/1.75rem var(--andes-font-family), sans-serif">New campaign</h2>
            <p style="margin: 0; ${muted}">Draft saved a minute ago</p>
          </div>
          <andes-button variant="outline">Save and exit</andes-button>
        </div>
        <andes-steps aria-label="Campaign sections" type="navigation" clickable [(current)]="picked">${REPORT}</andes-steps>
      </div>`,
  }),
};

export const NavigationArrowColour: Story = {
  name: 'Navigation chevron colour',
  parameters: about(
    'The chevron between two cells takes its colour from the custom property --andes-steps-nav-arrow-color.',
  ),
  render: () => ({
    template: `<andes-steps aria-label="Navigation" type="navigation" style="--andes-steps-nav-arrow-color: var(--andes-color-primary)" [current]="1">${FOUR}</andes-steps>`,
  }),
};

export const NavigationDisabled: Story = {
  name: 'Navigation with a disabled step',
  parameters: about(
    'A disabled cell is dimmed and cannot be reached, for a section that unlocks later.',
  ),
  render: () => ({
    template: `
      <andes-steps aria-label="Navigation" type="navigation" clickable [current]="1">
        <andes-step title="Filters" />
        <andes-step title="Columns" />
        <andes-step title="Schedule" />
        <andes-step title="Review" [disabled]="true" />
      </andes-steps>`,
  }),
};

export const NavigationError: Story = {
  name: 'Navigation with an error',
  parameters: about(
    'A failed section keeps its place in the row and shows its title and underline in the error colour.',
  ),
  render: () => ({
    template: `<andes-steps aria-label="Navigation" type="navigation" status="error" [current]="1">${REPORT}</andes-steps>`,
  }),
};

export const NavigationVertical: Story = {
  name: 'Stacked navigation',
  parameters: about(
    'A stacked navigation turns the underline into a bar on the start edge, like a side menu.',
  ),
  render: () => ({
    props: { picked: 1 },
    template: `<andes-steps aria-label="Sections" type="navigation" orientation="vertical" clickable [(current)]="picked" style="max-width: 20rem">${REPORT}</andes-steps>`,
  }),
};

export const NavigationSmall: Story = {
  name: 'Small navigation',
  parameters: about(
    'The small size narrows the cells, for a header with little room.',
  ),
  render: () => ({
    template: `<andes-steps aria-label="Navigation" type="navigation" size="small" [current]="1">${FOUR}</andes-steps>`,
  }),
};

export const InlineBasic: Story = {
  name: 'Inline',
  parameters: about(
    'The inline type is a compact row of segments with a thin bar on top and the title below, with no marker at all.',
  ),
  render: () => ({
    template: `<andes-steps aria-label="Inline" type="inline" [current]="1" style="max-width: 36rem">${FOUR}</andes-steps>`,
  }),
};

export const InlineDetails: Story = {
  name: 'Inline with sub titles and descriptions',
  parameters: about(
    'Each segment can carry a sub title and a description under its bar, for a list item that shows where an order is.',
  ),
  render: () => ({
    template: `<andes-steps aria-label="Inline" type="inline" [current]="2" style="max-width: 44rem">${COLUMNS}</andes-steps>`,
  }),
};

export const InlineTones: Story = {
  name: 'Inline tones',
  parameters: about(
    'A finished bar is a soft tint, the current one is solid, the ones to come are grey and a failed one is red.',
  ),
  render: () => ({
    template: demos(
      demo(
        'in progress',
        `<andes-steps aria-label="Inline" type="inline" [current]="2" style="max-width: 36rem">${FOUR}</andes-steps>`,
      ),
      demo(
        'error',
        `<andes-steps aria-label="Inline" type="inline" status="error" [current]="2" style="max-width: 36rem">${FOUR}</andes-steps>`,
      ),
      demo(
        'waiting',
        `<andes-steps aria-label="Inline" type="inline" [current]="-1" style="max-width: 36rem">${FOUR}</andes-steps>`,
      ),
      demo(
        'finished',
        `<andes-steps aria-label="Inline" type="inline" [current]="4" style="max-width: 36rem">${FOUR}</andes-steps>`,
      ),
    ),
  }),
};

export const InlineOffset: Story = {
  name: 'Inline with an offset',
  parameters: about(
    'The offset input leaves empty slots before the first segment, so a row that starts at a later stage lines up with the longer rows.',
  ),
  render: () => ({
    template: `
      <div style="display: grid; gap: 1.5rem; max-width: 40rem">
        <div>
          <p style="${caption}">Five stages, no offset</p>
          <andes-steps aria-label="All stages" type="inline" size="small" [current]="2">${COLUMNS}</andes-steps>
        </div>
        <div>
          <p style="${caption}">Last three stages, offset 2</p>
          <andes-steps aria-label="Late stages" type="inline" size="small" [offset]="2" [current]="0">
            <andes-step title="Ship" subtitle="Day 9" />
            <andes-step title="Deliver" subtitle="Day 12" />
            <andes-step title="Invoice" subtitle="Day 14" />
          </andes-steps>
        </div>
        <div>
          <p style="${caption}">Four stages, offset 1</p>
          <andes-steps aria-label="After the quote" type="inline" size="small" [offset]="1" [current]="1">
            <andes-step title="Order" subtitle="Day 3" />
            <andes-step title="Ship" subtitle="Day 9" />
            <andes-step title="Deliver" subtitle="Day 12" />
            <andes-step title="Invoice" subtitle="Day 14" />
          </andes-steps>
        </div>
      </div>`,
  }),
};

export const InlineInList: Story = {
  name: 'Inline in a list',
  parameters: about(
    'In a list each row shows its own stage with a compact inline trail, aligned by an offset where a row starts later.',
  ),
  render: () => ({
    template: `
      <ul style="margin: 0; padding: 0; list-style: none; max-width: 46rem; border: 1px solid var(--andes-color-border); border-radius: var(--andes-radius-lg)">
        <li style="display: grid; grid-template-columns: 10rem 1fr; gap: 1.5rem; align-items: center; padding: 1rem 1.25rem">
          <div><div style="${text} font-weight: 600">Order 2041</div><div style="${muted}">Lima warehouse</div></div>
          <andes-steps aria-label="Order 2041" type="inline" size="small" [current]="2">${COLUMNS}</andes-steps>
        </li>
        <li style="display: grid; grid-template-columns: 10rem 1fr; gap: 1.5rem; align-items: center; padding: 1rem 1.25rem; border-top: 1px solid var(--andes-color-border)">
          <div><div style="${text} font-weight: 600">Order 2042</div><div style="${muted}">Cusco warehouse</div></div>
          <andes-steps aria-label="Order 2042" type="inline" size="small" [offset]="2" [current]="1">
            <andes-step title="Ship" subtitle="Day 9" />
            <andes-step title="Deliver" subtitle="Day 12" />
            <andes-step title="Invoice" subtitle="Day 14" />
          </andes-steps>
        </li>
        <li style="display: grid; grid-template-columns: 10rem 1fr; gap: 1.5rem; align-items: center; padding: 1rem 1.25rem; border-top: 1px solid var(--andes-color-border)">
          <div><div style="${text} font-weight: 600">Order 2043</div><div style="${muted}">Piura warehouse</div></div>
          <andes-steps aria-label="Order 2043" type="inline" size="small" status="error" [current]="3">${COLUMNS}</andes-steps>
        </li>
      </ul>`,
  }),
};

export const InlineInTable: Story = {
  name: 'Inline in a table',
  parameters: about(
    'A small inline trail fits a table cell, so a column can show where each row stands without a separate status word.',
  ),
  render: () => ({
    template: `
      <table style="${text} width: 100%; max-width: 48rem; border-collapse: collapse">
        <thead>
          <tr style="text-align: start; color: var(--andes-color-muted-foreground)">
            <th style="padding: 0.5rem 1rem; font-weight: 500">Project</th>
            <th style="padding: 0.5rem 1rem; font-weight: 500">Owner</th>
            <th style="padding: 0.5rem 1rem; font-weight: 500; width: 55%">Progress</th>
          </tr>
        </thead>
        <tbody>
          <tr style="border-top: 1px solid var(--andes-color-border)">
            <td style="padding: 0.75rem 1rem">Billing revamp</td><td style="padding: 0.75rem 1rem">Lucia</td>
            <td style="padding: 0.75rem 1rem"><andes-steps aria-label="Billing revamp" type="inline" size="small" [current]="2">${FOUR}</andes-steps></td>
          </tr>
          <tr style="border-top: 1px solid var(--andes-color-border)">
            <td style="padding: 0.75rem 1rem">Mobile app</td><td style="padding: 0.75rem 1rem">Marco</td>
            <td style="padding: 0.75rem 1rem"><andes-steps aria-label="Mobile app" type="inline" size="small" [current]="0">${FOUR}</andes-steps></td>
          </tr>
          <tr style="border-top: 1px solid var(--andes-color-border)">
            <td style="padding: 0.75rem 1rem">Data export</td><td style="padding: 0.75rem 1rem">Ines</td>
            <td style="padding: 0.75rem 1rem"><andes-steps aria-label="Data export" type="inline" size="small" status="error" [current]="1">${FOUR}</andes-steps></td>
          </tr>
        </tbody>
      </table>`,
  }),
};

export const InlineVertical: Story = {
  name: 'Stacked inline',
  parameters: about(
    'A stacked inline trail lists the segments one under the other, each with its bar on top.',
  ),
  render: () => ({
    template: `<andes-steps aria-label="Inline" type="inline" orientation="vertical" [current]="1" style="max-width: 20rem">${COLUMNS}</andes-steps>`,
  }),
};

export const InlineClickable: Story = {
  name: 'Clickable inline',
  parameters: about(
    'Inline segments can be buttons too, with the focus ring drawn inside the segment.',
  ),
  render: () => ({
    props: { picked: 1 },
    template: `<andes-steps aria-label="Inline" type="inline" clickable [(current)]="picked" style="max-width: 36rem">${FOUR}</andes-steps>`,
  }),
};
