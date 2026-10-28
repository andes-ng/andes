import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';

import {
  AndesTableResizeDemo,
  AndesTableColumnsDemo,
  AndesTableColumnSettingsDemo,
} from './table.stories';

const meta: Meta = {
  title: 'Data Display/Table/Columns/Settings',
  decorators: [
    moduleMetadata({
      imports: [
        AndesTableResizeDemo,
        AndesTableColumnsDemo,
        AndesTableColumnSettingsDemo,
      ],
    }),
  ],
};

export default meta;

type Story = StoryObj;

/** Drag the edge of a header to resize its column. */
export const ResizableColumns: Story = {
  parameters: { docs: { source: { type: 'code' } } },
  render: () => ({ template: `<andes-table-resize-demo />` }),
};

/**
 * Showing and hiding columns. The first table uses a checkbox menu; the second uses the column settings control, which also resizes and reorders.
 */
export const ColumnVisibility: Story = {
  parameters: { docs: { source: { type: 'code' } } },
  render: () => ({
    template: `
      <div style="display: grid; gap: 3rem;">
        <andes-table-columns-demo />
        <andes-table-column-settings-demo />
      </div>
    `,
  }),
};
