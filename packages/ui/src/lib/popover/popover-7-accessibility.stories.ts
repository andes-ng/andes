import { Component, signal } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';

import {
  about,
  muted,
  addStoryCss,
  bar,
  OPEN_FOR_GOOD,
  placementBoard,
  PLACEMENT_RING,
  stage,
  wideStage,
  withDescription,
  withPopoverKit,
} from '../../testing/popover-story-kit';
import { AndesButton } from '../button/button';
import { AndesInput } from '../input/input';
import { AndesTag } from '../tag/tag';
import { AndesPopover } from './popover';
import { AndesPopoverContent } from './popover-content';
import {
  AndesPopoverClose,
  AndesPopoverDescription,
  AndesPopoverHeader,
  AndesPopoverTitle,
} from './popover-parts';
import { AndesPopoverTrigger } from './popover-trigger';
import { ANDES_POPOVER_PRESET_COLORS } from './popover-types';

const MOTION_CSS = `
.story-motion-off { --andes-popover-duration: 0ms; --andes-popover-exit-duration: 0ms; --andes-popover-distance: 0px; --andes-popover-scale: 1; }
`;

/** Panels that open and close in quick succession, to watch for flicker. */
@Component({
  selector: 'andes-popover-rapid-demo',
  imports: [AndesButton, AndesPopover, AndesPopoverTrigger],
  template: `
    <div style="${stage} flex-direction: column; padding-top: 8rem;">
      <div style="${bar}">
        <andes-button (click)="replay()">Replay</andes-button>
        <andes-button variant="outline" (click)="flip()">Flip all</andes-button>
      </div>
      <div style="${bar}">
        @for (index of indexes; track index) {
          <andes-popover
            [open]="states()[index]"
            [trigger]="['hover']"
            [openDelay]="0"
            [closeDelay]="0"
            [showArrow]="true"
            [closeOnOutsideClick]="false"
            [title]="'Panel ' + (index + 1)"
            content="Sweep the pointer across the buttons."
            (openChange)="set(index, $event)"
          >
            <andes-button variant="outline" andesPopoverTrigger
              >Panel {{ index + 1 }}</andes-button
            >
          </andes-popover>
        }
      </div>
    </div>
  `,
})
class RapidDemo {
  protected readonly indexes = [0, 1, 2];
  protected readonly states = signal([false, false, false]);

  protected set(index: number, open: boolean): void {
    this.states.update((all) =>
      all.map((one, i) => (i === index ? open : one)),
    );
  }

  protected flip(): void {
    this.states.update((all) => all.map((one) => !one));
  }

  /** Twelve flips, 90ms apart: each panel opens and closes before its motion has ended. */
  protected replay(): void {
    for (let step = 0; step < 12; step++) {
      setTimeout(() => this.flip(), step * 90);
    }
  }
}

const meta: Meta<AndesPopover> = {
  title: 'Data Display/Popover/Accessibility and motion',
  component: AndesPopover,
  decorators: [
    withDescription,
    withPopoverKit,
    moduleMetadata({
      imports: [
        AndesButton,
        AndesInput,
        AndesTag,
        NgIcon,
        AndesPopoverTrigger,
        AndesPopoverContent,
        AndesPopoverHeader,
        AndesPopoverTitle,
        AndesPopoverDescription,
        AndesPopoverClose,
      ],
    }),
  ],
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<AndesPopover>;

/** Keyboard. */
export const KeyboardOnly: Story = {
  name: 'Keyboard only',
  parameters: about(
    'Tab to the trigger and press Enter or Space: focus moves to the first control in the panel, Tab walks the controls, and Escape closes it with focus back on the trigger.',
  ),
  render: () => ({
    props: { muted },
    template: `
      <div style="${stage} flex-direction: column;">
        <andes-popover placement="bottomLeft" [showArrow]="true">
          <andes-button variant="outline" andesPopoverTrigger>Share</andes-button>
          <andes-popover-content style="width: 16rem;">
            <div andesPopoverHeader>
              <h3 andesPopoverTitle>Share this page</h3>
              <p andesPopoverDescription>Anyone with the link can read it.</p>
            </div>
            <div style="display: flex; flex-direction: column; gap: 0.75rem;">
              <andes-input aria-label="Link" size="sm" value="https://example.com/p/42" />
              <div style="display: flex; justify-content: flex-end; gap: 0.5rem;">
                <andes-button size="sm" variant="outline" andesPopoverClose>Cancel</andes-button>
                <andes-button size="sm" andesPopoverClose>Copy link</andes-button>
              </div>
            </div>
          </andes-popover-content>
        </andes-popover>
        <p [style]="muted + ' margin: 0;'">Tab, Enter, Tab, Tab, Escape.</p>
      </div>
    `,
  }),
};

/** Labelled and described. */
export const LabelledAndDescribed: Story = {
  name: 'Labelled and described',
  parameters: about(
    'The panel is a dialog named by its title and described by its description, so a screen reader announces both when focus enters.',
  ),
  render: () => ({
    template: `
      <div style="${stage}">
        <andes-popover [showArrow]="true">
          <andes-button variant="outline" andesPopoverTrigger>Storage</andes-button>
          <andes-popover-content>
            <div andesPopoverHeader>
              <h3 andesPopoverTitle>Storage</h3>
              <p andesPopoverDescription>7.2 GB of 10 GB used.</p>
            </div>
            <andes-button size="sm" variant="outline" andesPopoverClose>Close</andes-button>
          </andes-popover-content>
        </andes-popover>
      </div>
    `,
  }),
};

/** Where focus goes. */
export const FocusTargets: Story = {
  name: 'Where focus goes',
  parameters: about(
    'autoFocus chooses what receives focus on opening: the first control, the panel itself, or nothing, for a panel that only informs.',
  ),
  render: () => ({
    template: `
      <div style="${wideStage}">
        @for (mode of ['first-tabbable', 'container', 'none']; track mode) {
          <andes-popover [autoFocus]="$any(mode)" [title]="mode" content="Press Tab after opening to see where focus was." [showArrow]="true">
            <andes-button variant="outline" andesPopoverTrigger>{{ mode }}</andes-button>
          </andes-popover>
        }
      </div>
    `,
  }),
};

/** Restoring focus. */
export const RestoreFocus: Story = {
  name: 'Returning focus',
  parameters: about(
    'A click-opened panel returns focus to its trigger when it closes, and restoreFocus off leaves it where the close happened.',
  ),
  render: () => ({
    template: `
      <div style="${wideStage}">
        <andes-popover title="Restores" content="Closing returns focus to the trigger." [showArrow]="true">
          <andes-button variant="outline" andesPopoverTrigger>Restores focus</andes-button>
        </andes-popover>
        <andes-popover [restoreFocus]="false" title="Does not" content="Closing leaves focus where it is." [showArrow]="true">
          <andes-button variant="outline" andesPopoverTrigger>Does not restore</andes-button>
        </andes-popover>
      </div>
    `,
  }),
};

/** Not trapped. */
export const NotTrapped: Story = {
  name: 'Focus is not trapped',
  parameters: about(
    'The page behind stays usable: Tab from the last control of the panel moves on to the next element of the page and the panel closes with it.',
  ),
  render: () => ({
    template: `
      <div style="${stage}">
        <andes-button variant="ghost">Before</andes-button>
        <andes-popover [showArrow]="true" title="Not a trap" content="Tab out of me.">
          <andes-button variant="outline" andesPopoverTrigger>Open</andes-button>
        </andes-popover>
        <andes-button variant="ghost">After</andes-button>
      </div>
    `,
  }),
};

/** Hover and focus parity. */
export const KeyboardParity: Story = {
  name: 'Hover content for keyboard users',
  parameters: about(
    'Information shown on hover is also shown on focus, so a keyboard user who tabs onto the trigger gets the same panel.',
  ),
  render: () => ({
    template: `
      <div style="${stage}">
        <andes-popover [trigger]="['hover', 'focus']" content="Archived projects are read-only." [showArrow]="true">
          <andes-tag andesPopoverTrigger tabindex="0">Archived</andes-tag>
        </andes-popover>
      </div>
    `,
  }),
};

/** Dark theme. */
export const DarkTheme: Story = {
  name: 'Dark theme',
  globals: { theme: 'dark' },
  parameters: about(
    'On the dark theme the surface, the border, the muted text and every colour preset keep a readable contrast; switch the theme in the toolbar to compare.',
  ),
  render: () => ({
    props: { colours: ANDES_POPOVER_PRESET_COLORS },
    template: `
      <div style="${wideStage}">
        <andes-popover title="Surface" content="The regular surface on a dark page." [showArrow]="true">
          <andes-button variant="outline" andesPopoverTrigger>Default</andes-button>
        </andes-popover>
        @for (colour of colours; track colour) {
          <andes-popover [color]="colour" [title]="colour" content="A preset on a dark page." [showArrow]="true">
            <andes-button variant="outline" andesPopoverTrigger>{{ colour }}</andes-button>
          </andes-popover>
        }
      </div>
    `,
  }),
};

/** Right to left. */
export const RightToLeft: Story = {
  name: 'Right to left',
  parameters: {
    dir: 'rtl',
    ...about(
      'Under a right-to-left document the start edge is the right one, so topLeft, a start alignment and the arrow follow the reading direction.',
    ),
  },
  render: () => ({
    template: `
      <div dir="rtl" style="${wideStage}">
        <andes-popover placement="bottomLeft" title="الإعدادات" content="غيّر الاسم واللغة ومنطقة الوقت." [showArrow]="true">
          <andes-button variant="outline" andesPopoverTrigger>الإعدادات</andes-button>
        </andes-popover>
        <andes-popover side="bottom" align="start" title="بداية" content="محاذاة البداية في اتجاه القراءة." [showArrow]="true">
          <andes-button variant="outline" andesPopoverTrigger>بداية</andes-button>
        </andes-popover>
        <andes-popover side="right" title="يمين" content="تظهر النافذة على اليمين." [showArrow]="true">
          <andes-button variant="outline" andesPopoverTrigger>يمين</andes-button>
        </andes-popover>
      </div>
    `,
  }),
};

/** Narrow screens. */
export const NarrowScreens: Story = {
  name: 'Narrow screens',
  parameters: about(
    'A long text never makes the panel wider than the window minus a margin, so on a phone it wraps and stays fully on screen.',
  ),
  render: () => ({
    template: `
      <div style="${stage}">
        <andes-popover title="Terms of use" content="By continuing you agree to the terms of service and the privacy policy, which describe how your data is stored and for how long it is kept on our servers." [showArrow]="true">
          <andes-button variant="outline" andesPopoverTrigger>Read the terms</andes-button>
        </andes-popover>
      </div>
    `,
  }),
};

/** Rapid toggling. */
export const RapidToggling: Story = {
  name: 'Rapid opening and closing',
  parameters: about(
    'Replay flips three panels twelve times in a second and sweeping the pointer across the buttons opens and closes them at once, so any flicker from the shadow filter or a restarted motion would show.',
  ),
  render: () => ({
    moduleMetadata: { imports: [RapidDemo] },
    template: `<andes-popover-rapid-demo />`,
  }),
};

/** Reduced motion. */
export const ReducedMotion: Story = {
  name: 'Reduced motion',
  parameters: about(
    'With the motion tokens off, which is what the panel resolves to when the system asks for reduced motion apart from a short fade, the panel appears without drift or scale.',
  ),
  render: () => {
    addStoryCss('story-popover-motion-css', MOTION_CSS);
    return {
      template: `
        <div style="${wideStage}">
          <andes-popover trigger="hover" title="Default" content="With its normal motion." [showArrow]="true">
            <andes-button variant="outline" andesPopoverTrigger>Normal</andes-button>
          </andes-popover>
          <andes-popover trigger="hover" panelClass="story-motion-off" title="No motion" content="Duration, drift and scale are all off." [showArrow]="true">
            <andes-button variant="outline" andesPopoverTrigger>Tokens off</andes-button>
          </andes-popover>
        </div>
      `,
    };
  },
};

/** Arrow alignment, dark. */
export const ArrowAlignmentDark: Story = {
  name: 'Arrow alignment, dark',
  globals: { theme: 'dark' },
  parameters: about(
    'All twelve placements open at once on the dark theme: the border, the arrow outline, the fill and the shadow stay one silhouette.',
  ),
  render: () => ({
    props: { placements: PLACEMENT_RING },
    template: `
      <div style="${placementBoard}">
        @for (placement of placements; track placement) {
          <div style="display: flex; align-items: center; justify-content: center; min-height: 9.5rem;">
            <andes-popover [placement]="placement" [showArrow]="true" ${OPEN_FOR_GOOD} [content]="placement">
              <andes-button size="sm" variant="outline" andesPopoverTrigger>{{ placement }}</andes-button>
            </andes-popover>
          </div>
        }
      </div>
    `,
  }),
};

/** Arrow alignment, right to left. */
export const ArrowAlignmentRtl: Story = {
  name: 'Arrow alignment, right to left',
  parameters: {
    dir: 'rtl',
    ...about(
      'All twelve placements open at once under a right-to-left document, where the start and end edges swap but the left and right sides do not.',
    ),
  },
  render: () => ({
    props: { placements: PLACEMENT_RING },
    template: `
      <div style="${placementBoard}">
        @for (placement of placements; track placement) {
          <div style="display: flex; align-items: center; justify-content: center; min-height: 9.5rem;">
            <andes-popover [placement]="placement" [showArrow]="true" ${OPEN_FOR_GOOD} [content]="placement">
              <andes-button size="sm" variant="outline" andesPopoverTrigger>{{ placement }}</andes-button>
            </andes-popover>
          </div>
        }
      </div>
    `,
  }),
};
