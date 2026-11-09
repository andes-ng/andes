import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideActivity,
  lucideBell,
  lucideCalendar,
  lucideChartColumn,
  lucideCheck,
  lucideCircleAlert,
  lucideCode,
  lucideCreditCard,
  lucideDownload,
  lucideEllipsis,
  lucideFileText,
  lucideFolder,
  lucideGlobe,
  lucideHouse,
  lucideImage,
  lucideInbox,
  lucideInfo,
  lucideKeyboard,
  lucideLayoutGrid,
  lucideList,
  lucideLock,
  lucideMail,
  lucideMessageSquare,
  lucidePalette,
  lucidePlus,
  lucideRefreshCw,
  lucideSearch,
  lucideSettings,
  lucideShieldCheck,
  lucideStar,
  lucideTable,
  lucideTrash2,
  lucideUser,
  lucideUsers,
  lucideX,
} from '@ng-icons/lucide';
import { type Decorator, moduleMetadata } from '@storybook/angular';

import { AndesAvatar } from '../lib/avatar/avatar';
import { AndesAvatarFallback } from '../lib/avatar/avatar-fallback';
import { AndesBadge } from '../lib/badge/badge';
import { AndesButton } from '../lib/button/button';
import { ANDES_ALERT_DIALOG_IMPORTS } from '../lib/dialog/alert-dialog';
import { ANDES_DIALOG_IMPORTS } from '../lib/dialog/dialog';
import { AndesDropdownMenu } from '../lib/dropdown-menu/dropdown-menu';
import { AndesDropdownMenuTrigger } from '../lib/dropdown-menu/dropdown-menu-trigger';
import { AndesEmpty } from '../lib/empty/empty';
import { AndesFormField } from '../lib/form-field/form-field';
import { AndesInput } from '../lib/input/input';
import { AndesSegmented } from '../lib/segmented/segmented';
import { AndesSelect } from '../lib/select/select';
import { AndesSelectContent } from '../lib/select/select-content';
import { AndesSelectItem } from '../lib/select/select-item';
import { AndesSelectTrigger } from '../lib/select/select-trigger';
import { AndesSelectValue } from '../lib/select/select-value';
import { AndesSkeleton } from '../lib/skeleton/skeleton';
import { AndesSkeletonAvatar } from '../lib/skeleton/skeleton-avatar';
import { AndesSkeletonButton } from '../lib/skeleton/skeleton-button';
import { AndesSkeletonText } from '../lib/skeleton/skeleton-text';
import { AndesSwitch } from '../lib/switch/switch';
import { AndesTabs } from '../lib/tabs/tabs';
import {
  AndesTabsContent,
  AndesTabsContentLazy,
} from '../lib/tabs/tabs-content';
import { AndesTabsList } from '../lib/tabs/tabs-list';
import { AndesTabsTrigger } from '../lib/tabs/tabs-trigger';
import { AndesTag } from '../lib/tag/tag';
import { AndesTooltip } from '../lib/tooltip/tooltip';
import { AndesTooltipTrigger } from '../lib/tooltip/tooltip-trigger';

/*
 * What the Tabs stories share: the layout and text styles, the helpers that write a story's
 * one-sentence description and the markup of a sample tab set, the decorator that prints the
 * description above the example, and one module decorator with the components and lucide icons
 * the stories compose. Internal to the stories: excluded from the library build in
 * `tsconfig.lib.json`.
 */

export const font = 'font-family: var(--andes-font-family), sans-serif;';

/** Body text. */
export const text = `${font} font-size: 0.875rem; line-height: 1.25rem; color: var(--andes-color-foreground);`;

/** Secondary text. */
export const muted = `${font} font-size: 0.875rem; line-height: 1.25rem; color: var(--andes-color-muted-foreground);`;

/** Emphasised body text. */
export const strong = `${font} font-size: 0.875rem; line-height: 1.25rem; font-weight: 600; color: var(--andes-color-foreground);`;

/** The small label above a variant. */
export const caption = `${font} display: block; margin: 0 0 0.5rem; font-size: 0.75rem; line-height: 1rem; color: var(--andes-color-muted-foreground);`;

/** A small heading. */
export const heading = `${font} margin: 0; font-size: 1rem; line-height: 1.5rem; font-weight: 600; color: var(--andes-color-foreground);`;

/** A paragraph inside a panel. */
export const para = `${text} margin: 0;`;

/** A column of examples, 1.5rem apart, at a readable width. */
export const column =
  'display: flex; flex-direction: column; gap: 1.5rem; width: min(36rem, calc(100vw - 2rem));';

/** A wider column, for bars that carry extra content or many tabs. */
export const wide =
  'display: flex; flex-direction: column; gap: 1.5rem; width: min(48rem, calc(100vw - 2rem));';

/** A row of controls. */
export const row =
  'display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem;';

/** Captioned examples side by side. */
export const columns =
  'display: grid; grid-template-columns: repeat(auto-fit, minmax(18rem, 1fr)); gap: 1.5rem; width: min(60rem, calc(100vw - 2rem));';

/** A card surface for the compositions. */
export const card =
  'box-sizing: border-box; border: 1px solid var(--andes-color-border); border-radius: var(--andes-radius-lg); background: var(--andes-color-card); color: var(--andes-color-card-foreground);';

/** One labelled switch or select of a demo's controls. */
export const control = `display: inline-flex; align-items: center; gap: 0.5rem; ${text}`;

/** The styles every story template may read, to spread into its `props`. */
export const shared = {
  text,
  muted,
  strong,
  caption,
  heading,
  para,
  column,
  wide,
  row,
  columns,
  card,
  control,
};

/** The tab names the samples use. */
export const SAMPLE = ['Account', 'Password', 'Team'] as const;

/** The panel text of the sample tab set. */
export const SAMPLE_TEXT: Record<string, string> = {
  account: 'Update your account details here.',
  password: 'Change your password here.',
  team: 'Manage your team here.',
};

/**
 * Three tabs and their panels: Account, Password and Team (`disabledTeam` switches the last
 * one off), as projected markup.
 */
export function basicTabs(disabledTeam = false): string {
  return `<andes-tabs-list>
      <andes-tabs-trigger value="account">Account</andes-tabs-trigger>
      <andes-tabs-trigger value="password">Password</andes-tabs-trigger>
      <andes-tabs-trigger value="team"${disabledTeam ? ' disabled' : ''}>Team</andes-tabs-trigger>
    </andes-tabs-list>
    <andes-tabs-content value="account"><p [style]="para">${SAMPLE_TEXT['account']}</p></andes-tabs-content>
    <andes-tabs-content value="password"><p [style]="para">${SAMPLE_TEXT['password']}</p></andes-tabs-content>
    <andes-tabs-content value="team"><p [style]="para">${SAMPLE_TEXT['team']}</p></andes-tabs-content>`;
}

/** The sample tab set in an `<andes-tabs>` with `attributes` on it. */
export function tabsOf(attributes = '', body = basicTabs()): string {
  return `<andes-tabs ${attributes}>${body}</andes-tabs>`;
}

/** The names of `count` numbered tabs. */
export function numbered(count: number, label = 'Tab'): string[] {
  return Array.from({ length: count }, (_, i) => `${label} ${i + 1}`);
}

/** The items of `count` numbered tabs, for the `[items]` input. */
export function numberedItems(count: number, label = 'Tab') {
  return numbered(count, label).map((name, i) => ({
    key: `tab-${i + 1}`,
    label: name,
    content: `Content of ${name}`,
  }));
}

/** A signal that follows a media query, so a story can show a phone layout for real. */
export function mediaQuery(query: string) {
  const state = signal(false);
  if (typeof window !== 'undefined' && window.matchMedia) {
    const list = window.matchMedia(query);
    state.set(list.matches);
    list.addEventListener('change', (event) => state.set(event.matches));
  }
  return state;
}

/** Adds (or replaces) a `<style>` in the page, for the classes a `classNames` story hands out. */
export function injectStyle(id: string, css: string): void {
  if (typeof document === 'undefined') {
    return;
  }
  let element = document.getElementById(id);
  if (!element) {
    element = document.createElement('style');
    element.id = id;
    document.head.appendChild(element);
  }
  element.textContent = css;
}

/** Moves real keyboard-modality focus onto the `index`-th tab of the first Tabs in `root`. */
export function focusTab(root: ParentNode, index: number): void {
  const buttons = root.querySelectorAll<HTMLElement>('[role="tab"]');
  buttons[index]?.focus({ focusVisible: true } as FocusOptions);
}

/**
 * A panel whose content has state of its own: when it was created and a click counter, so a
 * story can show whether a tab switch kept the panel alive or built it again.
 */
@Component({
  selector: 'andes-story-counter',
  imports: [AndesButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p
      style="${font} font-size: 0.875rem; line-height: 1.25rem; margin: 0 0 0.5rem;"
    >
      Created at {{ createdAt }}. Clicks kept in this panel: {{ clicks() }}
    </p>
    <andes-button size="sm" variant="outline" (click)="clicks.set(clicks() + 1)"
      >Count a click</andes-button
    >
  `,
})
export class StoryCounter {
  protected readonly createdAt = new Date().toLocaleTimeString();
  protected readonly clicks = signal(0);
}

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

/** Every component and icon the Tabs stories draw with. */
export const withTabsKit: Decorator = moduleMetadata({
  imports: [
    ANDES_ALERT_DIALOG_IMPORTS,
    ANDES_DIALOG_IMPORTS,
    AndesAvatar,
    AndesAvatarFallback,
    AndesBadge,
    AndesButton,
    AndesDropdownMenu,
    AndesDropdownMenuTrigger,
    AndesEmpty,
    AndesFormField,
    AndesInput,
    AndesSegmented,
    AndesSelect,
    AndesSelectContent,
    AndesSelectItem,
    AndesSelectTrigger,
    AndesSelectValue,
    AndesSkeleton,
    AndesSkeletonAvatar,
    AndesSkeletonButton,
    AndesSkeletonText,
    AndesSwitch,
    AndesTabs,
    AndesTabsContent,
    AndesTabsContentLazy,
    AndesTabsList,
    AndesTabsTrigger,
    AndesTag,
    AndesTooltip,
    AndesTooltipTrigger,
    FormsModule,
    NgIcon,
    NgTemplateOutlet,
    StoryCounter,
  ],
  providers: [
    provideIcons({
      lucideActivity,
      lucideBell,
      lucideCalendar,
      lucideChartColumn,
      lucideCheck,
      lucideCircleAlert,
      lucideCode,
      lucideCreditCard,
      lucideDownload,
      lucideEllipsis,
      lucideFileText,
      lucideFolder,
      lucideGlobe,
      lucideHouse,
      lucideImage,
      lucideInbox,
      lucideInfo,
      lucideKeyboard,
      lucideLayoutGrid,
      lucideList,
      lucideLock,
      lucideMail,
      lucideMessageSquare,
      lucidePalette,
      lucidePlus,
      lucideRefreshCw,
      lucideSearch,
      lucideSettings,
      lucideShieldCheck,
      lucideStar,
      lucideTable,
      lucideTrash2,
      lucideUser,
      lucideUsers,
      lucideX,
    }),
  ],
});
