import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';

import {
  AndesTableSelectionDemo,
  AndesTableSelectionMenuDemo,
  AndesTableExpandDemo,
  AndesTableTreeDemo,
  AndesTableNestedDemo,
  AndesTableEditableDemo,
  AndesTableDragDemo,
} from './table.stories';

const meta: Meta = {
  title: 'Data Display/Table/Features/Rows',
  decorators: [
    moduleMetadata({
      imports: [
        AndesTableSelectionDemo,
        AndesTableSelectionMenuDemo,
        AndesTableExpandDemo,
        AndesTableTreeDemo,
        AndesTableNestedDemo,
        AndesTableEditableDemo,
        AndesTableDragDemo,
      ],
    }),
  ],
};

export default meta;

type Story = StoryObj;

/**
 * Row selection. The first table selects with checkboxes, the second is a single choice with radio buttons (`type="radio"`), and the third adds a selection menu with presets next to the select-all checkbox.
 */
export const Selection: Story = {
  parameters: { docs: { source: { type: 'code' } } },
  render: () => ({
    template: `
      <div style="display: grid; gap: 3rem;">
        <andes-table-selection-demo />
        <andes-table-selection-demo type="radio" />
        <andes-table-selection-menu-demo />
      </div>
    `,
  }),
};

/**
 * Expandable rows. The first table opens a row with the toggle button; the second opens it with a click anywhere on the row (`byClick`).
 */
export const ExpandableRows: Story = {
  parameters: { docs: { source: { type: 'code' } } },
  render: () => ({
    template: `
      <div style="display: grid; gap: 3rem;">
        <andes-table-expand-demo />
        <andes-table-expand-demo [byClick]="true" />
      </div>
    `,
  }),
};

/** Hierarchical rows that open and close, with indentation per level. */
export const TreeData: Story = {
  parameters: { docs: { source: { type: 'code' } } },
  render: () => ({ template: `<andes-table-tree-demo />` }),
};

/** A table inside an expanded row. */
export const NestedTables: Story = {
  parameters: { docs: { source: { type: 'code' } } },
  render: () => ({ template: `<andes-table-nested-demo />` }),
};

/** Cells that turn into fields while a row is edited. */
export const EditableRows: Story = {
  parameters: { docs: { source: { type: 'code' } } },
  render: () => ({ template: `<andes-table-editable-demo />` }),
};

/** Rows reordered by dragging a handle. */
export const DragToReorder: Story = {
  parameters: { docs: { source: { type: 'code' } } },
  render: () => ({ template: `<andes-table-drag-demo />` }),
};
