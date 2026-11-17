import { InjectionToken, type Provider } from '@angular/core';

import { AndesTooltipGroup } from './tooltip-group';

/**
 * Defaults a group of tooltips shares. Every field is optional, and a tooltip's own
 * input always wins over it.
 */
export interface AndesTooltipConfig {
  /**
   * Show only one tooltip of the group at a time, and let it glide from the trigger
   * it was on to the next one instead of closing there and opening anew. Moving
   * between triggers also skips the open delay. Default `false`.
   */
  readonly unique?: boolean;
  /** Default `openDelay`, in ms. */
  readonly openDelay?: number;
  /** Default `closeDelay`, in ms. */
  readonly closeDelay?: number;
  /** Default `instantReopenWindow`, in ms. */
  readonly instantReopenWindow?: number;
}

/** What the tooltips of a group read their shared defaults from. */
export interface AndesTooltipConfigSource {
  /** Read inside a `computed`, so a change reaches every tooltip of the group. */
  readonly config: () => AndesTooltipConfig;
}

/**
 * Where a tooltip finds its group's shared defaults: the nearest
 * {@link provideAndesTooltipConfig} or `andesTooltipProvider` above it.
 */
export const ANDES_TOOLTIP_CONFIG =
  new InjectionToken<AndesTooltipConfigSource>('ANDES_TOOLTIP_CONFIG');

/**
 * Shares defaults, and a "grouping" clock, between the tooltips below the place it is
 * provided - the application (`bootstrapApplication`'s `providers`) or one component's
 * `providers`. This is the counterpart of shadcn's `TooltipProvider` (`delayDuration`,
 * `skipDelayDuration`) and of Ant Design's `ConfigProvider` `tooltip.unique`.
 *
 * ```ts
 * bootstrapApplication(App, {
 *   providers: [provideAndesTooltipConfig({ unique: true, openDelay: 300 })],
 * });
 * ```
 *
 * For a part of a template, use the `andesTooltipProvider` directive instead.
 */
export function provideAndesTooltipConfig(
  config: AndesTooltipConfig,
): Provider[] {
  return [
    // A group of its own, so a provider in a component's `providers` does not share
    // its open tooltip with the rest of the page.
    AndesTooltipGroup,
    { provide: ANDES_TOOLTIP_CONFIG, useValue: { config: () => config } },
  ];
}
