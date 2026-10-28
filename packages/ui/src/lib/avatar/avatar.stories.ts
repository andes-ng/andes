import { type Meta, moduleMetadata, type StoryObj } from '@storybook/angular';

import { AndesAvatar } from './avatar';
import { AndesAvatarBadge } from './avatar-badge';
import { AndesAvatarFallback } from './avatar-fallback';
import { AndesAvatarGroup } from './avatar-group';
import { AndesAvatarGroupCount } from './avatar-group-count';
import { AndesAvatarIcon } from './avatar-icon';
import { AndesAvatarImage } from './avatar-image';

const VALID_IMAGE = 'https://i.pravatar.cc/150?img=12';
const BROKEN_IMAGE = 'https://andes-ng.dev/this-image-does-not-exist.png';

const USER_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <path d="M20 21a8 8 0 0 0-16 0" />
        <circle cx="12" cy="7" r="4" />
      </svg>`;

const meta: Meta<AndesAvatar> = {
  title: 'Data Display/Avatar/Basics/Avatar',
  component: AndesAvatar,
  tags: ['autodocs'],
  // `moduleMetadata(...)`, the helper from `@storybook/angular` - NOT a
  // hand-rolled `(story) => ({ moduleMetadata: {...}, ...story() })`
  // decorator, which is what this file used to carry and which silently
  // dropped imports.
  //
  // Decorators compose inside-out: a story-level decorator runs first, and
  // its result is what the meta-level decorator receives from `story()`. So
  // spreading `...story()` over a literal `moduleMetadata` key means any
  // story that supplies its OWN `moduleMetadata` (the Group story did, for
  // `AndesAvatarGroup`/`AndesAvatarGroupCount`) overwrites the meta-level one
  // wholesale rather than adding to it. `AndesAvatarImage` and
  // `AndesAvatarFallback` then never reached the compiled story module, and
  // every `<andes-avatar-image>` / `<andes-avatar-fallback>` in that story's
  // template rendered as an unknown element - NG0304 at runtime, with the
  // photo and the initials simply missing from the page.
  //
  // The official helper merges instead of replacing: it reads the inner
  // story's `moduleMetadata` and concatenates each array (`imports`,
  // `declarations`, `providers`, `schemas`) with its own, which is precisely
  // the behaviour a per-story override needs.
  //
  // Every Avatar part is declared once here rather than per story: the parts
  // are a single compound component, an unused import costs nothing, and one
  // shared list is exactly what an `autodocs` page - which renders all of a
  // component's stories together - needs in order to compile them side by
  // side.
  decorators: [
    moduleMetadata({
      imports: [
        AndesAvatarImage,
        AndesAvatarFallback,
        AndesAvatarIcon,
        AndesAvatarBadge,
        AndesAvatarGroup,
        AndesAvatarGroupCount,
      ],
    }),
  ],
  argTypes: {
    shape: { control: 'select', options: ['circular', 'rounded', 'square'] },
    // Presets only in the control; a pixel number or a breakpoint map is
    // shown in the PixelSizes / ResponsiveSize stories.
    size: { control: 'select', options: ['xs', 'sm', 'md', 'lg', 'xl'] },
  },
  args: {
    shape: 'circular',
    size: 'md',
  },
  render: (args) => ({
    props: args,
    template: `<andes-avatar [shape]="shape" [size]="size">
      <andes-avatar-image src="${VALID_IMAGE}" alt="Jane Doe" />
      <andes-avatar-fallback>JD</andes-avatar-fallback>
    </andes-avatar>`,
  }),
};

export default meta;

type Story = StoryObj<AndesAvatar>;

export const Default: Story = {};

/**
 * What an avatar shows, in the order it is tried: the image when it loads, the initials when the
 * image fails (a broken source here), a glyph as the fallback, and initials alone with no image.
 */
export const ImageAndFallback: Story = {
  render: () => ({
    template: `<div style="display: flex; align-items: center; gap: 1rem;">
      <andes-avatar>
        <andes-avatar-image src="${VALID_IMAGE}" alt="Jane Doe" />
        <andes-avatar-fallback>JD</andes-avatar-fallback>
      </andes-avatar>
      <andes-avatar>
        <andes-avatar-image src="${BROKEN_IMAGE}" alt="Jane Doe" />
        <andes-avatar-fallback>JD</andes-avatar-fallback>
      </andes-avatar>
      <andes-avatar>
        <andes-avatar-fallback>JD</andes-avatar-fallback>
      </andes-avatar>
      <andes-avatar>
        <andes-avatar-fallback>
          ${USER_ICON}
        </andes-avatar-fallback>
      </andes-avatar>
    </div>`,
  }),
};

/**
 * The `xs`-`xl` presets, then pixel numbers. Besides the presets, `size` takes any pixel number
 * (e.g. `[size]="64"`): the box is sized inline and the font size follows at ~40% of the box, with
 * a 10px floor. The last avatar is a 96px one carrying a status badge.
 */
export const Sizes: Story = {
  render: () => ({
    template: `<div style="display: flex; align-items: center; gap: 1rem; flex-wrap: wrap;">
      ${(['xs', 'sm', 'md', 'lg', 'xl'] as const)
        .map(
          (size) => `<andes-avatar size="${size}">
        <andes-avatar-image src="${VALID_IMAGE}" alt="Jane Doe" />
        <andes-avatar-fallback>JD</andes-avatar-fallback>
      </andes-avatar>`,
        )
        .join('\n      ')}
      ${[20, 32, 48, 64, 96]
        .map(
          (px) => `<andes-avatar [size]="${px}">
        <andes-avatar-fallback>JD</andes-avatar-fallback>
      </andes-avatar>`,
        )
        .join('\n      ')}
      <andes-avatar [size]="96">
        <andes-avatar-image src="${VALID_IMAGE}" alt="Jane Doe" />
        <andes-avatar-fallback>JD</andes-avatar-fallback>
        <andes-avatar-badge status="online" label="Online" />
      </andes-avatar>
    </div>`,
  }),
};

/** The three shapes with a picture: `circular` (default), `rounded` and `square`. */
export const Shapes: Story = {
  render: () => ({
    template: `<div style="display: flex; align-items: center; gap: 1rem;">
      ${(['circular', 'rounded', 'square'] as const)
        .map(
          (shape) => `<andes-avatar shape="${shape}">
        <andes-avatar-image src="${VALID_IMAGE}" alt="Jane Doe" />
        <andes-avatar-fallback>JD</andes-avatar-fallback>
      </andes-avatar>`,
        )
        .join('\n      ')}
    </div>`,
  }),
};

/**
 * Icon avatars and glyph fallbacks. Use `andes-avatar-icon` - not `andes-avatar-fallback` - when the
 * avatar never had an image to fall back FROM: a fallback is tied to the image-load state machine,
 * so with no sibling `andes-avatar-image` the root stays at `data-status="loading"` forever and a
 * `delayMs` fallback would never appear. `andes-avatar-icon` renders unconditionally and takes a
 * required `label` for its accessible name (pass `""` when adjacent text already names the entity).
 *
 * The first row shows the icon avatar in each shape. The grid below draws a person glyph as the
 * fallback (top row), as an icon avatar (middle row) and next to the initials (bottom row) at every
 * preset and pixel size: about two thirds of the box, so a glyph with the usual padding inside its
 * viewBox covers a little over half of the avatar, at the same weight as the initials. Tune it with
 * `--andes-avatar-icon-scale` (a unitless share of the box, default `0.66`) for an icon set whose
 * glyphs fill the viewBox edge to edge.
 */
export const IconAvatars: Story = {
  render: () => {
    const boxes: Record<string, number> = {
      xs: 20,
      sm: 24,
      md: 32,
      lg: 40,
      xl: 56,
      16: 16,
      48: 48,
      64: 64,
      96: 96,
    };
    const sizes = Object.keys(boxes);
    const attr = (size: string) =>
      /^\d+$/.test(size) ? `[size]="${size}"` : `size="${size}"`;
    const row = (title: string, content: (size: string) => string) =>
      `<div style="display: flex; align-items: center; gap: 1rem;">
        <span style="width: 7rem; font-size: 0.75rem; color: var(--andes-color-muted-foreground);">${title}</span>
        ${sizes.map((size) => `<andes-avatar ${attr(size)}>${content(size)}</andes-avatar>`).join('\n        ')}
      </div>`;
    return {
      template: `<div style="display: grid; gap: 1.5rem;">
      <div style="display: flex; align-items: center; gap: 1rem;">
        ${(['circular', 'rounded', 'square'] as const)
          .map(
            (shape) => `<andes-avatar shape="${shape}">
          <andes-avatar-icon label="Unassigned">${USER_ICON}</andes-avatar-icon>
        </andes-avatar>`,
          )
          .join('\n        ')}
      </div>
      <div style="display: grid; gap: 1rem;">
      <div style="display: flex; gap: 1rem; padding-inline-start: 8rem; font-size: 0.75rem; color: var(--andes-color-muted-foreground);">
        ${sizes.map((size) => `<span style="width: ${boxes[size]}px; text-align: center;">${size}</span>`).join('')}
      </div>
      ${row('Fallback glyph', () => `<andes-avatar-fallback>${USER_ICON}</andes-avatar-fallback>`)}
      ${row('Icon avatar', () => `<andes-avatar-icon label="Unassigned">${USER_ICON}</andes-avatar-icon>`)}
      ${row('Initials', () => '<andes-avatar-fallback>JD</andes-avatar-fallback>')}
      </div>
    </div>`,
    };
  },
};

/**
 * Project an `andes-avatar-badge` to pin a presence dot to a corner. `status` is
 * `online | offline | busy | away`, `placement` is `bottom-end | bottom-start | top-end | top-start`,
 * and `label` is required so the state reaches screen reader users through something other than
 * colour. The second row shows the badge scaling across every avatar size.
 */
export const StatusBadge: Story = {
  render: () => ({
    template: `<div style="display: grid; gap: 1.5rem;">
      <div style="display: flex; align-items: center; gap: 1.25rem;">
        <andes-avatar>
          <andes-avatar-image src="${VALID_IMAGE}" alt="Jane Doe" />
          <andes-avatar-fallback>JD</andes-avatar-fallback>
          <andes-avatar-badge status="online" label="Online" />
        </andes-avatar>
        <andes-avatar>
          <andes-avatar-fallback>AB</andes-avatar-fallback>
          <andes-avatar-badge status="busy" label="Busy" />
        </andes-avatar>
        <andes-avatar>
          <andes-avatar-fallback>CD</andes-avatar-fallback>
          <andes-avatar-badge status="away" label="Away" />
        </andes-avatar>
        <andes-avatar>
          <andes-avatar-fallback>EF</andes-avatar-fallback>
          <andes-avatar-badge status="offline" label="Offline" />
        </andes-avatar>
        <andes-avatar>
          <andes-avatar-icon label="Unassigned">${USER_ICON}</andes-avatar-icon>
          <andes-avatar-badge status="offline" placement="top-end" label="Offline" />
        </andes-avatar>
      </div>
      <div style="display: flex; align-items: center; gap: 1.25rem;">
        ${(['xs', 'sm', 'md', 'lg', 'xl'] as const)
          .map(
            (size) => `<andes-avatar size="${size}">
          <andes-avatar-image src="${VALID_IMAGE}" alt="Jane Doe" />
          <andes-avatar-fallback>JD</andes-avatar-fallback>
          <andes-avatar-badge status="online" label="Online" />
        </andes-avatar>`,
          )
          .join('\n        ')}
      </div>
    </div>`,
  }),
};

export const CustomColors: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Set `--andes-avatar-background` and `--andes-avatar-foreground` on an avatar, or once on a group (they inherit), to recolor initials and icon avatars and the `+N` chip. Keep the pair at 4.5:1 contrast for initials.',
      },
    },
  },
  render: () => ({
    template: `<div style="display: flex; align-items: center; gap: 1rem;">
      <andes-avatar style="--andes-avatar-background: var(--andes-color-primary); --andes-avatar-foreground: var(--andes-color-primary-foreground);">
        <andes-avatar-fallback>AN</andes-avatar-fallback>
      </andes-avatar>
      <andes-avatar style="--andes-avatar-background: #15803d; --andes-avatar-foreground: #ffffff;">
        <andes-avatar-fallback>OK</andes-avatar-fallback>
      </andes-avatar>
      <andes-avatar style="--andes-avatar-background: var(--andes-color-danger); --andes-avatar-foreground: var(--andes-color-danger-foreground);">
        <andes-avatar-fallback>ER</andes-avatar-fallback>
      </andes-avatar>
      <andes-avatar shape="rounded" style="--andes-avatar-background: #7c3aed; --andes-avatar-foreground: #ffffff;">
        <andes-avatar-fallback>VI</andes-avatar-fallback>
      </andes-avatar>
      <andes-avatar-group
        [max]="{ count: 2 }"
        style="--andes-avatar-background: #0f766e; --andes-avatar-foreground: #ffffff;"
      >
        <andes-avatar><andes-avatar-fallback>TA</andes-avatar-fallback></andes-avatar>
        <andes-avatar><andes-avatar-fallback>TB</andes-avatar-fallback></andes-avatar>
        <andes-avatar><andes-avatar-fallback>TC</andes-avatar-fallback></andes-avatar>
        <andes-avatar><andes-avatar-fallback>TD</andes-avatar-fallback></andes-avatar>
      </andes-avatar-group>
    </div>`,
  }),
};
