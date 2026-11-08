import { signal } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular';

import {
  about,
  basicTabs,
  injectStyle,
  shared,
  tabsOf,
  withDescription,
  withTabsKit,
} from '../../testing/tabs-story-kit';
import { AndesTabs } from './tabs';
import type { AndesTabsSemanticInfo } from './tabs-semantic';

/*
 * Reaching the parts of the tabs: classes and inline styles per part (as objects or functions
 * of the props), the custom properties, the card surfaces, and how long the panels live.
 */

const meta: Meta<AndesTabs> = {
  title: 'Navigation/Tabs/Customisation',
  component: AndesTabs,
  decorators: [withDescription, withTabsKit],
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<AndesTabs>;

/** The classes the class-based stories hand out; the doubled selectors beat the component's own. */
const STORY_CSS = `
  button.story-trigger.story-trigger { letter-spacing: 0.02em; font-weight: 600; }
  button.story-trigger.story-trigger.andes-tabs__trigger--selected { color: var(--andes-color-success); }
  .story-indicator.story-indicator { background: var(--andes-color-success); }
  .story-panel.story-panel { padding: 0.75rem 1rem; border: 1px dashed var(--andes-color-border); border-radius: 0.5rem; }
  .story-compact.story-compact { font-size: 0.75rem; }
  .story-roomy.story-roomy { font-size: 1rem; }
`;

/** Classes per part. */
export const ClassNamesObject: Story = {
  name: 'Classes per part',
  parameters: about(
    'classNames hands a class to any part, here the tabs, the line and the panels, and the page decides what the classes look like.',
  ),
  render: () => {
    injectStyle('andes-story-tabs-classes', STORY_CSS);
    return {
      props: {
        ...shared,
        classNames: {
          trigger: 'story-trigger',
          indicator: 'story-indicator',
          content: 'story-panel',
        },
      },
      template: `<div [style]="column"><andes-tabs [classNames]="classNames">${basicTabs()}</andes-tabs></div>`,
    };
  },
};

/** Classes that follow the props. */
export const ClassNamesFunction: Story = {
  name: 'Classes from a function',
  parameters: about(
    'classNames can be a function of the tabs props, so the classes follow the type and the size the tabs are in right now.',
  ),
  render: () => {
    injectStyle('andes-story-tabs-classes', STORY_CSS);
    const size = signal<'sm' | 'lg'>('sm');
    return {
      props: {
        ...shared,
        size,
        classNames: ({ props }: AndesTabsSemanticInfo) => ({
          trigger: props.size === 'sm' ? 'story-compact' : 'story-roomy',
        }),
      },
      template: `
        <div [style]="column">
          <div [style]="row">
            <andes-button size="sm" variant="outline" (click)="size.set('sm')">Small</andes-button>
            <andes-button size="sm" variant="outline" (click)="size.set('lg')">Large</andes-button>
          </div>
          <andes-tabs [size]="size()" [classNames]="classNames">${basicTabs()}</andes-tabs>
        </div>`,
    };
  },
};

/** Inline styles per part. */
export const StylesObject: Story = {
  name: 'Styles per part',
  parameters: about(
    'styles gives any part inline styles, in camelCase or kebab-case, with a bare number meaning pixels, and needs no stylesheet at all.',
  ),
  render: () => ({
    props: {
      ...shared,
      styles: {
        root: {
          padding: 16,
          border: '1px solid var(--andes-color-border)',
          borderRadius: 12,
        },
        trigger: {
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          fontSize: 12,
        },
        content: { padding: '8px 0 0' },
      },
    },
    template: `<div [style]="column"><andes-tabs [styles]="styles">${basicTabs()}</andes-tabs></div>`,
  }),
};

/** Styles that follow the props. */
export const StylesFunction: Story = {
  name: 'Styles from a function',
  parameters: about(
    'styles can be a function of the tabs props too, here turning the bar into a column of tinted blocks only while the bar sits at the start.',
  ),
  render: () => ({
    props: {
      ...shared,
      styles: ({ props }: AndesTabsSemanticInfo) => ({
        list:
          props.orientation === 'vertical'
            ? {
                background: 'var(--andes-color-muted)',
                borderRadius: 8,
                padding: 4,
              }
            : {},
      }),
    },
    template: `
      <div [style]="column">
        <andes-tabs [styles]="styles">${basicTabs()}</andes-tabs>
        <andes-tabs tabPosition="left" [collapseBelow]="null" [styles]="styles">${basicTabs()}</andes-tabs>
      </div>`,
  }),
};

/** The custom properties. */
export const Tokens: Story = {
  name: 'Custom properties',
  parameters: about(
    'Four custom properties retune one tab set without any class: the line colour and thickness, and the pill track and raised tab backgrounds.',
  ),
  render: () => ({
    props: shared,
    template: `
      <div [style]="column">
        <div>
          <span [style]="caption">--andes-tabs-indicator-color and --andes-tabs-indicator-size</span>
          <andes-tabs style="--andes-tabs-indicator-color: var(--andes-color-danger); --andes-tabs-indicator-size: 3px;">${basicTabs()}</andes-tabs>
        </div>
        <div>
          <span [style]="caption">--andes-tabs-pill-track-background and --andes-tabs-pill-selected-background</span>
          <andes-tabs type="pill" style="--andes-tabs-pill-track-background: var(--andes-color-accent-hover); --andes-tabs-pill-selected-background: var(--andes-color-card);">${basicTabs()}</andes-tabs>
        </div>
      </div>`,
  }),
};

/** Card tabs on another surface. */
export const CardSurfaces: Story = {
  name: 'Card surfaces',
  parameters: about(
    'The two card custom properties match the tabs to the surface they sit on, so the active card opens into a card body instead of the page behind it.',
  ),
  render: () => ({
    props: shared,
    template: `
      <div [style]="column">
        @for (surface of ['Page', 'Card']; track surface; let onCard = $index) {
          <div [style]="onCard ? '--andes-tabs-card-selected-background: var(--andes-color-card); --andes-tabs-card-background: color-mix(in srgb, var(--andes-color-card-foreground) 5%, var(--andes-color-card)); padding: 1rem; border: 1px solid var(--andes-color-border); border-radius: var(--andes-radius-lg); background: var(--andes-color-card);' : ''">
            <span [style]="caption">{{ surface }} surface</span>
            <andes-tabs type="card" value="account">${basicTabs()}</andes-tabs>
          </div>
        }
      </div>`,
  }),
};

const LAZY = `
  <andes-tabs-list>
    <andes-tabs-trigger value="one">One</andes-tabs-trigger>
    <andes-tabs-trigger value="two">Two</andes-tabs-trigger>
    <andes-tabs-trigger value="three">Three</andes-tabs-trigger>
  </andes-tabs-list>
  <andes-tabs-content value="one"><ng-template andesTabsContentLazy><andes-story-counter /></ng-template></andes-tabs-content>
  <andes-tabs-content value="two"><ng-template andesTabsContentLazy><andes-story-counter /></ng-template></andes-tabs-content>
  <andes-tabs-content value="three" [forceRender]="forceThree"><ng-template andesTabsContentLazy><andes-story-counter /></ng-template></andes-tabs-content>`;

/** Panels that are built when first shown. */
export const KeepAlive: Story = {
  name: 'Panels kept alive',
  parameters: about(
    'A panel written as a lazy template is built the first time it is shown and then kept, so the counter in it survives a trip to another tab.',
  ),
  render: () => ({
    props: { ...shared, forceThree: false },
    template: `<div [style]="column"><andes-tabs>${LAZY}</andes-tabs></div>`,
  }),
};

/** Panels that are dropped when hidden. */
export const DestroyHidden: Story = {
  name: 'Panels destroyed when hidden',
  parameters: about(
    'destroyOnHidden throws a lazy panel away when its tab is left, so every visit starts again from a fresh component with its counter at zero.',
  ),
  render: () => ({
    props: { ...shared, forceThree: false },
    template: `<div [style]="column"><andes-tabs destroyOnHidden>${LAZY}</andes-tabs></div>`,
  }),
};

/** A panel built before it is needed. */
export const ForceRender: Story = {
  name: 'Panel built up front',
  parameters: about(
    'forceRender builds a lazy panel before its tab is first opened, so the third tab already shows the time the page loaded.',
  ),
  render: () => ({
    props: { ...shared, forceThree: true },
    template: `<div [style]="column"><andes-tabs>${LAZY}</andes-tabs></div>`,
  }),
};

/** The same tabs, wider spaced. */
export const BarClass: Story = {
  name: 'Bar class',
  parameters: about(
    'tabBarClass adds classes to the bar, for a page that wants to style the bar from its own stylesheet.',
  ),
  render: () => {
    injectStyle(
      'andes-story-tabs-bar',
      '.story-bar.story-bar { padding-inline: 0.5rem; background: var(--andes-color-muted); border-radius: 0.5rem; }',
    );
    return {
      props: shared,
      template: `<div [style]="column">${tabsOf('tabBarClass="story-bar" [tabBarGutter]="16"')}</div>`,
    };
  },
};
