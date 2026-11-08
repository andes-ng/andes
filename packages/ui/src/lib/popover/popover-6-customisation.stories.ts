import { NgIcon } from '@ng-icons/core';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';

import {
  about,
  addStoryCss,
  bar,
  stage,
  withDescription,
  withPopoverKit,
  wideStage,
} from '../../testing/popover-story-kit';
import { AndesButton } from '../button/button';
import { AndesPopover } from './popover';
import { AndesPopoverContent } from './popover-content';
import { AndesPopoverTrigger } from './popover-trigger';
import {
  ANDES_POPOVER_PRESET_COLORS,
  type AndesPopoverSemanticInfo,
} from './popover-types';

const STORY_CSS = `
.story-popover-note { border-style: dashed; border-width: 2px; }
.story-popover-note-title { letter-spacing: 0.04em; text-transform: uppercase; font-size: 0.75rem; }
.story-motion-slow { --andes-popover-duration: 700ms; --andes-popover-exit-duration: 280ms; --andes-popover-distance: 16px; --andes-popover-scale: 0.9; --andes-popover-ease: cubic-bezier(0.34, 1.4, 0.64, 1); }
.story-motion-none { --andes-popover-duration: 0ms; --andes-popover-exit-duration: 0ms; --andes-popover-distance: 0px; --andes-popover-scale: 1; }
.story-popover-wide { --andes-popover-padding: 1.25rem; --andes-popover-radius: 1rem; }
`;

const meta: Meta<AndesPopover> = {
  title: 'Data Display/Popover/Customisation',
  component: AndesPopover,
  decorators: [
    withDescription,
    withPopoverKit,
    moduleMetadata({
      imports: [AndesButton, NgIcon, AndesPopoverTrigger, AndesPopoverContent],
    }),
  ],
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<AndesPopover>;

/** Presets. */
export const PresetColours: Story = {
  name: 'Preset colours',
  parameters: about(
    'color takes one of the six semantic presets, and the text, the muted text, the border and the arrow follow it, all at a legible contrast.',
  ),
  render: () => ({
    props: { colours: ANDES_POPOVER_PRESET_COLORS },
    template: `
      <div style="${wideStage}">
        @for (colour of colours; track colour) {
          <andes-popover [color]="colour" [title]="colour" content="A preset background." [showArrow]="true">
            <andes-button variant="outline" andesPopoverTrigger>{{ colour }}</andes-button>
          </andes-popover>
        }
      </div>
    `,
  }),
};

/** Custom colours. */
export const CustomColours: Story = {
  name: 'Custom colours',
  parameters: about(
    'Any CSS colour paints the panel, and the text switches to black or white by the colour lightness.',
  ),
  render: () => ({
    props: {
      colours: ['#7c3aed', '#fde68a', 'rgb(15 118 110)', 'oklch(0.7 0.15 20)'],
    },
    template: `
      <div style="${wideStage}">
        @for (colour of colours; track colour) {
          <andes-popover [color]="colour" title="Custom" [content]="colour" [showArrow]="true">
            <andes-button variant="outline" andesPopoverTrigger>{{ colour }}</andes-button>
          </andes-popover>
        }
      </div>
    `,
  }),
};

/** CSS properties. */
export const CssProperties: Story = {
  name: 'CSS custom properties',
  parameters: about(
    'Padding, radius, shadow, minimum width and the colours are custom properties on the panel, so a style on the content element restyles one popover without any input.',
  ),
  render: () => ({
    template: `
      <div style="${wideStage}">
        <andes-popover>
          <andes-button variant="outline" andesPopoverTrigger>Roomy and round</andes-button>
          <andes-popover-content style="--andes-popover-padding: 1.25rem; --andes-popover-radius: 1rem;">
            Padding 20px and a 16px radius.
          </andes-popover-content>
        </andes-popover>
        <andes-popover>
          <andes-button variant="outline" andesPopoverTrigger>Flat</andes-button>
          <andes-popover-content style="--andes-popover-shadow: none; --andes-popover-radius: 0;">
            No shadow and square corners.
          </andes-popover-content>
        </andes-popover>
        <andes-popover [showArrow]="true">
          <andes-button variant="outline" andesPopoverTrigger>Tinted</andes-button>
          <andes-popover-content style="--andes-popover-background: var(--andes-color-muted); --andes-popover-border-color: var(--andes-color-primary);">
            A muted surface with a primary border.
          </andes-popover-content>
        </andes-popover>
      </div>
    `,
  }),
};

/** Edge to edge. */
export const FlushContent: Story = {
  name: 'Edge to edge',
  parameters: about(
    'Setting the padding to 0 lets a block fill the panel to its rounded edge, here a coloured banner above the text.',
  ),
  render: () => ({
    template: `
      <div style="${stage}">
        <andes-popover [showArrow]="true">
          <andes-button variant="outline" andesPopoverTrigger>Banner</andes-button>
          <andes-popover-content style="--andes-popover-padding: 0; overflow: hidden; width: 16rem;">
            <div style="height: 4rem; background: linear-gradient(135deg, var(--andes-color-primary), var(--andes-color-info));"></div>
            <p style="margin: 0; padding: 0.75rem 1rem;">The panel has no padding of its own here.</p>
          </andes-popover-content>
        </andes-popover>
      </div>
    `,
  }),
};

/** Classes and styles by part. */
export const ClassNamesAndStyles: Story = {
  name: 'Classes and styles by part',
  parameters: about(
    'classNames and styles reach the parts one by one: the surface (root), the arrow, the title and the body.',
  ),
  render: () => {
    addStoryCss('story-popover-css', STORY_CSS);
    return {
      props: {
        classNames: {
          root: 'story-popover-note',
          title: 'story-popover-note-title',
        },
        styles: {
          root: { borderColor: 'var(--andes-color-primary)' },
          arrow: { opacity: 0.9 },
          body: { fontStyle: 'italic' },
        },
      },
      template: `
        <div style="${stage}">
          <andes-popover title="Styled" content="Each part has its own class and style." [classNames]="classNames" [styles]="styles" [showArrow]="true">
            <andes-button variant="outline" andesPopoverTrigger>By part</andes-button>
          </andes-popover>
        </div>
      `,
    };
  },
};

/** Function forms. */
export const FunctionForms: Story = {
  name: 'Styles from the popover state',
  parameters: about(
    'Either input also takes a function of the popover props, so a style can depend on the placement or the colour, here a thicker border for panels above the trigger.',
  ),
  render: () => ({
    props: {
      styles: (info: AndesPopoverSemanticInfo) => ({
        root: {
          borderWidth: info.props.side === 'top' ? 3 : 1,
          borderColor: 'var(--andes-color-primary)',
        },
      }),
    },
    template: `
      <div style="${wideStage}">
        <andes-popover placement="top" [styles]="styles" content="Side top: a 3px border.">
          <andes-button variant="outline" andesPopoverTrigger>Top</andes-button>
        </andes-popover>
        <andes-popover placement="bottom" [styles]="styles" content="Side bottom: a 1px border.">
          <andes-button variant="outline" andesPopoverTrigger>Bottom</andes-button>
        </andes-popover>
      </div>
    `,
  }),
};

/** A class on the overlay pane. */
export const PanelClass: Story = {
  name: 'Panel class',
  parameters: about(
    'panelClass puts a class on the overlay pane, which scopes custom properties to one instance from a stylesheet.',
  ),
  render: () => {
    addStoryCss('story-popover-css', STORY_CSS);
    return {
      template: `
        <div style="${stage}">
          <andes-popover panelClass="story-popover-wide" title="Scoped" content="Padding and radius come from a class on the pane." [showArrow]="true">
            <andes-button variant="outline" andesPopoverTrigger>Panel class</andes-button>
          </andes-popover>
        </div>
      `,
    };
  },
};

/** Stacking. */
export const StackingOrder: Story = {
  name: 'Stacking order',
  parameters: about(
    'zIndex sets the stacking order of one panel, so a panel that must sit above a fixed bar can say so.',
  ),
  render: () => ({
    template: `
      <div style="${stage}">
        <div style="${bar} position: relative; z-index: 1200; padding: 0.75rem 1rem; border: 1px solid var(--andes-color-border); border-radius: var(--andes-radius-lg); background: var(--andes-color-card);">
          <span>A bar above the default layer</span>
          <andes-popover [zIndex]="1300" placement="bottom" content="Above the bar, because its z-index is higher." [showArrow]="true">
            <andes-button size="sm" variant="outline" andesPopoverTrigger>zIndex 1300</andes-button>
          </andes-popover>
        </div>
      </div>
    `,
  }),
};

/** Container. */
export const CustomContainer: Story = {
  name: 'Drawn inside a container',
  parameters: about(
    'container draws the panel inside the given element, so a dark scope on that element also themes the panel, whatever the page theme is.',
  ),
  render: () => ({
    template: `
      <div id="story-popover-container" data-andes-theme="dark" style="padding: 5rem 2rem; border-radius: var(--andes-radius-lg); background: #0f172a; color: #f8fafc; text-align: center;">
        <andes-popover container="#story-popover-container" title="Dark scope" content="Drawn inside the dark box." [showArrow]="true">
          <andes-button variant="outline" andesPopoverTrigger>Open in the dark box</andes-button>
        </andes-popover>
      </div>
    `,
  }),
};

/** Motion. */
export const Motion: Story = {
  name: 'Motion',
  parameters: about(
    'The panel fades in over 200ms with a 6px drift from the trigger and a small scale from the arrow tip, and out over 140ms; custom properties change the timing, the drift and the scale, and reduced motion keeps only a short fade.',
  ),
  render: () => {
    addStoryCss('story-popover-css', STORY_CSS);
    return {
      template: `
        <div style="${wideStage}">
          <andes-popover trigger="hover" title="Default" content="200ms in, 140ms out." [showArrow]="true">
            <andes-button variant="outline" andesPopoverTrigger>Default motion</andes-button>
          </andes-popover>
          <andes-popover trigger="hover" panelClass="story-motion-slow" title="Custom" content="700ms in with a 16px drift and a lively ease." [showArrow]="true">
            <andes-button variant="outline" andesPopoverTrigger>Custom duration</andes-button>
          </andes-popover>
          <andes-popover trigger="hover" panelClass="story-motion-none" title="No motion" content="What the panel does when the system asks for reduced motion, apart from a short fade." [showArrow]="true">
            <andes-button variant="outline" andesPopoverTrigger>No motion</andes-button>
          </andes-popover>
        </div>
      `,
    };
  },
};
