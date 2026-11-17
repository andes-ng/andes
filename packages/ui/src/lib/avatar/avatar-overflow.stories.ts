import { type Meta, moduleMetadata, type StoryObj } from '@storybook/angular';

import { AndesAvatar } from './avatar';
import { AndesAvatarFallback } from './avatar-fallback';
import { AndesAvatarGroup } from './avatar-group';
import { AndesAvatarImage } from './avatar-image';

const meta: Meta<AndesAvatarGroup> = {
  title: 'Data Display/Avatar/Advanced/Overflow',
  component: AndesAvatarGroup,
  decorators: [
    moduleMetadata({
      imports: [AndesAvatar, AndesAvatarImage, AndesAvatarFallback],
    }),
  ],
};

export default meta;

type Story = StoryObj<AndesAvatarGroup>;

// --- Overflow at scale --------------------------------------------------------

const FIRST_NAMES = [
  'Alice',
  'Bruno',
  'Chika',
  'Dana',
  'Elliot',
  'Farah',
  'Gustavo',
  'Hana',
  'Ivan',
  'Jun',
  'Karla',
  'Liam',
  'Mina',
  'Noor',
  'Omar',
  'Priya',
  'Quinn',
  'Rosa',
  'Sven',
  'Tariq',
];
const LAST_NAMES = [
  'Moreau',
  'Castell',
  'Adeyemi',
  'Whitfield',
  'Brandt',
  'Nazari',
  'Rinaldi',
  'Okafor',
  'Petrov',
  'Sato',
  'Lindqvist',
  'Ferreira',
  'Haddad',
  'Novak',
  'Ibarra',
  'Kowalski',
  'Mbeki',
  'Yilmaz',
  'Duarte',
  'Larsen',
];

interface GeneratedPerson {
  readonly name: string;
  readonly initials: string;
  readonly background: string;
  /** A generated picture (an inline SVG, so no network) for every fourth person. */
  readonly picture: string | null;
}

/** `count` distinct people with generated names, colors and, for some, pictures. */
function generatePeople(count: number): GeneratedPerson[] {
  return Array.from({ length: count }, (_, i) => {
    const first = FIRST_NAMES[i % FIRST_NAMES.length];
    const last =
      LAST_NAMES[Math.floor(i / FIRST_NAMES.length) % LAST_NAMES.length];
    const initials = `${first[0]}${last[0]}`;
    const hue = (i * 47) % 360;
    const background = `hsl(${hue} 55% 38%)`;
    const picture =
      i % 4 === 0
        ? `data:image/svg+xml,${encodeURIComponent(
            `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="hsl(${hue} 60% 45%)"/><circle cx="32" cy="25" r="11" fill="hsl(${hue} 70% 85%)"/><path d="M10 64a22 22 0 0 1 44 0z" fill="hsl(${hue} 70% 85%)"/></svg>`,
          )}`
        : null;
    return { name: `${first} ${last}`, initials, background, picture };
  });
}

/** A source that never loads, so the person shows initials but keeps a name. */
const NO_PICTURE = 'data:,';

/** The group markup for generated people; `groupAttrs` goes on `andes-avatar-group`. */
function generatedGroup(groupAttrs: string): string {
  return `<andes-avatar-group ${groupAttrs}>
      @for (person of people; track person.name) {
        <andes-avatar
          [style.--andes-avatar-background]="person.background"
          style="--andes-avatar-foreground: #ffffff"
        >
          <andes-avatar-image [src]="person.picture ?? NO_PICTURE" [alt]="person.name" />
          <andes-avatar-fallback>{{ person.initials }}</andes-avatar-fallback>
        </andes-avatar>
      }
    </andes-avatar-group>`;
}

const OVERFLOW_ROOM =
  'min-height: 21rem; display: flex; align-items: flex-start; padding-top: 1rem;';

export const Few: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'The `+N` panel shows the hidden avatars as faces - photo, else initials - not as a list of names. Each face is named for assistive technology (`aria-label`) and its name is shown in a small label floating past the panel edge while it is hovered or focused. With a handful of faces the panel is a single compact block with no heading. Tab to the chip (or hover it), then Arrow Down moves into the faces; arrow keys move across them, Escape closes the panel and returns to the chip.',
      },
    },
  },
  render: () => ({
    props: { people: generatePeople(11), NO_PICTURE },
    template: `<div style="${OVERFLOW_ROOM}">${generatedGroup(
      `[max]="{ count: 3, popover: { placement: 'bottom' } }"`,
    )}</div>`,
  }),
};

export const Many: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Past four rows the panel keeps its size and scrolls vertically (thin scrollbar, the page behind does not scroll), and shows a "+N more" heading. The grid is 6-8 faces wide depending on the avatar size. Page Up/Down move by a screenful; Home/End go to the start/end of a row and Ctrl+Home/End to the first/last face.',
      },
    },
  },
  render: () => ({
    props: { people: generatePeople(43), NO_PICTURE },
    template: `<div style="${OVERFLOW_ROOM}">${generatedGroup(
      `[max]="{ count: 3, popover: { placement: 'bottom' } }"`,
    )}</div>`,
  }),
};

export const Hundreds: StoryObj<{ hidden: number }> = {
  args: { hidden: 300 },
  argTypes: {
    hidden: { control: { type: 'number', min: 1, max: 5000 } },
  },
  parameters: {
    docs: {
      description: {
        story:
          'The panel is built when it opens and renders only the rows in (and just beside) its scroll viewport, so 300 hidden avatars cost about as much as 40 - and 5,000 would too. Pictures load lazily as their rows scroll in.',
      },
    },
  },
  render: (args) => ({
    props: { people: generatePeople(args.hidden + 3), NO_PICTURE },
    template: `<div style="${OVERFLOW_ROOM}">${generatedGroup(
      `[max]="{ count: 3, popover: { placement: 'bottom', trigger: 'click' } }"`,
    )}</div>`,
  }),
};

export const Layouts: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "`max.popover.layout` is `'grid'` (default; any number of faces) or `'row'` (one horizontal line that scrolls sideways and snaps to faces - for a handful). `max.popover.trigger` is `'hover'` (default; also opens on focus and tap) or `'click'` (a disclosure that stays open until Escape or a click outside). Left to right: grid on hover, row on hover, grid on click, row on click.",
      },
    },
  },
  render: () => ({
    props: { people: generatePeople(15), NO_PICTURE },
    template: `<div style="${OVERFLOW_ROOM} gap: 4rem; flex-wrap: wrap;">
      ${[
        ["layout: 'grid'", 'hover'],
        ["layout: 'row'", 'hover'],
        ["layout: 'grid'", 'click'],
        ["layout: 'row'", 'click'],
      ]
        .map(([layout, trigger]) =>
          generatedGroup(
            `[max]="{ count: 3, popover: { placement: 'bottom', ${layout}, trigger: '${trigger}' } }"`,
          ),
        )
        .join('\n      ')}
    </div>`,
  }),
};

export const WithoutMax: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Without `max` the stack never wraps or shrinks: its avatars keep their size and overlap, so 100 of them make a row about 2,400px wide that spills out of its container (here a 360px box, clipped for the demo). Always set `max` for a group that can grow - the visible row is then `max.count` avatars plus the chip, however many are hidden. If every avatar must stay visible, let the group wrap with `flex-wrap: wrap` and give it a gap (`--andes-avatar-group-overlap: 0.25rem`), as in the second box.',
      },
    },
  },
  render: () => ({
    props: { people: generatePeople(100), NO_PICTURE },
    template: `<div style="display: grid; gap: 1.5rem;">
      <div style="width: 360px; overflow: hidden; border: 1px dashed var(--andes-color-border);">
        ${generatedGroup('')}
      </div>
      <div style="width: 360px; border: 1px dashed var(--andes-color-border);">
        ${generatedGroup('style="flex-wrap: wrap; row-gap: 0.25rem; --andes-avatar-group-overlap: 0.25rem"')}
      </div>
    </div>`,
  }),
};
