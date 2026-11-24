import { signal } from '@angular/core';
import { type Meta, type StoryObj } from '@storybook/angular';

import {
  SAMPLE_ORG,
  sampleAvatar,
  type SamplePerson,
} from '../../../testing/org-chart-sample';
import {
  find,
  ORG_CHART_DECORATOR,
  ORG_CHART_PARAMETERS,
  READOUT,
  ROW,
  STACK,
  updateNode,
} from '../../../testing/org-chart-story-kit';
import { AndesOrgChart } from '../org-chart';
import type { AndesOrgChartKey } from '../org-chart-layout';

const meta: Meta<AndesOrgChart> = {
  title: 'Data Display/Org Chart/Interaction/Dynamic data',
  component: AndesOrgChart,
  parameters: ORG_CHART_PARAMETERS,
  decorators: [ORG_CHART_DECORATOR],
};

export default meta;

type Story = StoryObj<AndesOrgChart>;

/**
 * Data that changes at runtime: select someone, then add a report (the card grows out of its
 * manager), mark them as acting, or remove them (their team shrinks back into the manager). The
 * chart keeps the view, the expansion and the selection.
 */
export const AddRenameRemove: Story = {
  render: () => {
    const org = signal<SamplePerson>(SAMPLE_ORG);
    const picked = signal<readonly AndesOrgChartKey[]>(['product']);
    const hires = [
      'Clara Novak',
      'Tobias Lund',
      'Yuki Mori',
      'Diego Paredes',
      'Selin Aydın',
    ];
    let counter = 0;
    const current = () => picked()[0];
    return {
      props: {
        org,
        picked,
        add() {
          const key = current();
          if (!key) {
            return;
          }
          const name = hires[counter % hires.length];
          const id = `hire-${counter++}`;
          org.set(
            updateNode(org(), key, (node) => ({
              ...node,
              children: [
                ...(node.children ?? []),
                {
                  id,
                  name,
                  title: 'Product Manager',
                  avatar: sampleAvatar(name),
                },
              ],
            })) as SamplePerson,
          );
        },
        rename() {
          const key = current();
          if (key) {
            org.set(
              updateNode(org(), key, (node) => ({
                ...node,
                title: node.title.endsWith(' (acting)')
                  ? node.title
                  : `${node.title} (acting)`,
              })) as SamplePerson,
            );
          }
        },
        remove() {
          const key = current();
          if (!key || key === org().id) {
            return;
          }
          org.set(updateNode(org(), key, () => null) as SamplePerson);
          picked.set([]);
        },
        reset() {
          org.set(SAMPLE_ORG);
        },
        selectedName: () => (current() ? find(org(), current())?.name : null),
      },
      template: `
        <div style="${STACK}">
          <div style="${ROW}">
            <andes-button [disabled]="!picked().length" (click)="add()">Add report</andes-button>
            <andes-button variant="outline" [disabled]="!picked().length" (click)="rename()">Mark acting</andes-button>
            <andes-button variant="outline" danger [disabled]="!picked().length" (click)="remove()">Remove</andes-button>
            <andes-button variant="ghost" (click)="reset()">Reset</andes-button>
            <span style="${READOUT}">{{ selectedName() ?? 'Select a person' }}</span>
          </div>
          <andes-org-chart
            aria-label="Company organization"
            style="--andes-org-chart-height: 34rem"
            [data]="org()"
            [(selected)]="picked"
            [defaultExpandDepth]="2"
          />
        </div>
      `,
    };
  },
};
