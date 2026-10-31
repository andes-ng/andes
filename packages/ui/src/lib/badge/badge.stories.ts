import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideBell,
  lucideClock,
  lucideMinus,
  lucidePlus,
} from '@ng-icons/lucide';
import type { Meta, StoryObj } from '@storybook/angular';

import { signal } from '@angular/core';

import { AndesButton } from '../button/button';
import { ANDES_PALETTE_COLORS } from '../palette/palette';
import { AndesBadge } from './badge';

const meta: Meta<AndesBadge> = {
  title: 'Data Display/Badge/Basics',
  component: AndesBadge,
  tags: ['autodocs'],
  argTypes: {
    count: { control: 'number' },
    max: { control: 'number' },
    dot: { control: 'boolean' },
    showZero: { control: 'boolean' },
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'danger', 'success', 'warning', 'info'],
    },
    size: { control: 'select', options: ['default', 'small'] },
    color: { control: 'text' },
    processing: { control: 'boolean' },
    status: {
      control: 'select',
      options: [
        undefined,
        'success',
        'processing',
        'default',
        'error',
        'warning',
      ],
    },
    text: { control: 'text' },
    overflowCount: { control: 'number' },
    title: { control: 'text' },
    standalone: { control: 'boolean' },
  },
  args: {
    count: 5,
    max: 99,
    dot: false,
    showZero: false,
    variant: 'danger',
    size: 'default',
    processing: false,
    standalone: false,
  },
  render: (args) => ({
    props: args,
    template: `
      <andes-badge [count]="count" [max]="max" [overflowCount]="overflowCount" [dot]="dot" [showZero]="showZero" [variant]="variant" [color]="color" [size]="size" [processing]="processing" [status]="status" [text]="text" [title]="title" [standalone]="standalone">
        <div style="width: 2.5rem; height: 2.5rem; border-radius: 0.5rem; background: var(--andes-color-muted);"></div>
      </andes-badge>
    `,
  }),
};

export default meta;

type Story = StoryObj<AndesBadge>;

const box = `<div style="width: 2.5rem; height: 2.5rem; border-radius: 0.5rem; background: var(--andes-color-muted);"></div>`;

/** One captioned demo cell, so a merged story can label each variant it shows. */
const cell = (caption: string, content: string) =>
  `<figure style="margin: 0; display: flex; flex-direction: column; align-items: center; gap: 0.75rem; font: 12px/20px var(--andes-font-family), sans-serif; color: var(--andes-color-foreground);">${content}<figcaption>${caption}</figcaption></figure>`;

/** The playground: every input is a control. */
export const Default: Story = {};

/**
 * How the count is shown. `max` (or its alias `overflowCount`, which wins when both are set)
 * caps the number with a `+`; a zero count hides the badge unless `showZero` is set; `title`
 * adds a native tooltip; a short string is shown as-is (a numeric string still counts as a
 * number); and `standalone` renders the bubble inline, e.g. next to a menu label.
 */
export const Counts: Story = {
  render: () => ({
    template: `
      <div style="display: flex; flex-direction: column; gap: 2rem;">
        <div style="display: flex; flex-wrap: wrap; gap: 2.5rem;">
          ${cell('count 5', `<andes-badge [count]="5">${box}</andes-badge>`)}
          ${cell('150, max 99', `<andes-badge [count]="150" [max]="99">${box}</andes-badge>`)}
          ${cell('15, overflowCount 9', `<andes-badge [count]="15" [overflowCount]="9">${box}</andes-badge>`)}
          ${cell('0, hidden', `<andes-badge [count]="0">${box}</andes-badge>`)}
          ${cell('0, showZero', `<andes-badge [count]="0" showZero>${box}</andes-badge>`)}
          ${cell('title tooltip', `<andes-badge [count]="12" title="12 unread notifications">${box}</andes-badge>`)}
        </div>
        <div style="display: flex; flex-wrap: wrap; gap: 2.5rem;">
          ${cell('"new" string', `<andes-badge count="new" color="green">${box}</andes-badge>`)}
          ${cell('"!" string', `<andes-badge count="!" variant="warning">${box}</andes-badge>`)}
          ${cell('"250" string', `<andes-badge count="250">${box}</andes-badge>`)}
        </div>
        <div style="display: flex; gap: 1rem; align-items: center;">
          <andes-badge standalone [count]="25" />
          <andes-badge standalone [count]="4" variant="secondary" />
          <andes-badge standalone [count]="109" color="indigo" />
          <andes-badge standalone [count]="0" showZero variant="success" />
        </div>
      </div>
    `,
  }),
};

/**
 * The dot form (no number) and the small size: a plain dot, a pulsing `processing` dot, a small
 * count and a small dot. The playground exposes `dot`, `processing` and `size` as controls.
 */
export const DotAndSize: Story = {
  render: () => ({
    template: `
      <div style="display: flex; flex-wrap: wrap; gap: 2.5rem;">
        ${cell('dot', `<andes-badge dot>${box}</andes-badge>`)}
        ${cell('dot, processing', `<andes-badge dot processing variant="info">${box}</andes-badge>`)}
        ${cell('small count', `<andes-badge [count]="5" size="small">${box}</andes-badge>`)}
        ${cell('small dot', `<andes-badge dot size="small">${box}</andes-badge>`)}
      </div>
    `,
  }),
};

/**
 * What the badge can wrap. A box with a custom `offset`, an icon button, and a link - which
 * stays fully clickable under the badge.
 */
export const Placement: Story = {
  render: () => ({
    moduleMetadata: {
      imports: [NgIcon],
      providers: [provideIcons({ lucideBell })],
    },
    template: `
      <div style="display: flex; flex-wrap: wrap; gap: 2.5rem; align-items: center;">
        ${cell('offset [-4, 4]', `<andes-badge [count]="5" [offset]="[-4, 4]">${box}</andes-badge>`)}
        ${cell(
          'icon button',
          `<andes-badge [count]="8" variant="danger">
            <button
              style="display: inline-flex; align-items: center; justify-content: center; width: 2.5rem; height: 2.5rem; border-radius: 9999px; border: 1px solid var(--andes-color-border); background: var(--andes-color-background); color: var(--andes-color-foreground); cursor: pointer;"
              aria-label="Notifications"
            >
              <ng-icon name="lucideBell" style="width: 1.125rem; height: 1.125rem;" />
            </button>
          </andes-badge>`,
        )}
        ${cell(
          'link',
          `<a href="#inbox" style="display: inline-block; border-radius: 0.5rem;" aria-label="Inbox, 5 unread">
            <andes-badge [count]="5">${box}</andes-badge>
          </a>`,
        )}
      </div>
    `,
  }),
};

/**
 * Every `variant`, then the shape progression: one character is a true circle, two or more
 * elongate into a pill, and the dot stays round.
 */
export const VariantsAndShapes: Story = {
  render: () => ({
    template: `
      <div style="display: flex; flex-direction: column; gap: 2rem;">
        <div style="display: flex; gap: 2rem;">
          ${(
            [
              'primary',
              'secondary',
              'danger',
              'success',
              'warning',
              'info',
            ] as const
          )
            .map(
              (variant) =>
                `<andes-badge [count]="3" variant="${variant}">${box}</andes-badge>`,
            )
            .join('')}
        </div>
        <div style="display: flex; gap: 2.5rem; align-items: center;">
          <andes-badge [count]="5">${box}</andes-badge>
          <andes-badge [count]="42">${box}</andes-badge>
          <andes-badge [count]="150" [max]="99">${box}</andes-badge>
          <andes-badge dot>${box}</andes-badge>
        </div>
      </div>
    `,
  }),
};

/**
 * `status` + `text`: an inline status indicator. Implies `standalone` + `dot`; `processing`
 * pulses. First column: the five statuses. Second: a standalone dot with a variant and a slotted
 * label. The last badge passes `text` as a TemplateRef for a rich label.
 */
export const Status: Story = {
  render: () => ({
    template: `
      <ng-template #label><strong>Deploying</strong> &middot; 3 of 5 pods</ng-template>
      <div style="display: flex; flex-wrap: wrap; gap: 3rem;">
        <div style="display: flex; flex-direction: column; gap: 0.75rem;">
          <andes-badge status="success" text="Success" />
          <andes-badge status="error" text="Error" />
          <andes-badge status="default" text="Default" />
          <andes-badge status="processing" text="Processing" />
          <andes-badge status="warning" text="Warning" />
          <andes-badge status="processing" [text]="label" />
        </div>
        <div style="display: flex; flex-direction: column; gap: 0.75rem;">
          <andes-badge standalone dot variant="success"><span slot="label">Online</span></andes-badge>
          <andes-badge standalone dot variant="warning"><span slot="label">Pending</span></andes-badge>
          <andes-badge standalone dot variant="danger"><span slot="label">Offline</span></andes-badge>
        </div>
      </div>
    `,
  }),
};

/**
 * `color`: preset names reuse the themed variants; any other CSS color is applied as-is with
 * black or white text, whichever contrasts more. The last two groups are the named palette
 * hues, themed for light and dark: standalone with no count a color renders a plain dot beside
 * its `text`; with a count the bubble takes the hue and picks black or white text from its
 * lightness.
 */
export const Colors: Story = {
  render: () => ({
    props: { palette: ANDES_PALETTE_COLORS },
    template: `
      <div style="display: flex; flex-direction: column; gap: 1.25rem;">
        <div style="display: flex; gap: 2rem; align-items: center;">
          <andes-badge [count]="7" color="primary"><div style="width: 2.5rem; height: 2.5rem; border-radius: 0.5rem; background: var(--andes-color-muted);"></div></andes-badge>
          <andes-badge [count]="7" color="#722ed1"><div style="width: 2.5rem; height: 2.5rem; border-radius: 0.5rem; background: var(--andes-color-muted);"></div></andes-badge>
          <andes-badge [count]="7" color="#fadb14"><div style="width: 2.5rem; height: 2.5rem; border-radius: 0.5rem; background: var(--andes-color-muted);"></div></andes-badge>
          <andes-badge [count]="42" color="hsl(180 70% 35%)"><div style="width: 2.5rem; height: 2.5rem; border-radius: 0.5rem; background: var(--andes-color-muted);"></div></andes-badge>
          <andes-badge [count]="120" color="lime"><div style="width: 2.5rem; height: 2.5rem; border-radius: 0.5rem; background: var(--andes-color-muted);"></div></andes-badge>
        </div>
        <div style="display: flex; flex-direction: column; gap: 0.5rem;">
          <andes-badge standalone dot color="#eb2f96" text="#eb2f96" />
          <andes-badge standalone dot color="rgb(250 140 22)" text="rgb(250 140 22)" />
          <andes-badge standalone dot color="rebeccapurple" text="rebeccapurple" />
        </div>
        <div style="display: grid; grid-template-columns: repeat(4, max-content); gap: 0.5rem 2rem;">
          @for (color of palette; track color) {
            <andes-badge standalone [color]="color" [text]="color" />
          }
        </div>
        <div style="display: flex; flex-wrap: wrap; gap: 1rem;">
          @for (color of palette; track color) {
            <andes-badge standalone [color]="color" [count]="12" />
          }
        </div>
      </div>
    `,
  }),
};

/** `count` as a TemplateRef - a custom indicator (here an icon) instead of the count bubble. */
export const CustomCountTemplate: Story = {
  render: () => ({
    moduleMetadata: {
      imports: [NgIcon],
      providers: [provideIcons({ lucideClock })],
    },
    template: `
      <ng-template #clock>
        <ng-icon name="lucideClock" style="width: 1rem; height: 1rem; color: var(--andes-color-danger-active); background: var(--andes-color-background); border-radius: 9999px;" />
      </ng-template>
      <andes-badge [count]="clock" title="Pending review">
        <div style="width: 2.5rem; height: 2.5rem; border-radius: 0.5rem; background: var(--andes-color-muted);"></div>
      </andes-badge>
    `,
  }),
};

/**
 * Live updates: a changed count rolls into place, and the badge zooms in when it appears and
 * out when it hides (count back to 0). Nothing animates on first render, and nothing at all
 * under `prefers-reduced-motion`. The dot follows the same count: it hides at 0.
 */
export const Dynamic: Story = {
  render: () => {
    const count = signal(5);
    const dot = signal(true);
    return {
      moduleMetadata: {
        imports: [AndesButton, NgIcon],
        providers: [provideIcons({ lucideMinus, lucidePlus })],
      },
      props: {
        count,
        dot,
        decrement: () => count.update((value) => Math.max(0, value - 1)),
        increment: () => count.update((value) => value + 1),
        random: () => count.set(Math.floor(Math.random() * 120)),
      },
      template: `
        <div style="display: flex; flex-direction: column; gap: 1.5rem; align-items: flex-start;">
          <div style="display: flex; gap: 2rem; align-items: center;">
            <andes-badge [count]="count()">${box}</andes-badge>
            <andes-badge [count]="count()" [dot]="dot()">${box}</andes-badge>
          </div>
          <div style="display: flex; gap: 0.5rem; align-items: center;">
            <andes-button variant="outline" size="icon-sm" aria-label="Decrease" (click)="decrement()"><ng-icon name="lucideMinus" /></andes-button>
            <andes-button variant="outline" size="icon-sm" aria-label="Increase" (click)="increment()"><ng-icon name="lucidePlus" /></andes-button>
            <andes-button variant="outline" size="sm" (click)="random()">Random</andes-button>
            <andes-button variant="ghost" size="sm" (click)="dot.set(!dot())">Toggle dot</andes-button>
          </div>
        </div>
      `,
    };
  },
};

const severityRow = (
  ['primary', 'danger', 'success', 'warning', 'info'] as const
)
  .map(
    (variant) =>
      `<andes-badge [count]="8" variant="${variant}"><div style="width: 2.5rem; height: 2.5rem; border-radius: 0.5rem; background: var(--andes-color-muted);"></div></andes-badge>`,
  )
  .join('');

const themePanel = (theme: 'light' | 'dark') =>
  `<div ${theme === 'dark' ? 'data-andes-theme="dark"' : ''} style="display: flex; flex-direction: column; gap: 1.25rem; padding: 1.5rem; border: 1px solid var(--andes-color-border); border-radius: var(--andes-radius-lg); background: var(--andes-color-background); color: var(--andes-color-foreground);">
    <div style="display: flex; gap: 1.5rem;">${severityRow}</div>
    <div style="display: flex; gap: 1.25rem; font-size: 0.875rem;">
      <andes-badge status="default" text="Default" />
      <andes-badge [dot]="true" variant="secondary" [standalone]="true" [count]="1" text="Secondary" />
      <andes-badge status="success" text="Success" />
      <andes-badge status="warning" text="Warning" />
    </div>
  </div>`;

/**
 * Severity counts keep one look across themes: a deep fill with light text (in the dark theme
 * the base colour is sunk into the page instead of switching to a bright pill). The neutral
 * dot - `status="default"` and a secondary dot - clears 3:1 on the page in both themes.
 */
export const SeverityCountsAcrossThemes: Story = {
  render: () => ({
    template: `<div style="display: flex; flex-wrap: wrap; gap: 1rem;">${themePanel('light')}${themePanel('dark')}</div>`,
  }),
};
