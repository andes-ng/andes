import { Component, signal } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';

import {
  about,
  bar,
  demo,
  demos,
  FIVE,
  FOUR,
  FOUR_DESCRIBED,
  muted,
  resizable,
  SEVEN,
  THREE,
  TWELVE,
  withDescription,
  withStepsKit,
} from '../../testing/steps-story-kit';
import { AndesButton } from '../button/button';
import { AndesSegmented } from '../segmented/segmented';
import { AndesStep } from './step';
import { AndesSteps } from './steps';

/** A trail whose ring is driven by buttons. */
@Component({
  selector: 'andes-steps-ring',
  imports: [AndesSteps, AndesStep, AndesButton],
  template: `
    <andes-steps aria-label="Upload" [current]="1" [percent]="percent()">
      <andes-step title="Select files" />
      <andes-step title="Uploading" [description]="percent() + '% of 48 MB'" />
      <andes-step title="Process" />
    </andes-steps>
    <div [style]="bar + ' margin-block-start: 1.5rem'">
      <andes-button variant="outline" (click)="step(-10)">-10%</andes-button>
      <andes-button (click)="step(10)">+10%</andes-button>
      <andes-button variant="ghost" (click)="percent.set(0)"
        >Reset</andes-button
      >
    </div>
  `,
})
class RingDemo {
  protected readonly bar = bar;
  protected readonly percent = signal(40);

  protected step(delta: number): void {
    this.percent.update((value) => Math.min(100, Math.max(0, value + delta)));
  }
}

/** Twelve steps folded to a limit, with the current step chosen by a control. */
@Component({
  selector: 'andes-steps-folded',
  imports: [AndesSteps, AndesStep, AndesSegmented],
  template: `
    <andes-segmented
      aria-label="Current step"
      style="margin-block-end: 2rem"
      [options]="positions"
      [(value)]="at"
    />
    <andes-steps
      aria-label="Long process"
      [maxCount]="5"
      [clickable]="true"
      [current]="at() ?? 0"
      (changed)="at.set($event)"
    >
      @for (title of titles; track title) {
        <andes-step [title]="title" />
      }
    </andes-steps>
  `,
})
class FoldedDemo {
  protected readonly titles = TWELVE;
  protected readonly at = signal<number | null>(5);
  protected readonly positions = [0, 2, 5, 8, 11].map((value) => ({
    value,
    label: `Step ${value + 1}`,
  }));
}

/** The same folded trail in every orientation and type, for the compare story. */
@Component({
  selector: 'andes-steps-folded-grid',
  imports: [AndesSteps, AndesStep],
  template: `
    @for (item of cases; track item.label) {
      <p [style]="caption">{{ item.label }}</p>
      <andes-steps
        [attr.aria-label]="item.label"
        style="max-width: 44rem; margin-block-end: 2rem"
        [type]="item.type"
        [maxCount]="item.max"
        [current]="item.at"
      >
        @for (title of titles; track title) {
          <andes-step [title]="title" />
        }
      </andes-steps>
    }
  `,
})
class FoldedGrid {
  protected readonly caption =
    'margin: 0 0 0.75rem; font-size: 0.75rem; line-height: 1.25rem; color: var(--andes-color-muted-foreground);';
  protected readonly titles = TWELVE;
  protected readonly cases = [
    { label: 'Current step 1', type: 'default' as const, max: 5, at: 0 },
    { label: 'Current step 6', type: 'default' as const, max: 5, at: 5 },
    { label: 'Current step 12', type: 'default' as const, max: 5, at: 11 },
    {
      label: 'Limit 7, current step 6',
      type: 'default' as const,
      max: 7,
      at: 5,
    },
  ];
}

const meta: Meta<AndesSteps> = {
  title: 'Navigation/Steps/Progress and overflow',
  component: AndesSteps,
  tags: ['autodocs'],
  decorators: [
    withDescription,
    withStepsKit,
    moduleMetadata({
      imports: [
        AndesSteps,
        AndesStep,
        NgIcon,
        RingDemo,
        FoldedDemo,
        FoldedGrid,
      ],
    }),
  ],
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<AndesSteps>;

export const ProgressRing: Story = {
  name: 'Progress ring',
  parameters: about(
    'The percent input draws a ring around the marker of the step in progress, to show how far that step has got.',
  ),
  render: () => ({
    template: `
      <andes-steps aria-label="Sync" [current]="1" [percent]="60">
        <andes-step title="Extract" description="5,000 rows" />
        <andes-step title="Transform" description="60% of 5,000 rows" />
        <andes-step title="Load" />
      </andes-steps>`,
  }),
};

export const TitlePlacementAndProgress: Story = {
  name: 'Title placement and progress',
  parameters: about(
    'The ring follows the marker whichever way the title is placed, beside it or below it.',
  ),
  render: () => ({
    template: demos(
      demo(
        'beside',
        `<andes-steps aria-label="Beside" [current]="1" [percent]="45">${FOUR_DESCRIBED}</andes-steps>`,
      ),
      demo(
        'below',
        `<andes-steps aria-label="Below" titlePlacement="vertical" [current]="1" [percent]="45">${FOUR_DESCRIBED}</andes-steps>`,
      ),
    ),
  }),
};

export const ProgressDriven: Story = {
  name: 'Progress that changes',
  parameters: about(
    'The ring grows and shrinks with the percent, and the arc animates from one value to the next.',
  ),
  render: () => ({ template: `<andes-steps-ring />` }),
};

export const ProgressPerStep: Story = {
  name: 'Progress set on a step',
  parameters: about(
    'A percent on a single step draws its ring, so two steps in progress at once can show their own values.',
  ),
  render: () => ({
    template: `
      <andes-steps aria-label="Parallel" [current]="1">
        <andes-step title="Design" />
        <andes-step title="Frontend" status="process" [percent]="70" />
        <andes-step title="Backend" status="process" [percent]="30" />
        <andes-step title="Launch" />
      </andes-steps>`,
  }),
};

export const ProgressVertical: Story = {
  name: 'Progress on a stacked trail',
  parameters: about(
    'The ring also marks the step in progress in the stacked layout.',
  ),
  render: () => ({
    template: `<andes-steps aria-label="Sync" orientation="vertical" [current]="1" [percent]="35">${FOUR_DESCRIBED}</andes-steps>`,
  }),
};

export const ProgressSmall: Story = {
  name: 'Progress, small',
  parameters: about('In the small size the ring hugs the 20px marker.'),
  render: () => ({
    template: `<andes-steps aria-label="Sync" size="small" [current]="1" [percent]="75">${FOUR}</andes-steps>`,
  }),
};

export const ProgressEdges: Story = {
  name: 'Progress at 0 and 100',
  parameters: about(
    'A percent of 0 draws only the track and 100 closes the ring, and values outside that range are clamped.',
  ),
  render: () => ({
    template: demos(
      demo(
        '0%',
        `<andes-steps aria-label="Zero" [current]="1" [percent]="0">${THREE}</andes-steps>`,
      ),
      demo(
        '100%',
        `<andes-steps aria-label="Full" [current]="1" [percent]="100">${THREE}</andes-steps>`,
      ),
      demo(
        '140% is clamped to 100%',
        `<andes-steps aria-label="Clamped" [current]="1" [percent]="140">${THREE}</andes-steps>`,
      ),
    ),
  }),
};

export const ThreeSteps: Story = {
  name: '3 steps',
  parameters: about(
    'Three steps share the width and leave generous connectors between them.',
  ),
  render: () => ({
    template: `<andes-steps aria-label="Three" [current]="1">${THREE}</andes-steps>`,
  }),
};

export const FourSteps: Story = {
  name: '4 steps',
  parameters: about(
    'Four steps, the length of most wizards, with the third in progress.',
  ),
  render: () => ({
    template: `<andes-steps aria-label="Four" [current]="2">${FOUR}</andes-steps>`,
  }),
};

export const FiveSteps: Story = {
  name: '5 steps',
  parameters: about(
    'Five steps still fit on one line with their titles at a desktop width.',
  ),
  render: () => ({
    template: `<andes-steps aria-label="Five" [current]="2">${FIVE}</andes-steps>`,
  }),
};

export const SevenSteps: Story = {
  name: '7 steps',
  parameters: about(
    'Seven steps use the title-below layout so every title keeps room on one line.',
  ),
  render: () => ({
    template: `<andes-steps aria-label="Seven" titlePlacement="vertical" [current]="3">${SEVEN}</andes-steps>`,
  }),
};

export const SevenStepsStacked: Story = {
  name: '7 steps, stacked',
  parameters: about(
    'A long process reads better stacked, where each step has a whole row.',
  ),
  render: () => ({
    template: `<andes-steps aria-label="Seven" orientation="vertical" [current]="3">${SEVEN}</andes-steps>`,
  }),
};

export const ManyStepsNarrow: Story = {
  name: 'Many steps in a narrow space',
  parameters: about(
    'A long trail in a narrow container collapses to the stacked layout instead of overflowing.',
  ),
  render: () => ({
    template: `
      <div style="${resizable} width: 26rem">
        <andes-steps aria-label="Seven" [current]="3">${SEVEN}</andes-steps>
      </div>`,
  }),
};

export const FoldedBasic: Story = {
  name: 'Limit the visible steps',
  parameters: about(
    'With maxCount the trail shows the first, the last and the current steps, and folds the rest into a marker that lists them.',
  ),
  render: () => ({
    template: `
      <andes-steps aria-label="Twelve" [maxCount]="5" [current]="5">
        ${TWELVE.map((title) => `<andes-step title="${title}" />`).join('')}
      </andes-steps>`,
  }),
};

export const FoldedMove: Story = {
  name: 'Folding follows the current step',
  parameters: about(
    'Pick a step below: the folded ranges move with it, and clicking a step or an entry of a folded list selects it.',
  ),
  render: () => ({ template: `<andes-steps-folded />` }),
};

export const FoldedPositions: Story = {
  name: 'Folding at the start, middle and end',
  parameters: about(
    'Near the start only the end folds, in the middle both sides fold, and near the end only the start does.',
  ),
  render: () => ({ template: `<andes-steps-folded-grid />` }),
};

export const FoldedVertical: Story = {
  name: 'Folded and stacked',
  parameters: about(
    'The folded marker sits on the connector in the stacked layout too.',
  ),
  render: () => ({
    template: `
      <andes-steps aria-label="Twelve" orientation="vertical" [maxCount]="5" [current]="5" style="max-width: 18rem">
        ${TWELVE.map((title) => `<andes-step title="${title}" />`).join('')}
      </andes-steps>`,
  }),
};

export const FoldedDots: Story = {
  name: 'Folded dots',
  parameters: about(
    'Dots fold the same way, with a small ring of three points where steps are hidden.',
  ),
  render: () => ({
    template: `
      <andes-steps aria-label="Twelve" type="dot" [maxCount]="5" [current]="5">
        ${TWELVE.map((title) => `<andes-step title="${title}" />`).join('')}
      </andes-steps>`,
  }),
};

export const FoldedClickable: Story = {
  name: 'Folded and clickable',
  parameters: about(
    'In a clickable trail the entries of a folded list are buttons, so a hidden step is one choice away.',
  ),
  render: () => ({
    props: { picked: 6 },
    template: `
      <andes-steps aria-label="Twelve" clickable [maxCount]="5" [(current)]="picked">
        ${TWELVE.map((title) => `<andes-step title="${title}" />`).join('')}
      </andes-steps>
      <p style="${muted} margin-block-start: 1.5rem">Selected: step {{ picked + 1 }}</p>`,
  }),
};

export const FoldedLimit: Story = {
  name: 'Folded to 7',
  parameters: about(
    'A larger limit keeps more of the neighbours of the current step on screen before folding.',
  ),
  render: () => ({
    template: `
      <andes-steps aria-label="Twelve" titlePlacement="vertical" [maxCount]="7" [current]="5">
        ${TWELVE.map((title) => `<andes-step title="${title}" />`).join('')}
      </andes-steps>`,
  }),
};

export const FoldedSmall: Story = {
  name: 'Folded, small',
  parameters: about(
    'The folded marker takes the small size with the rest of the trail.',
  ),
  render: () => ({
    template: `
      <andes-steps aria-label="Twelve" size="small" [maxCount]="5" [current]="5">
        ${TWELVE.map((title) => `<andes-step title="${title}" />`).join('')}
      </andes-steps>`,
  }),
};

export const FoldedLabel: Story = {
  name: 'Folded marker name',
  parameters: about(
    'The folded marker is a button named after how many steps it hides, and the labels input translates that name.',
  ),
  render: () => ({
    props: {
      spanish: {
        more: '{count} pasos ocultos',
        finish: 'Completado',
        wait: 'Pendiente',
        process: 'En curso',
      },
    },
    template: `
      <andes-steps aria-label="Doce pasos" [labels]="spanish" [maxCount]="5" [current]="5">
        ${TWELVE.map((title) => `<andes-step title="${title}" />`).join('')}
      </andes-steps>`,
  }),
};
