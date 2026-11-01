import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';

import {
  SAMPLE_ORG,
  sampleAvatar,
  sampleRows,
  type SamplePerson,
} from '../../testing/org-chart-sample';
import { AndesSegmented } from '../segmented/segmented';
import { AndesSwitch } from '../switch/switch';
import { AndesOrgChart } from './org-chart';

/** The sample company with photos on the first two levels. */
function withPhotos(node: SamplePerson, depth = 0): SamplePerson {
  return {
    ...node,
    avatar:
      depth < 2
        ? sampleAvatar((node.id.length * 47 + depth * 90) % 360)
        : undefined,
    children: node.children?.map((child) => withPhotos(child, depth + 1)),
  };
}

const meta: Meta<AndesOrgChart> = {
  title: 'Data Display/Org Chart/Basics/Chart',
  component: AndesOrgChart,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  decorators: [moduleMetadata({ imports: [AndesSegmented, AndesSwitch] })],
  argTypes: {
    orientation: { control: 'select', options: ['vertical', 'horizontal'] },
    reversed: { control: 'boolean' },
    direction: { control: 'select', options: ['auto', 'ltr', 'rtl'] },
    connector: { control: 'select', options: ['elbow', 'straight', 'curved'] },
    leafLayout: { control: 'select', options: ['tree', 'compact', 'hanging'] },
    selectionMode: {
      control: 'select',
      options: ['none', 'single', 'multiple'],
    },
    badge: { control: 'select', options: ['direct', 'total', 'none'] },
    wheel: { control: 'select', options: ['zoom', 'pan'] },
    defaultExpandDepth: { control: 'number' },
    expandAll: { control: 'boolean' },
    expandOnClick: { control: 'boolean' },
    nodeGap: { control: 'number' },
    subtreeGap: { control: 'number' },
    levelGap: { control: 'number' },
    connectorRadius: { control: 'number' },
    controls: { control: 'boolean' },
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
    badge: 'direct',
    wheel: 'zoom',
    defaultExpandDepth: 2,
    expandAll: false,
    expandOnClick: false,
    nodeGap: 24,
    subtreeGap: 40,
    levelGap: 56,
    connectorRadius: 8,
    controls: true,
    animated: true,
    animationDuration: 280,
    pannable: true,
    zoomable: true,
    fitOnInit: true,
  },
  render: (args) => ({
    props: { ...args, data: withPhotos(SAMPLE_ORG) },
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
        [badge]="badge"
        [wheel]="wheel"
        [defaultExpandDepth]="defaultExpandDepth"
        [expandAll]="expandAll"
        [expandOnClick]="expandOnClick"
        [nodeGap]="nodeGap"
        [subtreeGap]="subtreeGap"
        [levelGap]="levelGap"
        [connectorRadius]="connectorRadius"
        [controls]="controls"
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
 * zoom, click the count badge to expand or collapse a team, and Tab into the chart to move with
 * the arrow keys.
 */
export const Default: Story = {};

/**
 * `orientation` and `reversed`: reports below, above, after or before their manager. The badge
 * follows the side the reports are on.
 */
export const Orientation: Story = {
  render: () => ({
    props: {
      data: SAMPLE_ORG,
      axis: 'vertical',
      flipped: false,
      orientations: [
        { label: 'Vertical', value: 'vertical' },
        { label: 'Horizontal', value: 'horizontal' },
      ],
    },
    template: `
      <div style="display: grid; gap: 1rem;">
        <div style="display: flex; gap: 1.5rem; align-items: center; flex-wrap: wrap;">
          <andes-segmented aria-label="Orientation" [options]="orientations" [(value)]="axis" />
          <andes-switch [(checked)]="flipped">Reversed</andes-switch>
        </div>
        <andes-org-chart
          aria-label="Company organization"
          style="--andes-org-chart-height: 34rem"
          [data]="data"
          [orientation]="axis"
          [reversed]="flipped"
          [defaultExpandDepth]="3"
          leafLayout="compact"
        />
      </div>
    `,
  }),
};

/** `connector`: rounded elbows (default), straight lines or smooth curves. */
export const Connectors: Story = {
  render: () => ({
    props: {
      data: SAMPLE_ORG,
      lineStyle: 'curved',
      connectors: [
        { label: 'Elbow', value: 'elbow' },
        { label: 'Straight', value: 'straight' },
        { label: 'Curved', value: 'curved' },
      ],
    },
    template: `
      <div style="display: grid; gap: 1rem;">
        <andes-segmented aria-label="Connector style" [options]="connectors" [(value)]="lineStyle" />
        <andes-org-chart
          aria-label="Company organization"
          style="--andes-org-chart-height: 30rem"
          [data]="data"
          [connector]="lineStyle"
        />
      </div>
    `,
  }),
};

/**
 * `leafLayout`: teams made only of individual contributors can stack in two columns around a
 * stem (`compact`) or hang in one indented column (`hanging`), which keeps wide organizations
 * readable. `leafLayoutMinCount` sets the smallest team that stacks.
 */
export const LeafLayouts: Story = {
  render: () => ({
    props: {
      data: SAMPLE_ORG,
      leafMode: 'compact',
      leafModes: [
        { label: 'Tree', value: 'tree' },
        { label: 'Compact', value: 'compact' },
        { label: 'Hanging', value: 'hanging' },
      ],
    },
    template: `
      <div style="display: grid; gap: 1rem;">
        <andes-segmented aria-label="Leaf layout" [options]="leafModes" [(value)]="leafMode" />
        <andes-org-chart
          aria-label="Company organization"
          style="--andes-org-chart-height: 36rem"
          [data]="data"
          [leafLayout]="leafMode"
          [defaultExpandDepth]="4"
        />
      </div>
    `,
  }),
};

/**
 * Assistants (`assistant: true`) sit beside their manager's stem, above the reports, and
 * `secondaryLinks` draw dotted-line relations between any two people without changing the
 * layout (hover a dotted line for its label).
 */
export const AssistantsAndSecondaryLinks: Story = {
  render: () => ({
    props: {
      data: SAMPLE_ORG,
      relations: [
        { from: 'des', to: 'brand', label: 'Design partners with Brand' },
        { from: 'fpa', to: 'sup', label: 'Analyst supports Supply Chain' },
      ],
    },
    template: `
      <andes-org-chart
        aria-label="Company organization"
        style="--andes-org-chart-height: 34rem"
        [data]="data"
        [secondaryLinks]="relations"
        [defaultExpandDepth]="3"
        leafLayout="compact"
      />
    `,
  }),
};

/**
 * Flat rows: `dataFormat="flat"` reads `{ id, parentId }` rows directly, and `fieldNames` maps
 * any other field names (here `key`, `manager`, `fullName`, `role`).
 */
export const FlatData: Story = {
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
