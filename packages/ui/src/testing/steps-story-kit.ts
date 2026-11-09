import { signal } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import {
  lucideArrowRight,
  lucideBadgeCheck,
  lucideBell,
  lucideBox,
  lucideBuilding2,
  lucideCalendar,
  lucideCheck,
  lucideCircleAlert,
  lucideCircleCheck,
  lucideCircleDashed,
  lucideClock,
  lucideCreditCard,
  lucideFileText,
  lucideFlag,
  lucideHouse,
  lucideLoader,
  lucideLock,
  lucideMail,
  lucideMapPin,
  lucidePackage,
  lucidePartyPopper,
  lucideRocket,
  lucideSettings,
  lucideShieldCheck,
  lucideStar,
  lucideTruck,
  lucideUser,
  lucideUsers,
  lucideWallet,
  lucideX,
} from '@ng-icons/lucide';
import { moduleMetadata, type Decorator } from '@storybook/angular';

/*
 * What the Steps stories share: the text and layout styles, the step lists the examples reuse,
 * the decorator that prints a story's description, and the icons the stories draw. Internal to
 * the stories: excluded from the library build in `tsconfig.lib.json`.
 */

export const font = 'font-family: var(--andes-font-family), sans-serif;';

/** Body text. */
export const text = `${font} font-size: 0.875rem; line-height: 1.25rem; color: var(--andes-color-foreground);`;

/** Secondary text. */
export const muted = `${font} font-size: 0.875rem; line-height: 1.25rem; color: var(--andes-color-muted-foreground);`;

/** The small label above an example. */
export const caption = `${font} margin: 0 0 0.75rem; font-size: 0.75rem; line-height: 1.25rem; color: var(--andes-color-muted-foreground);`;

/** A row of buttons and controls. */
export const bar =
  'display: flex; flex-wrap: wrap; align-items: center; gap: 0.75rem;';

/** Examples stacked one under the other with room between them. */
export const stack = 'display: grid; gap: 2.5rem;';

/** A surface that holds a demo, like a card. */
export const surface =
  'box-sizing: border-box; padding: 1.5rem; border: 1px solid var(--andes-color-border); border-radius: var(--andes-radius-lg); background: var(--andes-color-card);';

/** A frame with the width of a phone, to see how a trail behaves in a narrow container. */
export const phone =
  'box-sizing: border-box; width: 22.5rem; max-width: 100%; padding: 1rem; border: 1px dashed var(--andes-color-border); border-radius: var(--andes-radius-lg);';

/** A frame that can be dragged narrower, to watch the responsive collapse. */
export const resizable =
  'box-sizing: border-box; width: 36rem; max-width: 100%; min-width: 12rem; padding: 1rem; overflow: auto; resize: horizontal; border: 1px dashed var(--andes-color-border); border-radius: var(--andes-radius-lg);';

/** A block of code. */
export const code = `${font} display: block; box-sizing: border-box; margin: 0; padding: 0.75rem 1rem; max-width: min(40rem, 100%); overflow-x: auto; border-radius: var(--andes-radius-md); background: var(--andes-color-muted); color: var(--andes-color-foreground); font-family: ui-monospace, monospace; font-size: 0.8125rem; line-height: 1.25rem; white-space: pre;`;

/** The line that prints what a demo reported. */
export const readout = `${muted} margin: 0; min-height: 1.25rem;`;

/** One captioned example: the caption over the markup. */
export function demo(label: string, markup: string, style = ''): string {
  return `<div style="${style}"><p style="${caption}">${label}</p>${markup}</div>`;
}

/** Several captioned examples, one under the other. */
export function demos(...items: string[]): string {
  return `<div style="${stack}">${items.join('')}</div>`;
}

/** Four plain steps, the trail most examples start from. */
export const FOUR = `
  <andes-step title="Account" />
  <andes-step title="Billing" />
  <andes-step title="Review" />
  <andes-step title="Done" />`;

/** Four steps with a description under each. */
export const FOUR_DESCRIBED = `
  <andes-step title="Account" description="Create your login" />
  <andes-step title="Billing" description="Add a payment method" />
  <andes-step title="Review" description="Check the details" />
  <andes-step title="Done" description="Start using it" />`;

/** Three steps. */
export const THREE = `
  <andes-step title="Login" />
  <andes-step title="Verification" />
  <andes-step title="Done" />`;

/** Five steps. */
export const FIVE = `
  <andes-step title="Cart" />
  <andes-step title="Address" />
  <andes-step title="Shipping" />
  <andes-step title="Payment" />
  <andes-step title="Confirm" />`;

/** Seven steps, to see how a long trail fits. */
export const SEVEN = `
  <andes-step title="Draft" />
  <andes-step title="Edit" />
  <andes-step title="Review" />
  <andes-step title="Legal" />
  <andes-step title="Approve" />
  <andes-step title="Publish" />
  <andes-step title="Archive" />`;

/** Step titles for the trails the examples generate with a loop. */
export const TWELVE = [
  'Plan',
  'Design',
  'Build',
  'Test',
  'Review',
  'Stage',
  'Approve',
  'Release',
  'Monitor',
  'Learn',
  'Improve',
  'Close',
];

/** The parts a `classNames` or `styles` object can reach, for the controls and the docs. */
export const PARTS = [
  'root',
  'item',
  'icon',
  'content',
  'title',
  'subtitle',
  'description',
  'tail',
  'rail',
];

/**
 * The base of every demo host: the styles and the step the templates read, so a component
 * template can bind them (`[style]="bar"`).
 */
export abstract class StepsDemo {
  protected readonly text = text;
  protected readonly muted = muted;
  protected readonly caption = caption;
  protected readonly bar = bar;
  protected readonly surface = surface;
  protected readonly readout = readout;
  protected readonly stack = stack;
  /** The step in progress. */
  readonly step = signal(0);
}

/** The parameters of a story with its one-sentence description. */
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

/** The icons the Steps stories draw with `ng-icon`, registered for the story's module. */
export const withStepsKit: Decorator = moduleMetadata({
  providers: [
    provideIcons({
      lucideArrowRight,
      lucideBadgeCheck,
      lucideBell,
      lucideBox,
      lucideBuilding2,
      lucideCalendar,
      lucideCheck,
      lucideCircleAlert,
      lucideCircleCheck,
      lucideCircleDashed,
      lucideClock,
      lucideCreditCard,
      lucideFileText,
      lucideFlag,
      lucideHouse,
      lucideLoader,
      lucideLock,
      lucideMail,
      lucideMapPin,
      lucidePackage,
      lucidePartyPopper,
      lucideRocket,
      lucideSettings,
      lucideShieldCheck,
      lucideStar,
      lucideTruck,
      lucideUser,
      lucideUsers,
      lucideWallet,
      lucideX,
    }),
  ],
});
