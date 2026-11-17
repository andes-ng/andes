import { Component, signal } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';

import {
  about,
  demo,
  demos,
  muted,
  phone,
  resizable,
  StepsDemo,
  withDescription,
  withStepsKit,
} from '../../testing/steps-story-kit';
import { AndesButton } from '../button/button';
import { AndesStep } from './step';
import { AndesStepPanel } from './step-panel';
import { AndesSteps } from './steps';

const CHECKOUT = `
  <andes-step title="Cart" />
  <andes-step title="Shipping" />
  <andes-step title="Payment" />
  <andes-step title="Review" />
  <andes-step title="Confirm" />`;

const DESCRIBED = `
  <andes-step title="Cart" description="Review the items" />
  <andes-step title="Shipping" description="Where it goes" />
  <andes-step title="Payment" description="How you pay" />
  <andes-step title="Review" description="Check everything" />
  <andes-step title="Confirm" description="Place the order" />`;

const FRAME = 'max-width: 48rem';

/** Back and Next under a segments trail whose panels hold the content of each step. */
@Component({
  selector: 'andes-steps-segments-wizard',
  imports: [AndesSteps, AndesStep, AndesStepPanel, AndesButton],
  template: `
    <div [style]="frame">
      <andes-steps
        #trail
        aria-label="Checkout"
        type="segments"
        clickable
        [(current)]="step"
      >
        <andes-step title="Cart" />
        <andes-step title="Shipping" />
        <andes-step title="Payment" />
        <andes-step title="Review" />
        <andes-step-panel [style]="panel"
          ><p [style]="muted">
            Check the items in your cart.
          </p></andes-step-panel
        >
        <andes-step-panel [style]="panel"
          ><p [style]="muted">Choose where it should go.</p></andes-step-panel
        >
        <andes-step-panel [style]="panel"
          ><p [style]="muted">Pick a way to pay.</p></andes-step-panel
        >
        <andes-step-panel [style]="panel"
          ><p [style]="muted">
            Look it over and place the order.
          </p></andes-step-panel
        >
      </andes-steps>
      <div [style]="bar">
        <andes-button
          variant="outline"
          [disabled]="step() === 0"
          (click)="trail.previous()"
          >Back</andes-button
        >
        @if (step() < 3) {
          <andes-button (click)="trail.next()">Continue</andes-button>
        } @else {
          <andes-button (click)="step.set(0)">Start again</andes-button>
        }
      </div>
    </div>
  `,
})
class SegmentsWizard extends StepsDemo {
  protected readonly frame = FRAME;
  protected readonly panel = 'display: block; padding-block: 1.5rem;';
}

/** A step that is busy, then done: the marker turns into a spinner while the check runs. */
@Component({
  selector: 'andes-steps-segments-busy',
  imports: [AndesSteps, AndesStep, AndesButton],
  template: `
    <div [style]="frame">
      <andes-steps aria-label="Publishing" type="segments" [current]="step()">
        <andes-step title="Build" />
        <andes-step
          title="Check"
          [status]="running() ? 'loading' : undefined"
          [description]="running() ? 'Running 128 tests' : ''"
        />
        <andes-step title="Publish" />
      </andes-steps>
      <div [style]="bar">
        <andes-button [disabled]="running()" (click)="run()">{{
          step() === 1 ? 'Run the check' : 'Start over'
        }}</andes-button>
        <span [style]="readout">{{ running() ? 'Checking…' : 'Idle' }}</span>
      </div>
    </div>
  `,
})
class SegmentsBusy extends StepsDemo {
  protected readonly frame = FRAME;
  protected readonly running = signal(false);

  constructor() {
    super();
    this.step.set(1);
  }

  protected run(): void {
    if (this.step() !== 1) {
      this.step.set(1);
      return;
    }
    this.running.set(true);
    setTimeout(() => {
      this.running.set(false);
      this.step.set(2);
    }, 1500);
  }
}

/** A clickable trail and what it reported. */
@Component({
  selector: 'andes-steps-segments-clickable',
  imports: [AndesSteps, AndesStep],
  template: `
    <div [style]="frame">
      <andes-steps
        aria-label="Checkout"
        type="segments"
        clickable
        [(current)]="step"
        (changed)="last.set($event + 1)"
      >
        <andes-step title="Cart" />
        <andes-step title="Shipping" />
        <andes-step title="Payment" [disabled]="true" description="Not yet" />
        <andes-step title="Review" />
        <andes-step title="Confirm" />
      </andes-steps>
      <p [style]="readout">
        {{ last() ? 'You picked step ' + last() + '.' : 'Pick a step.' }}
      </p>
    </div>
  `,
})
class SegmentsClickable extends StepsDemo {
  protected readonly frame = FRAME;
  protected readonly last = signal(0);

  constructor() {
    super();
    this.step.set(1);
  }
}

const meta: Meta<AndesSteps> = {
  title: 'Navigation/Steps/Segments',
  component: AndesSteps,
  tags: ['autodocs'],
  decorators: [
    withDescription,
    withStepsKit,
    moduleMetadata({
      imports: [
        AndesSteps,
        AndesStep,
        AndesStepPanel,
        AndesButton,
        NgIcon,
        SegmentsWizard,
        SegmentsBusy,
        SegmentsClickable,
      ],
    }),
  ],
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<AndesSteps>;

export const Segments: Story = {
  name: 'Segments',
  parameters: about(
    'A thin bar sits above every step, filled up to the current one, and the current step rests in a soft pill with a ring, after the finished steps with their checks and before the numbers still to come.',
  ),
  render: () => ({
    template: `<andes-steps aria-label="Checkout" type="segments" [current]="2" style="${FRAME}">${CHECKOUT}</andes-steps>`,
  }),
};

export const SegmentsDark: Story = {
  name: 'Segments in the dark theme',
  globals: { theme: 'dark' },
  parameters: about(
    'The bars, the pill and the indicators switch to the dark palette, with the pill a light tint over the surface and the upcoming numbers kept muted.',
  ),
  render: () => ({
    template: `<andes-steps aria-label="Checkout" type="segments" [current]="2" style="${FRAME}">${CHECKOUT}</andes-steps>`,
  }),
};

export const SegmentsLightAndDark: Story = {
  name: 'Segments, light and dark side by side',
  parameters: about(
    'The same trail on a light and on a dark surface, with an error and a warning to compare their colours.',
  ),
  render: () => ({
    template: `
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(24rem, 1fr)); gap: 1.5rem">
        <div style="padding: 1.5rem; border-radius: 0.75rem; background: #ffffff; border: 1px solid var(--andes-color-border)">
          <andes-steps aria-label="Light" type="segments" [current]="2">
            <andes-step title="Cart" />
            <andes-step title="Shipping" status="warning" />
            <andes-step title="Payment" />
            <andes-step title="Review" />
          </andes-steps>
        </div>
        <div data-andes-theme="dark" style="padding: 1.5rem; border-radius: 0.75rem; background: #0f172a; color: #f8fafc">
          <andes-steps aria-label="Dark" type="segments" [current]="2">
            <andes-step title="Cart" />
            <andes-step title="Shipping" status="warning" />
            <andes-step title="Payment" />
            <andes-step title="Review" />
          </andes-steps>
        </div>
      </div>`,
  }),
};

export const SegmentsRtl: Story = {
  name: 'Segments right to left',
  parameters: {
    dir: 'rtl',
    ...about(
      'Under a right-to-left document the bars fill from the right, the pill and the indicators mirror, and the arrow keys swap.',
    ),
  },
  render: () => ({
    template: demos(
      demo(
        'horizontal',
        `<andes-steps aria-label="Checkout" type="segments" clickable [current]="2" style="${FRAME}">${CHECKOUT}</andes-steps>`,
      ),
      demo(
        'vertical',
        `<andes-steps aria-label="Stacked" type="segments" orientation="vertical" [current]="1" style="max-width: 20rem">${DESCRIBED}</andes-steps>`,
      ),
    ),
  }),
};

export const SegmentsSizes: Story = {
  name: 'Segments sizes',
  parameters: about(
    'The small size shrinks the indicator from 24px to 20px and tightens the pill, while the bar keeps its thickness.',
  ),
  render: () => ({
    template: demos(
      demo(
        'default',
        `<andes-steps aria-label="Default" type="segments" [current]="2" style="${FRAME}">${CHECKOUT}</andes-steps>`,
      ),
      demo(
        'small',
        `<andes-steps aria-label="Small" type="segments" size="small" [current]="2" style="${FRAME}">${CHECKOUT}</andes-steps>`,
      ),
    ),
  }),
};

export const SegmentsVertical: Story = {
  name: 'Segments stacked',
  parameters: about(
    'Stacked, each step draws its bar down its start edge, filled up to the current one, with the title and description beside it.',
  ),
  render: () => ({
    template: `<andes-steps aria-label="Checkout" type="segments" orientation="vertical" [current]="2" style="max-width: 22rem">${DESCRIBED}</andes-steps>`,
  }),
};

export const SegmentsDescriptions: Story = {
  name: 'Segments with descriptions and end content',
  parameters: about(
    'A description sits under the title inside the pill, a step can be optional, and the end content puts a duration or a note at the far end of the title row.',
  ),
  render: () => ({
    template: `
      <andes-steps aria-label="Setup" type="segments" [current]="1" style="max-width: 56rem">
        <andes-step title="Account" description="Create your login" endContent="2 min" />
        <andes-step title="Workspace" description="Name it and invite people" endContent="5 min" />
        <andes-step title="Billing" description="Add a card" [optional]="true" />
        <andes-step title="Launch" description="Go live" />
      </andes-steps>`,
  }),
};

export const SegmentsLongLabels: Story = {
  name: 'Segments with long labels',
  parameters: about(
    'A label wider than its step is cut with an ellipsis on one line, so the row keeps its height and the bars stay in line, while the full text stays in the accessible name.',
  ),
  render: () => ({
    template: `
      <andes-steps aria-label="Onboarding" type="segments" [current]="1" style="max-width: 36rem">
        <andes-step title="Create your organisation account" />
        <andes-step title="Invite the members of your team" />
        <andes-step title="Connect your data sources" />
        <andes-step title="Review and launch the workspace" />
      </andes-steps>`,
  }),
};

export const SegmentsStatuses: Story = {
  name: 'Segments statuses',
  parameters: about(
    'An error draws a red cross, a warning an amber triangle and a loading step a turning ring, each in the colour of its bar, and every one of them is spoken as a word.',
  ),
  render: () => ({
    template: demos(
      demo(
        'error on the current step',
        `<andes-steps aria-label="Error" type="segments" status="error" [current]="2" style="${FRAME}">${CHECKOUT}</andes-steps>`,
      ),
      demo(
        'a warning on a finished step',
        `<andes-steps aria-label="Warning" type="segments" [current]="3" style="${FRAME}">
          <andes-step title="Cart" />
          <andes-step title="Shipping" status="warning" />
          <andes-step title="Payment" />
          <andes-step title="Review" />
          <andes-step title="Confirm" />
        </andes-steps>`,
      ),
      demo(
        'loading on the current step',
        `<andes-steps aria-label="Loading" type="segments" status="loading" [current]="2" style="${FRAME}">${CHECKOUT}</andes-steps>`,
      ),
    ),
  }),
};

export const SegmentsBusyStep: Story = {
  name: 'Segments while a step is checked',
  parameters: about(
    'The button runs a check that keeps the step loading for a moment, then lets the trail move on to the next one.',
  ),
  render: () => ({ template: `<andes-steps-segments-busy />` }),
};

export const SegmentsNumbers: Story = {
  name: 'Segments with a number on every step',
  parameters: about(
    'With indicator set to number every step keeps its number, finished and current ones included, and only a loading step still swaps it for a spinner.',
  ),
  render: () => ({
    template: `<andes-steps aria-label="Checkout" type="segments" indicator="number" [current]="2" style="${FRAME}">${CHECKOUT}</andes-steps>`,
  }),
};

export const SegmentsNoIndicators: Story = {
  name: 'Segments without indicators',
  parameters: about(
    'With indicator set to none the bars and the labels carry the progress alone, and the current label stays bold in its pill.',
  ),
  render: () => ({
    template: `<andes-steps aria-label="Checkout" type="segments" indicator="none" [current]="2" style="${FRAME}">${CHECKOUT}</andes-steps>`,
  }),
};

export const SegmentsCustomIcons: Story = {
  name: 'Segments with custom icons',
  parameters: about(
    'A step can bring its own lucide icon, which replaces the check, the ring or the number, while a step beside it with indicator set to none shows no marker at all.',
  ),
  render: () => ({
    template: `
      <andes-steps aria-label="Delivery" type="segments" [current]="1" style="${FRAME}">
        <andes-step title="Ordered" icon="lucidePackage" />
        <andes-step title="Shipped" icon="lucideTruck" />
        <andes-step title="Out for delivery" indicator="none" />
        <andes-step title="Delivered" icon="lucideHouse" />
      </andes-steps>`,
  }),
};

export const SegmentsDensity: Story = {
  name: 'Segments density',
  parameters: about(
    'Compact, default and comfortable change the padding of the pill in a horizontal trail and the gap between steps in a stacked one.',
  ),
  render: () => ({
    template: demos(
      demo(
        'compact',
        `<andes-steps aria-label="Compact" type="segments" density="compact" [current]="2" style="${FRAME}">${CHECKOUT}</andes-steps>`,
      ),
      demo(
        'default',
        `<andes-steps aria-label="Default" type="segments" [current]="2" style="${FRAME}">${CHECKOUT}</andes-steps>`,
      ),
      demo(
        'comfortable',
        `<andes-steps aria-label="Comfortable" type="segments" density="comfortable" [current]="2" style="${FRAME}">${CHECKOUT}</andes-steps>`,
      ),
    ),
  }),
};

export const SegmentsProgress: Story = {
  name: 'Segments with progress inside a step',
  parameters: about(
    'The percent input fills only that share of the bar of the step in progress, for an upload or a long task.',
  ),
  render: () => ({
    template: demos(
      demo(
        '35 percent',
        `<andes-steps aria-label="Import" type="segments" [current]="1" [percent]="35" style="${FRAME}">
          <andes-step title="Upload" />
          <andes-step title="Process" />
          <andes-step title="Publish" />
        </andes-steps>`,
      ),
      demo(
        '80 percent',
        `<andes-steps aria-label="Import" type="segments" [current]="1" [percent]="80" style="${FRAME}">
          <andes-step title="Upload" />
          <andes-step title="Process" />
          <andes-step title="Publish" />
        </andes-steps>`,
      ),
    ),
  }),
};

export const SegmentsClickableSteps: Story = {
  name: 'Segments you can click',
  parameters: about(
    'Every step becomes a button with one roving tab stop and the arrow keys, a disabled step cannot be picked, and the trail reports the step the user chose.',
  ),
  render: () => ({ template: `<andes-steps-segments-clickable />` }),
};

export const SegmentsWizardContent: Story = {
  name: 'Segments with content and buttons',
  parameters: about(
    'A panel under the trail shows the content of the current step, and Back, Continue and the bars all move the same current step.',
  ),
  render: () => ({ template: `<andes-steps-segments-wizard />` }),
};

export const SegmentsCollapsedControls: Story = {
  name: 'Segments collapsed with controls',
  parameters: about(
    'When the container gives each step under 112px the labels go, the bars stay, and the current step is written beneath them with previous and next buttons that skip disabled steps.',
  ),
  render: () => ({
    template: `
      <div style="${phone}">
        <andes-steps aria-label="Checkout" type="segments" clickable [current]="2">
          <andes-step title="Cart" />
          <andes-step title="Shipping" description="Where it goes" />
          <andes-step title="Payment" description="How you pay" />
          <andes-step title="Review" />
          <andes-step title="Confirm" />
        </andes-steps>
      </div>`,
  }),
};

export const SegmentsCollapsedLabel: Story = {
  name: 'Segments collapsed with a label',
  parameters: about(
    'The summary variant writes the current step under the bars without buttons, for a page that already has its own Back and Continue.',
  ),
  render: () => ({
    template: `
      <div style="${phone}">
        <andes-steps aria-label="Checkout" type="segments" collapsedVariant="summary" [current]="2">
          <andes-step title="Cart" />
          <andes-step title="Shipping" />
          <andes-step title="Payment" description="How you pay" />
          <andes-step title="Review" />
          <andes-step title="Confirm" />
        </andes-steps>
      </div>`,
  }),
};

export const SegmentsCollapsedTrack: Story = {
  name: 'Segments collapsed to bars only',
  parameters: about(
    'The track variant keeps just the bars, for a page whose own heading and buttons already name the step, while every step stays in the accessible list.',
  ),
  render: () => ({
    template: `
      <div style="${phone}">
        <andes-steps aria-label="Checkout" type="segments" collapsedVariant="track" [current]="2">${CHECKOUT}</andes-steps>
      </div>`,
  }),
};

export const SegmentsCollapsedStack: Story = {
  name: 'Segments collapsed into a stack',
  parameters: about(
    'With the stack variant a narrow container turns the trail vertical, as every other type does.',
  ),
  render: () => ({
    template: `
      <div style="${phone}">
        <andes-steps aria-label="Checkout" type="segments" collapsedVariant="stack" [current]="2">${DESCRIBED}</andes-steps>
      </div>`,
  }),
};

export const SegmentsResizable: Story = {
  name: 'Segments in a frame you can resize',
  parameters: about(
    'Drag the corner of the frame to watch the trail fall from the full labels to the summary and back as the room per step passes the minimum step width.',
  ),
  render: () => ({
    template: `
      <div style="${resizable}">
        <andes-steps aria-label="Checkout" type="segments" clickable [current]="2" [minimumStepWidth]="96">${DESCRIBED}</andes-steps>
      </div>`,
  }),
};

export const SegmentsAccent: Story = {
  name: 'Segments with a neutral accent',
  parameters: about(
    'The bars, the check discs and the ring read the segment accent custom properties, so the trail can follow the text colour instead of the brand colour, and the pill and the empty bar can be tinted the same way.',
  ),
  render: () => ({
    template: `
      <andes-steps aria-label="Checkout" type="segments" [current]="2" style="${FRAME};
        --andes-steps-segment-accent: var(--andes-color-foreground);
        --andes-steps-segment-accent-foreground: var(--andes-color-background);
        --andes-steps-segment-height: 0.25rem;
        --andes-steps-pill-background: var(--andes-color-muted);">${CHECKOUT}</andes-steps>
      <p style="max-width: 40rem; margin: 1rem 0 0; ${muted}">
        Set --andes-steps-segment-accent, --andes-steps-segment-track, --andes-steps-segment-height and --andes-steps-pill-background on the trail.
      </p>`,
  }),
};
