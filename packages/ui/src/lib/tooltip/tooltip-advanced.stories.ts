import { Component, DestroyRef, inject, signal } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular';

import { AndesTooltip } from './tooltip';
import { AndesTooltipContent } from './tooltip-content';
import { AndesTooltipTrigger } from './tooltip-trigger';

/** Shows when it was created - makes `destroyOnHidden` visible. */
@Component({
  selector: 'andes-story-render-stamp',
  template: `Rendered at {{ renderedAt }}`,
})
class StoryRenderStamp {
  readonly renderedAt = new Date().toLocaleTimeString();
}

/** A trigger that keeps resizing, to show an open tooltip re-aligning. */
@Component({
  selector: 'andes-story-growing-trigger',
  imports: [AndesTooltip, AndesTooltipTrigger],
  template: `
    <div style="padding: 6rem; width: 32rem;">
      <andes-tooltip
        content="I stay centered on the box"
        placement="bottom"
        [open]="true"
      >
        <span
          andesTooltipTrigger
          style="display: inline-block; padding: 0.5rem; border: 1px dashed var(--andes-color-border); transition: width 300ms;"
          [style.width.px]="width()"
        >
          Growing trigger
        </span>
      </andes-tooltip>
    </div>
  `,
})
class StoryGrowingTrigger {
  protected readonly width = signal(140);

  constructor() {
    const timer = setInterval(
      () => this.width.update((width) => (width >= 380 ? 140 : width + 80)),
      1200,
    );
    inject(DestroyRef).onDestroy(() => clearInterval(timer));
  }
}

const meta: Meta<AndesTooltip> = {
  title: 'Data Display/Tooltip/Advanced/Behavior',
  component: AndesTooltip,
};

export default meta;

type Story = StoryObj<AndesTooltip>;

/**
 * `[(open)]`: controlled from outside; `openChange` reports user-driven changes. The state fields
 * are named `isOpen` and `log` so Storybook does not forward them onto the tooltip's inputs.
 */
export const Controlled: Story = {
  render: () => ({
    moduleMetadata: { imports: [AndesTooltipTrigger] },
    props: { isOpen: true, log: [] as string[] },
    template: `
      <div style="display: flex; flex-direction: column; align-items: center; gap: 1.5rem; padding: 5rem 2rem; font-family: var(--andes-font-family), sans-serif; color: var(--andes-color-foreground);">
        <andes-tooltip
          content="Controlled tooltip"
          [(open)]="isOpen"
          (openChange)="log = [...log, 'openChange: ' + $event]"
        >
          <button type="button" andesTooltipTrigger>Trigger</button>
        </andes-tooltip>
        <button type="button" (click)="isOpen = !isOpen">
          {{ isOpen ? 'Close' : 'Open' }} programmatically
        </button>
        <code>open = {{ isOpen }}</code>
        <code>{{ log.join(', ') || 'no openChange yet' }}</code>
      </div>
    `,
  }),
};

/**
 * Hover timing. The first tooltip opens at once and lingers 300ms (`openDelay` / `closeDelay`).
 * In the toolbar, hover the first icon and wait for its tooltip, then move to the next one: it
 * opens instantly instead of paying the open delay again (`instantReopenWindow`).
 */
export const Timing: Story = {
  render: () => ({
    moduleMetadata: { imports: [AndesTooltipTrigger] },
    template: `
      <div style="display: flex; align-items: center; gap: 3rem; padding: 6rem;">
        <andes-tooltip content="No open delay, closes after 300ms" [openDelay]="0" [closeDelay]="300">
          <button type="button" andesTooltipTrigger>Custom timing</button>
        </andes-tooltip>
        <div style="display: flex; gap: 0.5rem;">
          <andes-tooltip content="Cut">
            <button type="button" andesTooltipTrigger aria-label="Cut">✂️</button>
          </andes-tooltip>
          <andes-tooltip content="Copy">
            <button type="button" andesTooltipTrigger aria-label="Copy">📋</button>
          </andes-tooltip>
          <andes-tooltip content="Paste">
            <button type="button" andesTooltipTrigger aria-label="Paste">📌</button>
          </andes-tooltip>
        </div>
      </div>
    `,
  }),
};

/**
 * `autoAdjustOverflow` (on by default): a tooltip that would leave the
 * viewport flips to the opposite side (top edge), falls back to a
 * perpendicular side when that does not fit either (left edge), and is shifted
 * back on screen as a last resort - the arrow follows it in every case. The
 * top-right trigger has it turned off and is clipped instead.
 */
export const AutoAdjustOverflow: Story = {
  parameters: { layout: 'fullscreen' },
  render: () => ({
    moduleMetadata: { imports: [AndesTooltipTrigger] },
    template: `
      <div style="position: relative; height: 18rem;">
        <andes-tooltip
          style="position: absolute; top: 0.5rem; left: 50%; transform: translateX(-50%);"
          content="Asked for top - flipped below"
          placement="top"
          [open]="true"
        >
          <button type="button" andesTooltipTrigger>Top edge</button>
        </andes-tooltip>
        <andes-tooltip
          style="position: absolute; top: 0.5rem; right: 0.5rem;"
          content="autoAdjustOverflow=false - clipped"
          placement="top"
          [autoAdjustOverflow]="false"
          [open]="true"
        >
          <button type="button" andesTooltipTrigger>No adjust</button>
        </andes-tooltip>
        <andes-tooltip
          style="position: absolute; top: 8rem; left: 0.5rem;"
          content="Asked for left - flipped right"
          placement="left"
          [open]="true"
        >
          <button type="button" andesTooltipTrigger>Left edge</button>
        </andes-tooltip>
        <andes-tooltip
          style="position: absolute; bottom: 0.5rem; right: 0.5rem;"
          content="Asked for bottomLeft - no room below, so it moved to the first side with room"
          placement="bottomLeft"
          [open]="true"
        >
          <button type="button" andesTooltipTrigger>Corner</button>
        </andes-tooltip>
      </div>
    `,
  }),
};

/**
 * Content lifecycle: by default the content is rendered once and kept across
 * openings (the timestamp stays put); with `destroyOnHidden` it is recreated
 * every time. `fresh` additionally keeps kept-alive content updating while
 * hidden.
 */
export const ContentLifecycle: Story = {
  render: () => ({
    moduleMetadata: {
      imports: [AndesTooltipTrigger, AndesTooltipContent, StoryRenderStamp],
    },
    template: `
      <div style="display: flex; gap: 2rem; padding: 6rem;">
        <andes-tooltip [openDelay]="0">
          <button type="button" andesTooltipTrigger>Kept (default)</button>
          <ng-template andesTooltipContent><andes-story-render-stamp /></ng-template>
        </andes-tooltip>
        <andes-tooltip [openDelay]="0" destroyOnHidden>
          <button type="button" andesTooltipTrigger>destroyOnHidden</button>
          <ng-template andesTooltipContent><andes-story-render-stamp /></ng-template>
        </andes-tooltip>
      </div>
    `,
  }),
};

/**
 * An open tooltip stays aligned when its trigger changes size: the box below
 * grows and shrinks on a timer and the tooltip follows it.
 */
export const FollowsLayoutChanges: Story = {
  name: 'Follows layout changes',
  render: () => ({
    moduleMetadata: { imports: [StoryGrowingTrigger] },
    template: `<andes-story-growing-trigger />`,
  }),
};

/**
 * Styling and layering. `maxWidth` wraps a long hint; `tooltipClass` and the `--andes-tooltip-*`
 * custom properties restyle the panel; `zIndex` overrides the `--andes-z-index-tooltip` layer
 * (the last two tooltips overlap, and the second one is sent below the first).
 */
export const Styling: Story = {
  render: () => ({
    moduleMetadata: { imports: [AndesTooltipTrigger] },
    // The tooltip is portalled out of the story, so the rule has to be global.
    styles: [
      `::ng-deep .story-tooltip-inverse {
        --andes-tooltip-background: var(--andes-color-foreground);
        --andes-tooltip-foreground: var(--andes-color-background);
        --andes-tooltip-border-color: var(--andes-color-foreground);
        --andes-tooltip-max-width: 12rem;
      }`,
    ],
    template: `
      <div style="display: flex; gap: 12rem; padding: 7rem 2rem 9rem;">
        <andes-tooltip
          content="maxWidth=140: a long hint wraps onto several lines instead of stretching across the page."
          [maxWidth]="140"
          [open]="true"
        >
          <button type="button" andesTooltipTrigger>maxWidth</button>
        </andes-tooltip>
        <andes-tooltip
          content="Styled through tooltipClass and the --andes-tooltip-* custom properties."
          tooltipClass="story-tooltip-inverse"
          [open]="true"
        >
          <button type="button" andesTooltipTrigger>tooltipClass</button>
        </andes-tooltip>
        <div style="display: flex; gap: 0.5rem;">
          <andes-tooltip content="Default layer: on top" placement="bottomLeft" [open]="true">
            <button type="button" andesTooltipTrigger>Default layer</button>
          </andes-tooltip>
          <andes-tooltip content="zIndex=1: drawn underneath the other tooltip" placement="bottom" [zIndex]="1" [open]="true" color="info">
            <button type="button" andesTooltipTrigger>zIndex=1</button>
          </andes-tooltip>
        </div>
      </div>
    `,
  }),
};
