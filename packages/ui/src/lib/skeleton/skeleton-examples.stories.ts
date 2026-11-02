import { signal } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideChartScatter,
  lucideMessageSquare,
  lucideStar,
  lucideThumbsUp,
} from '@ng-icons/lucide';
import {
  moduleMetadata,
  type Decorator,
  type Meta,
  type StoryObj,
} from '@storybook/angular';

import { AndesAvatar } from '../avatar/avatar';
import { AndesAvatarFallback } from '../avatar/avatar-fallback';
import { AndesButton } from '../button/button';
import { AndesCheckbox } from '../checkbox/checkbox';
import {
  AndesSkeleton,
  type AndesSkeletonClassNames,
  type AndesSkeletonStyles,
} from './skeleton';
import {
  AndesSkeletonAvatar,
  type AndesSkeletonAvatarShape,
} from './skeleton-avatar';
import {
  AndesSkeletonButton,
  type AndesSkeletonButtonShape,
} from './skeleton-button';
import { AndesSkeletonImage } from './skeleton-image';
import { AndesSkeletonInput } from './skeleton-input';
import { AndesSkeletonNode } from './skeleton-node';
import type { AndesSkeletonSize } from './skeleton-utils';

/*
 * Every example of Ant Design's Skeleton page (https://ant.design/components/skeleton), in its
 * order and under its names, rebuilt with the Andes components.
 */

/**
 * Prints the story's one-sentence description (`parameters.docs.description.story`) above the
 * example, since this Storybook has no Docs tab to show it in.
 */
const withDescription: Decorator = (story, context) => {
  const rendered = story();
  const description = context.parameters['docs']?.description?.story;
  return description
    ? {
        ...rendered,
        template: `<p style="max-width: 40rem; margin: 0 0 1.5rem; font-family: var(--andes-font-family), sans-serif; font-size: 0.875rem; line-height: 1.375rem; color: var(--andes-color-muted-foreground);">${description}</p>${rendered.template}`,
      }
    : rendered;
};

const meta: Meta<AndesSkeleton> = {
  title: 'Feedback/Skeleton/Examples',
  component: AndesSkeleton,
  decorators: [
    withDescription,
    moduleMetadata({
      imports: [
        AndesAvatar,
        AndesAvatarFallback,
        AndesButton,
        AndesCheckbox,
        AndesSkeletonAvatar,
        AndesSkeletonButton,
        AndesSkeletonImage,
        AndesSkeletonInput,
        AndesSkeletonNode,
        NgIcon,
      ],
      providers: [
        provideIcons({
          lucideChartScatter,
          lucideMessageSquare,
          lucideStar,
          lucideThumbsUp,
        }),
      ],
    }),
  ],
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<AndesSkeleton>;

const text =
  'font-family: var(--andes-font-family), sans-serif; font-size: 0.875rem; line-height: 1.375rem; color: var(--andes-color-foreground);';

const caption =
  'font-family: var(--andes-font-family), sans-serif; font-size: 0.75rem; line-height: 1.25rem; color: var(--andes-color-muted-foreground);';

/** The simplest skeleton: a title and a three-row paragraph. */
export const Basic: Story = {
  parameters: {
    docs: {
      description: {
        story: 'The simplest skeleton: a title and a three-row paragraph.',
      },
    },
  },
  render: () => ({
    template: `<andes-skeleton />`,
  }),
};

/** A complex combination of an avatar and a paragraph of several rows. */
export const ComplexCombination: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'A complex combination of an avatar and a paragraph of several rows.',
      },
    },
  },
  name: 'Complex combination',
  render: () => ({
    template: `<andes-skeleton avatar [paragraph]="{ rows: 4 }" />`,
  }),
};

/** Shows the active animation: a band of light sweeping across the placeholder. */
export const ActiveAnimation: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Shows the active animation: a band of light sweeping across the placeholder.',
      },
    },
  },
  name: 'Active Animation',
  render: () => ({
    template: `<andes-skeleton active />`,
  }),
};

/** The avatar, button and input placeholders in their large, default and small sizes. */
export const Size: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'The avatar, button and input placeholders in their large, default and small sizes.',
      },
    },
  },
  render: () => ({
    props: { caption },
    template: `
      <div style="display: flex; flex-direction: column; gap: 1rem;">
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <span [style]="caption" style="width: 4rem;">Button</span>
          <andes-skeleton-button size="lg" />
          <andes-skeleton-button />
          <andes-skeleton-button size="sm" />
        </div>
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <span [style]="caption" style="width: 4rem;">Avatar</span>
          <andes-skeleton-avatar size="lg" />
          <andes-skeleton-avatar />
          <andes-skeleton-avatar size="sm" />
        </div>
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <span [style]="caption" style="width: 4rem;">Input</span>
          <andes-skeleton-input size="lg" />
          <andes-skeleton-input />
          <andes-skeleton-input size="sm" />
        </div>
      </div>
    `,
  }),
};

/** The button placeholder in its default, square, round and circle shapes. */
export const ButtonShape: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'The button placeholder in its default, square, round and circle shapes.',
      },
    },
  },
  name: 'Button Shape',
  render: () => ({
    template: `
      <div style="display: flex; align-items: center; gap: 0.5rem;">
        <andes-skeleton-button />
        <andes-skeleton-button shape="square" />
        <andes-skeleton-button shape="round" />
        <andes-skeleton-button shape="circle" />
      </div>
    `,
  }),
};

/** The avatar placeholder in its square and circle shapes. */
export const AvatarShape: Story = {
  parameters: {
    docs: {
      description: {
        story: 'The avatar placeholder in its square and circle shapes.',
      },
    },
  },
  name: 'Avatar Shape',
  render: () => ({
    template: `
      <div style="display: flex; align-items: center; gap: 0.5rem;">
        <andes-skeleton-avatar shape="square" />
        <andes-skeleton-avatar shape="circle" />
      </div>
    `,
  }),
};

interface ElementsArgs {
  active: boolean;
  block: boolean;
  size: AndesSkeletonSize;
  buttonShape: AndesSkeletonButtonShape;
  avatarShape: AndesSkeletonAvatarShape;
}

/**
 * The button, avatar, input, image and node placeholders, with controls for Active, Button and
 * Input Block, Size, Button Shape and Avatar Shape.
 */
export const ButtonAvatarInputImageNode: StoryObj<ElementsArgs> = {
  parameters: {
    docs: {
      description: {
        story:
          'The button, avatar, input, image and node placeholders, with controls for Active, Button and Input Block, Size, Button Shape and Avatar Shape.',
      },
    },
  },
  name: 'Button/Avatar/Input/Image/Node',
  argTypes: {
    active: { name: 'Active', control: 'boolean' },
    block: { name: 'Button and Input Block', control: 'boolean' },
    size: {
      name: 'Size',
      control: 'inline-radio',
      options: ['lg', 'md', 'sm'],
    },
    buttonShape: {
      name: 'Button Shape',
      control: 'inline-radio',
      options: ['default', 'square', 'round', 'circle'],
    },
    avatarShape: {
      name: 'Avatar Shape',
      control: 'inline-radio',
      options: ['square', 'circle'],
    },
  },
  args: {
    active: false,
    block: false,
    size: 'md',
    buttonShape: 'default',
    avatarShape: 'circle',
  },
  render: (args) => ({
    props: args,
    template: `
      <div style="display: flex; flex-direction: column; gap: 1rem;">
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <andes-skeleton-button [active]="active" [size]="size" [shape]="buttonShape" />
          <andes-skeleton-avatar [active]="active" [size]="size" [shape]="avatarShape" />
          <andes-skeleton-input [active]="active" [size]="size" />
        </div>
        <andes-skeleton-button [active]="active" [size]="size" [shape]="buttonShape" [block]="block" />
        <andes-skeleton-input [active]="active" [size]="size" [block]="block" />
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <andes-skeleton-image [active]="active" />
          <andes-skeleton-node [active]="active" [width]="160" />
          <andes-skeleton-node [active]="active">
            <ng-icon name="lucideChartScatter" size="40" />
          </andes-skeleton-node>
        </div>
      </div>
    `,
  }),
};

/**
 * The skeleton wraps the real content: it shows the placeholder while `loading` is true and the
 * content once it is false - press the button to load it for three seconds.
 */
export const ContainsSubComponent: StoryObj = {
  parameters: {
    docs: {
      description: {
        story:
          'The skeleton wraps the real content, showing the placeholder while loading is true and the content once it is false: press the button to load it for three seconds.',
      },
    },
  },
  name: 'Contains sub component',
  render: () => {
    // A signal, so the template follows the timeout (the page does not rely on zone.js).
    const loading = signal(false);
    let timer: ReturnType<typeof setTimeout> | undefined;
    return {
      props: {
        heading:
          'margin: 0 0 1rem; font-size: 1rem; line-height: 1.5rem; font-weight: 600;',
        body: `margin: 0; ${text}`,
        loading,
        show() {
          loading.set(true);
          clearTimeout(timer);
          timer = setTimeout(() => loading.set(false), 3000);
        },
      },
      template: `
      <div style="display: flex; flex-direction: column; align-items: flex-start; gap: 1rem;">
        <andes-skeleton [loading]="loading()" style="width: 100%;">
          <h4 [style]="heading">Andes NG, a component library</h4>
          <p [style]="body">
            We supply a series of accessible components, design tokens and practical patterns,
            to help people build their product interfaces beautifully and efficiently.
          </p>
        </andes-skeleton>
        <andes-button variant="secondary" [disabled]="loading()" (click)="show()">
          Show Skeleton
        </andes-button>
      </div>
    `,
    };
  },
};

const listItems = [1, 2, 3].map((n) => ({
  initials: `A${n}`,
  title: `andes ng part ${n}`,
  description:
    'Andes NG, a component library for Angular applications, is refined by the Andes team.',
  content:
    'We supply a series of accessible components, design tokens and practical patterns, to help people build their product interfaces beautifully and efficiently.',
}));

/** A skeleton per list item while the list loads - tick the box to show the loaded items. */
export const List: StoryObj = {
  parameters: {
    docs: {
      description: {
        story:
          'A skeleton per list item while the list loads: tick the box to show the loaded items.',
      },
    },
  },
  render: () => ({
    props: {
      loaded: false,
      items: listItems,
      text,
      caption,
      link: 'color: var(--andes-color-primary-text); font-weight: 500;',
    },
    template: `
      <div style="display: flex; flex-direction: column; gap: 1rem; max-width: 640px;">
        <andes-checkbox [checked]="loaded" (checkedChange)="loaded = $event">Loaded</andes-checkbox>
        <div style="border: 1px solid var(--andes-color-border); border-radius: var(--andes-radius-lg);">
          @for (item of items; track item.title) {
            <div style="padding: 1rem 1.5rem;" [style.border-top]="$first ? 'none' : '1px solid var(--andes-color-border)'">
              <andes-skeleton [loading]="!loaded" active avatar>
                <div style="display: flex; gap: 1rem; align-items: flex-start;" [style]="text">
                  <andes-avatar size="lg"><andes-avatar-fallback>{{ item.initials }}</andes-avatar-fallback></andes-avatar>
                  <div style="display: flex; flex-direction: column;">
                    <span [style]="link">{{ item.title }}</span>
                    <span style="color: var(--andes-color-muted-foreground);">{{ item.description }}</span>
                  </div>
                </div>
                <p style="margin: 0.75rem 0 0;" [style]="text">{{ item.content }}</p>
              </andes-skeleton>
              @if (loaded) {
                <div [style]="text" style="display: flex; align-items: center; gap: 0.75rem; margin-top: 1rem; color: var(--andes-color-muted-foreground);">
                  <span style="display: inline-flex; align-items: center; gap: 0.5rem;"><ng-icon name="lucideStar" size="16" />156</span>
                  <span aria-hidden="true">|</span>
                  <span style="display: inline-flex; align-items: center; gap: 0.5rem;"><ng-icon name="lucideThumbsUp" size="16" />156</span>
                  <span aria-hidden="true">|</span>
                  <span style="display: inline-flex; align-items: center; gap: 0.5rem;"><ng-icon name="lucideMessageSquare" size="16" />2</span>
                </div>
              }
            </div>
          }
        </div>
      </div>
    `,
  }),
};

/** Classes the semantic-styling example hangs on the skeleton's parts (see `ensureDemoStyles`). */
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

/**
 * Style the skeleton's parts - root, header, section, avatar, title and paragraph - with
 * `classNames` and `styles`, as objects (left) or as functions of the inputs (right).
 */
export const CustomSemanticDomStyling: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Style the parts of the skeleton (root, header, section, avatar, title and paragraph) with classNames and styles, as objects (left) or as functions of the inputs (right).',
      },
    },
  },
  name: 'Custom semantic dom styling',
  decorators: [withDemoStyles],
  render: () => ({
    props: {
      objectClassNames,
      objectStyles,
      functionClassNames,
      functionStyles,
    },
    template: `
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
    `,
  }),
};
