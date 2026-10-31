import type { Meta, StoryObj } from '@storybook/angular';

import { AndesFloatButton } from './float-button';

const chat = `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" aria-hidden="true"><path d="M2.5 3.5h11v7h-6l-3 2.5v-2.5h-2z"/></svg>`;
const help = `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="8" cy="8" r="6"/><path d="M6.2 6.3a1.9 1.9 0 1 1 2.6 1.8c-.5.3-.8.6-.8 1.2M8 11.4h.01"/></svg>`;
const doc = `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" aria-hidden="true"><path d="M4 2h5l3 3v9H4z"/><path d="M9 2v3h3"/></svg>`;
const mail = `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="3.5" width="12" height="9" rx="1.5"/><path d="m2.5 4.5 5.5 4.5 5.5-4.5"/></svg>`;

/** Fixed elements are positioned against this stage (a transformed box), not the whole viewport,
 *  so several examples can share a page. */
const styles = [
  `
  .stage { position: relative; transform: translateZ(0); width: 28rem; height: 18rem; overflow: hidden; border: 1px dashed var(--andes-color-border); border-radius: var(--andes-radius-md); background: var(--andes-color-background); color: var(--andes-color-muted-foreground); font-size: 0.875rem; line-height: 1.375rem; }
  .stage p { margin: 0; padding: 0.75rem 1rem; }
  .row { display: flex; flex-wrap: wrap; gap: 1.5rem; align-items: flex-start; }
  `,
];

const meta: Meta<AndesFloatButton> = {
  title: 'General/FloatButton/Basics/Button',
  component: AndesFloatButton,
  tags: ['autodocs'],
  argTypes: {
    type: { control: 'inline-radio', options: ['default', 'primary'] },
    shape: { control: 'inline-radio', options: ['circle', 'square'] },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    disabled: { control: 'boolean' },
    description: { control: 'text' },
    tooltip: { control: 'text' },
    href: { control: 'text' },
    target: { control: 'text' },
    badgeCount: { control: 'text' },
    badgeDot: { control: 'boolean' },
    right: { control: 'text' },
    bottom: { control: 'text' },
  },
  args: {
    type: 'default',
    shape: 'circle',
    size: 'md',
    disabled: false,
    tooltip: 'Chat with support',
    badgeDot: false,
  },
  render: (args) => ({
    props: args,
    styles,
    template: `
      <div class="stage"><p>Page content. The button is fixed to the bottom corner of the page (here, of this box).</p>
        <andes-float-button aria-label="Chat with support" [type]="type" [shape]="shape" [size]="size" [disabled]="disabled" [description]="description" [tooltip]="tooltip" [href]="href" [target]="target" [badgeCount]="badgeCount" [badgeDot]="badgeDot" [right]="right" [bottom]="bottom">${chat}</andes-float-button>
      </div>
    `,
  }),
};

export default meta;

type Story = StoryObj<AndesFloatButton>;
/** The playground: the fixed button is positioned against the dashed stage, not the whole viewport. */
export const Default: Story = {};

/** `type`, `shape` and `size` together, plus the disabled state. These render inline (`fixed` off) so they can sit in a row. */
export const Appearance: Story = {
  render: () => ({
    styles,
    template: `
      <div class="row">
        <andes-float-button [fixed]="false" size="sm" aria-label="Small">${chat}</andes-float-button>
        <andes-float-button [fixed]="false" size="md" aria-label="Medium">${chat}</andes-float-button>
        <andes-float-button [fixed]="false" size="lg" aria-label="Large">${chat}</andes-float-button>
        <andes-float-button [fixed]="false" size="sm" type="primary" shape="square" aria-label="Small">${chat}</andes-float-button>
        <andes-float-button [fixed]="false" size="md" type="primary" shape="square" aria-label="Medium">${chat}</andes-float-button>
        <andes-float-button [fixed]="false" size="lg" type="primary" shape="square" aria-label="Large">${chat}</andes-float-button>
        <andes-float-button [fixed]="false" type="primary" aria-label="Primary circle">${chat}</andes-float-button>
        <andes-float-button [fixed]="false" shape="square" aria-label="Default square">${chat}</andes-float-button>
        <andes-float-button [fixed]="false" disabled aria-label="Disabled">${chat}</andes-float-button>
      </div>
    `,
  }),
};

/** A caption under the icon turns the button into a rounded rectangle. */
export const WithDescription: Story = {
  render: () => ({
    styles,
    template: `
      <div class="row">
        <andes-float-button [fixed]="false" description="Help" aria-label="Help">${help}</andes-float-button>
        <andes-float-button [fixed]="false" description="Docs" type="primary" shape="square" aria-label="Documentation">${doc}</andes-float-button>
        <andes-float-button [fixed]="false" description="Feedback" size="lg" aria-label="Feedback">${mail}</andes-float-button>
      </div>
    `,
  }),
};

/** A count, a capped count, and a dot. */
export const Badges: Story = {
  render: () => ({
    styles,
    template: `
      <div class="row">
        <andes-float-button [fixed]="false" [badgeCount]="3" aria-label="Messages, 3 unread">${mail}</andes-float-button>
        <andes-float-button [fixed]="false" [badgeCount]="250" aria-label="Messages, many unread">${mail}</andes-float-button>
        <andes-float-button [fixed]="false" [badgeCount]="250" [badgeOverflowCount]="999" aria-label="Messages">${mail}</andes-float-button>
        <andes-float-button [fixed]="false" badgeDot type="primary" aria-label="Messages, new">${mail}</andes-float-button>
      </div>
    `,
  }),
};

/** With `href` the button is an anchor; `target="_blank"` adds a safe `rel`. */
export const AsLink: Story = {
  render: () => ({
    styles,
    template: `
      <div class="row">
        <andes-float-button [fixed]="false" href="https://example.com/docs" target="_blank" tooltip="Open the docs" aria-label="Open the docs">${doc}</andes-float-button>
        <andes-float-button [fixed]="false" href="https://example.com/docs" disabled aria-label="Docs (unavailable)">${doc}</andes-float-button>
      </div>
    `,
  }),
};

/** `right`, `bottom`, `left` and `top` are CSS lengths; safe-area insets are added automatically. */
export const CustomPosition: Story = {
  render: () => ({
    styles,
    template: `
      <div class="stage"><p>Anchored 2rem from the start edge and 1rem from the top.</p>
        <andes-float-button left="2rem" top="1rem" type="primary" aria-label="Chat">${chat}</andes-float-button>
      </div>
    `,
  }),
};
