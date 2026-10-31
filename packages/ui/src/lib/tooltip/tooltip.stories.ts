import type { Meta, StoryObj } from '@storybook/angular';

import { AndesButton } from '../button/button';
import { AndesTooltip, ANDES_TOOLTIP_PRESET_COLORS } from './tooltip';
import { AndesTooltipContent } from './tooltip-content';
import { ANDES_TOOLTIP_PLACEMENTS } from './tooltip-placement';
import { AndesTooltipTrigger } from './tooltip-trigger';

const meta: Meta<AndesTooltip> = {
  title: 'Data Display/Tooltip/Basics/Tooltip',
  component: AndesTooltip,
  tags: ['autodocs'],
  argTypes: {
    content: { control: 'text' },
    placement: {
      control: 'select',
      options: [null, ...ANDES_TOOLTIP_PLACEMENTS],
    },
    side: { control: 'select', options: ['top', 'right', 'bottom', 'left'] },
    align: { control: 'select', options: ['start', 'center', 'end'] },
    sideOffset: { control: 'number' },
    alignOffset: { control: 'number' },
    arrow: { control: 'boolean' },
    autoAdjustOverflow: { control: 'boolean' },
    trigger: {
      control: 'check',
      options: ['hover', 'focus', 'click', 'contextMenu'],
    },
    color: { control: 'text' },
    variant: { control: 'inline-radio', options: ['default', 'inverse'] },
    maxWidth: { control: 'text' },
    zIndex: { control: 'number' },
    destroyOnHidden: { control: 'boolean' },
    fresh: { control: 'boolean' },
    disabled: { control: 'boolean' },
    openDelay: { control: 'number' },
    closeDelay: { control: 'number' },
    instantReopenWindow: { control: 'number' },
    disableHoverablePopup: { control: 'boolean' },
    closeOnClick: { control: 'boolean' },
  },
  args: {
    content: 'Helpful hint',
    placement: null,
    side: 'top',
    align: 'center',
    sideOffset: 6,
    alignOffset: 0,
    arrow: true,
    autoAdjustOverflow: true,
    trigger: ['hover', 'focus'],
    color: null,
    variant: 'default',
    maxWidth: null,
    zIndex: null,
    destroyOnHidden: false,
    fresh: false,
    disabled: false,
    openDelay: 600,
    closeDelay: 0,
    instantReopenWindow: 400,
    disableHoverablePopup: false,
    closeOnClick: true,
  },
  render: (args) => ({
    moduleMetadata: { imports: [AndesTooltipTrigger] },
    props: args,
    template: `
      <div style="padding: 6rem;">
        <andes-tooltip
          [content]="content"
          [placement]="placement"
          [side]="side"
          [align]="align"
          [sideOffset]="sideOffset"
          [alignOffset]="alignOffset"
          [arrow]="arrow"
          [autoAdjustOverflow]="autoAdjustOverflow"
          [trigger]="trigger"
          [color]="color"
          [variant]="variant"
          [maxWidth]="maxWidth"
          [zIndex]="zIndex"
          [destroyOnHidden]="destroyOnHidden"
          [fresh]="fresh"
          [disabled]="disabled"
          [openDelay]="openDelay"
          [closeDelay]="closeDelay"
          [instantReopenWindow]="instantReopenWindow"
          [disableHoverablePopup]="disableHoverablePopup"
          [closeOnClick]="closeOnClick"
        >
          <button type="button" andesTooltipTrigger>Hover or focus me</button>
        </andes-tooltip>
      </div>
    `,
  }),
};

export default meta;

type Story = StoryObj<AndesTooltip>;

export const Default: Story = {};

/**
 * The four `side` values in a row, then the 12 named `placement` values laid out around a grid of
 * triggers.
 */
export const Placements: Story = {
  render: () => ({
    moduleMetadata: { imports: [AndesTooltipTrigger] },
    template: `
      <div style="display: flex; gap: 4rem; padding: 5rem 8rem 0;">
        <andes-tooltip content="Top" side="top" [openDelay]="0">
          <button type="button" andesTooltipTrigger>side=top</button>
        </andes-tooltip>
        <andes-tooltip content="Right" side="right" [openDelay]="0">
          <button type="button" andesTooltipTrigger>side=right</button>
        </andes-tooltip>
        <andes-tooltip content="Bottom" side="bottom" [openDelay]="0">
          <button type="button" andesTooltipTrigger>side=bottom</button>
        </andes-tooltip>
        <andes-tooltip content="Left" side="left" [openDelay]="0">
          <button type="button" andesTooltipTrigger>side=left</button>
        </andes-tooltip>
      </div>
      <div
        style="display: grid; grid-template-columns: repeat(5, 5.5rem); grid-template-rows: repeat(5, 2.5rem); gap: 0.5rem; padding: 5rem 8rem; place-items: stretch;"
      >
        <andes-tooltip style="grid-area: 1 / 2" content="topLeft" placement="topLeft" [openDelay]="0">
          <button type="button" style="width: 100%; height: 100%" andesTooltipTrigger>TL</button>
        </andes-tooltip>
        <andes-tooltip style="grid-area: 1 / 3" content="top" placement="top" [openDelay]="0">
          <button type="button" style="width: 100%; height: 100%" andesTooltipTrigger>Top</button>
        </andes-tooltip>
        <andes-tooltip style="grid-area: 1 / 4" content="topRight" placement="topRight" [openDelay]="0">
          <button type="button" style="width: 100%; height: 100%" andesTooltipTrigger>TR</button>
        </andes-tooltip>
        <andes-tooltip style="grid-area: 2 / 1" content="leftTop" placement="leftTop" [openDelay]="0">
          <button type="button" style="width: 100%; height: 100%" andesTooltipTrigger>LT</button>
        </andes-tooltip>
        <andes-tooltip style="grid-area: 3 / 1" content="left" placement="left" [openDelay]="0">
          <button type="button" style="width: 100%; height: 100%" andesTooltipTrigger>Left</button>
        </andes-tooltip>
        <andes-tooltip style="grid-area: 4 / 1" content="leftBottom" placement="leftBottom" [openDelay]="0">
          <button type="button" style="width: 100%; height: 100%" andesTooltipTrigger>LB</button>
        </andes-tooltip>
        <andes-tooltip style="grid-area: 2 / 5" content="rightTop" placement="rightTop" [openDelay]="0">
          <button type="button" style="width: 100%; height: 100%" andesTooltipTrigger>RT</button>
        </andes-tooltip>
        <andes-tooltip style="grid-area: 3 / 5" content="right" placement="right" [openDelay]="0">
          <button type="button" style="width: 100%; height: 100%" andesTooltipTrigger>Right</button>
        </andes-tooltip>
        <andes-tooltip style="grid-area: 4 / 5" content="rightBottom" placement="rightBottom" [openDelay]="0">
          <button type="button" style="width: 100%; height: 100%" andesTooltipTrigger>RB</button>
        </andes-tooltip>
        <andes-tooltip style="grid-area: 5 / 2" content="bottomLeft" placement="bottomLeft" [openDelay]="0">
          <button type="button" style="width: 100%; height: 100%" andesTooltipTrigger>BL</button>
        </andes-tooltip>
        <andes-tooltip style="grid-area: 5 / 3" content="bottom" placement="bottom" [openDelay]="0">
          <button type="button" style="width: 100%; height: 100%" andesTooltipTrigger>Bottom</button>
        </andes-tooltip>
        <andes-tooltip style="grid-area: 5 / 4" content="bottomRight" placement="bottomRight" [openDelay]="0">
          <button type="button" style="width: 100%; height: 100%" andesTooltipTrigger>BR</button>
        </andes-tooltip>
      </div>
    `,
  }),
};

/**
 * `arrow`: on by default; `false` hides it; `{ pointAtCenter: true }` shifts an
 * edge-aligned tooltip so the arrow lands on the trigger's center.
 */
export const Arrow: Story = {
  render: () => ({
    moduleMetadata: { imports: [AndesTooltipTrigger] },
    props: { pointAtCenter: { pointAtCenter: true } },
    template: `
      <div style="display: flex; gap: 2rem; padding: 5rem 2rem;">
        <andes-tooltip content="Default arrow" placement="topLeft" [open]="true">
          <button type="button" style="width: 11rem" andesTooltipTrigger>topLeft</button>
        </andes-tooltip>
        <andes-tooltip content="Points at the center" placement="topLeft" [arrow]="pointAtCenter" [open]="true">
          <button type="button" style="width: 11rem" andesTooltipTrigger>topLeft + pointAtCenter</button>
        </andes-tooltip>
        <andes-tooltip content="No arrow" placement="top" [arrow]="false" [open]="true">
          <button type="button" style="width: 11rem" andesTooltipTrigger>arrow=false</button>
        </andes-tooltip>
      </div>
    `,
  }),
};

/** `trigger`: hover, focus, click, contextMenu - alone or combined. */
export const Triggers: Story = {
  render: () => ({
    moduleMetadata: { imports: [AndesTooltipTrigger] },
    props: { hoverClick: ['hover', 'click'] },
    template: `
      <div style="display: flex; flex-wrap: wrap; gap: 1rem; padding: 6rem 2rem;">
        <andes-tooltip content="Opened by hover" trigger="hover" [openDelay]="0">
          <button type="button" andesTooltipTrigger>Hover</button>
        </andes-tooltip>
        <andes-tooltip content="Opened by focus" trigger="focus" [openDelay]="0">
          <button type="button" andesTooltipTrigger>Focus (Tab here)</button>
        </andes-tooltip>
        <andes-tooltip content="Opened by click - click again or outside" trigger="click">
          <button type="button" andesTooltipTrigger>Click</button>
        </andes-tooltip>
        <andes-tooltip content="Opened by right-click" trigger="contextMenu">
          <button type="button" andesTooltipTrigger>Right-click</button>
        </andes-tooltip>
        <andes-tooltip content="Hover or click" [trigger]="hoverClick" [openDelay]="0">
          <button type="button" andesTooltipTrigger>Hover + click</button>
        </andes-tooltip>
      </div>
      <p style="max-width: 32rem; padding-inline: 2rem; color: var(--andes-color-muted-foreground); font-family: var(--andes-font-family), sans-serif;">
        On a touch screen, a long-press stands in for hover.
      </p>
    `,
  }),
};

/**
 * `color`: semantic presets or any CSS color; text color and arrow follow. The last row is
 * `variant="inverse"`: a dark surface with light text in either theme (switch the toolbar theme
 * to compare); on a dark page the fill lifts a few steps so the hint still reads as a layer above
 * the page.
 */
export const Colors: Story = {
  render: () => ({
    moduleMetadata: { imports: [AndesTooltipTrigger, AndesButton] },
    props: {
      presets: ANDES_TOOLTIP_PRESET_COLORS,
      customs: ['#7c3aed', 'hsl(45 100% 70%)', 'teal'],
    },
    template: `
      <div style="display: flex; flex-wrap: wrap; gap: 2.5rem 1rem; padding: 4rem 2rem; max-width: 60rem;">
        @for (preset of presets; track preset) {
          <andes-tooltip [content]="preset" [color]="preset" [open]="true">
            <button type="button" andesTooltipTrigger>{{ preset }}</button>
          </andes-tooltip>
        }
        @for (custom of customs; track custom) {
          <andes-tooltip [content]="custom" [color]="custom" [open]="true">
            <button type="button" andesTooltipTrigger>{{ custom }}</button>
          </andes-tooltip>
        }
        <andes-tooltip content="Inverse: dark surface, light text" variant="inverse" [open]="true">
          <andes-button andesTooltipTrigger variant="outline">Inverse</andes-button>
        </andes-tooltip>
        <andes-tooltip content="Without an arrow" variant="inverse" [arrow]="false" side="bottom" [open]="true">
          <andes-button andesTooltipTrigger variant="outline">Inverse, no arrow</andes-button>
        </andes-tooltip>
      </div>
    `,
  }),
};

/**
 * What goes in the tooltip. `content` takes a string, or a `TemplateRef` for rich markup; the
 * `andesTooltipContent` template projected inside the tooltip works the same way. A tooltip also
 * works on an `<andes-button>`: it anchors to, and describes, the real `<button>` inside it.
 */
export const Content: Story = {
  render: () => ({
    moduleMetadata: {
      imports: [AndesTooltipTrigger, AndesTooltipContent, AndesButton],
    },
    template: `
      <div style="display: flex; gap: 8rem; padding: 6rem;">
        <andes-tooltip [content]="hint" [open]="true">
          <button type="button" andesTooltipTrigger>Shortcut</button>
        </andes-tooltip>
        <ng-template #hint>Press <kbd>Ctrl</kbd> + <kbd>K</kbd></ng-template>
        <andes-tooltip>
          <button type="button" andesTooltipTrigger>Sync status</button>
          <ng-template andesTooltipContent>
            Last synced <strong>2 minutes ago</strong>
          </ng-template>
        </andes-tooltip>
        <andes-tooltip content="Saves a draft" [openDelay]="0">
          <andes-button andesTooltipTrigger variant="outline">Save</andes-button>
        </andes-tooltip>
      </div>
    `,
  }),
};

/**
 * Disabled tooltips and disabled triggers. `disabled` on the tooltip never shows it. A disabled
 * trigger still shows its tooltip to the pointer: the `<andes-tooltip>` host becomes an
 * inline-block wrapper that catches the hover the disabled control cannot. That does not cover
 * keyboard users, because a disabled control cannot take focus, so there are two patterns:
 *
 * - **Wrapper pattern**: make a focusable wrapper the trigger - `<span tabindex="0"
 *   andesTooltipTrigger>` around the disabled control. Focus lands on the wrapper, the tooltip
 *   opens and the wrapper is described by it.
 * - **Keep it focusable**: where the control may stay in the tab order, mark it
 *   `aria-disabled="true"` instead of `disabled` and ignore its activation; it then works as a
 *   normal trigger and announces itself as unavailable.
 *
 * Tab through the keyboard row to try both.
 */
export const Disabled: Story = {
  render: () => ({
    moduleMetadata: { imports: [AndesTooltipTrigger, AndesButton] },
    template: `
      <style>
        .sb-tooltip-wrapper { display: inline-block; border-radius: var(--andes-radius-md); }
        .sb-tooltip-wrapper:focus-visible { outline: 2px solid var(--andes-color-focus-ring); outline-offset: 2px; }
        .sb-aria-disabled {
          box-sizing: border-box; height: 2rem; padding: 0 0.9375rem;
          border: 1px solid var(--andes-color-input); border-radius: var(--andes-radius-md);
          background: var(--andes-color-muted); color: var(--andes-color-muted-foreground);
          font: inherit; font-size: 0.875rem; line-height: 1.375rem; cursor: not-allowed;
        }
        .sb-aria-disabled:focus-visible { outline: 2px solid var(--andes-color-focus-ring); outline-offset: 2px; }
      </style>
      <div style="display: flex; gap: 1.5rem; padding: 6rem 2rem 0;">
        <andes-tooltip content="Never shown" [disabled]="true" [openDelay]="0">
          <button type="button" andesTooltipTrigger>Tooltip disabled</button>
        </andes-tooltip>
        <andes-tooltip content="You need edit rights to save" [openDelay]="0">
          <button type="button" disabled andesTooltipTrigger>Native disabled</button>
        </andes-tooltip>
        <andes-tooltip content="Nothing to publish yet" [openDelay]="0">
          <andes-button disabled andesTooltipTrigger>andes-button disabled</andes-button>
        </andes-tooltip>
      </div>
      <div style="display: flex; gap: 1.5rem; padding: 2rem 2rem 4rem; font-family: var(--andes-font-family), sans-serif;">
        <andes-tooltip content="You need edit rights to save" [openDelay]="0">
          <span class="sb-tooltip-wrapper" tabindex="0" andesTooltipTrigger>
            <andes-button disabled>Save (wrapper)</andes-button>
          </span>
        </andes-tooltip>
        <andes-tooltip content="Nothing to publish yet" [openDelay]="0">
          <button type="button" class="sb-aria-disabled" aria-disabled="true" andesTooltipTrigger>
            Publish (aria-disabled)
          </button>
        </andes-tooltip>
      </div>
    `,
  }),
};
