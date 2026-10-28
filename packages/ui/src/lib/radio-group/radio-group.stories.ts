import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import type { Meta, StoryObj } from '@storybook/angular';

import { AndesRadio } from './radio';
import { AndesRadioGroup } from './radio-group';

const meta: Meta<AndesRadioGroup> = {
  title: 'Data Entry/RadioGroup/Basics/Field',
  component: AndesRadioGroup,
  tags: ['autodocs'],
  argTypes: {
    name: { control: 'text' },
    disabled: { control: 'boolean' },
    required: { control: 'boolean' },
    orientation: {
      control: 'select',
      options: [undefined, 'vertical', 'horizontal'],
    },
    optionType: { control: 'inline-radio', options: ['default', 'button'] },
    buttonStyle: { control: 'inline-radio', options: ['outline', 'solid'] },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    block: { control: 'boolean' },
    labelPlacement: { control: 'inline-radio', options: ['end', 'start'] },
    selectionChange: { action: 'selectionChange' },
  },
  args: {
    disabled: false,
    required: false,
    optionType: 'default',
    buttonStyle: 'outline',
    size: 'md',
    block: false,
    labelPlacement: 'end',
  },
  render: (args) => ({
    moduleMetadata: { imports: [AndesRadio] },
    props: args,
    template: `
      <andes-radio-group aria-label="Plan" [name]="name" [disabled]="disabled" [required]="required" [orientation]="orientation" [optionType]="optionType" [buttonStyle]="buttonStyle" [size]="size" [block]="block" [labelPlacement]="labelPlacement" (selectionChange)="selectionChange($event)">
        <andes-radio value="starter">Starter</andes-radio>
        <andes-radio value="pro">Pro</andes-radio>
        <andes-radio value="enterprise">Enterprise</andes-radio>
      </andes-radio-group>
    `,
  }),
};

export default meta;

type Story = StoryObj<AndesRadioGroup>;

/** Playground: every input is a control. */
export const Default: Story = {};

const label =
  'margin: 0 0 0.5rem; font-family: var(--andes-font-family), sans-serif; font-size: 0.875rem; line-height: 1.375rem; color: var(--andes-color-foreground);';

/**
 * Layout of the classic radios: vertical (default), `orientation="horizontal"`, the label on
 * the other side with `labelPlacement="start"`, and `block`, which stretches the group to its
 * container and shares the width equally.
 */
export const Layouts: Story = {
  render: () => ({
    moduleMetadata: { imports: [AndesRadio] },
    props: { label },
    template: `
      <div style="display: flex; gap: 3rem; flex-wrap: wrap;">
        <div>
          <p [style]="label">Vertical</p>
          <andes-radio-group aria-label="Plan (vertical)">
            <andes-radio value="starter">Starter</andes-radio>
            <andes-radio value="pro">Pro</andes-radio>
            <andes-radio value="enterprise">Enterprise</andes-radio>
          </andes-radio-group>
        </div>
        <div>
          <p [style]="label">Horizontal</p>
          <andes-radio-group aria-label="Plan (horizontal)" orientation="horizontal">
            <andes-radio value="starter">Starter</andes-radio>
            <andes-radio value="pro">Pro</andes-radio>
            <andes-radio value="enterprise">Enterprise</andes-radio>
          </andes-radio-group>
        </div>
        <div>
          <p [style]="label">Label at the start</p>
          <andes-radio-group aria-label="Plan (label first)" labelPlacement="start">
            <andes-radio value="starter">Starter</andes-radio>
            <andes-radio value="pro">Pro</andes-radio>
            <andes-radio value="enterprise">Enterprise</andes-radio>
          </andes-radio-group>
        </div>
        <div style="width: 28rem;">
          <p [style]="label">Block</p>
          <andes-radio-group aria-label="View (classic)" orientation="horizontal" block value="list">
            <andes-radio value="list">List</andes-radio>
            <andes-radio value="board">Board</andes-radio>
            <andes-radio value="calendar">Calendar</andes-radio>
          </andes-radio-group>
        </div>
      </div>
    `,
  }),
};

/**
 * Group-level and item-level states: a disabled group, one disabled item, `required`, and
 * `aria-invalid`, which marks the radiogroup as failing validation and tints every item with the
 * danger color (shown for classic radios and for buttons).
 */
export const States: Story = {
  render: () => ({
    moduleMetadata: { imports: [AndesRadio] },
    props: { label },
    template: `
      <div style="display: flex; gap: 3rem; flex-wrap: wrap; align-items: flex-start;">
        <div>
          <p [style]="label">Disabled group</p>
          <andes-radio-group aria-label="Plan (disabled)" disabled>
            <andes-radio value="starter">Starter</andes-radio>
            <andes-radio value="pro">Pro</andes-radio>
          </andes-radio-group>
        </div>
        <div>
          <p [style]="label">One disabled item</p>
          <andes-radio-group aria-label="Plan (one item disabled)">
            <andes-radio value="starter">Starter</andes-radio>
            <andes-radio value="pro" disabled>Pro (sold out)</andes-radio>
            <andes-radio value="enterprise">Enterprise</andes-radio>
          </andes-radio-group>
        </div>
        <div>
          <p [style]="label">Required</p>
          <andes-radio-group aria-label="Plan (required)" required>
            <andes-radio value="starter">Starter</andes-radio>
            <andes-radio value="pro">Pro</andes-radio>
          </andes-radio-group>
        </div>
        <div>
          <p [style]="label">Invalid</p>
          <andes-radio-group aria-label="Plan (invalid)" aria-invalid="true" required>
            <andes-radio value="starter">Starter</andes-radio>
            <andes-radio value="pro">Pro</andes-radio>
            <andes-radio value="enterprise">Enterprise</andes-radio>
          </andes-radio-group>
        </div>
        <div>
          <p [style]="label">Invalid (buttons)</p>
          <andes-radio-group aria-label="Plan (buttons, invalid)" aria-invalid="true" optionType="button">
            <andes-radio value="starter">Starter</andes-radio>
            <andes-radio value="pro">Pro</andes-radio>
            <andes-radio value="enterprise">Enterprise</andes-radio>
          </andes-radio-group>
        </div>
      </div>
    `,
  }),
};

/** A preselected value with `[(ngModel)]`, a `FormControl`, and the `[(value)]` model. */
export const Binding: Story = {
  render: () => ({
    moduleMetadata: { imports: [AndesRadio, FormsModule, ReactiveFormsModule] },
    props: {
      label,
      modelPlan: 'pro',
      control: new FormControl('pro'),
      twoWayPlan: 'starter',
    },
    template: `
      <div style="display: flex; gap: 3rem; flex-wrap: wrap;">
        <div>
          <p [style]="label">ngModel: {{ modelPlan }}</p>
          <andes-radio-group aria-label="Plan (ngModel)" [(ngModel)]="modelPlan">
            <andes-radio value="starter">Starter</andes-radio>
            <andes-radio value="pro">Pro</andes-radio>
            <andes-radio value="enterprise">Enterprise</andes-radio>
          </andes-radio-group>
        </div>
        <div>
          <p [style]="label">Reactive form: {{ control.value }}</p>
          <andes-radio-group aria-label="Plan (reactive)" [formControl]="control">
            <andes-radio value="starter">Starter</andes-radio>
            <andes-radio value="pro">Pro</andes-radio>
            <andes-radio value="enterprise">Enterprise</andes-radio>
          </andes-radio-group>
        </div>
        <div>
          <p [style]="label">value: {{ twoWayPlan }}</p>
          <andes-radio-group aria-label="Plan (two-way)" [(value)]="twoWayPlan">
            <andes-radio value="starter">Starter</andes-radio>
            <andes-radio value="pro">Pro</andes-radio>
            <andes-radio value="enterprise">Enterprise</andes-radio>
          </andes-radio-group>
        </div>
      </div>
    `,
  }),
};
