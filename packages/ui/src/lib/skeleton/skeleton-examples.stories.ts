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
import { AndesRadio } from '../radio-group/radio';
import { AndesRadioGroup } from '../radio-group/radio-group';
import { AndesSwitch } from '../switch/switch';
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
 * order and under its names, rebuilt with the Andes components and the same controls: the
 * switches and radio buttons of Ant's demos are `andes-switch` and `andes-radio-group` here.
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
  title: 'Feedback/Skeleton/Examples/Ant Design',
  component: AndesSkeleton,
  decorators: [
    withDescription,
    moduleMetadata({
      imports: [
        AndesAvatar,
        AndesAvatarFallback,
        AndesButton,
        AndesRadio,
        AndesRadioGroup,
        AndesSwitch,
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

/** One labelled control of a demo's form row, like Ant's inline `Form.Item`. */
const formItem =
  'display: inline-flex; align-items: center; gap: 0.5rem; font-family: var(--andes-font-family), sans-serif; font-size: 0.875rem; line-height: 1.375rem; color: var(--andes-color-foreground);';

const formRow =
  'display: flex; flex-wrap: wrap; align-items: center; gap: 1rem;';

const divider =
  'width: 100%; margin: 0; border: 0; border-top: 1px solid var(--andes-color-border);';

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
          'Shows the active animation: a band of light sweeping across the placeholder. The Active switch turns it on and off.',
      },
    },
  },
  name: 'Active Animation',
  render: () => ({
    props: { active: signal(true), formItem },
    template: `
      <div style="display: flex; flex-direction: column; gap: 1.5rem;">
        <andes-skeleton [active]="active()" />
        <span [style]="formItem">
          <andes-switch [checked]="active()" (checkedChange)="active.set($event)">Active</andes-switch>
        </span>
      </div>
    `,
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

/**
 * The button, avatar, input, image and node placeholders, with Ant's controls: Active, Button and
 * Input Block, Size, Button Shape and Avatar Shape.
 */
export const ButtonAvatarInputImageNode: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'The button, avatar, input, image and node placeholders, with the controls of the Ant Design demo: Active, Button and Input Block, Size, Button Shape and Avatar Shape.',
      },
    },
  },
  name: 'Button/Avatar/Input/Image/Node',
  render: () => ({
    props: {
      active: signal(false),
      block: signal(false),
      size: signal<AndesSkeletonSize>('md'),
      buttonShape: signal<AndesSkeletonButtonShape>('default'),
      avatarShape: signal<AndesSkeletonAvatarShape>('circle'),
      formItem,
      formRow,
      divider,
    },
    template: `
      <div style="display: flex; flex-direction: column; gap: 1rem;">
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <andes-skeleton-button [active]="active()" [size]="size()" [shape]="buttonShape()" />
          <andes-skeleton-avatar [active]="active()" [size]="size()" [shape]="avatarShape()" />
          <andes-skeleton-input [active]="active()" [size]="size()" />
        </div>
        <andes-skeleton-button [active]="active()" [size]="size()" [shape]="buttonShape()" [block]="block()" />
        <andes-skeleton-input [active]="active()" [size]="size()" [block]="block()" />
        <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem;">
          <andes-skeleton-image [active]="active()" />
          <andes-skeleton-node [active]="active()" [width]="160" />
          <andes-skeleton-node [active]="active()">
            <ng-icon name="lucideChartScatter" size="40" />
          </andes-skeleton-node>
        </div>
        <hr [style]="divider" />
        <div [style]="formRow" style="margin: 1rem 0;">
          <span [style]="formItem">
            <andes-switch [checked]="active()" (checkedChange)="active.set($event)">Active</andes-switch>
          </span>
          <span [style]="formItem">
            <andes-switch [checked]="block()" (checkedChange)="block.set($event)">Button and Input Block</andes-switch>
          </span>
          <span [style]="formItem">Size
            <andes-radio-group aria-label="Size" optionType="button" [value]="size()" (valueChange)="size.set($event ?? 'md')">
              <andes-radio value="lg">Large</andes-radio>
              <andes-radio value="md">Medium</andes-radio>
              <andes-radio value="sm">Small</andes-radio>
            </andes-radio-group>
          </span>
          <span [style]="formItem">Button Shape
            <andes-radio-group aria-label="Button Shape" optionType="button" [value]="buttonShape()" (valueChange)="buttonShape.set($event ?? 'default')">
              <andes-radio value="default">Default</andes-radio>
              <andes-radio value="square">Square</andes-radio>
              <andes-radio value="round">Round</andes-radio>
              <andes-radio value="circle">Circle</andes-radio>
            </andes-radio-group>
          </span>
          <span [style]="formItem">Avatar Shape
            <andes-radio-group aria-label="Avatar Shape" optionType="button" [value]="avatarShape()" (valueChange)="avatarShape.set($event ?? 'circle')">
              <andes-radio value="square">Square</andes-radio>
              <andes-radio value="circle">Circle</andes-radio>
            </andes-radio-group>
          </span>
        </div>
      </div>
    `,
  }),
};

/**
 * The skeleton wraps the real content: it shows the placeholder while `loading` is true and the
 * content once it is false. The Loading switch flips it; the button loads for three seconds.
 */
export const ContainsSubComponent: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'The skeleton wraps the real content, showing the placeholder while loading is true and the content once it is false: flip the Loading switch, or press the button to load for three seconds.',
      },
    },
  },
  name: 'Contains sub component',
  render: () => {
    // Signals, so the template follows the timeout (the page does not rely on zone.js).
    const loading = signal(false);
    let timer: ReturnType<typeof setTimeout> | undefined;
    return {
      props: {
        heading:
          'margin: 0 0 1rem; font-size: 1.25rem; line-height: 1.75rem; font-weight: 600;',
        body: `margin: 0; ${text}`,
        formItem,
        loading,
        show() {
          loading.set(true);
          clearTimeout(timer);
          timer = setTimeout(() => loading.set(false), 3000);
        },
      },
      template: `
      <div style="display: flex; flex-direction: column; align-items: flex-start; gap: 1rem;">
        <span [style]="formItem">
          <andes-switch [checked]="loading()" (checkedChange)="loading.set($event)">Loading</andes-switch>
        </span>
        <andes-skeleton [loading]="loading()" style="width: 100%;">
          <h4 [style]="heading">Ant Design, a design language</h4>
          <p [style]="body">
            We supply a series of design principles, practical patterns and high quality design
            resources (Sketch and Axure), to help people create their product prototypes beautifully
            and efficiently.
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
  title: `ant design part ${n}`,
  description:
    'Ant Design, a design language for background applications, is refined by Ant UED Team.',
  content:
    'We supply a series of design principles, practical patterns and high quality design resources (Sketch and Axure), to help people create their product prototypes beautifully and efficiently.',
}));

/**
 * A list of three items, each with its own skeleton (shimmering, with an avatar) while loading.
 * The switch loads the items; the loaded ones add their actions and a picture.
 */
export const List: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'A skeleton per list item while the list loads: flip the switch to show the loaded items, with their actions and picture. Built from plain layout, since there is no list component yet.',
      },
    },
  },
  render: () => ({
    props: {
      loaded: signal(false),
      items: listItems,
      text,
      formItem,
      link: 'color: var(--andes-color-primary-text); font-weight: 500; text-decoration: none;',
    },
    template: `
      <div style="display: flex; flex-direction: column; gap: 1rem;">
        <span [style]="formItem">
          <andes-switch [checked]="loaded()" (checkedChange)="loaded.set($event)">Loaded</andes-switch>
        </span>
        <div style="border-top: 1px solid var(--andes-color-border);">
          @for (item of items; track item.title) {
            <div style="display: flex; flex-wrap: wrap; gap: 1.5rem; padding: 1rem 1.5rem; border-bottom: 1px solid var(--andes-color-border);">
              <div style="display: flex; flex-direction: column; flex: 1 1 16rem; gap: 1rem; min-width: 0;">
                <andes-skeleton [loading]="!loaded()" active avatar>
                  <div style="display: flex; flex-direction: column; gap: 1rem;">
                    <div style="display: flex; gap: 1rem; align-items: flex-start;" [style]="text">
                      <andes-avatar size="lg"><andes-avatar-fallback>{{ item.initials }}</andes-avatar-fallback></andes-avatar>
                      <div style="display: flex; flex-direction: column;">
                        <a href="#" [style]="link" (click)="$event.preventDefault()">{{ item.title }}</a>
                        <span style="color: var(--andes-color-muted-foreground);">{{ item.description }}</span>
                      </div>
                    </div>
                    <span [style]="text">{{ item.content }}</span>
                  </div>
                </andes-skeleton>
                @if (loaded()) {
                  <div [style]="text" style="display: flex; align-items: center; gap: 0.5rem; color: var(--andes-color-muted-foreground);">
                    <span style="display: inline-flex; align-items: center; gap: 0.5rem;"><ng-icon name="lucideStar" size="16" />156</span>
                    <span aria-hidden="true">|</span>
                    <span style="display: inline-flex; align-items: center; gap: 0.5rem;"><ng-icon name="lucideThumbsUp" size="16" />156</span>
                    <span aria-hidden="true">|</span>
                    <span style="display: inline-flex; align-items: center; gap: 0.5rem;"><ng-icon name="lucideMessageSquare" size="16" />2</span>
                  </div>
                }
              </div>
              @if (loaded()) {
                <div role="img" aria-label="Preview" style="flex: none; width: 272px; height: 153px; border-radius: var(--andes-radius-md); background: linear-gradient(135deg, var(--andes-color-primary), var(--andes-color-muted));"></div>
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

/**
 * Style the skeleton's parts - root, header, section, avatar, title and paragraph - with
 * `classNames` and `styles`, as objects (first) or as functions of the inputs (second). The third
 * skeleton outlines every part; the element placeholders take `root` and `content`.
 */
export const CustomSemanticDomStyling: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Style the parts of the skeleton (root, header, section, avatar, title and paragraph) with classNames and styles, as objects (first) or as functions of the inputs (second); the third skeleton outlines every part, and the element placeholders take root and content.',
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
