import { type Meta, type StoryObj } from '@storybook/angular';

import { sampleRows } from '../../../testing/org-chart-sample';
import {
  ORG_CHART_DECORATOR,
  ORG_CHART_PARAMETERS,
} from '../../../testing/org-chart-story-kit';
import { AndesOrgChart } from '../org-chart';

const meta: Meta<AndesOrgChart> = {
  title: 'Data Display/Org Chart/Basics/Flat data',
  component: AndesOrgChart,
  parameters: ORG_CHART_PARAMETERS,
  decorators: [ORG_CHART_DECORATOR],
};

export default meta;

type Story = StoryObj<AndesOrgChart>;

/**
 * Flat rows: `dataFormat="flat"` reads `{ id, parentId }` rows directly, so a table from a
 * database needs no nesting. Without photos the cards show initials.
 */
export const Rows: Story = {
  render: () => ({
    props: { rows: sampleRows() },
    template: `
      <andes-org-chart
        aria-label="Company organization"
        style="--andes-org-chart-height: 30rem"
        dataFormat="flat"
        [data]="rows"
        [defaultExpandDepth]="1"
      />
    `,
  }),
};

/** `fieldNames` maps any other field names (here `key`, `manager`, `fullName` and `role`). */
export const CustomFieldNames: Story = {
  render: () => ({
    props: {
      rows: sampleRows().map((row) => ({
        key: row.id,
        manager: row.parentId,
        fullName: row.name,
        role: row.title,
      })),
      fieldNames: {
        id: 'key',
        parentId: 'manager',
        name: 'fullName',
        title: 'role',
      },
    },
    template: `
      <andes-org-chart
        aria-label="Company organization"
        style="--andes-org-chart-height: 30rem"
        dataFormat="flat"
        [data]="rows"
        [fieldNames]="fieldNames"
        [defaultExpandDepth]="1"
      />
    `,
  }),
};

/** Several roots: pass an array and every root is drawn side by side. */
export const SeveralRoots: Story = {
  render: () => ({
    props: {
      data: [
        {
          id: 'north',
          name: 'Ingrid Solberg',
          title: 'Director, North',
          children: [
            { id: 'n1', name: 'Mats Lund', title: 'Sales Lead' },
            { id: 'n2', name: 'Freja Berg', title: 'Account Manager' },
          ],
        },
        {
          id: 'south',
          name: 'Carlos Ibáñez',
          title: 'Director, South',
          children: [
            { id: 's1', name: 'Marta Vidal', title: 'Sales Lead' },
            { id: 's2', name: 'Pablo Cruz', title: 'Account Manager' },
          ],
        },
      ],
    },
    template: `
      <andes-org-chart
        aria-label="Regional directors"
        style="--andes-org-chart-height: 22rem"
        [data]="data"
      />
    `,
  }),
};
