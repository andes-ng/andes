import type { Decorator, Meta, StoryObj } from '@storybook/angular';

import {
  about,
  caption,
  card,
  font,
  muted,
  withDescription,
  withSkeletonKit,
} from '../../testing/skeleton-story-kit';
import {
  AndesSkeleton,
  type AndesSkeletonClassNames,
  type AndesSkeletonStyles,
} from './skeleton';

/*
 * Making the placeholders yours: classes and inline styles for their parts, two custom properties
 * for their colours, and the choice of animation.
 */

const meta: Meta<AndesSkeleton> = {
  title: 'Feedback/Skeleton/Customisation',
  component: AndesSkeleton,
  decorators: [withDescription, withSkeletonKit],
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<AndesSkeleton>;

/** Classes the class names example hangs on the skeleton's parts (see `ensureDemoStyles`). */
const SEMANTIC_STYLE_ID = 'andes-skeleton-semantic-demo';

/** Adds the demo classes to the document once - the skeleton's parts are styled by class name. */
function ensureDemoStyles(): void {
  if (document.getElementById(SEMANTIC_STYLE_ID)) {
    return;
  }
  const style = document.createElement('style');
  style.id = SEMANTIC_STYLE_ID;
  style.textContent = `
    .skeleton-demo-root { border-radius: 10px; padding: 12px; }
    .skeleton-demo-header { margin-bottom: 12px; }
    .skeleton-demo-paragraph > div { background-color: rgba(229, 243, 254, 0.5); }
    .skeleton-part { outline: 1px dashed; outline-offset: 2px; }
    .skeleton-part-root { outline-color: #e5484d; padding: 6px; }
    .skeleton-part-header { outline-color: #f76b15; }
    .skeleton-part-section { outline-color: #30a46c; }
    .skeleton-part-avatar { outline-color: #0091ff; }
    .skeleton-part-title { outline-color: #8e4ec6; }
    .skeleton-part-paragraph { outline-color: #12a594; }
    .skeleton-part-content { outline-color: #0091ff; }
  `;
  document.head.appendChild(style);
}

const withDemoStyles: Decorator = (story) => {
  ensureDemoStyles();
  return story();
};

const objectClassNames: AndesSkeletonClassNames = {
  root: 'skeleton-demo-root',
  header: 'skeleton-demo-header',
};

const objectStyles: AndesSkeletonStyles = {
  avatar: { border: '1px solid #aaa' },
  title: { border: '1px solid #aaa' },
};

const functionClassNames: AndesSkeletonClassNames = (info) => ({
  root: 'skeleton-demo-root',
  header: 'skeleton-demo-header',
  paragraph: info.props.active ? 'skeleton-demo-paragraph' : undefined,
});

const functionStyles: AndesSkeletonStyles = (info) =>
  info.props.active
    ? {
        root: { border: '1px solid rgba(229, 243, 254, 0.3)' },
        title: {
          backgroundColor: 'rgba(229, 243, 254, 0.5)',
          height: 20,
          borderRadius: 20,
        },
      }
    : {};

/** Every part outlined in its own colour, to show where each one is. */
const partClassNames: AndesSkeletonClassNames = {
  root: 'skeleton-part skeleton-part-root',
  header: 'skeleton-part skeleton-part-header',
  section: 'skeleton-part skeleton-part-section',
  avatar: 'skeleton-part skeleton-part-avatar',
  title: 'skeleton-part skeleton-part-title',
  paragraph: 'skeleton-part skeleton-part-paragraph',
};

const elementClassNames = {
  root: 'skeleton-part skeleton-part-root',
  content: 'skeleton-part skeleton-part-content',
};

/** Classes and inline styles for the parts. */
export const ClassNamesAndStyles: Story = {
  name: 'Class names and styles',
  parameters: about(
    'Style the parts of the skeleton (root, header, section, avatar, title and paragraph) with classNames and styles, as objects (first) or as functions of the inputs (second), while the third skeleton outlines every part and the element placeholders take root and content.',
  ),
  decorators: [withDemoStyles],
  render: () => ({
    props: {
      objectClassNames,
      objectStyles,
      functionClassNames,
      functionStyles,
      partClassNames,
      elementClassNames,
    },
    template: `
      <div style="display: flex; flex-direction: column; gap: 2rem;">
        <div style="display: flex; gap: 1rem;">
          <andes-skeleton
            style="flex: 1;"
            avatar
            [paragraph]="false"
            [classNames]="objectClassNames"
            [styles]="objectStyles"
          />
          <andes-skeleton
            style="flex: 1;"
            active
            [classNames]="functionClassNames"
            [styles]="functionStyles"
          />
        </div>
        <andes-skeleton avatar [paragraph]="{ rows: 3 }" [classNames]="partClassNames" />
        <div style="display: flex; align-items: center; gap: 1rem;">
          <andes-skeleton-button [classNames]="elementClassNames" />
          <andes-skeleton-avatar [classNames]="elementClassNames" />
          <andes-skeleton-input [classNames]="elementClassNames" />
        </div>
      </div>
    `,
  }),
};

/** Two custom properties colour the fill and the shimmer band. */
export const ColourVariables: Story = {
  name: 'Colour variables',
  parameters: about(
    '--andes-skeleton-color and --andes-skeleton-highlight-color set on any ancestor recolour the fill and the shimmer band of every placeholder inside it, and the default fill stays visible on a card.',
  ),
  render: () => ({
    props: { caption, muted, card, font },
    template: `
      <div style="display: flex; flex-direction: column; gap: 1.5rem; max-width: 26rem;">
        <div>
          <p [style]="muted" style="margin: 0 0 0.75rem;">Default</p>
          <andes-skeleton active avatar />
        </div>
        <div>
          <p [style]="muted" style="margin: 0 0 0.75rem;">On a card</p>
          <div [style]="card">
            <andes-skeleton active avatar />
          </div>
        </div>
        <div style="--andes-skeleton-color: #dbeafe; --andes-skeleton-highlight-color: #93c5fd;">
          <p [style]="muted" style="margin: 0 0 0.75rem;">Blue</p>
          <andes-skeleton active avatar />
        </div>
        <div style="padding: 1rem; border-radius: var(--andes-radius-lg); background: #0f172a; --andes-skeleton-color: rgba(255, 255, 255, 0.12); --andes-skeleton-highlight-color: rgba(255, 255, 255, 0.28);">
          <p style="margin: 0 0 0.75rem; color: #94a3b8;" [style]="font">On a dark surface</p>
          <andes-skeleton active avatar />
        </div>
      </div>
    `,
  }),
};

/** shimmer, pulse or none. */
export const Animation: Story = {
  name: 'Animation',
  parameters: about(
    'The three animations, shimmer (what active turns on), pulse and none, on the same placeholder, all standing still under prefers-reduced-motion.',
  ),
  render: () => ({
    props: { caption },
    template: `
      <div style="display: flex; flex-direction: column; gap: 1.5rem; max-width: 26rem;">
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
