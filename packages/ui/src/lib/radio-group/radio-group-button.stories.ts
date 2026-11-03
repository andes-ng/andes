import type { Meta, StoryObj } from '@storybook/angular';

import { AndesRadio } from './radio';
import { AndesRadioGroup } from './radio-group';

const meta: Meta<AndesRadioGroup> = {
  title: 'Data Entry/RadioGroup/Specialized/Button',
  component: AndesRadioGroup,
};

export default meta;

type Story = StoryObj<AndesRadioGroup>;

/**
 * `optionType="button"` turns the items into a segmented control. Arrow keys still move focus
 * AND selection (native radio behavior). Shown: the outline and solid styles, a vertical group,
 * and a disabled item and a disabled group. Selecting a segment fades its fill, border and text
 * over 0.2s, and every click on an enabled segment - the selected one included - sends a soft
 * ring out of it (solid segments lighten on hover, outline ones tint their text).
 */
export const ButtonStyles: Story = {
  render: () => ({
    moduleMetadata: { imports: [AndesRadio] },
    template: `
      <div style="display: flex; flex-direction: column; gap: 1rem; align-items: flex-start;">
        <andes-radio-group aria-label="Plan (outline)" optionType="button">
          <andes-radio value="starter">Starter</andes-radio>
          <andes-radio value="pro">Pro</andes-radio>
          <andes-radio value="enterprise">Enterprise</andes-radio>
        </andes-radio-group>
        <andes-radio-group aria-label="Plan (solid)" optionType="button" buttonStyle="solid" value="pro">
          <andes-radio value="starter">Starter</andes-radio>
          <andes-radio value="pro">Pro</andes-radio>
          <andes-radio value="enterprise">Enterprise</andes-radio>
        </andes-radio-group>
        <andes-radio-group aria-label="Plan (vertical)" optionType="button" orientation="vertical">
          <andes-radio value="starter">Starter</andes-radio>
          <andes-radio value="pro">Pro</andes-radio>
          <andes-radio value="enterprise">Enterprise</andes-radio>
        </andes-radio-group>
        <andes-radio-group aria-label="City (outline, one disabled)" optionType="button" value="lima">
          <andes-radio value="lima">Lima</andes-radio>
          <andes-radio value="cusco" disabled>Cusco</andes-radio>
          <andes-radio value="arequipa">Arequipa</andes-radio>
        </andes-radio-group>
        <andes-radio-group aria-label="City (solid, disabled group)" optionType="button" buttonStyle="solid" value="lima" disabled>
          <andes-radio value="lima">Lima</andes-radio>
          <andes-radio value="cusco">Cusco</andes-radio>
          <andes-radio value="arequipa">Arequipa</andes-radio>
        </andes-radio-group>
      </div>
    `,
  }),
};

export const ButtonSizes: Story = {
  render: () => ({
    moduleMetadata: { imports: [AndesRadio] },
    template: `
      <div style="display: flex; flex-direction: column; gap: 1rem; align-items: flex-start;">
        @for (row of [['sm', 'Small'], ['md', 'Medium'], ['lg', 'Large']]; track row[0]) {
          <andes-radio-group [attr.aria-label]="row[1]" optionType="button" [size]="$any(row[0])" value="b">
            <andes-radio value="a">Daily</andes-radio>
            <andes-radio value="b">Weekly</andes-radio>
            <andes-radio value="c">Monthly</andes-radio>
          </andes-radio-group>
        }
      </div>
    `,
  }),
};

/** `block` stretches a button group to its container, sharing the width equally. */
export const Block: Story = {
  render: () => ({
    moduleMetadata: { imports: [AndesRadio] },
    template: `
      <div style="width: 28rem; display: flex; flex-direction: column; gap: 1rem;">
        <andes-radio-group aria-label="View (outline)" optionType="button" block value="list">
          <andes-radio value="list">List</andes-radio>
          <andes-radio value="board">Board</andes-radio>
          <andes-radio value="calendar">Calendar</andes-radio>
        </andes-radio-group>
        <andes-radio-group aria-label="View (solid)" optionType="button" buttonStyle="solid" block value="board">
          <andes-radio value="list">List</andes-radio>
          <andes-radio value="board">Board</andes-radio>
          <andes-radio value="calendar">Calendar</andes-radio>
        </andes-radio-group>
      </div>
    `,
  }),
};
