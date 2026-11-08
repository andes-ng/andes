import { signal } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';

import {
  about,
  paragraph,
  stage,
  withDescription,
  withPopoverKit,
  wideStage,
} from '../../testing/popover-story-kit';
import { AndesAvatar } from '../avatar/avatar';
import { AndesAvatarFallback } from '../avatar/avatar-fallback';
import { AndesButton } from '../button/button';
import { AndesInput } from '../input/input';
import { AndesSwitch } from '../switch/switch';
import { AndesTag } from '../tag/tag';
import { AndesPopover } from './popover';
import { AndesPopoverContent } from './popover-content';
import { AndesPopoverClose } from './popover-parts';
import { AndesPopoverTrigger } from './popover-trigger';

const LONG_TEXT = Array.from(
  { length: 8 },
  (_, index) =>
    `Paragraph ${index + 1}: the changelog lists every fix, from the smallest typo to the largest rewrite.`,
);

const meta: Meta<AndesPopover> = {
  title: 'Data Display/Popover/Content',
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
        AndesSwitch,
        AndesTag,
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

/** Title only. */
export const TitleOnly: Story = {
  name: 'Title only',
  parameters: about(
    'A title with no content makes a compact label-style panel with the same padding and no empty space under the heading.',
  ),
  render: () => ({
    template: `
      <div style="${stage}">
        <andes-popover title="Saved 2 minutes ago" trigger="hover">
          <andes-button variant="outline" andesPopoverTrigger>Status</andes-button>
        </andes-popover>
      </div>
    `,
  }),
};

/** Templates for both. */
export const TemplateTitleAndContent: Story = {
  name: 'Template title and content',
  parameters: about(
    'Both title and content take a template, so the heading can carry a status dot and the body any markup.',
  ),
  render: () => ({
    template: `
      <div style="${stage}">
        <andes-popover [title]="titleTemplate" [content]="bodyTemplate" [showArrow]="true">
          <andes-button variant="outline" andesPopoverTrigger>Deployment</andes-button>
        </andes-popover>
        <ng-template #titleTemplate>
          <span style="display: inline-flex; align-items: center; gap: 0.375rem;">
            <span aria-hidden="true" style="width: 0.5rem; height: 0.5rem; border-radius: 9999px; background: var(--andes-color-success);"></span>
            Deployment healthy
          </span>
        </ng-template>
        <ng-template #bodyTemplate>
          <p style="${paragraph}">Last deploy <strong>12 minutes ago</strong> from <code>main</code>.</p>
        </ng-template>
      </div>
    `,
  }),
};

/** A function for the content. */
export const FunctionContent: Story = {
  name: 'Function content',
  parameters: about(
    'A function returning text is read each time the panel opens, so the content can show the time of the moment it was opened.',
  ),
  render: () => ({
    props: {
      now: () => `Opened at ${new Date().toLocaleTimeString()}.`,
    },
    template: `
      <div style="${stage}">
        <andes-popover title="Right now" [content]="now" [showArrow]="true">
          <andes-button variant="outline" andesPopoverTrigger>What time is it?</andes-button>
        </andes-popover>
      </div>
    `,
  }),
};

/** Close from the content. */
export const CloseFromContent: Story = {
  name: 'Close from the content',
  parameters: about(
    'A template receives let-close, a function that dismisses the panel, and andesPopoverClose does the same from an element.',
  ),
  render: () => ({
    template: `
      <div style="${stage}">
        <andes-popover title="Column settings" [content]="body" [showArrow]="true">
          <andes-button variant="outline" andesPopoverTrigger>Columns</andes-button>
        </andes-popover>
        <ng-template #body let-close="close">
          <p style="margin: 0 0 0.75rem;">Pick the columns to show, then close.</p>
          <div style="display: flex; justify-content: flex-end; gap: 0.5rem;">
            <andes-button size="sm" variant="outline" (click)="close()">Reset</andes-button>
            <andes-button size="sm" andesPopoverClose>Done</andes-button>
          </div>
        </ng-template>
      </div>
    `,
  }),
};

/** A list of people. */
export const PeopleList: Story = {
  name: 'List of people',
  parameters: about(
    'Rows of library components, an avatar with a name and a tag, fit the panel without any extra styling.',
  ),
  render: () => ({
    props: {
      people: [
        { name: 'Ana Torres', initials: 'AT', role: 'Owner', color: 'success' },
        { name: 'Luis Rojas', initials: 'LR', role: 'Editor', color: 'info' },
        {
          name: 'Marta Díaz',
          initials: 'MD',
          role: 'Viewer',
          color: 'default',
        },
      ],
    },
    template: `
      <div style="${stage}">
        <andes-popover title="Shared with" [content]="body" placement="bottomLeft" [showArrow]="true">
          <andes-button variant="outline" andesPopoverTrigger>Shared with 3</andes-button>
        </andes-popover>
        <ng-template #body>
          <div style="display: flex; flex-direction: column; gap: 0.5rem; min-width: 15rem; margin-top: 0.5rem;">
            @for (person of people; track person.name) {
              <div style="display: flex; align-items: center; gap: 0.625rem; color: var(--andes-color-foreground);">
                <andes-avatar size="sm"><andes-avatar-fallback>{{ person.initials }}</andes-avatar-fallback></andes-avatar>
                <span style="flex: 1;">{{ person.name }}</span>
                <andes-tag [color]="person.color">{{ person.role }}</andes-tag>
              </div>
            }
          </div>
        </ng-template>
      </div>
    `,
  }),
};

/** A form. */
export const FormInPopover: Story = {
  name: 'A form',
  parameters: about(
    'A small form in the panel: focus lands on the first field when it opens, Tab walks the fields, and Save closes it and returns focus to the trigger.',
  ),
  render: () => ({
    props: { name: signal('Quarterly report') },
    template: `
      <div style="${stage}">
        <andes-popover placement="bottomLeft" [showArrow]="true">
          <andes-button variant="outline" andesPopoverTrigger>Rename</andes-button>
          <andes-popover-content style="width: 18rem;">
            <div style="display: flex; flex-direction: column; gap: 0.75rem;">
              <div style="display: flex; flex-direction: column; gap: 0.25rem;">
                <span style="font-size: 0.75rem; color: var(--andes-color-muted-foreground);">File name</span>
                <andes-input aria-label="File name" size="sm" [(value)]="name" />
              </div>
              <andes-switch size="sm">Keep a copy of the old name</andes-switch>
              <div style="display: flex; justify-content: flex-end; gap: 0.5rem;">
                <andes-button size="sm" variant="outline" andesPopoverClose>Cancel</andes-button>
                <andes-button size="sm" andesPopoverClose>Save</andes-button>
              </div>
            </div>
          </andes-popover-content>
        </andes-popover>
      </div>
    `,
  }),
};

/** Scrolling content. */
export const ScrollingContent: Story = {
  name: 'Scrolling content',
  parameters: about(
    'maxHeight caps the panel and scrolls the part under the title, so the heading stays in view and the arrow is never clipped.',
  ),
  render: () => ({
    props: { lines: LONG_TEXT },
    template: `
      <div style="${stage}">
        <andes-popover title="Changelog" [content]="body" [maxHeight]="160" [showArrow]="true">
          <andes-button variant="outline" andesPopoverTrigger>Changelog</andes-button>
        </andes-popover>
        <ng-template #body>
          @for (line of lines; track line) { <p style="margin: 0 0 0.5rem;">{{ line }}</p> }
        </ng-template>
      </div>
    `,
  }),
};

/** Width. */
export const Width: Story = {
  name: 'Width and maximum width',
  parameters: about(
    'width fixes the panel at a size, a number in pixels or any CSS length, while maxWidth only limits how far a long line may stretch before it wraps.',
  ),
  render: () => ({
    template: `
      <div style="${wideStage}">
        <andes-popover [width]="320" title="320px wide" content="A fixed width, however short the text.">
          <andes-button variant="outline" andesPopoverTrigger>width 320</andes-button>
        </andes-popover>
        <andes-popover [maxWidth]="200" title="Narrow" content="This sentence is long enough to need a few lines in a panel capped at 200 pixels.">
          <andes-button variant="outline" andesPopoverTrigger>maxWidth 200</andes-button>
        </andes-popover>
        <andes-popover width="20rem" title="In rem" content="Any CSS length works.">
          <andes-button variant="outline" andesPopoverTrigger>width 20rem</andes-button>
        </andes-popover>
      </div>
    `,
  }),
};

/** Long words. */
export const LongWords: Story = {
  name: 'Long words',
  parameters: about(
    'An unbroken string, such as a URL or a hash, wraps inside the panel instead of pushing it past the window.',
  ),
  render: () => ({
    template: `
      <div style="${stage}">
        <andes-popover title="Commit" content="6f1d3c2a9b8e7d5c4b3a2918f7e6d5c4b3a291807f6e5d4c3b2a1908f7e6d5c4b3a29180" placement="bottomLeft">
          <andes-button variant="outline" andesPopoverTrigger>Hash</andes-button>
        </andes-popover>
      </div>
    `,
  }),
};
