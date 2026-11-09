import { signal, type WritableSignal } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';

import {
  about,
  bar,
  column,
  list,
  muted,
  row,
  stage,
  withDescription,
  withPopoverKit,
} from '../../testing/popover-story-kit';
import { AndesAvatar } from '../avatar/avatar';
import { AndesAvatarFallback } from '../avatar/avatar-fallback';
import { AndesButton } from '../button/button';
import { AndesInput } from '../input/input';
import { AndesPopover } from '../popover/popover';
import { AndesPopoverContent } from '../popover/popover-content';
import { AndesPopoverClose } from '../popover/popover-parts';
import {
  AndesPopconfirmTrigger,
  AndesPopoverTrigger,
} from '../popover/popover-trigger';
import { AndesTag } from '../tag/tag';
import { AndesPopconfirm } from './popconfirm';

const meta: Meta<AndesPopconfirm> = {
  title: 'Feedback/Popconfirm/Compositions',
  component: AndesPopconfirm,
  decorators: [
    withDescription,
    withPopoverKit,
    moduleMetadata({
      imports: [
        AndesAvatar,
        AndesAvatarFallback,
        AndesButton,
        AndesInput,
        AndesPopover,
        AndesPopoverContent,
        AndesPopoverClose,
        AndesPopoverTrigger,
        AndesTag,
        NgIcon,
        AndesPopconfirmTrigger,
      ],
    }),
  ],
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<AndesPopconfirm>;

/** Rows of a list. */
export const DeleteFromList: Story = {
  name: 'Delete a row of a list',
  parameters: about(
    'One popconfirm per row, each naming the row in its question, and confirming removes that row from the list.',
  ),
  render: () => ({
    props: {
      tasks: signal([
        'Write the release notes',
        'Review the pull request',
        'Update the roadmap',
      ]),
      remove: (tasks: WritableSignal<string[]>, task: string) =>
        tasks.update((all) => all.filter((item) => item !== task)),
      reset: (tasks: WritableSignal<string[]>) =>
        tasks.set([
          'Write the release notes',
          'Review the pull request',
          'Update the roadmap',
        ]),
      list,
      row,
      muted,
    },
    template: `
      <div style="${stage} flex-direction: column; align-items: stretch; max-width: 32rem; margin: 0 auto;">
        <div [style]="list" role="list">
          @for (task of tasks(); track task) {
            <div [style]="row" role="listitem">
              <span style="font-size: 0.875rem;">{{ task }}</span>
              <andes-popconfirm placement="left" [title]="'Delete ' + task + '?'" okType="danger" okText="Delete" (confirm)="remove(tasks, task)">
                <andes-button size="icon-sm" variant="ghost" andesPopconfirmTrigger [aria-label]="'Delete ' + task">
                  <ng-icon name="lucideTrash2" aria-hidden="true" />
                </andes-button>
              </andes-popconfirm>
            </div>
          } @empty {
            <div [style]="row"><span [style]="muted">Nothing left to do.</span></div>
          }
        </div>
        <div><andes-button size="sm" variant="outline" (click)="reset(tasks)">Restore the list</andes-button></div>
      </div>
    `,
  }),
};

/** Table of members. */
export const MembersTable: Story = {
  name: 'Rows with columns',
  parameters: about(
    'A grid of members with an avatar, a role tag and a Remove action per row, where each action asks before removing the member.',
  ),
  render: () => ({
    props: {
      members: signal([
        { name: 'Ana Torres', initials: 'AT', role: 'Owner', color: 'success' },
        { name: 'Luis Rojas', initials: 'LR', role: 'Editor', color: 'info' },
        {
          name: 'Marta Díaz',
          initials: 'MD',
          role: 'Viewer',
          color: 'default',
        },
      ]),
      remove: (members: WritableSignal<{ name: string }[]>, name: string) =>
        members.update((all) => all.filter((item) => item.name !== name)),
      list,
      row,
    },
    template: `
      <div style="${stage}">
        <div [style]="list">
          @for (member of members(); track member.name) {
            <div [style]="row">
              <div style="display: flex; align-items: center; gap: 0.625rem; min-width: 0; flex: 1;">
                <andes-avatar size="sm"><andes-avatar-fallback>{{ member.initials }}</andes-avatar-fallback></andes-avatar>
                <span style="font-size: 0.875rem; flex: 1;">{{ member.name }}</span>
                <andes-tag [color]="member.color">{{ member.role }}</andes-tag>
              </div>
              <andes-popconfirm placement="bottomRight" [title]="'Remove ' + member.name + '?'" description="They will lose access to the workspace." okType="danger" okText="Remove" (confirm)="remove(members, member.name)">
                <andes-button size="sm" variant="outline" andesPopconfirmTrigger>Remove</andes-button>
              </andes-popconfirm>
            </div>
          }
        </div>
      </div>
    `,
  }),
};

/** Bulk action. */
export const BulkDelete: Story = {
  name: 'Bulk action in a toolbar',
  parameters: about(
    'A toolbar action that applies to a selection: the question carries the count, and the button is disabled while nothing is selected.',
  ),
  render: () => ({
    props: { selected: signal(3), status: signal(''), muted },
    template: `
      <div style="${column} align-items: center; padding: 7rem 1rem 1rem;">
        <div style="${bar}">
          <andes-button size="sm" variant="outline" (click)="selected.set(selected() + 1)">Select one more</andes-button>
          <andes-popconfirm [title]="'Delete ' + selected() + ' items?'" description="They will be moved to the trash." okType="danger" okText="Delete" (confirm)="status.set('Deleted ' + selected() + ' items.'); selected.set(0)">
            <andes-button size="sm" variant="danger" andesPopconfirmTrigger [disabled]="selected() === 0">Delete {{ selected() }} selected</andes-button>
          </andes-popconfirm>
        </div>
        <span role="status" [style]="muted">{{ status() }}</span>
      </div>
    `,
  }),
};

/** Turn something off. */
export const TurnOff: Story = {
  name: 'Confirm turning something off',
  parameters: about(
    'A setting that is protective stays on until the question is answered, and only OK turns it off.',
  ),
  render: () => ({
    props: { enabled: signal(true) },
    template: `
      <div style="${stage}">
        <span style="font-size: 0.875rem;">Two-step sign-in</span>
        <andes-tag [color]="enabled() ? 'success' : 'default'">{{ enabled() ? 'On' : 'Off' }}</andes-tag>
        @if (enabled()) {
          <andes-popconfirm title="Turn off two-step sign-in?" description="Your account will be less protected." okType="danger" okText="Turn off" placement="bottom" (confirm)="enabled.set(false)">
            <andes-button size="sm" variant="outline" andesPopconfirmTrigger>Turn off</andes-button>
          </andes-popconfirm>
        } @else {
          <andes-button size="sm" variant="outline" (click)="enabled.set(true)">Turn on</andes-button>
        }
      </div>
    `,
  }),
};

/** Unsaved changes. */
export const LeaveWithoutSaving: Story = {
  name: 'Leave without saving',
  parameters: about(
    'A form that asks before it throws edits away: the question appears only while the field holds a change, and an empty field closes at once.',
  ),
  render: () => ({
    props: { name: signal('Draft title'), status: signal(''), muted },
    template: `
      <div style="${column} align-items: center; padding: 7rem 1rem 1rem;">
        <andes-input aria-label="Title" placeholder="Clear the field to skip the question" style="width: 16rem;" [(value)]="name" />
        <div style="${bar}">
          <andes-popconfirm [disabled]="!name()" title="Discard your changes?" okText="Discard" cancelText="Stay" okType="danger" (confirm)="name.set(''); status.set('Changes discarded.')">
            <andes-button variant="outline" andesPopconfirmTrigger (click)="name() || status.set('Nothing to discard.')">Close</andes-button>
          </andes-popconfirm>
          <andes-button (click)="status.set('Saved ' + name()); name.set('')" [disabled]="!name()">Save</andes-button>
        </div>
        <span role="status" [style]="muted">{{ status() }}</span>
      </div>
    `,
  }),
};

/** Sign out. */
export const SignOut: Story = {
  name: 'Sign out of every device',
  parameters: about(
    'An account action with a lucide icon, a description and an OK button named for what it does.',
  ),
  render: () => ({
    template: `
      <div style="${stage}">
        <andes-popconfirm icon="lucideLogOut" placement="bottomRight" title="Sign out everywhere?" description="You will have to sign in again on each device." okText="Sign out" [showArrow]="true">
          <andes-button variant="outline" andesPopconfirmTrigger><ng-icon name="lucideLogOut" aria-hidden="true" /> Sign out</andes-button>
        </andes-popconfirm>
      </div>
    `,
  }),
};

/** Inside a popover. */
export const InsidePopover: Story = {
  name: 'Inside a popover',
  parameters: about(
    'A popconfirm opened from a popover panel: answering it, or pressing Escape, closes only the question and leaves the panel open.',
  ),
  render: () => ({
    props: { status: signal(''), muted },
    template: `
      <div style="${stage}">
        <andes-popover placement="bottomLeft" [showArrow]="true">
          <andes-button variant="outline" andesPopoverTrigger>Project settings</andes-button>
          <andes-popover-content style="width: 16rem;">
            <div style="display: flex; flex-direction: column; gap: 0.75rem;">
              <span style="font-weight: 500;">Project atlas</span>
              <span [style]="muted">Danger zone</span>
              <andes-popconfirm placement="right" title="Delete project atlas?" okType="danger" okText="Delete" (confirm)="status.set('Deleted.')">
                <andes-button size="sm" variant="danger" andesPopconfirmTrigger>Delete project</andes-button>
              </andes-popconfirm>
              <span role="status" [style]="muted">{{ status() }}</span>
            </div>
          </andes-popover-content>
        </andes-popover>
      </div>
    `,
  }),
};
