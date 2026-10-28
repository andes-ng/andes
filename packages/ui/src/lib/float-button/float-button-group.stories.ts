import type { Meta, StoryObj } from '@storybook/angular';

import { AndesFloatButton } from './float-button';
import { AndesFloatButtonGroup } from './float-button-group';

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

const meta: Meta<AndesFloatButtonGroup> = {
  title: 'General/FloatButton/Features/Group',
  component: AndesFloatButtonGroup,
};

export default meta;

type Story = StoryObj<AndesFloatButtonGroup>;

export const Stack: Story = {
  render: () => ({
    moduleMetadata: { imports: [AndesFloatButton, AndesFloatButtonGroup] },
    styles,
    template: `
      <div class="row">
        <div class="stage" style="width: 12rem;"><p>Circles</p>
          <andes-float-button-group aria-label="Support" right="1rem" bottom="1rem">
            <andes-float-button aria-label="Chat">${chat}</andes-float-button>
            <andes-float-button aria-label="Help">${help}</andes-float-button>
            <andes-float-button aria-label="Docs">${doc}</andes-float-button>
          </andes-float-button-group>
        </div>
        <div class="stage" style="width: 12rem;"><p>Squares</p>
          <andes-float-button-group aria-label="Support" shape="square" right="1rem" bottom="1rem">
            <andes-float-button aria-label="Chat">${chat}</andes-float-button>
            <andes-float-button aria-label="Help">${help}</andes-float-button>
            <andes-float-button aria-label="Docs">${doc}</andes-float-button>
          </andes-float-button-group>
        </div>
      </div>
    `,
  }),
};

/** `trigger="click"` opens a menu on press (Escape or a press outside closes it, and `open` is two-way); `trigger="hover"` opens it on hover or keyboard focus and closes it after a short grace period. */
export const Triggers: Story = {
  render: () => ({
    moduleMetadata: { imports: [AndesFloatButton, AndesFloatButtonGroup] },
    styles,
    props: { isOpen: false },
    template: `
      <div class="row">
        <div class="stage"><p>{{ isOpen ? 'Menu open' : 'Menu closed' }}</p>
          <andes-float-button-group trigger="click" type="primary" aria-label="Support actions" [(open)]="isOpen">
            <andes-float-button aria-label="Chat" tooltip="Chat">${chat}</andes-float-button>
            <andes-float-button aria-label="Help" tooltip="Help">${help}</andes-float-button>
            <andes-float-button aria-label="Docs" tooltip="Docs">${doc}</andes-float-button>
          </andes-float-button-group>
        </div>
        <div class="stage"><p>Hover or Tab to the trigger.</p>
          <andes-float-button-group trigger="hover" shape="square" aria-label="Quick actions">
            <andes-float-button aria-label="Chat">${chat}</andes-float-button>
            <andes-float-button aria-label="Help">${help}</andes-float-button>
            <andes-float-button aria-label="Docs">${doc}</andes-float-button>
          </andes-float-button-group>
        </div>
      </div>
    `,
  }),
};

/** The menu can open up, down, towards the start edge or towards the end edge. */
export const Placements: Story = {
  render: () => ({
    moduleMetadata: { imports: [AndesFloatButton, AndesFloatButtonGroup] },
    styles,
    template: `
      <div class="row">
        <div class="stage" style="width: 13rem;"><p>up</p>
          <andes-float-button-group trigger="click" placement="up" [open]="true" right="1rem" bottom="1rem" aria-label="Actions (up)">
            <andes-float-button aria-label="Chat">${chat}</andes-float-button>
            <andes-float-button aria-label="Help">${help}</andes-float-button>
          </andes-float-button-group>
        </div>
        <div class="stage" style="width: 13rem;"><p>down</p>
          <andes-float-button-group trigger="click" placement="down" [open]="true" right="1rem" top="1rem" aria-label="Actions (down)">
            <andes-float-button aria-label="Chat">${chat}</andes-float-button>
            <andes-float-button aria-label="Help">${help}</andes-float-button>
          </andes-float-button-group>
        </div>
        <div class="stage" style="width: 13rem;"><p>start</p>
          <andes-float-button-group trigger="click" placement="start" [open]="true" right="1rem" bottom="1rem" aria-label="Actions (start)">
            <andes-float-button aria-label="Chat">${chat}</andes-float-button>
            <andes-float-button aria-label="Help">${help}</andes-float-button>
          </andes-float-button-group>
        </div>
        <div class="stage" style="width: 13rem;"><p>end</p>
          <andes-float-button-group trigger="click" placement="end" [open]="true" left="1rem" bottom="1rem" aria-label="Actions (end)">
            <andes-float-button aria-label="Chat">${chat}</andes-float-button>
            <andes-float-button aria-label="Help">${help}</andes-float-button>
          </andes-float-button-group>
        </div>
      </div>
    `,
  }),
};

/** `triggerIcon` and `closeIcon` replace the trigger glyphs, and a member can carry its own badge. */
export const CustomTriggerIcons: Story = {
  render: () => ({
    moduleMetadata: { imports: [AndesFloatButton, AndesFloatButtonGroup] },
    styles,
    template: `
      <ng-template #closed>${help}</ng-template>
      <ng-template #opened>${chat}</ng-template>
      <div class="stage"><p>Custom trigger icons.</p>
        <andes-float-button-group trigger="click" [triggerIcon]="closed" [closeIcon]="opened" aria-label="Support">
          <andes-float-button aria-label="Docs">${doc}</andes-float-button>
          <andes-float-button aria-label="Mail" [badgeDot]="true">${mail}</andes-float-button>
        </andes-float-button-group>
      </div>
    `,
  }),
};
