import { ErrorHandler, signal, type WritableSignal } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';

import {
  about,
  column,
  muted,
  remember,
  stage,
  withDescription,
  withPopoverKit,
  wideStage,
} from '../../testing/popover-story-kit';
import { AndesButton } from '../button/button';
import { AndesSwitch } from '../switch/switch';
import { AndesPopconfirmTrigger } from '../popover/popover-trigger';
import { AndesPopconfirm } from './popconfirm';

/** A request that settles after a moment. */
const wait = (ms: number) => new Promise<void>((done) => setTimeout(done, ms));

const meta: Meta<AndesPopconfirm> = {
  title: 'Feedback/Popconfirm/Async and states',
  component: AndesPopconfirm,
  decorators: [
    withDescription,
    withPopoverKit,
    moduleMetadata({
      imports: [AndesButton, AndesSwitch, NgIcon, AndesPopconfirmTrigger],
      // A rejected handler is reported to the app's error handler; the story keeps the console quiet.
      providers: [
        { provide: ErrorHandler, useValue: { handleError: () => undefined } },
      ],
    }),
  ],
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<AndesPopconfirm>;

/** Async confirm. */
export const AsyncConfirm: Story = {
  name: 'Async confirm',
  parameters: about(
    'onConfirm returns a promise, so OK shows its spinner and ignores further presses until it settles, and the panel closes when it resolves.',
  ),
  render: () => ({
    props: {
      status: signal(''),
      save: (status: WritableSignal<string>) => async () => {
        status.set('Saving...');
        await wait(1500);
        status.set('Saved.');
      },
      muted,
    },
    template: `
      <div style="${column} align-items: center; padding: 7rem 1rem 1rem;">
        <andes-popconfirm title="Save the changes?" [onConfirm]="save(status)">
          <andes-button variant="outline" andesPopconfirmTrigger>Save</andes-button>
        </andes-popconfirm>
        <span role="status" [style]="muted">{{ status() }}</span>
      </div>
    `,
  }),
};

/** Failure. */
export const FailedRequest: Story = {
  name: 'Failed request',
  parameters: about(
    'When the promise rejects the panel stays open, OK is enabled again and focus returns to it, so the person can retry or cancel.',
  ),
  render: () => ({
    props: {
      status: signal(''),
      save: (status: WritableSignal<string>) => async () => {
        status.set('Saving...');
        await wait(1000);
        status.set('The server did not answer. Try again.');
        throw new Error('Request failed');
      },
      muted,
    },
    template: `
      <div style="${column} align-items: center; padding: 7rem 1rem 1rem;">
        <andes-popconfirm title="Publish the page?" okText="Publish" [onConfirm]="save(status)">
          <andes-button variant="outline" andesPopconfirmTrigger>Publish</andes-button>
        </andes-popconfirm>
        <span role="status" [style]="muted">{{ status() }}</span>
      </div>
    `,
  }),
};

/** Async cancel. */
export const AsyncCancel: Story = {
  name: 'Async cancel',
  parameters: about(
    'onCancel can return a promise too, for a cancel that has to clean up first: both buttons wait for it and the panel closes when it ends.',
  ),
  render: () => ({
    props: {
      status: signal(''),
      discard: (status: WritableSignal<string>) => async () => {
        status.set('Discarding the draft...');
        await wait(1200);
        status.set('Draft discarded.');
      },
      muted,
    },
    template: `
      <div style="${column} align-items: center; padding: 7rem 1rem 1rem;">
        <andes-popconfirm title="Keep editing?" okText="Keep editing" cancelText="Discard" [onCancel]="discard(status)">
          <andes-button variant="outline" andesPopconfirmTrigger>Close editor</andes-button>
        </andes-popconfirm>
        <span role="status" [style]="muted">{{ status() }}</span>
      </div>
    `,
  }),
};

/** External loading. */
export const OkLoading: Story = {
  name: 'Loading from outside',
  parameters: about(
    'okLoading shows the spinner for work the page tracks on its own, and disables the button while it lasts.',
  ),
  render: () => ({
    props: { loading: signal(true) },
    template: `
      <div style="${column} align-items: center; padding: 7rem 1rem 1rem;">
        <andes-switch [(checked)]="loading">Loading</andes-switch>
        <andes-popconfirm title="Sync the data?" [okLoading]="loading()" [defaultOpen]="true">
          <andes-button variant="outline" andesPopconfirmTrigger>Sync</andes-button>
        </andes-popconfirm>
      </div>
    `,
  }),
};

/** Disabled. */
export const Disabled: Story = {
  name: 'Disabled',
  parameters: about(
    'A disabled popconfirm never opens, so a trigger can fall back to acting at once when there is nothing to lose.',
  ),
  render: () => ({
    props: {
      dirty: signal(true),
      status: signal(''),
      muted,
      leave: (status: WritableSignal<string>, dirty: boolean) =>
        status.set(dirty ? 'Asked first.' : 'Left at once.'),
    },
    template: `
      <div style="${column} align-items: center; padding: 7rem 1rem 1rem;">
        <andes-switch [(checked)]="dirty">There are unsaved changes</andes-switch>
        <andes-popconfirm title="Leave without saving?" [disabled]="!dirty()" okText="Leave" (confirm)="status.set('Left after asking.')">
          <andes-button variant="outline" andesPopconfirmTrigger (click)="dirty() || leave(status, false)">Leave</andes-button>
        </andes-popconfirm>
        <span role="status" [style]="muted">{{ status() }}</span>
      </div>
    `,
  }),
};

/** Disabled trigger. */
export const DisabledTrigger: Story = {
  name: 'Disabled trigger',
  parameters: about(
    'A disabled trigger button never opens the popconfirm, whatever it is bound to.',
  ),
  render: () => ({
    template: `
      <div style="${stage}">
        <andes-popconfirm title="Delete the task?">
          <andes-button variant="outline" [disabled]="true" andesPopconfirmTrigger>Delete</andes-button>
        </andes-popconfirm>
      </div>
    `,
  }),
};

/** Popup click. */
export const PopupClick: Story = {
  name: 'Clicks inside the panel',
  parameters: about(
    'popupClick reports every click inside the panel, buttons included, before the confirm or cancel they cause.',
  ),
  render: () => {
    const log = signal<string[]>([]);
    return {
      props: {
        log,
        muted,
        record: (entry: string) => remember(log, entry),
      },
      template: `
        <div style="${column} align-items: center; padding: 7rem 1rem 1rem;">
          <andes-popconfirm title="Archive the file?" description="Click anywhere on this panel." (popupClick)="record('click on ' + $any($event.target).tagName.toLowerCase())" (confirm)="record('confirm')" (cancelled)="record('cancelled')">
            <andes-button variant="outline" andesPopconfirmTrigger>Archive</andes-button>
          </andes-popconfirm>
          <ol aria-label="Events" [style]="muted + ' margin: 0; min-height: 5.5rem;'">
            @for (entry of log(); track $index) { <li>{{ entry }}</li> }
          </ol>
        </div>
      `,
    };
  },
};

/** Several at a time. */
export const ManyAtOnce: Story = {
  name: 'One question at a time',
  parameters: about(
    'Opening a second popconfirm counts as a press outside the first, which closes without confirming or cancelling.',
  ),
  render: () => ({
    template: `
      <div style="${wideStage}">
        <andes-popconfirm title="Delete the first?"><andes-button variant="outline" andesPopconfirmTrigger>First</andes-button></andes-popconfirm>
        <andes-popconfirm title="Delete the second?"><andes-button variant="outline" andesPopconfirmTrigger>Second</andes-button></andes-popconfirm>
      </div>
    `,
  }),
};
