import { signal, type WritableSignal } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';

import {
  about,
  bar,
  caption,
  column,
  muted,
  remember,
  stage,
  withDescription,
  withPopoverKit,
  wideStage,
} from '../../testing/popover-story-kit';
import { AndesButton } from '../button/button';
import { AndesInput } from '../input/input';
import { AndesSwitch } from '../switch/switch';
import { AndesPopover } from './popover';
import { AndesPopoverContent } from './popover-content';
import { AndesPopoverClose } from './popover-parts';
import { AndesPopoverTrigger } from './popover-trigger';
import type { AndesPopoverOpenChange } from './popover-types';

const meta: Meta<AndesPopover> = {
  title: 'Data Display/Popover/Controlled',
  component: AndesPopover,
  decorators: [
    withDescription,
    withPopoverKit,
    moduleMetadata({
      imports: [
        AndesButton,
        AndesInput,
        AndesSwitch,
        NgIcon,
        AndesPopoverTrigger,
        AndesPopoverContent,
        AndesPopoverClose,
      ],
    }),
  ],
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<AndesPopover>;

/** Two-way binding. */
export const TwoWayOpen: Story = {
  name: 'Two-way open',
  parameters: about(
    'open binds both ways: the trigger, Escape and outside clicks write to the field, and the field can open or close the panel from anywhere.',
  ),
  render: () => ({
    props: { visible: signal(false) },
    template: `
      <div style="${column} align-items: center; padding: 6rem 1rem;">
        <andes-switch [(checked)]="visible">Open: {{ visible() }}</andes-switch>
        <andes-popover [(open)]="visible" title="Bound" content="Close me with Escape, an outside press or the switch." [showArrow]="true">
          <andes-button variant="outline" andesPopoverTrigger>Trigger</andes-button>
        </andes-popover>
      </div>
    `,
  }),
};

/** openChange. */
export const OpenChangeLog: Story = {
  name: 'Open change log',
  parameters: about(
    'openChange fires for every change the popover makes itself, but not when the field is written, so the log shows user actions only.',
  ),
  render: () => {
    const log = signal<string[]>([]);
    let count = 0;
    return {
      props: {
        visible: signal(false),
        log,
        record: (open: boolean) =>
          remember(log, `#${++count} ${open ? 'opened' : 'closed'}`),
        muted,
      },
      template: `
        <div style="${column} align-items: center; padding: 6rem 1rem;">
          <andes-button (click)="visible.set(!visible())">Toggle from outside (not logged)</andes-button>
          <andes-popover [(open)]="visible" (openChange)="record($event)" content="Open and close me, then read the log." [showArrow]="true">
            <andes-button variant="outline" andesPopoverTrigger>Trigger</andes-button>
          </andes-popover>
          <ol aria-label="openChange log" [style]="muted + ' margin: 0; min-height: 6.5rem;'">
            @for (entry of log(); track entry) { <li>{{ entry }}</li> }
          </ol>
        </div>
      `,
    };
  },
};

/** openChangeDetail. */
export const OpenChangeDetail: Story = {
  name: 'Why it changed',
  parameters: about(
    'openChangeDetail adds the cause to each change: click, hover, focus, contextMenu, escape-key, outside-click, close-button or imperative.',
  ),
  render: () => {
    const log = signal<string[]>([]);
    let count = 0;
    return {
      props: {
        log,
        record: (change: AndesPopoverOpenChange) =>
          remember(
            log,
            `#${++count} ${change.open ? 'opened' : 'closed'} by ${change.source}`,
          ),
        muted,
      },
      template: `
        <div style="${column} align-items: center; padding: 6rem 1rem;">
          <andes-popover [trigger]="['click', 'hover']" (openChangeDetail)="record($event)" [showArrow]="true" [content]="body">
            <andes-button variant="outline" andesPopoverTrigger>Hover, click, then dismiss</andes-button>
          </andes-popover>
          <ng-template #body let-close="close">
            <andes-button size="sm" variant="outline" (click)="close()">Close from content</andes-button>
          </ng-template>
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
    'defaultOpen draws the panel on the first render, then leaves it to the user: it is read once, so it is not a binding.',
  ),
  render: () => ({
    template: `
      <div style="${stage}">
        <andes-popover [defaultOpen]="true" title="Welcome" content="This opened on its own, and closes like any other." [showArrow]="true">
          <andes-button variant="outline" andesPopoverTrigger>Open at start</andes-button>
        </andes-popover>
      </div>
    `,
  }),
};

/** Programmatic calls. */
export const Programmatic: Story = {
  name: 'Show, close and toggle',
  parameters: about(
    'A template reference to the popover gives its show, close and toggle methods, so any button, timer or handler can drive it.',
  ),
  render: () => ({
    template: `
      <div style="${column} align-items: center; padding: 6rem 1rem;">
        <div style="${bar}">
          <andes-button size="sm" (click)="pop.show()">show()</andes-button>
          <andes-button size="sm" variant="outline" (click)="pop.close()">close()</andes-button>
          <andes-button size="sm" variant="outline" (click)="pop.toggle()">toggle()</andes-button>
        </div>
        <andes-popover #pop title="Driven from outside" content="Opened and closed by the three buttons above." [showArrow]="true">
          <andes-button variant="outline" andesPopoverTrigger>Anchor</andes-button>
        </andes-popover>
      </div>
    `,
  }),
};

/** After a delay. */
export const OpenAfterDelay: Story = {
  name: 'Opened by a timer',
  parameters: about(
    'A handler can open the panel at the right moment, here two seconds after the button is pressed, as for a hint that follows an action.',
  ),
  render: () => ({
    props: {
      visible: signal(false),
      remindMe: (visible: WritableSignal<boolean>) =>
        setTimeout(() => visible.set(true), 2000),
    },
    template: `
      <div style="${column} align-items: center; padding: 6rem 1rem;">
        <andes-button size="sm" (click)="remindMe(visible)">Remind me in 2 seconds</andes-button>
        <andes-popover [(open)]="visible" [trigger]="[]" title="Time is up" content="Press Escape to dismiss." [showArrow]="true">
          <andes-button variant="outline" andesPopoverTrigger>Reminder</andes-button>
        </andes-popover>
      </div>
    `,
  }),
};

/** Not dismissible. */
export const NotDismissible: Story = {
  name: 'Not dismissible',
  parameters: about(
    'With closeOnEscape and closeOnOutsideClick off only the trigger, a button inside or the bound field can close the panel.',
  ),
  render: () => ({
    template: `
      <div style="${stage}">
        <andes-popover [closeOnEscape]="false" [closeOnOutsideClick]="false" title="Read this first" [content]="body" [showArrow]="true">
          <andes-button variant="outline" andesPopoverTrigger>Terms</andes-button>
        </andes-popover>
        <ng-template #body>
          <p style="margin: 0 0 0.75rem;">Escape and outside presses do nothing here.</p>
          <andes-button size="sm" andesPopoverClose>I understand</andes-button>
        </ng-template>
      </div>
    `,
  }),
};

/** Keep alive. */
export const KeepAlive: Story = {
  name: 'Keeping or discarding state',
  parameters: about(
    'A template keeps its state between openings by default, so a typed value is still there, while destroyOnHidden builds it again each time.',
  ),
  render: () => ({
    props: { kept: signal('draft'), fresh: signal('draft') },
    template: `
      <div style="${wideStage}">
        <andes-popover title="Kept" [content]="keptBody" [showArrow]="true">
          <andes-button variant="outline" andesPopoverTrigger>Keep state</andes-button>
        </andes-popover>
        <andes-popover [destroyOnHidden]="true" title="Discarded" [content]="freshBody" [showArrow]="true">
          <andes-button variant="outline" andesPopoverTrigger>destroyOnHidden</andes-button>
        </andes-popover>
        <ng-template #keptBody><andes-input aria-label="Kept note" size="sm" placeholder="Type, close, reopen" /></ng-template>
        <ng-template #freshBody><andes-input aria-label="Discarded note" size="sm" placeholder="Type, close, reopen" /></ng-template>
      </div>
    `,
  }),
};

/** Veto a close. */
export const StayOpenUntilValid: Story = {
  name: 'Stay open until valid',
  parameters: about(
    'The page can refuse a close by writing open back, here keeping the panel up until the field holds a value.',
  ),
  render: () => ({
    props: {
      visible: signal(true),
      value: signal(''),
      caption,
      tryClose: (
        visible: WritableSignal<boolean>,
        next: boolean,
        value: string,
      ) => visible.set(next || !value),
    },
    template: `
      <div style="${stage}">
        <andes-popover [open]="visible()" (openChange)="tryClose(visible, $event, value())" title="Name your file" [content]="body" [showArrow]="true">
          <andes-button variant="outline" andesPopoverTrigger>Name</andes-button>
        </andes-popover>
        <ng-template #body>
          <andes-input aria-label="File name" size="sm" placeholder="Required" [(value)]="value" />
          <p [style]="caption + ' margin: 0.5rem 0 0;'">The panel will not close while this is empty.</p>
        </ng-template>
      </div>
    `,
  }),
};

/** Two panels, one at a time. */
export const OneAtATime: Story = {
  name: 'One at a time',
  parameters: about(
    'Opening one panel closes the other, because a press on another trigger is a press outside the first.',
  ),
  render: () => ({
    template: `
      <div style="${wideStage}">
        <andes-popover title="First" content="Open the second one and I close." [showArrow]="true">
          <andes-button variant="outline" andesPopoverTrigger>First</andes-button>
        </andes-popover>
        <andes-popover title="Second" content="Open the first one and I close." [showArrow]="true">
          <andes-button variant="outline" andesPopoverTrigger>Second</andes-button>
        </andes-popover>
      </div>
    `,
  }),
};
