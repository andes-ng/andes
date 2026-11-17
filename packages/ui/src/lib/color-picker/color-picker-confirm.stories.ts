import type { Meta, StoryObj } from '@storybook/angular';

import { AndesColorPicker } from './color-picker';
import { AndesColorPickerPanel } from './color-picker-panel';

const IMPORTS = [AndesColorPicker, AndesColorPickerPanel];

const meta: Meta<AndesColorPicker> = {
  title: 'Data Entry/Color Picker/Confirm and slots',
  component: AndesColorPicker,
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<AndesColorPicker>;

/**
 * `confirm`: edits are staged. Apply commits them (the value, the form and
 * `colorChangeComplete` follow, and the popup closes); Cancel, Escape or clicking away
 * throws them away. The inline panel shows the same buttons and reports `applied` /
 * `cancelled`; Escape inside it cancels too.
 */
export const Confirm: Story = {
  render: () => ({
    moduleMetadata: { imports: IMPORTS },
    props: { staged: '#1677ff', inlineStaged: '#52c41a', log: [] as string[] },
    template: `
      <div style="display: flex; flex-wrap: wrap; gap: 1.5rem 20rem; align-items: flex-start;">
        <div style="display: flex; flex-direction: column; gap: 0.5rem; align-items: flex-start;">
          <andes-color-picker
            aria-label="Staged color"
            confirm
            [(value)]="staged"
            showText
            [labels]="{ apply: 'OK' }"
            (applied)="log = ['applied ' + $event, ...log].slice(0, 4)"
            (cancelled)="log = ['cancelled', ...log].slice(0, 4)"
          />
          <code style="font-size: 0.75rem;">value: {{ staged }}</code>
        </div>
        <div style="display: flex; flex-direction: column; gap: 0.5rem;">
          <andes-color-picker-panel
            aria-label="Inline staged color"
            confirm
            [(value)]="inlineStaged"
            (applied)="log = ['inline applied ' + $event, ...log].slice(0, 4)"
            (cancelled)="log = ['inline cancelled', ...log].slice(0, 4)"
          />
          <code style="font-size: 0.75rem;">value: {{ inlineStaged }}</code>
        </div>
        <code style="font-size: 0.75rem; white-space: pre;">{{ log.join('\\n') }}</code>
      </div>
    `,
  }),
};

/**
 * Content marked `slot="panel-header"` and `slot="panel-footer"` is shown above and below
 * the controls, in the popup and inline alike; the footer shares its row with the confirm
 * buttons.
 */
export const HeaderAndFooter: Story = {
  render: () => ({
    moduleMetadata: { imports: IMPORTS },
    props: { slotted: '#eb2f96' },
    template: `
      <div style="display: flex; flex-wrap: wrap; gap: 1.5rem 20rem; align-items: flex-start;">
        <andes-color-picker aria-label="Highlight" [(value)]="slotted" showText confirm arrow>
          <strong slot="panel-header" style="font-size: 0.875rem;">Highlight color</strong>
          <button slot="panel-footer" type="button" (click)="slotted = '#eb2f96'">Reset</button>
        </andes-color-picker>
        <andes-color-picker-panel aria-label="Annotation" value="#fadb14">
          <div slot="panel-header" style="display: flex; justify-content: space-between; font-size: 0.875rem;">
            <strong>Annotation</strong><span style="opacity: 0.7;">Layer 2</span>
          </div>
          <span slot="panel-footer" style="font-size: 0.75rem; opacity: 0.7;">Used by 3 shapes</span>
        </andes-color-picker-panel>
      </div>
    `,
  }),
};
