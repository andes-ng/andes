import { NgIcon } from '@ng-icons/core';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';

import {
  about,
  muted,
  stage,
  withDescription,
  withPopoverKit,
  wideStage,
} from '../../testing/popover-story-kit';
import { AndesButton } from '../button/button';
import { AndesPopconfirmTrigger } from '../popover/popover-trigger';
import { ANDES_POPOVER_PRESET_COLORS } from '../popover/popover-types';
import { AndesPopconfirm } from './popconfirm';

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
