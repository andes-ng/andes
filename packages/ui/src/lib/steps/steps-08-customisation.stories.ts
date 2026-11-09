import { Component, signal, ViewEncapsulation } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';

import {
  about,
  bar,
  demo,
  demos,
  FOUR,
  FOUR_DESCRIBED,
  muted,
  withDescription,
  withStepsKit,
} from '../../testing/steps-story-kit';
import { AndesBadge } from '../badge/badge';
import { AndesButton } from '../button/button';
import { AndesTag } from '../tag/tag';
import { AndesStep } from './step';
import { AndesSteps } from './steps';
import type { AndesStepsPartInfo } from './steps-types';

/** Classes of this demo, written once with enough weight to win over the component's styles. */
@Component({
  selector: 'andes-steps-classes',
  imports: [AndesSteps, AndesStep],
  encapsulation: ViewEncapsulation.None,
  styles: `
    .demo-steps .demo-root {
      padding: 1rem;
      border-radius: 0.75rem;
      background: var(--andes-color-muted);
    }
    .demo-steps .demo-item.demo-item {
      padding-inline: 0.25rem;
    }
    .demo-steps .demo-icon.demo-icon {
      border-radius: 0.375rem;
    }
    .demo-steps .demo-title.demo-title {
      text-transform: uppercase;
      letter-spacing: 0.04em;
      font-size: 0.75rem;
    }
    .demo-steps .demo-subtitle.demo-subtitle {
      font-style: italic;
    }
    .demo-steps .demo-description.demo-description {
      font-size: 0.75rem;
    }
    .demo-steps .demo-tail.demo-tail {
      block-size: 3px;
      border-radius: 9999px;
    }
  `,
  template: `
    <div class="demo-steps">
      <andes-steps aria-label="Class names" [current]="1" [classNames]="names">
        <andes-step
          title="Account"
          subtitle="2 min"
          description="Create a login"
        />
        <andes-step title="Billing" subtitle="1 min" description="Add a card" />
        <andes-step title="Review" subtitle="Last" description="Check it all" />
      </andes-steps>
    </div>
  `,
})
class ClassesDemo {
  protected readonly names = {
    root: 'demo-root',
    item: 'demo-item',
    icon: 'demo-icon',
    title: 'demo-title',
    subtitle: 'demo-subtitle',
    description: 'demo-description',
    tail: 'demo-tail',
  };
}

/** Buttons that finish the next step, so the connector fill and the glyph entrance can be seen. */
@Component({
  selector: 'andes-steps-animated',
  imports: [AndesSteps, AndesStep, AndesButton],
  template: `
    <andes-steps
      aria-label="Progress"
      [current]="step()"
      [connector]="connector"
    >
      <andes-step title="Account" />
      <andes-step title="Billing" />
      <andes-step title="Review" />
      <andes-step title="Done" />
    </andes-steps>
    <div [style]="bar + ' margin-block-start: 1.5rem'">
      <andes-button
        variant="outline"
        [disabled]="step() === 0"
        (click)="step.set(step() - 1)"
        >Back</andes-button
      >
      <andes-button [disabled]="step() === 4" (click)="step.set(step() + 1)"
        >Finish this step</andes-button
      >
      <andes-button variant="ghost" (click)="step.set(0)">Restart</andes-button>
    </div>
  `,
})
class AnimatedDemo {
  protected readonly bar = bar;
  protected readonly step = signal(0);
  protected readonly connector = 'solid';
}

const meta: Meta<AndesSteps> = {
  title: 'Navigation/Steps/Customisation',
  component: AndesSteps,
  tags: ['autodocs'],
  decorators: [
    withDescription,
    withStepsKit,
    moduleMetadata({
      imports: [
        AndesSteps,
        AndesStep,
        AndesBadge,
        AndesButton,
        AndesTag,
        NgIcon,
        ClassesDemo,
        AnimatedDemo,
      ],
    }),
  ],
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<AndesSteps>;

export const ClassNames: Story = {
  name: 'Class names per part',
  parameters: about(
    'The classNames input adds your own classes to the root, item, icon, content, title, sub title, description and tail of the trail.',
  ),
  render: () => ({ template: `<andes-steps-classes />` }),
};

export const ClassNamesFunction: Story = {
  name: 'Class names from a function',
  parameters: about(
    'A function receives the state of the trail and of each step, so the classes can follow the status, the index or the type.',
  ),
  render: () => ({
    props: {
      names: (info: AndesStepsPartInfo) => ({
        item:
          info.stepStatus === 'finish'
            ? 'is-finished'
            : info.index === info.current
              ? 'is-current'
              : 'is-upcoming',
        root: `type-${info.type}`,
      }),
    },
    template: `
      <p style="${muted} margin: 0 0 1rem">Inspect the markup: every step carries a class that depends on its status.</p>
      <andes-steps aria-label="Class function" [current]="1" [classNames]="names">${FOUR}</andes-steps>`,
  }),
};

export const StylesObject: Story = {
  name: 'Styles per part',
  parameters: about(
    'The styles input sets inline styles on any part, here a larger title, a squarer marker and a thicker connector.',
  ),
  render: () => ({
    props: {
      parts: {
        title: { fontSize: '1rem', letterSpacing: '-0.01em' },
        icon: { borderRadius: '0.375rem' },
        tail: { height: '3px', borderRadius: '9999px' },
        description: { fontStyle: 'italic' },
      },
    },
    template: `<andes-steps aria-label="Styles" [current]="1" [styles]="parts">${FOUR_DESCRIBED}</andes-steps>`,
  }),
};

export const StylesFunction: Story = {
  name: 'Styles from a function',
  parameters: about(
    'A styles function can colour a part from the state, here dimming the steps to come and underlining the current title.',
  ),
  render: () => ({
    props: {
      parts: (info: AndesStepsPartInfo) => ({
        item: { opacity: info.stepStatus === 'wait' ? 0.6 : 1 },
        title: {
          textDecoration: info.index === info.current ? 'underline' : 'none',
          textUnderlineOffset: '0.25rem',
        },
      }),
    },
    template: `<andes-steps aria-label="Styles" [current]="1" [styles]="parts">${FOUR_DESCRIBED}</andes-steps>`,
  }),
};

export const StylesRoot: Story = {
  name: 'Styles on the root',
  parameters: about(
    'The root part reaches the trail itself, for a background, a border or a maximum width around all the steps.',
  ),
  render: () => ({
    props: {
      parts: {
        root: {
          padding: '1.25rem 1.5rem',
          border: '1px solid var(--andes-color-border)',
          borderRadius: '0.75rem',
          background: 'var(--andes-color-card)',
        },
      },
    },
    template: `<andes-steps aria-label="Styles" [current]="1" [styles]="parts">${FOUR}</andes-steps>`,
  }),
};

export const Tokens: Story = {
  name: 'Custom properties',
  parameters: about(
    'The width of the descriptions and the colour of the navigation chevron are custom properties, set on the trail or any ancestor.',
  ),
  render: () => ({
    template: demos(
      demo(
        '--andes-steps-description-max-width: 16rem',
        `<andes-steps aria-label="Wide descriptions" style="--andes-steps-description-max-width: 16rem" [current]="1">${FOUR_DESCRIBED}</andes-steps>`,
      ),
      demo(
        '--andes-steps-nav-arrow-color',
        `<andes-steps aria-label="Chevron" type="navigation" style="--andes-steps-nav-arrow-color: var(--andes-color-primary)" [current]="1">${FOUR}</andes-steps>`,
      ),
    ),
  }),
};

export const ConnectorSolid: Story = {
  name: 'Solid connector',
  parameters: about(
    'The default connector is a thin solid line that fills as the steps are finished.',
  ),
  render: () => ({
    template: `<andes-steps aria-label="Solid" connector="solid" [current]="2">${FOUR}</andes-steps>`,
  }),
};

export const ConnectorDashed: Story = {
  name: 'Dashed connector',
  parameters: about(
    'A dashed connector suits steps that are optional or still tentative, and fills in the same way.',
  ),
  render: () => ({
    template: demos(
      demo(
        'horizontal',
        `<andes-steps aria-label="Dashed" connector="dashed" [current]="2">${FOUR}</andes-steps>`,
      ),
      demo(
        'stacked',
        `<andes-steps aria-label="Dashed stacked" orientation="vertical" connector="dashed" [current]="2">${FOUR}</andes-steps>`,
      ),
    ),
  }),
};

export const ConnectorDotted: Story = {
  name: 'Dotted connector',
  parameters: about(
    'A dotted connector is the lightest line, for a trail with many small steps.',
  ),
  render: () => ({
    template: demos(
      demo(
        'horizontal',
        `<andes-steps aria-label="Dotted" connector="dotted" [current]="2">${FOUR}</andes-steps>`,
      ),
      demo(
        'stacked',
        `<andes-steps aria-label="Dotted stacked" orientation="vertical" connector="dotted" [current]="2">${FOUR}</andes-steps>`,
      ),
    ),
  }),
};

export const ConnectorAnimation: Story = {
  name: 'Connector that fills',
  parameters: about(
    'When a step finishes the line after it fills from the start in 300 milliseconds, and the number turns into a check.',
  ),
  render: () => ({ template: `<andes-steps-animated />` }),
};

export const Optional: Story = {
  name: 'Optional steps',
  parameters: about(
    'The optional flag adds a muted "Optional" after the title, and a string replaces the word.',
  ),
  render: () => ({
    template: `
      <andes-steps aria-label="Setup" [current]="1">
        <andes-step title="Account" />
        <andes-step title="Profile photo" optional />
        <andes-step title="Invite friends" optional="Skippable" />
        <andes-step title="Done" />
      </andes-steps>`,
  }),
};

export const OptionalVertical: Story = {
  name: 'Optional steps, stacked',
  parameters: about(
    'An optional step keeps its label on the title line in the stacked layout too.',
  ),
  render: () => ({
    template: `
      <andes-steps aria-label="Setup" orientation="vertical" [current]="1">
        <andes-step title="Account" description="Required" />
        <andes-step title="Profile photo" optional description="Helps people recognise you" />
        <andes-step title="Invite friends" optional description="You can do it later" />
        <andes-step title="Done" />
      </andes-steps>`,
  }),
};

export const Badges: Story = {
  name: 'Badges and counters',
  parameters: about(
    'A title template can hold a badge or a tag, for a count of items to fix or a label on a step.',
  ),
  render: () => ({
    template: `
      <andes-steps aria-label="Review" [current]="1">
        <andes-step [title]="inbox" />
        <andes-step [title]="issues" />
        <andes-step [title]="release" />
      </andes-steps>
      <ng-template #inbox><span style="display: inline-flex; align-items: center; gap: 0.5rem">Inbox <andes-badge [count]="12" variant="secondary" /></span></ng-template>
      <ng-template #issues><span style="display: inline-flex; align-items: center; gap: 0.5rem">Issues <andes-badge [count]="3" /></span></ng-template>
      <ng-template #release><span style="display: inline-flex; align-items: center; gap: 0.5rem">Release <andes-tag color="success">New</andes-tag></span></ng-template>`,
  }),
};

export const RichTitle: Story = {
  name: 'Rich title and description',
  parameters: about(
    'Titles, sub titles and descriptions accept templates, so any markup can be set in them.',
  ),
  render: () => ({
    template: `
      <andes-steps aria-label="Shipment" [current]="1" style="max-width: 44rem">
        <andes-step [title]="warehouse" [description]="packed" />
        <andes-step title="In transit" [subtitle]="eta" />
        <andes-step title="Delivered" />
      </andes-steps>
      <ng-template #warehouse><strong>Warehouse</strong> <em>(Lima)</em></ng-template>
      <ng-template #packed>Packed at dock <b>2</b> by <em>Marco</em></ng-template>
      <ng-template #eta><span style="color: var(--andes-color-primary-text)">ETA Thu</span></ng-template>`,
  }),
};

export const ProjectedContent: Story = {
  name: 'Content inside a step',
  parameters: about(
    'Anything placed inside a step is drawn under its description, such as a tag, a note or a pair of buttons.',
  ),
  render: () => ({
    template: `
      <andes-steps aria-label="Review" orientation="vertical" [current]="1" style="max-width: 28rem">
        <andes-step title="Draft" description="Written by Lucia" />
        <andes-step title="Review" description="Two reviewers are assigned">
          <div style="display: flex; gap: 0.5rem; margin-block-start: 0.5rem"><andes-tag color="info">Ines</andes-tag><andes-tag color="success">Marco</andes-tag></div>
        </andes-step>
        <andes-step title="Publish" />
      </andes-steps>`,
  }),
};

export const Labels: Story = {
  name: 'Translated labels',
  parameters: about(
    'The labels input replaces the hidden status words, the announcement and the optional label, for a page in another language.',
  ),
  render: () => ({
    props: {
      es: {
        wait: 'Pendiente',
        process: 'En curso',
        finish: 'Completado',
        error: 'Error',
        optional: 'Opcional',
        stepOf: 'Paso {index} de {count}: {title}',
      },
    },
    template: `
      <andes-steps aria-label="Registro" [labels]="es" [current]="1">
        <andes-step title="Cuenta" />
        <andes-step title="Foto" optional />
        <andes-step title="Listo" />
      </andes-steps>`,
  }),
};

export const MarkerSizes: Story = {
  name: 'Sizes in context',
  parameters: about(
    'The default and small sizes beside body text, to judge which one fits the surrounding type.',
  ),
  render: () => ({
    template: `
      <div style="display: grid; gap: 1.5rem; max-width: 36rem">
        <div>
          <p style="font: 600 1rem/1.5rem var(--andes-font-family), sans-serif; margin: 0 0 0.25rem">Account setup</p>
          <p style="${muted} margin: 0 0 1rem">Finish these steps to start using the product.</p>
          <andes-steps aria-label="Default" [current]="1">${FOUR}</andes-steps>
        </div>
        <div>
          <p style="font: 600 0.875rem/1.25rem var(--andes-font-family), sans-serif; margin: 0 0 0.25rem">Account setup</p>
          <p style="${muted} font-size: 0.8125rem; margin: 0 0 0.75rem">Finish these steps to start using the product.</p>
          <andes-steps aria-label="Small" size="small" [current]="1">${FOUR}</andes-steps>
        </div>
      </div>`,
  }),
};
