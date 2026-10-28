import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideEllipsis, lucidePencil, lucideSettings } from '@ng-icons/lucide';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';

import { AndesButton } from '../button/button';
import {
  AndesCard,
  AndesCardAction,
  AndesCardActions,
  AndesCardContent,
  AndesCardDescription,
  AndesCardGrid,
  AndesCardHeader,
  AndesCardMeta,
  AndesCardTitle,
} from './card';

/** No Avatar component exists in this package yet - a plain initials badge stands in for one. */
const AVATAR_STYLE =
  'display: inline-flex; align-items: center; justify-content: center; width: 40px; height: 40px;' +
  ' border-radius: 9999px; background: var(--andes-color-primary);' +
  ' color: var(--andes-color-primary-foreground); font-size: 0.875rem; font-weight: 500;';

const ACTION_BUTTONS = `
  <andes-button variant="ghost" size="icon-sm" aria-label="Settings"><ng-icon name="lucideSettings" /></andes-button>
  <andes-button variant="ghost" size="icon-sm" aria-label="Edit"><ng-icon name="lucidePencil" /></andes-button>
  <andes-button variant="ghost" size="icon-sm" aria-label="More options"><ng-icon name="lucideEllipsis" /></andes-button>
`;

const meta: Meta<AndesCard> = {
  title: 'Data Display/Card/Content',
  component: AndesCard,
  decorators: [
    moduleMetadata({
      imports: [
        AndesCardHeader,
        AndesCardTitle,
        AndesCardDescription,
        AndesCardAction,
        AndesCardContent,
        AndesCardMeta,
        AndesCardGrid,
        AndesCardActions,
        AndesButton,
        NgIcon,
      ],
      providers: [
        provideIcons({ lucideEllipsis, lucidePencil, lucideSettings }),
      ],
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
};

export default meta;

type Story = StoryObj<AndesCard>;

/**
 * A cover is any element placed before the header, so it runs edge to edge (the card's own
 * overflow clipping does the work, no cover sub-component is needed). First: a cover above a
 * header and body. Second: a cover and an actions bar with no body in between - the parts still
 * close up cleanly.
 */
export const Cover: Story = {
  render: (args) => ({
    props: args,
    template: `
      <div style="display: flex; flex-wrap: wrap; gap: 1.5rem; align-items: flex-start;">
        <andes-card [variant]="variant" [size]="size" style="width: 320px; max-width: 100%;">
          <img
            src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=640&h=280&fit=crop"
            alt=""
            style="display: block; width: 100%; height: 160px; object-fit: cover;"
          />
          <andes-card-header>
            <andes-card-title>Mountain view</andes-card-title>
            <andes-card-description>Placed before the header so it runs edge to edge.</andes-card-description>
          </andes-card-header>
          <andes-card-content>
            <p style="margin: 0;">No dedicated cover sub-component is needed.</p>
          </andes-card-content>
        </andes-card>
        <andes-card [variant]="variant" [size]="size" style="width: 320px; max-width: 100%;">
          <img
            src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=640&h=280&fit=crop"
            alt="Mountain ridge above the clouds"
            style="display: block; width: 100%; height: 160px; object-fit: cover;"
          />
          <andes-card-actions>${ACTION_BUTTONS}</andes-card-actions>
        </andes-card>
      </div>
    `,
  }),
};

/**
 * `AndesCardMeta` pairs an optional `avatar` slot with a title and description. First: a cover,
 * a meta body with an avatar and a divided actions bar. Second: the same meta without an avatar.
 */
export const CardMeta: Story = {
  render: (args) => ({
    props: { ...args, avatarStyle: AVATAR_STYLE },
    template: `
      <div style="display: flex; flex-wrap: wrap; gap: 1.5rem; align-items: flex-start;">
        <andes-card [variant]="variant" [size]="size" [hoverable]="hoverable" [loading]="loading" style="width: 320px; max-width: 100%;">
          <img
            src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=640&h=280&fit=crop"
            alt=""
            style="display: block; width: 100%; height: 160px; object-fit: cover;"
          />
          <andes-card-content>
            <andes-card-meta>
              <span slot="avatar" [style]="avatarStyle">AB</span>
              <andes-card-title>Ada Byron</andes-card-title>
              <andes-card-description>Mapping the Andes, one ridge at a time.</andes-card-description>
            </andes-card-meta>
          </andes-card-content>
          <andes-card-actions>${ACTION_BUTTONS}</andes-card-actions>
        </andes-card>
        <andes-card [variant]="variant" [size]="size" style="width: 320px; max-width: 100%;">
          <andes-card-content>
            <andes-card-meta>
              <andes-card-title>Europe Street beat</andes-card-title>
              <andes-card-description>www.instagram.com</andes-card-description>
            </andes-card-meta>
          </andes-card-content>
        </andes-card>
      </div>
    `,
  }),
};

export const Actions: Story = {
  render: (args) => ({
    props: args,
    template: `
      <andes-card [variant]="variant" [size]="size" style="max-width: 360px;">
        <andes-card-header>
          <andes-card-title>Deployment</andes-card-title>
          <andes-card-description>Each child of the actions bar becomes one equal-width cell.</andes-card-description>
        </andes-card-header>
        <andes-card-content>
          <p style="margin: 0;">Last deployed 2 hours ago.</p>
        </andes-card-content>
        <andes-card-actions>
          <andes-button variant="ghost" size="sm">Logs</andes-button>
          <andes-button variant="ghost" size="sm">Redeploy</andes-button>
          <andes-button variant="ghost" size="sm">Settings</andes-button>
        </andes-card-actions>
      </andes-card>
    `,
  }),
};

/**
 * `andes-card-grid` cells tile the body. Cells lift on hover by default and one opts out with
 * `[hoverable]="false"` (first card); `--andes-card-grid-columns` changes the column count
 * (second card, four columns).
 */
export const Grid: Story = {
  render: (args) => ({
    props: args,
    template: `
      <div style="display: flex; flex-direction: column; gap: 1.5rem;">
        <andes-card [variant]="variant" [size]="size" style="width: min(560px, calc(100vw - 3rem));">
          <andes-card-header>
            <andes-card-title>Card grid</andes-card-title>
            <andes-card-description>Cells lift on hover by default; the second one opts out.</andes-card-description>
          </andes-card-header>
          <andes-card-content style="text-align: center;">
            <andes-card-grid>Content</andes-card-grid>
            <andes-card-grid [hoverable]="false">Not hoverable</andes-card-grid>
            <andes-card-grid>Content</andes-card-grid>
            <andes-card-grid>Content</andes-card-grid>
            <andes-card-grid>Content</andes-card-grid>
            <andes-card-grid>Content</andes-card-grid>
            <andes-card-grid>Content</andes-card-grid>
          </andes-card-content>
        </andes-card>
        <andes-card style="width: min(560px, calc(100vw - 3rem)); --andes-card-grid-columns: 4;">
          <andes-card-content style="text-align: center;">
            <andes-card-grid>1</andes-card-grid>
            <andes-card-grid>2</andes-card-grid>
            <andes-card-grid>3</andes-card-grid>
            <andes-card-grid>4</andes-card-grid>
            <andes-card-grid>5</andes-card-grid>
            <andes-card-grid>6</andes-card-grid>
            <andes-card-grid>7</andes-card-grid>
            <andes-card-grid>8</andes-card-grid>
          </andes-card-content>
        </andes-card>
      </div>
    `,
  }),
};

/** Toggle `loading` in the controls: the header and actions stay, only the body becomes a skeleton. */
export const Loading: Story = {
  args: { loading: true },
  render: (args) => ({
    props: { ...args, avatarStyle: AVATAR_STYLE },
    template: `
      <andes-card [variant]="variant" [size]="size" [loading]="loading" style="width: min(320px, calc(100vw - 3rem));">
        <andes-card-header>
          <andes-card-title>Card title</andes-card-title>
          <andes-card-action><andes-button variant="link" size="sm">More</andes-button></andes-card-action>
        </andes-card-header>
        <andes-card-content>
          <andes-card-meta>
            <span slot="avatar" [style]="avatarStyle">AB</span>
            <andes-card-title>Ada Byron</andes-card-title>
            <andes-card-description>This is the loaded body.</andes-card-description>
          </andes-card-meta>
        </andes-card-content>
        <andes-card-actions>${ACTION_BUTTONS}</andes-card-actions>
      </andes-card>
    `,
  }),
};
