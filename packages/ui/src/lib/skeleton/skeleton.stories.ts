import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';

import { AndesButton } from '../button/button';
import { AndesSkeleton } from './skeleton';
import { AndesSkeletonAvatar } from './skeleton-avatar';
import { AndesSkeletonButton } from './skeleton-button';
import { AndesSkeletonImage } from './skeleton-image';
import { AndesSkeletonInput } from './skeleton-input';
import { AndesSkeletonNode } from './skeleton-node';

const meta: Meta<AndesSkeleton> = {
  title: 'Feedback/Skeleton/Basics',
  component: AndesSkeleton,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [
        AndesButton,
        AndesSkeletonAvatar,
        AndesSkeletonButton,
        AndesSkeletonImage,
        AndesSkeletonInput,
        AndesSkeletonNode,
      ],
    }),
  ],
  argTypes: {
    loading: { control: 'boolean' },
    active: { control: 'boolean' },
    animation: {
      control: 'inline-radio',
      options: [undefined, 'shimmer', 'pulse', 'none'],
      description:
        'Picks the animation by name; `active` is the shorthand for shimmer.',
    },
    avatar: { control: 'object' },
    title: { control: 'object' },
    paragraph: { control: 'object' },
    round: { control: 'boolean' },
    loadingLabel: { control: 'text' },
    classNames: { control: 'object' },
    styles: { control: 'object' },
    shape: {
      control: 'select',
      options: [undefined, 'text', 'circular', 'rectangular'],
      description: 'Block mode: set to render the original single bar.',
    },
    width: { control: 'text' },
    height: { control: 'text' },
    animated: { control: 'boolean' },
  },
  args: {
    loading: true,
    active: false,
    avatar: false,
    title: true,
    paragraph: true,
    round: false,
  },
  render: (args) => ({
    props: args,
    template: `
      <div style="width: 420px;">
        <andes-skeleton
          [loading]="loading"
          [active]="active"
          [animation]="animation"
          [avatar]="avatar"
          [title]="title"
          [paragraph]="paragraph"
          [round]="round"
          [classNames]="classNames"
          [styles]="styles"
        />
      </div>
    `,
  }),
};

export default meta;

type Story = StoryObj<AndesSkeleton>;

/** The playground: use the controls to try the composite placeholder's inputs. */
export const Default: Story = {};

const caption =
  'font-family: var(--andes-font-family), sans-serif; font-size: 0.75rem; line-height: 1.25rem; color: var(--andes-color-muted-foreground);';

/**
 * Layouts of the composite placeholder, each from one input: `avatar` (with a taller `paragraph`
 * of 4 rows), `active` for the shimmer, `round` corners with a square large avatar, custom
 * `title` and `paragraph` widths, and a title with no `paragraph`.
 */
export const Layouts: Story = {
  render: () => ({
    props: { caption },
    template: `
      <div style="display: flex; flex-direction: column; gap: 1.5rem; width: 420px;">
        <div>
          <span [style]="caption">avatar + 4 rows</span>
          <andes-skeleton avatar [paragraph]="{ rows: 4 }" />
        </div>
        <div>
          <span [style]="caption">active (shimmer)</span>
          <andes-skeleton [active]="true" avatar />
        </div>
        <div>
          <span [style]="caption">round + square large avatar</span>
          <andes-skeleton round [avatar]="{ shape: 'square', size: 'lg' }" />
        </div>
        <div>
          <span [style]="caption">title and paragraph widths</span>
          <andes-skeleton [title]="{ width: 160 }" [paragraph]="{ rows: 4, width: ['90%', '75%', '85%', 120] }" />
        </div>
        <div>
          <span [style]="caption">avatar + title only</span>
          <andes-skeleton avatar [paragraph]="false" />
        </div>
      </div>
    `,
  }),
};

/** `loading` swaps the placeholder for the projected content - toggle it with the button. */
export const LoadingWrapper: Story = {
  args: { active: true, avatar: true },
  render: (args) => ({
    props: { ...args, isLoading: true },
    template: `
      <div style="display: flex; flex-direction: column; gap: 1rem; width: 420px;">
        <andes-button variant="secondary" size="sm" (click)="isLoading = !isLoading">
          {{ isLoading ? 'Show content' : 'Show skeleton' }}
        </andes-button>
        <andes-skeleton [loading]="isLoading" [active]="active" [avatar]="avatar">
          <div style="display: flex; gap: 1rem; font-family: var(--andes-font-family), sans-serif; font-size: 0.875rem; line-height: 1.375rem; color: var(--andes-color-foreground);">
            <div style="flex: none; width: 2.5rem; height: 2.5rem; border-radius: 9999px; background: var(--andes-color-primary); color: var(--andes-color-primary-foreground); display: flex; align-items: center; justify-content: center; font-size: 0.875rem;">AN</div>
            <div>
              <h4 style="margin: 0.25rem 0 0.5rem; font-size: 1rem; line-height: 1.5rem; font-weight: 600;">Andes NG</h4>
              <p style="margin: 0; color: var(--andes-color-muted-foreground);">
                The real content, rendered once loading is false.
              </p>
            </div>
          </div>
        </andes-skeleton>
      </div>
    `,
  }),
};

export const List: Story = {
  args: { active: true },
  render: (args) => ({
    props: args,
    template: `
      <div style="display: flex; flex-direction: column; gap: 1.5rem; width: 420px;">
        @for (item of [1, 2, 3]; track item) {
          <andes-skeleton [active]="active" avatar [paragraph]="{ rows: 1 }" />
        }
      </div>
    `,
  }),
};

/** Placeholders stay visible on a card surface too (muted fill vanished there in dark mode). */
export const OnCard: Story = {
  args: { active: true, avatar: true },
  render: (args) => ({
    props: args,
    template: `
      <div style="width: 420px; padding: 1.5rem; border-radius: var(--andes-radius-lg); border: 1px solid var(--andes-color-border); background: var(--andes-color-card);">
        <andes-skeleton [active]="active" [avatar]="avatar" />
      </div>
    `,
  }),
};

/**
 * The three animations - `shimmer` (what `active` turns on), `pulse` and `none` - on the same
 * placeholder. All of them stand still under `prefers-reduced-motion`.
 */
export const Animations: Story = {
  render: () => ({
    props: { caption },
    template: `
      <div style="display: flex; flex-direction: column; gap: 1.5rem; width: 420px;">
        <div>
          <span [style]="caption">shimmer</span>
          <andes-skeleton animation="shimmer" avatar />
        </div>
        <div>
          <span [style]="caption">pulse</span>
          <andes-skeleton animation="pulse" avatar />
        </div>
        <div>
          <span [style]="caption">none</span>
          <andes-skeleton animation="none" avatar />
        </div>
      </div>
    `,
  }),
};
