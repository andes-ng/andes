import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideAlignCenter,
  lucideAlignLeft,
  lucideAlignRight,
  lucideBold,
  lucideItalic,
  lucideUnderline,
} from '@ng-icons/lucide';
import { type Meta, moduleMetadata, type StoryObj } from '@storybook/angular';

import { AndesToggle } from './toggle';
import { AndesToggleGroup } from './toggle-group';

const bold = `<ng-icon name="lucideBold" aria-hidden="true" />`;

const italic = `<ng-icon name="lucideItalic" aria-hidden="true" />`;

const underline = `<ng-icon name="lucideUnderline" aria-hidden="true" />`;

const left = `<ng-icon name="lucideAlignLeft" aria-hidden="true" />`;

const center = `<ng-icon name="lucideAlignCenter" aria-hidden="true" />`;

const right = `<ng-icon name="lucideAlignRight" aria-hidden="true" />`;

const meta: Meta<AndesToggleGroup> = {
  title: 'Data Entry/Toggle/Group/ToggleGroup',
  component: AndesToggleGroup,
  decorators: [
    moduleMetadata({
      imports: [NgIcon],
      providers: [
        provideIcons({
          lucideAlignCenter,
          lucideAlignLeft,
          lucideAlignRight,
          lucideBold,
          lucideItalic,
          lucideUnderline,
        }),
      ],
    }),
  ],
};

export default meta;

type Story = StoryObj<AndesToggleGroup>;

/**
 * Single type: at most one pressed; pressing it again clears the value. The second group sets
 * `allowEmpty` to false, so one option always stays pressed.
 */
export const Single: Story = {
  render: () => ({
    moduleMetadata: { imports: [AndesToggle, AndesToggleGroup] },
    props: { align: 'center', view: 'list' },
    template: `
      <div style="display: flex; flex-direction: column; gap: 0.75rem; align-items: flex-start;">
        <andes-toggle-group aria-label="Text alignment" type="single" [(value)]="align">
          <andes-toggle value="left" aria-label="Align left">${left}</andes-toggle>
          <andes-toggle value="center" aria-label="Align center">${center}</andes-toggle>
          <andes-toggle value="right" aria-label="Align right">${right}</andes-toggle>
        </andes-toggle-group>
        <span style="font-size: 0.75rem; line-height: 1.25rem;">value: {{ align ?? 'none' }}</span>
        <andes-toggle-group aria-label="View" variant="outline" [allowEmpty]="false" [(value)]="view">
          <andes-toggle value="list">List</andes-toggle>
          <andes-toggle value="board">Board</andes-toggle>
          <andes-toggle value="calendar">Calendar</andes-toggle>
        </andes-toggle-group>
      </div>
    `,
  }),
};

/** Multiple type: `value` is an array, here bound two-way and through a `FormControl`. */
export const Multiple: Story = {
  render: () => ({
    moduleMetadata: {
      imports: [AndesToggle, AndesToggleGroup, ReactiveFormsModule],
    },
    props: {
      formats: ['bold', 'underline'],
      control: new FormControl(['mon', 'wed']),
    },
    template: `
      <div style="display: flex; flex-direction: column; gap: 0.75rem; align-items: flex-start;">
        <andes-toggle-group aria-label="Text formatting" type="multiple" variant="outline" [(value)]="formats">
          <andes-toggle value="bold" aria-label="Bold">${bold}</andes-toggle>
          <andes-toggle value="italic" aria-label="Italic">${italic}</andes-toggle>
          <andes-toggle value="underline" aria-label="Underline">${underline}</andes-toggle>
        </andes-toggle-group>
        <span style="font-size: 0.75rem; line-height: 1.25rem;">value: {{ formats.join(', ') || 'none' }}</span>
        <andes-toggle-group aria-label="Days" type="multiple" variant="outline" [formControl]="control">
          <andes-toggle value="mon">Mon</andes-toggle>
          <andes-toggle value="tue">Tue</andes-toggle>
          <andes-toggle value="wed">Wed</andes-toggle>
          <andes-toggle value="thu">Thu</andes-toggle>
          <andes-toggle value="fri">Fri</andes-toggle>
        </andes-toggle-group>
        <span style="font-size: 0.75rem; line-height: 1.25rem;">Control value: {{ control.value }}</span>
      </div>
    `,
  }),
};

/**
 * Appearance: the default variant, `spacing` (separates the buttons instead of joining them),
 * a vertical group, and the three sizes.
 */
export const Appearance: Story = {
  render: () => ({
    moduleMetadata: { imports: [AndesToggle, AndesToggleGroup] },
    template: `
      <div style="display: flex; flex-direction: column; gap: 1rem; align-items: flex-start;">
        <andes-toggle-group aria-label="Text formatting" type="multiple">
          <andes-toggle value="bold" aria-label="Bold">${bold}</andes-toggle>
          <andes-toggle value="italic" aria-label="Italic">${italic}</andes-toggle>
          <andes-toggle value="underline" aria-label="Underline">${underline}</andes-toggle>
        </andes-toggle-group>
        <andes-toggle-group aria-label="Quick filters" type="multiple" variant="outline" [spacing]="8" [value]="['open']">
          <andes-toggle value="open">Open</andes-toggle>
          <andes-toggle value="mine">Assigned to me</andes-toggle>
          <andes-toggle value="late">Overdue</andes-toggle>
        </andes-toggle-group>
        <andes-toggle-group aria-label="Alignment" variant="outline" orientation="vertical" value="center">
          <andes-toggle value="left" aria-label="Align left">${left}</andes-toggle>
          <andes-toggle value="center" aria-label="Align center">${center}</andes-toggle>
          <andes-toggle value="right" aria-label="Align right">${right}</andes-toggle>
        </andes-toggle-group>
        <andes-toggle-group aria-label="Small" variant="outline" size="sm" value="b"><andes-toggle value="a">A</andes-toggle><andes-toggle value="b">B</andes-toggle><andes-toggle value="c">C</andes-toggle></andes-toggle-group>
        <andes-toggle-group aria-label="Medium" variant="outline" size="md" value="b"><andes-toggle value="a">A</andes-toggle><andes-toggle value="b">B</andes-toggle><andes-toggle value="c">C</andes-toggle></andes-toggle-group>
        <andes-toggle-group aria-label="Large" variant="outline" size="lg" value="b"><andes-toggle value="a">A</andes-toggle><andes-toggle value="b">B</andes-toggle><andes-toggle value="c">C</andes-toggle></andes-toggle-group>
      </div>
    `,
  }),
};

/** A disabled group, and one disabled toggle inside an enabled group. */
export const Disabled: Story = {
  render: () => ({
    moduleMetadata: { imports: [AndesToggle, AndesToggleGroup] },
    template: `
      <div style="display: flex; flex-direction: column; gap: 0.75rem; align-items: flex-start;">
        <andes-toggle-group aria-label="Disabled group" variant="outline" disabled value="b"><andes-toggle value="a">A</andes-toggle><andes-toggle value="b">B</andes-toggle></andes-toggle-group>
        <andes-toggle-group aria-label="One disabled" variant="outline" value="a"><andes-toggle value="a">A</andes-toggle><andes-toggle value="b" disabled>B</andes-toggle><andes-toggle value="c">C</andes-toggle></andes-toggle-group>
      </div>
    `,
  }),
};
