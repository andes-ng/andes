import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideArrowLeft,
  lucideArrowRight,
  lucideBold,
  lucideCheck,
  lucideChevronDown,
  lucideDownload,
  lucideItalic,
  lucideLoaderCircle,
  lucidePencil,
  lucidePlus,
  lucideRotateCcw,
  lucideSave,
  lucideSearch,
  lucideSend,
  lucideTrash2,
  lucideUnderline,
  lucideZoomIn,
  lucideZoomOut,
} from '@ng-icons/lucide';
import { moduleMetadata, type Decorator } from '@storybook/angular';

import { AndesButton } from '../lib/button/button';
import { AndesButtonGroup } from '../lib/button/button-group';
import { AndesTooltip } from '../lib/tooltip/tooltip';
import { AndesTooltipTrigger } from '../lib/tooltip/tooltip-trigger';

/*
 * What the Button stories share: the layout styles, the decorator that prints a story's
 * description, and the library parts and lucide icons the stories draw. Internal to the
 * stories: excluded from the library build in `tsconfig.lib.json`.
 */

const font = 'font-family: var(--andes-font-family), sans-serif;';

/** Muted body text. */
export const muted = `${font} font-size: 0.875rem; line-height: 1.25rem; color: var(--andes-color-muted-foreground);`;

/** A small caption. */
export const caption = `${font} font-size: 0.75rem; line-height: 1.25rem; color: var(--andes-color-muted-foreground);`;

/** A wrapping row of buttons. */
export const bar =
  'display: flex; flex-wrap: wrap; align-items: center; gap: 0.75rem;';

/** Blocks stacked one under the other. */
export const column =
  'display: flex; flex-direction: column; align-items: flex-start; gap: 1rem;';

/** A labelled block: the caption over the buttons. */
export const field =
  'display: flex; flex-direction: column; align-items: flex-start; gap: 0.375rem;';

/** A dark surface, for the buttons made for dark backdrops. */
export const darkBox =
  'display: flex; flex-wrap: wrap; align-items: center; gap: 0.75rem; padding: 1.5rem; border-radius: var(--andes-radius-lg); background: #0f172a;';

/** A pale surface for floating buttons, so their shadow has something to fall on. */
export const floor =
  'display: flex; flex-wrap: wrap; align-items: center; gap: 1.5rem; padding: 2rem; border-radius: var(--andes-radius-lg); background: var(--andes-color-muted);';

/** The description of a story, in the shape Storybook reads it. */
export function about(story: string) {
  return { docs: { description: { story } } };
}

/**
 * Prints the story's one-sentence description above the example, so it reads in the canvas as
 * well as in the docs page.
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

/** The parts and icons the Button stories draw. */
export const withButtonKit: Decorator = moduleMetadata({
  imports: [
    AndesButton,
    AndesButtonGroup,
    AndesTooltip,
    AndesTooltipTrigger,
    NgIcon,
  ],
  providers: [
    provideIcons({
      lucideArrowLeft,
      lucideArrowRight,
      lucideBold,
      lucideCheck,
      lucideChevronDown,
      lucideDownload,
      lucideItalic,
      lucideLoaderCircle,
      lucidePencil,
      lucidePlus,
      lucideRotateCcw,
      lucideSave,
      lucideSearch,
      lucideSend,
      lucideTrash2,
      lucideUnderline,
      lucideZoomIn,
      lucideZoomOut,
    }),
  ],
});
