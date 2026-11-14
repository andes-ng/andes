import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideAccessibility,
  lucideBlocks,
  lucideGlobe,
  lucideKeyboard,
  lucideLayers,
  lucidePalette,
  lucideShieldCheck,
  lucideSmartphone,
  lucideZap,
} from '@ng-icons/lucide';
import { type Decorator, moduleMetadata } from '@storybook/angular';

import { AndesAvatar, AndesAvatarFallback } from '../lib/avatar';
import { AndesButton } from '../lib/button';
import {
  AndesCarouselScroller,
  AndesCarouselScrollerItem,
} from '../lib/carousel';
import { AndesTag } from '../lib/tag';

/*
 * What the carousel scroller stories share: the sentence printed above each example, one
 * module decorator with the components and lucide icons they compose, the cards they scroll
 * and the styles of those cards. Internal to the stories: excluded from the library build in
 * `tsconfig.lib.json`.
 */

const font = 'font-family: var(--andes-font-family), sans-serif;';

/** Secondary text. */
export const muted = `${font} font-size: 0.875rem; line-height: 1.25rem; color: var(--andes-color-muted-foreground);`;

/** The small label above an example. */
export const caption = `${font} display: block; margin: 0 0 0.5rem; font-size: 0.75rem; line-height: 1rem; color: var(--andes-color-muted-foreground);`;

/** The description of a story, as the docs page keeps it. */
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
  // A curly brace in the sentence would open an ICU message in the template.
  const escaped = description
    ?.replace(/\{/g, '&#123;')
    .replace(/\}/g, '&#125;');
  return description
    ? {
        ...rendered,
        template: `<p style="max-width: 40rem; margin: 0 0 1.25rem; ${muted}">${escaped}</p>${rendered.template}`,
      }
    : rendered;
};

/** Every component and icon the carousel scroller stories draw with. */
export const withScrollerKit: Decorator = moduleMetadata({
  imports: [
    AndesCarouselScroller,
    AndesCarouselScrollerItem,
    AndesButton,
    AndesAvatar,
    AndesAvatarFallback,
    AndesTag,
    NgIcon,
  ],
  providers: [
    provideIcons({
      lucideAccessibility,
      lucideBlocks,
      lucideGlobe,
      lucideKeyboard,
      lucideLayers,
      lucidePalette,
      lucideShieldCheck,
      lucideSmartphone,
      lucideZap,
    }),
  ],
});

export interface Feature {
  readonly icon: string;
  readonly title: string;
  readonly text: string;
}

export interface Person {
  readonly initials: string;
  readonly name: string;
  readonly role: string;
}

/** The cards of the "Browse features" examples. */
export const FEATURES: readonly Feature[] = [
  {
    icon: 'lucideZap',
    title: 'Fast by default',
    text: 'Signals and OnPush keep every update small.',
  },
  {
    icon: 'lucideAccessibility',
    title: 'Accessible',
    text: 'Roles, names and keyboard support from the start.',
  },
  {
    icon: 'lucidePalette',
    title: 'Themeable',
    text: 'Design tokens and custom properties, no overrides.',
  },
  {
    icon: 'lucideGlobe',
    title: 'Right to left',
    text: 'Layouts mirror with the reading direction.',
  },
  {
    icon: 'lucideSmartphone',
    title: 'Touch friendly',
    text: 'Swipe, flick and drag where a finger is the input.',
  },
  {
    icon: 'lucideShieldCheck',
    title: 'Well tested',
    text: 'Every behaviour has a unit test behind it.',
  },
  {
    icon: 'lucideLayers',
    title: 'Composable',
    text: 'Small parts that combine into larger patterns.',
  },
  {
    icon: 'lucideBlocks',
    title: 'Standalone',
    text: 'Import only the components a page uses.',
  },
];

/** The cards of the "Team members" examples. */
export const PEOPLE: readonly Person[] = [
  { initials: 'AL', name: 'Ada Lovelace', role: 'Engineering' },
  { initials: 'GH', name: 'Grace Hopper', role: 'Platform' },
  { initials: 'KJ', name: 'Katherine Johnson', role: 'Data' },
  { initials: 'MH', name: 'Margaret Hamilton', role: 'Reliability' },
  { initials: 'HL', name: 'Hedy Lamarr', role: 'Research' },
  { initials: 'RP', name: 'Radia Perlman', role: 'Networking' },
  { initials: 'BL', name: 'Barbara Liskov', role: 'Architecture' },
  { initials: 'FA', name: 'Frances Allen', role: 'Tooling' },
];

/** A bordered card that fills its item and keeps its content apart. */
export const CARD =
  'display: flex; flex-direction: column; gap: 0.5rem; align-items: flex-start; box-sizing: border-box; height: 100%; padding: 1rem; border: 1px solid var(--andes-color-border); border-radius: 0.5rem; background: var(--andes-color-background);';

export const CARD_TITLE = `${font} margin: 0; font-size: 1rem; line-height: 1.5rem; font-weight: 600; color: var(--andes-color-foreground);`;

export const CARD_TEXT = `${font} margin: 0; flex: 1; font-size: 0.875rem; line-height: 1.25rem; color: var(--andes-color-muted-foreground);`;

/** The frame every example sits in: it decides how much of the row is in view. */
export const FRAME = 'max-width: 40rem;';

/** Props every template reads. */
export const shared = {
  features: FEATURES,
  people: PEOPLE,
  card: CARD,
  cardTitle: CARD_TITLE,
  cardText: CARD_TEXT,
  frame: FRAME,
  caption,
};

/** The cards of a "Browse features" row, as the items of a scroller. */
export function featureItems(from = 0, to = FEATURES.length): string {
  return `@for (feature of features.slice(${from}, ${to}); track feature.title) {
    <andes-carousel-scroller-item>
      <div [style]="card">
        <ng-icon [name]="feature.icon" size="1.5rem" aria-hidden="true" />
        <h3 [style]="cardTitle">{{ feature.title }}</h3>
        <p [style]="cardText">{{ feature.text }}</p>
        <andes-button variant="outline" size="sm">Learn more</andes-button>
      </div>
    </andes-carousel-scroller-item>
  }`;
}

/** The cards of a "Team members" row, as the items of a scroller. */
export function personItems(from = 0, to = PEOPLE.length): string {
  return `@for (person of people.slice(${from}, ${to}); track person.name) {
    <andes-carousel-scroller-item [label]="person.name">
      <div [style]="card">
        <andes-avatar size="lg"><andes-avatar-fallback>{{ person.initials }}</andes-avatar-fallback></andes-avatar>
        <h3 [style]="cardTitle">{{ person.name }}</h3>
        <p [style]="cardText">{{ person.role }}</p>
        <andes-tag>Team</andes-tag>
      </div>
    </andes-carousel-scroller-item>
  }`;
}
