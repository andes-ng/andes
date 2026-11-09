import {
  afterEveryRender,
  Component,
  ElementRef,
  inject,
  signal,
} from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';

import {
  about,
  bar,
  code,
  demo,
  demos,
  FOUR,
  FOUR_DESCRIBED,
  muted,
  readout,
  withDescription,
  withStepsKit,
} from '../../testing/steps-story-kit';
import { AndesButton } from '../button/button';
import { AndesStep } from './step';
import { AndesSteps } from './steps';

/** Prints what a screen reader gets from the trail: the roles, `aria-current` and the status words. */
@Component({
  selector: 'andes-steps-tree',
  imports: [AndesSteps, AndesStep, AndesButton],
  template: `
    <div #host>
      <andes-steps aria-label="Order progress" [current]="step()">
        <andes-step title="Requested" description="Created by Lucia" />
        <andes-step title="Approved" subtitle="Tue" />
        <andes-step
          title="Shipped"
          status="error"
          description="The carrier rejected the label"
        />
        <andes-step title="Delivered" />
      </andes-steps>
    </div>
    <div [style]="bar + ' margin-block-start: 1.5rem'">
      <andes-button variant="outline" (click)="step.set((step() + 1) % 4)"
        >Move the current step</andes-button
      >
    </div>
    <pre [style]="code + ' margin-block-start: 1rem'">{{ tree() }}</pre>
  `,
})
class TreeDemo {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  protected readonly bar = bar;
  protected readonly code = code;
  protected readonly step = signal(1);
  protected readonly tree = signal('');

  constructor() {
    afterEveryRender(() => {
      const root = this.host.nativeElement.querySelector('ol');
      if (!root) {
        return;
      }
      const lines = [`list "${root.getAttribute('aria-label')}"`];
      this.host.nativeElement.querySelectorAll('andes-step').forEach((step) => {
        const title = step.querySelector('.andes-step__title');
        const current = step.getAttribute('aria-current');
        lines.push(
          `  listitem${current ? ` [aria-current="${current}"]` : ''}: ${title?.textContent?.replace(/\s+/g, ' ').trim()}`,
        );
      });
      const next = lines.join('\n');
      if (next !== this.tree()) {
        this.tree.set(next);
      }
    });
  }
}

/** Shows the polite announcement the trail makes when the current step changes. */
@Component({
  selector: 'andes-steps-live',
  imports: [AndesSteps, AndesStep, AndesButton],
  template: `
    <div #host>
      <andes-steps
        aria-label="Checkout"
        [current]="step()"
        [announce]="announce()"
      >
        <andes-step title="Cart" />
        <andes-step title="Address" />
        <andes-step title="Payment" />
        <andes-step title="Review" />
      </andes-steps>
    </div>
    <div [style]="bar + ' margin-block-start: 1.5rem'">
      <andes-button
        variant="outline"
        [disabled]="step() === 0"
        (click)="step.set(step() - 1)"
        >Back</andes-button
      >
      <andes-button [disabled]="step() === 3" (click)="step.set(step() + 1)"
        >Next</andes-button
      >
    </div>
    <p [style]="readout + ' margin-block-start: 1rem'">
      Live region: {{ heard() || 'silent' }}
    </p>
  `,
})
class LiveDemo {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  protected readonly bar = bar;
  protected readonly readout = readout;
  protected readonly step = signal(0);
  protected readonly announce = signal(true);
  protected readonly heard = signal('');

  constructor() {
    afterEveryRender(() => {
      const text =
        this.host.nativeElement
          .querySelector('.andes-steps__live')
          ?.textContent?.trim() ?? '';
      if (text !== this.heard()) {
        this.heard.set(text);
      }
    });
  }
}

/** The same trail with announcements switched off. */
@Component({
  selector: 'andes-steps-quiet',
  imports: [AndesSteps, AndesStep, AndesButton],
  template: `
    <andes-steps aria-label="Quiet" [announce]="false" [current]="step()">
      <andes-step title="One" />
      <andes-step title="Two" />
      <andes-step title="Three" />
    </andes-steps>
    <div [style]="bar + ' margin-block-start: 1.5rem'">
      <andes-button variant="outline" (click)="step.set((step() + 1) % 3)"
        >Next step</andes-button
      >
    </div>
  `,
})
class QuietDemo {
  protected readonly bar = bar;
  protected readonly step = signal(0);
}

const meta: Meta<AndesSteps> = {
  title: 'Navigation/Steps/Accessibility and motion',
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
        TreeDemo,
        LiveDemo,
        QuietDemo,
      ],
    }),
  ],
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<AndesSteps>;

const ALL_TYPES = `
  ${demo('default', `<andes-steps aria-label="Default" [current]="1">${FOUR}</andes-steps>`)}
  ${demo('dot', `<andes-steps aria-label="Dot" type="dot" [current]="1">${FOUR}</andes-steps>`)}
  ${demo('panel', `<andes-steps aria-label="Panel" type="panel" [current]="1">${FOUR}</andes-steps>`)}
  ${demo('navigation', `<andes-steps aria-label="Navigation" type="navigation" [current]="1">${FOUR}</andes-steps>`)}
  ${demo('inline', `<andes-steps aria-label="Inline" type="inline" [current]="1" style="max-width: 32rem">${FOUR}</andes-steps>`)}
  ${demo('error, solid', `<andes-steps aria-label="Error" variant="solid" status="error" [current]="2">${FOUR}</andes-steps>`)}`;

export const Semantics: Story = {
  name: 'List semantics',
  parameters: about(
    'The trail is an ordered list of list items labelled by the page, and the step in progress carries aria-current set to step.',
  ),
  render: () => ({ template: `<andes-steps-tree />` }),
};

export const StatusWords: Story = {
  name: 'Status is read out',
  parameters: about(
    'Each title is followed by a visually hidden word for its status, so the state is never carried by colour or shape alone.',
  ),
  render: () => ({
    template: `
      <p style="${muted} margin: 0 0 1rem; max-width: 36rem">A screen reader says "Account, Completed", "Billing, In progress", "Review, Error" and "Done, Upcoming".</p>
      <andes-steps aria-label="Sign up" [current]="1">
        <andes-step title="Account" />
        <andes-step title="Billing" />
        <andes-step title="Review" status="error" />
        <andes-step title="Done" />
      </andes-steps>`,
  }),
};

export const Announcements: Story = {
  name: 'Announcing a new step',
  parameters: about(
    'When the current step changes after the first render, a polite live region announces the new step and its position.',
  ),
  render: () => ({ template: `<andes-steps-live />` }),
};

export const AnnouncementsOff: Story = {
  name: 'Announcements off',
  parameters: about(
    'Turn the announcement off when your page already announces the change itself, such as a heading that takes focus.',
  ),
  render: () => ({ template: `<andes-steps-quiet />` }),
};

export const Labelled: Story = {
  name: 'Labelled by a heading',
  parameters: about(
    'The trail takes its name from a heading on the page with aria-labelledby, or from aria-label when there is none.',
  ),
  render: () => ({
    template: `
      <h2 id="steps-heading" style="margin: 0 0 1rem; font: 600 1rem/1.5rem var(--andes-font-family), sans-serif">Application progress</h2>
      <andes-steps aria-labelledby="steps-heading" [current]="1">${FOUR_DESCRIBED}</andes-steps>`,
  }),
};

export const FocusRing: Story = {
  name: 'Focus is visible',
  parameters: about(
    'A clickable step shows a two-pixel focus ring on the keyboard, drawn outside the step or inside it for the panel and navigation types.',
  ),
  render: () => ({
    template: demos(
      demo(
        'default',
        `<andes-steps aria-label="Default" clickable [current]="1">${FOUR}</andes-steps>`,
      ),
      demo(
        'panel',
        `<andes-steps aria-label="Panel" type="panel" clickable [current]="1">${FOUR}</andes-steps>`,
      ),
      demo(
        'navigation',
        `<andes-steps aria-label="Navigation" type="navigation" clickable [current]="1">${FOUR}</andes-steps>`,
      ),
    ),
  }),
};

export const RightToLeft: Story = {
  name: 'Right to left',
  parameters: {
    dir: 'rtl',
    ...about(
      'Under a right-to-left document the trail runs from the right, the connectors fill from the right and the arrow keys swap.',
    ),
  },
  render: () => ({
    template: demos(
      demo(
        'default',
        `<andes-steps aria-label="Default" clickable [current]="1">${FOUR_DESCRIBED}</andes-steps>`,
      ),
      demo(
        'title below',
        `<andes-steps aria-label="Title below" titlePlacement="vertical" [current]="1">${FOUR}</andes-steps>`,
      ),
      demo(
        'stacked',
        `<andes-steps aria-label="Stacked" orientation="vertical" [current]="1">${FOUR_DESCRIBED}</andes-steps>`,
      ),
    ),
  }),
};

export const RightToLeftTypes: Story = {
  name: 'Right to left in every type',
  parameters: {
    dir: 'rtl',
    ...about(
      'The dot, panel, navigation and inline types mirror too, including the chevron between the navigation cells.',
    ),
  },
  render: () => ({
    template: demos(
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
        `<andes-steps aria-label="Inline" type="inline" [current]="1" style="max-width: 32rem">${FOUR}</andes-steps>`,
      ),
    ),
  }),
};

export const DarkTheme: Story = {
  name: 'Dark theme',
  globals: { theme: 'dark' },
  parameters: about(
    'Markers, titles, connectors and the error colour switch to the dark palette and keep at least 4.5:1 contrast for text.',
  ),
  render: () => ({
    template: demos(
      demo(
        'default',
        `<andes-steps aria-label="Default" [current]="2">${FOUR_DESCRIBED}</andes-steps>`,
      ),
      demo(
        'error',
        `<andes-steps aria-label="Error" status="error" [current]="2">${FOUR_DESCRIBED}</andes-steps>`,
      ),
    ),
  }),
};

export const DarkAllTypes: Story = {
  name: 'Dark theme in every type',
  globals: { theme: 'dark' },
  parameters: about(
    'The five types and the solid variant in the dark theme, with an error on the last one.',
  ),
  render: () => ({
    template: `<div style="display: grid; gap: 2rem">${ALL_TYPES}</div>`,
  }),
};

export const LightAndDark: Story = {
  name: 'Light and dark side by side',
  parameters: about(
    'The same trail on a light and on a dark surface, to compare the contrast of every status at once.',
  ),
  render: () => ({
    template: `
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(20rem, 1fr)); gap: 1.5rem">
        <div style="padding: 1.5rem; border-radius: 0.75rem; background: #ffffff; border: 1px solid var(--andes-color-border)">
          <andes-steps aria-label="Light" orientation="vertical" [current]="1">
            <andes-step title="Finished" description="Done and checked" />
            <andes-step title="In progress" description="Working on it" />
            <andes-step title="Waiting" description="Not started" />
            <andes-step title="Failed" status="error" description="Needs attention" />
          </andes-steps>
        </div>
        <div data-andes-theme="dark" style="padding: 1.5rem; border-radius: 0.75rem; background: #0f172a; color: #f8fafc">
          <andes-steps aria-label="Dark" orientation="vertical" [current]="1">
            <andes-step title="Finished" description="Done and checked" />
            <andes-step title="In progress" description="Working on it" />
            <andes-step title="Waiting" description="Not started" />
            <andes-step title="Failed" status="error" description="Needs attention" />
          </andes-steps>
        </div>
      </div>`,
  }),
};

export const ReducedMotion: Story = {
  name: 'Reduced motion',
  parameters: about(
    'With the system setting for reduced motion, the connector fill, the icon entrance and the colour fades are switched off.',
  ),
  render: () => ({
    props: { picked: 1 },
    template: `
      <p style="${muted} margin: 0 0 1.5rem; max-width: 36rem">Turn on "reduce motion" in your system settings and click a step: it changes at once, with nothing fading or sliding.</p>
      <andes-steps aria-label="Motion" clickable [(current)]="picked">${FOUR}</andes-steps>`,
  }),
};

export const PhoneAccessible: Story = {
  name: 'At phone width',
  parameters: about(
    'At 360px the trail stacks so every title, description and status stays readable without scrolling sideways.',
  ),
  render: () => ({
    template: `
      <div style="box-sizing: border-box; width: 22.5rem; max-width: 100%">
        <andes-steps aria-label="Phone" clickable [current]="1">${FOUR_DESCRIBED}</andes-steps>
      </div>`,
  }),
};
