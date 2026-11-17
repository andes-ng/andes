import { type Meta, moduleMetadata, type StoryObj } from '@storybook/angular';

import { AndesAvatar } from './avatar';
import { AndesAvatarFallback } from './avatar-fallback';
import { AndesAvatarGroup } from './avatar-group';
import { AndesAvatarGroupCount } from './avatar-group-count';
import { AndesAvatarIcon } from './avatar-icon';
import { AndesAvatarImage } from './avatar-image';

const meta: Meta<AndesAvatarGroup> = {
  title: 'Data Display/Avatar/Layout/Group',
  component: AndesAvatarGroup,
  decorators: [
    moduleMetadata({
      imports: [
        AndesAvatar,
        AndesAvatarImage,
        AndesAvatarFallback,
        AndesAvatarIcon,
        AndesAvatarGroupCount,
      ],
    }),
  ],
};

export default meta;

type Story = StoryObj<AndesAvatarGroup>;

const TEAM = [
  { name: 'Alice Moreau', img: 1 },
  { name: 'Bruno Castell', img: 2 },
  { name: 'Chika Adeyemi', img: 3 },
  { name: 'Dana Whitfield', img: 4 },
  { name: 'Elliot Brandt', img: 5 },
  { name: 'Farah Nazari', img: 6 },
];

function teamAvatars(): string {
  return TEAM.map(
    (person) => `<andes-avatar>
        <andes-avatar-image src="https://i.pravatar.cc/150?img=${person.img}" alt="${person.name}" />
        <andes-avatar-fallback>${person.name
          .split(' ')
          .map((part) => part[0])
          .join('')}</andes-avatar-fallback>
      </andes-avatar>`,
  ).join('\n      ');
}

/**
 * Overlapping avatars with a manual `andes-avatar-group-count` chip. The ring between avatars is
 * drawn in `--andes-avatar-ring-color` (the page background by default): on a card or any other
 * surface, set it to that surface so the separator reads as a cut-out. Compare the two groups on
 * the card below, in the dark theme.
 */
export const Group: Story = {
  render: () => ({
    template: `<div style="display: grid; gap: 1.5rem;">
    <andes-avatar-group>
      <andes-avatar>
        <andes-avatar-image src="https://i.pravatar.cc/150?img=1" alt="Person one" />
        <andes-avatar-fallback>P1</andes-avatar-fallback>
      </andes-avatar>
      <andes-avatar>
        <andes-avatar-image src="https://i.pravatar.cc/150?img=2" alt="Person two" />
        <andes-avatar-fallback>P2</andes-avatar-fallback>
      </andes-avatar>
      <andes-avatar>
        <andes-avatar-image src="https://i.pravatar.cc/150?img=3" alt="Person three" />
        <andes-avatar-fallback>P3</andes-avatar-fallback>
      </andes-avatar>
      <andes-avatar-group-count [count]="4" />
    </andes-avatar-group>
    <div style="display: flex; flex-direction: column; gap: 1rem; padding: 1rem; border: 1px solid var(--andes-color-border); border-radius: var(--andes-radius-lg); background: var(--andes-color-card);">
      <andes-avatar-group>
        <andes-avatar><andes-avatar-fallback>AM</andes-avatar-fallback></andes-avatar>
        <andes-avatar><andes-avatar-fallback>BC</andes-avatar-fallback></andes-avatar>
        <andes-avatar><andes-avatar-fallback>CA</andes-avatar-fallback></andes-avatar>
        <andes-avatar-group-count [count]="4" />
      </andes-avatar-group>
      <andes-avatar-group style="--andes-avatar-ring-color: var(--andes-color-card)">
        <andes-avatar><andes-avatar-fallback>AM</andes-avatar-fallback></andes-avatar>
        <andes-avatar><andes-avatar-fallback>BC</andes-avatar-fallback></andes-avatar>
        <andes-avatar><andes-avatar-fallback>CA</andes-avatar-fallback></andes-avatar>
        <andes-avatar-group-count [count]="4" />
      </andes-avatar-group>
    </div>
    </div>`,
  }),
};

export const SizeAndShape: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "`size` and `shape` on the group apply to every avatar and to the `+N` chip; an avatar's own `size`/`shape` still wins. `size` takes presets, pixel numbers and responsive maps here too. Overlap is `--andes-avatar-group-overlap` (default `-0.5rem`); the last row sets it to `0.25rem` for a spaced-out group.",
      },
    },
  },
  render: () => ({
    template: `<div style="display: grid; gap: 1.25rem; justify-items: start;">
      <andes-avatar-group size="lg" shape="square" [max]="{ count: 4 }">
        ${teamAvatars()}
      </andes-avatar-group>
      <andes-avatar-group [size]="28" [max]="{ count: 4 }">
        ${teamAvatars()}
      </andes-avatar-group>
      <andes-avatar-group size="md" style="--andes-avatar-group-overlap: 0.25rem;" [max]="{ count: 4 }">
        ${teamAvatars()}
      </andes-avatar-group>
    </div>`,
  }),
};

export const HiddenNames: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Pass `hiddenNames` to turn the `+N` chip from inert text into a focusable trigger that reveals who is hidden - on hover, on keyboard focus (Tab to it) and on tap. Escape dismisses the panel. Without `hiddenNames` the chip stays exactly as before: plain, non-focusable text.',
      },
    },
  },
  render: () => ({
    props: {
      hidden: [
        'Dana Whitfield',
        'Elliot Brandt',
        'Farah Nazari',
        'Gustavo Rinaldi',
      ],
    },
    template: `<andes-avatar-group>
      <andes-avatar>
        <andes-avatar-image src="https://i.pravatar.cc/150?img=1" alt="Alice Moreau" />
        <andes-avatar-fallback>AM</andes-avatar-fallback>
      </andes-avatar>
      <andes-avatar>
        <andes-avatar-image src="https://i.pravatar.cc/150?img=2" alt="Bruno Castell" />
        <andes-avatar-fallback>BC</andes-avatar-fallback>
      </andes-avatar>
      <andes-avatar>
        <andes-avatar-image src="https://i.pravatar.cc/150?img=3" alt="Chika Adeyemi" />
        <andes-avatar-fallback>CA</andes-avatar-fallback>
      </andes-avatar>
      <andes-avatar-group-count
        [count]="hidden.length"
        [hiddenNames]="hidden"
        overflowLabel="Also in this project"
      />
    </andes-avatar-group>`,
  }),
};

export const Max: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "`[max]=\"{ count: 3 }\"` keeps the first three avatars and collapses the rest into a generated `+N` chip that lists who is hidden (each avatar's image `alt`, icon `label` or fallback text) on hover, focus or tap. `max.popover` takes `{ label, placement: 'top' | 'bottom', trigger: 'hover' | 'focus' | 'click', template }` or `false`; `max.class` / `max.style` style the chip.",
      },
    },
  },
  render: () => ({
    template: `<andes-avatar-group [max]="{ count: 3, popover: { label: 'Also in this project' } }">
      ${teamAvatars()}
    </andes-avatar-group>`,
  }),
};

/**
 * `max.popover.trigger` and `placement` change how the generated `+N` chip reveals who is hidden.
 * Left: `click` below the chip, with `max.style` recoloring the chip. Right: `focus` opens the
 * panel on keyboard focus and tap only - sweeping the pointer across a dense row doesn't pop it up.
 * Tab to the `+N` chip to reveal who is hidden.
 */
export const MaxTriggers: Story = {
  render: () => ({
    template: `<div style="min-height: 14rem; display: flex; align-items: flex-start; gap: 6rem; padding-top: 1rem;">
      <andes-avatar-group
        [max]="{
          count: 2,
          style: { 'background-color': 'var(--andes-color-primary)', color: 'var(--andes-color-primary-foreground)' },
          popover: { trigger: 'click', placement: 'bottom', label: 'Also in this project' }
        }"
      >
        ${teamAvatars()}
      </andes-avatar-group>
      <andes-avatar-group
        [max]="{ count: 3, popover: { trigger: 'focus', placement: 'bottom', label: 'Also in this project' } }"
      >
        ${teamAvatars()}
      </andes-avatar-group>
    </div>`,
  }),
};

export const MaxCustomPanel: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "`max.popover.template` replaces the plain list of names; it receives the names (`let-names`) and `count`. Use `trigger: 'click'` when the panel holds anything interactive.",
      },
    },
  },
  render: () => ({
    template: `<andes-avatar-group
      [max]="{ count: 3, popover: { template: overflowPanel, trigger: 'click' } }"
    >
      ${teamAvatars()}
    </andes-avatar-group>
    <ng-template #overflowPanel let-names let-count="count">
      <strong style="font-size: 0.75rem;">{{ count }} more</strong>
      @for (name of names; track $index) {
        <span style="display: flex; align-items: center; gap: 0.5rem;">
          <andes-avatar size="xs"><andes-avatar-fallback>{{ name[0] }}</andes-avatar-fallback></andes-avatar>
          {{ name }}
        </span>
      }
    </ng-template>`,
  }),
};
