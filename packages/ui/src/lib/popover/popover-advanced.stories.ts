import type { Meta, StoryObj } from '@storybook/angular';

import { AndesButton } from '../button/button';
import { AndesInput } from '../input/input';
import { AndesPopover } from './popover';
import { AndesPopoverContent } from './popover-content';
import { AndesPopoverTrigger } from './popover-trigger';

const imports = [
  AndesButton,
  AndesInput,
  AndesPopoverTrigger,
  AndesPopoverContent,
];

const meta: Meta<AndesPopover> = {
  title: 'Data Display/Popover/Advanced/Behavior',
  component: AndesPopover,
};

export default meta;

type Story = StoryObj<AndesPopover>;

/**
 * Both ways to drive the popover from the outside. `[(open)]` binds its state to a field, so an
 * external button can toggle it as well as the trigger; `(openChange)` reports every change the
 * popover makes itself (Escape, an outside click, the trigger) and is logged below. The state
 * fields are named `panelVisible` and `changeLog` so Storybook does not forward them onto the
 * popover's own inputs.
 */
export const Controlled: Story = {
  render: () => {
    const changeLog: string[] = [];
    let count = 0;
    return {
      moduleMetadata: { imports },
      props: {
        panelVisible: false,
        changeLog,
        record: (open: boolean) => {
          changeLog.unshift(`#${++count} ${open ? 'opened' : 'closed'}`);
          changeLog.length = Math.min(changeLog.length, 5);
        },
      },
      template: `
        <div style="padding: 6rem 2rem; display: flex; flex-direction: column; align-items: center; gap: 1rem;">
          <andes-button (click)="panelVisible = !panelVisible">Toggle from outside</andes-button>
          <andes-popover [(open)]="panelVisible" (openChange)="record($event)">
            <andes-button variant="outline" andesPopoverTrigger>Or click me</andes-button>
            <andes-popover-content>Controlled via [(open)]. Close me with Escape, an outside click or the trigger.</andes-popover-content>
          </andes-popover>
          <ol aria-label="openChange log" style="margin: 0; font-family: var(--andes-font-family), sans-serif; font-size: 0.875rem; color: var(--andes-color-foreground);">
            @for (entry of changeLog; track entry) { <li>{{ entry }}</li> }
          </ol>
        </div>
      `,
    };
  },
};

/**
 * Near a viewport edge the panel flips to the opposite side and shifts along
 * the cross axis to stay on screen; the arrow follows. Scroll or resize to see
 * it re-evaluate.
 */
export const AutoAdjustOverflow: Story = {
  parameters: { layout: 'fullscreen' },
  render: () => ({
    moduleMetadata: { imports },
    template: `
      <div style="position: relative; height: 100vh; min-height: 20rem;">
        <div style="position: absolute; top: 0.5rem; left: 0.5rem;">
          <andes-popover side="top" [showArrow]="true" title="Wanted top" content="No room above - flipped to bottom, shifted right.">
            <andes-button size="sm" andesPopoverTrigger>Top-left corner</andes-button>
          </andes-popover>
        </div>
        <div style="position: absolute; bottom: 0.5rem; right: 0.5rem;">
          <andes-popover side="bottom" [showArrow]="true" title="Wanted bottom" content="No room below - flipped to top, shifted left.">
            <andes-button size="sm" andesPopoverTrigger>Bottom-right corner</andes-button>
          </andes-popover>
        </div>
        <div style="position: absolute; top: 50%; right: 0.5rem;">
          <andes-popover side="right" [showArrow]="true" content="No room on the right - flipped left.">
            <andes-button size="sm" andesPopoverTrigger>Right edge</andes-button>
          </andes-popover>
        </div>
        <div style="position: absolute; bottom: 0.5rem; left: 0.5rem;">
          <andes-popover side="bottom" [showArrow]="true" [autoAdjustOverflow]="false" content="autoAdjustOverflow off: stays below, even off screen.">
            <andes-button size="sm" variant="outline" andesPopoverTrigger>No auto-adjust</andes-button>
          </andes-popover>
        </div>
      </div>
    `,
  }),
};

/**
 * Template content keeps its state between opens by default (type, close,
 * reopen); `destroyOnHidden` re-creates it every time.
 */
export const DestroyOnHidden: Story = {
  render: () => ({
    moduleMetadata: { imports },
    template: `
      <div style="display: flex; gap: 2rem; padding: 8rem 2rem;">
        <andes-popover title="Kept" [content]="form">
          <andes-button variant="outline" andesPopoverTrigger>Keeps state</andes-button>
        </andes-popover>
        <andes-popover title="Destroyed" [content]="form" [destroyOnHidden]="true">
          <andes-button variant="outline" andesPopoverTrigger>destroyOnHidden</andes-button>
        </andes-popover>
        <ng-template #form>
          <label style="display: flex; flex-direction: column; gap: 0.25rem; font-size: 0.875rem;">
            Note
            <andes-input placeholder="Type, close, reopen" />
          </label>
        </ng-template>
      </div>
    `,
  }),
};

/**
 * Theming through `--andes-popover-*` custom properties, set here on
 * `<andes-popover-content>`; a `panelClass` or a global rule works too. A second popover shows
 * `zIndex`, which overrides the `--andes-z-index-popover` layer for one instance.
 */
export const Theming: Story = {
  render: () => ({
    moduleMetadata: { imports },
    template: `
      <div style="padding: 8rem; display: flex; gap: 1rem;">
        <andes-popover [showArrow]="true" title="Wide and roomy">
          <andes-button andesPopoverTrigger>Custom surface</andes-button>
          <andes-popover-content style="--andes-popover-padding: 1.5rem; --andes-popover-max-width: 32rem; --andes-popover-radius: var(--andes-radius-xl); --andes-popover-border-color: var(--andes-color-primary);">
            <p style="margin: 0; font-size: 0.875rem;">Padding, width, radius and border come from custom properties.</p>
          </andes-popover-content>
        </andes-popover>
        <andes-popover [showArrow]="true" [zIndex]="2000" content="Stacked at z-index 2000 for this instance only.">
          <andes-button variant="outline" andesPopoverTrigger>zIndex 2000</andes-button>
        </andes-popover>
      </div>
    `,
  }),
};

/**
 * `maxHeight` caps a panel holding long content: the title stays pinned, only the
 * region below it scrolls (its scrollbar on the panel's edge), and the arrow keeps
 * hanging off the surface instead of being clipped. The scrolling region is a tab
 * stop, so the text can be scrolled from the keyboard too. Under a title the body
 * text is set in the muted foreground, so the title leads.
 */
export const ScrollableBody: Story = {
  render: () => ({
    moduleMetadata: { imports },
    props: {
      paragraphs: Array.from(
        { length: 8 },
        (_, index) =>
          `Clause ${index + 1}. Changes to the billing cycle take effect at the start of the next period; anything already invoiced keeps its original terms.`,
      ),
    },
    template: `
      <div style="padding: 8rem; display: flex; gap: 1rem;">
        <andes-popover title="Terms of the change" [content]="body" [showArrow]="true" [maxHeight]="240">
          <andes-button andesPopoverTrigger>Long content (240px)</andes-button>
        </andes-popover>
        <andes-popover [showArrow]="true" side="right" maxHeight="12rem">
          <andes-button andesPopoverTrigger variant="outline">Projected, no title</andes-button>
          <andes-popover-content>
            @for (paragraph of paragraphs; track $index) {
              <p style="margin: 0 0 0.5rem;">{{ paragraph }}</p>
            }
          </andes-popover-content>
        </andes-popover>
        <ng-template #body>
          @for (paragraph of paragraphs; track $index) {
            <p style="margin: 0 0 0.5rem;">{{ paragraph }}</p>
          }
        </ng-template>
      </div>
    `,
  }),
};
