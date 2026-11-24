import {
  type Decorator,
  type Meta,
  type StoryObj,
  moduleMetadata,
} from '@storybook/angular';

import { SAMPLE_ORG } from '../../../testing/org-chart-sample';
import {
  ORG_CHART_PARAMETERS,
  STORY_IMPORTS,
} from '../../../testing/org-chart-story-kit';
import { AndesOrgChart } from '../org-chart';
import type { AndesOrgChartConnectorInfo } from '../org-chart';
import { AndesOrgChartConnectorTemplate } from '../org-chart-templates';

/**
 * Adds page-level CSS for a story. Classes from `nodeClass` and `connectorClass` land inside the
 * chart's own view, so they are styled from a global stylesheet, the way an application would.
 */
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
  title: 'Data Display/Org Chart/Customization/Connectors',
  component: AndesOrgChart,
  parameters: ORG_CHART_PARAMETERS,
  decorators: [
    moduleMetadata({
      imports: [...STORY_IMPORTS, AndesOrgChartConnectorTemplate],
    }),
  ],
};

export default meta;

type Story = StoryObj<AndesOrgChart>;

/** `connectorClass` adds classes per link: here a dashed line to every assistant. */
export const LinkClasses: Story = {
  decorators: [
    globalStyles(
      'org-chart-story-connectors',
      '.story-assistant-link path { stroke-dasharray: 3 3; }',
    ),
  ],
  render: () => ({
    props: {
      data: SAMPLE_ORG,
      connectorClass: (link: AndesOrgChartConnectorInfo<unknown>) =>
        link.kind === 'assistant' ? 'story-assistant-link' : null,
    },
    template: `
      <andes-org-chart
        aria-label="Company organization, link classes"
        style="--andes-org-chart-height: 24rem"
        [data]="data"
        [connectorClass]="connectorClass"
        [defaultExpandDepth]="1"
      />
    `,
  }),
};

/**
 * `andesOrgChartConnector` replaces the drawing of every line (here with dotted curves). Its
 * content is SVG, so elements carry the `svg:` prefix.
 */
export const CustomDrawing: Story = {
  render: () => ({
    props: { data: SAMPLE_ORG },
    template: `
      <andes-org-chart
        aria-label="Company organization, custom connectors"
        style="--andes-org-chart-height: 24rem"
        connector="curved"
        [data]="data"
        [defaultExpandDepth]="1"
      >
        <ng-template andesOrgChartConnector let-d>
          <svg:path [attr.d]="d" fill="none" stroke="var(--andes-color-muted-foreground)" stroke-width="1.5" stroke-linecap="round" stroke-dasharray="0.1 4" />
        </ng-template>
      </andes-org-chart>
    `,
  }),
};
