import { CdkDrag, CdkDragHandle } from '@angular/cdk/drag-drop';
import { NgTemplateOutlet } from '@angular/common';
import { Directive, type OnInit, output } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideBell,
  lucideCheck,
  lucideCircleX,
  lucideCopy,
  lucideDownload,
  lucideFileText,
  lucideImage,
  lucideInfo,
  lucideKeyboard,
  lucideLock,
  lucideMail,
  lucideSettings,
  lucideShieldCheck,
  lucideSparkles,
  lucideTrash2,
  lucideTriangleAlert,
  lucideUserPlus,
} from '@ng-icons/lucide';
import { moduleMetadata, type Decorator } from '@storybook/angular';

import { AndesAvatar } from '../lib/avatar/avatar';
import { AndesAvatarFallback } from '../lib/avatar/avatar-fallback';
import { AndesButton } from '../lib/button/button';
import { AndesCheckbox } from '../lib/checkbox/checkbox';
import { ANDES_ALERT_DIALOG_IMPORTS } from '../lib/dialog/alert-dialog';
import { ANDES_DIALOG_IMPORTS } from '../lib/dialog/dialog';
import { AndesForm } from '../lib/form-field/form';
import { AndesFormField } from '../lib/form-field/form-field';
import { AndesImage } from '../lib/image/image';
import { AndesInput } from '../lib/input/input';
import { AndesRadio } from '../lib/radio-group/radio';
import { AndesRadioGroup } from '../lib/radio-group/radio-group';
import { AndesSegmented } from '../lib/segmented/segmented';
import { AndesSelect } from '../lib/select/select';
import { AndesSwitch } from '../lib/switch/switch';
import { AndesTag } from '../lib/tag/tag';
import { AndesTextarea } from '../lib/textarea/textarea';
import { AndesTooltip } from '../lib/tooltip/tooltip';
import { AndesTooltipTrigger } from '../lib/tooltip/tooltip-trigger';

/*
 * What the Dialog and Alert Dialog stories share: the text and layout styles, the line that
 * prints what the user chose, the decorator that prints a story's description, and one module
 * decorator with every component the stories compose. Internal to the stories: excluded from
 * the library build in `tsconfig.lib.json`.
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

/** The small label above a variant or a control. */
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

/** A row of buttons (the triggers of a story). */
export const row =
  'display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem;';

/** A column of body copy inside a dialog. */
export const stack = 'display: flex; flex-direction: column; gap: 0.75rem;';

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
  row,
  stack,
  divider,
  font,
};

/** The line under a demo that says what the user chose; `result` is a signal of text. */
export const resultLine = `<p [style]="muted" style="margin: 1rem 0 0;">Result: <strong [style]="strong">{{ result() }}</strong></p>`;

/** The text of `result` before anything was chosen. */
export const NOTHING_YET = 'Nothing yet.';

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
  // A curly brace in the sentence would open an ICU message in the template.
  const escaped = description
    ?.replace(/\{/g, '&#123;')
    .replace(/\}/g, '&#125;');
  return description
    ? {
        ...rendered,
        template: `<p style="max-width: 40rem; margin: 0 0 1.5rem; ${muted}">${escaped}</p>${rendered.template}`,
      }
    : rendered;
};

/**
 * Emits when the element it sits on is created, so a story can count how many times a
 * dialog built its content.
 */
@Directive({ selector: '[andesStoryCreated]' })
export class AndesStoryCreated implements OnInit {
  readonly andesStoryCreated = output<void>();

  ngOnInit(): void {
    this.andesStoryCreated.emit();
  }
}

/**
 * A picture drawn as SVG, so the stories need no network and look the same everywhere: a sky
 * gradient, a sun and two ridges of hills, in one of five palettes.
 */
const SCENES = [
  {
    sky: ['#fde68a', '#fb923c'],
    sun: '#fff7ed',
    hills: ['#7c3aed', '#3b0764'],
  },
  {
    sky: ['#bae6fd', '#38bdf8'],
    sun: '#ffffff',
    hills: ['#16a34a', '#14532d'],
  },
  {
    sky: ['#c7d2fe', '#6366f1'],
    sun: '#e0e7ff',
    hills: ['#312e81', '#1e1b4b'],
  },
  {
    sky: ['#fecdd3', '#fb7185'],
    sun: '#fff1f2',
    hills: ['#be123c', '#4c0519'],
  },
  {
    sky: ['#a7f3d0', '#2dd4bf'],
    sun: '#f0fdfa',
    hills: ['#0f766e', '#042f2e'],
  },
];

/** A data URI of the `index`-th scene. */
export function scene(index: number, width = 960, height = 640): string {
  const palette = SCENES[Math.abs(index) % SCENES.length];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${palette.sky[0]}"/><stop offset="1" stop-color="${palette.sky[1]}"/></linearGradient></defs><rect width="${width}" height="${height}" fill="url(#g)"/><circle cx="${width * (0.25 + 0.12 * (index % 4))}" cy="${height * 0.3}" r="${height * 0.09}" fill="${palette.sun}" opacity="0.9"/><path d="M0 ${height * 0.78} Q ${width * 0.25} ${height * 0.5} ${width * 0.5} ${height * 0.72} T ${width} ${height * 0.66} V ${height} H0 Z" fill="${palette.hills[0]}"/><path d="M0 ${height * 0.9} Q ${width * 0.3} ${height * 0.68} ${width * 0.6} ${height * 0.86} T ${width} ${height * 0.8} V ${height} H0 Z" fill="${palette.hills[1]}"/></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/** Imports and icons for every component the Dialog and Alert Dialog stories compose. */
export const withDialogKit: Decorator = moduleMetadata({
  imports: [
    ANDES_DIALOG_IMPORTS,
    ANDES_ALERT_DIALOG_IMPORTS,
    AndesAvatar,
    AndesAvatarFallback,
    AndesButton,
    AndesCheckbox,
    AndesForm,
    AndesFormField,
    AndesImage,
    AndesInput,
    AndesRadio,
    AndesRadioGroup,
    AndesSegmented,
    AndesSelect,
    AndesStoryCreated,
    AndesSwitch,
    AndesTag,
    AndesTextarea,
    AndesTooltip,
    AndesTooltipTrigger,
    CdkDrag,
    CdkDragHandle,
    FormsModule,
    NgIcon,
    NgTemplateOutlet,
    ReactiveFormsModule,
  ],
  providers: [
    provideIcons({
      lucideBell,
      lucideCheck,
      lucideCircleX,
      lucideCopy,
      lucideDownload,
      lucideFileText,
      lucideImage,
      lucideInfo,
      lucideKeyboard,
      lucideLock,
      lucideMail,
      lucideSettings,
      lucideShieldCheck,
      lucideSparkles,
      lucideTrash2,
      lucideTriangleAlert,
      lucideUserPlus,
    }),
  ],
});
