import { signal } from '@angular/core';
import { type Meta, type StoryObj } from '@storybook/angular';

import {
  SAMPLE_ORG,
  type SamplePerson,
} from '../../../testing/org-chart-sample';
import {
  namesOf,
  ORG_CHART_DECORATOR,
  ORG_CHART_PARAMETERS,
  READOUT,
  STACK,
  updateNode,
} from '../../../testing/org-chart-story-kit';
import { AndesOrgChart } from '../org-chart';
import type { AndesOrgChartKey } from '../org-chart-layout';

const meta: Meta<AndesOrgChart> = {
  title: 'Data Display/Org Chart/Interaction/Selection',
  component: AndesOrgChart,
  parameters: ORG_CHART_PARAMETERS,
  decorators: [ORG_CHART_DECORATOR],
};

export default meta;

type Story = StoryObj<AndesOrgChart>;

/** `selectionMode="single"` (the default): a click or Enter / Space selects one person. */
export const Single: Story = {
  render: () => {
    const picked = signal<readonly AndesOrgChartKey[]>(['design']);
    return {
      props: { data: SAMPLE_ORG, picked, namesOf },
      template: `
        <div style="${STACK}">
          <span style="${READOUT}">Selected: {{ namesOf(picked()) || 'nobody' }}</span>
          <andes-org-chart
            aria-label="Company organization"
            style="--andes-org-chart-height: 30rem"
            selectionMode="single"
            [data]="data"
            [(selected)]="picked"
            [defaultExpandDepth]="1"
          />
        </div>
      `,
    };
  },
};

/**
 * `selectionMode="multiple"`: each click adds or removes a person. Disabled people
 * (`disabled: true`, here the finance team) cannot be selected; read-only people
 * (`readonly: true`, the chief of staff) can be focused but not selected.
 */
export const Multiple: Story = {
  render: () => {
    const picked = signal<readonly AndesOrgChartKey[]>(['cto', 'product']);
    const data = updateNode(
      updateNode(SAMPLE_ORG, 'cfo', (node) => ({
        ...node,
        disabled: true,
      })) as SamplePerson,
      'cos',
      (node) => ({ ...node, readonly: true }),
    );
    return {
      props: { org: data, picked, namesOf },
      template: `
        <div style="${STACK}">
          <span style="${READOUT}">Selected ({{ picked().length }}): {{ namesOf(picked()) || 'nobody' }}</span>
          <andes-org-chart
            aria-label="Company organization"
            style="--andes-org-chart-height: 30rem"
            selectionMode="multiple"
            [data]="org"
            [(selected)]="picked"
            [defaultExpandDepth]="1"
          />
        </div>
      `,
    };
  },
};

/**
 * `selectionMode="checkbox"`: checking a manager checks the whole team; a manager whose team is
 * partly checked shows a mixed box (and is announced as `aria-checked="mixed"`), and one whose
 * reports are all checked becomes checked. `partiallySelected` lists the mixed managers.
 */
export const Checkbox: Story = {
  render: () => {
    const picked = signal<readonly AndesOrgChartKey[]>([
      'platform',
      'designer1',
    ]);
    return {
      props: { data: SAMPLE_ORG, picked },
      template: `
        <div style="${STACK}">
          <span style="${READOUT}">Checked ({{ picked().length }}): {{ picked().join(', ') || 'none' }}</span>
          <span style="${READOUT}">Partly checked: {{ chart.partiallySelected().join(', ') || 'none' }}</span>
          <andes-org-chart
            #chart="andesOrgChart"
            aria-label="Company organization"
            style="--andes-org-chart-height: 34rem"
            selectionMode="checkbox"
            leafLayout="compact"
            [data]="data"
            [(selected)]="picked"
            [defaultExpandDepth]="3"
          />
        </div>
      `,
    };
  },
};

/** `selectionMode="none"`: cards are only read; Enter on a focused card opens or closes its team. */
export const None: Story = {
  render: () => ({
    props: { data: SAMPLE_ORG },
    template: `
      <andes-org-chart
        aria-label="Company organization"
        style="--andes-org-chart-height: 28rem"
        selectionMode="none"
        [data]="data"
        [defaultExpandDepth]="1"
      />
    `,
  }),
};
