import { signal } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular';

import {
  about,
  loadedSwitch,
  shared,
  withDescription,
  withSkeletonKit,
} from '../../testing/skeleton-story-kit';
import { AndesSkeleton } from './skeleton';

/*
 * What the placeholders do for people who cannot see them, who ask for less motion, who use the
 * dark theme or who read right to left.
 */

const meta: Meta<AndesSkeleton> = {
  title: 'Feedback/Skeleton/Accessibility and motion',
  component: AndesSkeleton,
  decorators: [withDescription, withSkeletonKit],
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<AndesSkeleton>;

/** The status that announces loading and loaded. */
export const LoadedLabel: Story = {
  name: 'Loaded label',
  parameters: about(
    'The bars are hidden from assistive technology and one visually hidden status says Loading while the placeholder shows (loadingLabel) and, with loadedLabel, that the content is ready, a status that stays in the page for good so that screen readers announce the change.',
  ),
  render: () => ({
    props: { ...shared, loaded: signal(false) },
    template: `
      <div style="display: flex; flex-direction: column; gap: 1rem; max-width: 26rem;">
        ${loadedSwitch}
        <andes-skeleton
          [loading]="!loaded()"
          active
          avatar
          loadingLabel="Loading your profile"
          loadedLabel="Your profile has loaded"
        >
          <div style="display: flex; gap: 1rem;" [style]="text">
            <andes-avatar size="lg"><andes-avatar-fallback>LM</andes-avatar-fallback></andes-avatar>
            <div style="display: flex; flex-direction: column;">
              <span [style]="strong">Lucía Mendoza</span>
              <span [style]="muted">Product designer, Lima</span>
            </div>
          </div>
        </andes-skeleton>
        <ul [style]="muted" style="margin: 0; padding-inline-start: 1.25rem;">
          <li>The bars are aria-hidden; the host is not aria-busy, so the status is not held back.</li>
          <li>The status is a polite, atomic live region (role="status").</li>
          <li>Announced while loading: "Loading your profile". After it: "Your profile has loaded".</li>
        </ul>
      </div>
    `,
  }),
};

/** Standalone elements are decorative. */
export const StatusForStandaloneElements: Story = {
  name: 'Status for standalone elements',
  parameters: about(
    'The standalone element placeholders are decorative, so the region they sit in carries its own single status text, and is not aria-busy because screen readers may hold back a status announcement from inside a busy region.',
  ),
  render: () => ({
    template: `
      <div style="display: flex; align-items: center; gap: 0.75rem;">
        <span role="status" style="position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0, 0, 0, 0);">Loading form…</span>
        <andes-skeleton-input active />
        <andes-skeleton-button active />
      </div>
    `,
  }),
};

/** The three animations under `prefers-reduced-motion`. */
export const ReducedMotion: Story = {
  name: 'Reduced motion',
  parameters: about(
    'When the operating system asks for less motion (prefers-reduced-motion: reduce) every animation stops and the placeholders stand still as plain fills, and kept content appears without a fade, so turn the setting on, or emulate it in the browser tools, and these three stop.',
  ),
  render: () => ({
    props: { ...shared },
    template: `
      <div style="display: flex; flex-direction: column; gap: 1.5rem; max-width: 26rem;">
        <div><p [style]="muted" style="margin: 0 0 0.75rem;">shimmer</p><andes-skeleton animation="shimmer" avatar /></div>
        <div><p [style]="muted" style="margin: 0 0 0.75rem;">pulse</p><andes-skeleton animation="pulse" avatar /></div>
        <div><p [style]="muted" style="margin: 0 0 0.75rem;">none</p><andes-skeleton animation="none" avatar /></div>
      </div>
    `,
  }),
};

/** The dark theme. */
export const DarkMode: Story = {
  name: 'Dark mode',
  parameters: about(
    'The dark theme: the fill is the foreground colour at 12% (6% on the light theme) and the shimmer band at 18%, so the placeholders read on the page, on a card and on a popover alike.',
  ),
  globals: { theme: 'dark' },
  render: () => ({
    props: { ...shared },
    template: `
      <div style="display: flex; flex-direction: column; gap: 1.5rem; max-width: 26rem;">
        <andes-skeleton active avatar [paragraph]="{ rows: 3 }" />
        <div [style]="card" style="display: flex; flex-direction: column; gap: 1rem;">
          <andes-skeleton active avatar />
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <andes-skeleton-button active />
            <andes-skeleton-avatar active />
            <andes-skeleton-input active />
          </div>
          <andes-skeleton-image active width="100%" height="6rem" />
        </div>
      </div>
    `,
  }),
};

/** A right-to-left document. */
export const RightToLeft: Story = {
  name: 'Right to left',
  parameters: {
    dir: 'rtl',
    ...about(
      'A right-to-left document: the layout mirrors, and the shimmer sweeps with the reading direction, from right to left.',
    ),
  },
  render: () => ({
    template: `
      <div style="display: flex; flex-direction: column; gap: 1.5rem; max-width: 26rem;">
        <andes-skeleton active avatar [paragraph]="{ rows: 3 }" />
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <andes-skeleton-button active />
          <andes-skeleton-avatar active />
          <andes-skeleton-input active />
        </div>
        <andes-skeleton-text active [lines]="3" />
      </div>
    `,
  }),
};
