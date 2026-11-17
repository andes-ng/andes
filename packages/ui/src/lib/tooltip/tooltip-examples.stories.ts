import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  Injector,
  signal,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';

import { AndesButton } from '../button/button';
import { AndesTooltip, ANDES_TOOLTIP_HUE_COLORS } from './tooltip';
import type { AndesTooltipArrowInput } from './tooltip-placement';
import { AndesTooltipProvider } from './tooltip-provider';
import type {
  AndesTooltipSemanticInfo,
  AndesTooltipStyles,
} from './tooltip-semantic';
import { AndesTooltipTrigger } from './tooltip-trigger';

/**
 * One story per example on Ant Design's Tooltip page (https://ant.design/components/tooltip),
 * in the page's order and under its names, rebuilt from andes-ng parts so the two can be
 * compared side by side. The measures are Ant's too: a 14px / 22px text in a box padded 6px by
 * 8px with a 6px radius, at least 32px tall, at most 250px wide, on an 85% black surface, with a
 * 16 x 8 arrow and 12px between the box and the trigger. Ant opens a tooltip 0.1s after the
 * pointer enters (`mouseEnterDelay`), so these stories set `openDelay` to 100.
 */
const meta: Meta = {
  title: 'Data Display/Tooltip/Examples',
  parameters: { layout: 'padded' },
  decorators: [
    moduleMetadata({
      imports: [AndesTooltip, AndesTooltipTrigger, AndesButton],
    }),
  ],
};

export default meta;

type Story = StoryObj;

/* ------------------------------------------------------------------ Basic */

/** The simplest usage: `content` is the text, the element inside `<andes-tooltip>` is the trigger. */
export const Basic: Story = {
  render: () => ({
    template: `
      <div style="padding: 3rem 1rem 1rem;">
        <andes-tooltip content="prompt text" [openDelay]="100">
          <andes-button andesTooltipTrigger variant="outline">Tooltip will show on mouse enter.</andes-button>
        </andes-tooltip>
      </div>
    `,
  }),
};

/* ------------------------------------------------------ Smooth Transition */

/**
 * Put the tooltips under `andesTooltipProvider` with `unique` (or provide `unique: true` with
 * `provideAndesTooltipConfig`) and only one is shown at a time: moving to another trigger glides
 * the tooltip across instead of closing it and opening another.
 */
export const SmoothTransition: Story = {
  name: 'Smooth Transition',
  decorators: [
    moduleMetadata({
      imports: [
        AndesTooltip,
        AndesTooltipTrigger,
        AndesTooltipProvider,
        AndesButton,
      ],
    }),
  ],
  render: () => ({
    template: `
      <div andesTooltipProvider unique [openDelay]="100" style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem; padding: 4rem 1rem;">
        <div style="display: flex; gap: 0.5rem;">
          <andes-tooltip content="Hello, Andes!" placement="top">
            <andes-button andesTooltipTrigger>Button</andes-button>
          </andes-tooltip>
          <andes-tooltip content="Hello, Andes!" placement="top">
            <andes-button andesTooltipTrigger>Button</andes-button>
          </andes-tooltip>
        </div>
        <div style="display: flex; gap: 0.5rem;">
          <andes-tooltip content="Hello, Andes!" placement="bottom">
            <andes-button andesTooltipTrigger>Button</andes-button>
          </andes-tooltip>
          <andes-tooltip content="Hello, Andes!" placement="bottom">
            <andes-button andesTooltipTrigger>Button</andes-button>
          </andes-tooltip>
        </div>
      </div>
    `,
  }),
};

/* -------------------------------------------------------------- Placement */

/** There are 12 `placement` options. */
export const Placement: Story = {
  render: () => ({
    template: `
      <div style="display: flex; flex-direction: column; align-items: center; padding: 4rem 6rem; white-space: nowrap;">
        <div style="display: flex; gap: 0.5rem;">
          <andes-tooltip placement="topLeft" content="prompt text" [openDelay]="100"><andes-button andesTooltipTrigger variant="outline" fullWidth style="width: 5rem;">TL</andes-button></andes-tooltip>
          <andes-tooltip placement="top" content="prompt text" [openDelay]="100"><andes-button andesTooltipTrigger variant="outline" fullWidth style="width: 5rem;">Top</andes-button></andes-tooltip>
          <andes-tooltip placement="topRight" content="prompt text" [openDelay]="100"><andes-button andesTooltipTrigger variant="outline" fullWidth style="width: 5rem;">TR</andes-button></andes-tooltip>
        </div>
        <div style="display: flex; justify-content: space-between; width: 30rem; margin: 0.5rem 0;">
          <div style="display: flex; flex-direction: column; gap: 0.5rem;">
            <andes-tooltip placement="leftTop" content="prompt text" [openDelay]="100"><andes-button andesTooltipTrigger variant="outline" fullWidth style="width: 5rem;">LT</andes-button></andes-tooltip>
            <andes-tooltip placement="left" content="prompt text" [openDelay]="100"><andes-button andesTooltipTrigger variant="outline" fullWidth style="width: 5rem;">Left</andes-button></andes-tooltip>
            <andes-tooltip placement="leftBottom" content="prompt text" [openDelay]="100"><andes-button andesTooltipTrigger variant="outline" fullWidth style="width: 5rem;">LB</andes-button></andes-tooltip>
          </div>
          <div style="display: flex; flex-direction: column; gap: 0.5rem;">
            <andes-tooltip placement="rightTop" content="prompt text" [openDelay]="100"><andes-button andesTooltipTrigger variant="outline" fullWidth style="width: 5rem;">RT</andes-button></andes-tooltip>
            <andes-tooltip placement="right" content="prompt text" [openDelay]="100"><andes-button andesTooltipTrigger variant="outline" fullWidth style="width: 5rem;">Right</andes-button></andes-tooltip>
            <andes-tooltip placement="rightBottom" content="prompt text" [openDelay]="100"><andes-button andesTooltipTrigger variant="outline" fullWidth style="width: 5rem;">RB</andes-button></andes-tooltip>
          </div>
        </div>
        <div style="display: flex; gap: 0.5rem;">
          <andes-tooltip placement="bottomLeft" content="prompt text" [openDelay]="100"><andes-button andesTooltipTrigger variant="outline" fullWidth style="width: 5rem;">BL</andes-button></andes-tooltip>
          <andes-tooltip placement="bottom" content="prompt text" [openDelay]="100"><andes-button andesTooltipTrigger variant="outline" fullWidth style="width: 5rem;">Bottom</andes-button></andes-tooltip>
          <andes-tooltip placement="bottomRight" content="prompt text" [openDelay]="100"><andes-button andesTooltipTrigger variant="outline" fullWidth style="width: 5rem;">BR</andes-button></andes-tooltip>
        </div>
      </div>
    `,
  }),
};

/* ------------------------------------------------------------------ Arrow */

const ARROW_MODES = ['Show', 'Hide', 'Center'] as const;
type ArrowMode = (typeof ARROW_MODES)[number];

@Component({
  selector: 'andes-tooltip-example-arrow',
  imports: [AndesTooltip, AndesTooltipTrigger, AndesButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="modes">
      @for (mode of modes; track mode) {
        <andes-button
          size="sm"
          [variant]="mode === arrowMode() ? 'primary' : 'outline'"
          (click)="arrowMode.set(mode)"
          >{{ mode }}</andes-button
        >
      }
    </div>
    <div class="grid">
      @for (cell of cells; track cell.placement) {
        <andes-tooltip
          [placement]="cell.placement"
          content="prompt text"
          [arrow]="arrow()"
          [openDelay]="100"
          [style.grid-area]="cell.area"
        >
          <andes-button
            andesTooltipTrigger
            variant="outline"
            fullWidth
            class="cell"
            >{{ cell.label }}</andes-button
          >
        </andes-tooltip>
      }
    </div>
  `,
  styles: `
    .modes {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 2rem;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(5, 5rem);
      grid-template-rows: repeat(5, 2rem);
      gap: 0.5rem;
      justify-content: center;
      padding: 3rem 2rem;
    }
    .cell {
      display: block;
      width: 100%;
    }
  `,
})
class ArrowExample {
  protected readonly modes = ARROW_MODES;
  protected readonly arrowMode = signal<ArrowMode>('Show');
  protected readonly arrow = computed<AndesTooltipArrowInput>(() => {
    const mode = this.arrowMode();
    return mode === 'Hide'
      ? false
      : mode === 'Center'
        ? { pointAtCenter: true }
        : true;
  });
  protected readonly cells = [
    { placement: 'topLeft', label: 'TL', area: '1 / 1 / 2 / 2' },
    { placement: 'top', label: 'Top', area: '1 / 2 / 2 / 3' },
    { placement: 'topRight', label: 'TR', area: '1 / 3 / 2 / 4' },
    { placement: 'leftTop', label: 'LT', area: '2 / 1' },
    { placement: 'left', label: 'Left', area: '3 / 1' },
    { placement: 'leftBottom', label: 'LB', area: '4 / 1' },
    { placement: 'rightTop', label: 'RT', area: '2 / 5' },
    { placement: 'right', label: 'Right', area: '3 / 5' },
    { placement: 'rightBottom', label: 'RB', area: '4 / 5' },
    { placement: 'bottomLeft', label: 'BL', area: '5 / 1 / 6 / 2' },
    { placement: 'bottom', label: 'Bottom', area: '5 / 2 / 6 / 3' },
    { placement: 'bottomRight', label: 'BR', area: '5 / 3 / 6 / 4' },
  ] as const;
}

/**
 * `arrow` shows the arrow (the default), hides it with `false`, or - with `{ pointAtCenter: true }` -
 * keeps it on the trigger's center for the edge-aligned placements.
 */
export const Arrow: Story = {
  render: () => ({
    moduleMetadata: { imports: [ArrowExample] },
    template: '<andes-tooltip-example-arrow />',
  }),
};

/* -------------------------------------------------------------- Auto Shift */

@Component({
  selector: 'andes-tooltip-example-auto-shift',
  imports: [AndesTooltip, AndesTooltipTrigger, AndesButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div #scroller class="scroller">
      <div class="page">
        <andes-tooltip
          content="Thanks for using Andes. Have a nice day!"
          [open]="true"
        >
          <andes-button andesTooltipTrigger>Scroll The Window</andes-button>
        </andes-tooltip>
      </div>
    </div>
  `,
  styles: `
    .scroller {
      height: 100vh;
      overflow: auto;
    }
    .page {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 300%;
      height: 300%;
    }
  `,
})
class AutoShiftExample {
  private readonly scroller =
    viewChild.required<ElementRef<HTMLElement>>('scroller');

  constructor() {
    // Ant Design scrolls the window so the trigger starts in the middle of the screen.
    afterNextRender(() => {
      const scroller = this.scroller().nativeElement;
      scroller.scrollTop = scroller.clientHeight;
      scroller.scrollLeft = scroller.clientWidth;
    });
  }
}

/**
 * `autoAdjustOverflow` (on by default) shifts the tooltip, and its arrow with it, back on screen
 * when the trigger is close to the edge. Scroll the page until the button reaches an edge of the screen; the
 * tooltip is only pushed out of view once the trigger itself leaves it.
 */
export const AutoShift: Story = {
  name: 'Auto Shift',
  parameters: { layout: 'fullscreen' },
  render: () => ({
    moduleMetadata: { imports: [AutoShiftExample] },
    template: '<andes-tooltip-example-auto-shift />',
  }),
};

/* ---------------------------------------- Realign after layout changes */

@Component({
  selector: 'andes-tooltip-example-realign',
  imports: [AndesTooltip, AndesTooltipTrigger, AndesButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="box">
      @if (loaded()) {
        <div class="loaded">Async content loaded.</div>
      }
      <andes-tooltip
        #tooltip
        content="Tooltip stays aligned"
        [open]="true"
        placement="top"
      >
        <andes-button andesTooltipTrigger variant="outline"
          >Trigger</andes-button
        >
      </andes-tooltip>
    </div>
    <andes-button size="sm" variant="outline" (click)="reload()"
      >Load again</andes-button
    >
  `,
  styles: `
    .box {
      min-height: 10rem;
      padding-top: 3rem;
    }
    .loaded {
      height: 5rem;
      margin-bottom: 1rem;
    }
  `,
})
class RealignExample {
  private readonly injector = inject(Injector);
  private readonly tooltip = viewChild.required(AndesTooltip);
  protected readonly loaded = signal(false);

  constructor() {
    this.reload();
  }

  protected reload(): void {
    this.loaded.set(false);
    setTimeout(() => {
      this.loaded.set(true);
      // The content pushed the trigger down without resizing it or the tooltip, so the
      // tooltip is asked to follow once the layout has settled.
      afterNextRender(() => this.tooltip().updatePosition(), {
        injector: this.injector,
      });
    }, 2000);
  }
}

/**
 * An open tooltip follows its trigger when either one resizes. When the layout moves the trigger
 * without resizing anything - here content that loads above it after two seconds - call
 * `updatePosition()` once the layout has changed.
 */
export const RealignAfterLayoutChanges: Story = {
  name: 'Realign after layout changes',
  render: () => ({
    moduleMetadata: { imports: [RealignExample] },
    template: '<andes-tooltip-example-realign />',
  }),
};

/* --------------------------------------------------------- Colorful Tooltip */

/**
 * `color` takes the preset names (the hue names of Ant Design's palette, besides the
 * `primary` ... `info` semantic ones) or any CSS color; the text turns black or white to suit it
 * and the arrow always matches.
 */
export const ColorfulTooltip: Story = {
  name: 'Colorful Tooltip',
  render: () => ({
    props: {
      hues: ANDES_TOOLTIP_HUE_COLORS,
      customs: ['#f50', '#2db7f5', '#87d068', '#108ee9'],
    },
    template: `
      <div style="display: flex; flex-direction: column; gap: 0.75rem; padding: 3rem 1rem 1rem; max-width: 40rem;">
        <div style="font-weight: 500;">Presets</div>
        <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
          @for (hue of hues; track hue) {
            <andes-tooltip content="prompt text" [color]="hue" [openDelay]="100">
              <andes-button andesTooltipTrigger variant="outline">{{ hue }}</andes-button>
            </andes-tooltip>
          }
        </div>
        <div style="font-weight: 500; margin-top: 1rem;">Custom</div>
        <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
          @for (custom of customs; track custom) {
            <andes-tooltip content="prompt text" [color]="custom" [openDelay]="100">
              <andes-button andesTooltipTrigger variant="outline">{{ custom }}</andes-button>
            </andes-tooltip>
          }
        </div>
      </div>
    `,
  }),
};

/* ---------------------------------------------------------------- Disabled */

@Component({
  selector: 'andes-tooltip-example-disabled',
  imports: [AndesTooltip, AndesTooltipTrigger, AndesButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div style="padding: 3rem 1rem 1rem;">
      <andes-tooltip
        [content]="disabled() ? null : 'prompt text'"
        [openDelay]="100"
      >
        <andes-button
          andesTooltipTrigger
          variant="outline"
          (click)="disabled.set(!disabled())"
          >{{ disabled() ? 'Enable' : 'Disable' }}</andes-button
        >
      </andes-tooltip>
    </div>
  `,
})
class DisabledExample {
  protected readonly disabled = signal(true);
}

/**
 * A tooltip with no content - `content` set to `null` or `''` - does not open. (To turn a tooltip
 * off whatever its content, use `disabled`.)
 */
export const Disabled: Story = {
  render: () => ({
    moduleMetadata: { imports: [DisabledExample] },
    template: '<andes-tooltip-example-disabled />',
  }),
};

/* ---------------------------------------------------- Wrap custom component */

/** A component that renders its own element: it only has to be what the tooltip is bound to. */
@Component({
  selector: 'andes-tooltip-example-events',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `This text is inside a component with the necessary events exposed.`,
  host: { style: 'display: inline-block; padding: 0.25rem 0;' },
})
class ComponentWithEvents {}

/**
 * `andesTooltipTrigger` works on any element or component: the tooltip listens to the pointer and
 * focus events that reach its host, and anchors to it. Nothing has to be forwarded.
 */
export const WrapCustomComponent: Story = {
  name: 'Wrap custom component',
  render: () => ({
    moduleMetadata: { imports: [ComponentWithEvents] },
    template: `
      <div style="padding: 3rem 1rem 1rem;">
        <andes-tooltip content="prompt text" [openDelay]="100">
          <andes-tooltip-example-events andesTooltipTrigger />
        </andes-tooltip>
      </div>
    `,
  }),
};

/* ------------------------------------------- Custom semantic dom styling */

@Component({
  selector: 'andes-tooltip-example-semantic',
  imports: [AndesTooltip, AndesTooltipTrigger, AndesButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="tooltip-example-row">
      <andes-tooltip
        content="Object text"
        [arrow]="false"
        [classNames]="classNames"
        [styles]="objectStyles"
        [openDelay]="100"
      >
        <andes-button andesTooltipTrigger variant="outline"
          >Object Style</andes-button
        >
      </andes-tooltip>
      <andes-tooltip
        content="Function text"
        [arrow]="false"
        [classNames]="classNames"
        [styles]="functionStyles"
        [openDelay]="100"
      >
        <andes-button andesTooltipTrigger>Function Style</andes-button>
      </andes-tooltip>
    </div>
  `,
  styles: `
    .tooltip-example-row {
      display: flex;
      gap: 1rem;
      padding: 3rem 1rem 1rem;
    }
    /* The tooltip is portalled out of the story, so the rule has to be global. */
    .tooltip-example-container.tooltip-example-container {
      padding: 10px;
    }
  `,
})
class SemanticExample {
  protected readonly classNames = { container: 'tooltip-example-container' };
  protected readonly objectStyles: AndesTooltipStyles = {
    container: { borderRadius: 12, boxShadow: 'inset 0 0 8px #ccc' },
  };
  protected readonly functionStyles = ({
    props,
  }: AndesTooltipSemanticInfo): AndesTooltipStyles =>
    props.arrow
      ? {}
      : {
          container: {
            backgroundColor: 'rgba(53, 71, 125, 0.8)',
            padding: 12,
            color: '#fff',
            borderRadius: 4,
          },
        };
}

/**
 * `classNames` and `styles` take an object, or a function of the tooltip's props, with a value for
 * each part: `root`, `container` and `arrow`. Here the container gets a class and a style object, and
 * the second tooltip restyles itself from its props.
 */
export const CustomSemanticDomStyling: Story = {
  name: 'Custom semantic dom styling',
  render: () => ({
    moduleMetadata: { imports: [SemanticExample] },
    template: '<andes-tooltip-example-semantic />',
  }),
};
