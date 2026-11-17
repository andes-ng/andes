import { Component, type OnDestroy } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';

import {
  about,
  addStoryCss,
  bar,
  darkBox,
  OPEN_FOR_GOOD,
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

/** Colours, light and dark. */
export const ColoursLightAndDark: Story = {
  name: 'Colours, light and dark',
  parameters: about(
    'Every preset and a custom colour open at once on a light and on a dark surface, with the buttons restyled for the fill, to compare the text, the arrow and the shadow.',
  ),
  render: () => ({
    props: { colours: [...ANDES_POPOVER_PRESET_COLORS, '#7c3aed'] },
    template: `
      <div style="display: flex; flex-direction: column; gap: 1rem;">
        <div id="story-confirm-light" style="padding: 7rem 1rem 1rem; display: grid; grid-template-columns: repeat(4, 10rem); gap: 8.5rem 1rem; justify-content: center;">
          @for (colour of colours; track colour) {
            <andes-popconfirm container="#story-confirm-light" [color]="colour" [title]="colour" description="Light surface." [okButtonProps]="{ variant: 'secondary' }" [cancelButtonProps]="{ variant: 'ghost' }" ${OPEN_FOR_GOOD}>
              <andes-button size="sm" variant="outline" andesPopconfirmTrigger>{{ colour }}</andes-button>
            </andes-popconfirm>
          }
        </div>
        <div id="story-confirm-dark" data-andes-theme="dark" style="${darkBox} padding-top: 7rem; display: grid; grid-template-columns: repeat(4, 10rem); gap: 8.5rem 1rem; justify-content: center;">
          @for (colour of colours; track colour) {
            <andes-popconfirm container="#story-confirm-dark" [color]="colour" [title]="colour" description="Dark surface." [okButtonProps]="{ variant: 'secondary' }" [cancelButtonProps]="{ variant: 'ghost' }" ${OPEN_FOR_GOOD}>
              <andes-button size="sm" variant="outline" andesPopconfirmTrigger>{{ colour }}</andes-button>
            </andes-popconfirm>
          }
        </div>
      </div>
    `,
  }),
};

/** Changes the root font size for the demo and puts it back when the demo goes. */
@Component({
  selector: 'andes-popconfirm-root-size',
  imports: [AndesButton, AndesPopconfirm, AndesPopconfirmTrigger],
  template: `
    <div style="${stage}">
      <div style="${bar}">
        @for (size of sizes; track size) {
          <andes-button size="sm" variant="outline" (click)="setRoot(size)"
            >Root {{ size }}</andes-button
          >
        }
      </div>
      <andes-popconfirm
        title="Sized in rem"
        description="Change the root size to see the text and padding follow."
        [defaultOpen]="true"
        [closeOnOutsideClick]="false"
      >
        <andes-button variant="outline" andesPopconfirmTrigger
          >Open</andes-button
        >
      </andes-popconfirm>
    </div>
  `,
})
class RootSizeDemo implements OnDestroy {
  protected readonly sizes = ['16px', '18px', '20px'];

  protected setRoot(size: string): void {
    document.documentElement.style.fontSize = size === '16px' ? '' : size;
  }

  ngOnDestroy(): void {
    document.documentElement.style.fontSize = '';
  }
}

/** Root font size. */
export const RootFontSize: Story = {
  name: 'Larger root text',
  parameters: about(
    'Raising the root font size to 18px or 20px scales the question, the description, the padding and the gap, while the buttons and the arrow keep their designed shape.',
  ),
  render: () => ({
    moduleMetadata: { imports: [RootSizeDemo] },
    template: `<andes-popconfirm-root-size />`,
  }),
};
