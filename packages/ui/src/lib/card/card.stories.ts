import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideEllipsis } from '@ng-icons/lucide';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';

import { AndesButton } from '../button/button';
import {
  AndesCard,
  AndesCardAction,
  AndesCardContent,
  AndesCardDescription,
  AndesCardFooter,
  AndesCardHeader,
  AndesCardTitle,
} from './card';

/**
 * A faintly tinted page surface, so a borderless card (which relies on its fill alone) stays
 * visible in both themes: the muted token equals the card surface in dark mode, so it can't be
 * used here.
 */
const TINTED_SURFACE_STYLE =
  'padding: 1.5rem; background: color-mix(in srgb, var(--andes-color-foreground) 4%,' +
  ' var(--andes-color-background));';

const meta: Meta<AndesCard> = {
  title: 'Data Display/Card/Basics',
  component: AndesCard,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [
        AndesCardHeader,
        AndesCardTitle,
        AndesCardDescription,
        AndesCardAction,
        AndesCardContent,
        AndesCardFooter,
        AndesButton,
        NgIcon,
      ],
      providers: [provideIcons({ lucideEllipsis })],
    }),
  ],
  argTypes: {
    variant: { control: 'select', options: ['outlined', 'borderless'] },
    size: { control: 'select', options: ['default', 'sm'] },
    type: { control: 'select', options: ['default', 'inner'] },
    hoverable: { control: 'boolean' },
    loading: { control: 'boolean' },
  },
  args: {
    variant: 'outlined',
    size: 'default',
    type: 'default',
    hoverable: false,
    loading: false,
  },
  render: (args) => ({
    props: args,
    template: `
      <andes-card [variant]="variant" [size]="size" [type]="type" [hoverable]="hoverable" [loading]="loading" style="max-width: 360px;">
        <andes-card-header>
          <andes-card-title>Team members</andes-card-title>
          <andes-card-description>Manage who has access to this project.</andes-card-description>
        </andes-card-header>
        <andes-card-content>
          <p style="margin: 0;">Invite teammates by email and assign them a role.</p>
        </andes-card-content>
        <andes-card-footer>
          <andes-button>Invite member</andes-button>
        </andes-card-footer>
      </andes-card>
    `,
  }),
};

export default meta;

type Story = StoryObj<AndesCard>;

export const Default: Story = {};

/**
 * The card's look switches side by side, on a tinted surface so the borderless card stays
 * visible: `outlined` (default), `borderless` (set apart by its fill alone), `size="sm"`,
 * `hoverable` (lifts on hover) and the last two combined. The playground above exposes the same
 * switches as controls.
 */
export const Variants: Story = {
  render: () => ({
    props: { surfaceStyle: TINTED_SURFACE_STYLE },
    template: `
      <div [style]="surfaceStyle">
        <div style="display: flex; flex-wrap: wrap; gap: 1.5rem;">
          <andes-card style="max-width: 300px;">
            <andes-card-header>
              <andes-card-title>Outlined (default)</andes-card-title>
              <andes-card-description>variant="outlined"</andes-card-description>
            </andes-card-header>
            <andes-card-content><p style="margin:0;">Body content.</p></andes-card-content>
            <andes-card-footer><andes-button size="sm">Action</andes-button></andes-card-footer>
          </andes-card>

          <andes-card variant="borderless" style="max-width: 300px;">
            <andes-card-header>
              <andes-card-title>Borderless</andes-card-title>
              <andes-card-description>variant="borderless"</andes-card-description>
            </andes-card-header>
            <andes-card-content><p style="margin:0;">Body content.</p></andes-card-content>
          </andes-card>

          <andes-card size="sm" style="max-width: 300px;">
            <andes-card-header>
              <andes-card-title>Small</andes-card-title>
              <andes-card-description>size="sm"</andes-card-description>
            </andes-card-header>
            <andes-card-content><p style="margin:0;">Tighter padding and gaps.</p></andes-card-content>
          </andes-card>

          <andes-card hoverable style="max-width: 300px;">
            <andes-card-header>
              <andes-card-title>Hoverable</andes-card-title>
              <andes-card-description>hoverable</andes-card-description>
            </andes-card-header>
            <andes-card-content><p style="margin:0;">Hover to see the elevation.</p></andes-card-content>
          </andes-card>

          <andes-card size="sm" hoverable style="max-width: 300px;">
            <andes-card-header>
              <andes-card-title>Small + hoverable</andes-card-title>
              <andes-card-description>size="sm" hoverable</andes-card-description>
              <andes-card-action>
                <andes-button variant="ghost" size="icon-sm" aria-label="More options"><ng-icon name="lucideEllipsis" /></andes-button>
              </andes-card-action>
            </andes-card-header>
            <andes-card-content><p style="margin:0;">Hover to see the elevation.</p></andes-card-content>
          </andes-card>
        </div>
      </div>
    `,
  }),
};

/**
 * Every part is optional and any combination is valid. First: a header with an `andes-card-action`
 * beside the title. Second: content only, with no header or footer.
 */
export const Parts: Story = {
  render: (args) => ({
    props: args,
    template: `
      <div style="display: flex; flex-wrap: wrap; gap: 1.5rem; align-items: flex-start;">
        <andes-card [variant]="variant" [size]="size" style="width: 360px; max-width: 100%;">
          <andes-card-header>
            <andes-card-title>Team members</andes-card-title>
            <andes-card-description>Manage who has access to this project.</andes-card-description>
            <andes-card-action>
              <andes-button variant="outline" size="sm">Edit</andes-button>
            </andes-card-action>
          </andes-card-header>
          <andes-card-content>
            <p style="margin: 0;">3 people have access.</p>
          </andes-card-content>
        </andes-card>
        <andes-card [variant]="variant" [size]="size" style="width: 320px; max-width: 100%;">
          <andes-card-content>
            <p style="margin: 0;">A card doesn't need a header or footer - any combination of parts is valid.</p>
          </andes-card-content>
        </andes-card>
      </div>
    `,
  }),
};

/**
 * `level` sets the heading element (`h2`-`h6`) for the page outline only - every level renders
 * at the same 16px medium title size.
 */
export const HeadingLevels: Story = {
  render: () => ({
    template: `
      <div style="display: flex; flex-direction: column; gap: 1rem; max-width: 360px;">
        <andes-card>
          <andes-card-header>
            <andes-card-title [level]="2">Section heading (h2)</andes-card-title>
            <andes-card-description>For a card that is a page's main section.</andes-card-description>
          </andes-card-header>
          <andes-card-content><p style="margin: 0;">Same size as every other level.</p></andes-card-content>
        </andes-card>
        <andes-card>
          <andes-card-header>
            <andes-card-title>Default heading (h3)</andes-card-title>
            <andes-card-description>The default level fits most nested-card usage.</andes-card-description>
          </andes-card-header>
          <andes-card-content><p style="margin: 0;">Same size as every other level.</p></andes-card-content>
        </andes-card>
        <andes-card>
          <andes-card-header>
            <andes-card-title [level]="5">Deeply nested heading (h5)</andes-card-title>
          </andes-card-header>
          <andes-card-content><p style="margin: 0;">Same size as every other level.</p></andes-card-content>
        </andes-card>
      </div>
    `,
  }),
};

/**
 * Cards laid out in a row of columns on a tinted surface. Grid items stretch to the row's height
 * and the body takes up the spare space, so the footers line up even with uneven content.
 */
export const InColumns: Story = {
  args: { variant: 'borderless' },
  render: (args) => ({
    props: { ...args, surfaceStyle: TINTED_SURFACE_STYLE },
    template: `
      <div [style]="surfaceStyle">
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; width: min(720px, calc(100vw - 6rem));">
          <andes-card [variant]="variant" [size]="size">
            <andes-card-header><andes-card-title>Orders</andes-card-title></andes-card-header>
            <andes-card-content><p style="margin: 0;">128 open orders.</p></andes-card-content>
            <andes-card-footer><andes-button variant="outline" size="sm">View all</andes-button></andes-card-footer>
          </andes-card>
          <andes-card [variant]="variant" [size]="size">
            <andes-card-header><andes-card-title>Invoices</andes-card-title></andes-card-header>
            <andes-card-content>
              <p style="margin: 0;">14 invoices are overdue and 6 more fall due this week. Review them before the month-end close.</p>
            </andes-card-content>
            <andes-card-footer><andes-button variant="outline" size="sm">View all</andes-button></andes-card-footer>
          </andes-card>
          <andes-card [variant]="variant" [size]="size">
            <andes-card-header><andes-card-title>Stock</andes-card-title></andes-card-header>
            <andes-card-content><p style="margin: 0;">3 items below reorder point.</p></andes-card-content>
            <andes-card-footer><andes-button variant="outline" size="sm">View all</andes-button></andes-card-footer>
          </andes-card>
        </div>
      </div>
    `,
  }),
};

export const InnerCard: Story = {
  render: (args) => ({
    props: args,
    template: `
      <andes-card [variant]="variant" [size]="size" style="width: min(480px, calc(100vw - 3rem));">
        <andes-card-header>
          <andes-card-title [level]="2">Project settings</andes-card-title>
        </andes-card-header>
        <andes-card-content style="display: flex; flex-direction: column; gap: 1rem;">
          <andes-card type="inner">
            <andes-card-header>
              <andes-card-title>General</andes-card-title>
              <andes-card-action><andes-button variant="link" size="sm">Edit</andes-button></andes-card-action>
            </andes-card-header>
            <andes-card-content><p style="margin: 0;">Name, description and visibility.</p></andes-card-content>
          </andes-card>
          <andes-card type="inner">
            <andes-card-header>
              <andes-card-title>Members</andes-card-title>
              <andes-card-action><andes-button variant="link" size="sm">Edit</andes-button></andes-card-action>
            </andes-card-header>
            <andes-card-content><p style="margin: 0;">3 people have access.</p></andes-card-content>
          </andes-card>
        </andes-card-content>
      </andes-card>
    `,
  }),
};
