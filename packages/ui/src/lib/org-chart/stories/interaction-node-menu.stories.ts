import { signal } from '@angular/core';
import { type Meta, type StoryObj } from '@storybook/angular';

import {
  SAMPLE_ORG,
  type SamplePerson,
} from '../../../testing/org-chart-sample';
import {
  ORG_CHART_DECORATOR,
  ORG_CHART_PARAMETERS,
  READOUT,
  STACK,
} from '../../../testing/org-chart-story-kit';
import { AndesOrgChart } from '../org-chart';
import type {
  AndesOrgChartNodeActionEvent,
  AndesOrgChartNodeActions,
} from '../org-chart';

const meta: Meta<AndesOrgChart> = {
  title: 'Data Display/Org Chart/Interaction/Node menu',
  component: AndesOrgChart,
  parameters: ORG_CHART_PARAMETERS,
  decorators: [ORG_CHART_DECORATOR],
};

export default meta;

type Story = StoryObj<AndesOrgChart>;

/**
 * `nodeActions` gives a card a menu: right click it, or press the context menu key or Shift+F10
 * on the focused card. The entries are `andes-dropdown-menu` items (groups, dividers and
 * submenus work), and choosing one emits `nodeAction` with the entry's key and the card.
 */
export const RightClick: Story = {
  render: () => {
    const log = signal('Right click a card.');
    const actions: AndesOrgChartNodeActions<SamplePerson> = [
      { key: 'profile', label: 'Open profile' },
      { key: 'message', label: 'Send a message' },
      { type: 'divider' },
      {
        key: 'more',
        label: 'More',
        children: [
          { key: 'copy', label: 'Copy name' },
          { key: 'link', label: 'Copy link' },
        ],
      },
    ];
    return {
      props: {
        data: SAMPLE_ORG,
        actions,
        log,
        onAction(event: AndesOrgChartNodeActionEvent<SamplePerson>) {
          log.set(`${event.action} on ${event.node.name}`);
        },
      },
      template: `
        <div style="${STACK}">
          <span style="${READOUT}" aria-live="polite">{{ log() }}</span>
          <andes-org-chart
            aria-label="Company organization"
            style="--andes-org-chart-height: 30rem"
            [data]="data"
            [nodeActions]="actions"
            [defaultExpandDepth]="1"
            (nodeAction)="onAction($event)"
          />
        </div>
      `,
    };
  },
};

/**
 * `nodeActions` can be a function of the card: managers get a "Focus on this team" entry, the
 * people without a team only get the profile, and the founder gets no menu at all (the browser's
 * own menu is left alone for a card with no entries).
 */
export const PerPerson: Story = {
  render: () => {
    const log = signal('Right click a card.');
    const actions: AndesOrgChartNodeActions<SamplePerson> = (node) =>
      node.key === 'ceo'
        ? []
        : [
            { key: 'profile', label: 'Open profile' },
            ...(node.expandable
              ? [{ key: 'focus', label: 'Focus on this team' }]
              : []),
          ];
    return {
      props: {
        data: SAMPLE_ORG,
        actions,
        log,
        onAction(
          chart: AndesOrgChart,
          event: AndesOrgChartNodeActionEvent<SamplePerson>,
        ) {
          if (event.action === 'focus') {
            chart.focusNode(event.node.key);
          }
          log.set(`${event.action} on ${event.node.name}`);
        },
      },
      template: `
        <div style="${STACK}">
          <span style="${READOUT}" aria-live="polite">{{ log() }}</span>
          <andes-org-chart
            #chart="andesOrgChart"
            aria-label="Company organization"
            style="--andes-org-chart-height: 30rem"
            [data]="data"
            [nodeActions]="actions"
            [defaultExpandDepth]="1"
            (nodeAction)="onAction(chart, $event)"
          />
        </div>
      `,
    };
  },
};

/** Entries can be disabled or marked as dangerous with the same options a menu item has. */
export const DisabledAndDanger: Story = {
  render: () => ({
    props: {
      data: SAMPLE_ORG,
      actions: [
        { key: 'profile', label: 'Open profile' },
        { key: 'transfer', label: 'Transfer (soon)', disabled: true },
        { type: 'divider' },
        { key: 'remove', label: 'Remove from chart', danger: true },
      ],
    },
    template: `
      <andes-org-chart
        aria-label="Company organization"
        style="--andes-org-chart-height: 28rem"
        [data]="data"
        [nodeActions]="actions"
        [defaultExpandDepth]="1"
      />
    `,
  }),
};
