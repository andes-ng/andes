import { signal } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';

import {
  about,
  caption,
  list,
  row,
  stage,
  wideStage,
  withDescription,
  withPopoverKit,
} from '../../testing/popover-story-kit';
import { AndesAvatar } from '../avatar/avatar';
import { AndesAvatarFallback } from '../avatar/avatar-fallback';
import { AndesButton } from '../button/button';
import { AndesInput } from '../input/input';
import { AndesSelect } from '../select/select';
import { AndesSwitch } from '../switch/switch';
import { AndesTag } from '../tag/tag';
import { AndesPopover } from './popover';
import { AndesPopoverContent } from './popover-content';
import {
  AndesPopoverClose,
  AndesPopoverDescription,
  AndesPopoverHeader,
  AndesPopoverTitle,
} from './popover-parts';
import { AndesPopoverTrigger } from './popover-trigger';

const meta: Meta<AndesPopover> = {
  title: 'Data Display/Popover/Compositions',
  component: AndesPopover,
  decorators: [
    withDescription,
    withPopoverKit,
    moduleMetadata({
      imports: [
        AndesAvatar,
        AndesAvatarFallback,
        AndesButton,
        AndesInput,
        AndesSelect,
        AndesSwitch,
        AndesTag,
        NgIcon,
        AndesPopoverTrigger,
        AndesPopoverContent,
        AndesPopoverHeader,
        AndesPopoverTitle,
        AndesPopoverDescription,
        AndesPopoverClose,
      ],
    }),
  ],
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<AndesPopover>;

/** Profile card. */
export const ProfileCard: Story = {
  name: 'Profile card on hover',
  parameters: about(
    'Hovering a name opens a card with an avatar, a role tag and two buttons, and the pointer can move onto the card to press them.',
  ),
  render: () => ({
    template: `
      <div style="${stage}">
        <p style="margin: 0; font-size: 0.875rem;">Assigned to
          <andes-popover [trigger]="['hover', 'focus']" placement="bottomLeft" [content]="card" [showArrow]="true">
            <andes-button variant="link" size="sm" andesPopoverTrigger>&#64;ana.torres</andes-button>
          </andes-popover>
        </p>
        <ng-template #card>
          <div style="display: flex; gap: 0.75rem; width: 17rem; color: var(--andes-color-foreground);">
            <andes-avatar><andes-avatar-fallback>AT</andes-avatar-fallback></andes-avatar>
            <div style="display: flex; flex-direction: column; gap: 0.25rem; min-width: 0;">
              <strong>Ana Torres</strong>
              <span style="color: var(--andes-color-muted-foreground);">Design lead, Lima</span>
              <div><andes-tag color="success">Online</andes-tag></div>
              <div style="display: flex; gap: 0.5rem; margin-top: 0.5rem;">
                <andes-button size="sm">Message</andes-button>
                <andes-button size="sm" variant="outline">Profile</andes-button>
              </div>
            </div>
          </div>
        </ng-template>
      </div>
    `,
  }),
};

/** Row actions. */
export const RowActions: Story = {
  name: 'Row actions in a list',
  parameters: about(
    'One popover per row of a list, each holding that row actions, with the row name in its title.',
  ),
  render: () => ({
    props: {
      files: ['report-2024.pdf', 'budget.xlsx', 'notes.md'],
      list,
      row,
    },
    template: `
      <div style="${stage}">
        <div [style]="list" role="list">
          @for (file of files; track file) {
            <div [style]="row" role="listitem">
              <span style="font-size: 0.875rem;">{{ file }}</span>
              <andes-popover placement="bottomRight" [title]="file" [content]="actions" [showArrow]="true">
                <andes-button size="icon-sm" variant="ghost" andesPopoverTrigger [aria-label]="'Actions for ' + file">
                  <ng-icon name="lucideSettings" aria-hidden="true" />
                </andes-button>
              </andes-popover>
              <ng-template #actions let-close="close">
                <div style="display: flex; flex-direction: column; gap: 0.25rem; margin-top: 0.25rem; min-width: 9rem;">
                  <andes-button size="sm" variant="ghost" (click)="close()"><ng-icon name="lucidePencil" aria-hidden="true" /> Rename</andes-button>
                  <andes-button size="sm" variant="ghost" (click)="close()"><ng-icon name="lucideCopy" aria-hidden="true" /> Duplicate</andes-button>
                  <andes-button size="sm" variant="ghost" (click)="close()"><ng-icon name="lucideArchive" aria-hidden="true" /> Archive</andes-button>
                </div>
              </ng-template>
            </div>
          }
        </div>
      </div>
    `,
  }),
};

/** Notification settings. */
export const NotificationSettings: Story = {
  name: 'Notification settings',
  parameters: about(
    'A panel of switches opened from an icon button, with a title and description composed from the parts.',
  ),
  render: () => ({
    props: { email: signal(true), push: signal(false), digest: signal(true) },
    template: `
      <div style="${stage}">
        <andes-popover placement="bottomRight" [showArrow]="true">
          <andes-button variant="outline" andesPopoverTrigger><ng-icon name="lucideBell" aria-hidden="true" /> Notifications</andes-button>
          <andes-popover-content style="width: 18rem;">
            <div andesPopoverHeader>
              <h3 andesPopoverTitle>Notifications</h3>
              <p andesPopoverDescription>Choose how you hear from us.</p>
            </div>
            <div style="display: flex; flex-direction: column; gap: 0.625rem;">
              <andes-switch size="sm" [(checked)]="email">Email</andes-switch>
              <andes-switch size="sm" [(checked)]="push">Push</andes-switch>
              <andes-switch size="sm" [(checked)]="digest">Weekly digest</andes-switch>
            </div>
          </andes-popover-content>
        </andes-popover>
      </div>
    `,
  }),
};

/** Nested. */
export const NestedPopovers: Story = {
  name: 'Nested popovers',
  parameters: about(
    'A popover can open another from inside: a press in the inner panel does not close the outer one, and Escape closes the inner panel first.',
  ),
  render: () => ({
    template: `
      <div style="${stage}">
        <andes-popover title="Outer" [showArrow]="true" placement="bottomLeft">
          <andes-button variant="outline" andesPopoverTrigger>Outer</andes-button>
          <andes-popover-content style="width: 15rem;">
            <div andesPopoverHeader>
              <h3 andesPopoverTitle>Outer</h3>
              <p andesPopoverDescription>Open the inner one from here.</p>
            </div>
            <andes-popover placement="right" title="Inner" content="Escape closes me first." [showArrow]="true">
              <andes-button size="sm" variant="outline" andesPopoverTrigger>Inner</andes-button>
            </andes-popover>
          </andes-popover-content>
        </andes-popover>
      </div>
    `,
  }),
};

/** Select in a popover. */
export const FilterWithSelect: Story = {
  name: 'Filters with a select',
  parameters: about(
    'A select opened inside a popover keeps the popover open: choosing one of its options does not count as a press outside the panel.',
  ),
  render: () => ({
    props: {
      status: signal<unknown>('open'),
      owner: signal<unknown>(null),
      statuses: [
        { value: 'open', label: 'Open' },
        { value: 'closed', label: 'Closed' },
        { value: 'all', label: 'All' },
      ],
      owners: [
        { value: 'ana', label: 'Ana Torres' },
        { value: 'luis', label: 'Luis Rojas' },
      ],
      caption,
    },
    template: `
      <div style="${stage}">
        <andes-popover placement="bottomLeft" [showArrow]="true">
          <andes-button variant="outline" andesPopoverTrigger><ng-icon name="lucideFilter" aria-hidden="true" /> Filters</andes-button>
          <andes-popover-content style="width: 17rem;">
            <div style="display: flex; flex-direction: column; gap: 0.75rem;">
              <div style="display: flex; flex-direction: column; gap: 0.25rem;">
                <span [style]="caption">Status</span>
                <andes-select aria-label="Status" size="sm" [options]="statuses" [(value)]="status" />
              </div>
              <div style="display: flex; flex-direction: column; gap: 0.25rem;">
                <span [style]="caption">Owner</span>
                <andes-select aria-label="Owner" size="sm" placeholder="Anyone" [options]="owners" [(value)]="owner" />
              </div>
              <div style="display: flex; justify-content: flex-end;">
                <andes-button size="sm" andesPopoverClose>Apply</andes-button>
              </div>
            </div>
          </andes-popover-content>
        </andes-popover>
      </div>
    `,
  }),
};

/** Inline help. */
export const InlineHelp: Story = {
  name: 'Inline help beside a label',
  parameters: about(
    'A small help icon beside a field label opens an explanation on hover or focus, named for screen readers.',
  ),
  render: () => ({
    template: `
      <div style="${stage}">
        <div style="display: flex; flex-direction: column; gap: 0.375rem; width: 16rem;">
          <div style="display: flex; align-items: center; gap: 0.375rem; font-size: 0.875rem; font-weight: 500;">
            Display name
            <andes-popover [trigger]="['hover', 'focus']" placement="right" content="Shown on comments and in the member list. You can change it any time." [showArrow]="true">
              <andes-button size="icon-xs" variant="ghost" andesPopoverTrigger aria-label="About the display name">
                <ng-icon name="lucideCircleHelp" aria-hidden="true" />
              </andes-button>
            </andes-popover>
          </div>
          <andes-input aria-label="Display name" placeholder="Ana Torres" />
        </div>
      </div>
    `,
  }),
};

/** Share. */
export const SharePanel: Story = {
  name: 'Share link',
  parameters: about(
    'A link field with a copy button: pressing Copy shows a confirmation in the panel, and Done closes it.',
  ),
  render: () => ({
    props: { copied: signal(false) },
    template: `
      <div style="${stage}">
        <andes-popover placement="bottomRight" [showArrow]="true" (openChange)="copied.set(false)">
          <andes-button variant="outline" andesPopoverTrigger><ng-icon name="lucideShare2" aria-hidden="true" /> Share</andes-button>
          <andes-popover-content style="width: 20rem;">
            <div andesPopoverHeader>
              <h3 andesPopoverTitle>Share link</h3>
              <p andesPopoverDescription>Anyone with the link can view.</p>
            </div>
            <div style="display: flex; gap: 0.5rem;">
              <andes-input aria-label="Link" size="sm" value="https://example.com/s/9f2k" style="flex: 1;" />
              <andes-button size="sm" (click)="copied.set(true)">
                @if (copied()) { <ng-icon name="lucideCheck" aria-hidden="true" /> Copied } @else { <ng-icon name="lucideCopy" aria-hidden="true" /> Copy }
              </andes-button>
            </div>
          </andes-popover-content>
        </andes-popover>
      </div>
    `,
  }),
};

/** A hint. */
export const OnboardingHint: Story = {
  name: 'Onboarding hint',
  parameters: about(
    'A hint that opens by itself on the first render and stays until the person presses Got it, ignoring Escape and outside presses.',
  ),
  render: () => ({
    template: `
      <div style="${wideStage}">
        <andes-popover [defaultOpen]="true" [closeOnEscape]="false" [closeOnOutsideClick]="false" placement="bottom" [showArrow]="true" color="primary" title="New: saved views" [content]="hint">
          <andes-button variant="outline" andesPopoverTrigger><ng-icon name="lucideStar" aria-hidden="true" /> Views</andes-button>
        </andes-popover>
        <ng-template #hint>
          <p style="margin: 0 0 0.5rem;">Save a set of filters and come back to it later.</p>
          <andes-button size="sm" variant="secondary" andesPopoverClose>Got it</andes-button>
        </ng-template>
      </div>
    `,
  }),
};

/** Toolbar. */
export const Toolbar: Story = {
  name: 'Toolbar with several panels',
  parameters: about(
    'Three toolbar buttons each open their own panel; opening one closes the previous one, and Escape returns focus to the button that opened it.',
  ),
  render: () => ({
    template: `
      <div style="${stage}">
        <div role="toolbar" aria-label="Document" style="display: flex; gap: 0.5rem;">
          <andes-popover title="Link" content="Paste an address to link the selection." placement="bottomLeft">
            <andes-button size="icon-sm" variant="outline" andesPopoverTrigger aria-label="Link"><ng-icon name="lucideLink" aria-hidden="true" /></andes-button>
          </andes-popover>
          <andes-popover title="Location" content="Attach a place to this note." placement="bottomLeft">
            <andes-button size="icon-sm" variant="outline" andesPopoverTrigger aria-label="Location"><ng-icon name="lucideMapPin" aria-hidden="true" /></andes-button>
          </andes-popover>
          <andes-popover title="Lock" content="Only you can edit while it is locked." placement="bottomLeft">
            <andes-button size="icon-sm" variant="outline" andesPopoverTrigger aria-label="Lock"><ng-icon name="lucideLock" aria-hidden="true" /></andes-button>
          </andes-popover>
        </div>
      </div>
    `,
  }),
};
