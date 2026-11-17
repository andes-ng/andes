import { Component, ErrorHandler, signal } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';

import {
  about,
  addStoryCss,
  bar,
  muted,
  OPEN_FOR_GOOD,
  placementBoard,
  PLACEMENT_RING,
  stage,
  withDescription,
  withPopoverKit,
  wideStage,
} from '../../testing/popover-story-kit';
import { AndesButton } from '../button/button';
import { AndesPopconfirmTrigger } from '../popover/popover-trigger';
import { ANDES_POPOVER_PRESET_COLORS } from '../popover/popover-types';
import { AndesPopconfirm } from './popconfirm';

const MOTION_CSS = `
.story-confirm-motion-off { --andes-popover-duration: 0ms; --andes-popover-exit-duration: 0ms; --andes-popover-distance: 0px; --andes-popover-scale: 1; }
`;

/** Questions that open and close in quick succession, to watch for flicker. */
@Component({
  selector: 'andes-popconfirm-rapid-demo',
  imports: [AndesButton, AndesPopconfirm, AndesPopconfirmTrigger],
  template: `
    <div style="${stage} flex-direction: column; padding-top: 9rem;">
      <div style="${bar}">
        <andes-button (click)="replay()">Replay</andes-button>
        <andes-button variant="outline" (click)="flip()">Flip all</andes-button>
      </div>
      <div style="${bar}">
        @for (index of indexes; track index) {
          <andes-popconfirm
            [open]="states()[index]"
            [trigger]="['hover']"
            [openDelay]="0"
            [closeDelay]="0"
            [closeOnOutsideClick]="false"
            [title]="'Question ' + (index + 1)"
            [showCancel]="false"
            okText="OK"
            (openChange)="set(index, $event)"
          >
            <andes-button variant="outline" andesPopconfirmTrigger
              >Question {{ index + 1 }}</andes-button
            >
          </andes-popconfirm>
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

  protected replay(): void {
    for (let step = 0; step < 12; step++) {
      setTimeout(() => this.flip(), step * 90);
    }
  }
}

/** An asynchronous confirmation under a right-to-left document. */
@Component({
  selector: 'andes-popconfirm-rtl-async',
  imports: [AndesButton, AndesPopconfirm, AndesPopconfirmTrigger],
  template: `
    <div style="${stage} flex-direction: column;">
      <andes-popconfirm
        title="هل تريد حفظ التغييرات؟"
        description="سيتم إرسال التغييرات إلى الخادم."
        okText="حفظ"
        cancelText="إلغاء"
        [onConfirm]="save"
      >
        <andes-button variant="outline" andesPopconfirmTrigger
          >حفظ</andes-button
        >
      </andes-popconfirm>
      <span role="status" style="${muted}">{{ status() }}</span>
    </div>
  `,
})
class RtlAsyncDemo {
  protected readonly status = signal('');
  protected readonly save = async () => {
    this.status.set('...جارٍ الحفظ');
    await new Promise((done) => setTimeout(done, 1200));
    this.status.set('تم الحفظ.');
  };
}

const meta: Meta<AndesPopconfirm> = {
  title: 'Feedback/Popconfirm/Accessibility and motion',
  component: AndesPopconfirm,
  decorators: [
    withDescription,
    withPopoverKit,
    moduleMetadata({
      imports: [AndesButton, NgIcon, AndesPopconfirmTrigger],
    }),
  ],
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<AndesPopconfirm>;

/** Keyboard. */
export const KeyboardOnly: Story = {
  name: 'Keyboard only',
  parameters: about(
    'Tab to the trigger and press Enter: focus lands on Cancel, Tab reaches OK, Enter answers, and focus returns to the trigger.',
  ),
  render: () => ({
    props: { muted },
    template: `
      <div style="${stage} flex-direction: column;">
        <andes-popconfirm title="Delete the task?" description="Focus starts on Cancel." okType="danger" okText="Delete">
          <andes-button variant="danger" andesPopconfirmTrigger>Delete</andes-button>
        </andes-popconfirm>
        <p [style]="muted + ' margin: 0;'">Tab, Enter, Tab, Enter.</p>
      </div>
    `,
  }),
};

/** Alert dialog. */
export const AlertDialogRole: Story = {
  name: 'Labelled alert dialog',
  parameters: about(
    'The panel is a non-modal alert dialog named by its question and described by its description, announced as soon as focus enters it.',
  ),
  render: () => ({
    template: `
      <div style="${stage}">
        <andes-popconfirm title="Delete the task?" description="This also removes its comments.">
          <andes-button variant="outline" andesPopconfirmTrigger>Delete</andes-button>
        </andes-popconfirm>
      </div>
    `,
  }),
};

/** Escape. */
export const EscapeCancels: Story = {
  name: 'Escape cancels',
  parameters: about(
    'Escape counts as Cancel: it fires the cancelled output and returns focus to the trigger, while a press outside only dismisses.',
  ),
  render: () => ({
    props: { status: { text: '' }, muted },
    template: `
      <div style="${stage} flex-direction: column;">
        <andes-popconfirm title="Discard the draft?" (cancelled)="status.text = 'Cancelled (Escape or Cancel)'" (confirm)="status.text = 'Confirmed'">
          <andes-button variant="outline" andesPopconfirmTrigger>Discard</andes-button>
        </andes-popconfirm>
        <span role="status" [style]="muted">{{ status.text }}</span>
      </div>
    `,
  }),
};

/** Safe default. */
export const SafeDefault: Story = {
  name: 'Safe default focus',
  parameters: about(
    'A destructive question starts on Cancel so a stray Enter keeps the data, while a routine question can start on OK.',
  ),
  render: () => ({
    template: `
      <div style="${wideStage}">
        <andes-popconfirm title="Delete the file?" okType="danger" okText="Delete">
          <andes-button variant="outline" andesPopconfirmTrigger>Destructive</andes-button>
        </andes-popconfirm>
        <andes-popconfirm title="Save the file?" initialFocus="ok" okText="Save">
          <andes-button variant="outline" andesPopconfirmTrigger>Routine</andes-button>
        </andes-popconfirm>
      </div>
    `,
  }),
};

/** Dark. */
export const DarkTheme: Story = {
  name: 'Dark theme',
  globals: { theme: 'dark' },
  parameters: about(
    'On the dark theme the surface, the warning icon, the muted description, the buttons and every colour preset keep a readable contrast.',
  ),
  render: () => ({
    props: { colours: ANDES_POPOVER_PRESET_COLORS },
    template: `
      <div style="${wideStage}">
        <andes-popconfirm title="Delete the task?" description="This cannot be undone." okType="danger" okText="Delete">
          <andes-button variant="outline" andesPopconfirmTrigger>Default</andes-button>
        </andes-popconfirm>
        @for (colour of colours; track colour) {
          <andes-popconfirm [color]="colour" [title]="colour" [okButtonProps]="{ variant: 'secondary' }" [cancelButtonProps]="{ variant: 'ghost' }">
            <andes-button variant="outline" size="sm" andesPopconfirmTrigger>{{ colour }}</andes-button>
          </andes-popconfirm>
        }
      </div>
    `,
  }),
};

/** RTL. */
export const RightToLeft: Story = {
  name: 'Right to left',
  parameters: {
    dir: 'rtl',
    ...about(
      'Under a right-to-left document the icon sits to the right of the text and the buttons gather at the left, the end edge in reading order, with start alignment following the reading direction.',
    ),
  },
  render: () => ({
    template: `
      <div dir="rtl" style="${stage}">
        <andes-popconfirm title="هل تريد حذف المهمة؟" description="لا يمكن التراجع عن هذا الإجراء." okText="حذف" cancelText="إلغاء" okType="danger">
          <andes-button variant="outline" andesPopconfirmTrigger>حذف</andes-button>
        </andes-popconfirm>
        <andes-popconfirm placement="bottomLeft" title="هل تريد المتابعة؟" okText="نعم" cancelText="لا">
          <andes-button variant="outline" andesPopconfirmTrigger>بداية</andes-button>
        </andes-popconfirm>
      </div>
    `,
  }),
};

/** Narrow screens. */
export const NarrowScreens: Story = {
  name: 'Narrow screens',
  parameters: about(
    'A long question wraps inside the window minus a margin, and the buttons wrap under it instead of overflowing on a phone.',
  ),
  render: () => ({
    template: `
      <div style="${stage}">
        <andes-popconfirm title="Do you want to delete every task that was completed more than ninety days ago and everything attached to them?" description="Comments, files and the activity log of those tasks are removed with them." okType="danger" okText="Delete everything" cancelText="Keep my tasks">
          <andes-button variant="outline" andesPopconfirmTrigger>Clean up</andes-button>
        </andes-popconfirm>
      </div>
    `,
  }),
};

/** Rapid toggling. */
export const RapidToggling: Story = {
  name: 'Rapid opening and closing',
  parameters: about(
    'Replay flips three questions twelve times in a second and sweeping the pointer across the buttons opens and closes them at once, so any flicker from the shadow filter would show.',
  ),
  render: () => ({
    moduleMetadata: { imports: [RapidDemo] },
    template: `<andes-popconfirm-rapid-demo />`,
  }),
};

/** Reduced motion. */
export const ReducedMotion: Story = {
  name: 'Reduced motion',
  parameters: about(
    'With the motion tokens off, which is what the panel resolves to when the system asks for reduced motion apart from a short fade, the question appears without drift or scale.',
  ),
  render: () => {
    addStoryCss('story-popconfirm-motion-css', MOTION_CSS);
    return {
      template: `
        <div style="${wideStage}">
          <andes-popconfirm trigger="hover" title="Normal motion" [showCancel]="false" okText="OK">
            <andes-button variant="outline" andesPopconfirmTrigger>Normal</andes-button>
          </andes-popconfirm>
          <andes-popconfirm trigger="hover" panelClass="story-confirm-motion-off" title="No motion" [showCancel]="false" okText="OK">
            <andes-button variant="outline" andesPopconfirmTrigger>Tokens off</andes-button>
          </andes-popconfirm>
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
            <andes-popconfirm [placement]="placement" ${OPEN_FOR_GOOD} [title]="placement" [showCancel]="false" okText="OK">
              <andes-button size="sm" variant="outline" andesPopconfirmTrigger>{{ placement }}</andes-button>
            </andes-popconfirm>
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
            <andes-popconfirm [placement]="placement" ${OPEN_FOR_GOOD} [title]="placement" [showCancel]="false" okText="OK">
              <andes-button size="sm" variant="outline" andesPopconfirmTrigger>{{ placement }}</andes-button>
            </andes-popconfirm>
          </div>
        }
      </div>
    `,
  }),
};

/** RTL async. */
export const RtlAsyncConfirm: Story = {
  name: 'Right to left, async confirm',
  parameters: {
    dir: 'rtl',
    ...about(
      'Under a right-to-left document an asynchronous confirmation keeps its spinner on the OK button and closes when the request ends, with the icon, the text and the buttons mirrored.',
    ),
  },
  render: () => ({
    moduleMetadata: {
      imports: [RtlAsyncDemo],
      providers: [
        { provide: ErrorHandler, useValue: { handleError: () => undefined } },
      ],
    },
    template: `<andes-popconfirm-rtl-async />`,
  }),
};
