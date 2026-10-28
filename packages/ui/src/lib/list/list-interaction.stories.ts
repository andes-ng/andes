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

const meta: Meta<AndesList> = {
  title: 'Data Display/List/Interaction',
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

/** Whole rows act as buttons: hover feedback, one tab stop, arrows to move, Enter or Space to open. */
export const Clickable: Story = {
  render: () => ({
    props: { people: PEOPLE.slice(0, 5), last: signal('nothing yet') },
    template: `<div style="max-width: 36rem;">
      <andes-list bordered clickable label="Team" (itemActivated)="last.set($event.value + '')">
        @for (person of people; track person.id) {
          <andes-list-item [value]="person.name"><andes-list-item-meta [title]="person.name" [description]="person.role" /></andes-list-item>
        }
      </andes-list>
      <p style="font-size: 0.875rem; color: var(--andes-color-muted-foreground);">Opened: {{ last() }}</p>
    </div>`,
  }),
};

/**
 * `selectable="single"` keeps one value (a disabled row cannot be picked), `"multiple"` toggles
 * any number. Both bind `[(selected)]`, an array of the rows' `value`s.
 */
export const Selectable: Story = {
  render: () => ({
    props: {
      people: PEOPLE.slice(0, 6),
      assignee: signal<unknown[]>([2]),
      recipients: signal<unknown[]>([1, 3]),
    },
    template: `<div style="display: flex; flex-direction: column; gap: 1.5rem; max-width: 36rem;">
      <div>
        <andes-list bordered selectable="single" label="Assignee" [(selected)]="assignee">
          @for (person of people.slice(0, 5); track person.id) {
            <andes-list-item [value]="person.id" [disabled]="person.id === 4"><andes-list-item-meta [title]="person.name" [description]="person.role" /></andes-list-item>
          }
        </andes-list>
        <p style="font-size: 0.875rem; color: var(--andes-color-muted-foreground);">Selected id: {{ assignee() }}</p>
      </div>
      <div>
        <andes-list bordered selectable="multiple" label="Recipients" [(selected)]="recipients">
          @for (person of people; track person.id) {
            <andes-list-item [value]="person.id"><andes-list-item-meta [title]="person.name" [description]="person.email" /></andes-list-item>
          }
        </andes-list>
        <p style="font-size: 0.875rem; color: var(--andes-color-muted-foreground);">{{ recipients().length }} selected</p>
      </div>
    </div>`,
  }),
};
