import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideChartScatter,
  lucideMessageSquare,
  lucideStar,
  lucideThumbsUp,
} from '@ng-icons/lucide';
import { moduleMetadata, type Decorator } from '@storybook/angular';

import { AndesAvatar } from '../lib/avatar/avatar';
import { AndesAvatarFallback } from '../lib/avatar/avatar-fallback';
import { AndesButton } from '../lib/button/button';
import { AndesInput } from '../lib/input/input';
import { AndesRadio } from '../lib/radio-group/radio';
import { AndesRadioGroup } from '../lib/radio-group/radio-group';
import { AndesSkeletonAvatar } from '../lib/skeleton/skeleton-avatar';
import { AndesSkeletonButton } from '../lib/skeleton/skeleton-button';
import { AndesSkeletonImage } from '../lib/skeleton/skeleton-image';
import { AndesSkeletonInput } from '../lib/skeleton/skeleton-input';
import { AndesSkeletonNode } from '../lib/skeleton/skeleton-node';
import { AndesSkeletonText } from '../lib/skeleton/skeleton-text';
import { AndesSwitch } from '../lib/switch/switch';
import { AndesTag } from '../lib/tag/tag';

/*
 * What the Skeleton stories share: the text and layout styles, the switch that flips a story
 * between its placeholder and its real content, the decorator that prints a story's description,
 * and one module decorator with every component the stories compose. Internal to the stories:
 * excluded from the library build in `tsconfig.lib.json`.
 */

export const font = 'font-family: var(--andes-font-family), sans-serif;';

/** Body text. */
export const text = `${font} font-size: 0.875rem; line-height: 1.375rem; color: var(--andes-color-foreground);`;

/** Secondary text. */
export const muted = `${font} font-size: 0.875rem; line-height: 1.375rem; color: var(--andes-color-muted-foreground);`;

/** Emphasised body text. */
export const strong = `${font} font-size: 0.875rem; line-height: 1.375rem; font-weight: 600; color: var(--andes-color-foreground);`;

/** A small heading. */
export const heading = `${font} margin: 0; font-size: 1rem; line-height: 1.5rem; font-weight: 600; color: var(--andes-color-foreground);`;

/** The small label above a variant (`Medium`, `round`, `pulse`). */
export const caption = `${font} font-size: 0.75rem; line-height: 1.25rem; color: var(--andes-color-muted-foreground);`;

/** A card surface. */
export const card =
  'padding: 1.5rem; border: 1px solid var(--andes-color-border); border-radius: var(--andes-radius-lg); background: var(--andes-color-card);';

/** A one-pixel rule. */
export const hairline = 'border-top: 1px solid var(--andes-color-border);';

/** A horizontal rule between a demo and its controls. */
export const divider =
  'width: 100%; margin: 0; border: 0; border-top: 1px solid var(--andes-color-border);';

/** One labelled control (a switch or a radio group) of a demo's controls row. */
export const formItem = `display: inline-flex; align-items: center; gap: 0.5rem; ${text}`;

/** The row that holds a demo's controls. */
export const formRow =
  'display: flex; flex-wrap: wrap; align-items: center; gap: 1rem;';

/** The styles every story template may read, to spread into its `props`. */
export const shared = {
  text,
  muted,
  strong,
  heading,
  caption,
  card,
  hairline,
  formItem,
  formRow,
  divider,
  font,
};

/** The switch above a composition: loading (off) or the real content (on). */
export const loadedSwitch = `<andes-switch [checked]="loaded()" (checkedChange)="loaded.set($event)">Loaded</andes-switch>`;

/** The `parameters` of a story with its one-sentence description. */
export function about(story: string) {
  return { docs: { description: { story } } };
}

/**
 * Prints the story's one-sentence description (`parameters.docs.description.story`) above the
 * example, so it reads in the canvas as well as in the docs page.
 */
export const withDescription: Decorator = (story, context) => {
  const rendered = story();
  const description = context.parameters['docs']?.description?.story;
  return description
    ? {
        ...rendered,
        template: `<p style="max-width: 40rem; margin: 0 0 1.5rem; ${muted}">${description}</p>${rendered.template}`,
      }
    : rendered;
};

/** Imports and icons for every component the Skeleton stories compose. */
export const withSkeletonKit: Decorator = moduleMetadata({
  imports: [
    AndesAvatar,
    AndesAvatarFallback,
    AndesButton,
    AndesInput,
    AndesRadio,
    AndesRadioGroup,
    AndesSkeletonAvatar,
    AndesSkeletonButton,
    AndesSkeletonImage,
    AndesSkeletonInput,
    AndesSkeletonNode,
    AndesSkeletonText,
    AndesSwitch,
    AndesTag,
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
});
