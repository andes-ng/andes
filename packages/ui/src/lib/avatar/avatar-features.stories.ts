import { type Meta, moduleMetadata, type StoryObj } from '@storybook/angular';

import { AndesButton } from '../button/button';
import { AndesAvatar } from './avatar';
import { AndesAvatarBadge } from './avatar-badge';
import { AndesAvatarFallback } from './avatar-fallback';
import { AndesAvatarIcon } from './avatar-icon';
import { AndesAvatarImage } from './avatar-image';
const VALID_IMAGE = 'https://i.pravatar.cc/150?img=12';
const BROKEN_IMAGE = 'https://andes-ng.dev/this-image-does-not-exist.png';

const meta: Meta<AndesAvatar> = {
  title: 'Data Display/Avatar/Basics/Features',
  component: AndesAvatar,
  decorators: [
    moduleMetadata({
      imports: [
        AndesAvatarImage,
        AndesAvatarFallback,
        AndesAvatarIcon,
        AndesAvatarBadge,
        AndesButton,
      ],
    }),
  ],
};

export default meta;

type Story = StoryObj<AndesAvatar>;

/** The fallback waits `delayMs` before it appears, which avoids a flash of initials on fast loads. */
export const DelayedFallback: Story = {
  render: () => ({
    template: `<andes-avatar>
      <andes-avatar-image src="${VALID_IMAGE}" alt="Jane Doe" />
      <andes-avatar-fallback [delayMs]="600">JD</andes-avatar-fallback>
    </andes-avatar>`,
  }),
};

/** Pass a breakpoint map and the avatar resizes with the viewport. Resize the preview to see it change. */
export const ResponsiveSize: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Pass a breakpoint map - `{ xs: 'sm', md: 48, xl: 72 }` - and the avatar resizes with the viewport (`matchMedia`, breakpoints: sm 576, md 768, lg 992, xl 1200, xxl 1600). Mobile-first: a breakpoint with no key of its own uses the nearest smaller one. Resize the preview to see it change.",
      },
    },
  },
  render: () => ({
    props: { responsive: { xs: 'sm', md: 48, xl: 72 } },
    template: `<andes-avatar [size]="responsive">
      <andes-avatar-image src="${VALID_IMAGE}" alt="Jane Doe" />
      <andes-avatar-fallback>JD</andes-avatar-fallback>
    </andes-avatar>`,
  }),
};

/**
 * Fallback text wider than the avatar is scaled down to fit, keeping `gap` px (default 4) clear on
 * each side - measured with a ResizeObserver, so it re-fits when the size, the text or the font
 * changes. The first two rows use the default gap and `[gap]="8"`; the last row is live: cycle
 * through names of different lengths and toggle the gap.
 */
export const FallbackTextFit: Story = {
  render: () => ({
    props: { names: ['U', 'Lucy', 'Tom', 'Edward'], index: 0, gap: 4 },
    template: `<div style="display: grid; gap: 1rem;">
      ${[4, 8]
        .map(
          (gap) => `<div style="display: flex; align-items: center; gap: 1rem;">
        ${(['xs', 'sm', 'md', 'lg', 'xl'] as const)
          .map(
            (size) => `<andes-avatar size="${size}">
          <andes-avatar-fallback [gap]="${gap}">Maria</andes-avatar-fallback>
        </andes-avatar>`,
          )
          .join('\n        ')}
        <andes-avatar size="lg">
          <andes-avatar-fallback [gap]="${gap}">JD</andes-avatar-fallback>
        </andes-avatar>
      </div>`,
        )
        .join('\n      ')}
      <div style="display: flex; align-items: center; gap: 1rem;">
        <andes-avatar size="lg">
          <andes-avatar-fallback [gap]="gap">{{ names[index] }}</andes-avatar-fallback>
        </andes-avatar>
        <andes-button variant="secondary" size="sm" (click)="index = (index + 1) % names.length">Change user</andes-button>
        <andes-button variant="secondary" size="sm" (click)="gap = gap === 4 ? 8 : gap === 8 ? 2 : 4">Gap: {{ gap }}</andes-button>
      </div>
    </div>`,
  }),
};

export const ImageAttributes: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "`srcSet` (+ `sizes`), `crossOrigin` and `draggable` pass straight to the `<img>`. This avatar serves a 2x source to high-density screens and cannot be dragged out of the page. (No `crossOrigin` here: it makes the request a CORS one, which fails - and falls back - against an image host that sends no `Access-Control-Allow-Origin`, as this demo's does.)",
      },
    },
  },
  render: () => ({
    template: `<andes-avatar size="xl">
      <andes-avatar-image
        src="https://i.pravatar.cc/72?img=12"
        srcSet="https://i.pravatar.cc/72?img=12 1x, https://i.pravatar.cc/144?img=12 2x"
        [draggable]="false"
        alt="Jane Doe"
      />
      <andes-avatar-fallback>JD</andes-avatar-fallback>
    </andes-avatar>`,
  }),
};

export const LoadErrorKeepsImage: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "`(loadError)` fires when the image fails. Calling `$event.preventFallback()` in the handler keeps the `<img>` (the browser's broken-image/alt rendering) instead of switching to the fallback. Left: default behaviour. Right: fallback prevented.",
      },
    },
  },
  render: () => ({
    template: `<div style="display: flex; align-items: center; gap: 1rem;">
      <andes-avatar size="xl">
        <andes-avatar-image src="${BROKEN_IMAGE}" alt="Jane Doe" />
        <andes-avatar-fallback>JD</andes-avatar-fallback>
      </andes-avatar>
      <andes-avatar size="xl">
        <andes-avatar-image
          src="${BROKEN_IMAGE}"
          alt="Jane Doe"
          (loadError)="$event.preventFallback()"
        />
        <andes-avatar-fallback>JD</andes-avatar-fallback>
      </andes-avatar>
    </div>`,
  }),
};
