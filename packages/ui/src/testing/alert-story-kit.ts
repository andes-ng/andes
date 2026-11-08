import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideBell,
  lucideCreditCard,
  lucideDownload,
  lucideMinus,
  lucideRocket,
  lucideShieldCheck,
} from '@ng-icons/lucide';
import { type Decorator, moduleMetadata } from '@storybook/angular';

import { AndesAlert } from '../lib/alert/alert';
import { AndesButton } from '../lib/button/button';

/*
 * What the Alert stories share: the layout and text styles, the helper that writes a story's
 * one-sentence description, the decorator that prints it above the example, and one module
 * decorator with the components and lucide icons the stories compose. Internal to the stories:
 * excluded from the library build in `tsconfig.lib.json`.
 */

export const font = 'font-family: var(--andes-font-family), sans-serif;';

/** Secondary text. */
export const muted = `${font} font-size: 0.875rem; line-height: 1.375rem; color: var(--andes-color-muted-foreground);`;

/** The small label above a variant. */
export const caption = `${font} font-size: 0.75rem; line-height: 1.25rem; color: var(--andes-color-muted-foreground);`;

/** Alerts stacked 0.75rem apart, as they sit on a page. */
export const column =
  'display: flex; flex-direction: column; gap: 0.75rem; max-width: 40rem;';

/** A column narrow enough to make long text wrap. */
export const narrow =
  'display: flex; flex-direction: column; gap: 0.75rem; width: 22.5rem; max-width: 100%;';

/** A row of controls. */
export const bar =
  'display: flex; flex-wrap: wrap; align-items: center; gap: 0.75rem;';

/** Captioned columns side by side, one per variant. */
export const columns =
  'display: grid; grid-template-columns: repeat(auto-fit, minmax(19rem, 1fr)); gap: 1.5rem;';

/** The severities, in the order the stories show them. */
export const SEVERITIES = [
  'neutral',
  'success',
  'info',
  'warning',
  'danger',
] as const;

/** A short message and a title + description for each severity. */
export const SEVERITY_TEXTS: Record<
  (typeof SEVERITIES)[number],
  { message: string; title: string; description: string }
> = {
  neutral: {
    message: 'Drafts are kept for 30 days.',
    title: 'Note',
    description: 'Drafts are kept for 30 days and then deleted for good.',
  },
  success: {
    message: 'Your changes have been saved.',
    title: 'Saved',
    description: 'Your changes have been saved and are visible to the team.',
  },
  info: {
    message: 'A new version of the app is available.',
    title: 'Update available',
    description: 'Reload the page to get the latest version of the app.',
  },
  warning: {
    message: 'Your session will expire in 5 minutes.',
    title: 'Session expiring',
    description: 'Save your work now, or you will be signed out in 5 minutes.',
  },
  danger: {
    message: 'Something went wrong while saving your changes.',
    title: 'Could not save',
    description: 'The server did not answer. Check your connection and retry.',
  },
};

/** The story's one-sentence description, for `parameters`. */
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
        template: `<p style="max-width: 40rem; margin: 0 0 1.25rem; ${muted}">${description}</p>${rendered.template}`,
      }
    : rendered;
};

/** The components and icons the Alert stories draw with. */
export const withAlertKit: Decorator = moduleMetadata({
  imports: [AndesAlert, AndesButton, NgIcon],
  providers: [
    provideIcons({
      lucideBell,
      lucideCreditCard,
      lucideDownload,
      lucideMinus,
      lucideRocket,
      lucideShieldCheck,
    }),
  ],
});
