import { signal } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';

import {
  about,
  column,
  muted,
  PLACEMENTS,
  remember,
  stage,
  withDescription,
  withPopoverKit,
} from '../../testing/popover-story-kit';
import { AndesButton } from '../button/button';
import { AndesPopconfirmTrigger } from '../popover/popover-trigger';
import { ANDES_POPOVER_PRESET_COLORS } from '../popover/popover-types';
import { AndesPopconfirm } from './popconfirm';

const imports = [AndesButton, NgIcon, AndesPopconfirmTrigger];

const meta: Meta<AndesPopconfirm> = {
  title: 'Feedback/Popconfirm/Overview',
  component: AndesPopconfirm,
  tags: ['autodocs'],
  decorators: [withDescription, withPopoverKit, moduleMetadata({ imports })],
  parameters: { layout: 'padded' },
  argTypes: {
    title: { control: 'text' },
    description: { control: 'text' },
    okText: { control: 'text' },
    cancelText: { control: 'text' },
    okType: {
      control: 'select',
      options: ['primary', 'secondary', 'danger', 'outline', 'dashed', 'ghost'],
    },
    cancelType: {
      control: 'select',
      options: ['primary', 'secondary', 'danger', 'outline', 'dashed', 'ghost'],
    },
    placement: { control: 'select', options: [undefined, ...PLACEMENTS] },
    trigger: {
      control: 'select',
      options: ['click', 'hover', 'focus', 'contextMenu'],
    },
    color: {
      control: 'select',
      options: [undefined, ...ANDES_POPOVER_PRESET_COLORS],
    },
    initialFocus: { control: 'select', options: ['cancel', 'ok'] },
    icon: { control: false },
    onConfirm: { control: false },
    onCancel: { control: false },
    okButtonProps: { control: false },
    cancelButtonProps: { control: false },
    classNames: { control: false },
    styles: { control: false },
    container: { control: false },
    open: { control: false },
  },
  args: {
    title: 'Delete the task',
    description: 'Are you sure you want to delete this task?',
    okText: 'OK',
    cancelText: 'Cancel',
    okType: 'primary',
    cancelType: 'outline',
    okDisabled: false,
    okLoading: false,
    showCancel: true,
    showArrow: true,
    disabled: false,
    placement: undefined,
    trigger: 'click',
    initialFocus: 'cancel',
    closeOnEscape: true,
    closeOnOutsideClick: true,
  },
  render: (args) => ({
    props: { ...args, result: signal(''), muted },
    template: `
      <div style="${column} align-items: center; padding: 8rem 4rem 3rem;">
        <andes-popconfirm
          [title]="title"
          [description]="description"
          [okText]="okText"
          [cancelText]="cancelText"
          [okType]="okType"
          [cancelType]="cancelType"
          [okDisabled]="okDisabled"
          [okLoading]="okLoading"
          [showCancel]="showCancel"
          [showArrow]="showArrow"
          [disabled]="disabled"
          [placement]="placement"
          [trigger]="trigger"
          [color]="color"
          [initialFocus]="initialFocus"
          [closeOnEscape]="closeOnEscape"
          [closeOnOutsideClick]="closeOnOutsideClick"
          (confirm)="result.set('Confirmed')"
          (cancelled)="result.set('Cancelled')"
        >
          <andes-button variant="danger" andesPopconfirmTrigger>Delete</andes-button>
        </andes-popconfirm>
        <span role="status" [style]="muted">{{ result() }}</span>
      </div>
    `,
  }),
};

export default meta;

type Story = StoryObj<AndesPopconfirm>;

/** Every input of the popconfirm, driven from the controls panel. */
export const Playground: Story = {
  name: 'Playground',
  parameters: about(
    'Change the texts, the button types, the placement, the trigger and the focus rule in the controls panel, then press Delete.',
  ),
};

/** The shortest form. */
export const Basic: Story = {
  name: 'Basic',
  parameters: about(
    'A question and the two answers: the trigger opens a small panel with a title, Cancel and OK, and either button closes it.',
  ),
  render: () => ({
    template: `
      <div style="${stage}">
        <andes-popconfirm title="Are you sure?">
          <andes-button variant="outline" andesPopconfirmTrigger>Archive</andes-button>
        </andes-popconfirm>
      </div>
    `,
  }),
};

/** With a description. */
export const WithDescription: Story = {
  name: 'Title and description',
  parameters: about(
    'A description under the question says what will happen, in the 13px muted text, and the panel is described by it for screen readers.',
  ),
  render: () => ({
    template: `
      <div style="${stage}">
        <andes-popconfirm title="Archive this project?" description="It will be hidden from the sidebar but kept for 30 days.">
          <andes-button variant="outline" andesPopconfirmTrigger>Archive project</andes-button>
        </andes-popconfirm>
      </div>
    `,
  }),
};

/** Destructive. */
export const Destructive: Story = {
  name: 'Destructive action',
  parameters: about(
    'A destructive action pairs a danger trigger with a danger OK button and names the action in the label.',
  ),
  render: () => ({
    template: `
      <div style="${stage}">
        <andes-popconfirm title="Delete the task" description="This cannot be undone." okType="danger" okText="Delete">
          <andes-button variant="danger" andesPopconfirmTrigger>Delete</andes-button>
        </andes-popconfirm>
      </div>
    `,
  }),
};

/** Events. */
export const Events: Story = {
  name: 'Confirm and cancel events',
  parameters: about(
    'confirm fires for OK and cancelled fires for Cancel and for Escape, so the page can tell a yes from a no; an outside press fires neither.',
  ),
  render: () => {
    const log = signal<string[]>([]);
    return {
      props: {
        log,
        muted,
        record: (entry: string) => remember(log, entry),
      },
      template: `
        <div style="${column} align-items: center; padding: 7rem 1rem 1rem;">
          <andes-popconfirm title="Send the report?" (confirm)="record('confirm')" (cancelled)="record('cancelled')">
            <andes-button variant="outline" andesPopconfirmTrigger>Send report</andes-button>
          </andes-popconfirm>
          <ol aria-label="Events" [style]="muted + ' margin: 0; min-height: 5.5rem;'">
            @for (entry of log(); track $index) { <li>{{ entry }}</li> }
          </ol>
        </div>
      `,
    };
  },
};
