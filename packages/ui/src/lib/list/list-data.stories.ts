import { signal } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { AndesButton } from '../button/button';
import { AndesList } from './list';
import { AndesListItem } from './list-item';
import { AndesListItemMeta } from './list-item-meta';

interface Person {
  id: number;
  name: string;
  role: string;
  email: string;
}

const NAMES = [
  ['Lucia Paredes', 'Finance lead'],
  ['Marco Quispe', 'Accountant'],
  ['Rosa Huaman', 'Treasury analyst'],
  ['Diego Salazar', 'Auditor'],
  ['Camila Rojas', 'Payroll specialist'],
  ['Andres Flores', 'Tax advisor'],
  ['Valeria Mendoza', 'Controller'],
  ['Jorge Castillo', 'Billing clerk'],
] as const;

const PEOPLE: Person[] = NAMES.map(([name, role], index) => ({
  id: index + 1,
  name,
  role,
  email: `${name.split(' ')[0].toLowerCase()}@example.com`,
}));

const MANY: Person[] = Array.from({ length: 5000 }, (_, index) => ({
  id: index + 1,
  name: `${NAMES[index % NAMES.length][0]} #${index + 1}`,
  role: NAMES[index % NAMES.length][1],
  email: `user${index + 1}@example.com`,
}));

const meta: Meta<AndesList> = {
  title: 'Data Display/List/Data',
  component: AndesList,
  decorators: [
    moduleMetadata({
      imports: [AndesListItem, AndesListItemMeta, AndesButton],
    }),
  ],
  parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj<AndesList>;

/** Rows from an array: the item template receives the entry and its index. */
export const DataSource: Story = {
  render: () => ({
    props: {
      people: PEOPLE,
      trackById: (_: number, person: Person) => person.id,
    },
    template: `<ng-template #row let-person let-index="index">
        <andes-list-item>
          <andes-list-item-meta [title]="person.name" [description]="person.role" />
          <span style="color: var(--andes-color-muted-foreground);">#{{ index + 1 }}</span>
        </andes-list-item>
      </ng-template>
      <andes-list bordered label="Team" [dataSource]="people" [itemTemplate]="row" [trackBy]="trackById" style="display: block; max-width: 36rem;" />`,
  }),
};

/**
 * A list's other two states: `loading` shows placeholder rows (`loadingRows` sets how many), and
 * an empty `dataSource` shows the not-found message, which `notFoundContent` replaces with
 * custom text or a template (here with a call to action).
 */
export const LoadingAndEmpty: Story = {
  render: () => ({
    template: `<ng-template #nothing>
        <div style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem;">
          <strong>No invoices yet</strong>
          <span style="color: var(--andes-color-muted-foreground);">Create the first one to see it here.</span>
          <andes-button size="sm">New invoice</andes-button>
        </div>
      </ng-template>
      <div style="display: flex; flex-direction: column; gap: 1.5rem; max-width: 36rem;">
        <andes-list bordered label="Loading" loading [loadingRows]="3" />
        <andes-list bordered label="Empty" [dataSource]="[]" />
        <andes-list bordered label="Empty with custom text" [dataSource]="[]" notFoundContent="Nobody matches your search" />
        <andes-list bordered label="Empty with a template" [dataSource]="[]" [notFoundContent]="nothing" />
      </div>`,
  }),
};

/** The load-more slot takes any control; here a button appends rows and shows its own busy state. */
export const LoadMore: Story = {
  render: () => ({
    props: (() => {
      const shown = signal(3);
      const busy = signal(false);
      return {
        shown,
        busy,
        people: PEOPLE,
        more: () => {
          busy.set(true);
          setTimeout(() => {
            shown.update((value) => Math.min(value + 3, PEOPLE.length));
            busy.set(false);
          }, 600);
        },
      };
    })(),
    template: `<andes-list bordered label="Team" [loading]="busy() && shown() === 0" style="display: block; max-width: 36rem;">
      @for (person of people.slice(0, shown()); track person.id) {
        <andes-list-item><andes-list-item-meta [title]="person.name" [description]="person.role" /></andes-list-item>
      }
      @if (shown() < people.length) {
        <andes-button slot="load-more" size="sm" variant="outline" [loading]="busy()" (click)="more()">Load more</andes-button>
      }
    </andes-list>`,
  }),
};

/** `page`, `pageSize` and `total` slice the data; the pagination slot hosts whatever controls you like. */
export const PaginationSlot: Story = {
  render: () => ({
    props: { people: MANY.slice(0, 40), page: signal(1) },
    template: `<ng-template #row let-person>
        <andes-list-item><andes-list-item-meta [title]="person.name" [description]="person.role" /></andes-list-item>
      </ng-template>
      <andes-list bordered label="Team" [dataSource]="people" [itemTemplate]="row" [pageSize]="5" [(page)]="page" style="display: block; max-width: 36rem;">
        <div slot="pagination" style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem;">
          <andes-button size="sm" variant="outline" [disabled]="page() === 1" (click)="page.set(page() - 1)">Previous</andes-button>
          <span>Page {{ page() }} of 8</span>
          <andes-button size="sm" variant="outline" [disabled]="page() === 8" (click)="page.set(page() + 1)">Next</andes-button>
        </div>
      </andes-list>`,
  }),
};

/** Only the rows in view exist in the DOM; each states its position in the whole set for assistive tech. */
export const VirtualScroll: Story = {
  render: () => ({
    props: { people: MANY },
    template: `<ng-template #row let-person let-index="index">
        <andes-list-item>
          <andes-list-item-meta [title]="person.name" [description]="person.role" />
          <span style="color: var(--andes-color-muted-foreground);">{{ index + 1 }}</span>
        </andes-list-item>
      </ng-template>
      <andes-list bordered label="All users, 5000 rows" [dataSource]="people" [itemTemplate]="row" virtualScroll [itemSize]="56" [viewportHeight]="360" style="display: block; max-width: 36rem;" />`,
  }),
};
