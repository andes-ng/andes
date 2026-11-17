import { inject, signal } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import {
  lucideBell,
  lucideCopy,
  lucideEye,
  lucideFileText,
  lucidePartyPopper,
  lucideRefreshCw,
  lucideRocket,
  lucideSmile,
  lucideTimer,
  lucideTrash2,
  lucideUndo2,
  lucideUpload,
  lucideWifi,
  lucideWifiOff,
  lucideX,
} from '@ng-icons/lucide';
import { moduleMetadata, type Decorator } from '@storybook/angular';

import { AndesMessageService } from '../lib/toast/message.service';
import { AndesToastService } from '../lib/toast/toast.service';
import type {
  AndesToastPosition,
  AndesToastSeverity,
} from '../lib/toast/toast.types';

/*
 * What the Toast stories share: the text and layout styles, the base class every demo host
 * extends (it injects both services, the way an app would), the lists the controls choose
 * from, the decorator that prints a story's description, and the icons the stories draw.
 * Internal to the stories: excluded from the library build in `tsconfig.lib.json`.
 */

export const font = 'font-family: var(--andes-font-family), sans-serif;';

/** Body text. */
export const text = `${font} font-size: 0.875rem; line-height: 1.375rem; color: var(--andes-color-foreground);`;

/** Secondary text. */
export const muted = `${font} font-size: 0.875rem; line-height: 1.375rem; color: var(--andes-color-muted-foreground);`;

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

/** A block of code. */
export const code = `${font} display: block; box-sizing: border-box; margin: 0; padding: 0.75rem 1rem; max-width: min(40rem, 100%); overflow-x: auto; border-radius: var(--andes-radius-md); background: var(--andes-color-muted); color: var(--andes-color-foreground); font-family: ui-monospace, monospace; font-size: 0.8125rem; line-height: 1.25rem; white-space: pre;`;

/** The grid of the placement buttons: three columns, which wrap to two on a phone. */
export const placementGrid =
  'display: grid; grid-template-columns: repeat(auto-fill, minmax(8.5rem, 1fr)); max-width: 28rem; gap: 0.75rem;';

/** The four statuses a toast can carry besides `neutral` and `loading`. */
export const SEVERITIES: readonly AndesToastSeverity[] = [
  'success',
  'info',
  'warning',
  'error',
];

/** The six placements in reading order: top row, then bottom row. */
export const PLACEMENTS: readonly AndesToastPosition[] = [
  'top-left',
  'top-center',
  'top-right',
  'bottom-left',
  'bottom-center',
  'bottom-right',
];

/** The same, as the options of a `andes-select` or a radio group. */
export const PLACEMENT_OPTIONS = PLACEMENTS.map((value) => ({
  value,
  label: value,
}));

/** The titles the demos give each status. */
export const SEVERITY_TITLES: Record<string, string> = {
  success: 'Saved',
  info: 'Heads up',
  warning: 'Careful',
  error: 'Something failed',
};

/** The body text the demos give each status. */
export const SEVERITY_TEXTS: Record<string, string> = {
  success: 'Your changes were saved.',
  info: 'A new version is available.',
  warning: 'Your session will expire in 5 minutes.',
  error: 'The file could not be uploaded.',
};

/**
 * The base of every demo host: it injects the two services (what an app does with
 * `inject(AndesToastService)`), and carries the styles and the status line the templates use.
 */
export abstract class ToastDemo {
  protected readonly toasts = inject(AndesToastService);
  protected readonly messages = inject(AndesMessageService);
  protected readonly text = text;
  protected readonly muted = muted;
  protected readonly caption = caption;
  protected readonly bar = bar;
  protected readonly column = column;
  protected readonly field = field;
  protected readonly panel = panel;
  protected readonly code = code;
  protected readonly placementGrid = placementGrid;
  protected readonly severities = SEVERITIES;
  protected readonly placements = PLACEMENTS;
  protected readonly placementOptions = PLACEMENT_OPTIONS;
  /** What the last callback reported, printed under the buttons. */
  protected readonly status = signal('');

  /** Closes everything the two services hold. */
  protected clear(): void {
    this.toasts.destroy();
    this.messages.destroy();
  }
}

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

/** The icons the Toast stories draw with `ng-icon`. */
export const withToastKit: Decorator = moduleMetadata({
  providers: [
    provideIcons({
      lucideBell,
      lucideCopy,
      lucideEye,
      lucideFileText,
      lucidePartyPopper,
      lucideRefreshCw,
      lucideRocket,
      lucideSmile,
      lucideTimer,
      lucideTrash2,
      lucideUndo2,
      lucideUpload,
      lucideWifi,
      lucideWifiOff,
      lucideX,
    }),
  ],
});
