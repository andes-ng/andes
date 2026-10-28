import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { AndesButton } from '../button/button';
import { AndesList } from './list';
import { AndesListItem } from './list-item';
import { AndesListItemActions } from './list-item-actions';
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

/** A round initials badge, so the stories need no avatar component. */
const AVATAR =
  'display: inline-flex; align-items: center; justify-content: center; width: 2.5rem; height: 2.5rem; border-radius: 9999px; background: var(--andes-color-muted); color: var(--andes-color-muted-foreground); font-size: 0.875rem; font-weight: 500;';
const LINK =
  'all: unset; cursor: pointer; color: var(--andes-color-primary-text, var(--andes-color-primary)); font-size: 0.875rem;';

const meta: Meta<AndesList> = {
  title: 'Data Display/List/Basics',
  component: AndesList,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [
        AndesListItem,
        AndesListItemMeta,
        AndesListItemActions,
        AndesButton,
      ],
    }),
  ],
  parameters: { layout: 'padded' },
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    itemLayout: {
      control: 'inline-radio',
      options: ['horizontal', 'vertical'],
    },
    bordered: { control: 'boolean' },
    split: { control: 'boolean' },
    clickable: { control: 'boolean' },
    selectable: {
      control: 'inline-radio',
      options: ['none', 'single', 'multiple'],
    },
    loading: { control: 'boolean' },
    loadingRows: { control: 'number' },
    notFoundContent: { control: 'text' },
    columns: { control: 'object' },
    gutter: { control: 'object' },
    dataSource: { control: false },
    itemTemplate: { control: false },
    trackBy: { control: false },
    selected: { control: false },
    virtualScroll: { control: 'boolean' },
    itemSize: { control: 'number' },
    viewportHeight: { control: 'number' },
  },
  args: {
    size: 'md',
    itemLayout: 'horizontal',
    bordered: false,
    split: true,
    clickable: false,
    selectable: 'none',
    loading: false,
    loadingRows: 3,
  },
  render: (args) => ({
    props: { ...args, people: PEOPLE.slice(0, 4) },
    template: `<andes-list style="display: block; max-width: 36rem;" label="Team" [size]="size" [itemLayout]="itemLayout" [bordered]="bordered" [split]="split" [clickable]="clickable" [selectable]="selectable" [loading]="loading" [loadingRows]="loadingRows">
      @for (person of people; track person.id) {
        <andes-list-item [value]="person.id">
          <andes-list-item-meta [title]="person.name" [description]="person.role">
            <span slot="avatar" style="${AVATAR}">{{ person.name[0] }}</span>
          </andes-list-item-meta>
        </andes-list-item>
      }
    </andes-list>`,
  }),
};

export default meta;
type Story = StoryObj<AndesList>;

export const Playground: Story = {};

/**
 * The frame around the rows: the plain list (no frame, dividers between rows), `bordered`, and
 * `[split]="false"` to remove the dividers. The playground above exposes the same switches as
 * controls.
 */
export const Appearance: Story = {
  render: () => ({
    props: { people: PEOPLE.slice(0, 3) },
    template: `<div style="display: flex; flex-direction: column; gap: 1.5rem; max-width: 36rem;">
      <andes-list label="Plain">
        @for (person of people; track person.id) {
          <andes-list-item><andes-list-item-meta [title]="person.name" [description]="person.role" /></andes-list-item>
        }
      </andes-list>
      <andes-list bordered label="Bordered">
        @for (person of people; track person.id) {
          <andes-list-item><andes-list-item-meta [title]="person.name" [description]="person.role" /></andes-list-item>
        }
      </andes-list>
      <andes-list bordered [split]="false" label="Bordered, without dividers">
        @for (person of people; track person.id) {
          <andes-list-item><andes-list-item-meta [title]="person.name" [description]="person.role" /></andes-list-item>
        }
      </andes-list>
    </div>`,
  }),
};

export const Sizes: Story = {
  render: () => ({
    props: { people: PEOPLE.slice(0, 3), sizes: ['sm', 'md', 'lg'] },
    template: `<div style="display: flex; flex-direction: column; gap: 1.5rem; max-width: 36rem;">
      @for (size of sizes; track size) {
        <andes-list [size]="size" bordered [label]="'Team, size ' + size">
          <div slot="header">Size {{ size }}</div>
          @for (person of people; track person.id) {
            <andes-list-item><andes-list-item-meta [title]="person.name" [description]="person.role" /></andes-list-item>
          }
        </andes-list>
      }
    </div>`,
  }),
};

export const HeaderAndFooter: Story = {
  render: () => ({
    props: { people: PEOPLE.slice(0, 3) },
    template: `<andes-list bordered label="Team" style="display: block; max-width: 36rem;">
      <div slot="header">Finance team</div>
      @for (person of people; track person.id) {
        <andes-list-item><andes-list-item-meta [title]="person.name" [description]="person.role" /></andes-list-item>
      }
      <div slot="footer" style="color: var(--andes-color-muted-foreground);">3 of 12 members</div>
    </andes-list>`,
  }),
};

export const Actions: Story = {
  render: () => ({
    props: { people: PEOPLE.slice(0, 4) },
    template: `<andes-list label="Team" style="display: block; max-width: 40rem;">
      @for (person of people; track person.id) {
        <andes-list-item>
          <andes-list-item-meta [title]="person.name" [description]="person.email">
            <span slot="avatar" style="${AVATAR}">{{ person.name[0] }}</span>
          </andes-list-item-meta>
          <andes-list-item-actions>
            <button type="button" style="${LINK}">Edit</button>
            <button type="button" style="${LINK}">More</button>
          </andes-list-item-actions>
        </andes-list-item>
      }
    </andes-list>`,
  }),
};

/** In a vertical list the actions sit under the text and `[slot=extra]` stays beside it. */
export const VerticalWithExtra: Story = {
  args: { itemLayout: 'vertical' },
  render: (args) => ({
    props: { ...args, people: PEOPLE.slice(0, 3) },
    template: `<andes-list label="Announcements" [itemLayout]="itemLayout" [size]="size" bordered style="display: block; max-width: 44rem;">
      @for (person of people; track person.id) {
        <andes-list-item>
          <andes-list-item-meta [title]="'Closing checklist for ' + person.role" description="Posted by {{ person.name }} - 2 days ago" />
          Review open invoices, reconcile the bank accounts and confirm the tax payments before Friday noon.
          <andes-list-item-actions>
            <button type="button" style="${LINK}">12 comments</button>
            <button type="button" style="${LINK}">Share</button>
          </andes-list-item-actions>
          <span slot="extra" style="display: block; width: 9rem; height: 6rem; border-radius: 0.5rem; background: var(--andes-color-muted);"></span>
        </andes-list-item>
      }
    </andes-list>`,
  }),
};

/**
 * `columns` turns the list into a grid. A map sets the count per breakpoint of the list's own
 * width (first list); a number fixes it, and `gutter` takes one gap or a `[horizontal, vertical]`
 * pair (second list).
 */
export const Grid: Story = {
  render: () => ({
    props: { people: PEOPLE },
    template: `<div style="display: flex; flex-direction: column; gap: 2rem;">
      <andes-list label="Team, responsive columns" [columns]="{ xs: 1, sm: 2, lg: 4 }" [gutter]="16">
        @for (person of people; track person.id) {
          <andes-list-item>
            <andes-list-item-meta [title]="person.name" [description]="person.role" />
          </andes-list-item>
        }
      </andes-list>
      <andes-list label="Team, three fixed columns" [columns]="3" [gutter]="[24, 12]">
        @for (person of people.slice(0, 6); track person.id) {
          <andes-list-item>
            <andes-list-item-meta [title]="person.name" [description]="person.email" />
          </andes-list-item>
        }
      </andes-list>
    </div>`,
  }),
  parameters: { layout: 'padded' },
};
