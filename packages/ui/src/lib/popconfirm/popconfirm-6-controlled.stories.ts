import { signal } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';

import {
  about,
  bar,
  column,
  muted,
  remember,
  stage,
  withDescription,
  withPopoverKit,
} from '../../testing/popover-story-kit';
import { AndesButton } from '../button/button';
import { AndesSwitch } from '../switch/switch';
import { AndesPopconfirmTrigger } from '../popover/popover-trigger';
import type { AndesPopoverOpenChange } from '../popover/popover-types';
import { AndesPopconfirm } from './popconfirm';

const meta: Meta<AndesPopconfirm> = {
  title: 'Feedback/Popconfirm/Controlled',
  component: AndesPopconfirm,
  decorators: [
    withDescription,
    withPopoverKit,
    moduleMetadata({
      imports: [AndesButton, AndesSwitch, NgIcon, AndesPopconfirmTrigger],
    }),
  ],
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<AndesPopconfirm>;

/** Two-way open. */
export const TwoWayOpen: Story = {
  name: 'Two-way open',
  parameters: about(
    'open binds both ways, so a switch can open the question, and answering it, pressing Escape or clicking away writes false back.',
  ),
  render: () => ({
    props: { visible: signal(false) },
    template: `
      <div style="${column} align-items: center; padding: 7rem 1rem 1rem;">
        <andes-switch [(checked)]="visible">Open: {{ visible() }}</andes-switch>
        <andes-popconfirm [(open)]="visible" title="Delete the task?">
          <andes-button variant="outline" andesPopconfirmTrigger>Delete</andes-button>
        </andes-popconfirm>
      </div>
    `,
  }),
};

/** Reasons. */
export const OpenChangeDetail: Story = {
  name: 'Why it changed',
  parameters: about(
    'openChangeDetail names the cause of every change: click, confirm, cancel, escape-key, outside-click or imperative.',
  ),
  render: () => {
    const log = signal<string[]>([]);
    let count = 0;
    return {
      props: {
        log,
        muted,
        record: (change: AndesPopoverOpenChange) =>
          remember(
            log,
            `#${++count} ${change.open ? 'opened' : 'closed'} by ${change.source}`,
          ),
      },
      template: `
        <div style="${column} align-items: center; padding: 7rem 1rem 1rem;">
          <andes-popconfirm title="Delete the task?" (openChangeDetail)="record($event)">
            <andes-button variant="outline" andesPopconfirmTrigger>Delete</andes-button>
          </andes-popconfirm>
          <ol aria-label="Reasons" [style]="muted + ' margin: 0; min-height: 6.5rem;'">
            @for (entry of log(); track entry) { <li>{{ entry }}</li> }
          </ol>
        </div>
      `,
    };
  },
};

/** Default open. */
export const DefaultOpen: Story = {
  name: 'Open by default',
  parameters: about(
    'defaultOpen asks the question on the first render, as when a page loads with a pending decision.',
  ),
  render: () => ({
    template: `
      <div style="${stage}">
        <andes-popconfirm [defaultOpen]="true" title="Restore the unsaved draft?" okText="Restore" cancelText="Discard">
          <andes-button variant="outline" andesPopconfirmTrigger>Editor</andes-button>
        </andes-popconfirm>
      </div>
    `,
  }),
};

/** Programmatic. */
export const Programmatic: Story = {
  name: 'Show, close and toggle',
  parameters: about(
    'A template reference gives the show, close and toggle methods to any other control.',
  ),
  render: () => ({
    template: `
      <div style="${column} align-items: center; padding: 7rem 1rem 1rem;">
        <div style="${bar}">
          <andes-button size="sm" (click)="ask.show()">show()</andes-button>
          <andes-button size="sm" variant="outline" (click)="ask.close()">close()</andes-button>
          <andes-button size="sm" variant="outline" (click)="ask.toggle()">toggle()</andes-button>
        </div>
        <andes-popconfirm #ask title="Delete the task?">
          <andes-button variant="outline" andesPopconfirmTrigger>Anchor</andes-button>
        </andes-popconfirm>
      </div>
    `,
  }),
};

/** From another control. */
export const FromAnotherControl: Story = {
  name: 'Asked by another control',
  parameters: about(
    'An empty trigger list stops the anchor opening the question, so a different control, a Save button here, can ask it.',
  ),
  render: () => ({
    props: { visible: signal(false), status: signal(''), muted },
    template: `
      <div style="${column} align-items: center; padding: 7rem 1rem 1rem;">
        <div style="${bar}">
          <andes-button (click)="visible.set(true)">Publish</andes-button>
          <span [style]="muted">The question appears under the page title.</span>
        </div>
        <andes-popconfirm [trigger]="[]" [(open)]="visible" placement="bottom" title="Publish to everyone?" okText="Publish" (confirm)="status.set('Published.')" (cancelled)="status.set('Kept as a draft.')">
          <span andesPopconfirmTrigger style="font-weight: 500; font-size: 0.875rem;">Quarterly report</span>
        </andes-popconfirm>
        <span role="status" [style]="muted">{{ status() }}</span>
      </div>
    `,
  }),
};

/** Must decide. */
export const MustDecide: Story = {
  name: 'Must decide',
  parameters: about(
    'With closeOnEscape and closeOnOutsideClick off, only OK or Cancel closes the question, for a decision that cannot be left hanging.',
  ),
  render: () => ({
    template: `
      <div style="${stage}">
        <andes-popconfirm [closeOnEscape]="false" [closeOnOutsideClick]="false" title="Accept the new terms?" description="You need to answer to continue." okText="Accept" cancelText="Decline">
          <andes-button variant="outline" andesPopconfirmTrigger>Continue</andes-button>
        </andes-popconfirm>
      </div>
    `,
  }),
};
