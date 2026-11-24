import { type Decorator, type Meta, type StoryObj } from '@storybook/angular';

import {
  SAMPLE_DEPARTMENT_COLORS,
  SAMPLE_ORG,
  type SamplePerson,
  withoutPhotos,
} from '../../../testing/org-chart-sample';
import {
  ORG_CHART_DECORATOR,
  ORG_CHART_PARAMETERS,
} from '../../../testing/org-chart-story-kit';
import { AndesOrgChart } from '../org-chart';

/** The sample company with every person colored by department. */
function byDepartment(node: SamplePerson): SamplePerson {
  return {
    ...node,
    color: SAMPLE_DEPARTMENT_COLORS[node.department ?? ''] ?? undefined,
    children: node.children?.map(byDepartment),
  };
}

function globalStyles(id: string, css: string): Decorator {
  return (story) => {
    if (!document.getElementById(id)) {
      const style = document.createElement('style');
      style.id = id;
      style.textContent = css;
      document.head.append(style);
    }
    return story();
  };
}

const meta: Meta<AndesOrgChart> = {
  title: 'Data Display/Org Chart/Customization/Colors',
  component: AndesOrgChart,
  parameters: ORG_CHART_PARAMETERS,
  decorators: [ORG_CHART_DECORATOR],
};

export default meta;

type Story = StoryObj<AndesOrgChart>;

/** A person's `color` field tints the initials: here every person is colored by department. */
export const ByDepartment: Story = {
  render: () => ({
    props: { byDepartment: withoutPhotos(byDepartment(SAMPLE_ORG)) },
    template: `
      <andes-org-chart
        aria-label="Organization colored by department"
        style="--andes-org-chart-height: 28rem"
        [data]="byDepartment"
        [defaultExpandDepth]="1"
      />
    `,
  }),
};

/** `levelColors` colors by depth instead, cycling through the list. */
export const ByLevel: Story = {
  render: () => ({
    props: {
      plain: withoutPhotos(SAMPLE_ORG),
      levels: ['#64748b', '#2563eb', '#0d9488', '#9333ea'],
    },
    template: `
      <andes-org-chart
        aria-label="Organization colored by level"
        style="--andes-org-chart-height: 28rem"
        [data]="plain"
        [levelColors]="levels"
        [defaultExpandDepth]="2"
      />
    `,
  }),
};

/**
 * `nodeClass` adds classes per person; here the leadership cards get a slightly raised background
 * through a custom property.
 */
export const NodeClasses: Story = {
  decorators: [
    globalStyles(
      'org-chart-story-colors',
      '.story-leadership { --andes-org-chart-node-background: color-mix(in srgb, var(--andes-color-foreground) 4%, var(--andes-color-card)); }',
    ),
  ],
  render: () => ({
    props: {
      data: SAMPLE_ORG,
      nodeClass: (person: SamplePerson) =>
        person.id === 'ceo' || person.title.startsWith('Chief')
          ? 'story-leadership'
          : null,
    },
    template: `
      <andes-org-chart
        aria-label="Company organization"
        style="--andes-org-chart-height: 28rem"
        [data]="data"
        [nodeClass]="nodeClass"
        [defaultExpandDepth]="1"
      />
    `,
  }),
};
