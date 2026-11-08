import type { Meta, StoryObj } from '@storybook/angular';

import {
  about,
  basicTabs,
  shared,
  tabsOf,
  withDescription,
  withTabsKit,
} from '../../testing/tabs-story-kit';
import { AndesTabs } from './tabs';

/*
 * The line under (or beside) the active tab of the line type: its length and alignment, its
 * thickness and colour, other shapes made with the styles input, and how the line and the panel
 * move when the tab changes.
 */

const meta: Meta<AndesTabs> = {
  title: 'Navigation/Tabs/Indicator',
  component: AndesTabs,
  decorators: [withDescription, withTabsKit],
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<AndesTabs>;

/** The default line. */
export const Default: Story = {
  name: 'Default',
  parameters: about(
    'The line is as long as the active tab, 2px thick, and slides to the next tab with a short ease.',
  ),
  render: () => ({
    props: shared,
    template: `<div [style]="column">${tabsOf()}</div>`,
  }),
};

/** A line shorter than the tab. */
export const CustomSize: Story = {
  name: 'Custom size',
  parameters: about(
    'indicator.size is a length in px, or a function of the tab length, so the line can be a fixed 24px or half of whatever tab is active.',
  ),
  render: () => ({
    props: {
      ...shared,
      fixed: { size: 24 },
      half: { size: (length: number) => length / 2 },
    },
    template: `
      <div [style]="column">
        <div><span [style]="caption">size: 24</span><andes-tabs [indicator]="fixed">${basicTabs()}</andes-tabs></div>
        <div><span [style]="caption">size: half of the tab</span><andes-tabs [indicator]="half">${basicTabs()}</andes-tabs></div>
      </div>`,
  }),
};

/** Where a shorter line sits. */
export const Alignment: Story = {
  name: 'Alignment',
  parameters: about(
    'A shorter line sits at the start, the center or the end of the tab, so it can line up with the label or hug a corner.',
  ),
  render: () => ({
    props: {
      ...shared,
      aligns: [
        { name: 'start', value: { size: 20, align: 'start' } },
        { name: 'center', value: { size: 20, align: 'center' } },
        { name: 'end', value: { size: 20, align: 'end' } },
      ],
    },
    template: `
      <div [style]="column">
        @for (align of aligns; track align.name) {
          <div><span [style]="caption">align: {{ align.name }}</span><andes-tabs [indicator]="align.value">${basicTabs()}</andes-tabs></div>
        }
      </div>`,
  }),
};

/** The line on a vertical bar. */
export const Vertical: Story = {
  name: 'Vertical bar',
  parameters: about(
    'On a side bar the line runs along the tab height on the edge that faces the panel, and size and align apply to that height.',
  ),
  render: () => ({
    props: {
      ...shared,
      short: { size: 16, align: 'start' },
      centered: { size: 16, align: 'center' },
    },
    template: `
      <div [style]="column">
        <andes-tabs tabPosition="left" [collapseBelow]="null" [indicator]="short">${basicTabs()}</andes-tabs>
        <andes-tabs tabPosition="right" [collapseBelow]="null" [indicator]="centered">${basicTabs()}</andes-tabs>
      </div>`,
  }),
};

/** Thin to heavy. */
export const Thickness: Story = {
  name: 'Thickness',
  parameters: about(
    'indicator.thickness sets the line weight in px, from a hairline to a heavy 4px bar.',
  ),
  render: () => ({
    props: {
      ...shared,
      weights: [1, 2, 3, 4].map((thickness) => ({
        thickness,
        value: { thickness },
      })),
    },
    template: `
      <div [style]="column">
        @for (weight of weights; track weight.thickness) {
          <div><span [style]="caption">{{ weight.thickness }}px</span><andes-tabs [indicator]="weight.value">${basicTabs()}</andes-tabs></div>
        }
      </div>`,
  }),
};

/** The line in another colour. */
export const Colour: Story = {
  name: 'Colour',
  parameters: about(
    'The --andes-tabs-indicator-color property recolours the line for one tab set, here with the success and danger colours of the theme.',
  ),
  render: () => ({
    props: shared,
    template: `
      <div [style]="column">
        <andes-tabs style="--andes-tabs-indicator-color: var(--andes-color-success);">${basicTabs()}</andes-tabs>
        <andes-tabs style="--andes-tabs-indicator-color: var(--andes-color-danger);">${basicTabs()}</andes-tabs>
      </div>`,
  }),
};

/** A dot instead of a line. */
export const Dot: Story = {
  name: 'Dot',
  parameters: about(
    'A 6px round dot under the active tab, made with a 6px size and thickness and a fully rounded corner from the styles input.',
  ),
  render: () => ({
    props: {
      ...shared,
      indicator: { size: 6, thickness: 6 },
      styles: { indicator: { borderRadius: '50%', bottom: '1px' } },
    },
    template: `<div [style]="column"><andes-tabs [indicator]="indicator" [styles]="styles">${basicTabs()}</andes-tabs></div>`,
  }),
};

/** A soft highlight behind the tab. */
export const Highlight: Story = {
  name: 'Highlight',
  parameters: about(
    'A 28px tinted bar with rounded corners, kept to a low opacity so the label stays readable, marks the active tab like a highlighter.',
  ),
  render: () => ({
    props: {
      ...shared,
      indicator: { thickness: 28 },
      styles: {
        indicator: {
          bottom: '4px',
          borderRadius: 6,
          background:
            'color-mix(in srgb, var(--andes-color-primary) 12%, transparent)',
        },
      },
    },
    template: `<div [style]="column"><andes-tabs [indicator]="indicator" [styles]="styles" [tabBarGutter]="8">${basicTabs()}</andes-tabs></div>`,
  }),
};

/** The line without motion. */
export const InkMotion: Story = {
  name: 'Line motion',
  parameters: about(
    'animated.inkBar turns the slide of the line on or off, and reduced-motion users always get the jump.',
  ),
  render: () => ({
    props: {
      ...shared,
      slide: { inkBar: true },
      jump: { inkBar: false },
    },
    template: `
      <div [style]="column">
        <div><span [style]="caption">slides (default)</span><andes-tabs [animated]="slide">${basicTabs()}</andes-tabs></div>
        <div><span [style]="caption">jumps</span><andes-tabs [animated]="jump">${basicTabs()}</andes-tabs></div>
      </div>`,
  }),
};

/** How the panel enters. */
export const PaneMotion: Story = {
  name: 'Panel motion',
  parameters: about(
    'animated.tabPane is off by default, fades the new panel in, or slides it in from the side the new tab sits on, mirrored in a right-to-left page.',
  ),
  render: () => ({
    props: {
      ...shared,
      none: { tabPane: false },
      fade: { tabPane: 'fade' },
      slide: { tabPane: 'slide' },
    },
    template: `
      <div [style]="column">
        <div><span [style]="caption">none</span><andes-tabs [animated]="none">${basicTabs()}</andes-tabs></div>
        <div><span [style]="caption">fade</span><andes-tabs [animated]="fade">${basicTabs()}</andes-tabs></div>
        <div><span [style]="caption">slide</span><andes-tabs [animated]="slide">${basicTabs()}</andes-tabs></div>
      </div>`,
  }),
};
