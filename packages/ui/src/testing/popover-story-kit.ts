import type { WritableSignal } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import {
  lucideArchive,
  lucideBell,
  lucideCheck,
  lucideCircleHelp,
  lucideCopy,
  lucideFilter,
  lucideInfo,
  lucideLink,
  lucideLock,
  lucideLogOut,
  lucideMail,
  lucideMapPin,
  lucidePencil,
  lucideSave,
  lucideSettings,
  lucideShare2,
  lucideStar,
  lucideTrash2,
  lucideTriangleAlert,
  lucideUndo2,
  lucideUser,
  lucideX,
} from '@ng-icons/lucide';
import { moduleMetadata, type Decorator } from '@storybook/angular';

import { ANDES_POPOVER_PLACEMENTS } from '../lib/popover/popover-types';

/*
 * What the Popover and Popconfirm stories share: the text and layout styles, the lists the
 * controls choose from, the decorator that prints a story's description, and the icons the
 * stories draw. Internal to the stories: excluded from the library build in
 * `tsconfig.lib.json`.
 */

export const font = 'font-family: var(--andes-font-family), sans-serif;';

/** Body text. */
export const text = `${font} font-size: 0.875rem; line-height: 1.25rem; color: var(--andes-color-foreground);`;

/** Secondary text. */
export const muted = `${font} font-size: 0.875rem; line-height: 1.25rem; color: var(--andes-color-muted-foreground);`;

/** The small label above a control. */
export const caption = `${font} font-size: 0.75rem; line-height: 1.25rem; color: var(--andes-color-muted-foreground);`;

/** A row of buttons and controls. */
export const bar =
  'display: flex; flex-wrap: wrap; align-items: center; gap: 0.75rem;';

/** Blocks stacked one under the other. */
export const column =
  'display: flex; flex-direction: column; align-items: flex-start; gap: 1rem;';

/** A labelled control: the caption over the control. */
export const field =
  'display: flex; flex-direction: column; align-items: flex-start; gap: 0.25rem;';

/** The surface that holds a demo's controls. */
export const panel =
  'display: flex; flex-direction: column; align-items: flex-start; gap: 1rem; max-width: 40rem; padding: 1.25rem; border: 1px solid var(--andes-color-border); border-radius: var(--andes-radius-lg); background: var(--andes-color-card);';

/**
 * A stage with room around its triggers, so a panel on any side stays inside the canvas:
 * a centred, wrapping row.
 */
export const stage =
  'display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 1rem; padding: 6rem 1rem;';

/** The same with more room, for the stories that open several panels at once. */
export const wideStage =
  'display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 1.5rem; padding: 8rem 1rem;';

/** A three-column grid of triggers with room for a panel on every side. */
export const grid =
  'display: grid; grid-template-columns: repeat(3, minmax(0, 8.5rem)); justify-content: center; gap: 3.5rem 1.5rem; padding: 6rem 1rem;';

/** A block of code. */
export const code = `${font} display: block; box-sizing: border-box; margin: 0; padding: 0.75rem 1rem; max-width: min(40rem, 100%); overflow-x: auto; border-radius: var(--andes-radius-md); background: var(--andes-color-muted); color: var(--andes-color-foreground); font-family: ui-monospace, monospace; font-size: 0.8125rem; line-height: 1.25rem; white-space: pre;`;

/** A row of a list: the text on the left, the actions on the right. */
export const row =
  'display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: 0.625rem 0.75rem; border-bottom: 1px solid var(--andes-color-border);';

/** A list of rows in a bordered box. */
export const list =
  'display: flex; flex-direction: column; width: min(32rem, 100%); border: 1px solid var(--andes-color-border); border-radius: var(--andes-radius-lg); background: var(--andes-color-card);';

/** Body copy inside a panel. */
export const paragraph = 'margin: 0;';

/** The twelve placements, in the order of the reference grid. */
export const PLACEMENTS = Object.keys(
  ANDES_POPOVER_PLACEMENTS,
) as (keyof typeof ANDES_POPOVER_PLACEMENTS)[];

/** The same, as the options of a `andes-select` or a radio group. */
export const PLACEMENT_OPTIONS = PLACEMENTS.map((value) => ({
  value,
  label: value,
}));

/** The placements laid out the way they sit around a trigger: a 3 x 4 ring. */
export const PLACEMENT_RING: readonly (keyof typeof ANDES_POPOVER_PLACEMENTS)[] =
  [
    'topLeft',
    'top',
    'topRight',
    'leftTop',
    'rightTop',
    'left',
    'right',
    'leftBottom',
    'rightBottom',
    'bottomLeft',
    'bottom',
    'bottomRight',
  ];

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

/** The icons the Popover and Popconfirm stories draw with `ng-icon`. */
export const withPopoverKit: Decorator = moduleMetadata({
  providers: [
    provideIcons({
      lucideArchive,
      lucideBell,
      lucideCheck,
      lucideCircleHelp,
      lucideCopy,
      lucideFilter,
      lucideInfo,
      lucideLink,
      lucideLock,
      lucideLogOut,
      lucideMail,
      lucideMapPin,
      lucidePencil,
      lucideSave,
      lucideSettings,
      lucideShare2,
      lucideStar,
      lucideTrash2,
      lucideTriangleAlert,
      lucideUndo2,
      lucideUser,
      lucideX,
    }),
  ],
});

/**
 * Adds a stylesheet to the page once, for the stories whose panel is drawn outside the story's
 * own view, where a component style cannot reach it (a class given through `classNames` or
 * `panelClass`).
 */
export function addStoryCss(id: string, css: string): void {
  if (typeof document === 'undefined' || document.getElementById(id)) {
    return;
  }
  const style = document.createElement('style');
  style.id = id;
  style.textContent = css;
  document.head.appendChild(style);
}

/** Adds an entry to a log signal, newest first, keeping the last few. */
export function remember(log: WritableSignal<string[]>, entry: string): void {
  log.update((entries) => [entry, ...entries].slice(0, 5));
}
