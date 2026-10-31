import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';

import {
  ANDES_PLAYER_LABELS_ES,
  andesPlayerLabelsFor,
} from './core/player-label-sets';
import {
  CAPTIONS,
  frame,
  MEDIA,
  SOURCES,
  stack,
} from './testing/story-fixtures';
import { AndesVideoPlayer } from './video-player';

const meta: Meta<AndesVideoPlayer> = {
  title: 'Media/Video Player/Appearance',
  component: AndesVideoPlayer,
  decorators: [moduleMetadata({ imports: [AndesVideoPlayer] })],
};

export default meta;

type Story = StoryObj<AndesVideoPlayer>;

/**
 * The built-in label sets (`provideAndesPlayerLocale()` or `[labels]`): en, es, pt, fr, de, it -
 * every string from one labels object, including spoken times, errors and the keyboard help.
 * The second player passes the Spanish set (`ANDES_PLAYER_LABELS_ES`) directly.
 */
export const Languages: StoryObj = {
  argTypes: {
    locale: {
      control: 'select',
      options: ['en', 'es', 'pt', 'fr', 'de', 'it'],
    },
  },
  args: { locale: 'pt' },
  render: (args) => ({
    props: {
      sources: SOURCES,
      tracks: CAPTIONS,
      labels: andesPlayerLabelsFor(String(args['locale'])),
      spanish: ANDES_PLAYER_LABELS_ES,
    },
    template: stack(`
      <andes-video-player [sources]="sources" [tracks]="tracks" [labels]="labels" title="Labels" />
      <andes-video-player [sources]="sources" [tracks]="tracks" [labels]="spanish" title="Patrón de prueba" />`),
  }),
};

/** Right-to-left: the bar mirrors, the time axis stays left-to-right. */
export const RightToLeft: Story = {
  render: () => ({
    props: { sources: SOURCES, tracks: CAPTIONS },
    template: `<div dir="rtl" style="width: min(720px, calc(100vw - 2rem));">
      <andes-video-player [sources]="sources" [tracks]="tracks" title="نمط الاختبار" />
    </div>`,
  }),
};

/** Dark theme: menus and the solid skin take the theme's surfaces. */
export const Dark: Story = {
  globals: { theme: 'dark' },
  render: () => ({
    props: { sources: SOURCES, tracks: CAPTIONS },
    template: `
      <div style="display: grid; gap: 1rem; width: min(720px, calc(100vw - 2rem));">
        <andes-video-player [sources]="sources" [tracks]="tracks" title="Glass skin" />
        <andes-video-player [sources]="sources" [tracks]="tracks" skin="solid" title="Solid skin" />
        <andes-video-player audioOnly src="${MEDIA}/sample-audio.m4a" poster="${MEDIA}/cover.jpg" title="Audio card" />
      </div>`,
  }),
};

/**
 * With the system's reduce-motion setting on, overlays fade without scaling, menus and tooltips
 * appear instantly, and background video holds still. The line below reports the setting.
 */
export const ReducedMotion: Story = {
  render: () => ({
    props: {
      sources: SOURCES,
      reduced:
        typeof matchMedia === 'function' &&
        matchMedia('(prefers-reduced-motion: reduce)').matches,
    },
    template: `
      <div style="display: grid; gap: 0.75rem; width: min(720px, calc(100vw - 2rem));">
        <p style="margin: 0; font-size: 0.875rem;">Reduce motion is {{ reduced ? 'on' : 'off' }} on this system.</p>
        <andes-video-player [sources]="sources" title="Reduced motion" />
        <andes-video-player background [sources]="sources" aspectRatio="21/9" />
      </div>`,
  }),
};

/**
 * Theme playground: every look comes from `--andes-video-*` variables. Change the accent,
 * radius, big play size and caption variables from the controls.
 */
export const ThemePlayground: StoryObj = {
  argTypes: {
    accent: { control: 'color' },
    radius: { control: 'text' },
    bigPlaySize: { control: 'text' },
    captionsColor: { control: 'color' },
    captionsBackground: { control: 'color' },
    skin: { control: 'select', options: ['glass', 'solid'] },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
  },
  args: {
    accent: '#e11d48',
    radius: '1rem',
    bigPlaySize: '5rem',
    captionsColor: '#fde047',
    captionsBackground: 'rgb(0 0 0 / 0.6)',
    skin: 'glass',
    size: 'md',
  },
  render: (args) => ({
    props: { ...args, sources: SOURCES, tracks: CAPTIONS },
    template: frame(`
      <andes-video-player
        [sources]="sources"
        [tracks]="tracks"
        [skin]="skin"
        [size]="size"
        title="Theme playground"
        [style.--andes-video-accent]="accent"
        [style.--andes-video-radius]="radius"
        [style.--andes-video-big-play-size]="bigPlaySize"
        [style.--andes-video-captions-color]="captionsColor"
        [style.--andes-video-captions-background]="captionsBackground"
      />`),
  }),
};
