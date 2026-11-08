import { NgIcon } from '@ng-icons/core';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';

import {
  about,
  addStoryCss,
  stage,
  withDescription,
  withPopoverKit,
  wideStage,
} from '../../testing/popover-story-kit';
import { AndesButton } from '../button/button';
import { AndesPopconfirmTrigger } from '../popover/popover-trigger';
import { ANDES_POPOVER_PRESET_COLORS } from '../popover/popover-types';
import { AndesPopconfirm } from './popconfirm';

const STORY_CSS = `
.story-confirm-motion-slow { --andes-popover-duration: 700ms; --andes-popover-exit-duration: 280ms; --andes-popover-distance: 16px; --andes-popover-scale: 0.9; }
.story-confirm-title { letter-spacing: 0.02em; }
.story-confirm-footer { justify-content: space-between; }
.story-confirm-pane { --andes-popover-radius: 1rem; --andes-popconfirm-icon-color: var(--andes-color-success-text); }
`;

const meta: Meta<AndesPopconfirm> = {
  title: 'Feedback/Popconfirm/Customisation',
  component: AndesPopconfirm,
  decorators: [
    withDescription,
    withPopoverKit,
    moduleMetadata({
      imports: [AndesButton, NgIcon, AndesPopconfirmTrigger],
    }),
  ],
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<AndesPopconfirm>;

/** Colours. */
export const Colours: Story = {
  name: 'Colours',
  parameters: about(
    'color paints the panel with a preset or any CSS colour, and the text, the arrow and the border follow it.',
  ),
  render: () => ({
    props: { colours: ['primary', 'danger', 'success', '#7c3aed'] },
    template: `
      <div style="${wideStage}">
        @for (colour of colours; track colour) {
          <andes-popconfirm [color]="colour" title="Continue?" description="A coloured panel." [okButtonProps]="{ variant: 'secondary' }" [cancelButtonProps]="{ variant: 'ghost' }">
            <andes-button variant="outline" size="sm" andesPopconfirmTrigger>{{ colour }}</andes-button>
          </andes-popconfirm>
        }
      </div>
    `,
  }),
};

/** Preset names. */
export const AllPresets: Story = {
  name: 'Every preset',
  parameters: about(
    'The six preset colours side by side, each keeping its text and buttons readable.',
  ),
  render: () => ({
    props: { colours: ANDES_POPOVER_PRESET_COLORS },
    template: `
      <div style="${wideStage}">
        @for (colour of colours; track colour) {
          <andes-popconfirm [color]="colour" [title]="colour" [okButtonProps]="{ variant: 'secondary' }" [cancelButtonProps]="{ variant: 'ghost' }">
            <andes-button variant="outline" size="sm" andesPopconfirmTrigger>{{ colour }}</andes-button>
          </andes-popconfirm>
        }
      </div>
    `,
  }),
};

/** Icon colour. */
export const IconColour: Story = {
  name: 'Icon colour',
  parameters: about(
    'The default mark takes its colour from --andes-popconfirm-icon-color, set in a panel class for a calmer or a stronger tone.',
  ),
  render: () => {
    addStoryCss('story-popconfirm-css', STORY_CSS);
    return {
      template: `
        <div style="${stage}">
          <andes-popconfirm panelClass="story-confirm-pane" title="Publish the page?" description="A green mark and a rounder panel.">
            <andes-button variant="outline" andesPopconfirmTrigger>Publish</andes-button>
          </andes-popconfirm>
        </div>
      `,
    };
  },
};

/** Classes by part. */
export const ClassNamesAndStyles: Story = {
  name: 'Classes and styles by part',
  parameters: about(
    'classNames and styles reach the surface, arrow, icon, title, description and the button row, as objects.',
  ),
  render: () => {
    addStoryCss('story-popconfirm-css', STORY_CSS);
    return {
      props: {
        classNames: {
          title: 'story-confirm-title',
          footer: 'story-confirm-footer',
        },
        styles: {
          root: { borderColor: 'var(--andes-color-primary)' },
          body: { fontStyle: 'italic' },
          icon: { transform: 'scale(1.25)' },
        },
      },
      template: `
        <div style="${stage}">
          <andes-popconfirm title="Delete the task?" description="Each part has its own class and style." [classNames]="classNames" [styles]="styles">
            <andes-button variant="outline" andesPopconfirmTrigger>By part</andes-button>
          </andes-popconfirm>
        </div>
      `,
    };
  },
};

/** Width. */
export const Width: Story = {
  name: 'Width',
  parameters: about(
    'width and maxWidth size the panel, for a long question that should wrap early or a short one that should not look cramped.',
  ),
  render: () => ({
    template: `
      <div style="${wideStage}">
        <andes-popconfirm [width]="360" title="Delete the task?" description="A fixed 360px width.">
          <andes-button variant="outline" andesPopconfirmTrigger>width 360</andes-button>
        </andes-popconfirm>
        <andes-popconfirm [maxWidth]="200" title="Delete every completed task in this board?">
          <andes-button variant="outline" andesPopconfirmTrigger>maxWidth 200</andes-button>
        </andes-popconfirm>
      </div>
    `,
  }),
};

/** Container. */
export const CustomContainer: Story = {
  name: 'Drawn inside a container',
  parameters: about(
    'container draws the panel inside the given element, so a dark scope on it themes the panel whatever the page theme is.',
  ),
  render: () => ({
    template: `
      <div id="story-confirm-container" data-andes-theme="dark" style="padding: 6rem 2rem; border-radius: var(--andes-radius-lg); background: #0f172a; color: #f8fafc; text-align: center;">
        <andes-popconfirm container="#story-confirm-container" title="Delete the task?" description="Drawn inside the dark box.">
          <andes-button variant="outline" andesPopconfirmTrigger>Open in the dark box</andes-button>
        </andes-popconfirm>
      </div>
    `,
  }),
};

/** zIndex. */
export const StackingOrder: Story = {
  name: 'Stacking order',
  parameters: about(
    'zIndex puts one panel above a fixed layer of the page that would otherwise cover it.',
  ),
  render: () => ({
    template: `
      <div style="${stage}">
        <div style="position: relative; z-index: 1200; padding: 0.75rem 1rem; border: 1px solid var(--andes-color-border); border-radius: var(--andes-radius-lg); background: var(--andes-color-card);">
          <andes-popconfirm [zIndex]="1300" placement="bottom" title="Delete the task?">
            <andes-button size="sm" variant="outline" andesPopconfirmTrigger>zIndex 1300</andes-button>
          </andes-popconfirm>
        </div>
      </div>
    `,
  }),
};

/** Motion. */
export const Motion: Story = {
  name: 'Motion',
  parameters: about(
    'The question fades in over 200ms with a 6px drift and a small scale from the arrow tip, and out over 140ms, and the same custom properties as the popover change its timing, drift and scale.',
  ),
  render: () => {
    addStoryCss('story-popconfirm-css', STORY_CSS);
    return {
      template: `
        <div style="${wideStage}">
          <andes-popconfirm trigger="hover" title="Default motion" [showCancel]="false" okText="OK">
            <andes-button variant="outline" andesPopconfirmTrigger>Default motion</andes-button>
          </andes-popconfirm>
          <andes-popconfirm trigger="hover" panelClass="story-confirm-motion-slow" title="Custom duration" [showCancel]="false" okText="OK">
            <andes-button variant="outline" andesPopconfirmTrigger>Custom duration</andes-button>
          </andes-popconfirm>
        </div>
      `,
    };
  },
};
