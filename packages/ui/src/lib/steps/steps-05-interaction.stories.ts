import { Component, signal } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';

import {
  about,
  bar,
  FOUR_DESCRIBED,
  muted,
  readout,
  withDescription,
  withStepsKit,
} from '../../testing/steps-story-kit';
import { AndesButton } from '../button/button';
import { AndesCheckbox } from '../checkbox/checkbox';
import { AndesTag } from '../tag/tag';
import { AndesStep } from './step';
import { AndesSteps } from './steps';

/** Lists every `changed` the trail emits, newest first, as tags. */
@Component({
  selector: 'andes-steps-log',
  imports: [AndesSteps, AndesStep, AndesTag, AndesButton],
  template: `
    <andes-steps
      aria-label="Event log"
      clickable
      [current]="1"
      (changed)="log.update((l) => [$event + 1, ...l].slice(0, 6))"
    >
      <andes-step title="Plan" />
      <andes-step title="Build" />
      <andes-step title="Test" />
      <andes-step title="Ship" />
    </andes-steps>
    <div [style]="bar + ' margin-block-start: 1.5rem'">
      <span [style]="muted">changed emitted with step:</span>
      @for (entry of log(); track $index) {
        <andes-tag>{{ entry }}</andes-tag>
      } @empty {
        <span [style]="muted">nothing yet</span>
      }
      <andes-button variant="ghost" size="sm" (click)="log.set([])"
        >Clear</andes-button
      >
    </div>
  `,
})
class LogDemo {
  protected readonly bar = bar;
  protected readonly muted = muted;
  protected readonly readout = readout;
  protected readonly log = signal<number[]>([]);
}

/** A trail that stays where it is until the box is ticked. */
@Component({
  selector: 'andes-steps-guarded',
  imports: [AndesSteps, AndesStep, AndesCheckbox],
  template: `
    <andes-checkbox [(checked)]="agreed">I accept the terms</andes-checkbox>
    <andes-steps
      aria-label="Guarded"
      style="display: block; margin-block-start: 1.5rem"
      clickable
      [beforeChange]="guard"
      [(current)]="step"
      (changed)="message.set('Moved to step ' + ($event + 1))"
    >
      <andes-step title="Terms" description="Tick the box to leave" />
      <andes-step title="Details" />
      <andes-step title="Confirm" />
    </andes-steps>
    <p [style]="readout + ' margin-block-start: 1rem'">{{ message() }}</p>
  `,
})
class GuardedDemo {
  protected readonly bar = bar;
  protected readonly muted = muted;
  protected readonly readout = readout;
  protected readonly agreed = signal(false);
  protected readonly step = signal(0);
  protected readonly message = signal('');

  protected readonly guard = (to: number, from: number): boolean => {
    const allowed = this.agreed() || to < from;
    if (!allowed) {
      this.message.set('Accept the terms before moving on');
    }
    return allowed;
  };
}

/** A trail that only lets the user go back to a step already reached. */
@Component({
  selector: 'andes-steps-visited',
  imports: [AndesSteps, AndesStep, AndesButton],
  template: `
    <andes-steps aria-label="Visited" clickable [(current)]="step">
      @for (title of titles; track title; let i = $index) {
        <andes-step [title]="title" [disabled]="i > furthest()" />
      }
    </andes-steps>
    <div [style]="bar + ' margin-block-start: 1.5rem'">
      <andes-button variant="outline" (click)="advance()"
        >Reach the next step</andes-button
      >
      <span [style]="muted"
        >Reached: {{ furthest() + 1 }} of {{ titles.length }}</span
      >
    </div>
  `,
})
class VisitedDemo {
  protected readonly bar = bar;
  protected readonly muted = muted;
  protected readonly readout = readout;
  protected readonly titles = ['Cart', 'Address', 'Payment', 'Review'];
  protected readonly step = signal(0);
  protected readonly furthest = signal(1);

  protected advance(): void {
    this.furthest.update((value) =>
      Math.min(value + 1, this.titles.length - 1),
    );
  }
}

/** Buttons that call the trail's own methods. */
@Component({
  selector: 'andes-steps-methods',
  imports: [AndesSteps, AndesStep, AndesButton],
  template: `
    <andes-steps #trail aria-label="Programmatic" [(current)]="step">
      <andes-step title="Plan" />
      <andes-step title="Build" />
      <andes-step title="Test" />
      <andes-step title="Ship" />
    </andes-steps>
    <div [style]="bar + ' margin-block-start: 1.5rem'">
      <andes-button variant="outline" (click)="trail.previous()"
        >Previous</andes-button
      >
      <andes-button (click)="trail.next()">Next</andes-button>
      <andes-button variant="ghost" (click)="step.set(0)">Restart</andes-button>
    </div>
  `,
})
class MethodsDemo {
  protected readonly bar = bar;
  protected readonly muted = muted;
  protected readonly readout = readout;
  protected readonly step = signal(0);
}

const meta: Meta<AndesSteps> = {
  title: 'Navigation/Steps/Interaction',
  component: AndesSteps,
  tags: ['autodocs'],
  decorators: [
    withDescription,
    withStepsKit,
    moduleMetadata({
      imports: [
        AndesSteps,
        AndesStep,
        AndesButton,
        NgIcon,
        LogDemo,
        GuardedDemo,
        VisitedDemo,
        MethodsDemo,
      ],
    }),
  ],
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<AndesSteps>;

export const ClickableSteps: Story = {
  name: 'Clickable steps',
  parameters: about(
    'With clickable, every step is a button: a click selects it, and two-way binding keeps your own state in step with the trail.',
  ),
  render: () => ({
    props: { picked: 1 },
    template: `
      <andes-steps aria-label="Profile" clickable [(current)]="picked">${FOUR_DESCRIBED}</andes-steps>
      <p style="${readout} margin-block-start: 1.5rem">Selected step: {{ picked + 1 }}</p>`,
  }),
};

export const ChangedOutput: Story = {
  name: 'The changed output',
  parameters: about(
    'The changed output reports the step a user picked, and only when it differs from the current one.',
  ),
  render: () => ({ template: `<andes-steps-log />` }),
};

export const NotClickable: Story = {
  name: 'Not clickable',
  parameters: about(
    'Without clickable the steps are plain text: nothing takes focus and a click does nothing, for a flow the user cannot jump around in.',
  ),
  render: () => ({
    template: `<andes-steps aria-label="Read only" [current]="1">${FOUR_DESCRIBED}</andes-steps>`,
  }),
};

export const DisabledStep: Story = {
  name: 'A disabled step',
  parameters: about(
    'A disabled step is dimmed, cannot be selected and is skipped by the keyboard, while the others stay clickable.',
  ),
  render: () => ({
    template: `
      <andes-steps aria-label="Profile" clickable [current]="0">
        <andes-step title="Personal" description="Name and contact" />
        <andes-step title="Work" description="Role and manager" />
        <andes-step title="Access" description="Needs an admin" [disabled]="true" />
        <andes-step title="Summary" />
      </andes-steps>`,
  }),
};

export const DisabledSeveral: Story = {
  name: 'Several disabled steps',
  parameters: about(
    'The steps ahead can all be disabled, so the user can only go back to what was finished.',
  ),
  render: () => ({
    template: `
      <andes-steps aria-label="Checkout" clickable [current]="1">
        <andes-step title="Cart" />
        <andes-step title="Address" />
        <andes-step title="Payment" [disabled]="true" />
        <andes-step title="Review" [disabled]="true" />
      </andes-steps>`,
  }),
};

export const OnlyReached: Story = {
  name: 'Only steps already reached',
  parameters: about(
    'The disabled flag can follow your own progress, so a step becomes selectable once the user has reached it.',
  ),
  render: () => ({ template: `<andes-steps-visited />` }),
};

export const Guarded: Story = {
  name: 'Blocking a change',
  parameters: about(
    'The beforeChange input is asked before a click moves the trail, and returning false keeps the user on the current step.',
  ),
  render: () => ({ template: `<andes-steps-guarded />` }),
};

export const Programmatic: Story = {
  name: 'Next and previous',
  parameters: about(
    'The next and previous methods move the trail from your own buttons, and stop at the first and the last step.',
  ),
  render: () => ({ template: `<andes-steps-methods />` }),
};

export const KeyboardNavigation: Story = {
  name: 'Keyboard',
  parameters: about(
    'Tab enters the trail on the current step, the arrow keys, Home and End move between steps, and Enter or Space selects the focused one.',
  ),
  render: () => ({
    props: { picked: 1 },
    template: `
      <p style="${muted} margin: 0 0 1.5rem; max-width: 36rem">Tab into the trail, then use the arrow keys, Home and End to move and Enter or Space to select. Disabled steps are skipped.</p>
      <andes-steps aria-label="Keyboard" clickable [(current)]="picked">
        <andes-step title="Plan" />
        <andes-step title="Build" />
        <andes-step title="Test" [disabled]="true" />
        <andes-step title="Ship" />
        <andes-step title="Learn" />
      </andes-steps>
      <p style="${readout} margin-block-start: 1.5rem">Selected step: {{ picked + 1 }}</p>`,
  }),
};

export const SingleTabStop: Story = {
  name: 'One tab stop',
  parameters: about(
    'The trail takes a single tab stop, so a keyboard user passes it with one Tab and goes between its steps with the arrow keys.',
  ),
  render: () => ({
    template: `
      <div style="${bar}">
        <andes-button variant="outline">Before</andes-button>
        <andes-steps aria-label="One tab stop" clickable [current]="2" style="flex: 1 1 28rem">
          <andes-step title="Plan" />
          <andes-step title="Build" />
          <andes-step title="Test" />
          <andes-step title="Ship" />
        </andes-steps>
        <andes-button variant="outline">After</andes-button>
      </div>`,
  }),
};

export const VerticalClickable: Story = {
  name: 'Clickable and stacked',
  parameters: about(
    'In the stacked layout the Up and Down arrow keys move between steps as well as Left and Right.',
  ),
  render: () => ({
    props: { picked: 0 },
    template: `
      <andes-steps aria-label="Onboarding" orientation="vertical" clickable [(current)]="picked" style="max-width: 24rem">${FOUR_DESCRIBED}</andes-steps>`,
  }),
};
