import { signal } from '@angular/core';
import { type Meta, type StoryObj } from '@storybook/angular';

import {
  sampleAvatar,
  type SamplePerson,
} from '../../../testing/org-chart-sample';
import {
  ORG_CHART_DECORATOR,
  ORG_CHART_PARAMETERS,
  READOUT,
  STACK,
} from '../../../testing/org-chart-story-kit';
import { AndesOrgChart } from '../org-chart';

const meta: Meta<AndesOrgChart> = {
  title: 'Data Display/Org Chart/Interaction/Async loading',
  component: AndesOrgChart,
  parameters: ORG_CHART_PARAMETERS,
  decorators: [ORG_CHART_DECORATOR],
};

export default meta;

type Story = StoryObj<AndesOrgChart>;

const TEAMS: Record<string, [string, string][]> = {
  cto: [
    ['Tomás Herrera', 'Engineering Manager, Platform'],
    ['Grace Liu', 'Engineering Manager, Product'],
    ['Hana Kim', 'Data Lead'],
  ],
  design: [
    ['Mateo Álvarez', 'Product Designer'],
    ['Leila Haddad', 'Product Designer'],
  ],
};

const FIRST_LEVEL: SamplePerson = {
  id: 'ceo',
  name: 'Elena Vargas',
  title: 'Founder & CEO',
  avatar: sampleAvatar('Elena Vargas'),
  children: [
    ['cto', 'Priya Raman', 'Chief Technology Officer'],
    ['design', 'Sofia Lindqvist', 'Head of Design'],
    ['people', 'Camila Restrepo', 'Head of People'],
    ['cfo', 'David Cohen', 'Chief Financial Officer'],
  ].map(([id, name, title]) => ({
    id,
    name,
    title,
    avatar: sampleAvatar(name),
  })),
};

function team(person: SamplePerson, delay: number): Promise<SamplePerson[]> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (person.id === 'cfo') {
        reject(new Error('Finance is not available right now.'));
        return;
      }
      const members = TEAMS[person.id] ?? [
        ['Kwame Mensah', 'Technical Recruiter'],
        ['Ana Ferreira', 'People Operations'],
      ];
      resolve(
        members.map(([name, title], index) => ({
          id: `${person.id}-${index}`,
          name,
          title,
          avatar: sampleAvatar(name),
          isLeaf: true,
        })),
      );
    }, delay);
  });
}

/**
 * `loadChildren` fetches a team the first time it is opened; the toggle spins meanwhile. People
 * with `isLeaf: true` never load. Every team takes about a second to arrive, and the finance
 * request fails, which closes it again and emits `loadError`.
 */
export const OnDemand: Story = {
  render: () => {
    const errors = signal<string[]>([]);
    return {
      props: {
        data: FIRST_LEVEL,
        loadChildren: (person: SamplePerson) => team(person, 1000),
        errors,
        onError(error: unknown) {
          errors.update((list) => [...list, String((error as Error).message)]);
        },
      },
      template: `
        <div style="${STACK}">
          <andes-org-chart
            aria-label="Company organization"
            style="--andes-org-chart-height: 30rem"
            [data]="data"
            [loadChildren]="loadChildren"
            [fitOnInit]="false"
            (loadError)="onError($event.error)"
          />
          @for (error of errors(); track $index) {
            <span style="${READOUT}">{{ error }}</span>
          }
        </div>
      `,
    };
  },
};

/** The same teams arrive synchronously (`loadChildren` may return an array): no spinner, no wait. */
export const Immediate: Story = {
  render: () => ({
    props: {
      data: FIRST_LEVEL,
      loadChildren: (person: SamplePerson): SamplePerson[] =>
        (TEAMS[person.id] ?? [['Kwame Mensah', 'Technical Recruiter']]).map(
          ([name, title], index) => ({
            id: `${person.id}-${index}`,
            name,
            title,
            avatar: sampleAvatar(name),
            isLeaf: true,
          }),
        ),
    },
    template: `
      <andes-org-chart
        aria-label="Company organization"
        style="--andes-org-chart-height: 28rem"
        [data]="data"
        [loadChildren]="loadChildren"
        [fitOnInit]="false"
      />
    `,
  }),
};
