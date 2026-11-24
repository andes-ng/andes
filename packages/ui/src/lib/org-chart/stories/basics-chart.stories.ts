import { type Meta, type StoryObj } from '@storybook/angular';

import { SAMPLE_ORG, withoutPhotos } from '../../../testing/org-chart-sample';
import {
  ORG_CHART_DECORATOR,
  ORG_CHART_PARAMETERS,
  LEADERSHIP,
} from '../../../testing/org-chart-story-kit';
import { AndesOrgChart } from '../org-chart';

const meta: Meta<AndesOrgChart> = {
  title: 'Data Display/Org Chart/Basics/Chart',
  component: AndesOrgChart,
  parameters: ORG_CHART_PARAMETERS,
  decorators: [ORG_CHART_DECORATOR],
  tags: ['autodocs'],
  argTypes: {
    orientation: { control: 'select', options: ['vertical', 'horizontal'] },
    reversed: { control: 'boolean' },
    direction: { control: 'select', options: ['auto', 'ltr', 'rtl'] },
    connector: { control: 'select', options: ['elbow', 'straight', 'curved'] },
    leafLayout: { control: 'select', options: ['tree', 'compact', 'hanging'] },
    selectionMode: {
      control: 'select',
      options: ['none', 'single', 'multiple', 'checkbox'],
    },
    toggleCount: { control: 'select', options: ['none', 'direct', 'total'] },
    collapsible: { control: 'boolean' },
    wheel: { control: 'select', options: ['zoom', 'pan'] },
    defaultExpandDepth: { control: 'number' },
    expandAll: { control: 'boolean' },
    expandOnClick: { control: 'boolean' },
    nodeGap: { control: 'number' },
    subtreeGap: { control: 'number' },
    levelGap: { control: 'number' },
    connectorRadius: { control: 'number' },
    controls: { control: 'boolean' },
    controlsPosition: {
      control: 'select',
      options: ['top-start', 'top-end', 'bottom-start', 'bottom-end'],
    },
    controlsOrientation: {
      control: 'select',
      options: ['vertical', 'horizontal'],
    },
    animated: { control: 'boolean' },
    animationDuration: { control: 'number' },
    pannable: { control: 'boolean' },
    zoomable: { control: 'boolean' },
    fitOnInit: { control: 'boolean' },
  },
  args: {
    orientation: 'vertical',
    reversed: false,
    direction: 'auto',
    connector: 'elbow',
    leafLayout: 'tree',
    selectionMode: 'single',
    toggleCount: 'none',
    collapsible: true,
    wheel: 'zoom',
    defaultExpandDepth: 2,
    expandAll: false,
    expandOnClick: false,
    nodeGap: 24,
    subtreeGap: 40,
    levelGap: 56,
    connectorRadius: 6,
    controls: true,
    controlsPosition: 'bottom-end',
    controlsOrientation: 'vertical',
    animated: true,
    animationDuration: 240,
    pannable: true,
    zoomable: true,
    fitOnInit: true,
  },
  render: (args) => ({
    props: { ...args, data: SAMPLE_ORG },
    template: `
      <andes-org-chart
        aria-label="Company organization"
        style="--andes-org-chart-height: 36rem"
        [data]="data"
        [orientation]="orientation"
        [reversed]="reversed"
        [direction]="direction"
        [connector]="connector"
        [leafLayout]="leafLayout"
        [selectionMode]="selectionMode"
        [toggleCount]="toggleCount"
        [collapsible]="collapsible"
        [wheel]="wheel"
        [defaultExpandDepth]="defaultExpandDepth"
        [expandAll]="expandAll"
        [expandOnClick]="expandOnClick"
        [nodeGap]="nodeGap"
        [subtreeGap]="subtreeGap"
        [levelGap]="levelGap"
        [connectorRadius]="connectorRadius"
        [controls]="controls"
        [controlsPosition]="controlsPosition"
        [controlsOrientation]="controlsOrientation"
        [animated]="animated"
        [animationDuration]="animationDuration"
        [pannable]="pannable"
        [zoomable]="zoomable"
        [fitOnInit]="fitOnInit"
      />
    `,
  }),
};

export default meta;

type Story = StoryObj<AndesOrgChart>;

/**
 * Playground: every layout and behavior input is a control. Drag to pan, scroll or pinch to
 * zoom, use the round toggle under a card to open or close a team, and Tab into the chart to
 * move with the arrow keys.
 */
export const Default: Story = {};

/** The smallest setup: nested data with `id`, `name`, `title`, `avatar` and `children`. */
export const Basic: Story = {
  render: () => ({
    props: {
      data: {
        ...LEADERSHIP,
        children: LEADERSHIP.children?.map((lead) => ({
          id: lead.id,
          name: lead.name,
          title: lead.title,
          avatar: lead.avatar,
        })),
      },
    },
    template: `
      <andes-org-chart
        aria-label="Leadership team"
        style="--andes-org-chart-height: 20rem"
        [data]="data"
      />
    `,
  }),
};

/**
 * Without photos the card draws the person's initials in the avatar circle. Nothing else changes:
 * the data only needs a `name`.
 */
export const Initials: Story = {
  render: () => ({
    props: { data: withoutPhotos(LEADERSHIP) },
    template: `
      <andes-org-chart
        aria-label="Leadership team"
        style="--andes-org-chart-height: 24rem"
        [data]="data"
        [defaultExpandDepth]="1"
      />
    `,
  }),
};

/**
 * `nodeSize` sets the card size (width and height in pixels, before zoom), and `nodeGap`,
 * `subtreeGap` and `levelGap` the spaces between siblings, between neighbouring teams and between
 * a manager and the reports.
 */
export const CardSizeAndSpacing: Story = {
  render: () => ({
    props: {
      data: LEADERSHIP,
      size: { width: 280, height: 88 },
    },
    template: `
      <andes-org-chart
        aria-label="Leadership team"
        style="--andes-org-chart-height: 26rem"
        [data]="data"
        [nodeSize]="size"
        [nodeGap]="40"
        [subtreeGap]="72"
        [levelGap]="80"
        [defaultExpandDepth]="1"
      />
    `,
  }),
};
